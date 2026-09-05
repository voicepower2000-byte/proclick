import React from 'react';
import { Bell, VolumeX, RotateCcw, CheckCircle2, Clock } from 'lucide-react';
import { useTimers } from '../context/TimerContext';
import { getDictionary } from '../locales/dictionary';

export const RingingNotificationModal: React.FC = () => {
  const {
    ringingItems,
    isRingingModalOpen,
    setIsRingingModalOpen,
    dismissRinging,
    snoozeRinging,
    muteAll,
    language,
  } = useTimers();

  const t = getDictionary(language);

  if (!isRingingModalOpen || ringingItems.length === 0) {
    return null;
  }

  const primaryItem = ringingItems[0];

  return (
    <div
      id="ringing-notification-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn"
    >
      <div
        id="ringing-modal-container"
        className="relative w-full max-w-md bg-gradient-to-b from-[#18181c] to-[#0c0c0e] border-2 border-rose-500/80 rounded-3xl p-6 text-center text-zinc-100 shadow-2xl shadow-rose-950/60 ring-4 ring-rose-500/20 animate-pulse"
      >
        {/* Pulsing Visual Halo */}
        <div className="relative mx-auto mb-5 w-24 h-24 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: primaryItem.color || '#f43f5e' }}
          />
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center border-2 shadow-lg"
            style={{
              borderColor: primaryItem.color || '#f43f5e',
              backgroundColor: '#18181c',
              boxShadow: `0 0 30px ${primaryItem.color || '#f43f5e'}80`,
            }}
          >
            <Bell className="w-10 h-10 text-white animate-bounce" />
          </div>
        </div>

        {/* Title and message */}
        <h2 className="text-2xl font-black tracking-tight text-white mb-1">
          {t.ringingModalTitle}
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          {t.ringingModalSubtitle}
        </p>

        {/* Ringing Items List */}
        <div className="space-y-2 mb-6 max-h-48 overflow-y-auto p-1">
          {ringingItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-left rtl:text-right shadow-inner"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon || '⏱️'}</span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">{item.title}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-rose-400 font-medium flex-wrap">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>00:00:00 • {item.type === 'timer' ? t.typeTimer : t.typeAlarm}</span>
                    {item.ringingDuration && item.ringingDuration > 0 && item.ringingStartedAt && (
                      <span className="text-amber-400/90 text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/40">
                        {t.ringingAutoStopIn}{' '}
                        {Math.max(
                          0,
                          Math.ceil(item.ringingDuration - (Date.now() - item.ringingStartedAt) / 1000)
                        )}
                        s
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => snoozeRinging(item.id, 5)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-all cursor-pointer active:scale-95"
                  title={t.snooze}
                >
                  +5m
                </button>
                <button
                  type="button"
                  onClick={() => dismissRinging(item.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-md shadow-rose-600/30 active:scale-95"
                >
                  {t.dismiss}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Global Modal Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={muteAll}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <VolumeX className="w-4 h-4 text-zinc-400" />
            <span>{t.muteAll}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              ringingItems.forEach((it) => dismissRinging(it.id));
              setIsRingingModalOpen(false);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-zinc-100 hover:bg-white text-zinc-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-zinc-950" />
            <span>{t.dismiss} {ringingItems.length > 1 ? `(${ringingItems.length})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
