import { describe, it, expect, vi } from 'vitest';
import * as dice from './dice';
import { 
  performAbilityCheck, 
  performLongRest, 
  performShortRest, 
  calculateCarryingCapacity, 
  calculateItemSlots,
  getItemPreset,
  ITEM_STACK_PRESETS,
  rollBrokenTable, 
  generateRandomCharacter,
  performArmorSoak,
  performDefend,
  performAttack,
  performPowerTest,
  getAbilityDRPenalty,
  performWeaponDamage,
  CANONICAL_SCROLLS,
  calculateAbilityChange,
  performGettingBetter,
  rollTestD20,
  toggleLuckyFeat
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
      { id: 'i1', name: 'Crowbar', slots: 1, quantity: 2 },
      { id: 'i2', name: 'Heavy Anvil', slots: 2, quantity: 1 },
    ],
    scrolls: [],
    conditions: {
      broken: false,
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
      conditions: { broken: false, infected: false, starving: true }
    };
    const rest = performLongRest(char);
    expect(rest.healedHp).toBe(0);
    expect(rest.newHp).toBe(3);
  });

  it('performLongRest should penalize infected condition (damage d6, no heal)', () => {
    const char = { 
      ...mockCharacter, 
      hp: { current: 7, max: 10 },
      conditions: { broken: false, infected: true, starving: false }
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
    // Items: 2 crowbars (2 slots) + 1 heavy anvil (2 slots) = 4 slots
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

    // Now test weapons and scrolls slots
    const testWeapons = [
      { id: 'w1', name: 'Shortsword', type: 'melee' as const, damageDie: 'd6' },
      { id: 'w2', name: 'Dagger', type: 'melee' as const, damageDie: 'd4' },
    ];
    const testScrolls = [
      { id: 's1', name: "Palmaum's Step", type: 'unclean' as const, description: 'Fly' },
    ];
    const capWithWeaponsAndScrolls = calculateCarryingCapacity(
      0,
      mockCharacter.inventory,
      mockCharacter.silver,
      mockCharacter.armor,
      testWeapons,
      testScrolls
    );
    // items: 4, silver: 2, armor: 1, shield: 1, weapons: 2, scrolls: 1 -> total 11
    expect(capWithWeaponsAndScrolls.weaponsSlots).toBe(2);
    expect(capWithWeaponsAndScrolls.scrollsSlots).toBe(1);
    expect(capWithWeaponsAndScrolls.usedSlots).toBe(11);
    expect(capWithWeaponsAndScrolls.isOverencumbered).toBe(true);

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
    expect(scumbag.conditions).toEqual({
      broken: false,
      infected: false,
      starving: false,
    });
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

  it('performWeaponDamage should support custom dice formulas like 2d6 and 1d8+1, including crits and max damage', () => {
    // 1. Multi-dice weapon: 2d6
    const greatsword = { id: 'w-great', name: 'Zweihänder', type: 'melee' as const, damageDie: '2d6' };
    const roll2d6 = performWeaponDamage('Wretched Test', greatsword);
    expect(roll2d6.diceRolls).toHaveLength(2);
    expect(roll2d6.total).toBeGreaterThanOrEqual(2);
    expect(roll2d6.total).toBeLessThanOrEqual(12);
    expect(roll2d6.details).toMatch(/Rolled \[\d+ \+ \d+\] = \d+ damage/);

    // Max damage on 2d6 (Omen spent) -> 12
    const max2d6 = performWeaponDamage('Wretched Test', greatsword, false, true);
    expect(max2d6.total).toBe(12);
    expect(max2d6.diceRolls).toEqual([6, 6]);
    expect(max2d6.details).toContain('MAX DAMAGE (Omen spent): 12 damage!');

    // Critical hit on 2d6 -> rolls 4 dice
    const crit2d6 = performWeaponDamage('Wretched Test', greatsword, true, false);
    expect(crit2d6.diceRolls).toHaveLength(4);
    expect(crit2d6.total).toBeGreaterThanOrEqual(4);
    expect(crit2d6.total).toBeLessThanOrEqual(24);

    // 2. Weapon with modifier: 1d8+1
    const spikedMace = { id: 'w-mace', name: 'Spiked Mace', type: 'melee' as const, damageDie: '1d8+1' };
    const roll1d8plus1 = performWeaponDamage('Wretched Test', spikedMace);
    expect(roll1d8plus1.diceRolls).toHaveLength(1);
    expect(roll1d8plus1.modifier).toBe(1);
    expect(roll1d8plus1.total).toBeGreaterThanOrEqual(2); // 1 + 1
    expect(roll1d8plus1.total).toBeLessThanOrEqual(9); // 8 + 1
    expect(roll1d8plus1.details).toMatch(/Rolled \[\d+\] \+ 1 = \d+ damage/);

    // Max damage on 1d8+1 -> 9
    const max1d8plus1 = performWeaponDamage('Wretched Test', spikedMace, false, true);
    expect(max1d8plus1.total).toBe(9);
    expect(max1d8plus1.diceRolls).toEqual([8]);
    expect(max1d8plus1.details).toContain('MAX DAMAGE (Omen spent): 9 damage!');
  });

  it('CANONICAL_SCROLLS should contain all 20 canonical scrolls (10 unclean and 10 sacred)', () => {
    expect(CANONICAL_SCROLLS).toHaveLength(20);

    const unclean = CANONICAL_SCROLLS.filter((s) => s.type === 'unclean');
    const sacred = CANONICAL_SCROLLS.filter((s) => s.type === 'sacred');

    expect(unclean).toHaveLength(10);
    expect(sacred).toHaveLength(10);

    // Verify key canonical scrolls exist
    const uncleanNames = unclean.map((s) => s.name);
    expect(uncleanNames).toContain('Palms Open the Southern Gate');
    expect(uncleanNames).toContain('Tongue of Eris');
    expect(uncleanNames).toContain('Te-le-kin-esis');
    expect(uncleanNames).toContain('Lucy-fires Levitation');
    expect(uncleanNames).toContain('Daemon of Capillaries');
    expect(uncleanNames).toContain('Nine Violet Signs Unknot the Storm');
    expect(uncleanNames).toContain('Metzhuotl Blind Your Eye');
    expect(uncleanNames).toContain('Foul Psychopomp');
    expect(uncleanNames).toContain('Eyelid Blinds the Mind');
    expect(uncleanNames).toContain('Death');

    const sacredNames = sacred.map((s) => s.name);
    expect(sacredNames).toContain('Grace of a Dead Saint');
    expect(sacredNames).toContain('Grace for a Sinner');
    expect(sacredNames).toContain('Whispers Pass the Gate');
    expect(sacredNames).toContain('Aegis of Sorrow');
    expect(sacredNames).toContain('Unmet Fate');
    expect(sacredNames).toContain('Bestial Speech');
    expect(sacredNames).toContain("False Dawn / Night's Chariot");
    expect(sacredNames).toContain('Hermetic Step');
    expect(sacredNames).toContain("Roskoe's Consuming Glare");
    expect(sacredNames).toContain('Enochian Syntax');

    // All scrolls must have descriptive effects
    CANONICAL_SCROLLS.forEach((s) => {
      expect(s.name.trim().length).toBeGreaterThan(0);
      expect(s.description.trim().length).toBeGreaterThan(0);
    });
  });

  describe('Getting Better (or worse) Rules', () => {
    it('calculateAbilityChange should follow MÖRK BORG rules for modifiers <= +1', () => {
      // For modifier <= 1: roll 1 is -1, roll 2..6 is +1
      // Clamped min -3: old -3 with roll 1 stays -3, changed is 0
      expect(calculateAbilityChange(-3, 1)).toEqual({
        newModifier: -3,
        changed: 0,
      });
      // old -3 with roll 2..6 increases to -2
      expect(calculateAbilityChange(-3, 2)).toEqual({
        newModifier: -2,
        changed: 1,
      });
      expect(calculateAbilityChange(0, 1)).toEqual({
        newModifier: -1,
        changed: -1,
      });
      expect(calculateAbilityChange(0, 5)).toEqual({
        newModifier: 1,
        changed: 1,
      });
      expect(calculateAbilityChange(1, 1)).toEqual({
        newModifier: 0,
        changed: -1,
      });
      expect(calculateAbilityChange(1, 6)).toEqual({
        newModifier: 2,
        changed: 1,
      });
    });

    it('calculateAbilityChange should follow MÖRK BORG rules for modifiers >= +2', () => {
      // For modifier >= 2: roll >= modifier is +1, roll < modifier is -1
      // Case +2: roll 1 is -1, roll 2..6 is +1
      expect(calculateAbilityChange(2, 1)).toEqual({
        newModifier: 1,
        changed: -1,
      });
      expect(calculateAbilityChange(2, 2)).toEqual({
        newModifier: 3,
        changed: 1,
      });

      // Case +4: roll 1..3 is -1, roll 4..6 is +1
      expect(calculateAbilityChange(4, 3)).toEqual({
        newModifier: 3,
        changed: -1,
      });
      expect(calculateAbilityChange(4, 4)).toEqual({
        newModifier: 5,
        changed: 1,
      });

      // Case +6: roll 6 cannot exceed max +6, changed is 0
      expect(calculateAbilityChange(6, 6)).toEqual({
        newModifier: 6,
        changed: 0,
      });
      expect(calculateAbilityChange(6, 5)).toEqual({
        newModifier: 5,
        changed: -1,
      });
    });

    it('performGettingBetter executes all three steps and returns updated character', () => {
      const char: Character = {
        ...mockCharacter,
        hp: { current: 5, max: 8 },
        abilities: {
          strength: { modifier: 0 },
          agility: { modifier: 1 },
          presence: { modifier: 2 },
          toughness: { modifier: -1 },
        },
        silver: 50,
        inventory: [],
        scrolls: [],
      };

      const { result, updatedCharacter } = performGettingBetter(char);

      // 1. HP Check: 6d10 rolled
      expect(result.hpRolls).toHaveLength(6);
      expect(result.hpRollSum).toBeGreaterThanOrEqual(6);
      expect(result.hpRollSum).toBeLessThanOrEqual(60);

      if (result.hpIncreased) {
        expect(result.hpGain).toBeGreaterThanOrEqual(1);
        expect(result.hpGain).toBeLessThanOrEqual(6);
        expect(updatedCharacter.hp.max).toBe(char.hp.max + result.hpGain);
        expect(updatedCharacter.hp.current).toBe(char.hp.current + result.hpGain);
      } else {
        expect(result.hpGain).toBe(0);
        expect(updatedCharacter.hp.max).toBe(char.hp.max);
        expect(updatedCharacter.hp.current).toBe(char.hp.current);
      }

      // 2. Debris Check: d6 rolled
      expect(result.debrisRoll).toBeGreaterThanOrEqual(1);
      expect(result.debrisRoll).toBeLessThanOrEqual(6);

      if (result.debrisRoll <= 3) {
        expect(result.debrisType).toBe('nothing');
        expect(result.silverFound).toBeUndefined();
        expect(result.scrollFound).toBeUndefined();
        expect(updatedCharacter.silver).toBe(char.silver);
      } else if (result.debrisRoll === 4) {
        expect(result.debrisType).toBe('silver');
        expect(result.silverFound).toBeGreaterThanOrEqual(3);
        expect(result.silverFound).toBeLessThanOrEqual(30);
        expect(updatedCharacter.silver).toBe(char.silver + result.silverFound!);
      } else {
        // 5 or 6 (unclean or sacred scroll)
        expect(result.scrollFound).toBeDefined();
        expect(updatedCharacter.scrolls).toHaveLength(1);
        expect(updatedCharacter.scrolls[0].name).toBe(result.scrollFound!.name);
      }

      // 3. Ability Changes
      expect(result.abilityChanges).toHaveLength(4);
      result.abilityChanges.forEach((change) => {
        expect(change.roll).toBeGreaterThanOrEqual(1);
        expect(change.roll).toBeLessThanOrEqual(6);
        expect(updatedCharacter.abilities[change.ability].modifier).toBe(change.newModifier);
      });

      // Summary string exists
      expect(result.summary.length).toBeGreaterThan(0);
    });
  });

  describe('Inventory Stacking & Ammunition Rules', () => {
    it('getItemPreset should recognize canonical stackable items and ammunition', () => {
      // Canonical dictionary and ammunition presets
      expect(ITEM_STACK_PRESETS['arrows'].stackSize).toBe(20);
      expect(ITEM_STACK_PRESETS['chalk'].stackSize).toBe(10);

      const arrowPreset = getItemPreset('Arrows');
      expect(arrowPreset).toBeDefined();
      expect(arrowPreset?.stackSize).toBe(20);
      expect(arrowPreset?.isAmmunition).toBe(true);

      const boltPreset = getItemPreset('Crossbow Bolts');
      expect(boltPreset).toBeDefined();
      expect(boltPreset?.stackSize).toBe(10);
      expect(boltPreset?.isAmmunition).toBe(true);

      const bulletPreset = getItemPreset('sling bullets');
      expect(bulletPreset).toBeDefined();
      expect(bulletPreset?.stackSize).toBe(20);
      expect(bulletPreset?.isAmmunition).toBe(true);

      // Chalk preset: 10
      const chalkPreset = getItemPreset('Chalk');
      expect(chalkPreset).toBeDefined();
      expect(chalkPreset?.stackSize).toBe(10);
      expect(chalkPreset?.isAmmunition).toBeFalsy();

      // Torches preset: 4
      const torchPreset = getItemPreset('Torches');
      expect(torchPreset).toBeDefined();
      expect(torchPreset?.stackSize).toBe(4);

      // Dry Rations preset: 4
      const rationPreset = getItemPreset('Dry Rations');
      expect(rationPreset).toBeDefined();
      expect(rationPreset?.stackSize).toBe(4);

      // Caltrops preset: 2
      const caltropPreset = getItemPreset('Caltrops');
      expect(caltropPreset).toBeDefined();
      expect(caltropPreset?.stackSize).toBe(2);

      // Substring matching on descriptive names
      expect(getItemPreset('Quiver of 20 Iron Arrows')?.stackSize).toBe(20);
      expect(getItemPreset('Bundle of Tallow Torches')?.stackSize).toBe(4);

      // Non-preset item
      expect(getItemPreset('Grappling Hook')).toBeNull();
    });

    it('calculateItemSlots should handle non-stacking items correctly', () => {
      expect(calculateItemSlots({ id: '1', name: 'Crowbar', slots: 1, quantity: 1 })).toBe(1);
      expect(calculateItemSlots({ id: '2', name: 'Crowbar', slots: 1, quantity: 3 })).toBe(3);
      expect(calculateItemSlots({ id: '3', name: 'Anvil', slots: 2, quantity: 2 })).toBe(4);
      expect(calculateItemSlots({ id: '4', name: 'Flute', slots: 0, quantity: 5 })).toBe(0);
      expect(calculateItemSlots({ id: '5', name: 'Crowbar', slots: 1, quantity: 0 })).toBe(0);
    });

    it('calculateItemSlots should handle general stackable items (torches, rations, chalk, caltrops)', () => {
      // Chalk (stackSize: 10)
      const chalk = { id: 'c', name: 'Chalk', slots: 1, quantity: 10 };
      expect(calculateItemSlots({ ...chalk, quantity: 0 })).toBe(0);
      expect(calculateItemSlots({ ...chalk, quantity: 1 })).toBe(1);
      expect(calculateItemSlots({ ...chalk, quantity: 9 })).toBe(1);
      expect(calculateItemSlots({ ...chalk, quantity: 10 })).toBe(1);
      expect(calculateItemSlots({ ...chalk, quantity: 11 })).toBe(2);
      expect(calculateItemSlots({ ...chalk, quantity: 20 })).toBe(2);
      expect(calculateItemSlots({ ...chalk, quantity: 21 })).toBe(3);

      // Torches (stackSize: 4)
      const torch = { id: 't', name: 'Torches', slots: 1, quantity: 4 };
      expect(calculateItemSlots({ ...torch, quantity: 1 })).toBe(1);
      expect(calculateItemSlots({ ...torch, quantity: 4 })).toBe(1);
      expect(calculateItemSlots({ ...torch, quantity: 5 })).toBe(2);
      expect(calculateItemSlots({ ...torch, quantity: 8 })).toBe(2);
      expect(calculateItemSlots({ ...torch, quantity: 9 })).toBe(3);

      // Caltrops (stackSize: 2)
      const caltrop = { id: 'k', name: 'Caltrops', slots: 1, quantity: 2 };
      expect(calculateItemSlots({ ...caltrop, quantity: 1 })).toBe(1);
      expect(calculateItemSlots({ ...caltrop, quantity: 2 })).toBe(1);
      expect(calculateItemSlots({ ...caltrop, quantity: 3 })).toBe(2);
    });

    it('calculateItemSlots should apply ammunition rule: first stack of size n consumes 0 slots', () => {
      // Arrows (stackSize: 20, isAmmunition: true)
      const arrows = { id: 'a', name: 'Arrows', slots: 1, quantity: 20, stackSize: 20, isAmmunition: true };
      expect(calculateItemSlots({ ...arrows, quantity: 0 })).toBe(0);
      expect(calculateItemSlots({ ...arrows, quantity: 1 })).toBe(0);
      expect(calculateItemSlots({ ...arrows, quantity: 10 })).toBe(0);
      expect(calculateItemSlots({ ...arrows, quantity: 19 })).toBe(0);
      expect(calculateItemSlots({ ...arrows, quantity: 20 })).toBe(0); // 0 slots for first 20!

      // Second stack: 21 to 40 arrows = 1 slot
      expect(calculateItemSlots({ ...arrows, quantity: 21 })).toBe(1);
      expect(calculateItemSlots({ ...arrows, quantity: 30 })).toBe(1);
      expect(calculateItemSlots({ ...arrows, quantity: 40 })).toBe(1);

      // Third stack: 41 to 60 arrows = 2 slots
      expect(calculateItemSlots({ ...arrows, quantity: 41 })).toBe(2);
      expect(calculateItemSlots({ ...arrows, quantity: 60 })).toBe(2);

      // Fourth stack: 61 arrows = 3 slots
      expect(calculateItemSlots({ ...arrows, quantity: 61 })).toBe(3);

      // Crossbow Bolts (stackSize: 10, isAmmunition: true)
      const bolts = { id: 'b', name: 'Crossbow Bolts', slots: 1, quantity: 10, stackSize: 10, isAmmunition: true };
      expect(calculateItemSlots({ ...bolts, quantity: 0 })).toBe(0);
      expect(calculateItemSlots({ ...bolts, quantity: 1 })).toBe(0);
      expect(calculateItemSlots({ ...bolts, quantity: 10 })).toBe(0); // 0 slots for first 10!
      expect(calculateItemSlots({ ...bolts, quantity: 11 })).toBe(1);
      expect(calculateItemSlots({ ...bolts, quantity: 20 })).toBe(1);
      expect(calculateItemSlots({ ...bolts, quantity: 21 })).toBe(2);

      // Sling Bullets (stackSize: 20, isAmmunition: true)
      const bullets = { id: 's', name: 'Sling Bullets', slots: 1, quantity: 20, stackSize: 20, isAmmunition: true };
      expect(calculateItemSlots({ ...bullets, quantity: 20 })).toBe(0); // 0 slots for first 20!
      expect(calculateItemSlots({ ...bullets, quantity: 21 })).toBe(1);
      expect(calculateItemSlots({ ...bullets, quantity: 40 })).toBe(1);
      expect(calculateItemSlots({ ...bullets, quantity: 41 })).toBe(2);
    });

    it('calculateCarryingCapacity should accurately integrate ammunition and stacking rules', () => {
      const inventory = [
        { id: '1', name: 'Arrows', slots: 1, quantity: 20, stackSize: 20, isAmmunition: true }, // 0 slots
        { id: '2', name: 'Crossbow Bolts', slots: 1, quantity: 10, stackSize: 10, isAmmunition: true }, // 0 slots
        { id: '3', name: 'Sling Bullets', slots: 1, quantity: 20, stackSize: 20, isAmmunition: true }, // 0 slots
        { id: '4', name: 'Torches', slots: 1, quantity: 4, stackSize: 4 }, // 1 slot
        { id: '5', name: 'Dry Rations', slots: 1, quantity: 4, stackSize: 4 }, // 1 slot
        { id: '6', name: 'Chalk', slots: 1, quantity: 10, stackSize: 10 }, // 1 slot
      ];

      // STR modifier = 0 -> capacity = 8
      // Silver = 50 -> 0 slots
      const cap = calculateCarryingCapacity(0, inventory, 50);
      expect(cap.maxSlots).toBe(8);
      expect(cap.usedSlots).toBe(3); // Only torches (1), rations (1), chalk (1)
      expect(cap.isOverencumbered).toBe(false);

      // Now add 1 arrow (21 arrows) -> arrows now consume 1 slot (total = 4)
      const invWith21Arrows = inventory.map(item => 
        item.name === 'Arrows' ? { ...item, quantity: 21 } : item
      );
      const capWith21Arrows = calculateCarryingCapacity(0, invWith21Arrows, 50);
      expect(capWith21Arrows.usedSlots).toBe(4);

      // Now add 1 bolt (11 bolts) -> bolts now consume 1 slot (total = 5)
      const invWith11Bolts = invWith21Arrows.map(item =>
        item.name === 'Crossbow Bolts' ? { ...item, quantity: 11 } : item
      );
      const capWith11Bolts = calculateCarryingCapacity(0, invWith11Bolts, 50);
      expect(capWith11Bolts.usedSlots).toBe(5);

      // Now add 1 chalk (11 chalk) -> chalk now consumes 2 slots (total = 6)
      const invWith11Chalk = invWith11Bolts.map(item =>
        item.name === 'Chalk' ? { ...item, quantity: 11 } : item
      );
      const capWith11Chalk = calculateCarryingCapacity(0, invWith11Chalk, 50);
      expect(capWith11Chalk.usedSlots).toBe(6);
    });
  });

  describe('Unholy Feat #51: Lucky (Mörk Borg Cult / Feretory)', () => {
    it('rollTestD20 standard mode rolls 1d20', () => {
      const result = rollTestD20(false);
      expect(result.diceRolls).toHaveLength(1);
      expect(result.roll).toBeGreaterThanOrEqual(1);
      expect(result.roll).toBeLessThanOrEqual(20);
      expect(result.isCrit).toBe(result.roll === 20);
      expect(result.isFumble).toBe(result.roll === 1);
    });

    it('rollTestD20 lucky mode rolls 2d20 and picks highest', () => {
      const spy = vi.spyOn(dice, 'rollDie');

      // Test pick highest when neither is 1: [14, 18] -> 18
      spy.mockReturnValueOnce(14).mockReturnValueOnce(18);
      const res1 = rollTestD20(true);
      expect(res1.diceRolls).toEqual([14, 18]);
      expect(res1.roll).toBe(18);
      expect(res1.isFumble).toBe(false);
      expect(res1.isCrit).toBe(false);

      // Test crit when highest is 20: [19, 20] -> 20 (Crit)
      spy.mockReturnValueOnce(19).mockReturnValueOnce(20);
      const res2 = rollTestD20(true);
      expect(res2.diceRolls).toEqual([19, 20]);
      expect(res2.roll).toBe(20);
      expect(res2.isCrit).toBe(true);
      expect(res2.isFumble).toBe(false);

      // Test double 20: [20, 20] -> 20 (Crit)
      spy.mockReturnValueOnce(20).mockReturnValueOnce(20);
      const res3 = rollTestD20(true);
      expect(res3.diceRolls).toEqual([20, 20]);
      expect(res3.roll).toBe(20);
      expect(res3.isCrit).toBe(true);
      expect(res3.isFumble).toBe(false);

      spy.mockRestore();
    });

    it('rollTestD20 lucky mode automatically fumbles if either die is a 1, even if the other is 20', () => {
      const spy = vi.spyOn(dice, 'rollDie');

      // Die 1 is 1, Die 2 is 20 -> Fumble!
      spy.mockReturnValueOnce(1).mockReturnValueOnce(20);
      const res1 = rollTestD20(true);
      expect(res1.diceRolls).toEqual([1, 20]);
      expect(res1.roll).toBe(1);
      expect(res1.isFumble).toBe(true);
      expect(res1.isCrit).toBe(false);

      // Die 1 is 18, Die 2 is 1 -> Fumble!
      spy.mockReturnValueOnce(18).mockReturnValueOnce(1);
      const res2 = rollTestD20(true);
      expect(res2.diceRolls).toEqual([18, 1]);
      expect(res2.roll).toBe(1);
      expect(res2.isFumble).toBe(true);
      expect(res2.isCrit).toBe(false);

      // Both dice are 1 -> Fumble!
      spy.mockReturnValueOnce(1).mockReturnValueOnce(1);
      const res3 = rollTestD20(true);
      expect(res3.diceRolls).toEqual([1, 1]);
      expect(res3.roll).toBe(1);
      expect(res3.isFumble).toBe(true);
      expect(res3.isCrit).toBe(false);

      spy.mockRestore();
    });

    it('toggleLuckyFeat sets omens to 0 and locked when enabled, and restores when disabled', () => {
      const baseChar = {
        ...mockCharacter,
        omens: { current: 2, max: 2, dieType: 'd2' as const },
        feats: { lucky: false },
      };

      // Toggle ON
      const luckyChar = toggleLuckyFeat(baseChar, true);
      expect(luckyChar.feats?.lucky).toBe(true);
      expect(luckyChar.omens.current).toBe(0);
      expect(luckyChar.omens.max).toBe(0);

      // Toggle OFF
      const restoredChar = toggleLuckyFeat(luckyChar, false);
      expect(restoredChar.feats?.lucky).toBe(false);
      expect(restoredChar.omens.max).toBe(2);
      expect(restoredChar.omens.current).toBe(2);

      // Toggle OFF for d4 class
      const d4Char = {
        ...baseChar,
        characterClass: 'Heretical Priest',
        omens: { current: 0, max: 0, dieType: 'd4' as const },
        feats: { lucky: true },
      };
      const restoredD4 = toggleLuckyFeat(d4Char, false);
      expect(restoredD4.feats?.lucky).toBe(false);
      expect(restoredD4.omens.max).toBe(4);
      expect(restoredD4.omens.current).toBe(4);
    });

    it('performAbilityCheck executes with 2d20 when isLucky is true', () => {
      const spy = vi.spyOn(dice, 'rollDie');

      // Fumble when one die is 1
      spy.mockReturnValueOnce(1).mockReturnValueOnce(17);
      const fumbled = performAbilityCheck('Lucky Scum', 'strength', 2, 12, 0, 0, true);
      expect(fumbled.isLucky).toBe(true);
      expect(fumbled.diceRolls).toEqual([1, 17]);
      expect(fumbled.isFumble).toBe(true);
      expect(fumbled.isCrit).toBe(false);
      expect(fumbled.success).toBe(false);
      expect(fumbled.roll).toBe(1);
      expect(fumbled.details).toContain('Lucky: Fumble on 1!');

      // Success when picking highest
      spy.mockReturnValueOnce(8).mockReturnValueOnce(15);
      const passed = performAbilityCheck('Lucky Scum', 'strength', 2, 12, 0, 0, true);
      expect(passed.isLucky).toBe(true);
      expect(passed.diceRolls).toEqual([8, 15]);
      expect(passed.roll).toBe(15);
      expect(passed.total).toBe(17);
      expect(passed.success).toBe(true);
      expect(passed.details).toContain('Lucky: Picked 15');

      spy.mockRestore();
    });

    it('performDefend executes with 2d20 when isLucky is true', () => {
      const spy = vi.spyOn(dice, 'rollDie');

      // Defend fumble
      spy.mockReturnValueOnce(19).mockReturnValueOnce(1);
      const defFumble = performDefend('Lucky Scum', 0, 0, 12, true);
      expect(defFumble.isLucky).toBe(true);
      expect(defFumble.diceRolls).toEqual([19, 1]);
      expect(defFumble.isFumble).toBe(true);
      expect(defFumble.success).toBe(false);

      // Defend crit
      spy.mockReturnValueOnce(20).mockReturnValueOnce(14);
      const defCrit = performDefend('Lucky Scum', 0, 0, 12, true);
      expect(defCrit.isLucky).toBe(true);
      expect(defCrit.roll).toBe(20);
      expect(defCrit.isCrit).toBe(true);
      expect(defCrit.success).toBe(true);

      spy.mockRestore();
    });

    it('performAttack executes with 2d20 when isLucky is true', () => {
      const spy = vi.spyOn(dice, 'rollDie');
      const weapon = { id: 'w1', name: 'Femur', type: 'melee' as const, damageDie: 'd4' };

      // Attack fumble on 1 despite second die 20
      spy.mockReturnValueOnce(1).mockReturnValueOnce(20);
      const atkFumble = performAttack('Lucky Scum', weapon, 1, 12, true);
      expect(atkFumble.isLucky).toBe(true);
      expect(atkFumble.isFumble).toBe(true);
      expect(atkFumble.isCrit).toBe(false);
      expect(atkFumble.success).toBe(false);

      // Attack crit when [18, 20]
      spy.mockReturnValueOnce(18).mockReturnValueOnce(20);
      const atkCrit = performAttack('Lucky Scum', weapon, 1, 12, true);
      expect(atkCrit.isLucky).toBe(true);
      expect(atkCrit.isCrit).toBe(true);
      expect(atkCrit.roll).toBe(20);
      expect(atkCrit.success).toBe(true);

      spy.mockRestore();
    });

    it('performPowerTest executes with 2d20 when isLucky is true', () => {
      const spy = vi.spyOn(dice, 'rollDie');
      const scroll = { id: 's1', name: 'Palms Open the Southern Gate', type: 'unclean' as const, description: 'Flame' };

      // Power fumble on 1
      spy.mockReturnValueOnce(16).mockReturnValueOnce(1);
      const powerFumble = performPowerTest('Lucky Scum', scroll, 2, 12, true);
      expect(powerFumble.isLucky).toBe(true);
      expect(powerFumble.isFumble).toBe(true);
      expect(powerFumble.details).toContain('ARCANE CATASTROPHE');

      // Power success
      spy.mockReturnValueOnce(11).mockReturnValueOnce(14);
      const powerSuccess = performPowerTest('Lucky Scum', scroll, 2, 12, true);
      expect(powerSuccess.isLucky).toBe(true);
      expect(powerSuccess.roll).toBe(14);
      expect(powerSuccess.success).toBe(true);

      spy.mockRestore();
    });

    it('performLongRest locks omens to 0 when character has Lucky feat', () => {
      const luckyChar = {
        ...mockCharacter,
        omens: { current: 0, max: 0, dieType: 'd2' as const },
        feats: { lucky: true },
      };

      const rest = performLongRest(luckyChar);
      expect(rest.newOmens).toBe(0);
      expect(rest.rollsLog).toContain('Omens: None (Locked by Lucky feat)');
    });

    it('generateRandomCharacter initializes with feats.lucky false', () => {
      const char = generateRandomCharacter();
      expect(char.feats?.lucky).toBe(false);
    });
  });
});

