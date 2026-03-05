import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { BottomNav } from '@/components/shared/BottomNav';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { BuildWorkout } from '@/pages/BuildWorkout';
import { MyWorkouts } from '@/pages/MyWorkouts';
import { ActiveWorkout } from '@/pages/ActiveWorkout';
import { WorkoutLogPage } from '@/pages/WorkoutLogPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';
import type { TabId } from '@/types';

function AppContent() {
  const activeTab = useStore((state) => state.activeTab);

  switch (activeTab) {
    case 'build':
      return (
        <ErrorBoundary fallbackTitle="Builder Error" key="build">
          <BuildWorkout />
        </ErrorBoundary>
      );
    case 'library':
      return (
        <ErrorBoundary fallbackTitle="Library Error" key="library">
          <MyWorkouts />
        </ErrorBoundary>
      );
    case 'active':
      return (
        <ErrorBoundary fallbackTitle="Session Error" key="active">
          <ActiveWorkout />
        </ErrorBoundary>
      );
    case 'log':
      return (
        <ErrorBoundary fallbackTitle="Log Error" key="log">
          <WorkoutLogPage />
        </ErrorBoundary>
      );
    case 'settings':
      return (
        <ErrorBoundary fallbackTitle="Settings Error" key="settings">
          <SettingsPage />
        </ErrorBoundary>
      );
  }
}

export default function App() {
  const initGraph = useStore((state) => state.initGraph);
  const graphReady = useStore((state) => state.graphReady);
  const activeTab = useStore((state) => state.activeTab);
  const swipeRef = useSwipeTabs();

  // Save scroll position per tab, restore on return
  const scrollPositions = useRef<Partial<Record<TabId, number>>>({});
  const prevTab = useRef<TabId>(activeTab);

  useEffect(() => {
    if (prevTab.current !== activeTab) {
      // Save outgoing tab's scroll position
      scrollPositions.current[prevTab.current] = window.scrollY;
      prevTab.current = activeTab;

      // Restore saved position or scroll to top
      const saved = scrollPositions.current[activeTab];
      window.scrollTo(0, saved ?? 0);
    }
  }, [activeTab]);

  useEffect(() => {
    initGraph();
  }, [initGraph]);

  if (!graphReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-text-secondary">Loading exercises...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col pb-16">
      <main ref={swipeRef} className="flex-1">
        <AppContent />
      </main>
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  );
}
