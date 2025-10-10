#!/bin/bash

# Debug script to test the make_api_call function

source "$(dirname "$0")/test-utils.sh"

echo "Testing make_api_call function..."

# Test 1: Simple registration
echo "Test 1: Registration"
result=$(make_api_call "POST" "/auth/register" '{
    "email": "debug@example.com",
    "password": "password123",
    "name": "Debug User",
    "specialization": "Massage Therapy",
    "bio": "Debug bio"
}' "201")

echo "Result:"
echo "$result"
echo "---"

# Test 2: Check if we can extract the status correctly
echo "Test 2: Manual curl test"
manual_result=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"email":"debug2@example.com","password":"password123","name":"Debug User","specialization":"Massage Therapy","bio":"Debug bio"}' "http://localhost:3001/auth/register")
echo "Manual result: $manual_result"
echo "Status code: ${manual_result: -3}"
echo "Body: ${manual_result%???}"
