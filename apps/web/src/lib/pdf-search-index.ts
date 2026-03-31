/**
 * Builds a search index mapping numbers to PDF files that contain them.
 * Used by the Revenue Flash dashboard to let users click a number
 * and see which source PDFs contain that value.
 */

export interface PdfMatch {
  fileName: string;
  filePath: string;
  relativePath: string;
  reportType: string;
  property: string | null;
  dateFolder: string;
  /** Snippet of text around the match */
  snippet: string;
}

interface ScanResult {
  filePath?: string;
  relativePath?: string;
  fileName?: string;
  extension?: string;
  reportType?: string;
  property?: string | null;
  dateFolder: string;
  fullText?: string;
}

interface ScanOutput {
  scanRoot: string;
  results: ScanResult[];
}

let cachedData: ScanOutput | null = null;
let cachedScanRoot = '';

async function loadData(): Promise<ScanOutput> {
  if (cachedData) return cachedData;
  try {
    const res = await fetch('/data/output.json');
    if (!res.ok) return { scanRoot: '', results: [] };
    cachedData = (await res.json()) as ScanOutput;
    cachedScanRoot = cachedData.scanRoot;
    return cachedData;
  } catch {
    return { scanRoot: '', results: [] };
  }
}

/**
 * Search for a number/value across all PDF text for a given date.
 * Returns list of PDFs that contain the search term.
 */
export async function searchPdfs(query: string, date: string): Promise<PdfMatch[]> {
  if (!query || query.length < 2) return [];

  const data = await loadData();
  const matches: PdfMatch[] = [];

  // Normalize: create variants of the search query
  const cleaned = query.replace(/[$,%]/g, '').trim();
  const variants = new Set<string>();
  variants.add(cleaned);
  // Add comma-formatted variant (8075 → 8,075)
  if (/^\d{4,}$/.test(cleaned)) {
    variants.add(Number(cleaned).toLocaleString('en-US'));
  }
  // If input has commas, also search without (8,075 → 8075)
  if (cleaned.includes(',')) {
    variants.add(cleaned.replace(/,/g, ''));
  }

  const pdfs = data.results.filter(
    (r) => r.dateFolder === date && r.extension === '.pdf' && r.fullText,
  );

  for (const pdf of pdfs) {
    const text = pdf.fullText!;
    let found = false;
    let snippet = '';

    for (const v of variants) {
      const idx = text.indexOf(v);
      if (idx >= 0) {
        found = true;
        const start = Math.max(0, idx - 40);
        const end = Math.min(text.length, idx + v.length + 40);
        snippet = (start > 0 ? '...' : '') + text.slice(start, end).replace(/\n/g, ' ') + (end < text.length ? '...' : '');
        break;
      }
    }

    if (found) {
      matches.push({
        fileName: pdf.fileName ?? 'Unknown',
        filePath: pdf.filePath ?? '',
        relativePath: pdf.relativePath ?? '',
        reportType: pdf.reportType ?? 'Unknown',
        property: pdf.property ?? null,
        dateFolder: pdf.dateFolder,
        snippet,
      });
    }
  }

  return matches;
}

/**
 * Convert a file path from scan output to a URL the browser can fetch.
 * The Vite dev server serves PDFs via /pdfs/ prefix using a custom plugin.
 * Path: C:/.../OneDrive_2026-03-27/Revenue Flash/... → /pdfs/Revenue Flash/...
 */
export function pdfFileUrl(filePath: string): string {
  const marker = 'OneDrive_2026-03-27';
  const idx = filePath.indexOf(marker);
  if (idx >= 0) {
    const relativePath = filePath.slice(idx + marker.length + 1).replace(/\\/g, '/');
    return '/pdfs/' + encodeURIComponent(relativePath).replace(/%2F/g, '/');
  }
  return filePath;
}
