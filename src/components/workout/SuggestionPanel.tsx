import { memo, useCallback, useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { MuscleTags } from '@/components/exercise/MuscleTags';
import { useSuggestions } from '@/hooks/useSuggestions';
import { useStore } from '@/store';
import type { Exercise, ExerciseId } from '@/types';

interface SuggestionGroupProps {
  title: string;
  exerciseIds: ExerciseId[];
  onAdd: (id: ExerciseId) => void;
  defaultOpen?: boolean;
}

const SuggestionItem = memo(function SuggestionItem({
  exercise,
  onAdd,
}: {
  exercise: Exercise;
  onAdd: (id: ExerciseId) => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-bg-interactive"
      onClick={() => onAdd(exercise.id as ExerciseId)}
      aria-label={`Add ${exercise.name}`}
      style={{ minHeight: '44px' }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-text-primary truncate">
          {exercise.name}
        </div>
        <MuscleTags muscles={exercise.primary_muscles} />
      </div>
      <Plus size={14} className="flex-shrink-0 text-accent-primary" />
    </button>
  );
});

function SuggestionGroup({
  title,
  exerciseIds,
  onAdd,
  defaultOpen = false,
}: SuggestionGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const graph = useStore((state) => state.graph);

  if (exerciseIds.length === 0) return null;

  return (
    <div className="border border-border-subtle rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-bg-interactive transition-colors"
        aria-expanded={open}
        style={{ minHeight: '44px' }}
      >
        <span className="text-xs font-medium text-text-secondary">
          {title}
        </span>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-[10px]">
            {exerciseIds.length}
          </Badge>
          {open ? (
            <ChevronUp size={14} className="text-text-tertiary" />
          ) : (
            <ChevronDown size={14} className="text-text-tertiary" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-1 pb-1 space-y-0.5">
              {exerciseIds.map((id) => {
                const exercise = graph.exercises.get(id);
                if (!exercise) return null;
                return (
                  <SuggestionItem key={id} exercise={exercise} onAdd={onAdd} />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SuggestionPanel() {
  const suggestions = useSuggestions();
  const addExercise = useStore((state) => state.builderActions.addExercise);

  const handleAdd = useCallback(
    (id: ExerciseId) => {
      addExercise(id);
    },
    [addExercise]
  );

  const hasAnySuggestions =
    suggestions.pairsWellWith.length > 0 ||
    suggestions.stillNeedToHit.length > 0 ||
    suggestions.supersetWith.length > 0;

  if (!hasAnySuggestions) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider px-1">
        Suggested
      </h3>
      <SuggestionGroup
        title="Pairs well with"
        exerciseIds={suggestions.pairsWellWith}
        onAdd={handleAdd}
        defaultOpen
      />
      <SuggestionGroup
        title="Still need to hit"
        exerciseIds={suggestions.stillNeedToHit}
        onAdd={handleAdd}
      />
      <SuggestionGroup
        title="Superset with"
        exerciseIds={suggestions.supersetWith}
        onAdd={handleAdd}
      />
    </div>
  );
}
