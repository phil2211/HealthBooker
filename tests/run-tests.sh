#!/bin/bash

# Master Test Runner for HealthBooker API
# This script runs all API endpoint tests and provides a comprehensive report

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test result tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}HEALTHBOOKER API TEST SUITE${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Check if API is running
echo -e "${YELLOW}Checking if API is running...${NC}"
if ! curl -s http://localhost:3001/auth/register > /dev/null 2>&1; then
    echo -e "${RED}❌ API is not running on localhost:3001${NC}"
    echo -e "${YELLOW}Please start the API server first:${NC}"
    echo "  cd backend && sam local start-api --port 3001 --host 0.0.0.0"
    exit 1
fi

echo -e "${GREEN}✅ API is running${NC}"
echo ""

# Function to run a test suite and capture results
run_test_suite() {
    local test_name="$1"
    local test_script="$2"
    
    echo -e "${BLUE}Running $test_name...${NC}"
    echo "----------------------------------------"
    
    # Run the test script and capture output
    local test_output
    if test_output=$(bash "$test_script" 2>&1); then
        echo "$test_output"
        echo ""
        echo -e "${GREEN}✅ $test_name completed successfully${NC}"
    else
        echo "$test_output"
        echo ""
        echo -e "${RED}❌ $test_name failed${NC}"
        return 1
    fi
}

# Function to extract test counts from test output
extract_test_counts() {
    local output="$1"
    
    # Extract counts from the test output
    local total=$(echo "$output" | grep "Total Tests:" | grep -o '[0-9]*' | tail -1)
    local passed=$(echo "$output" | grep "Passed:" | grep -o '[0-9]*' | tail -1)
    local failed=$(echo "$output" | grep "Failed:" | grep -o '[0-9]*' | tail -1)
    
    if [ -n "$total" ] && [ -n "$passed" ] && [ -n "$failed" ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + total))
        PASSED_TESTS=$((PASSED_TESTS + passed))
        FAILED_TESTS=$((FAILED_TESTS + failed))
    fi
}

# Run all test suites
echo -e "${YELLOW}Starting comprehensive API tests...${NC}"
echo ""

# Authentication Tests
auth_output=$(run_test_suite "Authentication Tests" "$SCRIPT_DIR/test-auth.sh")
extract_test_counts "$auth_output"

# Therapist Tests
therapist_output=$(run_test_suite "Therapist API Tests" "$SCRIPT_DIR/test-therapist.sh")
extract_test_counts "$therapist_output"

# Booking Tests
booking_output=$(run_test_suite "Booking API Tests" "$SCRIPT_DIR/test-booking.sh")
extract_test_counts "$booking_output"

# Print final summary
echo ""
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}FINAL TEST SUMMARY${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""
echo -e "Total Tests Run: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}Your HealthBooker API is working correctly!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Test the frontend application at http://localhost:3000"
    echo "2. Try registering a therapist and creating bookings"
    echo "3. Test the complete user workflow"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${YELLOW}Please check the failed tests above and fix the issues.${NC}"
    echo ""
    echo -e "${YELLOW}Common issues to check:${NC}"
    echo "1. Make sure MongoDB is accessible"
    echo "2. Verify environment variables are set correctly"
    echo "3. Check that all Lambda functions are deployed properly"
    echo "4. Ensure the API server is running without errors"
    exit 1
fi
