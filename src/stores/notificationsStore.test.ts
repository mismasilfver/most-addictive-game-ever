import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationsStore } from './notificationsStore';

describe('notificationsStore', () => {
  beforeEach(() => {
    useNotificationsStore.setState({
      notifications: [],
      onlinePlayerCount: 1247,
      comebackBonusActive: false,
      comebackBonusExpiresAt: null,
    });
  });

  describe('initial state', () => {
    it('starts with no notifications', () => {
      expect(useNotificationsStore.getState().notifications).toHaveLength(0);
    });

    it('starts with no comeback bonus', () => {
      expect(useNotificationsStore.getState().comebackBonusActive).toBe(false);
    });
  });

  describe('addNotification', () => {
    it('adds a notification', () => {
      useNotificationsStore.getState().addNotification({
        id: 'n1',
        type: 'streak_at_risk',
        title: 'Streak!',
        body: 'Test',
        urgency: 'high',
      });
      expect(useNotificationsStore.getState().notifications).toHaveLength(1);
    });

    it('does not add duplicate ids', () => {
      const notif = { id: 'n1', type: 'crate_ready' as const, title: 'T', body: 'B', urgency: 'low' as const };
      useNotificationsStore.getState().addNotification(notif);
      useNotificationsStore.getState().addNotification(notif);
      expect(useNotificationsStore.getState().notifications).toHaveLength(1);
    });
  });

  describe('dismissNotification', () => {
    it('removes notification by id', () => {
      useNotificationsStore.setState({
        notifications: [{ id: 'n1', type: 'crate_ready', title: 'T', body: 'B', urgency: 'low' }],
        onlinePlayerCount: 1247,
        comebackBonusActive: false,
        comebackBonusExpiresAt: null,
      });

      useNotificationsStore.getState().dismissNotification('n1');
      expect(useNotificationsStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('dismissAll', () => {
    it('clears all notifications', () => {
      useNotificationsStore.setState({
        notifications: [
          { id: 'n1', type: 'crate_ready', title: 'T', body: 'B', urgency: 'low' },
          { id: 'n2', type: 'streak_at_risk', title: 'T', body: 'B', urgency: 'high' },
        ],
        onlinePlayerCount: 1247,
        comebackBonusActive: false,
        comebackBonusExpiresAt: null,
      });

      useNotificationsStore.getState().dismissAll();
      expect(useNotificationsStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('activateComebackBonus', () => {
    it('sets bonus active', () => {
      useNotificationsStore.getState().activateComebackBonus();
      expect(useNotificationsStore.getState().comebackBonusActive).toBe(true);
    });

    it('sets expiry in the future', () => {
      useNotificationsStore.getState().activateComebackBonus();
      const expiry = useNotificationsStore.getState().comebackBonusExpiresAt;
      expect(expiry).toBeGreaterThan(Date.now());
    });
  });

  describe('checkComebackBonusExpiry', () => {
    it('deactivates bonus after expiry', () => {
      useNotificationsStore.setState({
        notifications: [],
        onlinePlayerCount: 1247,
        comebackBonusActive: true,
        comebackBonusExpiresAt: Date.now() - 1000, // already expired
      });

      useNotificationsStore.getState().checkComebackBonusExpiry();
      expect(useNotificationsStore.getState().comebackBonusActive).toBe(false);
    });

    it('keeps bonus active before expiry', () => {
      useNotificationsStore.setState({
        notifications: [],
        onlinePlayerCount: 1247,
        comebackBonusActive: true,
        comebackBonusExpiresAt: Date.now() + 3600000,
      });

      useNotificationsStore.getState().checkComebackBonusExpiry();
      expect(useNotificationsStore.getState().comebackBonusActive).toBe(true);
    });
  });

  describe('getComebackMultiplier', () => {
    it('returns 3 when bonus active', () => {
      useNotificationsStore.setState({
        notifications: [],
        onlinePlayerCount: 1247,
        comebackBonusActive: true,
        comebackBonusExpiresAt: Date.now() + 3600000,
      });
      expect(useNotificationsStore.getState().getComebackMultiplier()).toBe(3);
    });

    it('returns 1 when bonus inactive', () => {
      expect(useNotificationsStore.getState().getComebackMultiplier()).toBe(1);
    });
  });

  describe('getActiveCount', () => {
    it('counts non-dismissed notifications', () => {
      useNotificationsStore.setState({
        notifications: [
          { id: 'n1', type: 'crate_ready', title: 'T', body: 'B', urgency: 'low' },
          { id: 'n2', type: 'streak_at_risk', title: 'T', body: 'B', urgency: 'high' },
        ],
        onlinePlayerCount: 1247,
        comebackBonusActive: false,
        comebackBonusExpiresAt: null,
      });
      expect(useNotificationsStore.getState().getActiveCount()).toBe(2);
    });
  });
});
