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

const portfolioAd: HouseAd = {
  id: 'test-pf',
  category: 'portfolio',
  label: 'BUILT BY',
  headline: 'Simone Longo',
  body: 'Test portfolio ad',
  cta: 'Visit Portfolio',
  href: 'https://simonelongo.com',
  accentColor: 'border-l-accent-primary',
};

describe('HouseAdComponent', () => {
  it('renders label, headline, and body', () => {
    render(<HouseAdComponent ad={tipAd} />);
    expect(screen.getByText('CURLBRO TIP')).toBeTruthy();
    expect(screen.getByText('Test Headline')).toBeTruthy();
    expect(screen.getByText('Test body text')).toBeTruthy();
  });

  it('renders as a div when no href', () => {
    const { container } = render(<HouseAdComponent ad={tipAd} />);
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders as a link when href is present', () => {
    render(<HouseAdComponent ad={portfolioAd} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('https://simonelongo.com');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders CTA text when provided', () => {
    render(<HouseAdComponent ad={portfolioAd} />);
    expect(screen.getByText('Visit Portfolio')).toBeTruthy();
  });

  it('does not render CTA when not provided', () => {
    render(<HouseAdComponent ad={tipAd} />);
    expect(screen.queryByText('Visit Portfolio')).toBeNull();
  });

  it('has complementary role and aria-label', () => {
    render(<HouseAdComponent ad={tipAd} />);
    const el = screen.getByRole('complementary');
    expect(el.getAttribute('aria-label')).toBe('Sponsored content');
  });

  it('applies the accent color class', () => {
    render(<HouseAdComponent ad={tipAd} />);
    const el = screen.getByRole('complementary');
    expect(el.className).toContain('border-l-cyan-500');
  });
});
