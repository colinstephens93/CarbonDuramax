// Fuel-first steady-state performance model engine constants and calibration knots
// (D-012, D-013, D-015; docs/specs/M5-performance.md §§3.1, 3.4).

import { engineConfig } from '../config/engineConfig';
import type { ProvenancedValue } from '../core/interfaces';

export interface ProvenancedCurve {
  readonly rpmKnots: readonly number[];
  readonly values: readonly number[];
  readonly unit: string;
  readonly confidence: 'verified' | 'published' | 'placeholder';
  readonly source: string;
}

export const CYLINDER_COUNT = 8;

// Derived directly from engineConfig bore & stroke (never duplicated): 8 × (π/4) × B² × S ≈ 0.00659917 m³ (6.599 L).
const boreM = engineConfig.boreMm.value / 1000;
const strokeM = engineConfig.strokeMm.value / 1000;
const sweptVolumeM3 = CYLINDER_COUNT * (Math.PI / 4) * boreM * boreM * strokeM;

export const RPM_GRID: readonly number[] = Array.from({ length: 25 }, (_, i) => 1000 + i * 100);

export const MODEL_RPM_KNOTS: readonly number[] = [
  1000, 1400, 1600, 2000, 2400, 2800, 3000, 3200, 3400,
];

export interface PerfConfig {
  readonly displacementM3: ProvenancedValue;
  readonly displacementL: ProvenancedValue;
  readonly fuelLhvMjKg: ProvenancedValue;
  readonly fuelDensityKgM3: ProvenancedValue;
  readonly stoichAfr: ProvenancedValue;
  readonly ambientPressureKpa: ProvenancedValue;
  readonly ambientTempK: ProvenancedValue;
  readonly thermalEfficiencyKnots: ProvenancedCurve;
  readonly volumetricEfficiencyKnots: ProvenancedCurve;
  readonly uncertaintyPct: ProvenancedValue;
}

export const perfConfig: PerfConfig = {
  displacementM3: {
    value: sweptVolumeM3,
    unit: 'm^3',
    confidence: 'published',
    source: 'derived from engineConfig boreMm (103 mm) and strokeMm (99 mm) across 8 cylinders',
  },
  displacementL: {
    value: sweptVolumeM3 * 1000,
    unit: 'L',
    confidence: 'published',
    source: 'derived from engineConfig boreMm (103 mm) and strokeMm (99 mm) across 8 cylinders',
  },
  fuelLhvMjKg: {
    value: 42.5,
    unit: 'MJ/kg',
    confidence: 'published',
    source: 'standard No. 2 diesel lower heating value textbook reference',
  },
  fuelDensityKgM3: {
    value: 835,
    unit: 'kg/m^3',
    confidence: 'placeholder',
    source: 'nominal diesel liquid density placeholder (8.35e-7 kg/mm^3)',
  },
  stoichAfr: {
    value: 14.5,
    unit: 'ratio',
    confidence: 'published',
    source: 'standard diesel stoichiometric air-fuel mass ratio',
  },
  ambientPressureKpa: {
    value: 101.3,
    unit: 'kPa',
    confidence: 'published',
    source: 'standard-day sea-level atmospheric pressure',
  },
  ambientTempK: {
    value: 298,
    unit: 'K',
    confidence: 'published',
    source: 'standard-day intake ambient temperature (25 °C / 77 °F)',
  },
  thermalEfficiencyKnots: {
    rpmKnots: MODEL_RPM_KNOTS,
    values: [0.355, 0.364, 0.365, 0.364, 0.363, 0.362, 0.362, 0.356, 0.35],
    unit: 'ratio',
    confidence: 'placeholder',
    source:
      'Milestone 5 brake thermal efficiency calibration knots (implied BSFC ≈ 0.385 lb/hp·h at stock peaks)',
  },
  volumetricEfficiencyKnots: {
    rpmKnots: MODEL_RPM_KNOTS,
    values: [0.88, 0.91, 0.92, 0.915, 0.9, 0.885, 0.87, 0.86, 0.85],
    unit: 'ratio',
    confidence: 'placeholder',
    source: 'Milestone 5 baseline 4-valve diesel volumetric efficiency calibration knots',
  },
  uncertaintyPct: {
    value: 8.0,
    unit: '%',
    confidence: 'placeholder',
    source: 'Milestone 5 flat uncertainty band: 5% base + 3% for placeholder-dominated inputs',
  },
};

export const UNCERTAINTY_PCT = perfConfig.uncertaintyPct.value;
