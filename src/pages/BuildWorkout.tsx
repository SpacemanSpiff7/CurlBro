import { useState, useCallback } from 'react';
import { Plus, Save, RotateCcw } from 'lucide-react';
import { AdSlot } from '@/components/ads/AdSlot';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExercisePicker } from '@/components/exercise/ExercisePicker';
import { WorkoutList } from '@/components/workout/WorkoutList';
import { EditModeBar } from '@/components/workout/EditModeBar';
import { SuggestionPanel } from '@/components/workout/SuggestionPanel';
import { WorkoutStatusBar } from '@/components/workout/WorkoutStatusBar';
import { ConflictWarnings } from '@/components/workout/ConflictWarnings';
import { TemplateSelector } from '@/components/workout/TemplateSelector';
import { TopBar } from '@/components/shared/TopBar';
import { closeAllSwipeRows } from '@/components/shared/SwipeToReveal';
import { useAutoWorkoutName } from '@/hooks/useAutoWorkoutName';
import { useStore } from '@/store';
import { vibrateGrouped } from '@/utils/haptics';

export function BuildWorkout() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const workout = useStore((state) => state.builder.workout);
  const { setWorkoutName, resetWorkout, groupSelectedExercises, removeSelectedExercises } = useStore(
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

  const handleEnterEditMode = useCallback(() => {
    closeAllSwipeRows();
    setEditMode(true);
    setSelectedIndices(new Set());
  }, []);

  const handleExitEditMode = useCallback(() => {
    setEditMode(false);
    setSelectedIndices(new Set());
  }, []);

  const handleToggleSelect = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIndices.size === workout.exercises.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(workout.exercises.map((_, i) => i)));
    }
  }, [selectedIndices.size, workout.exercises]);

  const handleGroupSelected = useCallback(() => {
    const indices = Array.from(selectedIndices);
    if (indices.length < 2) return;
    groupSelectedExercises(indices);
    vibrateGrouped();
    toast.success('Grouped exercises');
    setSelectedIndices(new Set());
    setEditMode(false);
  }, [selectedIndices, groupSelectedExercises]);

  const handleDeleteSelected = useCallback(() => {
    const indices = Array.from(selectedIndices);
    if (indices.length === 0) return;
    const count = indices.length;
    removeSelectedExercises(indices);
    toast.success(`Removed ${count} exercise${count > 1 ? 's' : ''}`);
    setSelectedIndices(new Set());
    if (workout.exercises.length - count <= 0) {
      setEditMode(false);
    }
  }, [selectedIndices, removeSelectedExercises, workout.exercises.length]);

  const hasExercises = workout.exercises.length > 0;

  // Exit edit mode if all exercises removed
  if (editMode && !hasExercises) {
    setEditMode(false);
    setSelectedIndices(new Set());
  }

  const editButton = hasExercises ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={editMode ? handleExitEditMode : handleEnterEditMode}
      className="text-accent-primary whitespace-nowrap"
      aria-label={editMode ? 'Exit edit mode' : 'Enter edit mode'}
    >
      {editMode ? 'Done' : 'Edit'}
    </Button>
  ) : null;

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Top bar with logo + workout name */}
      <TopBar rightSlot={editButton}>
        <Input
          value={workout.name}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder={autoName || 'Workout name...'}
          className="text-lg font-medium bg-transparent dark:bg-transparent border-none shadow-none px-2 placeholder:text-text-tertiary focus-visible:ring-0"
          aria-label="Workout name"
          disabled={editMode}
        />
      </TopBar>

      <div className="flex flex-col gap-4 px-4">
        {/* Ad slot */}
        <AdSlot slotKey="build" />

        {/* Templates (only shown when empty) */}
        {!hasExercises && <TemplateSelector />}

        {/* Exercise list */}
        <WorkoutList
          editMode={editMode}
          selectedIndices={selectedIndices}
          onToggleSelect={handleToggleSelect}
        />

        {/* Add Exercise card */}
        {!editMode && (
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent-primary/40 bg-accent-primary/5 py-4 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/10 hover:border-accent-primary/60 active:bg-accent-primary/15"
            aria-label="Add exercise"
          >
            <Plus size={18} />
            Add Exercise
          </button>
        )}

        {/* Conflict warnings */}
        {!editMode && <ConflictWarnings />}

        {/* Validation bar */}
        {!editMode && <WorkoutStatusBar />}

        {/* Suggestions */}
        {!editMode && <SuggestionPanel />}

        {/* Action buttons */}
        {hasExercises && !editMode && (
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

      {/* Edit mode floating bar */}
      <EditModeBar
        visible={editMode}
        selectedCount={selectedIndices.size}
        totalCount={workout.exercises.length}
        onGroup={handleGroupSelected}
        onDelete={handleDeleteSelected}
        onSelectAll={handleSelectAll}
      />

      {/* Exercise Picker Sheet */}
      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
