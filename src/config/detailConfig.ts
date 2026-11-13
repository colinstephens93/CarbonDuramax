// Illustrative placeholder interface dimensions for detailed internal & valvetrain parts (D-011, D-012).
// Every field carries confidence 'placeholder' and cites the Rev C concept set unknowns / D-011–D-012 policy.

import type { ProvenancedValue } from '../core/interfaces';

export interface DetailConfig {
  pistonCompressionHeightMm: ProvenancedValue;
  pistonSkirtClearanceMm: ProvenancedValue;
  wristPinDiameterMm: ProvenancedValue;
  pinJournalDiameterMm: ProvenancedValue;
  pinJournalLengthMm: ProvenancedValue;
  rodSeatOffsetMm: ProvenancedValue;
  crankWebThicknessMm: ProvenancedValue;
  crankWebRadiusMm: ProvenancedValue;
  valveIntakeHeadMm: ProvenancedValue;
  valveExhaustHeadMm: ProvenancedValue;
  valveStemMm: ProvenancedValue;
  valveStemLengthMm: ProvenancedValue;
  valveInsetMm: ProvenancedValue;
  valvePairSpacingMm: ProvenancedValue;
  valveRowOffsetMm: ProvenancedValue;
  springFreeLengthMm: ProvenancedValue;
  springDiameterMm: ProvenancedValue;
  springSeatHeightMm: ProvenancedValue;
  bridgeThicknessMm: ProvenancedValue;
  rockerShaftHeightMm: ProvenancedValue;
  rockerTailValleyOffsetMm: ProvenancedValue;
  rockerTailXOffsetMm: ProvenancedValue;
  pushrodValleyOffsetMm: ProvenancedValue;
  pushrodLengthMm: ProvenancedValue;
  pushrodDiameterMm: ProvenancedValue;
  lifterTopBoreOffsetMm: ProvenancedValue;
  lifterIntakeXOffsetMm: ProvenancedValue;
  lifterExhaustXOffsetMm: ProvenancedValue;
  lifterIntakeValleyOffsetMm: ProvenancedValue;
  lifterExhaustValleyOffsetMm: ProvenancedValue;
  injectorBodyMm: ProvenancedValue;
  injectorLengthMm: ProvenancedValue;
}

export const detailConfig: DetailConfig = {
  pistonCompressionHeightMm: {
    value: 52,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) piston compression height unknown',
  },
  pistonSkirtClearanceMm: {
    value: 0.15,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set piston-to-wall clearance unknown',
  },
  wristPinDiameterMm: {
    value: 33,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set wrist-pin diameter unknown',
  },
  pinJournalDiameterMm: {
    value: 60,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set crankpin journal diameter unknown',
  },
  pinJournalLengthMm: {
    value: 58,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'M3 spec §3 — derived from rod big-end width (26.4 mm) and shared-pin pair clearance',
  },
  rodSeatOffsetMm: {
    value: 14.2,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'M3 spec §3 — derived from rod big-end width (26.4 mm) with 2.0 mm inter-rod gap',
  },
  crankWebThicknessMm: {
    value: 18,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set crank web axial thickness unknown',
  },
  crankWebRadiusMm: {
    value: 62,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set crank counterweight radius unknown',
  },
  valveIntakeHeadMm: {
    value: 38,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) intake valve head size unknown',
  },
  valveExhaustHeadMm: {
    value: 35,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) exhaust valve head size unknown',
  },
  valveStemMm: {
    value: 7,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) valve stem diameter unknown',
  },
  valveStemLengthMm: {
    value: 105,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) valve stem length unknown',
  },
  valveInsetMm: {
    value: 1,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) valve seat recess unknown',
  },
  valvePairSpacingMm: {
    value: 44,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) valve pair X-spacing unknown',
  },
  valveRowOffsetMm: {
    value: 23,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) valve row W-offset unknown',
  },
  springFreeLengthMm: {
    value: 48,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) valve spring installed/free length unknown',
  },
  springDiameterMm: {
    value: 26,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) valve spring outer diameter unknown',
  },
  springSeatHeightMm: {
    value: 45,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) spring seat height above deck unknown',
  },
  bridgeThicknessMm: {
    value: 10,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) valve bridge thickness unknown',
  },
  rockerShaftHeightMm: {
    value: 110,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) rocker shaft height above deck unknown',
  },
  rockerTailValleyOffsetMm: {
    value: 19,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) rocker cup W-offset from shaft unknown',
  },
  rockerTailXOffsetMm: {
    value: 60,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) rocker cup X-offset from station center unknown',
  },
  pushrodValleyOffsetMm: {
    value: 19,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) lifter gallery valley W-offset unknown',
  },
  pushrodLengthMm: {
    value: 246,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) pushrod nominal length unknown',
  },
  pushrodDiameterMm: {
    value: 9,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) pushrod outer diameter unknown',
  },
  lifterTopBoreOffsetMm: {
    value: 130,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set (D10) cam/lifter bore height unknown',
  },
  lifterIntakeXOffsetMm: {
    value: 56,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'M3 spec §4 — derived from cross-cylinder pushrod, lifter, and piston sweep clearance geometry',
  },
  lifterExhaustXOffsetMm: {
    value: 35,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'M3 spec §4 — derived from cross-cylinder pushrod, lifter, and piston sweep clearance geometry',
  },
  lifterIntakeValleyOffsetMm: {
    value: 36,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'M3 spec §4 — derived from cross-cylinder pushrod, lifter, and piston sweep clearance geometry',
  },
  lifterExhaustValleyOffsetMm: {
    value: 55,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'M3 spec §4 — derived from cross-cylinder pushrod, lifter, and piston sweep clearance geometry',
  },
  injectorBodyMm: {
    value: 24,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set injector body outer diameter unknown',
  },
  injectorLengthMm: {
    value: 120,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set injector overall length unknown',
  },
};
