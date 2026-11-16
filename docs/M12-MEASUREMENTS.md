# Milestone 12 — Intake Manifold Cover Measurements

Project: Duramax LLY Engine Lab · Governing spec: [`docs/specs/M12-intake-cover.md`](./specs/M12-intake-cover.md) · Part record: [`docs/M12-COVER.md`](./M12-COVER.md) · Prior baselines: [`docs/M11-MEASUREMENTS.md`](./M11-MEASUREMENTS.md), [`docs/M10-MEASUREMENTS.md`](./M10-MEASUREMENTS.md), [`docs/M9-MEASUREMENTS.md`](./M9-MEASUREMENTS.md)

---

## 1. Production Bundle, Page-Weight Delta & Gate Summary (Spec §§7.4, 9, 11.2, 13.2)

- **Node / Toolchain:** Node `v24.16.0`, TypeScript `tsc --noEmit` (`0` errors), Vitest `v3.2.7` (**`21` test files, `104 / 104` tests passing** — `95` prior tests + `9` new tests in `src/renderer/intakeCover.test.ts`; strictly `1` new + `3` edited test files touched per Spec §9 / §13.2), Vite `v7.3.8` (`41` modules transformed), headless Blender `5.2.3 LTS` (`e13b728c6880`).
- **Shipped Production Bundle (`npm run build`):**
  - `dist/index.html`: **`1,444 B`** / `1.44 kB` (`638 B` / `0.64 kB` gzip)
  - `dist/assets/index-ul-6Egty.js`: **`824,326 B`** / **`824.33 kB`** (**`220,660 B`** / **`220.66 kB` Vite default gzip**; `219,929 B` level-9 gzip) — `+3,202 B` minified (`+3.20 kB`) / `+0.99 kB` gzip over `main`'s `dist/assets/index-zHhTPqQm.js` (`821,124 B` / `821.12 kB` minified, `219.67 kB` gzip), with `0` new npm dependencies.
- **Cover Asset File Size & Page-Weight Delta (Spec §§7.4, 11.2, 13.5):**
  - `public/models/intake_cover_lly.glb`: **`46,080 B`** (`45.00 KiB` — `70.31 %` of the `65,536 B` / `64.00 KiB` cap; `19,456 B` headroom).
  - **Raw startup page-weight delta vs M9 baseline (`10,050,510 B`, `docs/M9-MEASUREMENTS.md` §1.2):** **`+46,080 B` = `+0.4585 %`** for the cover GLB (`≤ +0.6521 %` cap-conservative ceiling at `65,536 B`), and `+49,282 B` = `+0.4903 %` including the `+3,202 B` minified JS delta.

---

## 2. Cover Asset Build Log & Binary Read-Back Audit (Spec §§2.2–2.5, 4.1–4.4, 9, 13.3)

### 2.1 Asset Identity & Mesh / Material Summary

Built deterministically via `blender --background --factory-startup --python assets-src/blender/build_intake_cover.py` reading `assets-src/cover_dimensions.json`, and verified by binary GLB read-back (`src/renderer/intakeCover.test.ts` Tests 1, 2, 6, 11):

| Property | Spec Contract / Cap | Measured `public/models/intake_cover_lly.glb` | Verdict |
| --- | --- | --- | :---: |
| File size | `≤ 65,536 B` (`64.00 KiB`) | **`46,080 B`** (`45.00 KiB`) | **PASS** |
| SHA-256 | Recorded | `a66a7a82ecbd19061d33058facf01f5ce75af88b25a253cfb8ec85384d64b7f0` | Recorded |
| Root node | `1` Group `intake_cover_lly` | `1` Group `intake_cover_lly` (Y-up glTF export) | **PASS** |
| `ext_intake_cover_body` | `≤ 1,200` indexed tris (`POSITION` + `NORMAL`) | **`500` triangles** (`256` vertices) | **PASS** |
| `ext_intake_cover_lettering` | **`540` tris exact** (`45 × 12`, cap `≤ 600`) | **`540` triangles** (`360` vertices) | **PASS** |
| Total asset triangles | `≤ 1,800` | **`1,040` triangles** (`760` tris below cap) | **PASS** |
| `mat_cover_plastic` | `MeshStandardMaterial`, `[0.028, 0.029, 0.032]`, rough `0.62`, metal `0.00`, `DoubleSide` | `[0.028, 0.029, 0.032, 1.0]`, rough `0.62`, metal `0.00`, `doubleSided: true` | **PASS** |
| `mat_cover_letter` | `MeshStandardMaterial`, `[0.032, 0.033, 0.036]`, rough `0.38`, metal `0.00`, `DoubleSide` | `[0.032, 0.033, 0.036, 1.0]`, rough `0.38`, metal `0.00`, `doubleSided: true` | **PASS** |
| Images / textures / UVs / skins / morphs / animations | `0` across all six categories | **`0 / 0 / 0 / 0 / 0 / 0`** (`0 B` texture VRAM) | **PASS** |
| Fabricated `DURAMAX` string | Absent from all node/mesh/material names & legend | **`0` occurrences**; legend is `['6.6', 'TURBO', 'DIESEL']` | **PASS** |

### 2.2 Project-Frame Bounds, Key Elevations & Empty Markers

Transformed from glTF Y-up metres to project millimetres via `p_mm = (1000·g_x, −1000·g_z, 1000·g_y)`:

| Feature / Marker | Spec Target (mm) | Measured Value (mm) | Deviation | Verdict |
| --- | --- | --- | ---: | :---: |
| Overall X / Y / Z bounds | `X [245.0, 400.0]`, `Y [−120.0, 120.0]`, `Z [333.4, 418.0]` | `X [245.000, 400.000]`, `Y [−120.000, 120.000]`, `Z [333.400, 418.000]` | `0.000 mm` | **PASS** |
| Body bottom rim (`Z`) | `370.0 ± 0.1` | **`370.000`** (`2.5 mm` ring wall, open interior cavity) | `0.000 mm` | **PASS** |
| Body top pad (`Z`) | `417.2 ± 0.1` | **`417.200`** (`47.200 mm` body height) | `0.000 mm` | **PASS** |
| Letter top (`Z`) | `418.0 ± 0.1` | **`418.000`** (`0.800 mm` relief above `417.200` pad) | `0.000 mm` | **PASS** |
| Rear boss bottom (`Z`) | `333.4 ± 0.1` | **`333.400`** (`0.6916 mm` from Y-bridge `(260.690, 0.000, 333.356)` under `r = 7.5 mm` pad) | `0.000 mm` | **PASS** |
| Front mount bottom (`Z`) | `353.4 ± 0.1` | **`353.400`** (`0.3672 mm` from cold pipe `(371.634, −95.400, 353.367)` under `r = 5.0 mm` pad) | `0.000 mm` | **PASS** |
| `if_intake_cover_rear_bolt` | `(260.0, 0.0, 333.4) ± 0.5`, local `+Z = (0, 0, 1)` | `(260.000, 0.000, 333.400)`, identity rotation (`+Z = (0, 0, 1)`) | `0.0000 mm` | **PASS** |
| `if_intake_cover_duct_clamp` | `(372.0, −95.4, 353.4) ± 0.5`, local `+Z = (0, 0, 1)` | `(372.000, −95.400, 353.400)`, identity rotation (`+Z = (0, 0, 1)`) | `0.0000 mm` | **PASS** |

### 2.3 Watertightness & Connected-Component Audit (`1e-5 m` Position Weld)

| Mesh Leaf | Boundary Edges (`deg = 1`) | Non-Manifold Edges (`deg > 2`) | Connected Closed Components | Component Breakdown | Verdict |
| --- | ---: | ---: | ---: | --- | :---: |
| `ext_intake_cover_body` | **`0`** | **`0`** | **`3`** *(pinned exact)* | `1` thin-walled `2.5 mm` shell (open underside) + `1` rear M8 boss + `1` simplified front mount leg | **PASS** |
| `ext_intake_cover_lettering` | **`0`** | **`0`** | **`45`** *(pinned exact)* | `6.6` (`4 + 1 + 4 = 9`) + `TURBO` (`2 + 3 + 4 + 5 + 4 = 18`) + `DIESEL` (`4 + 1 + 4 + 3 + 4 + 2 = 18`) closed `12`-tri prisms | **PASS** |

---

## 3. Shell & M8 Variant Clearance Audit (Spec §§4.5, 6.6, 9 Tests 3–4, 13.4)

### 3.1 Frozen Exterior Shell (`public/Duramax_LLY_2005_66L_V8.glb`, `37,100` Tris, `22` Groups)

Evaluated across every vertex of all `22` shell groups against the cover body envelope (planform `P1`…`P6` = `(400, −120), (400, 120), (245, 120), (245, −82), (312, −82), (348, −120)` mm, `Z ∈ [370.0, 417.2]` mm):

- **Shell vertices strictly inside cover body envelope:** **`0`**
- **Shell vertices above cover top (`Z > 417.2 mm`) inside planform:** **`0`**
- **`chargePipeCold` group max-Z check:** `(348.544, −140.375, 369.078) mm` lies **outside** the rear-right relief edge `P5→P6` (`0.922 mm` vertical gap below `Z = 370.0 mm`).

| Shell Group | Spec Floor (mm) | Measured Min Clearance (mm) | Nearest Shell Vertex `(X, Y, Z)` (mm) | Notes | Verdict |
| --- | ---: | ---: | --- | --- | :---: |
| `chargePipeCold` | `≥ 5.0` | **`5.172`** | `(342.338, −99.358, 364.828)` | Highest cold-pipe vertex under cover footprint (`369.078` group max is outside relief) | **PASS** |
| `alternator` | `≥ 8.0` | **`8.084`** | `(404.600, −124.509, 365.116)` | Clears RH front corner `(400, −120)` | **PASS** |
| `acComp` *(P/S pump)* | `≥ 8.0` | **`8.246`** | `(376.000, 128.000, 368.000)` | Clears LH side skirt `Y = +120.0` | **PASS** |
| `resonator` | `≥ 8.5` | **`8.793`** | `(236.207, 22.301, 387.112)` | Group max `X = 236.546 mm` (`8.454 mm` X gap to `X = 245.0` rear wall) | **PASS** |
| `intakeBridge` | `≥ 18.0` | **`18.046`** | `(319.256, 8.000, 351.954)` | Y-bridge MAP boss clears `Z = 370.0` underside; rear bolt contacts at `333.356` | **PASS** |
| `electronics` *(loom)* | `≥ 25.9` | **`25.908`** | `(249.485, 91.198, 344.092)` | Under-footprint harness obstacle (`25.908 mm` below `Z = 370.0`) | **PASS** |
| `intake` *(stock duct)* | `≥ 48.0` | **`48.049`** | `(302.417, −152.731, 447.666)` | Clears rear-right relief corridor | **PASS** |
| `cp3Fuel` | `≥ 67.0` | **`67.070`** | `(291.579, 165.219, 320.467)` | LH valley / fuel hardware below and outboard | **PASS** |
| **Remaining `14` groups min (`beltDrive` argmin)** | `≥ 73.4` (`beltDrive`) | **`73.407`** | `(472.000, 134.305, 414.156)` | Remaining `14`: `beltDrive` `73.407`, `boostPipe` `73.740`, `egrSystem` `83.346`, `oilFill` `91.762`, `fuelFilter` `92.754`, `heads` `115.367`, `valveCovers` `115.794`, `frontCover` `124.085`, `injectors` `126.918`, `blockPan` `128.494`, `turbo` `195.807`, `exhaustManifolds` `254.527`, `liftBracket` `267.196`, `dipstick` `304.200` | **PASS** |

### 3.2 M8 Aftermarket Variant Compatibility (Spec §§6.6, 15.6, 15.9)

| Variant (`id`) | Method | Spec Floor | Measured Separation / Clearance | Compatibility Rule Needed? | Verdict |
| --- | --- | ---: | ---: | :---: | :---: |
| **V2 `intake_highflow`** (coupler `r = 58.0 mm`) | `4,001` samples/seg on frozen `P0`…`P8` centreline (`min = 64.567 mm`) | `≥ 6.0 mm` | **`6.567 mm`** | No | **PASS** |
| **V2 `intake_highflow`** (tube `r = 50.8 mm`) | Same `4,001`-sample sweep (`64.567 − 50.8`) | `≥ 13.0 mm` | **`13.767 mm`** | No | **PASS** |
| **V1 `turbo_large`** | Conservative X-envelope gap (`245.0 − 47.12`, `docs/M8-MEASUREMENTS.md:13`) | Positive | **`197.88 mm`** | No | **PASS** |
| **V3 `exhaust_4in`** | Conservative X-envelope gap (`245.0 − (−113.80)`, `docs/M8-MEASUREMENTS.md:15`) | Positive | **`358.80 mm`** | No | **PASS** |
| **V4 `intercooler_upgraded`** | Conservative Y-envelope gap (`472.68 − 120.0`, `docs/M8-MEASUREMENTS.md:16`) | Positive | **`352.68 mm`** | No | **PASS** |
| **V5 `pistons_lowcomp`** | Internal rotating assembly (`Z ≤ 210 mm`, inside block bores) | Disjoint | Disjoint | No | **PASS** |

---

## 4. Runtime `?benchmark=1` Matrix, Section-Cap Counts & D-033 Verdict (Spec §§7.1–7.5, 13.5)

### 4.1 Measurement Environment & Protocol
- **Host / GPU:** `Intel(R) Core(TM) Ultra 7 256V`, Windows 11 x64 · `ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (8GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)` (WebGL 2)
- **Browser / Server:** Built-in Chromium `152.0.7977.167` webview (`devicePixelRatio = 1`) · `npx vite preview --port 4173 --strictPort`
- **Protocol:** `60`-frame warmup after `detailedLoaded && hdriLoaded && exteriorLoaded && variantsLoaded && intakeCoverLoaded`, followed by `10.0 s` (`601` frames) at `900 RPM` (`1×`). Worst-case 5-variant rows pass `&variants=turbo_large,intake_highflow,exhaust_4in,intercooler_upgraded,pistons_lowcomp`.

### 4.2 Desktop (`1440×900`, `Full` Tier, `VRAM = 20.75 MiB`, `4` Textures, M11 §3.2 Baseline `p95 = 16.8 ms`)

| Metric | Stock · `cover=0` | Stock · `cover=1` | 5-Var · `cover=0` | 5-Var · `cover=1` | Stock · `cover=1` · `X @ 300` |
| --- | ---: | ---: | ---: | ---: | ---: |
| `visibleSceneTriangles` | `308,324` | **`309,364`** (`+1,040`) | `304,632` | **`305,672`** (`+1,040`) | **`309,364`** (`+1,040`) |
| Desktop scene headroom (`360,000 − tris`) | `51,676` (`14.35 %`) | **`50,636` (`14.07 %`)** | `55,368` (`15.38 %`) | **`54,328` (`15.09 %`)** | **`50,636` (`14.07 %`)** |
| `triangles` (submitted / frame) | `579,484` | **`580,524`** (`+1,040`) | `568,880` | **`569,920`** (`+1,040`) | **`583,626`** (`580,524 + 3,102`) |
| `calls` (draw calls / frame) | `96` | **`98`** (`+2`) | `97` | **`99`** (`+2`) | **`100`** (`98 + 2` cap) |
| `sectionCapTriangles` (cover share) | `0` | `0` | `0` | `0` | **`3,102`** (**`+28` cover**, `3,074` rest) |
| `sectionCapStaticMs` / `DynamicMs` | `0 / 0` | `0 / 0` | `0 / 0` | `0 / 0` | `6.2 / 1.7 ms` |
| `openChains / closed / dropped / hullOnly` | `0 / 0 / 0 / 0` | `0 / 0 / 0 / 0` | `0 / 0 / 0 / 0` | `0 / 0 / 0 / 0` | `4 / 4 / 0 / 2` |
| `frameCount` (`elapsedMs`) | `601` (`10,014.6`) | `601` (`10,014.7`) | `601` (`10,014.7`) | `601` (`10,014.2`) | `601` (`10,012.9`) |
| `avgFrameTimeMs` (`avgFps`) | `16.663` (`60.01`) | `16.663` (`60.01`) | `16.663` (`60.01`) | `16.663` (`60.01`) | `16.660` (`60.02`) |
| **`p50 / p95 / min / max` (ms)** | **`16.7 / 17.0 / 14.6 / 17.2`** | **`16.7 / 16.9 / 14.3 / 17.1`** | **`16.7 / 16.8 / 14.8 / 17.2`** | **`16.7 / 16.9 / 14.2 / 17.2`** | **`16.7 / 16.9 / 13.0 / 17.2`** |
| **`p95` Δ vs M11 §3.2 (`16.8 ms`)** | `+0.20 ms` (`≤ +0.30`) | **`+0.10 ms`** (`≤ +0.30`) | `+0.00 ms` | **`+0.10 ms`** (`≤ +0.30`) | **`+0.10 ms`** (`≤ +0.30`) |
| **`droppedFrames`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** |
| `avgCpuRenderMs` (`p95CpuRenderMs`) | `1.260` (`1.8`) | `1.268` (`1.8`) | `1.308` (`1.9`) | `1.363` (`1.9`) | `2.368` (`2.9`) |

### 4.3 Phone (`390×844`, `Phone` Tier, `VRAM = 4.75 MiB`, `2` Textures, M11 §3.3 Baseline `p95 = 17.0 ms`)

| Metric | Stock · `cover=0` | Stock · `cover=1` | 5-Var · `cover=0` | 5-Var · `cover=1` | Stock · `cover=1` · `X @ 300` |
| --- | ---: | ---: | ---: | ---: | ---: |
| `visibleSceneTriangles` | `308,324` | **`309,364`** (`+1,040`) | `304,632` | **`305,672`** (`+1,040`) | **`309,364`** (`+1,040`) |
| Phone scene headroom (`320,000 − tris`) | `11,676` (`3.65 %`) | **`10,636` (`3.32 %`)** | `15,368` (`4.80 %`) | **`14,328` (`4.48 %`)** | **`10,636` (`3.32 %`)** |
| `triangles` (submitted / frame) | `307,876` | **`308,916`** (`+1,040`) | `304,512` | **`305,552`** (`+1,040`) | **`312,018`** (`308,916 + 3,102`) |
| `calls` (draw calls / frame) | `58` | **`60`** (`+2`) | `60` | **`62`** (`+2`) | **`62`** (`60 + 2` cap) |
| `sectionCapTriangles` (cover share) | `0` | `0` | `0` | `0` | **`3,102`** (**`+28` cover**, `3,074` rest) |
| `sectionCapStaticMs` / `DynamicMs` | `0 / 0` | `0 / 0` | `0 / 0` | `0 / 0` | `7.7 / 2.4 ms` |
| `openChains / closed / dropped / hullOnly` | `0 / 0 / 0 / 0` | `0 / 0 / 0 / 0` | `0 / 0 / 0 / 0` | `0 / 0 / 0 / 0` | `4 / 4 / 0 / 2` |
| `frameCount` (`elapsedMs`) | `601` (`10,015.3`) | `601` (`10,015.5`) | `601` (`10,015.4`) | `601` (`10,015.3`) | `601` (`10,013.5`) |
| `avgFrameTimeMs` (`avgFps`) | `16.664` (`60.01`) | `16.665` (`60.01`) | `16.665` (`60.01`) | `16.664` (`60.01`) | `16.661` (`60.02`) |
| **`p50 / p95 / min / max` (ms)** | **`16.7 / 17.0 / 15.8 / 17.4`** | **`16.7 / 17.0 / 15.3 / 17.4`** | **`16.7 / 17.0 / 15.7 / 17.2`** | **`16.7 / 16.9 / 15.3 / 17.3`** | **`16.7 / 17.2 / 13.5 / 17.3`** |
| **`p95` Δ vs M11 §3.3 (`17.0 ms`)** | `+0.00 ms` | **`+0.00 ms`** (`≤ +0.30`) | `+0.00 ms` | **`−0.10 ms`** (`≤ +0.30`) | **`+0.20 ms`** (`≤ +0.30`) |
| **`droppedFrames`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** |
| `avgCpuRenderMs` (`p95CpuRenderMs`) | `0.687` (`1.2`) | `0.751` (`1.3`) | `0.790` (`1.3`) | `0.854` (`1.4`) | `2.287` (`2.9`) |

### 4.4 Cover Section-Cap Triangle Audit (Spec §§7.4, 11.2, 13.5)

Measured by toggling `Intake cover` off → on at stationary crank angle (`θ = 0°`, `Exterior = On`) and comparing `sectionCapTriangles`:

| Section Plane | Total Cap Tris (`cover = 0`) | Total Cap Tris (`cover = 1`) | Cover Cap Contribution | Cover Cap Ceiling (`≤ 300`) | Scene Cap Ceiling (`≤ 16,000`) | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | :---: |
| **`Section X @ 300.0 mm`** (`RF-19` plane) | `3,074` | **`3,102`** (`2,204` under `X-Ray`) | **`+28` tris** (`0` under `X-Ray`) | `28 ≤ 300` (`9.33 %`) | `3,102 ≤ 16,000` (`19.39 %`) | **PASS** |
| **`Section Y @ 0.0 mm`** (centreline slice through rear boss & lettering) | `1,606` | **`1,676`** | **`+70` tris** | `70 ≤ 300` (`23.33 %`) | `1,676 ≤ 16,000` (`10.48 %`) | **PASS** |
| **`Section X @ 402.5 mm`** (`RF-16` plane, forward of `X = 400.0`) | `1,942` | **`1,942`** | **`0` tris** | `0 ≤ 300` | `1,942 ≤ 16,000` (`12.14 %`) | **PASS** |

### 4.5 D-033 Normative Budget Verdict Table

| Normative Metric | D-033 Budget | Cover-Off Baseline (Stock / 5-Var) | M12 Measured (`1,040` Cover Tris) | M12 At `1,800` Cap (Spec §7.2) | Tightest Measured Headroom (At `1,800` Cap) | Verdict |
| --- | ---: | ---: | ---: | ---: | --- | :---: |
| **Desktop** scene asset triangles | `360,000` | `308,324` / `304,632` | **`309,364`** / **`305,672`** | `310,124` / `306,432` (`317,368` derived test-8 cap) | **`50,636` (`14.07 %`)** (`49,876` at cap; `42,632` test-8) | **PASS** |
| **Phone** scene asset triangles | `320,000` | `308,324` / `304,632` | **`309,364`** / **`305,672`** | `310,124` / `306,432` (`317,368` derived test-8 cap) | **`10,636` (`3.32 %`)** (`9,876` / `3.09 %` at cap; `2,632` / `0.82 %` test-8) | **PASS** |
| **Desktop** submitted triangles / frame | `700,000` | `579,484` / `568,880` | **`580,524`** / **`569,920`** (`583,626` `X@300`) | `581,284` / `570,680` | **`116,374` (`16.62 %`)** *(with `X@300` caps)* | **PASS** |
| **Phone** submitted triangles / frame | `400,000` | `307,876` / `304,512` | **`308,916`** / **`305,552`** (`312,018` `X@300`) | `309,676` / `306,312` | **`87,982` (`22.00 %`)** *(with `X@300` caps)* | **PASS** |
| **Cover asset triangles** | `≤ 1,800` (`1,200 + 600`) | `0` | **`1,040`** (`500` body + `540` lettering) | `1,800` (`1,740` w/ exact `540`) | **`760` (`42.22 %`)** | **PASS** |
| **Cover section-cap triangles (`X @ 300`)** | `≤ 300` (`≤ 16,000` total) | `0` (`3,074` total) | **`+28`** (`+70` @ `Y=0`; `3,102` total) | `≤ 300` | **`272` (`90.67 %`)** cover / **`12,898`** total | **PASS** |
| **Desktop** draw calls / frame | `250` | `96` / `97` | **`98`** / **`99`** (`100` `X@300`) | `98` / `99` | **`150` (`60.00 %`)** | **PASS** |
| **Phone** draw calls / frame | `120` | `58` / `60` | **`60`** / **`62`** (`62` `X@300`) | `60` / `62` | **`58` (`48.33 %`)** | **PASS** |
| **Desktop / Phone** texture + HDRI VRAM | `64.00 / 32.00 MiB` | `20.75 / 4.75 MiB` | **`20.75 / 4.75 MiB`** (`+0.00 MiB`) | `20.75 / 4.75 MiB` | **`43.25 / 27.25 MiB`** | **PASS** |
| **Cover GLB size & page-weight delta** | `≤ 65,536 B` (`≤ +0.652 %`) | `0 B` | **`46,080 B` (`+0.4585 %`)** | `65,536 B` (`+0.6521 %`) | **`19,456 B` (`29.69 %`)** | **PASS** |
| **Desktop** frame time `p95` `@ 900 RPM` | `Δ ≤ +0.30 ms` vs `16.8 ms` | `16.8–17.0 ms` | **`16.9 ms`** (`Δ = +0.10 ms`, `0` dropped) | — | `0.20 ms` margin, `0` dropped frames | **PASS** |
| **Phone** frame time `p95` `@ 900 RPM` | `Δ ≤ +0.30 ms` vs `17.0 ms` | `17.0 ms` | **`16.9–17.2 ms`** (`Δ = −0.10..+0.20 ms`, `0` dropped) | — | `0.10 ms` margin, `0` dropped frames | **PASS** |

---

## 5. Visual Reference Frames, Deviation `D-047`, Manual Invariance & Interaction Checks (Spec §§8, 13.6–13.8)

### 5.1 Three New Committed Reference Frames (`1440×900 → 1024×640` PNG)

| Frame | Camera Pose `pos → target` (m, Three.js Y-up) | State (`Intake cover = On`, `Exterior = On`) | PNG Bytes | Committed SHA-256 | Checklist Result |
| --- | --- | --- | ---: | --- | :---: |
| [`RF-18`](./reference-frames/RF-18.png) | `[0.2300, 0.7200, -0.5800] → [0.2300, 0.2800, 0.0000]` *(same as `RF-13`)* | `θ = 0°`, Section `Off`, Explode `0 %`, X-Ray `Off` | `250,621` | `596c00d16d157b1e40ea91f214fd8606b9e435347527bc0c7e76c7852afaf299` | **PASS** (Y-bridge hidden under cover; raised `6.6 / TURBO / DIESEL` legible; cold pipe, alternator, P/S pump, resonator & loom clear) |
| [`RF-19`](./reference-frames/RF-19.png) | `[0.9200, 0.5600, 0.5800] → [0.2800, 0.3100, 0.0100]` *(project `[0.92, −0.58, 0.56] → [0.28, −0.01, 0.31]`, `D-047`)* | `θ = 0°`, Section `X @ 300.0 mm`, Explode `0 %`, X-Ray `Off` (`3,102` cap tris, `+28` cover) | `421,987` | `7ebd188ada87cfeb9d90ad648dbec34f882bdfa6f7a0d8c334daee5e772a56f4` | **PASS** (Shared `6/6` w/ `D-047` scope + crisp `2.5 mm` hatched U-band, open under-cover cavity w/ rear boss visible, solid Y-bridge section below, no `DURAMAX`) |
| [`RF-20`](./reference-frames/RF-20.png) | `[1.2800, 1.1200, 1.0800] → [0.3100, 0.3000, 0.0200]` *(project `[1.28, −1.08, 1.12] → [0.31, −0.02, 0.30]`, `D-047`)* | `θ = 90°`, Section `Off`, Explode `100 %` (`+260 mm`), X-Ray `Off` | `296,308` | `f7f4195890c151c192d33b20f6ec8cb885cffac97ce99681769290d3d4644a84` | **PASS** (Cover lifted `+260 mm` along `+Z` to `Z = 630.0..678.0 mm`; stationary Y-bridge exposed underneath; `6.6 / TURBO / DIESEL` legible on elevated pad) |

### 5.2 Owner-Approved Deviation Record (`D-047`, `docs/DECISIONS.md`)

Live WebGL rendering of `RF-19` and `RF-20` exposed a geometric contradiction between Spec §8's initial poses (written without a headless WebGL browser during planning/QA) and Spec §8.1 / §13.6's checklists:
1. **`RF-19` camera pose & legend-checklist scope:** `Section X @ 300.0 mm` keeps `X ≤ 300.0 mm` so the cut face points toward `+X`. From `RF-13`'s `X = +0.2300 m` camera (`70 mm` behind the cut), the cover's own opaque `Z = 417.2 mm` roof `100 %` occluded the `+X` wall band, the under-cover cavity, and the Y-bridge section; furthermore, the kept rear cover (`X ∈ [245.0, 300.0] mm`, `55.0 mm` deep) cannot hold the full `82 mm × 95 mm` three-line legend (`X ∈ [281.5, 363.5] mm`, clipped through `DIESEL`). Per owner approval (`D-047`), `RF-19` uses the front-right `+X` cutaway pose `[0.9200, −0.5800, 0.5600] → [0.2800, −0.0100, 0.3100]` (`[0.9200, 0.5600, 0.5800] → [0.2800, 0.3100, 0.0100]` Three.js Y-up) and scopes `RF-19`'s legend check to the kept rear cover (`X ≤ 300.0 mm`, no `DURAMAX` wordmark), while `RF-18` and `RF-20` prove full three-line `6.6 / TURBO / DIESEL` legibility.
2. **`RF-20` camera pose:** At `Explode = 100 %`, the `+260 mm` lift raises the cover pad to `Z = 0.6772 m`; `RF-5`'s `Z = 0.7400 m` camera viewed that pad at a `2.52°` grazing angle (`~5 px` foreshortened band), rendering the `0.8 mm` raised strokes unreadable. Per owner approval (`D-047`), `RF-20` elevates the camera to `[1.2800, −1.0800, 1.1200] → [0.3100, −0.0200, 0.3000]` (`[1.2800, 1.1200, 1.0800] → [0.3100, 0.3000, 0.0200]` Three.js Y-up, `17.2°` viewing angle), showing both the `+260 mm`-lifted cover with legible `6.6 / TURBO / DIESEL` lettering and the exposed Y-bridge below.

### 5.3 Manual `RF-1`…`RF-17` Cover-Off Invariance Comparison (Spec §§8.2, 11.2, 13.7)

All seventeen existing reference-frame PNGs (`docs/reference-frames/RF-1.png`…`RF-17.png`) are **byte-identical** to `main` (`0` bytes changed; none re-baselined). Live M12 captures of `?rf=RF-1`…`?rf=RF-17` (`1440×900 → 1024×640`) verified `intakeCoverEnabled === false` and `intakeCoverVisible === false` on all `17` frames, and manual visual comparison in the 3D viewport (`418,400` non-HUD pixels, masking the top-left title/subtitle banner, right-hand control panel, and bottom-left caption) confirmed **zero cover geometry leakage and visually unchanged 3D rendering relative to `main`**:

| Frame Group | Frames | Committed PNGs Untouched | Manual Visual Comparison & Supporting Viewport Check (HUD Masked) | Verdict |
| --- | --- | :---: | --- | :---: |
| **Y-bridge overhead baseline** | `RF-13` (`1` frame) | **Yes** (`0` diff bytes) | Visually identical overhead valley view with uncovered Y-bridge, resonator & charge pipes (**`0` differing pixels, `maxRGBDiff = 0`** across all `418,400` viewport pixels). Contrasts directly with `RF-18` where `intakeCover: true` hides the Y-bridge. | **PASS** |
| **Opaque exterior shell frames** | `RF-3`, `RF-8`, `RF-9`, `RF-11`, `RF-12` (`5` frames) | **Yes** (`0` diff bytes) | Visually indistinguishable 3D exterior shell & M8 aftermarket variants; cover completely absent (`0` pixels with channel diff `> 5/255`, `maxRGBDiff ≤ 4` GPU sub-LSB rounding). | **PASS** |
| **Post-M10/M11 X-Ray & section frames** | `RF-6`, `RF-7`, `RF-10`, `RF-14`, `RF-15`, `RF-16`, `RF-17` (`7` frames) | **Yes** (`0` diff bytes) | Visually compared side-by-side: identical ghosted shell (`RF-7`, `RF-10`), identical capped cutaways (`RF-6`, `RF-14`…`RF-17`), and zero cover mesh or cover cap presence. Minor numerical differences vs committed PNGs (`0.002 %`–`0.516 %` pixels `> 20/255` on `RF-6, 10, 14, 15, 17`) sit solely on internal Cylinder 1 head/valve ports from `main`'s prior `D-044` `sta_head_c1_stock.glb` / `9.9–10.0 mm` lift commit (`2c423bd` parent history), completely outside the cover's `[245..400, −120..120, 333.4..418]` envelope. | **PASS** |
| **Pre-M7 historical interior baselines** | `RF-1`, `RF-2`, `RF-4`, `RF-5` (`4` frames) | **Yes** (`0` diff bytes) | Exterior off (`intakeCoverVisible === false`); 3D internal assembly renders identically to `main` (historical committed PNGs predate M7's verified rod-length/lift upgrade as documented in `docs/M10-MEASUREMENTS.md:250` and `docs/M11-MEASUREMENTS.md:144`). | **PASS** |

### 5.4 Interactive & X-Ray Load-Order Verification (Spec §13.8)

| Check | Exercised State | Observed Telemetry & Visual Result | Verdict |
| --- | --- | --- | :---: |
| **1. Fresh-load default** | Navigate to `/` without `?rf=` or `?cover=` | `#m12-intake-cover-checkbox.checked === false`; `intakeCoverEnabled: false`, `intakeCoverVisible: false`; `.m12-cover-note` rendered verbatim below Views toggles. | **PASS** |
| **2. Exterior Off + Cover On** | `Exterior = Off`, `X-Ray = Off`, check `Intake cover` | `intakeCoverEnabled: true`, `intakeCoverVisible: false` (`computeIntakeCoverVisible(true, false, false) === false`); no floating cover over bare internal assembly. | **PASS** |
| **3. Exterior On + Cover On** | Check `Exterior`, check `Intake cover` | `intakeCoverVisible: true`, `visibleSceneTriangles: 309,364` (`+1,040`), `calls: 98` (`+2`); cover sits cleanly over Y-bridge. | **PASS** |
| **4. X-Ray ghosting & cap suppression** | `Section X @ 300.0 mm`, `Intake cover = On`, toggle `X-Ray = On` | Both `mat_cover_plastic` and `mat_cover_letter` switch to `transparent: true, opacity: 0.22, depthWrite: false`; `sectionCapTriangles` drops `3,102 → 2,204` (`skipWhenGhosted: true` suppresses both shell and cover caps); toggling `X-Ray = Off` restores exact opaque snapshots and `3,102` cap tris. | **PASS** |
| **5. X-Ray load-order regression check** | `setXrayEnabled(true)` **before** cover finishes loading (verified in `intakeCover.test.ts` Test 7 + delayed-GLB browser check) | `exteriorGhostRegistry.setGhosted(true)` records desired state before registration; when `loadVariantScene` resolves and calls `register(coverMaterials)` + `syncExteriorShellState()`, cover materials arrive immediately at `opacity = 0.22, transparent = true, depthWrite = false` and `sectionCapTriangles` suppresses the cover cap (`0` opaque flash / `0` stray cap). | **PASS** |
| **6. `Section X @ 300` open cavity** | `Exterior = On`, `Intake cover = On`, `Section X @ 300.0 mm` | `+28` cover cap triangles render only the `2.5 mm` hatched wall/skirt U-band; open underside remains air above the solid Y-bridge cut (`0` chord-closed slab). | **PASS** |
| **7. `Explode 100 %`** | `Exterior = On`, `Intake cover = On`, drag `Explode` `0 % → 100 %` | Cover group translates `(0, +0.260, 0) m` in Three.js Y-up (`+260.0 mm` project `+Z`) while exterior shell & Y-bridge stay at `(0, 0, 0)`. | **PASS** |
| **8. All 5 M8 variants + 23 labels** | Enable all 5 M8 visual variants + `Intake cover = On` + `Labels = On` | `visibleSceneTriangles: 305,672`, `calls: 99` (`62` phone); V2 `intake_highflow` tube clears rear-right cover relief cleanly; exactly `23` M10 callout anchors unchanged (no 24th label). | **PASS** |

---

## 6. Single-Render, Frozen-File & Asset SHA-256 Audit (Spec §§9 Tests 7/12, 13.1, 14)

1. **Single `renderer.render(` & WebGL pass invariant (`intakeCover.test.ts` Test 7):**
   - `renderer.render(` occurrences in `src/renderer/engineScene.ts`: **`1`**.
   - Occurrences across `src/renderer/**` of `new THREE.WebGLRenderTarget(`, `stencil: true`, `setRenderTarget`, `overrideMaterial`: **`0`**.
   - One-shot `exteriorMaterialsGhosted` boolean removed; `syncExteriorShellState()` invokes `exteriorGhostRegistry.setGhosted(xrayEnabled)` unconditionally and `syncIntakeCoverState()` runs before `if (!exteriorShell) return;`.
2. **Frozen-file `git diff main` audit (§13.1):**
   - `git diff main` across all frozen directories and files in Spec §13.1 / §14 (`src/core`, `src/perf`, `catalog`, `src/config`, `src/audio`, `src/assets`, `.github`, `vite.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json`, all `10` `public/models/*_stock.glb`, `public/models/variants`, `public/Duramax_LLY_2005_66L_V8.glb`, `public/hdri`, `public/legacy`, `assets-src/blender/build_shell.py`, `assets-src/blender/build_variants.py`, `assets-src/dimensions.json`, `assets-src/variant_dimensions.json`, `src/renderer/exteriorLoader.ts`, `layout.ts`, `partLoader.ts`, `partVariants.ts`, `variantLoader.ts`, `viewLayout.ts`, `sectionCaps.ts`, `docs/M2-MEASUREMENTS.md`…`docs/M11-MEASUREMENTS.md`, `docs/M5-MODEL.md`…`docs/M11-CUTAWAYS.md`, `docs/specs/**`, `docs/research/**`, `docs/PLANNING.md`, `docs/ORCHESTRATOR.md`) → **`0` lines (empty)**.
   - SHA-256 hashes of `public/Duramax_LLY_2005_66L_V8.glb`, all `5` `public/models/variants/*.glb`, `catalog/stock.json`, and `catalog/modified.json` verified identical to `docs/M8-MEASUREMENTS.md` / `docs/M10-MEASUREMENTS.md` (`intakeCover.test.ts` Test 12).

---

## 7. Exact Commands Used (Spec §11.2)

```powershell
# 1. Deterministic cover asset build in headless Blender 5.2.3 LTS
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python assets-src/blender/build_intake_cover.py

# 2. Typecheck, unit/asset suite (104 tests across 21 files), and production bundle build
npm run typecheck
npm test
npm run build

# 3. Production preview server for ?benchmark=1&cover=0|1 and ?rf=RF-1..RF-20 captures
npx vite preview --port 4173 --strictPort

# 4. Normative frozen-file git diff audit (Spec §13.1)
git diff main -- src/core src/perf catalog src/config src/audio src/assets .github vite.config.ts tsconfig.json package.json package-lock.json public/models/rot_piston_c1_stock.glb public/models/rot_conrod_c1_stock.glb public/models/rot_crankthrow_c1_stock.glb public/models/sta_head_c1_stock.glb public/models/val_bridge_stock.glb public/models/val_pushrod_stock.glb public/models/val_rocker_stock.glb public/models/val_valve_exhaust_stock.glb public/models/val_valve_intake_stock.glb public/models/fuel_injector_c1_stock.glb public/models/variants public/Duramax_LLY_2005_66L_V8.glb public/hdri public/legacy assets-src/blender/build_shell.py assets-src/blender/build_variants.py assets-src/dimensions.json assets-src/variant_dimensions.json src/renderer/exteriorLoader.ts src/renderer/layout.ts src/renderer/partLoader.ts src/renderer/partVariants.ts src/renderer/variantLoader.ts src/renderer/viewLayout.ts src/renderer/sectionCaps.ts docs/M2-MEASUREMENTS.md docs/M3-MEASUREMENTS.md docs/M4-MEASUREMENTS.md docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M7-MEASUREMENTS.md docs/M8-VARIANTS.md docs/M8-MEASUREMENTS.md docs/M9-SOUND.md docs/M9-MEASUREMENTS.md docs/M10-EXTERIOR.md docs/M10-MEASUREMENTS.md docs/M11-CUTAWAYS.md docs/M11-MEASUREMENTS.md docs/specs docs/research docs/PLANNING.md docs/ORCHESTRATOR.md
```
