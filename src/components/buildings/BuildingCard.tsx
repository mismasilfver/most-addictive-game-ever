import { motion } from 'framer-motion';
import type { BuildingType } from '../../types/building';
import { formatNumber } from '../../types/resource';
import { ArrowUp, Zap } from 'lucide-react';

interface BuildingCardProps {
  buildingType: BuildingType;
  count: number;
  level: number;
  cost: number;
  production: number;
  canAfford: boolean;
  isOptimal: boolean;
  onBuy: () => void;
  onUpgrade: () => void;
  delay: number;
}

export function BuildingCard({
  buildingType,
  count,
  level,
  cost,
  production,
  canAfford,
  isOptimal,
  onBuy,
  onUpgrade,
  delay,
}: BuildingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`relative bg-bg-card rounded-xl p-4 shadow-lg border-2 transition-all ${
        canAfford 
          ? isOptimal 
            ? 'border-accent/50 shadow-accent/20' 
            : 'border-transparent hover:border-text-secondary/30'
          : 'border-transparent opacity-75'
      }`}
    >
      {/* Optimal indicator */}
      {isOptimal && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-lg"
        >
          <ArrowUp className="w-4 h-4 text-white" />
        </motion.div>
      )}
      
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="w-12 h-12 bg-bg-secondary rounded-xl flex items-center justify-center text-2xl shadow-inner">
          {buildingType.icon}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary truncate">{buildingType.name}</h3>
            {count > 0 && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                Lv.{level}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-text-secondary">
              Owned: <span className="text-text-primary font-medium">{count}</span>
            </span>
            <span className="text-tier-uncommon flex items-center gap-0.5">
              <Zap className="w-3 h-3" />
              {formatNumber(production * (count || 1))}/s
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          {/* Buy Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBuy}
            disabled={!canAfford}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              canAfford
                ? 'bg-accent text-white shadow-lg shadow-accent/30 hover:bg-accent/90 active:scale-95'
                : 'bg-bg-secondary text-text-secondary cursor-not-allowed'
            }`}
          >
            {formatNumber(cost)}
          </motion.button>
          
          {/* Upgrade Button (only shown if owned) */}
          {count > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onUpgrade}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-tier-uncommon/20 text-tier-uncommon hover:bg-tier-uncommon/30 transition-colors"
            >
              ↑ Lv.{level + 1}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
