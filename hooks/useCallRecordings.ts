import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryClient';

// Specific ID provided for the recordings data view
const DEMO_USER_ID = '0945e2c4-543d-4ade-bd5e-58f72a9627c4';

export interface CallRecording {
  id: number;
  user_id: string;
  created_at: string;
  duration_seconds: number | null;
  recording_url: string;
  phone_number: string | null;
  direction: string | null;
}

async function fetchLatestRecordings(
  userId: string,
  limit: number = 10
): Promise<CallRecording[]> {
  const { data, error } = await supabase
    .from('call_recordings')
    .select('id,user_id,created_at,duration_seconds,recording_url,phone_number,direction')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as CallRecording[]) || [];
}

export const useCallRecordingsOptimized = (limit: number = 10) => {
  // Use fixed demo ID for visibility of specific data set requested
  const userId = DEMO_USER_ID;
  const queryClient = useQueryClient();
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery({
    queryKey: queryKeys.callRecordings.latest(userId),
    queryFn: () => fetchLatestRecordings(userId, limit),
    enabled: !!userId,
    staleTime: 60_000,
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
        queryClient.invalidateQueries({ queryKey: queryKeys.callRecordings.latest(userId) });
      }, 500);
    };

    const channel = supabase
      .channel(`call_recordings_optimized_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_recordings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[CallRecordings] New recording inserted:', payload.new);
          debouncedRefetch();
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
  }, [userId, queryClient, query.data]);

  return {
    recordings: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
  };
};

export const useCallRecordingsInfinite = (pageSize: number = 10) => {
  const userId = DEMO_USER_ID;

  const query = useInfiniteQuery({
    queryKey: queryKeys.callRecordings.list(userId, pageSize, 0),
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('call_recordings')
        .select('id,user_id,created_at,duration_seconds,recording_url,phone_number,direction', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(pageParam as number, (pageParam as number) + pageSize - 1);

      if (error) throw error;

      return {
        recordings: (data as CallRecording[]) || [],
        nextCursor: data && data.length === pageSize ? (pageParam as number) + pageSize : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
    staleTime: 5 * 60_000,
    initialPageParam: 0,
  });

  const allRecordings = query.data?.pages.flatMap((page) => page.recordings) || [];

  return {
    recordings: allRecordings,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};