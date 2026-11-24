"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Новогодняя фоновая музыка синтезируется прямо в браузере через Web Audio API:
 * мягкие колокольчики играют «Jingle Bells» с подложкой из аккордов.
 * Внешние аудиофайлы не нужны, поэтому музыка работает и без интернета.
 */

const NOTE_FREQ: Record<string, number> = {
  C3: 130.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
};

const MELODY: Array<[string | null, number]> = [
  ["E5", 1], ["E5", 1], ["E5", 2],
  ["E5", 1], ["E5", 1], ["E5", 2],
  ["E5", 1], ["G5", 1], ["C5", 1], ["D5", 1], ["E5", 4],
  ["F5", 1], ["F5", 1], ["F5", 1], ["F5", 1],
  ["F5", 1], ["E5", 1], ["E5", 1], ["E5", 1],
  ["E5", 1], ["D5", 1], ["D5", 1], ["E5", 1], ["D5", 2], [null, 2],
  ["E5", 1], ["E5", 1], ["E5", 2],
  ["E5", 1], ["E5", 1], ["E5", 2],
  ["E5", 1], ["G5", 1], ["C5", 1], ["D5", 1], ["E5", 4],
  ["F5", 1], ["F5", 1], ["F5", 1], ["F5", 1],
  ["F5", 1], ["E5", 1], ["E5", 1], ["E5", 1],
  ["G5", 1], ["G5", 1], ["F5", 1], ["D5", 1], ["C5", 4],
  [null, 4],
];

const PADS: string[][] = [
  ["C4", "E4", "G4"],
  ["F3", "A3", "C4"],
  ["G3", "B3", "D4"],
  ["C4", "E4", "G4"],
];

const BPM = 104;

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  timer: number | null;
  nextLoopStart: number;
  stopped: boolean;
};

let engine: Engine | null = null;

function playBell(ctx: AudioContext, dest: AudioNode, time: number, frequency: number, duration: number) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.24, time + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(0.45, duration * 1.6));
  gain.connect(dest);

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, time);
  osc.connect(gain);
  osc.start(time);
  osc.stop(time + Math.max(0.5, duration * 1.7));

  const sparkle = ctx.createGain();
  sparkle.gain.setValueAtTime(0.0001, time);
  sparkle.gain.exponentialRampToValueAtTime(0.06, time + 0.01);
  sparkle.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(0.3, duration));
  sparkle.connect(dest);

  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(frequency * 2, time);
  osc2.connect(sparkle);
  osc2.start(time);
  osc2.stop(time + Math.max(0.35, duration * 1.2));
}

function playPad(ctx: AudioContext, dest: AudioNode, time: number, notes: string[], duration: number) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.035, time + 0.8);
  gain.gain.linearRampToValueAtTime(0.0001, time + duration);
  gain.connect(dest);

  for (const note of notes) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(NOTE_FREQ[note] ?? 220, time);
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + duration + 0.1);
  }
}

function scheduleLoop(active: Engine, startAt: number): number {
  const beat = 60 / BPM;
  let cursor = startAt;

  for (const [note, beats] of MELODY) {
    if (note && NOTE_FREQ[note]) playBell(active.ctx, active.master, cursor, NOTE_FREQ[note], beats * beat);
    cursor += beats * beat;
  }

  const loopLength = cursor - startAt;
  const bar = beat * 8;
  const bars = Math.ceil(loopLength / bar);
  for (let index = 0; index < bars; index += 1) {
    playPad(active.ctx, active.master, startAt + index * bar, PADS[index % PADS.length], bar * 1.02);
  }

  return loopLength;
}

function scheduleNext() {
  if (!engine || engine.stopped) return;
  const loopLength = scheduleLoop(engine, engine.nextLoopStart);
  engine.nextLoopStart += loopLength;
  engine.timer = window.setTimeout(scheduleNext, Math.max(600, (loopLength - 0.6) * 1000));
}

async function startMusic(): Promise<boolean> {
  try {
  if (engine) {
    await engine.ctx.resume();
    engine.stopped = false;
    engine.master.gain.cancelScheduledValues(engine.ctx.currentTime);
    engine.master.gain.setValueAtTime(0.0001, engine.ctx.currentTime);
    engine.master.gain.linearRampToValueAtTime(0.5, engine.ctx.currentTime + 1.4);
    engine.nextLoopStart = engine.ctx.currentTime + 0.25;
    scheduleNext();
    return true;
  }

  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return false;

  const ctx = new AudioCtor();
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  engine = { ctx, master, timer: null, nextLoopStart: ctx.currentTime + 0.25, stopped: false };
  await ctx.resume();
  master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.4);
  scheduleNext();
  return true;
  } catch {
    engine = null;
    return false;
  }
}

function stopMusic(): void {
  if (!engine) return;
  engine.stopped = true;
  if (engine.timer !== null) {
    window.clearTimeout(engine.timer);
    engine.timer = null;
  }
  const now = engine.ctx.currentTime;
  engine.master.gain.cancelScheduledValues(now);
  engine.master.gain.setValueAtTime(Math.max(0.0001, engine.master.gain.value), now);
  engine.master.gain.linearRampToValueAtTime(0.0001, now + 0.5);
  // Если пользователь включит музыку раньше, startMusic сбросит флаг и suspend не произойдёт.
  window.setTimeout(() => {
    if (engine?.stopped) void engine.ctx.suspend();
  }, 620);
}

export function MusicToggle() {
  const [playing, setPlaying] = useState(false);
  const [hint, setHint] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (engine && engine.ctx.state === "running" && !engine.stopped) setPlaying(true);
    return () => {
      mounted.current = false;
    };
  }, []);

  async function toggle() {
    setHint(false);
    if (playing) {
      stopMusic();
      setPlaying(false);
      return;
    }
    const started = await startMusic();
    if (mounted.current) setPlaying(started);
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {hint ? (
        <div className="animate-rise max-w-[13rem] rounded-2xl border border-lime-400/30 bg-pine-900/95 px-3 py-2 text-[11px] leading-relaxed text-cream-100/75 shadow-lg backdrop-blur">
          <span className="text-lime-300">🎶 Новогоднее настроение</span> — включи фоновую музыку.
          <span className="mt-1 block text-cream-100/40">Звук синтезируется в браузере.</span>
        </div>
      ) : null}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Выключить новогоднюю музыку" : "Включить новогоднюю музыку"}
        title={playing ? "Выключить новогоднюю музыку" : "Включить новогоднюю музыку"}
        className={`group flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur transition ${
          playing
            ? "border-lime-400/60 bg-lime-400/20 text-lime-300"
            : "border-cream-100/25 bg-pine-900/90 text-cream-100/80 hover:border-lime-400/60 hover:text-lime-300"
        }`}
      >
        <span aria-hidden="true" className="text-base">
          {playing ? "🔔" : "🎵"}
        </span>
        <span className="hidden sm:inline">{playing ? "Музыка играет" : "Включить музыку"}</span>
        <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
          {[0, 1, 2].map((bar) => (
            <span
              key={bar}
              className={`w-0.5 rounded-full bg-current ${playing ? "music-bar" : "opacity-40"}`}
              style={{ height: `${6 + bar * 3}px`, animationDelay: `${bar * 0.18}s` }}
            />
          ))}
        </span>
      </button>
    </div>
  );
}
