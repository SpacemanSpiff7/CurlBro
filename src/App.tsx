import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store';
import { BottomNav } from '@/components/shared/BottomNav';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { CookieConsent } from '@/components/shared/CookieConsent';
import { closeAllSwipeRows } from '@/components/shared/SwipeToReveal';
import { Toaster } from '@/components/ui/sonner';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { setDragOffset } from '@/hooks/useDragOffsetChannel';
import { FloatingRestTimer } from '@/components/session/FloatingRestTimer';
import { deriveGroups } from '@/utils/groupUtils';
import { hasSeenWelcome } from '@/utils/welcomeState';
import type { TabId } from '@/types';

const BuildWorkout = lazy(() => import('@/pages/BuildWorkout').then(m => ({ default: m.BuildWorkout })));
const MyWorkouts = lazy(() => import('@/pages/MyWorkouts').then(m => ({ default: m.MyWorkouts })));
const ActiveWorkout = lazy(() => import('@/pages/ActiveWorkout').then(m => ({ default: m.ActiveWorkout })));
const WorkoutLogPage = lazy(() => import('@/pages/WorkoutLogPage').then(m => ({ default: m.WorkoutLogPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const WelcomePage = lazy(() => import('@/pages/WelcomePage').then(m => ({ default: m.WelcomePage })));

const TAB_ORDER: TabId[] = ['library', 'build', 'active', 'log', 'settings'];

const TAB_TITLES: Record<TabId, string> = {
  build: 'CurlBro — Build Workout',
  library: 'CurlBro — My Workouts',
  active: 'CurlBro — Active Session',
  log: 'CurlBro — Workout Log',
  settings: 'CurlBro — Settings',
};

const PageFallback = (
  <div className="flex min-h-[50dvh] items-center justify-center">
    <div className="text-text-secondary">Loading...</div>
  </div>
);

function AppContent() {
  const activeTab = useStore((state) => state.activeTab);

  return (
    <Suspense fallback={PageFallback}>
      {activeTab === 'build' && (
        <ErrorBoundary fallbackTitle="Builder Error" key="build">
          <BuildWorkout />
        </ErrorBoundary>
      )}
      {activeTab === 'library' && (
        <ErrorBoundary fallbackTitle="Library Error" key="library">
          <MyWorkouts />
        </ErrorBoundary>
      )}
      {activeTab === 'active' && (
        <ErrorBoundary fallbackTitle="Session Error" key="active">
          <ActiveWorkout />
        </ErrorBoundary>
      )}
      {activeTab === 'log' && (
        <ErrorBoundary fallbackTitle="Log Error" key="log">
          <WorkoutLogPage />
        </ErrorBoundary>
      )}
      {activeTab === 'settings' && (
        <ErrorBoundary fallbackTitle="Settings Error" key="settings">
          <SettingsPage />
        </ErrorBoundary>
      )}
    </Suspense>
  );
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

  /** Snapshot active session + derived groups for gesture callbacks. */
  const getSessionInfo = useCallback(() => {
    const state = useStore.getState();
    const session = state.session.active;
    if (state.activeTab !== 'active' || !session || !session.startedAt) return null;
    return { session, groups: deriveGroups(session.exercises), actions: state.sessionActions };
  }, []);

  // On Active tab with a running session, swipe navigates exercises first
  const swipeInterceptor = useCallback((direction: 'left' | 'right') => {
    const info = getSessionInfo();
    if (!info) return false;

    const { groups, session, actions } = info;
    const { currentGroupIndex } = session;

    if (direction === 'left' && currentGroupIndex < groups.length - 1) {
      actions.goToGroup(currentGroupIndex + 1);
      return true;
    }
    if (direction === 'right' && currentGroupIndex > 0) {
      actions.goToGroup(currentGroupIndex - 1);
      return true;
    }

    return false; // At edge, let tab navigation happen
  }, [getSessionInfo]);

  const handleDragOffset = useCallback((offsetX: number) => {
    const info = getSessionInfo();
    if (!info) return;

    const { groups, session } = info;
    const { currentGroupIndex } = session;
    const atFirstGroup = currentGroupIndex <= 0;
    const atLastGroup = currentGroupIndex >= groups.length - 1;

    // Rubber-band at edges: dampen to 0.3x when dragging past first/last
    const atEdge =
      (offsetX > 0 && atFirstGroup) || (offsetX < 0 && atLastGroup);
    const dampened = atEdge ? offsetX * 0.3 : offsetX;

    setDragOffset(dampened);
  }, [getSessionInfo]);

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
          <Suspense fallback={null}>
            <WelcomePage onDismiss={() => setShowWelcome(false)} />
          </Suspense>
        )}
      </AnimatePresence>
      <CookieConsent />
      <Toaster position="top-center" />
    </div>
  );
}
