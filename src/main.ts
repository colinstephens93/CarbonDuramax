// Application entry point for Duramax LLY Engine Lab (Milestone 2: One Detailed Cylinder + Draft Studio Look).

import { detailConfig } from './config/detailConfig';
import { engineConfig } from './config/engineConfig';
import { valveConfig } from './config/valveConfig';
import { createEngineScene } from './renderer/engineScene';
import { mountEngineUi } from './ui/engineControls';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Missing #app container element.');
}

const scene = createEngineScene(container, engineConfig, valveConfig, detailConfig);
(window as unknown as { __engineScene?: typeof scene }).__engineScene = scene;

const isBenchmark = new URLSearchParams(window.location.search).get('benchmark') === '1';
const cpuRenderSamplesMs: number[] = [];

mountEngineUi(engineConfig, valveConfig, (state) => {
  if (isBenchmark) {
    const t0 = performance.now();
    scene.update(state);
    cpuRenderSamplesMs.push(performance.now() - t0);
  } else {
    scene.update(state);
  }
});

// Opt-in 10-second @ 900 RPM telemetry probe (`?benchmark=1`) used to record docs/M2-MEASUREMENTS.md.
// Inactive during normal viewing (zero extra UI elements).
if (isBenchmark) {
  const readout = document.createElement('pre');
  readout.id = 'm2-benchmark-result';
  readout.style.cssText =
    'position:fixed;top:12px;right:12px;z-index:50;margin:0;padding:10px 12px;' +
    'background:rgba(11,11,13,0.92);border:1px solid #334155;border-radius:8px;' +
    'color:#e2e8f0;font:11px/1.45 ui-monospace,monospace;max-width:440px;white-space:pre-wrap;';
  readout.textContent = 'STATUS: WAITING_FOR_ASSETS';
  document.body.appendChild(readout);

  let warmupFrames = 0;
  let startTimeMs: number | null = null;
  let prevFrameMs: number | null = null;
  const frameDeltasMs: number[] = [];

  const sampleFrame = (nowMs: number): void => {
    const stats = scene.getRenderStats();
    if (!stats.detailedLoaded || !stats.hdriLoaded) {
      requestAnimationFrame(sampleFrame);
      return;
    }

    if (warmupFrames < 30) {
      warmupFrames += 1;
      readout.textContent = `STATUS: WARMUP (${warmupFrames}/30)`;
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
        effectivePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        gpuRenderer: scene.getGpuRenderer(),
        userAgent: navigator.userAgent,
      },
      null,
      2,
    );
  };

  requestAnimationFrame(sampleFrame);
}
