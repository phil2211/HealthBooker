#!/bin/bash

# Authentication API Tests
# Tests for register, login, and verify endpoints

source "$(dirname "$0")/test-utils.sh"

echo "=========================================="
echo "AUTHENTICATION API TESTS"
echo "=========================================="

# Test 1: Register a new therapist
echo "Testing therapist registration..."
timestamp=$(date +%s)
result=$(make_api_call "POST" "/auth/register" '{
    "email": "test-'$timestamp'@example.com",
    "password": "password123",
    "name": "Test Therapist",
    "specialization": "Massage Therapy",
    "bio": "Test bio for testing"
}' "201")

if echo "$result" | grep -q "PASS"; then
    THERAPIST_ID=$(extract_therapist_id "$result")
    print_test_result "Register Therapist" "PASS" "Therapist registered successfully"
else
    print_test_result "Register Therapist" "FAIL" "$result"
fi

# Test 2: Register duplicate therapist (should fail)
echo "Testing duplicate registration..."
result=$(make_api_call "POST" "/auth/register" '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test Therapist",
    "specialization": "Massage Therapy",
    "bio": "Test bio for testing"
}' "409")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Duplicate Registration" "PASS" "Correctly rejected duplicate email"
else
    print_test_result "Duplicate Registration" "FAIL" "$result"
fi

# Test 3: Login with valid credentials
echo "Testing login with valid credentials..."
result=$(make_api_call "POST" "/auth/login" '{
    "email": "test@example.com",
    "password": "password123"
}' "200")

if echo "$result" | grep -q "PASS"; then
    AUTH_TOKEN=$(extract_token "$result")
    print_test_result "Login Valid Credentials" "PASS" "Login successful"
else
    print_test_result "Login Valid Credentials" "FAIL" "$result"
fi

# Test 4: Login with invalid credentials
echo "Testing login with invalid credentials..."
result=$(make_api_call "POST" "/auth/login" '{
    "email": "test@example.com",
    "password": "wrongpassword"
}' "401")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Login Invalid Credentials" "PASS" "Correctly rejected invalid password"
else
    print_test_result "Login Invalid Credentials" "FAIL" "$result"
fi

# Test 5: Verify token
echo "Testing token verification..."
if [ -n "$AUTH_TOKEN" ]; then
    result=$(make_api_call "GET" "/auth/verify" "" "200" "$AUTH_TOKEN")
    
    if echo "$result" | grep -q "PASS"; then
        print_test_result "Verify Token" "PASS" "Token verification successful"
    else
        print_test_result "Verify Token" "FAIL" "$result"
    fi
else
    print_test_result "Verify Token" "FAIL" "No auth token available"
fi

# Test 6: Verify invalid token
echo "Testing invalid token verification..."
result=$(make_api_call "GET" "/auth/verify" "" "401" "invalid-token")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Verify Invalid Token" "PASS" "Correctly rejected invalid token"
else
    print_test_result "Verify Invalid Token" "FAIL" "$result"
fi

# Test 7: Missing required fields in registration
echo "Testing registration with missing fields..."
result=$(make_api_call "POST" "/auth/register" '{
    "email": "incomplete@example.com"
}' "400")

if echo "$result" | grep -q "PASS"; then
    print_test_result "Registration Missing Fields" "PASS" "Correctly rejected incomplete data"
else
    print_test_result "Registration Missing Fields" "FAIL" "$result"
fi

echo ""
echo "Authentication tests completed!"
