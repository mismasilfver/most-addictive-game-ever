import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { usePlayerStore } from '../../stores/playerStore';
import { formatNumber } from '../../types/resource';

interface ResourceBarProps {
  ore: number;
  production: number;
}

export function ResourceBar({ ore, production }: ResourceBarProps) {
  const [displayOre, setDisplayOre] = useState(ore);
  const [isAnimating, setIsAnimating] = useState(false);
  const addResources = useGameStore(state => state.addResources);
  const recordTap = usePlayerStore(state => state.recordTap);
  
  useEffect(() => {
    if (Math.abs(ore - displayOre) > 1) {
      setIsAnimating(true);
      setDisplayOre(ore);
      const timer = setTimeout(() => setIsAnimating(false), 100);
      return () => clearTimeout(timer);
    }
  }, [ore, displayOre]);
  
  const handleTap = () => {
    // Tap mechanic adds small amount instantly
    const bonus = Math.max(1, Math.ceil(production * 0.1));
    addResources('ore', bonus);
    recordTap();
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-bg-card rounded-lg px-4 py-2.5 shadow-lg">
        <span className="text-2xl">⛏️</span>
        <div>
          <motion.div 
            className={`text-2xl font-bold text-text-primary ${isAnimating ? 'number-tick' : ''}`}
            key={Math.floor(displayOre)}
          >
            {formatNumber(displayOre)}
          </motion.div>
          <div className="text-xs text-text-secondary">Raw Ore</div>
        </div>
      </div>
      
      {/* Mini tap button for extra ore */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleTap}
        className="flex-1 bg-accent/20 border-2 border-accent/50 rounded-lg px-3 py-2 text-accent font-medium text-sm active:bg-accent/30 transition-colors"
      >
        Tap for Bonus
      </motion.button>
    </div>
  );
}
