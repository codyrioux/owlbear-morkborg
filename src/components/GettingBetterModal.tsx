import React, { useState } from 'react';
import { Sparkles, X, Heart, Coins, Scroll as ScrollIcon, TrendingUp, TrendingDown, Minus, Dices } from 'lucide-react';
import { Character } from '../types/morkborg';
import { GettingBetterResult, performGettingBetter } from '../utils/morkborgRules';
import { formatModifier } from '../utils/dice';

interface GettingBetterModalProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onApplyGettingBetter: (result: GettingBetterResult, updatedCharacter: Character) => void;
}

export const GettingBetterModal: React.FC<GettingBetterModalProps> = ({
  character,
  isOpen,
  onClose,
  onApplyGettingBetter,
}) => {
  const [outcome, setOutcome] = useState<{
    result: GettingBetterResult;
    updatedCharacter: Character;
  } | null>(null);

  if (!isOpen) return null;

  const handleRoll = () => {
    const rolled = performGettingBetter(character);
    setOutcome(rolled);
  };

  const handleApply = () => {
    if (outcome) {
      onApplyGettingBetter(outcome.result, outcome.updatedCharacter);
      setOutcome(null);
      onClose();
    }
  };

  const handleClose = () => {
    setOutcome(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-mb-black border-4 border-mb-yellow shadow-brutal p-4 text-mb-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-mb-white/60 hover:text-mb-yellow p-1"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 border-b-2 border-mb-yellow pb-2.5 mb-3">
          <div className="p-1.5 bg-mb-yellow text-mb-black shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-gothic text-2xl text-mb-yellow leading-none uppercase">
              Getting Better
            </h2>
            <p className="font-punk text-[10px] text-mb-white/70">
              (or worse) • Core Rules Page 33
            </p>
          </div>
        </div>

        {/* Pre-Roll State */}
        {!outcome ? (
          <div className="space-y-3 font-punk text-xs leading-relaxed text-mb-white/90">
            <p>
              The GM decides when a character should be improved (after completing a scenario, killing mighty foes, or bringing home treasure).
            </p>

            <div className="space-y-2 border-l-2 border-mb-yellow/40 pl-3">
              <div>
                <strong className="text-mb-yellow font-brutal uppercase block text-[11px]">
                  1. More Hit Points
                </strong>
                <span className="text-[11px] text-mb-white/80">
                  Roll <strong>6d10</strong>. If the result is ≥ your current maximum HP ({character.hp.max}), increase it by <strong>d6</strong>.
                </span>
              </div>

              <div>
                <strong className="text-mb-yellow font-brutal uppercase block text-[11px]">
                  2. Left in the Debris
                </strong>
                <span className="text-[11px] text-mb-white/80">
                  Roll <strong>d6</strong>: 1–3 nothing; 4 find 3d10 silver; 5 find an unclean scroll; 6 find a sacred scroll.
                </span>
              </div>

              <div>
                <strong className="text-mb-yellow font-brutal uppercase block text-[11px]">
                  3. Ability Changes
                </strong>
                <span className="text-[11px] text-mb-white/80">
                  Roll <strong>d6</strong> against every ability. Results ≥ ability increase it by 1 (max +6), below decrease it by 1. Modifiers −3 to +1 increase on 2–6 (only decrease on a roll of 1, min −3).
                </span>
              </div>
            </div>

            <button
              onClick={handleRoll}
              className="w-full mb-btn mb-btn-yellow text-xs py-2.5 flex items-center justify-center gap-2 shadow-brutal mt-4"
            >
              <Dices className="w-4 h-4" />
              <span>ROLL "GETTING BETTER"</span>
            </button>
          </div>
        ) : (
          /* Post-Roll Outcome Display */
          <div className="space-y-3 animate-in zoom-in-95 duration-150">
            {/* 1. HP Outcome */}
            <div
              className={`p-2.5 border-2 ${
                outcome.result.hpIncreased
                  ? 'border-green-500 bg-green-950/20'
                  : 'border-mb-charcoal bg-mb-dark'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Heart
                    className={`w-4 h-4 ${
                      outcome.result.hpIncreased ? 'text-green-400 fill-green-400' : 'text-mb-white/40'
                    }`}
                  />
                  <span className="font-brutal font-black text-xs uppercase tracking-wider text-mb-white">
                    HIT POINTS
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-1 py-0.5 uppercase ${
                    outcome.result.hpIncreased
                      ? 'bg-green-500 text-mb-black'
                      : 'bg-mb-charcoal text-mb-white/60'
                  }`}
                >
                  {outcome.result.hpIncreased ? `+${outcome.result.hpGain} MAX HP` : 'NO GAIN'}
                </span>
              </div>

              <p className="font-punk text-[11px] text-mb-white/80">
                {outcome.result.hpIncreased ? (
                  <span>
                    6d10 sum [<strong>{outcome.result.hpRollSum}</strong>] ≥ Max HP [{outcome.result.oldMaxHp}]. Rolled <strong>+{outcome.result.hpGain}</strong> on d6! New Max HP: <strong className="text-green-400">{outcome.result.newMaxHp}</strong>.
                  </span>
                ) : (
                  <span>
                    6d10 sum [<strong>{outcome.result.hpRollSum}</strong>] &lt; Max HP [{outcome.result.oldMaxHp}]. No increase in Hit Points.
                  </span>
                )}
              </p>
            </div>

            {/* 2. Debris Outcome */}
            <div className="p-2.5 border-2 border-mb-charcoal bg-mb-dark">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {outcome.result.debrisType === 'silver' ? (
                    <Coins className="w-4 h-4 text-mb-yellow" />
                  ) : outcome.result.debrisType === 'nothing' ? (
                    <Minus className="w-4 h-4 text-mb-white/40" />
                  ) : (
                    <ScrollIcon className="w-4 h-4 text-mb-pink" />
                  )}
                  <span className="font-brutal font-black text-xs uppercase tracking-wider text-mb-white">
                    LEFT IN THE DEBRIS
                  </span>
                </div>
                <span className="text-[9px] font-mono text-mb-yellow bg-mb-black px-1 font-bold">
                  d6: {outcome.result.debrisRoll}
                </span>
              </div>
              <p className="font-punk text-[11px] text-mb-white/90">
                {outcome.result.debrisDescription}
              </p>
            </div>

            {/* 3. Ability Changes Outcome */}
            <div className="p-2.5 border-2 border-mb-charcoal bg-mb-dark">
              <div className="flex items-center justify-between mb-2">
                <span className="font-brutal font-black text-xs uppercase tracking-wider text-mb-white">
                  ABILITY CHANGES
                </span>
                <span className="text-[9px] font-punk text-mb-white/50">
                  Roll d6 vs ability
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {outcome.result.abilityChanges.map((ab) => {
                  const isUp = ab.changed === 1;
                  const isDown = ab.changed === -1;

                  return (
                    <div
                      key={ab.ability}
                      className={`p-1.5 border flex items-center justify-between ${
                        isUp
                          ? 'border-green-500/60 bg-green-950/30'
                          : isDown
                          ? 'border-mb-pink/60 bg-mb-pink/15'
                          : 'border-mb-charcoal bg-mb-black'
                      }`}
                    >
                      <div>
                        <div className="font-brutal font-black text-[10px] uppercase tracking-wider text-mb-white/90">
                          {ab.ability}
                        </div>
                        <div className="text-[9px] font-mono text-mb-white/50">
                          d6: {ab.roll}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-black flex items-center justify-end gap-1">
                          <span className="text-mb-white/50">{formatModifier(ab.oldModifier)}</span>
                          <span>→</span>
                          <span
                            className={
                              isUp ? 'text-green-400' : isDown ? 'text-mb-pink' : 'text-mb-white'
                            }
                          >
                            {formatModifier(ab.newModifier)}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-0.5 text-[8.5px] font-bold">
                          {isUp && (
                            <span className="text-green-400 flex items-center">
                              <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> +1
                            </span>
                          )}
                          {isDown && (
                            <span className="text-mb-pink flex items-center">
                              <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> -1
                            </span>
                          )}
                          {!isUp && !isDown && (
                            <span className="text-mb-white/40 flex items-center">
                              <Minus className="w-2.5 h-2.5 mr-0.5" /> 0
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleApply}
                className="flex-1 mb-btn mb-btn-yellow text-xs py-2 flex items-center justify-center gap-1.5 shadow-brutal font-black"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>APPLY TO CHARACTER</span>
              </button>
              <button
                onClick={handleRoll}
                className="mb-btn mb-btn-dark text-xs py-2 px-3 font-mono"
                title="Reroll (if GM permits)"
              >
                REROLL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
