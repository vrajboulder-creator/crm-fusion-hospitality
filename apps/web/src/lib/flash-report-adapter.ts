/**
 * Data adapter for Flash Report — finds and parses actual Flash Report
 * files from output.json (xlsx preferred over pdf).
 */

import type { FlashReportProperty } from '../components/stoneriver/flash-report-types';
import { parseFlashReport } from './flash-report-parser';

interface ScanResult {
  dateFolder: string;
  property: string | null;
  fileName?: string;
  reportType?: string;
  fullText?: string;
  extension?: string;
}

interface ScanOutput {
  results: ScanResult[];
}

let cachedData: ScanOutput | null = null;

async function loadScanData(): Promise<ScanOutput> {
  if (cachedData) return cachedData;
  try {
    const res = await fetch('/data/output.json');
    if (!res.ok) return { results: [] };
    cachedData = (await res.json()) as ScanOutput;
    return cachedData;
  } catch {
    return { results: [] };
  }
}

export async function getFlashReportForDate(date: string): Promise<FlashReportProperty[]> {
  const data = await loadScanData();

  // Find Flash Report files: "Flash Report" in filename (not "Revenue Flash")
  const flashFiles = data.results.filter((r) => {
    if (r.dateFolder !== date) return false;
    if (!r.fullText) return false;
    const name = r.fileName?.toLowerCase() ?? '';
    return name.includes('flash report') && !name.includes('revenue');
  });

  if (flashFiles.length === 0) return [];

  // Prefer PDF over xlsx (PDF has exact precision for Occ%/ADR/RevPAR)
  flashFiles.sort((a, b) => {
    const aPdf = a.extension === '.pdf' ? 1 : 0;
    const bPdf = b.extension === '.pdf' ? 1 : 0;
    return bPdf - aPdf;
  });

  // Parse the best Flash Report file
  const best = flashFiles[0]!;
  return parseFlashReport(best.fullText!, date);
}
