import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { RollResult } from '../types/morkborg';

interface RollResultModalProps {
  roll: RollResult | null;
  omensAvailable: number;
  onClose: () => void;
  onSpendOmenReroll?: () => void;
  onSpendOmenLowerDR?: () => void;
}

export const RollResultModal: React.FC<RollResultModalProps> = ({
  roll,
  omensAvailable,
  onClose,
  onSpendOmenReroll,
  onSpendOmenLowerDR,
}) => {
  if (!roll) return null;

  const isAbilityOrAttack = roll.type === 'ability' || roll.type === 'attack' || roll.type === 'defense' || roll.type === 'power_test';
  const showOmenActions = isAbilityOrAttack && omensAvailable > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-mb-black border-4 border-mb-yellow shadow-brutal p-5 text-mb-white text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-mb-white/60 hover:text-mb-yellow p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Crit / Fumble Banner */}
        {roll.isCrit && (
          <div className="mb-3 py-1 px-2 bg-mb-yellow text-mb-black font-brutal font-black text-sm tracking-wider uppercase border-2 border-mb-black animate-pulse">
            CRITICAL SUCCESS!
          </div>
        )}

        {roll.isFumble && (
          <div className="mb-3 py-1 px-2 bg-mb-pink text-mb-white font-brutal font-black text-sm tracking-wider uppercase border-2 border-mb-white animate-pulse">
            FUMBLE!
          </div>
        )}

        {/* Roll Title */}
        <div className="mb-2">
          <span className="font-punk text-[10px] tracking-widest text-mb-yellow uppercase block">
            {roll.characterName}
          </span>
          <h2 className="font-gothic text-2xl text-mb-white tracking-wide uppercase">
            {roll.title}
          </h2>
        </div>

        {/* Big Number Circle / Box */}
        <div className="my-3 py-2 px-4 bg-mb-dark border-2 border-mb-charcoal inline-block shadow-brutal-yellow">
          <div
            className={`text-5xl font-black font-brutal leading-none ${
              roll.isCrit
                ? 'text-mb-yellow'
                : roll.isFumble
                ? 'text-mb-pink'
                : roll.success === true
                ? 'text-green-400'
                : roll.success === false
                ? 'text-mb-pink'
                : 'text-mb-white'
            }`}
          >
            {roll.total}
          </div>

          {roll.targetDR && (
            <div className="mt-1 font-mono text-xs text-mb-white/60">
              vs DR {roll.targetDR}
            </div>
          )}
        </div>

        {/* Details & Formula */}
        <p className="font-mono text-xs text-mb-yellow/90 mb-2 px-2">
          {roll.details}
        </p>

        {/* Flavor text */}
        {roll.flavor && (
          <p className="font-punk text-xs italic text-mb-white/70 mb-4 px-2">
            "{roll.flavor}"
          </p>
        )}

        {/* Omen Quick Actions */}
        {showOmenActions && (
          <div className="my-3 pt-3 border-t border-mb-charcoal/80 space-y-2">
            <span className="font-punk text-[10px] text-mb-yellow uppercase tracking-wider block">
              Fate Intervention ({omensAvailable} Omen{omensAvailable > 1 ? 's' : ''} left)
            </span>

            <div className="grid grid-cols-2 gap-2">
              {onSpendOmenReroll && (
                <button
                  onClick={onSpendOmenReroll}
                  className="mb-btn mb-btn-yellow text-[10px] py-1.5 flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Reroll Die</span>
                </button>
              )}

              {onSpendOmenLowerDR && roll.targetDR && (
                <button
                  onClick={onSpendOmenLowerDR}
                  className="mb-btn mb-btn-dark text-[10px] py-1.5 flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Lower DR by 4</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full mt-2 mb-btn mb-btn-dark text-xs py-2 uppercase tracking-wider"
        >
          DISMISS
        </button>
      </div>
    </div>
  );
};
