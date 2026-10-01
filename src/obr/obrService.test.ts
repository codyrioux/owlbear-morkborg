import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateRandomCharacter } from '../utils/morkborgRules';

// Provide window global mock for bun test environment
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { search: '', href: 'http://localhost/' },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

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

const mockOBR = {
  isAvailable: false,
  onReady: vi.fn(),
  player: {
    getName: vi.fn().mockResolvedValue('Test Player'),
    getSelection: vi.fn().mockResolvedValue([]),
    select: vi.fn().mockResolvedValue(undefined),
    onChange: vi.fn().mockReturnValue(() => {}),
  },
  scene: {
    items: {
      getItems: vi.fn().mockResolvedValue([]),
      updateItems: vi.fn().mockResolvedValue(undefined),
      getItemBounds: vi.fn().mockResolvedValue({ min: { x: 0, y: 0 }, max: { x: 100, y: 100 } }),
      onChange: vi.fn().mockReturnValue(() => {}),
    },
  },
  broadcast: {
    sendMessage: vi.fn().mockResolvedValue(undefined),
    onMessage: vi.fn().mockReturnValue(() => {}),
  },
  notification: {
    show: vi.fn().mockResolvedValue(undefined),
  },
  action: {
    isOpen: vi.fn().mockResolvedValue(false),
    open: vi.fn().mockResolvedValue(undefined),
    setHeight: vi.fn().mockResolvedValue(undefined),
    getHeight: vi.fn().mockResolvedValue(600),
  },
  viewport: {
    animateToBounds: vi.fn().mockResolvedValue(undefined),
  },
  contextMenu: {
    create: vi.fn(),
  },
};

vi.mock('@owlbear-rodeo/sdk', () => {
  return {
    default: mockOBR,
    ...mockOBR,
  };
});

// Import OBRService after mock is established
import { OBRService } from './obrService';

describe('OBRService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockOBR.isAvailable = false;
  });

  describe('Standalone / Offline Mode (OBR Unavailable)', () => {
    it('should report availability correctly', () => {
      mockOBR.isAvailable = false;
      expect(OBRService.isAvailable()).toBe(false);
    });

    it('should return null when loading character from token outside OBR', async () => {
      mockOBR.isAvailable = false;
      const char = await OBRService.loadCharacterFromToken('token-123');
      expect(char).toBeNull();
    });

    it('should fallback to local storage when calling loadCharacter without OBR', async () => {
      mockOBR.isAvailable = false;
      const fresh = generateRandomCharacter();
      await OBRService.saveCharacter(fresh);

      const loaded = await OBRService.loadCharacter();
      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe(fresh.name);
    });

    it('should return null for getSelectedToken when outside OBR', async () => {
      mockOBR.isAvailable = false;
      const selected = await OBRService.getSelectedToken();
      expect(selected).toBeNull();
    });

    it('should return empty list for getSceneCharacters when outside OBR', async () => {
      mockOBR.isAvailable = false;
      const chars = await OBRService.getSceneCharacters();
      expect(chars).toEqual([]);
    });

    it('should safely return no-op unsubscribers outside OBR', () => {
      mockOBR.isAvailable = false;
      const unsubSelect = OBRService.subscribeToSelection(() => {});
      expect(typeof unsubSelect).toBe('function');
      expect(() => unsubSelect()).not.toThrow();

      const unsubScene = OBRService.subscribeToSceneItems(() => {});
      expect(typeof unsubScene).toBe('function');
      expect(() => unsubScene()).not.toThrow();
    });

    it('should safely execute actions without error outside OBR', async () => {
      mockOBR.isAvailable = false;
      await expect(OBRService.selectToken('tok-1')).resolves.toBeUndefined();
      await expect(OBRService.unlinkToken('tok-1')).resolves.toBeUndefined();
      await expect(OBRService.notify('Test notification')).resolves.toBeUndefined();
    });
  });

  describe('Connected OBR Environment', () => {
    const mockCharacter = generateRandomCharacter();
    const METADATA_KEY = 'com.morkborg.character-sheet/character';

    beforeEach(() => {
      mockOBR.isAvailable = true;
    });

    it('should load character specifically from token metadata when OBR is available', async () => {
      mockOBR.scene.items.getItems.mockResolvedValue([
        {
          id: 'tok-1',
          name: 'Gorg Pawn',
          type: 'IMAGE',
          layer: 'CHARACTER',
          metadata: {
            [METADATA_KEY]: mockCharacter,
          },
        } as any,
      ]);

      const result = await OBRService.loadCharacterFromToken('tok-1');
      expect(result).not.toBeNull();
      expect(result?.name).toBe(mockCharacter.name);
      expect(mockOBR.scene.items.getItems).toHaveBeenCalledWith(['tok-1']);
    });

    it('should ignore multi-selections in getSelectedToken (selection.length > 1)', async () => {
      mockOBR.player.getSelection.mockResolvedValue(['tok-1', 'tok-2']);

      const selected = await OBRService.getSelectedToken();
      expect(selected).toBeNull();
    });

    it('should return single token in getSelectedToken when exactly 1 token is selected', async () => {
      mockOBR.player.getSelection.mockResolvedValue(['tok-1']);
      mockOBR.scene.items.getItems.mockResolvedValue([
        {
          id: 'tok-1',
          name: 'Gorg Pawn',
          type: 'IMAGE',
          layer: 'CHARACTER',
          metadata: {},
        } as any,
      ]);

      const selected = await OBRService.getSelectedToken();
      expect(selected).toEqual({
        id: 'tok-1',
        name: 'Gorg Pawn',
      });
    });

    it('should retrieve all scene characters with MÖRK BORG metadata', async () => {
      mockOBR.scene.items.getItems.mockImplementation(async (filter: any) => {
        const allItems = [
          {
            id: 'tok-1',
            name: 'Gorg',
            metadata: { [METADATA_KEY]: mockCharacter },
          },
          {
            id: 'tok-2',
            name: 'Empty Token',
            metadata: {},
          },
        ];
        if (typeof filter === 'function') {
          return allItems.filter(filter) as any;
        }
        return allItems as any;
      });

      const sceneChars = await OBRService.getSceneCharacters();
      expect(sceneChars.length).toBe(1);
      expect(sceneChars[0].id).toBe('tok-1');
      expect(sceneChars[0].character.name).toBe(mockCharacter.name);
    });

    it('should remove metadata when unlinking a token', async () => {
      let capturedDraft: any[] = [];
      mockOBR.scene.items.updateItems.mockImplementation(async (_ids: any, updateFn: any) => {
        const item = {
          id: 'tok-1',
          metadata: { [METADATA_KEY]: mockCharacter },
        };
        capturedDraft = [item];
        updateFn(capturedDraft);
      });

      await OBRService.unlinkToken('tok-1');
      expect(capturedDraft[0].metadata[METADATA_KEY]).toBeUndefined();
    });

    it('should select token and animate viewport bounds', async () => {
      await OBRService.selectToken('tok-1');
      expect(mockOBR.player.select).toHaveBeenCalledWith(['tok-1']);
      expect(mockOBR.viewport.animateToBounds).toHaveBeenCalled();
    });

    it('should display in-room notifications via OBR.notification.show', async () => {
      await OBRService.notify('Beware the Basilisk!');
      expect(mockOBR.notification.show).toHaveBeenCalledWith('Beware the Basilisk!');
    });
  });
});
