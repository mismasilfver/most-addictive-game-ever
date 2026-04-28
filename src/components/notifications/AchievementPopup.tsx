import { motion } from 'framer-motion';
import type { Achievement } from '../../stores/playerStore';
import { Award } from 'lucide-react';

interface AchievementPopupProps {
  achievement: Achievement;
}

export function AchievementPopup({ achievement }: AchievementPopupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -20, x: '-50%' }}
      className="fixed top-20 left-1/2 z-50 bg-gradient-to-r from-tier-uncommon to-tier-rare text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px]"
    >
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
        <Award className="w-6 h-6" />
      </div>
      <div>
        <div className="text-xs opacity-75 uppercase tracking-wider">Achievement Unlocked</div>
        <div className="font-bold">{achievement.name}</div>
        <div className="text-xs opacity-75">{achievement.description}</div>
      </div>
    </motion.div>
  );
}
