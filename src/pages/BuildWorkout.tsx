import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Plus, Save, RotateCcw, Info } from 'lucide-react';
import { AdSlot } from '@/components/ads/AdSlot';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ExercisePicker } from '@/components/exercise/ExercisePicker';
import { WorkoutList } from '@/components/workout/WorkoutList';
import { EditModeBar } from '@/components/workout/EditModeBar';
import { SuggestionPanel } from '@/components/workout/SuggestionPanel';
import { WorkoutStatusBar } from '@/components/workout/WorkoutStatusBar';
import { ConflictWarnings } from '@/components/workout/ConflictWarnings';
import { TemplateSelector } from '@/components/workout/TemplateSelector';
import { PageLayout } from '@/components/shared/PageLayout';
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
  const libraryWorkouts = useStore((state) => state.library.workouts);
  const activeSession = useStore((state) => state.session.active);
  const autoName = useAutoWorkoutName();

  // Detect unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (workout.exercises.length === 0) return false;
    const saved = libraryWorkouts.find((w) => w.id === workout.id);
    if (!saved) return true;
    const normalize = (w: typeof workout) => ({
      name: w.name,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      exercises: w.exercises.map(({ instanceId, ...rest }) => rest),
    });
    return JSON.stringify(normalize(workout)) !== JSON.stringify(normalize(saved));
  }, [workout, libraryWorkouts]);

  // Toast on unmount when dirty
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);
  useEffect(() => {
    return () => {
      if (hasUnsavedChangesRef.current) {
        toast('Draft saved — come back to finish', { duration: 2000 });
      }
    };
  }, []);

  // Info banner: editing the active session's workout
  const isEditingActiveWorkout = activeSession
    && !activeSession.completedAt
    && activeSession.workoutId === workout.id;

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

  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleClearClick = useCallback(() => {
    setClearDialogOpen(true);
  }, []);

  const handleSaveAndClear = useCallback(() => {
    handleSave();
    resetWorkout();
    setClearDialogOpen(false);
  }, [handleSave, resetWorkout]);

  const handleClearWithoutSaving = useCallback(() => {
    resetWorkout();
    setClearDialogOpen(false);
  }, [resetWorkout]);

  const hasExercises = workout.exercises.length > 0;

  // Exit edit mode if all exercises removed
  if (editMode && !hasExercises) {
    setEditMode(false);
    setSelectedIndices(new Set());
  }

  const topBarRight = hasExercises ? (
    <div className="flex items-center gap-1">
      {!editMode && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className="text-accent-primary"
          aria-label="Save workout"
        >
          <Save size={14} />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={editMode ? handleExitEditMode : handleEnterEditMode}
        className="text-accent-primary whitespace-nowrap"
        aria-label={editMode ? 'Exit edit mode' : 'Enter edit mode'}
      >
        {editMode ? 'Done' : 'Select'}
      </Button>
    </div>
  ) : null;

  return (
    <PageLayout
      header={
        <Input
          value={workout.name}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder={autoName || 'Workout name...'}
          className="text-lg font-medium bg-transparent dark:bg-transparent border-none shadow-none px-2 placeholder:text-text-tertiary focus-visible:ring-0"
          aria-label="Workout name"
          disabled={editMode}
        />
      }
      headerRight={topBarRight}
      contentClassName="flex flex-col gap-4 px-4"
    >
        {/* Ad slot */}
        <AdSlot slotKey="build" />

        {/* Info banner: editing active session's workout */}
        {isEditingActiveWorkout && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
            <Info size={12} className="text-warning flex-shrink-0" />
            <span className="text-[11px] text-warning">
              This workout is in progress — edits won't affect the active session.
            </span>
          </div>
        )}

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
          <div className="flex flex-col pb-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearClick}
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
            {hasUnsavedChanges && (
              <div className="flex items-center justify-center gap-1 pb-1 pt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                <span className="text-[10px] text-text-tertiary">Unsaved changes</span>
              </div>
            )}
          </div>
        )}

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

      {/* Clear workout confirmation dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Clear Workout?</DialogTitle>
            <DialogDescription>
              Would you like to save your workout before clearing?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleSaveAndClear} className="min-h-[44px] bg-accent-primary text-bg-root hover:bg-accent-hover">
              <Save size={14} className="mr-1" />
              Save & Clear
            </Button>
            <Button variant="outline" onClick={handleClearWithoutSaving} className="min-h-[44px] text-destructive border-destructive/30 hover:bg-destructive/10">
              Clear Without Saving
            </Button>
            <Button variant="ghost" onClick={() => setClearDialogOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
