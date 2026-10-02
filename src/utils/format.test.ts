import { describe, it, expect } from 'vitest';
import { formatTitleCase } from './format';

describe('formatTitleCase', () => {
  it('should handle empty or null string', () => {
    expect(formatTitleCase('')).toBe('');
  });

  it('should capitalize only the first letter of words from all-caps inputs', () => {
    expect(formatTitleCase('SETH, GOBLIN')).toBe('Seth, Goblin');
    expect(formatTitleCase('BENT, SCUM')).toBe('Bent, Scum');
    expect(formatTitleCase('LADY PORCELAIN, UNDEAD DOLL')).toBe('Lady Porcelain, Undead Doll');
    expect(formatTitleCase('ZUKUMA, BERSERKER')).toBe('Zukuma, Berserker');
  });

  it('should keep minor connector words lowercase when not at start', () => {
    expect(formatTitleCase('CALENDAR OF NECHRUBEL')).toBe('Calendar of Nechrubel');
    expect(formatTitleCase('A MISERY BEFALLS THE DYING WORLD')).toBe('A Misery Befalls the Dying World');
    expect(formatTitleCase('ENEMIES & MONSTERS')).toBe('Enemies & Monsters');
  });

  it('should preserve game abbreviations like DR, HP, PC, GM', () => {
    expect(formatTitleCase('TEST DR 12')).toBe('Test DR 12');
    expect(formatTitleCase('RECOVER 5 HP')).toBe('Recover 5 HP');
    expect(formatTitleCase('PC AND GM CONTROLS')).toBe('PC and GM Controls');
  });

  it('should format dice notation in lowercase', () => {
    expect(formatTitleCase('ATTACK WITH 2D6')).toBe('Attack with 2d6');
    expect(formatTitleCase('ROLL D20 AGAINST DR 12')).toBe('Roll d20 Against DR 12');
  });
});
