'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { MeasurementAttribute } from '@/types';

export function useMeasurementAttributes() {
  return useQuery({
    queryKey: ['measurement-attributes'],
    queryFn: async () => {
      const { data } = await apiClient.get<MeasurementAttribute[]>('/api/measurement-attributes');
      return data;
    },
  });
}

export function useCreateMeasurementAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; dataType: number; unit: string | null; minValue: number | null; maxValue: number | null; options: string | null }) => {
      const { data } = await apiClient.post<{ id: number }>('/api/measurement-attributes', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['measurement-attributes'] }),
  });
}

export function useUpdateMeasurementAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; name: string; dataType: number; unit: string | null; minValue: number | null; maxValue: number | null; options: string | null; isActive: boolean }) => {
      await apiClient.put(`/api/measurement-attributes/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['measurement-attributes'] }),
  });
}
