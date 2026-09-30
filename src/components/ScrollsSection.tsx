import React, { useState } from 'react';
import { Scroll as ScrollIcon, Plus, Trash2, Wand2, BookOpen } from 'lucide-react';
import { Character, Scroll } from '../types/morkborg';

interface ScrollsSectionProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onInvokeScroll: (scroll: Scroll) => void;
}

const PRESET_SCROLLS: Omit<Scroll, 'id'>[] = [
  { name: "Palmaum's Step", type: 'unclean', description: 'Levitate and glide across chasms or water for d6 minutes.' },
  { name: 'Tephra Prognostic', type: 'unclean', description: 'Read ashes to divine a cryptic truth or warning from the GM.' },
  { name: 'Metamorphosis', type: 'unclean', description: 'Assume the form of an insignificant vermin (rat, bat, spider) for 10 minutes.' },
  { name: 'Tongue of the Basilisk', type: 'unclean', description: 'Spit noxious venom dealing d8 damage (DR12 Presence to aim).' },
  { name: 'Nine Pale Palms', type: 'sacred', description: 'Conjures spectral floating palms absorbing 2d6 incoming damage.' },
  { name: "Roskoe's Consuming Glare", type: 'sacred', description: 'A creature bursts into yellow blinding flames taking d10 damage.' },
  { name: 'Grace for a Sinner', type: 'sacred', description: 'Cleanse poison, disease, or infection, and restore d4 HP.' },
  { name: 'Enochian Teleport', type: 'sacred', description: 'Vanish into black smoke and reappear 30 paces away.' },
];

export const ScrollsSection: React.FC<ScrollsSectionProps> = ({
  character,
  onUpdateCharacter,
  onInvokeScroll,
}) => {
  const [newScrollName, setNewScrollName] = useState('');
  const [newScrollType, setNewScrollType] = useState<'unclean' | 'sacred'>('unclean');
  const [newScrollDesc, setNewScrollDesc] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const handleAddScroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScrollName.trim()) return;

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

  return (
    <section className="p-3 bg-mb-dark border-b-2 border-mb-charcoal">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-mb-charcoal pb-1.5 mb-2.5">
        <div className="flex items-center gap-2">
          <ScrollIcon className="w-4 h-4 text-mb-yellow" />
          <h3 className="font-brutal font-black text-sm tracking-wider uppercase text-mb-white">
            SCROLLS & OCCULT POWERS
          </h3>
          <span className="font-punk text-[10px] text-mb-white/60">
            (DR12 Presence to invoke • 1 hr cooldown & d2 dmg on fail)
          </span>
        </div>

        <button
          onClick={() => setShowPresets(!showPresets)}
          className="text-xs font-bold text-mb-yellow hover:text-mb-white flex items-center gap-1 border border-mb-yellow/40 px-1.5 py-0.5"
        >
          <BookOpen className="w-3 h-3" />
          <span>{showPresets ? 'Close Library' : 'Scroll Library'}</span>
        </button>
      </div>

      {/* Preset Library Drawer */}
      {showPresets && (
        <div className="mb-3 p-2 bg-mb-black border-2 border-mb-yellow shadow-brutal-sm">
          <h4 className="font-gothic text-sm text-mb-yellow mb-1.5">
            Canon Scrolls Library (Click to Learn)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {PRESET_SCROLLS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleAddPreset(p)}
                className="text-left p-1.5 bg-mb-dark hover:bg-mb-charcoal border border-mb-charcoal flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-mb-white group-hover:text-mb-yellow">
                    {p.name}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1 uppercase font-bold ${
                      p.type === 'sacred' ? 'bg-mb-yellow text-mb-black' : 'bg-mb-pink text-mb-white'
                    }`}
                  >
                    {p.type}
                  </span>
                </div>
                <p className="font-punk text-[10px] text-mb-white/60 mt-0.5 line-clamp-2">
                  {p.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Character Scrolls List */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 mb-2.5">
        {character.scrolls.length === 0 ? (
          <p className="text-xs text-mb-white/40 italic py-2">
            No scrolls possessed. You wander through the darkness blind to magic.
          </p>
        ) : (
          character.scrolls.map((scroll) => (
            <div
              key={scroll.id}
              className="flex items-center justify-between gap-2 p-2 bg-mb-black border border-mb-charcoal hover:border-mb-yellow transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-bold text-xs text-mb-white truncate">
                    {scroll.name}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1 uppercase font-bold ${
                      scroll.type === 'sacred'
                        ? 'bg-mb-yellow text-mb-black'
                        : 'bg-mb-pink text-mb-white'
                    }`}
                  >
                    {scroll.type}
                  </span>
                </div>
                <p className="font-punk text-[10px] text-mb-white/70 line-clamp-1">
                  {scroll.description}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onInvokeScroll(scroll)}
                  className="mb-btn mb-btn-yellow text-[10px] py-1 px-2.5"
                  title="Test DR12 Presence to activate this power"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>INVOKE (DR12)</span>
                </button>
                <button
                  onClick={() => handleRemoveScroll(scroll.id)}
                  className="p-1 text-mb-white/40 hover:text-mb-pink"
                  title="Discard scroll"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Scroll Form */}
      <form onSubmit={handleAddScroll} className="flex flex-wrap gap-1.5 pt-2 border-t border-mb-charcoal">
        <input
          type="text"
          placeholder="Scroll name..."
          value={newScrollName}
          onChange={(e) => setNewScrollName(e.target.value)}
          className="flex-1 min-w-[140px] bg-mb-black text-mb-white text-xs px-2 py-1 border border-mb-charcoal focus:outline-none focus:border-mb-yellow"
        />
        <select
          value={newScrollType}
          onChange={(e) => setNewScrollType(e.target.value as 'unclean' | 'sacred')}
          className="bg-mb-black text-mb-white text-xs px-1 border border-mb-charcoal focus:outline-none"
        >
          <option value="unclean">Unclean</option>
          <option value="sacred">Sacred</option>
        </select>
        <input
          type="text"
          placeholder="Effect description..."
          value={newScrollDesc}
          onChange={(e) => setNewScrollDesc(e.target.value)}
          className="flex-1 min-w-[180px] bg-mb-black text-mb-white text-xs px-2 py-1 border border-mb-charcoal focus:outline-none focus:border-mb-yellow"
        />
        <button type="submit" className="mb-btn mb-btn-yellow text-xs py-1 px-2">
          <Plus className="w-3 h-3" />
          <span>ADD</span>
        </button>
      </form>
    </section>
  );
};
