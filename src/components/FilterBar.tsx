import React from 'react';
import { FilterType } from '../types';
import { useTimers } from '../context/TimerContext';
import { getDictionary } from '../locales/dictionary';
import { Timer, Bell, LayoutGrid } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const { items, activeFilter, setActiveFilter, language } = useTimers();
  const t = getDictionary(language);

  const timersCount = items.filter((i) => i.type === 'timer').length;
  const alarmsCount = items.filter((i) => i.type === 'alarm').length;
  const allCount = items.length;

  const activeCount = items.filter((i) => i.status === 'active').length;
  const pausedCount = items.filter((i) => i.status === 'paused').length;
  const finishedCount = items.filter((i) => i.status === 'finished').length;

  const filters: { id: FilterType; label: string; count: number; icon: React.ElementType }[] = [
    { id: 'all', label: t.all, count: allCount, icon: LayoutGrid },
    { id: 'timers', label: t.timers, count: timersCount, icon: Timer },
    { id: 'alarms', label: t.alarms, count: alarmsCount, icon: Bell },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-6 pb-3 border-b border-zinc-800/70">
      {/* Category Tabs */}
      <div className="inline-flex rounded-xl p-1 bg-zinc-900/80 border border-zinc-800/80 self-start">
        {filters.map((f) => {
          const Icon = f.icon;
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              id={`filter-tab-${f.id}`}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/70'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{f.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono-numbers ${
                  isActive ? 'bg-zinc-700 text-white' : 'bg-zinc-950/60 text-zinc-400'
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status Highlights */}
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span>{t.activeCount}: <strong className="text-zinc-200 font-mono-numbers">{activeCount}</strong></span>
        </div>
        <span className="text-zinc-700">•</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-zinc-500" />
          <span>{t.pausedCount}: <strong className="text-zinc-200 font-mono-numbers">{pausedCount}</strong></span>
        </div>
        {finishedCount > 0 && (
          <>
            <span className="text-zinc-700">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              <span>{t.finishedCount}: <strong className="text-zinc-200 font-mono-numbers">{finishedCount}</strong></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
