import { useState, useEffect, useCallback } from 'react';
import { CONSENT_KEY } from '@/utils/cookieConsent';

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
  // Derive initial visibility from localStorage (avoids setState in effect)
  const [visible, setVisible] = useState(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'granted') {
      updateGtagConsent(true);
      return false;
    }
    if (stored === 'denied') return false;
    return true;
  });

  // Listen for reset events from Settings
  useEffect(() => {
    const handleReset = () => setVisible(true);
    window.addEventListener('curlbro_consent_reset', handleReset);
    return () => window.removeEventListener('curlbro_consent_reset', handleReset);
  }, []);

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    updateGtagConsent(true);
    setVisible(false);
  }, []);

  const handleReject = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'denied');
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-16 left-0 right-0 z-50 border-t border-zinc-700 bg-zinc-900 px-4 py-3"
      role="dialog"
      aria-label="Cookie consent"
    >
      <p className="text-xs text-zinc-400 mb-3">
        We use cookies for analytics and to improve your experience.{' '}
        <button
          onClick={() => {
            // Privacy policy is in Settings — dispatch event to open it
            // For now, just scroll text. The user can find it in Settings > Legal
          }}
          className="text-cyan-400 underline underline-offset-2"
        >
          Privacy Policy
        </button>
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleReject}
          className="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          Reject
        </button>
        <button
          onClick={handleAccept}
          className="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
