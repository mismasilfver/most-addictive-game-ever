import { describe, it, expect, vi } from 'vitest';
import {
  isTimedEventActive,
  getNextEvent,
  shouldShowFlashSale,
  FLASH_SALE_DURATION,
  RUSH_HOUR_WINDOWS,
  type TimedEvent,
  type FlashSale,
} from './timedEvents';

describe('timed events system', () => {
  describe('isTimedEventActive', () => {
    it('returns true during event window', () => {
      const event: TimedEvent = {
        id: 'test',
        type: 'rush_hour',
        startTime: Date.now() - 1000,
        endTime: Date.now() + 10000,
        bonuses: { productionMultiplier: 2, crateSpawnRate: 1, rewardMultiplier: 1 },
        notificationSent: false,
      };
      expect(isTimedEventActive(event)).toBe(true);
    });

    it('returns false before event starts', () => {
      const event: TimedEvent = {
        id: 'test',
        type: 'rush_hour',
        startTime: Date.now() + 10000,
        endTime: Date.now() + 20000,
        bonuses: { productionMultiplier: 2, crateSpawnRate: 1, rewardMultiplier: 1 },
        notificationSent: false,
      };
      expect(isTimedEventActive(event)).toBe(false);
    });

    it('returns false after event ends', () => {
      const event: TimedEvent = {
        id: 'test',
        type: 'rush_hour',
        startTime: Date.now() - 20000,
        endTime: Date.now() - 1000,
        bonuses: { productionMultiplier: 2, crateSpawnRate: 1, rewardMultiplier: 1 },
        notificationSent: false,
      };
      expect(isTimedEventActive(event)).toBe(false);
    });
  });

  describe('getNextEvent', () => {
    it('returns next upcoming event', () => {
      const now = Date.now();
      const events: TimedEvent[] = [
        {
          id: 'past',
          type: 'rush_hour',
          startTime: now - 10000,
          endTime: now - 1000,
          bonuses: { productionMultiplier: 2, crateSpawnRate: 1, rewardMultiplier: 1 },
          notificationSent: false,
        },
        {
          id: 'future',
          type: 'happy_hour',
          startTime: now + 3600000,
          endTime: now + 7200000,
          bonuses: { productionMultiplier: 2, crateSpawnRate: 1, rewardMultiplier: 1 },
          notificationSent: false,
        },
      ];
      const next = getNextEvent(events);
      expect(next?.id).toBe('future');
    });

    it('returns null if no future events', () => {
      const now = Date.now();
      const events: TimedEvent[] = [
        {
          id: 'past',
          type: 'rush_hour',
          startTime: now - 10000,
          endTime: now - 1000,
          bonuses: { productionMultiplier: 2, crateSpawnRate: 1, rewardMultiplier: 1 },
          notificationSent: false,
        },
      ];
      const next = getNextEvent(events);
      expect(next).toBeNull();
    });
  });

  describe('FLASH_SALE_DURATION', () => {
    it('is 15 minutes', () => {
      expect(FLASH_SALE_DURATION).toBe(15 * 60 * 1000);
    });
  });

  describe('shouldShowFlashSale', () => {
    it('returns true with probability check', () => {
      const playerProfile = {
        lastPurchaseTime: Date.now() - 86400000,
        totalPlayTime: 3600000,
      };
      // Should return boolean (we can't test exact probability)
      const result = shouldShowFlashSale(playerProfile, 0.5);
      expect(typeof result).toBe('boolean');
    });

    it('returns false if recently purchased', () => {
      const playerProfile = {
        lastPurchaseTime: Date.now() - 1000, // Just bought something
        totalPlayTime: 3600000,
      };
      const result = shouldShowFlashSale(playerProfile, 1.0); // 100% chance
      expect(result).toBe(false);
    });
  });

  describe('RUSH_HOUR_WINDOWS', () => {
    it('defines morning rush hour', () => {
      const morning = RUSH_HOUR_WINDOWS.find(w => w.name === 'Morning Rush');
      expect(morning).toBeDefined();
      expect(morning?.startHour).toBe(7);
      expect(morning?.endHour).toBe(9);
    });

    it('defines lunch break', () => {
      const lunch = RUSH_HOUR_WINDOWS.find(w => w.name === 'Lunch Break');
      expect(lunch).toBeDefined();
      expect(lunch?.startHour).toBe(12);
      expect(lunch?.endHour).toBe(13);
    });

    it('defines evening grind', () => {
      const evening = RUSH_HOUR_WINDOWS.find(w => w.name === 'Evening Grind');
      expect(evening).toBeDefined();
      expect(evening?.startHour).toBe(18);
      expect(evening?.endHour).toBe(22);
    });
  });

  describe('FlashSale structure', () => {
    it('has required properties', () => {
      const sale: FlashSale = {
        id: 'flash-1',
        itemId: 'item-1',
        originalCost: 1000,
        saleCost: 750,
        expiresAt: Date.now() + 900000,
        remainingQuantity: 5,
      };

      expect(sale.id).toBe('flash-1');
      expect(sale.originalCost).toBe(1000);
      expect(sale.saleCost).toBe(750);
      expect(sale.remainingQuantity).toBe(5);
    });
  });
});
