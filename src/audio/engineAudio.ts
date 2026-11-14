// Web Audio 21-node procedural synthesis graph and autoplay/visibility/mobile lifecycle controller
// (Milestone 9; docs/specs/M9-engine-sound.md §§3.2, 4.0–4.6).

import type { CrankState } from '../core/interfaces';
import {
  computeAudioStatus,
  computeSoundParameters,
  createSoundParameters,
  fillNoise,
  firingWaveReal,
  loopSeamCrossfade,
  pulseWaveReal,
  validateLoadPoints,
  zeroSoundParameters,
  type EngineAudioContextState,
  type EngineAudioReason,
  type EngineAudioStats,
  type EngineAudioStatus,
  type EngineLoadPoint,
  type EnginePlaybackState,
  type EngineSoundParameters,
} from './engineSound';

export type {
  EngineAudioContextState,
  EngineAudioReason,
  EngineAudioStats,
  EngineAudioStatus,
  EngineLoadPoint,
  EnginePlaybackState,
  EngineSoundParameters,
};

export interface EngineAudioController {
  setEnabled(enabled: boolean): Promise<EngineAudioStatus>;
  setLoadPoints(points: readonly EngineLoadPoint[]): void;
  update(state: CrankState, playback: EnginePlaybackState): void;
  getStatus(): EngineAudioStatus;
  getParameters(): Readonly<EngineSoundParameters>;
  getStats(): EngineAudioStats;
  dispose(): void;
}

export interface EngineAudioEnvironment {
  readonly isSupported: () => boolean;
  readonly createContext: () => AudioContext;
  readonly isHidden: () => boolean;
  readonly onVisibilityChange: (listener: () => void) => () => void;
  readonly onPageHide: (listener: () => void) => () => void;
  readonly setAudioSessionType: (type: 'auto' | 'playback') => void;
  readonly onAudioSessionStateChange?: (listener: (state: string) => void) => () => void;
  readonly schedule: (callback: () => void, delayMs: number) => number;
  readonly cancel: (handle: number) => void;
}

const SMOOTH_TAU_SEC = 0.06;
const ON_RAMP_SEC = 0.25;
const OFF_RAMP_SEC = 0.12;
const SUSPEND_DELAY_MS = 180;
const BFCACHE_RETRY_MS = 1000;
const GRAPH_NODE_COUNT = 21;

interface CompiledGraph {
  readonly masterGain: AudioParam;
  readonly bytes: number;
  readonly apply: (time: number, p: Readonly<EngineSoundParameters>) => void;
}

type AudioSessionLike = EventTarget & { type?: string; state?: string };

function getAudioSession(): AudioSessionLike | undefined {
  return typeof navigator !== 'undefined' && 'audioSession' in navigator
    ? (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession
    : undefined;
}

function listen(target: EventTarget | undefined, event: string, fn: () => void): () => void {
  if (!target || typeof target.addEventListener !== 'function') return () => {};
  target.addEventListener(event, fn);
  return () => target.removeEventListener(event, fn);
}

function createDefaultEnvironment(): EngineAudioEnvironment {
  return {
    isSupported: () => typeof globalThis.AudioContext === 'function',
    createContext: () => new AudioContext({ latencyHint: 'interactive' }),
    isHidden: () =>
      typeof document !== 'undefined' &&
      (document.visibilityState === 'hidden' || document.hidden === true),
    onVisibilityChange: (fn) => listen(typeof document !== 'undefined' ? document : undefined, 'visibilitychange', fn),
    onPageHide: (fn) => listen(typeof window !== 'undefined' ? window : undefined, 'pagehide', fn),
    setAudioSessionType: (type) => {
      try {
        const s = getAudioSession();
        if (s) s.type = type;
      } catch {
        // Experimental API; ignore platform errors.
      }
    },
    onAudioSessionStateChange: (fn) => {
      try {
        const s = getAudioSession();
        return listen(s, 'statechange', () => {
          if (typeof s?.state === 'string') fn(s.state);
        });
      } catch {
        return () => {};
      }
    },
    schedule: (cb, ms) => setTimeout(cb, ms) as unknown as number,
    cancel: (id) => clearTimeout(id),
  };
}

function initParam(param: AudioParam, value: number, t: number): void {
  param.value = value;
  param.setValueAtTime?.(value, t);
}

function rampParam(param: AudioParam, target: number, t: number, durSec: number): void {
  param.cancelScheduledValues?.(t);
  if (typeof param.setValueAtTime === 'function' && typeof param.linearRampToValueAtTime === 'function') {
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(target, t + durSec);
  } else {
    param.setTargetAtTime(target, t, durSec / 3);
  }
}

function silenceParam(param: AudioParam, t: number): void {
  param.cancelScheduledValues?.(t);
  param.setValueAtTime?.(0, t);
  param.value = 0;
}

function chain(a: AudioNode, b: AudioNode, c?: AudioNode, d?: AudioNode): void {
  a.connect(b);
  if (c) b.connect(c);
  if (c && d) c.connect(d);
}

function buildAudioGraph(ctx: AudioContext): CompiledGraph {
  const t0 = ctx.currentTime;
  const makeGain = (): GainNode => {
    const g = ctx.createGain();
    initParam(g.gain, 0, t0);
    return g;
  };
  const makeFilter = (type: BiquadFilterType, q: number, freq?: number): BiquadFilterNode => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    initParam(f.Q, q, t0);
    if (freq !== undefined) initParam(f.frequency, freq, t0);
    return f;
  };
  const makeOsc = (real?: Float32Array<ArrayBuffer>, freq?: number): OscillatorNode => {
    const o = ctx.createOscillator();
    if (real) {
      o.setPeriodicWave(
        ctx.createPeriodicWave(real, new Float32Array(real.length), {
          disableNormalization: false,
        }),
      );
    } else {
      o.type = 'sine';
    }
    if (freq !== undefined) initParam(o.frequency, freq, t0);
    return o;
  };

  // 1–2. Master gain (starts at 0) and output limiter
  const master = makeGain();
  const limiter = ctx.createDynamicsCompressor();
  initParam(limiter.threshold, -10, t0);
  initParam(limiter.knee, 6, t0);
  initParam(limiter.ratio, 12, t0);
  initParam(limiter.attack, 0.003, t0);
  initParam(limiter.release, 0.2, t0);

  // 3–5. Firing pulse layer
  const firingOsc = makeOsc(firingWaveReal(64));
  const firingLpf = makeFilter('lowpass', 0.7);
  const firingGain = makeGain();

  // 6. Seeded 2.0 s white-noise loop with 20 ms seam crossfade
  const noiseRate = Math.min(ctx.sampleRate, 48_000);
  const seamSamples = Math.round((noiseRate * 20) / 1000);
  const loopedNoise = loopSeamCrossfade(
    fillNoise(Math.round(noiseRate * 2) + seamSamples, 0x9e3779b9),
    seamSamples,
  );
  const noiseBuf = ctx.createBuffer(1, loopedNoise.length, noiseRate);
  noiseBuf.getChannelData(0).set(loopedNoise);
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuf;
  noiseSrc.loop = true;

  // 7–10. Clatter band-pass and low rumble body
  const clatterBp = makeFilter('bandpass', 0.9);
  const clatterGain = makeGain();
  const bodyLpf = makeFilter('lowpass', 0.5);
  const bodyGain = makeGain();

  // 11–15. Primary 3rd-order whistle and 11-blade secondary BPF
  const whistleOsc = makeOsc();
  const whistleGain = makeGain();
  const bpfOsc = makeOsc();
  const bpfLpf = makeFilter('lowpass', 0.7, 10_000);
  const bpfGain = makeGain();

  // 16–21. Control-rate AM modulators (firing burst, half-order lope, 0.37 Hz drift)
  const pulseOsc = makeOsc(pulseWaveReal(16));
  const pulseDepth = makeGain();
  const lopeOsc = makeOsc();
  const lopeDepth = makeGain();
  const driftOsc = makeOsc(undefined, 0.37);
  const driftDepth = makeGain();

  chain(firingOsc, firingLpf, firingGain, master);
  chain(noiseSrc, clatterBp, clatterGain, master);
  chain(noiseSrc, bodyLpf, bodyGain, master);
  chain(whistleOsc, whistleGain, master);
  chain(bpfOsc, bpfLpf, bpfGain, master);
  chain(master, limiter, ctx.destination);

  pulseOsc.connect(pulseDepth);
  pulseDepth.connect(clatterGain.gain);
  lopeOsc.connect(lopeDepth);
  lopeDepth.connect(firingGain.gain);
  driftOsc.connect(driftDepth);
  driftDepth.connect(firingGain.gain);

  for (const src of [firingOsc, whistleOsc, bpfOsc, pulseOsc, lopeOsc, driftOsc, noiseSrc]) {
    src.start(t0);
  }

  return {
    masterGain: master.gain,
    bytes: loopedNoise.byteLength,
    apply: (t, p) => {
      const s = (param: AudioParam, val: number): void => {
        param.setTargetAtTime(val, t, SMOOTH_TAU_SEC);
      };
      s(firingOsc.frequency, p.firingHz);
      s(firingLpf.frequency, p.firingLpfHz);
      s(firingGain.gain, p.firingGain);
      s(clatterBp.frequency, p.clatterHz);
      s(clatterBp.Q, p.clatterQ);
      s(clatterGain.gain, p.clatterGain);
      s(bodyLpf.frequency, p.bodyLpfHz);
      s(bodyGain.gain, p.bodyGain);
      s(whistleOsc.frequency, p.whistleHz);
      s(whistleGain.gain, p.whistleGain);
      s(bpfOsc.frequency, p.bpfHz);
      s(bpfLpf.frequency, 10_000);
      s(bpfGain.gain, p.bpfGain);
      s(pulseOsc.frequency, p.firingHz);
      s(pulseDepth.gain, p.clatterAmDepth * p.clatterGain);
      s(lopeOsc.frequency, p.lopeHz);
      s(lopeDepth.gain, p.lopeDepth * p.firingGain);
      s(driftOsc.frequency, p.driftHz);
      s(driftDepth.gain, p.driftDepth * p.firingGain);
    },
  };
}

export function createEngineAudio(
  env: EngineAudioEnvironment = createDefaultEnvironment(),
): EngineAudioController {
  const supported = env.isSupported();
  let ctx: AudioContext | null = null;
  let graph: CompiledGraph | null = null;
  let listenersBound = false;
  const unsubs: Array<() => void> = [];

  let enabled = false;
  let disposed = false;
  let blocked = false;
  let interrupted = false;
  let starting = false;
  let rampedUp = false;
  let gracefulSilence = false;

  let gen = 0;
  let startGen = 0;
  let startPromise: Promise<EngineAudioStatus> | null = null;
  let resuming = false;
  let suspendTimer: number | null = null;
  let lastBfcacheMs = -Infinity;

  let lastRpm = 900;
  let playing = true;
  let speedMultiplier = 1;
  let loadPoints: readonly EngineLoadPoint[] = [];
  const params = createSoundParameters();

  const setSession = (type: 'auto' | 'playback'): void => {
    try {
      env.setAudioSessionType(type);
    } catch {
      // Ignore platform errors.
    }
  };

  const safeSuspend = (c: AudioContext): void => {
    try {
      void c.suspend()?.catch?.(() => {});
    } catch {
      // Ignore suspend errors.
    }
  };

  const getContextState = (): EngineAudioContextState => {
    if (!supported) return 'unsupported';
    if (disposed) return 'closed';
    if (!ctx) return starting ? 'starting' : 'uninitialized';
    const s = ctx.state as string;
    if (starting && s !== 'running') return 'starting';
    return s === 'running' ? 'running' : s === 'closed' ? 'closed' : 'suspended';
  };

  const getStatus = (): EngineAudioStatus =>
    computeAudioStatus({
      supported,
      disposed,
      blocked,
      enabled,
      contextState: getContextState(),
      hidden: supported && listenersBound ? env.isHidden() : false,
      playing,
      speedMultiplier,
    });

  const wantsAudible = (): boolean =>
    supported &&
    !disposed &&
    !blocked &&
    !interrupted &&
    enabled &&
    !env.isHidden() &&
    playing &&
    speedMultiplier === 1;

  const cancelSuspend = (): void => {
    if (suspendTimer !== null) {
      env.cancel(suspendTimer);
      suspendTimer = null;
    }
  };

  const scheduleSuspend = (): void => {
    cancelSuspend();
    suspendTimer = env.schedule(() => {
      suspendTimer = null;
      if (!disposed && ctx && !wantsAudible() && (ctx.state as string) === 'running') {
        safeSuspend(ctx);
      }
    }, SUSPEND_DELAY_MS);
  };

  const enterAudible = (): void => {
    if (!ctx || !graph) return;
    cancelSuspend();
    gracefulSilence = false;
    computeSoundParameters(loadPoints, lastRpm, params);
    params.masterGain = 0.42;
    graph.apply(ctx.currentTime, params);
    if (!rampedUp) {
      rampedUp = true;
      rampParam(graph.masterGain, 0.42, ctx.currentTime, ON_RAMP_SEC);
    }
  };

  const enterGracefulSilence = (): void => {
    params.masterGain = 0;
    gracefulSilence = true;
    if (ctx && graph) {
      if (rampedUp) {
        rampedUp = false;
        rampParam(graph.masterGain, 0, ctx.currentTime, OFF_RAMP_SEC);
      }
      if ((ctx.state as string) === 'running') {
        scheduleSuspend();
      }
    }
  };

  const immediateSilenceAndSuspend = (): void => {
    cancelSuspend();
    params.masterGain = 0;
    rampedUp = false;
    gracefulSilence = false;
    if (ctx && graph) {
      silenceParam(graph.masterGain, ctx.currentTime);
      if ((ctx.state as string) === 'running') safeSuspend(ctx);
    }
  };

  const markBlocked = (): EngineAudioStatus => {
    enabled = false;
    blocked = true;
    immediateSilenceAndSuspend();
    setSession('auto');
    return getStatus();
  };

  const runResume = (explicitStart: boolean): Promise<EngineAudioStatus> => {
    if (!ctx || !graph) return Promise.resolve(getStatus());
    const myGen = explicitStart ? ++gen : gen;
    if (explicitStart) {
      startGen = myGen;
      starting = true;
    } else {
      resuming = true;
    }

    let raw: Promise<void>;
    try {
      raw = ctx.resume();
    } catch {
      if (explicitStart) starting = false;
      else resuming = false;
      return Promise.resolve(markBlocked());
    }

    const settle = (ok: boolean): EngineAudioStatus => {
      if (explicitStart && startGen === myGen) {
        startPromise = null;
        starting = false;
      } else if (!explicitStart) {
        resuming = false;
      }
      if (disposed) return getStatus();
      if (myGen !== gen || !enabled) {
        immediateSilenceAndSuspend();
        if (explicitStart) setSession('auto');
        return getStatus();
      }
      if (!ok) return markBlocked();
      if (env.isHidden()) {
        immediateSilenceAndSuspend();
        return getStatus();
      }
      if (!ctx || (ctx.state as string) !== 'running') {
        return markBlocked();
      }
      if (wantsAudible()) {
        enterAudible();
      } else if (explicitStart) {
        params.masterGain = 0;
        gracefulSilence = true;
        scheduleSuspend();
      } else {
        enterGracefulSilence();
      }
      return getStatus();
    };

    const settled = raw.then(
      () => settle(true),
      () => settle(false),
    );

    if (explicitStart) startPromise = settled;
    return settled;
  };

  const resumeIfEligible = (): void => {
    if (!wantsAudible() || !ctx) return;
    cancelSuspend();
    const s = ctx.state as string;
    if (s === 'running') enterAudible();
    else if (s === 'suspended' && !resuming && startPromise === null) void runResume(false);
  };

  const bindListeners = (): void => {
    if (listenersBound || disposed) return;
    listenersBound = true;
    unsubs.push(
      env.onVisibilityChange(() => {
        if (disposed) return;
        if (env.isHidden()) immediateSilenceAndSuspend();
        else resumeIfEligible();
      }),
      env.onPageHide(() => {
        if (!disposed) immediateSilenceAndSuspend();
      }),
    );
    if (env.onAudioSessionStateChange) {
      unsubs.push(
        env.onAudioSessionStateChange((st) => {
          if (disposed) return;
          if (st === 'interrupted') {
            interrupted = true;
            enterGracefulSilence();
          } else if (st === 'active') {
            interrupted = false;
            resumeIfEligible();
          }
        }),
      );
    }
  };

  const setEnabled = (nextEnabled: boolean): Promise<EngineAudioStatus> => {
    if (!supported || disposed) return Promise.resolve(getStatus());

    if (!nextEnabled) {
      gen += 1;
      enabled = false;
      blocked = false;
      setSession('auto');
      if (startPromise !== null) {
        params.masterGain = 0;
        rampedUp = false;
        if (ctx && graph) silenceParam(graph.masterGain, ctx.currentTime);
      } else {
        enterGracefulSilence();
      }
      return Promise.resolve(getStatus());
    }

    cancelSuspend();
    blocked = false;
    enabled = true;
    bindListeners();
    setSession('playback');

    if (startPromise !== null && startGen === gen) return startPromise;

    if (ctx && graph && (ctx.state as string) === 'running' && !starting) {
      if (env.isHidden()) immediateSilenceAndSuspend();
      else if (wantsAudible()) enterAudible();
      else enterGracefulSilence();
      return Promise.resolve(getStatus());
    }

    if (!ctx || !graph) {
      try {
        ctx = env.createContext();
        graph = buildAudioGraph(ctx);
      } catch {
        return Promise.resolve(markBlocked());
      }
    }

    return runResume(true);
  };

  const setLoadPoints = (points: readonly EngineLoadPoint[]): void => {
    validateLoadPoints(points);
    loadPoints = points.map((pt) => ({
      rpm: pt.rpm,
      boostPsiGauge: pt.boostPsiGauge,
      fuelMm3: pt.fuelMm3,
    }));
    if (ctx && graph) {
      computeSoundParameters(loadPoints, lastRpm, params);
      const aud = getStatus().audible;
      params.masterGain = aud ? 0.42 : 0;
      if ((ctx.state as string) === 'running' && aud) {
        graph.apply(ctx.currentTime, params);
      }
    }
  };

  const update = (state: CrankState, playback: EnginePlaybackState): void => {
    lastRpm = state.rpm;
    playing = playback.playing;
    speedMultiplier = playback.speedMultiplier;

    if (!supported || disposed || !ctx || !graph) return;

    if (!wantsAudible()) {
      params.masterGain = 0;
      if (env.isHidden()) {
        if (rampedUp || (ctx.state as string) === 'running') immediateSilenceAndSuspend();
      } else if (rampedUp || (suspendTimer === null && (ctx.state as string) === 'running' && !starting)) {
        enterGracefulSilence();
      }
      return;
    }

    cancelSuspend();
    const s = ctx.state as string;
    if (s === 'running') {
      enterAudible();
    } else if (s === 'suspended' && !starting && !resuming && startPromise === null) {
      if (gracefulSilence) {
        gracefulSilence = false;
        void runResume(false);
      } else {
        const now = Date.now();
        if (now - lastBfcacheMs >= BFCACHE_RETRY_MS) {
          lastBfcacheMs = now;
          rampedUp = false;
          silenceParam(graph.masterGain, ctx.currentTime);
          void runResume(false);
        }
      }
    }
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    gen += 1;
    enabled = false;
    blocked = false;
    starting = false;
    startPromise = null;
    rampedUp = false;

    cancelSuspend();
    setSession('auto');
    for (const u of unsubs) {
      try {
        u();
      } catch {
        // Ignore cleanup errors.
      }
    }
    unsubs.length = 0;
    zeroSoundParameters(params);

    const closing = ctx;
    if (closing && graph) {
      try {
        silenceParam(graph.masterGain, closing.currentTime);
      } catch {
        // Ignore parameter cleanup errors.
      }
    }
    graph = null;
    ctx = null;
    try {
      void closing?.close?.()?.catch?.(() => {});
    } catch {
      // Ignore close errors.
    }
  };

  return {
    setEnabled,
    setLoadPoints,
    update,
    getStatus,
    getParameters: () => params,
    getStats: () =>
      !ctx || !graph || disposed
        ? { nodeCount: 0, noiseBufferBytes: 0 }
        : { nodeCount: GRAPH_NODE_COUNT, noiseBufferBytes: graph.bytes },
    dispose,
  };
}
