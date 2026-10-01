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
  const table: Record<number, { title: string; effect: string }> = {
    1: { title: 'Torn Reality', effect: 'Your eyes rot in their sockets. Blinded forever.' },
    2: { title: 'Vile Swarm', effect: 'd6 venomous centipedes erupt from your throat, dealing 1d4 damage.' },
    3: { title: 'Black Bleeding', effect: 'Thick black ichor oozes from your ears and nose. Lose d4 HP.' },
    4: { title: 'Grave Chill', effect: 'You become frozen in place for d6 minutes, helpless.' },
    5: { title: 'The Dead Speak', effect: 'Ghostly voices scream in agony. All nearby must test Presence DR12 or flee.' },
    6: { title: 'Flesh Rot', effect: 'Skin sloughs off in patches. Toughness reduced by 1 permanently.' },
    7: { title: 'Stolen Memory', effect: 'You completely forget who you are and where you are for d6 hours.' },
    8: { title: 'Blood Rain', effect: 'Putrid, lukewarm blood pours from the ceiling/sky in a 30ft radius.' },
    9: { title: 'Shadow Stalker', effect: 'Your shadow detaches and becomes a hostile wraith seeking your demise.' },
    10: { title: 'Inverse Gravity', effect: 'You violently fall upward towards the ceiling or sky for d4 rounds.' },
    11: { title: 'Demonic Whisper', effect: 'A demon knows your true name and demands immediate sacrifice.' },
    12: { title: 'Choking Ash', effect: 'Air fills with sulfurous ash. Everyone nearby loses d4 HP.' },
    13: { title: 'Mutated Visage', effect: 'Your face warps into a hideous goat or swine snout. Presence -1.' },
    14: { title: 'Twisted Bone', effect: 'Your weapon hand cracks and calcifies into a claw. Melee rolls +1, item use hindered.' },
    15: { title: 'Eldritch Tremor', effect: 'The ground violently shakes; all within 20ft fall prone, taking d2 damage.' },
    16: { title: 'Vortex of Teeth', effect: 'A miniature rift appears, chewing on your gear. One random item is destroyed.' },
    17: { title: 'Lethargic Curse', effect: 'Agility is reduced by 2 until you receive a full night of rest.' },
    18: { title: 'False Prophet', effect: 'You are compelled to chant blasphemies loudly for d10 rounds.' },
    19: { title: 'Combustion', effect: 'Your clothes catch eerie purple fire. Take d6 damage unless put out.' },
    20: { title: 'Abyssal Gaze', effect: 'SHE-entity gazes upon you. Take 2d6 damage and gain an eerie omen.' }
  };
  return { roll, ...table[roll] };
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

export const ITEM_STACK_PRESETS: Record<string, { stackSize: number; slots: number; isAmmunition?: boolean }> = {
  // Ammunition (first stack of stackSize consumes 0 slots)
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

  // General stackables
  'chalk': { stackSize: 10, slots: 1 },
  'torch': { stackSize: 4, slots: 1 },
  'torches': { stackSize: 4, slots: 1 },
  'ration': { stackSize: 4, slots: 1 },
  'rations': { stackSize: 4, slots: 1 },
  'dry ration': { stackSize: 4, slots: 1 },
  'dry rations': { stackSize: 4, slots: 1 },
  'dried food': { stackSize: 4, slots: 1 },
  'food': { stackSize: 4, slots: 1 },
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

/**
 * Looks up default stack presets for common MÖRK BORG items by name.
 */
export function getItemPreset(name: string): { stackSize: number; slots: number; isAmmunition?: boolean } | null {
  const normalized = name.trim().toLowerCase();
  if (ITEM_STACK_PRESETS[normalized]) {
    return ITEM_STACK_PRESETS[normalized];
  }
  // Substring matching for descriptive variations like "Silver Arrows" or "Tallow Torches"
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
  if (normalized.includes('magnesium')) {
    return { stackSize: 4, slots: 1 };
  }
  if (normalized.includes('throwing knife') || normalized.includes('throwing knives')) {
    return { stackSize: 3, slots: 1 };
  }
  return null;
}

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
 */
export const CANONICAL_SCROLLS: Omit<Scroll, 'id'>[] = [
  // --- UNCLEAN SCROLLS (d10) ---
  {
    name: 'Palms Open the Southern Gate',
    type: 'unclean',
    description: 'A ball of fire hits d2 creatures dealing d8 damage per creature.',
  },
  {
    name: 'Tongue of Eris',
    type: 'unclean',
    description: 'A creature of your choice is confused for 10 minutes.',
  },
  {
    name: 'Te-le-kin-esis',
    type: 'unclean',
    description: 'Move an object up to d10×10 feet for d6 minutes.',
  },
  {
    name: 'Lucy-fires Levitation',
    type: 'unclean',
    description: 'Hover for Presence + d10 rounds.',
  },
  {
    name: 'Daemon of Capillaries',
    type: 'unclean',
    description: 'One creature suffocates for d6 rounds, losing d4 HP per round.',
  },
  {
    name: 'Nine Violet Signs Unknot the Storm',
    type: 'unclean',
    description: 'Produce d2 lightning bolts dealing d6 damage each.',
  },
  {
    name: 'Metzhuotl Blind Your Eye',
    type: 'unclean',
    description: 'A creature becomes invisible for d6 rounds or until it is damaged, attacking/defending with DR6.',
  },
  {
    name: 'Foul Psychopomp',
    type: 'unclean',
    description: 'Summon (d6): 1–3: d4 skeletons, 4–6: d4 zombies.',
  },
  {
    name: 'Eyelid Blinds the Mind',
    type: 'unclean',
    description: 'd4 creatures fall asleep for one hour unless they succeed a DR14 test.',
  },
  {
    name: 'Death',
    type: 'unclean',
    description: 'All creatures within 30 feet lose a total of 4d10 HP.',
  },

  // --- SACRED SCROLLS (d10) ---
  {
    name: 'Grace of a Dead Saint',
    type: 'sacred',
    description: 'd2 creatures regain d10 HP each.',
  },
  {
    name: 'Grace for a Sinner',
    type: 'sacred',
    description: 'A creature of your choice gets +d6 on one roll (damage, tests etc.).',
  },
  {
    name: 'Whispers Pass the Gate',
    type: 'sacred',
    description: 'Ask three questions to a deceased creature.',
  },
  {
    name: 'Aegis of Sorrow',
    type: 'sacred',
    description: 'A creature of your choice gains 2d6 extra HP for 10 rounds.',
  },
  {
    name: 'Unmet Fate',
    type: 'sacred',
    description: 'One creature, dead for no more than a week, is awakened with terrible memories.',
  },
  {
    name: 'Bestial Speech',
    type: 'sacred',
    description: 'You may speak with animals for d20 minutes.',
  },
  {
    name: "False Dawn / Night's Chariot",
    type: 'sacred',
    description: 'Light or pitch black for 3d10 minutes.',
  },
  {
    name: 'Hermetic Step',
    type: 'sacred',
    description: 'You find all traps in your path for 2d10 minutes.',
  },
  {
    name: "Roskoe's Consuming Glare",
    type: 'sacred',
    description: 'd4 creatures lose d8 HP each.',
  },
  {
    name: 'Enochian Syntax',
    type: 'sacred',
    description: 'One creature blindly obeys a single command.',
  },
];

/**
 * SCVMBIRTHER: Random MÖRK BORG Character Generator
 */
export function generateRandomCharacter(): Character {
  const classes = [
    {
      name: 'Fanged Deserter',
      hpDie: 10,
      omenDie: 'd2' as const,
      desc: 'You were a savage brute in an uncaring army. You deserted with teeth bared.',
      traits: 'Gnashing teeth, feral rage, covered in dried mud and scars.'
    },
    {
      name: 'Gutterborn Scum',
      hpDie: 6,
      omenDie: 'd2' as const,
      desc: 'An ill-fated wretch born in the filth beneath Galgenbeck.',
      traits: 'Twitching eye, stained rags, pockets full of sharp trinkets.'
    },
    {
      name: 'Esoteric Hermit',
      hpDie: 4,
      omenDie: 'd4' as const,
      desc: 'A crazed scholar who speaks to fungi and reads secrets in entrails.',
      traits: 'Wild unwashed beard, muttering prophecies of the two-headed basilisks.'
    },
    {
      name: 'Wretched Royalty',
      hpDie: 6,
      omenDie: 'd2' as const,
      desc: 'Heir to a kingdom reduced to dust and cinders.',
      traits: 'Tattered velvet coat, dull brass signet ring, haughty sneer.'
    },
    {
      name: 'Heretical Priest',
      hpDie: 8,
      omenDie: 'd4' as const,
      desc: 'Cast out of the Cathedral of the Two-Headed Basilisks for forbidden preachings.',
      traits: 'Self-inflicted flagellation marks, charred holy symbol.'
    },
    {
      name: 'Occult Herbmaster',
      hpDie: 6,
      omenDie: 'd2' as const,
      desc: 'Maker of poisonous decoctions and bitter medicines in the dark marshes.',
      traits: 'Fingers permanently stained violet, glass vials rattling in pockets.'
    },
    {
      name: 'Classless Scum',
      hpDie: 8,
      omenDie: 'd2' as const,
      desc: 'Just another desperate wretch struggling to breathe before the world ends.',
      traits: 'Hollow cheeks, desperate glare, carrying only what was scavenged.'
    },
  ];

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
  const weaponsPool: Weapon[] = [
    { id: crypto.randomUUID(), name: 'Femur Club', type: 'melee', damageDie: 'd4', special: 'Crude bone' },
    { id: crypto.randomUUID(), name: 'Rusted Shortsword', type: 'melee', damageDie: 'd6', special: 'Jagged edge' },
    { id: crypto.randomUUID(), name: 'Battle Axe', type: 'melee', damageDie: 'd8', special: 'Heavy hewing blade' },
    { id: crypto.randomUUID(), name: 'Zweihänder', type: 'melee', damageDie: 'd10', special: 'Requires 2 hands' },
    { id: crypto.randomUUID(), name: 'Crossbow', type: 'ranged', damageDie: 'd8', special: 'DR12 Presence to aim' },
    { id: crypto.randomUUID(), name: 'Gut-Ripper Dagger', type: 'melee', damageDie: 'd4', special: 'Concealable' },
  ];
  const startingWeapon = weaponsPool[Math.floor(Math.random() * weaponsPool.length)];

  // Armor pool (d4 roll)
  const armorRoll = rollDie(4);
  let armor: Armor;
  if (armorRoll === 1) {
    armor = { name: 'Rags & Flayed Skins', tier: 0, damageReduction: '0', degraded: 0, hasShield: false };
  } else if (armorRoll === 2) {
    armor = { name: 'Padded Leather', tier: 1, damageReduction: '-d2', degraded: 0, hasShield: Math.random() > 0.5 };
  } else if (armorRoll === 3) {
    armor = { name: 'Rusty Chainmail', tier: 2, damageReduction: '-d4', degraded: 0, hasShield: Math.random() > 0.5 };
  } else {
    armor = { name: 'Dented Plate Mail', tier: 3, damageReduction: '-d6', degraded: 0, hasShield: true };
  }

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
