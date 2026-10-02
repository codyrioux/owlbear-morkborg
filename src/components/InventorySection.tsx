import React, { useState } from 'react';
import { Package, Plus, Trash2, AlertTriangle, Edit2, X } from 'lucide-react';
import { Character, InventoryItem } from '../types/morkborg';
import { calculateCarryingCapacity, calculateItemSlots, getItemPreset } from '../utils/morkborgRules';
import { SectionHeader } from './SectionHeader';

interface InventorySectionProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isReadOnly?: boolean;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  character,
  onUpdateCharacter,
  isCollapsed = false,
  onToggleCollapse,
  isReadOnly = false,
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemSlots, setNewItemSlots] = useState<number>(1);
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemStackSize, setNewItemStackSize] = useState<number>(1);
  const [newItemIsAmmo, setNewItemIsAmmo] = useState<boolean>(false);

  // Edit modal state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const capacity = calculateCarryingCapacity(
    character.abilities.strength.modifier,
    character.inventory,
    character.silver,
    character.armor,
    character.weapons,
    character.scrolls
  );

  const handleNameChange = (name: string) => {
    setNewItemName(name);
    const preset = getItemPreset(name);
    if (preset) {
      setNewItemStackSize(preset.stackSize);
      setNewItemSlots(preset.slots);
      setNewItemIsAmmo(!!preset.isAmmunition);
      if (newItemQty === 1) {
        setNewItemQty(preset.stackSize);
      }
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      slots: newItemSlots,
      quantity: newItemQty,
      stackSize: newItemStackSize,
      isAmmunition: newItemIsAmmo,
    };

    onUpdateCharacter((prev) => ({
      ...prev,
      inventory: [...prev.inventory, newItem],
    }));

    setNewItemName('');
    setNewItemQty(1);
    setNewItemStackSize(1);
    setNewItemIsAmmo(false);
  };

  const handleAddPreset = (name: string, stackSize: number, slots: number, isAmmunition: boolean) => {
    onUpdateCharacter((prev) => {
      const existingIndex = prev.inventory.findIndex(
        (i) => i.name.toLowerCase() === name.toLowerCase()
      );
      if (existingIndex >= 0) {
        // Increment quantity of existing item by stackSize
        const updated = [...prev.inventory];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + stackSize,
          stackSize: updated[existingIndex].stackSize ?? stackSize,
          isAmmunition: updated[existingIndex].isAmmunition ?? isAmmunition,
        };
        return { ...prev, inventory: updated };
      } else {
        // Add new item
        const newItem: InventoryItem = {
          id: crypto.randomUUID(),
          name,
          slots,
          quantity: stackSize,
          stackSize,
          isAmmunition,
        };
        return { ...prev, inventory: [...prev.inventory, newItem] };
      }
    });
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
            const preset = getItemPreset(item.name);
            const isAmmo = item.isAmmunition ?? preset?.isAmmunition ?? false;

            // For ammunition items, allow reaching 0 (out of ammo without losing item entry)
            if (isAmmo) {
              return nextQty >= 0 ? { ...item, quantity: nextQty } : null;
            }
            // For general items, reaching 0 removes the item
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as InventoryItem[],
    }));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    onUpdateCharacter((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) =>
        item.id === editingItem.id ? editingItem : item
      ),
    }));
    setEditingItem(null);
  };

  const detectedPreset = newItemName.trim() ? getItemPreset(newItemName) : null;

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 max-h-48 overflow-y-auto pr-1 mb-1.5">
            {character.inventory.length === 0 ? (
              <p className="text-xs text-mb-white/40 italic py-1 col-span-full">
                You carry nothing. Scavenge to survive.
              </p>
            ) : (
              character.inventory.map((item) => {
                const itemSlots = calculateItemSlots(item);
                const preset = getItemPreset(item.name);
                const effectiveStackSize = item.stackSize ?? preset?.stackSize ?? 1;
                const isAmmo = item.isAmmunition ?? preset?.isAmmunition ?? false;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-1 p-1 bg-mb-dark border transition-colors ${
                      item.quantity === 0
                        ? 'border-mb-pink/50 opacity-75'
                        : isAmmo
                        ? 'border-mb-yellow/40 hover:border-mb-yellow'
                        : 'border-mb-charcoal hover:border-mb-white/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1 truncate">
                      <div className="flex items-baseline gap-1 truncate">
                        <span className="text-xs font-bold text-mb-white truncate">
                          {item.name}
                        </span>
                        {isAmmo && (
                          <span className="text-[8px] font-mono px-1 py-0.2 bg-mb-yellow text-mb-black font-bold uppercase tracking-tight">
                            AMMO
                          </span>
                        )}
                        {item.quantity === 0 ? (
                          <span className="text-[9px] font-mono text-mb-pink font-bold">
                            (EMPTY)
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-mb-yellow">
                            x{item.quantity}
                          </span>
                        )}
                      </div>
                      <div className="text-[8.5px] text-mb-white/40 font-mono">
                        {isAmmo ? (
                          itemSlots === 0 ? (
                            <span className="text-emerald-400 font-bold">0 slots (1st stack free)</span>
                          ) : (
                            <span>{itemSlots} slot{itemSlots === 1 ? '' : 's'} ({effectiveStackSize}/stack)</span>
                          )
                        ) : effectiveStackSize > 1 ? (
                          <span>{itemSlots} slot{itemSlots === 1 ? '' : 's'} ({effectiveStackSize}/stack)</span>
                        ) : (
                          <span>{itemSlots} slot{itemSlots === 1 ? '' : 's'}{item.slots > 1 ? ' (Heavy)' : item.slots === 0 ? ' (Free)' : ''}</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity buttons & edit & delete */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, -1)}
                        disabled={isReadOnly}
                        title={item.quantity === 1 && isAmmo ? 'Fires last round (empty)' : 'Decrease quantity'}
                        className="w-4 h-4 bg-mb-charcoal text-mb-white text-[10px] font-bold flex items-center justify-center hover:bg-mb-pink disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, 1)}
                        disabled={isReadOnly}
                        title="Increase quantity"
                        className="w-4 h-4 bg-mb-charcoal text-mb-white text-[10px] font-bold flex items-center justify-center hover:bg-mb-yellow hover:text-mb-black disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                      {!isReadOnly && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingItem({ ...item, stackSize: effectiveStackSize, isAmmunition: isAmmo })}
                            title="Edit Item"
                            className="p-0.5 text-mb-white/40 hover:text-mb-yellow ml-0.5"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Delete Item"
                            className="p-0.5 text-mb-white/40 hover:text-mb-pink ml-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Add Ammo & Supplies */}
          {!isReadOnly && (
            <div className="pt-1.5 pb-1 border-t border-mb-charcoal">
              <div className="flex items-center justify-between text-[9px] font-mono text-mb-white/50 mb-1">
                <span className="uppercase tracking-wider">Quick Add Supplies:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => handleAddPreset('Arrows', 20, 1, true)}
                  className="text-[9px] font-mono px-1.5 py-0.5 bg-mb-dark hover:bg-mb-yellow hover:text-mb-black border border-mb-charcoal hover:border-black text-mb-white transition-colors"
                  title="Add quiver of 20 arrows (Ammo, 0 slots for first 20)"
                >
                  +20 Arrows
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset('Crossbow Bolts', 10, 1, true)}
                  className="text-[9px] font-mono px-1.5 py-0.5 bg-mb-dark hover:bg-mb-yellow hover:text-mb-black border border-mb-charcoal hover:border-black text-mb-white transition-colors"
                  title="Add case of 10 bolts (Ammo, 0 slots for first 10)"
                >
                  +10 Bolts
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset('Sling Bullets', 20, 1, true)}
                  className="text-[9px] font-mono px-1.5 py-0.5 bg-mb-dark hover:bg-mb-yellow hover:text-mb-black border border-mb-charcoal hover:border-black text-mb-white transition-colors"
                  title="Add bag of 20 bullets (Ammo, 0 slots for first 20)"
                >
                  +20 Bullets
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset('Torches', 4, 1, false)}
                  className="text-[9px] font-mono px-1.5 py-0.5 bg-mb-dark hover:bg-mb-yellow hover:text-mb-black border border-mb-charcoal hover:border-black text-mb-white transition-colors"
                  title="Add bundle of 4 torches (1 slot)"
                >
                  +4 Torches
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset('Dry Rations', 4, 1, false)}
                  className="text-[9px] font-mono px-1.5 py-0.5 bg-mb-dark hover:bg-mb-yellow hover:text-mb-black border border-mb-charcoal hover:border-black text-mb-white transition-colors"
                  title="Add 4 rations of food (1 slot)"
                >
                  +4 Rations
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset('Chalk', 10, 1, false)}
                  className="text-[9px] font-mono px-1.5 py-0.5 bg-mb-dark hover:bg-mb-yellow hover:text-mb-black border border-mb-charcoal hover:border-black text-mb-white transition-colors"
                  title="Add box of 10 chalk pieces (1 slot)"
                >
                  +10 Chalk
                </button>
              </div>
            </div>
          )}

          {/* Add New Item Form */}
          {!isReadOnly && (
            <form onSubmit={handleAddItem} className="pt-1.5 border-t border-mb-charcoal flex flex-col gap-1">
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="New item name..."
                  value={newItemName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="flex-1 bg-mb-dark text-mb-white text-xs px-1.5 py-0.5 border border-mb-charcoal focus:outline-none focus:border-mb-yellow min-w-0"
                />
                <div className="flex items-center gap-0.5 bg-mb-dark border border-mb-charcoal px-1">
                  <span className="text-[9px] font-mono text-mb-white/40">QTY:</span>
                  <input
                    type="number"
                    min={1}
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-10 bg-transparent text-mb-white text-xs py-0.5 focus:outline-none text-center font-mono"
                    title="Quantity"
                  />
                </div>
                <button type="submit" className="mb-btn mb-btn-yellow text-xs py-0.5 px-2">
                  <Plus className="w-3 h-3" />
                  <span>ADD</span>
                </button>
              </div>

              {/* Options Row: Slots, Stack Size, Ammunition Toggle */}
              <div className="flex items-center justify-between gap-1 flex-wrap text-[10px] font-mono text-mb-white/60">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <select
                    value={newItemSlots}
                    onChange={(e) => setNewItemSlots(Number(e.target.value))}
                    className="bg-mb-dark text-mb-white text-[10px] px-1 py-0.5 border border-mb-charcoal focus:outline-none cursor-pointer"
                  >
                    <option value={1}>1 Slot (Normal)</option>
                    <option value={2}>2 Slots (Heavy)</option>
                    <option value={0}>0 Slots (Free)</option>
                  </select>

                  <div className="flex items-center gap-1 bg-mb-dark border border-mb-charcoal px-1 py-0.5">
                    <span className="text-[9px] text-mb-white/50">Stack:</span>
                    <input
                      type="number"
                      min={1}
                      value={newItemStackSize}
                      onChange={(e) => setNewItemStackSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-8 bg-transparent text-mb-white text-[10px] text-center focus:outline-none font-mono"
                      title="Number of items that fit into the slot(s)"
                    />
                  </div>

                  <label className="flex items-center gap-1 cursor-pointer bg-mb-dark border border-mb-charcoal px-1.5 py-0.5 hover:border-mb-white/40">
                    <input
                      type="checkbox"
                      checked={newItemIsAmmo}
                      onChange={(e) => setNewItemIsAmmo(e.target.checked)}
                      className="accent-mb-yellow w-3 h-3"
                    />
                    <span className={newItemIsAmmo ? 'text-mb-yellow font-bold' : 'text-mb-white/70'}>
                      Ammo (1st stack free)
                    </span>
                  </label>
                </div>

                {detectedPreset && (
                  <span className="text-[9px] text-mb-yellow flex items-center gap-0.5">
                    ⚡ Preset: {detectedPreset.stackSize}/stack {detectedPreset.isAmmunition ? '(Ammo)' : ''}
                  </span>
                )}
              </div>
            </form>
          )}
        </>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 animate-fade-in">
          <form onSubmit={handleSaveEdit} className="bg-mb-black border-2 border-mb-yellow w-full max-w-sm p-4 shadow-brutal flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-mb-charcoal pb-2">
              <h3 className="font-gothic text-base text-mb-yellow">Edit Inventory Item</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-mb-white/60 hover:text-mb-pink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div>
                <label className="text-[10px] font-mono text-mb-white/50 uppercase block mb-0.5">Item Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-mb-dark text-mb-white text-xs px-2 py-1 border border-mb-charcoal focus:border-mb-yellow focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-mb-white/50 uppercase block mb-0.5">Quantity</label>
                  <input
                    type="number"
                    min={editingItem.isAmmunition ? 0 : 1}
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    className="w-full bg-mb-dark text-mb-white text-xs px-2 py-1 border border-mb-charcoal focus:border-mb-yellow focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-mb-white/50 uppercase block mb-0.5">Slots per Stack</label>
                  <select
                    value={editingItem.slots}
                    onChange={(e) => setEditingItem({ ...editingItem, slots: Number(e.target.value) })}
                    className="w-full bg-mb-dark text-mb-white text-xs px-2 py-1 border border-mb-charcoal focus:border-mb-yellow focus:outline-none cursor-pointer"
                  >
                    <option value={1}>1 Slot (Normal)</option>
                    <option value={2}>2 Slots (Heavy)</option>
                    <option value={0}>0 Slots (Free)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-mb-white/50 uppercase block mb-0.5">Stack Size (per slot)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingItem.stackSize ?? 1}
                    onChange={(e) => setEditingItem({ ...editingItem, stackSize: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="w-full bg-mb-dark text-mb-white text-xs px-2 py-1 border border-mb-charcoal focus:border-mb-yellow focus:outline-none font-mono"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingItem.isAmmunition}
                      onChange={(e) => setEditingItem({ ...editingItem, isAmmunition: e.target.checked })}
                      className="accent-mb-yellow w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-mono text-mb-white">
                      Ammo (Free 1st stack)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-mb-white/50 uppercase block mb-0.5">Notes / Description (Optional)</label>
                <input
                  type="text"
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Optional details..."
                  className="w-full bg-mb-dark text-mb-white text-xs px-2 py-1 border border-mb-charcoal focus:border-mb-yellow focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-mb-charcoal pt-2 mt-1">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1 bg-mb-dark hover:bg-mb-charcoal text-mb-white text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="mb-btn mb-btn-yellow text-xs py-1 px-3"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
