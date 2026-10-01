import { 
  AbilityName, 
  Armor, 
  Character, 
  InventoryItem, 
  RollResult, 
  Scroll, 
  Weapon 
} from '../types/morkborg';
import { rollDie, rollDice, rollFormula, scoreToModifier, formatModifier } from './dice';
import {
  CANONICAL_SCROLLS,
  ITEM_STACK_PRESETS,
  getItemPreset,
  getClasses,
  getWeapons,
  getArmorData,
  getOracles,
} from '../data';

export { CANONICAL_SCROLLS, ITEM_STACK_PRESETS, getItemPreset };

/**
 * Perform an Ability test: d20 + modifier vs DR
 */
/**
 * Calculates the total DR penalty for an ability test.
 * - Strength: +2 DR if overencumbered.
 * - Agility: +2 DR if overencumbered; +2 DR if wearing Medium armor (tier 2); +4 DR if wearing Heavy armor (tier 3).
 * - Presence & Toughness: 0 penalty.
 */
export function getAbilityDRPenalty(
  ability: AbilityName,
  armor: Armor,
  isOverencumbered: boolean
): number {
  let penalty = 0;
  if (isOverencumbered && (ability === 'strength' || ability === 'agility')) {
    penalty += 2;
  }
  if (ability === 'agility') {
    const effectiveTier = Math.max(0, armor.tier - armor.degraded);
    if (effectiveTier === 2) {
      penalty += 2;
    } else if (effectiveTier >= 3) {
      penalty += 4;
    }
  }
  return penalty;
}

export function performAbilityCheck(
  characterName: string,
  ability: AbilityName,
  modifier: number,
  targetDR: number = 12,
  omenLowerDR: number = 0,
  drPenalty: number = 0
): RollResult {
  const d20 = rollDie(20);
  const effectiveDR = Math.max(2, targetDR - omenLowerDR);
  const total = d20 + modifier;
  const isCrit = d20 === 20;
  const isFumble = d20 === 1;
  const success = isCrit ? true : isFumble ? false : total >= effectiveDR;

  let flavor = '';
  if (isCrit) {
    flavor = 'CRITICAL SUCCESS! Fate smiles upon your miserable wretched soul.';
  } else if (isFumble) {
    flavor = 'FUMBLE! The dying world punishes your pathetic failure.';
  } else if (success) {
    flavor = 'Success. You survive another cruel moment.';
  } else {
    flavor = 'Failure. Pain and misfortune mount.';
  }

  const penaltyNote = drPenalty > 0 ? ` (+${drPenalty} DR penalty)` : '';

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    characterName,
    type: 'ability',
    title: `${ability.charAt(0).toUpperCase() + ability.slice(1)} Test`,
    roll: d20,
    modifier,
    total,
    targetDR: effectiveDR,
    success,
    isCrit,
    isFumble,
    details: `Rolled [${d20}] ${modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`} = ${total} vs DR ${effectiveDR}${penaltyNote}`,
    flavor,
  };
}

/**
 * Defend test (d20 + Agility vs DR 12 + armor penalty)
 */
export function performDefend(
  characterName: string,
  agilityModifier: number,
  armorTier: number,
  targetDR: number = 12
): RollResult {
  const d20 = rollDie(20);
  // Medium and Heavy armor add +2 to DR for Agility tests
  const armorPenalty = armorTier >= 2 ? 2 : 0;
  const effectiveDR = targetDR + armorPenalty;
  const total = d20 + agilityModifier;
  const isCrit = d20 === 20;
  const isFumble = d20 === 1;
  const success = isCrit ? true : isFumble ? false : total >= effectiveDR;

  let flavor = '';
  if (isCrit) {
    flavor = 'CRITICAL DEFENSE! You evade completely and gain a free counter-attack!';
  } else if (isFumble) {
    flavor = 'FUMBLE! You take DOUBLE damage and your armor degrades by 1 tier!';
  } else if (success) {
    flavor = 'Defense successful. The blow clatters away into the mud.';
  } else {
    flavor = 'Defense failed. Prepare to soak damage.';
  }

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    characterName,
    type: 'defense',
    title: 'Defend Roll',
    roll: d20,
    modifier: agilityModifier,
    total,
    targetDR: effectiveDR,
    success,
    isCrit,
    isFumble,
    details: `Rolled [${d20}] ${agilityModifier >= 0 ? `+ ${agilityModifier}` : `- ${Math.abs(agilityModifier)}`} = ${total} vs DR ${effectiveDR} ${armorPenalty > 0 ? '(+2 DR from armor)' : ''}`,
    flavor,
  };
}

/**
 * Weapon Attack Roll (d20 + Strength for Melee, or Presence for Ranged)
 */
export function performAttack(
  characterName: string,
  weapon: Weapon,
  modifier: number,
  targetDR: number = 12
): RollResult {
  const d20 = rollDie(20);
  const total = d20 + modifier;
  const isCrit = d20 === 20;
  const isFumble = d20 === 1;
  const success = isCrit ? true : isFumble ? false : total >= targetDR;

  let flavor = '';
  if (isCrit) {
    flavor = `CRITICAL STRIKE with ${weapon.name}! Deals DOUBLE damage and lowers target's armor!`;
  } else if (isFumble) {
    flavor = `FUMBLE with ${weapon.name}! Weapon drops, breaks, or strikes an ally!`;
  } else if (success) {
    flavor = `Hit! Your ${weapon.name} bites deep.`;
  } else {
    flavor = `Miss. The ${weapon.name} cuts only cold, putrid air.`;
  }

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    characterName,
    type: 'attack',
    title: `Attack: ${weapon.name}`,
    roll: d20,
    modifier,
    total,
    targetDR,
    success,
    isCrit,
    isFumble,
    details: `Rolled [${d20}] ${modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`} = ${total} vs DR ${targetDR}`,
    flavor,
  };
}

/**
 * Weapon Damage Roll
 */
export function performWeaponDamage(
  characterName: string,
  weapon: Weapon,
  isCrit: boolean = false,
  maxDamage: boolean = false
): RollResult {
  const parsed = rollFormula(weapon.damageDie);
  let total = parsed.total;
  let rolls = [...parsed.rolls];

  if (maxDamage) {
    // Used an omen for maximum damage: maximize all dice and add modifier
    const cleaned = weapon.damageDie.trim().toLowerCase().replace(/\s+/g, '');
    const regex = /^(\d*)d(\d+)(?:([+-])(\d+))?$/;
    const match = cleaned.match(regex);
    if (match) {
      const count = match[1] ? parseInt(match[1], 10) : 1;
      const sides = parseInt(match[2], 10);
      const sign = match[3];
      const modVal = match[4] ? parseInt(match[4], 10) : 0;
      const modifier = sign === '-' ? -modVal : modVal;
      rolls = Array(count).fill(sides);
      total = Math.max(0, count * sides + modifier);
    } else {
      const fixedNum = parseInt(cleaned, 10);
      total = !isNaN(fixedNum) ? fixedNum : 6;
      rolls = [total];
    }
  } else if (isCrit) {
    // Critical hit deals double damage (roll twice)
    const secondRoll = rollFormula(weapon.damageDie);
    rolls.push(...secondRoll.rolls);
    total = total + secondRoll.total;
  }

  const modText = parsed.modifier > 0
    ? ` + ${parsed.modifier}`
    : parsed.modifier < 0
    ? ` - ${Math.abs(parsed.modifier)}`
    : '';

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    characterName,
    type: 'damage',
    title: `Damage: ${weapon.name}`,
    roll: total,
    diceRolls: rolls,
    modifier: parsed.modifier,
    total,
    details: maxDamage 
      ? `MAX DAMAGE (Omen spent): ${total} damage!`
      : isCrit 
      ? `CRITICAL DOUBLE DAMAGE: [${rolls.join(' + ')}] = ${total} damage!`
      : `Rolled [${rolls.join(' + ')}]${modText} = ${total} damage`,
    flavor: total >= 8 ? 'Devastating, gory wound!' : 'A vicious, bloody cut.',
  };
}

/**
 * Armor Damage Soak Roll
 */
export function performArmorSoak(
  characterName: string,
  armor: Armor
): RollResult {
  let soak = 0;
  let rollText = '';

  // Effective tier factoring in degradation
  const effectiveTier = Math.max(0, armor.tier - armor.degraded);

  if (effectiveTier === 1) {
    soak = rollDie(2);
    rollText = `Light Armor (-d2): soaked ${soak}`;
  } else if (effectiveTier === 2) {
    soak = rollDie(4);
    rollText = `Medium Armor (-d4): soaked ${soak}`;
  } else if (effectiveTier === 3) {
    soak = rollDie(6);
    rollText = `Heavy Armor (-d6): soaked ${soak}`;
  } else {
    rollText = 'No Armor: soaked 0';
  }

  if (armor.hasShield) {
    soak += 1;
    rollText += ' + Shield (-1)';
  }

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    characterName,
    type: 'armor_soak',
    title: `Armor Soak: ${armor.name || 'Armor'}`,
    roll: soak,
    modifier: 0,
    total: soak,
    details: `${rollText}. Reduced incoming damage by ${soak}.`,
    flavor: armor.degraded > 0 ? `Armor is degraded by ${armor.degraded} tier(s)!` : undefined,
  };
}

/**
 * Power (Scroll) Invocation Test
 */
export function performPowerTest(
  characterName: string,
  scroll: Scroll,
  presenceModifier: number,
  targetDR: number = 12
): RollResult {
  const d20 = rollDie(20);
  const total = d20 + presenceModifier;
  const isCrit = d20 === 20;
  const isFumble = d20 === 1;
  const success = isCrit ? true : isFumble ? false : total >= targetDR;

  let details = '';
  let flavor = '';

  if (isFumble) {
    const cat = rollArcaneCatastrophe();
    details = `FUMBLE! Rolled 1. ARCANE CATASTROPHE (#${cat.roll} - ${cat.title}): ${cat.effect}`;
    flavor = 'The black occult arts recoil horribly into your flesh.';
  } else if (!success) {
    const hpLoss = rollDie(2);
    details = `FAILED! Rolled [${d20}] ${presenceModifier >= 0 ? `+ ${presenceModifier}` : `- ${Math.abs(presenceModifier)}`} = ${total} vs DR ${targetDR}. You suffer ${hpLoss} HP damage and are dizzy—cannot use Powers for 1 hour!`;
    flavor = 'The scroll burns your mind with dizzying cosmic nausea.';
  } else {
    details = `SUCCESS! Rolled [${d20}] ${presenceModifier >= 0 ? `+ ${presenceModifier}` : `- ${Math.abs(presenceModifier)}`} = ${total} vs DR ${targetDR}. Power activates!`;
    flavor = `${scroll.name} unleashes its eerie sorcery.`;
  }

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    characterName,
    type: 'power_test',
    title: `Power: ${scroll.name}`,
    roll: d20,
    modifier: presenceModifier,
    total,
    targetDR,
    success,
    isCrit,
    isFumble,
    details,
    flavor,
  };
}

/**
 * Official MÖRK BORG Arcane Catastrophes Table (d20)
 */
export function rollArcaneCatastrophe(): { roll: number; title: string; effect: string } {
  const roll = rollDie(20);
  const catastrophes = getOracles().arcaneCatastrophes;
  const entry = catastrophes.find((c) => c.roll === roll) || {
    roll,
    title: 'Arcane Catastrophe',
    effect: 'Reality tears asunder with horrific shrieking.',
  };
  return { roll, title: entry.title, effect: entry.effect };
}

/**
 * Official MÖRK BORG Broken Table (d4 roll when HP drops to 0)
 */
export function rollBrokenTable(): { 
  roll: number; 
  title: string; 
  description: string; 
  hpGained?: number; 
  hoursDisabled?: number;
} {
  const roll = rollDie(4);
  if (roll === 1) {
    return {
      roll: 1,
      title: 'Dead',
      description: 'Your life ends. Your wretched corpse rots in the soil of a dying world.'
    };
  } else if (roll === 2) {
    const hours = rollDie(4);
    const hp = rollDie(4);
    return {
      roll: 2,
      title: 'Unconscious',
      description: `Unconscious for ${hours} hours. You awaken with ${hp} HP.`,
      hpGained: hp,
      hoursDisabled: hours,
    };
  } else if (roll === 3) {
    const hours = rollDie(4);
    const hp = rollDie(4);
    return {
      roll: 3,
      title: 'Crippled / Severed Limb',
      description: `Smashed or severed limb. Unable to act for ${hours} hours, then awaken with ${hp} HP. Permanent scar/loss.`,
      hpGained: hp,
      hoursDisabled: hours,
    };
  } else {
    const hours = rollDie(2);
    return {
      roll: 4,
      title: 'Hemorrhaging',
      description: `Bleeding out rapidly. Dead in ${hours} hours unless treated. All tests are DR16 until fully healed!`,
      hoursDisabled: hours,
    };
  }
}

/**
 * Long Rest ("A Night's Sleep")
 * Rules:
 * - Heals d6 HP (if has food and water).
 * - If starving: no healing.
 * - If infected: no healing, loses d6 HP instead.
 * - Rerolls Omens: rolls character's omen die (e.g. d2 or d4).
 * - Rerolls Powers daily uses: Presence modifier + d4 (min 0).
 */
export function performLongRest(character: Character): {
  healedHp: number;
  newHp: number;
  newOmens: number;
  newPowers: number;
  rollsLog: string;
  isDeadFromInfection?: boolean;
} {
  let healedHp = 0;
  let newHp = character.hp.current;
  let isDeadFromInfection = false;
  let restLog = '';

  if (character.conditions.infected) {
    const infectionDamage = rollDie(6);
    newHp = Math.max(0, character.hp.current - infectionDamage);
    healedHp = -infectionDamage;
    restLog += `INFECTED! You toss in feverish agony, regaining no HP and taking ${infectionDamage} infection damage (HP: ${newHp}/${character.hp.max}). `;
    if (newHp <= 0) {
      isDeadFromInfection = true;
      restLog += 'The infection has consumed your life!';
    }
  } else if (character.conditions.starving) {
    healedHp = 0;
    restLog += `STARVING! Without food and water, your sleep brings no rest (0 HP healed). `;
  } else {
    const roll = rollDie(6);
    const maxPossibleHeal = character.hp.max - character.hp.current;
    healedHp = Math.max(0, Math.min(roll, maxPossibleHeal));
    newHp = Math.min(character.hp.max, character.hp.current + roll);
    restLog += `Night's Sleep: Rolled [${roll}] on d6 -> Healed ${healedHp} HP (${newHp}/${character.hp.max}). `;
  }

  // Reroll Omens (character's omen die)
  const omenSides = character.omens.dieType === 'd4' ? 4 : 2;
  const newOmens = rollDie(omenSides);
  restLog += `Omens rerolled (${character.omens.dieType}): [${newOmens}]. `;

  // Reroll Powers: Presence modifier + d4 (min 0)
  const powerRoll = rollDie(4);
  const presenceMod = character.abilities.presence.modifier;
  const newPowers = Math.max(0, powerRoll + presenceMod);
  restLog += `Powers rerolled (Presence ${presenceMod >= 0 ? `+${presenceMod}` : presenceMod} + [${powerRoll}] d4): ${newPowers} uses.`;

  return {
    healedHp,
    newHp,
    newOmens,
    newPowers,
    rollsLog: restLog,
    isDeadFromInfection,
  };
}

/**
 * Short Rest ("Catch Breath")
 * Rules: Rest a few minutes, have a drink -> heal d4 HP.
 */
export function performShortRest(character: Character): {
  healedHp: number;
  newHp: number;
  rollsLog: string;
} {
  if (character.conditions.starving || character.conditions.infected) {
    return {
      healedHp: 0,
      newHp: character.hp.current,
      rollsLog: character.conditions.infected 
        ? 'Infected: catching your breath brings no relief.' 
        : 'Starving: thirst and hunger prevent any recovery.',
    };
  }

  const roll = rollDie(4);
  const maxPossibleHeal = character.hp.max - character.hp.current;
  const healedHp = Math.max(0, Math.min(roll, maxPossibleHeal));
  const newHp = Math.min(character.hp.max, character.hp.current + roll);

  return {
    healedHp,
    newHp,
    rollsLog: `Caught breath: Rolled [${roll}] on d4 -> Healed ${healedHp} HP (${newHp}/${character.hp.max}).`,
  };
}

/**
 * Canonical Item Stack Presets and Ammunition Rules
 * - Arrows: 20 per stack, Ammunition (first stack of 20 = 0 slots)
 * - Crossbow Bolts: 10 per stack, Ammunition (first stack of 10 = 0 slots)
 * - Sling Bullets: 20 per stack, Ammunition (first stack of 20 = 0 slots)
 * - Chalk: 10 per stack
 * - Torches: 4 per stack
 * - Dried Food / Rations: 4 per stack
 * - Iron Nails: 10 per stack
 * - Caltrops: 2 per stack
 * - Needles: 10 per stack
 * - Magnesium Strips: 4 per stack
 * - Throwing Knives: 3 per stack
 * - Poison / Elixirs: 4 per stack
 */
export interface ItemStackPreset {
  name: string;
  stackSize: number;
  slots: number;
  isAmmunition?: boolean;
}
// Note: ITEM_STACK_PRESETS and getItemPreset are loaded from src/data and re-exported above.

/**
 * Calculates how many inventory slots an item consumes based on quantity, stack size, and ammunition rules.
 * 
 * Rules:
 * 1. If quantity <= 0 or slots <= 0, consumes 0 slots.
 * 2. If item is Ammunition (isAmmunition is true):
 *    The first stack of n items (where n is stackSize, e.g. 20 for arrows, 10 for bolts, 20 for sling bullets)
 *    consumes 0 slots (similar to how the first 100 silver does not consume a slot).
 *    Subsequent stacks consume slots normally: Math.max(0, Math.ceil(quantity / stackSize) - 1) * slots.
 * 3. For standard stackable items (stackSize > 1):
 *    Consumes Math.ceil(quantity / stackSize) * slots.
 * 4. For non-stacking items:
 *    Consumes quantity * slots.
 */
export function calculateItemSlots(item: InventoryItem): number {
  if (item.quantity <= 0 || item.slots <= 0) return 0;

  const preset = getItemPreset(item.name);
  const stackSize = Math.max(1, item.stackSize ?? preset?.stackSize ?? 1);
  const isAmmunition = item.isAmmunition ?? preset?.isAmmunition ?? false;

  if (isAmmunition) {
    const stacks = Math.ceil(item.quantity / stackSize);
    return Math.max(0, stacks - 1) * item.slots;
  }

  if (stackSize > 1) {
    const stacks = Math.ceil(item.quantity / stackSize);
    return stacks * item.slots;
  }

  return item.slots * item.quantity;
}

/**
 * Carrying Capacity: Strength + 8 items
 * Bulky/Heavy items count as 2 slots.
 * 100 silver counts as 1 normal item.
 * Armor of any tier (except 0, none) uses 1 inventory slot.
 * A shield uses 1 inventory slot.
 * Each weapon uses 1 inventory slot.
 * Each scroll uses 1 inventory slot.
 */
export function calculateCarryingCapacity(
  strengthModifier: number,
  inventory: InventoryItem[],
  silver: number,
  armor?: Armor,
  weapons?: Weapon[],
  scrolls?: Scroll[]
): {
  maxSlots: number;
  usedSlots: number;
  isOverencumbered: boolean;
  penaltyDR: number;
  armorSlots: number;
  shieldSlots: number;
  weaponsSlots: number;
  scrollsSlots: number;
} {
  const maxSlots = Math.max(8, strengthModifier + 8);
  const itemsSlots = inventory.reduce((acc, item) => acc + calculateItemSlots(item), 0);
  const silverSlots = Math.floor(silver / 100);
  const armorSlots = armor && armor.tier > 0 ? 1 : 0;
  const shieldSlots = armor && armor.hasShield ? 1 : 0;
  const weaponsSlots = weapons ? weapons.length : 0;
  const scrollsSlots = scrolls ? scrolls.length : 0;
  const usedSlots = itemsSlots + silverSlots + armorSlots + shieldSlots + weaponsSlots + scrollsSlots;
  const isOverencumbered = usedSlots > maxSlots;

  return {
    maxSlots,
    usedSlots,
    isOverencumbered,
    penaltyDR: isOverencumbered ? 2 : 0,
    armorSlots,
    shieldSlots,
    weaponsSlots,
    scrollsSlots,
  };
}

/**
 * Canonical MÖRK BORG Scrolls (Pages 34-35 of Rulebook)
 * 10 Unclean Scrolls + 10 Sacred Scrolls
/**
 * SCVMBIRTHER: Random MÖRK BORG Character Generator
 */
export function generateRandomCharacter(): Character {
  const classes = getClasses();
  const pickedClass = classes[Math.floor(Math.random() * classes.length)];

  const rollStat = () => {
    // 3d6 score used solely for initial modifier calculation
    const score = rollDie(6) + rollDie(6) + rollDie(6);
    return {
      modifier: scoreToModifier(score),
    };
  };

  const abilities = {
    strength: rollStat(),
    agility: rollStat(),
    presence: rollStat(),
    toughness: rollStat(),
  };

  // HP: Class die + Toughness (minimum 1)
  const baseHpRoll = rollDie(pickedClass.hpDie);
  const maxHp = Math.max(1, baseHpRoll + abilities.toughness.modifier);

  // Omens
  const omenSides = pickedClass.omenDie === 'd4' ? 4 : 2;
  const initialOmens = rollDie(omenSides);

  // Powers daily uses: Presence mod + d4 (min 0)
  const initialPowers = Math.max(0, rollDie(4) + abilities.presence.modifier);

  // Silver: 1d6 x 10
  const silver = rollDie(6) * 10;

  // Weapons pool
  const weaponsPool: Weapon[] = getWeapons().map((w) => ({
    id: crypto.randomUUID(),
    name: w.name,
    type: w.type,
    damageDie: w.damageDie,
    special: w.special,
  }));
  const startingWeapon = weaponsPool[Math.floor(Math.random() * weaponsPool.length)];

  // Armor pool (d4 roll)
  const armorData = getArmorData();
  const armorRoll = rollDie(4);
  const pickedTier = armorData.tiers.find((t) => t.tier === armorRoll - 1) || armorData.tiers[0];
  const hasShield = pickedTier.tier > 0 && Math.random() > 0.5;
  const armor: Armor = {
    name: pickedTier.name,
    tier: pickedTier.tier as Armor['tier'],
    damageReduction: pickedTier.damageReduction,
    degraded: 0,
    hasShield: hasShield,
  };

  // Starting inventory
  const inventory: InventoryItem[] = [
    { id: crypto.randomUUID(), name: 'Waterskin', slots: 1, quantity: 1, description: 'Contains stale brackish water' },
    { id: crypto.randomUUID(), name: 'Torches', slots: 1, quantity: 4, stackSize: 4, description: 'Burns for 1 hour each' },
    { id: crypto.randomUUID(), name: 'Dry Rations', slots: 1, quantity: 4, stackSize: 4, description: 'Stale salt pork and hardtack' },
    { id: crypto.randomUUID(), name: 'Hemp Rope (30ft)', slots: 1, quantity: 1, description: 'Frayed hemp cord' },
  ];

  if (startingWeapon.name === 'Crossbow') {
    inventory.push({
      id: crypto.randomUUID(),
      name: 'Crossbow Bolts',
      slots: 1,
      quantity: 10,
      stackSize: 10,
      isAmmunition: true,
      description: '10 iron-tipped crossbow quarrels'
    });
  }

  const scrolls: Scroll[] = [];
  if (pickedClass.name === 'Esoteric Hermit' || pickedClass.name === 'Heretical Priest' || Math.random() < 0.25) {
    const pickedPreset = CANONICAL_SCROLLS[Math.floor(Math.random() * CANONICAL_SCROLLS.length)];
    scrolls.push({
      id: crypto.randomUUID(),
      ...pickedPreset,
    });
  }

  const names = [
    'Borg', 'Krugg', 'Varg', 'Kagur', 'Morn', 'Gorg', 'Agnar', 'Bael', 
    'Gudrun', 'Helvi', 'Astrid', 'Vesper', 'Dag', 'Gunnar', 'Yrsa', 'Snorri',
    'Old Gid', 'Carcass', 'Grub', 'Vomit-Sip', 'Maggot', 'Crow-Bait'
  ];
  const randomName = names[Math.floor(Math.random() * names.length)];

  return {
    id: crypto.randomUUID(),
    name: randomName,
    characterClass: pickedClass.name,
    description: `${pickedClass.desc} ${pickedClass.traits}`,
    abilities,
    hp: {
      current: maxHp,
      max: maxHp,
    },
    omens: {
      current: initialOmens,
      max: omenSides,
      dieType: pickedClass.omenDie,
    },
    powers: {
      current: initialPowers,
      max: Math.max(1, initialPowers),
    },
    silver,
    armor,
    weapons: [startingWeapon],
    inventory,
    scrolls,
    conditions: {
      infected: false,
      starving: false,
    },
    broken: {
      isBroken: false,
    },
  };
}

/**
 * Calculates modifier change for Getting Better (p. 33):
 * - "Roll a d6 against every ability. Results equal to or greater than the ability increase it by 1, to a maximum of +6. Results below the ability decrease it by 1."
 * - "Abilities from −3 to +1 are always increased by 1 unless the d6 result is 1. The ability is then reduced by 1, but never below -3."
 */
export function calculateAbilityChange(oldModifier: number, d6Roll: number): {
  newModifier: number;
  changed: 1 | -1 | 0;
} {
  let delta: number;
  if (oldModifier <= 1) {
    if (d6Roll === 1) {
      delta = -1;
    } else {
      delta = 1;
    }
  } else {
    if (d6Roll >= oldModifier) {
      delta = 1;
    } else {
      delta = -1;
    }
  }

  const newModifier = Math.max(-3, Math.min(6, oldModifier + delta));
  const changed = (newModifier - oldModifier) as 1 | -1 | 0;
  return { newModifier, changed };
}

export interface GettingBetterResult {
  hpRollSum: number;
  hpRolls: number[];
  hpIncreased: boolean;
  hpGain: number;
  oldMaxHp: number;
  newMaxHp: number;

  debrisRoll: number;
  debrisType: 'nothing' | 'silver' | 'unclean_scroll' | 'sacred_scroll';
  debrisDescription: string;
  silverFound?: number;
  scrollFound?: Scroll;

  abilityChanges: {
    ability: AbilityName;
    roll: number;
    oldModifier: number;
    newModifier: number;
    changed: 1 | -1 | 0;
  }[];

  summary: string;
}

/**
 * Getting Better (or worse) - Core Rules p. 33:
 * 1. More HP: Roll 6d10. If result >= current max HP, increase max HP by d6.
 * 2. Left in the debris (d6): 1-3 nothing; 4 3d10 silver; 5 unclean scroll; 6 sacred scroll.
 * 3. Ability changes: Roll d6 against every ability to increase (+1) or decrease (-1).
 */
export function performGettingBetter(character: Character): {
  result: GettingBetterResult;
  updatedCharacter: Character;
} {
  // 1. More HP
  const hpRolls = rollDice(6, 10);
  const hpRollSum = hpRolls.reduce((a, b) => a + b, 0);
  const oldMaxHp = character.hp.max;
  const hpIncreased = hpRollSum >= oldMaxHp;
  const hpGain = hpIncreased ? rollDie(6) : 0;
  const newMaxHp = oldMaxHp + hpGain;
  const newCurrentHp = character.hp.current + hpGain;

  // 2. Left in the debris
  const debrisRoll = rollDie(6);
  let debrisType: GettingBetterResult['debrisType'] = 'nothing';
  let debrisDescription = 'Nothing of value in the foul muck.';
  let silverFound: number | undefined;
  let scrollFound: Scroll | undefined;

  let newSilver = character.silver;
  const newScrolls = [...character.scrolls];

  if (debrisRoll >= 1 && debrisRoll <= 3) {
    debrisType = 'nothing';
    debrisDescription = 'Nothing. Only dust, rotting cloth, and cold mud.';
  } else if (debrisRoll === 4) {
    debrisType = 'silver';
    const silverRolls = rollDice(3, 10);
    silverFound = silverRolls.reduce((a, b) => a + b, 0);
    newSilver += silverFound;
    debrisDescription = `Found ${silverFound} silver coins [${silverRolls.join(', ')}] in the debris!`;
  } else if (debrisRoll === 5) {
    debrisType = 'unclean_scroll';
    const uncleanList = CANONICAL_SCROLLS.filter((s) => s.type === 'unclean');
    const picked = uncleanList[Math.floor(Math.random() * uncleanList.length)];
    scrollFound = {
      id: crypto.randomUUID(),
      ...picked,
    };
    newScrolls.push(scrollFound);
    debrisDescription = `Found an Unclean Scroll: "${scrollFound.name}"!`;
  } else if (debrisRoll === 6) {
    debrisType = 'sacred_scroll';
    const sacredList = CANONICAL_SCROLLS.filter((s) => s.type === 'sacred');
    const picked = sacredList[Math.floor(Math.random() * sacredList.length)];
    scrollFound = {
      id: crypto.randomUUID(),
      ...picked,
    };
    newScrolls.push(scrollFound);
    debrisDescription = `Found a Sacred Scroll: "${scrollFound.name}"!`;
  }

  // 3. Ability changes
  const abilities: AbilityName[] = ['agility', 'presence', 'strength', 'toughness'];
  const newAbilities = { ...character.abilities };
  const abilityChanges: GettingBetterResult['abilityChanges'] = [];

  for (const ab of abilities) {
    const oldMod = character.abilities[ab].modifier;
    const d6 = rollDie(6);
    const { newModifier, changed } = calculateAbilityChange(oldMod, d6);
    newAbilities[ab] = {
      ...newAbilities[ab],
      modifier: newModifier,
    };
    abilityChanges.push({
      ability: ab,
      roll: d6,
      oldModifier: oldMod,
      newModifier,
      changed,
    });
  }

  const updatedCharacter: Character = {
    ...character,
    hp: {
      ...character.hp,
      max: newMaxHp,
      current: newCurrentHp,
    },
    silver: newSilver,
    scrolls: newScrolls,
    abilities: newAbilities,
  };

  const hpSummary = hpIncreased 
    ? `HP increased +${hpGain} (6d10 [${hpRolls.join(', ')}] = ${hpRollSum} >= ${oldMaxHp}) -> Max HP: ${newMaxHp}`
    : `HP unchanged (6d10 [${hpRolls.join(', ')}] = ${hpRollSum} < ${oldMaxHp})`;

  const abilitySummary = abilityChanges
    .map((a) => `${a.ability.toUpperCase()}: [d6=${a.roll}] ${formatModifier(a.oldModifier)} -> ${formatModifier(a.newModifier)}`)
    .join(' • ');

  const summary = `Getting Better: ${hpSummary} | Debris [d6=${debrisRoll}]: ${debrisDescription} | Abilities: ${abilitySummary}`;

  return {
    result: {
      hpRollSum,
      hpRolls,
      hpIncreased,
      hpGain,
      oldMaxHp,
      newMaxHp,
      debrisRoll,
      debrisType,
      debrisDescription,
      silverFound,
      scrollFound,
      abilityChanges,
      summary,
    },
    updatedCharacter,
  };
}
