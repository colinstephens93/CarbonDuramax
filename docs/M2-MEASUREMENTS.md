# Milestone 2 Measurements, ×8 Extrapolation & Set Per-Tier Budgets

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) v2.2 (Milestone 2) · Decisions: D-004, D-024, D-025, D-033 · Spec: [`docs/specs/M2-detailed-cylinder.md`](./specs/M2-detailed-cylinder.md) (Revision 2)

Per **D-033**, the per-tier performance budgets in Section 5 of this document are the **set budgets from Milestone 2 exit** (subject to owner approval at the Milestone 2 preview); Milestone 3's job is to verify that the full 8-cylinder detailed engine + registered exterior GLB complies with them.

---

## 1. Material Assignment & Studio Look Implementation Choice

Per the Milestone 2 spec ("MeshStandardMaterial or MeshPhysicalMaterial, assigned in Blender or at load — builder's choice, recorded in the measurements doc"):

- **Material authoring:** PBR materials are authored directly in [`assets-src/blender/build_cylinder1.py`](../assets-src/blender/build_cylinder1.py) using Blender's `Principled BSDF` shader with calibrated linear-sRGB base albedos and the exact spec metallic/roughness parameters:
  - Piston cast aluminum: `metalness = 0.90`, `roughness = 0.38` (with darker cast-iron ring material `0.88 / 0.30` and polished steel wrist pin `0.94 / 0.20`)
  - Connecting rod forged steel: `metalness = 0.85`, `roughness = 0.42` (cap bolts `0.85 / 0.35`, small-end bronze bushing `0.88 / 0.32`)
  - Crank throw webs & pin journal steel: `metalness = 0.90`, `roughness = 0.30`
  - Cylinder head section cast aluminum: `metalness = 0.75`, `roughness = 0.55` (valve guides/seats/rocker shaft steel `0.85 / 0.35`)
  - Intake & exhaust valves steel: `metalness = 0.90`, `roughness = 0.25`
  - Helical valve springs blued steel: `metalness = 0.80`, `roughness = 0.45` (top retainers steel `0.85 / 0.35`)
  - Pushrods, rockers, and valve bridges steel: `metalness = 0.85`, `roughness = 0.35` (lifter roller `0.92 / 0.22`)
  - Center fuel injector: steel body (`0.88 / 0.30`) with dark polymer solenoid/connector top (`metalness = 0.40`, `roughness = 0.60`)
- **Runtime material class:** `GLTFLoader` (`three@0.187.0`) instantiates every exported Metallic-Roughness material as `THREE.MeshStandardMaterial` (zero procedural texture maps on internal parts; 100% vertex/material PBR + studio HDRI IBL).
- **Firing highlight:** At load time, `engineScene.ts` traverses `rot_piston_c1_stock`, clones its 3 `MeshStandardMaterial` instances once, and toggles `emissive = 0xf97316` (`emissiveIntensity = 0.85`) across all of them during Cylinder 1's `[0°, 90°)` firing window.
- **HDRI & shadow setup:** Poly Haven CC0 2k `studio_small_09_2k.hdr` (`2048×1024`, `6.02 MiB` uncompressed on disk) is loaded via `RGBELoader` and converted to a prefiltered `PMREMGenerator` environment cubemap (`scene.environment`, rotated `+90°` around `+X` for the Z-up project frame, `environmentIntensity = 0.8`), after which both the source `hdrTexture` and `pmremGenerator` are immediately disposed. `scene.background` is solid `0x0b0b0d` with exponential ground-edge fog (`FogExp2(0x0b0b0d, 0.11)`), `ACESFilmicToneMapping` at `toneMappingExposure = 1.1`, and one `2048×2048` `PCFSoftShadowMap` directional key light (`castShadow = true` enabled strictly on Cylinder 1's detailed assembly).

---

## 2. Per-Part GLB Triangle Counts & Cylinder 1 Assembly Total

All 10 part GLBs in `public/models/` are uncompressed glTF 2.0 binaries built headlessly by Blender `5.2.3 LTS` (`assets-src/blender/build_cylinder1.py`) from `assets-src/dimensions.json`.

| GLB File (`public/models/`) | File Size (Bytes) | Contract Node(s) & Per-Node Triangles | Per-File Triangles (Limit ≤ 15,000) | Cyl 1 Instances | Cyl 1 Assembly Triangles | Cyl 1 Mesh Primitives (Draw Calls) |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| `rot_piston_c1_stock.glb` | 145,132 | `rot_piston_c1_stock` (4,832) | 4,832 | 1× | 4,832 | 3 |
| `rot_conrod_c1_stock.glb` | 39,900 | `rot_conrod_c1_stock` (892), `rot_conrod_smallend_c1_stock` (288) | 1,180 | 1× | 1,180 | 3 |
| `rot_crankthrow_c1_stock.glb` | 43,824 | `rot_crankthrow_c1_stock` (1,000), `rot_crankpin_c1_stock` (352) | 1,352 | 1× | 1,352 | 3 |
| `sta_head_c1_stock.glb` | 109,144 | `sta_head_c1_stock` (3,516) | 3,516 | 1× | 3,516 | 2 |
| `val_valve_intake_stock.glb` | 92,032 | `val_valve_intake_stock` (1,040), `val_spring_intake_stock` (3,464) | 4,504 | 2× | 9,008 | 6 |
| `val_valve_exhaust_stock.glb` | 92,044 | `val_valve_exhaust_stock` (1,040), `val_spring_exhaust_stock` (3,464) | 4,504 | 2× | 9,008 | 6 |
| `val_pushrod_stock.glb` | 30,024 | `val_pushrod_stock` (840), `val_lifter_stock` (432) | 1,272 | 2× | 2,544 | 6 |
| `val_rocker_stock.glb` | 39,116 | `val_rocker_intake_stock` (620), `val_rocker_exhaust_stock` (620) | 1,240 | 1× | 1,240 | 4 |
| `val_bridge_stock.glb` | 14,772 | `val_bridge_stock` (408) | 408 | 2× | 816 | 4 |
| `fuel_injector_c1_stock.glb` | 26,728 | `fuel_injector_c1_stock` (924) | 924 | 1× | 924 | 2 |
| **Totals** | **632,716 (617.9 KiB)** | **15 contract nodes across 10 files** | **23,732** (unique) | — | **34,420** (≤ 60,000) | **39** |

- **Largest single GLB:** `rot_piston_c1_stock.glb` at **4,832 triangles** (32.2% of the 15,000 per-file cap).
- **Total Cylinder 1 detailed assembly:** **34,420 triangles** (57.4% of the 60,000 assembly cap). Note that the 4 helical coil springs (`4 × 3,464 = 13,856` triangles) account for 40.3% of the Cylinder 1 triangle total.

---

## 3. Observed Runtime `renderer.info` Metrics

Observed on the live production bundle (`npm run build && npm run preview`) framing the full engine (`camera.position = (centerXM + 0.72, -0.68, 0.52)`, `controls.target = (centerXM + 0.04, -0.02, 0.13)`):

| `renderer.info` Field | Observed Value | Exact Breakdown |
| --- | ---: | --- |
| `render.calls` | **126** | **39** (directional shadow pass: Cylinder 1 detailed meshes only) + **39** (main pass: Cylinder 1 detailed meshes) + **42** (Cylinders 2–8 M1 primitives: `7 × 6` meshes) + **1** (crank main line) + **1** (studio ground disc) + **2** (RH/LH translucent bank shells) + **2** (RH/LH `LineSegments` wireframes) |
| `render.triangles` | **71,892** | **34,420** (shadow pass: Cylinder 1 detailed assembly) + **34,420** (main pass: Cylinder 1 detailed assembly) + **2,884** (Cylinders 2–8 M1 primitives: `7 × 412` tris) + **80** (crank main cylinder) + **64** (studio ground disc) + **24** (2 translucent bank boxes) |
| `render.lines` | **24** | 2 bank wireframe `LineSegments` × 12 box edges |
| `memory.geometries` | **37** | 28 unique GLB primitive geometries + 5 M1 shared primitive geometries + 2 bank box/edge geometries + 1 crank main geometry + 1 studio ground disc geometry |
| `memory.textures` | **4** | 1 PMREM `HalfFloatType` cubeUV environment target (~`4.5 MiB`) + 1 `2048×2048` directional shadow map (~`16.0 MiB`) + 2 internal Three.js PBR/IBL lookup textures (`< 0.5 MiB`). Source `2048×1024` `.hdr` texture (`16 MiB` raw `HalfFloatType`) is disposed immediately after `PMREMGenerator.fromEquirectangular(...)` |

> **Three.js `0.187.0` `renderer.info` note:** With `renderer.info.autoReset = true` (default), `WebGLRenderer` resets `info.render` once at the start of `renderer.render(scene, camera)` prior to `shadowMap.render(...)`. Consequently, `render.calls` and `render.triangles` report the combined per-frame total across both the directional shadow-map pass and the main camera pass.

---

## 4. Frame-Time Methodology & Result

### Measurement Method
- **Machine:** `Intel(R) Core(TM) Ultra 7 256V` (8 logical processors), `15.7 GiB` RAM, Windows 11 (`win32 10.0.26200` x64)
- **GPU / WebGL Backend:** `ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (8GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)` (WebGL 2)
- **Browser:** Chromium `152.0.7977.167` (`Electron/44.9.1`, Antigravity built-in browser)
- **Viewport & Pixel Ratio:** `1440 × 900` CSS px, `devicePixelRatio = 1` (`effectivePixelRatio = 1`; capped at `2` in `engineScene.ts` for HiDPI displays)
- **Workload:** Production build (`vite build` + `vite preview`), default whole-engine camera framing all 8 cylinders + studio floor shadow, continuous animation at **900 RPM (`1×` speed)** after all 10 GLBs and the 2k HDRI finished loading plus a 30-frame shader/pipeline warmup, sampled over **10.0 seconds** via the opt-in `?benchmark=1` telemetry harness in `src/main.ts`. Both end-to-end `requestAnimationFrame` frame intervals and synchronous per-frame CPU render-submission durations (`performance.now()` around `scene.update(state)`) were recorded.

### Measured Result (10.0 s @ 900 RPM)

| Metric | Result |
| --- | --- |
| Sample window | `10,015.4 ms` (`601` frames) |
| Average frame time (`rAF` interval) | **`16.665 ms` (`60.01 FPS`, 60 Hz vsync-locked, 0 dropped frames)** |
| Median (`p50`) / `p95` / Min / Max frame time | `16.7 ms` / `16.9 ms` / `16.1 ms` / `17.3 ms` |
| Synchronous CPU `scene.update + renderer.render` | **`1.333 ms` average** (`2.100 ms` `p95` — **8.0%** of the `16.67 ms` 60 FPS frame budget) |

---

## 5. ×8 Extrapolation to the Full 8-Cylinder Engine & Set Per-Tier Budgets

### ×8 Extrapolation Analysis (Milestone 3 Full Engine)

Replacing Cylinders 2–8's primitives (`2,884` triangles, `42` draw calls) with the detailed assembly across all **8 cylinders**, plus registering the existing exterior GLB (`public/Duramax_LLY_2005_66L_V8.glb`, inspected at **`31,396` triangles**, `283` mesh primitives, `4` embedded textures, `1.97 MB` on disk):

1. **Triangles:**
   - **8 detailed cylinders (asset geometry):** `8 × 34,420 =` **`275,360` triangles**
   - **Registered exterior engine (`Duramax_LLY_2005_66L_V8.glb`):** **`31,396` triangles**
   - **Studio ground + static reference geometry:** **`~150` triangles**
   - **Projected M3 total scene asset triangles:** **`~306,906` triangles**
   - **Projected M3 submitted triangles/frame (`renderer.info.render.triangles`):**
     - With directional shadow casting on all 8 detailed cylinders (`main + shadow` passes): `2 × 275,360 + 31,396 + 150 ≈` **`582,266` submitted triangles/frame** (`~613,662` if the exterior shell also casts shadows).
     - Without a real-time shadow-map pass (e.g., phone tier with static/contact floor shadow): **`~306,906` submitted triangles/frame**.

2. **Draw Calls (Naive ×8 Cloning vs. Milestone 3 `InstancedMesh` Batching):**
   - **Naive `Object3D.clone()` (`×8`, unbatched):**
     - 8 detailed cylinders alone would issue `8 × 39 = 312` main-pass draw calls + `312` shadow-pass draw calls = **`624` draw calls**, plus up to `283` unmerged exterior GLB draw calls (`~900+` total draw calls, linear CPU submission scaling `~8 × 1.33 ms ≈ 10.6 ms` before exterior overhead) — unacceptable on phone GPUs/drivers.
   - **Milestone 3 `THREE.InstancedMesh` batching (required architectural path for M3):**
     - All 8 cylinders share identical stock part meshes (`8×` pistons with per-instance firing color/attribute, `8×` rods, `8×` crank throws, `8×` head sections, `8×` injectors, `16×` intake valves/springs, `16×` exhaust valves/springs, `16×` pushrods/lifters, `16×` bridges, `8×` intake/exhaust rockers).
     - Using `InstancedMesh` collapses the `8 × 39 = 312` internal draw calls down to **`28` instanced draw calls in the main pass + `28` in the shadow pass = `56` draw calls total for all 8 cylinders** (fewer draw calls for the entire V8 than Milestone 2 uses for Cylinder 1!).
     - Merging/batching static exterior GLB primitives by shared material in M3 reduces the exterior's `283` primitives to **`≤ 40–60` draw calls**, keeping full-engine Desktop draw calls comfortably under `200` (including shadows) and Phone draw calls under `120`.

3. **Frame Time & Memory Extrapolation:**
   - With `InstancedMesh` keeping draw calls low (`< 200` desktop / `< 120` phone), CPU transform updates for 8 cylinders (`computeState` already computes all 8 cylinders in M1/M2!) add `< 0.5 ms` of matrix math on top of M2's `1.33 ms` baseline (`~2–4 ms` total CPU frame cost on Desktop), comfortably holding **60 FPS (`16.7 ms`)** on Desktop and **≥ 30–60 FPS** on Phone.
   - Resident GPU texture + HDRI memory in M2 is **`~21 MiB`** (`4.5 MiB` PMREM `HalfFloatType` env target + `16.0 MiB` `2048²` shadow map + `< 0.5 MiB` LUTs, because the raw `16 MiB` `.hdr` buffer is disposed after PMREM generation). Adding the exterior GLB's 4 textures in M3 (`~4–16 MiB` depending on KTX2 compression) brings Desktop resident VRAM to **`~25–37 MiB`**; using a `1024²` or contact floor shadow + KTX2/1k exterior textures on Phone keeps Phone resident VRAM **`≤ 32 MiB`**.

---

### Set Per-Tier Performance Budgets (Milestone 2 Exit — D-025, D-033)

These are the **normative per-tier budgets** set from Milestone 2's measurements. Milestone 3 must verify that the full 8-cylinder detailed engine + exterior GLB complies on both tiers (using `InstancedMesh` batching, static exterior material batching, and `meshopt`/KTX2 compression where needed).

| Budget Metric | Desktop / Laptop Tier (Full Quality) | Phone Tier (Viewing + Simple Controls) | M2 Single-Cyl Baseline | Projected M3 Full V8 + Exterior (with `InstancedMesh`) |
| --- | --- | --- | --- | --- |
| **Total Scene Asset Triangles** (unique in-scene geometry, single pass) | **≤ 360,000** | **≤ 320,000** | 37,472 | ~306,900 (275.4k V8 internals + 31.4k exterior) |
| **Submitted Triangles / Frame** (`renderer.info.render.triangles`, incl. shadow pass) | **≤ 700,000** | **≤ 400,000** *(1 shadow caster group or contact shadow)* | 71,892 | ~582k–614k Desktop (2-pass) / ~307k Phone (contact shadow) |
| **Draw Calls / Frame** (`renderer.info.render.calls`, incl. shadow pass) | **≤ 250** | **≤ 120** | 126 | ~110–160 Desktop / ~75–95 Phone |
| **Resident Texture + HDRI GPU Memory** (post-PMREM disposal, incl. shadow map) | **≤ 64 MiB** | **≤ 32 MiB** | ~21 MiB | ~25–37 MiB Desktop / ~16–24 MiB Phone |
| **Target Frame Time (900 RPM whole-engine view)** | **≤ 16.7 ms (60 FPS)** | **≤ 33.3 ms (≥ 30 FPS)** | 16.67 ms (1.33 ms CPU) | ≤ 16.7 ms Desktop / ≤ 25–33 ms Phone |
