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
  /** Whether this container is a drop target for superset merge */
  isDropTarget?: boolean;
  /** Whether edit mode is active */
  editMode?: boolean;
}

export function SupersetContainer({
  sortableId,
  indices,
  children,
  isDropTarget = false,
  editMode = false,
}: SupersetContainerProps) {
  const ungroupExercise = useStore((state) => state.builderActions.ungroupExercise);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId, disabled: editMode });

  const label = getGroupLabel(indices.length);

  const handleUngroup = useCallback(() => {
    // Ungroup in reverse order so indices remain valid
    for (let i = indices.length - 1; i >= 0; i--) {
      ungroupExercise(indices[i]);
    }
  }, [indices, ungroupExercise]);

  if (!label) return <>{children}</>;

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={dndStyle}>
      {isDragging ? (
        <div className="rounded-lg border-2 border-dashed border-accent-primary/40 bg-accent-primary/5 h-24" />
      ) : (
        <div
          className={`relative border-l-2 border-accent-primary rounded-lg pl-2 space-y-2 transition-shadow ${
            isDropTarget ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-root scale-[1.02]' : ''
          }`}
        >
          <div className="flex items-center gap-2 px-1 pt-1">
            {!editMode && (
              <button
                {...attributes}
                {...listeners}
                data-dnd-handle
                className="touch-none text-text-tertiary hover:text-text-secondary cursor-grab active:cursor-grabbing"
                aria-label="Drag to reorder group"
                style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
              >
                <GripVertical size={16} />
              </button>
            )}
            <Badge variant="secondary" className="text-[10px]">
              {label}
            </Badge>
            {!editMode && (
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
            )}
          </div>
          {children}
        </div>
      )}
    </div>
  );
}
