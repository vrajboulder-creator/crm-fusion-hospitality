/**
 * Context for triggering PDF search from any cell value click.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { searchPdfs, type PdfMatch } from '../../lib/pdf-search-index';
import { PdfViewerModal } from './PdfViewerModal';

interface PdfSearchContextValue {
  /** Call this when a cell value is clicked — triggers search and opens viewer */
  searchAndOpen: (value: string) => void;
}

const Ctx = createContext<PdfSearchContextValue>({ searchAndOpen: () => {} });

export function usePdfSearch(): PdfSearchContextValue {
  return useContext(Ctx);
}

export function PdfSearchProvider({ date, children }: { date: string; children: React.ReactNode }) {
  const [matches, setMatches] = useState<PdfMatch[] | null>(null);
  const [term, setTerm] = useState('');

  const searchAndOpen = useCallback(async (value: string) => {
    const cleaned = value.replace(/[$,%]/g, '').trim();
    if (!cleaned || cleaned.length < 2) return;
    const results = await searchPdfs(cleaned, date);
    if (results.length > 0) {
      setMatches(results);
      setTerm(cleaned);
    }
  }, [date]);

  return (
    <Ctx.Provider value={{ searchAndOpen }}>
      {children}
      {matches && (
        <PdfViewerModal
          matches={matches}
          searchTerm={term}
          onClose={() => setMatches(null)}
        />
      )}
    </Ctx.Provider>
  );
}
