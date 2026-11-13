import { describe, expect, it } from 'vitest';
import { engineConfig } from '../config/engineConfig';
import { valveConfig } from '../config/valveConfig';
import type { CrankState, CylinderId } from './interfaces';
import {
  bankBoreAxis,
  camAngleDeg,
  computeState,
  crankPinPositionM,
  phaseOffsetDeg,
  pistonValveClearanceM,
} from './kinematics';

const CYLINDERS: readonly CylinderId[] = [1, 2, 3, 4, 5, 6, 7, 8];
const STATE_TOLERANCE = 1e-9;

function dot3(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function norm3(v: readonly [number, number, number]): number {
  return Math.hypot(v[0], v[1], v[2]);
}

function mod360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r === 0 ? 0 : r;
}

function expectStatesWithinTolerance(
  actual: CrankState,
  expected: CrankState,
  tolerance = STATE_TOLERANCE,
): void {
  expect(Math.abs(actual.crankAngleDeg - expected.crankAngleDeg)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.rpm - expected.rpm)).toBeLessThanOrEqual(tolerance);

  for (const cyl of CYLINDERS) {
    expect(
      Math.abs(actual.pistonPositionM[cyl] - expected.pistonPositionM[cyl]),
    ).toBeLessThanOrEqual(tolerance);
    expect(
      Math.abs(actual.valveLiftM[cyl].intake - expected.valveLiftM[cyl].intake),
    ).toBeLessThanOrEqual(tolerance);
    expect(
      Math.abs(actual.valveLiftM[cyl].exhaust - expected.valveLiftM[cyl].exhaust),
    ).toBeLessThanOrEqual(tolerance);
  }
}

describe('Milestone 1 kinematic core', () => {
  it('1. firing sequence: unique firing-TDC cylinder every 90 deg yields [1, 2, 7, 8, 4, 5, 6, 3]', () => {
    const observedSequence: CylinderId[] = [];

    for (let k = 0; k <= 7; k += 1) {
      const theta = k * 90;
      const state = computeState(engineConfig, theta, 900);

      const firingTdcCylinders = CYLINDERS.filter(
        (cyl) =>
          Math.abs(state.pistonPositionM[cyl]) <= 1e-9 &&
          state.valveLiftM[cyl].intake === 0 &&
          state.valveLiftM[cyl].exhaust === 0,
      );

      expect(firingTdcCylinders).toHaveLength(1);
      observedSequence.push(firingTdcCylinders[0]!);
    }

    expect(observedSequence).toEqual([1, 2, 7, 8, 4, 5, 6, 3]);
  });

  it('2. piston extremes: p ≈ 0 at firing TDC and p ≈ 0.099 m at firing angle + 180 deg', () => {
    for (const cyl of CYLINDERS) {
      const firingDeg = phaseOffsetDeg(engineConfig, cyl);
      const tdcState = computeState(engineConfig, firingDeg, 900);
      const bdcState = computeState(engineConfig, firingDeg + 180, 900);

      expect(Math.abs(tdcState.pistonPositionM[cyl] - 0)).toBeLessThanOrEqual(1e-9);
      expect(Math.abs(bdcState.pistonPositionM[cyl] - 0.099)).toBeLessThanOrEqual(1e-9);
    }
  });

  it('3. cam half speed: cam advances 180 deg per 360 deg crank, valve lift has 720 deg period', () => {
    const sampledAngles = [0, 37.5, 90, 123.456, 250, 359.75, 480, 719.9];

    for (const theta of sampledAngles) {
      const expectedCamAfter360 = mod360(camAngleDeg(theta) + 180);
      const actualCamAfter360 = camAngleDeg(theta + 360);
      expect(Math.abs(actualCamAfter360 - expectedCamAfter360)).toBeLessThanOrEqual(1e-9);

      const stateAtTheta = computeState(engineConfig, theta, 1200);
      const statePlus360 = computeState(engineConfig, theta + 360, 1200);
      const statePlus720 = computeState(engineConfig, theta + 720, 1200);

      const anyValveDiffersAfter360 = CYLINDERS.some(
        (cyl) =>
          Math.abs(stateAtTheta.valveLiftM[cyl].intake - statePlus360.valveLiftM[cyl].intake) >
            1e-9 ||
          Math.abs(stateAtTheta.valveLiftM[cyl].exhaust - statePlus360.valveLiftM[cyl].exhaust) >
            1e-9,
      );
      expect(anyValveDiffersAfter360).toBe(true);

      expectStatesWithinTolerance(stateAtTheta, statePlus720, STATE_TOLERANCE);
    }
  });

  it('4. clearance: never negative across 0..720 deg (0.25 deg step) and minimum < 0.005 m', () => {
    let minClearanceM = Number.POSITIVE_INFINITY;
    const totalSteps = 720 * 4;

    for (let step = 0; step <= totalSteps; step += 1) {
      const theta = step * 0.25;
      for (const cyl of CYLINDERS) {
        const clearance = pistonValveClearanceM(engineConfig, valveConfig, cyl, theta);
        expect(clearance.intake).toBeGreaterThanOrEqual(0);
        expect(clearance.exhaust).toBeGreaterThanOrEqual(0);

        if (clearance.intake < minClearanceM) {
          minClearanceM = clearance.intake;
        }
        if (clearance.exhaust < minClearanceM) {
          minClearanceM = clearance.exhaust;
        }
      }
    }

    expect(minClearanceM).toBeGreaterThanOrEqual(0);
    expect(minClearanceM).toBeLessThan(0.005);
  });

  it('5. determinism / 10,000 revs: computeState(theta) matches computeState(theta + 3_600_000)', () => {
    const sampledAngles = [0, 45, 123.456, 362.6, 589.25, 719.9];

    for (const theta of sampledAngles) {
      const baseline = computeState(engineConfig, theta, 1800);
      const afterTenThousandRevs = computeState(engineConfig, theta + 3_600_000, 1800);
      const repeatedCall = computeState(engineConfig, theta, 1800);

      expectStatesWithinTolerance(afterTenThousandRevs, baseline, STATE_TOLERANCE);
      expectStatesWithinTolerance(repeatedCall, baseline, STATE_TOLERANCE);
    }
  });

  it('6. pin geometry and bank angle: pin throw radius r, maximal bore-axis dot at firing, 90 deg unit banks', () => {
    const rhAxis = bankBoreAxis('RH');
    const lhAxis = bankBoreAxis('LH');

    expect(Math.abs(dot3(rhAxis, lhAxis))).toBeLessThanOrEqual(1e-12);
    expect(Math.abs(norm3(rhAxis) - 1)).toBeLessThanOrEqual(1e-12);
    expect(Math.abs(norm3(lhAxis) - 1)).toBeLessThanOrEqual(1e-12);

    const crankThrowM = engineConfig.crankThrowMm.value / 1000;
    const neighborOffsets = [-10, -7.5, -5, -2.5, -1, -0.5, 0.5, 1, 2.5, 5, 7.5, 10];

    for (const cyl of CYLINDERS) {
      const firingDeg = phaseOffsetDeg(engineConfig, cyl);
      const pinAtFiring = crankPinPositionM(engineConfig, valveConfig, cyl, firingDeg);
      const yzNorm = Math.hypot(pinAtFiring[1], pinAtFiring[2]);

      expect(Math.abs(yzNorm - crankThrowM)).toBeLessThanOrEqual(1e-9);

      const boreAxis = bankBoreAxis(engineConfig.bankAssignment[cyl]);
      const firingDot = dot3(pinAtFiring, boreAxis);

      for (const delta of neighborOffsets) {
        const neighborPin = crankPinPositionM(engineConfig, valveConfig, cyl, firingDeg + delta);
        const neighborDot = dot3(neighborPin, boreAxis);
        expect(firingDot).toBeGreaterThan(neighborDot);
      }
    }
  });
});
