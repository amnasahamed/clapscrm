import { useMemo, useState } from 'react';
import { UserMinus, X, CheckCircle2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { isLeadManagedBy, shouldHandoffLeadOnOffboard } from '../utils/leadAccess';
import OverlayShell from './OverlayShell';
import { Z } from '../constants/overlays';

interface AdminOffboardModalProps {
  isOpen: boolean;
  departingStaff: string | null;
  staffOptions: string[];
  onClose: () => void;
  onComplete: (result: {
    leadsReassigned: number;
    leadsKept: number;
    demosLinked: number;
    transfersCancelled: number;
    accountRemoved: boolean;
  }) => void;
  onOffboard: (departingStaff: string, replacementStaff: string) => {
    leadsReassigned: number;
    leadsKept: number;
    demosLinked: number;
    transfersCancelled: number;
  };
  onRemoveAccount: (staffName: string) => void;
}

export default function AdminOffboardModal({
  isOpen,
  departingStaff,
  staffOptions,
  onClose,
  onComplete,
  onOffboard,
  onRemoveAccount,
}: AdminOffboardModalProps) {
  const { leads, demos, leadTransfers } = useData();
  const [replacementStaff, setReplacementStaff] = useState('');
  const [removeAccount, setRemoveAccount] = useState(true);

  const counts = useMemo(() => {
    if (!departingStaff) {
      return { activeLeads: 0, historicalLeads: 0, demos: 0, pendingTransfers: 0 };
    }
    const managedLeads = leads.filter((lead) => isLeadManagedBy(lead, departingStaff));
    const handoffLeads = managedLeads.filter((lead) => shouldHandoffLeadOnOffboard(lead, departingStaff));
    const handoffLeadIds = new Set(handoffLeads.map((lead) => lead.id));
    return {
      activeLeads: handoffLeads.length,
      historicalLeads: managedLeads.length - handoffLeads.length,
      demos: demos.filter((demo) => demo.leadId && handoffLeadIds.has(demo.leadId)).length,
      pendingTransfers: leadTransfers.filter(
        (transfer) =>
          transfer.status === 'pending' &&
          (transfer.fromStaff === departingStaff || transfer.toStaff === departingStaff)
      ).length,
    };
  }, [departingStaff, leads, demos, leadTransfers]);

  const replacementOptions = staffOptions.filter((name) => name !== departingStaff);

  const handleClose = () => {
    setReplacementStaff('');
    setRemoveAccount(true);
    onClose();
  };

  const handleSubmit = () => {
    if (!departingStaff || !replacementStaff) return;
    const result = onOffboard(departingStaff, replacementStaff);
    let accountRemoved = false;
    if (removeAccount) {
      onRemoveAccount(departingStaff);
      accountRemoved = true;
    }
    onComplete({ ...result, accountRemoved });
    setReplacementStaff('');
    setRemoveAccount(true);
    onClose();
  };

  if (!departingStaff) return null;

  return (
    <OverlayShell isOpen={isOpen} onClose={handleClose} zIndex={Z.nested} maxWidth="md">
      <div className="px-5 py-4 border-b border-[#e4e4e7] flex justify-between items-start bg-[#fafafa] shrink-0 relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#d4d4d8] rounded-full sm:hidden" />
        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <UserMinus size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#18181b]">Offboard staff</h3>
            <p className="text-xs text-[#71717a]">Transfer records — nothing is deleted</p>
          </div>
        </div>
        <button onClick={handleClose} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#e4e4e7]">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex-1 space-y-4 overscroll-contain">
        <div className="p-4 bg-[#f4f4f5] rounded-2xl">
          <p className="text-sm font-bold text-[#18181b]">{departingStaff}</p>
          <p className="text-xs text-[#71717a] mt-1">Leaving the company</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-3 bg-white border border-[#e4e4e7] rounded-xl text-center">
            <p className="text-lg font-black text-[#18181b]">{counts.activeLeads}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Active</p>
          </div>
          <div className="p-3 bg-white border border-[#e4e4e7] rounded-xl text-center">
            <p className="text-lg font-black text-[#18181b]">{counts.historicalLeads}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Staying</p>
          </div>
          <div className="p-3 bg-white border border-[#e4e4e7] rounded-xl text-center">
            <p className="text-lg font-black text-[#18181b]">{counts.demos}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Demos</p>
          </div>
          <div className="p-3 bg-white border border-[#e4e4e7] rounded-xl text-center">
            <p className="text-lg font-black text-[#18181b]">{counts.pendingTransfers}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Transfers</p>
          </div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl space-y-2">
          <p className="text-sm font-bold text-green-900 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Records are kept
          </p>
          <ul className="text-xs text-green-800/90 space-y-1 list-disc pl-4">
            <li>Only <strong>New</strong> and <strong>In Progress</strong> leads move to the replacement</li>
            <li>Joined and Lost leads stay under {departingStaff} for future tracking</li>
            <li>Notes, contact history, and demos are never deleted</li>
            <li>Pending handoff requests involving this staff are cancelled</li>
          </ul>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">
            Hand off active leads to
          </label>
          <select
            value={replacementStaff}
            onChange={(e) => setReplacementStaff(e.target.value)}
            className="w-full bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3.5 min-h-[48px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b] appearance-none"
          >
            <option value="">Select replacement counselor...</option>
            {replacementOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <label className="flex items-start gap-3 p-3 bg-[#fafafa] rounded-xl border border-[#f4f4f5] cursor-pointer">
          <input
            type="checkbox"
            checked={removeAccount}
            onChange={(e) => setRemoveAccount(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-[#e4e4e7] text-indigo-600 focus:ring-indigo-600"
          />
          <span className="text-sm font-semibold text-[#18181b]">
            Remove login after transferring records
          </span>
        </label>
      </div>

      <div className="p-4 border-t border-[#e4e4e7] bg-[#fafafa] shrink-0 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={!replacementStaff}
          className="w-full py-3.5 min-h-[48px] bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 interactive-element"
        >
          Transfer &amp; offboard
        </button>
      </div>
    </OverlayShell>
  );
}
