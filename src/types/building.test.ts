import { describe, it, expect, vi } from 'vitest';
import {
  calculateBuildingCost,
  calculateBuildingProduction,
  generateProceduralBuilding,
  BUILDING_TYPES,
} from './building';

describe('calculateBuildingCost', () => {
  it('returns base cost for first building (count = 0)', () => {
    expect(calculateBuildingCost(10, 0)).toBe(10);
    expect(calculateBuildingCost(100, 0)).toBe(100);
  });

  it('increases cost exponentially with count', () => {
    const baseCost = 10;
    const cost0 = calculateBuildingCost(baseCost, 0);
    const cost1 = calculateBuildingCost(baseCost, 1);
    const cost2 = calculateBuildingCost(baseCost, 2);

    expect(cost0).toBe(10);
    expect(cost1).toBe(Math.floor(10 * 1.15)); // 11
    expect(cost2).toBe(Math.floor(10 * 1.15 * 1.15)); // 13
  });

  it('follows 1.15 scaling factor', () => {
    // Cost should be base * (1.15 ^ count)
    const baseCost = 100;
    const count = 5;
    const expected = Math.floor(baseCost * Math.pow(1.15, count));
    expect(calculateBuildingCost(baseCost, count)).toBe(expected);
  });

  it('floors the result to integer', () => {
    const result = calculateBuildingCost(10, 3);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('calculateBuildingProduction', () => {
  it('returns base production for level 1', () => {
    expect(calculateBuildingProduction(10, 1)).toBe(10);
    expect(calculateBuildingProduction(100, 1)).toBe(100);
  });

  it('scales with level (base * level * 1.05 bonus)', () => {
    // Formula: base * level * 1.05^(level-1)
    // Note: function returns raw float, store handles flooring
    expect(calculateBuildingProduction(10, 2)).toBe(21); // 10 * 2 * 1.05 = 21
    expect(calculateBuildingProduction(10, 5)).toBeCloseTo(60.775, 3); // exact float
  });

  it('applies 5% bonus per level (compounding)', () => {
    // At level 2: base * 2 * 1.05^1 = 21
    expect(calculateBuildingProduction(10, 2)).toBe(10 * 2 * Math.pow(1.05, 1));

    // At level 3: base * 3 * 1.05^2 = 33.075
    expect(calculateBuildingProduction(10, 3)).toBe(10 * 3 * Math.pow(1.05, 2));

    // At level 5: base * 5 * 1.05^4 = 60.7753125
    expect(calculateBuildingProduction(10, 5)).toBe(10 * 5 * Math.pow(1.05, 4));
  });

  it('handles high levels correctly', () => {
    const baseProduction = 1000;
    const level = 50;
    const expected = baseProduction * level * Math.pow(1.05, level - 1);
    // Note: function returns float, flooring happens in store
    expect(calculateBuildingProduction(baseProduction, level)).toBeCloseTo(expected, 0);
  });
});

describe('generateProceduralBuilding', () => {
  it('generates building with correct tier', () => {
    const building = generateProceduralBuilding(10);
    expect(building.tier).toBe(10);
  });

  it('generates unique ID with timestamp', () => {
    const before = Date.now();
    const building = generateProceduralBuilding(5);
    const after = Date.now();

    expect(building.id).toContain('procedural-5-');
    const timestamp = parseInt(building.id.split('-').pop() || '0');
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('generates name with prefix and suffix', () => {
    const building = generateProceduralBuilding(1);
    expect(building.name).toContain(' '); // Has space between prefix and suffix
    expect(building.name.split(' ')).toHaveLength(2);
  });

  it('calculates base production based on tier', () => {
    // tier 9: 4^8 * 10 = 655360
    const building9 = generateProceduralBuilding(9);
    expect(building9.baseProduction).toBe(Math.pow(4, 8) * 10);

    // tier 1-8: 4^(tier-1)
    const building5 = generateProceduralBuilding(5);
    expect(building5.baseProduction).toBe(Math.pow(4, 4)); // 256
  });

  it('calculates base cost based on tier', () => {
    const building = generateProceduralBuilding(5);
    expect(building.baseCost).toBe(Math.pow(4, 4) * 10); // 2560
  });

  it('alternates icons based on tier parity', () => {
    const even = generateProceduralBuilding(2);
    const odd = generateProceduralBuilding(3);

    expect(even.icon).toBe('🔧');
    expect(odd.icon).toBe('⚡');
  });

  it('uses random seedable names', () => {
    const originalRandom = Math.random;
    Math.random = () => 0.5;
    const building1 = generateProceduralBuilding(1);
    const building2 = generateProceduralBuilding(1);
    Math.random = originalRandom;

    // Both should use same random position when seeded
    expect(building1.name).toBe(building2.name);
  });
});

describe('BUILDING_TYPES', () => {
  it('contains 8 predefined buildings', () => {
    expect(BUILDING_TYPES).toHaveLength(8);
  });

  it('has tiers 1-8 in order', () => {
    BUILDING_TYPES.forEach((building, index) => {
      expect(building.tier).toBe(index + 1);
    });
  });

  it('has increasing base costs', () => {
    for (let i = 1; i < BUILDING_TYPES.length; i++) {
      expect(BUILDING_TYPES[i].baseCost).toBeGreaterThan(BUILDING_TYPES[i - 1].baseCost);
    }
  });

  it('has increasing base production', () => {
    for (let i = 1; i < BUILDING_TYPES.length; i++) {
      expect(BUILDING_TYPES[i].baseProduction).toBeGreaterThan(BUILDING_TYPES[i - 1].baseProduction);
    }
  });

  it('all have required properties', () => {
    BUILDING_TYPES.forEach((building) => {
      expect(building.id).toBeDefined();
      expect(building.name).toBeDefined();
      expect(building.icon).toBeDefined();
      expect(building.baseProduction).toBeGreaterThan(0);
      expect(building.baseCost).toBeGreaterThan(0);
    });
  });
});
