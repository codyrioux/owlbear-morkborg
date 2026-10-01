import { describe, it, expect } from 'vitest';
import { getDieSides, rollDawnCheck, triggerNextMisery } from './nechrubel';
import { GMState, DEFAULT_GM_STATE } from '../obr/gmService';

describe('Calendar of Nechrubel Rules', () => {
  it('maps campaign duration dice sides accurately', () => {
    expect(getDieSides('d100')).toBe(100);
    expect(getDieSides('d20')).toBe(20);
    expect(getDieSides('d10')).toBe(10);
    expect(getDieSides('d6')).toBe(6);
    expect(getDieSides('d4')).toBe(4);
    expect(getDieSides('d2')).toBe(2);
  });

  it('triggers unique sequential miseries', () => {
    let state: GMState = { ...DEFAULT_GM_STATE, triggeredMiseries: [] };
    const titles = new Set<string>();

    for (let i = 0; i < 6; i++) {
      const { newMisery, isWorldEnded, updatedState } = triggerNextMisery(state);
      expect(isWorldEnded).toBe(false);
      expect(titles.has(newMisery.title)).toBe(false);
      titles.add(newMisery.title);
      expect(updatedState.triggeredMiseries).toHaveLength(i + 1);
      state = updatedState;
    }
  });

  it('guarantees 7th misery is Psalm 7:7 and ends the world', () => {
    // Populate with 6 miseries
    let state: GMState = { ...DEFAULT_GM_STATE, triggeredMiseries: [] };
    for (let i = 0; i < 6; i++) {
      state = triggerNextMisery(state).updatedState;
    }
    expect(state.triggeredMiseries).toHaveLength(6);
    expect(state.isWorldEnded).toBe(false);

    // 7th Misery
    const { newMisery, isWorldEnded, updatedState } = triggerNextMisery(state);
    expect(isWorldEnded).toBe(true);
    expect(newMisery.verse).toBe('7:7');
    expect(newMisery.text).toContain('Burn the book');
    expect(updatedState.triggeredMiseries).toHaveLength(7);
    expect(updatedState.isWorldEnded).toBe(true);
  });

  it('executes dawn check and reports result', () => {
    const state: GMState = { ...DEFAULT_GM_STATE, campaignDurationDie: 'd100' };
    const result = rollDawnCheck(state);
    expect(result.durationDie).toBe('d100');
    expect(result.dieRoll).toBeGreaterThanOrEqual(1);
    expect(result.dieRoll).toBeLessThanOrEqual(100);
  });
});
