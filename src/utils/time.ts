/**
 * Security: Sanitize user text inputs to prevent XSS and malformed payloads
 */
export function sanitizeInput(text: string, maxLength = 60): string {
  if (!text) return '';
  // Strip control characters, html tags, and trim
  return text
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Format total seconds into HH:MM:SS
 */
export function formatSecondsToHHMMSS(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00:00';
  }
  
  const rounded = Math.ceil(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Get broken-down units for display
 */
export function getBrokenDownTime(totalSeconds: number) {
  const rounded = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  const s = rounded % 60;
  return {
    hours: h.toString().padStart(2, '0'),
    minutes: m.toString().padStart(2, '0'),
    seconds: s.toString().padStart(2, '0'),
  };
}

/**
 * Parse HH:MM (24h) string into next occurrence timestamp
 */
export function getNextAlarmTimestamp(timeStr: string): { targetTimestamp: number; remainingSeconds: number } {
  const [hStr, mStr] = timeStr.split(':');
  const targetHour = parseInt(hStr, 10);
  const targetMin = parseInt(mStr, 10);

  const now = new Date();
  const target = new Date(now);

  target.setHours(targetHour, targetMin, 0, 0);

  // If target time has already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const remainingSeconds = Math.max(0, Math.round((target.getTime() - now.getTime()) / 1000));

  return {
    targetTimestamp: target.getTime(),
    remainingSeconds,
  };
}

/**
 * Validate timer duration in seconds
 */
export function validateDuration(hours: number, minutes: number, seconds: number): number {
  const h = Math.min(Math.max(0, isNaN(hours) ? 0 : Math.floor(hours)), 99);
  const m = Math.min(Math.max(0, isNaN(minutes) ? 0 : Math.floor(minutes)), 59);
  const s = Math.min(Math.max(0, isNaN(seconds) ? 0 : Math.floor(seconds)), 59);
  return h * 3600 + m * 60 + s;
}

/**
 * Format timestamp to localized readable time
 */
export function formatClockTime(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
