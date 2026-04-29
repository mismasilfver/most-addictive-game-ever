import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameNotification } from '../types/notifications';
import { NOTIFICATION_TRIGGERS } from '../types/notifications';

interface NotificationsState {
  notifications: GameNotification[];
  onlinePlayerCount: number;
  comebackBonusActive: boolean;
  comebackBonusExpiresAt: number | null;

  addNotification: (notification: GameNotification) => void;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  activateComebackBonus: () => void;
  checkComebackBonusExpiry: () => void;
  getComebackMultiplier: () => number;
  getActiveCount: () => number;
  tickOnlineCount: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      onlinePlayerCount: 1247,
      comebackBonusActive: false,
      comebackBonusExpiresAt: null,

      addNotification: (notification: GameNotification) => {
        const { notifications } = get();
        if (notifications.some(n => n.id === notification.id)) return;
        set({ notifications: [notification, ...notifications] });
      },

      dismissNotification: (id: string) => {
        set({ notifications: get().notifications.filter(n => n.id !== id) });
      },

      dismissAll: () => {
        set({ notifications: [] });
      },

      activateComebackBonus: () => {
        set({
          comebackBonusActive: true,
          comebackBonusExpiresAt: Date.now() + NOTIFICATION_TRIGGERS.comeback_bonus.bonusDurationMs,
        });
      },

      checkComebackBonusExpiry: () => {
        const { comebackBonusActive, comebackBonusExpiresAt } = get();
        if (comebackBonusActive && comebackBonusExpiresAt && Date.now() >= comebackBonusExpiresAt) {
          set({ comebackBonusActive: false, comebackBonusExpiresAt: null });
        }
      },

      getComebackMultiplier: () => {
        const { comebackBonusActive, comebackBonusExpiresAt } = get();
        if (comebackBonusActive && comebackBonusExpiresAt && Date.now() < comebackBonusExpiresAt) {
          return NOTIFICATION_TRIGGERS.comeback_bonus.bonusMultiplier;
        }
        return 1;
      },

      getActiveCount: () => {
        return get().notifications.length;
      },

      tickOnlineCount: () => {
        // Slowly fluctuate the fake online count to look real
        const current = get().onlinePlayerCount;
        const delta = Math.floor(Math.random() * 21) - 10; // -10 to +10
        const clamped = Math.max(900, Math.min(2000, current + delta));
        set({ onlinePlayerCount: clamped });
      },
    }),
    { name: 'infinity-forge-notifications' }
  )
);
