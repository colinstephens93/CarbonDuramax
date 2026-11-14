// Placeholder and published 2005 GM Duramax LLY 6.6L V8 geometry and stock rating config (D-012, D-016, D-017).

import type { EngineConfig, ProvenancedValue } from '../core/interfaces';

export const engineConfig: EngineConfig = {
  boreMm: {
    value: 103,
    unit: 'mm',
    confidence: 'published',
    source: 'Rev C concept set (D01 / S1)',
  },
  strokeMm: {
    value: 99,
    unit: 'mm',
    confidence: 'published',
    source: 'Rev C concept set (D01 / S1)',
  },
  crankThrowMm: {
    value: 49.5,
    unit: 'mm',
    confidence: 'published',
    source: 'derived: half of published 99.0 mm stroke (DieselHub; GM Authority; XDP)',
  },
  rodLengthMm: {
    value: 163.0,
    unit: 'mm',
    confidence: 'published',
    source:
      'Manley 6.417 in, BoostLine 6.418 in, Callies 6.418 in, UEM 163.000 mm — four independent sources converge (L7 survey §1)',
  },
  compressionRatio: {
    value: 17.5,
    unit: 'ratio',
    confidence: 'published',
    source: 'published 2004-2005 LLY references',
  },
  vAngleDeg: {
    value: 90,
    unit: 'deg',
    confidence: 'published',
    source: 'Rev C concept set (D01)',
  },
  firingOrder: [1, 2, 7, 8, 4, 5, 6, 3],
  bankAssignment: {
    1: 'RH',
    2: 'LH',
    3: 'RH',
    4: 'LH',
    5: 'RH',
    6: 'LH',
    7: 'RH',
    8: 'LH',
  },
};

export interface StockRatings {
  transmission: 'Allison automatic';
  peakPowerHp: ProvenancedValue;
  peakPowerRpm: ProvenancedValue;
  peakTorqueLbFt: ProvenancedValue;
  peakTorqueRpm: ProvenancedValue;
}

export const stockRatings: StockRatings = {
  transmission: 'Allison automatic',
  peakPowerHp: {
    value: 310,
    unit: 'hp',
    confidence: 'published',
    source: 'GM Media release 2005-08-01 via The Diesel Page (Allison automatic)',
  },
  peakPowerRpm: {
    value: 3000,
    unit: 'rpm',
    confidence: 'published',
    source: 'GM Media release 2005-08-01 via The Diesel Page (Allison automatic)',
  },
  peakTorqueLbFt: {
    value: 605,
    unit: 'lb-ft',
    confidence: 'published',
    source: 'GM Media release 2005-08-01 via The Diesel Page (Allison automatic)',
  },
  peakTorqueRpm: {
    value: 1600,
    unit: 'rpm',
    confidence: 'published',
    source: 'GM Media release 2005-08-01 via The Diesel Page (Allison automatic)',
  },
};
