import { motion } from 'framer-motion';
import { useRewardStore } from '../../stores/rewardStore';
import { useGameStore } from '../../stores/gameStore';
import { DAILY_REWARDS } from '../../types/reward';
import { formatNumber } from '../../types/resource';
import { Calendar, Check, Lock } from 'lucide-react';

export function DailyRewardPanel() {
  const dailyStreak = useRewardStore(state => state.dailyStreak);
  const dailyRewards = useRewardStore(state => state.dailyRewards);
  const claimDailyReward = useRewardStore(state => state.claimDailyReward);
  const addResources = useGameStore(state => state.addResources);
  const checkDailyLogin = useRewardStore(state => state.checkDailyLogin);
  
  const { isNewDay } = checkDailyLogin();
  
  const handleClaim = (day: number) => {
    const reward = claimDailyReward(day);
    if (reward > 0) {
      addResources('ore', reward);
    }
  };
  
  return (
    <div className="bg-bg-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          Daily Rewards
        </h3>
        <span className="text-sm text-accent font-medium">
          Streak: {dailyStreak} days
        </span>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {DAILY_REWARDS.map((reward, index) => {
          const day = index + 1;
          const isClaimed = dailyRewards[index]?.claimed;
          const isAvailable = day <= dailyStreak && !isClaimed && isNewDay;
          const isFuture = day > dailyStreak;
          
          return (
            <motion.button
              key={day}
              whileTap={isAvailable ? { scale: 0.95 } : {}}
              onClick={() => isAvailable && handleClaim(day)}
              disabled={!isAvailable}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
                isClaimed 
                  ? 'bg-tier-uncommon/20 text-tier-uncommon' 
                  : isAvailable
                    ? 'bg-accent text-white shadow-lg shadow-accent/30 cursor-pointer'
                    : isFuture
                      ? 'bg-bg-secondary text-text-secondary/50'
                      : 'bg-bg-secondary text-text-secondary'
              }`}
            >
              {isClaimed ? (
                <Check className="w-5 h-5" />
              ) : isFuture ? (
                <Lock className="w-4 h-4" />
              ) : (
                <>
                  <span className="font-bold">{formatNumber(reward)}</span>
                  <span className="text-[10px] opacity-75">Day {day}</span>
                </>
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Streak warning */}
      {dailyStreak > 0 && !isNewDay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-center text-xs text-accent"
        >
          Come back tomorrow to keep your streak!
        </motion.div>
      )}
      
      {/* Day 7 special tease */}
      {dailyStreak < 7 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 p-3 bg-gradient-to-r from-tier-legendary/20 to-transparent rounded-lg border border-tier-legendary/30"
        >
          <div className="text-sm text-tier-legendary font-medium">
            🎁 Day 7: {formatNumber(DAILY_REWARDS[6])} ore bonus!
          </div>
          <div className="text-xs text-text-secondary">
            {7 - dailyStreak} more days to unlock
          </div>
        </motion.div>
      )}
    </div>
  );
}
