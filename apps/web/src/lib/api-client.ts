import axios from 'axios';
import { toast } from '@/lib/toast';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5020';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('monterio_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface ApiErrorBody {
  type?: string;
  message?: string;
}

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined') {
      const status: number | undefined = error.response?.status;
      const body: ApiErrorBody | undefined = error.response?.data;

      if (status === 401) {
        localStorage.removeItem('monterio_token');
        localStorage.removeItem('monterio_employee');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (!error.response) {
        toast('Brak połączenia z serwerem. Sprawdź czy API działa.', 'error');
      } else if (status === 409) {
        toast(body?.message ?? 'Rekord został zmieniony przez innego użytkownika. Odśwież dane.', 'warning');
      } else if (status === 422) {
        toast(body?.message ?? 'Operacja niedozwolona.', 'warning');
      } else if (status !== undefined && status >= 500) {
        toast('Błąd serwera. Spróbuj ponownie za chwilę.', 'error');
      }
    }
    return Promise.reject(error);
  }
);
