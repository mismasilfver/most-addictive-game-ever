import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCollectionStore } from '../../stores/collectionStore';
import { BookOpen, Lock, Check, Star, ChevronRight } from 'lucide-react';
import { COLLECTION_SETS } from '../../types/collection';

export function CollectionAlbum() {
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  
  const { 
    collectibles, 
    getCompletionStats,
    getTotalBonus,
  } = useCollectionStore();

  const stats = getCompletionStats();
  const productionBonus = getTotalBonus('production');
  const offlineBonus = getTotalBonus('offline');
  const tapBonus = getTotalBonus('tap');

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'border-gray-600 bg-gray-800',
      uncommon: 'border-green-500/50 bg-green-900/20',
      rare: 'border-blue-500/50 bg-blue-900/20',
      epic: 'border-purple-500/50 bg-purple-900/20',
      legendary: 'border-yellow-500/50 bg-yellow-900/20 shadow-yellow-500/20',
      mythic: 'border-red-500/50 bg-red-900/20 shadow-red-500/20',
    };
    return colors[rarity] || 'border-gray-600 bg-gray-800';
  };

  const getRarityTextColor = (rarity: string) => {
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
          <BookOpen className="w-6 h-6 text-accent" />
          Collection Album
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          View your collectibles and set bonuses
        </p>
      </div>

      {/* Overall Bonuses */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-bg-card rounded-lg p-3 text-center border border-green-500/30">
          <div className="text-xs text-green-400 mb-1">Production</div>
          <div className="text-lg font-bold text-white">+{Math.round(productionBonus * 100)}%</div>
        </div>
        <div className="bg-bg-card rounded-lg p-3 text-center border border-blue-500/30">
          <div className="text-xs text-blue-400 mb-1">Offline</div>
          <div className="text-lg font-bold text-white">+{Math.round(offlineBonus * 100)}%</div>
        </div>
        <div className="bg-bg-card rounded-lg p-3 text-center border border-yellow-500/30">
          <div className="text-xs text-yellow-400 mb-1">Tap</div>
          <div className="text-lg font-bold text-white">+{Math.round(tapBonus * 100)}%</div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-bg-card rounded-xl p-4 border border-accent/20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-secondary">Overall Progress</span>
          <span className="text-accent font-bold">{stats.overallPercentage}%</span>
        </div>
        <div className="h-3 bg-bg-primary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${stats.overallPercentage}%` }}
          />
        </div>
        <div className="text-xs text-text-secondary mt-1">
          {stats.totalOwned} / {stats.totalAvailable} items collected
        </div>
      </div>

      {/* Collection Sets */}
      <div className="space-y-3">
        <h3 className="font-semibold text-white">Collection Sets</h3>
        
        {stats.setStats.map((setStat) => (
          <motion.div
            key={setStat.set.id}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-xl border cursor-pointer transition-colors ${
              setStat.isComplete 
                ? 'bg-green-500/10 border-green-500/50' 
                : 'bg-bg-card border-gray-700 hover:border-accent/30'
            }`}
            onClick={() => setSelectedSet(selectedSet === setStat.set.id ? null : setStat.set.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{setStat.set.theme}</span>
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    {setStat.set.name}
                    {setStat.isComplete && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                        COMPLETE
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {setStat.ownedCount} / {setStat.totalCount} items
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-accent">{setStat.percentage}%</div>
                  {setStat.isComplete && (
                    <div className="text-xs text-green-400">
                      {setStat.set.completionBonus.description}
                    </div>
                  )}
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                  selectedSet === setStat.set.id ? 'rotate-90' : ''
                }`} />
              </div>
            </div>

            {/* Expanded View */}
            {selectedSet === setStat.set.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-gray-700"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {collectibles
                    .filter(c => c.setId === setStat.set.id)
                    .map((collectible) => (
                      <div
                        key={collectible.id}
                        className={`p-3 rounded-lg border ${
                          collectible.owned
                            ? getRarityColor(collectible.rarity)
                            : 'bg-gray-900 border-gray-800 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{collectible.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate ${
                              collectible.owned ? getRarityTextColor(collectible.rarity) : 'text-gray-500'
                            }`}>
                              {collectible.owned ? collectible.name : '???'}
                            </div>
                            <div className="text-xs text-text-secondary">
                              {collectible.owned ? collectible.rarity : 'Locked'}
                            </div>
                          </div>
                          {collectible.owned ? (
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          )}
                        </div>
                        {collectible.owned && (
                          <div className="mt-2 text-xs text-text-secondary">
                            +{Math.round(collectible.bonus.value * 100)}% {collectible.bonus.type}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Stardust Info */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="text-yellow-400">Stardust Currency</strong>
            <p className="text-yellow-200/70 mt-1">
              Earn stardust by converting duplicate collectibles. Use it to buy gacha tickets 
              or reset your pity counter in the Stardust Shop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
