# Development Guide

This guide provides detailed information for developers working on the Health Worker Booking System.

## 🏗️ Architecture Overview

The system follows a serverless architecture with the following components:

### Frontend (React + Material-UI)
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **State Management**: React Context API
- **Build Tool**: Vite
- **Styling**: Emotion (MUI's styling solution)

### Backend (AWS Lambda)
- **Runtime**: Node.js 18.x
- **Framework**: AWS SAM (Serverless Application Model)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT with bcrypt for password hashing
- **Email**: Nodemailer with SMTP

### Local Development
- **AWS Simulation**: LocalStack
- **Containerization**: Docker
- **API Testing**: SAM CLI Local

## 📁 Detailed Project Structure

```
/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Header.tsx     # Navigation header
│   │   │   ├── ProtectedRoute.tsx # Route protection
│   │   │   └── AvailabilityManager.tsx # Availability management
│   │   ├── pages/             # Main application pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── TherapistDashboard.tsx
│   │   │   └── BookingPage.tsx
│   │   ├── services/          # API communication
│   │   │   └── api.ts        # Axios-based API client
│   │   ├── contexts/         # React Context providers
│   │   │   └── AuthContext.tsx # Authentication context
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Application entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/                    # AWS Lambda backend
│   ├── functions/             # Lambda function handlers
│   │   ├── auth/             # Authentication functions
│   │   │   ├── register.ts   # Therapist registration
│   │   │   ├── login.ts      # Therapist login
│   │   │   └── verify.ts     # Token verification
│   │   ├── therapist/        # Therapist management
│   │   │   ├── getProfile.ts # Get public profile
│   │   │   ├── getAvailability.ts # Get available slots
│   │   │   ├── updateAvailability.ts # Update availability
│   │   │   └── getBookings.ts # List bookings
│   │   ├── booking/           # Booking management
│   │   │   ├── create.ts     # Create booking
│   │   │   └── cancel.ts     # Cancel booking
│   │   └── notifications/    # Email notifications
│   │       └── sendEmail.ts  # Email sending logic
│   ├── layers/               # Shared Lambda layer code
│   │   ├── models/          # Database models
│   │   │   ├── Therapist.ts # Therapist schema
│   │   │   └── Booking.ts   # Booking schema
│   │   ├── database/        # Database utilities
│   │   │   └── connection.ts # MongoDB connection
│   │   ├── utils/           # Utility functions
│   │   │   ├── apiHelpers.ts # API response helpers
│   │   │   └── auth.ts      # JWT utilities
│   │   └── index.ts         # Layer exports
│   ├── template.yaml        # SAM template
│   └── package.json
├── infrastructure/           # AWS infrastructure code
├── docs/                    # Documentation
├── docker-compose.yml       # LocalStack configuration
├── setup.sh                # Setup script
└── README.md               # Main documentation
```

## 🔧 Development Workflow

### 1. Local Development Setup

```bash
# Start LocalStack
docker-compose up -d

# Start backend API (Terminal 1)
cd backend
sam local start-api --port 3001 --host 0.0.0.0

# Start frontend (Terminal 2)
cd frontend
npm run dev
```

### 2. Making Changes

#### Frontend Changes
- Modify components in `frontend/src/components/`
- Update pages in `frontend/src/pages/`
- Add new API calls in `frontend/src/services/api.ts`
- Frontend hot-reloads automatically

#### Backend Changes
- Modify Lambda functions in `backend/functions/`
- Update shared code in `backend/layers/`
- After changes, restart SAM local: `sam local start-api --port 3001`

### 3. Testing Changes

1. **Test API endpoints** using curl or Postman:
   ```bash
   # Test registration
   curl -X POST http://localhost:3001/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password","name":"Test User","specialization":"Massage","bio":"Test bio"}'
   ```

2. **Test frontend** by navigating through the application

3. **Check logs** for any errors:
   ```bash
   # LocalStack logs
   docker-compose logs localstack
   ```

## 🗄️ Database Schema

### Therapist Collection
```typescript
{
  _id: ObjectId,
  email: string,           // Unique, lowercase
  passwordHash: string,    // bcrypt hashed
  name: string,
  specialization: string,
  bio: string,
  photoUrl?: string,
  weeklyAvailability: [{
    day: number,           // 0-6 (Sunday-Saturday)
    startTime: string,     // HH:mm format
    endTime: string        // HH:mm format
  }],
  blockedSlots: [{
    date: string,          // YYYY-MM-DD format
    startTime: string,     // HH:mm format
    endTime: string        // HH:mm format
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Collection
```typescript
{
  _id: ObjectId,
  therapistId: ObjectId,   // Reference to Therapist
  patientName: string,
  patientEmail: string,     // Lowercase
  patientPhone: string,
  date: string,           // YYYY-MM-DD format
  startTime: string,      // HH:mm format
  endTime: string,        // HH:mm format
  status: 'pending' | 'confirmed' | 'cancelled',
  cancellationToken: string, // UUID for cancellation
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication Flow

1. **Registration/Login**: Therapist provides credentials
2. **JWT Generation**: Server generates JWT with therapist info
3. **Token Storage**: Frontend stores JWT in localStorage
4. **Request Authentication**: JWT sent in Authorization header
5. **Token Verification**: Server verifies JWT on protected routes

### JWT Payload
```typescript
{
  therapistId: string,
  email: string,
  iat: number,    // Issued at
  exp: number     // Expires at
}
```

## 📧 Email System

### Email Types
1. **Booking Confirmation**: Sent to patient and therapist
2. **Cancellation Notification**: Sent when booking is cancelled

### Email Configuration
- Uses Nodemailer with SMTP
- Supports various SMTP providers (Gmail, Mailtrap, AWS SES)
- HTML templates with inline CSS for better compatibility

### Local Testing
For local development, use Mailtrap or similar service:
```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

## 🚀 Deployment Process

### 1. Backend Deployment
```bash
cd backend
sam build
sam deploy --guided
```

### 2. Frontend Deployment
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete
```

### 3. Environment Variables
Set production environment variables in AWS Lambda:
- MongoDB connection string
- JWT secret
- Email configuration
- Base URL

## 🐛 Debugging

### Common Issues and Solutions

1. **CORS Errors**
   - Ensure API Gateway CORS is configured
   - Check frontend API URL configuration

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist
   - Ensure database user permissions

3. **Email Not Sending**
   - Check SMTP credentials
   - Verify email service configuration
   - Check LocalStack SES logs

4. **Lambda Function Errors**
   - Check CloudWatch logs
   - Verify environment variables
   - Test functions locally with SAM

### Debugging Tools

1. **Browser DevTools**: Check network requests and console errors
2. **LocalStack Logs**: `docker-compose logs localstack`
3. **SAM Local Logs**: Check terminal output
4. **MongoDB Atlas**: Check connection and query logs

## 📝 Code Style Guidelines

### TypeScript
- Use strict mode
- Define interfaces for all data structures
- Use proper typing for function parameters and returns

### React
- Use functional components with hooks
- Implement proper error boundaries
- Use Material-UI components consistently

### Node.js/Lambda
- Use async/await for asynchronous operations
- Implement proper error handling
- Use environment variables for configuration

### File Naming
- Use PascalCase for React components
- Use camelCase for functions and variables
- Use kebab-case for file names

## 🧪 Testing Strategy

### Unit Testing
- Test individual functions and components
- Mock external dependencies
- Use Jest for backend testing
- Use React Testing Library for frontend

### Integration Testing
- Test API endpoints with real database
- Test complete user flows
- Use LocalStack for AWS service testing

### End-to-End Testing
- Test complete booking flow
- Test authentication flow
- Test email notifications

## 🔄 CI/CD Pipeline

### GitHub Actions (Recommended)
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Backend
        run: |
          cd backend
          sam build
          sam deploy --no-confirm-changeset
      - name: Deploy Frontend
        run: |
          cd frontend
          npm run build
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
```

## 📚 Additional Resources

- [AWS SAM Best Practices](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [MongoDB Atlas Best Practices](https://docs.atlas.mongodb.com/best-practices/)
- [Material-UI Theming](https://mui.com/customization/theming/)
- [React Best Practices](https://react.dev/learn)

---

This development guide should help you understand the codebase and contribute effectively to the project.
