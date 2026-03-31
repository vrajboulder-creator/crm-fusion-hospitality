/**
 * PDF export for the Revenue Flash table.
 * Captures the full table (all periods) as a landscape PDF.
 */

import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface PdfExportButtonProps {
  date: string;
}

export function PdfExportButton({ date }: PdfExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const tableEl = document.getElementById('revenue-flash-table');
      if (!tableEl) return;

      const { default: html2canvas } = await import('html2canvas-pro');
      const { jsPDF } = await import('jspdf');

      // Temporarily remove overflow clipping so full table is captured
      const prevOverflow = tableEl.style.overflow;
      const prevMaxWidth = tableEl.style.maxWidth;
      tableEl.style.overflow = 'visible';
      tableEl.style.maxWidth = 'none';

      const canvas = await html2canvas(tableEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Restore
      tableEl.style.overflow = prevOverflow;
      tableEl.style.maxWidth = prevMaxWidth;

      const imgData = canvas.toDataURL('image/png');
      const imgW = canvas.width;
      const imgH = canvas.height;

      // Landscape A4: 297mm x 210mm
      const pageW = 297;
      const pageH = 210;
      const margin = 8;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2 - 10; // 10mm for header

      const ratio = Math.min(usableW / imgW, usableH / imgH);
      const scaledW = imgW * ratio;
      const scaledH = imgH * ratio;

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Header
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fusion Hospitality Group — Revenue Flash', margin, margin + 4);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Report Date: ${date}`, margin, margin + 9);

      // Table image
      pdf.addImage(imgData, 'PNG', margin, margin + 12, scaledW, scaledH);

      pdf.save(`revenue-flash-${date}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1f2937] hover:bg-[#374151] disabled:opacity-50 transition-colors rounded"
    >
      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
      {exporting ? 'Exporting...' : 'Export PDF'}
    </button>
  );
}
