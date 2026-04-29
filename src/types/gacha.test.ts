import { describe, it, expect } from 'vitest';
import { 
  calculatePityProbability, 
  shouldTriggerSoftPity, 
  PITY_SYSTEM,
  GACHA_COST,
  type GachaBanner,
  type GachaPullResult,
} from './gacha';

describe('gacha system', () => {
  describe('PITY_SYSTEM', () => {
    it('has soft pity threshold', () => {
      expect(PITY_SYSTEM.softPityStart).toBeGreaterThan(0);
      expect(PITY_SYSTEM.softPityStart).toBeLessThan(PITY_SYSTEM.hardPity);
    });

    it('has hard pity threshold', () => {
      expect(PITY_SYSTEM.hardPity).toBeGreaterThan(PITY_SYSTEM.softPityStart);
    });

    it('allows pity carryover', () => {
      expect(PITY_SYSTEM.carryOver).toBe(true);
    });
  });

  describe('GACHA_COST', () => {
    it('defines single pull cost', () => {
      expect(GACHA_COST.single).toBeGreaterThan(0);
    });

    it('defines multi pull cost', () => {
      expect(GACHA_COST.multi).toBeGreaterThan(GACHA_COST.single);
    });

    it('gives discount for multi pull', () => {
      const tenSingles = GACHA_COST.single * 10;
      expect(GACHA_COST.multi).toBeLessThan(tenSingles);
    });
  });

  describe('calculatePityProbability', () => {
    it('returns base rate before soft pity', () => {
      const rate = calculatePityProbability(50); // Below soft pity
      expect(rate).toBe(0.009); // Base legendary rate
    });

    it('increases rate during soft pity', () => {
      const before = calculatePityProbability(79);
      const during = calculatePityProbability(85);
      expect(during).toBeGreaterThan(before);
    });

    it('guarantees legendary at hard pity', () => {
      const rate = calculatePityProbability(100);
      expect(rate).toBe(1.0);
    });
  });

  describe('shouldTriggerSoftPity', () => {
    it('returns false before threshold', () => {
      expect(shouldTriggerSoftPity(79)).toBe(false);
    });

    it('returns true at threshold', () => {
      expect(shouldTriggerSoftPity(80)).toBe(true);
    });

    it('returns true after threshold', () => {
      expect(shouldTriggerSoftPity(90)).toBe(true);
    });
  });

  describe('gacha banner structure', () => {
    it('has required properties', () => {
      const banner: GachaBanner = {
        id: 'test-banner',
        name: 'Test Banner',
        featuredItem: 'legendary-1',
        featuredRate: 0.01,
        cost: 100,
        pityCounter: 0,
        expiresAt: Date.now() + 86400000,
      };

      expect(banner.id).toBe('test-banner');
      expect(banner.featuredRate).toBe(0.01);
      expect(banner.pityCounter).toBe(0);
    });
  });

  describe('gacha pull result', () => {
    it('tracks pity counter', () => {
      const result: GachaPullResult = {
        items: [],
        pityCounter: 5,
        isFeatured: false,
        totalValue: 0,
      };

      expect(result.pityCounter).toBe(5);
    });

    it('indicates featured item', () => {
      const result: GachaPullResult = {
        items: [],
        pityCounter: 0,
        isFeatured: true,
        totalValue: 1000,
      };

      expect(result.isFeatured).toBe(true);
    });
  });
});
