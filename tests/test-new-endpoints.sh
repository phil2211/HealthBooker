#!/bin/bash

# New API Endpoints Tests
# Tests for list therapists, get booking details, update booking, and enhanced availability endpoints

source "$(dirname "$0")/test-utils.sh"

echo "=========================================="
echo "NEW API ENDPOINTS TESTS"
echo "=========================================="

# Setup: Create test therapists and bookings
echo "Setting up test data..."

# Create first therapist
timestamp=$(date +%s)
setup_result1=$(make_api_call "POST" "/auth/register" '{
    "email": "therapist1-'$timestamp'@example.com",
    "password": "password123",
    "name": "Dr. Smith",
    "specialization": "Physical Therapy",
    "bio": "Experienced physical therapist"
}' "201")

if echo "$setup_result1" | grep -q "PASS"; then
    THERAPIST1_ID=$(extract_therapist_id "$setup_result1")
    echo "Therapist 1 ID: $THERAPIST1_ID"
else
    echo "Failed to setup therapist 1"
    exit 1
fi

# Create second therapist
setup_result2=$(make_api_call "POST" "/auth/register" '{
    "email": "therapist2-'$timestamp'@example.com",
    "password": "password123",
    "name": "Dr. Johnson",
    "specialization": "Massage Therapy",
    "bio": "Licensed massage therapist"
}' "201")

if echo "$setup_result2" | grep -q "PASS"; then
    THERAPIST2_ID=$(extract_therapist_id "$setup_result2")
    echo "Therapist 2 ID: $THERAPIST2_ID"
else
    echo "Failed to setup therapist 2"
    exit 1
fi

# Login to get auth token for setting availability
login_result=$(make_api_call "POST" "/auth/login" '{
    "email": "therapist1-'$timestamp'@example.com",
    "password": "password123"
}' "200")

if echo "$login_result" | grep -q "PASS"; then
    AUTH_TOKEN=$(extract_token "$login_result")
    echo "Auth token obtained"
else
    echo "Failed to login therapist 1"
    exit 1
fi

# Set up availability for therapist 1 (Monday through Saturday)
echo "Setting up therapist 1 availability..."
availability_result=$(make_api_call "PUT" "/therapist/availability" '{
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
        },
        {
            "day": 3,
            "startTime": "09:00",
            "endTime": "17:00"
        },
        {
            "day": 4,
            "startTime": "09:00",
            "endTime": "17:00"
        },
        {
            "day": 5,
            "startTime": "09:00",
            "endTime": "17:00"
        },
        {
            "day": 6,
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

# Create a booking for testing
booking_date=$(date -v+2d +%Y-%m-%d)
booking_result=$(make_api_call "POST" "/booking/create" '{
    "therapistId": "'$THERAPIST1_ID'",
    "patientName": "John Doe",
    "patientEmail": "john.doe@example.com",
    "patientPhone": "+1234567890",
    "date": "'$booking_date'",
    "startTime": "10:00",
    "endTime": "11:00"
}' "201")

if echo "$booking_result" | grep -q "PASS"; then
    CANCELLATION_TOKEN=$(extract_cancellation_token "$booking_result")
    echo "Test booking created with token: $CANCELLATION_TOKEN"
else
    echo "Failed to create test booking"
    exit 1
fi

# Test 1: List Therapists
echo "Testing list therapists endpoint..."
result=$(make_api_call "GET" "/therapist/list" "" "200")

if echo "$result" | grep -q "PASS"; then
    # Check if response contains both therapists
    if echo "$result" | grep -q "Dr. Smith" && echo "$result" | grep -q "Dr. Johnson"; then
        print_test_result "List Therapists" "PASS" "Successfully retrieved all therapists"
    else
        print_test_result "List Therapists" "FAIL" "Response missing expected therapists"
    fi
else
    print_test_result "List Therapists" "FAIL" "$result"
fi

# Test 2: Get Booking Details
echo "Testing get booking details endpoint..."
if [ -n "$CANCELLATION_TOKEN" ]; then
    result=$(make_api_call "GET" "/booking/details/$CANCELLATION_TOKEN" "" "200")
    
    if echo "$result" | grep -q "PASS"; then
        # Check if response contains booking and therapist info
        if echo "$result" | grep -q "John Doe" && echo "$result" | grep -q "Dr. Smith"; then
            print_test_result "Get Booking Details" "PASS" "Successfully retrieved booking details"
        else
            print_test_result "Get Booking Details" "FAIL" "Response missing expected booking/therapist info"
        fi
    else
        print_test_result "Get Booking Details" "FAIL" "$result"
    fi
else
    print_test_result "Get Booking Details" "FAIL" "No cancellation token available"
fi

# Test 3: Get Booking Details with Invalid Token
echo "Testing get booking details with invalid token..."
result=$(make_api_call "GET" "/booking/details/invalid-token" "" "404")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Get Booking Details Invalid Token" "PASS" "Correctly rejected invalid token"
else
    print_test_result "Get Booking Details Invalid Token" "FAIL" "$result"
fi

# Test 4: Update Booking (Reschedule)
echo "Testing update booking endpoint..."
if [ -n "$CANCELLATION_TOKEN" ]; then
    # Reschedule to a different time slot
    new_booking_date=$(date -v+3d +%Y-%m-%d)
    result=$(make_api_call "PUT" "/booking/update/$CANCELLATION_TOKEN" '{
        "date": "'$new_booking_date'",
        "startTime": "14:00",
        "endTime": "15:00"
    }' "200")
    
    if echo "$result" | grep -q "PASS"; then
        print_test_result "Update Booking" "PASS" "Successfully rescheduled booking"
    else
        print_test_result "Update Booking" "FAIL" "$result"
    fi
else
    print_test_result "Update Booking" "FAIL" "No cancellation token available"
fi

# Test 5: Update Booking with Invalid Token
echo "Testing update booking with invalid token..."
result=$(make_api_call "PUT" "/booking/update/invalid-token" '{
    "date": "'$new_booking_date'",
    "startTime": "14:00",
    "endTime": "15:00"
}' "404")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Update Booking Invalid Token" "PASS" "Correctly rejected invalid token"
else
    print_test_result "Update Booking Invalid Token" "FAIL" "$result"
fi

# Test 6: Update Booking with Missing Fields
echo "Testing update booking with missing fields..."
if [ -n "$CANCELLATION_TOKEN" ]; then
    result=$(make_api_call "PUT" "/booking/update/$CANCELLATION_TOKEN" '{
        "date": "'$new_booking_date'"
    }' "400")
    
    if echo "$result" | grep -q "PASS"; then
        print_test_result "Update Booking Missing Fields" "PASS" "Correctly rejected incomplete data"
    else
        print_test_result "Update Booking Missing Fields" "FAIL" "$result"
    fi
else
    print_test_result "Update Booking Missing Fields" "FAIL" "No cancellation token available"
fi

# Test 7: Enhanced Get Availability (should return all slots with statuses)
echo "Testing enhanced get availability endpoint..."
start_date=$(date -v+2d +%Y-%m-%d)
end_date=$(date -v+4d +%Y-%m-%d)

result=$(make_api_call "GET" "/therapist/$THERAPIST1_ID/availability?startDate=$start_date&endDate=$end_date" "" "200")

if echo "$result" | grep -q "PASS"; then
    # Check if response contains slots with different statuses
    if echo "$result" | grep -q "available" && echo "$result" | grep -q "booked"; then
        print_test_result "Enhanced Get Availability" "PASS" "Successfully returned slots with statuses"
    else
        print_test_result "Enhanced Get Availability" "FAIL" "Response missing expected slot statuses"
    fi
else
    print_test_result "Enhanced Get Availability" "FAIL" "$result"
fi

# Test 8: Get Availability with Invalid Therapist ID
echo "Testing get availability with invalid therapist ID..."
result=$(make_api_call "GET" "/therapist/invalid-id/availability?startDate=$start_date&endDate=$end_date" "" "404")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Get Availability Invalid Therapist" "PASS" "Correctly rejected invalid therapist ID"
else
    print_test_result "Get Availability Invalid Therapist" "FAIL" "$result"
fi

# Test 9: Get Availability with Missing Parameters
echo "Testing get availability with missing parameters..."
result=$(make_api_call "GET" "/therapist/$THERAPIST1_ID/availability" "" "400")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Get Availability Missing Parameters" "PASS" "Correctly rejected missing parameters"
else
    print_test_result "Get Availability Missing Parameters" "FAIL" "$result"
fi

# Test 10: Update Booking to Past Date (should fail)
echo "Testing update booking to past date..."
if [ -n "$CANCELLATION_TOKEN" ]; then
    past_date=$(date -v-1d +%Y-%m-%d)
    result=$(make_api_call "PUT" "/booking/update/$CANCELLATION_TOKEN" '{
        "date": "'$past_date'",
        "startTime": "10:00",
        "endTime": "11:00"
    }' "400")
    
    if echo "$result" | grep -q "PASS"; then
        print_test_result "Update Booking Past Date" "PASS" "Correctly rejected past date"
    else
        print_test_result "Update Booking Past Date" "FAIL" "$result"
    fi
else
    print_test_result "Update Booking Past Date" "FAIL" "No cancellation token available"
fi

# Test 11: Update Booking to Already Booked Slot (should fail)
echo "Testing update booking to already booked slot..."
if [ -n "$CANCELLATION_TOKEN" ]; then
    # Create another booking first to create a conflict
    conflict_booking_result=$(make_api_call "POST" "/booking/create" '{
        "therapistId": "'$THERAPIST1_ID'",
        "patientName": "Jane Doe",
        "patientEmail": "jane.doe@example.com",
        "patientPhone": "+1234567891",
        "date": "'$new_booking_date'",
        "startTime": "15:00",
        "endTime": "16:00"
    }' "201")
    
    # Now try to update the original booking to the same slot as the conflict booking
    result=$(make_api_call "PUT" "/booking/update/$CANCELLATION_TOKEN" '{
        "date": "'$new_booking_date'",
        "startTime": "15:00",
        "endTime": "16:00"
    }' "409")
    
    if echo "$result" | grep -q "PASS"; then
        print_test_result "Update Booking Duplicate Slot" "PASS" "Correctly rejected duplicate slot"
    else
        print_test_result "Update Booking Duplicate Slot" "FAIL" "$result"
    fi
else
    print_test_result "Update Booking Duplicate Slot" "FAIL" "No cancellation token available"
fi

echo ""
echo "New API endpoints tests completed!"
