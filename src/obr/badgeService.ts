import OBR, { buildImage, Item } from '@owlbear-rodeo/sdk';
import { OBRService } from './obrService';

export const BADGE_METADATA_KEY = 'com.morkborg.character-sheet/badge';
export const BADGE_PARENT_KEY = 'com.morkborg.character-sheet/badgeParent';

export type ConditionBadgeType = 'broken' | 'infected' | 'starving' | 'dead';

export interface ConditionState {
  broken: boolean;
  infected: boolean;
  starving: boolean;
  dead: boolean;
}

/**
 * Returns the URL for a condition SVG badge.
 */
export function getBadgeUrl(type: ConditionBadgeType): string {
  if (typeof window !== 'undefined' && window.location) {
    try {
      const base = window.location.href.split('#')[0].split('?')[0];
      const dir = base.substring(0, base.lastIndexOf('/') + 1);
      return `${dir}badges/${type}.svg`;
    } catch {
      return `badges/${type}.svg`;
    }
  }
  return `badges/${type}.svg`;
}

/**
 * Resolves active condition types from a condition state.
 */
export function getActiveBadgeTypes(conditions: ConditionState): ConditionBadgeType[] {
  const types: ConditionBadgeType[] = [];
  if (conditions.dead) {
    types.push('dead');
  }
  if (conditions.broken && !conditions.dead) {
    types.push('broken');
  }
  if (conditions.infected) {
    types.push('infected');
  }
  if (conditions.starving) {
    types.push('starving');
  }
  return types;
}

export class BadgeService {
  /**
   * Synchronizes visual condition badges on a map token.
   * If OBR is offline, this function safely no-ops.
   */
  static async syncTokenConditionBadges(
    tokenId: string,
    conditions: ConditionState
  ): Promise<void> {
    if (!OBRService.isAvailable()) return;

    try {
      // 1. Fetch all items in the scene to find existing badges attached to this token
      const allItems = await OBR.scene.items.getItems();
      const existingBadges = allItems.filter(
        (item: Item) =>
          item.layer === 'ATTACHMENT' &&
          (item.attachedTo === tokenId || item.metadata[BADGE_PARENT_KEY] === tokenId) &&
          typeof item.metadata[BADGE_METADATA_KEY] === 'string'
      );

      const activeTypes = getActiveBadgeTypes(conditions);

      // Determine which existing badges should be removed
      const toDeleteIds: string[] = [];
      const keptBadgeTypes = new Set<ConditionBadgeType>();

      for (const badge of existingBadges) {
        const badgeType = badge.metadata[BADGE_METADATA_KEY] as ConditionBadgeType;
        if (!activeTypes.includes(badgeType) || keptBadgeTypes.has(badgeType)) {
          toDeleteIds.push(badge.id);
        } else {
          keptBadgeTypes.add(badgeType);
        }
      }

      if (toDeleteIds.length > 0) {
        await OBR.scene.items.deleteItems(toDeleteIds);
      }

      // Determine which new badges need to be created
      const typesToCreate = activeTypes.filter((type) => !keptBadgeTypes.has(type));
      if (typesToCreate.length === 0) return;

      // 2. Query token bounds and grid DPI to calculate attachment scale and placement
      const bounds = await OBR.scene.items.getItemBounds([tokenId]);
      let gridDpi = 150;
      try {
        gridDpi = await OBR.scene.grid.getDpi();
      } catch {
        gridDpi = 150;
      }

      const tokenWidth = bounds.width || 100;
      // Target badge width: ~30% of token width, clamped between 30 and 70
      const badgeTargetSize = Math.max(30, Math.min(70, tokenWidth * 0.32));
      const badgeDpi = (64 / badgeTargetSize) * gridDpi;

      // Position badges along top/bottom corners of the token
      const newBadges: Item[] = [];

      for (let i = 0; i < typesToCreate.length; i++) {
        const type = typesToCreate[i];
        const badgeUrl = getBadgeUrl(type);
        const badgeId = crypto.randomUUID();

        // Calculate offset position for this badge relative to bounds
        // Badges stagger from top-right towards the left
        const offsetX = bounds.max.x - badgeTargetSize * (i + 1);
        const offsetY = bounds.min.y - (badgeTargetSize * 0.2); // slight overhang

        const item = buildImage(
          {
            width: 64,
            height: 64,
            mime: 'image/svg+xml',
            url: badgeUrl,
          },
          {
            offset: { x: 0, y: 0 },
            dpi: badgeDpi,
          }
        )
          .id(badgeId)
          .name(`Condition: ${type.toUpperCase()}`)
          .attachedTo(tokenId)
          .layer('ATTACHMENT')
          .position({ x: offsetX, y: offsetY })
          .disableHit(true)
          .locked(true)
          .metadata({
            [BADGE_METADATA_KEY]: type,
            [BADGE_PARENT_KEY]: tokenId,
          })
          .build();

        newBadges.push(item);
      }

      if (newBadges.length > 0) {
        await OBR.scene.items.addItems(newBadges);
      }
    } catch (err) {
      console.warn('Failed to sync condition badges on token:', err);
    }
  }

  /**
   * Removes all condition badges attached to a token.
   */
  static async clearTokenBadges(tokenId: string): Promise<void> {
    if (!OBRService.isAvailable()) return;

    try {
      const allItems = await OBR.scene.items.getItems();
      const badgeIds = allItems
        .filter(
          (item: Item) =>
            item.layer === 'ATTACHMENT' &&
            (item.attachedTo === tokenId || item.metadata[BADGE_PARENT_KEY] === tokenId) &&
            typeof item.metadata[BADGE_METADATA_KEY] === 'string'
        )
        .map((item) => item.id);

      if (badgeIds.length > 0) {
        await OBR.scene.items.deleteItems(badgeIds);
      }
    } catch (err) {
      console.warn('Failed to clear token badges:', err);
    }
  }
}
