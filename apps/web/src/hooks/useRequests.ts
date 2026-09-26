'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Address, PagedResult, RequestDetail, RequestListItem } from '@/types';

export function useRequests(companyId: number, opts?: {
  status?: number; serviceGroupId?: number; contractorId?: number; employeeId?: number;
  search?: string; page?: number; pageSize?: number;
}) {
  const { page = 1, pageSize = 50, ...rest } = opts ?? {};
  const query = useQuery({
    queryKey: ['requests', companyId, rest, page, pageSize],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<RequestListItem>>('/api/requests', {
        params: { companyId, page, pageSize, ...rest },
      });
      return data;
    },
    enabled: !!companyId,
    placeholderData: prev => prev,
  });
  return { ...query, requests: query.data?.items ?? [], totalCount: query.data?.totalCount ?? 0 };
}

export function useRequestById(id: number | null) {
  return useQuery({
    queryKey: ['requests', 'detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get<RequestDetail>(`/api/requests/${id}`);
      return data;
    },
    enabled: id != null,
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      companyId: number; customerId: number; description?: string | null;
      locationId?: number | null; scheduledDate?: string | null; serviceCatalogItemIds?: number[];
      address?: Omit<Address, 'id'> | null;
    }) => {
      const { data } = await apiClient.post<{ id: number }>('/api/requests', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  });
}

function invalidateRequest(qc: ReturnType<typeof useQueryClient>, id: number) {
  qc.invalidateQueries({ queryKey: ['requests', 'detail', id] });
  qc.invalidateQueries({ queryKey: ['requests'], exact: false });
}

export function useAddRequestActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, serviceCatalogItemId }: { requestId: number; serviceCatalogItemId: number }) => {
      const { data } = await apiClient.post<{ id: number }>(`/api/requests/${requestId}/activities`, { serviceCatalogItemId });
      return data;
    },
    onSuccess: (_, { requestId }) => invalidateRequest(qc, requestId),
  });
}

export function useRemoveRequestActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, activityId }: { requestId: number; activityId: number }) => {
      await apiClient.delete(`/api/requests/${requestId}/activities/${activityId}`);
    },
    onSuccess: (_, { requestId }) => invalidateRequest(qc, requestId),
  });
}

export function useAssignRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, ...body }: { requestId: number; serviceGroupId: number | null; contractorId: number | null; employeeId: number | null }) => {
      await apiClient.post(`/api/requests/${requestId}/assign`, body);
    },
    onSuccess: (_, { requestId }) => invalidateRequest(qc, requestId),
  });
}

export function useChangeRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: number }) => {
      await apiClient.put(`/api/requests/${requestId}/status`, { status });
    },
    onSuccess: (_, { requestId }) => invalidateRequest(qc, requestId),
  });
}

export function useSetScheduledDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, scheduledDate }: { requestId: number; scheduledDate: string | null }) => {
      await apiClient.put(`/api/requests/${requestId}/scheduled-date`, { scheduledDate });
    },
    onSuccess: (_, { requestId }) => invalidateRequest(qc, requestId),
  });
}

export function useSetCompletionDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, completionDate }: { requestId: number; completionDate: string | null }) => {
      await apiClient.put(`/api/requests/${requestId}/completion-date`, { completionDate });
    },
    onSuccess: (_, { requestId }) => invalidateRequest(qc, requestId),
  });
}

export function useSetRequestAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, address }: { requestId: number; address: Omit<Address, 'id'> | null }) => {
      await apiClient.put(`/api/requests/${requestId}/address`, { address });
    },
    onSuccess: (_, { requestId }) => invalidateRequest(qc, requestId),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, activityId, taskId }: { requestId: number; activityId: number; taskId: number }) => {
      await apiClient.post(`/api/requests/${requestId}/activities/${activityId}/tasks/${taskId}/toggle`);
    },
    onSuccess: (_, { requestId }) => invalidateRequest(qc, requestId),
  });
}

export function useCompleteMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, activityId, taskId, ...body }: {
      requestId: number; activityId: number; taskId: number;
      valueDecimal?: number | null; valueText?: string | null; valueBoolean?: boolean | null; valueDate?: string | null;
    }) => {
      const { data } = await apiClient.post<{ isDone: boolean; isOutOfRange: boolean }>(
        `/api/requests/${requestId}/activities/${activityId}/tasks/${taskId}/measurement`, body);
      return data;
    },
    onSuccess: (_, { requestId }) => invalidateRequest(qc, requestId),
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, file }: { requestId: number; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await apiClient.post<{ id: number }>(`/api/requests/${requestId}/attachments`, form);
      return data;
    },
    onSuccess: (_, { requestId }) => invalidateRequest(qc, requestId),
  });
}
