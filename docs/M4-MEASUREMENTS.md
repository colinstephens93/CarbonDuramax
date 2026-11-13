# Milestone 4 Measurements, View-State Budget Re-Verification, Shadow Check & Label Anchors

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) v2.2 (Milestone 4) · Decisions: D-004, D-005, D-007, D-024, D-033, D-034 · Spec: [`docs/specs/M4-views.md`](./specs/M4-views.md) · Normative budgets: [`docs/M2-MEASUREMENTS.md`](./M2-MEASUREMENTS.md) §5 · Prior measurements: [`docs/M3-MEASUREMENTS.md`](./M3-MEASUREMENTS.md) · Reference frames: [`docs/REFERENCE_FRAMES.md`](./REFERENCE_FRAMES.md)

---

## 1. Geometry & Draw-Call Footprint Summary

Milestone 4 is strictly renderer and UI work (`src/renderer/viewLayout.ts`, `src/renderer/engineScene.ts`, `src/ui/engineControls.ts`, `src/main.ts`, `index.html`):
- **Zero GLB or procedural geometry additions:** Scene asset triangles remain identical to Milestone 3 (`270,080` instanced internal GLB triangles + `1,080` turned main crankshaft + `64` studio ground disc = **`271,224`** default exterior-off triangles; `+ 31,396` registered exterior shell = **`302,620`** full scene triangles).
- **Zero 3D label geometry:** All 23 labels (`15` part callouts + `8` cylinder badges) are reused HTML `<div>` chips inside `#labels-layer` (`z-index: 10`), projected per frame on the CPU via `scene.projectLabelAnchors(viewportWidthPx, viewportHeightPx)` with zero WebGL draw calls or GPU texture uploads.
- **Cutaway & X-Ray draw accounting:**
  - Local clipping (`renderer.localClippingEnabled = true`, `material.clipShadows = true`) adds **0** draw calls (`73` calls on `Full` exterior-off, `37` calls on `Phone` exterior-off — identical to M3).
  - Enabling `X-Ray` (`transparent = true, opacity = 0.22, depthWrite = false` across all `22` merged exterior meshes) adds **`+1` draw call** (`96` vs M3's opaque `95`, well within Spec §8's `±5` tolerance) and **`+64` submitted triangles** (`573,844` vs `573,780`) because one `64`-triangle merged exterior material is authored with `THREE.DoubleSide`, which `three@0.187.0` renders in two passes (back faces then front faces) when `transparent === true`.

---

## 2. Runtime `renderer.info`, GPU Memory & Frame-Time Re-Verification (Spec §8)

### 2.1 Measurement Environment & State-Setting Surface

- **Machine:** `Intel(R) Core(TM) Ultra 7 256V` (8 logical processors), `15.7 GiB` RAM, Windows 11 (`win32 10.0.26200` x64)
- **GPU / WebGL Backend:** `ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (8GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)` (WebGL 2)
- **Browser:** Chromium `152.0.7977.167` (`Electron/44.9.1`, Antigravity built-in browser)
- **Workload:** Production build (`npm run build && npm run preview`), continuous animation at **900 RPM (`1×` speed)** after all 10 internal GLBs, the 2k studio HDRI, and the registered exterior GLB finished loading plus a **60-frame warmup**, sampled over **10.0 seconds** (`601` frames). Synchronous CPU timing (`avgCpuRenderMs` / `p95CpuRenderMs`) spans `scene.update(state)` **plus** per-frame `projectLabelAnchors` + `#labels-layer` DOM updates whenever `labels=1`.
- **Reproducible URL Parameters (`?benchmark=1`):**
  1. **`Full` — Defaults (`1440×900`, DPR `1`):** `?benchmark=1&quality=full&exterior=0`
  2. **`Full` — Heaviest View State (`1440×900`, DPR `1`, Spec §8(b)):** `?benchmark=1&quality=full&exterior=1&xray=1&explode=100&labels=1&section=x&sectionPos=375` *(explode `100%`, labels `On`, Section Front–Back active at exact slider midpoint `375 mm`, exterior + X-Ray `On`)*
  3. **`Full` — Heaviest Views, Exterior Off (`1440×900`, DPR `1`):** `?benchmark=1&quality=full&exterior=0&xray=0&explode=100&labels=1&section=x&sectionPos=375`
  4. **`Phone` — Defaults (`390×844`, `Auto` $\to$ `phone`, `effectivePixelRatio = 1`):** `?benchmark=1&exterior=0`
  5. **`Phone` — Heaviest View State, Exterior Off (`390×844`, `Auto` $\to$ `phone`, Spec §8(b)):** `?benchmark=1&exterior=0&xray=0&explode=100&labels=1&section=x&sectionPos=375`
  6. **`Phone` — Heaviest View State + Exterior/X-Ray On (`390×844`, `Auto` $\to$ `phone`):** `?benchmark=1&exterior=1&xray=1&explode=100&labels=1&section=x&sectionPos=375`

### 2.2 Observed `renderer.info` & 10-Second `@ 900 RPM` Telemetry Matrix

| Metric | `Full` Defaults (`1440×900`, Ext Off) | `Full` Heaviest (`1440×900`, Ext+X-Ray, `e=1`, Labels, Sec X `375`) | `Full` Heaviest Views (`1440×900`, Ext Off, `e=1`, Labels, Sec X `375`) | `Phone` Defaults (`390×844`, `Auto`, Ext Off) | `Phone` Heaviest (`390×844`, `Auto`, Ext Off, `e=1`, Labels, Sec X `375`) | `Phone` Heaviest + Ext/X-Ray (`390×844`, `Auto`) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Scene asset triangles** | **271,224** | **302,620** | **271,224** | **271,224** | **271,224** | **302,620** |
| **`render.triangles` (submitted/frame)** | **542,384** | **573,844** *(+64 2-pass DoubleSide)* | **542,384** | **271,224** | **271,224** | **302,284** *(4 tiny ext meshes frustum-culled)* |
| **`render.calls` (incl. shadow pass)** | **73** *(M3: 73)* | **96** *(M3 Ext On: 95; +1)* | **73** *(M3: 73)* | **37** *(M3: 37)* | **37** *(M3: 37)* | **55** *(M3 Ext On: 55)* |
| **`render.lines`** | **0** | **0** | **0** | **0** | **0** | **0** |
| **`memory.geometries`** | **34** | **56** | **34** | **34** | **34** | **52** *(`56` total resident)* |
| **`memory.textures` (uploaded to WebGL)** | **4** | **8** | **4** | **2** *(shadow map disposed)* | **2** *(shadow map disposed)* | **5** |
| **Resident Texture + HDRI VRAM** | **27.25 MiB** *(20.75 MiB active)* | **27.25 MiB** | **27.25 MiB** | **11.25 MiB** *(4.75 MiB active)* | **11.25 MiB** | **11.25 MiB** |
| **Sampled frames (`~10.02 s`)** | `601` (`10,015.2 ms`) | `601` (`10,015.5 ms`) | `601` (`10,015.5 ms`) | `601` (`10,015.5 ms`) | `601` (`10,015.3 ms`) | `601` (`10,015.7 ms`) |
| **Average frame time (`rAF`)** | **16.664 ms (60.01 FPS)** | **16.665 ms (60.01 FPS)** | **16.665 ms (60.01 FPS)** | **16.665 ms (60.01 FPS)** | **16.664 ms (60.01 FPS)** | **16.665 ms (60.01 FPS)** |
| **`p50` / `p95` / `min` / `max` frame time** | `16.7 / 17.1 / 16.0 / 17.3 ms` | `16.7 / 17.0 / 16.1 / 17.2 ms` | `16.7 / 16.9 / 16.1 / 17.2 ms` | `16.7 / 16.9 / 16.1 / 17.4 ms` | `16.7 / 17.0 / 16.0 / 17.4 ms` | `16.7 / 17.0 / 16.0 / 17.2 ms` |
| **Sync CPU `update + render (+ labels)`** | **1.058 ms avg** (`1.60 ms` p95) | **1.550 ms avg** (`2.10 ms` p95) | **1.290 ms avg** (`1.80 ms` p95) | **0.626 ms avg** (`0.90 ms` p95) | **1.022 ms avg** (`1.50 ms` p95) | **1.026 ms avg** (`1.60 ms` p95) |

### 2.3 Normative Budget Compliance Table (Spec §8 / D-033)

Both `Full` and `Phone` profiles pass every normative D-033 budget at defaults **and** in the heaviest view state, with draw calls matching M3 within `0` to `+1` (`±5` tolerance) and locked `60.01 FPS` (`~16.665 ms`) frame times across all runs:

| Normative Metric (`M2-MEASUREMENTS.md` §5) | Desktop (`Full`) Budget | Measured `Full` (Defaults / Heaviest) | `Full` Status | `Phone` Budget | Measured `Phone` (Defaults / Heaviest Ext Off / Heaviest + X-Ray) | `Phone` Status |
| --- | ---: | ---: | :---: | ---: | ---: | :---: |
| **Scene asset triangles** | `≤ 360,000` | `271,224` / `302,620` | **PASS** | `≤ 320,000` | `271,224` / `271,224` / `302,620` | **PASS** |
| **Submitted triangles / frame** | `≤ 700,000` | `542,384` / `573,844` | **PASS** | `≤ 400,000` | `271,224` / `271,224` / `302,284` (`302,620` max) | **PASS** |
| **Draw calls / frame (incl. shadow)** | `≤ 250` | `73` / `96` (`73` Ext Off) | **PASS** | `≤ 120` | `37` / `37` / `55` (`59` max) | **PASS** |
| **Texture + HDRI GPU memory** | `≤ 64 MiB` | `27.25 MiB` (`20.75 MiB` active) | **PASS** | `≤ 32 MiB` | `11.25 MiB` (`4.75 MiB` active) | **PASS** |
| **Frame time @ 900 RPM whole-engine** | `≤ 16.7 ms` (60 FPS) | **`16.664 ms`** / **`16.665 ms`** | **PASS** | `≤ 33.3 ms` (≥ 30 FPS) | **`16.665 ms`** / **`16.664 ms`** / **`16.665 ms`** | **PASS** |

---

## 3. Shadow Frustum Check at Full Explode (`e = 1`, Spec §8)

At `e = 1.0` (`Explode = 100%`), paired cylinder stations spread axially by `1.8×` about `X = 230 mm` (`{-80.5, +126.5, +333.5, +540.5} mm`, adding `276 mm` to total station span) and all 8 cylinder-head groups lift `+110 mm` outward along each bank's `±45°` bore axis `B`, expanding the internal assembly envelope to `X ∈ [-0.145, +0.605] m`, `Y ∈ [-0.380, +0.380] m`, `Z ∈ [-0.070, +0.380] m`.

- **Analytical light-space check:** Evaluating M3's directional key-light shadow camera (`position = [0.78, -0.45, 1.35] m`, `target = [0.28, -0.05, 0.08] m`, orthographic bounds `left/right/top/bottom = ±0.65 m`, `near = 0.3 m`, `far = 2.8 m`) across both the full `e = 1` 3D part envelope and its projected shadow footprint on the `Z = -0.245 m` studio floor yields:
  - `x_light ∈ [-0.505, +0.357] m` (`≥ 145 mm` inside `±0.65 m`)
  - `y_light ∈ [-0.400, +0.525] m` (`≥ 125 mm` inside `±0.65 m`)
  - `z_depth ∈ [0.947, 2.125] m` (`≥ 647 mm` inside `[0.300, 2.800] m`)
- **Visual confirmation (`RF-5`):** Direct inspection of [`docs/reference-frames/RF-5.png`](./reference-frames/RF-5.png) (`θ = 90°`, `Explode = 100%`) confirms that floor shadows beneath both longitudinal end stations (`Cyls 1 & 2` at `+540.5 mm` and `Cyls 7 & 8` at `-80.5 mm`) and beneath all 8 lifted cylinder heads resolve cleanly with soft `PCFSoftShadowMap` penumbrae and **zero** frustum clipping.
- **Outcome:** M3's `±0.65 m` (`far = 2.8 m`) key-light shadow frustum already covers `e = 1` with `≥ 125 mm` margin on every side; **no D-034 shadow-camera adjustment was required**.

---

## 4. Explode Kinematics & Pushrod Stretch Verification (Spec §§3, 10, 11)

Verified automatically in [`src/renderer/viewLayout.test.ts`](../src/renderer/viewLayout.test.ts) from [`src/renderer/layout.ts`](../src/renderer/layout.ts):

| Quantity | At `e = 0` (`0%`) | At `e = 1` (`100%`) | Spec Requirement / Bound | Status |
| --- | ---: | ---: | --- | :---: |
| Station centers `X` (`stations 3, 2, 1, 0`) | `{57.5, 172.5, 287.5, 402.5} mm` | **`{-80.5, 126.5, 333.5, 540.5} mm`** | `230 + (X - 230) · (1 + 0.8e)` (`0` at `e = 0`) | **PASS** |
| Head-group bore lift (`headLift`) | `0.00 mm` | **`110.00 mm`** | `110 · e` (`0` at `e = 0`) | **PASS** |
| Lifter-group bore lift (`lifterLift`) | `0.00 mm` | **`55.00 mm`** | `55 · e` (`0` at `e = 0`) | **PASS** |
| Connecting-rod length (`center-to-center`) | `208.00 mm` | **`208.00 mm`** | Rigid (`pinSeatX` & `wristAimX` share station spread) | **PASS** |
| Intake pushrod length (`rest`, `0°` lift) | `252.63 mm` | **`306.51 mm` (`+21.33%`)** | `> 0%` and `≤ 25%` | **PASS** |
| Exhaust pushrod length (`rest`, `0°` lift) | `250.44 mm` | **`304.67 mm` (`+21.65%`)** | `> 0%` and `≤ 25%` | **PASS** |

---

## 5. Registered Exterior Shell Label Anchor Coordinates (Spec §6)

Evaluated directly from the scene graph of [`public/Duramax_LLY_2005_66L_V8.glb`](../public/Duramax_LLY_2005_66L_V8.glb) under Milestone 3's registration transform (`p_proj = T + s · R · p_file` with `s = 0.430`, `R: (x_f, y_f, z_f) -> (z_f, x_f, y_f)`, `T = [+0.2042, 0.0000, +0.1118] m`) and stored in [`src/renderer/viewLayout.ts`](../src/renderer/viewLayout.ts) (`EXTERIOR_SHELL_LABEL_ANCHORS_MM`):

| Label ID | Display Text | Project Anchor `[X, Y, Z]` (mm) | Scene Anchor `[X, Y, Z]` (m) | Source glTF Sub-Assembly & Registered Feature Envelope (mm) |
| --- | --- | --- | --- | --- |
| `turbocharger` | **Turbocharger** | **`[-60.0, 0.0, +435.0]`** | `[-0.0600, 0.0000, +0.4350]` | Upper centerline of the rear V-valley turbocharger housing (`Duramax_LLY_2005_66L_V8/turbo/node_161`, registered bounds `X ∈ [-149.3, +36.5]`, `Y ∈ [-116.0, +135.4]`, `Z ∈ [+278.4, +510.2] mm`) |
| `harmonic-balancer` | **Harmonic balancer** | **`[+760.6, 0.0, -43.0]`** | `[+0.7606, 0.0000, -0.0430]` | Front hub face center of the crankshaft damper / pulley (`Duramax_LLY_2005_66L_V8/beltDrive/node_272/node_267`, registered bounds `X ∈ [+722.4, +764.5]`, `Y ∈ [-92.2, +92.2]`, `Z ∈ [-135.2, +49.2] mm`) |
| `oil-pan` | **Oil pan** | **`[+135.4, 0.0, -172.0]`** | `[+0.1354, 0.0000, -0.1720]` | Geometric center of the lower deep oil-pan sump (`Duramax_LLY_2005_66L_V8/blockPan/node_30/node_27`, registered bounds `X ∈ [-19.4, +290.2]`, `Y ∈ [-133.3, +133.3]`, `Z ∈ [-223.6, -120.4] mm`, clearing the `Z = -245.0 mm` floor) |

All three exterior anchors sit on the engine centerline (`Y = 0`), remain fixed in project space (unaffected by `Explode`), hide automatically whenever the exterior shell is hidden (`!exteriorVisible && !xrayEnabled`) or when clipped by an active `Front–Back (X)` / `Side (Y)` section plane, and appear alongside internal part labels when `X-Ray` is active.
