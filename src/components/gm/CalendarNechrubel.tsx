import React, { useState } from 'react';
import { Flame, AlertTriangle, RefreshCw, Skull, Sparkles } from 'lucide-react';
import { getMiseries, CampaignDurationDie } from '../../data';
import { GMState, GMService } from '../../obr/gmService';
import { OBRService } from '../../obr/obrService';
import { rollDawnCheck, triggerNextMisery } from '../../utils/nechrubel';

interface CalendarNechrubelProps {
  gmState: GMState;
  onUpdateGMState: (updater: Partial<GMState> | ((prev: GMState) => GMState)) => Promise<GMState>;
}

export const CalendarNechrubel: React.FC<CalendarNechrubelProps> = ({
  gmState,
  onUpdateGMState,
}) => {
  const miseriesData = getMiseries();
  const [lastDawnRoll, setLastDawnRoll] = useState<{
    dieRoll: number;
    durationDie: CampaignDurationDie;
    rolledOne: boolean;
  } | null>(null);

  const handleSelectDie = async (die: CampaignDurationDie) => {
    await onUpdateGMState({ campaignDurationDie: die });
    OBRService.notify(`Campaign duration changed to ${die.toUpperCase()}`);
  };

  const handleDawnRoll = async () => {
    const result = rollDawnCheck(gmState);
    setLastDawnRoll({
      dieRoll: result.dieRoll,
      durationDie: result.durationDie,
      rolledOne: result.rolledOne,
    });

    if (result.rolledOne && result.newMisery) {
      await onUpdateGMState(result.updatedState);
      await GMService.broadcastGMEvent({
        type: 'MISERY_TRIGGERED',
        payload: result.newMisery,
      });
      await OBRService.notify(
        `APOCALYPSE! ${result.newMisery.title}: ${result.newMisery.text.slice(0, 60)}...`
      );
    }
  };

  const handleForceNextMisery = async () => {
    const { newMisery, updatedState } = triggerNextMisery(gmState);
    await onUpdateGMState(updatedState);
    await GMService.broadcastGMEvent({
      type: 'MISERY_TRIGGERED',
      payload: newMisery,
    });
    await OBRService.notify(`MISERY FORCED: ${newMisery.title}`);
  };

  const handleResetCalendar = async () => {
    if (!window.confirm('Are you sure you want to reset the Calendar of Nechrubel and restore the Dying World?')) {
      return;
    }
    await onUpdateGMState({
      triggeredMiseries: [],
      isWorldEnded: false,
    });
    setLastDawnRoll(null);
    OBRService.notify('The Calendar of Nechrubel has been reset.');
  };

  return (
    <div className="space-y-4">
      {/* 1. Apocalypse Doom Banner (When 7:7 is triggered) */}
      {gmState.isWorldEnded && (
        <div className="bg-mb-pink text-white p-4 border-4 border-mb-yellow shadow-brutal animate-pulse">
          <div className="flex items-center gap-2 mb-1">
            <Skull className="w-6 h-6 text-mb-yellow animate-bounce" />
            <h3 className="font-gothic text-2xl tracking-wider text-mb-yellow font-black">
              Psalm VII: The Last (7:7) — The End Is Come
            </h3>
          </div>
          <p className="font-punk text-sm leading-relaxed">
            {miseriesData.seventhMisery.text}
          </p>
        </div>
      )}

      {/* 2. Campaign Duration Selector */}
      <div className="bg-mb-dark border-2 border-mb-yellow/40 p-3 shadow-brutal">
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-mb-yellow/20">
          <span className="font-gothic text-base text-mb-yellow">Campaign Duration Die</span>
          <span className="text-[10px] font-punk text-mb-bone/60">Roll 1 at dawn to fulfill a Misery</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {miseriesData.durationDice.map((option) => {
            const isSelected = gmState.campaignDurationDie === option.die;
            return (
              <button
                key={option.id}
                onClick={() => handleSelectDie(option.die)}
                className={`p-2 text-left border-2 transition-all shadow-brutal-sm ${
                  isSelected
                    ? 'bg-mb-yellow text-mb-black border-black -translate-y-0.5'
                    : 'bg-mb-black text-mb-bone border-mb-yellow/20 hover:border-mb-yellow/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-brutal font-bold text-sm uppercase">{option.die}</span>
                  {isSelected && <Flame className="w-3.5 h-3.5 fill-current" />}
                </div>
                <div className="font-punk text-[11px] font-bold line-clamp-1">{option.name}</div>
                <div className="font-punk text-[9px] text-current/70 line-clamp-1">{option.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Dawn Check Trigger */}
      <div className="bg-mb-dark border-2 border-mb-yellow/40 p-3 shadow-brutal">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-gothic text-lg text-mb-yellow leading-tight">Dawn of the Dying World</h4>
            <p className="font-punk text-xs text-mb-bone/70">
              Roll <strong>{gmState.campaignDurationDie.toUpperCase()}</strong>. If a 1 is rolled, a Psalm is fulfilled.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDawnRoll}
              disabled={gmState.isWorldEnded}
              className="bg-mb-pink hover:bg-pink-600 disabled:opacity-40 text-white font-brutal font-black uppercase text-xs px-4 py-2 border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" />
              <span>ROLL DAWN ({gmState.campaignDurationDie.toUpperCase()})</span>
            </button>
          </div>
        </div>

        {/* Dawn Roll Result Banner */}
        {lastDawnRoll && (
          <div className={`mt-3 p-2.5 border-2 text-xs font-brutal ${
            lastDawnRoll.rolledOne
              ? 'bg-mb-pink text-white border-black animate-in fade-in duration-200'
              : 'bg-mb-black text-mb-bone border-mb-yellow/40'
          }`}>
            {lastDawnRoll.rolledOne ? (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-mb-yellow shrink-0 animate-bounce" />
                <span>
                  <strong>ROLLED A 1 on {lastDawnRoll.durationDie.toUpperCase()}!</strong> A Misery has befallen the world!
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-mb-yellow shrink-0" />
                <span>
                  Dawn breaks in lifeless grey. Rolled <strong>{lastDawnRoll.dieRoll}</strong> on {lastDawnRoll.durationDie.toUpperCase()}. No Misery fulfills today.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. The 7 Misery Seals */}
      <div className="bg-mb-dark border-2 border-mb-yellow/40 p-3 shadow-brutal">
        <div className="flex items-center justify-between mb-3 pb-1 border-b border-mb-yellow/20">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-mb-pink" />
            <span className="font-gothic text-base text-mb-yellow">
              The Seven Seals ({gmState.triggeredMiseries.length} / 7 Fulfilled)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleForceNextMisery}
              disabled={gmState.isWorldEnded}
              className="text-[10px] text-mb-yellow hover:text-white uppercase font-bold tracking-wider underline disabled:opacity-40"
            >
              Force Next Misery
            </button>
            <button
              onClick={handleResetCalendar}
              className="text-[10px] text-mb-pink hover:text-white uppercase font-bold tracking-wider flex items-center gap-0.5 ml-2"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map((sealIndex) => {
            const misery = gmState.triggeredMiseries[sealIndex - 1];
            const isFulfilled = Boolean(misery);
            const isSeventh = sealIndex === 7;

            return (
              <div
                key={sealIndex}
                className={`p-2.5 border-2 transition-all ${
                  isFulfilled
                    ? isSeventh
                      ? 'bg-mb-pink text-white border-mb-yellow shadow-brutal-sm'
                      : 'bg-mb-black text-mb-bone border-mb-yellow shadow-brutal-sm'
                    : 'bg-mb-black/40 border-dashed border-mb-bone/20 text-mb-bone/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`font-brutal font-black text-xs px-1.5 py-0.5 ${
                      isFulfilled
                        ? isSeventh ? 'bg-mb-yellow text-mb-black' : 'bg-mb-pink text-white'
                        : 'bg-mb-dark text-mb-bone/40'
                    }`}>
                      SEAL {sealIndex}
                    </span>
                    <span className="font-gothic text-sm font-bold tracking-wide">
                      {isFulfilled ? misery.title : `Seal ${sealIndex} Sealed in Darkness`}
                    </span>
                  </div>

                  {isFulfilled && (
                    <span className="font-punk text-[9px] text-mb-bone/60">
                      {new Date(misery.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {isFulfilled && (
                  <p className="font-punk text-xs mt-1.5 leading-relaxed text-mb-bone">
                    {misery.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
