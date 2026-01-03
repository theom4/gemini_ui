import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from '../contexts/AuthContext';

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
        .maybeSingle(); 

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
        .order('created_at', { ascending: false }) // Get latest first
        .limit(days);

      if (error) {
          console.error('Error fetching history:', error);
          return [];
      }
      // Reverse to chronological order for charts
      return (data || []).reverse();
  } catch (err) {
      console.error('Unexpected error fetching history:', err);
      return [];
  }
}

export const useDashboardMetrics = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const latestQuery = useQuery({
    queryKey: queryKeys.dashboard.latest(userId || ''),
    queryFn: () => fetchLatestMetrics(userId!),
    enabled: !!userId,
    staleTime: 30_000, 
    retry: 1, 
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.dashboard.history(userId || ''),
    queryFn: () => fetchMetricsHistory(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return {
    latestMetrics: latestQuery.data,
    historyMetrics: historyQuery.data || [],
    loading: latestQuery.isLoading, // Only block specific widgets on latest query
    historyLoading: historyQuery.isLoading,
    error: latestQuery.error || historyQuery.error,
  };
};