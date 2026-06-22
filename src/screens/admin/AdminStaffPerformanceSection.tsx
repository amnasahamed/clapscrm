import { useMemo, useState, type ReactNode } from 'react';
import { BarChart3, Download, Filter, TrendingUp, Users, Target, Video } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStaff } from '../../contexts/StaffContext';
import { DateRangeFilter } from '../../utils/dateFilter';
import { computeStaffMetrics, computeTeamTotals } from '../../utils/staffMetrics';
import { downloadCsv } from '../../utils/csv';

const DATE_OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: 'ALL', label: 'All Time' },
  { value: 'TODAY', label: 'Today' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'CUSTOM', label: 'Custom Range' }
];

export default function AdminStaffPerformanceSection() {
  const { leads, demos } = useData();
  const { staffList } = useStaff();

  const [staffFilter, setStaffFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('THIS_MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const metrics = useMemo(() => computeStaffMetrics(
    staffList.map(s => ({ name: s.name, role: s.role })),
    leads,
    demos,
    {
      staffName: staffFilter,
      dateRange,
      customRange: dateRange === 'CUSTOM' ? { start: customStart, end: customEnd } : undefined
    }
  ), [staffList, leads, demos, staffFilter, dateRange, customStart, customEnd]);

  const teamTotals = useMemo(() => computeTeamTotals(metrics), [metrics]);

  const handleExportCsv = () => {
    const headers = [
      'Staff', 'Role', 'Total Leads', 'Active Leads', 'Joins', 'Lost',
      'Conversion %', 'Demos Scheduled', 'Demos Completed', 'Demo Completion %',
      'Efficiency Score', 'Collection (₹)'
    ];
    const rows = metrics.map(m => [
      m.name, m.role,
      String(m.totalLeads), String(m.activeLeads), String(m.joins), String(m.lost),
      String(m.conversionRate), String(m.demosScheduled), String(m.demosCompleted),
      String(m.demoCompletionRate), String(m.efficiencyScore), String(m.collection)
    ]);
    downloadCsv(`clapscrm-staff-performance-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const efficiencyColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-700';
    if (score >= 40) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      <div className="surface-panel p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#18181b]">Staff Performance</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Efficiency & conversion metrics</p>
            </div>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={metrics.length === 0}
            className="px-4 py-3 min-h-[44px] bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 interactive-element"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-3">
          <Filter size={12} /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <select
            value={staffFilter}
            onChange={e => setStaffFilter(e.target.value)}
            className="bg-[#f4f4f5] rounded-xl px-4 py-3 min-h-[48px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b] border border-transparent"
          >
            <option value="ALL">All Staff (Team View)</option>
            {staffList.map(s => (
              <option key={s.name} value={s.name}>{s.name} — {s.role}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as DateRangeFilter)}
            className="bg-[#f4f4f5] rounded-xl px-4 py-3 min-h-[48px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b] border border-transparent"
          >
            {DATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {dateRange === 'CUSTOM' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-[#f4f4f5] rounded-xl px-4 py-3 min-h-[48px] text-sm font-semibold outline-none border border-transparent focus:bg-white focus:border-[#18181b]" />
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-[#f4f4f5] rounded-xl px-4 py-3 min-h-[48px] text-sm font-semibold outline-none border border-transparent focus:bg-white focus:border-[#18181b]" />
          </div>
        )}
      </div>

      {/* Team summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<Users size={18} className="text-indigo-500" />} label="Total Leads" value={teamTotals.totalLeads} />
        <KpiCard icon={<Target size={18} className="text-green-500" />} label="Joins" value={teamTotals.joins} sub={`${teamTotals.conversionRate}% conv.`} />
        <KpiCard icon={<Video size={18} className="text-blue-500" />} label="Demos Done" value={teamTotals.demosCompleted} />
        <KpiCard icon={<TrendingUp size={18} className="text-amber-500" />} label="Avg Efficiency" value={`${teamTotals.avgEfficiency}`} sub="out of 100" />
      </div>

      {/* Staff rows */}
      <div className="surface-panel overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 gap-2 px-6 py-3 bg-[#fafafa] border-b border-[#e4e4e7] text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">
          <div className="col-span-3">Staff</div>
          <div className="col-span-1 text-center">Leads</div>
          <div className="col-span-1 text-center">Active</div>
          <div className="col-span-1 text-center">Joins</div>
          <div className="col-span-1 text-center">Conv %</div>
          <div className="col-span-1 text-center">Demos</div>
          <div className="col-span-1 text-center">Done</div>
          <div className="col-span-1 text-center">Demo %</div>
          <div className="col-span-2 text-center">Efficiency</div>
        </div>

        {metrics.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#71717a]">No data for selected filters.</p>
        ) : (
          <div className="divide-y divide-[#f4f4f5]">
            {metrics.map(m => (
              <div key={m.name} className="p-4 lg:px-6 lg:py-4 hover:bg-[#fafafa] transition-colors">
                <div className="lg:grid lg:grid-cols-12 lg:gap-2 lg:items-center">
                  <div className="col-span-3 mb-3 lg:mb-0">
                    <p className="font-bold text-sm text-[#18181b]">{m.name}</p>
                    <p className="text-[10px] font-bold uppercase text-[#a1a1aa]">{m.role}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:contents gap-3 text-sm">
                    <MetricCell label="Leads" value={m.totalLeads} />
                    <MetricCell label="Active" value={m.activeLeads} />
                    <MetricCell label="Joins" value={m.joins} />
                    <MetricCell label="Conversion" value={`${m.conversionRate}%`} />
                    <MetricCell label="Demos" value={m.demosScheduled} />
                    <MetricCell label="Completed" value={m.demosCompleted} />
                    <MetricCell label="Demo Rate" value={`${m.demoCompletionRate}%`} />
                    <div className="col-span-2 lg:col-span-2 flex items-center justify-center lg:justify-center mt-2 lg:mt-0">
                      <div className="w-full max-w-[120px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-[#71717a] uppercase">Efficiency</span>
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${efficiencyColor(m.efficiencyScore)}`}>{m.efficiencyScore}</span>
                        </div>
                        <div className="h-2 bg-[#f4f4f5] rounded-full overflow-hidden">
                          <div className="h-full bg-[#18181b] rounded-full transition-all" style={{ width: `${m.efficiencyScore}%` }} />
                        </div>
                        <p className="text-[10px] text-[#71717a] mt-1 text-center">₹{(m.collection / 1000).toFixed(1)}k collection</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-[#e4e4e7] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">{label}</span></div>
      <p className="text-2xl font-black text-[#18181b]">{value}</p>
      {sub && <p className="text-[10px] font-bold text-[#71717a] mt-0.5">{sub}</p>}
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="lg:text-center">
      <p className="text-[10px] font-bold uppercase text-[#a1a1aa] lg:hidden">{label}</p>
      <p className="font-bold text-[#18181b]">{value}</p>
    </div>
  );
}
