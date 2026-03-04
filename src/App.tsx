import { useEffect } from 'react';
import { useStore } from '@/store';
import { BottomNav } from '@/components/shared/BottomNav';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { BuildWorkout } from '@/pages/BuildWorkout';
import { MyWorkouts } from '@/pages/MyWorkouts';
import { ActiveWorkout } from '@/pages/ActiveWorkout';
import { SettingsPage } from '@/pages/SettingsPage';

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
      <main className="flex-1">
        <AppContent />
      </main>
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  );
}
