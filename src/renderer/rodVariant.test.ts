// Milestone 13 forged connecting-rod variant asset contract, stock-interface preservation,
// swap/combined-triangle accounting, M11 section-cap compatibility at X = 388.3 mm,
// performance neutrality, frozen-asset SHA-256 baseline, and load-failure fallback tests
// (docs/specs/M13-internal-variants.md §9 tests 1, 2, 5, 6, 7, 11, 12).
// Node-only: binary GLB parse via node:fs + headless Three.js geometry/cap slicing (no WebGL).

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { checkCompatibility, fullCatalog } from '../catalog';
import { detailConfig } from '../config/detailConfig';
import { engineConfig } from '../config/engineConfig';
import { valveConfig } from '../config/valveConfig';
import type { Build, PartSlotId, PartVariant } from '../core/interfaces';
import { computeState, crankPinPositionM } from '../core/kinematics';
import { computeCurve, computeDetails, stockBuild } from '../perf';
import {
  computeCombinedInternalSceneTriangles,
  computeInternalVariantSceneDelta,
  computeRodVariantSceneDelta,
  filterInternalPrimEntriesBySlot,
  isInternalVisualSlot,
  resolveVariantLoadFailure,
  ROD_VARIANT_BEAM_FLANGE_Y_MM,
  ROD_VARIANT_BIG_END_WIDTH_MM,
  ROD_VARIANT_EXPECTED_COMPONENTS,
  ROD_VARIANT_EXPECTED_MATERIALS,
  ROD_VARIANT_FLANGE_THICKNESS_MM,
  ROD_VARIANT_JOURNAL_DIAMETER_MM,
  ROD_VARIANT_MAX_FILE_BYTES,
  ROD_VARIANT_MODEL_PATH,
  ROD_VARIANT_ROOT_NAME,
  ROD_VARIANT_SMALLEND_NAME,
  ROD_VARIANT_SMALLEND_Z_MM,
  ROD_VARIANT_SMALL_END_FLANGE_Y_MM,
  ROD_VARIANT_TRIANGLE_CAP,
  ROD_VARIANT_WEB_HALF_WIDTH_MM,
  ROD_VARIANT_WRIST_PIN_DIAMETER_MM,
  type InternalPrimEntry,
} from './internalVariants';
import { computeEngineLayout } from './layout';
import {
  createPartLoader,
  extractAllPartPrimitives,
  extractPartPrimitives,
  wrapInPartLocalFrame,
} from './partLoader';
import {
  buildCapGeometry,
  createCapBuildTarget,
  prepareCapSource,
  SECTION_CAP_MAX_TRIANGLES,
} from './sectionCaps';

const GLTF_MAGIC = 0x46546c67;
const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;

interface GltfAccessor {
  bufferView?: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
}

interface GltfBufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
}

interface GltfPrimitive {
  attributes: Record<string, number>;
  indices?: number;
  material?: number;
  mode?: number;
  targets?: unknown[];
}

interface GltfMesh {
  name?: string;
  primitives: GltfPrimitive[];
}

interface GltfNode {
  name?: string;
  mesh?: number;
  children?: number[];
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  matrix?: number[];
}

interface GltfJson {
  asset: { version: string };
  scene?: number;
  scenes?: Array<{ nodes?: number[] }>;
  nodes?: GltfNode[];
  meshes?: GltfMesh[];
  materials?: Array<{
    name?: string;
    pbrMetallicRoughness?: {
      baseColorFactor?: [number, number, number, number];
      metallicFactor?: number;
      roughnessFactor?: number;
      baseColorTexture?: unknown;
      metallicRoughnessTexture?: unknown;
    };
    normalTexture?: unknown;
    occlusionTexture?: unknown;
    emissiveTexture?: unknown;
  }>;
  accessors?: GltfAccessor[];
  bufferViews?: GltfBufferView[];
  images?: unknown[];
  textures?: unknown[];
  skins?: unknown[];
  animations?: unknown[];
}

interface ParsedGlb {
  readonly byteLength: number;
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly doc: GltfJson;
  readonly bin: Uint8Array<ArrayBuffer>;
}

function parseGlb(filePath: string): ParsedGlb {
  const buf = readFileSync(filePath);
  const bytes = new Uint8Array(buf.byteLength);
  bytes.set(buf);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(view.getUint32(0, true)).toBe(GLTF_MAGIC);
  expect(view.getUint32(4, true)).toBe(2);
  expect(view.getUint32(8, true)).toBe(bytes.byteLength);

  let offset = 12;
  let doc: GltfJson | null = null;
  let bin: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  while (offset < bytes.byteLength) {
    const chunkLen = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    offset += 8;
    const slice = bytes.subarray(offset, offset + chunkLen);
    offset += chunkLen;
    if (chunkType === JSON_CHUNK_TYPE) {
      doc = JSON.parse(new TextDecoder('utf-8').decode(slice)) as GltfJson;
    } else if (chunkType === BIN_CHUNK_TYPE) {
      bin = slice;
    }
  }
  if (!doc) {
    throw new Error(`Missing JSON chunk in ${filePath}`);
  }
  return { byteLength: bytes.byteLength, bytes, doc, bin };
}

const TYPE_COMPONENTS: Readonly<Record<string, number>> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
};

function readFloat32Vec3Accessor(parsed: ParsedGlb, accIdx: number): Float64Array {
  const acc = parsed.doc.accessors?.[accIdx]!;
  expect(acc.componentType).toBe(5126);
  expect(TYPE_COMPONENTS[acc.type]).toBe(3);
  const bv = parsed.doc.bufferViews?.[acc.bufferView!]!;
  const stride = bv.byteStride ?? 12;
  const base = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const view = new DataView(parsed.bin.buffer, parsed.bin.byteOffset, parsed.bin.byteLength);
  const out = new Float64Array(acc.count * 3);
  for (let i = 0; i < acc.count; i += 1) {
    const off = base + i * stride;
    out[i * 3] = view.getFloat32(off, true);
    out[i * 3 + 1] = view.getFloat32(off + 4, true);
    out[i * 3 + 2] = view.getFloat32(off + 8, true);
  }
  return out;
}

function readIndexAccessor(parsed: ParsedGlb, accIdx: number): Uint32Array {
  const acc = parsed.doc.accessors?.[accIdx]!;
  expect(TYPE_COMPONENTS[acc.type]).toBe(1);
  const bv = parsed.doc.bufferViews?.[acc.bufferView!]!;
  const elemSize = acc.componentType === 5125 ? 4 : acc.componentType === 5123 ? 2 : 1;
  const stride = bv.byteStride ?? elemSize;
  const base = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const view = new DataView(parsed.bin.buffer, parsed.bin.byteOffset, parsed.bin.byteLength);
  const out = new Uint32Array(acc.count);
  for (let i = 0; i < acc.count; i += 1) {
    const off = base + i * stride;
    out[i] =
      elemSize === 4
        ? view.getUint32(off, true)
        : elemSize === 2
          ? view.getUint16(off, true)
          : view.getUint8(off);
  }
  return out;
}

function nodeMatrix4(node: GltfNode): THREE.Matrix4 {
  if (node.matrix) {
    return new THREE.Matrix4().fromArray(node.matrix);
  }
  const t = node.translation ?? [0, 0, 0];
  const r = node.rotation ?? [0, 0, 0, 1];
  const s = node.scale ?? [1, 1, 1];
  return new THREE.Matrix4().compose(
    new THREE.Vector3(t[0], t[1], t[2]),
    new THREE.Quaternion(r[0], r[1], r[2], r[3]),
    new THREE.Vector3(s[0], s[1], s[2]),
  );
}

interface ExtractedSceneGeometry {
  readonly verticesGltfM: Array<[number, number, number]>;
  readonly verticesPartLocalMm: Array<[number, number, number]>;
  readonly triangles: Array<[number, number, number]>;
  readonly primitiveCount: number;
}

function extractSceneGeometry(parsed: ParsedGlb): ExtractedSceneGeometry {
  const nodes = parsed.doc.nodes ?? [];
  const worldMats = new Map<number, THREE.Matrix4>();
  const visit = (idx: number, parent: THREE.Matrix4): void => {
    const cur = new THREE.Matrix4().multiplyMatrices(parent, nodeMatrix4(nodes[idx]!));
    worldMats.set(idx, cur);
    for (const c of nodes[idx]!.children ?? []) {
      visit(c, cur);
    }
  };
  const roots = parsed.doc.scenes?.[parsed.doc.scene ?? 0]?.nodes ?? [];
  for (const r of roots) {
    visit(r, new THREE.Matrix4().identity());
  }

  const verticesGltfM: Array<[number, number, number]> = [];
  const verticesPartLocalMm: Array<[number, number, number]> = [];
  const triangles: Array<[number, number, number]> = [];
  let primitiveCount = 0;
  const v = new THREE.Vector3();

  for (const [nodeIdx, wMat] of [...worldMats.entries()].sort((a, b) => a[0] - b[0])) {
    const node = nodes[nodeIdx]!;
    if (node.mesh === undefined) continue;
    const mesh = parsed.doc.meshes?.[node.mesh]!;
    for (const prim of mesh.primitives) {
      primitiveCount += 1;
      expect(prim.mode ?? 4).toBe(4);
      expect(Object.keys(prim.attributes).sort()).toEqual(['NORMAL', 'POSITION']);
      expect(prim.indices).toBeDefined();
      expect(prim.targets).toBeUndefined();

      const pos = readFloat32Vec3Accessor(parsed, prim.attributes.POSITION!);
      const idx = readIndexAccessor(parsed, prim.indices!);
      const base = verticesGltfM.length;
      const vertCount = pos.length / 3;
      for (let i = 0; i < vertCount; i += 1) {
        v.set(pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!).applyMatrix4(wMat);
        verticesGltfM.push([v.x, v.y, v.z]);
        // wrapInPartLocalFrame (+90° X): (x_mm, y_mm, z_mm) = 1000 * (g_x, -g_z, g_y)
        verticesPartLocalMm.push([v.x * 1000, -v.z * 1000, v.y * 1000]);
      }
      for (let t = 0; t + 2 < idx.length; t += 3) {
        triangles.push([base + idx[t]!, base + idx[t + 1]!, base + idx[t + 2]!]);
      }
    }
  }

  return { verticesGltfM, verticesPartLocalMm, triangles, primitiveCount };
}

function auditWatertightAndComponents(
  verticesM: ReadonlyArray<readonly [number, number, number]>,
  triangles: ReadonlyArray<readonly [number, number, number]>,
  weldQuantumM = 1e-5,
): { boundaryEdges: number; nonManifoldEdges: number; components: number } {
  const keyToWeld = new Map<string, number>();
  const vertToWeld = new Int32Array(verticesM.length);
  let nextWeld = 0;
  for (let i = 0; i < verticesM.length; i += 1) {
    const p = verticesM[i]!;
    const key = `${Math.round(p[0] / weldQuantumM)},${Math.round(p[1] / weldQuantumM)},${Math.round(p[2] / weldQuantumM)}`;
    let wid = keyToWeld.get(key);
    if (wid === undefined) {
      wid = nextWeld;
      nextWeld += 1;
      keyToWeld.set(key, wid);
    }
    vertToWeld[i] = wid;
  }

  const edgeCounts = new Map<string, number>();
  const vertToTris = new Map<number, number[]>();
  const validTris: Array<[number, number, number]> = [];

  for (const [ia, ib, ic] of triangles) {
    const a = vertToWeld[ia]!;
    const b = vertToWeld[ib]!;
    const c = vertToWeld[ic]!;
    if (a === b || b === c || c === a) continue;
    const tIdx = validTris.length;
    validTris.push([a, b, c]);
    for (const [u, w] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const ek = u < w ? `${u}_${w}` : `${w}_${u}`;
      edgeCounts.set(ek, (edgeCounts.get(ek) ?? 0) + 1);
    }
    for (const vx of [a, b, c]) {
      const list = vertToTris.get(vx);
      if (list) list.push(tIdx);
      else vertToTris.set(vx, [tIdx]);
    }
  }

  let boundaryEdges = 0;
  let nonManifoldEdges = 0;
  for (const c of edgeCounts.values()) {
    if (c === 1) boundaryEdges += 1;
    else if (c > 2) nonManifoldEdges += 1;
  }

  const visited = new Uint8Array(validTris.length);
  let components = 0;
  const stack: number[] = [];
  for (let i = 0; i < validTris.length; i += 1) {
    if (visited[i]) continue;
    components += 1;
    visited[i] = 1;
    stack.push(i);
    while (stack.length > 0) {
      const cur = stack.pop()!;
      for (const vx of validTris[cur]!) {
        for (const nb of vertToTris.get(vx) ?? []) {
          if (!visited[nb]) {
            visited[nb] = 1;
            stack.push(nb);
          }
        }
      }
    }
  }

  return { boundaryEdges, nonManifoldEdges, components };
}

interface ExtractedRodSignatureMm {
  readonly bigJournalDiameterMm: number;
  readonly wristPinDiameterMm: number;
  readonly bigEndAxialWidthMm: number;
  readonly beamFlangeBigOuterYMm: number;
  readonly beamFlangeSmallOuterYMm: number;
  readonly flangeThicknessYMm: number;
  readonly webHalfWidthXMm: number;
}

/**
 * Independently extracts interface and visible-signature dimensions directly from the GLB
 * part-local vertex coordinates by Z/X/Y band isolation (never reading build-script metadata).
 */
function extractRodSignatureFromVerticesMm(
  ptsMm: ReadonlyArray<readonly [number, number, number]>,
): ExtractedRodSignatureMm {
  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let minBigBoreR = Number.POSITIVE_INFINITY;
  let minSmallBoreR = Number.POSITIVE_INFINITY;

  const flangePosY: Array<[number, number, number]> = [];
  const webPts: Array<[number, number, number]> = [];

  for (const p of ptsMm) {
    const [x, y, z] = p;
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;

    if (Math.abs(x) > 13.0 && z > -36.0 && z < 36.0) {
      const r = Math.hypot(y, z);
      if (r < minBigBoreR) minBigBoreR = r;
    }
    if (z > 144.5) {
      const rSmall = Math.hypot(y, z - ROD_VARIANT_SMALLEND_Z_MM);
      if (rSmall < minSmallBoreR) minSmallBoreR = rSmall;
    }
    if (z >= 36.0 && z <= 144.2) {
      if (Math.abs(x) >= 9.5 && Math.abs(x) <= 11.5 && y > 0) {
        flangePosY.push([x, y, z]);
      } else if (Math.abs(x) < 9.0) {
        webPts.push([x, y, z]);
      }
    }
  }

  expect(flangePosY.length).toBeGreaterThanOrEqual(8);
  expect(webPts.length).toBeGreaterThanOrEqual(8);

  const zMinShank = Math.min(...flangePosY.map((p) => p[2]));
  const zMaxShank = Math.max(...flangePosY.map((p) => p[2]));

  const bigBand = flangePosY.filter((p) => Math.abs(p[2] - zMinShank) < 0.5);
  const smallBand = flangePosY.filter((p) => Math.abs(p[2] - zMaxShank) < 0.5);
  expect(bigBand.length).toBeGreaterThanOrEqual(4);
  expect(smallBand.length).toBeGreaterThanOrEqual(4);

  const bigOutY = Math.max(...bigBand.map((p) => p[1]));
  const bigInY = Math.min(...bigBand.map((p) => p[1]));
  const smallOutY = Math.max(...smallBand.map((p) => p[1]));
  const smallInY = Math.min(...smallBand.map((p) => p[1]));

  const thickBig = bigOutY - bigInY;
  const thickSmall = smallOutY - smallInY;
  expect(Math.abs(thickBig - thickSmall)).toBeLessThan(0.02);

  const webHalfWidthXMm = Math.max(...webPts.map((p) => Math.abs(p[0])));

  return {
    bigJournalDiameterMm: 2 * minBigBoreR,
    wristPinDiameterMm: 2 * minSmallBoreR,
    bigEndAxialWidthMm: xMax - xMin,
    beamFlangeBigOuterYMm: bigOutY,
    beamFlangeSmallOuterYMm: smallOutY,
    flangeThicknessYMm: 0.5 * (thickBig + thickSmall),
    webHalfWidthXMm,
  };
}

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

describe('Milestone 13 forged connecting-rod visual variant (src/renderer/rodVariant.test.ts)', () => {
  const variantPath = resolve(process.cwd(), 'public', ROD_VARIANT_MODEL_PATH);
  const stockRodPath = resolve(process.cwd(), 'public', 'models', 'rot_conrod_c1_stock.glb');

  it('1. asset contract: rot_conrod_c1_forged.glb passes file size, hierarchy, 3 materials, <=1400 tris, bounds, independently extracted signature dimensions, and 10-component watertightness', async () => {
    expect(existsSync(variantPath)).toBe(true);
    const parsed = parseGlb(variantPath);
    expect(parsed.byteLength).toBeLessThanOrEqual(ROD_VARIANT_MAX_FILE_BYTES);
    expect(parsed.byteLength).toBeLessThanOrEqual(49_152);

    // Zero images, textures, UVs, skins, morphs, animations, and if_* markers
    expect(parsed.doc.images ?? []).toHaveLength(0);
    expect(parsed.doc.textures ?? []).toHaveLength(0);
    expect(parsed.doc.skins ?? []).toHaveLength(0);
    expect(parsed.doc.animations ?? []).toHaveLength(0);

    const nodes = parsed.doc.nodes ?? [];
    for (const n of nodes) {
      expect(n.name ?? '').not.toMatch(/^if_/);
    }

    // Root rot_conrod_c1_forged at (0,0,0) with child rot_conrod_smallend_c1_forged at (0, 0, 163.0) mm
    const sceneRoots = parsed.doc.scenes?.[parsed.doc.scene ?? 0]?.nodes ?? [];
    expect(sceneRoots).toHaveLength(1);
    const rootNode = nodes[sceneRoots[0]!]!;
    expect(rootNode.name).toBe(ROD_VARIANT_ROOT_NAME);
    const rootTrans = rootNode.translation ?? [0, 0, 0];
    expect(Math.hypot(rootTrans[0], rootTrans[1], rootTrans[2])).toBeLessThanOrEqual(1e-6);

    expect(rootNode.children).toHaveLength(1);
    const childNode = nodes[rootNode.children![0]!]!;
    expect(childNode.name).toBe(ROD_VARIANT_SMALLEND_NAME);
    const childTransGltf = childNode.translation ?? [0, 0, 0];
    const childLocalMm: [number, number, number] = [
      childTransGltf[0] * 1000,
      -childTransGltf[2] * 1000,
      childTransGltf[1] * 1000,
    ];
    expect(Math.abs(childLocalMm[0])).toBeLessThanOrEqual(0.001);
    expect(Math.abs(childLocalMm[1])).toBeLessThanOrEqual(0.001);
    expect(Math.abs(childLocalMm[2] - ROD_VARIANT_SMALLEND_Z_MM)).toBeLessThanOrEqual(0.05);

    // Exactly 3 untextured MeshStandardMaterials verified both in GLTF JSON and Three.js loader
    const materials = parsed.doc.materials ?? [];
    expect(materials).toHaveLength(ROD_VARIANT_EXPECTED_MATERIALS);
    for (const m of materials) {
      expect(m.pbrMetallicRoughness?.baseColorTexture).toBeUndefined();
      expect(m.pbrMetallicRoughness?.metallicRoughnessTexture).toBeUndefined();
      expect(m.normalTexture).toBeUndefined();
      expect(m.occlusionTexture).toBeUndefined();
      expect(m.emissiveTexture).toBeUndefined();
    }

    const arrayBuf = parsed.bytes.buffer.slice(0);
    const loader = createPartLoader();
    const gltf = await loader.parseAsync(arrayBuf, '');
    const extractedPrims = extractAllPartPrimitives(gltf);
    expect(extractedPrims).toHaveLength(3);
    const uniqueMatNames = new Set(extractedPrims.map((p) => p.material.name));
    expect(uniqueMatNames.size).toBe(3);
    for (const p of extractedPrims) {
      expect(p.material).toBeInstanceOf(THREE.MeshStandardMaterial);
      expect(p.material.map).toBeNull();
      expect(p.geometry.getAttribute('uv')).toBeUndefined();
    }

    const geo = extractSceneGeometry(parsed);
    expect(geo.primitiveCount).toBe(3);
    expect(geo.triangles.length).toBeLessThanOrEqual(ROD_VARIANT_TRIANGLE_CAP);
    expect(geo.triangles.length).toBeLessThanOrEqual(1_400);

    // Part-local bounds: X ±13.838, Y ±48.725, Z -42.143..186.805 mm (±0.10 mm)
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    let zMin = Infinity;
    let zMax = -Infinity;
    for (const [x, y, z] of geo.verticesPartLocalMm) {
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
      if (z < zMin) zMin = z;
      if (z > zMax) zMax = z;
    }
    expect(Math.abs(xMin - -13.838)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(xMax - 13.838)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(yMin - -48.725)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(yMax - 48.725)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(zMin - -42.143)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(zMax - 186.805)).toBeLessThanOrEqual(0.1);

    // Independently extracted signature dimensions from GLB vertices
    const sig = extractRodSignatureFromVerticesMm(geo.verticesPartLocalMm);
    expect(Math.abs(sig.bigEndAxialWidthMm - ROD_VARIANT_BIG_END_WIDTH_MM)).toBeLessThanOrEqual(
      0.05,
    );
    expect(Math.abs(sig.beamFlangeBigOuterYMm - ROD_VARIANT_BEAM_FLANGE_Y_MM)).toBeLessThanOrEqual(
      0.2,
    );
    expect(
      Math.abs(sig.beamFlangeSmallOuterYMm - ROD_VARIANT_SMALL_END_FLANGE_Y_MM),
    ).toBeLessThanOrEqual(0.2);
    expect(Math.abs(sig.flangeThicknessYMm - ROD_VARIANT_FLANGE_THICKNESS_MM)).toBeLessThanOrEqual(
      0.2,
    );
    expect(Math.abs(sig.webHalfWidthXMm - ROD_VARIANT_WEB_HALF_WIDTH_MM)).toBeLessThanOrEqual(0.2);

    // Watertight (0 boundary edges at 1e-5 m) with 10 closed connected components
    const wt = auditWatertightAndComponents(geo.verticesGltfM, geo.triangles, 1e-5);
    expect(wt.boundaryEdges).toBe(0);
    expect(wt.nonManifoldEdges).toBe(0);
    expect(wt.components).toBe(ROD_VARIANT_EXPECTED_COMPONENTS);
    expect(wt.components).toBe(10);

    for (const p of extractedPrims) {
      p.geometry.dispose();
      p.material.dispose();
    }
  });

  it('2. stock interface preservation & clearances: 163.0 c2c, 62.9 journal, 34.5 pin, and 27.676 width agree with rot_conrod_c1_stock.glb within ±0.05 mm', () => {
    const variantParsed = parseGlb(variantPath);
    const stockParsed = parseGlb(stockRodPath);

    const variantGeo = extractSceneGeometry(variantParsed);
    const stockGeo = extractSceneGeometry(stockParsed);
    expect(stockGeo.triangles).toHaveLength(1_180);

    const variantSig = extractRodSignatureFromVerticesMm(variantGeo.verticesPartLocalMm);
    const stockSig = extractRodSignatureFromVerticesMm(stockGeo.verticesPartLocalMm);

    const dimsJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'assets-src', 'dimensions.json'), 'utf8'),
    ) as Record<string, number>;

    // dimensions.json supplies journal/pin/seat/rodLength inputs, with no width/flange/web keys
    expect(dimsJson.rodLengthMm).toBe(163);
    expect(dimsJson.pinJournalDiameterMm).toBe(62.9);
    expect(dimsJson.wristPinDiameterMm).toBe(34.5);
    expect(dimsJson.rodSeatOffsetMm).toBe(14.2);
    expect('bigEndWidthMm' in dimsJson).toBe(false);
    expect('flangeThicknessMm' in dimsJson).toBe(false);
    expect('webHalfWidthMm' in dimsJson).toBe(false);

    const codeDerivedWidthMm = 2 * 0.22 * dimsJson.pinJournalDiameterMm!;
    expect(codeDerivedWidthMm).toBeCloseTo(27.676, 6);

    // Small-end child Z translation within ±0.001 mm of 163.0 mm
    const vNodes = variantParsed.doc.nodes ?? [];
    const vRoot = vNodes[variantParsed.doc.scenes![0]!.nodes![0]!]!;
    const vChild = vNodes[vRoot.children![0]!]!;
    const vChildZMm = (vChild.translation?.[1] ?? 0) * 1000;
    const sNodes = stockParsed.doc.nodes ?? [];
    const sRoot = sNodes[stockParsed.doc.scenes![0]!.nodes![0]!]!;
    const sChild = sNodes[sRoot.children![0]!]!;
    const sChildZMm = (sChild.translation?.[1] ?? 0) * 1000;

    expect(Math.abs(vChildZMm - 163.0)).toBeLessThanOrEqual(0.001);
    expect(Math.abs(vChildZMm - sChildZMm)).toBeLessThanOrEqual(0.001);

    expect(
      Math.abs(variantSig.bigJournalDiameterMm - ROD_VARIANT_JOURNAL_DIAMETER_MM),
    ).toBeLessThanOrEqual(0.05);
    expect(
      Math.abs(variantSig.bigJournalDiameterMm - stockSig.bigJournalDiameterMm),
    ).toBeLessThanOrEqual(0.05);
    expect(
      Math.abs(variantSig.wristPinDiameterMm - ROD_VARIANT_WRIST_PIN_DIAMETER_MM),
    ).toBeLessThanOrEqual(0.05);
    expect(
      Math.abs(variantSig.wristPinDiameterMm - stockSig.wristPinDiameterMm),
    ).toBeLessThanOrEqual(0.05);
    expect(Math.abs(variantSig.bigEndAxialWidthMm - codeDerivedWidthMm)).toBeLessThanOrEqual(0.05);
    expect(
      Math.abs(variantSig.bigEndAxialWidthMm - stockSig.bigEndAxialWidthMm),
    ).toBeLessThanOrEqual(0.05);

    // Verify heavier H-beam signature strictly exceeds stock shank dimensions
    expect(variantSig.beamFlangeBigOuterYMm).toBeGreaterThan(stockSig.beamFlangeBigOuterYMm + 3.5);
    expect(variantSig.beamFlangeSmallOuterYMm).toBeGreaterThan(
      stockSig.beamFlangeSmallOuterYMm + 2.0,
    );
    expect(variantSig.flangeThicknessYMm).toBeGreaterThan(stockSig.flangeThicknessYMm + 1.5);
    expect(variantSig.webHalfWidthXMm).toBeGreaterThan(stockSig.webHalfWidthXMm + 0.7);

    // Spec §4.5 clearances
    const interRodGapMm = 2 * dimsJson.rodSeatOffsetMm! - variantSig.bigEndAxialWidthMm;
    const boreRadiusMm = 0.5 * dimsJson.boreMm!;
    const pistonOuterRadiusMm = 0.5 * (dimsJson.boreMm! - dimsJson.pistonSkirtClearanceMm!);
    const maxY = Math.max(...variantGeo.verticesPartLocalMm.map((p) => Math.abs(p[1])));
    expect(interRodGapMm).toBeCloseTo(0.724, 2);
    expect(boreRadiusMm - maxY).toBeCloseTo(2.775, 2);
    expect(boreRadiusMm - variantSig.beamFlangeBigOuterYMm).toBeCloseTo(21.157, 2);
    expect(pistonOuterRadiusMm - variantSig.beamFlangeBigOuterYMm).toBeCloseTo(21.082, 2);
  });

  it('5. swap logic, combined accounting & N-02 slot filter: pure assertions + engineScene.ts integration seams', () => {
    expect(computeInternalVariantSceneDelta([])).toBe(0);
    expect(computeInternalVariantSceneDelta(['rods_forged'])).toBe(1_760);
    expect(computeInternalVariantSceneDelta(['pistons_lowcomp'])).toBe(2_944);
    expect(computeInternalVariantSceneDelta(['pistons_lowcomp', 'rods_forged'])).toBe(4_704);
    expect(computeRodVariantSceneDelta(1_372)).toBe(1_536);
    expect(computeRodVariantSceneDelta(1_400)).toBe(1_760);
    expect(isInternalVisualSlot('rods')).toBe(true);

    // Cap-only combined totals
    expect(computeCombinedInternalSceneTriangles(221_984, 11_200, 41_600)).toBe(274_784);
    expect(computeCombinedInternalSceneTriangles(221_984, 9_440, 41_600)).toBe(273_024);
    expect(274_784).not.toBe(273_024);

    // Runtime combined totals
    const runtimeWithRodCap = computeCombinedInternalSceneTriangles(221_984, 11_200, 31_744);
    const runtimeWithRodProto = computeCombinedInternalSceneTriangles(221_984, 10_976, 31_744);
    const runtimeOldControl = computeCombinedInternalSceneTriangles(221_984, 9_440, 31_744);
    expect(runtimeWithRodCap).toBe(264_928);
    expect(runtimeWithRodProto).toBe(264_704);
    expect(runtimeOldControl).toBe(263_168);
    expect(runtimeWithRodCap).not.toBe(263_168);

    // N-02 slot filter behavior simulation
    const loadedMap = new Map<string, InternalPrimEntry<readonly string[]>>([
      ['pistons_lowcomp', { slotId: 'pistons', prims: ['p0'] }],
      ['rods_forged', { slotId: 'rods', prims: ['r0'] }],
    ]);
    const simulatedPistonBatchSetsById = new Map<string, string>();
    const simulatedCapSourceIds: string[] = [];
    for (const [variantId] of filterInternalPrimEntriesBySlot(loadedMap, 'pistons')) {
      simulatedPistonBatchSetsById.set(variantId, `piston_${variantId}`);
      simulatedCapSourceIds.push(`piston_${variantId}_std`, `piston_${variantId}_firing`);
    }
    expect([...simulatedPistonBatchSetsById.keys()]).toEqual(['pistons_lowcomp']);
    expect(simulatedPistonBatchSetsById.has('rods_forged')).toBe(false);
    expect(simulatedCapSourceIds).not.toContain('piston_rods_forged_std');
    expect(simulatedCapSourceIds).not.toContain('piston_rods_forged_firing');

    // Source checks on src/renderer/engineScene.ts
    const engineSceneSrc = readFileSync(
      resolve(process.cwd(), 'src', 'renderer', 'engineScene.ts'),
      'utf8',
    );
    expect(engineSceneSrc).toContain('computeCombinedInternalSceneTriangles');
    expect(engineSceneSrc).toContain("desc.slotId === 'pistons' || desc.slotId === 'rods'");
    expect(engineSceneSrc).toContain('ensureVariantRodBatchBuilt');
    expect(engineSceneSrc).toContain('attachedRodVariantId');
    expect(engineSceneSrc).toContain('v8Batches.conrod =');
    expect(engineSceneSrc).toContain("registerInstancedCapSource(dynamicCapSources, 'conrod_variant'");
    expect(engineSceneSrc).not.toContain('nonPistonInternalTriangles + nextSet.totalTriangles');
    expect(engineSceneSrc).toMatch(
      /filterInternalPrimEntriesBySlot\(\s*loadedInternalPrimsById\s*,\s*['"]pistons['"]\s*,?\s*\)/,
    );

    expect(engineSceneSrc).toContain('const recomputeCombinedInternalTriangles =');
    const recomputeCallMatches =
      engineSceneSrc.match(/\brecomputeCombinedInternalTriangles\s*\(\s*\)/g) ?? [];
    // Exactly 2 calls: 1 in the rod swap branch + 1 in the piston swap branch
    expect(recomputeCallMatches).toHaveLength(2);
  });

  it('6. cap compatibility & rod-cutting plane: slices rot_conrod_c1_forged at X=388.3 (>0 tris), returns 0 at X=402.5 gap, skips hidden stock rod, and keeps single render pass', async () => {
    const engineSceneSrc = readFileSync(
      resolve(process.cwd(), 'src', 'renderer', 'engineScene.ts'),
      'utf8',
    );
    expect(SECTION_CAP_MAX_TRIANGLES).toBe(16_000);
    expect(engineSceneSrc.match(/renderer\.render\s*\(/g) ?? []).toHaveLength(1);
    expect(engineSceneSrc).not.toContain('new THREE.WebGLRenderTarget(');
    expect(engineSceneSrc).not.toMatch(/stencil\s*:\s*true/);
    expect(engineSceneSrc).not.toContain('setRenderTarget');
    expect(engineSceneSrc).not.toContain('overrideMaterial');
    expect(engineSceneSrc).toContain("registerInstancedCapSource(dynamicCapSources, 'conrod', conrod, false)");
    expect(engineSceneSrc).toContain(
      "registerInstancedCapSource(dynamicCapSources, 'conrod_variant', rodBatch, false)",
    );

    // Node behavior check with real GLTFLoader + extractPartPrimitives / wrapInPartLocalFrame + buildCapGeometry
    const loader = createPartLoader();
    const toArrayBuffer = (filePath: string): ArrayBuffer => {
      const b = readFileSync(filePath);
      const u8 = new Uint8Array(b.byteLength);
      u8.set(b);
      return u8.buffer;
    };
    const variantGltf = await loader.parseAsync(toArrayBuffer(variantPath), '');
    const stockGltf = await loader.parseAsync(toArrayBuffer(stockRodPath), '');

    // Verify wrapInPartLocalFrame is used and extractPartPrimitives extracts root + child primitives
    const wrappedCheck = wrapInPartLocalFrame(new THREE.Group(), 'rod_wrap_check');
    expect(wrappedCheck.name).toBe('rod_wrap_check');

    const variantRootPrims = extractPartPrimitives(variantGltf, ROD_VARIANT_ROOT_NAME);
    expect(variantRootPrims).toHaveLength(3);
    const stockRootPrims = extractPartPrimitives(stockGltf, 'rot_conrod_c1_stock');
    expect(stockRootPrims).toHaveLength(3);

    // Place 8 instances across all 8 cylinders at theta = 0 deg (station-0 RH rod seat X = 388.3 mm)
    const layout = computeEngineLayout(engineConfig, valveConfig, detailConfig);
    const state = computeState(engineConfig, 0, 900, valveConfig);
    const tdcWristBM = layout.valvetrainMm.tdcWristBMm / 1000;

    const composeRodMatrix = (cylId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): THREE.Matrix4 => {
      const cl = layout.cylinders[cylId];
      const st = layout.stations[cl.stationIndex]!;
      const [, pinY, pinZ] = crankPinPositionM(engineConfig, valveConfig, st.rhCylinder, 0);
      const wristBM = tdcWristBM - state.pistonPositionM[cylId];
      const startPt = new THREE.Vector3(cl.rodSeatXM, pinY, pinZ);
      const endPt = new THREE.Vector3(
        cl.rodSeatXM,
        wristBM * cl.boreAxisB[1],
        wristBM * cl.boreAxisB[2],
      );
      const aimZ = new THREE.Vector3().subVectors(endPt, startPt).normalize();
      const aimX = new THREE.Vector3(1, 0, 0).addScaledVector(aimZ, -aimZ.x).normalize();
      const aimY = new THREE.Vector3().crossVectors(aimZ, aimX).normalize();
      const basis = new THREE.Matrix4().makeBasis(aimX, aimY, aimZ);
      const quat = new THREE.Quaternion().setFromRotationMatrix(basis);
      return new THREE.Matrix4().compose(startPt, quat, new THREE.Vector3(1, 1, 1));
    };

    expect(layout.cylinders[1].rodSeatXM * 1000).toBeCloseTo(388.3, 6);

    const root = new THREE.Group();
    const makeBatchMeshes = (
      prims: ReturnType<typeof extractPartPrimitives>,
      visible: boolean,
      attach: boolean,
    ): THREE.InstancedMesh[] => {
      const meshes = prims.map((p) => {
        const im = new THREE.InstancedMesh(p.geometry, p.material, 8);
        im.visible = visible;
        for (let i = 0; i < 8; i += 1) {
          im.setMatrixAt(i, composeRodMatrix((i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8));
        }
        im.instanceMatrix.needsUpdate = true;
        if (attach) root.add(im);
        return im;
      });
      return meshes;
    };

    const variantMeshes = makeBatchMeshes(variantRootPrims, true, true);
    // Removed AND visible = false stock meshes (simulating syncVisualVariants swap)
    const hiddenStockMeshes = makeBatchMeshes(stockRootPrims, false, false);
    root.updateMatrixWorld(true);

    const variantCapSrc = prepareCapSource({
      id: 'conrod_variant',
      object3D: variantMeshes[0]!,
      geometries: variantMeshes.map((m) => m.geometry as THREE.BufferGeometry),
      instanced: true,
      count: 8,
      static: false,
      skipWhenGhosted: false,
      hullOnly: false,
    });
    const hiddenStockCapSrc = prepareCapSource({
      id: 'conrod',
      object3D: hiddenStockMeshes[0]!,
      geometries: hiddenStockMeshes.map((m) => m.geometry as THREE.BufferGeometry),
      instanced: true,
      count: 8,
      static: false,
      skipWhenGhosted: false,
      hullOnly: false,
    });

    const capTarget = createCapBuildTarget();

    // 1) Variant source at X = 388.3 mm cuts station-0 RH rod cleanly (> 0 tris, 0 open chains)
    const statsAt3883 = buildCapGeometry(
      [variantCapSrc],
      { mode: 'x', positionMm: 388.3 },
      capTarget,
    );
    expect(statsAt3883.triangles).toBeGreaterThan(0);
    expect(statsAt3883.openChains).toBe(0);
    expect(statsAt3883.droppedGroups).toBe(0);
    expect(statsAt3883.triangles).toBeLessThanOrEqual(SECTION_CAP_MAX_TRIANGLES);

    // 2) Variant source at X = 402.5 mm returns 0 triangles (plane is in the 0.724 mm inter-rod gap)
    const statsAt4025 = buildCapGeometry(
      [variantCapSrc],
      { mode: 'x', positionMm: 402.5 },
      capTarget,
    );
    expect(statsAt4025.triangles).toBe(0);

    // 3) Hidden & removed stock source returns 0; combined [hiddenStockCapSrc, variantCapSrc] equals variant alone
    const stockHiddenStats = buildCapGeometry(
      [hiddenStockCapSrc],
      { mode: 'x', positionMm: 388.3 },
      capTarget,
    );
    expect(stockHiddenStats.triangles).toBe(0);

    const combinedStats = buildCapGeometry(
      [hiddenStockCapSrc, variantCapSrc],
      { mode: 'x', positionMm: 388.3 },
      capTarget,
    );
    expect(combinedStats.triangles).toBe(statsAt3883.triangles);
    expect(combinedStats.triangles).toBeLessThanOrEqual(SECTION_CAP_MAX_TRIANGLES);

    capTarget.geometry.dispose();
    for (const m of [...variantMeshes, ...hiddenStockMeshes]) m.dispose();
    for (const p of [...variantRootPrims, ...stockRootPrims]) {
      p.geometry.dispose();
      p.material.dispose();
    }
  });

  it('7. performance neutrality: rods_forged has empty performanceParams/compatibility and produces identical dyno curves/details to stock', () => {
    const rodsForgedEntry = fullCatalog.find((e) => e.id === 'rods_forged')!;
    expect(rodsForgedEntry).toBeDefined();
    expect(rodsForgedEntry.performanceParams).toEqual({});
    expect(rodsForgedEntry.compatibility).toEqual({});
    expect(rodsForgedEntry.provenance).toBe('illustrative');

    const rodsOnlyBuild = makeBuildWith({ rods: 'rods_forged' });
    expect(checkCompatibility(rodsOnlyBuild, fullCatalog)).toEqual([]);
    expect(computeCurve(rodsOnlyBuild, fullCatalog)).toEqual(computeCurve(stockBuild, fullCatalog));
    expect(computeDetails(rodsOnlyBuild, fullCatalog)).toEqual(
      computeDetails(stockBuild, fullCatalog),
    );

    const combinedInternalBuild = makeBuildWith({
      rods: 'rods_forged',
      pistons: 'pistons_lowcomp',
      turbo: 'turbo_large',
    });
    expect(checkCompatibility(combinedInternalBuild, fullCatalog)).toEqual([]);

    const withoutRodsBuild = makeBuildWith({
      pistons: 'pistons_lowcomp',
      turbo: 'turbo_large',
    });
    expect(computeCurve(combinedInternalBuild, fullCatalog)).toEqual(
      computeCurve(withoutRodsBuild, fullCatalog),
    );
    expect(computeDetails(combinedInternalBuild, fullCatalog)).toEqual(
      computeDetails(withoutRodsBuild, fullCatalog),
    );
  });

  it('11. frozen-asset identity against main @ 8394f1f & only-one-catalog-diff against modified.pre-m13.json', async () => {
    const sha256Binary = async (relPath: string): Promise<string> => {
      const bytes = readFileSync(resolve(process.cwd(), relPath));
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', copy);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    };

    const sha256TextLf = async (relPath: string): Promise<string> => {
      const lf = readFileSync(resolve(process.cwd(), relPath), 'utf8').replace(/\r\n/g, '\n');
      const encoded = new TextEncoder().encode(lf);
      const copy = new Uint8Array(encoded.byteLength);
      copy.set(encoded);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', copy);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    };

    // Exact binary hashes pinned in Spec §15.9 (main @ 8394f1f)
    const expectedBinaryHashes: ReadonlyArray<readonly [string, string]> = [
      [
        'public/models/rot_piston_c1_stock.glb',
        '7565393c9c333fce82b96cd266cfbc8e3b7fd522e99d6c164b42a8a2f988d0dc',
      ],
      [
        'public/models/rot_conrod_c1_stock.glb',
        '52a05cb32358de270896d648981d98a3868f2a585f77d110e418d0337f0e7644',
      ],
      [
        'public/models/rot_crankthrow_c1_stock.glb',
        '946d36bf5ef11b1bcafde24f98bacdf9995720e796aeee412e78f9cf7a72d540',
      ],
      [
        'public/models/sta_head_c1_stock.glb',
        '0a7175c8e32b8f7195e8efbc93cf505f24815b81b7200e0e02cc3c1fb9e8be3b',
      ],
      [
        'public/models/val_bridge_stock.glb',
        '5728b24f328a00f16538cd1c5638140b5447f3b5f28fbeca7ccbf8601d40aae2',
      ],
      [
        'public/models/val_pushrod_stock.glb',
        '142eda882b56bd2db591edefc4a65b0981871024426c75360453a1168106446f',
      ],
      [
        'public/models/val_rocker_stock.glb',
        '214df0a23bd78434dcc8cfd7413fc637ded441adec69fc8d68214051b063367c',
      ],
      [
        'public/models/val_valve_exhaust_stock.glb',
        '44a8bfd96804cab431a4935b43c5b37a34c0c026e8badd2cb572680ef909d5c0',
      ],
      [
        'public/models/val_valve_intake_stock.glb',
        '61ca1bba6ef65c20f7063f364e46624d2f6c08228b9279239b82d356beb24839',
      ],
      [
        'public/models/fuel_injector_c1_stock.glb',
        '64b9bab8b3a60d39348e8e8e447250bc64caaf31c1735e24821092f2e5d42397',
      ],
      [
        'public/models/intake_cover_lly.glb',
        'a66a7a82ecbd19061d33058facf01f5ce75af88b25a253cfb8ec85384d64b7f0',
      ],
      [
        'public/Duramax_LLY_2005_66L_V8.glb',
        'd51f88a0073fde617d1c6492618fcfabc672154288ac546e52fe2ed40b718554',
      ],
      [
        'public/models/variants/turbo_unit_engine_large.glb',
        '6e038dd2540f8732906068fa13cdfaaafe255b53336283118f36ab9aca1c82ed',
      ],
      [
        'public/models/variants/intake_tract_engine_highflow.glb',
        'fc28f77b7816a38ad6cb1a53351960b9cf3baf54e089b59de39223c1ba2f7e58',
      ],
      [
        'public/models/variants/exhaust_system_engine_4inch.glb',
        'a463172aeae64688383400d56b5c2d70dbf3e62992da1b3013892b456c53fa32',
      ],
      [
        'public/models/variants/intercooler_core_engine_upgraded.glb',
        '1f112556e1af253e761413f4e176689904e9c1b043e95ad5814bb984aeb9b183',
      ],
      [
        'public/models/variants/rot_piston_c1_lowcomp.glb',
        '41d1315d1fcc18d85fea7b498c28a1567e0bcfb5262e99e940b8f4bc1e35fb93',
      ],
    ];

    for (const [relPath, expectedSha] of expectedBinaryHashes) {
      expect(await sha256Binary(relPath), `Frozen binary hash mismatch on ${relPath}`).toBe(
        expectedSha,
      );
    }

    // Exact text LF hashes pinned in Spec §15.9 + pre/post modified.json
    expect(await sha256TextLf('catalog/stock.json')).toBe(
      '5ee91f4b0c667c3d3c70c2a39eb9e8afebd614875a4809ea42a29bd75fe2a66d',
    );
    expect(await sha256TextLf('catalog/schema.json')).toBe(
      '5682938d8302197167e086c80e156a0117911c89fe38991455db18ffd03d91e5',
    );
    expect(await sha256TextLf('src/core/interfaces.ts')).toBe(
      'c896f0b4068a17f16f6b9ca95544d7536cd4db16c91ef489f570355af6533be4',
    );
    expect(await sha256TextLf('src/catalog/__fixtures__/modified.pre-m13.json')).toBe(
      'af6f0ce3bccc039943267ccbd7ad58a8f7817bb7410019dc30751656c443897c',
    );
    expect(await sha256TextLf('catalog/modified.json')).toBe(
      '509c90c7c02af0081e1b3fe1737c47991bd03f9b6195e6118df594663059d802',
    );

    // Only-one-catalog-diff object assertion
    const preObj = JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'src/catalog/__fixtures__/modified.pre-m13.json'),
        'utf8',
      ),
    ) as PartVariant[];
    const postObj = JSON.parse(
      readFileSync(resolve(process.cwd(), 'catalog/modified.json'), 'utf8'),
    ) as PartVariant[];
    expect(postObj).toHaveLength(preObj.length);
    for (let i = 0; i < preObj.length; i += 1) {
      if (preObj[i]!.id === 'rods_forged') {
        expect(preObj[i]!.modelPath).toBeNull();
        expect(postObj[i]!.modelPath).toBe(ROD_VARIANT_MODEL_PATH);
        expect({ ...postObj[i]!, modelPath: null }).toEqual(preObj[i]!);
      } else {
        expect(postObj[i]!).toEqual(preObj[i]!);
      }
    }
  });

  it('12. load-failure fallback: pure resolveVariantLoadFailure helper + labelled engineScene.ts source check', () => {
    expect(() => resolveVariantLoadFailure(['rods_forged'], ['rods_forged'])).not.toThrow();
    expect(resolveVariantLoadFailure(['rods_forged'], ['rods_forged'])).toEqual({
      failedVariantIds: ['rods_forged'],
      variantsLoaded: true,
    });
    expect(
      resolveVariantLoadFailure(['turbo_large', 'rods_forged'], ['rods_forged']),
    ).toEqual({
      failedVariantIds: ['rods_forged'],
      variantsLoaded: true,
    });
    expect(resolveVariantLoadFailure(['turbo_large', 'rods_forged'], [])).toEqual({
      failedVariantIds: [],
      variantsLoaded: true,
    });

    // Labelled source check (runtime missing-GLB fallback is also exercised in browser acceptance 8)
    const engineSceneSrc = readFileSync(
      resolve(process.cwd(), 'src', 'renderer', 'engineScene.ts'),
      'utf8',
    );
    expect(engineSceneSrc).toContain('failedVariantIdSet.add(desc.variantId)');
    expect(engineSceneSrc).toContain('Failed to load visual variant "${desc.variantId}"');
    expect(engineSceneSrc).toContain('Promise.allSettled(variantPromises)');
    expect(engineSceneSrc).toMatch(/rodBatch\s*!==\s*null/);
  });
});
