export interface Building {
  id: string;
  name: string;
  tier: number;
  baseProduction: number;
  baseCost: number;
  count: number;
  level: number;
  icon: string;
}

export interface BuildingType {
  id: string;
  name: string;
  tier: number;
  baseProduction: number;
  baseCost: number;
  icon: string;
}

export const BUILDING_TYPES: BuildingType[] = [
  { id: 'smelter', name: 'Manual Smelter', tier: 1, baseProduction: 1, baseCost: 10, icon: '🔨' },
  { id: 'drill', name: 'Auto-Drill', tier: 2, baseProduction: 5, baseCost: 50, icon: '⛏️' },
  { id: 'conveyor', name: 'Conveyor Belt', tier: 3, baseProduction: 20, baseCost: 200, icon: '⚙️' },
  { id: 'robot', name: 'Robotic Arm', tier: 4, baseProduction: 80, baseCost: 800, icon: '🤖' },
  { id: 'fabricator', name: 'AI Fabricator', tier: 5, baseProduction: 320, baseCost: 3200, icon: '🏭' },
  { id: 'nanite', name: 'Nanite Swarm', tier: 6, baseProduction: 1280, baseCost: 12800, icon: '🦠' },
  { id: 'quantum', name: 'Quantum Forge', tier: 7, baseProduction: 5120, baseCost: 51200, icon: '⚛️' },
  { id: 'dyson', name: 'Dyson Segment', tier: 8, baseProduction: 20480, baseCost: 204800, icon: '🌟' },
];

export function calculateBuildingCost(baseCost: number, count: number): number {
  return Math.floor(baseCost * Math.pow(1.15, count));
}

export function calculateBuildingProduction(baseProduction: number, level: number): number {
  return baseProduction * level * Math.pow(1.05, level - 1);
}

export function generateProceduralBuilding(tier: number): BuildingType {
  const prefixes = ['Hyper', 'Mega', 'Ultra', 'Omni', 'Cyber', 'Neo', 'Auto', 'Smart'];
  const suffixes = ['Refinery', 'Assembler', 'Constructor', 'Generator', 'Processor', 'Synthesizer', 'Compiler'];
  
  const baseProduction = Math.pow(4, tier - 1) * (tier > 8 ? 10 : 1);
  const baseCost = Math.pow(4, tier - 1) * 10;
  
  return {
    id: `procedural-${tier}-${Date.now()}`,
    name: `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`,
    tier,
    baseProduction,
    baseCost,
    icon: tier % 2 === 0 ? '🔧' : '⚡',
  };
}
