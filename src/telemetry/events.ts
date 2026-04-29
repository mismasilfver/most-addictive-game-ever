/**
 * Telemetry Event Types
 * 
 * Every user interaction is logged and analyzed to maximize addiction
 * and identify "whales" for targeted monetization.
 */

export enum TelemetryEventType {
  // Session lifecycle
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  APP_FOREGROUND = 'app_foreground',
  APP_BACKGROUND = 'app_background',
  
  // Engagement - Every tap, swipe, pause
  SCREEN_VIEW = 'screen_view',
  TAPS_PER_MINUTE = 'taps_per_minute',
  IDLE_TIME = 'idle_time',
  SCROLL_DEPTH = 'scroll_depth',
  RAGE_TAP = 'rage_tap',  // Multiple taps on same spot (frustration)
  HESITATION = 'hesitation',  // Pause before action
  
  // Economic - All resource flows
  RESOURCE_EARNED = 'resource_earned',
  RESOURCE_SPENT = 'resource_spent',
  BUILDING_PURCHASED = 'building_purchased',
  BUILDING_PURCHASE_FAILED = 'building_purchase_failed',
  UPGRADE_ATTEMPT = 'upgrade_attempt',
  UPGRADE_COMPLETED = 'upgrade_completed',
  UPGRADE_FAILED = 'upgrade_failed',
  
  // Reward systems - Addiction triggers
  CRATE_SPAWNED = 'crate_spawned',
  CRATE_OPENED = 'crate_opened',
  CRATE_DISMISSED = 'crate_dismissed',
  CRATE_EXPIRED = 'crate_expired',
  REWARD_CLAIMED = 'reward_claimed',
  REWARD_MISSED = 'reward_missed',
  STREAK_CHECKED = 'streak_checked',
  STREAK_AT_RISK = 'streak_at_risk',
  
  // Social - Status anxiety
  LEADERBOARD_VIEWED = 'leaderboard_viewed',
  RANK_CHECKED = 'rank_checked',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  ACHIEVEMENT_VIEWED = 'achievement_viewed',
  
  // Monetization signals - Whale hunting
  PREMIUM_SHOP_VIEWED = 'premium_shop_viewed',
  ITEM_VIEWED = 'item_viewed',
  PURCHASE_INITIATED = 'purchase_initiated',
  PURCHASE_ABANDONED = 'purchase_abandoned',
  PURCHASE_COMPLETED = 'purchase_completed',
  OFFER_SHOWN = 'offer_shown',
  OFFER_DISMISSED = 'offer_dismissed',
  OFFER_CONVERSION = 'offer_conversion',
  PRICE_COMPARISON = 'price_comparison',
  
  // Manipulation (exposed for educational purposes)
  MANIPULATION_DEPLOYED = 'manipulation_deployed',
  INTERVENTION_SUCCESS = 'intervention_success',
  INTERVENTION_FAILED = 'intervention_failed',
}

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  sessionId: string;
  eventType: TelemetryEventType;
  metadata: TelemetryMetadata;
}

export interface TelemetryMetadata {
  userId: string;
  deviceInfo: DeviceInfo;
  gameVersion: string;
  
  // Context
  screen?: string;
  buildingId?: string;
  buildingTier?: number;
  newLevel?: number;
  resourceType?: string;
  resourceAmount?: number;
  
  // Economic
  cost?: number;
  playerBalance?: number;
  
  // Engagement
  tapCount?: number;
  idleDuration?: number;
  hesitationTime?: number;
  
  // Reward
  crateRarity?: string;
  rewardTier?: string;
  streakDay?: number;
  
  // Social
  playerRank?: number;
  achievementId?: string;
  
  // Monetization
  offerId?: string;
  offerPrice?: number;
  discount?: number;
  timeToConversion?: number;
  
  // Manipulation
  interventionType?: string;
  success?: boolean;
  
  // Performance
  loadTime?: number;
  frameRate?: number;
}

export interface DeviceInfo {
  platform: 'web' | 'ios' | 'android';
  screenSize: { width: number; height: number };
  language: string;
  timezone: string;
}

// Event factory functions for type-safe logging
export const TelemetryEvents = {
  sessionStart: (sessionId: string): Partial<TelemetryMetadata> => ({
    screen: 'app_launch',
  }),
  
  buildingPurchase: (buildingId: string, cost: number, balance: number): Partial<TelemetryMetadata> => ({
    buildingId,
    cost,
    playerBalance: balance,
  }),
  
  buildingPurchaseFailed: (buildingId: string, cost: number, balance: number): Partial<TelemetryMetadata> => ({
    buildingId,
    cost,
    playerBalance: balance,
  }),
  
  crateOpened: (rarity: string): Partial<TelemetryMetadata> => ({
    crateRarity: rarity,
  }),
  
  crateDismissed: (rarity: string, timeVisible: number): Partial<TelemetryMetadata> => ({
    crateRarity: rarity,
    idleDuration: timeVisible,
  }),
  
  offerShown: (offerId: string, price: number, discount?: number): Partial<TelemetryMetadata> => ({
    offerId,
    offerPrice: price,
    discount,
  }),
  
  offerConversion: (offerId: string, timeToConvert: number): Partial<TelemetryMetadata> => ({
    offerId,
    timeToConversion: timeToConvert,
  }),
  
  hesitation: (screen: string, action: string, duration: number): Partial<TelemetryMetadata> => ({
    screen,
    hesitationTime: duration,
  }),
  
  rageTap: (coordinates: { x: number; y: number }, tapCount: number): Partial<TelemetryMetadata> => ({
    tapCount,
  }),
};
