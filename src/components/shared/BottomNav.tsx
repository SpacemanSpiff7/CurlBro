import { memo } from 'react';
import { Dumbbell, Library, Play, ClipboardList, Settings } from 'lucide-react';
import type { TabId } from '@/types';
import { useStore } from '@/store';

const tabs: { id: TabId; label: string; icon: typeof Dumbbell }[] = [
  { id: 'build', label: 'Build', icon: Dumbbell },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'active', label: 'Active', icon: Play },
  { id: 'log', label: 'Log', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const BottomNav = memo(function BottomNav() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const builderDirty = useStore((state) => state.builder.isDirty);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-bg-surface"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                isActive
                  ? 'text-accent-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
              style={{ minHeight: '56px' }}
            >
              <span className="relative">
                <Icon size={20} />
                {id === 'build' && builderDirty && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-warning" />
                )}
              </span>
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
