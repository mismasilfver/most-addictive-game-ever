import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MysteryCrate, RewardTier, RewardTierConfig, DailyReward } from '../types/reward';
import { REWARD_TIERS, rollRewardTier, calculateCrateSpawnTime, DAILY_REWARDS } from '../types/reward';

interface RewardState {
  crates: MysteryCrate[];
  nextCrateTime: number;
  dailyStreak: number;
  lastLoginDate: string;
  dailyRewards: DailyReward[];
  variableRatioCounter: number;
  
  // Actions
  tick: () => void;
  spawnCrate: () => void;
  openCrate: (crateId: string) => { tier: RewardTierConfig; amount: number } | null;
  checkDailyLogin: () => { isNewDay: boolean; streakBroken: boolean };
  claimDailyReward: (day: number) => number;
  incrementVariableRatio: () => void;
}

export const useRewardStore = create<RewardState>()(
  persist(
    (set, get) => ({
      crates: [],
      nextCrateTime: calculateCrateSpawnTime(),
      dailyStreak: 0,
      lastLoginDate: new Date().toDateString(),
      dailyRewards: DAILY_REWARDS.map((reward, index) => ({
        day: index + 1,
        reward,
        claimed: false,
      })),
      variableRatioCounter: 0,

      tick: () => {
        const now = Date.now();
        const { nextCrateTime } = get();
        
        if (now >= nextCrateTime) {
          get().spawnCrate();
        }
      },

      spawnCrate: () => {
        const tier = rollRewardTier();
        const isNearMiss = tier.tier === 'epic' && Math.random() < 0.3; // 30% chance to tease legendary then give epic
        
        const newCrate: MysteryCrate = {
          id: `crate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          spawnTime: Date.now(),
          openTime: null,
          tier: tier.tier,
          baseReward: 100 * tier.multiplier,
          isNearMiss,
        };
        
        set((state) => ({
          crates: [...state.crates.filter(c => !c.openTime).slice(-4), newCrate],
          nextCrateTime: calculateCrateSpawnTime(),
        }));
      },

      openCrate: (crateId: string) => {
        const { crates } = get();
        const crate = crates.find(c => c.id === crateId && !c.openTime);
        
        if (!crate) return null;
        
        const tier = REWARD_TIERS.find(t => t.tier === crate.tier)!;
        
        // Near miss tease - if it's a near miss, briefly show legendary glow before revealing
        
        set((state) => ({
          crates: state.crates.map(c =>
            c.id === crateId ? { ...c, openTime: Date.now() } : c
          ),
        }));
        
        return { tier, amount: crate.baseReward };
      },

      checkDailyLogin: () => {
        const today = new Date().toDateString();
        const { lastLoginDate, dailyStreak, dailyRewards } = get();
        
        if (lastLoginDate === today) {
          return { isNewDay: false, streakBroken: false };
        }
        
        const lastDate = new Date(lastLoginDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let newStreak = dailyStreak;
        let streakBroken = false;
        
        if (diffDays === 1) {
          // Consecutive day
          newStreak = dailyStreak + 1;
        } else if (diffDays > 1) {
          // Streak broken
          newStreak = 1;
          streakBroken = true;
        } else {
          // First login ever or same day
          newStreak = dailyStreak || 1;
        }
        
        // Reset daily rewards if it's a new week
        const resetRewards = diffDays > 1 || dailyRewards.every(r => r.claimed);
        
        set({
          lastLoginDate: today,
          dailyStreak: newStreak,
          dailyRewards: resetRewards 
            ? DAILY_REWARDS.map((reward, index) => ({
                day: index + 1,
                reward,
                claimed: false,
              }))
            : dailyRewards,
        });
        
        return { isNewDay: true, streakBroken };
      },

      claimDailyReward: (day: number) => {
        const { dailyRewards, dailyStreak } = get();
        const rewardIndex = day - 1;
        
        if (rewardIndex < 0 || rewardIndex >= dailyRewards.length) return 0;
        if (dailyRewards[rewardIndex].claimed) return 0;
        if (day > dailyStreak) return 0;
        
        const reward = dailyRewards[rewardIndex].reward;
        
        set((state) => ({
          dailyRewards: state.dailyRewards.map((r, i) =>
            i === rewardIndex ? { ...r, claimed: true } : r
          ),
        }));
        
        return reward;
      },

      incrementVariableRatio: () => {
        set((state) => ({
          variableRatioCounter: state.variableRatioCounter + 1,
        }));
      },
    }),
    {
      name: 'infinity-forge-rewards',
    }
  )
);
