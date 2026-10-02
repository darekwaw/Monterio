'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { RequestAnalytics } from '@/types';

export interface AnalyticsFilters {
  companyId: number;
  fromDate: string;
  toDate: string;
  locationId?: number | null;
  serviceGroupId?: number | null;
  contractorId?: number | null;
}

export function useRequestAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['requests', 'analytics', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<RequestAnalytics>('/api/requests/analytics', {
        params: {
          companyId: filters.companyId,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          locationId: filters.locationId || undefined,
          serviceGroupId: filters.serviceGroupId || undefined,
          contractorId: filters.contractorId || undefined,
        },
      });
      return data;
    },
    placeholderData: prev => prev,
  });
}
