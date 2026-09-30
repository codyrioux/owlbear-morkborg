import { describe, it, expect } from 'vitest';
import { rollDie, rollDice, rollFormula, scoreToModifier, formatModifier } from './dice';

describe('Dice utilities', () => {
  it('should roll a die within bounds', () => {
    for (let i = 0; i < 50; i++) {
      const d6 = rollDie(6);
      expect(d6).toBeGreaterThanOrEqual(1);
      expect(d6).toBeLessThanOrEqual(6);

      const d20 = rollDie(20);
      expect(d20).toBeGreaterThanOrEqual(1);
      expect(d20).toBeLessThanOrEqual(20);

      const d2 = rollDie(2);
      expect(d2).toBeGreaterThanOrEqual(1);
      expect(d2).toBeLessThanOrEqual(2);
    }
  });

  it('should roll multiple dice', () => {
    const rolls = rollDice(3, 6);
    expect(rolls).toHaveLength(3);
    rolls.forEach(r => {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(6);
    });
  });

  it('should parse and roll formula correctly', () => {
    const res1 = rollFormula('d8');
    expect(res1.rolls).toHaveLength(1);
    expect(res1.total).toBeGreaterThanOrEqual(1);
    expect(res1.total).toBeLessThanOrEqual(8);
    expect(res1.modifier).toBe(0);

    const res2 = rollFormula('2d6+3');
    expect(res2.rolls).toHaveLength(2);
    expect(res2.modifier).toBe(3);
    expect(res2.total).toBeGreaterThanOrEqual(5); // 2 + 3
    expect(res2.total).toBeLessThanOrEqual(15); // 12 + 3

    const res3 = rollFormula('d4-1');
    expect(res3.rolls).toHaveLength(1);
    expect(res3.modifier).toBe(-1);
    expect(res3.total).toBeGreaterThanOrEqual(0); // non-negative clamp
  });

  it('should convert 3d6 scores to MÖRK BORG modifiers accurately', () => {
    expect(scoreToModifier(1)).toBe(-3);
    expect(scoreToModifier(4)).toBe(-3);
    expect(scoreToModifier(5)).toBe(-2);
    expect(scoreToModifier(6)).toBe(-2);
    expect(scoreToModifier(7)).toBe(-1);
    expect(scoreToModifier(8)).toBe(-1);
    expect(scoreToModifier(9)).toBe(0);
    expect(scoreToModifier(12)).toBe(0);
    expect(scoreToModifier(13)).toBe(1);
    expect(scoreToModifier(14)).toBe(1);
    expect(scoreToModifier(15)).toBe(2);
    expect(scoreToModifier(16)).toBe(2);
    expect(scoreToModifier(17)).toBe(3);
    expect(scoreToModifier(18)).toBe(3);
  });

  it('should format modifiers cleanly', () => {
    expect(formatModifier(2)).toBe('+2');
    expect(formatModifier(0)).toBe('±0');
    expect(formatModifier(-1)).toBe('-1');
  });
});
