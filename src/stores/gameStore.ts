import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Building, BuildingType } from '../types/building';
import { BUILDING_TYPES, calculateBuildingCost, calculateBuildingProduction, generateProceduralBuilding } from '../types/building';
import type { Resource, ResourceType } from '../types/resource';
import { telemetry } from '../telemetry';
import { TelemetryEventType } from '../telemetry/events';

interface GameState {
  resources: Record<ResourceType, Resource>;
  buildings: Building[];
  totalProduction: number;
  lastTick: number;
  offlineProgress: number;
  unlockedTiers: number;
  currentZone: number;
  
  // Actions
  initialize: () => void;
  tick: (deltaTime: number) => void;
  buyBuilding: (buildingType: BuildingType) => void;
  upgradeBuilding: (buildingId: string) => void;
  addResources: (type: ResourceType, amount: number) => void;
  spendResources: (type: ResourceType, amount: number) => boolean;
  setZone: (zone: number) => void;
  calculateOfflineProgress: () => void;
  getProductionRate: (building: Building) => number;
  getBuildingCost: (buildingType: BuildingType) => number;
}

const initialResources: Record<ResourceType, Resource> = {
  ore: { type: 'ore', amount: 0, totalEarned: 0, totalSpent: 0 },
  alloy: { type: 'alloy', amount: 0, totalEarned: 0, totalSpent: 0 },
  component: { type: 'component', amount: 0, totalEarned: 0, totalSpent: 0 },
  module: { type: 'module', amount: 0, totalEarned: 0, totalSpent: 0 },
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      resources: initialResources,
      buildings: [],
      totalProduction: 0,
      lastTick: Date.now(),
      offlineProgress: 0,
      unlockedTiers: 1,
      currentZone: 0,

      initialize: () => {
        const now = Date.now();
        const { lastTick } = get();
        
        if (lastTick < now - 1000) {
          const offlineSeconds = Math.min((now - lastTick) / 1000, 8 * 60 * 60); // Max 8 hours
          const { totalProduction } = get();
          const offlineGain = totalProduction * offlineSeconds * 0.5; // 50% offline efficiency
          
          set((state) => ({
            resources: {
              ...state.resources,
              ore: {
                ...state.resources.ore,
                amount: state.resources.ore.amount + offlineGain,
                totalEarned: state.resources.ore.totalEarned + offlineGain,
              },
            },
            offlineProgress: offlineGain,
            lastTick: now,
          }));
        }
      },

      tick: (deltaTime: number) => {
        const { totalProduction } = get();
        const gain = totalProduction * deltaTime;
        
        set((state) => ({
          resources: {
            ...state.resources,
            ore: {
              ...state.resources.ore,
              amount: state.resources.ore.amount + gain,
              totalEarned: state.resources.ore.totalEarned + gain,
            },
          },
          lastTick: Date.now(),
        }));
      },

      buyBuilding: (buildingType: BuildingType) => {
        const cost = get().getBuildingCost(buildingType);
        const balance = get().resources.ore.amount;
        
        if (!get().spendResources('ore', cost)) {
          // Log failed purchase attempt (important for whale targeting)
          telemetry.logEvent(TelemetryEventType.BUILDING_PURCHASE_FAILED, {
            buildingId: buildingType.id,
            cost,
            playerBalance: balance,
          });
          return;
        }
        
        // Log successful purchase
        telemetry.logEvent(TelemetryEventType.BUILDING_PURCHASED, {
          buildingId: buildingType.id,
          cost,
          buildingTier: buildingType.tier,
        });

        set((state) => {
          const existingBuilding = state.buildings.find(b => b.id === buildingType.id);
          
          if (existingBuilding) {
            const updatedBuildings = state.buildings.map(b =>
              b.id === buildingType.id
                ? { ...b, count: b.count + 1 }
                : b
            );
            
            return {
              buildings: updatedBuildings,
              totalProduction: calculateTotalProduction(updatedBuildings),
              unlockedTiers: Math.max(state.unlockedTiers, buildingType.tier + 1),
            };
          } else {
            const newBuilding: Building = {
              ...buildingType,
              count: 1,
              level: 1,
            };
            
            const updatedBuildings = [...state.buildings, newBuilding];
            
            return {
              buildings: updatedBuildings,
              totalProduction: calculateTotalProduction(updatedBuildings),
              unlockedTiers: Math.max(state.unlockedTiers, buildingType.tier + 1),
            };
          }
        });
      },

      upgradeBuilding: (buildingId: string) => {
        const { buildings, resources } = get();
        const building = buildings.find(b => b.id === buildingId);
        
        if (!building) return;
        
        const upgradeCost = Math.floor(building.baseCost * Math.pow(2, building.level) * 0.5);
        
        if (resources.ore.amount < upgradeCost) {
          telemetry.logEvent(TelemetryEventType.UPGRADE_FAILED, {
            buildingId,
            cost: upgradeCost,
            playerBalance: resources.ore.amount,
          });
          return;
        }
        
        telemetry.logEvent(TelemetryEventType.UPGRADE_COMPLETED, {
          buildingId,
          cost: upgradeCost,
          newLevel: building.level + 1,
        });
        
        set((state) => {
          const updatedBuildings = state.buildings.map(b =>
            b.id === buildingId
              ? { ...b, level: b.level + 1 }
              : b
          );
          
          return {
            resources: {
              ...state.resources,
              ore: {
                ...state.resources.ore,
                amount: state.resources.ore.amount - upgradeCost,
                totalSpent: state.resources.ore.totalSpent + upgradeCost,
              },
            },
            buildings: updatedBuildings,
            totalProduction: calculateTotalProduction(updatedBuildings),
          };
        });
      },

      addResources: (type: ResourceType, amount: number) => {
        telemetry.logEvent(TelemetryEventType.RESOURCE_EARNED, {
          resourceType: type,
          resourceAmount: amount,
        });
        
        set((state) => ({
          resources: {
            ...state.resources,
            [type]: {
              ...state.resources[type],
              amount: state.resources[type].amount + amount,
              totalEarned: state.resources[type].totalEarned + amount,
            },
          },
        }));
      },

      spendResources: (type: ResourceType, amount: number) => {
        const { resources } = get();
        
        if (resources[type].amount < amount) {
          return false;
        }
        
        telemetry.logEvent(TelemetryEventType.RESOURCE_SPENT, {
          resourceType: type,
          resourceAmount: amount,
        });
        
        set((state) => ({
          resources: {
            ...state.resources,
            [type]: {
              ...state.resources[type],
              amount: state.resources[type].amount - amount,
              totalSpent: state.resources[type].totalSpent + amount,
            },
          },
        }));
        
        return true;
      },

      setZone: (zone: number) => {
        set({ currentZone: zone });
      },

      calculateOfflineProgress: () => {
        const { offlineProgress } = get();
        if (offlineProgress > 0) {
          set({ offlineProgress: 0 });
        }
      },

      getProductionRate: (building: Building) => {
        return calculateBuildingProduction(building.baseProduction, building.level) * building.count;
      },

      getBuildingCost: (buildingType: BuildingType) => {
        const { buildings } = get();
        const existingBuilding = buildings.find(b => b.id === buildingType.id);
        const count = existingBuilding?.count || 0;
        return calculateBuildingCost(buildingType.baseCost, count);
      },
    }),
    {
      name: 'infinity-forge-game',
    }
  )
);

function calculateTotalProduction(buildings: Building[]): number {
  return buildings.reduce((total, building) => {
    return total + calculateBuildingProduction(building.baseProduction, building.level) * building.count;
  }, 0);
}
