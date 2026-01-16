import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// Specific ID provided for the recordings data view
const DEMO_USER_ID = 'a9b05492-7393-4c77-a895-015b2c12781b';

export interface CallRecording {
  id: number;
  user_id: string;
  created_at: string;
  duration_seconds: number | null;
  recording_url: string;
  phone_number: string | null;
  direction: string | null;
  store_name?: string;
  client_personal_id?: string | null;
}

async function fetchRecordingsByDateRange(
  userId: string,
  storeName: string,
  startDate: string,
  endDate: string,
  page: number,
  pageSize: number
): Promise<{ data: CallRecording[], count: number }> {
  // Append time to ensure full day coverage
  const startTimestamp = `${startDate}T00:00:00`;
  const endTimestamp = `${endDate}T23:59:59`;
  
  // Calculate range for pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('call_recordings')
    .select('id,user_id,created_at,duration_seconds,recording_url,phone_number,direction,store_name,client_personal_id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('store_name', storeName)
    .gte('created_at', startTimestamp)
    .lte('created_at', endTimestamp)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: (data as CallRecording[]) || [], count: count || 0 };
}

export const useCallRecordingsOptimized = (
  storeName: string, 
  startDate: string, 
  endDate: string,
  page: number = 1,
  pageSize: number = 10
) => {
  // Use fixed demo ID for visibility of specific data set requested
  const userId = DEMO_USER_ID;
  const queryClient = useQueryClient();
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery({
    queryKey: ['call-recordings', 'range', userId, storeName, startDate, endDate, page, pageSize],
    queryFn: () => fetchRecordingsByDateRange(userId, storeName, startDate, endDate, page, pageSize),
    enabled: !!userId && !!storeName && !!startDate && !!endDate,
    staleTime: 60_000,
    placeholderData: keepPreviousData, // Keep previous data while fetching new page to prevent flicker
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (!userId || !query.data) return;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const debouncedRefetch = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        console.log('[CallRecordings] New recording detected, refetching...');
        // Invalidate broadly to ensure counts update
        queryClient.invalidateQueries({ queryKey: ['call-recordings', 'range', userId, storeName, startDate, endDate] });
      }, 500);
    };

    const channel = supabase
      .channel(`call_recordings_range_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_recordings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Verify if the new recording belongs to the selected store
          if (payload.new && (payload.new as any).store_name === storeName) {
             console.log('[CallRecordings] New recording inserted:', payload.new);
             debouncedRefetch();
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [userId, queryClient, query.data, storeName, startDate, endDate]);

  return {
    recordings: query.data?.data || [],
    totalCount: query.data?.count || 0,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
  };
};