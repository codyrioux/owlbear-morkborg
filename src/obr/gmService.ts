import OBR from '@owlbear-rodeo/sdk';
import { CampaignDurationDie } from '../data';

export const GM_METADATA_KEY = 'com.morkborg.character-sheet/gm-state';
export const GM_BROADCAST_CHANNEL = 'com.morkborg.character-sheet/gm-events';

export interface TriggeredMisery {
  psalm: number;
  verse: number | string;
  title: string;
  text: string;
  timestamp: number;
}

export interface GMState {
  campaignDurationDie: CampaignDurationDie;
  triggeredMiseries: TriggeredMisery[];
  isWorldEnded: boolean;
  round: number;
  initiative: 'pcs' | 'enemies' | null;
  initiativeRoll?: number;
}

export const DEFAULT_GM_STATE: GMState = {
  campaignDurationDie: 'd100',
  triggeredMiseries: [],
  isWorldEnded: false,
  round: 1,
  initiative: null,
};

// Fallback in-memory and local storage cache for offline/standalone mode
let localGMState: GMState = (() => {
  try {
    const saved = localStorage.getItem(GM_METADATA_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_GM_STATE, ...parsed };
      }
    }
  } catch {
    // Ignore error
  }
  return { ...DEFAULT_GM_STATE };
})();

export class GMService {
  /**
   * Check if OBR is available
   */
  public static isAvailable(): boolean {
    return OBR.isAvailable;
  }

  /**
   * Get the current GM State from OBR room metadata or fallback storage
   */
  public static async getGMState(): Promise<GMState> {
    if (OBR.isAvailable) {
      try {
        const metadata = await OBR.room.getMetadata();
        if (metadata[GM_METADATA_KEY]) {
          const state = metadata[GM_METADATA_KEY] as GMState;
          localGMState = { ...DEFAULT_GM_STATE, ...state };
          return localGMState;
        }
      } catch (err) {
        console.warn('Could not read GM state from room metadata:', err);
      }
    }
    return localGMState;
  }

  /**
   * Update GM State and persist to OBR room metadata and localStorage
   */
  public static async updateGMState(
    updater: Partial<GMState> | ((prev: GMState) => GMState)
  ): Promise<GMState> {
    const current = await this.getGMState();
    const updated: GMState = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    localGMState = updated;

    try {
      localStorage.setItem(GM_METADATA_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }

    if (OBR.isAvailable) {
      try {
        await OBR.room.setMetadata({
          [GM_METADATA_KEY]: updated,
        });
      } catch (err) {
        console.warn('Could not update GM state in room metadata:', err);
      }
    }

    return updated;
  }

  /**
   * Subscribe to GM State changes in OBR room metadata
   */
  public static subscribeToGMState(callback: (state: GMState) => void): () => void {
    if (!OBR.isAvailable) {
      return () => {};
    }

    return OBR.room.onMetadataChange((metadata) => {
      if (metadata[GM_METADATA_KEY]) {
        const state = metadata[GM_METADATA_KEY] as GMState;
        localGMState = { ...DEFAULT_GM_STATE, ...state };
        callback(localGMState);
      }
    });
  }

  /**
   * Broadcast a GM event (e.g. Misery revealed, turn changed, monster prompt)
   */
  public static async broadcastGMEvent(event: {
    type: string;
    payload: any;
  }): Promise<void> {
    if (OBR.isAvailable) {
      try {
        await OBR.broadcast.sendMessage(GM_BROADCAST_CHANNEL, event, { destination: 'ALL' });
      } catch (err) {
        console.warn('Failed to broadcast GM event:', err);
      }
    }
  }

  /**
   * Subscribe to GM event broadcasts
   */
  public static subscribeToGMEvents(callback: (event: { type: string; payload: any }) => void): () => void {
    if (!OBR.isAvailable) {
      return () => {};
    }

    return OBR.broadcast.onMessage(GM_BROADCAST_CHANNEL, (msg) => {
      if (msg.data && typeof msg.data === 'object') {
        callback(msg.data as { type: string; payload: any });
      }
    });
  }
}
