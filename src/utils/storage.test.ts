import { describe, it, expect, beforeEach } from 'vitest';
import { 
  loadCharacterFromStorage, 
  saveCharacterToStorage, 
  clearCharacterStorage, 
  CHARACTER_STORAGE_KEY,
  loadCollapsedSectionsFromStorage,
  saveCollapsedSectionsToStorage,
  DEFAULT_COLLAPSED_SECTIONS,
  COLLAPSED_SECTIONS_STORAGE_KEY,
  loadBarebonesModeFromStorage,
  saveBarebonesModeToStorage,
  BAREBONES_STORAGE_KEY
} from './storage';
import { generateRandomCharacter } from './morkborgRules';
import { Character } from '../types/morkborg';

// Mock localStorage for test environment
class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};

  get length() {
    return Object.keys(this.store).length;
  }

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  key(index: number) {
    return Object.keys(this.store)[index] ?? null;
  }
}

globalThis.localStorage = new LocalStorageMock();

describe('Local Storage Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return null when localStorage is empty', () => {
    expect(loadCharacterFromStorage()).toBeNull();
  });

  it('should save and load character accurately', () => {
    const char = generateRandomCharacter();
    char.name = 'Old Gid The Survivor';
    char.hp.current = 4;

    saveCharacterToStorage(char);

    const loaded = loadCharacterFromStorage();
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe('Old Gid The Survivor');
    expect(loaded?.hp.current).toBe(4);
    expect(loaded?.characterClass).toBe(char.characterClass);
  });

  it('should overwrite existing character when scvmbirther or import saves new character', () => {
    const original = generateRandomCharacter();
    original.name = 'First Scum';
    saveCharacterToStorage(original);

    expect(loadCharacterFromStorage()?.name).toBe('First Scum');

    const scvmbirtherNew = generateRandomCharacter();
    scvmbirtherNew.name = 'Second Scum (Scvmbirther)';
    saveCharacterToStorage(scvmbirtherNew);

    const loadedAfterScvm = loadCharacterFromStorage();
    expect(loadedAfterScvm?.name).toBe('Second Scum (Scvmbirther)');

    const importedChar: Character = {
      ...original,
      name: 'Imported Demon Priest',
      characterClass: 'Heretical Priest',
    };
    saveCharacterToStorage(importedChar);

    const loadedAfterImport = loadCharacterFromStorage();
    expect(loadedAfterImport?.name).toBe('Imported Demon Priest');
    expect(loadedAfterImport?.characterClass).toBe('Heretical Priest');
  });

  it('should handle edits updating local storage', () => {
    const char = generateRandomCharacter();
    saveCharacterToStorage(char);

    // Simulate an edit (e.g. taking 2 damage, adding 50 silver)
    const edited = {
      ...char,
      hp: { ...char.hp, current: Math.max(0, char.hp.current - 2) },
      silver: char.silver + 50,
    };
    saveCharacterToStorage(edited);

    const loaded = loadCharacterFromStorage();
    expect(loaded?.hp.current).toBe(edited.hp.current);
    expect(loaded?.silver).toBe(edited.silver);
  });

  it('should safely return null on corrupted JSON', () => {
    localStorage.setItem(CHARACTER_STORAGE_KEY, '{ invalid_json... }');
    expect(loadCharacterFromStorage()).toBeNull();
  });

  it('should safely return null when JSON lacks expected schema', () => {
    localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify({ random: 'data' }));
    expect(loadCharacterFromStorage()).toBeNull();
  });

  it('should clear character storage', () => {
    const char = generateRandomCharacter();
    saveCharacterToStorage(char);
    expect(loadCharacterFromStorage()).not.toBeNull();

    clearCharacterStorage();
    expect(loadCharacterFromStorage()).toBeNull();
  });

  describe('Collapsed Sections Persistence', () => {
    it('should return DEFAULT_COLLAPSED_SECTIONS with all sections collapsed (true) by default', () => {
      expect(DEFAULT_COLLAPSED_SECTIONS).toEqual({
        header: true,
        abilities: true,
        vitals: true,
        combat: true,
        inventory: true,
        scrolls: true,
      });
      expect(loadCollapsedSectionsFromStorage()).toEqual(DEFAULT_COLLAPSED_SECTIONS);
    });

    it('should clean up legacy v1 key when loading', () => {
      localStorage.setItem('morkborg_collapsed_sections', JSON.stringify({ header: false, abilities: false }));
      const loaded = loadCollapsedSectionsFromStorage();
      expect(loaded).toEqual(DEFAULT_COLLAPSED_SECTIONS);
      expect(localStorage.getItem('morkborg_collapsed_sections')).toBeNull();
    });

    it('should save and load collapsed sections accurately', () => {
      const state = {
        header: true,
        abilities: true,
        vitals: false,
        combat: true,
        inventory: false,
        scrolls: true,
      };

      saveCollapsedSectionsToStorage(state);
      const loaded = loadCollapsedSectionsFromStorage();
      expect(loaded).toEqual(state);
    });

    it('should fallback gracefully on corrupted json in collapsed sections', () => {
      localStorage.setItem(COLLAPSED_SECTIONS_STORAGE_KEY, 'invalid json {');
      expect(loadCollapsedSectionsFromStorage()).toEqual(DEFAULT_COLLAPSED_SECTIONS);
    });
  });

  describe('Barebones Mode Persistence', () => {
    it('should default to false when localStorage is empty', () => {
      expect(loadBarebonesModeFromStorage()).toBe(false);
    });

    it('should persist and load barebones mode accurately', () => {
      saveBarebonesModeToStorage(true);
      expect(loadBarebonesModeFromStorage()).toBe(true);

      saveBarebonesModeToStorage(false);
      expect(loadBarebonesModeFromStorage()).toBe(false);
    });

    it('should read from BAREBONES_STORAGE_KEY correctly', () => {
      localStorage.setItem(BAREBONES_STORAGE_KEY, 'true');
      expect(loadBarebonesModeFromStorage()).toBe(true);

      localStorage.setItem(BAREBONES_STORAGE_KEY, 'false');
      expect(loadBarebonesModeFromStorage()).toBe(false);
    });
  });
});
