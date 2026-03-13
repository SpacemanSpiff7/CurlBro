import { memo, useCallback, useMemo, useState } from 'react';
import { Repeat, Trash2, ChevronDown, ChevronUp, Video, Link, Unlink, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { inferTrackingFlags } from '@/utils/fieldDefaults';
import { vibrateSelect } from '@/utils/haptics';
import { useStore } from '@/store';
import type { Exercise, ExerciseId, TrackingFlags, WorkoutExercise } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  workoutExercise: WorkoutExercise;
  index: number;
  onUpdate: (index: number, updates: Partial<WorkoutExercise>) => void;
  onRemove: (index: number) => void;
  onSwap: (index: number, newId: ExerciseId) => void;
  /** When true, card is in edit mode — shows checkbox, disables drag/swipe */
  editMode?: boolean;
  /** Whether this card is selected in edit mode */
  selected?: boolean;
  /** Whether to show SwipeToReveal actions around this card */
  swipeActionsEnabled?: boolean;
  /** Whether swipe-to-reveal should be enabled for this card */
  swipeEnabled?: boolean;
  /** Toggle selection callback for edit mode */
  onToggleSelect?: () => void;
  /** Optional drag handle element rendered by parent (BuilderGroupRow) */
  dragHandle?: React.ReactNode;
}

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  workoutExercise,
  index,
  onUpdate,
  onRemove,
  onSwap,
  editMode = false,
  selected = false,
  swipeActionsEnabled = false,
  swipeEnabled = true,
  onToggleSelect,
  dragHandle,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'substitutes' | 'supersets'>('none');
  const [videoOpen, setVideoOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [swapPickerOpen, setSwapPickerOpen] = useState(false);

  const defaultFlags = useMemo(() => inferTrackingFlags(exercise), [exercise]);

  const addExerciseToGroup = useStore((state) => state.builderActions.addExerciseToGroup);
  const ungroupExercise = useStore((state) => state.builderActions.ungroupExercise);

  // Local string state allows fields to be fully cleared while editing.
  // Valid values commit to the store immediately; empty fields restore on blur.
  // Keyed by exercise identity + store values so external changes (template load) reset local state.
  const fieldKey = `${workoutExercise.exerciseId}-${workoutExercise.sets}-${workoutExercise.reps}-${workoutExercise.restSeconds}-${workoutExercise.durationSeconds}`;
  const [localSets, setLocalSets] = useState(String(workoutExercise.sets));
  const [localReps, setLocalReps] = useState(String(workoutExercise.reps));
  const [localRest, setLocalRest] = useState(String(workoutExercise.restSeconds));
  const [localDuration, setLocalDuration] = useState(String(workoutExercise.durationSeconds ?? ''));
  const [syncKey, setSyncKey] = useState(fieldKey);
  if (syncKey !== fieldKey) {
    setSyncKey(fieldKey);
    setLocalSets(String(workoutExercise.sets));
    setLocalReps(String(workoutExercise.reps));
    setLocalRest(String(workoutExercise.restSeconds));
    setLocalDuration(String(workoutExercise.durationSeconds ?? ''));
  }

  const handleSetsChange = useCallback(
    (value: string) => {
      setLocalSets(value);
      const sets = parseInt(value);
      if (!isNaN(sets) && sets > 0) onUpdate(index, { sets });
    },
    [index, onUpdate]
  );

  const handleSetsBlur = useCallback(() => {
    if (localSets === '' || isNaN(parseInt(localSets))) {
      setLocalSets(String(workoutExercise.sets));
    }
  }, [localSets, workoutExercise.sets]);

  const handleRepsChange = useCallback(
    (value: string) => {
      setLocalReps(value);
      const reps = parseInt(value);
      if (!isNaN(reps) && reps > 0) onUpdate(index, { reps });
    },
    [index, onUpdate]
  );

  const handleRepsBlur = useCallback(() => {
    if (localReps === '' || isNaN(parseInt(localReps))) {
      setLocalReps(String(workoutExercise.reps));
    }
  }, [localReps, workoutExercise.reps]);

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
      const raw = value.replace(/[^0-9]/g, '');
      setLocalRest(raw);
      if (raw !== '') {
        const rest = parseInt(raw);
        if (!isNaN(rest) && rest >= 0) onUpdate(index, { restSeconds: rest });
      }
    },
    [index, onUpdate]
  );

  const handleRestBlur = useCallback(() => {
    if (localRest === '') {
      setLocalRest(String(workoutExercise.restSeconds));
    }
  }, [localRest, workoutExercise.restSeconds]);

  const handleNotesChange = useCallback(
    (value: string) => {
      onUpdate(index, { notes: value });
    },
    [index, onUpdate]
  );

  const handleDurationChange = useCallback(
    (value: string) => {
      const raw = value.replace(/[^0-9]/g, '');
      setLocalDuration(raw);
      if (raw !== '') {
        const dur = parseInt(raw);
        if (!isNaN(dur) && dur >= 0) onUpdate(index, { durationSeconds: dur });
      }
    },
    [index, onUpdate]
  );

  const handleDurationBlur = useCallback(() => {
    if (localDuration === '') {
      setLocalDuration(String(workoutExercise.durationSeconds ?? ''));
    }
  }, [localDuration, workoutExercise.durationSeconds]);

  const handleToggleFlag = useCallback(
    (flag: keyof TrackingFlags) => {
      const flags: TrackingFlags = {
        trackWeight: workoutExercise.trackWeight,
        trackReps: workoutExercise.trackReps,
        trackDuration: workoutExercise.trackDuration,
        trackDistance: workoutExercise.trackDistance,
      };
      const activeCount = Object.values(flags).filter(Boolean).length;
      if (flags[flag] && activeCount <= 1) return;
      onUpdate(index, { [flag]: !flags[flag] });
    },
    [index, onUpdate, workoutExercise.trackWeight, workoutExercise.trackReps, workoutExercise.trackDuration, workoutExercise.trackDistance]
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
        'relative rounded-xl border border-border-subtle bg-bg-surface overflow-hidden transition-all duration-150',
        editMode && selected && 'ring-2 ring-accent-primary bg-accent-primary/5',
      )}
    >
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
                selected ? 'border-accent-primary bg-accent-primary' : 'border-text-tertiary',
              )}
            >
              {selected && (
                <Check size={12} className="text-bg-root" />
              )}
            </div>
          </motion.div>
        ) : dragHandle ? (
          dragHandle
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
      </div>

      <div className="flex items-center gap-2 px-3 pb-3 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="text-xs text-text-tertiary w-8">Sets</label>
          <Input
            type="number"
            value={localSets}
            onChange={(e) => handleSetsChange(e.target.value)}
            onBlur={handleSetsBlur}
            className="w-14 h-8 text-center bg-bg-elevated border-border-subtle"
            min={1}
            aria-label="Sets"
            disabled={editMode}
          />
        </div>
        {defaultFlags.trackReps && workoutExercise.trackReps && (
          <>
            <span className="text-text-tertiary text-xs">x</span>
            <div className="flex items-center gap-1">
              <label className="text-xs text-text-tertiary w-8">Reps</label>
              <Input
                type="number"
                value={localReps}
                onChange={(e) => handleRepsChange(e.target.value)}
                onBlur={handleRepsBlur}
                className="w-14 h-8 text-center bg-bg-elevated border-border-subtle"
                min={1}
                aria-label="Reps"
                disabled={editMode}
              />
            </div>
          </>
        )}
        {defaultFlags.trackWeight && workoutExercise.trackWeight && (
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
        )}
        {defaultFlags.trackDuration && workoutExercise.trackDuration && (
          <div className="flex items-center gap-1 ml-auto">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={localDuration}
              onChange={(e) => handleDurationChange(e.target.value)}
              onBlur={handleDurationBlur}
              placeholder="0"
              className="w-20 h-8 text-center bg-bg-elevated border-border-subtle"
              aria-label="Duration seconds"
              disabled={editMode}
            />
            <span className="text-xs text-text-tertiary">sec</span>
          </div>
        )}
      </div>

      {!editMode && (
        <button
          onClick={() => {
            const next = !expanded;
            setExpanded(next);
            if (!next) setActivePanel('none');
          }}
          className={cn(
            'w-full flex items-center justify-center py-1.5 transition-colors',
            isExpanded
              ? 'bg-accent-primary/10 text-accent-primary'
              : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated',
          )}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}

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
              {/* Rest timer + non-default tracking fields (inline) */}
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-text-tertiary w-8">Rest</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={localRest}
                  onChange={(e) => handleRestChange(e.target.value)}
                  onBlur={handleRestBlur}
                  className="w-20 h-8 text-center bg-bg-elevated border-border-subtle"
                  aria-label="Rest seconds"
                  disabled={editMode}
                />
                <span className="text-xs text-text-tertiary">sec</span>
                {workoutExercise.trackReps && !defaultFlags.trackReps && (
                  <div className="flex items-center gap-1 ml-auto">
                    <label className="text-xs text-text-tertiary w-8">Reps</label>
                    <Input
                      type="number"
                      value={localReps}
                      onChange={(e) => handleRepsChange(e.target.value)}
                      onBlur={handleRepsBlur}
                      className="w-14 h-8 text-center bg-bg-elevated border-border-subtle"
                      min={1}
                      aria-label="Reps"
                      disabled={editMode}
                    />
                  </div>
                )}
                {workoutExercise.trackWeight && !defaultFlags.trackWeight && (
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
                )}
                {workoutExercise.trackDuration && !defaultFlags.trackDuration && (
                  <div className="flex items-center gap-1 ml-auto">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={localDuration}
                      onChange={(e) => handleDurationChange(e.target.value)}
                      onBlur={handleDurationBlur}
                      placeholder="0"
                      className="w-20 h-8 text-center bg-bg-elevated border-border-subtle"
                      aria-label="Duration seconds"
                      disabled={editMode}
                    />
                    <span className="text-xs text-text-tertiary">sec</span>
                  </div>
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
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['trackWeight', 'trackReps', 'trackDuration'] as const).map((flag) => {
                  const active = workoutExercise[flag];
                  const label = { trackWeight: 'Weight', trackReps: 'Reps', trackDuration: 'Duration' }[flag];
                  const activeCount = [workoutExercise.trackWeight, workoutExercise.trackReps, workoutExercise.trackDuration, workoutExercise.trackDistance].filter(Boolean).length;
                  const isLastActive = active && activeCount <= 1;
                  return (
                    <button
                      key={flag}
                      onClick={() => handleToggleFlag(flag)}
                      disabled={editMode || isLastActive}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors',
                        active
                          ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
                          : 'bg-bg-elevated text-text-tertiary border border-border-subtle hover:border-text-tertiary',
                        isLastActive && 'opacity-50 cursor-not-allowed',
                      )}
                      aria-label={`${active ? 'Disable' : 'Enable'} ${label.toLowerCase()} tracking`}
                      aria-pressed={active}
                    >
                      {label}
                    </button>
                  );
                })}
                {isInGroup && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUngroupSelf}
                    className="text-text-secondary hover:text-accent-primary ml-auto"
                    aria-label="Remove from group"
                  >
                    <Unlink size={14} className="mr-1" />
                    Ungroup
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SubstitutePanel
        exerciseId={workoutExercise.exerciseId}
        open={currentPanel === 'substitutes'}
        onSwap={handleSwap}
        onSearchAll={() => setSwapPickerOpen(true)}
      />
      <SupersetPanel
        exerciseId={workoutExercise.exerciseId}
        open={currentPanel === 'supersets'}
        onAdd={handleAddToGroup}
        onSearchAll={() => setPickerOpen(true)}
      />
    </div>
  );

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      role={editMode ? 'button' as const : undefined}
      aria-pressed={editMode ? selected : undefined}
    >
      {cardInner}
    </motion.div>
  );

  return (
    <>
      {swipeActionsEnabled ? (
        <SwipeToReveal actions={swipeActions} enabled={!editMode && swipeEnabled}>{cardContent}</SwipeToReveal>
      ) : (
        cardContent
      )}

      <VideoSheet
        exercise={exercise}
        open={videoOpen}
        onOpenChange={setVideoOpen}
      />

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onAdd={handleAddToGroup}
        title="Add to Superset"
      />

      <ExercisePicker
        open={swapPickerOpen}
        onOpenChange={setSwapPickerOpen}
        onAdd={handleSwapFromPicker}
        title="Swap Exercise"
      />
    </>
  );
});
