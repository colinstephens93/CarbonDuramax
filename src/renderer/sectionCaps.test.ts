// Milestone 11 CPU cross-section cap builder tests (docs/specs/M11-capped-cutaways.md §8 tests 1-6).
// Node-only: imports Three.js math/geometry + node:fs to load real GLBs; never creates a WebGL context.

import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as THREE from 'three';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { describe, expect, it } from 'vitest';
import { detailConfig } from '../config/detailConfig';
import { engineConfig } from '../config/engineConfig';
import { valveConfig } from '../config/valveConfig';
import { computeEngineLayout } from './layout';
import { extractPartPrimitives, wrapInPartLocalFrame } from './partLoader';
import { EXTERIOR_PRESERVED_SUBTREES } from './partVariants';
import {
  buildCapGeometry,
  buildSpringConvexHull,
  classifyLoops,
  computeSignedPolygonArea,
  createCapBuildTarget,
  createCapMaterial,
  SECTION_CAP_COLOR_LINEAR,
  SECTION_CAP_HATCH_COLOR_LINEAR,
  SECTION_CAP_HATCH_DUTY,
  SECTION_CAP_HATCH_SPACING_MM,
  SECTION_CAP_MAX_TRIANGLES,
  sliceMeshAtPlane,
  triangulateLoops,
  weldAndTraceLoops,
  type CapSource,
  type Point2D,
} from './sectionCaps';
import { SECTION_RANGES_MM } from './viewLayout';

function computeCapMeshAreaM2(positions: Float32Array, triangleCount: number): number {
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const cross = new THREE.Vector3();
  let area = 0;

  for (let t = 0; t < triangleCount; t += 1) {
    const base = t * 9;
    va.set(positions[base]!, positions[base + 1]!, positions[base + 2]!);
    vb.set(positions[base + 3]!, positions[base + 4]!, positions[base + 5]!);
    vc.set(positions[base + 6]!, positions[base + 7]!, positions[base + 8]!);
    e1.subVectors(vb, va);
    e2.subVectors(vc, va);
    cross.crossVectors(e1, e2);
    area += 0.5 * cross.length();
  }
  return area;
}

function makeSingleMeshSource(id: string, geometry: THREE.BufferGeometry): CapSource {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  mesh.updateMatrixWorld(true);
  return {
    id,
    object3D: mesh,
    instanced: false,
    count: 1,
    static: true,
    skipWhenGhosted: false,
    hullOnly: false,
  };
}

function createClosedHollowTubeGeometry(
  outerRadiusM: number,
  innerRadiusM: number,
  heightM: number,
  radialSegments = 64,
): THREE.BufferGeometry {
  const halfH = 0.5 * heightM;
  const positions: number[] = [];

  const pushTri = (
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    cx: number,
    cy: number,
    cz: number,
  ): void => {
    positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
  };

  for (let s = 0; s < radialSegments; s += 1) {
    const a0 = (s / radialSegments) * Math.PI * 2;
    const a1 = ((s + 1) / radialSegments) * Math.PI * 2;
    const c0 = Math.cos(a0);
    const s0 = Math.sin(a0);
    const c1 = Math.cos(a1);
    const s1 = Math.sin(a1);

    const ox0 = outerRadiusM * c0;
    const oz0 = outerRadiusM * s0;
    const ox1 = outerRadiusM * c1;
    const oz1 = outerRadiusM * s1;

    const ix0 = innerRadiusM * c0;
    const iz0 = innerRadiusM * s0;
    const ix1 = innerRadiusM * c1;
    const iz1 = innerRadiusM * s1;

    // Outer wall (+Y axis)
    pushTri(ox0, -halfH, oz0, ox1, -halfH, oz1, ox1, halfH, oz1);
    pushTri(ox0, -halfH, oz0, ox1, halfH, oz1, ox0, halfH, oz0);

    // Inner wall (inward-facing normals)
    pushTri(ix0, -halfH, iz0, ix1, halfH, iz1, ix1, -halfH, iz1);
    pushTri(ix0, -halfH, iz0, ix0, halfH, iz0, ix1, halfH, iz1);

    // Top annular cap (+halfH)
    pushTri(ix0, halfH, iz0, ox0, halfH, oz0, ox1, halfH, oz1);
    pushTri(ix0, halfH, iz0, ox1, halfH, oz1, ix1, halfH, iz1);

    // Bottom annular cap (-halfH)
    pushTri(ix0, -halfH, iz0, ox1, -halfH, oz1, ox0, -halfH, oz0);
    pushTri(ix0, -halfH, iz0, ix1, -halfH, iz1, ox1, -halfH, oz1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

async function parseGlbNode(loader: GLTFLoader, relPath: string): Promise<GLTF> {
  const fullPath = resolve(process.cwd(), relPath);
  const buf = readFileSync(fullPath);
  const copy = new Uint8Array(buf.byteLength);
  copy.set(buf);
  return loader.parseAsync(copy.buffer, '');
}

function countPositionWeldedBoundaryEdges(
  geometries: readonly THREE.BufferGeometry[],
  weldQuantumM = 1e-5,
): number {
  const vertexMap = new Map<string, number>();
  let nextVertId = 0;
  const edgeCounts = new Map<string, number>();

  const getWeldedId = (x: number, y: number, z: number): number => {
    const kx = Math.round(x / weldQuantumM);
    const ky = Math.round(y / weldQuantumM);
    const kz = Math.round(z / weldQuantumM);
    const key = `${kx},${ky},${kz}`;
    let id = vertexMap.get(key);
    if (id === undefined) {
      id = nextVertId;
      nextVertId += 1;
      vertexMap.set(key, id);
    }
    return id;
  };

  for (const geo of geometries) {
    const posAttr = geo.getAttribute('position');
    if (!posAttr) continue;
    const pos = posAttr.array as ArrayLike<number>;
    const idx = geo.getIndex()?.array ?? null;
    const triCount = idx ? Math.floor(idx.length / 3) : Math.floor(posAttr.count / 3);

    for (let t = 0; t < triCount; t += 1) {
      const i0 = idx ? idx[t * 3]! : t * 3;
      const i1 = idx ? idx[t * 3 + 1]! : t * 3 + 1;
      const i2 = idx ? idx[t * 3 + 2]! : t * 3 + 2;

      const v0 = getWeldedId(pos[i0 * 3]!, pos[i0 * 3 + 1]!, pos[i0 * 3 + 2]!);
      const v1 = getWeldedId(pos[i1 * 3]!, pos[i1 * 3 + 1]!, pos[i1 * 3 + 2]!);
      const v2 = getWeldedId(pos[i2 * 3]!, pos[i2 * 3 + 1]!, pos[i2 * 3 + 2]!);

      if (v0 === v1 || v1 === v2 || v2 === v0) continue;

      const pairs: readonly [number, number][] = [
        [v0, v1],
        [v1, v2],
        [v2, v0],
      ];
      for (const [a, b] of pairs) {
        const ek = a < b ? `${a}_${b}` : `${b}_${a}`;
        edgeCounts.set(ek, (edgeCounts.get(ek) ?? 0) + 1);
      }
    }
  }

  let openEdges = 0;
  for (const count of edgeCounts.values()) {
    if (count === 1) openEdges += 1;
  }
  return openEdges;
}

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.isFile() && /\.(?:[cm]?[jt]sx?)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe('Milestone 11 CPU cross-section caps (src/renderer/sectionCaps.test.ts)', () => {
  it('1. box section: slices 1 m cube at X=0 and X=+0.3 -> 1 loop, 1 m^2, exact on-plane positions & sectionUV, X=+0.6 -> 0 loops', () => {
    const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
    const source = makeSingleMeshSource('unit_cube', cubeGeo);
    const target = createCapBuildTarget(64);

    for (const xM of [0, 0.3]) {
      const posMm = xM * 1000;
      const segs: number[] = [];
      sliceMeshAtPlane(cubeGeo, { mode: 'x', positionMm: posMm }, segs);
      const traced = weldAndTraceLoops(segs);
      expect(traced.loops).toHaveLength(1);
      expect(traced.openChains).toHaveLength(0);

      const loopAreaM2 = Math.abs(computeSignedPolygonArea(traced.loops[0]!)) * 1e-6;
      expect(loopAreaM2).toBeCloseTo(1.0, 6);

      const stats = buildCapGeometry([source], { mode: 'x', positionMm: posMm }, target);
      expect(stats.triangles).toBeGreaterThanOrEqual(2);
      expect(stats.droppedGroups).toBe(0);

      const meshAreaM2 = computeCapMeshAreaM2(target.positions, stats.triangles);
      expect(meshAreaM2).toBeCloseTo(loopAreaM2, 6);
      expect(meshAreaM2).toBeCloseTo(1.0, 6);

      const vertCount = stats.triangles * 3;
      for (let v = 0; v < vertCount; v += 1) {
        const px = target.positions[v * 3]!;
        const py = target.positions[v * 3 + 1]!;
        const pz = target.positions[v * 3 + 2]!;
        const uMm = target.sectionUV[v * 2]!;
        const vMm = target.sectionUV[v * 2 + 1]!;

        expect(Math.abs(px - xM)).toBeLessThan(1e-6);
        expect(uMm).toBeCloseTo(py * 1000, 4);
        expect(vMm).toBeCloseTo(pz * 1000, 4);
      }
    }

    // Outside the cube at X = +0.6 m (+600 mm): zero loops and zero cap triangles
    const outsideSegs: number[] = [];
    sliceMeshAtPlane(cubeGeo, { mode: 'x', positionMm: 600 }, outsideSegs);
    expect(weldAndTraceLoops(outsideSegs).loops).toHaveLength(0);
    const outsideStats = buildCapGeometry([source], { mode: 'x', positionMm: 600 }, target);
    expect(outsideStats.triangles).toBe(0);
  });

  it('2. cylinder and sphere sections: across axis (pi*r^2), along axis (2*r*h), and UV sphere offset (pi*(r^2-d^2)) within 1%', () => {
    const r = 0.35;
    const h = 0.9;
    const cylGeo = new THREE.CylinderGeometry(r, r, h, 32, 1, false);
    const cylSource = makeSingleMeshSource('cyl_32', cylGeo);
    const target = createCapBuildTarget(256);

    // Across cylinder axis (+Y): expected disc area pi * r^2
    const acrossStats = buildCapGeometry([cylSource], { mode: 'y', positionMm: 0 }, target);
    expect(acrossStats.triangles).toBeGreaterThan(0);
    const acrossArea = computeCapMeshAreaM2(target.positions, acrossStats.triangles);
    const expectedDisc = Math.PI * r * r;
    expect(Math.abs(acrossArea - expectedDisc) / expectedDisc).toBeLessThan(0.01);

    // Along cylinder axis (X = 0): expected rectangle 2 * r * h
    const alongStats = buildCapGeometry([cylSource], { mode: 'x', positionMm: 0 }, target);
    expect(alongStats.triangles).toBeGreaterThan(0);
    const alongArea = computeCapMeshAreaM2(target.positions, alongStats.triangles);
    const expectedRect = 2 * r * h;
    expect(Math.abs(alongArea - expectedRect) / expectedRect).toBeLessThan(0.01);

    // UV sphere at offset d: expected pi * (r^2 - d^2)
    const sr = 0.42;
    const d = 0.19;
    const sphereGeo = new THREE.SphereGeometry(sr, 48, 32);
    const sphereSource = makeSingleMeshSource('uv_sphere', sphereGeo);
    const sphereStats = buildCapGeometry(
      [sphereSource],
      { mode: 'x', positionMm: d * 1000 },
      target,
    );
    expect(sphereStats.triangles).toBeGreaterThan(0);
    const sphereArea = computeCapMeshAreaM2(target.positions, sphereStats.triangles);
    const expectedSphereSlice = Math.PI * (sr * sr - d * d);
    expect(Math.abs(sphereArea - expectedSphereSlice) / expectedSphereSlice).toBeLessThan(0.01);
  });

  it('3. hollow tube (annulus) + holes: 2 loops, inner classified as hole by containment depth regardless of winding, area pi*(ro^2-ri^2) within 1%', () => {
    const ro = 0.4;
    const ri = 0.2;
    const tubeGeo = createClosedHollowTubeGeometry(ro, ri, 1.0, 64);

    const segs: number[] = [];
    sliceMeshAtPlane(tubeGeo, { mode: 'y', positionMm: 50 }, segs);
    const traced = weldAndTraceLoops(segs);
    expect(traced.loops).toHaveLength(2);
    expect(traced.openChains).toHaveLength(0);

    const classified = classifyLoops(traced.loops);
    expect(classified.groups).toHaveLength(1);
    expect(classified.groups[0]!.holes).toHaveLength(1);
    expect([...classified.depths].sort()).toEqual([0, 1]);

    const outerIdx = classified.groups[0]!.outerIndex;
    const holeIdx = classified.groups[0]!.holeIndices[0]!;
    expect(classified.depths[outerIdx]).toBe(0);
    expect(classified.depths[holeIdx]).toBe(1);
    expect(classified.parentByLoop[holeIdx]).toBe(outerIdx);

    // Verify arbitrary winding independence: reversing either or both loops yields identical classification & area
    const reversedLoops: Point2D[][] = traced.loops.map((loop) => [...loop].reverse());
    const classifiedReversed = classifyLoops(reversedLoops);
    expect(classifiedReversed.groups).toHaveLength(1);
    expect(classifiedReversed.groups[0]!.holes).toHaveLength(1);
    const triReversed = triangulateLoops(
      classifiedReversed.groups[0]!.outer,
      classifiedReversed.groups[0]!.holes,
    );
    expect(triReversed.triangles.length).toBeGreaterThan(0);

    const target = createCapBuildTarget(512);
    const tubeSource = makeSingleMeshSource('hollow_tube', tubeGeo);
    const stats = buildCapGeometry([tubeSource], { mode: 'y', positionMm: 50 }, target);
    expect(stats.triangles).toBeGreaterThan(0);
    expect(stats.droppedGroups).toBe(0);

    const areaM2 = computeCapMeshAreaM2(target.positions, stats.triangles);
    const expectedAnnulus = Math.PI * (ro * ro - ri * ri);
    expect(Math.abs(areaM2 - expectedAnnulus) / expectedAnnulus).toBeLessThan(0.01);
  });

  it('4. degenerate and open cases: vertex/edge plane, coplanar skip, open box chord closure, self-intersecting open chain drop, and disjoint components', () => {
    const target = createCapBuildTarget(256);

    // (a) Plane directly through a ring of vertices and edges (heightSegments = 2 puts equator ring on Y = 0)
    const stackedCyl = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 24, 2, false);
    const stackedSource = makeSingleMeshSource('stacked_cyl', stackedCyl);
    const eqStats = buildCapGeometry([stackedSource], { mode: 'y', positionMm: 0 }, target);
    expect(eqStats.triangles).toBeGreaterThan(0);
    for (let i = 0; i < eqStats.triangles * 9; i += 1) {
      expect(Number.isNaN(target.positions[i]!)).toBe(false);
    }
    const eqArea = computeCapMeshAreaM2(target.positions, eqStats.triangles);
    expect(Math.abs(eqArea - Math.PI * 0.3 * 0.3) / (Math.PI * 0.3 * 0.3)).toBeLessThan(0.02);

    // Single-vertex grazing (octahedron vertex at X = +0.5, rest X <= 0.5 -> kept grazing, 0 loops; and X = -0.5 grazing from clipped side)
    const octaGeo = new THREE.OctahedronGeometry(0.5, 0);
    const octaSource = makeSingleMeshSource('octa', octaGeo);
    const grazeStats = buildCapGeometry([octaSource], { mode: 'x', positionMm: -500 }, target);
    expect(grazeStats.triangles).toBe(0);

    // (b) Coplanar face directly on X = 0 -> skipped (0 segments)
    const coplanarPos = new Float32Array([0, -0.5, -0.5, 0, 0.5, -0.5, 0, 0, 0.5]);
    const coplanarSegs: number[] = [];
    expect(sliceMeshAtPlane(coplanarPos, { mode: 'x', positionMm: 0 }, coplanarSegs)).toBe(0);
    expect(coplanarSegs).toHaveLength(0);

    // (c) Deliberately open box missing one face (+Z top face removed from a 1 m cube)
    const fullBox = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
    const fullPos = fullBox.getAttribute('position').array as Float32Array;
    const fiveFaceCoords: number[] = [];
    for (let t = 0; t < fullPos.length / 9; t += 1) {
      const b = t * 9;
      const z0 = fullPos[b + 2]!;
      const z1 = fullPos[b + 5]!;
      const z2 = fullPos[b + 8]!;
      // Drop the two triangles of the +Z = +0.5 face
      if (z0 > 0.49 && z1 > 0.49 && z2 > 0.49) continue;
      for (let k = 0; k < 9; k += 1) {
        fiveFaceCoords.push(fullPos[b + k]!);
      }
    }
    const openBoxGeo = new THREE.BufferGeometry();
    openBoxGeo.setAttribute('position', new THREE.Float32BufferAttribute(fiveFaceCoords, 3));
    const openBoxSegs: number[] = [];
    sliceMeshAtPlane(openBoxGeo, { mode: 'x', positionMm: 0 }, openBoxSegs);
    const openBoxTraced = weldAndTraceLoops(openBoxSegs);
    expect(openBoxTraced.loops).toHaveLength(0);
    expect(openBoxTraced.openChains).toHaveLength(1);

    const openBoxSource = makeSingleMeshSource('open_box', openBoxGeo);
    const openBoxStats = buildCapGeometry([openBoxSource], { mode: 'x', positionMm: 0 }, target);
    expect(openBoxStats.openChains).toBe(1);
    expect(openBoxStats.closedChains).toBe(1);
    expect(openBoxStats.droppedGroups).toBe(0);
    expect(openBoxStats.triangles).toBeGreaterThan(0);
    const openBoxArea = computeCapMeshAreaM2(target.positions, openBoxStats.triangles);
    expect(openBoxArea).toBeCloseTo(1.0, 5);

    // (d) Deliberately self-intersecting open chain: 3 planar walls whose X=0 cut forms an asymmetric
    // open chain (0,0) -> (0.2,0.2) -> (0.2,0) -> (-0.05,0.25) with non-coincident diagonal midpoints;
    // closing with chord (-0.05,0.25)->(0,0) produces a self-intersecting polygon that must be dropped.
    const bowTieStrips: number[] = [];
    const addWallCrossingX0 = (y0: number, z0: number, y1: number, z1: number): void => {
      bowTieStrips.push(-0.2, y0, z0, 0.2, y0, z0, 0.2, y1, z1);
      bowTieStrips.push(-0.2, y0, z0, 0.2, y1, z1, -0.2, y1, z1);
    };
    addWallCrossingX0(0.0, 0.0, 0.2, 0.2);
    addWallCrossingX0(0.2, 0.2, 0.2, 0.0);
    addWallCrossingX0(0.2, 0.0, -0.05, 0.25);
    const bowTieGeo = new THREE.BufferGeometry();
    bowTieGeo.setAttribute('position', new THREE.Float32BufferAttribute(bowTieStrips, 3));
    const bowTieSource = makeSingleMeshSource('self_intersecting_open', bowTieGeo);
    const bowTieStats = buildCapGeometry([bowTieSource], { mode: 'x', positionMm: 0 }, target);
    expect(bowTieStats.openChains).toBe(1);
    expect(bowTieStats.closedChains).toBe(0);
    expect(bowTieStats.droppedGroups).toBe(1);
    expect(bowTieStats.triangles).toBe(0);

    // (e) Two disjoint components in one geometry -> two outer loops
    const boxA = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    boxA.translate(0, -0.5, 0);
    const boxB = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    boxB.translate(0, 0.5, 0);
    const twoBoxesGeo = mergeGeometries([boxA, boxB], false)!;
    const twoSegs: number[] = [];
    sliceMeshAtPlane(twoBoxesGeo, { mode: 'x', positionMm: 0 }, twoSegs);
    const twoTraced = weldAndTraceLoops(twoSegs);
    expect(twoTraced.loops).toHaveLength(2);
    const twoClassified = classifyLoops(twoTraced.loops);
    expect(twoClassified.groups).toHaveLength(2);
  });

  it('5. real-asset integration: shell cap at X=402.5, on-plane precision, hullOnly springs, 5 non-watertight shell partIds, piston slice, and stock/variant defaults', async () => {
    const loader = new GLTFLoader();
    const layout = computeEngineLayout(engineConfig, valveConfig, detailConfig);

    // Load Duramax_LLY_2005_66L_V8.glb via node:fs + GLTFLoader.parseAsync
    const shellGltf = await parseGlbNode(loader, 'public/Duramax_LLY_2005_66L_V8.glb');
    shellGltf.scene.updateMatrixWorld(true);

    // 5(d) Position-welded boundary-edge audit at 1e-5 m across all shell mesh nodes
    const geosByMeshNodeName = new Map<string, THREE.BufferGeometry[]>();
    shellGltf.scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const meshNodeName = obj.name || obj.parent?.name || '';
      expect(meshNodeName.length).toBeGreaterThan(0);
      const g = (obj.geometry as THREE.BufferGeometry).clone();
      g.applyMatrix4(obj.matrixWorld);
      let list = geosByMeshNodeName.get(meshNodeName);
      if (!list) {
        list = [];
        geosByMeshNodeName.set(meshNodeName, list);
      }
      list.push(g);
    });

    expect(geosByMeshNodeName.has('ext_front_cover_1')).toBe(true);
    const nonWatertightByPartId = new Map<string, number>();
    for (const [nodeName, geos] of geosByMeshNodeName) {
      const openCount = countPositionWeldedBoundaryEdges(geos, 1e-5);
      if (openCount > 0) {
        nonWatertightByPartId.set(nodeName, openCount);
      }
    }

    expect(nonWatertightByPartId.has('ext_front_cover_1')).toBe(false);
    expect(Object.fromEntries([...nonWatertightByPartId.entries()].sort())).toEqual({
      ext_exh_manifold_lh_2: 32,
      ext_exh_manifold_rh_2: 32,
      ext_inj_return_line_2: 32,
      ext_vc_fasteners_1: 336,
      ext_vc_fasteners_2: 168,
    });

    // Reconstruct the exact 23 material-merged + preserved-subtree shell meshes with layout.exterior registration
    const meshToPreservedId = new Map<THREE.Mesh, string>();
    for (const spec of EXTERIOR_PRESERVED_SUBTREES) {
      const groupNode = shellGltf.scene.getObjectByName(spec.group)!;
      const targetRoot =
        spec.childIndex !== undefined ? groupNode.children[spec.childIndex]! : groupNode;
      targetRoot.traverse((obj) => {
        if (obj instanceof THREE.Mesh) meshToPreservedId.set(obj, spec.id);
      });
    }

    interface Bucket {
      material: THREE.Material;
      geometries: THREE.BufferGeometry[];
    }
    const globalBuckets = new Map<string, Bucket>();
    const partBuckets = new Map<string, Map<string, Bucket>>();
    for (const spec of EXTERIOR_PRESERVED_SUBTREES) {
      partBuckets.set(spec.id, new Map());
    }

    shellGltf.scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mat = obj.material as THREE.MeshStandardMaterial;
      const geo = obj.geometry as THREE.BufferGeometry;
      const sig = [
        Object.keys(geo.attributes).sort().join(','),
        geo.getIndex() ? 'idx1' : 'idx0',
        mat.color.getHexString(),
        mat.metalness.toFixed(5),
        mat.roughness.toFixed(5),
        mat.emissive.getHexString(),
        mat.side,
      ].join('|');
      const pid = meshToPreservedId.get(obj);
      const targetMap = pid ? partBuckets.get(pid)! : globalBuckets;
      let bucket = targetMap.get(sig);
      if (!bucket) {
        bucket = { material: mat, geometries: [] };
        targetMap.set(sig, bucket);
      }
      const cloned = geo.clone();
      cloned.applyMatrix4(obj.matrixWorld);
      bucket.geometries.push(cloned);
    });

    const shellGroup = new THREE.Group();
    const regGroup = new THREE.Group();
    const [c0, c1, c2] = layout.exterior.basisColumnsProjectFromFile;
    regGroup.position.set(
      layout.exterior.translationM[0],
      layout.exterior.translationM[1],
      layout.exterior.translationM[2],
    );
    regGroup.quaternion.setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(
        new THREE.Vector3(c0[0], c0[1], c0[2]),
        new THREE.Vector3(c1[0], c1[1], c1[2]),
        new THREE.Vector3(c2[0], c2[1], c2[2]),
      ),
    );
    regGroup.scale.setScalar(layout.exterior.uniformScale);
    shellGroup.add(regGroup);

    const shellSources: CapSource[] = [];
    for (const [sig, bucket] of globalBuckets) {
      const merged =
        bucket.geometries.length === 1
          ? bucket.geometries[0]!
          : mergeGeometries(bucket.geometries, false)!;
      const mesh = new THREE.Mesh(merged, bucket.material);
      regGroup.add(mesh);
      shellSources.push({
        id: `shell_global_${sig}`,
        object3D: mesh,
        instanced: false,
        count: 1,
        static: true,
        skipWhenGhosted: true,
        hullOnly: false,
      });
    }
    for (const [pid, map] of partBuckets) {
      const pg = new THREE.Group();
      regGroup.add(pg);
      for (const [sig, bucket] of map) {
        const merged =
          bucket.geometries.length === 1
            ? bucket.geometries[0]!
            : mergeGeometries(bucket.geometries, false)!;
        const mesh = new THREE.Mesh(merged, bucket.material);
        pg.add(mesh);
        shellSources.push({
          id: `shell_${pid}_${sig}`,
          object3D: mesh,
          instanced: false,
          count: 1,
          static: true,
          skipWhenGhosted: true,
          hullOnly: false,
        });
      }
    }
    expect(shellSources).toHaveLength(23);
    shellGroup.updateMatrixWorld(true);

    // 5(a) & 5(b): Shell cap at X = 402.5 mm has triangle count in 400..1200 and every vertex within 1e-3 mm of plane
    const target = createCapBuildTarget();
    const shellCapStats = buildCapGeometry(
      shellSources,
      { mode: 'x', positionMm: 402.5 },
      target,
    );
    expect(shellCapStats.triangles).toBeGreaterThanOrEqual(400);
    expect(shellCapStats.triangles).toBeLessThanOrEqual(1200);
    expect(shellCapStats.triangles).toBe(1068);
    expect(shellCapStats.droppedGroups).toBe(0);
    expect(shellCapStats.triangles).toBeLessThanOrEqual(SECTION_CAP_MAX_TRIANGLES);

    const shellCapAreaM2 = computeCapMeshAreaM2(target.positions, shellCapStats.triangles);
    expect(shellCapAreaM2).toBeGreaterThanOrEqual(0.205);

    for (let v = 0; v < shellCapStats.triangles * 3; v += 1) {
      const xMm = target.positions[v * 3]! * 1000;
      expect(Math.abs(xMm - 402.5)).toBeLessThan(1e-3);
    }

    // Load all 10 internal part GLBs: verify watertightness (0 boundary edges), spring hullOnly sources, and piston slice
    const internalSpecs: ReadonlyArray<{ file: string; nodes: readonly string[] }> = [
      { file: 'rot_piston_c1_stock.glb', nodes: ['rot_piston_c1_stock'] },
      { file: 'rot_conrod_c1_stock.glb', nodes: ['rot_conrod_c1_stock'] },
      { file: 'rot_crankthrow_c1_stock.glb', nodes: ['rot_crankthrow_c1_stock'] },
      { file: 'sta_head_c1_stock.glb', nodes: ['sta_head_c1_stock'] },
      { file: 'val_valve_intake_stock.glb', nodes: ['val_valve_intake_stock', 'val_spring_intake_stock'] },
      { file: 'val_valve_exhaust_stock.glb', nodes: ['val_valve_exhaust_stock', 'val_spring_exhaust_stock'] },
      { file: 'val_pushrod_stock.glb', nodes: ['val_pushrod_stock', 'val_lifter_stock'] },
      { file: 'val_rocker_stock.glb', nodes: ['val_rocker_intake_stock', 'val_rocker_exhaust_stock'] },
      { file: 'val_bridge_stock.glb', nodes: ['val_bridge_stock'] },
      { file: 'fuel_injector_c1_stock.glb', nodes: ['fuel_injector_c1_stock'] },
    ];

    const internalCapSources: CapSource[] = [];
    let pistonPrimsForTest: ReturnType<typeof extractPartPrimitives> | null = null;

    for (const spec of internalSpecs) {
      const gltf = await parseGlbNode(loader, `public/models/${spec.file}`);
      for (const nodeName of spec.nodes) {
        const prims = extractPartPrimitives(gltf, nodeName);
        const geos = prims.map((p) => p.geometry);
        expect(
          countPositionWeldedBoundaryEdges(geos, 1e-5),
          `Expected 0 open boundary edges on ${nodeName}`,
        ).toBe(0);

        if (nodeName === 'rot_piston_c1_stock') {
          pistonPrimsForTest = prims;
        }

        const isSpring = nodeName.includes('_spring_');
        const dummyInst = new THREE.InstancedMesh(geos[0]!, prims[0]!.material, 1);
        dummyInst.setMatrixAt(0, new THREE.Matrix4());
        dummyInst.instanceMatrix.needsUpdate = true;
        dummyInst.updateMatrixWorld(true);

        if (isSpring) {
          const hullCache = buildSpringConvexHull(geos);
          internalCapSources.push({
            id: nodeName,
            object3D: dummyInst,
            instanced: true,
            count: 1,
            static: false,
            skipWhenGhosted: false,
            hullOnly: true,
            cachedHull: hullCache.hull,
            hullPositions: hullCache.hullPositions,
            localBounds: hullCache.localBounds,
          });
        } else {
          internalCapSources.push({
            id: nodeName,
            object3D: dummyInst,
            geometries: geos,
            instanced: true,
            count: 1,
            static: false,
            skipWhenGhosted: false,
            hullOnly: false,
          });
        }
      }
    }

    // 5(c) Verify spring sources are the ONLY hullOnly sources, backed by ConvexHull, producing solid elliptical section
    const springSources = internalCapSources.filter((s) => s.hullOnly);
    const nonSpringSources = internalCapSources.filter((s) => !s.hullOnly);
    expect(springSources.map((s) => s.id).sort()).toEqual([
      'val_spring_exhaust_stock',
      'val_spring_intake_stock',
    ]);
    expect(nonSpringSources.every((s) => !s.hullOnly)).toBe(true);
    for (const ss of springSources) {
      expect(ss.cachedHull).toBeInstanceOf(ConvexHull);
      expect(ss.hullPositions!.length / 9).toBe(326);
      const springSliceStats = buildCapGeometry([ss], { mode: 'x', positionMm: 0 }, target);
      expect(springSliceStats.hullOnlySources).toBe(1);
      expect(springSliceStats.openChains).toBe(0);
      expect(springSliceStats.triangles).toBeGreaterThan(0);
      expect(computeCapMeshAreaM2(target.positions, springSliceStats.triangles)).toBeGreaterThan(0);
    }

    // 5(e) Slicing one piston in part-local space at X = 0 produces closed loop(s) with positive area
    expect(pistonPrimsForTest).not.toBeNull();
    const pistonSegs: number[] = [];
    for (const prim of pistonPrimsForTest!) {
      sliceMeshAtPlane(prim.geometry, { mode: 'x', positionMm: 0 }, pistonSegs);
    }
    const pistonTraced = weldAndTraceLoops(pistonSegs);
    expect(pistonTraced.openChains).toHaveLength(0);
    expect(pistonTraced.loops.length).toBeGreaterThan(0);
    const pistonSource = internalCapSources.find((s) => s.id === 'rot_piston_c1_stock')!;
    const pistonCapStats = buildCapGeometry([pistonSource], { mode: 'x', positionMm: 0 }, target);
    expect(pistonCapStats.openChains).toBe(0);
    expect(pistonCapStats.droppedGroups).toBe(0);
    expect(pistonCapStats.triangles).toBeGreaterThan(0);
    expect(computeCapMeshAreaM2(target.positions, pistonCapStats.triangles)).toBeGreaterThan(0);

    // 5(f) Stock defaults (X = 900 mm, Y = 580 mm) return zero triangles; intercooler variant reaches Y ~ 696 mm -> > 0 at Y = 580
    expect(SECTION_RANGES_MM.x.defaultMm).toBe(900);
    expect(SECTION_RANGES_MM.y.defaultMm).toBe(580);
    const stockDefaultX = buildCapGeometry(
      [...shellSources, ...internalCapSources],
      { mode: 'x', positionMm: SECTION_RANGES_MM.x.defaultMm },
      target,
    );
    expect(stockDefaultX.triangles).toBe(0);

    const stockDefaultY = buildCapGeometry(
      [...shellSources, ...internalCapSources],
      { mode: 'y', positionMm: SECTION_RANGES_MM.y.defaultMm },
      target,
    );
    expect(stockDefaultY.triangles).toBe(0);

    const intercoolerGltf = await parseGlbNode(
      loader,
      'public/models/variants/intercooler_core_engine_upgraded.glb',
    );
    const intercoolerGroup = wrapInPartLocalFrame(intercoolerGltf.scene, 'intercooler_variant');
    intercoolerGroup.updateMatrixWorld(true);
    const intercoolerBox = new THREE.Box3().setFromObject(intercoolerGroup);
    expect(intercoolerBox.max.y * 1000).toBeCloseTo(696, 0);

    const intercoolerSource: CapSource = {
      id: 'variant_intercooler_upgraded',
      object3D: intercoolerGroup,
      instanced: false,
      count: 1,
      static: true,
      skipWhenGhosted: false,
      hullOnly: false,
    };
    const intercoolerAtDefaultY = buildCapGeometry(
      [intercoolerSource],
      { mode: 'y', positionMm: SECTION_RANGES_MM.y.defaultMm },
      target,
    );
    expect(intercoolerAtDefaultY.triangles).toBeGreaterThan(0);
  });

  it('6. build invariants (source-text & material contract): single renderer.render, no stencil/renderTarget/overrideMaterial/logDepth, depthWrite/depthTest true, castShadow false', () => {
    const rendererDir = resolve(process.cwd(), 'src', 'renderer');
    const prodRendererFiles = collectSourceFiles(rendererDir).filter(
      (f) => !f.endsWith('.test.ts'),
    );

    const engineSceneSource = readFileSync(resolve(rendererDir, 'engineScene.ts'), 'utf8');
    const sectionCapsSource = readFileSync(resolve(rendererDir, 'sectionCaps.ts'), 'utf8');

    // Single renderer.render( call across engineScene.ts (and 0 in all other renderer modules)
    const renderCallMatches = engineSceneSource.match(/renderer\.render\s*\(/g) ?? [];
    expect(renderCallMatches).toHaveLength(1);

    for (const filePath of prodRendererFiles) {
      const src = readFileSync(filePath, 'utf8');
      if (!filePath.endsWith('engineScene.ts')) {
        expect(src.match(/renderer\.render\s*\(/g) ?? []).toHaveLength(0);
      }
      expect(src).not.toContain('new THREE.WebGLRenderTarget(');
      expect(src).not.toContain('new WebGLRenderTarget(');
      expect(src).not.toContain('stencil: true');
      expect(src).not.toContain('renderer.clearStencil');
      expect(src).not.toContain('renderer.setRenderTarget');
      expect(src).not.toContain('scene.overrideMaterial');
      expect(src).not.toContain('logarithmicDepthBuffer');
    }

    // Cap material source + runtime checks
    expect(sectionCapsSource).toContain('depthWrite = true');
    expect(sectionCapsSource).toContain('depthTest = true');
    expect(sectionCapsSource).toContain('#include <tonemapping_fragment>');
    expect(sectionCapsSource).toContain('#include <colorspace_fragment>');

    const mat = createCapMaterial();
    expect(mat.depthWrite).toBe(true);
    expect(mat.depthTest).toBe(true);
    expect(mat.side).toBe(THREE.DoubleSide);
    expect(mat.transparent).toBe(false);
    expect(mat.fog).toBe(false);
    expect(SECTION_CAP_COLOR_LINEAR).toEqual([0.29, 0.17, 0.086]);
    expect(SECTION_CAP_HATCH_COLOR_LINEAR).toEqual([0.196, 0.112, 0.055]);
    expect(SECTION_CAP_HATCH_SPACING_MM).toBe(5.0);
    expect(SECTION_CAP_HATCH_DUTY).toBeCloseTo(1 / 3, 8);
    mat.dispose();

    // Static & dynamic cap meshes explicitly disable shadow casting
    expect(engineSceneSource).toContain('staticCapMesh.castShadow = false');
    expect(engineSceneSource).toContain('dynamicCapMesh.castShadow = false');
  });
});
