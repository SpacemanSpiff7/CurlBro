import { memo, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { useStore } from '@/store';
import type { ExerciseId } from '@/types';

interface Template {
  name: string;
  description: string;
  exerciseIds: ExerciseId[];
}

const templates: Template[] = [
  {
    name: 'PPL: Push',
    description: 'Chest, shoulders, triceps',
    exerciseIds: [
      'barbell_bench_press',
      'incline_dumbbell_press',
      'dumbbell_shoulder_press',
      'lateral_raise',
      'cable_flye',
      'tricep_pushdown',
      'overhead_tricep_extension',
    ] as ExerciseId[],
  },
  {
    name: 'PPL: Pull',
    description: 'Back, biceps, rear delts',
    exerciseIds: [
      'pull_up',
      'barbell_row',
      'cable_row',
      'face_pull',
      'barbell_curl',
      'hammer_curl',
      'rear_delt_flye',
    ] as ExerciseId[],
  },
  {
    name: 'PPL: Legs',
    description: 'Quads, hams, glutes, calves',
    exerciseIds: [
      'barbell_back_squat',
      'romanian_deadlift',
      'leg_press',
      'leg_curl_lying',
      'walking_lunge',
      'leg_extension',
      'standing_calf_raise',
    ] as ExerciseId[],
  },
];

const TemplateCard = memo(function TemplateCard({
  template,
  onSelect,
}: {
  template: Template;
  onSelect: (t: Template) => void;
}) {
  return (
    <button
      onClick={() => onSelect(template)}
      className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-left transition-colors hover:border-accent-primary hover:bg-accent-glow"
      style={{ minHeight: '56px' }}
      aria-label={`Start from ${template.name} template`}
    >
      <Zap size={18} className="flex-shrink-0 text-accent-primary" />
      <div>
        <div className="text-sm font-medium text-text-primary">
          {template.name}
        </div>
        <div className="text-xs text-text-tertiary">{template.description}</div>
      </div>
    </button>
  );
});

export function TemplateSelector() {
  const addExercise = useStore((state) => state.builderActions.addExercise);
  const setWorkoutName = useStore(
    (state) => state.builderActions.setWorkoutName
  );
  const graph = useStore((state) => state.graph);

  const handleSelect = useCallback(
    (template: Template) => {
      setWorkoutName(template.name);
      for (const id of template.exerciseIds) {
        if (graph.exercises.has(id)) {
          addExercise(id);
        }
      }
    },
    [addExercise, setWorkoutName, graph.exercises]
  );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider px-1">
        Start from template
      </h3>
      <div className="space-y-2">
        {templates.map((template) => (
          <TemplateCard
            key={template.name}
            template={template}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
