/**
 * Social / Guild System
 *
 * Phantom guild mechanics that simulate social obligation,
 * peer pressure, and kick-anxiety to drive engagement.
 *
 * Psychological Principle: Social Proof + Loss Aversion + Status Seeking
 */

import type { RewardTierConfig } from './reward';

export interface PhantomGuildMember {
  id: string;
  name: string;
  productionRate: number;
  lastActive: string;
  contribution: number;
}

export interface PhantomGuild {
  id: string;
  name: string;
  members: PhantomGuildMember[];
  totalProduction: number;
  playerContribution: number;
  playerRank: number;
  weeklyRewards: RewardTierConfig[];
  guildGoal: {
    current: number;
    target: number;
    deadline: number;
  };
}

export interface GuildActivity {
  memberId: string;
  memberName: string;
  action: 'upgraded' | 'contributed' | 'joined' | 'earned';
  amount: number;
  timestamp: number;
}

export const GUILD_GOAL_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const PHANTOM_NAMES = [
  'SteelTycoon88', 'FactoryKing', 'IronMogul', 'OreHunter', 'ProductionGuru',
  'IndustrialAce', 'Forgemaster', 'MetalPrince', 'BuilderElite', 'MachineGod',
  'CogTurner99', 'SteamPunk42', 'GearGrinder', 'NitroForge', 'TitanCraft',
  'IronWill77', 'SteelDream', 'MegaFactory', 'RushManager', 'UltraGrind',
];

/**
 * Generate phantom guild members with plausible stats
 */
export function generatePhantomMembers(count: number): PhantomGuildMember[] {
  const members: PhantomGuildMember[] = [];
  const shuffled = [...PHANTOM_NAMES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count; i++) {
    const productionRate = Math.floor(Math.random() * 8000) + 2000;
    const hoursAgo = Math.floor(Math.random() * 8);
    const lastActive = hoursAgo === 0 ? 'Just now' : `${hoursAgo}h ago`;

    members.push({
      id: `phantom-${i}-${Date.now()}`,
      name: shuffled[i % shuffled.length] ?? `Player${i}`,
      productionRate,
      contribution: productionRate * (Math.floor(Math.random() * 48) + 24),
      lastActive,
    });
  }

  return members;
}

/**
 * Calculate player's rank — always rigged to be close but never #1
 */
export function calculatePlayerRank(
  members: PhantomGuildMember[],
  playerContribution: number
): number {
  const sorted = [...members].sort((a, b) => b.contribution - a.contribution);

  let rank = 1;
  for (const m of sorted) {
    if (m.contribution > playerContribution) rank++;
  }

  // Never let player be #1 — always ensure at least one member above
  if (rank === 1 && members.length > 0) {
    return 2;
  }

  return rank;
}

/**
 * Calculate guild goal progress as a percentage (0-100)
 */
export function calculateGuildProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.floor((current / target) * 100));
}

/**
 * Generate kick-anxiety message when player is the lowest contributor
 */
export function getKickAnxietyMessage(
  playerRank: number,
  totalMembers: number,
  timeUntilKickMs: number
): string | null {
  if (playerRank < totalMembers) return null;

  const hours = Math.floor(timeUntilKickMs / (60 * 60 * 1000));
  const minutes = Math.floor((timeUntilKickMs % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `⚠️ Lowest contributor may be removed in ${hours} hour${hours !== 1 ? 's' : ''}!`;
  }
  return `⚠️ Lowest contributor may be removed in ${minutes} minutes!`;
}

/**
 * Generate fake guild activity feed
 */
export function generateGuildActivity(members: PhantomGuildMember[]): GuildActivity[] {
  return members.slice(0, 5).map((m, i) => ({
    memberId: m.id,
    memberName: m.name,
    action: (['upgraded', 'contributed', 'earned'] as GuildActivity['action'][])[i % 3],
    amount: Math.floor(Math.random() * 50000) + 5000,
    timestamp: Date.now() - i * 120000,
  }));
}

/**
 * Get guild tier name based on total production
 */
export function getGuildTier(totalProduction: number): string {
  if (totalProduction >= 10_000_000) return '🏆 Diamond';
  if (totalProduction >= 1_000_000) return '💎 Platinum';
  if (totalProduction >= 100_000) return '🥇 Gold';
  if (totalProduction >= 10_000) return '🥈 Silver';
  return '🥉 Bronze';
}
