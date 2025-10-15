#!/bin/bash

# Test for future booking data protection
# This test creates future bookings and verifies no personal data is exposed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3001"

echo "🔒 Testing Future Booking Data Protection"
echo "========================================="
echo ""

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
    
    local response
    if response=$(eval "$test_command" 2>&1); then
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

# Test 1: Check availability for future dates
echo "📋 Test 1: Future Availability Check"
run_test "Future availability" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2025-01-15&endDate=2025-01-20'" "" "false"

# Test 2: Create a future test booking
echo "📋 Test 2: Creating Future Test Booking"
FUTURE_DATE="2025-01-15"
BOOKING_DATA='{
    "therapistId": "'$THERAPIST_ID'",
    "patientName": "Future Test Patient",
    "patientEmail": "future.test@example.com",
    "patientPhone": "555-999-8888",
    "date": "'$FUTURE_DATE'",
    "startTime": "10:00",
    "endTime": "11:00"
}'

echo "Creating future booking with test data..."
BOOKING_RESPONSE=$(curl -s -X POST "$API_BASE/booking/create" \
    -H "Content-Type: application/json" \
    -d "$BOOKING_DATA" 2>/dev/null || echo "")

if [ -n "$BOOKING_RESPONSE" ]; then
    echo "Booking response: $BOOKING_RESPONSE"
    
    # Check if booking was created successfully
    if echo "$BOOKING_RESPONSE" | grep -q "error"; then
        echo "⚠️  Future booking creation failed: $BOOKING_RESPONSE"
    else
        echo "✅ Future test booking created successfully"
        
        # Extract cancellation token if available
        CANCELLATION_TOKEN=$(echo "$BOOKING_RESPONSE" | jq -r '.cancellationToken' 2>/dev/null || echo "")
        if [ -n "$CANCELLATION_TOKEN" ] && [ "$CANCELLATION_TOKEN" != "null" ]; then
            echo "✅ Got cancellation token: $CANCELLATION_TOKEN"
        fi
    fi
else
    echo "⚠️  No response from future booking creation"
fi

# Test 3: Check availability after creating future booking
echo "📋 Test 3: Post-Booking Future Availability Check"
run_test "Future availability after booking" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2025-01-15&endDate=2025-01-20'" "" "false"

# Test 4: Detailed analysis of future availability response
echo "📋 Test 4: Future Booking Data Analysis"
FUTURE_AVAILABILITY_RESPONSE=$(curl -s "$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2025-01-15&endDate=2025-01-20" 2>/dev/null || echo "")

if [ -n "$FUTURE_AVAILABILITY_RESPONSE" ]; then
    echo "Analyzing future availability response for personal data..."
    
    # Check for specific personal data fields
    run_test "No patientName in future response" "echo '$FUTURE_AVAILABILITY_RESPONSE'" "patientName" "false"
    run_test "No patientEmail in future response" "echo '$FUTURE_AVAILABILITY_RESPONSE'" "patientEmail" "false"
    run_test "No patientPhone in future response" "echo '$FUTURE_AVAILABILITY_RESPONSE'" "patientPhone" "false"
    run_test "No email addresses in future response" "echo '$FUTURE_AVAILABILITY_RESPONSE'" "@.*\\.(com|de|org|net)" "false"
    run_test "No phone numbers in future response" "echo '$FUTURE_AVAILABILITY_RESPONSE'" "[0-9]{3}[-.][0-9]{3}[-.][0-9]{4}" "false"
    
    # Check for booked slots in future
    BOOKED_SLOTS=$(echo "$FUTURE_AVAILABILITY_RESPONSE" | jq -r '.slots[] | select(.status == "booked")' 2>/dev/null || echo "")
    
    if [ -n "$BOOKED_SLOTS" ] && [ "$BOOKED_SLOTS" != "null" ]; then
        echo "Found future booked slots, analyzing structure..."
        
        # Save booked slots to file for analysis
        echo "$BOOKED_SLOTS" | jq -r '.' > /tmp/future_booked_slots.json
        
        # Check structure
        run_test "Future booked slots have bookingId" "jq -r '.bookingId' /tmp/future_booked_slots.json" "null" "false"
        run_test "Future booked slots have no patientName" "jq -r '.patientName' /tmp/future_booked_slots.json" "null" "true"
        run_test "Future booked slots have no patientEmail" "jq -r '.patientEmail' /tmp/future_booked_slots.json" "null" "true"
        run_test "Future booked slots have no patientPhone" "jq -r '.patientPhone' /tmp/future_booked_slots.json" "null" "true"
        
        # Check that only safe fields are present
        SAFE_FIELDS=$(jq -r 'keys[]' /tmp/future_booked_slots.json | grep -vE "^(date|startTime|endTime|status|bookingId|sessionStartTime|sessionEndTime)$" || echo "")
        if [ -n "$SAFE_FIELDS" ]; then
            echo "❌ FAIL: Future booked slots contain unexpected fields: $SAFE_FIELDS"
            ((TESTS_FAILED++))
        else
            echo "✅ PASS: Future booked slots contain only safe fields"
            ((TESTS_PASSED++))
        fi
        
        rm -f /tmp/future_booked_slots.json
    else
        echo "ℹ️  No future booked slots found in the response"
    fi
else
    echo "⚠️  No future availability response received"
fi

# Test 5: Test booking details endpoint (should only be accessible via token)
echo "📋 Test 5: Booking Details Endpoint Protection"
if [ -n "$CANCELLATION_TOKEN" ] && [ "$CANCELLATION_TOKEN" != "null" ]; then
    run_test "Booking details with valid token" "curl -s '$API_BASE/booking/details/$CANCELLATION_TOKEN'" "" "false"
    
    # Check that booking details contain personal data (this is correct - patient accessing their own booking)
    BOOKING_DETAILS_RESPONSE=$(curl -s "$API_BASE/booking/details/$CANCELLATION_TOKEN" 2>/dev/null || echo "")
    if echo "$BOOKING_DETAILS_RESPONSE" | grep -q "patientName"; then
        echo "✅ PASS: Booking details contain personal data (correct for patient access)"
        ((TESTS_PASSED++))
    else
        echo "ℹ️  Booking details response doesn't contain personal data"
    fi
else
    echo "⚠️  No cancellation token available for booking details test"
fi

# Test 6: Test unauthorized access to booking details
echo "📋 Test 6: Unauthorized Booking Details Access"
run_test "Booking details with invalid token" "curl -s '$API_BASE/booking/details/invalid-token'" "" "false"

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo "✅ Tests Passed: $TESTS_PASSED"
echo "❌ Tests Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! No personal data leakage detected in future booking overviews.${NC}"
    echo "✅ Data protection is working correctly for all future booking scenarios."
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the results above.${NC}"
    exit 1
fi
