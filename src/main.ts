// Application entry point for Duramax LLY Engine Lab (Milestone 6: Parts Catalog & Build Comparison).

import { fullCatalog } from './catalog';
import { detailConfig } from './config/detailConfig';
import { engineConfig, stockRatings } from './config/engineConfig';
import { valveConfig } from './config/valveConfig';
import type { Build } from './core/interfaces';
import { computeCurve, computeDetails, stockBuild } from './perf';
import { createEngineScene } from './renderer/engineScene';
import {
  mountEngineUi,
  type EngineUiHandle,
  type UiQualityMode,
  type UiSectionMode,
} from './ui/engineControls';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Missing #app container element.');
}

const scene = createEngineScene(container, engineConfig, valveConfig, detailConfig);

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

const refreshLabelsIfEnabled = (): void => {
  if (labelsEnabled && uiRef) {
    uiRef.updateLabels(scene.projectLabelAnchors(window.innerWidth, window.innerHeight));
  }
};

const ui = mountEngineUi(
  engineConfig,
  valveConfig,
  (state) => {
    if (isBenchmark) {
      const t0 = performance.now();
      scene.update(state);
      refreshLabelsIfEnabled();
      cpuRenderSamplesMs.push(performance.now() - t0);
    } else {
      scene.update(state);
      refreshLabelsIfEnabled();
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

(
  window as unknown as {
    __engineScene?: typeof scene;
    __engineUi?: typeof ui;
  }
).__engineScene = scene;
(
  window as unknown as {
    __engineScene?: typeof scene;
    __engineUi?: typeof ui;
  }
).__engineUi = ui;

interface ReferenceFrameDef {
  thetaDeg: number;
  position: [number, number, number];
  target: [number, number, number];
  exterior: boolean;
  explodePercent?: number;
  sectionMode?: UiSectionMode;
  sectionPositionMm?: number;
  xray?: boolean;
  labels?: boolean;
}

const REFERENCE_FRAME_DEFS: Record<string, ReferenceFrameDef> = {
  'RF-1': {
    thetaDeg: 0,
    position: [1.01, -0.78, 0.56],
    target: [0.25, -0.01, 0.12],
    exterior: false,
  },
  'RF-2': {
    thetaDeg: 470,
    position: [0.66, -0.38, 0.56],
    target: [0.4025, -0.2, 0.255],
    exterior: false,
  },
  'RF-3': {
    thetaDeg: 180,
    position: [1.38, -1.18, 0.72],
    target: [0.3, -0.02, 0.17],
    exterior: true,
  },
  'RF-4': {
    thetaDeg: 705,
    position: [0.23, -0.002, 1.18],
    target: [0.23, 0.0, 0.14],
    exterior: false,
  },
  'RF-5': {
    thetaDeg: 90,
    position: [1.28, -1.08, 0.74],
    target: [0.31, -0.05, 0.18],
    exterior: false,
    explodePercent: 100,
    labels: true,
  },
  'RF-6': {
    thetaDeg: 0,
    position: [1.06, -0.54, 0.48],
    target: [0.29, -0.02, 0.14],
    exterior: false,
    explodePercent: 0,
    sectionMode: 'x',
    sectionPositionMm: 402.5,
  },
  'RF-7': {
    thetaDeg: 180,
    position: [1.38, -1.18, 0.72],
    target: [0.3, -0.02, 0.17],
    exterior: true,
    explodePercent: 0,
    xray: true,
  },
};

const applyReferenceFrame = (frameId: string): boolean => {
  const def = REFERENCE_FRAME_DEFS[frameId];
  if (!def) return false;
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

const requestedRf = params.get('rf')?.toUpperCase() ?? null;
if (requestedRf) {
  applyReferenceFrame(requestedRf);
}

// Opt-in 10-second @ 900 RPM telemetry probe (`?benchmark=1`, plus optional
// `&quality=full|phone&exterior=0|1&explode=0..100&section=off|x|y&sectionPos=<mm>&xray=0|1&labels=0|1`)
// used to record docs/M2-MEASUREMENTS.md, docs/M3-MEASUREMENTS.md, and docs/M4-MEASUREMENTS.md.
if (isBenchmark) {
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

  const sampleFrame = (nowMs: number): void => {
    const stats = scene.getRenderStats();
    if (!stats.detailedLoaded || !stats.hdriLoaded || !stats.exteriorLoaded) {
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
      startTimeMs = nowMs;
      prevFrameMs = nowMs;
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

    const sortedCpu = [...cpuRenderSamplesMs].sort((a, b) => a - b);
    const cpuCount = sortedCpu.length;
    const avgCpuMs =
      cpuCount > 0 ? cpuRenderSamplesMs.reduce((acc, v) => acc + v, 0) / cpuCount : 0;
    const p95CpuMs =
      cpuCount > 0 ? sortedCpu[Math.min(cpuCount - 1, Math.floor(cpuCount * 0.95))]! : 0;

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
        avgFps: +(1000 / avgMs).toFixed(2),
        avgCpuRenderMs: +avgCpuMs.toFixed(3),
        p95CpuRenderMs: +p95CpuMs.toFixed(3),
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
