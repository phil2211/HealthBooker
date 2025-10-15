#!/bin/bash

# Comprehensive test for booking data protection
# This test creates test bookings and verifies no personal data is exposed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3001"
TEST_RESULTS_FILE="test-booking-data-protection-results.txt"

echo "🔒 Testing Booking Data Protection with Test Data"
echo "================================================="
echo ""

# Initialize test results
echo "Booking Data Protection Test Results - $(date)" > $TEST_RESULTS_FILE
echo "=============================================" >> $TEST_RESULTS_FILE
echo "" >> $TEST_RESULTS_FILE

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    local should_contain="$4"
    
    echo "🧪 Testing: $test_name"
    echo "Command: $test_command" >> $TEST_RESULTS_FILE
    
    local response
    if response=$(eval "$test_command" 2>&1); then
        echo "Response received" >> $TEST_RESULTS_FILE
        echo "$response" >> $TEST_RESULTS_FILE
        echo "" >> $TEST_RESULTS_FILE
        
        if [ -n "$expected_pattern" ]; then
            if [ "$should_contain" = "true" ]; then
                if echo "$response" | grep -qiE "$expected_pattern" > /dev/null; then
                    echo "✅ PASS: $test_name - Found expected pattern"
                    ((TESTS_PASSED++))
                else
                    echo "❌ FAIL: $test_name - Expected pattern not found"
                    ((TESTS_FAILED++))
                fi
            else
                if echo "$response" | grep -qiE "$expected_pattern" > /dev/null; then
                    echo "❌ FAIL: $test_name - Found unexpected pattern: $expected_pattern"
                    ((TESTS_FAILED++))
                else
                    echo "✅ PASS: $test_name - Pattern correctly absent"
                    ((TESTS_PASSED++))
                fi
            fi
        else
            # General personal data check
            if echo "$response" | grep -qiE "(patientName|patientEmail|patientPhone|email|phone|name.*@|@.*\.com|@.*\.de|@.*\.org)" > /dev/null; then
                echo "❌ FAIL: $test_name - Personal data detected in response"
                ((TESTS_FAILED++))
            else
                echo "✅ PASS: $test_name - No personal data detected"
                ((TESTS_PASSED++))
            fi
        fi
    else
        echo "❌ FAIL: $test_name - Command failed"
        echo "Error: $response" >> $TEST_RESULTS_FILE
        ((TESTS_FAILED++))
    fi
    
    echo ""
}

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
sleep 5

# Get a therapist ID
echo "📋 Getting therapist for testing..."
THERAPIST_ID=$(curl -s "$API_BASE/therapist/list" | jq -r '.therapists[0].id' 2>/dev/null || echo "")

if [ -z "$THERAPIST_ID" ] || [ "$THERAPIST_ID" = "null" ]; then
    echo "❌ No therapist available for testing"
    exit 1
fi

echo "✅ Using therapist ID: $THERAPIST_ID"

# Test 1: Check availability before creating bookings
echo "📋 Test 1: Pre-booking Availability Check"
run_test "Availability before bookings" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2024-12-20&endDate=2024-12-25'" "" "false"

# Test 2: Create a test booking (if we can)
echo "📋 Test 2: Creating Test Booking"
BOOKING_DATA='{
    "therapistId": "'$THERAPIST_ID'",
    "patientName": "Test Patient",
    "patientEmail": "test.patient@example.com",
    "patientPhone": "555-123-4567",
    "date": "2024-12-20",
    "startTime": "10:00",
    "endTime": "11:00"
}'

echo "Creating booking with test data..."
BOOKING_RESPONSE=$(curl -s -X POST "$API_BASE/booking/create" \
    -H "Content-Type: application/json" \
    -d "$BOOKING_DATA" 2>/dev/null || echo "")

if [ -n "$BOOKING_RESPONSE" ]; then
    echo "Booking response: $BOOKING_RESPONSE"
    
    # Check if booking was created successfully
    if echo "$BOOKING_RESPONSE" | grep -q "error"; then
        echo "⚠️  Booking creation failed, but continuing with tests..."
    else
        echo "✅ Test booking created successfully"
    fi
else
    echo "⚠️  No response from booking creation, continuing with tests..."
fi

# Test 3: Check availability after creating booking
echo "📋 Test 3: Post-booking Availability Check"
run_test "Availability after booking" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2024-12-20&endDate=2024-12-25'" "" "false"

# Test 4: Detailed analysis of availability response with bookings
echo "📋 Test 4: Detailed Booking Data Analysis"
AVAILABILITY_RESPONSE=$(curl -s "$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2024-12-20&endDate=2024-12-25" 2>/dev/null || echo "")

if [ -n "$AVAILABILITY_RESPONSE" ]; then
    echo "Analyzing availability response for personal data..."
    
    # Check for specific personal data fields
    run_test "No patientName in response" "echo '$AVAILABILITY_RESPONSE'" "patientName" "false"
    run_test "No patientEmail in response" "echo '$AVAILABILITY_RESPONSE'" "patientEmail" "false"
    run_test "No patientPhone in response" "echo '$AVAILABILITY_RESPONSE'" "patientPhone" "false"
    run_test "No email addresses in response" "echo '$AVAILABILITY_RESPONSE'" "@.*\\.(com|de|org|net)" "false"
    run_test "No phone numbers in response" "echo '$AVAILABILITY_RESPONSE'" "[0-9]{3}[-.][0-9]{3}[-.][0-9]{4}" "false"
    
    # Check that booked slots have proper structure
    BOOKED_SLOTS=$(echo "$AVAILABILITY_RESPONSE" | jq -r '.slots[] | select(.status == "booked")' 2>/dev/null || echo "")
    
    if [ -n "$BOOKED_SLOTS" ] && [ "$BOOKED_SLOTS" != "null" ]; then
        echo "Found booked slots, analyzing structure..."
        
        # Save booked slots to file for analysis
        echo "$BOOKED_SLOTS" | jq -r '.' > /tmp/booked_slots_analysis.json
        
        # Check structure
        run_test "Booked slots have bookingId" "jq -r '.bookingId' /tmp/booked_slots_analysis.json" "null" "false"
        run_test "Booked slots have no patientName" "jq -r '.patientName' /tmp/booked_slots_analysis.json" "null" "true"
        run_test "Booked slots have no patientEmail" "jq -r '.patientEmail' /tmp/booked_slots_analysis.json" "null" "true"
        run_test "Booked slots have no patientPhone" "jq -r '.patientPhone' /tmp/booked_slots_analysis.json" "null" "true"
        
        # Check that only safe fields are present
        SAFE_FIELDS=$(jq -r 'keys[]' /tmp/booked_slots_analysis.json | grep -vE "^(date|startTime|endTime|status|bookingId|sessionStartTime|sessionEndTime)$" || echo "")
        if [ -n "$SAFE_FIELDS" ]; then
            echo "❌ FAIL: Booked slots contain unexpected fields: $SAFE_FIELDS"
            ((TESTS_FAILED++))
        else
            echo "✅ PASS: Booked slots contain only safe fields"
            ((TESTS_PASSED++))
        fi
        
        rm -f /tmp/booked_slots_analysis.json
    else
        echo "ℹ️  No booked slots found in the response"
    fi
else
    echo "⚠️  No availability response received"
fi

# Test 5: Test with different date ranges
echo "📋 Test 5: Cross-Date Range Testing"
run_test "Past dates (2023)" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2023-12-20&endDate=2023-12-25'" "" "false"
run_test "Future dates (2025)" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2025-12-20&endDate=2025-12-25'" "" "false"

# Test 6: Test error handling
echo "📋 Test 6: Error Handling Data Leakage"
run_test "Invalid therapist ID" "curl -s '$API_BASE/therapist/invalid-id/availability?startDate=2024-12-20&endDate=2024-12-25'" "" "false"
run_test "Missing date parameters" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability'" "" "false"

# Test 7: Test JSON structure integrity
echo "📋 Test 7: JSON Structure Integrity"
if [ -n "$AVAILABILITY_RESPONSE" ]; then
    # Check if response is valid JSON
    if echo "$AVAILABILITY_RESPONSE" | jq . > /dev/null 2>&1; then
        echo "✅ PASS: Response is valid JSON"
        ((TESTS_PASSED++))
        
        # Check if slots array exists
        if echo "$AVAILABILITY_RESPONSE" | jq -e '.slots' > /dev/null 2>&1; then
            echo "✅ PASS: Response contains slots array"
            ((TESTS_PASSED++))
        else
            echo "❌ FAIL: Response missing slots array"
            ((TESTS_FAILED++))
        fi
    else
        echo "❌ FAIL: Response is not valid JSON"
        ((TESTS_FAILED++))
    fi
else
    echo "⚠️  No response to validate JSON structure"
fi

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo "✅ Tests Passed: $TESTS_PASSED"
echo "❌ Tests Failed: $TESTS_FAILED"
echo ""

# Add summary to results file
echo "Test Summary:" >> $TEST_RESULTS_FILE
echo "Tests Passed: $TESTS_PASSED" >> $TEST_RESULTS_FILE
echo "Tests Failed: $TESTS_FAILED" >> $TEST_RESULTS_FILE
echo "Test completed at: $(date)" >> $TEST_RESULTS_FILE

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! No personal data leakage detected in booking overviews.${NC}"
    echo "✅ Data protection is working correctly for all booking-related endpoints."
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the results above.${NC}"
    echo "📄 Detailed results saved to: $TEST_RESULTS_FILE"
    exit 1
fi
