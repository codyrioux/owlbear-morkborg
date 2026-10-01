import { describe, it, expect } from 'vitest';
import {
  rollGroupInitiative,
  rollMonsterMorale,
  rollMonsterAttack,
  createMonsterTokenData,
} from './combatRules';
import { getMonster } from '../data';

describe('Combat Rules & Bestiary Helpers', () => {
  it('rolls d6 group initiative accurately', () => {
    for (let i = 0; i < 20; i++) {
      const res = rollGroupInitiative();
      expect(res.roll).toBeGreaterThanOrEqual(1);
      expect(res.roll).toBeLessThanOrEqual(6);
      if (res.roll >= 4) {
        expect(res.initiative).toBe('pcs');
      } else {
        expect(res.initiative).toBe('enemies');
      }
    }
  });

  it('handles fearless monsters in morale checks', () => {
    const res = rollMonsterMorale('Wrat, Wraith', null);
    expect(res.outcome).toBe('fearless');
    expect(res.description).toContain('never breaks');
  });

  it('evaluates numerical morale ratings', () => {
    // Morale 12 should always hold on 2d6 (max roll is 12)
    const holdRes = rollMonsterMorale('Test Guard', 12);
    expect(holdRes.outcome).toBe('holds');

    // Morale 1 should always break on 2d6 (min roll is 2)
    const breakRes = rollMonsterMorale('Test Coward', 1);
    expect(['flee', 'surrender']).toContain(breakRes.outcome);
  });

  it('formats monster attack rolls with damage and prompts', () => {
    const res = rollMonsterAttack('Seth, Goblin', {
      name: 'Knife',
      damageDie: 'd4',
      special: 'Curse',
    }, 14);
    expect(res.damage).toBeGreaterThanOrEqual(1);
    expect(res.damage).toBeLessThanOrEqual(4);
    expect(res.prompt).toContain('Defend');
    expect(res.prompt).toContain('DR14');
  });

  it('creates monster token data structure', () => {
    const goblin = getMonster('goblin')!;
    expect(goblin).toBeDefined();

    const tokenData = createMonsterTokenData('tok-123', goblin);
    expect(tokenData.id).toBe('tok-123');
    expect(tokenData.name).toBe(goblin.name);
    expect(tokenData.hp.current).toBe(6);
    expect(tokenData.hp.max).toBe(6);
    expect(tokenData.morale).toBe(7);
  });
});
