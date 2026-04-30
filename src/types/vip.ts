/**
 * VIP / Whale Mechanics
 *
 * Status-seeking system that drives engagement and simulated
 * microtransaction behaviour. No real payments processed.
 *
 * Psychological Principle: Status Seeking + Pay-to-Win + Competitive Advantage
 */

export interface VIPBenefits {
  productionBonus: number;        // Additive multiplier (0.1 = +10%)
  offlineEfficiency: number;      // Additive (0 to 1.0)
  exclusiveCrates: boolean;
  autoCollect: boolean;
  noAds: boolean;
}

export interface VIPStatus {
  level: number;      // 0-10
  xp: number;
  benefits: VIPBenefits;
  exclusiveBadge: string;
  nameColor: string;
}

export interface VIPLevelConfig {
  level: number;
  xpRequired: number;
  name: string;
  badge: string;
  nameColor: string;
  benefits: VIPBenefits;
}

export interface PremiumShopItem {
  id: string;
  name: string;
  description: string;
  gemCost: number;
  originalValue: string;
  tag?: 'BEST VALUE' | 'POPULAR' | 'LIMITED';
  category: 'boost' | 'skip' | 'skin' | 'resource';
}

export const VIP_LEVELS: VIPLevelConfig[] = [
  {
    level: 1, xpRequired: 500, name: 'Apprentice', badge: '🔰', nameColor: 'text-gray-300',
    benefits: { productionBonus: 0.05, offlineEfficiency: 0.02, exclusiveCrates: false, autoCollect: false, noAds: false },
  },
  {
    level: 2, xpRequired: 1500, name: 'Worker', badge: '⚙️', nameColor: 'text-green-400',
    benefits: { productionBonus: 0.10, offlineEfficiency: 0.05, exclusiveCrates: false, autoCollect: false, noAds: false },
  },
  {
    level: 3, xpRequired: 3500, name: 'Foreman', badge: '🔧', nameColor: 'text-blue-400',
    benefits: { productionBonus: 0.15, offlineEfficiency: 0.10, exclusiveCrates: false, autoCollect: false, noAds: false },
  },
  {
    level: 4, xpRequired: 7500, name: 'Manager', badge: '📋', nameColor: 'text-blue-300',
    benefits: { productionBonus: 0.20, offlineEfficiency: 0.15, exclusiveCrates: true, autoCollect: false, noAds: false },
  },
  {
    level: 5, xpRequired: 15000, name: 'Director', badge: '🏅', nameColor: 'text-purple-400',
    benefits: { productionBonus: 0.30, offlineEfficiency: 0.20, exclusiveCrates: true, autoCollect: false, noAds: false },
  },
  {
    level: 6, xpRequired: 30000, name: 'Executive', badge: '💼', nameColor: 'text-purple-300',
    benefits: { productionBonus: 0.40, offlineEfficiency: 0.30, exclusiveCrates: true, autoCollect: true, noAds: false },
  },
  {
    level: 7, xpRequired: 60000, name: 'VP', badge: '🌟', nameColor: 'text-yellow-400',
    benefits: { productionBonus: 0.55, offlineEfficiency: 0.45, exclusiveCrates: true, autoCollect: true, noAds: false },
  },
  {
    level: 8, xpRequired: 120000, name: 'CEO', badge: '👑', nameColor: 'text-yellow-300',
    benefits: { productionBonus: 0.70, offlineEfficiency: 0.60, exclusiveCrates: true, autoCollect: true, noAds: true },
  },
  {
    level: 9, xpRequired: 250000, name: 'Tycoon', badge: '💎', nameColor: 'text-cyan-400',
    benefits: { productionBonus: 0.90, offlineEfficiency: 0.80, exclusiveCrates: true, autoCollect: true, noAds: true },
  },
  {
    level: 10, xpRequired: 500000, name: 'Magnate', badge: '🏆', nameColor: 'text-red-400',
    benefits: { productionBonus: 1.0, offlineEfficiency: 1.0, exclusiveCrates: true, autoCollect: true, noAds: true },
  },
];

export const PREMIUM_SHOP_ITEMS: PremiumShopItem[] = [
  { id: 'skip_1h', name: 'Skip 1 Hour', description: 'Instantly collect 1 hour of production', gemCost: 20, originalValue: '$0.99', category: 'skip' },
  { id: 'skip_24h', name: 'Skip 24 Hours', description: 'Instantly collect 24 hours of production', gemCost: 350, originalValue: '$9.99', tag: 'POPULAR', category: 'skip' },
  { id: 'instant_upgrade', name: 'Instant Upgrade', description: 'Instantly max a building to next tier', gemCost: 200, originalValue: '$4.99', category: 'boost' },
  { id: 'production_boost', name: '2x Production (24h)', description: 'Double all production for 24 hours', gemCost: 150, originalValue: '$4.99', tag: 'BEST VALUE', category: 'boost' },
  { id: 'legendary_skin', name: 'Legendary Factory Skin', description: 'Exclusive animated factory skin — Limited Edition', gemCost: 800, originalValue: '$19.99', tag: 'LIMITED', category: 'skin' },
  { id: 'ore_pack_sm', name: 'Ore Pack (Small)', description: '10,000 ore instantly', gemCost: 50, originalValue: '$1.99', category: 'resource' },
  { id: 'ore_pack_lg', name: 'Ore Pack (Large)', description: '100,000 ore instantly', gemCost: 400, originalValue: '$9.99', tag: 'BEST VALUE', category: 'resource' },
  { id: 'auto_collector', name: 'Auto-Collector (7 days)', description: 'Automatically collects all crates for 7 days', gemCost: 250, originalValue: '$5.99', tag: 'POPULAR', category: 'boost' },
];

/**
 * Calculate VIP level from XP total
 */
export function calculateVIPLevel(xp: number): number {
  if (xp === 0) return 0;
  let level = 0;
  for (const config of VIP_LEVELS) {
    if (xp >= config.xpRequired) level = config.level;
    else break;
  }
  return level;
}

/**
 * Get benefits for a given VIP level
 */
export function getVIPBenefits(level: number): VIPBenefits {
  if (level === 0) {
    return { productionBonus: 0, offlineEfficiency: 0, exclusiveCrates: false, autoCollect: false, noAds: false };
  }
  const config = VIP_LEVELS.find(c => c.level === level);
  return config?.benefits ?? VIP_LEVELS[VIP_LEVELS.length - 1]!.benefits;
}

/**
 * Get XP required to reach the next level
 */
export function getXPToNextLevel(currentLevel: number, currentXP: number): number {
  if (currentLevel >= 10) return 0;
  const nextConfig = VIP_LEVELS.find(c => c.level === currentLevel + 1);
  if (!nextConfig) return 0;
  return Math.max(0, nextConfig.xpRequired - currentXP);
}

/**
 * Get the VIP config for a given level
 */
export function getVIPConfig(level: number): VIPLevelConfig | null {
  return VIP_LEVELS.find(c => c.level === level) ?? null;
}

/**
 * Calculate XP earned from a production tick
 */
export function calculateXPGain(oreProduced: number): number {
  return Math.floor(oreProduced / 1000);
}
