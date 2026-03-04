import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';
import { useStore } from '@/store';
import type { WorkoutExercise, ExerciseId } from '@/types';

export function WorkoutList() {
  const workout = useStore((state) => state.builder.workout);
  const graph = useStore((state) => state.graph);
  const { removeExercise, reorderExercises, updateExercise, swapExercise } =
    useStore((state) => state.builderActions);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = Number(active.id);
      const newIndex = Number(over.id);

      if (oldIndex >= 0 && newIndex >= 0) {
        reorderExercises(oldIndex, newIndex);
      }
    },
    [reorderExercises]
  );

  const handleUpdate = useCallback(
    (index: number, updates: Partial<WorkoutExercise>) => {
      updateExercise(index, updates);
    },
    [updateExercise]
  );

  const handleRemove = useCallback(
    (index: number) => {
      removeExercise(index);
    },
    [removeExercise]
  );

  const handleSwap = useCallback(
    (index: number, newId: ExerciseId) => {
      swapExercise(index, newId);
    },
    [swapExercise]
  );

  if (workout.exercises.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={workout.exercises.map((_, i) => i)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {workout.exercises.map((workoutExercise, index) => {
              const exercise = graph.exercises.get(workoutExercise.exerciseId);
              if (!exercise) return null;

              return (
                <ExerciseCard
                  key={index}
                  exercise={exercise}
                  workoutExercise={workoutExercise}
                  index={index}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                  onSwap={handleSwap}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
