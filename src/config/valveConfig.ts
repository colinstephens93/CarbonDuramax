// Valvetrain lift (published/derived, D-035) and illustrative placeholder timing, deck clearance, and bore-pitch config (D-011, D-012).

import type { ProvenancedValue } from '../core/interfaces';

export interface ValveConfig {
  lobeLift: ProvenancedValue;
  rockerRatioIntake: ProvenancedValue;
  rockerRatioExhaust: ProvenancedValue;
  intakeMaxLift: ProvenancedValue;
  exhaustMaxLift: ProvenancedValue;
  deckGap: ProvenancedValue;
  borePitch: ProvenancedValue;
  intakeOpenDeg: ProvenancedValue;
  intakeCloseDeg: ProvenancedValue;
  exhaustOpenDeg: ProvenancedValue;
  exhaustCloseDeg: ProvenancedValue;
}

export const valveConfig: ValveConfig = {
  lobeLift: {
    value: 7.14,
    unit: 'mm',
    confidence: 'published',
    source:
      'GM service literature for the LLY: cam lobe lift 0.281 ± 0.002 in, intake and exhaust lobes equal (via dieselmechanic.info mirror); 0.281 in × 25.4 = 7.1374 mm',
  },
  rockerRatioIntake: {
    value: 1.36,
    unit: 'ratio',
    confidence: 'published',
    source:
      'Callies factory-ratio Duramax cam table (2001–2016): 1.36:1 intake rocker ratio; vendor-published, corroborated by forum consensus (L7 survey §9)',
  },
  rockerRatioExhaust: {
    value: 1.69,
    unit: 'ratio',
    confidence: 'published',
    source:
      'Callies factory-ratio Duramax cam table (2001–2016): 1.69:1 exhaust rocker ratio; vendor-published (L7 survey §9)',
  },
  intakeMaxLift: {
    value: 9.7,
    unit: 'mm',
    confidence: 'published',
    source: 'derived: GM lobe lift 7.14 mm × published intake rocker ratio 1.36 = 9.71 mm (L7 survey §4)',
  },
  exhaustMaxLift: {
    value: 12.1,
    unit: 'mm',
    confidence: 'published',
    source: 'derived: GM lobe lift 7.14 mm × published exhaust rocker ratio 1.69 = 12.07 mm (L7 survey §4)',
  },
  deckGap: {
    value: 2,
    unit: 'mm',
    confidence: 'placeholder',
    source:
      'D-011/D-012 illustrative placeholder — piston protrusion/deck clearance at TDC is not published for the LLY (L7 survey §3); crown-at-TDC stack 262.3 mm is derived from published parts (rod 163.0 + CH 49.8 + throw 49.5)',
  },
  borePitch: {
    value: 115,
    unit: 'mm',
    confidence: 'placeholder',
    source:
      'D-011/D-012 illustrative placeholder — bore spacing is not publicly available for the LLY (L7 survey §2, surveyed 2026-11-13)',
  },
  intakeOpenDeg: {
    value: 350,
    unit: 'deg',
    confidence: 'placeholder',
    source:
      'D-011/D-012 illustrative placeholder — cam duration, lobe separation, and valve timing events are not published for the LLY (L7 survey §4)',
  },
  intakeCloseDeg: {
    value: 590,
    unit: 'deg',
    confidence: 'placeholder',
    source:
      'D-011/D-012 illustrative placeholder — cam duration, lobe separation, and valve timing events are not published for the LLY (L7 survey §4)',
  },
  exhaustOpenDeg: {
    value: 110,
    unit: 'deg',
    confidence: 'placeholder',
    source:
      'D-011/D-012 illustrative placeholder — cam duration, lobe separation, and valve timing events are not published for the LLY (L7 survey §4)',
  },
  exhaustCloseDeg: {
    value: 350,
    unit: 'deg',
    confidence: 'placeholder',
    source:
      'D-011/D-012 illustrative placeholder — cam duration, lobe separation, and valve timing events are not published for the LLY (L7 survey §4)',
  },
};
