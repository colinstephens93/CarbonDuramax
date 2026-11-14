// Pure Milestone 4 view layout module (docs/specs/M4-views.md §§3, 4, 6, 10).
// Defines explode offsets keyed by part group, pushrod elongation metrics, section-plane
// slider ranges & signed-distance math, and the 23 3D label anchors (15 part labels + 8 cylinder
// numbers) — strictly pure TypeScript with zero three.js imports so it is directly unit-testable.

import { detailConfig as defaultDetailConfig, type DetailConfig } from '../config/detailConfig';
import { engineConfig as defaultEngineConfig } from '../config/engineConfig';
import { valveConfig as defaultValveConfig, type ValveConfig } from '../config/valveConfig';
import type { CrankState, CylinderId, EngineConfig } from '../core/interfaces';
import { crankPinPositionM } from '../core/kinematics';
import {
  bankLocalToWorldMm,
  computeEngineLayout,
  type EngineLayout,
  type LocalXwbMm,
  type Vec3Tuple,
} from './layout';

export type SectionMode = 'off' | 'x' | 'y';
export type ActiveSectionMode = 'x' | 'y';

export type ExplodePartGroup =
  | 'mainShaft'
  | 'exteriorShell'
  | 'crankThrow'
  | 'piston'
  | 'conrod'
  | 'headGroup'
  | 'head'
  | 'injector'
  | 'valve'
  | 'spring'
  | 'bridge'
  | 'rocker'
  | 'lifterGroup'
  | 'lifter'
  | 'pushrodBottom'
  | 'pushrodTop';

export interface ExplodePartGroupOffsetMm {
  readonly dxMm: number;
  readonly dbMm: number;
}

export interface SectionRangeSpecMm {
  readonly minMm: number;
  readonly maxMm: number;
  readonly defaultMm: number;
  readonly stepMm: number;
}

export interface SectionPlaneParamsM {
  readonly normal: Vec3Tuple;
  readonly constantM: number;
}

export interface ChannelPushrodExplodeReportMm {
  readonly restLengthAtZeroMm: number;
  readonly lengthAtFactorMm: number;
  readonly elongationMm: number;
  readonly growthPercent: number;
  readonly bottomLocalMm: LocalXwbMm;
  readonly topLocalMm: LocalXwbMm;
}

export interface PushrodExplodeReportMm {
  readonly intake: ChannelPushrodExplodeReportMm;
  readonly exhaust: ChannelPushrodExplodeReportMm;
}

export type LabelCategory = 'internal-part' | 'exterior-part' | 'cylinder-number';

export interface LabelAnchorDefinition {
  readonly id: string;
  readonly text: string;
  readonly category: LabelCategory;
  readonly cylinder?: CylinderId;
}

export interface EvaluatedLabelAnchorMm {
  readonly id: string;
  readonly text: string;
  readonly category: LabelCategory;
  readonly worldMm: Vec3Tuple;
  readonly worldM: Vec3Tuple;
}

/** Station spread gain along project X: spreadX = (stationCenterX - engineCenterX) * 0.8 * e (Spec §3.1). */
export const EXPLODE_STATION_SPREAD_GAIN = 0.8;

/** Head-group lift along each cylinder's bore axis (+B) at e = 1 in mm (Spec §3.2). */
export const EXPLODE_HEAD_LIFT_MAX_MM = 110;

/** Lifter-group lift along each cylinder's bore axis (+B) at e = 1 in mm (Spec §3.3). */
export const EXPLODE_LIFTER_LIFT_MAX_MM = 55;

/** Axial endpoints of the turned main crankshaft in mm relative to rear/front block planes (Spec §3, §6). */
export const MAIN_SHAFT_REAR_FLANGE_X_MM = -18;
export const MAIN_SHAFT_FRONT_SNOUT_OFFSET_MM = 18;

/** Bore-axis clearance above fuel injector top for cylinder number chips 1..8 (mm). */
const CYLINDER_CHIP_ABOVE_INJECTOR_MM = 32;

/**
 * Fixed project-space anchor points (mm) on the registered Duramax_LLY_2005_66L_V8.glb shell (Spec §6):
 * - turbocharger: upper centerline of V-valley turbocharger housing (`turbo/node_161`, X in [-149.3, +36.5], Y = 0, Z in [278.4, 510.2])
 * - harmonic-balancer: front hub center of crank damper pulley (`beltDrive/node_272`, X in [722.4, 764.5], Y = 0, Z center = -43.0)
 * - oil-pan: geometric center of lower deep oil-pan sump (`blockPan/node_30/node_27`, X in [-19.4, +290.2], Y in [-133.3, +133.3], Z in [-223.6, -120.4])
 */
export const EXTERIOR_SHELL_LABEL_ANCHORS_MM = {
  turbocharger: [-60.0, 0.0, 435.0] as Vec3Tuple,
  'harmonic-balancer': [760.6, 0.0, -43.0] as Vec3Tuple,
  'oil-pan': [135.4, 0.0, -172.0] as Vec3Tuple,
} as const;

/** Section position slider ranges and defaults in millimetres (Spec §4). */
export const SECTION_RANGES_MM: Readonly<Record<ActiveSectionMode, SectionRangeSpecMm>> = {
  x: {
    minMm: -150,
    maxMm: 900,
    defaultMm: 900,
    stepMm: 0.5,
  },
  y: {
    minMm: -580,
    maxMm: 580,
    defaultMm: 580,
    stepMm: 0.5,
  },
};

const PART_GROUP_EXPLODE_RULES: Readonly<
  Record<ExplodePartGroup, { readonly spreadsStation: boolean; readonly maxBoreLiftMm: number }>
> = {
  mainShaft: { spreadsStation: false, maxBoreLiftMm: 0 },
  exteriorShell: { spreadsStation: false, maxBoreLiftMm: 0 },
  crankThrow: { spreadsStation: true, maxBoreLiftMm: 0 },
  piston: { spreadsStation: true, maxBoreLiftMm: 0 },
  conrod: { spreadsStation: true, maxBoreLiftMm: 0 },
  headGroup: { spreadsStation: true, maxBoreLiftMm: EXPLODE_HEAD_LIFT_MAX_MM },
  head: { spreadsStation: true, maxBoreLiftMm: EXPLODE_HEAD_LIFT_MAX_MM },
  injector: { spreadsStation: true, maxBoreLiftMm: EXPLODE_HEAD_LIFT_MAX_MM },
  valve: { spreadsStation: true, maxBoreLiftMm: EXPLODE_HEAD_LIFT_MAX_MM },
  spring: { spreadsStation: true, maxBoreLiftMm: EXPLODE_HEAD_LIFT_MAX_MM },
  bridge: { spreadsStation: true, maxBoreLiftMm: EXPLODE_HEAD_LIFT_MAX_MM },
  rocker: { spreadsStation: true, maxBoreLiftMm: EXPLODE_HEAD_LIFT_MAX_MM },
  lifterGroup: { spreadsStation: true, maxBoreLiftMm: EXPLODE_LIFTER_LIFT_MAX_MM },
  lifter: { spreadsStation: true, maxBoreLiftMm: EXPLODE_LIFTER_LIFT_MAX_MM },
  pushrodBottom: { spreadsStation: true, maxBoreLiftMm: EXPLODE_LIFTER_LIFT_MAX_MM },
  pushrodTop: { spreadsStation: true, maxBoreLiftMm: EXPLODE_HEAD_LIFT_MAX_MM },
};

/** Canonical 23 label definitions (15 part labels + 8 cylinder numbers, Spec §6). */
export const LABEL_ANCHOR_DEFINITIONS: readonly LabelAnchorDefinition[] = [
  { id: 'piston', text: 'Piston', category: 'internal-part', cylinder: 1 },
  { id: 'connecting-rod', text: 'Connecting rod', category: 'internal-part', cylinder: 1 },
  { id: 'cylinder-head', text: 'Cylinder head', category: 'internal-part', cylinder: 1 },
  { id: 'intake-valves', text: 'Intake valves', category: 'internal-part', cylinder: 1 },
  { id: 'exhaust-valves', text: 'Exhaust valves', category: 'internal-part', cylinder: 1 },
  { id: 'valve-springs', text: 'Valve springs', category: 'internal-part', cylinder: 1 },
  { id: 'rocker-arms', text: 'Rocker arms', category: 'internal-part', cylinder: 1 },
  { id: 'pushrods', text: 'Pushrods', category: 'internal-part', cylinder: 1 },
  { id: 'lifters', text: 'Lifters', category: 'internal-part', cylinder: 1 },
  { id: 'fuel-injector', text: 'Fuel injector', category: 'internal-part', cylinder: 1 },
  { id: 'crankshaft', text: 'Crankshaft', category: 'internal-part' },
  { id: 'flywheel-flange', text: 'Flywheel flange', category: 'internal-part' },
  { id: 'turbocharger', text: 'Turbocharger', category: 'exterior-part' },
  { id: 'harmonic-balancer', text: 'Harmonic balancer', category: 'exterior-part' },
  { id: 'oil-pan', text: 'Oil pan', category: 'exterior-part' },
  { id: 'cyl-1', text: '1', category: 'cylinder-number', cylinder: 1 },
  { id: 'cyl-2', text: '2', category: 'cylinder-number', cylinder: 2 },
  { id: 'cyl-3', text: '3', category: 'cylinder-number', cylinder: 3 },
  { id: 'cyl-4', text: '4', category: 'cylinder-number', cylinder: 4 },
  { id: 'cyl-5', text: '5', category: 'cylinder-number', cylinder: 5 },
  { id: 'cyl-6', text: '6', category: 'cylinder-number', cylinder: 6 },
  { id: 'cyl-7', text: '7', category: 'cylinder-number', cylinder: 7 },
  { id: 'cyl-8', text: '8', category: 'cylinder-number', cylinder: 8 },
];

const CYLINDER_IDS: readonly CylinderId[] = [1, 2, 3, 4, 5, 6, 7, 8];

function normalizeZero(value: number): number {
  return value === 0 ? 0 : value;
}

export function clampExplodeFactor(e: number): number {
  if (!Number.isFinite(e) || e <= 0) {
    return 0;
  }
  if (e >= 1) {
    return 1;
  }
  return e;
}

/**
 * Station spread offset along project X (mm):
 *   spreadX(station) = (stationCenterXMm - engineCenterXMm) * 0.8 * e
 * Exactly 0 when e = 0.
 */
export function computeStationSpreadOffsetXMm(
  stationCenterXMm: number,
  engineCenterXMm: number,
  e: number,
): number {
  const factor = clampExplodeFactor(e);
  if (factor === 0) {
    return 0;
  }
  return normalizeZero((stationCenterXMm - engineCenterXMm) * EXPLODE_STATION_SPREAD_GAIN * factor);
}

/**
 * Exploded station center X coordinate in mm:
 *   stationCenterXMm + spreadX(station) = engineCenterXMm + (stationCenterXMm - engineCenterXMm) * (1 + 0.8 * e)
 */
export function computeExplodedStationCenterXMm(
  stationCenterXMm: number,
  engineCenterXMm: number,
  e: number,
): number {
  return normalizeZero(
    stationCenterXMm + computeStationSpreadOffsetXMm(stationCenterXMm, engineCenterXMm, e),
  );
}

/** Head-group bore-axis lift in mm: headLift = 110 * e (Spec §3.2). */
export function computeHeadLiftMm(e: number): number {
  const factor = clampExplodeFactor(e);
  return factor === 0 ? 0 : normalizeZero(EXPLODE_HEAD_LIFT_MAX_MM * factor);
}

/** Lifter-group bore-axis lift in mm: lifterLift = 55 * e (Spec §3.3). */
export function computeLifterLiftMm(e: number): number {
  const factor = clampExplodeFactor(e);
  return factor === 0 ? 0 : normalizeZero(EXPLODE_LIFTER_LIFT_MAX_MM * factor);
}

/**
 * Pure explode offset lookup keyed by part group (Spec §3).
 * Returns { dxMm, dbMm } where dxMm is added along project +X and dbMm along cylinder bore +B.
 */
export function computePartGroupExplodeOffsetMm(
  group: ExplodePartGroup,
  stationCenterXMm: number,
  engineCenterXMm: number,
  e: number,
): ExplodePartGroupOffsetMm {
  const factor = clampExplodeFactor(e);
  if (factor === 0) {
    return { dxMm: 0, dbMm: 0 };
  }
  const rule = PART_GROUP_EXPLODE_RULES[group];
  const dxMm = rule.spreadsStation
    ? computeStationSpreadOffsetXMm(stationCenterXMm, engineCenterXMm, factor)
    : 0;
  const dbMm = normalizeZero(rule.maxBoreLiftMm * factor);
  return { dxMm, dbMm };
}

/**
 * Computes intake and exhaust pushrod 3D endpoints, live lengths, and percentage length growth
 * from the M3 layout lifter/cup points and §3 explode lifts.
 */
export function computeExplodedPushrodGeometryMm(
  layout: EngineLayout,
  e: number,
  intakeLiftMm = 0,
  exhaustLiftMm = 0,
): PushrodExplodeReportMm {
  const vt = layout.valvetrainMm;
  const headLiftMm = computeHeadLiftMm(e);
  const lifterLiftMm = computeLifterLiftMm(e);

  const thetaIntake = Math.asin(
    Math.min(1, Math.max(-1, intakeLiftMm / vt.valveRowOffsetMm)),
  );
  const thetaExhaust = Math.asin(
    Math.min(1, Math.max(-1, exhaustLiftMm / vt.valveRowOffsetMm)),
  );

  const intakeRiseMm = vt.rockerCupIntakeValleyOffsetMm * Math.sin(thetaIntake);
  const exhaustRiseMm = vt.rockerCupExhaustValleyOffsetMm * Math.sin(thetaExhaust);

  const dist3d = (a: LocalXwbMm, b: LocalXwbMm): number =>
    Math.hypot(b.xMm - a.xMm, b.wMm - a.wMm, b.bMm - a.bMm);

  const intakeBottomZero: LocalXwbMm = {
    xMm: vt.intakeLifterTopMm.xMm,
    wMm: vt.intakeLifterTopMm.wMm,
    bMm: vt.intakeLifterTopMm.bMm + intakeRiseMm,
  };
  const intakeTopZero: LocalXwbMm = {
    xMm: +vt.rockerCupXOffsetMm,
    wMm: -vt.rockerCupIntakeValleyOffsetMm * Math.cos(thetaIntake),
    bMm: vt.rockerShaftBMm + intakeRiseMm,
  };
  const intakeBottomExploded: LocalXwbMm = {
    ...intakeBottomZero,
    bMm: intakeBottomZero.bMm + lifterLiftMm,
  };
  const intakeTopExploded: LocalXwbMm = {
    ...intakeTopZero,
    bMm: intakeTopZero.bMm + headLiftMm,
  };

  const intakeZeroLen = dist3d(intakeBottomZero, intakeTopZero);
  const intakeExplodedLen = dist3d(intakeBottomExploded, intakeTopExploded);

  const exhaustBottomZero: LocalXwbMm = {
    xMm: vt.exhaustLifterTopMm.xMm,
    wMm: vt.exhaustLifterTopMm.wMm,
    bMm: vt.exhaustLifterTopMm.bMm + exhaustRiseMm,
  };
  const exhaustTopZero: LocalXwbMm = {
    xMm: -vt.rockerCupXOffsetMm,
    wMm: +vt.rockerCupExhaustValleyOffsetMm * Math.cos(thetaExhaust),
    bMm: vt.rockerShaftBMm + exhaustRiseMm,
  };
  const exhaustBottomExploded: LocalXwbMm = {
    ...exhaustBottomZero,
    bMm: exhaustBottomZero.bMm + lifterLiftMm,
  };
  const exhaustTopExploded: LocalXwbMm = {
    ...exhaustTopZero,
    bMm: exhaustTopZero.bMm + headLiftMm,
  };

  const exhaustZeroLen = dist3d(exhaustBottomZero, exhaustTopZero);
  const exhaustExplodedLen = dist3d(exhaustBottomExploded, exhaustTopExploded);

  return {
    intake: {
      restLengthAtZeroMm: intakeZeroLen,
      lengthAtFactorMm: intakeExplodedLen,
      elongationMm: intakeExplodedLen - intakeZeroLen,
      growthPercent: ((intakeExplodedLen - intakeZeroLen) / intakeZeroLen) * 100,
      bottomLocalMm: intakeBottomExploded,
      topLocalMm: intakeTopExploded,
    },
    exhaust: {
      restLengthAtZeroMm: exhaustZeroLen,
      lengthAtFactorMm: exhaustExplodedLen,
      elongationMm: exhaustExplodedLen - exhaustZeroLen,
      growthPercent: ((exhaustExplodedLen - exhaustZeroLen) / exhaustZeroLen) * 100,
      bottomLocalMm: exhaustBottomExploded,
      topLocalMm: exhaustTopExploded,
    },
  };
}

/** Clamps a section slider position (mm) into the mode's valid range. */
export function clampSectionPositionMm(mode: ActiveSectionMode, positionMm: number): number {
  const spec = SECTION_RANGES_MM[mode];
  if (!Number.isFinite(positionMm)) {
    return spec.defaultMm;
  }
  return Math.max(spec.minMm, Math.min(spec.maxMm, positionMm));
}

/**
 * Pure section-plane parameters in scene units (metres) for Spec §4:
 * - Front–Back ('x'): normal (-1, 0, 0), constant +posMm / 1000 -> keeps n·p + c = posM - x >= 0 (x <= posM)
 * - Side ('y'):       normal (0, -1, 0), constant +posMm / 1000 -> keeps n·p + c = posM - y >= 0 (y <= posM)
 */
export function computeSectionPlaneParamsM(
  mode: ActiveSectionMode,
  positionMm: number,
): SectionPlaneParamsM {
  const constantM = normalizeZero(positionMm / 1000);
  if (mode === 'x') {
    return {
      normal: [-1, 0, 0],
      constantM,
    };
  }
  return {
    normal: [0, -1, 0],
    constantM,
  };
}

/** Signed distance n·p + constantM in metres (points with distance >= 0 are kept; < 0 are clipped). */
export function sectionPlaneSignedDistanceM(
  plane: SectionPlaneParamsM,
  pointM: Vec3Tuple,
): number {
  return (
    plane.normal[0] * pointM[0] +
    plane.normal[1] * pointM[1] +
    plane.normal[2] * pointM[2] +
    plane.constantM
  );
}

/**
 * Evaluates whether a label category is eligible to display given shell/x-ray/section state
 * (before camera behind/viewport checks, Spec §6):
 * - Exterior labels appear ONLY when the shell is visible (exteriorVisible || xrayEnabled).
 * - Internals labels (including cylinder numbers anchored to the internal heads) hide while the
 *   opaque shell is shown (exteriorVisible && !xrayEnabled).
 * - Any label whose 3D anchor lies on the clipped side of an active section plane (signedDistance < 0)
 *   is hidden.
 */
export function isLabelVisibleUnderViewRules(
  category: LabelCategory,
  worldM: Vec3Tuple,
  options: {
    exteriorVisible: boolean;
    xrayEnabled: boolean;
    sectionMode: SectionMode;
    sectionPositionMm: number;
  },
): boolean {
  const shellVisible = options.exteriorVisible || options.xrayEnabled;
  const opaqueShellShown = options.exteriorVisible && !options.xrayEnabled;

  if (category === 'exterior-part') {
    if (!shellVisible) {
      return false;
    }
  } else if (opaqueShellShown) {
    return false;
  }

  if (options.sectionMode !== 'off') {
    const plane = computeSectionPlaneParamsM(options.sectionMode, options.sectionPositionMm);
    if (sectionPlaneSignedDistanceM(plane, worldM) < 0) {
      return false;
    }
  }

  return true;
}

/**
 * Computes live 3D world positions (in both mm and m) for all 23 Spec §6 label anchors
 * from the exact M3/M4 kinematic & explode state.
 */
export function evaluateLabelAnchors(
  state: CrankState,
  explodeFactor: number,
  config: EngineConfig = defaultEngineConfig,
  valveCfg: ValveConfig = defaultValveConfig,
  detailCfg: DetailConfig = defaultDetailConfig,
  precomputedLayout?: EngineLayout,
): EvaluatedLabelAnchorMm[] {
  const layout = precomputedLayout ?? computeEngineLayout(config, valveCfg, detailCfg);
  const e = clampExplodeFactor(explodeFactor);
  const headLiftMm = computeHeadLiftMm(e);
  const lifterLiftMm = computeLifterLiftMm(e);
  const vt = layout.valvetrainMm;

  const cyl1 = layout.cylinders[1];
  const spread1XMm = computeStationSpreadOffsetXMm(
    cyl1.stationCenterXMm,
    layout.blockCenterXMm,
    e,
  );
  const explodedCyl1StationXMm = cyl1.stationCenterXMm + spread1XMm;
  const explodedCyl1RodSeatXMm = cyl1.rodSeatXMm + spread1XMm;

  const [, pin1YM, pin1ZM] = crankPinPositionM(config, valveCfg, 1, state.crankAngleDeg);
  const wrist1BMm = vt.tdcWristBMm - state.pistonPositionM[1] * 1000;
  const intakeLift1Mm = state.valveLiftM[1].intake * 1000;
  const exhaustLift1Mm = state.valveLiftM[1].exhaust * 1000;

  const thetaIntake1 = Math.asin(
    Math.min(1, Math.max(-1, intakeLift1Mm / vt.valveRowOffsetMm)),
  );
  const intakeRise1Mm = vt.rockerCupIntakeValleyOffsetMm * Math.sin(thetaIntake1);

  const compHeightMm = detailCfg.pistonCompressionHeightMm.value;
  const springSeatHeightMm = detailCfg.springSeatHeightMm.value;
  const bridgeHalfThickMm = 0.5 * detailCfg.bridgeThicknessMm.value;
  const injectorLengthMm = detailCfg.injectorLengthMm.value;

  // 1. Piston — cyl 1 piston, crown center
  const pistonCrownMm = bankLocalToWorldMm(explodedCyl1StationXMm, 'RH', {
    xMm: 0,
    wMm: 0,
    bMm: wrist1BMm + compHeightMm,
  });

  // 2. Connecting rod — cyl 1 rod, midpoint of the wrist–pin axis
  const pin1SeatMm: Vec3Tuple = [explodedCyl1RodSeatXMm, pin1YM * 1000, pin1ZM * 1000];
  const wrist1SeatMm: Vec3Tuple = [
    explodedCyl1RodSeatXMm,
    wrist1BMm * cyl1.boreAxisB[1],
    wrist1BMm * cyl1.boreAxisB[2],
  ];
  const conrodMidMm: Vec3Tuple = [
    0.5 * (pin1SeatMm[0] + wrist1SeatMm[0]),
    0.5 * (pin1SeatMm[1] + wrist1SeatMm[1]),
    0.5 * (pin1SeatMm[2] + wrist1SeatMm[2]),
  ];

  // 3. Cylinder head — cyl 1 head section, top-face center
  const cylHeadTopMm = bankLocalToWorldMm(explodedCyl1StationXMm, 'RH', {
    xMm: 0,
    wMm: 0,
    bMm: vt.deckBMm + springSeatHeightMm + headLiftMm,
  });

  // 4. Intake valves — cyl 1 intake bridge center
  const intakeBridgeMm = bankLocalToWorldMm(explodedCyl1StationXMm, 'RH', {
    xMm: 0,
    wMm: +vt.valveRowOffsetMm,
    bMm: vt.rockerShaftBMm - bridgeHalfThickMm - intakeLift1Mm + headLiftMm,
  });

  // 5. Exhaust valves — cyl 1 exhaust bridge center
  const exhaustBridgeMm = bankLocalToWorldMm(explodedCyl1StationXMm, 'RH', {
    xMm: 0,
    wMm: -vt.valveRowOffsetMm,
    bMm: vt.rockerShaftBMm - bridgeHalfThickMm - exhaustLift1Mm + headLiftMm,
  });

  // 6. Valve springs — cyl 1 intake spring pair, top midpoint
  const intakeSpringsTopMidMm = bankLocalToWorldMm(explodedCyl1StationXMm, 'RH', {
    xMm: 0,
    wMm: +vt.valveRowOffsetMm,
    bMm: vt.springSeatBMm + (vt.springFreeLengthMm - intakeLift1Mm) + headLiftMm,
  });

  // 7. Rocker arms — cyl 1 intake rocker, at the shaft point (midpoint of intake rocker shaft boss)
  const intakeRockerShaftPtMm = bankLocalToWorldMm(explodedCyl1StationXMm, 'RH', {
    xMm: 0.5 * vt.rockerCupXOffsetMm,
    wMm: 0,
    bMm: vt.rockerShaftBMm + headLiftMm,
  });

  // 8 & 9. Lifters (cyl 1 intake lifter, top point) & Pushrods (cyl 1 intake pushrod, mid-span)
  const intakeLifterTopWorldMm = bankLocalToWorldMm(explodedCyl1StationXMm, 'RH', {
    xMm: +vt.intakeLifterTopMm.xMm,
    wMm: +vt.intakeLifterTopMm.wMm,
    bMm: vt.intakeLifterTopMm.bMm + intakeRise1Mm + lifterLiftMm,
  });
  const intakeCupLiveWorldMm = bankLocalToWorldMm(explodedCyl1StationXMm, 'RH', {
    xMm: +vt.rockerCupXOffsetMm,
    wMm: -vt.rockerCupIntakeValleyOffsetMm * Math.cos(thetaIntake1),
    bMm: vt.rockerShaftBMm + intakeRise1Mm + headLiftMm,
  });
  const intakePushrodMidMm: Vec3Tuple = [
    0.5 * (intakeLifterTopWorldMm[0] + intakeCupLiveWorldMm[0]),
    0.5 * (intakeLifterTopWorldMm[1] + intakeCupLiveWorldMm[1]),
    0.5 * (intakeLifterTopWorldMm[2] + intakeCupLiveWorldMm[2]),
  ];

  // 10. Fuel injector — cyl 1 injector, top
  const fuelInjectorTopMm = bankLocalToWorldMm(explodedCyl1StationXMm, 'RH', {
    xMm: 0,
    wMm: 0,
    bMm: vt.deckBMm + injectorLengthMm + headLiftMm,
  });

  // 11 & 12. Crankshaft (front snout end, on the axis) & Flywheel flange (rear flange face center)
  const crankshaftFrontSnoutMm: Vec3Tuple = [
    layout.blockLengthMm + MAIN_SHAFT_FRONT_SNOUT_OFFSET_MM,
    0,
    0,
  ];
  const flywheelFlangeMm: Vec3Tuple = [MAIN_SHAFT_REAR_FLANGE_X_MM, 0, 0];

  const byIdMm: Record<string, Vec3Tuple> = {
    piston: pistonCrownMm,
    'connecting-rod': conrodMidMm,
    'cylinder-head': cylHeadTopMm,
    'intake-valves': intakeBridgeMm,
    'exhaust-valves': exhaustBridgeMm,
    'valve-springs': intakeSpringsTopMidMm,
    'rocker-arms': intakeRockerShaftPtMm,
    pushrods: intakePushrodMidMm,
    lifters: intakeLifterTopWorldMm,
    'fuel-injector': fuelInjectorTopMm,
    crankshaft: crankshaftFrontSnoutMm,
    'flywheel-flange': flywheelFlangeMm,
    turbocharger: EXTERIOR_SHELL_LABEL_ANCHORS_MM.turbocharger,
    'harmonic-balancer': EXTERIOR_SHELL_LABEL_ANCHORS_MM['harmonic-balancer'],
    'oil-pan': EXTERIOR_SHELL_LABEL_ANCHORS_MM['oil-pan'],
  };

  // 16..23. Cylinder numbers 1..8 anchored above each cylinder's head, following spread & head lift
  const chipBMm = vt.deckBMm + injectorLengthMm + CYLINDER_CHIP_ABOVE_INJECTOR_MM + headLiftMm;
  for (const cyl of CYLINDER_IDS) {
    const cl = layout.cylinders[cyl];
    const cylSpreadXMm = computeStationSpreadOffsetXMm(
      cl.stationCenterXMm,
      layout.blockCenterXMm,
      e,
    );
    byIdMm[`cyl-${cyl}`] = bankLocalToWorldMm(cl.stationCenterXMm + cylSpreadXMm, cl.bank, {
      xMm: 0,
      wMm: 0,
      bMm: chipBMm,
    });
  }

  return LABEL_ANCHOR_DEFINITIONS.map((def) => {
    const worldMm = byIdMm[def.id]!;
    const worldM: Vec3Tuple = [worldMm[0] / 1000, worldMm[1] / 1000, worldMm[2] / 1000];
    return {
      id: def.id,
      text: def.text,
      category: def.category,
      worldMm,
      worldM,
    };
  });
}
