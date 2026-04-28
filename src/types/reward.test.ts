import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  rollRewardTier,
  calculateCrateSpawnTime,
  REWARD_TIERS,
  DAILY_REWARDS,
} from './reward';

describe('REWARD_TIERS', () => {
  it('has 5 tiers in order', () => {
    expect(REWARD_TIERS).toHaveLength(5);
    expect(REWARD_TIERS[0].tier).toBe('common');
    expect(REWARD_TIERS[1].tier).toBe('uncommon');
    expect(REWARD_TIERS[2].tier).toBe('rare');
    expect(REWARD_TIERS[3].tier).toBe('epic');
    expect(REWARD_TIERS[4].tier).toBe('legendary');
  });

  it('chances sum to 1.0 (100%)', () => {
    const totalChance = REWARD_TIERS.reduce((sum, tier) => sum + tier.chance, 0);
    expect(totalChance).toBeCloseTo(1.0, 10);
  });

  it('multipliers increase with rarity', () => {
    expect(REWARD_TIERS[0].multiplier).toBe(1);    // common
    expect(REWARD_TIERS[1].multiplier).toBe(5);    // uncommon
    expect(REWARD_TIERS[2].multiplier).toBe(25);   // rare
    expect(REWARD_TIERS[3].multiplier).toBe(100);   // epic
    expect(REWARD_TIERS[4].multiplier).toBe(500);   // legendary
  });

  it('has color classes for each tier', () => {
    REWARD_TIERS.forEach((tier) => {
      expect(tier.color).toBeDefined();
      expect(tier.glowColor).toBeDefined();
    });
  });
});

describe('rollRewardTier', () => {
  let mathRandomSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    if (mathRandomSpy) mathRandomSpy.mockRestore();
  });

  it('returns common tier when roll is 0', () => {
    mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = rollRewardTier();
    expect(result.tier).toBe('common');
  });

  it('returns common tier for rolls <= 0.60', () => {
    mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.59);
    const result = rollRewardTier();
    expect(result.tier).toBe('common');
  });

  it('returns uncommon tier for rolls > 0.60 and <= 0.85', () => {
    mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.61);
    const result = rollRewardTier();
    expect(result.tier).toBe('uncommon');

    mathRandomSpy.mockReturnValue(0.85);
    const result2 = rollRewardTier();
    expect(result2.tier).toBe('uncommon');
  });

  it('returns rare tier for rolls > 0.85 and <= 0.95', () => {
    mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.86);
    const result = rollRewardTier();
    expect(result.tier).toBe('rare');

    mathRandomSpy.mockReturnValue(0.95);
    const result2 = rollRewardTier();
    expect(result2.tier).toBe('rare');
  });

  it('returns epic tier for rolls > 0.95 and <= 0.99', () => {
    mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.96);
    const result = rollRewardTier();
    expect(result.tier).toBe('epic');

    mathRandomSpy.mockReturnValue(0.99);
    const result2 = rollRewardTier();
    expect(result2.tier).toBe('epic');
  });

  it('returns legendary tier for rolls > 0.99', () => {
    mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.991);
    const result = rollRewardTier();
    expect(result.tier).toBe('legendary');

    mathRandomSpy.mockReturnValue(0.9999);
    const result2 = rollRewardTier();
    expect(result2.tier).toBe('legendary');
  });

  it('distributes approximately according to probabilities (statistical test)', () => {
    const iterations = 10000;
    const counts: Record<string, number> = {};

    for (let i = 0; i < iterations; i++) {
      const result = rollRewardTier();
      counts[result.tier] = (counts[result.tier] || 0) + 1;
    }

    // Check approximate distribution (within 2% for common, 1% for others)
    const commonRate = counts['common'] / iterations;
    expect(commonRate).toBeGreaterThan(0.58);
    expect(commonRate).toBeLessThan(0.62);

    const legendaryRate = counts['legendary'] / iterations;
    expect(legendaryRate).toBeGreaterThan(0.005);
    expect(legendaryRate).toBeLessThan(0.015);
  });
});

describe('calculateCrateSpawnTime', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('returns time between 2-5 minutes from now', () => {
    // 2 minutes = 120000ms, 5 minutes = 300000ms
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const minTime = calculateCrateSpawnTime();
    expect(minTime).toBe(1000000 + 120000); // now + 2 min

    vi.spyOn(Math, 'random').mockReturnValue(1);
    const maxTime = calculateCrateSpawnTime();
    expect(maxTime).toBe(1000000 + 300000); // now + 5 min
  });

  it('varies based on random value', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const spawnTime = calculateCrateSpawnTime();
    const offset = spawnTime - 1000000;

    // Should be halfway between 2 and 5 minutes (210000ms)
    expect(offset).toBeGreaterThanOrEqual(120000);
    expect(offset).toBeLessThanOrEqual(300000);
    expect(offset).toBe(120000 + 0.5 * (300000 - 120000));
  });

  it('returns timestamps in the future', () => {
    const spawnTime = calculateCrateSpawnTime();
    expect(spawnTime).toBeGreaterThan(Date.now());
  });
});

describe('DAILY_REWARDS', () => {
  it('has 7 days of rewards', () => {
    expect(DAILY_REWARDS).toHaveLength(7);
  });

  it('rewards increase each day', () => {
    for (let i = 1; i < DAILY_REWARDS.length; i++) {
      expect(DAILY_REWARDS[i]).toBeGreaterThan(DAILY_REWARDS[i - 1]);
    }
  });

  it('day 7 has largest reward (1000)', () => {
    expect(DAILY_REWARDS[6]).toBe(1000);
  });

  it('day 1 has smallest reward (50)', () => {
    expect(DAILY_REWARDS[0]).toBe(50);
  });
});
