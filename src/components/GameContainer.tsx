import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useRewardStore } from '../stores/rewardStore';
import { usePlayerStore } from '../stores/playerStore';
import { ResourceBar } from './resources/ResourceBar';
import { BuildingGrid } from './buildings/BuildingGrid';
import { LootCratePanel } from './rewards/LootCratePanel';
import { LeaderboardPanel } from './rewards/LeaderboardPanel';
import { DailyRewardPanel } from './rewards/DailyRewardPanel';
import { StreakDisplay } from './rewards/StreakDisplay';
import { AchievementPopup } from './notifications/AchievementPopup';
import { OfflineProgressModal } from './notifications/OfflineProgressModal';
import { formatNumber } from '../types/resource';

type Tab = 'build' | 'rewards' | 'leaderboard';

export function GameContainer() {
  const [activeTab, setActiveTab] = useState<Tab>('build');
  const [showOfflineModal, setShowOfflineModal] = useState(true);
  
  const resources = useGameStore(state => state.resources);
  const totalProduction = useGameStore(state => state.totalProduction);
  const offlineProgress = useGameStore(state => state.offlineProgress);
  const calculateOfflineProgress = useGameStore(state => state.calculateOfflineProgress);
  const achievements = usePlayerStore(state => state.achievements);
  const unlockedAchievements = achievements.filter(a => a.unlocked && a.unlockedAt && Date.now() - a.unlockedAt < 5000);
  
  const handleCloseOfflineModal = () => {
    calculateOfflineProgress();
    setShowOfflineModal(false);
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-4 px-4 bg-gradient-to-b from-bg-secondary to-transparent">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-text-primary">Infinity Forge</h1>
          <StreakDisplay />
        </div>
        
        <ResourceBar 
          ore={resources.ore.amount} 
          production={totalProduction}
        />
        
        <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary">
          <span className="text-accent font-medium">{formatNumber(totalProduction)}</span>
          <span>ore/sec</span>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-bg-card">
        {(['build', 'rewards', 'leaderboard'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab 
                ? 'text-accent border-b-2 border-accent' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'build' && (
            <motion.div
              key="build"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto scrollbar-hide"
            >
              <BuildingGrid />
            </motion.div>
          )}
          
          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto scrollbar-hide p-4 space-y-4"
            >
              <LootCratePanel />
              <DailyRewardPanel />
            </motion.div>
          )}
          
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto scrollbar-hide p-4"
            >
              <LeaderboardPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Achievement Popups */}
      <AnimatePresence>
        {unlockedAchievements.map((achievement) => (
          <AchievementPopup 
            key={achievement.id} 
            achievement={achievement} 
          />
        ))}
      </AnimatePresence>
      
      {/* Offline Progress Modal */}
      <AnimatePresence>
        {showOfflineModal && offlineProgress > 0 && (
          <OfflineProgressModal 
            amount={offlineProgress}
            onClose={handleCloseOfflineModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
