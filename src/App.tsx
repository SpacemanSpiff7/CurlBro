import { useEffect } from 'react';
import { useStore } from '@/store';
import { BottomNav } from '@/components/shared/BottomNav';
import { BuildWorkout } from '@/pages/BuildWorkout';
import { MyWorkouts } from '@/pages/MyWorkouts';
import { ActiveWorkout } from '@/pages/ActiveWorkout';
import { SettingsPage } from '@/pages/SettingsPage';

function AppContent() {
  const activeTab = useStore((state) => state.activeTab);

  switch (activeTab) {
    case 'build':
      return <BuildWorkout />;
    case 'library':
      return <MyWorkouts />;
    case 'active':
      return <ActiveWorkout />;
    case 'settings':
      return <SettingsPage />;
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
    </div>
  );
}
