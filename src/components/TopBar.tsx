import React from 'react';
import { Skull, Maximize2, Minimize2, Unlink } from 'lucide-react';
import { MonsterTokenData } from '../utils/combatRules';

interface TopBarProps {
  userRole: 'GM' | 'PLAYER';
  activeView: 'player' | 'gm';
  onToggleView?: (view: 'player' | 'gm') => void;
  linkedToken?: { id: string; name: string } | null;
  linkedMonster?: { id: string; name: string; monster: MonsterTokenData } | null;
  onUnlinkToken?: () => void;
  onUnlinkMonster?: () => void;
  allCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  userRole,
  activeView,
  onToggleView,
  linkedToken,
  linkedMonster,
  onUnlinkToken,
  onUnlinkMonster,
  allCollapsed,
  onToggleCollapseAll,
}) => {
  return (
    <div className="bg-mb-black text-mb-bone border-b-2 border-mb-yellow/40 px-3 py-1.5 flex items-center justify-between gap-2 shadow-brutal select-none z-30 shrink-0">
      {/* Left: Skull Icon, Brand, and Token Binding Status */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="bg-mb-yellow text-mb-black p-0.5 border border-mb-black rotate-[-2deg] shrink-0">
          <Skull className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-gothic text-lg sm:text-xl text-mb-yellow tracking-tight leading-none font-black">
            Mörk Borg
          </span>
        </div>

        {/* Token status chip */}
        <div className="flex items-center gap-1 min-w-0">
          {linkedMonster ? (
            <div className="text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-500/50 px-1.5 py-0.5 flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
              <span className="truncate">
                {userRole === 'GM' ? (
                  <>MONSTER: <strong>{linkedMonster.monster.name}</strong> ({linkedMonster.name})</>
                ) : (
                  <>TOKEN: <strong>{linkedMonster.name}</strong> (GM ONLY)</>
                )}
              </span>
              {userRole === 'GM' && onUnlinkMonster && (
                <button
                  onClick={onUnlinkMonster}
                  className="text-mb-pink hover:text-white uppercase text-[9px] font-bold shrink-0 ml-1"
                  title="Detach monster from token"
                >
                  <Unlink className="w-2.5 h-2.5 inline mr-0.5" />
                  DETACH
                </button>
              )}
            </div>
          ) : linkedToken ? (
            <div className="text-[10px] font-mono bg-zinc-900 text-mb-yellow border border-mb-yellow/40 px-1.5 py-0.5 flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="truncate">
                BOUND: <strong>{linkedToken.name}</strong>
              </span>
              {onUnlinkToken && (
                <button
                  onClick={onUnlinkToken}
                  className="text-mb-pink hover:text-white uppercase text-[9px] font-bold shrink-0 ml-1"
                  title="Detach character from token"
                >
                  <Unlink className="w-2.5 h-2.5 inline mr-0.5" />
                  DETACH
                </button>
              )}
            </div>
          ) : (
            <div className="text-[10px] font-mono bg-zinc-900/80 text-zinc-400 border border-zinc-700 px-1.5 py-0.5 flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
              <span>STANDALONE</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: GM View Mode Switcher & Global Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* GM Mode Switcher */}
        {userRole === 'GM' && (
          <div className="flex items-center gap-0.5 bg-zinc-900 p-0.5 border border-zinc-700 shadow-brutal-sm">
            <button
              onClick={() => onToggleView?.('player')}
              className={`px-2 py-0.5 text-[10px] font-brutal font-bold uppercase transition-colors ${
                activeView === 'player'
                  ? 'bg-mb-yellow text-mb-black shadow-brutal-sm font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              SCVM SHEET
            </button>
            <button
              onClick={() => onToggleView?.('gm')}
              className={`px-2 py-0.5 text-[10px] font-brutal font-bold uppercase transition-colors ${
                activeView === 'gm'
                  ? 'bg-mb-pink text-white shadow-brutal-sm font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              GM CONSOLE
            </button>
          </div>
        )}

        {/* Collapse All Toggle (Player Sheet view only) */}
        {activeView === 'player' && onToggleCollapseAll && (
          <button
            onClick={onToggleCollapseAll}
            className="p-1 text-zinc-400 hover:text-mb-yellow border border-zinc-700 hover:border-mb-yellow transition-colors"
            title={allCollapsed ? 'Expand All Sections' : 'Collapse All Sections'}
          >
            {allCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};
