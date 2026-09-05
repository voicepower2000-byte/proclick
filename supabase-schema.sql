-- ==============================================================================
-- Pro Click (بروكليك) - Supabase Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Create the timers_alarms table
CREATE TABLE IF NOT EXISTS public.timers_alarms (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'timer',
  title TEXT NOT NULL,
  icon TEXT DEFAULT '⏱️',
  icon_type TEXT DEFAULT 'emoji',
  color TEXT DEFAULT '#ff3366',
  status TEXT DEFAULT 'paused',
  total_seconds INTEGER DEFAULT 60,
  remaining_seconds INTEGER DEFAULT 60,
  end_timestamp BIGINT,
  target_time TEXT,
  target_timestamp BIGINT,
  repeat_daily BOOLEAN DEFAULT false,
  is_ringing BOOLEAN DEFAULT false,
  ringing_started_at BIGINT,
  ringing_duration INTEGER DEFAULT 0,
  sound_tone TEXT DEFAULT 'classic-chime',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.timers_alarms ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow public read, insert, update, delete for real-time timer sync
DROP POLICY IF EXISTS "Allow public all access on timers_alarms" ON public.timers_alarms;
CREATE POLICY "Allow public all access on timers_alarms"
  ON public.timers_alarms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Enable Realtime on timers_alarms table
ALTER PUBLICATION supabase_realtime ADD TABLE public.timers_alarms;
