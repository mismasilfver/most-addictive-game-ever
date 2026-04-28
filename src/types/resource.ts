export type ResourceType = 'ore' | 'alloy' | 'component' | 'module';

export interface Resource {
  type: ResourceType;
  amount: number;
  totalEarned: number;
  totalSpent: number;
}

export const RESOURCE_NAMES: Record<ResourceType, string> = {
  ore: 'Raw Ore',
  alloy: 'Metal Alloy',
  component: 'Components',
  module: 'Modules',
};

export const RESOURCE_ICONS: Record<ResourceType, string> = {
  ore: '⛏️',
  alloy: '🔩',
  component: '🔌',
  module: '💾',
};

export const RESOURCE_COLORS: Record<ResourceType, string> = {
  ore: 'text-gray-400',
  alloy: 'text-orange-400',
  component: 'text-blue-400',
  module: 'text-purple-400',
};

export function formatNumber(num: number): string {
  if (num < 1000) return Math.floor(num).toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
  return (num / 1000000000000).toFixed(1) + 'T';
}
