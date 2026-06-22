import { useState, useEffect } from 'react';
import { X, Calendar, User, SlidersHorizontal, BookOpen, Tag } from 'lucide-react';
import OverlayShell from './OverlayShell';
import { Z } from '../constants/overlays';

export interface LeadFilters {
  dateRange: 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';
  status: string[];
  createdBy: string;
  source: string;
}

interface FilterLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: LeadFilters;
  onApplyFilters: (filters: LeadFilters) => void;
  availableCreators: string[];
  availableSources: string[];
  availableStatuses: string[];
  isAdmin: boolean;
}

export default function FilterLeadsModal({ 
  isOpen, 
  onClose, 
  currentFilters, 
  onApplyFilters,
  availableCreators,
  availableSources,
  availableStatuses,
  isAdmin
}: FilterLeadsModalProps) {
  
  const [localFilters, setLocalFilters] = useState<LeadFilters>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleStatusToggle = (status: string) => {
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
      status: [],
      createdBy: 'ALL',
      source: 'ALL'
    });
  };

  return (
    <OverlayShell isOpen={isOpen} onClose={onClose} zIndex={Z.sheet} maxWidth="md">
            <div className="px-6 py-5 border-b border-[#e4e4e7] flex justify-between items-center bg-[#fafafa] shrink-0 relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-[#e4e4e7] rounded-full sm:hidden" />
              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-[#18181b]">Filter Leads</h2>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[#e4e4e7] rounded-full transition-colors text-[#71717a]">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-8">
              {/* Date Range */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
                  <Calendar size={14} /> Date Added
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH'].map(range => (
                    <button
                      key={range}
                      onClick={() => setLocalFilters({ ...localFilters, dateRange: range as any })}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors border ${localFilters.dateRange === range ? 'bg-[#18181b] text-white border-[#18181b]' : 'bg-white text-[#71717a] border-[#e4e4e7] hover:border-[#18181b] hover:text-[#18181b]'}`}
                    >
                      {range.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status (Multi-select) */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
                  <Tag size={14} /> Pipeline Stage
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableStatuses.map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusToggle(status)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors border ${localFilters.status.includes(status) ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-white text-[#71717a] border-[#e4e4e7] hover:border-[#18181b] hover:text-[#18181b]'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                {localFilters.status.length === 0 && (
                  <p className="text-[10px] text-[#a1a1aa] font-medium italic mt-1">No specific status selected (showing all)</p>
                )}
              </div>

              {/* Admin Only: Owner */}
              {isAdmin && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
                    <User size={14} /> Added By
                  </h3>
                  <select 
                    value={localFilters.createdBy}
                    onChange={(e) => setLocalFilters({ ...localFilters, createdBy: e.target.value })}
                    className="w-full bg-[#f4f4f5] border-none rounded-xl px-4 py-3 text-sm font-bold text-[#18181b] outline-none focus:ring-2 focus:ring-[#18181b]/20"
                  >
                    <option value="ALL">All Counselors</option>
                    {availableCreators.map(creator => (
                      <option key={creator} value={creator}>{creator}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Source */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
                  <BookOpen size={14} /> Source
                </h3>
                <select 
                  value={localFilters.source}
                  onChange={(e) => setLocalFilters({ ...localFilters, source: e.target.value })}
                  className="w-full bg-[#f4f4f5] border-none rounded-xl px-4 py-3 text-sm font-bold text-[#18181b] outline-none focus:ring-2 focus:ring-[#18181b]/20"
                >
                  <option value="ALL">All Sources</option>
                  {availableSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="p-6 border-t border-[#e4e4e7] bg-[#fafafa] flex gap-3 shrink-0">
              <button 
                onClick={handleReset}
                className="flex-1 py-3.5 bg-white border border-[#e4e4e7] text-[#18181b] rounded-xl font-bold hover:bg-[#f4f4f5] transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={handleApply}
                className="flex-1 py-3.5 bg-[#18181b] text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg shadow-black/10"
              >
                Apply Filters
              </button>
            </div>
    </OverlayShell>
  );
}
