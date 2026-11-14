// Pure procedural diesel engine synthesis model, waveforms, deterministic noise,
// and audible-state truth table (Milestone 9; docs/specs/M9-engine-sound.md §§2–4, §6).
// Runs headless with zero DOM, browser, or performance-model runtime imports.

export interface EngineLoadPoint {
  readonly rpm: number;
  readonly boostPsiGauge: number;
  readonly fuelMm3: number;
}

export interface EnginePlaybackState {
  readonly playing: boolean;
  readonly speedMultiplier: number;
}

export type EngineAudioReason =
  | 'off'
  | 'running'
  | 'hidden'
  | 'paused'
  | 'slow-motion'
  | 'blocked'
  | 'unsupported'
  | 'disposed';

export type EngineAudioContextState =
  | 'uninitialized'
  | 'starting'
  | 'running'
  | 'suspended'
  | 'closed'
  | 'unsupported';

export interface EngineAudioStatus {
  readonly supported: boolean;
  readonly enabled: boolean;
  readonly audible: boolean;
  readonly contextState: EngineAudioContextState;
  readonly reason: EngineAudioReason;
}

export interface EngineAudioStats {
  readonly nodeCount: number;
  readonly noiseBufferBytes: number;
}

export interface EngineSoundParameters {
  firingHz: number;
  firingGain: number;
  firingLpfHz: number;
  clatterGain: number;
  clatterHz: number;
  clatterQ: number;
  clatterAmDepth: number;
  bodyGain: number;
  bodyLpfHz: number;
  whistleHz: number;
  whistleGain: number;
  bpfHz: number;
  bpfGain: number;
  lopeHz: number;
  lopeDepth: number;
  driftHz: number;
  driftDepth: number;
  masterGain: number;
  boost01: number;
  load01: number;
  throttle01: number;
  idle01: number;
}

export interface AudibleStateInput {
  readonly supported: boolean;
  readonly disposed?: boolean;
  readonly blocked?: boolean;
  readonly enabled: boolean;
  readonly contextState: EngineAudioContextState;
  readonly hidden: boolean;
  readonly playing: boolean;
  readonly speedMultiplier: number;
}

// Principal synthesis constants (Spec §3.8).
export const ENGINE_SOUND_CONSTANTS = /* @__PURE__ */ Object.freeze({
  uiMinRpm: 650,
  uiMaxRpm: 3200,
  powerStrokesPerRev: 4,
  boostReferencePsi: 20.874,
  idleFuelFloorMm3: 8,
  loadDivisorMm3: 100,
  shaftBaseRpm: 20_000,
  shaftSpanRpm: 95_000,
  whistleOrder: 3,
  compressorBlades: 11,
  firingHarmonics: 64,
  pulseHarmonics: 16,
  noiseSeconds: 2.0,
  noiseSeed: 0x9e3779b9,
  noiseSeamMs: 20,
  noiseMaxSampleRate: 48_000,
  firingDuty: 0.18,
  firingDecay: 14,
  pulseDuty: 0.06,
  pulseDecay: 10,
  lopeDivisor: 8,
  lopeDepth: 0.22,
  driftHz: 0.37,
  driftDepth: 0.1,
  clatterAmDepth: 0.6,
  idleClatterTerm: 0.08,
  masterGain: 0.42,
  bpfLowpassHz: 10_000,
} as const);

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function firingFrequencyHz(rpm: number): number {
  return (rpm * 4) / 60;
}

export function throttle01(rpm: number): number {
  return clamp((rpm - 650) / 2550, 0, 1);
}

export function idle01(rpm: number): number {
  return 1 - smoothstep(750, 1400, rpm);
}

export function validateLoadPoints(points: readonly EngineLoadPoint[]): void {
  if (points.length === 0) {
    throw new Error('Load points must be non-empty.');
  }
  for (let i = 0; i < points.length; i += 1) {
    const pt = points[i]!;
    if (
      !Number.isFinite(pt.rpm) ||
      !Number.isFinite(pt.boostPsiGauge) ||
      !Number.isFinite(pt.fuelMm3) ||
      (i > 0 && pt.rpm <= points[i - 1]!.rpm)
    ) {
      throw new Error(`Invalid or unsorted load point at index ${i}.`);
    }
  }
}

export function zeroSoundParameters(target: EngineSoundParameters): EngineSoundParameters {
  for (const key of Object.keys(target) as Array<keyof EngineSoundParameters>) {
    target[key] = 0;
  }
  return target;
}

export function createSoundParameters(): EngineSoundParameters {
  return zeroSoundParameters(computeSoundParameters([], 650, {} as EngineSoundParameters));
}

export function computeSoundParameters(
  points: readonly EngineLoadPoint[],
  rpm: number,
  target: EngineSoundParameters = createSoundParameters(),
): EngineSoundParameters {
  const safeRpm = Number.isFinite(rpm) ? rpm : 650;
  const fHz = firingFrequencyHz(safeRpm);
  const thr = throttle01(safeRpm);
  const idl = idle01(safeRpm);

  let detailBoostPsi = 0;
  let detailFuelMm3 = 0;
  const len = points.length;
  if (len > 0) {
    const queryRpm = clamp(safeRpm, 1000, 3400);
    const first = points[0]!;
    const last = points[len - 1]!;
    if (queryRpm <= first.rpm || len === 1) {
      detailBoostPsi = first.boostPsiGauge;
      detailFuelMm3 = first.fuelMm3;
    } else if (queryRpm >= last.rpm) {
      detailBoostPsi = last.boostPsiGauge;
      detailFuelMm3 = last.fuelMm3;
    } else {
      for (let i = 0; i < len - 1; i += 1) {
        const p0 = points[i]!;
        const p1 = points[i + 1]!;
        if (queryRpm >= p0.rpm && queryRpm <= p1.rpm) {
          const alpha = (queryRpm - p0.rpm) / (p1.rpm - p0.rpm);
          detailBoostPsi = p0.boostPsiGauge + alpha * (p1.boostPsiGauge - p0.boostPsiGauge);
          detailFuelMm3 = p0.fuelMm3 + alpha * (p1.fuelMm3 - p0.fuelMm3);
          break;
        }
      }
    }
  }

  const fuelMm3 = 8 + thr * (Math.max(detailFuelMm3, 8) - 8);
  const load = clamp(fuelMm3 / 100, 0, 1);
  const boost = clamp((detailBoostPsi / 20.874) * thr, 0, 1);
  const shaftRpm = 20_000 + 95_000 * boost;

  target.firingHz = fHz;
  target.firingGain = 0.16 + 0.1 * load;
  target.firingLpfHz = 250 + 700 * load;

  target.clatterGain = 0.1 + 0.26 * load + 0.08 * idl;
  target.clatterHz = 1800 + 1400 * load;
  target.clatterQ = 0.9;
  target.clatterAmDepth = 0.6;

  target.bodyGain = 0.04 + 0.1 * load;
  target.bodyLpfHz = 300 + 700 * load;

  target.whistleHz = (3 * shaftRpm) / 60;
  target.whistleGain = boost <= 0 ? 0 : 0.12 * Math.pow(boost, 1.3);

  target.bpfHz = (11 * shaftRpm) / 60;
  target.bpfGain = boost <= 0 ? 0 : 0.045 * Math.pow(boost, 1.5);

  target.lopeHz = fHz / 8;
  target.lopeDepth = 0.22 * idl;
  target.driftHz = 0.37;
  target.driftDepth = 0.1 * idl;

  target.masterGain = 0.42;
  target.boost01 = boost;
  target.load01 = load;
  target.throttle01 = thr;
  target.idle01 = idl;

  return target;
}

function buildPulseHarmonicsReal(
  harmonics: number,
  duty: number,
  decay: number,
): Float32Array<ArrayBuffer> {
  const real = new Float32Array(harmonics + 1);
  for (let n = 1; n <= harmonics; n += 1) {
    real[n] = (Math.sin(Math.PI * n * duty) / (Math.PI * n)) * Math.exp(-n / decay);
  }
  return real;
}

export function firingWaveReal(harmonics = 64): Float32Array<ArrayBuffer> {
  return buildPulseHarmonicsReal(harmonics, 0.18, 14);
}

export function pulseWaveReal(harmonics = 16): Float32Array<ArrayBuffer> {
  return buildPulseHarmonicsReal(harmonics, 0.06, 10);
}

export function fillNoise(length: number, seed = 0x9e3779b9): Float32Array<ArrayBuffer> {
  const out = new Float32Array(length);
  let s = seed >>> 0;
  for (let i = 0; i < length; i += 1) {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out[i] = (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  }
  return out;
}

export function loopSeamCrossfade(
  input: Float32Array,
  seamSamples: number,
): Float32Array<ArrayBuffer> {
  const seam = Math.max(0, Math.min(Math.floor(seamSamples), input.length));
  const outLen = input.length - seam;
  const out = new Float32Array(outLen);
  const blendCount = Math.min(seam, outLen);

  for (let i = 0; i < blendCount; i += 1) {
    const head = input[i]!;
    const tail = input[outLen + i]!;
    const s = Math.sin((0.5 * Math.PI * i) / seam);
    const wHead = s * s;
    out[i] = clamp((1 - wHead) * tail + wHead * head, Math.min(head, tail), Math.max(head, tail));
  }
  for (let i = blendCount; i < outLen; i += 1) {
    out[i] = input[i]!;
  }
  return out;
}

export function isAudible(input: AudibleStateInput): boolean {
  return (
    input.supported &&
    !input.disposed &&
    !input.blocked &&
    input.enabled &&
    input.contextState === 'running' &&
    !input.hidden &&
    input.playing &&
    input.speedMultiplier === 1
  );
}

export function resolveAudioReason(input: AudibleStateInput): EngineAudioReason {
  if (!input.supported) return 'unsupported';
  if (input.disposed || input.contextState === 'closed') return 'disposed';
  if (input.blocked) return 'blocked';
  if (!input.enabled) return 'off';
  if (input.hidden) return 'hidden';
  if (!input.playing) return 'paused';
  if (input.speedMultiplier !== 1) return 'slow-motion';
  return 'running';
}

export function computeAudioStatus(input: AudibleStateInput): EngineAudioStatus {
  return {
    supported: input.supported,
    enabled: input.enabled,
    audible: isAudible(input),
    contextState: input.contextState,
    reason: resolveAudioReason(input),
  };
}
