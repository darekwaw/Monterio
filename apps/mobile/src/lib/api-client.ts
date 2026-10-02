import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { getSession, clearSession } from '@/lib/auth-storage';

export { API_URL };

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  const session = await getSession();
  if (session) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await clearSession();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);
