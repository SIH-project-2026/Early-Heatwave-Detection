/**
 * High-precision, soft, non-intrusive Web Audio API sound synthesizer
 * Specially calibrated for disaster & emergency health operations:
 * - Low volume (~10% - 15% gain) to avoid startling operators
 * - Soft exponential envelopes (gentle attack & smooth decay)
 * - Zero harsh clipping or white noise
 */

// Singleton AudioContext to optimize performance and battery
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // Handled silently
      });
    }
    return audioCtx;
  } catch (err) {
    console.warn('AudioContext initialization note:', err);
    return null;
  }
}

/**
 * Check user preferences stored in localStorage
 */
function getStoredPreference(key: 'audioAlarmEnabled' | 'dispatchSoundEnabled'): boolean {
  try {
    const saved = localStorage.getItem('heatwave_portal_preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed[key] === 'boolean') {
        return parsed[key];
      }
    }
  } catch {
    // Default to true
  }
  return true;
}

// Throttle alert sounds to prevent continuous overlapping loops
let lastAlertPlayTime = 0;
const ALERT_THROTTLE_MS = 15000; // max once every 15s automatically

/**
 * Play a gentle, pleasant dual-harmonic chime for Heatwave Alerts
 * Non-harsh, soft sine wave chord (C5 -> E5 -> G5)
 * Master volume: ~0.12 (soft and comfortable, not loud or noisy)
 */
export function playHeatwaveAlertSound(forcePlay: boolean = false): void {
  const isEnabled = getStoredPreference('audioAlarmEnabled');
  if (!forcePlay && !isEnabled) return;

  const now = Date.now();
  if (!forcePlay && now - lastAlertPlayTime < ALERT_THROTTLE_MS) {
    return;
  }
  lastAlertPlayTime = now;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const startTime = ctx.currentTime + 0.05;

    // Harmonic chime note sequence: E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz)
    const notes = [
      { freq: 659.25, time: 0.0, duration: 0.35, gain: 0.12 },
      { freq: 830.61, time: 0.12, duration: 0.4, gain: 0.10 },
      { freq: 987.77, time: 0.24, duration: 0.55, gain: 0.08 },
    ];

    notes.forEach(({ freq, time, duration, gain: noteGain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine'; // Pure smooth sine tone (no harsh harmonics)
      osc.frequency.setValueAtTime(freq, startTime + time);

      // Smooth envelope: soft attack (0.04s) and exponential decay
      gainNode.gain.setValueAtTime(0.0001, startTime + time);
      gainNode.gain.linearRampToValueAtTime(noteGain, startTime + time + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime + time);
      osc.stop(startTime + time + duration);
    });
  } catch (err) {
    console.warn('Alert audio note:', err);
  }
}

/**
 * Play a subtle, clean medical telemetry confirmation chirp
 * Used when dispatching ALS ambulances or pre-alerting hospital ER triage
 * Two soft micro-tones (620Hz -> 880Hz), duration ~0.24s, volume ~0.10
 */
export function playDispatchSound(forcePlay: boolean = false): void {
  const isEnabled = getStoredPreference('dispatchSoundEnabled');
  if (!forcePlay && !isEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const startTime = ctx.currentTime + 0.03;

    // Two-tone acknowledgment blip (clean medical telemetry cue)
    const pings = [
      { freq: 620, time: 0.0, duration: 0.10, maxGain: 0.09 },
      { freq: 880, time: 0.09, duration: 0.16, maxGain: 0.11 },
    ];

    pings.forEach(({ freq, time, duration, maxGain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + time);

      gainNode.gain.setValueAtTime(0.0001, startTime + time);
      gainNode.gain.linearRampToValueAtTime(maxGain, startTime + time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime + time);
      osc.stop(startTime + time + duration);
    });
  } catch (err) {
    console.warn('Dispatch audio note:', err);
  }
}

/**
 * Subtle soft micro-click sound for UI toggle interactions
 * Gain ~0.04, duration 0.05s
 */
export function playToggleSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const startTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, startTime);
    osc.frequency.exponentialRampToValueAtTime(280, startTime + 0.04);

    gainNode.gain.setValueAtTime(0.04, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.04);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.05);
  } catch {
    // Ignore
  }
}
