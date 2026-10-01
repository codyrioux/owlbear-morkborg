import React, { useState } from 'react';
import { Package, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Character, InventoryItem } from '../types/morkborg';
import { calculateCarryingCapacity } from '../utils/morkborgRules';
import { SectionHeader } from './SectionHeader';

interface InventorySectionProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  character,
  onUpdateCharacter,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemSlots, setNewItemSlots] = useState<number>(1);
  const [newItemQty, setNewItemQty] = useState<number>(1);

  const capacity = calculateCarryingCapacity(
    character.abilities.strength.modifier,
    character.inventory,
    character.silver,
    character.armor,
    character.weapons,
    character.scrolls
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

  const collapsedElement = (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      {/* Slots Chip */}
      <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${
        capacity.isOverencumbered
          ? 'border-mb-pink text-mb-pink bg-mb-pink/20 font-bold'
          : 'border-mb-charcoal bg-mb-dark text-mb-white'
      }`}>
        SLOTS: <strong className={capacity.isOverencumbered ? 'text-mb-pink' : 'text-mb-yellow'}>{capacity.usedSlots}/{capacity.maxSlots}</strong>
      </span>

      {/* Items Count Chip */}
      <span className="text-[10px] font-mono border border-mb-charcoal bg-mb-dark px-1.5 py-0.5 text-mb-white/80">
        {character.inventory.length} {character.inventory.length === 1 ? 'item' : 'items'}
      </span>

      {/* Overencumbered Warning */}
      {capacity.isOverencumbered && (
        <span className="bg-mb-pink text-white text-[9px] font-black px-1.5 py-0.5 border border-black uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-brutal-sm">
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>+2 DR ENC</span>
        </span>
      )}
    </div>
  );

  return (
    <section className="p-2.5 bg-mb-black border-b-2 border-mb-charcoal border-l-4 border-l-mb-yellow">
      {/* Standardized Section Header */}
      <SectionHeader
        title="Equipment & Gear"
        subtitle="STR + 8 Slots"
        icon={<Package className="w-3.5 h-3.5 text-mb-yellow" />}
        accentColor="yellow"
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        collapsedElement={collapsedElement}
        rightElement={
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <div className="text-xs font-mono">
              <span
                className={`font-black ${
                  capacity.isOverencumbered ? 'text-mb-pink' : 'text-mb-yellow'
                }`}
              >
                {capacity.usedSlots}
              </span>
              <span className="text-mb-white/50 text-[11px]"> / {capacity.maxSlots} SLOTS</span>
            </div>
            {capacity.isOverencumbered && (
              <span className="bg-mb-pink text-mb-white text-[9px] font-bold px-1 py-0.5 border border-mb-pink animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>+2 DR STR & AGI</span>
              </span>
            )}
          </div>
        }
      />

      {!isCollapsed && (
        <>
          {/* Breakdown helper if any fixed equipment exists */}
      {(capacity.armorSlots > 0 || capacity.shieldSlots > 0 || capacity.weaponsSlots > 0 || capacity.scrollsSlots > 0 || Math.floor(character.silver / 100) > 0) && (
        <div className="text-[9px] font-mono text-mb-white/40 mb-1.5 px-1 truncate">
          Equipped slots:{' '}
          {[
            capacity.armorSlots > 0 ? 'armor: 1' : null,
            capacity.shieldSlots > 0 ? 'shield: 1' : null,
            capacity.weaponsSlots > 0 ? `weapons: ${capacity.weaponsSlots}` : null,
            capacity.scrollsSlots > 0 ? `scrolls: ${capacity.scrollsSlots}` : null,
            Math.floor(character.silver / 100) > 0 ? `silver: ${Math.floor(character.silver / 100)}` : null,
          ].filter(Boolean).join(' • ')}
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 max-h-40 overflow-y-auto pr-1 mb-1.5">
        {character.inventory.length === 0 ? (
          <p className="text-xs text-mb-white/40 italic py-1 col-span-full">
            You carry nothing. Scavenge to survive.
          </p>
        ) : (
          character.inventory.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-1 p-1 bg-mb-dark border border-mb-charcoal hover:border-mb-white/40 transition-colors"
            >
              <div className="min-w-0 flex-1 truncate">
                <div className="flex items-baseline gap-1 truncate">
                  <span className="text-xs font-bold text-mb-white truncate">
                    {item.name}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-[9px] font-mono text-mb-yellow">
                      x{item.quantity}
                    </span>
                  )}
                </div>
                <div className="text-[8.5px] text-mb-white/40 font-mono">
                  {item.slots * item.quantity} slot{item.slots * item.quantity === 1 ? '' : 's'} {item.slots > 1 && '(Heavy)'}
                </div>
              </div>

              {/* Quantity buttons & delete */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => handleUpdateQty(item.id, -1)}
                  className="w-4 h-4 bg-mb-charcoal text-mb-white text-[10px] font-bold flex items-center justify-center hover:bg-mb-pink"
                >
                  -
                </button>
                <button
                  onClick={() => handleUpdateQty(item.id, 1)}
                  className="w-4 h-4 bg-mb-charcoal text-mb-white text-[10px] font-bold flex items-center justify-center hover:bg-mb-yellow hover:text-mb-black"
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
      <form onSubmit={handleAddItem} className="flex gap-1 pt-1.5 border-t border-mb-charcoal">
        <input
          type="text"
          placeholder="New item name..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1 bg-mb-dark text-mb-white text-xs px-1.5 py-0.5 border border-mb-charcoal focus:outline-none focus:border-mb-yellow min-w-0"
        />
        <select
          value={newItemSlots}
          onChange={(e) => setNewItemSlots(Number(e.target.value))}
          className="bg-mb-dark text-mb-white text-xs px-1 py-0.5 border border-mb-charcoal focus:outline-none cursor-pointer"
        >
          <option value={1}>1 Slot</option>
          <option value={2}>2 Slots</option>
          <option value={0}>0 Slots</option>
        </select>
        <input
          type="number"
          min={1}
          value={newItemQty}
          onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-10 bg-mb-dark text-mb-white text-xs px-1 py-0.5 border border-mb-charcoal focus:outline-none text-center font-mono"
          title="Quantity"
        />
        <button type="submit" className="mb-btn mb-btn-yellow text-xs py-0.5 px-2">
          <Plus className="w-3 h-3" />
          <span>ADD</span>
        </button>
      </form>
        </>
      )}
    </section>
  );
};
