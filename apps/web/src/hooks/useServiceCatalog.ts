'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ServiceCatalogItem } from '@/types';

export function useServiceCatalog(onlyActive = true) {
  return useQuery({
    queryKey: ['service-catalog', onlyActive],
    queryFn: async () => {
      const { data } = await apiClient.get<ServiceCatalogItem[]>('/api/service-catalog', { params: { onlyActive } });
      return data;
    },
  });
}

export function useCreateServiceCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; description?: string | null }) => {
      const { data } = await apiClient.post<{ id: number }>('/api/service-catalog', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog'] }),
  });
}

export function useUpdateServiceCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; name: string; description: string | null; isActive: boolean }) => {
      await apiClient.put(`/api/service-catalog/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog'] }),
  });
}

export function useAddServiceActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, ...body }: { itemId: number; name: string; sortOrder?: number; measurementAttributeId?: number | null }) => {
      const { data } = await apiClient.post<{ id: number }>(`/api/service-catalog/${itemId}/activities`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog'] }),
  });
}

export function useUpdateServiceActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ activityId, ...body }: { activityId: number; name: string; sortOrder: number; measurementAttributeId: number | null }) => {
      await apiClient.put(`/api/service-catalog/activities/${activityId}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog'] }),
  });
}

export function useDeleteServiceActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: number) => {
      await apiClient.delete(`/api/service-catalog/activities/${activityId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog'] }),
  });
}
