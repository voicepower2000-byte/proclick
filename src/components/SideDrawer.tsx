import React, { useEffect } from 'react';
import { useTimers } from '../context/TimerContext';
import { getDictionary } from '../locales/dictionary';
import { X, Play, Pause, Globe, LayoutGrid, Volume2, Smartphone, Monitor } from 'lucide-react';
import { MobileColumns, DesktopColumns, SoundTone } from '../types';
import { ProClickLogo } from './ProClickLogo';

export const SideDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    closeDrawer,
    language,
    setLanguage,
    stopAll,
    startAll,
    mobileCols,
    setMobileCols,
    desktopCols,
    setDesktopCols,
    soundTone,
    setSoundTone,
    testAudio,
  } = useTimers();

  const t = getDictionary(language);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop overlay */}
      <div
        id="side-drawer-backdrop"
        onClick={closeDrawer}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 ltr:right-0 rtl:left-0 max-w-full flex">
        <div
          id="side-drawer-panel"
          className="w-screen max-w-sm sm:max-w-md bg-[#09090b] border-l rtl:border-l-0 rtl:border-r border-zinc-800 shadow-2xl flex flex-col h-full z-10 animate-slide-in"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/60">
            <div className="flex items-center gap-2.5">
              <ProClickLogo size={32} className="w-8 h-8" />
              <div>
                <h2 className="text-base font-bold text-zinc-100 leading-tight">{t.appTitle}</h2>
                <p className="text-[11px] text-zinc-400 leading-none mt-1">{t.menuTitle}</p>
              </div>
            </div>

            <button
              id="side-drawer-close-btn"
              type="button"
              onClick={closeDrawer}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title={t.closeMenu}
              aria-label={t.closeMenu}
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          {/* Drawer Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 1. Language Switcher */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                    {t.language}
                  </span>
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  {language === 'ar' ? 'العربية' : 'English'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="drawer-lang-en-btn"
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                      : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/60'
                  }`}
                >
                  <span className="text-sm">🇺🇸</span>
                  <span>English (LTR)</span>
                </button>

                <button
                  id="drawer-lang-ar-btn"
                  type="button"
                  onClick={() => setLanguage('ar')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    language === 'ar'
                      ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                      : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/60'
                  }`}
                >
                  <span className="text-sm">🇸🇦</span>
                  <span>العربية (RTL)</span>
                </button>
              </div>
            </div>

            {/* 2. Global Action Buttons: Stop All & Start/Resume All */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  {t.globalActions}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  id="drawer-start-all-btn"
                  type="button"
                  onClick={() => {
                    startAll();
                    closeDrawer();
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/60 hover:border-emerald-700 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t.startAll}</span>
                </button>

                <button
                  id="drawer-stop-all-btn"
                  type="button"
                  onClick={() => {
                    stopAll();
                    closeDrawer();
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 hover:border-rose-700 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>{t.stopAll}</span>
                </button>
              </div>
            </div>

            {/* 3. Grid Column / Layout Customizer Control */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                    {t.gridLayout}
                  </span>
                </div>
              </div>

              {/* Mobile Screen Density Setting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                    {t.mobileColumns}
                  </span>
                  <span className="font-mono-numbers text-zinc-300 font-semibold">
                    {mobileCols} {t.colCount}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {([1, 2, 3, 4, 5] as MobileColumns[]).map((col) => {
                    const isSelected = mobileCols === col;
                    return (
                      <button
                        key={`m-${col}`}
                        id={`mobile-col-btn-${col}`}
                        type="button"
                        onClick={() => setMobileCols(col)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                            : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/60'
                        }`}
                      >
                        <span className="font-mono-numbers text-sm font-bold">{col}</span>
                        <span className="text-[10px] text-zinc-500">col</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desktop / Tablet Screen Density Setting */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-zinc-500" />
                    {t.desktopColumns}
                  </span>
                  <span className="font-mono-numbers text-zinc-300 font-semibold">
                    {desktopCols} {t.colCount}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {([1, 2, 3, 4, 5] as DesktopColumns[]).map((col) => {
                    const isSelected = desktopCols === col;
                    return (
                      <button
                        key={`d-${col}`}
                        id={`desktop-col-btn-${col}`}
                        type="button"
                        onClick={() => setDesktopCols(col)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                            : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/60'
                        }`}
                      >
                        <span className="font-mono-numbers text-sm font-bold">{col}</span>
                        <span className="text-[10px] text-zinc-500">col</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Default Sound Profile Preview */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                    {t.soundToneLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  id="drawer-sound-tone-select"
                  value={soundTone}
                  onChange={(e) => setSoundTone(e.target.value as SoundTone)}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
                >
                  <option value="classic-chime">{t.toneClassicChime}</option>
                  <option value="digital-beep">{t.toneDigitalBeep}</option>
                  <option value="gentle-bell">{t.toneGentleBell}</option>
                  <option value="energetic-pulse">{t.toneEnergeticPulse}</option>
                  <option value="zen-gong">{t.toneZenGong}</option>
                </select>

                <button
                  id="drawer-sound-test-btn"
                  type="button"
                  onClick={() => testAudio(soundTone)}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={t.testSound}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{t.previewSound}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950 text-center text-xs text-zinc-500 flex items-center justify-center">
            <span className="font-mono-numbers">Pro Click v2.1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
