// Milestone 13 pure internal-variant helpers and 24-entry catalog visual-disposition tests
// (docs/specs/M13-internal-variants.md §9 tests 5 & 10).
// Node-only; never imports Three.js.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fullCatalog } from '../catalog';
import { stockBuild } from '../perf';
import {
  CAM_OWNER_DECISION,
  CAM_OWNER_DECISION_TEXT,
  computeCombinedInternalSceneTriangles,
  computeInternalVariantSceneDelta,
  computeRodVariantSceneDelta,
  filterInternalPrimEntriesBySlot,
  INTERNAL_VISUAL_DISPOSITIONS,
  INTERNAL_VISUAL_SLOTS,
  isInternalVisualSlot,
  resolveVariantLoadFailure,
  ROD_VARIANT_ILLUSTRATIVE_NOTE,
  type InternalPrimEntry,
} from './internalVariants';

describe('Milestone 13 internal-variant pure helpers & 24-entry catalog disposition register (src/renderer/internalVariants.test.ts)', () => {
  it('5a. pure swap & combined accounting helpers: cap-only (274,784 vs 273,024), runtime (264,928 / 264,704 / 263,168), and N-02 slot filter', () => {
    // Module purity: internalVariants.ts must never import Three.js
    const internalVariantsSrc = readFileSync(
      resolve(process.cwd(), 'src', 'renderer', 'internalVariants.ts'),
      'utf8',
    );
    expect(internalVariantsSrc).not.toMatch(/from\s+['"]three/);
    expect(ROD_VARIANT_ILLUSTRATIVE_NOTE.length).toBeGreaterThan(20);

    expect(INTERNAL_VISUAL_SLOTS).toEqual(['pistons', 'rods']);
    expect(isInternalVisualSlot('pistons')).toBe(true);
    expect(isInternalVisualSlot('rods')).toBe(true);
    expect(isInternalVisualSlot('turbo')).toBe(false);
    expect(isInternalVisualSlot('camshaft')).toBe(false);

    // computeInternalVariantSceneDelta across array, descriptor, and Build.selections inputs
    expect(computeInternalVariantSceneDelta([])).toBe(0);
    expect(computeInternalVariantSceneDelta(stockBuild.selections)).toBe(0);
    expect(computeInternalVariantSceneDelta(['rods_forged'])).toBe(1_760);
    expect(computeInternalVariantSceneDelta({ ...stockBuild.selections, rods: 'rods_forged' })).toBe(
      1_760,
    );
    expect(computeInternalVariantSceneDelta(['pistons_lowcomp'])).toBe(2_944);
    expect(computeInternalVariantSceneDelta(['pistons_lowcomp', 'rods_forged'])).toBe(4_704);
    expect(
      computeInternalVariantSceneDelta([
        { variantId: 'pistons_lowcomp', slotId: 'pistons' },
        { variantId: 'rods_forged', slotId: 'rods' },
        { variantId: 'turbo_large', slotId: 'turbo' },
      ]),
    ).toBe(4_704);

    expect(computeRodVariantSceneDelta(1_180)).toBe(0);
    expect(computeRodVariantSceneDelta(1_372)).toBe(1_536);
    expect(computeRodVariantSceneDelta(1_400)).toBe(1_760);

    // Cap-only combined totals (rod cap 11,200 + piston cap 41,600 vs dropped-rod control 9,440 + 41,600)
    const capCombined = computeCombinedInternalSceneTriangles(221_984, 11_200, 41_600);
    const capStockRodControl = computeCombinedInternalSceneTriangles(221_984, 9_440, 41_600);
    expect(capCombined).toBe(274_784);
    expect(capStockRodControl).toBe(273_024);
    expect(capCombined).not.toBe(capStockRodControl);

    // Runtime combined totals (rod cap / prototype + shipped low-comp piston set 31,744 vs old-branch 9,440 + 31,744)
    const runtimeRodCap = computeCombinedInternalSceneTriangles(221_984, 11_200, 31_744);
    const runtimeRodProto = computeCombinedInternalSceneTriangles(221_984, 10_976, 31_744);
    const runtimeOldBranchControl = computeCombinedInternalSceneTriangles(221_984, 9_440, 31_744);
    expect(runtimeRodCap).toBe(264_928);
    expect(runtimeRodProto).toBe(264_704);
    expect(runtimeOldBranchControl).toBe(263_168);
    expect(runtimeRodCap).not.toBe(263_168);
    expect(runtimeRodProto).not.toBe(263_168);

    // N-02 pure slot filter: two-entry map fixture never leaks rods_forged into piston batch creation
    const twoEntryFixture = new Map<string, InternalPrimEntry<readonly string[]>>([
      ['pistons_lowcomp', { slotId: 'pistons', prims: ['piston_prim_0', 'piston_prim_1'] }],
      ['rods_forged', { slotId: 'rods', prims: ['rod_prim_0', 'rod_prim_1', 'rod_prim_2'] }],
    ]);
    const pistonOnly = filterInternalPrimEntriesBySlot(twoEntryFixture, 'pistons');
    expect(pistonOnly.map(([id]) => id)).toEqual(['pistons_lowcomp']);
    expect(pistonOnly.some(([id]) => id.includes('rods_forged'))).toBe(false);

    const rodOnly = filterInternalPrimEntriesBySlot(twoEntryFixture, 'rods');
    expect(rodOnly.map(([id]) => id)).toEqual(['rods_forged']);

    // Load-failure settle helper
    expect(resolveVariantLoadFailure(['rods_forged'], ['rods_forged'])).toEqual({
      failedVariantIds: ['rods_forged'],
      variantsLoaded: true,
    });
    expect(resolveVariantLoadFailure(['rods_forged'], [])).toEqual({
      failedVariantIds: [],
      variantsLoaded: true,
    });
  });

  it('10. no-visual dispositions & OD-1: covers all 24 catalog entries (6 variant-model / 12 stock / 6 no-visual) and pins OD-1-A verbatim', () => {
    expect(INTERNAL_VISUAL_DISPOSITIONS).toHaveLength(24);
    expect(fullCatalog).toHaveLength(24);

    const dispById = new Map(INTERNAL_VISUAL_DISPOSITIONS.map((d) => [d.id, d]));
    expect(dispById.size).toBe(24);

    // Every catalog entry appears in INTERNAL_VISUAL_DISPOSITIONS exactly once with matching slotId
    for (const catEntry of fullCatalog) {
      const disp = dispById.get(catEntry.id);
      expect(disp, `Missing disposition for catalog entry "${catEntry.id}"`).toBeDefined();
      expect(disp!.slotId).toBe(catEntry.slotId);
      expect(disp!.reason.trim().length).toBeGreaterThan(0);
      expect(disp!.evidence.trim().length).toBeGreaterThan(0);

      if (disp!.kind === 'variant-model') {
        expect(catEntry.modelPath).not.toBeNull();
      } else {
        expect(catEntry.modelPath).toBeNull();
      }
    }

    const variantModels = INTERNAL_VISUAL_DISPOSITIONS.filter((d) => d.kind === 'variant-model');
    const stocks = INTERNAL_VISUAL_DISPOSITIONS.filter((d) => d.kind === 'stock');
    const noVisuals = INTERNAL_VISUAL_DISPOSITIONS.filter((d) => d.kind === 'no-visual');

    expect(variantModels).toHaveLength(6);
    expect(variantModels.map((d) => d.id).sort()).toEqual(
      [
        'exhaust_4in',
        'intake_highflow',
        'intercooler_upgraded',
        'pistons_lowcomp',
        'rods_forged',
        'turbo_large',
      ].sort(),
    );

    expect(stocks).toHaveLength(12);
    expect(dispById.get('fuelRail_stock')?.kind).toBe('stock');

    expect(noVisuals).toHaveLength(6);
    expect(noVisuals.map((d) => d.id).sort()).toEqual(
      [
        'cam_performance',
        'cp3_stroker',
        'heads_ported',
        'injectors_plus30',
        'tune_performance',
        'tune_tow',
      ].sort(),
    );

    // Tunes explicitly cite software calibration
    expect(dispById.get('tune_tow')!.reason.toLowerCase()).toContain('software calibration');
    expect(dispById.get('tune_performance')!.reason.toLowerCase()).toContain(
      'software calibration',
    );

    // Owner Decision OD-1-A pinned and matches docs
    expect(CAM_OWNER_DECISION).toBe('OD-1-A');
    expect(dispById.get('cam_performance')?.ownerDecision).toBe('OD-1-A');

    const normalize = (s: string): string =>
      s
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();

    const specText = readFileSync(
      resolve(process.cwd(), 'docs', 'specs', 'M13-internal-variants.md'),
      'utf8',
    );
    const m13DocText = readFileSync(
      resolve(process.cwd(), 'docs', 'M13-INTERNAL-VARIANTS.md'),
      'utf8',
    );
    expect(normalize(specText)).toContain(normalize(CAM_OWNER_DECISION_TEXT));
    expect(normalize(m13DocText)).toContain(normalize(CAM_OWNER_DECISION_TEXT));
  });
});
