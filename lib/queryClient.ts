import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized QueryClient Configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      networkMode: 'online',
      throwOnError: false,
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

export const queryKeys = {
  callMetrics: {
    all: ['call-metrics'] as const,
    latest: (userId: string) => ['call-metrics', 'latest', userId] as const,
    series: (userId: string, days: number) => ['call-metrics', 'series', userId, days] as const,
    unified: (userId: string) => ['call-metrics', 'unified', userId] as const,
  },
  callRecordings: {
    all: ['call-recordings'] as const,
    list: (userId: string, limit: number, offset: number) =>
      ['call-recordings', 'list', userId, limit, offset] as const,
    latest: (userId: string) => ['call-recordings', 'latest', userId] as const,
  },
  dashboard: {
    latest: (userId: string) => ['dashboard', 'latest', userId] as const,
    history: (userId: string) => ['dashboard', 'history', userId] as const,
  },
  admin: {
    users: ['admin', 'users'] as const,
  },
  profile: (userId: string) => ['profile', userId] as const,
} as const;

export const staleTimeConfig = {
  callMetricsSnapshot: 30_000,
  callMetricsHistorical: 5 * 60_000,
  adminUsers: 60_000,
  userProfile: 30 * 60_000,
  olderRecordings: 15 * 60_000,
} as const;

export const refetchIntervalConfig = {
  callMetricsPolling: 30_000,
  adminUsersPolling: 60_000,
  disabled: false,
} as const;