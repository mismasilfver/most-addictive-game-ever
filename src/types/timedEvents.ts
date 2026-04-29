/**
 * Time-Gated Content & FOMO System
 * 
 * Implements time-limited events, rush hours, and flash sales
 * to create urgency and habit formation through temporal patterns.
 * 
 * Psychological Principle: Loss Aversion + Habit Formation + Scarcity
 */

export type TimedEventType = 'rush_hour' | 'happy_hour' | 'weekend_boost' | 'flash_sale';

export interface TimedEvent {
  id: string;
  type: TimedEventType;
  startTime: number; // timestamp
  endTime: number; // timestamp
  bonuses: {
    productionMultiplier: number;
    crateSpawnRate: number;
    rewardMultiplier: number;
  };
  notificationSent: boolean;
}

export interface RushHourWindow {
  name: string;
  startHour: number; // 0-23
  endHour: number; // 0-23
  bonuses: {
    productionMultiplier: number;
    crateSpawnRate: number;
    tapMultiplier: number;
  };
  description: string;
}

export interface FlashSale {
  id: string;
  itemId: string;
  originalCost: number;
  saleCost: number;
  expiresAt: number; // timestamp
  remainingQuantity: number; // "Only 3 left!"
  viewersCount?: number; // "X people viewing now"
}

export interface LimitedOffer {
  id: string;
  name: string;
  price: number;
  originalValue: number;
  items: string[];
  expiresAt: number;
  maxPurchases: number;
  purchasesRemaining: number;
  requiresInactive?: number; // Shows after X hours inactive
}

/**
 * Rush hour time windows (habit stacking with daily routines)
 */
export const RUSH_HOUR_WINDOWS: RushHourWindow[] = [
  {
    name: 'Morning Rush',
    startHour: 7,
    endHour: 9,
    bonuses: {
      productionMultiplier: 1.5,
      crateSpawnRate: 1.0,
      tapMultiplier: 1.0,
    },
    description: 'Start your day with boosted production!',
  },
  {
    name: 'Lunch Break',
    startHour: 12,
    endHour: 13,
    bonuses: {
      productionMultiplier: 1.0,
      crateSpawnRate: 2.0, // Double crate spawns
      tapMultiplier: 1.0,
    },
    description: 'Quick session? Double crate spawns!',
  },
  {
    name: 'Evening Grind',
    startHour: 18,
    endHour: 22,
    bonuses: {
      productionMultiplier: 1.0,
      crateSpawnRate: 1.0,
      tapMultiplier: 2.0, // Double tap rewards
    },
    description: 'After-work relaxation with boosted taps!',
  },
  {
    name: 'Night Owl',
    startHour: 0,
    endHour: 2,
    bonuses: {
      productionMultiplier: 2.0,
      crateSpawnRate: 1.5,
      tapMultiplier: 1.0,
    },
    description: 'Late night? Maximum production boost!',
  },
];

/**
 * Weekend boost configuration
 */
export const WEEKEND_BOOST = {
  saturday: {
    productionMultiplier: 1.25,
    crateSpawnRate: 1.25,
    rewardMultiplier: 1.25,
  },
  sunday: {
    productionMultiplier: 1.25,
    crateSpawnRate: 1.25,
    rewardMultiplier: 1.25,
  },
};

/**
 * Flash sale duration (15 minutes to create urgency)
 */
export const FLASH_SALE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Limited time offers
 */
export const LIMITED_OFFERS: Omit<LimitedOffer, 'expiresAt' | 'purchasesRemaining'>[] = [
  {
    id: 'starter_pack',
    name: 'New Manager Starter Pack',
    price: 4.99,
    originalValue: 50.00,
    items: ['legendary_crate', 'instant_ore_10000', 'premium_building'],
    maxPurchases: 1,
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior Bundle',
    price: 9.99,
    originalValue: 100.00,
    items: ['multi_tickets', 'production_boost', 'auto_collector'],
    maxPurchases: 2,
    requiresInactive: 12 * 60 * 60 * 1000, // Shows after 12h inactive
  },
  {
    id: 'emergency_resources',
    name: 'Emergency Resource Pack',
    price: 2.99,
    originalValue: 25.00,
    items: ['instant_ore_5000', 'crate_rush'],
    maxPurchases: 3,
  },
];

/**
 * Check if a timed event is currently active
 */
export function isTimedEventActive(event: TimedEvent): boolean {
  const now = Date.now();
  return now >= event.startTime && now < event.endTime;
}

/**
 * Get time remaining for an active event
 */
export function getEventTimeRemaining(event: TimedEvent): number {
  if (!isTimedEventActive(event)) return 0;
  return Math.max(0, event.endTime - Date.now());
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get current active rush hour (if any)
 */
export function getCurrentRushHour(): RushHourWindow | null {
  const now = new Date();
  const currentHour = now.getHours();

  return RUSH_HOUR_WINDOWS.find(
    window => currentHour >= window.startHour && currentHour < window.endHour
  ) || null;
}

/**
 * Get next upcoming rush hour
 */
export function getNextRushHour(): RushHourWindow | null {
  const now = new Date();
  const currentHour = now.getHours();

  // Find next window today
  const nextToday = RUSH_HOUR_WINDOWS.find(window => window.startHour > currentHour);
  if (nextToday) return nextToday;

  // Return first window tomorrow (morning rush)
  return RUSH_HOUR_WINDOWS[0] || null;
}

/**
 * Get time until next rush hour starts
 */
export function getTimeUntilNextRushHour(): number {
  const next = getNextRushHour();
  if (!next) return 0;

  const now = new Date();
  const target = new Date(now);

  if (next.startHour > now.getHours()) {
    // Later today
    target.setHours(next.startHour, 0, 0, 0);
  } else {
    // Tomorrow
    target.setDate(target.getDate() + 1);
    target.setHours(next.startHour, 0, 0, 0);
  }

  return Math.max(0, target.getTime() - now.getTime());
}

/**
 * Check if it's weekend
 */
export function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get weekend boost multipliers
 */
export function getWeekendBoost(): { active: boolean; bonuses: typeof WEEKEND_BOOST.saturday } {
  const day = new Date().getDay();
  if (day === 6) {
    return { active: true, bonuses: WEEKEND_BOOST.saturday };
  }
  if (day === 0) {
    return { active: true, bonuses: WEEKEND_BOOST.sunday };
  }
  return { active: false, bonuses: { productionMultiplier: 1, crateSpawnRate: 1, rewardMultiplier: 1 } };
}

/**
 * Generate a flash sale
 */
export function generateFlashSale(itemId: string, discountPercent: number = 25): FlashSale {
  const now = Date.now();
  const baseCost = 1000; // Base item cost

  return {
    id: `flash-${now}`,
    itemId,
    originalCost: baseCost,
    saleCost: Math.floor(baseCost * (1 - discountPercent / 100)),
    expiresAt: now + FLASH_SALE_DURATION,
    remainingQuantity: Math.floor(Math.random() * 5) + 3, // 3-8 remaining
    viewersCount: Math.floor(Math.random() * 50) + 10, // 10-60 viewing
  };
}

/**
 * Check if flash sale should be shown
 */
export function shouldShowFlashSale(
  playerProfile: {
    lastPurchaseTime?: number;
    totalPlayTime: number;
  },
  chance: number = 0.15
): boolean {
  // Don't show if recently purchased (within 24 hours)
  if (playerProfile.lastPurchaseTime) {
    const hoursSincePurchase = (Date.now() - playerProfile.lastPurchaseTime) / (1000 * 60 * 60);
    if (hoursSincePurchase < 24) return false;
  }

  // Only show to engaged players (played at least 30 minutes)
  if (playerProfile.totalPlayTime < 30 * 60 * 1000) return false;

  return Math.random() < chance;
}

/**
 * Get next upcoming timed event
 */
export function getNextEvent(events: TimedEvent[]): TimedEvent | null {
  const now = Date.now();
  const futureEvents = events.filter(e => e.startTime > now);

  if (futureEvents.length === 0) return null;

  return futureEvents.sort((a, b) => a.startTime - b.startTime)[0];
}

/**
 * Calculate active multipliers from all sources
 */
export function calculateActiveMultipliers(
  rushHour: RushHourWindow | null,
  weekendBoost: { active: boolean; bonuses: typeof WEEKEND_BOOST.saturday },
  activeEvents: TimedEvent[]
): {
  productionMultiplier: number;
  crateSpawnRate: number;
  tapMultiplier: number;
  rewardMultiplier: number;
} {
  let production = 1;
  let crateSpawn = 1;
  let tap = 1;
  let reward = 1;

  // Apply rush hour bonuses
  if (rushHour) {
    production *= rushHour.bonuses.productionMultiplier;
    crateSpawn *= rushHour.bonuses.crateSpawnRate;
    tap *= rushHour.bonuses.tapMultiplier;
  }

  // Apply weekend boost
  if (weekendBoost.active) {
    production *= weekendBoost.bonuses.productionMultiplier;
    crateSpawn *= weekendBoost.bonuses.crateSpawnRate;
    reward *= weekendBoost.bonuses.rewardMultiplier;
  }

  // Apply active events
  activeEvents.forEach(event => {
    if (isTimedEventActive(event)) {
      production *= event.bonuses.productionMultiplier;
      crateSpawn *= event.bonuses.crateSpawnRate;
      reward *= event.bonuses.rewardMultiplier;
    }
  });

  return {
    productionMultiplier: production,
    crateSpawnRate: crateSpawn,
    tapMultiplier: tap,
    rewardMultiplier: reward,
  };
}
