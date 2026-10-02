import { Character } from '../types/morkborg';

export const CHARACTER_STORAGE_KEY = 'morkborg_character_sheet';

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return null;
}

/**
 * Loads the saved character from browser localStorage.
 * Returns null if not found or corrupted.
 */
export function loadCharacterFromStorage(): Character | null {
  try {
    const storage = getStorage();
    if (!storage) return null;

    const raw = storage.getItem(CHARACTER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // Basic schema verification: must have abilities, hp, and omens
    if (parsed && typeof parsed === 'object' && parsed.abilities && parsed.hp && parsed.name !== undefined) {
      return parsed as Character;
    }
  } catch (err) {
    console.warn('Failed to load character from localStorage:', err);
  }
  return null;
}

/**
 * Persists the current character to browser localStorage.
 */
export function saveCharacterToStorage(character: Character): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    storage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(character));
  } catch (err) {
    console.warn('Failed to save character to localStorage:', err);
  }
}

/**
 * Removes the saved character from localStorage.
 */
export function clearCharacterStorage(): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    storage.removeItem(CHARACTER_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear character from localStorage:', err);
  }
}

export const COLLAPSED_SECTIONS_STORAGE_KEY = 'morkborg_collapsed_sections_v2';

export interface CollapsedSections {
  header: boolean;
  abilities: boolean;
  vitals: boolean;
  combat: boolean;
  inventory: boolean;
  scrolls: boolean;
}

export const DEFAULT_COLLAPSED_SECTIONS: CollapsedSections = {
  header: true,
  abilities: true,
  vitals: true,
  combat: true,
  inventory: true,
  scrolls: true,
};

/**
 * Loads the saved collapsed sections state from browser localStorage.
 */
export function loadCollapsedSectionsFromStorage(): CollapsedSections {
  try {
    const storage = getStorage();
    if (!storage) return DEFAULT_COLLAPSED_SECTIONS;

    // Clean up older v1 key if present
    if (storage.getItem('morkborg_collapsed_sections')) {
      storage.removeItem('morkborg_collapsed_sections');
    }

    const raw = storage.getItem(COLLAPSED_SECTIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_COLLAPSED_SECTIONS;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        header: parsed.header !== undefined ? Boolean(parsed.header) : DEFAULT_COLLAPSED_SECTIONS.header,
        abilities: parsed.abilities !== undefined ? Boolean(parsed.abilities) : DEFAULT_COLLAPSED_SECTIONS.abilities,
        vitals: parsed.vitals !== undefined ? Boolean(parsed.vitals) : DEFAULT_COLLAPSED_SECTIONS.vitals,
        combat: parsed.combat !== undefined ? Boolean(parsed.combat) : DEFAULT_COLLAPSED_SECTIONS.combat,
        inventory: parsed.inventory !== undefined ? Boolean(parsed.inventory) : DEFAULT_COLLAPSED_SECTIONS.inventory,
        scrolls: parsed.scrolls !== undefined ? Boolean(parsed.scrolls) : DEFAULT_COLLAPSED_SECTIONS.scrolls,
      };
    }
  } catch (err) {
    console.warn('Failed to load collapsed sections from localStorage:', err);
  }
  return DEFAULT_COLLAPSED_SECTIONS;
}

/**
 * Persists the collapsed sections state to browser localStorage.
 */
export function saveCollapsedSectionsToStorage(state: CollapsedSections): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    storage.setItem(COLLAPSED_SECTIONS_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save collapsed sections to localStorage:', err);
  }
}

export const BAREBONES_STORAGE_KEY = 'morkborg_barebones_mode';

/**
 * Loads the saved barebones mode preference from browser localStorage.
 */
export function loadBarebonesModeFromStorage(): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;

    const raw = storage.getItem(BAREBONES_STORAGE_KEY);
    return raw === 'true';
  } catch (err) {
    console.warn('Failed to load barebones mode from localStorage:', err);
  }
  return false;
}

/**
 * Persists the barebones mode preference to browser localStorage.
 */
export function saveBarebonesModeToStorage(enabled: boolean): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    storage.setItem(BAREBONES_STORAGE_KEY, String(enabled));
  } catch (err) {
    console.warn('Failed to save barebones mode to localStorage:', err);
  }
}

