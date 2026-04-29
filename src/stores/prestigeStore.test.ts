import { describe, it, expect, beforeEach } from 'vitest';
import { usePrestigeStore } from './prestigeStore';

describe('prestigeStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    usePrestigeStore.setState({
      ascension: {
        level: 0,
        permanentBonuses: {
          productionMultiplier: 1.0,
          offlineEfficiency: 0.5,
          tapBonusMultiplier: 1.0,
        },
        ascensionPoints: 0,
        unlocks: [],
      },
      previousMaxOre: 0,
      totalAscensions: 0,
      ascensionShopPurchases: {},
    });
  });

  describe('initial state', () => {
    it('starts at ascension level 0', () => {
      const state = usePrestigeStore.getState();
      expect(state.ascension.level).toBe(0);
    });

    it('starts with base multipliers', () => {
      const state = usePrestigeStore.getState();
      expect(state.ascension.permanentBonuses.productionMultiplier).toBe(1.0);
      expect(state.ascension.permanentBonuses.offlineEfficiency).toBe(0.5);
      expect(state.ascension.permanentBonuses.tapBonusMultiplier).toBe(1.0);
    });

    it('starts with 0 ascension points', () => {
      const state = usePrestigeStore.getState();
      expect(state.ascension.ascensionPoints).toBe(0);
    });

    it('has no previous max ore', () => {
      const state = usePrestigeStore.getState();
      expect(state.previousMaxOre).toBe(0);
    });
  });

  describe('canAscend', () => {
    it('returns false when total ore is below threshold', () => {
      const canAscend = usePrestigeStore.getState().canAscend(5000, 5);
      expect(canAscend).toBe(false);
    });

    it('returns true when total ore is above threshold', () => {
      const canAscend = usePrestigeStore.getState().canAscend(15000, 5);
      expect(canAscend).toBe(true);
    });

    it('returns false when no buildings owned', () => {
      const canAscend = usePrestigeStore.getState().canAscend(15000, 0);
      expect(canAscend).toBe(false);
    });
  });

  describe('ascend', () => {
    it('increases ascension level', () => {
      usePrestigeStore.getState().ascend(50000, 10, 60);
      expect(usePrestigeStore.getState().ascension.level).toBe(1);
    });

    it('increases production multiplier', () => {
      const before = usePrestigeStore.getState().ascension.permanentBonuses.productionMultiplier;
      usePrestigeStore.getState().ascend(50000, 10, 60);
      const after = usePrestigeStore.getState().ascension.permanentBonuses.productionMultiplier;
      expect(after).toBeGreaterThan(before);
    });

    it('awards ascension points', () => {
      usePrestigeStore.getState().ascend(50000, 10, 60);
      expect(usePrestigeStore.getState().ascension.ascensionPoints).toBeGreaterThan(0);
    });

    it('tracks total ascensions', () => {
      usePrestigeStore.getState().ascend(50000, 10, 60);
      usePrestigeStore.getState().ascend(100000, 15, 120);
      expect(usePrestigeStore.getState().totalAscensions).toBe(2);
    });

    it('updates previousMaxOre', () => {
      usePrestigeStore.getState().ascend(50000, 10, 60);
      expect(usePrestigeStore.getState().previousMaxOre).toBe(50000);
    });
  });

  describe('getPrestigeReadiness', () => {
    it('returns 0 when current ore is 0', () => {
      const readiness = usePrestigeStore.getState().getPrestigeReadiness(0);
      expect(readiness).toBe(0);
    });

    it('returns percentage for first ascension', () => {
      const readiness = usePrestigeStore.getState().getPrestigeReadiness(25000); // Half of 50k recommended
      expect(readiness).toBeGreaterThan(0);
      expect(readiness).toBeLessThan(1);
    });

    it('returns 1.0 at optimal prestige point', () => {
      // First ascension - at recommended threshold
      const readiness = usePrestigeStore.getState().getPrestigeReadiness(50000);
      expect(readiness).toBe(1);
    });
  });

  describe('ascension shop', () => {
    it('can purchase items with ascension points', () => {
      // Set up: have ascended and have points
      usePrestigeStore.setState({
        ascension: {
          level: 1,
          permanentBonuses: {
            productionMultiplier: 1.1,
            offlineEfficiency: 0.55,
            tapBonusMultiplier: 1.25,
          },
          ascensionPoints: 100,
          unlocks: [],
        },
      });

      const result = usePrestigeStore.getState().purchaseShopItem('permanent_production_1');
      expect(result).toBe(true);
      expect(usePrestigeStore.getState().ascension.ascensionPoints).toBe(50); // 100 - 50
    });

    it('cannot purchase without enough points', () => {
      usePrestigeStore.setState({
        ascension: {
          level: 1,
          permanentBonuses: {
            productionMultiplier: 1.1,
            offlineEfficiency: 0.55,
            tapBonusMultiplier: 1.25,
          },
          ascensionPoints: 30, // Not enough for any item
          unlocks: [],
        },
      });

      const result = usePrestigeStore.getState().purchaseShopItem('permanent_production_1');
      expect(result).toBe(false);
    });

    it('cannot purchase same item beyond max', () => {
      usePrestigeStore.setState({
        ascension: {
          level: 1,
          permanentBonuses: {
            productionMultiplier: 1.1,
            offlineEfficiency: 0.55,
            tapBonusMultiplier: 1.25,
          },
          ascensionPoints: 1000,
          unlocks: [],
        },
        ascensionShopPurchases: { permanent_production_1: 10 }, // Maxed out
      });

      const result = usePrestigeStore.getState().purchaseShopItem('permanent_production_1');
      expect(result).toBe(false);
    });

    it('applies permanent bonus on purchase', () => {
      usePrestigeStore.setState({
        ascension: {
          level: 1,
          permanentBonuses: {
            productionMultiplier: 1.1,
            offlineEfficiency: 0.55,
            tapBonusMultiplier: 1.25,
          },
          ascensionPoints: 100,
          unlocks: [],
        },
      });

      const beforeMultiplier = usePrestigeStore.getState().ascension.permanentBonuses.productionMultiplier;
      usePrestigeStore.getState().purchaseShopItem('permanent_production_1');
      const afterMultiplier = usePrestigeStore.getState().ascension.permanentBonuses.productionMultiplier;
      
      expect(afterMultiplier).toBeGreaterThan(beforeMultiplier);
    });
  });

  describe('multiplier getters', () => {
    it('returns correct production multiplier', () => {
      usePrestigeStore.setState({
        ascension: {
          level: 5,
          permanentBonuses: {
            productionMultiplier: 1.5,
            offlineEfficiency: 0.75,
            tapBonusMultiplier: 2.25,
          },
          ascensionPoints: 0,
          unlocks: [],
        },
      });

      const multiplier = usePrestigeStore.getState().getProductionMultiplier();
      expect(multiplier).toBe(1.5);
    });

    it('returns correct offline efficiency', () => {
      usePrestigeStore.setState({
        ascension: {
          level: 5,
          permanentBonuses: {
            productionMultiplier: 1.5,
            offlineEfficiency: 0.75,
            tapBonusMultiplier: 2.25,
          },
          ascensionPoints: 0,
          unlocks: [],
        },
      });

      const efficiency = usePrestigeStore.getState().getOfflineEfficiency();
      expect(efficiency).toBe(0.75);
    });
  });
});
