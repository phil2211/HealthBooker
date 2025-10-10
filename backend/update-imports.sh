#!/bin/bash

# Update import paths in all function files

echo "Updating import paths..."

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

# Update import paths in each function
for func in "${FUNCTIONS[@]}"; do
  echo "Updating imports in $func..."
  
  # Find all .ts files in the function directory
  find "$func" -name "*.ts" -not -path "*/layers/*" | while read file; do
    # Update import paths
    sed -i '' 's|from '\''../../layers|from '\''./layers|g' "$file"
    sed -i '' 's|from '\''../../../layers|from '\''./layers|g' "$file"
    sed -i '' 's|from '\''../../../../layers|from '\''./layers|g' "$file"
  done
done

echo "Done!"
