export type TimerType = 'timer' | 'alarm';
export type TimerStatus = 'active' | 'paused' | 'finished';
export type Language = 'en' | 'ar';
export type FilterType = 'all' | 'timers' | 'alarms';
export type SoundTone =
  | 'classic-chime'
  | 'digital-beep'
  | 'gentle-bell'
  | 'energetic-pulse'
  | 'zen-gong'
  | 'chime'
  | 'digital'
  | 'gong';

export type RingingDuration = 5 | 30 | 60 | 300 | 0; // 0 = Continuous

export type SyncStatus = 'cloud' | 'local' | 'connecting';

export type MobileColumns = 1 | 2 | 3 | 4 | 5;
export type DesktopColumns = 1 | 2 | 3 | 4 | 5;

export interface AccentColor {
  id: string;
  name: string;
  nameAr: string;
  hex: string;
  ring: string;
  bgSubtle: string;
  glow: string;
}

export interface TimerItem {
  id: string;
  type: TimerType;
  title: string;
  icon: string;
  iconType: 'emoji' | 'lucide' | 'text';
  color: string; // Hex color code
  status: TimerStatus;
  createdAt: number;
  
  // Timer specific fields
  totalSeconds: number; // Duration configured in seconds
  remainingSeconds: number; // Seconds left
  endTimestamp?: number; // Target completion timestamp if active
  
  // Alarm specific fields
  targetTime?: string; // "HH:MM" (24-hour format)
  targetTimestamp?: number; // Exact timestamp of next occurrence
  repeatDaily?: boolean;
  
  // Ringing & alarm trigger
  isRinging?: boolean;
  ringingStartedAt?: number; // Timestamp when ringing started
  ringingDuration?: RingingDuration; // Auto-stop ringing duration (0 = Continuous)
  soundTone?: SoundTone;
}

export interface NewTimerFormData {
  type: TimerType;
  title: string;
  icon: string;
  iconType: 'emoji' | 'lucide' | 'text';
  color: string;
  hours: number;
  minutes: number;
  seconds: number;
  targetTime: string; // "HH:MM"
  repeatDaily: boolean;
  soundTone?: SoundTone;
  ringingDuration?: RingingDuration;
}
