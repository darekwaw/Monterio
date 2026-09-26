'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Contractor, ServiceGroup } from '@/types';

export function useServiceGroups(locationId?: number) {
  return useQuery({
    queryKey: ['service-groups', locationId],
    queryFn: async () => {
      const { data } = await apiClient.get<ServiceGroup[]>('/api/service-groups', { params: { locationId } });
      return data;
    },
  });
}

export function useServiceGroupMembers(id: number | null) {
  return useQuery({
    queryKey: ['service-groups', id, 'members'],
    queryFn: async () => {
      const { data } = await apiClient.get<Contractor[]>(`/api/service-groups/${id}/members`);
      return data;
    },
    enabled: id != null,
  });
}

export function useCreateServiceGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { locationId: number; name: string }) => {
      const { data } = await apiClient.post<{ id: number }>('/api/service-groups', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-groups'] }),
  });
}

export function useUpdateServiceGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; name: string; isActive: boolean }) => {
      await apiClient.put(`/api/service-groups/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-groups'] }),
  });
}

export function useAddContractorToGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, contractorId }: { groupId: number; contractorId: number }) => {
      await apiClient.post(`/api/service-groups/${groupId}/members/${contractorId}`);
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ['service-groups', groupId, 'members'] });
      qc.invalidateQueries({ queryKey: ['service-groups'] });
    },
  });
}

export function useRemoveContractorFromGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, contractorId }: { groupId: number; contractorId: number }) => {
      await apiClient.delete(`/api/service-groups/${groupId}/members/${contractorId}`);
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ['service-groups', groupId, 'members'] });
      qc.invalidateQueries({ queryKey: ['service-groups'] });
    },
  });
}
