// Plain-DOM UI controls, readouts, Exterior & Quality controls, Milestone 4 Views group,
// Milestone 5 Dyno section, illustrative caption, and rAF loop
// (D-007, D-012, D-013, D-015, D-034; docs/specs/M4-views.md §§3–8, docs/specs/M5-performance.md §5).
// Never imports Three.js; drives the renderer strictly through callbacks.

import type { ValveConfig } from '../config/valveConfig';
import type { CrankState, CylinderId, EngineConfig } from '../core/interfaces';
import { computeState, phaseOffsetDeg } from '../core/kinematics';
import type { DynoPointDetail } from '../perf/model';
import { createDynoSection, type DynoSectionHandle, type DynoUiData } from './dynoChart';

export type UiQualityMode = 'auto' | 'full' | 'phone';
export type UiSectionMode = 'off' | 'x' | 'y';

export interface UiProjectedLabel {
  readonly id: string;
  readonly text: string;
  readonly xPx: number;
  readonly yPx: number;
  readonly visible: boolean;
}

const CYLINDERS: readonly CylinderId[] = [1, 2, 3, 4, 5, 6, 7, 8];
const SPEED_OPTIONS = [
  { multiplier: 1, label: '1×' },
  { multiplier: 0.1, label: '0.1×' },
  { multiplier: 0.01, label: '0.01×' },
] as const;

const QUALITY_OPTIONS: ReadonlyArray<{ value: UiQualityMode; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'full', label: 'Full' },
  { value: 'phone', label: 'Phone' },
];

const SECTION_OPTIONS: ReadonlyArray<{ value: UiSectionMode; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: 'x', label: 'Front–Back (X)' },
  { value: 'y', label: 'Side (Y)' },
];

const UI_SECTION_RANGES_MM: Readonly<
  Record<'x' | 'y', { minMm: number; maxMm: number; defaultMm: number; stepMm: number }>
> = {
  x: { minMm: -150, maxMm: 900, defaultMm: 900, stepMm: 0.5 },
  y: { minMm: -580, maxMm: 580, defaultMm: 580, stepMm: 0.5 },
};

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

function formatMmValue(mm: number): string {
  return Number.isInteger(mm) ? `${mm} mm` : `${mm.toFixed(1)} mm`;
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
      width: min(360px, calc(100vw - 32px));
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      box-sizing: border-box;
      padding: 13px 15px;
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
      margin-bottom: 10px;
    }
    .m1-play-btn {
      padding: 6px 15px;
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
      margin-bottom: 10px;
    }
    .m1-label-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 3px;
      font-size: 12px;
      color: #cbd5e1;
    }
    .m1-slider {
      width: 100%;
      margin: 0;
      accent-color: #38bdf8;
      cursor: pointer;
    }
    .m1-slider:disabled {
      opacity: 0.42;
      cursor: not-allowed;
    }
    .m3-options-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 7px 10px;
      margin-bottom: 10px;
      border-radius: 8px;
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.16);
    }
    .m3-checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      font-weight: 600;
      color: #e2e8f0;
      cursor: pointer;
    }
    .m3-checkbox-label input {
      width: 15px;
      height: 15px;
      margin: 0;
      accent-color: #38bdf8;
      cursor: pointer;
    }
    .m3-quality-wrap {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #cbd5e1;
    }
    .m3-quality-select {
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.32);
      background: rgba(15, 23, 42, 0.9);
      color: #f8fafc;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .m4-views-group {
      padding: 9px 10px;
      margin-bottom: 10px;
      border-radius: 8px;
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .m4-views-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      margin-bottom: 7px;
    }
    .m4-view-item {
      margin-bottom: 8px;
    }
    .m4-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 5px;
      font-size: 12px;
      color: #cbd5e1;
    }
    .m4-toggles-row {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-top: 6px;
      margin-bottom: 6px;
    }
    .m4-cutaway-note {
      margin: 0;
      font-size: 10.5px;
      line-height: 1.35;
      color: #94a3b8;
    }
    .m5-dyno-group {
      padding: 9px 10px;
      margin-bottom: 10px;
      border-radius: 8px;
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .m5-dyno-header {
      font-size: 11.5px;
      font-weight: 600;
      color: #e2e8f0;
      margin-bottom: 6px;
    }
    .m5-dyno-svg {
      display: block;
      width: 100%;
      height: 190px;
      cursor: crosshair;
      touch-action: none;
    }
    .m5-svg-marker-label {
      paint-order: stroke;
      stroke: rgba(15, 23, 42, 0.92);
      stroke-width: 2.8px;
      stroke-linejoin: round;
    }
    .m5-dyno-peaks {
      margin-top: 6px;
      margin-bottom: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.62);
      border: 1px solid rgba(148, 163, 184, 0.14);
    }
    .m5-dyno-peak-line {
      font-size: 10.75px;
      line-height: 1.45;
      color: #e2e8f0;
      font-variant-numeric: tabular-nums;
    }
    .m5-dyno-inspector {
      padding-top: 7px;
      border-top: 1px solid rgba(148, 163, 184, 0.16);
      margin-bottom: 7px;
    }
    .m5-inspector-rpm-val {
      font-weight: 600;
      color: #f8fafc;
      font-variant-numeric: tabular-nums;
    }
    .m5-inspector-limit-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-top: 6px;
      margin-bottom: 6px;
      font-size: 11.5px;
      line-height: 1.35;
    }
    .m5-inspector-limit-title {
      color: #94a3b8;
      flex-shrink: 0;
    }
    .m5-inspector-limit-val {
      font-weight: 600;
    }
    .m5-inspector-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px;
    }
    .m5-inspector-cell {
      display: flex;
      flex-direction: column;
      padding: 4px 6px;
      border-radius: 5px;
      background: rgba(15, 23, 42, 0.58);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    .m5-inspector-key {
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #94a3b8;
    }
    .m5-inspector-val {
      font-size: 11.5px;
      font-weight: 600;
      color: #f8fafc;
      font-variant-numeric: tabular-nums;
    }
    .m5-dyno-footnote {
      margin: 0;
      font-size: 10.5px;
      line-height: 1.35;
      color: #94a3b8;
    }
    .m1-readout-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 2px;
    }
    .m1-readout-card {
      padding: 6px 9px;
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
    #labels-layer {
      position: fixed;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 10;
    }
    .m4-label-chip {
      position: absolute;
      left: 0;
      top: 0;
      padding: 2px 7px;
      border-radius: 5px;
      background: rgba(15, 23, 42, 0.84);
      border: 1px solid rgba(148, 163, 184, 0.34);
      color: #e2e8f0;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.3;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      will-change: transform;
    }
    .m4-label-chip.m4-label-cyl {
      padding: 1px 5px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.88);
      border-color: rgba(56, 189, 248, 0.44);
      color: #7dd3fc;
      font-size: 10px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    #title-banner,
    #m1-illustrative-caption {
      user-select: none;
    }
    #m1-illustrative-caption {
      position: fixed;
      left: 20px;
      bottom: 16px;
      z-index: 20;
      max-width: min(600px, calc(100vw - 40px));
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
        max-height: 52vh;
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

export interface EngineUiOptions {
  onExteriorChange?: (visible: boolean) => void;
  onQualityChange?: (mode: UiQualityMode) => void;
  onExplodeChange?: (explodeFactor: number) => void;
  onSectionChange?: (mode: UiSectionMode, positionMm: number) => void;
  onXrayChange?: (enabled: boolean) => void;
  onLabelsChange?: (enabled: boolean) => void;
  dyno?: DynoUiData;
}

export interface EngineUiHandle {
  setCrankAngleDeg(deg: number): void;
  setPlaying(playing: boolean): void;
  setExteriorChecked(checked: boolean): void;
  setQualityMode(mode: UiQualityMode): void;
  setExplodePercent(percent: number): void;
  setSectionMode(mode: UiSectionMode): void;
  setSectionPositionMm(posMm: number): void;
  setXrayChecked(checked: boolean): void;
  setLabelsChecked(checked: boolean): void;
  updateLabels(labels: readonly UiProjectedLabel[]): void;
  setDynoInspectorRpm(rpm: number): void;
  getDynoSelectedPoint(): DynoPointDetail | null;
  dispose(): void;
}

export function mountEngineUi(
  config: EngineConfig,
  valves: ValveConfig,
  onState: (state: CrankState) => void,
  options?: EngineUiOptions,
): EngineUiHandle {
  injectStyles();

  const bannerSubtitle = document.querySelector('#title-banner p');
  if (bannerSubtitle) {
    bannerSubtitle.textContent = 'Milestone 5 — Performance Model & Dyno';
  }

  let isPlaying = true;
  let rpm = 900;
  let speedMultiplier: SpeedMultiplier = 1;
  let crankAngleDeg = 0;
  let isScrubbing = false;

  // Milestone 4 view states (defaults per Spec §7)
  let sectionMode: UiSectionMode = 'off';
  let sectionPositionMm = UI_SECTION_RANGES_MM.x.defaultMm;
  let labelsChecked = false;

  // Fixed overlay layer at z-index 10 (canvas below, control panel at 20 above it, Spec §6)
  let createdLabelsLayer = false;
  let labelsLayer = document.getElementById('labels-layer');
  if (!labelsLayer) {
    labelsLayer = document.createElement('div');
    labelsLayer.id = 'labels-layer';
    labelsLayer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(labelsLayer);
    createdLabelsLayer = true;
  }
  labelsLayer.style.display = 'none';
  const labelNodesById = new Map<string, HTMLDivElement>();

  const panel = document.createElement('section');
  panel.id = 'm1-control-panel';
  panel.setAttribute('aria-label', 'Engine kinematic and view controls');

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

  // Milestone 3 controls row: Exterior checkbox (default unchecked) + Quality selector (Auto / Full / Phone)
  const optionsRow = document.createElement('div');
  optionsRow.className = 'm3-options-row';

  const exteriorLabel = document.createElement('label');
  exteriorLabel.className = 'm3-checkbox-label';
  exteriorLabel.htmlFor = 'm3-exterior-checkbox';

  const exteriorCheckbox = document.createElement('input');
  exteriorCheckbox.id = 'm3-exterior-checkbox';
  exteriorCheckbox.type = 'checkbox';
  exteriorCheckbox.checked = false;

  const exteriorText = document.createElement('span');
  exteriorText.textContent = 'Exterior';
  exteriorLabel.append(exteriorCheckbox, exteriorText);

  const qualityWrap = document.createElement('div');
  qualityWrap.className = 'm3-quality-wrap';

  const qualityLabel = document.createElement('label');
  qualityLabel.htmlFor = 'm3-quality-select';
  qualityLabel.textContent = 'Quality';

  const qualitySelect = document.createElement('select');
  qualitySelect.id = 'm3-quality-select';
  qualitySelect.className = 'm3-quality-select';
  for (const opt of QUALITY_OPTIONS) {
    const optEl = document.createElement('option');
    optEl.value = opt.value;
    optEl.textContent = opt.label;
    qualitySelect.appendChild(optEl);
  }
  qualitySelect.value = 'auto';
  qualityWrap.append(qualityLabel, qualitySelect);

  optionsRow.append(exteriorLabel, qualityWrap);

  // Milestone 4 Views group (Spec §7 exact order: Explode slider, Section selector + Section position slider,
  // X-Ray checkbox, Labels checkbox, cutaway open-shells note)
  const viewsGroup = document.createElement('div');
  viewsGroup.className = 'm4-views-group';
  viewsGroup.setAttribute('role', 'group');
  viewsGroup.setAttribute('aria-label', 'Views');

  const viewsTitle = document.createElement('div');
  viewsTitle.className = 'm4-views-title';
  viewsTitle.textContent = 'Views';

  // 1. Explode slider (0-100%)
  const explodeWrap = document.createElement('div');
  explodeWrap.className = 'm4-view-item';

  const explodeLabelRow = document.createElement('div');
  explodeLabelRow.className = 'm1-label-row';
  const explodeLabel = document.createElement('label');
  explodeLabel.htmlFor = 'm4-explode-slider';
  explodeLabel.textContent = 'Explode';
  const explodeInlineValue = document.createElement('span');
  explodeInlineValue.textContent = '0%';
  explodeLabelRow.append(explodeLabel, explodeInlineValue);

  const explodeSlider = document.createElement('input');
  explodeSlider.id = 'm4-explode-slider';
  explodeSlider.className = 'm1-slider';
  explodeSlider.type = 'range';
  explodeSlider.min = '0';
  explodeSlider.max = '100';
  explodeSlider.step = '1';
  explodeSlider.value = '0';
  explodeWrap.append(explodeLabelRow, explodeSlider);

  // 2. Section selector + Section position slider
  const sectionWrap = document.createElement('div');
  sectionWrap.className = 'm4-view-item';

  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'm4-section-header';
  const sectionSelectLabel = document.createElement('label');
  sectionSelectLabel.htmlFor = 'm4-section-select';
  sectionSelectLabel.textContent = 'Section';

  const sectionSelect = document.createElement('select');
  sectionSelect.id = 'm4-section-select';
  sectionSelect.className = 'm3-quality-select';
  for (const opt of SECTION_OPTIONS) {
    const optEl = document.createElement('option');
    optEl.value = opt.value;
    optEl.textContent = opt.label;
    sectionSelect.appendChild(optEl);
  }
  sectionSelect.value = 'off';
  sectionHeader.append(sectionSelectLabel, sectionSelect);

  const sectionPosLabelRow = document.createElement('div');
  sectionPosLabelRow.className = 'm1-label-row';
  const sectionPosLabel = document.createElement('label');
  sectionPosLabel.htmlFor = 'm4-section-pos-slider';
  sectionPosLabel.textContent = 'Section position';
  const sectionPosInlineValue = document.createElement('span');
  sectionPosInlineValue.textContent = 'Off';
  sectionPosLabelRow.append(sectionPosLabel, sectionPosInlineValue);

  const sectionPosSlider = document.createElement('input');
  sectionPosSlider.id = 'm4-section-pos-slider';
  sectionPosSlider.className = 'm1-slider';
  sectionPosSlider.type = 'range';
  sectionPosSlider.min = String(UI_SECTION_RANGES_MM.x.minMm);
  sectionPosSlider.max = String(UI_SECTION_RANGES_MM.x.maxMm);
  sectionPosSlider.step = String(UI_SECTION_RANGES_MM.x.stepMm);
  sectionPosSlider.value = String(UI_SECTION_RANGES_MM.x.defaultMm);
  sectionPosSlider.disabled = true;

  sectionWrap.append(sectionHeader, sectionPosLabelRow, sectionPosSlider);

  // 3 & 4. X-Ray checkbox + Labels checkbox
  const viewTogglesRow = document.createElement('div');
  viewTogglesRow.className = 'm4-toggles-row';

  const xrayLabel = document.createElement('label');
  xrayLabel.className = 'm3-checkbox-label';
  xrayLabel.htmlFor = 'm4-xray-checkbox';
  const xrayCheckbox = document.createElement('input');
  xrayCheckbox.id = 'm4-xray-checkbox';
  xrayCheckbox.type = 'checkbox';
  xrayCheckbox.checked = false;
  const xrayText = document.createElement('span');
  xrayText.textContent = 'X-Ray';
  xrayLabel.append(xrayCheckbox, xrayText);

  const labelsToggleLabel = document.createElement('label');
  labelsToggleLabel.className = 'm3-checkbox-label';
  labelsToggleLabel.htmlFor = 'm4-labels-checkbox';
  const labelsCheckbox = document.createElement('input');
  labelsCheckbox.id = 'm4-labels-checkbox';
  labelsCheckbox.type = 'checkbox';
  labelsCheckbox.checked = false;
  const labelsToggleText = document.createElement('span');
  labelsToggleText.textContent = 'Labels';
  labelsToggleLabel.append(labelsCheckbox, labelsToggleText);

  viewTogglesRow.append(xrayLabel, labelsToggleLabel);

  // 5. Cutaway note (exact text per Spec §7)
  const cutawayNote = document.createElement('p');
  cutawayNote.className = 'm4-cutaway-note';
  cutawayNote.textContent = 'Cutaway shows open shells — capped solid sections come later.';

  viewsGroup.append(viewsTitle, explodeWrap, sectionWrap, viewTogglesRow, cutawayNote);

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

  // Milestone 5 Dyno section (below Views, present in both quality tiers; Spec §5)
  const dynoHandle: DynoSectionHandle | null = options?.dyno
    ? createDynoSection(options.dyno)
    : null;

  panel.append(topRow, rpmGroup, scrubGroup, optionsRow, viewsGroup);
  if (dynoHandle) {
    panel.appendChild(dynoHandle.element);
  }
  panel.appendChild(readoutGrid);
  document.body.appendChild(panel);

  // On-screen illustrative caption (unchanged per Spec §7)
  const caption = document.createElement('div');
  caption.id = 'm1-illustrative-caption';
  caption.textContent =
    'Illustrative geometry, part shapes & timing: Detailed part shapes, valve timing/lift profiles, placeholder dimensions, shared-pin crank layout, lifter gallery placement, and the registered exterior shell are illustrative placeholders, not verified LLY measurements.';
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

  const applyExplodePercentInternal = (rawPercent: number): void => {
    const clamped = Number.isFinite(rawPercent)
      ? Math.max(0, Math.min(100, rawPercent))
      : 0;
    explodeSlider.value = String(clamped);
    explodeInlineValue.textContent = `${Math.round(clamped)}%`;
    options?.onExplodeChange?.(clamped / 100);
  };

  const applySectionModeInternal = (mode: UiSectionMode): void => {
    sectionMode = mode;
    sectionSelect.value = mode;
    if (mode === 'off') {
      sectionPosSlider.disabled = true;
      sectionPosInlineValue.textContent = 'Off';
      options?.onSectionChange?.('off', sectionPositionMm);
    } else {
      const range = UI_SECTION_RANGES_MM[mode];
      sectionPositionMm = range.defaultMm;
      sectionPosSlider.min = String(range.minMm);
      sectionPosSlider.max = String(range.maxMm);
      sectionPosSlider.step = String(range.stepMm);
      sectionPosSlider.value = String(range.defaultMm);
      sectionPosSlider.disabled = false;
      sectionPosInlineValue.textContent = formatMmValue(sectionPositionMm);
      options?.onSectionChange?.(mode, sectionPositionMm);
    }
  };

  const applySectionPositionInternal = (rawPosMm: number): void => {
    if (sectionMode === 'off') {
      return;
    }
    const range = UI_SECTION_RANGES_MM[sectionMode];
    const clamped = Number.isFinite(rawPosMm)
      ? Math.max(range.minMm, Math.min(range.maxMm, rawPosMm))
      : range.defaultMm;
    sectionPositionMm = clamped;
    sectionPosSlider.value = String(clamped);
    sectionPosInlineValue.textContent = formatMmValue(clamped);
    options?.onSectionChange?.(sectionMode, clamped);
  };

  const applyXrayCheckedInternal = (checked: boolean): void => {
    xrayCheckbox.checked = checked;
    options?.onXrayChange?.(checked);
  };

  const applyLabelsCheckedInternal = (checked: boolean): void => {
    labelsChecked = checked;
    labelsCheckbox.checked = checked;
    labelsLayer.style.display = checked ? 'block' : 'none';
    if (!checked) {
      for (const el of labelNodesById.values()) {
        el.style.display = 'none';
      }
    }
    options?.onLabelsChange?.(checked);
  };

  const updateLabels = (labels: readonly UiProjectedLabel[]): void => {
    if (!labelsChecked) {
      return;
    }
    for (let i = 0; i < labels.length; i += 1) {
      const item = labels[i]!;
      let node = labelNodesById.get(item.id);
      if (!node) {
        node = document.createElement('div');
        node.className = item.id.startsWith('cyl-')
          ? 'm4-label-chip m4-label-cyl'
          : 'm4-label-chip';
        node.dataset.labelId = item.id;
        node.textContent = item.text;
        labelsLayer.appendChild(node);
        labelNodesById.set(item.id, node);
      } else if (node.textContent !== item.text) {
        node.textContent = item.text;
      }

      if (item.visible) {
        node.style.display = 'block';
        node.style.transform = `translate3d(${item.xPx.toFixed(1)}px, ${item.yPx.toFixed(1)}px, 0) translate(-50%, -50%)`;
      } else {
        node.style.display = 'none';
      }
    }
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

  exteriorCheckbox.addEventListener('change', () => {
    options?.onExteriorChange?.(exteriorCheckbox.checked);
  });

  qualitySelect.addEventListener('change', () => {
    const val = qualitySelect.value as UiQualityMode;
    options?.onQualityChange?.(val);
  });

  explodeSlider.addEventListener('input', () => {
    applyExplodePercentInternal(Number(explodeSlider.value));
  });

  sectionSelect.addEventListener('change', () => {
    applySectionModeInternal(sectionSelect.value as UiSectionMode);
  });

  sectionPosSlider.addEventListener('input', () => {
    applySectionPositionInternal(Number(sectionPosSlider.value));
  });

  xrayCheckbox.addEventListener('change', () => {
    applyXrayCheckedInternal(xrayCheckbox.checked);
  });

  labelsCheckbox.addEventListener('change', () => {
    applyLabelsCheckedInternal(labelsCheckbox.checked);
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

  const setCrankAngleDeg = (deg: number): void => {
    isPlaying = false;
    updatePlayButtonLabel();
    crankAngleDeg = normalizeAngle720(deg);
    scrubSlider.value = String(crankAngleDeg);
    renderReadouts(crankAngleDeg, rpm);
    const state = computeState(config, crankAngleDeg, rpm, valves);
    onState(state);
  };

  const setPlaying = (playing: boolean): void => {
    isPlaying = playing;
    updatePlayButtonLabel();
    renderReadouts(crankAngleDeg, rpm);
  };

  const setExteriorChecked = (checked: boolean): void => {
    exteriorCheckbox.checked = checked;
    options?.onExteriorChange?.(checked);
  };

  const setQualityMode = (mode: UiQualityMode): void => {
    qualitySelect.value = mode;
    options?.onQualityChange?.(mode);
  };

  const setExplodePercent = (percent: number): void => {
    applyExplodePercentInternal(percent);
  };

  const setSectionMode = (mode: UiSectionMode): void => {
    applySectionModeInternal(mode);
  };

  const setSectionPositionMm = (posMm: number): void => {
    applySectionPositionInternal(posMm);
  };

  const setXrayChecked = (checked: boolean): void => {
    applyXrayCheckedInternal(checked);
  };

  const setLabelsChecked = (checked: boolean): void => {
    applyLabelsCheckedInternal(checked);
  };

  const setDynoInspectorRpm = (targetRpm: number): void => {
    dynoHandle?.setSelectedRpm(targetRpm);
  };

  const getDynoSelectedPoint = (): DynoPointDetail | null => {
    return dynoHandle ? dynoHandle.getSelectedDetail() : null;
  };

  const dispose = (): void => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('pointerup', endScrub);
    window.removeEventListener('pointercancel', endScrub);
    dynoHandle?.dispose();
    for (const el of labelNodesById.values()) {
      el.remove();
    }
    labelNodesById.clear();
    if (createdLabelsLayer) {
      labelsLayer.remove();
    }
    panel.remove();
    caption.remove();
  };

  return {
    setCrankAngleDeg,
    setPlaying,
    setExteriorChecked,
    setQualityMode,
    setExplodePercent,
    setSectionMode,
    setSectionPositionMm,
    setXrayChecked,
    setLabelsChecked,
    updateLabels,
    setDynoInspectorRpm,
    getDynoSelectedPoint,
    dispose,
  };
}
