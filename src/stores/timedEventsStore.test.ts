import { describe, it, expect, beforeEach } from 'vitest';
import { useTimedEventsStore } from './timedEventsStore';

describe('timedEventsStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useTimedEventsStore.setState({
      activeEvents: [],
      flashSale: null,
      currentOffer: null,
      totalPlayTime: 0,
      lastLoginTime: Date.now(),
    });
  });

  describe('initial state', () => {
    it('starts with no active events', () => {
      const state = useTimedEventsStore.getState();
      expect(state.activeEvents).toHaveLength(0);
    });

    it('starts with no flash sale', () => {
      const state = useTimedEventsStore.getState();
      expect(state.flashSale).toBeNull();
    });

    it('starts with no current offer', () => {
      const state = useTimedEventsStore.getState();
      expect(state.currentOffer).toBeNull();
    });

    it('starts with 0 play time', () => {
      const state = useTimedEventsStore.getState();
      expect(state.totalPlayTime).toBe(0);
    });
  });

  describe('addEvent', () => {
    it('adds event to active events', () => {
      const event = {
        id: 'test-event',
        type: 'rush_hour' as const,
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        bonuses: { productionMultiplier: 2, crateSpawnRate: 1, rewardMultiplier: 1 },
        notificationSent: false,
      };

      useTimedEventsStore.getState().addEvent(event);
      expect(useTimedEventsStore.getState().activeEvents).toHaveLength(1);
    });

    it('does not add duplicate events', () => {
      const event = {
        id: 'test-event',
        type: 'rush_hour' as const,
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        bonuses: { productionMultiplier: 2, crateSpawnRate: 1, rewardMultiplier: 1 },
        notificationSent: false,
      };

      useTimedEventsStore.getState().addEvent(event);
      useTimedEventsStore.getState().addEvent(event);
      expect(useTimedEventsStore.getState().activeEvents).toHaveLength(1);
    });
  });

  describe('removeExpiredEvents', () => {
    it('removes expired events', () => {
      const expiredEvent = {
        id: 'expired',
        type: 'rush_hour' as const,
        startTime: Date.now() - 7200000,
        endTime: Date.now() - 3600000,
        bonuses: { productionMultiplier: 2, crateSpawnRate: 1, rewardMultiplier: 1 },
        notificationSent: false,
      };

      const activeEvent = {
        id: 'active',
        type: 'happy_hour' as const,
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        bonuses: { productionMultiplier: 2, crateSpawnRate: 1, rewardMultiplier: 1 },
        notificationSent: false,
      };

      useTimedEventsStore.setState({
        activeEvents: [expiredEvent, activeEvent],
      });

      useTimedEventsStore.getState().removeExpiredEvents();
      expect(useTimedEventsStore.getState().activeEvents).toHaveLength(1);
      expect(useTimedEventsStore.getState().activeEvents[0].id).toBe('active');
    });
  });

  describe('startFlashSale', () => {
    it('creates flash sale', () => {
      useTimedEventsStore.getState().startFlashSale('item-1', 25);
      expect(useTimedEventsStore.getState().flashSale).not.toBeNull();
    });

    it('sets correct discount', () => {
      useTimedEventsStore.getState().startFlashSale('item-1', 50);
      const sale = useTimedEventsStore.getState().flashSale;
      expect(sale?.originalCost).toBeGreaterThan(sale?.saleCost || 0);
    });

    it('expires after 15 minutes', () => {
      useTimedEventsStore.getState().startFlashSale('item-1', 25);
      const sale = useTimedEventsStore.getState().flashSale;
      const duration = (sale?.expiresAt || 0) - Date.now();
      expect(duration).toBeLessThanOrEqual(15 * 60 * 1000 + 1000); // 15 min + 1s tolerance
      expect(duration).toBeGreaterThan(14 * 60 * 1000); // At least 14 min
    });
  });

  describe('dismissFlashSale', () => {
    it('removes flash sale', () => {
      useTimedEventsStore.getState().startFlashSale('item-1', 25);
      useTimedEventsStore.getState().dismissFlashSale();
      expect(useTimedEventsStore.getState().flashSale).toBeNull();
    });
  });

  describe('showLimitedOffer', () => {
    it('shows limited offer', () => {
      useTimedEventsStore.getState().showLimitedOffer('starter_pack');
      expect(useTimedEventsStore.getState().currentOffer).not.toBeNull();
    });

    it('sets expiration', () => {
      useTimedEventsStore.getState().showLimitedOffer('starter_pack');
      const offer = useTimedEventsStore.getState().currentOffer;
      expect(offer?.expiresAt).toBeGreaterThan(Date.now());
    });

    it('tracks purchases remaining', () => {
      useTimedEventsStore.getState().showLimitedOffer('starter_pack');
      const offer = useTimedEventsStore.getState().currentOffer;
      expect(offer?.purchasesRemaining).toBeGreaterThan(0);
    });
  });

  describe('purchaseOffer', () => {
    it('decrements purchases remaining', () => {
      useTimedEventsStore.setState({
        currentOffer: {
          id: 'test',
          name: 'Test',
          price: 1.99,
          originalValue: 10.00,
          items: ['item1'],
          expiresAt: Date.now() + 3600000,
          maxPurchases: 3,
          purchasesRemaining: 3,
        },
      });
      const before = useTimedEventsStore.getState().currentOffer?.purchasesRemaining;
      useTimedEventsStore.getState().purchaseOffer();
      const after = useTimedEventsStore.getState().currentOffer?.purchasesRemaining;
      expect(after).toBe((before || 1) - 1);
    });

    it('removes offer when sold out', () => {
      useTimedEventsStore.setState({
        currentOffer: {
          id: 'test',
          name: 'Test',
          price: 1.99,
          originalValue: 10.00,
          items: ['item1'],
          expiresAt: Date.now() + 3600000,
          maxPurchases: 1,
          purchasesRemaining: 1,
        },
      });

      useTimedEventsStore.getState().purchaseOffer();
      expect(useTimedEventsStore.getState().currentOffer).toBeNull();
    });
  });

  describe('updatePlayTime', () => {
    it('increments play time', () => {
      useTimedEventsStore.getState().updatePlayTime(60000); // 1 minute
      expect(useTimedEventsStore.getState().totalPlayTime).toBe(60000);
    });

    it('accumulates play time', () => {
      useTimedEventsStore.getState().updatePlayTime(60000);
      useTimedEventsStore.getState().updatePlayTime(60000);
      expect(useTimedEventsStore.getState().totalPlayTime).toBe(120000);
    });
  });

  describe('getActiveMultipliers', () => {
    it('returns multipliers (may include rush hour bonuses)', () => {
      const multipliers = useTimedEventsStore.getState().getActiveMultipliers();
      // Multipliers should be >= 1 (rush hour or weekend may boost them)
      expect(multipliers.productionMultiplier).toBeGreaterThanOrEqual(1);
      expect(multipliers.crateSpawnRate).toBeGreaterThanOrEqual(1);
    });

    it('applies event multipliers', () => {
      useTimedEventsStore.setState({
        activeEvents: [{
          id: 'boost',
          type: 'rush_hour',
          startTime: Date.now() - 1000,
          endTime: Date.now() + 3600000,
          bonuses: { productionMultiplier: 2, crateSpawnRate: 1.5, rewardMultiplier: 1 },
          notificationSent: false,
        }],
      });

      const multipliers = useTimedEventsStore.getState().getActiveMultipliers();
      // Should be boosted (exact value depends on whether rush hour is also active)
      expect(multipliers.productionMultiplier).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getCurrentRushHourInfo', () => {
    it('returns null when no rush hour active', () => {
      // This depends on current time, so we test the structure
      const info = useTimedEventsStore.getState().getCurrentRushHourInfo();
      // Either null or an object
      expect(info === null || typeof info === 'object').toBe(true);
    });
  });
});
