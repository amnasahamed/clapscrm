import { useMemo } from 'react';
import { Lead, Demo } from '../../types';
import { sumJoinCollection, DEMO_COLLECTION_VALUE } from '../../utils/collection';
import { Calendar, MapPin, GraduationCap, BarChart, UserPlus, Video, Users, CreditCard } from 'lucide-react';

interface AnalyticsOverviewProps {
  leads: Lead[];
  demos: Demo[];
}

export default function AnalyticsOverview({ leads, demos }: AnalyticsOverviewProps) {
  
  // Calculate general groupings (Region, Grade, Source)
  const calculateGroupings = (keyFn: (l: Lead) => string) => {
    const groups: Record<string, { enq: number, demo: number, join: number, coll: number }> = {};
    
    leads.forEach(l => {
      const k = keyFn(l) || 'Other';
      if (!groups[k]) groups[k] = { enq: 0, demo: 0, join: 0, coll: 0 };
      groups[k].enq += 1;
      if (l.status === 'JOINED') {
        groups[k].join += 1;
        groups[k].coll += (l.amountCollected ?? 800);
      }
    });

    demos.forEach(d => {
      const l = leads.find(lead => lead.id === d.leadId);
      if (l) {
        const k = keyFn(l) || 'Other';
        if (!groups[k]) groups[k] = { enq: 0, demo: 0, join: 0, coll: 0 };
        groups[k].demo += 1;
        if (d.status === 'COMPLETED') {
          groups[k].coll += DEMO_COLLECTION_VALUE;
        }
      }
    });

    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        ...data,
        conv: data.enq > 0 ? (data.join / data.enq) * 100 : 0
      }))
      .sort((a, b) => b.enq - a.enq);
  };

  const regionalData = useMemo(() => calculateGroupings(l => l.country), [leads, demos]);
  const gradeData = useMemo(() => calculateGroupings(l => l.class), [leads, demos]);
  const sourceData = useMemo(() => calculateGroupings(l => l.source), [leads, demos]);

  // Daily performance (Mocked T to T-6 based on simple counts for presentation, as date parsing can be complex for a mock)
  const dailyData = [
    { label: 'Enq.', t: 42, t1: 38, t2: 45, t3: 40, t4: 35, t5: 39, t6: 41 },
    { label: 'Demos', t: 15, t1: 12, t2: 18, t3: 14, t4: 11, t5: 13, t6: 16 },
    { label: 'Join', t: 6, t1: 4, t2: 8, t3: 5, t4: 3, t5: 6, t6: 7 },
    { label: 'Coll.', t: '12k', t1: '9k', t2: '15k', t3: '11k', t4: '8k', t5: '10k', t6: '13k' },
  ];

  // Weekly Performance (Mocked)
  const weeklyData = [
    { label: 'Enquiries', thisWk: 280, lastWk: 310, avg: 295 },
    { label: 'Demos', thisWk: 95, lastWk: 110, avg: 102 },
    { label: 'Joined', thisWk: 42, lastWk: 38, avg: 40 },
    { label: 'Collection', thisWk: '₹1.1L', lastWk: '₹1.3L', avg: '₹1.2L' },
    { label: 'Conv. Ratio', thisWk: '15.0%', lastWk: '12.2%', avg: '13.6%', isPercentage: true },
  ];

  const formatCurrency = (num: number) => {
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
    return `₹${num}`;
  };

  const TableHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#e4e4e7] bg-white rounded-t-[20px]">
      <h3 className="text-base font-bold text-[#18181b]">{title}</h3>
      <Icon size={18} className="text-[#a1a1aa]" />
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#e4e4e7]">
      <div className="flex justify-between items-start mb-2">
        <Icon size={20} className="text-[#183286]" />
        <span className="text-[10px] font-bold text-[#71717a]">+{trend}%</span>
      </div>
      <p className="text-xs font-bold text-[#71717a] mt-4">{title}</p>
      <p className="text-2xl font-black text-[#18181b]">{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Date Picker Mock */}
      <div className="bg-white border border-[#e4e4e7] rounded-xl p-3 flex items-center justify-between shadow-sm cursor-pointer mb-6">
        <div className="flex items-center gap-2 text-[#183286] font-bold text-sm">
          <Calendar size={18} />
          <span>Oct 01, 2023 - Oct 31, 2023</span>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#a1a1aa]">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Enquiries" value="1,250" icon={UserPlus} trend={12} />
        <StatCard title="Demos" value="450" icon={Video} trend={5} />
        <StatCard title="Joined" value="180" icon={GraduationCap} trend={8} />
        <div className="bg-[#183286] rounded-[20px] p-5 shadow-sm border border-[#183286] text-white">
          <div className="flex justify-between items-start mb-2">
            <CreditCard size={20} className="text-blue-200" />
            <span className="text-[10px] font-bold text-blue-200">Goal: 85%</span>
          </div>
          <p className="text-xs font-bold text-blue-100 mt-4">Collection</p>
          <p className="text-2xl font-black text-white">₹5.0L</p>
        </div>
      </div>

      {/* Daily Performance */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#e4e4e7] overflow-hidden">
        <TableHeader title="Daily Performance" icon={Calendar} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f4f4f5]/50 text-[10px] font-black text-[#71717a] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 border-r border-[#e4e4e7]">Metric</th>
                <th className="px-3 py-3 text-center">T</th>
                <th className="px-3 py-3 text-center">T-1</th>
                <th className="px-3 py-3 text-center">T-2</th>
                <th className="px-3 py-3 text-center">T-3</th>
                <th className="px-3 py-3 text-center text-[#18181b]">T-4</th>
                <th className="px-3 py-3 text-center">T-5</th>
                <th className="px-3 py-3 text-center">T-6</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7] bg-white">
              {dailyData.map((row, i) => (
                <tr key={i} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-semibold text-[#18181b] border-r border-[#e4e4e7]">{row.label}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.t}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.t1}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.t2}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.t3}</td>
                  <td className="px-3 py-3 text-center font-bold text-[#18181b]">{row.t4}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.t5}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.t6}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Performance */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#e4e4e7] overflow-hidden">
        <TableHeader title="Weekly Performance" icon={Calendar} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f4f4f5]/50 text-[10px] font-black text-[#71717a] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-1/3">Metric</th>
                <th className="px-4 py-3 text-center w-1/4">This Wk</th>
                <th className="px-4 py-3 text-center w-1/4">Last Wk</th>
                <th className="px-4 py-3 text-center w-1/4">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7] bg-white">
              {weeklyData.map((row, i) => (
                <tr key={i} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-semibold text-[#18181b]">{row.label}</td>
                  <td className={`px-4 py-3 text-center font-bold ${row.isPercentage ? 'text-indigo-600' : 'text-[#18181b]'}`}>{row.thisWk}</td>
                  <td className={`px-4 py-3 text-center font-bold ${row.isPercentage ? 'text-indigo-600' : 'text-[#71717a]'}`}>{row.lastWk}</td>
                  <td className={`px-4 py-3 text-center font-bold ${row.isPercentage ? 'text-indigo-600' : 'text-[#71717a]'}`}>{row.avg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regional Breakdown */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#e4e4e7] overflow-hidden">
        <TableHeader title="Regional Breakdown" icon={MapPin} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f4f4f5]/50 text-[10px] font-black text-[#71717a] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-1/3">Region</th>
                <th className="px-3 py-3 text-center">Enq</th>
                <th className="px-3 py-3 text-center">Demo</th>
                <th className="px-3 py-3 text-center">Join</th>
                <th className="px-3 py-3 text-center">Coll (₹)</th>
                <th className="px-4 py-3 text-right">Conv</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7] bg-white">
              {regionalData.slice(0, 5).map((row, i) => (
                <tr key={i} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-semibold text-[#18181b]">{row.name}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.enq}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.demo}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.join}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{formatCurrency(row.coll)}</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600">{row.conv.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Breakdown */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#e4e4e7] overflow-hidden">
        <TableHeader title="Grade Breakdown" icon={GraduationCap} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f4f4f5]/50 text-[10px] font-black text-[#71717a] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-1/3">Grade</th>
                <th className="px-3 py-3 text-center">Enq</th>
                <th className="px-3 py-3 text-center">Demo</th>
                <th className="px-3 py-3 text-center">Join</th>
                <th className="px-3 py-3 text-center">Coll (₹)</th>
                <th className="px-4 py-3 text-right">Conv</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7] bg-white">
              {gradeData.slice(0, 5).map((row, i) => (
                <tr key={i} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-semibold text-[#18181b]">{row.name}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.enq}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.demo}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.join}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{formatCurrency(row.coll)}</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600">{row.conv.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source Performance */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#e4e4e7] overflow-hidden">
        <TableHeader title="Source Performance" icon={BarChart} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f4f4f5]/50 text-[10px] font-black text-[#71717a] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-1/3">Source</th>
                <th className="px-3 py-3 text-center">Enq</th>
                <th className="px-3 py-3 text-center">Demo</th>
                <th className="px-3 py-3 text-center">Join</th>
                <th className="px-3 py-3 text-center">Coll (₹)</th>
                <th className="px-4 py-3 text-right">Conv</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7] bg-white">
              {sourceData.slice(0, 5).map((row, i) => (
                <tr key={i} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-semibold text-[#18181b]">{row.name}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.enq}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.demo}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{row.join}</td>
                  <td className="px-3 py-3 text-center font-medium text-[#71717a]">{formatCurrency(row.coll)}</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600">{row.conv.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
