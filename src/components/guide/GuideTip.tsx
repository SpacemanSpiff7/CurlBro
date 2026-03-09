import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';

interface GuideTipProps {
  children: ReactNode;
}

export function GuideTip({ children }: GuideTipProps) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-border-subtle bg-bg-elevated p-3">
      <Lightbulb size={16} className="mt-0.5 shrink-0 text-warning" />
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
}
