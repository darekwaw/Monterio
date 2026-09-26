'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Employee } from '@/types';

export function useEmployees(opts?: { companyId?: number; contractorId?: number; onlyActive?: boolean }) {
  return useQuery({
    queryKey: ['employees', opts],
    queryFn: async () => {
      const { data } = await apiClient.get<Employee[]>('/api/employees', { params: opts });
      return data;
    },
    enabled: opts?.companyId != null || opts?.contractorId != null,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { companyId: number | null; contractorId: number | null; fullName: string; loginIdentifier: string; password: string; phone?: string | null; email?: string | null }) => {
      const { data } = await apiClient.post<{ id: number }>('/api/employees', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; fullName: string; phone: string | null; email: string | null; isActive: boolean }) => {
      await apiClient.put(`/api/employees/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useSetEmployeePassword() {
  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      await apiClient.put(`/api/employees/${id}/password`, { newPassword });
    },
  });
}

export function useSetEmployeePin() {
  return useMutation({
    mutationFn: async ({ id, newPin }: { id: number; newPin: string }) => {
      await apiClient.put(`/api/employees/${id}/pin`, { newPin });
    },
  });
}
