import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function MockExerciseCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div
        className="rounded-lg bg-bg-elevated px-3 py-2 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Bench Press</p>
            <p className="text-xs text-text-tertiary">3 x 10 x 135 lb</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-text-tertiary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-tertiary" />
          )}
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary">Rest</span>
                  <div className="h-7 w-16 rounded-md bg-bg-interactive" />
                </div>
                <div>
                  <span className="text-xs text-text-secondary">Notes</span>
                  <div className="mt-1 h-12 w-full rounded-md bg-bg-interactive" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
