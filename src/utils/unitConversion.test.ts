import { describe, it, expect } from 'vitest';
import { convertWeight, convertDistance, formatWeight, formatDistance } from './unitConversion';

describe('convertWeight', () => {
  it('returns same value when units match', () => {
    expect(convertWeight(135, 'lb', 'lb')).toBe(135);
    expect(convertWeight(60, 'kg', 'kg')).toBe(60);
  });

  it('converts lb to kg', () => {
    expect(convertWeight(100, 'lb', 'kg')).toBeCloseTo(45.3592, 3);
    expect(convertWeight(225, 'lb', 'kg')).toBeCloseTo(102.058, 2);
  });

  it('converts kg to lb', () => {
    expect(convertWeight(100, 'kg', 'lb')).toBeCloseTo(220.462, 2);
    expect(convertWeight(60, 'kg', 'lb')).toBeCloseTo(132.277, 2);
  });

  it('handles zero', () => {
    expect(convertWeight(0, 'lb', 'kg')).toBe(0);
    expect(convertWeight(0, 'kg', 'lb')).toBe(0);
  });

  it('round-trips with acceptable precision', () => {
    const original = 135;
    const converted = convertWeight(convertWeight(original, 'lb', 'kg'), 'kg', 'lb');
    expect(converted).toBeCloseTo(original, 4);
  });
});

describe('convertDistance', () => {
  it('returns same value when units match', () => {
    expect(convertDistance(5, 'mi', 'mi')).toBe(5);
    expect(convertDistance(8, 'km', 'km')).toBe(8);
  });

  it('converts mi to km', () => {
    expect(convertDistance(1, 'mi', 'km')).toBeCloseTo(1.60934, 4);
    expect(convertDistance(3.1, 'mi', 'km')).toBeCloseTo(4.989, 2);
  });

  it('converts km to mi', () => {
    expect(convertDistance(5, 'km', 'mi')).toBeCloseTo(3.107, 2);
    expect(convertDistance(10, 'km', 'mi')).toBeCloseTo(6.214, 2);
  });

  it('handles zero', () => {
    expect(convertDistance(0, 'mi', 'km')).toBe(0);
    expect(convertDistance(0, 'km', 'mi')).toBe(0);
  });

  it('round-trips with acceptable precision', () => {
    const original = 2.5;
    const converted = convertDistance(convertDistance(original, 'mi', 'km'), 'km', 'mi');
    expect(converted).toBeCloseTo(original, 4);
  });
});

describe('formatWeight', () => {
  it('formats lb as whole number', () => {
    expect(formatWeight(135, 'lb')).toBe('135 lb');
    expect(formatWeight(135.7, 'lb')).toBe('136 lb');
  });

  it('formats kg with 1 decimal', () => {
    expect(formatWeight(61.2, 'kg')).toBe('61.2 kg');
    expect(formatWeight(100, 'kg')).toBe('100 kg');
  });

  it('formats zero', () => {
    expect(formatWeight(0, 'lb')).toBe('0 lb');
    expect(formatWeight(0, 'kg')).toBe('0 kg');
  });
});

describe('formatDistance', () => {
  it('formats mi with 1 decimal', () => {
    expect(formatDistance(2.5, 'mi')).toBe('2.5 mi');
    expect(formatDistance(3, 'mi')).toBe('3 mi');
  });

  it('formats km with 1 decimal', () => {
    expect(formatDistance(4.0, 'km')).toBe('4 km');
    expect(formatDistance(5.123, 'km')).toBe('5.1 km');
  });
});
