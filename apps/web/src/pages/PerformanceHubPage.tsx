/**
 * Performance Hub — card-based landing page for performance reports.
 * Links to Revenue Flash, Flash Report, and Engineering dashboards.
 */

import { Link } from 'react-router-dom';
import { ChartBarIcon, DocumentTextIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

interface CardProps {
  title: string;
  description: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  disabled?: boolean;
}

function PerformanceCard({ title, description, to, icon: Icon, disabled }: CardProps) {
  if (disabled) {
    return (
      <div className="border border-[#e5e5e5] rounded-lg p-6 opacity-50 cursor-not-allowed bg-[#fafafa]">
        <Icon className="w-8 h-8 text-[#9ca3af] mb-3" />
        <h3 className="text-sm font-bold text-[#374151] mb-1">{title}</h3>
        <p className="text-xs text-[#6b7280] leading-relaxed">{description}</p>
        <span className="inline-block mt-3 text-[10px] uppercase tracking-widest font-semibold text-[#9ca3af] bg-[#f3f4f6] px-2 py-0.5 rounded">
          Coming Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="border border-[#e5e5e5] rounded-lg p-6 hover:border-[#1f2937] hover:shadow-md transition-all bg-white group"
    >
      <Icon className="w-8 h-8 text-[#374151] mb-3 group-hover:text-[#2563eb] transition-colors" />
      <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">{title}</h3>
      <p className="text-xs text-[#6b7280] leading-relaxed">{description}</p>
    </Link>
  );
}

export function PerformanceHubPage() {
  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <h1 className="text-lg font-bold text-[#1a1a1a] mb-1">Performance</h1>
      <p className="text-xs text-[#6b7280] mb-6">Daily operating metrics and financial reports</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PerformanceCard
          title="Revenue Flash"
          description="Daily revenue snapshot with Day/MTD/YTD occupancy, ADR, RevPAR, and year-over-year comparisons across all 21 properties."
          to="/stoneriver/revenue-flash"
          icon={ChartBarIcon}
        />
        <PerformanceCard
          title="Flash Report"
          description="Comprehensive daily property snapshot with F&B revenue, room status, reservations, and AR aging buckets."
          to="/stoneriver/flash-report"
          icon={DocumentTextIcon}
        />
        <PerformanceCard
          title="Engineering"
          description="OOO rooms tracking, long-term maintenance issues, and engineering work orders across all properties."
          to="/stoneriver/engineering"
          icon={WrenchScrewdriverIcon}
        />
      </div>
    </div>
  );
}
