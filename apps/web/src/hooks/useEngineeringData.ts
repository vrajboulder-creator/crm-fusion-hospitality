/**
 * React Query hook for Engineering Flash data.
 */

import { useQuery } from '@tanstack/react-query';
import type { EngineeringFlashData } from '../components/stoneriver/engineering-types';
import { getEngineeringFlashForDate } from '../lib/engineering-adapter';

export function useEngineeringData(date: string) {
  return useQuery<EngineeringFlashData>({
    queryKey: ['engineering-flash', date],
    queryFn: () => getEngineeringFlashForDate(date),
    enabled: !!date,
    staleTime: 5 * 60_000,
  });
}
