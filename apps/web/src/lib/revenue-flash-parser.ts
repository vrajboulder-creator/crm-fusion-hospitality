/**
 * Parses Revenue Flash report text (from OCR or native PDF extraction)
 * into structured per-property performance data.
 *
 * Revenue Flash format has 3 sections per row: Date (Day), MTD, YTD
 * Each section has: Occ%, ADR, RevPAR, [TotalRooms, Revenue, OOO, PYRevenue, Variance (day only)]
 *                                        Revenue, PY Revenue, Variance (MTD/YTD)
 */

export interface PropertyPerformance {
  property_name: string;

  occupancy_day: number | null;
  adr_day: number | null;
  revpar_day: number | null;
  total_rooms_sold: number | null;
  revenue_day: number | null;
  ooo_rooms: number | null;
  py_revenue_day: number | null;

  occupancy_mtd: number | null;
  adr_mtd: number | null;
  revpar_mtd: number | null;
  revenue_mtd: number | null;
  py_revenue_mtd: number | null;

  occupancy_ytd: number | null;
  adr_ytd: number | null;
  revpar_ytd: number | null;
  revenue_ytd: number | null;
  py_revenue_ytd: number | null;
}

export interface RevenueFlashData {
  reportDate: string;
  properties: PropertyPerformance[];
}

/** Known property names that appear in Revenue Flash */
const KNOWN_PROPERTIES = [
  'Candlewood Suites',
  'Holiday Inn Express Fulton',
  'Holiday Inn Express Memphis Southwind',
  'Holiday Inn Express Tupelo',
  'Holiday Inn Tupelo',
  'Four Points Memphis Southwind',
  'Best Western Tupelo',
  'Surestay Tupelo',
  'SureStay Tupelo',
  'Hyatt Place Biloxi',
  'Comfort Inn Tupelo',
  'Hilton Garden Inn Olive Branch',
  'TownePlace Suites',
  'Best Western Plus Olive Branch',
  'Home 2 Suites by Hilton Tupelo',
  'Home2 Suites by Hilton Tupelo',
  'Tru by Hilton Tupelo',
  'Holiday Inn Meridian',
  'Hilton Garden Inn Meridian',
  'Hampton Inn Meridian',
  'Hampton Inn Vicksburg',
  'DoubleTree Biloxi',
  'Hilton Garden Inn Madison',
];

/** Map Revenue Flash names to canonical display names */
const NAME_MAP: Record<string, string> = {
  'Candlewood Suites': 'Candlewood Suites',
  'Holiday Inn Express Fulton': 'Holiday Inn Express Fulton',
  'Holiday Inn Express Memphis Southwind': 'Holiday Inn Express Memphis Southwind',
  'Holiday Inn Express Tupelo': 'Holiday Inn Express Tupelo',
  'Holiday Inn Tupelo': 'Holiday Inn Tupelo',
  'Four Points Memphis Southwind': 'Four Points Memphis Southwind',
  'Best Western Tupelo': 'Best Western Tupelo',
  'Surestay Tupelo': 'SureStay Hotel',
  'SureStay Tupelo': 'SureStay Hotel',
  'Hyatt Place Biloxi': 'Hyatt Place Biloxi',
  'Comfort Inn Tupelo': 'Comfort Inn Tupelo',
  'Hilton Garden Inn Olive Branch': 'HGI Olive Branch',
  'TownePlace Suites': 'TownePlace Suites',
  'Best Western Plus Olive Branch': 'Best Western Plus Olive Branch',
  'Home 2 Suites by Hilton Tupelo': 'Home2 Suites By Hilton',
  'Home2 Suites by Hilton Tupelo': 'Home2 Suites By Hilton',
  'Tru by Hilton Tupelo': 'Tru By Hilton Tupelo',
  'Holiday Inn Meridian': 'Holiday Inn Meridian',
  'Hilton Garden Inn Meridian': 'Hilton Garden Inn Meridian',
  'Hampton Inn Meridian': 'Hampton Inn Meridian',
  'Hampton Inn Vicksburg': 'Hampton Inn Vicksburg',
  'DoubleTree Biloxi': 'DoubleTree Biloxi',
  'Hilton Garden Inn Madison': 'Hilton Garden Inn Madison',
};

function parseNum(s: string | undefined): number | null {
  if (!s) return null;
  // Remove $, commas, parens (negative), % signs
  let cleaned = s.replace(/[$,%\s]/g, '').replace(/,/g, '');
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  const v = parseFloat(cleaned);
  return isNaN(v) ? null : v;
}

function parsePct(s: string | undefined): number | null {
  if (!s) return null;
  const hasPercentSign = s.includes('%');
  const v = parseFloat(s.replace(/[%\s]/g, ''));
  if (isNaN(v) || v < 0) return null;
  // Excel stores occupancy as decimal fraction (0.90 = 90%), PDF stores as percentage (90.0%)
  if (!hasPercentSign && v > 0 && v <= 1) return v * 100;
  return v > 100 ? null : v;
}

/**
 * Parse Revenue Flash text into structured data.
 * Handles both native PDF text extraction and OCR output.
 */
export function parseRevenueFlash(text: string, reportDate: string): RevenueFlashData {
  const properties: PropertyPerformance[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try to match a property line FIRST (before skip logic, since property names
    // like "Best Western Tupelo" and "Hilton Garden Inn" start with brand names)
    let matchedProp: string | null = null;
    let remainder = '';

    for (const prop of KNOWN_PROPERTIES) {
      // Case-insensitive match, allowing for OCR variations
      const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^${escaped}[.,]?\\s*(?:MS\\.?|TN\\.?)?\\s*`, 'i');
      const m = trimmed.match(regex);
      if (m) {
        matchedProp = prop;
        remainder = trimmed.slice(m[0].length).trim();
        break;
      }
    }

    // Skip header/group/total/subtotal lines (only if no property matched)
    if (!matchedProp) {
      if (/^(IHG|Hilton|Marriott|Best Western|Hyatt|Choice|Total|TOTAL|Date|MTD|YTD|OOO|Occ|Fusion|\d{1,2}\/)/i.test(trimmed)) continue;
      continue; // not a property line either
    }
    const canonicalName = NAME_MAP[matchedProp] ?? matchedProp;

    // Parse the numbers from the remainder
    // Extract all number-like tokens: percentages, dollar amounts, plain numbers, negative in parens
    const tokens = remainder.match(/\(?\$?[\d,]+\.?\d*%?\)?/g) ?? [];

    if (tokens.length < 8) continue; // Need at least Day section

    // Day section: Occ%, ADR, RevPAR, TotalRooms, Revenue, OOO, PYRevenue, Variance
    const occ_day = parsePct(tokens[0]);
    const adr_day = parseNum(tokens[1]);
    const revpar_day = parseNum(tokens[2]);
    const rooms_sold = parseNum(tokens[3]);
    const revenue_day = parseNum(tokens[4]);
    const ooo = parseNum(tokens[5]);
    const py_rev_day = parseNum(tokens[6]);
    // tokens[7] = variance (skip)

    // MTD section (offset 8): Occ%, ADR, RevPAR, Revenue, PYRevenue, Variance
    const occ_mtd = tokens.length > 8 ? parsePct(tokens[8]) : null;
    const adr_mtd = tokens.length > 9 ? parseNum(tokens[9]) : null;
    const revpar_mtd = tokens.length > 10 ? parseNum(tokens[10]) : null;
    const revenue_mtd = tokens.length > 11 ? parseNum(tokens[11]) : null;
    const py_rev_mtd = tokens.length > 12 ? parseNum(tokens[12]) : null;
    // tokens[13] = variance (skip)

    // YTD section (offset 14): Occ%, ADR, RevPAR, Revenue, PYRevenue, Variance
    const occ_ytd = tokens.length > 14 ? parsePct(tokens[14]) : null;
    const adr_ytd = tokens.length > 15 ? parseNum(tokens[15]) : null;
    const revpar_ytd = tokens.length > 16 ? parseNum(tokens[16]) : null;
    const revenue_ytd = tokens.length > 17 ? parseNum(tokens[17]) : null;
    const py_rev_ytd = tokens.length > 18 ? parseNum(tokens[18]) : null;

    // Skip if this looks like a duplicate (group subtotal row with same property name)
    if (properties.some((p) => p.property_name === canonicalName)) continue;

    properties.push({
      property_name: canonicalName,
      occupancy_day: occ_day,
      adr_day: adr_day,
      revpar_day: revpar_day,
      total_rooms_sold: rooms_sold,
      revenue_day: revenue_day,
      ooo_rooms: ooo,
      py_revenue_day: py_rev_day,
      occupancy_mtd: occ_mtd,
      adr_mtd: adr_mtd,
      revpar_mtd: revpar_mtd,
      revenue_mtd: revenue_mtd,
      py_revenue_mtd: py_rev_mtd,
      occupancy_ytd: occ_ytd,
      adr_ytd: adr_ytd,
      revpar_ytd: revpar_ytd,
      revenue_ytd: revenue_ytd,
      py_revenue_ytd: py_rev_ytd,
    });
  }

  return { reportDate, properties };
}
