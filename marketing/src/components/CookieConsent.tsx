import { useState, useEffect, useCallback } from 'react';

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
  const [visible, setVisible] = useState(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored === 'granted') {
        updateGtagConsent(true);
        return false;
      }
      if (stored === 'denied') return false;
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handleReset = () => setVisible(true);
    window.addEventListener('curlbro_consent_reset', handleReset);
    return () => window.removeEventListener('curlbro_consent_reset', handleReset);
  }, []);

  const handleAccept = useCallback(() => {
    try {
      localStorage.setItem(CONSENT_KEY, 'granted');
    } catch {
      /* storage unavailable */
    }
    updateGtagConsent(true);
    setVisible(false);
  }, []);

  const handleReject = useCallback(() => {
    try {
      localStorage.setItem(CONSENT_KEY, 'denied');
    } catch {
      /* storage unavailable */
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[var(--border-subtle)] bg-[var(--bg-root)]/95 px-5 py-4 backdrop-blur-md sm:px-8"
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
            onClick={handleReject}
            className="btn btn-ghost"
            style={{ height: 40 }}
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="btn btn-primary"
            style={{ height: 40 }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
