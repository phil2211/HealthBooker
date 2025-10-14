import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Health Worker Booking System
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Streamline your practice with our easy-to-use appointment booking system
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  For Health Workers
                </Typography>
                <Typography variant="body1" paragraph>
                  Manage your availability, view bookings, and grow your practice with our comprehensive dashboard.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  For Patients
                </Typography>
                <Typography variant="body1" paragraph>
                  Book appointments easily with your preferred health worker. No account required.
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/therapists')}
                >
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Features
                </Typography>
                <Typography variant="body1" paragraph>
                  • Multi-tenant system<br />
                  • Email notifications<br />
                  • Easy cancellation<br />
                  • Responsive design
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box textAlign="center">
          <Typography variant="h4" gutterBottom>
            Ready to streamline your practice?
          </Typography>
          <Typography variant="body1" paragraph>
            Join hundreds of health workers who trust our platform
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
          >
            Start Your Free Trial
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default LandingPage;
