import { useMemo, useState } from 'react';
import { Download, ScrollText, Filter } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStaff } from '../../contexts/StaffContext';
import { AccessLogEntry } from '../../types';
import { DateRangeFilter, isInDateRange } from '../../utils/dateFilter';
import { downloadCsv } from '../../utils/csv';

const DATE_OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: 'ALL', label: 'All Time' },
  { value: 'TODAY', label: 'Today' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'CUSTOM', label: 'Custom Range' }
];

function formatLogTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminAccessLogsSection() {
  const { accessLogs } = useData();
  const { staffList } = useStaff();

  const [staffFilter, setStaffFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const filteredLogs = useMemo(() => {
    return accessLogs.filter(log => {
      const matchesStaff = staffFilter === 'ALL' || log.staffName === staffFilter;
      const logDate = log.timestamp.split('T')[0];
      const matchesDate = isInDateRange(
        logDate,
        dateRange,
        dateRange === 'CUSTOM' ? { start: customStart, end: customEnd } : undefined
      );
      return matchesStaff && matchesDate;
    });
  }, [accessLogs, staffFilter, dateRange, customStart, customEnd]);

  const staffNames = useMemo(() => {
    const fromLogs = accessLogs.map(l => l.staffName);
    const fromStaff = staffList.map(s => s.name);
    return Array.from(new Set([...fromStaff, ...fromLogs])).sort();
  }, [accessLogs, staffList]);

  const handleExportCsv = () => {
    const headers = ['Staff Name', 'Role', 'Action', 'IP Address', 'Timestamp'];
    const rows = filteredLogs.map((log: AccessLogEntry) => [
      log.staffName,
      log.role,
      log.action === 'login' ? 'Login' : 'App Open',
      log.ipAddress,
      log.timestamp
    ]);
    const dateSlug = new Date().toISOString().split('T')[0];
    downloadCsv(`clapscrm-access-logs-${dateSlug}.csv`, headers, rows);
  };

  return (
    <div className="surface-panel overflow-hidden">
      <div className="px-6 py-5 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-100 text-zinc-700 rounded-xl flex items-center justify-center">
            <ScrollText size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-[#18181b]">Access Log</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] mt-0.5">
              {filteredLogs.length} of {accessLogs.length} events
            </p>
          </div>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={filteredLogs.length === 0}
          className="px-4 py-3 min-h-[44px] bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 interactive-element"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="p-4 sm:p-6 border-b border-[#f4f4f5] space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">
          <Filter size={12} /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <select
            value={staffFilter}
            onChange={e => setStaffFilter(e.target.value)}
            className="bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3 min-h-[48px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b]"
          >
            <option value="ALL">All Staff</option>
            {staffNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as DateRangeFilter)}
            className="bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3 min-h-[48px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b]"
          >
            {DATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {dateRange === 'CUSTOM' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-[#f4f4f5] rounded-xl px-4 py-3 min-h-[48px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b] border border-transparent" />
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-[#f4f4f5] rounded-xl px-4 py-3 min-h-[48px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b] border border-transparent" />
          </div>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#71717a] font-medium">No events match your filters.</p>
        ) : (
          <>
            <div className="md:hidden divide-y divide-[#f4f4f5]">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#18181b] truncate">{log.staffName}</p>
                      <p className="text-[10px] font-bold uppercase text-[#a1a1aa]">{log.role}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                      log.action === 'login' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {log.action === 'login' ? 'Login' : 'Open'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold">{log.ipAddress}</span>
                    <span className="text-[#71717a]">{formatLogTime(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
            <table className="hidden md:table w-full text-left">
              <thead className="sticky top-0 bg-[#fafafa] border-b border-[#e4e4e7]">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">User</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">Action</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">IP</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f5]">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#fafafa]">
                    <td className="px-6 py-3">
                      <p className="text-sm font-bold">{log.staffName}</p>
                      <p className="text-[10px] font-bold uppercase text-[#a1a1aa]">{log.role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                        log.action === 'login' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {log.action === 'login' ? 'Login' : 'App Open'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold">{log.ipAddress}</td>
                    <td className="px-6 py-3 text-xs text-[#71717a]">{formatLogTime(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
