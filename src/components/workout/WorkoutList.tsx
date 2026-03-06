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
import { SupersetContainer } from '@/components/workout/SupersetContainer';
import { SwipeToDelete } from '@/components/shared/SwipeToDelete';
import { useStore } from '@/store';
import { useBuilderGroups } from '@/hooks/useBuilderGroups';
import type { WorkoutExercise, ExerciseId } from '@/types';

export function WorkoutList() {
  const graph = useStore((state) => state.graph);
  const { removeExercise, reorderExercises, updateExercise, swapExercise } =
    useStore((state) => state.builderActions);

  const groups = useBuilderGroups();

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

      // IDs are group-level: use the first index of each group
      const fromGroupIdx = groups.findIndex((g) => g.groupId === active.id);
      const toGroupIdx = groups.findIndex((g) => g.groupId === over.id);
      if (fromGroupIdx < 0 || toGroupIdx < 0) return;

      const fromIndex = groups[fromGroupIdx].indices[0];
      const toIndex = groups[toGroupIdx].indices[0];
      reorderExercises(fromIndex, toIndex);
    },
    [groups, reorderExercises]
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

  if (groups.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={groups.map((g) => g.groupId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {groups.map((group) => {
              const isGrouped = group.exercises.length > 1;

              const cards = group.exercises.map((workoutExercise, i) => {
                const realIndex = group.indices[i];
                const exercise = graph.exercises.get(workoutExercise.exerciseId);
                if (!exercise) return null;

                return (
                  <ExerciseCard
                    key={workoutExercise.instanceId ?? realIndex}
                    exercise={exercise}
                    workoutExercise={workoutExercise}
                    index={realIndex}
                    onUpdate={handleUpdate}
                    onRemove={handleRemove}
                    onSwap={handleSwap}
                    sortableId={isGrouped ? undefined : group.groupId}
                  />
                );
              });

              const groupContent = isGrouped ? (
                <SupersetContainer
                  key={group.groupId}
                  sortableId={group.groupId}
                  indices={group.indices}
                >
                  {cards}
                </SupersetContainer>
              ) : (
                cards[0]
              );

              return (
                <SwipeToDelete key={group.groupId} onDelete={() => {
                  // Remove all exercises in the group (reverse order to keep indices stable)
                  for (let i = group.indices.length - 1; i >= 0; i--) {
                    removeExercise(group.indices[i]);
                  }
                }}>
                  {groupContent}
                </SwipeToDelete>
              );
            })}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
