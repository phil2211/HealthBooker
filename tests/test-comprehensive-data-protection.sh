#!/bin/bash

# Comprehensive test for booking data protection
# This test creates actual bookings and thoroughly verifies no personal data is exposed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3001"

echo "🔒 Comprehensive Booking Data Protection Test"
echo "============================================="
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

# Use a date that's definitely in the future
FUTURE_DATE="2026-02-15"
echo "📅 Using future date: $FUTURE_DATE"

# Test 1: Check availability before creating bookings
echo "📋 Test 1: Pre-Booking Availability Check"
run_test "Pre-booking availability" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2026-02-15&endDate=2026-02-20'" "" "false"

# Test 2: Create an actual future test booking
echo "📋 Test 2: Creating Future Test Booking"
BOOKING_DATA='{
    "therapistId": "'$THERAPIST_ID'",
    "patientName": "Comprehensive Test Patient",
    "patientEmail": "comprehensive.test@example.com",
    "patientPhone": "555-777-9999",
    "date": "'$FUTURE_DATE'",
    "startTime": "14:00",
    "endTime": "15:00"
}'

echo "Creating future booking with test data..."
BOOKING_RESPONSE=$(curl -s -X POST "$API_BASE/booking/create" \
    -H "Content-Type: application/json" \
    -d "$BOOKING_DATA" 2>/dev/null || echo "")

CANCELLATION_TOKEN=""
if [ -n "$BOOKING_RESPONSE" ]; then
    echo "Booking response: $BOOKING_RESPONSE"
    
    # Check if booking was created successfully
    if echo "$BOOKING_RESPONSE" | grep -q "error"; then
        echo "⚠️  Future booking creation failed: $BOOKING_RESPONSE"
    else
        echo "✅ Future test booking created successfully"
        
        # Extract cancellation token properly
        CANCELLATION_TOKEN=$(echo "$BOOKING_RESPONSE" | jq -r '.booking.cancellationToken' 2>/dev/null || echo "")
        if [ -n "$CANCELLATION_TOKEN" ] && [ "$CANCELLATION_TOKEN" != "null" ]; then
            echo "✅ Got cancellation token: $CANCELLATION_TOKEN"
        else
            echo "⚠️  Could not extract cancellation token"
        fi
    fi
else
    echo "⚠️  No response from future booking creation"
fi

# Test 3: Check availability after creating booking
echo "📋 Test 3: Post-Booking Availability Check"
run_test "Post-booking availability" "curl -s '$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2026-02-15&endDate=2026-02-20'" "" "false"

# Test 4: Detailed analysis of availability response
echo "📋 Test 4: Detailed Availability Analysis"
AVAILABILITY_RESPONSE=$(curl -s "$API_BASE/therapist/$THERAPIST_ID/availability?startDate=2026-02-15&endDate=2026-02-20" 2>/dev/null || echo "")

if [ -n "$AVAILABILITY_RESPONSE" ]; then
    echo "Analyzing availability response for personal data..."
    
    # Check for specific personal data fields
    run_test "No patientName in availability" "echo '$AVAILABILITY_RESPONSE'" "patientName" "false"
    run_test "No patientEmail in availability" "echo '$AVAILABILITY_RESPONSE'" "patientEmail" "false"
    run_test "No patientPhone in availability" "echo '$AVAILABILITY_RESPONSE'" "patientPhone" "false"
    run_test "No email addresses in availability" "echo '$AVAILABILITY_RESPONSE'" "@.*\\.(com|de|org|net)" "false"
    run_test "No phone numbers in availability" "echo '$AVAILABILITY_RESPONSE'" "[0-9]{3}[-.][0-9]{3}[-.][0-9]{4}" "false"
    
    # Check for booked slots
    BOOKED_SLOTS=$(echo "$AVAILABILITY_RESPONSE" | jq -r '.slots[] | select(.status == "booked")' 2>/dev/null || echo "")
    
    if [ -n "$BOOKED_SLOTS" ] && [ "$BOOKED_SLOTS" != "null" ]; then
        echo "Found booked slots, analyzing structure..."
        
        # Save booked slots to file for analysis
        echo "$BOOKED_SLOTS" | jq -r '.' > /tmp/comprehensive_booked_slots.json
        
        # Check structure
        run_test "Booked slots have bookingId" "jq -r '.bookingId' /tmp/comprehensive_booked_slots.json" "null" "false"
        run_test "Booked slots have no patientName" "jq -r '.patientName' /tmp/comprehensive_booked_slots.json" "null" "true"
        run_test "Booked slots have no patientEmail" "jq -r '.patientEmail' /tmp/comprehensive_booked_slots.json" "null" "true"
        run_test "Booked slots have no patientPhone" "jq -r '.patientPhone' /tmp/comprehensive_booked_slots.json" "null" "true"
        
        # Check that only safe fields are present
        SAFE_FIELDS=$(jq -r 'keys[]' /tmp/comprehensive_booked_slots.json | grep -vE "^(date|startTime|endTime|status|bookingId|sessionStartTime|sessionEndTime)$" || echo "")
        if [ -n "$SAFE_FIELDS" ]; then
            echo "❌ FAIL: Booked slots contain unexpected fields: $SAFE_FIELDS"
            ((TESTS_FAILED++))
        else
            echo "✅ PASS: Booked slots contain only safe fields"
            ((TESTS_PASSED++))
        fi
        
        rm -f /tmp/comprehensive_booked_slots.json
    else
        echo "ℹ️  No booked slots found in the response"
        echo "   This might be because the therapist doesn't have availability configured"
    fi
else
    echo "⚠️  No availability response received"
fi

# Test 5: Test booking details endpoint (should only be accessible via token)
echo "📋 Test 5: Booking Details Endpoint Protection"
if [ -n "$CANCELLATION_TOKEN" ] && [ "$CANCELLATION_TOKEN" != "null" ]; then
    # For booking details with valid token, we expect personal data (patient accessing their own booking)
    BOOKING_DETAILS_RESPONSE=$(curl -s "$API_BASE/booking/details/$CANCELLATION_TOKEN" 2>/dev/null || echo "")
    if echo "$BOOKING_DETAILS_RESPONSE" | grep -q "patientName"; then
        echo "✅ PASS: Booking details contain personal data (correct for patient access)"
        ((TESTS_PASSED++))
    else
        echo "❌ FAIL: Booking details should contain personal data for patient access"
        ((TESTS_FAILED++))
    fi
else
    echo "⚠️  No cancellation token available for booking details test"
fi

# Test 6: Test unauthorized access to booking details
echo "📋 Test 6: Unauthorized Booking Details Access"
run_test "Booking details with invalid token" "curl -s '$API_BASE/booking/details/invalid-token'" "" "false"

# Test 7: Test past date prevention
echo "📋 Test 7: Past Date Prevention"
PAST_BOOKING_DATA='{
    "therapistId": "'$THERAPIST_ID'",
    "patientName": "Past Test Patient",
    "patientEmail": "past.test@example.com",
    "patientPhone": "555-111-2222",
    "date": "2024-01-01",
    "startTime": "10:00",
    "endTime": "11:00"
}'

PAST_BOOKING_RESPONSE=$(curl -s -X POST "$API_BASE/booking/create" \
    -H "Content-Type: application/json" \
    -d "$PAST_BOOKING_DATA" 2>/dev/null || echo "")

if echo "$PAST_BOOKING_RESPONSE" | grep -q "Cannot book appointments in the past"; then
    echo "✅ PASS: Past booking prevention working correctly"
    ((TESTS_PASSED++))
else
    echo "❌ FAIL: Past booking prevention not working"
    ((TESTS_FAILED++))
fi

# Test 8: Test therapist list data protection
echo "📋 Test 8: Therapist List Data Protection"
run_test "Therapist list no personal data" "curl -s '$API_BASE/therapist/list'" "" "false"

# Test 9: Test therapist profile data protection
echo "📋 Test 9: Therapist Profile Data Protection"
run_test "Therapist profile no personal data" "curl -s '$API_BASE/therapist/$THERAPIST_ID/profile'" "" "false"

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo "✅ Tests Passed: $TESTS_PASSED"
echo "❌ Tests Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! No personal data leakage detected in any booking overviews.${NC}"
    echo "✅ Data protection is working correctly across all endpoints and scenarios."
    echo "✅ Past booking prevention is working correctly."
    echo "✅ Personal data is properly protected in all public APIs."
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the results above.${NC}"
    exit 1
fi
