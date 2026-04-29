import { motion } from 'framer-motion';
import { useVIPStore } from '../../stores/vipStore';
import { getVIPConfig } from '../../types/vip';
import { Gem } from 'lucide-react';

export function VIPStatusBar() {
  const { level, gems, getProgressToNextLevel } = useVIPStore();
  const config = getVIPConfig(level);
  const nextConfig = getVIPConfig(level + 1);
  const progress = getProgressToNextLevel();

  return (
    <div className="bg-bg-card rounded-xl px-4 py-3 flex items-center gap-3">
      <span className="text-xl">{config?.badge ?? '🔰'}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-bold ${config?.nameColor ?? 'text-text-secondary'}`}>
            {level === 0 ? 'No VIP' : `VIP ${level} · ${config?.name}`}
          </span>
          {nextConfig && (
            <span className="text-text-secondary text-xs">Next: {nextConfig.badge} {nextConfig.name}</span>
          )}
        </div>
        <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 text-cyan-400 text-sm font-bold">
        <Gem className="w-4 h-4" />
        {gems}
      </div>
    </div>
  );
}
