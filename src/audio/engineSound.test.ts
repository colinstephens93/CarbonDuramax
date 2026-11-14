import { describe, expect, it, vi } from 'vitest';
import { engineConfig } from '../config/engineConfig';
import { computeDetails, stockBuild } from '../perf';
import { fullCatalog } from '../catalog';
import {
  ENGINE_SOUND_CONSTANTS,
  computeSoundParameters,
  createEngineAudio,
  createSoundParameters,
  fillNoise,
  firingFrequencyHz,
  firingWaveReal,
  idle01,
  isAudible,
  loopSeamCrossfade,
  pulseWaveReal,
  resolveAudioReason,
  throttle01,
  type AudibleStateInput,
  type EngineAudioEnvironment,
  type EngineLoadPoint,
} from './index';

const SYNTHETIC_STOCK_CURVE: readonly EngineLoadPoint[] = [
  { rpm: 1000, boostPsiGauge: 5.693, fuelMm3: 72.96 },
  { rpm: 1600, boostPsiGauge: 17.079, fuelMm3: 100 },
  { rpm: 2400, boostPsiGauge: 20.874, fuelMm3: 95 },
  { rpm: 3200, boostPsiGauge: 20.874, fuelMm3: 82 },
];

const SYNTHETIC_HIGH_BOOST_CURVE: readonly EngineLoadPoint[] = [
  { rpm: 1000, boostPsiGauge: 6.0, fuelMm3: 89.4 },
  { rpm: 1600, boostPsiGauge: 18.0, fuelMm3: 113.9 },
  { rpm: 2400, boostPsiGauge: 27.93, fuelMm3: 110 },
  { rpm: 3200, boostPsiGauge: 27.93, fuelMm3: 108 },
];

describe('Milestone 9 pure engine sound model (src/audio/engineSound.ts)', () => {
  it('1. firing rate: firingFrequencyHz matches rpm/15 and powerStrokesPerRev matches 8-cyl 4-stroke arithmetic', () => {
    expect(ENGINE_SOUND_CONSTANTS.powerStrokesPerRev).toBe(engineConfig.firingOrder.length / 2);
    expect(ENGINE_SOUND_CONSTANTS.powerStrokesPerRev).toBe(4);

    for (const rpm of [650, 900, 1600, 3200]) {
      expect(Math.abs(firingFrequencyHz(rpm) - rpm / 15)).toBeLessThan(1e-9);
    }
  });

  it('2. signal derivation: throttle01 and idle01 hit exact endpoints/anchors and are monotone across 650–3200 rpm', () => {
    expect(throttle01(650)).toBe(0);
    expect(throttle01(3200)).toBe(1);

    expect(Math.abs(idle01(650) - 1)).toBeLessThan(1e-6);
    expect(Math.abs(idle01(750) - 1)).toBeLessThan(1e-6);
    expect(Math.abs(idle01(900) - 0.864815658)).toBeLessThan(1e-6);
    expect(Math.abs(idle01(1400) - 0)).toBeLessThan(1e-6);
    expect(Math.abs(idle01(3200) - 0)).toBeLessThan(1e-6);

    let prevThrottle = throttle01(650);
    let prevIdle = idle01(650);
    for (let rpm = 651; rpm <= 3200; rpm += 1) {
      const nextThrottle = throttle01(rpm);
      const nextIdle = idle01(rpm);
      expect(nextThrottle).toBeGreaterThanOrEqual(prevThrottle);
      expect(nextIdle).toBeLessThanOrEqual(prevIdle);
      prevThrottle = nextThrottle;
      prevIdle = nextIdle;
    }
  });

  it('3. exact parameter snapshot: matches §3 equations to 1e-6 across 650/900/1600/2400/3200 rpm', () => {
    const expectedSnapshots: Record<
      number,
      {
        load01: number;
        boost01: number;
        firingGain: number;
        firingLpfHz: number;
        clatterGain: number;
        clatterHz: number;
        bodyGain: number;
        bodyLpfHz: number;
        whistleHz: number;
        whistleGain: number;
        bpfHz: number;
        bpfGain: number;
        lopeDepth: number;
      }
    > = {
      650: {
        load01: 0.08,
        boost01: 0,
        firingGain: 0.168,
        firingLpfHz: 306,
        clatterGain: 0.2008,
        clatterHz: 1912,
        bodyGain: 0.048,
        bodyLpfHz: 356,
        whistleHz: 1000,
        whistleGain: 0,
        bpfHz: 3666.666666667,
        bpfGain: 0,
        lopeDepth: 0.22,
      },
      900: {
        load01: 0.143686275,
        boost01: 0.026738395,
        firingGain: 0.174368627,
        firingLpfHz: 350.580392157,
        clatterGain: 0.206543684,
        clatterHz: 2001.160784314,
        bodyGain: 0.054368627,
        bodyLpfHz: 400.580392157,
        whistleHz: 1127.00737572,
        whistleGain: 0.001082573,
        bpfHz: 4132.360377641,
        bpfGain: 0.00019675,
        lopeDepth: 0.190259445,
      },
      1600: {
        load01: 0.422745098,
        boost01: 0.304817702,
        firingGain: 0.20227451,
        firingLpfHz: 545.921568627,
        clatterGain: 0.209913725,
        clatterHz: 2391.843137255,
        bodyGain: 0.08227451,
        bodyLpfHz: 595.921568627,
        whistleHz: 2447.884083211,
        whistleGain: 0.02561141,
        bpfHz: 8975.574971773,
        bpfGain: 0.007573084,
        lopeDepth: 0,
      },
      2400: {
        load01: 0.677058824,
        boost01: 0.68627451,
        firingGain: 0.227705882,
        firingLpfHz: 723.941176471,
        clatterGain: 0.276035294,
        clatterHz: 2747.882352941,
        bodyGain: 0.107705882,
        bodyLpfHz: 773.941176471,
        whistleHz: 4259.803921569,
        whistleGain: 0.073557756,
        bpfHz: 15619.281045752,
        bpfGain: 0.025583462,
        lopeDepth: 0,
      },
      3200: {
        load01: 0.82,
        boost01: 1,
        firingGain: 0.242,
        firingLpfHz: 824,
        clatterGain: 0.3132,
        clatterHz: 2948,
        bodyGain: 0.122,
        bodyLpfHz: 874,
        whistleHz: 5750,
        whistleGain: 0.12,
        bpfHz: 21083.333333333,
        bpfGain: 0.045,
        lopeDepth: 0,
      },
    };

    const scratch = createSoundParameters();
    expect(scratch.masterGain).toBe(0);

    for (const [rpmKey, exp] of Object.entries(expectedSnapshots)) {
      const rpm = Number(rpmKey);
      const actual = computeSoundParameters(SYNTHETIC_STOCK_CURVE, rpm, scratch);
      expect(actual).toBe(scratch);
      for (const [field, expectedValue] of Object.entries(exp)) {
        const got = actual[field as keyof typeof exp];
        expect(Math.abs(got - expectedValue), `rpm=${rpm} field=${field}`).toBeLessThan(1e-6);
      }
    }
  });

  it('4. clamps and finiteness: clamps detail to [1000, 3400] and keeps every parameter finite and in range', () => {
    const grid25: EngineLoadPoint[] = [];
    for (let rpm = 1000; rpm <= 3400; rpm += 100) {
      grid25.push({
        rpm,
        boostPsiGauge: 5 + ((rpm - 1000) / 2400) * 16,
        fuelMm3: 70 + ((rpm - 1000) / 2400) * 30,
      });
    }

    // Below 1000 rpm uses the 1000-rpm point; above 3400 rpm uses the 3400-rpm point.
    const low850 = computeSoundParameters(grid25, 850);
    const low850FromSingle1000 = computeSoundParameters([grid25[0]!], 850);
    expect(low850.load01).toBeCloseTo(low850FromSingle1000.load01, 12);
    expect(low850.boost01).toBeCloseTo(low850FromSingle1000.boost01, 12);

    const high3600 = computeSoundParameters(grid25, 3600);
    const high3600FromSingle3400 = computeSoundParameters([grid25[grid25.length - 1]!], 3600);
    expect(high3600.load01).toBeCloseTo(high3600FromSingle3400.load01, 12);
    expect(high3600.boost01).toBeCloseTo(high3600FromSingle3400.boost01, 12);

    const target = createSoundParameters();
    for (const curve of [SYNTHETIC_STOCK_CURVE, SYNTHETIC_HIGH_BOOST_CURVE, grid25]) {
      const idle650 = computeSoundParameters(curve, 650, target);
      expect(idle650.whistleGain).toBe(0);

      for (let rpm = 650; rpm <= 3200; rpm += 1) {
        const p = computeSoundParameters(curve, rpm, target);
        for (const [k, value] of Object.entries(p)) {
          if (!Number.isFinite(value)) {
            throw new Error(`Non-finite parameter ${k} at rpm=${rpm}: ${value}`);
          }
        }
        if (
          p.firingHz < 650 / 15 - 1e-9 ||
          p.firingHz > 3200 / 15 + 1e-9 ||
          p.throttle01 < 0 ||
          p.throttle01 > 1 ||
          p.idle01 < 0 ||
          p.idle01 > 1 ||
          p.load01 < 0.08 - 1e-9 ||
          p.load01 > 1 ||
          p.boost01 < 0 ||
          p.boost01 > 1 ||
          p.firingGain < 0.16 ||
          p.firingGain > 0.26 ||
          p.firingLpfHz < 250 ||
          p.firingLpfHz > 950 ||
          p.clatterGain < 0.1 ||
          p.clatterGain > 0.44 + 1e-9 ||
          p.clatterHz < 1800 ||
          p.clatterHz > 3200 ||
          p.whistleHz < 1000 ||
          p.whistleHz > 5750 ||
          p.whistleGain < 0 ||
          p.whistleGain > 0.12 + 1e-9 ||
          p.bpfHz < 3666 ||
          p.bpfHz > 21084 ||
          p.bpfGain < 0 ||
          p.bpfGain > 0.045 + 1e-9
        ) {
          throw new Error(`Out-of-range parameter at rpm=${rpm}: ${JSON.stringify(p)}`);
        }
      }
    }
  });

  it('5. build sensitivity: high-boost build raises 2400-rpm whistle, both hit 5750 Hz ceiling at 3200, and 900 rpm whistle is silent (<0.002)', () => {
    const stock2400 = computeSoundParameters(SYNTHETIC_STOCK_CURVE, 2400);
    const mod2400 = computeSoundParameters(SYNTHETIC_HIGH_BOOST_CURVE, 2400);
    expect(mod2400.boost01).toBeGreaterThan(stock2400.boost01);
    expect(mod2400.whistleHz).toBeGreaterThan(stock2400.whistleHz);
    expect(stock2400.whistleHz).toBeCloseTo(4259.804, 3);
    expect(mod2400.whistleHz).toBeCloseTo(5361.709, 3);

    // Cross-check against the real M5 performance model's §13.2 pinned builds as well.
    const realStockDetails = computeDetails(stockBuild);
    const realPinnedModDetails = computeDetails(
      {
        buildId: 'm9-pinned',
        name: 'Pinned M9 turbo+tune',
        selections: {
          ...stockBuild.selections,
          turbo: 'turbo_large',
          tune: 'tune_performance',
        },
      },
      fullCatalog,
    );
    const realStock2400 = computeSoundParameters(realStockDetails, 2400);
    const realMod2400 = computeSoundParameters(realPinnedModDetails, 2400);
    expect(realStock2400.whistleHz).toBeCloseTo(4259.804, 3);
    expect(realMod2400.whistleHz).toBeCloseTo(5361.709, 3);

    const stock3200 = computeSoundParameters(SYNTHETIC_STOCK_CURVE, 3200);
    const mod3200 = computeSoundParameters(SYNTHETIC_HIGH_BOOST_CURVE, 3200);
    expect(stock3200.whistleHz).toBe(5750);
    expect(mod3200.whistleHz).toBe(5750);

    const stock900 = computeSoundParameters(SYNTHETIC_STOCK_CURVE, 900);
    expect(stock900.whistleGain).toBeLessThan(0.002);
  });

  it('6. waveform tables: firingWaveReal(64) and pulseWaveReal(16) have zero DC, finite decaying harmonics, and match §13.4', () => {
    const firing = firingWaveReal();
    expect(firing.length).toBe(65);
    expect(firing[0]).toBe(0);
    for (let i = 0; i < firing.length; i += 1) {
      expect(Number.isFinite(firing[i])).toBe(true);
    }

    const a1 = Math.abs(firing[1]!);
    const a2 = Math.abs(firing[2]!);
    const a4 = Math.abs(firing[4]!);
    const a8 = Math.abs(firing[8]!);
    expect(a1).toBeGreaterThan(a2);
    expect(a2).toBeGreaterThan(a4);
    expect(a4).toBeGreaterThan(a8);
    expect(a8).toBeGreaterThan(0);

    expect(firing[1]!).toBeCloseTo(0.158801, 5);
    expect(firing[6]!).toBeCloseTo(-0.008595, 5);
    expect(firing[64]!).toBeCloseTo(-0.00005134, 6);
    expect(Math.abs(firing[64]!)).toBeLessThan(1e-3);

    const pulse = pulseWaveReal();
    expect(pulse.length).toBe(17);
    expect(pulse[0]).toBe(0);
    for (let i = 0; i < pulse.length; i += 1) {
      expect(Number.isFinite(pulse[i])).toBe(true);
    }
  });

  it('7. noise generation and loop seam: fillNoise is deterministic without Math.random and loopSeamCrossfade forms a convex blend', () => {
    expect(ENGINE_SOUND_CONSTANTS.noiseSeamMs).toBe(20);

    const randomSpy = vi.spyOn(Math, 'random');
    try {
      const n1 = fillNoise(48_000, ENGINE_SOUND_CONSTANTS.noiseSeed);
      const n2 = fillNoise(48_000, ENGINE_SOUND_CONSTANTS.noiseSeed);
      const nDiff = fillNoise(48_000, 0x12345678);

      expect(randomSpy).not.toHaveBeenCalled();
      expect(n1.length).toBe(48_000);
      expect(n1).toEqual(n2);

      let differs = false;
      for (let i = 0; i < n1.length; i += 1) {
        const s = n1[i]!;
        if (!Number.isFinite(s) || s < -1 || s > 1) {
          throw new Error(`Invalid noise sample at ${i}: ${s}`);
        }
        if (s !== nDiff[i]) {
          differs = true;
        }
      }
      expect(differs).toBe(true);

      const seamSamples = 960; // 20 ms @ 48 kHz
      const input = fillNoise(8000 + seamSamples, ENGINE_SOUND_CONSTANTS.noiseSeed);
      const crossfaded = loopSeamCrossfade(input, seamSamples);
      expect(crossfaded.length).toBe(input.length - seamSamples);

      const outLen = crossfaded.length;
      for (let i = 0; i < seamSamples; i += 1) {
        const head = input[i]!;
        const tail = input[outLen + i]!;
        const lo = Math.min(head, tail);
        const hi = Math.max(head, tail);
        expect(crossfaded[i]!).toBeGreaterThanOrEqual(lo);
        expect(crossfaded[i]!).toBeLessThanOrEqual(hi);
      }
      for (let i = seamSamples; i < outLen; i += 1) {
        expect(crossfaded[i]).toBe(input[i]);
      }
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('8. audible state machine: isAudible requires every condition true and reason follows strict priority order', () => {
    const baseTrue: AudibleStateInput = {
      supported: true,
      disposed: false,
      blocked: false,
      enabled: true,
      contextState: 'running',
      hidden: false,
      playing: true,
      speedMultiplier: 1,
    };

    expect(isAudible(baseTrue)).toBe(true);
    expect(resolveAudioReason(baseTrue)).toBe('running');

    // Flipping any single condition yields audible === false.
    expect(isAudible({ ...baseTrue, supported: false })).toBe(false);
    expect(isAudible({ ...baseTrue, disposed: true })).toBe(false);
    expect(isAudible({ ...baseTrue, blocked: true })).toBe(false);
    expect(isAudible({ ...baseTrue, enabled: false })).toBe(false);
    expect(isAudible({ ...baseTrue, contextState: 'suspended' })).toBe(false);
    expect(isAudible({ ...baseTrue, contextState: 'uninitialized' })).toBe(false);
    expect(isAudible({ ...baseTrue, contextState: 'starting' })).toBe(false);
    expect(isAudible({ ...baseTrue, hidden: true })).toBe(false);
    expect(isAudible({ ...baseTrue, playing: false })).toBe(false);
    expect(isAudible({ ...baseTrue, speedMultiplier: 0.1 })).toBe(false);
    expect(isAudible({ ...baseTrue, speedMultiplier: 0.01 })).toBe(false);

    // Priority chain: unsupported > disposed > blocked > off > hidden > paused > slow-motion > running
    const allBad: AudibleStateInput = {
      supported: false,
      disposed: true,
      blocked: true,
      enabled: false,
      contextState: 'closed',
      hidden: true,
      playing: false,
      speedMultiplier: 0.1,
    };
    expect(resolveAudioReason(allBad)).toBe('unsupported');
    expect(resolveAudioReason({ ...allBad, supported: true })).toBe('disposed');
    expect(
      resolveAudioReason({ ...allBad, supported: true, disposed: false, contextState: 'suspended' }),
    ).toBe('blocked');
    expect(
      resolveAudioReason({
        ...allBad,
        supported: true,
        disposed: false,
        blocked: false,
        contextState: 'suspended',
      }),
    ).toBe('off');
    expect(
      resolveAudioReason({
        ...allBad,
        supported: true,
        disposed: false,
        blocked: false,
        enabled: true,
        contextState: 'suspended',
      }),
    ).toBe('hidden');
    expect(
      resolveAudioReason({
        ...allBad,
        supported: true,
        disposed: false,
        blocked: false,
        enabled: true,
        hidden: false,
        contextState: 'suspended',
      }),
    ).toBe('paused');
    expect(
      resolveAudioReason({
        ...allBad,
        supported: true,
        disposed: false,
        blocked: false,
        enabled: true,
        hidden: false,
        playing: true,
        contextState: 'suspended',
      }),
    ).toBe('slow-motion');
    expect(
      resolveAudioReason({
        ...allBad,
        supported: true,
        disposed: false,
        blocked: false,
        enabled: true,
        hidden: false,
        playing: true,
        speedMultiplier: 1,
        contextState: 'running',
      }),
    ).toBe('running');
  });

  it('9. unsupported environment: reports unsupported initially and setEnabled(true) never creates a context', async () => {
    let createContextCalls = 0;
    const unsupportedEnv: EngineAudioEnvironment = {
      isSupported: () => false,
      createContext: () => {
        createContextCalls += 1;
        throw new Error('Must not construct AudioContext when unsupported');
      },
      isHidden: () => false,
      onVisibilityChange: () => () => {},
      onPageHide: () => () => {},
      setAudioSessionType: () => {},
      schedule: () => 0,
      cancel: () => {},
    };

    const audio = createEngineAudio(unsupportedEnv);
    expect(audio.getStatus()).toEqual({
      supported: false,
      enabled: false,
      audible: false,
      contextState: 'unsupported',
      reason: 'unsupported',
    });

    const afterEnable = await audio.setEnabled(true);
    expect(createContextCalls).toBe(0);
    expect(afterEnable).toEqual({
      supported: false,
      enabled: false,
      audible: false,
      contextState: 'unsupported',
      reason: 'unsupported',
    });
    expect(audio.getStats()).toEqual({ nodeCount: 0, noiseBufferBytes: 0 });
  });
});
