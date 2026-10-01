import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import OBR from '@owlbear-rodeo/sdk';
import { GMService, DEFAULT_GM_STATE, GM_METADATA_KEY } from './gmService';
import { OBRService } from './obrService';

// Ensure window & localStorage are mocked
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { search: '', href: 'http://localhost/' },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
}

globalThis.localStorage = new LocalStorageMock();

describe('GMService & Role Detection', () => {
  beforeEach(() => {
    localStorage.clear();
    if (OBR && 'isAvailable' in OBR) {
      (OBR as any).isAvailable = false;
    }
  });

  afterEach(() => {
    if (OBR && 'isAvailable' in OBR) {
      (OBR as any).isAvailable = false;
    }
  });

  it('provides default GM state when empty', async () => {
    const state = await GMService.getGMState();
    expect(state).toEqual(DEFAULT_GM_STATE);
    expect(state.campaignDurationDie).toBe('d100');
    expect(state.triggeredMiseries).toEqual([]);
    expect(state.isWorldEnded).toBe(false);
    expect(state.round).toBe(1);
    expect(state.initiative).toBeNull();
  });

  it('updates and persists GM state', async () => {
    await GMService.updateGMState({
      campaignDurationDie: 'd6',
      round: 3,
      initiative: 'pcs',
    });

    const state = await GMService.getGMState();
    expect(state.campaignDurationDie).toBe('d6');
    expect(state.round).toBe(3);
    expect(state.initiative).toBe('pcs');

    const stored = JSON.parse(localStorage.getItem(GM_METADATA_KEY)!);
    expect(stored.campaignDurationDie).toBe('d6');
  });

  it('supports functional updates for state transitions', async () => {
    await GMService.updateGMState((prev) => ({
      ...prev,
      round: prev.round + 1,
    }));

    const state = await GMService.getGMState();
    expect(state.round).toBe(4);
  });

  it('reports GM role correctly outside OBR environment for testing', async () => {
    const role = await OBRService.getUserRole();
    expect(role).toBe('GM');
  });
});
