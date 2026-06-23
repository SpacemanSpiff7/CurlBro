import { APP_STORE_URL, type AppStorePlacement } from '@/config/app';
import { trackEvent } from '@/utils/analytics';

interface AppStoreBadgeProps {
  /** Where the badge is rendered — sent with the analytics event. */
  placement: AppStorePlacement;
  /** Tailwind sizing for the badge image (defaults to h-10 ≈ 40px, Apple's min). */
  className?: string;
}

/**
 * "Download on the App Store" badge linking to CurlBro's iOS app.
 *
 * Renders Apple's official, unmodified badge artwork (public/app-store-badge-*.svg),
 * swapping the black variant (light theme) for the white variant (dark theme) via the
 * `.dark` class — no JS, no hydration flash. The anchor keeps a ≥44px touch target.
 */
export function AppStoreBadge({ placement, className = 'h-10' }: AppStoreBadgeProps) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download CurlBro on the App Store"
      onClick={() => trackEvent('app_store_click', { placement })}
      className="inline-flex min-h-[44px] items-center"
    >
      <img
        src={`${import.meta.env.BASE_URL}app-store-badge-black.svg`}
        alt=""
        aria-hidden="true"
        className={`block w-auto dark:hidden ${className}`}
      />
      <img
        src={`${import.meta.env.BASE_URL}app-store-badge-white.svg`}
        alt=""
        aria-hidden="true"
        className={`hidden w-auto dark:block ${className}`}
      />
    </a>
  );
}
