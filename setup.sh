#!/bin/bash

# Health Worker Booking System - Local Development Setup Script

echo "🏥 Setting up Health Worker Booking System for local development..."

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    else
        echo "✅ $1 is installed"
    fi
}

echo "🔍 Checking required tools..."
check_tool "node"
check_tool "npm"
check_tool "docker"
check_tool "docker-compose"
check_tool "sam"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version is compatible"

# Create environment files if they don't exist
if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend/.env.local file..."
    cp frontend/.env.example frontend/.env.local
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Start LocalStack
echo "🐳 Starting LocalStack..."
docker-compose up -d

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack to be ready..."
sleep 10

# Build and deploy Lambda functions to LocalStack
echo "🚀 Building and deploying Lambda functions to LocalStack..."
cd backend
sam build
sam local start-api --port 3001 --host 0.0.0.0 &
cd ..

echo "✅ Setup complete!"
echo ""
echo "🎉 Your Health Worker Booking System is ready for local development!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/env.json with your MongoDB Atlas connection string"
echo "2. Update frontend/.env.local if needed"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Visit http://localhost:3000 to see the application"
echo ""
echo "🔗 URLs:"
echo "- Frontend: http://localhost:3000"
echo "- API: http://localhost:3001"
echo "- LocalStack: http://localhost:4566"
echo ""
echo "📚 For more information, see the README.md file"
