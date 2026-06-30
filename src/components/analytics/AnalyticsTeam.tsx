import { useMemo } from 'react';
import { Lead, Demo, StaffMember } from '../../types';
import { sumJoinCollection, DEMO_COLLECTION_VALUE } from '../../utils/collection';
import { Download, BarChart2, Users, Video, CreditCard, Info } from 'lucide-react';

interface AnalyticsTeamProps {
  leads: Lead[];
  demos: Demo[];
  staffList: StaffMember[];
}

export default function AnalyticsTeam({ leads, demos, staffList }: AnalyticsTeamProps) {

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    // In a real app we'd filter by month, here we just use all as "this month" for the mock
    const joins = leads.filter(l => l.status === 'JOINED');
    const completedDemos = demos.filter(d => d.status === 'COMPLETED');
    const collection = sumJoinCollection(joins) + completedDemos.length * DEMO_COLLECTION_VALUE;
    
    return {
      enquiries: leads.length,
      demos: completedDemos.length,
      joins: joins.length,
      collection,
    };
  }, [leads, demos]);

  // Calculate staff leaderboard
  const leaderboard = useMemo(() => {
    return staffList.map(staff => {
      const sLeads = leads.filter(l => l.createdBy === staff.name);
      const sJoins = sLeads.filter(l => l.status === 'JOINED');
      const sDemos = demos.filter(d => d.status === 'COMPLETED' && sLeads.some(l => l.id === d.leadId));
      const sCollection = sumJoinCollection(sJoins) + sDemos.length * DEMO_COLLECTION_VALUE;
      
      const conv = sLeads.length > 0 ? (sJoins.length / sLeads.length) * 100 : 0;

      return {
        ...staff,
        leads: sLeads.length,
        joins: sJoins.length,
        collection: sCollection,
        conv
      };
    }).sort((a, b) => b.collection - a.collection);
  }, [leads, demos, staffList]);

  // Mock 4-Week comparison data (derived from leaderboard for realistic numbers)
  const fourWeekComparison = useMemo(() => {
    return leaderboard.map(staff => ({
      name: staff.name,
      avatar: staff.avatar,
      w1: staff.collection * 0.22,
      w2: staff.collection * 0.25,
      w3: staff.collection * 0.33,
      w4: staff.collection * 0.20,
    }));
  }, [leaderboard]);

  const formatCurrency = (num: number) => {
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
    return `₹${num}`;
  };

  const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#e4e4e7]">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-bold text-[#71717a]">{title}</p>
        <Icon size={16} className="text-[#a1a1aa]" />
      </div>
      <p className="text-2xl font-black text-[#18181b]">{value}</p>
      <div className="flex items-center gap-1 mt-2 text-[10px] font-bold">
        {trend >= 0 ? (
          <span className="text-indigo-600">↗ {trend}%</span>
        ) : (
          <span className="text-red-600">↘ {Math.abs(trend)}%</span>
        )}
        <span className="text-[#a1a1aa]">vs last month</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Daily Top Collectors */}
      <div className="bg-[#183286] rounded-[24px] shadow-md overflow-hidden text-white">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-sm font-bold tracking-widest uppercase">Daily Top Collectors</h3>
          <span className="text-[10px] font-medium text-blue-200">Updated 2m ago</span>
        </div>
        <div className="bg-white">
          {leaderboard.slice(0, 3).map((staff, i) => (
            <div key={staff.name} className="flex items-center justify-between p-4 border-b border-[#f4f4f5] last:border-0 hover:bg-[#fafafa]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#183286] w-4">{i + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#18181b]">{staff.name.split(' ')[0]}</span>
                  {staff.avatar ? (
                    <img src={staff.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                      {staff.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-[#183286]">{formatCurrency(staff.collection / 30)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative">
          <select className="appearance-none bg-white border border-[#e4e4e7] rounded-xl px-4 py-2 pr-10 text-sm font-bold text-[#18181b] shadow-sm outline-none">
            <option>October 2023</option>
            <option>September 2023</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#18181b]">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-[#18181b]">Month Performance Dashboard</h3>
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Enquiries" value={monthlyStats.enquiries.toLocaleString()} icon={BarChart2} trend={12} />
        <StatCard title="Demos Conducted" value={monthlyStats.demos.toLocaleString()} icon={Video} trend={8} />
        <StatCard title="Total Joinings" value={monthlyStats.joins.toLocaleString()} icon={Users} trend={-3} />
        <StatCard title="Total Collection" value={formatCurrency(monthlyStats.collection)} icon={CreditCard} trend={24} />
      </div>

      {/* Monthly Leaderboard */}
      <div className="bg-white rounded-[24px] shadow-sm border border-[#e4e4e7] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#e4e4e7]">
          <h3 className="text-base font-bold text-[#18181b]">Monthly Leaderboard</h3>
          <button className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700">
            Export <Download size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f4f4f5]/50 text-[10px] font-black text-[#71717a] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 border-b border-[#e4e4e7]">Staff</th>
                <th className="px-4 py-3 border-b border-[#e4e4e7] text-center">Collection</th>
                <th className="px-4 py-3 border-b border-[#e4e4e7] text-center">Join</th>
                <th className="px-5 py-3 border-b border-[#e4e4e7] text-right">Conv %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7] bg-white">
              {leaderboard.slice(0, 5).map((staff) => (
                <tr key={staff.name} className="hover:bg-[#fafafa]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#18181b]">{staff.name.split(' ')[0]}</span>
                      {staff.avatar ? (
                        <img src={staff.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                          {staff.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-[#183286]">{formatCurrency(staff.collection)}</td>
                  <td className="px-4 py-4 text-center font-medium text-[#71717a]">{staff.joins}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${staff.conv >= 12 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {staff.conv.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="w-full py-4 text-[11px] font-bold text-[#183286] uppercase tracking-widest bg-[#f4f4f5]/30 hover:bg-[#f4f4f5]/60 transition-colors">
          View All Team Members
        </button>
      </div>

      {/* 4-Week Comparison */}
      <div className="bg-white rounded-[24px] shadow-sm border border-[#e4e4e7] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#e4e4e7]">
          <h3 className="text-base font-bold text-[#18181b]">4-Week Comparison</h3>
          <Info size={16} className="text-[#a1a1aa]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f4f4f5]/50 text-[10px] font-black text-[#71717a] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 border-b border-[#e4e4e7]">Staff</th>
                <th className="px-4 py-3 border-b border-[#e4e4e7] text-center">Wk 1</th>
                <th className="px-4 py-3 border-b border-[#e4e4e7] text-center">Wk 2</th>
                <th className="px-5 py-3 border-b border-[#e4e4e7] text-right">Wk 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7] bg-white">
              {fourWeekComparison.slice(0, 5).map((staff) => (
                <tr key={staff.name} className="hover:bg-[#fafafa]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#18181b]">{staff.name.split(' ')[0]}</span>
                      {staff.avatar ? (
                        <img src={staff.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                          {staff.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-[#183286]">{formatCurrency(staff.w1)}</td>
                  <td className="px-4 py-4 text-center font-bold text-[#183286]">{formatCurrency(staff.w2)}</td>
                  <td className="px-5 py-4 text-right font-bold text-[#183286]">{formatCurrency(staff.w3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
