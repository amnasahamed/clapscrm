import { useState } from 'react';
import { Search, GraduationCap, Phone, Clock, FileText, User } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Teachers() {
  const { teacherEnquiries } = useData();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  if (!hasPermission('manage_staff')) {
    return <Navigate to="/" replace />;
  }

  const filteredTeachers = teacherEnquiries.filter((t) =>
    t.phone.includes(searchQuery) || 
    (t.staffName && t.staffName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.source && t.source.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18181b] tracking-tight flex items-center gap-2">
            <GraduationCap className="text-purple-600" size={32} />
            Teacher Enquiries
          </h1>
          <p className="text-[#71717a] mt-1">Manage numbers marked as teachers</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#e4e4e7] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#e4e4e7] flex items-center gap-4 bg-[#fafafa]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" size={18} />
            <input
              type="text"
              placeholder="Search by phone, source, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#e4e4e7] rounded-lg focus:outline-none focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e4e4e7]">
                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#71717a]">Date Added</th>
                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#71717a]">Phone Number</th>
                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#71717a]">Source</th>
                <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#71717a]">Added By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7]">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-[#f4f4f5]/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-[#18181b]">
                        <Clock size={14} className="text-[#a1a1aa]" />
                        {new Date(t.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-[#a1a1aa]" />
                        <span className="text-sm font-semibold text-[#18181b]">{t.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                        {t.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-[#71717a]">
                        <User size={14} className="text-[#a1a1aa]" />
                        {t.staffName}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[#a1a1aa]">
                      <GraduationCap size={48} className="mb-4 text-[#e4e4e7]" />
                      <p className="text-[#71717a] font-medium">No teacher enquiries found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
