import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { queryKeys } from '../lib/queryClient';

// Specific ID provided for the demo/production data view
const DEMO_USER_ID = 'a9b05492-7393-4c77-a895-015b2c12781b';

export interface CallMetrics {
  id: number;
  user_id: string;
  created_at: string;
  total_apeluri: number;
  apeluri_initiate: number;
  apeluri_primite: number;
  rata_conversie: number;
  minute_consumate: number;
  total_comenzi: number;
  cosuri_abandonate: number;
  cosuri_recuperate: number;
  vanzari_generate: number;
  comenzi_confirmate: number;
}

async function fetchLatestMetrics(userId: string): Promise<CallMetrics | null> {
  try {
      const { data, error } = await supabase
        .from('call_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Changed to maybeSingle to handle 0 rows gracefully without error

      if (error) {
        console.error('Error fetching metrics:', error);
        return null;
      }
      return data;
  } catch (err) {
      console.error('Unexpected error fetching metrics:', err);
      return null;
  }
}

async function fetchMetricsHistory(userId: string, days: number = 7): Promise<CallMetrics[]> {
  try {
      const { data, error } = await supabase
        .from('call_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }) // Ascending for charts
        .limit(days);

      if (error) {
          console.error('Error fetching history:', error);
          return [];
      }
      return data || [];
  } catch (err) {
      console.error('Unexpected error fetching history:', err);
      return [];
  }
}

export const useDashboardMetrics = () => {
  // Use the specific demo ID to ensure we show the correct data regardless of auth state for this view
  const userId = DEMO_USER_ID;

  const latestQuery = useQuery({
    queryKey: queryKeys.dashboard.latest(userId),
    queryFn: () => fetchLatestMetrics(userId),
    enabled: !!userId,
    staleTime: 30_000, 
    retry: 1, 
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.dashboard.history(userId),
    queryFn: () => fetchMetricsHistory(userId),
    enabled: !!userId,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return {
    latestMetrics: latestQuery.data,
    historyMetrics: historyQuery.data || [],
    loading: latestQuery.isLoading || historyQuery.isLoading,
    error: latestQuery.error || historyQuery.error,
  };
};