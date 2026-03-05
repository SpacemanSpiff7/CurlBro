import type { ExerciseFile } from '@/types';

import data01 from './01_legs_quads_glutes.json';
import data02 from './02_legs_hamstrings_calves.json';
import data03 from './03_chest.json';
import data04 from './04_back.json';
import data05 from './05_shoulders.json';
import data06 from './06_arms.json';
import data07 from './07_core_and_functional.json';
import data08 from './08_stretching_mobility.json';
import data09 from './09_cardio_warmup.json';

const files: ExerciseFile[] = [
  data01 as ExerciseFile,
  data02 as ExerciseFile,
  data03 as ExerciseFile,
  data04 as ExerciseFile,
  data05 as ExerciseFile,
  data06 as ExerciseFile,
  data07 as ExerciseFile,
  data08 as ExerciseFile,
  data09 as ExerciseFile,
];

export function getAllExercises() {
  return files.flatMap((f) => f.exercises);
}

export { files as exerciseFiles };
