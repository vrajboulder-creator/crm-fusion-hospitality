/**
 * Search bar that finds numbers across PDFs and opens a PDF viewer.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { searchPdfs, type PdfMatch } from '../../lib/pdf-search-index';
import { PdfViewerModal } from './PdfViewerModal';

interface PdfSearchBarProps {
  date: string;
}

export function PdfSearchBar({ date }: PdfSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PdfMatch[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [viewerMatches, setViewerMatches] = useState<PdfMatch[] | null>(null);
  const [viewerTerm, setViewerTerm] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowResults(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const matches = await searchPdfs(q, date);
    setResults(matches);
    setShowResults(matches.length > 0);
    setSearching(false);
  }, [date]);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  function openViewer(matches: PdfMatch[], term: string) {
    setViewerMatches(matches);
    setViewerTerm(term);
    setShowResults(false);
  }

  return (
    <>
      <div ref={ref} className="relative">
        <div className="flex items-center border border-[#e5e5e5] rounded bg-white focus-within:ring-1 focus-within:ring-[#1a1a1a]">
          <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#9ca3af] ml-2" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search value in PDFs..."
            className="text-xs px-2 py-1.5 bg-transparent outline-none w-[180px] text-[#1a1a1a] placeholder:text-[#9ca3af]"
          />
          {searching && (
            <div className="w-3 h-3 border-2 border-[#9ca3af] border-t-transparent rounded-full animate-spin mr-2" />
          )}
        </div>

        {/* Results dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e5e5] rounded shadow-lg z-30 w-[380px] max-h-[320px] overflow-y-auto">
            <div className="px-3 py-1.5 border-b border-[#e5e5e5] bg-[#f9fafb]">
              <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">
                {results.length} PDF{results.length !== 1 ? 's' : ''} found
              </span>
            </div>
            {results.map((m, i) => (
              <button
                key={`${m.filePath}-${i}`}
                onClick={() => openViewer(results, query)}
                className="w-full text-left px-3 py-2 hover:bg-[#f5f5f5] border-b border-[#f3f4f6] last:border-0"
              >
                <p className="text-[11px] font-medium text-[#1a1a1a] truncate">{m.fileName}</p>
                <p className="text-[10px] text-[#6b7280]">{m.reportType}{m.property ? ` — ${m.property}` : ''}</p>
                <p className="text-[10px] text-[#9ca3af] truncate mt-0.5">{m.snippet}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {viewerMatches && (
        <PdfViewerModal
          matches={viewerMatches}
          searchTerm={viewerTerm}
          onClose={() => setViewerMatches(null)}
        />
      )}
    </>
  );
}
