export function MockDropZones() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="space-y-2">
        <div className="rounded-lg border-2 border-dashed border-border-subtle bg-bg-surface/40 px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-tertiary text-center">
            Dragging
          </p>
        </div>

        <div className="relative rounded-lg bg-bg-elevated px-3 py-6 shadow-[inset_0_0_0_2px_rgba(245,158,11,0.72),0_10px_30px_rgba(245,158,11,0.18)] scale-[1.02]">
          <p className="text-sm font-medium text-text-primary text-center">
            Lat Pulldown
          </p>

          <div className="absolute left-3 right-3 top-1 h-1 rounded-full bg-accent-primary shadow-[0_0_12px_rgba(34,211,238,0.55)]" />
          <div className="absolute left-3 right-3 bottom-1 h-1 rounded-full bg-accent-primary/35" />

          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="rounded-full bg-warning/15 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-warning">
              Merge
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-bg-elevated px-3 py-3">
          <p className="text-sm font-medium text-text-primary text-center">
            Seated Row
          </p>
        </div>
      </div>
    </div>
  );
}
