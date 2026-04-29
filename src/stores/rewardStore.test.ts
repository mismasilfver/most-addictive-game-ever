import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRewardStore } from './rewardStore';
import { DAILY_REWARDS } from '../types/reward';

describe('rewardStore', () => {
  beforeEach(() => {
    useRewardStore.setState({
      crates: [],
      nextCrateTime: Date.now() + 1000000, // Far future
      dailyStreak: 0,
      lastLoginDate: new Date().toDateString(),
      dailyRewards: DAILY_REWARDS.map((reward, index) => ({
        day: index + 1,
        reward,
        claimed: false,
      })),
      variableRatioCounter: 0,
    });
  });

  describe('initial state', () => {
    it('starts with empty crates array', () => {
      const state = useRewardStore.getState();
      expect(state.crates).toHaveLength(0);
    });

    it('starts with zero daily streak', () => {
      const state = useRewardStore.getState();
      expect(state.dailyStreak).toBe(0);
    });

    it('initializes daily rewards for 7 days', () => {
      const state = useRewardStore.getState();
      expect(state.dailyRewards).toHaveLength(7);
      expect(state.dailyRewards[0].day).toBe(1);
      expect(state.dailyRewards[6].day).toBe(7);
    });

    it('marks all daily rewards as unclaimed', () => {
      const state = useRewardStore.getState();
      expect(state.dailyRewards.every(r => !r.claimed)).toBe(true);
    });

    it('starts with zero variable ratio counter', () => {
      const state = useRewardStore.getState();
      expect(state.variableRatioCounter).toBe(0);
    });
  });

  describe('spawnCrate', () => {
    it('adds a new crate to crates array', () => {
      useRewardStore.getState().spawnCrate();
      expect(useRewardStore.getState().crates).toHaveLength(1);
    });

    it('generates unique crate ID', () => {
      useRewardStore.getState().spawnCrate();
      useRewardStore.getState().spawnCrate();
      
      const [crate1, crate2] = useRewardStore.getState().crates;
      expect(crate1.id).not.toBe(crate2.id);
    });

    it('sets crate as unopened initially', () => {
      useRewardStore.getState().spawnCrate();
      const crate = useRewardStore.getState().crates[0];
      expect(crate.openTime).toBeNull();
    });

    it('assigns a valid tier to crate', () => {
      useRewardStore.getState().spawnCrate();
      const crate = useRewardStore.getState().crates[0];
      expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(crate.tier);
    });

    it('calculates baseReward based on tier multiplier', () => {
      useRewardStore.getState().spawnCrate();
      const crate = useRewardStore.getState().crates[0];
      
      // Base is 100, multiplied by tier multiplier
      expect(crate.baseReward).toBeGreaterThanOrEqual(100); // common
      expect(crate.baseReward).toBeLessThanOrEqual(50000); // legendary
    });

    it('updates nextCrateTime to future', () => {
      const beforeTime = useRewardStore.getState().nextCrateTime;
      useRewardStore.getState().spawnCrate();
      const afterTime = useRewardStore.getState().nextCrateTime;
      
      expect(afterTime).toBeGreaterThan(Date.now());
      expect(afterTime).not.toBe(beforeTime);
    });

    it('limits unopened crates to last 5', () => {
      // Spawn 7 crates
      for (let i = 0; i < 7; i++) {
        useRewardStore.getState().spawnCrate();
      }
      
      // Keeps last 4 + new one = 5
      expect(useRewardStore.getState().crates).toHaveLength(5);
    });

    it('filters out opened crates when adding new ones', () => {
      useRewardStore.getState().spawnCrate();
      const crateId = useRewardStore.getState().crates[0].id;
      
      // Open the first crate (it gets filtered out)
      useRewardStore.getState().openCrate(crateId);
      
      // Spawn 2 more
      useRewardStore.getState().spawnCrate();
      useRewardStore.getState().spawnCrate();
      
      // Opened crate is filtered, only new ones remain
      const crates = useRewardStore.getState().crates;
      const openedCount = crates.filter(c => c.openTime).length;
      expect(openedCount).toBe(0);
      expect(crates).toHaveLength(2);
    });
  });

  describe('openCrate', () => {
    it('returns null for non-existent crate', () => {
      const result = useRewardStore.getState().openCrate('fake-id');
      expect(result).toBeNull();
    });

    it('returns null for already opened crate', () => {
      useRewardStore.getState().spawnCrate();
      const crateId = useRewardStore.getState().crates[0].id;
      
      useRewardStore.getState().openCrate(crateId);
      const secondAttempt = useRewardStore.getState().openCrate(crateId);
      
      expect(secondAttempt).toBeNull();
    });

    it('returns tier and amount for valid crate', () => {
      useRewardStore.getState().spawnCrate();
      const crateId = useRewardStore.getState().crates[0].id;
      const crate = useRewardStore.getState().crates[0];
      
      const result = useRewardStore.getState().openCrate(crateId);
      
      expect(result).not.toBeNull();
      expect(result!.tier.tier).toBe(crate.tier);
      expect(result!.amount).toBe(crate.baseReward);
    });

    it('marks crate as opened', () => {
      useRewardStore.getState().spawnCrate();
      const crateId = useRewardStore.getState().crates[0].id;
      
      useRewardStore.getState().openCrate(crateId);
      
      const crate = useRewardStore.getState().crates.find(c => c.id === crateId);
      expect(crate!.openTime).not.toBeNull();
    });
  });

  describe('tick', () => {
    it('spawns crate when nextCrateTime reached', () => {
      // Set nextCrateTime to past
      useRewardStore.setState({ nextCrateTime: Date.now() - 1000 });
      
      useRewardStore.getState().tick();
      
      expect(useRewardStore.getState().crates).toHaveLength(1);
    });

    it('does not spawn crate before nextCrateTime', () => {
      // nextCrateTime is already in far future from beforeEach
      useRewardStore.getState().tick();
      
      expect(useRewardStore.getState().crates).toHaveLength(0);
    });
  });

  describe('checkDailyLogin', () => {
    it('returns isNewDay=false on same day login', () => {
      const result = useRewardStore.getState().checkDailyLogin();
      expect(result.isNewDay).toBe(false);
      expect(result.streakBroken).toBe(false);
    });

    it('increments streak on consecutive day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      useRewardStore.setState({
        lastLoginDate: yesterday.toDateString(),
        dailyStreak: 3,
      });
      
      const result = useRewardStore.getState().checkDailyLogin();
      
      expect(result.isNewDay).toBe(true);
      expect(result.streakBroken).toBe(false);
      expect(useRewardStore.getState().dailyStreak).toBe(4);
    });

    it('breaks streak and resets to 1 after gap', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      useRewardStore.setState({
        lastLoginDate: threeDaysAgo.toDateString(),
        dailyStreak: 5,
      });
      
      const result = useRewardStore.getState().checkDailyLogin();
      
      expect(result.isNewDay).toBe(true);
      expect(result.streakBroken).toBe(true);
      expect(useRewardStore.getState().dailyStreak).toBe(1);
    });

    it('resets daily rewards when streak breaks', () => {
      // Mark some rewards as claimed
      const claimedRewards = DAILY_REWARDS.map((reward, index) => ({
        day: index + 1,
        reward,
        claimed: index < 3, // First 3 claimed
      }));
      
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      useRewardStore.setState({
        lastLoginDate: threeDaysAgo.toDateString(),
        dailyRewards: claimedRewards,
      });
      
      useRewardStore.getState().checkDailyLogin();
      
      expect(useRewardStore.getState().dailyRewards.every(r => !r.claimed)).toBe(true);
    });

    it('updates lastLoginDate to today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      useRewardStore.setState({ lastLoginDate: yesterday.toDateString() });
      useRewardStore.getState().checkDailyLogin();
      
      expect(useRewardStore.getState().lastLoginDate).toBe(new Date().toDateString());
    });
  });

  describe('claimDailyReward', () => {
    it('returns 0 for invalid day', () => {
      const result = useRewardStore.getState().claimDailyReward(0);
      expect(result).toBe(0);
      
      const result2 = useRewardStore.getState().claimDailyReward(8);
      expect(result2).toBe(0);
    });

    it('returns 0 for already claimed reward', () => {
      useRewardStore.setState({
        dailyStreak: 3,
        dailyRewards: DAILY_REWARDS.map((reward, index) => ({
          day: index + 1,
          reward,
          claimed: index === 0, // Day 1 already claimed
        })),
      });
      
      const result = useRewardStore.getState().claimDailyReward(1);
      expect(result).toBe(0);
    });

    it('returns 0 if trying to claim day beyond streak', () => {
      useRewardStore.setState({ dailyStreak: 2 });
      
      // Try to claim day 5 when streak is only 2
      const result = useRewardStore.getState().claimDailyReward(5);
      expect(result).toBe(0);
    });

    it('returns reward amount for valid claim', () => {
      useRewardStore.setState({ dailyStreak: 3 });
      
      const result = useRewardStore.getState().claimDailyReward(2);
      expect(result).toBe(DAILY_REWARDS[1]); // Day 2 reward
    });

    it('marks reward as claimed', () => {
      useRewardStore.setState({ dailyStreak: 3 });
      
      useRewardStore.getState().claimDailyReward(1);
      
      expect(useRewardStore.getState().dailyRewards[0].claimed).toBe(true);
    });
  });

  describe('incrementVariableRatio', () => {
    it('increments counter by 1', () => {
      useRewardStore.getState().incrementVariableRatio();
      expect(useRewardStore.getState().variableRatioCounter).toBe(1);
    });

    it('accumulates multiple increments', () => {
      useRewardStore.getState().incrementVariableRatio();
      useRewardStore.getState().incrementVariableRatio();
      useRewardStore.getState().incrementVariableRatio();
      expect(useRewardStore.getState().variableRatioCounter).toBe(3);
    });
  });
});
