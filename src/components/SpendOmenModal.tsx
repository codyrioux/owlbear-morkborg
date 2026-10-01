import React from 'react';
import { Sparkles, X, Sword, RotateCcw, ShieldAlert, Zap, Compass } from 'lucide-react';
import { rollDie } from '../utils/dice';

interface SpendOmenModalProps {
  isOpen: boolean;
  omensAvailable: number;
  onClose: () => void;
  onApplyOmen: (effectTitle: string, details: string) => void;
}

export const SpendOmenModal: React.FC<SpendOmenModalProps> = ({
  isOpen,
  omensAvailable,
  onClose,
  onApplyOmen,
}) => {
  if (!isOpen) return null;

  const handleChoose = (title: string, details: string) => {
    onApplyOmen(title, details);
    onClose();
  };

  const handleSoakD6 = () => {
    const roll = rollDie(6);
    handleChoose(
      'Soak Damage (-d6)',
      `Omen spent to ward off doom: Reduced incoming damage by ${roll}!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-md bg-mb-black border-4 border-mb-yellow shadow-brutal p-4 sm:p-5 text-mb-white my-auto max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-mb-white/60 hover:text-mb-yellow p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 border-b-2 border-mb-yellow pb-2.5 mb-3">
          <div className="p-1.5 bg-mb-yellow text-mb-black">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-gothic text-2xl text-mb-yellow leading-none uppercase">
              Spend an Omen
            </h2>
            <p className="font-punk text-xs text-mb-white/60">
              Manipulate Fate ({omensAvailable} remaining)
            </p>
          </div>
        </div>

        {/* 5 Canon Choices */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() =>
              handleChoose(
                'Maximum Attack Damage',
                'Omen spent: Dealt MAXIMUM possible damage on next/current attack!'
              )
            }
            className="w-full text-left p-2.5 bg-mb-dark hover:bg-mb-charcoal border border-mb-charcoal hover:border-mb-yellow flex items-center gap-3 transition-colors group"
          >
            <div className="p-1.5 bg-mb-black border border-mb-yellow text-mb-yellow group-hover:bg-mb-yellow group-hover:text-mb-black">
              <Sword className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-brutal uppercase text-mb-white group-hover:text-mb-yellow">
                1. Maximum Attack Damage
              </strong>
              <span className="text-[11px] font-punk text-mb-white/60">
                Deal maximum damage with one attack.
              </span>
            </div>
          </button>

          <button
            onClick={() =>
              handleChoose(
                'Reroll Any Die',
                'Omen spent: Rerolled a die roll to defy fate!'
              )
            }
            className="w-full text-left p-2.5 bg-mb-dark hover:bg-mb-charcoal border border-mb-charcoal hover:border-mb-yellow flex items-center gap-3 transition-colors group"
          >
            <div className="p-1.5 bg-mb-black border border-mb-yellow text-mb-yellow group-hover:bg-mb-yellow group-hover:text-mb-black">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-brutal uppercase text-mb-white group-hover:text-mb-yellow">
                2. Reroll Any Die
              </strong>
              <span className="text-[11px] font-punk text-mb-white/60">
                Reroll any dice roll (yours or someone else's).
              </span>
            </div>
          </button>

          <button
            onClick={handleSoakD6}
            className="w-full text-left p-2.5 bg-mb-dark hover:bg-mb-charcoal border border-mb-charcoal hover:border-mb-yellow flex items-center gap-3 transition-colors group"
          >
            <div className="p-1.5 bg-mb-black border border-mb-yellow text-mb-yellow group-hover:bg-mb-yellow group-hover:text-mb-black">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-brutal uppercase text-mb-white group-hover:text-mb-yellow">
                3. Lower Damage Taken by d6
              </strong>
              <span className="text-[11px] font-punk text-mb-white/60">
                Roll d6 and subtract from incoming damage.
              </span>
            </div>
          </button>

          <button
            onClick={() =>
              handleChoose(
                'Neutralize Crit or Fumble',
                'Omen spent: Neutralized a devastating Critical Hit or Fumble!'
              )
            }
            className="w-full text-left p-2.5 bg-mb-dark hover:bg-mb-charcoal border border-mb-charcoal hover:border-mb-yellow flex items-center gap-3 transition-colors group"
          >
            <div className="p-1.5 bg-mb-black border border-mb-yellow text-mb-yellow group-hover:bg-mb-yellow group-hover:text-mb-black">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-brutal uppercase text-mb-white group-hover:text-mb-yellow">
                4. Neutralize Crit or Fumble
              </strong>
              <span className="text-[11px] font-punk text-mb-white/60">
                Cancel out an enemy crit or your own catastrophic fumble.
              </span>
            </div>
          </button>

          <button
            onClick={() =>
              handleChoose(
                'Lower Test DR by 4',
                'Omen spent: Lowered the test Difficulty Rating by 4!'
              )
            }
            className="w-full text-left p-2.5 bg-mb-dark hover:bg-mb-charcoal border border-mb-charcoal hover:border-mb-yellow flex items-center gap-3 transition-colors group"
          >
            <div className="p-1.5 bg-mb-black border border-mb-yellow text-mb-yellow group-hover:bg-mb-yellow group-hover:text-mb-black">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-brutal uppercase text-mb-white group-hover:text-mb-yellow">
                5. Lower Test DR by 4
              </strong>
              <span className="text-[11px] font-punk text-mb-white/60">
                Shift the target DR down by 4 points.
              </span>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mb-btn mb-btn-dark text-xs py-2"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
