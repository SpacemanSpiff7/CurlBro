export const CONSENT_KEY = 'curlbro_cookie_consent';

/** Call from Settings to let user re-choose */
export function resetCookieConsent() {
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new Event('curlbro_consent_reset'));
}
