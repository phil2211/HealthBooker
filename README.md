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
   cp env.example .env.local
   cp frontend/env.example frontend/.env.local
   
   # Update .env.local with your MongoDB Atlas connection string
   # Update other settings as needed
   ```

4. **Start the application**
   ```bash
   # Start LocalStack (if not already running)
   docker-compose up -d
   
   # Start the backend API
   cd backend
   sam local start-api --port 3001 --host 0.0.0.0
   
   # In another terminal, start the frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - LocalStack: http://localhost:4566

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

Create `.env.local` in the root directory:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthbooker
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
FROM_EMAIL=noreply@healthbooker.local
BASE_URL=http://localhost:3000
```

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
   sam deploy --guided
   ```

3. **Update Environment Variables**
   - Set production MongoDB URI
   - Set production JWT secret
   - Configure email settings
   - Set production base URL

4. **Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

### 3. Environment Variables for Production

Update the SAM template parameters or use AWS Systems Manager:

```bash
MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/healthbooker
JWT_SECRET=your-production-jwt-secret
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-username
SMTP_PASS=your-ses-password
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
   - Check SMTP credentials
   - Verify email service configuration
   - Check LocalStack logs for SES errors

4. **Frontend not connecting to API**
   - Verify `VITE_API_URL` in frontend/.env.local
   - Check if backend is running on port 3001
   - Check browser console for CORS errors

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
