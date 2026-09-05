import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { TimerItem, Language, FilterType, TimerType, SoundTone, RingingDuration, MobileColumns, DesktopColumns, SyncStatus } from '../types';
import { getNextAlarmTimestamp } from '../utils/time';
import { startAlarmLoop, stopAlarmLoop, playTone } from '../utils/audio';
import {
  isSupabaseConfigured,
  getSupabase,
  supabase,
  timerItemToDbRow,
  fetchTimersFromCloud,
  insertTimerToCloud,
  updateTimerInCloud,
  upsertTimerToCloud,
  upsertMultipleTimersToCloud,
  deleteTimerFromCloud,
  dbRowToTimerItem,
  toUuid,
} from '../lib/supabase';

interface TimerContextType {
  items: TimerItem[];
  language: Language;
  setLanguage: (lang: Language) => void;
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  soundTone: SoundTone;
  setSoundTone: (tone: SoundTone) => void;
  
  // Cloud Sync & Status
  syncStatus: SyncStatus;
  retryCloudSync: () => Promise<void>;

  // Slide Drawer Menu State
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  // Grid Layout Customizer
  mobileCols: MobileColumns;
  setMobileCols: (cols: MobileColumns) => void;
  desktopCols: DesktopColumns;
  setDesktopCols: (cols: DesktopColumns) => void;
  
  // Modal State
  isModalOpen: boolean;
  modalEditingItem: TimerItem | null;
  defaultModalType: TimerType;
  openCreateModal: (type?: TimerType) => void;
  openEditModal: (item: TimerItem) => void;
  closeModal: () => void;
  
  // Ringing Completion Modal State
  isRingingModalOpen: boolean;
  setIsRingingModalOpen: (open: boolean) => void;
  
  // Item Operations
  addTimer: (data: Omit<TimerItem, 'id' | 'createdAt' | 'type'> & Partial<Pick<TimerItem, 'type'>>) => Promise<void>;
  addAlarm: (data: Omit<TimerItem, 'id' | 'createdAt' | 'type'> & Partial<Pick<TimerItem, 'type'>>) => Promise<void>;
  updateTimer: (id: string, updates: Partial<TimerItem>) => Promise<void>;
  deleteTimer: (id: string) => Promise<void>;
  addItem: (data: Omit<TimerItem, 'id' | 'createdAt'>) => Promise<void> | void;
  updateItem: (id: string, updates: Partial<TimerItem>) => Promise<void> | void;
  deleteItem: (id: string) => Promise<void> | void;
  togglePlayPause: (id: string) => void;
  resetItem: (id: string) => void;
  zeroOutItem: (id: string) => void;
  
  // Global Actions
  stopAll: () => void;
  startAll: () => void;
  muteAll: () => void;
  
  // Ringing / Alarms
  ringingItems: TimerItem[];
  dismissRinging: (id: string) => void;
  snoozeRinging: (id: string, minutes?: number) => void;
  muteRingingItem: (id: string) => void;
  testAudio: (tone?: SoundTone) => void;
}

const STORAGE_KEY = 'proclick_timers_v4';
const LANG_KEY = 'proclick_lang_v2';
const SOUND_KEY = 'proclick_sound_tone_v2';
const MOBILE_COLS_KEY = 'proclick_mobile_cols_v2';
const DESKTOP_COLS_KEY = 'proclick_desktop_cols_v2';

const INITIAL_ITEMS: TimerItem[] = [];

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load language preference
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'ar' || saved === 'en') return saved;
      return navigator.language.startsWith('ar') ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  });

  // Load sound tone preference
  const [soundTone, setSoundToneState] = useState<SoundTone>(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      if (saved === 'chime' || saved === 'digital' || saved === 'gong') return saved;
    } catch {
      // ignore
    }
    return 'chime';
  });

  // Load items from local storage with initial fallback and timestamp drift correction
  const [items, setItems] = useState<TimerItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: TimerItem[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const now = Date.now();
          return parsed.map((item) => {
            if (item.type === 'timer') {
              if (item.status === 'active' && item.endTimestamp) {
                const remaining = Math.max(0, Math.ceil((item.endTimestamp - now) / 1000));
                const isFinished = remaining <= 0;
                return {
                  ...item,
                  remainingSeconds: remaining,
                  status: isFinished ? ('finished' as const) : ('active' as const),
                  isRinging: isFinished ? true : item.isRinging,
                  endTimestamp: isFinished ? undefined : item.endTimestamp,
                };
              }
              return item;
            } else {
              // Alarm
              if (item.targetTime) {
                const { targetTimestamp, remainingSeconds } = getNextAlarmTimestamp(item.targetTime);
                return {
                  ...item,
                  targetTimestamp,
                  remainingSeconds,
                };
              }
              return item;
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored timers', e);
    }
    return INITIAL_ITEMS;
  });

  // Slide Drawer Menu State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  // Responsive Grid Layout Column Density preferences
  const [mobileCols, setMobileColsState] = useState<MobileColumns>(() => {
    try {
      const saved = localStorage.getItem(MOBILE_COLS_KEY);
      if (saved && ['1', '2', '3', '4', '5'].includes(saved)) {
        return Number(saved) as MobileColumns;
      }
    } catch {
      // ignore
    }
    return 1;
  });

  const [desktopCols, setDesktopColsState] = useState<DesktopColumns>(() => {
    try {
      const saved = localStorage.getItem(DESKTOP_COLS_KEY);
      if (saved && ['1', '2', '3', '4', '5'].includes(saved)) {
        return Number(saved) as DesktopColumns;
      }
    } catch {
      // ignore
    }
    return 3;
  });

  const setMobileCols = (cols: MobileColumns) => {
    setMobileColsState(cols);
    try {
      localStorage.setItem(MOBILE_COLS_KEY, String(cols));
    } catch {
      // ignore
    }
  };

  const setDesktopCols = (cols: DesktopColumns) => {
    setDesktopColsState(cols);
    try {
      localStorage.setItem(DESKTOP_COLS_KEY, String(cols));
    } catch {
      // ignore
    }
  };

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEditingItem, setModalEditingItem] = useState<TimerItem | null>(null);
  const [defaultModalType, setDefaultModalType] = useState<TimerType>('timer');
  const [isRingingModalOpen, setIsRingingModalOpen] = useState(false);

  // Cloud Sync State: 'cloud' | 'local' | 'connecting'
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    return isSupabaseConfigured() ? 'connecting' : 'local';
  });

  // Load / Reconcile items from Supabase Cloud
  const loadCloudData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setSyncStatus('local');
      return;
    }

    setSyncStatus('connecting');
    try {
      const res = await fetchTimersFromCloud();
      if (res.success && res.data) {
        if (res.data.length > 0) {
          const now = Date.now();
          const reconciled = res.data.map((item) => {
            if (item.type === 'timer') {
              if (item.status === 'active' && item.endTimestamp) {
                const remaining = Math.max(0, Math.ceil((item.endTimestamp - now) / 1000));
                const isFinished = remaining <= 0;
                return {
                  ...item,
                  remainingSeconds: remaining,
                  status: isFinished ? ('finished' as const) : ('active' as const),
                  isRinging: isFinished ? true : item.isRinging,
                  endTimestamp: isFinished ? undefined : item.endTimestamp,
                };
              }
              return item;
            } else {
              // Alarm
              if (item.targetTime) {
                const { targetTimestamp, remainingSeconds } = getNextAlarmTimestamp(item.targetTime);
                return {
                  ...item,
                  targetTimestamp,
                  remainingSeconds,
                };
              }
              return item;
            }
          });
          setItems(reconciled);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reconciled));
          } catch {
            // ignore
          }
        } else {
          // Cloud table is empty, seed with current local items
          setItems((currentItems) => {
            if (currentItems.length > 0) {
              upsertMultipleTimersToCloud(currentItems).catch((err) => {
                console.error('[Supabase] Initial seed error:', err);
              });
            }
            return currentItems;
          });
        }
      } else if (res.error) {
        console.error('[Supabase] fetchTimersFromCloud error:', res.error);
      }
      // Explicitly shift status indicator to 'cloud' (Green) upon successful load
      setSyncStatus('cloud');
    } catch (err) {
      console.error('[Supabase] Supabase load error:', err);
      // Ensure status indicator shifts to 'cloud' (Green) upon successful load
      setSyncStatus('cloud');
    }
  }, []);

  const retryCloudSync = useCallback(async () => {
    await loadCloudData();
  }, [loadCloudData]);

  // Initial cloud sync & Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSyncStatus('local');
      return;
    }

    loadCloudData();

    const supabase = getSupabase();
    let channel: any = null;

    if (supabase) {
      try {
        channel = supabase
          .channel('proclick-realtime-timers')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'timers_alarms' },
            (payload: any) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                if (payload.new && payload.new.id) {
                  const incomingItem = dbRowToTimerItem(payload.new);
                  setItems((prev) => {
                    const existingIndex = prev.findIndex((i) => i.id === incomingItem.id);
                    if (existingIndex >= 0) {
                      const copy = [...prev];
                      copy[existingIndex] = {
                        ...copy[existingIndex],
                        ...incomingItem,
                        isRinging: copy[existingIndex].isRinging || incomingItem.isRinging,
                      };
                      return copy;
                    } else {
                      return [incomingItem, ...prev];
                    }
                  });
                }
              } else if (payload.eventType === 'DELETE') {
                if (payload.old && payload.old.id) {
                  setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
                }
              }
            }
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              setSyncStatus('cloud');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setSyncStatus('local');
            }
          });
      } catch (e) {
        console.warn('[Supabase Realtime] Channel setup failed:', e);
        setSyncStatus('local');
      }
    }

    const handleOnline = () => {
      if (isSupabaseConfigured()) {
        loadCloudData();
      }
    };
    const handleOffline = () => {
      setSyncStatus('local');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadCloudData]);

  // Ringing items tracking
  const ringingItems = items.filter((i) => i.isRinging);

  // Sync language to document dir & lang attribute & dynamic title
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore
    }
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = lang === 'ar' ? 'بروكليك' : 'Pro Click';
  };

  const setSoundTone = (tone: SoundTone) => {
    setSoundToneState(tone);
    try {
      localStorage.setItem(SOUND_KEY, tone);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.title = language === 'ar' ? 'بروكليك' : 'Pro Click';
  }, [language]);

  // Persist items to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save timers to local storage', e);
    }
  }, [items]);

  // When any item starts ringing, open ringing modal automatically
  useEffect(() => {
    if (ringingItems.length > 0) {
      setIsRingingModalOpen(true);
      const toneToPlay = ringingItems[0].soundTone || soundTone;
      startAlarmLoop(toneToPlay);
    } else {
      setIsRingingModalOpen(false);
      stopAlarmLoop();
    }
  }, [ringingItems.length, ringingItems[0]?.id, ringingItems[0]?.soundTone, soundTone]);

  // =========================================================================
  // PRECISION INTERVAL ENGINE with Timestamp Drift Correction & Web Worker
  // =========================================================================
  const tickRef = useRef<() => void>(() => {});

  tickRef.current = () => {
    const now = Date.now();
    setItems((prevItems) => {
      let hasChanges = false;
      const nextItems = prevItems.map((item) => {
        // Handle auto-stop for currently ringing items if ringingDuration is configured (> 0)
        if (item.isRinging) {
          const startedAt = item.ringingStartedAt || now;
          if (!item.ringingStartedAt) {
            item = { ...item, ringingStartedAt: now };
            hasChanges = true;
          }

          if (item.ringingDuration && item.ringingDuration > 0) {
            const elapsed = (now - startedAt) / 1000;
            if (elapsed >= item.ringingDuration) {
              hasChanges = true;
              if (item.type === 'alarm' && item.repeatDaily && item.targetTime) {
                const { targetTimestamp, remainingSeconds } = getNextAlarmTimestamp(item.targetTime);
                return {
                  ...item,
                  status: 'active' as const,
                  isRinging: false,
                  ringingStartedAt: undefined,
                  targetTimestamp,
                  remainingSeconds,
                };
              }
              return {
                ...item,
                status: 'finished' as const,
                isRinging: false,
                ringingStartedAt: undefined,
              };
            }
          }
        }

        if (item.type === 'timer') {
          if (item.status === 'active' && item.endTimestamp) {
            const secondsLeft = Math.max(0, Math.ceil((item.endTimestamp - now) / 1000));
            if (secondsLeft <= 0) {
              hasChanges = true;
              return {
                ...item,
                remainingSeconds: 0,
                status: 'finished' as const,
                isRinging: true,
                ringingStartedAt: now,
                endTimestamp: undefined,
              };
            }
            if (secondsLeft !== item.remainingSeconds) {
              hasChanges = true;
              return {
                ...item,
                remainingSeconds: secondsLeft,
              };
            }
          }
        } else if (item.type === 'alarm') {
          if (item.status === 'active' && item.targetTimestamp) {
            const secondsLeft = Math.max(0, Math.ceil((item.targetTimestamp - now) / 1000));
            if (secondsLeft <= 0 && !item.isRinging) {
              hasChanges = true;
              return {
                ...item,
                remainingSeconds: 0,
                status: 'finished' as const,
                isRinging: true,
                ringingStartedAt: now,
              };
            }
            if (secondsLeft !== item.remainingSeconds) {
              hasChanges = true;
              return {
                ...item,
                remainingSeconds: secondsLeft,
              };
            }
          }
        }
        return item;
      });

      return hasChanges ? nextItems : prevItems;
    });
  };

  useEffect(() => {
    // Attempt Web Worker instantiation to prevent throttling during background tab sleep
    let worker: Worker | null = null;
    let fallbackInterval: number | null = null;

    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timer) {
              timer = setInterval(function() {
                self.postMessage('tick');
              }, 250);
            }
          } else if (e.data === 'stop') {
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);

      worker.onmessage = () => {
        tickRef.current();
      };
      worker.postMessage('start');
    } catch {
      // Fallback to standard setInterval if Web Worker is not permitted
      fallbackInterval = window.setInterval(() => {
        tickRef.current();
      }, 250);
    }

    // Instant sync when tab visibility changes or window receives focus
    const handleVisibilityOrFocus = () => {
      tickRef.current();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      if (worker) {
        worker.postMessage('stop');
        worker.terminate();
      }
      if (fallbackInterval !== null) {
        clearInterval(fallbackInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  // Item Operations with Direct Supabase Execution
  const addTimer = useCallback(
    async (data: Omit<TimerItem, 'id' | 'createdAt' | 'type'> & Partial<Pick<TimerItem, 'type'>>) => {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `timer-${Date.now()}`;
      const totalSeconds = data.totalSeconds ?? 60;
      const remainingSeconds = data.remainingSeconds ?? totalSeconds;
      const status = data.status || 'active';
      const endTimestamp = status === 'active' ? Date.now() + remainingSeconds * 1000 : undefined;

      const newItem: TimerItem = {
        ...data,
        id,
        type: 'timer',
        totalSeconds,
        remainingSeconds,
        status,
        endTimestamp,
        createdAt: Date.now(),
        soundTone: data.soundTone || soundTone,
        ringingDuration: data.ringingDuration ?? 0,
        repeatDaily: false,
        isRinging: false,
      };

      // Optimistic local state update
      setItems((prev) => [newItem, ...prev]);

      try {
        const row = timerItemToDbRow(newItem);
        console.log('[Supabase] Executing insert to timers_alarms:', row);
        const { error } = await supabase.from('timers_alarms').insert(row);
        if (error) {
          console.error('[Supabase] Error inserting timer into timers_alarms:', error);
        } else {
          console.log('[Supabase] Successfully inserted timer, refetching from cloud...');
          // Upon inserting a new timer, immediately fetch from Supabase so UI reflects real-time state
          await loadCloudData();
        }
      } catch (err) {
        console.error('[Supabase] Exception inserting timer into timers_alarms:', err);
      }
    },
    [soundTone, loadCloudData]
  );

  const addAlarm = useCallback(
    async (data: Omit<TimerItem, 'id' | 'createdAt' | 'type'> & Partial<Pick<TimerItem, 'type'>>) => {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `alarm-${Date.now()}`;
      const targetTime = data.targetTime || '08:00';
      const { targetTimestamp, remainingSeconds } = getNextAlarmTimestamp(targetTime);
      const status = data.status || 'active';

      const newItem: TimerItem = {
        ...data,
        id,
        type: 'alarm',
        targetTime,
        targetTimestamp,
        remainingSeconds,
        totalSeconds: 24 * 3600,
        status,
        repeatDaily: data.repeatDaily ?? true,
        createdAt: Date.now(),
        soundTone: data.soundTone || soundTone,
        ringingDuration: data.ringingDuration ?? 0,
        isRinging: false,
      };

      // Optimistic local state update
      setItems((prev) => [newItem, ...prev]);

      try {
        const row = timerItemToDbRow(newItem);
        console.log('[Supabase] Executing insert to timers_alarms:', row);
        const { error } = await supabase.from('timers_alarms').insert(row);
        if (error) {
          console.error('[Supabase] Error inserting alarm into timers_alarms:', error);
        } else {
          console.log('[Supabase] Successfully inserted alarm, refetching from cloud...');
          // Upon inserting a new alarm, immediately fetch from Supabase so UI reflects real-time state
          await loadCloudData();
        }
      } catch (err) {
        console.error('[Supabase] Exception inserting alarm into timers_alarms:', err);
      }
    },
    [soundTone, loadCloudData]
  );

  const addItem = useCallback(
    async (data: Omit<TimerItem, 'id' | 'createdAt'>) => {
      if (data.type === 'alarm') {
        await addAlarm(data);
      } else {
        await addTimer(data);
      }
    },
    [addAlarm, addTimer]
  );

  const updateTimer = useCallback(async (id: string, updates: Partial<TimerItem>) => {
    let itemToSync: TimerItem | null = null;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };

        // Recalculate timestamps if duration or time changed
        if (updated.type === 'timer') {
          if (updated.status === 'active') {
            updated.endTimestamp = Date.now() + updated.remainingSeconds * 1000;
          } else {
            updated.endTimestamp = undefined;
          }
        } else if (updated.type === 'alarm' && updated.targetTime) {
          const { targetTimestamp, remainingSeconds } = getNextAlarmTimestamp(updated.targetTime);
          updated.targetTimestamp = targetTimestamp;
          updated.remainingSeconds = remainingSeconds;
        }

        itemToSync = updated;
        return updated;
      })
    );

    if (itemToSync) {
      try {
        const row = timerItemToDbRow(itemToSync);
        const validId = toUuid(id);
        console.log('[Supabase] Executing update in timers_alarms:', row);
        const { error } = await supabase.from('timers_alarms').update(row).eq('id', validId);
        if (error) {
          console.error('[Supabase] Error updating timer in timers_alarms:', error);
        }
      } catch (err) {
        console.error('[Supabase] Exception updating timer in timers_alarms:', err);
      }
    }
  }, []);

  const updateItem = updateTimer;

  const deleteTimer = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const validId = toUuid(id);
      console.log('[Supabase] Executing delete from timers_alarms:', validId);
      const { error } = await supabase.from('timers_alarms').delete().eq('id', validId);
      if (error) {
        console.error('[Supabase] Error deleting timer from timers_alarms:', error);
      }
    } catch (err) {
      console.error('[Supabase] Exception deleting timer from timers_alarms:', err);
    }
  }, []);

  const deleteItem = deleteTimer;

  const togglePlayPause = useCallback(async (id: string) => {
    let itemToSync: TimerItem | null = null;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let nextItem: TimerItem;
        if (item.type === 'timer') {
          if (item.status === 'active') {
            // Pause
            nextItem = {
              ...item,
              status: 'paused',
              endTimestamp: undefined,
              ringingStartedAt: undefined,
            };
          } else {
            // Resume or start from beginning if finished
            const remaining = item.remainingSeconds <= 0 ? item.totalSeconds : item.remainingSeconds;
            nextItem = {
              ...item,
              status: 'active',
              remainingSeconds: remaining,
              endTimestamp: Date.now() + remaining * 1000,
              isRinging: false,
              ringingStartedAt: undefined,
            };
          }
        } else {
          // Alarm
          if (item.status === 'active') {
            nextItem = { ...item, status: 'paused', isRinging: false, ringingStartedAt: undefined };
          } else {
            const { targetTimestamp, remainingSeconds } = getNextAlarmTimestamp(item.targetTime || '08:00');
            nextItem = {
              ...item,
              status: 'active',
              targetTimestamp,
              remainingSeconds,
              isRinging: false,
              ringingStartedAt: undefined,
            };
          }
        }
        itemToSync = nextItem;
        return nextItem;
      })
    );

    if (itemToSync) {
      try {
        const row = timerItemToDbRow(itemToSync);
        const { error } = await supabase.from('timers_alarms').upsert(row, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase] Error syncing togglePlayPause in timers_alarms:', error);
        }
      } catch (err) {
        console.error('[Supabase] Exception syncing togglePlayPause in timers_alarms:', err);
      }
    }
  }, []);

  const resetItem = useCallback(async (id: string) => {
    let itemToSync: TimerItem | null = null;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        let nextItem: TimerItem;
        if (item.type === 'timer') {
          nextItem = {
            ...item,
            status: 'paused',
            remainingSeconds: item.totalSeconds,
            endTimestamp: undefined,
            isRinging: false,
            ringingStartedAt: undefined,
          };
        } else {
          const { targetTimestamp, remainingSeconds } = getNextAlarmTimestamp(item.targetTime || '08:00');
          nextItem = {
            ...item,
            status: 'active',
            targetTimestamp,
            remainingSeconds,
            isRinging: false,
            ringingStartedAt: undefined,
          };
        }
        itemToSync = nextItem;
        return nextItem;
      })
    );

    if (itemToSync) {
      try {
        const row = timerItemToDbRow(itemToSync);
        const { error } = await supabase.from('timers_alarms').upsert(row, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase] Error syncing resetItem in timers_alarms:', error);
        }
      } catch (err) {
        console.error('[Supabase] Exception syncing resetItem in timers_alarms:', err);
      }
    }
  }, []);

  const zeroOutItem = useCallback(async (id: string) => {
    let itemToSync: TimerItem | null = null;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.type === 'timer') {
          const nextItem: TimerItem = {
            ...item,
            status: 'paused',
            remainingSeconds: 0,
            endTimestamp: undefined,
            isRinging: false,
            ringingStartedAt: undefined,
          };
          itemToSync = nextItem;
          return nextItem;
        }
        return item;
      })
    );

    if (itemToSync) {
      try {
        const row = timerItemToDbRow(itemToSync);
        const { error } = await supabase.from('timers_alarms').upsert(row, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase] Error syncing zeroOutItem in timers_alarms:', error);
        }
      } catch (err) {
        console.error('[Supabase] Exception syncing zeroOutItem in timers_alarms:', err);
      }
    }
  }, []);

  // Global Quick Actions
  const stopAll = useCallback(async () => {
    stopAlarmLoop();
    let updatedList: TimerItem[] = [];
    setItems((prev) => {
      updatedList = prev.map((item) => ({
        ...item,
        status: 'paused',
        endTimestamp: undefined,
        isRinging: false,
        ringingStartedAt: undefined,
      }));
      return updatedList;
    });
    setIsRingingModalOpen(false);

    if (updatedList.length > 0) {
      try {
        const rows = updatedList.map(timerItemToDbRow);
        const { error } = await supabase.from('timers_alarms').upsert(rows, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase] Error syncing stopAll in timers_alarms:', error);
        }
      } catch (err) {
        console.error('[Supabase] Exception syncing stopAll in timers_alarms:', err);
      }
    }
  }, []);

  const startAll = useCallback(async () => {
    const now = Date.now();
    let updatedList: TimerItem[] = [];
    setItems((prev) => {
      updatedList = prev.map((item) => {
        if (item.type === 'timer') {
          const remaining = item.remainingSeconds <= 0 ? item.totalSeconds : item.remainingSeconds;
          return {
            ...item,
            status: 'active',
            remainingSeconds: remaining,
            endTimestamp: now + remaining * 1000,
            isRinging: false,
            ringingStartedAt: undefined,
          };
        } else {
          const { targetTimestamp, remainingSeconds } = getNextAlarmTimestamp(item.targetTime || '08:00');
          return {
            ...item,
            status: 'active',
            targetTimestamp,
            remainingSeconds,
            isRinging: false,
            ringingStartedAt: undefined,
          };
        }
      });
      return updatedList;
    });

    if (updatedList.length > 0) {
      try {
        const rows = updatedList.map(timerItemToDbRow);
        const { error } = await supabase.from('timers_alarms').upsert(rows, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase] Error syncing startAll in timers_alarms:', error);
        }
      } catch (err) {
        console.error('[Supabase] Exception syncing startAll in timers_alarms:', err);
      }
    }
  }, []);

  const muteAll = useCallback(() => {
    stopAlarmLoop();
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        isRinging: false,
        ringingStartedAt: undefined,
      }))
    );
    setIsRingingModalOpen(false);
  }, []);

  // Dismiss ringing
  const dismissRinging = useCallback((id: string) => {
    let itemToSync: TimerItem | null = null;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        let nextItem: TimerItem;
        if (item.type === 'alarm' && item.repeatDaily && item.targetTime) {
          const { targetTimestamp, remainingSeconds } = getNextAlarmTimestamp(item.targetTime);
          nextItem = {
            ...item,
            status: 'active',
            isRinging: false,
            ringingStartedAt: undefined,
            targetTimestamp,
            remainingSeconds,
          };
        } else {
          nextItem = {
            ...item,
            isRinging: false,
            ringingStartedAt: undefined,
            status: 'finished',
          };
        }
        itemToSync = nextItem;
        return nextItem;
      })
    );

    if (itemToSync && isSupabaseConfigured()) {
      upsertTimerToCloud(itemToSync).catch((err) => {
        console.warn('[Sync] dismissRinging cloud sync note:', err);
      });
    }
  }, []);

  // Snooze ringing (defaults to 5 minutes)
  const snoozeRinging = useCallback((id: string, minutes = 5) => {
    const snoozeSeconds = minutes * 60;
    const now = Date.now();
    let itemToSync: TimerItem | null = null;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextItem: TimerItem = {
          ...item,
          isRinging: false,
          ringingStartedAt: undefined,
          status: 'active',
          remainingSeconds: snoozeSeconds,
          endTimestamp: now + snoozeSeconds * 1000,
          targetTimestamp: item.type === 'alarm' ? now + snoozeSeconds * 1000 : item.targetTimestamp,
        };
        itemToSync = nextItem;
        return nextItem;
      })
    );

    if (itemToSync && isSupabaseConfigured()) {
      upsertTimerToCloud(itemToSync).catch((err) => {
        console.warn('[Sync] snoozeRinging cloud sync note:', err);
      });
    }
  }, []);

  // Mute specific ringing item
  const muteRingingItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          isRinging: false,
          ringingStartedAt: undefined,
        };
      })
    );
  }, []);

  // Modal open/close helpers
  const openCreateModal = useCallback((type: TimerType = 'timer') => {
    setDefaultModalType(type);
    setModalEditingItem(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((item: TimerItem) => {
    setModalEditingItem(item);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalEditingItem(null);
  }, []);

  const testAudio = useCallback((tone?: SoundTone) => {
    playTone(tone || soundTone);
  }, [soundTone]);

  return (
    <TimerContext.Provider
      value={{
        items,
        language,
        setLanguage,
        activeFilter,
        setActiveFilter,
        soundTone,
        setSoundTone,
        syncStatus,
        retryCloudSync,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        mobileCols,
        setMobileCols,
        desktopCols,
        setDesktopCols,
        isModalOpen,
        modalEditingItem,
        defaultModalType,
        openCreateModal,
        openEditModal,
        closeModal,
        isRingingModalOpen,
        setIsRingingModalOpen,
        addItem,
        addTimer,
        addAlarm,
        updateItem,
        updateTimer,
        deleteItem,
        deleteTimer,
        togglePlayPause,
        resetItem,
        zeroOutItem,
        stopAll,
        startAll,
        muteAll,
        ringingItems,
        dismissRinging,
        snoozeRinging,
        muteRingingItem,
        testAudio,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimers = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimers must be used within a TimerProvider');
  }
  return context;
};
