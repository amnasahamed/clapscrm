import { useState, useEffect, FormEvent } from 'react';
import { X, Calendar, Clock, User, Video, GraduationCap } from 'lucide-react';
import OverlayShell from './OverlayShell';
import { Z } from '../constants/overlays';
import { Demo } from '../types';

interface RescheduleDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  demo: Demo | null;
  staffOptions: string[];
  onReschedule: (demoId: string, updates: Partial<Demo>) => void;
}

export default function RescheduleDemoModal({
  isOpen,
  onClose,
  demo,
  staffOptions,
  onReschedule
}: RescheduleDemoModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [teacher, setTeacher] = useState('');
  const [meetLink, setMeetLink] = useState('');

  // Reset form when modal opens with a new demo
  useEffect(() => {
    if (isOpen && demo) {
      setDate(demo.date || '');
      setTime(demo.time || '');
      setTeacher(demo.teacher || '');
      setMeetLink(demo.meetLink || '');
    }
  }, [isOpen, demo]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!demo || !date || !time) return;

    onReschedule(demo.id, {
      status: 'RESCHEDULED',
      date,
      time,
      teacher: teacher.trim(),
      meetLink: meetLink.trim()
    });

    onClose();
  };

  if (!demo) return null;

  return (
    <OverlayShell isOpen={isOpen} onClose={onClose} zIndex={Z.nested} maxWidth="lg">
      <div className="px-6 py-5 border-b border-[#e4e4e7] flex justify-between items-center bg-[#fafafa] shrink-0 relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-[#e4e4e7] rounded-full sm:hidden" />
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
            <Video size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-[#18181b]">Reschedule Demo</h2>
            <p className="text-xs font-bold text-[#71717a] uppercase tracking-widest">{demo.studentName}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#e4e4e7] rounded-full text-[#71717a]">
          <X size={20} />
        </button>
      </div>

      <div className="overflow-y-auto overscroll-contain">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-4 bg-[#f4f4f5] rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap size={20} className="text-[#a1a1aa]" />
            </div>
            <div>
              <p className="text-sm font-black text-[#18181b]">{demo.studentName}</p>
              <p className="text-xs font-semibold text-[#71717a]">{demo.class} • {demo.subject}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Date *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={16} className="text-[#a1a1aa]" />
                </div>
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#f4f4f5] border border-transparent focus:bg-white focus:border-[#18181b] rounded-xl text-sm font-semibold transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Time *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock size={16} className="text-[#a1a1aa]" />
                </div>
                <input 
                  type="time" 
                  required
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#f4f4f5] border border-transparent focus:bg-white focus:border-[#18181b] rounded-xl text-sm font-semibold transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Teacher</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-[#a1a1aa]" />
              </div>
              <input 
                type="text"
                value={teacher}
                onChange={e => setTeacher(e.target.value)}
                placeholder="Enter teacher's name..."
                className="w-full pl-10 pr-4 py-3 bg-[#f4f4f5] border border-transparent focus:bg-white focus:border-[#18181b] rounded-xl text-sm font-semibold transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Meet Link (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Video size={16} className="text-[#a1a1aa]" />
              </div>
              <input 
                type="url" 
                placeholder="https://meet.google.com/..."
                value={meetLink}
                onChange={e => setMeetLink(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#f4f4f5] border border-transparent focus:bg-white focus:border-[#18181b] rounded-xl text-sm font-semibold transition-all outline-none"
              />
            </div>
          </div>
        </form>
      </div>

      <div className="p-5 border-t border-[#e4e4e7] bg-[#fafafa] shrink-0 safe-bottom">
        <button 
          onClick={handleSubmit}
          disabled={!date || !time}
          className="w-full py-4 bg-[#18181b] hover:bg-black text-white rounded-xl text-sm font-black transition-colors disabled:opacity-50 interactive-element"
        >
          Confirm Reschedule
        </button>
      </div>
    </OverlayShell>
  );
}
