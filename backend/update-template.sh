#!/bin/bash

# Update all CodeUri paths in template.yaml

echo "Updating CodeUri paths in template.yaml..."

# Update all function CodeUri paths
sed -i '' 's|CodeUri: functions/auth/|CodeUri: functions/auth/register/|g' template.yaml
sed -i '' 's|CodeUri: functions/therapist/|CodeUri: functions/therapist/getProfile/|g' template.yaml
sed -i '' 's|CodeUri: functions/booking/|CodeUri: functions/booking/create/|g' template.yaml

# Fix specific functions
sed -i '' 's|CodeUri: functions/auth/register/|CodeUri: functions/auth/login/|g' template.yaml
sed -i '' 's|CodeUri: functions/auth/login/|CodeUri: functions/auth/verify/|g' template.yaml
sed -i '' 's|CodeUri: functions/therapist/getProfile/|CodeUri: functions/therapist/getAvailability/|g' template.yaml
sed -i '' 's|CodeUri: functions/therapist/getAvailability/|CodeUri: functions/therapist/updateAvailability/|g' template.yaml
sed -i '' 's|CodeUri: functions/therapist/updateAvailability/|CodeUri: functions/therapist/getBookings/|g' template.yaml
sed -i '' 's|CodeUri: functions/booking/create/|CodeUri: functions/booking/cancel/|g' template.yaml

echo "Done!"
