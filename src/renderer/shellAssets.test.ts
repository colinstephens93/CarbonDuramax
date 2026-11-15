// Milestone 10 rebuilt exterior shell binary GLB contract tests (docs/specs/M10-exterior-accuracy.md §9 tests 1-6).
// Node-only: parses public/Duramax_LLY_2005_66L_V8.glb directly via node:fs; never imports Three.js.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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
  extras?: Record<string, unknown>;
}

interface GltfMaterial {
  name?: string;
  doubleSided?: boolean;
  alphaMode?: string;
  alphaCutoff?: number;
  emissiveFactor?: [number, number, number];
  normalTexture?: unknown;
  occlusionTexture?: unknown;
  emissiveTexture?: unknown;
  extensions?: Record<string, unknown>;
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

interface ParsedShellGlb {
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

function parseGlbBinary(filePath: string): ParsedShellGlb {
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
    doc,
    binView: new DataView(bin.buffer, bin.byteOffset, bin.byteLength),
  };
}

function readAccessorFloat64(parsed: ParsedShellGlb, accessorIdx: number): Float64Array {
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
    // glTF matrix is column-major -> transpose to row-major
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

function collectSubtreeNodeIndices(nodes: readonly GltfNode[], startIdx: number): Set<number> {
  const visited = new Set<number>();
  const stack = [startIdx];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const ch of nodes[cur]?.children ?? []) {
      stack.push(ch);
    }
  }
  return visited;
}

function linearRgbToHex(rgb: readonly [number, number, number]): string {
  // Matches THREE.Color.setRGB(r, g, b, LinearSRGBColorSpace).getHexString():
  // Three.js stores linear components internally and converts linear -> sRGB in getHexString().
  const toSrgbByte = (c: number): number => {
    const clamped = Math.max(0, Math.min(1, c));
    const srgb =
      clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(srgb * 255)));
  };
  const r = toSrgbByte(rgb[0]).toString(16).padStart(2, '0');
  const g = toSrgbByte(rgb[1]).toString(16).padStart(2, '0');
  const b = toSrgbByte(rgb[2]).toString(16).padStart(2, '0');
  return `${r}${g}${b}`;
}

/**
 * Node-only re-implementation of `exteriorLoader.computeMaterialSignature` for untextured
 * `MeshStandardMaterial` primitives loaded by Three.js `GLTFLoader` (Spec §9 test 5).
 */
function computeUntexturedMaterialSignature(
  mat: GltfMaterial,
  primAttributes: Record<string, number>,
  indexed: boolean,
): string {
  const threeAttrNames = Object.keys(primAttributes)
    .map((a) => (a === 'POSITION' ? 'position' : a === 'NORMAL' ? 'normal' : a.toLowerCase()))
    .sort()
    .join(',');
  const indexedSig = indexed ? 'idx1' : 'idx0';
  const pbr = mat.pbrMetallicRoughness ?? {};
  const base = pbr.baseColorFactor ?? [1, 1, 1, 1];
  const colorHex = linearRgbToHex([base[0], base[1], base[2]]);
  const metalness = (pbr.metallicFactor ?? 1).toFixed(5);
  const roughness = (pbr.roughnessFactor ?? 1).toFixed(5);
  const em = mat.emissiveFactor ?? [0, 0, 0];
  const emissiveHex = linearRgbToHex([em[0], em[1], em[2]]);
  const emissiveIntensity = (1).toFixed(5);
  const alphaMode = mat.alphaMode ?? 'OPAQUE';
  const opacity = base[3].toFixed(5);
  const transparent = alphaMode === 'BLEND' ? 'T' : 'O';
  const alphaTest = (alphaMode === 'MASK' ? (mat.alphaCutoff ?? 0.5) : 0).toFixed(5);
  const side = mat.doubleSided ? 2 : 0; // THREE.DoubleSide = 2, THREE.FrontSide = 0
  const flatShading = 'S';
  const vertexColors = 'VC0';
  return [
    'MeshStandardMaterial',
    threeAttrNames,
    indexedSig,
    colorHex,
    metalness,
    roughness,
    emissiveHex,
    emissiveIntensity,
    opacity,
    transparent,
    alphaTest,
    side,
    flatShading,
    vertexColors,
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
  ].join('|');
}

const PRESERVED_M3_GROUP_ORDER = [
  'blockPan',
  'injectors',
  'cp3Fuel',
  'turbo',
  'egrSystem',
  'resonator',
  'intake',
  'boostPipe',
  'alternator',
  'acComp',
  'beltDrive',
  'electronics',
] as const;

const EXPECTED_22_GROUPS_AND_BUDGETS: ReadonlyArray<readonly [string, number]> = [
  ['blockPan', 3500],
  ['injectors', 2100],
  ['cp3Fuel', 1400],
  ['turbo', 5300],
  ['egrSystem', 1900],
  ['resonator', 600],
  ['intake', 2300],
  ['boostPipe', 1400],
  ['alternator', 1400],
  ['acComp', 600],
  ['beltDrive', 3300],
  ['electronics', 400],
  ['frontCover', 1100],
  ['heads', 1600],
  ['valveCovers', 3400],
  ['exhaustManifolds', 2300],
  ['chargePipeCold', 800],
  ['intakeBridge', 2300],
  ['fuelFilter', 600],
  ['oilFill', 250],
  ['dipstick', 250],
  ['liftBracket', 300],
];

// Explicit hand-expanded §5.2 feature vocabulary (all 92 literal partIds -> expected top-level group).
const EXPECTED_PART_ID_TO_GROUP: Readonly<Record<string, string>> = {
  ext_block: 'blockPan',
  ext_pan: 'blockPan',
  ext_drain_boss: 'blockPan',
  ext_mount_lh: 'blockPan',
  ext_mount_rh: 'blockPan',
  ext_front_cover: 'frontCover',
  ext_wp_boss: 'frontCover',
  ext_cp3_pad: 'frontCover',
  ext_head_rh: 'heads',
  ext_head_lh: 'heads',
  ext_exh_port_stub_rh_1: 'heads',
  ext_exh_port_stub_rh_2: 'heads',
  ext_exh_port_stub_rh_3: 'heads',
  ext_exh_port_stub_rh_4: 'heads',
  ext_exh_port_stub_lh_1: 'heads',
  ext_exh_port_stub_lh_2: 'heads',
  ext_exh_port_stub_lh_3: 'heads',
  ext_exh_port_stub_lh_4: 'heads',
  ext_vc_lower_rh: 'valveCovers',
  ext_vc_lower_lh: 'valveCovers',
  ext_vc_upper_rh: 'valveCovers',
  ext_vc_upper_lh: 'valveCovers',
  ext_vc_pcv_boss: 'valveCovers',
  ext_vc_fasteners: 'valveCovers',
  ext_injector_1: 'injectors',
  ext_injector_2: 'injectors',
  ext_injector_3: 'injectors',
  ext_injector_4: 'injectors',
  ext_injector_5: 'injectors',
  ext_injector_6: 'injectors',
  ext_injector_7: 'injectors',
  ext_injector_8: 'injectors',
  ext_inj_connector_1: 'injectors',
  ext_inj_connector_2: 'injectors',
  ext_inj_connector_3: 'injectors',
  ext_inj_connector_4: 'injectors',
  ext_inj_connector_5: 'injectors',
  ext_inj_connector_6: 'injectors',
  ext_inj_connector_7: 'injectors',
  ext_inj_connector_8: 'injectors',
  ext_inj_return_line: 'injectors',
  ext_exh_manifold_rh: 'exhaustManifolds',
  ext_exh_manifold_lh: 'exhaustManifolds',
  ext_exh_shield_rh: 'exhaustManifolds',
  ext_exh_shield_lh: 'exhaustManifolds',
  ext_uppipe_rh: 'turbo',
  ext_uppipe_lh: 'turbo',
  turbo_downpipe: 'turbo',
  turbo_unit: 'turbo',
  ext_charge_hot: 'boostPipe',
  ext_charge_cold: 'chargePipeCold',
  ext_intake_mouthpiece: 'intake',
  ext_intake_duct: 'intake',
  ext_intake_clamps: 'intake',
  ext_resonator: 'resonator',
  ext_resonator_clamp: 'resonator',
  ext_ybridge_duct: 'intakeBridge',
  ext_ybridge_crossover: 'intakeBridge',
  ext_ybridge_seals: 'intakeBridge',
  ext_map_sensor: 'intakeBridge',
  ext_ybridge_fasteners: 'intakeBridge',
  ext_egr_cooler: 'egrSystem',
  ext_egr_valve: 'egrSystem',
  ext_egr_pipes: 'egrSystem',
  ext_egr_bracket: 'egrSystem',
  ext_damper: 'beltDrive',
  ext_belt: 'beltDrive',
  ext_tensioner: 'beltDrive',
  ext_idler_a: 'beltDrive',
  ext_idler_b: 'beltDrive',
  ext_fan_clutch: 'beltDrive',
  ext_fan: 'beltDrive',
  ext_alternator: 'alternator',
  ext_vacuum_pump: 'alternator',
  ext_ac_compressor: 'acComp',
  ext_ps_pump: 'acComp',
  ext_ac_bracket: 'acComp',
  ext_ac_hoses: 'acComp',
  ext_cp3: 'cp3Fuel',
  ext_fca: 'cp3Fuel',
  ext_hp_rails: 'cp3Fuel',
  ext_hp_lines: 'cp3Fuel',
  ext_fuel_filter_head: 'fuelFilter',
  ext_fuel_filter_canister: 'fuelFilter',
  ext_oil_fill_neck: 'oilFill',
  ext_oil_cap: 'oilFill',
  ext_dipstick_tube: 'dipstick',
  ext_dipstick_handle: 'dipstick',
  ext_lift_bracket: 'liftBracket',
  ext_harness_loom: 'electronics',
  ext_harness_main_break: 'electronics',
  ext_glowplug_loom: 'electronics',
};

interface MarkerDatumSpec {
  readonly name: string;
  readonly posMm: readonly [number, number, number];
  readonly normalDir: readonly [number, number, number];
  readonly matingRadiusMm: number | null;
}

const M8_INTERFACE_DATUMS: readonly MarkerDatumSpec[] = [
  { name: 'if_turbine_inlet_rh', posMm: [-137.6, -84.1, 340.6], normalDir: [-27.6, -51.4, -30.8], matingRadiusMm: 44 },
  { name: 'if_turbine_inlet_lh', posMm: [-137.6, 46.4, 356.8], normalDir: [-29.6, 36.4, -45.2], matingRadiusMm: 44 },
  { name: 'if_turbine_outlet', posMm: [-146.2, -59.2, 373.3], normalDir: [-0.782, -0.247, -0.572], matingRadiusMm: 52 },
  { name: 'if_compressor_inlet', posMm: [13.2, 22.6, 453.6], normalDir: [0.7382, -0.6722, -0.0571], matingRadiusMm: 48 },
  { name: 'if_compressor_outlet', posMm: [36.5, 56.1, 419.2], normalDir: [0.973, 0.165, 0.18], matingRadiusMm: 44 },
  { name: 'if_airbox_mount', posMm: [587.4, -510.5, 371.9], normalDir: [0.8828, -0.4414, -0.1605], matingRadiusMm: null },
  { name: 'if_hot_side_inlet', posMm: [374.6, 474.8, 146.6], normalDir: [0, 1, 0], matingRadiusMm: null },
];

describe('Milestone 10 exterior shell GLB contract (src/renderer/shellAssets.test.ts)', () => {
  const shellPath = resolve(process.cwd(), 'public', 'Duramax_LLY_2005_66L_V8.glb');
  const parsed = parseGlbBinary(shellPath);
  const { doc } = parsed;
  const nodes = doc.nodes ?? [];
  const meshes = doc.meshes ?? [];
  const materials = doc.materials ?? [];
  const sceneIdx = doc.scene ?? 0;
  const rootIndices = doc.scenes?.[sceneIdx]?.nodes ?? [];
  const worldMatrices = computeWorldMatrices(doc);

  it('1. group contract: exact 22 top-level groups, preserved M3 relative order, turbo children 2 & 3, and intake group', () => {
    const rootNames = rootIndices.map((i) => nodes[i]?.name ?? '');
    const expectedNames = EXPECTED_22_GROUPS_AND_BUDGETS.map(([name]) => name);

    expect(rootNames).toHaveLength(22);
    expect(rootNames).toEqual(expectedNames);

    const m3SubsetInOrder = rootNames.filter((n) =>
      (PRESERVED_M3_GROUP_ORDER as readonly string[]).includes(n),
    );
    expect(m3SubsetInOrder).toEqual([...PRESERVED_M3_GROUP_ORDER]);

    const turboRootIdx = rootIndices.find((i) => nodes[i]?.name === 'turbo');
    expect(turboRootIdx).toBeDefined();
    const turboChildren = nodes[turboRootIdx!]?.children ?? [];
    expect(turboChildren.length).toBeGreaterThanOrEqual(4);
    expect(turboChildren[2]).toBeDefined();
    expect(turboChildren[3]).toBeDefined();

    const intakeRootIdx = rootIndices.find((i) => nodes[i]?.name === 'intake');
    expect(intakeRootIdx).toBeDefined();
  });

  it('2. feature vocabulary: all 92 literal partIds appear, no unknown partIds exist, and each maps to its expected group', () => {
    const expectedIds = Object.keys(EXPECTED_PART_ID_TO_GROUP).sort();
    expect(expectedIds).toHaveLength(92);

    const seenPartIds = new Set<string>();
    const rootByName = new Map<string, number>();
    for (const rIdx of rootIndices) {
      rootByName.set(nodes[rIdx]!.name!, rIdx);
    }

    const nodeToTopGroup = new Map<number, string>();
    for (const [gName, rIdx] of rootByName.entries()) {
      for (const nIdx of collectSubtreeNodeIndices(nodes, rIdx)) {
        nodeToTopGroup.set(nIdx, gName);
      }
    }

    for (let nIdx = 0; nIdx < nodes.length; nIdx += 1) {
      const node = nodes[nIdx]!;
      if (node.mesh === undefined) continue;
      const partId = node.extras?.partId;
      expect(typeof partId, `Mesh node "${node.name ?? nIdx}" missing extras.partId`).toBe('string');
      const pid = partId as string;
      expect(
        EXPECTED_PART_ID_TO_GROUP[pid],
        `Unexpected extras.partId "${pid}" on node "${node.name ?? nIdx}"`,
      ).toBeDefined();
      expect(nodeToTopGroup.get(nIdx)).toBe(EXPECTED_PART_ID_TO_GROUP[pid]);
      seenPartIds.add(pid);
    }

    expect([...seenPartIds].sort()).toEqual(expectedIds);
  });

  it('3. per-group and total triangle budgets: every group <= §5.2 ceiling and scene total <= 37,100', () => {
    let sceneTotalTriangles = 0;

    for (const [groupName, budget] of EXPECTED_22_GROUPS_AND_BUDGETS) {
      const rootIdx = rootIndices.find((i) => nodes[i]?.name === groupName)!;
      const subtree = collectSubtreeNodeIndices(nodes, rootIdx);
      let groupTris = 0;

      for (const nIdx of subtree) {
        const nd = nodes[nIdx]!;
        if (nd.mesh === undefined) continue;
        expect(typeof nd.extras?.partId).toBe('string');
        for (const prim of meshes[nd.mesh]!.primitives) {
          const triCount =
            prim.indices !== undefined
              ? (doc.accessors?.[prim.indices]?.count ?? 0) / 3
              : (doc.accessors?.[prim.attributes.POSITION!]?.count ?? 0) / 3;
          groupTris += triCount;
        }
      }

      expect(groupTris, `${groupName} must be non-empty`).toBeGreaterThan(0);
      expect(groupTris, `${groupName} (${groupTris}) exceeded budget ${budget}`).toBeLessThanOrEqual(
        budget,
      );
      sceneTotalTriangles += groupTris;
    }

    expect(sceneTotalTriangles).toBeLessThanOrEqual(37_100);
  });

  it('4. envelope and floor clearance: project bounds satisfy §9 test 4 limits and Z_min clears -245 mm floor by >= 21.4 mm', () => {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;

    for (const [nIdx, w] of worldMatrices.entries()) {
      const nd = nodes[nIdx]!;
      if (nd.mesh === undefined) continue;
      for (const prim of meshes[nd.mesh]!.primitives) {
        const pos = readAccessorFloat64(parsed, prim.attributes.POSITION!);
        for (let i = 0; i < pos.length; i += 3) {
          const lx = pos[i]!;
          const ly = pos[i + 1]!;
          const lz = pos[i + 2]!;
          const gx = w[0]! * lx + w[1]! * ly + w[2]! * lz + w[3]!;
          const gy = w[4]! * lx + w[5]! * ly + w[6]! * lz + w[7]!;
          const gz = w[8]! * lx + w[9]! * ly + w[10]! * lz + w[11]!;
          // §5.1 Y-up -> project Z-up: p_mm = (1000*gx, -1000*gz, 1000*gy)
          const px = 1000 * gx;
          const py = -1000 * gz;
          const pz = 1000 * gy;
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
          if (pz < minZ) minZ = pz;
          if (pz > maxZ) maxZ = pz;
        }
      }
    }

    expect(minZ).toBeGreaterThanOrEqual(-223.6 - 1.0);
    expect(minZ - -245.0).toBeGreaterThanOrEqual(21.4);
    expect(maxZ).toBeLessThanOrEqual(583.9 + 1.0);
    expect(minY).toBeGreaterThanOrEqual(-573.4 - 1.0);
    expect(maxY).toBeLessThanOrEqual(521.8 + 1.0);
    expect(minX).toBeGreaterThanOrEqual(-282.1 - 1.0);
    expect(maxX).toBeLessThanOrEqual(700.0 + 1.0);
  });

  it('5. asset-class rules & material-signature caps: untextured POSITION+NORMAL indexed tris, <= 24 global signatures, <= 13 preserved meshes', () => {
    expect(doc.images ?? []).toHaveLength(0);
    expect(doc.textures ?? []).toHaveLength(0);
    expect(doc.skins ?? []).toHaveLength(0);
    expect(doc.animations ?? []).toHaveLength(0);

    for (const mat of materials) {
      expect(mat.pbrMetallicRoughness).toBeDefined();
      expect(mat.pbrMetallicRoughness?.baseColorTexture).toBeUndefined();
      expect(mat.pbrMetallicRoughness?.metallicRoughnessTexture).toBeUndefined();
      expect(mat.normalTexture).toBeUndefined();
      expect(mat.occlusionTexture).toBeUndefined();
      expect(mat.emissiveTexture).toBeUndefined();
      expect(mat.extensions?.KHR_materials_unlit).toBeUndefined();
    }

    const turboRootIdx = rootIndices.find((i) => nodes[i]?.name === 'turbo')!;
    const intakeRootIdx = rootIndices.find((i) => nodes[i]?.name === 'intake')!;
    const turboChildren = nodes[turboRootIdx]!.children!;

    const preservedSets: Record<'turbo_downpipe' | 'turbo_unit' | 'intake_tract', Set<number>> = {
      turbo_downpipe: collectSubtreeNodeIndices(nodes, turboChildren[2]!),
      turbo_unit: collectSubtreeNodeIndices(nodes, turboChildren[3]!),
      intake_tract: collectSubtreeNodeIndices(nodes, intakeRootIdx),
    };

    const globalSignatures = new Set<string>();
    const preservedSignatures: Record<'turbo_downpipe' | 'turbo_unit' | 'intake_tract', Set<string>> =
      {
        turbo_downpipe: new Set<string>(),
        turbo_unit: new Set<string>(),
        intake_tract: new Set<string>(),
      };

    for (const [nIdx] of worldMatrices.entries()) {
      const nd = nodes[nIdx]!;
      expect(nd.skin).toBeUndefined();
      if (nd.mesh === undefined) continue;
      const mesh = meshes[nd.mesh]!;
      expect(mesh.weights).toBeUndefined();

      for (const prim of mesh.primitives) {
        expect(prim.indices).toBeDefined();
        expect(prim.mode ?? 4).toBe(4);
        expect(prim.targets).toBeUndefined();
        const attrKeys = Object.keys(prim.attributes).sort();
        expect(attrKeys).toEqual(['NORMAL', 'POSITION']);
        expect(attrKeys.some((k) => k.startsWith('TEXCOORD'))).toBe(false);
        expect(prim.material).toBeDefined();

        const sig = computeUntexturedMaterialSignature(
          materials[prim.material!]!,
          prim.attributes,
          true,
        );

        let inPreserved = false;
        for (const key of ['turbo_downpipe', 'turbo_unit', 'intake_tract'] as const) {
          if (preservedSets[key].has(nIdx)) {
            preservedSignatures[key].add(sig);
            inPreserved = true;
          }
        }
        if (!inPreserved) {
          globalSignatures.add(sig);
        }
      }
    }

    expect(globalSignatures.size).toBeGreaterThan(0);
    expect(globalSignatures.size).toBeLessThanOrEqual(24);

    const preservedMergedMeshCount =
      preservedSignatures.turbo_downpipe.size +
      preservedSignatures.turbo_unit.size +
      preservedSignatures.intake_tract.size;
    expect(preservedSignatures.turbo_unit.size).toBeLessThanOrEqual(6);
    expect(preservedSignatures.turbo_downpipe.size).toBeLessThanOrEqual(2);
    expect(preservedSignatures.intake_tract.size).toBeLessThanOrEqual(5);
    expect(preservedMergedMeshCount).toBeLessThanOrEqual(13);
  });

  it('6. interface datums: all 7 M8 markers within 1.0 mm and all 5 contact flange rims within +-1.0 mm & <= 0.5 deg normal', () => {
    const projX: number[] = [];
    const projY: number[] = [];
    const projZ: number[] = [];
    const nrmX: number[] = [];
    const nrmY: number[] = [];
    const nrmZ: number[] = [];

    for (const [nIdx, w] of worldMatrices.entries()) {
      const nd = nodes[nIdx]!;
      if (nd.mesh === undefined) continue;
      for (const prim of meshes[nd.mesh]!.primitives) {
        const pos = readAccessorFloat64(parsed, prim.attributes.POSITION!);
        const nrm = readAccessorFloat64(parsed, prim.attributes.NORMAL!);
        for (let i = 0; i < pos.length; i += 3) {
          const lx = pos[i]!;
          const ly = pos[i + 1]!;
          const lz = pos[i + 2]!;
          const gx = w[0]! * lx + w[1]! * ly + w[2]! * lz + w[3]!;
          const gy = w[4]! * lx + w[5]! * ly + w[6]! * ly * 0 + w[6]! * lz + w[7]!;
          const gz = w[8]! * lx + w[9]! * ly + w[10]! * lz + w[11]!;
          projX.push(1000 * gx);
          projY.push(-1000 * gz);
          projZ.push(1000 * gy);

          const nlx = nrm[i]!;
          const nly = nrm[i + 1]!;
          const nlz = nrm[i + 2]!;
          const ngx = w[0]! * nlx + w[1]! * nly + w[2]! * nlz;
          const ngy = w[4]! * nlx + w[5]! * nly + w[6]! * nlz;
          const ngz = w[8]! * nlx + w[9]! * nly + w[10]! * nlz;
          const pnx = ngx;
          const pny = -ngz;
          const pnz = ngy;
          const nLen = Math.hypot(pnx, pny, pnz) || 1;
          nrmX.push(pnx / nLen);
          nrmY.push(pny / nLen);
          nrmZ.push(pnz / nLen);
        }
      }
    }

    for (const datum of M8_INTERFACE_DATUMS) {
      const [mx, my, mz] = datum.posMm;
      const nRawLen = Math.hypot(datum.normalDir[0], datum.normalDir[1], datum.normalDir[2]);
      const nx = datum.normalDir[0] / nRawLen;
      const ny = datum.normalDir[1] / nRawLen;
      const nz = datum.normalDir[2] / nRawLen;

      let nearestDist = Number.POSITIVE_INFINITY;
      let rimMaxRadius = 0;
      let rimCount = 0;
      let maxNormalAngleDeg = 0;

      // Note on §9 test 6 rim selector: markers sit at the centre of circular mating flanges
      // (nearest vertex <= 1.0 mm), while the flange rim sits at r = 44/48/52 mm on the mating
      // plane |(p - marker)·n| <= 1.0 mm with planar cap vertex normal aligned to +-n.
      for (let i = 0; i < projX.length; i += 1) {
        const dx = projX[i]! - mx;
        const dy = projY[i]! - my;
        const dz = projZ[i]! - mz;
        const dist = Math.hypot(dx, dy, dz);
        if (dist < nearestDist) nearestDist = dist;

        if (datum.matingRadiusMm !== null && dist <= 75.0) {
          const ax = dx * nx + dy * ny + dz * nz;
          const nDot = Math.abs(nrmX[i]! * nx + nrmY[i]! * ny + nrmZ[i]! * nz);
          if (Math.abs(ax) <= 1.0 && nDot >= 0.999) {
            const rad = Math.sqrt(Math.max(0, dist * dist - ax * ax));
            if (rad > rimMaxRadius) rimMaxRadius = rad;
            const angDeg = (Math.acos(Math.min(1, nDot)) * 180) / Math.PI;
            if (angDeg > maxNormalAngleDeg) maxNormalAngleDeg = angDeg;
            rimCount += 1;
          }
        }
      }

      expect(nearestDist, `${datum.name} nearest vertex ${nearestDist} mm`).toBeLessThanOrEqual(1.0);

      if (datum.matingRadiusMm !== null) {
        expect(rimCount, `${datum.name} mating face vertices missing`).toBeGreaterThanOrEqual(12);
        expect(
          Math.abs(rimMaxRadius - datum.matingRadiusMm),
          `${datum.name} rim radius ${rimMaxRadius} vs ${datum.matingRadiusMm}`,
        ).toBeLessThanOrEqual(1.0);
        expect(maxNormalAngleDeg, `${datum.name} normal angle ${maxNormalAngleDeg} deg`).toBeLessThanOrEqual(
          0.5,
        );
      }
    }
  });
});
