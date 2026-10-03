"use client";
// Lightweight Web Audio helper. No external audio assets. Sound only starts
// after a user gesture (browsers block autoplay anyway) and every simulation
// exposes a mute toggle that this helper respects.
let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedContext) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    sharedContext = new Ctor();
  }
  if (sharedContext.state === "suspended")
    sharedContext.resume().catch(() => {});
  return sharedContext;
}

export type SoundOptions = {
  frequency?: number;
  duration?: number;
  type?: OscillatorType;
  volume?: number;
};

export function playTone(muted: boolean, options: SoundOptions = {}) {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  const {
    frequency = 440,
    duration = 0.15,
    type = "sine",
    volume = 0.2,
  } = options;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playNoiseBurst(muted: boolean, duration = 0.3, volume = 0.25) {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  const sampleCount = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++)
    data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}
