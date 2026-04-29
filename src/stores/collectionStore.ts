/**
 * Collection/Gacha Store
 * 
 * Manages collectible items, gacha pulls, pity system,
 * and collection completion tracking.
 * 
 * Exploits: Completionism + Gambling psychology + Sunk cost
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Collectible, 
  CollectionSet, 
  CollectibleRarity,
} from '../types/collection';
import type {
  GachaBanner, 
  GachaPullResult,
  PullHistoryEntry,
} from '../types/gacha';
import { 
  COLLECTION_SETS, 
  COLLECTIBLE_RARITIES, 
  rollCollectibleRarity,
  generateCollectible,
  calculateCollectibleBonus,
  calculateDuplicateValue,
} from '../types/collection';
import { 
  PITY_SYSTEM, 
  calculatePityProbability,
} from '../types/gacha';
import { telemetry } from '../telemetry';
import { TelemetryEventType } from '../telemetry/events';

interface CollectionState {
  // Collection data
  collectibles: Collectible[];
  sets: CollectionSet[];
  stardust: number;

  // Gacha state
  activeBanner: GachaBanner | null;
  pityCounter: number;
  pullHistory: PullHistoryEntry[];

  // Actions
  gachaPull: (count: number) => GachaPullResult;
  convertDuplicates: () => number; // Returns stardust earned
  setActiveBanner: (banner: GachaBanner | null) => void;
  getCompletionStats: () => {
    totalOwned: number;
    totalAvailable: number;
    overallPercentage: number;
    setStats: Array<{
      set: CollectionSet;
      ownedCount: number;
      totalCount: number;
      percentage: number;
      isComplete: boolean;
    }>;
  };
  getTotalBonus: (type: Collectible['bonus']['type']) => number;
  getSetBonus: (setId: string) => number;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      collectibles: [],
      sets: COLLECTION_SETS.map(setTemplate => ({
        ...setTemplate,
        collectibles: [], // Will be populated as items are generated
      })),
      stardust: 0,
      activeBanner: null,
      pityCounter: 0,
      pullHistory: [],

      gachaPull: (count: number) => {
        const { collectibles, activeBanner, pityCounter, pullHistory } = get();
        const pulledItems: Collectible[] = [];
        let currentPity = pityCounter;
        let isFeaturedPull = false;
        let totalValue = 0;
        let pityTriggered = false;

        // Perform pulls
        for (let i = 0; i < count; i++) {
          currentPity++;

          // Calculate probability for this pull
          const legendaryProbability = calculatePityProbability(currentPity);
          
          // Roll for rarity
          let rarity: CollectibleRarity;
          
          // Check for guaranteed legendary at hard pity
          if (currentPity >= PITY_SYSTEM.hardPity) {
            rarity = 'legendary';
            pityTriggered = true;
          } else {
            // Roll with modified probability
            const roll = Math.random();
            if (roll < legendaryProbability) {
              rarity = roll < legendaryProbability * 0.1 ? 'mythic' : 'legendary';
              pityTriggered = true;
            } else {
              rarity = rollCollectibleRarity();
            }
          }

          // Check for featured item
          const isFeatured = activeBanner && 
            Math.random() < activeBanner.featuredRate &&
            rarity === 'legendary';

          if (isFeatured) {
            isFeaturedPull = true;
          }

          // Generate collectible
          const setId = activeBanner?.featuredItem || 'standard';
          const category = ['blueprint', 'artifact', 'medal', 'skin'][Math.floor(Math.random() * 4)] as Collectible['category'];
          
          const newCollectible = generateCollectible(setId, rarity, category);
          newCollectible.discoveredAt = Date.now();

          // Check if already owned (dupe system)
          const existingIndex = collectibles.findIndex(c => c.id === newCollectible.id);
          if (existingIndex >= 0) {
            // Increment duplicates
            const updatedCollectibles = [...collectibles];
            updatedCollectibles[existingIndex].duplicates++;
            set({ collectibles: updatedCollectibles });
          } else {
            // New item
            pulledItems.push(newCollectible);
          }

          // Calculate value for display
          const rarityConfig = COLLECTIBLE_RARITIES.find(r => r.tier === rarity);
          totalValue += (rarityConfig?.bonusMultiplier || 1) * 100;

          // Reset pity on legendary/mythic
          if (rarity === 'legendary' || rarity === 'mythic') {
            currentPity = 0;
          }

          // Log pull
          telemetry.logEvent(TelemetryEventType.CRATE_OPENED, {
            crateRarity: rarity,
            resourceAmount: totalValue,
          });
        }

        // Add new items to collection
        const updatedCollectibles = [...collectibles, ...pulledItems];

        // Create pull history entries
        const newHistoryEntries: PullHistoryEntry[] = pulledItems.map(item => ({
          timestamp: Date.now(),
          bannerId: activeBanner?.id || 'standard',
          itemId: item.id,
          rarity: item.rarity,
          wasFeatured: isFeaturedPull,
          pityAtPull: currentPity,
        }));

        set({
          collectibles: updatedCollectibles,
          pityCounter: currentPity,
          pullHistory: [...pullHistory, ...newHistoryEntries],
        });

        return {
          items: pulledItems,
          pityCounter: currentPity,
          isFeatured: isFeaturedPull,
          totalValue,
          pityTriggered,
        };
      },

      convertDuplicates: () => {
        const { collectibles, stardust } = get();
        
        let stardustEarned = 0;
        const updatedCollectibles = collectibles.map(collectible => {
          if (collectible.duplicates > 0) {
            const value = calculateDuplicateValue(collectible);
            stardustEarned += value;
            return { ...collectible, duplicates: 0 };
          }
          return collectible;
        });

        if (stardustEarned > 0) {
          set({
            collectibles: updatedCollectibles,
            stardust: stardust + stardustEarned,
          });

          telemetry.logEvent(TelemetryEventType.RESOURCE_EARNED, {
            resourceType: 'stardust',
            resourceAmount: stardustEarned,
          });
        }

        return stardustEarned;
      },

      setActiveBanner: (banner: GachaBanner | null) => {
        // Pity carries over between banners (industry standard)
        const { pityCounter } = get();
        
        set({ 
          activeBanner: banner,
          // Keep current pity if switching banners (carryOver)
          pityCounter,
        });

        if (banner) {
          telemetry.logEvent(TelemetryEventType.SCREEN_VIEW, {
            screen: `gacha_banner_${banner.id}`,
          });
        }
      },

      getCompletionStats: () => {
        const { collectibles, sets } = get();
        
        const totalOwned = collectibles.filter(c => c.owned).length;
        const totalAvailable = sets.reduce((sum, set) => sum + set.collectibles.length, 0);
        const overallPercentage = totalAvailable > 0 
          ? Math.round((totalOwned / totalAvailable) * 100) 
          : 0;

        const setStats = sets.map(set => {
          const setCollectibles = collectibles.filter(c => set.collectibles.includes(c.id));
          const ownedCount = setCollectibles.filter(c => c.owned).length;
          const totalCount = set.collectibles.length;
          const percentage = totalCount > 0 
            ? Math.round((ownedCount / totalCount) * 100) 
            : 0;

          return {
            set,
            ownedCount,
            totalCount,
            percentage,
            isComplete: ownedCount === totalCount,
          };
        });

        return {
          totalOwned,
          totalAvailable,
          overallPercentage,
          setStats,
        };
      },

      getTotalBonus: (type: Collectible['bonus']['type']) => {
        const { collectibles } = get();
        return calculateCollectibleBonus(collectibles, type);
      },

      getSetBonus: (setId: string) => {
        const { collectibles, sets } = get();
        const set = sets.find(s => s.id === setId);
        
        if (!set) return 1.0;

        const setCollectibles = collectibles.filter(
          c => set.collectibles.includes(c.id) && c.owned
        );
        
        const isComplete = setCollectibles.length === set.collectibles.length;
        
        return isComplete ? set.completionBonus.multiplier : 1.0;
      },
    }),
    {
      name: 'infinity-forge-collection',
    }
  )
);
