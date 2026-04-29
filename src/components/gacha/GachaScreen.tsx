import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollectionStore } from '../../stores/collectionStore';
import { Sparkles, Gift, Star, Ticket, TrendingUp, Info } from 'lucide-react';
import type { GachaPullResult } from '../../types/gacha';

export function GachaScreen() {
  const [isPulling, setIsPulling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<GachaPullResult | null>(null);
  const [animationStage, setAnimationStage] = useState<'idle' | 'pulling' | 'revealing' | 'complete'>('idle');

  const { 
    gachaPull, 
    pityCounter, 
    stardust, 
    convertDuplicates,
    collectibles,
    activeBanner,
  } = useCollectionStore();

  const ownedCount = collectibles.filter(c => c.owned).length;
  const totalCollectibles = 60; // Approximate total
  const completionPercentage = Math.round((ownedCount / totalCollectibles) * 100);

  const handlePull = async (count: number) => {
    if (isPulling) return;

    setIsPulling(true);
    setAnimationStage('pulling');
    setShowResult(false);

    // Simulate animation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAnimationStage('revealing');

    // Perform the pull
    const result = gachaPull(count);
    setLastResult(result);

    await new Promise(resolve => setTimeout(resolve, 1000));
    setAnimationStage('complete');
    setShowResult(true);
    setIsPulling(false);
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-gray-400',
      uncommon: 'text-green-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-yellow-400',
      mythic: 'text-red-400',
    };
    return colors[rarity] || 'text-gray-400';
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          Gacha Collection
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Collect rare items for permanent bonuses
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-card rounded-xl p-3 text-center border border-accent/20">
          <Gift className="w-5 h-5 text-accent mx-auto mb-1" />
          <div className="text-xs text-text-secondary">Collected</div>
          <div className="text-xl font-bold text-white">{ownedCount}/{totalCollectibles}</div>
        </div>
        <div className="bg-bg-card rounded-xl p-3 text-center border border-accent/20">
          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-xs text-text-secondary">Completion</div>
          <div className="text-xl font-bold text-green-400">{completionPercentage}%</div>
        </div>
        <div className="bg-bg-card rounded-xl p-3 text-center border border-accent/20">
          <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-xs text-text-secondary">Stardust</div>
          <div className="text-xl font-bold text-yellow-400">{stardust}</div>
        </div>
      </div>

      {/* Pity Counter */}
      <div className="bg-bg-card rounded-xl p-4 border border-purple-500/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-400 font-medium">Pity Counter</span>
          </div>
          <span className="text-2xl font-bold text-purple-400">
            {pityCounter}<span className="text-sm text-text-secondary">/100</span>
          </span>
        </div>
        <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${pityCounter}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {pityCounter >= 80 
            ? '⚠️ Soft pity active! Rates increased!' 
            : pityCounter >= 90
            ? '🔥 Hard pity approaching! Guaranteed legendary at 100!'
            : `Next legendary in ~${100 - pityCounter} pulls (guaranteed at 100)`}
        </p>
      </div>

      {/* Pull Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handlePull(1)}
          disabled={isPulling}
          className="py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-bold text-white shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Ticket className="w-5 h-5 inline mr-2" />
          Single Pull
          <div className="text-xs font-normal opacity-80">100 Stardust</div>
        </button>
        <button
          onClick={() => handlePull(10)}
          disabled={isPulling}
          className="py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold text-white shadow-lg hover:shadow-yellow-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5 inline mr-2" />
          10-Pull
          <div className="text-xs font-normal opacity-80">900 Stardust (10% off!)</div>
        </button>
      </div>

      {/* Duplicate Conversion */}
      {collectibles.some(c => c.duplicates > 0) && (
        <button
          onClick={convertDuplicates}
          className="w-full py-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 font-medium hover:bg-green-500/30 transition-colors"
        >
          Convert Duplicates to Stardust
          <span className="text-sm ml-2">
            ({collectibles.reduce((sum, c) => sum + c.duplicates, 0)} duplicates)
          </span>
        </button>
      )}

      {/* Animation Overlay */}
      <AnimatePresence>
        {isPulling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity },
                  scale: { duration: 0.5, repeat: Infinity }
                }}
                className="w-32 h-32 mx-auto mb-4"
              >
                <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-16 h-16 text-white" />
                </div>
              </motion.div>
              <p className="text-white text-lg font-bold">
                {animationStage === 'pulling' ? 'Summoning...' : 'Revealing...'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && lastResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-accent/30"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white text-center mb-4">
                {lastResult.isFeatured ? '🌟 FEATURED ITEM! 🌟' : 'Pull Results'}
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lastResult.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      item.rarity === 'legendary' || item.rarity === 'mythic'
                        ? 'bg-yellow-500/20 border-yellow-500/50'
                        : item.rarity === 'epic'
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-bg-card border-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className={`font-semibold ${getRarityColor(item.rarity)}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {item.rarity.toUpperCase()} • {item.category}
                      </div>
                    </div>
                    {item.rarity === 'legendary' || item.rarity === 'mythic' ? (
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                    ) : null}
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Total Value</span>
                  <span className="text-white font-bold">{lastResult.totalValue} pts</span>
                </div>
                <div className="flex justify-between text-sm text-text-secondary mt-1">
                  <span>Pity Counter</span>
                  <span className="text-purple-400 font-bold">{lastResult.pityCounter}/100</span>
                </div>
              </div>

              <button
                onClick={() => setShowResult(false)}
                className="w-full mt-4 py-3 bg-accent rounded-xl text-white font-bold"
              >
                Collect
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
