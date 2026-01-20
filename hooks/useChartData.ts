import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

const DEMO_USER_ID = 'a9b05492-7393-4c77-a895-015b2c12781b';

export type ChartPeriod = 'day' | 'week' | 'month';

interface ChartDataPoint {
  name: string;
  calls: number;
  orders: number;
  drafts: number;
  sales: number;
  fullDate?: string; // For sorting/merging
}

async function fetchChartData(userId: string, storeName: string, period: ChartPeriod): Promise<ChartDataPoint[]> {
  const now = new Date();
  let startDate = new Date();
  let dateFormat: Intl.DateTimeFormatOptions = { weekday: 'short' };

  // 1. Determine Date Range and Format
  if (period === 'day') {
    startDate.setHours(0, 0, 0, 0); // Start of today
    dateFormat = { hour: '2-digit', minute: '2-digit' };
  } else if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
    dateFormat = { weekday: 'short' };
  } else if (period === 'month') {
    startDate.setDate(now.getDate() - 30);
    dateFormat = { day: '2-digit', month: 'short' };
  }

  const startIso = startDate.toISOString();

  // 2. Fetch Call Recordings (For Call Counts) - Source of truth for Calls
  // We fetch only created_at to minimize data transfer
  const { data: recordings, error: recError } = await supabase
    .from('call_recordings')
    .select('created_at')
    .eq('user_id', userId)
    .eq('store_name', storeName)
    .gte('created_at', startIso)
    .order('created_at', { ascending: true });

  if (recError) {
    console.error('Error fetching recordings for chart:', recError);
    return [];
  }

  // 3. Fetch Call Metrics (For Orders, Drafts, Sales) - Daily summaries
  // Note: Metrics are typically daily. For 'day' view, we might not have hourly breakdown of sales/orders.
  const { data: metrics, error: metError } = await supabase
    .from('call_metrics')
    .select('created_at, comenzi_confirmate, cosuri_abandonate, vanzari_generate')
    .eq('user_id', userId)
    .eq('store_name', storeName)
    .gte('created_at', startIso)
    .order('created_at', { ascending: true });

  if (metError) {
    console.error('Error fetching metrics for chart:', metError);
  }

  // 4. Aggregate Data
  const groupedData: Record<string, ChartDataPoint> = {};

  // Initialize buckets based on period to ensure continuous axis
  if (period === 'day') {
    // 24 hours
    for (let i = 0; i < 24; i++) {
      const d = new Date(startDate);
      d.setHours(i, 0, 0, 0);
      const key = d.getHours().toString().padStart(2, '0') + ':00';
      groupedData[key] = { name: key, calls: 0, orders: 0, drafts: 0, sales: 0 };
    }
  } else {
    // Daily buckets
    const days = period === 'week' ? 7 : 30;
    for (let i = 0; i <= days; i++) {
       const d = new Date(startDate);
       d.setDate(d.getDate() + i);
       // Normalize key to YYYY-MM-DD for matching
       const key = d.toISOString().split('T')[0];
       const name = d.toLocaleDateString('ro-RO', dateFormat);
       groupedData[key] = { name, calls: 0, orders: 0, drafts: 0, sales: 0, fullDate: key };
    }
  }

  // Helper to get bucket key
  const getBucketKey = (dateStr: string) => {
    const d = new Date(dateStr);
    if (period === 'day') {
      return d.getHours().toString().padStart(2, '0') + ':00';
    } else {
      return dateStr.split('T')[0];
    }
  };

  // Fill Calls
  (recordings || []).forEach(rec => {
    const key = getBucketKey(rec.created_at);
    if (groupedData[key]) {
      groupedData[key].calls += 1;
    } else if (period !== 'day') {
        // Fallback for timezone issues or slightly out of bounds
        // Just ignore if not in initialized buckets or create new?
        // For chart stability, we ignore or map to nearest.
        // Let's rely on initialized buckets.
    }
  });

  // Fill Metrics (Orders, Drafts, Sales)
  // Metrics are assumed to be Daily. If period is 'day', we can't easily map daily metric to an hour.
  // Strategy: For 'day' view, spread the daily metric evenly? Or just show 0? 
  // User asked for "sales generated every day chart", implying daily granularity is key.
  // If period is 'day', we will likely see 0 for orders/sales/drafts unless metrics has hourly data (unlikely).
  // We will simply populate if key matches.
  (metrics || []).forEach(met => {
    const key = getBucketKey(met.created_at);
    // If period is 'day', metric.created_at might be '2023-10-27T10:00:00'.
    // If metrics are generated once a day, they will appear at a specific hour.
    if (groupedData[key]) {
      groupedData[key].orders += met.comenzi_confirmate || 0;
      groupedData[key].drafts += met.cosuri_abandonate || 0;
      groupedData[key].sales += met.vanzari_generate || 0;
    } else if (period === 'day') {
        // If the metric timestamp doesn't match an exact hour bucket (unlikely if strictly hourly),
        // we might miss it. But usually metrics are daily summaries. 
        // We'll leave it as is.
    }
  });

  // Convert to array
  let result = Object.values(groupedData);

  // Sort if needed (Week/Month usually rely on key order, but object iteration order isn't guaranteed)
  // Re-sort by date/time
  if (period === 'day') {
    result.sort((a, b) => parseInt(a.name) - parseInt(b.name));
  } else {
    result.sort((a, b) => (a.fullDate && b.fullDate ? a.fullDate.localeCompare(b.fullDate) : 0));
  }
  
  return result;
}

export const useChartData = (storeName: string, period: ChartPeriod) => {
  const userId = DEMO_USER_ID;

  return useQuery({
    queryKey: ['chart-data', userId, storeName, period],
    queryFn: () => fetchChartData(userId, storeName, period),
    staleTime: 60 * 1000, // 1 minute
  });
};
