import { describe, it, expect } from 'vitest';
import {
  shouldTriggerStreakWarning,
  formatStreakWarning,
  shouldTriggerOfflineReturn,
  formatOfflineReturn,
  shouldTriggerCrateNag,
  NOTIFICATION_TRIGGERS,
  type GameNotification,
} from './notifications';

describe('notification types', () => {
  describe('NOTIFICATION_TRIGGERS', () => {
    it('has streak_at_risk trigger', () => {
      expect(NOTIFICATION_TRIGGERS.streak_at_risk).toBeDefined();
      expect(NOTIFICATION_TRIGGERS.streak_at_risk.hoursBeforeReset).toBeGreaterThan(0);
    });

    it('has crate_maximized trigger', () => {
      expect(NOTIFICATION_TRIGGERS.crate_maximized).toBeDefined();
      expect(NOTIFICATION_TRIGGERS.crate_maximized.unopenedCount).toBeGreaterThan(0);
    });

    it('has offline_complete trigger', () => {
      expect(NOTIFICATION_TRIGGERS.offline_complete).toBeDefined();
    });
  });

  describe('shouldTriggerStreakWarning', () => {
    it('returns true when streak is at risk (close to reset)', () => {
      const lastLoginTime = Date.now() - (20 * 60 * 60 * 1000); // 20h ago
      const result = shouldTriggerStreakWarning(lastLoginTime, 5);
      expect(result).toBe(true);
    });

    it('returns false when streak was just maintained', () => {
      const lastLoginTime = Date.now() - (2 * 60 * 60 * 1000); // 2h ago
      const result = shouldTriggerStreakWarning(lastLoginTime, 5);
      expect(result).toBe(false);
    });

    it('returns false when streak is 0', () => {
      const lastLoginTime = Date.now() - (20 * 60 * 60 * 1000);
      const result = shouldTriggerStreakWarning(lastLoginTime, 0);
      expect(result).toBe(false);
    });
  });

  describe('formatStreakWarning', () => {
    it('includes streak count in message', () => {
      const msg = formatStreakWarning(12, 4);
      expect(msg).toContain('12');
    });

    it('includes hours remaining', () => {
      const msg = formatStreakWarning(7, 4);
      expect(msg).toContain('4');
    });
  });

  describe('shouldTriggerOfflineReturn', () => {
    it('returns true after minimum offline time with enough ore', () => {
      const offlineMs = 60 * 60 * 1000; // 1 hour
      const oreEarned = 5000;
      expect(shouldTriggerOfflineReturn(offlineMs, oreEarned)).toBe(true);
    });

    it('returns false when offline time is too short', () => {
      const offlineMs = 5 * 60 * 1000; // 5 minutes
      const oreEarned = 5000;
      expect(shouldTriggerOfflineReturn(offlineMs, oreEarned)).toBe(false);
    });

    it('returns false when not enough ore earned', () => {
      const offlineMs = 60 * 60 * 1000;
      const oreEarned = 50;
      expect(shouldTriggerOfflineReturn(offlineMs, oreEarned)).toBe(false);
    });
  });

  describe('formatOfflineReturn', () => {
    it('includes formatted ore amount in message', () => {
      const msg = formatOfflineReturn(12500);
      expect(msg).toContain('12');
    });
  });

  describe('shouldTriggerCrateNag', () => {
    it('returns true when too many crates are unopened', () => {
      expect(shouldTriggerCrateNag(5)).toBe(true);
    });

    it('returns false when crate count is below threshold', () => {
      expect(shouldTriggerCrateNag(2)).toBe(false);
    });
  });

  describe('GameNotification structure', () => {
    it('has required properties', () => {
      const notif: GameNotification = {
        id: 'n1',
        type: 'streak_at_risk',
        title: 'Streak at Risk!',
        body: 'Your 7-day streak ends in 2 hours!',
        urgency: 'high',
      };
      expect(notif.id).toBe('n1');
      expect(notif.urgency).toBe('high');
    });
  });
});
