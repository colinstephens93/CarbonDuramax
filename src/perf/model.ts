// Steady-state fuel-first performance model and shared curve/detail evaluator
// (D-007, D-010, D-013, D-015; docs/specs/M5-performance.md §3).

import type { Build, LimitKind, PartVariant, PerformanceResult } from '../core/interfaces';
import {
  CYLINDER_COUNT,
  MODEL_RPM_KNOTS,
  RPM_GRID,
  UNCERTAINTY_PCT,
  perfConfig,
} from './perfConfig';
import { type ResolvedParams, resolveBuild } from './resolveBuild';

export interface DynoPointDetail {
  rpm: number;
  fuelMm3: number; // delivered fuel per stroke per cylinder (the binding Q)
  pressureRatio: number; // delivered PR
  boostPsiGauge: number; // (PR - 1) x 14.7
  afr: number; // delivered-air AFR at the delivered fuel
  egtF: number; // modeled EGT at the delivered fuel
  capsMm3: { tune: number; cp3: number; smoke: number; egt: number };
  limit: LimitKind; // same attribution as the frozen result
  limitDetail: string; // e.g. "fuel request", "injector flow ceiling", "AFR 19.0 at delivered boost"
}

interface EvaluatedGridPoint {
  readonly torqueLbFt: number;
  readonly powerHp: number;
  readonly uncertaintyPct: number;
  readonly detail: DynoPointDetail;
}

const SPOOL_FLOOR = 0.12;
const SPECIFIC_GAS_CONSTANT_AIR = 0.287; // kJ/(kg·K) == kPa·m³/(kg·K)
const GAMMA_RATIO_EXPONENT_NUM = 0.4; // γ - 1 for dry air (γ = 1.4)
const GAMMA_AIR = 1.4;
const PSI_PER_ATM = 14.7;
const INJECTIONS_PER_HOUR_PER_RPM = 240; // 8 cylinders × (60 min/h) / (2 rev/cycle) = 240 × N
const CYCLES_PER_SECOND_DIVISOR = 120; // N / 120 cycles/s for a 4-stroke engine
const EGT_BASE_F = 500;
const EGT_SLOPE_F = 1050;
const EGT_REF_FUEL_MM3 = 100;
const EGT_REF_AFR = 18;
const BASELINE_COMPRESSION_RATIO = 17.5;
const CR_EFFICIENCY_EXPONENT = -0.35;
const LB_FT_PER_NM = 0.737562;
const HP_TORQUE_RPM_DIVISOR = 5252.113;
const CAP_TIE_TOLERANCE_MM3 = 0.01;
const EGT_BISECTION_HALF_SPAN_MM3 = 0.01; // yields ±0.01 mm³ accuracy (well within §3.2.5's ±0.1 mm³)

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function interpolateKnots(
  x: number,
  knotsX: readonly number[],
  knotsY: readonly number[],
): number {
  const n = knotsX.length;
  if (n === 0 || knotsY.length !== n) {
    throw new Error('Invalid interpolation knot arrays.');
  }
  if (x <= knotsX[0]!) {
    return knotsY[0]!;
  }
  if (x >= knotsX[n - 1]!) {
    return knotsY[n - 1]!;
  }
  for (let i = 0; i < n - 1; i += 1) {
    const x0 = knotsX[i]!;
    const x1 = knotsX[i + 1]!;
    if (x >= x0 && x <= x1) {
      const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      return knotsY[i]! + t * (knotsY[i + 1]! - knotsY[i]!);
    }
  }
  return knotsY[n - 1]!;
}

function computeEgtAtFuelF(qMm3: number, mairDelKg: number, kgPerMm3: number): number {
  if (qMm3 <= 0 || mairDelKg <= 0) {
    return EGT_BASE_F;
  }
  const afr = mairDelKg / (CYLINDER_COUNT * qMm3 * kgPerMm3);
  return EGT_BASE_F + EGT_SLOPE_F * (qMm3 / EGT_REF_FUEL_MM3) * (EGT_REF_AFR / afr);
}

function solveEgtCapMm3(mairDelKg: number, egtLimitF: number, kgPerMm3: number): number {
  if (egtLimitF <= EGT_BASE_F || mairDelKg <= 0) {
    return 0;
  }
  let lo = 0;
  let hi = 500;
  while (computeEgtAtFuelF(hi, mairDelKg, kgPerMm3) < egtLimitF && hi < 1e7) {
    hi *= 2;
  }
  while (hi - lo > 2 * EGT_BISECTION_HALF_SPAN_MM3) {
    const mid = 0.5 * (lo + hi);
    if (computeEgtAtFuelF(mid, mairDelKg, kgPerMm3) < egtLimitF) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return 0.5 * (lo + hi);
}

function compressionEfficiencyFactor(cr: number): number {
  return 1 - Math.pow(cr, CR_EFFICIENCY_EXPONENT);
}

const BASELINE_CR_FACTOR = compressionEfficiencyFactor(BASELINE_COMPRESSION_RATIO);

function evaluatePoint(rpm: number, params: ResolvedParams): EvaluatedGridPoint {
  const { turbo, tune, injectors, cp3, intercooler, intake, exhaust, heads, camshaft, pistons } =
    params;

  // 1. Boost (§3.2.1)
  const s = clamp(
    (rpm - turbo.spoolStartRpm) / (turbo.spoolFullRpm - turbo.spoolStartRpm),
    0,
    1,
  );
  const prCommanded = Math.min(tune.boostReqPr, turbo.boostMaxPr);
  const pressureRatio = 1 + (prCommanded - 1) * Math.max(s, SPOOL_FLOOR);
  const turboSaturated = tune.boostReqPr > turbo.boostMaxPr;

  // 2. Manifold state (§3.2.2)
  const ambientKpa = perfConfig.ambientPressureKpa.value;
  const ambientK = perfConfig.ambientTempK.value;
  const pManKpa = pressureRatio * ambientKpa;
  const tCompK =
    ambientK * Math.pow(pressureRatio, GAMMA_RATIO_EXPONENT_NUM / (GAMMA_AIR * turbo.compressorEff));
  const tManK = ambientK + (tCompK - ambientK) * (1 - intercooler.effectiveness);
  const rhoKgM3 = pManKpa / (SPECIFIC_GAS_CONSTANT_AIR * tManK);

  // 3. Air (§3.2.3)
  const ve = interpolateKnots(
    rpm,
    perfConfig.volumetricEfficiencyKnots.rpmKnots,
    perfConfig.volumetricEfficiencyKnots.values,
  );
  const mairKg =
    rhoKgM3 *
    perfConfig.displacementM3.value *
    ve *
    intake.flowFactor *
    heads.flowFactor *
    camshaft.veFactor *
    exhaust.flowFactor;
  const maxAirPerCycleKg = turbo.maxAirKgS / (rpm / CYCLES_PER_SECOND_DIVISOR);
  const mairDelKg = Math.min(mairKg, maxAirPerCycleKg);
  const airCapped = mairDelKg < mairKg;

  // 4. Fuel request & injector ceiling (§3.2.4)
  const qReqMm3 = interpolateKnots(rpm, MODEL_RPM_KNOTS, tune.fuelReqKnotsMm3);
  const qReqEffMm3 = Math.min(qReqMm3, injectors.maxFuelMm3);
  const injectorTrimmed = qReqEffMm3 < qReqMm3;

  // 5. Fuel caps in mm³/stroke/cylinder (§3.2.5)
  const fuelDensityKgM3 = perfConfig.fuelDensityKgM3.value; // 835 kg/m³
  const kgPerMm3 = fuelDensityKgM3 * 1e-9; // 8.35e-7 kg/mm³

  const capTuneMm3 = qReqEffMm3;
  const flowKgH = cp3.flowBaseKgH + cp3.flowSlopeKgHPerRpm * rpm;
  const capCp3Mm3 = ((flowKgH / (INJECTIONS_PER_HOUR_PER_RPM * rpm)) / fuelDensityKgM3) * 1e9;
  const capSmokeMm3 = ((mairDelKg / CYLINDER_COUNT) / tune.afrMin / fuelDensityKgM3) * 1e9;
  const capEgtMm3 = solveEgtCapMm3(mairDelKg, tune.egtLimitF, kgPerMm3);

  const capsMm3 = {
    tune: capTuneMm3,
    cp3: capCp3Mm3,
    smoke: capSmokeMm3,
    egt: capEgtMm3,
  };

  const fuelMm3 = Math.min(capTuneMm3, capCp3Mm3, capSmokeMm3, capEgtMm3);

  // 6. Torque & power (§3.2.6)
  const mfKg = CYLINDER_COUNT * fuelMm3 * kgPerMm3;
  const etaBase = interpolateKnots(
    rpm,
    perfConfig.thermalEfficiencyKnots.rpmKnots,
    perfConfig.thermalEfficiencyKnots.values,
  );
  const eta =
    etaBase * (compressionEfficiencyFactor(pistons.compressionRatio) / BASELINE_CR_FACTOR);
  const workPerCycleJ = eta * mfKg * (perfConfig.fuelLhvMjKg.value * 1e6);
  const torqueNm = workPerCycleJ / (4 * Math.PI);
  const torqueLbFt = torqueNm * LB_FT_PER_NM;
  const powerHp = (torqueLbFt * rpm) / HP_TORQUE_RPM_DIVISOR;

  // 7. Binding-limit attribution (§3.3 — tie order: smoke/turbo, egt, cp3, tune within 0.01 mm³)
  let limit: LimitKind;
  let limitDetail: string;

  if (capsMm3.smoke - fuelMm3 <= CAP_TIE_TOLERANCE_MM3) {
    if (turboSaturated || airCapped) {
      limit = 'turbo';
      if (turboSaturated && airCapped) {
        limitDetail = `turbo boost & choke ceiling (PR ${turbo.boostMaxPr.toFixed(2)})`;
      } else if (turboSaturated) {
        limitDetail = `turbo boost ceiling (PR ${turbo.boostMaxPr.toFixed(2)})`;
      } else {
        limitDetail = `compressor choke flow (${turbo.maxAirKgS.toFixed(2)} kg/s)`;
      }
    } else {
      limit = 'smoke';
      limitDetail = `AFR ${tune.afrMin.toFixed(1)} at delivered boost`;
    }
  } else if (capsMm3.egt - fuelMm3 <= CAP_TIE_TOLERANCE_MM3) {
    limit = 'egt';
    limitDetail = `EGT ceiling (${Math.round(tune.egtLimitF)} °F)`;
  } else if (capsMm3.cp3 - fuelMm3 <= CAP_TIE_TOLERANCE_MM3) {
    limit = 'cp3';
    limitDetail = 'CP3 pump flow capacity';
  } else {
    limit = 'tune';
    limitDetail = injectorTrimmed ? 'injector flow ceiling' : 'fuel request';
  }

  const boostPsiGauge = (pressureRatio - 1) * PSI_PER_ATM;
  const afr = fuelMm3 > 0 ? mairDelKg / (CYLINDER_COUNT * fuelMm3 * kgPerMm3) : Infinity;
  const egtF = computeEgtAtFuelF(fuelMm3, mairDelKg, kgPerMm3);

  return {
    torqueLbFt,
    powerHp,
    uncertaintyPct: UNCERTAINTY_PCT,
    detail: {
      rpm,
      fuelMm3,
      pressureRatio,
      boostPsiGauge,
      afr,
      egtF,
      capsMm3,
      limit,
      limitDetail,
    },
  };
}

function evaluateGrid(build: Build, catalog?: PartVariant[]): EvaluatedGridPoint[] {
  const resolved = resolveBuild(build, catalog);
  return RPM_GRID.map((rpm) => evaluatePoint(rpm, resolved));
}

export function computeCurve(build: Build, catalog?: PartVariant[]): PerformanceResult {
  const points = evaluateGrid(build, catalog);
  return {
    rpmPoints: points.map((p) => p.detail.rpm),
    torqueLbFt: points.map((p) => p.torqueLbFt),
    powerHp: points.map((p) => p.powerHp),
    bindingLimitPerPoint: points.map((p) => p.detail.limit),
    uncertaintyPct: points.map((p) => p.uncertaintyPct),
  };
}

export function computeDetails(build: Build, catalog?: PartVariant[]): DynoPointDetail[] {
  const points = evaluateGrid(build, catalog);
  return points.map((p) => p.detail);
}
