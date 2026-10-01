import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getActiveBadgeTypes,
  getBadgeUrl,
  BADGE_METADATA_KEY,
  BADGE_PARENT_KEY,
} from './badgeService';

// Setup global window mock
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { href: 'http://localhost/owlbear-morkborg/' },
  };
}

const mockOBR = {
  isAvailable: false,
  scene: {
    items: {
      getItems: vi.fn().mockResolvedValue([]),
      getItemBounds: vi.fn().mockResolvedValue({
        min: { x: 0, y: 0 },
        max: { x: 100, y: 100 },
        width: 100,
        height: 100,
        center: { x: 50, y: 50 },
      }),
      addItems: vi.fn().mockResolvedValue(undefined),
      deleteItems: vi.fn().mockResolvedValue(undefined),
      updateItems: vi.fn().mockResolvedValue(undefined),
    },
    grid: {
      getDpi: vi.fn().mockResolvedValue(150),
    },
  },
};

vi.mock('@owlbear-rodeo/sdk', () => {
  return {
    default: mockOBR,
    ...mockOBR,
    buildImage: vi.fn().mockImplementation((content, grid) => {
      const item: any = {
        type: 'IMAGE',
        image: content,
        grid,
        metadata: {},
      };
      const builder = {
        id: (id: string) => { item.id = id; return builder; },
        name: (name: string) => { item.name = name; return builder; },
        attachedTo: (p: string) => { item.attachedTo = p; return builder; },
        layer: (l: string) => { item.layer = l; return builder; },
        position: (pos: any) => { item.position = pos; return builder; },
        disableHit: (dh: boolean) => { item.disableHit = dh; return builder; },
        locked: (l: boolean) => { item.locked = l; return builder; },
        metadata: (meta: any) => { item.metadata = { ...item.metadata, ...meta }; return builder; },
        build: () => item,
      };
      return builder;
    }),
  };
});

import { BadgeService } from './badgeService';

describe('BadgeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOBR.isAvailable = false;
  });

  describe('Condition resolution & URLs', () => {
    it('should resolve active badge types according to condition priority', () => {
      expect(
        getActiveBadgeTypes({ broken: true, infected: false, starving: false, dead: false })
      ).toEqual(['broken']);

      // Dead takes precedence over broken
      expect(
        getActiveBadgeTypes({ broken: true, infected: false, starving: false, dead: true })
      ).toEqual(['dead']);

      expect(
        getActiveBadgeTypes({ broken: false, infected: true, starving: true, dead: false })
      ).toEqual(['infected', 'starving']);

      expect(
        getActiveBadgeTypes({ broken: true, infected: true, starving: true, dead: false })
      ).toEqual(['broken', 'infected', 'starving']);

      expect(
        getActiveBadgeTypes({ broken: false, infected: false, starving: false, dead: false })
      ).toEqual([]);
    });

    it('should generate valid badge URLs pointing to public/badges', () => {
      expect(getBadgeUrl('broken')).toContain('badges/broken.svg');
      expect(getBadgeUrl('infected')).toContain('badges/infected.svg');
      expect(getBadgeUrl('starving')).toContain('badges/starving.svg');
      expect(getBadgeUrl('dead')).toContain('badges/dead.svg');
    });
  });

  describe('OBR scene attachment integration', () => {
    it('safely does nothing when OBR is offline', async () => {
      mockOBR.isAvailable = false;
      await BadgeService.syncTokenConditionBadges('token-1', {
        broken: true,
        infected: false,
        starving: false,
        dead: false,
      });

      expect(mockOBR.scene.items.getItems).not.toHaveBeenCalled();
      expect(mockOBR.scene.items.addItems).not.toHaveBeenCalled();
    });

    it('attaches new badge when token is broken and OBR is available', async () => {
      mockOBR.isAvailable = true;
      mockOBR.scene.items.getItems.mockResolvedValue([]);

      await BadgeService.syncTokenConditionBadges('token-1', {
        broken: true,
        infected: false,
        starving: false,
        dead: false,
      });

      expect(mockOBR.scene.items.addItems).toHaveBeenCalledTimes(1);
      const added = mockOBR.scene.items.addItems.mock.calls[0][0];
      expect(added.length).toBe(1);
      expect(added[0].layer).toBe('ATTACHMENT');
      expect(added[0].attachedTo).toBe('token-1');
      expect(added[0].disableHit).toBe(true);
      expect(added[0].locked).toBe(true);
      expect(added[0].metadata[BADGE_METADATA_KEY]).toBe('broken');
      expect(added[0].metadata[BADGE_PARENT_KEY]).toBe('token-1');
    });

    it('removes outdated badges when conditions are cleared', async () => {
      mockOBR.isAvailable = true;
      const existingBadge = {
        id: 'badge-old-broken',
        layer: 'ATTACHMENT',
        attachedTo: 'token-1',
        metadata: {
          [BADGE_METADATA_KEY]: 'broken',
          [BADGE_PARENT_KEY]: 'token-1',
        },
      };
      mockOBR.scene.items.getItems.mockResolvedValue([existingBadge]);

      // Conditions cleared
      await BadgeService.syncTokenConditionBadges('token-1', {
        broken: false,
        infected: false,
        starving: false,
        dead: false,
      });

      expect(mockOBR.scene.items.deleteItems).toHaveBeenCalledWith(['badge-old-broken']);
      expect(mockOBR.scene.items.addItems).not.toHaveBeenCalled();
    });

    it('clears all badges attached to a token with clearTokenBadges', async () => {
      mockOBR.isAvailable = true;
      const badges = [
        {
          id: 'b1',
          layer: 'ATTACHMENT',
          attachedTo: 'token-1',
          metadata: { [BADGE_METADATA_KEY]: 'infected', [BADGE_PARENT_KEY]: 'token-1' },
        },
        {
          id: 'b2',
          layer: 'ATTACHMENT',
          attachedTo: 'token-1',
          metadata: { [BADGE_METADATA_KEY]: 'starving', [BADGE_PARENT_KEY]: 'token-1' },
        },
        {
          id: 'other-token-item',
          layer: 'ATTACHMENT',
          attachedTo: 'token-2',
          metadata: { [BADGE_METADATA_KEY]: 'broken', [BADGE_PARENT_KEY]: 'token-2' },
        },
      ];
      mockOBR.scene.items.getItems.mockResolvedValue(badges);

      await BadgeService.clearTokenBadges('token-1');

      expect(mockOBR.scene.items.deleteItems).toHaveBeenCalledWith(['b1', 'b2']);
    });
  });
});
