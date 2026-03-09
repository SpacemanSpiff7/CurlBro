export function MockDropZones() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="space-y-2">
        {/* First card with zone overlays */}
        <div className="relative rounded-lg bg-bg-elevated px-3 py-6">
          <p className="text-sm font-medium text-text-primary text-center">
            Lat Pulldown
          </p>

          {/* Top 30% zone */}
          <div className="absolute inset-x-0 top-0 h-[30%] rounded-t-lg border-2 border-dashed border-border-default flex items-center justify-center">
            <span className="text-[10px] font-medium text-text-tertiary bg-bg-surface/80 px-1.5 py-0.5 rounded">
              Reorder &uarr;&darr;
            </span>
          </div>

          {/* Center 40% zone */}
          <div className="absolute inset-x-0 top-[30%] h-[40%] border-2 border-dashed border-accent-primary/60 flex items-center justify-center animate-pulse">
            <span className="text-[10px] font-medium text-accent-primary bg-bg-surface/80 px-1.5 py-0.5 rounded">
              Superset &#10231;
            </span>
          </div>

          {/* Bottom 30% zone */}
          <div className="absolute inset-x-0 bottom-0 h-[30%] rounded-b-lg border-2 border-dashed border-border-default flex items-center justify-center">
            <span className="text-[10px] font-medium text-text-tertiary bg-bg-surface/80 px-1.5 py-0.5 rounded">
              Reorder &uarr;&darr;
            </span>
          </div>
        </div>

        {/* Second card (plain) */}
        <div className="rounded-lg bg-bg-elevated px-3 py-3">
          <p className="text-sm font-medium text-text-primary text-center">
            Seated Row
          </p>
        </div>
      </div>
    </div>
  );
}
