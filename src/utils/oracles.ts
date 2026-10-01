import { rollDie } from './dice';
import { getOracles } from '../data';

export interface OracleRollResult {
  category: string;
  rollDisplay: string;
  title: string;
  description: string;
}

/**
 * Rolls on the d66 Corpse Plundering table (barebones pp. 4-5)
 */
export function rollCorpsePlundering(): OracleRollResult {
  const oracles = getOracles();
  const d1 = rollDie(6);
  const d2 = rollDie(6);
  const combined = d1 * 10 + d2;

  const found = oracles.corpsePlundering.find(
    (item) => combined >= item.min && combined <= item.max
  ) || oracles.corpsePlundering[0];

  return {
    category: 'Corpse Plundering',
    rollDisplay: `d66: [${d1}, ${d2}] -> ${combined}`,
    title: found.title,
    description: found.description,
  };
}

/**
 * Rolls on the d12 Weather and Atmosphere table
 */
export function rollWeather(): OracleRollResult {
  const oracles = getOracles();
  const roll = rollDie(12);
  const found = oracles.weather.find((w) => w.roll === roll) || oracles.weather[0];

  return {
    category: 'Weather & Atmosphere',
    rollDisplay: `d12: ${roll}`,
    title: found.title,
    description: found.description,
  };
}

/**
 * Rolls on the d12 Traps & Devilry table
 */
export function rollTrapsAndDevilry(): OracleRollResult {
  const oracles = getOracles();
  const roll = rollDie(12);
  const found = oracles.trapsAndDevilry.find((t) => t.roll === roll) || oracles.trapsAndDevilry[0];

  return {
    category: 'Traps & Devilry',
    rollDisplay: `d12: ${roll}`,
    title: found.title,
    description: found.description,
  };
}

/**
 * Rolls on the d20 Basilisk's Demands table
 */
export function rollBasiliskDemands(): OracleRollResult {
  const oracles = getOracles();
  const roll = rollDie(20);
  const found = oracles.basilisksDemand.find((b) => b.roll === roll) || oracles.basilisksDemand[0];

  return {
    category: "Basilisk's Demands",
    rollDisplay: `d20: ${roll}`,
    title: `Demand #${found.roll}`,
    description: found.demand,
  };
}

/**
 * Rolls on the d20 Arcane Catastrophes table
 */
export function rollArcaneCatastrophe(): OracleRollResult {
  const oracles = getOracles();
  const roll = rollDie(20);
  const found = oracles.arcaneCatastrophes.find((c) => c.roll === roll) || oracles.arcaneCatastrophes[0];

  return {
    category: 'Arcane Catastrophe',
    rollDisplay: `d20: ${roll}`,
    title: found.title,
    description: found.effect,
  };
}

/**
 * Rolls on the d6 Getting Better Debris table
 */
export function rollDebris(): OracleRollResult {
  const oracles = getOracles();
  const roll = rollDie(6);
  const found = oracles.gettingBetterDebris.find((d) => d.roll === roll) || oracles.gettingBetterDebris[0];

  return {
    category: 'Debris & Curios',
    rollDisplay: `d6: ${roll}`,
    title: found.type.toUpperCase(),
    description: found.description,
  };
}

/**
 * Roll a generic oracle list
 */
export function rollGenericList(
  category: string,
  items: Array<{ roll: number; title: string; description: string }>,
  dieSides: number
): OracleRollResult {
  const roll = rollDie(dieSides);
  const found = items.find((item) => item.roll === roll) || items[0] || {
    roll,
    title: 'Nothing',
    description: 'Empty void.',
  };

  return {
    category,
    rollDisplay: `d${dieSides}: ${roll}`,
    title: found.title,
    description: found.description,
  };
}
