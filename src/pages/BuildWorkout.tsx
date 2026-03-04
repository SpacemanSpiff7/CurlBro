import { useState, useCallback } from 'react';
import { Plus, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExercisePicker } from '@/components/exercise/ExercisePicker';
import { WorkoutList } from '@/components/workout/WorkoutList';
import { SuggestionPanel } from '@/components/workout/SuggestionPanel';
import { WorkoutStatusBar } from '@/components/workout/WorkoutStatusBar';
import { TemplateSelector } from '@/components/workout/TemplateSelector';
import { useStore } from '@/store';

export function BuildWorkout() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const workout = useStore((state) => state.builder.workout);
  const { setWorkoutName, resetWorkout } = useStore(
    (state) => state.builderActions
  );
  const saveWorkout = useStore((state) => state.libraryActions.saveWorkout);

  const handleSave = useCallback(() => {
    if (workout.exercises.length === 0) return;
    const name = workout.name.trim() || 'Untitled Workout';
    setWorkoutName(name);
    saveWorkout({ ...workout, name });
  }, [workout, setWorkoutName, saveWorkout]);

  const hasExercises = workout.exercises.length > 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Workout name */}
      <Input
        value={workout.name}
        onChange={(e) => setWorkoutName(e.target.value)}
        placeholder="Workout name..."
        className="text-lg font-medium bg-transparent border-none px-0 placeholder:text-text-tertiary focus-visible:ring-0"
        aria-label="Workout name"
      />

      {/* Templates (only shown when empty) */}
      {!hasExercises && <TemplateSelector />}

      {/* Exercise list */}
      <WorkoutList />

      {/* Validation bar */}
      <WorkoutStatusBar />

      {/* Suggestions */}
      <SuggestionPanel />

      {/* Empty state */}
      {!hasExercises && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-text-tertiary text-sm">
            Pick a template above or tap + to add exercises.
          </div>
        </div>
      )}

      {/* Action buttons */}
      {hasExercises && (
        <div className="flex gap-2">
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

      {/* FAB — Add Exercise */}
      <Button
        onClick={() => setPickerOpen(true)}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-accent-primary text-bg-root shadow-lg hover:bg-accent-hover"
        aria-label="Add exercise"
        size="icon"
      >
        <Plus size={24} />
      </Button>

      {/* Exercise Picker Sheet */}
      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
