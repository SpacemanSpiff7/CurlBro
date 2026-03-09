import { Search } from 'lucide-react';

export function MockFilterChips() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="space-y-3">
        {/* Search bar */}
        <div className="flex items-center gap-2 rounded-lg bg-bg-elevated px-3 py-2">
          <Search className="h-4 w-4 text-text-tertiary" />
          <span className="text-sm text-text-tertiary">Search exercises...</span>
        </div>

        {/* Filter headers */}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-500">
            Type
          </span>
          <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-500">
            Muscle
          </span>
          <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-500">
            Equipment
          </span>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-500">
            Body State
          </span>
        </div>

        {/* Result rows */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between rounded-lg bg-bg-elevated px-3 py-2">
            <span className="text-sm text-text-primary">Bench Press</span>
            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">
              Chest
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-bg-elevated px-3 py-2">
            <span className="text-sm text-text-primary">Incline DB Press</span>
            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">
              Chest
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
