import { useCallback } from 'react';
import { Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupBadge } from '@/components/shared/GroupBadge';
import { useStore } from '@/store';

interface SupersetContainerProps {
  indices: number[];
  children: React.ReactNode;
  /** Whether edit mode is active */
  editMode?: boolean;
  /** Optional drag handle element rendered by parent (BuilderGroupRow) */
  dragHandle?: React.ReactNode;
}

export function SupersetContainer({
  indices,
  children,
  editMode = false,
  dragHandle,
}: SupersetContainerProps) {
  const ungroupExercise = useStore((state) => state.builderActions.ungroupExercise);

  const handleUngroup = useCallback(() => {
    for (let i = indices.length - 1; i >= 0; i--) {
      ungroupExercise(indices[i]);
    }
  }, [indices, ungroupExercise]);

  if (indices.length <= 1) return <>{children}</>;

  return (
    <div className="border-l-2 border-accent-primary rounded-lg pl-2 space-y-2">
      <div className="flex items-center gap-2 px-1 pt-1">
        {!editMode && dragHandle}
        <GroupBadge size={indices.length} />
        {!editMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUngroup}
            className="h-6 px-1.5 text-text-tertiary hover:text-text-secondary text-[10px]"
            aria-label={`Ungroup exercises`}
          >
            <Unlink size={12} className="mr-1" />
            Ungroup
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}
