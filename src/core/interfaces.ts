// FROZEN INTERFACE CONTRACT (D-010): Do not modify except through a formal spec revision.

export interface ProvenancedValue {
  value: number;
  unit: string;
  confidence: 'verified' | 'published' | 'placeholder';
  source: string;
}

export type CylinderId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Bank = 'RH' | 'LH';

export interface EngineConfig {
  boreMm: ProvenancedValue;
  strokeMm: ProvenancedValue;
  crankThrowMm: ProvenancedValue;
  rodLengthMm: ProvenancedValue;
  compressionRatio: ProvenancedValue;
  vAngleDeg: ProvenancedValue;
  firingOrder: number[];
  bankAssignment: Record<CylinderId, Bank>;
}

export interface CrankState {
  crankAngleDeg: number;
  rpm: number;
  pistonPositionM: Record<CylinderId, number>;
  valveLiftM: Record<CylinderId, { intake: number; exhaust: number }>;
}

export type PartSlotId =
  | 'turbo'
  | 'injectors'
  | 'cp3'
  | 'intake'
  | 'exhaust'
  | 'intercooler'
  | 'tune'
  | 'pistons'
  | 'rods'
  | 'camshaft'
  | 'heads'
  | 'fuelRail';

export interface PartVariant {
  id: string;
  slotId: PartSlotId;
  name: string;
  provenance: 'verified' | 'illustrative';
  modelPath: string | null;
  explodeVectorMm: [number, number, number];
  performanceParams: Record<string, number>;
  compatibility: Record<string, string[]>;
  notes?: string;
}

export interface Build {
  buildId: string;
  name: string;
  selections: Record<PartSlotId, string>;
}

export type LimitKind = 'smoke' | 'egt' | 'turbo' | 'cp3' | 'tune';

export interface PerformanceResult {
  rpmPoints: number[];
  torqueLbFt: number[];
  powerHp: number[];
  bindingLimitPerPoint: LimitKind[];
  uncertaintyPct: number[];
}
