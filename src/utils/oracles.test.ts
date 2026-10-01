import { describe, it, expect } from 'vitest';
import {
  rollCorpsePlundering,
  rollWeather,
  rollTrapsAndDevilry,
  rollBasiliskDemands,
  rollArcaneCatastrophe,
  rollDebris,
} from './oracles';

describe('Oracles & Atmospheric Tables', () => {
  it('rolls valid corpse loot on d66 with title and description', () => {
    for (let i = 0; i < 20; i++) {
      const result = rollCorpsePlundering();
      expect(result.category).toBe('Corpse Plundering');
      expect(result.rollDisplay).toMatch(/d66: \[\d, \d\] -> \d\d/);
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.description.length).toBeGreaterThan(0);
    }
  });

  it('rolls valid weather on d12', () => {
    for (let i = 0; i < 15; i++) {
      const result = rollWeather();
      expect(result.category).toBe('Weather & Atmosphere');
      expect(result.rollDisplay).toMatch(/d12: \d+/);
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.description.length).toBeGreaterThan(0);
    }
  });

  it('rolls valid traps and devilry on d12', () => {
    const result = rollTrapsAndDevilry();
    expect(result.category).toBe('Traps & Devilry');
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('rolls valid basilisk demands on d20', () => {
    const result = rollBasiliskDemands();
    expect(result.category).toBe("Basilisk's Demands");
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('rolls valid arcane catastrophe on d20', () => {
    const result = rollArcaneCatastrophe();
    expect(result.category).toBe('Arcane Catastrophe');
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('rolls debris and curios on d20', () => {
    const result = rollDebris();
    expect(result.category).toBe('Debris & Curios');
    expect(result.title.length).toBeGreaterThan(0);
  });
});
