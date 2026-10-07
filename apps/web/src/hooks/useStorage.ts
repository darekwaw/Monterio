'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface StorageField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'textarea' | 'checkbox';
  secret: boolean;
  required: boolean;
  placeholder: string | null;
  help: string | null;
}

export interface StorageProvider {
  provider: string;
  label: string;
  description: string;
  isCloud: boolean;
  fields: StorageField[];
  /** Zapisane wartości pól jawnych — sekretów tu nie ma. */
  values: Record<string, string>;
  /** Klucze sekretów, które mają już zapisaną wartość (sama wartość nigdy nie wraca z API). */
  secretsSet: string[];
  configured: boolean;
}

export interface StorageSettings {
  activeProvider: string;
  providers: StorageProvider[];
}

export interface StorageTestResult { success: boolean; error: string | null }
export interface StorageMigrateResult { succeeded: number; failed: number; errors: string[] }

export function useStorageSettings() {
  return useQuery({
    queryKey: ['storage'],
    queryFn: async () => (await apiClient.get<StorageSettings>('/api/storage')).data,
  });
}

export function useSaveStorage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { provider: string; values: Record<string, string> }) => {
      await apiClient.put('/api/storage', body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['storage'] }),
  });
}

export function useTestStorage() {
  return useMutation({
    mutationFn: async (body: { provider: string; values: Record<string, string> }) =>
      (await apiClient.post<StorageTestResult>('/api/storage/test', body)).data,
  });
}

export function useMigrateStorage() {
  return useMutation({
    mutationFn: async () => (await apiClient.post<StorageMigrateResult>('/api/storage/migrate')).data,
  });
}
