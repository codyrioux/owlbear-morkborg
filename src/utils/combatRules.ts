import { rollDie, rollFormula } from './dice';
import { MonsterData } from '../data';

export const MONSTER_METADATA_KEY = 'com.morkborg.character-sheet/monster';

export interface MonsterTokenData {
  id: string;
  monsterId: string;
  name: string;
  hp: { current: number; max: number };
  morale: number | 'special' | null;
  armorTier: number;
  damageReduction: string;
  attacks: Array<{ name: string; damageDie: string; special?: string }>;
  specialRules: string[];
  bounties: Record<string, string | undefined>;
}

/**
 * Rolls MÖRK BORG Group Initiative (d6).
 * 1-3: Enemies act first.
 * 4-6: PCs act first.
 */
export function rollGroupInitiative(): {
  roll: number;
  initiative: 'pcs' | 'enemies';
  description: string;
} {
  const roll = rollDie(6);
  const initiative = roll >= 4 ? 'pcs' : 'enemies';
  const description = roll >= 4
    ? `Rolled ${roll} on d6: THE PLAYER CHARACTERS SEIZE INITIATIVE!`
    : `Rolled ${roll} on d6: THE ENEMIES STRIKE FIRST!`;

  return {
    roll,
    initiative,
    description,
  };
}

/**
 * Executes a 2d6 Morale Check for a monster or mob.
 * Rule: Rolled when the leader is killed or half the mob is slain.
 * If 2d6 > Morale rating: enemies break (flee or surrender).
 */
export function rollMonsterMorale(
  monsterName: string,
  morale: number | 'special' | null
): {
  roll: number;
  dice: [number, number];
  outcome: 'holds' | 'flee' | 'surrender' | 'fearless';
  description: string;
} {
  if (morale === null) {
    return {
      roll: 0,
      dice: [0, 0],
      outcome: 'fearless',
      description: `${monsterName} is fearless (undead/construct). Morale never breaks!`,
    };
  }

  const d1 = rollDie(6);
  const d2 = rollDie(6);
  const total = d1 + d2;

  if (morale === 'special') {
    return {
      roll: total,
      dice: [d1, d2],
      outcome: total >= 7 ? 'flee' : 'holds',
      description: total >= 7
        ? `${monsterName} cowers and retreats to nurse its wounds! (Rolled ${total} [${d1}+${d2}])`
        : `${monsterName} roars and stands its ground! (Rolled ${total} [${d1}+${d2}])`,
    };
  }

  const breaks = total > morale;
  if (!breaks) {
    return {
      roll: total,
      dice: [d1, d2],
      outcome: 'holds',
      description: `${monsterName} holds firm! Rolled ${total} (${d1}+${d2}) vs Morale ${morale}.`,
    };
  }

  const isFlee = Math.random() >= 0.5;
  const outcome = isFlee ? 'flee' : 'surrender';
  const actionText = isFlee ? 'breaks rank and flees in terror!' : 'throws down weapons and surrenders!';

  return {
    roll: total,
    dice: [d1, d2],
    outcome,
    description: `MORALE BROKEN! Rolled ${total} (${d1}+${d2}) vs Morale ${morale}: ${monsterName} ${actionText}`,
  };
}

/**
 * Rolls monster attack damage and formats player defense prompt.
 */
export function rollMonsterAttack(
  monsterName: string,
  attack: { name: string; damageDie: string; special?: string },
  defenseDR: number = 12
): {
  damage: number;
  diceRolls: number[];
  prompt: string;
} {
  const result = rollFormula(attack.damageDie);
  const specialNote = attack.special ? ` (${attack.special})` : '';
  const prompt = `${monsterName} attacks with ${attack.name}${specialNote}! Potential damage: ${result.total}. Roll Agility DR${defenseDR} to Defend!`;

  return {
    damage: result.total,
    diceRolls: result.rolls,
    prompt,
  };
}

/**
 * Creates MonsterTokenData from a MonsterData catalog definition.
 */
export function createMonsterTokenData(
  tokenId: string,
  monster: MonsterData
): MonsterTokenData {
  return {
    id: tokenId,
    monsterId: monster.id,
    name: monster.name,
    hp: { current: monster.hp, max: monster.hp },
    morale: monster.morale,
    armorTier: monster.armorTier,
    damageReduction: monster.damageReduction,
    attacks: monster.attacks,
    specialRules: monster.specialRules,
    bounties: monster.bounties,
  };
}
