/**
 * Scan controls — folder path input, scan button, and live progress bar.
 * Polls /data/scan-progress.json while a scan is running.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import {
  FolderOpenIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ScanProgress {
  status: 'scanning' | 'done' | 'error';
  startedAt: string;
  currentDate: string;
  currentDateIndex: number;
  totalDateFolders: number;
  filesProcessed: number;
  filesInCurrentDate: number;
  totalFilesEstimate: number;
  elapsedMs: number;
  currentFile: string;
  errorMessage?: string;
  /** Per-type estimates */
  totalPdfEstimate?: number;
  totalSpreadsheetEstimate?: number;
  /** Categorized processed counts */
  nativePdfCount?: number;
  ocrPdfCount?: number;
  spreadsheetCount?: number;
}

interface IngestResult {
  success: boolean;
  data?: { dates: number; revenueFlash: number; flashReport: number; engineering: number };
  message?: string;
}

interface ScanControlsProps {
  onScanComplete: () => void;
}

function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function TypeProgressBar({
  label, count, total, color, bgColor, textColor, isDone,
}: {
  label: string; count: number; total: number;
  color: string; bgColor: string; textColor: string; isDone: boolean;
}) {
  // For PDFs, native + OCR share the same total, so show count out of processed-so-far
  const pctVal = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
  return (
    <div className={`rounded-lg ${bgColor} px-3 py-2.5`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${textColor}`}>{label}</span>
        <span className={`text-xs tabular-nums font-bold ${textColor}`}>{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${isDone ? 100 : pctVal}%` }}
        />
      </div>
      {total > 0 && (
        <p className={`text-[10px] tabular-nums mt-1 ${textColor} opacity-70`}>
          {isDone ? `${count} of ${total}` : `${count} / ${total}`}
        </p>
      )}
    </div>
  );
}

export function ScanControls({ onScanComplete }: ScanControlsProps) {
  const [folderPath, setFolderPath] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<'idle' | 'ingesting' | 'done' | 'error'>('idle');
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const scanStartedAtRef = useRef<string | null>(null);
  const scanIdRef = useRef(0);

  // Poll progress ONLY while actively scanning
  useEffect(() => {
    if (!isScanning) return;

    const currentScanId = scanIdRef.current;
    const poll = setInterval(async () => {
      if (scanIdRef.current !== currentScanId) return;

      try {
        const res = await fetch('/api/v1/scanner/progress');
        if (!res.ok) return;
        const data: ScanProgress = await res.json();
        if (scanIdRef.current !== currentScanId) return;
        setProgress(data);

        if (data.status === 'done') {
          setIsScanning(false);
          onScanComplete();
          // Auto-ingest scan results to Supabase
          setIngestStatus('ingesting');
          fetch('/api/v1/scanner/ingest', { method: 'POST' })
            .then((r) => r.json())
            .then((res: IngestResult) => {
              setIngestResult(res);
              setIngestStatus(res.success ? 'done' : 'error');
            })
            .catch(() => {
              setIngestStatus('error');
              setIngestResult({ success: false, message: 'Failed to connect to ingestion API.' });
            });
        } else if (data.status === 'error') {
          setIsScanning(false);
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [isScanning, onScanComplete]);


  const handleStartScan = useCallback(() => {
    if (!folderPath.trim()) return;
    const startTime = new Date().toISOString();
    scanStartedAtRef.current = startTime;
    scanIdRef.current += 1;
    setIsScanning(true);
    setShowPanel(true);
    setProgress({ status: 'scanning', startedAt: startTime, currentDate: '', currentDateIndex: 0, totalDateFolders: 0, filesProcessed: 0, filesInCurrentDate: 0, totalFilesEstimate: 0, elapsedMs: 0, currentFile: 'Starting...' });
    setIngestStatus('idle');
    setIngestResult(null);

    // Start the scan via the scanner script
    // This calls a tiny endpoint that spawns the process
    fetch('/api/v1/scanner/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: folderPath.trim(), startedAt: startTime }),
    }).catch(() => {
      // If API isn't available, show instructions
      setProgress({
        status: 'error',
        startedAt: new Date().toISOString(),
        currentDate: '',
        currentDateIndex: 0,
        totalDateFolders: 0,
        filesProcessed: 0,
        filesInCurrentDate: 0,
        totalFilesEstimate: 0,
        elapsedMs: 0,
        currentFile: '',
        errorMessage: 'Run manually: pnpm tsx scripts/scanWithOCR-local.ts "' + folderPath + '"',
      });
      setIsScanning(false);
    });
  }, [folderPath]);

  const pct = progress && progress.totalFilesEstimate > 0
    ? Math.min(100, Math.round((progress.filesProcessed / progress.totalFilesEstimate) * 100))
    : 0;

  return (
    <div className="card overflow-hidden">
      {/* Header bar — always visible */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
      >
        {isScanning ? (
          <ArrowPathIcon className="w-5 h-5 text-brand-600 animate-spin shrink-0" />
        ) : progress?.status === 'done' ? (
          <CheckCircleIcon className="w-5 h-5 text-success-600 shrink-0" />
        ) : ingestStatus === 'ingesting' ? (
          <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
        ) : ingestStatus === 'done' ? (
          <CheckCircleIcon className="w-5 h-5 text-success-600 shrink-0" />
        ) : (
          <FolderOpenIcon className="w-5 h-5 text-neutral-400 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-800">
            {isScanning
              ? 'Scanning in progress...'
              : ingestStatus === 'ingesting'
              ? 'Pushing data to dashboard...'
              : ingestStatus === 'done'
              ? 'Scan complete — data synced to dashboard'
              : progress?.status === 'done'
              ? 'Scan complete'
              : 'Scan Files'}
          </p>
          {isScanning && progress && (
            <p className="text-xs text-neutral-400 mt-0.5">
              {progress.filesProcessed}/{progress.totalFilesEstimate} files &middot;
              Date {progress.currentDateIndex}/{progress.totalDateFolders} &middot;
              {fmtDuration(progress.elapsedMs)}
            </p>
          )}
          {!isScanning && progress?.status === 'done' && (
            <p className="text-xs text-success-600 mt-0.5">
              {progress.filesProcessed} files processed in {fmtDuration(progress.elapsedMs)}
              {ingestResult?.data && ` · ${ingestResult.data.revenueFlash} revenue flash, ${ingestResult.data.flashReport} flash report, ${ingestResult.data.engineering} engineering rows ingested`}
            </p>
          )}
          {ingestStatus === 'error' && (
            <p className="text-xs text-danger-600 mt-0.5">{ingestResult?.message ?? 'Ingestion failed'}</p>
          )}
        </div>

        {/* Mini progress bar in header when scanning */}
        {isScanning && (
          <div className="w-24 h-1.5 rounded-full bg-neutral-100 overflow-hidden shrink-0">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {ingestStatus === 'ingesting' && (
          <div className="w-24 h-1.5 rounded-full bg-blue-100 overflow-hidden shrink-0">
            <div className="h-full rounded-full bg-blue-500 animate-pulse w-full" />
          </div>
        )}

        <span className="text-xs text-neutral-400">{showPanel ? '▲' : '▼'}</span>
      </button>

      {/* Expanded panel */}
      {showPanel && (
        <div className="border-t border-neutral-100 px-4 py-4 space-y-4">
          {/* Folder path input */}
          <div>
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-1.5 block">Folder Path</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FolderOpenIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="C:\path\to\OneDrive_2026-03-27"
                  disabled={isScanning}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:opacity-50 disabled:bg-neutral-50 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const handle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
                    const res = await fetch('/api/v1/scanner/resolve-folder', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ folderName: handle.name }),
                    });
                    const data = await res.json();
                    if (data.success && data.folderPath) {
                      setFolderPath(data.folderPath);
                    } else {
                      // Could not resolve — ask user to paste the full path
                      const fullPath = window.prompt(
                        `Could not auto-detect path for "${handle.name}".\nPaste the full folder path:`,
                      );
                      if (fullPath?.trim()) setFolderPath(fullPath.trim());
                    }
                  } catch {
                    // User cancelled or API unsupported
                  }
                }}
                disabled={isScanning}
                className="btn-secondary !px-3 shrink-0"
                title="Browse for folder"
              >
                <FolderOpenIcon className="w-4 h-4" />
                <span className="text-xs">Browse</span>
              </button>
              {isScanning ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await fetch('/api/v1/scanner/cancel', { method: 'POST' });
                    } catch { /* ignore */ }
                    setIsScanning(false);
                    setProgress(null);
                    scanStartedAtRef.current = null;
                  }}
                  className="btn-secondary !px-4 shrink-0 !text-danger-600 !border-danger-300 hover:!bg-danger-50"
                >
                  <StopIcon className="w-4 h-4" />
                  Cancel
                </button>
              ) : (
                <button
                  onClick={handleStartScan}
                  disabled={!folderPath.trim()}
                  className="btn-primary !px-4 shrink-0"
                >
                  <PlayIcon className="w-4 h-4" /> Start Scan
                </button>
              )}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Enter the full path to the folder containing hotel report PDFs. The scanner will use local OCR to read and categorize every file.
            </p>
          </div>

          {/* Progress section */}
          {progress && (
            <div className="space-y-4">
              {/* Overall progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                    {progress.status === 'scanning' ? 'Overall Progress' : progress.status === 'done' ? 'Completed' : 'Error'}
                  </label>
                  <div className="flex items-center gap-3 text-xs">
                    {progress.currentDate && progress.status === 'scanning' && (
                      <span className="text-neutral-400">
                        Processing {progress.currentDate}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-neutral-400">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {fmtDuration(progress.elapsedMs)}
                    </span>
                    {progress.status === 'scanning' && progress.filesProcessed > 0 && (
                      <span className="text-neutral-400 tabular-nums">
                        ~{fmtDuration(
                          ((progress.totalFilesEstimate - progress.filesProcessed) / (progress.filesProcessed / progress.elapsedMs))
                        )} left
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden mb-1">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-500',
                      progress.status === 'done' ? 'bg-success-500' :
                      progress.status === 'error' ? 'bg-danger-500' :
                      'bg-neutral-400',
                    )}
                    style={{ width: `${progress.status === 'done' ? 100 : pct}%` }}
                  />
                </div>
                <p className="text-[11px] tabular-nums text-neutral-500">
                  {progress.status === 'done' ? (
                    <span className="text-success-600 font-medium">{progress.filesProcessed} files processed</span>
                  ) : (
                    <>{progress.filesProcessed} / {progress.totalFilesEstimate} files ({pct}%)</>
                  )}
                </p>
              </div>

              {/* Per-type progress bars */}
              {(progress.totalPdfEstimate || progress.totalSpreadsheetEstimate) ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* PDF (text-based) */}
                  <TypeProgressBar
                    label="PDF (Text)"
                    count={progress.nativePdfCount ?? 0}
                    total={progress.totalPdfEstimate ?? 0}
                    color="bg-emerald-500"
                    bgColor="bg-emerald-50"
                    textColor="text-emerald-700"
                    isDone={progress.status === 'done'}
                  />
                  {/* PDF (scanned / OCR) */}
                  <TypeProgressBar
                    label="PDF (Scanned)"
                    count={progress.ocrPdfCount ?? 0}
                    total={progress.totalPdfEstimate ?? 0}
                    color="bg-amber-500"
                    bgColor="bg-amber-50"
                    textColor="text-amber-700"
                    isDone={progress.status === 'done'}
                  />
                  {/* Spreadsheets */}
                  <TypeProgressBar
                    label="XLSX / CSV"
                    count={progress.spreadsheetCount ?? 0}
                    total={progress.totalSpreadsheetEstimate ?? 0}
                    color="bg-blue-500"
                    bgColor="bg-blue-50"
                    textColor="text-blue-700"
                    isDone={progress.status === 'done'}
                  />
                </div>
              ) : null}

              {/* Ingestion status */}
              {ingestStatus !== 'idle' && (
                <div className={clsx(
                  'p-3 rounded-md border',
                  ingestStatus === 'ingesting' && 'bg-blue-50 border-blue-200',
                  ingestStatus === 'done' && 'bg-success-50 border-success-200',
                  ingestStatus === 'error' && 'bg-danger-50 border-danger-200',
                )}>
                  <p className={clsx(
                    'text-xs font-medium',
                    ingestStatus === 'ingesting' && 'text-blue-700',
                    ingestStatus === 'done' && 'text-success-700',
                    ingestStatus === 'error' && 'text-danger-700',
                  )}>
                    {ingestStatus === 'ingesting' && 'Pushing data to dashboard...'}
                    {ingestStatus === 'done' && ingestResult?.data && (
                      <>Data ingested: {ingestResult.data.revenueFlash} revenue flash, {ingestResult.data.flashReport} flash report, {ingestResult.data.engineering} engineering rows across {ingestResult.data.dates} dates</>
                    )}
                    {ingestStatus === 'error' && (ingestResult?.message ?? 'Ingestion failed')}
                  </p>
                </div>
              )}

              {/* Error message */}
              {progress.status === 'error' && progress.errorMessage && (
                <div className="p-3 bg-danger-50 rounded-md border border-danger-200">
                  <p className="text-xs text-danger-700 font-mono">{progress.errorMessage}</p>
                </div>
              )}

              {/* Manual run hint */}
              {progress.status === 'error' && (
                <div className="p-3 bg-neutral-50 rounded-md">
                  <p className="text-[10px] font-semibold text-neutral-500 mb-1">Run manually in terminal:</p>
                  <code className="text-xs text-neutral-600 font-mono">
                    pnpm tsx scripts/scanWithOCR-local.ts "{folderPath}" --concurrency 10
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Manual run instructions when no progress */}
          {!progress && !isScanning && (
            <div className="p-3 bg-neutral-50 rounded-md">
              <p className="text-[10px] font-semibold text-neutral-500 mb-1">Or run from terminal:</p>
              <code className="text-xs text-neutral-600 font-mono block">
                pnpm tsx scripts/scanWithOCR-local.ts "./path/to/folder" --concurrency 10
              </code>
              <p className="text-[10px] text-neutral-400 mt-1">
                The progress bar will automatically appear when a scan is running.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
