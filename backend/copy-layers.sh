#!/bin/bash

# Copy shared layers to each function directory

echo "Copying shared layers to function directories..."

# Function directories
FUNCTIONS=(
  "functions/auth/register"
  "functions/auth/login"
  "functions/auth/verify"
  "functions/therapist/getProfile"
  "functions/therapist/getAvailability"
  "functions/therapist/updateAvailability"
  "functions/therapist/getBookings"
  "functions/booking/create"
  "functions/booking/cancel"
)

# Copy layers to each function
for func in "${FUNCTIONS[@]}"; do
  echo "Copying layers to $func..."
  cp -r layers "$func/"
done

echo "Done!"
