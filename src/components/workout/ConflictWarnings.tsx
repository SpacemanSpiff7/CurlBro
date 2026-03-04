import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { useWorkoutConflicts, type ActiveConflict } from '@/hooks/useWorkoutConflicts';

function ConflictCard({ item }: { item: ActiveConflict }) {
  const [expanded, setExpanded] = useState(false);
  const isCaution = item.conflict.severity === 'caution';

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
        isCaution
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-yellow-500/30 bg-yellow-500/5'
      }`}
    >
      <div className="flex items-start gap-2">
        {isCaution ? (
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
        ) : (
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-yellow-400" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs font-medium ${isCaution ? 'text-red-300' : 'text-yellow-300'}`}>
              {item.exerciseNameA} + {item.exerciseNameB}
            </p>
            {expanded ? (
              <ChevronUp size={14} className="flex-shrink-0 text-text-tertiary" />
            ) : (
              <ChevronDown size={14} className="flex-shrink-0 text-text-tertiary" />
            )}
          </div>
          {expanded && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary">
              {item.conflict.reason}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export function ConflictWarnings() {
  const conflicts = useWorkoutConflicts();

  if (conflicts.length === 0) return null;

  const cautionCount = conflicts.filter((c) => c.conflict.severity === 'caution').length;
  const warningCount = conflicts.length - cautionCount;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <AlertTriangle size={14} className="text-yellow-400" />
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Exercise Conflicts
          <span className="ml-1 normal-case tracking-normal text-text-tertiary/60">
            ({cautionCount > 0 && `${cautionCount} caution`}
            {cautionCount > 0 && warningCount > 0 && ', '}
            {warningCount > 0 && `${warningCount} warning`})
          </span>
        </h3>
      </div>
      <div className="space-y-1.5">
        {conflicts.map((item, i) => (
          <ConflictCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}
