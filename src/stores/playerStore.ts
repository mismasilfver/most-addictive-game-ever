import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PhantomPlayer {
  id: string;
  name: string;
  productionRate: number;
  totalOre: number;
  rank: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt: number | null;
}

interface PlayerState {
  // Phantom leaderboard
  phantomPlayers: PhantomPlayer[];
  playerRank: number;
  
  // Achievements (micro-rewards)
  achievements: Achievement[];
  
  // Stats
  totalTaps: number;
  playTimeMinutes: number;
  sessionStartTime: number;
  
  // Actions
  updateLeaderboard: (playerProduction: number, playerTotalOre: number) => void;
  tickLeaderboard: (deltaTime: number) => void;
  recordTap: () => void;
  tickPlayTime: () => void;
  checkAchievements: (stats: { buildingsOwned: number; totalProduction: number; totalEarned: number }) => Achievement[];
  unlockAchievement: (id: string) => void;
}

const PHANTOM_NAMES = [
  'FactoryKing', 'IndustryPro', 'MegaBuilder', 'OreHunter',
  'SmelterMaster', 'ConveyorLord', 'RoboTycoon', 'ForgeMaster',
  'Tycoon99', 'BuildBot', 'AutoMogul', 'SteelBaron',
];

const ACHIEVEMENTS_TEMPLATE: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first_building', name: 'First Steps', description: 'Buy your first building' },
  { id: 'ten_buildings', name: 'Growing Fleet', description: 'Own 10 buildings' },
  { id: 'hundred_buildings', name: 'Industrial Empire', description: 'Own 100 buildings' },
  { id: 'first_k', name: 'Thousandaire', description: 'Earn 1,000 ore' },
  { id: 'first_m', name: 'Millionaire', description: 'Earn 1,000,000 ore' },
  { id: 'first_b', name: 'Billionaire', description: 'Earn 1,000,000,000 ore' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Reach 100 ore/sec production' },
  { id: 'speed_freak', name: 'Speed Freak', description: 'Reach 10,000 ore/sec production' },
  { id: 'speed_god', name: 'Speed God', description: 'Reach 1,000,000 ore/sec production' },
  { id: 'tap_master', name: 'Tap Master', description: 'Tap 100 times' },
  { id: 'dedicated', name: 'Dedicated', description: 'Play for 10 minutes' },
  { id: 'addicted', name: 'Addicted', description: 'Play for 1 hour' },
];

function generatePhantomPlayers(count: number): PhantomPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `phantom-${i}`,
    name: PHANTOM_NAMES[i % PHANTOM_NAMES.length] + (i >= PHANTOM_NAMES.length ? `_${i}` : ''),
    productionRate: Math.random() * 50 + 10,
    totalOre: Math.random() * 10000,
    rank: i + 1,
  })).sort((a, b) => b.totalOre - a.totalOre);
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      phantomPlayers: generatePhantomPlayers(10),
      playerRank: 11,
      achievements: ACHIEVEMENTS_TEMPLATE.map(a => ({ ...a, unlocked: false, unlockedAt: null })),
      totalTaps: 0,
      playTimeMinutes: 0,
      sessionStartTime: Date.now(),

      updateLeaderboard: (playerProduction: number, playerTotalOre: number) => {
        const { phantomPlayers } = get();
        
        // Update phantom players with slight random changes
        const updatedPhantoms = phantomPlayers.map(p => ({
          ...p,
          productionRate: p.productionRate * (0.98 + Math.random() * 0.04),
          totalOre: p.totalOre + p.productionRate,
        })).sort((a, b) => b.totalOre - a.totalOre);
        
        // Find player rank
        const allPlayers = [
          ...updatedPhantoms,
          { id: 'player', name: 'You', productionRate: playerProduction, totalOre: playerTotalOre, rank: 0 },
        ].sort((a, b) => b.totalOre - a.totalOre);
        
        const playerRank = allPlayers.findIndex(p => p.id === 'player') + 1;
        
        set({
          phantomPlayers: updatedPhantoms,
          playerRank,
        });
      },

      tickLeaderboard: (deltaTime: number) => {
        // Phantom players accumulate resources over time
        const { phantomPlayers } = get();
        
        set({
          phantomPlayers: phantomPlayers.map(p => ({
            ...p,
            totalOre: p.totalOre + p.productionRate * deltaTime * 0.1, // Slower accumulation
          })),
        });
      },

      recordTap: () => {
        set((state) => ({ totalTaps: state.totalTaps + 1 }));
      },

      tickPlayTime: () => {
        const { sessionStartTime } = get();
        const minutes = Math.floor((Date.now() - sessionStartTime) / 60000);
        
        set({ playTimeMinutes: minutes });
      },

      checkAchievements: (stats) => {
        const { achievements, totalTaps, playTimeMinutes } = get();
        const newlyUnlocked: Achievement[] = [];
        
        const checks: Record<string, boolean> = {
          first_building: stats.buildingsOwned >= 1,
          ten_buildings: stats.buildingsOwned >= 10,
          hundred_buildings: stats.buildingsOwned >= 100,
          first_k: stats.totalEarned >= 1000,
          first_m: stats.totalEarned >= 1000000,
          first_b: stats.totalEarned >= 1000000000,
          speed_demon: stats.totalProduction >= 100,
          speed_freak: stats.totalProduction >= 10000,
          speed_god: stats.totalProduction >= 1000000,
          tap_master: totalTaps >= 100,
          dedicated: playTimeMinutes >= 10,
          addicted: playTimeMinutes >= 60,
        };
        
        achievements.forEach(achievement => {
          if (!achievement.unlocked && checks[achievement.id]) {
            get().unlockAchievement(achievement.id);
            newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
          }
        });
        
        return newlyUnlocked;
      },

      unlockAchievement: (id: string) => {
        set((state) => ({
          achievements: state.achievements.map(a =>
            a.id === id ? { ...a, unlocked: true, unlockedAt: Date.now() } : a
          ),
        }));
      },
    }),
    {
      name: 'infinity-forge-player',
    }
  )
);
