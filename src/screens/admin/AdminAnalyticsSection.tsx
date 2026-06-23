import { useMemo, useState } from 'react';
import {
  BarChart3, Globe, Tag, Trophy, TrendingUp, TrendingDown, Minus,
  Calendar, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  XAxis, YAxis, Area, AreaChart,
} from 'recharts';
import { useData } from '../../contexts/DataContext';
import { useStaff } from '../../contexts/StaffContext';
import {
  buildDailyTimeline,
  buildMonthlyTimeline,
  compareDailyPerformance,
  compareMonthlyPerformance,
  computeMonthlyLeaderboard,
  computeRegionalBreakdown,
  computeSourcePerformance,
  MONTHLY_SCORING_EXPLANATION,
} from '../../utils/adminAnalytics';

type PeriodView = 'daily' | 'monthly';

function DeltaBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#71717a]">
        <Minus size={12} /> No change
      </span>
    );
  }
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${positive ? 'text-green-600' : 'text-red-600'}`}>
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {positive ? '+' : ''}{value}{suffix} vs prior period
    </span>
  );
}

export default function AdminAnalyticsSection() {
  const { leads, demos } = useData();
  const { staffList } = useStaff();
  const [periodView, setPeriodView] = useState<PeriodView>('monthly');
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  const dailyComparison = useMemo(() => compareDailyPerformance(leads, demos), [leads, demos]);
  const monthlyComparison = useMemo(() => compareMonthlyPerformance(leads, demos), [leads, demos]);
  const dailyTimeline = useMemo(() => buildDailyTimeline(leads, 14), [leads]);
  const monthlyTimeline = useMemo(() => buildMonthlyTimeline(leads, 6), [leads]);
  const regional = useMemo(() => computeRegionalBreakdown(leads, 'THIS_MONTH'), [leads]);
  const sources = useMemo(() => computeSourcePerformance(leads, demos, 'THIS_MONTH'), [leads, demos]);
  const leaderboard = useMemo(
    () => computeMonthlyLeaderboard(staffList.map(s => ({ name: s.name, role: s.role })), leads, demos),
    [staffList, leads, demos]
  );

  const comparison = periodView === 'daily' ? dailyComparison : monthlyComparison;
  const timeline = periodView === 'daily' ? dailyTimeline : monthlyTimeline;
  const timelineLeadKey = 'leads';
  const timelineJoinKey = 'joins';

  const kpiItems = [
    {
      label: periodView === 'daily' ? 'Leads today' : 'Leads this month',
      value: comparison.current.leads,
      delta: comparison.leadsDelta,
    },
    {
      label: periodView === 'daily' ? 'Joins today' : 'Joins this month',
      value: comparison.current.joins,
      delta: comparison.joinsDelta,
    },
    {
      label: 'Conversion rate',
      value: `${comparison.current.conversionRate}%`,
      delta: comparison.conversionDelta,
      deltaSuffix: '%',
    },
    {
      label: 'Est. collection',
      value: `₹${(comparison.current.collection / 1000).toFixed(1)}k`,
      delta: comparison.current.collection - comparison.previous.collection,
      deltaSuffix: '',
      isCurrency: true,
    },
  ];

  const chartColors = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];

  return (
    <div className="space-y-6">
      {/* Period toggle */}
      <div className="surface-panel p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#18181b]">Performance Analytics</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">
                Daily & monthly insights for admin
              </p>
            </div>
          </div>
          <div className="flex bg-[#f4f4f5] p-1 rounded-2xl border border-[#e4e4e7] w-fit">
            {(['daily', 'monthly'] as const).map(view => (
              <button
                key={view}
                onClick={() => setPeriodView(view)}
                className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  periodView === view ? 'bg-white text-[#18181b] shadow-sm' : 'text-[#71717a]'
                }`}
              >
                <Calendar size={14} className="inline mr-1.5 -mt-0.5" />
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI comparison */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiItems.map(item => (
          <div key={item.label} className="bg-white border border-[#e4e4e7] rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-2">{item.label}</p>
            <p className="text-2xl font-black text-[#18181b] tabular-nums">{item.value}</p>
            <div className="mt-2">
              <DeltaBadge
                value={item.isCurrency ? Math.round(item.delta / 1000) : item.delta}
                suffix={item.deltaSuffix ?? (item.isCurrency ? 'k' : '')}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Timeline chart */}
      <div className="surface-panel p-5 sm:p-6">
        <h3 className="section-title">
          {periodView === 'daily' ? 'Daily trend (last 14 days)' : 'Monthly trend (last 6 months)'}
        </h3>
        <p className="text-xs text-[#71717a] mt-0.5 mb-4">Leads captured vs joins in each period</p>
        <div className="min-h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adminLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#18181b" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="adminJoins" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
              <RechartsTooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgb(0 0 0 / 0.06)' }}
              />
              <Area type="monotone" dataKey={timelineLeadKey} name="Leads" stroke="#18181b" strokeWidth={2} fill="url(#adminLeads)" />
              <Area type="monotone" dataKey={timelineJoinKey} name="Joins" stroke="#16a34a" strokeWidth={2} fill="url(#adminJoins)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional breakdown */}
        <div className="surface-panel p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-indigo-600" />
            <div>
              <h3 className="section-title">Regional breakdown</h3>
              <p className="text-xs text-[#71717a]">This month by country</p>
            </div>
          </div>
          {regional.length === 0 ? (
            <p className="text-sm text-[#71717a] text-center py-8">No regional data this month.</p>
          ) : (
            <div className="space-y-3">
              {regional.map(row => (
                <div key={row.isoCode} className="p-3 bg-[#fafafa] rounded-xl border border-[#f4f4f5]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#18181b]">{row.region}</span>
                    <span className="text-xs font-bold text-[#71717a]">{row.share}% of leads</span>
                  </div>
                  <div className="h-2 bg-[#e4e4e7] rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${row.share}%` }} />
                  </div>
                  <div className="flex gap-4 text-xs font-semibold text-[#71717a]">
                    <span>{row.leads} leads</span>
                    <span>{row.joins} joins</span>
                    <span>{row.conversionRate}% conv.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Source performance */}
        <div className="surface-panel p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={18} className="text-green-600" />
            <div>
              <h3 className="section-title">Source performance</h3>
              <p className="text-xs text-[#71717a]">This month by channel</p>
            </div>
          </div>
          <div className="min-h-[200px] mb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sources.slice(0, 6)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e4e4e7' }} />
                <Bar dataKey="leads" name="Leads" radius={[4, 4, 0, 0]}>
                  {sources.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] border-b border-[#e4e4e7]">
                  <th className="text-left py-2">Source</th>
                  <th className="text-right py-2">Leads</th>
                  <th className="text-right py-2">Joins</th>
                  <th className="text-right py-2">Conv.</th>
                  <th className="text-right py-2">Collection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f5]">
                {sources.map(row => (
                  <tr key={row.source}>
                    <td className="py-2.5 font-semibold text-[#18181b]">{row.source}</td>
                    <td className="py-2.5 text-right tabular-nums">{row.leads}</td>
                    <td className="py-2.5 text-right tabular-nums">{row.joins}</td>
                    <td className="py-2.5 text-right tabular-nums">{row.conversionRate}%</td>
                    <td className="py-2.5 text-right tabular-nums font-bold">₹{(row.collection / 1000).toFixed(1)}k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly leaderboard */}
      <div className="surface-panel overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#e4e4e7] flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="section-title">Monthly leaderboard</h3>
            <p className="text-xs text-[#71717a]">Ranked by efficiency score this month</p>
          </div>
        </div>
        {leaderboard.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#71717a]">No staff activity this month yet.</p>
        ) : (
          <div className="divide-y divide-[#f4f4f5]">
            {leaderboard.map((row, index) => (
              <motion.div
                key={row.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 sm:px-6 hover:bg-[#fafafa] transition-colors"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-zinc-200 text-zinc-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-[#f4f4f5] text-[#71717a]'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#18181b] truncate">{row.name}</p>
                  <p className="text-[10px] font-bold uppercase text-[#a1a1aa]">{row.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-[#18181b]">{row.efficiencyScore}</p>
                  <p className="text-[10px] font-bold text-[#71717a]">efficiency</p>
                </div>
                <div className="hidden sm:block text-right shrink-0 w-24">
                  <p className="font-bold text-sm tabular-nums">{row.joins} joins</p>
                  <p className="text-[10px] text-[#71717a]">{row.conversionRate}% conv.</p>
                </div>
                <div className="hidden md:block text-right shrink-0 w-24">
                  <p className="font-bold text-sm tabular-nums">₹{(row.collection / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-[#71717a]">collection</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Scoring mechanism */}
      <div className="surface-panel overflow-hidden">
        <button
          type="button"
          onClick={() => setShowScoringInfo(v => !v)}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-[#fafafa] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Info size={20} />
            </div>
            <div>
              <h3 className="section-title">{MONTHLY_SCORING_EXPLANATION.title}</h3>
              <p className="text-xs text-[#71717a]">Tap to see how rankings and scores are computed</p>
            </div>
          </div>
          {showScoringInfo ? <ChevronUp size={20} className="text-[#71717a] shrink-0" /> : <ChevronDown size={20} className="text-[#71717a] shrink-0" />}
        </button>
        <AnimatePresence>
          {showScoringInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#e4e4e7]"
            >
              <ul className="p-5 sm:p-6 space-y-3">
                {MONTHLY_SCORING_EXPLANATION.points.map((point, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#71717a]">
                    <span className="w-6 h-6 rounded-full bg-[#f4f4f5] text-[#18181b] text-xs font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
