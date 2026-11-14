// Inline SVG dyno chart, peak vs published rating readouts, and 25-point RPM inspector
// (D-007, D-013, D-015, D-016; docs/specs/M5-performance.md §5).
// Pure DOM + SVG; never imports Three.js.

import type { StockRatings } from '../config/engineConfig';
import type { LimitKind, PerformanceResult } from '../core/interfaces';
import type { DynoPointDetail } from '../perf/model';

export interface DynoUiData {
  readonly curve: PerformanceResult;
  readonly details: readonly DynoPointDetail[];
  readonly ratings: StockRatings;
}

export interface DynoSectionHandle {
  readonly element: HTMLElement;
  setSelectedRpm(rpm: number): void;
  getSelectedDetail(): DynoPointDetail;
  dispose(): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// Fixed axis ranges per Spec §5 so Milestone 6 build comparisons stay honest.
const RPM_MIN = 1000;
const RPM_MAX = 3400;
const TORQUE_MIN = 0;
const TORQUE_MAX = 700;
const POWER_MIN = 0;
const POWER_MAX = 350;

// SVG coordinate frame (panel inner width ~310 px x 190 px height)
const VIEW_W = 310;
const VIEW_H = 190;
const PLOT_LEFT = 34;
const PLOT_RIGHT = 278;
const PLOT_TOP = 20;
const PLOT_BOTTOM = 166;
const PLOT_W = PLOT_RIGHT - PLOT_LEFT;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;

const Y_GRID_STEPS = 5; // 0, 140, 280, 420, 560, 700 lb-ft | 0, 70, 140, 210, 280, 350 hp
const X_GRID_RPMS: readonly number[] = [1000, 1600, 2200, 2800, 3400];

const LIMIT_BADGE_COLORS: Readonly<Record<LimitKind, string>> = {
  tune: '#7dd3fc',
  smoke: '#fcd34d',
  turbo: '#c084fc',
  egt: '#fca5a5',
  cp3: '#86efac',
};

function createSvgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
  }
  return el;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function mapRpmToX(rpm: number): number {
  return PLOT_LEFT + ((rpm - RPM_MIN) / (RPM_MAX - RPM_MIN)) * PLOT_W;
}

function mapTorqueToY(torqueLbFt: number): number {
  const clamped = clamp(torqueLbFt, TORQUE_MIN, TORQUE_MAX);
  return PLOT_BOTTOM - ((clamped - TORQUE_MIN) / (TORQUE_MAX - TORQUE_MIN)) * PLOT_H;
}

function mapPowerToY(powerHp: number): number {
  const clamped = clamp(powerHp, POWER_MIN, POWER_MAX);
  return PLOT_BOTTOM - ((clamped - POWER_MIN) / (POWER_MAX - POWER_MIN)) * PLOT_H;
}

function formatDeltaPct(measured: number, rated: number): string {
  const pct = ((measured - rated) / rated) * 100;
  const absPct = Math.abs(pct);
  const digits = absPct > 0 && absPct < 0.1 ? 2 : 1;
  const sign = pct >= 0 ? '+' : '−';
  return `${sign}${absPct.toFixed(digits)}%`;
}

function createDiamondPoints(cx: number, cy: number, radius: number): string {
  return [
    `${cx.toFixed(1)},${(cy - radius).toFixed(1)}`,
    `${(cx + radius).toFixed(1)},${cy.toFixed(1)}`,
    `${cx.toFixed(1)},${(cy + radius).toFixed(1)}`,
    `${(cx - radius).toFixed(1)},${cy.toFixed(1)}`,
  ].join(' ');
}

export function createDynoSection(data: DynoUiData): DynoSectionHandle {
  const { curve, details, ratings } = data;
  if (curve.rpmPoints.length === 0 || details.length !== curve.rpmPoints.length) {
    throw new Error('Dyno UI requires non-empty matching curve and detail arrays.');
  }

  const section = document.createElement('div');
  section.className = 'm5-dyno-group';
  section.setAttribute('role', 'group');
  section.setAttribute('aria-label', 'Dyno performance curve and inspector');

  const sectionTitle = document.createElement('div');
  sectionTitle.className = 'm4-views-title';
  sectionTitle.textContent = 'Dyno';

  const headerLine = document.createElement('div');
  headerLine.className = 'm5-dyno-header';
  headerLine.textContent = 'Stock build — Allison automatic ratings';

  // Build inline SVG chart
  const svg = createSvgEl('svg', {
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    width: '100%',
    height: String(VIEW_H),
    class: 'm5-dyno-svg',
    role: 'img',
    'aria-label':
      'Steady-state crank torque (0 to 700 lb-ft) and power (0 to 350 hp) curves from 1000 to 3400 RPM with uncertainty band and published rating markers',
  });

  // Plot background frame
  svg.appendChild(
    createSvgEl('rect', {
      x: String(PLOT_LEFT),
      y: String(PLOT_TOP),
      width: String(PLOT_W),
      height: String(PLOT_H),
      fill: 'rgba(15, 23, 42, 0.72)',
      stroke: 'rgba(148, 163, 184, 0.26)',
      'stroke-width': '1',
      rx: '3',
    }),
  );

  // Axis unit headers at top corners
  const leftAxisHeader = createSvgEl('text', {
    x: '2',
    y: '12',
    fill: '#38bdf8',
    'font-size': '9.5',
    'font-weight': '600',
  });
  leftAxisHeader.textContent = 'Torque (lb-ft)';
  svg.appendChild(leftAxisHeader);

  const rightAxisHeader = createSvgEl('text', {
    x: String(VIEW_W - 2),
    y: '12',
    fill: '#fb923c',
    'font-size': '9.5',
    'font-weight': '600',
    'text-anchor': 'end',
  });
  rightAxisHeader.textContent = 'Power (hp ±8%)';
  svg.appendChild(rightAxisHeader);

  // Horizontal gridlines + left (torque) and right (power) axis labels
  for (let step = 0; step <= Y_GRID_STEPS; step += 1) {
    const frac = step / Y_GRID_STEPS;
    const y = PLOT_BOTTOM - frac * PLOT_H;
    const torqueTick = Math.round(TORQUE_MIN + frac * (TORQUE_MAX - TORQUE_MIN));
    const powerTick = Math.round(POWER_MIN + frac * (POWER_MAX - POWER_MIN));

    if (step > 0 && step < Y_GRID_STEPS) {
      svg.appendChild(
        createSvgEl('line', {
          x1: String(PLOT_LEFT),
          y1: y.toFixed(1),
          x2: String(PLOT_RIGHT),
          y2: y.toFixed(1),
          stroke: 'rgba(148, 163, 184, 0.14)',
          'stroke-width': '1',
        }),
      );
    }

    const leftTickText = createSvgEl('text', {
      x: String(PLOT_LEFT - 4),
      y: (y + 3).toFixed(1),
      fill: '#7dd3fc',
      'font-size': '8.5',
      'text-anchor': 'end',
    });
    leftTickText.textContent = String(torqueTick);
    svg.appendChild(leftTickText);

    const rightTickText = createSvgEl('text', {
      x: String(PLOT_RIGHT + 4),
      y: (y + 3).toFixed(1),
      fill: '#fdba74',
      'font-size': '8.5',
      'text-anchor': 'start',
    });
    rightTickText.textContent = String(powerTick);
    svg.appendChild(rightTickText);
  }

  // Vertical gridlines + X-axis RPM labels
  for (const rpmTick of X_GRID_RPMS) {
    const x = mapRpmToX(rpmTick);
    if (rpmTick > RPM_MIN && rpmTick < RPM_MAX) {
      svg.appendChild(
        createSvgEl('line', {
          x1: x.toFixed(1),
          y1: String(PLOT_TOP),
          x2: x.toFixed(1),
          y2: String(PLOT_BOTTOM),
          stroke: 'rgba(148, 163, 184, 0.14)',
          'stroke-width': '1',
        }),
      );
    }
    const tickLabel = createSvgEl('text', {
      x: x.toFixed(1),
      y: String(PLOT_BOTTOM + 12),
      fill: '#94a3b8',
      'font-size': '8.5',
      'text-anchor': 'middle',
    });
    tickLabel.textContent = String(rpmTick);
    svg.appendChild(tickLabel);
  }

  const xAxisTitle = createSvgEl('text', {
    x: ((PLOT_LEFT + PLOT_RIGHT) / 2).toFixed(1),
    y: String(VIEW_H - 2),
    fill: '#64748b',
    'font-size': '8.5',
    'font-weight': '600',
    'text-anchor': 'middle',
  });
  xAxisTitle.textContent = 'Engine Speed (RPM)';
  svg.appendChild(xAxisTitle);

  // Power ±uncertaintyPct shaded band polygon
  const upperBandPts: string[] = [];
  const lowerBandPts: string[] = [];
  for (let i = 0; i < curve.rpmPoints.length; i += 1) {
    const x = mapRpmToX(curve.rpmPoints[i]!);
    const p = curve.powerHp[i]!;
    const u = curve.uncertaintyPct[i]! / 100;
    upperBandPts.push(`${x.toFixed(1)},${mapPowerToY(p * (1 + u)).toFixed(1)}`);
    lowerBandPts.push(`${x.toFixed(1)},${mapPowerToY(p * (1 - u)).toFixed(1)}`);
  }
  lowerBandPts.reverse();

  svg.appendChild(
    createSvgEl('polygon', {
      points: [...upperBandPts, ...lowerBandPts].join(' '),
      fill: 'rgba(251, 146, 60, 0.20)',
      stroke: 'rgba(251, 146, 60, 0.34)',
      'stroke-width': '0.75',
    }),
  );

  // Torque curve polyline
  const torquePolylinePts = curve.rpmPoints
    .map((rpm, i) => `${mapRpmToX(rpm).toFixed(1)},${mapTorqueToY(curve.torqueLbFt[i]!).toFixed(1)}`)
    .join(' ');
  svg.appendChild(
    createSvgEl('polyline', {
      points: torquePolylinePts,
      fill: 'none',
      stroke: '#38bdf8',
      'stroke-width': '2',
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    }),
  );

  // Power curve polyline
  const powerPolylinePts = curve.rpmPoints
    .map((rpm, i) => `${mapRpmToX(rpm).toFixed(1)},${mapPowerToY(curve.powerHp[i]!).toFixed(1)}`)
    .join(' ');
  svg.appendChild(
    createSvgEl('polyline', {
      points: powerPolylinePts,
      fill: 'none',
      stroke: '#fb923c',
      'stroke-width': '2',
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    }),
  );

  // Published rating markers: (1600, 605) on torque scale and (3000, 310) on power scale
  const ratedTorqueVal = ratings.peakTorqueLbFt.value;
  const ratedTorqueRpm = ratings.peakTorqueRpm.value;
  const ratedPowerVal = ratings.peakPowerHp.value;
  const ratedPowerRpm = ratings.peakPowerRpm.value;

  const rTx = mapRpmToX(ratedTorqueRpm);
  const rTy = mapTorqueToY(ratedTorqueVal);
  svg.appendChild(
    createSvgEl('polygon', {
      points: createDiamondPoints(rTx, rTy, 4.5),
      fill: '#0ea5e9',
      stroke: '#f8fafc',
      'stroke-width': '1.2',
    }),
  );
  const ratedTorqueLabel = createSvgEl('text', {
    x: rTx.toFixed(1),
    y: (rTy - 7).toFixed(1),
    fill: '#bae6fd',
    'font-size': '8.5',
    'font-weight': '600',
    'text-anchor': 'middle',
    class: 'm5-svg-marker-label',
  });
  ratedTorqueLabel.textContent = `rated ${ratedTorqueVal}`;
  svg.appendChild(ratedTorqueLabel);

  const rPx = mapRpmToX(ratedPowerRpm);
  const rPy = mapPowerToY(ratedPowerVal);
  svg.appendChild(
    createSvgEl('polygon', {
      points: createDiamondPoints(rPx, rPy, 4.5),
      fill: '#f97316',
      stroke: '#f8fafc',
      'stroke-width': '1.2',
    }),
  );
  const ratedPowerLabel = createSvgEl('text', {
    x: (rPx - 5).toFixed(1),
    y: (rPy - 6).toFixed(1),
    fill: '#fed7aa',
    'font-size': '8.5',
    'font-weight': '600',
    'text-anchor': 'end',
    class: 'm5-svg-marker-label',
  });
  ratedPowerLabel.textContent = `rated ${ratedPowerVal}`;
  svg.appendChild(ratedPowerLabel);

  // Selected RPM cursor hairline + point dots
  const cursorLine = createSvgEl('line', {
    x1: String(PLOT_LEFT),
    y1: String(PLOT_TOP),
    x2: String(PLOT_LEFT),
    y2: String(PLOT_BOTTOM),
    stroke: 'rgba(248, 250, 252, 0.55)',
    'stroke-width': '1',
    'stroke-dasharray': '2.5 2.5',
  });
  svg.appendChild(cursorLine);

  const cursorTorqueDot = createSvgEl('circle', {
    cx: String(PLOT_LEFT),
    cy: String(PLOT_BOTTOM),
    r: '3.4',
    fill: '#38bdf8',
    stroke: '#0f172a',
    'stroke-width': '1.3',
  });
  svg.appendChild(cursorTorqueDot);

  const cursorPowerDot = createSvgEl('circle', {
    cx: String(PLOT_LEFT),
    cy: String(PLOT_BOTTOM),
    r: '3.4',
    fill: '#fb923c',
    stroke: '#0f172a',
    'stroke-width': '1.3',
  });
  svg.appendChild(cursorPowerDot);

  // Peak readouts vs published ratings (§5)
  let maxTorqueIdx = 0;
  let maxPowerIdx = 0;
  for (let i = 1; i < curve.rpmPoints.length; i += 1) {
    if (curve.torqueLbFt[i]! > curve.torqueLbFt[maxTorqueIdx]!) {
      maxTorqueIdx = i;
    }
    if (curve.powerHp[i]! > curve.powerHp[maxPowerIdx]!) {
      maxPowerIdx = i;
    }
  }
  const peakTorque = curve.torqueLbFt[maxTorqueIdx]!;
  const peakTorqueRpm = curve.rpmPoints[maxTorqueIdx]!;
  const peakPower = curve.powerHp[maxPowerIdx]!;
  const peakPowerRpm = curve.rpmPoints[maxPowerIdx]!;

  const peaksWrap = document.createElement('div');
  peaksWrap.className = 'm5-dyno-peaks';

  const peakTorqueLine = document.createElement('div');
  peakTorqueLine.className = 'm5-dyno-peak-line';
  peakTorqueLine.textContent = `Peak torque: ${peakTorque.toFixed(1)} lb-ft @ ${peakTorqueRpm} RPM (rated ${ratedTorqueVal} @ ${ratedTorqueRpm}, Δ ${formatDeltaPct(peakTorque, ratedTorqueVal)})`;

  const peakPowerLine = document.createElement('div');
  peakPowerLine.className = 'm5-dyno-peak-line';
  peakPowerLine.textContent = `Peak power: ${peakPower.toFixed(1)} hp @ ${peakPowerRpm} RPM (rated ${ratedPowerVal} @ ${ratedPowerRpm}, Δ ${formatDeltaPct(peakPower, ratedPowerVal)})`;

  peaksWrap.append(peakTorqueLine, peakPowerLine);

  // 25-point Inspector slider + per-point telemetry (§5)
  const inspectorWrap = document.createElement('div');
  inspectorWrap.className = 'm5-dyno-inspector';

  const sliderLabelRow = document.createElement('div');
  sliderLabelRow.className = 'm1-label-row';
  const sliderLabel = document.createElement('label');
  sliderLabel.htmlFor = 'm5-dyno-rpm-slider';
  sliderLabel.textContent = 'Inspector RPM';
  const sliderRpmReadout = document.createElement('span');
  sliderRpmReadout.className = 'm5-inspector-rpm-val';
  sliderLabelRow.append(sliderLabel, sliderRpmReadout);

  const inspectorSlider = document.createElement('input');
  inspectorSlider.id = 'm5-dyno-rpm-slider';
  inspectorSlider.className = 'm1-slider';
  inspectorSlider.type = 'range';
  inspectorSlider.min = String(curve.rpmPoints[0]!);
  inspectorSlider.max = String(curve.rpmPoints[curve.rpmPoints.length - 1]!);
  inspectorSlider.step = '100';

  const limitRow = document.createElement('div');
  limitRow.className = 'm5-inspector-limit-row';
  const limitTitle = document.createElement('span');
  limitTitle.className = 'm5-inspector-limit-title';
  limitTitle.textContent = 'Binding limit:';
  const limitValue = document.createElement('span');
  limitValue.className = 'm5-inspector-limit-val';
  limitRow.append(limitTitle, limitValue);

  const metricsGrid = document.createElement('div');
  metricsGrid.className = 'm5-inspector-grid';

  const makeMetricCell = (label: string): HTMLElement => {
    const cell = document.createElement('div');
    cell.className = 'm5-inspector-cell';
    const k = document.createElement('span');
    k.className = 'm5-inspector-key';
    k.textContent = label;
    const v = document.createElement('span');
    v.className = 'm5-inspector-val';
    cell.append(k, v);
    metricsGrid.appendChild(cell);
    return v;
  };

  const torqueCellVal = makeMetricCell('Torque');
  const powerCellVal = makeMetricCell('Power');
  const fuelCellVal = makeMetricCell('Fuel');
  const boostCellVal = makeMetricCell('Boost');
  const afrCellVal = makeMetricCell('AFR');
  const egtCellVal = makeMetricCell('EGT');

  inspectorWrap.append(sliderLabelRow, inspectorSlider, limitRow, metricsGrid);

  // Exact footnote text required by Spec §5
  const footnote = document.createElement('p');
  footnote.className = 'm5-dyno-footnote';
  footnote.textContent =
    'Modeled estimates from the fuel-first performance model — educational, not measured dyno data.';

  section.append(sectionTitle, headerLine, svg, peaksWrap, inspectorWrap, footnote);

  // Selection state (defaults to 1600 RPM rated torque point if present, else index 0)
  const initialIdx = Math.max(0, curve.rpmPoints.indexOf(1600));
  let selectedIndex = initialIdx;

  const applySelectedIndex = (idx: number): void => {
    const safeIdx = clamp(Math.round(idx), 0, curve.rpmPoints.length - 1);
    selectedIndex = safeIdx;
    const rpm = curve.rpmPoints[safeIdx]!;
    const torque = curve.torqueLbFt[safeIdx]!;
    const power = curve.powerHp[safeIdx]!;
    const detail = details[safeIdx]!;

    inspectorSlider.value = String(rpm);
    sliderRpmReadout.textContent = `${rpm} RPM`;

    limitValue.textContent = `${detail.limit} — ${detail.limitDetail}`;
    limitValue.style.color = LIMIT_BADGE_COLORS[detail.limit];

    torqueCellVal.textContent = `${torque.toFixed(1)} lb-ft`;
    powerCellVal.textContent = `${power.toFixed(1)} hp`;
    fuelCellVal.textContent = `${detail.fuelMm3.toFixed(1)} mm³`;
    boostCellVal.textContent = `${detail.boostPsiGauge.toFixed(1)} psi`;
    afrCellVal.textContent = detail.afr.toFixed(1);
    egtCellVal.textContent = `${Math.round(detail.egtF)} °F`;

    const cx = mapRpmToX(rpm).toFixed(1);
    cursorLine.setAttribute('x1', cx);
    cursorLine.setAttribute('x2', cx);
    cursorTorqueDot.setAttribute('cx', cx);
    cursorTorqueDot.setAttribute('cy', mapTorqueToY(torque).toFixed(1));
    cursorPowerDot.setAttribute('cx', cx);
    cursorPowerDot.setAttribute('cy', mapPowerToY(power).toFixed(1));
  };

  const findNearestIndexForRpm = (targetRpm: number): number => {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < curve.rpmPoints.length; i += 1) {
      const dist = Math.abs(curve.rpmPoints[i]! - targetRpm);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  inspectorSlider.addEventListener('input', () => {
    applySelectedIndex(findNearestIndexForRpm(Number(inspectorSlider.value)));
  });

  // Also support clicking/dragging directly on the SVG chart to inspect points
  let isChartDragging = false;
  const selectFromPointerEvent = (ev: PointerEvent): void => {
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0) return;
    const svgX = ((ev.clientX - rect.left) / rect.width) * VIEW_W;
    const clampedPlotX = clamp(svgX, PLOT_LEFT, PLOT_RIGHT);
    const rawRpm = RPM_MIN + ((clampedPlotX - PLOT_LEFT) / PLOT_W) * (RPM_MAX - RPM_MIN);
    applySelectedIndex(findNearestIndexForRpm(rawRpm));
  };

  const onSvgPointerDown = (ev: PointerEvent): void => {
    isChartDragging = true;
    selectFromPointerEvent(ev);
  };
  const onWindowPointerMove = (ev: PointerEvent): void => {
    if (!isChartDragging) return;
    selectFromPointerEvent(ev);
  };
  const onWindowPointerUp = (): void => {
    isChartDragging = false;
  };

  svg.addEventListener('pointerdown', onSvgPointerDown);
  window.addEventListener('pointermove', onWindowPointerMove);
  window.addEventListener('pointerup', onWindowPointerUp);
  window.addEventListener('pointercancel', onWindowPointerUp);

  applySelectedIndex(initialIdx);

  return {
    element: section,
    setSelectedRpm: (rpm: number) => {
      applySelectedIndex(findNearestIndexForRpm(rpm));
    },
    getSelectedDetail: () => details[selectedIndex]!,
    dispose: () => {
      svg.removeEventListener('pointerdown', onSvgPointerDown);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    },
  };
}
