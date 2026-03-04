import { memo, useCallback } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MuscleTags } from './MuscleTags';
import { useSubstitutes } from '@/hooks/useSubstitutes';
import type { Exercise, ExerciseId } from '@/types';

interface SubstitutePanelProps {
  exerciseId: ExerciseId;
  open: boolean;
  onSwap: (newId: ExerciseId) => void;
}

const SubstituteItem = memo(function SubstituteItem({
  exercise,
  onSwap,
}: {
  exercise: Exercise;
  onSwap: (id: ExerciseId) => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg-interactive"
      onClick={() => onSwap(exercise.id as ExerciseId)}
      aria-label={`Swap to ${exercise.name}`}
      style={{ minHeight: '44px' }}
    >
      <ArrowRightLeft size={14} className="flex-shrink-0 text-accent-primary" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-text-primary truncate">
          {exercise.name}
        </div>
        <MuscleTags muscles={exercise.primary_muscles} />
      </div>
    </button>
  );
});

export function SubstitutePanel({
  exerciseId,
  open,
  onSwap,
}: SubstitutePanelProps) {
  const substitutes = useSubstitutes(exerciseId);

  const handleSwap = useCallback(
    (newId: ExerciseId) => {
      onSwap(newId);
    },
    [onSwap]
  );

  return (
    <AnimatePresence>
      {open && substitutes.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden border-t border-border-subtle bg-bg-elevated"
        >
          <div className="px-2 py-2 space-y-0.5">
            <div className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider px-1 pb-1">
              Substitutes
            </div>
            {substitutes.map((sub) => (
              <SubstituteItem key={sub.id} exercise={sub} onSwap={handleSwap} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
