import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const DOTS = 5;

export function MockDotIndicators() {
  const [active, setActive] = useState(2);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((v) => (v + 1) % DOTS);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="flex items-center justify-center gap-2">
        <ChevronLeft className="h-4 w-4 text-text-tertiary" />

        <div className="flex items-center gap-1.5">
          {Array.from({ length: DOTS }).map((_, i) => {
            const isCompleted = i < active;
            const isActive = i === active;
            return (
              <div
                key={i}
                className={[
                  'h-2 rounded-full transition-all duration-300',
                  isActive
                    ? 'w-4 bg-amber-500'
                    : isCompleted
                      ? 'w-2 bg-success'
                      : 'w-2 bg-border-default',
                ].join(' ')}
              />
            );
          })}
        </div>

        <ChevronRight className="h-4 w-4 text-text-tertiary" />

        <div className="ml-1 flex h-4 w-4 items-center justify-center rounded-full border border-border-default">
          <Plus className="h-2.5 w-2.5 text-text-tertiary" />
        </div>
      </div>
    </div>
  );
}
