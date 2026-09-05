import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  RotateCcw,
  Timer,
  Bell,
  Check,
  Pause,
  Play,
  Smile,
  Sparkles,
  Layers,
  Volume2,
  Type,
  Eraser,
  AlertTriangle,
  BellOff,
} from 'lucide-react';
import { useTimers } from '../context/TimerContext';
import { getDictionary } from '../locales/dictionary';
import { ACCENT_COLORS, PRESET_EMOJIS, PRESET_LUCIDE_ICONS } from '../utils/colors';
import { sanitizeInput, validateDuration, getBrokenDownTime } from '../utils/time';
import { TimerType, SoundTone, RingingDuration } from '../types';

const RINGING_DURATION_OPTIONS: { value: RingingDuration; labelKey: 'ringing5s' | 'ringing30s' | 'ringing1m' | 'ringing5m' | 'ringingContinuous' }[] = [
  { value: 5, labelKey: 'ringing5s' },
  { value: 30, labelKey: 'ringing30s' },
  { value: 60, labelKey: 'ringing1m' },
  { value: 300, labelKey: 'ringing5m' },
  { value: 0, labelKey: 'ringingContinuous' },
];

export const TimerModal: React.FC = () => {
  const {
    isModalOpen,
    modalEditingItem,
    defaultModalType,
    closeModal,
    addItem,
    addTimer,
    addAlarm,
    updateItem,
    updateTimer,
    deleteItem,
    deleteTimer,
    resetItem,
    zeroOutItem,
    togglePlayPause,
    language,
    soundTone: globalSoundTone,
    testAudio,
  } = useTimers();

  const t = getDictionary(language);

  // Form states
  const [type, setType] = useState<TimerType>(defaultModalType);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('⏱️');
  const [iconType, setIconType] = useState<'emoji' | 'lucide' | 'text'>('emoji');
  const [customText, setCustomText] = useState('TEA');
  const [color, setColor] = useState(ACCENT_COLORS[0].hex);
  const [soundTone, setItemSoundTone] = useState<SoundTone>('classic-chime');
  const [ringingDuration, setRingingDuration] = useState<RingingDuration>(0);
  
  // Timer duration states
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);

  // Alarm target state
  const [targetTime, setTargetTime] = useState('08:00');
  const [repeatDaily, setRepeatDaily] = useState(true);

  // Error & Confirmation states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Synchronize initial values when modal opens or editing item changes
  useEffect(() => {
    if (!isModalOpen) {
      setErrorMessage(null);
      setShowDeleteConfirm(false);
      return;
    }

    setShowDeleteConfirm(false);
    setErrorMessage(null);

    if (modalEditingItem) {
      setType(modalEditingItem.type);
      setTitle(modalEditingItem.title);
      setIcon(modalEditingItem.icon);
      setIconType(modalEditingItem.iconType || 'emoji');
      if (modalEditingItem.iconType === 'text') {
        setCustomText(modalEditingItem.icon);
      }
      setColor(modalEditingItem.color);
      setItemSoundTone(modalEditingItem.soundTone || globalSoundTone);
      setRingingDuration(modalEditingItem.ringingDuration ?? 0);
      
      if (modalEditingItem.type === 'timer') {
        const parts = getBrokenDownTime(modalEditingItem.totalSeconds);
        setHours(parseInt(parts.hours, 10));
        setMinutes(parseInt(parts.minutes, 10));
        setSeconds(parseInt(parts.seconds, 10));
      } else {
        setTargetTime(modalEditingItem.targetTime || '08:00');
        setRepeatDaily(modalEditingItem.repeatDaily ?? true);
      }
    } else {
      // Create mode
      setType(defaultModalType);
      setTitle('');
      setIcon(defaultModalType === 'timer' ? '⏱️' : '🔔');
      setIconType('emoji');
      setCustomText('GO');
      setColor(ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)].hex);
      setItemSoundTone(globalSoundTone);
      setRingingDuration(0);
      setHours(0);
      setMinutes(10);
      setSeconds(0);
      setTargetTime('08:00');
      setRepeatDaily(true);
    }
  }, [isModalOpen, modalEditingItem, defaultModalType, globalSoundTone]);

  if (!isModalOpen) return null;

  // Quick presets handler
  const applyPreset = (addMinutes: number) => {
    const currentTotal = hours * 3600 + minutes * 60 + seconds;
    const newTotal = Math.max(60, currentTotal + addMinutes * 60);
    const parts = getBrokenDownTime(newTotal);
    setHours(parseInt(parts.hours, 10));
    setMinutes(parseInt(parts.minutes, 10));
    setSeconds(parseInt(parts.seconds, 10));
  };

  // Zero out duration
  const handleZeroOut = () => {
    setHours(0);
    setMinutes(0);
    setSeconds(0);
    if (modalEditingItem && modalEditingItem.type === 'timer') {
      zeroOutItem(modalEditingItem.id);
    }
  };

  // Reset original duration
  const handleResetToDefault = () => {
    if (modalEditingItem && modalEditingItem.type === 'timer') {
      resetItem(modalEditingItem.id);
      const parts = getBrokenDownTime(modalEditingItem.totalSeconds);
      setHours(parseInt(parts.hours, 10));
      setMinutes(parseInt(parts.minutes, 10));
      setSeconds(parseInt(parts.seconds, 10));
    } else {
      setHours(0);
      setMinutes(5);
      setSeconds(0);
      setTargetTime('08:00');
    }
  };

  const handleTogglePause = () => {
    if (modalEditingItem) {
      togglePlayPause(modalEditingItem.id);
      closeModal();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Sanitize title input
    const cleanTitle = sanitizeInput(title);
    const finalTitle = cleanTitle || (type === 'timer' ? `${hours ? hours + 'h ' : ''}${minutes}m Timer` : `Alarm at ${targetTime}`);

    const finalIcon = iconType === 'text' ? (customText.trim().slice(0, 4).toUpperCase() || 'GO') : icon;

    if (type === 'timer') {
      const totalSec = validateDuration(hours, minutes, seconds);
      if (totalSec <= 0) {
        setErrorMessage(t.errorZeroDuration);
        return;
      }

      if (modalEditingItem) {
        updateTimer(modalEditingItem.id, {
          title: finalTitle,
          icon: finalIcon,
          iconType,
          color,
          soundTone,
          ringingDuration,
          totalSeconds: totalSec,
          remainingSeconds: modalEditingItem.remainingSeconds <= 0 ? totalSec : Math.min(modalEditingItem.remainingSeconds, totalSec),
        });
      } else {
        addTimer({
          title: finalTitle,
          icon: finalIcon,
          iconType,
          color,
          soundTone,
          ringingDuration,
          status: 'active',
          totalSeconds: totalSec,
          remainingSeconds: totalSec,
        });
      }
    } else {
      // Alarm
      if (!targetTime || !targetTime.includes(':')) {
        setErrorMessage(t.errorInvalidTime);
        return;
      }

      if (modalEditingItem) {
        updateTimer(modalEditingItem.id, {
          title: finalTitle,
          icon: finalIcon,
          iconType,
          color,
          soundTone,
          ringingDuration,
          targetTime,
          repeatDaily,
        });
      } else {
        addAlarm({
          title: finalTitle,
          icon: finalIcon,
          iconType,
          color,
          soundTone,
          ringingDuration,
          status: 'active',
          totalSeconds: 24 * 3600,
          remainingSeconds: 0,
          targetTime,
          repeatDaily,
        });
      }
    }

    closeModal();
  };

  const handleDelete = () => {
    if (modalEditingItem) {
      deleteTimer(modalEditingItem.id);
      closeModal();
    }
  };

  return (
    <div
      id="timer-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={closeModal}
    >
      <div
        id="timer-modal-container"
        className="relative w-full max-w-lg bg-gradient-to-b from-[#161619] to-[#0c0c0e] border border-zinc-800/90 rounded-2xl shadow-2xl shadow-black/90 p-5 sm:p-6 my-8 text-zinc-100 transition-all max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/70">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">
              {modalEditingItem ? t.editTitle : t.createTitle}
            </h2>
            <p className="text-xs text-zinc-400">
              {modalEditingItem ? modalEditingItem.title : t.appSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label={t.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-5 pt-4">
          
          {/* Type Switcher */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              <Layers className="w-3.5 h-3.5 inline mr-1" />
              {type === 'timer' ? t.typeTimer : t.typeAlarm}
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
              <button
                type="button"
                onClick={() => setType('timer')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  type === 'timer'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Timer className="w-4 h-4" />
                <span>{t.typeTimer}</span>
              </button>
              <button
                type="button"
                onClick={() => setType('alarm')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  type === 'alarm'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>{t.typeAlarm}</span>
              </button>
            </div>
          </div>

          {/* Label / Title Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              {t.labelTitle}
            </label>
            <input
              id="timer-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              placeholder={t.labelPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-zinc-500 focus:outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-colors shadow-inner"
            />
          </div>

          {/* Icon & Emoji & Custom Text Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <Smile className="w-3.5 h-3.5 inline mr-1" />
                {t.iconSelect}
              </label>
              <div className="flex gap-1 text-[11px] bg-zinc-950 p-0.5 rounded-lg border border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIconType('emoji')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    iconType === 'emoji' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.useEmoji}
                </button>
                <button
                  type="button"
                  onClick={() => setIconType('lucide')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    iconType === 'lucide' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.useIcon}
                </button>
                <button
                  type="button"
                  onClick={() => setIconType('text')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    iconType === 'text' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.useCustomText}
                </button>
              </div>
            </div>

            {iconType === 'emoji' ? (
              <div className="flex flex-wrap gap-2 p-2.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl max-h-32 overflow-y-auto">
                {PRESET_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setIcon(em)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-zinc-800 transition-transform active:scale-95 cursor-pointer ${
                      icon === em ? 'bg-zinc-800 ring-2 ring-zinc-400/50' : 'bg-zinc-900/80'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            ) : iconType === 'lucide' ? (
              <div className="flex flex-wrap gap-2 p-2.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl max-h-32 overflow-y-auto">
                {PRESET_LUCIDE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono capitalize hover:bg-zinc-800 transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                      icon === ic ? 'bg-zinc-800 text-white ring-2 ring-zinc-400/50' : 'bg-zinc-900/80 text-zinc-400'
                    }`}
                  >
                    <span>{ic.replace('-', ' ')}</span>
                  </button>
                ))}
              </div>
            ) : (
              /* Custom Text Mode */
              <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-mono-numbers font-black text-sm tracking-wider border shadow-sm select-none"
                  style={{ borderColor: color, color: color, backgroundColor: `${color}15` }}
                >
                  {customText.trim().slice(0, 4).toUpperCase() || 'GO'}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    maxLength={4}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value.toUpperCase())}
                    placeholder={t.customTextPlaceholder}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {t.customTextHint}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Accent Color Picker & Custom Color */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                {t.colorTheme}
              </label>

              {/* Native Color Picker Option */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">{t.customHex}:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 rounded-md border-0 bg-transparent cursor-pointer"
                  />
                  <span
                    className="w-6 h-6 rounded-md border border-zinc-700 block shadow-inner"
                    style={{ backgroundColor: color }}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`group relative h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    color.toLowerCase() === c.hex.toLowerCase()
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-105 shadow-md'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={language === 'ar' ? c.nameAr : c.name}
                >
                  {color.toLowerCase() === c.hex.toLowerCase() && (
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Selector Dropdown Field */}
          <div>
            <label
              htmlFor="modal-sound-tone-select"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2"
            >
              <Volume2 className="w-3.5 h-3.5 inline mr-1 text-zinc-400" />
              {t.soundSelector}
            </label>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  id="modal-sound-tone-select"
                  value={soundTone}
                  onChange={(e) => {
                    const newTone = e.target.value as SoundTone;
                    setItemSoundTone(newTone);
                    testAudio(newTone);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs sm:text-sm font-medium text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer shadow-inner appearance-none pr-8"
                >
                  <option value="classic-chime">🔔 {t.toneClassicChime}</option>
                  <option value="digital-beep">⏱️ {t.toneDigitalBeep}</option>
                  <option value="gentle-bell">🎵 {t.toneGentleBell}</option>
                  <option value="energetic-pulse">⚡ {t.toneEnergeticPulse}</option>
                  <option value="zen-gong">🧘 {t.toneZenGong}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              <button
                id="modal-test-sound-btn"
                type="button"
                onClick={() => testAudio(soundTone)}
                className="px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                title={t.testSound}
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.previewSound}</span>
              </button>
            </div>
          </div>

          {/* Ringing Duration (Auto-Stop) Setting */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
              >
                <BellOff className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t.ringingDurationLabel}</span>
              </label>
              <span className="text-[11px] text-zinc-400 font-medium font-mono-numbers">
                {ringingDuration === 0
                  ? t.ringingContinuous
                  : ringingDuration === 5
                  ? t.ringing5s
                  : ringingDuration === 30
                  ? t.ringing30s
                  : ringingDuration === 60
                  ? t.ringing1m
                  : t.ringing5m}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 mb-2">
              {t.ringingDurationDesc}
            </p>

            <div
              id="modal-ringing-duration-selector"
              className="grid grid-cols-3 sm:grid-cols-5 gap-1.5"
              role="radiogroup"
              aria-label={t.ringingDurationLabel}
            >
              {RINGING_DURATION_OPTIONS.map((opt) => {
                const isSelected = ringingDuration === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setRingingDuration(opt.value)}
                    className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all text-center cursor-pointer select-none border truncate active:scale-95 ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm ring-1 ring-white/20 font-bold'
                        : 'bg-zinc-950/90 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800/90'
                    }`}
                  >
                    {t[opt.labelKey]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration or Target Time controls */}
          {type === 'timer' ? (
            <div className="space-y-3 p-3.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {t.durationSetup}
                </span>
                <button
                  type="button"
                  onClick={handleZeroOut}
                  className="text-[11px] text-zinc-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                  title={t.zeroOut}
                >
                  <Eraser className="w-3 h-3" />
                  <span>{t.zeroOut}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    {t.hours}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, Math.min(99, parseInt(e.target.value, 10) || 0)))}
                    className="w-full text-center py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-lg font-mono-numbers font-bold text-white focus:outline-none focus:border-zinc-500 shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    {t.minutes}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                    className="w-full text-center py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-lg font-mono-numbers font-bold text-white focus:outline-none focus:border-zinc-500 shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    {t.seconds}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={seconds}
                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                    className="w-full text-center py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-lg font-mono-numbers font-bold text-white focus:outline-none focus:border-zinc-500 shadow-inner"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="pt-2">
                <span className="text-[11px] text-zinc-400 block mb-1.5">
                  {t.quickPresets}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 5, 10, 15, 25, 45, 60].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => applyPreset(min)}
                      className="px-2.5 py-1 text-xs font-mono-numbers font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
                    >
                      +{min}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Alarm setup */
            <div className="space-y-3 p-3.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t.alarmTimeSetup}
              </label>

              <div className="flex items-center gap-3">
                <input
                  id="alarm-time-input"
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xl font-mono-numbers font-bold text-white focus:outline-none focus:border-zinc-500 cursor-pointer shadow-inner"
                  required
                />

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={repeatDaily}
                    onChange={(e) => setRepeatDaily(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-white focus:ring-0 cursor-pointer"
                  />
                  <span>{t.repeatDaily}</span>
                </label>
              </div>
            </div>
          )}

          {/* Validation Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Permanent Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-2.5 animate-fadeIn">
              <p className="text-rose-200 font-semibold flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                {t.confirmDelete}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {t.confirmDeleteYes}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                >
                  {t.confirmDeleteNo}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-800/70 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {modalEditingItem && (
                <>
                  {/* Delete Button */}
                  <button
                    id="modal-delete-btn"
                    type="button"
                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      showDeleteConfirm
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border-zinc-800'
                    }`}
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Play/Pause Toggle */}
                  <button
                    id="modal-toggle-state-btn"
                    type="button"
                    onClick={handleTogglePause}
                    className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                    title={modalEditingItem.status === 'active' ? t.pause : t.resume}
                  >
                    {modalEditingItem.status === 'active' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}

              {/* Reset to Original Duration - only for Timers */}
              {type === 'timer' && (
                <button
                  id="modal-reset-btn"
                  type="button"
                  onClick={handleResetToDefault}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                  title={t.resetDefault}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>

              <button
                id="modal-save-btn"
                type="submit"
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-zinc-100 hover:bg-white text-zinc-950 transition-all duration-150 cursor-pointer shadow-sm hover:shadow active:scale-95"
              >
                {modalEditingItem ? t.save : t.create}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
