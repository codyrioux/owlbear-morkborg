import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
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
    getRole: vi.fn().mockResolvedValue('PLAYER'),
    getId: vi.fn().mockResolvedValue('test-player-id'),
  },
  party: {
    getPlayers: vi.fn().mockResolvedValue([
      { id: 'test-player-id', name: 'Test Player', role: 'PLAYER' },
    ]),
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
    setWidth: vi.fn().mockResolvedValue(undefined),
    getWidth: vi.fn().mockResolvedValue(525),
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

  afterEach(() => {
    mockOBR.isAvailable = false;
  });

  afterAll(() => {
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

    it('should default to GM role outside OBR environment', async () => {
      mockOBR.isAvailable = false;
      const role = await OBRService.getUserRole();
      expect(role).toBe('GM');
    });

    it('should return standalone player ID outside OBR environment', async () => {
      mockOBR.isAvailable = false;
      const id = await OBRService.getPlayerId();
      expect(id).toBe('standalone-player');
    });

    it('should return standalone default party list outside OBR environment', async () => {
      mockOBR.isAvailable = false;
      const party = await OBRService.getPartyPlayers();
      expect(party).toEqual([{ id: 'standalone-player', name: 'Local Scvm', role: 'GM' }]);
    });

    it('should return default player name outside OBR environment', async () => {
      mockOBR.isAvailable = false;
      const name = await OBRService.getPlayerName();
      expect(name).toBe('Local Scvm');
    });

    it('should return no-op unsubscribe function for party subscription outside OBR environment', () => {
      mockOBR.isAvailable = false;
      const unsub = OBRService.subscribeToParty(() => {});
      expect(typeof unsub).toBe('function');
      expect(() => unsub()).not.toThrow();
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

    it('should select token and animate viewport bounds with reduced zoom padding', async () => {
      mockOBR.scene.items.getItemBounds.mockResolvedValue({
        min: { x: 0, y: 0 },
        max: { x: 100, y: 100 },
        width: 100,
        height: 100,
        center: { x: 50, y: 50 },
      });
      await OBRService.selectToken('tok-1');
      expect(mockOBR.player.select).toHaveBeenCalledWith(['tok-1']);
      expect(mockOBR.viewport.animateToBounds).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 2400,
          height: 1600,
          center: { x: 50, y: 50 },
        })
      );
    });

    it('should set action width via OBR.action.setWidth', async () => {
      await OBRService.setActionWidth(525);
      expect(mockOBR.action.setWidth).toHaveBeenCalledWith(525);
    });

    it('should display in-room notifications via OBR.notification.show', async () => {
      await OBRService.notify('Beware the Basilisk!');
      expect(mockOBR.notification.show).toHaveBeenCalledWith('Beware the Basilisk!');
    });

    it('should return player role from OBR.player.getRole in connected mode', async () => {
      mockOBR.player.getRole.mockResolvedValue('GM');
      const roleGM = await OBRService.getUserRole();
      expect(roleGM).toBe('GM');

      mockOBR.player.getRole.mockResolvedValue('PLAYER');
      const rolePlayer = await OBRService.getUserRole();
      expect(rolePlayer).toBe('PLAYER');
    });

    it('should return player ID from OBR.player.getId in connected mode', async () => {
      const id = await OBRService.getPlayerId();
      expect(id).toBe('test-player-id');
    });

    it('should return connected players from OBR.party.getPlayers in connected mode', async () => {
      const party = await OBRService.getPartyPlayers();
      expect(party).toEqual([{ id: 'test-player-id', name: 'Test Player', role: 'PLAYER', color: undefined }]);
    });

    it('should save, load, unlink and list monsters on tokens in connected mode', async () => {
      const monsterData = {
        id: 'tok-monster-1',
        monsterId: 'goblin',
        name: 'Seth, Goblin',
        hp: { current: 5, max: 5 },
        morale: 7 as const,
        armorTier: 0,
        damageReduction: '0',
        attacks: [{ name: 'Knife', damageDie: 'd4' }],
        specialRules: ['Cursed'],
        bounties: { silver: '10' },
      };

      // saveMonster
      await OBRService.saveMonster(monsterData, 'tok-monster-1');
      expect(mockOBR.scene.items.updateItems).toHaveBeenCalled();

      // loadMonsterFromToken
      mockOBR.scene.items.getItems.mockResolvedValueOnce([
        {
          id: 'tok-monster-1',
          name: 'Goblin Token',
          metadata: { 'com.morkborg.character-sheet/monster': monsterData },
        },
      ]);
      const loaded = await OBRService.loadMonsterFromToken('tok-monster-1');
      expect(loaded).toEqual(monsterData);

      // getSceneMonsters
      mockOBR.scene.items.getItems.mockImplementationOnce(async (predicate?: any) => {
        const item = {
          id: 'tok-monster-1',
          name: 'Goblin Token',
          metadata: { 'com.morkborg.character-sheet/monster': monsterData },
        };
        if (typeof predicate === 'function') {
          return predicate(item) ? [item] : [];
        }
        return [item];
      });
      const sceneMonsters = await OBRService.getSceneMonsters();
      expect(sceneMonsters).toHaveLength(1);
      expect(sceneMonsters[0].monster.name).toBe('Seth, Goblin');

      // unlinkMonsterToken
      await OBRService.unlinkMonsterToken('tok-monster-1');
      expect(mockOBR.scene.items.updateItems).toHaveBeenCalled();
    });

    it('should return player name from OBR.player.getName in connected mode', async () => {
      const name = await OBRService.getPlayerName();
      expect(name).toBe('Test Player');
    });

    it('should subscribe to party updates via OBR.party.onChange in connected mode', () => {
      let callbackInvoked = false;
      const fakeUnsub = vi.fn();
      mockOBR.party.onChange.mockImplementationOnce((fn: any) => {
        fn([{ id: 'player-1', name: 'Scum 1', role: 'PLAYER' }]);
        return fakeUnsub;
      });

      const unsub = OBRService.subscribeToParty((players) => {
        callbackInvoked = true;
        expect(players).toHaveLength(1);
        expect(players[0].name).toBe('Scum 1');
      });

      expect(callbackInvoked).toBe(true);
      unsub();
      expect(fakeUnsub).toHaveBeenCalled();
    });
  });

  describe('Character Sheet Ownership & Lock Permissions', () => {
    const calculatePermissions = (
      character: { owner?: { id: string; name: string }; isLocked?: boolean },
      currentUserId: string,
      userRole: 'GM' | 'PLAYER'
    ) => {
      const isOwner = Boolean(character.owner?.id && character.owner.id === currentUserId);
      const isGM = userRole === 'GM';
      const isLocked = Boolean(character.isLocked);
      const isReadOnly = isLocked && !isOwner && !isGM;
      return { isOwner, isGM, isLocked, isReadOnly };
    };

    it('should allow editing when sheet is unlocked, even for non-owners', () => {
      const char = { owner: { id: 'player-1', name: 'Alice' }, isLocked: false };
      const { isReadOnly, isOwner, isGM } = calculatePermissions(char, 'player-2', 'PLAYER');
      expect(isOwner).toBe(false);
      expect(isGM).toBe(false);
      expect(isReadOnly).toBe(false);
    });

    it('should make sheet read-only for non-owner player when sheet is locked', () => {
      const char = { owner: { id: 'player-1', name: 'Alice' }, isLocked: true };
      const { isReadOnly, isOwner, isGM } = calculatePermissions(char, 'player-2', 'PLAYER');
      expect(isOwner).toBe(false);
      expect(isGM).toBe(false);
      expect(isReadOnly).toBe(true);
    });

    it('should always allow owning player to edit, even when sheet is locked', () => {
      const char = { owner: { id: 'player-1', name: 'Alice' }, isLocked: true };
      const { isReadOnly, isOwner, isGM } = calculatePermissions(char, 'player-1', 'PLAYER');
      expect(isOwner).toBe(true);
      expect(isGM).toBe(false);
      expect(isReadOnly).toBe(false);
    });

    it('should always allow GM to edit, even when sheet is locked by another player', () => {
      const char = { owner: { id: 'player-1', name: 'Alice' }, isLocked: true };
      const { isReadOnly, isOwner, isGM } = calculatePermissions(char, 'gm-player-id', 'GM');
      expect(isOwner).toBe(false);
      expect(isGM).toBe(true);
      expect(isReadOnly).toBe(false);
    });

    it('should allow editing on unclaimed unlocked sheets for anyone', () => {
      const char = { isLocked: false };
      const { isReadOnly } = calculatePermissions(char, 'player-2', 'PLAYER');
      expect(isReadOnly).toBe(false);
    });
  });
});
