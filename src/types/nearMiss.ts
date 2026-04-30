/**
 * Advanced Near-Miss & Sunk Cost System
 *
 * Exploits near-miss psychology and investment tracking to
 * maximise re-engagement and prevent quitting.
 *
 * Psychological Principle: Near-Miss Effect + Escalating Commitment + Loss Aversion
 */

export type NearMissType = 'crate' | 'prestige' | 'achievement' | 'gacha';
export type EmotionalImpact = 'low' | 'medium' | 'high';

export interface NearMissEvent {
  type: NearMissType;
  trigger: string;
  teaseDuration: number; // ms to show the near-miss animation
  emotionalImpact: EmotionalImpact;
  message: string;
  pityBonus?: number;
}

export interface NearMissScenario {
  trigger: string;
  type: NearMissType;
  chance: number;
  message: string;
  emotionalImpact: EmotionalImpact;
  teaseDuration: number;
  pityBonus?: number;
}

export const NEAR_MISS_SCENARIOS: NearMissScenario[] = [
  {
    trigger: 'legendary_gacha_roll',
    type: 'gacha',
    chance: 0.15,
    message: "SO CLOSE! The legendary item was in the next roll!",
    emotionalImpact: 'high',
    teaseDuration: 2500,
    pityBonus: 5,
  },
  {
    trigger: 'epic_crate_open',
    type: 'crate',
    chance: 0.30,
    message: "ALMOST LEGENDARY! You were one tier away!",
    emotionalImpact: 'medium',
    teaseDuration: 1500,
  },
  {
    trigger: 'prestige_record',
    type: 'prestige',
    chance: 1.0, // Always show when within 10% of record
    message: "You were SO CLOSE to your record! Reset and go further?",
    emotionalImpact: 'high',
    teaseDuration: 3000,
  },
  {
    trigger: 'achievement_cluster',
    type: 'achievement',
    chance: 0.50,
    message: "Achievement SPREE! You're on fire! 🔥 Keep going!",
    emotionalImpact: 'medium',
    teaseDuration: 2000,
  },
];

/**
 * Check if a near-miss event should trigger
 * @param trigger - The trigger identifier
 * @param forceChance - Override random (for testing)
 */
export function shouldTriggerNearMiss(trigger: string, forceChance?: number): boolean {
  const scenario = NEAR_MISS_SCENARIOS.find(s => s.trigger === trigger);
  if (!scenario) return false;

  const roll = forceChance !== undefined ? (1 - forceChance) : Math.random();
  return roll < scenario.chance;
}

/**
 * Get the near-miss scenario by trigger
 */
export function getNearMissScenario(trigger: string): NearMissScenario | null {
  return NEAR_MISS_SCENARIOS.find(s => s.trigger === trigger) ?? null;
}

/**
 * Calculate a human-readable sunk cost label
 */
export function calculateSunkCostLabel(totalPlayTimeMs: number, totalOreEarned: number): string {
  const hours = Math.floor(totalPlayTimeMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalPlayTimeMs % (1000 * 60 * 60)) / (1000 * 60));

  let oreStr: string;
  if (totalOreEarned >= 1_000_000_000) {
    oreStr = `${(totalOreEarned / 1_000_000_000).toFixed(1)}B`;
  } else if (totalOreEarned >= 1_000_000) {
    oreStr = `${(totalOreEarned / 1_000_000).toFixed(1)}M`;
  } else if (totalOreEarned >= 1_000) {
    oreStr = `${(totalOreEarned / 1_000).toFixed(1)}K`;
  } else {
    oreStr = String(Math.floor(totalOreEarned));
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m invested · ${oreStr} ore produced`;
  }
  return `${minutes}m invested · ${oreStr} ore produced`;
}

/**
 * Check if comeback bonus should be shown (after 24h absence)
 */
export function shouldShowComebackBonus(lastLoginTime: number): boolean {
  const hoursAway = (Date.now() - lastLoginTime) / (1000 * 60 * 60);
  return hoursAway >= 24;
}

/**
 * Generate a loss message for the reset/quit confirmation dialog
 */
export function getLossMessage(
  prestigeLevel: number,
  ascensionCount: number,
  totalOreEarned: number
): string {
  const lines: string[] = [];

  if (ascensionCount > 0) {
    lines.push(`${ascensionCount} ascension${ascensionCount !== 1 ? 's' : ''} earned`);
  }
  if (prestigeLevel > 0) {
    lines.push(`Prestige level ${prestigeLevel} reached`);
  }
  if (totalOreEarned >= 1_000_000) {
    const m = (totalOreEarned / 1_000_000).toFixed(1);
    lines.push(`${m}M ore produced`);
  } else if (totalOreEarned >= 1000) {
    lines.push(`${(totalOreEarned / 1000).toFixed(0)}K ore produced`);
  }

  return lines.length > 0
    ? `You would lose: ${lines.join(', ')}`
    : 'You would lose all current progress';
}

/**
 * Investment tracker display text
 */
export function getInvestmentTrackerText(
  totalPlayTimeMs: number,
  achievementsUnlocked: number
): string {
  const hours = Math.floor(totalPlayTimeMs / (1000 * 60 * 60));
  return `You've invested ${hours}+ hours, earned ${achievementsUnlocked} achievements, and built an empire. Don't let it go to waste.`;
}
