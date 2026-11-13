// Illustrative placeholder valvetrain timing, lift, clearance, and bore-pitch config (D-011, D-012).

import type { ProvenancedValue } from '../core/interfaces';

export interface ValveConfig {
  maxLift: ProvenancedValue;
  deckGap: ProvenancedValue;
  borePitch: ProvenancedValue;
  intakeOpenDeg: ProvenancedValue;
  intakeCloseDeg: ProvenancedValue;
  exhaustOpenDeg: ProvenancedValue;
  exhaustCloseDeg: ProvenancedValue;
}

export const valveConfig: ValveConfig = {
  maxLift: {
    value: 12,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 illustrative placeholder; Rev C concept set (D10) valvetrain lift unknown',
  },
  deckGap: {
    value: 2,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 illustrative placeholder; Rev C concept set (D10) deck height/clearance unknown',
  },
  borePitch: {
    value: 115,
    unit: 'mm',
    confidence: 'placeholder',
    source: 'D-011/D-012 illustrative placeholder; Rev C concept set (D05) bore pitch unknown',
  },
  intakeOpenDeg: {
    value: 350,
    unit: 'deg',
    confidence: 'placeholder',
    source: 'D-011/D-012 illustrative placeholder; Rev C concept set (D10) valve timing unknown',
  },
  intakeCloseDeg: {
    value: 590,
    unit: 'deg',
    confidence: 'placeholder',
    source: 'D-011/D-012 illustrative placeholder; Rev C concept set (D10) valve timing unknown',
  },
  exhaustOpenDeg: {
    value: 110,
    unit: 'deg',
    confidence: 'placeholder',
    source: 'D-011/D-012 illustrative placeholder; Rev C concept set (D10) valve timing unknown',
  },
  exhaustCloseDeg: {
    value: 350,
    unit: 'deg',
    confidence: 'placeholder',
    source: 'D-011/D-012 illustrative placeholder; Rev C concept set (D10) valve timing unknown',
  },
};
