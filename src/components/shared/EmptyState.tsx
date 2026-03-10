import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={48} className="text-text-tertiary mb-3" />
      <div className="text-sm text-text-secondary">{title}</div>
      {subtitle && (
        <div className="text-xs text-text-tertiary mt-1">{subtitle}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
