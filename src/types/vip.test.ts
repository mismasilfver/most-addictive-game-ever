import { describe, it, expect } from 'vitest';
import {
  calculateVIPLevel,
  getVIPBenefits,
  getXPToNextLevel,
  VIP_LEVELS,
  type VIPStatus,
  type VIPLevelConfig,
} from './vip';

describe('VIP types', () => {
  describe('VIP_LEVELS', () => {
    it('has 10 levels', () => {
      expect(VIP_LEVELS).toHaveLength(10);
    });

    it('each level has increasing XP thresholds', () => {
      for (let i = 1; i < VIP_LEVELS.length; i++) {
        expect(VIP_LEVELS[i]!.xpRequired).toBeGreaterThan(VIP_LEVELS[i - 1]!.xpRequired);
      }
    });

    it('each level has production bonus', () => {
      VIP_LEVELS.forEach((level: VIPLevelConfig) => {
        expect(level.benefits.productionBonus).toBeGreaterThan(0);
      });
    });
  });

  describe('calculateVIPLevel', () => {
    it('returns level 1 with enough XP', () => {
      const level = calculateVIPLevel(VIP_LEVELS[0]!.xpRequired);
      expect(level).toBe(1);
    });

    it('returns level 0 for no XP', () => {
      const level = calculateVIPLevel(0);
      expect(level).toBe(0);
    });

    it('correctly levels up with enough XP', () => {
      const xpForLevel2 = VIP_LEVELS[1]!.xpRequired;
      const level = calculateVIPLevel(xpForLevel2);
      expect(level).toBeGreaterThanOrEqual(2);
    });

    it('caps at max level', () => {
      const level = calculateVIPLevel(9_999_999);
      expect(level).toBeLessThanOrEqual(10);
    });
  });

  describe('getVIPBenefits', () => {
    it('returns base benefits at level 0', () => {
      const benefits = getVIPBenefits(0);
      expect(benefits.productionBonus).toBe(0);
    });

    it('returns level 1 benefits', () => {
      const benefits = getVIPBenefits(1);
      expect(benefits.productionBonus).toBeGreaterThan(0);
    });

    it('higher levels have better benefits', () => {
      const lvl3 = getVIPBenefits(3);
      const lvl7 = getVIPBenefits(7);
      expect(lvl7.productionBonus).toBeGreaterThan(lvl3.productionBonus);
    });
  });

  describe('getXPToNextLevel', () => {
    it('returns XP needed for next level', () => {
      const needed = getXPToNextLevel(1, 500);
      expect(needed).toBeGreaterThan(0);
    });

    it('returns 0 at max level', () => {
      const needed = getXPToNextLevel(10, 9_999_999);
      expect(needed).toBe(0);
    });
  });

  describe('VIPStatus structure', () => {
    it('has required fields', () => {
      const status: VIPStatus = {
        level: 3,
        xp: 5000,
        benefits: {
          productionBonus: 0.3,
          offlineEfficiency: 0.15,
          exclusiveCrates: false,
          autoCollect: false,
          noAds: false,
        },
        exclusiveBadge: '💎',
        nameColor: 'text-blue-400',
      };
      expect(status.level).toBe(3);
      expect(status.benefits.productionBonus).toBe(0.3);
    });
  });
});
