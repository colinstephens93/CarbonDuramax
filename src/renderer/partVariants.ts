// Pure, Three.js-free visual variant contracts, shell-split specs, triangle caps, and explode helper
// (Milestone 8, D-038; docs/specs/M8-part-variants.md §§2, 3.4, 4.2, 6.1).
// Importable directly by Node asset and budget-guard tests without loading Three.js or a DOM.

import type { PartSlotId } from '../core/interfaces';

export interface ExteriorPreservedSubtreeSpec {
  readonly id: string;
  readonly group: string;
  readonly childIndex?: number;
}

export type ExternalVisualSlotId = 'turbo' | 'intake' | 'exhaust' | 'intercooler';

export const EXTERNAL_VISUAL_SLOTS: readonly ExternalVisualSlotId[] = [
  'turbo',
  'intake',
  'exhaust',
  'intercooler',
];

export const VISUAL_VARIANT_SLOTS: readonly PartSlotId[] = [
  ...EXTERNAL_VISUAL_SLOTS,
  'pistons',
];

export const EXTERIOR_PRESERVED_SUBTREES: readonly ExteriorPreservedSubtreeSpec[] = [
  { id: 'turbo_unit', group: 'turbo', childIndex: 3 },
  { id: 'turbo_downpipe', group: 'turbo', childIndex: 2 },
  { id: 'intake_tract', group: 'intake' },
];

export const EXTERIOR_PRESERVED_TRIANGLES: Readonly<Record<string, number>> = {
  turbo_unit: 3400,
  turbo_downpipe: 800,
  intake_tract: 2300,
};

export const VARIANT_TRIANGLE_CAPS: Readonly<Record<string, number>> = {
  turbo_large: 3600,
  intake_highflow: 2600,
  exhaust_4in: 2800,
  intercooler_upgraded: 1800,
  pistons_lowcomp: 5200,
};

export const SHELL_PARTS_REPLACED_BY_SLOT: Readonly<
  Partial<Record<PartSlotId, readonly string[]>>
> = {
  turbo: ['turbo_unit'],
  intake: ['intake_tract'],
  exhaust: ['turbo_downpipe'],
  intercooler: [],
};

export interface VisualVariantDescriptor {
  readonly slotId: PartSlotId;
  readonly variantId: string;
  readonly modelPath: string;
  readonly explodeVectorMm: readonly [number, number, number];
}

function normalizeZero(value: number): number {
  return value === 0 ? 0 : value;
}

/**
 * Computes the project-frame explode translation in millimetres for a scene-placed external variant.
 * Clamps `e` to `[0, 1]` (non-finite -> 0) and returns exact `[0, 0, 0]` when `e <= 0`.
 */
export function computeVariantExplodeOffsetMm(
  explodeVectorMm: readonly [number, number, number],
  e: number,
): [number, number, number] {
  if (!Number.isFinite(e) || e <= 0) {
    return [0, 0, 0];
  }
  const clamped = e >= 1 ? 1 : e;
  return [
    normalizeZero(explodeVectorMm[0] * clamped),
    normalizeZero(explodeVectorMm[1] * clamped),
    normalizeZero(explodeVectorMm[2] * clamped),
  ];
}
