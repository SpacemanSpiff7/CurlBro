import { memo } from 'react';
import { Badge } from '@/components/ui/badge';

interface MuscleTagsProps {
  muscles: string[];
  variant?: 'default' | 'secondary' | 'outline';
}

const muscleLabels: Record<string, string> = {
  chest: 'Chest',
  upper_back: 'Back',
  shoulders: 'Shoulders',
  traps: 'Traps',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quadriceps: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
  adductors: 'Adductors',
  abductors: 'Abductors',
};

export const MuscleTags = memo(function MuscleTags({
  muscles,
  variant = 'secondary',
}: MuscleTagsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {muscles.map((muscle) => (
        <Badge key={muscle} variant={variant} className="text-[10px] px-1.5 py-0">
          {muscleLabels[muscle] ?? muscle}
        </Badge>
      ))}
    </div>
  );
});
