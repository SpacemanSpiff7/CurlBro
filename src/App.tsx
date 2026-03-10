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
import { WelcomePage } from '@/pages/WelcomePage';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { setDragOffset } from '@/hooks/useDragOffsetChannel';
import { FloatingRestTimer } from '@/components/session/FloatingRestTimer';
import { deriveGroups } from '@/utils/groupUtils';
import { hasSeenWelcome } from '@/utils/welcomeState';
import type { TabId } from '@/types';

const TAB_ORDER: TabId[] = ['build', 'library', 'active', 'log', 'settings'];

const TAB_TITLES: Record<TabId, string> = {
  build: 'CurlBro — Build Workout',
  library: 'CurlBro — My Workouts',
  active: 'CurlBro — Active Session',
  log: 'CurlBro — Workout Log',
  settings: 'CurlBro — Settings',
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
  const [showWelcome, setShowWelcome] = useState(() => !hasSeenWelcome());

  // Listen for welcome reset from Settings
  useEffect(() => {
    const handleReset = () => setShowWelcome(true);
    window.addEventListener('curlbro_welcome_reset', handleReset);
    return () => window.removeEventListener('curlbro_welcome_reset', handleReset);
  }, []);

  // On Active tab with a running session, swipe navigates exercises first
  const swipeInterceptor = useCallback((direction: 'left' | 'right') => {
    const state = useStore.getState();
    const session = state.session.active;
    if (state.activeTab !== 'active' || !session || !session.startedAt) return false;

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

  const handleDragOffset = useCallback((offsetX: number) => {
    const state = useStore.getState();
    const session = state.session.active;
    if (state.activeTab !== 'active' || !session || !session.startedAt) return;

    const groups = deriveGroups(session.exercises);
    const { currentGroupIndex } = session;
    const atFirstGroup = currentGroupIndex <= 0;
    const atLastGroup = currentGroupIndex >= groups.length - 1;

    // Rubber-band at edges: dampen to 0.3x when dragging past first/last
    const atEdge =
      (offsetX > 0 && atFirstGroup) || (offsetX < 0 && atLastGroup);
    const dampened = atEdge ? offsetX * 0.3 : offsetX;

    setDragOffset(dampened);
  }, []);

  const bind = useSwipeGesture({
    onSwipe: (direction) => {
      if (showWelcome) return;
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
    onDragOffset: handleDragOffset,
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
    document.title = showWelcome ? 'CurlBro' : TAB_TITLES[activeTab];
  }, [activeTab, showWelcome]);

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
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: direction === 'left' ? 80 : -80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'left' ? -80 : 80 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }}
            layout
          >
            <AppContent />
          </motion.div>
        </AnimatePresence>
      </main>
      <FloatingRestTimer />
      <BottomNav />
      <AnimatePresence>
        {showWelcome && (
          <WelcomePage onDismiss={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>
      <CookieConsent />
      <Toaster position="top-center" />
    </div>
  );
}
