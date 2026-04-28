import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Custom render that wraps components with providers if needed
function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const user = userEvent.setup();
  
  return {
    user,
    ...rtlRender(ui, options),
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { render };

// Helper to wait for a specific amount of time
export const wait = (ms: number) => 
  new Promise((resolve) => setTimeout(resolve, ms));

// Helper to create a mock Zustand store for testing
export const createMockStore = <T,>(initialState: T) => {
  let state = initialState;
  const listeners = new Set<(state: T) => void>();

  return {
    getState: () => state,
    setState: (newState: Partial<T>) => {
      state = { ...state, ...newState };
      listeners.forEach((listener) => listener(state));
    },
    subscribe: (listener: (state: T) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
