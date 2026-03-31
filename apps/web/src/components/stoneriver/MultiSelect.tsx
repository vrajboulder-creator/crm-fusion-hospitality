/**
 * Multi-select dropdown with checkboxes for filtering.
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const display = selected.length === 0
    ? label
    : selected.length === 1
      ? selected[0]!
      : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs border border-[#e5e5e5] px-2 py-1.5 text-[#1a1a1a] bg-white hover:bg-[#f9fafb] rounded min-w-[120px] justify-between"
      >
        <span className={selected.length === 0 ? 'text-[#6b7280]' : 'font-medium truncate max-w-[140px]'}>
          {display}
        </span>
        <ChevronDownIcon className="w-3 h-3 text-[#6b7280] flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e5e5] rounded shadow-lg z-30 min-w-[180px] max-h-[260px] overflow-y-auto">
          {/* Select All / Clear */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#e5e5e5]">
            <button
              onClick={() => onChange(options)}
              className="text-[10px] text-[#2563eb] hover:underline font-medium"
            >
              Select All
            </button>
            <button
              onClick={() => onChange([])}
              className="text-[10px] text-[#6b7280] hover:underline"
            >
              Clear
            </button>
          </div>
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] cursor-pointer text-xs text-[#1a1a1a]"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="w-3.5 h-3.5 rounded border-[#d1d5db] text-[#1f2937] focus:ring-[#1f2937]"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
