/* Tiny synthesised UI sounds for the delete button.
 *
 * Everything is generated with the Web Audio API — no audio files to ship, no
 * licensing to worry about, and nothing loads until the first click (which is
 * also the gesture browsers require before audio may start).
 *
 * Admins who prefer a quiet interface can turn the whole thing off; the choice
 * is remembered per browser. Reduced-motion is treated as "quiet" too, since
 * someone asking for less movement rarely wants more noise.
 */

const MUTE_KEY = "nursery-admin-sfx-muted";

let ctx: AudioContext | null = null;

function muted(): boolean {
  try {
    if (window.localStorage.getItem(MUTE_KEY) === "1") return true;
  } catch {
    /* private mode — fall through to the motion preference */
  }
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function isMuted(): boolean {
  return muted();
}

export function setMuted(value: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* nothing to persist to; the setting just won't survive a reload */
  }
}

function audio(): AudioContext | null {
  if (muted()) return null;
  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  // Safari and Chrome park the context until a gesture resumes it.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** One shaped blip. `curve` is the pitch glide over the note's life. */
function tone(
  opts: { type: OscillatorType; from: number; to: number; gain: number; attack: number; length: number; delay?: number },
): void {
  const context = audio();
  if (!context) return;

  const start = context.currentTime + (opts.delay ?? 0);
  const osc = context.createOscillator();
  const amp = context.createGain();

  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.from, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), start + opts.length);

  // A fast attack and an exponential tail keeps it a "tick", never a beep.
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(opts.gain, start + opts.attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + opts.length);

  osc.connect(amp).connect(context.destination);
  osc.start(start);
  osc.stop(start + opts.length + 0.02);
}

/** A letter dropping into the bin — pitch climbs as the bin fills up. */
export function playGulp(index: number, total: number): void {
  const step = total > 1 ? index / (total - 1) : 0;
  const base = 420 + step * 260;
  tone({ type: "sine", from: base, to: base * 0.55, gain: 0.07, attack: 0.006, length: 0.12 });
}

/** The lid dropping shut — a short, dull knock. */
export function playThunk(): void {
  tone({ type: "triangle", from: 190, to: 70, gain: 0.12, attack: 0.004, length: 0.19 });
  tone({ type: "sine", from: 95, to: 48, gain: 0.09, attack: 0.006, length: 0.26 });
}

/** Two rising notes when the delete actually lands. */
export function playDing(): void {
  tone({ type: "sine", from: 880, to: 880, gain: 0.06, attack: 0.008, length: 0.13 });
  tone({ type: "sine", from: 1318, to: 1318, gain: 0.05, attack: 0.008, length: 0.2, delay: 0.1 });
}

/** A flat buzz when the request comes back with an error. */
export function playBonk(): void {
  tone({ type: "sawtooth", from: 200, to: 120, gain: 0.07, attack: 0.005, length: 0.16 });
  tone({ type: "sawtooth", from: 150, to: 90, gain: 0.06, attack: 0.005, length: 0.22, delay: 0.1 });
}
