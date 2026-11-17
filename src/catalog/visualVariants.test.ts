// Milestone 8 catalog visual variant tests (docs/specs/M8-part-variants.md §§9.1–9.3).

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Build, PartSlotId } from '../core/interfaces';
import { stockBuild, stockCatalog } from '../perf';
import {
  fullCatalog,
  slotForVariantId,
  visualVariantsForBuild,
  type VisualVariantSelection,
} from './index';

const EXPECTED_VISUAL_ENTRIES: ReadonlyArray<{
  readonly slotId: PartSlotId;
  readonly variantId: string;
  readonly modelPath: string;
  readonly explodeVectorMm: readonly [number, number, number];
}> = [
  {
    slotId: 'turbo',
    variantId: 'turbo_large',
    modelPath: 'models/variants/turbo_unit_engine_large.glb',
    explodeVectorMm: [0, 0, 260],
  },
  {
    slotId: 'intake',
    variantId: 'intake_highflow',
    modelPath: 'models/variants/intake_tract_engine_highflow.glb',
    explodeVectorMm: [0, -260, 150],
  },
  {
    slotId: 'exhaust',
    variantId: 'exhaust_4in',
    modelPath: 'models/variants/exhaust_system_engine_4inch.glb',
    explodeVectorMm: [-320, 0, 0],
  },
  {
    slotId: 'intercooler',
    variantId: 'intercooler_upgraded',
    modelPath: 'models/variants/intercooler_core_engine_upgraded.glb',
    explodeVectorMm: [0, 260, 0],
  },
  {
    slotId: 'pistons',
    variantId: 'pistons_lowcomp',
    modelPath: 'models/variants/rot_piston_c1_lowcomp.glb',
    explodeVectorMm: [0, 0, 0],
  },
  {
    slotId: 'rods',
    variantId: 'rods_forged',
    modelPath: 'models/variants/rot_conrod_c1_forged.glb',
    explodeVectorMm: [0, 0, 0],
  },
];

function makeBuildWith(overrides: Partial<Record<PartSlotId, string>>): Build {
  return {
    buildId: 'modified',
    name: 'Modified build',
    selections: {
      ...stockBuild.selections,
      ...overrides,
    },
  };
}

describe('Milestone 8 & 13 catalog visual variants (src/catalog/visualVariants.test.ts)', () => {
  it('1. catalog visual data: exactly six modified entries have non-null modelPath on disk; other 18 stay null/zero', () => {
    const publicDir = resolve(process.cwd(), 'public');
    const expectedById = new Map(EXPECTED_VISUAL_ENTRIES.map((e) => [e.variantId, e]));

    const withModelPath = fullCatalog.filter((entry) => entry.modelPath !== null);
    expect(withModelPath).toHaveLength(6);
    expect(withModelPath.map((e) => e.id).sort()).toEqual(
      EXPECTED_VISUAL_ENTRIES.map((e) => e.variantId).sort(),
    );

    const withoutModelPath = fullCatalog.filter((entry) => entry.modelPath === null);
    expect(withoutModelPath).toHaveLength(18);

    const rodsForged = fullCatalog.find((entry) => entry.id === 'rods_forged')!;
    expect(rodsForged.modelPath).toBe('models/variants/rot_conrod_c1_forged.glb');
    expect(rodsForged.explodeVectorMm).toEqual([0, 0, 0]);

    const seenPaths = new Set<string>();
    for (const entry of fullCatalog) {
      const expected = expectedById.get(entry.id);
      if (expected) {
        expect(entry.slotId).toBe(expected.slotId);
        expect(entry.modelPath).toBe(expected.modelPath);
        expect(entry.modelPath).toMatch(/^models\/variants\/[a-z0-9_]+\.glb$/);
        expect(seenPaths.has(entry.modelPath!)).toBe(false);
        seenPaths.add(entry.modelPath!);
        expect(
          existsSync(resolve(publicDir, entry.modelPath!)),
          `Missing asset at public/${entry.modelPath}`,
        ).toBe(true);
      } else {
        expect(entry.modelPath).toBeNull();
        expect(entry.explodeVectorMm).toEqual([0, 0, 0]);
      }
    }

    // Stock entries specifically never carry visual variant paths
    for (const stockEntry of stockCatalog) {
      expect(stockEntry.modelPath).toBeNull();
      expect(stockEntry.explodeVectorMm).toEqual([0, 0, 0]);
    }
  });

  it('2. explode vectors: four external entries carry §2 vectors, pistons_lowcomp, rods_forged and other 18 entries carry [0, 0, 0]', () => {
    const expectedVectors = new Map<string, readonly [number, number, number]>([
      ['turbo_large', [0, 0, 260]],
      ['intake_highflow', [0, -260, 150]],
      ['exhaust_4in', [-320, 0, 0]],
      ['intercooler_upgraded', [0, 260, 0]],
      ['pistons_lowcomp', [0, 0, 0]],
      ['rods_forged', [0, 0, 0]],
    ]);

    for (const entry of fullCatalog) {
      const expectedVec = expectedVectors.get(entry.id) ?? [0, 0, 0];
      expect(entry.explodeVectorMm, `Unexpected explodeVectorMm on ${entry.id}`).toEqual(
        expectedVec,
      );
    }
  });

  it('3. visualVariantsForBuild & slotForVariantId: resolves builds in slot order and skips non-visual/unknown entries safely', () => {
    expect(visualVariantsForBuild(stockBuild)).toEqual([]);
    expect(visualVariantsForBuild(stockBuild, fullCatalog)).toEqual([]);

    const fullVisualBuild = makeBuildWith({
      turbo: 'turbo_large',
      injectors: 'injectors_plus30',
      cp3: 'cp3_stroker',
      intake: 'intake_highflow',
      exhaust: 'exhaust_4in',
      intercooler: 'intercooler_upgraded',
      tune: 'tune_performance',
      pistons: 'pistons_lowcomp',
      rods: 'rods_forged',
      camshaft: 'cam_performance',
      heads: 'heads_ported',
    });

    const resolved: VisualVariantSelection[] = visualVariantsForBuild(fullVisualBuild, fullCatalog);
    expect(resolved).toEqual(EXPECTED_VISUAL_ENTRIES);

    const nonVisualModifiedOnly = makeBuildWith({
      injectors: 'injectors_plus30',
      cp3: 'cp3_stroker',
      tune: 'tune_performance',
      camshaft: 'cam_performance',
      heads: 'heads_ported',
    });
    expect(visualVariantsForBuild(nonVisualModifiedOnly, fullCatalog)).toEqual([]);
    expect(slotForVariantId('rods_forged', fullCatalog)).toBe('rods');

    const malformedBuild: Build = {
      buildId: 'malformed',
      name: 'Malformed',
      selections: {
        ...stockBuild.selections,
        turbo: 'nonexistent_turbo_999',
        intake: '',
      },
    };
    expect(() => visualVariantsForBuild(malformedBuild, fullCatalog)).not.toThrow();
    expect(visualVariantsForBuild(malformedBuild, fullCatalog)).toEqual([]);

    for (const expected of EXPECTED_VISUAL_ENTRIES) {
      expect(slotForVariantId(expected.variantId, fullCatalog)).toBe(expected.slotId);
    }
    expect(slotForVariantId(stockBuild.selections.turbo, fullCatalog)).toBe('turbo');
    expect(slotForVariantId('unknown_part_id', fullCatalog)).toBeNull();
  });
});
