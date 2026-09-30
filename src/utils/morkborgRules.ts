import { 
  AbilityName, 
  Armor, 
  Character, 
  InventoryItem, 
  RollResult, 
  Scroll, 
  Weapon 
} from '../types/morkborg';
import { rollDie, rollFormula, scoreToModifier } from './dice';

/**
 * Perform an Ability test: d20 + modifier vs DR
 */
export function performAbilityCheck(
  characterName: string,
  ability: AbilityName,
  modifier: number,
  targetDR: number = 12,
  omenLowerDR: number = 0
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

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    characterName,
    type: 'ability',
    title: `${ability.toUpperCase()} Test`,
    roll: d20,
    modifier,
    total,
    targetDR: effectiveDR,
    success,
    isCrit,
    isFumble,
    details: `Rolled [${d20}] ${modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`} = ${total} vs DR ${effectiveDR}`,
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
    title: 'DEFEND Roll',
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
    // Used an omen for maximum damage
    const match = weapon.damageDie.match(/d(\d+)/i);
    const sides = match ? parseInt(match[1], 10) : 6;
    total = sides;
    rolls = [sides];
  } else if (isCrit) {
    // Critical hit deals double damage (roll twice)
    const secondRoll = rollFormula(weapon.damageDie);
    rolls.push(...secondRoll.rolls);
    total = total + secondRoll.total;
  }

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
      : `Rolled [${rolls.join(', ')}] = ${total} damage`,
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
      title: 'DEAD',
      description: 'Your life ends. Your wretched corpse rots in the soil of a dying world.'
    };
  } else if (roll === 2) {
    const hours = rollDie(4);
    const hp = rollDie(4);
    return {
      roll: 2,
      title: 'UNCONSCIOUS',
      description: `Unconscious for ${hours} hours. You awaken with ${hp} HP.`,
      hpGained: hp,
      hoursDisabled: hours,
    };
  } else if (roll === 3) {
    const hours = rollDie(4);
    const hp = rollDie(4);
    return {
      roll: 3,
      title: 'CRIPPLED / SEVERED LIMB',
      description: `Smashed or severed limb. Unable to act for ${hours} hours, then awaken with ${hp} HP. Permanent scar/loss.`,
      hpGained: hp,
      hoursDisabled: hours,
    };
  } else {
    const hours = rollDie(2);
    return {
      roll: 4,
      title: 'HEMORRHAGING',
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
 * Carrying Capacity: Strength + 8 items
 * Bulky/Heavy items count as 2 slots.
 * 100 silver counts as 1 normal item.
 */
export function calculateCarryingCapacity(
  strengthModifier: number,
  inventory: InventoryItem[],
  silver: number
): {
  maxSlots: number;
  usedSlots: number;
  isOverencumbered: boolean;
  penaltyDR: number;
} {
  const maxSlots = Math.max(8, strengthModifier + 8);
  const itemsSlots = inventory.reduce((acc, item) => acc + (item.slots * item.quantity), 0);
  const silverSlots = Math.floor(silver / 100);
  const usedSlots = itemsSlots + silverSlots;
  const isOverencumbered = usedSlots > maxSlots;

  return {
    maxSlots,
    usedSlots,
    isOverencumbered,
    penaltyDR: isOverencumbered ? 2 : 0,
  };
}

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
    // 3d6
    const score = rollDie(6) + rollDie(6) + rollDie(6);
    return {
      score,
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
    { id: crypto.randomUUID(), name: 'Torches', slots: 1, quantity: 4, description: 'Burns for 1 hour each' },
    { id: crypto.randomUUID(), name: 'Dry Rations', slots: 1, quantity: 4, description: 'Stale salt pork and hardtack' },
    { id: crypto.randomUUID(), name: 'Hemp Rope (30ft)', slots: 1, quantity: 1, description: 'Frayed hemp cord' },
  ];

  // Scrolls pool
  const scrollsPool: Scroll[] = [
    { id: crypto.randomUUID(), name: "Palmaum's Step", type: 'unclean', description: 'Float across pits or water for d6 minutes.' },
    { id: crypto.randomUUID(), name: 'Tephra Prognostic', type: 'unclean', description: 'Ask the ashes a question; receive a cryptic omen.' },
    { id: crypto.randomUUID(), name: 'Metamorphosis', type: 'unclean', description: 'Turn into a rat or bat for 10 minutes.' },
    { id: crypto.randomUUID(), name: 'Nine Pale Palms', type: 'sacred', description: 'Spectral hands block 2d6 incoming damage.' },
    { id: crypto.randomUUID(), name: "Roskoe's Consuming Glare", type: 'sacred', description: 'Target bursts into yellow flames for d10 damage.' },
    { id: crypto.randomUUID(), name: 'Enochian Teleport', type: 'sacred', description: 'Instantly vanish and appear 30 paces away.' },
  ];

  const scrolls: Scroll[] = [];
  if (pickedClass.name === 'Esoteric Hermit' || pickedClass.name === 'Heretical Priest' || Math.random() < 0.25) {
    scrolls.push(scrollsPool[Math.floor(Math.random() * scrollsPool.length)]);
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
