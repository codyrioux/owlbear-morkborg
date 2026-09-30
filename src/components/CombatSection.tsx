import React, { useState } from 'react';
import { Shield, Sword, Plus, Trash2, Dices, Crosshair } from 'lucide-react';
import { ArmorTier, Character, Weapon } from '../types/morkborg';

interface CombatSectionProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onDefend: () => void;
  onSoakArmor: () => void;
  onAttack: (weapon: Weapon) => void;
  onDamage: (weapon: Weapon) => void;
}

const ARMOR_TIERS: { tier: ArmorTier; name: string; dr: string; penalty: string }[] = [
  { tier: 0, name: 'Tier 0: None', dr: '0', penalty: 'No penalty' },
  { tier: 1, name: 'Tier 1: Light', dr: '-d2', penalty: 'Leather / Gambeson' },
  { tier: 2, name: 'Tier 2: Medium', dr: '-d4', penalty: '+2 DR to Agility tests' },
  { tier: 3, name: 'Tier 3: Heavy', dr: '-d6', penalty: '+2 DR Agility, cannot use powers' },
];

export const CombatSection: React.FC<CombatSectionProps> = ({
  character,
  onUpdateCharacter,
  onDefend,
  onSoakArmor,
  onAttack,
  onDamage,
}) => {
  const [newWeaponName, setNewWeaponName] = useState('');
  const [newWeaponType, setNewWeaponType] = useState<'melee' | 'ranged'>('melee');
  const [newWeaponDamage, setNewWeaponDamage] = useState('d6');

  const armor = character.armor;
  const effectiveTier = Math.max(0, armor.tier - armor.degraded);

  const handleTierChange = (newTier: ArmorTier) => {
    let dr = '0';
    if (newTier === 1) dr = '-d2';
    if (newTier === 2) dr = '-d4';
    if (newTier === 3) dr = '-d6';

    onUpdateCharacter((prev) => ({
      ...prev,
      armor: {
        ...prev.armor,
        tier: newTier,
        damageReduction: dr,
      },
    }));
  };

  const handleAddWeapon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeaponName.trim()) return;

    const newWep: Weapon = {
      id: crypto.randomUUID(),
      name: newWeaponName.trim(),
      type: newWeaponType,
      damageDie: newWeaponDamage,
    };

    onUpdateCharacter((prev) => ({
      ...prev,
      weapons: [...prev.weapons, newWep],
    }));

    setNewWeaponName('');
  };

  const handleRemoveWeapon = (id: string) => {
    onUpdateCharacter((prev) => ({
      ...prev,
      weapons: prev.weapons.filter((w) => w.id !== id),
    }));
  };

  return (
    <section className="p-3 bg-mb-dark border-b-2 border-mb-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT COLUMN: Armor & Defense */}
        <div className="bg-mb-black p-3 border-2 border-mb-charcoal shadow-brutal-sm">
          <div className="flex items-center justify-between border-b border-mb-charcoal pb-1.5 mb-2.5">
            <div className="flex items-center gap-1.5 text-mb-yellow">
              <Shield className="w-4 h-4" />
              <h3 className="font-brutal font-black text-sm tracking-wider uppercase">
                ARMOR & DEFENSE
              </h3>
            </div>
            {effectiveTier >= 2 && (
              <span className="text-[10px] font-bold text-mb-pink border border-mb-pink px-1">
                +2 DR AGILITY
              </span>
            )}
          </div>

          {/* Armor Configuration */}
          <div className="space-y-2 mb-3">
            <div>
              <label className="block text-[10px] font-bold text-mb-white/60 uppercase mb-0.5">
                ARMOR TIER
              </label>
              <select
                value={armor.tier}
                onChange={(e) => handleTierChange(Number(e.target.value) as ArmorTier)}
                className="w-full bg-mb-dark text-mb-white border border-mb-charcoal font-brutal text-xs py-1 px-2 focus:outline-none focus:border-mb-yellow cursor-pointer"
              >
                {ARMOR_TIERS.map((t) => (
                  <option key={t.tier} value={t.tier}>
                    {t.name} ({t.dr}) — {t.penalty}
                  </option>
                ))}
              </select>
            </div>

            {/* Shield & Degradation */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-mb-charcoal/50 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-mb-white select-none">
                <input
                  type="checkbox"
                  checked={armor.hasShield}
                  onChange={(e) =>
                    onUpdateCharacter((prev) => ({
                      ...prev,
                      armor: { ...prev.armor, hasShield: e.target.checked },
                    }))
                  }
                  className="accent-mb-yellow w-4 h-4"
                />
                <span className="font-bold">Shield (-1 damage / sacrifice)</span>
              </label>

              {/* Degradation Counter */}
              <div className="flex items-center gap-1.5 text-mb-pink">
                <span className="text-[10px] uppercase font-bold">Degraded:</span>
                <button
                  onClick={() =>
                    onUpdateCharacter((prev) => ({
                      ...prev,
                      armor: { ...prev.armor, degraded: Math.max(0, prev.armor.degraded - 1) },
                    }))
                  }
                  className="w-4 h-4 bg-mb-charcoal text-mb-white text-xs font-bold border border-mb-black flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-mono font-bold">{armor.degraded}</span>
                <button
                  onClick={() =>
                    onUpdateCharacter((prev) => ({
                      ...prev,
                      armor: { ...prev.armor, degraded: prev.armor.degraded + 1 },
                    }))
                  }
                  className="w-4 h-4 bg-mb-charcoal text-mb-white text-xs font-bold border border-mb-black flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Defense Roll & Armor Soak Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-mb-charcoal">
            <button
              onClick={onDefend}
              className="mb-btn mb-btn-yellow text-xs py-2 flex items-center justify-center gap-1.5"
              title="Roll d20 + Agility vs DR 12 (player rolls to evade attack)"
            >
              <Shield className="w-4 h-4" />
              <span>DEFEND TEST</span>
            </button>

            <button
              onClick={onSoakArmor}
              className="mb-btn mb-btn-dark text-xs py-2 flex items-center justify-center gap-1.5"
              title="Roll armor damage reduction (-d2, -d4, -d6) + shield"
            >
              <Dices className="w-4 h-4" />
              <span>SOAK ARMOR</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Weapons List */}
        <div className="bg-mb-black p-3 border-2 border-mb-charcoal shadow-brutal-sm">
          <div className="flex items-center justify-between border-b border-mb-charcoal pb-1.5 mb-2.5">
            <div className="flex items-center gap-1.5 text-mb-yellow">
              <Sword className="w-4 h-4" />
              <h3 className="font-brutal font-black text-sm tracking-wider uppercase">
                WEAPONS & ATTACKS
              </h3>
            </div>
            <span className="text-[10px] text-mb-white/60 font-punk">
              Melee: STR • Ranged: PRES
            </span>
          </div>

          {/* List of Weapons */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 mb-2.5">
            {character.weapons.length === 0 ? (
              <p className="text-xs text-mb-white/40 italic py-2">
                Unarmed and defenseless. Add a weapon below.
              </p>
            ) : (
              character.weapons.map((wep) => (
                <div
                  key={wep.id}
                  className="flex items-center justify-between gap-2 p-1.5 bg-mb-dark border border-mb-charcoal hover:border-mb-yellow transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-mb-white truncate">
                        {wep.name}
                      </span>
                      <span className="text-[10px] bg-mb-black text-mb-yellow px-1 font-mono uppercase font-bold">
                        {wep.damageDie}
                      </span>
                      <span className="text-[9px] text-mb-white/50 uppercase">
                        [{wep.type}]
                      </span>
                    </div>
                  </div>

                  {/* Roll Attack and Damage */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onAttack(wep)}
                      className="mb-btn mb-btn-yellow text-[10px] py-0.5 px-2"
                      title={`Roll Attack with ${wep.name}`}
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>ATK</span>
                    </button>

                    <button
                      onClick={() => onDamage(wep)}
                      className="mb-btn mb-btn-pink text-[10px] py-0.5 px-2"
                      title={`Roll Damage (${wep.damageDie})`}
                    >
                      <Dices className="w-3 h-3" />
                      <span>DMG</span>
                    </button>

                    <button
                      onClick={() => handleRemoveWeapon(wep.id)}
                      className="p-1 text-mb-white/40 hover:text-mb-pink"
                      title="Remove weapon"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add New Weapon Form */}
          <form onSubmit={handleAddWeapon} className="flex gap-1.5 pt-2 border-t border-mb-charcoal">
            <input
              type="text"
              placeholder="Weapon name..."
              value={newWeaponName}
              onChange={(e) => setNewWeaponName(e.target.value)}
              className="flex-1 bg-mb-dark text-mb-white text-xs px-2 py-1 border border-mb-charcoal focus:outline-none focus:border-mb-yellow"
            />
            <select
              value={newWeaponType}
              onChange={(e) => setNewWeaponType(e.target.value as 'melee' | 'ranged')}
              className="bg-mb-dark text-mb-white text-xs px-1 border border-mb-charcoal focus:outline-none"
            >
              <option value="melee">Melee</option>
              <option value="ranged">Ranged</option>
            </select>
            <select
              value={newWeaponDamage}
              onChange={(e) => setNewWeaponDamage(e.target.value)}
              className="bg-mb-dark text-mb-white text-xs px-1 border border-mb-charcoal focus:outline-none font-mono"
            >
              <option value="d4">d4</option>
              <option value="d6">d6</option>
              <option value="d8">d8</option>
              <option value="d10">d10</option>
              <option value="d12">d12</option>
            </select>
            <button type="submit" className="mb-btn mb-btn-yellow text-xs py-1 px-2">
              <Plus className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
