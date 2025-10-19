# Email Notification Testing

This directory contains tests for email notifications sent through AWS SES when bookings are created and cancelled.

## Files

- `test-email-notifications.sh` - Main test script for email functionality
- `run-email-tests.sh` - Simple runner script with API health check
- `test-utils.sh` - Shared utilities (used by all test scripts)

## Prerequisites

1. **AWS SES Setup**: Ensure AWS SES is configured in `eu-central-1` region
2. **Verified Emails**: Verify the sender email (`FROM_EMAIL`) in AWS SES console
3. **API Running**: Start the API server on port 3001
4. **Environment**: Ensure `env.json` has correct SES configuration

## Quick Start

```bash
# Start the API (if not already running)
cd backend
sam local start-api --port 3001

# In another terminal, run email tests
cd tests
./run-email-tests.sh
```

## Test Cases

### Booking Creation Email Tests
- ✅ Verified email address (philip@eschenbacher.ch)
- ✅ SES success simulator (success@simulator.amazonses.com)
- ✅ SES bounce simulator (bounce@simulator.amazonses.com)
- ✅ SES complaint simulator (complaint@simulator.amazonses.com)
- ❌ Unverified email address (should fail in sandbox)

### Booking Cancellation Email Tests
- ✅ Cancellation with verified email
- ❌ Cancellation with invalid token
- ❌ Cancellation of already cancelled booking

## SES Sandbox Configuration

### Verified Email Addresses
- **Sender**: `philip@eschenbacher.ch` (configured in env.json)
- **Recipient**: `philip@eschenbacher.ch` (for testing)
- **Therapist Email**: `philip@eschenbacher.ch` (same as recipient for SES sandbox compatibility)

### SES Simulator Addresses
These addresses don't need verification and return predictable results:
- `success@simulator.amazonses.com` - Always succeeds
- `bounce@simulator.amazonses.com` - Simulates bounce
- `complaint@simulator.amazonses.com` - Simulates complaint
- `ooto@simulator.amazonses.com` - Simulates out-of-office

### Unverified Email Test
- `unverified@example.com` - Should fail in SES sandbox mode

## Environment Configuration

Ensure `backend/env.json` contains:
```json
{
  "Parameters": {
    "AWS_REGION": "eu-central-1",
    "FROM_EMAIL": "philip@eschenbacher.ch",
    "BASE_URL": "http://localhost:3000"
  }
}
```

## AWS SES Console

To verify emails in AWS SES console:
1. Go to AWS SES console in `eu-central-1` region
2. Navigate to "Verified identities"
3. Add and verify email addresses
4. Check "Suppression list" for bounced/complained emails

## Expected Behavior

### In SES Sandbox Mode
- ✅ Verified sender + verified recipient = Email sent
- ✅ Verified sender + SES simulator = Email sent (simulated)
- ✅ Verified sender + unverified recipient = Booking succeeds, email may fail silently
- ❌ Unverified sender + any recipient = SES rejects send

### Test Results
- All booking creation tests pass (bookings are created successfully)
- Email sending is attempted for all bookings
- SES simulator addresses work as expected
- Unverified emails don't cause booking failures (correct production behavior)
- **Important**: Both patient and therapist emails use verified addresses to ensure SES sandbox compatibility

### Email Content
- **Patient Email**: Confirmation with appointment details and cancellation link
- **Therapist Email**: Notification of new booking with patient details
- **Cancellation Emails**: Both patient and therapist receive cancellation notifications

## Troubleshooting

### Common Issues

1. **"Email sending failed" errors**
   - Check AWS credentials are configured
   - Verify sender email is verified in SES
   - Ensure recipient email is verified (in sandbox mode)

2. **"API not running" error**
   - Start API with: `cd backend && sam local start-api --port 3001`
   - Check API is accessible at `http://localhost:3001`

3. **"Therapist not found" errors**
   - Test creates its own therapist - this shouldn't happen
   - Check MongoDB connection in API logs

### Debug Mode

To see detailed email sending logs:
```bash
# Check API logs for email sending details
tail -f backend/.aws-sam/logs/CreateBookingFunction.log
tail -f backend/.aws-sam/logs/CancelBookingFunction.log
```

## Manual Verification

After running tests, you can manually verify emails were sent:

### Check Email Delivery
1. Check `philip@eschenbacher.ch` inbox for actual emails
2. Check AWS SES console for send statistics
3. Review API logs for email sending success/failure messages

### Verify SES Statistics
```bash
# Check recent send statistics
aws ses get-send-statistics --region eu-central-1 --query 'SendDataPoints[-10:].[Timestamp,SentCount,BounceCount,ComplaintCount]' --output table

# Check sending quota
aws ses get-send-quota --region eu-central-1
```

### Check API Logs
```bash
# Monitor email sending logs
cd backend && sam local logs CreateBookingFunction --tail
cd backend && sam local logs CancelBookingFunction --tail
```

## Production Considerations

- Move out of SES sandbox mode for production
- Set up proper email templates
- Configure bounce and complaint handling
- Add email delivery tracking
- Set up SNS notifications for bounces/complaints
