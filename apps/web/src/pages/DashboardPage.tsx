/**
 * Portfolio dashboard — KPI strip, property grid, revenue summary.
 * Date range slicer: From date → To date. Shows aggregated data for the range.
 */

import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/20/solid';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { PROPERTIES, GROUP_ORDER } from '../constants/stoneriver-properties';
import { fmtCurrency, fmtRate, fmtPct, fmtNumber, yoyChange } from '../lib/formatters';
import type { DailyHotelPerformance } from '../components/stoneriver/types';

const TODAY = format(new Date(), 'yyyy-MM-dd');

function occColor(v: number | null): string {
  if (v == null) return 'text-[#9ca3af]';
  if (v >= 70) return 'text-[#1a1a1a]';
  if (v >= 50) return 'text-[#dc2626]';
  return 'text-[#dc2626] font-bold';
}

function fmtDateLabel(d: string): string {
  try { return format(new Date(d + 'T00:00:00'), 'MMM d, yyyy'); }
  catch { return d; }
}

/** Fetch all available dates */
function useAvailableDates() {
  return useQuery({
    queryKey: ['available-dates'],
    queryFn: async (): Promise<string[]> => {
      if (!supabase) return [];
      const { data } = await supabase
        .from('daily_hotel_performance')
        .select('report_date')
        .order('report_date', { ascending: true });
      if (!data) return [];
      const unique = [...new Set(data.map((r) => r.report_date as string))].sort();
      // Always include today
      if (!unique.includes(TODAY)) unique.push(TODAY);
      return unique.sort();
    },
    staleTime: 60_000,
  });
}

/** Fetch performance data for a date range */
function useRangePerformanceData(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['range-performance', startDate, endDate],
    queryFn: async (): Promise<DailyHotelPerformance[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('daily_hotel_performance')
        .select('*')
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as DailyHotelPerformance[];
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });
}

export function DashboardPage() {
  const { data: availableDates = [] } = useAvailableDates();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Auto-select full range when dates load
  useEffect(() => {
    if (availableDates.length > 0) {
      setStartDate(availableDates[0]!);
      setEndDate(availableDates[availableDates.length - 1]!);
    }
  }, [availableDates]);

  const { data: rangeData = [], isLoading } = useRangePerformanceData(startDate, endDate);

  const isSingleDay = startDate === endDate;
  const datesInRange = useMemo(() => {
    return [...new Set(rangeData.map((r) => r.report_date as string))].sort();
  }, [rangeData]);

  // Aggregate by property
  const propertyAgg = useMemo(() => {
    const map = new Map<string, {
      totalRevenue: number; totalPyRevenue: number; totalRoomsSold: number; totalOOO: number;
      occSum: number; adrSum: number; revparSum: number; count: number;
      latestOcc: number | null; latestAdr: number | null; latestRevpar: number | null;
      latestRevenue: number | null; latestPyRevenue: number | null; latestOOO: number | null;
    }>();
    for (const r of rangeData) {
      const existing = map.get(r.property_name) ?? {
        totalRevenue: 0, totalPyRevenue: 0, totalRoomsSold: 0, totalOOO: 0,
        occSum: 0, adrSum: 0, revparSum: 0, count: 0,
        latestOcc: null, latestAdr: null, latestRevpar: null,
        latestRevenue: null, latestPyRevenue: null, latestOOO: null,
      };
      existing.totalRevenue += r.revenue_day ?? 0;
      existing.totalPyRevenue += r.py_revenue_day ?? 0;
      existing.totalRoomsSold += r.total_rooms_sold ?? 0;
      existing.totalOOO += r.ooo_rooms ?? 0;
      if (r.occupancy_day != null) { existing.occSum += r.occupancy_day; existing.count += 1; }
      if (r.adr_day != null) existing.adrSum += r.adr_day;
      if (r.revpar_day != null) existing.revparSum += r.revpar_day;
      // For single day, store the values directly
      if (existing.latestOcc === null) {
        existing.latestOcc = r.occupancy_day ?? null;
        existing.latestAdr = r.adr_day ?? null;
        existing.latestRevpar = r.revpar_day ?? null;
        existing.latestRevenue = r.revenue_day ?? null;
        existing.latestPyRevenue = r.py_revenue_day ?? null;
        existing.latestOOO = r.ooo_rooms ?? null;
      }
      map.set(r.property_name, existing);
    }
    return map;
  }, [rangeData]);

  // KPI aggregates
  const totalRevenue = rangeData.reduce((s, r) => s + (r.revenue_day ?? 0), 0);
  const totalPyRevenue = rangeData.reduce((s, r) => s + (r.py_revenue_day ?? 0), 0);
  const totalRoomsSold = rangeData.reduce((s, r) => s + (r.total_rooms_sold ?? 0), 0);
  const totalOOO = rangeData.reduce((s, r) => s + (r.ooo_rooms ?? 0), 0);
  const avgOcc = rangeData.length > 0
    ? rangeData.reduce((s, r) => s + (r.occupancy_day ?? 0), 0) / rangeData.length
    : null;
  const avgAdr = rangeData.length > 0
    ? rangeData.reduce((s, r) => s + (r.adr_day ?? 0), 0) / rangeData.length
    : null;
  const avgRevpar = rangeData.length > 0
    ? rangeData.reduce((s, r) => s + (r.revpar_day ?? 0), 0) / rangeData.length
    : null;
  const revChange = yoyChange(totalRevenue, totalPyRevenue);

  const displayDate = (() => {
    if (isSingleDay) {
      try { return format(new Date(startDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy'); }
      catch { return startDate; }
    }
    return `${fmtDateLabel(startDate)} — ${fmtDateLabel(endDate)} (${datesInRange.length} days)`;
  })();

  // Quick preset buttons
  function setPreset(preset: 'today' | 'latest' | 'last7' | 'all') {
    if (availableDates.length === 0) return;
    const sorted = [...availableDates].sort();
    switch (preset) {
      case 'today':
        setStartDate(TODAY);
        setEndDate(TODAY);
        break;
      case 'latest':
        setStartDate(sorted[sorted.length - 1]!);
        setEndDate(sorted[sorted.length - 1]!);
        break;
      case 'last7': {
        const last7 = sorted.slice(-7);
        setStartDate(last7[0]!);
        setEndDate(last7[last7.length - 1]!);
        break;
      }
      case 'all':
        setStartDate(sorted[0]!);
        setEndDate(sorted[sorted.length - 1]!);
        break;
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#1a1a1a] tracking-tight">Portfolio Overview</h1>
          <p className="text-xs text-[#9ca3af] mt-0.5">{displayDate}</p>
        </div>
      </div>

      {/* Date Range Slicer */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 border border-[#e5e5e5] rounded bg-white">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 text-xs border border-[#e5e5e5] rounded bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 text-xs border border-[#e5e5e5] rounded bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="h-5 w-px bg-[#e5e5e5]" />
        <div className="flex items-center gap-1.5">
          {[
            { label: 'Today', preset: 'today' as const },
            { label: 'Latest', preset: 'latest' as const },
            { label: 'Last 7', preset: 'last7' as const },
            { label: 'All', preset: 'all' as const },
          ].map((btn) => (
            <button
              key={btn.preset}
              onClick={() => setPreset(btn.preset)}
              className="px-2.5 py-1 text-[10px] font-medium rounded border border-[#e5e5e5] text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#1a1a1a] transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>
        {datesInRange.length > 0 && (
          <span className="text-[10px] text-[#9ca3af] ml-auto">
            {datesInRange.length} {datesInRange.length === 1 ? 'day' : 'days'} with data
          </span>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <KpiTile label={isSingleDay ? "Day's Revenue" : 'Total Revenue'} value={fmtCurrency(totalRevenue)} change={revChange} loading={isLoading} />
        <KpiTile label="Avg Occupancy" value={avgOcc != null ? fmtPct(avgOcc) : '—'} loading={isLoading} valueColor={avgOcc != null && avgOcc < 70 ? 'text-[#dc2626]' : 'text-[#1a1a1a]'} />
        <KpiTile label="Avg ADR" value={avgAdr != null ? fmtRate(avgAdr) : '—'} loading={isLoading} />
        <KpiTile label="Avg RevPAR" value={avgRevpar != null ? fmtRate(avgRevpar) : '—'} loading={isLoading} />
        <KpiTile label="Rooms Sold" value={fmtNumber(totalRoomsSold)} subValue={totalOOO > 0 ? `${totalOOO} OOO` : undefined} loading={isLoading} />
      </div>

      {/* Revenue summary bar */}
      <div className="flex items-center gap-4 mb-6 p-4 border border-[#e5e5e5] rounded bg-white">
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">
            {isSingleDay ? 'Revenue — Selected Date' : `Revenue — ${datesInRange.length} Days`}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-lg font-bold text-[#1a1a1a] tabular-nums">{fmtCurrency(totalRevenue)}</span>
            <span className="text-xs text-[#6b7280]">current</span>
            <span className="text-sm text-[#9ca3af] tabular-nums">{fmtCurrency(totalPyRevenue)}</span>
            <span className="text-xs text-[#9ca3af]">prior year</span>
          </div>
        </div>
        <Link to="/stoneriver/revenue-flash" className="text-xs font-medium text-[#2563eb] hover:underline">
          View Full Report →
        </Link>
      </div>

      {/* Properties Grid */}
      <h2 className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
        Properties {!isSingleDay && propertyAgg.size > 0 && `(${propertyAgg.size} with data)`}
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#f5f5f5] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GROUP_ORDER.map((group) => {
            const groupProps = PROPERTIES.filter((p) => p.group === group);
            return groupProps.map((prop) => {
              const agg = propertyAgg.get(prop.name);
              if (!agg) return (
                <PropertyCard key={prop.name} name={prop.name} group={prop.group} city={prop.city} state={prop.state}
                  occ={null} adr={null} revpar={null} revenue={null} ooo={null} change={null} />
              );
              if (isSingleDay) {
                const change = yoyChange(agg.latestRevenue, agg.latestPyRevenue);
                return (
                  <PropertyCard key={prop.name} name={prop.name} group={prop.group} city={prop.city} state={prop.state}
                    occ={agg.latestOcc} adr={agg.latestAdr} revpar={agg.latestRevpar}
                    revenue={agg.latestRevenue} ooo={agg.latestOOO} change={change} />
                );
              }
              const avgO = agg.count > 0 ? agg.occSum / agg.count : null;
              const avgA = agg.count > 0 ? agg.adrSum / agg.count : null;
              const avgR = agg.count > 0 ? agg.revparSum / agg.count : null;
              const change = yoyChange(agg.totalRevenue, agg.totalPyRevenue);
              return (
                <PropertyCard key={prop.name} name={prop.name} group={prop.group} city={prop.city} state={prop.state}
                  occ={avgO} adr={avgA} revpar={avgR} revenue={agg.totalRevenue}
                  ooo={agg.totalOOO > 0 ? agg.totalOOO : null} change={change}
                  label={`${agg.count} days avg`} />
              );
            });
          })}
        </div>
      )}
    </div>
  );
}

/** Property card */
function PropertyCard({ name, group, city, state, occ, adr, revpar, revenue, ooo, change, label }: {
  name: string; group: string; city: string; state: string;
  occ: number | null; adr: number | null; revpar: number | null;
  revenue: number | null; ooo: number | null; change: number | null;
  label?: string;
}) {
  return (
    <div className="border border-[#e5e5e5] rounded p-4 bg-white hover:border-[#1a1a1a] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#1a1a1a] truncate">{name}</h3>
          <p className="text-[10px] text-[#9ca3af] mt-0.5">{group} · {city}, {state}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {label && <span className="text-[9px] text-[#9ca3af] bg-[#f3f4f6] px-1.5 py-0.5 rounded">{label}</span>}
          {ooo != null && ooo > 0 && (
            <span className="text-[10px] font-semibold text-[#dc2626] bg-[#fef2f2] px-1.5 py-0.5 rounded">
              {ooo} OOO
            </span>
          )}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <dt className="text-[10px] text-[#9ca3af]">Occupancy</dt>
          <dd className={clsx('text-sm font-medium tabular-nums mt-0.5', occColor(occ))}>
            {occ != null ? fmtPct(occ) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] text-[#9ca3af]">ADR</dt>
          <dd className="text-sm font-medium text-[#1a1a1a] tabular-nums mt-0.5">
            {adr != null ? fmtRate(adr) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] text-[#9ca3af]">RevPAR</dt>
          <dd className="text-sm font-medium text-[#1a1a1a] tabular-nums mt-0.5">
            {revpar != null ? fmtRate(revpar) : '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-3 pt-3 border-t border-[#f3f4f6] flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#9ca3af]">Revenue</p>
          <p className="text-sm font-semibold text-[#1a1a1a] tabular-nums">
            {revenue != null ? fmtCurrency(revenue) : '—'}
          </p>
        </div>
        {change != null && (
          <div className={clsx('inline-flex items-center gap-1 text-xs font-medium', change >= 0 ? 'text-[#1a1a1a]' : 'text-[#dc2626]')}>
            {change >= 0 ? <ArrowTrendingUpIcon className="w-3.5 h-3.5" /> : <ArrowTrendingDownIcon className="w-3.5 h-3.5" />}
            {change >= 0 ? '+' : ''}{change.toFixed(1)}% YoY
          </div>
        )}
      </div>
    </div>
  );
}

/** KPI tile */
function KpiTile({ label, value, subValue, change, loading, valueColor }: {
  label: string;
  value: string;
  subValue?: string | undefined;
  change?: number | null | undefined;
  loading?: boolean | undefined;
  valueColor?: string | undefined;
}) {
  return (
    <div className="border border-[#e5e5e5] rounded px-4 py-3 bg-white">
      <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">{label}</p>
      {loading ? (
        <div className="mt-2 h-6 w-24 bg-[#f5f5f5] rounded animate-pulse" />
      ) : (
        <p className={clsx('mt-1 text-xl font-semibold tabular-nums', valueColor ?? 'text-[#1a1a1a]')}>{value}</p>
      )}
      {subValue && <p className="text-xs text-[#dc2626] mt-0.5 font-medium">{subValue}</p>}
      {change != null && (
        <div className={clsx('inline-flex items-center gap-1 mt-1 text-xs font-medium', change >= 0 ? 'text-[#1a1a1a]' : 'text-[#dc2626]')}>
          {change >= 0 ? <ArrowTrendingUpIcon className="w-3.5 h-3.5" /> : <ArrowTrendingDownIcon className="w-3.5 h-3.5" />}
          {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs PY
        </div>
      )}
    </div>
  );
}
