# Milestone 8 Spec — 3D Visual Part Variants

Repo: `colinstephens93/CarbonDuramax` · Branch: `m8-part-variants` (create from `main`, which includes Milestones 0–7 merged) · Planning package: this spec + `docs/specs/M8-part-variants-QA.md` (independent QA record) + `docs/research/M8-variant-references.md` (published-reference survey) · Plan reference: **new milestone, not in PLAN.md v2.2** — Milestone 8 is added to the plan by this spec's paperwork deliverables (§7), per the anti-drift rule. The mechanism is the frozen catalog contract's `PartVariant.modelPath` and `explodeVectorMm` fields (`src/core/interfaces.ts`, D-010 — **neither the interface nor `catalog/schema.json` changes**); the five modified variants in §2 get files and data, the renderer learns to load and show them, and restoring every slot to stock returns the shipped scene exactly. Budgets (D-033) still apply and are re-verified with measured numbers (§6, §12) — the variant models do **not** threaten them, and the measured margins are recorded.

**Coding is done by the user in Antigravity on branch `m8-part-variants`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

## 1. What Milestone 8 is

Milestones 0–7 built the running engine, the views, the performance model, the parts catalog, and the verified data. Milestone 6 shipped the catalog with a deliberate non-goal: *"every variant's `modelPath` stays `null`; selecting a variant changes numbers, not geometry."* M8 removes that non-goal for the parts whose modification has an honest 3D signature. The milestone is:

1. **Five visual variants (§2, §3):** the catalog's `modelPath` becomes real for five modified entries — the four externally visible modified parts (Large VGT Turbo, High-Flow Intake, 4-Inch Exhaust System, Upgraded Intercooler) and **one** internally visible one (Low-Compression Forged Pistons, the only internal catalog parameter — compression ratio — whose change is geometrically visible). Five new Blender-generated GLBs live in `public/models/variants/`; the catalog entries point at them; `explodeVectorMm` becomes meaningful for the four external ones.
2. **The renderer learns the catalog's visual layer (§4):** the exterior shell is split into visibility groups at load (the stock on-engine parts that a variant replaces), variant GLBs are preloaded at startup and attached only while selected, the piston variant swaps the per-cylinder instanced piston geometry, and cutaway/x-ray/explode/labels keep working. Stock selections show the shipped scene; restoring stock restores it exactly.
3. **The internal-parts position is explicit, part by part (§3.5).** Pistons are in scope; rods, injectors, CP3, camshaft, and heads are **consciously out of scope**, each with the specific reason recorded (shape change is invisible or unpublished, or no swappable geometry exists at all) and deferred as candidates in `docs/OPEN_ITEMS.md`.
4. **Measured budget record (§6, §12):** prototype triangle counts, shell-split accounting, worst-case scene arithmetic, draw-call/memory/frame-time expectations, and the per-model triangle caps enforced by the asset tests.
5. **Docs (§7):** `docs/M8-VARIANTS.md` (the variant dictionary, interface datums, provenance, limitations), `docs/M8-MEASUREMENTS.md` (GLB + budget + reference-frame record), three new reference frames (RF-8…RF-10), and the anti-drift paperwork (PLAN.md milestone 8, DECISIONS.md **D-038**, OPEN_ITEMS.md).

**Non-goals for M8:** no performance-model change (`src/perf/**` frozen — `modelPath`/`explodeVectorMm` are visual data the perf layer never reads); no change to the five components' nine already-shipped performance parameters or compatibility rules (M6 behavior unchanged); no new catalog entries, no new slots, no schema/interface change; no stock vehicle-side hardware fabricated (the shipped exterior shell has no intercooler core, airbox, or exhaust beyond the turbo downpipe — §3.4; the modified parts appear at documented service points, and stock selections show the shipped scene); no change to the 23 label anchors or label rules; no new textures (all variant models are untextured PBR like the internal parts); no internal variants beyond pistons (reasons in §3.5); no sound, sharing, or capped-solid cutaway work (still deferred per D-027).

**Provenance vocabulary note.** All five variant shapes are `illustrative` (D-012/D-028 — the owner has no physical access; no dimensioned GM drawings exist for any aftermarket part). Where a dimension is published it is named as the anchor; where it is not, the value is an illustrative authoring choice recorded in `docs/M8-VARIANTS.md` and the on-screen disclaimer (D-012: no dimension is ever silently invented). The catalog `provenance` field stays `"illustrative"` for all five entries (unchanged from M6).

## 2. The catalog change

`catalog/modified.json` changes for exactly five entries; `catalog/stock.json` and `catalog/schema.json` are **not** touched (every stock entry keeps `modelPath: null` / `explodeVectorMm: [0,0,0]` — stock visual = the shipped scene).

| Entry id | Slot | `modelPath` (new) | `explodeVectorMm` (new) |
|---|---|---|---|
| `turbo_large` | turbo | `models/variants/turbo_unit_engine_large.glb` | `[0, 0, 260]` |
| `intake_highflow` | intake | `models/variants/intake_tract_engine_highflow.glb` | `[0, -260, 150]` |
| `exhaust_4in` | exhaust | `models/variants/exhaust_system_engine_4inch.glb` | `[-320, 0, 0]` |
| `intercooler_upgraded` | intercooler | `models/variants/intercooler_core_engine_upgraded.glb` | `[0, 260, 0]` |
| `pistons_lowcomp` | pistons | `models/variants/rot_piston_c1_lowcomp.glb` | `[0, 0, 0]` |

- **Path format:** `modelPath` is a URL path relative to the app base (Vite `BASE_URL`), i.e. the file must exist at `public/<modelPath>`. The renderer resolves `import.meta.env.BASE_URL + modelPath`. The five paths are the only non-null `modelPath` values in the merged 24-entry catalog.
- **`explodeVectorMm` semantics (new, recorded here because M6 shipped every value as `[0,0,0]`):** for the four *externally placed* variants it is the part's **explode displacement in project millimetres at Explode = 100%** — the part drifts `explodeVectorMm × e` from its mounted position as the Milestone 4 Explode slider goes `0 → 100%` (the exterior shell itself does not explode; the variant hardware separates from it, which is the point: the slider becomes a parts-removal view for the selected hardware). `pistons_lowcomp` stays `[0,0,0]` because internal parts explode through the existing `ExplodePartGroup` pipeline (M4), not through catalog vectors. No other entry changes.
- The rest of each entry (`id`, `slotId`, `name`, `provenance: "illustrative"`, `performanceParams`, `compatibility`, `notes`) is **unchanged** from M6 — in particular the nine performance parameters, the two compatibility rules, and the generic tier names.
- **Renderer consumption is generic:** the renderer never reads slot names to find models; `main.ts` builds the visual descriptors from the catalog (`fullCatalog.filter((v) => v.modelPath !== null)`) and passes them to the scene. Resolving a `Build` to its active visual variants is a pure catalog-layer function (§4.1).

## 3. The five variant models

### 3.1 Asset class and authoring rules

The asset contract (D-011) is extended with one clearly separated class; the existing part-local class is unchanged:

| | **Part-local class** (M2/M7, unchanged) | **Scene-placed class** (new in M8) |
|---|---|---|
| Used by | the 10 cylinder-1 part GLBs | the four external variant models |
| Authoring frame (Blender) | `+X` crank axis, `+Y` bank-plane W (valley), `+Z` bore axis; pivot on the moving part's axis | **project frame: `+X` front/crank axis, `+Y` vehicle LH, `+Z` up; geometry authored at its final project position (metres); no pivot/animation** |
| Export | glTF Y-up ON, single `wrapInPartLocalFrame` conversion restores part-local | glTF Y-up ON, the same wrapper restores project space; the loaded scene is attached at the scene root with no mount transform |
| Placement | driven every frame by the kinematics/explode pipeline | baked into the asset; only the catalog `explodeVectorMm` offset is applied at runtime |
| Node naming | `<system>_<part>_<instance>_<variant>` contract nodes | one contract root object per file; optional interface markers (below) |
| Provenance | `assets-src/PROVENANCE.md` rows | `assets-src/PROVENANCE.md` rows (new section) |

- The scene-placed class is authorized by the asset contract's own master-frame rule ("Origin is the crank axis at the rear block / adapter plane; +X toward the front accessory drive, +Y vehicle left, +Z up") — the external hardware is authored in the master frame, so no per-part mount datum is needed in code. D-008's "shared mounting datums" remain the catalog-level promise: all variants of a slot visually align to the same **documented interface datums** (§3.2), which is what the asset tests enforce.
- **Interface markers.** Every scene-placed model must contain named empty nodes (`if_<name>`, no mesh, no geometry contribution) whose world translations are the model's connection points. They are the testable contract that the model is authored into the right place: §9's asset test converts each marker from glTF file space to project space (`p_mm = (1000·g_x, −1000·g_z, 1000·g_y)`) and asserts it matches the datum in §3.2's tables within **±1.0 mm**. Markers are invisible at runtime (empties carry no mesh) and are not renamed/kept by the loader.
- **Piston variant** stays in the part-local class (it is a drop-in replacement for the stock piston geometry, authored like `build_piston`, pivot at the wrist-pin axis) so the existing per-cylinder instancing pipeline can consume it.
- **No textures, no images, no Draco/meshopt/KTX2** in any variant GLB (uncompressed, like the M2–M7 part GLBs): the payloads are small, the build pipeline stays one Blender invocation, and texture VRAM must not change (§6).
- Smoothing rule matches the shipped pipeline: shade smooth with a 38° edge-crease threshold (`finalize_bmesh_object` default) so the new parts read consistently with the M2–M7 parts.

### 3.2 Model dictionary (design inputs the builder must reproduce)

All coordinates are **project-space millimetres**. "Envelope" is the axis-aligned bound the shipped asset must stay inside (asset test, §9); the builder places geometry *within* it, it is not a mesh dimension. Triangle caps are enforced by the asset test; measured prototype values are in §12.

#### V1 — `turbo_unit_engine_large.glb` (turbo slot; replaces the shell's turbocharger unit only)

The shell's `turbo` top-level group has four direct child subtrees in file order: child 0 = RH-bank up-pipe (384 tris), child 1 = LH-bank up-pipe (384 tris), child 2 = downpipe (560 tris), child 3 = turbocharger unit (2,056 tris). The large turbo variant replaces **only child 3** (the up-pipes and the downpipe stay visible and connect to it). The unit is not exploded by the shell (the shell does not explode); the catalog vector moves it at Explode > 0.

Rotor axis: along project X at `(Y = 5, Z = 394)` mm. Composition and dimensions (illustrative proportions; the published anchors are the stock GT3788VA wheel/vane data in the L7 survey §11 and the drop-in stock-footprint VGT form / upgrade class diameters in the M8 survey §1 — the variant is a generic "large" tier, **not a specific aftermarket part**):

| Component | Geometry (prototype-confirmed, §12) | Material |
|---|---|---|
| Turbine housing | closed revolved shell about the rotor axis, X −152…−88, outer radius 117 mm; rear section necks down to r 54 at the up-pipe plane (the LH up-pipe contact is only 55.7 mm from the rotor axis); two up-pipe nozzles r 40 with **r 44 flanges** angled ≈24–27° off radial so their faces land exactly on the stock contacts (a radial r-52 flange would exceed the X ≥ −180 envelope) | cast iron (dark grey) |
| Center housing (CHRA) | revolved body, X −92…−58, radius 42–46 mm, with oil feed (Ø12) and drain (Ø24) stubs | steel |
| Compressor housing | closed revolved housing shell, X −60…+16, outer radius 131 mm (stock ≈125) — the upgrade reads through the larger cover, revised inlet bell/outlet elbow and a larger actuator more than through a bigger footprint, which is the published drop-in form | aluminum |
| Compressor inlet bell | r 44 bell tube + r 48 flange whose face sits on `if_compressor_inlet` with the face normal aligned to the intake tube's first segment, **n = (0.737, −0.671, −0.057)** | aluminum |
| Compressor outlet elbow | r 38 elbow + r 44 flange whose face sits on `if_compressor_outlet`, face normal mostly +X: **n = (0.973, 0.165, 0.180)** | aluminum |
| Turbine outlet nozzle | r 45 neck + **r 52 flange** whose face sits on `if_turbine_outlet`; face normal **n = (−0.782, −0.247, −0.572)** — shared with the exhaust variant so model 1 and model 3 mate (a radial r-58 flange would reach X = −204, beyond the envelope) | cast iron |
| VGT actuator | canister Ø60 × 80 mm centered ≈ (−120, 50, 500) with a bracket and a Ø8 rod to the housing | steel |
| Fasteners/fittings | small stubs/bolts as needed for silhouette; keep below the triangle cap | steel |

Interface markers (project mm) — all must be present:
`if_turbine_inlet_rh` = (−137.6, −84.1, 340.6) · `if_turbine_inlet_lh` = (−137.6, 46.4, 356.8) · `if_turbine_outlet` = (−146.2, −59.2, 373.3) · `if_compressor_inlet` = (13.2, 22.6, 453.6) · `if_compressor_outlet` = (36.5, 56.1, 419.2).
**Mating normals** (needed so the variant reads as connected; shared where a stock interface is shared): turbine-outlet `(−0.782, −0.247, −0.572)` (also used by V3's inlet flange face); compressor-inlet `(0.737, −0.671, −0.057)` (aligned to V2's first tube segment); compressor-outlet `(0.973, 0.165, 0.180)` (kept mostly +X — any other orientation would push the face past the X ≤ +50 envelope).
Envelope: X [−180, 50], Y [−135, 150], Z [260, 540]. **Triangle cap: ≤ 3,600.** Materials ≤ 4. Measured prototype bounds X [−178.35, 47.10], Y [−126.00, 136.00], Z [263.00, 530.00] — the X-min and Z-min margins are 1.65 mm and 3.0 mm, so shape tweaks must keep these checks green.

#### V2 — `intake_tract_engine_highflow.glb` (intake slot; replaces the shell's whole `intake` top-level group)

The stock shell's `intake` group is the engine-side tract from the compressor inlet out to the (unmodeled) vehicle airbox (5,740 tris). The high-flow variant replaces that tract with a smooth tube and an open-element filter. The shell's `resonator` (intake manifold) is **not** part of the slot and stays. The tube's route is **derived from the stock intake tract's own centreline** (a planar cross-section-centroid march through the shipped intake mesh, continued along the stock flex-hose ring centres, then locally optimised for clearance) — the shipped part occupies a collision-free corridor by construction, and the M8 pre-build found that a hand-picked route physically intersected shell hardware (§12.3).

| Component | Geometry (prototype-confirmed, §12) | Material |
|---|---|---|
| Intake tube | **Ø101.6 mm** (4-in, r 50.8; the published LLY turbo-inlet dimension) smooth tube swept along the **9 centreline control points below** (Catmull-Rom, 32 path samples, 20 radial segments; the first ring starts **6 mm downstream** of the compressor-inlet marker and the final ≈45 mm is aligned to the filter axis so the end face is parallel to the filter base; open ends hidden inside couplers) | polished aluminum |
| Couplers | two silicone sleeves Ø116 (r 58) × 60 mm (compressor-inlet end and filter end) + 2 clamp rings Ø120 (r 60) × 12 | black silicone |
| Open-element filter | cone frustum base Ø160 → tip Ø100, length 190 mm, 32 radial segments (2 per pleat) with 16 visible pleat ribs, steel end cap; base centre exactly at the airbox service point, axis **(0.88, −0.44, −0.16)**, tip pointing away from the engine | dark filter media |

Centreline control points (project mm, pinned — take these exactly): `(13.20, 22.60, 453.60)` · `(46.42, −7.65, 451.03)` · `(84.11, −14.51, 427.95)` · `(136.84, −48.58, 425.14)` · `(425.94, −254.77, 491.77)` · `(531.10, −358.50, 482.40)` · `(539.10, −450.70, 396.50)` · `(547.67, −490.64, 379.12)` · `(587.40, −510.50, 371.90)` (centreline length 887.8 mm; first tangent fixed to the turbo-bell mating normal (0.737, −0.671, −0.057)).
Interface markers: `if_compressor_inlet` = (13.2, 22.6, 453.6) · `if_airbox_mount` = (587.4, −510.5, 371.9).
Envelope: X [−20, 800], Y [−650, 100], Z [280, 560]. **Triangle cap: ≤ 2,600.** Materials ≤ 4. Measured prototype: 2,400 tris, bounds X [−18.91, 782.34], Y [−641.77, 54.45], Z [289.09, 547.82], min Z 289.09 mm (534.1 mm ground clearance), **0** non-excluded shell vertices inside the solid tube envelope, minimum vertex-to-vertex distance **20.48 mm** (`acComp`) — the re-route is comfortably clearer than the stock intake's own 1.41 mm minimum gap.

#### V3 — `exhaust_system_engine_4inch.glb` (exhaust slot; replaces the shell's turbo downpipe only)

A representative 4-inch turbo-back section (downpipe + straight-through muffler + tail). The full vehicle-length system is **not** modeled (it would leave the engine's display envelope); the model is labeled a representative section in `docs/M8-VARIANTS.md`.

| Component | Geometry (prototype-confirmed, §12) | Material |
|---|---|---|
| Inlet flange | **r 52** flange with face normal **n = (−0.782, −0.247, −0.572)** (shared with V1's turbine outlet so the two models mate) whose face sits on `if_turbine_outlet`; 3-inch (r 38.1) stub quickly transitioning to 4-inch (r 50.8) | heat-tinted stainless |
| Downpipe/pipe | Ø101.6 mm (r 50.8) tube swept along the path below (30 path samples, 20 radial segments); the first segment is aligned to the shared flange normal | stainless steel |
| Muffler | straight-through canister Ø220 × 380 mm, 32-segment revolved profile with end caps and necks, axis along X at (−570…−950, −108, 25) (the published 4" mufflers are 24"/30" overall; this is a shorter display representative, §3.6) | stainless steel |
| Tail | Ø101.6 tube X −950 → ≈−1,035, downturn to Z ≈ −25, flared rolled tip r 50.8 → 56 | heat-tinted stainless |

Pipe path control points (project mm): `(−146.2, −59.2, 373.3)` → ≈ face + 60·n = `(−193.1, −74.0, 339.0)` → `(−250, −88, 270)` → `(−310, −98, 190)` → `(−370, −105, 110)` → `(−430, −108, 55)` → `(−500, −108, 30)` → `(−560, −108, 25)` → `(−575, −108, 25)` (the last point pulls the pipe into the muffler front cap).
Interface marker: `if_turbine_outlet` = (−146.2, −59.2, 373.3) (the tail end is free — no marker).
Envelope: X [−1100, −110], Y [−300, 60], Z [−160, 470]; **minimum Z ≥ −225 mm** (20 mm above the Z = −245 mm studio floor). **Triangle cap: ≤ 2,800.** Materials ≤ 4. Measured prototype: 2,272 tris, bounds X [−1,092.64, −113.81], Y [−218.00, 2.00], Z [−85.00, 415.96], min Z −85 mm (160 mm ground clearance), nearest non-excluded shell geometry 71.7 mm. The model has **no hangers/brackets and does not attach to the shell behind the flange** (the replaced downpipe was the only visual link; documented as a representative, unsupported section).

#### V4 — `intercooler_core_engine_upgraded.glb` (intercooler slot; adds the cooler where the shipped charge pipe ends)

The shipped shell has charge piping (`boostPipe`) but **no intercooler core**; the modified intercooler is displayed at the documented service point where the pipe terminates (LH side of the engine), connected by a short adapter. §3.4 records this honesty rule.

| Component | Geometry (prototype-confirmed, §12) | Material |
|---|---|---|
| Hot-side adapter | **Ø76.2 mm (3.00 in, r 38.1)** pipe from `if_hot_side_inlet` **+Y then bending −X ≈230 mm along the core front face** into the near end tank (a straight +Y run would meet the core face rather than a tank), with a silicone coupler Ø84 (r 42) at the flange | black silicone |
| End tanks (×2) | cast-style boxes 60 (X) × 110 (Y) × 340 (Z) at X 90…150 and X 610…670, Y 545…655, Z −20…320, chamfered edges | dark powder-coated aluminum |
| Core | bar-and-plate box X 150…610 (460 wide), Y 555…645 (80), Z −10…310 (320) | brushed aluminum |
| Fins | 18 raised vertical strips on the −Y-facing core face, full core height | brushed aluminum |
| Cold-side outlet | Ø76.2 mm neck from the cold tank pointing +Y ending in a silicone coupler Ø84 (free end — no connection in the shipped shell) | black silicone |
| Mounting brackets | 3 small boxes on the tank tops (visual only) | dark powder-coated aluminum |

Interface marker: `if_hot_side_inlet` = (374.6, 474.8, 146.6) (the cold-side outlet is free — no marker; it ends in a coupler).
Envelope: X [60, 700], Y [430, 720], Z [−60, 360]; **minimum Z ≥ −225 mm**. **Triangle cap: ≤ 1,800.** Materials ≤ 4. Measured prototype: 1,360 tris, bounds X [90.00, 682.00], Y [471.88, 695.00], Z [−40.00, 320.00], min Z −40 mm (205 mm ground clearance), nearest non-excluded shell geometry 163.6 mm. The cold-side outlet ends in a coupler and is otherwise unconnected (the shipped shell has no cold-side plumbing); the +Y/−X hot-side packaging is an interpretation to verify visually.

#### V5 — `rot_piston_c1_lowcomp.glb` (pistons slot; part-local class, drop-in replacement for the stock piston)

Authored exactly like the stock piston (`assets-src/blender/build_cylinder1.py::build_piston`): part-local `+X` crank, `+Y` valley, `+Z` bore; origin at the wrist-pin axis; crown plane at **+Z = 49.8 mm**; outer diameter **102.85 mm** (bore 103 − `pistonSkirtClearanceMm` 0.15); wrist pin Ø34.5; ring pack and skirt per the stock builder. The difference is the crown, and **only the crown**: the stock shallow *omega* dish is replaced by an **open flat-floor dish** (lip radius 27.77 → 28.80 mm; dish depth 13.45 → 16.30 mm) whose revolved volume is such that the modeled crown's solid-volume difference is exactly the CR-implied clearance-volume change (§ arithmetic below), plus a forged/coated material split (illustrative: forged-aluminum body + dark anodized crown and coated skirt, following the published 2618/M142 + Grafal/hard-anodize practice). **No valve-relief pockets are modeled**: the shipped stock piston model has none, and adding them to only the variant would show a difference the catalog does not claim (the published 0.075 in pocket depth is recorded in the survey and in the "recorded but not adopted" register, §3.6). Outer envelope must not exceed the stock part's (diameter ≤ 102.85 + 0.5 mm tolerance; crown max Z ≤ 49.8 + 0.1 mm); 48 circumferential segments (the stock uses 56) keeps the variant under the triangle cap.

Compression-ratio arithmetic the bowl must express: swept volume per cylinder `Vd = (π/4)·103²·99 = 824,868 mm³`; clearance volume `Vc = Vd/(CR−1)`; ΔVc(17.5 → 16.5) = 824,868/15.5 − 824,868/16.5 = **3,225 mm³ (3.23 cm³)**. The build script computes the two crown profiles' revolved volumes analytically (sum of conical frusta over the profile points; the crown profile is the only geometric difference between the two pistons; the pin bore and ring grooves are identical and cancel) and asserts `V_stock − V_lowcomp = 3.23 ± 0.30 cm³`, i.e. the modeled crown really is a lower-compression crown; the number is also logged and recorded in `docs/M8-MEASUREMENTS.md`. The measured prototype values are bowl volume 29.586 → 32.816 cm³ (Δ = +3.230 cm³ exactly) with the open-dish profile, which is deeper by 2.85 mm at the lip — a visual difference that reads in the exploded view without exaggerating the catalog's change. (The bowl is still an illustrative *shape* — the LLY bowl's published data is a single OE-replacement ≈38 cc figure, L7 survey §8 — but its *volume difference* is arithmetic on the catalog's own compression ratio, not invention.)

Materials ≤ 4, **triangle cap ≤ 5,200**. Contract root object name: `rot_piston_c1_lowcomp`. No `if_*` markers (its datum is the pivot at (0,0,0), asserted like the stock piston's). Geometry tolerances for the asset test: outer diameter 102.85 ± 1.0 mm, crown maximum height 49.8 mm with −0.1/+0.2 mm tolerance, pivot at (0,0,0) within 1e-6 m.

### 3.3 The build pipeline (`assets-src/blender/build_variants.py` + `assets-src/variant_dimensions.json`)

New, self-contained generation pipeline following the M2 discipline (the shipped `build_cylinder1.py` is **frozen** and is not modified; the new script imports its geometry helpers):

1. **`assets-src/variant_dimensions.json` (new):** flat numeric map, millimetres, exactly the values the spec pins — the per-model dimensions of §3.2 and every interface datum above (keys are camelCase mirroring the TS style, e.g. `turboRotorAxisYMm`, `turboTurbineHousingOuterRadiusMm`, `ifTurboCompressorInletXMm`, …; the exact key set is recorded here by the test). No interface number is hard-coded in Python. The asset test (`src/assets/variantAssets.test.ts`) pins this file's key/value pairs against the §3.2 tables so the JSON cannot drift from the spec.
2. **`assets-src/blender/build_variants.py` (new):** reads `assets-src/dimensions.json` (shared stock dimensions, e.g. piston bore/CH/pin for V5) and `assets-src/variant_dimensions.json` (variant dimensions + interface datums); imports `add_revolved_profile`, `add_tube_along_axis`, `add_box`, `add_extruded_polygon_*`, `finalize_bmesh_object`, `make_pbr_material`, `export_glb`, `reset_scene` from `build_cylinder1.py` (the module is import-safe: `main()` is guarded); builds the five models (§3.2); adds the interface empty markers for V1–V4 plus the contract root object; exports uncompressed GLBs with `export_yup=True` and `export_materials='EXPORT'`; and prints a **logged assertion block** (machine-checkable, quoted in the closing summary and recorded in `docs/M8-MEASUREMENTS.md`):
   - per model: triangle count (after triangulation) vs the §3.2 cap, material count vs cap, world-space project bounds vs the §3.2 envelope, minimum Z vs the ground margin for V3/V4;
   - per scene-placed model: each `if_*` marker's project-space translation vs its §3.2 datum (must be exact by construction; logged to 0.01 mm);
   - **physical non-interference against the shipped shell** (the M8 pre-build found that a vertex-to-vertex metric alone can hide real overlap — §12): the script parses the frozen `public/Duramax_LLY_2005_66L_V8.glb` (GLB header/JSON/BIN accessors, node TRS, then the registration `p_mm = (204.2, 0, 111.8) + 430·R·p_file`, `R:(x_f,y_f,z_f)→(z_f,x_f,y_f)`) and, per external model, reports the shell vertices lying **inside the model's solid envelopes** and the per-group minimum vertex-to-vertex distance with the documented exclusions (turbo: exclude `turbo` + `intake`; intake: exclude `intake` + `turbo`; exhaust: exclude `turbo`; intercooler: exclude `boostPipe`). Assertions: **zero** non-excluded shell vertices inside the tube/housing envelopes (the shared connection zones excepted), and minimum vertex-to-vertex distance to non-excluded groups **≥ 2.0 mm** (the shipped stock intake's own minimum clearance to `acComp` is 1.41 mm — the replacement must be at least as well packaged). Prototype values are in §12;
   - V5: `V_stock − V_lowcomp` in cm³ (crown-profile revolved volumes) and the crown/diameter bounds;
   - runs headless as `blender --background --python assets-src/blender/build_variants.py -- --out public/models/variants`.
3. **Outputs:** the five GLBs at the `modelPath` locations in §2, uncompressed, each containing its contract root object name and (V1–V4) its `if_*` marker empties. `assets-src/PROVENANCE.md` gains a "Milestone 8 variant models" section: per file, what it replaces/attaches to, which dimensions are published anchors and which are illustrative, and the license line (original procedural work, no third-party mesh content).
4. `assets-src/README.md` gains the variant regeneration command (same Blender version used at M2/M7: Blender 5.2.3 LTS).

### 3.4 The shell split (`src/renderer/exteriorLoader.ts`)

The shipped shell is one merged static group (22 meshes after material dedupe, 31,396 triangles). Showing a large turbo while the stock one is still inside it is not acceptable, so the loader gains a **preserve spec** that keeps three stock subtrees as separate visibility groups and merges everything else as before:

| Preserved id | Shell subtree | Triangles | Hidden when |
|---|---|---|---|
| `turbo_unit` | `turbo` group, direct child **index 3** (the turbocharger unit, 18 meshes) | 2,056 | `turbo_large` selected |
| `turbo_downpipe` | `turbo` group, direct child **index 2** (downpipe) | 560 | `exhaust_4in` selected |
| `intake_tract` | whole top-level `intake` group (14 primitives) | 5,740 | `intake_highflow` selected |

- The shell GLB (`public/Duramax_LLY_2005_66L_V8.glb`) is **frozen** (M3/M7: byte-identical, hash-pinned). Its node names are the twelve top-level groups only; the `turbo` group's direct children are unnamed, which is why the preserve spec addresses them by **file-order child index** (0 = RH up-pipe, 1 = LH up-pipe, 2 = downpipe, 3 = turbo unit). The asset test re-parses the shell and asserts the three subtree triangle counts above — if the shell is ever replaced, that test fails loudly and this table is re-measured; no silent mis-split is possible.
- Measured accounting (from the shipped shell, §12): preserving the three subtrees produces **33 exterior meshes instead of 22 → +11 main-pass draw calls** when everything is visible (5 for `intake_tract`, 6 for `turbo_unit`, 1 for `turbo_downpipe`; one material signature moves out of the global merge, giving +11 net). Triangles are unchanged: 33 meshes still total 31,396 shell triangles.
- **API (new):**
  ```ts
  export interface ExteriorPreservedSubtreeSpec {
    readonly id: string;       // 'turbo_unit' | 'turbo_downpipe' | 'intake_tract'
    readonly group: string;    // top-level shell group name, e.g. 'turbo'
    readonly childIndex?: number; // direct-child index within the group; omitted = preserve the whole group
  }
  loadRegisteredExteriorShell(loader, url, registration, preserved?: readonly ExteriorPreservedSubtreeSpec[])
  // LoadedExteriorShell gains: readonly partGroups: ReadonlyMap<string, THREE.Group>;
  ```
  Each part group is a `THREE.Group` holding per-material merged meshes (same deduplicated `MeshStandardMaterial` instances as the global merge — the shell's 22 materials and 4 textures are unchanged; no extra VRAM), `castShadow = false`, `receiveShadow = false` (as the shell's merged meshes already are), and registered in the existing clippable/x-ray material sets exactly like the rest of the shell. The preserve spec constant lives in `src/renderer/partVariants.ts` (`EXTERIOR_PRESERVED_SUBTREES`, three-free) and is passed by `engineScene` to the loader.
- **Stock-restore invariant:** with no external variant selected, all three part groups are visible and the rendered scene is the M7 scene (same geometry, same materials, same lighting; only the draw-call grouping changed). RF-1…RF-7 must remain visually unchanged (§10).

### 3.5 Internal parts: the explicit position

The catalog has six internal-slot modified entries. M8 models **one** and records the other five as deliberately out of scope — the decision rule is stated first, then each part.

**Decision rule.** A part gets a visual variant in M8 only if (a) its catalog change corresponds to a **visible geometry change**, (b) the shipped scene already contains the part's swappable geometry (pivot-placed model + a mount), and (c) a truthful illustrative shape can be derived from the catalog parameter or published data. Failing (a)/(c) means the variant would fabricate a visible difference; failing (b) means the milestone would be adding new geometry rather than a variant.

| Slot / entry | Catalog change | In shipped 3D scene? | Visible in exploded/cutaway? | M8 position | Reason |
|---|---|---|---|---|---|
| pistons / `pistons_lowcomp` | `compressionRatio` 17.5 → 16.5 | yes — stock piston GLB, instanced ×8 | yes | **IN** | The CR change is a clearance-volume change (ΔVc = 3.23 cm³, §3.2 V5); a dished/forged crown is the visible consequence and is derivable from the catalog parameter. It is the one internal part whose visual signature is honest. |
| rods / `rods_forged` | `performanceParams: {}` | yes — stock conrod GLB, instanced ×8 | yes | **OUT** | The shipped illustrative rod is already a forged H-beam (`assets-src/PROVENANCE.md`); the upgrade's difference is material/strength, which the catalog explicitly models as *no numeric change*. A visual variant would invent a shape difference the data does not support. |
| injectors / `injectors_plus30` | `maxFuelMm3` 120 → 156 | yes — cylinder-1 injector GLB, instanced ×8 (and a separate `injectors` group in the shell) | yes | **OUT** | +30% flow is nozzle work; the shipped injector's nozzle is not hole-modeled (M7 §2.4 records this) and the injector body is generic. A truthful external difference does not exist in the modeled geometry; adding one would fabricate. |
| cp3 / `cp3_stroker` | `flowBaseKgH`/`flowSlope` up, `maxRailPsi` unchanged | only as part of the shell's merged `cp3Fuel` group — **no pivot-placed model** | only through the shell/x-ray | **OUT** | The stroker's difference is internal cam-ring stroke; the external housing is identical. There is also nothing swappable in the renderer for this slot. |
| camshaft / `cam_performance` | `veFactor` 1.04 | **no camshaft geometry exists** (valvetrain starts at the lifters) | would be, if modeled | **OUT** | Not a variant: it would be new geometry. The visual signature (lobe lift/duration) is also unpublished (L7 §4: timing/duration/LSA not published); modeling a performance lobe profile would encode blocked data. Deferred candidate (OPEN_ITEMS). |
| heads / `heads_ported` | `flowFactor` 1.08 | yes — stock head section GLB, instanced ×8 | yes | **OUT** | Porting changes internal port geometry; the shipped head section models deck, seats, guides, spring seats, injector bore, and rocker shaft, but **not ports**, and LLY port shapes are unpublished (L7 §10). A "ported" visual would be fabricated. Deferred candidate (OPEN_ITEMS). |

- `tune` (software calibration) and `fuelRail` (stock-only slot; transient behavior outside the model) have no visual counterpart in this milestone; M6 documented the same.
- The decisions above are recorded as **D-038** (§7) so later milestones cannot silently flip them without a new decision.
- If M8's mechanism later admits internal variants, the piston swap path (§4.4) is the template — the five excluded parts are listed in `docs/OPEN_ITEMS.md` as a candidate milestone.

### 3.6 Provenance of the five models

Source of the published anchors: `docs/research/M8-variant-references.md` (the "survey", committed with this plan; grades A–D in the L7 convention) plus `docs/research/L7-verified-data-survey.md` for the stock parts. Every model is **illustrative** (catalog provenance unchanged); the survey's closing table is the authority on what is and is not published. The short version:

| Model | Published anchors adopted (survey §) | Illustrative / not published |
|---|---|---|
| V1 large VGT | Drop-in stock-footprint VGT form with a VGT actuator; upgrade class leading compressor diameters **61–68 mm** (survey §1, grade C); stock GT3788VA wheel/vane data (L7 §11) as the baseline; some drop-ins explicitly reuse the stock housings, others are complete replacement units (survey §1) | All variant housing dimensions and the modestly enlarged envelope; full inducer/exducer pairs, compressor-cover OD, vane-ring dimensions are **NOT PUBLICLY AVAILABLE**; the stock-vane 14.4–15 mm vs aftermarket "11 mm" claim is unreconciled and not modeled |
| V2 high-flow intake | **Ø101.6 mm (4 in)** turbo-inlet tube (PPE Zilla, survey §3); open-element filter form (S&B KF-1035 base 9.85"×8.25", 6.6" tall, 5.00" flange, grade C); boxed cold-air kits are the real LLY form (survey §3) | Tube path/length/material, filter cone size/pleats, heat-shield form, service position; intermediate tube dimensions are **NOT PUBLICLY AVAILABLE**; the model is an open-element display (the catalog's M6 note calls the tier "open-element airbox") not the sealed box |
| V3 4-inch exhaust | **4 in = 101.6 mm** (definitional); the real kit layout is **3-inch round downpipe + 4-inch cat-back** (survey §2, grade C); T409/aluminized construction with a stainless tip; muffler is 4" center-in/out (vendor, grade C) | Bend coordinates, lengths, representative-section extent, canister size (the model's canister is shorter than the published 24"/30" muffler — display context), wall thickness (single reseller 16-ga claim, not adopted) |
| V4 upgraded intercooler | Bar-and-plate core between **cast welded aluminum end tanks**, **Ø76.2 mm (3.00 in) inlet/outlet** (Mishimoto/PPE/CSF, survey §4, grade C); PPE 2" core / Mishimoto 2.05" core; large core area vs stock | Core/tank absolute dimensions (the display model is a compact representative core — see "recorded but not adopted" below); fin density/end-tank shape |
| V5 low-comp piston | Catalog CR 16.5:1; published 16.5-class part data: Mahle 930029875 crown **−41.8 cc**, CH **1.951"** and pin 1.358", 2618/M142 alloys with hard-anodize/Grafal/PTFE coatings (survey §5, grade C); stock CH/pin/D-035 | Bowl shape/depth (an illustrative open-dish crown whose *volume difference* is the catalog CR arithmetic, not a published bowl figure), ring grooves, weight; exact bowl cc (sign conventions differ across makers — **do not subtract** the −41.8/+38 figures); head-gasket/protrusion assumptions in vendor CRs not modeled |

**Recorded but not adopted** (mirrors the M7 §2.4 discipline; full register in `docs/M8-VARIANTS.md`):
- **True-scale intercooler envelope** — Mishimoto MMINT-DMAX-01 core 971.7 × 479.0 × 52.1 mm, overall 1,158 × 594 × 208 mm (survey §4). A true-scale core at the charge-pipe service point would dominate the engine display (and place the part far outside the engine's service envelope); the model is a compact representative core with the published construction and 3" connections. Reason recorded so nobody "fixes" the size later.
- **Aftermarket piston compression height 1.951 in (49.55 mm)** — the aftermarket 16.5/16.6-class pistons publish a CH ~0.25 mm shorter than the stock 49.8 mm (survey §5). Not adopted: the variant keeps the stock compression height because the sim's kinematics is config-driven (D-035 stack) and this is a visual drop-in; adopting a different CH would move the crown and require a config/kinematics revision, not a visual variant.
- **Aftermarket turbo wheel pairs** — only single leading diameters are published (61/63/65/68 mm compressor; 66–66.5 mm turbine); the survey explicitly marks inducer/exducer pairs and cover dimensions NOT PUBLICLY AVAILABLE, so the model does not pretend to a specific wheel pair. The housing is illustrative.
- **Aftermarket piston valve-relief pockets (published depth 0.075 in = 1.9 mm)** — recorded, not adopted: the shipped stock piston model has **no** valve reliefs, so adding them to only the variant would show a stock-vs-modified difference the catalog does not claim (both real piston types have reliefs). The variant's visible difference is instead the CR-implied crown volume, which is exactly the catalog's change.
- **Exhaust muffler published size** (24"/30" overall, 4" center/center) and **wall thickness** ("16-gauge" reseller claim): recorded, not adopted — the canister is a shorter display representative and wall thickness is not modeled.
- **Intake filter absolute oval dimensions** (S&B 9.85"×8.25" base etc.): recorded, not adopted — the filter is a round conical display element; the published 4-inch turbo-inlet diameter *is* adopted (V2 tube).

The on-screen disclaimer gains "aftermarket variant part shapes and their service positions" (§5). `docs/M8-VARIANTS.md` carries this table with the survey's URLs and the interface datum register.

## 4. Renderer integration

### 4.1 Resolving a `Build` to visual variants (catalog layer, pure)

`src/catalog/index.ts` gains exactly one public function (no three.js, no `src/perf` import — the M6 layering rule stands):

```ts
export interface VisualVariantSelection {
  readonly slotId: PartSlotId;
  readonly variantId: string;
  readonly modelPath: string;
  readonly explodeVectorMm: readonly [number, number, number];
}

export function visualVariantsForBuild(
  build: Build,
  catalog?: readonly PartVariant[],
): VisualVariantSelection[];

export function slotForVariantId(
  variantId: string,
  catalog?: readonly PartVariant[],
): PartSlotId | null;
```

Behavior: `visualVariantsForBuild` walks the twelve `CATALOG_SLOTS` in the same order the Build UI uses; for each slot, look up the selected entry and include it iff its `modelPath` is non-null (never throws on unknown ids — unknown slots are skipped). The returned order is slot order. Stock-only builds return `[]`; the §6 "full build" (turbo, intake, exhaust, intercooler, pistons modified) returns five descriptors in the order turbo, intake, exhaust, intercooler, pistons. `slotForVariantId` is the small lookup the reference-frame and benchmark URL-parameter wiring needs (returns `null` for an unknown id; never throws). This is the single place selection → visual model resolution happens; the renderer receives the resolved descriptors and never imports the catalog.

### 4.2 New renderer modules

**`src/renderer/partVariants.ts` (new, three-free pure module — importable by Node asset tests):**
- `type ExternalVisualSlotId = 'turbo' | 'intake' | 'exhaust' | 'intercooler'`;
- `EXTERNAL_VISUAL_SLOTS: readonly ExternalVisualSlotId[]` (that order);
- `VISUAL_VARIANT_SLOTS: readonly PartSlotId[]` = external slots followed by `'pistons'`;
- `EXTERIOR_PRESERVED_SUBTREES: readonly ExteriorPreservedSubtreeSpec[]` = §3.4's three entries (`turbo_unit` child 3, `turbo_downpipe` child 2, `intake_tract` whole group);
- `SHELL_PARTS_REPLACED_BY_SLOT: Readonly<Partial<Record<PartSlotId, readonly string[]>>>` = `{ turbo: ['turbo_unit'], intake: ['intake_tract'], exhaust: ['turbo_downpipe'], intercooler: [] }`;
- `computeVariantExplodeOffsetMm(explodeVectorMm, e): [number, number, number]` — the §2 explode rule: clamps `e` to `[0, 1]` (non-finite → 0), returns exactly `[0,0,0]` at `e = 0`, `vector × e` otherwise;
- `interface VisualVariantDescriptor { slotId; variantId; modelPath; explodeVectorMm }` (structurally identical to the catalog's `VisualVariantSelection`; `main.ts` passes the catalog result straight through).

**`src/renderer/partLoader.ts` gains** `extractAllPartPrimitives(gltf): ExtractedPartPrimitive[]` — traverses the whole loaded scene (all mesh nodes, world matrices baked), wraps once through `wrapInPartLocalFrame`, and returns the primitive list exactly like `extractPartPrimitives` does for a named node (same `triangles`/material typing, same `MeshStandardMaterial` assertion). Used for the piston variant, whose GLB has no shell-style naming contract to key on.

**`src/renderer/variantLoader.ts` (new, the only new three.js consumer):**
```ts
export interface LoadedVariantScene {
  readonly group: THREE.Group;            // wrapped once into project frame; NOT attached until selected
  readonly geometries: THREE.BufferGeometry[];
  readonly materials: THREE.MeshStandardMaterial[];
  readonly triangles: number;
}
export function loadVariantScene(loader: GLTFLoader, url: string): Promise<LoadedVariantScene>;
```
Meshes in the returned group are configured `castShadow = false`, `receiveShadow = false` (the exterior class behaves like the shell; the internals' shadow pass already covers the D-033 submitted-triangle budget and the extra hardware is outside the ±0.65 m shadow frustum — §6). `if_*` marker empties are harmless (no meshes); the loader may remove them but is not required to.

### 4.3 `engineScene.ts` — scene state, visibility, and stats

`createEngineScene` gains an options parameter (backward compatible — existing call sites without options are unchanged):
```ts
export interface EngineSceneOptions {
  /** Every variant entry the catalog says has a 3D model; loaded at startup, attached only when selected. */
  readonly visualVariants?: readonly VisualVariantDescriptor[];
}
export function createEngineScene(container, config, valveCfg, detailCfg?, options?: EngineSceneOptions): EngineSceneController;
```

**Load phase.** The exterior shell is loaded with `EXTERIOR_PRESERVED_SUBTREES` (§3.4). Each `options.visualVariants` entry is loaded in parallel with the existing loads: external slots via `loadVariantScene`; the pistons slot via `extractAllPartPrimitives` (both cached forever). `EngineRenderStats.variantsLoaded` becomes true only when every descriptor has loaded successfully. A failed variant load logs `console.error` and leaves that variant unavailable (the stock scene and every other feature must still work); it must not reject the other loads.

**Visibility rules (`setVisualVariantSelections`).** The controller gains:

```ts
setVisualVariantSelections(selections: readonly VisualVariantDescriptor[]): void;
getVisualVariantState(): {
  readonly activeVariantIds: readonly string[];
  readonly attachedVariantIds: readonly string[];
  readonly shellPartsHidden: readonly string[];
  readonly pistonVariantActive: boolean;
};
```

On every call (and re-applied when a variant load completes or the exterior/x-ray state changes):
- **External variants:** a variant's scene group is attached to the scene root and `visible = isSelected && (exteriorVisible || xrayEnabled)`. Its position is `computeVariantExplodeOffsetMm(desc.explodeVectorMm, explodeFactor) / 1000` (metres); rotation/scale identity (placement is baked into the asset, §3.1). Selection is keyed by `variantId`; the shell replacement and internal swap are keyed by `slotId` via the descriptor. Only the descriptor that is *both* selected and loaded can be attached; a selection whose model is still loading is re-applied when the load resolves.
- **Shell parts:** for each preserved group id, `visible = !someActiveExternalVariantWhoseSlotReplaces(it)` (`SHELL_PARTS_REPLACED_BY_SLOT`). All three are visible whenever no external variant is active — the stock-restore invariant.
- **Piston variant:** if an active descriptor has slot `pistons`, the pre-built low-compression piston batch set is attached and the stock set detached (and vice versa). Both sets are built once at load; swapping only moves references and runs one immediate `applyV8KinematicState` pass so a paused scrub updates instantly. This also means no GPU buffers are recreated per swap.
- The whole set is re-evaluated on `setExteriorVisible`, `setXrayEnabled`, `setExplodeFactor` (position update), and load completion.

**Interactions (must be verified in the deployed check, §10):**

| State | External variant models | Shell preserved groups | Piston variant |
|---|---|---|---|
| Exterior off, X-Ray off | not rendered (hidden with the exterior context) | hidden (inside the hidden shell group) | visible in the internal assembly |
| Exterior on, or X-Ray on | rendered when selected; opaque (x-ray ghosts only the shell) | hidden iff replaced by a selected variant | visible |
| Cutaway x/y active | clipped by the section plane (their materials join the clippable set, `clipShadows = true` — same as the shell) | share the shell materials, clipped as before | clipped as now |
| Explode e > 0 | translate by `explodeVectorMm × e` from the mounted position | stay on the shell (the shell does not explode) | follows the existing M4 explode pipeline |
| Labels | 23 existing anchors/rules unchanged; the `Turbocharger` exterior label stays at its registered anchor (it tracks the turbo mount area for both stock and variant) | unchanged | unchanged |

**Stats.** `EngineRenderStats` gains `variantsLoaded: boolean`, `visibleVariantModels: string[]` (selected-and-loaded variant ids currently rendered), `variantSceneTriangles: number` (triangles of the currently attached+visible variant models), `pistonVariantActive: boolean`, and `visibleSceneTriangles: number` — the single-pass triangle count of the currently **visible** meshes (instanced counts multiplied out), which is the exact D-033 "scene asset triangles" metric the measurements table needs now that parts are hidden/replaced per selection. All existing fields (`internalSceneTriangles`, `exteriorSceneTriangles`, `calls`, `triangles`, `memory.*`, `estimatedTextureVramMiB`, …) keep their meanings; `exteriorSceneTriangles` still reports 31,396 (the split does not change the shell's geometry).

**Disposal.** Variant geometries/materials join the existing `geometriesToDispose` / `materialsToDispose` sets; both piston batch sets' `InstancedMesh` objects are disposed on `dispose()` (the shared primitive geometries/materials are covered once). No leaked GPU resources across selection changes.

### 4.4 Public exports

`src/renderer/index.ts` gains the new types/functions (`EngineSceneOptions`, `VisualVariantDescriptor` re-export, `EXTERNAL_VISUAL_SLOTS`, `EXTERIOR_PRESERVED_SUBTREES`, `computeVariantExplodeOffsetMm`, `VisualVariantSelection` is imported from the catalog by `main.ts`). Existing exports are unchanged.

## 5. UI and wiring

### 5.1 `src/ui/engineControls.ts`

- **New option on `EngineUiOptions`:** `onBuildChange?: (build: Build) => void`. It is invoked from `evaluateAndPushModifiedBuild` immediately after the `Build` object is assembled from the twelve selects, **before** the compatibility branch — so the 3D visuals track the current selections even while the dyno shows a compatibility violation (the violation is a performance-model message; the geometry being shown is what the dropdowns say). It fires on every selection change (including `setBuildSelection`) and never on `dispose`.
- **Build-section note (new element, always present):** a muted line under the dropdowns, exact text:
  > `3D variants: exterior parts render with the Exterior shell shown (Exterior or X-Ray); the low-compression piston renders in the internal assembly.`
- **Page subtitle** becomes `Milestone 8 — 3D Part Variants` (runtime; `index.html`'s static `<p>` gets the same text, per the M7 pattern).
- **Disclaimer banner** becomes exactly:
  > Illustrative geometry, part shapes & timing: Bore spacing, deck height and piston protrusion, valve timing events, duration, and lift profile shape, lifter gallery placement, detailed part shapes, aftermarket variant part shapes and their service positions, and the registered exterior shell remain illustrative placeholders, not verified LLY measurements.
- Nothing else in the control panel changes: the Build dropdowns, compatibility violations, Dyno two-build comparison, peaks, inspector, and footnote are untouched.

### 5.2 `src/main.ts`

- Build the visual descriptor list once from the merged catalog: `fullCatalog.filter((v) => v.modelPath !== null)` mapped to `VisualVariantDescriptor`s; pass it to `createEngineScene` as the fifth argument.
- Wire `onBuildChange: (build) => { scene.setVisualVariantSelections(visualVariantsForBuild(build, fullCatalog)); }` into `mountEngineUi`'s options; the initial state is applied once after mount (`visualVariantsForBuild` of the initial all-stock build, i.e. no variants).
- **Reference frames.** `REFERENCE_FRAME_DEFS` gains three entries with a new optional `variants?: readonly string[]` field; `applyReferenceFrame` resolves each id's slot from `fullCatalog` and calls `ui.setBuildSelection(slot, id)` for each before applying the remaining view state. New frames (captured as new PNGs, added to `docs/REFERENCE_FRAMES.md` by the build):
  - **RF-8 — Modified external hardware, front three-quarter (Exterior On):** θ = 180°, camera `[1.3800, −1.1800, 0.7200]`, target `[0.3000, −0.0200, 0.1700]`, Full, Exterior on, Explode 0, Section off, X-Ray off, Labels off, variants `[turbo_large, intake_highflow, exhaust_4in, intercooler_upgraded]`.
  - **RF-9 — Modified external hardware, rear-left three-quarter (Exterior On):** θ = 0°, camera `[−0.6200, 1.2200, 0.8600]`, target `[0.2800, 0.0200, 0.1600]`, Full, Exterior on, Explode 0, Section off, X-Ray off, Labels off, same four variants.
  - **RF-10 — Low-compression pistons in the exploded view (Exterior Off):** θ = 90°, camera `[1.2800, −1.0800, 0.7400]`, target `[0.3100, −0.0500, 0.1800]`, Full, Exterior off, Explode 100%, Section off, X-Ray off, Labels on, variants `[turbo_large, pistons_lowcomp]` (the M6 compatibility rule requires the large turbo with low-comp pistons; with Exterior off the turbo variant is not rendered, so the frame isolates the pistons).
- **Benchmark harness.** In `?benchmark=1` mode add an optional `variants=<comma-separated entry ids>` parameter: after mount, for each id find its slot in `fullCatalog` and call `ui.setBuildSelection(slot, id)`; the harness wait condition becomes `stats.detailedLoaded && stats.hdriLoaded && stats.exteriorLoaded && stats.variantsLoaded`. The printed JSON already serializes the whole `renderInfo`, so the new stats fields appear automatically.


## 6. Budgets (D-033): measured numbers and the verdict

**Verdict: the variant models do not threaten the D-033 budgets.** The worst case (full modified build with all five visual variants selected, Exterior on) stays inside every budget with the margins below; the tightest is the phone scene-asset-triangle budget at **3.7 % headroom**. Enforcement is executable, not asserted: the per-model triangle caps are pinned by the variant asset test, the shell-split triangle counts are pinned against the frozen shell GLB, and a static budget-guard test recomputes the worst-case arithmetic (§9).

### 6.1 Triangle caps (the build must not exceed these; measured prototype values are in §12)

| Model | Cap (triangles) | Rationale |
|---|---:|---|
| `turbo_unit_engine_large.glb` | ≤ 3,600 | One housing-detail unit; stock shell unit is 2,056 tris for a similar silhouette |
| `intake_tract_engine_highflow.glb` | ≤ 2,600 | Tube sweep + filter + couplers only |
| `exhaust_system_engine_4inch.glb` | ≤ 2,800 | Pipe sweep + revolved canister |
| `intercooler_core_engine_upgraded.glb` | ≤ 1,800 | Box core + tanks + a fin strip row |
| `rot_piston_c1_lowcomp.glb` | ≤ 5,200 | Same construction/tessellation class as the 4,832-tri stock piston |
| **External total** | **≤ 10,800** | Sum of the four above |
| **All variant files** | **≤ 16,000** | External total + piston cap |

Each variant GLB is also subject to the existing per-file discipline: ≤ 15,000 triangles and ≤ 4 materials, no textures/images.

### 6.2 Shell split accounting (measured from the frozen shell GLB, §12)

- Three preserved subtrees: `turbo_unit` 2,056 tris → 6 meshes; `turbo_downpipe` 560 tris → 1 mesh; `intake_tract` 5,740 tris → 5 meshes. The remaining shell merges to 21 meshes / 23,040 tris.
- Exterior totals after the split: **33 meshes / 31,396 triangles** (was 22 / 31,396). Draw-call delta at stock: **+11 main-pass calls** (the preserve groups' meshes minus one material signature that leaves the global merge).
- Stock scene triangles are therefore unchanged: **271,224** (Exterior off) / **302,620** (Exterior on) — the split changes grouping, not geometry.
- The shell materials (22) and textures (4) are shared by the preserved groups — no VRAM change from the split.

### 6.3 Worst-case state: all five visual variants selected, Exterior on

Baseline = the M7 measured stock state (`302,620` scene triangles / `573,780` submitted desktop / `302,284` submitted phone / `95` desktop calls / `55` phone calls / `27.25 MiB` desktop, `11.25 MiB` phone texture memory / `16.667–16.694 ms` frame time). "Scene asset triangles" below is the new `visibleSceneTriangles` stat (visible geometry, single pass — the same definition the M2–M7 tables used: hidden/not-rendered geometry does not count). Worst case replaces and adds geometry as follows: hide stock `turbo_unit` (−2,056), `intake_tract` (−5,740) and `turbo_downpipe` (−560); add at most the §6.1 caps (+10,800 external); swap the 8 pistons from 4,832 to ≤5,200 tris each (+2,944).

| Normative metric (M2-MEASUREMENTS §5) | Desktop budget | Worst-case projection | Status | Phone budget | Worst-case projection | Status |
|---|---:|---:|---:|---:|---:|---:|
| Scene asset triangles | ≤ 360,000 | **308,008** (302,620 − 8,356 + 10,800 + 2,944) | PASS (Δ 51,992) | ≤ 320,000 | **308,008** | PASS (Δ 11,992) |
| Submitted triangles / frame | ≤ 700,000 | **≤ 582,112** (internals incl. piston Δ doubled by the shadow pass: 2×274,104 + 33,840 exterior + 64 ground) | PASS (Δ 117,888) | ≤ 400,000 | **≤ 308,008** (no shadow pass) | PASS (Δ 91,992) |
| Draw calls / frame (incl. shadow) | ≤ 250 | **≤ 105** (36 shadow + 69 main: baseline 59 main + 11 split − 12 hidden preserved + 11 variant-material meshes) | PASS | ≤ 120 | **≤ 69** (main only) | PASS |
| Texture + HDRI GPU memory | ≤ 64 MiB | **27.25 MiB** (no new textures; variant materials only) | PASS | ≤ 32 MiB | **11.25 MiB** | PASS |
| Frame time @ 900 RPM | ≤ 16.7 ms | expected within noise of the M7 baseline (+≤11k main-pass tris, 0 shadow tris); the build measures it | PASS expected | ≤ 33.3 ms | expected within noise; measured | PASS expected |

- The stock-state measurements do not regress: the split adds 11 hidden-able groups but no geometry; the default state must re-measure at M7's numbers within the measurement tolerance (`scene 302,620 / calls 106 desktop ext-on / 66 phone ext-on`).
- The variant models add **no textures**, so the D-033 texture/HDRI memory metric is untouched; their geometry is small (≤10,800 external + ≤5,200 internal triangles, resident only when attached — the startup parses all variant GLBs but attaches none until selected, so the D-033 "assets resident" accounting stays at the stock numbers for stock builds).
- Residual risk to record in `docs/M8-MEASUREMENTS.md`: first-selection cost (attaching a preloaded group and uploading its buffers) — expected to be a single-frame cost well inside the 60 FPS budget on the reference machine; the measurement run covers selection changes during animation.

### 6.4 What the build must measure and record (`docs/M8-MEASUREMENTS.md`)

Both tiers, production bundle, `?benchmark=1` @ 900 RPM, M2–M7 format: (a) stock state Exterior off/on; (b) worst case (`variants=turbo_large,intake_highflow,exhaust_4in,intercooler_upgraded,pistons_lowcomp` + `exterior=1`) — scene triangles from the stats fields, submitted triangles, calls, texture memory, frame-time percentiles, and CPU render time; (c) a variant-explode run (`explode=100&variants=…&exterior=1`) confirming the models translate by their vectors; (d) per-variant attachment sanity (`visibleVariantModels`, `variantSceneTriangles`, `pistonVariantActive`). The three new reference frames' capture states and the asset-assertion log output are recorded in the same doc.

## 7. Documentation and plan paperwork (build deliverables)

1. **`docs/M8-VARIANTS.md` (new):** the variant dictionary (the five entries with `modelPath`, `explodeVectorMm`, display name, what it replaces/attaches to, triangle count, materials); the **interface datum register** (every §3.2 `if_*` point with its measured source and the shell feature it came from); the **authoring rules** (§3.1: scene-placed vs part-local class, Y-up export, marker convention, no textures); the **shell split record** (the three preserved subtrees, child indices, triangle counts, and why node names are not available below the top level); the **internal-parts position** (§3.5 table verbatim) and the deferred candidates; **provenance** (§3.6 with the `docs/research/M8-variant-references.md` survey grades and the **recorded-but-not-adopted register** verbatim); **known limitations**: stock vehicle-side hardware is not modeled (intercooler core, airbox, exhaust beyond the downpipe — modified parts are shown at service positions, not vehicle installation geometry); the intercooler display position is a service point, not a truck-bay location; the intake model is an open-element display while real LLY kits are boxed cold-air designs; shapes are illustrative; no new labels/markers in the 3D view; the 4-inch exhaust is a representative section, not a full-length system; the variant visual layer is external-only (exterior shell on) except the piston.
2. **`docs/M8-MEASUREMENTS.md` (new):** per-variant GLB record (bytes, triangles, vertices, materials, SHA-256); the build script's logged assertion block (caps, envelopes, interface-marker deviations, physical non-interference with the per-group minimum distances, `V_stock − V_lowcomp` in cm³); the shell split accounting; the runtime benchmark matrix and D-033 compliance table of §6.3 (M2–M7 format, including the reference machine/GPU/browser lines); the RF-8…RF-10 capture record; the stock-restore check (RF-1…RF-7 unchanged).
3. **`docs/REFERENCE_FRAMES.md`:** add RF-8, RF-9, RF-10 to the summary table and the per-frame sections in the existing format (exact camera/angle/states/what-to-look-for + PNG links), captions noting that variant parts are illustrative and exterior parts show at service positions.
4. **`docs/PLAN.md`:** add milestone 8 after milestone 7 and amend the "After 7:" line to "After 8:", exactly:
   > 8. **3D visual part variants**
   >    - The catalog's `modelPath` becomes real for the parts whose modification has an honest visible signature: large turbo, high-flow intake, 4-inch exhaust, upgraded intercooler (replacing the shipped stock representation where one exists, or appearing at a documented service point where the shipped scene has none), and the low-compression pistons (internal assembly, exploded/cutaway views). Stock selections keep the shipped scene; the remaining internal variants are recorded out of scope with reasons.
   >    - Exit: selecting each modified visual variant swaps/shows its 3D model and restoring stock restores the shipped scene; the variant GLBs pass the asset contract (caps, envelopes, interface datums); D-033 budgets pass in the worst-case build with measured numbers; RF-1…RF-7 unchanged for stock builds.
   And amend the post-milestone candidates line exactly:
   > After 8: capped cutaway sections, shareable builds, engine sound, stock vehicle-side hardware models, and the remaining internal-part visual variants (rods, injectors, CP3, camshaft, heads) are candidates.
5. **`docs/DECISIONS.md`:** add, under a new dated heading for the M8 spec:
   > - **D-038 3D visual part variants (Milestone 8).** The catalog's `modelPath`/`explodeVectorMm` fields become live for five modified entries: `turbo_large`, `intake_highflow`, `exhaust_4in`, `intercooler_upgraded` (scene-placed external models: three stock shell subtrees are split into visibility groups — the turbo unit, the downpipe, and the intake tract — and are replaced in place; the intercooler, which the shipped shell does not contain, is shown at its documented charge-pipe service point; external variants are exploded by their catalog vectors) and `pistons_lowcomp` (part-local drop-in replacement for the instanced piston geometry, visible in exploded/cutaway views). Stock selections keep the shipped scene exactly; the 24-entry catalog, schema, and frozen interface are unchanged apart from five `modelPath`/`explodeVectorMm` values. Internal visual variants are consciously limited to pistons: the CR change is the only internal catalog parameter with an honest visible geometry signature. Rods (material-only change, already modeled as a forged H-beam), injectors (+30% nozzle flow, nozzle not hole-modeled), CP3 (internal stroke, no swappable pivot-placed model), camshaft (no camshaft geometry exists; timing/lift profile unpublished), and heads (port geometry unpublished and unmodeled) are **out of scope** with those reasons recorded in `docs/M8-VARIANTS.md`/`docs/OPEN_ITEMS.md`. Budgets re-verified in the worst-case build with measured numbers (phone scene-triangle headroom ≥ 3.7%).
6. **`docs/OPEN_ITEMS.md`:** (a) add a deferred-candidates item: "Internal-part visual variants not in M8 — rods (material-only), injectors/CP3 (flow-internal, no truthful visible change), camshaft (not modeled; timing unpublished), heads (porting unpublished/unmodeled). Deferred until a milestone adds the underlying geometry or published data."; (b) add a watch item: "Stock vehicle-side hardware (intercooler core, airbox, exhaust beyond the turbo downpipe) is not modeled in the exterior shell; the M8 modified variants for those slots are shown at documented service points, so stock-vs-modified 3D comparison is modified-only there — revisit if the shell or a stock hardware model is added."; (c) the L7-derived items stay as they are.
7. **`docs/THREE_API_NOTES.md`:** append a Milestone 8 section: scene-placed GLB authoring frame (project axes + single wrapper), empty-node interface markers (Blender `empty_add` survives GLB export as a node with `translation`; verified), per-group visibility on merged exterior geometry (no re-merge cost), and material/geometry sharing between preserved groups and the global merge (dispose only once).
8. **`assets-src/PROVENANCE.md`:** new "Milestone 8 variant models" table (five files: contract root object(s), what it replaces/attaches to, dimension status per §3.6, license line "repository source / original procedural work").
9. **`assets-src/README.md`:** the variant regeneration command next to the existing one.
10. **Research file (already on the planning branch):** `docs/research/M8-variant-references.md` — the published-reference survey this spec cites. It is committed with the plan, not by the build.
11. **`docs/ASSET_CONTRACT.md`:** add the **scene-placed class** of §3.1 to the contract rules (project-frame authoring, geometry at final project position, no pivot/animation, interface-marker convention, no textures, testable via the variant asset contract), and note that the part-local class is unchanged. No other contract rule changes.


## 8. Frozen files

**Frozen — no changes:** `src/core/**` (the D-010 contract — `interfaces.ts` is not revised), `src/perf/**` (model, config, resolver, stock build, tests — M5/M6 behavior untouched; the visual data is never read by the perf layer), `src/config/**` (read-only imports), `catalog/stock.json`, `catalog/schema.json`, the ten stock part GLBs in `public/models/*.glb`, `public/Duramax_LLY_2005_66L_V8.glb`, `public/hdri/**`, `public/legacy/**`, `assets-src/blender/build_cylinder1.py` (its helpers are imported by the new script, not edited), `assets-src/dimensions.json`, `assets-src/fixture/**`, `tools/**`, `package.json`/`package-lock.json` (no new dependencies), `.github/**`, `vite.config.ts`, `src/renderer/layout.ts`, `src/renderer/viewLayout.ts`, and all existing tests **except** the one named change in §9.10. Prior milestone docs/specs (`docs/M2-MEASUREMENTS.md` … `docs/M7-DATA.md`, `docs/specs/M0-`…`M7-`) and `docs/PLANNING.md`/`docs/ORCHESTRATOR.md` stay byte-identical (M6-PARTS' "no 3D visual swapping" limitation is historical; `docs/M8-VARIANTS.md` records the supersession).

**Changed (expected):** `catalog/modified.json` (five entries: `modelPath` + `explodeVectorMm` only); `src/catalog/index.ts` (`visualVariantsForBuild` + type); new `src/renderer/partVariants.ts` and `src/renderer/variantLoader.ts`; `src/renderer/exteriorLoader.ts` (preserve spec + `partGroups`); `src/renderer/engineScene.ts` (§4.3 only); `src/renderer/partLoader.ts` (additive `extractAllPartPrimitives` only); `src/renderer/index.ts` (exports); `src/ui/engineControls.ts` (onBuildChange, Build note, subtitle, banner); `src/main.ts` (descriptor wiring, onBuildChange, RF-8…RF-10, benchmark `variants` param + wait condition); `index.html` (static subtitle text only); `src/catalog/modified.test.ts` (the one named change, §9.10); new tests `src/assets/variantAssets.test.ts`, `src/catalog/visualVariants.test.ts`, `src/renderer/partVariants.test.ts`; new assets `assets-src/blender/build_variants.py`, `assets-src/variant_dimensions.json`, five GLBs in `public/models/variants/`; docs `docs/M8-VARIANTS.md`, `docs/M8-MEASUREMENTS.md`, `docs/REFERENCE_FRAMES.md` + `docs/reference-frames/RF-8.png`…`RF-10.png`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`, `docs/THREE_API_NOTES.md`, `docs/ASSET_CONTRACT.md` (new scene-placed class section, §3.1), `assets-src/PROVENANCE.md`, `assets-src/README.md`. If you believe any other file must change, stop and report it instead of changing it.

## 9. Tests

Existing suite (all M0–M7 tests) passes with exactly one named change (§9.10). New tests (≈12, three new files) — each names the regression it catches:

1. **Catalog visual data** (`src/catalog/visualVariants.test.ts`, with Node `fs`): exactly five modified entries have non-null `modelPath`, matching the §2 table id-for-id; the other 19 entries (12 stock + 7 modified) keep `modelPath: null` and `explodeVectorMm: [0,0,0]`; every non-null path exists at `public/<path>`; paths match `^models/variants/[a-z0-9_]+\.glb$` and are unique. *Catches: a catalog pointing at a missing/renamed asset; a visual variant slipping in beyond the agreed five; stock entries accidentally gaining models.*
2. **Explode vectors:** the four external entries carry exactly the §2 vectors; `pistons_lowcomp` carries `[0,0,0]`; every other entry is `[0,0,0]`. *Catches: vectors claimed by §2 but not shipped (the explode view would not separate the parts).*
3. **`visualVariantsForBuild` (pure):** `stockBuild` → `[]`; the §6 full build → exactly five descriptors in slot order with the §2 `modelPath`s and vectors; a build selecting only non-visual modified entries → `[]`; unknown/absent selections are skipped without throwing. *Catches: the selection→visual pipeline dropping or duplicating a part.*
4. **Variant GLB asset contract** (`src/assets/variantAssets.test.ts`, Node `fs`, no three.js — same binary-GLB parsing approach as `src/assets/glbContract.test.ts`): each of the four external files exists, parses as glTF 2.0, contains its contract root object name, has ≤ its §6.1 triangle cap and ≤4 materials, contains **no images and no texture references**, contains exactly the expected `if_*` marker set, each marker's project-space translation equals its §3.2 datum within **±1.0 mm**, the whole model's project-space bounds are inside the §3.2 envelope, and (V3/V4) minimum Z ≥ −225 mm. *Catches: a model rebuilt without the datum contract (would float/disconnect), an envelope drift into shell geometry, a budget overrun, accidental textures.*
5. **Piston variant asset contract** (same file): file/parse/cap; authored in the stock part-local convention — outer diameter (glTF X and Z) 102.85 ±1.0 mm, crown at glTF +Y 49.8 mm (−0.1/+0.2), pivot node world translation ≈ (0,0,0) within 1e-6, ≤4 materials. *Catches: a piston that is geometrically incompatible with the bore/kinematics or whose pivot drifted (it would sit at the wrong height and visibly collide).*
6. **`variant_dimensions.json` sync** (same file): the JSON's key set is exactly the pinned set and every value equals the §3.2/§3.3 pin (expected literal object in the test). *Catches: the Blender script drifting from the spec's dimension table without the GLB contract noticing a subtle change.*
7. **Shell split contract** (`src/renderer/partVariants.test.ts`, Node `fs`): parse the frozen shell GLB; using `EXTERIOR_PRESERVED_SUBTREES`, assert the three subtrees are found and total 2,056 / 560 / 5,740 triangles respectively, the shell totals 31,396 triangles, and no preserved id is unknown. *Catches: a wrong child index (the renderer would hide the up-pipes instead of the turbo unit), or a shell replacement silently invalidating the split.*
8. **`partVariants` pure rules:** `computeVariantExplodeOffsetMm` returns `[0,0,0]` at e=0, the exact vector at e=1, linear at 0.5, clamps out-of-range/non-finite e; `EXTERNAL_VISUAL_SLOTS`/`VISUAL_VARIANT_SLOTS` contents; every id in `SHELL_PARTS_REPLACED_BY_SLOT` exists in `EXTERIOR_PRESERVED_SUBTREES`, and every external slot has an entry (intercooler → `[]`). *Catches: a visibility rule that references a non-existent shell group or forgets a slot.*
9. **Budget guard (static):** pins the §6.3 inputs and asserts `302_620 − 8_356 + 10_800 + 2_944 ≤ 320_000` (phone) and `≤ 360_000` (desktop). *Catches: a future triangle-cap or hidden-subtree change that silently breaks D-033.*
10. **The one named existing-test change** — `src/catalog/modified.test.ts` test 1: its blanket `expect(entry.modelPath).toBeNull()` and `expect(entry.explodeVectorMm).toEqual([0,0,0])` assertions over all 12 modified entries are replaced by the §9.1/§9.2 expectations (five visual entries non-null with the §2 values; the other seven null/zero). The schema validation, 24-entry count, unique-id, provenance, and notes assertions in that test stay as-is. No other existing test is edited; in particular `src/assets/glbContract.test.ts` stays untouched (the ten stock GLBs are unchanged; variant tests are the new file).
11. **Perf/catalog parity (unchanged, re-run):** `computeCurve(stockBuild, fullCatalog)` still deep-equals `computeCurve(stockBuild)`; the M6 scenario/determinism suite passes unmodified — *catches: visual changes accidentally perturbing performance data* (the visual fields are never read by `src/perf`).
12. **Reference-frame definitions:** `src/main.ts`'s three new RF entries resolve their variant ids against the catalog (a pure helper `slotForVariantId` used by `applyReferenceFrame` is tested: each RF-8…RF-10 id exists, has a non-null `modelPath`, and maps to its catalog slot) — *catches: a mistyped variant id in a reference frame (the frame would silently render the stock build).*

Headless tests cannot assert WebGL visibility; the visibility/swap behavior is verified by §10.7 and the reference frames, the same split of responsibilities used in M2–M7.

## 10. Acceptance criteria (Buckley verifies from a fresh clone + deployed site)

1. **Frozen audit:** the diff against `main` touches only the §8 changed list; `src/core/interfaces.ts`, `src/perf/**`, `catalog/stock.json`, `catalog/schema.json`, the ten stock GLBs, the exterior shell GLB, `build_cylinder1.py`, `dimensions.json`, and prior docs/specs are byte-identical.
2. **Fresh-clone gates:** `npm ci`, typecheck, full suite (existing + new, only the §9.10 change), and production build all pass.
3. **Asset regeneration:** from a fresh clone, `assets-src/blender/build_variants.py` (Blender 5.2.3) regenerates the five GLBs; its logged assertions (caps, envelopes, markers, **physical non-interference**, `V_stock − V_lowcomp`) pass; the shipped GLB hashes recorded in `docs/M8-MEASUREMENTS.md` match the committed files.
4. **Data spot-check:** the shipped catalog has exactly the five §2 `modelPath`s and `explodeVectorMm` values; stock entries are `null`/zero; the JSON dimensions match §3.2/§3.3 (via test 6).
5. **Budget check:** re-run the §6.4 benchmark matrix from the deployed build at the specified URLs (stock and worst case, Full + Phone): every D-033 budget passes, the stock state reproduces the M7 numbers within tolerance, and the worst-case numbers are within the §6.3 projections. Read the printed `renderInfo`, not the summary.
6. **Stock-restore check:** with all twelve slots stock, the scene matches M7 visually (RF-1…RF-7 side-by-side; no new artifacts at the split boundaries, no z-fighting; `visibleVariantModels` empty, `pistonVariantActive` false).
7. **Deployed variant checks (Exterior on unless noted):** selecting `turbo_large` shows the larger turbo unit in the valley and hides the stock unit; `intake_highflow` replaces the stock intake tract with the high-flow tract + open filter; `exhaust_4in` replaces the stock downpipe with the 4-inch system; `intercooler_upgraded` shows the cooler connected at the charge-pipe service point; restoring each slot to stock restores the shipped appearance. With Exterior off, external variants are not rendered (and the Build note explains it). Selecting `pistons_lowcomp` (+ `turbo_large`, the M6 rule) shows the dished forged pistons in the exploded/cutaway views (RF-10); restoring stock pistons restores the stock pistons. At Explode = 100 %, the four external variant models translate by their §2 vectors. Cutaway, X-ray, labels, the Build/dyno comparison, and all M2–M7 features are unaffected; no console errors.
8. **Docs:** `docs/M8-VARIANTS.md`, `docs/M8-MEASUREMENTS.md` complete per §7; RF-8…RF-10 captured, committed, and matching their described states; PLAN/DECISIONS/OPEN_ITEMS/THREE_API_NOTES/ASSET_CONTRACT/PROVENANCE/README updated exactly as §7 specifies.
9. **Outside review (D-021)** is recorded for the milestone-exit PR; the default run has no console errors and no D-033 regression.

## 11. Handoff

Work on branch `m8-part-variants` in the local clone. First author `assets-src/variant_dimensions.json` from the §3.2/§3.3 tables (exact keys/values; the asset test pins them), then implement `assets-src/blender/build_variants.py` and generate the five GLBs, then the renderer/UI wiring and tests, then the docs. Regenerate with:

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python assets-src/blender/build_variants.py -- --out public/models/variants
```

When done, push the branch and send a closing summary covering: files changed; test/typecheck/build results; the five GLB triangle counts, byte sizes and SHA-256s; the build script's logged assertion block (caps/envelopes/marker deviations/`V_stock − V_lowcomp`); both benchmark tiers in the stock and worst-case states (the §6.4 table), the RF-8…RF-10 capture states, and anything that deviated from this spec. Local environment: Node 24, Blender 5.2.3; no new npm dependencies; no PR, no merge. Buckley verifies from a fresh clone, opens the PR, and merges.


## 12. Pre-build self-check (recorded)

Every number below was computed/prototyped **before** this spec was finalised: a dependency-free GLB parser re-derived the frozen shell's geometry from the file (validated against M3's published numbers first), five variant models were built as procedural prototypes and measured against that shell, and the budget arithmetic was recomputed from the measured caps. The prototype lives outside the repo (scratch folder `C:\Users\colin\Documents\DeepSeek\m8-prototype\`, not a build deliverable; its measurement record is `PROTOTYPE-REPORT.md` / `out/results.json`); the numbers are quoted here and `docs/M8-MEASUREMENTS.md` will re-measure them on the shipped GLBs.

### 12.1 Shell-parse control runs (harness validation before trusting it)

- **Registration reproduction:** applying `p_mm = (204.2, 0, 111.8) + 430·R·p_file` with `R:(x_f,y_f,z_f)→(z_f,x_f,y_f)` to the shipped shell reproduces the M3-measured bounds exactly: X [−282.14, 892.75], Y [−573.40, 521.82], Z [−223.60, 583.88] mm; whole-shell 31,396 triangles / 33,187 vertices.
- **Subtree reproduction:** the `turbo` group's four direct children are 384 / 384 / 560 / 2,056 triangles (RH up-pipe, LH up-pipe, downpipe, turbo unit), and `intake` is 5,740 — matching the M3/M4 records.
- **Interface reproduction:** all seven stock contact vertices used as interface datums were re-found at 0.03–0.05 mm of the independently measured points (e.g. turbo unit ↔ compressor inlet 1.80 mm apart, turbo unit ↔ up-pipes 2.5/3.2 mm).
- **Merge accounting reproduction:** the shipped shell's material-signature merge gives 22 meshes; re-bucketing with the three preserved subtrees gives **33 meshes (+11 main-pass calls)** and the same 31,396 triangles — the §6.2 accounting is exact.

### 12.2 Prototype models — measured (the §3.2/§6 numbers come from here)

Project-frame mm; "obs. min" = minimum vertex-to-vertex distance to non-excluded shell geometry (exclusions per §3.3); "ground clr" = min Z + 245 mm; interface deviation = nearest model mesh vertex to the §3.2 datum.

| Model | Tris | Cap | Verts | Mats | Bounds X | Bounds Y | Bounds Z | Ground clr | Obs. min | Nearest group | Interface dev. |
|---|---:|---:|---:|---:|---|---|---|---:|---:|---|---|
| V1 turbo unit | **3,166** | 3,600 | 1,687 | 3 | −178.35…47.10 | −126.00…136.00 | 263.00…530.00 | 508.0 mm | 20.62 mm | blockPan | 5/5 markers 0.000 mm |
| V2 intake tract | **2,400** | 2,600 | 1,255 | 3 | −18.91…782.34 | −641.77…54.45 | 289.09…547.82 | 534.1 mm | 20.48 mm | acComp | 2/2 markers 0.000 mm |
| V3 exhaust | **2,272** | 2,800 | 1,175 | 2 | −1,092.64…−113.81 | −218.00…2.00 | −85.00…415.96 | 160.0 mm | 71.70 mm | blockPan | 1/1 marker 0.000 mm |
| V4 intercooler | **1,360** | 1,800 | 739 | 3 | 90.00…682.00 | 471.88…695.00 | −40.00…320.00 | 205.0 mm | 163.62 mm | electronics | 1/1 marker 0.000 mm |
| V5 low-comp piston | **4,224** | 5,200 | 2,214 | 3 | ±51.42 (OD 102.85) | ±51.42 (OD 102.85) | −22.94…49.80 | n/a | n/a (internal) | — | n/a |
| **Total** | **13,422** | 16,000 | — | — | — | — | — | — | — | — | — |

Prototype GLBs: 261,296 bytes total, valid glTF 2.0; Blender 5.2 import → re-export round-trip preserved triangle counts, materials, and every `if_*` marker empty (empty-node export was verified separately: a Blender-authored `PLAIN_AXES` empty exports as a named mesh-less glTF node with its translation intact — the §3.1 marker convention is executable).
Piston detail: OD 102.85, crown 49.80, stock omega dish volume 29.586 cm³ → open flat-floor dish 32.816 cm³ = **Δ +3.230 cm³ exactly**, dish depth 13.446 → 16.30 mm, lip radius 27.77 → 28.80 mm, 48 circumferential segments. No valve reliefs (decision §3.6).

### 12.3 The one finding that changed the design: vertex-to-vertex clearance understates contact

The first intake prototype (the briefed 7-point centerline) measured a positive **1.96 mm** vertex-to-vertex minimum against `cp3Fuel` — but a solid-envelope check showed **132 non-excluded shell vertices inside the 4-inch tube's volume** (`acComp` 52, `injectors` 41, `cp3Fuel` 39; min centreline clearance 11.11 mm). The same route at the original 90 mm OD already had 105 vertices inside. The shipped stock intake's own minimum clearance to `acComp` is 1.41 mm, so the real corridor is genuinely tight — this was a **route** error, not a diameter error.
Consequence, resolved in the spec: (a) §3.3's build-script assertion is now a **physical** check (zero non-excluded shell vertices inside a model's solid envelope **and** vertex-to-vertex ≥ 2.0 mm), not vertex-to-vertex alone; (b) the V2 tube path is re-derived from the **stock intake tract's own centerline** (§3.2 V2) instead of hand-picked control points. Re-derived route, re-measured: centreline length 887.8 mm; **0 shell vertices inside the 4-inch tube envelope** (was 132); minimum vertex-to-vertex distance **20.48 mm** (`acComp`), then `resonator` 22.16, `egrSystem` 25.22, `cp3Fuel` 35.76, `injectors` 65.53 mm — every required group clears by ≥20 mm, far better than the shipped stock intake's 1.41 mm precedent; minimum shell-vertex distance to the tube centreline 68.53 mm (≥17.7 mm surface gap). Bounds and the triangle cap are unchanged (2,400 tris; bounds above); the filter position/orientation is unchanged, the tube start ring moved 3 → 6 mm downstream of the compressor-inlet marker (end-face fan centre still exactly on the marker), and the last ≈45 mm is aligned to the filter axis.

### 12.4 Budget arithmetic re-check (caps vs measured)

- Caps-based worst case (the §9 budget-guard test): `302,620 − 8,356 + 10,800 + (5,200−4,832)×8 = 308,008` ≤ 320,000 phone / ≤ 360,000 desktop — the design guarantee, independent of how the prototypes came out.
- **Prototype-measured** worst case: `302,620 − 8,356 + 9,198 + (4,224−4,832)×8 = 298,598` scene triangles — i.e. the five measured models, at the full-modified build with the exterior on, are **4,022 triangles below** the stock scene because the preserved-subtree hides (−8,356) exceed the variant additions (+9,198) and the piston swap (−4,864). Draw calls: +11 split, +11 variant-material meshes, −12 hidden preserved = **+10 net** over the M7 stock state (main pass), 105 desktop / 69 phone in the worst case — both far under the D-033 caps (§6.3 uses the cap-based numbers, which are the conservative ones).
- Texture/HDRI memory is unchanged (no textures in any variant GLB); variant geometry residency is ≤ 13,422 triangles when all are attached.
- **D-033 verdict: no threat.** Phone scene-asset headroom is **11,992 triangles (3.7 %)** on the cap-based worst case and ~21,402 on the measured models; draw-call headroom is 51 desktop / 51 phone; VRAM is unchanged. The caps in §6.1 are what the asset tests enforce, so future edits cannot quietly consume the headroom.

### 12.5 Contra­dictions found while drafting (all resolved in the spec, none silently)

1. **Vertex-to-vertex clearance is not a sufficient interference metric** (finding 12.3) — the spec adds the solid-envelope check; the prototype's first route is rejected.
2. **Flange radii vs the turbo envelope:** radial up-pipe flanges r≈52 and a turbine-outlet flange r≈58 would push model 1 past the X ≥ −180 envelope (to X ≈ −204); resolved by r 44 angled up-pipe flanges and a tilted r 52 turbine-outlet flange whose face normal `(−0.782, −0.247, −0.572)` is shared with V3 so the two models visibly mate (§3.2, §12.2).
3. **Piston compression-volume ambiguity:** counting valve-relief pockets toward the +3.23 cm³ would make the modeled CR ≈16.24:1, not 16.5:1, and the stock model has no reliefs to compare against — resolved by modeling **no** reliefs, making the crown-profile volume difference exactly the catalog's CR change (§3.2 V5, §3.6 not-adopted register).
4. **`modified.test.ts` is the only existing test that asserts `modelPath`/`explodeVectorMm` values** (its test 1 blanket-null loop) — named as the single existing-test change (§9.10). No other test, schema, or frozen interface needs to change.
5. **The exterior shell's nodes below the top level are unnamed** — the preserve spec therefore addresses the turbo group's children by file order (0…3), pinned against the frozen shell's triangle counts in test §9.7.
6. **The shipped shell has no intercooler core, no airbox, and no exhaust beyond the turbo downpipe** — M8 shows the modified vehicle-side parts at documented service points and keeps the stock scene as shipped (§3.4, §7 known limitations, OPEN_ITEMS watch item); it does not fabricate stock hardware.
7. **`explodeVectorMm` was dead data after M6** — given a meaning for the four external variants only (external parts separate from the static shell at Explode > 0); internal parts keep using the M4 pipeline and stay `[0,0,0]` (§2).

