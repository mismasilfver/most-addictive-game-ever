export type RewardTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface RewardTierConfig {
  tier: RewardTier;
  chance: number;
  multiplier: number;
  color: string;
  glowColor: string;
}

export const REWARD_TIERS: RewardTierConfig[] = [
  { tier: 'common', chance: 0.60, multiplier: 1, color: 'bg-tier-common', glowColor: 'shadow-gray-500/50' },
  { tier: 'uncommon', chance: 0.25, multiplier: 5, color: 'bg-tier-uncommon', glowColor: 'shadow-green-500/50' },
  { tier: 'rare', chance: 0.10, multiplier: 25, color: 'bg-tier-rare', glowColor: 'shadow-blue-500/50' },
  { tier: 'epic', chance: 0.04, multiplier: 100, color: 'bg-tier-epic', glowColor: 'shadow-purple-500/50' },
  { tier: 'legendary', chance: 0.01, multiplier: 500, color: 'bg-tier-legendary', glowColor: 'shadow-yellow-500/50' },
];

export interface MysteryCrate {
  id: string;
  spawnTime: number;
  openTime: number | null;
  tier: RewardTier;
  baseReward: number;
  isNearMiss: boolean;
}

export interface DailyReward {
  day: number;
  reward: number;
  claimed: boolean;
}

export const DAILY_REWARDS: number[] = [50, 100, 150, 250, 400, 600, 1000];

export function rollRewardTier(): RewardTierConfig {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const tier of REWARD_TIERS) {
    cumulative += tier.chance;
    if (roll <= cumulative) {
      return tier;
    }
  }
  
  return REWARD_TIERS[0];
}

export function calculateCrateSpawnTime(): number {
  // Poisson-like distribution: 2-5 minutes
  const minTime = 2 * 60 * 1000;
  const maxTime = 5 * 60 * 1000;
  return Date.now() + minTime + Math.random() * (maxTime - minTime);
}
