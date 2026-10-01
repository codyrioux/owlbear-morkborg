import weaponsJson from './weapons.json';
import armorJson from './armor.json';
import equipmentJson from './equipment.json';
import scrollsJson from './scrolls.json';
import classesJson from './classes.json';
import miseriesJson from './miseries.json';
import monstersJson from './monsters.json';
import oraclesJson from './oracles.json';

// --- Types ---

export interface WeaponData {
  id: string;
  name: string;
  type: 'melee' | 'ranged';
  damageDie: string;
  costSilver: number;
  special?: string;
}

export interface ArmorTierData {
  tier: number;
  name: string;
  damageReduction: string;
  slots: number;
  costSilver: number;
  defensePenalty: number;
  agilityPenalty: number;
  preventsPowers: boolean;
  description: string;
}

export interface ShieldData {
  name: string;
  damageReduction: string;
  slots: number;
  costSilver: number;
  description: string;
}

export interface ArmorData {
  tiers: ArmorTierData[];
  shield: ShieldData;
}

export interface EquipmentData {
  id: string;
  name: string;
  slots: number;
  quantity: number;
  stackSize?: number;
  isAmmunition?: boolean;
  costSilver: number;
  description: string;
}

export interface ScrollData {
  id: string;
  name: string;
  type: 'unclean' | 'sacred';
  description: string;
}

export interface ClassData {
  id: string;
  name: string;
  hpDie: number;
  omenDie: 'd2' | 'd4';
  desc: string;
  traits: string;
}

export type CampaignDurationDie = 'd100' | 'd20' | 'd10' | 'd6' | 'd4' | 'd2';

export interface DurationDieData {
  id: string;
  name: string;
  die: CampaignDurationDie;
  description: string;
}

export interface VerseData {
  verse: number;
  title: string;
  text: string;
}

export interface PsalmData {
  psalm: number;
  title: string;
  verses: VerseData[];
}

export interface SeventhMiseryData {
  title: string;
  verse: string;
  text: string;
}

export interface MiseriesData {
  durationDice: DurationDieData[];
  psalms: PsalmData[];
  seventhMisery: SeventhMiseryData;
}

export interface MonsterAttackData {
  name: string;
  damageDie: string;
  special?: string;
}

export interface MonsterData {
  id: string;
  name: string;
  epithet: string;
  hp: number;
  morale: number | 'special' | null;
  armorTier: number;
  damageReduction: string;
  attacks: MonsterAttackData[];
  specialRules: string[];
  bounties: Record<string, string | undefined>;
  description: string;
}

export interface WeatherEntry {
  roll: number;
  title: string;
  description: string;
}

export interface TrapEntry {
  roll: number;
  title: string;
  description: string;
}

export interface CorpseLootEntry {
  roll: string;
  min: number;
  max: number;
  title: string;
  description: string;
}

export interface BasiliskDemandEntry {
  roll: number;
  demand: string;
}

export interface ArcaneCatastropheEntry {
  roll: number;
  title: string;
  effect: string;
}

export interface BrokenTableEntry {
  roll: number;
  title: string;
  description: string;
}

export interface GettingBetterDebrisEntry {
  roll: number;
  type: 'nothing' | 'silver' | 'unclean_scroll' | 'sacred_scroll';
  description: string;
}

export interface OraclesData {
  weather: WeatherEntry[];
  trapsAndDevilry: TrapEntry[];
  corpsePlundering: CorpseLootEntry[];
  basilisksDemand: BasiliskDemandEntry[];
  arcaneCatastrophes: ArcaneCatastropheEntry[];
  brokenTable: BrokenTableEntry[];
  gettingBetterDebris: GettingBetterDebrisEntry[];
}

// --- Data Stores ---

const weapons: WeaponData[] = weaponsJson as unknown as WeaponData[];
const armor: ArmorData = armorJson as unknown as ArmorData;
const equipment: EquipmentData[] = equipmentJson as unknown as EquipmentData[];
const scrolls: ScrollData[] = scrollsJson as unknown as ScrollData[];
const classes: ClassData[] = classesJson as unknown as ClassData[];
const miseries: MiseriesData = miseriesJson as unknown as MiseriesData;
const monsters: MonsterData[] = monstersJson as unknown as MonsterData[];
const oracles: OraclesData = oraclesJson as unknown as OraclesData;

// --- Cache for Preset Lookups ---

export const ITEM_STACK_PRESETS: Record<string, { stackSize: number; slots: number; isAmmunition?: boolean }> = {};

for (const item of equipment) {
  if (item.stackSize && item.stackSize > 1) {
    const entry = {
      stackSize: item.stackSize,
      slots: item.slots,
      isAmmunition: Boolean(item.isAmmunition),
    };
    ITEM_STACK_PRESETS[item.name.toLowerCase()] = entry;
    // Also index common variations (e.g. singular without trailing 's')
    if (item.name.toLowerCase().endsWith('s')) {
      ITEM_STACK_PRESETS[item.name.toLowerCase().slice(0, -1)] = entry;
    }
  }
}

// Ensure common synonyms are registered
const synonyms: Record<string, { stackSize: number; slots: number; isAmmunition?: boolean }> = {
  'arrow': { stackSize: 20, slots: 1, isAmmunition: true },
  'arrows': { stackSize: 20, slots: 1, isAmmunition: true },
  'crossbow bolt': { stackSize: 10, slots: 1, isAmmunition: true },
  'crossbow bolts': { stackSize: 10, slots: 1, isAmmunition: true },
  'bolt': { stackSize: 10, slots: 1, isAmmunition: true },
  'bolts': { stackSize: 10, slots: 1, isAmmunition: true },
  'sling bullet': { stackSize: 20, slots: 1, isAmmunition: true },
  'sling bullets': { stackSize: 20, slots: 1, isAmmunition: true },
  'sling stone': { stackSize: 20, slots: 1, isAmmunition: true },
  'sling stones': { stackSize: 20, slots: 1, isAmmunition: true },
  'torch': { stackSize: 4, slots: 1 },
  'torches': { stackSize: 4, slots: 1 },
  'ration': { stackSize: 4, slots: 1 },
  'rations': { stackSize: 4, slots: 1 },
  'dry ration': { stackSize: 4, slots: 1 },
  'dry rations': { stackSize: 4, slots: 1 },
  'dried food': { stackSize: 4, slots: 1 },
  'food': { stackSize: 4, slots: 1 },
  'chalk': { stackSize: 10, slots: 1 },
  'iron nail': { stackSize: 10, slots: 1 },
  'iron nails': { stackSize: 10, slots: 1 },
  'nail': { stackSize: 10, slots: 1 },
  'nails': { stackSize: 10, slots: 1 },
  'caltrop': { stackSize: 2, slots: 1 },
  'caltrops': { stackSize: 2, slots: 1 },
  'needle': { stackSize: 10, slots: 1 },
  'needles': { stackSize: 10, slots: 1 },
  'magnesium strip': { stackSize: 4, slots: 1 },
  'magnesium strips': { stackSize: 4, slots: 1 },
  'chewing tobacco': { stackSize: 4, slots: 1 },
  'tobacco': { stackSize: 4, slots: 1 },
  'throwing knife': { stackSize: 3, slots: 1 },
  'throwing knives': { stackSize: 3, slots: 1 },
  'poison': { stackSize: 4, slots: 1 },
  'poisons': { stackSize: 4, slots: 1 },
  'elixir': { stackSize: 4, slots: 1 },
  'elixirs': { stackSize: 4, slots: 1 },
};

Object.assign(ITEM_STACK_PRESETS, synonyms);

// --- Accessors ---

export function getWeapons(): WeaponData[] {
  return weapons;
}

export function getWeapon(idOrName: string): WeaponData | undefined {
  const query = idOrName.toLowerCase();
  return weapons.find((w) => w.id.toLowerCase() === query || w.name.toLowerCase() === query);
}

export function getArmorData(): ArmorData {
  return armor;
}

export function getArmorTier(tier: number): ArmorTierData | undefined {
  return armor.tiers.find((a) => a.tier === tier);
}

export function getEquipment(): EquipmentData[] {
  return equipment;
}

export function getEquipmentItem(idOrName: string): EquipmentData | undefined {
  const query = idOrName.toLowerCase();
  return equipment.find((e) => e.id.toLowerCase() === query || e.name.toLowerCase() === query);
}

export function getItemPreset(name: string): { stackSize: number; slots: number; isAmmunition?: boolean } | null {
  const normalized = name.trim().toLowerCase();
  if (ITEM_STACK_PRESETS[normalized]) {
    return ITEM_STACK_PRESETS[normalized];
  }
  // Substring matching fallback
  if (normalized.includes('arrow')) {
    return { stackSize: 20, slots: 1, isAmmunition: true };
  }
  if (normalized.includes('bolt')) {
    return { stackSize: 10, slots: 1, isAmmunition: true };
  }
  if (normalized.includes('sling bullet') || normalized.includes('sling stone')) {
    return { stackSize: 20, slots: 1, isAmmunition: true };
  }
  if (normalized.includes('chalk')) {
    return { stackSize: 10, slots: 1 };
  }
  if (normalized.includes('torch')) {
    return { stackSize: 4, slots: 1 };
  }
  if (normalized.includes('ration') || normalized.includes('dried food')) {
    return { stackSize: 4, slots: 1 };
  }
  if (normalized.includes('nail')) {
    return { stackSize: 10, slots: 1 };
  }
  if (normalized.includes('caltrop')) {
    return { stackSize: 2, slots: 1 };
  }
  if (normalized.includes('needle')) {
    return { stackSize: 10, slots: 1 };
  }
  if (normalized.includes('magnesium strip') || normalized.includes('magnesium')) {
    return { stackSize: 4, slots: 1 };
  }
  if (normalized.includes('chewing tobacco') || normalized.includes('tobacco')) {
    return { stackSize: 4, slots: 1 };
  }
  if (normalized.includes('throwing knife') || normalized.includes('throwing knives')) {
    return { stackSize: 3, slots: 1 };
  }
  if (normalized.includes('poison')) {
    return { stackSize: 4, slots: 1 };
  }
  return null;
}

export const CANONICAL_SCROLLS: Array<{ name: string; type: 'unclean' | 'sacred'; description: string }> = scrolls.map(
  ({ name, type, description }) => ({ name, type, description })
);

export function getScrolls(): ScrollData[] {
  return scrolls;
}

export function getScroll(idOrName: string): ScrollData | undefined {
  const query = idOrName.toLowerCase();
  return scrolls.find((s) => s.id.toLowerCase() === query || s.name.toLowerCase() === query);
}

export function getClasses(): ClassData[] {
  return classes;
}

export function getClass(idOrName: string): ClassData | undefined {
  const query = idOrName.toLowerCase();
  return classes.find((c) => c.id.toLowerCase() === query || c.name.toLowerCase() === query);
}

export function getMiseries(): MiseriesData {
  return miseries;
}

export function getMonsters(): MonsterData[] {
  return monsters;
}

export function getMonster(id: string): MonsterData | undefined {
  const query = id.toLowerCase();
  return monsters.find((m) => m.id.toLowerCase() === query || m.name.toLowerCase().includes(query));
}

export function getOracles(): OraclesData {
  return oracles;
}
