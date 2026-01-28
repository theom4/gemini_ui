import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { queryKeys } from '../lib/queryClient';

export interface CallMetrics {
  id: number;
  user_id: string;
  created_at: string;
  total_apeluri: number;
  apeluri_initiate: number;
  apeluri_primite: number;
  rata_conversie: number;
  rata_conversie_drafturi: number;
  minute_consumate: number;
  total_comenzi: number;
  cosuri_abandonate: number;
  cosuri_recuperate: number;
  vanzari_generate: number;
  comenzi_confirmate: number;
  store_name?: string;
  nume_admin?: string;
}

async function fetchLatestMetrics(userId: string, storeName: string): Promise<CallMetrics | null> {
  if (!userId || !storeName) {
      console.warn('⏳ [useDashboardMetrics] Skipping fetch: userId or storeName missing.', { userId, storeName });
      return null;
  }
  
  try {
      console.log('📈 [useDashboardMetrics] Fetching latest metrics for:', { user_id: userId, store_name: storeName });
      
      const { data, error } = await supabase
        .from('call_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('store_name', storeName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ [useDashboardMetrics] Error fetching latest metrics:', error);
        return null;
      }
      
      if (data) {
          console.log('✅ [useDashboardMetrics] Latest Metrics Data Pulled:', data);
      } else {
          console.warn(`👀 [useDashboardMetrics] No records found in call_metrics for user: ${userId} and store: ${storeName}`);
      }
      return data;
  } catch (err) {
      console.error('💥 [useDashboardMetrics] Unexpected crash during fetch:', err);
      return null;
  }
}

async function fetchMetricsHistory(userId: string, storeName: string, days: number = 7): Promise<CallMetrics[]> {
  if (!userId || !storeName) return [];
  try {
      console.log(`📊 [useDashboardMetrics] Fetching history (${days} entries) for:`, { user_id: userId, store_name: storeName });
      const { data, error } = await supabase
        .from('call_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('store_name', storeName)
        .order('created_at', { ascending: false })
        .limit(days);

      if (error) {
          console.error('❌ [useDashboardMetrics] Error fetching history:', error);
          return [];
      }
      return (data || []).reverse();
  } catch (err) {
      console.error('💥 [useDashboardMetrics] History fetch error:', err);
      return [];
  }
}

export const useDashboardMetrics = (userId: string, storeName: string) => {
  const latestQuery = useQuery({
    queryKey: queryKeys.dashboard.latest(userId, storeName),
    queryFn: () => fetchLatestMetrics(userId, storeName),
    enabled: !!userId && !!storeName,
    staleTime: 30_000, 
    retry: 1, 
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.dashboard.history(userId, storeName),
    queryFn: () => fetchMetricsHistory(userId, storeName),
    enabled: !!userId && !!storeName,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return {
    latestMetrics: latestQuery.data,
    historyMetrics: historyQuery.data || [],
    loading: latestQuery.isLoading,
    historyLoading: historyQuery.isLoading,
    error: latestQuery.error || historyQuery.error,
  };
};
