import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { usePlayerStore } from '../../stores/playerStore';
import { formatNumber } from '../../types/resource';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function LeaderboardPanel() {
  const phantomPlayers = usePlayerStore(state => state.phantomPlayers);
  const playerRank = usePlayerStore(state => state.playerRank);
  const resources = useGameStore(state => state.resources);
  const totalProduction = useGameStore(state => state.totalProduction);
  
  const playerTotal = resources.ore.totalEarned;
  
  // Combine and sort
  const allPlayers = [
    ...phantomPlayers.map(p => ({ ...p, isPlayer: false })),
    { 
      id: 'player', 
      name: 'You', 
      productionRate: totalProduction, 
      totalOre: playerTotal, 
      rank: playerRank,
      isPlayer: true 
    },
  ].sort((a, b) => b.totalOre - a.totalOre);
  
  // Find player index
  const playerIndex = allPlayers.findIndex(p => p.isPlayer);
  const player = allPlayers[playerIndex];
  const nextPlayer = playerIndex > 0 ? allPlayers[playerIndex - 1] : null;
  const gapToNext = nextPlayer ? nextPlayer.totalOre - player.totalOre : 0;
  
  return (
    <div className="space-y-4">
      {/* Player rank highlight */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-r from-accent/20 to-bg-card rounded-xl p-4 border border-accent/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-text-secondary">Your Rank</div>
            <div className="text-3xl font-bold text-accent">#{playerRank}</div>
          </div>
          <Trophy className="w-10 h-10 text-accent/50" />
        </div>
        
        {gapToNext > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 p-2 bg-bg-secondary rounded-lg"
          >
            <div className="text-xs text-text-secondary mb-1">
              #{playerRank - 1} {nextPlayer?.name} is just ahead!
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-bg-primary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(player.totalOre / nextPlayer!.totalOre) * 100}%` }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
              <span className="text-xs text-accent font-medium">
                {formatNumber(gapToNext)} to go
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {/* Leaderboard list */}
      <div className="bg-bg-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-bg-secondary">
          <h3 className="font-semibold text-text-primary">Global Leaders</h3>
        </div>
        
        <div className="divide-y divide-bg-secondary">
          {allPlayers.slice(0, 10).map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 px-4 py-3 ${
                p.isPlayer ? 'bg-accent/10' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-tier-legendary/20 text-tier-legendary' :
                index === 1 ? 'bg-gray-300/20 text-gray-300' :
                index === 2 ? 'bg-orange-400/20 text-orange-400' :
                'bg-bg-secondary text-text-secondary'
              }`}>
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${p.isPlayer ? 'text-accent' : 'text-text-primary'}`}>
                  {p.name}
                </div>
                <div className="text-xs text-text-secondary flex items-center gap-1">
                  {p.productionRate > (allPlayers[index - 1]?.productionRate || 0) ? (
                    <TrendingUp className="w-3 h-3 text-tier-uncommon" />
                  ) : p.productionRate < (allPlayers[index - 1]?.productionRate || Infinity) ? (
                    <TrendingDown className="w-3 h-3 text-accent" />
                  ) : (
                    <Minus className="w-3 h-3 text-text-secondary" />
                  )}
                  {formatNumber(p.productionRate)}/s
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-text-primary">
                  {formatNumber(p.totalOre)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* FOMO message */}
      {playerRank > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-text-secondary"
        >
          <span className="text-accent">Top 5</span> players get special rewards!
        </motion.div>
      )}
    </div>
  );
}
