import type { WeightUnit, DistanceUnit } from '@/types';

// ─── Constants ───────────────────────────────────────────
const LB_TO_KG = 0.453592;
const MI_TO_KM = 1.60934;

// ─── Conversion ──────────────────────────────────────────

/** Convert a weight value between lb and kg. */
export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  return from === 'lb' ? value * LB_TO_KG : value / LB_TO_KG;
}

/** Convert a distance value between mi and km. */
export function convertDistance(value: number, from: DistanceUnit, to: DistanceUnit): number {
  if (from === to) return value;
  return from === 'mi' ? value * MI_TO_KM : value / MI_TO_KM;
}

// ─── Formatting ──────────────────────────────────────────

/** Format a weight value with unit label (e.g. "135 lb", "61.2 kg"). */
export function formatWeight(value: number, unit: WeightUnit): string {
  const display = unit === 'kg' ? round1(value) : Math.round(value);
  return `${display} ${unit}`;
}

/** Format a distance value with unit label (e.g. "2.5 mi", "4.0 km"). */
export function formatDistance(value: number, unit: DistanceUnit): string {
  return `${round1(value)} ${unit}`;
}

// ─── Helpers ─────────────────────────────────────────────

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
