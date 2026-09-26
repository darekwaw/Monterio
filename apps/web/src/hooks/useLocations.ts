'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Address, Location } from '@/types';

export function useLocations(companyId: number) {
  return useQuery({
    queryKey: ['locations', companyId],
    queryFn: async () => {
      const { data } = await apiClient.get<Location[]>('/api/locations', { params: { companyId } });
      return data;
    },
    enabled: !!companyId,
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { companyId: number; name: string; parentId: number | null; address?: Omit<Address, 'id'> | null }) => {
      const { data } = await apiClient.post<{ id: number }>('/api/locations', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; name: string; isActive: boolean; address?: Omit<Address, 'id'> | null }) => {
      await apiClient.put(`/api/locations/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}
