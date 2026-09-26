'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PrintTemplate } from '@/types';

export function usePrintTemplates() {
  return useQuery({
    queryKey: ['print-templates'],
    queryFn: async () => {
      const { data } = await apiClient.get<PrintTemplate[]>('/api/print-templates');
      return data;
    },
  });
}

export function useCreatePrintTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; templateHtml: string }) => {
      const { data } = await apiClient.post<{ id: number }>('/api/print-templates', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['print-templates'] }),
  });
}

export function useUpdatePrintTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; name: string; templateHtml: string; isActive: boolean }) => {
      await apiClient.put(`/api/print-templates/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['print-templates'] }),
  });
}

export function useSetDefaultPrintTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/api/print-templates/${id}/set-default`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['print-templates'] }),
  });
}
