import { motion } from 'framer-motion';
import { ArrowLeftRight, Layers, Trash2 } from 'lucide-react';

export function MockSwipeReveal() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="relative h-14 rounded-lg overflow-hidden">
        {/* Action buttons behind */}
        <div className="absolute inset-y-0 right-0 flex">
          <div className="flex w-[60px] flex-col items-center justify-center bg-accent-primary text-white">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="text-[10px] mt-0.5">Swap</span>
          </div>
          <div className="flex w-[60px] flex-col items-center justify-center bg-amber-500 text-white">
            <Layers className="h-4 w-4" />
            <span className="text-[10px] mt-0.5">Super</span>
          </div>
          <div className="flex w-[60px] flex-col items-center justify-center bg-red-500 text-white">
            <Trash2 className="h-4 w-4" />
            <span className="text-[10px] mt-0.5">Delete</span>
          </div>
        </div>

        {/* Sliding card */}
        <motion.div
          className="absolute inset-0 flex items-center rounded-lg bg-bg-elevated px-3"
          animate={{ x: [0, -180, -180, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 1,
            times: [0, 0.25, 0.65, 0.9],
            ease: 'easeInOut',
          }}
        >
          <p className="text-sm font-medium text-text-primary">Barbell Row</p>
          <p className="ml-auto text-xs text-text-tertiary">4 x 8 x 135 lb</p>
        </motion.div>
      </div>
    </div>
  );
}
