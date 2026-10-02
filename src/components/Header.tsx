import React, { useState } from 'react';
import { User, Moon, Sun, Dices, Download, Upload, Link, Unlink, Users, ChevronDown, ChevronRight, Skull, AlertCircle, Lock, Unlock } from 'lucide-react';
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
  userRole?: 'GM' | 'PLAYER';
  activeView?: 'player' | 'gm';
  onToggleView?: (view: 'player' | 'gm') => void;
  currentUserId?: string;
  currentUserName?: string;
  partyPlayers?: Array<{ id: string; name: string; role: 'GM' | 'PLAYER'; color?: string }>;
  isReadOnly?: boolean;
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
  isCollapsed = false,
  onToggleCollapse,
  userRole = 'PLAYER',
  currentUserId,
  currentUserName,
  partyPlayers,
  isReadOnly = false,
}) => {
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  const isOwner = Boolean(
    character.owner?.id &&
    character.owner.id === currentUserId
  );
  const isGM = userRole === 'GM';
  const canToggleLock = isOwner || isGM;
  const isLocked = Boolean(character.isLocked);
  const isClaimed = Boolean(character.owner?.name);

  const handleClaimSheet = () => {
    const id = currentUserId || 'standalone-player';
    const name = currentUserName || 'Local Scvm';
    onUpdateCharacter((prev) => ({
      ...prev,
      owner: { id, name },
      isLocked: false,
    }));
  };

  const handleToggleLock = () => {
    if (!canToggleLock) return;
    onUpdateCharacter((prev) => ({
      ...prev,
      isLocked: !prev.isLocked,
    }));
  };

  const handleReleaseClaim = () => {
    if (!canToggleLock) return;
    onUpdateCharacter((prev) => ({
      ...prev,
      owner: undefined,
      isLocked: false,
    }));
  };

  const handleGMAssignOwner = (targetId: string) => {
    if (!isGM) return;
    if (!targetId) {
      handleReleaseClaim();
      return;
    }
    const targetPlayer = partyPlayers?.find((p) => p.id === targetId);
    if (targetPlayer) {
      onUpdateCharacter((prev) => ({
        ...prev,
        owner: { id: targetPlayer.id, name: targetPlayer.name },
        isLocked: false,
      }));
    }
  };

  const handleToggleBroken = () => {
    if (isReadOnly) return;
    onUpdateCharacter((prev) => {
      const isNowBroken = !prev.conditions.broken;
      return {
        ...prev,
        hp: {
          ...prev.hp,
          current: isNowBroken ? 0 : 1,
        },
        broken: {
          ...prev.broken,
          isBroken: isNowBroken,
        },
        conditions: {
          ...prev.conditions,
          broken: isNowBroken,
        },
      };
    });
  };

  return (
    <header className="relative bg-mb-dark text-mb-bone p-2.5 border-b-2 border-mb-charcoal border-l-4 border-l-mb-yellow select-none">
      {/* Collapsible Section Header Bar */}
      <div
        onClick={onToggleCollapse}
        className={`flex flex-wrap items-center justify-between gap-2 ${
          isCollapsed ? '' : 'border-b border-mb-charcoal pb-2 mb-2'
        } ${onToggleCollapse ? 'cursor-pointer select-none group/header' : ''}`}
        title={onToggleCollapse ? (isCollapsed ? 'Click to expand character details' : 'Click to collapse character details') : undefined}
      >
        <div className="flex items-center gap-2 min-w-0">
          {onToggleCollapse && (
            <span
              className="text-zinc-500 group-hover/header:text-mb-yellow transition-colors shrink-0"
              aria-hidden="true"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          )}
          <div className="bg-mb-black text-mb-yellow p-1 border border-mb-yellow/40 shrink-0">
            <User className="w-4 h-4 text-mb-yellow" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-brutal font-black text-sm tracking-wider uppercase text-mb-yellow truncate">
              {character.name || 'UNNAMED SCVM'}
            </h2>
            <span className="bg-mb-black text-zinc-300 border border-zinc-700 text-[10px] font-brutal px-1.5 py-0.2 uppercase shrink-0">
              {character.characterClass}
            </span>
          </div>

          {/* Collapsed Condition Indicators */}
          {isCollapsed && (
            <div className="flex items-center gap-1.5 ml-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {character.conditions.broken && (
                <span className="bg-mb-pink text-white text-[8px] font-black px-1 py-0.5 uppercase animate-pulse border border-black">
                  BROKEN
                </span>
              )}
              {character.conditions.infected && (
                <span className="bg-mb-blood text-white text-[8px] font-bold px-1 py-0.5 uppercase border border-black animate-pulse">
                  INFECTED
                </span>
              )}
              {character.conditions.starving && (
                <span className="bg-mb-bone text-mb-black text-[8px] font-black px-1 py-0.5 uppercase border border-black">
                  STARVING
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
            disabled={isReadOnly}
            className={`mb-btn mb-btn-dark text-[11px] py-0.5 px-2 active:translate-x-0.5 active:translate-y-0.5 transition-transform ${
              isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title={isReadOnly ? 'Sheet is locked (Read-only)' : "Night's Sleep: Heal d6, Reroll Omens, Reroll Powers"}
          >
            <Moon className="w-3 h-3 text-mb-yellow" />
            <span className="hidden sm:inline">LONG REST</span>
            <span className="sm:hidden">REST</span>
          </button>

          <button
            onClick={onShortRest}
            disabled={isReadOnly}
            className={`mb-btn mb-btn-dark text-[11px] py-0.5 px-2 active:translate-x-0.5 active:translate-y-0.5 transition-transform ${
              isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title={isReadOnly ? 'Sheet is locked (Read-only)' : 'Catch Breath: Heal d4'}
          >
            <Sun className="w-3 h-3 text-yellow-400" />
            <span className="hidden sm:inline">SHORT REST</span>
            <span className="sm:hidden">HEAL</span>
          </button>

          <button
            onClick={onScvmbirther}
            disabled={isReadOnly}
            className={`mb-btn mb-btn-pink text-[11px] py-0.5 px-2 active:translate-x-0.5 active:translate-y-0.5 transition-transform ${
              isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title={isReadOnly ? 'Sheet is locked (Read-only)' : 'Generate a random unfortunate character'}
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
                    ? 'bg-mb-black text-mb-yellow border-mb-yellow/40'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700'
              }`}
              title="Scene Character Roster: view all characters on map tokens"
            >
              <Users className="w-3 h-3" />
              <span>ROSTER ({sceneCharacters.length})</span>
            </button>
          )}

          <button
            onClick={onLinkToken}
            disabled={isReadOnly}
            className={`mb-btn bg-zinc-900 hover:bg-zinc-800 text-mb-bone border border-zinc-700 text-[11px] py-0.5 px-1.5 ${
              isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title={isReadOnly ? 'Sheet is locked (Read-only)' : linkedTokenName ? `Linked to ${linkedTokenName}` : 'Link sheet to selected map token'}
          >
            <Link className="w-3 h-3 text-mb-yellow" />
            <span className="hidden md:inline">{linkedTokenName ? 'BOUND' : 'TOKEN'}</span>
          </button>

          <button
            onClick={onExport}
            className="p-1 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white"
            title="Export Character JSON"
          >
            <Download className="w-3 h-3" />
          </button>

          <button
            onClick={onImport}
            disabled={isReadOnly}
            className={`p-1 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white ${
              isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title={isReadOnly ? 'Sheet is locked (Read-only)' : 'Import Character JSON'}
          >
            <Upload className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Ownership & Permission Strip */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 py-1 px-2 mb-2 bg-mb-black border border-mb-charcoal text-[11px] font-mono">
        <div className="flex items-center gap-2 min-w-0">
          {isClaimed ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-zinc-400">Claimed by:</span>
              <strong className="text-mb-yellow truncate">{character.owner?.name}</strong>
              {isOwner && (
                <span className="text-[9px] bg-mb-yellow text-mb-black px-1 font-bold font-brutal uppercase">
                  YOU
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="italic">Unclaimed Sheet</span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleClaimSheet}
                  className="bg-mb-yellow hover:bg-yellow-300 text-mb-black font-brutal font-bold text-[10px] px-1.5 py-0.5 border border-black uppercase active:translate-x-0.5 active:translate-y-0.5 transition-transform"
                  title="Claim this character sheet as yours"
                >
                  CLAIM
                </button>
              )}
            </div>
          )}
        </div>

        {/* Lock Icon & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Lock / Unlock Toggle Button or Static Indicator */}
          {canToggleLock ? (
            <button
              type="button"
              onClick={handleToggleLock}
              className={`flex items-center gap-1 px-1.5 py-0.5 border text-[10px] font-brutal font-bold uppercase transition-colors ${
                isLocked
                  ? 'bg-mb-pink/20 border-mb-pink text-mb-pink hover:bg-mb-pink hover:text-white'
                  : 'bg-green-950/40 border-green-500/50 text-green-400 hover:bg-green-600 hover:text-white'
              }`}
              title={
                isLocked
                  ? 'Sheet is LOCKED (Read-only for other players). Click to unlock.'
                  : 'Sheet is UNLOCKED (Others can help/edit). Click to lock.'
              }
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{isLocked ? 'LOCKED' : 'UNLOCKED'}</span>
            </button>
          ) : (
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 border text-[10px] font-brutal font-bold uppercase ${
                isLocked
                  ? 'bg-mb-pink/20 border-mb-pink text-mb-pink'
                  : 'bg-green-950/40 border-green-500/50 text-green-400'
              }`}
              title={
                isLocked
                  ? `Sheet is locked by ${character.owner?.name || 'owner'}. Only owner and GM can edit.`
                  : 'Sheet is unlocked.'
              }
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{isLocked ? 'LOCKED' : 'UNLOCKED'}</span>
            </div>
          )}

          {/* Unclaim / Release Button (if owner or GM) */}
          {isClaimed && canToggleLock && (
            <button
              type="button"
              onClick={handleReleaseClaim}
              className="text-[10px] text-zinc-400 hover:text-mb-pink font-mono underline ml-0.5"
              title="Release ownership of this character sheet"
            >
              Release
            </button>
          )}

          {/* GM Quick-Assign Dropdown */}
          {isGM && partyPlayers && partyPlayers.length > 0 && (
            <select
              value={character.owner?.id || ''}
              onChange={(e) => handleGMAssignOwner(e.target.value)}
              className="bg-zinc-900 text-zinc-300 text-[10px] font-mono border border-zinc-700 px-1 py-0.5 focus:outline-none focus:border-mb-yellow max-w-[110px] truncate"
              title="GM: Assign owner to this sheet"
            >
              <option value="">(Assign Owner...)</option>
              {partyPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.role === 'GM' ? '(GM)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Read-Only Notice Banner */}
      {isReadOnly && (
        <div className="bg-mb-pink/15 border-l-4 border-mb-pink px-2.5 py-1.5 mb-2 flex items-center justify-between text-xs font-mono text-mb-pink">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>SHEET LOCKED</strong> by {character.owner?.name || 'Owner'}. Read-only for non-owners.
            </span>
          </div>
        </div>
      )}

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
            {/* Standalone Local Character Option */}
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

          {/* Standalone / Detach Option Footer */}
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

      {/* Expanded Character Form */}
      {!isCollapsed && (
        <div className="space-y-2 mt-1">
          {/* Identity & Conditions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Name */}
            <div>
              <label className="block font-brutal text-[10px] font-bold tracking-wider uppercase mb-0.5 text-zinc-400">
                NAME OF THE DOOMED
              </label>
              <input
                type="text"
                value={character.name}
                disabled={isReadOnly}
                onChange={(e) =>
                  onUpdateCharacter((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Name your wretched soul..."
                className={`w-full bg-mb-black font-punk font-bold px-2 py-1 border border-zinc-700 text-xs ${
                  isReadOnly ? 'text-zinc-500 cursor-not-allowed opacity-60' : 'text-mb-yellow focus:outline-none focus:border-mb-yellow'
                }`}
              />
            </div>

            {/* Class Selection */}
            <div>
              <label className="block font-brutal text-[10px] font-bold tracking-wider uppercase mb-0.5 text-zinc-400">
                CLASS ARCHETYPE
              </label>
              <select
                value={character.characterClass}
                disabled={isReadOnly}
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
                className={`w-full bg-mb-black font-brutal font-bold px-2 py-1 border border-zinc-700 text-xs truncate ${
                  isReadOnly ? 'text-zinc-500 cursor-not-allowed opacity-60' : 'text-mb-bone focus:outline-none focus:border-mb-yellow cursor-pointer'
                }`}
              >
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Indicators: BROKEN, INFECTED, STARVING */}
            <div>
              <label className="block font-brutal text-[10px] font-bold tracking-wider uppercase mb-0.5 text-zinc-400">
                CONDITIONS
              </label>
              <div className="flex items-center gap-1.5">
                {/* BROKEN BUTTON */}
                <button
                  onClick={handleToggleBroken}
                  disabled={isReadOnly}
                  className={`flex-1 py-1 px-1 text-[10px] font-brutal font-black border transition-colors flex items-center justify-center gap-0.5 ${
                    isReadOnly
                      ? 'opacity-40 cursor-not-allowed bg-zinc-900 text-zinc-500 border-zinc-800'
                      : character.conditions.broken
                      ? 'bg-mb-pink text-white border-black animate-pulse shadow-brutal-sm'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                  title={isReadOnly ? 'Sheet is locked (Read-only)' : character.conditions.broken ? 'Broken (0 HP) - click to revive to 1 HP' : 'Healthy - click to drop to 0 HP and mark Broken'}
                >
                  <Skull className="w-2.5 h-2.5" />
                  <span>BROKEN</span>
                </button>

                {/* INFECTED BUTTON */}
                <button
                  onClick={() =>
                    onUpdateCharacter((prev) => ({
                      ...prev,
                      conditions: { ...prev.conditions, infected: !prev.conditions.infected }
                    }))
                  }
                  disabled={isReadOnly}
                  className={`flex-1 py-1 px-1 text-[10px] font-brutal font-bold border transition-colors flex items-center justify-center gap-0.5 ${
                    isReadOnly
                      ? 'opacity-40 cursor-not-allowed bg-zinc-900 text-zinc-500 border-zinc-800'
                      : character.conditions.infected
                      ? 'bg-mb-blood text-white border-black animate-pulse shadow-brutal-sm'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                  title={isReadOnly ? 'Sheet is locked (Read-only)' : "Toggle Infected condition"}
                >
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span>INFECTED</span>
                </button>

                {/* STARVING BUTTON */}
                <button
                  onClick={() =>
                    onUpdateCharacter((prev) => ({
                      ...prev,
                      conditions: { ...prev.conditions, starving: !prev.conditions.starving }
                    }))
                  }
                  disabled={isReadOnly}
                  className={`flex-1 py-1 px-1 text-[10px] font-brutal font-bold border transition-colors ${
                    isReadOnly
                      ? 'opacity-40 cursor-not-allowed bg-zinc-900 text-zinc-500 border-zinc-800'
                      : character.conditions.starving
                      ? 'bg-mb-bone text-mb-black border-black font-black shadow-brutal-sm'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                  title={isReadOnly ? 'Sheet is locked (Read-only)' : "Toggle Starving condition"}
                >
                  STARVING
                </button>
              </div>
            </div>
          </div>

          {/* Description / Quirks */}
          <div>
            <label className="block font-brutal text-[9px] font-bold tracking-wider uppercase mb-0.5 text-zinc-500">
              TRAITS, QUIRKS & TROUBLED PAST
            </label>
            <textarea
              rows={2}
              value={character.description}
              disabled={isReadOnly}
              onChange={(e) =>
                onUpdateCharacter((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Scars, sins, debts, habits, strange markings..."
              className={`w-full bg-mb-black font-punk text-xs px-2 py-1 border border-zinc-700 resize-y min-h-[44px] leading-snug ${
                isReadOnly ? 'text-zinc-500 cursor-not-allowed opacity-60' : 'text-zinc-300 focus:outline-none focus:border-mb-yellow'
              }`}
            />
          </div>
        </div>
      )}
    </header>
  );
};
