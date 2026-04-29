import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { Bell, X, Users, Flame, Zap } from 'lucide-react';
import { URGENCY_STYLES } from '../../types/notifications';

const TYPE_ICONS: Record<string, string> = {
  streak_at_risk: '🔥',
  crate_ready: '📦',
  offline_complete: '🏭',
  event_starting: '⚡',
  guild_needs_help: '⚠️',
  pity_reminder: '🎰',
  comeback_bonus: '🎉',
};

export function NotificationCenter() {
  const {
    notifications,
    onlinePlayerCount,
    comebackBonusActive,
    comebackBonusExpiresAt,
    dismissNotification,
    dismissAll,
    checkComebackBonusExpiry,
    tickOnlineCount,
  } = useNotificationsStore();

  // Tick online count and check comeback bonus expiry
  useEffect(() => {
    const interval = setInterval(() => {
      tickOnlineCount();
      checkComebackBonusExpiry();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const comebackMsLeft = comebackBonusActive && comebackBonusExpiresAt
    ? Math.max(0, comebackBonusExpiresAt - Date.now())
    : 0;
  const comebackMinutes = Math.floor(comebackMsLeft / 60000);

  return (
    <div className="space-y-3">
      {/* Online Player Ticker */}
      <div className="bg-bg-card rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <Users className="w-4 h-4 text-green-400" />
        <span className="text-text-secondary text-sm">
          <span className="text-green-400 font-bold">{onlinePlayerCount.toLocaleString()}</span> players online now
        </span>
      </div>

      {/* Comeback Bonus Banner */}
      <AnimatePresence>
        {comebackBonusActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border border-yellow-500/40 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div className="flex-1">
                <div className="text-yellow-300 font-bold text-sm">🎉 Welcome Back Bonus Active!</div>
                <div className="text-yellow-300/70 text-xs">3x production • {comebackMinutes} min remaining</div>
              </div>
              <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification List Header */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-text-secondary" />
            <span className="text-text-secondary text-sm">{notifications.length} alert{notifications.length !== 1 ? 's' : ''}</span>
          </div>
          <button
            onClick={dismissAll}
            className="text-text-secondary text-xs hover:text-text-primary transition-colors"
          >
            Dismiss all
          </button>
        </div>
      )}

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className={`rounded-xl p-4 border flex items-start gap-3 ${URGENCY_STYLES[notif.urgency]}`}
          >
            <span className="text-xl flex-shrink-0">{TYPE_ICONS[notif.type] ?? '🔔'}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{notif.title}</div>
              <div className="text-sm opacity-80 mt-0.5">{notif.body}</div>
            </div>
            <button
              onClick={() => dismissNotification(notif.id)}
              className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty state */}
      {notifications.length === 0 && !comebackBonusActive && (
        <div className="text-center py-8 text-text-secondary">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No alerts right now</p>
          <p className="text-xs opacity-60 mt-1">Keep playing to unlock more rewards</p>
        </div>
      )}
    </div>
  );
}
