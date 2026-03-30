/**
 * Stoneriver HG — Revenue Flash Dashboard.
 * Morning view for leadership to review all 21 properties at a glance.
 * Matches the Revenue Flash PDF layout: Day / MTD / YTD side-by-side.
 */

import { useState, useMemo, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { fmtCurrency, fmtNumber } from '../lib/formatters';
import { usePerformanceData } from '../hooks/usePerformanceData';
import { useSparklineData } from '../hooks/useSparklineData';
import { PerformanceTable } from '../components/stoneriver/PerformanceTable';
import { PropertySparklines } from '../components/stoneriver/PropertySparklines';
import { ExportButton } from '../components/stoneriver/ExportButton';
import type { DailyHotelPerformance } from '../components/stoneriver/types';

const DEFAULT_DATE = format(subDays(new Date(), 1), 'yyyy-MM-dd');

export function StoneriverDashboardPage() {
  const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);

  // In mock mode, auto-detect the latest date with data from scan output
  useEffect(() => {
    if (import.meta.env['VITE_MOCK'] !== 'true') return;
    fetch('/data/output.json')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.results) return;
        const dates = [...new Set(data.results.map((r: { dateFolder?: string }) => r.dateFolder).filter(Boolean))] as string[];
        dates.sort();
        if (dates.length > 0) setSelectedDate(dates[dates.length - 1]!);
      })
      .catch(() => {});
  }, []);

  const { data: perfData = [], isLoading } = usePerformanceData(selectedDate);
  const { data: sparklineData = [] } = useSparklineData(selectedDate);

  // Build O(1) lookup map by property name
  const dataMap = useMemo<Map<string, DailyHotelPerformance>>(() => {
    return new Map(perfData.map((r) => [r.property_name, r]));
  }, [perfData]);

  // Portfolio summary pills
  const totalRoomsSold = perfData.reduce((s, r) => s + (r.total_rooms_sold ?? 0), 0);
  const totalRevenue = perfData.reduce((s, r) => s + (r.revenue_day ?? 0), 0);

  // Format the selected date for the header
  const displayDate = (() => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      return format(d, 'MM/dd/yyyy');
    } catch {
      return selectedDate;
    }
  })();

  return (
    <div className="min-h-screen bg-white">
      {/* Header bar */}
      <div className="sticky top-0 z-20 border-b border-[#e5e5e5] bg-white px-6 py-3 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-[#1a1a1a] tracking-tight">
            Fusion Hospitality Group — Revenue Flash
          </h1>
          <p className="text-[11px] text-[#6b7280]">
            Report Date: {displayDate}
          </p>
        </div>

        {/* Date picker */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={DEFAULT_DATE}
          className="text-xs border border-[#e5e5e5] px-2 py-1.5 text-[#1a1a1a] bg-white focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] rounded"
        />

        {/* Portfolio summary pills */}
        {perfData.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-[#f5f5f5] text-[#1a1a1a] font-semibold rounded tabular-nums">
              {perfData.length} properties
            </span>
            <span className="px-2 py-1 bg-[#f5f5f5] text-[#1a1a1a] font-semibold rounded tabular-nums">
              {fmtNumber(totalRoomsSold)} rooms
            </span>
            <span className="px-2 py-1 bg-[#f5f5f5] text-[#1a1a1a] font-semibold rounded tabular-nums">
              {fmtCurrency(totalRevenue)} day rev
            </span>
          </div>
        )}

        {/* Export */}
        <ExportButton date={selectedDate} period="day" dataMap={dataMap} />
      </div>

      {/* Main content */}
      <div className="px-4 py-4 space-y-8">
        {/* Revenue Flash table — all periods */}
        <PerformanceTable
          dataMap={dataMap}
          sparklineData={sparklineData}
          isLoading={isLoading}
          selectedDate={selectedDate}
        />

        {/* Sparklines panel — hidden on mobile */}
        <div className="hidden sm:block">
          <PropertySparklines sparklineData={sparklineData} />
        </div>
      </div>
    </div>
  );
}
