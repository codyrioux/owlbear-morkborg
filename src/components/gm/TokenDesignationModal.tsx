import React, { useState } from 'react';
import { Skull, Swords, Search, X, Shield, Heart } from 'lucide-react';
import { getMonsters, MonsterData } from '../../data';

interface TokenDesignationModalProps {
  isOpen: boolean;
  token: { id: string; name: string } | null;
  onDesignateCharacter: () => void;
  onDesignateMonster: (monster: MonsterData) => void;
  onCancel: () => void;
}

export const TokenDesignationModal: React.FC<TokenDesignationModalProps> = ({
  isOpen,
  token,
  onDesignateCharacter,
  onDesignateMonster,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<'choose' | 'monsters'>('choose');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !token) return null;

  const monsters = getMonsters();
  const filteredMonsters = monsters.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.epithet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-mb-dark border-4 border-mb-yellow shadow-brutal max-w-lg w-full text-mb-bone font-brutal p-4 select-none max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-mb-yellow/40 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-mb-yellow text-mb-black p-1 border border-black rotate-[-2deg]">
              <Skull className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-gothic text-xl sm:text-2xl text-mb-yellow tracking-wide uppercase leading-none">
                Designate Token
              </h2>
              <span className="font-punk text-xs text-zinc-400">
                Token: <strong className="text-white font-mono">{token.name}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-mb-pink p-1 text-sm font-bold"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content depending on tab */}
        {activeTab === 'choose' ? (
          <div className="space-y-3">
            <p className="font-punk text-xs text-zinc-300">
              This token has no character or monster statblock attached. As Game Master, how would you like to designate it?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option A: Character */}
              <div
                onClick={onDesignateCharacter}
                className="bg-mb-black border-2 border-mb-yellow/40 hover:border-mb-yellow p-3 cursor-pointer group transition-all shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="bg-zinc-800 group-hover:bg-mb-yellow text-zinc-300 group-hover:text-mb-black p-1 border border-zinc-700 transition-colors">
                    <Skull className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-mb-yellow uppercase tracking-wide">
                    Player Scvm
                  </h3>
                </div>
                <p className="font-punk text-xs text-zinc-400 mb-3">
                  Assign or roll an authentic doomed character sheet. Operates as a full PC.
                </p>
                <button
                  type="button"
                  className="w-full bg-mb-yellow hover:bg-yellow-300 text-mb-black font-black text-xs py-1.5 uppercase border border-black shadow-brutal-sm"
                >
                  BIND CHARACTER
                </button>
              </div>

              {/* Option B: Monster */}
              <div
                onClick={() => setActiveTab('monsters')}
                className="bg-mb-black border-2 border-purple-500/40 hover:border-purple-400 p-3 cursor-pointer group transition-all shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="bg-zinc-800 group-hover:bg-purple-600 text-zinc-300 group-hover:text-white p-1 border border-zinc-700 transition-colors">
                    <Swords className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-purple-400 uppercase tracking-wide">
                    Monster / Beast
                  </h3>
                </div>
                <p className="font-punk text-xs text-zinc-400 mb-3">
                  Attach an official MÖRK BORG monster statblock with quick attack & morale rollers.
                </p>
                <button
                  type="button"
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs py-1.5 uppercase border border-black shadow-brutal-sm"
                >
                  CHOOSE MONSTER
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setActiveTab('choose')}
                className="text-xs text-zinc-400 hover:text-white font-mono uppercase"
              >
                ← Back
              </button>
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter 12 core monsters..."
                  className="w-full bg-mb-black text-white pl-7 pr-2 py-1 text-xs border border-zinc-700 focus:outline-none focus:border-purple-400 font-punk"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[50vh] pr-1">
              {filteredMonsters.map((monster) => (
                <div
                  key={monster.id}
                  onClick={() => onDesignateMonster(monster)}
                  className="bg-mb-black hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/80 p-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div>
                      <span className="font-bold text-xs uppercase text-purple-300">
                        {monster.name}
                      </span>
                      <span className="font-punk text-[10px] text-zinc-400 ml-1.5">
                        ({monster.epithet})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                      <span className="text-mb-pink flex items-center gap-0.5">
                        <Heart className="w-2.5 h-2.5" />
                        {monster.hp} HP
                      </span>
                      <span className="text-zinc-400 flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        T{monster.armorTier}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1 truncate">
                    Attacks: {monster.attacks.map((a) => `${a.name} (${a.damageDie})`).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onCancel}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1 font-mono uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
