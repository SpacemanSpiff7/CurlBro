import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { useWorkoutConflicts, type ActiveConflict } from '@/hooks/useWorkoutConflicts';

interface GroupedConflict {
  severity: 'caution' | 'warning';
  reason: string;
  pairs: { a: string; b: string }[];
}

function ConflictCard({ group }: { group: GroupedConflict }) {
  const [expanded, setExpanded] = useState(false);
  const isCaution = group.severity === 'caution';

  // Collect unique exercise names involved
  const names = [...new Set(group.pairs.flatMap((p) => [p.a, p.b]))];
  const title = names.join(', ');

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
        isCaution
          ? 'border-red-500/30 bg-red-500/10 dark:bg-red-500/5'
          : 'border-yellow-500/30 bg-yellow-500/10 dark:bg-yellow-500/5'
      }`}
    >
      <div className="flex items-start gap-2">
        {isCaution ? (
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
        ) : (
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs font-medium ${isCaution ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
              {title}
            </p>
            {expanded ? (
              <ChevronUp size={14} className="flex-shrink-0 text-text-tertiary" />
            ) : (
              <ChevronDown size={14} className="flex-shrink-0 text-text-tertiary" />
            )}
          </div>
          {expanded && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary">
              {group.reason}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function groupConflicts(conflicts: ActiveConflict[]): GroupedConflict[] {
  const map = new Map<string, GroupedConflict>();
  for (const item of conflicts) {
    const key = `${item.conflict.severity}:${item.conflict.reason}`;
    let group = map.get(key);
    if (!group) {
      group = { severity: item.conflict.severity, reason: item.conflict.reason, pairs: [] };
      map.set(key, group);
    }
    group.pairs.push({ a: item.exerciseNameA, b: item.exerciseNameB });
  }
  return [...map.values()];
}

export function ConflictWarnings() {
  const conflicts = useWorkoutConflicts();
  const groups = useMemo(() => groupConflicts(conflicts), [conflicts]);

  if (groups.length === 0) return null;

  const cautionCount = groups.filter((g) => g.severity === 'caution').length;
  const warningCount = groups.length - cautionCount;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <AlertTriangle size={14} className="text-yellow-600 dark:text-yellow-400" />
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
        {groups.map((group, i) => (
          <ConflictCard key={i} group={group} />
        ))}
      </div>
    </div>
  );
}
