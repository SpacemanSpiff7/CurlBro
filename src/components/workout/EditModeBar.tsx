import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Trash2, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditModeBarProps {
  visible: boolean;
  selectedCount: number;
  totalCount: number;
  onGroup: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
}

export const EditModeBar = memo(function EditModeBar({
  visible,
  selectedCount,
  totalCount,
  onGroup,
  onDelete,
  onSelectAll,
}: EditModeBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed left-0 right-0 z-40 bottom-[calc(56px+env(safe-area-inset-bottom,0px))] bg-bg-surface/95 backdrop-blur-sm border-t border-border-subtle rounded-t-xl shadow-lg"
        >
          <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
            <span className="text-sm text-text-secondary whitespace-nowrap">
              {selectedCount} selected
            </span>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="text-text-secondary"
              aria-label={selectedCount === totalCount ? 'Deselect all' : 'Select all'}
            >
              <CheckSquare size={14} className="mr-1" />
              {selectedCount === totalCount ? 'None' : 'All'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onGroup}
              disabled={selectedCount < 2}
              className="text-accent-primary disabled:text-text-tertiary"
              aria-label="Group selected exercises"
            >
              <Link size={14} className="mr-1" />
              Group
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={selectedCount < 1}
              className="text-destructive disabled:text-text-tertiary"
              aria-label="Delete selected exercises"
            >
              <Trash2 size={14} className="mr-1" />
              Delete
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
