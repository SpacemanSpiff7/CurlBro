import { useCallback, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { CollisionDetection, DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BuilderGroupRow } from '@/components/workout/BuilderGroupRow';
import { DragOverlayCard } from '@/components/workout/DragOverlayCard';
import {
  canMergeGroupSizes,
  getGroupIdFromBuilderDragId,
  getGroupIdFromBuilderDropId,
  resolveReorderIndex,
} from '@/components/workout/builderDrag';
import type { BuilderDropTarget } from '@/components/workout/builderDrag';
import { closeAllSwipeRows } from '@/components/shared/SwipeToReveal';
import { resolveDropIntent } from '@/utils/dropIntent';
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
  const [activeDropTarget, setActiveDropTarget] = useState<BuilderDropTarget | null>(null);
  const activeDropTargetRef = useRef<BuilderDropTarget | null>(null);
  const lastIntentKeyRef = useRef<string | null>(null);
  const pointerYRef = useRef<number | null>(null);
  // Current collision target — stored so pointermove can continuously re-evaluate intent
  const overRectRef = useRef<{ groupId: string; top: number; height: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    if (args.pointerCoordinates) {
      return pointerWithin(args);
    }

    return closestCenter(args);
  }, []);

  const setDropTarget = useCallback((target: BuilderDropTarget | null) => {
    activeDropTargetRef.current = target;
    setActiveDropTarget((prev) => {
      if (prev?.groupId === target?.groupId && prev?.state === target?.state) {
        return prev;
      }
      return target;
    });
  }, []);

  // Shared intent updater — called from both handleDragOver and pointermove
  const updateIntentForPointer = useCallback((clientY: number, targetGroupId: string, rect: { top: number; height: number }) => {
    const intent = resolveDropIntent(clientY, rect, targetGroupId);
    const intentKey = `${targetGroupId}:${intent.type}`;

    if (intentKey !== lastIntentKeyRef.current) {
      lastIntentKeyRef.current = intentKey;
      setDropTarget({
        groupId: targetGroupId,
        state: intent.type,
      });

      if (intent.type === 'merge') {
        vibrateSupersetIntent();
      }
    }
  }, [setDropTarget]);

  const pointerListenerRef = useRef<((e: PointerEvent | TouchEvent) => void) | null>(null);

  const clearDragState = useCallback(() => {
    setActiveGroupId(null);
    setDropTarget(null);
    lastIntentKeyRef.current = null;
    pointerYRef.current = null;
    overRectRef.current = null;
    if (pointerListenerRef.current) {
      window.removeEventListener('pointermove', pointerListenerRef.current as (e: PointerEvent) => void);
      window.removeEventListener('touchmove', pointerListenerRef.current as (e: TouchEvent) => void);
      pointerListenerRef.current = null;
    }
  }, [setDropTarget]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const groupId = getGroupIdFromBuilderDragId(event.active.id);
    if (!groupId) return;

    closeAllSwipeRows();
    setActiveGroupId(groupId);
    vibrateDragStart();

    // Track real pointer Y and continuously update drop intent
    const handler = (e: PointerEvent | TouchEvent) => {
      let clientY: number;
      if ('clientY' in e) {
        clientY = e.clientY;
      } else if (e.touches.length > 0) {
        clientY = e.touches[0].clientY;
      } else {
        return;
      }
      pointerYRef.current = clientY;

      // Re-evaluate intent as pointer moves within the current collision target
      const target = overRectRef.current;
      if (target) {
        updateIntentForPointer(clientY, target.groupId, target);
      }
    };
    pointerListenerRef.current = handler;
    window.addEventListener('pointermove', handler as (e: PointerEvent) => void);
    window.addEventListener('touchmove', handler as (e: TouchEvent) => void);
  }, [updateIntentForPointer]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const sourceGroupId = getGroupIdFromBuilderDragId(event.active.id);
    const targetGroupId = event.over ? getGroupIdFromBuilderDropId(event.over.id) : null;

    if (!sourceGroupId || !targetGroupId || sourceGroupId === targetGroupId || !event.over) {
      overRectRef.current = null;
      if (activeDropTargetRef.current) {
        setDropTarget(null);
        lastIntentKeyRef.current = null;
      }
      return;
    }

    // Store target rect so pointermove can continuously re-evaluate
    overRectRef.current = {
      groupId: targetGroupId,
      top: event.over.rect.top,
      height: event.over.rect.height,
    };

    // Compute initial intent for this collision
    const pointerY = pointerYRef.current
      ?? event.over.rect.top + event.over.rect.height / 2;

    updateIntentForPointer(pointerY, targetGroupId, event.over.rect);
  }, [setDropTarget, updateIntentForPointer]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const sourceGroupId = getGroupIdFromBuilderDragId(event.active.id);
    const target = activeDropTargetRef.current;

    clearDragState();

    if (!sourceGroupId || !target || sourceGroupId === target.groupId) {
      return;
    }

    const fromGroupIdx = groups.findIndex((group) => group.groupId === sourceGroupId);
    const toGroupIdx = groups.findIndex((group) => group.groupId === target.groupId);
    if (fromGroupIdx < 0 || toGroupIdx < 0) return;

    const sourceGroup = groups[fromGroupIdx];
    const targetGroup = groups[toGroupIdx];

    if (target.state === 'merge') {
      if (!canMergeGroupSizes(sourceGroup.exercises.length, targetGroup.exercises.length)) {
        toast.warning('Maximum 5 exercises per superset');
        return;
      }

      const sourceInstanceIds = sourceGroup.exercises.map((exercise) => exercise.instanceId);
      const targetInstanceId = targetGroup.exercises[0].instanceId;

      for (const srcId of sourceInstanceIds) {
        const exercises = useStore.getState().builder.workout.exercises;
        const srcIdx = exercises.findIndex((exercise) => exercise.instanceId === srcId);
        const tgtIdx = exercises.findIndex((exercise) => exercise.instanceId === targetInstanceId);

        if (srcIdx >= 0 && tgtIdx >= 0) {
          mergeExerciseIntoGroup(srcIdx, tgtIdx);
        }
      }

      vibrateGrouped();
      toast.success('Added to superset');
      return;
    }

    const fromIndex = sourceGroup.indices[0];
    const toIndex = resolveReorderIndex(groups, target.groupId, target.state);
    if (toIndex == null) return;

    reorderExercises(fromIndex, toIndex);
  }, [clearDragState, groups, mergeExerciseIntoGroup, reorderExercises]);

  const handleDragCancel = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

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

  const handleUngroupGroup = useCallback((indices: number[]) => {
    for (let i = indices.length - 1; i >= 0; i--) {
      ungroupExercise(indices[i]);
    }
  }, [ungroupExercise]);

  if (groups.length === 0) {
    return null;
  }

  const activeGroup = activeGroupId
    ? groups.find((group) => group.groupId === activeGroupId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {groups.map((group) => (
            <BuilderGroupRow
              key={group.groupId}
              group={group}
              graph={graph}
              activeGroupId={activeGroupId}
              dropState={activeDropTarget?.groupId === group.groupId ? activeDropTarget.state : 'idle'}
              editMode={editMode}
              selectedIndices={selectedIndices}
              onToggleSelect={onToggleSelect}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              onSwap={handleSwap}
              onUngroupGroup={handleUngroupGroup}
            />
          ))}
        </AnimatePresence>
      </div>

      <DragOverlay dropAnimation={{
        duration: 150,
        easing: 'ease-out',
        sideEffects: defaultDropAnimationSideEffects({
          styles: { active: { opacity: '0' } },
        }),
      }}>
        {activeGroup ? (
          <DragOverlayCard group={activeGroup} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
