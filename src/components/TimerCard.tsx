import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, Bell, Timer, Check, AlertCircle, VolumeX } from 'lucide-react';
import { TimerItem } from '../types';
import { useTimers } from '../context/TimerContext';
import { getDictionary } from '../locales/dictionary';
import { formatSecondsToHHMMSS } from '../utils/time';
import { CircularProgress } from './CircularProgress';

interface TimerCardProps {
  item: TimerItem;
}

export const TimerCard: React.FC<TimerCardProps> = ({ item }) => {
  const {
    language,
    togglePlayPause,
    resetItem,
    openEditModal,
    dismissRinging,
    snoozeRinging,
    muteRingingItem,
    mobileCols,
    desktopCols,
  } = useTimers();
  const t = getDictionary(language);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveCols = isMobile ? mobileCols : desktopCols;

  // Compute progress percentage
  let progressPercentage = 0;
  if (item.type === 'timer') {
    if (item.totalSeconds > 0) {
      // Countdown ring decreases as time runs down
      progressPercentage = Math.max(0, Math.min(100, (item.remainingSeconds / item.totalSeconds) * 100));
    }
  } else {
    // Alarm: 24h countdown window
    const maxDaySeconds = 24 * 3600;
    progressPercentage = Math.max(0, Math.min(100, 100 - (item.remainingSeconds / maxDaySeconds) * 100));
  }

  // Circle size adapted dynamically to column density and screen size
  const getCircleSize = () => {
    if (isMobile) {
      if (effectiveCols >= 5) return 46;
      if (effectiveCols === 4) return 56;
      if (effectiveCols === 3) return 70;
      if (effectiveCols === 2) return 92;
      return 116;
    } else {
      if (effectiveCols >= 5) return 80;
      if (effectiveCols === 4) return 96;
      if (effectiveCols === 3) return 114;
      if (effectiveCols === 2) return 128;
      return 140;
    }
  };

  const cardPaddingClass =
    effectiveCols >= 5
      ? 'p-1.5 sm:p-2.5'
      : effectiveCols === 4
      ? 'p-2 sm:p-3'
      : effectiveCols === 3
      ? 'p-2.5 sm:p-3.5'
      : effectiveCols === 2
      ? 'p-2.5 sm:p-4'
      : 'p-3.5 sm:p-5';

  const countdownDigitsClass =
    effectiveCols >= 5
      ? 'text-[10px] xs:text-[11px] sm:text-xs md:text-sm'
      : effectiveCols === 4
      ? 'text-xs xs:text-sm sm:text-base md:text-lg'
      : effectiveCols === 3
      ? 'text-xs xs:text-sm sm:text-lg md:text-xl'
      : effectiveCols === 2
      ? 'text-sm xs:text-base sm:text-xl md:text-2xl'
      : 'text-xl xs:text-2xl sm:text-3xl md:text-4xl';

  // Handle clicking the card body to open modal
  const handleCardClick = () => {
    openEditModal(item);
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlayPause(item.id);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetItem(item.id);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissRinging(item.id);
  };

  const handleSnooze = (e: React.MouseEvent) => {
    e.stopPropagation();
    snoozeRinging(item.id, 5);
  };

  // Status badge labels and styling
  const getStatusBadge = () => {
    const compact = effectiveCols >= 3;
    if (item.isRinging) {
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse ${
            compact ? 'p-1 text-[10px]' : 'px-2 py-0.5 text-xs'
          }`}
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {!compact && <span>{t.statusRinging}</span>}
        </span>
      );
    }
    switch (item.status) {
      case 'active':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${
              compact ? 'p-1 text-[10px]' : 'px-2 py-0.5 text-xs'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            {!compact && <span>{t.statusActive}</span>}
          </span>
        );
      case 'paused':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-medium bg-zinc-900 text-zinc-400 border border-zinc-800 ${
              compact ? 'p-1 text-[10px]' : 'px-2 py-0.5 text-xs'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0" />
            {!compact && <span>{t.statusPaused}</span>}
          </span>
        );
      case 'finished':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 ${
              compact ? 'p-1 text-[10px]' : 'px-2 py-0.5 text-xs'
            }`}
          >
            <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            {!compact && <span>{t.statusFinished}</span>}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id={`timer-card-${item.id}`}
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between ${cardPaddingClass} rounded-2xl bg-gradient-to-b from-[#141417] to-[#0c0c0e] hover:from-[#18181c] hover:to-[#0f0f13] border transition-all duration-200 cursor-pointer shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-0.5 w-full min-w-0 ${
        item.isRinging
          ? 'border-rose-500 shadow-rose-500/20 ring-2 ring-rose-500/40 animate-pulse'
          : 'border-zinc-800/80 hover:border-zinc-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]'
      }`}
    >
      {/* Top Header Row: Type badge + Status */}
      <div className={`flex items-center justify-between gap-1 sm:gap-2 ${effectiveCols >= 4 ? 'mb-1' : 'mb-2 sm:mb-3'}`}>
        <div className="flex items-center gap-1 min-w-0">
          <span
            className="p-1 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1 flex-shrink-0"
            style={{
              backgroundColor: `${item.color}15`,
              color: item.color,
            }}
          >
            {item.type === 'timer' ? (
              <Timer className="w-3 h-3 flex-shrink-0" />
            ) : (
              <Bell className="w-3 h-3 flex-shrink-0" />
            )}
            {effectiveCols < 4 && (
              <span className="text-[10px] font-bold">
                {item.type === 'timer' ? t.timers.slice(0, -1) || 'Timer' : t.alarms.slice(0, -1) || 'Alarm'}
              </span>
            )}
          </span>
          {item.type === 'alarm' && item.targetTime && effectiveCols < 3 && (
            <span className="text-[11px] sm:text-xs font-mono-numbers text-zinc-400 truncate">
              {item.targetTime}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {getStatusBadge()}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
            className="p-1 sm:p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
            title={t.edit}
            aria-label={t.edit}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className={`text-center ${effectiveCols >= 4 ? 'mb-1' : 'mb-2 sm:mb-3'}`}>
        <h3
          className={`font-semibold text-zinc-100 truncate px-1 tracking-tight ${
            effectiveCols >= 5
              ? 'text-[10px] sm:text-xs'
              : effectiveCols === 4
              ? 'text-xs sm:text-sm'
              : effectiveCols === 3
              ? 'text-xs sm:text-sm md:text-base'
              : 'text-sm sm:text-base'
          }`}
          title={item.title}
        >
          {item.title}
        </h3>
      </div>

      {/* Center: Circular Progress Indicator */}
      <div className="flex justify-center my-1.5 sm:my-2">
        <CircularProgress
          percentage={progressPercentage}
          color={item.color}
          icon={item.icon}
          iconType={item.iconType}
          size={getCircleSize()}
          status={item.status}
          isRinging={item.isRinging}
        />
      </div>

      {/* Dedicated Rectangular Countdown Box - spans full width of the card container */}
      <div className="w-full mt-2 mb-2 sm:mt-3 sm:mb-3">
        <div
          className={`w-full bg-zinc-950/90 border border-zinc-800/80 group-hover:border-zinc-700/80 rounded-lg sm:rounded-xl text-center transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] ${
            effectiveCols >= 4 ? 'px-1 py-1' : effectiveCols === 3 ? 'px-1.5 py-1.5' : 'px-2 py-2 sm:px-3 sm:py-2.5'
          }`}
        >
          <span
            className={`uppercase font-bold tracking-wider text-zinc-400 block truncate ${
              effectiveCols >= 4 ? 'text-[8px] mb-0' : 'text-[9px] sm:text-[10px] mb-0.5'
            }`}
          >
            {item.type === 'timer' ? t.remaining : `${t.targetAt} ${item.targetTime || ''}`}
          </span>
          <div
            className={`font-mono-numbers font-bold tracking-wider whitespace-nowrap leading-tight ${countdownDigitsClass} ${
              item.isRinging
                ? 'text-rose-400 animate-pulse'
                : item.status === 'active'
                ? 'text-white'
                : 'text-zinc-300'
            }`}
          >
            {formatSecondsToHHMMSS(item.remainingSeconds)}
          </div>
        </div>
      </div>

      {/* Card Controls */}
      {item.isRinging ? (
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              id={`dismiss-ringing-${item.id}`}
              type="button"
              onClick={handleDismiss}
              className={`flex-1 rounded-lg sm:rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all duration-150 cursor-pointer shadow-lg shadow-rose-600/30 active:scale-95 text-center truncate ${
                effectiveCols >= 4 ? 'py-1 px-1 text-[10px]' : 'py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm'
              }`}
            >
              {t.dismiss}
            </button>
            <button
              id={`snooze-ringing-${item.id}`}
              type="button"
              onClick={handleSnooze}
              className={`rounded-lg sm:rounded-xl font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-all cursor-pointer active:scale-95 truncate ${
                effectiveCols >= 4 ? 'py-1 px-1 text-[10px]' : 'py-1.5 sm:py-2 px-2 sm:px-3 text-xs'
              }`}
            >
              {t.snooze}
            </button>
          </div>
          <button
            id={`mute-ringing-${item.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              muteRingingItem(item.id);
            }}
            className="w-full py-1 px-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-zinc-400 hover:text-white bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 transition-colors flex items-center justify-center gap-1 cursor-pointer truncate"
          >
            <VolumeX className="w-3 h-3 flex-shrink-0" />
            {effectiveCols < 4 && <span>{t.muteSound}</span>}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-1 sm:gap-2 pt-1.5 border-t border-zinc-800/60">
          {/* Quick Play/Pause */}
          <button
            id={`play-pause-${item.id}`}
            type="button"
            onClick={handlePlayPause}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-150 cursor-pointer active:scale-95 truncate ${
              effectiveCols >= 4
                ? 'py-1 px-1.5 text-[11px]'
                : effectiveCols === 3
                ? 'py-1.5 px-2 text-xs'
                : 'py-2 px-3 text-xs sm:text-sm'
            } ${
              item.status === 'active'
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm'
            }`}
          >
            {item.status === 'active' ? (
              <>
                <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current flex-shrink-0" />
                {effectiveCols < 4 && <span>{t.pause}</span>}
              </>
            ) : (
              <>
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current flex-shrink-0" />
                {effectiveCols < 4 && (
                  <span>
                    {item.type === 'alarm'
                      ? item.status === 'finished'
                        ? t.enable
                        : t.resume
                      : item.remainingSeconds <= 0
                      ? t.reset
                      : t.resume}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Quick Reset - strictly rendered for Timers; removed completely from Alarm cards */}
          {item.type === 'timer' && (
            <button
              id={`reset-${item.id}`}
              type="button"
              onClick={handleReset}
              className={`rounded-lg sm:rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer active:scale-95 flex-shrink-0 ${
                effectiveCols >= 4 ? 'p-1' : 'p-1.5 sm:p-2'
              }`}
              title={t.reset}
              aria-label={t.reset}
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
