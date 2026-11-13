// Pure crank-angle kinematic core for the 2005 GM Duramax LLY 6.6L V8 (Milestone 1, D-007).
// Strictly headless: never imports Three.js, wall-clock APIs, randomness, or mutable module state.

import { valveConfig as defaultValveConfig, type ValveConfig } from '../config/valveConfig';
import type { Bank, CrankState, CylinderId, EngineConfig } from './interfaces';

const CYLINDERS: readonly CylinderId[] = [1, 2, 3, 4, 5, 6, 7, 8];
const DEG_TO_RAD = Math.PI / 180;
const SIN_45 = Math.SQRT1_2;
const COS_45 = Math.SQRT1_2;

/**
 * Euclidean modulo normalized strictly into [0, modulus), never returning -0 or modulus.
 */
function normalizeMod(value: number, modulus: number): number {
  const remainder = value % modulus;
  if (remainder === 0) {
    return 0;
  }
  if (remainder < 0) {
    const shifted = remainder + modulus;
    return shifted >= modulus ? modulus - Number.EPSILON * modulus : shifted;
  }
  return remainder;
}

function pistonDisplacementBelowTdcM(config: EngineConfig, localAngleDeg: number): number {
  const r = config.crankThrowMm.value / 1000;
  const rodLength = config.rodLengthMm.value / 1000;
  const alphaRad = localAngleDeg * DEG_TO_RAD;
  const sinAlpha = Math.sin(alphaRad);
  const cosAlpha = Math.cos(alphaRad);
  const wristPinDistanceM =
    r * cosAlpha + Math.sqrt(rodLength * rodLength - r * r * sinAlpha * sinAlpha);
  const displacementM = r + rodLength - wristPinDistanceM;
  return displacementM === 0 ? 0 : displacementM;
}

function valveWindowLiftM(
  localAngleDeg: number,
  openDeg: number,
  closeDeg: number,
  maxLiftM: number,
): number {
  if (openDeg <= closeDeg) {
    const duration = closeDeg - openDeg;
    if (duration <= 0 || localAngleDeg <= openDeg || localAngleDeg >= closeDeg) {
      return 0;
    }
    const s = Math.sin((Math.PI * (localAngleDeg - openDeg)) / duration);
    return maxLiftM * s * s;
  }

  // Wraparound window across 720 deg boundary if configured in future timing tables.
  const duration = 720 - openDeg + closeDeg;
  const elapsed =
    localAngleDeg >= openDeg ? localAngleDeg - openDeg : 720 - openDeg + localAngleDeg;
  if (elapsed <= 0 || elapsed >= duration) {
    return 0;
  }
  const s = Math.sin((Math.PI * elapsed) / duration);
  return maxLiftM * s * s;
}

export function phaseOffsetDeg(config: EngineConfig, cylinder: CylinderId): number {
  const orderIndex = config.firingOrder.indexOf(cylinder);
  if (orderIndex === -1) {
    throw new Error(`Cylinder ${cylinder} is missing from engineConfig.firingOrder.`);
  }
  return orderIndex * 90;
}

export function camAngleDeg(crankAngleDeg: number): number {
  const normalizedCrankDeg = normalizeMod(crankAngleDeg, 720);
  return normalizeMod(normalizedCrankDeg / 2, 360);
}

export function bankBoreAxis(bank: Bank): [number, number, number] {
  return bank === 'RH' ? [0, -SIN_45, COS_45] : [0, SIN_45, COS_45];
}

export function computeState(
  config: EngineConfig,
  crankAngleDeg: number,
  rpm: number,
  valves: ValveConfig = defaultValveConfig,
): CrankState {
  const normalizedCrankDeg = normalizeMod(crankAngleDeg, 720);
  const maxLiftM = valves.maxLift.value / 1000;
  const intakeOpen = valves.intakeOpenDeg.value;
  const intakeClose = valves.intakeCloseDeg.value;
  const exhaustOpen = valves.exhaustOpenDeg.value;
  const exhaustClose = valves.exhaustCloseDeg.value;

  const pistonPositionM = {} as Record<CylinderId, number>;
  const valveLiftM = {} as Record<CylinderId, { intake: number; exhaust: number }>;

  for (const cylinder of CYLINDERS) {
    const phi = phaseOffsetDeg(config, cylinder);
    const alpha = normalizeMod(normalizedCrankDeg - phi, 720);

    pistonPositionM[cylinder] = pistonDisplacementBelowTdcM(config, alpha);
    valveLiftM[cylinder] = {
      intake: valveWindowLiftM(alpha, intakeOpen, intakeClose, maxLiftM),
      exhaust: valveWindowLiftM(alpha, exhaustOpen, exhaustClose, maxLiftM),
    };
  }

  return {
    crankAngleDeg: normalizedCrankDeg,
    rpm,
    pistonPositionM,
    valveLiftM,
  };
}

export function crankPinPositionM(
  config: EngineConfig,
  valveConfig: ValveConfig,
  cylinder: CylinderId,
  crankAngleDeg: number,
): [number, number, number] {
  const borePitchM = valveConfig.borePitch.value / 1000;
  const pairIndex = Math.floor((cylinder - 1) / 2);
  const stationXM = (3.5 - pairIndex) * borePitchM;

  const normalizedCrankDeg = normalizeMod(crankAngleDeg, 720);
  const alpha = normalizeMod(normalizedCrankDeg - phaseOffsetDeg(config, cylinder), 720);
  const alphaRad = alpha * DEG_TO_RAD;
  const cosAlpha = Math.cos(alphaRad);
  const sinAlpha = Math.sin(alphaRad);

  const r = config.crankThrowMm.value / 1000;
  const u = bankBoreAxis(config.bankAssignment[cylinder]);
  // Rotate u by -90 deg about +X in right-handed (X, Y, Z): (0, uy, uz) -> (0, uz, -uy).
  const v: [number, number, number] = [0, u[2], -u[1]];

  const yM = r * (cosAlpha * u[1] + sinAlpha * v[1]);
  const zM = r * (cosAlpha * u[2] + sinAlpha * v[2]);

  return [stationXM, yM === 0 ? 0 : yM, zM === 0 ? 0 : zM];
}

export function pistonValveClearanceM(
  config: EngineConfig,
  valveConfig: ValveConfig,
  cylinder: CylinderId,
  crankAngleDeg: number,
): { intake: number; exhaust: number } {
  const normalizedCrankDeg = normalizeMod(crankAngleDeg, 720);
  const alpha = normalizeMod(normalizedCrankDeg - phaseOffsetDeg(config, cylinder), 720);

  const pM = pistonDisplacementBelowTdcM(config, alpha);
  const deckGapM = valveConfig.deckGap.value / 1000;
  const maxLiftM = valveConfig.maxLift.value / 1000;

  const intakeLiftM = valveWindowLiftM(
    alpha,
    valveConfig.intakeOpenDeg.value,
    valveConfig.intakeCloseDeg.value,
    maxLiftM,
  );
  const exhaustLiftM = valveWindowLiftM(
    alpha,
    valveConfig.exhaustOpenDeg.value,
    valveConfig.exhaustCloseDeg.value,
    maxLiftM,
  );

  return {
    intake: pM + deckGapM - intakeLiftM,
    exhaust: pM + deckGapM - exhaustLiftM,
  };
}
