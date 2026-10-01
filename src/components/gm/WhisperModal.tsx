import React, { useState, useEffect } from 'react';
import { X, Send, EyeOff, Sparkles, MessageSquare } from 'lucide-react';
import { OBRService } from '../../obr/obrService';
import { GMService } from '../../obr/gmService';

interface WhisperModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMessage?: string;
  defaultTitle?: string;
}

const PRESET_WHISPERS = [
  'You hear wet scratching inside your skull. It is hungry.',
  'A freezing, skinless hand grips your ankle from beneath the flagstones.',
  'The Two-Headed Basilisk whispers your true demise into your left ear.',
  'Your silver coins are warm and bleeding through your purse.',
  'She smiles at you from the dark corridor. She knows what you buried.',
  'You realize your tongue is swollen with yellow rot.',
];

export const WhisperModal: React.FC<WhisperModalProps> = ({
  isOpen,
  onClose,
  defaultMessage = '',
  defaultTitle = 'Prophetic Whisper',
}) => {
  const [players, setPlayers] = useState<Array<{ id: string; name: string; role: string; color?: string }>>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [title, setTitle] = useState(defaultTitle);
  const [message, setMessage] = useState(defaultMessage);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      OBRService.getPartyPlayers().then((p) => {
        setPlayers(p);
        if (p.length > 0 && selectedPlayerId === 'all') {
          // Keep 'all' or default
        }
      });
      setTitle(defaultTitle);
      setMessage(defaultMessage);
      setIsSent(false);
    }
  }, [isOpen, defaultMessage, defaultTitle]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim()) return;

    await GMService.broadcastGMEvent({
      type: 'WHISPER_SENT',
      targetPlayerId: selectedPlayerId === 'all' ? undefined : selectedPlayerId,
      senderName: 'The GM',
      payload: {
        title: title.trim() || 'Whisper from the Abyss',
        message: message.trim(),
        timestamp: Date.now(),
      },
    });

    const targetName =
      selectedPlayerId === 'all'
        ? 'All Players'
        : players.find((p) => p.id === selectedPlayerId)?.name || 'Player';

    OBRService.notify(`Secret whisper delivered to ${targetName}.`);
    setIsSent(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-brutal">
      <div className="bg-mb-dark border-4 border-mb-yellow max-w-lg w-full p-4 shadow-brutal flex flex-col gap-3 text-mb-bone">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-mb-yellow/30 pb-2">
          <div className="flex items-center gap-2">
            <div className="bg-mb-pink text-white p-1 border border-black rotate-[-3deg]">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="font-gothic text-xl text-mb-yellow tracking-wide">
              SECRET WHISPER / PROPHETIC DREAM
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-mb-bone/60 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Selector */}
        <div>
          <label className="block text-xs uppercase font-bold text-mb-yellow mb-1">
            Recipient Player
          </label>
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="w-full bg-mb-black border border-mb-yellow/40 text-mb-white text-xs px-2.5 py-1.5 focus:outline-none focus:border-mb-yellow font-brutal"
          >
            <option value="all">⚡ ALL PLAYERS (Broadcast Ominous Message)</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                👤 {p.name} {p.role === 'GM' ? '(GM)' : '(Player)'}
              </option>
            ))}
          </select>
        </div>

        {/* Whisper Title */}
        <div>
          <label className="block text-xs uppercase font-bold text-mb-bone/80 mb-1">
            Dream / Vision Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-mb-black border border-mb-yellow/40 text-mb-white text-xs px-2.5 py-1.5 focus:outline-none focus:border-mb-yellow font-brutal"
            placeholder="e.g. Prophetic Dream, Voice in the Dark, Basilisk's Curse"
          />
        </div>

        {/* Message Content */}
        <div>
          <label className="block text-xs uppercase font-bold text-mb-bone/80 mb-1">
            Whisper Content
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-mb-black border border-mb-yellow/40 text-mb-white text-xs p-2 font-punk leading-relaxed focus:outline-none focus:border-mb-yellow"
            placeholder="Write secret vision, haunting hallucination, or private knowledge..."
          />
        </div>

        {/* Quick Ominous Presets */}
        <div>
          <span className="text-[10px] font-punk text-mb-bone/60 block mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-mb-pink" />
            <span>Ominous MÖRK BORG Presets:</span>
          </span>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
            {PRESET_WHISPERS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMessage(preset)}
                className="text-[10px] text-left bg-mb-black/70 hover:bg-mb-pink hover:text-white text-mb-bone border border-mb-yellow/20 px-2 py-1 transition-colors truncate max-w-full font-punk"
              >
                "{preset}"
              </button>
            ))}
          </div>
        </div>

        {/* Status / Submit Action */}
        <div className="border-t border-mb-yellow/30 pt-3 flex items-center justify-between">
          <span className="text-[10px] font-punk text-mb-bone/60 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>Delivered secretly to chosen player screen.</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="bg-mb-black text-mb-bone hover:text-white px-3 py-1.5 text-xs font-bold uppercase border border-mb-yellow/30"
            >
              Cancel
            </button>

            <button
              onClick={handleSend}
              disabled={isSent || !message.trim()}
              className={`px-4 py-1.5 text-xs font-black uppercase border-2 border-black shadow-brutal flex items-center gap-1.5 transition-all ${
                isSent
                  ? 'bg-green-600 text-white'
                  : 'bg-mb-yellow hover:bg-yellow-300 text-mb-black active:translate-x-0.5 active:translate-y-0.5'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSent ? 'DELIVERED!' : 'SEND WHISPER'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
