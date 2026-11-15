// Valvetrain lift (published/derived, D-035, D-044) and illustrative placeholder timing, deck clearance, and bore-pitch config (D-011, D-012).

import type { ProvenancedValue } from '../core/interfaces';

export interface ValveConfig {
  intakeLobeLift: ProvenancedValue;
  exhaustLobeLift: ProvenancedValue;
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
  intakeLobeLift: {
    value: 7.273,
    unit: 'mm',
    confidence: 'published',
    source:
      'GM 2006 Chevrolet Silverado 2500 service manual (RPO LLY), "Engine General Specifications & Service Limits": Camshaft Lobe Lift — Intake — Production Value 7.273 mm (0.2863 in) (L7 survey §4; LLY data cross-check, D-044)',
  },
  exhaustLobeLift: {
    value: 5.907,
    unit: 'mm',
    confidence: 'published',
    source:
      'GM 2006 Chevrolet Silverado 2500 service manual (RPO LLY), "Engine General Specifications & Service Limits": Camshaft Lobe Lift — Exhaust — Production Value 5.907 mm (0.2326 in) (L7 survey §4; LLY data cross-check, D-044)',
  },
  rockerRatioIntake: {
    value: 1.36,
    unit: 'ratio',
    confidence: 'published',
    source:
      'GM 2006 Chevrolet Silverado 2500 service manual (RPO LLY), "Engine General Specifications & Service Limits": Valve Rocker Arm Ratio — Intake 1.36:1; corroborated by Callies factory-ratio Duramax cam table (2001–2016) (L7 survey §9; D-044)',
  },
  rockerRatioExhaust: {
    value: 1.69,
    unit: 'ratio',
    confidence: 'published',
    source:
      'GM 2006 Chevrolet Silverado 2500 service manual (RPO LLY), "Engine General Specifications & Service Limits": Valve Rocker Arm Ratio — Exhaust 1.69:1; corroborated by Callies factory-ratio Duramax cam table (2001–2016) (L7 survey §9; D-044)',
  },
  intakeMaxLift: {
    value: 9.9,
    unit: 'mm',
    confidence: 'published',
    source:
      'derived: GM LLY production intake lobe lift 7.273 mm × published intake rocker ratio 1.36 = 9.891 mm (0.3894 in), rounded to 9.9 mm (L7 survey §4; D-044)',
  },
  exhaustMaxLift: {
    value: 10.0,
    unit: 'mm',
    confidence: 'published',
    source:
      'derived: GM LLY production exhaust lobe lift 5.907 mm × published exhaust rocker ratio 1.69 = 9.983 mm (0.3930 in), rounded to 10.0 mm (L7 survey §4; D-044)',
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
