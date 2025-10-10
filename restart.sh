#!/bin/bash
# restart.sh

echo "Stopping all services..."
pkill -f "sam local start-api"
pkill -f "npm run dev"
pkill -f "vite"
docker-compose down

echo "Cleaning up..."
cd backend
rm -rf .aws-sam/
cd ..

echo "Starting services..."
# Start SAM in background
cd backend && sam build && sam local start-api --port 3001 --host 0.0.0.0 &
cd ../frontend && npm run dev &

echo "Services started! Check:"
echo "- API: http://localhost:3001"
echo "- Frontend: http://localhost:3000"