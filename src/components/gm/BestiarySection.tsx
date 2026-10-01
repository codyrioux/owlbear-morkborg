import React, { useState } from 'react';
import { Skull, Swords, DollarSign, Crosshair, AlertTriangle } from 'lucide-react';
import { getMonsters, MonsterData } from '../../data';
import { OBRService } from '../../obr/obrService';
import { GMService } from '../../obr/gmService';
import {
  MONSTER_METADATA_KEY,
  createMonsterTokenData,
  rollMonsterMorale,
  rollMonsterAttack,
} from '../../utils/combatRules';

export const BestiarySection: React.FC = () => {
  const monsters = getMonsters();
  const [selectedMonster, setSelectedMonster] = useState<MonsterData>(monsters[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);

  const filteredMonsters = monsters.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.epithet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssignToSelectedToken = async () => {
    if (!selectedMonster) return;
    const token = await OBRService.getSelectedToken();
    if (!token) {
      alert('Select a token on the Owlbear Rodeo map first, then click Assign to Token.');
      return;
    }

    try {
      const monsterTokenData = createMonsterTokenData(token.id, selectedMonster);
      // Save monster data to token metadata
      const items = await (window as any).OBR?.scene?.items?.getItems([token.id]);
      if (items && items[0]) {
        await (window as any).OBR.scene.items.updateItems([token.id], (toUpdate: any[]) => {
          if (toUpdate[0]) {
            toUpdate[0].metadata[MONSTER_METADATA_KEY] = monsterTokenData;
          }
        });
        OBRService.notify(`Assigned ${selectedMonster.name} to token "${token.name}"!`);
        setLastActionResult(`Token "${token.name}" is now bound as ${selectedMonster.name} (${selectedMonster.hp} HP).`);
      } else {
        OBRService.notify(`Assigned ${selectedMonster.name} to token "${token.name}"!`);
        setLastActionResult(`Assigned ${selectedMonster.name} to token "${token.name}".`);
      }
    } catch (err) {
      console.warn('Could not assign monster to token:', err);
    }
  };

  const handleRollMorale = async () => {
    if (!selectedMonster) return;
    const result = rollMonsterMorale(selectedMonster.name, selectedMonster.morale);
    setLastActionResult(result.description);
    await OBRService.notify(result.description);
    await GMService.broadcastGMEvent({
      type: 'MONSTER_MORALE_ROLLED',
      payload: result,
    });
  };

  const handleMonsterAttack = async (attack: { name: string; damageDie: string; special?: string }) => {
    if (!selectedMonster) return;
    // Defense against monsters is usually DR12 unless modified by monster rules (e.g. Goblin is DR14)
    const isDR14 = selectedMonster.specialRules.some((r) => r.includes('DR14'));
    const isDR10 = selectedMonster.specialRules.some((r) => r.includes('DR10'));
    const defenseDR = isDR14 ? 14 : isDR10 ? 10 : 12;

    const result = rollMonsterAttack(selectedMonster.name, attack, defenseDR);
    setLastActionResult(result.prompt);
    await OBRService.notify(result.prompt);
    await GMService.broadcastGMEvent({
      type: 'MONSTER_ATTACKED',
      payload: {
        monsterName: selectedMonster.name,
        attackName: attack.name,
        damage: result.damage,
        defenseDR,
        prompt: result.prompt,
      },
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. Monster List & Search Filter */}
      <div className="md:col-span-1 bg-mb-dark border-2 border-mb-yellow/40 p-2 shadow-brutal flex flex-col h-[520px]">
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search Bestiary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-mb-black border border-mb-yellow/40 text-mb-white text-xs px-2 py-1.5 font-brutal focus:outline-none focus:border-mb-yellow placeholder:text-mb-bone/40"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filteredMonsters.map((monster) => {
            const isSelected = selectedMonster?.id === monster.id;
            return (
              <button
                key={monster.id}
                onClick={() => setSelectedMonster(monster)}
                className={`w-full text-left p-2 border transition-all text-xs font-brutal flex items-center justify-between ${
                  isSelected
                    ? 'bg-mb-yellow text-mb-black border-black shadow-brutal-sm font-bold -translate-y-0.5'
                    : 'bg-mb-black text-mb-bone border-mb-yellow/20 hover:border-mb-yellow/60'
                }`}
              >
                <div className="min-w-0 pr-1">
                  <div className="truncate font-bold">{monster.name}</div>
                  <div className="text-[10px] font-punk opacity-70 truncate">{monster.epithet}</div>
                </div>
                <span className="text-[10px] shrink-0 font-mono">
                  {monster.hp} HP
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Monster Statblock & Actions */}
      <div className="md:col-span-2 bg-mb-dark border-2 border-mb-yellow/40 p-4 shadow-brutal flex flex-col justify-between">
        {selectedMonster ? (
          <div className="space-y-3">
            {/* Header */}
            <div className="border-b-2 border-mb-yellow/30 pb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-gothic text-2xl text-mb-yellow leading-tight">
                  {selectedMonster.name}
                </h3>
                <span className="font-punk text-xs text-mb-pink font-bold">
                  {selectedMonster.epithet}
                </span>
              </div>

              <button
                onClick={handleAssignToSelectedToken}
                className="bg-mb-yellow hover:bg-yellow-300 text-mb-black font-brutal font-black uppercase text-xs px-3 py-1.5 border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-1.5"
                title="Bind this monster's statblock and HP to the currently selected map token"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Assign to Token</span>
              </button>
            </div>

            {/* Vitals Summary Pill Row */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-brutal">
              <div className="bg-mb-black border border-mb-yellow/30 p-2 shadow-brutal-sm">
                <span className="text-[10px] text-mb-bone/60 block uppercase">Hit Points</span>
                <span className="font-black text-base text-mb-yellow">{selectedMonster.hp}</span>
              </div>

              <div className="bg-mb-black border border-mb-yellow/30 p-2 shadow-brutal-sm">
                <span className="text-[10px] text-mb-bone/60 block uppercase">Morale</span>
                <span className="font-black text-base text-mb-pink">
                  {selectedMonster.morale !== null ? selectedMonster.morale : 'Fearless'}
                </span>
              </div>

              <div className="bg-mb-black border border-mb-yellow/30 p-2 shadow-brutal-sm">
                <span className="text-[10px] text-mb-bone/60 block uppercase">Armor</span>
                <span className="font-bold text-sm text-mb-bone">
                  {selectedMonster.damageReduction !== '0' ? selectedMonster.damageReduction : 'None'}
                </span>
              </div>
            </div>

            {/* Description Lore */}
            <p className="font-punk text-xs text-mb-bone/80 italic leading-relaxed bg-mb-black/40 p-2 border-l-2 border-mb-yellow">
              "{selectedMonster.description}"
            </p>

            {/* Attacks */}
            <div>
              <span className="font-gothic text-sm text-mb-yellow block mb-1">Attacks</span>
              <div className="space-y-1.5">
                {selectedMonster.attacks.map((att, idx) => (
                  <div
                    key={idx}
                    className="bg-mb-black border border-mb-yellow/20 p-2 flex items-center justify-between gap-2 shadow-brutal-sm"
                  >
                    <div className="text-xs">
                      <span className="font-bold text-mb-white">{att.name}</span>
                      <span className="text-mb-pink font-mono ml-2 font-bold">{att.damageDie}</span>
                      {att.special && (
                        <span className="font-punk text-[10px] text-mb-bone/60 block mt-0.5">
                          {att.special}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleMonsterAttack(att)}
                      className="bg-mb-pink hover:bg-pink-600 text-white font-brutal font-bold text-[11px] px-2.5 py-1 border border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-1 shrink-0"
                    >
                      <Swords className="w-3 h-3" />
                      <span>Attack</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Rules */}
            {selectedMonster.specialRules.length > 0 && (
              <div>
                <span className="font-gothic text-sm text-mb-yellow block mb-1">Special Traits</span>
                <ul className="space-y-1 text-xs font-punk text-mb-bone">
                  {selectedMonster.specialRules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-mb-yellow shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bounties & Values */}
            <div className="border-t border-mb-yellow/20 pt-2">
              <span className="font-gothic text-xs text-mb-bone/70 block mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-mb-yellow" />
                <span>Bounties & Scavenge Value:</span>
              </span>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                {Object.entries(selectedMonster.bounties).map(([k, v]) => (
                  v && (
                    <span key={k} className="bg-mb-black px-2 py-0.5 border border-mb-bone/30 text-mb-yellow">
                      {k}: <strong>{v}</strong>
                    </span>
                  )
                ))}
              </div>
            </div>

            {/* Action Bar (Morale Check) */}
            <div className="border-t border-mb-yellow/20 pt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleRollMorale}
                className="bg-mb-black hover:bg-mb-dark text-mb-bone hover:text-white font-brutal text-xs px-3 py-1.5 border border-mb-pink shadow-brutal-sm transition-colors flex items-center gap-1.5"
              >
                <Skull className="w-3.5 h-3.5 text-mb-pink" />
                <span>Roll Morale (2d6 vs {selectedMonster.morale !== null ? selectedMonster.morale : '—'})</span>
              </button>
            </div>

            {/* Recent Action Feedback Card */}
            {lastActionResult && (
              <div className="bg-mb-black border-2 border-mb-yellow p-2 text-xs font-brutal text-mb-yellow animate-in fade-in duration-150">
                {lastActionResult}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 font-punk text-sm text-mb-bone/60">
            Select a creature from the catalog on the left to inspect its statblock.
          </div>
        )}
      </div>
    </div>
  );
};
