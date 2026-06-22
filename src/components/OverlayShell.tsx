import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Z } from '../constants/overlays';
import { useScrollLock } from '../hooks/useScrollLock';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface OverlayShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  /** Slide up on mobile, scale-in on desktop */
  variant?: 'sheet' | 'dialog';
  maxWidth?: 'sm' | 'md' | 'lg';
  className?: string;
}

const maxWidthClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg'
};

/**
 * Shared overlay shell — backdrop, scroll lock, Escape to close, z-index layering.
 * All popups should use this (directly or via BottomSheet / ConfirmationModal).
 */
export default function OverlayShell({
  isOpen,
  onClose,
  children,
  zIndex = Z.sheet,
  variant = 'sheet',
  maxWidth = 'md',
  className = ''
}: OverlayShellProps) {
  useScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  const isSheet = variant === 'sheet';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 flex ${isSheet ? 'items-end sm:items-center' : 'items-end sm:items-center'} justify-center p-0 sm:p-4`}
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
            initial={isSheet ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={isSheet ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isSheet ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${maxWidthClass[maxWidth]} bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] ${
              isSheet ? 'rounded-t-[28px] sm:rounded-[28px]' : 'rounded-t-[28px] sm:rounded-[28px]'
            } ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
