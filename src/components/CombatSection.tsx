import React, { useState } from 'react';
import { Shield, Sword, Plus, Trash2, Dices, Crosshair } from 'lucide-react';
import { ArmorTier, Character, Weapon } from '../types/morkborg';
import { isValidDiceFormula } from '../utils/dice';
import { SectionHeader } from './SectionHeader';

interface CombatSectionProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onDefend: () => void;
  onSoakArmor: () => void;
  onAttack: (weapon: Weapon) => void;
  onDamage: (weapon: Weapon) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isReadOnly?: boolean;
}

const ARMOR_TIERS: { tier: ArmorTier; name: string; dr: string; penalty: string }[] = [
  { tier: 0, name: 'Tier 0: None', dr: '0', penalty: '0 slots • No penalty' },
  { tier: 1, name: 'Tier 1: Light', dr: '-d2', penalty: '1 slot • Leather / Gambeson' },
  { tier: 2, name: 'Tier 2: Medium', dr: '-d4', penalty: '1 slot • +2 DR Agi (incl. def) • No powers' },
  { tier: 3, name: 'Tier 3: Heavy', dr: '-d6', penalty: '1 slot • +4 DR Agi (def +2) • No powers' },
];

export const CombatSection: React.FC<CombatSectionProps> = ({
  character,
  onUpdateCharacter,
  onDefend,
  onSoakArmor,
  onAttack,
  onDamage,
  isCollapsed = false,
  onToggleCollapse,
  isReadOnly = false,
}) => {
  const [newWeaponName, setNewWeaponName] = useState('');
  const [newWeaponType, setNewWeaponType] = useState<'melee' | 'ranged'>('melee');
  const [newWeaponDamage, setNewWeaponDamage] = useState('d6');
  const [customDamage, setCustomDamage] = useState('');
  const [isCustomDamage, setIsCustomDamage] = useState(false);

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

    let damageDie = newWeaponDamage;
    if (isCustomDamage) {
      const trimmed = customDamage.trim();
      if (!trimmed) {
        alert('Please enter a custom damage die (e.g. 2d6, 1d8+1).');
        return;
      }
      if (!isValidDiceFormula(trimmed)) {
        alert(`Invalid dice formula "${trimmed}". Use standard notation such as 2d6, 1d8+1, or d10-1.`);
        return;
      }
      damageDie = trimmed.toLowerCase().replace(/\s+/g, '');
    }

    const newWep: Weapon = {
      id: crypto.randomUUID(),
      name: newWeaponName.trim(),
      type: newWeaponType,
      damageDie,
    };

    onUpdateCharacter((prev) => ({
      ...prev,
      weapons: [...prev.weapons, newWep],
    }));

    setNewWeaponName('');
    if (isCustomDamage) {
      setCustomDamage('');
    }
  };

  const handleRemoveWeapon = (id: string) => {
    onUpdateCharacter((prev) => ({
      ...prev,
      weapons: prev.weapons.filter((w) => w.id !== id),
    }));
  };

  const collapsedElement = (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      {/* Armor Soak Badge */}
      <span className="text-[10px] font-mono border border-mb-charcoal bg-mb-dark px-1.5 py-0.5 text-mb-white">
        SOAK: <strong className="text-mb-yellow">{effectiveTier > 0 ? (effectiveTier === 1 ? '-d2' : effectiveTier === 2 ? '-d4' : '-d6') : '0'}{armor.hasShield ? ' -1' : ''}</strong>
      </span>

      {/* Tier Penalty Badge if active */}
      {effectiveTier >= 2 && (
        <span className="text-[9px] font-bold text-mb-pink border border-mb-pink px-1 uppercase">
          {effectiveTier === 2 ? '+2 DEF' : '+2 DEF'}
        </span>
      )}

      {/* Defend Roll Button */}
      <button
        onClick={onDefend}
        disabled={isReadOnly}
        className={`bg-mb-bone hover:bg-stone-300 text-mb-black font-brutal font-bold text-[10px] px-2 py-0.5 border border-black shadow-brutal-sm flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 transition-transform ${
          isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        title={isReadOnly ? 'Sheet is locked (Read-only)' : 'Roll Agility Defence against incoming attack'}
      >
        <Shield className="w-3 h-3" />
        <span>DEFEND</span>
      </button>

      {/* Primary Weapon Attack Button */}
      {character.weapons.length > 0 && (
        <button
          onClick={() => onAttack(character.weapons[0])}
          disabled={isReadOnly}
          className={`bg-mb-yellow hover:bg-yellow-300 text-mb-black font-brutal font-bold text-[10px] px-2 py-0.5 border border-black shadow-brutal-sm flex items-center gap-1 truncate max-w-[130px] active:translate-x-0.5 active:translate-y-0.5 transition-transform ${
            isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title={isReadOnly ? 'Sheet is locked (Read-only)' : `Attack with ${character.weapons[0].name} (${character.weapons[0].damageDie})`}
        >
          <Sword className="w-3 h-3 shrink-0" />
          <span className="truncate">{character.weapons[0].name}</span>
        </button>
      )}
    </div>
  );

  return (
    <section className="p-2.5 bg-mb-dark border-b-2 border-mb-charcoal border-l-4 border-l-mb-bone">
      {/* Standardized Section Header */}
      <SectionHeader
        title="Combat & Weapons"
        subtitle="Armor • Attacks • Defense"
        icon={<Sword className="w-3.5 h-3.5 text-mb-bone" />}
        accentColor="bone"
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        collapsedElement={collapsedElement}
        rightElement={
          effectiveTier >= 2 ? (
            <span className="text-[9px] font-bold text-mb-pink border border-mb-pink px-1 uppercase">
              {effectiveTier === 2 ? 'MED ARMOR (+2 DEF)' : 'HVY ARMOR (+2 DEF)'}
            </span>
          ) : undefined
        }
      />

      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* LEFT COLUMN: Armor & Defense */}
        <div className="bg-mb-black p-2 border border-mb-charcoal shadow-brutal-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-mb-charcoal pb-1 mb-2">
              <div className="flex items-center gap-1 text-mb-bone">
                <Shield className="w-3.5 h-3.5" />
                <h3 className="font-brutal font-black text-xs tracking-wider uppercase">
                  ARMOR & DEFENSE
                </h3>
              </div>
              <span className="text-[9px] font-mono text-mb-white/60">
                SOAK: {effectiveTier > 0 ? (effectiveTier === 1 ? '-d2' : effectiveTier === 2 ? '-d4' : '-d6') : '0'}
                {armor.hasShield ? ' -1' : ''}
              </span>
            </div>

            {/* Armor Configuration */}
            <div className="space-y-1.5 mb-2">
              <div>
                <label className="block text-[9px] font-bold text-mb-white/60 uppercase mb-0.5">
                  ARMOR TIER
                </label>
                <select
                  value={armor.tier}
                  disabled={isReadOnly}
                  onChange={(e) => handleTierChange(Number(e.target.value) as ArmorTier)}
                  className={`w-full bg-mb-dark text-mb-white border border-mb-charcoal font-brutal text-xs py-1 px-1.5 focus:outline-none focus:border-mb-yellow cursor-pointer truncate ${
                    isReadOnly ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {ARMOR_TIERS.map((t) => (
                    <option key={t.tier} value={t.tier}>
                      {t.name} ({t.dr}) — {t.penalty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shield & Degradation */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-mb-charcoal/50 text-[11px]">
                <label className={`flex items-center gap-1.5 cursor-pointer text-mb-white select-none ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={armor.hasShield}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      onUpdateCharacter((prev) => ({
                        ...prev,
                        armor: { ...prev.armor, hasShield: e.target.checked },
                      }))
                    }
                    className="accent-mb-yellow w-3.5 h-3.5"
                  />
                  <span>Shield (-1 soak • 1 slot)</span>
                </label>

                {/* Degradation Counter */}
                <div className="flex items-center gap-1 text-mb-pink">
                  <span className="text-[9px] uppercase font-bold text-mb-white/60">Degraded:</span>
                  <button
                    onClick={() =>
                      onUpdateCharacter((prev) => ({
                        ...prev,
                        armor: { ...prev.armor, degraded: Math.max(0, prev.armor.degraded - 1) },
                      }))
                    }
                    disabled={isReadOnly}
                    className="w-4 h-4 bg-mb-charcoal text-mb-white text-[10px] font-bold border border-mb-black flex items-center justify-center hover:bg-mb-pink disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-xs">{armor.degraded}</span>
                  <button
                    onClick={() =>
                      onUpdateCharacter((prev) => ({
                        ...prev,
                        armor: { ...prev.armor, degraded: prev.armor.degraded + 1 },
                      }))
                    }
                    disabled={isReadOnly}
                    className="w-4 h-4 bg-mb-charcoal text-mb-white text-[10px] font-bold border border-mb-black flex items-center justify-center hover:bg-mb-pink disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Defense Roll & Armor Soak Buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-mb-charcoal">
            <button
              onClick={onDefend}
              disabled={isReadOnly}
              className={`mb-btn mb-btn-yellow text-[11px] py-1 flex items-center justify-center gap-1 ${
                isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title={isReadOnly ? 'Sheet is locked (Read-only)' : `Roll d20 + Agility vs DR ${12 + (effectiveTier >= 2 ? 2 : 0)} (player rolls to evade attack)`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>DEFEND {effectiveTier >= 2 ? '(DR14)' : '(DR12)'}</span>
            </button>

            <button
              onClick={onSoakArmor}
              disabled={isReadOnly}
              className={`mb-btn mb-btn-dark text-[11px] py-1 flex items-center justify-center gap-1 ${
                isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title={isReadOnly ? 'Sheet is locked (Read-only)' : "Roll armor damage reduction (-d2, -d4, -d6) + shield"}
            >
              <Dices className="w-3.5 h-3.5" />
              <span>SOAK ARMOR</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Weapons List */}
        <div className="bg-mb-black p-2 border border-mb-charcoal shadow-brutal-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-mb-charcoal pb-1 mb-1.5">
              <div className="flex items-center gap-1 text-mb-yellow">
                <Sword className="w-3.5 h-3.5" />
                <h3 className="font-brutal font-black text-xs tracking-wider uppercase">
                  WEAPONS & ATTACKS
                </h3>
              </div>
              <span className="text-[9px] text-mb-white/50 font-punk">
                Melee: STR • Ranged: PRES
              </span>
            </div>

            {/* List of Weapons */}
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1 mb-1.5">
              {character.weapons.length === 0 ? (
                <p className="text-[11px] text-mb-white/40 italic py-1">
                  Unarmed and defenseless. Add a weapon below.
                </p>
              ) : (
                character.weapons.map((wep) => (
                  <div
                    key={wep.id}
                    className="flex items-center justify-between gap-1.5 p-1 bg-mb-dark border border-mb-charcoal hover:border-mb-yellow/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-1 truncate">
                      <span className="font-bold text-xs text-mb-white truncate">
                        {wep.name}
                      </span>
                      <span className="text-[9px] bg-mb-black text-mb-yellow px-1 font-mono uppercase font-bold shrink-0">
                        {wep.damageDie}
                      </span>
                      <span className="text-[8px] text-mb-white/50 uppercase shrink-0">
                        [{wep.type[0]}]
                      </span>
                    </div>

                    {/* Roll Attack and Damage */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onAttack(wep)}
                        disabled={isReadOnly}
                        className={`mb-btn mb-btn-yellow text-[9px] py-0.5 px-1.5 ${
                          isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                        title={isReadOnly ? 'Sheet is locked (Read-only)' : `Roll Attack with ${wep.name}`}
                      >
                        <Crosshair className="w-2.5 h-2.5" />
                        <span>ATK</span>
                      </button>

                      <button
                        onClick={() => onDamage(wep)}
                        disabled={isReadOnly}
                        className={`mb-btn mb-btn-pink text-[9px] py-0.5 px-1.5 ${
                          isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                        title={isReadOnly ? 'Sheet is locked (Read-only)' : `Roll Damage (${wep.damageDie})`}
                      >
                        <Dices className="w-2.5 h-2.5" />
                        <span>DMG</span>
                      </button>

                      {!isReadOnly && (
                        <button
                          onClick={() => handleRemoveWeapon(wep.id)}
                          className="p-0.5 text-mb-white/40 hover:text-mb-pink"
                          title="Remove weapon"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add New Weapon Form */}
          {!isReadOnly && (
            <form onSubmit={handleAddWeapon} className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-mb-charcoal">
              <input
                type="text"
                placeholder="Weapon name..."
                value={newWeaponName}
                onChange={(e) => setNewWeaponName(e.target.value)}
                className="flex-1 bg-mb-dark text-mb-white text-xs px-1.5 py-0.5 border border-mb-charcoal focus:outline-none focus:border-mb-yellow min-w-[110px]"
              />
              <select
                value={newWeaponType}
                onChange={(e) => setNewWeaponType(e.target.value as 'melee' | 'ranged')}
                className="bg-mb-dark text-mb-white text-xs px-1 py-0.5 border border-mb-charcoal focus:outline-none cursor-pointer shrink-0"
              >
                <option value="melee">Melee</option>
                <option value="ranged">Ranged</option>
              </select>
              <select
                value={isCustomDamage ? 'custom' : newWeaponDamage}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomDamage(true);
                  } else {
                    setIsCustomDamage(false);
                    setNewWeaponDamage(e.target.value);
                  }
                }}
                className="bg-mb-dark text-mb-white text-xs px-1 py-0.5 border border-mb-charcoal focus:outline-none font-mono cursor-pointer shrink-0"
              >
                <option value="d4">d4</option>
                <option value="d6">d6</option>
                <option value="d8">d8</option>
                <option value="d10">d10</option>
                <option value="d12">d12</option>
                <option value="custom">Custom...</option>
              </select>
              {isCustomDamage && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <input
                    type="text"
                    placeholder="2d6, 1d8+1"
                    value={customDamage}
                    onChange={(e) => setCustomDamage(e.target.value)}
                    className="w-20 bg-mb-dark text-mb-yellow placeholder:text-mb-white/30 text-xs px-1.5 py-0.5 border border-mb-yellow focus:outline-none font-mono"
                    autoFocus
                    title="Enter custom dice formula (e.g. 2d6, 1d8+1, 2d4-1)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDamage(false);
                      setNewWeaponDamage('d6');
                    }}
                    className="text-[10px] text-mb-white/40 hover:text-mb-pink px-0.5"
                    title="Cancel custom damage"
                  >
                    ✕
                  </button>
                </div>
              )}
              <button type="submit" className="mb-btn mb-btn-yellow text-xs py-0.5 px-1.5 shrink-0">
                <Plus className="w-3 h-3" />
              </button>
            </form>
          )}
        </div>
      </div>
      )}
    </section>
  );
};
