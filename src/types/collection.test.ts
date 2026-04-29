import { describe, it, expect } from 'vitest';
import { 
  generateCollectibleId, 
  calculateCompletionPercentage,
  type Collectible,
  type CollectionSet,
  COLLECTIBLE_RARITIES,
} from './collection';

describe('collection system', () => {
  describe('generateCollectibleId', () => {
    it('generates unique IDs', () => {
      const id1 = generateCollectibleId();
      const id2 = generateCollectibleId();
      expect(id1).not.toBe(id2);
    });

    it('generates string IDs', () => {
      const id = generateCollectibleId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('calculateCompletionPercentage', () => {
    it('returns 0 for empty collection', () => {
      const percentage = calculateCompletionPercentage([], 10);
      expect(percentage).toBe(0);
    });

    it('returns 100 when all items collected', () => {
      const ownedItems: Collectible[] = [
        { id: '1', setId: 'set1', owned: true, duplicates: 0 },
        { id: '2', setId: 'set1', owned: true, duplicates: 0 },
      ] as Collectible[];
      const percentage = calculateCompletionPercentage(ownedItems, 2);
      expect(percentage).toBe(100);
    });

    it('returns 50 for half completion', () => {
      const ownedItems: Collectible[] = [
        { id: '1', setId: 'set1', owned: true, duplicates: 0 },
        { id: '2', setId: 'set1', owned: false, duplicates: 0 },
      ] as Collectible[];
      const percentage = calculateCompletionPercentage(ownedItems, 2);
      expect(percentage).toBe(50);
    });

    it('only counts owned items', () => {
      const ownedItems: Collectible[] = [
        { id: '1', setId: 'set1', owned: true, duplicates: 0 },
        { id: '2', setId: 'set1', owned: false, duplicates: 0 },
        { id: '3', setId: 'set1', owned: false, duplicates: 0 },
      ] as Collectible[];
      const percentage = calculateCompletionPercentage(ownedItems, 3);
      expect(percentage).toBe(33); // Rounded to nearest integer
    });
  });

  describe('COLLECTIBLE_RARITIES', () => {
    it('has all rarity tiers', () => {
      expect(COLLECTIBLE_RARITIES).toHaveLength(6);
      const tiers = COLLECTIBLE_RARITIES.map(r => r.tier);
      expect(tiers).toContain('common');
      expect(tiers).toContain('uncommon');
      expect(tiers).toContain('rare');
      expect(tiers).toContain('epic');
      expect(tiers).toContain('legendary');
      expect(tiers).toContain('mythic');
    });

    it('has decreasing drop rates for higher rarities', () => {
      const rates = COLLECTIBLE_RARITIES.map(r => r.dropRate);
      // Common should have highest rate
      expect(rates[0]).toBeGreaterThan(rates[1]);
      // Mythic should have lowest rate
      expect(rates[4]).toBeGreaterThan(rates[5]);
    });

    it('has bonus multipliers for each rarity', () => {
      COLLECTIBLE_RARITIES.forEach(rarity => {
        expect(rarity.bonusMultiplier).toBeGreaterThan(0);
      });
    });
  });

  describe('collection set structure', () => {
    it('has required properties', () => {
      const set: CollectionSet = {
        id: 'test-set',
        name: 'Test Collection',
        description: 'A test collection',
        collectibles: ['item1', 'item2', 'item3'],
        completionBonus: {
          description: 'Complete for 2x production',
          multiplier: 2.0,
        },
      };

      expect(set.id).toBe('test-set');
      expect(set.name).toBe('Test Collection');
      expect(set.collectibles).toHaveLength(3);
      expect(set.completionBonus.multiplier).toBe(2.0);
    });
  });
});
