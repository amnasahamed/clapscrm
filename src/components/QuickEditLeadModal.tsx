import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Lead, InterestStatus } from '../types';

interface QuickEditLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSave: (leadId: string, updates: Partial<Lead>, newNote?: string) => void;
}

export default function QuickEditLeadModal({ isOpen, lead, onClose, onSave }: QuickEditLeadModalProps) {
  const [interestStatus, setInterestStatus] = useState<InterestStatus | ''>('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Lead['status']>('NEW');

  useEffect(() => {
    if (lead) {
      setInterestStatus(lead.interestStatus || '');
      setStatus(lead.status);
      setNote('');
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSave = () => {
    const updates: Partial<Lead> = { status };
    if (interestStatus) updates.interestStatus = interestStatus as InterestStatus;
    if (interestStatus === 'Interested') updates.isHot = true;
    else if (interestStatus === 'Not Interested' || interestStatus === 'Dead End') updates.isHot = false;

    onSave(lead.id, updates, note.trim() || undefined);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#09090b]/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#e4e4e7] overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-4 border-b border-[#f4f4f5] flex items-center justify-between bg-[#fafafa] shrink-0">
            <div>
              <h2 className="text-lg font-bold text-[#18181b]">Quick Edit</h2>
              <p className="text-xs text-[#71717a]">{lead.name} • {lead.phone}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#e4e4e7] rounded-full transition-colors text-[#71717a]">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-5 overflow-y-auto min-h-0">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa] block mb-2">Interest Status</label>
              <div className="flex flex-wrap gap-2">
                {(['Interested', 'Not Interested', 'No Reply', 'Dead End', 'Re-follow'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setInterestStatus(opt)}
                    className={`px-3 py-2 text-[11px] font-bold rounded-xl transition-all border ${
                      interestStatus === opt
                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                        : 'bg-[#f4f4f5] text-[#71717a] border-transparent hover:bg-[#e4e4e7]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa] block mb-2">Stage</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#f4f4f5] border-none rounded-xl py-2 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#18181b]/20"
              >
                <option value="NEW">New</option>
                <option value="IN PROGRESS">In Progress</option>
                <option value="JOINED">Joined</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa] block mb-2">Quick Note (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Spoke with them today..."
                className="w-full bg-[#f4f4f5] border-none rounded-xl py-2 px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#18181b]/20 resize-none h-20"
              />
            </div>
          </div>

          <div className="p-4 border-t border-[#f4f4f5] bg-[#fafafa]">
            <button
              onClick={handleSave}
              className="w-full py-3 text-sm font-bold text-white bg-[#18181b] rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              <Check size={18} /> Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
