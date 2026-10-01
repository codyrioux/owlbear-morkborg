import OBR from '@owlbear-rodeo/sdk';
import { BroadcastPayload, Character, RollResult } from '../types/morkborg';
import { loadCharacterFromStorage, saveCharacterToStorage } from '../utils/storage';

const METADATA_KEY = 'com.morkborg.character-sheet/character';
const BROADCAST_CHANNEL = 'com.morkborg.character-sheet/roll';
const CONTEXT_MENU_ID = 'com.morkborg.character-sheet/context-menu';

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
          // Accept character layer tokens, tokens with character metadata, or images
          if (item.layer === 'CHARACTER' || item.metadata[METADATA_KEY] || item.type === 'IMAGE') {
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
    callback: (selection: { id: string; name: string; character: Character | null } | null) => void
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
          if (item.layer === 'CHARACTER' || item.metadata[METADATA_KEY] || item.type === 'IMAGE') {
            const character = (item.metadata[METADATA_KEY] as Character) || null;
            callback({
              id: item.id,
              name: item.name || 'Map Token',
              character,
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
   * Subscribe to scene item changes (for roster and token lifecycle monitoring)
   */
  public static subscribeToSceneItems(
    callback: (sceneData: {
      characters: Array<{ id: string; name: string; character: Character }>;
      itemIds: Set<string>;
    }) => void
  ): () => void {
    if (!OBR.isAvailable) return () => {};

    return OBR.scene.items.onChange((items) => {
      const charItems = items.filter((item) => Boolean(item.metadata && item.metadata[METADATA_KEY]));
      const itemIds = new Set(items.map((i) => i.id));
      callback({
        characters: charItems.map((item) => ({
          id: item.id,
          name: item.name || 'Map Token',
          character: item.metadata[METADATA_KEY] as Character,
        })),
        itemIds,
      });
    });
  }

  /**
   * Select a token on the map and center the viewport on it if possible
   */
  public static async selectToken(tokenId: string): Promise<void> {
    if (!OBR.isAvailable) return;
    try {
      await OBR.player.select([tokenId]);
      const bounds = await OBR.scene.items.getItemBounds([tokenId]);
      if (bounds) {
        await OBR.viewport.animateToBounds(bounds);
      }
    } catch (err) {
      console.warn('Failed to select/center token:', err);
    }
  }

  /**
   * Remove character metadata from a token
   */
  public static async unlinkToken(tokenId: string): Promise<void> {
    if (!OBR.isAvailable) return;
    try {
      await OBR.scene.items.updateItems([tokenId], (items) => {
        if (items[0]) {
          delete items[0].metadata[METADATA_KEY];
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
}
