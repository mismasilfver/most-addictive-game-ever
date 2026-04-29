import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimedEventsStore } from '../../stores/timedEventsStore';
import { Clock, Zap, Calendar, AlertTriangle } from 'lucide-react';
import { formatTimeRemaining } from '../../types/timedEvents';

export function TimedEventBanner() {
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const { 
    activeEvents, 
    flashSale, 
    currentOffer,
    getActiveMultipliers,
    getCurrentRushHourInfo,
    getWeekendBoostInfo,
    getUrgencyMessage,
    dismissFlashSale,
    dismissOffer,
  } = useTimedEventsStore();

  const multipliers = getActiveMultipliers();
  const rushHourInfo = getCurrentRushHourInfo();
  const weekendBoost = getWeekendBoostInfo();
  const urgencyMessage = getUrgencyMessage();

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      if (flashSale) {
        const remaining = flashSale.expiresAt - Date.now();
        setTimeLeft(formatTimeRemaining(remaining));
      } else if (currentOffer) {
        const remaining = currentOffer.expiresAt - Date.now();
        setTimeLeft(formatTimeRemaining(remaining));
      } else if (rushHourInfo?.rushHour) {
        // Calculate time until rush hour ends
        const now = new Date();
        const endTime = new Date(now);
        endTime.setHours(rushHourInfo.rushHour.endHour, 0, 0, 0);
        const remaining = endTime.getTime() - now.getTime();
        setTimeLeft(formatTimeRemaining(remaining));
      } else {
        setTimeLeft('');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [flashSale, currentOffer, rushHourInfo]);

  // Clean up expired events
  useEffect(() => {
    const interval = setInterval(() => {
      useTimedEventsStore.getState().removeExpiredEvents();
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {/* Flash Sale Banner */}
      {flashSale && (
        <motion.div
          key="flash-sale"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-4 mb-4 shadow-lg relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">⚡ FLASH SALE</div>
                <div className="text-white/80 text-sm">
                  {flashSale.remainingQuantity} left • {flashSale.viewersCount} viewing
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-white font-mono">
                {timeLeft}
              </div>
              <div className="text-white/70 text-xs">
                Ends in
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="flex-1 py-2 bg-white text-red-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">
              View Deal ({Math.round((1 - flashSale.saleCost / flashSale.originalCost) * 100)}% OFF)
            </button>
            <button 
              onClick={dismissFlashSale}
              className="px-3 py-2 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* Limited Offer Banner */}
      {currentOffer && !flashSale && (
        <motion.div
          key="limited-offer"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 mb-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">⏰ LIMITED OFFER</div>
                <div className="text-white/80 text-sm">
                  {currentOffer.name} • {currentOffer.purchasesRemaining} remaining
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-white font-mono">
                {timeLeft}
              </div>
              <div className="text-white/70 text-xs">
                Offer expires
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="flex-1 py-2 bg-white text-purple-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">
              ${currentOffer.price} • Value: ${currentOffer.originalValue}
            </button>
            <button 
              onClick={dismissOffer}
              className="px-3 py-2 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* Rush Hour / Weekend Boost Banner */}
      {(rushHourInfo?.rushHour || weekendBoost.active) && !flashSale && !currentOffer && (
        <motion.div
          key="boost-banner"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 mb-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                {rushHourInfo?.rushHour ? (
                  <>
                    <div className="text-white font-bold text-lg">
                      ⚡ {rushHourInfo.rushHour.name} ACTIVE
                    </div>
                    <div className="text-white/80 text-sm">
                      {rushHourInfo.rushHour.description}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-white font-bold text-lg">
                      🎉 Weekend Boost Active
                    </div>
                    <div className="text-white/80 text-sm">
                      +25% all bonuses
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {rushHourInfo?.rushHour && (
              <div className="text-right">
                <div className="text-2xl font-bold text-white font-mono">
                  {timeLeft}
                </div>
                <div className="text-white/70 text-xs">
                  Ends in
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2 text-center">
            {multipliers.productionMultiplier > 1 && (
              <div className="flex-1 bg-white/20 rounded-lg p-2">
                <div className="text-white font-bold">{multipliers.productionMultiplier}x</div>
                <div className="text-white/70 text-xs">Production</div>
              </div>
            )}
            {multipliers.crateSpawnRate > 1 && (
              <div className="flex-1 bg-white/20 rounded-lg p-2">
                <div className="text-white font-bold">{multipliers.crateSpawnRate}x</div>
                <div className="text-white/70 text-xs">Crates</div>
              </div>
            )}
            {multipliers.tapMultiplier > 1 && (
              <div className="flex-1 bg-white/20 rounded-lg p-2">
                <div className="text-white font-bold">{multipliers.tapMultiplier}x</div>
                <div className="text-white/70 text-xs">Tap</div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Next Event Preview */}
      {!flashSale && !currentOffer && !rushHourInfo?.rushHour && !weekendBoost.active && rushHourInfo?.nextRushHour && (
        <motion.div
          key="next-event"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-bg-card border border-accent/30 rounded-xl p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-accent" />
            <div className="flex-1">
              <div className="text-sm text-text-secondary">
                Next: {rushHourInfo.nextRushHour.name}
              </div>
              <div className="text-white font-semibold">
                Starts in {formatTimeRemaining(rushHourInfo.timeUntilNext)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
