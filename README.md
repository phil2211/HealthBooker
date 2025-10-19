# Health Worker Booking System

A multi-tenant reservation system for health workers like craniosacral therapists, built with React, AWS Lambda, and MongoDB Atlas.

## 🏗️ Architecture

- **Frontend**: React 18 + Material-UI (responsive design)
- **Backend**: AWS Lambda functions (Node.js) via API Gateway
- **Database**: MongoDB Atlas
- **Storage**: AWS S3 for static hosting
- **Local Testing**: LocalStack + AWS SAM CLI

## ✨ Features

### MVP Features
- **Multi-tenant System**: Each therapist gets a unique booking URL
- **Therapist Management**: Registration, login, profile management
- **Availability Calendar**: Set weekly availability and block specific dates/times
- **Patient Booking**: Public booking page (no login required)
- **Email Notifications**: Booking confirmations and cancellations
- **Cancellation Management**: Unique cancellation links with 24h notice

### Core Components
- Therapist dashboard with availability management
- Public booking page with calendar and time slot selection
- Email notifications for bookings and cancellations
- Responsive design for mobile and desktop

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- AWS SAM CLI
- MongoDB Atlas account (free tier)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HealthBooker
   ```

2. **Run the setup script**
   ```bash
   ./setup.sh
   ```

3. **Configure environment variables**
   ```bash
   # Copy and update environment files
   cp frontend/env.example frontend/.env.local
   
   # Configure SAM environment variables (REQUIRED)
   cp backend/env.json.example backend/env.json
   
   # Update backend/env.json with your real credentials:
   # - MongoDB Atlas connection string
   # - JWT secret key
   # - AWS region for SES
   # - Verified FROM_EMAIL address
   # - Other configuration as needed
   ```

4. **Start the application**
   ```bash
   # Start LocalStack (if not already running)
   docker-compose up -d
   
   # Start the backend API
   cd backend
   sam local start-api --port 3001 --host 0.0.0.0 --env-vars env.json
   
   # In another terminal, start the frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - LocalStack: http://localhost:4566

## 📧 AWS SES Configuration

The application uses AWS Simple Email Service (SES) for sending confirmation and cancellation emails. You need to configure SES before the application can send emails.

### SES Sandbox Mode (Recommended for Development)

SES starts in sandbox mode, which is perfect for development and testing:

1. **Verify Email Addresses**
   - Go to AWS SES Console → Verified identities
   - Click "Create identity" → "Email address"
   - Enter the email addresses you want to send from/to
   - Check your email and click the verification link
   - Repeat for all email addresses you'll use for testing

2. **Sandbox Limitations**
   - Can only send to verified email addresses
   - Maximum 200 emails per day
   - Maximum 1 email per second
   - Perfect for development and testing

3. **Update Configuration**
   - Set `FROM_EMAIL` to a verified email address
   - Ensure all test recipient emails are verified

### SES Production Mode (For Production Deployment)

For production, you'll need to move out of sandbox mode:

1. **Domain Verification**
   - Go to AWS SES Console → Verified identities
   - Click "Create identity" → "Domain"
   - Enter your domain name
   - Add the required DNS records to your domain's DNS settings
   - Wait for verification (can take up to 72 hours)

2. **Request Production Access**
   - Go to AWS SES Console → Account dashboard
   - Click "Request production access"
   - Fill out the form explaining your use case
   - Wait for approval (usually 24-48 hours)

3. **Production Benefits**
   - Can send to any email address
   - Higher sending limits (starts at 200/day, can be increased)
   - Better deliverability

### Local Development with SES

For local development, you can use LocalStack which simulates SES:

1. **LocalStack SES Setup**
   - LocalStack automatically provides SES simulation
   - No need to verify emails in LocalStack
   - Emails are logged to LocalStack logs

2. **View Sent Emails**
   ```bash
   # Check LocalStack logs for sent emails
   docker-compose logs localstack | grep -i ses
   ```

3. **AWS Credentials for Local Development**
   - For local development with real SES, configure AWS credentials:
   ```bash
   aws configure
   # Or set environment variables:
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_DEFAULT_REGION=eu-central-1
   ```

## 🔒 Security Notes

**IMPORTANT**: Never commit files with real credentials to version control:

- ✅ **Safe to commit**: `backend/env.json.example`, `frontend/env.example`
- ❌ **Never commit**: `backend/env.json`, `frontend/.env.local`

The `backend/env.json` file contains your real MongoDB connection string and other sensitive credentials. It's automatically excluded from git via `.gitignore`.

## 📋 Manual Setup

If you prefer manual setup or the script doesn't work:

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..

# Backend dependencies
cd backend && npm install && cd ..
```

### 2. Configure Environment Variables

Configure backend/env.json (see backend/env.json.example for template):
- Set MongoDB connection string
- Set JWT secret
- Set AWS region for SES
- Set verified FROM_EMAIL address
- Set BASE_URL

Create `frontend/.env.local`:
```bash
VITE_API_URL=http://localhost:3001
```

### 3. Start LocalStack

```bash
docker-compose up -d
```

### 4. Start Backend

```bash
cd backend
sam build
sam local start-api --port 3001 --host 0.0.0.0
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

## 🧪 Testing

### Local Testing with LocalStack

The application uses LocalStack to simulate AWS services locally:

- **Lambda**: Functions run in Docker containers
- **API Gateway**: REST API endpoints
- **S3**: Static file hosting (simulated)
- **SES**: Email service (simulated)

### Testing the Application

1. **Register a therapist**
   - Go to http://localhost:3000/register
   - Fill in therapist details
   - Complete registration

2. **Set up availability**
   - Login and go to dashboard
   - Click "Manage Availability"
   - Set weekly availability and blocked slots

3. **Test booking flow**
   - Copy the booking URL from dashboard
   - Open booking URL in incognito window
   - Complete booking process

4. **Test email notifications**
   - Check email service (Mailtrap or similar)
   - Verify confirmation emails are sent

## 🚀 Deployment

### Prerequisites for Production

- AWS Account with appropriate permissions
- MongoDB Atlas cluster
- Domain name (optional)
- Email service (AWS SES or similar)

### 1. MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster (free tier available)
3. Create a database user
4. Whitelist your IP addresses
5. Get the connection string

### 2. AWS Deployment

1. **Configure AWS CLI**
   ```bash
   aws configure
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   sam build
   sam deploy --no-confirm-changeset
   ```
   
   **Note**: The `--no-confirm-changeset` flag automatically deploys without requiring manual confirmation. If you prefer guided deployment, use `sam deploy --guided` instead.

3. **Verify Deployment**
   ```bash
   # Check deployment status
   aws cloudformation describe-stacks --stack-name HealtBooker
   
   # Get API endpoint URL
   aws cloudformation describe-stacks --stack-name HealtBooker --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text
   ```

4. **Configure AWS SES**
   - Verify your domain or email address in SES Console
   - Request production access if needed
   - Set up proper IAM permissions for Lambda functions

5. **Update Environment Variables**
   - Set production MongoDB URI
   - Set production JWT secret
   - Set AWS region for SES
   - Set verified FROM_EMAIL address
   - Set production base URL

6. **Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   aws s3 sync dist/ s3://healthbooker --delete
   ```

### 3. Deployment Fixes Applied

The following issues have been resolved in the deployment process:

- **CORS Configuration**: Removed individual CORS configurations from API events to prevent conflicts
- **S3 Bucket Naming**: Fixed bucket name to use lowercase (`healthbooker-frontend-${AWS::AccountId}`)
- **Template Validation**: All SAM template validation issues resolved

### 4. Environment Variables for Production

Update the SAM template parameters or use AWS Systems Manager:

```bash
MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/healthbooker
JWT_SECRET=your-production-jwt-secret
AWS_REGION=us-east-1
FROM_EMAIL=noreply@yourdomain.com
BASE_URL=https://yourdomain.com
```

## 📁 Project Structure

```
/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Main pages
│   │   ├── services/        # API client
│   │   └── contexts/        # Auth & state management
│   └── package.json
├── backend/                  # Lambda functions
│   ├── functions/
│   │   ├── auth/            # Login, register
│   │   ├── therapist/       # Availability management
│   │   ├── booking/         # Create, cancel bookings
│   │   └── notifications/   # Email notifications
│   ├── layers/              # Shared code (DB, utils)
│   └── template.yaml        # SAM template
├── infrastructure/           # AWS configuration
├── docs/                     # Documentation
├── docker-compose.yml        # LocalStack configuration
└── setup.sh                 # Setup script
```

## 🔧 Development

### Available Scripts

```bash
# Root level
npm run dev          # Start both frontend and backend
npm run build        # Build both frontend and backend
npm run deploy       # Deploy to AWS

# Frontend
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
cd backend
sam build           # Build Lambda functions
sam local start-api # Start local API server
sam deploy          # Deploy to AWS
```

### API Endpoints

- `POST /auth/register` - Therapist registration
- `POST /auth/login` - Therapist login
- `GET /auth/verify` - Verify JWT token
- `GET /therapist/{id}/profile` - Get therapist profile
- `GET /therapist/{id}/availability` - Get available slots
- `PUT /therapist/availability` - Update availability
- `GET /therapist/bookings` - List bookings
- `POST /booking/create` - Create booking
- `DELETE /booking/cancel/{token}` - Cancel booking

## 🐛 Troubleshooting

### Common Issues

1. **LocalStack not starting**
   - Ensure Docker is running
   - Check if port 4566 is available
   - Try `docker-compose down && docker-compose up -d`

2. **MongoDB connection issues**
   - Verify connection string format
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

3. **Email not sending**
   - **Sandbox mode**: Verify all email addresses in SES Console
   - **Production mode**: Ensure domain is verified and production access is granted
   - Check IAM permissions for SES (ses:SendEmail, ses:SendRawEmail)
   - Verify FROM_EMAIL is a verified identity
   - Check AWS region configuration matches SES region
   - Check LocalStack logs for SES errors (local development)
   - Monitor SES sending statistics in AWS Console

4. **Frontend not connecting to API**
   - Verify `VITE_API_URL` in frontend/.env.local
   - Check if backend is running on port 3001
   - Check browser console for CORS errors

5. **AWS Deployment Issues**
   - **CORS errors**: Ensure CORS is configured only at the API Gateway level, not individual endpoints
   - **S3 bucket naming**: Bucket names must be lowercase (fixed in template)
   - **Stack creation failed**: Check CloudFormation events for specific error details
   - **Permission errors**: Ensure AWS CLI is configured with appropriate permissions

### Logs

```bash
# LocalStack logs
docker-compose logs localstack

# Backend logs (when running sam local)
# Check terminal where sam local start-api is running

# Frontend logs
# Check browser developer console
```

## 📚 Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Material-UI Documentation](https://mui.com/)
- [React Router Documentation](https://reactrouter.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the documentation
- Open an issue on GitHub

---

**Happy coding! 🎉**
