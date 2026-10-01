import React, { useState } from 'react';
import { Skull, Moon, Sun, Dices, Download, Upload, Link, Unlink, Users, Minimize2, Maximize2, ChevronDown, ChevronRight } from 'lucide-react';
import { Character } from '../types/morkborg';

export interface SceneCharacterItem {
  id: string;
  name: string;
  character: Character;
}

interface HeaderProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onScvmbirther: () => void;
  onOpenLongRest: () => void;
  onShortRest: () => void;
  onLinkToken: () => void;
  linkedTokenName?: string | null;
  linkedTokenId?: string | null;
  sceneCharacters?: SceneCharacterItem[];
  onSelectRosterCharacter?: (tokenId: string) => void;
  onSelectStandalone?: () => void;
  onUnlinkToken?: (tokenId?: string) => void;
  onExport: () => void;
  onImport: () => void;
  allCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const CLASSES = [
  'Fanged Deserter',
  'Gutterborn Scum',
  'Esoteric Hermit',
  'Wretched Royalty',
  'Heretical Priest',
  'Occult Herbmaster',
  'Classless Scum',
];

export const Header: React.FC<HeaderProps> = ({
  character,
  onUpdateCharacter,
  onScvmbirther,
  onOpenLongRest,
  onShortRest,
  onLinkToken,
  linkedTokenName,
  linkedTokenId,
  sceneCharacters,
  onSelectRosterCharacter,
  onSelectStandalone,
  onUnlinkToken,
  onExport,
  onImport,
  allCollapsed,
  onToggleCollapseAll,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  return (
    <header className={`relative bg-mb-yellow text-mb-black px-3 ${isCollapsed ? 'py-1.5' : 'py-2'} border-b-4 border-mb-black shadow-brutal select-none transition-all`}>
      {/* Top Banner with Logo, Collapsed Info, and Actions */}
      <div
        onClick={onToggleCollapse}
        className={`flex flex-wrap items-center justify-between gap-2 ${
          isCollapsed ? '' : 'border-b-2 border-mb-black pb-2 mb-2'
        } ${onToggleCollapse ? 'cursor-pointer select-none group/header' : ''}`}
        title={onToggleCollapse ? (isCollapsed ? 'Click to expand character details' : 'Click to collapse character details') : undefined}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {onToggleCollapse && (
            <span
              className="text-mb-black/60 group-hover/header:text-mb-black transition-colors shrink-0"
              aria-hidden="true"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          )}
          <div className="bg-mb-black text-mb-yellow p-1 border border-mb-yellow rotate-[-2deg] shrink-0">
            <Skull className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-gothic text-2xl sm:text-3xl tracking-tight leading-none uppercase font-black">
              MÖRK BORG
            </h1>
            {!isCollapsed && (
              <span className="font-punk text-[9px] tracking-widest text-mb-black/80 font-bold block -mt-0.5">
                DOOMED SOUL SHEET
              </span>
            )}
          </div>

          {/* When collapsed: Display Name, Class & Condition Badges */}
          {isCollapsed && (
            <div
              className="flex items-center gap-1.5 ml-1 sm:ml-2 min-w-0 truncate"
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className="font-punk font-bold text-xs sm:text-sm text-mb-black truncate max-w-[130px] sm:max-w-[190px]"
                title={character.name || 'Unnamed Soul'}
              >
                {character.name || 'Unnamed Soul'}
              </span>
              <span className="bg-mb-black text-mb-yellow text-[9px] font-brutal font-bold px-1.5 py-0.5 uppercase shrink-0">
                {character.characterClass}
              </span>
              {character.conditions.starving && (
                <span className="bg-mb-pink text-white text-[8px] font-bold px-1 uppercase shrink-0">
                  STARVING
                </span>
              )}
              {character.conditions.infected && (
                <span className="bg-mb-blood text-white text-[8px] font-bold px-1 uppercase animate-pulse shrink-0">
                  INFECTED
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-wrap items-center gap-1 shrink-0"
        >
          <button
            onClick={onOpenLongRest}
            className="mb-btn mb-btn-dark text-[11px] py-0.5 px-2 active:translate-x-0.5 active:translate-y-0.5 transition-transform"
            title="Night's Sleep: Heal d6, Reroll Omens, Reroll Powers"
          >
            <Moon className="w-3 h-3" />
            <span>LONG REST</span>
          </button>

          <button
            onClick={onShortRest}
            className="mb-btn mb-btn-dark text-[11px] py-0.5 px-2 active:translate-x-0.5 active:translate-y-0.5 transition-transform"
            title="Catch Breath: Heal d4"
          >
            <Sun className="w-3 h-3" />
            <span>SHORT REST</span>
          </button>

          <button
            onClick={onScvmbirther}
            className="mb-btn mb-btn-pink text-[11px] py-0.5 px-2 active:translate-x-0.5 active:translate-y-0.5 transition-transform"
            title="Generate a random unfortunate character"
          >
            <Dices className="w-3 h-3" />
            <span className="hidden sm:inline">SCVMBIRTHER</span>
          </button>

          {sceneCharacters !== undefined && (
            <button
              onClick={() => setIsRosterOpen((prev) => !prev)}
              className={`mb-btn text-[11px] py-0.5 px-2 active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-1 ${
                isRosterOpen
                  ? 'bg-mb-pink text-white border-black'
                  : sceneCharacters.length > 0
                    ? 'bg-mb-black text-mb-yellow border-black'
                    : 'bg-mb-white text-mb-black border-black'
              }`}
              title="Scene Character Roster: view all characters on map tokens"
            >
              <Users className="w-3 h-3" />
              <span>ROSTER ({sceneCharacters.length})</span>
            </button>
          )}

          <button
            onClick={onLinkToken}
            className="mb-btn bg-mb-white text-mb-black text-[11px] py-0.5 px-1.5"
            title={linkedTokenName ? `Linked to ${linkedTokenName}` : "Link sheet to selected map token"}
          >
            <Link className="w-3 h-3" />
            <span className="hidden md:inline">{linkedTokenName ? 'LINKED' : 'TOKEN'}</span>
          </button>

          <button
            onClick={onExport}
            className="p-1 hover:bg-mb-black/15 border border-mb-black/40 text-mb-black"
            title="Export Character JSON"
          >
            <Download className="w-3 h-3" />
          </button>

          <button
            onClick={onImport}
            className="p-1 hover:bg-mb-black/15 border border-mb-black/40 text-mb-black"
            title="Import Character JSON"
          >
            <Upload className="w-3 h-3" />
          </button>

          {onToggleCollapseAll && (
            <button
              onClick={onToggleCollapseAll}
              className="p-1 hover:bg-mb-black/15 border border-mb-black/40 text-mb-black"
              title={allCollapsed ? "Expand All Sections" : "Collapse All Sections"}
            >
              {allCollapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Roster Popover Menu */}
      {isRosterOpen && sceneCharacters && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-11 z-50 w-72 sm:w-80 bg-mb-black text-mb-bone border-2 border-mb-yellow shadow-brutal p-3 font-brutal"
        >
          <div className="flex items-center justify-between border-b border-mb-yellow/40 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-mb-yellow" />
              <span className="text-xs font-black uppercase text-mb-yellow tracking-wider">
                SCENE ROSTER ({sceneCharacters.length})
              </span>
            </div>
            <button
              onClick={() => setIsRosterOpen(false)}
              className="text-zinc-400 hover:text-mb-pink font-bold text-xs p-0.5"
              title="Close Roster"
            >
              ✕
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 mb-2">
            {/* Standalone Local Character Card */}
            {onSelectStandalone && (
              <div
                onClick={() => {
                  onSelectStandalone();
                  setIsRosterOpen(false);
                }}
                className={`p-2 border cursor-pointer transition-colors ${
                  !linkedTokenId
                    ? 'bg-mb-yellow/20 border-mb-yellow text-mb-yellow'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-mb-bone'
                }`}
                title="Switch to standalone character (stored in local browser storage)"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs uppercase truncate flex items-center gap-1.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${!linkedTokenId ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
                    STANDALONE SHEET (LOCAL)
                  </span>
                  {!linkedTokenId && (
                    <span className="text-[9px] font-mono bg-mb-yellow text-mb-black px-1 font-black shrink-0">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-[9px] font-mono text-zinc-400 mt-0.5">
                  Offline sheet not bound to any map token
                </div>
              </div>
            )}

            {sceneCharacters.length === 0 ? (
              <div className="text-[11px] font-mono text-zinc-400 p-3 text-center border border-dashed border-zinc-700 bg-zinc-950">
                No character tokens found on the map yet. Drag an image token to the map to roll a doomed scvm!
              </div>
            ) : (
              sceneCharacters.map((sc) => {
                const isCurrent = linkedTokenId === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => {
                      if (onSelectRosterCharacter) {
                        onSelectRosterCharacter(sc.id);
                        setIsRosterOpen(false);
                      }
                    }}
                    className={`p-2 border cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-mb-yellow/20 border-mb-yellow text-mb-yellow'
                        : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-mb-bone'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs uppercase truncate">
                        {sc.character.name || 'Unnamed Scvm'}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-mono bg-mb-yellow text-mb-black px-1 font-black shrink-0">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mt-1">
                      <span className="truncate max-w-[130px]">{sc.character.characterClass || 'Classless'}</span>
                      <span className="font-bold text-mb-pink">
                        HP: {sc.character.hp.current}/{sc.character.hp.max}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mt-1">
                      <span className="truncate">TOKEN: {sc.name}</span>
                      {onUnlinkToken && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlinkToken(sc.id);
                          }}
                          className="text-mb-pink hover:underline uppercase text-[9px] font-bold ml-1 shrink-0"
                          title={`Detach "${sc.name}" from its character`}
                        >
                          [DETACH]
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Standalone / Detach Option */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono">
            {linkedTokenId ? (
              <button
                onClick={() => {
                  if (onUnlinkToken) {
                    onUnlinkToken(linkedTokenId);
                    setIsRosterOpen(false);
                  }
                }}
                className="text-mb-pink hover:underline flex items-center gap-1 font-bold uppercase"
                title="Detach active sheet from token to standalone mode"
              >
                <Unlink className="w-3 h-3" />
                Detach Active Token
              </button>
            ) : (
              <span className="text-zinc-500">Standalone Sheet (Local)</span>
            )}
            <span className="text-[9px] text-zinc-500">Click character to switch</span>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <>
          {linkedTokenName ? (
            <div className="mb-2 text-[10px] font-mono bg-mb-black text-mb-yellow px-1.5 py-0.5 inline-flex items-center gap-2 border border-mb-yellow">
              <div className="inline-flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>BOUND TO TOKEN: <strong>{linkedTokenName}</strong></span>
              </div>
              {onUnlinkToken && (
                <button
                  onClick={() => onUnlinkToken(linkedTokenId || undefined)}
                  className="text-mb-pink hover:underline uppercase text-[9px] font-bold ml-1"
                  title="Detach from map token to standalone mode"
                >
                  [DETACH]
                </button>
              )}
            </div>
          ) : (
            <div className="mb-2 text-[10px] font-mono bg-zinc-900 text-zinc-400 px-1.5 py-0.5 inline-flex items-center gap-1.5 border border-zinc-700">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span>STANDALONE SHEET (NOT BOUND TO TOKEN)</span>
            </div>
          )}

      {/* Character Identity Form */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Name */}
        <div>
          <label className="block font-brutal text-[10px] font-black tracking-wider uppercase mb-0.5 text-mb-black/80">
            NAME OF THE DOOMED
          </label>
          <input
            type="text"
            value={character.name}
            onChange={(e) =>
              onUpdateCharacter((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Name your wretched soul..."
            className="w-full bg-mb-black text-mb-yellow font-punk font-bold px-2 py-1 border-2 border-mb-black focus:outline-none focus:ring-1 focus:ring-mb-pink text-xs"
          />
        </div>

        {/* Class Selection */}
        <div>
          <label className="block font-brutal text-[10px] font-black tracking-wider uppercase mb-0.5 text-mb-black/80">
            CLASS ARCHETYPE
          </label>
          <select
            value={character.characterClass}
            onChange={(e) =>
              onUpdateCharacter((prev) => ({
                ...prev,
                characterClass: e.target.value,
                omens: {
                  ...prev.omens,
                  dieType: (e.target.value === 'Esoteric Hermit' || e.target.value === 'Heretical Priest') ? 'd4' : 'd2',
                  max: (e.target.value === 'Esoteric Hermit' || e.target.value === 'Heretical Priest') ? 4 : 2,
                }
              }))
            }
            className="w-full bg-mb-black text-mb-white font-brutal font-bold px-2 py-1 border-2 border-mb-black focus:outline-none focus:ring-1 focus:ring-mb-pink text-xs cursor-pointer truncate"
          >
            {CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* Condition Indicators */}
        <div>
          <label className="block font-brutal text-[10px] font-black tracking-wider uppercase mb-0.5 text-mb-black/80">
            CONDITIONS
          </label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                onUpdateCharacter((prev) => ({
                  ...prev,
                  conditions: { ...prev.conditions, starving: !prev.conditions.starving }
                }))
              }
              className={`flex-1 py-1 px-1.5 text-[11px] font-brutal font-bold border-2 border-mb-black transition-colors ${
                character.conditions.starving
                  ? 'bg-mb-pink text-mb-white'
                  : 'bg-mb-black/20 text-mb-black hover:bg-mb-black/30'
              }`}
            >
              STARVING
            </button>

            <button
              onClick={() =>
                onUpdateCharacter((prev) => ({
                  ...prev,
                  conditions: { ...prev.conditions, infected: !prev.conditions.infected }
                }))
              }
              className={`flex-1 py-1 px-1.5 text-[11px] font-brutal font-bold border-2 border-mb-black transition-colors ${
                character.conditions.infected
                  ? 'bg-mb-blood text-mb-white animate-pulse'
                  : 'bg-mb-black/20 text-mb-black hover:bg-mb-black/30'
              }`}
            >
              INFECTED
            </button>
          </div>
        </div>
      </div>

      {/* Description / Quirks */}
      <div className="mt-1.5">
        <label className="block font-brutal text-[9px] font-black tracking-wider uppercase mb-0.5 text-mb-black/70">
          TRAITS, QUIRKS & TROUBLED PAST
        </label>
        <textarea
          rows={2}
          value={character.description}
          onChange={(e) =>
            onUpdateCharacter((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Scars, sins, debts, habits, strange markings..."
          className="w-full bg-mb-black/10 text-mb-black font-punk text-xs px-2 py-1 border border-mb-black/40 focus:outline-none focus:bg-mb-white/80 resize-y min-h-[48px] leading-snug"
        />
      </div>
        </>
      )}
    </header>
  );
};
