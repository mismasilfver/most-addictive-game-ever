import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PhantomGuild, GuildActivity } from '../types/guild';
import {
  generatePhantomMembers,
  calculatePlayerRank,
  calculateGuildProgress,
  getKickAnxietyMessage,
  generateGuildActivity,
  GUILD_GOAL_DURATION,
} from '../types/guild';

interface GuildState {
  guild: PhantomGuild | null;
  activityFeed: GuildActivity[];
  lastContributionTime: number | null;
  kickWarningShown: boolean;

  joinGuild: () => void;
  contribute: (amount: number) => void;
  tickPhantomActivity: (deltaMs: number) => void;
  getKickWarning: () => string | null;
  getGuildProgressPercent: () => number;
}

const GUILD_NAMES = [
  'Iron Foundry Elite', 'Steel Titans', 'Factory Lords', 'Ore Barons', 'The Forge Masters',
];
const GUILD_GOAL_TARGETS = [500_000, 1_000_000, 2_500_000, 5_000_000];

export const useGuildStore = create<GuildState>()(
  persist(
    (set, get) => ({
      guild: null,
      activityFeed: [],
      lastContributionTime: null,
      kickWarningShown: false,

      joinGuild: () => {
        const members = generatePhantomMembers(19); // 19 phantoms + player = 20
        const target = GUILD_GOAL_TARGETS[Math.floor(Math.random() * GUILD_GOAL_TARGETS.length)];
        const guildName = GUILD_NAMES[Math.floor(Math.random() * GUILD_NAMES.length)];
        const initialContribution = 0;
        const playerRank = calculatePlayerRank(members, initialContribution);

        const guild: PhantomGuild = {
          id: `guild-${Date.now()}`,
          name: guildName ?? 'Iron Foundry Elite',
          members,
          totalProduction: members.reduce((sum, m) => sum + m.contribution, 0),
          playerContribution: initialContribution,
          playerRank,
          weeklyRewards: [],
          guildGoal: {
            current: members.reduce((sum, m) => sum + m.contribution, 0) * 0.3,
            target,
            deadline: Date.now() + GUILD_GOAL_DURATION,
          },
        };

        set({ guild, activityFeed: generateGuildActivity(members) });
      },

      contribute: (amount: number) => {
        const { guild } = get();
        if (!guild) return;

        const newContribution = guild.playerContribution + amount;
        const newCurrent = guild.guildGoal.current + amount;
        const newRank = calculatePlayerRank(guild.members, newContribution);

        const activity: GuildActivity = {
          memberId: 'player',
          memberName: 'You',
          action: 'contributed',
          amount,
          timestamp: Date.now(),
        };

        set({
          guild: {
            ...guild,
            playerContribution: newContribution,
            playerRank: newRank,
            guildGoal: { ...guild.guildGoal, current: newCurrent },
          },
          lastContributionTime: Date.now(),
          activityFeed: [activity, ...get().activityFeed].slice(0, 20),
        });
      },

      tickPhantomActivity: (deltaMs: number) => {
        const { guild } = get();
        if (!guild) return;

        const tickSeconds = deltaMs / 1000;
        const updatedMembers = guild.members.map(m => ({
          ...m,
          contribution: m.contribution + m.productionRate * tickSeconds,
        }));

        const totalProduction = updatedMembers.reduce((sum, m) => sum + m.contribution, 0);
        const newCurrent = guild.guildGoal.current + updatedMembers.reduce(
          (sum, m) => sum + m.productionRate * tickSeconds, 0
        );

        set({
          guild: {
            ...guild,
            members: updatedMembers,
            totalProduction,
            playerRank: calculatePlayerRank(updatedMembers, guild.playerContribution),
            guildGoal: { ...guild.guildGoal, current: newCurrent },
          },
        });
      },

      getKickWarning: () => {
        const { guild } = get();
        if (!guild) return null;

        const timeUntilDeadline = guild.guildGoal.deadline - Date.now();
        return getKickAnxietyMessage(guild.playerRank, guild.members.length + 1, timeUntilDeadline);
      },

      getGuildProgressPercent: () => {
        const { guild } = get();
        if (!guild) return 0;
        return calculateGuildProgress(guild.guildGoal.current, guild.guildGoal.target);
      },
    }),
    { name: 'infinity-forge-guild' }
  )
);
