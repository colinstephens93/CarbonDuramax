// Milestone 7 verified LLY data, derivation identity, stack, and per-valve clearance test suite
// (docs/specs/M7-verified-data.md §§2, 3, 6; D-035).

import { describe, expect, it } from 'vitest';
import { pistonValveClearanceM } from '../core/kinematics';
import { detailConfig } from './detailConfig';
import { engineConfig } from './engineConfig';
import { valveConfig } from './valveConfig';

describe('Milestone 7 verified LLY data & stack invariants (src/config/verifiedData.test.ts)', () => {
  it('1. pins published & decoupled placeholder config values and provenance labels', () => {
    expect(engineConfig.rodLengthMm.value).toBe(163.0);
    expect(engineConfig.rodLengthMm.confidence).toBe('published');

    expect(engineConfig.crankThrowMm.value).toBe(49.5);
    expect(engineConfig.crankThrowMm.confidence).toBe('published');
    expect(engineConfig.crankThrowMm.source.startsWith('derived:')).toBe(true);

    expect(detailConfig.pistonCompressionHeightMm.value).toBe(49.8);
    expect(detailConfig.pistonCompressionHeightMm.confidence).toBe('published');

    expect(detailConfig.wristPinDiameterMm.value).toBe(34.5);
    expect(detailConfig.wristPinDiameterMm.confidence).toBe('published');

    expect(detailConfig.pinJournalDiameterMm.value).toBe(62.9);
    expect(detailConfig.pinJournalDiameterMm.confidence).toBe('published');

    expect(detailConfig.mainJournalDiameterMm.value).toBe(79.9);
    expect(detailConfig.mainJournalDiameterMm.confidence).toBe('published');

    expect(detailConfig.valveIntakeHeadMm.value).toBe(33.0);
    expect(detailConfig.valveIntakeHeadMm.confidence).toBe('published');

    expect(detailConfig.valveExhaustHeadMm.value).toBe(31.0);
    expect(detailConfig.valveExhaustHeadMm.confidence).toBe('published');

    expect(detailConfig.valveStemMm.value).toBe(7);
    expect(detailConfig.valveStemMm.confidence).toBe('published');

    expect(detailConfig.pushrodDiameterMm.value).toBe(11.1);
    expect(detailConfig.pushrodDiameterMm.confidence).toBe('published');

    expect(detailConfig.pushrodLengthMm.value).toBe(244);
    expect(detailConfig.pushrodLengthMm.confidence).toBe('placeholder');

    expect(detailConfig.lifterBodyDiameterMm.value).toBe(23.85);
    expect(detailConfig.lifterBodyDiameterMm.confidence).toBe('placeholder');

    expect(valveConfig.lobeLift.value).toBe(7.14);
    expect(valveConfig.lobeLift.confidence).toBe('published');
    expect(valveConfig.rockerRatioIntake.value).toBe(1.36);
    expect(valveConfig.rockerRatioIntake.confidence).toBe('published');
    expect(valveConfig.rockerRatioExhaust.value).toBe(1.69);
    expect(valveConfig.rockerRatioExhaust.confidence).toBe('published');
    expect(valveConfig.intakeMaxLift.value).toBe(9.7);
    expect(valveConfig.intakeMaxLift.confidence).toBe('published');
    expect(valveConfig.intakeMaxLift.source.startsWith('derived:')).toBe(true);
    expect(valveConfig.exhaustMaxLift.value).toBe(12.1);
    expect(valveConfig.exhaustMaxLift.confidence).toBe('published');
    expect(valveConfig.exhaustMaxLift.source.startsWith('derived:')).toBe(true);
  });

  it('2. enforces valve-lift and rocker-cup derivation identities within rounding tolerance', () => {
    const derivedIntakeLiftMm =
      valveConfig.lobeLift.value * valveConfig.rockerRatioIntake.value;
    const derivedExhaustLiftMm =
      valveConfig.lobeLift.value * valveConfig.rockerRatioExhaust.value;

    expect(Math.abs(valveConfig.intakeMaxLift.value - derivedIntakeLiftMm)).toBeLessThanOrEqual(
      0.05,
    );
    expect(Math.abs(valveConfig.exhaustMaxLift.value - derivedExhaustLiftMm)).toBeLessThanOrEqual(
      0.05,
    );

    const derivedIntakeCupMm =
      detailConfig.valveRowOffsetMm.value / valveConfig.rockerRatioIntake.value;
    const derivedExhaustCupMm =
      detailConfig.valveRowOffsetMm.value / valveConfig.rockerRatioExhaust.value;

    expect(
      Math.abs(detailConfig.rockerCupIntakeValleyOffsetMm.value - derivedIntakeCupMm),
    ).toBeLessThanOrEqual(0.1);
    expect(
      Math.abs(detailConfig.rockerCupExhaustValleyOffsetMm.value - derivedExhaustCupMm),
    ).toBeLessThanOrEqual(0.1);
    expect(detailConfig.rockerCupIntakeValleyOffsetMm.confidence).toBe('published');
    expect(detailConfig.rockerCupIntakeValleyOffsetMm.source.startsWith('derived:')).toBe(true);
    expect(detailConfig.rockerCupExhaustValleyOffsetMm.confidence).toBe('published');
    expect(detailConfig.rockerCupExhaustValleyOffsetMm.source.startsWith('derived:')).toBe(true);
  });

  it('3. enforces TDC piston-crown stack (262.3 mm) and deck plane (264.3 mm) identities', () => {
    const crownAtTdcMm =
      engineConfig.crankThrowMm.value +
      engineConfig.rodLengthMm.value +
      detailConfig.pistonCompressionHeightMm.value;
    const deckPlaneMm = crownAtTdcMm + valveConfig.deckGap.value;

    expect(Math.abs(crownAtTdcMm - 262.3)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(deckPlaneMm - 264.3)).toBeLessThanOrEqual(0.01);
  });

  it('4. removes superseded single-channel keys from valveConfig and detailConfig', () => {
    expect('maxLift' in valveConfig).toBe(false);
    expect((valveConfig as unknown as Record<string, unknown>).maxLift).toBeUndefined();

    expect('rockerTailValleyOffsetMm' in detailConfig).toBe(false);
    expect(
      (detailConfig as unknown as Record<string, unknown>).rockerTailValleyOffsetMm,
    ).toBeUndefined();
  });

  it('5. verifies per-valve piston-to-valve clearance across 0..720 deg (0.25 deg steps)', () => {
    let minIntakeMm = Number.POSITIVE_INFINITY;
    let minExhaustCycleMm = Number.POSITIVE_INFINITY;
    let minExhaustOpenWindowMm = Number.POSITIVE_INFINITY;

    const exOpenDeg = valveConfig.exhaustOpenDeg.value;
    const exCloseDeg = valveConfig.exhaustCloseDeg.value;
    const totalSteps = 720 * 4;

    for (let step = 0; step <= totalSteps; step += 1) {
      const thetaDeg = step * 0.25;
      const clearanceM = pistonValveClearanceM(engineConfig, valveConfig, 1, thetaDeg);
      const intakeMm = clearanceM.intake * 1000;
      const exhaustMm = clearanceM.exhaust * 1000;

      expect(intakeMm).toBeGreaterThanOrEqual(0);
      expect(exhaustMm).toBeGreaterThanOrEqual(0);

      if (intakeMm < minIntakeMm) {
        minIntakeMm = intakeMm;
      }
      if (exhaustMm < minExhaustCycleMm) {
        minExhaustCycleMm = exhaustMm;
      }
      if (thetaDeg >= exOpenDeg && thetaDeg <= exCloseDeg && exhaustMm < minExhaustOpenWindowMm) {
        minExhaustOpenWindowMm = exhaustMm;
      }
    }

    expect(Math.abs(minIntakeMm - 1.8)).toBeLessThanOrEqual(0.05);
    expect(minExhaustCycleMm).toBeGreaterThanOrEqual(1.99);
    expect(Math.abs(minExhaustOpenWindowMm - 2.98)).toBeLessThanOrEqual(0.05);
  });
});
