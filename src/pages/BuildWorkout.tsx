import { useState, useCallback } from 'react';
import { Plus, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExercisePicker } from '@/components/exercise/ExercisePicker';
import { WorkoutList } from '@/components/workout/WorkoutList';
import { SuggestionPanel } from '@/components/workout/SuggestionPanel';
import { WorkoutStatusBar } from '@/components/workout/WorkoutStatusBar';
import { ConflictWarnings } from '@/components/workout/ConflictWarnings';
import { TemplateSelector } from '@/components/workout/TemplateSelector';
import { useAutoWorkoutName } from '@/hooks/useAutoWorkoutName';
import { useStore } from '@/store';
import { WORKOUT_SPLITS, SPLIT_LABELS } from '@/types';
import type { WorkoutSplit } from '@/types';

export function BuildWorkout() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const workout = useStore((state) => state.builder.workout);
  const workoutSplit = useStore((state) => state.builder.workoutSplit);
  const { setWorkoutName, setWorkoutSplit, resetWorkout } = useStore(
    (state) => state.builderActions
  );
  const saveWorkout = useStore((state) => state.libraryActions.saveWorkout);
  const autoName = useAutoWorkoutName();

  const handleSave = useCallback(() => {
    if (workout.exercises.length === 0) return;
    const name = workout.name.trim() || autoName || 'Untitled Workout';
    setWorkoutName(name);
    const now = new Date().toISOString();
    saveWorkout({ ...workout, name, updatedAt: now });
    toast.success(`Saved "${name}"`);
  }, [workout, autoName, setWorkoutName, saveWorkout]);

  const handleSplitToggle = useCallback(
    (split: WorkoutSplit) => {
      setWorkoutSplit(workoutSplit === split ? null : split);
    },
    [workoutSplit, setWorkoutSplit]
  );

  const hasExercises = workout.exercises.length > 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-20">
      {/* Workout name */}
      <Input
        value={workout.name}
        onChange={(e) => setWorkoutName(e.target.value)}
        placeholder={autoName || 'Workout name...'}
        className="text-lg font-medium bg-transparent border-none px-0 placeholder:text-text-tertiary focus-visible:ring-0"
        aria-label="Workout name"
      />

      {/* Workout split selector */}
      <div className="flex gap-1.5 flex-wrap">
        {WORKOUT_SPLITS.map((split) => (
          <button
            key={split}
            onClick={() => handleSplitToggle(split)}
            className={`rounded-full px-3 py-2 min-h-[44px] text-xs font-medium transition-colors flex items-center ${
              workoutSplit === split
                ? 'bg-accent-primary text-bg-root'
                : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
            }`}
          >
            {SPLIT_LABELS[split]}
          </button>
        ))}
      </div>

      {/* Templates (only shown when empty) */}
      {!hasExercises && <TemplateSelector />}

      {/* Exercise list */}
      <WorkoutList />

      {/* Add Exercise card */}
      <button
        onClick={() => setPickerOpen(true)}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent-primary/40 bg-accent-primary/5 py-4 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/10 hover:border-accent-primary/60 active:bg-accent-primary/15"
        aria-label="Add exercise"
      >
        <Plus size={18} />
        Add Exercise
      </button>

      {/* Conflict warnings */}
      <ConflictWarnings />

      {/* Validation bar */}
      <WorkoutStatusBar />

      {/* Suggestions */}
      <SuggestionPanel />

      {/* Action buttons */}
      {hasExercises && (
        <div className="flex gap-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetWorkout}
            className="text-text-secondary"
          >
            <RotateCcw size={14} className="mr-1" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="ml-auto bg-accent-primary text-bg-root hover:bg-accent-hover"
          >
            <Save size={14} className="mr-1" />
            Save
          </Button>
        </div>
      )}

      {/* Exercise Picker Sheet */}
      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
