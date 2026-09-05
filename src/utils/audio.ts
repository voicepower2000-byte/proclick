import { SoundTone } from '../types';

// Web Audio API Synthesizer for reliable, zero-external-dependency alarm sounds
let audioCtx: AudioContext | null = null;
let activeLoopInterval: number | null = null;
let isGloballyMuted = false;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('AudioContext initialization failed:', e);
    return null;
  }
}

/**
 * Play Dual Harmonic Chime (Bright & Pleasant: 880Hz -> 1046.5Hz)
 */
function playChime(ctx: AudioContext, now: number) {
  // Note 1: A5 (880 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now);
  gain1.gain.setValueAtTime(0.25, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.38);

  // Note 2: C6 (1046.5 Hz)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1046.5, now + 0.16);
  gain2.gain.setValueAtTime(0.3, now + 0.16);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.16);
  osc2.stop(now + 0.7);
}

/**
 * Play Digital Beep (Classic Crisp Watch / Clock Beep)
 */
function playDigitalBeep(ctx: AudioContext, now: number) {
  const beeps = [0, 0.11, 0.22];
  beeps.forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1250, now + offset);
    gain.gain.setValueAtTime(0.16, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.07);
  });
}

/**
 * Play Gentle Bell (Warm singing bowl / acoustic bell)
 */
function playGentleBell(ctx: AudioContext, now: number) {
  const partials = [
    { freq: 523.25, gain: 0.28, decay: 1.4 }, // C5 fundamental
    { freq: 1046.5, gain: 0.14, decay: 1.0 }, // C6 octave
    { freq: 1567.98, gain: 0.06, decay: 0.7 }, // G6 fifth
  ];

  partials.forEach((p) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.freq, now);
    gain.gain.setValueAtTime(p.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + p.decay);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + p.decay);
  });
}

/**
 * Play Energetic Pulse (Rising 4-note upbeat synth arpeggio)
 */
function playEnergeticPulse(ctx: AudioContext, now: number) {
  // Rapid ascending notes: C5, E5, G5, C6
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    const startAt = now + idx * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(0.24, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + 0.18);
  });
}

/**
 * Play Zen Gong (Warm resonant acoustic bell with harmonic undertones)
 */
function playZenGong(ctx: AudioContext, now: number) {
  const freqs = [392.0, 784.0, 1174.66]; // G4, G5, D6 harmonic series
  const gains = [0.35, 0.15, 0.08];

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gains[idx], now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.2);
  });
}

/**
 * Plays synthesized tone based on selected sound
 */
export function playTone(tone: SoundTone = 'classic-chime') {
  if (isGloballyMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  switch (tone) {
    case 'digital-beep':
    case 'digital':
      playDigitalBeep(ctx, now);
      break;
    case 'gentle-bell':
      playGentleBell(ctx, now);
      break;
    case 'energetic-pulse':
      playEnergeticPulse(ctx, now);
      break;
    case 'zen-gong':
    case 'gong':
      playZenGong(ctx, now);
      break;
    case 'classic-chime':
    case 'chime':
    default:
      playChime(ctx, now);
      break;
  }
}

/**
 * Backward-compatible single chime trigger
 */
export function playChimeTone(tone: SoundTone = 'classic-chime') {
  playTone(tone);
}

/**
 * Start recurring alarm loop
 */
export function startAlarmLoop(tone: SoundTone = 'classic-chime') {
  if (activeLoopInterval !== null) {
    clearInterval(activeLoopInterval);
    activeLoopInterval = null;
  }
  playTone(tone);
  const intervalTime = tone === 'zen-gong' || tone === 'gong' ? 1800 : 1400;
  activeLoopInterval = window.setInterval(() => {
    if (!isGloballyMuted) {
      playTone(tone);
    }
  }, intervalTime);
}

/**
 * Stop alarm loop
 */
export function stopAlarmLoop() {
  if (activeLoopInterval !== null) {
    clearInterval(activeLoopInterval);
    activeLoopInterval = null;
  }
}

/**
 * Set Global Mute toggle
 */
export function setAudioMuted(muted: boolean) {
  isGloballyMuted = muted;
  if (muted) {
    stopAlarmLoop();
  }
}

export function isAudioMuted(): boolean {
  return isGloballyMuted;
}

