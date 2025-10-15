#!/bin/bash

# Booking API Tests
# Tests for booking creation and cancellation endpoints

source "$(dirname "$0")/test-utils.sh"

echo "=========================================="
echo "BOOKING API TESTS"
echo "=========================================="

# First, we need to register a therapist and get their ID
echo "Setting up test therapist for booking tests..."
timestamp=$(date +%s)
setup_result=$(make_api_call "POST" "/auth/register" '{
    "email": "booking-test-'$timestamp'@example.com",
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

# Login to get auth token for updating availability
login_result=$(make_api_call "POST" "/auth/login" '{
    "email": "booking-test-'$timestamp'@example.com",
    "password": "password123"
}' "200")

if echo "$login_result" | grep -q "PASS"; then
    AUTH_TOKEN=$(extract_token "$login_result")
    echo "Auth token obtained"
else
    echo "Failed to login test therapist"
    exit 1
fi

# Set up availability for the therapist
echo "Setting up therapist availability..."
availability_result=$(make_api_call "PUT" "/therapist/availability" '{
    "weeklyAvailability": [
        {
            "day": 1,
            "startTime": "09:00",
            "endTime": "12:00"
        },
        {
            "day": 2,
            "startTime": "14:00",
            "endTime": "17:00"
        },
        {
            "day": 3,
            "startTime": "09:00",
            "endTime": "17:00"
        }
    ],
    "blockedSlots": []
}' "200" "$AUTH_TOKEN")

if echo "$availability_result" | grep -q "PASS"; then
    echo "Availability set up successfully"
else
    echo "Failed to set up availability"
    exit 1
fi

# Test 1: Create a booking
echo "Testing create booking..."
# Book for 2 days from now to allow cancellation
booking_date=$(date -v+2d +%Y-%m-%d)

result=$(make_api_call "POST" "/booking/create" '{
    "therapistId": "'$THERAPIST_ID'",
    "patientName": "John Doe",
    "patientEmail": "john.doe@example.com",
    "patientPhone": "+1234567890",
    "date": "'$booking_date'",
    "startTime": "10:00",
    "endTime": "11:00"
}' "201")

if echo "$result" | grep -q "PASS"; then
    CANCELLATION_TOKEN=$(extract_cancellation_token "$result")
    print_test_result "Create Booking" "PASS" "Booking created successfully"
else
    print_test_result "Create Booking" "FAIL" "$result"
fi

# Test 2: Create booking with invalid therapist ID
echo "Testing create booking with invalid therapist ID..."
result=$(make_api_call "POST" "/booking/create" '{
    "therapistId": "invalid-id",
    "patientName": "John Doe",
    "patientEmail": "john.doe@example.com",
    "patientPhone": "+1234567890",
    "date": "'$booking_date'",
    "startTime": "10:00",
    "endTime": "11:00"
}' "404")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Create Booking Invalid Therapist" "PASS" "Correctly rejected invalid therapist ID"
else
    print_test_result "Create Booking Invalid Therapist" "FAIL" "$result"
fi

# Test 3: Create booking with missing fields
echo "Testing create booking with missing fields..."
result=$(make_api_call "POST" "/booking/create" '{
    "therapistId": "'$THERAPIST_ID'",
    "patientName": "John Doe"
}' "400")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Create Booking Missing Fields" "PASS" "Correctly rejected incomplete booking data"
else
    print_test_result "Create Booking Missing Fields" "FAIL" "$result"
fi

# Test 4: Create booking with invalid email
echo "Testing create booking with invalid email..."
result=$(make_api_call "POST" "/booking/create" '{
    "therapistId": "'$THERAPIST_ID'",
    "patientName": "John Doe",
    "patientEmail": "invalid-email",
    "patientPhone": "+1234567890",
    "date": "'$booking_date'",
    "startTime": "10:00",
    "endTime": "11:00"
}' "400")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Create Booking Invalid Email" "PASS" "Correctly rejected invalid email format"
else
    print_test_result "Create Booking Invalid Email" "FAIL" "$result"
fi

# Test 5: Create duplicate booking (same time slot)
echo "Testing create duplicate booking..."
result=$(make_api_call "POST" "/booking/create" '{
    "therapistId": "'$THERAPIST_ID'",
    "patientName": "Jane Doe",
    "patientEmail": "jane.doe@example.com",
    "patientPhone": "+1234567891",
    "date": "'$booking_date'",
    "startTime": "10:00",
    "endTime": "11:00"
}' "409")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Create Duplicate Booking" "PASS" "Correctly rejected duplicate time slot"
else
    print_test_result "Create Duplicate Booking" "FAIL" "$result"
fi

# Test 6: Cancel booking
echo "Testing cancel booking..."
if [ -n "$CANCELLATION_TOKEN" ]; then
    result=$(make_api_call "DELETE" "/booking/cancel/$CANCELLATION_TOKEN" "" "200")
    
    if echo "$result" | grep -q "PASS"; then
        print_test_result "Cancel Booking" "PASS" "Booking cancelled successfully"
    else
        print_test_result "Cancel Booking" "FAIL" "$result"
    fi
else
    print_test_result "Cancel Booking" "FAIL" "No cancellation token available"
fi

# Test 7: Cancel booking with invalid token
echo "Testing cancel booking with invalid token..."
result=$(make_api_call "DELETE" "/booking/cancel/invalid-token" "" "404")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Cancel Booking Invalid Token" "PASS" "Correctly rejected invalid cancellation token"
else
    print_test_result "Cancel Booking Invalid Token" "FAIL" "$result"
fi

# Test 8: Cancel already cancelled booking
echo "Testing cancel already cancelled booking..."
if [ -n "$CANCELLATION_TOKEN" ]; then
    result=$(make_api_call "DELETE" "/booking/cancel/$CANCELLATION_TOKEN" "" "400")
    
    if echo "$result" | grep -q "PASS"; then
        print_test_result "Cancel Already Cancelled Booking" "PASS" "Correctly rejected cancellation of already cancelled booking"
    else
        print_test_result "Cancel Already Cancelled Booking" "FAIL" "$result"
    fi
else
    print_test_result "Cancel Already Cancelled Booking" "FAIL" "No cancellation token available"
fi

echo ""
echo "Booking API tests completed!"
