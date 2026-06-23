import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useStaff } from '../contexts/StaffContext';
import { motion } from 'motion/react';
import { Lead } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid
} from 'recharts';

interface ProgressRingProps {
  radius: number;
  stroke: number;
  progress: number;
  colorClass: string;
  label: string;
  subtitle: string;
}

function ProgressRing({ radius, stroke, progress, colorClass, label, subtitle }: ProgressRingProps) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, progress) / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-5 bg-white rounded-2xl border border-[#EDEFEA] shadow-sm flex-1 min-w-[200px]">
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="#F6F7F4"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={colorClass}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-xl font-bold text-[#1F2421]">{progress}%</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-[#1F2421] mt-3">{label}</p>
      <p className="text-xs text-[#8A8F8A] mt-0.5">{subtitle}</p>
    </div>
  );
}

export default function Analytics() {
  const { leads, demos, leadSources } = useData();
  const { currentUser } = useAuth();
  const { staffList } = useStaff();

  const isCounselor = currentUser?.role === 'counselor';
  const defaultStaff = isCounselor ? currentUser?.name || '' : 'ALL';
  const [selectedStaff, setSelectedStaff] = useState(defaultStaff);

  const filteredLeads = useMemo(() => {
    if (selectedStaff === 'ALL') return leads;
    return leads.filter(l => l.createdBy === selectedStaff || l.assignedTo === selectedStaff);
  }, [leads, selectedStaff]);

  const filteredDemos = useMemo(() => {
    if (selectedStaff === 'ALL') return demos;
    const leadIds = new Set(filteredLeads.map(l => l.id));
    return demos.filter(d => leadIds.has(d.leadId || '') || d.createdBy === selectedStaff);
  }, [demos, filteredLeads, selectedStaff]);

  const stats = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const joinedLeads = filteredLeads.filter(l => l.status === 'JOINED');
    const totalDemos = filteredDemos.length;
    const completedDemos = filteredDemos.filter(d => d.status === 'COMPLETED').length;

    const conversionRate = totalLeads ? ((joinedLeads.length / totalLeads) * 100).toFixed(1) : '0';

    const sourceData = leadSources.map(source => {
      const sourceLeads = filteredLeads.filter(l => l.source === source);
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
      const dayLeads = filteredLeads.filter(l => normalizeLeadDate(l.date) === isoDate);
      const joins = dayLeads.filter(l => l.status === 'JOINED').length;
      return { date: dateStr, Leads: dayLeads.length, Conversions: joins };
    });

    const sumJoinCollection = (joined: Lead[]) => {
      return joined.reduce((sum, l) => sum + (l.amountCollected ?? 800), 0);
    };
    const collectionAmount = sumJoinCollection(joinedLeads) + completedDemos * 200;

    return { totalLeads, joinedLeads: joinedLeads.length, totalDemos, completedDemos, conversionRate, sourceData, timelineData, collectionAmount };
  }, [filteredLeads, filteredDemos, leadSources]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };

  const colors = ['#9BCC1A', '#2A332B', '#3b82f6', '#f4b740', '#e5484d'];

  const statItems = [
    { label: 'Total leads', value: stats.totalLeads },
    { label: 'Conversions', value: stats.joinedLeads },
    { label: 'Demos completed', value: stats.completedDemos },
    { label: 'Conversion rate', value: `${stats.conversionRate}%` },
  ];

  const JOIN_TARGET = 10;
  const COLLECTION_TARGET = 10000;
  const joinsPercentage = Math.min(100, Math.round((stats.joinedLeads / JOIN_TARGET) * 100));
  const collectionPercentage = Math.min(100, Math.round((stats.collectionAmount / COLLECTION_TARGET) * 100));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5 pb-24">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#18181b]">Insights</h2>
          <p className="text-sm text-[#71717a] mt-0.5">
            {selectedStaff === 'ALL' ? 'Organization performance' : `${selectedStaff}'s Performance`}
          </p>
        </div>
        
        {!isCounselor && (
          <select
            value={selectedStaff}
            onChange={e => setSelectedStaff(e.target.value)}
            className="bg-[#f4f4f5] rounded-xl px-4 py-2.5 min-h-[44px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b] border border-transparent shadow-sm transition-colors cursor-pointer"
          >
            <option value="ALL">All Staff</option>
            {staffList.map(s => (
              <option key={s.name} value={s.name}>{s.name} ({s.role})</option>
            ))}
          </select>
        )}
      </motion.div>

      {/* Quota target rings (visible for individual counselors) */}
      {selectedStaff !== 'ALL' && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProgressRing
            radius={70}
            stroke={8}
            progress={joinsPercentage}
            colorClass="#9BCC1A"
            label="Conversions Target"
            subtitle={`${stats.joinedLeads} / ${JOIN_TARGET} Joined`}
          />
          <ProgressRing
            radius={70}
            stroke={8}
            progress={collectionPercentage}
            colorClass="#2A332B"
            label="Collection Target"
            subtitle={`₹${(stats.collectionAmount / 1000).toFixed(1)}k / ₹${(COLLECTION_TARGET / 1000).toFixed(0)}k`}
          />
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <div key={item.label} className="bg-white rounded-[24px] p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e4e4e7]">
            <p className="text-xl font-bold tabular-nums text-[#18181b]">{item.value}</p>
            <p className="text-xs font-semibold text-[#71717a] mt-1 uppercase tracking-wide">{item.label}</p>
          </div>
        ))}
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
                    <stop offset="5%" stopColor="#9BCC1A" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#9BCC1A" stopOpacity={0} />
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
                <Area type="monotone" dataKey="Conversions" stroke="#9BCC1A" strokeWidth={2} fillOpacity={1} fill="url(#colorJoins)" />
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
          <h3 className="section-title mb-6">Conversion funnel</h3>
          <div className="space-y-3 max-w-xl">
            {[
              { label: 'Leads captured', value: stats.totalLeads, width: '100%' },
              { label: 'Demos scheduled', value: stats.totalDemos, width: '82%' },
              { label: 'Students joined', value: stats.joinedLeads, width: '64%' },
            ].map((step) => (
              <div key={step.label} style={{ width: step.width }} className="mx-auto">
                <div className="flex items-center justify-between py-4 px-5 bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-[#e4e4e7]">
                  <span className="text-sm font-bold tracking-tight text-[#18181b]">{step.label}</span>
                  <span className="text-lg font-black tabular-nums text-[#18181b]">{step.value}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
