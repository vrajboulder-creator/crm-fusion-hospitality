/**
 * Subtotal and grand total rows for the Flash Report table.
 */

import { fmtCurrency, fmtRate, fmtPct, fmtNumber } from '../../lib/formatters';
import type { FlashReportProperty } from './flash-report-types';

interface TotalRowProps {
  rows: FlashReportProperty[];
  label?: string;
  showOps?: boolean;
  showRooms?: boolean;
  showAR?: boolean;
}

function computeTotals(rows: FlashReportProperty[]) {
  if (rows.length === 0) return null;

  const sum = (fn: (r: FlashReportProperty) => number | null) =>
    rows.reduce((s, r) => { const v = fn(r); return v != null ? s + v : s; }, 0);

  const avg = (fn: (r: FlashReportProperty) => number | null) => {
    const vals = rows.map(fn).filter((v): v is number => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  return {
    occ: avg((r) => r.occupancy_pct),
    adr: avg((r) => r.adr),
    revpar: avg((r) => r.revpar),
    room_rev: sum((r) => r.room_revenue),
    fb_rev: sum((r) => r.fb_revenue),
    rooms_occ: sum((r) => r.rooms_occupied),
    ooo: sum((r) => r.rooms_ooo),
    dirty: sum((r) => r.rooms_dirty),
    reserved: sum((r) => r.room_nights_reserved),
    no_shows: sum((r) => r.no_shows),
    ar_30: sum((r) => r.ar_up_to_30),
    ar_o30: sum((r) => r.ar_over_30),
    ar_o60: sum((r) => r.ar_over_60),
    ar_o90: sum((r) => r.ar_over_90),
    ar_o120: sum((r) => r.ar_over_120),
    ar_total: sum((r) => r.ar_total),
  };
}

const tc = 'px-1.5 py-1 text-right tabular-nums text-[11px] font-semibold text-[#1a1a1a]';

function TotalCells({ t, showOps = true, showRooms = true, showAR = true }: {
  t: NonNullable<ReturnType<typeof computeTotals>>;
  showOps?: boolean;
  showRooms?: boolean;
  showAR?: boolean;
}) {
  return (
    <>
      {showOps && <>
        <td className={`${tc} border-l border-[#e5e5e5]`}>{t.occ != null ? fmtPct(t.occ) : '—'}</td>
        <td className={tc}>{t.adr != null ? fmtRate(t.adr) : '—'}</td>
        <td className={tc}>{t.revpar != null ? fmtRate(t.revpar) : '—'}</td>
        <td className={tc}>{fmtCurrency(t.room_rev)}</td>
        <td className={tc}>{fmtCurrency(t.fb_rev)}</td>
      </>}
      {showRooms && <>
        <td className={`${tc} border-l border-[#e5e5e5]`}>{fmtNumber(t.rooms_occ)}</td>
        <td className={tc}>{fmtNumber(t.ooo)}</td>
        <td className={tc}>{fmtNumber(t.dirty)}</td>
        <td className={tc}>{fmtNumber(t.reserved)}</td>
        <td className={tc}>{fmtNumber(t.no_shows)}</td>
      </>}
      {showAR && <>
        <td className={`${tc} border-l border-[#e5e5e5]`}>{fmtCurrency(t.ar_30)}</td>
        <td className={tc}>{fmtCurrency(t.ar_o30)}</td>
        <td className={tc}>{fmtCurrency(t.ar_o60)}</td>
        <td className={tc}>{fmtCurrency(t.ar_o90)}</td>
        <td className={tc}>{fmtCurrency(t.ar_o120)}</td>
        <td className={tc}>{fmtCurrency(t.ar_total)}</td>
      </>}
    </>
  );
}

export function FlashSubtotalRow({ rows, label, showOps = true, showRooms = true, showAR = true }: TotalRowProps) {
  const t = computeTotals(rows);
  if (!t) return null;
  return (
    <tr className="bg-[#f3f4f6] border-b border-[#d1d5db]">
      <td className="px-2 py-1 text-[11px] font-bold text-[#374151] sticky left-0 bg-[#f3f4f6] z-[5] border-r border-[#e5e5e5] whitespace-nowrap">
        {label ?? 'Subtotal'}
      </td>
      <TotalCells t={t} showOps={showOps} showRooms={showRooms} showAR={showAR} />
    </tr>
  );
}

export function FlashGrandTotalRow({ rows, showOps = true, showRooms = true, showAR = true }: TotalRowProps) {
  const t = computeTotals(rows);
  if (!t) return null;
  return (
    <tr className="bg-[#e5e7eb] border-t-2 border-[#374151] font-bold">
      <td className="px-2 py-1.5 text-[11px] font-bold text-[#111827] sticky left-0 bg-[#e5e7eb] z-[5] border-r border-[#d1d5db] whitespace-nowrap">
        TOTAL: All Properties
      </td>
      <TotalCells t={t} showOps={showOps} showRooms={showRooms} showAR={showAR} />
    </tr>
  );
}
