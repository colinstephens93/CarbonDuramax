// Milestone 8, 10 & 11 reference-frame definition tests
// (docs/specs/M8-part-variants.md §9.12, docs/specs/M11-capped-cutaways.md §8 test 7).
// Imports the pure, DOM-free and Three.js-free src/ui/referenceFrames.ts table directly.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkCompatibility, fullCatalog, slotForVariantId } from '../catalog';
import type { Build, PartSlotId } from '../core/interfaces';
import { stockBuild } from '../perf';
import { SECTION_RANGES_MM } from '../renderer/viewLayout';
import { REFERENCE_FRAME_DEFS } from './referenceFrames';

describe('Milestone 8, 10, 11 & 12 reference frames (src/ui/referenceFrames.test.ts)', () => {
  it('10. validates RF-1..RF-20 states, keeps stock frames variant-free, verifies RF-18..RF-20 intakeCover flags & RF-19 section checklist, and verifies RF-8..RF-10 compatibility', () => {
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
      'RF-11',
      'RF-12',
      'RF-13',
      'RF-14',
      'RF-15',
      'RF-16',
      'RF-17',
      'RF-18',
      'RF-19',
      'RF-20',
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
      if (def.intakeCover !== undefined) {
        expect(typeof def.intakeCover).toBe('boolean');
      }
    }

    // RF-1 .. RF-17 keep intakeCover undefined/false (cover defaults off)
    for (let i = 1; i <= 17; i += 1) {
      const def = REFERENCE_FRAME_DEFS[`RF-${i}`]!;
      expect(def.intakeCover ?? false).toBe(false);
    }

    // RF-1 .. RF-7 and RF-11 .. RF-20 carry no variants field (stock builds)
    for (const stockFrameId of [
      'RF-1',
      'RF-2',
      'RF-3',
      'RF-4',
      'RF-5',
      'RF-6',
      'RF-7',
      'RF-11',
      'RF-12',
      'RF-13',
      'RF-14',
      'RF-15',
      'RF-16',
      'RF-17',
      'RF-18',
      'RF-19',
      'RF-20',
    ]) {
      const def = REFERENCE_FRAME_DEFS[stockFrameId]!;
      expect('variants' in def).toBe(false);
      expect(def.variants).toBeUndefined();
    }

    // M10 RF-11 .. RF-13 all use stock builds with Exterior on
    for (const m10FrameId of ['RF-11', 'RF-12', 'RF-13']) {
      expect(REFERENCE_FRAME_DEFS[m10FrameId]!.exterior).toBe(true);
    }

    // M11 §8 test 7 & M12 §9 test 10: section-active frames within SECTION_RANGES_MM and at a true cutting plane
    for (const secFrameId of ['RF-14', 'RF-15', 'RF-16', 'RF-17', 'RF-19']) {
      const def = REFERENCE_FRAME_DEFS[secFrameId]!;
      expect(def.sectionMode === 'x' || def.sectionMode === 'y').toBe(true);
      expect(def.sectionPositionMm).toBeDefined();
      const mode = def.sectionMode as 'x' | 'y';
      const posMm = def.sectionPositionMm!;
      const range = SECTION_RANGES_MM[mode];
      expect(posMm).toBeGreaterThanOrEqual(range.minMm);
      expect(posMm).toBeLessThanOrEqual(range.maxMm);

      if (mode === 'x') {
        expect(posMm).toBeLessThan(617.8);
      } else {
        const hasIntercooler = def.variants?.includes('intercooler_upgraded') ?? false;
        expect(posMm).toBeLessThan(hasIntercooler ? 696.0 : 480.66);
      }
    }

    // M12 §9 test 10: RF-18..RF-20 specific assertions + docs/REFERENCE_FRAMES.md Section-Fill Checklist check
    for (const m12FrameId of ['RF-18', 'RF-19', 'RF-20']) {
      const def = REFERENCE_FRAME_DEFS[m12FrameId]!;
      expect(def.exterior).toBe(true);
      expect(def.intakeCover).toBe(true);
    }
    expect(REFERENCE_FRAME_DEFS['RF-18']!.sectionMode ?? 'off').toBe('off');
    expect(REFERENCE_FRAME_DEFS['RF-18']!.explodePercent ?? 0).toBe(0);
    expect(REFERENCE_FRAME_DEFS['RF-19']!.sectionMode).toBe('x');
    expect(REFERENCE_FRAME_DEFS['RF-19']!.sectionPositionMm).toBe(300);
    // D-047: RF-19 camera sits on the +X side of X = 300 mm (> 0.300 m) so the +X cut face is unoccluded
    expect(REFERENCE_FRAME_DEFS['RF-19']!.position[0]).toBeGreaterThan(0.3);
    expect(REFERENCE_FRAME_DEFS['RF-20']!.sectionMode ?? 'off').toBe('off');
    expect(REFERENCE_FRAME_DEFS['RF-20']!.explodePercent).toBe(100);
    // D-047: RF-20 camera sits safely above the +260 mm lifted cover pad (Z = 0.678 m)
    expect(REFERENCE_FRAME_DEFS['RF-20']!.position[2]).toBeGreaterThan(1.0);

    const refFramesDoc = readFileSync(
      resolve(process.cwd(), 'docs', 'REFERENCE_FRAMES.md'),
      'utf8',
    );
    expect(refFramesDoc).toContain(
      '## Section-Fill Checklist (Shared by `RF-6`, `RF-14`…`RF-17`, and `RF-19`, Milestone 11 Spec §7.2, extended M12)',
    );
    expect(refFramesDoc).toContain(
      "The M12 cover's open thin-walled underside is a material band at the cut: the cover cap must show the wall band and leave the open cavity as air, not a filled slab.",
    );

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
