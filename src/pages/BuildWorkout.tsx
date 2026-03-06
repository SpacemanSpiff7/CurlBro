import { useState, useCallback } from 'react';
import { Plus, Save, RotateCcw } from 'lucide-react';
import { AdSlot } from '@/components/ads/AdSlot';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExercisePicker } from '@/components/exercise/ExercisePicker';
import { WorkoutList } from '@/components/workout/WorkoutList';
import { SuggestionPanel } from '@/components/workout/SuggestionPanel';
import { WorkoutStatusBar } from '@/components/workout/WorkoutStatusBar';
import { ConflictWarnings } from '@/components/workout/ConflictWarnings';
import { TemplateSelector } from '@/components/workout/TemplateSelector';
import { TopBar } from '@/components/shared/TopBar';
import { useAutoWorkoutName } from '@/hooks/useAutoWorkoutName';
import { useStore } from '@/store';

export function BuildWorkout() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const workout = useStore((state) => state.builder.workout);
  const { setWorkoutName, resetWorkout } = useStore(
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

  const hasExercises = workout.exercises.length > 0;

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Top bar with logo + workout name */}
      <TopBar>
        <Input
          value={workout.name}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder={autoName || 'Workout name...'}
          className="text-lg font-medium bg-transparent border-none shadow-none px-0 placeholder:text-text-tertiary focus-visible:ring-0"
          aria-label="Workout name"
        />
      </TopBar>

      <div className="flex flex-col gap-4 px-4">
        {/* Ad slot */}
        <AdSlot slotKey="build" />

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
      </div>

      {/* Exercise Picker Sheet */}
      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
