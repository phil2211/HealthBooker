import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import TherapistDashboard from './pages/TherapistDashboard';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TherapistListPage from './pages/TherapistListPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import BookingReschedulePage from './pages/BookingReschedulePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/therapists" element={<TherapistListPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <TherapistDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/book/:therapistId" element={<BookingPage />} />
        <Route path="/booking/confirmation/:token" element={<BookingConfirmationPage />} />
        <Route path="/booking/reschedule/:token" element={<BookingReschedulePage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
