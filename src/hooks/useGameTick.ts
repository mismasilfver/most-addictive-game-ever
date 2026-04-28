import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useRewardStore } from '../stores/rewardStore';
import { usePlayerStore } from '../stores/playerStore';

const TICK_RATE = 100; // 10 ticks per second

export function useGameTick() {
  const lastTimeRef = useRef(Date.now());
  const { tick: gameTick, totalProduction, resources, buildings } = useGameStore();
  const { tick: rewardTick } = useRewardStore();
  const { updateLeaderboard, tickLeaderboard, tickPlayTime, checkAchievements, unlockAchievement } = usePlayerStore();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Game loop
      gameTick(deltaTime);
      
      // Reward loop
      rewardTick();
      
      // Player/leaderboard loop
      tickLeaderboard(deltaTime);
      tickPlayTime();
      
      // Check achievements
      const newAchievements = checkAchievements({
        buildingsOwned: buildings.reduce((sum, b) => sum + b.count, 0),
        totalProduction,
        totalEarned: resources.ore.totalEarned,
      });
      
      // Unlock any new achievements
      newAchievements.forEach(achievement => {
        unlockAchievement(achievement.id);
      });
      
      // Update leaderboard less frequently (every ~10 seconds)
      if (Math.random() < 0.01) {
        updateLeaderboard(totalProduction, resources.ore.totalEarned);
      }
    }, TICK_RATE);

    return () => clearInterval(interval);
  }, [gameTick, rewardTick, tickLeaderboard, tickPlayTime, checkAchievements, unlockAchievement, updateLeaderboard, totalProduction, resources, buildings]);
}
