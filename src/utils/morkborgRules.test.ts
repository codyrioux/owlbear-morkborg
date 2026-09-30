import { describe, it, expect } from 'vitest';
import { 
  performAbilityCheck, 
  performLongRest, 
  performShortRest, 
  calculateCarryingCapacity, 
  rollBrokenTable, 
  generateRandomCharacter,
  performArmorSoak,
  performDefend
} from './morkborgRules';
import { Character } from '../types/morkborg';

describe('MÖRK BORG Rules Engine', () => {
  const mockCharacter: Character = {
    id: 'test-id',
    name: 'Wretched Test',
    characterClass: 'Gutterborn Scum',
    description: 'A test wretch',
    abilities: {
      strength: { modifier: 0 },
      agility: { modifier: 1 },
      presence: { modifier: 2 },
      toughness: { modifier: -1 },
    },
    hp: {
      current: 2,
      max: 10,
    },
    omens: {
      current: 0,
      max: 2,
      dieType: 'd2',
    },
    powers: {
      current: 0,
      max: 4,
    },
    silver: 250,
    armor: {
      name: 'Leather',
      tier: 1,
      damageReduction: '-d2',
      degraded: 0,
      hasShield: true,
    },
    weapons: [
      { id: 'w1', name: 'Shortsword', type: 'melee', damageDie: 'd6' }
    ],
    inventory: [
      { id: 'i1', name: 'Torch', slots: 1, quantity: 2 },
      { id: 'i2', name: 'Heavy Anvil', slots: 2, quantity: 1 },
    ],
    scrolls: [],
    conditions: {
      infected: false,
      starving: false,
    },
    broken: {
      isBroken: false,
    },
  };

  it('performAbilityCheck should correctly execute checks against DR', () => {
    const result = performAbilityCheck('Wretched Test', 'strength', 2, 12);
    expect(result.type).toBe('ability');
    expect(result.roll).toBeGreaterThanOrEqual(1);
    expect(result.roll).toBeLessThanOrEqual(20);
    expect(result.total).toBe(result.roll + 2);
    expect(result.targetDR).toBe(12);

    if (result.isCrit) {
      expect(result.roll).toBe(20);
      expect(result.success).toBe(true);
    } else if (result.isFumble) {
      expect(result.roll).toBe(1);
      expect(result.success).toBe(false);
    } else {
      expect(result.success).toBe(result.total >= 12);
    }
  });

  it('performLongRest should heal d6 HP (capped at max), reroll Omens, and reroll Powers', () => {
    const char = { ...mockCharacter, hp: { current: 2, max: 8 } };
    const rest = performLongRest(char);

    expect(rest.newHp).toBeGreaterThan(2);
    expect(rest.newHp).toBeLessThanOrEqual(8);
    expect(rest.healedHp).toBeGreaterThanOrEqual(1);
    expect(rest.healedHp).toBeLessThanOrEqual(6);

    // Omens rerolled with d2
    expect(rest.newOmens).toBeGreaterThanOrEqual(1);
    expect(rest.newOmens).toBeLessThanOrEqual(2);

    // Powers rerolled with Presence (+2) + d4 (1..4) -> 3..6
    expect(rest.newPowers).toBeGreaterThanOrEqual(3);
    expect(rest.newPowers).toBeLessThanOrEqual(6);
  });

  it('performLongRest should respect starving condition (no heal)', () => {
    const char = { 
      ...mockCharacter, 
      hp: { current: 3, max: 10 },
      conditions: { infected: false, starving: true }
    };
    const rest = performLongRest(char);
    expect(rest.healedHp).toBe(0);
    expect(rest.newHp).toBe(3);
  });

  it('performLongRest should penalize infected condition (damage d6, no heal)', () => {
    const char = { 
      ...mockCharacter, 
      hp: { current: 7, max: 10 },
      conditions: { infected: true, starving: false }
    };
    const rest = performLongRest(char);
    expect(rest.newHp).toBeLessThan(7);
  });

  it('performShortRest should heal d4 HP', () => {
    const char = { ...mockCharacter, hp: { current: 4, max: 10 } };
    const rest = performShortRest(char);
    expect(rest.healedHp).toBeGreaterThanOrEqual(1);
    expect(rest.healedHp).toBeLessThanOrEqual(4);
    expect(rest.newHp).toBe(4 + rest.healedHp);
  });

  it('calculateCarryingCapacity should handle STR + 8, items, and silver weight', () => {
    // STR modifier = 0 -> capacity = 8
    // Items: 2 torches (2 slots) + 1 heavy anvil (2 slots) = 4 slots
    // Silver: 250 silver -> floor(250/100) = 2 slots
    // Total used slots = 6 / 8
    const cap = calculateCarryingCapacity(0, mockCharacter.inventory, mockCharacter.silver);
    expect(cap.maxSlots).toBe(8);
    expect(cap.usedSlots).toBe(6);
    expect(cap.isOverencumbered).toBe(false);
    expect(cap.penaltyDR).toBe(0);

    // Now exceed capacity
    const heavyInventory = [
      ...mockCharacter.inventory,
      { id: 'i3', name: 'Iron Chest', slots: 2, quantity: 2 }, // +4 slots -> total 10
    ];
    const overCap = calculateCarryingCapacity(0, heavyInventory, mockCharacter.silver);
    expect(overCap.usedSlots).toBe(10);
    expect(overCap.isOverencumbered).toBe(true);
    expect(overCap.penaltyDR).toBe(2);
  });

  it('rollBrokenTable should return a valid d4 outcome', () => {
    for (let i = 0; i < 20; i++) {
      const broken = rollBrokenTable();
      expect(broken.roll).toBeGreaterThanOrEqual(1);
      expect(broken.roll).toBeLessThanOrEqual(4);
      expect(broken.title).toBeDefined();
      expect(broken.description).toBeDefined();
    }
  });

  it('generateRandomCharacter should create a complete, valid MÖRK BORG character', () => {
    const scumbag = generateRandomCharacter();
    expect(scumbag.id).toBeDefined();
    expect(scumbag.name).toBeTruthy();
    expect(scumbag.characterClass).toBeTruthy();
    expect(scumbag.hp.max).toBeGreaterThanOrEqual(1);
    expect(scumbag.hp.current).toBe(scumbag.hp.max);
    expect(scumbag.weapons.length).toBeGreaterThanOrEqual(1);
    expect(scumbag.inventory.length).toBeGreaterThanOrEqual(1);
    expect(['d2', 'd4']).toContain(scumbag.omens.dieType);
  });

  it('performArmorSoak should calculate soak with shield', () => {
    const soak = performArmorSoak('Wretched Test', mockCharacter.armor);
    // Tier 1 is -d2 (1-2) + shield 1 -> 2 to 3
    expect(soak.total).toBeGreaterThanOrEqual(2);
    expect(soak.total).toBeLessThanOrEqual(3);
  });

  it('performDefend should incorporate armor penalties', () => {
    // Heavy armor (tier 3) adds +2 DR to defense
    const def = performDefend('Wretched Test', 1, 3, 12);
    expect(def.targetDR).toBe(14); // 12 + 2
  });
});
