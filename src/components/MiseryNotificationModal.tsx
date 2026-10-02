import React from 'react';
import { Skull, Flame, X } from 'lucide-react';
import { TriggeredMisery } from '../obr/gmService';

interface MiseryNotificationModalProps {
  misery: TriggeredMisery | null;
  onClose: () => void;
}

export const MiseryNotificationModal: React.FC<MiseryNotificationModalProps> = ({
  misery,
  onClose,
}) => {
  if (!misery) return null;

  const isSeventh = misery.verse === '7:7' || misery.psalm === 7;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg p-5 border-4 shadow-brutal text-white ${
        isSeventh ? 'bg-mb-blood border-mb-yellow animate-pulse' : 'bg-mb-dark border-mb-pink'
      }`}>
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white/70 hover:text-white p-1 hover:bg-black/40 transition-colors"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-current">
          <div className="bg-mb-black p-1.5 border border-current rotate-[-3deg] shrink-0">
            {isSeventh ? (
              <Skull className="w-6 h-6 text-mb-yellow animate-bounce" />
            ) : (
              <Flame className="w-6 h-6 text-mb-pink animate-pulse" />
            )}
          </div>
          <div>
            <span className="font-brutal font-black text-xs uppercase tracking-widest text-mb-yellow block">
              {isSeventh ? 'THE SEVENTH SEAL HAS SHATTERED' : 'THE CALENDAR OF NECHRUBEL'}
            </span>
            <h2 className="font-gothic text-2xl sm:text-3xl font-black text-white leading-tight">
              {misery.title}
            </h2>
          </div>
        </div>

        {/* Prophecy Text */}
        <div className="bg-mb-black/80 border border-current/40 p-4 my-3 shadow-inner">
          <p className="font-punk text-sm sm:text-base leading-relaxed text-mb-bone">
            "{misery.text}"
          </p>
        </div>

        {/* Ominous Footer Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className={`px-4 py-2 font-brutal font-black uppercase text-xs border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-transform ${
              isSeventh
                ? 'bg-mb-yellow text-mb-black hover:bg-yellow-300'
                : 'bg-mb-pink text-white hover:bg-pink-600'
            }`}
          >
            {isSeventh ? 'BURN THE BOOK' : 'ACCEPT DOOM'}
          </button>
        </div>
      </div>
    </div>
  );
};
