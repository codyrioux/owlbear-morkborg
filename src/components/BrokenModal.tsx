import React, { useState } from 'react';
import { Skull, X, Heart, Clock } from 'lucide-react';
import { rollBrokenTable } from '../utils/morkborgRules';

interface BrokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBrokenResult: (result: {
    roll: number;
    title: string;
    description: string;
    hpGained?: number;
    hoursDisabled?: number;
  }) => void;
}

export const BrokenModal: React.FC<BrokenModalProps> = ({
  isOpen,
  onClose,
  onApplyBrokenResult,
}) => {
  const [result, setResult] = useState<{
    roll: number;
    title: string;
    description: string;
    hpGained?: number;
    hoursDisabled?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleRoll = () => {
    const res = rollBrokenTable();
    setResult(res);
  };

  const handleApply = () => {
    if (result) {
      onApplyBrokenResult(result);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-mb-black border-4 border-mb-pink shadow-brutal-pink p-5 text-mb-white text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-mb-white/60 hover:text-mb-pink p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-1 border-b-2 border-mb-pink pb-3 mb-4">
          <div className="p-2 bg-mb-pink text-mb-white rounded-full">
            <Skull className="w-8 h-8" />
          </div>
          <h2 className="font-gothic text-3xl text-mb-pink tracking-tight uppercase">
            BROKEN & BLEEDING
          </h2>
          <p className="font-punk text-xs text-mb-white/70">
            0 Hit Points. Fate decides your misery.
          </p>
        </div>

        {/* Result Area */}
        {!result ? (
          <div className="my-6">
            <p className="font-punk text-sm text-mb-white/80 mb-5 leading-relaxed">
              When reduced to 0 HP, you are broken. Roll d4 to determine if your miserable soul survives or perishes in agony.
            </p>
            <button
              onClick={handleRoll}
              className="w-full mb-btn mb-btn-pink text-sm py-3 flex items-center justify-center gap-2"
            >
              <Skull className="w-5 h-5" />
              <span>ROLL ON THE BROKEN TABLE</span>
            </button>
          </div>
        ) : (
          <div className="my-4 animate-in zoom-in-95 duration-150">
            <div className="text-4xl font-black font-brutal text-mb-pink mb-1">
              [{result.roll}] {result.title}
            </div>

            <div className="p-3 bg-mb-dark border-2 border-mb-charcoal my-3 text-left">
              <p className="font-punk text-xs leading-relaxed text-mb-white/90">
                {result.description}
              </p>

              {result.hpGained && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400 font-bold">
                  <Heart className="w-4 h-4" />
                  <span>Awaken with +{result.hpGained} HP</span>
                </div>
              )}

              {result.hoursDisabled && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-mb-yellow font-bold">
                  <Clock className="w-4 h-4" />
                  <span>Incapacitated for {result.hoursDisabled} hours</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleRoll}
                className="flex-1 mb-btn mb-btn-dark text-xs py-2"
              >
                REROLL
              </button>
              <button
                onClick={handleApply}
                className="flex-2 flex-grow mb-btn mb-btn-yellow text-xs py-2"
              >
                ACCEPT FATE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
