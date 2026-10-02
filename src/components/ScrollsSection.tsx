import React, { useState } from 'react';
import { Scroll as ScrollIcon, Plus, Trash2, Wand2, BookOpen, AlertTriangle } from 'lucide-react';
import { Character, Scroll } from '../types/morkborg';
import { CANONICAL_SCROLLS } from '../utils/morkborgRules';
import { SectionHeader } from './SectionHeader';

interface ScrollsSectionProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onInvokeScroll: (scroll: Scroll) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isReadOnly?: boolean;
}

export const ScrollsSection: React.FC<ScrollsSectionProps> = ({
  character,
  onUpdateCharacter,
  onInvokeScroll,
  isCollapsed = false,
  onToggleCollapse,
  isReadOnly = false,
}) => {
  const [newScrollName, setNewScrollName] = useState('');
  const [newScrollType, setNewScrollType] = useState<'unclean' | 'sacred'>('unclean');
  const [newScrollDesc, setNewScrollDesc] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unclean' | 'sacred'>('all');

  const effectiveTier = Math.max(0, character.armor.tier - character.armor.degraded);
  const isArmorRestricted = effectiveTier >= 2;

  const filteredPresets = CANONICAL_SCROLLS.filter((s) => {
    if (filterType === 'all') return true;
    return s.type === filterType;
  });

  const handleAddScroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (isArmorRestricted || !newScrollName.trim()) return;

    const newScroll: Scroll = {
      id: crypto.randomUUID(),
      name: newScrollName.trim(),
      type: newScrollType,
      description: newScrollDesc.trim() || 'A cryptic mystical incantation.',
    };

    onUpdateCharacter((prev) => ({
      ...prev,
      scrolls: [...prev.scrolls, newScroll],
    }));

    setNewScrollName('');
    setNewScrollDesc('');
  };

  const handleAddPreset = (preset: Omit<Scroll, 'id'>) => {
    if (isArmorRestricted) return;
    const newScroll: Scroll = {
      id: crypto.randomUUID(),
      ...preset,
    };
    onUpdateCharacter((prev) => ({
      ...prev,
      scrolls: [...prev.scrolls, newScroll],
    }));
    setShowPresets(false);
  };

  const handleRemoveScroll = (id: string) => {
    onUpdateCharacter((prev) => ({
      ...prev,
      scrolls: prev.scrolls.filter((s) => s.id !== id),
    }));
  };

  const collapsedElement = (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      {isArmorRestricted ? (
        <span className="text-[9px] font-bold text-mb-pink border border-mb-pink px-1.5 py-0.5 uppercase">
          DISABLED (ARMOR)
        </span>
      ) : (
        <>
          <span className="text-[10px] font-mono border border-mb-charcoal bg-mb-dark px-1.5 py-0.5 text-mb-white/80">
            {character.scrolls.length} {character.scrolls.length === 1 ? 'scroll' : 'scrolls'}
          </span>

          {character.scrolls.length > 0 && (
            <button
              onClick={() => onInvokeScroll(character.scrolls[0])}
              disabled={isReadOnly}
              className={`bg-mb-pink hover:bg-pink-600 text-white font-brutal font-bold text-[10px] px-2 py-0.5 border border-black shadow-brutal-sm flex items-center gap-1 truncate max-w-[130px] active:translate-x-0.5 active:translate-y-0.5 transition-transform ${
                isReadOnly ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title={isReadOnly ? 'Sheet is locked (Read-only)' : `Invoke ${character.scrolls[0].name} (Presence DR12${character.feats?.lucky ? ' • 2d20 Lucky' : ''})`}
            >
              <Wand2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{character.scrolls[0].name}</span>
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <section className="p-2.5 bg-mb-dark border-b-2 border-mb-charcoal border-l-4 border-l-mb-pink">
      {/* Standardized Section Header */}
      <SectionHeader
        title="Scrolls & Powers"
        subtitle={character.feats?.lucky ? "Presence DR12 (2d20 Lucky)" : "Presence DR12 to Invoke"}
        icon={<ScrollIcon className="w-3.5 h-3.5 text-mb-pink" />}
        accentColor="pink"
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        collapsedElement={collapsedElement}
        rightElement={
          <button
            disabled={isArmorRestricted}
            onClick={() => !isArmorRestricted && setShowPresets(!showPresets)}
            className={`text-[10px] font-bold flex items-center gap-1 border px-2 py-0.5 transition-colors ${
              isArmorRestricted
                ? 'text-mb-white/30 border-mb-charcoal cursor-not-allowed opacity-50'
                : 'text-mb-yellow hover:text-mb-white border-mb-yellow/40 bg-mb-black'
            }`}
            title={isArmorRestricted ? 'Cannot use powers while wearing Medium or Heavy armor' : undefined}
          >
            <BookOpen className="w-3 h-3" />
            <span>{showPresets ? 'Close Library' : 'Scroll Library'}</span>
          </button>
        }
      />

      {!isCollapsed && (
        <>
          {/* Armor Restriction Banner */}
      {isArmorRestricted && (
        <div className="mb-2 p-1.5 bg-mb-pink/15 border border-mb-pink text-mb-pink flex items-center gap-2 shadow-brutal-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse text-mb-pink" />
          <div className="text-[11px] leading-tight">
            <span className="font-bold uppercase tracking-wider block text-mb-white">
              POWERS DISABLED: {effectiveTier === 2 ? 'MEDIUM ARMOR' : 'HEAVY ARMOR'} EQUIPPED
            </span>
            <span className="font-punk text-[9px] text-mb-white/80">
              Rules forbid using Powers or reading Scrolls while wearing Medium or Heavy armor.
            </span>
          </div>
        </div>
      )}

      {/* Preset Library Drawer */}
      {showPresets && (
        <div className="mb-2 p-2 bg-mb-black border border-mb-yellow shadow-brutal-sm">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-mb-charcoal flex-wrap gap-1">
            <h4 className="font-gothic text-xs text-mb-yellow">
              Canon Scrolls Library ({filteredPresets.length})
            </h4>
            <div className="flex items-center gap-1 text-[9px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-1.5 py-0.5 border ${
                  filterType === 'all'
                    ? 'bg-mb-yellow text-mb-black border-mb-yellow'
                    : 'bg-mb-dark text-mb-white/60 border-mb-charcoal hover:text-mb-white'
                }`}
              >
                ALL (20)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('unclean')}
                className={`px-1.5 py-0.5 border ${
                  filterType === 'unclean'
                    ? 'bg-mb-pink text-mb-white border-mb-pink'
                    : 'bg-mb-dark text-mb-white/60 border-mb-charcoal hover:text-mb-white'
                }`}
              >
                UNCLEAN (10)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('sacred')}
                className={`px-1.5 py-0.5 border ${
                  filterType === 'sacred'
                    ? 'bg-mb-yellow text-mb-black border-mb-yellow'
                    : 'bg-mb-dark text-mb-white/60 border-mb-charcoal hover:text-mb-white'
                }`}
              >
                SACRED (10)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
            {filteredPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPreset(p)}
                className="text-left p-1 bg-mb-dark hover:bg-mb-charcoal border border-mb-charcoal flex flex-col justify-between group"
                title={`Learn ${p.name} (${p.type})`}
              >
                <div className="flex items-center justify-between w-full gap-1">
                  <span className="font-bold text-xs text-mb-white group-hover:text-mb-yellow truncate">
                    {p.name}
                  </span>
                  <span
                    className={`text-[8px] font-mono px-1 uppercase font-bold shrink-0 ${
                      p.type === 'sacred' ? 'bg-mb-yellow text-mb-black' : 'bg-mb-pink text-mb-white'
                    }`}
                  >
                    {p.type}
                  </span>
                </div>
                <p className="font-punk text-[9px] text-mb-white/60 line-clamp-2 mt-0.5">
                  {p.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Character Scrolls List */}
      <div className={`space-y-1 max-h-36 overflow-y-auto pr-1 mb-1.5 ${isArmorRestricted ? 'opacity-50' : ''}`}>
        {character.scrolls.length === 0 ? (
          <p className="text-xs text-mb-white/40 italic py-1">
            No scrolls possessed. You wander through the darkness blind to magic.
          </p>
        ) : (
          character.scrolls.map((scroll) => (
            <div
              key={scroll.id}
              className="flex items-center justify-between gap-1.5 p-1 bg-mb-black border border-mb-charcoal hover:border-mb-yellow/60 transition-colors"
            >
              <div className="min-w-0 flex-1 truncate">
                <div className="flex items-center gap-1 truncate">
                  <span className="font-bold text-xs text-mb-white truncate">
                    {scroll.name}
                  </span>
                  <span
                    className={`text-[8px] font-mono px-1 uppercase font-bold shrink-0 ${
                      scroll.type === 'sacred'
                        ? 'bg-mb-yellow text-mb-black'
                        : 'bg-mb-pink text-mb-white'
                    }`}
                  >
                    {scroll.type}
                  </span>
                </div>
                <p className="font-punk text-[9px] text-mb-white/60 truncate">
                  {scroll.description}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  disabled={isArmorRestricted || isReadOnly}
                  onClick={() => !isArmorRestricted && !isReadOnly && onInvokeScroll(scroll)}
                  className={`text-[9px] py-0.5 px-2 flex items-center gap-1 font-brutal font-bold uppercase transition-all ${
                    isArmorRestricted || isReadOnly
                      ? 'bg-mb-charcoal text-mb-white/30 border border-mb-charcoal cursor-not-allowed'
                      : 'mb-btn mb-btn-yellow'
                  }`}
                  title={
                    isReadOnly
                      ? 'Sheet is locked (Read-only)'
                      : isArmorRestricted
                      ? 'Cannot invoke powers while wearing Medium or Heavy armor'
                      : `Test DR12 Presence to activate this power${character.feats?.lucky ? ' (2d20 Lucky)' : ''}`
                  }
                >
                  <Wand2 className="w-2.5 h-2.5" />
                  <span>INVOKE</span>
                </button>
                {!isReadOnly && (
                  <button
                    onClick={() => handleRemoveScroll(scroll.id)}
                    className="p-0.5 text-mb-white/40 hover:text-mb-pink"
                    title="Discard scroll"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Scroll Form */}
      {!isReadOnly && (
        <form onSubmit={handleAddScroll} className="pt-1.5 border-t border-mb-charcoal">
          <fieldset disabled={isArmorRestricted} className={`flex gap-1 ${isArmorRestricted ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <input
              type="text"
              placeholder={isArmorRestricted ? 'Powers disabled in armor...' : 'Scroll name...'}
              value={newScrollName}
              onChange={(e) => setNewScrollName(e.target.value)}
              className="w-1/3 bg-mb-black text-mb-white text-xs px-1.5 py-0.5 border border-mb-charcoal focus:outline-none focus:border-mb-yellow min-w-0"
            />
            <select
              value={newScrollType}
              onChange={(e) => setNewScrollType(e.target.value as 'unclean' | 'sacred')}
              className="bg-mb-black text-mb-white text-xs px-1 py-0.5 border border-mb-charcoal focus:outline-none cursor-pointer shrink-0"
            >
              <option value="unclean">Unclean</option>
              <option value="sacred">Sacred</option>
            </select>
            <input
              type="text"
              placeholder="Effect description..."
              value={newScrollDesc}
              onChange={(e) => setNewScrollDesc(e.target.value)}
              className="flex-1 bg-mb-black text-mb-white text-xs px-1.5 py-0.5 border border-mb-charcoal focus:outline-none focus:border-mb-yellow min-w-0"
            />
            <button type="submit" className="mb-btn mb-btn-yellow text-xs py-0.5 px-2 shrink-0">
              <Plus className="w-3 h-3" />
              <span>ADD</span>
            </button>
          </fieldset>
        </form>
      )}
        </>
      )}
    </section>
  );
};
