import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { MUSCLE_LABELS } from '@/types';

interface MuscleTagsProps {
  muscles: string[];
  variant?: 'default' | 'secondary' | 'outline';
}

export const MuscleTags = memo(function MuscleTags({
  muscles,
  variant = 'secondary',
}: MuscleTagsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {muscles.map((muscle) => (
        <Badge key={muscle} variant={variant} className="text-[10px] px-1.5 py-0">
          {MUSCLE_LABELS[muscle as keyof typeof MUSCLE_LABELS] ?? muscle}
        </Badge>
      ))}
    </div>
  );
});
