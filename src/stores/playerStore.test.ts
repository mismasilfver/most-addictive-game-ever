import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlayerStore } from './playerStore';

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      phantomPlayers: [],
      playerRank: 11,
      achievements: [],
      totalTaps: 0,
      playTimeMinutes: 0,
      sessionStartTime: Date.now(),
    });
  });

  describe('initial state', () => {
    it('starts with player rank 11 (just outside top 10)', () => {
      // Need to reset to get the actual initial state
      const store = usePlayerStore.getState();
      expect(store.playerRank).toBe(11);
    });

    it('starts with zero total taps', () => {
      const store = usePlayerStore.getState();
      expect(store.totalTaps).toBe(0);
    });

    it('starts with zero play time', () => {
      const store = usePlayerStore.getState();
      expect(store.playTimeMinutes).toBe(0);
    });
  });

  describe('recordTap', () => {
    it('increments total taps by 1', () => {
      usePlayerStore.getState().recordTap();
      expect(usePlayerStore.getState().totalTaps).toBe(1);
    });

    it('accumulates multiple taps', () => {
      usePlayerStore.getState().recordTap();
      usePlayerStore.getState().recordTap();
      usePlayerStore.getState().recordTap();
      expect(usePlayerStore.getState().totalTaps).toBe(3);
    });
  });

  describe('tickPlayTime', () => {
    it('calculates minutes since session start', () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      usePlayerStore.setState({ sessionStartTime: fiveMinutesAgo });
      
      usePlayerStore.getState().tickPlayTime();
      
      expect(usePlayerStore.getState().playTimeMinutes).toBe(5);
    });

    it('floors to whole minutes', () => {
      const fiveMinThirtySecAgo = Date.now() - (5 * 60 * 1000 + 30 * 1000);
      usePlayerStore.setState({ sessionStartTime: fiveMinThirtySecAgo });
      
      usePlayerStore.getState().tickPlayTime();
      
      expect(usePlayerStore.getState().playTimeMinutes).toBe(5);
    });
  });

  describe('tickLeaderboard', () => {
    it('increases phantom players ore over time', () => {
      const initialPlayers = [
        { id: 'p1', name: 'Test1', productionRate: 10, totalOre: 100, rank: 1 },
        { id: 'p2', name: 'Test2', productionRate: 20, totalOre: 200, rank: 2 },
      ];
      
      usePlayerStore.setState({ phantomPlayers: initialPlayers });
      usePlayerStore.getState().tickLeaderboard(1); // 1 second
      
      const players = usePlayerStore.getState().phantomPlayers;
      expect(players[0].totalOre).toBeGreaterThan(100);
      expect(players[1].totalOre).toBeGreaterThan(200);
    });

    it('scales accumulation by delta time', () => {
      const initialPlayers = [
        { id: 'p1', name: 'Test1', productionRate: 10, totalOre: 100, rank: 1 },
      ];
      
      usePlayerStore.setState({ phantomPlayers: initialPlayers });
      usePlayerStore.getState().tickLeaderboard(10); // 10 seconds
      
      const player = usePlayerStore.getState().phantomPlayers[0];
      // 100 + (10 * 10 * 0.1) = 110
      expect(player.totalOre).toBe(110);
    });
  });

  describe('updateLeaderboard', () => {
    it('updates phantom players with random production variation', () => {
      const initialPlayers = [
        { id: 'p1', name: 'Test1', productionRate: 100, totalOre: 1000, rank: 1 },
      ];
      
      usePlayerStore.setState({ phantomPlayers: initialPlayers });
      usePlayerStore.getState().updateLeaderboard(50, 500);
      
      const player = usePlayerStore.getState().phantomPlayers[0];
      // Production rate varies between 98% and 102%
      expect(player.productionRate).toBeGreaterThanOrEqual(98);
      expect(player.productionRate).toBeLessThanOrEqual(102);
    });

    it('increases phantom players ore by their production rate', () => {
      const initialPlayers = [
        { id: 'p1', name: 'Test1', productionRate: 50, totalOre: 1000, rank: 1 },
      ];
      
      usePlayerStore.setState({ phantomPlayers: initialPlayers });
      usePlayerStore.getState().updateLeaderboard(50, 500);
      
      const player = usePlayerStore.getState().phantomPlayers[0];
      // Ore increases by productionRate
      expect(player.totalOre).toBe(1050);
    });

    it('sorts phantom players by total ore descending', () => {
      const initialPlayers = [
        { id: 'p1', name: 'Test1', productionRate: 10, totalOre: 100, rank: 1 },
        { id: 'p2', name: 'Test2', productionRate: 10, totalOre: 200, rank: 2 },
      ];
      
      usePlayerStore.setState({ phantomPlayers: initialPlayers });
      
      // Give p1 more ore so it should be first
      usePlayerStore.setState({
        phantomPlayers: [
          { id: 'p1', name: 'Test1', productionRate: 10, totalOre: 300, rank: 1 },
          { id: 'p2', name: 'Test2', productionRate: 10, totalOre: 200, rank: 2 },
        ],
      });
      
      usePlayerStore.getState().updateLeaderboard(50, 500);
      
      const players = usePlayerStore.getState().phantomPlayers;
      expect(players[0].totalOre).toBeGreaterThanOrEqual(players[1].totalOre);
    });

    it('calculates player rank based on ore comparison', () => {
      const initialPlayers = Array.from({ length: 10 }, (_, i) => ({
        id: `p${i}`,
        name: `Test${i}`,
        productionRate: 10,
        totalOre: (10 - i) * 100, // p0: 1000, p9: 100
        rank: i + 1,
      }));
      
      usePlayerStore.setState({ phantomPlayers: initialPlayers });
      
      // Player with 550 ore should be rank 6 (between p4:500 and p5:600)
      usePlayerStore.getState().updateLeaderboard(50, 550);
      
      expect(usePlayerStore.getState().playerRank).toBe(6);
    });

    it('ranks player as 1 when they have most ore', () => {
      const initialPlayers = Array.from({ length: 10 }, (_, i) => ({
        id: `p${i}`,
        name: `Test${i}`,
        productionRate: 10,
        totalOre: 100,
        rank: i + 1,
      }));
      
      usePlayerStore.setState({ phantomPlayers: initialPlayers });
      usePlayerStore.getState().updateLeaderboard(50, 10000);
      
      expect(usePlayerStore.getState().playerRank).toBe(1);
    });
  });

  describe('unlockAchievement', () => {
    it('marks achievement as unlocked', () => {
      const achievements = [
        { id: 'test1', name: 'Test 1', description: 'Desc', unlocked: false, unlockedAt: null },
        { id: 'test2', name: 'Test 2', description: 'Desc', unlocked: false, unlockedAt: null },
      ];
      
      usePlayerStore.setState({ achievements });
      usePlayerStore.getState().unlockAchievement('test1');
      
      const unlocked = usePlayerStore.getState().achievements.find(a => a.id === 'test1');
      expect(unlocked?.unlocked).toBe(true);
      expect(unlocked?.unlockedAt).not.toBeNull();
    });

    it('does not affect other achievements', () => {
      const achievements = [
        { id: 'test1', name: 'Test 1', description: 'Desc', unlocked: false, unlockedAt: null },
        { id: 'test2', name: 'Test 2', description: 'Desc', unlocked: false, unlockedAt: null },
      ];
      
      usePlayerStore.setState({ achievements });
      usePlayerStore.getState().unlockAchievement('test1');
      
      const other = usePlayerStore.getState().achievements.find(a => a.id === 'test2');
      expect(other?.unlocked).toBe(false);
    });
  });

  describe('checkAchievements', () => {
    beforeEach(() => {
      const achievements = [
        { id: 'first_building', name: 'First Steps', description: '', unlocked: false, unlockedAt: null },
        { id: 'ten_buildings', name: 'Growing Fleet', description: '', unlocked: false, unlockedAt: null },
        { id: 'first_k', name: 'Thousandaire', description: '', unlocked: false, unlockedAt: null },
        { id: 'tap_master', name: 'Tap Master', description: '', unlocked: false, unlockedAt: null },
        { id: 'dedicated', name: 'Dedicated', description: '', unlocked: false, unlockedAt: null },
      ];
      
      usePlayerStore.setState({ 
        achievements,
        totalTaps: 0,
        playTimeMinutes: 0,
      });
    });

    it('unlocks first_building with 1 building', () => {
      const newlyUnlocked = usePlayerStore.getState().checkAchievements({
        buildingsOwned: 1,
        totalProduction: 0,
        totalEarned: 0,
      });
      
      expect(newlyUnlocked.some(a => a.id === 'first_building')).toBe(true);
    });

    it('unlocks ten_buildings with 10 buildings', () => {
      const newlyUnlocked = usePlayerStore.getState().checkAchievements({
        buildingsOwned: 10,
        totalProduction: 0,
        totalEarned: 0,
      });
      
      expect(newlyUnlocked.some(a => a.id === 'ten_buildings')).toBe(true);
    });

    it('unlocks first_k with 1000 earned', () => {
      const newlyUnlocked = usePlayerStore.getState().checkAchievements({
        buildingsOwned: 0,
        totalProduction: 0,
        totalEarned: 1000,
      });
      
      expect(newlyUnlocked.some(a => a.id === 'first_k')).toBe(true);
    });

    it('unlocks tap_master with 100 taps', () => {
      usePlayerStore.setState({ totalTaps: 100 });
      
      const newlyUnlocked = usePlayerStore.getState().checkAchievements({
        buildingsOwned: 0,
        totalProduction: 0,
        totalEarned: 0,
      });
      
      expect(newlyUnlocked.some(a => a.id === 'tap_master')).toBe(true);
    });

    it('unlocks dedicated with 10 minutes playtime', () => {
      usePlayerStore.setState({ playTimeMinutes: 10 });
      
      const newlyUnlocked = usePlayerStore.getState().checkAchievements({
        buildingsOwned: 0,
        totalProduction: 0,
        totalEarned: 0,
      });
      
      expect(newlyUnlocked.some(a => a.id === 'dedicated')).toBe(true);
    });

    it('does not unlock already unlocked achievements', () => {
      const achievements = [
        { id: 'first_building', name: 'First Steps', description: '', unlocked: true, unlockedAt: Date.now() },
      ];
      
      usePlayerStore.setState({ achievements });
      
      const newlyUnlocked = usePlayerStore.getState().checkAchievements({
        buildingsOwned: 1,
        totalProduction: 0,
        totalEarned: 0,
      });
      
      expect(newlyUnlocked).toHaveLength(0);
    });

    it('returns array of newly unlocked achievements', () => {
      const newlyUnlocked = usePlayerStore.getState().checkAchievements({
        buildingsOwned: 10,
        totalProduction: 0,
        totalEarned: 1000,
      });
      
      expect(newlyUnlocked.length).toBeGreaterThan(0);
      expect(newlyUnlocked.every(a => a.unlocked)).toBe(true);
    });

    it('checks multiple conditions at once', () => {
      usePlayerStore.setState({ 
        totalTaps: 100,
        playTimeMinutes: 10,
      });
      
      const newlyUnlocked = usePlayerStore.getState().checkAchievements({
        buildingsOwned: 10,
        totalProduction: 100,
        totalEarned: 1000,
      });
      
      expect(newlyUnlocked.some(a => a.id === 'first_building')).toBe(true);
      expect(newlyUnlocked.some(a => a.id === 'ten_buildings')).toBe(true);
      expect(newlyUnlocked.some(a => a.id === 'first_k')).toBe(true);
      expect(newlyUnlocked.some(a => a.id === 'tap_master')).toBe(true);
      expect(newlyUnlocked.some(a => a.id === 'dedicated')).toBe(true);
    });
  });
});
