/**
 * Document Library — browse scanned hotel report files.
 * Reads from scan output.json (no API server needed).
 * Left: property + category filters. Middle: searchable file list. Right: preview.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  TableCellsIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ScannedFile {
  filePath: string;
  relativePath: string;
  fileName: string;
  displayName: string;
  extension: string;
  fileSizeBytes: number;
  reportType: string;
  reportTypeCategory: string;
  adrNumber: string | null;
  confidence: number;
  error: string | null;
  ocrPageCount: number;
  contentPreview: string;
  fullText?: string;
  extractionMethod: string;
  dateFolder: string;
  propertyFolder: string;
  property: string | null;
}

interface ScanOutput {
  scanRoot: string;
  scannedAt: string;
  totalFiles: number;
  results: ScannedFile[];
  allDates: string[];
  allProperties: string[];
  reportTypeCounts: Record<string, number>;
}

function fmtFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useScanData() {
  return useQuery<ScanOutput>({
    queryKey: ['scan-output'],
    queryFn: async () => {
      const res = await fetch('/data/output.json');
      if (!res.ok) throw new Error('No scan data found');
      return res.json();
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function DocumentsPage() {
  const { data: scanData, isLoading, error } = useScanData();

  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<ScannedFile | null>(null);

  const results = scanData?.results ?? [];

  // Unique properties, categories, dates
  const properties = useMemo(() =>
    [...new Set(results.map((r) => r.property).filter(Boolean))].sort() as string[],
    [results],
  );
  const categories = useMemo(() =>
    [...new Set(results.map((r) => r.reportTypeCategory).filter(Boolean))].sort(),
    [results],
  );
  const dates = useMemo(() =>
    [...new Set(results.map((r) => r.dateFolder).filter(Boolean))].sort().reverse(),
    [results],
  );
  const reportTypes = useMemo(() =>
    [...new Set(results.map((r) => r.reportType).filter(Boolean))].sort(),
    [results],
  );

  // Filtered results
  const filtered = useMemo(() => {
    let items = results;
    if (selectedProperty) items = items.filter((r) => r.property === selectedProperty);
    if (selectedCategory) items = items.filter((r) => r.reportTypeCategory === selectedCategory);
    if (selectedDate) items = items.filter((r) => r.dateFolder === selectedDate);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((r) =>
        r.fileName.toLowerCase().includes(q) ||
        r.reportType?.toLowerCase().includes(q) ||
        r.property?.toLowerCase().includes(q) ||
        r.propertyFolder?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [results, selectedProperty, selectedCategory, selectedDate, search]);

  const hasFilters = selectedProperty || selectedCategory || selectedDate || search;

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="text-center">
          <DocumentTextIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-700">No documents found</p>
          <p className="text-xs text-neutral-400 mt-1">Run a scan from the File Scanner page first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar — filters */}
      <div className="w-56 shrink-0 border-r border-neutral-200 bg-white overflow-y-auto">
        <div className="p-4">
          <h2 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">Filters</h2>

          {/* Date filter */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-1.5 block">Date</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All dates ({dates.length})</option>
              {dates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Property filter */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-1.5 block">Property</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All properties ({properties.length})</option>
              {properties.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-1.5 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Report type counts */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Report Types</label>
            <div className="space-y-1">
              {reportTypes.slice(0, 15).map((type) => {
                const count = results.filter((r) => r.reportType === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => setSearch(type)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded text-left hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-[11px] text-neutral-600 truncate">{type}</span>
                    <span className="text-[10px] text-neutral-400 tabular-nums ml-1">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={() => { setSelectedProperty(''); setSelectedCategory(''); setSelectedDate(''); setSearch(''); }}
              className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-danger-600 bg-danger-50 rounded hover:bg-danger-100 transition-colors"
            >
              <XMarkIcon className="w-3 h-3" />
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Middle — file list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="px-4 py-3 border-b border-neutral-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search files, report types, properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <span className="text-xs text-neutral-400 tabular-nums shrink-0">
              {filtered.length} of {results.length} files
            </span>
          </div>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-neutral-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FunnelIcon className="w-10 h-10 text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500">No files match your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filtered.map((file, i) => (
                <button
                  key={`${file.relativePath}-${i}`}
                  onClick={() => setSelectedFile(file)}
                  className={clsx(
                    'w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors flex items-center gap-3',
                    selectedFile?.relativePath === file.relativePath && 'bg-brand-50 hover:bg-brand-50',
                  )}
                >
                  {file.extension === '.pdf'
                    ? <DocumentTextIcon className="w-5 h-5 shrink-0 text-red-400" />
                    : <TableCellsIcon className="w-5 h-5 shrink-0 text-green-500" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800 truncate">{file.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {file.property && (
                        <span className="text-[10px] text-brand-600 font-medium">{file.property}</span>
                      )}
                      <span className="text-[10px] text-neutral-400">{file.dateFolder}</span>
                      {file.reportType && (
                        <span className={clsx(
                          'text-[10px] px-1 py-0.5 rounded font-medium',
                          file.confidence >= 0.85 ? 'bg-success-50 text-success-700' :
                          file.confidence >= 0.6 ? 'bg-warning-50 text-warning-700' :
                          'bg-neutral-100 text-neutral-500',
                        )}>
                          {file.reportType}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 tabular-nums shrink-0">{fmtFileSize(file.fileSizeBytes)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — file detail */}
      {selectedFile && (
        <div className="w-80 shrink-0 border-l border-neutral-200 bg-white overflow-y-auto">
          <div className="p-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-800 break-words pr-2">{selectedFile.fileName}</h3>
              <button onClick={() => setSelectedFile(null)} className="shrink-0 text-neutral-400 hover:text-neutral-600">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <DetailRow label="Report Type" value={selectedFile.reportType || 'Unknown'} />
              <DetailRow label="Category" value={selectedFile.reportTypeCategory || '—'} />
              <DetailRow label="Confidence" value={`${Math.round(selectedFile.confidence * 100)}%`} />
              <DetailRow label="Extraction" value={selectedFile.extractionMethod} />
              <DetailRow label="Date" value={selectedFile.dateFolder} />
              <DetailRow label="Property" value={selectedFile.property ?? '—'} />
              <DetailRow label="Folder" value={selectedFile.propertyFolder} />
              <DetailRow label="Size" value={fmtFileSize(selectedFile.fileSizeBytes)} />
              <DetailRow label="Extension" value={selectedFile.extension} />
              {selectedFile.adrNumber && (
                <DetailRow label="ADR" value={`$${selectedFile.adrNumber}`} />
              )}
              {selectedFile.ocrPageCount > 0 && (
                <DetailRow label="OCR Pages" value={String(selectedFile.ocrPageCount)} />
              )}
              {selectedFile.error && (
                <div className="p-2 bg-danger-50 rounded text-xs text-danger-700">{selectedFile.error}</div>
              )}
            </div>

            {/* Content preview */}
            {selectedFile.contentPreview && (
              <div className="mt-4">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">Content Preview</p>
                <pre className="text-[11px] text-neutral-600 bg-neutral-50 rounded p-3 overflow-x-auto max-h-64 whitespace-pre-wrap font-mono">
                  {selectedFile.contentPreview}
                </pre>
              </div>
            )}

            {/* KPI data if present in fullText */}
            {selectedFile.fullText && (
              <div className="mt-4">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">Full Text</p>
                <pre className="text-[10px] text-neutral-500 bg-neutral-50 rounded p-3 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                  {selectedFile.fullText.slice(0, 2000)}
                  {selectedFile.fullText.length > 2000 && '\n\n... (truncated)'}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-xs text-neutral-700 text-right">{value}</span>
    </div>
  );
}
