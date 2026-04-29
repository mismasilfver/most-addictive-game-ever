/**
 * Gacha/Pull System Types
 * 
 * Implements gacha mechanics with pity system, featured items,
 and time-limited banners. Exploits completionist impulse and
 * gambling psychology.
 * 
 * Psychological Principle: Variable Ratio + Sunk Cost + Scarcity
 */

import type { Collectible, CollectibleRarity } from './collection';

export interface GachaBanner {
  id: string;
  name: string;
  featuredItem: string; // Collectible ID with rate-up
  featuredRate: number; // Increased rate (e.g., 1% instead of 0.5%)
  cost: number; // Premium currency cost
  pityCounter: number; // Current pity count
  expiresAt: number; // Timestamp when banner ends
  imageUrl?: string; // Banner artwork
}

export interface GachaPullResult {
  items: Collectible[];
  pityCounter: number; // Updated pity after pull
  isFeatured: boolean; // Did we get the featured item?
  totalValue: number; // Total "value" of pull (for display)
  pityTriggered?: boolean; // Was pity system used?
}

export interface PitySystem {
  softPityStart: number; // When rates start increasing (e.g., 80)
  hardPity: number; // Guaranteed legendary (e.g., 100)
  carryOver: boolean; // Does pity carry to next banner?
  baseLegendaryRate: number; // 0.009 = 0.9%
  softPityMultiplier: number; // How much rates increase per pull in soft pity
}

/**
 * Pity system configuration
 * Industry standard: Soft pity at 70-80, hard pity at 90-100
 */
export const PITY_SYSTEM: PitySystem = {
  softPityStart: 80,
  hardPity: 100,
  carryOver: true,
  baseLegendaryRate: 0.009, // 0.9% base legendary chance
  softPityMultiplier: 0.06, // +6% per pull after soft pity
};

/**
 * Gacha costs (in premium currency)
 */
export const GACHA_COST = {
  single: 100, // Single pull
  multi: 900,  // 10-pull (10% discount)
};

/**
 * Calculate probability for legendary based on pity counter
 */
export function calculatePityProbability(pityCounter: number): number {
  const { softPityStart, hardPity, baseLegendaryRate, softPityMultiplier } = PITY_SYSTEM;

  // Before soft pity: base rate
  if (pityCounter < softPityStart) {
    return baseLegendaryRate;
  }

  // At hard pity: guaranteed
  if (pityCounter >= hardPity) {
    return 1.0;
  }

  // During soft pity: escalating probability
  const pullsIntoSoftPity = pityCounter - softPityStart;
  const additionalRate = pullsIntoSoftPity * softPityMultiplier;
  return Math.min(baseLegendaryRate + additionalRate, 0.99);
}

/**
 * Check if soft pity should be triggered
 */
export function shouldTriggerSoftPity(pityCounter: number): boolean {
  return pityCounter >= PITY_SYSTEM.softPityStart && pityCounter < PITY_SYSTEM.hardPity;
}

/**
 * Calculate cost for number of pulls
 */
export function calculateGachaCost(pullCount: number): number {
  const multiPulls = Math.floor(pullCount / 10);
  const singlePulls = pullCount % 10;
  return (multiPulls * GACHA_COST.multi) + (singlePulls * GACHA_COST.single);
}

/**
 * Predefined gacha banners (simulated)
 */
export const DEFAULT_BANNERS: Omit<GachaBanner, 'pityCounter' | 'expiresAt'>[] = [
  {
    id: 'standard',
    name: 'Standard Collection',
    featuredItem: 'random', // No specific featured item
    featuredRate: 0,
    cost: GACHA_COST.single,
  },
  {
    id: 'factory_focus',
    name: 'Factory Blueprints',
    featuredItem: 'factory_set',
    featuredRate: 0.02, // 2% featured rate
    cost: GACHA_COST.single,
  },
  {
    id: 'ancient_mysteries',
    name: 'Ancient Mysteries',
    featuredItem: 'artifact_set',
    featuredRate: 0.015, // 1.5% featured rate
    cost: GACHA_COST.single,
  },
];

/**
 * Gacha pull animation stages (for UX)
 */
export type GachaAnimationStage = 
  | 'idle'
  | 'orb_appear'
  | 'orb_glow'
  | 'rarity_reveal'
  | 'item_reveal'
  | 'bonus_items'
  | 'complete';

/**
 * Near-miss tease configuration
 */
export interface NearMissConfig {
  enabled: boolean;
  chance: number; // 0.15 = 15% chance on non-legendary
  teaseDuration: number; // ms to show legendary glow
  message: string;
}

export const NEAR_MISS_GACHA: NearMissConfig = {
  enabled: true,
  chance: 0.15,
  teaseDuration: 1500,
  message: "SO CLOSE! The legendary item was in the next pull!",
};

/**
 * Pull history entry
 */
export interface PullHistoryEntry {
  timestamp: number;
  bannerId: string;
  itemId: string;
  rarity: CollectibleRarity;
  wasFeatured: boolean;
  pityAtPull: number;
}

/**
 * Gacha statistics
 */
export interface GachaStats {
  totalPulls: number;
  legendaryPulls: number;
  featuredPulls: number;
  averagePity: number;
  stardustEarned: number;
  stardustSpent: number;
  pullHistory: PullHistoryEntry[];
}

export const defaultGachaStats: GachaStats = {
  totalPulls: 0,
  legendaryPulls: 0,
  featuredPulls: 0,
  averagePity: 0,
  stardustEarned: 0,
  stardustSpent: 0,
  pullHistory: [],
};

/**
 * Stardust shop items (premium currency for gacha)
 */
export interface StardustShopItem {
  id: string;
  name: string;
  cost: number; // Stardust cost
  description: string;
  icon: string;
  effect: {
    type: 'pull_ticket' | 'specific_item' | 'pity_reset';
    value: string | number;
  };
}

export const STARDUST_SHOP: StardustShopItem[] = [
  {
    id: 'single_ticket',
    name: 'Gacha Ticket',
    cost: 90, // Slightly cheaper than direct pull
    description: 'One free gacha pull',
    icon: '🎫',
    effect: { type: 'pull_ticket', value: 1 },
  },
  {
    id: 'multi_ticket',
    name: '10-Pull Ticket',
    cost: 800, // Better value
    description: 'Ten gacha pulls at once',
    icon: '🎟️',
    effect: { type: 'pull_ticket', value: 10 },
  },
  {
    id: 'pity_blessing',
    name: 'Pity Blessing',
    cost: 500,
    description: 'Reset pity counter to 50 (emergency use)',
    icon: '✨',
    effect: { type: 'pity_reset', value: 50 },
  },
];
