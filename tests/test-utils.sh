#!/bin/bash

# Test utilities for HealthBooker API
# This script provides common functions for testing API endpoints

BASE_URL="http://localhost:3001"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"
TEST_NAME="Test Therapist"
TEST_SPECIALIZATION="Massage Therapy"
TEST_BIO="Test bio for testing"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test result tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test results
print_test_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} $test_name"
        echo -e "  ${RED}Error:${NC} $message"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to make API calls and check responses
make_api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    local auth_token="$5"
    
    # Create temporary file for response
    local temp_response=$(mktemp)
    
    # Build curl command
    local curl_args=("-s" "-w" "%{http_code}" "-X" "$method")
    
    if [ -n "$data" ]; then
        curl_args+=("-H" "Content-Type: application/json" "-d" "$data")
    fi
    
    if [ -n "$auth_token" ]; then
        curl_args+=("-H" "Authorization: Bearer $auth_token")
    fi
    
    curl_args+=("$BASE_URL$endpoint")
    
    # Execute curl and capture response
    local http_code=$(curl "${curl_args[@]}" -o "$temp_response" -w "%{http_code}")
    local body=$(cat "$temp_response")
    
    # Clean up temp file
    rm -f "$temp_response"
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "PASS"
        echo "$body"
    else
        echo "FAIL"
        echo "Expected status: $expected_status, Got: $http_code"
        echo "Response: $body"
    fi
}

# Function to extract value from JSON response
extract_json_value() {
    local json="$1"
    local key="$2"
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | cut -d'"' -f4
}

# Function to extract therapist ID from registration response
extract_therapist_id() {
    local json="$1"
    echo "$json" | grep -o "\"id\":\"[^\"]*\"" | cut -d'"' -f4
}

# Function to extract token from login response
extract_token() {
    local json="$1"
    echo "$json" | grep -o "\"token\":\"[^\"]*\"" | cut -d'"' -f4
}

# Function to extract cancellation token from booking response
extract_cancellation_token() {
    local json="$1"
    echo "$json" | grep -o "\"cancellationToken\":\"[^\"]*\"" | cut -d'"' -f4
}

# Function to print test summary
print_test_summary() {
    echo ""
    echo "=========================================="
    echo "TEST SUMMARY"
    echo "=========================================="
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed!${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Some tests failed.${NC}"
        exit 1
    fi
}

# Function to wait for API to be ready
wait_for_api() {
    echo "Waiting for API to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$BASE_URL/auth/register" > /dev/null 2>&1; then
            echo "API is ready!"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts - API not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "API failed to start within expected time"
    exit 1
}

# Function to clean up test data
cleanup_test_data() {
    echo "Cleaning up test data..."
    # Note: In a real implementation, you might want to add cleanup endpoints
    # For now, we'll just log that cleanup would happen here
    echo "Test data cleanup completed (manual cleanup may be required)"
}
