// Inline SVG two-build dyno comparison chart, peak vs stock readouts, compatibility violation
// state, and dual-build 25-point RPM inspector (D-007, D-013, D-015, D-016;
// docs/specs/M5-performance.md §5, docs/specs/M6-parts-catalog.md §§4.2–4.5).
// Pure DOM + SVG; never imports Three.js.

import type { StockRatings } from '../config/engineConfig';
import type { LimitKind, PerformanceResult } from '../core/interfaces';
import type { DynoPointDetail } from '../perf/model';

export interface DynoBuildData {
  readonly curve: PerformanceResult;
  readonly details: readonly DynoPointDetail[];
}

export interface DynoComparisonData {
  readonly stock: DynoBuildData;
  readonly modified: DynoBuildData;
  readonly ratings: StockRatings;
}

export interface DynoSectionHandle {
  readonly element: HTMLElement;
  setSelectedRpm(rpm: number): void;
  getSelectedDetail(): DynoPointDetail;
  setModifiedBuild(data: DynoBuildData | null, violations: readonly string[]): void;
  dispose(): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

const RPM_MIN = 1000;
const RPM_MAX = 3400;
const TORQUE_MIN = 0;
const BASE_TORQUE_MAX = 700;
const POWER_MIN = 0;
const BASE_POWER_MAX = 350;
const BAND_POWER_MULTIPLIER = 1.08;

// SVG coordinate frame (panel inner width ~310 px x 190 px height)
const VIEW_W = 310;
const VIEW_H = 190;
const PLOT_LEFT = 34;
const PLOT_RIGHT = 278;
const PLOT_TOP = 20;
const PLOT_BOTTOM = 166;
const PLOT_W = PLOT_RIGHT - PLOT_LEFT;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;

const Y_GRID_STEPS = 5;
const X_GRID_RPMS: readonly number[] = [1000, 1600, 2200, 2800, 3400];

const LIMIT_BADGE_COLORS: Readonly<Record<LimitKind, string>> = {
  tune: '#7dd3fc',
  smoke: '#fcd34d',
  turbo: '#c084fc',
  egt: '#fca5a5',
  cp3: '#86efac',
};

export function computeAxisMaxima(curves: readonly PerformanceResult[]): {
  torqueMax: number;
  powerMax: number;
} {
  let highestTorque = 0;
  let highestPower = 0;

  for (const curve of curves) {
    for (const t of curve.torqueLbFt) {
      if (t > highestTorque) {
        highestTorque = t;
      }
    }
    for (const p of curve.powerHp) {
      if (p > highestPower) {
        highestPower = p;
      }
    }
  }

  const torqueTarget = Math.max(BASE_TORQUE_MAX, highestTorque);
  const powerTarget = Math.max(BASE_POWER_MAX, highestPower * BAND_POWER_MULTIPLIER);

  return {
    torqueMax: Math.ceil(torqueTarget / 100) * 100,
    powerMax: Math.ceil(powerTarget / 50) * 50,
  };
}

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

function mapTorqueToY(torqueLbFt: number, torqueMax: number): number {
  const clamped = clamp(torqueLbFt, TORQUE_MIN, torqueMax);
  return PLOT_BOTTOM - ((clamped - TORQUE_MIN) / (torqueMax - TORQUE_MIN)) * PLOT_H;
}

function mapPowerToY(powerHp: number, powerMax: number): number {
  const clamped = clamp(powerHp, POWER_MIN, powerMax);
  return PLOT_BOTTOM - ((clamped - POWER_MIN) / (powerMax - POWER_MIN)) * PLOT_H;
}

function formatSignedDelta(measured: number, baseline: number): string {
  const diff = measured - baseline;
  const absDiff = Math.abs(diff);
  if (absDiff < 0.05) {
    return '+0.0';
  }
  const sign = diff >= 0 ? '+' : '−';
  return `${sign}${absDiff.toFixed(1)}`;
}

function formatDeltaPct(measured: number, baseline: number): string {
  const pct = ((measured - baseline) / baseline) * 100;
  const absPct = Math.abs(pct);
  if (absPct < 0.005) {
    return '+0.0%';
  }
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

function findPeakIndex(values: readonly number[]): number {
  let bestIdx = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i]! > values[bestIdx]!) {
      bestIdx = i;
    }
  }
  return bestIdx;
}

function buildChartAriaLabel(torqueMax: number, powerMax: number): string {
  return `Steady-state stock and modified crank torque (0 to ${torqueMax} lb-ft) and power (0 to ${powerMax} hp) curves from 1000 to 3400 RPM with uncertainty band and published rating markers`;
}

export function createDynoSection(data: DynoComparisonData): DynoSectionHandle {
  const { stock, ratings } = data;
  if (
    stock.curve.rpmPoints.length === 0 ||
    stock.details.length !== stock.curve.rpmPoints.length ||
    data.modified.curve.rpmPoints.length !== stock.curve.rpmPoints.length ||
    data.modified.details.length !== data.modified.curve.rpmPoints.length
  ) {
    throw new Error('Dyno UI requires non-empty matching stock and modified curve/detail arrays.');
  }

  let currentModified: DynoBuildData | null = data.modified;
  let currentViolations: readonly string[] = [];

  const initialMaxima = computeAxisMaxima([stock.curve, data.modified.curve]);
  let currentTorqueMax = initialMaxima.torqueMax;
  let currentPowerMax = initialMaxima.powerMax;

  const section = document.createElement('div');
  section.className = 'm5-dyno-group';
  section.setAttribute('role', 'group');
  section.setAttribute('aria-label', 'Dyno performance curve and inspector');

  const sectionTitle = document.createElement('div');
  sectionTitle.className = 'm4-views-title';
  sectionTitle.textContent = 'Dyno';

  const headerLine = document.createElement('div');
  headerLine.className = 'm5-dyno-header';
  headerLine.textContent = 'Stock vs. modified build — Allison automatic ratings';

  // Valid build wrapper (replaced by violationWrap when incompatible)
  const validContentWrap = document.createElement('div');
  validContentWrap.className = 'm6-dyno-valid-wrap';

  // Legend row naming Stock (grey dashed) and Modified (solid color samples)
  const legendRow = document.createElement('div');
  legendRow.className = 'm6-dyno-legend';

  const stockLegendItem = document.createElement('span');
  stockLegendItem.className = 'm6-legend-item';
  const stockSwatchSvg = createSvgEl('svg', {
    viewBox: '0 0 22 8',
    width: '22',
    height: '8',
    'aria-hidden': 'true',
    class: 'm6-legend-swatch',
  });
  stockSwatchSvg.appendChild(
    createSvgEl('line', {
      x1: '1',
      y1: '4',
      x2: '21',
      y2: '4',
      stroke: '#94a3b8',
      'stroke-width': '1.8',
      'stroke-dasharray': '4 3',
      'stroke-linecap': 'round',
    }),
  );
  const stockLegendText = document.createElement('span');
  stockLegendText.textContent = 'Stock';
  stockLegendItem.append(stockSwatchSvg, stockLegendText);

  const modLegendItem = document.createElement('span');
  modLegendItem.className = 'm6-legend-item';
  const modSwatchSvg = createSvgEl('svg', {
    viewBox: '0 0 26 8',
    width: '26',
    height: '8',
    'aria-hidden': 'true',
    class: 'm6-legend-swatch',
  });
  modSwatchSvg.appendChild(
    createSvgEl('line', {
      x1: '1',
      y1: '2.5',
      x2: '25',
      y2: '2.5',
      stroke: '#38bdf8',
      'stroke-width': '2',
      'stroke-linecap': 'round',
    }),
  );
  modSwatchSvg.appendChild(
    createSvgEl('line', {
      x1: '1',
      y1: '6',
      x2: '25',
      y2: '6',
      stroke: '#fb923c',
      'stroke-width': '2',
      'stroke-linecap': 'round',
    }),
  );
  const modLegendText = document.createElement('span');
  modLegendText.textContent = 'Modified';
  modLegendItem.append(modSwatchSvg, modLegendText);

  legendRow.append(stockLegendItem, modLegendItem);

  // Build inline SVG chart
  const svg = createSvgEl('svg', {
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    width: '100%',
    height: String(VIEW_H),
    class: 'm5-dyno-svg',
    role: 'img',
    'aria-label': buildChartAriaLabel(currentTorqueMax, currentPowerMax),
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

  // Horizontal gridlines + dynamic left (torque) and right (power) axis labels
  const leftTickTexts: SVGTextElement[] = [];
  const rightTickTexts: SVGTextElement[] = [];

  for (let step = 0; step <= Y_GRID_STEPS; step += 1) {
    const frac = step / Y_GRID_STEPS;
    const y = PLOT_BOTTOM - frac * PLOT_H;

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
    svg.appendChild(leftTickText);
    leftTickTexts.push(leftTickText);

    const rightTickText = createSvgEl('text', {
      x: String(PLOT_RIGHT + 4),
      y: (y + 3).toFixed(1),
      fill: '#fdba74',
      'font-size': '8.5',
      'text-anchor': 'start',
    });
    svg.appendChild(rightTickText);
    rightTickTexts.push(rightTickText);
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

  // Modified build power ±uncertaintyPct shaded band polygon
  const bandPolygon = createSvgEl('polygon', {
    fill: 'rgba(251, 146, 60, 0.20)',
    stroke: 'rgba(251, 146, 60, 0.34)',
    'stroke-width': '0.75',
  });
  svg.appendChild(bandPolygon);

  // Stock reference curves (grey, dashed, drawn beneath modified curves)
  const stockTorquePolyline = createSvgEl('polyline', {
    fill: 'none',
    stroke: '#94a3b8',
    'stroke-width': '1.6',
    'stroke-dasharray': '4 3',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
  });
  svg.appendChild(stockTorquePolyline);

  const stockPowerPolyline = createSvgEl('polyline', {
    fill: 'none',
    stroke: '#94a3b8',
    'stroke-width': '1.6',
    'stroke-dasharray': '4 3',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
  });
  svg.appendChild(stockPowerPolyline);

  // Modified build curves (solid M5 series colors, drawn over stock curves)
  const modTorquePolyline = createSvgEl('polyline', {
    fill: 'none',
    stroke: '#38bdf8',
    'stroke-width': '2',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
  });
  svg.appendChild(modTorquePolyline);

  const modPowerPolyline = createSvgEl('polyline', {
    fill: 'none',
    stroke: '#fb923c',
    'stroke-width': '2',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
  });
  svg.appendChild(modPowerPolyline);

  // Published rating markers: (1600, 605) on torque scale and (3000, 310) on power scale
  const ratedTorqueVal = ratings.peakTorqueLbFt.value;
  const ratedTorqueRpm = ratings.peakTorqueRpm.value;
  const ratedPowerVal = ratings.peakPowerHp.value;
  const ratedPowerRpm = ratings.peakPowerRpm.value;

  const rTx = mapRpmToX(ratedTorqueRpm);
  const ratedTorqueDiamond = createSvgEl('polygon', {
    fill: '#0ea5e9',
    stroke: '#f8fafc',
    'stroke-width': '1.2',
  });
  svg.appendChild(ratedTorqueDiamond);

  const ratedTorqueLabel = createSvgEl('text', {
    x: rTx.toFixed(1),
    fill: '#bae6fd',
    'font-size': '8.5',
    'font-weight': '600',
    'text-anchor': 'middle',
    class: 'm5-svg-marker-label',
  });
  ratedTorqueLabel.textContent = `rated ${ratedTorqueVal}`;
  svg.appendChild(ratedTorqueLabel);

  const rPx = mapRpmToX(ratedPowerRpm);
  const ratedPowerDiamond = createSvgEl('polygon', {
    fill: '#f97316',
    stroke: '#f8fafc',
    'stroke-width': '1.2',
  });
  svg.appendChild(ratedPowerDiamond);

  const ratedPowerLabel = createSvgEl('text', {
    x: (rPx - 5).toFixed(1),
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

  // Stock peaks (computed once)
  const stockMaxTorqueIdx = findPeakIndex(stock.curve.torqueLbFt);
  const stockMaxPowerIdx = findPeakIndex(stock.curve.powerHp);
  const stockPeakTorque = stock.curve.torqueLbFt[stockMaxTorqueIdx]!;
  const stockPeakTorqueRpm = stock.curve.rpmPoints[stockMaxTorqueIdx]!;
  const stockPeakPower = stock.curve.powerHp[stockMaxPowerIdx]!;
  const stockPeakPowerRpm = stock.curve.rpmPoints[stockMaxPowerIdx]!;

  // Peaks comparison block (§4.3)
  const peaksWrap = document.createElement('div');
  peaksWrap.className = 'm5-dyno-peaks';

  const peakTorqueLine = document.createElement('div');
  peakTorqueLine.className = 'm5-dyno-peak-line';

  const peakPowerLine = document.createElement('div');
  peakPowerLine.className = 'm5-dyno-peak-line';

  peaksWrap.append(peakTorqueLine, peakPowerLine);

  // Dual-build 25-point Inspector (§4.4)
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
  inspectorSlider.min = String(stock.curve.rpmPoints[0]!);
  inspectorSlider.max = String(stock.curve.rpmPoints[stock.curve.rpmPoints.length - 1]!);
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

  const makeMetricCell = (
    label: string,
    withDelta = false,
  ): { val: HTMLElement; delta?: HTMLElement } => {
    const cell = document.createElement('div');
    cell.className = 'm5-inspector-cell';
    const k = document.createElement('span');
    k.className = 'm5-inspector-key';
    k.textContent = label;
    const v = document.createElement('span');
    v.className = 'm5-inspector-val';
    cell.append(k, v);
    let d: HTMLElement | undefined;
    if (withDelta) {
      d = document.createElement('span');
      d.className = 'm6-inspector-delta';
      cell.appendChild(d);
    }
    metricsGrid.appendChild(cell);
    return { val: v, delta: d };
  };

  const torqueCell = makeMetricCell('Torque', true);
  const powerCell = makeMetricCell('Power', true);
  const fuelCell = makeMetricCell('Fuel');
  const boostCell = makeMetricCell('Boost');
  const afrCell = makeMetricCell('AFR');
  const egtCell = makeMetricCell('EGT');

  const stockSummaryLine = document.createElement('div');
  stockSummaryLine.className = 'm6-inspector-stock-line';

  inspectorWrap.append(sliderLabelRow, inspectorSlider, limitRow, metricsGrid, stockSummaryLine);

  validContentWrap.append(legendRow, svg, peaksWrap, inspectorWrap);

  // Compatibility violation message block (§4.5)
  const violationWrap = document.createElement('div');
  violationWrap.className = 'm6-dyno-violation';
  violationWrap.style.display = 'none';

  const violationHeading = document.createElement('div');
  violationHeading.className = 'm6-dyno-violation-heading';
  violationHeading.textContent = "This build can't be run yet:";

  const violationList = document.createElement('div');
  violationList.className = 'm6-dyno-violation-list';

  violationWrap.append(violationHeading, violationList);

  // Exact footnote text required by M5 §5 and M6 §4.2
  const footnote = document.createElement('p');
  footnote.className = 'm5-dyno-footnote';
  footnote.textContent =
    'Modeled estimates from the fuel-first performance model — educational, not measured dyno data.';

  section.append(sectionTitle, headerLine, validContentWrap, violationWrap, footnote);

  // Selection state (defaults to 1600 RPM rated torque point if present, else index 0; preserved across build changes)
  const initialIdx = Math.max(0, stock.curve.rpmPoints.indexOf(1600));
  let selectedIndex = initialIdx;

  const renderValidChartAndPeaks = (): void => {
    if (!currentModified) {
      return;
    }

    const modCurve = currentModified.curve;
    const maxima = computeAxisMaxima([stock.curve, modCurve]);
    currentTorqueMax = maxima.torqueMax;
    currentPowerMax = maxima.powerMax;

    svg.setAttribute('aria-label', buildChartAriaLabel(currentTorqueMax, currentPowerMax));

    // Update Y-axis tick labels
    for (let step = 0; step <= Y_GRID_STEPS; step += 1) {
      const frac = step / Y_GRID_STEPS;
      const torqueTick = Math.round(TORQUE_MIN + frac * (currentTorqueMax - TORQUE_MIN));
      const powerTick = Math.round(POWER_MIN + frac * (currentPowerMax - POWER_MIN));
      leftTickTexts[step]!.textContent = String(torqueTick);
      rightTickTexts[step]!.textContent = String(powerTick);
    }

    // Modified power ±uncertaintyPct band
    const upperBandPts: string[] = [];
    const lowerBandPts: string[] = [];
    for (let i = 0; i < modCurve.rpmPoints.length; i += 1) {
      const x = mapRpmToX(modCurve.rpmPoints[i]!);
      const p = modCurve.powerHp[i]!;
      const u = modCurve.uncertaintyPct[i]! / 100;
      upperBandPts.push(`${x.toFixed(1)},${mapPowerToY(p * (1 + u), currentPowerMax).toFixed(1)}`);
      lowerBandPts.push(`${x.toFixed(1)},${mapPowerToY(p * (1 - u), currentPowerMax).toFixed(1)}`);
    }
    lowerBandPts.reverse();
    bandPolygon.setAttribute('points', [...upperBandPts, ...lowerBandPts].join(' '));

    // Stock dashed polylines
    stockTorquePolyline.setAttribute(
      'points',
      stock.curve.rpmPoints
        .map(
          (rpm, i) =>
            `${mapRpmToX(rpm).toFixed(1)},${mapTorqueToY(stock.curve.torqueLbFt[i]!, currentTorqueMax).toFixed(1)}`,
        )
        .join(' '),
    );
    stockPowerPolyline.setAttribute(
      'points',
      stock.curve.rpmPoints
        .map(
          (rpm, i) =>
            `${mapRpmToX(rpm).toFixed(1)},${mapPowerToY(stock.curve.powerHp[i]!, currentPowerMax).toFixed(1)}`,
        )
        .join(' '),
    );

    // Modified solid polylines
    modTorquePolyline.setAttribute(
      'points',
      modCurve.rpmPoints
        .map(
          (rpm, i) =>
            `${mapRpmToX(rpm).toFixed(1)},${mapTorqueToY(modCurve.torqueLbFt[i]!, currentTorqueMax).toFixed(1)}`,
        )
        .join(' '),
    );
    modPowerPolyline.setAttribute(
      'points',
      modCurve.rpmPoints
        .map(
          (rpm, i) =>
            `${mapRpmToX(rpm).toFixed(1)},${mapPowerToY(modCurve.powerHp[i]!, currentPowerMax).toFixed(1)}`,
        )
        .join(' '),
    );

    // Published rating markers on current scale
    const rTy = mapTorqueToY(ratedTorqueVal, currentTorqueMax);
    ratedTorqueDiamond.setAttribute('points', createDiamondPoints(rTx, rTy, 4.5));
    ratedTorqueLabel.setAttribute('y', (rTy - 7).toFixed(1));

    const rPy = mapPowerToY(ratedPowerVal, currentPowerMax);
    ratedPowerDiamond.setAttribute('points', createDiamondPoints(rPx, rPy, 4.5));
    ratedPowerLabel.setAttribute('y', (rPy - 6).toFixed(1));

    // Peaks table (§4.3)
    const modMaxTorqueIdx = findPeakIndex(modCurve.torqueLbFt);
    const modMaxPowerIdx = findPeakIndex(modCurve.powerHp);
    const modPeakTorque = modCurve.torqueLbFt[modMaxTorqueIdx]!;
    const modPeakTorqueRpm = modCurve.rpmPoints[modMaxTorqueIdx]!;
    const modPeakPower = modCurve.powerHp[modMaxPowerIdx]!;
    const modPeakPowerRpm = modCurve.rpmPoints[modMaxPowerIdx]!;

    peakTorqueLine.textContent = `Peak torque: Stock ${stockPeakTorque.toFixed(1)} lb-ft @ ${stockPeakTorqueRpm} RPM · Modified ${modPeakTorque.toFixed(1)} lb-ft @ ${modPeakTorqueRpm} RPM · Δ ${formatSignedDelta(modPeakTorque, stockPeakTorque)} lb-ft (${formatDeltaPct(modPeakTorque, stockPeakTorque)})`;
    peakPowerLine.textContent = `Peak power: Stock ${stockPeakPower.toFixed(1)} hp @ ${stockPeakPowerRpm} RPM · Modified ${modPeakPower.toFixed(1)} hp @ ${modPeakPowerRpm} RPM · Δ ${formatSignedDelta(modPeakPower, stockPeakPower)} hp (${formatDeltaPct(modPeakPower, stockPeakPower)})`;
  };

  const applySelectedIndex = (idx: number): void => {
    const safeIdx = clamp(Math.round(idx), 0, stock.curve.rpmPoints.length - 1);
    selectedIndex = safeIdx;

    if (!currentModified || currentViolations.length > 0) {
      return;
    }

    const rpm = currentModified.curve.rpmPoints[safeIdx]!;
    const modTorque = currentModified.curve.torqueLbFt[safeIdx]!;
    const modPower = currentModified.curve.powerHp[safeIdx]!;
    const modDetail = currentModified.details[safeIdx]!;

    const stockTorque = stock.curve.torqueLbFt[safeIdx]!;
    const stockPower = stock.curve.powerHp[safeIdx]!;
    const stockDetail = stock.details[safeIdx]!;

    inspectorSlider.value = String(rpm);
    sliderRpmReadout.textContent = `${rpm} RPM`;

    limitValue.textContent = `${modDetail.limit} — ${modDetail.limitDetail}`;
    limitValue.style.color = LIMIT_BADGE_COLORS[modDetail.limit];

    torqueCell.val.textContent = `${modTorque.toFixed(1)} lb-ft`;
    if (torqueCell.delta) {
      torqueCell.delta.textContent = `Δ ${formatSignedDelta(modTorque, stockTorque)} (${formatDeltaPct(modTorque, stockTorque)})`;
    }
    powerCell.val.textContent = `${modPower.toFixed(1)} hp`;
    if (powerCell.delta) {
      powerCell.delta.textContent = `Δ ${formatSignedDelta(modPower, stockPower)} (${formatDeltaPct(modPower, stockPower)})`;
    }
    fuelCell.val.textContent = `${modDetail.fuelMm3.toFixed(1)} mm³`;
    boostCell.val.textContent = `${modDetail.boostPsiGauge.toFixed(1)} psi`;
    afrCell.val.textContent = modDetail.afr.toFixed(1);
    egtCell.val.textContent = `${Math.round(modDetail.egtF)} °F`;

    stockSummaryLine.textContent = `Stock @ ${rpm} RPM: ${stockTorque.toFixed(1)} lb-ft · ${stockPower.toFixed(1)} hp · ${stockDetail.limit} — ${stockDetail.limitDetail}`;

    const cx = mapRpmToX(rpm).toFixed(1);
    cursorLine.setAttribute('x1', cx);
    cursorLine.setAttribute('x2', cx);
    cursorTorqueDot.setAttribute('cx', cx);
    cursorTorqueDot.setAttribute('cy', mapTorqueToY(modTorque, currentTorqueMax).toFixed(1));
    cursorPowerDot.setAttribute('cx', cx);
    cursorPowerDot.setAttribute('cy', mapPowerToY(modPower, currentPowerMax).toFixed(1));
  };

  const setModifiedBuild = (
    nextData: DynoBuildData | null,
    violations: readonly string[],
  ): void => {
    currentViolations = violations;

    if (violations.length > 0 || nextData === null) {
      currentModified = null;
      validContentWrap.style.display = 'none';
      violationList.replaceChildren();
      for (const msg of violations) {
        const line = document.createElement('div');
        line.className = 'm6-dyno-violation-item';
        line.textContent = msg;
        violationList.appendChild(line);
      }
      violationWrap.style.display = 'block';
      return;
    }

    if (
      nextData.curve.rpmPoints.length !== stock.curve.rpmPoints.length ||
      nextData.details.length !== nextData.curve.rpmPoints.length
    ) {
      throw new Error('Modified build curve and details must match the stock RPM grid.');
    }

    currentModified = nextData;
    violationWrap.style.display = 'none';
    violationList.replaceChildren();
    validContentWrap.style.display = 'block';

    renderValidChartAndPeaks();
    applySelectedIndex(selectedIndex);
  };

  const findNearestIndexForRpm = (targetRpm: number): number => {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < stock.curve.rpmPoints.length; i += 1) {
      const dist = Math.abs(stock.curve.rpmPoints[i]! - targetRpm);
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

  renderValidChartAndPeaks();
  applySelectedIndex(initialIdx);

  return {
    element: section,
    setSelectedRpm: (rpm: number) => {
      applySelectedIndex(findNearestIndexForRpm(rpm));
    },
    getSelectedDetail: () => {
      if (currentModified !== null && currentViolations.length === 0) {
        return currentModified.details[selectedIndex]!;
      }
      return stock.details[selectedIndex]!;
    },
    setModifiedBuild,
    dispose: () => {
      svg.removeEventListener('pointerdown', onSvgPointerDown);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    },
  };
}
