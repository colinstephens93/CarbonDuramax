// Milestone 4 view-layer unit test suite (docs/specs/M4-views.md §§3, 4, 6, 10).
// Verifies explode-zero exactness, full-explode station centers & lifts, pushrod stretch bounds,
// cutaway THREE.Plane signed-distance behavior in metres across range ends & defaults, and the
// 23-anchor label table + live motion/explode/visibility rules.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { detailConfig } from '../config/detailConfig';
import { engineConfig } from '../config/engineConfig';
import { valveConfig } from '../config/valveConfig';
import type { CylinderId } from '../core/interfaces';
import { computeState, crankPinPositionM } from '../core/kinematics';
import { buildSectionPlane } from './engineScene';
import { computeEngineLayout } from './layout';
import {
  computeExplodedPushrodGeometryMm,
  computeExplodedStationCenterXMm,
  computeHeadLiftMm,
  computeLifterLiftMm,
  computePartGroupExplodeOffsetMm,
  computeStationSpreadOffsetXMm,
  evaluateLabelAnchors,
  EXPLODE_HEAD_LIFT_MAX_MM,
  EXPLODE_LIFTER_LIFT_MAX_MM,
  EXPLODE_STATION_SPREAD_GAIN,
  EXTERIOR_SHELL_LABEL_ANCHORS_MM,
  isLabelVisibleUnderViewRules,
  LABEL_ANCHOR_DEFINITIONS,
  SECTION_RANGES_MM,
  type ExplodePartGroup,
} from './viewLayout';

const ALL_CYLINDERS: readonly CylinderId[] = [1, 2, 3, 4, 5, 6, 7, 8];
const ALL_PART_GROUPS: readonly ExplodePartGroup[] = [
  'mainShaft',
  'exteriorShell',
  'crankThrow',
  'piston',
  'conrod',
  'headGroup',
  'head',
  'injector',
  'valve',
  'spring',
  'bridge',
  'rocker',
  'lifterGroup',
  'lifter',
  'pushrodBottom',
  'pushrodTop',
];

describe('Milestone 4 view layout, cutaway planes & label anchors (src/renderer/viewLayout.test.ts)', () => {
  it('1. explode zero: at e = 0, station spread, head lift, lifter lift, and all part-group offsets are strictly 0', () => {
    const layout = computeEngineLayout(engineConfig, valveConfig, detailConfig);

    expect(computeHeadLiftMm(0)).toBe(0);
    expect(computeLifterLiftMm(0)).toBe(0);

    for (const station of layout.stations) {
      const spreadMm = computeStationSpreadOffsetXMm(
        station.centerXMm,
        layout.blockCenterXMm,
        0,
      );
      expect(spreadMm).toBe(0);
      expect(
        computeExplodedStationCenterXMm(station.centerXMm, layout.blockCenterXMm, 0),
      ).toBe(station.centerXMm);

      for (const group of ALL_PART_GROUPS) {
        const offset = computePartGroupExplodeOffsetMm(
          group,
          station.centerXMm,
          layout.blockCenterXMm,
          0,
        );
        expect(offset.dxMm).toBe(0);
        expect(offset.dbMm).toBe(0);
      }
    }

    for (const cyl of ALL_CYLINDERS) {
      const cl = layout.cylinders[cyl];
      expect(computeStationSpreadOffsetXMm(cl.stationCenterXMm, layout.blockCenterXMm, 0)).toBe(0);
    }
  });

  it('2. explode full: at e = 1, station centers match {-80.5, 126.5, 333.5, 540.5} mm (±0.01), head lift = 110, lifter lift = 55, and rod length stays exact', () => {
    const layout = computeEngineLayout(engineConfig, valveConfig, detailConfig);

    const explodedSortedAsc = layout.stations
      .map((s) => computeExplodedStationCenterXMm(s.centerXMm, layout.blockCenterXMm, 1))
      .sort((a, b) => a - b);

    const expectedFromLayoutAsc = [...layout.stations]
      .map(
        (s) =>
          layout.blockCenterXMm +
          (s.centerXMm - layout.blockCenterXMm) * (1 + EXPLODE_STATION_SPREAD_GAIN),
      )
      .sort((a, b) => a - b);

    const specPinnedAsc = [-80.5, 126.5, 333.5, 540.5];
    expect(explodedSortedAsc).toHaveLength(4);
    for (let i = 0; i < 4; i += 1) {
      expect(explodedSortedAsc[i]).toBeCloseTo(expectedFromLayoutAsc[i]!, 9);
      expect(Math.abs(explodedSortedAsc[i]! - specPinnedAsc[i]!)).toBeLessThanOrEqual(0.01);
    }

    expect(computeHeadLiftMm(1)).toBe(EXPLODE_HEAD_LIFT_MAX_MM);
    expect(computeHeadLiftMm(1)).toBe(110);
    expect(computeLifterLiftMm(1)).toBe(EXPLODE_LIFTER_LIFT_MAX_MM);
    expect(computeLifterLiftMm(1)).toBe(55);

    // Main shaft and exterior shell do not spread or lift even at e = 1
    for (const station of layout.stations) {
      expect(
        computePartGroupExplodeOffsetMm('mainShaft', station.centerXMm, layout.blockCenterXMm, 1),
      ).toEqual({ dxMm: 0, dbMm: 0 });
      expect(
        computePartGroupExplodeOffsetMm(
          'exteriorShell',
          station.centerXMm,
          layout.blockCenterXMm,
          1,
        ),
      ).toEqual({ dxMm: 0, dbMm: 0 });
    }

    // Connecting rod length remains exact across crank angles under e = 1 spread (both X sources share spread)
    const rodLenM = engineConfig.rodLengthMm.value / 1000;
    const tdcWristBM = layout.valvetrainMm.tdcWristBMm / 1000;
    for (const thetaDeg of [0, 90, 180, 470]) {
      const state = computeState(engineConfig, thetaDeg, 900, valveConfig);
      for (const station of layout.stations) {
        const [corePinXM, pinYM, pinZM] = crankPinPositionM(
          engineConfig,
          valveConfig,
          station.rhCylinder,
          thetaDeg,
        );
        const spreadXM =
          computeStationSpreadOffsetXMm(station.centerXMm, layout.blockCenterXMm, 1) / 1000;
        expect(corePinXM + spreadXM).toBeCloseTo(station.centerXM + spreadXM, 9);

        for (const cyl of [station.rhCylinder, station.lhCylinder] as const) {
          const cl = layout.cylinders[cyl];
          const wristBM = tdcWristBM - state.pistonPositionM[cyl];
          const pinSeatX = cl.rodSeatXM + spreadXM;
          const wristSeatX = cl.rodSeatXM + spreadXM;
          const distM = Math.hypot(
            wristSeatX - pinSeatX,
            wristBM * cl.boreAxisB[1] - pinYM,
            wristBM * cl.boreAxisB[2] - pinZM,
          );
          expect(distM).toBeCloseTo(rodLenM, 12);
        }
      }
    }
  });

  it('3. pushrod stretch bound: at e = 1, intake and exhaust pushrod length growth from M3 lifter/cup points is > 0% and <= 25%', () => {
    const layout = computeEngineLayout(engineConfig, valveConfig, detailConfig);
    const intakeMaxLiftMm = valveConfig.intakeMaxLift.value;
    const exhaustMaxLiftMm = valveConfig.exhaustMaxLift.value;

    // Verify at rest (lift = 0) and across each channel's own cam lift envelope [0, intakeMaxLift / exhaustMaxLift]
    for (const frac of [0, 0.5, 1]) {
      const intakeLiftMm = frac * intakeMaxLiftMm;
      const exhaustLiftMm = frac * exhaustMaxLiftMm;
      const reportZero = computeExplodedPushrodGeometryMm(layout, 0, intakeLiftMm, exhaustLiftMm);
      expect(reportZero.intake.growthPercent).toBe(0);
      expect(reportZero.exhaust.growthPercent).toBe(0);

      const reportFull = computeExplodedPushrodGeometryMm(layout, 1, intakeLiftMm, exhaustLiftMm);
      expect(reportFull.intake.growthPercent).toBeGreaterThan(0);
      expect(reportFull.intake.growthPercent).toBeLessThanOrEqual(25);
      expect(reportFull.exhaust.growthPercent).toBeGreaterThan(0);
      expect(reportFull.exhaust.growthPercent).toBeLessThanOrEqual(25);
    }
  });

  it('4. section behavior: Front–Back (X) and Side (Y) THREE.Plane signed distances in metres keep (p - 1)/1000 and clip (p + 1)/1000 across range ends and defaults', () => {
    const layout = computeEngineLayout(engineConfig, valveConfig, detailConfig);

    // Front–Back (X): slider range -150..+900 mm, default 900 mm, keeps x <= posM
    const xSpec = SECTION_RANGES_MM.x;
    expect(xSpec.minMm).toBe(-150);
    expect(xSpec.maxMm).toBe(900);
    expect(xSpec.defaultMm).toBe(900);

    for (const pMm of [xSpec.minMm, 0, 402.5, xSpec.maxMm, xSpec.defaultMm]) {
      const planeX = buildSectionPlane('x', pMm);
      const keptSampleM = new THREE.Vector3((pMm - 1) / 1000, 0.12, -0.08);
      const clippedSampleM = new THREE.Vector3((pMm + 1) / 1000, 0.12, -0.08);

      // three.js keeps signed distance >= 0 and discards < 0
      expect(planeX.distanceToPoint(keptSampleM)).toBeGreaterThanOrEqual(0);
      expect(planeX.distanceToPoint(clippedSampleM)).toBeLessThan(0);
    }

    // X default (900 mm) keeps the registered shell's +893 mm front (and layout max X)
    const defaultPlaneX = buildSectionPlane('x', xSpec.defaultMm);
    expect(defaultPlaneX.distanceToPoint(new THREE.Vector3(0.893, 0, 0))).toBeGreaterThanOrEqual(0);
    expect(
      defaultPlaneX.distanceToPoint(
        new THREE.Vector3(layout.exterior.projectBoundsMm.max[0] / 1000, 0, 0),
      ),
    ).toBeGreaterThanOrEqual(0);
    expect(
      defaultPlaneX.distanceToPoint(
        new THREE.Vector3(layout.exterior.projectBoundsMm.min[0] / 1000, 0, 0),
      ),
    ).toBeGreaterThanOrEqual(0);

    // Side (Y): slider range -580..+580 mm, default +580 mm, keeps y <= posM
    const ySpec = SECTION_RANGES_MM.y;
    expect(ySpec.minMm).toBe(-580);
    expect(ySpec.maxMm).toBe(580);
    expect(ySpec.defaultMm).toBe(580);

    for (const pMm of [ySpec.minMm, 0, ySpec.maxMm, ySpec.defaultMm]) {
      const planeY = buildSectionPlane('y', pMm);
      const keptSampleM = new THREE.Vector3(0.23, (pMm - 1) / 1000, 0.15);
      const clippedSampleM = new THREE.Vector3(0.23, (pMm + 1) / 1000, 0.15);

      expect(planeY.distanceToPoint(keptSampleM)).toBeGreaterThanOrEqual(0);
      expect(planeY.distanceToPoint(clippedSampleM)).toBeLessThan(0);
    }

    // Y default (+580 mm) keeps the shell's -573 mm RH bound and +522 mm LH bound
    const defaultPlaneY = buildSectionPlane('y', ySpec.defaultMm);
    expect(defaultPlaneY.distanceToPoint(new THREE.Vector3(0, -0.573, 0))).toBeGreaterThanOrEqual(
      0,
    );
    expect(
      defaultPlaneY.distanceToPoint(
        new THREE.Vector3(0, layout.exterior.projectBoundsMm.min[1] / 1000, 0),
      ),
    ).toBeGreaterThanOrEqual(0);
    expect(
      defaultPlaneY.distanceToPoint(
        new THREE.Vector3(0, layout.exterior.projectBoundsMm.max[1] / 1000, 0),
      ),
    ).toBeGreaterThanOrEqual(0);
  });

  it('5. label anchors: every §6 part label (15) and cylinder number 1–8 (8) has a unique definition and tracks motion & explode', () => {
    const requiredPartLabels: ReadonlyArray<[string, string]> = [
      ['piston', 'Piston'],
      ['connecting-rod', 'Connecting rod'],
      ['cylinder-head', 'Cylinder head'],
      ['intake-valves', 'Intake valves'],
      ['exhaust-valves', 'Exhaust valves'],
      ['valve-springs', 'Valve springs'],
      ['rocker-arms', 'Rocker arms'],
      ['pushrods', 'Pushrods'],
      ['lifters', 'Lifters'],
      ['fuel-injector', 'Fuel injector'],
      ['crankshaft', 'Crankshaft'],
      ['flywheel-flange', 'Flywheel flange'],
      ['turbocharger', 'Turbocharger'],
      ['harmonic-balancer', 'Harmonic balancer'],
      ['oil-pan', 'Oil pan'],
    ];

    expect(LABEL_ANCHOR_DEFINITIONS.length).toBe(23);
    expect(LABEL_ANCHOR_DEFINITIONS.length).toBeLessThanOrEqual(23);

    const uniqueIds = new Set(LABEL_ANCHOR_DEFINITIONS.map((d) => d.id));
    expect(uniqueIds.size).toBe(LABEL_ANCHOR_DEFINITIONS.length);

    for (const [id, text] of requiredPartLabels) {
      const matches = LABEL_ANCHOR_DEFINITIONS.filter((d) => d.id === id);
      expect(matches).toHaveLength(1);
      expect(matches[0]!.text).toBe(text);
    }

    for (const cyl of ALL_CYLINDERS) {
      const matches = LABEL_ANCHOR_DEFINITIONS.filter((d) => d.id === `cyl-${cyl}`);
      expect(matches).toHaveLength(1);
      expect(matches[0]!.text).toBe(String(cyl));
      expect(matches[0]!.category).toBe('cylinder-number');
    }

    // Verify Cyl 1 piston label tracks stroke between TDC (0 deg) and BDC (180 deg)
    const stateTdc = computeState(engineConfig, 0, 900, valveConfig);
    const stateBdc = computeState(engineConfig, 180, 900, valveConfig);
    const anchorsTdc0 = evaluateLabelAnchors(stateTdc, 0, engineConfig, valveConfig, detailConfig);
    const anchorsBdc0 = evaluateLabelAnchors(stateBdc, 0, engineConfig, valveConfig, detailConfig);

    const pistonTdc = anchorsTdc0.find((a) => a.id === 'piston')!;
    const pistonBdc = anchorsBdc0.find((a) => a.id === 'piston')!;
    const pistonTravelMm = Math.hypot(
      pistonTdc.worldMm[0] - pistonBdc.worldMm[0],
      pistonTdc.worldMm[1] - pistonBdc.worldMm[1],
      pistonTdc.worldMm[2] - pistonBdc.worldMm[2],
    );
    expect(pistonTravelMm).toBeCloseTo(engineConfig.strokeMm.value, 6);

    // Verify head-side & cylinder-number labels track station spread + 110 mm bore lift at e = 1,
    // while main-shaft and exterior anchors stay fixed
    const anchorsTdcExploded = evaluateLabelAnchors(
      stateTdc,
      1,
      engineConfig,
      valveConfig,
      detailConfig,
    );
    const layout = computeEngineLayout(engineConfig, valveConfig, detailConfig);
    const cyl1 = layout.cylinders[1];
    const spread1Mm = computeStationSpreadOffsetXMm(cyl1.stationCenterXMm, layout.blockCenterXMm, 1);

    const head0 = anchorsTdc0.find((a) => a.id === 'cylinder-head')!;
    const head1 = anchorsTdcExploded.find((a) => a.id === 'cylinder-head')!;
    expect(head1.worldMm[0] - head0.worldMm[0]).toBeCloseTo(spread1Mm, 9);
    expect(head1.worldMm[1] - head0.worldMm[1]).toBeCloseTo(
      EXPLODE_HEAD_LIFT_MAX_MM * cyl1.boreAxisB[1],
      9,
    );
    expect(head1.worldMm[2] - head0.worldMm[2]).toBeCloseTo(
      EXPLODE_HEAD_LIFT_MAX_MM * cyl1.boreAxisB[2],
      9,
    );

    for (const fixedId of ['crankshaft', 'flywheel-flange', 'turbocharger', 'harmonic-balancer', 'oil-pan']) {
      const a0 = anchorsTdc0.find((a) => a.id === fixedId)!;
      const a1 = anchorsTdcExploded.find((a) => a.id === fixedId)!;
      expect(a1.worldMm).toEqual(a0.worldMm);
    }
  });

  it('6. label hide rules: exterior vs opaque-shell vs x-ray and active section clipping match §6', () => {
    const state = computeState(engineConfig, 0, 900, valveConfig);
    const anchors = evaluateLabelAnchors(state, 0, engineConfig, valveConfig, detailConfig);

    // Default (Exterior off, X-Ray off, Section off): 20 internal/cyl labels visible, 3 exterior hidden
    const visibleDefault = anchors.filter((a) =>
      isLabelVisibleUnderViewRules(a.category, a.worldM, {
        exteriorVisible: false,
        xrayEnabled: false,
        sectionMode: 'off',
        sectionPositionMm: 900,
      }),
    );
    expect(visibleDefault).toHaveLength(20);
    expect(visibleDefault.every((a) => a.category !== 'exterior-part')).toBe(true);

    // Opaque shell (Exterior on, X-Ray off): only the 3 exterior labels visible; internals hidden
    const visibleOpaqueShell = anchors.filter((a) =>
      isLabelVisibleUnderViewRules(a.category, a.worldM, {
        exteriorVisible: true,
        xrayEnabled: false,
        sectionMode: 'off',
        sectionPositionMm: 900,
      }),
    );
    expect(visibleOpaqueShell.map((a) => a.id)).toEqual([
      'turbocharger',
      'harmonic-balancer',
      'oil-pan',
    ]);

    // X-Ray on (whether Exterior checkbox is on or off): shell ghosted -> all 23 labels eligible
    for (const extChecked of [false, true]) {
      const visibleXray = anchors.filter((a) =>
        isLabelVisibleUnderViewRules(a.category, a.worldM, {
          exteriorVisible: extChecked,
          xrayEnabled: true,
          sectionMode: 'off',
          sectionPositionMm: 900,
        }),
      );
      expect(visibleXray).toHaveLength(23);
    }

    // Active X section at 230 mm (engine midpoint): clips front station (X = 402.5 mm) & front snout (478 mm),
    // keeps rear flywheel flange (-18 mm) and rear cylinders 5..8 (X = 172.5, 57.5 mm)
    const visibleCutMidX = anchors.filter((a) =>
      isLabelVisibleUnderViewRules(a.category, a.worldM, {
        exteriorVisible: false,
        xrayEnabled: false,
        sectionMode: 'x',
        sectionPositionMm: 230,
      }),
    );
    const cutMidIds = new Set(visibleCutMidX.map((a) => a.id));
    expect(cutMidIds.has('piston')).toBe(false);
    expect(cutMidIds.has('crankshaft')).toBe(false);
    expect(cutMidIds.has('cyl-1')).toBe(false);
    expect(cutMidIds.has('flywheel-flange')).toBe(true);
    expect(cutMidIds.has('cyl-5')).toBe(true);
    expect(cutMidIds.has('cyl-8')).toBe(true);
  });

  it('7. exterior shell label anchors lie inside their GLB part-group bounding boxes and harmonic-balancer is within 1.0 mm of ext_damper centre', () => {
    interface GlbNode {
      name?: string;
      mesh?: number;
      children?: number[];
      matrix?: number[];
      translation?: [number, number, number];
      rotation?: [number, number, number, number];
      scale?: [number, number, number];
      extras?: { partId?: string };
    }
    interface GlbDoc {
      scene?: number;
      scenes?: Array<{ nodes?: number[] }>;
      nodes?: GlbNode[];
      meshes?: Array<{
        extras?: { partId?: string };
        primitives: Array<{ attributes: Record<string, number> }>;
      }>;
      accessors?: Array<{
        bufferView: number;
        byteOffset?: number;
        componentType: number;
        count: number;
        type: string;
      }>;
      bufferViews?: Array<{
        byteOffset?: number;
        byteStride?: number;
      }>;
    }

    const glbBuf = readFileSync(resolve(process.cwd(), 'public', 'Duramax_LLY_2005_66L_V8.glb'));
    const glbView = new DataView(glbBuf.buffer, glbBuf.byteOffset, glbBuf.byteLength);
    const jsonLen = glbView.getUint32(12, true);
    const doc = JSON.parse(
      new TextDecoder('utf-8').decode(glbBuf.subarray(20, 20 + jsonLen)),
    ) as GlbDoc;
    const binStart = 20 + jsonLen + 8;

    const nodes = doc.nodes ?? [];
    const meshes = doc.meshes ?? [];
    const accessors = doc.accessors ?? [];
    const bufferViews = doc.bufferViews ?? [];
    const rootIndices = doc.scenes?.[doc.scene ?? 0]?.nodes ?? [];

    const { exterior } = computeEngineLayout(engineConfig, valveConfig, detailConfig);
    const [c0, c1, c2] = exterior.basisColumnsProjectFromFile;
    const s = exterior.uniformScale;
    const [tx, ty, tz] = exterior.translationM;

    const regMat = new THREE.Matrix4().set(
      s * c0[0], s * c1[0], s * c2[0], tx,
      s * c0[1], s * c1[1], s * c2[1], ty,
      s * c0[2], s * c1[2], s * c2[2], tz,
      0, 0, 0, 1,
    );

    function nodeLocalMatrix(nd: GlbNode): THREE.Matrix4 {
      if (nd.matrix && nd.matrix.length === 16) {
        return new THREE.Matrix4().fromArray(nd.matrix);
      }
      const pos = new THREE.Vector3(...(nd.translation ?? [0, 0, 0]));
      const quat = new THREE.Quaternion(...(nd.rotation ?? [0, 0, 0, 1]));
      const scl = new THREE.Vector3(...(nd.scale ?? [1, 1, 1]));
      return new THREE.Matrix4().compose(pos, quat, scl);
    }

    function computeSubtreeBoundsMm(
      startNodeIdx: number,
      partIdFilter?: string,
    ): { min: [number, number, number]; max: [number, number, number] } {
      const box = new THREE.Box3();
      const v = new THREE.Vector3();

      function visit(nIdx: number, parentWorld: THREE.Matrix4): void {
        const nd = nodes[nIdx]!;
        const world = parentWorld.clone().multiply(nodeLocalMatrix(nd));
        if (nd.mesh !== undefined) {
          const m = meshes[nd.mesh]!;
          const partId = nd.extras?.partId ?? m.extras?.partId;
          if (!partIdFilter || partId === partIdFilter) {
            for (const prim of m.primitives) {
              const acc = accessors[prim.attributes.POSITION!]!;
              expect(acc.componentType).toBe(5126);
              expect(acc.type).toBe('VEC3');
              const bv = bufferViews[acc.bufferView]!;
              const stride = bv.byteStride ?? 12;
              const base = binStart + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
              for (let i = 0; i < acc.count; i += 1) {
                const off = base + i * stride;
                v.set(
                  glbView.getFloat32(off, true),
                  glbView.getFloat32(off + 4, true),
                  glbView.getFloat32(off + 8, true),
                )
                  .applyMatrix4(world)
                  .multiplyScalar(1000);
                box.expandByPoint(v);
              }
            }
          }
        }
        for (const ch of nd.children ?? []) {
          visit(ch, world);
        }
      }

      visit(startNodeIdx, regMat);
      expect(box.isEmpty()).toBe(false);
      return {
        min: [box.min.x, box.min.y, box.min.z],
        max: [box.max.x, box.max.y, box.max.z],
      };
    }

    const groupRootIdx = (name: string): number => {
      const idx = rootIndices.find((i) => nodes[i]?.name === name);
      expect(idx, `Missing top-level GLB group "${name}"`).toBeDefined();
      return idx!;
    };

    const anchorGroupPairs: ReadonlyArray<
      [keyof typeof EXTERIOR_SHELL_LABEL_ANCHORS_MM, string]
    > = [
      ['turbocharger', 'turbo'],
      ['harmonic-balancer', 'beltDrive'],
      ['oil-pan', 'blockPan'],
    ];

    for (const [anchorKey, groupName] of anchorGroupPairs) {
      const anchor = EXTERIOR_SHELL_LABEL_ANCHORS_MM[anchorKey];
      const bounds = computeSubtreeBoundsMm(groupRootIdx(groupName));
      for (let axis = 0; axis < 3; axis += 1) {
        expect(
          anchor[axis],
          `${anchorKey}[${axis}] = ${anchor[axis]} below ${groupName} min ${bounds.min[axis]}`,
        ).toBeGreaterThanOrEqual(bounds.min[axis]!);
        expect(
          anchor[axis],
          `${anchorKey}[${axis}] = ${anchor[axis]} above ${groupName} max ${bounds.max[axis]}`,
        ).toBeLessThanOrEqual(bounds.max[axis]!);
      }
    }

    const damperBounds = computeSubtreeBoundsMm(groupRootIdx('beltDrive'), 'ext_damper');
    const damperCenter: [number, number, number] = [
      0.5 * (damperBounds.min[0] + damperBounds.max[0]),
      0.5 * (damperBounds.min[1] + damperBounds.max[1]),
      0.5 * (damperBounds.min[2] + damperBounds.max[2]),
    ];
    const hbAnchor = EXTERIOR_SHELL_LABEL_ANCHORS_MM['harmonic-balancer'];
    const distToDamperCenterMm = Math.hypot(
      hbAnchor[0] - damperCenter[0],
      hbAnchor[1] - damperCenter[1],
      hbAnchor[2] - damperCenter[2],
    );
    expect(distToDamperCenterMm).toBeLessThanOrEqual(1.0);
  });
});
