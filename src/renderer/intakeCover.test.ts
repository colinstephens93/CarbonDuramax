// Milestone 12 optional LLY plastic upper intake manifold cover tests (GM 21994000;
// docs/specs/M12-intake-cover.md §9 tests 1–7, 11–12).
// Node-only: parses binary GLBs via node:fs + Web Crypto SHA-256; never imports Three.js.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  computeIntakeCoverExplodeOffsetMm,
  computeIntakeCoverVisible,
  createExteriorGhostRegistry,
  distanceToIntakeCoverEnvelopeMm,
  INTAKE_COVER_BODY_EXPECTED_COMPONENTS,
  INTAKE_COVER_BODY_MESH_NAME,
  INTAKE_COVER_BODY_TRIANGLE_CAP,
  INTAKE_COVER_BODY_Z_MAX_MM,
  INTAKE_COVER_BODY_Z_MIN_MM,
  INTAKE_COVER_DEFAULT_ENABLED,
  INTAKE_COVER_ENVELOPE_Z_MIN_MM,
  INTAKE_COVER_LEGEND,
  INTAKE_COVER_LETTERING_EXPECTED_COMPONENTS,
  INTAKE_COVER_LETTERING_EXPECTED_TRIANGLES,
  INTAKE_COVER_LETTERING_MESH_NAME,
  INTAKE_COVER_LETTERING_TRIANGLE_CAP,
  INTAKE_COVER_LETTER_Z_MAX_MM,
  INTAKE_COVER_MARKERS,
  INTAKE_COVER_MAX_FILE_BYTES,
  INTAKE_COVER_MODEL_PATH,
  INTAKE_COVER_ROOT_NAME,
  INTAKE_COVER_TRIANGLE_CAP,
  isPointInsideIntakeCoverPlanformMm,
} from './intakeCover';

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
  weights?: number[];
}

interface GltfNode {
  name?: string;
  mesh?: number;
  skin?: number;
  children?: number[];
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  matrix?: number[];
}

interface GltfMaterial {
  name?: string;
  doubleSided?: boolean;
  normalTexture?: unknown;
  occlusionTexture?: unknown;
  emissiveTexture?: unknown;
  pbrMetallicRoughness?: {
    baseColorFactor?: [number, number, number, number];
    metallicFactor?: number;
    roughnessFactor?: number;
    baseColorTexture?: unknown;
    metallicRoughnessTexture?: unknown;
  };
}

interface GltfRoot {
  scene?: number;
  scenes?: Array<{ nodes?: number[] }>;
  nodes?: GltfNode[];
  meshes?: GltfMesh[];
  materials?: GltfMaterial[];
  accessors?: GltfAccessor[];
  bufferViews?: GltfBufferView[];
  images?: unknown[];
  textures?: unknown[];
  skins?: unknown[];
  animations?: unknown[];
}

interface ParsedGlb {
  readonly byteLength: number;
  readonly doc: GltfRoot;
  readonly binView: DataView;
}

const TYPE_COMPONENTS: Readonly<Record<string, number>> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT4: 16,
};

function parseGlbBinary(filePath: string): ParsedGlb {
  const buf = readFileSync(filePath);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  expect(buf.byteLength).toBeGreaterThanOrEqual(20);
  expect(view.getUint32(0, true)).toBe(0x46546c67); // 'glTF'
  expect(view.getUint32(4, true)).toBe(2);
  expect(view.getUint32(8, true)).toBe(buf.byteLength);

  let offset = 12;
  let doc: GltfRoot | null = null;
  let bin: Uint8Array = new Uint8Array(0);

  while (offset + 8 <= buf.byteLength) {
    const chunkLen = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const payload = buf.subarray(offset + 8, offset + 8 + chunkLen);
    if (chunkType === 0x4e4f534a) {
      doc = JSON.parse(new TextDecoder('utf-8').decode(payload)) as GltfRoot;
    } else if (chunkType === 0x004e4942) {
      bin = payload;
    }
    offset += 8 + chunkLen;
  }

  if (!doc) {
    throw new Error(`Missing JSON chunk in ${filePath}`);
  }
  return {
    byteLength: buf.byteLength,
    doc,
    binView: new DataView(bin.buffer, bin.byteOffset, bin.byteLength),
  };
}

function readAccessorFloat64(parsed: ParsedGlb, accessorIdx: number): Float64Array {
  const acc = parsed.doc.accessors?.[accessorIdx];
  if (!acc || acc.bufferView === undefined) {
    throw new Error(`Invalid accessor ${accessorIdx}`);
  }
  const bv = parsed.doc.bufferViews?.[acc.bufferView];
  if (!bv) {
    throw new Error(`Invalid bufferView ${acc.bufferView}`);
  }
  const compCount = TYPE_COMPONENTS[acc.type];
  if (!compCount) {
    throw new Error(`Unsupported accessor type ${acc.type}`);
  }
  const byteSize =
    acc.componentType === 5126 || acc.componentType === 5125
      ? 4
      : acc.componentType === 5123 || acc.componentType === 5122
        ? 2
        : 1;
  const stride = bv.byteStride ?? byteSize * compCount;
  const baseOffset = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const out = new Float64Array(acc.count * compCount);

  for (let i = 0; i < acc.count; i += 1) {
    const rowOffset = baseOffset + i * stride;
    for (let c = 0; c < compCount; c += 1) {
      const off = rowOffset + c * byteSize;
      if (acc.componentType === 5126) {
        out[i * compCount + c] = parsed.binView.getFloat32(off, true);
      } else if (acc.componentType === 5125) {
        out[i * compCount + c] = parsed.binView.getUint32(off, true);
      } else if (acc.componentType === 5123) {
        out[i * compCount + c] = parsed.binView.getUint16(off, true);
      } else if (acc.componentType === 5122) {
        out[i * compCount + c] = parsed.binView.getInt16(off, true);
      } else if (acc.componentType === 5121) {
        out[i * compCount + c] = parsed.binView.getUint8(off);
      } else if (acc.componentType === 5120) {
        out[i * compCount + c] = parsed.binView.getInt8(off);
      } else {
        throw new Error(`Unsupported componentType ${acc.componentType}`);
      }
    }
  }
  return out;
}

type Mat4 = Float64Array; // row-major 4x4

function mulMat4(a: Mat4, b: Mat4): Mat4 {
  const out = new Float64Array(16);
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      out[r * 4 + c] =
        a[r * 4 + 0]! * b[0 * 4 + c]! +
        a[r * 4 + 1]! * b[1 * 4 + c]! +
        a[r * 4 + 2]! * b[2 * 4 + c]! +
        a[r * 4 + 3]! * b[3 * 4 + c]!;
    }
  }
  return out;
}

function nodeLocalMatrix(node: GltfNode): Mat4 {
  if (node.matrix && node.matrix.length === 16) {
    const m = node.matrix;
    return new Float64Array([
      m[0]!, m[4]!, m[8]!, m[12]!,
      m[1]!, m[5]!, m[9]!, m[13]!,
      m[2]!, m[6]!, m[10]!, m[14]!,
      m[3]!, m[7]!, m[11]!, m[15]!,
    ]);
  }
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const [qx, qy, qz, qw] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const x2 = qx + qx;
  const y2 = qy + qy;
  const z2 = qz + qz;
  const xx = qx * x2;
  const xy = qx * y2;
  const xz = qx * z2;
  const yy = qy * y2;
  const yz = qy * z2;
  const zz = qz * z2;
  const wx = qw * x2;
  const wy = qw * y2;
  const wz = qw * z2;
  return new Float64Array([
    (1 - (yy + zz)) * sx, (xy - wz) * sy, (xz + wy) * sz, tx,
    (xy + wz) * sx, (1 - (xx + zz)) * sy, (yz - wx) * sz, ty,
    (xz - wy) * sx, (yz + wx) * sy, (1 - (xx + yy)) * sz, tz,
    0, 0, 0, 1,
  ]);
}

function computeWorldMatrices(doc: GltfRoot): Map<number, Mat4> {
  const nodes = doc.nodes ?? [];
  const sceneIdx = doc.scene ?? 0;
  const roots = doc.scenes?.[sceneIdx]?.nodes ?? [];
  const out = new Map<number, Mat4>();
  const ident = new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

  const visit = (idx: number, parent: Mat4): void => {
    const world = mulMat4(parent, nodeLocalMatrix(nodes[idx]!));
    out.set(idx, world);
    for (const ch of nodes[idx]!.children ?? []) {
      visit(ch, world);
    }
  };

  for (const r of roots) {
    visit(r, ident);
  }
  return out;
}

function gltfYupMetersToProjectMm(gx: number, gy: number, gz: number): [number, number, number] {
  return [1000 * gx, -1000 * gz, 1000 * gy];
}

interface ExtractedMeshWorld {
  readonly verticesGltfM: Array<[number, number, number]>;
  readonly verticesProjectMm: Array<[number, number, number]>;
  readonly triangles: Array<[number, number, number]>;
}

function extractNodeMeshWorld(
  parsed: ParsedGlb,
  worldMats: Map<number, Mat4>,
  nodeIdx: number,
): ExtractedMeshWorld {
  const node = parsed.doc.nodes?.[nodeIdx];
  if (!node || node.mesh === undefined) {
    throw new Error(`Node ${nodeIdx} has no mesh`);
  }
  const mesh = parsed.doc.meshes?.[node.mesh];
  if (!mesh) {
    throw new Error(`Missing mesh ${node.mesh}`);
  }
  const wm = worldMats.get(nodeIdx)!;
  const verticesGltfM: Array<[number, number, number]> = [];
  const verticesProjectMm: Array<[number, number, number]> = [];
  const triangles: Array<[number, number, number]> = [];
  let vertexBase = 0;

  for (const prim of mesh.primitives) {
    const mode = prim.mode ?? 4;
    expect(mode).toBe(4);
    expect(prim.indices).toBeDefined();
    expect(prim.targets).toBeUndefined();
    expect(Object.keys(prim.attributes).sort()).toEqual(['NORMAL', 'POSITION']);

    const pos = readAccessorFloat64(parsed, prim.attributes.POSITION!);
    const idx = readAccessorFloat64(parsed, prim.indices!);
    const vertCount = pos.length / 3;

    for (let i = 0; i < vertCount; i += 1) {
      const lx = pos[i * 3]!;
      const ly = pos[i * 3 + 1]!;
      const lz = pos[i * 3 + 2]!;
      const gx = wm[0]! * lx + wm[1]! * ly + wm[2]! * lz + wm[3]!;
      const gy = wm[4]! * lx + wm[5]! * ly + wm[6]! * lz + wm[7]!;
      const gz = wm[8]! * lx + wm[9]! * ly + wm[10]! * lz + wm[11]!;
      verticesGltfM.push([gx, gy, gz]);
      verticesProjectMm.push(gltfYupMetersToProjectMm(gx, gy, gz));
    }

    for (let t = 0; t < idx.length; t += 3) {
      triangles.push([
        vertexBase + idx[t]!,
        vertexBase + idx[t + 1]!,
        vertexBase + idx[t + 2]!,
      ]);
    }
    vertexBase += vertCount;
  }

  return { verticesGltfM, verticesProjectMm, triangles };
}

function auditWatertightAndComponents(
  verticesM: ReadonlyArray<readonly [number, number, number]>,
  triangles: ReadonlyArray<readonly [number, number, number]>,
  weldQuantumM = 1e-5,
): { boundaryEdges: number; nonManifoldEdges: number; components: number } {
  const weldedIdByKey = new Map<string, number>();
  const weldedIds = new Int32Array(verticesM.length);
  let nextId = 0;

  for (let i = 0; i < verticesM.length; i += 1) {
    const [x, y, z] = verticesM[i]!;
    const key = `${Math.round(x / weldQuantumM)},${Math.round(y / weldQuantumM)},${Math.round(z / weldQuantumM)}`;
    let vid = weldedIdByKey.get(key);
    if (vid === undefined) {
      vid = nextId;
      weldedIdByKey.set(key, vid);
      nextId += 1;
    }
    weldedIds[i] = vid;
  }

  const edgeCounts = new Map<string, number>();
  const adj: number[][] = Array.from({ length: nextId }, () => []);

  for (const [ia, ib, ic] of triangles) {
    const a = weldedIds[ia]!;
    const b = weldedIds[ib]!;
    const c = weldedIds[ic]!;
    for (const [u, w] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const ek = u < w ? `${u}_${w}` : `${w}_${u}`;
      edgeCounts.set(ek, (edgeCounts.get(ek) ?? 0) + 1);
      adj[u]!.push(w);
      adj[w]!.push(u);
    }
  }

  let boundaryEdges = 0;
  let nonManifoldEdges = 0;
  for (const cnt of edgeCounts.values()) {
    if (cnt === 1) boundaryEdges += 1;
    else if (cnt > 2) nonManifoldEdges += 1;
  }

  const visited = new Uint8Array(nextId);
  let components = 0;
  for (let start = 0; start < nextId; start += 1) {
    if (visited[start] || adj[start]!.length === 0) continue;
    components += 1;
    visited[start] = 1;
    const stack = [start];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      for (const nb of adj[cur]!) {
        if (!visited[nb]) {
          visited[nb] = 1;
          stack.push(nb);
        }
      }
    }
  }

  return { boundaryEdges, nonManifoldEdges, components };
}

const COVER_GLB_PATH = resolve(process.cwd(), 'public', INTAKE_COVER_MODEL_PATH);
const SHELL_GLB_PATH = resolve(process.cwd(), 'public', 'Duramax_LLY_2005_66L_V8.glb');
const VARIANT_DIMS_PATH = resolve(process.cwd(), 'assets-src', 'variant_dimensions.json');

// Cached parses across tests in this suite (fast & deterministic)
let cachedCover: ParsedGlb | null = null;
let cachedShell: ParsedGlb | null = null;

function getCoverGlb(): ParsedGlb {
  if (!cachedCover) {
    cachedCover = parseGlbBinary(COVER_GLB_PATH);
  }
  return cachedCover;
}

function getShellGlb(): ParsedGlb {
  if (!cachedShell) {
    cachedShell = parseGlbBinary(SHELL_GLB_PATH);
  }
  return cachedShell;
}

describe('Milestone 12 optional LLY intake manifold cover (src/renderer/intakeCover.test.ts)', () => {
  it('1. asset contract: file size <= 64 KiB, root Group intake_cover_lly, 2 mesh leaves, 2 untextured MeshStandardMaterials, triangle caps, and envelope bounds', () => {
    expect(existsSync(COVER_GLB_PATH)).toBe(true);
    const parsed = getCoverGlb();
    expect(parsed.byteLength).toBeLessThanOrEqual(INTAKE_COVER_MAX_FILE_BYTES);

    const { doc } = parsed;
    expect(doc.images ?? []).toHaveLength(0);
    expect(doc.textures ?? []).toHaveLength(0);
    expect(doc.skins ?? []).toHaveLength(0);
    expect(doc.animations ?? []).toHaveLength(0);

    const nodes = doc.nodes ?? [];
    const sceneRoots = doc.scenes?.[doc.scene ?? 0]?.nodes ?? [];
    expect(sceneRoots).toHaveLength(1);

    const rootIdx = sceneRoots[0]!;
    const rootNode = nodes[rootIdx]!;
    expect(rootNode.name).toBe(INTAKE_COVER_ROOT_NAME);
    expect(rootNode.mesh).toBeUndefined();

    const meshNodes = nodes
      .map((n, idx) => ({ n, idx }))
      .filter((entry) => entry.n.mesh !== undefined);
    expect(meshNodes.map((e) => e.n.name).sort()).toEqual(
      [INTAKE_COVER_BODY_MESH_NAME, INTAKE_COVER_LETTERING_MESH_NAME].sort(),
    );
    for (const mNode of meshNodes) {
      expect(rootNode.children ?? []).toContain(mNode.idx);
      expect(mNode.n.skin).toBeUndefined();
      expect(doc.meshes?.[mNode.n.mesh!]?.weights).toBeUndefined();
    }

    const materials = doc.materials ?? [];
    expect(materials).toHaveLength(2);
    expect(materials.map((m) => m.name).sort()).toEqual(
      ['mat_cover_letter', 'mat_cover_plastic'].sort(),
    );
    for (const mat of materials) {
      expect(mat.doubleSided).toBe(true);
      expect(mat.normalTexture).toBeUndefined();
      expect(mat.occlusionTexture).toBeUndefined();
      expect(mat.emissiveTexture).toBeUndefined();
      expect(mat.pbrMetallicRoughness?.baseColorTexture).toBeUndefined();
      expect(mat.pbrMetallicRoughness?.metallicRoughnessTexture).toBeUndefined();
    }

    const worldMats = computeWorldMatrices(doc);
    const bodyIdx = nodes.findIndex((n) => n.name === INTAKE_COVER_BODY_MESH_NAME);
    const letIdx = nodes.findIndex((n) => n.name === INTAKE_COVER_LETTERING_MESH_NAME);
    const body = extractNodeMeshWorld(parsed, worldMats, bodyIdx);
    const lettering = extractNodeMeshWorld(parsed, worldMats, letIdx);

    expect(body.triangles.length).toBeGreaterThan(0);
    expect(body.triangles.length).toBeLessThanOrEqual(INTAKE_COVER_BODY_TRIANGLE_CAP);
    expect(lettering.triangles.length).toBeLessThanOrEqual(INTAKE_COVER_LETTERING_TRIANGLE_CAP);
    expect(body.triangles.length + lettering.triangles.length).toBeLessThanOrEqual(
      INTAKE_COVER_TRIANGLE_CAP,
    );

    const allPtsMm = [...body.verticesProjectMm, ...lettering.verticesProjectMm];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const [x, y, z] of allPtsMm) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    expect(minX).toBeGreaterThanOrEqual(245.0 - 1e-3);
    expect(maxX).toBeLessThanOrEqual(400.0 + 1e-3);
    expect(minY).toBeGreaterThanOrEqual(-120.0 - 1e-3);
    expect(maxY).toBeLessThanOrEqual(120.0 + 1e-3);
    expect(minZ).toBeGreaterThanOrEqual(INTAKE_COVER_ENVELOPE_Z_MIN_MM - 1e-3);
    expect(maxZ).toBeLessThanOrEqual(INTAKE_COVER_LETTER_Z_MAX_MM + 1e-3);
  });

  it('2. markers and deck: if_* markers within 0.5 mm with +Z normals, rim/pad/letter/mount Z heights, and shell contact vertex distances', () => {
    const parsed = getCoverGlb();
    const { doc } = parsed;
    const nodes = doc.nodes ?? [];
    const worldMats = computeWorldMatrices(doc);

    for (const spec of INTAKE_COVER_MARKERS) {
      const idx = nodes.findIndex((n) => n.name === spec.name);
      expect(idx, `Missing marker node "${spec.name}"`).toBeGreaterThanOrEqual(0);
      const node = nodes[idx]!;
      expect(node.mesh).toBeUndefined();

      // Identity rotation -> local +Z normal in project frame is (0, 0, 1)
      const rot = node.rotation ?? [0, 0, 0, 1];
      expect(Math.abs(rot[0])).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(rot[1])).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(rot[2])).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(rot[3] - 1)).toBeLessThanOrEqual(1e-6);

      const wm = worldMats.get(idx)!;
      // Local +Y in glTF Y-up corresponds to project +Z after wrapInPartLocalFrame (+90 deg X)
      const gyX = wm[1]!;
      const gyY = wm[5]!;
      const gyZ = wm[9]!;
      const projNormal: [number, number, number] = [gyX, -gyZ, gyY];
      expect(projNormal[0]).toBeCloseTo(spec.normal[0], 5);
      expect(projNormal[1]).toBeCloseTo(spec.normal[1], 5);
      expect(projNormal[2]).toBeCloseTo(spec.normal[2], 5);

      const posMm = gltfYupMetersToProjectMm(wm[3]!, wm[7]!, wm[11]!);
      const devMm = Math.hypot(
        posMm[0] - spec.positionMm[0],
        posMm[1] - spec.positionMm[1],
        posMm[2] - spec.positionMm[2],
      );
      expect(devMm).toBeLessThanOrEqual(0.5);
    }

    const bodyIdx = nodes.findIndex((n) => n.name === INTAKE_COVER_BODY_MESH_NAME);
    const letIdx = nodes.findIndex((n) => n.name === INTAKE_COVER_LETTERING_MESH_NAME);
    const body = extractNodeMeshWorld(parsed, worldMats, bodyIdx);
    const lettering = extractNodeMeshWorld(parsed, worldMats, letIdx);

    const rimPts = body.verticesProjectMm.filter((p) => p[2] > 365.0);
    const rimMinZ = Math.min(...rimPts.map((p) => p[2]));
    const bodyTopZ = Math.max(...body.verticesProjectMm.map((p) => p[2]));
    const letterTopZ = Math.max(...lettering.verticesProjectMm.map((p) => p[2]));
    const rearTowerBottomZ = Math.min(
      ...body.verticesProjectMm.filter((p) => p[0] < 300.0).map((p) => p[2]),
    );
    const frontMountBottomZ = Math.min(
      ...body.verticesProjectMm
        .filter((p) => p[0] > 340.0 && p[2] < 365.0)
        .map((p) => p[2]),
    );

    expect(Math.abs(rimMinZ - INTAKE_COVER_BODY_Z_MIN_MM)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(bodyTopZ - INTAKE_COVER_BODY_Z_MAX_MM)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(letterTopZ - INTAKE_COVER_LETTER_Z_MAX_MM)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(rearTowerBottomZ - 333.4)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(frontMountBottomZ - 353.4)).toBeLessThanOrEqual(0.1);

    // Verify nearest contact vertices on frozen M10 shell intakeBridge and chargePipeCold
    const shell = getShellGlb();
    const sNodes = shell.doc.nodes ?? [];
    const sWorld = computeWorldMatrices(shell.doc);

    const nearestShellVertexTo = (
      groupName: string,
      targetMm: readonly [number, number, number],
    ): { distMm: number; ptMm: [number, number, number] } => {
      const rootIdx = (shell.doc.scenes?.[shell.doc.scene ?? 0]?.nodes ?? []).find(
        (idx) => sNodes[idx]?.name === groupName,
      );
      expect(rootIdx, `Missing shell group ${groupName}`).toBeDefined();
      let bestDist = Infinity;
      let bestPt: [number, number, number] = [0, 0, 0];
      const stack = [rootIdx!];
      while (stack.length > 0) {
        const ni = stack.pop()!;
        const nd = sNodes[ni]!;
        for (const ch of nd.children ?? []) stack.push(ch);
        if (nd.mesh === undefined) continue;
        const m = extractNodeMeshWorld(shell, sWorld, ni);
        for (const pt of m.verticesProjectMm) {
          const d = Math.hypot(pt[0] - targetMm[0], pt[1] - targetMm[1], pt[2] - targetMm[2]);
          if (d < bestDist) {
            bestDist = d;
            bestPt = pt;
          }
        }
      }
      return { distMm: bestDist, ptMm: bestPt };
    };

    const rearContact = nearestShellVertexTo('intakeBridge', [260.0, 0.0, 333.4]);
    expect(rearContact.distMm).toBeCloseTo(0.6916, 4);
    expect(rearContact.ptMm[0]).toBeCloseTo(260.69, 3);
    expect(rearContact.ptMm[1]).toBeCloseTo(0.0, 3);
    expect(rearContact.ptMm[2]).toBeCloseTo(333.356, 3);
    // 15 mm pad check (radius 7.5 mm around (260, 0), 15 mm ahead of rear edge X = 245)
    expect(260.0 - 245.0).toBe(15.0);
    expect(Math.hypot(rearContact.ptMm[0] - 260.0, rearContact.ptMm[1] - 0.0)).toBeLessThanOrEqual(
      7.5,
    );

    const frontContact = nearestShellVertexTo('chargePipeCold', [372.0, -95.4, 353.4]);
    expect(frontContact.distMm).toBeCloseTo(0.3672, 4);
    expect(frontContact.ptMm[0]).toBeCloseTo(371.634, 3);
    expect(frontContact.ptMm[1]).toBeCloseTo(-95.4, 3);
    expect(frontContact.ptMm[2]).toBeCloseTo(353.367, 3);
  });

  it('3. shell clearance audit: 0 shell vertices inside body envelope, exact per-group minima across all 22 shell groups, and chargePipeCold max-Z outside relief', () => {
    const shell = getShellGlb();
    const sNodes = shell.doc.nodes ?? [];
    const sWorld = computeWorldMatrices(shell.doc);
    const rootIndices = shell.doc.scenes?.[shell.doc.scene ?? 0]?.nodes ?? [];
    expect(rootIndices).toHaveLength(22);

    let insideEnvelopeCount = 0;
    let overheadInPlanformCount = 0;
    const groupMinima = new Map<string, { distMm: number; ptMm: [number, number, number] }>();
    let coldPipeGroupMaxZ = {
      zMm: -Infinity,
      ptMm: [0, 0, 0] as [number, number, number],
    };

    for (const rIdx of rootIndices) {
      const groupName = sNodes[rIdx]!.name!;
      let bestDist = Infinity;
      let bestPt: [number, number, number] = [0, 0, 0];
      const stack = [rIdx];

      while (stack.length > 0) {
        const ni = stack.pop()!;
        const nd = sNodes[ni]!;
        for (const ch of nd.children ?? []) stack.push(ch);
        if (nd.mesh === undefined) continue;
        const wm = sWorld.get(ni)!;
        const mesh = shell.doc.meshes?.[nd.mesh]!;
        for (const prim of mesh.primitives) {
          const pos = readAccessorFloat64(shell, prim.attributes.POSITION!);
          for (let i = 0; i < pos.length; i += 3) {
            const lx = pos[i]!;
            const ly = pos[i + 1]!;
            const lz = pos[i + 2]!;
            const gx = wm[0]! * lx + wm[1]! * ly + wm[2]! * lz + wm[3]!;
            const gy = wm[4]! * lx + wm[5]! * ly + wm[6]! * lz + wm[7]!;
            const gz = wm[8]! * lx + wm[9]! * ly + wm[10]! * lz + wm[11]!;
            const [px, py, pz] = gltfYupMetersToProjectMm(gx, gy, gz);

            const inPlanform = isPointInsideIntakeCoverPlanformMm(px, py);
            if (inPlanform && pz >= INTAKE_COVER_BODY_Z_MIN_MM && pz <= INTAKE_COVER_BODY_Z_MAX_MM) {
              insideEnvelopeCount += 1;
            }
            if (inPlanform && pz > INTAKE_COVER_BODY_Z_MAX_MM) {
              overheadInPlanformCount += 1;
            }

            const d = distanceToIntakeCoverEnvelopeMm(px, py, pz);
            if (d < bestDist) {
              bestDist = d;
              bestPt = [px, py, pz];
            }

            if (groupName === 'chargePipeCold' && pz > coldPipeGroupMaxZ.zMm) {
              coldPipeGroupMaxZ = { zMm: pz, ptMm: [px, py, pz] };
            }
          }
        }
      }

      groupMinima.set(groupName, { distMm: bestDist, ptMm: bestPt });
    }

    expect(insideEnvelopeCount).toBe(0);
    expect(overheadInPlanformCount).toBe(0);

    const namedExpectations: ReadonlyArray<{
      group: string;
      floorMm: number;
      measuredMm: number;
    }> = [
      { group: 'chargePipeCold', floorMm: 5.0, measuredMm: 5.172 },
      { group: 'alternator', floorMm: 8.0, measuredMm: 8.084 },
      { group: 'acComp', floorMm: 8.0, measuredMm: 8.246 },
      { group: 'resonator', floorMm: 8.5, measuredMm: 8.793 },
      { group: 'intakeBridge', floorMm: 18.0, measuredMm: 18.046 },
      { group: 'electronics', floorMm: 25.9, measuredMm: 25.908 },
      { group: 'intake', floorMm: 48.0, measuredMm: 48.049 },
      { group: 'cp3Fuel', floorMm: 67.0, measuredMm: 67.07 },
    ];

    const namedSet = new Set(namedExpectations.map((e) => e.group));
    for (const exp of namedExpectations) {
      const rec = groupMinima.get(exp.group);
      expect(rec, `Missing clearance record for "${exp.group}"`).toBeDefined();
      expect(rec!.distMm).toBeGreaterThanOrEqual(exp.floorMm);
      expect(rec!.distMm).toBeCloseTo(exp.measuredMm, 3);
    }

    // Verify chargePipeCold nearest under-footprint vertex and group max-Z vertex outside the rear-right relief
    const coldNearest = groupMinima.get('chargePipeCold')!;
    expect(coldNearest.ptMm[0]).toBeCloseTo(342.338, 3);
    expect(coldNearest.ptMm[1]).toBeCloseTo(-99.358, 3);
    expect(coldNearest.ptMm[2]).toBeCloseTo(364.828, 3);

    expect(coldPipeGroupMaxZ.ptMm[0]).toBeCloseTo(348.544, 3);
    expect(coldPipeGroupMaxZ.ptMm[1]).toBeCloseTo(-140.375, 3);
    expect(coldPipeGroupMaxZ.zMm).toBeCloseTo(369.078, 3);
    expect(
      isPointInsideIntakeCoverPlanformMm(coldPipeGroupMaxZ.ptMm[0], coldPipeGroupMaxZ.ptMm[1]),
    ).toBe(false);
    expect(INTAKE_COVER_BODY_Z_MIN_MM - coldPipeGroupMaxZ.zMm).toBeCloseTo(0.922, 3);

    // Remaining 14 shell groups: argmin must be beltDrive at 73.407 mm (>= 73.4 mm)
    let remainingArgminGroup = '';
    let remainingMinMm = Infinity;
    let remainingCount = 0;
    for (const [groupName, rec] of groupMinima) {
      if (namedSet.has(groupName)) continue;
      remainingCount += 1;
      if (rec.distMm < remainingMinMm) {
        remainingMinMm = rec.distMm;
        remainingArgminGroup = groupName;
      }
    }
    expect(remainingCount).toBe(14);
    expect(remainingArgminGroup).toBe('beltDrive');
    expect(remainingMinMm).toBeGreaterThanOrEqual(73.4);
    expect(remainingMinMm).toBeCloseTo(73.407, 3);
  });

  it('4. V2 high-flow intake clearance: >= 6.0 mm at r = 58 mm (measured 6.567) and >= 13.0 mm at r = 50.8 mm (measured 13.767)', () => {
    const vd = JSON.parse(readFileSync(VARIANT_DIMS_PATH, 'utf8')) as Record<string, number>;
    const controlPts: Array<[number, number, number]> = [];
    for (let k = 0; k <= 8; k += 1) {
      controlPts.push([
        vd[`intakePathP${k}XMm`]!,
        vd[`intakePathP${k}YMm`]!,
        vd[`intakePathP${k}ZMm`]!,
      ]);
    }

    let minCenterlineDistMm = Infinity;
    for (let seg = 0; seg < controlPts.length - 1; seg += 1) {
      const a = controlPts[seg]!;
      const b = controlPts[seg + 1]!;
      for (let i = 0; i < 4001; i += 1) {
        const t = i / 4000;
        const x = a[0] + (b[0] - a[0]) * t;
        const y = a[1] + (b[1] - a[1]) * t;
        const z = a[2] + (b[2] - a[2]) * t;
        const d = distanceToIntakeCoverEnvelopeMm(x, y, z);
        if (d < minCenterlineDistMm) {
          minCenterlineDistMm = d;
        }
      }
    }

    const couplerRadiusMm = 0.5 * vd.intakeCouplerOuterDiameterMm!;
    const tubeRadiusMm = vd.intakeTubeOuterRadiusMm!;
    expect(couplerRadiusMm).toBe(58);
    expect(tubeRadiusMm).toBe(50.8);

    const clearanceCouplerMm = minCenterlineDistMm - couplerRadiusMm;
    const clearanceTubeMm = minCenterlineDistMm - tubeRadiusMm;

    expect(minCenterlineDistMm).toBeCloseTo(64.567, 3);
    expect(clearanceCouplerMm).toBeGreaterThanOrEqual(6.0);
    expect(clearanceCouplerMm).toBeCloseTo(6.567, 3);
    expect(clearanceTubeMm).toBeGreaterThanOrEqual(13.0);
    expect(clearanceTubeMm).toBeCloseTo(13.767, 3);
  });

  it('5. visibility and explode rules: default off, visible iff enabled && (exterior || xray), and clamped/NaN-safe +Z 260 mm explode', () => {
    expect(INTAKE_COVER_DEFAULT_ENABLED).toBe(false);

    for (const enabled of [false, true]) {
      for (const exterior of [false, true]) {
        for (const xray of [false, true]) {
          const expected = enabled && (exterior || xray);
          expect(computeIntakeCoverVisible(enabled, exterior, xray)).toBe(expected);
        }
      }
    }

    const zero = computeIntakeCoverExplodeOffsetMm(0);
    expect(zero).toEqual([0, 0, 0]);
    expect(Object.is(zero[0], 0)).toBe(true);
    expect(Object.is(zero[1], 0)).toBe(true);
    expect(Object.is(zero[2], 0)).toBe(true);

    expect(computeIntakeCoverExplodeOffsetMm(0.5)).toEqual([0, 0, 130]);
    expect(computeIntakeCoverExplodeOffsetMm(1)).toEqual([0, 0, 260]);
    expect(computeIntakeCoverExplodeOffsetMm(-1)).toEqual([0, 0, 0]);
    expect(computeIntakeCoverExplodeOffsetMm(2.5)).toEqual([0, 0, 260]);

    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const res = computeIntakeCoverExplodeOffsetMm(bad);
      expect(res).toEqual([0, 0, 0]);
      for (const v of res) {
        expect(Number.isNaN(v)).toBe(false);
      }
    }
  });

  it('6. lettering and wording: INTAKE_COVER_LEGEND is ["6.6","TURBO","DIESEL"], 45 stroke components, exact 540 triangles, no DURAMAX, no texture map', () => {
    expect(INTAKE_COVER_LEGEND).toEqual(['6.6', 'TURBO', 'DIESEL']);

    const parsed = getCoverGlb();
    const { doc } = parsed;
    const nodes = doc.nodes ?? [];
    const meshes = doc.meshes ?? [];
    const materials = doc.materials ?? [];

    for (const n of nodes) {
      expect((n.name ?? '').toUpperCase()).not.toContain('DURAMAX');
    }
    for (const m of meshes) {
      expect((m.name ?? '').toUpperCase()).not.toContain('DURAMAX');
    }
    for (const mat of materials) {
      expect((mat.name ?? '').toUpperCase()).not.toContain('DURAMAX');
    }

    const worldMats = computeWorldMatrices(doc);
    const letNodeIdx = nodes.findIndex((n) => n.name === INTAKE_COVER_LETTERING_MESH_NAME);
    expect(letNodeIdx).toBeGreaterThanOrEqual(0);
    const letMeshIdx = nodes[letNodeIdx]!.mesh!;
    const letMesh = meshes[letMeshIdx]!;
    for (const prim of letMesh.primitives) {
      expect(Object.keys(prim.attributes).some((k) => k.startsWith('TEXCOORD'))).toBe(false);
      const mat = materials[prim.material!]!;
      expect(mat.pbrMetallicRoughness?.baseColorTexture).toBeUndefined();
      expect(mat.normalTexture).toBeUndefined();
    }

    const extracted = extractNodeMeshWorld(parsed, worldMats, letNodeIdx);
    expect(extracted.triangles.length).toBe(INTAKE_COVER_LETTERING_EXPECTED_TRIANGLES);
    expect(extracted.triangles.length).toBe(540);
    expect(extracted.triangles.length).toBeLessThanOrEqual(INTAKE_COVER_LETTERING_TRIANGLE_CAP);

    const audit = auditWatertightAndComponents(extracted.verticesGltfM, extracted.triangles, 1e-5);
    expect(audit.components).toBe(INTAKE_COVER_LETTERING_EXPECTED_COMPONENTS);
    expect(audit.components).toBe(45);
  });

  it('7. cap source registration and X-Ray load-order safety (runtime createExteriorGhostRegistry + engineScene.ts source checks)', () => {
    // Runtime part: X-Ray enabled BEFORE late-loading cover materials register
    const registry = createExteriorGhostRegistry(0.22);
    const shellMat = { transparent: false, opacity: 1.0, depthWrite: true, needsUpdate: false };
    const coverBodyMat = { transparent: false, opacity: 1.0, depthWrite: true };
    const coverLetterMat = { transparent: true, opacity: 0.85, depthWrite: false };

    // Registering while unghosted leaves materials untouched
    registry.register([shellMat]);
    expect(registry.isGhosted()).toBe(false);
    expect(registry.size).toBe(1);
    expect(shellMat).toEqual({
      transparent: false,
      opacity: 1.0,
      depthWrite: true,
      needsUpdate: false,
    });

    // Enable X-Ray BEFORE cover materials finish loading
    registry.setGhosted(true);
    expect(registry.isGhosted()).toBe(true);
    expect(shellMat.transparent).toBe(true);
    expect(shellMat.opacity).toBe(0.22);
    expect(shellMat.depthWrite).toBe(false);
    expect(shellMat.needsUpdate).toBe(true);

    // Late-arriving cover materials register after X-Ray is already active -> ghosted immediately
    registry.register([coverBodyMat, coverLetterMat]);
    expect(registry.size).toBe(3);
    expect(coverBodyMat).toEqual({ transparent: true, opacity: 0.22, depthWrite: false });
    expect(coverLetterMat).toEqual({ transparent: true, opacity: 0.22, depthWrite: false });

    // Repeated setGhosted(true) must NOT overwrite original snapshots
    registry.setGhosted(true);
    registry.setGhosted(true);
    expect(coverBodyMat).toEqual({ transparent: true, opacity: 0.22, depthWrite: false });

    // Turning X-Ray off restores each material's exact authored snapshot
    shellMat.needsUpdate = false;
    registry.setGhosted(false);
    expect(registry.isGhosted()).toBe(false);
    expect(shellMat).toEqual({
      transparent: false,
      opacity: 1.0,
      depthWrite: true,
      needsUpdate: true,
    });
    expect(coverBodyMat).toEqual({ transparent: false, opacity: 1.0, depthWrite: true });
    expect(coverLetterMat).toEqual({ transparent: true, opacity: 0.85, depthWrite: false });

    // Source part: verify engineScene.ts integration seams and rendering invariants
    const engineSceneSource = readFileSync(
      resolve(process.cwd(), 'src', 'renderer', 'engineScene.ts'),
      'utf8',
    );

    expect(engineSceneSource).toMatch(
      /prepareCapSource\(\s*\{\s*id:\s*['"]intake_cover['"][\s\S]*?object3D:\s*intakeCover\.group[\s\S]*?static:\s*true[\s\S]*?skipWhenGhosted:\s*true/,
    );
    expect(engineSceneSource).toMatch(
      /loadVariantScene\(\s*partLoader\s*,\s*`\$\{baseUrl\}\$\{INTAKE_COVER_MODEL_PATH\}`\s*\)/,
    );
    expect(engineSceneSource).toMatch(
      /exteriorGhostRegistry\.register\(\s*intakeCover\.materials\s*\)\s*;\s*syncExteriorShellState\(\s*\)/,
    );
    expect(engineSceneSource).not.toContain('exteriorMaterialsGhosted');
    expect(engineSceneSource).toMatch(
      /const\s+syncExteriorShellState\s*=\s*\(\)\s*:\s*void\s*=>\s*\{\s*staticCapsDirty\s*=\s*true\s*;\s*exteriorGhostRegistry\.setGhosted\(\s*xrayEnabled\s*\)\s*;\s*syncIntakeCoverState\(\s*\)\s*;\s*if\s*\(\s*!exteriorShell\s*\)\s*return\s*;/,
    );

    const renderCallMatches = engineSceneSource.match(/renderer\.render\s*\(/g) ?? [];
    expect(renderCallMatches).toHaveLength(1);
    expect(engineSceneSource).not.toContain('new THREE.WebGLRenderTarget(');
    expect(engineSceneSource).not.toMatch(/stencil\s*:\s*true/);
    expect(engineSceneSource).not.toContain('setRenderTarget');
    expect(engineSceneSource).not.toContain('overrideMaterial');
  });

  it('11. watertight body & lettering: 0 boundary edges at 1e-5 m, exact 3 closed body components, and exact 45 closed lettering prism components', () => {
    const parsed = getCoverGlb();
    const nodes = parsed.doc.nodes ?? [];
    const worldMats = computeWorldMatrices(parsed.doc);

    const bodyIdx = nodes.findIndex((n) => n.name === INTAKE_COVER_BODY_MESH_NAME);
    const letIdx = nodes.findIndex((n) => n.name === INTAKE_COVER_LETTERING_MESH_NAME);
    const body = extractNodeMeshWorld(parsed, worldMats, bodyIdx);
    const lettering = extractNodeMeshWorld(parsed, worldMats, letIdx);

    const bodyAudit = auditWatertightAndComponents(body.verticesGltfM, body.triangles, 1e-5);
    expect(bodyAudit.boundaryEdges).toBe(0);
    expect(bodyAudit.nonManifoldEdges).toBe(0);
    expect(bodyAudit.components).toBe(INTAKE_COVER_BODY_EXPECTED_COMPONENTS);
    expect(bodyAudit.components).toBe(3);

    const letAudit = auditWatertightAndComponents(
      lettering.verticesGltfM,
      lettering.triangles,
      1e-5,
    );
    expect(letAudit.boundaryEdges).toBe(0);
    expect(letAudit.nonManifoldEdges).toBe(0);
    expect(letAudit.components).toBe(INTAKE_COVER_LETTERING_EXPECTED_COMPONENTS);
    expect(letAudit.components).toBe(45);
  });

  it('12. frozen-asset identity: M10 shell GLB, all 5 M8 variant GLBs, catalog/stock.json, and post-M13 catalog/modified.json (sanctioned rods_forged.modelPath change) match pinned hashes', async () => {
    const sha256Of = async (relPath: string): Promise<string> => {
      const bytes = readFileSync(resolve(process.cwd(), relPath));
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', copy);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    };

    expect(await sha256Of('public/Duramax_LLY_2005_66L_V8.glb')).toBe(
      'd51f88a0073fde617d1c6492618fcfabc672154288ac546e52fe2ed40b718554',
    );
    expect(await sha256Of('public/models/variants/turbo_unit_engine_large.glb')).toBe(
      '6e038dd2540f8732906068fa13cdfaaafe255b53336283118f36ab9aca1c82ed',
    );
    expect(await sha256Of('public/models/variants/intake_tract_engine_highflow.glb')).toBe(
      'fc28f77b7816a38ad6cb1a53351960b9cf3baf54e089b59de39223c1ba2f7e58',
    );
    expect(await sha256Of('public/models/variants/exhaust_system_engine_4inch.glb')).toBe(
      'a463172aeae64688383400d56b5c2d70dbf3e62992da1b3013892b456c53fa32',
    );
    expect(await sha256Of('public/models/variants/intercooler_core_engine_upgraded.glb')).toBe(
      '1f112556e1af253e761413f4e176689904e9c1b043e95ad5814bb984aeb9b183',
    );
    expect(await sha256Of('public/models/variants/rot_piston_c1_lowcomp.glb')).toBe(
      '41d1315d1fcc18d85fea7b498c28a1567e0bcfb5262e99e940b8f4bc1e35fb93',
    );

    const sha256TextLfOf = async (relPath: string): Promise<string> => {
      const textLf = readFileSync(resolve(process.cwd(), relPath), 'utf8').replace(/\r\n/g, '\n');
      const encoded = new TextEncoder().encode(textLf);
      const copy = new Uint8Array(encoded.byteLength);
      copy.set(encoded);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', copy);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    };

    expect(await sha256TextLfOf('catalog/stock.json')).toBe(
      '5ee91f4b0c667c3d3c70c2a39eb9e8afebd614875a4809ea42a29bd75fe2a66d',
    );
    expect(await sha256TextLfOf('catalog/modified.json')).toBe(
      '509c90c7c02af0081e1b3fe1737c47991bd03f9b6195e6118df594663059d802',
    );
  });
});
