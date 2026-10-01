import React from 'react';
import { Swords, Eye, Shield, Heart, Sparkles, Skull, AlertCircle, RefreshCw } from 'lucide-react';
import { Character } from '../../types/morkborg';
import { GMState, GMService } from '../../obr/gmService';
import { OBRService } from '../../obr/obrService';
import { BadgeService } from '../../obr/badgeService';
import { SceneCharacterItem } from '../Header';
import { rollGroupInitiative } from '../../utils/combatRules';

interface CombatTrackerProps {
  gmState: GMState;
  onUpdateGMState: (updater: Partial<GMState> | ((prev: GMState) => GMState)) => Promise<GMState>;
  sceneCharacters: SceneCharacterItem[];
  onSelectToken?: (tokenId: string) => void;
}

export const CombatTracker: React.FC<CombatTrackerProps> = ({
  gmState,
  onUpdateGMState,
  sceneCharacters,
  onSelectToken,
}) => {
  const handleRollInitiative = async () => {
    const result = rollGroupInitiative();
    await onUpdateGMState({
      initiative: result.initiative,
      initiativeRoll: result.roll,
    });
    await GMService.broadcastGMEvent({
      type: 'INITIATIVE_ROLLED',
      payload: result,
    });
    await OBRService.notify(result.description);
  };

  const handleNextRound = async () => {
    await onUpdateGMState((prev) => ({
      ...prev,
      round: prev.round + 1,
      initiative: null,
      initiativeRoll: undefined,
    }));
    await OBRService.notify(`Combat Round ${gmState.round + 1} begins! Roll initiative!`);
  };

  const handleResetCombat = async () => {
    await onUpdateGMState({
      round: 1,
      initiative: null,
      initiativeRoll: undefined,
    });
    await OBRService.notify('Combat state reset to Round 1.');
  };

  const handleFocusToken = async (tokenId: string) => {
    if (onSelectToken) {
      onSelectToken(tokenId);
    } else {
      await OBRService.selectToken(tokenId);
    }
  };

  const handleToggleCondition = async (
    tokenId: string,
    char: Character,
    condition: 'broken' | 'infected' | 'starving' | 'dead'
  ) => {
    const updated = JSON.parse(JSON.stringify(char)) as Character;
    if (condition === 'infected') {
      updated.conditions.infected = !updated.conditions.infected;
    } else if (condition === 'starving') {
      updated.conditions.starving = !updated.conditions.starving;
    } else if (condition === 'broken') {
      const isNowBroken = !updated.broken?.isBroken;
      updated.broken = { isBroken: isNowBroken };
      if (isNowBroken && updated.hp.current > 0) updated.hp.current = 0;
    } else if (condition === 'dead') {
      const isDead = updated.broken?.result?.roll === 4;
      if (isDead) {
        updated.broken = { isBroken: false };
      } else {
        updated.broken = {
          isBroken: true,
          result: { roll: 4, title: 'Dead', description: 'Slain in combat.' },
        };
        updated.hp.current = 0;
      }
    }

    await OBRService.saveCharacter(updated, tokenId);
    await BadgeService.syncTokenConditionBadges(tokenId, {
      broken: updated.hp.current <= 0 || Boolean(updated.broken?.isBroken),
      infected: Boolean(updated.conditions.infected),
      starving: Boolean(updated.conditions.starving),
      dead: updated.broken?.result?.roll === 4,
    });
    OBRService.notify(`Toggled ${condition.toUpperCase()} on "${char.name}"`);
  };

  return (
    <div className="space-y-4">
      {/* 1. Initiative & Round Bar */}
      <div className="bg-mb-dark border-2 border-mb-yellow/40 p-3 shadow-brutal">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-mb-yellow/20">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-mb-yellow" />
            <h3 className="font-gothic text-xl text-mb-yellow tracking-wide">
              Round {gmState.round}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRollInitiative}
              className="bg-mb-yellow hover:bg-yellow-300 text-mb-black font-brutal font-black uppercase text-xs px-3 py-1.5 border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-1"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Roll Initiative (d6)</span>
            </button>

            <button
              onClick={handleNextRound}
              className="bg-mb-black text-mb-bone hover:text-white font-brutal text-xs px-2.5 py-1.5 border border-mb-yellow/40 transition-colors shadow-brutal-sm"
              title="Advance to next round"
            >
              +1 Round
            </button>

            <button
              onClick={handleResetCombat}
              className="text-mb-pink hover:text-white text-xs p-1.5 transition-colors"
              title="Reset Round Counter"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Current Initiative Banner */}
        {gmState.initiative ? (
          <div
            className={`p-3 border-2 border-black text-center font-brutal font-black tracking-wider shadow-brutal animate-in fade-in duration-200 ${
              gmState.initiative === 'pcs'
                ? 'bg-mb-yellow text-mb-black'
                : 'bg-mb-pink text-white'
            }`}
          >
            <div className="text-sm sm:text-base uppercase flex items-center justify-center gap-2">
              <Swords className="w-4 h-4" />
              <span>
                {gmState.initiative === 'pcs'
                  ? `PLAYER CHARACTERS STRIKE FIRST (Rolled ${gmState.initiativeRoll} on d6)`
                  : `ENEMIES SEIZE INITIATIVE & ATTACK (Rolled ${gmState.initiativeRoll} on d6)`}
              </span>
            </div>
            <div className="text-[10px] font-punk opacity-80 mt-0.5">
              {gmState.initiative === 'pcs'
                ? 'Players act in any order desired. Roll DR12 Agility to attack / defend.'
                : 'Monsters strike before players can act. Roll DR12 Agility to Defend!'}
            </div>
          </div>
        ) : (
          <div className="bg-mb-black/60 border border-dashed border-mb-yellow/30 p-2 text-center text-xs font-punk text-mb-bone/60">
            Initiative not yet rolled for Round {gmState.round}. Click "Roll Initiative (d6)" above.
          </div>
        )}
      </div>

      {/* 2. Scene Party Roster & Tactical Status */}
      <div className="bg-mb-dark border-2 border-mb-yellow/40 p-3 shadow-brutal">
        <div className="flex items-center justify-between mb-3 pb-1 border-b border-mb-yellow/20">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-mb-pink" />
            <h4 className="font-gothic text-base text-mb-yellow">Party Tactical Vitals</h4>
          </div>
          <span className="text-[10px] font-punk text-mb-bone/60">
            {sceneCharacters.length} Scvm on Map
          </span>
        </div>

        {sceneCharacters.length === 0 ? (
          <div className="text-center py-4 font-punk text-xs text-mb-bone/60">
            No player tokens linked to MÖRK BORG character sheets found in the current scene.
          </div>
        ) : (
          <div className="space-y-2">
            {sceneCharacters.map(({ id, name, character }) => {
              const hpPercent = Math.max(0, Math.min(100, (character.hp.current / character.hp.max) * 100));
              const isBroken = character.hp.current <= 0 || character.broken?.isBroken;

              return (
                <div
                  key={id}
                  className={`p-2.5 border-2 transition-all shadow-brutal-sm ${
                    isBroken
                      ? 'bg-mb-blood/30 border-mb-pink'
                      : 'bg-mb-black border-mb-yellow/30'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => handleFocusToken(id)}
                        className="p-1 hover:bg-mb-yellow hover:text-mb-black text-mb-yellow border border-mb-yellow/40 transition-colors shrink-0"
                        title="Focus and zoom to token on map"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs sm:text-sm text-mb-white truncate">
                        {character.name}
                      </span>
                      <span className="text-[9px] font-punk text-mb-bone/60 truncate">
                        ({name} • {character.characterClass})
                      </span>
                    </div>

                    {/* Condition Badges (Interactive Toggles) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleCondition(id, character, 'broken')}
                        className={`text-[8px] font-black uppercase px-1.5 py-0.5 border flex items-center gap-0.5 transition-colors ${
                          isBroken
                            ? 'bg-mb-pink text-white border-black animate-pulse shadow-brutal-sm'
                            : 'bg-mb-black/40 text-mb-bone/40 border-mb-bone/20 hover:text-white'
                        }`}
                        title="Toggle Broken (0 HP)"
                      >
                        <Skull className="w-2.5 h-2.5" />
                        <span>BROKEN</span>
                      </button>

                      <button
                        onClick={() => handleToggleCondition(id, character, 'infected')}
                        className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border flex items-center gap-0.5 transition-colors ${
                          character.conditions.infected
                            ? 'bg-mb-blood text-white border-black shadow-brutal-sm'
                            : 'bg-mb-black/40 text-mb-bone/40 border-mb-bone/20 hover:text-white'
                        }`}
                        title="Toggle Infected condition"
                      >
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>INFECTED</span>
                      </button>

                      <button
                        onClick={() => handleToggleCondition(id, character, 'starving')}
                        className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border transition-colors ${
                          character.conditions.starving
                            ? 'bg-mb-bone text-mb-black border-black font-black shadow-brutal-sm'
                            : 'bg-mb-black/40 text-mb-bone/40 border-mb-bone/20 hover:text-white'
                        }`}
                        title="Toggle Starving condition"
                      >
                        STARVING
                      </button>
                    </div>
                  </div>

                  {/* HP Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-brutal">
                      <span className="text-mb-bone/70">Hit Points</span>
                      <span className={`font-bold ${isBroken ? 'text-mb-pink' : 'text-mb-yellow'}`}>
                        {character.hp.current} / {character.hp.max} HP
                      </span>
                    </div>
                    <div className="w-full h-2 bg-mb-dark border border-black overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          hpPercent <= 25 ? 'bg-mb-pink' : hpPercent <= 50 ? 'bg-amber-500' : 'bg-mb-yellow'
                        }`}
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Stat Pill Row */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 border-t border-mb-bone/10 text-[10px] font-punk text-mb-bone/70">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-mb-yellow" />
                      <span>Tier {character.armor.tier}{character.armor.hasShield ? ' + Shield' : ''}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-mb-pink" />
                      <span>Omens: {character.omens.current}/{character.omens.max}</span>
                    </span>
                    <span>Powers: {character.powers.current}/{character.powers.max}</span>
                    <span>Silver: {character.silver}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
