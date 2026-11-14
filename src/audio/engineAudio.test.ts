import { describe, expect, it } from 'vitest';
import type { CrankState } from '../core/interfaces';
import {
  createEngineAudio,
  type EngineAudioEnvironment,
  type EngineLoadPoint,
} from './index';

interface FakeAudioParam {
  value: number;
  readonly events: Array<{ op: string; value: number; time: number; tau?: number }>;
  setValueAtTime(value: number, time: number): void;
  linearRampToValueAtTime(value: number, time: number): void;
  setTargetAtTime(value: number, time: number, tau: number): void;
  cancelScheduledValues(time: number): void;
}

function makeFakeParam(initial = 0): FakeAudioParam {
  const events: Array<{ op: string; value: number; time: number; tau?: number }> = [];
  return {
    value: initial,
    events,
    setValueAtTime(value: number, time: number) {
      this.value = value;
      events.push({ op: 'setValueAtTime', value, time });
    },
    linearRampToValueAtTime(value: number, time: number) {
      this.value = value;
      events.push({ op: 'linearRampToValueAtTime', value, time });
    },
    setTargetAtTime(value: number, time: number, tau: number) {
      this.value = value;
      events.push({ op: 'setTargetAtTime', value, time, tau });
    },
    cancelScheduledValues(time: number) {
      events.push({ op: 'cancelScheduledValues', value: this.value, time });
    },
  };
}

interface FakeContextHarness {
  readonly env: EngineAudioEnvironment;
  readonly contexts: Array<{
    state: 'suspended' | 'running' | 'closed';
    currentTime: number;
    sampleRate: number;
    createdNodes: Array<{ kind: string; startCalls?: number; gain?: FakeAudioParam }>;
    createdBuffers: number;
    oscillatorStarts: number;
    bufferSourceStarts: number;
    suspendCalls: number;
    resumeCalls: number;
    closeCalls: number;
    masterInitialGain: number | null;
    masterGainParam: FakeAudioParam | null;
  }>;
  readonly sessionTypes: Array<'auto' | 'playback'>;
  readonly unsubscribed: { visibility: number; pageHide: number; audioSession: number };
  setHidden(nextHidden: boolean): void;
  triggerPageHide(): void;
  triggerAudioSessionState(state: string): void;
  advanceTimers(ms: number): void;
  setResumeMode(
    mode: 'auto' | 'reject' | 'stay-suspended' | 'deferred',
  ): { resolveDeferred: () => void; rejectDeferred: () => void };
}

function createFakeHarness(sampleRate = 48_000): FakeContextHarness {
  const contexts: FakeContextHarness['contexts'] = [];
  const sessionTypes: Array<'auto' | 'playback'> = [];
  const unsubscribed = { visibility: 0, pageHide: 0, audioSession: 0 };

  let hidden = false;
  const visibilityListeners = new Set<() => void>();
  const pageHideListeners = new Set<() => void>();
  const sessionListeners = new Set<(state: string) => void>();

  let nowTimerMs = 0;
  let nextTimerId = 1;
  const timers = new Map<number, { dueMs: number; callback: () => void }>();

  let resumeMode: 'auto' | 'reject' | 'stay-suspended' | 'deferred' = 'auto';
  let deferredResolve: (() => void) | null = null;
  let deferredReject: (() => void) | null = null;

  const env: EngineAudioEnvironment = {
    isSupported: () => true,
    createContext: () => {
      const record: FakeContextHarness['contexts'][number] = {
        state: 'suspended',
        currentTime: 0,
        sampleRate,
        createdNodes: [],
        createdBuffers: 0,
        oscillatorStarts: 0,
        bufferSourceStarts: 0,
        suspendCalls: 0,
        resumeCalls: 0,
        closeCalls: 0,
        masterInitialGain: null,
        masterGainParam: null,
      };
      contexts.push(record);

      const fakeCtx = {
        get state() {
          return record.state;
        },
        set state(next: 'suspended' | 'running' | 'closed') {
          record.state = next;
        },
        get currentTime() {
          return record.currentTime;
        },
        sampleRate: record.sampleRate,
        destination: { kind: 'destination' },
        createGain: () => {
          const gainParam = makeFakeParam(1);
          const node = {
            kind: 'gain',
            gain: gainParam,
            connect: () => {
              if (record.masterInitialGain === null && record.createdNodes[0] === node) {
                record.masterInitialGain = gainParam.value;
              }
            },
          };
          if (record.createdNodes.length === 0) {
            record.masterGainParam = gainParam;
          }
          record.createdNodes.push(node);
          return node;
        },
        createDynamicsCompressor: () => {
          const node = {
            kind: 'compressor',
            threshold: makeFakeParam(-24),
            knee: makeFakeParam(30),
            ratio: makeFakeParam(12),
            attack: makeFakeParam(0.003),
            release: makeFakeParam(0.25),
            connect: () => {},
          };
          record.createdNodes.push(node);
          return node;
        },
        createOscillator: () => {
          const node = {
            kind: 'oscillator',
            type: 'sine',
            frequency: makeFakeParam(440),
            startCalls: 0,
            setPeriodicWave: () => {},
            connect: () => {},
            start: () => {
              node.startCalls += 1;
              record.oscillatorStarts += 1;
            },
          };
          record.createdNodes.push(node);
          return node;
        },
        createBiquadFilter: () => {
          const node = {
            kind: 'biquad',
            type: 'lowpass',
            frequency: makeFakeParam(350),
            Q: makeFakeParam(1),
            connect: () => {},
          };
          record.createdNodes.push(node);
          return node;
        },
        createBufferSource: () => {
          const node = {
            kind: 'bufferSource',
            buffer: null as unknown,
            loop: false,
            startCalls: 0,
            connect: () => {},
            start: () => {
              node.startCalls += 1;
              record.bufferSourceStarts += 1;
            },
          };
          record.createdNodes.push(node);
          return node;
        },
        createBuffer: (_channels: number, length: number, _rate: number) => {
          record.createdBuffers += 1;
          const channel = new Float32Array(length);
          return {
            length,
            getChannelData: () => channel,
          };
        },
        createPeriodicWave: (real: Float32Array, imag: Float32Array) => ({
          realLength: real.length,
          imagLength: imag.length,
        }),
        resume: () => {
          record.resumeCalls += 1;
          if (resumeMode === 'reject') {
            return Promise.reject(new Error('NotAllowedError: user gesture required'));
          }
          if (resumeMode === 'stay-suspended') {
            return Promise.resolve();
          }
          if (resumeMode === 'deferred') {
            return new Promise<void>((resolve, reject) => {
              deferredResolve = () => {
                if (record.state !== 'closed') {
                  record.state = 'running';
                }
                resolve();
              };
              deferredReject = () => reject(new Error('Deferred resume rejected'));
            });
          }
          if (record.state !== 'closed') {
            record.state = 'running';
          }
          return Promise.resolve();
        },
        suspend: () => {
          record.suspendCalls += 1;
          if (record.state !== 'closed') {
            record.state = 'suspended';
          }
          return Promise.resolve();
        },
        close: () => {
          record.closeCalls += 1;
          record.state = 'closed';
          return Promise.resolve();
        },
      };

      return fakeCtx as unknown as AudioContext;
    },
    isHidden: () => hidden,
    onVisibilityChange: (listener) => {
      visibilityListeners.add(listener);
      return () => {
        visibilityListeners.delete(listener);
        unsubscribed.visibility += 1;
      };
    },
    onPageHide: (listener) => {
      pageHideListeners.add(listener);
      return () => {
        pageHideListeners.delete(listener);
        unsubscribed.pageHide += 1;
      };
    },
    setAudioSessionType: (type) => {
      sessionTypes.push(type);
    },
    onAudioSessionStateChange: (listener) => {
      sessionListeners.add(listener);
      return () => {
        sessionListeners.delete(listener);
        unsubscribed.audioSession += 1;
      };
    },
    schedule: (callback, delayMs) => {
      const id = nextTimerId++;
      timers.set(id, { dueMs: nowTimerMs + delayMs, callback });
      return id;
    },
    cancel: (handle) => {
      timers.delete(handle);
    },
  };

  return {
    env,
    contexts,
    sessionTypes,
    unsubscribed,
    setHidden(nextHidden: boolean) {
      hidden = nextHidden;
      for (const fn of [...visibilityListeners]) fn();
    },
    triggerPageHide() {
      for (const fn of [...pageHideListeners]) fn();
    },
    triggerAudioSessionState(state: string) {
      for (const fn of [...sessionListeners]) fn(state);
    },
    advanceTimers(ms: number) {
      nowTimerMs += ms;
      for (const [id, entry] of [...timers.entries()]) {
        if (entry.dueMs <= nowTimerMs) {
          timers.delete(id);
          entry.callback();
        }
      }
    },
    setResumeMode(mode) {
      resumeMode = mode;
      return {
        resolveDeferred: () => deferredResolve?.(),
        rejectDeferred: () => deferredReject?.(),
      };
    },
  };
}

const TEST_CURVE: readonly EngineLoadPoint[] = [
  { rpm: 1000, boostPsiGauge: 5.693, fuelMm3: 72.96 },
  { rpm: 1600, boostPsiGauge: 17.079, fuelMm3: 100 },
  { rpm: 2400, boostPsiGauge: 20.874, fuelMm3: 95 },
  { rpm: 3200, boostPsiGauge: 20.874, fuelMm3: 82 },
];

function makeCrankState(rpm: number): CrankState {
  return {
    crankAngleDeg: 0,
    rpm,
    pistonPositionM: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
    valveLiftM: {
      1: { intake: 0, exhaust: 0 },
      2: { intake: 0, exhaust: 0 },
      3: { intake: 0, exhaust: 0 },
      4: { intake: 0, exhaust: 0 },
      5: { intake: 0, exhaust: 0 },
      6: { intake: 0, exhaust: 0 },
      7: { intake: 0, exhaust: 0 },
      8: { intake: 0, exhaust: 0 },
    },
  };
}

describe('Milestone 9 Web Audio graph and lifecycle controller (src/audio/engineAudio.ts)', () => {
  it('10. graph construction: lazy until setEnabled(true), creates 1 context + 21 nodes, starts 6 oscillators + 1 noise source once, caps noise at 48 kHz, and deduplicates concurrent/repeat enables', async () => {
    const harness = createFakeHarness(96_000);
    const audio = createEngineAudio(harness.env);
    audio.setLoadPoints(TEST_CURVE);

    // Zero context/nodes before user gesture
    expect(harness.contexts.length).toBe(0);
    expect(audio.getStatus()).toEqual({
      supported: true,
      enabled: false,
      audible: false,
      contextState: 'uninitialized',
      reason: 'off',
    });
    expect(audio.getStats()).toEqual({ nodeCount: 0, noiseBufferBytes: 0 });
    expect(audio.getParameters().masterGain).toBe(0);

    // Concurrent double-click shares one in-flight start promise
    const [status1, status2] = await Promise.all([
      audio.setEnabled(true),
      audio.setEnabled(true),
    ]);
    expect(status1).toEqual({
      supported: true,
      enabled: true,
      audible: true,
      contextState: 'running',
      reason: 'running',
    });
    expect(status2).toEqual(status1);

    expect(harness.contexts.length).toBe(1);
    const ctxRecord = harness.contexts[0]!;
    expect(ctxRecord.createdNodes.length).toBe(21);
    expect(ctxRecord.oscillatorStarts).toBe(6);
    expect(ctxRecord.bufferSourceStarts).toBe(1);
    expect(ctxRecord.masterInitialGain).toBe(0);
    expect(harness.sessionTypes).toContain('playback');

    // Noise buffer capped at 48 kHz * 2 s * 4 B = 384,000 B even on a 96 kHz context
    expect(audio.getStats()).toEqual({
      nodeCount: 21,
      noiseBufferBytes: 384_000,
    });

    // Second enable after already running creates no second context or nodes
    await audio.setEnabled(true);
    expect(harness.contexts.length).toBe(1);
    expect(ctxRecord.createdNodes.length).toBe(21);
    expect(ctxRecord.oscillatorStarts).toBe(6);
    expect(ctxRecord.bufferSourceStarts).toBe(1);
  });

  it('11. lifecycle: visibility, pagehide, hide-during-start, generation token, 180 ms timer cancellation, pause/slow-motion, audioSession, blocked resume, setLoadPoints validation, and dispose', async () => {
    const harness = createFakeHarness(48_000);
    const audio = createEngineAudio(harness.env);

    // Validation at setLoadPoints boundary
    expect(() => audio.setLoadPoints([])).toThrow();
    expect(() =>
      audio.setLoadPoints([
        { rpm: 1200, boostPsiGauge: 5, fuelMm3: 70 },
        { rpm: 1100, boostPsiGauge: 6, fuelMm3: 75 },
      ]),
    ).toThrow();
    expect(() =>
      audio.setLoadPoints([{ rpm: 1000, boostPsiGauge: Number.NaN, fuelMm3: 70 }]),
    ).toThrow();

    audio.setLoadPoints(TEST_CURVE);
    await audio.setEnabled(true);
    const ctxRecord = harness.contexts[0]!;
    expect(audio.getStatus().audible).toBe(true);

    // Hidden suspends immediately (without waiting for 180 ms timer)
    harness.setHidden(true);
    expect(ctxRecord.state).toBe('suspended');
    expect(ctxRecord.suspendCalls).toBe(1);
    expect(audio.getStatus()).toMatchObject({
      enabled: true,
      audible: false,
      contextState: 'suspended',
      reason: 'hidden',
    });

    // Visible + paused does NOT resume
    audio.update(makeCrankState(900), { playing: false, speedMultiplier: 1 });
    harness.setHidden(false);
    await Promise.resolve();
    expect(ctxRecord.state).toBe('suspended');
    expect(audio.getStatus().reason).toBe('paused');

    // Visible + slow motion (0.1x) does NOT resume
    harness.setHidden(true);
    audio.update(makeCrankState(900), { playing: true, speedMultiplier: 0.1 });
    harness.setHidden(false);
    await Promise.resolve();
    expect(ctxRecord.state).toBe('suspended');
    expect(audio.getStatus().reason).toBe('slow-motion');

    // Visible + playing + 1x resumes
    harness.setHidden(true);
    audio.update(makeCrankState(900), { playing: true, speedMultiplier: 1 });
    harness.setHidden(false);
    await Promise.resolve();
    expect(ctxRecord.state).toBe('running');
    expect(audio.getStatus()).toMatchObject({
      enabled: true,
      audible: true,
      contextState: 'running',
      reason: 'running',
    });

    // pagehide suspends without closing context
    harness.triggerPageHide();
    expect(ctxRecord.state).toBe('suspended');
    expect(ctxRecord.closeCalls).toBe(0);

    // Re-enable back to running
    await audio.setEnabled(true);
    expect(ctxRecord.state).toBe('running');

    // setEnabled(false) ramps and suspends after 180 ms
    await audio.setEnabled(false);
    expect(audio.getStatus()).toMatchObject({ enabled: false, audible: false, reason: 'off' });
    expect(harness.sessionTypes[harness.sessionTypes.length - 1]).toBe('auto');
    expect(ctxRecord.state).toBe('running');
    harness.advanceTimers(179);
    expect(ctxRecord.state).toBe('running');
    harness.advanceTimers(1);
    expect(ctxRecord.state).toBe('suspended');

    // Fast off -> on inside the 180 ms window cancels the pending suspend
    await audio.setEnabled(true);
    expect(ctxRecord.state).toBe('running');
    await audio.setEnabled(false);
    harness.advanceTimers(80);
    await audio.setEnabled(true);
    harness.advanceTimers(250);
    expect(ctxRecord.state).toBe('running');
    expect(audio.getStatus().audible).toBe(true);

    // Fast Pause -> Play inside the 180 ms window cancels the pending suspend
    audio.update(makeCrankState(900), { playing: false, speedMultiplier: 1 });
    expect(audio.getStatus()).toMatchObject({ audible: false, reason: 'paused' });
    harness.advanceTimers(90);
    audio.update(makeCrankState(900), { playing: true, speedMultiplier: 1 });
    harness.advanceTimers(250);
    expect(ctxRecord.state).toBe('running');
    expect(audio.getStatus()).toMatchObject({ audible: true, reason: 'running' });

    // audioSession interrupted -> active suspends and resumes
    harness.triggerAudioSessionState('interrupted');
    harness.advanceTimers(180);
    expect(ctxRecord.state).toBe('suspended');
    expect(audio.getStatus().audible).toBe(false);
    harness.triggerAudioSessionState('active');
    await Promise.resolve();
    expect(ctxRecord.state).toBe('running');
    expect(audio.getStatus().audible).toBe(true);

    // bfcache restore (external suspension without visibilitychange): update() retries resume once per second
    ctxRecord.state = 'suspended';
    const resumesBeforeBfcache = ctxRecord.resumeCalls;
    audio.update(makeCrankState(900), { playing: true, speedMultiplier: 1 });
    await Promise.resolve();
    expect(ctxRecord.resumeCalls).toBe(resumesBeforeBfcache + 1);
    expect(ctxRecord.state).toBe('running');
    expect(audio.getStatus().audible).toBe(true);

    // Enabling Sound while already paused keeps master at 0 until Play
    await audio.setEnabled(false);
    harness.advanceTimers(200);
    audio.update(makeCrankState(900), { playing: false, speedMultiplier: 1 });
    const pausedEnableStatus = await audio.setEnabled(true);
    expect(pausedEnableStatus).toMatchObject({
      enabled: true,
      audible: false,
      reason: 'paused',
    });
    expect(audio.getParameters().masterGain).toBe(0);
    harness.advanceTimers(180);
    expect(ctxRecord.state).toBe('suspended');
    audio.update(makeCrankState(900), { playing: true, speedMultiplier: 1 });
    await Promise.resolve();
    expect(ctxRecord.state).toBe('running');
    expect(audio.getStatus().audible).toBe(true);

    // Rejected resume on visible sets blocked and enabled: false (never silent "on")
    harness.setHidden(true);
    expect(ctxRecord.state).toBe('suspended');
    harness.setResumeMode('reject');
    harness.setHidden(false);
    await Promise.resolve();
    await Promise.resolve();
    expect(audio.getStatus()).toMatchObject({
      enabled: false,
      audible: false,
      contextState: 'suspended',
      reason: 'blocked',
    });

    // Rejected resume on setEnabled(true) resolves (never rejects) with blocked
    const blockedStatus = await audio.setEnabled(true);
    expect(blockedStatus).toMatchObject({
      enabled: false,
      audible: false,
      reason: 'blocked',
    });

    // Hide arriving while setEnabled(true) is starting suspends as soon as start resolves
    const deferredHide = harness.setResumeMode('deferred');
    const pendingHideStart = audio.setEnabled(true);
    harness.setHidden(true);
    deferredHide.resolveDeferred();
    const afterHideStart = await pendingHideStart;
    expect(ctxRecord.state).toBe('suspended');
    expect(afterHideStart).toMatchObject({
      enabled: true,
      audible: false,
      contextState: 'suspended',
      reason: 'hidden',
    });
    expect(ctxRecord.masterGainParam?.value).toBe(0);
    harness.setHidden(false);
    harness.setResumeMode('auto');

    // Stale start (on -> off while start in flight) suspends when resolved and stays off
    await audio.setEnabled(false);
    harness.advanceTimers(200);
    const deferredCancel = harness.setResumeMode('deferred');
    const staleStart = audio.setEnabled(true);
    await audio.setEnabled(false);
    deferredCancel.resolveDeferred();
    const staleResult = await staleStart;
    expect(ctxRecord.state).toBe('suspended');
    expect(staleResult).toMatchObject({
      enabled: false,
      audible: false,
      reason: 'off',
    });

    // dispose() closes context, leaves nodeCount: 0, and calls all environment unsubscribes
    audio.dispose();
    expect(ctxRecord.closeCalls).toBe(1);
    expect(audio.getStats()).toEqual({ nodeCount: 0, noiseBufferBytes: 0 });
    expect(audio.getStatus()).toEqual({
      supported: true,
      enabled: false,
      audible: false,
      contextState: 'closed',
      reason: 'disposed',
    });
    expect(harness.unsubscribed).toEqual({
      visibility: 1,
      pageHide: 1,
      audioSession: 1,
    });
  });

  it('12. no per-update churn: 120 update() calls allocate zero nodes/buffers and reuse one parameter object', async () => {
    const harness = createFakeHarness(48_000);
    const audio = createEngineAudio(harness.env);
    audio.setLoadPoints(TEST_CURVE);
    await audio.setEnabled(true);

    const ctxRecord = harness.contexts[0]!;
    const initialNodes = ctxRecord.createdNodes.length;
    const initialBuffers = ctxRecord.createdBuffers;
    const paramRef = audio.getParameters();
    const reusablePlayback = { playing: true, speedMultiplier: 1 };

    for (let i = 0; i < 120; i += 1) {
      const rpm = 650 + ((i * 23) % 2551);
      audio.update(makeCrankState(rpm), reusablePlayback);
      expect(audio.getParameters()).toBe(paramRef);
    }

    expect(ctxRecord.createdNodes.length).toBe(initialNodes);
    expect(ctxRecord.createdBuffers).toBe(initialBuffers);
    expect(audio.getStats().nodeCount).toBe(21);
  });
});
