'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Address, Customer, CustomerDetail, PagedResult } from '@/types';

export function useCustomers(companyId: number, opts?: { search?: string; page?: number; pageSize?: number; enabled?: boolean }) {
  const { search, page = 1, pageSize = 50, enabled = true } = opts ?? {};
  const query = useQuery({
    queryKey: ['customers', companyId, search, page, pageSize],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<Customer>>('/api/customers', {
        params: { companyId, search: search || undefined, page, pageSize },
      });
      return data;
    },
    enabled: !!companyId && enabled,
    placeholderData: prev => prev,
  });
  return { ...query, customers: query.data?.items ?? [], totalCount: query.data?.totalCount ?? 0 };
}

export function useCustomerById(id: number | null) {
  return useQuery({
    queryKey: ['customers', 'detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get<CustomerDetail>(`/api/customers/${id}`);
      return data;
    },
    enabled: id != null,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { companyId: number; name: string; locationId: number | null; phone: string | null; email: string | null; address?: Omit<Address, 'id'> | null }) => {
      const { data } = await apiClient.post<{ id: number }>('/api/customers', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; name: string; phone: string | null; email: string | null; locationId: number | null; isActive: boolean; address?: Omit<Address, 'id'> | null }) => {
      await apiClient.put(`/api/customers/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}
