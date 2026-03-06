import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { SwipeToReveal } from './SwipeToReveal';
import type { SwipeAction } from './SwipeToReveal';
import { vibrate } from '@/utils/haptics';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  enabled?: boolean;
}

export function SwipeToDelete({ onDelete, children, enabled }: SwipeToDeleteProps) {
  const actions: SwipeAction[] = useMemo(
    () => [
      {
        key: 'delete',
        label: 'Delete',
        icon: <Trash2 size={18} />,
        color: 'bg-destructive',
        onAction: () => {
          vibrate(50);
          onDelete();
        },
      },
    ],
    [onDelete],
  );

  return (
    <SwipeToReveal actions={actions} enabled={enabled}>
      {children}
    </SwipeToReveal>
  );
}
