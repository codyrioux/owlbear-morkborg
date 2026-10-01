import React, { useState } from 'react';
import { Dices, Shield, Eye, Dumbbell, HeartPulse } from 'lucide-react';
import { AbilityName, Character } from '../types/morkborg';
import { formatModifier } from '../utils/dice';
import { calculateCarryingCapacity, getAbilityDRPenalty } from '../utils/morkborgRules';
import { SectionHeader } from './SectionHeader';

interface AbilitiesGridProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onRollAbility: (ability: AbilityName, modifier: number, targetDR: number, drPenalty?: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ABILITY_CONFIG: Record<
  AbilityName,
  { label: string; shortLabel: string; icon: React.ReactNode; hints: string }
> = {
  agility: {
    label: 'AGILITY',
    shortLabel: 'AGI',
    icon: <Shield className="w-3.5 h-3.5" />,
    hints: 'Defend • Balance • Sneak',
  },
  presence: {
    label: 'PRESENCE',
    shortLabel: 'PRS',
    icon: <Eye className="w-3.5 h-3.5" />,
    hints: 'Aim • Powers • Search',
  },
  strength: {
    label: 'STRENGTH',
    shortLabel: 'STR',
    icon: <Dumbbell className="w-3.5 h-3.5" />,
    hints: 'Crush • Strike • Grapple',
  },
  toughness: {
    label: 'TOUGHNESS',
    shortLabel: 'TGH',
    icon: <HeartPulse className="w-3.5 h-3.5" />,
    hints: 'Survive • Poison • Falls',
  },
};

const DR_OPTIONS = [
  { value: 8, label: 'DR 8 (Routine)' },
  { value: 10, label: 'DR 10 (Easy)' },
  { value: 12, label: 'DR 12 (Normal)' },
  { value: 14, label: 'DR 14 (Difficult)' },
  { value: 16, label: 'DR 16 (Hard)' },
  { value: 18, label: 'DR 18 (Impossible)' },
];

export const AbilitiesGrid: React.FC<AbilitiesGridProps> = ({
  character,
  onUpdateCharacter,
  onRollAbility,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [targetDR, setTargetDR] = useState<number>(12);

  const abilities: AbilityName[] = ['strength', 'agility', 'presence', 'toughness'];

  const capacity = calculateCarryingCapacity(
    character.abilities.strength.modifier,
    character.inventory,
    character.silver,
    character.armor,
    character.weapons,
    character.scrolls
  );
  const effectiveTier = Math.max(0, character.armor.tier - character.armor.degraded);

  const handleModifierDirectChange = (ability: AbilityName, newMod: number) => {
    onUpdateCharacter((prev) => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [ability]: {
          ...prev.abilities[ability],
          modifier: newMod,
        },
      },
    }));
  };

  const collapsedElement = (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      {/* Target DR Select */}
      <div className="flex items-center gap-1">
        <label className="font-brutal text-[9px] font-bold text-mb-white/80">DR:</label>
        <select
          value={targetDR}
          onChange={(e) => setTargetDR(Number(e.target.value))}
          className="bg-mb-black text-mb-yellow border border-mb-yellow/60 font-brutal font-bold text-[10px] px-1 py-0.5 focus:outline-none cursor-pointer"
        >
          {DR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </select>
      </div>

      {/* Penalty Badges */}
      {effectiveTier === 2 && (
        <span className="text-[9px] font-bold text-mb-pink border border-mb-pink px-1">
          +2 AGI
        </span>
      )}
      {effectiveTier >= 3 && (
        <span className="text-[9px] font-bold text-mb-pink border border-mb-pink px-1">
          +4 AGI
        </span>
      )}
      {capacity.isOverencumbered && (
        <span className="text-[9px] font-bold text-mb-pink border border-mb-pink px-1">
          +2 ENC
        </span>
      )}

      {/* Quick-Roll Buttons for STR, AGI, PRS, TGH */}
      <div className="flex items-center gap-1">
        {abilities.map((key) => {
          const config = ABILITY_CONFIG[key];
          const modifier = character.abilities[key].modifier;
          const penalty = getAbilityDRPenalty(key, character.armor, capacity.isOverencumbered);
          const effectiveDR = targetDR + penalty;

          return (
            <button
              key={key}
              onClick={() => onRollAbility(key, modifier, effectiveDR, penalty)}
              className="bg-mb-yellow hover:bg-yellow-300 text-mb-black font-brutal font-bold text-[10px] px-1.5 py-0.5 border border-black shadow-brutal-sm flex items-center gap-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-transform"
              title={`Roll ${config.label} (${formatModifier(modifier)}) vs DR ${effectiveDR}`}
            >
              <span>{config.shortLabel}</span>
              <span className="font-mono font-black">{formatModifier(modifier)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className="p-2.5 bg-mb-dark border-b-2 border-mb-charcoal border-l-4 border-l-mb-yellow">
      {/* Standardized Section Header */}
      <SectionHeader
        title="Abilities"
        subtitle="d20 + mod vs DR"
        icon={<Dices className="w-3.5 h-3.5 text-mb-yellow" />}
        accentColor="yellow"
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        collapsedElement={collapsedElement}
        rightElement={
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <label className="font-brutal text-[10px] font-bold text-mb-white/80">
              DR:
            </label>
            <select
              value={targetDR}
              onChange={(e) => setTargetDR(Number(e.target.value))}
              className="bg-mb-black text-mb-yellow border border-mb-yellow font-brutal font-bold text-[11px] px-1.5 py-0.5 focus:outline-none cursor-pointer"
            >
              {DR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {effectiveTier === 2 && (
              <span className="text-[9px] font-bold text-mb-pink border border-mb-pink px-1">
                +2 AGI
              </span>
            )}
            {effectiveTier >= 3 && (
              <span className="text-[9px] font-bold text-mb-pink border border-mb-pink px-1">
                +4 AGI
              </span>
            )}
            {capacity.isOverencumbered && (
              <span className="text-[9px] font-bold text-mb-pink border border-mb-pink px-1">
                +2 ENC
              </span>
            )}
          </div>
        }
      />

      {/* Grid of 4 Abilities */}
      {!isCollapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {abilities.map((abilityKey) => {
          const config = ABILITY_CONFIG[abilityKey];
          const ability = character.abilities[abilityKey];
          const modifier = ability.modifier;
          const penalty = getAbilityDRPenalty(abilityKey, character.armor, capacity.isOverencumbered);
          const effectiveDR = targetDR + penalty;

          return (
            <div
              key={abilityKey}
              className="relative bg-mb-black border border-mb-charcoal hover:border-mb-yellow/60 transition-colors p-2 flex flex-col justify-between shadow-brutal-sm group"
            >
              {/* Header Label */}
              <div className="flex items-center justify-between text-mb-yellow border-b border-mb-charcoal pb-1 mb-1">
                <div className="flex items-center gap-1">
                  {config.icon}
                  <h3 className="font-brutal font-black text-[11px] tracking-wider uppercase">
                    {config.label}
                  </h3>
                </div>
                {penalty > 0 && (
                  <span className="text-[9px] font-bold text-mb-pink font-mono">
                    +{penalty}DR
                  </span>
                )}
              </div>

              {/* Modifier Value & Quick Adjusters */}
              <div className="flex items-center justify-center my-1 gap-1.5">
                <button
                  onClick={() => handleModifierDirectChange(abilityKey, modifier - 1)}
                  className="w-4 h-4 flex items-center justify-center bg-mb-charcoal hover:bg-mb-pink text-mb-white font-bold text-[10px] border border-mb-black shrink-0"
                  title="Decrease modifier"
                >
                  -
                </button>

                <div
                  className={`text-2xl font-black font-brutal tracking-tight text-center px-1 ${
                    modifier > 0
                      ? 'text-mb-yellow'
                      : modifier < 0
                      ? 'text-mb-pink'
                      : 'text-mb-white'
                  }`}
                >
                  {formatModifier(modifier)}
                </div>

                <button
                  onClick={() => handleModifierDirectChange(abilityKey, modifier + 1)}
                  className="w-4 h-4 flex items-center justify-center bg-mb-charcoal hover:bg-mb-yellow hover:text-mb-black text-mb-white font-bold text-[10px] border border-mb-black shrink-0"
                  title="Increase modifier"
                >
                  +
                </button>
              </div>

              {/* Action Hints */}
              <p className="font-punk text-[8.5px] text-mb-white/40 text-center mb-1.5 truncate">
                {config.hints}
              </p>

              {/* Compact ROLL Button */}
              <button
                onClick={() => onRollAbility(abilityKey, modifier, effectiveDR, penalty)}
                className="w-full mb-btn mb-btn-yellow text-[11px] py-1 flex items-center justify-center gap-1 shadow-brutal-sm"
                title={`Roll d20 ${modifier >= 0 ? `+${modifier}` : modifier} vs DR ${effectiveDR}${penalty > 0 ? ` (Base DR ${targetDR} + ${penalty} penalty)` : ''}`}
              >
                <Dices className="w-3 h-3" />
                <span>ROLL {formatModifier(modifier)}</span>
                {penalty > 0 && <span className="text-[9px] opacity-75">(DR{effectiveDR})</span>}
              </button>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
};
