/**
 * Secure dice rolling utilities for MÖRK BORG
 */

export function rollDie(sides: number): number {
  if (sides <= 1) return 1;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] % sides) + 1;
}

export function rollDice(count: number, sides: number): number[] {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(rollDie(sides));
  }
  return rolls;
}

export interface FormulaResult {
  total: number;
  rolls: number[];
  modifier: number;
  formula: string;
}

export function rollFormula(formula: string): FormulaResult {
  const cleaned = formula.trim().toLowerCase().replace(/\s+/g, '');
  // Matches formats like: "d6", "1d8", "2d4+2", "d10-1", "3"
  const regex = /^(\d*)d(\d+)(?:([+-])(\d+))?$/;
  const match = cleaned.match(regex);

  if (!match) {
    // If it's a fixed number, parse it
    const fixedNum = parseInt(cleaned, 10);
    if (!isNaN(fixedNum)) {
      return { total: fixedNum, rolls: [fixedNum], modifier: 0, formula };
    }
    // Fallback: default to 1d6
    const roll = rollDie(6);
    return { total: roll, rolls: [roll], modifier: 0, formula: '1d6' };
  }

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const sign = match[3];
  const modVal = match[4] ? parseInt(match[4], 10) : 0;
  const modifier = sign === '-' ? -modVal : modVal;

  const rolls = rollDice(count, sides);
  const sumRolls = rolls.reduce((acc, val) => acc + val, 0);
  const total = Math.max(0, sumRolls + modifier);

  return { total, rolls, modifier, formula };
}

/**
 * Standard MÖRK BORG 3d6 score to modifier conversion:
 * 1-4:   -3
 * 5-6:   -2
 * 7-8:   -1
 * 9-12:   0
 * 13-14: +1
 * 15-16: +2
 * 17-18: +3
 */
export function scoreToModifier(score: number): number {
  if (score <= 4) return -3;
  if (score <= 6) return -2;
  if (score <= 8) return -1;
  if (score <= 12) return 0;
  if (score <= 14) return 1;
  if (score <= 16) return 2;
  return 3;
}

export function formatModifier(mod: number): string {
  if (mod > 0) return `+${mod}`;
  if (mod === 0) return `±0`;
  return `${mod}`;
}

/**
 * Validates whether a string represents a valid dice formula (e.g., 'd6', '2d6', '1d8+1', '2d4-1', '5')
 */
export function isValidDiceFormula(formula: string): boolean {
  if (!formula || typeof formula !== 'string') return false;
  const cleaned = formula.trim().toLowerCase().replace(/\s+/g, '');
  if (!cleaned) return false;

  const regex = /^(\d*)d(\d+)(?:([+-])(\d+))?$/;
  const match = cleaned.match(regex);
  if (match) {
    const count = match[1] ? parseInt(match[1], 10) : 1;
    const sides = parseInt(match[2], 10);
    const modVal = match[4] ? parseInt(match[4], 10) : 0;
    return count > 0 && count <= 20 && sides > 1 && sides <= 1000 && modVal >= 0 && modVal <= 100;
  }

  const fixedNum = parseInt(cleaned, 10);
  return !isNaN(fixedNum) && fixedNum >= 0 && fixedNum <= 1000 && String(fixedNum) === cleaned;
}
