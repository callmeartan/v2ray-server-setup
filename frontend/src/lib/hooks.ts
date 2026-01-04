import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ServerStatus, ServerConfig, UriResponse, PingResult } from '@/types/api';

// Server status query
export function useServerStatus() {
  return useQuery({
    queryKey: ['server-status'],
    queryFn: async (): Promise<ServerStatus> => {
      const response = await fetch('/api/server-status');
      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to fetch server status');
      }

      return result.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
  });
}

// Server config query
export function useServerConfig() {
  return useQuery({
    queryKey: ['server-config'],
    queryFn: async (): Promise<ServerConfig> => {
      const response = await fetch('/api/config');
      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to fetch server config');
      }

      return result.data;
    },
    retry: 3,
  });
}

// VLESS URIs query
export function useVlessUris(clientNames?: string[]) {
  const clientNamesParam = clientNames ? clientNames.join(',') : '';

  return useQuery({
    queryKey: ['vless-uris', clientNamesParam],
    queryFn: async (): Promise<UriResponse> => {
      const url = clientNamesParam ? `/api/uris?clientNames=${encodeURIComponent(clientNamesParam)}` : '/api/uris';
      const response = await fetch(url);
      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to generate VLESS URIs');
      }

      return result.data;
    },
    retry: 2,
  });
}

// Ping test query
export function usePingTest() {
  return useQuery({
    queryKey: ['ping-test'],
    queryFn: async (): Promise<PingResult> => {
      const response = await fetch('/api/ping');
      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to run ping tests');
      }

      return result.data;
    },
    refetchInterval: false, // Manual refetch only
    retry: 2,
  });
}

// Download config mutation
export function useDownloadConfig() {
  return useMutation({
    mutationFn: async (clientIndex: number): Promise<Blob> => {
      const response = await fetch(`/api/download?client=${clientIndex}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download config');
      }

      return response.blob();
    },
  });
}
