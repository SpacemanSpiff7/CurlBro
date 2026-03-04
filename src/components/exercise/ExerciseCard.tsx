import { memo, useCallback, useState } from 'react';
import { GripVertical, Repeat, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MuscleTags } from './MuscleTags';
import { SubstitutePanel } from './SubstitutePanel';
import type { Exercise, ExerciseId, WorkoutExercise } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  workoutExercise: WorkoutExercise;
  index: number;
  onUpdate: (index: number, updates: Partial<WorkoutExercise>) => void;
  onRemove: (index: number) => void;
  onSwap: (index: number, newId: ExerciseId) => void;
}

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  workoutExercise,
  index,
  onUpdate,
  onRemove,
  onSwap,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workoutExercise.exerciseId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  };

  const handleSetsChange = useCallback(
    (value: string) => {
      const sets = parseInt(value);
      if (!isNaN(sets) && sets > 0) onUpdate(index, { sets });
    },
    [index, onUpdate]
  );

  const handleRepsChange = useCallback(
    (value: string) => {
      const reps = parseInt(value);
      if (!isNaN(reps) && reps > 0) onUpdate(index, { reps });
    },
    [index, onUpdate]
  );

  const handleWeightChange = useCallback(
    (value: string) => {
      const weight = value === '' ? null : parseFloat(value);
      if (value === '' || (!isNaN(weight!) && weight! >= 0)) {
        onUpdate(index, { weight });
      }
    },
    [index, onUpdate]
  );

  const handleSwap = useCallback(
    (newId: ExerciseId) => {
      onSwap(index, newId);
      setShowSubstitutes(false);
    },
    [index, onSwap]
  );

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <button
          {...attributes}
          {...listeners}
          className="touch-none text-text-tertiary hover:text-text-secondary cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
          style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
        >
          <GripVertical size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">
            {exercise.name}
          </div>
          <MuscleTags muscles={exercise.primary_muscles} />
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-text-tertiary hover:text-text-secondary p-1"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Set/Rep/Weight inputs */}
      <div className="flex items-center gap-2 px-3 pb-3">
        <div className="flex items-center gap-1">
          <label className="text-xs text-text-tertiary w-8">Sets</label>
          <Input
            type="number"
            value={workoutExercise.sets}
            onChange={(e) => handleSetsChange(e.target.value)}
            className="w-14 h-8 text-center text-sm bg-bg-elevated border-border-subtle"
            min={1}
            aria-label="Sets"
          />
        </div>
        <span className="text-text-tertiary text-xs">×</span>
        <div className="flex items-center gap-1">
          <label className="text-xs text-text-tertiary w-8">Reps</label>
          <Input
            type="number"
            value={workoutExercise.reps}
            onChange={(e) => handleRepsChange(e.target.value)}
            className="w-14 h-8 text-center text-sm bg-bg-elevated border-border-subtle"
            min={1}
            aria-label="Reps"
          />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Input
            type="number"
            value={workoutExercise.weight ?? ''}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder="—"
            className="w-16 h-8 text-center text-sm bg-bg-elevated border-border-subtle"
            min={0}
            aria-label="Weight"
          />
          <span className="text-xs text-text-tertiary">lb</span>
        </div>
      </div>

      {/* Expandable actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 pb-3 border-t border-border-subtle pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSubstitutes(!showSubstitutes)}
                className={`text-text-secondary hover:text-accent-primary ${
                  showSubstitutes ? 'text-accent-primary' : ''
                }`}
                aria-label="Swap exercise"
              >
                <Repeat size={14} className="mr-1" />
                Swap
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="text-destructive hover:text-destructive"
                aria-label="Remove exercise"
              >
                <Trash2 size={14} className="mr-1" />
                Remove
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline substitute panel */}
      <SubstitutePanel
        exerciseId={workoutExercise.exerciseId}
        open={showSubstitutes}
        onSwap={handleSwap}
      />
    </motion.div>
  );
});
