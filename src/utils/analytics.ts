/**
 * Thin, guarded wrapper around GA4's gtag. `window.gtag` is declared globally
 * in CookieConsent.tsx and loaded in index.html. Calling before gtag exists
 * (or with analytics consent denied) is a safe no-op — Consent Mode v2 queues
 * events and only sends them once/if consent is granted.
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
