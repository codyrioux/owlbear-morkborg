import React, { useState } from 'react';
import {
  Dices,
  Skull,
  CloudRain,
  ShieldAlert,
  Sparkles,
  EyeOff,
  Radio,
  Send,
  Copy,
  Check,
} from 'lucide-react';
import {
  rollCorpsePlundering,
  rollWeather,
  rollTrapsAndDevilry,
  rollBasiliskDemands,
  rollArcaneCatastrophe,
  rollDebris,
  OracleRollResult,
} from '../../utils/oracles';
import { OBRService } from '../../obr/obrService';
import { WhisperModal } from './WhisperModal';

type OracleCategory =
  | 'corpse'
  | 'weather'
  | 'traps'
  | 'basilisk'
  | 'catastrophe'
  | 'debris';

export const OraclesSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<OracleCategory>('corpse');
  const [isBroadcastMode, setIsBroadcastMode] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<OracleRollResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isWhisperModalOpen, setIsWhisperModalOpen] = useState(false);

  const handleRoll = async () => {
    let result: OracleRollResult;

    switch (selectedCategory) {
      case 'corpse':
        result = rollCorpsePlundering();
        break;
      case 'weather':
        result = rollWeather();
        break;
      case 'traps':
        result = rollTrapsAndDevilry();
        break;
      case 'basilisk':
        result = rollBasiliskDemands();
        break;
      case 'catastrophe':
        result = rollArcaneCatastrophe();
        break;
      case 'debris':
        result = rollDebris();
        break;
    }

    setLastResult(result);
    setCopied(false);

    if (isBroadcastMode) {
      const broadcastText = `[${result.category} ${result.rollDisplay}]: ${result.title} — ${result.description}`;
      await OBRService.notify(broadcastText);
    }
  };

  const handleCopy = () => {
    if (!lastResult) return;
    const text = `[${lastResult.category} ${lastResult.rollDisplay}] ${lastResult.title}: ${lastResult.description}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleBroadcastCurrent = async () => {
    if (!lastResult) return;
    const broadcastText = `[${lastResult.category} ${lastResult.rollDisplay}]: ${lastResult.title} — ${lastResult.description}`;
    await OBRService.notify(broadcastText);
  };

  return (
    <div className="space-y-4 font-brutal">
      {/* Top Controls: Roll Mode & Whisper Trigger */}
      <div className="bg-mb-dark border-2 border-mb-yellow/40 p-3 shadow-brutal flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-mb-black p-1 border border-mb-yellow/30 shadow-brutal-sm">
            <button
              onClick={() => setIsBroadcastMode(false)}
              className={`px-2.5 py-1 text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                !isBroadcastMode
                  ? 'bg-mb-pink text-white font-black'
                  : 'text-mb-bone/60 hover:text-white'
              }`}
              title="Rolls stay secret in your GM Console only"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Secret Roll</span>
            </button>

            <button
              onClick={() => setIsBroadcastMode(true)}
              className={`px-2.5 py-1 text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                isBroadcastMode
                  ? 'bg-mb-yellow text-mb-black font-black'
                  : 'text-mb-bone/60 hover:text-white'
              }`}
              title="Broadcast roll outcome into the room notifications"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Broadcast to Room</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsWhisperModalOpen(true)}
          className="bg-mb-black hover:bg-mb-dark text-mb-yellow hover:text-white text-xs font-bold uppercase px-3 py-1.5 border border-mb-yellow shadow-brutal-sm transition-colors flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Whisper to Player</span>
        </button>
      </div>

      {/* Category Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          onClick={() => setSelectedCategory('corpse')}
          className={`p-2.5 border-2 text-left transition-all shadow-brutal-sm flex flex-col justify-between ${
            selectedCategory === 'corpse'
              ? 'bg-mb-yellow text-mb-black border-black -translate-y-0.5 font-bold'
              : 'bg-mb-dark text-mb-bone border-mb-yellow/20 hover:border-mb-yellow/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Skull className="w-4 h-4" />
            <span className="text-[10px] font-mono opacity-80 font-bold">d66</span>
          </div>
          <span className="text-xs uppercase font-black">Corpse Plunder</span>
          <span className="text-[9px] font-punk opacity-70">Barebones pp. 4-5</span>
        </button>

        <button
          onClick={() => setSelectedCategory('weather')}
          className={`p-2.5 border-2 text-left transition-all shadow-brutal-sm flex flex-col justify-between ${
            selectedCategory === 'weather'
              ? 'bg-mb-yellow text-mb-black border-black -translate-y-0.5 font-bold'
              : 'bg-mb-dark text-mb-bone border-mb-yellow/20 hover:border-mb-yellow/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <CloudRain className="w-4 h-4" />
            <span className="text-[10px] font-mono opacity-80 font-bold">d12</span>
          </div>
          <span className="text-xs uppercase font-black">Weather & Air</span>
          <span className="text-[9px] font-punk opacity-70">Miserable skies</span>
        </button>

        <button
          onClick={() => setSelectedCategory('traps')}
          className={`p-2.5 border-2 text-left transition-all shadow-brutal-sm flex flex-col justify-between ${
            selectedCategory === 'traps'
              ? 'bg-mb-yellow text-mb-black border-black -translate-y-0.5 font-bold'
              : 'bg-mb-dark text-mb-bone border-mb-yellow/20 hover:border-mb-yellow/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] font-mono opacity-80 font-bold">d12</span>
          </div>
          <span className="text-xs uppercase font-black">Traps & Devilry</span>
          <span className="text-[9px] font-punk opacity-70">Lethal ambushes</span>
        </button>

        <button
          onClick={() => setSelectedCategory('basilisk')}
          className={`p-2.5 border-2 text-left transition-all shadow-brutal-sm flex flex-col justify-between ${
            selectedCategory === 'basilisk'
              ? 'bg-mb-yellow text-mb-black border-black -translate-y-0.5 font-bold'
              : 'bg-mb-dark text-mb-bone border-mb-yellow/20 hover:border-mb-yellow/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Dices className="w-4 h-4" />
            <span className="text-[10px] font-mono opacity-80 font-bold">d20</span>
          </div>
          <span className="text-xs uppercase font-black">Basilisk's Will</span>
          <span className="text-[9px] font-punk opacity-70">Demands of the twin god</span>
        </button>

        <button
          onClick={() => setSelectedCategory('catastrophe')}
          className={`p-2.5 border-2 text-left transition-all shadow-brutal-sm flex flex-col justify-between ${
            selectedCategory === 'catastrophe'
              ? 'bg-mb-yellow text-mb-black border-black -translate-y-0.5 font-bold'
              : 'bg-mb-dark text-mb-bone border-mb-yellow/20 hover:border-mb-yellow/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-mono opacity-80 font-bold">d20</span>
          </div>
          <span className="text-xs uppercase font-black">Catastrophe</span>
          <span className="text-[9px] font-punk opacity-70">Arcane fumbles</span>
        </button>

        <button
          onClick={() => setSelectedCategory('debris')}
          className={`p-2.5 border-2 text-left transition-all shadow-brutal-sm flex flex-col justify-between ${
            selectedCategory === 'debris'
              ? 'bg-mb-yellow text-mb-black border-black -translate-y-0.5 font-bold'
              : 'bg-mb-dark text-mb-bone border-mb-yellow/20 hover:border-mb-yellow/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Dices className="w-4 h-4" />
            <span className="text-[10px] font-mono opacity-80 font-bold">d6</span>
          </div>
          <span className="text-xs uppercase font-black">Debris & Curios</span>
          <span className="text-[9px] font-punk opacity-70">Search the rubble</span>
        </button>
      </div>

      {/* Main Roll Trigger Button */}
      <div>
        <button
          onClick={handleRoll}
          className="w-full bg-mb-yellow hover:bg-yellow-300 text-mb-black font-brutal font-black uppercase tracking-wider text-sm py-3 border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center justify-center gap-2"
        >
          <Dices className="w-5 h-5" />
          <span>CONSULT THE ORACLE ({selectedCategory.toUpperCase()})</span>
        </button>
      </div>

      {/* Result Display Card */}
      {lastResult ? (
        <div className="bg-mb-dark border-2 border-mb-yellow p-4 shadow-brutal text-mb-bone space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-mb-yellow/30 pb-2">
            <div className="flex items-center gap-2">
              <span className="bg-mb-pink text-white font-mono text-xs font-black px-2 py-0.5 border border-black shadow-brutal-sm">
                {lastResult.rollDisplay}
              </span>
              <span className="font-gothic text-xs text-mb-bone/70 uppercase">
                {lastResult.category}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="bg-mb-black hover:bg-mb-bone hover:text-mb-black text-mb-bone text-xs px-2.5 py-1 border border-mb-bone/30 transition-colors flex items-center gap-1"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {!isBroadcastMode && (
                <button
                  onClick={handleBroadcastCurrent}
                  className="bg-mb-black hover:bg-mb-yellow hover:text-mb-black text-mb-yellow text-xs px-2.5 py-1 border border-mb-yellow/40 transition-colors flex items-center gap-1"
                  title="Broadcast this secret roll to the room now"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Broadcast</span>
                </button>
              )}

              <button
                onClick={() => setIsWhisperModalOpen(true)}
                className="bg-mb-pink hover:bg-pink-600 text-white text-xs px-2.5 py-1 border border-black transition-colors flex items-center gap-1 shadow-brutal-sm"
                title="Whisper this result to a specific player"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Whisper</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-gothic text-2xl text-mb-yellow leading-tight mb-2">
              {lastResult.title}
            </h4>
            <p className="font-punk text-sm text-mb-bone/90 leading-relaxed bg-mb-black/50 p-3 border-l-2 border-mb-yellow">
              "{lastResult.description}"
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-mb-dark/40 border-2 border-dashed border-mb-yellow/20 p-8 text-center text-mb-bone/50 font-punk text-xs">
          Select an oracle table above and click "CONSULT THE ORACLE" to plunder corpses or conjure dread atmospheres.
        </div>
      )}

      {/* Whisper Modal */}
      <WhisperModal
        isOpen={isWhisperModalOpen}
        onClose={() => setIsWhisperModalOpen(false)}
        defaultTitle={lastResult ? `Oracle: ${lastResult.title}` : 'Prophetic Vision'}
        defaultMessage={lastResult ? lastResult.description : ''}
      />
    </div>
  );
};
