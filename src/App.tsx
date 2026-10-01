import React, { useEffect, useState } from 'react';
import { 
  AbilityName, 
  Character, 
  RollResult, 
  Scroll, 
  Weapon 
} from './types/morkborg';
import { 
  generateRandomCharacter, 
  performAbilityCheck, 
  performArmorSoak, 
  performAttack, 
  performDefend, 
  performPowerTest, 
  performShortRest, 
  performWeaponDamage,
  GettingBetterResult
} from './utils/morkborgRules';
import { OBRService } from './obr/obrService';
import { Header } from './components/Header';
import { AbilitiesGrid } from './components/AbilitiesGrid';
import { VitalsSection } from './components/VitalsSection';
import { CombatSection } from './components/CombatSection';
import { InventorySection } from './components/InventorySection';
import { ScrollsSection } from './components/ScrollsSection';
import { RestModal } from './components/RestModal';
import { RollResultModal } from './components/RollResultModal';
import { SpendOmenModal } from './components/SpendOmenModal';
import { BrokenModal } from './components/BrokenModal';
import { ExportImportModal } from './components/ExportImportModal';
import { GettingBetterModal } from './components/GettingBetterModal';
import { 
  loadCharacterFromStorage, 
  saveCharacterToStorage,
  loadCollapsedSectionsFromStorage,
  saveCollapsedSectionsToStorage,
  CollapsedSections
} from './utils/storage';

export const App: React.FC = () => {
  const [character, setCharacter] = useState<Character>(() => {
    const saved = loadCharacterFromStorage();
    if (saved) return saved;
    const fresh = generateRandomCharacter();
    saveCharacterToStorage(fresh);
    return fresh;
  });
  const [linkedToken, setLinkedToken] = useState<{ id: string; name: string } | null>(null);

  // Collapsed sections state
  const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>(() => {
    return loadCollapsedSectionsFromStorage();
  });

  const handleToggleSection = (section: keyof CollapsedSections) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [section]: !prev[section] };
      saveCollapsedSectionsToStorage(next);
      return next;
    });
  };

  const allCollapsed = Object.values(collapsedSections).every(Boolean);

  const handleToggleCollapseAll = () => {
    const targetState = !allCollapsed;
    const next: CollapsedSections = {
      header: targetState,
      abilities: targetState,
      vitals: targetState,
      combat: targetState,
      inventory: targetState,
      scrolls: targetState,
    };
    setCollapsedSections(next);
    saveCollapsedSectionsToStorage(next);
  };

  // Modals state
  const [activeRoll, setActiveRoll] = useState<RollResult | null>(null);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [isSpendOmenOpen, setIsSpendOmenOpen] = useState(false);
  const [isBrokenModalOpen, setIsBrokenModalOpen] = useState(false);
  const [isGettingBetterOpen, setIsGettingBetterOpen] = useState(false);
  const [exportImportModal, setExportImportModal] = useState<{
    isOpen: boolean;
    mode: 'export' | 'import';
  }>({ isOpen: false, mode: 'export' });
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [showLog, setShowLog] = useState(false);

  // Initialize Owlbear Rodeo SDK
  useEffect(() => {
    OBRService.init(async () => {
      // Check if there is an active selection on the map
      const selected = await OBRService.getSelectedToken();
      if (selected) {
        setLinkedToken(selected);
        const tokenChar = await OBRService.loadCharacter(selected.id);
        if (tokenChar) {
          setCharacter(tokenChar);
          return;
        }
      }

      // Fallback: load from local storage
      const localChar = await OBRService.loadCharacter();
      if (localChar) {
        setCharacter(localChar);
      }
    });

    // Listen to roll broadcasts from room
    const unsubscribe = OBRService.subscribeToRolls((payload) => {
      setRollHistory((prev) => [payload.roll, ...prev.slice(0, 19)]);
    });

    return () => unsubscribe();
  }, []);

  // Auto-persist character changes
  useEffect(() => {
    OBRService.saveCharacter(character, linkedToken?.id);
  }, [character, linkedToken]);

  // Execute and record a roll
  const triggerRoll = (roll: RollResult) => {
    setActiveRoll(roll);
    setRollHistory((prev) => [roll, ...prev.slice(0, 19)]);
    OBRService.broadcastRoll(roll, character.name);
  };

  // Roll Handlers
  const handleRollAbility = (ability: AbilityName, modifier: number, targetDR: number, drPenalty?: number) => {
    const roll = performAbilityCheck(character.name, ability, modifier, targetDR, 0, drPenalty || 0);
    triggerRoll(roll);
  };

  const handleDefend = () => {
    const effectiveTier = Math.max(0, character.armor.tier - character.armor.degraded);
    const roll = performDefend(
      character.name,
      character.abilities.agility.modifier,
      effectiveTier
    );
    triggerRoll(roll);

    // If Fumble on Defend: Degrade armor by 1 tier as per MÖRK BORG rules!
    if (roll.isFumble) {
      setCharacter((prev) => ({
        ...prev,
        armor: { ...prev.armor, degraded: prev.armor.degraded + 1 },
      }));
    }
  };

  const handleSoakArmor = () => {
    const roll = performArmorSoak(character.name, character.armor);
    triggerRoll(roll);
  };

  const handleAttack = (weapon: Weapon) => {
    const isRanged = weapon.type === 'ranged';
    const mod = isRanged
      ? character.abilities.presence.modifier
      : character.abilities.strength.modifier;
    const roll = performAttack(character.name, weapon, mod, 12);
    triggerRoll(roll);
  };

  const handleDamage = (weapon: Weapon) => {
    const roll = performWeaponDamage(character.name, weapon, false, false);
    triggerRoll(roll);
  };

  const handleInvokeScroll = (scroll: Scroll) => {
    // Check armor restrictions (Medium or Heavy armor forbids powers/scrolls)
    const effectiveTier = Math.max(0, character.armor.tier - character.armor.degraded);
    if (effectiveTier >= 2) {
      alert('You cannot channel occult powers or read scrolls while wearing Medium or Heavy armor!');
      return;
    }

    // Check powers availability
    if (character.powers.current <= 0) {
      const proceed = window.confirm(
        'You have exhausted all daily Powers (Presence + d4). Attempting another invocation risks disaster. Proceed anyway?'
      );
      if (!proceed) return;
    } else {
      // Deduct 1 daily power use
      setCharacter((prev) => ({
        ...prev,
        powers: { ...prev.powers, current: Math.max(0, prev.powers.current - 1) },
      }));
    }

    const roll = performPowerTest(
      character.name,
      scroll,
      character.abilities.presence.modifier,
      12
    );
    triggerRoll(roll);

    // If failed, takes d2 HP loss as per rules
    if (!roll.success && !roll.isFumble) {
      setCharacter((prev) => ({
        ...prev,
        hp: { ...prev.hp, current: Math.max(0, prev.hp.current - 1) },
      }));
    }
  };

  // Long Rest Handler
  const handleConfirmLongRest = (
    healedHp: number,
    newHp: number,
    newOmens: number,
    newPowers: number,
    restLog: string
  ) => {
    setCharacter((prev) => ({
      ...prev,
      hp: { ...prev.hp, current: newHp },
      omens: { ...prev.omens, current: newOmens },
      powers: { ...prev.powers, current: newPowers, max: Math.max(1, newPowers) },
    }));

    const roll: RollResult = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      characterName: character.name,
      type: 'rest',
      title: "Night's Sleep (Long Rest)",
      roll: healedHp,
      modifier: 0,
      total: healedHp,
      details: restLog,
      flavor: 'The dying world grants you another grim sunrise.',
    };
    triggerRoll(roll);
  };

  // Short Rest Handler
  const handleShortRest = () => {
    const rest = performShortRest(character);
    setCharacter((prev) => ({
      ...prev,
      hp: { ...prev.hp, current: rest.newHp },
    }));

    const roll: RollResult = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      characterName: character.name,
      type: 'rest',
      title: 'Catch Breath (Short Rest)',
      roll: rest.healedHp,
      modifier: 0,
      total: rest.healedHp,
      details: rest.rollsLog,
      flavor: 'A sip of foul water keeps death at bay.',
    };
    triggerRoll(roll);
  };

  // Omen Spending Handler
  const handleApplyOmen = (effectTitle: string, details: string) => {
    if (character.omens.current <= 0) return;

    setCharacter((prev) => ({
      ...prev,
      omens: { ...prev.omens, current: Math.max(0, prev.omens.current - 1) },
    }));

    const roll: RollResult = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      characterName: character.name,
      type: 'omen_spend',
      title: `Omen Spent: ${effectTitle}`,
      roll: 1,
      modifier: 0,
      total: 1,
      details,
      flavor: 'Fate contorts to delay your inevitable doom.',
    };
    triggerRoll(roll);
  };

  // Reroll from Roll Modal using Omen
  const handleSpendOmenReroll = () => {
    if (!activeRoll || character.omens.current <= 0) return;

    setCharacter((prev) => ({
      ...prev,
      omens: { ...prev.omens, current: Math.max(0, prev.omens.current - 1) },
    }));

    if (activeRoll.type === 'ability') {
      const ability = activeRoll.title.split(' ')[0].toLowerCase() as AbilityName;
      const mod = character.abilities[ability]?.modifier ?? 0;
      const targetDR = activeRoll.targetDR ?? 12;
      const roll = performAbilityCheck(character.name, ability, mod, targetDR);
      roll.details += ' (Rerolled using Omen!)';
      triggerRoll(roll);
    } else if (activeRoll.type === 'defense') {
      handleDefend();
    } else if (activeRoll.type === 'attack') {
      const wep = character.weapons[0];
      if (wep) handleAttack(wep);
    }
  };

  // Lower DR from Roll Modal using Omen
  const handleSpendOmenLowerDR = () => {
    if (!activeRoll || character.omens.current <= 0 || !activeRoll.targetDR) return;

    setCharacter((prev) => ({
      ...prev,
      omens: { ...prev.omens, current: Math.max(0, prev.omens.current - 1) },
    }));

    const newTargetDR = Math.max(2, activeRoll.targetDR - 4);
    const newSuccess = activeRoll.total >= newTargetDR;

    const updatedRoll: RollResult = {
      ...activeRoll,
      targetDR: newTargetDR,
      success: newSuccess,
      details: `${activeRoll.details} -> DR lowered to ${newTargetDR} via Omen! (${newSuccess ? 'SUCCESS' : 'FAILED'})`,
    };
    setActiveRoll(updatedRoll);
    OBRService.broadcastRoll(updatedRoll, character.name);
  };

  // Broken Table Result Handler
  const handleApplyBrokenResult = (result: {
    roll: number;
    title: string;
    description: string;
    hpGained?: number;
    hoursDisabled?: number;
  }) => {
    if (result.hpGained) {
      setCharacter((prev) => ({
        ...prev,
        hp: { ...prev.hp, current: result.hpGained! },
        broken: { isBroken: false, result },
      }));
    } else {
      setCharacter((prev) => ({
        ...prev,
        broken: { isBroken: true, result },
      }));
    }

    const roll: RollResult = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      characterName: character.name,
      type: 'broken',
      title: `Broken Table: [${result.roll}] ${result.title}`,
      roll: result.roll,
      modifier: 0,
      total: result.roll,
      details: result.description,
      flavor: result.roll === 1 ? 'YOUR MISERABLE JOURNEY ENDS.' : 'Scarred, broken, but still breathing.',
    };
    triggerRoll(roll);
  };

  // Getting Better
  const handleApplyGettingBetter = (result: GettingBetterResult, updatedCharacter: Character) => {
    setCharacter(updatedCharacter);
    saveCharacterToStorage(updatedCharacter);
    const roll: RollResult = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      characterName: character.name,
      type: 'ability',
      title: 'Getting Better (or worse)',
      roll: result.debrisRoll,
      modifier: 0,
      total: result.hpRollSum,
      details: result.summary,
      flavor: 'An encounter survived, treasure recovered, or scenario completed.',
    };
    triggerRoll(roll);
  };

  // Scvmbirther Generator
  const handleScvmbirther = () => {
    const confirmed = window.confirm(
      'Spawn a new random doomed scum? This will overwrite your current character sheet.'
    );
    if (confirmed) {
      const newChar = generateRandomCharacter();
      setCharacter(newChar);
      saveCharacterToStorage(newChar);
    }
  };

  // Link to selected Token
  const handleLinkToken = async () => {
    const selected = await OBRService.getSelectedToken();
    if (selected) {
      setLinkedToken(selected);
      await OBRService.saveCharacter(character, selected.id);
      alert(`Sheet successfully bound to token "${selected.name}"!`);
    } else {
      alert('Select a character token on the map first, then click TOKEN to bind.');
    }
  };

  // Export JSON
  const handleExport = () => {
    setExportImportModal({ isOpen: true, mode: 'export' });
  };

  // Import JSON
  const handleImport = () => {
    setExportImportModal({ isOpen: true, mode: 'import' });
  };

  return (
    <div className="min-h-screen bg-mb-black text-mb-white flex flex-col font-brutal">
      {/* 1. Header & Identity */}
      <Header
        character={character}
        onUpdateCharacter={setCharacter}
        onScvmbirther={handleScvmbirther}
        onOpenLongRest={() => setIsRestModalOpen(true)}
        onShortRest={handleShortRest}
        onLinkToken={handleLinkToken}
        linkedTokenName={linkedToken?.name}
        onExport={handleExport}
        onImport={handleImport}
        allCollapsed={allCollapsed}
        onToggleCollapseAll={handleToggleCollapseAll}
        isCollapsed={collapsedSections.header}
        onToggleCollapse={() => handleToggleSection('header')}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* 2. Core Abilities with Roll Buttons */}
        <AbilitiesGrid
          character={character}
          onUpdateCharacter={setCharacter}
          onRollAbility={handleRollAbility}
          onOpenGettingBetter={() => setIsGettingBetterOpen(true)}
          isCollapsed={collapsedSections.abilities}
          onToggleCollapse={() => handleToggleSection('abilities')}
        />

        {/* 3. Vitals: HP, Omens, Powers, Silver */}
        <VitalsSection
          character={character}
          onUpdateCharacter={setCharacter}
          onOpenSpendOmen={() => setIsSpendOmenOpen(true)}
          onOpenBrokenModal={() => setIsBrokenModalOpen(true)}
          isCollapsed={collapsedSections.vitals}
          onToggleCollapse={() => handleToggleSection('vitals')}
        />

        {/* 4. Combat: Armor, Defense, Weapons */}
        <CombatSection
          character={character}
          onUpdateCharacter={setCharacter}
          onDefend={handleDefend}
          onSoakArmor={handleSoakArmor}
          onAttack={handleAttack}
          onDamage={handleDamage}
          isCollapsed={collapsedSections.combat}
          onToggleCollapse={() => handleToggleSection('combat')}
        />

        {/* 5. Inventory & Encumbrance */}
        <InventorySection
          character={character}
          onUpdateCharacter={setCharacter}
          isCollapsed={collapsedSections.inventory}
          onToggleCollapse={() => handleToggleSection('inventory')}
        />

        {/* 6. Scrolls & Occult Powers */}
        <ScrollsSection
          character={character}
          onUpdateCharacter={setCharacter}
          onInvokeScroll={handleInvokeScroll}
          isCollapsed={collapsedSections.scrolls}
          onToggleCollapse={() => handleToggleSection('scrolls')}
        />

        {/* Roll History Log Drawer */}
        {showLog && (
          <section className="p-3 bg-mb-dark border-t-2 border-mb-yellow animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-mb-charcoal">
              <span className="font-gothic text-base text-mb-yellow">Recent Dice Rolls ({rollHistory.length})</span>
              <button
                onClick={() => setRollHistory([])}
                className="text-[10px] text-mb-white/60 hover:text-mb-pink font-mono uppercase"
              >
                Clear Log
              </button>
            </div>
            {rollHistory.length === 0 ? (
              <p className="text-xs text-mb-white/40 italic py-1">No rolls recorded yet.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {rollHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-1 bg-mb-black border border-mb-charcoal text-[11px]"
                  >
                    <span className="font-bold text-mb-white truncate">
                      {item.characterName}: {item.title}
                    </span>
                    <span
                      className={`font-mono font-bold shrink-0 ${
                        item.isCrit
                          ? 'text-mb-yellow'
                          : item.isFumble
                          ? 'text-mb-pink'
                          : item.success === true
                          ? 'text-green-400'
                          : item.success === false
                          ? 'text-mb-pink'
                          : 'text-mb-white'
                      }`}
                    >
                      {item.total} {item.targetDR ? `vs DR ${item.targetDR}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer / Doom Reminder */}
      <footer className="bg-mb-dark p-2 border-t-2 border-mb-charcoal flex items-center justify-between text-[10px] text-mb-white/50 font-punk">
        <span>MÖRK BORG is © Ockult Örtmästare Games & Stockholm Kartell.</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleCollapseAll}
            className="text-mb-white/70 hover:text-mb-yellow border border-mb-charcoal hover:border-mb-yellow/40 px-2 py-0.5 font-bold uppercase font-brutal text-[10px]"
          >
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </button>
          <button
            onClick={() => setShowLog(!showLog)}
            className="text-mb-yellow hover:text-mb-white border border-mb-yellow/40 px-2 py-0.5 font-bold uppercase font-brutal"
          >
            {showLog ? 'Hide Roll Log' : `Roll Log (${rollHistory.length})`}
          </button>
        </div>
      </footer>

      {/* MODALS */}
      <RestModal
        character={character}
        isOpen={isRestModalOpen}
        onClose={() => setIsRestModalOpen(false)}
        onConfirmLongRest={handleConfirmLongRest}
      />

      <SpendOmenModal
        isOpen={isSpendOmenOpen}
        omensAvailable={character.omens.current}
        onClose={() => setIsSpendOmenOpen(false)}
        onApplyOmen={handleApplyOmen}
      />

      <BrokenModal
        isOpen={isBrokenModalOpen}
        onClose={() => setIsBrokenModalOpen(false)}
        onApplyBrokenResult={handleApplyBrokenResult}
      />

      <GettingBetterModal
        character={character}
        isOpen={isGettingBetterOpen}
        onClose={() => setIsGettingBetterOpen(false)}
        onApplyGettingBetter={handleApplyGettingBetter}
      />

      <RollResultModal
        roll={activeRoll}
        omensAvailable={character.omens.current}
        onClose={() => setActiveRoll(null)}
        onSpendOmenReroll={handleSpendOmenReroll}
        onSpendOmenLowerDR={handleSpendOmenLowerDR}
      />

      <ExportImportModal
        isOpen={exportImportModal.isOpen}
        mode={exportImportModal.mode}
        character={character}
        onClose={() => setExportImportModal((prev) => ({ ...prev, isOpen: false }))}
        onImportCharacter={(imported) => {
          setCharacter(imported);
          saveCharacterToStorage(imported);
        }}
      />
    </div>
  );
};
export default App;
