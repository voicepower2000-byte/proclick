import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TimerItem, RingingDuration, SoundTone, TimerStatus, TimerType } from '../types';
import { getNextAlarmTimestamp } from '../utils/time';

// Supabase configuration - reads from Vite environment variables with project credentials fallback
export const SUPABASE_URL: string =
  (import.meta.env.VITE_SUPABASE_URL as string) || 'https://xpdujmfyinccoxsxvzfi.supabase.co';
export const SUPABASE_ANON_KEY: string =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_LHWTNnweI3_eaENOVecphw_blSzf3rL';
export const TIMERS_TABLE = 'timers_alarms';

// Export the working client instance directly
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Validates if the Supabase client is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.trim().length > 0);
};

/**
 * Returns the active Supabase client instance
 */
export const getSupabase = (): SupabaseClient => {
  return supabase;
};

/**
 * Ensures any string is converted to a valid RFC4122 UUID compliant with PostgreSQL UUID type
 */
export function toUuid(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  const presetMap: Record<string, string> = {
    'timer-pomodoro': '00000000-0000-4000-8000-000000000001',
    'timer-tea': '00000000-0000-4000-8000-000000000002',
    'timer-workout': '00000000-0000-4000-8000-000000000003',
    'alarm-standup': '00000000-0000-4000-8000-000000000004',
  };
  if (presetMap[id]) return presetMap[id];

  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // fallback
  }

  // Deterministic UUID generation fallback
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `00000000-0000-4000-8000-${hex.repeat(2).substring(0, 12)}`;
}

/**
 * Converts a database row from timers_alarms to client-side TimerItem model
 */
export function dbRowToTimerItem(row: Record<string, any>): TimerItem {
  const type: TimerType = row.type === 'alarm' ? 'alarm' : 'timer';
  const isActive = Boolean(row.is_active);
  const remainingSeconds = Number(row.remaining_seconds ?? 0);
  const durationSeconds = Number(row.duration_seconds ?? row.total_seconds ?? 60);

  let status: TimerStatus = 'paused';
  if (isActive) {
    if (type === 'timer' && remainingSeconds <= 0) {
      status = 'finished';
    } else {
      status = 'active';
    }
  }

  let createdAt = Date.now();
  if (row.created_at) {
    const parsed = new Date(row.created_at).getTime();
    if (!isNaN(parsed)) createdAt = parsed;
  }

  let endTimestamp: number | undefined = undefined;
  if (type === 'timer' && status === 'active' && remainingSeconds > 0) {
    endTimestamp = Date.now() + remainingSeconds * 1000;
  }

  let targetTimestamp: number | undefined = undefined;
  const targetTime = row.target_time || undefined;
  if (type === 'alarm' && targetTime) {
    targetTimestamp = getNextAlarmTimestamp(targetTime).targetTimestamp;
  }

  const rawRingDuration = Number(row.ring_duration ?? 0);
  const ringingDuration: RingingDuration = [0, 15, 30, 60, 120].includes(rawRingDuration)
    ? (rawRingDuration as RingingDuration)
    : 0;

  return {
    id: String(row.id),
    type,
    title: String(row.title || (type === 'timer' ? 'Timer' : 'Alarm')),
    icon: String(row.icon_emoji || row.icon || (type === 'timer' ? '⏱️' : '⏰')),
    iconType: 'emoji',
    color: String(row.color || '#ff3366'),
    status,
    createdAt,
    totalSeconds: durationSeconds,
    remainingSeconds,
    endTimestamp,
    targetTime,
    targetTimestamp,
    repeatDaily: true,
    isRinging: false,
    ringingDuration,
    soundTone: (row.sound_effect || 'classic-chime') as SoundTone,
  };
}

/**
 * Converts a client-side TimerItem to the exact columns of Supabase timers_alarms
 */
export function timerItemToDbRow(item: TimerItem): Record<string, any> {
  return {
    id: toUuid(item.id),
    title: item.title || (item.type === 'timer' ? 'Timer' : 'Alarm'),
    type: item.type === 'alarm' ? 'alarm' : 'timer',
    duration_seconds: item.totalSeconds ?? 60,
    remaining_seconds: Math.max(0, item.remainingSeconds ?? 0),
    target_time: item.type === 'alarm' ? item.targetTime || '08:00' : null,
    is_active: item.status === 'active',
    color: item.color || '#ff3366',
    icon_emoji: item.icon || (item.type === 'timer' ? '⏱️' : '⏰'),
    sound_effect: item.soundTone || 'classic-chime',
    ring_duration: String(item.ringingDuration ?? 0),
    created_at: new Date(item.createdAt || Date.now()).toISOString(),
  };
}

/**
 * Fetches all timers from Supabase
 */
export async function fetchTimersFromCloud(): Promise<{
  success: boolean;
  data?: TimerItem[];
  error?: string;
}> {
try {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: true, data: [] };

  const { data, error } = await supabase
    .from('timers_alarms')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] fetchTimers query error:', error);
      return { success: false, error: error.message };
    }

    const items = (data || []).map(dbRowToTimerItem);
    return { success: true, data: items };
  } catch (err: any) {
    console.error('[Supabase] fetchTimers network/unexpected error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Inserts a single timer or alarm directly into Supabase timers_alarms
 */
export async function insertTimerToCloud(item: TimerItem): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const row = timerItemToDbRow(item);
    console.log('[Supabase] Executing insert to timers_alarms:', row);
    const { data, error } = await supabase
      .from('timers_alarms')
      .insert(row)
      .select();

    if (error) {
      console.error('[Supabase] insertTimer error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Supabase] insertTimer succeeded:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase] insertTimer network/unexpected error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Updates a timer or alarm in Supabase timers_alarms
 */
export async function updateTimerInCloud(
  id: string,
  updates: Partial<TimerItem>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const dbUpdates: Record<string, any> = {};

    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.icon !== undefined) dbUpdates.icon_emoji = updates.icon;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.status !== undefined) dbUpdates.is_active = updates.status === 'active';
    if (updates.totalSeconds !== undefined) dbUpdates.duration_seconds = updates.totalSeconds;
    if (updates.remainingSeconds !== undefined) dbUpdates.remaining_seconds = Math.max(0, updates.remainingSeconds);
    if (updates.targetTime !== undefined) dbUpdates.target_time = updates.targetTime ?? null;
    if (updates.soundTone !== undefined) dbUpdates.sound_effect = updates.soundTone;
    if (updates.ringingDuration !== undefined) dbUpdates.ring_duration = String(updates.ringingDuration);

    const validId = toUuid(id);
    const { error } = await supabase
      .from('timers_alarms')
      .update(dbUpdates)
      .eq('id', validId);

    if (error) {
      console.error('[Supabase] updateTimer error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] updateTimer network error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Upserts a single timer into Supabase
 */
export async function upsertTimerToCloud(item: TimerItem): Promise<{
  success: boolean;
  error?: string;
}> {
try {
  const { data: { user } } = await supabase.auth.getUser();
  const row = timerItemToDbRow(item);
  if (user) {
    row.user_id = user.id;
  }
  const { error } = await supabase
    .from('timers_alarms')
    .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] upsertTimer error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] upsertTimer network error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Upserts multiple timers into Supabase (e.g. initial seed or bulk action)
 */
export async function upsertMultipleTimersToCloud(items: TimerItem[]): Promise<{
  success: boolean;
  error?: string;
}> {
  if (items.length === 0) {
    return { success: true };
  }

  try {
    const rows = items.map(timerItemToDbRow);
    const { error } = await supabase
      .from('timers_alarms')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] upsertMultipleTimers error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] upsertMultipleTimers network error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Deletes a timer by ID from Supabase
 */
export async function deleteTimerFromCloud(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validId = toUuid(id);
    const { error } = await supabase
      .from('timers_alarms')
      .delete()
      .eq('id', validId);

    if (error) {
      console.error('[Supabase] deleteTimer error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] deleteTimer network error:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Tests live connection to Supabase
 */
export async function testCloudConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('timers_alarms').select('id').limit(1);
    if (error) {
      console.error('[Supabase] testCloudConnection error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] testCloudConnection network error:', err);
    return false;
  }
}
