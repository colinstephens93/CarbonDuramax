# Milestone 13 — Internal-Part Visual Variants & Catalog Closure Record

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) · Milestone 13 Spec: [`docs/specs/M13-internal-variants.md`](./specs/M13-internal-variants.md) · Research survey: [`docs/research/M13-internal-variants-survey.md`](./research/M13-internal-variants-survey.md) · Measurements: [`docs/M13-MEASUREMENTS.md`](./M13-MEASUREMENTS.md) · Decisions: [`docs/DECISIONS.md`](./DECISIONS.md) **D-038**, **D-044**, **D-046**, **D-047**, **D-048** · Prior records: [`docs/M7-DATA.md`](./M7-DATA.md), [`docs/M8-VARIANTS.md`](./M8-VARIANTS.md), [`docs/M10-EXTERIOR.md`](./M10-EXTERIOR.md), [`docs/M11-CUTAWAYS.md`](./M11-CUTAWAYS.md), [`docs/M12-COVER.md`](./M12-COVER.md)

---

## 1. Scope & 24-Entry Catalog Closure

Milestone 13 re-tests every internal/non-visual catalog entry recorded out of scope at Milestone 8 (**D-038**) against the current shipped scene (Milestone 10's rebuilt project-frame exterior shell, Milestone 11's CPU section-cap architecture, and Milestone 12's optional intake cover), adds **one** defensible illustrative internal 3D variant (`rods_forged`), records an explicit owner decision (**OD-1**) deferring the camshaft visual, and closes the visual disposition of all **24** catalog entries without inventing unsupported geometry:

| Disposition Group | Count | Catalog Entry IDs |
| --- | ---: | --- |
| **Variant 3D model (`modelPath !== null`)** | **6** | `turbo_large`, `intake_highflow`, `exhaust_4in`, `intercooler_upgraded`, `pistons_lowcomp` (M8) + **`rods_forged`** (M13) |
| **Stock baseline (`modelPath: null`)** | **12** | `turbo_stock`, `tune_stock`, `injectors_stock`, `cp3_stock`, `intercooler_stock`, `intake_stock`, `exhaust_stock`, `heads_stock`, `camshaft_stock`, `pistons_stock`, `rods_stock`, `fuelRail_stock` |
| **Modified no-visual (`modelPath: null`, recorded reason)** | **6** | `injectors_plus30`, `cp3_stroker`, `cam_performance` (**OD-1**), `heads_ported`, `tune_tow`, `tune_performance` |
| **Total catalog entries** | **24** | Machine-checked in `src/renderer/internalVariants.ts` (`INTERNAL_VISUAL_DISPOSITIONS`) |

The only catalog data change in Milestone 13 is setting `rods_forged.modelPath` from `null` to `"models/variants/rot_conrod_c1_forged.glb"` in `catalog/modified.json` (`explodeVectorMm` stays `[0, 0, 0]`, `performanceParams` stays `{}`, `compatibility` stays `{}`). `catalog/stock.json`, `catalog/schema.json`, `src/core/interfaces.ts` (D-010), and `src/perf/**` are byte-identical.

---

## 2. Shipped Geometry Inventory (Measured Baseline)

Measured directly from binary GLB read-back of the committed assets and instance counts in `src/renderer/engineScene.ts`:

| Part / Slot | Committed Asset & Contract Node(s) | Primitives | Tris / Instance | Scene Instances | Scene Tris | Cap Source |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Piston / `pistons` | `rot_piston_c1_stock.glb` → `rot_piston_c1_stock` | `3` | `4,832` | `7` std + `1` firing | `38,656` | Dynamic `piston_std`, `piston_firing` (+ M8 variant sets) |
| Connecting rod / `rods` | `rot_conrod_c1_stock.glb` → `rot_conrod_c1_stock` + `rot_conrod_smallend_c1_stock` | `2 + 1` | **`1,180`** (`892 + 288`) | **`8`** | **`9,440`** | Dynamic `conrod` (`×8`) + M13 `conrod_variant` (`×8`) |
| Crank throw / — | `rot_crankthrow_c1_stock.glb` → `rot_crankthrow_c1_stock` + `rot_crankpin_c1_stock` | `1 + 1` | `1,352` | `4` (shared pins) | `5,408` | Dynamic `crankthrow` |
| Cylinder head / `heads` | `sta_head_c1_stock.glb` → `sta_head_c1_stock` | `2` | `3,532` | `8` | `28,256` | Static `head` (`×8`); no internal ports |
| Fuel injector / `injectors` | `fuel_injector_c1_stock.glb` → `fuel_injector_c1_stock` | `2` | `924` | `8` | `7,392` | Static `injector` (`×8`); smooth cone tip, no holes |
| Intake valve + spring / — | `val_valve_intake_stock.glb` → `val_valve_intake_stock`, `val_spring_intake_stock` | `1 + 1` | `1,040 + 3,464` | `16 + 16` | `72,064` | Dynamic valve; spring `hullOnly` |
| Exhaust valve + spring / — | `val_valve_exhaust_stock.glb` → `val_valve_exhaust_stock`, `val_spring_exhaust_stock` | `1 + 1` | `1,040 + 3,464` | `16 + 16` | `72,064` | Dynamic valve; spring `hullOnly` |
| Valve bridge / — | `val_bridge_stock.glb` → `val_bridge_stock` | `1` | `408` | `16` | `6,528` | Dynamic `bridge` |
| Rocker arms / — | `val_rocker_stock.glb` → `val_rocker_intake_stock`, `val_rocker_exhaust_stock` | `1 + 1` | `620` each | `4 × 4` (RH/LH chiral) | `9,920` | Dynamic 4 batches |
| Pushrod + lifter / — | `val_pushrod_stock.glb` → `val_pushrod_stock`, `val_lifter_stock` | `1 + 1` | `840 + 432` | `16 + 16` | `20,352` | Dynamic `pushrod`, `lifter` |
| **Internal V8 subtotal** | `v8_detailed_internals` | `26` meshes | — | — | **`270,080`** | `baseNonPistonInternalTriangles = 221,984` (excludes stock rod + piston) |
| Main crank + ground + shell | Turned shaft (`1,080`) + ground (`64`) + `Duramax_LLY_2005_66L_V8.glb` (`37,100`, incl. `cp3Fuel` `1,400`, `injectors` `2,100`, `heads` `1,600`) | `1 + 1 + 23` | — | — | `38,244` | Static shaft + 23 shell sources (`skipWhenGhosted: true`); ground unclipped |
| **Stock scene total (Exterior On)** | — | — | — | — | **`308,324`** | M8 5-variant worst case = **`304,632`** |

---

## 3. The `rods_forged` Visual Variant — Contract, Dimensions, Provenance & Clearances

### 3.1 Asset Contract (`public/models/variants/rot_conrod_c1_forged.glb`)

| Item | Contract Requirement | Measured Blender 5.2.3 LTS Result |
| --- | --- | --- |
| Asset class | **Part-local internal variant** (same class as M8 `rot_piston_c1_lowcomp.glb`; D-038 / D-048) | Part-local GLB loaded via `loadPartGltf` + `extractAllPartPrimitives` |
| Build sources | `assets-src/blender/build_rod_variant.py` + `assets-src/rod_variant_dimensions.json` + interface inputs from `assets-src/dimensions.json` | Deterministic headless Blender `5.2.3 LTS` (`e13b728c6880`) |
| Hierarchy & pivot | Root `rot_conrod_c1_forged` at `(0, 0, 0)` + child `rot_conrod_smallend_c1_forged` at `(0, 0, 163.0) mm` | `(0.000, 0.000, 0.000) mm` root; `(0.000, 0.000, 163.000) mm` child |
| Primitives & materials | `3` indexed `POSITION` + `NORMAL` primitives; `3` untextured `MeshStandardMaterial`s (`mat_conrod_forged_steel`, `mat_conrod_bolts`, `mat_conrod_bushing`); `0` textures/images/UVs/skins/morphs/animations/`if_*` markers | `3` primitives / `3` materials (`0` net draw-call delta vs stock); `0` textures/UVs/markers |
| Triangle count | **`≤ 1,400` / instance** (`+1,760` cap scene delta across 8 rods) | **`1,372` / instance** (`1,084` rod + `288` small-end; **`+1,536`** measured scene delta across 8 rods) |
| File size | **`≤ 49,152 B` (`48.00 KiB`)** | **`47,976 B` (`46.85 KiB`)** · SHA-256 `816e24357b1d191ed7dd3d4bbe327d5e8179cc6178ab701371c7a0b953c1053d` |
| Watertightness (`1e-5 m` weld) | `0` boundary edges, `0` non-manifold edges, **`10` closed connected components** | **`0` boundary / `0` non-manifold / `10` closed components** (big end, small end, web, 2 flanges, 2 ears, 2 stepped fasteners, small-end bushing) |

### 3.2 Dimensions & Provenance

The forged connecting-rod variant preserves the stock 163.0 / 62.9 / 34.5 / 27.676 mm interface; its heavier H-beam flange/web magnitudes (30.343 / 18.568 / 8.177 / 5.258 mm) and stepped 12-point cap fasteners are illustrative placeholders, not measured aftermarket dimensions.

| Parameter | Variant Value | Stock Value | Unit | Provenance & Rationale |
| --- | ---: | ---: | --- | --- |
| Rod length (centre-to-centre) | **`163.000`** | `163.000` | mm | **Published length; c2c basis inferred/corroborated** — GM LLY service table (grade A; D-035; survey §3.1); stock kinematic interface preserved |
| Big-end journal bore | **`62.900`** | `62.900` | mm | **Published** — GM LLY service table (grade A; D-035); fits stock crankpin |
| Wrist-pin bore | **`34.500`** | `34.500` | mm | **Published** — GM LLY service table (grade A; D-035); fits stock piston pin |
| Big-end axial width | **`27.676`** | `27.676` | mm | **Stock model / code-derived** (`2 × 0.22 × 62.9`; `assets-src/dimensions.json` has no width/flange/web keys); preserves the `0.724 mm` shared-pin inter-rod gap |
| Big-end / small-end outer radii | **`42.143` / `23.805`** | `42.143` / `23.805` | mm | **Stock model** (`1.34 × 31.45` / `1.38 × 17.25`); outer housing and pin-boss clearance preserved |
| Overall part-local bounds | **`X ±13.838`, `Y ±48.725`, `Z −42.143…186.805`** | Identical | mm | **Stock envelope preserved** — every modified shank/fastener surface lies inward of the stock outer envelope |
| Beam flange outer Y (big end) | **`30.343`** | `26.129` | mm | **Labeled placeholder** (`+4.214 mm`/side); qualitative family from one grade-C vendor (Callies Compstar Xtreme "thickening up the flanges of the H beam"; single weak source, generic catalog entry) |
| Beam flange outer Y (small end) | **`18.568`** | `16.187` | mm | **Labeled placeholder** (`+2.381 mm`/side); tapered H-beam inside piston skirt |
| Flange thickness (Y) | **`8.177`** | `6.290` | mm | **Labeled placeholder** (`+1.887 mm`); thicker H-beam flange |
| Central web half-width (X) | **`5.258`** | `4.428` | mm | **Labeled placeholder** (`+0.830 mm`); Callies qualitative "reduced depth of cut towards the center of the rod" |
| Cap fasteners | **Stepped 12-sided head + integral washer flange** (`Y ≤ ±48.584`) | 6-point/smooth cap bolt (`Y ≤ ±48.254`) | mm | **Labeled placeholder, not published** — vendor lists "ARP L19 fasteners" (grade C) without specifying a 12-point head, washer flange, or stepped profile |

### 3.3 Clearances (Verified from Exported GLB)

| Check | Formula | Measured Clearance | Verdict |
| --- | --- | ---: | :---: |
| Shared-pin inter-rod axial gap | `2 × 14.2 − 27.676` | **`0.724 mm`** | **PASS** (unchanged from stock; `28.4 mm` aftermarket width would close to `0.0 mm`) |
| Outer bolt-ear envelope to cylinder bore wall | `103 / 2 − 48.725` | **`2.775 mm`** | **PASS** (unchanged from stock) |
| New H-beam flange to cylinder bore wall | `103 / 2 − 30.343` | **`21.157 mm`** | **PASS** |
| New H-beam flange to piston outer radius (conservative) | `51.425 − 30.343` | **`21.082 mm`** | **PASS** (inner skirt cavity is further away) |
| M3 / M10 shell containment & crank-web spacing | Identical outer bounding box to stock rod | **Unchanged** | **PASS** |

---

## 4. Re-Tested No-Visual Dispositions

Each non-visual modified entry was re-tested against the M10/M11/M12 codebase and graded external sources rather than copied from M8:

1. **`injectors_plus30` (`injectors`) — No-Visual.** Catalog delta: `maxFuelMm3` `120 → 156` (`+30 %`). The LLY uses a published **7-hole SAC** nozzle (grade B/C), but hole diameter is **not published** (`0.155 mm` vendor candidate / `0.15 mm` forum figure were rejected as low-confidence in the L7 cross-check), `fuel_injector_c1_stock.glb` models a smooth nozzle cone with **no holes**, and aftermarket high-flow LLY injectors use **remanufactured stock Bosch bodies** with abrasive-flow-honed nozzles (Exergy 45% Over listing, grade C). A ~0.155 mm hole delta is sub-pixel, inventing an external body change would be dishonest, and adding holes only to the variant would falsely imply stock injectors have none.
2. **`cp3_stroker` (`cp3`) — No-Visual (M8 Premise Cured, Conclusion Stands).** Catalog delta: `flowBaseKgH` `30 → 42`, `flowSlopeKgHPerRpm` `0.022 → 0.030`, `maxRailPsi` `23,000`. M8's premise ("no swappable pivot-placed model existed") **is cured by M10**: `Duramax_LLY_2005_66L_V8.glb` carries `cp3Fuel/ext_cp3` (`380` tris) and `exteriorLoader.ts` can isolate direct child `0` without touching the shell GLB. However, the 10 mm stroker's published change is **internal cam-ring stroke** on an LBZ-based replacement pump retaining the LLY FPR/stock mounting (BD Diesel CP3 101, grade B; Exergy `E04 10206`, grade C), and **no source publishes an external housing difference** (external identity is **inferred from the replacement-part listing, not measured**). Swapping an identical housing under a new name would fabricate a visual delta.
3. **`cam_performance` (`camshaft`) — No-Visual + Owner Decision OD-1.** Catalog delta: `veFactor` `1.0 → 1.04`. Stock lobe lift (`7.273 mm` intake / `5.907 mm` exhaust) and rocker ratios (`1.36:1` / `1.69:1`) are published (GM LLY service manual, grade A; **D-044**), partially updating M8's "lift unpublished" wording, but duration, LSA, and timing events remain **not published**, no camshaft geometry exists in the assembly (valvetrain starts at the lifters), and adding a cam visual requires a valve-kinematics decision (**OD-1**, §5 below).
4. **`heads_ported` (`heads`) — No-Visual.** Catalog delta: `flowFactor` `1.0 → 1.08`. CNC porting modifies internal intake/exhaust runners and bowls that are **not published** for the LLY (L7 §10; PPE CNC-ported head listing describes process only, grade C) and **not modelled** in `sta_head_c1_stock.glb` (`3,532` tris) or the shell's `heads` group (`1,600` tris). No source publishes an external casting difference (external identity is **inferred from the casting listing, not measured**), and adding guessed ports only to the variant would falsely imply the stock head has none.
5. **`tune_tow` & `tune_performance` (`tune`) — Visual-Less by Definition.** Both entries are **ECM software calibrations** (`performanceParams` fuel-request, boost, AFR, and EGT tables only); no physical 3D geometry exists or is implied.
6. **`fuelRail_stock` (`fuelRail`) — Stock-Only Baseline.** Stock-only slot with no modified catalog entry (`ext_hp_rails` in the M10 shell); rail volume and transient pressure droop lie outside the steady-state performance model.

---

## 5. Owner Decision OD-1 — Camshaft Visual & Valve Kinematics

| Option | Definition | Assessment |
| --- | --- | --- |
| **Option A — Defer (Adopted)** | No cam visual in M13; `cam_performance` stays `modelPath: null`; a future milestone may add cam geometry **and** wire lobe lift if the owner opens `src/core/kinematics.ts` / `src/config/valveConfig.ts` with a sourced profile. | **Adopted (`OD-1-A`).** Mechanically honest and preserves frozen core/config interfaces. |
| **Option B — Visual-Only Cam** | New cam geometry rotates at `0.5×` crank speed without driving valve motion. | **Rejected.** Mechanically dishonest: displayed lobes would not match displayed `sin²` valve lift. |
| **Option C — Cam + Kinematics** | New cam geometry plus changes to frozen `src/core/kinematics.ts` and `src/config/valveConfig.ts`. | **Deferred to a future milestone.** Requires published duration/timing data (unavailable) and a formal interface change. |

> **Owner Decision OD-1:** M13 adopts Option A as the spec's decision. The camshaft remains visual-less; a future cam visual is conditional on a separate decision to wire lobe lift into the valve kinematics. If the owner selects B or C, this spec is withdrawn and revised before the build starts; the builder must not add a decorative cam under this spec.

---

## 6. Interaction & Compatibility Contract

| Subsystem | M13 Behavior with `rods_forged` |
| --- | --- |
| **Build dropdown & stock restore** | Selecting `Heavy-Duty Forged Connecting Rods` swaps all `8` instanced rods from `conrod` (`9,440` tris) to `conrod_variant` (`10,976` measured tris; `11,200` cap); restoring `rods_stock` removes and hides `conrod_variant` and restores the exact M12 stock scene. |
| **Combined internal variants (`QA-02` fix + `N-02` slot filter)** | `loadedInternalPrimsById` tags each entry with `{ slotId, prims }` and `ensureVariantPistonBatchSetsBuilt()` filters strictly via `filterInternalPrimEntriesBySlot(..., 'pistons')`. Both internal swaps call one shared `recomputeCombinedInternalTriangles()` (`221,984 + currentRod + currentPiston`), yielding **`264,704`** runtime internal triangles when `rods_forged` (`10,976`) + `pistons_lowcomp` (`31,744`) are active together (`264,928` at the `11,200` rod cap; `274,784` cap-only; never the old-branch `263,168` piston-only overwrite). |
| **M4 Explode (`0–100 %`)** | Uses the existing M4 internal station-spread pipeline (`computeStationSpreadOffsetXMm` in `applyV8KinematicState`); `explodeVectorMm` is `[0, 0, 0]`. |
| **M11 Capped Cutaways** | Registered as dynamic `conrod_variant` (`instanced: true`, `count: 8`, `static: false`, `skipWhenGhosted: false`). Every removed stock/variant rod mesh sets `m.visible = false` in addition to `v8Batches.root.remove(m)` so `isObjectAndAncestorsVisible` skips the inactive batch (`0` double-cap triangles). Watertight 10-component geometry produces clean solid hatched cross-sections (`0` open chains) within `SECTION_CAP_MAX_TRIANGLES = 16,000`. |
| **X-Ray, Exterior & M12 Intake Cover** | Internal part: visible with `Exterior = Off` and with `Exterior = On + X-Ray = On`; occluded by opaque Exterior shell; never joins `exteriorGhostRegistry`, hides no shell subtree, and is independent of the exterior-only M12 intake cover. |
| **Labels & Firing Highlight** | All `23` existing label anchors and view rules are unchanged; `Connecting rod` tracks Cylinder 1's rod anchor automatically; orange emissive highlight stays on the firing piston only. |
| **Load-Failure Fallback** | If `rot_conrod_c1_forged.glb` fails to load, `engineScene.ts` logs `Failed to load visual variant "rods_forged"`, records `'rods_forged'` via `resolveVariantLoadFailure`, keeps stock rods visible, and settles `variantsLoaded = true` without hanging `?benchmark=1`. |

---

## 7. Budgets & Derived Cap Guard (D-033)

- **Per-instance rod cap:** **`1,400` triangles** (measured **`1,372`**, `28` below cap); full-engine delta **`+1,760` at cap** (**`+1,536` measured**).
- **File-size cap:** **`49,152 B` (`48.00 KiB`)** (measured **`47,976 B` / `46.85 KiB`**, `+0.4773 %` raw startup delta vs M9 `10,050,510 B` baseline; `≤ +0.4890 %` at cap).
- **Variant cap sum (`VARIANT_TRIANGLE_CAPS`):** `10,800` external + `5,200` piston + `1,400` rod = **`17,400`** (`ROD_VARIANT_TRIANGLE_CAP` imported from `src/renderer/internalVariants.ts` as single source of truth).
- **Derived cap guard (tightest phone state):**
  `308,324 − 6,500 + 10,800 + 2,944 + 1,800 + 1,760 = 319,128` triangles → **`872` triangles (`0.2725 %`) phone headroom** under `320,000`, and **`40,872` triangles (`11.35 %`) desktop headroom** under `360,000`.
- **Draw calls & VRAM:** `0` net draw calls (`3` primitives, same as stock rod) and `+0.00 MiB` texture VRAM (`20.75 MiB` Full / `4.75 MiB` Phone). With M12 cover on: `98 / 60` stock, `99 / 62` worst (section off); `≤ 100 / 101` desktop and `≤ 62 / 64` phone (section on). Full runtime `?benchmark=1` tables live in [`docs/M13-MEASUREMENTS.md`](./M13-MEASUREMENTS.md).

---

## 8. Visual Proof Frames (`RF-21`, `RF-22`) & Gate `G-FRAME-M13`

- **`RF-21` (Exploded Internal Forged Rods):** Reuses the committed **`RF-10`** camera pose (`[1.2800, −1.0800, 0.7400] → [0.3100, −0.0500, 0.1800] m`, `θ = 90°`, `Exterior = Off`, `Explode = 100 %`, `Section = Off`, `Labels = Off`) with `variants: ['rods_forged']`, verifying all eight swapped heavier H-beam rods, stepped 12-point cap fasteners, and stock pin/journal engagement.
- **`RF-22` (Sectioned Station-0 RH Forged Rod at `X = 388.3 mm`):** Reuses the committed **`RF-6`** camera pose (`[1.0600, −0.5400, 0.4800] → [0.2900, −0.0200, 0.1400] m`, `θ = 0°`, `Exterior = Off`, `Explode = 0 %`) with `variants: ['rods_forged']` and moves the section plane from RF-6's `X = 402.5 mm` (centre of the `0.724 mm` inter-rod gap `[402.138, 402.862] mm`, which cuts zero rods) to **`X = 388.3 mm`** — the exact axial centre of the station-0 RH rod (`X ∈ [374.462, 402.138] mm`, `13.838 mm` inside each face), keeping `X ≤ 388.3 mm` so the `+X` hatched solid rod cross-section faces the `X = 1.06 m` camera directly without LH-rod occlusion.

---

## 9. Recorded-But-Not-Adopted Register

| Candidate / Claim | Source Value | Reason Not Adopted |
| --- | --- | --- |
| BoostLine `GM6418-358S` stock-matching big-end width | `28.4 mm` (`1.119 in`) | Stock model width `27.676 mm` leaves a `0.724 mm` shared-pin inter-rod gap; `28.4 mm` would close the gap to `0.0 mm` without changing pin/seat geometry. |
| Callies Compstar Xtreme rod journal | `2.480 in` (`62.992 mm`) | Shipped crankpin uses published GM `62.9 mm` (`2.476 in`); variant must mate to the stock crankpin. |
| Callies typical rod mass | `1,182 g` | Steady-state performance and kinematic models have no mass/inertia consumer. |
| Manley Pro Series I-beam rod | `6.417 in` c2c I-beam | Shipped stock rod is an H-beam and the catalog entry does not claim an I-beam conversion. |
| Stage 2 aftermarket camshaft (`0.450 in` lift, `258°/268°`) | `.450` lift (lobe vs valve unstated), `.080 in` piston relief | Different grind from catalog `veFactor: 1.04`; worst-case lobe-lift assumption gives a `−3.84 / −6.34 mm` bounding estimate against stock valve-to-piston minima (not a drop-in). |
| `0.155 mm` injector nozzle hole diameter | Vendor/forum candidate | Below project verification bar (rejected in L7 cross-check §11) and sub-pixel at engine scale. |
| `docs/M7-DATA.md` §3 "rod I-beam" register wording | Stale prose in one frozen M7 row | Shipped `rot_conrod_c1_stock.glb` and `build_cylinder1.py` are forged H-beam; recorded as an erratum in **D-048** and `docs/OPEN_ITEMS.md` rather than editing frozen `docs/M7-DATA.md`. |

---

## 10. Known Limitations & Illustrative Scope

1. **Placeholder shank & fastener magnitudes:** Published evidence for `rods_forged` is a **single grade-C vendor's qualitative description** (Callies Compstar Xtreme: 4340 forged H-beam, thicker flanges, reduced depth of cut, ARP L19 fasteners), while the catalog entry itself is generic ("Heavy-Duty Forged Connecting Rods"). The exact flange widths (`30.343 / 18.568 mm`), flange thickness (`8.177 mm`), web half-width (`5.258 mm`), and stepped 12-point fastener head/washer geometry are **illustrative placeholders**, not CAD or measured aftermarket dimensions.
2. **Durability outside steady-state dyno:** `rods_forged` has `performanceParams: {}` because mechanical bottom-end strength lies outside the frozen steady-state torque/power limit taxonomy (`src/core/interfaces.ts`).
3. **M7 "I-beam" erratum:** `docs/M7-DATA.md` §3 contains one stale "rod I-beam" phrase; both the stock and M13 forged rod assets are H-beam designs.

---

## 11. Graded Source Summary

Full citations and URLs are archived in [`docs/research/M13-internal-variants-survey.md`](./research/M13-internal-variants-survey.md) §12:
- **Grade A (GM Service Literature):** 2006 Silverado 2500 RPO LLY *Engine General Specifications & Service Limits* (`163.0 mm` rod length, `62.902–62.922 mm` rod journal, `34.495–34.5 mm` wrist pin, `7.273 / 5.907 mm` cam lobe lift, `1.36:1 / 1.69:1` rocker ratios).
- **Grade B (Engineering Bulletin / Technical Overview):** AERA Technical Bulletin `TB031417-2` (paired rods on shared Duramax crankpin journal); BD Diesel *CP3 Pump 101* (internal cam-ring stroke architecture).
- **Grade C (Specialist Vendor Listings):** Callies Compstar Xtreme Duramax H-beam listing (qualitative thicker-flange / reduced-depth-of-cut H-beam + ARP L19 fasteners); BoostLine `GM6418-358S` (`1.119 in` / `28.4 mm` reference width, not adopted); Exergy 45% Over reman LLY injectors & `E04 10206` 10 mm stroker CP3; PPE CNC-ported Duramax head; Dirty Diesel / Industrial Injection Stage 2 camshaft.
