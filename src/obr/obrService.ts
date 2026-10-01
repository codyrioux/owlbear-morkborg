import OBR from '@owlbear-rodeo/sdk';
import { BroadcastPayload, Character, RollResult } from '../types/morkborg';
import { loadCharacterFromStorage, saveCharacterToStorage } from '../utils/storage';
import { MonsterTokenData, MONSTER_METADATA_KEY } from '../utils/combatRules';

export const METADATA_KEY = 'com.morkborg.character-sheet/character';
export { MONSTER_METADATA_KEY };
const BROADCAST_CHANNEL = 'com.morkborg.character-sheet/roll';
const CONTEXT_MENU_ID = 'com.morkborg.character-sheet/context-menu';

export interface SceneMonsterItem {
  id: string;
  name: string;
  monster: MonsterTokenData;
}

export class OBRService {
  private static isInitialized = false;

  /**
   * Check if running inside Owlbear Rodeo iframe
   */
  public static isAvailable(): boolean {
    return OBR.isAvailable;
  }

  /**
   * Initialize SDK and register listeners
   */
  public static async init(onReady?: () => void): Promise<void> {
    if (this.isInitialized) {
      if (onReady) onReady();
      return;
    }

    if (OBR.isAvailable) {
      OBR.onReady(async () => {
        this.isInitialized = true;
        this.setupContextMenu();
        await this.setActionWidth(525);
        if (onReady) onReady();
      });
    } else {
      this.isInitialized = true;
      if (onReady) onReady();
    }
  }

  /**
   * Set up token right-click context menu
   */
  private static setupContextMenu(): void {
    if (!OBR.isAvailable) return;

    try {
      OBR.contextMenu.create({
        id: CONTEXT_MENU_ID,
        icons: [
          {
            icon: new URL('icon.svg', window.location.href).toString(),
            label: 'MÖRK BORG Sheet',
            filter: {
              every: [
                { key: 'type', value: 'IMAGE' },
                { key: 'layer', value: 'CHARACTER' },
              ],
            },
          },
        ],
        onClick: async (context) => {
          const selectedItems = context.items;
          if (selectedItems.length > 0) {
            // Explicitly select the token in OBR
            await OBR.player.select([selectedItems[0].id]);
            // Open the action popover if not already open
            const isOpen = await OBR.action.isOpen();
            if (!isOpen) {
              await OBR.action.open();
            }
          }
        },
      });
    } catch {
      // Context menu might already be registered in HMR
    }
  }

  /**
   * Broadcast roll result to all players in the room
   */
  public static async broadcastRoll(roll: RollResult, characterName: string): Promise<void> {
    if (OBR.isAvailable) {
      try {
        const playerName = await OBR.player.getName();
        const payload: BroadcastPayload = {
          sourcePlayer: playerName || 'Player',
          characterName,
          roll,
        };

        await OBR.broadcast.sendMessage(BROADCAST_CHANNEL, payload, { destination: 'ALL' });
        
        // Show brief notification
        const statusText = roll.isCrit ? ' [CRIT!]' : roll.isFumble ? ' [FUMBLE!]' : '';
        await OBR.notification.show(`${characterName} rolled ${roll.title}: ${roll.total}${statusText}`);
      } catch (err) {
        console.warn('Failed to broadcast roll to OBR room:', err);
      }
    }
  }

  /**
   * Subscribe to room roll broadcasts
   */
  public static subscribeToRolls(callback: (payload: BroadcastPayload) => void): () => void {
    if (!OBR.isAvailable) {
      return () => {};
    }

    return OBR.broadcast.onMessage(BROADCAST_CHANNEL, (event) => {
      if (event.data && typeof event.data === 'object') {
        callback(event.data as BroadcastPayload);
      }
    });
  }

  /**
   * Save character to local storage and optionally token metadata
   */
  public static async saveCharacter(character: Character, tokenId?: string): Promise<void> {
    // Always persist to localStorage
    saveCharacterToStorage(character);

    // If attached to a specific token in OBR
    if (OBR.isAvailable && tokenId) {
      try {
        await OBR.scene.items.updateItems([tokenId], (items) => {
          if (items[0]) {
            items[0].metadata[METADATA_KEY] = character;
            if (items[0].metadata[MONSTER_METADATA_KEY]) {
              delete items[0].metadata[MONSTER_METADATA_KEY];
            }
          }
        });
      } catch (err) {
        console.warn('Could not save character to token metadata:', err);
      }
    }
  }

  /**
   * Load character specifically from a token's metadata (does not fallback to localStorage)
   */
  public static async loadCharacterFromToken(tokenId: string): Promise<Character | null> {
    if (!OBR.isAvailable || !tokenId) return null;
    try {
      const items = await OBR.scene.items.getItems([tokenId]);
      if (items[0] && items[0].metadata[METADATA_KEY]) {
        return items[0].metadata[METADATA_KEY] as Character;
      }
    } catch (err) {
      console.warn('Could not load character from token:', err);
    }
    return null;
  }

  /**
   * Save monster to token metadata
   */
  public static async saveMonster(monster: MonsterTokenData, tokenId: string): Promise<void> {
    if (OBR.isAvailable && tokenId) {
      try {
        await OBR.scene.items.updateItems([tokenId], (items) => {
          if (items[0]) {
            items[0].metadata[MONSTER_METADATA_KEY] = monster;
            if (items[0].metadata[METADATA_KEY]) {
              delete items[0].metadata[METADATA_KEY];
            }
          }
        });
      } catch (err) {
        console.warn('Could not save monster to token metadata:', err);
      }
    }
  }

  /**
   * Load monster specifically from a token's metadata
   */
  public static async loadMonsterFromToken(tokenId: string): Promise<MonsterTokenData | null> {
    if (!OBR.isAvailable || !tokenId) return null;
    try {
      const items = await OBR.scene.items.getItems([tokenId]);
      if (items[0] && items[0].metadata[MONSTER_METADATA_KEY]) {
        return items[0].metadata[MONSTER_METADATA_KEY] as MonsterTokenData;
      }
    } catch (err) {
      console.warn('Could not load monster from token:', err);
    }
    return null;
  }

  /**
   * Remove monster metadata from a token
   */
  public static async unlinkMonsterToken(tokenId: string): Promise<void> {
    if (!OBR.isAvailable) return;
    try {
      await OBR.scene.items.updateItems([tokenId], (items) => {
        if (items[0] && items[0].metadata) {
          delete items[0].metadata[MONSTER_METADATA_KEY];
        }
      });
    } catch (err) {
      console.warn('Could not unlink monster metadata:', err);
    }
  }

  /**
   * Get all tokens in the scene that have MÖRK BORG monster metadata
   */
  public static async getSceneMonsters(): Promise<Array<{ id: string; name: string; monster: MonsterTokenData }>> {
    if (!OBR.isAvailable) return [];
    try {
      const items = await OBR.scene.items.getItems((item) => Boolean(item.metadata && item.metadata[MONSTER_METADATA_KEY]));
      return items.map((item) => ({
        id: item.id,
        name: item.name || 'Map Token',
        monster: item.metadata[MONSTER_METADATA_KEY] as MonsterTokenData,
      }));
    } catch (err) {
      console.warn('Failed to get scene monsters:', err);
      return [];
    }
  }

  /**
   * Load character from token or local storage
   */
  public static async loadCharacter(tokenId?: string): Promise<Character | null> {
    if (OBR.isAvailable && tokenId) {
      const tokenChar = await this.loadCharacterFromToken(tokenId);
      if (tokenChar) return tokenChar;
    }

    return loadCharacterFromStorage();
  }

  /**
   * Get currently selected single token from the OBR scene.
   * Ignores multi-selections (selection.length > 1).
   */
  public static async getSelectedToken(): Promise<{ id: string; name: string } | null> {
    if (!OBR.isAvailable) return null;
    try {
      const selection = await OBR.player.getSelection();
      if (selection && selection.length === 1) {
        const items = await OBR.scene.items.getItems(selection);
        if (items.length > 0) {
          const item = items[0];
          // Accept character layer tokens, tokens with character/monster metadata, or images
          if (
            item.layer === 'CHARACTER' ||
            item.metadata[METADATA_KEY] ||
            item.metadata[MONSTER_METADATA_KEY] ||
            item.type === 'IMAGE'
          ) {
            return {
              id: item.id,
              name: item.name || 'Map Token',
            };
          }
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Subscribe to single token selection changes on the map.
   * Ignores multi-selections (selection.length > 1) and empty canvas selections.
   */
  public static subscribeToSelection(
    callback: (selection: {
      id: string;
      name: string;
      character: Character | null;
      monster?: MonsterTokenData | null;
    } | null) => void
  ): () => void {
    if (!OBR.isAvailable) {
      return () => {};
    }

    return OBR.player.onChange(async (player) => {
      const selection = player.selection;
      // Ignore multi-selections or empty selections
      if (!selection || selection.length !== 1) {
        return;
      }

      const tokenId = selection[0];
      try {
        const items = await OBR.scene.items.getItems([tokenId]);
        if (items.length > 0) {
          const item = items[0];
          if (
            item.layer === 'CHARACTER' ||
            item.metadata[METADATA_KEY] ||
            item.metadata[MONSTER_METADATA_KEY] ||
            item.type === 'IMAGE'
          ) {
            const character = (item.metadata[METADATA_KEY] as Character) || null;
            const monster = (item.metadata[MONSTER_METADATA_KEY] as MonsterTokenData) || null;
            callback({
              id: item.id,
              name: item.name || 'Map Token',
              character,
              monster,
            });
          }
        }
      } catch (err) {
        console.warn('Error handling selection change:', err);
      }
    });
  }

  /**
   * Get all tokens in the scene that have MÖRK BORG character metadata
   */
  public static async getSceneCharacters(): Promise<Array<{ id: string; name: string; character: Character }>> {
    if (!OBR.isAvailable) return [];
    try {
      const items = await OBR.scene.items.getItems((item) => Boolean(item.metadata && item.metadata[METADATA_KEY]));
      return items.map((item) => ({
        id: item.id,
        name: item.name || 'Map Token',
        character: item.metadata[METADATA_KEY] as Character,
      }));
    } catch (err) {
      console.warn('Failed to get scene characters:', err);
      return [];
    }
  }

  /**
   * Subscribe to scene item changes (for roster, monsters, and token lifecycle monitoring)
   */
  public static subscribeToSceneItems(
    callback: (sceneData: {
      characters: Array<{ id: string; name: string; character: Character }>;
      monsters: Array<{ id: string; name: string; monster: MonsterTokenData }>;
      itemIds: Set<string>;
    }) => void
  ): () => void {
    if (!OBR.isAvailable) return () => {};

    return OBR.scene.items.onChange((items) => {
      const charItems = items.filter((item) => Boolean(item.metadata && item.metadata[METADATA_KEY]));
      const monsterItems = items.filter((item) => Boolean(item.metadata && item.metadata[MONSTER_METADATA_KEY]));
      const itemIds = new Set(items.map((i) => i.id));
      callback({
        characters: charItems.map((item) => ({
          id: item.id,
          name: item.name || 'Map Token',
          character: item.metadata[METADATA_KEY] as Character,
        })),
        monsters: monsterItems.map((item) => ({
          id: item.id,
          name: item.name || 'Map Token',
          monster: item.metadata[MONSTER_METADATA_KEY] as MonsterTokenData,
        })),
        itemIds,
      });
    });
  }

  /**
   * Select a token on the map and center the viewport on it with comfortable tactical zoom
   */
  public static async selectToken(tokenId: string): Promise<void> {
    if (!OBR.isAvailable) return;
    try {
      await OBR.player.select([tokenId]);
      const bounds = await OBR.scene.items.getItemBounds([tokenId]);
      if (bounds) {
        // Expand bounds around token center to provide a comfortable tactical zoom instead of an extreme close-up
        const targetWidth = Math.max(bounds.width * 6, 2400);
        const targetHeight = Math.max(bounds.height * 6, 1600);
        const halfWidth = targetWidth / 2;
        const halfHeight = targetHeight / 2;
        await OBR.viewport.animateToBounds({
          min: { x: bounds.center.x - halfWidth, y: bounds.center.y - halfHeight },
          max: { x: bounds.center.x + halfWidth, y: bounds.center.y + halfHeight },
          width: targetWidth,
          height: targetHeight,
          center: bounds.center,
        });
      }
    } catch (err) {
      console.warn('Failed to select/center token:', err);
    }
  }

  /**
   * Remove character or monster metadata from a token
   */
  public static async unlinkToken(tokenId: string): Promise<void> {
    if (!OBR.isAvailable) return;
    try {
      await OBR.scene.items.updateItems([tokenId], (items) => {
        if (items[0] && items[0].metadata) {
          delete items[0].metadata[METADATA_KEY];
          delete items[0].metadata[MONSTER_METADATA_KEY];
        }
      });
    } catch (err) {
      console.warn('Could not unlink token metadata:', err);
    }
  }

  /**
   * Display an in-room OBR notification toast
   */
  public static async notify(message: string): Promise<void> {
    if (!OBR.isAvailable) return;
    try {
      await OBR.notification.show(message);
    } catch {
      // Ignore
    }
  }

  /**
   * Dynamically adjust the action popover width in Owlbear Rodeo
   */
  public static async setActionWidth(width: number): Promise<void> {
    if (!OBR.isAvailable) return;
    try {
      await OBR.action.setWidth(width);
    } catch (err) {
      console.warn('Could not set action width in OBR:', err);
    }
  }

  /**
   * Get the current action popover width from Owlbear Rodeo
   */
  public static async getActionWidth(): Promise<number | undefined> {
    if (!OBR.isAvailable) return undefined;
    try {
      return await OBR.action.getWidth();
    } catch {
      return undefined;
    }
  }

  /**
   * Dynamically adjust the action popover height in Owlbear Rodeo
   */
  public static async setActionHeight(height: number): Promise<void> {
    if (!OBR.isAvailable) return;
    try {
      await OBR.action.setHeight(height);
    } catch (err) {
      console.warn('Could not set action height in OBR:', err);
    }
  }

  /**
   * Get the current action popover height from Owlbear Rodeo
   */
  public static async getActionHeight(): Promise<number | undefined> {
    if (!OBR.isAvailable) return undefined;
    try {
      return await OBR.action.getHeight();
    } catch {
      return undefined;
    }
  }

  /**
   * Get the current player role ('GM' or 'PLAYER').
   * Defaults to 'GM' when running in standalone mode outside OBR so all tools can be tested.
   */
  public static async getUserRole(): Promise<'GM' | 'PLAYER'> {
    if (!OBR.isAvailable || !OBR.player || typeof OBR.player.getRole !== 'function') {
      return 'GM';
    }
    try {
      return await OBR.player.getRole();
    } catch {
      return 'GM';
    }
  }

  /**
   * Open the GM console in an independent floating popover window
   */
  public static async openFloatingGMConsole(): Promise<void> {
    if (!OBR.isAvailable) return;
    try {
      await OBR.popover.open({
        id: 'com.morkborg.character-sheet/gm-popover',
        url: new URL('index.html?view=gm', window.location.href).toString(),
        width: 720,
        height: 680,
        disableClickAway: true,
      });
    } catch (err) {
      console.warn('Could not open floating GM popover:', err);
    }
  }

  /**
   * Get the current player's ID
   */
  public static async getPlayerId(): Promise<string> {
    if (!OBR.isAvailable || !OBR.player || typeof OBR.player.getId !== 'function') {
      return 'standalone-player';
    }
    try {
      return await OBR.player.getId();
    } catch {
      return 'standalone-player';
    }
  }

  /**
   * Get list of all connected players in the OBR room
   */
  public static async getPartyPlayers(): Promise<
    Array<{ id: string; name: string; role: 'GM' | 'PLAYER'; color?: string }>
  > {
    if (!OBR.isAvailable || !OBR.party || typeof OBR.party.getPlayers !== 'function') {
      return [{ id: 'standalone-player', name: 'Local Scvm', role: 'GM' }];
    }
    try {
      const players = await OBR.party.getPlayers();
      return players.map((p) => ({
        id: p.id,
        name: p.name || 'Anonymous Scvm',
        role: p.role,
        color: p.color,
      }));
    } catch {
      return [{ id: 'standalone-player', name: 'Local Scvm', role: 'GM' }];
    }
  }
}
