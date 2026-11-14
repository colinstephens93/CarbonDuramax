// Milestone 8 reference-frame definition tests (docs/specs/M8-part-variants.md §9.12).
// Imports the pure, DOM-free and Three.js-free src/ui/referenceFrames.ts table directly.

import { describe, expect, it } from 'vitest';
import { checkCompatibility, fullCatalog, slotForVariantId } from '../catalog';
import type { Build, PartSlotId } from '../core/interfaces';
import { stockBuild } from '../perf';
import { REFERENCE_FRAME_DEFS } from './referenceFrames';

describe('Milestone 8 reference frames (src/ui/referenceFrames.test.ts)', () => {
  it('12. validates RF-1..RF-10 states, keeps RF-1..RF-7 stock, and verifies RF-8..RF-10 variant ids & compatibility', () => {
    const expectedIds = [
      'RF-1',
      'RF-2',
      'RF-3',
      'RF-4',
      'RF-5',
      'RF-6',
      'RF-7',
      'RF-8',
      'RF-9',
      'RF-10',
    ];
    expect(Object.keys(REFERENCE_FRAME_DEFS)).toEqual(expectedIds);

    const catalogById = new Map(fullCatalog.map((v) => [v.id, v]));

    for (const id of expectedIds) {
      const def = REFERENCE_FRAME_DEFS[id]!;
      expect(Number.isFinite(def.thetaDeg)).toBe(true);
      expect(def.thetaDeg).toBeGreaterThanOrEqual(0);
      expect(def.thetaDeg).toBeLessThan(720);

      expect(def.position).toHaveLength(3);
      expect(def.target).toHaveLength(3);
      for (let k = 0; k < 3; k += 1) {
        expect(Number.isFinite(def.position[k])).toBe(true);
        expect(Number.isFinite(def.target[k])).toBe(true);
      }
      const camDist = Math.hypot(
        def.position[0] - def.target[0],
        def.position[1] - def.target[1],
        def.position[2] - def.target[2],
      );
      expect(camDist).toBeGreaterThan(0.1);

      expect(typeof def.exterior).toBe('boolean');

      if (def.explodePercent !== undefined) {
        expect(def.explodePercent).toBeGreaterThanOrEqual(0);
        expect(def.explodePercent).toBeLessThanOrEqual(100);
      }
      if (def.sectionMode !== undefined) {
        expect(['off', 'x', 'y']).toContain(def.sectionMode);
      }
      if (def.sectionPositionMm !== undefined) {
        expect(Number.isFinite(def.sectionPositionMm)).toBe(true);
      }
      if (def.xray !== undefined) {
        expect(typeof def.xray).toBe('boolean');
      }
      if (def.labels !== undefined) {
        expect(typeof def.labels).toBe('boolean');
      }
    }

    // RF-1 .. RF-7 carry no variants field (stock builds)
    for (const stockFrameId of ['RF-1', 'RF-2', 'RF-3', 'RF-4', 'RF-5', 'RF-6', 'RF-7']) {
      const def = REFERENCE_FRAME_DEFS[stockFrameId]!;
      expect('variants' in def).toBe(false);
      expect(def.variants).toBeUndefined();
    }

    // RF-8 .. RF-10 carry valid visual variants and form coherent M6 builds
    for (const modFrameId of ['RF-8', 'RF-9', 'RF-10']) {
      const def = REFERENCE_FRAME_DEFS[modFrameId]!;
      expect(def.variants).toBeDefined();
      expect(def.variants!.length).toBeGreaterThan(0);

      const selections: Record<PartSlotId, string> = { ...stockBuild.selections };
      const seenSlots = new Set<PartSlotId>();

      for (const variantId of def.variants!) {
        const entry = catalogById.get(variantId);
        expect(entry, `Unknown variant "${variantId}" in ${modFrameId}`).toBeDefined();
        expect(
          entry!.modelPath,
          `Variant "${variantId}" in ${modFrameId} has null modelPath`,
        ).not.toBeNull();

        const resolvedSlot = slotForVariantId(variantId, fullCatalog);
        expect(resolvedSlot).toBe(entry!.slotId);
        expect(seenSlots.has(resolvedSlot!)).toBe(false);
        seenSlots.add(resolvedSlot!);
        selections[resolvedSlot!] = variantId;
      }

      const frameBuild: Build = {
        buildId: modFrameId.toLowerCase(),
        name: modFrameId,
        selections,
      };
      expect(checkCompatibility(frameBuild, fullCatalog)).toEqual([]);
    }

    // Specifically confirm RF-10 isolates pistons_lowcomp with Exterior off + Explode 100% + turbo_large compatibility
    expect(REFERENCE_FRAME_DEFS['RF-10']!.exterior).toBe(false);
    expect(REFERENCE_FRAME_DEFS['RF-10']!.explodePercent).toBe(100);
    expect(REFERENCE_FRAME_DEFS['RF-10']!.variants).toEqual(['turbo_large', 'pistons_lowcomp']);
  });
});
