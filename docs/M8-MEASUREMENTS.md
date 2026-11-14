# Milestone 8 Measurements — Variant GLB Assets, Shell Split & D-033 Budget Compliance (`docs/M8-MEASUREMENTS.md`)

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) (Milestone 8) · Decisions: D-011, D-033, D-034, D-035, **D-038**, **D-039** · Spec: [`docs/specs/M8-part-variants.md`](./specs/M8-part-variants.md) · Variant dictionary & provenance: [`docs/M8-VARIANTS.md`](./M8-VARIANTS.md) · Normative budgets: [`docs/M2-MEASUREMENTS.md`](./M2-MEASUREMENTS.md) §5 · Prior measurements: [`docs/M3-MEASUREMENTS.md`](./M3-MEASUREMENTS.md), [`docs/M4-MEASUREMENTS.md`](./M4-MEASUREMENTS.md), [`docs/M7-MEASUREMENTS.md`](./M7-MEASUREMENTS.md)

---

## 1. Variant GLB Asset Record & Frozen Shell Hash (Spec §§3.2, 3.3, 6.1, 7.2)

Generated deterministically from [`assets-src/variant_dimensions.json`](../assets-src/variant_dimensions.json) (`197` pinned keys) and shared stock interface dimensions in [`assets-src/dimensions.json`](../assets-src/dimensions.json) using [`assets-src/blender/build_variants.py`](../assets-src/blender/build_variants.py) in headless **Blender `5.2.3 LTS`** (`hash e13b728c6880`). All five files are uncompressed glTF 2.0 binaries with zero textures and zero images:

| GLB Asset (`public/models/variants/`) | Catalog `id` (`slotId`) | Bytes | Triangles / Cap | Vertices | Materials (`≤ 4`) | Project / Bore-Fit Bounds (mm) | Ground Clearance (`Z + 245 mm`) | SHA-256 |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- |
| `turbo_unit_engine_large.glb` | `turbo_large` (`turbo`) | `82,448` | **`3,204` / `3,600`** (**PASS**) | `2,495` | `3` | `X[-178.36, 47.12]`, `Y[-126.00, 136.00]`, `Z[263.00, 530.00]` | `508.00 mm` | `6e038dd2540f8732906068fa13cdfaaafe255b53336283118f36ab9aca1c82ed` |
| `intake_tract_engine_highflow.glb` | `intake_highflow` (`intake`) | `64,416` | **`2,560` / `2,600`** (**PASS**) | `1,884` | `4` | `X[-17.98, 778.54]`, `Y[-639.09, 56.13]`, `Z[289.14, 547.79]` | `534.14 mm` | `fc28f77b7816a38ad6cb1a53351960b9cf3baf54e089b59de39223c1ba2f7e58` |
| `exhaust_system_engine_4inch.glb` | `exhaust_4in` (`exhaust`) | `50,064` | **`2,436` / `2,800`** (**PASS**) | `1,389` | `2` | `X[-1092.64, -113.80]`, `Y[-218.00, 2.00]`, `Z[-85.00, 415.95]` | `160.00 mm` (`≥ 20 mm`) | `a463172aeae64688383400d56b5c2d70dbf3e62992da1b3013892b456c53fa32` |
| `intercooler_core_engine_upgraded.glb` | `intercooler_upgraded` (`intercooler`) | `48,436` | **`1,520` / `1,800`** (**PASS**) | `1,516` | `3` | `X[80.55, 682.00]`, `Y[472.68, 696.00]`, `Z[-20.00, 338.00]` | `225.00 mm` (`≥ 20 mm`) | `1f112556e1af253e761413f4e176689904e9c1b043e95ad5814bb984aeb9b183` |
| `rot_piston_c1_lowcomp.glb` | `pistons_lowcomp` (`pistons`) | `118,456` | **`3,968` / `5,200`** (**PASS**) | `3,826` | `3` | `OD_X = 102.850 mm`, `OD_Z = 102.850 mm`, `Y[-22.9425, +49.8000]` | *(internal)* | `41d1315d1fcc18d85fea7b498c28a1567e0bcfb5262e99e940b8f4bc1e35fb93` |
| **External Variant Total (V1–V4)** | — | **`245,364`** | **`9,720` / `10,800`** (**PASS**) | `7,284` | — | — | — | — |
| **All Variant Files Total (V1–V5)** | — | **`363,820`** | **`13,688` / `16,000`** (**PASS**) | `11,110` | — | — | — | — |

### Frozen Exterior Shell & Stock Cylinder-1 GLB Audit (Spec §§3.4, 8, 10.1)

- **Frozen registered exterior shell `public/Duramax_LLY_2005_66L_V8.glb`** (recorded for the first time per Spec §3.4):
  - **Bytes:** `1,973,652`
  - **SHA-256:** `42993c990ed22fe917af23361f18cd91c017a0517b95d811c5b9d71f10270896` (**`git diff main` empty**)
- **Ten stock Cylinder-1 GLBs (`public/models/*.glb`) & `assets-src/fixture/axis_fixture.glb`:** untouched (**`git diff main` empty**; all M7 hashes in [`docs/M7-MEASUREMENTS.md`](./M7-MEASUREMENTS.md) unchanged).

---

## 2. `build_variants.py` Logged Assertion Block (Spec §§3.3, 7.2, 10.3)

Verbatim stdout captured from headless Blender `5.2.3 LTS`:

```text
================================================================================================
M8 VARIANT BUILD — LOGGED ASSERTION BLOCK
================================================================================================
Frozen exterior shell GLB SHA-256: 42993c990ed22fe917af23361f18cd91c017a0517b95d811c5b9d71f10270896

[turbo_unit_engine_large.glb]
  bytes=82448  sha256=6e038dd2540f8732906068fa13cdfaaafe255b53336283118f36ab9aca1c82ed
  triangles=3204 / cap=3600 (PASS)  vertices=2495  materials=3 / 4 (PASS)
  project_bounds_mm: X[-178.36, 47.12] in [-180, 50]  Y[-126.00, 136.00] in [-135, 150]  Z[263.00, 530.00] in [260, 540] (PASS)
  min_z_mm=263.00  ground_clearance_mm=508.00
  marker if_turbine_inlet_rh: glb_mm=(-137.60, -84.10, 340.60) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  marker if_turbine_inlet_lh: glb_mm=(-137.60, 46.40, 356.80) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  marker if_turbine_outlet: glb_mm=(-146.20, -59.20, 373.30) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  marker if_compressor_inlet: glb_mm=(13.20, 22.60, 453.60) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  marker if_compressor_outlet: glb_mm=(36.50, 56.10, 419.20) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  non_penetration: non_excepted_inside=0 (obstacle_groups=0, connected_outside_90mm_collar=0; PASS, D-039)  min_envelope_surface_gap_mm=19.92  min_v2v_mm=20.62 (blockPan) >= 2.00 (PASS)  [blockPan:20.62, injectors:26.28, acComp:31.74, egrSystem:49.21]
  connection_collar_diag (D-039): connected_30_to_90mm_mouth_verts=62 (max_marker_dist=88.37 mm <= 90.00 mm)  min_connected_outside_90mm_v2v_mm=2.95 (intake_tract) >= 2.00 (PASS)

[intake_tract_engine_highflow.glb]
  bytes=64416  sha256=fc28f77b7816a38ad6cb1a53351960b9cf3baf54e089b59de39223c1ba2f7e58
  triangles=2560 / cap=2600 (PASS)  vertices=1884  materials=4 / 4 (PASS)
  project_bounds_mm: X[-17.98, 778.54] in [-20, 800]  Y[-639.09, 56.13] in [-650, 100]  Z[289.14, 547.79] in [280, 560] (PASS)
  min_z_mm=289.14  ground_clearance_mm=534.14
  marker if_compressor_inlet: glb_mm=(13.20, 22.60, 453.60) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  marker if_airbox_mount: glb_mm=(587.40, -510.50, 371.90) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  non_penetration: non_excepted_inside=0 (obstacle_groups=0, connected_outside_90mm_collar=0; PASS, D-039)  min_envelope_surface_gap_mm=17.52  min_v2v_mm=20.41 (acComp) >= 2.00 (PASS)  [acComp:20.41, resonator:22.10, egrSystem:25.11, cp3Fuel:35.87]
  connection_collar_diag (D-039): connected_30_to_90mm_mouth_verts=90 (max_marker_dist=88.96 mm <= 90.00 mm)  min_connected_outside_90mm_v2v_mm=10.45 (turbo_unit) >= 2.00 (PASS)
  readback_v2_tube_od_mm=101.6438 (expected 101.6000, PASS)

[exhaust_system_engine_4inch.glb]
  bytes=50064  sha256=a463172aeae64688383400d56b5c2d70dbf3e62992da1b3013892b456c53fa32
  triangles=2436 / cap=2800 (PASS)  vertices=1389  materials=2 / 4 (PASS)
  project_bounds_mm: X[-1092.64, -113.80] in [-1100, -110]  Y[-218.00, 2.00] in [-300, 60]  Z[-85.00, 415.95] in [-160, 470] (PASS)
  min_z_mm=-85.00  ground_clearance_mm=160.00
  marker if_turbine_outlet: glb_mm=(-146.20, -59.20, 373.30) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  non_penetration: non_excepted_inside=0 (obstacle_groups=0, connected_outside_90mm_collar=0; PASS, D-039)  min_envelope_surface_gap_mm=71.64  min_v2v_mm=71.70 (blockPan) >= 2.00 (PASS)  [blockPan:71.70, injectors:86.41, intake:139.11, egrSystem:167.56]
  connection_collar_diag (D-039): connected_30_to_90mm_mouth_verts=16 (max_marker_dist=51.79 mm <= 90.00 mm)  min_connected_outside_90mm_v2v_mm=25.95 (turbo_uppipe_rh) >= 2.00 (PASS)

[intercooler_core_engine_upgraded.glb]
  bytes=48436  sha256=1f112556e1af253e761413f4e176689904e9c1b043e95ad5814bb984aeb9b183
  triangles=1520 / cap=1800 (PASS)  vertices=1516  materials=3 / 4 (PASS)
  project_bounds_mm: X[80.55, 682.00] in [60, 700]  Y[472.68, 696.00] in [430, 720]  Z[-20.00, 338.00] in [-60, 360] (PASS)
  min_z_mm=-20.00  ground_clearance_mm=225.00
  marker if_hot_side_inlet: glb_mm=(374.60, 474.80, 146.60) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  non_penetration: non_excepted_inside=0 (obstacle_groups=0, connected_outside_90mm_collar=0; PASS, D-039)  min_envelope_surface_gap_mm=90.66  min_v2v_mm=154.23 (electronics) >= 2.00 (PASS)  [electronics:154.23, injectors:163.32, blockPan:215.66, turbo:239.30]
  connection_collar_diag (D-039): connected_30_to_90mm_mouth_verts=53 (max_marker_dist=52.21 mm <= 90.00 mm)  min_connected_outside_90mm_v2v_mm=58.09 (boostPipe) >= 2.00 (PASS)

[rot_piston_c1_lowcomp.glb]
  bytes=118456  sha256=41d1315d1fcc18d85fea7b498c28a1567e0bcfb5262e99e940b8f4bc1e35fb93
  triangles=3968 / cap=5200 (PASS)  vertices=3826  materials=3 / 4 (PASS)
  bore_fit_mm: OD_X=102.85001  OD_Z=102.85001  crown_Y=49.8000  skirt_bottom_Y=-22.9425  pivot_max_abs_m=0.00e+00 (PASS)
  dish_volume_cm3: stock=29.5865  lowcomp=32.8166  delta=3.2301 vs CR_target=3.2254 (diff=+0.0047 <= 0.05, PASS)
  readback_v5_crown: radii_mm=[0.0, 16.456, 23.1413, 28.798, 29.8265, 51.425]  dish_depth_mm=16.2957 (PASS)

------------------------------------------------------------------------------------------------
SUMMARY: 5/5 variant GLBs verified | total_triangles=13688 / 16000 | total_bytes=363820
================================================================================================
```

### 2.1 Approved Deviation Record (`D-039` — `90.0 mm` Per-Marker Connection Collar)

Owner-approved deviation recorded in [`docs/DECISIONS.md`](./DECISIONS.md) (**D-039**, [`docs/specs/M8-part-variants.md`](./specs/M8-part-variants.md) left untouched per §8):
- **Non-connected obstacle groups (`9–11` groups per model):** **`0` vertices inside** on all four external models (`min_envelope_surface_gap_mm = 19.92 / 17.52 / 71.64 / 90.66 mm`; `min_v2v_mm = 20.62 / 20.41 / 71.70 / 154.23 mm ≥ 2.00 mm`).
- **Connected groups (`turbo`, `intake`, `boostPipe`) evaluated per mated marker:** Because `if_hot_side_inlet` sits at the center of `boostPipe`'s `r ≈ 31.4–33.7 mm` open mouth (`31.394 mm` minimum vertex distance — `0` vertices within `30.0 mm`), the five turbo contact datums are single rim vertices on `60–90 mm` mouths, and §3.2's pinned flange/tube/coupler radii (`r = 38.1, 42, 44, 48, 50.8, 52, 58, 117, 131 mm`) all exceed `30.0 mm`, the mated mouth collars contain `62` (V1, max `88.37 mm`), `90` (V2, max `88.96 mm`), `16` (V3, max `51.79 mm`), and `53` (V4, max `52.21 mm`) connected-group vertices between `30.0 mm` and `90.0 mm` of their mated markers. Beyond `90.0 mm`, **every model has `0` connected-group vertices inside** and `min_connected_outside_90mm_v2v_mm = 2.95 / 10.45 / 25.95 / 58.09 mm ≥ 2.00 mm`.

---

## 3. Exterior Shell Split Accounting (Spec §§3.4, 6.2)

Splitting the registered shell into three preserved visibility groups plus the global merge preserves **exact geometric and material identity** with Milestone 3–7:

| Exterior Bucket | Source Subtree | Scene Triangles | Merged Meshes (M7 → M8) | Materials / Textures |
| --- | --- | ---: | ---: | --- |
| `turbo_unit` (`partGroups`) | `turbo` direct child `3` | `2,056` | `— → 6` | Shared from shell's `22` materials / `4` textures |
| `turbo_downpipe` (`partGroups`) | `turbo` direct child `2` | `560` | `— → 1` | Shared from shell's `22` materials / `4` textures |
| `intake_tract` (`partGroups`) | Whole `intake` top-level group | `5,740` | `— → 5` | Shared from shell's `22` materials / `4` textures |
| Global exterior merge | Remaining 10 groups + `turbo` children `0` & `1` | `23,040` | `22 → 21` *(1 signature moved completely into preserved groups)* | `22` deduplicated `MeshStandardMaterial`, `4` textures |
| **Exterior Shell Total** | **`Duramax_LLY_2005_66L_V8.glb`** | **`31,396`** (`0` Δ) | **`22 → 33` (`+11` main-pass calls)** | **`0 MiB` VRAM delta** (`6.50 MiB` shell textures unchanged) |

---

## 4. Runtime `?benchmark=1` `@ 900 RPM` Telemetry & D-033 Budget Compliance (Spec §§6.3, 6.4, 10.5)

### 4.1 Measurement Environment
- **Machine:** `Intel(R) Core(TM) Ultra 7 256V`, `15.7 GiB` RAM, Windows 11 (`x64`)
- **GPU / WebGL Backend:** `ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (8GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)` (WebGL 2)
- **Browser:** Chromium `152.0.7977.167` (`Antigravity/2.32.1` built-in browser)
- **Workload:** Production bundle (`npm run build && npx vite preview`, `dist/assets/index-wsgZcPM5.js`), continuous animation at **900 RPM (`1×` speed)** after `detailedLoaded && hdriLoaded && exteriorLoaded && variantsLoaded` plus a **60-frame warmup**, sampled over **10.0 seconds** (`~600` frames) via `?benchmark=1`.

### 4.2 Desktop (`Full`, `1440×900`) — 10-Second `@ 900 RPM` Telemetry Matrix

| Metric (`renderInfo`) | Stock — Exterior **Off** | Stock — Exterior **On** | Worst-Case **5 Variants** — Exterior **On** | Variant Explode (`explode=100`, **5 Variants**, Ext **On**) |
| --- | ---: | ---: | ---: | ---: |
| **`visibleSceneTriangles` (D-033 scene tris)** | **`271,224`** | **`302,620`** | **`297,072`** *(`302,620 − 8,356 + 9,720 − 6,912`)* | **`297,072`** |
| **`render.triangles` (submitted/frame)** | **`542,384`** | **`573,780`** *(unchanged from M7)* | **`561,320`** *(`2×264,248 + 64 + 23,040 + 9,720`)* | **`560,832`** |
| **`render.calls` (incl. `36` shadow)** | **`73`** *(`36 + 37`)* | **`106`** *(M7 `95 + 11` split)* | **`106`** *(`36 + 70`: `70 − 12` hidden `+ 12` variant meshes)* | **`104`** *(2 small meshes frustum-culled at `e = 1`)* |
| **`render.lines`** | **`0`** | **`0`** | **`0`** | **`0`** |
| **`memory.geometries`** | **`34`** | **`67`** *(M7 `56 + 11` split)* | **`70`** *(`31` non-piston + `3` stock + `3` lowcomp + `21` ext + `12` var)* | **`68`** |
| **`memory.textures` (uploaded to WebGL)** | **`4`** | **`8`** | **`7`** *(0 variant textures)* | **`7`** |
| **Resident Texture + HDRI VRAM** | **`27.25 MiB`** | **`27.25 MiB`** | **`27.25 MiB`** (`0` Δ) | **`27.25 MiB`** |
| **`visibleVariantModels` / `pistonVariantActive`** | `[]` / `false` | `[]` / `false` | `5` variants / `true` | `5` variants / `true` |
| **`variantSceneTriangles`** | `0` | `0` | **`41,464`** *(`9,720` ext + `31,744` pistons)* | **`41,464`** |
| **Sampled frames (`~10.00 s`)** | `600` (`10,000.1 ms`) | `600` (`10,000.1 ms`) | `600` (`10,000.1 ms`) | `600` (`10,000.1 ms`) |
| **Average frame time (`rAF`)** | **`16.667 ms` (`60.00 FPS`)** | **`16.667 ms` (`60.00 FPS`)** | **`16.667 ms` (`60.00 FPS`)** | **`16.667 ms` (`60.00 FPS`)** |
| **`p50` / `p95` / `min` / `max` frame time** | `16.7 / 16.8 / 15.5 / 17.7 ms` | `16.7 / 16.8 / 15.3 / 18.0 ms` | `16.7 / 16.8 / 15.0 / 18.4 ms` | `16.7 / 16.8 / 16.4 / 16.9 ms` |
| **Synchronous CPU `update + render`** | **`0.967 ms` avg** (`1.6 ms` p95) | **`1.248 ms` avg** (`2.0 ms` p95) | **`1.024 ms` avg** (`1.6 ms` p95) | **`1.068 ms` avg** (`1.7 ms` p95) |

### 4.3 Phone (`Phone`, `390×844`) — 10-Second `@ 900 RPM` Telemetry Matrix

| Metric (`renderInfo`) | Stock — Exterior **Off** | Stock — Exterior **On** | Worst-Case **5 Variants** — Exterior **On** | Variant Explode (`explode=100`, **5 Variants**, Ext **On**) |
| --- | ---: | ---: | ---: | ---: |
| **`visibleSceneTriangles` (D-033 scene tris)** | **`271,224`** | **`302,620`** | **`297,072`** | **`297,072`** |
| **`render.triangles` (submitted/frame, no shadow)** | **`271,224`** | **`302,272`** *(`302,620` max unculled)* | **`296,724`** *(`297,072` max unculled)* | **`291,896`** *(outboard exploded parts culled by narrow `390×844` frustum)* |
| **`render.calls` (main pass only)** | **`37`** | **`65`** *(`70` max unculled; `5` tiny meshes culled)* | **`65`** *(`70` max unculled)* | **`57`** |
| **`render.lines`** | **`0`** | **`0`** | **`0`** | **`0`** |
| **`memory.geometries`** | **`34`** | **`62`** *(`67` resident)* | **`65`** | **`57`** |
| **`memory.textures` (uploaded to WebGL)** | **`2`** *(shadow disposed)* | **`5`** | **`4`** *(0 variant textures)* | **`4`** |
| **Resident Texture + HDRI VRAM** | **`11.25 MiB`** | **`11.25 MiB`** | **`11.25 MiB`** (`0` Δ) | **`11.25 MiB`** |
| **`visibleVariantModels` / `pistonVariantActive`** | `[]` / `false` | `[]` / `false` | `5` variants / `true` | `5` variants / `true` |
| **`variantSceneTriangles`** | `0` | `0` | **`41,464`** | **`41,464`** |
| **Sampled frames (`~10.00 s`)** | `600` (`10,000.1 ms`) | `600` (`10,000.0 ms`) | `600` (`10,000.0 ms`) | `600` (`10,001.0 ms`) |
| **Average frame time (`rAF`)** | **`16.667 ms` (`60.00 FPS`)** | **`16.667 ms` (`60.00 FPS`)** | **`16.667 ms` (`60.00 FPS`)** | **`16.668 ms` (`59.99 FPS`)** |
| **`p50` / `p95` / `min` / `max` frame time** | `16.7 / 16.8 / 16.4 / 17.0 ms` | `16.7 / 16.8 / 16.5 / 16.9 ms` | `16.7 / 16.8 / 15.6 / 17.6 ms` | `16.7 / 16.8 / 15.0 / 18.4 ms` |
| **Synchronous CPU `update + render`** | **`0.851 ms` avg** (`1.7 ms` p95) | **`1.646 ms` avg** (`2.6 ms` p95) | **`2.042 ms` avg** (`3.1 ms` p95) | **`2.059 ms` avg** (`3.3 ms` p95) |

*(Note on draw-call arithmetic in Worst-Case 5 Variants: the four external variant GLBs contain `3 + 4 + 2 + 3 = 12` material-separated mesh primitives — V2 uses `4` materials within its `≤ 4` material cap for tube, silicone couplers, pleated filter media, and steel end cap — which exactly offsets the `12` hidden preserved shell meshes (`6 + 1 + 5`), leaving main-pass unculled calls at `70` (`106` Desktop incl. `36` shadow; `65` Phone culled / `70` max unculled), `144` calls below the `≤ 250` Desktop budget and `50` calls below the `≤ 120` Phone budget.)*

### 4.4 Per-Variant Attachment Sanity & First-Selection Cost (Spec §§6.3, 6.4)

Interactive sequential selection with Exterior **On** verified exact scene-triangle accounting at every step:
1. **All Stock:** `visibleVariantModels = []`, `shellPartsHidden = []`, `pistonVariantActive = false`, `visibleSceneTriangles = 302,620`.
2. **`+ turbo_large`:** `shellPartsHidden = ['turbo_unit']` (`−2,056`), `+3,204` → `visibleSceneTriangles = 303,768`.
3. **`+ intake_highflow`:** `shellPartsHidden = ['turbo_unit', 'intake_tract']` (`−5,740`), `+2,560` → `visibleSceneTriangles = 300,588`.
4. **`+ exhaust_4in`:** `shellPartsHidden = ['turbo_unit', 'turbo_downpipe', 'intake_tract']` (`−560`), `+2,436` → `visibleSceneTriangles = 302,464`.
5. **`+ intercooler_upgraded`:** no shell part hidden (`0`), `+1,520` → `visibleSceneTriangles = 303,984` (`variantSceneTriangles = 9,720`).
6. **`+ pistons_lowcomp`:** `pistonVariantActive = true`, `8 × (3,968 − 4,832) = −6,912` → `visibleSceneTriangles = 297,072` (`variantSceneTriangles = 41,464`).
7. **Restore all 12 slots to Stock:** `visibleVariantModels = []`, `shellPartsHidden = []`, `pistonVariantActive = false`, `visibleSceneTriangles = 302,620` (exact baseline restored).

**First-selection residual risk (Spec §6.3):** All five variant GLBs are parsed at startup (`variantsLoaded = true`) and attached lazily on selection. Because total uncompressed geometry across all five files is only `13,688` triangles (`363.8 kB`) with zero textures, first-time buffer upload on selection during live animation occurs in a single frame with zero dropped frames or console errors.

### 4.5 Normative D-033 Budget Compliance Table (Spec §6.3)

| Normative Metric (`M2-MEASUREMENTS.md` §5) | Desktop (`Full`) Budget | Measured `Full` (Stock Off / Stock On / **5-Var Worst Case** / Cap Guard) | `Full` Status | `Phone` Budget | Measured `Phone` (Stock Off / Stock On / **5-Var Worst Case** / Cap Guard) | `Phone` Status |
| --- | ---: | ---: | :---: | ---: | ---: | :---: |
| **Scene asset triangles (`visibleSceneTriangles`)** | `≤ 360,000` | `271,224` / `302,620` / **`297,072`** / `308,008` cap | **PASS** (`+62,928` shipped / `+51,992` cap) | `≤ 320,000` | `271,224` / `302,620` / **`297,072`** / `308,008` cap | **PASS** (`+22,928` = `7.2%` shipped / `+11,992` = `3.7%` cap) |
| **Submitted triangles / frame** | `≤ 700,000` | `542,384` / `573,780` / **`561,320`** | **PASS** (`+138,680` headroom) | `≤ 400,000` | `271,224` / `302,272` / **`296,724`** (`297,072` max) | **PASS** (`+102,928` headroom) |
| **Draw calls / frame (incl. shadow)** | `≤ 250` | `73` / `106` / **`106`** (`104` @ `e=1`) | **PASS** (`+144` headroom) | `≤ 120` | `37` / `65` / **`65`** (`70` max unculled) | **PASS** (`+50` unculled headroom) |
| **Texture + HDRI GPU memory** | `≤ 64 MiB` | **`27.25 MiB`** across all states (`0` Δ) | **PASS** | `≤ 32 MiB` | **`11.25 MiB`** across all states (`0` Δ) | **PASS** |
| **Frame time @ 900 RPM whole-engine** | `≤ 16.7 ms` (`60 FPS`) | **`16.667 ms`** (`0.97–1.25 ms` CPU) | **PASS** | `≤ 33.3 ms` (`≥ 30 FPS`) | **`16.667–16.668 ms`** (`0.85–2.06 ms` CPU) | **PASS** |

---

## 5. Reference Frames `RF-8`…`RF-10` Capture & Stock-Restore Record (Spec §§5.2, 7.2, 10.6)

### 5.1 New Milestone 8 Reference Frames (`1440×900` Viewport → `1024×640` PNG)

| Frame | Crank Angle `θ` | Camera Position / Target (m) | Exterior / View State | Active Variants (`visibleVariantModels`) | `visibleSceneTriangles` / `variantSceneTriangles` | Capture File, Bytes & SHA-256 |
| --- | ---: | --- | --- | --- | ---: | --- |
| **RF-8** | `180°` | `[1.3800, -1.1800, 0.7200]` → `[0.3000, -0.0200, 0.1700]` | `Ext On`, `0% / Off / Off / Off` | `['turbo_large', 'intake_highflow', 'exhaust_4in', 'intercooler_upgraded']` (`shellPartsHidden: ['turbo_unit', 'turbo_downpipe', 'intake_tract']`) | `303,984` / `9,720` (`calls: 101`) | [`docs/reference-frames/RF-8.png`](./reference-frames/RF-8.png) · `262,796` B · `90bf27f62c695865782a99fc7fb3162b991b9fe3892d39c9eaab6bed4f5ca181` |
| **RF-9** | `0°` | `[-0.6200, 1.2200, 0.8600]` → `[0.2800, 0.0200, 0.1600]` | `Ext On`, `0% / Off / Off / Off` | `['turbo_large', 'intake_highflow', 'exhaust_4in', 'intercooler_upgraded']` (`shellPartsHidden: ['turbo_unit', 'turbo_downpipe', 'intake_tract']`) | `303,984` / `9,720` (`calls: 101`) | [`docs/reference-frames/RF-9.png`](./reference-frames/RF-9.png) · `286,783` B · `a30d27cd9a3088322dbe47a4667995ad882b3915ba2873c32f594421f9affa24` |
| **RF-10** | `90°` | `[1.2800, -1.0800, 0.7400]` → `[0.3100, -0.0500, 0.1800]` | `Ext Off`, `100% / Off / Off / On` | Selected: `['turbo_large', 'pistons_lowcomp']`; rendered: `['pistons_lowcomp']` (`pistonVariantActive: true`) | `264,312` / `31,744` (`calls: 73`) | [`docs/reference-frames/RF-10.png`](./reference-frames/RF-10.png) · `253,071` B · `a4e5b1478f97dd1684085e17ee519c327f9e25f06d871cd217a566036c31cccc` |

### 5.2 Stock-Restore Verification on `RF-1`…`RF-7` (Spec §10.6)

- Navigating `?rf=RF-1` through `?rf=RF-7` verified all twelve Build slots remain on stock selections with `getVisualVariantState()` returning `{ activeVariantIds: [], attachedVariantIds: [], shellPartsHidden: [], pistonVariantActive: false }` across all seven frames.
- Side-by-side comparison of live `?rf=RF-3` (`Exterior On`, `θ = 180°`) against committed [`docs/reference-frames/RF-3.png`](./reference-frames/RF-3.png) confirmed identical stock turbo, corrugated intake hose, and downpipe rendering with **zero split-boundary seams, zero z-fighting, and zero console errors**, reproducing the documented post-split stock stats (`visibleSceneTriangles: 302,620`, `triangles: 573,780`, `calls: 106` desktop / `65` phone [`70` max unculled], `geometries: 67`, `exteriorMergedMeshes: 33`).
