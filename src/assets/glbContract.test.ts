// Milestone 2 GLB asset contract test suite (docs/specs/M2-detailed-cylinder.md).
// Node environment only: reads files with node:fs and parses the binary GLB JSON chunk directly.
// Never imports Three.js (respects src/core/architecture.test.ts).

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detailConfig } from '../config/detailConfig';
import { engineConfig } from '../config/engineConfig';
import { valveConfig } from '../config/valveConfig';

const GLTF_MAGIC = 0x46546c67; // ASCII 'glTF' in little-endian uint32
const JSON_CHUNK_TYPE = 0x4e4f534a; // ASCII 'JSON' in little-endian uint32

interface GltfAccessor {
  count: number;
  min?: number[];
  max?: number[];
}

interface GltfPrimitive {
  attributes: Record<string, number>;
  indices?: number;
  mode?: number;
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

interface GltfScene {
  nodes?: number[];
}

interface GltfJson {
  asset: { version: string };
  scenes?: GltfScene[];
  scene?: number;
  nodes?: GltfNode[];
  meshes?: GltfMesh[];
  accessors?: GltfAccessor[];
}

type Mat4 = number[]; // 16-element column-major 4x4 matrix
type Vec3 = [number, number, number];

function mat4Identity(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16).fill(0);
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) {
        sum += a[k * 4 + row]! * b[col * 4 + k]!;
      }
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

function nodeLocalMatrix(node: GltfNode): Mat4 {
  if (node.matrix && node.matrix.length === 16) {
    return [...node.matrix];
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

  return [
    (1 - (yy + zz)) * sx,
    (xy + wz) * sx,
    (xz - wy) * sx,
    0,
    (xy - wz) * sy,
    (1 - (xx + zz)) * sy,
    (yz + wx) * sy,
    0,
    (xz + wy) * sz,
    (yz - wx) * sz,
    (1 - (xx + yy)) * sz,
    0,
    tx,
    ty,
    tz,
    1,
  ];
}

function transformPoint(m: Mat4, p: Vec3): Vec3 {
  return [
    m[0]! * p[0] + m[4]! * p[1] + m[8]! * p[2] + m[12]!,
    m[1]! * p[0] + m[5]! * p[1] + m[9]! * p[2] + m[13]!,
    m[2]! * p[0] + m[6]! * p[1] + m[10]! * p[2] + m[14]!,
  ];
}

function parseGlbJson(filePath: string): GltfJson {
  const bytes = readFileSync(filePath);
  expect(bytes.byteLength).toBeGreaterThanOrEqual(20);

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const magic = view.getUint32(0, true);
  expect(magic).toBe(GLTF_MAGIC);

  const version = view.getUint32(4, true);
  expect(version).toBe(2);

  const declaredTotalLen = view.getUint32(8, true);
  expect(declaredTotalLen).toBe(bytes.byteLength);

  const chunk0Length = view.getUint32(12, true);
  const chunk0Type = view.getUint32(16, true);
  expect(chunk0Type).toBe(JSON_CHUNK_TYPE);

  const jsonBytes = bytes.subarray(20, 20 + chunk0Length);
  const jsonText = new TextDecoder('utf-8').decode(jsonBytes);
  return JSON.parse(jsonText) as GltfJson;
}

function computeNodeWorldMatrices(gltf: GltfJson): Map<number, Mat4> {
  const nodes = gltf.nodes ?? [];
  const worldByIndex = new Map<number, Mat4>();

  const sceneIdx = gltf.scene ?? 0;
  const rootNodes = gltf.scenes?.[sceneIdx]?.nodes ?? nodes.map((_, idx) => idx);

  const visit = (nodeIdx: number, parentWorld: Mat4): void => {
    const node = nodes[nodeIdx];
    if (!node) return;
    const world = mat4Multiply(parentWorld, nodeLocalMatrix(node));
    worldByIndex.set(nodeIdx, world);
    for (const childIdx of node.children ?? []) {
      visit(childIdx, world);
    }
  };

  for (const rootIdx of rootNodes) {
    visit(rootIdx, mat4Identity());
  }
  return worldByIndex;
}

function findNodeIndexByName(gltf: GltfJson, name: string): number {
  const idx = (gltf.nodes ?? []).findIndex((n) => n.name === name);
  if (idx === -1) {
    throw new Error(`Node "${name}" not found in GLB.`);
  }
  return idx;
}

function getNodeWorldTranslationM(gltf: GltfJson, nodeName: string): Vec3 {
  const worldMap = computeNodeWorldMatrices(gltf);
  const idx = findNodeIndexByName(gltf, nodeName);
  const m = worldMap.get(idx);
  if (!m) {
    throw new Error(`World matrix missing for node "${nodeName}".`);
  }
  return [m[12]!, m[13]!, m[14]!];
}

interface AabbM {
  min: Vec3;
  max: Vec3;
  size: Vec3;
}

function computeMeshLocalBoundsM(gltf: GltfJson, meshIdx: number): AabbM {
  const mesh = gltf.meshes?.[meshIdx];
  if (!mesh) {
    throw new Error(`Mesh index ${meshIdx} missing.`);
  }
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];

  for (const prim of mesh.primitives) {
    const posIdx = prim.attributes.POSITION;
    if (posIdx === undefined) continue;
    const acc = gltf.accessors?.[posIdx];
    if (!acc?.min || !acc.max) {
      throw new Error(`Accessor ${posIdx} missing min/max bounds.`);
    }
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis]!, acc.min[axis]!);
      max[axis] = Math.max(max[axis]!, acc.max[axis]!);
    }
  }

  return {
    min,
    max,
    size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
  };
}

function computeFileWorldBoundsM(gltf: GltfJson, filterNodeNames?: string[]): AabbM {
  const nodes = gltf.nodes ?? [];
  const worldMap = computeNodeWorldMatrices(gltf);
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];

  nodes.forEach((node, idx) => {
    if (node.mesh === undefined) return;
    if (filterNodeNames && (!node.name || !filterNodeNames.includes(node.name))) return;
    const world = worldMap.get(idx) ?? mat4Identity();
    const local = computeMeshLocalBoundsM(gltf, node.mesh);

    for (const cx of [local.min[0], local.max[0]]) {
      for (const cy of [local.min[1], local.max[1]]) {
        for (const cz of [local.min[2], local.max[2]]) {
          const wp = transformPoint(world, [cx, cy, cz]);
          min[0] = Math.min(min[0], wp[0]);
          min[1] = Math.min(min[1], wp[1]);
          min[2] = Math.min(min[2], wp[2]);
          max[0] = Math.max(max[0], wp[0]);
          max[1] = Math.max(max[1], wp[1]);
          max[2] = Math.max(max[2], wp[2]);
        }
      }
    }
  });

  return {
    min,
    max,
    size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
  };
}

function countGlbTriangles(gltf: GltfJson): number {
  let triangles = 0;
  for (const mesh of gltf.meshes ?? []) {
    for (const prim of mesh.primitives) {
      const mode = prim.mode ?? 4; // 4 = TRIANGLES
      if (mode !== 4) {
        throw new Error(`Unexpected non-TRIANGLES primitive mode ${mode}.`);
      }
      if (prim.indices !== undefined) {
        const idxAcc = gltf.accessors?.[prim.indices];
        if (!idxAcc) throw new Error(`Missing index accessor ${prim.indices}.`);
        triangles += idxAcc.count / 3;
      } else {
        const posIdx = prim.attributes.POSITION;
        if (posIdx === undefined) continue;
        const posAcc = gltf.accessors?.[posIdx];
        if (!posAcc) throw new Error(`Missing position accessor ${posIdx}.`);
        triangles += posAcc.count / 3;
      }
    }
  }
  return triangles;
}

const MODELS_DIR = resolve(process.cwd(), 'public', 'models');
const DIMENSIONS_PATH = resolve(process.cwd(), 'assets-src', 'dimensions.json');
const FIXTURE_PATH = resolve(process.cwd(), 'assets-src', 'fixture', 'axis_fixture.glb');

const CONTRACT_GLBS: Array<{
  file: string;
  requiredNodes: string[];
  assemblyInstances: number;
}> = [
  {
    file: 'rot_piston_c1_stock.glb',
    requiredNodes: ['rot_piston_c1_stock'],
    assemblyInstances: 1,
  },
  {
    file: 'rot_conrod_c1_stock.glb',
    requiredNodes: ['rot_conrod_c1_stock', 'rot_conrod_smallend_c1_stock'],
    assemblyInstances: 1,
  },
  {
    file: 'rot_crankthrow_c1_stock.glb',
    requiredNodes: ['rot_crankthrow_c1_stock', 'rot_crankpin_c1_stock'],
    assemblyInstances: 1,
  },
  {
    file: 'sta_head_c1_stock.glb',
    requiredNodes: ['sta_head_c1_stock'],
    assemblyInstances: 1,
  },
  {
    file: 'val_valve_intake_stock.glb',
    requiredNodes: ['val_valve_intake_stock', 'val_spring_intake_stock'],
    assemblyInstances: 2,
  },
  {
    file: 'val_valve_exhaust_stock.glb',
    requiredNodes: ['val_valve_exhaust_stock', 'val_spring_exhaust_stock'],
    assemblyInstances: 2,
  },
  {
    file: 'val_pushrod_stock.glb',
    requiredNodes: ['val_pushrod_stock', 'val_lifter_stock'],
    assemblyInstances: 2,
  },
  {
    file: 'val_rocker_stock.glb',
    requiredNodes: ['val_rocker_intake_stock', 'val_rocker_exhaust_stock'],
    assemblyInstances: 1,
  },
  {
    file: 'val_bridge_stock.glb',
    requiredNodes: ['val_bridge_stock'],
    assemblyInstances: 2,
  },
  {
    file: 'fuel_injector_c1_stock.glb',
    requiredNodes: ['fuel_injector_c1_stock'],
    assemblyInstances: 1,
  },
];

describe('Milestone 2 GLB asset contract (src/assets/glbContract.test.ts)', () => {
  it('1. files and names: all 10 GLBs exist, have glTF magic, and contain contract node names', () => {
    expect(CONTRACT_GLBS).toHaveLength(10);

    for (const entry of CONTRACT_GLBS) {
      const fullPath = resolve(MODELS_DIR, entry.file);
      expect(existsSync(fullPath), `Expected ${entry.file} to exist`).toBe(true);

      const gltf = parseGlbJson(fullPath);
      expect(gltf.asset.version).toBe('2.0');

      const nodeNames = new Set((gltf.nodes ?? []).map((n) => n.name).filter(Boolean));
      for (const reqNode of entry.requiredNodes) {
        expect(
          nodeNames.has(reqNode),
          `Expected ${entry.file} to contain node "${reqNode}", found: ${[...nodeNames].join(', ')}`,
        ).toBe(true);
      }
    }
  });

  it('2. dimensions sync: assets-src/dimensions.json matches detailConfig, engineConfig, and valveConfig exactly', () => {
    expect(existsSync(DIMENSIONS_PATH)).toBe(true);
    const parsed = JSON.parse(readFileSync(DIMENSIONS_PATH, 'utf-8')) as Record<string, unknown>;

    const expected: Record<string, number> = {
      boreMm: engineConfig.boreMm.value,
      strokeMm: engineConfig.strokeMm.value,
      crankThrowMm: engineConfig.crankThrowMm.value,
      rodLengthMm: engineConfig.rodLengthMm.value,
      borePitch: valveConfig.borePitch.value,
      maxLift: valveConfig.maxLift.value,
      deckGap: valveConfig.deckGap.value,
    };

    for (const [key, pv] of Object.entries(detailConfig)) {
      expected[key] = pv.value;
    }

    expect(Object.keys(parsed).sort()).toEqual(Object.keys(expected).sort());
    for (const [key, expectedVal] of Object.entries(expected)) {
      expect(parsed[key], `Dimension mismatch on "${key}"`).toBe(expectedVal);
    }
  });

  it('3. bounds and node geometry vs config (in glTF file space, bore axis = +Y)', () => {
    // Piston width/depth ≈ boreMm - pistonSkirtClearanceMm (±1 mm); height <= pistonCompressionHeightMm + 25 mm
    const pistonGltf = parseGlbJson(resolve(MODELS_DIR, 'rot_piston_c1_stock.glb'));
    const pistonBounds = computeFileWorldBoundsM(pistonGltf, ['rot_piston_c1_stock']);
    const expectedPistonDiamMm =
      engineConfig.boreMm.value - detailConfig.pistonSkirtClearanceMm.value;
    const pistonWidthMm = pistonBounds.size[0] * 1000;
    const pistonHeightMm = pistonBounds.size[1] * 1000;
    const pistonDepthMm = pistonBounds.size[2] * 1000;

    expect(Math.abs(pistonWidthMm - expectedPistonDiamMm)).toBeLessThanOrEqual(1.0);
    expect(Math.abs(pistonDepthMm - expectedPistonDiamMm)).toBeLessThanOrEqual(1.0);
    expect(pistonHeightMm).toBeLessThanOrEqual(detailConfig.pistonCompressionHeightMm.value + 25.0);
    // Also verify piston crown sits at +pistonCompressionHeightMm along glTF +Y
    expect(
      Math.abs(pistonBounds.max[1] * 1000 - detailConfig.pistonCompressionHeightMm.value),
    ).toBeLessThanOrEqual(0.5);

    // Connecting rod small-end child node translation ≈ rodLengthMm from rod origin within 0.5 mm
    const rodGltf = parseGlbJson(resolve(MODELS_DIR, 'rot_conrod_c1_stock.glb'));
    const rodOriginM = getNodeWorldTranslationM(rodGltf, 'rot_conrod_c1_stock');
    const smallEndM = getNodeWorldTranslationM(rodGltf, 'rot_conrod_smallend_c1_stock');
    const dxMm = (smallEndM[0] - rodOriginM[0]) * 1000;
    const dyMm = (smallEndM[1] - rodOriginM[1]) * 1000;
    const dzMm = (smallEndM[2] - rodOriginM[2]) * 1000;
    const rodNodeDistMm = Math.hypot(dxMm, dyMm, dzMm);
    expect(Math.abs(rodNodeDistMm - engineConfig.rodLengthMm.value)).toBeLessThanOrEqual(0.5);

    // Intake valve head diameter ≈ valveIntakeHeadMm within 1 mm (from its mesh bounds)
    const intakeValveGltf = parseGlbJson(resolve(MODELS_DIR, 'val_valve_intake_stock.glb'));
    const intakeNodeIdx = findNodeIndexByName(intakeValveGltf, 'val_valve_intake_stock');
    const intakeMeshIdx = intakeValveGltf.nodes?.[intakeNodeIdx]?.mesh;
    expect(intakeMeshIdx).toBeDefined();
    const intakeBounds = computeMeshLocalBoundsM(intakeValveGltf, intakeMeshIdx!);
    const intakeDiamXMm = intakeBounds.size[0] * 1000;
    const intakeDiamZMm = intakeBounds.size[2] * 1000;
    expect(Math.abs(intakeDiamXMm - detailConfig.valveIntakeHeadMm.value)).toBeLessThanOrEqual(1.0);
    expect(Math.abs(intakeDiamZMm - detailConfig.valveIntakeHeadMm.value)).toBeLessThanOrEqual(1.0);

    // Crankthrow pin node translation ≈ (0, +crankThrowMm, 0) within 0.5 mm per component,
    // and M3 §3/§12.1 pin journal mesh length along file X ≈ pinJournalLengthMm ± 2 mm
    const throwGltf = parseGlbJson(resolve(MODELS_DIR, 'rot_crankthrow_c1_stock.glb'));
    const throwOriginM = getNodeWorldTranslationM(throwGltf, 'rot_crankthrow_c1_stock');
    const pinPosM = getNodeWorldTranslationM(throwGltf, 'rot_crankpin_c1_stock');
    const pinRelMm: Vec3 = [
      (pinPosM[0] - throwOriginM[0]) * 1000,
      (pinPosM[1] - throwOriginM[1]) * 1000,
      (pinPosM[2] - throwOriginM[2]) * 1000,
    ];
    expect(Math.abs(pinRelMm[0] - 0)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(pinRelMm[1] - engineConfig.crankThrowMm.value)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(pinRelMm[2] - 0)).toBeLessThanOrEqual(0.5);

    const pinNodeIdx = findNodeIndexByName(throwGltf, 'rot_crankpin_c1_stock');
    const pinMeshIdx = throwGltf.nodes?.[pinNodeIdx]?.mesh;
    expect(pinMeshIdx).toBeDefined();
    const pinMeshBounds = computeMeshLocalBoundsM(throwGltf, pinMeshIdx!);
    const pinJournalLengthXMm = pinMeshBounds.size[0] * 1000;
    expect(Math.abs(pinJournalLengthXMm - detailConfig.pinJournalLengthMm.value)).toBeLessThanOrEqual(
      2.0,
    );

    // Head section spans one bore-pitch slice along X (-57.5..+57.5 mm per Revision 2)
    const headGltf = parseGlbJson(resolve(MODELS_DIR, 'sta_head_c1_stock.glb'));
    const headBounds = computeFileWorldBoundsM(headGltf, ['sta_head_c1_stock']);
    const headSpanXMm = headBounds.size[0] * 1000;
    expect(Math.abs(headSpanXMm - valveConfig.borePitch.value)).toBeLessThanOrEqual(0.5);
  });

  it('4. pivots: piston, rocker castings, and crankthrow world translations are (0, 0, 0) within 1e-6', () => {
    const pivotChecks: Array<{ file: string; node: string }> = [
      { file: 'rot_piston_c1_stock.glb', node: 'rot_piston_c1_stock' },
      { file: 'val_rocker_stock.glb', node: 'val_rocker_intake_stock' },
      { file: 'val_rocker_stock.glb', node: 'val_rocker_exhaust_stock' },
      { file: 'rot_crankthrow_c1_stock.glb', node: 'rot_crankthrow_c1_stock' },
    ];

    for (const check of pivotChecks) {
      const gltf = parseGlbJson(resolve(MODELS_DIR, check.file));
      const worldTrans = getNodeWorldTranslationM(gltf, check.node);
      expect(Math.abs(worldTrans[0])).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(worldTrans[1])).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(worldTrans[2])).toBeLessThanOrEqual(1e-6);
    }
  });

  it('5. budgets: each GLB <= 15,000 triangles and total cylinder-1 assembly <= 60,000 triangles', () => {
    let sumUniqueFilesTriangles = 0;
    let sumAssemblyInstancedTriangles = 0;

    for (const entry of CONTRACT_GLBS) {
      const gltf = parseGlbJson(resolve(MODELS_DIR, entry.file));
      const tris = countGlbTriangles(gltf);
      expect(tris).toBeGreaterThan(0);
      expect(tris, `${entry.file} exceeded 15,000 triangle limit`).toBeLessThanOrEqual(15_000);

      sumUniqueFilesTriangles += tris;
      sumAssemblyInstancedTriangles += tris * entry.assemblyInstances;
    }

    expect(sumUniqueFilesTriangles).toBeLessThanOrEqual(60_000);
    expect(sumAssemblyInstancedTriangles).toBeLessThanOrEqual(60_000);
  });

  it('6. axis fixture: axis_fixture.glb extents in glTF space are X ≈ 30 mm, Y ≈ 90 mm, Z ≈ 60 mm (±1 mm)', () => {
    expect(existsSync(FIXTURE_PATH)).toBe(true);
    const fixtureGltf = parseGlbJson(FIXTURE_PATH);
    const bounds = computeFileWorldBoundsM(fixtureGltf);

    const extentXMm = bounds.size[0] * 1000;
    const extentYMm = bounds.size[1] * 1000;
    const extentZMm = bounds.size[2] * 1000;

    expect(Math.abs(extentXMm - 30)).toBeLessThanOrEqual(1.0);
    expect(Math.abs(extentYMm - 90)).toBeLessThanOrEqual(1.0);
    expect(Math.abs(extentZMm - 60)).toBeLessThanOrEqual(1.0);
  });
});
