import { getMiseries, CampaignDurationDie } from '../data';
import { rollDie } from './dice';
import { GMState, TriggeredMisery } from '../obr/gmService';

export function getDieSides(die: CampaignDurationDie): number {
  switch (die) {
    case 'd100': return 100;
    case 'd20': return 20;
    case 'd10': return 10;
    case 'd6': return 6;
    case 'd4': return 4;
    case 'd2': return 2;
    default: return 100;
  }
}

/**
 * Executes a Dawn Roll against the active campaign duration die.
 * If 1 is rolled, a new unique Misery is triggered.
 * The 7th Misery is always Psalm VII: The Last (7:7).
 */
export function rollDawnCheck(currentState: GMState): {
  rolledOne: boolean;
  dieRoll: number;
  durationDie: CampaignDurationDie;
  newMisery?: TriggeredMisery;
  isWorldEnded: boolean;
  updatedState: GMState;
} {
  const durationDie = currentState.campaignDurationDie;
  const sides = getDieSides(durationDie);
  const dieRoll = rollDie(sides);
  const rolledOne = dieRoll === 1;

  if (!rolledOne) {
    return {
      rolledOne: false,
      dieRoll,
      durationDie,
      isWorldEnded: currentState.isWorldEnded,
      updatedState: currentState,
    };
  }

  const { newMisery, isWorldEnded, updatedState } = triggerNextMisery(currentState);
  return {
    rolledOne: true,
    dieRoll,
    durationDie,
    newMisery,
    isWorldEnded,
    updatedState,
  };
}

/**
 * Triggers the next sequential misery in the Apocalypse calendar.
 */
export function triggerNextMisery(currentState: GMState): {
  newMisery: TriggeredMisery;
  isWorldEnded: boolean;
  updatedState: GMState;
} {
  const miseriesData = getMiseries();
  const currentCount = currentState.triggeredMiseries.length;

  // The 7th Misery is ALWAYS 7:7
  if (currentCount >= 6) {
    const seventh = miseriesData.seventhMisery;
    const misery7: TriggeredMisery = {
      psalm: 7,
      verse: '7:7',
      title: seventh.title,
      text: seventh.text,
      timestamp: Date.now(),
    };
    const updatedState: GMState = {
      ...currentState,
      triggeredMiseries: [...currentState.triggeredMiseries, misery7],
      isWorldEnded: true,
    };
    return {
      newMisery: misery7,
      isWorldEnded: true,
      updatedState,
    };
  }

  // Already triggered verse keys: "psalm:verse"
  const triggeredSet = new Set(
    currentState.triggeredMiseries.map((m) => `${m.psalm}:${m.verse}`)
  );

  // Available verses
  const pool: Array<{ psalm: number; verse: number; title: string; text: string }> = [];
  for (const psalm of miseriesData.psalms) {
    for (const v of psalm.verses) {
      if (!triggeredSet.has(`${psalm.psalm}:${v.verse}`)) {
        pool.push({
          psalm: psalm.psalm,
          verse: v.verse,
          title: `PSALM ${psalm.psalm} (${v.title})`,
          text: v.text,
        });
      }
    }
  }

  // Roll d66 / select from pool
  const picked = pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)]
    : {
        psalm: 1,
        verse: 1,
        title: 'PSALM I (1:1)',
        text: 'The City shall be made hollow.',
      };

  const newMisery: TriggeredMisery = {
    psalm: picked.psalm,
    verse: picked.verse,
    title: picked.title,
    text: picked.text,
    timestamp: Date.now(),
  };

  const updatedState: GMState = {
    ...currentState,
    triggeredMiseries: [...currentState.triggeredMiseries, newMisery],
    isWorldEnded: false,
  };

  return {
    newMisery,
    isWorldEnded: false,
    updatedState,
  };
}
