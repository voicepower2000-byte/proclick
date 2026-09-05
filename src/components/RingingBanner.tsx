import React from 'react';
import { useTimers } from '../context/TimerContext';
import { getDictionary } from '../locales/dictionary';
import { BellRing, VolumeX } from 'lucide-react';

export const RingingBanner: React.FC = () => {
  const { ringingItems, dismissRinging, snoozeRinging, muteAll, language } = useTimers();
  const t = getDictionary(language);

  if (ringingItems.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 pointer-events-none">
      <div className="pointer-events-auto bg-[#180e12]/95 border border-rose-500/80 rounded-2xl p-4 shadow-2xl shadow-rose-950/90 backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-bounce">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600/25 border border-rose-500/50 flex items-center justify-center text-rose-400">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                {t.alarmRingingAlert}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </div>
            <p className="text-sm font-bold text-zinc-100 truncate max-w-xs">
              {ringingItems.map((i) => i.title).join(', ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={muteAll}
            className="p-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
            title={t.muteSound}
          >
            <VolumeX className="w-4 h-4" />
          </button>
          {ringingItems.slice(0, 1).map((item) => (
            <React.Fragment key={item.id}>
              <button
                type="button"
                onClick={() => snoozeRinging(item.id, 5)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-rose-200 border border-rose-500/30 transition-colors cursor-pointer"
              >
                {t.snooze}
              </button>
              <button
                type="button"
                onClick={() => dismissRinging(item.id)}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all duration-150 cursor-pointer shadow-md shadow-rose-600/40 active:scale-95"
              >
                {t.dismiss}
              </button>
            </React.Fragment>
          ))}
        </div>

      </div>
    </div>
  );
};
