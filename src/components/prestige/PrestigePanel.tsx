import { motion } from 'framer-motion';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { useGameStore } from '../../stores/gameStore';
import { RotateCcw, TrendingUp, Clock, Zap, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';

export function PrestigePanel() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const { 
    ascension, 
    canAscend, 
    ascend, 
    getPrestigeReadiness,
    getProductionMultiplier,
    getOfflineEfficiency,
  } = usePrestigeStore();

  const { resources, buildings, totalProduction, playTimeMinutes } = useGameStore(state => ({
    resources: state.resources,
    buildings: state.buildings,
    totalProduction: state.totalProduction,
    playTimeMinutes: Math.floor((Date.now() - state.lastTick) / 60000),
  }));

  const totalOreEarned = resources.ore.totalEarned;
  const buildingCount = buildings.reduce((sum, b) => sum + b.count, 0);
  const eligible = canAscend(totalOreEarned, buildingCount);
  const readiness = getPrestigeReadiness(resources.ore.amount);

  // Calculate potential points
  const potentialPoints = eligible 
    ? Math.floor(Math.log10(totalOreEarned) * 10) + (buildingCount * 5) + Math.floor(Math.log10(playTimeMinutes + 1) * 2)
    : 0;

  const handleAscend = () => {
    if (eligible) {
      ascend(totalOreEarned, buildingCount, playTimeMinutes || 1);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Ascension</h2>
        <p className="text-sm text-text-secondary">
          Reset your progress for permanent bonuses
        </p>
      </div>

      {/* Current Ascension Level */}
      <div className="bg-bg-card rounded-xl p-4 border border-accent/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-text-secondary">Current Level</span>
          <span className="text-2xl font-bold text-accent">{ascension.level}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-bg-primary rounded-lg p-2">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <div className="text-xs text-text-secondary">Production</div>
            <div className="text-lg font-bold text-green-400">
              {Math.round((getProductionMultiplier() - 1) * 100)}%
            </div>
          </div>
          <div className="bg-bg-primary rounded-lg p-2">
            <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-xs text-text-secondary">Offline</div>
            <div className="text-lg font-bold text-blue-400">
              {Math.round(getOfflineEfficiency() * 100)}%
            </div>
          </div>
          <div className="bg-bg-primary rounded-lg p-2">
            <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <div className="text-xs text-text-secondary">Tap Power</div>
            <div className="text-lg font-bold text-yellow-400">
              {Math.round((ascension.permanentBonuses.tapBonusMultiplier - 1) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Ascension Points */}
      {ascension.ascensionPoints > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-yellow-400 font-semibold">Ascension Points</span>
            <span className="text-2xl font-bold text-yellow-400">
              {ascension.ascensionPoints}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Spend in the Ascension Shop for permanent upgrades
          </p>
        </div>
      )}

      {/* Prestige Readiness */}
      {!eligible ? (
        <div className="bg-bg-card rounded-xl p-4 border border-red-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-6 h-6 text-red-400" />
            <div>
              <div className="font-semibold text-white">Ascension Locked</div>
              <div className="text-sm text-text-secondary">
                Earn {10000 - totalOreEarned > 0 ? (10000 - totalOreEarned).toLocaleString() : '0'} more ore and own at least 1 building
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-bg-card rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Unlock className="w-6 h-6 text-green-400" />
              <div>
                <div className="font-semibold text-white">Ready to Ascend!</div>
                <div className="text-sm text-green-400">
                  Potential points: {potentialPoints}
                </div>
              </div>
            </div>
          </div>

          {/* Readiness Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Prestige Readiness</span>
              <span className={readiness >= 1 ? 'text-green-400' : 'text-yellow-400'}>
                {Math.round(readiness * 100)}%
              </span>
            </div>
            <div className="h-3 bg-bg-primary rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  readiness >= 1 ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(readiness * 100, 100)}%` }}
              />
            </div>
            {readiness < 1 && (
              <p className="text-xs text-yellow-400 mt-1">
                ⚠️ Not at optimal point. Consider earning more ore first!
              </p>
            )}
            {readiness >= 1 && (
              <p className="text-xs text-green-400 mt-1">
                ✓ At optimal prestige point!
              </p>
            )}
          </div>

          {/* Ascend Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-white shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            <RotateCcw className="w-5 h-5 inline mr-2" />
            ASCEND NOW
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-red-500/30"
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              ⚠️ Are You Sure?
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">You will LOSE:</span>
              </div>
              <ul className="space-y-2 text-sm text-red-300">
                <li>• All ore ({resources.ore.amount.toLocaleString()})</li>
                <li>• All buildings ({buildingCount})</li>
                <li>• Current production rate</li>
                <li>• All progress on this run</li>
              </ul>
              
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">You will GAIN:</span>
                </div>
                <ul className="space-y-2 text-sm text-green-300">
                  <li>• +{Math.round((calculatePrestigeMultiplier(ascension.level + 1) - 1) * 100)}% production multiplier</li>
                  <li>• +{Math.round((calculateOfflineEfficiency(ascension.level + 1) - 0.5) * 100)}% offline efficiency</li>
                  <li>• +25% tap power</li>
                  <li>• {potentialPoints} ascension points</li>
                  <li>• Faster progress on next run!</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-gray-700 rounded-xl text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAscend}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold"
              >
                ASCEND
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// Helper functions for display
function calculatePrestigeMultiplier(level: number): number {
  return 1.0 + (level * 0.1);
}

function calculateOfflineEfficiency(level: number): number {
  const baseEfficiency = 0.5;
  const bonus = level * 0.05;
  return Math.min(baseEfficiency + bonus, 1.0);
}
