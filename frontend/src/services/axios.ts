import { router } from 'expo-router';
import axios from 'axios';
import { getToken, setToken } from '@/src/services/tokenStorage';
import { BASE_URL } from '@/constants';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await getToken();
        if (!token) throw new Error('No token found');

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.userId;

        const { data } = await api.get(`/updateTokens/${userId}`);
        if (data.result) {
          await setToken(data.result);

          originalRequest.headers.Authorization = `Bearer ${data.result}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        router.replace('/(auth)/login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;