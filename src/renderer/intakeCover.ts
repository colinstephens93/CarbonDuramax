// Pure, Three.js-free contract constants, planform/envelope geometry, visibility/explode helpers,
// and load-order-safe exterior material ghost registry for the optional LLY intake manifold cover
// (GM 21994000; Milestone 12, D-046; docs/specs/M12-intake-cover.md §§4–5, §9).
// Importable directly by Node asset and runtime unit tests without loading Three.js or a DOM.

import { computeVariantExplodeOffsetMm } from './partVariants';

export const INTAKE_COVER_MODEL_PATH = 'models/intake_cover_lly.glb';
export const INTAKE_COVER_ROOT_NAME = 'intake_cover_lly';
export const INTAKE_COVER_BODY_MESH_NAME = 'ext_intake_cover_body';
export const INTAKE_COVER_LETTERING_MESH_NAME = 'ext_intake_cover_lettering';

export const INTAKE_COVER_DEFAULT_ENABLED = false;

export const INTAKE_COVER_BODY_TRIANGLE_CAP = 1_200;
export const INTAKE_COVER_LETTERING_TRIANGLE_CAP = 600;
export const INTAKE_COVER_TRIANGLE_CAP = 1_800;
export const INTAKE_COVER_LETTERING_EXPECTED_TRIANGLES = 540;
export const INTAKE_COVER_LETTERING_EXPECTED_COMPONENTS = 45;
export const INTAKE_COVER_BODY_EXPECTED_COMPONENTS = 3;
export const INTAKE_COVER_MAX_FILE_BYTES = 65_536;
export const INTAKE_COVER_SECTION_CAP_TRIANGLE_CAP = 300;
export const INTAKE_COVER_DRAW_CALLS = 2;

export const INTAKE_COVER_EXPLODE_VECTOR_MM: readonly [number, number, number] = [0, 0, 260];

/**
 * Six-vertex clearance-driven shield planform in project XY (mm), P1..P6 counter-clockwise
 * (Spec §4.2 — labeled placeholder sized to the measured M10 shell, not form-matched).
 */
export const INTAKE_COVER_PLANFORM_MM: ReadonlyArray<readonly [number, number]> = [
  [245.0, -40.0], // P1
  [320.0, -40.0], // P2
  [320.0, -120.0], // P3
  [400.0, -120.0], // P4
  [400.0, 120.0], // P5
  [245.0, 120.0], // P6
];

export const INTAKE_COVER_BODY_Z_MIN_MM = 370.0;
export const INTAKE_COVER_BODY_Z_MAX_MM = 417.2;
export const INTAKE_COVER_LETTER_RELIEF_MM = 0.8;
export const INTAKE_COVER_LETTER_Z_MAX_MM = 418.0;
export const INTAKE_COVER_WALL_MM = 2.5;
export const INTAKE_COVER_ENVELOPE_Z_MIN_MM = 333.4;

export interface IntakeCoverMarkerSpec {
  readonly name: string;
  readonly positionMm: readonly [number, number, number];
  readonly normal: readonly [number, number, number];
}

export const INTAKE_COVER_MARKERS: readonly IntakeCoverMarkerSpec[] = [
  {
    name: 'if_intake_cover_rear_bolt',
    positionMm: [260.0, 0.0, 333.4],
    normal: [0, 0, 1],
  },
  {
    name: 'if_intake_cover_duct_clamp',
    positionMm: [372.0, -95.4, 353.4],
    normal: [0, 0, 1],
  },
];

export const INTAKE_COVER_LEGEND = ['6.6', 'TURBO', 'DIESEL'] as const;

/**
 * Visibility state machine (Spec §2.1, §5.1):
 * Cover renders only when explicitly enabled AND exterior context (Exterior or X-Ray) is active.
 */
export function computeIntakeCoverVisible(
  enabled: boolean,
  exteriorVisible: boolean,
  xrayEnabled: boolean,
): boolean {
  return Boolean(enabled) && (Boolean(exteriorVisible) || Boolean(xrayEnabled));
}

/**
 * Project-frame explode translation in mm (`+Z 260 * e`, clamped to `[0, 1]`, exact `0` at `e <= 0`).
 */
export function computeIntakeCoverExplodeOffsetMm(
  explodeFactor: number,
): [number, number, number] {
  return computeVariantExplodeOffsetMm(INTAKE_COVER_EXPLODE_VECTOR_MM, explodeFactor);
}

function distancePointToSegment2DMm(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t =
    lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/**
 * Tests whether `(xMm, yMm)` lies inside or on the boundary of `INTAKE_COVER_PLANFORM_MM` (P1..P6).
 */
export function isPointInsideIntakeCoverPlanformMm(xMm: number, yMm: number): boolean {
  if (!Number.isFinite(xMm) || !Number.isFinite(yMm)) {
    return false;
  }
  const n = INTAKE_COVER_PLANFORM_MM.length;
  for (let i = 0; i < n; i += 1) {
    const [ax, ay] = INTAKE_COVER_PLANFORM_MM[i]!;
    const [bx, by] = INTAKE_COVER_PLANFORM_MM[(i + 1) % n]!;
    if (distancePointToSegment2DMm(xMm, yMm, ax, ay, bx, by) <= 1e-9) {
      return true;
    }
  }
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const [xi, yi] = INTAKE_COVER_PLANFORM_MM[i]!;
    const [xj, yj] = INTAKE_COVER_PLANFORM_MM[j]!;
    if (yi > yMm !== yj > yMm && xMm < ((xj - xi) * (yMm - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Shortest Euclidean distance in mm from `(xMm, yMm, zMm)` to the closed cover body envelope
 * (`INTAKE_COVER_PLANFORM_MM` extruded across `[INTAKE_COVER_BODY_Z_MIN_MM, INTAKE_COVER_BODY_Z_MAX_MM]`).
 * Returns `0` for points inside or on the envelope boundary.
 */
export function distanceToIntakeCoverEnvelopeMm(
  xMm: number,
  yMm: number,
  zMm: number,
): number {
  const inPlanform = isPointInsideIntakeCoverPlanformMm(xMm, yMm);
  let dxy = 0;
  if (!inPlanform) {
    dxy = Number.POSITIVE_INFINITY;
    const n = INTAKE_COVER_PLANFORM_MM.length;
    for (let i = 0; i < n; i += 1) {
      const [ax, ay] = INTAKE_COVER_PLANFORM_MM[i]!;
      const [bx, by] = INTAKE_COVER_PLANFORM_MM[(i + 1) % n]!;
      const segDist = distancePointToSegment2DMm(xMm, yMm, ax, ay, bx, by);
      if (segDist < dxy) {
        dxy = segDist;
      }
    }
  }
  const dz =
    zMm < INTAKE_COVER_BODY_Z_MIN_MM
      ? INTAKE_COVER_BODY_Z_MIN_MM - zMm
      : zMm > INTAKE_COVER_BODY_Z_MAX_MM
        ? zMm - INTAKE_COVER_BODY_Z_MAX_MM
        : 0;
  if (inPlanform && dz === 0) {
    return 0;
  }
  return Math.hypot(dxy, dz);
}

export interface GhostableMaterial {
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
  needsUpdate?: boolean;
}

interface MaterialGhostSnapshot {
  readonly transparent: boolean;
  readonly opacity: number;
  readonly depthWrite: boolean;
}

export interface ExteriorGhostRegistry {
  register(materials: Iterable<GhostableMaterial>): void;
  setGhosted(ghosted: boolean): void;
  isGhosted(): boolean;
  readonly size: number;
  clear(): void;
}

/**
 * Three.js-free, load-order-safe material ghost registry (Spec §5.1, §5.2 item 4, §9 test 7).
 * Captures each material's authored `{ transparent, opacity, depthWrite }` snapshot once at
 * registration, immediately applies ghosting if `isGhosted()` is already true (so late-loading
 * assets never stay opaque under X-Ray), and restores the exact snapshot when `setGhosted(false)` runs.
 */
export function createExteriorGhostRegistry(opacity = 0.22): ExteriorGhostRegistry {
  const snapshots = new Map<GhostableMaterial, MaterialGhostSnapshot>();
  let ghosted = false;

  const applyGhostToMaterial = (mat: GhostableMaterial): void => {
    const changed =
      mat.transparent !== true || mat.opacity !== opacity || mat.depthWrite !== false;
    mat.transparent = true;
    mat.opacity = opacity;
    mat.depthWrite = false;
    if (changed && 'needsUpdate' in mat) {
      mat.needsUpdate = true;
    }
  };

  const restoreMaterial = (mat: GhostableMaterial, snap: MaterialGhostSnapshot): void => {
    const changed =
      mat.transparent !== snap.transparent ||
      mat.opacity !== snap.opacity ||
      mat.depthWrite !== snap.depthWrite;
    mat.transparent = snap.transparent;
    mat.opacity = snap.opacity;
    mat.depthWrite = snap.depthWrite;
    if (changed && 'needsUpdate' in mat) {
      mat.needsUpdate = true;
    }
  };

  return {
    register(materials: Iterable<GhostableMaterial>): void {
      for (const mat of materials) {
        if (!snapshots.has(mat)) {
          snapshots.set(mat, {
            transparent: mat.transparent,
            opacity: mat.opacity,
            depthWrite: mat.depthWrite,
          });
        }
        if (ghosted) {
          applyGhostToMaterial(mat);
        }
      }
    },

    setGhosted(nextGhosted: boolean): void {
      const target = Boolean(nextGhosted);
      ghosted = target;
      if (target) {
        for (const mat of snapshots.keys()) {
          applyGhostToMaterial(mat);
        }
      } else {
        for (const [mat, snap] of snapshots) {
          restoreMaterial(mat, snap);
        }
      }
    },

    isGhosted(): boolean {
      return ghosted;
    },

    get size(): number {
      return snapshots.size;
    },

    clear(): void {
      snapshots.clear();
      ghosted = false;
    },
  };
}
