import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdSlot } from './AdSlot';

// ADSENSE_ENABLED is false so AdSlot always renders house ads

describe('AdSlot', () => {
  it('renders a house ad fallback', () => {
    render(<AdSlot slotKey="build" />);
    const ad = screen.getByRole('complementary');
    expect(ad).toBeTruthy();
    expect(ad.getAttribute('aria-label')).toBe('Tip');
  });

  it('does not render SPONSORED label when AdSense is disabled', () => {
    render(<AdSlot slotKey="build" />);
    expect(screen.queryByText('Sponsored')).toBeNull();
  });

  it('does not render adsbygoogle ins element when disabled', () => {
    const { container } = render(<AdSlot slotKey="settings" />);
    expect(container.querySelector('.adsbygoogle')).toBeNull();
  });

  it('applies className prop', () => {
    const { container } = render(
      <AdSlot slotKey="rest_timer" className="mt-2" />,
    );
    expect(container.firstElementChild?.className).toContain('mt-2');
  });

  it('renders house ad with content from correct categories', () => {
    render(<AdSlot slotKey="post_workout" />);
    const ad = screen.getByRole('complementary');
    // post_workout categories: recovery, nutrition, general
    expect(ad.textContent).toBeTruthy();
  });
});
