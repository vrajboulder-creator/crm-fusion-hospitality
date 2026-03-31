/**
 * Modal PDF viewer with multi-PDF navigation.
 * Opens a popup showing the full PDF with zoom, scroll, and page navigation.
 * If the search term appears in multiple PDFs, arrows navigate between them.
 */

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from '@heroicons/react/24/outline';
import type { PdfMatch } from '../../lib/pdf-search-index';
import { pdfFileUrl } from '../../lib/pdf-search-index';

interface PdfViewerModalProps {
  matches: PdfMatch[];
  initialIndex?: number;
  searchTerm: string;
  onClose: () => void;
}

export function PdfViewerModal({ matches, initialIndex = 0, searchTerm, onClose }: PdfViewerModalProps) {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const [zoom, setZoom] = useState(100);
  const backdropRef = useRef<HTMLDivElement>(null);

  const current = matches[currentIdx];
  const total = matches.length;

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIdx > 0) setCurrentIdx((i) => i - 1);
      if (e.key === 'ArrowRight' && currentIdx < total - 1) setCurrentIdx((i) => i + 1);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIdx, total, onClose]);

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  if (!current) return null;

  const url = pdfFileUrl(current.filePath);

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg shadow-2xl flex flex-col w-full max-w-[1100px] h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e5e5] bg-[#f9fafb] rounded-t-lg">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1a1a1a] truncate">{current.fileName}</p>
            <p className="text-[11px] text-[#6b7280]">
              {current.reportType}
              {current.property ? ` — ${current.property}` : ''}
              {searchTerm ? ` — searching: "${searchTerm}"` : ''}
            </p>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="p-1 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#e5e7eb] rounded"
              title="Zoom out"
            >
              <MagnifyingGlassMinusIcon className="w-4 h-4" />
            </button>
            <span className="text-[11px] tabular-nums text-[#6b7280] w-10 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className="p-1 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#e5e7eb] rounded"
              title="Zoom in"
            >
              <MagnifyingGlassPlusIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#e5e7eb] rounded"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* PDF viewer area */}
        <div className="flex-1 overflow-auto bg-[#525659]">
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
            <iframe
              key={url}
              src={url}
              className="w-full border-0"
              style={{ height: `${Math.round(90 * (100 / zoom))}vh`, minWidth: 800 }}
              title={current.fileName}
            />
          </div>
        </div>

        {/* Footer — navigation */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#e5e5e5] bg-[#f9fafb] rounded-b-lg">
          <button
            onClick={() => setCurrentIdx((i) => i - 1)}
            disabled={currentIdx === 0}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#374151] bg-white border border-[#e5e5e5] rounded hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
            Previous
          </button>

          <span className="text-[11px] text-[#6b7280] tabular-nums">
            File {currentIdx + 1} of {total}
            {current.property ? ` — ${current.property}` : ''}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIdx((i) => i + 1)}
              disabled={currentIdx >= total - 1}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#374151] bg-white border border-[#e5e5e5] rounded hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-default"
            >
              Next
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1 text-xs font-medium text-white bg-[#1f2937] rounded hover:bg-[#374151]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
