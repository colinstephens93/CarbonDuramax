// Plain-DOM UI controls, readouts, illustrative caption, and rAF loop for Milestone 1 (D-007, D-012).
// Never imports Three.js; drives the renderer through a callback receiving CrankState.

import type { ValveConfig } from '../config/valveConfig';
import type { CrankState, CylinderId, EngineConfig } from '../core/interfaces';
import { computeState, phaseOffsetDeg } from '../core/kinematics';

const CYLINDERS: readonly CylinderId[] = [1, 2, 3, 4, 5, 6, 7, 8];
const SPEED_OPTIONS = [
  { multiplier: 1, label: '1×' },
  { multiplier: 0.1, label: '0.1×' },
  { multiplier: 0.01, label: '0.01×' },
] as const;

type SpeedMultiplier = (typeof SPEED_OPTIONS)[number]['multiplier'];

function normalizeAngle720(deg: number): number {
  const remainder = deg % 720;
  if (remainder === 0) {
    return 0;
  }
  if (remainder < 0) {
    const shifted = remainder + 720;
    return shifted >= 720 ? 720 - Number.EPSILON * 720 : shifted;
  }
  return remainder;
}

function findFiringCylinder(config: EngineConfig, normalizedThetaDeg: number): CylinderId {
  for (const cyl of CYLINDERS) {
    const localAngleDeg = normalizeAngle720(normalizedThetaDeg - phaseOffsetDeg(config, cyl));
    if (localAngleDeg >= 0 && localAngleDeg < 90) {
      return cyl;
    }
  }
  return (config.firingOrder[0] as CylinderId | undefined) ?? 1;
}

function formatEffectiveRpm(effectiveRpm: number): string {
  if (Number.isInteger(effectiveRpm)) {
    return String(effectiveRpm);
  }
  return effectiveRpm >= 10 ? effectiveRpm.toFixed(1) : effectiveRpm.toFixed(2);
}

function injectStyles(): void {
  if (document.getElementById('m1-ui-styles')) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'm1-ui-styles';
  style.textContent = `
    #m1-control-panel {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 20;
      width: min(340px, calc(100vw - 32px));
      padding: 14px 16px;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.22);
      backdrop-filter: blur(10px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
      color: #e2e8f0;
      font-size: 13px;
      user-select: none;
    }
    .m1-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }
    .m1-play-btn {
      padding: 7px 16px;
      border-radius: 7px;
      border: 1px solid rgba(56, 189, 248, 0.45);
      background: rgba(14, 116, 144, 0.45);
      color: #f8fafc;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .m1-play-btn:hover {
      background: rgba(14, 116, 144, 0.7);
      border-color: rgba(56, 189, 248, 0.8);
    }
    .m1-speed-group {
      display: inline-flex;
      border-radius: 7px;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.28);
      background: rgba(15, 23, 42, 0.7);
    }
    .m1-speed-btn {
      padding: 6px 10px;
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .m1-speed-btn + .m1-speed-btn {
      border-left: 1px solid rgba(148, 163, 184, 0.22);
    }
    .m1-speed-btn[aria-pressed="true"] {
      background: rgba(59, 130, 246, 0.35);
      color: #f8fafc;
    }
    .m1-control-group {
      margin-bottom: 12px;
    }
    .m1-label-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
      font-size: 12px;
      color: #cbd5e1;
    }
    .m1-slider {
      width: 100%;
      margin: 0;
      accent-color: #38bdf8;
      cursor: pointer;
    }
    .m1-readout-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 4px;
    }
    .m1-readout-card {
      padding: 7px 9px;
      border-radius: 8px;
      background: rgba(30, 41, 59, 0.65);
      border: 1px solid rgba(148, 163, 184, 0.14);
    }
    .m1-readout-title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .m1-readout-value {
      font-size: 13px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: #f8fafc;
    }
    .m1-firing-value {
      color: #fb923c;
    }
    #m1-illustrative-caption {
      position: fixed;
      left: 20px;
      bottom: 16px;
      z-index: 20;
      max-width: min(560px, calc(100vw - 40px));
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.82);
      border: 1px solid rgba(251, 191, 36, 0.32);
      color: #fde68a;
      font-size: 12px;
      line-height: 1.4;
      pointer-events: none;
    }
    @media (max-width: 640px) {
      #m1-control-panel {
        top: auto;
        bottom: 68px;
        right: 12px;
        left: 12px;
        width: auto;
      }
      #m1-illustrative-caption {
        left: 12px;
        right: 12px;
        bottom: 10px;
        max-width: none;
        font-size: 11px;
      }
    }
  `;
  document.head.appendChild(style);
}

export interface EngineUiHandle {
  dispose(): void;
}

export function mountEngineUi(
  config: EngineConfig,
  valves: ValveConfig,
  onState: (state: CrankState) => void,
): EngineUiHandle {
  injectStyles();

  const bannerSubtitle = document.querySelector('#title-banner p');
  if (bannerSubtitle) {
    bannerSubtitle.textContent = 'Milestone 2 — Cylinder 1 Detailed Assembly + Draft Studio Look';
  }

  let isPlaying = true;
  let rpm = 900;
  let speedMultiplier: SpeedMultiplier = 1;
  let crankAngleDeg = 0;
  let isScrubbing = false;

  const panel = document.createElement('section');
  panel.id = 'm1-control-panel';
  panel.setAttribute('aria-label', 'Engine kinematic controls');

  // Top row: Play/Pause + Slow-motion selector (1x / 0.1x / 0.01x)
  const topRow = document.createElement('div');
  topRow.className = 'm1-row';

  const playPauseBtn = document.createElement('button');
  playPauseBtn.type = 'button';
  playPauseBtn.className = 'm1-play-btn';
  playPauseBtn.textContent = 'Pause';

  const speedGroup = document.createElement('div');
  speedGroup.className = 'm1-speed-group';
  speedGroup.setAttribute('role', 'group');
  speedGroup.setAttribute('aria-label', 'Slow-motion speed selector');

  const speedButtons: HTMLButtonElement[] = [];
  for (const option of SPEED_OPTIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'm1-speed-btn';
    btn.textContent = option.label;
    btn.setAttribute('aria-pressed', String(option.multiplier === speedMultiplier));
    btn.addEventListener('click', () => {
      speedMultiplier = option.multiplier;
      for (let i = 0; i < SPEED_OPTIONS.length; i += 1) {
        speedButtons[i]?.setAttribute(
          'aria-pressed',
          String(SPEED_OPTIONS[i]?.multiplier === speedMultiplier),
        );
      }
      renderReadouts(crankAngleDeg, rpm);
    });
    speedButtons.push(btn);
    speedGroup.appendChild(btn);
  }

  topRow.append(playPauseBtn, speedGroup);

  // Throttle / RPM slider (650-3200, default 900)
  const rpmGroup = document.createElement('div');
  rpmGroup.className = 'm1-control-group';

  const rpmLabelRow = document.createElement('div');
  rpmLabelRow.className = 'm1-label-row';
  const rpmLabel = document.createElement('label');
  rpmLabel.htmlFor = 'm1-rpm-slider';
  rpmLabel.textContent = 'Throttle (RPM)';
  const rpmInlineValue = document.createElement('span');
  rpmInlineValue.textContent = `${rpm} RPM`;
  rpmLabelRow.append(rpmLabel, rpmInlineValue);

  const rpmSlider = document.createElement('input');
  rpmSlider.id = 'm1-rpm-slider';
  rpmSlider.className = 'm1-slider';
  rpmSlider.type = 'range';
  rpmSlider.min = '650';
  rpmSlider.max = '3200';
  rpmSlider.step = '1';
  rpmSlider.value = String(rpm);

  rpmGroup.append(rpmLabelRow, rpmSlider);

  // Crank-angle scrubber (0-720 deg)
  const scrubGroup = document.createElement('div');
  scrubGroup.className = 'm1-control-group';

  const scrubLabelRow = document.createElement('div');
  scrubLabelRow.className = 'm1-label-row';
  const scrubLabel = document.createElement('label');
  scrubLabel.htmlFor = 'm1-crank-scrubber';
  scrubLabel.textContent = 'Crank-Angle Scrubber (0–720°)';
  const scrubInlineValue = document.createElement('span');
  scrubInlineValue.textContent = '0.0°';
  scrubLabelRow.append(scrubLabel, scrubInlineValue);

  const scrubSlider = document.createElement('input');
  scrubSlider.id = 'm1-crank-scrubber';
  scrubSlider.className = 'm1-slider';
  scrubSlider.type = 'range';
  scrubSlider.min = '0';
  scrubSlider.max = '720';
  scrubSlider.step = '0.5';
  scrubSlider.value = '0';

  scrubGroup.append(scrubLabelRow, scrubSlider);

  // Readout cards: Crank Angle, RPM, Effective Speed, Firing Cylinder
  const readoutGrid = document.createElement('div');
  readoutGrid.className = 'm1-readout-grid';

  const createReadoutCard = (title: string, extraValueClass = ''): HTMLElement => {
    const card = document.createElement('div');
    card.className = 'm1-readout-card';
    const heading = document.createElement('div');
    heading.className = 'm1-readout-title';
    heading.textContent = title;
    const val = document.createElement('div');
    val.className = extraValueClass ? `m1-readout-value ${extraValueClass}` : 'm1-readout-value';
    card.append(heading, val);
    readoutGrid.appendChild(card);
    return val;
  };

  const crankAngleReadout = createReadoutCard('Crank Angle');
  const rpmReadout = createReadoutCard('RPM');
  const effectiveSpeedReadout = createReadoutCard('Effective Speed');
  const firingCylReadout = createReadoutCard('Firing Cylinder', 'm1-firing-value');

  panel.append(topRow, rpmGroup, scrubGroup, readoutGrid);
  document.body.appendChild(panel);

  // On-screen illustrative caption (required by D-012, M1 Deliverable 4, and M2 Draft Studio Look)
  const caption = document.createElement('div');
  caption.id = 'm1-illustrative-caption';
  caption.textContent =
    'Illustrative geometry, part shapes & timing: Detailed Cylinder 1 part shapes (piston bowl/rings, rod, crank throw, head section, valves, springs, bridges, rockers, pushrods, lifters, injector), valve timing/lift profiles, and placeholder dimensions are illustrative placeholders, not verified LLY measurements.';
  document.body.appendChild(caption);

  const updatePlayButtonLabel = (): void => {
    playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
  };

  const renderReadouts = (normalizedThetaDeg: number, currentRpm: number): void => {
    const angleText = `${normalizedThetaDeg.toFixed(1)}°`;
    crankAngleReadout.textContent = angleText;
    scrubInlineValue.textContent = angleText;
    if (!isScrubbing) {
      scrubSlider.value = String(normalizedThetaDeg);
    }

    const rpmText = `${currentRpm} RPM`;
    rpmInlineValue.textContent = rpmText;
    rpmReadout.textContent = rpmText;

    const speedObj = SPEED_OPTIONS.find((o) => o.multiplier === speedMultiplier) ?? SPEED_OPTIONS[0];
    if (isPlaying) {
      const effectiveRpm = currentRpm * speedMultiplier;
      effectiveSpeedReadout.textContent = `${formatEffectiveRpm(effectiveRpm)} RPM (${speedObj.label})`;
    } else {
      effectiveSpeedReadout.textContent = `Paused (${speedObj.label})`;
    }

    const firingCyl = findFiringCylinder(config, normalizedThetaDeg);
    const bank = config.bankAssignment[firingCyl];
    firingCylReadout.textContent = `Cyl ${firingCyl} (${bank})`;
  };

  playPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    updatePlayButtonLabel();
    renderReadouts(crankAngleDeg, rpm);
  });

  rpmSlider.addEventListener('input', () => {
    rpm = Number(rpmSlider.value);
    renderReadouts(crankAngleDeg, rpm);
  });

  const pauseAndScrub = (): void => {
    isPlaying = false;
    updatePlayButtonLabel();
    crankAngleDeg = normalizeAngle720(Number(scrubSlider.value));
    renderReadouts(crankAngleDeg, rpm);
  };

  scrubSlider.addEventListener('pointerdown', () => {
    isScrubbing = true;
    pauseAndScrub();
  });

  const endScrub = (): void => {
    if (isScrubbing) {
      isScrubbing = false;
    }
  };
  window.addEventListener('pointerup', endScrub);
  window.addEventListener('pointercancel', endScrub);

  scrubSlider.addEventListener('input', () => {
    pauseAndScrub();
  });

  // Render initial readouts immediately before the first rAF callback fires.
  renderReadouts(crankAngleDeg, rpm);

  // Animation loop in UI layer: advances theta by rpm * 6 * dt * speedMultiplier degrees.
  let rafId = 0;
  let prevNowMs: number | null = null;

  const tick = (nowMs: number): void => {
    rafId = requestAnimationFrame(tick);

    const rawDtSec = prevNowMs === null ? 0 : (nowMs - prevNowMs) / 1000;
    prevNowMs = nowMs;
    const dtSec = Math.max(0, Math.min(rawDtSec, 0.1));

    if (isPlaying && dtSec > 0) {
      crankAngleDeg = normalizeAngle720(crankAngleDeg + rpm * 6 * dtSec * speedMultiplier);
    }

    const state = computeState(config, crankAngleDeg, rpm, valves);
    onState(state);
    renderReadouts(state.crankAngleDeg, state.rpm);
  };

  rafId = requestAnimationFrame(tick);

  const dispose = (): void => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('pointerup', endScrub);
    window.removeEventListener('pointercancel', endScrub);
    panel.remove();
    caption.remove();
  };

  return { dispose };
}
