import { useMemo } from 'react';
import { useStore } from '@/store';
import {
  EXERCISE_CONFLICTS,
  type ExerciseConflict,
} from '@/data/exerciseConflicts';

export interface ActiveConflict {
  conflict: ExerciseConflict;
  exerciseNameA: string;
  exerciseNameB: string;
}

export function useWorkoutConflicts(): ActiveConflict[] {
  const graph = useStore((state) => state.graph);
  const exercises = useStore((state) => state.builder.workout.exercises);

  return useMemo(() => {
    if (exercises.length < 2) return [];

    const active: ActiveConflict[] = [];
    const seen = new Set<string>();

    // Resolve exercise metadata for each workout exercise
    const resolved = exercises
      .map((ex) => {
        const meta = graph.exercises.get(ex.exerciseId);
        return meta ? { id: ex.exerciseId as string, meta } : null;
      })
      .filter(Boolean) as { id: string; meta: { name: string; movement_pattern: string } }[];

    for (const conflict of EXERCISE_CONFLICTS) {
      if (conflict.matchBy === 'id') {
        // Check if both exercise IDs are in the workout
        const hasA = resolved.find((r) => r.id === conflict.exercises[0]);
        const hasB = resolved.find((r) => r.id === conflict.exercises[1]);
        if (hasA && hasB) {
          const key = `${conflict.exercises[0]}|${conflict.exercises[1]}`;
          if (!seen.has(key)) {
            seen.add(key);
            active.push({
              conflict,
              exerciseNameA: hasA.meta.name,
              exerciseNameB: hasB.meta.name,
            });
          }
        }
      } else if (conflict.matchBy === 'pattern') {
        const [patternA, patternB] = conflict.exercises;

        if (patternA === patternB) {
          // Self-conflict: find two different exercises with the same pattern
          const matching = resolved.filter(
            (r) => r.meta.movement_pattern === patternA
          );
          if (matching.length >= 2) {
            const key = `pattern:${patternA}:${matching[0].id}|${matching[1].id}`;
            if (!seen.has(key)) {
              seen.add(key);
              active.push({
                conflict,
                exerciseNameA: matching[0].meta.name,
                exerciseNameB: matching[1].meta.name,
              });
            }
          }
        } else {
          // Cross-pattern conflict
          const matchA = resolved.find(
            (r) => r.meta.movement_pattern === patternA
          );
          const matchB = resolved.find(
            (r) => r.meta.movement_pattern === patternB
          );
          if (matchA && matchB) {
            const key = `pattern:${patternA}|${patternB}:${matchA.id}|${matchB.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              active.push({
                conflict,
                exerciseNameA: matchA.meta.name,
                exerciseNameB: matchB.meta.name,
              });
            }
          }
        }
      }
      // 'tag' conflicts are skipped for now — they require mapping logic
      // that would need exercise properties beyond what's available in the graph
    }

    // Sort caution before warning
    return active.sort((a, b) => {
      if (a.conflict.severity === 'caution' && b.conflict.severity !== 'caution') return -1;
      if (a.conflict.severity !== 'caution' && b.conflict.severity === 'caution') return 1;
      return 0;
    });
  }, [exercises, graph]);
}
