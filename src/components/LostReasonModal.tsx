import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Lead } from '../types';

interface LostReasonModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onConfirm: (leadId: string, reason: string) => void;
}

const LOST_REASONS = [
  'Price too high',
  'Went with competitor',
  'Not responsive',
  'Timing not right',
  'No longer interested',
  'Other'
];

export default function LostReasonModal({ isOpen, lead, onClose, onConfirm }: LostReasonModalProps) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen || !lead) return null;

  const handleConfirm = () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason.trim()) return;
    onConfirm(lead.id, finalReason);
    setReason('');
    setCustomReason('');
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
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e4e4e7] overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-[#f4f4f5] flex items-center justify-between bg-[#fafafa]">
            <div>
              <h2 className="text-lg font-bold text-[#18181b]">Mark as Lost</h2>
              <p className="text-sm text-[#71717a]">Why is {lead.name} no longer interested?</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#e4e4e7] rounded-full transition-colors text-[#71717a]">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LOST_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                    reason === r
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-white border-[#e4e4e7] text-[#71717a] hover:bg-[#f4f4f5]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason === 'Other' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify..."
                className="w-full p-3 bg-white border border-[#e4e4e7] rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none h-24"
              />
            )}
          </div>

          <div className="p-4 sm:p-6 border-t border-[#f4f4f5] bg-[#fafafa] flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-[#18181b] bg-white border border-[#e4e4e7] rounded-xl hover:bg-[#f4f4f5] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!reason || (reason === 'Other' && !customReason.trim())}
              className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check size={18} /> Confirm Lost
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
