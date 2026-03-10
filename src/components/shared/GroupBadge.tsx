import { Badge } from '@/components/ui/badge';
import { getGroupLabel } from '@/utils/groupUtils';
import { cn } from '@/lib/utils';

interface GroupBadgeProps {
  size: number;
  className?: string;
  variant?: 'secondary' | 'outline';
}

/**
 * Renders a Superset/Tri-set/Circuit badge based on group size.
 * Returns null for standalone exercises (size <= 1).
 */
export function GroupBadge({ size, className, variant = 'secondary' }: GroupBadgeProps) {
  const label = getGroupLabel(size);
  if (!label) return null;

  return (
    <Badge variant={variant} className={cn('text-[10px]', className)}>
      {label}
    </Badge>
  );
}
