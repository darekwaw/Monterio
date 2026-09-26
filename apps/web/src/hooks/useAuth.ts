'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export interface EmployeeSession {
  employeeId: number;
  fullName: string;
  role: 'Dispatcher' | 'Installer';
  companyId: number | null;
  contractorId: number | null;
  expiresAt: number;
}

const TOKEN_KEY = 'monterio_token';
const DATA_KEY = 'monterio_employee';

export function getSession(): EmployeeSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as EmployeeSession;
    if (data.expiresAt <= Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (body: { loginIdentifier: string; password: string }) => {
      const { data } = await apiClient.post<{
        token: string; expiresIn: number; employeeId: number; fullName: string;
        role: 'Dispatcher' | 'Installer'; companyId: number | null; contractorId: number | null;
      }>('/api/auth/login', body);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(DATA_KEY, JSON.stringify({
        employeeId: data.employeeId, fullName: data.fullName, role: data.role,
        companyId: data.companyId, contractorId: data.contractorId,
        expiresAt: Date.now() + data.expiresIn * 1000,
      } satisfies EmployeeSession));
      router.push('/');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  return () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(DATA_KEY);
    qc.clear();
    router.push('/login');
  };
}
