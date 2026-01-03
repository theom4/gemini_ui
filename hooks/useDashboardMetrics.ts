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
  store_name?: string;
}

async function fetchLatestMetrics(userId: string, storeName: string): Promise<CallMetrics | null> {
  try {
      const { data, error } = await supabase
        .from('call_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('store_name', storeName)
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

async function fetchMetricsHistory(userId: string, storeName: string, days: number = 7): Promise<CallMetrics[]> {
  try {
      const { data, error } = await supabase
        .from('call_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('store_name', storeName)
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

export const useDashboardMetrics = (storeName: string) => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const latestQuery = useQuery({
    queryKey: queryKeys.dashboard.latest(userId || '', storeName),
    queryFn: () => fetchLatestMetrics(userId!, storeName),
    enabled: !!userId && !!storeName,
    staleTime: 30_000, 
    retry: 1, 
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.dashboard.history(userId || '', storeName),
    queryFn: () => fetchMetricsHistory(userId!, storeName),
    enabled: !!userId && !!storeName,
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