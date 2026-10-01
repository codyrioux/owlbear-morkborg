import React from 'react';
import { EyeOff, Skull } from 'lucide-react';

export interface WhisperData {
  title: string;
  message: string;
  senderName?: string;
  timestamp: number;
}

interface WhisperNotificationModalProps {
  whisper: WhisperData | null;
  onClose: () => void;
}

export const WhisperNotificationModal: React.FC<WhisperNotificationModalProps> = ({
  whisper,
  onClose,
}) => {
  if (!whisper) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-brutal">
      <div className="bg-mb-black border-4 border-mb-pink max-w-md w-full p-5 shadow-brutal text-mb-bone relative overflow-hidden">
        {/* Grungy backdrop accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-mb-pink/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Tag */}
        <div className="flex items-center justify-between border-b-2 border-mb-pink pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-mb-pink text-white p-1 border border-black rotate-[-2deg]">
              <EyeOff className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-black tracking-widest text-mb-pink">
              A VOICE CALLS FROM THE ABYSS
            </span>
          </div>
          <span className="text-[10px] font-punk text-mb-bone/50">
            {whisper.senderName || 'The GM'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-gothic text-2xl text-mb-yellow mb-3 leading-tight tracking-wide">
          {whisper.title}
        </h3>

        {/* Message body */}
        <div className="bg-mb-dark border-2 border-mb-bone/20 p-3 mb-4 shadow-brutal-sm">
          <p className="font-punk text-sm text-mb-bone leading-relaxed whitespace-pre-wrap">
            "{whisper.message}"
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full bg-mb-pink hover:bg-pink-600 text-white font-brutal font-black uppercase text-xs py-2.5 border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <Skull className="w-4 h-4" />
          <span>EMBRACE THE HORROR</span>
        </button>
      </div>
    </div>
  );
};
