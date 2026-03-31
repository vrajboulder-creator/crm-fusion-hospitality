/**
 * React Query hook for Flash Report data.
 */

import { useQuery } from '@tanstack/react-query';
import type { FlashReportProperty } from '../components/stoneriver/flash-report-types';
import { getFlashReportForDate } from '../lib/flash-report-adapter';

export function useFlashReportData(date: string) {
  return useQuery<FlashReportProperty[]>({
    queryKey: ['flash-report', date],
    queryFn: () => getFlashReportForDate(date),
    enabled: !!date,
    staleTime: 5 * 60_000,
  });
}
