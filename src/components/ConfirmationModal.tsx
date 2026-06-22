import { AlertCircle, X } from 'lucide-react';
import OverlayShell from './OverlayShell';
import { Z } from '../constants/overlays';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Delete', 
  cancelLabel = 'Cancel' 
}: ConfirmationModalProps) {
  return (
    <OverlayShell isOpen={isOpen} onClose={onClose} zIndex={Z.confirm} maxWidth="md">
      <div className="p-6 sm:p-8 pt-10 sm:pt-8 relative">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#e4e4e7] rounded-full sm:hidden" />
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
            <AlertCircle size={24} />
          </div>
          <button onClick={onClose} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#f4f4f5] rounded-xl text-[#a1a1aa]">
            <X size={20} />
          </button>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181b] mb-2">{title}</h3>
        <p className="text-[#71717a] text-sm leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3 p-4 sm:p-6 bg-[#fafafa] border-t border-[#f4f4f5] safe-bottom">
        <button 
          onClick={onClose}
          className="flex-1 py-3.5 min-h-[48px] rounded-2xl text-xs font-bold uppercase tracking-widest text-[#71717a] border border-[#e4e4e7] bg-white transition-all hover:bg-[#f4f4f5] interactive-element"
        >
          {cancelLabel}
        </button>
        <button 
          onClick={() => { onConfirm(); onClose(); }}
          className="flex-1 py-3.5 min-h-[48px] rounded-2xl text-xs font-bold uppercase tracking-widest text-white bg-red-600 transition-all hover:bg-red-700 interactive-element"
        >
          {confirmLabel}
        </button>
      </div>
    </OverlayShell>
  );
}
