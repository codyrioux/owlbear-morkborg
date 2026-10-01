import { describe, it, expect } from 'vitest';
import {
  getWeapons,
  getArmorData,
  getEquipment,
  getScrolls,
  getClasses,
  getMiseries,
  getMonsters,
  getOracles,
  getItemPreset,
  getWeapon,
  getScroll,
  getMonster,
} from './index';

describe('Data Layer & JSON Schemas', () => {
  it('loads weapons correctly', () => {
    const weapons = getWeapons();
    expect(weapons.length).toBeGreaterThanOrEqual(15);
    for (const w of weapons) {
      expect(w.id).toBeTruthy();
      expect(w.name).toBeTruthy();
      expect(['melee', 'ranged']).toContain(w.type);
      expect(w.damageDie).toMatch(/^d\d+/);
      expect(w.costSilver).toBeGreaterThanOrEqual(0);
    }
    expect(getWeapon('femur')).toBeDefined();
    expect(getWeapon('Zweihänder')).toBeDefined();
  });

  it('loads armor and shields correctly', () => {
    const armor = getArmorData();
    expect(armor.tiers).toHaveLength(4);
    expect(armor.tiers.map((t) => t.tier)).toEqual([0, 1, 2, 3]);
    for (const t of armor.tiers) {
      expect(t.name).toBeTruthy();
      expect(t.damageReduction).toBeTruthy();
      expect(t.slots).toBeGreaterThanOrEqual(0);
    }
    expect(armor.shield).toBeDefined();
    expect(armor.shield.damageReduction).toBe('-1');
  });

  it('loads equipment with valid slots and stack sizes', () => {
    const items = getEquipment();
    expect(items.length).toBeGreaterThanOrEqual(30);
    for (const item of items) {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.slots).toBeGreaterThanOrEqual(0);
      expect(item.costSilver).toBeGreaterThanOrEqual(0);
      if (item.stackSize) {
        expect(item.stackSize).toBeGreaterThan(1);
      }
    }
  });

  it('resolves item presets accurately', () => {
    const arrowPreset = getItemPreset('Arrows');
    expect(arrowPreset).toEqual({ stackSize: 20, slots: 1, isAmmunition: true });

    const torchPreset = getItemPreset('Torch');
    expect(torchPreset).toEqual({ stackSize: 4, slots: 1 });

    const nailPreset = getItemPreset('Iron Nails');
    expect(nailPreset).toEqual({ stackSize: 10, slots: 1 });

    expect(getItemPreset('Unknown Rusty Relic')).toBeNull();
  });

  it('loads canonical scrolls (10 unclean, 10 sacred)', () => {
    const scrolls = getScrolls();
    expect(scrolls).toHaveLength(20);
    const unclean = scrolls.filter((s) => s.type === 'unclean');
    const sacred = scrolls.filter((s) => s.type === 'sacred');
    expect(unclean).toHaveLength(10);
    expect(sacred).toHaveLength(10);
    expect(getScroll('Tongue of Eris')).toBeDefined();
    expect(getScroll('Grace of a Dead Saint')).toBeDefined();
  });

  it('loads character classes', () => {
    const classes = getClasses();
    expect(classes.length).toBeGreaterThanOrEqual(6);
    for (const c of classes) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect([4, 6, 8, 10]).toContain(c.hpDie);
      expect(['d2', 'd4']).toContain(c.omenDie);
    }
  });

  it('loads Calendar of Nechrubel and miseries including d4 duration', () => {
    const miseries = getMiseries();
    expect(miseries.durationDice.map((d) => d.die)).toEqual(['d100', 'd20', 'd10', 'd6', 'd4', 'd2']);
    expect(miseries.psalms).toHaveLength(6);
    for (const psalm of miseries.psalms) {
      expect(psalm.verses).toHaveLength(6);
      for (const verse of psalm.verses) {
        expect(verse.title).toBeTruthy();
        expect(verse.text).toBeTruthy();
      }
    }
    expect(miseries.seventhMisery.verse).toBe('7:7');
    expect(miseries.seventhMisery.text).toContain('Burn the book');
  });

  it('loads all 12 core rulebook monsters', () => {
    const monsters = getMonsters();
    expect(monsters).toHaveLength(12);
    for (const m of monsters) {
      expect(m.id).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.hp).toBeGreaterThan(0);
      expect(m.attacks.length).toBeGreaterThan(0);
      expect(m.specialRules.length).toBeGreaterThan(0);
      expect(m.bounties).toBeDefined();
    }
    expect(getMonster('goblin')).toBeDefined();
    expect(getMonster('lich')).toBeDefined();
    expect(getMonster('wyvern')).toBeDefined();
  });

  it('loads oracles (weather, traps, corpse loot, catastrophes, broken, debris)', () => {
    const oracles = getOracles();
    expect(oracles.weather).toHaveLength(12);
    expect(oracles.trapsAndDevilry).toHaveLength(12);
    expect(oracles.corpsePlundering.length).toBeGreaterThanOrEqual(20);
    expect(oracles.basilisksDemand).toHaveLength(20);
    expect(oracles.arcaneCatastrophes).toHaveLength(20);
    expect(oracles.brokenTable).toHaveLength(4);
    expect(oracles.gettingBetterDebris).toHaveLength(6);
  });
});
