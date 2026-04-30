import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { usePlayerStore } from '../../stores/playerStore';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { Clock, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import { calculateSunkCostLabel, getInvestmentTrackerText } from '../../types/nearMiss';
import { formatNumber } from '../../types/resource';

interface NearMissToast {
  id: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
}

export function SunkCostDisplay() {
  const resources = useGameStore(state => state.resources);
  const buildings = useGameStore(state => state.buildings);
  const { achievements } = usePlayerStore();
  const ascension = usePrestigeStore(state => state.ascension);

  const [sessionStartTime] = useState(Date.now());
  const [sessionMs, setSessionMs] = useState(0);
  const [nearMissToasts] = useState<NearMissToast[]>([]);

  // Track session time
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionMs(Date.now() - sessionStartTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const unlockedAchievements = achievements.filter(a => a.unlockedAt).length;
  const totalBuildings = buildings.reduce((sum, b) => sum + b.count, 0);
  const sunkCostLabel = calculateSunkCostLabel(sessionMs, resources.ore.totalEarned);
  const investmentText = getInvestmentTrackerText(sessionMs, unlockedAchievements);

  const sessionHours = Math.floor(sessionMs / (1000 * 60 * 60));
  const sessionMinutes = Math.floor((sessionMs % (1000 * 60 * 60)) / (1000 * 60));
  const sessionSeconds = Math.floor((sessionMs % (1000 * 60)) / 1000);

  const timeDisplay = sessionHours > 0
    ? `${sessionHours}:${String(sessionMinutes).padStart(2, '0')}:${String(sessionSeconds).padStart(2, '0')}`
    : `${sessionMinutes}:${String(sessionSeconds).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* Near-Miss Toasts */}
      <div className="fixed bottom-20 right-4 z-40 space-y-2 pointer-events-none">
        <AnimatePresence>
          {nearMissToasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className={`rounded-xl px-4 py-3 shadow-lg text-sm font-bold max-w-xs ${
                toast.impact === 'high'
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
                  : toast.impact === 'medium'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-bg-card text-text-primary border border-accent/30'
              }`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Session Investment Tracker */}
      <div className="bg-bg-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-accent" />
          <h4 className="font-bold text-text-primary">Your Investment</h4>
          <span className="text-xs text-text-secondary ml-auto">This session</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-bg-secondary rounded-xl p-3 text-center">
            <div className="text-2xl font-mono font-bold text-text-primary">{timeDisplay}</div>
            <div className="text-text-secondary text-xs mt-1">Time Invested</div>
          </div>
          <div className="bg-bg-secondary rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-accent">{formatNumber(resources.ore.totalEarned)}</div>
            <div className="text-text-secondary text-xs mt-1">Total Ore Produced</div>
          </div>
          <div className="bg-bg-secondary rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{unlockedAchievements}</div>
            <div className="text-text-secondary text-xs mt-1">Achievements</div>
          </div>
          <div className="bg-bg-secondary rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{ascension.level}</div>
            <div className="text-text-secondary text-xs mt-1">Ascension Level</div>
          </div>
        </div>

        {/* Sunk Cost Summary */}
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-accent text-sm font-bold">Your Empire at a Glance</span>
          </div>
          <p className="text-text-secondary text-xs">{sunkCostLabel}</p>
        </div>
      </div>

      {/* Investment Warning (Sunk Cost Amplifier) */}
      {sessionMs >= 5 * 60 * 1000 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-sm">{investmentText}</p>
          </div>
        </motion.div>
      )}

      {/* All-time Stats */}
      <div className="bg-bg-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-400" />
          <h4 className="font-bold text-text-primary">Empire Progress</h4>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-sm">Total Buildings</span>
            <span className="text-text-primary font-bold">{totalBuildings}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-sm">Ore Spent</span>
            <span className="text-text-primary font-bold">{formatNumber(resources.ore.totalSpent)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-sm">Current Balance</span>
            <span className="text-accent font-bold">{formatNumber(resources.ore.amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-sm">Achievements Progress</span>
            <span className="text-yellow-400 font-bold">{unlockedAchievements} / {achievements.length}</span>
          </div>
        </div>

        {unlockedAchievements < achievements.length && (
          <div className="mt-4 bg-bg-secondary rounded-xl p-3">
            <div className="text-sm text-text-secondary mb-1">
              🏆 <span className="text-text-primary font-medium">{achievements.length - unlockedAchievements} achievements</span> remaining
            </div>
            <div className="h-2 bg-bg-card rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full"
                animate={{ width: `${(unlockedAchievements / achievements.length) * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
