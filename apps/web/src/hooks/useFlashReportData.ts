/**
 * React Query hook for Flash Report data.
 * Mock mode: parses from output.json.
 * Production: queries Supabase flash_report table.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { FlashReportProperty } from '../components/stoneriver/flash-report-types';
import { getFlashReportForDate } from '../lib/flash-report-adapter';

const USE_MOCK = import.meta.env['VITE_MOCK'] === 'true';

export function useFlashReportData(date: string) {
  return useQuery<FlashReportProperty[]>({
    queryKey: ['flash-report', date],
    queryFn: async () => {
      if (USE_MOCK || !supabase) {
        return getFlashReportForDate(date);
      }
      const { data, error } = await supabase
        .from('flash_report')
        .select('*')
        .eq('report_date', date);
      if (error) throw new Error(error.message);
      return (data ?? []) as FlashReportProperty[];
    },
    enabled: !!date,
    staleTime: 5 * 60_000,
  });
}
