import { describe, it, expect } from 'vitest';
import { 
  calculateAscensionPoints, 
  calculatePrestigeMultiplier, 
  PRESTIGE_THRESHOLDS,
  type Ascension 
} from './prestige';

describe('prestige system', () => {
  describe('calculateAscensionPoints', () => {
    it('returns 0 for no buildings', () => {
      const points = calculateAscensionPoints(0, 0, 0);
      expect(points).toBe(0);
    });

    it('calculates points based on total ore earned', () => {
      const points = calculateAscensionPoints(15000, 0, 0); // Above 10000 minimum
      expect(points).toBeGreaterThan(0);
    });

    it('scales with building count', () => {
      const points10 = calculateAscensionPoints(10000, 10, 0);
      const points20 = calculateAscensionPoints(10000, 20, 0);
      expect(points20).toBeGreaterThan(points10);
    });

    it('includes play time bonus', () => {
      const pointsNoTime = calculateAscensionPoints(10000, 10, 0);
      const pointsWithTime = calculateAscensionPoints(10000, 10, 60); // 60 minutes
      expect(pointsWithTime).toBeGreaterThan(pointsNoTime);
    });

    it('uses logarithmic scaling to prevent exponential growth', () => {
      const small = calculateAscensionPoints(10000, 5, 10); // Above minimum threshold
      const large = calculateAscensionPoints(1000000, 50, 600);
      // Large should be bigger but not 1000x bigger
      expect(large / small).toBeLessThan(100);
    });
  });

  describe('calculatePrestigeMultiplier', () => {
    it('returns 1.0 for ascension level 0', () => {
      const multiplier = calculatePrestigeMultiplier(0);
      expect(multiplier).toBe(1.0);
    });

    it('increases multiplier with ascension level', () => {
      const m1 = calculatePrestigeMultiplier(1);
      const m5 = calculatePrestigeMultiplier(5);
      expect(m5).toBeGreaterThan(m1);
    });

    it('adds 10% per ascension level', () => {
      const multiplier = calculatePrestigeMultiplier(5);
      expect(multiplier).toBe(1.5); // 1.0 + (5 * 0.1)
    });

    it('caps at reasonable maximum', () => {
      const maxMultiplier = calculatePrestigeMultiplier(100);
      expect(maxMultiplier).toBeLessThanOrEqual(10.0);
    });
  });

  describe('PRESTIGE_THRESHOLDS', () => {
    it('defines minimum ore for first ascension', () => {
      expect(PRESTIGE_THRESHOLDS.minOreFirst).toBeGreaterThan(0);
    });

    it('defines recommended ore for optimal first ascension', () => {
      expect(PRESTIGE_THRESHOLDS.recommendedFirst).toBeGreaterThan(PRESTIGE_THRESHOLDS.minOreFirst);
    });

    it('defines scaling factor for subsequent ascensions', () => {
      expect(PRESTIGE_THRESHOLDS.scalingFactor).toBeGreaterThan(1.0);
    });
  });

  describe('ascension structure', () => {
    it('has required properties', () => {
      const ascension: Ascension = {
        level: 1,
        permanentBonuses: {
          productionMultiplier: 1.1,
          offlineEfficiency: 0.55,
          tapBonusMultiplier: 1.25,
        },
        ascensionPoints: 100,
        unlocks: ['ascension_shop'],
      };

      expect(ascension.level).toBe(1);
      expect(ascension.permanentBonuses.productionMultiplier).toBe(1.1);
      expect(ascension.ascensionPoints).toBe(100);
    });
  });
});
