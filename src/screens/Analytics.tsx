import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid
} from 'recharts';

export default function Analytics() {
  const { leads, demos, leadSources } = useData();

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const joinedLeads = leads.filter(l => l.status === 'JOINED').length;
    const totalDemos = demos.length;
    const completedDemos = demos.filter(d => d.status === 'COMPLETED').length;

    const conversionRate = totalLeads ? ((joinedLeads / totalLeads) * 100).toFixed(1) : '0';

    const sourceData = leadSources.map(source => {
      const sourceLeads = leads.filter(l => l.source === source);
      const joined = sourceLeads.filter(l => l.status === 'JOINED').length;
      const rate = sourceLeads.length ? ((joined / sourceLeads.length) * 100).toFixed(0) : '0';
      return { source, count: sourceLeads.length, joined, rate: Number(rate) };
    }).sort((a, b) => b.count - a.count);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const normalizeLeadDate = (value: string) => {
      const parsed = value.includes('T') ? value.split('T')[0] : value;
      return parsed;
    };

    const timelineData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const isoDate = d.toISOString().split('T')[0];
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayLeads = leads.filter(l => normalizeLeadDate(l.date) === isoDate);
      const joins = dayLeads.filter(l => l.status === 'JOINED').length;
      return { date: dateStr, Leads: dayLeads.length, Conversions: joins };
    });

    return { totalLeads, joinedLeads, totalDemos, completedDemos, conversionRate, sourceData, timelineData };
  }, [leads, demos, leadSources]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };

  const colors = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];

  const statItems = [
    { label: 'Total leads', value: stats.totalLeads },
    { label: 'Conversions', value: stats.joinedLeads },
    { label: 'Demos completed', value: stats.completedDemos },
    { label: 'Conversion rate', value: `${stats.conversionRate}%` },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold text-[#18181b]">Insights</h2>
        <p className="text-sm text-[#71717a] mt-0.5">Pipeline performance at a glance</p>
      </motion.div>

      <motion.div variants={itemVariants} className="surface-panel p-0 overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#e4e4e7]">
          {statItems.map((item) => (
            <div key={item.label} className="px-5 py-4">
              <p className="text-xl font-semibold tabular-nums text-[#18181b]">{item.value}</p>
              <p className="text-xs text-[#71717a] mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={itemVariants} className="surface-panel p-5 sm:p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="section-title">Growth timeline</h3>
            <p className="text-xs text-[#71717a] mt-0.5">Last 7 days</p>
          </div>
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18181b" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorJoins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgb(0 0 0 / 0.06)', padding: '10px' }}
                  labelStyle={{ fontWeight: '600', color: '#18181b', marginBottom: '6px', fontSize: '13px' }}
                />
                <Area type="monotone" dataKey="Leads" stroke="#18181b" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="Conversions" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorJoins)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="surface-panel p-5 sm:p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="section-title">Lead sources</h3>
            <p className="text-xs text-[#71717a] mt-0.5">Volume by channel</p>
          </div>
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sourceData.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <RechartsTooltip
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgb(0 0 0 / 0.06)', padding: '10px' }}
                  labelStyle={{ fontWeight: '600', color: '#18181b', marginBottom: '6px', fontSize: '13px' }}
                />
                <Bar dataKey="count" name="Total leads" radius={[4, 4, 0, 0]}>
                  {stats.sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2 surface-panel p-5 sm:p-6">
          <h3 className="section-title mb-5">Conversion funnel</h3>
          <div className="space-y-2 max-w-xl">
            {[
              { label: 'Leads captured', value: stats.totalLeads, width: '100%' },
              { label: 'Demos scheduled', value: stats.totalDemos, width: '82%' },
              { label: 'Students joined', value: stats.joinedLeads, width: '64%' },
            ].map((step) => (
              <div key={step.label} style={{ width: step.width }} className="mx-auto">
                <div className="flex items-center justify-between py-3 px-4 bg-[#f4f4f5] rounded-lg border border-[#e4e4e7]">
                  <span className="text-sm font-medium text-[#18181b]">{step.label}</span>
                  <span className="text-lg font-semibold tabular-nums text-[#18181b]">{step.value}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
