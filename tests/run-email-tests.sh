#!/bin/bash

# Email Test Runner
# Simple script to run email notification tests

echo "=========================================="
echo "RUNNING EMAIL NOTIFICATION TESTS"
echo "=========================================="

# Check if API is running
echo "Checking if API is running..."
if ! curl -s http://localhost:3001/auth/register > /dev/null 2>&1; then
    echo "❌ API is not running on localhost:3001"
    echo "Please start the API first using:"
    echo "  cd backend && sam local start-api --port 3001"
    echo ""
    exit 1
fi

echo "✅ API is running"
echo ""

# Run the email tests
echo "Starting email notification tests..."
echo ""

# Source the test script
source "$(dirname "$0")/test-email-notifications.sh"

echo ""
echo "=========================================="
echo "EMAIL TESTS COMPLETED"
echo "=========================================="
echo ""
echo "📧 SES Sandbox Notes:"
echo "• Verified emails will receive actual emails"
echo "• SES simulator addresses return predictable results"
echo "• Check AWS SES console for delivery status"
echo "• Verify emails in SES console if needed"
echo ""
