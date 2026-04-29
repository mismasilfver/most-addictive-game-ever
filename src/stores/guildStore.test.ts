import { describe, it, expect, beforeEach } from 'vitest';
import { useGuildStore } from './guildStore';

describe('guildStore', () => {
  beforeEach(() => {
    useGuildStore.setState({
      guild: null,
      activityFeed: [],
      lastContributionTime: null,
      kickWarningShown: false,
    });
  });

  describe('initial state', () => {
    it('starts with no guild', () => {
      expect(useGuildStore.getState().guild).toBeNull();
    });

    it('starts with empty activity feed', () => {
      expect(useGuildStore.getState().activityFeed).toHaveLength(0);
    });
  });

  describe('joinGuild', () => {
    it('creates a guild on join', () => {
      useGuildStore.getState().joinGuild();
      expect(useGuildStore.getState().guild).not.toBeNull();
    });

    it('generates phantom members', () => {
      useGuildStore.getState().joinGuild();
      const guild = useGuildStore.getState().guild;
      expect(guild?.members.length).toBeGreaterThan(0);
    });

    it('sets a guild goal', () => {
      useGuildStore.getState().joinGuild();
      const guild = useGuildStore.getState().guild;
      expect(guild?.guildGoal.target).toBeGreaterThan(0);
    });

    it('has a deadline in the future', () => {
      useGuildStore.getState().joinGuild();
      const guild = useGuildStore.getState().guild;
      expect(guild?.guildGoal.deadline).toBeGreaterThan(Date.now());
    });
  });

  describe('contribute', () => {
    beforeEach(() => {
      useGuildStore.getState().joinGuild();
    });

    it('increases player contribution', () => {
      const before = useGuildStore.getState().guild?.playerContribution ?? 0;
      useGuildStore.getState().contribute(5000);
      const after = useGuildStore.getState().guild?.playerContribution ?? 0;
      expect(after).toBe(before + 5000);
    });

    it('increases guild goal current progress', () => {
      const before = useGuildStore.getState().guild?.guildGoal.current ?? 0;
      useGuildStore.getState().contribute(1000);
      const after = useGuildStore.getState().guild?.guildGoal.current ?? 0;
      expect(after).toBe(before + 1000);
    });

    it('records last contribution time', () => {
      const beforeTime = Date.now();
      useGuildStore.getState().contribute(1000);
      const recorded = useGuildStore.getState().lastContributionTime;
      expect(recorded).toBeGreaterThanOrEqual(beforeTime);
    });

    it('adds to activity feed', () => {
      useGuildStore.getState().contribute(1000);
      expect(useGuildStore.getState().activityFeed.length).toBeGreaterThan(0);
    });
  });

  describe('tickPhantomActivity', () => {
    beforeEach(() => {
      useGuildStore.getState().joinGuild();
    });

    it('advances phantom member contributions', () => {
      const before = useGuildStore.getState().guild?.totalProduction ?? 0;
      useGuildStore.getState().tickPhantomActivity(1000);
      const after = useGuildStore.getState().guild?.totalProduction ?? 0;
      expect(after).toBeGreaterThan(before);
    });
  });

  describe('getKickWarning', () => {
    it('returns null before joining guild', () => {
      expect(useGuildStore.getState().getKickWarning()).toBeNull();
    });

    it('returns message when player is lowest', () => {
      useGuildStore.setState({
        guild: {
          id: 'g1',
          name: 'Test Guild',
          members: [
            { id: 'p1', name: 'Big', productionRate: 9000, contribution: 900000, lastActive: '1h ago' },
          ],
          totalProduction: 900000,
          playerContribution: 0,
          playerRank: 2,
          weeklyRewards: [],
          guildGoal: { current: 100, target: 1000, deadline: Date.now() + 3600000 },
        },
        activityFeed: [],
        lastContributionTime: null,
        kickWarningShown: false,
      });

      const warning = useGuildStore.getState().getKickWarning();
      expect(warning).not.toBeNull();
    });
  });

  describe('getGuildProgressPercent', () => {
    it('returns 0 before joining', () => {
      expect(useGuildStore.getState().getGuildProgressPercent()).toBe(0);
    });

    it('calculates progress percentage', () => {
      useGuildStore.getState().joinGuild();
      useGuildStore.getState().contribute(500);
      const pct = useGuildStore.getState().getGuildProgressPercent();
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    });
  });
});
