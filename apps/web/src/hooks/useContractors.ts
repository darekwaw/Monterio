'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Address, Contractor } from '@/types';

export function useContractors(onlyActive = false) {
  return useQuery({
    queryKey: ['contractors', onlyActive],
    queryFn: async () => {
      const { data } = await apiClient.get<Contractor[]>('/api/contractors', { params: { onlyActive } });
      return data;
    },
  });
}

export function useCreateContractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; taxId: string | null; phone: string | null; email: string | null; address?: Omit<Address, 'id'> | null }) => {
      const { data } = await apiClient.post<{ id: number }>('/api/contractors', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contractors'] }),
  });
}

export function useUpdateContractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; name: string; taxId: string | null; phone: string | null; email: string | null; isActive: boolean; address?: Omit<Address, 'id'> | null }) => {
      await apiClient.put(`/api/contractors/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contractors'] }),
  });
}
