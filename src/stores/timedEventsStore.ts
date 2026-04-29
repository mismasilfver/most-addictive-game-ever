/**
 * Timed Events Store
 * 
 * Manages time-limited events, flash sales, rush hours,
 * and limited offers with FOMO mechanics.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimedEvent, FlashSale, LimitedOffer } from '../types/timedEvents';
import {
  RUSH_HOUR_WINDOWS,
  WEEKEND_BOOST,
  generateFlashSale,
  isTimedEventActive,
  getCurrentRushHour,
  getNextRushHour,
  getTimeUntilNextRushHour,
  getWeekendBoost,
  calculateActiveMultipliers,
  LIMITED_OFFERS,
} from '../types/timedEvents';
import { telemetry } from '../telemetry';
import { TelemetryEventType } from '../telemetry/events';

interface TimedEventsState {
  // Events
  activeEvents: TimedEvent[];
  flashSale: FlashSale | null;
  currentOffer: (LimitedOffer & { expiresAt: number; purchasesRemaining: number }) | null;

  // Player tracking
  totalPlayTime: number;
  lastLoginTime: number;

  // Actions
  addEvent: (event: TimedEvent) => void;
  removeExpiredEvents: () => void;
  startFlashSale: (itemId: string, discountPercent?: number) => void;
  dismissFlashSale: () => void;
  showLimitedOffer: (offerId: string) => void;
  purchaseOffer: () => void;
  dismissOffer: () => void;
  updatePlayTime: (durationMs: number) => void;
  recordLogin: () => void;

  // Getters
  getActiveMultipliers: () => {
    productionMultiplier: number;
    crateSpawnRate: number;
    tapMultiplier: number;
    rewardMultiplier: number;
  };
  getCurrentRushHourInfo: () => {
    rushHour: ReturnType<typeof getCurrentRushHour>;
    nextRushHour: ReturnType<typeof getNextRushHour>;
    timeUntilNext: number;
  } | null;
  getWeekendBoostInfo: () => ReturnType<typeof getWeekendBoost>;
  getActiveEvents: () => TimedEvent[];
  getUrgencyMessage: () => string | null;
}

export const useTimedEventsStore = create<TimedEventsState>()(
  persist(
    (set, get) => ({
      activeEvents: [],
      flashSale: null,
      currentOffer: null,
      totalPlayTime: 0,
      lastLoginTime: Date.now(),

      addEvent: (event: TimedEvent) => {
        const { activeEvents } = get();
        // Avoid duplicates
        if (activeEvents.some(e => e.id === event.id)) return;

        set({ activeEvents: [...activeEvents, event] });

        telemetry.logEvent(TelemetryEventType.EVENT_STARTED, {
          eventId: event.id,
          resourceAmount: event.bonuses.productionMultiplier,
        });
      },

      removeExpiredEvents: () => {
        const { activeEvents } = get();
        const now = Date.now();

        const validEvents = activeEvents.filter(event => {
          if (event.endTime <= now) {
            // Log event ended
            telemetry.logEvent(TelemetryEventType.EVENT_ENDED, {
              eventId: event.id,
            });
            return false;
          }
          return true;
        });

        set({ activeEvents: validEvents });
      },

      startFlashSale: (itemId: string, discountPercent: number = 25) => {
        const sale = generateFlashSale(itemId, discountPercent);
        set({ flashSale: sale });

        telemetry.logEvent(TelemetryEventType.OFFER_SHOWN, {
          offerId: sale.id,
          offerPrice: sale.saleCost,
        });
      },

      dismissFlashSale: () => {
        const { flashSale } = get();
        if (flashSale) {
          telemetry.logEvent(TelemetryEventType.CRATE_DISMISSED, {
            screen: 'flash_sale',
          });
        }
        set({ flashSale: null });
      },

      showLimitedOffer: (offerId: string) => {
        const offerTemplate = LIMITED_OFFERS.find(o => o.id === offerId);
        if (!offerTemplate) return;

        const offer = {
          ...offerTemplate,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
          purchasesRemaining: offerTemplate.maxPurchases,
        };

        set({ currentOffer: offer });

        telemetry.logEvent(TelemetryEventType.OFFER_SHOWN, {
          offerId: offer.id,
          offerPrice: offer.price,
        });
      },

      purchaseOffer: () => {
        const { currentOffer } = get();
        if (!currentOffer) return;

        const newRemaining = currentOffer.purchasesRemaining - 1;

        telemetry.logEvent(TelemetryEventType.PURCHASE_COMPLETED, {
          offerId: currentOffer.id,
          offerPrice: currentOffer.price,
        });

        if (newRemaining <= 0) {
          set({ currentOffer: null });
        } else {
          set({
            currentOffer: {
              ...currentOffer,
              purchasesRemaining: newRemaining,
            },
          });
        }
      },

      dismissOffer: () => {
        const { currentOffer } = get();
        if (currentOffer) {
          telemetry.logEvent(TelemetryEventType.CRATE_DISMISSED, {
            screen: 'limited_offer',
          });
        }
        set({ currentOffer: null });
      },

      updatePlayTime: (durationMs: number) => {
        const { totalPlayTime } = get();
        set({ totalPlayTime: totalPlayTime + durationMs });
      },

      recordLogin: () => {
        set({ lastLoginTime: Date.now() });
      },

      getActiveMultipliers: () => {
        const rushHour = getCurrentRushHour();
        const weekendBoost = getWeekendBoost();
        const active = get().getActiveEvents();

        return calculateActiveMultipliers(
          rushHour,
          weekendBoost,
          active
        );
      },

      getCurrentRushHourInfo: () => {
        const rushHour = getCurrentRushHour();
        const nextRushHour = getNextRushHour();
        const timeUntilNext = getTimeUntilNextRushHour();

        return {
          rushHour,
          nextRushHour,
          timeUntilNext,
        };
      },

      getWeekendBoostInfo: () => {
        return getWeekendBoost();
      },

      getActiveEvents: () => {
        const { activeEvents } = get();
        return activeEvents.filter(e => isTimedEventActive(e));
      },

      getUrgencyMessage: () => {
        const { flashSale, currentOffer, activeEvents } = get();
        const now = Date.now();

        // Flash sale urgency
        if (flashSale) {
          const timeLeft = flashSale.expiresAt - now;
          const minutesLeft = Math.floor(timeLeft / (60 * 1000));
          const secondsLeft = Math.floor((timeLeft % (60 * 1000)) / 1000);

          if (minutesLeft < 5) {
            return `⚠️ FLASH SALE ENDS IN ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}!`;
          }
          return `🔥 Flash Sale: ${flashSale.remainingQuantity} left!`;
        }

        // Limited offer urgency
        if (currentOffer) {
          const timeLeft = currentOffer.expiresAt - now;
          const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));

          if (hoursLeft < 4) {
            return `⏰ Offer expires in ${hoursLeft} hours!`;
          }
          if (currentOffer.purchasesRemaining <= 2) {
            return `⚡ Only ${currentOffer.purchasesRemaining} remaining!`;
          }
        }

        // Rush hour urgency
        const rushHour = getCurrentRushHour();
        if (rushHour) {
          return `⚡ ${rushHour.name} ACTIVE! ${rushHour.bonuses.productionMultiplier}x production!`;
        }

        // Weekend boost
        const weekend = getWeekendBoost();
        if (weekend.active) {
          return `🎉 Weekend Boost Active! +25% all bonuses!`;
        }

        // Next event countdown
        const next = getNextRushHour();
        if (next) {
          const timeUntil = getTimeUntilNextRushHour();
          const hoursUntil = Math.floor(timeUntil / (60 * 60 * 1000));
          const minutesUntil = Math.floor((timeUntil % (60 * 60 * 1000)) / (60 * 1000));

          if (hoursUntil === 0) {
            return `⏳ ${next.name} starts in ${minutesUntil} minutes!`;
          }
        }

        return null;
      },
    }),
    {
      name: 'infinity-forge-timed-events',
    }
  )
);
