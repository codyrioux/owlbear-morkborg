import React from 'react';
import { Skull, Moon, Sun, Dices, Download, Upload, Link, Minimize2, Maximize2 } from 'lucide-react';
import { Character } from '../types/morkborg';

interface HeaderProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onScvmbirther: () => void;
  onOpenLongRest: () => void;
  onShortRest: () => void;
  onLinkToken: () => void;
  linkedTokenName?: string | null;
  onExport: () => void;
  onImport: () => void;
  allCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
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
  onExport,
  onImport,
  allCollapsed,
  onToggleCollapseAll,
}) => {
  return (
    <header className="relative bg-mb-yellow text-mb-black px-3 py-2 border-b-4 border-mb-black shadow-brutal select-none">
      {/* Top Banner with Logo and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-mb-black pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="bg-mb-black text-mb-yellow p-1 border border-mb-yellow rotate-[-2deg] shrink-0">
            <Skull className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-gothic text-2xl sm:text-3xl tracking-tight leading-none uppercase font-black">
              MÖRK BORG
            </h1>
            <span className="font-punk text-[9px] tracking-widest text-mb-black/80 font-bold block -mt-0.5">
              DOOMED SOUL SHEET
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={onOpenLongRest}
            className="mb-btn mb-btn-dark text-[11px] py-0.5 px-2"
            title="Night's Sleep: Heal d6, Reroll Omens, Reroll Powers"
          >
            <Moon className="w-3 h-3" />
            <span>LONG REST</span>
          </button>

          <button
            onClick={onShortRest}
            className="mb-btn mb-btn-dark text-[11px] py-0.5 px-2"
            title="Catch Breath: Heal d4"
          >
            <Sun className="w-3 h-3" />
            <span>SHORT REST</span>
          </button>

          <button
            onClick={onScvmbirther}
            className="mb-btn mb-btn-pink text-[11px] py-0.5 px-2"
            title="Generate a random unfortunate character"
          >
            <Dices className="w-3 h-3" />
            <span>SCVMBIRTHER</span>
          </button>

          <button
            onClick={onLinkToken}
            className="mb-btn bg-mb-white text-mb-black text-[11px] py-0.5 px-1.5"
            title={linkedTokenName ? `Linked to ${linkedTokenName}` : "Link sheet to selected map token"}
          >
            <Link className="w-3 h-3" />
            <span className="hidden sm:inline">{linkedTokenName ? 'LINKED' : 'TOKEN'}</span>
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

      {linkedTokenName && (
        <div className="mb-2 text-[10px] font-mono bg-mb-black text-mb-yellow px-1.5 py-0.5 inline-flex items-center gap-1 border border-mb-yellow">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>BOUND TO TOKEN: <strong>{linkedTokenName}</strong></span>
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
    </header>
  );
};
