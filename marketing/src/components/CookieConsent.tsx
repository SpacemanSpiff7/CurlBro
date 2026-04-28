import { useState, useEffect } from 'react';

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

export function CookieConsent() {
  // Always render hidden first; useEffect decides if banner should appear.
  // This avoids any SSR/hydration mismatch on mobile webkit.
  const [visible, setVisible] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored === 'granted') {
        updateGtagConsent(true);
        return;
      }
      if (stored === 'denied') return;
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const handleReset = () => setVisible(true);
    window.addEventListener('curlbro_consent_reset', handleReset);
    return () => window.removeEventListener('curlbro_consent_reset', handleReset);
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'granted');
    } catch {
      /* storage unavailable */
    }
    updateGtagConsent(true);
    setVisible(false);
  };

  const handleReject = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'denied');
    } catch {
      /* storage unavailable */
    }
    setVisible(false);
  };

  if (!hydrated || !visible) return null;

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
