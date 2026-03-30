/**
 * Fetches last 30 days of performance data for sparkline trend cards.
 * In mock mode: reads from scan output JSON.
 * In production: queries Supabase directly.
 */

import { useQuery } from '@tanstack/react-query';
import { subDays, format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { getSparklineData } from '../lib/scan-performance-adapter';
import type { SparklinePoint } from '../components/stoneriver/types';

const USE_MOCK = import.meta.env['VITE_MOCK'] === 'true';

export function useSparklineData(endDate: string) {
  return useQuery({
    queryKey: ['stoneriver-sparklines', endDate],
    queryFn: async (): Promise<SparklinePoint[]> => {
      if (USE_MOCK || !supabase) {
        return getSparklineData(endDate);
      }
      const startDate = format(subDays(new Date(endDate), 29), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_hotel_performance')
        .select('property_name, report_date, occupancy_day, revpar_day, revenue_day')
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as SparklinePoint[];
    },
    enabled: !!endDate,
    staleTime: 5 * 60 * 1000,
  });
}
