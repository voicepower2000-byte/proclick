import React from 'react';
import { Plus, Menu, LayoutGrid, Timer as TimerIcon, Bell } from 'lucide-react';
import { useTimers } from '../context/TimerContext';
import { getDictionary } from '../locales/dictionary';
import { FilterType } from '../types';
import { ProClickLogo } from './ProClickLogo';

export const Header: React.FC = () => {
  const { items, activeFilter, setActiveFilter, openCreateModal, toggleDrawer, language } = useTimers();
  const t = getDictionary(language);

  const timersCount = items.filter((i) => i.type === 'timer').length;
  const alarmsCount = items.filter((i) => i.type === 'alarm').length;
  const allCount = items.length;

  const filters: { id: FilterType; label: string; count: number; icon: React.ElementType }[] = [
    { id: 'all', label: t.all, count: allCount, icon: LayoutGrid },
    { id: 'timers', label: t.timers, count: timersCount, icon: TimerIcon },
    { id: 'alarms', label: t.alarms, count: alarmsCount, icon: Bell },
  ];

  return (
    <header className="sticky top-0 z-30 w-full h-12 sm:h-14 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md shadow-sm shadow-black/40 flex items-center">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 flex items-center justify-between gap-1.5 sm:gap-3 flex-nowrap min-w-0">
        
        {/* 1. App Logo & Name - Clickable Smooth Scroll-to-Top */}
        <button
          type="button"
          id="header-brand-scroll-top"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 cursor-pointer group bg-transparent border-0 p-0 text-left rtl:text-right active:scale-95 transition-transform select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 rounded-lg"
          title={language === 'ar' ? `${t.appTitle} - العودة لأعلى الصفحة` : `${t.appTitle} - Scroll to Top`}
          aria-label={language === 'ar' ? `${t.appTitle} - العودة لأعلى الصفحة` : `${t.appTitle} - Scroll to Top`}
        >
          <div className="flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <ProClickLogo size={32} className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <span className="font-extrabold text-xs xs:text-sm sm:text-base tracking-tight text-white select-none whitespace-nowrap group-hover:text-cyan-400 transition-colors">
            {t.appTitle}
          </span>
        </button>

        {/* 2. Slim Filter Bar: [All] | [Timers] | [Alarms] */}
        <nav
          aria-label="Filter navigation"
          className="flex items-center p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-zinc-900/90 border border-zinc-800/90 shadow-inner flex-shrink min-w-0"
        >
          {filters.map((f) => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                id={`filter-nav-${f.id}`}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`flex items-center gap-1 sm:gap-1.5 px-1.5 xs:px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] xs:text-[11px] sm:text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={`${f.label} (${f.count})`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="inline">{f.label}</span>
                <span
                  className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 rounded-full font-mono-numbers leading-tight ${
                    isActive ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-950 text-zinc-400'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* 3. Add New (+) Button & Side Menu (3 lines Hamburger) */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Add New Button */}
          <button
            id="header-add-new-btn"
            type="button"
            onClick={() => openCreateModal('timer')}
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
            title={t.addNew}
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">{t.addNew}</span>
          </button>

          {/* Hamburger 3-Lines Side Menu Button */}
          <button
            id="header-menu-hamburger-btn"
            type="button"
            onClick={toggleDrawer}
            className="p-1 sm:p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all duration-150 active:scale-95 cursor-pointer flex-shrink-0"
            title={t.openMenu}
            aria-label={t.openMenu}
          >
            <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
          </button>
        </div>

      </div>
    </header>
  );
};
