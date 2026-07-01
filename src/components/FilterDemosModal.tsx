import { useState, useEffect } from 'react';
import { X, Calendar, User, GraduationCap, CheckCircle, SlidersHorizontal, BookOpen } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import OverlayShell from './OverlayShell';
import { Z } from '../constants/overlays';
import { Demo } from '../types';

export interface DemoFilters {
  dateRange: 'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'CUSTOM';
  status: Demo['status'][];
  teacher: string;
  studentClass: string;
  subject: string;
}

interface FilterDemosModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: DemoFilters;
  onApplyFilters: (filters: DemoFilters) => void;
  availableTeachers: string[];
  availableClasses: string[];
  availableSubjects: string[];
}

export default function FilterDemosModal({ 
  isOpen, 
  onClose, 
  currentFilters, 
  onApplyFilters,
  availableTeachers,
  availableClasses,
  availableSubjects
}: FilterDemosModalProps) {
  
  const [localFilters, setLocalFilters] = useState<DemoFilters>(currentFilters);
  const { teachers } = useData();

  // Combine teachers from DB with any existing teachers in demos
  const allTeacherNames = Array.from(new Set([
    ...availableTeachers,
    ...teachers.map(t => t.teacher_name)
  ])).sort();

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleStatusToggle = (status: Demo['status']) => {
    setLocalFilters(prev => {
      if (prev.status.includes(status)) {
        return { ...prev, status: prev.status.filter(s => s !== status) };
      } else {
        return { ...prev, status: [...prev.status, status] };
      }
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      dateRange: 'ALL',
      status: ['SCHEDULED', 'RESCHEDULED'],
      teacher: 'ALL',
      studentClass: 'ALL',
      subject: 'ALL'
    });
  };

  return (
    <OverlayShell isOpen={isOpen} onClose={onClose} zIndex={Z.sheet} maxWidth="md">
            <div className="px-6 py-5 border-b border-[#e4e4e7] flex justify-between items-center bg-[#fafafa] shrink-0 relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-[#e4e4e7] rounded-full sm:hidden" />
              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-[#18181b]">Filter Demos</h2>
                </div>
              </div>
              <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] hover:bg-[#e4e4e7] rounded-full transition-colors text-[#71717a]">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-8">
              
              {/* Date Range */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1 flex items-center gap-1.5">
                  <Calendar size={12} /> Date
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'TODAY', 'TOMORROW', 'THIS_WEEK'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setLocalFilters({ ...localFilters, dateRange: range })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        localFilters.dateRange === range 
                          ? 'bg-[#18181b] text-white' 
                          : 'bg-[#f4f4f5] text-[#71717a] hover:bg-[#e4e4e7]'
                      }`}
                    >
                      {range.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1 flex items-center gap-1.5">
                  <CheckCircle size={12} /> Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'] as Demo['status'][]).map(status => {
                    const isSelected = localFilters.status.includes(status);
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusToggle(status)}
                        className={`px-4 py-2.5 min-h-[44px] rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                          isSelected 
                            ? 'bg-[#18181b] text-white border-[#18181b]' 
                            : 'bg-white text-[#71717a] border-[#e4e4e7] hover:border-[#a1a1aa]'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teacher */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1 flex items-center gap-1.5">
                  <User size={12} /> Teacher
                </label>
                <select 
                  value={localFilters.teacher}
                  onChange={(e) => setLocalFilters({ ...localFilters, teacher: e.target.value })}
                  className="w-full px-4 py-3 bg-[#f4f4f5] border border-transparent rounded-xl text-sm font-semibold text-[#18181b] focus:outline-none focus:border-[#18181b] focus:bg-white transition-all appearance-none"
                >
                  <option value="ALL">All Teachers</option>
                  {allTeacherNames.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1 flex items-center gap-1.5">
                  <GraduationCap size={12} /> Class
                </label>
                <select 
                  value={localFilters.studentClass}
                  onChange={(e) => setLocalFilters({ ...localFilters, studentClass: e.target.value })}
                  className="w-full px-4 py-3 bg-[#f4f4f5] border border-transparent rounded-xl text-sm font-semibold text-[#18181b] focus:outline-none focus:border-[#18181b] focus:bg-white transition-all appearance-none"
                >
                  <option value="ALL">All Classes</option>
                  {availableClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1 flex items-center gap-1.5">
                  <BookOpen size={12} /> Subject
                </label>
                <select 
                  value={localFilters.subject}
                  onChange={(e) => setLocalFilters({ ...localFilters, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-[#f4f4f5] border border-transparent rounded-xl text-sm font-semibold text-[#18181b] focus:outline-none focus:border-[#18181b] focus:bg-white transition-all appearance-none"
                >
                  <option value="ALL">All Subjects</option>
                  {availableSubjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="p-4 border-t border-[#e4e4e7] bg-white flex gap-3 shrink-0 safe-bottom">
              <button 
                onClick={handleReset} 
                className="px-6 py-3.5 bg-[#f4f4f5] text-[#18181b] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#e4e4e7] transition-colors interactive-element"
              >
                Reset
              </button>
              <button 
                onClick={handleApply} 
                className="flex-1 py-3.5 bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 transition-all interactive-element"
              >
                Apply Filters
              </button>
            </div>
    </OverlayShell>
  );
}
