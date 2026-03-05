import { useCallback } from 'react';
import { GripVertical, Unlink } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getGroupLabel } from '@/utils/groupUtils';
import { useStore } from '@/store';

interface SupersetContainerProps {
  sortableId: string;
  indices: number[];
  children: React.ReactNode;
}

export function SupersetContainer({ sortableId, indices, children }: SupersetContainerProps) {
  const ungroupExercise = useStore((state) => state.builderActions.ungroupExercise);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const label = getGroupLabel(indices.length);

  const handleUngroup = useCallback(() => {
    // Ungroup in reverse order so indices remain valid
    for (let i = indices.length - 1; i >= 0; i--) {
      ungroupExercise(indices[i]);
    }
  }, [indices, ungroupExercise]);

  if (!label) return <>{children}</>;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : ('auto' as const),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative border-l-2 border-accent-primary rounded-lg pl-2 space-y-2"
    >
      <div className="flex items-center gap-2 px-1 pt-1">
        <button
          {...attributes}
          {...listeners}
          className="touch-none text-text-tertiary hover:text-text-secondary cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder group"
          style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
        >
          <GripVertical size={16} />
        </button>
        <Badge variant="secondary" className="text-[10px]">
          {label}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUngroup}
          className="h-6 px-1.5 text-text-tertiary hover:text-text-secondary text-[10px]"
          aria-label={`Ungroup ${label}`}
        >
          <Unlink size={12} className="mr-1" />
          Ungroup
        </Button>
      </div>
      {children}
    </div>
  );
}
