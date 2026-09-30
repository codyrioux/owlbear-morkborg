import React, { useState } from 'react';
import { Dices, Shield, Eye, Dumbbell, HeartPulse } from 'lucide-react';
import { AbilityName, Character } from '../types/morkborg';
import { formatModifier } from '../utils/dice';

interface AbilitiesGridProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onRollAbility: (ability: AbilityName, modifier: number, targetDR: number) => void;
  drPenalty?: number;
}

const ABILITY_CONFIG: Record<
  AbilityName,
  { label: string; icon: React.ReactNode; hints: string; color: string }
> = {
  agility: {
    label: 'AGILITY',
    icon: <Shield className="w-4 h-4" />,
    hints: 'Defend • Balance • Flee • Sneak',
    color: 'border-mb-yellow',
  },
  presence: {
    label: 'PRESENCE',
    icon: <Eye className="w-4 h-4" />,
    hints: 'Aim • Powers • Perceive • Search',
    color: 'border-mb-pink',
  },
  strength: {
    label: 'STRENGTH',
    icon: <Dumbbell className="w-4 h-4" />,
    hints: 'Crush • Lift • Strike • Grapple',
    color: 'border-mb-yellow',
  },
  toughness: {
    label: 'TOUGHNESS',
    icon: <HeartPulse className="w-4 h-4" />,
    hints: 'Survive • Poison • Cold • Falls',
    color: 'border-mb-pink',
  },
};

const DR_OPTIONS = [
  { value: 8, label: 'DR 8 (Routine)' },
  { value: 10, label: 'DR 10 (Easy)' },
  { value: 12, label: 'DR 12 (Normal)' },
  { value: 14, label: 'DR 14 (Difficult)' },
  { value: 16, label: 'DR 16 (Really Hard)' },
  { value: 18, label: 'DR 18 (Nearly Impossible)' },
];

export const AbilitiesGrid: React.FC<AbilitiesGridProps> = ({
  character,
  onUpdateCharacter,
  onRollAbility,
  drPenalty = 0,
}) => {
  const [targetDR, setTargetDR] = useState<number>(12);

  const abilities: AbilityName[] = ['agility', 'presence', 'strength', 'toughness'];

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

  return (
    <section className="p-3 bg-mb-dark border-b-2 border-mb-charcoal">
      {/* Section Header & Global DR Selector */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-mb-charcoal">
        <div className="flex items-center gap-2">
          <span className="font-gothic text-xl text-mb-yellow">Abilities</span>
          <span className="font-punk text-[10px] text-mb-white/60 uppercase">
            Roll d20 + modifier vs DR
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="font-brutal text-xs font-bold text-mb-white/80">
            TEST DR:
          </label>
          <select
            value={targetDR}
            onChange={(e) => setTargetDR(Number(e.target.value))}
            className="bg-mb-black text-mb-yellow border border-mb-yellow font-brutal font-bold text-xs px-2 py-0.5 focus:outline-none cursor-pointer"
          >
            {DR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {drPenalty > 0 && (
            <span className="text-[10px] font-bold text-mb-pink border border-mb-pink px-1">
              +{drPenalty} DR PENALTY
            </span>
          )}
        </div>
      </div>

      {/* Grid of 4 Abilities */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {abilities.map((abilityKey) => {
          const config = ABILITY_CONFIG[abilityKey];
          const ability = character.abilities[abilityKey];
          const modifier = ability.modifier;

          return (
            <div
              key={abilityKey}
              className="relative bg-mb-black border-2 border-mb-charcoal hover:border-mb-yellow transition-all p-2.5 flex flex-col justify-between shadow-brutal-sm group"
            >
              {/* Header Label */}
              <div className="flex items-center justify-center gap-1.5 text-mb-yellow border-b border-mb-charcoal pb-1 mb-1.5">
                {config.icon}
                <h3 className="font-brutal font-black text-xs tracking-wider uppercase">
                  {config.label}
                </h3>
              </div>

              {/* Main Modifier Display & Quick Adjusters */}
              <div className="flex items-center justify-center my-2 gap-2">
                <button
                  onClick={() => handleModifierDirectChange(abilityKey, modifier - 1)}
                  className="w-5 h-5 flex items-center justify-center bg-mb-charcoal hover:bg-mb-pink text-mb-white font-bold text-xs border border-mb-black"
                  title="Decrease modifier"
                >
                  -
                </button>

                <div
                  className={`text-3xl font-black font-brutal tracking-tight text-center w-16 py-0.5 ${
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
                  className="w-5 h-5 flex items-center justify-center bg-mb-charcoal hover:bg-mb-yellow hover:text-mb-black text-mb-white font-bold text-xs border border-mb-black"
                  title="Increase modifier"
                >
                  +
                </button>
              </div>

              {/* Action Hints */}
              <p className="font-punk text-[9px] text-mb-white/50 text-center mb-2 leading-tight">
                {config.hints}
              </p>

              {/* Big ROLL Button */}
              <button
                onClick={() => onRollAbility(abilityKey, modifier, targetDR + drPenalty)}
                className="w-full mb-btn mb-btn-yellow text-xs py-1.5 flex items-center justify-center gap-1.5 shadow-brutal-sm"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>ROLL {formatModifier(modifier)}</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
