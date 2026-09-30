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
