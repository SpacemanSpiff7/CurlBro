import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store';
import { BottomNav } from '@/components/shared/BottomNav';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { CookieConsent } from '@/components/shared/CookieConsent';
import { closeAllSwipeRows } from '@/components/shared/SwipeToReveal';
import { Toaster } from '@/components/ui/sonner';
import { BuildWorkout } from '@/pages/BuildWorkout';
import { MyWorkouts } from '@/pages/MyWorkouts';
import { ActiveWorkout } from '@/pages/ActiveWorkout';
import { WorkoutLogPage } from '@/pages/WorkoutLogPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { deriveGroups } from '@/utils/groupUtils';
import type { TabId } from '@/types';

const TAB_ORDER: TabId[] = ['build', 'library', 'active', 'log', 'settings'];

const TAB_TITLES: Record<TabId, string> = {
  build: 'Build Workout — CurlBro',
  library: 'My Workouts — CurlBro',
  active: 'Active Session — CurlBro',
  log: 'Workout Log — CurlBro',
  settings: 'Settings — CurlBro',
};

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
  const setActiveTab = useStore((state) => state.setActiveTab);

  const [direction, setDirection] = useState<'left' | 'right'>('left');

  // On Active tab with a running session, swipe navigates exercises first
  const swipeInterceptor = useCallback((direction: 'left' | 'right') => {
    const state = useStore.getState();
    const session = state.session.active;
    if (state.activeTab !== 'active' || !session) return false;

    const groups = deriveGroups(session.exercises);
    const { currentGroupIndex } = session;

    if (direction === 'left' && currentGroupIndex < groups.length - 1) {
      state.sessionActions.goToGroup(currentGroupIndex + 1);
      return true;
    }
    if (direction === 'right' && currentGroupIndex > 0) {
      state.sessionActions.goToGroup(currentGroupIndex - 1);
      return true;
    }

    return false; // At edge, let tab navigation happen
  }, []);

  const bind = useSwipeGesture({
    onSwipe: (direction) => {
      if (swipeInterceptor(direction)) return;
      const state = useStore.getState();
      const idx = TAB_ORDER.indexOf(state.activeTab);
      if (direction === 'left' && idx < TAB_ORDER.length - 1) {
        setDirection('left');
        closeAllSwipeRows();
        setActiveTab(TAB_ORDER[idx + 1]);
      } else if (direction === 'right' && idx > 0) {
        setDirection('right');
        closeAllSwipeRows();
        setActiveTab(TAB_ORDER[idx - 1]);
      }
    },
  });

  // Save scroll position per tab, restore on return
  const scrollPositions = useRef<Partial<Record<TabId, number>>>({});
  const prevTab = useRef<TabId>(activeTab);

  useEffect(() => {
    if (prevTab.current !== activeTab) {
      scrollPositions.current[prevTab.current] = window.scrollY;
      prevTab.current = activeTab;
      closeAllSwipeRows();

      const saved = scrollPositions.current[activeTab];
      // Defer to ensure content has rendered after animation
      requestAnimationFrame(() => window.scrollTo(0, saved ?? 0));
    }
  }, [activeTab]);

  useEffect(() => {
    document.title = TAB_TITLES[activeTab];
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
      <main {...bind()} className="flex-1" style={{ touchAction: 'pan-y' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: direction === 'left' ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'left' ? -50 : 50 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <AppContent />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <CookieConsent />
      <Toaster position="top-center" />
    </div>
  );
}
