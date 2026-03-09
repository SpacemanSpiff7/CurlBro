import { AlertTriangle } from 'lucide-react';

export function MockStatusBar() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        {/* Push/Pull ratio */}
        <div className="rounded-full bg-accent-primary/15 px-2.5 py-1 text-xs font-medium text-accent-primary">
          Push 3 / Pull 2
        </div>

        {/* Missing muscle warning */}
        <div className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1">
          <AlertTriangle className="h-3 w-3 text-warning" />
          <span className="text-xs font-medium text-warning">
            Missing: Rear Delts
          </span>
        </div>

        {/* Conflict indicator */}
        <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1">
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          <span className="text-xs text-amber-400">Conflict</span>
        </div>
      </div>
    </div>
  );
}
