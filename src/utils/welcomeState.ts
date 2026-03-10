const STORAGE_KEY = 'curlbro_welcome_dismissed';

/** Check if the user has already dismissed the welcome page this session */
export function hasSeenWelcome(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Mark the welcome page as dismissed for this session */
export function markWelcomeSeen(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // sessionStorage unavailable (private browsing, etc.)
  }
}

/** Re-trigger the welcome page (from Settings > Help) */
export function resetWelcomeSeen(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sessionStorage unavailable
  }
  window.dispatchEvent(new Event('curlbro_welcome_reset'));
}
