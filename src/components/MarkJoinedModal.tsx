import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Lead } from '../types';
import OverlayShell from './OverlayShell';
import { Z } from '../constants/overlays';
import { JOINED_FALLBACK_AMOUNT } from '../utils/collection';

interface MarkJoinedModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onConfirm: (leadId: string, amountCollected: number) => void;
}

/**
 * Prompt for the collected amount (₹) when moving a lead to JOINED.
 * Defaults to the standard ₹800 unless the lead already has a recorded amount.
 */
export default function MarkJoinedModal({ isOpen, lead, onClose, onConfirm }: MarkJoinedModalProps) {
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    if (!lead) return;
    const existing = typeof lead.amountCollected === 'number' && lead.amountCollected > 0
      ? lead.amountCollected
      : JOINED_FALLBACK_AMOUNT;
    setAmount(String(existing));
  }, [lead]);

  const handleSubmit = () => {
    if (!lead) return;
    const parsed = Math.max(0, Math.round(Number(amount) || 0));
    onConfirm(lead.id, parsed);
  };

  if (!lead) return null;

  return (
    <OverlayShell isOpen={isOpen} onClose={onClose} zIndex={Z.nested} maxWidth="md">
      <div className="px-5 py-4 border-b border-[#e4e4e7] flex justify-between items-start bg-[#fafafa] shrink-0 relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#d4d4d8] rounded-full sm:hidden" />
        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <div className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#18181b]">Mark as Joined</h3>
            <p className="text-xs text-[#71717a]">Record the amount collected for {lead.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#e4e4e7]"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex-1 space-y-4 overscroll-contain">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">
            Amount collected (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#a1a1aa]">₹</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#f4f4f5] border border-transparent rounded-xl pl-9 pr-4 py-3.5 min-h-[48px] text-sm font-bold text-[#18181b] outline-none focus:bg-white focus:border-[#18181b] transition-all"
            />
          </div>
          <p className="text-xs text-[#71717a] pl-1">
            This amount is added to collection totals once the lead is marked joined.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-[#e4e4e7] bg-[#fafafa] shrink-0 safe-bottom flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 min-h-[48px] bg-[#f4f4f5] text-[#18181b] rounded-xl text-xs font-bold uppercase tracking-widest interactive-element"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-3.5 min-h-[48px] bg-green-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest interactive-element"
        >
          Confirm Join
        </button>
      </div>
    </OverlayShell>
  );
}
