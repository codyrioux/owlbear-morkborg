import React from 'react';
import { Swords, Shield, Heart, Unlink, RefreshCw, Dices, ArrowLeft, Lock } from 'lucide-react';
import { MonsterTokenData, rollMonsterMorale, rollMonsterAttack } from '../utils/combatRules';
import { rollDie } from '../utils/dice';
import { OBRService } from '../obr/obrService';
import { GMService } from '../obr/gmService';
import { BadgeService } from '../obr/badgeService';
import { formatTitleCase } from '../utils/format';

interface MonsterSheetProps {
  monster: MonsterTokenData;
  tokenId: string;
  tokenName: string;
  onUpdateMonster: (updater: (prev: MonsterTokenData) => MonsterTokenData) => void;
  onUnlinkMonster: () => void;
  onSwitchToCharacterSheet?: () => void;
  userRole?: 'GM' | 'PLAYER';
}

export const MonsterSheet: React.FC<MonsterSheetProps> = ({
  monster,
  tokenId,
  tokenName,
  onUpdateMonster,
  onUnlinkMonster,
  onSwitchToCharacterSheet,
  userRole,
}) => {
  if (userRole && userRole !== 'GM') {
    return (
      <div className="bg-mb-dark border-2 border-mb-blood p-6 shadow-brutal font-brutal text-mb-bone text-center space-y-4">
        <div className="inline-block bg-mb-blood text-white p-3 border-2 border-black rotate-[-3deg] shadow-brutal-sm">
          <Lock className="w-8 h-8 mx-auto" />
        </div>
        <h2 className="font-gothic text-2xl text-mb-blood tracking-wider">GM EYES ONLY</h2>
        <p className="font-punk text-sm text-zinc-300 max-w-sm mx-auto">
          The vile stats, hit points, and eldritch attacks of this creature are strictly forbidden to mortal eyes. Only the Game Master may inspect or command monsters.
        </p>
        {onSwitchToCharacterSheet && (
          <button
            onClick={onSwitchToCharacterSheet}
            className="bg-mb-yellow hover:bg-yellow-300 text-mb-black font-brutal font-bold text-xs uppercase px-3 py-1.5 border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5"
          >
            Return to Scvm Sheet
          </button>
        )}
      </div>
    );
  }
  const hpCurrent = monster.hp.current;
  const hpMax = monster.hp.max;
  const isDead = hpCurrent <= 0;
  const hpPercent = Math.max(0, Math.min(100, Math.round((hpCurrent / (hpMax || 1)) * 100)));

  const handleAdjustHp = (amount: number) => {
    onUpdateMonster((prev) => {
      const nextHp = Math.max(0, Math.min(prev.hp.max, prev.hp.current + amount));
      const nextDead = nextHp <= 0;
      // Sync badges to token
      BadgeService.syncTokenConditionBadges(tokenId, {
        broken: nextDead,
        infected: false,
        starving: false,
        dead: nextDead,
      });
      return {
        ...prev,
        hp: { ...prev.hp, current: nextHp },
      };
    });
  };

  const handleDamageDie = (sides: number) => {
    const rolled = rollDie(sides);
    handleAdjustHp(-rolled);
    OBRService.notify(`${monster.name} suffered ${rolled} damage (d${sides})!`);
  };

  const handleResetHp = () => {
    onUpdateMonster((prev) => {
      BadgeService.syncTokenConditionBadges(tokenId, {
        broken: false,
        infected: false,
        starving: false,
        dead: false,
      });
      return {
        ...prev,
        hp: { ...prev.hp, current: prev.hp.max },
      };
    });
  };

  const handleRollMorale = async () => {
    const result = rollMonsterMorale(monster.name, monster.morale);
    await GMService.broadcastGMEvent({
      type: 'MORALE_CHECKED',
      payload: {
        monsterName: monster.name,
        result,
      },
    });
    await OBRService.notify(result.description);
  };

  const handleMonsterAttack = async (attack: { name: string; damageDie: string; special?: string }) => {
    const isDR14 = monster.specialRules.some((r) => r.includes('DR14'));
    const isDR10 = monster.specialRules.some((r) => r.includes('DR10'));
    const defenseDR = isDR14 ? 14 : isDR10 ? 10 : 12;

    const result = rollMonsterAttack(monster.name, attack, defenseDR);
    await GMService.broadcastGMEvent({
      type: 'MONSTER_ATTACK',
      payload: {
        monsterName: monster.name,
        attack,
        result,
      },
    });
    await OBRService.notify(result.prompt);
  };

  return (
    <div className="bg-mb-dark border-2 border-purple-500/40 p-3 shadow-brutal font-brutal text-mb-bone select-none space-y-3">
      {/* Top Banner: Name, Epithet, Token Binding & Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-purple-500/30 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-purple-900 text-purple-200 p-1 border border-purple-400 rotate-[-2deg] shrink-0">
            <Swords className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-gothic text-xl sm:text-2xl text-purple-300 tracking-wide truncate">
                {formatTitleCase(monster.name)}
              </h2>
              {isDead && (
                <span className="bg-mb-blood text-white font-black text-[10px] px-1.5 py-0.5 uppercase animate-pulse border border-black shrink-0">
                  SLAIN
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-zinc-400 truncate">
              Bound to Token: <strong className="text-white">{tokenName}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onSwitchToCharacterSheet && (
            <button
              onClick={onSwitchToCharacterSheet}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs px-2 py-1 border border-zinc-700 flex items-center gap-1"
              title="Switch view to character sheet"
            >
              <ArrowLeft className="w-3 h-3 text-mb-yellow" />
              <span>SCVM SHEET</span>
            </button>
          )}

          <button
            onClick={onUnlinkMonster}
            className="bg-mb-blood/40 hover:bg-mb-blood text-white text-xs px-2 py-1 border border-mb-blood/60 flex items-center gap-1"
            title="Detach monster from this map token"
          >
            <Unlink className="w-3 h-3" />
            <span>DETACH</span>
          </button>
        </div>
      </div>

      {/* Vitals Grid: Hit Points & Armor / Morale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Hit Points Card */}
        <div className="bg-mb-black border border-zinc-700 p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-zinc-400 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-mb-pink" />
              Hit Points
            </span>
            <span className={`text-base font-black font-mono ${isDead ? 'text-mb-pink' : 'text-mb-yellow'}`}>
              {hpCurrent} / {hpMax} HP
            </span>
          </div>

          {/* Health Bar */}
          <div className="w-full bg-zinc-900 h-2 border border-black overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                hpPercent <= 25 ? 'bg-mb-pink' : hpPercent <= 50 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          {/* HP Adjustment Controls */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            <button
              onClick={() => handleAdjustHp(-1)}
              className="bg-zinc-900 hover:bg-mb-pink text-white text-xs font-bold py-1 border border-zinc-700 transition-colors"
              title="Apply 1 damage"
            >
              -1
            </button>
            <button
              onClick={() => handleDamageDie(4)}
              className="bg-zinc-900 hover:bg-mb-pink text-white text-xs font-bold py-1 border border-zinc-700 transition-colors"
              title="Apply d4 damage"
            >
              -d4
            </button>
            <button
              onClick={() => handleDamageDie(6)}
              className="bg-zinc-900 hover:bg-mb-pink text-white text-xs font-bold py-1 border border-zinc-700 transition-colors"
              title="Apply d6 damage"
            >
              -d6
            </button>
            <button
              onClick={() => handleAdjustHp(1)}
              className="bg-zinc-900 hover:bg-green-600 text-white text-xs font-bold py-1 border border-zinc-700 transition-colors"
              title="Heal 1 HP"
            >
              +1
            </button>
            <button
              onClick={handleResetHp}
              className="bg-zinc-900 hover:bg-zinc-700 text-zinc-300 text-xs font-bold py-1 border border-zinc-700 transition-colors flex items-center justify-center"
              title="Reset to Maximum HP"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Defense & Morale Card */}
        <div className="bg-mb-black border border-zinc-700 p-2.5 flex flex-col justify-between space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="border border-zinc-800 p-1.5">
              <span className="block text-[10px] text-zinc-400 uppercase font-mono">Armor Soak</span>
              <span className="font-bold text-mb-yellow flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Tier {monster.armorTier} ({monster.damageReduction !== '0' ? monster.damageReduction : 'None'})
              </span>
            </div>
            <div className="border border-zinc-800 p-1.5">
              <span className="block text-[10px] text-zinc-400 uppercase font-mono">Morale Rating</span>
              <span className="font-bold text-purple-300">
                {monster.morale !== null ? monster.morale : 'Fearless'}
              </span>
            </div>
          </div>

          <button
            onClick={handleRollMorale}
            className="w-full bg-purple-700 hover:bg-purple-600 text-white font-black text-xs py-1.5 uppercase border border-black shadow-brutal-sm flex items-center justify-center gap-1 active:translate-x-0.5 active:translate-y-0.5 transition-transform"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Roll Morale (2d6 vs {monster.morale !== null ? monster.morale : '—'})</span>
          </button>
        </div>
      </div>

      {/* Attacks List */}
      <div className="bg-mb-black border border-zinc-700 p-2.5 space-y-2">
        <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-1">
          <Swords className="w-3.5 h-3.5" />
          Attacks & Weapons
        </h3>

        <div className="space-y-1.5">
          {monster.attacks.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 p-1.5 bg-zinc-900 border border-zinc-800"
            >
              <div>
                <span className="font-bold text-xs text-white uppercase">{att.name}</span>
                <span className="text-xs font-mono text-mb-pink ml-2">[{att.damageDie}]</span>
                {att.special && (
                  <span className="font-punk text-[10px] text-zinc-400 block sm:inline sm:ml-2">
                    {att.special}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleMonsterAttack(att)}
                className="bg-mb-blood hover:bg-red-700 text-white font-black text-xs px-2.5 py-1 uppercase border border-black shadow-brutal-sm shrink-0 active:translate-x-0.5 active:translate-y-0.5 transition-transform"
              >
                STRIKE
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Special Traits & Rules */}
      {monster.specialRules && monster.specialRules.length > 0 && (
        <div className="bg-mb-black border border-zinc-700 p-2.5 space-y-1">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
            Traits & Special Rules
          </h3>
          <ul className="space-y-1 font-punk text-xs text-zinc-300">
            {monster.specialRules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="text-purple-400 font-bold shrink-0">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bounties / Loot */}
      {monster.bounties && Object.keys(monster.bounties).length > 0 && (
        <div className="bg-mb-black border border-zinc-700 p-2 font-mono text-[11px] text-zinc-400">
          <span className="text-zinc-500 uppercase mr-1">Bounties:</span>
          {Object.entries(monster.bounties)
            .filter(([_, v]) => Boolean(v))
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ')}
        </div>
      )}
    </div>
  );
};
