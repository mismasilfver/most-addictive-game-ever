/**
 * Gacha/Collection System Types
 * 
 * Implements collectible items with rarity tiers, collection sets,
 * and completion bonuses. Creates completionist impulse—the powerful
 * desire to complete sets regardless of practical utility.
 * 
 * Psychological Principle: Completionism + Scarcity + Variable Rewards
 */

export type CollectibleRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Collectible {
  id: string;
  name: string;
  description: string;
  rarity: CollectibleRarity;
  category: 'blueprint' | 'artifact' | 'medal' | 'skin';
  icon: string;
  setId: string;
  bonus: {
    type: 'production' | 'offline' | 'tap' | 'prestige' | 'gacha';
    value: number; // Percentage bonus (0.05 = 5%)
  };
  owned: boolean;
  duplicates: number; // For duplicate conversion system
  discoveredAt?: number; // Timestamp when first obtained
}

export interface CollectionSet {
  id: string;
  name: string;
  description: string;
  collectibles: string[]; // Collectible IDs
  completionBonus: {
    description: string;
    multiplier: number; // Applied when set is complete
  };
  theme: string; // Visual theme for the set
}

export interface CollectibleRarityConfig {
  tier: CollectibleRarity;
  dropRate: number; // 0-1 probability
  color: string; // Display color
  glowEffect: boolean; // Visual glow when displayed
  bonusMultiplier: number; // Base bonus multiplier for this rarity
}

export const COLLECTIBLE_RARITIES: CollectibleRarityConfig[] = [
  { tier: 'common', dropRate: 0.55, color: '#9CA3AF', glowEffect: false, bonusMultiplier: 1.0 },
  { tier: 'uncommon', dropRate: 0.30, color: '#22C55E', glowEffect: false, bonusMultiplier: 1.5 },
  { tier: 'rare', dropRate: 0.10, color: '#3B82F6', glowEffect: true, bonusMultiplier: 2.0 },
  { tier: 'epic', dropRate: 0.04, color: '#A855F7', glowEffect: true, bonusMultiplier: 3.0 },
  { tier: 'legendary', dropRate: 0.009, color: '#F59E0B', glowEffect: true, bonusMultiplier: 5.0 },
  { tier: 'mythic', dropRate: 0.001, color: '#EF4444', glowEffect: true, bonusMultiplier: 10.0 },
];

/**
 * Predefined collection sets
 */
export const COLLECTION_SETS: Omit<CollectionSet, 'collectibles'>[] = [
  {
    id: 'factory_blueprints',
    name: 'Factory Blueprints',
    description: 'Technical schematics for advanced production',
    theme: '🏭',
    completionBonus: {
      description: 'Complete set: +50% production speed',
      multiplier: 1.5,
    },
  },
  {
    id: 'ancient_artifacts',
    name: 'Ancient Artifacts',
    description: 'Mysterious relics from forgotten civilizations',
    theme: '🏺',
    completionBonus: {
      description: 'Complete set: +100% offline earnings',
      multiplier: 2.0,
    },
  },
  {
    id: 'manager_medals',
    name: 'Manager Medals',
    description: 'Achievements earned by legendary factory managers',
    theme: '🎖️',
    completionBonus: {
      description: 'Complete set: +75% tap power',
      multiplier: 1.75,
    },
  },
  {
    id: 'cosmetic_skins',
    name: 'Factory Skins',
    description: 'Visual customization for your empire',
    theme: '🎨',
    completionBonus: {
      description: 'Complete set: +25% all bonuses',
      multiplier: 1.25,
    },
  },
];

/**
 * Generate a unique collectible ID
 */
export function generateCollectibleId(): string {
  return `collectible-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate completion percentage for a collection set
 */
export function calculateCompletionPercentage(
  ownedCollectibles: Collectible[],
  totalInSet: number
): number {
  if (totalInSet === 0) return 0;
  const owned = ownedCollectibles.filter(c => c.owned).length;
  return Math.round((owned / totalInSet) * 100);
}

/**
 * Roll for a collectible rarity based on drop rates
 */
export function rollCollectibleRarity(): CollectibleRarity {
  const roll = Math.random();
  let cumulative = 0;

  for (const rarity of COLLECTIBLE_RARITIES) {
    cumulative += rarity.dropRate;
    if (roll <= cumulative) {
      return rarity.tier;
    }
  }

  return 'common';
}

/**
 * Calculate total bonus from owned collectibles
 */
export function calculateCollectibleBonus(
  collectibles: Collectible[],
  type: Collectible['bonus']['type']
): number {
  const ownedOfType = collectibles.filter(
    c => c.owned && c.bonus.type === type
  );

  return ownedOfType.reduce((total, collectible) => {
    const rarity = COLLECTIBLE_RARITIES.find(r => r.tier === collectible.rarity);
    const multiplier = rarity?.bonusMultiplier || 1.0;
    return total + (collectible.bonus.value * multiplier);
  }, 0);
}

/**
 * Get completion status for all collection sets
 */
export function getCollectionStatus(
  sets: CollectionSet[],
  collectibles: Collectible[]
): Array<{
  set: CollectionSet;
  ownedCount: number;
  totalCount: number;
  percentage: number;
  isComplete: boolean;
}> {
  return sets.map(set => {
    const setCollectibles = collectibles.filter(c => set.collectibles.includes(c.id));
    const ownedCount = setCollectibles.filter(c => c.owned).length;
    const totalCount = set.collectibles.length;
    const percentage = calculateCompletionPercentage(setCollectibles, totalCount);

    return {
      set,
      ownedCount,
      totalCount,
      percentage,
      isComplete: ownedCount === totalCount,
    };
  });
}

/**
 * Convert duplicate collectibles to "stardust" currency
 */
export function calculateDuplicateValue(collectible: Collectible): number {
  if (collectible.duplicates <= 0) return 0;

  const rarity = COLLECTIBLE_RARITIES.find(r => r.tier === collectible.rarity);
  const baseValue = rarity?.bonusMultiplier || 1.0;

  // Higher rarity = more stardust per duplicate
  // But diminishing returns (logarithmic)
  return Math.floor(baseValue * 10 * Math.log10(collectible.duplicates + 1));
}

/**
 * Generate a collectible based on set and rarity
 */
export function generateCollectible(
  setId: string,
  rarity: CollectibleRarity,
  category: Collectible['category']
): Collectible {
  const names: Record<Collectible['category'], string[]> = {
    blueprint: ['Optimized Conveyor', 'Efficient Smelter', 'Turbo Assembler', 'Quantum Refinery'],
    artifact: ['Crystal Core', 'Ancient Gear', 'Mystic Crystal', 'Eternal Flame'],
    medal: ['Speed Demon', 'Production King', 'Offline Master', 'Tap Champion'],
    skin: ['Golden Factory', 'Neon Glow', 'Retro Style', 'Cyberpunk Theme'],
  };

  const descriptions: Record<Collectible['category'], string[]> = {
    blueprint: ['Increases production efficiency', 'Optimizes resource flow', 'Advanced manufacturing tech', 'Future-grade equipment'],
    artifact: ['Holds ancient power', 'Emits strange energy', 'Whispers of old times', 'Radiates mysterious aura'],
    medal: ['Earned through dedication', 'Proof of mastery', 'Symbol of excellence', 'Mark of achievement'],
    skin: ['Stunning visual appearance', 'Unique aesthetic', 'Rare color scheme', 'Exclusive design'],
  };

  const icons: Record<Collectible['category'], string[]> = {
    blueprint: ['📐', '📋', '🔧', '⚙️'],
    artifact: ['💎', '🏺', '🗿', '🔮'],
    medal: ['🥇', '🥈', '🥉', '🏅'],
    skin: ['🎨', '🖌️', '✨', '🌈'],
  };

  const nameIndex = Math.floor(Math.random() * names[category].length);
  const descIndex = Math.floor(Math.random() * descriptions[category].length);
  const iconIndex = Math.floor(Math.random() * icons[category].length);

  // Determine bonus based on category and rarity
  const baseValues: Record<Collectible['category'], { type: Collectible['bonus']['type']; value: number }> = {
    blueprint: { type: 'production', value: 0.02 }, // +2% production
    artifact: { type: 'offline', value: 0.03 },    // +3% offline
    medal: { type: 'tap', value: 0.05 },            // +5% tap
    skin: { type: 'prestige', value: 0.01 },        // +1% prestige points
  };

  const baseBonus = baseValues[category];

  return {
    id: generateCollectibleId(),
    name: names[category][nameIndex],
    description: descriptions[category][descIndex],
    rarity,
    category,
    icon: icons[category][iconIndex],
    setId,
    bonus: baseBonus,
    owned: false,
    duplicates: 0,
  };
}
