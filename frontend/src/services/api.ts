import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response: AxiosResponse = await this.api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    specialization: string;
    bio: string;
  }) {
    const response: AxiosResponse = await this.api.post('/auth/register', data);
    return response.data;
  }

  async verifyToken(token: string) {
    const response: AxiosResponse = await this.api.get('/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  // Therapist endpoints
  async getTherapistProfile(therapistId: string) {
    const response: AxiosResponse = await this.api.get(`/therapist/${therapistId}/profile`);
    return response.data;
  }

  async getTherapistAvailability(therapistId: string, startDate: string, endDate: string) {
    const response: AxiosResponse = await this.api.get(
      `/therapist/${therapistId}/availability?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  }

  async listTherapists() {
    const response: AxiosResponse = await this.api.get('/therapist/list');
    return response.data;
  }

  async updateAvailability(weeklyAvailability: any[], blockedSlots: any[]) {
    const response: AxiosResponse = await this.api.put('/therapist/availability', {
      weeklyAvailability,
      blockedSlots,
    });
    return response.data;
  }

  async getCurrentAvailability() {
    const response: AxiosResponse = await this.api.get('/therapist/availability');
    return response.data;
  }

  async getBookings(status?: string, limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response: AxiosResponse = await this.api.get(`/therapist/bookings?${params}`);
    return response.data;
  }

  // Booking endpoints
  async createBooking(data: {
    therapistId: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    date: string;
    startTime: string;
    endTime: string;
  }) {
    const response: AxiosResponse = await this.api.post('/booking/create', data);
    return response.data;
  }

  async cancelBooking(cancellationToken: string) {
    const response: AxiosResponse = await this.api.delete(`/booking/cancel/${cancellationToken}`);
    return response.data;
  }

  async getBookingDetails(cancellationToken: string) {
    const response: AxiosResponse = await this.api.get(`/booking/details/${cancellationToken}`);
    return response.data;
  }

  async updateBooking(cancellationToken: string, date: string, startTime: string, endTime: string) {
    const response: AxiosResponse = await this.api.put(`/booking/update/${cancellationToken}`, {
      date,
      startTime,
      endTime,
    });
    return response.data;
  }
}

export const apiService = new ApiService();
