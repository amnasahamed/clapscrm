import { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, GraduationCap, TrendingUp, Filter, Phone, MapPin, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Joined() {
  const { leads } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const joinedLeads = useMemo(() => {
    return leads.filter(l => l.status === 'JOINED');
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return joinedLeads;
    const lowerQ = searchQuery.toLowerCase();
    return joinedLeads.filter(l => 
      l.name.toLowerCase().includes(lowerQ) || 
      l.phone.includes(searchQuery)
    );
  }, [joinedLeads, searchQuery]);

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    const revenueBySource: Record<string, number> = {};
    const admissionsBySource: Record<string, number> = {};

    joinedLeads.forEach(lead => {
      const amount = lead.amountCollected || 800; // Default amount if unset
      totalRevenue += amount;
      
      const source = lead.source || 'Unknown';
      revenueBySource[source] = (revenueBySource[source] || 0) + amount;
      admissionsBySource[source] = (admissionsBySource[source] || 0) + 1;
    });

    const revChart = Object.entries(revenueBySource).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const admChart = Object.entries(admissionsBySource).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return {
      totalAdmissions: joinedLeads.length,
      totalRevenue,
      revChart,
      admChart
    };
  }, [joinedLeads]);

  return (
    <div className="space-y-6 pb-24">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#18181b] tracking-tight">Joined Students</h1>
          <p className="text-sm text-[#71717a]">Dashboard & admissions tracking</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#e4e4e7] flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 border border-green-100">
            <GraduationCap size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#71717a]">Total Admissions</p>
            <p className="text-3xl font-black text-[#18181b]">{metrics.totalAdmissions}</p>
          </div>
        </div>
        <div className="bg-[#18181b] rounded-[24px] p-6 shadow-sm border border-[#27272a] flex items-center gap-4">
          <div className="w-12 h-12 bg-[#27272a] rounded-2xl flex items-center justify-center shrink-0">
            <DollarSign size={24} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-400">Total Revenue</p>
            <p className="text-3xl font-black text-white">₹{metrics.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#e4e4e7]">
          <h3 className="text-sm font-bold text-[#18181b] mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#a1a1aa]" />
            Revenue by Source
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.revChart} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} width={80} />
                <Tooltip cursor={{ fill: '#f4f4f5' }} formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {metrics.revChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#18181b' : '#a1a1aa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#e4e4e7]">
          <h3 className="text-sm font-bold text-[#18181b] mb-6 flex items-center gap-2">
            <Filter size={16} className="text-[#a1a1aa]" />
            Admissions by Source
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.admChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f4f4f5' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {metrics.admChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#93c5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-[24px] shadow-sm border border-[#e4e4e7] overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[#e4e4e7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#18181b]">Recent Admissions</h2>
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f4f4f5] border-none rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#18181b]/10 outline-none"
            />
          </div>
        </div>
        <div className="p-4 sm:p-6 bg-[#fafafa]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.length > 0 ? filteredLeads.map(lead => (
              <div key={lead.id} className="bg-white border border-[#e4e4e7] rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                      <span className="text-sm font-bold text-indigo-600">{lead.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#18181b] line-clamp-1">{lead.name}</h4>
                      <div className="flex items-center gap-1 text-[11px] text-[#71717a] font-medium mt-0.5">
                        <Phone size={10} /> {lead.phone}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                    <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Amount Collected</div>
                    <div className="text-2xl font-black text-emerald-600">₹{(lead.amountCollected || 800).toLocaleString()}</div>
                  </div>
                  
                  <div className="bg-[#f4f4f5]/50 rounded-xl p-3 border border-[#e4e4e7]">
                    <div className="text-[10px] font-black text-[#71717a] uppercase tracking-widest mb-1">Ad Source</div>
                    <div className="text-sm font-bold text-[#18181b]">{lead.source}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#e4e4e7] flex items-center justify-between text-[11px] text-[#a1a1aa] font-medium">
                  <span>Joined: {lead.joinedDate ? new Date(lead.joinedDate).toLocaleDateString() : 'Unknown'}</span>
                  <span>{lead.assignedTo || lead.createdBy || 'Unassigned'}</span>
                </div>
              </div>
            )) : (
              <div className="col-span-full p-12 text-center text-[#a1a1aa] font-medium bg-white rounded-[20px] border border-dashed border-[#d4d4d8]">
                No joined students found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
