import axios from 'axios';
import { extractObjectPayload, resolveApiBaseUrl } from '../../lib/api';

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

    return extractObjectPayload(response.data);
  },

  getCurrentUser: async (token) => {
    const response = await authClient.get('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return extractObjectPayload(response.data);
  },

  recoverPassword: async (email) => {
    const response = await authClient.post('/recover-password', { email });
    return extractObjectPayload(response.data);
  },

  loginWithGoogle: async (googleToken) => {
    const response = await authClient.post('/google', { token: googleToken });
    return extractObjectPayload(response.data);
  },
};
