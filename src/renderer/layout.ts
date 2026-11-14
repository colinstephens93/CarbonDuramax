// Pure Milestone 3 layout & clearance geometry module (docs/specs/M3-full-engine.md §§3–5, 11–12).
// Computes station centers, shared-pin rod seats, bank coordinate frames, §4 lifter/pushrod gallery
// coordinates, exterior shell registration parameters, and inter-part clearance metrics from config.

import { detailConfig as defaultDetailConfig, type DetailConfig } from '../config/detailConfig';
import { engineConfig as defaultEngineConfig } from '../config/engineConfig';
import { valveConfig as defaultValveConfig, type ValveConfig } from '../config/valveConfig';
import type { Bank, CylinderId, EngineConfig } from '../core/interfaces';
import { bankBoreAxis } from '../core/kinematics';

export type Vec3Tuple = readonly [number, number, number];

export interface LocalXwbMm {
  readonly xMm: number;
  readonly wMm: number;
  readonly bMm: number;
}

export interface StationLayout {
  readonly stationIndex: 0 | 1 | 2 | 3;
  readonly rhCylinder: CylinderId;
  readonly lhCylinder: CylinderId;
  readonly centerXMm: number;
  readonly centerXM: number;
}

export interface CylinderLayout {
  readonly cylinder: CylinderId;
  readonly bank: Bank;
  readonly stationIndex: 0 | 1 | 2 | 3;
  readonly stationCenterXMm: number;
  readonly stationCenterXM: number;
  readonly rodSeatOffsetMm: number;
  readonly rodSeatXMm: number;
  readonly rodSeatXM: number;
  /** Unit vector along crank axis (+X toward front for bank-local coordinates on both banks). */
  readonly bankAxisX: Vec3Tuple;
  /** Unit vector in bank plane pointing toward the V-valley (+W). */
  readonly valleyAxisW: Vec3Tuple;
  /** Unit vector along cylinder bore axis from crank axis toward head (+B). */
  readonly boreAxisB: Vec3Tuple;
  /**
   * Proper right-handed X basis vector (valleyAxisW x boreAxisB) so [meshBasisX, valleyAxisW, boreAxisB]
   * has determinant +1 on both banks (+X on RH, -X on LH), avoiding inverted winding in InstancedMesh.
   */
  readonly meshBasisX: Vec3Tuple;
}

export interface ValvetrainLayoutMm {
  readonly tdcWristBMm: number;
  readonly bdcWristBMm: number;
  readonly deckBMm: number;
  readonly springSeatBMm: number;
  readonly rockerShaftBMm: number;
  readonly valveInsetMm: number;
  readonly valveHalfPairXMm: number;
  readonly valveRowOffsetMm: number;
  readonly springFreeLengthMm: number;
  readonly rockerCupXOffsetMm: number;
  readonly rockerCupIntakeValleyOffsetMm: number;
  readonly rockerCupExhaustValleyOffsetMm: number;
  readonly pushrodNominalLengthMm: number;
  readonly pushrodRadiusMm: number;
  readonly lifterBodyRadiusMm: number;
  readonly intakeLifterTopMm: LocalXwbMm;
  readonly exhaustLifterTopMm: LocalXwbMm;
  readonly intakeCupRestMm: LocalXwbMm;
  readonly exhaustCupRestMm: LocalXwbMm;
}

export interface ExteriorRegistrationSpec {
  /** Uniform scale factor applied to Duramax_LLY_2005_66L_V8.glb (non-uniform scaling forbidden). */
  readonly uniformScale: number;
  /** Proper orthogonal rotation R (det = +1) mapping file (x_f, y_f, z_f) -> project (z_f, x_f, y_f). */
  readonly basisColumnsProjectFromFile: readonly [Vec3Tuple, Vec3Tuple, Vec3Tuple];
  /** Measured crank axis position in file world space: (X_file = 0, Y_file = -0.260 m, Z_file). */
  readonly fileCrankAxisXYM: readonly [number, number];
  /** Measured crank-axis cluster Z_file endpoints (rear flywheel at -0.7825 m, front pulley at +1.3030 m). */
  readonly fileCrankClusterZRangeM: readonly [number, number];
  /** Scene-evaluated file world bounds [min, max] in meters. */
  readonly fileSceneBoundsM: {
    readonly min: Vec3Tuple;
    readonly max: Vec3Tuple;
  };
  /** Project-space translation (meters) placing the file crank axis strictly on (Y=0, Z=0). */
  readonly translationM: Vec3Tuple;
  /** Resulting scaled & registered exterior bounds in project space (mm). */
  readonly projectBoundsMm: {
    readonly min: Vec3Tuple;
    readonly max: Vec3Tuple;
    readonly span: Vec3Tuple;
  };
  /** Rear overhang A (mm) behind X = 0 rear block plane (shell min X = -rearOverhangMm). */
  readonly rearOverhangMm: number;
}

export interface EngineLayout {
  readonly blockLengthMm: number;
  readonly blockCenterXMm: number;
  readonly mainShaftRadiusMm: number;
  readonly stations: readonly [StationLayout, StationLayout, StationLayout, StationLayout];
  readonly cylinders: Record<CylinderId, CylinderLayout>;
  readonly valvetrainMm: ValvetrainLayoutMm;
  readonly exterior: ExteriorRegistrationSpec;
}

export interface LayoutClearanceReportMm {
  readonly pistonRadiusMm: number;
  readonly pushrodRadiusMm: number;
  readonly lifterBodyRadiusMm: number;
  readonly pistonPushrodThresholdMm: number;
  readonly pistonLifterThresholdMm: number;
  readonly pistonSweptBandBMm: readonly [number, number];
  readonly ownBorePushrodMinRadialMm: {
    readonly intake: number;
    readonly exhaust: number;
  };
  readonly neighborBorePushrodMinRadialMm: {
    readonly intake: number;
    readonly exhaust: number;
  };
  readonly ownBoreLifterAxisDistMm: {
    readonly intake: number;
    readonly exhaust: number;
  };
  readonly neighborBoreLifterAxisDistMm: {
    readonly intake: number;
    readonly exhaust: number;
  };
  readonly crossCylinderPushrodMinCenterDistMm: number;
  readonly nearestLifterCenterSpacingMm: number;
}

const CYLINDER_IDS: readonly CylinderId[] = [1, 2, 3, 4, 5, 6, 7, 8];
const STATION_PAIR_DEFS: ReadonlyArray<{
  stationIndex: 0 | 1 | 2 | 3;
  rhCylinder: CylinderId;
  lhCylinder: CylinderId;
}> = [
  { stationIndex: 0, rhCylinder: 1, lhCylinder: 2 },
  { stationIndex: 1, rhCylinder: 3, lhCylinder: 4 },
  { stationIndex: 2, rhCylinder: 5, lhCylinder: 6 },
  { stationIndex: 3, rhCylinder: 7, lhCylinder: 8 },
];

// Piston skirt allowance below wrist-pin centerline per M2 GLB contract (height <= compHeight + 25 mm).
const PISTON_SKIRT_BELOW_WRIST_ALLOWANCE_MM = 25;

/**
 * Computes bank-local unit vectors in project space:
 * - bankAxisX = (+1, 0, 0) along crank toward front
 * - valleyAxisW = in-bank perpendicular pointing into the 90 deg V-valley
 * - boreAxisB = bankBoreAxis(bank) along bore toward head
 * - meshBasisX = valleyAxisW x boreAxisB (+X on RH, -X on LH) so [meshBasisX, valleyAxisW, boreAxisB] in SO(3)
 */
export function bankFrameAxes(bank: Bank): {
  bankAxisX: Vec3Tuple;
  valleyAxisW: Vec3Tuple;
  boreAxisB: Vec3Tuple;
  meshBasisX: Vec3Tuple;
} {
  const bore = bankBoreAxis(bank);
  const boreAxisB: Vec3Tuple = [bore[0], bore[1], bore[2]];
  // RH bore is (0, -sin45, +cos45) -> valley (+W) is (0, +cos45, +sin45).
  // LH bore is (0, +sin45, +cos45) -> valley (+W) is (0, -cos45, +sin45).
  const valleyAxisW: Vec3Tuple =
    bank === 'RH' ? [0, bore[2], -bore[1]] : [0, -bore[2], bore[1]];
  const bankAxisX: Vec3Tuple = [1, 0, 0];
  const meshBasisX: Vec3Tuple = bank === 'RH' ? [1, 0, 0] : [-1, 0, 0];
  return { bankAxisX, valleyAxisW, boreAxisB, meshBasisX };
}

/**
 * Converts a bank-local coordinate (xMm, wMm, bMm) at stationCenterXMm into project world coordinates (mm).
 */
export function bankLocalToWorldMm(
  stationCenterXMm: number,
  bank: Bank,
  local: LocalXwbMm,
): Vec3Tuple {
  const { valleyAxisW, boreAxisB } = bankFrameAxes(bank);
  return [
    stationCenterXMm + local.xMm,
    local.wMm * valleyAxisW[1] + local.bMm * boreAxisB[1],
    local.wMm * valleyAxisW[2] + local.bMm * boreAxisB[2],
  ];
}

export function computeStationCenterXMm(
  stationIndex: 0 | 1 | 2 | 3,
  borePitchMm: number,
): number {
  return (3.5 - stationIndex) * borePitchMm;
}

export function computeRodSeatOffsetMm(bank: Bank, rodSeatOffsetMagnitudeMm: number): number {
  return bank === 'RH' ? -rodSeatOffsetMagnitudeMm : +rodSeatOffsetMagnitudeMm;
}

export function computeEngineLayout(
  config: EngineConfig = defaultEngineConfig,
  valveCfg: ValveConfig = defaultValveConfig,
  detailCfg: DetailConfig = defaultDetailConfig,
): EngineLayout {
  const borePitchMm = valveCfg.borePitch.value;
  const blockLengthMm = 4 * borePitchMm;
  const blockCenterXMm = 0.5 * blockLengthMm;

  const stations = STATION_PAIR_DEFS.map((def) => {
    const centerXMm = computeStationCenterXMm(def.stationIndex, borePitchMm);
    return {
      stationIndex: def.stationIndex,
      rhCylinder: def.rhCylinder,
      lhCylinder: def.lhCylinder,
      centerXMm,
      centerXM: centerXMm / 1000,
    };
  }) as unknown as readonly [StationLayout, StationLayout, StationLayout, StationLayout];

  const cylinders = {} as Record<CylinderId, CylinderLayout>;
  for (const cyl of CYLINDER_IDS) {
    const bank = config.bankAssignment[cyl];
    const stationIndex = Math.floor((cyl - 1) / 2) as 0 | 1 | 2 | 3;
    const stationCenterXMm = computeStationCenterXMm(stationIndex, borePitchMm);
    const rodSeatOffsetMm = computeRodSeatOffsetMm(bank, detailCfg.rodSeatOffsetMm.value);
    const rodSeatXMm = stationCenterXMm + rodSeatOffsetMm;
    const axes = bankFrameAxes(bank);

    cylinders[cyl] = {
      cylinder: cyl,
      bank,
      stationIndex,
      stationCenterXMm,
      stationCenterXM: stationCenterXMm / 1000,
      rodSeatOffsetMm,
      rodSeatXMm,
      rodSeatXM: rodSeatXMm / 1000,
      ...axes,
    };
  }

  const crankThrowMm = config.crankThrowMm.value;
  const rodLengthMm = config.rodLengthMm.value;
  const compHeightMm = detailCfg.pistonCompressionHeightMm.value;
  const deckGapMm = valveCfg.deckGap.value;

  const tdcWristBMm = crankThrowMm + rodLengthMm;
  const bdcWristBMm = rodLengthMm - crankThrowMm;
  const deckBMm = tdcWristBMm + compHeightMm + deckGapMm;
  const springSeatBMm = deckBMm + detailCfg.springSeatHeightMm.value;
  const rockerShaftBMm = deckBMm + detailCfg.rockerShaftHeightMm.value;

  const rockerCupXOffsetMm = detailCfg.rockerTailXOffsetMm.value;
  const rockerCupIntakeValleyOffsetMm = detailCfg.rockerCupIntakeValleyOffsetMm.value;
  const rockerCupExhaustValleyOffsetMm = detailCfg.rockerCupExhaustValleyOffsetMm.value;
  const lifterTopBMm = detailCfg.lifterTopBoreOffsetMm.value;
  const pushrodRadiusMm = 0.5 * detailCfg.pushrodDiameterMm.value;
  const lifterBodyRadiusMm = 0.5 * detailCfg.lifterBodyDiameterMm.value;

  const valvetrainMm: ValvetrainLayoutMm = {
    tdcWristBMm,
    bdcWristBMm,
    deckBMm,
    springSeatBMm,
    rockerShaftBMm,
    valveInsetMm: detailCfg.valveInsetMm.value,
    valveHalfPairXMm: 0.5 * detailCfg.valvePairSpacingMm.value,
    valveRowOffsetMm: detailCfg.valveRowOffsetMm.value,
    springFreeLengthMm: detailCfg.springFreeLengthMm.value,
    rockerCupXOffsetMm,
    rockerCupIntakeValleyOffsetMm,
    rockerCupExhaustValleyOffsetMm,
    pushrodNominalLengthMm: detailCfg.pushrodLengthMm.value,
    pushrodRadiusMm,
    lifterBodyRadiusMm,
    intakeLifterTopMm: {
      xMm: +detailCfg.lifterIntakeXOffsetMm.value,
      wMm: +detailCfg.lifterIntakeValleyOffsetMm.value,
      bMm: lifterTopBMm,
    },
    exhaustLifterTopMm: {
      xMm: -detailCfg.lifterExhaustXOffsetMm.value,
      wMm: +detailCfg.lifterExhaustValleyOffsetMm.value,
      bMm: lifterTopBMm,
    },
    intakeCupRestMm: {
      xMm: +rockerCupXOffsetMm,
      wMm: -rockerCupIntakeValleyOffsetMm,
      bMm: rockerShaftBMm,
    },
    exhaustCupRestMm: {
      xMm: -rockerCupXOffsetMm,
      wMm: +rockerCupExhaustValleyOffsetMm,
      bMm: rockerShaftBMm,
    },
  };

  // Exterior GLB registration (Spec §5):
  // Evaluated scene-graph bounds of Duramax_LLY_2005_66L_V8.glb:
  //   X_file in [-1.333498, +1.213536] m (vehicle lateral: -X RH, +X LH)
  //   Y_file in [-0.780000, +1.097862] m (+Y up)
  //   Z_file in [-1.131025, +1.601268] m (crank axis: -Z rear flywheel/turbo, +Z front balancer/fan)
  // Crankshaft & pulley/flywheel cluster axis line in file space: (X_file = 0.000, Y_file = -0.260, Z_file),
  // with bank midpoint at Z_file = +0.060 m.
  // Proper rotation R (det = +1) maps (x_f, y_f, z_f) -> (z_f, x_f, y_f).
  // Uniform scale s = 0.430 guarantees >= +21.4 mm 3D surface containment across all 8 cylinders'
  // valve covers and block walls at all crank angles.
  const uniformScale = 0.43;
  const fileCrankX = 0.0;
  const fileCrankY = -0.26;
  const fileBankMidZ = 0.06;
  const fileSceneMin: Vec3Tuple = [-1.333498, -0.78, -1.131025];
  const fileSceneMax: Vec3Tuple = [1.213536, 1.097862, 1.601268];

  const txM = blockCenterXMm / 1000 - uniformScale * fileBankMidZ; // 0.230 - 0.0258 = 0.2042 m
  const tyM = -uniformScale * fileCrankX; // 0.0 m (crank axis on Y_proj = 0)
  const tzM = -uniformScale * fileCrankY; // +0.1118 m (crank axis on Z_proj = 0)

  const projMinMm: Vec3Tuple = [
    (txM + uniformScale * fileSceneMin[2]) * 1000,
    (tyM + uniformScale * fileSceneMin[0]) * 1000,
    (tzM + uniformScale * fileSceneMin[1]) * 1000,
  ];
  const projMaxMm: Vec3Tuple = [
    (txM + uniformScale * fileSceneMax[2]) * 1000,
    (tyM + uniformScale * fileSceneMax[0]) * 1000,
    (tzM + uniformScale * fileSceneMax[1]) * 1000,
  ];

  const exterior: ExteriorRegistrationSpec = {
    uniformScale,
    basisColumnsProjectFromFile: [
      [0, 1, 0], // file +X -> project +Y
      [0, 0, 1], // file +Y -> project +Z
      [1, 0, 0], // file +Z -> project +X
    ],
    fileCrankAxisXYM: [fileCrankX, fileCrankY],
    fileCrankClusterZRangeM: [-0.7825, 1.303],
    fileSceneBoundsM: {
      min: fileSceneMin,
      max: fileSceneMax,
    },
    translationM: [txM, tyM, tzM],
    projectBoundsMm: {
      min: projMinMm,
      max: projMaxMm,
      span: [
        projMaxMm[0] - projMinMm[0],
        projMaxMm[1] - projMinMm[1],
        projMaxMm[2] - projMinMm[2],
      ],
    },
    rearOverhangMm: -projMinMm[0],
  };

  const mainShaftRadiusMm = 0.5 * detailCfg.mainJournalDiameterMm.value;

  return {
    blockLengthMm,
    blockCenterXMm,
    mainShaftRadiusMm,
    stations,
    cylinders,
    valvetrainMm,
    exterior,
  };
}

/**
 * Minimum radial distance from a 3D line segment p0 -> p1 (in bank-local X, W, B)
 * to a parallel bore axis at (X = boreAxisXMm, W = 0) within B in [bandBLoMm, bandBHiMm].
 */
export function minSegmentRadialDistToBoreAxisInBandMm(
  p0: LocalXwbMm,
  p1: LocalXwbMm,
  boreAxisXMm: number,
  bandBLoMm: number,
  bandBHiMm: number,
): number {
  const db = p1.bMm - p0.bMm;
  let t0 = db !== 0 ? (bandBLoMm - p0.bMm) / db : 0;
  let t1 = db !== 0 ? (bandBHiMm - p0.bMm) / db : 1;
  t0 = Math.max(0, Math.min(1, t0));
  t1 = Math.max(0, Math.min(1, t1));
  if (t0 > t1) {
    const tmp = t0;
    t0 = t1;
    t1 = tmp;
  }

  const dx = p1.xMm - p0.xMm;
  const dw = p1.wMm - p0.wMm;
  const xRel0 = p0.xMm - boreAxisXMm;
  const wRel0 = p0.wMm;

  const denom = dx * dx + dw * dw;
  const tStar = denom > 1e-12 ? -(xRel0 * dx + wRel0 * dw) / denom : t0;
  const tClamped = Math.max(t0, Math.min(t1, tStar));

  return Math.hypot(xRel0 + tClamped * dx, wRel0 + tClamped * dw);
}

/**
 * Exact minimum Euclidean distance between two 3D line segments [a0, a1] and [b0, b1].
 */
export function segmentToSegmentDistance3dMm(
  a0: LocalXwbMm,
  a1: LocalXwbMm,
  b0: LocalXwbMm,
  b1: LocalXwbMm,
): number {
  const ux = a1.xMm - a0.xMm;
  const uw = a1.wMm - a0.wMm;
  const ub = a1.bMm - a0.bMm;

  const vx = b1.xMm - b0.xMm;
  const vw = b1.wMm - b0.wMm;
  const vb = b1.bMm - b0.bMm;

  const wx = a0.xMm - b0.xMm;
  const ww = a0.wMm - b0.wMm;
  const wb = a0.bMm - b0.bMm;

  const a = ux * ux + uw * uw + ub * ub;
  const b = ux * vx + uw * vw + ub * vb;
  const c = vx * vx + vw * vw + vb * vb;
  const d = ux * wx + uw * ww + ub * wb;
  const e = vx * wx + vw * ww + vb * wb;
  const D = a * c - b * b;

  let sN: number;
  let sD = D;
  let tN: number;
  let tD = D;

  if (D < 1e-12) {
    sN = 0.0;
    sD = 1.0;
    tN = e;
    tD = c;
  } else {
    sN = b * e - c * d;
    tN = a * e - b * d;
    if (sN < 0.0) {
      sN = 0.0;
      tN = e;
      tD = c;
    } else if (sN > sD) {
      sN = sD;
      tN = e + b;
      tD = c;
    }
  }

  if (tN < 0.0) {
    tN = 0.0;
    if (-d < 0.0) {
      sN = 0.0;
    } else if (-d > a) {
      sN = sD;
    } else {
      sN = -d;
      sD = a;
    }
  } else if (tN > tD) {
    tN = tD;
    if (-d + b < 0.0) {
      sN = 0;
    } else if (-d + b > a) {
      sN = sD;
    } else {
      sN = -d + b;
      sD = a;
    }
  }

  const sc = Math.abs(sN) < 1e-12 ? 0.0 : sN / sD;
  const tc = Math.abs(tN) < 1e-12 ? 0.0 : tN / tD;

  const dx = wx + sc * ux - tc * vx;
  const dw = ww + sc * uw - tc * vw;
  const db = wb + sc * ub - tc * vb;
  return Math.hypot(dx, dw, db);
}

/**
 * Computes all Spec §11 / §12.2 valvetrain & piston-sweep clearance distances from config.
 */
export function computeLayoutClearancesMm(
  config: EngineConfig = defaultEngineConfig,
  valveCfg: ValveConfig = defaultValveConfig,
  detailCfg: DetailConfig = defaultDetailConfig,
): LayoutClearanceReportMm {
  const layout = computeEngineLayout(config, valveCfg, detailCfg);
  const vt = layout.valvetrainMm;
  const pitchMm = valveCfg.borePitch.value;

  const pistonRadiusMm = 0.5 * (config.boreMm.value - detailCfg.pistonSkirtClearanceMm.value);
  const pushrodRadiusMm = vt.pushrodRadiusMm;
  const lifterBodyRadiusMm = vt.lifterBodyRadiusMm;

  const sweptLoBMm = vt.bdcWristBMm - PISTON_SKIRT_BELOW_WRIST_ALLOWANCE_MM;
  const sweptHiBMm = vt.tdcWristBMm + detailCfg.pistonCompressionHeightMm.value;

  const ownIntakeRadialMm = minSegmentRadialDistToBoreAxisInBandMm(
    vt.intakeLifterTopMm,
    vt.intakeCupRestMm,
    0,
    sweptLoBMm,
    sweptHiBMm,
  );
  const ownExhaustRadialMm = minSegmentRadialDistToBoreAxisInBandMm(
    vt.exhaustLifterTopMm,
    vt.exhaustCupRestMm,
    0,
    sweptLoBMm,
    sweptHiBMm,
  );

  // Nearest neighboring bore axis on the same bank: +pitchMm for intake (+X side), -pitchMm for exhaust (-X side)
  const neighborIntakeRadialMm = Math.min(
    minSegmentRadialDistToBoreAxisInBandMm(
      vt.intakeLifterTopMm,
      vt.intakeCupRestMm,
      +pitchMm,
      sweptLoBMm,
      sweptHiBMm,
    ),
    minSegmentRadialDistToBoreAxisInBandMm(
      vt.intakeLifterTopMm,
      vt.intakeCupRestMm,
      -pitchMm,
      sweptLoBMm,
      sweptHiBMm,
    ),
  );
  const neighborExhaustRadialMm = Math.min(
    minSegmentRadialDistToBoreAxisInBandMm(
      vt.exhaustLifterTopMm,
      vt.exhaustCupRestMm,
      -pitchMm,
      sweptLoBMm,
      sweptHiBMm,
    ),
    minSegmentRadialDistToBoreAxisInBandMm(
      vt.exhaustLifterTopMm,
      vt.exhaustCupRestMm,
      +pitchMm,
      sweptLoBMm,
      sweptHiBMm,
    ),
  );

  const ownIntakeLifterDistMm = Math.hypot(vt.intakeLifterTopMm.xMm, vt.intakeLifterTopMm.wMm);
  const ownExhaustLifterDistMm = Math.hypot(vt.exhaustLifterTopMm.xMm, vt.exhaustLifterTopMm.wMm);

  const neighborIntakeLifterDistMm = Math.min(
    Math.hypot(vt.intakeLifterTopMm.xMm - pitchMm, vt.intakeLifterTopMm.wMm),
    Math.hypot(vt.intakeLifterTopMm.xMm + pitchMm, vt.intakeLifterTopMm.wMm),
  );
  const neighborExhaustLifterDistMm = Math.min(
    Math.hypot(vt.exhaustLifterTopMm.xMm + pitchMm, vt.exhaustLifterTopMm.wMm),
    Math.hypot(vt.exhaustLifterTopMm.xMm - pitchMm, vt.exhaustLifterTopMm.wMm),
  );

  // Cross-cylinder pushrods: rear neighbor's intake (shifted by -pitchMm) vs own exhaust
  // (equivalent by translation to own intake vs front neighbor's exhaust shifted by +pitchMm)
  const rearNeighborIntakeBottom: LocalXwbMm = {
    xMm: vt.intakeLifterTopMm.xMm - pitchMm,
    wMm: vt.intakeLifterTopMm.wMm,
    bMm: vt.intakeLifterTopMm.bMm,
  };
  const rearNeighborIntakeTop: LocalXwbMm = {
    xMm: vt.intakeCupRestMm.xMm - pitchMm,
    wMm: vt.intakeCupRestMm.wMm,
    bMm: vt.intakeCupRestMm.bMm,
  };
  const crossCylinderPushrodMinCenterDistMm = segmentToSegmentDistance3dMm(
    rearNeighborIntakeBottom,
    rearNeighborIntakeTop,
    vt.exhaustLifterTopMm,
    vt.exhaustCupRestMm,
  );

  // Nearest lifter-to-lifter center distance along a bank gallery row
  const ownIntakeToOwnExhaustMm = Math.hypot(
    vt.intakeLifterTopMm.xMm - vt.exhaustLifterTopMm.xMm,
    vt.intakeLifterTopMm.wMm - vt.exhaustLifterTopMm.wMm,
  );
  const rearNeighborIntakeToOwnExhaustMm = Math.hypot(
    rearNeighborIntakeBottom.xMm - vt.exhaustLifterTopMm.xMm,
    rearNeighborIntakeBottom.wMm - vt.exhaustLifterTopMm.wMm,
  );
  const nearestLifterCenterSpacingMm = Math.min(
    ownIntakeToOwnExhaustMm,
    rearNeighborIntakeToOwnExhaustMm,
  );

  return {
    pistonRadiusMm,
    pushrodRadiusMm,
    lifterBodyRadiusMm,
    pistonPushrodThresholdMm: pistonRadiusMm + pushrodRadiusMm,
    pistonLifterThresholdMm: pistonRadiusMm + lifterBodyRadiusMm,
    pistonSweptBandBMm: [sweptLoBMm, sweptHiBMm],
    ownBorePushrodMinRadialMm: {
      intake: ownIntakeRadialMm,
      exhaust: ownExhaustRadialMm,
    },
    neighborBorePushrodMinRadialMm: {
      intake: neighborIntakeRadialMm,
      exhaust: neighborExhaustRadialMm,
    },
    ownBoreLifterAxisDistMm: {
      intake: ownIntakeLifterDistMm,
      exhaust: ownExhaustLifterDistMm,
    },
    neighborBoreLifterAxisDistMm: {
      intake: neighborIntakeLifterDistMm,
      exhaust: neighborExhaustLifterDistMm,
    },
    crossCylinderPushrodMinCenterDistMm,
    nearestLifterCenterSpacingMm,
  };
}
