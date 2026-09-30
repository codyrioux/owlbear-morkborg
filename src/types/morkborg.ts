export type AbilityName = 'strength' | 'agility' | 'presence' | 'toughness';

export interface AbilityScore {
  score: number;
  modifier: number;
}

export type OmenDieType = 'd2' | 'd4';

export interface Weapon {
  id: string;
  name: string;
  type: 'melee' | 'ranged';
  damageDie: string; // e.g. 'd4', 'd6', 'd8', 'd10'
  special?: string;
}

export type ArmorTier = 0 | 1 | 2 | 3;

export interface Armor {
  name: string;
  tier: ArmorTier; // 0 = none, 1 = light (-d2), 2 = medium (-d4), 3 = heavy (-d6)
  damageReduction: string;
  degraded: number; // Tier lost due to fumbles
  hasShield: boolean; // -1 dmg or sacrifice to nullify 1 attack
}

export interface InventoryItem {
  id: string;
  name: string;
  slots: number; // 1 = normal, 2 = heavy/bulky, 0 = negligible
  quantity: number;
  description?: string;
}

export interface Scroll {
  id: string;
  name: string;
  type: 'unclean' | 'sacred';
  description: string;
}

export interface Conditions {
  infected: boolean; // No heal on rest, loses d6 HP daily
  starving: boolean; // No heal on rest
}

export interface BrokenStatus {
  isBroken: boolean;
  result?: {
    roll: number;
    title: string;
    description: string;
  };
}

export interface Character {
  id: string;
  name: string;
  characterClass: string;
  description: string;
  abilities: Record<AbilityName, AbilityScore>;
  hp: {
    current: number;
    max: number;
  };
  omens: {
    current: number;
    max: number;
    dieType: OmenDieType;
  };
  powers: {
    current: number;
    max: number; // Daily uses: Presence modifier + d4 (min 0)
  };
  silver: number;
  armor: Armor;
  weapons: Weapon[];
  inventory: InventoryItem[];
  scrolls: Scroll[];
  conditions: Conditions;
  broken: BrokenStatus;
}

export type RollType = 
  | 'ability' 
  | 'attack' 
  | 'damage' 
  | 'defense' 
  | 'armor_soak' 
  | 'power_test' 
  | 'rest' 
  | 'broken' 
  | 'omen_spend';

export interface RollResult {
  id: string;
  timestamp: number;
  characterName: string;
  type: RollType;
  title: string;
  roll: number;
  diceRolls?: number[];
  modifier: number;
  total: number;
  targetDR?: number;
  success?: boolean;
  isCrit?: boolean; // Natural 20
  isFumble?: boolean; // Natural 1
  details: string;
  flavor?: string;
}

export interface BroadcastPayload {
  sourcePlayer: string;
  characterName: string;
  roll: RollResult;
}
