import type { ExerciseFile } from '@/types';
import type { RawExercise } from './graphBuilder';

export async function getAllExercises(): Promise<RawExercise[]> {
  const modules = await Promise.all([
    import('./01_legs_quads_glutes.json'),
    import('./02_legs_hamstrings_calves.json'),
    import('./03_chest.json'),
    import('./04_back.json'),
    import('./05_shoulders.json'),
    import('./06_arms.json'),
    import('./07_core_and_functional.json'),
    import('./08_stretching_mobility.json'),
    import('./09_cardio_warmup.json'),
  ]);
  return modules.flatMap((m) => (m.default as ExerciseFile).exercises);
}

/** Sync access for test/script use only — eagerly imports all files. */
export async function getExerciseFiles(): Promise<ExerciseFile[]> {
  const modules = await Promise.all([
    import('./01_legs_quads_glutes.json'),
    import('./02_legs_hamstrings_calves.json'),
    import('./03_chest.json'),
    import('./04_back.json'),
    import('./05_shoulders.json'),
    import('./06_arms.json'),
    import('./07_core_and_functional.json'),
    import('./08_stretching_mobility.json'),
    import('./09_cardio_warmup.json'),
  ]);
  return modules.map((m) => m.default as ExerciseFile);
}
