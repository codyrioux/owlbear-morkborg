import React from 'react';
import { Skull, Moon, Sun, Dices, Download, Upload, Link } from 'lucide-react';
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
}) => {
  return (
    <header className="relative bg-mb-yellow text-mb-black p-4 border-b-4 border-mb-black shadow-brutal select-none">
      {/* Top Banner with Logo and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-mb-black pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-mb-black text-mb-yellow p-1.5 border border-mb-yellow rotate-[-2deg]">
            <Skull className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-gothic text-3xl sm:text-4xl tracking-tight leading-none uppercase font-black">
              MÖRK BORG
            </h1>
            <span className="font-punk text-xs tracking-widest text-mb-black/80 font-bold">
              DOOMED SOUL SHEET
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={onOpenLongRest}
            className="mb-btn mb-btn-dark text-xs py-1 px-2.5"
            title="Night's Sleep: Heal d6, Reroll Omens, Reroll Powers"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>LONG REST</span>
          </button>

          <button
            onClick={onShortRest}
            className="mb-btn mb-btn-dark text-xs py-1 px-2.5"
            title="Catch Breath: Heal d4"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>SHORT REST</span>
          </button>

          <button
            onClick={onScvmbirther}
            className="mb-btn mb-btn-pink text-xs py-1 px-2.5"
            title="Generate a random unfortunate character"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>SCVMBIRTHER</span>
          </button>

          <button
            onClick={onLinkToken}
            className="mb-btn bg-mb-white text-mb-black text-xs py-1 px-2"
            title={linkedTokenName ? `Linked to ${linkedTokenName}` : "Link sheet to selected map token"}
          >
            <Link className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{linkedTokenName ? 'LINKED' : 'TOKEN'}</span>
          </button>

          <button
            onClick={onExport}
            className="p-1 hover:bg-mb-black/10 border border-mb-black/40"
            title="Export Character JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onImport}
            className="p-1 hover:bg-mb-black/10 border border-mb-black/40"
            title="Import Character JSON"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {linkedTokenName && (
        <div className="mb-2 text-xs font-mono bg-mb-black text-mb-yellow px-2 py-0.5 inline-flex items-center gap-1.5 border border-mb-yellow">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>BOUND TO TOKEN: <strong>{linkedTokenName}</strong></span>
        </div>
      )}

      {/* Character Identity Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Name */}
        <div>
          <label className="block font-brutal text-xs font-black tracking-wider uppercase mb-1">
            NAME OF THE DOOMED
          </label>
          <input
            type="text"
            value={character.name}
            onChange={(e) =>
              onUpdateCharacter((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Name your wretched soul..."
            className="w-full bg-mb-black text-mb-yellow font-punk font-bold px-2 py-1.5 border-2 border-mb-black focus:outline-none focus:ring-2 focus:ring-mb-pink text-base"
          />
        </div>

        {/* Class Selection */}
        <div>
          <label className="block font-brutal text-xs font-black tracking-wider uppercase mb-1">
            CLASS ARCHETYPE
          </label>
          <div className="flex gap-1">
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
              className="w-full bg-mb-black text-mb-white font-brutal font-bold px-2 py-1.5 border-2 border-mb-black focus:outline-none focus:ring-2 focus:ring-mb-pink text-sm cursor-pointer"
            >
              {CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Condition Indicators */}
        <div>
          <label className="block font-brutal text-xs font-black tracking-wider uppercase mb-1">
            CONDITIONS
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onUpdateCharacter((prev) => ({
                  ...prev,
                  conditions: { ...prev.conditions, starving: !prev.conditions.starving }
                }))
              }
              className={`flex-1 py-1.5 px-2 text-xs font-brutal font-bold border-2 border-mb-black transition-colors ${
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
              className={`flex-1 py-1.5 px-2 text-xs font-brutal font-bold border-2 border-mb-black transition-colors ${
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
      <div className="mt-2.5">
        <label className="block font-brutal text-[10px] font-black tracking-wider uppercase mb-0.5 text-mb-black/70">
          TRAITS, QUIRKS & TROUBLED PAST
        </label>
        <textarea
          rows={1}
          value={character.description}
          onChange={(e) =>
            onUpdateCharacter((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Scars, sins, debts, habits, strange markings..."
          className="w-full bg-mb-black/10 text-mb-black font-punk text-xs px-2 py-1 border border-mb-black/40 focus:outline-none focus:bg-mb-white/80 resize-none"
        />
      </div>
    </header>
  );
};
