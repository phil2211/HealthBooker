import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Header from '../components/Header';

interface Therapist {
  id: string;
  name: string;
  specialization: string;
  bio: string;
  photoUrl?: string;
}

const TherapistListPage: React.FC = () => {
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      const response = await apiService.listTherapists();
      setTherapists(response.therapists);
    } catch (err: any) {
      setError('Failed to load therapists');
      console.error('Error fetching therapists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (therapistId: string) => {
    navigate(`/book/${therapistId}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Choose Your Health Worker
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Select a health worker to book your appointment
        </Typography>

        {therapists.length === 0 ? (
          <Box textAlign="center" sx={{ mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No health workers available at the moment.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {therapists.map((therapist) => (
              <Grid item xs={12} sm={6} md={4} key={therapist.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {therapist.photoUrl && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={therapist.photoUrl}
                      alt={therapist.name}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {therapist.name}
                    </Typography>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      {therapist.specialization}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {therapist.bio}
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleBookAppointment(therapist.id)}
                      sx={{ mt: 'auto' }}
                    >
                      Book Appointment
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
};

export default TherapistListPage;
