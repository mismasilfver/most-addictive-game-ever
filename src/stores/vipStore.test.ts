import { describe, it, expect, beforeEach } from 'vitest';
import { useVIPStore } from './vipStore';

describe('vipStore', () => {
  beforeEach(() => {
    useVIPStore.setState({
      xp: 0,
      level: 0,
      gems: 0,
      ownedItems: [],
    });
  });

  describe('initial state', () => {
    it('starts at level 0', () => {
      expect(useVIPStore.getState().level).toBe(0);
    });

    it('starts with 0 XP', () => {
      expect(useVIPStore.getState().xp).toBe(0);
    });

    it('starts with 0 gems', () => {
      expect(useVIPStore.getState().gems).toBe(0);
    });
  });

  describe('addXP', () => {
    it('increases XP', () => {
      useVIPStore.getState().addXP(1000);
      expect(useVIPStore.getState().xp).toBe(1000);
    });

    it('levels up when XP threshold reached', () => {
      useVIPStore.getState().addXP(500); // level 1 threshold
      expect(useVIPStore.getState().level).toBe(1);
    });

    it('does not exceed max level 10', () => {
      useVIPStore.getState().addXP(9_999_999);
      expect(useVIPStore.getState().level).toBeLessThanOrEqual(10);
    });
  });

  describe('addGems', () => {
    it('increases gem balance', () => {
      useVIPStore.getState().addGems(100);
      expect(useVIPStore.getState().gems).toBe(100);
    });

    it('accumulates gems', () => {
      useVIPStore.getState().addGems(100);
      useVIPStore.getState().addGems(50);
      expect(useVIPStore.getState().gems).toBe(150);
    });
  });

  describe('purchaseItem', () => {
    beforeEach(() => {
      useVIPStore.setState({ xp: 0, level: 0, gems: 500, ownedItems: [] });
    });

    it('deducts gems on purchase', () => {
      const success = useVIPStore.getState().purchaseItem('skip_1h');
      expect(success).toBe(true);
      expect(useVIPStore.getState().gems).toBe(480); // 500 - 20
    });

    it('adds item to ownedItems', () => {
      useVIPStore.getState().purchaseItem('skip_1h');
      expect(useVIPStore.getState().ownedItems).toContain('skip_1h');
    });

    it('returns false when insufficient gems', () => {
      useVIPStore.setState({ xp: 0, level: 0, gems: 5, ownedItems: [] });
      const success = useVIPStore.getState().purchaseItem('skip_1h');
      expect(success).toBe(false);
    });

    it('does not deduct gems on failed purchase', () => {
      useVIPStore.setState({ xp: 0, level: 0, gems: 5, ownedItems: [] });
      useVIPStore.getState().purchaseItem('skip_1h');
      expect(useVIPStore.getState().gems).toBe(5);
    });
  });

  describe('getProductionBonus', () => {
    it('returns 0 at level 0', () => {
      expect(useVIPStore.getState().getProductionBonus()).toBe(0);
    });

    it('returns bonus at level 1+', () => {
      useVIPStore.getState().addXP(500);
      expect(useVIPStore.getState().getProductionBonus()).toBeGreaterThan(0);
    });
  });

  describe('getProgressToNextLevel', () => {
    it('returns 0 at level 0 with no XP', () => {
      expect(useVIPStore.getState().getProgressToNextLevel()).toBe(0);
    });

    it('returns partial progress', () => {
      useVIPStore.getState().addXP(250); // halfway to level 1 (500 XP)
      const progress = useVIPStore.getState().getProgressToNextLevel();
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(100);
    });

    it('returns 100 at max level', () => {
      useVIPStore.getState().addXP(9_999_999);
      expect(useVIPStore.getState().getProgressToNextLevel()).toBe(100);
    });
  });
});
