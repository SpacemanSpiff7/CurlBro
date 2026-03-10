import { useCallback, useMemo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { GripVertical, Trash2, Unlink } from 'lucide-react';
import { motion } from 'framer-motion';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';
import { SwipeToReveal } from '@/components/shared/SwipeToReveal';
import type { SwipeAction } from '@/components/shared/SwipeToReveal';
import { DragGhostOverlay } from '@/components/shared/DragGhostOverlay';
import { DropIntentCue } from '@/components/shared/DropIntentCue';
import { SupersetContainer } from '@/components/workout/SupersetContainer';
import { getBuilderDragId, getBuilderDropId } from '@/components/workout/builderDrag';
import type { DropState } from '@/components/workout/builderDrag';
import { cn } from '@/lib/utils';
import type { ExerciseGraph, ExerciseId, WorkoutExercise } from '@/types';
import type { ExerciseGroup } from '@/utils/groupUtils';

interface BuilderGroupRowProps {
  group: ExerciseGroup<WorkoutExercise>;
  graph: ExerciseGraph;
  activeGroupId: string | null;
  dropState: DropState;
  editMode: boolean;
  selectedIndices?: Set<number>;
  onToggleSelect?: (index: number) => void;
  onUpdate: (index: number, updates: Partial<WorkoutExercise>) => void;
  onRemove: (index: number) => void;
  onSwap: (index: number, newId: ExerciseId) => void;
  onUngroupGroup: (indices: number[]) => void;
}

export function BuilderGroupRow({
  group,
  graph,
  activeGroupId,
  dropState,
  editMode,
  selectedIndices,
  onToggleSelect,
  onUpdate,
  onRemove,
  onSwap,
  onUngroupGroup,
}: BuilderGroupRowProps) {
  const dragId = getBuilderDragId(group.groupId);
  const dropId = getBuilderDropId(group.groupId);
  const isGrouped = group.exercises.length > 1;
  const isSource = activeGroupId === group.groupId;
  const showDropCue = activeGroupId !== null && activeGroupId !== group.groupId && dropState !== 'idle';
  const isDropTarget = showDropCue && !editMode;

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    setActivatorNodeRef,
  } = useDraggable({
    id: dragId,
    disabled: editMode,
    data: { groupId: group.groupId },
  });

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: dropId,
    disabled: editMode || isSource,
    data: { groupId: group.groupId },
  });

  const setRowRef = useCallback((node: HTMLDivElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  }, [setDraggableNodeRef, setDroppableNodeRef]);

  const groupActions = useMemo<SwipeAction[]>(
    () => [
      {
        key: 'ungroup',
        label: 'Ungroup',
        icon: <Unlink size={16} />,
        color: 'bg-accent-primary',
        onAction: () => onUngroupGroup(group.indices),
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <Trash2 size={16} />,
        color: 'bg-destructive',
        onAction: () => {
          for (let i = group.indices.length - 1; i >= 0; i--) {
            onRemove(group.indices[i]);
          }
        },
      },
    ],
    [group.indices, onRemove, onUngroupGroup]
  );

  // Drag handle element — passed as a slot to ExerciseCard/SupersetContainer
  const dragHandle = !editMode ? (
    <button
      {...attributes}
      {...listeners}
      ref={setActivatorNodeRef}
      data-dnd-handle
      className="touch-none text-text-tertiary hover:text-text-secondary cursor-grab active:cursor-grabbing"
      aria-label="Drag to reorder"
      style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
    >
      <GripVertical size={16} />
    </button>
  ) : undefined;

  const cardContent = isGrouped ? (
    <DragGhostOverlay active={isSource} borderRadius="rounded-lg">
      <div
        className={cn(
          'transition-transform duration-150',
          isDropTarget && dropState === 'merge' && 'scale-[1.02]',
        )}
      >
        <SupersetContainer
          indices={group.indices}
          editMode={editMode}
          dragHandle={dragHandle}
        >
          {group.exercises.map((workoutExercise, i) => {
            const realIndex = group.indices[i];
            const exercise = graph.exercises.get(workoutExercise.exerciseId);
            if (!exercise) return null;

            return (
              <ExerciseCard
                key={workoutExercise.instanceId ?? realIndex}
                exercise={exercise}
                workoutExercise={workoutExercise}
                index={realIndex}
                onUpdate={onUpdate}
                onRemove={onRemove}
                onSwap={onSwap}
                editMode={editMode}
                selected={selectedIndices?.has(realIndex)}
                onToggleSelect={onToggleSelect ? () => onToggleSelect(realIndex) : undefined}
              />
            );
          })}
        </SupersetContainer>
      </div>
    </DragGhostOverlay>
  ) : (() => {
    const workoutExercise = group.exercises[0];
    const exercise = graph.exercises.get(workoutExercise.exerciseId);
    if (!exercise) return null;

    return (
      <DragGhostOverlay active={isSource}>
        <div
          className={cn(
            'transition-transform duration-150',
            isDropTarget && dropState === 'merge' && 'scale-[1.02]',
          )}
        >
          <ExerciseCard
            exercise={exercise}
            workoutExercise={workoutExercise}
            index={group.indices[0]}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onSwap={onSwap}
            editMode={editMode}
            selected={selectedIndices?.has(group.indices[0])}
            onToggleSelect={onToggleSelect ? () => onToggleSelect(group.indices[0]) : undefined}
            swipeActionsEnabled
            swipeEnabled={activeGroupId === null}
            dragHandle={dragHandle}
          />
        </div>
      </DragGhostOverlay>
    );
  })();

  if (!cardContent) {
    return null;
  }

  return (
    <motion.div
      ref={setRowRef}
      layout
      layoutId={group.groupId}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative"
    >
      {/* Drop intent cues — positioned at row level so lines extend into gaps */}
      <DropIntentCue dropState={dropState} active={isDropTarget} />

      {isGrouped ? (
        <SwipeToReveal actions={groupActions} enabled={!editMode && activeGroupId === null}>
          {cardContent}
        </SwipeToReveal>
      ) : (
        cardContent
      )}
    </motion.div>
  );
}
