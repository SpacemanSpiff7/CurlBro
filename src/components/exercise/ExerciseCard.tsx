import { memo, useCallback, useMemo, useState } from 'react';
import { GripVertical, Repeat, Trash2, ChevronDown, ChevronUp, Video, Link, Unlink, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MuscleTags } from './MuscleTags';
import { SubstitutePanel } from './SubstitutePanel';
import { SupersetPanel } from './SupersetPanel';
import { VideoSheet } from './VideoSheet';
import { ExercisePicker } from './ExercisePicker';
import { SwipeToReveal } from '@/components/shared/SwipeToReveal';
import type { SwipeAction } from '@/components/shared/SwipeToReveal';
import { cn } from '@/lib/utils';
import { vibrateSelect } from '@/utils/haptics';
import { useStore } from '@/store';
import type { Exercise, ExerciseId, WorkoutExercise } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  workoutExercise: WorkoutExercise;
  index: number;
  onUpdate: (index: number, updates: Partial<WorkoutExercise>) => void;
  onRemove: (index: number) => void;
  onSwap: (index: number, newId: ExerciseId) => void;
  /** When provided, the card registers itself as a sortable item with this ID.
   *  Omit when the card is inside a SupersetContainer (group handles sorting). */
  sortableId?: string;
  /** When true, card is in edit mode — shows checkbox, disables drag/swipe */
  editMode?: boolean;
  /** Whether this card is selected in edit mode */
  selected?: boolean;
  /** Toggle selection callback for edit mode */
  onToggleSelect?: () => void;
  /** Whether this card is a drop target for superset merge */
  isDropTarget?: boolean;
}

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  workoutExercise,
  index,
  onUpdate,
  onRemove,
  onSwap,
  sortableId,
  editMode = false,
  selected = false,
  onToggleSelect,
  isDropTarget = false,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'substitutes' | 'supersets'>('none');
  const [videoOpen, setVideoOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [swapPickerOpen, setSwapPickerOpen] = useState(false);

  const addExerciseToGroup = useStore((state) => state.builderActions.addExerciseToGroup);
  const ungroupExercise = useStore((state) => state.builderActions.ungroupExercise);

  const isSortable = sortableId !== undefined;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId ?? index, disabled: !isSortable || editMode });

  const dndStyle = isSortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : undefined;

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

  const handleRestChange = useCallback(
    (value: string) => {
      const rest = parseInt(value);
      if (!isNaN(rest) && rest >= 0) onUpdate(index, { restSeconds: rest });
    },
    [index, onUpdate]
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      onUpdate(index, { notes: value });
    },
    [index, onUpdate]
  );

  const handleSwap = useCallback(
    (newId: ExerciseId) => {
      onSwap(index, newId);
      setActivePanel('none');
    },
    [index, onSwap]
  );

  const handleSwapFromPicker = useCallback(
    (newId: ExerciseId) => {
      onSwap(index, newId);
      setSwapPickerOpen(false);
      setActivePanel('none');
    },
    [index, onSwap]
  );

  const handleAddToGroup = useCallback(
    (id: ExerciseId) => {
      addExerciseToGroup(id, index);
      setPickerOpen(false);
      setActivePanel('none');
    },
    [index, addExerciseToGroup]
  );

  const handleUngroupSelf = useCallback(() => {
    ungroupExercise(index);
  }, [index, ungroupExercise]);

  const isInGroup = !!workoutExercise.supersetGroupId;

  const swipeActions: SwipeAction[] = useMemo(
    () => [
      {
        key: 'substitute',
        label: 'Swap',
        icon: <Repeat size={16} />,
        color: 'bg-accent-primary',
        onAction: () => {
          setExpanded(true);
          setActivePanel('substitutes');
        },
      },
      {
        key: 'superset',
        label: 'Super',
        icon: <Link size={16} />,
        color: 'bg-warning',
        onAction: () => {
          setExpanded(true);
          setActivePanel('supersets');
        },
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <Trash2 size={16} />,
        color: 'bg-destructive',
        onAction: () => onRemove(index),
      },
    ],
    [index, onRemove]
  );

  // Force collapsed state in edit mode (derived, no setState needed)
  const isExpanded = expanded && !editMode;
  const currentPanel = editMode ? 'none' as const : activePanel;

  const handleCardClick = useCallback(() => {
    if (editMode && onToggleSelect) {
      onToggleSelect();
      vibrateSelect();
    }
  }, [editMode, onToggleSelect]);

  const cardInner = (
    <div
      className={cn(
        'rounded-xl border border-border-subtle bg-bg-surface overflow-hidden transition-shadow',
        isDropTarget && 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-root scale-[1.02]',
        editMode && selected && 'ring-2 ring-accent-primary bg-accent-primary/5',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        {editMode ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 32, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            <div
              className={cn(
                'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
                selected
                  ? 'border-accent-primary bg-accent-primary'
                  : 'border-text-tertiary',
              )}
            >
              {selected && (
                <Check size={12} className="text-bg-root" />
              )}
            </div>
          </motion.div>
        ) : isSortable ? (
          <button
            {...attributes}
            {...listeners}
            data-dnd-handle
            className="touch-none text-text-tertiary hover:text-text-secondary cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
            style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
          >
            <GripVertical size={16} />
          </button>
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">
            {exercise.name}
          </div>
          <MuscleTags muscles={exercise.primary_muscles} />
        </div>

        {!editMode && exercise.video_url && (
          <button
            onClick={() => setVideoOpen(true)}
            className="text-text-tertiary hover:text-accent-primary p-1"
            aria-label="Watch video"
            style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
          >
            <Video size={16} />
          </button>
        )}

        {!editMode && (
          <button
            onClick={() => {
              const next = !expanded;
              setExpanded(next);
              if (!next) setActivePanel('none');
            }}
            className="text-text-tertiary hover:text-text-secondary p-1"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Set/Rep/Weight inputs */}
      <div className="flex items-center gap-2 px-3 pb-3">
        <div className="flex items-center gap-1">
          <label className="text-xs text-text-tertiary w-8">Sets</label>
          <Input
            type="number"
            value={workoutExercise.sets}
            onChange={(e) => handleSetsChange(e.target.value)}
            className="w-14 h-8 text-center bg-bg-elevated border-border-subtle"
            min={1}
            aria-label="Sets"
            disabled={editMode}
          />
        </div>
        <span className="text-text-tertiary text-xs">x</span>
        <div className="flex items-center gap-1">
          <label className="text-xs text-text-tertiary w-8">Reps</label>
          <Input
            type="number"
            value={workoutExercise.reps}
            onChange={(e) => handleRepsChange(e.target.value)}
            className="w-14 h-8 text-center bg-bg-elevated border-border-subtle"
            min={1}
            aria-label="Reps"
            disabled={editMode}
          />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Input
            type="number"
            value={workoutExercise.weight ?? ''}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder="—"
            className="w-16 h-8 text-center bg-bg-elevated border-border-subtle"
            min={0}
            aria-label="Weight"
            disabled={editMode}
          />
          <span className="text-xs text-text-tertiary">lb</span>
        </div>
      </div>

      {/* Expandable actions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-border-subtle pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-tertiary w-8">Rest</label>
                <Input
                  type="number"
                  value={workoutExercise.restSeconds}
                  onChange={(e) => handleRestChange(e.target.value)}
                  className="w-16 h-8 text-center bg-bg-elevated border-border-subtle"
                  min={0}
                  aria-label="Rest seconds"
                  disabled={editMode}
                />
                <span className="text-xs text-text-tertiary">sec</span>
                {isInGroup && (
                  <>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUngroupSelf}
                      className="text-text-secondary hover:text-accent-primary"
                      aria-label="Remove from group"
                    >
                      <Unlink size={14} className="mr-1" />
                      Ungroup
                    </Button>
                  </>
                )}
              </div>
              <textarea
                value={workoutExercise.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add notes (form cues, tempo, etc.)"
                className="w-full rounded-md border border-border-subtle bg-bg-elevated px-3 py-2 text-base md:text-sm text-text-primary placeholder:text-text-tertiary resize-none"
                rows={2}
                disabled={editMode}
                aria-label="Exercise notes"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline substitute panel */}
      <SubstitutePanel
        exerciseId={workoutExercise.exerciseId}
        open={currentPanel === 'substitutes'}
        onSwap={handleSwap}
        onSearchAll={() => setSwapPickerOpen(true)}
      />
      {/* Inline superset panel */}
      <SupersetPanel
        exerciseId={workoutExercise.exerciseId}
        open={currentPanel === 'supersets'}
        onAdd={handleAddToGroup}
        onSearchAll={() => setPickerOpen(true)}
      />
    </div>
  );

  // Sortable wrapper: plain div for dnd-kit, separate from animated content
  const sortableWrapper = (
    <div ref={isSortable ? setNodeRef : undefined} style={dndStyle}>
      {isDragging ? (
        <div className="rounded-xl border-2 border-dashed border-border-subtle bg-bg-surface/30 h-20" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleCardClick}
          role={editMode ? 'button' : undefined}
          aria-pressed={editMode ? selected : undefined}
        >
          {cardInner}
        </motion.div>
      )}
    </div>
  );

  return (
    <>
      {isSortable ? (
        <SwipeToReveal actions={swipeActions} enabled={!editMode}>{sortableWrapper}</SwipeToReveal>
      ) : editMode ? (
        <div onClick={handleCardClick} role="button" aria-pressed={selected}>
          {cardInner}
        </div>
      ) : (
        cardInner
      )}

      {/* Video sheet */}
      <VideoSheet
        exercise={exercise}
        open={videoOpen}
        onOpenChange={setVideoOpen}
      />

      {/* Exercise picker for superset partner */}
      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onAdd={handleAddToGroup}
        title="Add to Superset"
      />

      {/* Exercise picker for swap */}
      <ExercisePicker
        open={swapPickerOpen}
        onOpenChange={setSwapPickerOpen}
        onAdd={handleSwapFromPicker}
        title="Swap Exercise"
      />
    </>
  );
});
