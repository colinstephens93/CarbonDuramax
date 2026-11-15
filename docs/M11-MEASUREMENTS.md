# Milestone 11 — Capped-Solid Cutaways Measurements

Project: Duramax LLY Engine Lab · Governing spec: [`docs/specs/M11-capped-cutaways.md`](./specs/M11-capped-cutaways.md) · Technique record: [`docs/M11-CUTAWAYS.md`](./M11-CUTAWAYS.md) · Prior baseline: [`docs/M10-MEASUREMENTS.md`](./M10-MEASUREMENTS.md)

---

## 1. Production Bundle & Gate Summary (Spec §§8, 12.2)

- **Node / Toolchain:** Node `v24.16.0`, TypeScript `tsc --noEmit` (`0` errors), Vitest `v3.2.7` (**`20` test files, `95 / 95` tests passing** — `89` M10 tests + `6` new tests in `src/renderer/sectionCaps.test.ts`; strictly `1` new + `2` edited test files touched), Vite `v7.3.8` (`40` modules transformed).
- **Shipped Production Bundle (`npm run build`):**
  - `dist/index.html`: **`1.44 kB`** (`0.64 kB` gzip)
  - `dist/assets/index-CRSquQsJ.js`: **`820.41 kB`** (**`219.53 kB` gzip**) — `+15.41 kB` minified / `+4.21 kB` gzip over M10's `805.00 kB` / `215.32 kB` gzip (`0` new npm dependencies, `0` bytes of asset changes across all 16 GLBs).

---

## 2. Static & Dynamic CPU Rebuild Timings (Spec §6.3)

### 2.1 Measurement Environment
- **Host / GPU:** `Intel(R) Core(TM) Ultra 7 256V`, `15.7 GiB` RAM, Windows 11 x64 · `ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (8GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)` (WebGL 2, `STENCIL_BITS = 0`)
- **Browser / Server:** Chromium `152.0.7977.167` built-in webview (`devicePixelRatio = 1`) · `npx vite preview --port 4173 --strictPort`

### 2.2 Static Cap Rebuild Timings (`performance.now()` around `scene.updateMatrixWorld(true)` + `buildCapGeometry(staticCapSources, ...)`)

Measured over `24`–`25` consecutive rebuilds per trigger on Desktop (`1440×900`, `Full` tier) and Phone (`390×844`, `Phone` tier) against Spec §6.3 targets (**`≤ 8.0 ms` Desktop / `≤ 16.0 ms` Phone**):

| Plane & Trigger Sweep | Rebuilds (`N`) | Static Cap Tris (`median / max`) | Desktop `median / p95` (ms) | Desktop `min / max / mean` (ms) | Phone `median / p95` (ms) | Phone `min / max / mean` (ms) | Budget (`Desk / Phone`) | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
| **`X = 402.5 mm`** — Plane step (`±6 mm`, Exterior `On`) | `25` | `1,599 / 1,682` (`1,256` @ `402.5`) | **`2.70 / 4.60`** | `1.90 / 11.80 / 3.20` | **`2.60 / 4.20`** | `2.10 / 10.30 / 3.07` | `≤ 8.0 / ≤ 16.0 ms` | **PASS** |
| **`X = 402.5 mm`** — Explode sweep (`0 % → 100 %`, Exterior `On`) | `25` | `1,138 / 1,792` | **`2.10 / 3.10`** | `1.60 / 3.20 / 2.15` | **`2.00 / 3.80`** | `1.50 / 4.00 / 2.23` | `≤ 8.0 / ≤ 16.0 ms` | **PASS** |
| **`X = 402.5 mm`** — Variant swap (`stock ↔ 5-variant`, Exterior `On`) | `24` | `1,256 / 1,263` | **`2.20 / 4.20`** | `1.90 / 4.90 / 2.52` | **`2.10 / 3.20`** | `1.70 / 3.80 / 2.23` | `≤ 8.0 / ≤ 16.0 ms` | **PASS** |
| **`Y = -185 mm`** — Plane step (`±6 mm`, Exterior `On`) | `25` | `2,015 / 2,215` | **`3.20 / 4.50`** | `2.10 / 5.60 / 3.36` | **`3.10 / 5.00`** | `1.90 / 5.20 / 3.33` | `≤ 8.0 / ≤ 16.0 ms` | **PASS** |
| **`Y = -185 mm`** — Plane step (`±6 mm`, Exterior `Off`, `RF-17`) | `25` | `1,300 / 1,528` (`1,275` @ `-185`) | **`2.40 / 3.60`** | `0.90 / 3.90 / 2.32` | **`2.30 / 3.40`** | `0.90 / 3.60 / 2.29` | `≤ 8.0 / ≤ 16.0 ms` | **PASS** |
| **`Y = -185 mm`** — Explode sweep (`0 % → 100 %`, Exterior `On`) | `25` | `884 / 2,015` | **`1.60 / 3.20`** | `0.90 / 4.20 / 1.81` | **`1.40 / 2.80`** | `0.90 / 3.40 / 1.60` | `≤ 8.0 / ≤ 16.0 ms` | **PASS** |
| **`Y = -185 mm`** — Variant swap (`stock ↔ 5-variant`, Exterior `On`) | `24` | `2,015 / 2,140` | **`3.35 / 5.10`** | `2.60 / 5.20 / 3.62` | **`3.25 / 4.30`** | `2.60 / 4.50 / 3.40` | `≤ 8.0 / ≤ 16.0 ms` | **PASS** |

### 2.3 Dynamic Cap Rebuild Timings (`performance.now()` around per-frame `buildCapGeometry(dynamicCapSources, ...)`)

Measured over `320` consecutive rendered frames (`4` full `720°` engine cycles at `900 RPM`, plus `320` paused frames per §5.7, plus `20` frames at `X = 380.5 mm` slicing directly through Cylinder 1/2's valve-spring row) against Spec §6.3 targets (**`≤ 6.5 ms` Desktop / `≤ 13.0 ms` Phone**):

| Dynamic Sweep State | Frames (`N`) | Dynamic Cap Tris (`median / max`) | Desktop `median / p95` (ms) | Desktop `min / max / mean` (ms) | Phone `median / p95` (ms) | Phone `min / max / mean` (ms) | Budget (`Desk / Phone`) | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
| **`X = 402.5 mm` @ `900 RPM`** (running) | `320` | `686 / 686` | **`1.40 / 2.50`** | `0.90 / 4.40 / 1.60` | **`1.35 / 2.00`** | `0.80 / 3.20 / 1.41` | `≤ 6.5 / ≤ 13.0 ms` | **PASS** |
| **`X = 402.5 mm` Paused** (`θ` held constant, §5.7) | `320` | `686 / 686` | **`1.50 / 2.60`** | `0.90 / 7.30 / 1.64` | **`0.70 / 1.60`** | `0.40 / 3.70 / 0.83` | `≤ 6.5 / ≤ 13.0 ms` | **PASS** |
| **`Y = -185 mm` @ `900 RPM`** (running, `RF-17` plane) | `320` | `1,325 / 1,328` | **`1.80 / 3.10`** | `1.30 / 4.60 / 2.02` | **`0.80 / 1.20`** | `0.60 / 1.50 / 0.83` | `≤ 6.5 / ≤ 13.0 ms` | **PASS** |
| **`X = 380.5 mm` @ `900 RPM`** *(slices front valve/spring row, `hullOnly` active)* | `20` | `2,054 / 2,054` | **`3.85 / 5.00`** | `3.10 / 5.00 / 4.04` | **`2.45 / 4.40`** | `2.10 / 4.40 / 2.75` | `≤ 6.5 / ≤ 13.0 ms` | **PASS** |

### 2.4 Continuous Slider-Drag Cadence (`900 mm → 402.5 mm`, Spec §6.3 #4)
- **Protocol:** `60` consecutive rAF steps dragging Section `X` continuously from `900.0 mm` to `402.5 mm` with `Exterior = On` (`1` static + `1` dynamic rebuild on every single frame, zero lag frames).
- **Desktop (`1440×900`, `Full`):** `60` static rebuilds (`median = 0.10 ms`, `p95 = 2.50 ms`, `max = 3.70 ms`), `60` dynamic rebuilds (`p95 = 2.90 ms`, `max = 3.60 ms`), frame `dt` `median = 16.7 ms` / `p95 = 18.4 ms` / `mean = 16.731 ms` (**`59.77 FPS`**), cap triangles ramping `0 → 0 → 203 → 1,942` (peak **`3,909`** across mid-engine stations, `24.4 %` of the `16,000` ceiling).
- **Phone (`390×844`, `Phone`):** `60` static rebuilds (`median = 0.10 ms`, `p95 = 1.20 ms`, `max = 2.30 ms`), `60` dynamic rebuilds (`p95 = 1.40 ms`, `max = 2.30 ms`), frame `dt` `median = 16.7 ms` / `p95 = 17.6 ms` / `mean = 16.703 ms` (**`59.87 FPS`**), peak cap triangles **`3,909`**.

---

## 3. Runtime `?benchmark=1` Matrix & D-033 Budget Verdict (Spec §§6.2, 6.3 #3, 12.3, 12.4)

### 3.1 Protocol
All 12 rows below were measured on the shipped production build via `http://localhost:4173/CarbonDuramax/?benchmark=1...` (`60`-frame warmup after `detailedLoaded && hdriLoaded && exteriorLoaded && variantsLoaded`, followed by `10.0 s` / `601` frames at `900 RPM`; a post-Self-QA steady-state scratch-pool tightening in `sectionCaps.ts` `index-C6FrlTbW.js → index-CRSquQsJ.js` eliminated residual temporary per-component allocations while preserving identical triangle output). Worst-case 5-variant rows append `&variants=turbo_large,intake_highflow,exhaust_4in,intercooler_upgraded,pistons_lowcomp`.

### 3.2 Desktop (`1440×900`, `Full` Tier, `VRAM = 20.75 MiB`, `4` Textures)

| Metric | Stock · Section `Off` | Stock · `X @ 402.5` | 5-Var · Section `Off` | 5-Var · `X @ 402.5` | Stock · `X @ 402.5` + `X-Ray` | Stock · `Y @ -185` (`Ext Off`, `RF-17`) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `visibleSceneTriangles` | `308,324` | `308,324` | `304,632` | `304,632` | `308,324` | `271,224` |
| `triangles` (submitted / frame) | **`579,484`** | **`581,426`** (`+1,942`) | **`568,880`** | **`570,829`** (`+1,949`) | **`617,458`** (`616,584 + 874`) | **`544,984`** (`542,384 + 2,600`) |
| `calls` (draw calls / frame) | **`96`** | **`98`** (`+2`) | **`97`** | **`99`** (`+2`) | **`121`** (`119 + 2`) | **`75`** (`73 + 2`) |
| `sectionCapTriangles` | `0` | **`1,942`** | `0` | **`1,949`** | **`874`** *(shell suppressed)* | **`2,600`** |
| `sectionCapStaticMs` / `DynamicMs` | `0 / 0` | `2.2 / 0.5 ms` | `0 / 0` | `4.8 / 0.5 ms` | `1.1 / 0.5 ms` | `1.6 / 0.8 ms` |
| `openChains / closed / dropped / hullOnly` | `0 / 0 / 0 / 0` | `2 / 2 / 0 / 2` | `0 / 0 / 0 / 0` | `2 / 2 / 0 / 2` | `0 / 0 / 0 / 2` | `0 / 0 / 0 / 2` |
| `frameCount` (`elapsedMs`) | `601` (`10,015.6`) | `601` (`10,013.8`) | `601` (`10,014.5`) | `601` (`10,011.5`) | `601` (`10,012.8`) | `601` (`10,014.2`) |
| `avgFrameTimeMs` (`avgFps`) | `16.665` (`60.01`) | `16.662` (`60.02`) | `16.663` (`60.01`) | `16.658` (`60.03`) | `16.660` (`60.02`) | `16.663` (`60.01`) |
| **`p50 / p95 / min / max` (ms)** | **`16.7 / 16.8 / 15.7 / 17.2`** | **`16.7 / 17.0 / 14.3 / 17.2`** | **`16.7 / 16.8 / 14.5 / 16.9`** | **`16.7 / 16.8 / 11.4 / 17.1`** | **`16.7 / 16.9 / 12.9 / 17.3`** | **`16.7 / 16.8 / 14.3 / 17.1`** |
| **`p95` Δ vs M10 (`16.8 ms`)** | **`+0.00 ms`** | **`+0.20 ms`** (`≤ +0.30`) | **`+0.00 ms`** | **`+0.00 ms`** | **`+0.10 ms`** (`≤ +0.30`) | **`+0.00 ms`** |
| **`droppedFrames`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** |
| `avgCpuRenderMs` (`p95CpuRenderMs`) | `0.872` (`1.3`) | `1.605` (`2.1`) | `1.854` (`2.5`) | `2.884` (`4.0`) | `2.084` (`2.7`) | `1.415` (`1.9`) |

### 3.3 Phone (`390×844`, `Phone` Tier, `VRAM = 4.75 MiB`, `2` Textures)

| Metric | Stock · Section `Off` | Stock · `X @ 402.5` | 5-Var · Section `Off` | 5-Var · `X @ 402.5` | Stock · `X @ 402.5` + `X-Ray` | Stock · `Y @ -185` (`Ext Off`, `RF-17`) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `visibleSceneTriangles` | `308,324` | `308,324` | `304,632` | `304,632` | `308,324` | `271,224` |
| `triangles` (submitted / frame) | **`307,876`** | **`309,818`** (`+1,942`) | **`304,512`** | **`306,461`** (`+1,949`) | **`345,402`** (`344,528 + 874`) | **`273,824`** (`271,224 + 2,600`) |
| `calls` (draw calls / frame) | **`58`** | **`60`** (`+2`) | **`60`** | **`62`** (`+2`) | **`81`** (`79 + 2`) | **`39`** (`37 + 2`) |
| `sectionCapTriangles` | `0` | **`1,942`** | `0` | **`1,949`** | **`874`** *(shell suppressed)* | **`2,600`** |
| `sectionCapStaticMs` / `DynamicMs` | `0 / 0` | `2.5 / 0.5 ms` | `0 / 0` | `3.0 / 0.9 ms` | `1.2 / 0.7 ms` | `2.3 / 0.8 ms` |
| `openChains / closed / dropped / hullOnly` | `0 / 0 / 0 / 0` | `2 / 2 / 0 / 2` | `0 / 0 / 0 / 0` | `2 / 2 / 0 / 2` | `0 / 0 / 0 / 2` | `0 / 0 / 0 / 2` |
| `frameCount` (`elapsedMs`) | `601` (`10,014.9`) | `601` (`10,015.2`) | `601` (`10,015.5`) | `601` (`10,014.7`) | `601` (`10,014.3`) | `601` (`10,014.5`) |
| `avgFrameTimeMs` (`avgFps`) | `16.664` (`60.01`) | `16.664` (`60.01`) | `16.665` (`60.01`) | `16.663` (`60.01`) | `16.663` (`60.01`) | `16.663` (`60.01`) |
| **`p50 / p95 / min / max` (ms)** | **`16.7 / 17.0 / 14.9 / 17.2`** | **`16.7 / 16.8 / 15.1 / 17.1`** | **`16.7 / 17.0 / 15.6 / 17.2`** | **`16.7 / 17.0 / 14.4 / 17.2`** | **`16.7 / 16.9 / 14.3 / 17.2`** | **`16.7 / 16.9 / 14.5 / 17.2`** |
| **`p95` Δ vs M10 (`16.8 ms`)** | **`+0.20 ms`** (`≤ +0.30`) | **`+0.00 ms`** | **`+0.20 ms`** (`≤ +0.30`) | **`+0.20 ms`** (`≤ +0.30`) | **`+0.10 ms`** (`≤ +0.30`) | **`+0.10 ms`** (`≤ +0.30`) |
| **`droppedFrames`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** |
| `avgCpuRenderMs` (`p95CpuRenderMs`) | `0.589` (`0.9`) | `1.182` (`1.7`) | `0.665` (`1.0`) | `1.175` (`1.6`) | `1.837` (`2.4`) | `1.369` (`1.7`) |

### 3.4 D-033 Normative Budget Verdict Table

| Normative Metric | D-033 Budget | M10 Baseline (Stock / 5-Var) | M11 Measured (`X @ 402.5` Stock / 5-Var / X-Ray) | Utilisation (Max) | Headroom (Min) | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | :---: |
| **Desktop** scene asset triangles | `360,000` | `308,324` / `304,632` | **`308,324`** / **`304,632`** | `85.65 %` | `51,676` (`14.35 %`) | **PASS** |
| **Phone** scene asset triangles | `320,000` | `308,324` / `304,632` | **`308,324`** / **`304,632`** | `96.35 %` | `11,676` (`3.65 %`) | **PASS** |
| **Desktop** submitted triangles / frame | `700,000` | `579,484` / `568,880` | **`581,426`** / **`570,829`** / **`617,458`** *(X-Ray)* | `83.06 %` (`88.21 %` X-Ray) | `118,574` (`82,542` X-Ray) | **PASS** |
| **Phone** submitted triangles / frame | `400,000` | `307,876` / `304,512` | **`309,818`** / **`306,461`** / **`345,402`** *(X-Ray)* | `77.45 %` (`86.35 %` X-Ray) | `90,182` (`54,598` X-Ray) | **PASS** |
| **Section cap triangles (`capTris`)** | `≤ 16,000` | `0` | **`1,942`** / **`1,949`** / **`874`** (`2,600` @ `Y=-185`; `3,909` drag peak) | `24.43 %` *(peak)* | `12,091` *(at peak)* | **PASS** |
| **Desktop** draw calls / frame | `250` | `96` / `97` (`119` X-Ray) | **`98`** / **`99`** / **`121`** *(X-Ray)* | `39.60 %` (`48.40 %` X-Ray) | `151` (`129` X-Ray) | **PASS** |
| **Phone** draw calls / frame | `120` | `58` / `60` (`79` X-Ray) | **`60`** / **`62`** / **`81`** *(X-Ray)* | `51.67 %` (`67.50 %` X-Ray) | `58` (`39` X-Ray) | **PASS** |
| **Desktop** texture + HDRI VRAM | `64.00 MiB` | `20.75 MiB` | **`20.75 MiB`** (`+0.00 MiB`) | `32.42 %` | `43.25 MiB` | **PASS** |
| **Phone** texture + HDRI VRAM | `32.00 MiB` | `4.75 MiB` | **`4.75 MiB`** (`+0.00 MiB`) | `14.84 %` | `27.25 MiB` | **PASS** |
| **Desktop** frame time `p95` `@ 900 RPM` | `16.7 ms` (`Δ ≤ +0.30 ms` vs M10 `16.8 ms`) | `16.8 ms` | **`16.8–17.0 ms`** (`Δ = +0.00..+0.20 ms`, `0` dropped) | VSync locked | `0` dropped frames | **PASS** |
| **Phone** frame time `p95` `@ 900 RPM` | `33.3 ms` (`Δ ≤ +0.30 ms` vs M10 `16.8 ms`) | `16.8 ms` | **`16.8–17.0 ms`** (`Δ = +0.00..+0.20 ms`, `0` dropped) | `51.05 %` | `16.3 ms` (`0` dropped) | **PASS** |

---

## 4. Visual Reference Frames & Open-Shell "Before" Difference Proof (Spec §§7.1–7.3, 12.5)

### 4.1 Five Committed Section Reference Frames (`1440×900 → 1024×640` PNG)

| Frame | Status | Pose & Section State | Cap Tris (`Static + Dyn`) | PNG Bytes | Committed SHA-256 | §7.2 Checklist (`6` Shared + Per-Frame) |
| --- | --- | --- | ---: | ---: | --- | :---: |
| [`RF-6`](./reference-frames/RF-6.png) | **Re-baselined** | `θ = 0°`, Ext `Off`, `X @ 402.5 mm` | `874` (`188 + 686`) | `288,950` | `55fcca17d34d585dc31317c4e7e5bdff999a17d29cb82bb7fac4877d44f46830` | **PASS** (`6/6` + Cyl 1 TDC piston, heads, injector/bridge/rocker, rod/throw solid) |
| [`RF-14`](./reference-frames/RF-14.png) | **New** | `θ = 180°`, Ext `Off`, `X @ 402.5 mm` | `874` (`188 + 686`) | `352,964` | `9b99abcc845d5fc32973934c589bade11c1779326b9df343262c6b643d1dbd81` | **PASS** (`6/6` + BDC piston solid crown-to-skirt, rod/throw solid, bore above open) |
| [`RF-15`](./reference-frames/RF-15.png) | **New** | `θ = 470°`, Ext `Off`, `X @ 402.5 mm` | `874` (`188 + 686`) | `401,630` | `7e73bcc04683f6d4323b93501ddbe80f81eb889983628075b31acee2fc8996ea` | **PASS** (`6/6` + RH head, injector, bridge, rocker solid; `X ≈ 380.5` spring coils un-cut) |
| [`RF-16`](./reference-frames/RF-16.png) | **New** | `θ = 180°`, Ext `On`, `X @ 402.5 mm` | `1,942` (`1,256 + 686`) | `281,294` | `f63e3a4e82d04aa4332cd28f6b7e9ae146b223502a4b9739a0537c2976868069` | **PASS** (`6/6` + `1,068` shell tris across block/pan/covers/CP3/ducts solid; `0` hollow pipes) |
| [`RF-17`](./reference-frames/RF-17.png) | **New** | `θ = 0°`, Ext `Off`, `Y @ -185 mm` | `2,600` (`1,275 + 1,325`) | `166,424` | `0d53729977f9ed43553307b2a427be55b5510e3ac4aabf7d712ca064864a8ec1` | **PASS** (`6/6` + RH heads, 4 pistons & intake-valve stems solid; LH bank & valley clipped) |

### 4.2 Open-Shell "Before" vs Capped-Solid "After" Comparison (§7.3 Difference Test)

For `RF-6`, the committed `main` PNG is the open-shell before baseline; for `RF-14`…`RF-17`, temporary open-shell before captures were taken at identical poses using a build-only cap-hide switch (`nocaps=1`, cleanly reverted before shipping `dist/assets/index-CRSquQsJ.js`):

| Frame | Open-Shell "Before" Source | Before Bytes | Before SHA-256 | 3D Viewport Pixels Changed (`> 0` / `> 20/255`) | Visual Interior-Wall Inspection (§7.3) |
| --- | --- | ---: | --- | ---: | --- |
| **`RF-6`** | `git show main:docs/reference-frames/RF-6.png` | `242,668` | `6745616e145989a5e79e5e816ae915c13daa517463f60586d53ce62e0f38a5a1` | `74,604` (`17.83 %`) / `34,701` (`8.29 %`) *(incl. M7 lift/rod geometry)* | **Before:** hollow piston under-crowns, hollow head bays, hollow rods/throws visible. **After:** 100 % filled with hatched bronze caps; zero interior walls visible (**PASS**). |
| **`RF-14`** | Temporary `?rf=RF-14&nocaps=1` | `342,822` | `b8587722152c42708931b6e7dc8b93444476a4070accd948a18b2afc82ca96e4` | `16,946` (`4.05 %`) / `15,472` (`3.70 %`, `maxDiff = 175`) | **Before:** hollow Cyl 1 BDC piston skirt/pin cavity, hollow rod I-beam & crank throw walls visible. **After:** continuous solid section from crown bowl to skirt + solid rod/throw (**PASS**). |
| **`RF-15`** | Temporary `?rf=RF-15&nocaps=1` | `397,657` | `c37421cc69336f130c00929da5322264e1b37cd77aeeb816bbbbdd080a7faaee` | `15,881` (`3.80 %`) / `14,693` (`3.51 %`, `maxDiff = 162`) | **Before:** hollow RH head casting walls, hollow injector sleeve, hollow bridge/rocker shells visible. **After:** solid casting/injector/bridge/rocker caps (**PASS**). |
| **`RF-16`** | Temporary `?rf=RF-16&nocaps=1` | `252,661` | `ad36dab9f04097c8c3f3412f3ebc44f787add107638698ce69dc7370d7ed3463` | `41,424` (`9.90 %`) / `40,152` (`9.60 %`, `maxDiff = 162`) | **Before:** cavernous open oil pan, hollow block crankbay, hollow valve covers, open charge/intake tubes. **After:** entire exterior shell & plumbing capped solid (**PASS**). |
| **`RF-17`** | Temporary `?rf=RF-17&nocaps=1` | `159,996` | `a791815562cd19b398eff5b2d4e76be0050f94d029ede98b0d46ef82ee158844` | `8,413` (`2.01 %`) / `7,602` (`1.82 %`, `maxDiff = 170`) | **Before:** hollow orange Cyl 1 piston shell and hollow RH head galleries visible along `Y = -185 mm`. **After:** solid longitudinal head, piston & valve-stem caps (**PASS**). |

---

## 5. Section-Off Reference Frame Invariance Audit (Spec §12.6)

All twelve section-off reference frames (`RF-1`…`RF-5` and `RF-7`…`RF-13`) remain **byte-identical** on disk (`git diff main -- docs/reference-frames/RF-1.png ... RF-13.png` is empty), and live M11 re-renders (`1440×900 → 1024×640`, HUD regions masked) confirm zero 3-D scene regression when `sectionMode === 'off'` (`staticCapMesh.visible = false`, `dynamicCapMesh.visible = false`):

| Frame Set | Frames | Committed PNGs Untouched | Live 3D Viewport Pixel Comparison Result | Verdict |
| --- | --- | :---: | --- | :---: |
| **Post-M7 / M10 current-geometry baselines** | `RF-3`, `RF-7`, `RF-8`, `RF-9`, `RF-10`, `RF-11`, `RF-12`, `RF-13` (`8` frames) | **Yes** (`0` diff bytes) | **`0` differing pixels (`maxRGBDiff = 0`, `0.00 %`)** across all `418,400` non-HUD viewport pixels against committed `docs/reference-frames/RF-*.png` | **PASS** |
| **Pre-M7 historical baselines** *(committed PNGs predate M7's verified rod-length/lift upgrade per `docs/M10-MEASUREMENTS.md:250`)* | `RF-1`, `RF-2`, `RF-4`, `RF-5` (`4` frames) | **Yes** (`0` diff bytes) | **`0` differing pixels (`maxRGBDiff = 0`)** on `RF-2`, `RF-4`, `RF-5` and `0` pixels `> 20/255` (`0.00 %`) on `RF-1` against cap-disabled baseline renders | **PASS** |

---

## 6. Interaction Verification Captures (Spec §12.8)

All four required interaction behaviours were exercised and captured at `1440×900 → 1024×640`:

| Interaction Check | Pair / Sequence State | Cap Triangles & Draw Calls | Capture Bytes & SHA-256 | Verified Visual Behaviour |
| --- | --- | --- | --- | --- |
| **1. X-Ray suppresses shell caps** (`Section X @ 402.5 mm`, `Exterior On`) | `X-Ray Off` (`RF-16`) → `X-Ray On` | `1,942` tris (`98` calls) → **`874` tris (`121` calls)** (`1,068` `skipWhenGhosted` shell tris suppressed; `openChains: 2 → 0`) | `RF-16`: `281,294` B (`f63e3a4e...`) → `X-Ray On`: `269,146` B (`cc7296342e5e2d46fc982055efdfa3fe94b896bd0350a9fe4f455cb167bef905`) | Translucent `0.22`-opacity shell writes neither solid cap colour nor cap depth; internal head, injector, rod, crank throw & main-shaft caps remain crisp inside (**PASS**). |
| **2a. Explode `0 % → 100 %` (`Exterior On`)** (`Section X @ 402.5 mm`) | `Explode 0 %` (`RF-16`) → `Explode 100 %` | `1,942` (`1,256` static + `686` dyn) → **`1,154` (`1,138` static + `16` dyn)** | `RF-16`: `281,294` B (`f63e3a4e...`) → `Explode 100 %`: `291,886` B (`b36c2690dc2588572ad96d547c1e662793d2a865c106235f3efd21b9da1b6388`) | Stationary exterior shell (`1,068` tris) + fixed main shaft (`70` tris) keep their caps while Cyl 1/2 heads/pistons/rods/valvetrain lift & spread clear of `X = 402.5 mm` (**PASS**). |
| **2b. Explode `0 % → 100 %` (`Exterior Off`)** (`Section X @ 402.5 mm`) | `Explode 0 %` (`RF-6`) → `Explode 100 %` | `874` (`188` static + `686` dyn) → **`86` (`70` static + `16` dyn)** | `RF-6`: `288,950` B (`55fcca17...`) → `Explode 100 %`: `310,424` B (`2ed2c04740db842dbafda59eda15a4220b5c69711508c3b275c049d051595eaa`) | Lifted Cyl 1/2 heads and forward-spread station `1&2` lose their caps cleanly; stationary main shaft + rear crank web crossing `X = 402.5 mm` retain crisp hatched bronze caps (**PASS**). |
| **3. Live slider drag `900 → 402.5 mm`** (`Exterior On`) | `X = 900` → `600` → `500` → `402.5 mm` (`RF-16`) | `0` → `203` → `~640` → `1,942` tris (`1:1` per-frame tracking at `59.8 FPS`) | `900`: `247,690` B (`d56f0ed3...`) · `600`: `252,434` B (`a8fb709d...`) · `500`: `246,866` B (`f47cd026...`) · `402.5`: `281,294` B (`f63e3a4e...`) | At `900 mm` engine is uncut (`0` caps); at `600 mm` fan shroud & upper intake pipe cap; at `500 mm` serpentine belt, pulleys & charge pipe cap; at `402.5 mm` full block/pan/valve-cover section caps (**PASS**). |
| **4. Side (`Y`) mode `@ -185 mm`** | `RF-17` (`Y @ -185 mm`, `Exterior Off`) | `2,600` tris (`1,275` static + `1,325` dyn), `75` desktop / `39` phone calls | `166,424` B (`0d53729977f9ed43553307b2a427be55b5510e3ac4aabf7d712ca064864a8ec1`) | Longitudinal RH bank heads, 4 pistons & intake-valve stems capped cleanly; LH bank & valley clipped away (**PASS**). |

---

## 7. Single-Render, No-Stencil & Frozen-File Audits (Spec §§12.1, 12.3)

1. **Single `renderer.render(` & no-stencil / no-RT source invariant (`sectionCaps.test.ts` Test 6):**
   - `renderer.render(` count in `src/renderer/engineScene.ts`: **`1`** (line `1853`).
   - Occurrences across `src/renderer/**` of `new THREE.WebGLRenderTarget(`, `stencil: true`, `renderer.clearStencil`, `renderer.setRenderTarget`, `scene.overrideMaterial`, `logarithmicDepthBuffer`: **`0`**.
2. **Frozen-file `git diff main` audit (§12.1):**
   - `git diff main -- src/core src/perf catalog src/config src/audio src/assets src/main.ts .github vite.config.ts tsconfig.json package.json package-lock.json public/models public/hdri public/legacy public/Duramax_LLY_2005_66L_V8.glb assets-src src/renderer/exteriorLoader.ts src/renderer/layout.ts src/renderer/partLoader.ts src/renderer/partVariants.ts src/renderer/variantLoader.ts src/renderer/viewLayout.ts src/renderer/viewLayout.test.ts docs/M2-MEASUREMENTS.md docs/M3-MEASUREMENTS.md docs/M4-MEASUREMENTS.md docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M7-MEASUREMENTS.md docs/M8-VARIANTS.md docs/M8-MEASUREMENTS.md docs/M9-SOUND.md docs/M9-MEASUREMENTS.md docs/M10-EXTERIOR.md docs/M10-MEASUREMENTS.md docs/specs docs/research docs/PLANNING.md docs/ORCHESTRATOR.md docs/ASSET_CONTRACT.md` → **`0` lines (empty)**.
   - All `16` GLB assets (`public/Duramax_LLY_2005_66L_V8.glb` + `15` GLBs in `public/models/`) are **byte-identical** to `main`.

---

## 8. Exact Commands Used (Spec §10.2)

```powershell
# Typecheck, unit/integration suite (95 tests across 20 files), and production bundle build
npm run typecheck
npm test
npm run build

# Production preview server for ?benchmark=1 and ?rf=RF-6, RF-14..RF-17 captures
npx vite preview --port 4173 --strictPort

# Normative frozen-file & GLB byte-identity audit (§12.1)
git diff main -- src/core src/perf catalog src/config src/audio src/assets src/main.ts .github vite.config.ts tsconfig.json package.json package-lock.json public/models public/hdri public/legacy public/Duramax_LLY_2005_66L_V8.glb assets-src src/renderer/exteriorLoader.ts src/renderer/layout.ts src/renderer/partLoader.ts src/renderer/partVariants.ts src/renderer/variantLoader.ts src/renderer/viewLayout.ts src/renderer/viewLayout.test.ts docs/M2-MEASUREMENTS.md docs/M3-MEASUREMENTS.md docs/M4-MEASUREMENTS.md docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M7-MEASUREMENTS.md docs/M8-VARIANTS.md docs/M8-MEASUREMENTS.md docs/M9-SOUND.md docs/M9-MEASUREMENTS.md docs/M10-EXTERIOR.md docs/M10-MEASUREMENTS.md docs/specs docs/research docs/PLANNING.md docs/ORCHESTRATOR.md docs/ASSET_CONTRACT.md
```
