// Milestone 8 variant GLB asset contract, variant_dimensions.json sync, and binary GLB read-back tests
// (docs/specs/M8-part-variants.md §§3.2, 3.3, 9.4–9.6).
// Node environment only: reads files with node:fs and parses binary GLB JSON + BIN chunks directly.
// Never imports Three.js (respects src/core/architecture.test.ts).

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fullCatalog } from '../catalog';
import { VARIANT_TRIANGLE_CAPS } from '../renderer/partVariants';

const GLTF_MAGIC = 0x46546c67; // 'glTF'
const JSON_CHUNK_TYPE = 0x4e4f534a; // 'JSON'
const BIN_CHUNK_TYPE = 0x004e4942; // 'BIN\0'

interface GltfBufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
}

interface GltfAccessor {
  bufferView?: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
  min?: number[];
  max?: number[];
}

interface GltfPrimitive {
  attributes: Record<string, number>;
  indices?: number;
  material?: number;
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
  scene?: number;
  scenes?: GltfScene[];
  nodes?: GltfNode[];
  meshes?: GltfMesh[];
  materials?: unknown[];
  images?: unknown[];
  textures?: unknown[];
  bufferViews?: GltfBufferView[];
  accessors?: GltfAccessor[];
}

interface ParsedGlb {
  readonly json: GltfJson;
  readonly bin: Uint8Array<ArrayBufferLike>;
}

type Mat4 = number[]; // column-major 4x4
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

/**
 * Converts a glTF Y-up file-space point (metres) into project frame (millimetres)
 * via the single +90 deg X wrapper: (x_g, y_g, z_g) -> (x_g, -z_g, y_g) * 1000.
 */
function gltfMetersToProjectMm(p: Vec3): Vec3 {
  return [p[0] * 1000, -p[2] * 1000, p[1] * 1000];
}

function parseGlb(filePath: string): ParsedGlb {
  const bytes = readFileSync(filePath);
  expect(bytes.byteLength).toBeGreaterThanOrEqual(20);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  expect(view.getUint32(0, true)).toBe(GLTF_MAGIC);
  expect(view.getUint32(4, true)).toBe(2);
  expect(view.getUint32(8, true)).toBe(bytes.byteLength);

  const chunk0Length = view.getUint32(12, true);
  expect(view.getUint32(16, true)).toBe(JSON_CHUNK_TYPE);
  const jsonText = new TextDecoder('utf-8').decode(bytes.subarray(20, 20 + chunk0Length));
  const json = JSON.parse(jsonText) as GltfJson;

  let bin: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  const chunk1Start = 20 + chunk0Length;
  if (chunk1Start + 8 <= bytes.byteLength) {
    const chunk1Length = view.getUint32(chunk1Start, true);
    expect(view.getUint32(chunk1Start + 4, true)).toBe(BIN_CHUNK_TYPE);
    bin = bytes.subarray(chunk1Start + 8, chunk1Start + 8 + chunk1Length);
  }

  return { json, bin };
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

function getNodeWorldTranslationM(gltf: GltfJson, nodeName: string): Vec3 {
  const nodes = gltf.nodes ?? [];
  const idx = nodes.findIndex((n) => n.name === nodeName);
  if (idx === -1) {
    throw new Error(`Node "${nodeName}" not found in GLB.`);
  }
  const m = computeNodeWorldMatrices(gltf).get(idx);
  if (!m) {
    throw new Error(`World matrix missing for node "${nodeName}".`);
  }
  return [m[12]!, m[13]!, m[14]!];
}

function readVec3FloatAccessor(parsed: ParsedGlb, accessorIdx: number): Vec3[] {
  const acc = parsed.json.accessors?.[accessorIdx];
  if (!acc || acc.bufferView === undefined) {
    throw new Error(`Missing accessor or bufferView at index ${accessorIdx}.`);
  }
  expect(acc.componentType).toBe(5126); // FLOAT
  expect(acc.type).toBe('VEC3');

  const bv = parsed.json.bufferViews?.[acc.bufferView];
  if (!bv) {
    throw new Error(`Missing bufferView ${acc.bufferView}.`);
  }
  const stride = bv.byteStride ?? 12;
  const baseOffset = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const view = new DataView(parsed.bin.buffer, parsed.bin.byteOffset, parsed.bin.byteLength);

  const out: Vec3[] = [];
  for (let i = 0; i < acc.count; i += 1) {
    const off = baseOffset + i * stride;
    out.push([
      view.getFloat32(off, true),
      view.getFloat32(off + 4, true),
      view.getFloat32(off + 8, true),
    ]);
  }
  return out;
}

function collectWorldVerticesM(parsed: ParsedGlb): Vec3[] {
  const nodes = parsed.json.nodes ?? [];
  const worldMap = computeNodeWorldMatrices(parsed.json);
  const verts: Vec3[] = [];

  nodes.forEach((node, idx) => {
    if (node.mesh === undefined) return;
    const world = worldMap.get(idx) ?? mat4Identity();
    const mesh = parsed.json.meshes?.[node.mesh];
    if (!mesh) return;
    for (const prim of mesh.primitives) {
      const posIdx = prim.attributes.POSITION;
      if (posIdx === undefined) continue;
      for (const localPt of readVec3FloatAccessor(parsed, posIdx)) {
        verts.push(transformPoint(world, localPt));
      }
    }
  });

  return verts;
}

function countGlbTriangles(gltf: GltfJson): number {
  let triangles = 0;
  for (const mesh of gltf.meshes ?? []) {
    for (const prim of mesh.primitives) {
      const mode = prim.mode ?? 4;
      expect(mode).toBe(4);
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

// Literal pinned values directly from M8 Spec §§3.2 & 3.3 (never derived from variant_dimensions.json).
const LITERAL_PINNED_VARIANT_DIMENSIONS: Readonly<Record<string, number>> = {
  ifTurbineInletRhXMm: -137.6,
  ifTurbineInletRhYMm: -84.1,
  ifTurbineInletRhZMm: 340.6,
  ifTurbineInletLhXMm: -137.6,
  ifTurbineInletLhYMm: 46.4,
  ifTurbineInletLhZMm: 356.8,
  ifTurbineOutletXMm: -146.2,
  ifTurbineOutletYMm: -59.2,
  ifTurbineOutletZMm: 373.3,
  ifTurboCompressorInletXMm: 13.2,
  ifTurboCompressorInletYMm: 22.6,
  ifTurboCompressorInletZMm: 453.6,
  ifTurboCompressorOutletXMm: 36.5,
  ifTurboCompressorOutletYMm: 56.1,
  ifTurboCompressorOutletZMm: 419.2,
  ifIntakeAirboxMountXMm: 587.4,
  ifIntakeAirboxMountYMm: -510.5,
  ifIntakeAirboxMountZMm: 371.9,
  ifIntercoolerHotSideInletXMm: 374.6,
  ifIntercoolerHotSideInletYMm: 474.8,
  ifIntercoolerHotSideInletZMm: 146.6,
  turbineOutletNormalX: -0.782,
  turbineOutletNormalY: -0.247,
  turbineOutletNormalZ: -0.572,
  compressorInletNormalX: 0.7382,
  compressorInletNormalY: -0.6722,
  compressorInletNormalZ: -0.0571,
  compressorOutletNormalX: 0.973,
  compressorOutletNormalY: 0.165,
  compressorOutletNormalZ: 0.18,
  intakeFilterAxisX: 0.8828,
  intakeFilterAxisY: -0.4414,
  intakeFilterAxisZ: -0.1605,
  studioFloorZMm: -245,
  externalMinZLimitMm: -225,
  turboRotorAxisYMm: 5,
  turboRotorAxisZMm: 394,
  turboTurbineHousingXMinMm: -152,
  turboTurbineHousingXMaxMm: -88,
  turboTurbineHousingOuterRadiusMm: 117,
  turboTurbineHousingRearNeckRadiusMm: 54,
  turboUpPipeNozzleRadiusMm: 40,
  turboUpPipeFlangeRadiusMm: 44,
  turboFlangeThicknessMm: 12,
  turboChraXMinMm: -92,
  turboChraXMaxMm: -58,
  turboChraInnerRadiusMm: 42,
  turboChraOuterRadiusMm: 46,
  turboOilFeedDiameterMm: 12,
  turboOilDrainDiameterMm: 24,
  turboCompressorHousingXMinMm: -60,
  turboCompressorHousingXMaxMm: 16,
  turboCompressorHousingOuterRadiusMm: 131,
  turboCompressorInletBellRadiusMm: 44,
  turboCompressorInletFlangeRadiusMm: 48,
  turboCompressorOutletElbowRadiusMm: 38,
  turboCompressorOutletFlangeRadiusMm: 44,
  turboTurbineOutletNeckRadiusMm: 45,
  turboTurbineOutletFlangeRadiusMm: 52,
  turboActuatorDiameterMm: 60,
  turboActuatorLengthMm: 80,
  turboActuatorCenterXMm: -120,
  turboActuatorCenterYMm: 50,
  turboActuatorCenterZMm: 500,
  turboActuatorRodDiameterMm: 8,
  turboEnvXMinMm: -180,
  turboEnvXMaxMm: 50,
  turboEnvYMinMm: -135,
  turboEnvYMaxMm: 150,
  turboEnvZMinMm: 260,
  turboEnvZMaxMm: 540,
  intakeTubeOuterDiameterMm: 101.6,
  intakeTubeOuterRadiusMm: 50.8,
  intakeTubeStartOffsetMm: 6,
  intakeCouplerOuterDiameterMm: 116,
  intakeCouplerLengthMm: 60,
  intakeClampOuterDiameterMm: 120,
  intakeClampWidthMm: 12,
  intakeFilterBaseDiameterMm: 160,
  intakeFilterTipDiameterMm: 100,
  intakeFilterLengthMm: 190,
  intakePathP0XMm: 13.2,
  intakePathP0YMm: 22.6,
  intakePathP0ZMm: 453.6,
  intakePathP1XMm: 46.42,
  intakePathP1YMm: -7.65,
  intakePathP1ZMm: 451.03,
  intakePathP2XMm: 84.11,
  intakePathP2YMm: -14.51,
  intakePathP2ZMm: 427.95,
  intakePathP3XMm: 136.84,
  intakePathP3YMm: -48.58,
  intakePathP3ZMm: 425.14,
  intakePathP4XMm: 425.94,
  intakePathP4YMm: -254.77,
  intakePathP4ZMm: 491.77,
  intakePathP5XMm: 531.1,
  intakePathP5YMm: -358.5,
  intakePathP5ZMm: 482.4,
  intakePathP6XMm: 539.1,
  intakePathP6YMm: -450.7,
  intakePathP6ZMm: 396.5,
  intakePathP7XMm: 547.67,
  intakePathP7YMm: -490.64,
  intakePathP7ZMm: 379.12,
  intakePathP8XMm: 587.4,
  intakePathP8YMm: -510.5,
  intakePathP8ZMm: 371.9,
  intakeEnvXMinMm: -20,
  intakeEnvXMaxMm: 800,
  intakeEnvYMinMm: -650,
  intakeEnvYMaxMm: 100,
  intakeEnvZMinMm: 280,
  intakeEnvZMaxMm: 560,
  exhaustInletFlangeRadiusMm: 52,
  exhaustStubOuterRadiusMm: 38.1,
  exhaustPipeOuterDiameterMm: 101.6,
  exhaustPipeOuterRadiusMm: 50.8,
  exhaustMufflerOuterDiameterMm: 220,
  exhaustMufflerLengthMm: 380,
  exhaustMufflerXStartMm: -570,
  exhaustMufflerXEndMm: -950,
  exhaustMufflerAxisYMm: -108,
  exhaustMufflerAxisZMm: 25,
  exhaustTailEndXMm: -1035,
  exhaustTailEndZMm: -25,
  exhaustTipFlareOuterRadiusMm: 56,
  exhaustPathP0XMm: -146.2,
  exhaustPathP0YMm: -59.2,
  exhaustPathP0ZMm: 373.3,
  exhaustPathP1XMm: -193.1,
  exhaustPathP1YMm: -74,
  exhaustPathP1ZMm: 339,
  exhaustPathP2XMm: -250,
  exhaustPathP2YMm: -88,
  exhaustPathP2ZMm: 270,
  exhaustPathP3XMm: -310,
  exhaustPathP3YMm: -98,
  exhaustPathP3ZMm: 190,
  exhaustPathP4XMm: -370,
  exhaustPathP4YMm: -105,
  exhaustPathP4ZMm: 110,
  exhaustPathP5XMm: -430,
  exhaustPathP5YMm: -108,
  exhaustPathP5ZMm: 55,
  exhaustPathP6XMm: -500,
  exhaustPathP6YMm: -108,
  exhaustPathP6ZMm: 30,
  exhaustPathP7XMm: -560,
  exhaustPathP7YMm: -108,
  exhaustPathP7ZMm: 25,
  exhaustPathP8XMm: -575,
  exhaustPathP8YMm: -108,
  exhaustPathP8ZMm: 25,
  exhaustEnvXMinMm: -1100,
  exhaustEnvXMaxMm: -110,
  exhaustEnvYMinMm: -300,
  exhaustEnvYMaxMm: 60,
  exhaustEnvZMinMm: -160,
  exhaustEnvZMaxMm: 470,
  intercoolerPipeOuterDiameterMm: 76.2,
  intercoolerPipeOuterRadiusMm: 38.1,
  intercoolerCouplerOuterDiameterMm: 84,
  intercoolerCouplerOuterRadiusMm: 42,
  intercoolerNearTankXMinMm: 90,
  intercoolerNearTankXMaxMm: 150,
  intercoolerFarTankXMinMm: 610,
  intercoolerFarTankXMaxMm: 670,
  intercoolerTankYMinMm: 545,
  intercoolerTankYMaxMm: 655,
  intercoolerTankZMinMm: -20,
  intercoolerTankZMaxMm: 320,
  intercoolerCoreXMinMm: 150,
  intercoolerCoreXMaxMm: 610,
  intercoolerCoreYMinMm: 555,
  intercoolerCoreYMaxMm: 645,
  intercoolerCoreZMinMm: -10,
  intercoolerCoreZMaxMm: 310,
  intercoolerEnvXMinMm: 60,
  intercoolerEnvXMaxMm: 700,
  intercoolerEnvYMinMm: 430,
  intercoolerEnvYMaxMm: 720,
  intercoolerEnvZMinMm: -60,
  intercoolerEnvZMaxMm: 360,
  pistonDishDepthMm: 16.2957,
  pistonDishFlatFloorRadiusMm: 16.456,
  pistonDishFlatFloorZMm: 33.5043,
  pistonDishShoulderRadiusMm: 23.1413,
  pistonDishShoulderZMm: 36.4375,
  pistonDishLipRadiusMm: 28.798,
  pistonDishLipZMm: 48.4963,
  pistonDishMouthRadiusMm: 29.8265,
  pistonCrownOuterRadiusMm: 51.425,
  pistonCrownHeightMm: 49.8,
  pistonStockDishVolumeMm3: 29586.5,
  pistonVariantDishVolumeMm3: 32816.5,
  pistonCrImpliedDeltaVolumeMm3: 3225.4,
};

const EXTERNAL_VARIANT_CONTRACTS: ReadonlyArray<{
  readonly file: string;
  readonly rootNode: string;
  readonly markers: Readonly<Record<string, Vec3>>;
  readonly envelopeMm: {
    readonly xMin: number;
    readonly xMax: number;
    readonly yMin: number;
    readonly yMax: number;
    readonly zMin: number;
    readonly zMax: number;
  };
  readonly checkGroundMargin: boolean;
}> = [
  {
    file: 'turbo_unit_engine_large.glb',
    rootNode: 'turbo_unit_engine_large',
    markers: {
      if_turbine_inlet_rh: [-137.6, -84.1, 340.6],
      if_turbine_inlet_lh: [-137.6, 46.4, 356.8],
      if_turbine_outlet: [-146.2, -59.2, 373.3],
      if_compressor_inlet: [13.2, 22.6, 453.6],
      if_compressor_outlet: [36.5, 56.1, 419.2],
    },
    envelopeMm: {
      xMin: -180,
      xMax: 50,
      yMin: -135,
      yMax: 150,
      zMin: 260,
      zMax: 540,
    },
    checkGroundMargin: false,
  },
  {
    file: 'intake_tract_engine_highflow.glb',
    rootNode: 'intake_tract_engine_highflow',
    markers: {
      if_compressor_inlet: [13.2, 22.6, 453.6],
      if_airbox_mount: [587.4, -510.5, 371.9],
    },
    envelopeMm: {
      xMin: -20,
      xMax: 800,
      yMin: -650,
      yMax: 100,
      zMin: 280,
      zMax: 560,
    },
    checkGroundMargin: false,
  },
  {
    file: 'exhaust_system_engine_4inch.glb',
    rootNode: 'exhaust_system_engine_4inch',
    markers: {
      if_turbine_outlet: [-146.2, -59.2, 373.3],
    },
    envelopeMm: {
      xMin: -1100,
      xMax: -110,
      yMin: -300,
      yMax: 60,
      zMin: -160,
      zMax: 470,
    },
    checkGroundMargin: true,
  },
  {
    file: 'intercooler_core_engine_upgraded.glb',
    rootNode: 'intercooler_core_engine_upgraded',
    markers: {
      if_hot_side_inlet: [374.6, 474.8, 146.6],
    },
    envelopeMm: {
      xMin: 60,
      xMax: 700,
      yMin: 430,
      yMax: 720,
      zMin: -60,
      zMax: 360,
    },
    checkGroundMargin: true,
  },
];

const VARIANTS_DIR = resolve(process.cwd(), 'public', 'models', 'variants');
const VARIANT_DIMENSIONS_PATH = resolve(process.cwd(), 'assets-src', 'variant_dimensions.json');

function resolveVariantIdByFile(fileName: string): string {
  const modelPath = `models/variants/${fileName}`;
  const entry = fullCatalog.find((v) => v.modelPath === modelPath);
  if (!entry) {
    throw new Error(`No catalog entry maps to "${modelPath}".`);
  }
  return entry.id;
}

describe('Milestone 8 variant GLB asset contract & dimensions sync (src/assets/variantAssets.test.ts)', () => {
  it('4. external variant GLBs: contract root nodes, exact if_* marker sets & datums (±1.0 mm), triangle/material caps, no textures, and project envelopes', () => {
    for (const contract of EXTERNAL_VARIANT_CONTRACTS) {
      const fullPath = resolve(VARIANTS_DIR, contract.file);
      expect(existsSync(fullPath), `Expected ${contract.file} to exist`).toBe(true);

      const parsed = parseGlb(fullPath);
      const { json } = parsed;
      expect(json.asset.version).toBe('2.0');

      // No images or texture references
      expect(json.images ?? []).toHaveLength(0);
      expect(json.textures ?? []).toHaveLength(0);

      // Material and triangle caps (resolved via catalog modelPath -> VARIANT_TRIANGLE_CAPS)
      const variantId = resolveVariantIdByFile(contract.file);
      const cap = VARIANT_TRIANGLE_CAPS[variantId];
      expect(cap, `Missing cap for variant "${variantId}"`).toBeDefined();

      const materialCount = (json.materials ?? []).length;
      expect(materialCount).toBeGreaterThanOrEqual(1);
      expect(materialCount).toBeLessThanOrEqual(4);

      const triangles = countGlbTriangles(json);
      expect(triangles).toBeGreaterThan(0);
      expect(triangles, `${contract.file} exceeded cap ${cap}`).toBeLessThanOrEqual(cap!);
      expect(triangles).toBeLessThanOrEqual(15_000);

      // Contract root mesh node + exact if_* empty marker set (no extra markers)
      const nodes = json.nodes ?? [];
      const meshNodeNames = nodes.filter((n) => n.mesh !== undefined).map((n) => n.name);
      expect(meshNodeNames).toEqual([contract.rootNode]);

      const markerNodes = nodes.filter((n) => n.name?.startsWith('if_'));
      for (const mn of markerNodes) {
        expect(mn.mesh, `Marker "${mn.name}" in ${contract.file} must be an empty node`).toBeUndefined();
      }
      const actualMarkerNames = markerNodes.map((n) => n.name!).sort();
      const expectedMarkerNames = Object.keys(contract.markers).sort();
      expect(actualMarkerNames).toEqual(expectedMarkerNames);

      // Each marker's project-space translation matches its §3.2 datum within ±1.0 mm
      for (const [markerName, expectedMm] of Object.entries(contract.markers)) {
        const gltfTransM = getNodeWorldTranslationM(json, markerName);
        const projMm = gltfMetersToProjectMm(gltfTransM);
        expect(Math.abs(projMm[0] - expectedMm[0])).toBeLessThanOrEqual(1.0);
        expect(Math.abs(projMm[1] - expectedMm[1])).toBeLessThanOrEqual(1.0);
        expect(Math.abs(projMm[2] - expectedMm[2])).toBeLessThanOrEqual(1.0);
      }

      // Project-space vertex bounds inside §3.2 envelope (+ ground margin Z >= -225 mm for V3/V4)
      const worldVertsM = collectWorldVerticesM(parsed);
      expect(worldVertsM.length).toBeGreaterThan(0);
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      for (const vM of worldVertsM) {
        const [px, py, pz] = gltfMetersToProjectMm(vM);
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
        minZ = Math.min(minZ, pz);
        maxZ = Math.max(maxZ, pz);
      }

      expect(minX, `${contract.file} minX`).toBeGreaterThanOrEqual(contract.envelopeMm.xMin);
      expect(maxX, `${contract.file} maxX`).toBeLessThanOrEqual(contract.envelopeMm.xMax);
      expect(minY, `${contract.file} minY`).toBeGreaterThanOrEqual(contract.envelopeMm.yMin);
      expect(maxY, `${contract.file} maxY`).toBeLessThanOrEqual(contract.envelopeMm.yMax);
      expect(minZ, `${contract.file} minZ`).toBeGreaterThanOrEqual(contract.envelopeMm.zMin);
      expect(maxZ, `${contract.file} maxZ`).toBeLessThanOrEqual(contract.envelopeMm.zMax);
      if (contract.checkGroundMargin) {
        expect(minZ, `${contract.file} ground margin`).toBeGreaterThanOrEqual(-225);
      }
    }
  });

  it('5. piston variant GLB: bore-fit half-extents 51.425 (-0.00/+0.05) mm, crown 49.80 ± 0.10 mm, skirt -22.94 ± 0.25 mm, pivot (0,0,0), caps & no textures', () => {
    const fileName = 'rot_piston_c1_lowcomp.glb';
    const fullPath = resolve(VARIANTS_DIR, fileName);
    expect(existsSync(fullPath)).toBe(true);

    const parsed = parseGlb(fullPath);
    const { json } = parsed;
    expect(json.asset.version).toBe('2.0');
    expect(json.images ?? []).toHaveLength(0);
    expect(json.textures ?? []).toHaveLength(0);

    const variantId = resolveVariantIdByFile(fileName);
    expect(variantId).toBe('pistons_lowcomp');
    const cap = VARIANT_TRIANGLE_CAPS[variantId]!;
    expect(cap).toBe(5200);

    const triangles = countGlbTriangles(json);
    expect(triangles).toBeGreaterThan(0);
    expect(triangles).toBeLessThanOrEqual(cap);
    expect((json.materials ?? []).length).toBeLessThanOrEqual(4);

    const nodes = json.nodes ?? [];
    expect(nodes.filter((n) => n.mesh !== undefined).map((n) => n.name)).toEqual([
      'rot_piston_c1_lowcomp',
    ]);
    expect(nodes.filter((n) => n.name?.startsWith('if_'))).toHaveLength(0);

    // Pivot at (0, 0, 0) within 1e-6 m
    const pivotTransM = getNodeWorldTranslationM(json, 'rot_piston_c1_lowcomp');
    expect(Math.abs(pivotTransM[0])).toBeLessThanOrEqual(1e-6);
    expect(Math.abs(pivotTransM[1])).toBeLessThanOrEqual(1e-6);
    expect(Math.abs(pivotTransM[2])).toBeLessThanOrEqual(1e-6);

    // glTF file-space bounds (bore axis = +Y)
    const worldVertsM = collectWorldVerticesM(parsed);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const [vx, vy, vz] of worldVertsM) {
      minX = Math.min(minX, vx * 1000);
      maxX = Math.max(maxX, vx * 1000);
      minY = Math.min(minY, vy * 1000);
      maxY = Math.max(maxY, vy * 1000);
      minZ = Math.min(minZ, vz * 1000);
      maxZ = Math.max(maxZ, vz * 1000);
    }

    // Half-extents 51.425 (-0.00 / +0.05) mm -> OD 102.85 .. 102.95 mm
    for (const halfExtentMm of [-minX, maxX, -minZ, maxZ]) {
      expect(halfExtentMm).toBeGreaterThanOrEqual(51.425);
      expect(halfExtentMm).toBeLessThanOrEqual(51.475);
    }
    const odXMm = maxX - minX;
    const odZMm = maxZ - minZ;
    expect(odXMm).toBeGreaterThanOrEqual(102.85);
    expect(odXMm).toBeLessThanOrEqual(102.95);
    expect(odZMm).toBeGreaterThanOrEqual(102.85);
    expect(odZMm).toBeLessThanOrEqual(102.95);

    // Crown +Y = 49.80 ± 0.10 mm, skirt bottom -Y = -22.94 ± 0.25 mm
    expect(Math.abs(maxY - 49.8)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(minY - -22.94)).toBeLessThanOrEqual(0.25);
  });

  it('6. variant_dimensions.json sync & binary GLB read-back: exact literal key/value pin plus V2 101.6 mm OD and V5 crown-profile/volume read-back', () => {
    expect(existsSync(VARIANT_DIMENSIONS_PATH)).toBe(true);
    const parsedDims = JSON.parse(readFileSync(VARIANT_DIMENSIONS_PATH, 'utf-8')) as Record<
      string,
      unknown
    >;

    expect(Object.keys(parsedDims).sort()).toEqual(
      Object.keys(LITERAL_PINNED_VARIANT_DIMENSIONS).sort(),
    );
    for (const [key, expectedVal] of Object.entries(LITERAL_PINNED_VARIANT_DIMENSIONS)) {
      expect(parsedDims[key], `Pinned dimension mismatch on "${key}"`).toBe(expectedVal);
    }

    // Read-back 1: V2 exported mesh cross-section outer diameter = 101.6 mm near compressor inlet start ring
    const v2Parsed = parseGlb(resolve(VARIANTS_DIR, 'intake_tract_engine_highflow.glb'));
    const v2ProjVertsMm = collectWorldVerticesM(v2Parsed).map(gltfMetersToProjectMm);
    const cin: Vec3 = [
      LITERAL_PINNED_VARIANT_DIMENSIONS.ifTurboCompressorInletXMm!,
      LITERAL_PINNED_VARIANT_DIMENSIONS.ifTurboCompressorInletYMm!,
      LITERAL_PINNED_VARIANT_DIMENSIONS.ifTurboCompressorInletZMm!,
    ];
    const rawN: Vec3 = [
      LITERAL_PINNED_VARIANT_DIMENSIONS.compressorInletNormalX!,
      LITERAL_PINNED_VARIANT_DIMENSIONS.compressorInletNormalY!,
      LITERAL_PINNED_VARIANT_DIMENSIONS.compressorInletNormalZ!,
    ];
    const nNorm = Math.hypot(rawN[0], rawN[1], rawN[2]);
    const nCin: Vec3 = [rawN[0] / nNorm, rawN[1] / nNorm, rawN[2] / nNorm];
    const startOffsetMm = LITERAL_PINNED_VARIANT_DIMENSIONS.intakeTubeStartOffsetMm!;
    const c0: Vec3 = [
      cin[0] + startOffsetMm * nCin[0],
      cin[1] + startOffsetMm * nCin[1],
      cin[2] + startOffsetMm * nCin[2],
    ];

    const ringRadiiMm: number[] = [];
    for (const p of v2ProjVertsMm) {
      const dx = p[0] - cin[0];
      const dy = p[1] - cin[1];
      const dz = p[2] - cin[2];
      const axialMm = dx * nCin[0] + dy * nCin[1] + dz * nCin[2];
      if (Math.abs(axialMm - startOffsetMm) > 0.25) continue;
      const distFromC0 = Math.hypot(p[0] - c0[0], p[1] - c0[1], p[2] - c0[2]);
      if (distFromC0 > 10 && distFromC0 < 80) {
        ringRadiiMm.push(distFromC0);
      }
    }
    expect(ringRadiiMm.length).toBeGreaterThanOrEqual(24);
    const meanOuterDiameterMm =
      2 * (ringRadiiMm.reduce((sum, r) => sum + r, 0) / ringRadiiMm.length);
    expect(
      Math.abs(meanOuterDiameterMm - LITERAL_PINNED_VARIANT_DIMENSIONS.intakeTubeOuterDiameterMm!),
    ).toBeLessThanOrEqual(0.3);

    // Read-back 2: V5 exported crown-profile radii, dish depth, and revolved dish volume delta
    const v5Parsed = parseGlb(resolve(VARIANTS_DIR, 'rot_piston_c1_lowcomp.glb'));
    const v5Verts = collectWorldVerticesM(v5Parsed);
    const crownPairs: Array<{ rMm: number; hMm: number }> = [];
    for (const [vx, vy, vz] of v5Verts) {
      const hMm = vy * 1000;
      if (hMm < 33.0) continue;
      const rMm = Math.hypot(vx * 1000, vz * 1000);
      crownPairs.push({ rMm, hMm });
    }

    const expectedCrownProfile: ReadonlyArray<readonly [number, number]> = [
      [0, LITERAL_PINNED_VARIANT_DIMENSIONS.pistonDishFlatFloorZMm!],
      [
        LITERAL_PINNED_VARIANT_DIMENSIONS.pistonDishFlatFloorRadiusMm!,
        LITERAL_PINNED_VARIANT_DIMENSIONS.pistonDishFlatFloorZMm!,
      ],
      [
        LITERAL_PINNED_VARIANT_DIMENSIONS.pistonDishShoulderRadiusMm!,
        LITERAL_PINNED_VARIANT_DIMENSIONS.pistonDishShoulderZMm!,
      ],
      [
        LITERAL_PINNED_VARIANT_DIMENSIONS.pistonDishLipRadiusMm!,
        LITERAL_PINNED_VARIANT_DIMENSIONS.pistonDishLipZMm!,
      ],
      [
        LITERAL_PINNED_VARIANT_DIMENSIONS.pistonDishMouthRadiusMm!,
        LITERAL_PINNED_VARIANT_DIMENSIONS.pistonCrownHeightMm!,
      ],
      [
        LITERAL_PINNED_VARIANT_DIMENSIONS.pistonCrownOuterRadiusMm!,
        LITERAL_PINNED_VARIANT_DIMENSIONS.pistonCrownHeightMm!,
      ],
    ];

    for (const [targetRMm, targetHMm] of expectedCrownProfile) {
      const hasMatch = crownPairs.some(
        (pt) => Math.abs(pt.rMm - targetRMm) <= 0.05 && Math.abs(pt.hMm - targetHMm) <= 0.05,
      );
      expect(
        hasMatch,
        `Missing exported V5 crown profile ring at r=${targetRMm} mm, h=${targetHMm} mm`,
      ).toBe(true);
    }

    // Revolved dish cavity volume below crown_h = 49.80 mm (signed conical frusta along Z,
    // supporting re-entrant omega lips; M8 Spec §3.2 V5)
    const dishVolumeCm3 = (pts: ReadonlyArray<readonly [number, number]>): number => {
      let volMm3 = 0;
      for (let i = 0; i + 1 < pts.length; i += 1) {
        const [r0, z0] = pts[i]!;
        const [r1, z1] = pts[i + 1]!;
        volMm3 += (Math.PI / 3) * (z1 - z0) * (r0 * r0 + r0 * r1 + r1 * r1);
      }
      return volMm3 / 1000;
    };

    const stockProfile: ReadonlyArray<readonly [number, number]> = [
      [0, 44.322],
      [8.228, 42.4047],
      [19.5415, 36.354],
      [30.855, 40.1189],
      [27.7695, 48.7243],
      [28.798, 49.8],
    ];

    const vStockCm3 = dishVolumeCm3(stockProfile);
    const vLowcompCm3 = dishVolumeCm3(expectedCrownProfile);
    expect(Math.abs(vStockCm3 - 29.5865)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(vLowcompCm3 - 32.8165)).toBeLessThanOrEqual(0.01);

    const deltaCm3 = vLowcompCm3 - vStockCm3;
    const crImpliedDeltaCm3 =
      LITERAL_PINNED_VARIANT_DIMENSIONS.pistonCrImpliedDeltaVolumeMm3! / 1000;

    expect(Math.abs(deltaCm3 - crImpliedDeltaCm3)).toBeLessThanOrEqual(0.05);
  });
});
