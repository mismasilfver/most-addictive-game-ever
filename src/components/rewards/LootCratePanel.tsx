import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRewardStore } from '../../stores/rewardStore';
import { useGameStore } from '../../stores/gameStore';
import { usePlayerStore } from '../../stores/playerStore';
import { REWARD_TIERS, type MysteryCrate, type RewardTierConfig } from '../../types/reward';
import { formatNumber } from '../../types/resource';
import { Gift, Clock } from 'lucide-react';

export function LootCratePanel() {
  const crates = useRewardStore(state => state.crates);
  const openCrate = useRewardStore(state => state.openCrate);
  const nextCrateTime = useRewardStore(state => state.nextCrateTime);
  const addResources = useGameStore(state => state.addResources);
  const recordTap = usePlayerStore(state => state.recordTap);
  
  const [openingCrate, setOpeningCrate] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<{ tier: RewardTierConfig; amount: number } | null>(null);
  const [showNearMiss, setShowNearMiss] = useState(false);
  
  const unopenedCrates = crates.filter(c => !c.openTime);
  const timeUntilNext = Math.max(0, nextCrateTime - Date.now());
  const secondsUntilNext = Math.ceil(timeUntilNext / 1000);
  
  const handleOpenCrate = async (crateId: string) => {
    const crate = crates.find(c => c.id === crateId);
    if (!crate || crate.openTime) return;
    
    setOpeningCrate(crateId);
    recordTap();
    
    // Near miss tease
    if (crate.isNearMiss) {
      setShowNearMiss(true);
      await new Promise(r => setTimeout(r, 1500));
      setShowNearMiss(false);
    }
    
    await new Promise(r => setTimeout(r, 500));
    
    const result = openCrate(crateId);
    if (result) {
      setLastReward(result);
      addResources('ore', result.amount);
      
      await new Promise(r => setTimeout(r, 2000));
      setOpeningCrate(null);
      setLastReward(null);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Next crate timer */}
      <div className="bg-bg-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Gift className="w-5 h-5 text-accent" />
            Mystery Crates
          </h3>
          {secondsUntilNext > 0 && (
            <span className="text-sm text-text-secondary flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {Math.floor(secondsUntilNext / 60)}:{(secondsUntilNext % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
        
        {/* Active crates */}
        <div className="grid grid-cols-3 gap-2">
          {unopenedCrates.length === 0 ? (
            <div className="col-span-3 text-center py-6 text-text-secondary text-sm">
              No crates available. Check back soon!
            </div>
          ) : (
            unopenedCrates.map((crate) => (
              <CrateButton
                key={crate.id}
                crate={crate}
                isOpening={openingCrate === crate.id}
                onClick={() => handleOpenCrate(crate.id)}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Reward reveal animation */}
      <AnimatePresence>
        {lastReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className={`rounded-xl p-6 text-center shadow-lg ${lastReward.tier.color}`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="text-4xl mb-2"
            >
              {lastReward.tier.tier === 'legendary' ? '👑' :
               lastReward.tier.tier === 'epic' ? '💎' :
               lastReward.tier.tier === 'rare' ? '🔷' :
               lastReward.tier.tier === 'uncommon' ? '🔹' : '⚪'}
            </motion.div>
            <div className="text-white font-bold text-lg uppercase tracking-wider">
              {lastReward.tier.tier}
            </div>
            <div className="text-white/90 text-2xl font-bold mt-2">
              +{formatNumber(lastReward.amount)} ore
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Near miss tease */}
      <AnimatePresence>
        {showNearMiss && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="w-32 h-32 rounded-full bg-tier-legendary/30 blur-xl"
            />
            <div className="absolute text-tier-legendary font-bold text-xl animate-pulse">
              ALMOST LEGENDARY!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CrateButton({ 
  crate, 
  isOpening, 
  onClick 
}: { 
  crate: MysteryCrate; 
  isOpening: boolean; 
  onClick: () => void;
}) {
  const tier = REWARD_TIERS.find(t => t.tier === crate.tier)!;
  
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={isOpening}
      className={`relative aspect-square rounded-xl flex items-center justify-center transition-all ${
        isOpening ? 'animate-shake' : 'hover:scale-105'
      }`}
      style={{
        background: `linear-gradient(135deg, ${tier.tier === 'legendary' ? '#eab308' : 
          tier.tier === 'epic' ? '#a855f7' : 
          tier.tier === 'rare' ? '#3b82f6' : 
          tier.tier === 'uncommon' ? '#22c55e' : '#9ca3af'}40, #1a1a2e)`,
        boxShadow: `0 0 20px ${tier.tier === 'legendary' ? '#eab308' : 
          tier.tier === 'epic' ? '#a855f7' : 
          tier.tier === 'rare' ? '#3b82f6' : 
          tier.tier === 'uncommon' ? '#22c55e' : '#9ca3af'}40`,
      }}
    >
      <motion.div
        animate={isOpening ? { rotate: 360 } : { y: [0, -5, 0] }}
        transition={isOpening ? { duration: 0.5 } : { duration: 2, repeat: Infinity }}
        className="text-3xl"
      >
        🎁
      </motion.div>
      
      {isOpening && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-white/30 rounded-xl"
        />
      )}
    </motion.button>
  );
}
