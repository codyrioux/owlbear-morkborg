import React, { useState } from 'react';
import { Package, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Character, InventoryItem } from '../types/morkborg';
import { calculateCarryingCapacity } from '../utils/morkborgRules';

interface InventorySectionProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  character,
  onUpdateCharacter,
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemSlots, setNewItemSlots] = useState<number>(1);
  const [newItemQty, setNewItemQty] = useState<number>(1);

  const capacity = calculateCarryingCapacity(
    character.abilities.strength.modifier,
    character.inventory,
    character.silver,
    character.armor
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      slots: newItemSlots,
      quantity: newItemQty,
    };

    onUpdateCharacter((prev) => ({
      ...prev,
      inventory: [...prev.inventory, newItem],
    }));

    setNewItemName('');
    setNewItemQty(1);
  };

  const handleRemoveItem = (id: string) => {
    onUpdateCharacter((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateQty = (id: string, delta: number) => {
    onUpdateCharacter((prev) => ({
      ...prev,
      inventory: prev.inventory
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as InventoryItem[],
    }));
  };

  return (
    <section className="p-3 bg-mb-black border-b-2 border-mb-charcoal">
      {/* Header & Capacity Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-mb-charcoal pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-mb-yellow" />
          <h3 className="font-brutal font-black text-sm tracking-wider uppercase text-mb-white">
            EQUIPMENT & GEAR
          </h3>
          <span className="font-punk text-[10px] text-mb-white/60">
            (MAX: STR + 8 SLOTS)
          </span>
        </div>

        {/* Capacity Indicator */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono">
            <span
              className={`font-black ${
                capacity.isOverencumbered ? 'text-mb-pink' : 'text-mb-yellow'
              }`}
            >
              {capacity.usedSlots}
            </span>
            <span className="text-mb-white/50"> / {capacity.maxSlots} SLOTS</span>
            {(capacity.armorSlots > 0 || capacity.shieldSlots > 0) && (
              <span className="text-[10px] text-mb-white/60 font-punk ml-1">
                ({[
                  capacity.armorSlots > 0 ? 'armor: 1' : null,
                  capacity.shieldSlots > 0 ? 'shield: 1' : null,
                ].filter(Boolean).join(', ')})
              </span>
            )}
          </div>
          {capacity.isOverencumbered && (
            <div className="flex items-center gap-1 bg-mb-pink text-mb-white text-[10px] font-bold px-1.5 py-0.5 border border-mb-pink animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>OVERENCUMBERED (+2 DR TO STR & AGI)</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Grid / List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1 mb-2.5">
        {character.inventory.length === 0 ? (
          <p className="text-xs text-mb-white/40 italic py-2 col-span-full">
            You carry nothing. Scavenge to survive.
          </p>
        ) : (
          character.inventory.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 p-1.5 bg-mb-dark border border-mb-charcoal hover:border-mb-white/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-mb-white truncate">
                    {item.name}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-[10px] font-mono text-mb-yellow">
                      x{item.quantity}
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-mb-white/50 font-mono">
                  {item.slots * item.quantity} slot(s) {item.slots > 1 && '(Heavy)'}
                </div>
              </div>

              {/* Quantity buttons & delete */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleUpdateQty(item.id, -1)}
                  className="w-4 h-4 bg-mb-charcoal text-mb-white text-xs font-bold flex items-center justify-center hover:bg-mb-pink"
                >
                  -
                </button>
                <button
                  onClick={() => handleUpdateQty(item.id, 1)}
                  className="w-4 h-4 bg-mb-charcoal text-mb-white text-xs font-bold flex items-center justify-center hover:bg-mb-yellow hover:text-mb-black"
                >
                  +
                </button>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-0.5 text-mb-white/40 hover:text-mb-pink ml-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Item Form */}
      <form onSubmit={handleAddItem} className="flex flex-wrap gap-1.5 pt-2 border-t border-mb-charcoal">
        <input
          type="text"
          placeholder="New item name..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1 min-w-[140px] bg-mb-dark text-mb-white text-xs px-2 py-1 border border-mb-charcoal focus:outline-none focus:border-mb-yellow"
        />
        <select
          value={newItemSlots}
          onChange={(e) => setNewItemSlots(Number(e.target.value))}
          className="bg-mb-dark text-mb-white text-xs px-1 border border-mb-charcoal focus:outline-none"
        >
          <option value={1}>1 Slot (Normal)</option>
          <option value={2}>2 Slots (Heavy / Bulky)</option>
          <option value={0}>0 Slots (Negligible)</option>
        </select>
        <input
          type="number"
          min={1}
          value={newItemQty}
          onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-12 bg-mb-dark text-mb-white text-xs px-1 border border-mb-charcoal focus:outline-none text-center font-mono"
          title="Quantity"
        />
        <button type="submit" className="mb-btn mb-btn-yellow text-xs py-1 px-2">
          <Plus className="w-3 h-3" />
          <span>ADD</span>
        </button>
      </form>
    </section>
  );
};
