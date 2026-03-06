import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HouseAdComponent } from './HouseAd';
import type { HouseAd } from '../../data/houseAds';

const tipAd: HouseAd = {
  id: 'test-tip',
  category: 'form_tip',
  label: 'CURLBRO TIP',
  headline: 'Test Headline',
  body: 'Test body text',
  accentColor: 'border-l-cyan-500',
};

const linkAd: HouseAd = {
  id: 'test-link',
  category: 'general',
  label: 'CURLBRO TIP',
  headline: 'Test Link Ad',
  body: 'Test ad with link',
  cta: 'Learn More',
  href: 'https://example.com',
  accentColor: 'border-l-zinc-400',
};

describe('HouseAdComponent', () => {
  it('renders headline, body, and category tag', () => {
    render(<HouseAdComponent ad={tipAd} />);
    expect(screen.getByText('Test Headline')).toBeTruthy();
    expect(screen.getByText('Test body text')).toBeTruthy();
    expect(screen.getByText('Tip')).toBeTruthy();
  });

  it('renders as a div when no href', () => {
    const { container } = render(<HouseAdComponent ad={tipAd} />);
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders as a link when href is present', () => {
    render(<HouseAdComponent ad={linkAd} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders CTA text when provided', () => {
    render(<HouseAdComponent ad={linkAd} />);
    expect(screen.getByText('Learn More')).toBeTruthy();
  });

  it('does not render CTA when not provided', () => {
    render(<HouseAdComponent ad={tipAd} />);
    expect(screen.queryByText('Visit Portfolio')).toBeNull();
  });

  it('has complementary role and aria-label', () => {
    render(<HouseAdComponent ad={tipAd} />);
    const el = screen.getByRole('complementary');
    expect(el.getAttribute('aria-label')).toBe('Tip');
  });

  it('applies category-derived background class', () => {
    render(<HouseAdComponent ad={tipAd} />);
    const el = screen.getByRole('complementary');
    expect(el.className).toContain('bg-cyan-500/8');
  });
});
