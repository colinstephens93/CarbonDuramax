// Application entry point for Duramax LLY Engine Lab (Milestone 9: Engine Sound).

import {
  createEngineAudio,
  type EngineAudioStatus,
  type EnginePlaybackState,
} from './audio';
import { fullCatalog, slotForVariantId, visualVariantsForBuild } from './catalog';
import { detailConfig } from './config/detailConfig';
import { engineConfig, stockRatings } from './config/engineConfig';
import { valveConfig } from './config/valveConfig';
import type { Build, CrankState } from './core/interfaces';
import { computeCurve, computeDetails, stockBuild } from './perf';
import { createEngineScene, type VisualVariantDescriptor } from './renderer';
import {
  mountEngineUi,
  type EngineUiHandle,
  type UiQualityMode,
  type UiSectionMode,
  type UiSoundState,
} from './ui/engineControls';
import { REFERENCE_FRAME_DEFS } from './ui/referenceFrames';

const toUiSoundState = (status: EngineAudioStatus): UiSoundState => {
  if (!status.supported) return 'unsupported';
  if (status.reason === 'blocked') return 'blocked';
  return status.enabled ? 'on' : 'off';
};

const container = document.getElementById('app');
if (!container) {
  throw new Error('Missing #app container element.');
}

// Build the visual descriptor list once from the merged catalog (M8 §5.2).
const visualVariants: VisualVariantDescriptor[] = fullCatalog
  .filter((v): v is typeof v & { modelPath: string } => v.modelPath !== null)
  .map((v) => ({
    slotId: v.slotId,
    variantId: v.id,
    modelPath: v.modelPath,
    explodeVectorMm: v.explodeVectorMm,
  }));

// Create the scene with the preloaded variant descriptors.
const scene = createEngineScene(container, engineConfig, valveConfig, detailConfig, {
  visualVariants,
});

// Compute steady-state stock dyno curve and point details once on load (M5 §5, M6 §4.1).
const stockDynoCurve = computeCurve(stockBuild);
const stockDynoDetails = computeDetails(stockBuild);

const initialModifiedBuild: Build = {
  buildId: 'modified',
  name: 'Modified build',
  selections: { ...stockBuild.selections },
};
const initialModifiedCurve = computeCurve(initialModifiedBuild, fullCatalog);
const initialModifiedDetails = computeDetails(initialModifiedBuild, fullCatalog);

const params = new URLSearchParams(window.location.search);
const isBenchmark = params.get('benchmark') === '1';
const cpuRenderSamplesMs: number[] = [];

let labelsEnabled = false;
let uiRef: EngineUiHandle | null = null;
let lastSteadyState: CrankState | null = null;
const lastSteadyPlayback = { playing: true, speedMultiplier: 1 };

const refreshLabelsIfEnabled = (): void => {
  if (labelsEnabled && uiRef) {
    uiRef.updateLabels(scene.projectLabelAnchors(window.innerWidth, window.innerHeight));
  }
};

// Pinned M9 §5.2 ordering: create audio controller and load initial points before mountEngineUi.
const audio = createEngineAudio();
audio.setLoadPoints(initialModifiedDetails);

let soundTogglePending = 0;
let currentUiSoundState: UiSoundState = toUiSoundState(audio.getStatus());

const runSoundToggle = (next: boolean, onDone?: () => void): void => {
  soundTogglePending += 1;
  void audio.setEnabled(next).then((status) => {
    soundTogglePending = Math.max(0, soundTogglePending - 1);
    currentUiSoundState = toUiSoundState(status);
    uiRef?.setSoundState(currentUiSoundState);
    onDone?.();
  });
};

const ui = mountEngineUi(
  engineConfig,
  valveConfig,
  (state, playback: EnginePlaybackState) => {
    const t0 = isBenchmark ? performance.now() : 0;
    scene.update(state);
    refreshLabelsIfEnabled();
    if (isBenchmark) {
      cpuRenderSamplesMs.push(performance.now() - t0);
      lastSteadyState = state;
      lastSteadyPlayback.playing = playback.playing;
      lastSteadyPlayback.speedMultiplier = playback.speedMultiplier;
    }

    // Audio update runs outside the D-033 CPU-render timing block (M9 §5.2).
    audio.update(state, playback);

    if (soundTogglePending === 0 && uiRef) {
      const nextUiState = toUiSoundState(audio.getStatus());
      if (nextUiState !== currentUiSoundState) {
        currentUiSoundState = nextUiState;
        uiRef.setSoundState(nextUiState);
      }
    }
  },
  {
    onExteriorChange: (visible) => {
      scene.setExteriorVisible(visible);
      refreshLabelsIfEnabled();
    },
    onQualityChange: (mode) => {
      scene.setQualityMode(mode);
    },
    onExplodeChange: (explodeFactor) => {
      scene.setExplodeFactor(explodeFactor);
      refreshLabelsIfEnabled();
    },
    onSectionChange: (mode, positionMm) => {
      scene.setSectionState(mode, positionMm);
      refreshLabelsIfEnabled();
    },
    onXrayChange: (enabled) => {
      scene.setXrayEnabled(enabled);
      refreshLabelsIfEnabled();
    },
    onLabelsChange: (enabled) => {
      labelsEnabled = enabled;
      refreshLabelsIfEnabled();
    },
    onBuildChange: (build) => {
      scene.setVisualVariantSelections(visualVariantsForBuild(build, fullCatalog));
      try {
        audio.setLoadPoints(computeDetails(build, fullCatalog));
      } catch (error) {
        console.error('Engine sound load-curve update failed:', error);
      }
    },
    onSoundToggle: (next) => {
      runSoundToggle(next);
    },
    dyno: {
      stock: {
        curve: stockDynoCurve,
        details: stockDynoDetails,
      },
      modified: {
        curve: initialModifiedCurve,
        details: initialModifiedDetails,
      },
      ratings: stockRatings,
    },
  },
);
uiRef = ui;

// Apply initial all-stock visual state and initial sound UI state.
scene.setVisualVariantSelections(visualVariantsForBuild(initialModifiedBuild, fullCatalog));
currentUiSoundState = toUiSoundState(audio.getStatus());
ui.setSoundState(currentUiSoundState);

const debugWindow = window as unknown as {
  __engineScene?: typeof scene;
  __engineUi?: typeof ui;
  __engineAudio?: typeof audio;
};
debugWindow.__engineScene = scene;
debugWindow.__engineUi = ui;
debugWindow.__engineAudio = audio;

const applyReferenceFrame = (frameId: string): boolean => {
  const def = REFERENCE_FRAME_DEFS[frameId];
  if (!def) return false;
  if (def.variants) {
    for (const variantId of def.variants) {
      const slot = slotForVariantId(variantId, fullCatalog);
      if (slot) {
        ui.setBuildSelection(slot, variantId);
      }
    }
  }
  ui.setQualityMode('full');
  ui.setExteriorChecked(def.exterior);
  ui.setExplodePercent(def.explodePercent ?? 0);
  ui.setSectionMode(def.sectionMode ?? 'off');
  if (def.sectionPositionMm !== undefined) {
    ui.setSectionPositionMm(def.sectionPositionMm);
  }
  ui.setXrayChecked(def.xray ?? false);
  ui.setLabelsChecked(def.labels ?? false);
  scene.setCameraPose(def.position, def.target);
  ui.setCrankAngleDeg(def.thetaDeg);
  return true;
};

// Handle ?rf=...
const requestedRf = params.get('rf')?.toUpperCase() ?? null;
if (requestedRf) {
  applyReferenceFrame(requestedRf);
}

// Opt-in 10-second @ 900 RPM telemetry probe (`?benchmark=1`, plus optional
// `&quality=full|phone&exterior=0|1&explode=0..100&section=off|x|y&sectionPos=<mm>&xray=0|1&labels=0|1&variants=<ids>&sound=0|1`)
// used to record docs/M2-MEASUREMENTS.md .. docs/M9-MEASUREMENTS.md.
if (isBenchmark) {
  const requestedVariants = params.get('variants');
  if (requestedVariants !== null && requestedVariants !== '') {
    for (const rawId of requestedVariants.split(',')) {
      const variantId = rawId.trim();
      if (!variantId) continue;
      const slot = slotForVariantId(variantId, fullCatalog);
      if (slot) {
        ui.setBuildSelection(slot, variantId);
      }
    }
  }
  const requestedQuality = params.get('quality');
  if (requestedQuality === 'auto' || requestedQuality === 'full' || requestedQuality === 'phone') {
    ui.setQualityMode(requestedQuality as UiQualityMode);
  }
  const requestedExterior = params.get('exterior');
  if (requestedExterior === '1' || requestedExterior === '0') {
    ui.setExteriorChecked(requestedExterior === '1');
  }
  const requestedExplode = params.get('explode');
  if (requestedExplode !== null && requestedExplode !== '') {
    const parsedExplode = Number(requestedExplode);
    if (Number.isFinite(parsedExplode)) {
      ui.setExplodePercent(parsedExplode);
    }
  }
  const requestedSection = params.get('section')?.toLowerCase();
  if (requestedSection === 'off' || requestedSection === 'x' || requestedSection === 'y') {
    ui.setSectionMode(requestedSection as UiSectionMode);
  }
  const requestedSectionPos = params.get('sectionPos');
  if (requestedSectionPos !== null && requestedSectionPos !== '') {
    const parsedSectionPos = Number(requestedSectionPos);
    if (Number.isFinite(parsedSectionPos)) {
      ui.setSectionPositionMm(parsedSectionPos);
    }
  }
  const requestedXray = params.get('xray');
  if (requestedXray === '1' || requestedXray === '0') {
    ui.setXrayChecked(requestedXray === '1');
  }
  const requestedLabels = params.get('labels');
  if (requestedLabels === '1' || requestedLabels === '0') {
    ui.setLabelsChecked(requestedLabels === '1');
  }

  const requestedSound = params.get('sound') === '1';
  let benchmarkAudioSettled = !requestedSound;
  if (requestedSound) {
    runSoundToggle(true, () => {
      benchmarkAudioSettled = true;
    });
  }

  const readout = document.createElement('pre');
  readout.id = 'm2-benchmark-result';
  readout.style.cssText =
    'position:fixed;top:12px;left:12px;z-index:50;margin:0;padding:10px 12px;' +
    'background:rgba(11,11,13,0.92);border:1px solid #334155;border-radius:8px;' +
    'color:#e2e8f0;font:11px/1.45 ui-monospace,monospace;max-width:460px;white-space:pre-wrap;';
  readout.textContent = 'STATUS: WAITING_FOR_ASSETS';
  document.body.appendChild(readout);

  let warmupFrames = 0;
  let startTimeMs: number | null = null;
  let prevFrameMs: number | null = null;
  const frameDeltasMs: number[] = [];
  let audioUpdateResult:
    | { iterations: number; totalMs: number; usPerCall: number }
    | undefined;

  const sampleFrame = (nowMs: number): void => {
    const stats = scene.getRenderStats();
    if (
      !stats.detailedLoaded ||
      !stats.hdriLoaded ||
      !stats.exteriorLoaded ||
      !stats.variantsLoaded ||
      !benchmarkAudioSettled
    ) {
      requestAnimationFrame(sampleFrame);
      return;
    }

    if (warmupFrames < 60) {
      warmupFrames += 1;
      readout.textContent = `STATUS: WARMUP (${warmupFrames}/60)`;
      prevFrameMs = nowMs;
      requestAnimationFrame(sampleFrame);
      return;
    }

    if (startTimeMs === null) {
      if (requestedSound) {
        const preStatus = audio.getStatus();
        if (
          preStatus.contextState === 'running' &&
          preStatus.audible &&
          lastSteadyState !== null
        ) {
          const iterations = 100;
          const batchT0 = performance.now();
          for (let i = 0; i < iterations; i += 1) {
            audio.update(lastSteadyState, lastSteadyPlayback);
          }
          const totalMs = performance.now() - batchT0;
          audioUpdateResult = {
            iterations,
            totalMs: +totalMs.toFixed(4),
            usPerCall: +((totalMs * 1000) / iterations).toFixed(3),
          };
        } else {
          audioUpdateResult = { iterations: 0, totalMs: 0, usPerCall: 0 };
        }
      }
      const resetMs = performance.now();
      startTimeMs = resetMs;
      prevFrameMs = resetMs;
      cpuRenderSamplesMs.length = 0;
      requestAnimationFrame(sampleFrame);
      return;
    }

    const dt = nowMs - (prevFrameMs ?? nowMs);
    prevFrameMs = nowMs;
    frameDeltasMs.push(dt);

    const elapsedMs = nowMs - startTimeMs;
    if (elapsedMs < 10_000) {
      readout.textContent = `STATUS: MEASURING (${(elapsedMs / 1000).toFixed(1)}s / 10.0s)`;
      requestAnimationFrame(sampleFrame);
      return;
    }

    const sorted = [...frameDeltasMs].sort((a, b) => a - b);
    const count = sorted.length;
    const sumMs = frameDeltasMs.reduce((acc, v) => acc + v, 0);
    const avgMs = count > 0 ? sumMs / count : 0;
    const p50Ms = count > 0 ? sorted[Math.floor(count * 0.5)]! : 0;
    const p95Ms = count > 0 ? sorted[Math.min(count - 1, Math.floor(count * 0.95))]! : 0;
    const minMs = count > 0 ? sorted[0]! : 0;
    const maxMs = count > 0 ? sorted[count - 1]! : 0;
    const droppedFrames =
      count > 0 ? frameDeltasMs.filter((delta) => delta > 1.5 * p50Ms).length : 0;

    const sortedCpu = [...cpuRenderSamplesMs].sort((a, b) => a - b);
    const cpuCount = sortedCpu.length;
    const avgCpuMs =
      cpuCount > 0 ? cpuRenderSamplesMs.reduce((acc, v) => acc + v, 0) / cpuCount : 0;
    const p95CpuMs =
      cpuCount > 0 ? sortedCpu[Math.min(cpuCount - 1, Math.floor(cpuCount * 0.95))]! : 0;

    const soundParams = audio.getParameters();
    const soundSummary = {
      ...audio.getStatus(),
      nodeCount: audio.getStats().nodeCount,
      ...(requestedSound
        ? {
            firingHz: +soundParams.firingHz.toFixed(3),
            boost01: +soundParams.boost01.toFixed(6),
            load01: +soundParams.load01.toFixed(6),
            whistleHz: +soundParams.whistleHz.toFixed(3),
            whistleGain: +soundParams.whistleGain.toFixed(6),
            masterGain: +soundParams.masterGain.toFixed(3),
          }
        : {}),
    };

    readout.textContent = JSON.stringify(
      {
        status: 'DONE',
        elapsedMs: +elapsedMs.toFixed(2),
        frameCount: count,
        avgFrameTimeMs: +avgMs.toFixed(3),
        p50FrameTimeMs: +p50Ms.toFixed(3),
        p95FrameTimeMs: +p95Ms.toFixed(3),
        minFrameTimeMs: +minMs.toFixed(3),
        maxFrameTimeMs: +maxMs.toFixed(3),
        droppedFrames,
        avgFps: +(1000 / avgMs).toFixed(2),
        avgCpuRenderMs: +avgCpuMs.toFixed(3),
        p95CpuRenderMs: +p95CpuMs.toFixed(3),
        sound: soundSummary,
        ...(requestedSound ? { audioUpdate: audioUpdateResult } : {}),
        renderInfo: stats,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio,
        effectivePixelRatio: stats.effectivePixelRatio,
        gpuRenderer: scene.getGpuRenderer(),
        userAgent: navigator.userAgent,
      },
      null,
      2,
    );
  };

  requestAnimationFrame(sampleFrame);
}
