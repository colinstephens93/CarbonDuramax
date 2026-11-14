// Strict build-to-parameter resolver for the fuel-first performance model
// (D-008, D-032; docs/specs/M5-performance.md §2).

import type { Build, PartSlotId, PartVariant } from '../core/interfaces';
import { stockCatalog } from './stockBuild';

export const ALL_PART_SLOTS: readonly PartSlotId[] = [
  'turbo',
  'injectors',
  'cp3',
  'intake',
  'exhaust',
  'intercooler',
  'tune',
  'pistons',
  'rods',
  'camshaft',
  'heads',
  'fuelRail',
];

export const FUEL_REQ_KEYS = [
  'fuelReq1000',
  'fuelReq1400',
  'fuelReq1600',
  'fuelReq2000',
  'fuelReq2400',
  'fuelReq2800',
  'fuelReq3000',
  'fuelReq3200',
  'fuelReq3400',
] as const;

export interface ResolvedParams {
  readonly turbo: {
    readonly boostMaxPr: number;
    readonly spoolStartRpm: number;
    readonly spoolFullRpm: number;
    readonly maxAirKgS: number;
    readonly compressorEff: number;
  };
  readonly tune: {
    readonly boostReqPr: number;
    readonly afrMin: number;
    readonly egtLimitF: number;
    readonly fuelReqKnotsMm3: readonly [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ];
  };
  readonly injectors: {
    readonly maxFuelMm3: number;
  };
  readonly cp3: {
    readonly maxRailPsi: number;
    readonly flowBaseKgH: number;
    readonly flowSlopeKgHPerRpm: number;
  };
  readonly intercooler: {
    readonly effectiveness: number;
  };
  readonly intake: {
    readonly flowFactor: number;
  };
  readonly exhaust: {
    readonly flowFactor: number;
  };
  readonly heads: {
    readonly flowFactor: number;
  };
  readonly camshaft: {
    readonly veFactor: number;
  };
  readonly pistons: {
    readonly compressionRatio: number;
  };
  readonly rods: Record<string, never>;
  readonly fuelRail: Record<string, never>;
}

function findSlotVariant(
  build: Build,
  slotId: PartSlotId,
  catalog: readonly PartVariant[],
): PartVariant {
  const selectionId = build.selections[slotId];
  if (typeof selectionId !== 'string' || selectionId.length === 0) {
    throw new Error(`Build "${build.buildId}" is missing a selection for slot "${slotId}".`);
  }

  const entry = catalog.find((item) => item.id === selectionId);
  if (!entry) {
    throw new Error(
      `Build "${build.buildId}" references unknown catalog entry "${selectionId}" for slot "${slotId}".`,
    );
  }

  if (entry.slotId !== slotId) {
    throw new Error(
      `Slot mismatch on build "${build.buildId}": entry "${entry.id}" belongs to slot "${entry.slotId}", expected "${slotId}".`,
    );
  }

  return entry;
}

function readRequiredNumber(entry: PartVariant, key: string): number {
  if (!Object.prototype.hasOwnProperty.call(entry.performanceParams, key)) {
    throw new Error(
      `Catalog entry "${entry.id}" (slot "${entry.slotId}") is missing required performanceParams key "${key}".`,
    );
  }
  const value = entry.performanceParams[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(
      `Catalog entry "${entry.id}" (slot "${entry.slotId}") has non-finite performanceParams["${key}"].`,
    );
  }
  return value;
}

export function resolveBuild(
  build: Build,
  catalog: PartVariant[] = stockCatalog,
): ResolvedParams {
  // Validate every slot selection up front so rods and fuelRail are verified even though they carry no steady-state keys.
  const entries = {} as Record<PartSlotId, PartVariant>;
  for (const slotId of ALL_PART_SLOTS) {
    entries[slotId] = findSlotVariant(build, slotId, catalog);
  }

  const turboEntry = entries.turbo;
  const spoolStartRpm = readRequiredNumber(turboEntry, 'spoolStartRpm');
  const spoolFullRpm = readRequiredNumber(turboEntry, 'spoolFullRpm');
  if (spoolFullRpm <= spoolStartRpm) {
    throw new Error(
      `Catalog entry "${turboEntry.id}" must have spoolFullRpm > spoolStartRpm (got ${spoolFullRpm} <= ${spoolStartRpm}).`,
    );
  }

  const tuneEntry = entries.tune;
  const injectorsEntry = entries.injectors;
  const cp3Entry = entries.cp3;
  const intercoolerEntry = entries.intercooler;
  const intakeEntry = entries.intake;
  const exhaustEntry = entries.exhaust;
  const headsEntry = entries.heads;
  const camshaftEntry = entries.camshaft;
  const pistonsEntry = entries.pistons;

  return {
    turbo: {
      boostMaxPr: readRequiredNumber(turboEntry, 'boostMaxPr'),
      spoolStartRpm,
      spoolFullRpm,
      maxAirKgS: readRequiredNumber(turboEntry, 'maxAirKgS'),
      compressorEff: readRequiredNumber(turboEntry, 'compressorEff'),
    },
    tune: {
      boostReqPr: readRequiredNumber(tuneEntry, 'boostReqPr'),
      afrMin: readRequiredNumber(tuneEntry, 'afrMin'),
      egtLimitF: readRequiredNumber(tuneEntry, 'egtLimitF'),
      fuelReqKnotsMm3: [
        readRequiredNumber(tuneEntry, 'fuelReq1000'),
        readRequiredNumber(tuneEntry, 'fuelReq1400'),
        readRequiredNumber(tuneEntry, 'fuelReq1600'),
        readRequiredNumber(tuneEntry, 'fuelReq2000'),
        readRequiredNumber(tuneEntry, 'fuelReq2400'),
        readRequiredNumber(tuneEntry, 'fuelReq2800'),
        readRequiredNumber(tuneEntry, 'fuelReq3000'),
        readRequiredNumber(tuneEntry, 'fuelReq3200'),
        readRequiredNumber(tuneEntry, 'fuelReq3400'),
      ],
    },
    injectors: {
      maxFuelMm3: readRequiredNumber(injectorsEntry, 'maxFuelMm3'),
    },
    cp3: {
      maxRailPsi: readRequiredNumber(cp3Entry, 'maxRailPsi'),
      flowBaseKgH: readRequiredNumber(cp3Entry, 'flowBaseKgH'),
      flowSlopeKgHPerRpm: readRequiredNumber(cp3Entry, 'flowSlopeKgHPerRpm'),
    },
    intercooler: {
      effectiveness: readRequiredNumber(intercoolerEntry, 'effectiveness'),
    },
    intake: {
      flowFactor: readRequiredNumber(intakeEntry, 'flowFactor'),
    },
    exhaust: {
      flowFactor: readRequiredNumber(exhaustEntry, 'flowFactor'),
    },
    heads: {
      flowFactor: readRequiredNumber(headsEntry, 'flowFactor'),
    },
    camshaft: {
      veFactor: readRequiredNumber(camshaftEntry, 'veFactor'),
    },
    pistons: {
      compressionRatio: readRequiredNumber(pistonsEntry, 'compressionRatio'),
    },
    rods: {},
    fuelRail: {},
  };
}
