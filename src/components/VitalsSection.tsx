import React from 'react';
import { Heart, Sparkles, Wand2, Coins, Skull } from 'lucide-react';
import { Character } from '../types/morkborg';
import { SectionHeader } from './SectionHeader';

interface VitalsSectionProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onOpenSpendOmen: () => void;
  onOpenBrokenModal: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const VitalsSection: React.FC<VitalsSectionProps> = ({
  character,
  onUpdateCharacter,
  onOpenSpendOmen,
  onOpenBrokenModal,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const hpCurrent = character.hp.current;
  const hpMax = character.hp.max;
  const isZeroHp = hpCurrent <= 0;

  const handleHpChange = (amount: number) => {
    onUpdateCharacter((prev) => {
      const nextHp = Math.max(0, Math.min(prev.hp.max, prev.hp.current + amount));
      const isBroken = nextHp <= 0;
      return {
        ...prev,
        hp: { ...prev.hp, current: nextHp },
        broken: {
          ...prev.broken,
          isBroken,
        },
        conditions: {
          ...prev.conditions,
          broken: isBroken,
        },
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

  const collapsedElement = (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      {/* HP Chip */}
      <div
        className={`flex items-center gap-1 px-1.5 py-0.5 border text-[11px] font-mono font-bold ${
          isZeroHp
            ? 'border-mb-pink text-mb-pink bg-mb-pink/20 animate-pulse'
            : 'border-mb-charcoal bg-mb-dark text-mb-white'
        }`}
        title={`Hit Points: ${hpCurrent}/${hpMax}`}
      >
        <Heart className={`w-3 h-3 ${isZeroHp ? 'text-mb-pink fill-mb-pink' : 'text-mb-pink'}`} />
        <span>{hpCurrent}/{hpMax}</span>
      </div>

      {/* Omens Chip */}
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 border border-mb-charcoal bg-mb-dark text-[11px] font-mono font-bold text-mb-yellow"
        title={`Omens: ${character.omens.current}/${character.omens.max} (${character.omens.dieType})`}
      >
        <Sparkles className="w-3 h-3 text-mb-yellow" />
        <span>{character.omens.current}/{character.omens.max}</span>
      </div>

      {/* Powers Chip */}
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 border border-mb-charcoal bg-mb-dark text-[11px] font-mono font-bold text-mb-pink"
        title={`Occult Powers: ${character.powers.current}/${character.powers.max}`}
      >
        <Wand2 className="w-3 h-3 text-mb-pink" />
        <span>{character.powers.current}/{character.powers.max}</span>
      </div>

      {/* Silver Chip */}
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 border border-mb-charcoal bg-mb-dark text-[11px] font-mono font-bold text-mb-bone"
        title={`Silver: ${character.silver}`}
      >
        <Coins className="w-3 h-3 text-yellow-500" />
        <span>{character.silver}s</span>
      </div>

      {/* Broken Action Button if 0 HP */}
      {isZeroHp && (
        <button
          onClick={onOpenBrokenModal}
          className="bg-mb-pink hover:bg-pink-600 text-white font-brutal font-black text-[10px] px-2 py-0.5 border border-black uppercase tracking-wider animate-pulse shadow-brutal-sm"
          title="Roll on the Broken table (0 HP)"
        >
          BROKEN
        </button>
      )}

      {/* Spend Omen Button if Omens available */}
      {!isZeroHp && character.omens.current > 0 && (
        <button
          onClick={onOpenSpendOmen}
          className="bg-mb-pink hover:bg-pink-600 text-white font-brutal font-bold text-[10px] px-1.5 py-0.5 border border-black uppercase tracking-wider shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-transform"
          title="Spend an Omen"
        >
          OMEN
        </button>
      )}
    </div>
  );

  return (
    <section className="p-2.5 bg-mb-black border-b-2 border-mb-charcoal border-l-4 border-l-mb-pink">
      {/* Standardized Section Header */}
      <SectionHeader
        title="Vitals & Omens"
        subtitle="HP • Omens • Powers • Silver"
        icon={<Heart className="w-3.5 h-3.5 text-mb-pink fill-mb-pink" />}
        accentColor="pink"
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        collapsedElement={collapsedElement}
        rightElement={
          isZeroHp ? (
            <span className="bg-mb-pink text-mb-white text-[10px] font-black px-1.5 py-0.5 uppercase tracking-wider animate-pulse border border-mb-black">
              BROKEN (0 HP)
            </span>
          ) : undefined
        }
      />

      {!isCollapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* 1. Hit Points */}
        <div
          className={`p-2 border flex flex-col justify-between shadow-brutal-sm ${
            isZeroHp ? 'border-mb-pink bg-mb-pink/10 animate-pulse' : 'border-mb-charcoal bg-mb-dark'
          }`}
        >
          <div className="flex items-center justify-between border-b border-mb-charcoal pb-1 mb-1">
            <div className="flex items-center gap-1 text-mb-pink">
              <Heart className="w-3.5 h-3.5 fill-mb-pink shrink-0" />
              <h3 className="font-brutal font-black text-[11px] tracking-wider uppercase">
                HIT POINTS
              </h3>
            </div>
            {isZeroHp && (
              <span className="bg-mb-pink text-mb-white text-[9px] font-black px-1 uppercase">
                0 HP
              </span>
            )}
          </div>

          {/* Current / Max display */}
          <div className="flex items-baseline justify-center my-0.5 gap-1">
            <input
              type="number"
              value={hpCurrent}
              onChange={(e) => {
                const nextHp = Math.max(0, parseInt(e.target.value, 10) || 0);
                const isBroken = nextHp <= 0;
                onUpdateCharacter((prev) => ({
                  ...prev,
                  hp: { ...prev.hp, current: nextHp },
                  broken: {
                    ...prev.broken,
                    isBroken,
                  },
                  conditions: {
                    ...prev.conditions,
                    broken: isBroken,
                  },
                }));
              }}
              className={`w-10 text-2xl font-black font-brutal text-center bg-transparent border-b border-mb-charcoal focus:outline-none ${
                isZeroHp ? 'text-mb-pink' : 'text-mb-white'
              }`}
            />
            <span className="text-mb-white/40 text-xs font-bold">/</span>
            <input
              type="number"
              value={hpMax}
              onChange={(e) =>
                onUpdateCharacter((prev) => ({
                  ...prev,
                  hp: { ...prev.hp, max: Math.max(1, parseInt(e.target.value, 10) || 1) },
                }))
              }
              className="w-8 text-sm font-bold font-brutal text-mb-white/70 text-center bg-transparent border-b border-mb-charcoal focus:outline-none"
            />
          </div>

          {/* Health Bar */}
          <div className="w-full bg-mb-black h-1 border border-mb-charcoal mb-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-mb-yellow' : 'bg-mb-pink'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          {/* Quick HP Adjustment Buttons or Broken Trigger */}
          {isZeroHp ? (
            <button
              onClick={onOpenBrokenModal}
              className="w-full mb-btn mb-btn-pink text-[10px] py-1 flex items-center justify-center gap-1 animate-bounce"
            >
              <Skull className="w-3 h-3" />
              <span>ROLL BROKEN!</span>
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => handleHpChange(-1)}
                className="bg-mb-charcoal hover:bg-mb-pink text-mb-white text-[10px] font-bold py-0.5 border border-mb-black"
                title="Lose 1 HP"
              >
                -1
              </button>
              <button
                onClick={() => handleHpChange(1)}
                className="bg-mb-charcoal hover:bg-green-600 text-mb-white text-[10px] font-bold py-0.5 border border-mb-black"
                title="Heal 1 HP"
              >
                +1
              </button>
              <button
                onClick={() => handleHpChange(4)}
                className="bg-mb-charcoal hover:bg-green-600 text-mb-white text-[10px] font-bold py-0.5 border border-mb-black"
                title="Heal 4 HP"
              >
                +4
              </button>
              <button
                onClick={() => handleHpChange(6)}
                className="bg-mb-charcoal hover:bg-green-600 text-mb-white text-[10px] font-bold py-0.5 border border-mb-black"
                title="Heal 6 HP"
              >
                +6
              </button>
            </div>
          )}
        </div>

        {/* 2. Omens */}
        <div className="p-2 border border-mb-charcoal bg-mb-dark flex flex-col justify-between shadow-brutal-sm">
          <div className="flex items-center justify-between border-b border-mb-charcoal pb-1 mb-1">
            <div className="flex items-center gap-1 text-mb-yellow">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <h3 className="font-brutal font-black text-[11px] tracking-wider uppercase">
                OMENS
              </h3>
            </div>
            <span className="text-[9px] font-mono text-mb-black bg-mb-yellow px-1 font-bold">
              {character.omens.dieType}
            </span>
          </div>

          <div className="flex items-center justify-center my-0.5 gap-1.5">
            <button
              onClick={() => handleOmenChange(-1)}
              disabled={character.omens.current <= 0}
              className="w-4 h-4 flex items-center justify-center bg-mb-charcoal hover:bg-mb-pink text-mb-white font-bold text-[10px] disabled:opacity-30 border border-mb-black shrink-0"
            >
              -
            </button>

            <div className="text-2xl font-black font-brutal text-mb-yellow">
              {character.omens.current}{' '}
              <span className="text-xs text-mb-white/40 font-normal">/ {character.omens.max}</span>
            </div>

            <button
              onClick={() => handleOmenChange(1)}
              disabled={character.omens.current >= character.omens.max}
              className="w-4 h-4 flex items-center justify-center bg-mb-charcoal hover:bg-mb-yellow hover:text-mb-black text-mb-white font-bold text-[10px] disabled:opacity-30 border border-mb-black shrink-0"
            >
              +
            </button>
          </div>

          <button
            onClick={onOpenSpendOmen}
            disabled={character.omens.current <= 0}
            className="w-full mb-btn mb-btn-yellow text-[10px] py-1 flex items-center justify-center gap-1 disabled:opacity-30"
          >
            <Sparkles className="w-3 h-3" />
            <span>SPEND OMEN</span>
          </button>
        </div>

        {/* 3. Powers */}
        <div className="p-2 border border-mb-charcoal bg-mb-dark flex flex-col justify-between shadow-brutal-sm">
          <div className="flex items-center justify-between border-b border-mb-charcoal pb-1 mb-1">
            <div className="flex items-center gap-1 text-mb-yellow">
              <Wand2 className="w-3.5 h-3.5 shrink-0" />
              <h3 className="font-brutal font-black text-[11px] tracking-wider uppercase">
                POWERS
              </h3>
            </div>
            <span className="text-[9px] font-mono text-mb-white/60">
              PRES+d4
            </span>
          </div>

          <div className="flex items-center justify-center my-0.5 gap-1.5">
            <button
              onClick={() => handlePowerChange(-1)}
              disabled={character.powers.current <= 0}
              className="w-4 h-4 flex items-center justify-center bg-mb-charcoal hover:bg-mb-pink text-mb-white font-bold text-[10px] disabled:opacity-30 border border-mb-black shrink-0"
            >
              -
            </button>

            <div className="text-2xl font-black font-brutal text-mb-yellow">
              {character.powers.current}{' '}
              <span className="text-xs text-mb-white/40 font-normal">/ {character.powers.max}</span>
            </div>

            <button
              onClick={() => handlePowerChange(1)}
              disabled={character.powers.current >= character.powers.max}
              className="w-4 h-4 flex items-center justify-center bg-mb-charcoal hover:bg-mb-yellow hover:text-mb-black text-mb-white font-bold text-[10px] disabled:opacity-30 border border-mb-black shrink-0"
            >
              +
            </button>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono px-1.5 py-0.5 bg-mb-black border border-mb-charcoal text-mb-white/70">
            <span className="uppercase text-mb-white/50">Max:</span>
            <input
              type="number"
              value={character.powers.max}
              onChange={(e) =>
                onUpdateCharacter((prev) => ({
                  ...prev,
                  powers: { ...prev.powers, max: Math.max(0, parseInt(e.target.value, 10) || 0) },
                }))
              }
              className="w-8 text-right bg-transparent font-bold text-mb-yellow focus:outline-none"
            />
          </div>
        </div>

        {/* 4. Silver */}
        <div className="p-2 border border-mb-charcoal bg-mb-dark flex flex-col justify-between shadow-brutal-sm">
          <div className="flex items-center justify-between border-b border-mb-charcoal pb-1 mb-1">
            <div className="flex items-center gap-1 text-mb-yellow">
              <Coins className="w-3.5 h-3.5 shrink-0" />
              <h3 className="font-brutal font-black text-[11px] tracking-wider uppercase">
                SILVER
              </h3>
            </div>
            <span className="text-[9px] font-mono text-mb-white/60">
              {Math.floor(character.silver / 100)} slot(s)
            </span>
          </div>

          <div className="flex items-baseline justify-center my-0.5">
            <input
              type="number"
              value={character.silver}
              onChange={(e) =>
                onUpdateCharacter((prev) => ({
                  ...prev,
                  silver: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
              className="w-16 text-2xl font-black font-brutal text-center bg-transparent border-b border-mb-yellow text-mb-yellow focus:outline-none"
            />
            <span className="text-xs text-mb-yellow/70 font-bold ml-1 font-mono">s</span>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() =>
                onUpdateCharacter((prev) => ({
                  ...prev,
                  silver: Math.max(0, prev.silver - 10),
                }))
              }
              className="bg-mb-charcoal hover:bg-mb-pink text-mb-white text-[10px] font-bold py-0.5 border border-mb-black font-mono"
              title="Lose 10 silver"
            >
              -10
            </button>
            <button
              onClick={() =>
                onUpdateCharacter((prev) => ({
                  ...prev,
                  silver: prev.silver + 10,
                }))
              }
              className="bg-mb-charcoal hover:bg-mb-yellow hover:text-mb-black text-mb-white text-[10px] font-bold py-0.5 border border-mb-black font-mono"
              title="Gain 10 silver"
            >
              +10
            </button>
          </div>
        </div>
      </div>
      )}
    </section>
  );
};
