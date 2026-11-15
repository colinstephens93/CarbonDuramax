# Milestone 10 Measurements — Rebuilt Exterior Shell, Variant Interface Proof, Containment & D-033 Budget Compliance (`docs/M10-MEASUREMENTS.md`)

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) (Milestone 10) · Decisions: D-011, D-012, D-033, D-038, D-039, **D-041**, **D-042** · Spec: [`docs/specs/M10-exterior-accuracy.md`](./specs/M10-exterior-accuracy.md) · Exterior model record: [`docs/M10-EXTERIOR.md`](./M10-EXTERIOR.md) · Reference frames: [`docs/REFERENCE_FRAMES.md`](./REFERENCE_FRAMES.md) · Normative budgets: [`docs/M2-MEASUREMENTS.md`](./M2-MEASUREMENTS.md) §5 · Prior measurements: [`docs/M3-MEASUREMENTS.md`](./M3-MEASUREMENTS.md), [`docs/M7-MEASUREMENTS.md`](./M7-MEASUREMENTS.md), [`docs/M8-MEASUREMENTS.md`](./M8-MEASUREMENTS.md), [`docs/M9-MEASUREMENTS.md`](./M9-MEASUREMENTS.md)

---

## 1. Rebuilt Shell Asset Record & Logged Assertion Block (Spec §§5.2, 5.6, 11.2, 13.3)

### 1.1 Asset Summary (`public/Duramax_LLY_2005_66L_V8.glb`)

| Metric | M3–M9 Registered Shell | M10 Rebuilt Project-Frame Shell | Delta / Cap Verdict |
| --- | ---: | ---: | --- |
| File size (uncompressed glTF 2.0 binary) | `1,973,652 B` | **`1,212,932 B`** | **`-760,720 B` (`-38.54 %`)** |
| SHA-256 | `42993c99…0896` | **`d51f88a0073fde617d1c6492618fcfabc672154288ac546e52fe2ed40b718554`** | Recorded |
| Total scene triangles | `31,396` (uncapped) | **`37,100` / `37,100`** | **`+5,704` (`+18.17 %`, PASS)** |
| Top-level system groups / `extras.partId` leaves | `12` groups / `283` mesh nodes | **`22` groups / `92` `extras.partId` meshes** | **`22 / 22` & `92 / 92` (PASS)** |
| Preserved M8 swap subtrees (`turbo_unit / downpipe / intake`) | `2,056 / 560 / 5,740` (`8,356`) | **`3,400 / 800 / 2,300` (`6,500`)** | Re-pinned in `partVariants.ts` |
| Embedded images / textures / UV attributes | `4` textures (`6.500 MiB` GPU) | **`0` / `0` / `0` (`0.000 MiB` GPU)** | **`-6.500 MiB` VRAM saved (PASS)** |
| Merged exterior draw calls (`global + preserved`) | `21 + 12 = 33` | **`12 + 11 = 23`** (`≤ 24 + 13 = 37`) | **`-10` draw calls vs M8/M9 (PASS)** |
| GLTF file bounds (m) | `X[-1.3335, 1.2135] Y[-0.7800, 1.0979] Z[-1.1310, 1.5999]` | **`X[-0.272516, 0.617800] Y[-0.223500, 0.556000] Z[-0.480664, 0.549860]`** | Y-up export (`export_yup=True`) |
| Project bounds (mm) | `X[-282.14, 892.75] Y[-573.40, 521.82] Z[-223.60, 583.88]` | **`X[-272.52, 617.80] Y[-549.86, 480.66] Z[-223.50, 556.00]`** | Within `X[-282.1, 700] Y[-573.4, 521.8] Z[-223.6, 583.9]` (**PASS**) |
| Production JS bundle (`dist/assets/index-lmz3Br8K.js`) | `780,222 B` (`205.22 kB` gz, M9) | **`780,640 B` (`780.64 kB` / `205.25 kB` gz)** | `+418 B` raw / `+0.03 kB` gz (`RF-11..13` + constants) |

### 1.2 Verbatim `build_shell.py` Logged Assertion Block

Captured from headless **Blender `5.2.3 LTS`** (`hash e13b728c6880`):

```text
====================================================================================================
M10 EXTERIOR SHELL BUILD — PER-GROUP ASSERTION STREAM (Spec §16.2 Order)
====================================================================================================
[BUILD GROUP blockPan         ] tris=3500/3500 (PASS)  bounds_mm=X[ -62.0, 479.0] Y[-251.7, 232.1] Z[-223.5, 242.0] (PASS)  partIds=['ext_block', 'ext_drain_boss', 'ext_mount_lh', 'ext_mount_rh', 'ext_pan']
[BUILD GROUP frontCover       ] tris=1100/1100 (PASS)  bounds_mm=X[ 435.5, 486.5] Y[-196.8, 176.0] Z[ -88.0, 256.0] (PASS)  partIds=['ext_cp3_pad', 'ext_front_cover', 'ext_wp_boss']
[BUILD GROUP heads            ] tris=1600/1600 (PASS)  bounds_mm=X[ -24.0, 482.5] Y[-295.7, 295.7] Z[ 142.3, 290.3] (PASS)  partIds=['ext_exh_port_stub_lh_1', 'ext_exh_port_stub_lh_2', 'ext_exh_port_stub_lh_3', 'ext_exh_port_stub_lh_4', 'ext_exh_port_stub_rh_1', 'ext_exh_port_stub_rh_2', 'ext_exh_port_stub_rh_3', 'ext_exh_port_stub_rh_4', 'ext_head_lh', 'ext_head_rh']
[BUILD GROUP valveCovers      ] tris=3400/3400 (PASS)  bounds_mm=X[ -22.0, 481.0] Y[-342.2, 342.2] Z[ 203.3, 340.0] (PASS)  partIds=['ext_vc_fasteners', 'ext_vc_lower_lh', 'ext_vc_lower_rh', 'ext_vc_pcv_boss', 'ext_vc_upper_lh', 'ext_vc_upper_rh']
[BUILD GROUP injectors        ] tris=2100/2100 (PASS)  bounds_mm=X[  39.5, 417.0] Y[-290.7, 290.7] Z[ 296.6, 367.3] (PASS)  partIds=['ext_inj_connector_1', 'ext_inj_connector_2', 'ext_inj_connector_3', 'ext_inj_connector_4', 'ext_inj_connector_5', 'ext_inj_connector_6', 'ext_inj_connector_7', 'ext_inj_connector_8', 'ext_inj_return_line', 'ext_injector_1', 'ext_injector_2', 'ext_injector_3', 'ext_injector_4', 'ext_injector_5', 'ext_injector_6', 'ext_injector_7', 'ext_injector_8']
[BUILD GROUP exhaustManifolds ] tris=2300/2300 (PASS)  bounds_mm=X[ -43.3, 429.3] Y[-320.7, 320.7] Z[  73.1, 172.8] (PASS)  partIds=['ext_exh_manifold_lh', 'ext_exh_manifold_rh', 'ext_exh_shield_lh', 'ext_exh_shield_rh']
[BUILD GROUP turbo            ] tris=5300/5300 (PASS)  bounds_mm=X[-272.5,  49.8] Y[-282.9, 282.9] Z[ -21.9, 508.4] (PASS)  partIds=['ext_uppipe_lh', 'ext_uppipe_rh', 'turbo_downpipe', 'turbo_unit']
[BUILD GROUP boostPipe        ] tris=1400/1400 (PASS)  bounds_mm=X[  32.6, 412.5] Y[  42.4, 480.7] Z[ 107.0, 440.4] (PASS)  partIds=['ext_charge_hot']
[BUILD GROUP chargePipeCold   ] tris= 800/ 800 (PASS)  bounds_mm=X[ 298.1, 513.5] Y[-453.5,  10.3] Z[ 146.9, 369.1] (PASS)  partIds=['ext_charge_cold']
[BUILD GROUP intake           ] tris=2300/2300 (PASS)  bounds_mm=X[ -19.1, 615.6] Y[-549.9,  58.1] Z[ 325.1, 512.4] (PASS)  partIds=['ext_intake_clamps', 'ext_intake_duct', 'ext_intake_mouthpiece']
[BUILD GROUP resonator        ] tris= 600/ 600 (PASS)  bounds_mm=X[  92.0, 236.5] Y[   6.6, 112.0] Z[ 324.0, 556.0] (PASS)  partIds=['ext_resonator', 'ext_resonator_clamp']
[BUILD GROUP intakeBridge     ] tris=2300/2300 (PASS)  bounds_mm=X[ 214.0, 346.4] Y[-144.8, 144.8] Z[ 234.3, 352.0] (PASS)  partIds=['ext_map_sensor', 'ext_ybridge_crossover', 'ext_ybridge_duct', 'ext_ybridge_fasteners', 'ext_ybridge_seals']
[BUILD GROUP egrSystem        ] tris=1900/1900 (PASS)  bounds_mm=X[ -52.4, 251.6] Y[-122.0, -45.7] Z[ 214.0, 344.0] (PASS)  partIds=['ext_egr_bracket', 'ext_egr_cooler', 'ext_egr_pipes', 'ext_egr_valve']
[BUILD GROUP beltDrive        ] tris=3300/3300 (PASS)  bounds_mm=X[ 456.0, 617.8] Y[-356.2, 336.4] Z[ -99.0, 423.4] (PASS)  partIds=['ext_belt', 'ext_damper', 'ext_fan', 'ext_fan_clutch', 'ext_idler_a', 'ext_idler_b', 'ext_tensioner']
[BUILD GROUP alternator       ] tris=1400/1400 (PASS)  bounds_mm=X[ 342.0, 494.0] Y[-352.0,-124.5] Z[  54.0, 408.0] (PASS)  partIds=['ext_alternator', 'ext_vacuum_pump']
[BUILD GROUP acComp           ] tris= 600/ 600 (PASS)  bounds_mm=X[ 348.0, 492.0] Y[ 118.0, 367.0] Z[  38.0, 449.7] (PASS)  partIds=['ext_ac_bracket', 'ext_ac_compressor', 'ext_ac_hoses', 'ext_ps_pump']
[BUILD GROUP cp3Fuel          ] tris=1400/1400 (PASS)  bounds_mm=X[  30.0, 452.0] Y[-269.2, 269.2] Z[ 162.0, 332.6] (PASS)  partIds=['ext_cp3', 'ext_fca', 'ext_hp_lines', 'ext_hp_rails']
[BUILD GROUP fuelFilter       ] tris= 600/ 600 (PASS)  bounds_mm=X[ 190.6, 268.2] Y[-320.0,-189.2] Z[ 174.7, 374.0] (PASS)  partIds=['ext_fuel_filter_canister', 'ext_fuel_filter_head']
[BUILD GROUP oilFill          ] tris= 250/ 250 (PASS)  bounds_mm=X[ 460.0, 540.8] Y[  66.0, 137.4] Z[ 186.0, 386.8] (PASS)  partIds=['ext_oil_cap', 'ext_oil_fill_neck']
[BUILD GROUP dipstick         ] tris= 250/ 250 (PASS)  bounds_mm=X[ -42.1, 120.1] Y[-302.6,-159.9] Z[ -38.6, 447.9] (PASS)  partIds=['ext_dipstick_handle', 'ext_dipstick_tube']
[BUILD GROUP liftBracket      ] tris= 300/ 300 (PASS)  bounds_mm=X[ -33.0, -17.0] Y[ 156.0, 212.0] Z[ 268.0, 372.0] (PASS)  partIds=['ext_lift_bracket']
[BUILD GROUP electronics      ] tris= 400/ 400 (PASS)  bounds_mm=X[ -81.1, 420.5] Y[-299.2, 299.2] Z[ 183.9, 356.0] (PASS)  partIds=['ext_glowplug_loom', 'ext_harness_loom', 'ext_harness_main_break']

====================================================================================================
M10 EXTERIOR SHELL — LOGGED ASSERTION BLOCK (BINARY GLB READ-BACK)
====================================================================================================
Output GLB : C:\Users\colin\Documents\Gemini\CarbonDuramax\public\Duramax_LLY_2005_66L_V8.glb
Bytes      : 1212932  |  SHA-256: d51f88a0073fde617d1c6492618fcfabc672154288ac546e52fe2ed40b718554
Triangles  : 37100 / 37100 (PASS)  |  Top-level groups: 22 / 22 (PASS)
Distinct partIds: 92 / 92 (PASS)  |  Images/Textures/UVs: 0 / 0 / 0 (PASS)
Merged Signatures: global=12 / 24 (PASS)  preserved=11 / 13 [turbo_unit=6/6, turbo_downpipe=2/2, intake_tract=3/5] -> total_exterior_draw_calls=23 <= 37 (PASS)
Preserved Subtree Triangles: turbo_unit=3400, turbo_downpipe=800, intake_tract=2300 (sum=6500, PASS)
GLTF File Bounds (m)   : X[-0.272516, 0.617800]  Y[-0.223500, 0.556000]  Z[-0.480664, 0.549860]
Project Bounds (mm)    : X[-272.52, 617.80] in [-282.1, 700.0]  Y[-549.86, 480.66] in [-573.4, 521.8]  Z[-223.50, 556.00] in [-223.6, 583.9] (PASS)
Label Anchors          : turbocharger=INSIDE, oil-pan=INSIDE, harmonic-balancer ext_damper_center=(478.00, 0.00, 0.00) dev=0.0000 mm <= 1.0 mm (PASS)

Per-Group Triangle Summary vs §5.2 Normative Budget:
  blockPan          :  3500 /  3500 (PASS)
  injectors         :  2100 /  2100 (PASS)
  cp3Fuel           :  1400 /  1400 (PASS)
  turbo             :  5300 /  5300 (PASS)
  egrSystem         :  1900 /  1900 (PASS)
  resonator         :   600 /   600 (PASS)
  intake            :  2300 /  2300 (PASS)
  boostPipe         :  1400 /  1400 (PASS)
  alternator        :  1400 /  1400 (PASS)
  acComp            :   600 /   600 (PASS)
  beltDrive         :  3300 /  3300 (PASS)
  electronics       :   400 /   400 (PASS)
  frontCover        :  1100 /  1100 (PASS)
  heads             :  1600 /  1600 (PASS)
  valveCovers       :  3400 /  3400 (PASS)
  exhaustManifolds  :  2300 /  2300 (PASS)
  chargePipeCold    :   800 /   800 (PASS)
  intakeBridge      :  2300 /  2300 (PASS)
  fuelFilter        :   600 /   600 (PASS)
  oilFill           :   250 /   250 (PASS)
  dipstick          :   250 /   250 (PASS)
  liftBracket       :   300 /   300 (PASS)

Milestone 8 Interface Datum & Rim Verification (§6.1-6.2):
  if_turbine_inlet_rh   : nearest_vert=0.0000 mm (<=1.0 PASS)  rim_r=44.00 mm vs 44.0 (+-1.0 PASS)  normal_dev=0.0000 deg (<=0.5 PASS)
  if_turbine_inlet_lh   : nearest_vert=0.0000 mm (<=1.0 PASS)  rim_r=44.00 mm vs 44.0 (+-1.0 PASS)  normal_dev=0.0000 deg (<=0.5 PASS)
  if_turbine_outlet     : nearest_vert=0.0000 mm (<=1.0 PASS)  rim_r=52.00 mm vs 52.0 (+-1.0 PASS)  normal_dev=0.0000 deg (<=0.5 PASS)
  if_compressor_inlet   : nearest_vert=0.0000 mm (<=1.0 PASS)  rim_r=48.00 mm vs 48.0 (+-1.0 PASS)  normal_dev=0.0005 deg (<=0.5 PASS)
  if_compressor_outlet  : nearest_vert=0.0000 mm (<=1.0 PASS)  rim_r=44.00 mm vs 44.0 (+-1.0 PASS)  normal_dev=0.0000 deg (<=0.5 PASS)
  if_airbox_mount       : nearest_vert=0.0000 mm (<=1.0 PASS, upgraded service feature)
  if_hot_side_inlet     : nearest_vert=0.0000 mm (<=1.0 PASS, upgraded service feature)

Containment & Clearance Report (§5.6.3):
  General internal clearance : min=9.34 mm >= 8.00 mm (PASS)
    [vc_rocker_top=10.56, vc_front_x=9.34, vc_rear_x=10.34, head_side=10.53, vc_inj_relief=11.59, pan_crank=38.20]
  Deck/head land exception   : 2.20 mm >= 2.00 mm (PASS)
  Crank-snout zone (X<=492)  : radial=3.80 mm >= 3.00 mm (PASS), axial=2.80 mm >= 2.00 mm (PASS)
  Pan / studio floor margin  : 21.50 mm >= 21.40 mm (Z_min=-223.50 vs floor=-245.00, PASS)
====================================================================================================
```

*(Selector clarification on Spec §9 item 6: `nearest_vert ≤ 1.0 mm` (`0.0000 mm` achieved) checks center contact, while the mating-rim radius `44 / 44 / 52 / 48 / 44 mm` is evaluated over planar flange-cap vertices with normal projection `|(p - marker)·n| ≤ 1.0 mm` and aligned cap normals inside the `≤ 75 mm` local flange neighborhood, since Euclidean `||p - marker|| ≤ 1.5 mm` bounds radial distance to `≤ 1.5 mm`.)*

---

## 2. `build_variants.py` Re-Run & Variant Byte-Identity Proof (Spec §§5.6.4, 11.2, 13.4)

After updating only the assertion-side shell registration (`(g_x, -g_z, g_y)`, scale `1`, zero translation) and `SHELL_GROUP_NAMES` (`22` groups) in [`assets-src/blender/build_variants.py`](../assets-src/blender/build_variants.py), re-running `build_variants.py` against the rebuilt shell (`d51f88a0…`) exits `0`, logs `0` obstacle penetrations across all 22 shell groups (`min_v2v ≥ 2.94 mm ≥ 2.00 mm`), and leaves all five variant GLBs in `public/models/variants/` **byte-identical** to [`docs/M8-MEASUREMENTS.md`](./M8-MEASUREMENTS.md) §1 (`git status --short public/models/variants` empty):

```text
================================================================================================
M8 VARIANT BUILD — LOGGED ASSERTION BLOCK
================================================================================================
Frozen exterior shell GLB SHA-256: d51f88a0073fde617d1c6492618fcfabc672154288ac546e52fe2ed40b718554

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
  non_penetration: non_excepted_inside=0 (obstacle_groups=0, connected_outside_90mm_collar=0; PASS, D-039)  min_envelope_surface_gap_mm=2.29  min_v2v_mm=4.15 (boostPipe) >= 2.00 (PASS)  [boostPipe:4.15, electronics:15.11, egrSystem:15.56, liftBracket:28.70]
  connection_collar_diag (D-039): connected_30_to_90mm_mouth_verts=181 (max_marker_dist=58.76 mm <= 90.00 mm)  min_connected_outside_90mm_v2v_mm=31.64 (turbo_uppipe_lh) >= 2.00 (PASS)

[intake_tract_engine_highflow.glb]
  bytes=64416  sha256=fc28f77b7816a38ad6cb1a53351960b9cf3baf54e089b59de39223c1ba2f7e58
  triangles=2560 / cap=2600 (PASS)  vertices=1884  materials=4 / 4 (PASS)
  project_bounds_mm: X[-17.98, 778.54] in [-20, 800]  Y[-639.09, 56.13] in [-650, 100]  Z[289.14, 547.79] in [280, 560] (PASS)
  min_z_mm=289.14  ground_clearance_mm=534.14
  marker if_compressor_inlet: glb_mm=(13.20, 22.60, 453.60) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  marker if_airbox_mount: glb_mm=(587.40, -510.50, 371.90) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  non_penetration: non_excepted_inside=0 (obstacle_groups=0, connected_outside_90mm_collar=0; PASS, D-039)  min_envelope_surface_gap_mm=2.34  min_v2v_mm=2.94 (boostPipe) >= 2.00 (PASS)  [boostPipe:2.94, resonator:15.24, alternator:30.04, egrSystem:33.25]
  connection_collar_diag (D-039): connected_30_to_90mm_mouth_verts=62 (max_marker_dist=72.48 mm <= 90.00 mm)  min_connected_outside_90mm_v2v_mm=12.66 (turbo_unit) >= 2.00 (PASS)
  readback_v2_tube_od_mm=101.6438 (expected 101.6000, PASS)

[exhaust_system_engine_4inch.glb]
  bytes=50064  sha256=a463172aeae64688383400d56b5c2d70dbf3e62992da1b3013892b456c53fa32
  triangles=2436 / cap=2800 (PASS)  vertices=1389  materials=2 / 4 (PASS)
  project_bounds_mm: X[-1092.64, -113.80] in [-1100, -110]  Y[-218.00, 2.00] in [-300, 60]  Z[-85.00, 415.95] in [-160, 470] (PASS)
  min_z_mm=-85.00  ground_clearance_mm=160.00
  marker if_turbine_outlet: glb_mm=(-146.20, -59.20, 373.30) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  non_penetration: non_excepted_inside=0 (obstacle_groups=0, connected_outside_90mm_collar=0; PASS, D-039)  min_envelope_surface_gap_mm=111.56  min_v2v_mm=111.99 (egrSystem) >= 2.00 (PASS)  [egrSystem:111.99, blockPan:131.71, intake:146.51, heads:149.78]
  connection_collar_diag (D-039): connected_30_to_90mm_mouth_verts=146 (max_marker_dist=58.81 mm <= 90.00 mm)  min_connected_outside_90mm_v2v_mm=37.88 (turbo_uppipe_rh) >= 2.00 (PASS)

[intercooler_core_engine_upgraded.glb]
  bytes=48436  sha256=1f112556e1af253e761413f4e176689904e9c1b043e95ad5814bb984aeb9b183
  triangles=1520 / cap=1800 (PASS)  vertices=1516  materials=3 / 4 (PASS)
  project_bounds_mm: X[80.55, 682.00] in [60, 700]  Y[472.68, 696.00] in [430, 720]  Z[-20.00, 338.00] in [-60, 360] (PASS)
  min_z_mm=-20.00  ground_clearance_mm=225.00
  marker if_hot_side_inlet: glb_mm=(374.60, 474.80, 146.60) datum_dev=0.0000 mm (PASS)  nearest_mesh_vert=0.000 mm
  non_penetration: non_excepted_inside=0 (obstacle_groups=0, connected_outside_90mm_collar=0; PASS, D-039)  min_envelope_surface_gap_mm=105.94  min_v2v_mm=107.60 (acComp) >= 2.00 (PASS)  [acComp:107.60, valveCovers:150.69, beltDrive:152.18, exhaustManifolds:154.17]
  connection_collar_diag (D-039): connected_30_to_90mm_mouth_verts=52 (max_marker_dist=38.55 mm <= 90.00 mm)  min_connected_outside_90mm_v2v_mm=64.14 (boostPipe) >= 2.00 (PASS)

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

---

## 3. Runtime `?benchmark=1` Matrix & D-033 Budget Verdict (Spec §§7.2–7.4, 13.5, 15.2–15.4)

### 3.1 Measurement Environment
- **Host / GPU:** `Intel(R) Core(TM) Ultra 7 256V`, `15.7 GiB` RAM, Windows 11 x64 · `ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (8GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)` (WebGL 2, matching [`docs/M9-MEASUREMENTS.md`](./M9-MEASUREMENTS.md) §2.1)
- **Browser / Bundle:** Chromium `152` built-in browser · production preview (`npm run build && npx vite preview --port 4173 --strictPort`, `dist/assets/index-lmz3Br8K.js`)
- **Protocol:** `?benchmark=1&exterior=1` at **900 RPM** (`1×` speed), `60`-frame warmup + `10.0 s` (`601`-frame) steady-state window after `detailedLoaded && hdriLoaded && exteriorLoaded && variantsLoaded`. Worst-case variant query adds `&variants=turbo_large,intake_highflow,exhaust_4in,intercooler_upgraded,pistons_lowcomp`.

### 3.2 Measured `?benchmark=1` Matrix (Desktop `Full` `1440×900` vs Phone `Phone` `390×844`)

| Metric | Desktop Stock (`Full`, `1440×900`) | Desktop Worst-Case 5 Variants (`Full`, `1440×900`) | Phone Stock (`Phone`, `390×844`) | Phone Worst-Case 5 Variants (`Phone`, `390×844`) |
| --- | ---: | ---: | ---: | ---: |
| `visibleSceneTriangles` | **`308,324`** | **`304,632`** | **`308,324`** | **`304,632`** |
| `triangles` (submitted / frame) | **`579,484`** | **`568,880`** | **`307,876`** | **`304,512`** |
| `calls` (draw calls / frame) | **`96`** | **`97`** | **`58`** | **`60`** |
| `exteriorMergedMeshes` | `23` (`12` global + `11` preserved) | `12` active + `4` variant GLBs | `23` (`12` global + `11` preserved) | `12` active + `4` variant GLBs |
| `textures` / `estimatedTextureVramMiB` | **`4` / `20.75 MiB`** | **`4` / `20.75 MiB`** | **`2` / `4.75 MiB`** | **`2` / `4.75 MiB`** |
| Sampled frames (`elapsedMs`) | `601` (`10,015.0 ms`) | `601` (`10,013.9 ms`) | `601` (`10,015.0 ms`) | `601` (`10,013.3 ms`) |
| `avgFrameTimeMs` (`avgFps`) | `16.664 ms` (`60.01 FPS`) | `16.662 ms` (`60.02 FPS`) | `16.664 ms` (`60.01 FPS`) | `16.661 ms` (`60.02 FPS`) |
| **`p50 / p95 / min / max` frame time (ms)** | **`16.7 / 16.8 / 14.9 / 18.5`** | **`16.7 / 16.8 / 13.9 / 18.3`** | **`16.7 / 16.8 / 15.4 / 17.2`** | **`16.7 / 16.8 / 13.0 / 17.0`** |
| **`p95` delta vs M9 baseline (`16.8 ms`)** | **`+0.00 ms` (`≤ +0.30 ms`)** | **`+0.00 ms` (`≤ +0.30 ms`)** | **`+0.00 ms` (`≤ +0.30 ms`)** | **`+0.00 ms` (`≤ +0.30 ms`)** |
| `droppedFrames` (`dt > 1.5 × p50`) | **`0`** | **`0`** | **`0`** | **`0`** |
| `avgCpuRenderMs` (`p95CpuRenderMs`) | `1.918 ms` (`3.0 ms`) | `2.042 ms` (`2.9 ms`) | `1.130 ms` (`1.9 ms`) | `1.387 ms` (`2.2 ms`) |

### 3.3 D-033 Normative Budget & Cap-Guard Verdict Table (Spec §§7.2, 7.3, 15.2–15.4)

| Normative Metric | D-033 Budget | M8/M9 Baseline | M10 Measured (Stock / 5-Variant) | Utilisation | Headroom | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | :---: |
| **Desktop** scene triangles (`visibleSceneTriangles`) | `360,000` | `302,620` | **`308,324`** / `304,632` | `85.65 %` | `51,676` (`14.35 %`) | **PASS** |
| **Phone** scene triangles — measured stock / 5-variant | `320,000` | `302,620` | **`308,324`** / **`304,632`** | `96.35 %` / `95.20 %` | **`11,676` (`3.65 %`)** / `15,368` | **PASS** |
| **Phone** scene triangles — conservative cap-guard (`partVariants.test.ts` #9) | `320,000` | `308,008` | **`315,568`** (`308,324 - 6,500 + 10,800 + 2,944`) | `98.62 %` | **`4,432` (`1.38 %`)** | **PASS** |
| **Desktop** submitted triangles / frame | `700,000` | `573,780` | **`579,484`** / `568,880` | `82.78 %` | `120,516` (`17.22 %`) | **PASS** |
| **Phone** submitted triangles / frame | `400,000` | `302,272` | **`307,876`** / `304,512` (`≤ 308,324` unculled) | `76.97 %` | `92,124` (`23.03 %`) | **PASS** |
| **Desktop** draw calls / frame | `250` | `106` | **`96`** / **`97`** (`≤ 110` max unculled) | `38.80 %` | `153` (`61.20 %`) | **PASS** |
| **Phone** draw calls / frame | `120` | `65` | **`58`** / **`60`** (`≤ 74` max unculled) | `50.00 %` | `60` (`50.00 %`) | **PASS** |
| **Desktop** texture + HDRI VRAM | `64.00 MiB` | `27.25 MiB` | **`20.75 MiB`** (`-6.50 MiB`) | `32.42 %` | `43.25 MiB` (`67.58 %`) | **PASS** |
| **Phone** texture + HDRI VRAM | `32.00 MiB` | `11.25 MiB` | **`4.75 MiB`** (`-6.50 MiB`) | `14.84 %` | `27.25 MiB` (`85.16 %`) | **PASS** |
| **Desktop** frame time `p95` `@ 900 RPM` | `16.7 ms` (`Δ ≤ +0.30 ms` vs M9) | `16.8 ms` (60 Hz VSync) | **`16.8 ms`** (`avg = 16.664 ms`, `Δ = +0.00 ms`) | VSync locked | `0` dropped frames | **PASS** |
| **Phone** frame time `p95` `@ 900 RPM` | `33.3 ms` (`Δ ≤ +0.30 ms` vs M9) | `16.8 ms` (60 Hz VSync) | **`16.8 ms`** (`avg = 16.664 ms`, `Δ = +0.00 ms`) | `50.45 %` | `16.5 ms` (`0` dropped) | **PASS** |

---

## 4. Visual Reference Frames & Exterior-Off Invariance Proof (Spec §§8.1–8.3, 13.6)

### 4.1 Seven Captured Exterior-On Reference Frames (`1440×900 → 1024×640` PNG)

| Frame | Status | Crank Angle `θ` | Build & View State | Bytes | SHA-256 | Checklist & §8.3 Discriminators |
| --- | --- | ---: | --- | ---: | --- | --- |
| [`RF-3`](./reference-frames/RF-3.png) | Re-baselined | `180°` | `stock`, Exterior `On` | `243,687` | `9c6eab7f724cd2d83b8be74b5cc74cf9f307eacfb598d3d67d34da768c284aa7` | `3 / 3` items visible (**PASS**) |
| [`RF-7`](./reference-frames/RF-7.png) | Re-baselined | `180°` | `stock`, Exterior `On`, X-Ray `On` | `276,671` | `05d2ab1f284faa58b357395ce6bd7bc85f63f5b99f76f2c8cd5dc1779e2fdddc` | `2 / 2` items visible (**PASS**) |
| [`RF-8`](./reference-frames/RF-8.png) | Re-baselined | `180°` | `4` external variants, Exterior `On` | `258,291` | `c105e52f703da2bb9843116098fa4b2c877ad2d23ed09cd275827fe48360860a` | `3 / 3` items visible (**PASS**) |
| [`RF-9`](./reference-frames/RF-9.png) | Re-baselined | `0°` | `4` external variants, Exterior `On` | `295,317` | `0e1dbd0a146fad97903f0cbbb3df191ab135cf0d74c2d8d88fe0e1894b16d7bb` | `3 / 3` items visible (**PASS**) |
| [`RF-11`](./reference-frames/RF-11.png) | **New** | `180°` | `stock`, Exterior `On` (front 3/4) | `243,687` | `9c6eab7f724cd2d83b8be74b5cc74cf9f307eacfb598d3d67d34da768c284aa7` | `7 / 7` items + Discriminators `#1, #5, #6, #8` (**PASS**; shares pose/state with `RF-3`) |
| [`RF-12`](./reference-frames/RF-12.png) | **New** | `0°` | `stock`, Exterior `On` (rear-left 3/4) | `267,381` | `3b2da93a00da4c40c0744f1fa9db0aedc7f3f8e032915f8048f5939e97767cfc` | `7 / 7` items + Discriminators `#2, #3, #4` (**PASS**) |
| [`RF-13`](./reference-frames/RF-13.png) | **New** | `705°` | `stock`, Exterior `On` (top-down valley) | `358,739` | `8addbff01736849acdf8b35335b5bf382bf6e2f9b015051f3e163eb5d0a469d3` | `6 / 6` items + Discriminators `#1, #5, #7` (**PASS**) |

*(Zero checklist items deferred across all seven frames.)*

### 4.2 Six Exterior-Off Reference Frames — Untouched SHA-256 & 3D Scene Regression Gate (Spec §§8.1, 13.6)

All six exterior-off PNGs in `docs/reference-frames/` are untouched (`git diff main -- docs/reference-frames/RF-1.png RF-2.png RF-4.png RF-5.png RF-6.png RF-10.png` is empty):

| Exterior-Off Frame | Bytes | Committed SHA-256 (`git diff main` empty) | 3D Internal Scene Regression Check |
| --- | ---: | --- | --- |
| `RF-1.png` (`θ = 0°`) | `226,931` | `b5d59429d3fb21a05ca14a21ebe92e2a7f93b4a79b2cee48ce6e505074be8736` | Untouched (M3/M4 pre-M7 baseline PNG) |
| `RF-2.png` (`θ = 470°`) | `388,028` | `ed5ac22778e45333fb8517ec9a6a73fa4bbce720fb079879f358267670486bd7` | Untouched (M3/M4 pre-M7 baseline PNG) |
| `RF-4.png` (`θ = 705°`) | `315,879` | `5644384ecfd7d1c60f325a948b7c0a46ed56937e894aab6e6ded45e0c274ebf8` | Untouched (M3/M4 pre-M7 baseline PNG) |
| `RF-5.png` (`θ = 90°`) | `224,380` | `1b5e5251baac34237fbec1db301a484c5450fe55b99a682d3976fddd36e2785d` | Untouched (M4 pre-M7 baseline PNG) |
| `RF-6.png` (`θ = 0°`) | `242,668` | `6745616e145989a5e79e5e816ae915c13daa517463f60586d53ce62e0f38a5a1` | Untouched (M4 pre-M7 baseline PNG) |
| `RF-10.png` (`θ = 90°`, M8 post-M7) | `253,071` | `a4e5b1478f97dd1684085e17ee519c327f9e25f06d871cd217a566036c31cccc` | **Live re-render pixel-compared against committed `RF-10.png`: `0` differing pixels (`mean_rgb_diff = 0.0000`, `max_rgb_diff = 0`) across the entire `620 × 485 px` (`x = 60..680, y = 70..555`) 3D engine viewport** (only the HUD subtitle `Milestone 8` → `Milestone 10`, M9 `Sound: Off` button, and M10 disclaimer caption differ in the HTML overlay). |

*(Note: `RF-1..RF-6` committed PNGs predate Milestone 7's internal rod-length/lift upgrade and Milestone 9's `Sound: Off` button, whereas `RF-10` was captured post-M7 at Milestone 8 and therefore isolates M10's internal-scene invariance pixel-for-pixel.)*

---

## 5. Runtime 8-Angle Containment Sweep (Spec §13.7)

Captured at `1440×900 → 1024×640` with `Exterior = On`, `Full` quality, and stock build across all eight required crank angles at the `RF-3`/`RF-11` front three-quarter pose (`[1.38, -1.18, 0.72] → [0.30, -0.02, 0.17] m`), plus an auxiliary check at `θ = 470°` (Cylinder 1 peak intake lift) from the `RF-12` rear-left pose:

| Crank Angle `θ` | Pose | Key Internal Kinematic State | PNG Bytes | Screenshot SHA-256 | Engine-Body Piercing Pixels | Max RGB Diff vs `θ = 0°` (`RF-3` pose) / `RF-12` | Verdict |
| ---: | --- | --- | ---: | --- | ---: | --- | :---: |
| **`0°`** | `RF-3` front 3/4 | Cyl 1 RH firing TDC | `243,837` | `8d420ade5cfa4779238466901f1c3c5f05de61879dbbab959d4ab0249626b99c` | **`0`** | Baseline (`0`) | **PASS** |
| **`90°`** | `RF-3` front 3/4 | Cyl 2 LH firing TDC | `244,024` | `1580240faae406fc91e671fa81f3cec27ac75c46335acfe61c219cf2df712af9` | **`0`** | `8 / 255` (studio floor shadow only; HUD masked) | **PASS** |
| **`180°`** | `RF-3` front 3/4 | Cyl 7 RH firing TDC | `243,965` | `534b9ded24fecd2af8ed17af5c2380d8b3017eca4e606c7db374d97d90977037` | **`0`** | `9 / 255` (studio floor shadow only; HUD masked) | **PASS** |
| **`270°`** | `RF-3` front 3/4 | Cyl 8 LH firing TDC | `244,009` | `cd37545b640ffdac5ff8d628891e597dc77e6910e1f0f8b6feb2aa2f33d0ba55` | **`0`** | `9 / 255` (studio floor shadow only; HUD masked) | **PASS** |
| **`360°`** | `RF-3` front 3/4 | Cyl 4 LH firing TDC / Cyl 1 overlap | `244,052` | `5ad108dced65a4263cec5c66d669a1fd816a0f509c6dcaa3c03b3ecffc105334` | **`0`** | `8 / 255` (studio floor shadow only; HUD masked) | **PASS** |
| **`470°`** | `RF-3` front 3/4 | Cyl 1 peak intake lift (`~12.0 mm`) | `244,002` | `59847da32f8c22d7cac84542b41d5d7057b01166caddd67e7ec139c94ae5af49` | **`0`** | `7 / 255` (studio floor shadow only; HUD masked) | **PASS** |
| **`540°`** | `RF-3` front 3/4 | Cyl 6 LH firing TDC | `244,021` | `612b60039db429a96ac5797ab126017d3a2f5fd5df9c2e5bd1445aa0e62da0d8` | **`0`** | `4 / 255` (studio floor shadow only; HUD masked) | **PASS** |
| **`705°`** | `RF-3` front 3/4 | Cyl 3 RH firing window (`[630°, 720°)`) | `244,026` | `3c7c74077addbcfb988099108a28546f8a7ebee70cd3ac4b9b1de1bd0c7b6485` | **`0`** | `2 / 255` (studio floor shadow only; HUD masked) | **PASS** |
| **`470°`** *(aux)* | `RF-12` rear-left | Peak intake lift rear/valley check | `267,794` | `8ed24971ebecd21b0db3b82c03a4166e46d3c0936bc3b9356aeffbbbbed81ed6` | **`0`** | `11 / 255` vs `RF-12` (`0°`, floor shadow only) | **PASS** |

No valve-cover, cylinder-head, rocker, pushrod, spring, piston, orange firing highlight, or crankshaft geometry pierces any exterior shell surface at any angle; the `2–11 / 255` pixel delta on the `Z = -0.245 m` studio floor arises because the internal valvetrain/crankshaft casts `castShadow = true` directional shadows onto the floor while the exterior shell keeps `castShadow = false` (`src/renderer/exteriorLoader.ts`).

---

## 6. Exact Commands Used (Spec §11.2)

```powershell
# 1. Rebuild public/Duramax_LLY_2005_66L_V8.glb from assets-src/shell_dimensions.json
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup `
  --python assets-src/blender/build_shell.py -- `
  --shell-dimensions assets-src/shell_dimensions.json `
  --out public/Duramax_LLY_2005_66L_V8.glb

# 2. Re-run Milestone 8 variant builder against the rebuilt shell & verify unchanged variant SHA-256s
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup `
  --python assets-src/blender/build_variants.py -- `
  --out public/models/variants
git status --short public/models/variants

# 3. TypeScript, Vitest (19 files / 89 tests), and Vite production build gates
npm run typecheck
npm test
npm run build

# 4. Serve production build for ?benchmark=1 and ?rf=RF-1..RF-13 captures
npx vite preview --port 4173 --strictPort

# 5. Frozen-file boundary audit (Spec §13.1 — must output zero lines)
git diff main -- src/core src/perf src/config catalog src/audio src/assets .github `
  vite.config.ts tsconfig.json package.json package-lock.json public/models public/hdri `
  docs/M2-MEASUREMENTS.md docs/M3-MEASUREMENTS.md docs/M4-MEASUREMENTS.md docs/M5-MODEL.md `
  docs/M6-PARTS.md docs/M7-DATA.md docs/M7-MEASUREMENTS.md docs/M8-VARIANTS.md `
  docs/M8-MEASUREMENTS.md docs/M9-SOUND.md docs/M9-MEASUREMENTS.md `
  docs/specs/M0-* docs/specs/M1-* docs/specs/M2-* docs/specs/M3-* docs/specs/M4-* `
  docs/specs/M5-* docs/specs/M6-* docs/specs/M7-* docs/specs/M8-* docs/specs/M9-* `
  docs/research/L7-* docs/research/M8-* docs/research/M9-* `
  docs/PLANNING.md docs/ORCHESTRATOR.md docs/THREE_API_NOTES.md
```
