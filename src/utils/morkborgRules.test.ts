import { describe, it, expect } from 'vitest';
import { 
  performAbilityCheck, 
  performLongRest, 
  performShortRest, 
  calculateCarryingCapacity, 
  rollBrokenTable, 
  generateRandomCharacter,
  performArmorSoak,
  performDefend,
  getAbilityDRPenalty
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

  it('calculateCarryingCapacity should handle STR + 8, items, silver weight, armor, and shield', () => {
    // STR modifier = 0 -> capacity = 8
    // Items: 2 torches (2 slots) + 1 heavy anvil (2 slots) = 4 slots
    // Silver: 250 silver -> floor(250/100) = 2 slots
    // Total used slots without armor = 6 / 8
    const capWithoutArmor = calculateCarryingCapacity(0, mockCharacter.inventory, mockCharacter.silver);
    expect(capWithoutArmor.maxSlots).toBe(8);
    expect(capWithoutArmor.usedSlots).toBe(6);
    expect(capWithoutArmor.isOverencumbered).toBe(false);
    expect(capWithoutArmor.penaltyDR).toBe(0);

    // Armor tier 1 (+1 slot) + shield (+1 slot) -> total 8 slots
    const capWithArmorAndShield = calculateCarryingCapacity(0, mockCharacter.inventory, mockCharacter.silver, mockCharacter.armor);
    expect(capWithArmorAndShield.armorSlots).toBe(1);
    expect(capWithArmorAndShield.shieldSlots).toBe(1);
    expect(capWithArmorAndShield.usedSlots).toBe(8);
    expect(capWithArmorAndShield.isOverencumbered).toBe(false);

    // Tier 0 armor (0 slots) without shield (0 slots)
    const tier0Armor = { name: 'Rags', tier: 0 as const, damageReduction: '0', degraded: 0, hasShield: false };
    const capTier0 = calculateCarryingCapacity(0, mockCharacter.inventory, mockCharacter.silver, tier0Armor);
    expect(capTier0.armorSlots).toBe(0);
    expect(capTier0.shieldSlots).toBe(0);
    expect(capTier0.usedSlots).toBe(6);

    // Now exceed capacity with extra items
    const heavyInventory = [
      ...mockCharacter.inventory,
      { id: 'i3', name: 'Iron Chest', slots: 2, quantity: 2 }, // +4 slots
    ];
    const overCap = calculateCarryingCapacity(0, heavyInventory, mockCharacter.silver, mockCharacter.armor);
    expect(overCap.usedSlots).toBe(12);
    expect(overCap.isOverencumbered).toBe(true);
    expect(overCap.penaltyDR).toBe(2);
  });

  it('getAbilityDRPenalty should accurately calculate penalties for armor tiers and encumbrance', () => {
    const lightArmor = { name: 'Leather', tier: 1 as const, damageReduction: '-d2', degraded: 0, hasShield: false };
    const mediumArmor = { name: 'Chainmail', tier: 2 as const, damageReduction: '-d4', degraded: 0, hasShield: false };
    const heavyArmor = { name: 'Plate', tier: 3 as const, damageReduction: '-d6', degraded: 0, hasShield: false };

    // Agility tests:
    // Light: 0 DR penalty
    expect(getAbilityDRPenalty('agility', lightArmor, false)).toBe(0);
    // Medium (tier 2): +2 DR penalty
    expect(getAbilityDRPenalty('agility', mediumArmor, false)).toBe(2);
    // Heavy (tier 3): +4 DR penalty
    expect(getAbilityDRPenalty('agility', heavyArmor, false)).toBe(4);

    // Overencumbered adds +2 DR to Agility and Strength:
    expect(getAbilityDRPenalty('agility', heavyArmor, true)).toBe(6); // 4 (armor) + 2 (encumbered)
    expect(getAbilityDRPenalty('agility', mediumArmor, true)).toBe(4); // 2 (armor) + 2 (encumbered)
    expect(getAbilityDRPenalty('strength', heavyArmor, true)).toBe(2); // 0 (armor) + 2 (encumbered)
    expect(getAbilityDRPenalty('strength', heavyArmor, false)).toBe(0); // 0 (armor)

    // Presence & Toughness never take armor or encumbrance DR penalties:
    expect(getAbilityDRPenalty('presence', heavyArmor, true)).toBe(0);
    expect(getAbilityDRPenalty('toughness', heavyArmor, true)).toBe(0);
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
    // Light armor (tier 1): no defense penalty (DR 12)
    const defLight = performDefend('Wretched Test', 1, 1, 12);
    expect(defLight.targetDR).toBe(12);

    // Medium armor (tier 2): +2 DR to defense (DR 14)
    const defMed = performDefend('Wretched Test', 1, 2, 12);
    expect(defMed.targetDR).toBe(14);

    // Heavy armor (tier 3): +2 DR to defense (DR 14)
    const defHvy = performDefend('Wretched Test', 1, 3, 12);
    expect(defHvy.targetDR).toBe(14);
  });
});
