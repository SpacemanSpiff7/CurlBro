import { useSyncExternalStore } from 'react';

// Same storage key as the SPA so a single accept/reject decision applies
// across the marketing site AND the web app at /app/.
const CONSENT_KEY = 'curlbro_cookie_consent';

declare global {
  interface Window {
    dataLayer: Array<unknown>;
    gtag: (...args: unknown[]) => void;
  }
}

function updateGtagConsent(granted: boolean) {
  if (typeof window.gtag !== 'function') return;
  const value = granted ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  });
}

// ── Banner-visibility external store ────────────────────────────────────
// Whether the banner shows is client-only state: it depends on a localStorage
// read that must happen AFTER hydration (reading it during render would cause
// an SSR/hydration mismatch on mobile webkit). useSyncExternalStore renders the
// server snapshot (hidden) first, then syncs to the real client value once
// mounted — the React-blessed alternative to a synchronous setState-in-effect.
let bannerVisible = false;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setBannerVisible(next: boolean) {
  if (bannerVisible === next) return;
  bannerVisible = next;
  emit();
}

// Read the stored decision once, the first time we mount on the client.
function initFromStorage() {
  if (initialized) return;
  initialized = true;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'granted') {
      updateGtagConsent(true);
      return;
    }
    if (stored === 'denied') return;
    bannerVisible = true; // no decision yet → show the banner
  } catch {
    bannerVisible = true; // storage unavailable → show the banner
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  initFromStorage();
  // Settings > "reset consent" re-opens the banner without clearing storage.
  const handleReset = () => setBannerVisible(true);
  window.addEventListener('curlbro_consent_reset', handleReset);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('curlbro_consent_reset', handleReset);
  };
}

const getSnapshot = () => bannerVisible;
const getServerSnapshot = () => false;

export function CookieConsent() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'granted');
    } catch {
      /* storage unavailable */
    }
    updateGtagConsent(true);
    setBannerVisible(false);
  };

  const handleReject = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'denied');
    } catch {
      /* storage unavailable */
    }
    setBannerVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[var(--border-subtle)] bg-[var(--bg-root)]/95 px-5 pt-4 backdrop-blur-md sm:px-8"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
          We use cookies for analytics. Read the{' '}
          <a
            href="/privacy/"
            className="text-[var(--accent-primary)] underline underline-offset-2 hover:text-[var(--accent-hover)]"
          >
            privacy policy
          </a>
          .
        </p>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={handleReject}
            className="btn btn-ghost flex-1 sm:flex-none"
            style={{
              height: 40,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="btn btn-primary flex-1 sm:flex-none"
            style={{
              height: 40,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
