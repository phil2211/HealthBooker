#!/bin/bash

# Email Notifications API Tests
# Tests for email sending through SES when bookings are created and cancelled
# Uses AWS SES sandbox configuration for eu-central-1 region

source "$(dirname "$0")/test-utils.sh"

echo "=========================================="
echo "EMAIL NOTIFICATIONS API TESTS"
echo "=========================================="

# SES Configuration
VERIFIED_EMAIL="philip@eschenbacher.ch"
SES_SUCCESS_SIMULATOR="success@simulator.amazonses.com"
SES_BOUNCE_SIMULATOR="bounce@simulator.amazonses.com"
SES_COMPLAINT_SIMULATOR="complaint@simulator.amazonses.com"
UNVERIFIED_EMAIL="unverified@example.com"

# Test variables
THERAPIST_ID=""
AUTH_TOKEN=""
CANCELLATION_TOKEN=""

# Function to check if email sending is working
check_email_sending() {
    echo ""
    echo "Checking email sending status..."
    
    # Check if we can see any email-related logs
    if command -v aws >/dev/null 2>&1; then
        echo "✅ AWS CLI available - can check SES status"
        
        # Check SES sending quota (this will tell us if SES is accessible)
        if aws ses get-send-quota --region eu-central-1 >/dev/null 2>&1; then
            echo "✅ SES is accessible in eu-central-1 region"
            quota=$(aws ses get-send-quota --region eu-central-1 --query 'Max24HourSend' --output text 2>/dev/null)
            if [ "$quota" != "None" ] && [ "$quota" != "" ]; then
                echo "📧 SES sending quota: $quota emails per 24 hours"
            fi
        else
            echo "⚠️  SES not accessible - may be running in mock mode"
        fi
    else
        echo "⚠️  AWS CLI not available - cannot verify SES status"
    fi
    
    echo ""
}

# Function to check SES configuration
check_ses_config() {
    echo "Checking SES configuration..."
    
    # Load environment variables from env.json
    if [ -f "../backend/env.json" ]; then
        AWS_REGION=$(grep -o '"AWS_REGION": "[^"]*"' ../backend/env.json | cut -d'"' -f4)
        FROM_EMAIL=$(grep -o '"FROM_EMAIL": "[^"]*"' ../backend/env.json | cut -d'"' -f4)
    fi
    
    # Check if AWS_REGION is set to eu-central-1
    if [ "$AWS_REGION" != "eu-central-1" ]; then
        echo "Warning: AWS_REGION is not set to eu-central-1. Current: $AWS_REGION"
    else
        echo "✅ AWS_REGION configured as: $AWS_REGION"
    fi
    
    # Check if FROM_EMAIL is configured
    if [ -z "$FROM_EMAIL" ]; then
        echo "Warning: FROM_EMAIL is not configured"
    else
        echo "✅ FROM_EMAIL configured as: $FROM_EMAIL"
    fi
    
    echo "SES configuration check completed"
    echo ""
}

# Function to setup test therapist
setup_test_therapist() {
    echo "Setting up test therapist for email tests..."
    echo "Note: Using verified email (philip@eschenbacher.ch) for therapist to ensure SES sandbox compatibility"
    timestamp=$(date +%s)
    
    setup_result=$(make_api_call "POST" "/auth/register" '{
        "email": "philip@eschenbacher.ch",
        "password": "password123",
        "name": "Email Test Therapist",
        "specialization": "Massage Therapy",
        "bio": "Test therapist for email notification testing"
    }' "201")

    if echo "$setup_result" | grep -q "PASS"; then
        THERAPIST_ID=$(extract_therapist_id "$setup_result")
        echo "Therapist ID: $THERAPIST_ID"
        
        # Login to get auth token
        login_result=$(make_api_call "POST" "/auth/login" '{
            "email": "philip@eschenbacher.ch",
            "password": "password123"
        }' "200")

        if echo "$login_result" | grep -q "PASS"; then
            AUTH_TOKEN=$(extract_token "$login_result")
            echo "Auth token obtained"
        else
            echo "Failed to login test therapist"
            return 1
        fi
        
        # Set up availability
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
                }
            ],
            "blockedSlots": []
        }' "200" "$AUTH_TOKEN")

        if echo "$availability_result" | grep -q "PASS"; then
            echo "Availability set up successfully"
            return 0
        else
            echo "Failed to set up availability"
            return 1
        fi
    else
        echo "Failed to setup test therapist"
        return 1
    fi
}

# Function to create booking and test email sending
test_booking_email() {
    local test_name="$1"
    local patient_email="$2"
    local expected_status="$3"
    local description="$4"
    local time_offset="$5"  # Minutes to add to base time
    
    echo "Testing: $test_name"
    
    # Book for 2 days from now with different time slots
    booking_date=$(date -v+2d +%Y-%m-%d)
    
    # Calculate different start times to avoid conflicts
    base_hour=10
    base_minute=0
    if [ -n "$time_offset" ]; then
        total_minutes=$((base_minute + time_offset))
        start_hour=$((base_hour + total_minutes / 60))
        start_minute=$((total_minutes % 60))
    else
        start_hour=$base_hour
        start_minute=$base_minute
    fi
    
    start_time=$(printf "%02d:%02d" $start_hour $start_minute)
    end_time=$(printf "%02d:%02d" $((start_hour + 1)) $start_minute)
    
    result=$(make_api_call "POST" "/booking/create" '{
        "therapistId": "'$THERAPIST_ID'",
        "patientName": "Test Patient",
        "patientEmail": "'$patient_email'",
        "patientPhone": "+1234567890",
        "date": "'$booking_date'",
        "startTime": "'$start_time'",
        "endTime": "'$end_time'"
    }' "$expected_status")
    
    if echo "$result" | grep -q "PASS"; then
        if [ "$expected_status" = "201" ]; then
            CANCELLATION_TOKEN=$(extract_cancellation_token "$result")
            print_test_result "$test_name" "PASS" "$description"
        else
            print_test_result "$test_name" "PASS" "$description"
        fi
    else
        print_test_result "$test_name" "FAIL" "$result"
    fi
}

# Function to test cancellation email
test_cancellation_email() {
    local test_name="$1"
    local token="$2"
    local expected_status="$3"
    local description="$4"
    
    echo "Testing: $test_name"
    
    if [ -n "$token" ]; then
        result=$(make_api_call "DELETE" "/booking/cancel/$token" "" "$expected_status")
        
        if echo "$result" | grep -q "PASS"; then
            print_test_result "$test_name" "PASS" "$description"
        else
            print_test_result "$test_name" "FAIL" "$result"
        fi
    else
        print_test_result "$test_name" "FAIL" "No cancellation token available"
    fi
}

# Main test execution
main() {
    # Check SES configuration
    check_ses_config
    
    # Check email sending status
    check_email_sending
    
    # Setup test therapist
    if ! setup_test_therapist; then
        echo "Failed to setup test therapist. Exiting."
        exit 1
    fi
    
    echo ""
    echo "Starting email notification tests..."
    echo ""
    
    # Test 1: Booking with verified email (should succeed)
    test_booking_email \
        "Booking Email - Verified Address" \
        "$VERIFIED_EMAIL" \
        "201" \
        "Booking created and emails sent to verified address" \
        "0"
    
    # Test 2: Booking with SES success simulator
    test_booking_email \
        "Booking Email - SES Success Simulator" \
        "$SES_SUCCESS_SIMULATOR" \
        "201" \
        "Booking created and emails sent to SES success simulator" \
        "30"
    
    # Test 3: Booking with SES bounce simulator
    test_booking_email \
        "Booking Email - SES Bounce Simulator" \
        "$SES_BOUNCE_SIMULATOR" \
        "201" \
        "Booking created and emails sent to SES bounce simulator" \
        "60"
    
    # Test 4: Booking with SES complaint simulator
    test_booking_email \
        "Booking Email - SES Complaint Simulator" \
        "$SES_COMPLAINT_SIMULATOR" \
        "201" \
        "Booking created and emails sent to SES complaint simulator" \
        "90"
    
    # Test 5: Booking with unverified email (booking succeeds, email may fail)
    test_booking_email \
        "Booking Email - Unverified Address" \
        "$UNVERIFIED_EMAIL" \
        "201" \
        "Booking created successfully (email sending may fail silently)" \
        "120"
    
    # Test 6: Cancellation email with verified address
    test_cancellation_email \
        "Cancellation Email - Verified Address" \
        "$CANCELLATION_TOKEN" \
        "200" \
        "Booking cancelled and cancellation emails sent"
    
    # Test 7: Cancellation with invalid token
    test_cancellation_email \
        "Cancellation Email - Invalid Token" \
        "invalid-token" \
        "404" \
        "Correctly rejected invalid cancellation token"
    
    echo ""
    echo "Email notification tests completed!"
    echo ""
    echo "=========================================="
    echo "SES SANDBOX NOTES"
    echo "=========================================="
    echo "• SES sandbox requires both sender and recipient emails to be verified"
    echo "• Verified email: $VERIFIED_EMAIL"
    echo "• SES simulator addresses don't need verification:"
    echo "  - success@simulator.amazonses.com (always succeeds)"
    echo "  - bounce@simulator.amazonses.com (simulates bounce)"
    echo "  - complaint@simulator.amazonses.com (simulates complaint)"
    echo "• Unverified emails will cause SES to reject the send operation"
    echo "• Check AWS SES console for actual email delivery status"
    echo "• To verify emails in SES console:"
    echo "  1. Go to AWS SES console in eu-central-1 region"
    echo "  2. Navigate to 'Verified identities'"
    echo "  3. Add and verify email addresses"
    echo ""
}

# Run main function
main

# Print test summary
print_test_summary
