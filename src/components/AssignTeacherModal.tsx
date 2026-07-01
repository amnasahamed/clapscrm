import { useState, useEffect } from 'react';
import { UserCog, X, ChevronDown } from 'lucide-react';
import { Demo } from '../types';
import OverlayShell from './OverlayShell';
import { Z } from '../constants/overlays';

import { useData } from '../contexts/DataContext';

interface AssignTeacherModalProps {
  isOpen: boolean;
  demo: Demo | null;
  staffOptions: string[];
  onClose: () => void;
  onAssign: (demoId: string, teacher: string) => void;
}

export default function AssignTeacherModal({
  isOpen,
  demo,
  staffOptions,
  onClose,
  onAssign
}: AssignTeacherModalProps) {
  const [selectedStaff, setSelectedStaff] = useState('');
  const { teachers } = useData();

  // Reset selected staff when modal opens with a new demo
  useEffect(() => {
    if (isOpen && demo) {
      setSelectedStaff(demo.teacher || '');
    }
  }, [isOpen, demo]);

  const handleSubmit = () => {
    if (!demo) return;
    onAssign(demo.id, selectedStaff);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!demo) return null;

  const hasChanged = selectedStaff !== (demo.teacher || '');

  return (
    <OverlayShell isOpen={isOpen} onClose={handleClose} zIndex={Z.nested}>
      <div className="px-5 py-4 border-b border-[#e4e4e7] flex justify-between items-start bg-[#fafafa] shrink-0 relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#d4d4d8] rounded-full sm:hidden" />
        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <UserCog size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#18181b]">Assign Teacher</h3>
            <p className="text-xs text-[#71717a]">Select a teacher for this demo</p>
          </div>
        </div>
        <button onClick={handleClose} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#e4e4e7]">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex-1 space-y-4 overscroll-contain">
        <div className="p-4 bg-[#f4f4f5] rounded-2xl">
          <p className="text-sm font-bold text-[#18181b]">{demo.studentName}</p>
          <p className="text-xs text-[#71717a]">
            Currently: {demo.teacher || 'Unassigned'}
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Teacher Name</label>
          <div className="relative">
            <select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              className="w-full bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3.5 min-h-[48px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b] appearance-none"
            >
              <option value="">Unassigned (leave blank)</option>
              {teachers.map(t => (
                <option key={t.id} value={t.teacher_name}>
                  {t.teacher_name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#a1a1aa]">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[#e4e4e7] bg-[#fafafa] shrink-0 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={!hasChanged}
          className="w-full py-3.5 min-h-[48px] bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 interactive-element"
        >
          Save Changes
        </button>
      </div>
    </OverlayShell>
  );
}
