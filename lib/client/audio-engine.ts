/**
 * All sound for the games runs through the Web Audio API in the browser:
 * - the sender's voice clips with live effects (normal → creepy → normal)
 * - synthesized sound effects (no audio files needed)
 * - the "Happy Birthday" melody (public domain), synthesized
 */

export type ClipName = "main" | "creepy";

export type VoiceEffect =
  | "normal"
  | "warm"
  | "deep"
  | "demon"
  | "reverse"
  | "stutter"
  | "whisper"
  | "radio"
  | "disguise";

export type SfxName =
  | "ding"
  | "pop"
  | "click"
  | "error"
  | "glitch"
  | "heartbeat"
  | "whoosh"
  | "sparkle"
  | "static";

type AC = typeof AudioContext;

function getAudioContextClass(): AC | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AC }).webkitAudioContext ||
    null
  );
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private raw = new Map<ClipName, Promise<ArrayBuffer | null>>();
  private buffers = new Map<ClipName, AudioBuffer>();
  private reversed = new Map<ClipName, AudioBuffer>();
  private active = new Set<AudioScheduledSourceNode>();
  private impulse: AudioBuffer | null = null;
  private noise: AudioBuffer | null = null;
  private droneStop: (() => void) | null = null;
  private muted = false;

  /** Start downloading clips early so they're ready when needed. */
  preload(urls: Partial<Record<ClipName, string>>) {
    for (const [name, url] of Object.entries(urls) as [ClipName, string | undefined][]) {
      if (!url || this.raw.has(name)) continue;
      this.raw.set(
        name,
        fetch(url)
          .then((r) => (r.ok ? r.arrayBuffer() : null))
          .catch(() => null),
      );
    }
  }

  /** Provide a clip directly (used by the create page to preview effects). */
  setClip(name: ClipName, data: ArrayBuffer | null) {
    this.buffers.delete(name);
    this.reversed.delete(name);
    if (data) this.raw.set(name, Promise.resolve(data));
    else this.raw.delete(name);
  }

  hasClip(name: ClipName): boolean {
    return this.raw.has(name) || this.buffers.has(name);
  }

  /** Must be called directly from a tap/click: phones block sound until then. */
  unlock() {
    if (!this.ctx) {
      const Ctor = getAudioContextClass();
      if (!Ctor) return;
      try {
        // Lets iPhones play sound even when the silent switch is on (Safari 16.4+).
        const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
        if (session) session.type = "playback";
      } catch {
        /* not supported */
      }
      const ctx = new Ctor();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 6;
      const out = ctx.createGain();
      out.gain.value = 0.85; // volume cap: creepy, not ear-blasting
      out.connect(comp);
      comp.connect(ctx.destination);
      // A silent blip fully unlocks audio on iOS.
      const blip = ctx.createBufferSource();
      blip.buffer = ctx.createBuffer(1, 1, 22050);
      blip.connect(ctx.destination);
      blip.start();
      this.ctx = ctx;
      this.out = out;
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.out && this.ctx) this.out.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.05);
  }

  isMuted() {
    return this.muted;
  }

  stopAll() {
    for (const s of this.active) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.active.clear();
    this.stopDrone();
  }

  // ---------------------------------------------------------------- voice

  private async getBuffer(name: ClipName): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    const cached = this.buffers.get(name);
    if (cached) return cached;
    const pending = this.raw.get(name);
    if (!pending) return null;
    const data = await pending;
    if (!data) return null;
    try {
      const buf = await this.ctx.decodeAudioData(data.slice(0));
      this.buffers.set(name, buf);
      return buf;
    } catch {
      return null;
    }
  }

  private getReversed(name: ClipName, buf: AudioBuffer): AudioBuffer {
    const cached = this.reversed.get(name);
    if (cached) return cached;
    const ctx = this.ctx!;
    const rev = ctx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const src = buf.getChannelData(c);
      const dst = rev.getChannelData(c);
      for (let i = 0, j = src.length - 1; i < src.length; i++, j--) dst[i] = src[j];
    }
    this.reversed.set(name, rev);
    return rev;
  }

  /**
   * Play a voice clip with an effect. Resolves when it finishes.
   * "creepy" falls back to "main" when the sender only recorded one clip.
   */
  async play(name: ClipName, effect: VoiceEffect, opts: { maxDuration?: number } = {}): Promise<void> {
    let clip: ClipName = name;
    let buf = await this.getBuffer(name);
    if (!buf && name === "creepy") {
      clip = "main";
      buf = await this.getBuffer("main");
    }
    const ctx = this.ctx;
    if (!buf || !ctx || !this.out) return;
    const t = ctx.currentTime + 0.03;

    const source = (b: AudioBuffer, rate = 1) => {
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.playbackRate.value = rate;
      this.track(s);
      return s;
    };
    const limit = (natural: number) => Math.min(natural, opts.maxDuration ?? Infinity);

    switch (effect) {
      case "normal":
      case "warm": {
        const s = source(buf);
        s.connect(effect === "warm" ? this.reverbMix(0.22) : this.out);
        const d = limit(buf.duration);
        s.start(t);
        s.stop(t + d);
        return sleep(d * 1000 + 80);
      }
      case "deep": {
        const rate = 0.72;
        const s = source(buf, rate);
        s.connect(this.filter("lowpass", 2600)).connect(this.reverbMix(0.5));
        const d = limit(buf.duration / rate);
        s.start(t);
        s.stop(t + d);
        return sleep(d * 1000 + 300);
      }
      case "demon": {
        const shaper = this.shaper(45);
        const lp = this.filter("lowpass", 2200);
        shaper.connect(lp).connect(this.reverbMix(0.6));
        const a = source(buf, 0.56);
        const b = source(buf, 0.5);
        const gb = ctx.createGain();
        gb.gain.value = 0.6;
        a.connect(shaper);
        b.connect(gb).connect(shaper);
        const d = limit(buf.duration / 0.5);
        a.start(t);
        b.start(t + 0.02);
        a.stop(t + d);
        b.stop(t + d);
        return sleep(d * 1000 + 500);
      }
      case "reverse": {
        const rate = 0.82;
        const s = source(this.getReversed(clip, buf), rate);
        s.connect(this.reverbMix(0.7));
        const d = limit(buf.duration / rate);
        s.start(t);
        s.stop(t + d);
        return sleep(d * 1000 + 600);
      }
      case "stutter": {
        const total = limit(3.6);
        const shaper = this.shaper(18);
        shaper.connect(this.out);
        let at = 0;
        while (at < total) {
          const len = 0.06 + Math.random() * 0.2;
          const offset = Math.random() * Math.max(0.01, buf.duration - len);
          const repeats = Math.random() < 0.35 ? 3 : 1;
          const rate = 0.55 + Math.random() * 0.8;
          for (let r = 0; r < repeats && at < total; r++) {
            const s = source(buf, rate);
            s.connect(shaper);
            s.start(t + at, offset, len);
            at += len / rate + (Math.random() < 0.2 ? 0.08 : 0.01);
          }
          if (Math.random() < 0.25) {
            this.noiseBurst(t + at, 0.05 + Math.random() * 0.1, 0.25);
            at += 0.08;
          }
        }
        return sleep(total * 1000 + 150);
      }
      case "whisper": {
        const len = Math.min(1.6, buf.duration);
        const offset = Math.max(0, Math.min(buf.duration - len, buf.duration * 0.3));
        const rate = 0.9;
        const s = source(buf, rate);
        const hp = this.filter("highpass", 1300);
        const g = ctx.createGain();
        g.gain.value = 0.75;
        const pan = ctx.createStereoPanner();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.7;
        lfoGain.gain.value = 0.9;
        lfo.connect(lfoGain).connect(pan.pan);
        this.track(lfo);
        s.connect(hp).connect(g).connect(pan).connect(this.reverbMix(0.85));
        const d = limit(len / rate);
        s.start(t, offset, len);
        lfo.start(t);
        lfo.stop(t + d + 2);
        return sleep(d * 1000 + 900);
      }
      case "radio": {
        const s = source(buf);
        s.connect(this.filter("bandpass", 1500, 1.3)).connect(this.shaper(14)).connect(this.out);
        const d = limit(buf.duration);
        s.start(t);
        s.stop(t + d);
        this.noiseBurst(t, d, 0.05, 900);
        return sleep(d * 1000 + 100);
      }
      case "disguise": {
        const rate = 1.35;
        const s = source(buf, rate);
        s.connect(this.filter("bandpass", 1900, 0.6)).connect(this.shaper(6)).connect(this.out);
        const d = limit(buf.duration / rate);
        s.start(t);
        s.stop(t + d);
        return sleep(d * 1000 + 100);
      }
    }
  }

  // ---------------------------------------------------------------- building blocks

  private track(node: AudioScheduledSourceNode) {
    this.active.add(node);
    node.addEventListener("ended", () => this.active.delete(node));
  }

  private filter(type: BiquadFilterType, freq: number, q = 0.7): BiquadFilterNode {
    const f = this.ctx!.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  private shaper(amount: number): WaveShaperNode {
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    const s = this.ctx!.createWaveShaper();
    s.curve = curve;
    s.oversample = "2x";
    return s;
  }

  /** Returns an input node mixing dry signal + reverb into the output. */
  private reverbMix(wet: number): AudioNode {
    const ctx = this.ctx!;
    if (!this.impulse) {
      const len = Math.floor(ctx.sampleRate * 2.8);
      const imp = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = imp.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      this.impulse = imp;
    }
    const input = ctx.createGain();
    const dry = ctx.createGain();
    const wetGain = ctx.createGain();
    const conv = ctx.createConvolver();
    conv.buffer = this.impulse;
    dry.gain.value = 1 - wet * 0.6;
    wetGain.gain.value = wet;
    input.connect(dry).connect(this.out!);
    input.connect(conv).connect(wetGain).connect(this.out!);
    return input;
  }

  private getNoise(): AudioBuffer {
    const ctx = this.ctx!;
    if (!this.noise) {
      const len = ctx.sampleRate * 2;
      const b = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
    }
    return this.noise;
  }

  private noiseBurst(at: number, dur: number, gain: number, freq = 2000 + Math.random() * 4000) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.getNoise();
    s.loop = true;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.setValueAtTime(gain, at + dur * 0.9);
    g.gain.linearRampToValueAtTime(0, at + dur);
    s.connect(this.filter("bandpass", freq, 0.8)).connect(g).connect(this.out!);
    this.track(s);
    s.start(at);
    s.stop(at + dur + 0.02);
  }

  private tone(
    freq: number,
    at: number,
    dur: number,
    type: OscillatorType = "sine",
    gain = 0.2,
    endFreq?: number,
  ) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.out!);
    this.track(o);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  // ---------------------------------------------------------------- sound effects

  sfx(name: SfxName, duration = 1) {
    const ctx = this.ctx;
    if (!ctx || !this.out) return;
    const t = ctx.currentTime + 0.01;
    switch (name) {
      case "ding":
        this.tone(880, t, 0.35, "sine", 0.25);
        this.tone(1320, t + 0.08, 0.3, "sine", 0.12);
        break;
      case "pop":
        this.tone(500, t, 0.09, "sine", 0.18, 1100);
        break;
      case "click":
        this.noiseBurst(t, 0.02, 0.15, 5000);
        break;
      case "error":
        this.tone(320, t, 0.13, "square", 0.08);
        this.tone(210, t + 0.16, 0.22, "square", 0.08);
        break;
      case "glitch":
        for (let i = 0; i < 7; i++) {
          const at = t + Math.random() * 0.6;
          this.noiseBurst(at, 0.03 + Math.random() * 0.08, 0.3);
          if (Math.random() < 0.5) this.tone(80 + Math.random() * 900, at, 0.06, "square", 0.06);
        }
        break;
      case "heartbeat":
        for (const off of [0, 0.26]) this.tone(70, t + off, 0.2, "sine", 0.9, 40);
        break;
      case "whoosh": {
        const s = ctx.createBufferSource();
        s.buffer = this.getNoise();
        const f = this.filter("bandpass", 300, 1.5);
        f.frequency.exponentialRampToValueAtTime(3500, t + 0.6);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.3, t + 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        s.connect(f).connect(g).connect(this.out);
        this.track(s);
        s.start(t);
        s.stop(t + 0.75);
        break;
      }
      case "sparkle": {
        const notes = [1047, 1175, 1319, 1568, 1760, 2093];
        for (let i = 0; i < 8; i++) {
          this.tone(notes[Math.floor(Math.random() * notes.length)], t + i * 0.07, 0.3, "sine", 0.07);
        }
        break;
      }
      case "static":
        this.noiseBurst(t, duration, 0.12, 1200);
        break;
    }
  }

  /** Low, unsettling rumble. Call stopDrone() to fade it out. */
  startDrone() {
    const ctx = this.ctx;
    if (!ctx || !this.out || this.droneStop) return;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 2.5);
    const lp = this.filter("lowpass", 240, 4);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain).connect(lp.frequency);
    const oscs = [55, 55.6, 82.4].map((f) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.connect(lp);
      o.start(t);
      this.track(o);
      return o;
    });
    lp.connect(g).connect(this.out);
    lfo.start(t);
    this.track(lfo);
    this.droneStop = () => {
      const now = ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      for (const o of [...oscs, lfo]) {
        try {
          o.stop(now + 1.3);
        } catch {
          /* ignore */
        }
      }
    };
  }

  stopDrone() {
    this.droneStop?.();
    this.droneStop = null;
  }

  // ---------------------------------------------------------------- birthday song

  /** "Happy Birthday to You" (public domain), synthesized. Resolves when finished. */
  async birthdaySong(): Promise<void> {
    const ctx = this.ctx;
    if (!ctx || !this.out) return;
    const beat = 0.46;
    const t0 = ctx.currentTime + 0.1;
    const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
    // [midi note, start beat, length in beats]
    const melody: [number, number, number][] = [
      [67, 0, 0.75], [67, 0.75, 0.25], [69, 1, 1], [67, 2, 1], [72, 3, 1], [71, 4, 2],
      [67, 6, 0.75], [67, 6.75, 0.25], [69, 7, 1], [67, 8, 1], [74, 9, 1], [72, 10, 2],
      [67, 12, 0.75], [67, 12.75, 0.25], [79, 13, 1], [76, 14, 1], [72, 15, 1], [71, 16, 1], [69, 17, 1],
      [77, 18, 0.75], [77, 18.75, 0.25], [76, 19, 1], [72, 20, 1], [74, 21, 1], [72, 22, 3],
    ];
    const bass: [number, number, number][] = [
      [48, 1, 3], [43, 4, 3], [43, 7, 3], [48, 10, 3], [48, 13, 3], [41, 16, 3], [48, 19, 2], [43, 21, 1], [48, 22, 3],
    ];
    const pluck = (freq: number, at: number, dur: number, vol: number, harmonics: boolean) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.015);
      g.gain.exponentialRampToValueAtTime(vol * 0.5, at + 0.25);
      g.gain.setValueAtTime(vol * 0.5, at + Math.max(0.26, dur - 0.05));
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.35);
      g.connect(this.out!);
      const types: [OscillatorType, number, number][] = harmonics
        ? [["triangle", 1, 1], ["sine", 2, 0.25], ["sine", 3, 0.08]]
        : [["sine", 1, 1]];
      for (const [type, mult, level] of types) {
        const o = ctx.createOscillator();
        const lg = ctx.createGain();
        o.type = type;
        o.frequency.value = freq * mult;
        lg.gain.value = level;
        o.connect(lg).connect(g);
        this.track(o);
        o.start(at);
        o.stop(at + dur + 0.4);
      }
    };
    for (const [m, start, len] of melody) pluck(midi(m), t0 + start * beat, len * beat, 0.22, true);
    for (const [m, start, len] of bass) pluck(midi(m), t0 + start * beat, len * beat, 0.13, false);
    await sleep((25 * beat + 0.6) * 1000);
  }
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported */
  }
}
