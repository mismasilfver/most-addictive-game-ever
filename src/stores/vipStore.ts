import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  calculateVIPLevel,
  getVIPBenefits,
  PREMIUM_SHOP_ITEMS,
  VIP_LEVELS,
} from '../types/vip';

interface VIPState {
  xp: number;
  level: number;
  gems: number;
  ownedItems: string[];

  addXP: (amount: number) => void;
  addGems: (amount: number) => void;
  purchaseItem: (itemId: string) => boolean;
  getProductionBonus: () => number;
  getProgressToNextLevel: () => number;
}

export const useVIPStore = create<VIPState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 0,
      gems: 0,
      ownedItems: [],

      addXP: (amount: number) => {
        const newXP = get().xp + amount;
        const newLevel = calculateVIPLevel(newXP);
        set({ xp: newXP, level: newLevel });
      },

      addGems: (amount: number) => {
        set({ gems: get().gems + amount });
      },

      purchaseItem: (itemId: string): boolean => {
        const item = PREMIUM_SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return false;

        const { gems } = get();
        if (gems < item.gemCost) return false;

        set({
          gems: gems - item.gemCost,
          ownedItems: [...get().ownedItems, itemId],
        });
        return true;
      },

      getProductionBonus: () => {
        const { level } = get();
        return getVIPBenefits(level).productionBonus;
      },

      getProgressToNextLevel: () => {
        const { xp, level } = get();
        if (level >= 10) return 100;

        const currentConfig = VIP_LEVELS.find(c => c.level === level);
        const nextConfig = VIP_LEVELS.find(c => c.level === level + 1);
        if (!nextConfig) return 100;

        const currentThreshold = currentConfig?.xpRequired ?? 0;
        const range = nextConfig.xpRequired - currentThreshold;
        const progress = xp - currentThreshold;

        return Math.min(100, Math.max(0, Math.floor((progress / range) * 100)));
      },
    }),
    { name: 'infinity-forge-vip' }
  )
);
