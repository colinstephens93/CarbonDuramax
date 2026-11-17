// Pure, Three.js-free internal visual variant constants, helpers, and 24-entry catalog
// visual-disposition register (Milestone 13, D-048; docs/specs/M13-internal-variants.md §§2, 4, 5.1).
// Importable directly by Node tests without Three.js or a DOM.

import type { PartSlotId } from '../core/interfaces';

export const ROD_VARIANT_ID = 'rods_forged' as const;
export const PISTON_VARIANT_ID = 'pistons_lowcomp' as const;

export const ROD_VARIANT_MODEL_PATH = 'models/variants/rot_conrod_c1_forged.glb' as const;

export const ROD_VARIANT_TRIANGLE_CAP = 1_400;
export const ROD_VARIANT_STOCK_TRIANGLES = 1_180;
export const ROD_VARIANT_INSTANCES = 8;
export const ROD_VARIANT_SCENE_DELTA_CAP =
  (ROD_VARIANT_TRIANGLE_CAP - ROD_VARIANT_STOCK_TRIANGLES) * ROD_VARIANT_INSTANCES;

export const PISTON_VARIANT_TRIANGLE_CAP = 5_200;
export const PISTON_STOCK_TRIANGLES = 4_832;
export const PISTON_VARIANT_INSTANCES = 8;
export const PISTON_VARIANT_SCENE_DELTA_CAP =
  (PISTON_VARIANT_TRIANGLE_CAP - PISTON_STOCK_TRIANGLES) * PISTON_VARIANT_INSTANCES;

export const ROD_VARIANT_MAX_FILE_BYTES = 49_152;

export const ROD_VARIANT_ROOT_NAME = 'rot_conrod_c1_forged' as const;
export const ROD_VARIANT_SMALLEND_NAME = 'rot_conrod_smallend_c1_forged' as const;
export const ROD_VARIANT_SMALLEND_Z_MM = 163.0;
export const ROD_VARIANT_JOURNAL_DIAMETER_MM = 62.9;
export const ROD_VARIANT_WRIST_PIN_DIAMETER_MM = 34.5;
export const ROD_VARIANT_BIG_END_WIDTH_MM = 27.676;
export const ROD_VARIANT_BEAM_FLANGE_Y_MM = 30.343;
export const ROD_VARIANT_SMALL_END_FLANGE_Y_MM = 18.568;
export const ROD_VARIANT_FLANGE_THICKNESS_MM = 8.177;
export const ROD_VARIANT_WEB_HALF_WIDTH_MM = 5.258;
export const ROD_VARIANT_EXPECTED_COMPONENTS = 10;
export const ROD_VARIANT_EXPECTED_MATERIALS = 3;

export const INTERNAL_VISUAL_SLOTS = ['pistons', 'rods'] as const;
export type InternalVisualSlotId = (typeof INTERNAL_VISUAL_SLOTS)[number];

export function isInternalVisualSlot(slotId: string): slotId is InternalVisualSlotId {
  return slotId === 'pistons' || slotId === 'rods';
}

export type InternalVariantSelectionInput =
  | readonly (string | { readonly variantId: string; readonly slotId?: string })[]
  | Readonly<Partial<Record<PartSlotId, string>>>;

/**
 * Computes the cap-conservative full-engine scene triangle delta for selected internal variants:
 * - `pistons_lowcomp`: `(5,200 - 4,832) * 8 = +2,944`
 * - `rods_forged`: `(1,400 - 1,180) * 8 = +1,760`
 * - both: `+4,704`
 */
export function computeInternalVariantSceneDelta(selections: InternalVariantSelectionInput): number {
  const ids = new Set<string>();
  if (Array.isArray(selections)) {
    for (const item of selections) {
      if (typeof item === 'string') {
        ids.add(item);
      } else if (item && typeof item === 'object' && 'variantId' in item) {
        ids.add(item.variantId);
      }
    }
  } else {
    const rec = selections as Readonly<Partial<Record<PartSlotId, string>>>;
    for (const val of Object.values(rec)) {
      if (typeof val === 'string') {
        ids.add(val);
      }
    }
  }

  let delta = 0;
  if (ids.has(PISTON_VARIANT_ID)) {
    delta += PISTON_VARIANT_SCENE_DELTA_CAP;
  }
  if (ids.has(ROD_VARIANT_ID)) {
    delta += ROD_VARIANT_SCENE_DELTA_CAP;
  }
  return delta;
}

/**
 * Computes the full-engine scene triangle delta `(trianglesPerInstance - 1,180) * 8` for a rod variant.
 */
export function computeRodVariantSceneDelta(trianglesPerInstance: number): number {
  return (trianglesPerInstance - ROD_VARIANT_STOCK_TRIANGLES) * ROD_VARIANT_INSTANCES;
}

/**
 * Shared three-term internal scene triangle formula (`baseNonPistonTriangles` excludes stock conrods):
 * `baseNonPistonTriangles + currentRodTriangles + currentPistonTriangles`.
 */
export function computeCombinedInternalSceneTriangles(
  baseNonPistonTriangles: number,
  currentRodTriangles: number,
  currentPistonTriangles: number,
): number {
  return baseNonPistonTriangles + currentRodTriangles + currentPistonTriangles;
}

export interface InternalPrimEntry<TPrims> {
  readonly slotId: InternalVisualSlotId;
  readonly prims: TPrims;
}

/**
 * Pure slot filter over `[variantId, { slotId, prims }]` entries so piston batch creation
 * can never consume rod primitives and vice versa.
 */
export function filterInternalPrimEntriesBySlot<TPrims>(
  entries: Iterable<readonly [string, InternalPrimEntry<TPrims>]>,
  slotId: InternalVisualSlotId,
): Array<[string, InternalPrimEntry<TPrims>]> {
  const filtered: Array<[string, InternalPrimEntry<TPrims>]> = [];
  for (const [variantId, entry] of entries) {
    if (entry.slotId === slotId) {
      filtered.push([variantId, entry]);
    }
  }
  return filtered;
}

export interface VariantLoadSettleState {
  readonly failedVariantIds: string[];
  readonly variantsLoaded: true;
}

/**
 * Pure settle helper returning the ordered failed variant IDs and `variantsLoaded: true`
 * once all configured variant loads have settled.
 */
export function resolveVariantLoadFailure(
  configuredVariantIds: readonly string[],
  failedVariantIds: Iterable<string>,
): VariantLoadSettleState {
  const failedSet = new Set<string>(failedVariantIds);
  return {
    failedVariantIds: configuredVariantIds.filter((id) => failedSet.has(id)),
    variantsLoaded: true,
  };
}

export const CAM_OWNER_DECISION = 'OD-1-A' as const;

export const CAM_OWNER_DECISION_TEXT =
  "M13 adopts Option A as the spec's decision. The camshaft remains visual-less; a future cam visual is conditional on a separate decision to wire lobe lift into the valve kinematics. If the owner selects B or C, this spec is withdrawn and revised before the build starts; the builder must not add a decorative cam under this spec." as const;

export const ROD_VARIANT_ILLUSTRATIVE_NOTE =
  'The forged connecting-rod variant preserves the stock 163.0 / 62.9 / 34.5 / 27.676 mm interface; its heavier H-beam flange/web magnitudes (30.343 / 18.568 / 8.177 / 5.258 mm) and stepped 12-point cap fasteners are illustrative placeholders, not measured aftermarket dimensions.' as const;

export type CatalogVisualDispositionKind = 'variant-model' | 'stock' | 'no-visual';

export interface CatalogVisualDisposition {
  readonly id: string;
  readonly slotId: PartSlotId;
  readonly kind: CatalogVisualDispositionKind;
  readonly reason: string;
  readonly evidence: string;
  readonly ownerDecision?: string;
}

export const INTERNAL_VISUAL_DISPOSITIONS: readonly CatalogVisualDisposition[] = [
  // 12 stock entries (shipped baseline, modelPath: null)
  {
    id: 'turbo_stock',
    slotId: 'turbo',
    kind: 'stock',
    reason: 'Shipped stock baseline represented by exterior shell turbo_unit (GT3788VA).',
    evidence: 'public/Duramax_LLY_2005_66L_V8.glb (turbo/turbo_unit); catalog/stock.json.',
  },
  {
    id: 'tune_stock',
    slotId: 'tune',
    kind: 'stock',
    reason: 'Stock ECM software calibration baseline; no physical 3D geometry.',
    evidence: 'catalog/stock.json performanceParams fuel/boost/AFR/EGT tables.',
  },
  {
    id: 'injectors_stock',
    slotId: 'injectors',
    kind: 'stock',
    reason: 'Shipped stock baseline represented by fuel_injector_c1_stock.glb and shell injectors.',
    evidence: 'public/models/fuel_injector_c1_stock.glb; shell injectors group.',
  },
  {
    id: 'cp3_stock',
    slotId: 'cp3',
    kind: 'stock',
    reason: 'Shipped stock baseline represented by exterior shell cp3Fuel/ext_cp3.',
    evidence: 'public/Duramax_LLY_2005_66L_V8.glb (cp3Fuel/ext_cp3); catalog/stock.json.',
  },
  {
    id: 'intercooler_stock',
    slotId: 'intercooler',
    kind: 'stock',
    reason: 'Stock charge-air intercooler baseline (vehicle-side hardware absent from engine shell).',
    evidence: 'catalog/stock.json; D-038 / M8 §2.',
  },
  {
    id: 'intake_stock',
    slotId: 'intake',
    kind: 'stock',
    reason: 'Shipped stock baseline represented by exterior shell intake group (mouthpiece + duct).',
    evidence: 'public/Duramax_LLY_2005_66L_V8.glb (intake); catalog/stock.json.',
  },
  {
    id: 'exhaust_stock',
    slotId: 'exhaust',
    kind: 'stock',
    reason: 'Shipped stock baseline represented by exterior shell turbo/turbo_downpipe.',
    evidence: 'public/Duramax_LLY_2005_66L_V8.glb (turbo/turbo_downpipe); catalog/stock.json.',
  },
  {
    id: 'heads_stock',
    slotId: 'heads',
    kind: 'stock',
    reason: 'Shipped stock baseline represented by sta_head_c1_stock.glb and shell heads group.',
    evidence: 'public/models/sta_head_c1_stock.glb; shell heads group.',
  },
  {
    id: 'camshaft_stock',
    slotId: 'camshaft',
    kind: 'stock',
    reason: 'Stock camshaft baseline; valvetrain geometry starts at the lifters.',
    evidence: 'assets-src/blender/build_cylinder1.py; catalog/stock.json.',
  },
  {
    id: 'pistons_stock',
    slotId: 'pistons',
    kind: 'stock',
    reason: 'Shipped stock baseline represented by instanced rot_piston_c1_stock.glb.',
    evidence: 'public/models/rot_piston_c1_stock.glb; catalog/stock.json.',
  },
  {
    id: 'rods_stock',
    slotId: 'rods',
    kind: 'stock',
    reason: 'Shipped stock baseline represented by instanced rot_conrod_c1_stock.glb forged H-beam.',
    evidence: 'public/models/rot_conrod_c1_stock.glb; catalog/stock.json.',
  },
  {
    id: 'fuelRail_stock',
    slotId: 'fuelRail',
    kind: 'stock',
    reason: 'Stock-only common-rail manifold slot with no modified catalog entry; represented in shell cp3Fuel/ext_hp_rails.',
    evidence: 'catalog/stock.json; public/Duramax_LLY_2005_66L_V8.glb (cp3Fuel/ext_hp_rails).',
  },

  // 6 variant-model entries (5 M8 + 1 M13)
  {
    id: 'turbo_large',
    slotId: 'turbo',
    kind: 'variant-model',
    reason: 'Scene-placed larger VGT turbocharger replacing shell turbo_unit (M8, D-038).',
    evidence: 'public/models/variants/turbo_unit_engine_large.glb; docs/M8-VARIANTS.md.',
  },
  {
    id: 'injectors_plus30',
    slotId: 'injectors',
    kind: 'no-visual',
    reason: '+30% delivery is nozzle-internal abrasive-flow honing; shipped internal injector has a smooth nozzle cone with no holes, hole diameter is unpublished, and aftermarket bodies are remanufactured stock Bosch bodies.',
    evidence: 'Exergy reman injector listing (grade C); L7 §12 / cross-check §11; fuel_injector_c1_stock.glb.',
  },
  {
    id: 'cp3_stroker',
    slotId: 'cp3',
    kind: 'no-visual',
    reason: 'M10 cured the M8 missing-model premise via cp3Fuel/ext_cp3, but the stroker change is internal cam-ring stroke and no source publishes an external housing difference (external identity is inferred from the replacement-part listing, not measured).',
    evidence: 'BD Diesel CP3 101 & Exergy 10 mm stroker listing (grades B/C); M13 survey §5.',
  },
  {
    id: 'tune_tow',
    slotId: 'tune',
    kind: 'no-visual',
    reason: 'ECM software calibration (fuel-request, boost, AFR, and EGT tables only) with no physical 3D geometry.',
    evidence: 'catalog/modified.json performanceParams; M13 spec §2.6.',
  },
  {
    id: 'tune_performance',
    slotId: 'tune',
    kind: 'no-visual',
    reason: 'ECM software calibration (fuel-request, boost, AFR, and EGT tables only) with no physical 3D geometry.',
    evidence: 'catalog/modified.json performanceParams; M13 spec §2.6.',
  },
  {
    id: 'intake_highflow',
    slotId: 'intake',
    kind: 'variant-model',
    reason: 'Scene-placed 4-inch high-flow intake tract and conical filter replacing shell intake group (M8, D-038).',
    evidence: 'public/models/variants/intake_tract_engine_highflow.glb; docs/M8-VARIANTS.md.',
  },
  {
    id: 'exhaust_4in',
    slotId: 'exhaust',
    kind: 'variant-model',
    reason: 'Scene-placed 4-inch downpipe and muffler section replacing shell turbo_downpipe (M8, D-038).',
    evidence: 'public/models/variants/exhaust_system_engine_4inch.glb; docs/M8-VARIANTS.md.',
  },
  {
    id: 'intercooler_upgraded',
    slotId: 'intercooler',
    kind: 'variant-model',
    reason: 'Scene-placed bar-and-plate intercooler core at the hot-side charge-pipe service datum (M8, D-038).',
    evidence: 'public/models/variants/intercooler_core_engine_upgraded.glb; docs/M8-VARIANTS.md.',
  },
  {
    id: 'heads_ported',
    slotId: 'heads',
    kind: 'no-visual',
    reason: 'CNC porting is internal to intake/exhaust port runners that are neither published for the LLY nor modelled in sta_head_c1_stock.glb or shell heads; no source publishes an external-casting difference (external identity inferred from casting listing, not measured).',
    evidence: 'L7 §10; PPE CNC-ported head listing (grade C); sta_head_c1_stock.glb; M13 survey §7.',
  },
  {
    id: 'cam_performance',
    slotId: 'camshaft',
    kind: 'no-visual',
    reason: 'No camshaft geometry exists (valvetrain starts at lifters), duration/timing are unpublished, and adding a cam visual implies a valve-kinematics decision; deferred under Owner Decision OD-1 (Option A).',
    evidence: 'GM LLY service manual lobe lift/rocker ratios (grade A, D-044); L7 §4; M13 spec §2.4 (OD-1).',
    ownerDecision: CAM_OWNER_DECISION,
  },
  {
    id: 'pistons_lowcomp',
    slotId: 'pistons',
    kind: 'variant-model',
    reason: 'Part-local 16.5:1 open-dish forged piston swapped across all eight cylinders (M8, D-038).',
    evidence: 'public/models/variants/rot_piston_c1_lowcomp.glb; docs/M8-VARIANTS.md.',
  },
  {
    id: 'rods_forged',
    slotId: 'rods',
    kind: 'variant-model',
    reason: 'Part-local stock-interface heavier forged H-beam connecting rod with wider/thicker flanges, thicker web, and illustrative stepped 12-point cap fasteners swapped across all eight rods (M13, D-048).',
    evidence: 'Callies Compstar Xtreme qualitative H-beam/ARP L19 description (single grade-C source); GM LLY 163.0 / 62.9 / 34.5 mm stock interface; placeholder flange/web/fastener magnitudes.',
  },
];
