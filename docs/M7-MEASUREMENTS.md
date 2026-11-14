# Milestone 7 Measurements — GLB Regeneration, Byte-Identity Audit & D-033 Budget Compliance

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) (Milestone 7) · Decisions: D-033, D-034, D-035 · Spec: [`docs/specs/M7-verified-data.md`](./specs/M7-verified-data.md) · Verified data record: [`docs/M7-DATA.md`](./M7-DATA.md) · Normative budgets: [`docs/M2-MEASUREMENTS.md`](./M2-MEASUREMENTS.md) §5 · Prior measurements: [`docs/M3-MEASUREMENTS.md`](./M3-MEASUREMENTS.md), [`docs/M4-MEASUREMENTS.md`](./M4-MEASUREMENTS.md)

---

## 1. Cylinder-1 GLB Regeneration Record & Byte-Identity Audit (Spec §§5.3, 5.4)

Regenerated from the 43-key [`assets-src/dimensions.json`](../assets-src/dimensions.json) using [`assets-src/blender/build_cylinder1.py`](../assets-src/blender/build_cylinder1.py) in headless **Blender `5.2.3 LTS`** (`hash e13b728c6880`). Because every procedural mesh builder uses fixed radial/axial tessellation counts, per-file and assembly triangle counts are **unchanged** (`0` delta across all 10 files), while vertex positions reflect the Milestone 7 verified dimensions:

| GLB Asset (`public/models/`) | Disposition (Spec §5.3) | Bytes (M6 `main` → M7) | File Triangles (Before → After) | M2 File Cap (`≤ 15,000`) | Cyl-1 Assembly (`× inst`) | V8 Engine (`× inst`) | M7 SHA-256 |
| --- | --- | ---: | ---: | :---: | ---: | ---: | --- |
| `rot_piston_c1_stock.glb` | Regenerated (`CH 49.8`, `pin Ø 34.5`) | `145,132 → 145,132` | `4,832 → 4,832` (`0`) | **PASS** | `4,832` (`×1`) | `38,656` (`×8`) | `7565393c9c333fce82b96cd266cfbc8e3b7fd522e99d6c164b42a8a2f988d0dc` |
| `rot_conrod_c1_stock.glb` | Regenerated (`pin journal Ø 62.9`, `wrist Ø 34.5`) | `39,900 → 39,908` | `1,180 → 1,180` (`0`) | **PASS** | `1,180` (`×1`) | `9,440` (`×8`) | `52a05cb32358de270896d648981d98a3868f2a585f77d110e418d0337f0e7644` |
| `rot_crankthrow_c1_stock.glb` | Regenerated (`pin Ø 62.9`, `main Ø 79.9`) | `39,984 → 39,988` | `1,352 → 1,352` (`0`) | **PASS** | `1,352` (`×1`) | `5,408` (`×4`) | `946d36bf5ef11b1bcafde24f98bacdf9995720e796aeee412e78f9cf7a72d540` |
| `sta_head_c1_stock.glb` | Regenerated (`deck B 264.3`, per-channel recesses) | `110,008 → 110,008` | `3,532 → 3,532` (`0`) | **PASS** | `3,532` (`×1`) | `28,256` (`×8`) | `7ef6cd611e2420a70142bb42fc653ec3299e2354e55abd4da5ea1d45ff97598d` |
| `val_valve_intake_stock.glb` | Regenerated (`head Ø 33.0`, spring unchanged) | `92,032 → 92,036` | `4,504 → 4,504` (`0`) | **PASS** | `9,008` (`×2`) | `72,064` (`×16`) | `61ca1bba6ef65c20f7063f364e46624d2f6c08228b9279239b82d356beb24839` |
| `val_valve_exhaust_stock.glb` | Regenerated (`head Ø 31.0`, spring unchanged) | `92,044 → 92,040` | `4,504 → 4,504` (`0`) | **PASS** | `9,008` (`×2`) | `72,064` (`×16`) | `44a8bfd96804cab431a4935b43c5b37a34c0c026e8badd2cb572680ef909d5c0` |
| `val_pushrod_stock.glb` | Regenerated (`Ø 11.1`, `len 244`; lifter decoupled `Ø 23.85`) | `30,024 → 30,792` | `1,272 → 1,272` (`0`) | **PASS** | `2,544` (`×2`) | `20,352` (`×16`) | `142eda882b56bd2db591edefc4a65b0981871024426c75360453a1168106446f` |
| `val_rocker_stock.glb` | Regenerated (`cups W -16.9 / +13.6`, `pr Ø 11.1`) | `39,116 → 39,164` | `1,240 → 1,240` (`0`) | **PASS** | `1,240` (`×1`) | `9,920` (`×8`) | `214df0a23bd78434dcc8cfd7413fc637ded441adec69fc8d68214051b063367c` |
| `val_bridge_stock.glb` | **Byte-identical to `main`** | `14,772 → 14,772` | `408 → 408` (`0`) | **PASS** | `816` (`×2`) | `6,528` (`×16`) | **`5728b24f328a00f16538cd1c5638140b5447f3b5f28fbeca7ccbf8601d40aae2`** |
| `fuel_injector_c1_stock.glb` | **Byte-identical to `main`** | `26,728 → 26,728` | `924 → 924` (`0`) | **PASS** | `924` (`×1`) | `7,392` (`×8`) | **`64b9bab8b3a60d39348e8e8e447250bc64caaf31c1735e24821092f2e5d42397`** |
| **Cylinder-1 / V8 GLB Totals** | **8 regenerated, 2 byte-identical** | `629,740 → 630,568` | **`23,748 → 23,748`** | **PASS** | **`34,436`** (`≤ 60,000` **PASS**) | **`270,080`** | — |

### Required Byte-Identity Hashes vs. `main` (Spec §5.3, §9.1)
- **`public/models/val_bridge_stock.glb`:**
  - `main` (`3036099`): `5728b24f328a00f16538cd1c5638140b5447f3b5f28fbeca7ccbf8601d40aae2`
  - `m7-verified-data` (regenerated): `5728b24f328a00f16538cd1c5638140b5447f3b5f28fbeca7ccbf8601d40aae2` — **IDENTICAL (`git diff` empty)**
- **`public/models/fuel_injector_c1_stock.glb`:**
  - `main` (`3036099`): `64b9bab8b3a60d39348e8e8e447250bc64caaf31c1735e24821092f2e5d42397`
  - `m7-verified-data` (regenerated): `64b9bab8b3a60d39348e8e8e447250bc64caaf31c1735e24821092f2e5d42397` — **IDENTICAL (`git diff` empty)**
- **`assets-src/fixture/axis_fixture.glb` & `public/Duramax_LLY_2005_66L_V8.glb`:** untouched (`git diff` empty; exterior shell `29,660` raw accessor triangles / `31,396` merged scene triangles).
- **Turned main crankshaft primitive (`buildMainCrankShaftMesh`):** radius updated `32.40 mm → 39.95 mm` (`0.5 × mainJournalDiameterMm`, rear flange `52.5 mm` and front pulley `57.0 mm` preserved as absolute radii `< 62 mm` crank web radius); fixed `36`-segment `LatheGeometry` keeps **`1,080` triangles** (`≤ 3,000` M3 cap).

---

## 2. Head Deck Recess Assertion & Recomputed M7 Clearances (Spec §§3, 5.2.2, 6, 11)

### 2.1 `build_cylinder1.py` Logged `deck_b` & Recess-Window Output
Verbatim stdout from headless Blender regeneration:
```text
[M3 §4 head recess assertion PASS] deck_b=264.3 mm; recess_floor_x=42.009 mm (<= 43.0); window_1_w=[-8.550, 16.565] mm (covers [-8.0, +11.0]); window_2_w=[21.226, 41.800] mm (covers [+26.0, +41.0], opens valley edge 37.02 mm)
```
*(Per Spec Amendment 2, `win2_w0_mm` / `win2_w1_mm` carry the symmetric M3 §4 window clamps `min(..., 26.0)` / `max(..., 2.20 × pr_valley_mm)` matching `win1`; the unclamped exhaust envelope `39.987 mm` already exceeds `slab_half_y_mm = 37.025 mm`, and `deck_xy` cuts straight from `w2_lo = 21.226 mm` through `+slab_half_y = 37.025 mm`, opening `[21.226 mm, +∞)` with zero mesh-vertex change.)*

### 2.2 Shipped-Test Clearance Summary (`verifiedData.test.ts`, `layout.test.ts`)

| Check | Threshold / Spec Pin | Measured from Shipped Configs | Margin | Status |
| --- | --- | ---: | ---: | :---: |
| Piston-to-intake-valve clearance (`0°–720°`, `0.25°` & `0.01°` steps) | `1.80 ± 0.05 mm` (`≥ 0`) | **`1.802 mm`** (`@ α = 362.00°`) | `+1.802 mm` | **PASS** |
| Piston-to-exhaust-valve clearance (open window `110°–350°`) | `2.98 ± 0.05 mm` (`≥ 0`) | **`2.979 mm`** (`@ α = 350.00°`) | `+2.979 mm` | **PASS** |
| Piston-to-exhaust-valve clearance (full cycle `0°–720°`) | `≥ 1.99 mm` (`= deckGap`) | **`2.000 mm`** (`@ α = 0°/360°/720°`) | `+2.000 mm` | **PASS** |
| Intake pushrod center to **own** bore axis (`B ∈ [88.5, 262.3] mm`) | `> 56.975 mm` (`51.425 + 5.55`) | **`58.629 mm`** | `+1.654 mm` | **PASS** |
| Exhaust pushrod center to **own** bore axis (`B ∈ [88.5, 262.3] mm`) | `> 56.975 mm` | **`58.459 mm`** | `+1.484 mm` | **PASS** |
| Intake pushrod center to **neighboring** bore axis (`±115 mm`) | `> 56.975 mm` | **`57.307 mm`** | **`+0.332 mm`** | **PASS** |
| Exhaust pushrod center to **neighboring** bore axis (`±115 mm`) | `> 56.975 mm` | **`74.017 mm`** | `+17.042 mm` | **PASS** |
| Intake / exhaust lifter centers to **own** bore axis (decoupled `r = 11.925`) | `> 63.350 mm` (`51.425 + 11.925`) | **`66.573 mm` / `65.192 mm`** | `+3.223 / +1.842 mm` | **PASS** |
| Intake / exhaust lifter centers to **neighboring** bore axis | `> 63.350 mm` | **`69.116 mm` / `97.082 mm`** | `+5.766 / +33.732 mm` | **PASS** |
| Cross-cylinder pushrod center distance (`Ø 11.1 mm` tubes) | `> 25.00 mm` (test 6) | **`26.018 mm`** | `+14.918 mm` surface | **PASS** |
| Nearest lifter-to-lifter center spacing (`Ø 23.85 mm` bodies) | `> 30.00 mm` (test 6) | **`30.610 mm`** | `+6.760 mm` surface | **PASS** |
| Shared-pin inter-rod axial gap & pin-end margin (`27.7 mm` big ends) | `> 0.00 mm` | **`0.72 mm` gap / `0.96 mm` end** | `+0.72 / +0.96 mm` | **PASS** |

---

## 3. Runtime `renderer.info`, GPU Memory & Frame-Time Results (Spec §5.4 / D-033)

### 3.1 Measurement Environment
- **Machine:** `Intel(R) Core(TM) Ultra 7 256V`, `15.7 GiB` RAM, Windows 11 (`x64`)
- **GPU / WebGL Backend:** `ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (8GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)` (WebGL 2)
- **Browser:** Chromium `152.0.7977.167` (`Antigravity/2.32.1` built-in browser)
- **Workload:** Production build (`npm run build && npx vite preview`), continuous animation at **900 RPM (`1×` speed)** after all 10 internal GLBs, the 2k studio HDRI, and the registered exterior GLB finished loading plus a **60-frame warmup**, sampled over **10.0 seconds** (`~600` frames) via `?benchmark=1` with active foreground tab polling.

### 3.2 Observed `renderer.info` & 10-Second `@ 900 RPM` Telemetry Matrix

| Metric | `Full` — Exterior **Off** (`1440×900`, Default) | `Full` — Exterior **On** (`1440×900`) | `Phone` — Exterior **Off** (`390×844`, `Auto` $\to$ `phone`) | `Phone` — Exterior **On** (`390×844`, `Auto` $\to$ `phone`) |
| --- | ---: | ---: | ---: | ---: |
| **Scene asset triangles** | **271,224** | **302,620** | **271,224** | **302,620** |
| **`render.triangles` (submitted/frame)** | **542,384** *(2×271,160 + 64)* | **573,780** *(542,384 + 31,396)* | **271,224** *(1 pass, no shadow)* | **302,284** *(4 tiny ext meshes frustum-culled; `302,620` max)* |
| **`render.calls` (incl. shadow pass)** | **73** *(36 shadow + 37 main)* | **95** *(36 shadow + 59 main)* | **37** *(main pass only)* | **55** *(`59` max unculled)* |
| **`render.lines`** | **0** | **0** | **0** | **0** |
| **`memory.geometries`** | **34** *(32 instanced + shaft + floor)* | **56** *(34 + 22 merged ext)* | **34** | **53** *(uploaded; `56` resident)* |
| **`memory.textures` (uploaded to WebGL)** | **4** *(PMREM + shadow + 2 LUTs)* | **8** *(+ 4 exterior maps)* | **2** *(shadow map disposed)* | **5** *(PMREM + LUT + exterior maps)* |
| **Resident Texture + HDRI VRAM** | **27.25 MiB** *(20.75 MiB active)* | **27.25 MiB** | **11.25 MiB** *(4.75 MiB active)* | **11.25 MiB** |
| **Sampled frames (`~10.00 s`)** | `599` (`10,000.0 ms`) | `601` (`10,016.6 ms`) | `600` (`10,000.1 ms`) | `600` (`10,000.0 ms`) |
| **Average frame time (`rAF`)** | **16.694 ms (59.90 FPS)** | **16.667 ms (60.00 FPS)** | **16.667 ms (60.00 FPS)** | **16.667 ms (60.00 FPS)** |
| **`p50` / `p95` / `min` / `max` frame time** | `16.7 / 16.8 / 16.0 / 33.4 ms` | `16.7 / 16.8 / 16.4 / 16.9 ms` | `16.7 / 16.8 / 16.4 / 17.0 ms` | `16.7 / 16.8 / 16.4 / 17.0 ms` |
| **Synchronous CPU `update + render`** | **0.788 ms avg** (`1.40 ms` p95) | **0.952 ms avg** (`1.50 ms` p95) | **0.585 ms avg** (`1.10 ms` p95) | **0.760 ms avg** (`1.50 ms` p95) |

### 3.3 Normative Budget Compliance Table (Spec §5.4 / D-033)

Both `Full` and `Phone` tiers pass every normative D-033 budget with Exterior **Off** (default) and Exterior **On**:

| Normative Metric (`M2-MEASUREMENTS.md` §5) | Desktop (`Full`) Budget | Measured `Full` (Ext Off / Ext On) | `Full` Status | `Phone` Budget | Measured `Phone` (Ext Off / Ext On) | `Phone` Status |
| --- | ---: | ---: | :---: | ---: | ---: | :---: |
| **Scene asset triangles** | `≤ 360,000` | `271,224` / `302,620` | **PASS** | `≤ 320,000` | `271,224` / `302,620` | **PASS** |
| **Submitted triangles / frame** | `≤ 700,000` | `542,384` / `573,780` | **PASS** | `≤ 400,000` | `271,224` / `302,284` (`302,620` max) | **PASS** |
| **Draw calls / frame (incl. shadow)** | `≤ 250` | `73` / `95` | **PASS** | `≤ 120` | `37` / `55` (`59` max) | **PASS** |
| **Texture + HDRI GPU memory** | `≤ 64 MiB` | `27.25 MiB` (`20.75 MiB` active) | **PASS** | `≤ 32 MiB` | `11.25 MiB` (`4.75 MiB` active) | **PASS** |
| **Frame time @ 900 RPM whole-engine** | `≤ 16.7 ms` (60 FPS) | **`16.694 ms`** (`0.79 ms` CPU) / **`16.667 ms`** | **PASS** | `≤ 33.3 ms` (≥ 30 FPS) | **`16.667 ms`** (`0.59 ms` CPU) / **`16.667 ms`** | **PASS** |
