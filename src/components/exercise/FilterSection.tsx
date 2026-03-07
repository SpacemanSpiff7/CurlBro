import { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterSectionProps {
  title: string;
  colorClass: string;
  expanded: boolean;
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
}

export const FilterSection = memo(function FilterSection({
  title,
  colorClass,
  expanded,
  onToggle,
  badge,
  children,
}: FilterSectionProps) {
  return (
    <div className="px-4 pb-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-bg-elevated"
        style={{ minHeight: '44px' }}
        aria-expanded={expanded}
        aria-label={`Toggle ${title} filters`}
      >
        <span className={`flex items-center gap-2 ${colorClass}`}>
          {title}
          {badge != null && badge > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-bg-elevated px-1.5 text-[10px] font-semibold text-text-secondary">
              {badge}
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`text-text-tertiary transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-2 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
