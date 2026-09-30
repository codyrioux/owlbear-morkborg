import React from 'react';
import { Heart, Sparkles, Wand2, Coins, Skull } from 'lucide-react';
import { Character } from '../types/morkborg';

interface VitalsSectionProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onOpenSpendOmen: () => void;
  onOpenBrokenModal: () => void;
}

export const VitalsSection: React.FC<VitalsSectionProps> = ({
  character,
  onUpdateCharacter,
  onOpenSpendOmen,
  onOpenBrokenModal,
}) => {
  const hpCurrent = character.hp.current;
  const hpMax = character.hp.max;
  const isZeroHp = hpCurrent <= 0;

  const handleHpChange = (amount: number) => {
    onUpdateCharacter((prev) => {
      const nextHp = Math.max(0, Math.min(prev.hp.max, prev.hp.current + amount));
      return {
        ...prev,
        hp: { ...prev.hp, current: nextHp },
      };
    });
  };

  const handleOmenChange = (amount: number) => {
    onUpdateCharacter((prev) => {
      const nextOmens = Math.max(0, Math.min(prev.omens.max, prev.omens.current + amount));
      return {
        ...prev,
        omens: { ...prev.omens, current: nextOmens },
      };
    });
  };

  const handlePowerChange = (amount: number) => {
    onUpdateCharacter((prev) => {
      const nextPowers = Math.max(0, Math.min(prev.powers.max, prev.powers.current + amount));
      return {
        ...prev,
        powers: { ...prev.powers, current: nextPowers },
      };
    });
  };

  // HP Bar Percentage
  const hpPercent = Math.max(0, Math.min(100, Math.round((hpCurrent / (hpMax || 1)) * 100)));

  return (
    <section className="p-3 bg-mb-black border-b-2 border-mb-charcoal">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* 1. Hit Points */}
        <div
          className={`relative p-2.5 border-2 flex flex-col justify-between shadow-brutal-sm ${
            isZeroHp ? 'border-mb-pink bg-mb-pink/10 animate-pulse' : 'border-mb-charcoal bg-mb-dark'
          }`}
        >
          <div className="flex items-center justify-between border-b border-mb-charcoal pb-1 mb-1">
            <div className="flex items-center gap-1.5 text-mb-pink">
              <Heart className="w-4 h-4 fill-mb-pink" />
              <h3 className="font-brutal font-black text-xs tracking-wider uppercase">
                HIT POINTS
              </h3>
            </div>
            {isZeroHp && (
              <span className="bg-mb-pink text-mb-white text-[9px] font-black px-1 uppercase tracking-wider">
                BROKEN
              </span>
            )}
          </div>

          {/* Current / Max display */}
          <div className="flex items-center justify-center my-1 gap-2">
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                value={hpCurrent}
                onChange={(e) =>
                  onUpdateCharacter((prev) => ({
                    ...prev,
                    hp: { ...prev.hp, current: parseInt(e.target.value, 10) || 0 },
                  }))
                }
                className={`w-12 text-3xl font-black font-brutal text-center bg-transparent border-b border-mb-charcoal focus:outline-none ${
                  isZeroHp ? 'text-mb-pink' : 'text-mb-white'
                }`}
              />
              <span className="text-mb-white/40 text-sm font-bold">/</span>
              <input
                type="number"
                value={hpMax}
                onChange={(e) =>
                  onUpdateCharacter((prev) => ({
                    ...prev,
                    hp: { ...prev.hp, max: Math.max(1, parseInt(e.target.value, 10) || 1) },
                  }))
                }
                className="w-10 text-base font-bold font-brutal text-mb-white/70 text-center bg-transparent border-b border-mb-charcoal focus:outline-none"
              />
            </div>
          </div>

          {/* Health Bar */}
          <div className="w-full bg-mb-black h-1.5 border border-mb-charcoal mb-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-mb-yellow' : 'bg-mb-pink'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          {/* Quick HP Adjustment Buttons */}
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => handleHpChange(-1)}
              className="bg-mb-charcoal hover:bg-mb-pink text-mb-white text-xs font-bold py-1 border border-mb-black"
              title="Lose 1 HP"
            >
              -1
            </button>
            <button
              onClick={() => handleHpChange(1)}
              className="bg-mb-charcoal hover:bg-green-600 text-mb-white text-xs font-bold py-1 border border-mb-black"
              title="Heal 1 HP"
            >
              +1
            </button>
            <button
              onClick={() => handleHpChange(4)}
              className="bg-mb-charcoal hover:bg-green-600 text-mb-white text-xs font-bold py-1 border border-mb-black"
              title="Heal 4 HP"
            >
              +4
            </button>
            <button
              onClick={() => handleHpChange(6)}
              className="bg-mb-charcoal hover:bg-green-600 text-mb-white text-xs font-bold py-1 border border-mb-black"
              title="Heal 6 HP"
            >
              +6
            </button>
          </div>

          {/* If 0 HP: Flash Broken Roll Button */}
          {isZeroHp && (
            <button
              onClick={onOpenBrokenModal}
              className="mt-2 w-full mb-btn mb-btn-pink text-xs py-1.5 flex items-center justify-center gap-1 animate-bounce"
            >
              <Skull className="w-3.5 h-3.5" />
              <span>ROLL BROKEN TABLE!</span>
            </button>
          )}
        </div>

        {/* 2. Omens */}
        <div className="p-2.5 border-2 border-mb-charcoal bg-mb-dark flex flex-col justify-between shadow-brutal-sm">
          <div className="flex items-center justify-between border-b border-mb-charcoal pb-1 mb-1">
            <div className="flex items-center gap-1.5 text-mb-yellow">
              <Sparkles className="w-4 h-4" />
              <h3 className="font-brutal font-black text-xs tracking-wider uppercase">
                OMENS
              </h3>
            </div>
            <span className="text-[10px] font-mono text-mb-black bg-mb-yellow px-1 font-bold">
              DIE: {character.omens.dieType}
            </span>
          </div>

          <div className="flex items-center justify-center my-1 gap-3">
            <button
              onClick={() => handleOmenChange(-1)}
              disabled={character.omens.current <= 0}
              className="w-6 h-6 flex items-center justify-center bg-mb-charcoal hover:bg-mb-pink text-mb-white font-bold text-xs disabled:opacity-30 border border-mb-black"
            >
              -
            </button>

            <div className="text-3xl font-black font-brutal text-mb-yellow">
              {character.omens.current}{' '}
              <span className="text-sm text-mb-white/40 font-normal">/ {character.omens.max}</span>
            </div>

            <button
              onClick={() => handleOmenChange(1)}
              disabled={character.omens.current >= character.omens.max}
              className="w-6 h-6 flex items-center justify-center bg-mb-charcoal hover:bg-mb-yellow hover:text-mb-black text-mb-white font-bold text-xs disabled:opacity-30 border border-mb-black"
            >
              +
            </button>
          </div>

          <p className="font-punk text-[9px] text-mb-white/50 text-center mb-1">
            Replenishes on Long Rest
          </p>

          <button
            onClick={onOpenSpendOmen}
            disabled={character.omens.current <= 0}
            className="w-full mb-btn mb-btn-yellow text-xs py-1.5 flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SPEND OMEN</span>
          </button>
        </div>

        {/* 3. Powers */}
        <div className="p-2.5 border-2 border-mb-charcoal bg-mb-dark flex flex-col justify-between shadow-brutal-sm">
          <div className="flex items-center justify-between border-b border-mb-charcoal pb-1 mb-1">
            <div className="flex items-center gap-1.5 text-mb-yellow">
              <Wand2 className="w-4 h-4" />
              <h3 className="font-brutal font-black text-xs tracking-wider uppercase">
                POWERS
              </h3>
            </div>
            <span className="text-[10px] font-mono text-mb-white/60">
              PRES + d4
            </span>
          </div>

          <div className="flex items-center justify-center my-1 gap-3">
            <button
              onClick={() => handlePowerChange(-1)}
              disabled={character.powers.current <= 0}
              className="w-6 h-6 flex items-center justify-center bg-mb-charcoal hover:bg-mb-pink text-mb-white font-bold text-xs disabled:opacity-30 border border-mb-black"
            >
              -
            </button>

            <div className="text-3xl font-black font-brutal text-mb-yellow">
              {character.powers.current}{' '}
              <span className="text-sm text-mb-white/40 font-normal">/ {character.powers.max}</span>
            </div>

            <button
              onClick={() => handlePowerChange(1)}
              className="w-6 h-6 flex items-center justify-center bg-mb-charcoal hover:bg-mb-yellow hover:text-mb-black text-mb-white font-bold text-xs border border-mb-black"
            >
              +
            </button>
          </div>

          <p className="font-punk text-[9px] text-mb-white/50 text-center mb-1">
            Daily Scroll Invocations
          </p>

          <button
            onClick={() => handlePowerChange(-1)}
            disabled={character.powers.current <= 0}
            className="w-full mb-btn mb-btn-dark text-xs py-1.5 flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>USE DAILY POWER</span>
          </button>
        </div>

        {/* 4. Silver */}
        <div className="p-2.5 border-2 border-mb-charcoal bg-mb-dark flex flex-col justify-between shadow-brutal-sm">
          <div className="flex items-center justify-between border-b border-mb-charcoal pb-1 mb-1">
            <div className="flex items-center gap-1.5 text-mb-yellow">
              <Coins className="w-4 h-4" />
              <h3 className="font-brutal font-black text-xs tracking-wider uppercase">
                SILVER
              </h3>
            </div>
            <span className="text-[10px] font-mono text-mb-white/60">
              100s = 1 SLOT
            </span>
          </div>

          <div className="flex items-center justify-center my-2">
            <input
              type="number"
              value={character.silver}
              onChange={(e) =>
                onUpdateCharacter((prev) => ({
                  ...prev,
                  silver: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
              className="w-28 text-3xl font-black font-brutal text-center bg-transparent border-b-2 border-mb-yellow text-mb-yellow focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-mb-white/60 pt-2 border-t border-mb-charcoal">
            <span>Encumbrance:</span>
            <span className="font-mono text-mb-yellow">
              {Math.floor(character.silver / 100)} slot(s)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
