/**
 * Fetches daily hotel performance data for a single date.
 * In mock mode: reads from scan output JSON.
 * In production: queries Supabase directly.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getPerformanceForDate } from '../lib/scan-performance-adapter';
import type { DailyHotelPerformance } from '../components/stoneriver/types';

const USE_MOCK = import.meta.env['VITE_MOCK'] === 'true';

export function usePerformanceData(date: string) {
  return useQuery({
    queryKey: ['stoneriver-perf', date],
    queryFn: async (): Promise<DailyHotelPerformance[]> => {
      if (USE_MOCK || !supabase) {
        return getPerformanceForDate(date);
      }
      const { data, error } = await supabase
        .from('daily_hotel_performance')
        .select('*')
        .eq('report_date', date);
      if (error) throw new Error(error.message);
      return (data ?? []) as DailyHotelPerformance[];
    },
    enabled: !!date,
    staleTime: 5 * 60 * 1000,
  });
}
