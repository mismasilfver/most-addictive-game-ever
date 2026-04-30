import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVIPStore } from '../../stores/vipStore';
import { PREMIUM_SHOP_ITEMS, getVIPConfig } from '../../types/vip';
import { Gem, Lock, X, Star } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  boost: '⚡ Boosts',
  skip: '⏩ Skip Timers',
  skin: '🎨 Skins',
  resource: '📦 Resources',
};

export function PremiumShop() {
  const { level, gems, purchaseItem, ownedItems } = useVIPStore();
  const [activeCategory, setActiveCategory] = useState<string>('boost');
  const [purchasedId, setPurchasedId] = useState<string | null>(null);
  const [showAlmostModal, setShowAlmostModal] = useState(false);
  const [almostItem, setAlmostItem] = useState<typeof PREMIUM_SHOP_ITEMS[0] | null>(null);

  const categories = [...new Set(PREMIUM_SHOP_ITEMS.map(i => i.category))];
  const visibleItems = PREMIUM_SHOP_ITEMS.filter(i => i.category === activeCategory);

  const handlePurchase = (itemId: string) => {
    const item = PREMIUM_SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (gems < item.gemCost) {
      // "Almost there!" manipulation
      setAlmostItem(item);
      setShowAlmostModal(true);
      return;
    }

    const success = purchaseItem(itemId);
    if (success) {
      setPurchasedId(itemId);
      setTimeout(() => setPurchasedId(null), 2000);
    }
  };

  const currentConfig = getVIPConfig(level);
  const nextConfig = getVIPConfig(level + 1);

  return (
    <div className="space-y-4">
      {/* VIP Level Progress */}
      {nextConfig && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-600/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-400 font-bold text-sm">
              {currentConfig?.badge} {currentConfig?.name ?? 'No VIP'} → {nextConfig.badge} {nextConfig.name}
            </span>
            <span className="text-yellow-300 text-xs">Unlock more benefits!</span>
          </div>
          <div className="text-text-secondary text-xs">
            Next: +{Math.round(nextConfig.benefits.productionBonus * 100)}% production
            {nextConfig.benefits.autoCollect && ' · Auto-Collect unlocked'}
            {nextConfig.benefits.noAds && ' · No ads'}
          </div>
        </div>
      )}

      {/* Gem Balance */}
      <div className="flex items-center justify-between bg-bg-card rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <Gem className="w-5 h-5 text-cyan-400" />
          <span className="text-text-primary font-bold">{gems.toLocaleString()} Gems</span>
        </div>
        <div className="text-text-secondary text-xs">Earned through play · No purchase required</div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-accent text-white'
                : 'bg-bg-card text-text-secondary hover:text-text-primary'
            }`}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-3">
        {visibleItems.map(item => {
          const owned = ownedItems.includes(item.id);
          const affordable = gems >= item.gemCost;
          const justPurchased = purchasedId === item.id;

          return (
            <motion.div
              key={item.id}
              className={`bg-bg-card rounded-xl p-4 relative overflow-hidden ${
                justPurchased ? 'ring-2 ring-green-500' : ''
              }`}
              animate={justPurchased ? { scale: [1, 1.02, 1] } : {}}
            >
              {item.tag && (
                <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                  item.tag === 'BEST VALUE' ? 'bg-green-500 text-white' :
                  item.tag === 'POPULAR' ? 'bg-blue-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  {item.tag}
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary font-bold text-sm">{item.name}</div>
                  <div className="text-text-secondary text-xs mt-0.5">{item.description}</div>
                  <div className="text-text-secondary text-xs mt-1">
                    Real value: <span className="line-through">{item.originalValue}</span>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(item.id)}
                  disabled={owned}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors flex-shrink-0 ${
                    owned ? 'bg-green-500/20 text-green-400 cursor-default' :
                    affordable ? 'bg-accent text-white hover:bg-accent/90' :
                    'bg-bg-secondary text-text-secondary hover:bg-bg-card'
                  }`}
                >
                  {owned ? (
                    <>✓ Owned</>
                  ) : affordable ? (
                    <>
                      <Gem className="w-3.5 h-3.5 text-cyan-300" />
                      {item.gemCost}
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <Gem className="w-3.5 h-3.5 text-cyan-300/50" />
                      {item.gemCost}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* "Almost There!" FOMO Modal */}
      <AnimatePresence>
        {showAlmostModal && almostItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAlmostModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-bg-card rounded-2xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowAlmostModal(false)}
                className="absolute top-4 right-4 text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <Star className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-text-primary mb-1">Almost There!</h3>
                <p className="text-text-secondary text-sm mb-4">
                  You need {almostItem.gemCost - gems} more gems to get{' '}
                  <span className="text-accent font-medium">{almostItem.name}</span>!
                </p>
                <div className="bg-bg-secondary rounded-xl p-3 mb-4">
                  <div className="text-text-secondary text-xs mb-2">Keep playing to earn gems:</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-text-primary">
                      <span>🏆 Unlock achievements</span>
                      <span className="text-cyan-400">+50 gems each</span>
                    </div>
                    <div className="flex justify-between text-text-primary">
                      <span>📅 Daily login streak</span>
                      <span className="text-cyan-400">+10 gems/day</span>
                    </div>
                    <div className="flex justify-between text-text-primary">
                      <span>⬆️ Prestige ascension</span>
                      <span className="text-cyan-400">+100 gems</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAlmostModal(false)}
                  className="w-full py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-colors"
                >
                  Keep Playing →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
