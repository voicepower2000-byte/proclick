import React from 'react';
import {
  Timer as TimerIcon,
  AlarmClock,
  Coffee,
  Dumbbell,
  Flame,
  Laptop,
  BookOpen,
  Moon,
  HeartPulse,
  Pill,
  Target,
  Rocket,
  Droplets,
  Music,
  Zap,
} from 'lucide-react';
import { TimerStatus } from '../types';

interface CircularProgressProps {
  percentage: number; // 0 to 100
  color: string;
  icon: string;
  iconType: 'emoji' | 'lucide' | 'text';
  size?: number;
  strokeWidth?: number;
  status: TimerStatus;
  isRinging?: boolean;
}

const LUCIDE_MAP: Record<string, React.ElementType> = {
  'timer': TimerIcon,
  'alarm-clock': AlarmClock,
  'coffee': Coffee,
  'dumbbell': Dumbbell,
  'flame': Flame,
  'laptop': Laptop,
  'book-open': BookOpen,
  'moon': Moon,
  'heart-pulse': HeartPulse,
  'pill': Pill,
  'target': Target,
  'rocket': Rocket,
  'droplets': Droplets,
  'music': Music,
  'zap': Zap,
};

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  color,
  icon,
  iconType,
  size = 140,
  strokeWidth,
  status,
  isRinging = false,
}) => {
  const actualStrokeWidth = strokeWidth ?? (size <= 60 ? 3.5 : size <= 85 ? 4.5 : size <= 110 ? 5.5 : 7);
  const radius = (size - actualStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Bound percentage to 0-100
  const normalizedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (normalizedPercentage / 100) * circumference;

  const LucideComponent = iconType === 'lucide' ? LUCIDE_MAP[icon] || TimerIcon : null;

  // Clear inner diameter available inside the circular progress stroke (subtracting stroke thickness + breathing padding)
  const innerDiameter = Math.max(16, Math.floor(size - actualStrokeWidth * 2 - 2));

  // Scaled dimensions (~3x previous sizes, calibrated to fit neatly inside inner diameter)
  const iconDimension = Math.max(14, Math.round(innerDiameter * 0.58));
  const emojiFontSize = Math.max(14, Math.round(innerDiameter * 0.56));

  const textCharCount = Math.max(1, (icon || '').length);
  const textScaleFactor =
    textCharCount <= 1 ? 0.52 : textCharCount === 2 ? 0.42 : textCharCount === 3 ? 0.32 : 0.25;
  const computedTextSize = `${Math.max(10, Math.round(innerDiameter * textScaleFactor))}px`;

  return (
    <div
      className={`relative flex items-center justify-center select-none transition-transform duration-300 ${
        isRinging ? 'animate-bounce' : ''
      }`}
      style={{ width: size, height: size }}
    >
      {/* Ambient background glow ring */}
      {size > 65 && (
        <div
          className="absolute inset-1 sm:inset-2 rounded-full opacity-15 blur-lg transition-opacity duration-300 pointer-events-none"
          style={{
            backgroundColor: color,
            opacity: status === 'active' || isRinging ? 0.25 : 0.08,
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] transform"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1c1c20"
          strokeWidth={actualStrokeWidth}
          className="transition-colors duration-300"
        />

        {/* Dynamic Progress Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={actualStrokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-out"
          style={{
            filter: status === 'active' || isRinging ? `drop-shadow(0 0 8px ${color}99)` : 'none',
          }}
        />
      </svg>

      {/* Center of the Circle: Icon / Emoji / Custom Text (Strictly bounded and centered) */}
      <div
        className="absolute inset-0 m-auto flex items-center justify-center pointer-events-none rounded-full overflow-hidden"
        style={{ width: `${innerDiameter}px`, height: `${innerDiameter}px` }}
      >
        {iconType === 'emoji' ? (
          <span
            className="leading-none select-none flex items-center justify-center max-w-full max-h-full object-contain filter drop-shadow"
            style={{
              fontSize: `${emojiFontSize}px`,
              lineHeight: 1,
            }}
          >
            {icon || '⏱️'}
          </span>
        ) : iconType === 'text' ? (
          <span
            className="font-mono-numbers font-black uppercase tracking-tight select-none truncate leading-none text-center px-0.5 max-w-[90%]"
            style={{
              fontSize: computedTextSize,
              lineHeight: 1,
              color: status === 'active' || isRinging ? color : '#f4f4f5',
              textShadow: status === 'active' ? `0 0 12px ${color}80` : 'none',
            }}
          >
            {icon || 'GO'}
          </span>
        ) : LucideComponent ? (
          <LucideComponent
            style={{
              width: `${iconDimension}px`,
              height: `${iconDimension}px`,
              color: status === 'active' || isRinging ? color : '#d4d4d8',
              filter: status === 'active' ? `drop-shadow(0 0 6px ${color}60)` : 'none',
            }}
            className="flex-shrink-0 object-contain transition-colors duration-200"
          />
        ) : (
          <span
            className="leading-none select-none flex items-center justify-center max-w-full max-h-full"
            style={{
              fontSize: `${emojiFontSize}px`,
              lineHeight: 1,
            }}
          >
            ⏱️
          </span>
        )}
      </div>
    </div>
  );
};
