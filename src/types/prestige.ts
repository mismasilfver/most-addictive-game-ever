/**
 * Prestige/Ascension System Types
 * 
 * Implements the "prestige" mechanic - resetting progress for permanent bonuses.
 * This creates an additional gameplay loop that keeps players engaged indefinitely.
 * 
 * Psychological Principle: Sunk Cost Fallacy + Renewed Progression High
 * When players reset, they lose their current progress BUT gain permanent multipliers
 * that make the next run faster. This creates a compulsion to keep playing through
 * multiple cycles, each time reaching further than before.
 */

export interface Ascension {
  level: number;           // How many times player has ascended
  permanentBonuses: {
    productionMultiplier: number;  // +10% per ascension (compounds)
    offlineEfficiency: number;     // +5% per ascension (max 100%)
    tapBonusMultiplier: number;    // +25% per ascension
  };
  ascensionPoints: number; // Currency earned on reset, spent on permanent upgrades
  unlocks: string[];       // New features unlocked (prestige shop, automation, etc.)
}

export interface AscensionReward {
  id: string;
  name: string;
  cost: number;           // Ascension points cost
  description: string;
  icon: string;
  maxPurchases: number;   // Limit to prevent infinite scaling
  currentPurchases: number;
  apply: (state: GameState) => GameState;
}

// Mock GameState for type definition
interface GameState {
  resources: {
    ore: { amount: number; totalEarned: number };
  };
  buildings: Array<{ count: number }>;
  ascension?: Ascension;
}

/**
 * Prestige thresholds - when should player consider resetting?
 */
export const PRESTIGE_THRESHOLDS = {
  // Minimum ore to unlock first ascension
  minOreFirst: 10000,
  // Recommended ore for optimal first ascension (logarithmic sweet spot)
  recommendedFirst: 50000,
  // Each subsequent ascension requires this multiplier more
  scalingFactor: 4,
  // Soft cap - show "optimal prestige" warning at this % of previous max
  softCapPercentage: 0.8,
};

/**
 * Calculate ascension points earned on reset
 * Uses logarithmic scaling to prevent exponential growth
 */
export function calculateAscensionPoints(
  totalOreEarned: number,
  buildingCount: number,
  playTimeMinutes: number
): number {
  if (totalOreEarned < PRESTIGE_THRESHOLDS.minOreFirst) {
    return 0;
  }

  // Base points from total ore earned (logarithmic)
  const orePoints = Math.floor(Math.log10(totalOreEarned) * 10);

  // Bonus from building diversity
  const buildingPoints = buildingCount * 5;

  // Bonus from play time (encourages longer sessions before reset)
  const timePoints = Math.floor(Math.log10(playTimeMinutes + 1) * 2);

  return orePoints + buildingPoints + timePoints;
}

/**
 * Calculate production multiplier from ascension level
 * +10% per ascension level
 */
export function calculatePrestigeMultiplier(ascensionLevel: number): number {
  // Base 1.0 + 10% per level
  const multiplier = 1.0 + (ascensionLevel * 0.1);
  // Cap at 10x multiplier (90 ascensions)
  return Math.min(multiplier, 10.0);
}

/**
 * Calculate offline efficiency bonus from ascension level
 * +5% per ascension, max 100%
 */
export function calculateOfflineEfficiency(ascensionLevel: number): number {
  const baseEfficiency = 0.5; // 50% default
  const bonus = ascensionLevel * 0.05; // +5% per level
  return Math.min(baseEfficiency + bonus, 1.0); // Cap at 100%
}

/**
 * Calculate tap bonus multiplier from ascension level
 * +25% per ascension
 */
export function calculateTapMultiplier(ascensionLevel: number): number {
  return 1.0 + (ascensionLevel * 0.25);
}

/**
 * Check if player is eligible for first ascension
 */
export function canAscend(totalOreEarned: number): boolean {
  return totalOreEarned >= PRESTIGE_THRESHOLDS.minOreFirst;
}

/**
 * Check if player is at "optimal" prestige point (80% of soft cap)
 * Returns percentage 0-1, where 1.0 means at soft cap
 */
export function getPrestigeReadiness(
  currentOre: number,
  previousMaxOre: number
): number {
  if (previousMaxOre === 0) {
    // First run - use recommended threshold
    return Math.min(currentOre / PRESTIGE_THRESHOLDS.recommendedFirst, 1.0);
  }
  // Subsequent runs - compare to previous max
  return Math.min(currentOre / (previousMaxOre * PRESTIGE_THRESHOLDS.scalingFactor), 1.0);
}

/**
 * Default ascension state for new players
 */
export const defaultAscension: Ascension = {
  level: 0,
  permanentBonuses: {
    productionMultiplier: 1.0,
    offlineEfficiency: 0.5,
    tapBonusMultiplier: 1.0,
  },
  ascensionPoints: 0,
  unlocks: [],
};

/**
 * Ascension shop items - permanent upgrades purchased with ascension points
 */
export const ASCENSION_SHOP_ITEMS: Omit<AscensionReward, 'currentPurchases'>[] = [
  {
    id: 'permanent_production_1',
    name: 'Eternal Furnace',
    cost: 50,
    description: 'Permanently increase production by 5%',
    icon: '🔥',
    maxPurchases: 10,
    apply: (state) => ({
      ...state,
      ascension: {
        ...state.ascension!,
        permanentBonuses: {
          ...state.ascension!.permanentBonuses,
          productionMultiplier: state.ascension!.permanentBonuses.productionMultiplier + 0.05,
        },
      },
    }),
  },
  {
    id: 'better_offline_1',
    name: 'Auto-Manager',
    cost: 75,
    description: 'Permanently increase offline efficiency by 5%',
    icon: '🤖',
    maxPurchases: 10,
    apply: (state) => ({
      ...state,
      ascension: {
        ...state.ascension!,
        permanentBonuses: {
          ...state.ascension!.permanentBonuses,
          offlineEfficiency: Math.min(
            state.ascension!.permanentBonuses.offlineEfficiency + 0.05,
            1.0
          ),
        },
      },
    }),
  },
  {
    id: 'tap_power_1',
    name: 'Mega Tap',
    cost: 100,
    description: 'Permanently increase tap power by 10%',
    icon: '👆',
    maxPurchases: 20,
    apply: (state) => ({
      ...state,
      ascension: {
        ...state.ascension!,
        permanentBonuses: {
          ...state.ascension!.permanentBonuses,
          tapBonusMultiplier: state.ascension!.permanentBonuses.tapBonusMultiplier + 0.1,
        },
      },
    }),
  },
  {
    id: 'auto_buy',
    name: 'Auto-Buyer',
    cost: 500,
    description: 'Automatically buy best building every 60 seconds',
    icon: '⚡',
    maxPurchases: 1,
    apply: (state) => ({
      ...state,
      ascension: {
        ...state.ascension!,
        unlocks: [...state.ascension!.unlocks, 'auto_buyer'],
      },
    }),
  },
  {
    id: 'smart_prestige',
    name: 'Prestige Sense',
    cost: 250,
    description: 'Highlight optimal prestige timing',
    icon: '🔮',
    maxPurchases: 1,
    apply: (state) => ({
      ...state,
      ascension: {
        ...state.ascension!,
        unlocks: [...state.ascension!.unlocks, 'smart_prestige'],
      },
    }),
  },
];
