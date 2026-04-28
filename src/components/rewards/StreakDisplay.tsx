import { motion } from 'framer-motion';
import { useRewardStore } from '../../stores/rewardStore';
import { Flame } from 'lucide-react';

export function StreakDisplay() {
  const dailyStreak = useRewardStore(state => state.dailyStreak);
  
  if (dailyStreak === 0) return null;
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-1.5 bg-accent/20 px-2.5 py-1 rounded-full"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <Flame className="w-4 h-4 text-accent" />
      </motion.div>
      <span className="text-sm font-bold text-accent">{dailyStreak}</span>
    </motion.div>
  );
}
