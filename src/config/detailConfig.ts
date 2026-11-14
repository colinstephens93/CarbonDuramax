// Published and illustrative placeholder interface dimensions for detailed internal & valvetrain parts (D-011, D-012, D-035).
// Published fields cite L7-verified-data-survey.md; remaining unknowns stay 'placeholder' under D-011/D-012.

import type { ProvenancedValue } from '../core/interfaces';

export interface DetailConfig {
  pistonCompressionHeightMm: ProvenancedValue;
  pistonSkirtClearanceMm: ProvenancedValue;
  wristPinDiameterMm: ProvenancedValue;
  pinJournalDiameterMm: ProvenancedValue;
  mainJournalDiameterMm: ProvenancedValue;
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
  rockerCupIntakeValleyOffsetMm: ProvenancedValue;
  rockerCupExhaustValleyOffsetMm: ProvenancedValue;
  rockerTailXOffsetMm: ProvenancedValue;
  pushrodValleyOffsetMm: ProvenancedValue;
  pushrodLengthMm: ProvenancedValue;
  pushrodDiameterMm: ProvenancedValue;
  lifterBodyDiameterMm: ProvenancedValue;
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
    value: 49.8,
    unit: 'mm',
    confidence: 'published',
    source:
      'MAHLE Original (OE supplier) 224-3451/224-3452 compression height 1.961 in (49.8 mm) for 2001–2005 LB7/LLY; UEM standard-height set agrees (L7 survey §8)',
  },
  pistonSkirtClearanceMm: {
    value: 0.15,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 placeholder policy; Rev C concept set piston-to-wall clearance unknown',
  },
  wristPinDiameterMm: {
    value: 34.5,
    unit: 'mm',
    confidence: 'published',
    source:
      'MAHLE Original, UEM, and BoostLine: wrist pin diameter 1.358 in (34.5 mm) (L7 survey §8)',
  },
  pinJournalDiameterMm: {
    value: 62.9,
    unit: 'mm',
    confidence: 'published',
    source:
      'Callies 2.477 in, BoostLine 2.476 in, MotorTrend L5P teardown pre-L5P rod journal 2.4764 in (62.9 mm) (L7 survey §6)',
  },
  mainJournalDiameterMm: {
    value: 79.9,
    unit: 'mm',
    confidence: 'published',
    source:
      'Callies Duramax crankshaft OEM main journal 3.146 in (79.9 mm); MotorTrend L5P teardown corroborates 3.1464 in carried over (L7 survey §6)',
  },
  pinJournalLengthMm: {
    value: 58,
    unit: 'mm',
    confidence: 'placeholder',
    source:
      "M3 spec §3 — derived from rod big-end width (26.4 mm) and shared-pin pair clearance. Retained at M7: with pin journal 62.9 the modeled rod big-end width becomes 27.7 mm (build script's 0.22 × journal factor); inter-rod gap 0.72 mm and pin-end margin 0.96 mm, both positive (M7 spec §11).",
  },
  rodSeatOffsetMm: {
    value: 14.2,
    unit: 'mm',
    confidence: 'placeholder',
    source:
      "M3 spec §3 — derived from rod big-end width (26.4 mm) with 2.0 mm inter-rod gap. Retained at M7: with pin journal 62.9 the modeled rod big-end width becomes 27.7 mm (build script's 0.22 × journal factor); inter-rod gap 0.72 mm and pin-end margin 0.96 mm, both positive (M7 spec §11).",
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
    value: 33.0,
    unit: 'mm',
    confidence: 'published',
    source:
      'ZZ Diesel OE part-number data 1.299 in (33.0 mm); Edelbrock stock-compatible Duramax head 33 mm (L7 survey §5)',
  },
  valveExhaustHeadMm: {
    value: 31.0,
    unit: 'mm',
    confidence: 'published',
    source:
      'ZZ Diesel OE part-number data 1.220 in (31.0 mm); Edelbrock stock-compatible Duramax head 31 mm (L7 survey §5)',
  },
  valveStemMm: {
    value: 7,
    unit: 'mm',
    confidence: 'published',
    source: 'Edelbrock stock-valvetrain-compatible Duramax head data: valve stem 7.0 mm (L7 survey §5)',
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
  rockerCupIntakeValleyOffsetMm: {
    value: 16.9,
    unit: 'mm',
    confidence: 'published',
    source:
      'derived: valveRowOffset 23 mm ÷ published intake rocker ratio 1.36 = 16.91 mm — the cup arm that makes the modeled rocker ratio 1.36 (23/16.9 = 1.361)',
  },
  rockerCupExhaustValleyOffsetMm: {
    value: 13.6,
    unit: 'mm',
    confidence: 'published',
    source:
      'derived: valveRowOffset 23 mm ÷ published exhaust rocker ratio 1.69 = 13.61 mm (23/13.6 = 1.691)',
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
    value: 244,
    unit: 'mm',
    confidence: 'placeholder',
    source:
      'D-011/D-012 illustrative placeholder — recomputed modeled nominal ΔB (rocker shaft B 374.3 − lifter top B 130 = 244.3 mm, rounded to 244 per M2 convention); Manton published 239.5 mm overall length is not adopted because gallery/rocker endpoints are unpublished (D-035, L7 survey §9)',
  },
  pushrodDiameterMm: {
    value: 11.1,
    unit: 'mm',
    confidence: 'published',
    source:
      'Manton Pushrods stock Duramax specification: 7/16 in (11.1 mm) outer diameter, single specialist vendor source (L7 survey §9)',
  },
  lifterBodyDiameterMm: {
    value: 23.85,
    unit: 'mm',
    confidence: 'placeholder',
    source:
      'D-011/D-012 illustrative placeholder — lifter body diameter not published for the LLY (L7 survey §9); value is the M2/M3 modeled radius (2.65 × 4.5 mm pushrod radius) made explicit at M7 (D-035), geometry unchanged',
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
