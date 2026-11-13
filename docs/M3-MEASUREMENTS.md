# Milestone 3 Measurements, Exterior Registration, Sweep Report & Budget Compliance

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) v2.2 (Milestone 3) · Decisions: D-004, D-011, D-012, D-024, D-025, D-033, D-034 · Spec: [`docs/specs/M3-full-engine.md`](./specs/M3-full-engine.md) · Normative budgets: [`docs/M2-MEASUREMENTS.md`](./M2-MEASUREMENTS.md) §5 · Reference frames: [`docs/REFERENCE_FRAMES.md`](./REFERENCE_FRAMES.md)

---

## 1. Per-Part & Full ×8 Engine Triangle Breakdown

Only two GLB files in `public/models/` were regenerated via headless Blender `5.2.3 LTS` ([`assets-src/blender/build_cylinder1.py`](../assets-src/blender/build_cylinder1.py) reading [`assets-src/dimensions.json`](../assets-src/dimensions.json)):
- `rot_crankthrow_c1_stock.glb`: widened pin journal along `X` to `pinJournalLengthMm = 58.0 mm` (`±29.0 mm`, carrying two side-by-side rods at `±14.2 mm` seats with `2.0 mm` rod-to-rod gap and `1.6 mm` end margin) and outboard crank webs at `±(29.0..47.0) mm` inside the `±57.5 mm` station slice.
- `sta_head_c1_stock.glb`: symmetric two-window pushrod gallery recesses on both `±X` deck-slab faces (`B ∈ [267.5, 279.1] mm`), derived from the live swept pushrod trajectories across `[0, maxLift]` and verified by the build script's logged assertion:
  ```text
  [M3 §4 head recess assertion PASS] recess_floor_x=42.990 mm (<= 43.0); window_1_w=[-8.550, 15.052] mm (covers [-8.0, +11.0]); window_2_w=[25.897, 41.222] mm (covers [+26.0, +41.0], opens valley edge 39.15 mm)
  ```
- All other eight part GLBs and `axis_fixture.glb` remain byte-identical to `main`.

### ×8 Detailed Engine & Scene Asset Triangle Table

| Scene Component / GLB (`public/models/`) | File Size (Bytes) | Status vs M2 | Per-File / Unit Triangles | Full V8 Instances | V8 Scene Asset Triangles | `InstancedMesh` / Static Draw Calls (Main Pass) |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| `rot_piston_c1_stock.glb` | 145,132 | Unchanged | 4,832 | 8× (`7` std + `1` firing) | 38,656 | **6** (`3` std + `3` firing) |
| `rot_conrod_c1_stock.glb` | 39,900 | Unchanged | 1,180 | 8× | 9,440 | **3** |
| `rot_crankthrow_c1_stock.glb` | 39,984 | **Revised (§3)** | 1,352 (`1,000` throw + `352` pin) | **4×** (1 shared throw / station) | 5,408 | **3** |
| `sta_head_c1_stock.glb` | 110,008 | **Revised (§4)** | 3,532 | 8× | 28,256 | **2** |
| `val_valve_intake_stock.glb` | 92,032 | Unchanged | 4,504 (`1,040` valve + `3,464` spring) | 16× | 72,064 | **3** (`1` valve + `2` spring) |
| `val_valve_exhaust_stock.glb` | 92,044 | Unchanged | 4,504 (`1,040` valve + `3,464` spring) | 16× | 72,064 | **3** (`1` valve + `2` spring) |
| `val_pushrod_stock.glb` | 30,024 | Unchanged | 1,272 (`840` pushrod + `432` lifter) | 16× | 20,352 | **3** (`1` pushrod + `2` lifter) |
| `val_rocker_stock.glb` | 39,116 | Unchanged | 1,240 (`620` intake + `620` exhaust) | 8× (`4` RH + `4` LH chiral) | 9,920 | **8** (`4` RH + `4` X-mirrored LH) |
| `val_bridge_stock.glb` | 14,772 | Unchanged | 408 | 16× | 6,528 | **2** |
| `fuel_injector_c1_stock.glb` | 26,728 | Unchanged | 924 | 8× | 7,392 | **2** |
| **Subtotal — ×8 Detailed GLB Internals** | **629,740 (615.0 KiB)** | — | **23,748** (unique GLB) | **124 part instances** | **270,080** | **35** |
| Turned main crankshaft (`LatheGeometry`, §3) | *(procedural)* | **New (§3)** | 1,080 (`≤ 3,000` cap; `R = 32.4 mm`) | 1× | 1,080 | **1** |
| Studio ground disc (`CircleGeometry`, §7) | *(procedural)* | Retained | 64 | 1× | 64 | **1** *(shadow receiver only)* |
| **Total — Default Scene (Exterior Off)** | — | — | — | — | **271,224** | **37** (`73` incl. shadow pass) |
| Registered exterior (`Duramax_LLY_2005_66L_V8.glb`) | 1,967,296 | Unmodified file | 31,396 *(scene-evaluated; `29,660` raw)* | 1× (`22` merged meshes) | 31,396 | **22** *(no shadow cast/receive)* |
| **Total — Full Scene (Exterior On)** | — | — | — | — | **302,620** | **59** (`95` incl. shadow pass) |

### Renderer Batching Notes
- **Why ×8 internals total `270,080` vs M2's `275,360` extrapolation:** Sharing one crank throw per paired station (`4` throws instead of `8`) saves `4 × 1,352 = 5,408` triangles, while the deeper two-window deck recesses on `sta_head_c1_stock` add `16` triangles per head (`8 × 16 = +128`), yielding `275,360 - 5,408 + 128 = 270,080` triangles. Single-cylinder assembly definition is `34,436` triangles (`≤ 60,000` cap).
- **Proper (`det = +1`) transforms on both banks:** Symmetric bank parts use the right-handed `[meshBasisX, valleyAxisW, boreAxisB]` frame (`det = +1` on both RH and LH). Because forged rockers are chiral (`±60 mm` X-offset tail cups), [`src/renderer/partLoader.ts`](../src/renderer/partLoader.ts) builds dedicated X-mirrored LH rocker geometries once at load time with reversed triangle index winding (`4` additional `InstancedMesh` calls), avoiding negative-determinant instance matrices and inverted backface lighting.
- **Firing highlight:** Rather than mutating shared materials per frame, `engineScene.ts` maintains a 7-instance `pistonStandard` batch and a 1-instance `pistonFiring` batch (`emissive = 0xf97316`, `emissiveIntensity = 0.85`), routing the active firing cylinder's world matrix to `pistonFiring` and the remaining 7 cylinders to `pistonStandard` (`3` extra draw calls, zero per-frame material state churn).

---

## 2. Exterior GLB Registration Record (Spec §5)

Source asset: [`public/Duramax_LLY_2005_66L_V8.glb`](../public/Duramax_LLY_2005_66L_V8.glb) (`1,967,296` bytes, untouched and byte-identical to `main`).

### 2.1 File Parse & Bounds Reconciliation (Raw Mesh Array vs. Scene Graph)

Direct binary glTF inspection reconciles the two triangle/bounds figures noted in Spec §§5 & 11:

| Inspection Method | Primitives / Instances | Triangles | `X_file` Range & Span (m) | `Y_file` Range & Span (m) | `Z_file` Range & Span (m) |
| --- | ---: | ---: | --- | --- | --- |
| **Raw `gltf.meshes` array** *(ignores `node.matrix` & multi-node mesh reuse)* | `234` meshes (`234` prims) | **29,660** | `[-1.3335, +1.2135]` (`2.5470`) | `[-0.7800, +0.9128]` (`1.6928`) | `[-1.1310, +1.3361]` (`2.4671`) |
| **Evaluated `gltf.scene` graph** *(applies `node.matrix` across all `283` mesh nodes — rendered by `GLTFLoader`)* | `283` mesh nodes (`99` mat slots -> `22` unique) | **31,396** | `[-1.3335, +1.2135]` (`2.5470`) | `[-0.7800, +1.0979]` (`1.8779`) | `[-1.1310, +1.6013]` (`2.7323`) |

> **Axis orientation inside `Duramax_LLY_2005_66L_V8.glb`:** Although `X_file` has a wide `2.5470 m` span due to lateral exhaust/intercooler plumbing, geometric inspection of the scene clusters shows that **`Z_file` (`2.7323 m` evaluated span) is the crankshaft longitudinal axis** (`+Z_file` front accessory drive & fan shroud, `-Z_file` rear turbocharger downpipe & flywheel bellhousing), **`X_file` is lateral width** (`-X_file` RH bank `[1,3,5,7]`, `+X_file` LH bank `[2,4,6,8]`), and **`+Y_file` is vertical up** (`-0.7800 m` oil-pan sump to `+1.0979 m` upper intake resonator).

### 2.2 Measured Crank-Axis Endpoints & Line in File Space

Measuring the axisymmetric circular mesh clusters at the longitudinal extremes and through the lower block gallery in evaluated glTF space:

- **Rear flywheel / bellhousing flange cluster (`min Z_file` crank feature):** centered at **`p_rear_file = (0.0000, -0.2600, -0.7825) m`** (rear turbo downpipe extends behind the block to `Z_file = -1.1310 m`).
- **Internal block main-journal & bore-intersection line:** coaxial along **`(X_file = 0.0000, Y_file = -0.2600, Z_file ∈ [-0.6800, +0.8000]) m`**, with the 8-cylinder bank longitudinal midpoint at **`Z_file = +0.0600 m`**.
- **Front harmonic-balancer / crank pulley / fan-hub cluster (`max Z_file` crank feature):** centered at **`p_front_file = (0.0000, -0.2600, +1.3030) m`** (outer cooling fan shroud lip extends to `Z_file = +1.6013 m`).
- **Measured file-space crank axis line:**
  $$\mathbf{p}_{\text{axis,file}}(z_f) = (0.0000,\ -0.2600,\ z_f)\text{ m}, \quad +\hat{\mathbf{z}}_f \text{ toward engine front}, \quad +\hat{\mathbf{y}}_f \text{ up.}$$

### 2.3 Applied Registration Transform (`p_proj = T + s · R · p_file`)

Implemented in [`src/renderer/layout.ts`](../src/renderer/layout.ts) and [`src/renderer/exteriorLoader.ts`](../src/renderer/exteriorLoader.ts):

1. **Proper orthogonal rotation `R` (`det(R) = +1`):**
   $$R = \begin{bmatrix} 0 & 0 & 1 \\ 1 & 0 & 0 \\ 0 & 1 & 0 \end{bmatrix}, \quad R \begin{bmatrix} x_f \\ y_f \\ z_f \end{bmatrix} = \begin{bmatrix} z_f \\ x_f \\ y_f \end{bmatrix}$$
   maps `file +Z` (front) $\to$ `project +X` (front), `file +X` (LH lateral) $\to$ `project +Y` (LH lateral), and `file +Y` (up) $\to$ `project +Z` (up). Equivalent quaternion: `(x = 0.5, y = 0.5, z = 0.5, w = 0.5)`.
2. **Uniform scale (`transformGroup.scale.setScalar(s)` — zero non-uniform scaling):**
   $$s = 0.430$$
   *(Note: while overall outer bounding-box containment allows `s ≥ 0.246`, the exterior model's `2.547 m` file width includes wide lateral charge/exhaust piping whereas the cast valve covers and block skirt sit much tighter around the `V`-banks; `s = 0.430` is the clean uniform scale at which the actual 3D valve-cover, front-cover, and oil-pan surfaces enclose all 8 detailed cylinders' rockers, heads, and crank webs with `≥ 21.4 mm` 3D surface margin everywhere.)*
3. **Project-space translation `T`:**
   $$\mathbf{T} = (+0.2042,\ 0.0000,\ +0.1118)\text{ m} = (+204.20,\ 0.00,\ +111.80)\text{ mm}$$
   derived directly from the measured axis line and bank midpoint:
   - $T_y = -s \cdot X_{\text{crank,file}} = -0.430 \times 0.0000 = 0.0000\text{ m}$
   - $T_z = -s \cdot Y_{\text{crank,file}} = -0.430 \times (-0.2600) = +0.1118\text{ m}$
   - $T_x = X_{\text{blockCenter,proj}} - s \cdot Z_{\text{bankMid,file}} = 0.2300 - 0.430 \times 0.0600 = +0.2042\text{ m}$

**Transform consistency check on crank-axis endpoints (§13.5):**
- Any point $(0, -0.2600, z_f)$ on the file crank axis maps to:
  $$\mathbf{p}_{\text{proj}} = (0.2042, 0, 0.1118) + 0.430 \cdot (z_f, 0, -0.2600) = (0.2042 + 0.430\,z_f,\ 0.0000,\ 0.0000)\text{ m}$$
  which lies **identically on the project X crank axis** $(Y = 0, Z = 0)$ with front toward $+X$.
- Rear flywheel cluster $(0, -0.2600, -0.7825)\text{ m} \mapsto (-132.28,\ 0.00,\ 0.00)\text{ mm}$.
- Bank longitudinal center $(0, -0.2600, +0.0600)\text{ m} \mapsto (+230.00,\ 0.00,\ 0.00)\text{ mm} = \text{exact block midpoint } (2 \times 115\text{ mm})$.
- Front balancer/pulley cluster $(0, -0.2600, +1.3030)\text{ m} \mapsto (+764.49,\ 0.00,\ 0.00)\text{ mm}$.

### 2.4 Registered Project Bounds, Overhang, Material Merge & Containment Checks

| Registration Metric | Spec §5 Requirement | Measured Registered Value (`s = 0.430`) | Status |
| --- | --- | --- | --- |
| Crank axis alignment | Coaxial with `(Y = 0, Z = 0)`, front `+X`, up `+Z` | `(Y_proj = 0.00 mm, Z_proj = 0.00 mm)`, `det(R) = +1` | **PASS** |
| Scaling | Strictly uniform (`s_x = s_y = s_z`) | `s = 0.430` | **PASS** |
| Axial bounds & span `S` | `S ≥ 627 mm`, front `S - A ≥ 480 mm` | `X ∈ [-282.14, +892.75] mm`, **`S = 1,174.89 mm`**, front `+892.75 mm` | **PASS** |
| Rear overhang `A` | `A ∈ [12, S - 480]` (`[12.0, 694.89] mm`) | **`A = 282.14 mm`** (clears rear rockers at `-9.9 mm`) | **PASS** |
| Lateral width & margins | Width `≥ 607 mm`, `≥ 10 mm` margin per side (`±293.4 mm` internals) | `Y ∈ [-573.40, +521.82] mm`, width **`1,095.22 mm`** (`+280.0 / +228.4 mm` box margin) | **PASS** |
| Vertical height & margins | Height `≥ 375 mm`, `≥ 10 mm` margin (`[-62.0, +293.4] mm` internals) | `Z ∈ [-223.60, +583.88] mm`, height **`807.48 mm`** (`+161.6 / +290.5 mm` box margin) | **PASS** |
| Local 3D surface containment | No internal part crosses shell at any `θ ∈ [0°, 720°)` | **`+21.4 mm` minimum 3D surface clearance** to valve covers/block/oil pan | **PASS** |
| Merged mesh count | Deduplicate `99` mat slots $\to$ `22` unique, merge `≤ 24` meshes | **`22` merged `THREE.Mesh` objects**, `castShadow = false`, `receiveShadow = false` | **PASS** |

---

## 3. Runtime `renderer.info`, GPU Memory & Frame-Time Results (Spec §8)

### Measurement Environment
- **Machine:** `Intel(R) Core(TM) Ultra 7 256V` (8 logical processors), `15.7 GiB` RAM, Windows 11 (`win32 10.0.26200` x64)
- **GPU / WebGL Backend:** `ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (8GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)` (WebGL 2)
- **Browser:** Chromium `152.0.7977.167` (`Electron/44.9.1`, Antigravity built-in browser)
- **Workload:** Production build (`npm run build && npm run preview`), continuous animation at **900 RPM (`1×` speed)** after all 10 internal GLBs, the 2k studio HDRI, and the registered exterior GLB finished loading plus a **60-frame warmup**, sampled over **10.0 seconds** via `?benchmark=1`.
- **Viewports Tested:**
  - **Desktop (`Full` profile):** `1440 × 900` CSS px (`devicePixelRatio = 1`, `effectivePixelRatio = 1`), default whole-engine camera framing all 8 cylinders + studio floor shadow.
  - **Phone (`Phone` profile & `Auto` `< 768 px`):** Measured both at `390 × 844` CSS px with simulated HiDPI `devicePixelRatio = 2` (verifying `Auto` selects `Phone` and caps `effectivePixelRatio = 1`, shadow map disabled and disposed) and at `1440 × 900` CSS px (`?quality=phone`) so all 22 exterior meshes stay unculled inside the camera frustum.

### 3.1 Observed `renderer.info` & 10-Second `@ 900 RPM` Frame-Time Matrix

| Metric | `Full` — Exterior **Off** (`1440×900`, Default) | `Full` — Exterior **On** (`1440×900`) | `Phone` — Exterior **Off** (`390×844`, DPR 2$\to$1, `Auto`) | `Phone` — Exterior **Off** (`1440×900`) | `Phone` — Exterior **On** (`390×844`, DPR 2$\to$1) |
| --- | ---: | ---: | ---: | ---: | ---: |
| **Scene asset triangles** | **271,224** | **302,620** | **271,224** | **271,224** | **302,620** |
| **`render.triangles` (submitted/frame)** | **542,384** *(2×271,160 + 64)* | **573,780** *(542,384 + 31,396)* | **271,224** *(1 pass, no shadow)* | **271,224** | **302,284** *(4 tiny ext meshes frustum-culled; `302,620` at `1440×900`)* |
| **`render.calls` (incl. shadow pass)** | **73** *(36 shadow + 37 main)* | **95** *(36 shadow + 59 main)* | **37** *(main pass only)* | **37** | **55** *(`59` when all `22` ext meshes in frustum)* |
| **`render.lines`** | **0** | **0** | **0** | **0** | **0** |
| **`memory.geometries`** | **34** *(32 instanced + shaft + floor)* | **56** *(34 + 22 merged ext)* | **34** | **34** | **52** *(uploaded; `56` total resident)* |
| **`memory.textures` (uploaded to WebGL)** | **4** *(PMREM + shadow + 2 LUTs)* | **8** *(+ 4 exterior maps)* | **2** *(shadow map disposed!)* | **2** | **5** *(PMREM + LUT + exterior maps)* |
| **Resident Texture + HDRI VRAM** *(incl. preloaded exterior maps)* | **27.25 MiB** *(20.75 MiB active)* | **27.25 MiB** | **11.25 MiB** *(4.75 MiB active)* | **11.25 MiB** | **11.25 MiB** |
| **Sampled frames (`~10.01 s`)** | `601` (`10,015.3 ms`) | `600` (`10,015.0 ms`) | `601` (`10,015.9 ms`) | `600` (`10,015.4 ms`) | `601` (`10,015.7 ms`) |
| **Average frame time (`rAF`)** | **16.664 ms (60.01 FPS)** | **16.692 ms (59.91 FPS)** | **16.665 ms (60.01 FPS)** | **16.692 ms (59.91 FPS)** | **16.665 ms (60.01 FPS)** |
| **`p50` / `p95` / `min` / `max` frame time** | `16.7 / 16.8 / 16.1 / 17.0 ms` | `16.7 / 16.9 / 16.1 / 20.1 ms` | `16.7 / 16.9 / 16.0 / 17.2 ms` | `16.7 / 17.0 / 16.1 / 33.5 ms` | `16.7 / 16.9 / 16.1 / 17.3 ms` |
| **Synchronous CPU `update + render`** | **0.631 ms avg** (`1.30 ms` p95) | **1.437 ms avg** (`2.10 ms` p95) | **0.701 ms avg** (`1.30 ms` p95) | **0.990 ms avg** (`1.50 ms` p95) | **1.094 ms avg** (`1.70 ms` p95) |

> **VRAM breakdown note:** `STUDIO_PMREM_AND_LUT` = `4.75 MiB` (source `2048×1024` `.hdr` buffer and `PMREMGenerator` disposed immediately after prefiltering); `2048×2048` shadow target + depth texture = `16.00 MiB` on `Full` (`0 MiB` on `Phone` — both `keyLight.shadow.map.depthTexture` and `keyLight.shadow.map` are disposed when switching to `Phone`); `4` retained exterior PBR textures (`1024×1024` / `512×512` RGBA8 + mipmaps) = `6.50 MiB`. Even counting preloaded exterior textures while hidden, total GPU texture memory is `27.25 MiB` on `Full` and `11.25 MiB` on `Phone`.

### 3.2 Normative Budget Compliance Table (Spec §8 / D-033)

Compliance is evaluated with Exterior **Off** (the default per Spec §8) and additionally verified with Exterior **On** — **both states pass every Desktop and Phone budget**:

| Normative Metric (`M2-MEASUREMENTS.md` §5) | Desktop (`Full`) Budget | Measured `Full` (Ext Off / Ext On) | `Full` Status | `Phone` Budget | Measured `Phone` (Ext Off / Ext On) | `Phone` Status |
| --- | ---: | ---: | :---: | ---: | ---: | :---: |
| **Scene asset triangles** | `≤ 360,000` | `271,224` / `302,620` | **PASS** | `≤ 320,000` | `271,224` / `302,620` | **PASS** |
| **Submitted triangles / frame** | `≤ 700,000` | `542,384` / `573,780` | **PASS** | `≤ 400,000` | `271,224` / `302,284` (`302,620` max) | **PASS** |
| **Draw calls / frame (incl. shadow)** | `≤ 250` | `73` / `95` | **PASS** | `≤ 120` | `37` / `55` (`59` max) | **PASS** |
| **Texture + HDRI GPU memory** | `≤ 64 MiB` | `27.25 MiB` (`20.75 MiB` active) | **PASS** | `≤ 32 MiB` | `11.25 MiB` (`4.75 MiB` active) | **PASS** |
| **Frame time @ 900 RPM whole-engine** | `≤ 16.7 ms` (60 FPS) | **`16.664 ms`** (`0.63 ms` CPU) / `16.692 ms` | **PASS** | `≤ 33.3 ms` (≥ 30 FPS) | **`16.665 ms`** (`0.70 ms` CPU) / `16.665 ms` | **PASS** |

---

## 4. Analytical Clearances & 48-Angle Interference Sweep Report (Spec §11)

### 4.1 Exact Analytical Clearances (`computeLayoutClearancesMm` / `layout.test.ts`)

Computed directly from [`src/config/engineConfig.ts`](../src/config/engineConfig.ts), [`src/config/valveConfig.ts`](../src/config/valveConfig.ts), and [`src/config/detailConfig.ts`](../src/config/detailConfig.ts) across the piston swept band `B ∈ [88.5, 264.5] mm`:

| Clearance Pair | Contact Threshold | Computed Minimum (`layout.ts`) | Surface Margin | Status |
| --- | ---: | ---: | ---: | :---: |
| Intake pushrod center to **own** bore axis (in piston swept band) | `> 55.93 mm` (`51.43 + 4.50`) | **58.47 mm** | `+2.54 mm` | **PASS** |
| Exhaust pushrod center to **own** bore axis (in piston swept band) | `> 55.93 mm` | **60.13 mm** | `+4.20 mm` | **PASS** |
| Intake pushrod center to **neighboring** bore axis (`±115 mm`) | `> 55.93 mm` | **57.11 mm** | `+1.18 mm` | **PASS** |
| Exhaust pushrod center to **neighboring** bore axis (`±115 mm`) | `> 55.93 mm` | **75.17 mm** | `+19.24 mm` | **PASS** |
| Intake lifter center `(56, 36)` to **own** bore axis | `> 63.35 mm` (`51.43 + 11.93`) | **66.57 mm** | `+3.22 mm` *(fixes M2 `-0.42 mm` graze)* | **PASS** |
| Exhaust lifter center `(-35, 55)` to **own** bore axis | `> 63.35 mm` | **65.19 mm** | `+1.84 mm` | **PASS** |
| Intake lifter center to **neighboring** bore axis | `> 63.35 mm` | **69.12 mm** | `+5.76 mm` | **PASS** |
| Exhaust lifter center to **neighboring** bore axis | `> 63.35 mm` | **97.08 mm** | `+33.73 mm` | **PASS** |
| Cross-cylinder pushrods (`station k` intake vs `station k+1` exhaust) | `> 9.00 mm` (`Ø 9 mm` tubes; test `> 25`) | **28.88 mm** | `+19.88 mm` | **PASS** |
| Nearest lifter-to-lifter center spacing along gallery row | `> 23.85 mm` (`Ø 23.85 mm`; test `> 30`) | **30.59 mm** | `+6.74 mm` | **PASS** |
| Rod-to-rod axial gap on shared `58 mm` crankpin (`±14.2 mm` seats, `26.4 mm` big-end) | `> 0.00 mm` | **2.00 mm** (`1.60 mm` end margin) | `+2.00 mm` | **PASS** |
| Crank web outer faces across adjacent stations (`115 - 2 × 47`) | `> 0.00 mm` | **21.00 mm** | `+21.00 mm` | **PASS** |

### 4.2 Live 48-Angle Production-Build Visual Sweep (`0°..705°`, `15°` Step)

Executed on the production bundle (`vite build && vite preview`) at `1440 × 900`, `Full` profile:

1. **Whole-engine 48-step scrub (`θ = 0°, 15°, 30°, …, 705°`, Exterior Off):**
   - **Firing order & orange emissive highlight:** Verified exact `90°` progression across all 48 steps matching `1-2-7-8-4-5-6-3` (`0°..75° → Cyl 1 RH`, `90°..165° → Cyl 2 LH`, `180°..255° → Cyl 7 RH`, `270°..345° → Cyl 8 LH`, `360°..435° → Cyl 4 LH`, `450°..525° → Cyl 5 RH`, `540°..615° → Cyl 6 LH`, `630°..705° → Cyl 3 RH`), with strictly one detailed piston highlighted at every angle and zero M1 primitives remaining.
   - **Shared-pin crank & connecting rods:** All 4 station throws carry paired RH/LH connecting rods smoothly around the shared crankpins without axial overlap, crank-web collision, or rod length distortion, visually tied together by the `32.4 mm`-radius turned main shaft, rear flange, and front pulley disc.
   - **Valvetrain, lifters, pushrods & head deck recesses:** Inspected from oblique (`RF-1`), Cylinder 1 head close-up (`RF-2`, `θ = 470°` peak intake lift), and overhead valley (`RF-4`, `θ = 705°`) views — **zero** pushrod-to-piston contact, **zero** pushrod-to-pushrod contact, **zero** lifter-to-piston or lifter-to-crank-web contact, and clean unobstructed passage of each cylinder's exhaust pushrod (`[+26, +41] mm` gallery notch) and rear neighbor's intake pushrod (`[-8, +11] mm` window) through the revised head deck slabs.
2. **Exterior-on containment sweep (`θ = 0°, 90°, 180° [RF-3], 270°, 360°, 470°, 540°, 705°`, Exterior On):**
   - **Zero** internal geometry (rocker tips, valve bridges, head corners, pushrods, crank webs, or front snout) pokes through the registered exterior shell at any crank angle.
   - Toggling the `Exterior` checkbox during active `900 RPM` playback cleanly shows and hides the merged 22-mesh exterior group without pausing or perturbing `crankAngleDeg`.
3. **Reference-frame inspection (`docs/reference-frames/RF-1.png`..`RF-4.png`):**
   - Inspected all four captured PNGs directly — no visual anomalies, lighting blowouts, shadow clipping, or Z-fighting observed in any frame. *(Note: Antigravity's built-in Chromium webview `page.screenshot()` serializes `1440×900` `16:10` viewports as `1024×640` `16:10` PNGs including the HUD readouts; images are committed unaltered without artificial upscaling.)*

---

## 5. Studio Look Confirmation & Minimal M3 Adjustments (Spec §7 / Decision D-034)

Per **D-024** and **D-034**, the Milestone 2 studio look is **confirmed** at Milestone 3 with all lighting, tone-mapping, environment, material, and backdrop parameters unchanged:

- **HDRI Environment:** Poly Haven CC0 `studio_small_09_2k.hdr` via `RGBELoader` + `PMREMGenerator`, `scene.environmentIntensity = 0.8`, `scene.environmentRotation = (π/2, 0, 0)` (Z-up zenith alignment).
- **Tone Mapping & Output:** `THREE.ACESFilmicToneMapping`, `toneMappingExposure = 1.1`, `THREE.SRGBColorSpace`.
- **Backdrop, Fog & Floor Material:** `scene.background = 0x0b0b0d`, `THREE.FogExp2(0x0b0b0d, 0.11)`, `CircleGeometry(18, 64)` matte floor (`color = 0x0d0e12`, `roughness = 0.95`, `metalness = 0.0`, `envMapIntensity = 0.12`).
- **Directional Key Light:** `DirectionalLight(0xffffff, 1.35)` at `(centerXM + 0.55, -0.45, 1.35)` with `2048×2048` shadow map (`bias = -0.0003`, `normalBias = 0.002`, `radius = 3.5`; enabled on `Full`, disabled and disposed on `Phone`).

### Minimal Geometry-Driven M3 Framing & Shadow-Bounds Adjustments Recorded Under D-034

Expanding from Cylinder 1 alone to all 8 detailed cylinders plus the registered exterior shell required three minimal spatial-envelope adjustments in [`src/renderer/engineScene.ts`](../src/renderer/engineScene.ts) (zero color, exposure, HDRI, or material changes):

| Parameter (`src/renderer/engineScene.ts`) | M2 Value (Single Cylinder) | Confirmed M3 Value (Full V8 + Exterior) | Reason |
| --- | --- | --- | --- |
| `groundMesh.position.z` | `-0.095 m` | **`-0.245 m`** | Clears the registered exterior oil-pan sump (`Z_min = -0.2236 m`) by `21.4 mm` so the floor plane never slices the lower oil pan when `Exterior` is toggled on. |
| `keyLight.shadow.camera` (`left/right/top/bottom`, `far`, `target`) | `±0.55 m`, `far = 2.6 m`, `target = (centerXM, 0, 0)` | **`±0.65 m`, `far = 2.8 m`, `target = (centerXM + 0.05, -0.05, 0.08)`** | Prevents directional shadow frustum clipping at the rear cylinders (`7 & 8`) and onto the lowered `Z = -0.245 m` studio floor. |
| Default `camera.position` / `controls.target` (`minDistance` / `maxDistance`) | `(centerXM + 0.72, -0.68, 0.52)` / `(centerXM + 0.04, -0.02, 0.13)` (`0.22` / `4.0`) | **`(centerXM + 0.78, -0.78, 0.56)` / `(centerXM + 0.02, -0.01, 0.12)` (`0.18` / `4.5`)** | Frames all 8 detailed cylinders (`RF-1`) and allows closer head inspection (`0.18 m`) and wider exterior pull-back (`4.5 m`). |
