#!/bin/bash

# Therapist API Tests
# Tests for therapist profile, availability, and bookings endpoints

source "$(dirname "$0")/test-utils.sh"

echo "=========================================="
echo "THERAPIST API TESTS"
echo "=========================================="

# First, we need to register and login to get a therapist ID and auth token
echo "Setting up test therapist..."
timestamp=$(date +%s)
setup_result=$(make_api_call "POST" "/auth/register" '{
    "email": "therapist-test-'$timestamp'@example.com",
    "password": "password123",
    "name": "Test Therapist",
    "specialization": "Massage Therapy",
    "bio": "Test bio for testing"
}' "201")

if echo "$setup_result" | grep -q "PASS"; then
    THERAPIST_ID=$(extract_therapist_id "$setup_result")
    echo "Therapist ID: $THERAPIST_ID"
else
    echo "Failed to setup test therapist"
    exit 1
fi

# Login to get auth token
login_result=$(make_api_call "POST" "/auth/login" '{
    "email": "therapist-test-'$timestamp'@example.com",
    "password": "password123"
}' "200")

if echo "$login_result" | grep -q "PASS"; then
    AUTH_TOKEN=$(extract_token "$login_result")
    echo "Auth token obtained"
else
    echo "Failed to login test therapist"
    exit 1
fi

# Test 1: Get therapist profile
echo "Testing get therapist profile..."
result=$(make_api_call "GET" "/therapist/$THERAPIST_ID/profile" "" "200")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Get Therapist Profile" "PASS" "Profile retrieved successfully"
else
    print_test_result "Get Therapist Profile" "FAIL" "$result"
fi

# Test 2: Get therapist profile with invalid ID
echo "Testing get therapist profile with invalid ID..."
result=$(make_api_call "GET" "/therapist/invalid-id/profile" "" "404")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Get Invalid Therapist Profile" "PASS" "Correctly returned 404 for invalid ID"
else
    print_test_result "Get Invalid Therapist Profile" "FAIL" "$result"
fi

# Test 3: Get therapist availability
echo "Testing get therapist availability..."
# Get availability for next week
start_date=$(date -v+1d +%Y-%m-%d)
end_date=$(date -v+7d +%Y-%m-%d)

result=$(make_api_call "GET" "/therapist/$THERAPIST_ID/availability?startDate=$start_date&endDate=$end_date" "" "200")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Get Therapist Availability" "PASS" "Availability retrieved successfully"
else
    print_test_result "Get Therapist Availability" "FAIL" "$result"
fi

# Test 4: Get availability without date range
echo "Testing get availability without date range..."
result=$(make_api_call "GET" "/therapist/$THERAPIST_ID/availability" "" "400")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Get Availability Missing Dates" "PASS" "Correctly rejected request without date range"
else
    print_test_result "Get Availability Missing Dates" "FAIL" "$result"
fi

# Test 5: Update therapist availability
echo "Testing update therapist availability..."
result=$(make_api_call "PUT" "/therapist/availability" '{
    "weeklyAvailability": [
        {
            "day": 1,
            "startTime": "09:00",
            "endTime": "17:00"
        },
        {
            "day": 2,
            "startTime": "09:00",
            "endTime": "17:00"
        }
    ],
    "blockedSlots": []
}' "200" "$AUTH_TOKEN")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Update Therapist Availability" "PASS" "Availability updated successfully"
else
    print_test_result "Update Therapist Availability" "FAIL" "$result"
fi

# Test 6: Update availability without auth token
echo "Testing update availability without auth..."
result=$(make_api_call "PUT" "/therapist/availability" '{
    "weeklyAvailability": []
}' "401")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Update Availability Unauthorized" "PASS" "Correctly rejected unauthorized request"
else
    print_test_result "Update Availability Unauthorized" "FAIL" "$result"
fi

# Test 7: Get therapist bookings
echo "Testing get therapist bookings..."
result=$(make_api_call "GET" "/therapist/bookings" "" "200" "$AUTH_TOKEN")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Get Therapist Bookings" "PASS" "Bookings retrieved successfully"
else
    print_test_result "Get Therapist Bookings" "FAIL" "$result"
fi

# Test 8: Get bookings without auth token
echo "Testing get bookings without auth..."
result=$(make_api_call "GET" "/therapist/bookings" "" "401")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Get Bookings Unauthorized" "PASS" "Correctly rejected unauthorized request"
else
    print_test_result "Get Bookings Unauthorized" "FAIL" "$result"
fi

echo ""
echo "Therapist API tests completed!"
