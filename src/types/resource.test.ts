import { describe, it, expect } from 'vitest';
import { formatNumber, RESOURCE_NAMES, RESOURCE_ICONS, RESOURCE_COLORS } from './resource';

describe('formatNumber', () => {
  describe('formats small numbers (< 1000)', () => {
    it('returns whole number for integers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(1)).toBe('1');
      expect(formatNumber(999)).toBe('999');
    });

    it('floors decimal numbers', () => {
      expect(formatNumber(123.9)).toBe('123');
      expect(formatNumber(999.99)).toBe('999');
    });
  });

  describe('formats thousands (1K - 999K)', () => {
    it('formats 1000 as 1.0K', () => {
      expect(formatNumber(1000)).toBe('1.0K');
    });

    it('formats large thousands with one decimal', () => {
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(999000)).toBe('999.0K');
      expect(formatNumber(999999)).toBe('1000.0K');
    });
  });

  describe('formats millions (1M - 999M)', () => {
    it('formats 1 million correctly', () => {
      expect(formatNumber(1000000)).toBe('1.0M');
    });

    it('formats various millions', () => {
      expect(formatNumber(2500000)).toBe('2.5M');
      expect(formatNumber(999999999)).toBe('1000.0M');
    });
  });

  describe('formats billions (1B - 999B)', () => {
    it('formats 1 billion correctly', () => {
      expect(formatNumber(1000000000)).toBe('1.0B');
    });

    it('formats various billions', () => {
      expect(formatNumber(5000000000)).toBe('5.0B');
    });
  });

  describe('formats trillions (1T+)', () => {
    it('formats 1 trillion correctly', () => {
      expect(formatNumber(1000000000000)).toBe('1.0T');
    });

    it('formats large trillions', () => {
      expect(formatNumber(5000000000000)).toBe('5.0T');
    });
  });
});

describe('Resource Constants', () => {
  it('RESOURCE_NAMES has correct display names', () => {
    expect(RESOURCE_NAMES.ore).toBe('Raw Ore');
    expect(RESOURCE_NAMES.alloy).toBe('Metal Alloy');
    expect(RESOURCE_NAMES.component).toBe('Components');
    expect(RESOURCE_NAMES.module).toBe('Modules');
  });

  it('RESOURCE_ICONS has correct emojis', () => {
    expect(RESOURCE_ICONS.ore).toBe('⛏️');
    expect(RESOURCE_ICONS.alloy).toBe('🔩');
    expect(RESOURCE_ICONS.component).toBe('🔌');
    expect(RESOURCE_ICONS.module).toBe('💾');
  });

  it('RESOURCE_COLORS has Tailwind classes', () => {
    expect(RESOURCE_COLORS.ore).toContain('gray');
    expect(RESOURCE_COLORS.alloy).toContain('orange');
    expect(RESOURCE_COLORS.component).toContain('blue');
    expect(RESOURCE_COLORS.module).toContain('purple');
  });
});
