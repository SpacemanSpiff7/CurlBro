import { Check } from 'lucide-react';

export function MockSetRows() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="space-y-2">
        {/* Empty row */}
        <div className="flex items-center justify-between rounded-lg bg-bg-elevated px-3 py-2">
          <span className="text-xs text-text-tertiary">Set 1</span>
          <span className="text-sm text-text-tertiary">--- lb x ---</span>
          <div className="h-5 w-5 rounded border border-border-default" />
        </div>

        {/* Filled row */}
        <div className="flex items-center justify-between rounded-lg bg-bg-elevated px-3 py-2">
          <span className="text-xs text-text-secondary">Set 2</span>
          <span className="text-sm text-text-primary">135 lb x 10</span>
          <div className="h-5 w-5 rounded border border-border-default" />
        </div>

        {/* Completed row */}
        <div className="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2">
          <span className="text-xs text-success">Set 3</span>
          <span className="text-sm text-success">135 lb x 10</span>
          <div className="flex h-5 w-5 items-center justify-center rounded bg-success text-white">
            <Check className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
