import React from 'react';
import { useTimers } from '../context/TimerContext';
import { getDictionary } from '../locales/dictionary';
import { TimerCard } from './TimerCard';
import { Plus, Timer as TimerIcon, Bell } from 'lucide-react';

export const TimerGrid: React.FC = () => {
  const { items, activeFilter, openCreateModal, mobileCols, desktopCols, language } = useTimers();
  const t = getDictionary(language);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeFilter === 'timers') return item.type === 'timer';
    if (activeFilter === 'alarms') return item.type === 'alarm';
    return true;
  });

  // Calculate dynamic responsive grid classes based on user preferences
  const getGridColsClass = () => {
    let mobileClass = 'grid-cols-1';
    if (mobileCols === 2) mobileClass = 'grid-cols-2';
    else if (mobileCols === 3) mobileClass = 'grid-cols-3';
    else if (mobileCols === 4) mobileClass = 'grid-cols-4';
    else if (mobileCols === 5) mobileClass = 'grid-cols-5';

    let desktopClass = 'sm:grid-cols-2 lg:grid-cols-3';
    if (desktopCols === 1) {
      desktopClass = 'sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 max-w-xl mx-auto';
    } else if (desktopCols === 2) {
      desktopClass = 'sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 max-w-4xl mx-auto';
    } else if (desktopCols === 3) {
      desktopClass = 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3';
    } else if (desktopCols === 4) {
      desktopClass = 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4';
    } else if (desktopCols === 5) {
      desktopClass = 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    }

    const gapClass = mobileCols >= 4 ? 'gap-1.5 sm:gap-3 md:gap-4' : mobileCols === 3 ? 'gap-2 sm:gap-3.5 md:gap-4' : mobileCols === 2 ? 'gap-2.5 sm:gap-4 md:gap-5' : 'gap-3.5 sm:gap-5';

    return `${mobileClass} ${desktopClass} ${gapClass}`;
  };

  if (filteredItems.length === 0) {
    return (
      <div className="py-16 sm:py-24 text-center px-4 rounded-3xl bg-gradient-to-b from-[#141417] to-[#0c0c0e] border border-zinc-800/80 shadow-xl shadow-black/40 my-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shadow-inner">
          {activeFilter === 'alarms' ? (
            <Bell className="w-6 h-6 text-zinc-400" />
          ) : (
            <TimerIcon className="w-6 h-6 text-zinc-400" />
          )}
        </div>
        
        <h3 className="text-lg font-bold text-zinc-100 mb-1">
          {t.noItemsTitle}
        </h3>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
          {t.noItemsSubtitle}
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => openCreateModal('timer')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.typeTimer}</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateModal('alarm')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-all cursor-pointer active:scale-95"
          >
            <Bell className="w-4 h-4" />
            <span>{t.typeAlarm}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="timers-grid-container"
      className={`grid my-4 sm:my-5 ${getGridColsClass()}`}
    >
      {filteredItems.map((item) => (
        <TimerCard key={item.id} item={item} />
      ))}
    </div>
  );
};
