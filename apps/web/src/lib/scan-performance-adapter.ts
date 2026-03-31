/**
 * Transforms scan output into DailyHotelPerformance rows
 * for the Stoneriver performance dashboard (mock mode).
 *
 * Primary source: Revenue Flash reports (structured table with Day/MTD/YTD).
 * Fallback: scattered KPIs from individual report files.
 */

import type { DailyHotelPerformance, SparklinePoint } from '../components/stoneriver/types';
import { ROOM_INVENTORY } from '../constants/stoneriver-properties';
import { parseRevenueFlash, type PropertyPerformance } from './revenue-flash-parser';

interface ScanResult {
  dateFolder: string;
  property: string | null;
  reportType?: string;
  fullText?: string;
  contentPreview?: string;
  kpis?: {
    occupancyPct?: number;
    adr?: number;
    revpar?: number;
    roomsSold?: number;
    totalRevenue?: number;
    roomRevenue?: number;
    oooRooms?: number;
  };
}

interface ScanOutput {
  results: ScanResult[];
}

const GROUP_MAP: Record<string, string> = {
  'HGI Olive Branch': 'Hilton',
  'Tru By Hilton Tupelo': 'Hilton',
  'Hampton Inn Vicksburg': 'Hilton',
  'DoubleTree Biloxi': 'Hilton',
  'Home2 Suites By Hilton': 'Hilton',
  'Hilton Garden Inn Madison': 'Hilton',
  'Hilton Garden Inn Meridian': 'Hilton',
  'Hampton Inn Meridian': 'Hilton',
  'Holiday Inn Meridian': 'IHG',
  'Candlewood Suites': 'IHG',
  'Holiday Inn Express Fulton': 'IHG',
  'Holiday Inn Express Memphis Southwind': 'IHG',
  'Holiday Inn Express Tupelo': 'IHG',
  'Holiday Inn Tupelo': 'IHG',
  'Four Points Memphis Southwind': 'Marriott',
  'TownePlace Suites': 'Marriott',
  'Best Western Tupelo': 'Best Western',
  'SureStay Hotel': 'Best Western',
  'Best Western Plus Olive Branch': 'Best Western',
  'Hyatt Place Biloxi': 'Hyatt',
  'Comfort Inn Tupelo': 'Choice',
};

let cachedData: ScanOutput | null = null;

async function loadScanData(): Promise<ScanOutput> {
  if (cachedData) return cachedData;
  try {
    const res = await fetch('/data/output.json');
    if (!res.ok) return { results: [] };
    cachedData = await res.json() as ScanOutput;
    return cachedData;
  } catch {
    return { results: [] };
  }
}

/**
 * Extract performance data from Revenue Flash reports for a given date.
 * Returns a map of property_name -> PropertyPerformance.
 */
function extractRevenueFlashData(
  data: ScanOutput,
  date: string,
): Map<string, PropertyPerformance> {
  const result = new Map<string, PropertyPerformance>();

  // Find Revenue Flash files for this date (prefer PDF over xlsx)
  const rfFiles = data.results
    .filter((r) => r.dateFolder === date && r.reportType === 'Revenue Flash' && r.fullText)
    .sort((a, b) => (b.fullText?.length ?? 0) - (a.fullText?.length ?? 0));

  for (const rf of rfFiles) {
    if (!rf.fullText) continue;
    const parsed = parseRevenueFlash(rf.fullText, date);

    for (const prop of parsed.properties) {
      // Only store if we don't have this property yet (first/longest file wins)
      if (!result.has(prop.property_name)) {
        result.set(prop.property_name, prop);
      }
    }
  }

  return result;
}

/**
 * Compute rooms available using actual inventory when known,
 * falling back to rooms_sold / (occ% / 100) when not.
 */
function computeRoomsAvailable(propertyName: string, p: PropertyPerformance): number | null {
  const inventory = ROOM_INVENTORY[propertyName];
  if (inventory != null && p.ooo_rooms != null) {
    return inventory - p.ooo_rooms;
  }
  if (p.total_rooms_sold != null && p.occupancy_day != null && p.occupancy_day > 0) {
    return Math.round(p.total_rooms_sold / (p.occupancy_day / 100));
  }
  return null;
}

function toDailyPerf(
  propertyName: string,
  date: string,
  p: PropertyPerformance,
): DailyHotelPerformance {
  return {
    id: `${propertyName}-${date}`,
    property_name: propertyName,
    property_group: GROUP_MAP[propertyName] ?? 'Other',
    report_date: date,

    occupancy_day: p.occupancy_day,
    occupancy_mtd: p.occupancy_mtd,
    occupancy_ytd: p.occupancy_ytd,

    adr_day: p.adr_day,
    adr_mtd: p.adr_mtd,
    adr_ytd: p.adr_ytd,

    revpar_day: p.revpar_day,
    revpar_mtd: p.revpar_mtd,
    revpar_ytd: p.revpar_ytd,

    total_rooms_sold: p.total_rooms_sold,
    total_rooms_available: computeRoomsAvailable(propertyName, p),
    ooo_rooms: p.ooo_rooms,

    revenue_day: p.revenue_day,
    revenue_mtd: p.revenue_mtd,
    revenue_ytd: p.revenue_ytd,

    py_revenue_day: p.py_revenue_day,
    py_revenue_mtd: p.py_revenue_mtd,
    py_revenue_ytd: p.py_revenue_ytd,

    report_format: 'revenue-flash',
    extracted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

export async function getPerformanceForDate(date: string): Promise<DailyHotelPerformance[]> {
  const data = await loadScanData();

  // Primary: parse Revenue Flash reports
  const rfData = extractRevenueFlashData(data, date);

  const rows: DailyHotelPerformance[] = [];
  for (const [propName, perf] of rfData) {
    rows.push(toDailyPerf(propName, date, perf));
  }

  return rows;
}

export async function getSparklineData(endDate: string): Promise<SparklinePoint[]> {
  const data = await loadScanData();
  const points: SparklinePoint[] = [];

  // Get all dates
  const allDates = [...new Set(data.results.map((r) => r.dateFolder).filter(Boolean))].sort();

  // Filter to 30-day window
  const end = new Date(endDate);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  const startStr = start.toISOString().slice(0, 10);
  const datesInRange = allDates.filter((d) => d >= startStr && d <= endDate);

  for (const date of datesInRange) {
    const rfData = extractRevenueFlashData(data, date);
    for (const [propName, perf] of rfData) {
      points.push({
        property_name: propName,
        report_date: date,
        occupancy_day: perf.occupancy_day,
        revpar_day: perf.revpar_day,
        revenue_day: perf.revenue_day,
      });
    }
  }

  return points.sort((a, b) => a.report_date.localeCompare(b.report_date));
}
