/**
 * Revenue Flash–style performance table.
 * Shows Day / MTD / YTD side-by-side, grouped by brand with subtotals.
 */

import type { DailyHotelPerformance, SparklinePoint } from './types';
import { PROPERTIES, GROUP_ORDER } from '../../constants/stoneriver-properties';
import { RevenueFlashRow } from './PerformanceTableRow';
import { SubtotalRow, GrandTotalRow } from './PortfolioTotalsRow';

interface PerformanceTableProps {
  dataMap: Map<string, DailyHotelPerformance>;
  sparklineData: SparklinePoint[];
  isLoading: boolean;
  selectedDate: string;
}

const thBase = 'px-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-[#6b7280] whitespace-nowrap';
const thRight = `${thBase} text-right`;

function SectionHeader({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <th colSpan={colSpan} className="px-1.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white bg-[#374151] text-center border-l border-[#4b5563]">
      {label}
    </th>
  );
}

export function PerformanceTable({
  dataMap,
  sparklineData,
  isLoading,
  selectedDate,
}: PerformanceTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 py-4">
        {Array.from({ length: 21 }).map((_, i) => (
          <div key={i} className="h-7 bg-[#f5f5f5] animate-pulse rounded" />
        ))}
      </div>
    );
  }

  const noData = dataMap.size === 0;

  // Build rows by group
  const allPresentData: DailyHotelPerformance[] = [];
  for (const prop of PROPERTIES) {
    const d = dataMap.get(prop.name);
    if (d) allPresentData.push(d);
  }

  return (
    <div>
      {noData && (
        <p className="text-xs text-[#6b7280] mb-2">
          No data for {selectedDate}. Reports typically arrive by 7:00 AM CT.
        </p>
      )}

      <div className="overflow-x-auto border border-[#e5e5e5] rounded">
        <table className="w-full text-[11px] border-collapse" style={{ fontVariantNumeric: 'tabular-nums', minWidth: 1400 }}>
          {/* Two-level header: section labels, then column labels */}
          <thead>
            <tr className="bg-[#1f2937]">
              <th className="px-2 py-1 text-left text-[10px] font-bold text-white bg-[#1f2937] sticky left-0 z-10" rowSpan={2}>
                Property
              </th>
              <SectionHeader label="Day" colSpan={8} />
              <SectionHeader label="Month to Date" colSpan={6} />
              <SectionHeader label="Year to Date" colSpan={6} />
            </tr>
            <tr className="bg-[#f9fafb] border-b border-[#e5e5e5]">
              {/* Day columns */}
              <th className={`${thRight} border-l border-[#e5e5e5]`}>Occ%</th>
              <th className={thRight}>ADR</th>
              <th className={thRight}>RevPAR</th>
              <th className={thRight}>Rooms</th>
              <th className={thRight}>Revenue</th>
              <th className={thRight}>OOO</th>
              <th className={thRight}>PY Rev</th>
              <th className={thRight}>Variance</th>
              {/* MTD columns */}
              <th className={`${thRight} border-l border-[#d1d5db]`}>Occ%</th>
              <th className={thRight}>ADR</th>
              <th className={thRight}>RevPAR</th>
              <th className={thRight}>Revenue</th>
              <th className={thRight}>PY Rev</th>
              <th className={thRight}>Variance</th>
              {/* YTD columns */}
              <th className={`${thRight} border-l border-[#d1d5db]`}>Occ%</th>
              <th className={thRight}>ADR</th>
              <th className={thRight}>RevPAR</th>
              <th className={thRight}>Revenue</th>
              <th className={thRight}>PY Rev</th>
              <th className={thRight}>Variance</th>
            </tr>
          </thead>
          {GROUP_ORDER.map((group) => {
            const groupProps = PROPERTIES.filter((p) => p.group === group);
            if (groupProps.length === 0) return null;

            const groupData = groupProps
              .map((p) => dataMap.get(p.name))
              .filter((d): d is DailyHotelPerformance => d != null);

            return (
              <tbody key={group}>
                {/* Brand group header */}
                <tr className="bg-[#f3f4f6] border-t border-[#d1d5db]">
                  <td
                    colSpan={21}
                    className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#374151]"
                  >
                    {group}
                  </td>
                </tr>
                {/* Property rows */}
                {groupProps.map((prop) => (
                  <RevenueFlashRow
                    key={prop.name}
                    property={prop}
                    data={dataMap.get(prop.name) ?? null}
                    sparklinePoints={sparklineData.filter(
                      (p) => p.property_name === prop.name,
                    )}
                  />
                ))}
                {/* Brand subtotal */}
                {groupData.length > 0 && (
                  <SubtotalRow rows={groupData} label={`${group} Total`} />
                )}
              </tbody>
            );
          })}
          {/* Grand total */}
          <tfoot>
            <GrandTotalRow rows={allPresentData} />
          </tfoot>
        </table>
      </div>
    </div>
  );
}
