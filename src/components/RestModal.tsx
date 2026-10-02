import React, { useState } from 'react';
import { Moon, Heart, Sparkles, Wand2, X } from 'lucide-react';
import { Character } from '../types/morkborg';
import { performLongRest } from '../utils/morkborgRules';

interface RestModalProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onConfirmLongRest: (healedHp: number, newHp: number, newOmens: number, newPowers: number, restLog: string) => void;
}

export const RestModal: React.FC<RestModalProps> = ({
  character,
  isOpen,
  onClose,
  onConfirmLongRest,
}) => {
  const [starving, setStarving] = useState(character.conditions.starving);
  const [infected, setInfected] = useState(character.conditions.infected);

  if (!isOpen) return null;

  const handleRest = () => {
    // Generate the rest rolls with current toggles
    const charWithToggles: Character = {
      ...character,
      conditions: {
        ...character.conditions,
        starving,
        infected,
      },
    };

    const result = performLongRest(charWithToggles);
    onConfirmLongRest(
      result.healedHp,
      result.newHp,
      result.newOmens,
      result.newPowers,
      result.rollsLog
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-md bg-mb-black border-4 border-mb-yellow shadow-brutal p-4 sm:p-5 text-mb-white my-auto max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-mb-white/60 hover:text-mb-yellow p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 border-b-2 border-mb-yellow pb-3 mb-4">
          <div className="p-1.5 bg-mb-yellow text-mb-black">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-gothic text-2xl text-mb-yellow leading-none">
              A Night's Sleep
            </h2>
            <p className="font-punk text-xs text-mb-white/70">
              Long Rest & Dark Recovery
            </p>
          </div>
        </div>

        {/* Rule Details */}
        <div className="space-y-3 mb-5 font-punk text-xs leading-relaxed text-mb-white/90">
          <p>
            When you bed down in the damp dark for a full night's rest:
          </p>

          <ul className="space-y-2 border-l-2 border-mb-yellow/40 pl-3">
            <li className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-green-400 shrink-0" />
              <span>
                Heal <strong>d6 HP</strong> (if food & water available, up to max).
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 shrink-0 ${character.feats?.lucky ? 'text-zinc-600' : 'text-mb-yellow'}`} />
              {character.feats?.lucky ? (
                <span className="text-zinc-400">
                  Omens: <strong>None</strong> (Locked to 0 by Lucky feat).
                </span>
              ) : (
                <span>
                  Reroll Omens: roll <strong>{character.omens.dieType}</strong> to replenish daily fate.
                </span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-mb-pink shrink-0" />
              <span>
                Reroll Powers: roll <strong>Presence ({character.abilities.presence.modifier >= 0 ? `+${character.abilities.presence.modifier}` : character.abilities.presence.modifier}) + d4</strong> daily uses.
              </span>
            </li>
          </ul>

          {/* Condition Toggles */}
          <div className="pt-2 border-t border-mb-charcoal space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer p-2 bg-mb-dark border border-mb-charcoal hover:border-mb-pink">
              <input
                type="checkbox"
                checked={starving}
                onChange={(e) => setStarving(e.target.checked)}
                className="w-4 h-4 accent-mb-pink"
              />
              <div>
                <span className="font-bold text-xs">Starving / Dehydrated</span>
                <p className="text-[10px] text-mb-white/60">
                  No food or clean water. Restores 0 HP.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer p-2 bg-mb-dark border border-mb-charcoal hover:border-mb-blood">
              <input
                type="checkbox"
                checked={infected}
                onChange={(e) => setInfected(e.target.checked)}
                className="w-4 h-4 accent-mb-blood"
              />
              <div>
                <span className="font-bold text-xs text-mb-pink">Infected Wound</span>
                <p className="text-[10px] text-mb-white/60">
                  Fever takes hold: Regain 0 HP, take d6 infection damage instead!
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 mb-btn mb-btn-dark text-xs py-2"
          >
            CANCEL
          </button>
          <button
            onClick={handleRest}
            className="flex-2 flex-grow mb-btn mb-btn-yellow text-sm py-2 flex items-center justify-center gap-2"
          >
            <Moon className="w-4 h-4" />
            <span>CONFIRM & ROLL RECOVERY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
