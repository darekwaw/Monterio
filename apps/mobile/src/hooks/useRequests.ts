import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PagedResult, RequestDetail, RequestListItem } from '@/types';

export function useMyRequests(status?: number) {
  const query = useQuery({
    queryKey: ['requests', 'mine', status],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<RequestListItem>>('/api/requests/mine', {
        params: { status, page: 1, pageSize: 100 },
      });
      return data;
    },
    // Instalator nie ma push-notyfikacji (jeszcze), więc lista sama odpytuje się co 30s —
    // uzupełnione o natychmiastowe odświeżenie przy powrocie z tła, patrz useForegroundRefetch.
    refetchInterval: 30_000,
  });
  return { ...query, requests: query.data?.items ?? [] };
}

export function useRequestById(id: number | null) {
  return useQuery({
    queryKey: ['requests', 'detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get<RequestDetail>(`/api/requests/${id}`);
      return data;
    },
    enabled: id != null,
    refetchInterval: 30_000,
  });
}

function invalidateRequest(qc: ReturnType<typeof useQueryClient>, id: number) {
  qc.invalidateQueries({ queryKey: ['requests', 'detail', id] });
  qc.invalidateQueries({ queryKey: ['requests', 'mine'] });
}

export function useClaimRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: number) => {
      await apiClient.post(`/api/requests/${requestId}/claim`);
    },
    onSuccess: (_, requestId) => invalidateRequest(qc, requestId),
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

/** Link/QR do publicznej strony oceny (patrz PublicRatingController na backendzie) — ocenę
 * wystawia klient sam, na własnym telefonie skanując kod wyświetlony na ekranie instalatora,
 * nigdy przez wpisanie jej bezpośrednio w tej appce. */
export function useRatingLink(requestId: number | null) {
  return useQuery({
    queryKey: ['requests', 'rating-link', requestId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ url: string }>(`/api/requests/${requestId}/rating-link`);
      return data.url;
    },
    enabled: requestId != null,
    staleTime: Infinity,
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
    mutationFn: async ({ requestId, uri, name, mimeType }: {
      requestId: number; uri: string; name: string; mimeType: string;
    }) => {
      const form = new FormData();
      form.append('file', { uri, name, type: mimeType } as unknown as Blob);
      const { data } = await apiClient.post<{ id: number }>(`/api/requests/${requestId}/attachments`, form);
      return data;
    },
    onSuccess: (_, { requestId }) => invalidateRequest(qc, requestId),
  });
}
