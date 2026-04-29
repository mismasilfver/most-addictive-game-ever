/**
 * Prestige/Ascension Store
 * 
 * Manages the prestige/reset system where players sacrifice current progress
 * for permanent bonuses that accelerate future runs.
 * 
 * This creates an additional gameplay loop that extends player lifetime
 * indefinitely - each ascension reaches further than the last.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  type Ascension, 
  type AscensionReward,
  defaultAscension,
  calculateAscensionPoints,
  calculatePrestigeMultiplier,
  calculateOfflineEfficiency,
  calculateTapMultiplier,
  PRESTIGE_THRESHOLDS,
  ASCENSION_SHOP_ITEMS,
  canAscend as canAscendCheck,
  getPrestigeReadiness as getReadiness,
} from '../types/prestige';
import { telemetry } from '../telemetry';
import { TelemetryEventType } from '../telemetry/events';

interface PrestigeState {
  ascension: Ascension;
  previousMaxOre: number;
  totalAscensions: number;
  ascensionShopPurchases: Record<string, number>; // itemId -> count

  // Actions
  canAscend: (totalOreEarned: number, buildingCount: number) => boolean;
  ascend: (totalOreEarned: number, buildingCount: number, playTimeMinutes: number) => void;
  getPrestigeReadiness: (currentOre: number) => number;
  purchaseShopItem: (itemId: string) => boolean;
  getProductionMultiplier: () => number;
  getOfflineEfficiency: () => number;
  getTapMultiplier: () => number;
  getAscensionPoints: () => number;
}

export const usePrestigeStore = create<PrestigeState>()(
  persist(
    (set, get) => ({
      ascension: defaultAscension,
      previousMaxOre: 0,
      totalAscensions: 0,
      ascensionShopPurchases: {},

      canAscend: (totalOreEarned: number, buildingCount: number) => {
        return canAscendCheck(totalOreEarned) && buildingCount > 0;
      },

      ascend: (totalOreEarned: number, buildingCount: number, playTimeMinutes: number) => {
        const { ascension, totalAscensions, previousMaxOre } = get();

        // Check if can ascend
        if (!get().canAscend(totalOreEarned, buildingCount)) {
          return;
        }

        // Calculate points earned
        const pointsEarned = calculateAscensionPoints(totalOreEarned, buildingCount, playTimeMinutes);

        // Log the ascension event (important for telemetry)
        telemetry.logEvent(TelemetryEventType.SESSION_END, {
          screen: 'prestige_ascension',
          resourceAmount: totalOreEarned,
        });

        // Increment ascension level and add points
        const newLevel = ascension.level + 1;
        
        set({
          ascension: {
            level: newLevel,
            permanentBonuses: {
              productionMultiplier: calculatePrestigeMultiplier(newLevel),
              offlineEfficiency: calculateOfflineEfficiency(newLevel),
              tapBonusMultiplier: calculateTapMultiplier(newLevel),
            },
            ascensionPoints: ascension.ascensionPoints + pointsEarned,
            unlocks: newLevel === 1 ? ['ascension_shop'] : ascension.unlocks,
          },
          previousMaxOre: Math.max(previousMaxOre, totalOreEarned),
          totalAscensions: totalAscensions + 1,
        });

        // Log ascension completion
        telemetry.logEvent(TelemetryEventType.MANIPULATION_DEPLOYED, {
          interventionType: 'prestige_completion',
          success: true,
        });
      },

      getPrestigeReadiness: (currentOre: number) => {
        const { previousMaxOre } = get();
        return getReadiness(currentOre, previousMaxOre);
      },

      purchaseShopItem: (itemId: string) => {
        const { ascension, ascensionShopPurchases } = get();
        
        // Find the item
        const item = ASCENSION_SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return false;

        // Check if already maxed out
        const currentPurchases = ascensionShopPurchases[itemId] || 0;
        if (currentPurchases >= item.maxPurchases) {
          return false;
        }

        // Check if has enough points
        if (ascension.ascensionPoints < item.cost) {
          return false;
        }

        // Deduct points and apply upgrade
        const newState = item.apply({
          resources: { ore: { amount: 0, totalEarned: 0 } },
          buildings: [],
          ascension,
        });

        set({
          ascension: {
            ...newState.ascension!,
            ascensionPoints: ascension.ascensionPoints - item.cost, // Deduct cost
          },
          ascensionShopPurchases: {
            ...ascensionShopPurchases,
            [itemId]: currentPurchases + 1,
          },
        });

        // Log purchase
        telemetry.logEvent(TelemetryEventType.PURCHASE_COMPLETED, {
          offerId: itemId,
          offerPrice: item.cost,
        });

        return true;
      },

      getProductionMultiplier: () => {
        return get().ascension.permanentBonuses.productionMultiplier;
      },

      getOfflineEfficiency: () => {
        return get().ascension.permanentBonuses.offlineEfficiency;
      },

      getTapMultiplier: () => {
        return get().ascension.permanentBonuses.tapBonusMultiplier;
      },

      getAscensionPoints: () => {
        return get().ascension.ascensionPoints;
      },
    }),
    {
      name: 'infinity-forge-prestige',
    }
  )
);
