// Runtime CPU cross-section extraction, loop welding, containment-depth hole classification,
// Earcut triangulation (via THREE.ShapeUtils.triangulateShape), and plane-locked hatched cap material
// (Milestone 11, D-043; docs/specs/M11-capped-cutaways.md §4).

import * as THREE from 'three';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import type { ActiveSectionMode } from './viewLayout';

/** Warm, desaturated cut-bronze base colour in linear-sRGB (§2.3). */
export const SECTION_CAP_COLOR_LINEAR = [0.29, 0.17, 0.086] as const;

/** Darker 45° hatch stripe colour in linear-sRGB (~68 % luminance of base, §2.3). */
export const SECTION_CAP_HATCH_COLOR_LINEAR = [0.196, 0.112, 0.055] as const;

/** World-space perpendicular hatch line spacing on the section plane in mm (§2.3, §4.4). */
export const SECTION_CAP_HATCH_SPACING_MM = 5.0;

/** Fraction of each 5.0 mm period occupied by the darker hatch line (§2.3, §4.4). */
export const SECTION_CAP_HATCH_DUTY = 1 / 3;

/** Conservative submitted-triangle ceiling for combined static + dynamic caps (§6.2). */
export const SECTION_CAP_MAX_TRIANGLES = 16_000;

/** Coplanarity / half-open cut tolerance in world mm (0.1 µm, §4.3). */
export const SECTION_SLICE_EPSILON_MM = 1e-4;

/** Endpoint weld quantum in plane-projected mm (§4.3). */
export const SECTION_WELD_QUANTUM_MM = 1e-3;

const INITIAL_WORKING_TRIANGLES = 16_384;
const COINCIDENT_POINT_DIST_SQ_MM2 = 1e-12;
const MIN_LOOP_AREA_MM2 = 1e-6;
const PACK_OFFSET = 33_554_432; // 2^25 -> covers +/-33,554 mm (+/-33.5 m) at 0.001 mm quantum
const PACK_STRIDE = 67_108_864; // 2^26 (PACK_STRIDE^2 = 2^52 < Number.MAX_SAFE_INTEGER)

export type Point2D = readonly [number, number];

export interface SectionSlicePlane {
  readonly mode: ActiveSectionMode;
  readonly positionMm: number;
}

export interface SliceMeshOptions {
  readonly indices?: ArrayLike<number> | null;
  readonly matrixWorld?: THREE.Matrix4 | null;
}

export interface TracedLoopsResult {
  readonly loops: Point2D[][];
  readonly openChains: Point2D[][];
  readonly ambiguousJunctions: number;
}

export interface ClassifiedLoopGroup {
  readonly outerIndex: number;
  readonly outer: Point2D[];
  readonly holeIndices: number[];
  readonly holes: Point2D[][];
}

export interface ClassifiedLoopsResult {
  readonly groups: ClassifiedLoopGroup[];
  readonly depths: number[];
  readonly parentByLoop: number[];
}

export interface TriangulatedLoopsResult {
  readonly triangles: number[][];
  readonly vertices: Point2D[];
}

export interface SpringConvexHullCache {
  readonly hull: ConvexHull;
  readonly hullPositions: Float32Array;
  readonly triangleCount: number;
  readonly localBounds: THREE.Box3;
}

export interface SourceComponentCache {
  readonly positions: Float32Array;
  readonly bounds: THREE.Box3;
  readonly relativeMatrix: THREE.Matrix4 | null;
}

export interface CapSource {
  readonly id: string;
  readonly object3D: THREE.Object3D;
  readonly instanced: boolean;
  readonly count: number;
  readonly static: boolean;
  readonly skipWhenGhosted: boolean;
  readonly hullOnly: boolean;
  readonly cachedHull?: ConvexHull;
  /** Pre-flattened local hull triangle vertices in metres (9 floats per triangle). */
  hullPositions?: Float32Array;
  /** Optional multi-primitive geometries sharing object3D's transform or instance matrices. */
  readonly geometries?: readonly THREE.BufferGeometry[];
  /** Cached local-space AABB in metres for O(1) per-source/per-instance plane culling (§4.5). */
  localBounds?: THREE.Box3;
  /** Cached local-space bounding sphere radius in metres (§4.5). */
  boundingSphereRadius?: number;
  /** Cached 3-D position-welded connected surface components for independent hole classification & culling. */
  components?: readonly SourceComponentCache[];
}

export interface CapBuildTarget {
  positions: Float32Array;
  sectionUV: Float32Array;
  geometry?: THREE.BufferGeometry;
}

export interface CapBuildStats {
  readonly triangles: number;
  readonly openChains: number;
  readonly closedChains: number;
  readonly droppedGroups: number;
  readonly hullOnlySources: number;
  readonly ambiguousJunctions: number;
}

interface ChildMeshEntry {
  readonly geometry: THREE.BufferGeometry;
  readonly relativeMatrix: THREE.Matrix4 | null;
}

const childEntriesCache = new WeakMap<THREE.Object3D, ChildMeshEntry[]>();

// Reusable scratch structures for steady-state zero-churn execution (§4.5)
const scratchInstanceMatrix = new THREE.Matrix4();
const scratchCombinedMatrix = new THREE.Matrix4();
const scratchInvRootMatrix = new THREE.Matrix4();
const scratchTempBox = new THREE.Box3();
const scratchSegments: number[] = [];
const vec2Pool: THREE.Vector2[] = [];
const scratchContourVec2: THREE.Vector2[] = [];
const scratchHoleArrays: THREE.Vector2[][] = [];
const holeVec2SubArrayPool: THREE.Vector2[][] = [];

const weldKeyToVertexMap = new Map<number | string, number>();
const weldVertU: number[] = [];
const weldVertV: number[] = [];
const weldSegA: number[] = [];
const weldSegB: number[] = [];
const weldAdjPool: number[][] = [];
let weldUnusedDeg = new Int32Array(512);
let weldEdgeUsed = new Uint8Array(512);
let weldVisitedPos = new Int32Array(512).fill(-1);
const weldWalkVerts: number[] = [];
const pointTuplePool: [number, number][] = [];
const pointListPool: Point2D[][] = [];
const scratchTracedLoops: Point2D[][] = [];
const scratchTracedOpenChains: Point2D[][] = [];

const scratchSimplePoly: Point2D[] = [];
const closedChainCleanedPool: Point2D[][] = [];
const scratchCombinedLoops: Point2D[][] = [];
let scratchOpenChainFlags = new Uint8Array(64);

const classifyCleanedPool: Point2D[][] = [];
let classifyAbsAreas = new Float64Array(64);
let classifyMinU = new Float64Array(64);
let classifyMinV = new Float64Array(64);
let classifyMaxU = new Float64Array(64);
let classifyMaxV = new Float64Array(64);
const classifyDepthsScratch: number[] = [];
const classifyParentsScratch: number[] = [];
let classifyGroupIdxByLoop = new Int32Array(64);
interface MutableClassifiedLoopGroup {
  outerIndex: number;
  outer: Point2D[];
  readonly holeIndices: number[];
  readonly holes: Point2D[][];
}
const classifyGroupPool: MutableClassifiedLoopGroup[] = [];
const scratchClassifiedGroups: ClassifiedLoopGroup[] = [];

function borrowVec2(index: number, x: number, y: number): THREE.Vector2 {
  let v = vec2Pool[index];
  if (!v) {
    v = new THREE.Vector2(x, y);
    vec2Pool[index] = v;
  } else {
    v.set(x, y);
  }
  return v;
}

function borrowPointTuple(index: number, u: number, v: number): Point2D {
  let pt = pointTuplePool[index];
  if (!pt) {
    pt = [u, v];
    pointTuplePool[index] = pt;
  } else {
    pt[0] = u;
    pt[1] = v;
  }
  return pt;
}

function borrowPointList(pool: Point2D[][], index: number): Point2D[] {
  let list = pool[index];
  if (!list) {
    list = [];
    pool[index] = list;
  } else {
    list.length = 0;
  }
  return list;
}

/**
 * Computes the signed 2-D polygon area via the shoelace formula (same units squared as input).
 */
export function computeSignedPolygonArea(loop: readonly Point2D[]): number {
  const n = loop.length;
  if (n < 3) return 0;
  let twiceArea = 0;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const pj = loop[j]!;
    const pi = loop[i]!;
    twiceArea += pj[0] * pi[1] - pi[0] * pj[1];
  }
  return 0.5 * twiceArea;
}

/**
 * Builds a closed `ConvexHull` (from `three/addons/math/ConvexHull.js`) once at load time for a
 * helical valve spring's primitive geometries, returning both the `ConvexHull` instance and a flat
 * `Float32Array` of local-space triangle positions (metres) + local `Box3` bounds (§2.2, §4.2, §11.5).
 */
export function buildSpringConvexHull(
  geometries: readonly THREE.BufferGeometry[],
): SpringConvexHullCache {
  const points: THREE.Vector3[] = [];
  for (const geo of geometries) {
    const posAttr = geo.getAttribute('position');
    if (!posAttr) continue;
    const arr = posAttr.array as ArrayLike<number>;
    const itemSize = posAttr.itemSize;
    for (let i = 0; i < posAttr.count; i += 1) {
      const base = i * itemSize;
      points.push(new THREE.Vector3(arr[base]!, arr[base + 1]!, arr[base + 2]!));
    }
  }

  const hull = new ConvexHull().setFromPoints(points);
  const hullPositions = extractHullTrianglePositions(hull);
  const localBounds = new THREE.Box3();
  for (let i = 0; i + 2 < hullPositions.length; i += 3) {
    const x = hullPositions[i]!;
    const y = hullPositions[i + 1]!;
    const z = hullPositions[i + 2]!;
    if (x < localBounds.min.x) localBounds.min.x = x;
    if (y < localBounds.min.y) localBounds.min.y = y;
    if (z < localBounds.min.z) localBounds.min.z = z;
    if (x > localBounds.max.x) localBounds.max.x = x;
    if (y > localBounds.max.y) localBounds.max.y = y;
    if (z > localBounds.max.z) localBounds.max.z = z;
  }

  return {
    hull,
    hullPositions,
    triangleCount: hullPositions.length / 9,
    localBounds,
  };
}

function extractHullTrianglePositions(hull: ConvexHull): Float32Array {
  const faces = hull.faces;
  const coords: number[] = [];
  for (let f = 0; f < faces.length; f += 1) {
    const face = faces[f]!;
    const e0 = face.edge;
    if (!e0) continue;
    const p0 = e0.tail()?.point;
    let edge = e0.next;
    while (edge && edge.next && edge.next !== e0) {
      const p1 = edge.tail()?.point;
      const p2 = edge.head()?.point;
      if (p0 && p1 && p2) {
        coords.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
      edge = edge.next;
    }
  }
  return new Float32Array(coords);
}

/**
 * Tight typed-array triangle-plane intersection (§4.1, §4.3).
 *
 * `positions` is either a `THREE.BufferGeometry` or a flat vertex buffer `[x0, y0, z0, ...]` in
 * metres. When `options.matrixWorld` is provided, vertices are transformed into world metres inline;
 * plane-normal coordinates are evaluated first so non-crossing triangles skip `(u, v)` projection.
 *
 * Uses the half-open partition `kept: d <= +ε`, `clipped: d > +ε` (`ε = 1e-4 mm`), clamping
 * `|d| <= ε` to `0` at interpolation time so coplanar faces and tangent kept faces emit zero
 * segments while mesh edges/vertices lying directly on a cut boundary emit once without gaps.
 *
 * Appends `[u0Mm, v0Mm, u1Mm, v1Mm]` per crossing triangle to `outSegments` (X -> `(y, z)`, Y -> `(x, z)`).
 */
export function sliceMeshAtPlane(
  positions: Float32Array | Float64Array | THREE.BufferGeometry,
  plane: SectionSlicePlane,
  outSegments: number[],
  options?: SliceMeshOptions,
): number {
  let posArray: ArrayLike<number>;
  let indices: ArrayLike<number> | null | undefined = options?.indices;

  if (positions instanceof THREE.BufferGeometry) {
    const posAttr = positions.getAttribute('position');
    if (!posAttr) return 0;
    posArray = posAttr.array as ArrayLike<number>;
    if (indices === undefined) {
      indices = positions.getIndex()?.array ?? null;
    }
  } else {
    posArray = positions;
  }

  const isX = plane.mode === 'x';
  const pMm = plane.positionMm;
  const eps = SECTION_SLICE_EPSILON_MM;
  const mat = options?.matrixWorld ?? null;
  const startLen = outSegments.length;

  const triCount = indices ? Math.floor(indices.length / 3) : Math.floor(posArray.length / 9);
  if (triCount <= 0) return 0;

  if (mat !== null) {
    const me = mat.elements;
    const e0 = me[0]!;
    const e1 = me[1]!;
    const e2 = me[2]!;
    const e4 = me[4]!;
    const e5 = me[5]!;
    const e6 = me[6]!;
    const e8 = me[8]!;
    const e9 = me[9]!;
    const e10 = me[10]!;
    const e12 = me[12]!;
    const e13 = me[13]!;
    const e14 = me[14]!;

    // Row coefficients for the active plane-normal axis (X or Y) vs 2-D plane U axis (Y or X)
    const n0 = isX ? e0 : e1;
    const n1 = isX ? e4 : e5;
    const n2 = isX ? e8 : e9;
    const n3 = isX ? e12 : e13;

    const u0c = isX ? e1 : e0;
    const u1c = isX ? e5 : e4;
    const u2c = isX ? e9 : e8;
    const u3c = isX ? e13 : e12;

    for (let t = 0; t < triCount; t += 1) {
      let b0: number;
      let b1: number;
      let b2: number;
      if (indices) {
        const ti = t * 3;
        b0 = indices[ti]! * 3;
        b1 = indices[ti + 1]! * 3;
        b2 = indices[ti + 2]! * 3;
      } else {
        b0 = t * 9;
        b1 = b0 + 3;
        b2 = b0 + 6;
      }

      const lx0 = posArray[b0]!;
      const ly0 = posArray[b0 + 1]!;
      const lz0 = posArray[b0 + 2]!;
      const lx1 = posArray[b1]!;
      const ly1 = posArray[b1 + 1]!;
      const lz1 = posArray[b1 + 2]!;
      const lx2 = posArray[b2]!;
      const ly2 = posArray[b2 + 1]!;
      const lz2 = posArray[b2 + 2]!;

      let d0 = (n0 * lx0 + n1 * ly0 + n2 * lz0 + n3) * 1000 - pMm;
      let d1 = (n0 * lx1 + n1 * ly1 + n2 * lz1 + n3) * 1000 - pMm;
      let d2 = (n0 * lx2 + n1 * ly2 + n2 * lz2 + n3) * 1000 - pMm;

      if (Math.abs(d0) <= eps) d0 = 0;
      if (Math.abs(d1) <= eps) d1 = 0;
      if (Math.abs(d2) <= eps) d2 = 0;

      const k0 = d0 <= 0;
      const k1 = d1 <= 0;
      const k2 = d2 <= 0;
      if (k0 === k1 && k1 === k2) continue;

      const u0 = (u0c * lx0 + u1c * ly0 + u2c * lz0 + u3c) * 1000;
      const v0 = (e2 * lx0 + e6 * ly0 + e10 * lz0 + e14) * 1000;
      const u1 = (u0c * lx1 + u1c * ly1 + u2c * lz1 + u3c) * 1000;
      const v1 = (e2 * lx1 + e6 * ly1 + e10 * lz1 + e14) * 1000;
      const u2 = (u0c * lx2 + u1c * ly2 + u2c * lz2 + u3c) * 1000;
      const v2 = (e2 * lx2 + e6 * ly2 + e10 * lz2 + e14) * 1000;

      emitTriangleCrossing(d0, d1, d2, k0, k1, k2, u0, v0, u1, v1, u2, v2, outSegments);
    }
  } else {
    for (let t = 0; t < triCount; t += 1) {
      let b0: number;
      let b1: number;
      let b2: number;
      if (indices) {
        const ti = t * 3;
        b0 = indices[ti]! * 3;
        b1 = indices[ti + 1]! * 3;
        b2 = indices[ti + 2]! * 3;
      } else {
        b0 = t * 9;
        b1 = b0 + 3;
        b2 = b0 + 6;
      }

      const x0 = posArray[b0]! * 1000;
      const y0 = posArray[b0 + 1]! * 1000;
      const z0 = posArray[b0 + 2]! * 1000;
      const x1 = posArray[b1]! * 1000;
      const y1 = posArray[b1 + 1]! * 1000;
      const z1 = posArray[b1 + 2]! * 1000;
      const x2 = posArray[b2]! * 1000;
      const y2 = posArray[b2 + 1]! * 1000;
      const z2 = posArray[b2 + 2]! * 1000;

      let d0 = (isX ? x0 : y0) - pMm;
      let d1 = (isX ? x1 : y1) - pMm;
      let d2 = (isX ? x2 : y2) - pMm;

      if (Math.abs(d0) <= eps) d0 = 0;
      if (Math.abs(d1) <= eps) d1 = 0;
      if (Math.abs(d2) <= eps) d2 = 0;

      const k0 = d0 <= 0;
      const k1 = d1 <= 0;
      const k2 = d2 <= 0;
      if (k0 === k1 && k1 === k2) continue;

      const u0 = isX ? y0 : x0;
      const u1 = isX ? y1 : x1;
      const u2 = isX ? y2 : x2;

      emitTriangleCrossing(d0, d1, d2, k0, k1, k2, u0, z0, u1, z1, u2, z2, outSegments);
    }
  }

  return (outSegments.length - startLen) >>> 2;
}

function emitTriangleCrossing(
  d0: number,
  d1: number,
  d2: number,
  k0: boolean,
  k1: boolean,
  k2: boolean,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  outSegments: number[],
): void {
  let ds: number;
  let us: number;
  let vs: number;
  let da: number;
  let ua: number;
  let va: number;
  let db: number;
  let ub: number;
  let vb: number;

  if (k0 !== k1 && k0 !== k2) {
    ds = d0;
    us = u0;
    vs = v0;
    da = d1;
    ua = u1;
    va = v1;
    db = d2;
    ub = u2;
    vb = v2;
  } else if (k1 !== k0 && k1 !== k2) {
    ds = d1;
    us = u1;
    vs = v1;
    da = d0;
    ua = u0;
    va = v0;
    db = d2;
    ub = u2;
    vb = v2;
  } else {
    ds = d2;
    us = u2;
    vs = v2;
    da = d0;
    ua = u0;
    va = v0;
    db = d1;
    ub = u1;
    vb = v1;
  }

  const ta = ds === 0 ? 0 : da === 0 ? 1 : ds / (ds - da);
  const tb = ds === 0 ? 0 : db === 0 ? 1 : ds / (ds - db);

  const pu0 = us + ta * (ua - us);
  const pv0 = vs + ta * (va - vs);
  const pu1 = us + tb * (ub - us);
  const pv1 = vs + tb * (vb - vs);

  const du = pu1 - pu0;
  const dv = pv1 - pv0;
  if (du * du + dv * dv <= COINCIDENT_POINT_DIST_SQ_MM2) return;

  outSegments.push(pu0, pv0, pu1, pv1);
}

function weldKey(uMm: number, vMm: number): number | string {
  const qu = Math.round(uMm / SECTION_WELD_QUANTUM_MM);
  const qv = Math.round(vMm / SECTION_WELD_QUANTUM_MM);
  if (
    qu > -PACK_OFFSET &&
    qu < PACK_OFFSET &&
    qv > -PACK_OFFSET &&
    qv < PACK_OFFSET
  ) {
    return (qu + PACK_OFFSET) * PACK_STRIDE + (qv + PACK_OFFSET);
  }
  return `${qu},${qv}`;
}

/**
 * Quantised endpoint welding (`0.001 mm`), vertex-segment adjacency, and loop/chain tracing (§4.1, §4.3).
 *
 * Walks odd-degree endpoints first so open chains on non-watertight geometry are traced end-to-end,
 * then traces remaining closed loops. At T-junctions / shared mating vertices (`degree > 2`), picks
 * the unused outgoing segment whose direction has the largest dot product with the incoming travel
 * direction, recording `ambiguousJunctions`. Splits figure-8 sub-cycles into clean simple loops.
 */
export function weldAndTraceLoops(segments: ArrayLike<number>): TracedLoopsResult {
  return weldAndTraceLoopsInternal(segments, false);
}

function weldAndTraceLoopsInternal(
  segments: ArrayLike<number>,
  reusePools: boolean,
): TracedLoopsResult {
  const loopsOut: Point2D[][] = reusePools ? scratchTracedLoops : [];
  const openChainsOut: Point2D[][] = reusePools ? scratchTracedOpenChains : [];
  loopsOut.length = 0;
  openChainsOut.length = 0;

  const rawSegCount = Math.floor(segments.length / 4);
  if (rawSegCount === 0) {
    return { loops: loopsOut, openChains: openChainsOut, ambiguousJunctions: 0 };
  }

  weldKeyToVertexMap.clear();
  weldVertU.length = 0;
  weldVertV.length = 0;
  weldSegA.length = 0;
  weldSegB.length = 0;

  for (let s = 0; s < rawSegCount; s += 1) {
    const base = s * 4;
    const u0 = segments[base]!;
    const v0 = segments[base + 1]!;
    const u1 = segments[base + 2]!;
    const v1 = segments[base + 3]!;

    const k0 = weldKey(u0, v0);
    let id0 = weldKeyToVertexMap.get(k0);
    if (id0 === undefined) {
      id0 = weldVertU.length;
      weldKeyToVertexMap.set(k0, id0);
      weldVertU.push(u0);
      weldVertV.push(v0);
    }

    const k1 = weldKey(u1, v1);
    let id1 = weldKeyToVertexMap.get(k1);
    if (id1 === undefined) {
      id1 = weldVertU.length;
      weldKeyToVertexMap.set(k1, id1);
      weldVertU.push(u1);
      weldVertV.push(v1);
    }

    if (id0 === id1) continue;
    weldSegA.push(id0);
    weldSegB.push(id1);
  }

  const segCount = weldSegA.length;
  const vertCount = weldVertU.length;
  if (segCount === 0) {
    return { loops: loopsOut, openChains: openChainsOut, ambiguousJunctions: 0 };
  }

  for (let v = 0; v < vertCount; v += 1) {
    let bucket = weldAdjPool[v];
    if (!bucket) {
      bucket = [];
      weldAdjPool[v] = bucket;
    } else {
      bucket.length = 0;
    }
  }

  if (vertCount > weldUnusedDeg.length) {
    let cap = weldUnusedDeg.length;
    while (cap < vertCount) cap *= 2;
    weldUnusedDeg = new Int32Array(cap);
    weldVisitedPos = new Int32Array(cap).fill(-1);
  } else {
    weldUnusedDeg.fill(0, 0, vertCount);
    weldVisitedPos.fill(-1, 0, vertCount);
  }

  if (segCount > weldEdgeUsed.length) {
    let cap = weldEdgeUsed.length;
    while (cap < segCount) cap *= 2;
    weldEdgeUsed = new Uint8Array(cap);
  } else {
    weldEdgeUsed.fill(0, 0, segCount);
  }

  for (let e = 0; e < segCount; e += 1) {
    const a = weldSegA[e]!;
    const b = weldSegB[e]!;
    weldAdjPool[a]!.push(e);
    weldAdjPool[b]!.push(e);
    weldUnusedDeg[a] += 1;
    weldUnusedDeg[b] += 1;
  }

  let ambiguousJunctions = 0;
  let tupleCursor = 0;
  let listCursor = 0;

  const maxSteps = segCount + 2;

  const toPointList = (vIds: readonly number[], startIdx: number, endIdx: number): Point2D[] => {
    if (!reusePools) {
      const pts: Point2D[] = [];
      for (let i = startIdx; i < endIdx; i += 1) {
        const v = vIds[i]!;
        pts.push([weldVertU[v]!, weldVertV[v]!]);
      }
      return pts;
    }
    const pts = borrowPointList(pointListPool, listCursor);
    listCursor += 1;
    for (let i = startIdx; i < endIdx; i += 1) {
      const v = vIds[i]!;
      pts.push(borrowPointTuple(tupleCursor, weldVertU[v]!, weldVertV[v]!));
      tupleCursor += 1;
    }
    return pts;
  };

  const traceFrom = (startVert: number, firstEdge: number): void => {
    weldEdgeUsed[firstEdge] = 1;
    const nextStart = weldSegA[firstEdge] === startVert ? weldSegB[firstEdge]! : weldSegA[firstEdge]!;
    weldUnusedDeg[startVert] -= 1;
    weldUnusedDeg[nextStart] -= 1;

    weldWalkVerts.length = 0;
    weldWalkVerts.push(startVert, nextStart);
    weldVisitedPos[startVert] = 0;
    weldVisitedPos[nextStart] = 1;

    let prevVert = startVert;
    let currVert = nextStart;
    let steps = 1;
    let closed = false;

    while (steps < maxSteps) {
      const incEdges = weldAdjPool[currVert]!;
      const totalDeg = incEdges.length;
      let bestEdge = -1;

      if (totalDeg <= 2) {
        for (let i = 0; i < totalDeg; i += 1) {
          const cand = incEdges[i]!;
          if (weldEdgeUsed[cand] === 0) {
            bestEdge = cand;
            break;
          }
        }
      } else {
        let inU = weldVertU[currVert]! - weldVertU[prevVert]!;
        let inV = weldVertV[currVert]! - weldVertV[prevVert]!;
        const inLen = Math.hypot(inU, inV);
        if (inLen > 1e-12) {
          inU /= inLen;
          inV /= inLen;
        }

        let unusedChoices = 0;
        let bestDot = -Infinity;
        for (let i = 0; i < totalDeg; i += 1) {
          const cand = incEdges[i]!;
          if (weldEdgeUsed[cand] !== 0) continue;
          unusedChoices += 1;
          const other = weldSegA[cand] === currVert ? weldSegB[cand]! : weldSegA[cand]!;
          let outU = weldVertU[other]! - weldVertU[currVert]!;
          let outV = weldVertV[other]! - weldVertV[currVert]!;
          const outLen = Math.hypot(outU, outV);
          if (outLen > 1e-12) {
            outU /= outLen;
            outV /= outLen;
          }
          const dot = inU * outU + inV * outV;
          if (dot > bestDot) {
            bestDot = dot;
            bestEdge = cand;
          }
        }
        if (unusedChoices > 1) {
          ambiguousJunctions += 1;
        }
      }

      if (bestEdge === -1) {
        break;
      }

      weldEdgeUsed[bestEdge] = 1;
      const nextVert = weldSegA[bestEdge] === currVert ? weldSegB[bestEdge]! : weldSegA[bestEdge]!;
      weldUnusedDeg[currVert] -= 1;
      weldUnusedDeg[nextVert] -= 1;
      steps += 1;

      const existingIdx = weldVisitedPos[nextVert]!;
      if (existingIdx === 0) {
        closed = true;
        break;
      }

      if (existingIdx > 0) {
        // Figure-8 / intermediate sub-loop revisit: peel off the closed sub-cycle cleanly
        const subLen = weldWalkVerts.length - existingIdx;
        if (subLen >= 3) {
          loopsOut.push(toPointList(weldWalkVerts, existingIdx, weldWalkVerts.length));
        }
        for (let k = existingIdx + 1; k < weldWalkVerts.length; k += 1) {
          weldVisitedPos[weldWalkVerts[k]!] = -1;
        }
        weldWalkVerts.length = existingIdx + 1;
        currVert = nextVert;
        prevVert = weldWalkVerts[existingIdx - 1]!;
        continue;
      }

      prevVert = currVert;
      currVert = nextVert;
      weldVisitedPos[currVert] = weldWalkVerts.length;
      weldWalkVerts.push(currVert);
    }

    if (closed) {
      if (weldWalkVerts.length >= 3) {
        loopsOut.push(toPointList(weldWalkVerts, 0, weldWalkVerts.length));
      }
    } else if (weldWalkVerts.length >= 2) {
      openChainsOut.push(toPointList(weldWalkVerts, 0, weldWalkVerts.length));
    }

    for (let i = 0; i < weldWalkVerts.length; i += 1) {
      weldVisitedPos[weldWalkVerts[i]!] = -1;
    }
  };

  // Pass 1: start at odd-degree vertices (degree 1 first, then higher odd degrees) so open chains
  // on non-watertight geometry trace from endpoint to endpoint without splitting mid-chain.
  for (let pass = 0; pass < 2; pass += 1) {
    for (let v = 0; v < vertCount; v += 1) {
      while (
        weldUnusedDeg[v]! > 0 &&
        (pass === 0 ? weldUnusedDeg[v] === 1 : (weldUnusedDeg[v]! & 1) === 1)
      ) {
        const inc = weldAdjPool[v]!;
        let firstUnused = -1;
        for (let i = 0; i < inc.length; i += 1) {
          if (weldEdgeUsed[inc[i]!] === 0) {
            firstUnused = inc[i]!;
            break;
          }
        }
        if (firstUnused === -1) break;
        traceFrom(v, firstUnused);
      }
    }
  }

  // Pass 2: trace all remaining closed cycles (every remaining vertex now has even unused degree).
  for (let e = 0; e < segCount; e += 1) {
    if (weldEdgeUsed[e] === 0) {
      traceFrom(weldSegA[e]!, e);
    }
  }

  return { loops: loopsOut, openChains: openChainsOut, ambiguousJunctions };
}

function pointToSegmentDistSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq <= 1e-16) {
    return apx * apx + apy * apy;
  }
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / lenSq));
  const dx = apx - t * abx;
  const dy = apy - t * aby;
  return dx * dx + dy * dy;
}

function pointStrictlyInPolygon(px: number, py: number, poly: readonly Point2D[]): boolean {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const xi = poly[i]![0];
    const yi = poly[i]![1];
    const xj = poly[j]![0];
    const yj = poly[j]![1];

    if (pointToSegmentDistSq(px, py, xj, yj, xi, yi) <= 1e-10) {
      return false;
    }

    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function isLoopContainedInLoop(child: readonly Point2D[], parent: readonly Point2D[]): boolean {
  let hasStrictInside = false;
  for (let i = 0; i < child.length; i += 1) {
    const pt = child[i]!;
    let onParentBoundary = false;
    for (let k = 0, m = parent.length - 1; k < parent.length; m = k, k += 1) {
      if (
        pointToSegmentDistSq(pt[0], pt[1], parent[m]![0], parent[m]![1], parent[k]![0], parent[k]![1]) <=
        1e-8
      ) {
        onParentBoundary = true;
        break;
      }
    }
    if (!onParentBoundary) {
      if (!pointStrictlyInPolygon(pt[0], pt[1], parent)) {
        return false;
      }
      hasStrictInside = true;
    }
  }

  if (hasStrictInside) {
    return true;
  }

  // All vertices touched parent boundary; probe edge midpoints
  for (let i = 0; i < child.length; i += 1) {
    const a = child[i]!;
    const b = child[(i + 1) % child.length]!;
    const mx = 0.5 * (a[0] + b[0]);
    const my = 0.5 * (a[1] + b[1]);
    let midOnBoundary = false;
    for (let k = 0, m = parent.length - 1; k < parent.length; m = k, k += 1) {
      if (
        pointToSegmentDistSq(mx, my, parent[m]![0], parent[m]![1], parent[k]![0], parent[k]![1]) <=
        1e-8
      ) {
        midOnBoundary = true;
        break;
      }
    }
    if (!midOnBoundary) {
      if (!pointStrictlyInPolygon(mx, my, parent)) {
        return false;
      }
      hasStrictInside = true;
    }
  }
  return hasStrictInside;
}

/**
 * Classifies arbitrary-winding closed loops into outer/hole groups via even-odd containment depth
 * and assigns each odd-depth hole to its immediate containing outer loop (smallest containing area,
 * §4.1, §4.3).
 */
export function classifyLoops(loops: readonly (readonly Point2D[])[]): ClassifiedLoopsResult {
  const count = loops.length;
  if (count === 0) {
    return { groups: [], depths: [], parentByLoop: [] };
  }

  const groupsScratch = classifyLoopsInternal(loops, false);
  const groups: ClassifiedLoopGroup[] = new Array(groupsScratch.length);
  for (let g = 0; g < groupsScratch.length; g += 1) {
    const src = groupsScratch[g]!;
    groups[g] = {
      outerIndex: src.outerIndex,
      outer: src.outer.slice(),
      holeIndices: src.holeIndices.slice(),
      holes: src.holes.map((h) => h.slice()),
    };
  }
  return {
    groups,
    depths: classifyDepthsScratch.slice(0, count),
    parentByLoop: classifyParentsScratch.slice(0, count),
  };
}

function classifyLoopsInternal(
  loops: readonly (readonly Point2D[])[],
  alreadyStripped: boolean,
): readonly ClassifiedLoopGroup[] {
  const count = loops.length;
  scratchClassifiedGroups.length = 0;
  if (count === 0) {
    return scratchClassifiedGroups;
  }

  if (count > classifyAbsAreas.length) {
    let cap = classifyAbsAreas.length;
    while (cap < count) cap *= 2;
    classifyAbsAreas = new Float64Array(cap);
    classifyMinU = new Float64Array(cap);
    classifyMinV = new Float64Array(cap);
    classifyMaxU = new Float64Array(cap);
    classifyMaxV = new Float64Array(cap);
    classifyGroupIdxByLoop = new Int32Array(cap);
  }

  classifyDepthsScratch.length = count;
  classifyParentsScratch.length = count;

  for (let i = 0; i < count; i += 1) {
    const src = alreadyStripped
      ? (loops[i] as Point2D[])
      : stripClosingDuplicateInto(loops[i]!, borrowPointList(classifyCleanedPool, i));
    if (alreadyStripped) {
      classifyCleanedPool[i] = src;
    }
    classifyAbsAreas[i] = Math.abs(computeSignedPolygonArea(src));
    let loU = Infinity;
    let loV = Infinity;
    let hiU = -Infinity;
    let hiV = -Infinity;
    for (let k = 0; k < src.length; k += 1) {
      const p = src[k]!;
      if (p[0] < loU) loU = p[0];
      if (p[1] < loV) loV = p[1];
      if (p[0] > hiU) hiU = p[0];
      if (p[1] > hiV) hiV = p[1];
    }
    classifyMinU[i] = loU;
    classifyMinV[i] = loV;
    classifyMaxU[i] = hiU;
    classifyMaxV[i] = hiV;
    classifyDepthsScratch[i] = 0;
    classifyParentsScratch[i] = -1;
    classifyGroupIdxByLoop[i] = -1;
  }

  for (let i = 0; i < count; i += 1) {
    const polyI = classifyCleanedPool[i]!;
    if (polyI.length < 3 || classifyAbsAreas[i]! <= MIN_LOOP_AREA_MM2) continue;
    let depth = 0;
    let immediateParent = -1;
    let immediateParentArea = Infinity;

    for (let j = 0; j < count; j += 1) {
      if (i === j) continue;
      const candArea = classifyAbsAreas[j]!;
      if (candArea <= classifyAbsAreas[i]! + MIN_LOOP_AREA_MM2) continue;
      if (
        classifyMinU[j]! > classifyMinU[i]! + 1e-3 ||
        classifyMaxU[j]! < classifyMaxU[i]! - 1e-3 ||
        classifyMinV[j]! > classifyMinV[i]! + 1e-3 ||
        classifyMaxV[j]! < classifyMaxV[i]! - 1e-3
      ) {
        continue;
      }
      if (isLoopContainedInLoop(polyI, classifyCleanedPool[j]!)) {
        depth += 1;
        if (candArea < immediateParentArea) {
          immediateParentArea = candArea;
          immediateParent = j;
        }
      }
    }

    classifyDepthsScratch[i] = depth;
    classifyParentsScratch[i] = immediateParent;
  }

  let groupCursor = 0;
  for (let i = 0; i < count; i += 1) {
    const polyI = classifyCleanedPool[i]!;
    if (polyI.length < 3 || classifyAbsAreas[i]! <= MIN_LOOP_AREA_MM2) continue;
    if ((classifyDepthsScratch[i]! & 1) === 0) {
      let group = classifyGroupPool[groupCursor];
      if (!group) {
        group = {
          outerIndex: i,
          outer: polyI,
          holeIndices: [],
          holes: [],
        };
        classifyGroupPool[groupCursor] = group;
      } else {
        group.outerIndex = i;
        group.outer = polyI;
        group.holeIndices.length = 0;
        group.holes.length = 0;
      }
      classifyGroupIdxByLoop[i] = groupCursor;
      scratchClassifiedGroups.push(group);
      groupCursor += 1;
    }
  }

  for (let i = 0; i < count; i += 1) {
    const polyI = classifyCleanedPool[i]!;
    if (polyI.length < 3 || classifyAbsAreas[i]! <= MIN_LOOP_AREA_MM2) continue;
    if ((classifyDepthsScratch[i]! & 1) === 1) {
      const parentIdx = classifyParentsScratch[i]!;
      if (parentIdx >= 0) {
        const gIdx = classifyGroupIdxByLoop[parentIdx]!;
        if (gIdx >= 0) {
          const group = classifyGroupPool[gIdx]!;
          group.holeIndices.push(i);
          group.holes.push(polyI);
        }
      }
    }
  }

  return scratchClassifiedGroups;
}

function stripClosingDuplicateInto(pts: readonly Point2D[], out: Point2D[]): Point2D[] {
  out.length = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i]!;
    if (out.length > 0) {
      const prev = out[out.length - 1]!;
      const du = p[0] - prev[0];
      const dv = p[1] - prev[1];
      if (du * du + dv * dv <= COINCIDENT_POINT_DIST_SQ_MM2) continue;
    }
    out.push(p);
  }
  while (out.length >= 2) {
    const first = out[0]!;
    const last = out[out.length - 1]!;
    const du = last[0] - first[0];
    const dv = last[1] - first[1];
    if (du * du + dv * dv <= COINCIDENT_POINT_DIST_SQ_MM2) {
      out.pop();
    } else {
      break;
    }
  }
  return out;
}

function stripClosingDuplicate(pts: readonly Point2D[]): Point2D[] {
  return stripClosingDuplicateInto(pts, []);
}

function orient2d(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function onSegment2d(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  px: number,
  py: number,
): boolean {
  const eps = 1e-7;
  return (
    px >= Math.min(ax, bx) - eps &&
    px <= Math.max(ax, bx) + eps &&
    py >= Math.min(ay, by) - eps &&
    py <= Math.max(ay, by) + eps
  );
}

function segmentsIntersect2d(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const o1 = orient2d(ax, ay, bx, by, cx, cy);
  const o2 = orient2d(ax, ay, bx, by, dx, dy);
  const o3 = orient2d(cx, cy, dx, dy, ax, ay);
  const o4 = orient2d(cx, cy, dx, dy, bx, by);
  const eps = 1e-9;

  if (((o1 > eps && o2 < -eps) || (o1 < -eps && o2 > eps)) &&
      ((o3 > eps && o4 < -eps) || (o3 < -eps && o4 > eps))) {
    return true;
  }
  if (Math.abs(o1) <= eps && onSegment2d(ax, ay, bx, by, cx, cy)) return true;
  if (Math.abs(o2) <= eps && onSegment2d(ax, ay, bx, by, dx, dy)) return true;
  if (Math.abs(o3) <= eps && onSegment2d(cx, cy, dx, dy, ax, ay)) return true;
  if (Math.abs(o4) <= eps && onSegment2d(cx, cy, dx, dy, bx, by)) return true;
  return false;
}

/**
 * Checks whether closing an open chain with a single chord produces a strictly simple polygon
 * (`>= 3` vertices, finite nonzero area, no non-adjacent edge intersections, §4.3).
 */
export function isSimplePolygon(rawLoop: readonly Point2D[]): boolean {
  const poly = stripClosingDuplicateInto(rawLoop, scratchSimplePoly);
  const n = poly.length;
  if (n < 3) return false;
  if (Math.abs(computeSignedPolygonArea(poly)) <= MIN_LOOP_AREA_MM2) return false;

  for (let i = 0; i < n; i += 1) {
    const a = poly[i]!;
    const b = poly[(i + 1) % n]!;
    for (let j = i + 2; j < n; j += 1) {
      if (i === 0 && j === n - 1) continue; // adjacent across closing chord
      const c = poly[j]!;
      const d = poly[(j + 1) % n]!;
      if (segmentsIntersect2d(a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1])) {
        return false;
      }
    }
  }
  return true;
}

function runShapeUtilsTriangulate(
  cleanOuter: readonly Point2D[],
  cleanHoles: readonly (readonly Point2D[])[],
): number[][] {
  let poolCursor = 0;
  scratchContourVec2.length = 0;
  for (let i = 0; i < cleanOuter.length; i += 1) {
    const pt = cleanOuter[i]!;
    scratchContourVec2.push(borrowVec2(poolCursor, pt[0], pt[1]));
    poolCursor += 1;
  }

  scratchHoleArrays.length = 0;
  for (let h = 0; h < cleanHoles.length; h += 1) {
    const hole = cleanHoles[h]!;
    let holeVecs = holeVec2SubArrayPool[h];
    if (!holeVecs) {
      holeVecs = [];
      holeVec2SubArrayPool[h] = holeVecs;
    } else {
      holeVecs.length = 0;
    }
    for (let i = 0; i < hole.length; i += 1) {
      const pt = hole[i]!;
      holeVecs.push(borrowVec2(poolCursor, pt[0], pt[1]));
      poolCursor += 1;
    }
    scratchHoleArrays.push(holeVecs);
  }

  return THREE.ShapeUtils.triangulateShape(scratchContourVec2, scratchHoleArrays);
}

/**
 * Triangulates one outer contour + optional interior holes via `THREE.ShapeUtils.triangulateShape`
 * (Three.js's built-in Earcut wrapper, converting `Point2D` rings into pooled `THREE.Vector2[]`
 * arrays because `ShapeUtils.triangulateShape` invokes `Vector2.equals`, §4.1, §11.5).
 */
export function triangulateLoops(
  outer: readonly Point2D[],
  holes: readonly (readonly Point2D[])[] = [],
): TriangulatedLoopsResult {
  const cleanOuter = stripClosingDuplicate(outer);
  if (cleanOuter.length < 3) {
    return { triangles: [], vertices: [] };
  }

  const cleanHoles: Point2D[][] = [];
  for (let h = 0; h < holes.length; h += 1) {
    const cleaned = stripClosingDuplicate(holes[h]!);
    if (cleaned.length >= 3) {
      cleanHoles.push(cleaned);
    }
  }

  const vertices: Point2D[] = [...cleanOuter];
  for (let h = 0; h < cleanHoles.length; h += 1) {
    vertices.push(...cleanHoles[h]!);
  }

  const triangles = runShapeUtilsTriangulate(cleanOuter, cleanHoles);
  return { triangles, vertices };
}

/**
 * Creates the shared unlit hatched section-cap `THREE.ShaderMaterial` (§2.3, §4.4, §11.5):
 * - Cut-bronze linear base `[0.290, 0.170, 0.086]` + 45° hatch `[0.196, 0.112, 0.055]`
 * - 5.0 mm perpendicular spacing, 1/3 duty, softened stripe transition
 * - Tone-mapped (`#include <tonemapping_fragment>`) and colour-space converted
 *   (`#include <colorspace_fragment>`), unlit, non-fogged (`fog: false`), `DoubleSide`,
 *   `depthWrite = true`, `depthTest = true`.
 */
export function createCapMaterial(): THREE.ShaderMaterial {
  const material = new THREE.ShaderMaterial({
    name: 'section_cap_material',
    uniforms: {
      uBaseColor: {
        value: new THREE.Vector3(
          SECTION_CAP_COLOR_LINEAR[0],
          SECTION_CAP_COLOR_LINEAR[1],
          SECTION_CAP_COLOR_LINEAR[2],
        ),
      },
      uHatchColor: {
        value: new THREE.Vector3(
          SECTION_CAP_HATCH_COLOR_LINEAR[0],
          SECTION_CAP_HATCH_COLOR_LINEAR[1],
          SECTION_CAP_HATCH_COLOR_LINEAR[2],
        ),
      },
      uHatchSpacingMm: { value: SECTION_CAP_HATCH_SPACING_MM },
      uHatchDuty: { value: SECTION_CAP_HATCH_DUTY },
    },
    vertexShader: /* glsl */ `
      attribute vec2 sectionUV;
      varying vec2 vSectionUV;

      void main() {
        vSectionUV = sectionUV;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBaseColor;
      uniform vec3 uHatchColor;
      uniform float uHatchSpacingMm;
      uniform float uHatchDuty;
      varying vec2 vSectionUV;

      void main() {
        float d = (vSectionUV.x + vSectionUV.y) * 0.70710678;
        float normalizedCoord = d / uHatchSpacingMm;
        float halfDuty = 0.5 * uHatchDuty;
        float centeredPhase = fract(normalizedCoord - halfDuty + 0.5) - 0.5;
        float fw = fwidth(normalizedCoord);
        float halfSoft = max(0.01, 0.5 * min(fw, 0.45));
        float rawMask = 1.0 - smoothstep(halfDuty - halfSoft, halfDuty + halfSoft, abs(centeredPhase));
        float subpixelFade = smoothstep(0.45, 0.95, fw);
        float mask = mix(rawMask, uHatchDuty, subpixelFade);
        vec3 colour = mix(uBaseColor, uHatchColor, mask);
        gl_FragColor = vec4(colour, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
    depthWrite: true,
    depthTest: true,
    transparent: false,
    fog: false,
    toneMapped: true,
  });

  material.depthWrite = true;
  material.depthTest = true;
  return material;
}

/**
 * Allocates a reusable `CapBuildTarget` (`BufferGeometry` + pre-allocated `position` and `sectionUV`
 * `Float32Array` attributes) for a static or dynamic cap `Mesh` (§4.5).
 */
export function createCapBuildTarget(
  initialMaxTriangles = INITIAL_WORKING_TRIANGLES,
): CapBuildTarget & { readonly geometry: THREE.BufferGeometry } {
  const maxVerts = Math.max(3, initialMaxTriangles * 3);
  const positions = new Float32Array(maxVerts * 3);
  const sectionUV = new Float32Array(maxVerts * 2);
  const geometry = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  const uvAttr = new THREE.BufferAttribute(sectionUV, 2);
  uvAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', posAttr);
  geometry.setAttribute('sectionUV', uvAttr);
  geometry.setDrawRange(0, 0);
  return { geometry, positions, sectionUV };
}

function ensureTargetCapacity(target: CapBuildTarget, requiredTriangles: number): void {
  const currentMaxTris = Math.floor(target.positions.length / 9);
  if (requiredTriangles <= currentMaxTris) return;

  let nextMaxTris = Math.max(INITIAL_WORKING_TRIANGLES, currentMaxTris);
  while (nextMaxTris < requiredTriangles) {
    nextMaxTris *= 2;
  }
  const nextVerts = nextMaxTris * 3;
  const nextPositions = new Float32Array(nextVerts * 3);
  nextPositions.set(target.positions);
  const nextUV = new Float32Array(nextVerts * 2);
  nextUV.set(target.sectionUV);

  target.positions = nextPositions;
  target.sectionUV = nextUV;

  if (target.geometry) {
    const posAttr = new THREE.BufferAttribute(nextPositions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    const uvAttr = new THREE.BufferAttribute(nextUV, 2);
    uvAttr.setUsage(THREE.DynamicDrawUsage);
    target.geometry.setAttribute('position', posAttr);
    target.geometry.setAttribute('sectionUV', uvAttr);
  }
}

function isObjectAndAncestorsVisible(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur !== null) {
    if (!cur.visible) return false;
    cur = cur.parent;
  }
  return true;
}

function isSourceGhosted(obj: THREE.Object3D): boolean {
  if (obj instanceof THREE.Mesh) {
    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    return Boolean(mat && mat.transparent && !mat.depthWrite);
  }
  let foundGhosted = false;
  obj.traverse((child) => {
    if (foundGhosted || !(child instanceof THREE.Mesh)) return;
    const mat = Array.isArray(child.material) ? child.material[0] : child.material;
    if (mat && mat.transparent && !mat.depthWrite) {
      foundGhosted = true;
    }
  });
  return foundGhosted;
}

function getOrBuildChildMeshEntries(root: THREE.Object3D): ChildMeshEntry[] {
  const cached = childEntriesCache.get(root);
  if (cached) return cached;

  root.updateWorldMatrix(true, true);
  scratchInvRootMatrix.copy(root.matrixWorld).invert();

  const entries: ChildMeshEntry[] = [];
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geo = child.geometry as THREE.BufferGeometry;
    if (!geo.boundingBox) {
      geo.computeBoundingBox();
    }
    if (!geo.boundingSphere) {
      geo.computeBoundingSphere();
    }
    let relMat: THREE.Matrix4 | null = null;
    if (child !== root) {
      const m = new THREE.Matrix4().multiplyMatrices(scratchInvRootMatrix, child.matrixWorld);
      if (!isIdentityMatrix4(m)) {
        relMat = m;
      }
    }
    entries.push({ geometry: geo, relativeMatrix: relMat });
  });

  childEntriesCache.set(root, entries);
  return entries;
}

function isIdentityMatrix4(m: THREE.Matrix4): boolean {
  const e = m.elements;
  return (
    Math.abs(e[0]! - 1) < 1e-7 &&
    Math.abs(e[5]! - 1) < 1e-7 &&
    Math.abs(e[10]! - 1) < 1e-7 &&
    Math.abs(e[15]! - 1) < 1e-7 &&
    Math.abs(e[1]!) < 1e-7 &&
    Math.abs(e[2]!) < 1e-7 &&
    Math.abs(e[3]!) < 1e-7 &&
    Math.abs(e[4]!) < 1e-7 &&
    Math.abs(e[6]!) < 1e-7 &&
    Math.abs(e[7]!) < 1e-7 &&
    Math.abs(e[8]!) < 1e-7 &&
    Math.abs(e[9]!) < 1e-7 &&
    Math.abs(e[11]!) < 1e-7 &&
    Math.abs(e[12]!) < 1e-7 &&
    Math.abs(e[13]!) < 1e-7 &&
    Math.abs(e[14]!) < 1e-7
  );
}

const singleGeometryComponentsCache = new WeakMap<THREE.BufferGeometry, SourceComponentCache[]>();
const INV_COMPONENT_WELD_QUANTUM_M = 100_000; // 1 / 1e-5 m
const scratchChildPos = new THREE.Vector3();

function nextPowerOfTwo(v: number): number {
  let p = 64;
  while (p < v) {
    p *= 2;
  }
  return p;
}

function buildPositionWeldedComponents(
  entries: readonly { geometry: THREE.BufferGeometry; relativeMatrix: THREE.Matrix4 | null }[],
): SourceComponentCache[] {
  if (entries.length === 1 && entries[0]!.relativeMatrix === null) {
    const cached = singleGeometryComponentsCache.get(entries[0]!.geometry);
    if (cached) return cached;
  }

  let estimatedTris = 0;
  for (let e = 0; e < entries.length; e += 1) {
    const geo = entries[e]!.geometry;
    const posAttr = geo.getAttribute('position');
    if (!posAttr) continue;
    const idx = geo.getIndex();
    estimatedTris += idx ? Math.floor(idx.count / 3) : Math.floor(posAttr.count / 3);
  }
  if (estimatedTris === 0) {
    return [];
  }

  const hashCap = nextPowerOfTwo(estimatedTris * 6);
  const hashMask = hashCap - 1;
  const slotVid = new Int32Array(hashCap).fill(-1);
  const slotKX = new Int32Array(hashCap);
  const slotKY = new Int32Array(hashCap);
  const slotKZ = new Int32Array(hashCap);
  let nextVertId = 0;

  const getVertId = (x: number, y: number, z: number): number => {
    const kx = Math.round(x * INV_COMPONENT_WELD_QUANTUM_M) | 0;
    const ky = Math.round(y * INV_COMPONENT_WELD_QUANTUM_M) | 0;
    const kz = Math.round(z * INV_COMPONENT_WELD_QUANTUM_M) | 0;
    let h =
      (Math.imul(kx, 73856093) ^ Math.imul(ky, 19349663) ^ Math.imul(kz, 83492791)) & hashMask;
    while (true) {
      const existing = slotVid[h]!;
      if (existing === -1) {
        const id = nextVertId;
        nextVertId += 1;
        slotVid[h] = id;
        slotKX[h] = kx;
        slotKY[h] = ky;
        slotKZ[h] = kz;
        return id;
      }
      if (slotKX[h] === kx && slotKY[h] === ky && slotKZ[h] === kz) {
        return existing;
      }
      h = (h + 1) & hashMask;
    }
  };

  const allCoords = new Float32Array(estimatedTris * 9);
  const triVids = new Int32Array(estimatedTris * 3);
  let writtenTris = 0;

  for (let e = 0; e < entries.length; e += 1) {
    const { geometry, relativeMatrix } = entries[e]!;
    const posAttr = geometry.getAttribute('position');
    if (!posAttr) continue;
    const pos = posAttr.array as ArrayLike<number>;
    const idx = geometry.getIndex()?.array ?? null;
    const itemSize = posAttr.itemSize;
    const triCount = idx ? Math.floor(idx.length / 3) : Math.floor(posAttr.count / 3);

    for (let t = 0; t < triCount; t += 1) {
      const i0 = idx ? idx[t * 3]! : t * 3;
      const i1 = idx ? idx[t * 3 + 1]! : t * 3 + 1;
      const i2 = idx ? idx[t * 3 + 2]! : t * 3 + 2;

      let x0 = pos[i0 * itemSize]!;
      let y0 = pos[i0 * itemSize + 1]!;
      let z0 = pos[i0 * itemSize + 2]!;
      let x1 = pos[i1 * itemSize]!;
      let y1 = pos[i1 * itemSize + 1]!;
      let z1 = pos[i1 * itemSize + 2]!;
      let x2 = pos[i2 * itemSize]!;
      let y2 = pos[i2 * itemSize + 1]!;
      let z2 = pos[i2 * itemSize + 2]!;

      if (relativeMatrix) {
        scratchChildPos.set(x0, y0, z0).applyMatrix4(relativeMatrix);
        x0 = scratchChildPos.x;
        y0 = scratchChildPos.y;
        z0 = scratchChildPos.z;
        scratchChildPos.set(x1, y1, z1).applyMatrix4(relativeMatrix);
        x1 = scratchChildPos.x;
        y1 = scratchChildPos.y;
        z1 = scratchChildPos.z;
        scratchChildPos.set(x2, y2, z2).applyMatrix4(relativeMatrix);
        x2 = scratchChildPos.x;
        y2 = scratchChildPos.y;
        z2 = scratchChildPos.z;
      }

      const cBase = writtenTris * 9;
      allCoords[cBase] = x0;
      allCoords[cBase + 1] = y0;
      allCoords[cBase + 2] = z0;
      allCoords[cBase + 3] = x1;
      allCoords[cBase + 4] = y1;
      allCoords[cBase + 5] = z1;
      allCoords[cBase + 6] = x2;
      allCoords[cBase + 7] = y2;
      allCoords[cBase + 8] = z2;

      const vBase = writtenTris * 3;
      triVids[vBase] = getVertId(x0, y0, z0);
      triVids[vBase + 1] = getVertId(x1, y1, z1);
      triVids[vBase + 2] = getVertId(x2, y2, z2);
      writtenTris += 1;
    }
  }

  const totalTris = writtenTris;
  if (totalTris === 0) {
    return [];
  }

  const parent = new Int32Array(nextVertId);
  for (let i = 0; i < nextVertId; i += 1) {
    parent[i] = i;
  }
  const find = (v: number): number => {
    let cur = v;
    while (parent[cur]! !== cur) {
      parent[cur] = parent[parent[cur]!]!;
      cur = parent[cur]!;
    }
    return cur;
  };
  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent[ra] = rb;
    }
  };

  for (let t = 0; t < totalTris; t += 1) {
    const base = t * 3;
    union(triVids[base]!, triVids[base + 1]!);
    union(triVids[base + 1]!, triVids[base + 2]!);
  }

  const compTris = new Map<number, number[]>();
  for (let t = 0; t < totalTris; t += 1) {
    const root = find(triVids[t * 3]!);
    let list = compTris.get(root);
    if (!list) {
      list = [];
      compTris.set(root, list);
    }
    list.push(t);
  }

  const components: SourceComponentCache[] = [];
  for (const tris of compTris.values()) {
    const positions = new Float32Array(tris.length * 9);
    const bounds = new THREE.Box3();
    for (let i = 0; i < tris.length; i += 1) {
      const srcBase = tris[i]! * 9;
      const dstBase = i * 9;
      for (let k = 0; k < 3; k += 1) {
        const x = allCoords[srcBase + k * 3]!;
        const y = allCoords[srcBase + k * 3 + 1]!;
        const z = allCoords[srcBase + k * 3 + 2]!;
        positions[dstBase + k * 3] = x;
        positions[dstBase + k * 3 + 1] = y;
        positions[dstBase + k * 3 + 2] = z;
        if (x < bounds.min.x) bounds.min.x = x;
        if (y < bounds.min.y) bounds.min.y = y;
        if (z < bounds.min.z) bounds.min.z = z;
        if (x > bounds.max.x) bounds.max.x = x;
        if (y > bounds.max.y) bounds.max.y = y;
        if (z > bounds.max.z) bounds.max.z = z;
      }
    }
    components.push({ positions, bounds, relativeMatrix: null });
  }

  if (entries.length === 1 && entries[0]!.relativeMatrix === null) {
    singleGeometryComponentsCache.set(entries[0]!.geometry, components);
  }
  return components;
}

export function prepareCapSource(source: CapSource): CapSource {
  ensureSourceCaches(source);
  return source;
}

function ensureSourceCaches(source: CapSource): void {
  if (source.hullOnly) {
    if (!source.hullPositions && source.cachedHull) {
      source.hullPositions = extractHullTrianglePositions(source.cachedHull);
    }
    if (!source.localBounds && source.hullPositions) {
      const box = new THREE.Box3();
      const hp = source.hullPositions;
      for (let i = 0; i + 2 < hp.length; i += 3) {
        const x = hp[i]!;
        const y = hp[i + 1]!;
        const z = hp[i + 2]!;
        if (x < box.min.x) box.min.x = x;
        if (y < box.min.y) box.min.y = y;
        if (z < box.min.z) box.min.z = z;
        if (x > box.max.x) box.max.x = x;
        if (y > box.max.y) box.max.y = y;
        if (z > box.max.z) box.max.z = z;
      }
      source.localBounds = box;
    }
    return;
  }

  if (source.localBounds && source.components) return;

  const box = new THREE.Box3();
  let maxRadius = 0;
  let entries: { geometry: THREE.BufferGeometry; relativeMatrix: THREE.Matrix4 | null }[] = [];

  if (source.geometries && source.geometries.length > 0) {
    for (const geo of source.geometries) {
      if (!geo.boundingBox) geo.computeBoundingBox();
      if (!geo.boundingSphere) geo.computeBoundingSphere();
      if (geo.boundingBox) box.union(geo.boundingBox);
      if (geo.boundingSphere && geo.boundingSphere.radius > maxRadius) {
        maxRadius = geo.boundingSphere.radius;
      }
      entries.push({ geometry: geo, relativeMatrix: null });
    }
  } else if (source.object3D instanceof THREE.Mesh) {
    const geo = source.object3D.geometry as THREE.BufferGeometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    if (!geo.boundingSphere) geo.computeBoundingSphere();
    if (geo.boundingBox) box.copy(geo.boundingBox);
    if (geo.boundingSphere) maxRadius = geo.boundingSphere.radius;
    entries = [{ geometry: geo, relativeMatrix: null }];
  } else {
    const childEntries = getOrBuildChildMeshEntries(source.object3D);
    entries = childEntries;
    for (const entry of childEntries) {
      if (!entry.geometry.boundingBox) entry.geometry.computeBoundingBox();
      if (entry.geometry.boundingBox) {
        scratchTempBox.copy(entry.geometry.boundingBox);
        if (entry.relativeMatrix) {
          scratchTempBox.applyMatrix4(entry.relativeMatrix);
        }
        box.union(scratchTempBox);
      }
    }
  }

  source.components = buildPositionWeldedComponents(entries);
  source.localBounds = box;
  if (source.boundingSphereRadius === undefined) {
    source.boundingSphereRadius = maxRadius;
  }
}

/**
 * Exact O(1) world-axis interval test of a local `Box3` under affine transform `matrixWorld`:
 * returns `true` iff the transformed AABB crosses the half-open cut boundary `coord == positionMm`
 * (`minMm <= p + ε` and `maxMm > p + ε`, §4.5).
 */
function boundsCrossPlane(
  bounds: THREE.Box3,
  matrixWorld: THREE.Matrix4,
  isX: boolean,
  positionMm: number,
): boolean {
  if (bounds.isEmpty()) return false;
  const me = matrixWorld.elements;
  const row = isX ? 0 : 1;
  const r0 = me[row]!;
  const r1 = me[row + 4]!;
  const r2 = me[row + 8]!;
  const t = me[row + 12]!;

  const minX = bounds.min.x;
  const minY = bounds.min.y;
  const minZ = bounds.min.z;
  const maxX = bounds.max.x;
  const maxY = bounds.max.y;
  const maxZ = bounds.max.z;

  const aMin = r0 >= 0 ? r0 * minX : r0 * maxX;
  const aMax = r0 >= 0 ? r0 * maxX : r0 * minX;
  const bMin = r1 >= 0 ? r1 * minY : r1 * maxY;
  const bMax = r1 >= 0 ? r1 * maxY : r1 * minY;
  const cMin = r2 >= 0 ? r2 * minZ : r2 * maxZ;
  const cMax = r2 >= 0 ? r2 * maxZ : r2 * minZ;

  const worldMinMm = (t + aMin + bMin + cMin) * 1000;
  const worldMaxMm = (t + aMax + bMax + cMax) * 1000;
  const thresholdMm = positionMm + SECTION_SLICE_EPSILON_MM;

  return worldMinMm <= thresholdMm && worldMaxMm > thresholdMm;
}

/**
 * Orchestrates per-source cross-section extraction, welding, local open-chain chord closure,
 * containment-depth hole classification, and Earcut triangulation into pre-allocated
 * `positions` (world metres) and `sectionUV` (plane mm) buffers (§4.1–§4.5).
 */
export function buildCapGeometry(
  sources: readonly CapSource[],
  plane: SectionSlicePlane,
  target: CapBuildTarget,
): CapBuildStats {
  const isX = plane.mode === 'x';
  const planePosMm = plane.positionMm;
  const planePosM = planePosMm === 0 ? 0 : planePosMm * 0.001;

  let totalTriangles = 0;
  let totalOpenChains = 0;
  let totalClosedChains = 0;
  let totalDroppedGroups = 0;
  let hullOnlySources = 0;
  let totalAmbiguousJunctions = 0;

  const processSlicedSegments = (): void => {
    if (scratchSegments.length < 8) return;

    const traced = weldAndTraceLoopsInternal(scratchSegments, true);
    totalOpenChains += traced.openChains.length;
    totalAmbiguousJunctions += traced.ambiguousJunctions;

    const maxCombined = traced.loops.length + traced.openChains.length;
    if (maxCombined === 0) return;

    if (maxCombined > scratchOpenChainFlags.length) {
      let cap = scratchOpenChainFlags.length;
      while (cap < maxCombined) cap *= 2;
      scratchOpenChainFlags = new Uint8Array(cap);
    } else {
      scratchOpenChainFlags.fill(0, 0, maxCombined);
    }

    scratchCombinedLoops.length = 0;
    let cleanedCursor = 0;
    for (let l = 0; l < traced.loops.length; l += 1) {
      const cleaned = stripClosingDuplicateInto(
        traced.loops[l]!,
        borrowPointList(closedChainCleanedPool, cleanedCursor),
      );
      cleanedCursor += 1;
      scratchOpenChainFlags[scratchCombinedLoops.length] = 0;
      scratchCombinedLoops.push(cleaned);
    }

    for (let c = 0; c < traced.openChains.length; c += 1) {
      const chain = traced.openChains[c]!;
      // Close open chain locally with one straight chord between its two endpoints (§4.3)
      if (!isSimplePolygon(chain)) {
        totalDroppedGroups += 1;
        continue;
      }
      const cleaned = stripClosingDuplicateInto(
        chain,
        borrowPointList(closedChainCleanedPool, cleanedCursor),
      );
      cleanedCursor += 1;
      scratchOpenChainFlags[scratchCombinedLoops.length] = 1;
      scratchCombinedLoops.push(cleaned);
    }

    if (scratchCombinedLoops.length === 0) return;

    const groups = classifyLoopsInternal(scratchCombinedLoops, true);
    for (let g = 0; g < groups.length; g += 1) {
      const group = groups[g]!;
      const faces = runShapeUtilsTriangulate(group.outer, group.holes);

      let openChainsInGroup = scratchOpenChainFlags[group.outerIndex] === 1 ? 1 : 0;
      for (let h = 0; h < group.holeIndices.length; h += 1) {
        if (scratchOpenChainFlags[group.holeIndices[h]!] === 1) {
          openChainsInGroup += 1;
        }
      }

      if (faces.length === 0) {
        totalDroppedGroups += Math.max(1, openChainsInGroup);
        continue;
      }

      let triAreaTwiceMm2 = 0;
      const outerLen = group.outer.length;
      const resolveVertex = (flatIdx: number): Point2D => {
        if (flatIdx < outerLen) {
          return group.outer[flatIdx]!;
        }
        let rem = flatIdx - outerLen;
        for (let h = 0; h < group.holes.length; h += 1) {
          const hole = group.holes[h]!;
          if (rem < hole.length) {
            return hole[rem]!;
          }
          rem -= hole.length;
        }
        return group.outer[0]!;
      };

      for (let f = 0; f < faces.length; f += 1) {
        const tri = faces[f]!;
        const pa = resolveVertex(tri[0]!);
        const pb = resolveVertex(tri[1]!);
        const pc = resolveVertex(tri[2]!);
        triAreaTwiceMm2 += Math.abs(
          (pb[0] - pa[0]) * (pc[1] - pa[1]) - (pb[1] - pa[1]) * (pc[0] - pa[0]),
        );
      }

      if (0.5 * triAreaTwiceMm2 <= MIN_LOOP_AREA_MM2) {
        totalDroppedGroups += Math.max(1, openChainsInGroup);
        continue;
      }

      totalClosedChains += openChainsInGroup;
      ensureTargetCapacity(target, totalTriangles + faces.length);

      const posOut = target.positions;
      const uvOut = target.sectionUV;

      for (let f = 0; f < faces.length; f += 1) {
        const tri = faces[f]!;
        const pBase = totalTriangles * 9;
        const uvBase = totalTriangles * 6;

        for (let k = 0; k < 3; k += 1) {
          const pt = resolveVertex(tri[k]!);
          const uMm = pt[0];
          const vMm = pt[1];
          const uM = uMm * 0.001;
          const vM = vMm * 0.001;

          const po = pBase + k * 3;
          if (isX) {
            posOut[po] = planePosM;
            posOut[po + 1] = uM;
            posOut[po + 2] = vM;
          } else {
            posOut[po] = uM;
            posOut[po + 1] = planePosM;
            posOut[po + 2] = vM;
          }

          const uo = uvBase + k * 2;
          uvOut[uo] = uMm;
          uvOut[uo + 1] = vMm;
        }

        totalTriangles += 1;
      }
    }
  };

  for (let sIdx = 0; sIdx < sources.length; sIdx += 1) {
    const source = sources[sIdx]!;
    const obj = source.object3D;

    if (!isObjectAndAncestorsVisible(obj)) continue;
    if (source.skipWhenGhosted && isSourceGhosted(obj)) continue;

    ensureSourceCaches(source);
    const bounds = source.localBounds;

    if (source.hullOnly) {
      const hullPositions = source.hullPositions;
      if (!hullPositions || hullPositions.length === 0) continue;
      hullOnlySources += 1;

      if (source.instanced && obj instanceof THREE.InstancedMesh) {
        const parentWorld = obj.matrixWorld;
        const hasNonIdentityWorld = !isIdentityMatrix4(parentWorld);
        const count = Math.min(source.count, obj.count);
        for (let i = 0; i < count; i += 1) {
          obj.getMatrixAt(i, scratchInstanceMatrix);
          const worldMat = hasNonIdentityWorld
            ? scratchCombinedMatrix.multiplyMatrices(parentWorld, scratchInstanceMatrix)
            : scratchInstanceMatrix;
          if (bounds && !boundsCrossPlane(bounds, worldMat, isX, planePosMm)) continue;
          scratchSegments.length = 0;
          sliceMeshAtPlane(hullPositions, plane, scratchSegments, { matrixWorld: worldMat });
          processSlicedSegments();
        }
      } else {
        const worldMat = obj.matrixWorld;
        if (bounds && !boundsCrossPlane(bounds, worldMat, isX, planePosMm)) continue;
        scratchSegments.length = 0;
        sliceMeshAtPlane(hullPositions, plane, scratchSegments, { matrixWorld: worldMat });
        processSlicedSegments();
      }
      continue;
    }

    const comps = source.components;
    if (!comps || comps.length === 0) continue;

    if (source.instanced && obj instanceof THREE.InstancedMesh) {
      const parentWorld = obj.matrixWorld;
      const hasNonIdentityWorld = !isIdentityMatrix4(parentWorld);
      const count = Math.min(source.count, obj.count);

      for (let i = 0; i < count; i += 1) {
        obj.getMatrixAt(i, scratchInstanceMatrix);
        const worldMat = hasNonIdentityWorld
          ? scratchCombinedMatrix.multiplyMatrices(parentWorld, scratchInstanceMatrix)
          : scratchInstanceMatrix;
        if (bounds && !boundsCrossPlane(bounds, worldMat, isX, planePosMm)) continue;

        for (let c = 0; c < comps.length; c += 1) {
          const comp = comps[c]!;
          if (!boundsCrossPlane(comp.bounds, worldMat, isX, planePosMm)) continue;
          scratchSegments.length = 0;
          sliceMeshAtPlane(comp.positions, plane, scratchSegments, { matrixWorld: worldMat });
          processSlicedSegments();
        }
      }
    } else {
      const worldMat = obj.matrixWorld;
      if (bounds && !boundsCrossPlane(bounds, worldMat, isX, planePosMm)) continue;
      for (let c = 0; c < comps.length; c += 1) {
        const comp = comps[c]!;
        if (!boundsCrossPlane(comp.bounds, worldMat, isX, planePosMm)) continue;
        scratchSegments.length = 0;
        sliceMeshAtPlane(comp.positions, plane, scratchSegments, { matrixWorld: worldMat });
        processSlicedSegments();
      }
    }
  }

  if (target.geometry) {
    const posAttr = target.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    const uvAttr = target.geometry.getAttribute('sectionUV') as THREE.BufferAttribute | undefined;
    if (posAttr && totalTriangles > 0) {
      posAttr.needsUpdate = true;
    }
    if (uvAttr && totalTriangles > 0) {
      uvAttr.needsUpdate = true;
    }
    target.geometry.setDrawRange(0, totalTriangles * 3);
  }

  return {
    triangles: totalTriangles,
    openChains: totalOpenChains,
    closedChains: totalClosedChains,
    droppedGroups: totalDroppedGroups,
    hullOnlySources,
    ambiguousJunctions: totalAmbiguousJunctions,
  };
}
