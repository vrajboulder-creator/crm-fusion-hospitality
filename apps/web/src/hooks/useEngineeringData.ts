/**
 * React Query hook for Engineering Flash data.
 * Mock mode: parses from output.json.
 * Production: queries Supabase engineering_ooo_rooms table.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { EngineeringFlashData, OOORoom } from '../components/stoneriver/engineering-types';
import { getEngineeringFlashForDate } from '../lib/engineering-adapter';
import { PROPERTIES } from '../constants/stoneriver-properties';

const USE_MOCK = import.meta.env['VITE_MOCK'] === 'true';

export function useEngineeringData(date: string) {
  return useQuery<EngineeringFlashData>({
    queryKey: ['engineering-flash', date],
    queryFn: async () => {
      if (USE_MOCK || !supabase) {
        return getEngineeringFlashForDate(date);
      }
      const { data, error } = await supabase
        .from('engineering_ooo_rooms')
        .select('*')
        .eq('report_date', date);
      if (error) throw new Error(error.message);

      const rows = (data ?? []) as Array<{
        property_name: string;
        room_number: string;
        date_ooo: string | null;
        reason: string | null;
        notes: string | null;
        is_long_term: boolean;
      }>;

      const oooRooms: OOORoom[] = [];
      const longTermRooms: OOORoom[] = [];

      for (const row of rows) {
        const room: OOORoom = {
          hotel: row.property_name,
          propertyName: row.property_name,
          roomNumber: row.room_number,
          dateOOO: row.date_ooo ?? '',
          reason: row.reason ?? '',
          notes: row.notes ?? '',
          isLongTerm: row.is_long_term,
        };
        if (row.is_long_term) longTermRooms.push(room);
        else oooRooms.push(room);
      }

      return { reportDate: date, oooRooms, longTermRooms };
    },
    enabled: !!date,
    staleTime: 5 * 60_000,
  });
}
