import React, { useState, useEffect } from 'react';
import { Skull, Swords, Dices, ExternalLink, Flame } from 'lucide-react';
import { GMService, GMState, DEFAULT_GM_STATE } from '../../obr/gmService';
import { OBRService } from '../../obr/obrService';
import { SceneCharacterItem } from '../Header';
import { CalendarNechrubel } from './CalendarNechrubel';

export type GMConsoleTab = 'calendar' | 'combat' | 'bestiary' | 'oracles';

interface GMConsoleProps {
  sceneCharacters?: SceneCharacterItem[];
  onSelectToken?: (tokenId: string) => void;
  // Subcomponents can be slotted or imported
  calendarSlot?: React.ReactNode;
  combatSlot?: React.ReactNode;
  bestiarySlot?: React.ReactNode;
  oraclesSlot?: React.ReactNode;
}

export const GMConsole: React.FC<GMConsoleProps> = ({
  sceneCharacters: _sceneCharacters,
  onSelectToken: _onSelectToken,
  calendarSlot,
  combatSlot,
  bestiarySlot,
  oraclesSlot,
}) => {
  const [activeTab, setActiveTab] = useState<GMConsoleTab>('calendar');
  const [gmState, setGmState] = useState<GMState>(DEFAULT_GM_STATE);

  useEffect(() => {
    // Load current GM State
    GMService.getGMState().then(setGmState);

    // Subscribe to state updates
    const unsub = GMService.subscribeToGMState((newState) => {
      setGmState(newState);
    });

    return () => unsub();
  }, []);

  const handlePopout = async () => {
    await OBRService.openFloatingGMConsole();
  };

  return (
    <div className="bg-mb-black text-mb-bone min-h-[500px] flex flex-col font-brutal">
      {/* Top Bar / Status Header */}
      <div className="bg-mb-dark border-b-2 border-mb-yellow/40 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-brutal">
        <div className="flex items-center gap-2">
          <div className="bg-mb-pink text-white p-1 border border-black rotate-[-2deg] shrink-0">
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-gothic text-xl sm:text-2xl text-mb-yellow leading-none tracking-wide">
                GM COMMAND CONSOLE
              </h2>
              {gmState.isWorldEnded && (
                <span className="bg-mb-pink text-white text-[10px] font-black uppercase px-1.5 py-0.5 tracking-widest animate-bounce">
                  WORLD ENDED (7:7)
                </span>
              )}
            </div>
            <div className="text-[10px] font-punk text-mb-bone/70 flex gap-3 mt-0.5">
              <span>Miseries: <strong className="text-mb-yellow">{gmState.triggeredMiseries.length} / 7</strong></span>
              <span>Combat Round: <strong className="text-mb-yellow">{gmState.round}</strong></span>
              <span>Die: <strong className="text-mb-pink uppercase">{gmState.campaignDurationDie}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {OBRService.isAvailable() && (
            <button
              onClick={handlePopout}
              className="bg-mb-yellow/20 hover:bg-mb-yellow hover:text-mb-black text-mb-yellow text-xs font-bold uppercase px-2 py-1 border border-mb-yellow transition-colors flex items-center gap-1 shadow-brutal-sm"
              title="Pop out into a standalone floating window in Owlbear Rodeo"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Pop Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap border-b border-mb-yellow/30 bg-mb-black/80 p-1.5 gap-1.5">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase border-2 transition-all shadow-brutal-sm ${
            activeTab === 'calendar'
              ? 'bg-mb-yellow text-mb-black border-black -translate-y-0.5'
              : 'bg-mb-dark text-mb-bone border-mb-yellow/30 hover:border-mb-yellow/80 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Calendar (7:7)</span>
        </button>

        <button
          onClick={() => setActiveTab('combat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase border-2 transition-all shadow-brutal-sm ${
            activeTab === 'combat'
              ? 'bg-mb-yellow text-mb-black border-black -translate-y-0.5'
              : 'bg-mb-dark text-mb-bone border-mb-yellow/30 hover:border-mb-yellow/80 hover:text-white'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Combat & Turn</span>
        </button>

        <button
          onClick={() => setActiveTab('bestiary')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase border-2 transition-all shadow-brutal-sm ${
            activeTab === 'bestiary'
              ? 'bg-mb-yellow text-mb-black border-black -translate-y-0.5'
              : 'bg-mb-dark text-mb-bone border-mb-yellow/30 hover:border-mb-yellow/80 hover:text-white'
          }`}
        >
          <Skull className="w-3.5 h-3.5" />
          <span>Bestiary</span>
        </button>

        <button
          onClick={() => setActiveTab('oracles')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase border-2 transition-all shadow-brutal-sm ${
            activeTab === 'oracles'
              ? 'bg-mb-yellow text-mb-black border-black -translate-y-0.5'
              : 'bg-mb-dark text-mb-bone border-mb-yellow/30 hover:border-mb-yellow/80 hover:text-white'
          }`}
        >
          <Dices className="w-3.5 h-3.5" />
          <span>Oracles & Loot</span>
        </button>
      </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-3 overflow-y-auto">
          {activeTab === 'calendar' && (
            <div>
              {calendarSlot || (
                <CalendarNechrubel
                  gmState={gmState}
                  onUpdateGMState={(updater) => GMService.updateGMState(updater)}
                />
              )}
            </div>
          )}

        {activeTab === 'combat' && (
          <div>
            {combatSlot || (
              <div className="bg-mb-dark border-2 border-mb-yellow/40 p-4 text-center">
                <p className="font-gothic text-xl text-mb-yellow">COMBAT & TURN COMMANDER</p>
                <p className="font-punk text-xs text-mb-bone/70 mt-1">Group d6 initiative, mob morale checks, and party tracking.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bestiary' && (
          <div>
            {bestiarySlot || (
              <div className="bg-mb-dark border-2 border-mb-yellow/40 p-4 text-center">
                <p className="font-gothic text-xl text-mb-yellow">MONSTER BESTIARY</p>
                <p className="font-punk text-xs text-mb-bone/70 mt-1">Core rulebook creatures, token assignment, and click-to-attack.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'oracles' && (
          <div>
            {oraclesSlot || (
              <div className="bg-mb-dark border-2 border-mb-yellow/40 p-4 text-center">
                <p className="font-gothic text-xl text-mb-yellow">ORACLES & CORPSE PLUNDERING</p>
                <p className="font-punk text-xs text-mb-bone/70 mt-1">d66 corpse loot, weather, and dungeon devilry.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
