import { memo, useCallback, useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { MuscleTags } from '@/components/exercise/MuscleTags';
import { useSuggestions } from '@/hooks/useSuggestions';
import { useStore } from '@/store';
import type { Exercise, ExerciseId, SupersetSuggestion } from '@/types';

interface SuggestionGroupProps {
  title: string;
  exerciseIds: ExerciseId[];
  onAdd: (id: ExerciseId) => void;
  defaultOpen?: boolean;
}

const SuggestionItem = memo(function SuggestionItem({
  exercise,
  onAdd,
  contextLabel,
}: {
  exercise: Exercise;
  onAdd: (id: ExerciseId) => void;
  contextLabel?: string;
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
        {contextLabel && (
          <div className="text-[10px] text-text-tertiary truncate">
            {contextLabel}
          </div>
        )}
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

// ─── Superset suggestion group with context labels ──────

interface SupersetGroupProps {
  title: string;
  suggestions: SupersetSuggestion[];
  onAdd: (suggestion: SupersetSuggestion) => void;
  defaultOpen?: boolean;
}

function SupersetGroup({
  title,
  suggestions,
  onAdd,
  defaultOpen = false,
}: SupersetGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const graph = useStore((state) => state.graph);

  if (suggestions.length === 0) return null;

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
            {suggestions.length}
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
              {suggestions.map((s) => {
                const exercise = graph.exercises.get(s.exerciseId);
                const parent = graph.exercises.get(s.parentExerciseId);
                if (!exercise) return null;
                const contextLabel = parent
                  ? `superset with ${parent.name}`
                  : undefined;
                return (
                  <SuggestionItem
                    key={s.exerciseId}
                    exercise={exercise}
                    onAdd={() => onAdd(s)}
                    contextLabel={contextLabel}
                  />
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
  const workoutSplit = useStore((state) => state.builder.workoutSplit);
  const exercises = useStore((state) => state.builder.workout.exercises);
  const addExercise = useStore((state) => state.builderActions.addExercise);
  const addExerciseToGroup = useStore((state) => state.builderActions.addExerciseToGroup);

  const handleAdd = useCallback(
    (id: ExerciseId) => {
      addExercise(id);
    },
    [addExercise]
  );

  const handleSupersetAdd = useCallback(
    (suggestion: SupersetSuggestion) => {
      // Find the index of the parent exercise in the workout
      const parentIndex = exercises.findIndex(
        (e) => e.exerciseId === suggestion.parentExerciseId
      );
      if (parentIndex >= 0) {
        addExerciseToGroup(suggestion.exerciseId, parentIndex);
      } else {
        // Fallback: add as standalone if parent no longer exists
        addExercise(suggestion.exerciseId);
      }
    },
    [exercises, addExercise, addExerciseToGroup]
  );

  // Only show "still need to hit" when a workout split is selected
  const showGaps = workoutSplit !== null;

  const hasAnySuggestions =
    suggestions.pairsWellWith.length > 0 ||
    (showGaps && suggestions.stillNeedToHit.length > 0) ||
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
      {showGaps && (
        <SuggestionGroup
          title="Still need to hit"
          exerciseIds={suggestions.stillNeedToHit}
          onAdd={handleAdd}
        />
      )}
      <SupersetGroup
        title="Superset with"
        suggestions={suggestions.supersetWith}
        onAdd={handleSupersetAdd}
      />
    </div>
  );
}
