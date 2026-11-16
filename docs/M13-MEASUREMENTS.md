# Milestone 13 — Internal-Part Visual Variants Measurements

Project: Duramax LLY Engine Lab · Governing spec: [`docs/specs/M13-internal-variants.md`](./specs/M13-internal-variants.md) · Part & catalog record: [`docs/M13-INTERNAL-VARIANTS.md`](./M13-INTERNAL-VARIANTS.md) · Prior baselines: [`docs/M12-MEASUREMENTS.md`](./M12-MEASUREMENTS.md), [`docs/M11-MEASUREMENTS.md`](./M11-MEASUREMENTS.md), [`docs/M10-MEASUREMENTS.md`](./M10-MEASUREMENTS.md), [`docs/M9-MEASUREMENTS.md`](./M9-MEASUREMENTS.md)

---

## 1. Environment, Exact Commands, Production Bundle & Page-Weight Delta (Spec §§7.8, 9, 12.8, 13.2)

- **Host & Toolchain:** Windows 11 x64 (`Intel(R) Core(TM) Ultra 7 256V`), Node `v24.16.0`, TypeScript `tsc --noEmit` (`0` errors), Vitest `v3.2.7` (**`23` test files, `114 / 114` tests passing** — `104` prior tests + `10` new M13 tests; strictly `2` new + `6` edited test files touched per Spec §9 / §13.2, plus test fixture `src/catalog/__fixtures__/modified.pre-m13.json`), Vite `v7.3.8` (`42` modules transformed), headless Blender `5.2.3 LTS` (`e13b728c6880`), dedicated Chrome `157.0.8103.51` (`ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (8GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)`, WebGL 2).
- **Shipped Production Bundle (`npm run build`):**
  - `dist/index.html`: **`1,445 B`** / `1.45 kB` (`640 B` / `0.64 kB` gzip)
  - `dist/assets/index-ZMbJsyN4.js`: **`826,233 B`** / **`826.23 kB`** (**`221,200 B`** / **`221.20 kB` Vite default gzip**; `220,469 B` level-9 gzip) — `+1,907 B` minified (`+1.91 kB`) / `+540 B` (`+0.54 kB`) gzip over `main`'s `dist/assets/index-ul-6Egty.js` (`824,326 B` / `220,660 B` gzip), with **`0` new npm dependencies**.
- **Rod Variant Asset File Size & Page-Weight Delta (Spec §§7.8, 12.8, 13.5):**
  - `public/models/variants/rot_conrod_c1_forged.glb` (Blender `5.2.3 LTS`): **`47,976 B`** (`46.85 KiB` — `97.61 %` of the `49,152 B` / `48.00 KiB` cap; `1,176 B` headroom; provisional uncommitted 4.0.2 planning figure `28,008 B` superseded by actual 5.2.3 build per Spec §7.8 / §15.1).
  - **Raw startup page-weight delta vs M9 baseline (`10,050,510 B`, `docs/M9-MEASUREMENTS.md` §1.2):** **`+47,976 B` = `+0.4773 %`** for the rod GLB (`≤ +0.4890 %` cap-conservative ceiling at `49,152 B`), and `+49,883 B` = `+0.4963 %` including the `+1,907 B` minified JS delta.
- **Exact Commands Executed:**
  ```powershell
  # 1. Deterministic forged connecting-rod GLB build & binary read-back in Blender 5.2.3 LTS
  & "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python assets-src/blender/build_rod_variant.py

  # 2. Typecheck, unit/asset suite (114 tests across 23 files), and production bundle build
  npm run typecheck
  npm test
  npm run build

  # 3. Production preview server for ?benchmark=1 matrix and ?rf=RF-1..RF-22 captures
  npx vite preview --port 4173 --strictPort

  # 4. Dedicated isolated Chrome CDP session (--remote-debugging-port=9222, separate --user-data-dir)
  & "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="<scratch>\chrome-m13-profile" about:blank

  # 5. Normative frozen-file git diff audit (Spec §13.1)
  git diff --exit-code main -- src/core src/perf src/config src/audio src/assets src/renderer/exteriorLoader.ts src/renderer/layout.ts src/renderer/partLoader.ts src/renderer/variantLoader.ts src/renderer/viewLayout.ts src/renderer/sectionCaps.ts src/renderer/intakeCover.ts src/main.ts src/catalog/index.ts catalog/stock.json catalog/schema.json public/Duramax_LLY_2005_66L_V8.glb public/models/rot_piston_c1_stock.glb public/models/rot_conrod_c1_stock.glb public/models/rot_crankthrow_c1_stock.glb public/models/sta_head_c1_stock.glb public/models/val_bridge_stock.glb public/models/val_pushrod_stock.glb public/models/val_rocker_stock.glb public/models/val_valve_exhaust_stock.glb public/models/val_valve_intake_stock.glb public/models/fuel_injector_c1_stock.glb public/models/intake_cover_lly.glb public/models/variants/turbo_unit_engine_large.glb public/models/variants/intake_tract_engine_highflow.glb public/models/variants/exhaust_system_engine_4inch.glb public/models/variants/intercooler_core_engine_upgraded.glb public/models/variants/rot_piston_c1_lowcomp.glb public/hdri public/legacy assets-src/blender/build_cylinder1.py assets-src/blender/build_variants.py assets-src/blender/build_shell.py assets-src/blender/build_intake_cover.py assets-src/dimensions.json assets-src/variant_dimensions.json assets-src/cover_dimensions.json assets-src/shell_dimensions.json docs/M2-MEASUREMENTS.md docs/M3-MEASUREMENTS.md docs/M4-MEASUREMENTS.md docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M7-MEASUREMENTS.md docs/M8-VARIANTS.md docs/M8-MEASUREMENTS.md docs/M9-SOUND.md docs/M9-MEASUREMENTS.md docs/M10-EXTERIOR.md docs/M10-MEASUREMENTS.md docs/M11-CUTAWAYS.md docs/M11-MEASUREMENTS.md docs/M12-COVER.md docs/M12-MEASUREMENTS.md docs/PLANNING.md docs/ORCHESTRATOR.md docs/THREE_API_NOTES.md
  ```

---

## 2. Forged Rod Asset Build Log & Binary Read-Back Audit (Spec §§4.1–4.5, 9 Tests 1–2, 13.3)

Built deterministically in headless Blender `5.2.3 LTS` (`e13b728c6880`) via `assets-src/blender/build_rod_variant.py` reading interface inputs from `assets-src/dimensions.json` and placeholder shank/fastener parameters from `assets-src/rod_variant_dimensions.json`, and verified independently in `src/renderer/rodVariant.test.ts`:

| Property | Spec Contract / Cap | Measured `public/models/variants/rot_conrod_c1_forged.glb` | Stock Reference (`rot_conrod_c1_stock.glb`) | Verdict |
| --- | --- | --- | --- | :---: |
| File size | `≤ 49,152 B` (`48.00 KiB`) | **`47,976 B`** (`46.85 KiB`) | `39,908 B` (`38.97 KiB`) | **PASS** |
| SHA-256 | Recorded | `816e24357b1d191ed7dd3d4bbe327d5e8179cc6178ab701371c7a0b953c1053d` | `52a05cb32358de270896d648981d98a3868f2a585f77d110e418d0337f0e7644` | Recorded |
| Hierarchy & pivot | Root `rot_conrod_c1_forged` @ `(0,0,0)` + child `rot_conrod_smallend_c1_forged` @ `(0, 0, 163.0) mm` | `(0.000, 0.000, 0.000)` + child `(0.000, 0.000, 163.000) mm` | `(0.000, 0.000, 0.000)` + child `(0.000, 0.000, 163.000) mm` | **PASS** |
| Triangles / instance | `≤ 1,400` (`+1,760` cap scene delta) | **`1,372`** (`1,084` rod + `288` small-end; **`+1,536`** scene delta) | `1,180` (`892` rod + `288` small-end) | **PASS** |
| Primitives / materials | `3` indexed `POSITION`+`NORMAL` primitives / `3` untextured `MeshStandardMaterial`s | **`3` primitives / `3` materials** (`0` net draw-call delta) | `3` primitives / `3` materials | **PASS** |
| Images / textures / UVs / skins / morphs / animations / `if_*` | `0` across all seven categories | **`0 / 0 / 0 / 0 / 0 / 0 / 0`** (`+0.00 MiB` VRAM) | `0 / 0 / 0 / 0 / 0 / 0 / 0` | **PASS** |
| Watertightness (`1e-5 m` weld) | `0` boundary, `0` non-manifold, **`10` closed components** | **`0` boundary / `0` non-manifold / `10` closed components** | `0` / `0` / `10` closed components | **PASS** |
| Part-local bounds (mm) | `X ±13.838`, `Y ±48.725`, `Z −42.143…186.805` (`±0.10`) | `X [−13.838, +13.838]`, `Y [−48.725, +48.725]`, `Z [−42.143, +186.805]` | Identical | **PASS** |
| Stock interface: c2c / journal / pin / width (mm) | `163.0` / `62.9` / `34.5` / `27.676` (`±0.05`) | **`163.000` / `62.900` / `34.500` / `27.676`** | `163.000` / `62.900` / `34.500` / `27.676` | **PASS** |
| Beam flange outer Y — big end (mm) | `30.343 ± 0.20` *(vertex-extracted)* | **`30.343`** (`+4.214 mm` vs stock) | `26.129` | **PASS** |
| Beam flange outer Y — small end (mm) | `18.568 ± 0.20` *(vertex-extracted)* | **`18.568`** (`+2.381 mm` vs stock) | `16.187` | **PASS** |
| Flange thickness Y (mm) | `8.177 ± 0.20` *(vertex-extracted)* | **`8.177`** (`+1.887 mm` vs stock) | `6.290` | **PASS** |
| Central web half-width X (mm) | `5.258 ± 0.20` *(vertex-extracted)* | **`5.258`** (`+0.830 mm` vs stock) | `4.428` | **PASS** |
| Clearances: inter-rod / outer-bore / beam-bore / beam-piston (mm) | `0.724` / `2.775` / `21.157` / `21.082` | **`0.724` / `2.775` / `21.157` / `21.082`** | `0.724` / `2.775` / `25.371` / `25.296` | **PASS** |

---

## 3. Scene Baseline, Rod Delta & Combined Internal Triangle Accounting (Spec §§5.1, 5.3, 13.8, 15.4)

| Scene / Internal State | Formula | Triangles | Phone Headroom (`320,000 − tris`) | Desktop Headroom (`360,000 − tris`) | Notes |
| --- | --- | ---: | ---: | ---: | --- |
| Stock V8 internal (`rods_stock` + `pistons_stock`) | `221,984 + 9,440 + 38,656` | **`270,080`** | — | — | `baseNonPistonInternalTriangles = 221,984` |
| Internal with `rods_forged` (`1,372 × 8`) | `221,984 + 10,976 + 38,656` | **`271,616`** | — | — | Measured rod delta **`+1,536`** (`+1,760` at `1,400` cap → `271,840`) |
| **Combined internal runtime (`rods_forged` measured + `pistons_lowcomp` shipped)** | `221,984 + 10,976 + 31,744` | **`264,704`** | — | — | Verified live in browser (`combinedExtOff`/`combinedExtOn`); never old-branch `263,168` |
| **Combined internal runtime at rod cap (`11,200` + `31,744`)** | `221,984 + 11,200 + 31,744` | **`264,928`** | — | — | Old-branch stock-rod control = **`263,168`** (`221,984 + 9,440 + 31,744`) |
| **Combined internal cap-only (`11,200` + `41,600` piston cap)** | `221,984 + 11,200 + 41,600` | **`274,784`** | — | — | Cap-level dropped-rod control = **`273,024`** (`221,984 + 9,440 + 41,600`) |
| Stock full scene (Exterior On, Cover Off) | `270,080 + 1,080 + 64 + 37,100` | **`308,324`** | `11,676` (`3.65 %`) | `51,676` (`14.35 %`) | Shipped baseline |
| Stock + `rods_forged` (measured) + Cover (`1,040`) | `308,324 + 1,536 + 1,040` | **`310,900`** | **`9,100` (`2.84 %`)** | **`49,100` (`13.64 %`)** | Measured live in `?benchmark=1` |
| Stock + `rods_forged` (cap `1,400`) + Cover (cap `1,800`) | `308,324 + 1,760 + 1,800` | **`311,884`** | `8,116` (`2.54 %`) | `48,116` (`13.37 %`) | Spec §7.4 cap-conservative row |
| M8 5-variant worst scene (`rods_stock`, Cover Off) | `308,324 − 6,912 − 6,500 + 9,720` | **`304,632`** | `15,368` (`4.80 %`) | `55,368` (`15.38 %`) | Shipped M8 5-variant build |
| 6-variant (`5 M8 + rods_forged` measured) + Cover (`1,040`) | `304,632 + 1,536 + 1,040` | **`307,208`** | **`12,792` (`4.00 %`)** | **`52,792` (`14.66 %`)** | Measured live in `?benchmark=1` (`308,192` at rod+cover caps) |
| **Derived cap guard (all 6 variant caps + cover cap)** | `308,324 − 6,500 + 10,800 + 2,944 + 1,800 + 1,760` | **`319,128`** | **`872` (`0.2725 %`)** | **`40,872` (`11.35 %`)** | **PASS** (`partVariants.test.ts` Test 9) |

---

## 4. Runtime `?benchmark=1` Matrix & D-033 Verdict (Spec §§7.1–7.9, 13.5)

### 4.1 Protocol
- **Server & Browser:** `npx vite preview --port 4173 --strictPort` · dedicated Chrome `157.0.8103.51` (`devicePixelRatio = 1`, WebGL 2 on `Intel(R) Arc(TM) 140V GPU`).
- **Sampling:** `60`-frame warmup after `detailedLoaded && hdriLoaded && exteriorLoaded && variantsLoaded && intakeCoverLoaded`, followed by `10.0 s` (`601` frames) at `900 RPM` (`1×`). `5-Var` = `turbo_large,intake_highflow,exhaust_4in,intercooler_upgraded,pistons_lowcomp`; `6-Var` = `5-Var + rods_forged`.

### 4.2 Desktop (`1440×900`, `Full` Tier, `VRAM = 20.75 MiB`, `4` Textures, M11 §3.2 Baseline `p95 = 16.8 ms`)

| Metric | Stock · `rods=off` · `cov=0` | Stock · `rods=on` · `cov=0` | Stock · `rods=on` · `cov=1` | 5-Var · `rods=off` · `cov=0` | 6-Var · `rods=on` · `cov=0` | 6-Var · `rods=on` · `cov=1` | Stock · `rods=on` · `cov=1` · `X@388.3` | 6-Var · `rods=on` · `cov=1` · `X@388.3` | ExtOff · `rods=on` · `X@388.3` (`RF-22`) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `visibleSceneTriangles` | `308,324` | **`309,860`** | **`310,900`** | `304,632` | **`306,168`** | **`307,208`** | **`310,900`** | **`307,208`** | **`272,760`** |
| Desktop headroom (`360k − tris`) | `51,676` | `50,140` | `49,100` | `55,368` | `53,832` | `52,792` | `49,100` | `52,792` | `87,240` |
| `internalSceneTriangles` | `270,080` | **`271,616`** | **`271,616`** | `263,168` | **`264,704`** | **`264,704`** | **`271,616`** | **`264,704`** | **`271,616`** |
| `triangles` (submitted / frame) | `579,484` | **`582,556`** | **`583,596`** | `568,880` | **`571,952`** | **`572,992`** | **`586,990`** | **`576,357`** | **`547,690`** |
| `calls` (draw calls / frame) | `96` | **`96`** (`+0`) | **`98`** | `97` | **`97`** (`+0`) | **`99`** | **`100`** | **`101`** | **`75`** |
| `sectionCapTriangles` | `0` | `0` | `0` | `0` | `0` | `0` | **`3,394`** | **`3,365`** | **`2,234`** |
| `sectionCapStaticMs` / `DynamicMs` | `0 / 0` | `0 / 0` | `0 / 0` | `0 / 0` | `0 / 0` | `0 / 0` | `4.8 / 1.4` | `3.0 / 1.1` | `1.5 / 1.3` |
| `open / closed / dropped / hull` | `0/0/0/0` | `0/0/0/0` | `0/0/0/0` | `0/0/0/0` | `0/0/0/0` | `0/0/0/0` | `4/4/0/2` | `4/4/0/2` | `0/0/0/2` |
| `frameCount` (`elapsedMs`) | `601` (`10,015.2`) | `601` (`10,016.0`) | `601` (`10,015.1`) | `601` (`10,015.0`) | `601` (`10,014.9`) | `601` (`10,014.4`) | `601` (`10,013.9`) | `601` (`10,013.9`) | `601` (`10,014.2`) |
| `avgFrameTimeMs` (`avgFps`) | `16.664` (`60.01`) | `16.666` (`60.00`) | `16.664` (`60.01`) | `16.664` (`60.01`) | `16.664` (`60.01`) | `16.663` (`60.01`) | `16.662` (`60.02`) | `16.662` (`60.02`) | `16.663` (`60.01`) |
| **`p50 / p95 / min / max` (ms)** | **`16.7 / 16.8 / 15.2 / 17.0`** | **`16.7 / 16.9 / 15.8 / 17.5`** | **`16.7 / 16.8 / 15.1 / 17.2`** | **`16.7 / 16.8 / 14.9 / 17.2`** | **`16.7 / 16.8 / 15.0 / 17.1`** | **`16.7 / 16.8 / 14.5 / 17.2`** | **`16.7 / 17.1 / 13.9 / 17.6`** | **`16.7 / 16.8 / 14.0 / 17.7`** | **`16.7 / 16.8 / 14.1 / 17.1`** |
| **`p95` Δ vs M11 `16.8 ms` (`≤ +0.30`)** | `+0.00 ms` | **`+0.10 ms`** | **`+0.00 ms`** | `+0.00 ms` | **`+0.00 ms`** | **`+0.00 ms`** | **`+0.30 ms`** | **`+0.00 ms`** | **`+0.00 ms`** |
| **`droppedFrames`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** |
| `avgCpuRenderMs` (`p95CpuRenderMs`) | `1.089` (`1.8`) | `1.041` (`1.7`) | `1.078` (`1.8`) | `1.090` (`1.9`) | `0.954` (`1.5`) | `1.222` (`1.9`) | `2.176` (`2.7`) | `2.127` (`2.7`) | `1.800` (`2.4`) |

### 4.3 Phone (`390×844`, `Phone` Tier, `VRAM = 4.75 MiB`, `2` Textures, M11 §3.3 Baseline `p95 = 17.0 ms`)

| Metric | Stock · `rods=off` · `cov=0` | Stock · `rods=on` · `cov=0` | Stock · `rods=on` · `cov=1` | 5-Var · `rods=off` · `cov=0` | 6-Var · `rods=on` · `cov=0` | 6-Var · `rods=on` · `cov=1` | Stock · `rods=on` · `cov=1` · `X@388.3` | 6-Var · `rods=on` · `cov=1` · `X@388.3` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `visibleSceneTriangles` | `308,324` | **`309,860`** | **`310,900`** | `304,632` | **`306,168`** | **`307,208`** | **`310,900`** | **`307,208`** |
| Phone headroom (`320k − tris`) | `11,676` (`3.65 %`) | **`10,140` (`3.17 %`)** | **`9,100` (`2.84 %`)** | `15,368` (`4.80 %`) | **`13,832` (`4.32 %`)** | **`12,792` (`4.00 %`)** | **`9,100` (`2.84 %`)** | **`12,792` (`4.00 %`)** |
| `internalSceneTriangles` | `270,080` | **`271,616`** | **`271,616`** | `263,168` | **`264,704`** | **`264,704`** | **`271,616`** | **`264,704`** |
| `triangles` (submitted / frame) | `307,876` | **`309,412`** | **`310,452`** | `304,512` | **`306,048`** | **`307,088`** | **`313,846`** | **`310,453`** |
| `calls` (draw calls / frame) | `58` | **`58`** (`+0`) | **`60`** | `60` | **`60`** (`+0`) | **`62`** | **`62`** | **`64`** |
| `sectionCapTriangles` | `0` | `0` | `0` | `0` | `0` | `0` | **`3,394`** | **`3,365`** |
| `sectionCapStaticMs` / `DynamicMs` | `0 / 0` | `0 / 0` | `0 / 0` | `0 / 0` | `0 / 0` | `0 / 0` | `4.5 / 1.2` | `2.2 / 1.2` |
| `open / closed / dropped / hull` | `0/0/0/0` | `0/0/0/0` | `0/0/0/0` | `0/0/0/0` | `0/0/0/0` | `0/0/0/0` | `4/4/0/2` | `4/4/0/2` |
| `frameCount` (`elapsedMs`) | `601` (`10,015.4`) | `601` (`10,016.0`) | `601` (`10,015.3`) | `601` (`10,015.6`) | `601` (`10,015.5`) | `601` (`10,015.3`) | `601` (`10,014.7`) | `601` (`10,013.6`) |
| `avgFrameTimeMs` (`avgFps`) | `16.665` (`60.01`) | `16.666` (`60.00`) | `16.664` (`60.01`) | `16.665` (`60.01`) | `16.665` (`60.01`) | `16.664` (`60.01`) | `16.663` (`60.01`) | `16.662` (`60.02`) |
| **`p50 / p95 / min / max` (ms)** | **`16.7 / 16.8 / 15.4 / 17.2`** | **`16.7 / 16.8 / 16.0 / 16.9`** | **`16.7 / 16.8 / 15.2 / 17.1`** | **`16.7 / 16.8 / 15.6 / 16.9`** | **`16.7 / 16.8 / 15.4 / 17.1`** | **`16.7 / 16.8 / 15.3 / 16.9`** | **`16.7 / 16.8 / 14.6 / 17.1`** | **`16.7 / 16.8 / 13.8 / 16.9`** |
| **`p95` Δ vs M11 `17.0 ms` (`≤ +0.30`)** | `−0.20 ms` | **`−0.20 ms`** | **`−0.20 ms`** | `−0.20 ms` | **`−0.20 ms`** | **`−0.20 ms`** | **`−0.20 ms`** | **`−0.20 ms`** |
| **`droppedFrames`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** | **`0`** |
| `avgCpuRenderMs` (`p95CpuRenderMs`) | `0.716` (`1.1`) | `0.438` (`0.7`) | `0.841` (`1.3`) | `0.726` (`1.2`) | `0.724` (`1.1`) | `0.650` (`1.1`) | `1.728` (`2.0`) | `1.613` (`1.9`) |

### 4.4 D-033 Normative Budget & Section-On Bound Verdict Table (Spec §§7.1, 7.4, 7.5, 7.7)

| Normative Metric | D-033 Cap | Spec §7.4 / §7.7 Cap Bound | M13 Measured (`1,372` Rod + `1,040` Cover) | Tightest Headroom | Verdict |
| --- | ---: | ---: | ---: | --- | :---: |
| **Desktop** scene asset triangles | `360,000` | `311,884` stock / `308,192` worst (`319,128` guard) | **`310,900`** stock / **`307,208`** worst | **`49,100` (`13.64 %`)** measured / **`40,872` (`11.35 %`)** guard | **PASS** |
| **Phone** scene asset triangles | `320,000` | `311,884` stock / `308,192` worst (**`319,128` guard**) | **`310,900`** stock / **`307,208`** worst | **`9,100` (`2.84 %`)** measured / **`872` (`0.2725 %`)** guard | **PASS** |
| **Desktop** submitted tris (section off) | `700,000` | `584,804` stock / `574,200` worst | **`583,596`** stock / **`572,992`** worst | **`116,404` (`16.63 %`)** | **PASS** |
| **Phone** submitted tris (section off) | `400,000` | `311,436` stock / `308,072` worst | **`310,452`** stock / **`307,088`** worst | **`89,548` (`22.39 %`)** | **PASS** |
| **Desktop** submitted tris (section on `X@388.3`) | `700,000` | `≤ 600,804` stock / `≤ 590,200` worst (§7.7) | **`586,990`** stock / **`576,357`** worst | **`113,010` (`16.14 %`)** vs D-033 (`13,814` under §7.7 bound) | **PASS** |
| **Phone** submitted tris (section on `X@388.3`) | `400,000` | `≤ 327,436` stock / `≤ 324,072` worst (§7.7) | **`313,846`** stock / **`310,453`** worst | **`86,154` (`21.54 %`)** vs D-033 (`13,590` under §7.7 bound) | **PASS** |
| **Desktop** draw calls (off / section `X@388.3`) | `250` | `98 / 99` off; `≤ 100 / 101` section on | **`98 / 99`** off (`96 / 97` cov=0); **`100 / 101`** section on | **`149` (`59.60 %`)** | **PASS** |
| **Phone** draw calls (off / section `X@388.3`) | `120` | `60 / 62` off; `≤ 62 / 64` section on | **`60 / 62`** off (`58 / 60` cov=0); **`62 / 64`** section on | **`56` (`46.67 %`)** | **PASS** |
| **Desktop / Phone** texture + HDRI VRAM | `64.00 / 32.00 MiB` | `20.75 / 4.75 MiB` (`+0.00 MiB`) | **`20.75 / 4.75 MiB`** | **`43.25 / 27.25 MiB`** | **PASS** |
| **Section-cap total triangles (`X @ 388.3`)** | `≤ 16,000` | `≤ 16,000` | **`3,394`** stock+cov / **`3,365`** 6-var+cov / **`2,234`** `RF-22` | **`12,606` (`78.79 %`)** | **PASS** |
| **Desktop** frame time `p95` `@ 900 RPM` | `Δ ≤ +0.30 ms` vs `16.8` | `≤ 17.1 ms`, `0` dropped | **`16.8–17.1 ms`** (`16.8–16.9` section off; `0` dropped) | `0.00–0.30 ms` margin, **`0` dropped** | **PASS** |
| **Phone** frame time `p95` `@ 900 RPM` | `Δ ≤ +0.30 ms` vs `17.0` | `≤ 17.3 ms`, `0` dropped | **`16.8 ms`** across all `8` rows (`0` dropped) | `0.50 ms` margin, **`0` dropped** | **PASS** |

---

## 5. Section-Cap Triangle Audit Across Cutting Planes (`θ = 0°`, Spec §§6.3, 12.8, 13.5)

| Section Plane & Context (`θ = 0°`) | `rods_stock` Cap Tris | `rods_forged` Cap Tris | `rods_forged` Standalone Rod Cap Tris | Net Delta vs Stock Rod | Open Chains / Dropped Groups (Rod) | Total vs `16,000` Cap Ceiling | Verdict |
| --- | ---: | ---: | ---: | ---: | :---: | ---: | :---: |
| **`Section X @ 388.3 mm`** (`Exterior = Off`, `RF-22` plane — station-0 RH rod centre) | `2,218` (`510` rod) | **`2,234`** | **`526`** | **`+16`** | **`0 / 0`** | `2,234 ≤ 16,000` (`13.96 %`) | **PASS** |
| **`Section X @ 388.3 mm`** (`Exterior = On`, `Cover = Off`) | `3,344` | **`3,360`** | **`526`** | **`+16`** | **`0 / 0`** *(4 shell fastener chords)* | `3,360 ≤ 16,000` (`21.00 %`) | **PASS** |
| **`Section X @ 388.3 mm`** (`Exterior = On`, `Cover = On`) | `3,378` | **`3,394`** | **`526`** | **`+16`** | **`0 / 0`** *(4 shell fastener chords)* | `3,394 ≤ 16,000` (`21.21 %`) | **PASS** |
| **`Section X @ 402.5 mm`** (`Exterior = Off`, `RF-6` plane — `0.724 mm` inter-rod gap) | `874` (`0` rod) | **`874`** | **`0`** | **`0`** | **`0 / 0`** | `874 ≤ 16,000` (`5.46 %`) | **PASS** |
| **`Section Y @ −185.0 mm`** (`Exterior = Off`, `RF-17` plane — outboard of rod Y span) | `2,600` (`0` rod) | **`2,600`** | **`0`** | **`0`** | **`0 / 0`** | `2,600 ≤ 16,000` (`16.25 %`) | **PASS** |

---

## 6. Visual Reference Frames (`RF-21`, `RF-22`), `RF-1`…`RF-20` Manual Invariance & Interactive / Failure Checks (Spec §§8, 13.6–13.8)

### 6.1 Committed `RF-21` & `RF-22` Captures (`1440×900 → 1024×640` PNG, Gate `G-FRAME-M13`)

| Frame | Camera Pose `pos → target` (m, Project Z-up) | State (`variants: ['rods_forged']`, `Exterior = Off`) | PNG Bytes | Committed SHA-256 | Measured Cut-Face NDC & `G-FRAME-M13` Checklist Result |
| --- | --- | --- | ---: | --- | --- |
| [`RF-21`](./reference-frames/RF-21.png) | `[1.2800, −1.0800, 0.7400] → [0.3100, −0.0500, 0.1800]` *(exact `RF-10` camera pose)* | `θ = 90°`, `Explode = 100 %`, `Section = Off`, `X-Ray = Off`, `Labels = Off` (`272,760` scene tris, `73` calls) | `359,912` | `4a32df74623ee65b608c074a36618d6ac8d3d5ff65a04590c87778ceb3ab3712` | **PASS** (All `8` forged rods visible across the `4` spread stations; no stock rods; wider/thicker H-beam shanks & dark stepped 12-point cap fasteners legible; orange highlight on Cylinder 2 LH piston only) |
| [`RF-22`](./reference-frames/RF-22.png) | `[1.0600, −0.5400, 0.4800] → [0.2900, −0.0200, 0.1400]` *(exact `RF-6` camera pose)* | `θ = 0°`, `Explode = 0 %`, **`Section X @ 388.3 mm`**, `X-Ray = Off`, `Labels = Off` (`2,234` cap tris = `526` rod + `1,708` rest; `75` calls) | `399,451` | `995b33a0305516bef710f3d0f169ad54304909042b73fb0af81cdc707d64bb3b` | **PASS** (Measured variant rod cut-face NDC `x ∈ [−0.143, +0.157]`, `y ∈ [−0.512, −0.064]`, `z ∈ [0.954, 0.961]`; crisp 45°-hatched solid longitudinal section through station-0 RH forged rod; `0` open chains, `0` double-capping) |

### 6.2 Manual `RF-1`…`RF-20` Stock-Rod Invariance Comparison (Spec §§8.3, 12.8, 13.7)

All twenty existing reference-frame PNGs (`docs/reference-frames/RF-1.png`…`RF-20.png`) remain **byte-identical** to `main` (`0` bytes changed; none re-baselined). Live M13 captures of `?rf=RF-1`…`?rf=RF-20` (`1440×900 → 1024×640`) verified `rodVariantActive === false` on all `20` frames, and manual visual inspection in the 3D viewport (`393,300` non-HUD pixels, masking the top-left title/subtitle banner, right-hand control panel, and bottom-left caption) confirmed **zero forged-rod leakage and visually unchanged 3D rendering relative to `main`**:

| Frame Group | Frames | Committed PNGs Untouched | Manual Visual Comparison & Supporting Viewport Check (HUD Masked) | Verdict |
| --- | --- | :---: | --- | :---: |
| **Opaque exterior & M12 cover frames** | `RF-3`, `RF-8`, `RF-9`, `RF-11`, `RF-12`, `RF-13`, `RF-18`, `RF-19`, `RF-20` (`9` frames) | **Yes** (`0` diff bytes) | Visually indistinguishable 3D rendering (`pctGt20 = 0.0000 %` on `RF-3, 8, 11, 13, 18, 19`; `0.0003 %`–`0.0005 %` sub-pixel AA on `RF-9, 12, 20`). | **PASS** |
| **Post-M10/M11 X-Ray, exploded & section frames** | `RF-6`, `RF-7`, `RF-10`, `RF-14`, `RF-15`, `RF-16`, `RF-17` (`7` frames) | **Yes** (`0` diff bytes) | Visually inspected side-by-side (`RF-6` stock rod at `X = 402.5 mm` and `RF-10` stock rods with `pistons_lowcomp`): stock rods render identically with zero forged-rod geometry or cap delta (`0.0023 %`–`0.5136 %` pixels `> 20/255`, solely pre-existing `main` `D-044` Cylinder 1 head/lift history noted in `docs/M12-MEASUREMENTS.md:193`). | **PASS** |
| **Pre-M7 historical interior baselines** | `RF-1`, `RF-2`, `RF-4`, `RF-5` (`4` frames) | **Yes** (`0` diff bytes) | `rodVariantActive === false`, `rodSceneTriangles === 9,440`; 3D internal assembly renders identically to `main` (historical PNGs predate M7's verified rod-length/lift upgrade per `docs/M10-MEASUREMENTS.md:250` and `docs/M12-MEASUREMENTS.md:194`). | **PASS** |

### 6.3 Interactive & Scratch Load-Failure Fallback Verification (Spec §§5.8, 9 Test 12, 13.8)

| Check | Exercised State | Observed Telemetry & Visual Result | Verdict |
| --- | --- | --- | :---: |
| **1. Fresh-load default** | Navigate to `/` without query params | `#m6-slot-rods.value === 'rods_stock'`; `rodVariantActive: false`, `rodVariantTriangles: 1,372`, `rodSceneTriangles: 9,440`, `internalSceneTriangles: 270,080`; M13 subtitle and verbatim `.m8-build-note` rendered. | **PASS** |
| **2. Build dropdown select & stock restore** | Select `rods_forged` → restore `rods_stock` on `#m6-slot-rods` | `rodVariantActive: false → true → false`; `internalSceneTriangles: 270,080 → 271,616 → 270,080`; `calls: 73 → 73 → 73` (`0` draw-call delta). | **PASS** |
| **3. Combined `rods_forged + pistons_lowcomp + turbo_large`** | Select all three (`Exterior = Off` & `Exterior = On`) | `pistonVariantActive: true`, `rodVariantActive: true`; **`internalSceneTriangles === 264,704`** (`221,984 + 10,976 + 31,744`, proving the `QA-02` shared 3-term formula does not drop the `+1,536` rod delta to `263,168`); `visibleSceneTriangles: 265,848` (`Exterior = Off`) and **`302,752`** (`Exterior = On`, adding `turbo_large` delta). | **PASS** |
| **4. `X-Ray + Labels + Intake cover` with `rods_forged`** | Enable `Exterior`, `X-Ray`, `Intake cover`, `Labels` | Ghosted shell & cover (`0.22` opacity) reveal forged rods inside; exact **`23`** `.m4-label-chip` elements including `Connecting rod`; no 24th anchor. | **PASS** |
| **5. Scratch missing-GLB load-failure fallback** | Rename `dist/models/variants/rot_conrod_c1_forged.glb` and run `?benchmark=1&quality=full&exterior=1&cover=0&variants=rods_forged` | Benchmark completes cleanly (`status: "DONE"`, no hang); logs `Failed to load visual variant "rods_forged"`; reports `failedVariantIds: ["rods_forged"]`, `variantsLoaded: true`, `rodVariantActive: false`, `rodSceneTriangles: 9,440`, `internalSceneTriangles: 270,080`, `visibleSceneTriangles: 308,324` (stock rods remain visible). | **PASS** |

---

## 7. Frozen-File & SHA-256 Baseline Audit (Spec §§9 Test 11, 13.1, 14, 15.9)

- **Normative `git diff main` across all frozen directories/files (§13.1):** **`0` lines (empty)**.
- **Sanctioned one-line catalog diff (`catalog/modified.json`):** `git diff --numstat main -- catalog/modified.json` = **`1 1`** (`"modelPath": "models/variants/rot_conrod_c1_forged.glb"` on `rods_forged` only); verified against `src/catalog/__fixtures__/modified.pre-m13.json` (`7,122` LF bytes, SHA-256 `af6f0ce3bccc039943267ccbd7ad58a8f7817bb7410019dc30751656c443897c`).
- **Post-M13 `catalog/modified.json` LF SHA-256:** `509c90c7c02af0081e1b3fe1737c47991bd03f9b6195e6118df594663059d802` (`7,160` LF bytes; pinned in `src/renderer/rodVariant.test.ts` Test 11 and `src/renderer/intakeCover.test.ts` Test 12).
- **All 20 frozen binary & text SHA-256 hashes from Spec §15.9 (`10` stock GLBs, `intake_cover_lly.glb`, `Duramax_LLY_2005_66L_V8.glb`, `5` M8 variant GLBs, `catalog/stock.json`, `catalog/schema.json`, `src/core/interfaces.ts`):** verified byte-identical in `src/renderer/rodVariant.test.ts` Test 11.

---

## 8. Build Deviations

**None.** Both `RF-21` and `RF-22` passed every `G-FRAME-M13` checklist criterion at the exact camera poses and `X = 388.3 mm` section position pinned in Spec §5.5 / §8, and every D-033 budget and derived guard passed without adjustment.
