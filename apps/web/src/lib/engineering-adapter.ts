/**
 * Data adapter for Engineering Flash — finds consolidated Engineering Flash
 * files from output.json.
 */

import type { EngineeringFlashData } from '../components/stoneriver/engineering-types';
import { parseEngineeringFlash } from './engineering-parser';

interface ScanResult {
  dateFolder: string;
  fileName?: string;
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

export async function getEngineeringFlashForDate(date: string): Promise<EngineeringFlashData> {
  const data = await loadScanData();

  // Find consolidated Engineering Flash (largest file with "Engineering Flash" in name)
  const engFiles = data.results
    .filter((r) => {
      if (r.dateFolder !== date || !r.fullText) return false;
      const name = r.fileName?.toLowerCase() ?? '';
      return name.includes('engineering flash') && !name.includes('template');
    })
    .sort((a, b) => (b.fullText?.length ?? 0) - (a.fullText?.length ?? 0));

  if (engFiles.length === 0) {
    return { reportDate: date, oooRooms: [], longTermRooms: [] };
  }

  return parseEngineeringFlash(engFiles[0]!.fullText!, date);
}
