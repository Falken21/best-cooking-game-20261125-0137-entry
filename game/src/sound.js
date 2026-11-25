// Copper Pan Diner — sound: a tiny WebAudio synth, every effect made from
// oscillators and filtered noise in code, so the game needs no audio files.
// The context opens on the first player gesture; until then (and on browsers
// without WebAudio) every call is a silent no-op.

let context = null;
let master = null;

function ensureContext() {
  if (context !== null) {
    if (context.state === 'suspended') context.resume();
    return context;
  }
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  context = new AudioCtor();
  master = context.createGain();
  master.gain.value = 0.16;
  master.connect(context.destination);
  return context;
}

/** Call from any click or key press so later effects are allowed to play. */
export function unlockAudio() {
  ensureContext();
}

function tone({ type = 'sine', from = 440, to = null, at = 0, length = 0.12, gain = 1 }) {
  const ctx = ensureContext();
  if (ctx === null) return;
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), start + length);
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.001, start + length);
  osc.connect(amp).connect(master);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

function noiseBurst({ at = 0, length = 0.25, gain = 0.5, frequency = 5200 }) {
  const ctx = ensureContext();
  if (ctx === null) return;
  const start = ctx.currentTime + at;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * length));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = frequency;
  const amp = ctx.createGain();
  amp.gain.value = gain;
  source.connect(filter).connect(amp).connect(master);
  source.start(start);
}

/** An ingredient lands on the plate. */
export function playPop() {
  tone({ type: 'triangle', from: 520, to: 760, length: 0.09, gain: 0.7 });
}

/** Raw food hits the grill or the fryer. */
export function playSizzle() {
  noiseBurst({ length: 0.35, gain: 0.4, frequency: 4200 });
}

/** A dish is served: till bell plus a coin arpeggio. */
export function playServe() {
  tone({ type: 'sine', from: 1318, length: 0.16, gain: 0.6 });
  tone({ type: 'sine', from: 1760, at: 0.07, length: 0.2, gain: 0.5 });
  tone({ type: 'triangle', from: 880, to: 1320, at: 0.02, length: 0.12, gain: 0.35 });
}

/** A new ticket pins up. */
export function playDing() {
  tone({ type: 'sine', from: 1568, length: 0.14, gain: 0.45 });
  tone({ type: 'sine', from: 2093, at: 0.05, length: 0.18, gain: 0.3 });
}

/** Something is wrong: wrong dish, full grill, burnt food. */
export function playBuzz() {
  tone({ type: 'sawtooth', from: 160, to: 110, length: 0.18, gain: 0.5 });
}

/** Cooked food reaches its perfect moment. */
export function playReady() {
  tone({ type: 'triangle', from: 980, to: 1470, length: 0.1, gain: 0.5 });
}
