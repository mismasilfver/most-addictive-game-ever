import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from './gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameStore.setState({
      resources: {
        ore: { type: 'ore', amount: 0, totalEarned: 0, totalSpent: 0 },
        alloy: { type: 'alloy', amount: 0, totalEarned: 0, totalSpent: 0 },
        component: { type: 'component', amount: 0, totalEarned: 0, totalSpent: 0 },
        module: { type: 'module', amount: 0, totalEarned: 0, totalSpent: 0 },
      },
      buildings: [],
      totalProduction: 0,
      lastTick: Date.now(),
      offlineProgress: 0,
      unlockedTiers: 1,
      currentZone: 0,
    });
  });

  describe('initial state', () => {
    it('starts with zero resources', () => {
      const state = useGameStore.getState();
      expect(state.resources.ore.amount).toBe(0);
      expect(state.resources.alloy.amount).toBe(0);
    });

    it('starts with empty buildings array', () => {
      const state = useGameStore.getState();
      expect(state.buildings).toHaveLength(0);
    });

    it('starts with zero production', () => {
      const state = useGameStore.getState();
      expect(state.totalProduction).toBe(0);
    });

    it('starts at zone 0 with tier 1 unlocked', () => {
      const state = useGameStore.getState();
      expect(state.currentZone).toBe(0);
      expect(state.unlockedTiers).toBe(1);
    });
  });

  describe('addResources', () => {
    it('increases resource amount', () => {
      useGameStore.getState().addResources('ore', 100);
      expect(useGameStore.getState().resources.ore.amount).toBe(100);
    });

    it('increases totalEarned', () => {
      useGameStore.getState().addResources('ore', 50);
      expect(useGameStore.getState().resources.ore.totalEarned).toBe(50);
    });

    it('accumulates multiple additions', () => {
      useGameStore.getState().addResources('ore', 10);
      useGameStore.getState().addResources('ore', 20);
      expect(useGameStore.getState().resources.ore.amount).toBe(30);
    });
  });

  describe('spendResources', () => {
    it('returns false if not enough resources', () => {
      const result = useGameStore.getState().spendResources('ore', 100);
      expect(result).toBe(false);
    });

    it('returns true and deducts resources when affordable', () => {
      useGameStore.getState().addResources('ore', 100);
      const result = useGameStore.getState().spendResources('ore', 50);
      expect(result).toBe(true);
      expect(useGameStore.getState().resources.ore.amount).toBe(50);
    });

    it('increases totalSpent', () => {
      useGameStore.getState().addResources('ore', 100);
      useGameStore.getState().spendResources('ore', 30);
      expect(useGameStore.getState().resources.ore.totalSpent).toBe(30);
    });
  });

  describe('tick', () => {
    it('increases ore based on production rate', () => {
      // Manually set up a building for production
      const smelter = {
        id: 'smelter',
        name: 'Manual Smelter',
        tier: 1,
        baseProduction: 1,
        baseCost: 10,
        count: 1,
        level: 1,
        icon: '🔨',
      };
      
      useGameStore.setState({
        buildings: [smelter],
        totalProduction: 1,
      });
      
      useGameStore.getState().tick(1); // 1 second tick
      expect(useGameStore.getState().resources.ore.amount).toBe(1);
    });

    it('scales with delta time', () => {
      useGameStore.setState({
        buildings: [{
          id: 'smelter',
          name: 'Manual Smelter',
          tier: 1,
          baseProduction: 1,
          baseCost: 10,
          count: 1,
          level: 1,
          icon: '🔨',
        }],
        totalProduction: 1,
      });
      
      useGameStore.getState().tick(5); // 5 second tick
      expect(useGameStore.getState().resources.ore.amount).toBe(5);
    });
  });

  describe('getBuildingCost', () => {
    it('returns base cost when no buildings owned', () => {
      const smelterType = {
        id: 'smelter',
        name: 'Manual Smelter',
        tier: 1,
        baseProduction: 1,
        baseCost: 10,
        icon: '🔨',
      };
      
      const cost = useGameStore.getState().getBuildingCost(smelterType);
      expect(cost).toBe(10); // base cost
    });

    it('increases cost exponentially with count', () => {
      const smelterType = {
        id: 'smelter',
        name: 'Manual Smelter',
        tier: 1,
        baseProduction: 1,
        baseCost: 10,
        icon: '🔨',
      };
      
      // Simulate owning 5 smelters
      useGameStore.setState({
        buildings: [{
          id: 'smelter',
          name: 'Manual Smelter',
          tier: 1,
          baseProduction: 1,
          baseCost: 10,
          count: 5,
          level: 1,
          icon: '🔨',
        }],
      });
      
      const cost = useGameStore.getState().getBuildingCost(smelterType);
      // Cost formula: base * 1.15^count = 10 * 1.15^5 ≈ 20
      expect(cost).toBeGreaterThan(10);
    });
  });

  describe('buyBuilding', () => {
    it('does nothing if cannot afford', () => {
      const smelterType = {
        id: 'smelter',
        name: 'Manual Smelter',
        tier: 1,
        baseProduction: 1,
        baseCost: 10,
        icon: '🔨',
      };
      
      useGameStore.getState().buyBuilding(smelterType);
      expect(useGameStore.getState().buildings).toHaveLength(0);
    });

    it('adds new building when affordable', () => {
      const smelterType = {
        id: 'smelter',
        name: 'Manual Smelter',
        tier: 1,
        baseProduction: 1,
        baseCost: 10,
        icon: '🔨',
      };
      
      useGameStore.getState().addResources('ore', 100);
      useGameStore.getState().buyBuilding(smelterType);
      
      expect(useGameStore.getState().buildings).toHaveLength(1);
      expect(useGameStore.getState().buildings[0].id).toBe('smelter');
    });

    it('increments count for existing building', () => {
      const smelterType = {
        id: 'smelter',
        name: 'Manual Smelter',
        tier: 1,
        baseProduction: 1,
        baseCost: 10,
        icon: '🔨',
      };
      
      useGameStore.getState().addResources('ore', 200);
      useGameStore.getState().buyBuilding(smelterType);
      useGameStore.getState().buyBuilding(smelterType);
      
      expect(useGameStore.getState().buildings).toHaveLength(1);
      expect(useGameStore.getState().buildings[0].count).toBe(2);
    });

    it('deducts ore cost', () => {
      const smelterType = {
        id: 'smelter',
        name: 'Manual Smelter',
        tier: 1,
        baseProduction: 1,
        baseCost: 10,
        icon: '🔨',
      };
      
      useGameStore.getState().addResources('ore', 100);
      useGameStore.getState().buyBuilding(smelterType);
      
      expect(useGameStore.getState().resources.ore.amount).toBe(90);
    });

    it('unlocks next tier', () => {
      const smelterType = {
        id: 'smelter',
        name: 'Manual Smelter',
        tier: 1,
        baseProduction: 1,
        baseCost: 10,
        icon: '🔨',
      };
      
      useGameStore.getState().addResources('ore', 100);
      useGameStore.getState().buyBuilding(smelterType);
      
      expect(useGameStore.getState().unlockedTiers).toBe(2);
    });

    it('updates total production', () => {
      const smelterType = {
        id: 'smelter',
        name: 'Manual Smelter',
        tier: 1,
        baseProduction: 1,
        baseCost: 10,
        icon: '🔨',
      };
      
      useGameStore.getState().addResources('ore', 100);
      useGameStore.getState().buyBuilding(smelterType);
      
      expect(useGameStore.getState().totalProduction).toBeGreaterThan(0);
    });
  });

  describe('upgradeBuilding', () => {
    it('increases building level', () => {
      useGameStore.setState({
        buildings: [{
          id: 'smelter',
          name: 'Manual Smelter',
          tier: 1,
          baseProduction: 1,
          baseCost: 10,
          count: 1,
          level: 1,
          icon: '🔨',
        }],
        resources: {
          ore: { type: 'ore', amount: 1000, totalEarned: 1000, totalSpent: 0 },
          alloy: { type: 'alloy', amount: 0, totalEarned: 0, totalSpent: 0 },
          component: { type: 'component', amount: 0, totalEarned: 0, totalSpent: 0 },
          module: { type: 'module', amount: 0, totalEarned: 0, totalSpent: 0 },
        },
      });
      
      useGameStore.getState().upgradeBuilding('smelter');
      expect(useGameStore.getState().buildings[0].level).toBe(2);
    });

    it('deducts upgrade cost', () => {
      useGameStore.setState({
        buildings: [{
          id: 'smelter',
          name: 'Manual Smelter',
          tier: 1,
          baseProduction: 1,
          baseCost: 10,
          count: 1,
          level: 1,
          icon: '🔨',
        }],
        resources: {
          ore: { type: 'ore', amount: 100, totalEarned: 100, totalSpent: 0 },
          alloy: { type: 'alloy', amount: 0, totalEarned: 0, totalSpent: 0 },
          component: { type: 'component', amount: 0, totalEarned: 0, totalSpent: 0 },
          module: { type: 'module', amount: 0, totalEarned: 0, totalSpent: 0 },
        },
      });
      
      const beforeOre = useGameStore.getState().resources.ore.amount;
      useGameStore.getState().upgradeBuilding('smelter');
      const afterOre = useGameStore.getState().resources.ore.amount;
      
      expect(afterOre).toBeLessThan(beforeOre);
    });
  });

  describe('getProductionRate', () => {
    it('calculates production for a building', () => {
      const building = {
        id: 'smelter',
        name: 'Manual Smelter',
        tier: 1,
        baseProduction: 1,
        baseCost: 10,
        count: 2,
        level: 1,
        icon: '🔨',
      };
      
      const rate = useGameStore.getState().getProductionRate(building);
      // baseProduction * level * 1.05^(level-1) * count
      // 1 * 1 * 1 * 2 = 2
      expect(rate).toBe(2);
    });

    it('scales with level and count', () => {
      const building = {
        id: 'smelter',
        name: 'Manual Smelter',
        tier: 1,
        baseProduction: 10,
        baseCost: 10,
        count: 3,
        level: 2,
        icon: '🔨',
      };
      
      const rate = useGameStore.getState().getProductionRate(building);
      // 10 * 2 * 1.05^1 * 3 = 21 * 3 = 63
      expect(rate).toBeCloseTo(63, 0);
    });
  });

  describe('setZone', () => {
    it('updates current zone', () => {
      useGameStore.getState().setZone(3);
      expect(useGameStore.getState().currentZone).toBe(3);
    });
  });
});
