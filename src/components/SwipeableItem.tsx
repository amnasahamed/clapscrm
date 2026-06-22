import React, { useRef, useState } from 'react';
import { motion, useAnimation, PanInfo, useMotionValue, useTransform } from 'motion/react';

export interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  colorClass: string; // e.g., 'bg-red-500 text-white'
  onAction: () => void;
}

interface SwipeableItemProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;  // Swipe RIGHT to reveal LEFT action
  rightAction?: SwipeAction; // Swipe LEFT to reveal RIGHT action
  threshold?: number;
}

export default function SwipeableItem({ children, leftAction, rightAction, threshold = 80 }: SwipeableItemProps) {
  const controls = useAnimation();
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);

  // Dynamic width based on drag distance
  const leftWidth = useTransform(x, [0, 100, 400], [0, 100, 400]);
  const rightWidth = useTransform(x, [0, -100, -400], [0, 100, 400]);
  
  // Fade in icon as you pull
  const leftOpacity = useTransform(x, [0, threshold / 1.5, threshold], [0, 0.5, 1]);
  const rightOpacity = useTransform(x, [0, -threshold / 1.5, -threshold], [0, 0.5, 1]);

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 10) {
      suppressClickRef.current = true;
    }
  };

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;

    if (Math.abs(offset) > 10) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 300);
    }

    if (leftAction && offset > threshold) {
      leftAction.onAction();
    } else if (rightAction && offset < -threshold) {
      rightAction.onAction();
    }

    controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 35 } });
  };

  const handleClickCapture = (event: React.MouseEvent) => {
    if (suppressClickRef.current || isDragging) {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  return (
    <div className="relative w-full touch-pan-y group/swipeable">
      
      {/* Left Action Background */}
      {leftAction && (
        <motion.div 
          style={{ width: leftWidth }}
          className={`absolute left-0 top-0 bottom-0 overflow-hidden flex items-center justify-center rounded-l-2xl ${leftAction.colorClass}`}
        >
          <motion.div style={{ opacity: leftOpacity }} className="flex flex-col items-center gap-1 shrink-0 w-20">
            {leftAction.icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{leftAction.label}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Right Action Background */}
      {rightAction && (
        <motion.div 
          style={{ width: rightWidth }}
          className={`absolute right-0 top-0 bottom-0 overflow-hidden flex items-center justify-center rounded-r-2xl ${rightAction.colorClass}`}
        >
          <motion.div style={{ opacity: rightOpacity }} className="flex flex-col items-center gap-1 shrink-0 w-20">
            {rightAction.icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{rightAction.label}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Foreground Draggable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDragStart={() => {
          suppressClickRef.current = false;
          setIsDragging(true);
        }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, touchAction: 'pan-y' }}
        className="w-full bg-white relative z-10"
        onClickCapture={handleClickCapture}
      >
        {children}
      </motion.div>
    </div>
  );
}
