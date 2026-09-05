/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TimerProvider, useTimers } from './context/TimerContext';
import { Header } from './components/Header';
import { TimerGrid } from './components/TimerGrid';
import { TimerModal } from './components/TimerModal';
import { RingingBanner } from './components/RingingBanner';
import { RingingNotificationModal } from './components/RingingNotificationModal';
import { SideDrawer } from './components/SideDrawer';

function TimerAppShell() {
  const { language } = useTimers();
  const isArabic = language === 'ar';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-zinc-800 selection:text-white relative">
      {/* Subtle ambient lighting on top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-zinc-800/10 via-zinc-900/5 to-transparent blur-3xl pointer-events-none" />

      {/* Slim Top Fixed Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        {/* Timers & Alarms Main Grid */}
        <TimerGrid />
      </main>

      {/* Slide-Over Side Drawer Menu (Hamburger) */}
      <SideDrawer />

      {/* Interactive Modal for Creating / Editing Timers & Alarms */}
      <TimerModal />

      {/* Visual Ringing Notification Modal for Finished Timers */}
      <RingingNotificationModal />

      {/* Active Ringing Alert Banner */}
      <RingingBanner />

      {/* Bottom Subtle Status Bar */}
      <footer className="border-t border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-sm py-3 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <span className="text-zinc-400 font-medium">
            {isArabic ? 'بروكليك • نظام المؤقتات والمنبهات الذكية' : 'Pro Click • Precision Multi-Timer & Alarm System'}
          </span>
          <span className="text-zinc-500 text-[11px]">
            {isArabic ? 'محرك دقيق بدون انحراف • دعم كامل للعربية والإنجليزية' : 'Zero-Drift Interval Engine • Bilingual LTR/RTL'}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <TimerProvider>
      <TimerAppShell />
    </TimerProvider>
  );
}
