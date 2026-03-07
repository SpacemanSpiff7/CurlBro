import { memo, useCallback } from 'react';
import { Link, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MuscleTags } from './MuscleTags';
import { useSupersetSuggestions } from '@/hooks/useSupersetSuggestions';
import type { Exercise, ExerciseId } from '@/types';

interface SupersetPanelProps {
  exerciseId: ExerciseId;
  open: boolean;
  onAdd: (id: ExerciseId) => void;
  onSearchAll?: () => void;
}

const SupersetItem = memo(function SupersetItem({
  exercise,
  onAdd,
}: {
  exercise: Exercise;
  onAdd: (id: ExerciseId) => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg-interactive"
      onClick={() => onAdd(exercise.id as ExerciseId)}
      aria-label={`Superset with ${exercise.name}`}
      style={{ minHeight: '44px' }}
    >
      <Link size={14} className="flex-shrink-0 text-accent-primary" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-text-primary truncate">
          {exercise.name}
        </div>
        <MuscleTags muscles={exercise.primary_muscles} />
      </div>
    </button>
  );
});

export function SupersetPanel({
  exerciseId,
  open,
  onAdd,
  onSearchAll,
}: SupersetPanelProps) {
  const suggestions = useSupersetSuggestions(exerciseId);

  const handleAdd = useCallback(
    (id: ExerciseId) => {
      onAdd(id);
    },
    [onAdd]
  );

  return (
    <AnimatePresence>
      {open && (suggestions.length > 0 || onSearchAll) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden border-t border-border-subtle bg-bg-elevated"
        >
          <div className="px-2 py-2 space-y-0.5">
            {suggestions.length > 0 && (
              <>
                <div className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider px-1 pb-1">
                  Superset partners
                </div>
                {suggestions.map((s) => (
                  <SupersetItem key={s.id} exercise={s} onAdd={handleAdd} />
                ))}
              </>
            )}
            {onSearchAll && (
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg-interactive"
                onClick={onSearchAll}
                aria-label="Search all exercises"
                style={{ minHeight: '44px' }}
              >
                <Search size={14} className="flex-shrink-0 text-accent-primary" />
                <span className="text-xs font-medium text-accent-primary">
                  Search all exercises
                </span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
