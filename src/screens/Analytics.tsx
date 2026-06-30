import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useStaff } from '../contexts/StaffContext';
import { motion } from 'motion/react';
import { Lead } from '../types';
import AnalyticsOverview from '../components/analytics/AnalyticsOverview';
import AnalyticsTeam from '../components/analytics/AnalyticsTeam';

// ProgressRing removed as stat cards have been moved to sub-components

export default function Analytics() {
  const { leads, demos, leadSources } = useData();
  const { currentUser } = useAuth();
  const { staffList } = useStaff();

  const isCounselor = currentUser?.role === 'counselor';
  const defaultStaff = isCounselor ? currentUser?.name || '' : 'ALL';
  const [selectedStaff, setSelectedStaff] = useState(defaultStaff);
  const [viewMode, setViewMode] = useState<'overview' | 'team'>('overview');

  const filteredLeads = useMemo(() => {
    if (selectedStaff === 'ALL') return leads;
    return leads.filter(l => l.createdBy === selectedStaff || l.assignedTo === selectedStaff);
  }, [leads, selectedStaff]);

  const filteredDemos = useMemo(() => {
    if (selectedStaff === 'ALL') return demos;
    const leadIds = new Set(filteredLeads.map(l => l.id));
    return demos.filter(d => leadIds.has(d.leadId || '') || d.createdBy === selectedStaff);
  }, [demos, filteredLeads, selectedStaff]);

  // Old stats block removed as calculations are handled by AnalyticsOverview and AnalyticsTeam

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };
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
      <div className="flex items-center gap-2 mb-6 bg-[#f4f4f5] p-1 rounded-xl w-max">
        <button
          onClick={() => setViewMode('overview')}
          className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'overview'
              ? 'bg-white text-[#18181b] shadow-sm'
              : 'text-[#71717a] hover:text-[#18181b]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setViewMode('team')}
          className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'team'
              ? 'bg-white text-[#18181b] shadow-sm'
              : 'text-[#71717a] hover:text-[#18181b]'
          }`}
        >
          Team Performance
        </button>
      </div>

      {viewMode === 'overview' ? (
        <AnalyticsOverview leads={filteredLeads} demos={filteredDemos} />
      ) : (
        <AnalyticsTeam leads={leads} demos={demos} staffList={staffList} />
      )}
    </motion.div>
  );
}
