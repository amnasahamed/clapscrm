import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Z } from '../constants/overlays';
import { useScrollLock } from '../hooks/useScrollLock';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  zIndex?: number;
}

const maxWidthClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg'
};

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'md',
  zIndex = Z.sheet
}: BottomSheetProps) {
  useScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${maxWidthClass[maxWidth]} sm:mx-auto bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]`}
          >
            <div className="px-5 py-4 border-b border-[#e4e4e7] flex justify-between items-center bg-[#fafafa] shrink-0 relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#d4d4d8] rounded-full sm:hidden" />
              {(title || icon) && (
                <div className="flex items-center gap-3 mt-1 sm:mt-0 min-w-0">
                  {icon && (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {title && <h2 className="text-lg font-black tracking-tight text-[#18181b] truncate">{title}</h2>}
                    {subtitle && <p className="text-xs text-[#71717a] font-medium truncate">{subtitle}</p>}
                  </div>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#e4e4e7] rounded-full transition-colors text-[#71717a] shrink-0 ml-auto"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 overscroll-contain">{children}</div>

            {footer && (
              <div className="p-4 border-t border-[#e4e4e7] bg-[#fafafa] shrink-0 safe-bottom">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
