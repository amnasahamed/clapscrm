import { useState } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import { Lead } from '../types';
import OverlayShell from './OverlayShell';
import { Z } from '../constants/overlays';

interface TransferLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  staffOptions: string[];
  currentUserName: string;
  onClose: () => void;
  onTransfer: (leadId: string, toStaff: string) => boolean;
}

export default function TransferLeadModal({
  isOpen,
  lead,
  staffOptions,
  currentUserName,
  onClose,
  onTransfer
}: TransferLeadModalProps) {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!lead || !selectedStaff) return;
    const success = onTransfer(lead.id, selectedStaff);
    if (success) {
      setSelectedStaff('');
      setError('');
      onClose();
    } else {
      setError('A transfer is already pending for this lead.');
    }
  };

  const handleClose = () => {
    setSelectedStaff('');
    setError('');
    onClose();
  };

  const availableStaff = staffOptions.filter(name => name !== currentUserName);

  if (!lead) return null;

  return (
    <OverlayShell isOpen={isOpen} onClose={handleClose} zIndex={Z.nested}>
      <div className="px-5 py-4 border-b border-[#e4e4e7] flex justify-between items-start bg-[#fafafa] shrink-0 relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#d4d4d8] rounded-full sm:hidden" />
        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#18181b]">Transfer Lead</h3>
            <p className="text-xs text-[#71717a]">Request handoff while on leave</p>
          </div>
        </div>
        <button onClick={handleClose} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#e4e4e7]">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex-1 space-y-4 overscroll-contain">
        <div className="p-4 bg-[#f4f4f5] rounded-2xl">
          <p className="text-sm font-bold text-[#18181b]">{lead.name}</p>
          <p className="text-xs text-[#71717a]">{lead.phone} · {lead.class}</p>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Transfer to</label>
          <select
            value={selectedStaff}
            onChange={e => { setSelectedStaff(e.target.value); setError(''); }}
            className="w-full bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3.5 min-h-[48px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b] appearance-none"
          >
            <option value="">Select staff member...</option>
            {availableStaff.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {error && <p className="text-xs font-bold text-red-600 ml-1">{error}</p>}
        </div>
        <p className="text-xs text-[#71717a] leading-relaxed">
          The selected staff member must accept before the lead moves to their pipeline.
        </p>
      </div>

      <div className="p-4 border-t border-[#e4e4e7] bg-[#fafafa] shrink-0 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={!selectedStaff}
          className="w-full py-3.5 min-h-[48px] bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 interactive-element"
        >
          Send Transfer Request
        </button>
      </div>
    </OverlayShell>
  );
}
