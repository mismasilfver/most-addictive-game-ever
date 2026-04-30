import { describe, it, expect } from 'vitest';
import {
  shouldTriggerNearMiss,
  calculateSunkCostLabel,
  shouldShowComebackBonus,
  getLossMessage,
  NEAR_MISS_SCENARIOS,
  type NearMissEvent,
  type NearMissScenario,
} from './nearMiss';

describe('nearMiss types', () => {
  describe('NEAR_MISS_SCENARIOS', () => {
    it('has at least 3 scenarios', () => {
      expect(NEAR_MISS_SCENARIOS.length).toBeGreaterThanOrEqual(3);
    });

    it('each scenario has required fields', () => {
      NEAR_MISS_SCENARIOS.forEach((s: NearMissScenario) => {
        expect(s.trigger).toBeDefined();
        expect(s.chance).toBeGreaterThan(0);
        expect(s.chance).toBeLessThanOrEqual(1);
        expect(s.message).toBeDefined();
      });
    });
  });

  describe('shouldTriggerNearMiss', () => {
    it('returns true when roll is below chance', () => {
      // Force chance 100% → always triggers
      const result = shouldTriggerNearMiss('legendary_gacha_roll', 1.0);
      expect(result).toBe(true);
    });

    it('returns false when roll is above chance', () => {
      const result = shouldTriggerNearMiss('legendary_gacha_roll', 0.0);
      expect(result).toBe(false);
    });

    it('returns false for unknown trigger', () => {
      const result = shouldTriggerNearMiss('nonexistent_trigger', 1.0);
      expect(result).toBe(false);
    });
  });

  describe('calculateSunkCostLabel', () => {
    it('formats play time in hours', () => {
      const label = calculateSunkCostLabel(3 * 60 * 60 * 1000, 500000);
      expect(label).toContain('3');
    });

    it('formats ore in thousands', () => {
      const label = calculateSunkCostLabel(60000, 1_500_000);
      expect(label).toContain('1.5M');
    });

    it('returns a non-empty string', () => {
      const label = calculateSunkCostLabel(60000, 1000);
      expect(label.length).toBeGreaterThan(0);
    });
  });

  describe('shouldShowComebackBonus', () => {
    it('returns true after 24+ hours', () => {
      const lastLogin = Date.now() - (25 * 60 * 60 * 1000);
      expect(shouldShowComebackBonus(lastLogin)).toBe(true);
    });

    it('returns false under 24 hours', () => {
      const lastLogin = Date.now() - (10 * 60 * 60 * 1000);
      expect(shouldShowComebackBonus(lastLogin)).toBe(false);
    });
  });

  describe('getLossMessage', () => {
    it('returns a string with investment data', () => {
      const msg = getLossMessage(10, 2, 1_000_000);
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  describe('NearMissEvent structure', () => {
    it('has required fields', () => {
      const event: NearMissEvent = {
        type: 'gacha',
        trigger: 'legendary_gacha_roll',
        teaseDuration: 2000,
        emotionalImpact: 'high',
        message: 'SO CLOSE!',
        pityBonus: 5,
      };
      expect(event.type).toBe('gacha');
      expect(event.emotionalImpact).toBe('high');
    });
  });
});
