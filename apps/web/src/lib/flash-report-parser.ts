/**
 * Parses Flash Report xlsx/pdf text (tab-separated, properties as columns)
 * into structured per-property data.
 *
 * Format: rows are metrics, columns are properties.
 * Entity Name, DBA, Date headers, then metric rows.
 * Two sections in the same file (section 1: 14 props, section 2: 7 props).
 */

import { PROPERTIES } from '../constants/stoneriver-properties';
import type { FlashReportProperty } from '../components/stoneriver/flash-report-types';

/** Map DBA aliases from Flash Report to canonical property names */
const DBA_MAP: Record<string, string> = {
  'best western plus tupelo': 'Best Western Tupelo',
  'hie fulton': 'Holiday Inn Express Fulton',
  'surestay tupelo': 'SureStay Hotel',
  'holiday inn tupelo': 'Holiday Inn Tupelo',
  'comfort inn': 'Comfort Inn Tupelo',
  'candlewood tupelo': 'Candlewood Suites',
  'hie tupelo': 'Holiday Inn Express Tupelo',
  'home2 suites tupelo': 'Home2 Suites By Hilton',
  'tru by hilton tupelo': 'Tru By Hilton Tupelo',
  'tps olive branch': 'TownePlace Suites',
  'hgi olive branch': 'HGI Olive Branch',
  'holiday inn meridian': 'Holiday Inn Meridian',
  'hampton inn meridian': 'Hampton Inn Meridian',
  'hgi meridian': 'Hilton Garden Inn Meridian',
  'hyatt place biloxi': 'Hyatt Place Biloxi',
  'best western plus desoto': 'Best Western Plus Olive Branch',
  'hie memphis southwind': 'Holiday Inn Express Memphis Southwind',
  'four points memphis southwind': 'Four Points Memphis Southwind',
  'hgi madison': 'Hilton Garden Inn Madison',
  'hampton inn vicksburg': 'Hampton Inn Vicksburg',
  'doubletree biloxi': 'DoubleTree Biloxi',
};

function resolveName(dba: string): string | null {
  const lower = dba.toLowerCase().trim();
  return DBA_MAP[lower] ?? null;
}

function parseNum(s: string): number | null {
  if (!s || s === 'NA' || s === 'N/A' || s === '-' || s.trim() === '') return null;
  let cleaned = s.replace(/[$,%\s]/g, '').replace(/,/g, '');
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  const v = parseFloat(cleaned);
  return isNaN(v) ? null : v;
}

interface ColumnData {
  entityName: string;
  dba: string;
  canonicalName: string | null;
  values: Map<string, string>;
}

/**
 * Parse a Flash Report section (tab-separated text with properties as columns).
 * Returns array of parsed column data.
 */
/** Split a line into cells — handles both tab-separated (xlsx) and multi-space (PDF) */
function splitLine(line: string): { label: string; cells: string[] } {
  const hasTabs = line.includes('\t');
  if (hasTabs) {
    const parts = line.split('\t');
    const label = parts[0]?.trim() ?? '';
    const secondCell = parts[1]?.trim() ?? '';
    // xlsx: label in [0] or [1], data from [2]
    const effectiveLabel = label || secondCell;
    const dataStart = label ? 2 : 2; // data always starts at index 2 for xlsx
    return { label: effectiveLabel, cells: parts.slice(dataStart).map((c) => c.trim()) };
  }
  // PDF: split on 3+ spaces
  const parts = line.split(/\s{3,}/).map((s) => s.trim()).filter(Boolean);
  return { label: parts[0] ?? '', cells: parts.slice(1) };
}

function parseSection(lines: string[]): ColumnData[] {
  let entityRow: string[] = [];
  let dbaRow: string[] = [];
  const metricRows: Array<{ label: string; cells: string[] }> = [];

  for (const line of lines) {
    const { label, cells } = splitLine(line);

    if (label === 'Entity Name') {
      entityRow = cells;
    } else if (label === 'DBA') {
      dbaRow = cells;
    } else if (label === 'Date' || label.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      // skip date row
    } else if (label === 'Total') {
      metricRows.push({ label: 'AR Total', cells });
    } else if (/^[-$]/.test(label) && cells.length > 0 && !/^[A-Za-z]/.test(label)) {
      // Unlabeled AR total row in PDF: starts with dollar value like "$114,638.73"
      const allValues = line.split(/\s{3,}/).map((s) => s.trim()).filter(Boolean);
      metricRows.push({ label: 'AR Total', cells: allValues });
    } else if (label && cells.length > 0) {
      metricRows.push({ label, cells });
    } else if (!label && line.trim()) {
      // Unlabeled row with data (AR total in section 1 of xlsx)
      const rawCells = line.includes('\t')
        ? line.split('\t').slice(2).map((c) => c.trim())
        : line.split(/\s{3,}/).map((s) => s.trim()).filter(Boolean);
      if (rawCells.length > 0) {
        metricRows.push({ label: 'AR Total', cells: rawCells });
      }
    }
  }

  if (dbaRow.length === 0) return [];

  // Build column data for each property (skip empty and "Total" columns)
  const columns: ColumnData[] = [];
  for (let i = 0; i < dbaRow.length; i++) {
    const dba = dbaRow[i] ?? '';
    const entity = entityRow[i] ?? '';
    if (!dba || dba === 'Total') continue;

    const canonical = resolveName(dba);
    const values = new Map<string, string>();
    for (const row of metricRows) {
      const val = row.cells[i] ?? '';
      if (val) values.set(row.label, val);
    }

    columns.push({ entityName: entity, dba, canonicalName: canonical, values });
  }

  return columns;
}

/**
 * Parse Flash Report text into structured property data.
 * Handles two-section format (section 1 + section 2 in same file).
 */
export function parseFlashReport(text: string, reportDate: string): FlashReportProperty[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const results: FlashReportProperty[] = [];
  const seen = new Set<string>();

  // Split into sections by finding "Entity Name" headers
  const sections: string[][] = [];
  let currentSection: string[] = [];

  for (const line of lines) {
    if (line.startsWith('Entity Name')) {
      if (currentSection.length > 0) sections.push(currentSection);
      currentSection = [line];
    } else {
      currentSection.push(line);
    }
  }
  if (currentSection.length > 0) sections.push(currentSection);

  for (const section of sections) {
    const columns = parseSection(section);

    for (const col of columns) {
      const name = col.canonicalName;
      if (!name || seen.has(name)) continue;
      seen.add(name);

      const v = col.values;
      const prop = PROPERTIES.find((p) => p.name === name);

      // Occupancy: xlsx stores as decimal (0.71 → 71%), PDF as percentage (70.8%)
      const occRaw = v.get('Occupancy %') ?? '';
      let occ = parseNum(occRaw);
      if (occ != null && occ > 0 && occ <= 1) occ = Math.round(occ * 1000) / 10;
      // PDF values already in percentage form (70.8) — no conversion needed

      results.push({
        id: `${name}-${reportDate}`,
        entity_name: col.entityName || prop?.entityName || '',
        property_name: name,
        property_group: prop?.group ?? 'Other',
        report_date: reportDate,
        occupancy_pct: occ,
        adr: parseNum(v.get('ADR') ?? ''),
        revpar: parseNum(v.get('RevPAR') ?? ''),
        room_revenue: parseNum(v.get('Room Revenue') ?? ''),
        fb_revenue: parseNum(v.get('F&B Revenue') ?? ''),
        rooms_occupied: parseNum(v.get('Rooms Occupied') ?? ''),
        rooms_ooo: parseNum(v.get('Rooms OOO') ?? ''),
        rooms_dirty: parseNum(v.get('Rooms Dirty') ?? ''),
        room_nights_reserved: parseNum(v.get('Room Nights Reserved Today') ?? ''),
        no_shows: parseNum(v.get('No Shows') ?? ''),
        ar_up_to_30: parseNum(v.get('Accounts Up to 30 Days') ?? ''),
        ar_over_30: parseNum(v.get('Accounts Over 30 Days') ?? ''),
        ar_over_60: parseNum(v.get('Accounts Over 60 Days') ?? ''),
        ar_over_90: parseNum(v.get('Accounts Over 90 Days') ?? ''),
        ar_over_120: parseNum(v.get('Accounts Over 120 Days') ?? ''),
        ar_total: parseNum(v.get('AR Total') ?? ''),
      });
    }
  }

  // Compute AR total if not already parsed from the file
  for (const r of results) {
    if (r.ar_total != null) continue;
    const arParts = [r.ar_up_to_30, r.ar_over_30, r.ar_over_60, r.ar_over_90, r.ar_over_120];
    const hasAny = arParts.some((v) => v != null);
    if (hasAny) {
      r.ar_total = arParts.reduce<number>((s, v) => s + (v ?? 0), 0);
    }
  }

  return results;
}
