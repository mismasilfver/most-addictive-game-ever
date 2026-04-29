import { motion } from 'framer-motion';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { ASCENSION_SHOP_ITEMS } from '../../types/prestige';
import { ShoppingCart, Lock, Check, Star } from 'lucide-react';

export function AscensionShop() {
  const { 
    ascension, 
    purchaseShopItem, 
    ascensionShopPurchases 
  } = usePrestigeStore();

  const hasShop = ascension.unlocks.includes('ascension_shop');

  if (!hasShop) {
    return (
      <div className="p-8 text-center">
        <Lock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Shop Locked</h3>
        <p className="text-text-secondary">
          Complete your first ascension to unlock the Ascension Shop
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-yellow-400" />
            Ascension Shop
          </h2>
          <p className="text-sm text-text-secondary">
            Spend points on permanent upgrades
          </p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2">
          <div className="text-xs text-yellow-400">Points</div>
          <div className="text-xl font-bold text-yellow-400">
            {ascension.ascensionPoints}
          </div>
        </div>
      </div>

      {/* Shop Items */}
      <div className="grid gap-3">
        {ASCENSION_SHOP_ITEMS.map((item) => {
          const currentPurchases = ascensionShopPurchases[item.id] || 0;
          const maxed = currentPurchases >= item.maxPurchases;
          const affordable = ascension.ascensionPoints >= item.cost;

          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: maxed ? 1 : 1.02 }}
              className={`p-4 rounded-xl border ${
                maxed
                  ? 'bg-green-500/10 border-green-500/30'
                  : affordable
                  ? 'bg-bg-card border-accent/20'
                  : 'bg-bg-card border-gray-700 opacity-70'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    {maxed && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        MAXED
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-text-secondary mb-3">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">
                        {item.cost} points
                      </span>
                      <span className="text-xs text-text-secondary">
                        ({currentPurchases}/{item.maxPurchases})
                      </span>
                    </div>
                    
                    {!maxed && (
                      <button
                        onClick={() => purchaseShopItem(item.id)}
                        disabled={!affordable}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          affordable
                            ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Buy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <strong className="text-blue-400">Permanent Upgrades</strong>
            <p className="mt-1">
              These upgrades persist through all future ascensions and stack with each purchase.
              They make each run faster and more efficient!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
