import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { usePlayerStore } from '../../stores/playerStore';
import { BUILDING_TYPES } from '../../types/building';
import { formatNumber } from '../../types/resource';
import { BuildingCard } from './BuildingCard';

export function BuildingGrid() {
  const buildings = useGameStore(state => state.buildings);
  const resources = useGameStore(state => state.resources);
  const buyBuilding = useGameStore(state => state.buyBuilding);
  const upgradeBuilding = useGameStore(state => state.upgradeBuilding);
  const getBuildingCost = useGameStore(state => state.getBuildingCost);
  const getProductionRate = useGameStore(state => state.getProductionRate);
  const recordTap = usePlayerStore(state => state.recordTap);
  
  // Calculate optimal purchase (lowest cost per production)
  const buildingEfficiency = BUILDING_TYPES.map(type => {
    const cost = getBuildingCost(type);
    const existingBuilding = buildings.find(b => b.id === type.id);
    const production = existingBuilding 
      ? getProductionRate(existingBuilding) / existingBuilding.count 
      : type.baseProduction;
    return { type, efficiency: production / cost, cost, production };
  });
  
  const bestEfficiency = Math.max(...buildingEfficiency.map(b => b.efficiency));
  
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
        <span>Buildings</span>
        <span className="text-accent">{buildings.reduce((sum, b) => sum + b.count, 0)} owned</span>
      </div>
      
      {BUILDING_TYPES.map((buildingType, index) => {
        const existingBuilding = buildings.find(b => b.id === buildingType.id);
        const cost = getBuildingCost(buildingType);
        const canAfford = resources.ore.amount >= cost;
        const count = existingBuilding?.count || 0;
        const level = existingBuilding?.level || 1;
        const production = existingBuilding 
          ? getProductionRate(existingBuilding) 
          : buildingType.baseProduction;
        const efficiency = buildingEfficiency[index].efficiency;
        const isOptimal = efficiency === bestEfficiency && canAfford;
        
        return (
          <BuildingCard
            key={buildingType.id}
            buildingType={buildingType}
            count={count}
            level={level}
            cost={cost}
            production={production}
            canAfford={canAfford}
            isOptimal={isOptimal}
            onBuy={() => {
              buyBuilding(buildingType);
              recordTap();
            }}
            onUpgrade={() => {
              upgradeBuilding(buildingType.id);
              recordTap();
            }}
            delay={index * 0.05}
          />
        );
      })}
      
      {/* Unlock tease for next tier */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 p-4 bg-bg-card/50 border-2 border-dashed border-text-secondary/30 rounded-xl text-center"
      >
        <div className="text-text-secondary text-sm mb-1">
          🔒 Unlock at {formatNumber(BUILDING_TYPES[BUILDING_TYPES.length - 1].baseCost * 10)} ore
        </div>
        <div className="text-xs text-text-secondary/60">
          Next tier buildings generate alloys
        </div>
        
        {/* Near-miss progress bar */}
        <div className="mt-3 h-2 bg-bg-secondary rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-accent to-tier-legendary"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(95, (resources.ore.amount / (BUILDING_TYPES[BUILDING_TYPES.length - 1].baseCost * 10)) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs text-accent mt-1">
          {Math.floor((resources.ore.amount / (BUILDING_TYPES[BUILDING_TYPES.length - 1].baseCost * 10)) * 100)}% to unlock
        </div>
      </motion.div>
    </div>
  );
}
