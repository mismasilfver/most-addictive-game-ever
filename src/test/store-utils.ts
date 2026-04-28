import { act } from '@testing-library/react';

// Helper to reset Zustand stores between tests
// Usage: In your test file, import the store and call resetStore
export function resetStore<T extends { getState: () => any; setState: (state: any) => void }>(
  store: T,
  initialState: any
): void {
  act(() => {
    store.setState(initialState);
  });
}

// Helper to wait for Zustand state updates
export async function waitForStoreUpdate<T>(
  store: { getState: () => T; subscribe: (listener: (state: T) => void) => () => void },
  predicate: (state: T) => boolean,
  timeout = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const unsubscribe = store.subscribe((state) => {
      if (predicate(state)) {
        unsubscribe();
        resolve(state);
      }
    });

    setTimeout(() => {
      unsubscribe();
      reject(new Error('Timeout waiting for store update'));
    }, timeout);

    // Check current state immediately
    const currentState = store.getState();
    if (predicate(currentState)) {
      unsubscribe();
      resolve(currentState);
    }
  });
}

// Mock factory for creating test data
export const mockFactories = {
  building: (overrides = {}) => ({
    id: 'test-building-1',
    name: 'Test Smelter',
    description: 'A test building',
    icon: '🔨',
    baseCost: 10,
    baseProduction: 1,
    level: 1,
    owned: 1,
    unlocked: true,
    ...overrides,
  }),

  crate: (overrides = {}) => ({
    id: 'test-crate-1',
    rarity: 'common',
    amount: 100,
    expiresAt: Date.now() + 3600000,
    opened: false,
    ...overrides,
  }),

  achievement: (overrides = {}) => ({
    id: 'test-achievement',
    name: 'Test Achievement',
    description: 'A test achievement',
    unlocked: false,
    unlockedAt: null,
    ...overrides,
  }),

  player: (overrides = {}) => ({
    id: 'player-1',
    name: 'Test Player',
    productionRate: 100,
    totalOre: 1000,
    rank: 11,
    ...overrides,
  }),
};
