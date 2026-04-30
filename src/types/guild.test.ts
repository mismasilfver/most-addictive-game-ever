import { describe, it, expect } from 'vitest';
import {
  generatePhantomMembers,
  calculatePlayerRank,
  calculateGuildProgress,
  getKickAnxietyMessage,
  GUILD_GOAL_DURATION,
  type PhantomGuild,
  type PhantomGuildMember,
} from './guild';

describe('guild types', () => {
  describe('generatePhantomMembers', () => {
    it('generates the requested number of members', () => {
      const members = generatePhantomMembers(10);
      expect(members).toHaveLength(10);
    });

    it('each member has required fields', () => {
      const [member] = generatePhantomMembers(1);
      expect(member.id).toBeDefined();
      expect(member.name).toBeDefined();
      expect(member.productionRate).toBeGreaterThan(0);
      expect(member.contribution).toBeGreaterThan(0);
      expect(member.lastActive).toBeDefined();
    });

    it('generates unique ids', () => {
      const members = generatePhantomMembers(5);
      const ids = new Set(members.map((m: PhantomGuildMember) => m.id));
      expect(ids.size).toBe(5);
    });
  });

  describe('calculatePlayerRank', () => {
    it('places player in middle of leaderboard', () => {
      const members: PhantomGuildMember[] = [
        { id: '1', name: 'Alice', productionRate: 5000, contribution: 50000, lastActive: 'now' },
        { id: '2', name: 'Bob', productionRate: 4000, contribution: 40000, lastActive: 'now' },
        { id: '3', name: 'Charlie', productionRate: 3000, contribution: 30000, lastActive: 'now' },
        { id: '4', name: 'Dave', productionRate: 1000, contribution: 10000, lastActive: 'now' },
      ];
      const playerContribution = 25000;
      const rank = calculatePlayerRank(members, playerContribution);
      // Player should be ranked 3rd or 4th (close but not top)
      expect(rank).toBeGreaterThanOrEqual(2);
      expect(rank).toBeLessThanOrEqual(5);
    });

    it('never places player as #1', () => {
      const members: PhantomGuildMember[] = [
        { id: '1', name: 'Alice', productionRate: 1, contribution: 100, lastActive: 'now' },
      ];
      const rank = calculatePlayerRank(members, 99999);
      expect(rank).not.toBe(1);
    });
  });

  describe('calculateGuildProgress', () => {
    it('calculates percentage correctly', () => {
      const progress = calculateGuildProgress(750, 1000);
      expect(progress).toBe(75);
    });

    it('caps at 100', () => {
      const progress = calculateGuildProgress(1200, 1000);
      expect(progress).toBe(100);
    });

    it('handles zero target gracefully', () => {
      const progress = calculateGuildProgress(0, 0);
      expect(progress).toBe(0);
    });
  });

  describe('getKickAnxietyMessage', () => {
    it('returns message when player is lowest contributor', () => {
      const msg = getKickAnxietyMessage(10, 10, 3600000);
      expect(msg).not.toBeNull();
      expect(msg).toContain('1 hour');
    });

    it('returns null when player is not at risk', () => {
      const msg = getKickAnxietyMessage(3, 10, 3600000);
      expect(msg).toBeNull();
    });
  });

  describe('GUILD_GOAL_DURATION', () => {
    it('is 7 days', () => {
      expect(GUILD_GOAL_DURATION).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('PhantomGuild structure', () => {
    it('has required shape', () => {
      const guild: PhantomGuild = {
        id: 'g1',
        name: 'Iron Foundry',
        members: [],
        totalProduction: 50000,
        playerContribution: 5000,
        playerRank: 3,
        weeklyRewards: [],
        guildGoal: {
          current: 500000,
          target: 1000000,
          deadline: Date.now() + GUILD_GOAL_DURATION,
        },
      };
      expect(guild.guildGoal.current).toBe(500000);
      expect(guild.playerRank).toBe(3);
    });
  });
});
