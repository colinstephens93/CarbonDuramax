// Milestone 8 shell-split contract, pure rules, and derived D-033 budget-guard tests
// (docs/specs/M8-part-variants.md §§9.7–9.9).
// Node environment only: parses binary GLBs via node:fs; never imports Three.js.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fullCatalog } from '../catalog';
import {
  computeVariantExplodeOffsetMm,
  EXTERIOR_PRESERVED_SUBTREES,
  EXTERIOR_PRESERVED_TRIANGLES,
  EXTERNAL_VISUAL_SLOTS,
  SHELL_PARTS_REPLACED_BY_SLOT,
  VARIANT_TRIANGLE_CAPS,
  VISUAL_VARIANT_SLOTS,
} from './partVariants';

const GLTF_MAGIC = 0x46546c67;
const JSON_CHUNK_TYPE = 0x4e4f534a;

interface GltfAccessor {
  count: number;
}

interface GltfPrimitive {
  attributes: Record<string, number>;
  indices?: number;
  mode?: number;
}

interface GltfMesh {
  primitives: GltfPrimitive[];
}

interface GltfNode {
  name?: string;
  mesh?: number;
  children?: number[];
}

interface GltfScene {
  nodes?: number[];
}

interface GltfJson {
  asset: { version: string };
  scene?: number;
  scenes?: GltfScene[];
  nodes?: GltfNode[];
  meshes?: GltfMesh[];
  accessors?: GltfAccessor[];
}

function parseGlbJson(filePath: string): GltfJson {
  const bytes = readFileSync(filePath);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(view.getUint32(0, true)).toBe(GLTF_MAGIC);
  expect(view.getUint32(4, true)).toBe(2);
  const chunk0Length = view.getUint32(12, true);
  expect(view.getUint32(16, true)).toBe(JSON_CHUNK_TYPE);
  const jsonText = new TextDecoder('utf-8').decode(bytes.subarray(20, 20 + chunk0Length));
  return JSON.parse(jsonText) as GltfJson;
}

function countMeshTriangles(gltf: GltfJson, meshIdx: number): number {
  const mesh = gltf.meshes?.[meshIdx];
  if (!mesh) {
    throw new Error(`Missing mesh index ${meshIdx}.`);
  }
  let tris = 0;
  for (const prim of mesh.primitives) {
    const mode = prim.mode ?? 4;
    if (mode !== 4) {
      throw new Error(`Unexpected primitive mode ${mode}.`);
    }
    if (prim.indices !== undefined) {
      const acc = gltf.accessors?.[prim.indices];
      if (!acc) throw new Error(`Missing index accessor ${prim.indices}.`);
      tris += acc.count / 3;
    } else {
      const posIdx = prim.attributes.POSITION;
      if (posIdx === undefined) continue;
      const acc = gltf.accessors?.[posIdx];
      if (!acc) throw new Error(`Missing position accessor ${posIdx}.`);
      tris += acc.count / 3;
    }
  }
  return tris;
}

function countSubtreeTriangles(gltf: GltfJson, rootNodeIdx: number): number {
  const nodes = gltf.nodes ?? [];
  let total = 0;
  const visit = (idx: number): void => {
    const node = nodes[idx];
    if (!node) {
      throw new Error(`Missing node index ${idx}.`);
    }
    if (node.mesh !== undefined) {
      total += countMeshTriangles(gltf, node.mesh);
    }
    for (const childIdx of node.children ?? []) {
      visit(childIdx);
    }
  };
  visit(rootNodeIdx);
  return total;
}

function countSceneTriangles(gltf: GltfJson): number {
  const sceneIdx = gltf.scene ?? 0;
  const rootNodes = gltf.scenes?.[sceneIdx]?.nodes ?? [];
  return rootNodes.reduce((sum, idx) => sum + countSubtreeTriangles(gltf, idx), 0);
}

describe('Milestone 8 shell split, pure variant rules, and D-033 budget guard (src/renderer/partVariants.test.ts)', () => {
  it('7. shell split contract: frozen shell GLB subtrees match EXTERIOR_PRESERVED_SUBTREES and EXTERIOR_PRESERVED_TRIANGLES (2056 / 560 / 5740, total 31396)', () => {
    const shellPath = resolve(process.cwd(), 'public', 'Duramax_LLY_2005_66L_V8.glb');
    const shellGltf = parseGlbJson(shellPath);
    const nodes = shellGltf.nodes ?? [];

    expect(countSceneTriangles(shellGltf)).toBe(31_396);

    const specIds = EXTERIOR_PRESERVED_SUBTREES.map((s) => s.id);
    expect(new Set(specIds).size).toBe(specIds.length);
    expect(Object.keys(EXTERIOR_PRESERVED_TRIANGLES).sort()).toEqual([...specIds].sort());

    const parsedCounts: Record<string, number> = {};
    for (const spec of EXTERIOR_PRESERVED_SUBTREES) {
      const groupIdx = nodes.findIndex((n) => n.name === spec.group);
      expect(groupIdx, `Missing top-level shell group "${spec.group}"`).toBeGreaterThanOrEqual(0);
      const groupNode = nodes[groupIdx]!;

      const targetNodeIdx =
        spec.childIndex !== undefined ? groupNode.children?.[spec.childIndex] : groupIdx;
      expect(
        targetNodeIdx,
        `Missing childIndex ${spec.childIndex} on shell group "${spec.group}"`,
      ).toBeDefined();

      const subtreeTris = countSubtreeTriangles(shellGltf, targetNodeIdx!);
      parsedCounts[spec.id] = subtreeTris;
      expect(EXTERIOR_PRESERVED_TRIANGLES[spec.id]).toBe(subtreeTris);
    }

    expect(parsedCounts).toEqual({
      turbo_unit: 2056,
      turbo_downpipe: 560,
      intake_tract: 5740,
    });
  });

  it('8. partVariants pure rules: explode offset clamping/zero-sign, visual slot lists, and shell replacement mapping', () => {
    const vec: readonly [number, number, number] = [160, -220, 120];

    const zeroOffset = computeVariantExplodeOffsetMm(vec, 0);
    expect(zeroOffset).toEqual([0, 0, 0]);
    expect(Object.is(zeroOffset[0], 0)).toBe(true);
    expect(Object.is(zeroOffset[1], 0)).toBe(true);
    expect(Object.is(zeroOffset[2], 0)).toBe(true);

    expect(computeVariantExplodeOffsetMm(vec, 1)).toEqual([160, -220, 120]);
    expect(computeVariantExplodeOffsetMm(vec, 0.5)).toEqual([80, -110, 60]);
    expect(computeVariantExplodeOffsetMm(vec, -0.5)).toEqual([0, 0, 0]);
    expect(computeVariantExplodeOffsetMm(vec, 2.5)).toEqual([160, -220, 120]);
    expect(computeVariantExplodeOffsetMm(vec, Number.NaN)).toEqual([0, 0, 0]);
    expect(computeVariantExplodeOffsetMm(vec, Number.POSITIVE_INFINITY)).toEqual([0, 0, 0]);
    expect(computeVariantExplodeOffsetMm(vec, Number.NEGATIVE_INFINITY)).toEqual([0, 0, 0]);

    expect(EXTERNAL_VISUAL_SLOTS).toEqual(['turbo', 'intake', 'exhaust', 'intercooler']);
    expect(VISUAL_VARIANT_SLOTS).toEqual([
      'turbo',
      'intake',
      'exhaust',
      'intercooler',
      'pistons',
    ]);

    const validPreservedIds = new Set(EXTERIOR_PRESERVED_SUBTREES.map((s) => s.id));
    for (const slot of EXTERNAL_VISUAL_SLOTS) {
      const replaced = SHELL_PARTS_REPLACED_BY_SLOT[slot];
      expect(replaced, `Expected SHELL_PARTS_REPLACED_BY_SLOT entry for "${slot}"`).toBeDefined();
      for (const partId of replaced!) {
        expect(
          validPreservedIds.has(partId),
          `Unknown preserved subtree "${partId}" referenced by slot "${slot}"`,
        ).toBe(true);
      }
    }
    expect(SHELL_PARTS_REPLACED_BY_SLOT.intercooler).toEqual([]);
  });

  it('9. budget guard (derived): worst-case scene triangles from VARIANT_TRIANGLE_CAPS and EXTERIOR_PRESERVED_TRIANGLES stay within D-033 phone (320k) and desktop (360k)', () => {
    const stockSceneTrianglesExtOn = 302_620;
    const phoneSceneAssetBudget = 320_000;
    const desktopSceneAssetBudget = 360_000;

    const stockPistonGltf = parseGlbJson(
      resolve(process.cwd(), 'public', 'models', 'rot_piston_c1_stock.glb'),
    );
    const stockPistonTris = countSceneTriangles(stockPistonGltf);
    expect(stockPistonTris).toBe(4832);

    const visualCatalogEntries = fullCatalog.filter((entry) => entry.modelPath !== null);
    expect(visualCatalogEntries.map((e) => e.id).sort()).toEqual(
      Object.keys(VARIANT_TRIANGLE_CAPS).sort(),
    );

    const externalSlotSet = new Set<string>(EXTERNAL_VISUAL_SLOTS);
    let externalCapSum = 0;
    let pistonCap = 0;
    for (const entry of visualCatalogEntries) {
      const cap = VARIANT_TRIANGLE_CAPS[entry.id];
      expect(cap, `Missing VARIANT_TRIANGLE_CAPS entry for "${entry.id}"`).toBeDefined();
      if (externalSlotSet.has(entry.slotId)) {
        externalCapSum += cap!;
      } else if (entry.slotId === 'pistons') {
        pistonCap = cap!;
      } else {
        throw new Error(`Unexpected visual variant slot "${entry.slotId}".`);
      }
    }

    expect(externalCapSum).toBeLessThanOrEqual(10_800);
    expect(externalCapSum + pistonCap).toBeLessThanOrEqual(16_000);

    const hiddenShellTris = Object.values(EXTERIOR_PRESERVED_TRIANGLES).reduce(
      (sum, n) => sum + n,
      0,
    );
    const pistonSwapDeltaTris = (pistonCap - stockPistonTris) * 8;
    const worstCaseSceneTriangles =
      stockSceneTrianglesExtOn - hiddenShellTris + externalCapSum + pistonSwapDeltaTris;

    expect(worstCaseSceneTriangles).toBeLessThanOrEqual(phoneSceneAssetBudget);
    expect(worstCaseSceneTriangles).toBeLessThanOrEqual(desktopSceneAssetBudget);
  });
});
