import { useState, useCallback } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { vibrate } from '@/utils/haptics';

const DELETE_THRESHOLD = -80;

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
}

export function SwipeToDelete({ onDelete, children }: SwipeToDeleteProps) {
  const controls = useAnimationControls();
  const [dragX, setDragX] = useState(0);

  const handleDrag = useCallback((_: unknown, info: PanInfo) => {
    setDragX(info.offset.x);
  }, []);

  const handleDragEnd = useCallback(
    async (_: unknown, info: PanInfo) => {
      if (info.offset.x < DELETE_THRESHOLD) {
        vibrate(50);
        await controls.start({ x: -400, opacity: 0, transition: { duration: 0.2 } });
        onDelete();
      } else {
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
      }
      setDragX(0);
    },
    [controls, onDelete]
  );

  const showTrash = dragX < -30;

  return (
    <div className="relative overflow-hidden rounded-xl" data-swipe-row>
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 rounded-r-xl transition-opacity ${
          showTrash ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundColor: 'var(--color-destructive)' }}
      >
        <Trash2 size={18} className="text-white" />
      </div>

      <motion.div
        animate={controls}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative"
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
