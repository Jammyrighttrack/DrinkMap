import axios from 'axios';
import { extractObjectPayload, extractListPayload, resolveApiBaseUrl } from '../../lib/api';

const BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL
);

const authClient = axios.create({
  baseURL: `${BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  register: async (userData) => {
    const response = await authClient.post('/register', userData);
    return extractObjectPayload(response.data);
  },

  login: async (credentials) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await authClient.post('/login/access-token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  },

  getCurrentUser: async (token) => {
    const response = await authClient.get('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return extractObjectPayload(response.data);
  },

  forgotPassword: async (payload) => {
    const response = await authClient.post('/forgot-password', payload);
    return response.data;
  },

  resetPassword: async (payload) => {
    const response = await authClient.post('/reset-password', payload);
    return response.data;
  },

  loginWithGoogle: async (googleToken) => {
    const response = await authClient.post('/google', { token: googleToken });
    return extractObjectPayload(response.data);
  },

  loginWithGoogleMock: async (payload) => {
    const response = await authClient.post('/google-mock', payload);
    return response.data;
  },

  verifyOtp: async (payload) => {
    const response = await authClient.post('/verify-otp', payload);
    return response.data;
  },

  resendOtp: async (payload) => {
    const response = await authClient.post('/resend-otp', payload);
    return extractObjectPayload(response.data);
  },
};

const userClient = axios.create({
  baseURL: `${BASE_URL}/users`,
  headers: {
    'Content-Type': 'application/json',
  },
});

userClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const userApi = {
  updatePreferences: async (preferences) => {
    const response = await userClient.put('/preferences', { preferences });
    return extractObjectPayload(response.data);
  },

  getSavedShops: async () => {
    const response = await userClient.get('/saved-shops');
    return extractListPayload(response.data);
  },

  toggleSaveShop: async (shopId) => {
    const response = await userClient.post('/saved-shops', { shop_id: shopId });
    return extractObjectPayload(response.data);
  },

  updateProfile: async (profileData) => {
    const response = await userClient.put('/profile', profileData);
    return extractObjectPayload(response.data);
  },

  updateSettings: async (settingsData) => {
    const response = await userClient.put('/settings', settingsData);
    return extractObjectPayload(response.data);
  },

  deleteAccount: async () => {
    const response = await userClient.delete('/me');
    return extractObjectPayload(response.data);
  }
};
