/**
 * Types for the Flash Report dashboard.
 * The Flash Report is a single-date snapshot per property with
 * operating metrics, room status, and AR aging buckets.
 */

export interface FlashReportProperty {
  id: string;
  entity_name: string;
  property_name: string;
  property_group: string;
  report_date: string;

  occupancy_pct: number | null;
  adr: number | null;
  revpar: number | null;
  room_revenue: number | null;
  fb_revenue: number | null;

  rooms_occupied: number | null;
  rooms_ooo: number | null;
  rooms_dirty: number | null;
  room_nights_reserved: number | null;
  no_shows: number | null;

  ar_up_to_30: number | null;
  ar_over_30: number | null;
  ar_over_60: number | null;
  ar_over_90: number | null;
  ar_over_120: number | null;
  ar_total: number | null;
}
