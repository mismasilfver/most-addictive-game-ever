/**
 * Notification & Engagement Hooks
 *
 * In-app urgency messages designed to disrupt and re-engage.
 * No real push notifications — all in-app manipulation.
 *
 * Psychological Principle: Loss Aversion + Habit Disruption + FOMO
 */

export type NotificationType =
  | 'streak_at_risk'
  | 'crate_ready'
  | 'offline_complete'
  | 'event_starting'
  | 'guild_needs_help'
  | 'pity_reminder'
  | 'comeback_bonus';

export type NotificationUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface GameNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  urgency: NotificationUrgency;
  action?: string;
  expiresAt?: number;
  dismissedAt?: number;
}

export const NOTIFICATION_TRIGGERS = {
  streak_at_risk: {
    hoursBeforeReset: 4,
    message: "Your {streak}-day streak is about to break! Log in now!",
  },
  crate_maximized: {
    unopenedCount: 5,
    message: "You have {count} unopened crates! Tap to claim rewards!",
  },
  offline_complete: {
    minOfflineMs: 30 * 60 * 1000, // 30 minutes
    minOreEarned: 1000,
    message: "Your factories earned {amount} ore while you were away!",
  },
  comeback_bonus: {
    minAbsenceHours: 24,
    bonusMultiplier: 3,
    bonusDurationMs: 60 * 60 * 1000, // 1 hour
    message: "Welcome back! 3x production for the next hour!",
  },
};

/**
 * Check if a streak warning should be shown
 * Triggers when player hasn't logged in for > 20h (within 4h of 24h reset)
 */
export function shouldTriggerStreakWarning(lastLoginTime: number, streakDays: number): boolean {
  if (streakDays === 0) return false;
  const hoursElapsed = (Date.now() - lastLoginTime) / (1000 * 60 * 60);
  return hoursElapsed >= (24 - NOTIFICATION_TRIGGERS.streak_at_risk.hoursBeforeReset);
}

/**
 * Format a streak warning message
 */
export function formatStreakWarning(streakDays: number, hoursLeft: number): string {
  return `⚠️ Your ${streakDays}-day streak ends in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}! Log in to keep it!`;
}

/**
 * Check if an offline return notification should be shown
 */
export function shouldTriggerOfflineReturn(offlineMs: number, oreEarned: number): boolean {
  return (
    offlineMs >= NOTIFICATION_TRIGGERS.offline_complete.minOfflineMs &&
    oreEarned >= NOTIFICATION_TRIGGERS.offline_complete.minOreEarned
  );
}

/**
 * Format an offline return message
 */
export function formatOfflineReturn(oreEarned: number): string {
  const formatted = oreEarned >= 1000
    ? `${(oreEarned / 1000).toFixed(1)}K`
    : String(Math.floor(oreEarned));
  return `🏭 Your factories earned ${formatted} ore while you were away! Claim now!`;
}

/**
 * Check if a crate nag notification should be shown
 */
export function shouldTriggerCrateNag(unopenedCount: number): boolean {
  return unopenedCount >= NOTIFICATION_TRIGGERS.crate_maximized.unopenedCount;
}

/**
 * Get hours remaining in streak (before 24h reset)
 */
export function getStreakHoursRemaining(lastLoginTime: number): number {
  const hoursElapsed = (Date.now() - lastLoginTime) / (1000 * 60 * 60);
  return Math.max(0, 24 - hoursElapsed);
}

/**
 * Check if comeback bonus should be shown
 */
export function shouldShowComebackBonus(lastLoginTime: number): boolean {
  const hoursAway = (Date.now() - lastLoginTime) / (1000 * 60 * 60);
  return hoursAway >= NOTIFICATION_TRIGGERS.comeback_bonus.minAbsenceHours;
}

/**
 * Urgency colour mapping for UI
 */
export const URGENCY_STYLES: Record<NotificationUrgency, string> = {
  low: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  medium: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  high: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  critical: 'border-red-500/50 bg-red-500/15 text-red-300',
};
