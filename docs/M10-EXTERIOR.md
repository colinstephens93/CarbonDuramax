# Milestone 10 — Exterior Accuracy (`docs/M10-EXTERIOR.md`)

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) (Milestone 10) · Decisions: D-011, D-012, D-033, D-038, D-039, **D-041**, **D-042** · Spec: [`docs/specs/M10-exterior-accuracy.md`](./specs/M10-exterior-accuracy.md) · QA record: [`docs/specs/M10-exterior-accuracy-QA.md`](./specs/M10-exterior-accuracy-QA.md) · Graded source survey: [`docs/research/M10-exterior-accuracy-survey.md`](./research/M10-exterior-accuracy-survey.md) · Measurements: [`docs/M10-MEASUREMENTS.md`](./M10-MEASUREMENTS.md) · Asset contract: [`docs/ASSET_CONTRACT.md`](./ASSET_CONTRACT.md) · Provenance register: [`assets-src/PROVENANCE.md`](../assets-src/PROVENANCE.md)

Milestone 10 replaces the Milestone 3 registered owner concept-set shell (`1,973,652 B`, `31,396` triangles, `4` embedded textures / `6.500 MiB` VRAM, SHA-256 `42993c99…0896`) with a **project-frame-authored, untextured, budget-capped model** of the 2005 GM 6.6L Duramax LLY (`VIN 2`) external hardware (`public/Duramax_LLY_2005_66L_V8.glb`, `1,212,932 B`, **`37,100` triangles**, `0` textures, SHA-256 `d51f88a0073fde617d1c6492618fcfabc672154288ac546e52fe2ed40b718554`).

Generated deterministically in headless **Blender `5.2.3 LTS`** (`hash e13b728c6880`) by [`assets-src/blender/build_shell.py`](../assets-src/blender/build_shell.py) reading all internal layout anchors, preserved Milestone 8 `if_*` datums, and per-system parameters exclusively from [`assets-src/shell_dimensions.json`](../assets-src/shell_dimensions.json) (zero hard-coded geometry literals in Python). All five Milestone 8 variant GLBs (`public/models/variants/*.glb`) and all ten internal Cylinder-1 GLBs (`public/models/*.glb`) remain **byte-identical**.

---

## 1. Project-Frame Shell Asset Class & Degenerate Registration (Spec §§5.1, 6.5, D-042)

Instead of authoring in an arbitrary file frame and rescaling at runtime (`s = 0.430`, `T = [0.2042, 0, 0.1118] m`), the rebuilt shell is authored directly in the **master project frame** (`+X` front along crank axis, `+Y` vehicle LH bank `2-4-6-8`, `-Y` vehicle RH bank `1-3-5-7`, `+Z` up, metres) at final assembled coordinates:

| Property | M3–M9 Registered Shell | M10 Project-Frame Shell (`D-042`) |
| --- | --- | --- |
| Authoring frame | Owner concept-set file frame | Master project frame (`+X` front, `+Y` LH, `+Z` up, `1 unit = 1 m`) |
| Blender export convention | Third-party `THREE.GLTFExporter` | Headless Blender `export_yup=True`, `export_extras=True` (`(g_x, g_y, g_z) = (X, Z, -Y)`) |
| `uniformScale` (`src/renderer/layout.ts`) | `0.430` | **`1.0`** |
| `translationM` (`src/renderer/layout.ts`) | `[0.2042, 0, 0.1118]` | **`[0, 0, 0]`** |
| `basisColumnsProjectFromFile` | `[[0, 1, 0], [0, 0, 1], [1, 0, 0]]` (`det = +1`) | **`[[1, 0, 0], [0, 0, 1], [0, -1, 0]]`** (`det = +1`, `p_proj = (g_x, -g_z, g_y)`) |
| GLTF file bounds (m) | `X[-1.3335, 1.2135]`, `Y[-0.7800, 1.0979]`, `Z[-1.1310, 1.5999]` | **`X[-0.272516, 0.617800]`, `Y[-0.223500, 0.556000]`, `Z[-0.480664, 0.549860]`** |
| Project bounds (mm) | `X[-282.14, 892.75]`, `Y[-573.40, 521.82]`, `Z[-223.60, 583.88]` | **`X[-272.52, 617.80]`, `Y[-549.86, 480.66]`, `Z[-223.50, 556.00]`** |
| Geometry & attributes | `283` mesh nodes (`31,396` tris), UVs present | `92` `extras.partId` mesh objects (`37,100` tris), indexed triangulated `POSITION` + `NORMAL` only (`0` UVs) |
| Materials & textures | `99` slots → `22` signatures, `4` embedded textures (`6.500 MiB`) | `12` untextured `MeshStandardMaterial`s → **`12` global + `11` preserved = `23` exterior draw calls**, **`0` textures (`0 MiB`)** |

`src/renderer/exteriorLoader.ts` is **unmodified**: it reads `layout.exterior` (`ExteriorRegistrationSpec`), merges non-preserved meshes into `12 ≤ 24` global material buckets, and preserves the three Milestone 8 swap subtrees (`turbo_unit`, `turbo_downpipe`, `intake_tract`) in `11 ≤ 13` subtree meshes (`23 ≤ 37` total exterior meshes).

---

## 2. 22-Group & 92-Feature Inventory vs Normative Budget (Spec §§5.2, 5.3)

The twelve Milestone 3 top-level group names (`0..11`) retain their exact names, order, and split semantics; ten new system groups (`12..21`) are appended after them. Fasteners are budgeted inside their owning groups (`ext_vc_fasteners`, `ext_ybridge_fasteners`, flange bolt rows) with zero separate fastener pool.

| Top-Level Index & Group | `extras.partId` Vocabulary (`92` distinct IDs) | Measured Tris | §5.2 Ceiling | Status | Measured Project Bounds `[X, Y, Z]` (mm) |
| --- | --- | ---: | ---: | :---: | --- |
| `0` `blockPan` | `ext_block` (`2,240`), `ext_pan` (`820`), `ext_drain_boss` (`100`), `ext_mount_lh` (`170`), `ext_mount_rh` (`170`) | **`3,500`** | `3,500` | **PASS** | `X[-62.0, 479.0]`, `Y[-251.7, 232.1]`, `Z[-223.5, 242.0]` |
| `1` `injectors` | `ext_injector_1..8` (`8 × 140`), `ext_inj_connector_1..8` (`8 × 90`), `ext_inj_return_line` (`260`) | **`2,100`** | `2,100` | **PASS** | `X[39.5, 417.0]`, `Y[-290.7, 290.7]`, `Z[296.6, 367.3]` |
| `2` `cp3Fuel` | `ext_cp3` (`520`), `ext_fca` (`160`), `ext_hp_rails` (`280`), `ext_hp_lines` (`440`) | **`1,400`** | `1,400` | **PASS** | `X[30.0, 452.0]`, `Y[-269.2, 269.2]`, `Z[162.0, 332.6]` |
| `3` `turbo` | child `0` `ext_uppipe_rh` (`550`), child `1` `ext_uppipe_lh` (`550`), child `2` **`turbo_downpipe`** *(preserved, `800`)*, child `3` **`turbo_unit`** *(preserved, `3,400`)* | **`5,300`** | `5,300` | **PASS** | `X[-272.5, 49.8]`, `Y[-282.9, 282.9]`, `Z[-21.9, 508.4]` |
| `4` `egrSystem` | `ext_egr_valve` (`520`), `ext_egr_cooler` (`620`), `ext_egr_pipes` (`520`), `ext_egr_bracket` (`240`) | **`1,900`** | `1,900` | **PASS** | `X[-52.4, 251.6]`, `Y[-122.0, -45.7]`, `Z[214.0, 344.0]` |
| `5` `resonator` | `ext_resonator` (`420`), `ext_resonator_clamp` (`180`) | **`600`** | `600` | **PASS** | `X[92.0, 236.5]`, `Y[6.6, 112.0]`, `Z[324.0, 556.0]` |
| `6` `intake` *(preserved)* | `ext_intake_mouthpiece` (`620`), `ext_intake_duct` (`1,320`), `ext_intake_clamps` (`360`) | **`2,300`** | `2,300` | **PASS** | `X[-19.1, 615.6]`, `Y[-549.9, 58.1]`, `Z[325.1, 512.4]` |
| `7` `boostPipe` | `ext_charge_hot` (`1,400`) | **`1,400`** | `1,400` | **PASS** | `X[32.6, 412.5]`, `Y[42.4, 480.7]`, `Z[107.0, 440.4]` |
| `8` `alternator` | `ext_alternator` (`920`), `ext_vacuum_pump` (`480`) | **`1,400`** | `1,400` | **PASS** | `X[342.0, 494.0]`, `Y[-352.0, -124.5]`, `Z[54.0, 408.0]` |
| `9` `acComp` | `ext_ac_compressor` (`220`), `ext_ps_pump` (`180`), `ext_ac_bracket` (`100`), `ext_ac_hoses` (`100`) | **`600`** | `600` | **PASS** | `X[348.0, 492.0]`, `Y[118.0, 367.0]`, `Z[38.0, 449.7]` |
| `10` `beltDrive` | `ext_damper` (`560`), `ext_fan_clutch` (`420`), `ext_fan` (`940`), `ext_tensioner` (`340`), `ext_idler_a` (`220`), `ext_idler_b` (`220`), `ext_belt` (`600`) | **`3,300`** | `3,300` | **PASS** | `X[456.0, 617.8]`, `Y[-356.2, 336.4]`, `Z[-99.0, 423.4]` |
| `11` `electronics` | `ext_harness_loom` (`200`), `ext_harness_main_break` (`100`), `ext_glowplug_loom` (`100`) | **`400`** | `400` | **PASS** | `X[-81.1, 420.5]`, `Y[-299.2, 299.2]`, `Z[183.9, 356.0]` |
| `12` `frontCover` | `ext_front_cover` (`690`), `ext_wp_boss` (`230`), `ext_cp3_pad` (`180`) | **`1,100`** | `1,100` | **PASS** | `X[435.5, 486.5]`, `Y[-196.8, 176.0]`, `Z[-88.0, 256.0]` |
| `13` `heads` | `ext_head_rh` (`376`), `ext_head_lh` (`376`), `ext_exh_port_stub_rh_1..4` (`4 × 106`), `ext_exh_port_stub_lh_1..4` (`4 × 106`) | **`1,600`** | `1,600` | **PASS** | `X[-24.0, 482.5]`, `Y[-295.7, 295.7]`, `Z[142.3, 290.3]` |
| `14` `valveCovers` | `ext_vc_lower_rh` (`240`), `ext_vc_lower_lh` (`240`), `ext_vc_upper_rh` (`630`), `ext_vc_upper_lh` (`630`), `ext_vc_pcv_boss` (`120`), `ext_vc_fasteners` (`1,540`) | **`3,400`** | `3,400` | **PASS** | `X[-22.0, 481.0]`, `Y[-342.2, 342.2]`, `Z[203.3, 340.0]` |
| `15` `exhaustManifolds` | `ext_exh_manifold_rh` (`750`), `ext_exh_manifold_lh` (`750`), `ext_exh_shield_rh` (`400`), `ext_exh_shield_lh` (`400`) | **`2,300`** | `2,300` | **PASS** | `X[-43.3, 429.3]`, `Y[-320.7, 320.7]`, `Z[73.1, 172.8]` |
| `16` `chargePipeCold` | `ext_charge_cold` (`800`) | **`800`** | `800` | **PASS** | `X[298.1, 513.5]`, `Y[-453.5, 10.3]`, `Z[146.9, 369.1]` |
| `17` `intakeBridge` | `ext_ybridge_duct` (`620`), `ext_ybridge_crossover` (`720`), `ext_ybridge_seals` (`180`), `ext_map_sensor` (`180`), `ext_ybridge_fasteners` (`600`) | **`2,300`** | `2,300` | **PASS** | `X[214.0, 346.4]`, `Y[-144.8, 144.8]`, `Z[234.3, 352.0]` |
| `18` `fuelFilter` | `ext_fuel_filter_head` (`340`), `ext_fuel_filter_canister` (`260`) | **`600`** | `600` | **PASS** | `X[190.6, 268.2]`, `Y[-320.0, -189.2]`, `Z[174.7, 374.0]` |
| `19` `oilFill` | `ext_oil_fill_neck` (`140`), `ext_oil_cap` (`110`) | **`250`** | `250` | **PASS** | `X[460.0, 540.8]`, `Y[66.0, 137.4]`, `Z[186.0, 386.8]` |
| `20` `dipstick` | `ext_dipstick_tube` (`130`), `ext_dipstick_handle` (`120`) | **`250`** | `250` | **PASS** | `X[-42.1, 120.1]`, `Y[-302.6, -159.9]`, `Z[-38.6, 447.9]` |
| `21` `liftBracket` | `ext_lift_bracket` (`300`) | **`300`** | `300` | **PASS** | `X[-33.0, -17.0]`, `Y[156.0, 212.0]`, `Z[268.0, 372.0]` |
| **Total** | **`92` distinct `extras.partId` leaves across `22` groups** | **`37,100`** | **`37,100`** | **PASS** | **`X[-272.52, 617.80]`, `Y[-549.86, 480.66]`, `Z[-223.50, 556.00]`** |

**Preserved Milestone 8 swap subtrees (`src/renderer/partVariants.ts`):**
- `turbo_unit` (`turbo` child `3`): **`3,400`** tris (`6` merged material primitives ≤ `6` cap)
- `turbo_downpipe` (`turbo` child `2`): **`800`** tris (`2` merged material primitives ≤ `2` cap)
- `intake_tract` (`intake` whole group): **`2,300`** tris (`3` merged material primitives ≤ `5` cap)
- **Preserved total:** **`6,500`** tris across **`11`** merged meshes (`≤ 13` cap); **global-merge remainder:** **`30,600`** tris across **`12`** merged material buckets (`≤ 24` cap).

---

## 3. Untextured 12-Material PBR Palette As Built (Spec §5.5)

All 92 mesh objects share an untextured `MeshStandardMaterial` palette (`doubleSided = true`, zero images, zero textures, zero UV attributes, uniform `POSITION` + `NORMAL` indexed primitives):

| Material Name | Linear Base Colour `(R, G, B)` | Metalness | Roughness | Global Bucket? | Preserved Subtree Usage | Primary Components |
| --- | --- | ---: | ---: | :---: | --- | --- |
| `mat_cast_iron` | `(0.155, 0.160, 0.170)` | `0.55` | `0.72` | Yes | `turbo_unit` | V-block skirt, head castings, outboard exhaust manifolds, GT3788VA turbine housing |
| `mat_cast_alu` | `(0.470, 0.480, 0.500)` | `0.82` | `0.46` | Yes | `turbo_unit` | Upper/lower valve covers, front cover, Y-bridge, compressor volute, alternator, A/C, CP3, filter head, oil fill neck |
| `mat_powder_black` | `(0.055, 0.058, 0.064)` | `0.30` | `0.62` | Yes | `intake_tract` | Corrugated intake duct, mouthpiece, resonator, 6-rib K06 belt, 9-blade fan, oil cap, engine mount pads, canister accents |
| `mat_steel` | `(0.560, 0.575, 0.600)` | `0.90` | `0.28` | Yes | `turbo_unit`, `turbo_downpipe` | Pulleys, idlers, tensioner, brackets, up-pipes, downpipe, manifold shields, injector bodies, HP fuel rails/lines, lifting bracket |
| `mat_stainless_polished` | `(0.760, 0.775, 0.800)` | `0.95` | `0.16` | Yes | `intake_tract` | Hot & cold `Ø63.5 mm` charge pipes, Marman/T-bolt/worm-gear band clamps, counted valve-cover & Y-bridge fasteners |
| `mat_silicone_black` | `(0.035, 0.036, 0.040)` | `0.05` | `0.80` | Yes | `intake_tract` | Charge-pipe couplers/boots, Y-bridge runner seals, injector return-line hose, PCV/coolant hoses |
| `mat_paint_engine` | `(0.130, 0.135, 0.150)` | `0.40` | `0.55` | Yes | — | Deep-front-sump oil pan, lower block pan rails, spin-on fuel filter canister body |
| `mat_plastic_ripple` | `(0.085, 0.088, 0.095)` | `0.08` | `0.66` | Yes | `turbo_unit` | Swept valley harness loom, rear-LH main harness break, 8 injector connectors, MAP/FCA/VGT/WIF sensor bodies |
| `mat_brass` | `(0.520, 0.400, 0.190)` | `0.85` | `0.34` | Yes | `turbo_unit` | Turbo oil-feed & coolant banjo fittings, drain plug, fuel filter air-bleed vent screw |
| `mat_copper_heat` | `(0.470, 0.270, 0.170)` | `0.80` | `0.42` | Yes | `turbo_unit`, `turbo_downpipe` | Two-piece turbine heat-shield accents, downpipe heat-tinted collar, up-pipe bellows/shield accents |
| `mat_dipstick_yellow` | `(0.700, 0.560, 0.060)` | `0.20` | `0.45` | Yes | — | RH rear dipstick loop handle (`ext_dipstick_handle`) |
| `mat_oil_filter_blue` | `(0.070, 0.130, 0.360)` | `0.35` | `0.42` | Yes | — | Lower-RH spin-on oil filter canister (`ext_pan` cue preserved from M3) |

---

## 4. Milestone 8 Interface Datums, Mating Radii & Label Anchors (Spec §§6.1–6.4)

All seven Milestone 8 `if_*` coordinates (from [`assets-src/variant_dimensions.json`](../assets-src/variant_dimensions.json)) are preserved exactly on the rebuilt shell. In addition, the two former display-only service points (`if_airbox_mount` and `if_hot_side_inlet`, which sat `17.83 mm` and `31.39 mm` from the M3 concept shell) are tightened into real shell end-flange features (`0.0000 mm` nearest-vertex contact):

| Marker ID | Project `[X, Y, Z]` (mm) | Mating Normal (Unit Vector) | Target Rim Radius (mm) | Nearest Shell Vertex (mm) | Measured Rim Radius (mm) | Normal Angle Dev (`°`) | Shell Mating Feature |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| `if_turbine_inlet_rh` | `[-137.6, -84.1, 340.6]` | `(0.0, -0.785852, -0.618415)` | `44.0 ± 1.0` | **`0.0000`** (`≤ 1.0`) | **`44.00`** | **`0.0000°`** (`≤ 0.5°`) | `ext_uppipe_rh` top flange & `turbo_unit` RH inlet |
| `if_turbine_inlet_lh` | `[-137.6, 46.4, 356.8]` | `(0.0, 0.743832, -0.668367)` | `44.0 ± 1.0` | **`0.0000`** (`≤ 1.0`) | **`44.00`** | **`0.0000°`** (`≤ 0.5°`) | `ext_uppipe_lh` top flange & `turbo_unit` LH inlet |
| `if_turbine_outlet` | `[-146.2, -59.2, 373.3]` | `(-0.782012, -0.247004, -0.572009)` | `52.0 ± 1.0` | **`0.0000`** (`≤ 1.0`) | **`52.00`** | **`0.0000°`** (`≤ 0.5°`) | `turbo_unit` V-band neck & `turbo_downpipe` mouth |
| `if_compressor_inlet` | `[13.2, 22.6, 453.6]` | `(0.738184, -0.672185, -0.057099)` | `48.0 ± 1.0` | **`0.0000`** (`≤ 1.0`) | **`48.00`** | **`0.0005°`** (`≤ 0.5°`) | `turbo_unit` bell & `ext_intake_mouthpiece` collar |
| `if_compressor_outlet` | `[36.5, 56.1, 419.2]` | `(0.973026, 0.165004, 0.180005)` | `44.0 ± 1.0` | **`0.0000`** (`≤ 1.0`) | **`44.00`** | **`0.0000°`** (`≤ 0.5°`) | `turbo_unit` outlet spigot & `ext_charge_hot` boot |
| `if_airbox_mount` | `[587.4, -510.5, 371.9]` | `(0.882820, -0.441410, -0.160513)` | *(service end face)* | **`0.0000`** (`≤ 1.0`) | `44.45` (`Ø88.9 mm` cuff) | `0.0000°` | `ext_intake_duct` outboard airbox cuff *(tightened from `17.83 mm`)* |
| `if_hot_side_inlet` | `[374.6, 474.8, 146.6]` | `(0.0, 1.0, 0.0)` | *(service end face)* | **`0.0000`** (`≤ 1.0`) | `31.75` (`Ø63.5 mm` flange) | `0.0000°` | `ext_charge_hot` intercooler service flange *(tightened from `31.39 mm`)* |

**Exterior HTML label anchors (`src/renderer/viewLayout.ts` `EXTERIOR_SHELL_LABEL_ANCHORS_MM`):**
- `turbocharger`: **`[-60.0, 0.0, 435.0] mm`** — preserved unchanged; inside `turbo_unit` (`X[-168, 49.8]`, `Y[-118, 128]`, `Z[276, 508.4] mm`).
- `oil-pan`: **`[135.4, 0.0, -172.0] mm`** — preserved unchanged; inside `blockPan` (`X[-62, 479]`, `Y[-251.7, 232.1]`, `Z[-223.5, 242.0] mm`).
- `harmonic-balancer`: **re-pinned from `[760.6, 0.0, -43.0] mm` to `[478.0, 0.0, 0.0] mm`** (`282.6 mm` rearward and `+43.0 mm` upward onto the crank axis), matching the rebuilt `ext_damper` bounding-box centre `(478.00, 0.00, 0.00) mm` (`0.0000 mm ≤ 1.0 mm` deviation, verified by `viewLayout.test.ts`).

---

## 5. Front-Drive Stack & Valley Injector Corrections As Built (Spec §§5.4, 15.6)

### 5.1 Crank-Snout & Serpentine Front-Drive Stack
In the internal assembly (`src/renderer/engineScene.ts:298–323`), the block front plane sits at `X = 460.0 mm` (`4 × 115 mm` bore pitch), the front pulley/damper disc occupies **`X = 466.0..476.0 mm` at outer radius `r = 57.0 mm`**, and the main crankshaft snout ends at **`X = 478.0 mm`**. The M10 shell places the external front drive coaxially around that snout instead of floating `~283 mm` ahead of it:

| Front-Drive Element | `extras.partId` | Axial Plane `X` (mm) | Radial / Layout Geometry | Provenance Basis |
| --- | --- | ---: | --- | --- |
| Block front face | `ext_block` | `460.0` | `90°` V-block front bulkhead | Sourced `4 × 115 mm` bore pitch (`dimensions.json`) |
| Front timing cover | `ext_front_cover`, `ext_wp_boss`, `ext_cp3_pad` | `460.0 … 472.0` *(bosses `435.5 … 486.5`)* | Annular crank seal bore `r_in = 60.8 mm` (`3.80 mm` radial clearance over `r = 57.0 mm`); RH lower gear-driven water-pump scroll boss (**no pulley**); upper-valley CP3 pad | Sourced gear-driven water pump (survey §11, grade A); illustrative cover thickness |
| Harmonic damper | `ext_damper` | `464.0 … 492.0` *(hub cap `480.8`)* | Coaxial on `(Y = 0, Z = 0)`; annular ring `r_in = 60.8 mm` (`≥ 3.0 mm`), `r_out = 99.0 mm` (**`OD = 198.0 mm`**), front snout axial clearance `2.80 mm` (`≥ 2.0 mm`); bbox centre `[478.0, 0.0, 0.0] mm` | Grade-C replacement `Ø198 mm` OD (survey §11); illustrative axial width |
| 6-rib K06 belt loop | `ext_belt` | `472.0 … 492.0` | `20.0 mm` 6-rib closed belt loop wrapping **9 pulleys**: crank damper `(0, 0)`, tensioner `(-118, 95)`, vacuum pump `(-222, 118)`, alternator `(-238, 286)`, RH idler `(-76, 268)`, fan pulley `(0, 178)`, LH idler `(82, 268)`, P/S pump `(236, 282)`, A/C compressor `(226, 118)` | Sourced 6-rib single-belt 9-pulley LLY architecture with vacuum pump under alternator & no water-pump pulley (survey §11, grades A/C); pulley `(Y, Z)` centres illustrative |
| Viscous fan clutch | `ext_fan_clutch` | `530.0 … 570.0` | Finned cast-aluminum thermal clutch on fan hub axis `(0, +178.0) mm` | Illustrative standoff (§5.4) |
| 9-blade cooling fan | `ext_fan` | `570.0 … 615.0` *(hub tip `617.8`)* | 9-blade molded ring/blade assembly (`r_tip = 245 mm`, `X_max = 617.80 mm ≤ 700.0 mm` cap) | Sourced 9-blade count (survey §11); illustrative diameter & standoff |

### 5.2 Valley-Trough Proud Injector Rows
In place of the M3 shell's outboard fuel-rail loops (`|Y| = 349 mm`), the eight Bosch solenoid injectors (`ext_injector_1..8`) and weatherpack connectors (`ext_inj_connector_1..8`) stand **proud outside the upper valve covers** inside four semicircular reliefs per cover along the inboard valley trough (`X = {402.5, 287.5, 172.5, 57.5} mm`, `|Y| = 213..291 mm`, `Z = 296.6..367.3 mm`), aligned with the internal injector axes from `dimensions.json`, linked by `ext_inj_return_line`, and fed from the rear-LH `ext_harness_main_break`.

---

## 6. Analytic & Runtime Containment Report (Spec §§5.6.3, 13.7)

Because `uniformScale = 1.0` removes Milestone 3's `s = 0.430` uniform-scale buffer, `build_shell.py` enforces an analytic clearance check against the internal engine envelope derived from `assets-src/dimensions.json` (`crankThrowMm = 49.5`, `rodLengthMm = 163.0`, `deckBMm = 264.3`, `rockerShaftBMm = 374.3`, `internalRockerMaxBMm = 407.94`, `internalHeadTopBMm = 379.27`, `internalPulleyDiscOuterRadiusMm = 57.0`), paired with an 8-angle runtime sweep (`docs/M10-MEASUREMENTS.md` §4):

| Clearance Zone | Normative Minimum | Measured Clearance | Governing Shell / Internal Pair | Verdict |
| --- | ---: | ---: | --- | :---: |
| **General internal envelope** | **`≥ 8.00 mm`** | **`9.34 mm`** | `ext_vc_upper/lower` front X wall vs Station `1&2` rocker arm (`9.34 mm`); rear X wall (`10.34 mm`); rocker top vs cover roof (`10.56 mm`); head outer wall (`10.53 mm`); injector relief (`11.59 mm`); oil pan vs crank big-end sweep (`38.20 mm`) | **PASS** |
| **Deck / head clamping land** *(documented exception 1)* | **`≥ 2.00 mm`** | **`2.20 mm`** | `ext_head_rh/lh` & `ext_vc_lower_rh/lh` clamping land vs internal cylinder-head deck slab | **PASS** |
| **Crank-snout radial** (`X ≤ 492 mm`, *exception 2a*) | **`≥ 3.00 mm`** | **`3.80 mm`** | `ext_front_cover` & `ext_damper` inner bore (`r = 60.80 mm`) vs internal pulley/damper disc (`r = 57.00 mm`) | **PASS** |
| **Crank-snout axial** (`X ≤ 492 mm`, *exception 2b*) | **`≥ 2.00 mm`** | **`2.80 mm`** | `ext_damper` front hub recess (`X = 480.80 mm`) vs internal main-shaft snout end (`X = 478.00 mm`) | **PASS** |
| **Oil pan / studio floor** *(exception 3)* | **`≥ 21.40 mm`** | **`21.50 mm`** | `ext_pan` sump bottom (`Z_min = -223.50 mm`) vs studio floor (`Z = -245.00 mm`) | **PASS** |
| **Runtime 8-angle sweep** (`0°..705°`) | `0` piercing pixels | **`0` piercing pixels** | Verified at `θ = 0°, 90°, 180°, 270°, 360°, 470°, 540°, 705°` (`RF-3` + `RF-12` poses) | **PASS** |

---

## 7. Historical Errata Recorded Against Frozen `docs/M8-VARIANTS.md` §5 (Spec §6.3)

Per the frozen-file rule (Spec §§13.1, 14), `docs/M8-VARIANTS.md` is not edited; two historical drift items in its §5 are recorded here and in [`docs/OPEN_ITEMS.md`](./OPEN_ITEMS.md):

1. **`fan` vs `beltDrive` group name:** `docs/M8-VARIANTS.md` §5 listed `fan` among the twelve top-level shell groups, whereas the shipped M3/M8 GLB's twelfth group was always **`beltDrive`** (it never contained a top-level `fan` node). Milestone 10 preserves `beltDrive` as group index `10` and places `ext_fan` and `ext_fan_clutch` inside `beltDrive`.
2. **Preserved-subtree triangle counts (`2,056 / 560 / 5,740` → `3,400 / 800 / 2,300`):** `docs/M8-VARIANTS.md` §5 recorded the M3 shell's preserved-subtree counts (`turbo_unit = 2,056`, `turbo_downpipe = 560`, `intake_tract = 5,740`; sum `8,356` of `31,396`) and noted that any future shell replacement would fail the pinned test loudly. Milestone 10 intentionally replaces the shell and re-pins `EXTERIOR_PRESERVED_TRIANGLES` in `src/renderer/partVariants.ts` and `src/renderer/partVariants.test.ts` to **`3,400 / 800 / 2,300`** (sum `6,500` of `37,100`), while `docs/M8-VARIANTS.md` retains the M8 numbers as historical record.

---

## 8. Two-Tier Detail Scope & Explicit Exclusions (Spec §§2.1–2.3)

- **Tier 1 — Modelled in full silhouette-defining form:** Cast `90°` V-block skirt with pan rails, engine mounts, rear bellhousing flange, deep-sump oil pan (`ext_drain_boss`, blue oil filter); annular front timing cover with gear-driven water-pump scroll boss and CP3 pad; external cylinder-head walls and 8 outboard exhaust-port stubs; upper + lower cast-aluminum valve covers per bank with 4 injector reliefs per bank, PCV boss cluster, and perimeter fastener rows; 8 proud valley-trough injector bodies + weatherpack connectors + return line; outboard 4-runner cast-iron exhaust manifolds + full-length heat shields; RH/LH 3-bolt up-pipes (driver-side shield, passenger-side firewall flat); Garrett GT3788VA turbocharger (two separate turbine inlet flanges, V-band outlet neck, compressor cover/bell/spigot, small passenger-side VGT solenoid, vane-position sensor, top oil-feed banjo, coolant banjos, lower oil drain, two-piece heat shield); round-to-crushed-oval downpipe with heat shield and support bracket; `Ø63.5 mm` LH hot-side and RH cold-side polished stainless charge pipes with bead rolls, silicone boots, and band clamps; turbo inlet mouthpiece, 4-group corrugated intake duct, and upper Helmholtz resonator box; uncovered two-piece cast-aluminum Y-bridge with rectangular seals, MAP sensor, and front resonator clamp lug; rear-valley passenger-side EGR valve mounted above the tubular EGR cooler (`GM 97303654`) with delivery/coolant pipes and bracket; coaxial 9-pulley K06 front serpentine drive (`Ø198 mm` damper, finned clutch + 9-blade fan, RH alternator + lower vacuum pump, LH A/C + P/S bracket, tensioner, 2 idlers, zero water-pump pulley); front-valley Bosch CP3 pump + FCA + valley rails + HP lines; RH valve-cover fuel filter head (primer, brass vent, hose barbs) + vertical spin-on canister (WIF collar + drain); front-LH bolt-on oil filler neck + cap; RH block-side dipstick tube + yellow loop handle; single rear-LH lifting bracket.
- **Tier 2 — Grouped simplifications:** Counted fastener families (`56` valve-cover bolts + `28` insulators in `ext_vc_fasteners`; `18` M8 bolts + `8` studs in `ext_ybridge_fasteners`; 3-bolt up-pipe flange ears), band hose clamps, swept valley wiring loom + rear-LH main harness break + glow-plug bus stubs (`electronics`), and geometry-break ribs/shields without embossed surface text.
- **Explicitly excluded (by decision, D-041):**
  1. **Plastic upper intake manifold cosmetic cover (`GM 21994000`) and all badging/lettering** — excluded because the cover hides the Y-bridge and is the only lettered surface on an LLY (`0` text triangles, `0` decals; plain cast valve covers per survey §4).
  2. **Glow-plug controller module and its stamped shield.**
  3. **Internal PCV/EGR passages and internal turbocharger vane cartridges.**
  4. **Dual-generator (`RPO KW1` / ambulance) extra idler arrangement.**
  5. **Medium-duty (`C4500/C5500` / Kodiak/TopKick) oil filler and remote fuel-filter layouts.**
  6. **All vehicle-side hardware:** airbox housing, chassis intercooler core, radiator and fan shroud, exhaust piping aft of the downpipe, transmission/bellhousing aft of the adapter ring, frame rails, and branch wiring beyond the main valley loom.

---

## 9. Per-Feature Provenance Split (`sourced` vs `illustrative`, Spec §11.1)

No image was pixel-traced; every feature's **existence, system topology, and engine-zone placement** is sourced to [`docs/research/M10-exterior-accuracy-survey.md`](./research/M10-exterior-accuracy-survey.md), while **all unpublished casting dimensions, wall thicknesses, bend radii, boss coordinates, and surface details are `illustrative`** (matching [`assets-src/PROVENANCE.md`](../assets-src/PROVENANCE.md) and the `#m1-illustrative-caption` UI banner):

| Group | `sourced` Architecture, Topology & Anchors (Survey Citation & Grade) | `illustrative` Geometry & Open Risks |
| --- | --- | --- |
| `blockPan` | `90°` cast-iron V8 block (`4 × 115 mm` bore pitch, `dimensions.json`), deep-front-sump oil pan, lower-RH spin-on oil filter (`survey §§3, 14, 16`, grades A/B); `Z_min = -223.5 mm` floor margin. | Outer casting skirt, pan step profile, mounts, bellhousing ring, drain boss; conflicting `34×33×37 in` vs `30×30×32 in` overall envelopes not adopted. |
| `frontCover` | Front-face timing cover (`X = 460 mm`), **gear-driven water pump** with RH scroll boss and **no belt pulley** (`survey §§3, 11`, grades A/B), valley CP3 mounting pad (`survey §12`, grade A). | Plate thickness (`460..472 mm`), `r = 60.8 mm` seal bore, scroll contour. |
| `heads` | Aluminium 32-valve heads with 4 **outboard** exhaust ports per bank and glow-plug bosses above the manifold line (`survey §§3, 8`, grade A); deck height from `dimensions.json`. | External wall slab, `2.20 mm` deck land, port-stub projection. |
| `valveCovers` | **Two-piece** plain unlettered cast-aluminium covers per bank (`GM 97312349` upper + lower; `survey §4`, grades A/B/C), 4 valley-side injector reliefs, PCV boss (`97361741`), counted `24 + 8 + 24 = 56` bolts + `28` insulators (`GM EPC TC00-676`, grade A). | Cover width, cambered roof profile, longitudinal ribs, bolt spacing. |
| `injectors` | **Eight Bosch solenoid injectors proud of the valve covers** in two valley-trough rows of four with weatherpack connectors and clipped return line (`LBT-149 Fig. 16`, `survey §§3, 5`, grade B); axes from `dimensions.json`. | Upper body/clamp envelope, connector angle, return hose path. |
| `exhaustManifolds` | **Outboard** 4-runner cast-iron log manifolds with stamped multi-bolt heat shields and rear up-pipe collector flanges (`GM SI`, `survey §§3, 8`, grade A). | Log cross-section, collector coordinates, shield standoff. |
| `turbo` | Rear-valley **Garrett GT3788VA** (`AVNT3788VA`): **two separate 3-bolt up-pipe inlet flanges** (LH wrapped/shielded, RH firewall flat), **V-band outlet**, **small passenger-side VGT solenoid** + vane sensor (**no wastegate canister**), top oil-feed banjo, coolant banjos, two-piece shield (`GM SI + Garrett`, `survey §§3, 8, 9`, grades A/B); M8 `if_*` datums & radii (`44/44/52/48/44 mm`) preserved. | Scroll/cover outer profiles, solenoid/sensor dimensions, and **`Ø88.9 mm` (`3.5 in`)** round-to-oval downpipe (`3.0 in` vs `3.5 in` published conflict → `illustrative`). |
| `boostPipe` / `chargePipeCold` | **`Ø63.5 mm` (`2.50 in`)** LH hot-side and RH cold-side metal charge pipes with bead rolls, silicone couplers, and band clamps (**no 2006 LBZ clip ring**; `survey §10`, grade C); LH pipe terminates at M8 `if_hot_side_inlet`. | Tube bend splines, coupler lengths, RH front service coupler position. |
| `intake` / `resonator` | Moulded LLY turbo inlet mouthpiece + Marman clamp (`if_compressor_inlet`), corrugated duct to `if_airbox_mount`, and upper Helmholtz **resonator box** + front bridge clamp (`GM EPC + SI`, `survey §6`, grades A/C). | Mouthpiece curve, 4-group corrugations, resonator box (`144×105×78 mm`), and `Ø88.9 mm` airbox cuff (grade-D source). |
| `intakeBridge` | **Two-piece cast-aluminium Y-bridge** spanning the front valley, 2 rectangular elastomer port seals, top **MAP sensor**, `18` M8 bolts + `8` studs (`GM EPC + SI`, `survey §6`, grade A). | Plenum cross-section, runner flanges, fastener row spacing. |
| `egrSystem` | **EGR valve mounted above tubular EGR cooler** (`GM 97303654`, gasket `"BOTTOM EGR VALVE TO TOP EGR COOLER"`, grade A), intake delivery pipe, coolant pipe/hose, bracket (`survey §7`, grades A/B). | Cooler/valve dimensions and **pinned rear-valley passenger-side placement** (3-source position conflict tracked in `OPEN_ITEMS.md`). |
| `beltDrive` / `alternator` / `acComp` | Single **6-rib (`K06`)** belt over **9 pulleys** (**zero water-pump pulley**), **vacuum pump below RH alternator**, **A/C + P/S on shared LH bracket**, square-drive tensioner, 2 idlers, clutch + **9-blade** fan (`survey §11`, grades A/B/C); `Ø198 mm` damper OD & `Ø76.3 mm` idler OD (grade C); coaxial on `(0, 0)` enclosing internal disc `X = 466..476 mm`. | Axial standoffs (`X = 464..615 mm`), non-damper pulley diameters, pulley `(Y, Z)` coordinates (`OPEN_ITEMS.md`). |
| `cp3Fuel` | **Bosch CP3** pump in the **front valley** on front-cover studs, cylindrical **FCA**, two valley rails + crossover + 8 HP lines (`survey §§3, 12`, grades A/B). | Pump body envelope, rail diameter, hard-line bends. |
| `fuelFilter` | Pickup **fuel filter head on top of the RH valve cover** (hand primer, brass bleed screw, 2 hose stubs) with **vertical spin-on canister**, WIF collar, and drain (`GM SI 2005 VIN 2`, `survey §§3, 13`, grade A). | Head/canister `Ø76 / Ø72 mm` dimensions and inboard RH cover offset (`X ≈ 228 mm, Y ≈ -258..-284 mm`). |
| `oilFill` / `dipstick` / `liftBracket` | **Front bolt-on oil filler neck + cap** left of fan centreline (`survey §14`, grade A); **RH block-side dipstick + yellow loop handle** (`survey §14`, grades A/C); **single rear-LH lifting bracket** (`survey §15`, grade A). | Tube splines, cap/handle dimensions, and bracket plate profile. |
| `electronics` | Split valley-edge injector wiring looms, **rear-LH main bale-lock harness connector break**, outboard glow-plug stubs (`survey §5`, grades A/B/C). | Swept loom diameter and connector housing box (Tier-2 simplification). |
