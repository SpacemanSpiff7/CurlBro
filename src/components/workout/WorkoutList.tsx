import { useCallback, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { Trash2, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';
import { SupersetContainer } from '@/components/workout/SupersetContainer';
import { SwipeToReveal } from '@/components/shared/SwipeToReveal';
import type { SwipeAction } from '@/components/shared/SwipeToReveal';
import { DragOverlayCard } from '@/components/workout/DragOverlayCard';
import { resolveDropIntent } from '@/utils/dropIntent';
import type { DropIntent } from '@/utils/dropIntent';
import { vibrateDragStart, vibrateSupersetIntent, vibrateGrouped } from '@/utils/haptics';
import { useStore } from '@/store';
import { useBuilderGroups } from '@/hooks/useBuilderGroups';
import type { WorkoutExercise, ExerciseId } from '@/types';

interface WorkoutListProps {
  editMode?: boolean;
  selectedIndices?: Set<number>;
  onToggleSelect?: (index: number) => void;
}

export function WorkoutList({ editMode = false, selectedIndices, onToggleSelect }: WorkoutListProps) {
  const graph = useStore((state) => state.graph);
  const { removeExercise, reorderExercises, updateExercise, swapExercise, ungroupExercise, mergeExerciseIntoGroup } =
    useStore((state) => state.builderActions);

  const groups = useBuilderGroups();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [dropTargetGroupId, setDropTargetGroupId] = useState<string | null>(null);
  const dropIntentRef = useRef<DropIntent | null>(null);
  const lastIntentTypeRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveGroupId(String(event.active.id));
    vibrateDragStart();
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      if (dropIntentRef.current) {
        dropIntentRef.current = null;
        lastIntentTypeRef.current = null;
        setDropTargetGroupId(null);
      }
      return;
    }

    const overRect = over.rect;
    const pointerY = event.activatorEvent instanceof PointerEvent
      ? (event.activatorEvent as PointerEvent).clientY + (event.delta?.y ?? 0)
      : overRect.top + overRect.height / 2;

    const intent = resolveDropIntent(pointerY, overRect, String(over.id));

    dropIntentRef.current = intent;

    // Only update visual state when intent type changes to avoid re-renders
    if (intent.type !== lastIntentTypeRef.current) {
      lastIntentTypeRef.current = intent.type;
      if (intent.type === 'superset') {
        setDropTargetGroupId(intent.targetGroupId);
        vibrateSupersetIntent();
      } else {
        setDropTargetGroupId(null);
      }
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const intent = dropIntentRef.current;
      setActiveGroupId(null);
      setDropTargetGroupId(null);
      dropIntentRef.current = null;
      lastIntentTypeRef.current = null;

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      if (intent?.type === 'superset') {
        const fromGroupIdx = groups.findIndex((g) => g.groupId === active.id);
        const toGroupIdx = groups.findIndex((g) => g.groupId === intent.targetGroupId);
        if (fromGroupIdx >= 0 && toGroupIdx >= 0) {
          const targetGroup = groups[toGroupIdx];
          const sourceGroup = groups[fromGroupIdx];
          if (targetGroup.exercises.length + sourceGroup.exercises.length > 5) {
            toast.warning('Maximum 5 exercises per superset');
            return;
          }
          // Merge each source member using instanceId to find current index
          const sourceInstanceIds = sourceGroup.exercises.map((e) => e.instanceId);
          const targetInstanceId = targetGroup.exercises[0].instanceId;
          for (const srcId of sourceInstanceIds) {
            const exs = useStore.getState().builder.workout.exercises;
            const srcIdx = exs.findIndex((e) => e.instanceId === srcId);
            const tgtIdx = exs.findIndex((e) => e.instanceId === targetInstanceId);
            if (srcIdx >= 0 && tgtIdx >= 0) {
              mergeExerciseIntoGroup(srcIdx, tgtIdx);
            }
          }
          vibrateGrouped();
          toast.success('Added to superset');
        }
      } else {
        // Default: reorder
        const fromGroupIdx = groups.findIndex((g) => g.groupId === active.id);
        const toGroupIdx = groups.findIndex((g) => g.groupId === over.id);
        if (fromGroupIdx < 0 || toGroupIdx < 0) return;

        const fromIndex = groups[fromGroupIdx].indices[0];
        const toIndex = groups[toGroupIdx].indices[0];
        reorderExercises(fromIndex, toIndex);
      }
    },
    [groups, reorderExercises, mergeExerciseIntoGroup]
  );

  const handleDragCancel = useCallback(() => {
    setActiveGroupId(null);
    setDropTargetGroupId(null);
    dropIntentRef.current = null;
    lastIntentTypeRef.current = null;
  }, []);

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

  // Find active group data for DragOverlay
  const activeGroup = activeGroupId
    ? groups.find((g) => g.groupId === activeGroupId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={groups.map((g) => g.groupId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {groups.map((group) => {
              const isGrouped = group.exercises.length > 1;
              const isTarget = dropTargetGroupId === group.groupId;

              if (isGrouped) {
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
                      editMode={editMode}
                      selected={selectedIndices?.has(realIndex)}
                      onToggleSelect={onToggleSelect ? () => onToggleSelect(realIndex) : undefined}
                    />
                  );
                });

                const groupActions: SwipeAction[] = [
                  {
                    key: 'ungroup',
                    label: 'Ungroup',
                    icon: <Unlink size={16} />,
                    color: 'bg-accent-primary',
                    onAction: () => {
                      for (let i = group.indices.length - 1; i >= 0; i--) {
                        ungroupExercise(group.indices[i]);
                      }
                    },
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    icon: <Trash2 size={16} />,
                    color: 'bg-destructive',
                    onAction: () => {
                      for (let i = group.indices.length - 1; i >= 0; i--) {
                        removeExercise(group.indices[i]);
                      }
                    },
                  },
                ];

                return (
                  <SwipeToReveal key={group.groupId} actions={groupActions} enabled={!editMode}>
                    <SupersetContainer
                      sortableId={group.groupId}
                      indices={group.indices}
                      isDropTarget={isTarget}
                      editMode={editMode}
                    >
                      {cards}
                    </SupersetContainer>
                  </SwipeToReveal>
                );
              }

              // Standalone — ExerciseCard has its own SwipeToReveal internally
              const workoutExercise = group.exercises[0];
              const exercise = graph.exercises.get(workoutExercise.exerciseId);
              if (!exercise) return null;

              return (
                <ExerciseCard
                  key={group.groupId}
                  exercise={exercise}
                  workoutExercise={workoutExercise}
                  index={group.indices[0]}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                  onSwap={handleSwap}
                  sortableId={group.groupId}
                  editMode={editMode}
                  selected={selectedIndices?.has(group.indices[0])}
                  onToggleSelect={onToggleSelect ? () => onToggleSelect(group.indices[0]) : undefined}
                  isDropTarget={isTarget}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeGroup ? (
          <DragOverlayCard group={activeGroup} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
