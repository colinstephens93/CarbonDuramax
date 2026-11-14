// Milestone 3 layout & clearance test suite (docs/specs/M3-full-engine.md §§3–5, 11–12).
// Verifies station centers, shared-pin rod seats & exact rod length, §4 lifter gallery coordinates,
// exterior registration invariants, and all inter-part clearance inequalities from config.

import { describe, expect, it } from 'vitest';
import { detailConfig } from '../config/detailConfig';
import { engineConfig } from '../config/engineConfig';
import { valveConfig } from '../config/valveConfig';
import type { CylinderId } from '../core/interfaces';
import { computeState, crankPinPositionM, phaseOffsetDeg } from '../core/kinematics';
import {
  bankLocalToWorldMm,
  computeEngineLayout,
  computeLayoutClearancesMm,
} from './layout';

describe('Milestone 3 engine layout & valvetrain clearances (src/renderer/layout.test.ts)', () => {
  it('1. station centers sit at 3.5, 2.5, 1.5, 0.5 * borePitch from rear plane and match crankPinPositionM', () => {
    const layout = computeEngineLayout(engineConfig, valveConfig, detailConfig);
    const pitch = valveConfig.borePitch.value;

    expect(layout.stations.map((s) => s.centerXMm)).toEqual([
      3.5 * pitch,
      2.5 * pitch,
      1.5 * pitch,
      0.5 * pitch,
    ]);
    expect(layout.stations.map((s) => [s.rhCylinder, s.lhCylinder])).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
    ]);

    for (const cyl of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
      const [coreStationXM] = crankPinPositionM(engineConfig, valveConfig, cyl, 0);
      expect(layout.cylinders[cyl].stationCenterXM).toBeCloseTo(coreStationXM, 9);
    }
  });

  it('2. rod seats offset by -rodSeatOffsetMm on RH and +rodSeatOffsetMm on LH, preserving exact rodLength with shared pin YZ', () => {
    const layout = computeEngineLayout(engineConfig, valveConfig, detailConfig);
    const expectedOffset = detailConfig.rodSeatOffsetMm.value;
    const rodLengthM = engineConfig.rodLengthMm.value / 1000;
    const tdcWristBM = layout.valvetrainMm.tdcWristBMm / 1000;

    for (const cyl of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
      const cylLayout = layout.cylinders[cyl];
      if (cylLayout.bank === 'RH') {
        expect(cylLayout.rodSeatOffsetMm).toBe(-expectedOffset);
      } else {
        expect(cylLayout.rodSeatOffsetMm).toBe(+expectedOffset);
      }
      expect(cylLayout.rodSeatXMm).toBeCloseTo(
        cylLayout.stationCenterXMm + cylLayout.rodSeatOffsetMm,
        9,
      );
    }

    // Verify shared-pin phase identity (phi_LH === phi_RH + 90 mod 360) and exact rodLength across crank angles
    for (const station of layout.stations) {
      const phiRh = phaseOffsetDeg(engineConfig, station.rhCylinder);
      const phiLh = phaseOffsetDeg(engineConfig, station.lhCylinder);
      expect(phiLh % 360).toBe((phiRh + 90) % 360);
    }

    for (const thetaDeg of [0, 37.5, 90, 180, 270, 470, 615, 705]) {
      const state = computeState(engineConfig, thetaDeg, 900, valveConfig);
      for (const station of layout.stations) {
        const [, rhPinY, rhPinZ] = crankPinPositionM(
          engineConfig,
          valveConfig,
          station.rhCylinder,
          thetaDeg,
        );
        const [, lhPinY, lhPinZ] = crankPinPositionM(
          engineConfig,
          valveConfig,
          station.lhCylinder,
          thetaDeg,
        );
        expect(lhPinY).toBeCloseTo(rhPinY, 12);
        expect(lhPinZ).toBeCloseTo(rhPinZ, 12);

        for (const cyl of [station.rhCylinder, station.lhCylinder] as CylinderId[]) {
          const cl = layout.cylinders[cyl];
          const wristBM = tdcWristBM - state.pistonPositionM[cyl];
          const wristX = cl.rodSeatXM;
          const wristY = wristBM * cl.boreAxisB[1];
          const wristZ = wristBM * cl.boreAxisB[2];

          const pinX = cl.rodSeatXM;
          const distM = Math.hypot(wristX - pinX, wristY - rhPinY, wristZ - rhPinZ);
          expect(distM).toBeCloseTo(rodLengthM, 12);
        }
      }
    }
  });

  it('3. valvetrain lifter top and pushrod cup rest points match Spec §4', () => {
    const layout = computeEngineLayout(engineConfig, valveConfig, detailConfig);
    const vt = layout.valvetrainMm;

    expect(vt.intakeLifterTopMm).toEqual({
      xMm: 56,
      wMm: 36,
      bMm: 130,
    });
    expect(vt.exhaustLifterTopMm).toEqual({
      xMm: -35,
      wMm: 55,
      bMm: 130,
    });
    expect(vt.intakeCupRestMm).toEqual({
      xMm: 60,
      wMm: -16.9,
      bMm: 374.3,
    });
    expect(vt.exhaustCupRestMm).toEqual({
      xMm: -60,
      wMm: 13.6,
      bMm: 374.3,
    });

    // Verify bilateral mirror symmetry across Y = 0 between RH and LH banks at the same station
    const rhIntakeWorld = bankLocalToWorldMm(402.5, 'RH', vt.intakeLifterTopMm);
    const lhIntakeWorld = bankLocalToWorldMm(402.5, 'LH', vt.intakeLifterTopMm);
    expect(lhIntakeWorld[0]).toBeCloseTo(rhIntakeWorld[0], 9);
    expect(lhIntakeWorld[1]).toBeCloseTo(-rhIntakeWorld[1], 9);
    expect(lhIntakeWorld[2]).toBeCloseTo(rhIntakeWorld[2], 9);
  });

  it('4. pushrod radial clearances in piston swept band exceed piston + tube threshold (> 55.9 mm) for own and neighboring bores', () => {
    const c = computeLayoutClearancesMm(engineConfig, valveConfig, detailConfig);

    expect(c.pistonSweptBandBMm[0]).toBeCloseTo(88.5, 6);
    expect(c.pistonSweptBandBMm[1]).toBeCloseTo(262.3, 6);
    expect(c.pistonPushrodThresholdMm).toBeCloseTo(56.975, 3);

    // Spec §12.2: > 55.9 mm (and strictly greater than exact pistonRadius + pushrodRadius = 55.925 mm)
    expect(c.ownBorePushrodMinRadialMm.intake).toBeGreaterThan(55.9);
    expect(c.ownBorePushrodMinRadialMm.exhaust).toBeGreaterThan(55.9);
    expect(c.neighborBorePushrodMinRadialMm.intake).toBeGreaterThan(55.9);
    expect(c.neighborBorePushrodMinRadialMm.exhaust).toBeGreaterThan(55.9);

    expect(c.ownBorePushrodMinRadialMm.intake).toBeGreaterThan(c.pistonPushrodThresholdMm);
    expect(c.ownBorePushrodMinRadialMm.exhaust).toBeGreaterThan(c.pistonPushrodThresholdMm);
    expect(c.neighborBorePushrodMinRadialMm.intake).toBeGreaterThan(c.pistonPushrodThresholdMm);
    expect(c.neighborBorePushrodMinRadialMm.exhaust).toBeGreaterThan(c.pistonPushrodThresholdMm);
  });

  it('5. lifter axis distances clear own piston sweep and neighboring piston sweep (> 63.35 mm) on both channels', () => {
    const c = computeLayoutClearancesMm(engineConfig, valveConfig, detailConfig);

    expect(c.pistonLifterThresholdMm).toBeCloseTo(63.35, 2);

    // Own bore piston sweep clearance (Spec §12.2: > 63.35 mm, both channels)
    expect(c.ownBoreLifterAxisDistMm.intake).toBeGreaterThan(63.35);
    expect(c.ownBoreLifterAxisDistMm.exhaust).toBeGreaterThan(63.35);
    expect(c.ownBoreLifterAxisDistMm.intake).toBeGreaterThan(c.pistonLifterThresholdMm);
    expect(c.ownBoreLifterAxisDistMm.exhaust).toBeGreaterThan(c.pistonLifterThresholdMm);

    // Neighboring bore piston sweep clearance (Spec §12.2: > 63.35 mm, both channels)
    expect(c.neighborBoreLifterAxisDistMm.intake).toBeGreaterThan(63.35);
    expect(c.neighborBoreLifterAxisDistMm.exhaust).toBeGreaterThan(63.35);
    expect(c.neighborBoreLifterAxisDistMm.intake).toBeGreaterThan(c.pistonLifterThresholdMm);
    expect(c.neighborBoreLifterAxisDistMm.exhaust).toBeGreaterThan(c.pistonLifterThresholdMm);
  });

  it('6. cross-cylinder pushrod minimum distance (> 25 mm) and lifter-to-lifter spacing (> 30 mm) hold', () => {
    const c = computeLayoutClearancesMm(engineConfig, valveConfig, detailConfig);

    expect(c.crossCylinderPushrodMinCenterDistMm).toBeGreaterThan(25);
    expect(c.nearestLifterCenterSpacingMm).toBeGreaterThan(30);
  });

  it('7. exterior registration places crank axis on project X axis with det = +1 and satisfies §5 containment bounds', () => {
    const { exterior, mainShaftRadiusMm } = computeEngineLayout(
      engineConfig,
      valveConfig,
      detailConfig,
    );

    // Main shaft radius 39.95 ± 0.5 mm from published mainJournalDiameterMm (M7 Spec §4.3)
    expect(Math.abs(mainShaftRadiusMm - 39.95)).toBeLessThanOrEqual(0.5);

    // Proper orthogonal rotation (det = +1)
    const [c0, c1, c2] = exterior.basisColumnsProjectFromFile;
    const det =
      c0[0] * (c1[1] * c2[2] - c1[2] * c2[1]) -
      c1[0] * (c0[1] * c2[2] - c0[2] * c2[1]) +
      c2[0] * (c0[1] * c1[2] - c0[2] * c1[1]);
    expect(det).toBe(1);

    // Crank axis (X_file = 0, Y_file = -0.26, Z_file) maps strictly onto project (Y = 0, Z = 0)
    const [fx, fy] = exterior.fileCrankAxisXYM;
    const s = exterior.uniformScale;
    const [tx, ty, tz] = exterior.translationM;
    for (const fz of exterior.fileCrankClusterZRangeM) {
      const projX = tx + s * (c0[0] * fx + c1[0] * fy + c2[0] * fz);
      const projY = ty + s * (c0[1] * fx + c1[1] * fy + c2[1] * fz);
      const projZ = tz + s * (c0[2] * fx + c1[2] * fy + c2[2] * fz);
      expect(projX).toBeCloseTo(tx + s * fz, 12);
      expect(projY).toBeCloseTo(0, 12);
      expect(projZ).toBeCloseTo(0, 12);
    }

    // Spec §5 bounds: span X >= 627 mm, rear overhang A in [12, S - 480], width >= 607 mm, height >= 375 mm
    const [spanX, spanY, spanZ] = exterior.projectBoundsMm.span;
    expect(spanX).toBeGreaterThanOrEqual(627);
    expect(spanY).toBeGreaterThanOrEqual(607);
    expect(spanZ).toBeGreaterThanOrEqual(375);
    expect(exterior.rearOverhangMm).toBeGreaterThanOrEqual(12);
    expect(exterior.rearOverhangMm).toBeLessThanOrEqual(spanX - 480);
    expect(exterior.projectBoundsMm.max[0]).toBeGreaterThanOrEqual(480);
  });
});
