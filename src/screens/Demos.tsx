import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Calendar as CalendarIcon, Video, CheckCircle, XCircle, Search, PlayCircle, Plus,
  List, MoreVertical, ChevronLeft, ChevronRight, Settings, Columns, X, Clock, User, Download, Trash2, MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Demo } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import { useIsMobile } from '../hooks/useIsMobile';
import { MOBILE_FAB_BOTTOM } from '../constants/layout';
import ScheduleDemoModal from '../components/ScheduleDemoModal';
import FilterDemosModal, { DemoFilters } from '../components/FilterDemosModal';
import { exportDemosCsv } from '../utils/exporters';
import { motion, AnimatePresence } from 'motion/react';
import SwipeableItem from '../components/SwipeableItem';
import { filterViewableLeads } from '../utils/leadAccess';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateShort = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getRelativeDateHeader = (dateStr: string) => {
  const today = formatDateForInput(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = formatDateForInput(tomorrowDate);

  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

const STATUS_LABELS: Record<Demo['status'], string> = {
  SCHEDULED: 'Scheduled',
  CONVERTED: 'Converted',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
  NO_SHOW: 'No Show',
  ATTENDED: 'Attended',
  JOINED: 'Joined',
};

export default function Demos() {
  const { currentUser, hasPermission } = useAuth();
  const { demos, updateDemo, deleteDemo, leads } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'PENDING' | 'POST_DEMO' | 'COMPLETED' | 'CALENDAR'>('PENDING');
  const isMobile = useIsMobile();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [filters, setFilters] = useState<DemoFilters>({
    dateRange: 'ALL',
    status: ['SCHEDULED', 'RESCHEDULED'],
    teacher: 'ALL',
    studentClass: 'ALL',
    subject: 'ALL'
  });

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  const availableTeachers = useMemo(() => Array.from(new Set(demos.map(d => d.teacher))), [demos]);
  const availableClasses = useMemo(() => Array.from(new Set(demos.map(d => d.class))), [demos]);
  const availableSubjects = useMemo(() => Array.from(new Set(demos.map(d => d.subject))), [demos]);

  const canViewAllLeads = hasPermission('view_all_leads');

  const viewableLeadIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    return new Set(
      filterViewableLeads(leads, currentUser.name, canViewAllLeads).map(l => l.id)
    );
  }, [leads, currentUser, canViewAllLeads]);

  const viewableDemos = useMemo(() => {
    if (!currentUser) return [];
    if (canViewAllLeads) return demos;
    return demos.filter(d =>
      (d.leadId && viewableLeadIds.has(d.leadId)) || d.createdBy === currentUser.name
    );
  }, [demos, currentUser, canViewAllLeads, viewableLeadIds]);

  const todayStr = formatDateForInput(new Date());

  const todaySummary = useMemo(() => {
    const todayDemos = viewableDemos.filter(d => d.date === todayStr);
    const scheduled = todayDemos.filter(d => d.status === 'SCHEDULED' || d.status === 'RESCHEDULED').length;
    const completed = todayDemos.filter(d => d.status === 'CONVERTED' || d.status === 'JOINED').length;
    const cancelled = todayDemos.filter(d => d.status === 'CANCELLED' || d.status === 'NO_SHOW').length;
    return { scheduled, completed, cancelled, total: todayDemos.length };
  }, [viewableDemos, todayStr]);

  const filteredDemos = useMemo(() => {
    let filtered = viewableDemos;

    if (viewMode === 'CALENDAR') {
      const selectedStr = formatDateForInput(selectedDate);
      filtered = filtered.filter(d => d.date === selectedStr);
    } else if (viewMode === 'PENDING') {
      const todayDate = new Date();
      const tom = new Date(todayDate);
      tom.setDate(tom.getDate() + 1);
      const tomStr = formatDateForInput(tom);
      // Pending shows today and tomorrow demos that are SCHEDULED or RESCHEDULED
      filtered = filtered.filter(d => 
        (d.date === todayStr || d.date === tomStr) && 
        (d.status === 'SCHEDULED' || d.status === 'RESCHEDULED')
      );
    } else if (viewMode === 'POST_DEMO') {
      // Post-demo shows ATTENDED or NO_SHOW demos (need follow-up)
      filtered = filtered.filter(d => d.status === 'ATTENDED' || d.status === 'NO_SHOW');
    } else if (viewMode === 'COMPLETED') {
      // Completed shows JOINED or CONVERTED demos
      filtered = filtered.filter(d => d.status === 'JOINED' || d.status === 'CONVERTED');
    }

    if (viewMode !== 'CALENDAR' && viewMode !== 'PENDING' && viewMode !== 'POST_DEMO' && viewMode !== 'COMPLETED') {
      // Fallback filtering if needed
      if (filters.status.length > 0) {
        filtered = filtered.filter(d => filters.status.includes(d.status));
      }
      if (filters.teacher !== 'ALL') filtered = filtered.filter(d => d.teacher === filters.teacher);
      if (filters.studentClass !== 'ALL') filtered = filtered.filter(d => d.class === filters.studentClass);
      if (filters.subject !== 'ALL') filtered = filtered.filter(d => d.subject === filters.subject);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.studentName.toLowerCase().includes(q) ||
        d.teacher.toLowerCase().includes(q) ||
        d.subject.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time}`).getTime();
      const timeB = new Date(`${b.date}T${b.time}`).getTime();
      return timeA - timeB;
    });
  }, [viewableDemos, filters, searchQuery, viewMode, selectedDate, todayStr]);

  const groupedDemos = useMemo(() => {
    const groups: Record<string, Demo[]> = {};
    filteredDemos.forEach(demo => {
      if (!groups[demo.date]) groups[demo.date] = [];
      groups[demo.date].push(demo);
    });
    return Object.keys(groups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(date => ({
      date,
      header: getRelativeDateHeader(date),
      demos: groups[date]
    }));
  }, [filteredDemos]);

  const handleStatusChange = (id: string, status: Demo['status']) => {
    updateDemo(id, { status });
    setOpenMenuId(null);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteConfirmed = () => {
    if (deleteId) {
      deleteDemo(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusColor = (status: Demo['status']) => {
    switch (status) {
      case 'SCHEDULED': return 'text-blue-700 bg-blue-50 border-blue-100';
      case 'CONVERTED': return 'text-green-700 bg-green-50 border-green-100';
      case 'JOINED': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'ATTENDED': return 'text-teal-700 bg-teal-50 border-teal-100';
      case 'CANCELLED': return 'text-red-700 bg-red-50 border-red-100';
      case 'RESCHEDULED': return 'text-purple-700 bg-purple-50 border-purple-100';
      case 'NO_SHOW': return 'text-orange-700 bg-orange-50 border-orange-100';
      default: return 'text-[#71717a] bg-[#f4f4f5] border-[#e4e4e7]';
    }
  };

  const getStatusDotColor = (status: Demo['status']) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-500';
      case 'CONVERTED': return 'bg-green-500';
      case 'JOINED': return 'bg-emerald-500';
      case 'ATTENDED': return 'bg-teal-500';
      case 'CANCELLED': return 'bg-red-500';
      case 'RESCHEDULED': return 'bg-purple-500';
      case 'NO_SHOW': return 'bg-orange-500';
      default: return 'bg-[#d4d4d8]';
    }
  };

  const activeFilterChips = useMemo(() => {
    const chips: string[] = [];
    if (filters.dateRange !== 'ALL') chips.push(filters.dateRange.replace('_', ' '));
    if (filters.status.length > 0 && filters.status.length < 5) {
      chips.push(...filters.status.map(s => s.replace('_', ' ')));
    }
    if (filters.teacher !== 'ALL') chips.push(filters.teacher);
    if (filters.studentClass !== 'ALL') chips.push(filters.studentClass);
    if (filters.subject !== 'ALL') chips.push(filters.subject);
    return chips;
  }, [filters]);

  const removeFilterChip = (chip: string) => {
    if (filters.dateRange.replace('_', ' ') === chip) setFilters(f => ({ ...f, dateRange: 'ALL' }));
    else if (filters.teacher === chip) setFilters(f => ({ ...f, teacher: 'ALL' }));
    else if (filters.studentClass === chip) setFilters(f => ({ ...f, studentClass: 'ALL' }));
    else if (filters.subject === chip) setFilters(f => ({ ...f, subject: 'ALL' }));
    else {
      const statusMatch = filters.status.find(s => s.replace('_', ' ') === chip);
      if (statusMatch) {
        setFilters(f => ({ ...f, status: f.status.filter(s => s !== statusMatch) }));
      }
    }
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const getDemosForDate = (day: number) => {
    const dateStr = formatDateForInput(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    return viewableDemos.filter(d => d.date === dateStr);
  };

  const renderActionsMenu = (demo: Demo) => {
    const isPending = demo.status === 'SCHEDULED' || demo.status === 'RESCHEDULED';
    const isMenuOpen = openMenuId === demo.id;
    return (
      <div className="relative shrink-0 z-50">
        <button
          onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : demo.id); }}
          className="p-2 min-w-[44px] min-h-[44px] text-[#a1a1aa] hover:text-[#18181b] hover:bg-[#f4f4f5] rounded-xl transition-colors flex items-center justify-center"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
        >
          <MoreVertical size={18} />
        </button>
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Mobile overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                className="fixed inset-0 bg-black/40 z-[90] sm:hidden"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.15 }}
                className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-[#f4f4f5] rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[100] sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-1 sm:w-44 sm:p-1 sm:rounded-xl sm:bg-white sm:border sm:border-[#e4e4e7] sm:shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="menu"
              >
                {/* Mobile drag handle */}
                <div className="w-12 h-1.5 bg-[#d4d4d8] rounded-full mx-auto mb-4 sm:hidden" />
                <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#e4e4e7] sm:rounded-none sm:divide-y-0 sm:bg-transparent">
                  {isPending && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleStatusChange(demo.id, 'CONVERTED'); setOpenMenuId(null); }} className="w-full text-left px-4 py-4 sm:px-3 sm:py-2.5 text-sm sm:text-xs font-bold text-green-600 hover:bg-green-50 flex items-center gap-2">
                        <CheckCircle size={18} className="sm:w-3.5 sm:h-3.5" /> Mark Complete
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleStatusChange(demo.id, 'CANCELLED'); setOpenMenuId(null); }} className="w-full text-left px-4 py-4 sm:px-3 sm:py-2.5 text-sm sm:text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <XCircle size={18} className="sm:w-3.5 sm:h-3.5" /> Cancel Demo
                      </button>
                    </>
                  )}
                  {!isPending && (
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(demo.id, 'RESCHEDULED'); setOpenMenuId(null); }} className="w-full text-left px-4 py-4 sm:px-3 sm:py-2.5 text-sm sm:text-xs font-bold text-[#18181b] hover:bg-[#f4f4f5] flex items-center gap-2">
                      <Video size={18} className="sm:w-3.5 sm:h-3.5" /> Reschedule
                    </button>
                  )}
                  {hasPermission('delete_demo') && (
                    <>
                      <div className="hidden sm:block h-px bg-[#e4e4e7] my-1 mx-2" />
                      <button onClick={(e) => { e.stopPropagation(); confirmDelete(demo.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-4 sm:px-3 sm:py-2.5 text-sm sm:text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <Trash2 size={18} className="sm:w-3.5 sm:h-3.5" /> Delete
                      </button>
                    </>
                  )}
                  {demo.phone && (
                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${demo.phone.replace(/\D/g, '')}`, '_blank'); setOpenMenuId(null); }} className="w-full text-left px-4 py-4 sm:px-3 sm:py-2.5 text-sm sm:text-xs font-bold text-[#18181b] hover:bg-[#f4f4f5] flex items-center gap-2 border-t border-[#e4e4e7]">
                      <MessageCircle size={18} className="text-green-500 sm:w-3.5 sm:h-3.5" /> WhatsApp
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderDemoItem = (demo: Demo, variant: 'agenda' | 'compact' = 'agenda') => {
    const isPending = demo.status === 'SCHEDULED' || demo.status === 'RESCHEDULED';
    const isCompact = variant === 'compact';
    const isMenuOpen = openMenuId === demo.id;

    return (
      <motion.div
        key={demo.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={isMenuOpen ? 'relative z-50' : 'relative'}
      >
        <SwipeableItem
          leftAction={isPending ? {
            icon: <CheckCircle size={22} />,
            label: 'Complete',
            colorClass: 'bg-green-500 text-white',
            onAction: () => handleStatusChange(demo.id, 'CONVERTED')
          } : undefined}
          rightAction={isPending ? {
            icon: <XCircle size={22} />,
            label: 'Cancel',
            colorClass: 'bg-red-500 text-white',
            onAction: () => handleStatusChange(demo.id, 'CANCELLED')
          } : undefined}
        >
          <div className={`bg-white transition-all hover:shadow-md ${isMenuOpen ? 'z-50 overflow-visible relative' : 'relative'} ${isCompact ? 'border border-[#e4e4e7] rounded-2xl p-3.5 mb-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#d4d4d8]' : 'p-4 border-b border-[#e4e4e7] hover:bg-[#fafafa]'}`}>
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Time column */}
              <div className="shrink-0 flex flex-col items-center pt-0.5 w-14 sm:w-16">
                <p className="text-xs sm:text-sm font-black text-[#18181b] leading-tight text-center">{demo.time}</p>
                <div className={`w-1.5 h-1.5 rounded-full mt-2 ${getStatusDotColor(demo.status)}`} />
              </div>

              {/* Divider */}
              <div className={`w-0.5 self-stretch rounded-full ${getStatusDotColor(demo.status)} opacity-25 shrink-0`} />

              {/* Avatar + content */}
              <div className="flex-1 min-w-0 flex gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm"
                  style={{ backgroundColor: getAvatarColor(demo.studentName) }}
                >
                  {getInitials(demo.studentName)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h3 className="text-sm font-black text-[#18181b] truncate leading-tight">{demo.studentName}</h3>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-lg shrink-0 ${getStatusColor(demo.status)}`}>
                      {STATUS_LABELS[demo.status]}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#71717a] truncate">{demo.class} · {demo.subject}</p>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-[#71717a] bg-[#f4f4f5] px-2 py-1 rounded-lg flex items-center gap-1">
                      <User size={10} /> {demo.teacher || 'Unassigned'}
                    </span>
                    {demo.meetLink && isPending && (
                      <a
                        href={demo.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-2 min-h-[36px] rounded-lg flex items-center gap-1 hover:bg-blue-100 transition-colors"
                      >
                        <PlayCircle size={10} /> Join
                      </a>
                    )}
                  </div>
                  {demo.schedulingNotes && (
                    <p className="mt-2 text-xs text-[#71717a] bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100/50 inline-block">
                      {demo.schedulingNotes}
                    </p>
                  )}
                </div>
              </div>

              {renderActionsMenu(demo)}
            </div>
          </div>
        </SwipeableItem>
      </motion.div>
    );
  };

  const KANBAN_COLUMNS: { key: Demo['status']; label: string; color: string }[] = [
    { key: 'SCHEDULED', label: 'Upcoming', color: 'bg-blue-500' },
    { key: 'CONVERTED', label: 'Converted', color: 'bg-green-500' },
    { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500' },
  ];

  return (
    <div className="flex flex-col relative pb-24 space-y-5">



      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-sm font-black text-blue-800">Primary Goal: Lead Parents to a Demo</h2>
          <p className="text-xs font-medium text-blue-600 mt-0.5">Ensure every scheduled demo converts into an admission.</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <Video size={20} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
        {[
          { id: 'PENDING', label: 'Pending Demos' },
          { id: 'POST_DEMO', label: 'Follow Up' },
          { id: 'COMPLETED', label: 'Completed' },
          { id: 'CALENDAR', label: 'Calendar' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as any)}
            className={`px-4 py-2 min-h-[40px] text-xs font-bold rounded-full transition-all border whitespace-nowrap ${
              viewMode === tab.id
                ? 'bg-[#18181b] text-white border-[#18181b] shadow-sm'
                : 'bg-white text-[#71717a] border-[#e4e4e7] active:bg-[#f4f4f5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + filter + view controls */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white sm:bg-transparent p-3 sm:p-0 rounded-3xl sm:rounded-none border border-[#e4e4e7] sm:border-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:shadow-none">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
          <input
            type="text"
            placeholder="Search by student, teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 min-h-[48px] bg-[#f4f4f5] sm:bg-white border-0 sm:border sm:border-[#e4e4e7] rounded-2xl sm:rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner sm:shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
          {hasPermission('schedule_demo') && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-3 min-h-[44px] bg-[#18181b] text-white rounded-2xl text-xs font-bold shadow-sm interactive-element shrink-0"
            >
              <Plus size={16} /> Schedule
            </button>
          )}
          {hasPermission('export_data') && (
            <button
              onClick={() => exportDemosCsv(filteredDemos)}
              disabled={filteredDemos.length === 0}
              title={`Export ${filteredDemos.length} demos to CSV`}
              className="hidden md:flex items-center gap-2 px-4 py-3 min-h-[44px] bg-white border border-[#e4e4e7] hover:border-[#18181b] rounded-2xl text-xs font-bold text-[#18181b] shadow-sm transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed interactive-element"
            >
              <Download size={16} /> Export
            </button>
          )}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white border border-[#e4e4e7] rounded-2xl text-[#18181b] active:bg-[#f4f4f5] shadow-sm transition-all relative shrink-0"
          >
            <Settings size={18} />
            {activeFilterChips.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full" />
            )}
          </button>

          <div className="flex bg-[#f4f4f5] p-1 rounded-xl border border-[#e4e4e7]">
            <ViewToggle active={(viewMode === 'PENDING' || viewMode === 'POST_DEMO' || viewMode === 'COMPLETED')} onClick={() => setViewMode('AGENDA')} icon={<List size={16} />} label="List" />
            <ViewToggle active={viewMode === 'KANBAN'} onClick={() => setViewMode('KANBAN')} icon={<Columns size={16} />} label="Board" />
            <ViewToggle active={viewMode === 'CALENDAR'} onClick={() => setViewMode('CALENDAR')} icon={<CalendarIcon size={16} />} label="Cal" hideLabelOnMobile />
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {activeFilterChips.map(chip => (
            <div key={chip} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18181b] text-white rounded-xl text-xs font-bold shrink-0">
              <span className="uppercase tracking-wider text-[10px]">{chip}</span>
              <button onClick={() => removeFilterChip(chip)} className="hover:text-red-400 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setFilters({ dateRange: 'ALL', status: [], teacher: 'ALL', studentClass: 'ALL', subject: 'ALL' })}
            className="text-[10px] font-bold text-[#71717a] hover:text-[#18181b] px-2 shrink-0"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main content */}
      <div>
        {(viewMode === 'PENDING' || viewMode === 'POST_DEMO' || viewMode === 'COMPLETED') && (
          <div className="space-y-6 pb-12">
            {groupedDemos.length === 0 ? (
              <EmptyState
                icon={<Video size={32} className="text-[#d4d4d8]" />}
                title="No demos found"
                subtitle="Try adjusting your filters or schedule a new demo."
              />
            ) : (
              groupedDemos.map(group => (
                <div key={group.date}>
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <h3 className="text-sm font-black text-[#18181b]">{group.header}</h3>
                    <span className="text-[10px] font-bold text-[#a1a1aa] bg-[#e4e4e7] px-2 py-0.5 rounded-lg">{group.demos.length}</span>
                    <div className="flex-1 h-px bg-[#e4e4e7]" />
                  </div>
                  <div className="bg-white rounded-3xl border border-[#e4e4e7] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <div className="flex flex-col [&>div:last-child>div>div]:border-b-0">
                      {group.demos.map(demo => renderDemoItem(demo, 'agenda'))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {viewMode === 'KANBAN' && (
          <div className="flex lg:grid lg:grid-cols-3 gap-4 overflow-x-auto pb-4 snap-x items-start">
            {KANBAN_COLUMNS.map(col => {
              const statusDemos = filteredDemos.filter(d =>
                d.status === col.key ||
                (col.key === 'SCHEDULED' && d.status === 'RESCHEDULED') ||
                (col.key === 'CANCELLED' && d.status === 'NO_SHOW')
              );
              return (
                <div key={col.key} className="w-[300px] sm:w-[320px] lg:w-auto bg-[#fafafa] border border-[#e4e4e7] rounded-[24px] p-4 shrink-0 snap-center flex flex-col max-h-[calc(100vh-320px)]">
                  <div className="flex items-center gap-2 mb-4 px-1 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${col.color}`} />
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#18181b]">{col.label}</h3>
                    <span className="text-[10px] font-bold text-[#a1a1aa] bg-white border border-[#e4e4e7] px-2 py-0.5 rounded-full ml-auto">{statusDemos.length}</span>
                  </div>
                  <div className="overflow-y-auto no-scrollbar flex-1 space-y-0">
                    {statusDemos.length === 0 ? (
                      <div className="text-center py-12 text-xs font-semibold text-[#a1a1aa]">No demos here</div>
                    ) : (
                      statusDemos.map(demo => renderDemoItem(demo, 'compact'))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'CALENDAR' && (
          <>
            <div className="bg-white border border-[#e4e4e7] rounded-[28px] p-5 sm:p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base sm:text-lg font-black text-[#18181b]">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <div className="flex items-center gap-1">
                  <button onClick={prevMonth} className="p-3 -ml-2 hover:bg-[#f4f4f5] rounded-xl transition-colors"><ChevronLeft size={18} /></button>
                  <button onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }} className="px-3 min-h-[44px] text-xs font-bold hover:bg-[#f4f4f5] rounded-xl transition-colors">Today</button>
                  <button onClick={nextMonth} className="p-3 -mr-2 hover:bg-[#f4f4f5] rounded-xl transition-colors"><ChevronRight size={18} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest py-1">{d}</div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const dateStr = formatDateForInput(date);
                  const isSelected = dateStr === formatDateForInput(selectedDate);
                  const isToday = dateStr === todayStr;
                  const dayDemos = getDemosForDate(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`aspect-square flex flex-col items-center justify-center p-1 rounded-xl transition-all border ${
                        isSelected
                          ? 'border-[#18181b] bg-[#18181b] text-white shadow-md'
                          : isToday
                            ? 'border-[#18181b]/30 bg-[#fafafa] hover:bg-white'
                            : 'border-transparent hover:border-[#e4e4e7] hover:bg-[#fafafa]'
                      }`}
                    >
                      <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                        isSelected ? 'text-white' : isToday ? 'bg-[#18181b] text-white' : 'text-[#18181b]'
                      }`}>
                        {day}
                      </span>
                      <div className="flex gap-0.5 mt-0.5 h-1.5">
                        {dayDemos.slice(0, 3).map((d, idx) => (
                          <span key={idx} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : getStatusDotColor(d.status)}`} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pb-12">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-black text-[#18181b]">
                  {formatDateForInput(selectedDate) === todayStr
                    ? 'Today'
                    : selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <div className="flex-1 h-px bg-[#e4e4e7]" />
              </div>
              {filteredDemos.length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon size={28} className="text-[#d4d4d8]" />}
                  title="No demos on this day"
                  subtitle="Pick another date or schedule a new demo."
                />
              ) : (
                filteredDemos.map(demo => renderDemoItem(demo))
              )}
            </div>
          </>
        )}
      </div>

      {hasPermission('schedule_demo') && (
        <button
          onClick={() => setIsScheduleModalOpen(true)}
          style={{ bottom: MOBILE_FAB_BOTTOM }}
          className="fixed right-4 md:right-8 w-14 h-14 bg-[#18181b] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all z-50 interactive-element md:hidden"
          title="Schedule Demo"
          aria-label="Schedule demo"
        >
          <Plus size={24} />
        </button>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title="Delete Demo"
        message="Are you sure you want to delete this demo record? This action cannot be undone."
      />

      <ScheduleDemoModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        lead={null}
      />

      <FilterDemosModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentFilters={filters}
        onApplyFilters={setFilters}
        availableTeachers={availableTeachers}
        availableClasses={availableClasses}
        availableSubjects={availableSubjects}
      />
    </div>
  );
}

function SummaryChip({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[20px] shrink-0 border snap-start bg-white text-[#18181b] border-[#e4e4e7] shadow-sm">
      {icon}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#71717a] mb-0.5">{label}</p>
        <p className="text-sm font-black leading-none">{value}</p>
      </div>
    </div>
  );
}

function ViewToggle({ active, onClick, icon, label, hideLabelOnMobile = false }: {
  active: boolean; onClick: () => void; icon: ReactNode; label: string; hideLabelOnMobile?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 sm:px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
        active ? 'bg-white shadow-sm text-[#18181b]' : 'text-[#a1a1aa] hover:text-[#71717a]'
      }`}
    >
      {icon}
      <span className={hideLabelOnMobile ? 'hidden sm:inline' : ''}>{label}</span>
    </button>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="py-16 text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-[#f4f4f5] flex items-center justify-center mb-4">{icon}</div>
      <p className="font-black text-[#18181b] text-sm mb-1">{title}</p>
      <p className="text-xs font-semibold text-[#a1a1aa]">{subtitle}</p>
    </div>
  );
}
