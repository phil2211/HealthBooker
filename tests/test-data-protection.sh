#!/bin/bash

# Test script to verify no personal data is exposed in booking overviews
# This test ensures GDPR compliance and data protection

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3001"
TEST_RESULTS_FILE="test-data-protection-results.txt"

echo "🔒 Testing Data Protection in Booking Overviews"
echo "=============================================="
echo ""

# Initialize test results
echo "Data Protection Test Results - $(date)" > $TEST_RESULTS_FILE
echo "=========================================" >> $TEST_RESULTS_FILE
echo "" >> $TEST_RESULTS_FILE

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    local should_contain="$4" # "true" if should contain, "false" if should not contain
    
    echo "🧪 Testing: $test_name"
    echo "Command: $test_command" >> $TEST_RESULTS_FILE
    
    # Run the test command
    local response
    if response=$(eval "$test_command" 2>&1); then
        echo "Response received" >> $TEST_RESULTS_FILE
        echo "$response" >> $TEST_RESULTS_FILE
        echo "" >> $TEST_RESULTS_FILE
        
        # Check if response contains personal data
        local contains_personal_data=false
        
        # Check for common personal data patterns
        if echo "$response" | grep -qiE "(patientName|patientEmail|patientPhone|email|phone|name.*@|@.*\.com|@.*\.de|@.*\.org)" > /dev/null; then
            contains_personal_data=true
        fi
        
        # Check for specific patterns if provided
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
            if [ "$contains_personal_data" = "true" ]; then
                echo "❌ FAIL: $test_name - Personal data detected in response"
                echo "   Detected personal data patterns in response"
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

# Test 1: Therapist List - Should not contain personal data
echo "📋 Test 1: Therapist List API"
run_test "Therapist List" "curl -s '$API_BASE/therapist/list'" "" "false"

# Test 2: Get Therapist Profile - Should not contain personal data
echo "📋 Test 2: Therapist Profile API"
# Get a therapist ID first
THERAPIST_ID=$(curl -s "$API_BASE/therapist/list" | jq -r '.therapists[0].id' 2>/dev/null || echo "")
if [ -n "$THERAPIST_ID" ] && [ "$THERAPIST_ID" != "null" ]; then
    run_test "Therapist Profile" "curl -s '$API_BASE/therapist/$THERAPIST_ID/profile'" "" "false"
else
    echo "⚠️  SKIP: No therapist ID available for profile test"
fi

# Test 3: Availability API - Should not contain personal data in booked slots
echo "📋 Test 3: Availability API (Booked Slots)"
if [ -n "$THERAPIST_ID" ] && [ "$THERAPIST_ID" != "null" ]; then
    # Test with a date range that might have bookings
    run_test "Availability API" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2024-01-01&endDate=2024-12-31'" "" "false"
else
    echo "⚠️  SKIP: No therapist ID available for availability test"
fi

# Test 4: Check specific personal data patterns in availability response
echo "📋 Test 4: Detailed Personal Data Check in Availability"
if [ -n "$THERAPIST_ID" ] && [ "$THERAPIST_ID" != "null" ]; then
    AVAILABILITY_RESPONSE=$(curl -s "$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2024-01-01&endDate=2024-12-31" 2>/dev/null || echo "")
    
    if [ -n "$AVAILABILITY_RESPONSE" ]; then
        # Check for specific personal data fields that should NOT be present
        run_test "No patientName in availability" "echo '$AVAILABILITY_RESPONSE'" "patientName" "false"
        run_test "No patientEmail in availability" "echo '$AVAILABILITY_RESPONSE'" "patientEmail" "false"
        run_test "No patientPhone in availability" "echo '$AVAILABILITY_RESPONSE'" "patientPhone" "false"
        run_test "No email addresses in availability" "echo '$AVAILABILITY_RESPONSE'" "@.*\\.(com|de|org|net)" "false"
        run_test "No phone numbers in availability" "echo '$AVAILABILITY_RESPONSE'" "[0-9]{3}[-.][0-9]{3}[-.][0-9]{4}" "false"
    else
        echo "⚠️  SKIP: No availability response received"
    fi
else
    echo "⚠️  SKIP: No therapist ID available for detailed availability test"
fi

# Test 5: Check that booking data is properly structured (should have bookingId but no personal data)
echo "📋 Test 5: Booking Data Structure Validation"
if [ -n "$THERAPIST_ID" ] && [ "$THERAPIST_ID" != "null" ]; then
    AVAILABILITY_RESPONSE=$(curl -s "$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2024-01-01&endDate=2024-12-31" 2>/dev/null || echo "")
    
    if [ -n "$AVAILABILITY_RESPONSE" ]; then
        # Check if booked slots have proper structure without personal data
        BOOKED_SLOTS=$(echo "$AVAILABILITY_RESPONSE" | jq -r '.slots[] | select(.status == "booked")' 2>/dev/null || echo "")
        
        if [ -n "$BOOKED_SLOTS" ] && [ "$BOOKED_SLOTS" != "null" ]; then
            echo "Found booked slots, checking structure..."
            echo "$BOOKED_SLOTS" | jq -r '.' > /tmp/booked_slots.json
            
            # Check that booked slots have required fields but not personal data
            run_test "Booked slots have bookingId" "jq -r '.bookingId' /tmp/booked_slots.json" "null" "false"
            run_test "Booked slots have no patientName" "jq -r '.patientName' /tmp/booked_slots.json" "null" "true"
            run_test "Booked slots have no patientEmail" "jq -r '.patientEmail' /tmp/booked_slots.json" "null" "true"
            run_test "Booked slots have no patientPhone" "jq -r '.patientPhone' /tmp/booked_slots.json" "null" "true"
            
            rm -f /tmp/booked_slots.json
        else
            echo "ℹ️  No booked slots found in current date range"
        fi
    fi
else
    echo "⚠️  SKIP: No therapist ID available for booking structure test"
fi

# Test 6: Test with different date ranges to ensure past/future handling
echo "📋 Test 6: Date Range Testing"
if [ -n "$THERAPIST_ID" ] && [ "$THERAPIST_ID" != "null" ]; then
    # Test past dates
    run_test "Past dates availability" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2023-01-01&endDate=2023-12-31'" "" "false"
    
    # Test future dates
    run_test "Future dates availability" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2025-01-01&endDate=2025-12-31'" "" "false"
    
    # Test current year
    run_test "Current year availability" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2024-01-01&endDate=2024-12-31'" "" "false"
else
    echo "⚠️  SKIP: No therapist ID available for date range testing"
fi

# Test 7: Test error responses don't leak data
echo "📋 Test 7: Error Response Data Leakage"
run_test "Invalid therapist ID" "curl -s '$API_BASE/therapist/invalid-id/availability?startDate=2024-01-01&endDate=2024-12-31'" "" "false"
run_test "Missing parameters" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability'" "" "false"

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
    echo -e "${GREEN}🎉 All tests passed! No personal data leakage detected.${NC}"
    echo "✅ Data protection is working correctly."
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the results above.${NC}"
    echo "📄 Detailed results saved to: $TEST_RESULTS_FILE"
    exit 1
fi
