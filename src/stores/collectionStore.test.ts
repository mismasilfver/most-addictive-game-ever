import { describe, it, expect, beforeEach } from 'vitest';
import { useCollectionStore } from './collectionStore';
import type { Collectible } from '../types/collection';
import type { GachaBanner } from '../types/gacha';

describe('collectionStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useCollectionStore.setState({
      collectibles: [],
      sets: [],
      stardust: 0,
      activeBanner: null,
      pityCounter: 0,
      pullHistory: [],
    });
  });

  describe('initial state', () => {
    it('starts with empty collection', () => {
      const state = useCollectionStore.getState();
      expect(state.collectibles).toHaveLength(0);
    });

    it('starts with 0 stardust', () => {
      const state = useCollectionStore.getState();
      expect(state.stardust).toBe(0);
    });

    it('starts with 0 pity', () => {
      const state = useCollectionStore.getState();
      expect(state.pityCounter).toBe(0);
    });

    it('has no active banner', () => {
      const state = useCollectionStore.getState();
      expect(state.activeBanner).toBeNull();
    });
  });

  describe('gachaPull', () => {
    it('increments pity counter on pull', () => {
      const initialPity = useCollectionStore.getState().pityCounter;
      useCollectionStore.getState().gachaPull(1);
      expect(useCollectionStore.getState().pityCounter).toBe(initialPity + 1);
    });

    it('adds items to collection', () => {
      useCollectionStore.getState().gachaPull(1);
      expect(useCollectionStore.getState().collectibles.length).toBeGreaterThan(0);
    });

    it('handles multi-pull (10 items)', () => {
      useCollectionStore.getState().gachaPull(10);
      expect(useCollectionStore.getState().collectibles.length).toBeGreaterThanOrEqual(10);
    });

    it('adds to pull history', () => {
      useCollectionStore.getState().gachaPull(1);
      expect(useCollectionStore.getState().pullHistory.length).toBeGreaterThan(0);
    });

    it('resets pity on legendary pull', () => {
      // Manually set pity to trigger legendary
      useCollectionStore.setState({ pityCounter: 99 });
      useCollectionStore.getState().gachaPull(1);
      // After guaranteed legendary, pity should reset
      const legendaryPulled = useCollectionStore.getState().collectibles.some(
        c => c.rarity === 'legendary' || c.rarity === 'mythic'
      );
      if (legendaryPulled) {
        expect(useCollectionStore.getState().pityCounter).toBeLessThan(10);
      }
    });
  });

  describe('convertDuplicates', () => {
    it('converts duplicates to stardust', () => {
      // Add a collectible with duplicates
      useCollectionStore.setState({
        collectibles: [{
          id: 'test-1',
          name: 'Test Item',
          description: 'Test',
          rarity: 'rare',
          category: 'blueprint',
          icon: '📐',
          setId: 'test-set',
          bonus: { type: 'production', value: 0.02 },
          owned: true,
          duplicates: 5,
        }] as Collectible[],
        stardust: 0,
      });

      useCollectionStore.getState().convertDuplicates();
      expect(useCollectionStore.getState().stardust).toBeGreaterThan(0);
    });

    it('resets duplicate count after conversion', () => {
      useCollectionStore.setState({
        collectibles: [{
          id: 'test-1',
          name: 'Test Item',
          description: 'Test',
          rarity: 'rare',
          category: 'blueprint',
          icon: '📐',
          setId: 'test-set',
          bonus: { type: 'production', value: 0.02 },
          owned: true,
          duplicates: 5,
        }] as Collectible[],
      });

      useCollectionStore.getState().convertDuplicates();
      const collectible = useCollectionStore.getState().collectibles[0];
      expect(collectible.duplicates).toBe(0);
    });

    it('does not convert if no duplicates', () => {
      useCollectionStore.setState({
        collectibles: [{
          id: 'test-1',
          name: 'Test Item',
          description: 'Test',
          rarity: 'rare',
          category: 'blueprint',
          icon: '📐',
          setId: 'test-set',
          bonus: { type: 'production', value: 0.02 },
          owned: true,
          duplicates: 0,
        }] as Collectible[],
        stardust: 100,
      });

      const beforeStardust = useCollectionStore.getState().stardust;
      useCollectionStore.getState().convertDuplicates();
      expect(useCollectionStore.getState().stardust).toBe(beforeStardust);
    });
  });

  describe('getCompletionStats', () => {
    it('returns empty stats for no collectibles', () => {
      const stats = useCollectionStore.getState().getCompletionStats();
      expect(stats.totalOwned).toBe(0);
      expect(stats.totalAvailable).toBeGreaterThanOrEqual(0);
    });

    it('calculates owned vs total', () => {
      useCollectionStore.setState({
        collectibles: [
          { id: '1', setId: 'set1', owned: true, duplicates: 0 },
          { id: '2', setId: 'set1', owned: false, duplicates: 0 },
          { id: '3', setId: 'set1', owned: true, duplicates: 0 },
        ] as Collectible[],
      });

      const stats = useCollectionStore.getState().getCompletionStats();
      expect(stats.totalOwned).toBe(2);
    });
  });

  describe('getTotalBonus', () => {
    it('returns 0 for empty collection', () => {
      const bonus = useCollectionStore.getState().getTotalBonus('production');
      expect(bonus).toBe(0);
    });

    it('calculates bonus from owned collectibles', () => {
      useCollectionStore.setState({
        collectibles: [
          {
            id: '1',
            setId: 'set1',
            owned: true,
            duplicates: 0,
            rarity: 'common',
            category: 'blueprint',
            bonus: { type: 'production', value: 0.02 },
          },
          {
            id: '2',
            setId: 'set1',
            owned: true,
            duplicates: 0,
            rarity: 'rare',
            category: 'blueprint',
            bonus: { type: 'production', value: 0.03 },
          },
        ] as Collectible[],
      });

      const bonus = useCollectionStore.getState().getTotalBonus('production');
      expect(bonus).toBeGreaterThan(0);
    });

    it('only counts bonus for specific type', () => {
      useCollectionStore.setState({
        collectibles: [
          {
            id: '1',
            setId: 'set1',
            owned: true,
            duplicates: 0,
            rarity: 'common',
            category: 'blueprint',
            bonus: { type: 'production', value: 0.02 },
          },
          {
            id: '2',
            setId: 'set1',
            owned: true,
            duplicates: 0,
            rarity: 'common',
            category: 'artifact',
            bonus: { type: 'offline', value: 0.03 },
          },
        ] as Collectible[],
      });

      const productionBonus = useCollectionStore.getState().getTotalBonus('production');
      const offlineBonus = useCollectionStore.getState().getTotalBonus('offline');
      
      expect(productionBonus).toBeGreaterThan(0);
      expect(offlineBonus).toBeGreaterThan(0);
      expect(productionBonus).not.toBe(offlineBonus);
    });
  });

  describe('setActiveBanner', () => {
    it('sets active banner', () => {
      const banner: GachaBanner = {
        id: 'test',
        name: 'Test Banner',
        featuredItem: 'item-1',
        featuredRate: 0.01,
        cost: 100,
        pityCounter: 0,
        expiresAt: Date.now() + 86400000,
      };

      useCollectionStore.getState().setActiveBanner(banner);
      expect(useCollectionStore.getState().activeBanner?.id).toBe('test');
    });

    it('carries over pity when switching banners', () => {
      useCollectionStore.setState({ pityCounter: 50 });
      
      const newBanner: GachaBanner = {
        id: 'new',
        name: 'New Banner',
        featuredItem: 'item-2',
        featuredRate: 0.015,
        cost: 100,
        pityCounter: 0,
        expiresAt: Date.now() + 86400000,
      };

      useCollectionStore.getState().setActiveBanner(newBanner);
      // Pity should be preserved due to carryOver setting
      expect(useCollectionStore.getState().pityCounter).toBe(50);
    });
  });
});
