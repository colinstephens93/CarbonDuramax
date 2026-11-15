# Milestone 11 — Capped-Solid Cutaways Technique Record

Project: Duramax LLY Engine Lab · Governing spec: [`docs/specs/M11-capped-cutaways.md`](./specs/M11-capped-cutaways.md) · Decision: [`docs/DECISIONS.md`](./DECISIONS.md) (`D-043`) · Measurements: [`docs/M11-MEASUREMENTS.md`](./M11-MEASUREMENTS.md) · Implementation: [`src/renderer/sectionCaps.ts`](../src/renderer/sectionCaps.ts), [`src/renderer/engineScene.ts`](../src/renderer/engineScene.ts)

---

## 1. Adopted Technique & Rationale

Milestone 11 replaces the Milestone 4 open-shell clipping look with **runtime CPU cross-section extraction, loop welding, containment-depth hole classification, and Earcut triangulation** (`D-043`).

When Section mode (`Front–Back (X)` or `Side (Y)`) is active, the CPU intersects every visible, non-ghosted clippable part's triangles (or closed local `ConvexHull` proxy in the sole case of the 32 helical valve springs) with the world-space section plane, welds the resulting 2-D plane segments into closed contours, classifies outer rings and true interior holes by even-odd containment depth, triangulates each polygon group via Three.js's built-in `ShapeUtils.triangulateShape`, and writes the triangles into two pre-allocated `BufferGeometry` meshes (`section_cap_static` and `section_cap_dynamic`) sharing a single unlit, 45°-hatched cut-bronze `ShaderMaterial`.

Both cap meshes render inside the **single existing `renderer.render(scene, camera)` pass** with `depthTest = true`, `depthWrite = true`, `castShadow = false`, and `receiveShadow = false`:
- **GPU cost:** exactly **`+2` draw calls** (`96 → 98` desktop stock, `58 → 60` phone stock; `97 → 99` desktop 5-variant, `60 → 62` phone 5-variant) and **`874–3,909` cap triangles** across benchmark and drag states (`≤ 16,000` ceiling), **`+0 MiB` VRAM**, **`0` stencil bits**, **`0` `WebGLRenderTarget`s**, and **`0` extra passes**.
- **CPU cost:** static sources rebuild only when dirty (`1.4–3.4 ms` median, `2.8–5.1 ms` p95 across Desktop and Phone sweeps vs `≤ 8.0 / 16.0 ms` budgets); dynamic sources rebuild once per rendered frame (`0.7–1.8 ms` median, `1.2–3.1 ms` p95 at `X = 402.5` and `Y = -185`, `2.45–3.85 ms` median / `4.4–5.0 ms` p95 when slicing directly through a valve-spring row at `X = 380.5`, vs `≤ 6.5 / 13.0 ms` budgets).
- **Dependencies & frozen layers:** **`0` new npm dependencies**; `src/core/**`, `src/perf/**`, `src/config/**`, `catalog/**`, `src/audio/**`, `src/assets/**`, all 16 GLBs, and `src/main.ts` are untouched.

---

## 2. Rejected Alternatives & Measured Evidence (Spec §§2.1, 14.2)

Every standard real-time section-capping alternative was evaluated quantitatively against the pinned D-033 budgets (`700,000` desktop / `400,000` phone submitted triangles; `250` / `120` draw calls; `16.7` / `33.3 ms` frame time) and visual truthfulness criteria before selecting runtime CPU cross-section triangulation:

| Candidate Technique | Measured / Computed Cost | Visual & Architectural Outcome | Verdict |
| --- | --- | --- | :---: |
| **1. Stencil-buffer capping** (front/back increment-decrement + plane quad, full scene) | `+119` calls, `+616,520` submitted tris → Desktop `215` calls / **`1,196,004` tris** (breaches `700,000` by `+70.9%`); Phone `177` calls (breaches `120`) / **`924,396` tris** (breaches `400,000` by `+131.1%`) | Requires recreating WebGL context with `stencil: true` (`STENCIL_BITS = 0` by default) + multi-pass state management; fails on the 5 non-watertight exterior shell `partId`s (`ext_vc_fasteners_1/2`, `ext_inj_return_line_2`, `ext_exh_manifold_lh/rh_2`) | **Rejected** |
| **2. Stencil-buffer capping** (smallest subset covering `RF-6` + `RF-14`…`RF-17`: pistons + heads + shell, `104,012` scene tris × 2 stencil passes) | `+63` calls, `+208,024` submitted tris → Desktop `159` calls / **`787,508` tris** (breaches `700,000`); Phone **`121` calls** (breaches `120`) / **`515,900` tris** (breaches `400,000`) | Still breaches D-033 on **both** tiers while leaving rods, crank throws, valves, bridges, rockers, pushrods, lifters, injectors, and main shaft uncapped (hollow rods/throws right next to solid pistons in `RF-6`/`RF-14`) | **Rejected** |
| **3. Single-pass `!gl_FrontFacing` fragment-shader fill** (project back-facing fragments onto plane via `gl_FragDepth`) | `+0` calls, `+0` submitted tris; GPU timer delta **`+2.7–3.2 ms/frame`** over open-shell sectioned frame (`5.83/7.53 ms → 9.00/10.19 ms`), plus `gl_FragDepth` disables early-Z | **Not a cap:** every back-facing triangle anywhere behind the plane projects forward onto the plane, painting a flat hatched wall over intact rear cylinders (`4–42 %` of viewport changed depending on threshold; `4.23 %` at `RF-6` with `> 20/255`). Without `gl_FragDepth`, kept geometry in front of back faces is still overwritten inside part silhouettes | **Rejected** |
| **4. Global per-mesh `ConvexHull` proxies** | Shell section area at `X = 402.5 mm`: **`0.310 m²`** vs true scanline section **`0.211–0.213 m²`** (**`+46.9 %` overfill**) | Bridges V-valley, cylinder bores, and multi-part material-merged shell buckets into bloated convex blobs | **Rejected** *(used locally only for the 2 helical spring batches)* |
| **5. Pre-baked section meshes / runtime 3-D CSG (`three-bvh-csg`)** | Pre-bake breaks continuous `[−150, +900] mm` / `[−580, +580] mm` slider + live Explode + variant swaps; 3-D CSG requires a new npm dependency + full 3-D Boolean rebuilds across `270,080` moving triangles | Solves a 3-D volume problem when local fragment clipping already solves the kept 3-D surface and only the 2-D planar cross-section is needed | **Rejected** |

---

## 3. Slice, Component Partition, Weld, Hole Classification & Triangulation Contract

Implemented in [`src/renderer/sectionCaps.ts`](../src/renderer/sectionCaps.ts) as pure, WebGL-free geometry stages testable directly in Node (`src/renderer/sectionCaps.test.ts`):

### 3.1 Pinned Geometry Constants
- `SECTION_SLICE_EPSILON_MM = 1e-4` (`0.1 µm` plane-crossing deadband)
- `SECTION_WELD_QUANTUM_MM = 1e-3` (`1.0 µm` 2-D endpoint quantisation grid; `INV_WELD_QUANTUM = 1,000`)
- `COINCIDENT_POINT_DIST_SQ_MM2 = 1e-12` (`(1e-6 mm)²` per-triangle crossing deduplication threshold)
- `MIN_LOOP_AREA_MM2 = 1e-6` (filters degenerate/colinear sliver noise before triangulation)
- `SECTION_CAP_MAX_TRIANGLES = 16_000` (normative D-033 cap-triangle ceiling; buffers grow dynamically only if ever needed)

### 3.2 Load-Time 3-D Connected-Component Partitioning (`prepareCapSource`)
`exteriorLoader.ts` merges the 92 exterior shell features by PBR material signature into `23` `BufferGeometry` buckets (`12` global + `11` preserved subtrees). A single material bucket can therefore hold disjoint 3-D parts whose 2-D projections overlap at a cut plane (for example, `ext_cp3_2` in the V-valley nested inside `ext_block_1`'s outer contour at `X = 402.5 mm`, or `ext_mount_rh_1` nested inside `ext_block_1` at `Y = -185 mm`). Slicing an entire merged bucket as one polygon soup would misclassify the inner solid part's outer contour as an odd-depth (`depth = 1`) hole inside the outer block contour.

`prepareCapSource(source)` partitions each source's triangle soup once at asset load time into **3-D position-welded connected surface components** (`1e-5 m` weld quantum using a zero-string, open-addressed `Int32Array` hash table + path-compressed union-find, cached per `BufferGeometry` via `WeakMap`) and precomputes each component's tight local `THREE.Box3`. Disjoint solid parts in a merged bucket are sliced independently (so `ext_cp3_2` and `ext_block_1` each cap at `depth = 0`), while genuine multi-wall hollow parts (tubes, ducts, annular bosses, and synthetic hollow-cylinder fixtures) remain a single component or nested concentric loops within one component whose inner wall classifies at `depth = 1` (hole).

### 3.3 World-Axis AABB Pre-Filter (`boundsCrossPlane`)
Before touching a source's or component's vertex array, `boundsCrossPlane(bounds, matrixWorld, isX, positionMm)` projects the local `Box3` onto world `X` or `Y` in `O(1)` (`6` multiplies + additions on row `0` or `1` of `matrixWorld`) and skips any source/instance/component that does not straddle `positionMm + ε` (`minMm <= p + ε && maxMm > p + ε`). Because `buildSectionPlane` keeps `coord <= positionMm` (`normal = (-1, 0, 0)` or `(0, -1, 0)`), an object resting flush on `coord <= positionMm` (`maxMm <= p + ε`) has zero clipped volume and emits zero cap triangles (pinned by `sectionCaps.test.ts` Test 5f at stock defaults `X = 900 mm` and `Y = 580 mm`).

### 3.4 Triangle–Plane Intersection (`sliceMeshAtPlane`)
For each triangle transformed into world millimetres against active plane `(mode, p)`:
1. Signed distances `d0, d1, d2 = coord - p` (with `|d| <= 1e-4 mm` snapped to `0`).
2. Skip if all three vertices lie strictly on the same side (`d > 0` or `d < 0`) or all three lie on the plane (`d0 === 0 && d1 === 0 && d2 === 0`, coplanar face).
3. Collect crossings across the three edges (`d_a === 0` emits vertex `a`; `d_a * d_b < 0` linearly interpolates `t = d_a / (d_a - d_b)`), deduplicate coincident crossings within `(1e-6 mm)²` (`COINCIDENT_POINT_DIST_SQ_MM2 = 1e-12`), and emit one 2-D segment `(u0, v0) -> (u1, v1)` in plane coordinates (`X` plane → `(y, z)` mm; `Y` plane → `(x, z)` mm) iff two distinct points remain.

### 3.5 Quantised Endpoint Welding, T-Junction Turn Heuristic & Local Chord Closure (`weldAndTraceLoops`)
1. **53-bit integer grid welding (`0.001 mm`):** Quantises `(qu, qv) = (round(u * 1000), round(v * 1000))` and packs both signed 26-bit integers into one exact IEEE-754 safe integer key `(qu + PACK_OFFSET) * PACK_STRIDE + (qv + PACK_OFFSET)` (zero string allocations in the normal range), discarding zero-length welded segments (`id0 === id1`).
2. **Degree-aware tracing:** Traces open paths starting from odd-degree (`deg === 1` first, then higher odd degrees) vertices so open chains on non-watertight meshes never fragment closed cycles; then traces remaining closed loops.
3. **Largest-dot-product turn heuristic at `deg >= 3` T-junctions:** Increments `ambiguousJunctions` when multiple unvisited outgoing edges exist and selects the unvisited outgoing edge maximizing `dot(d_in, d_out)` (most-collinear continuation), preventing figure-8 merges across shared ribs or T-junctions. Any residual self-touching vertex inside a closed walk (`visitedPosInWalk[nextVert] > 0`) is peeled inline inside `traceFrom` into a simple closed sub-cycle before continuing the outer walk.
4. **Local chord closure for non-watertight parts:** Open chains (such as the `2` fastener chains at `X = 402.5 mm` from the `5` audited non-watertight exterior shell `partId`s: `ext_vc_fasteners_1` `336` boundary edges, `ext_vc_fasteners_2` `168`, `ext_inj_return_line_2` `32`, `ext_exh_manifold_lh_2` `32`, `ext_exh_manifold_rh_2` `32`) are closed locally in the plane by a single straight chord between their two endpoints, validated for non-self-intersection via `isSimplePolygon` (`closedChains` incremented), or discarded and counted in `droppedGroups` if self-intersecting or zero-area.

### 3.6 Winding-Independent Containment Classification & Earcut Triangulation (`classifyLoops`, `triangulateLoops`)
1. Loops with `|signedArea| <= 1e-6 mm²` (`MIN_LOOP_AREA_MM2`) are discarded.
2. Pairwise containment (`isLoopContainedInLoop`) tests interior ray-casting across loop vertices and edge midpoints after bbox filtering.
3. Even containment depth (`0, 2, ...`) defines an **outer ring**; odd depth (`1, 3, ...`) defines a **hole** assigned to its immediate `depth - 1` parent (`classifyLoops` never relies on CW/CCW loop winding).
4. `ShapeUtils.triangulateShape(contourVec2, holesVec2)` (fed from a grow-only pool of `THREE.Vector2` instances because Three's `removeDupEndPts` invokes `Vector2.equals`) triangulates each `(outer, holes)` group; vertex `(u, v)` mm values write directly to `sectionUV` (`itemSize = 2`) and convert to world metres on the plane (`(p_m, u_m, v_m)` for `X`, `(u_m, p_m, v_m)` for `Y`) in `positions` (`itemSize = 3`).

---

## 4. Section Material, Colour & Hatch Constants

| Constant / Property | Value | Purpose |
| --- | --- | --- |
| `SECTION_CAP_COLOR_LINEAR` | `[0.290, 0.170, 0.086]` (linear sRGB; `≈ #93714d` sRGB pre-ACES) | Warm unlit cut-bronze fill distinct from all 12 shell PBR materials (`#c9cdd2` aluminum, `#2f3237` iron, `#16181b` rubber, `#9a6048` heat-tint, `#2d5fa8` filter blue, `#d6a928` yellow) and from the `0xf97316` orange firing highlight |
| `SECTION_CAP_HATCH_COLOR_LINEAR` | `[0.196, 0.112, 0.055]` (linear sRGB; `≈ #7a5c3c` sRGB pre-ACES) | Low-contrast darker bronze stripe (`~0.67×` luminance) that reads as a drafted technical section without moiré shimmer |
| `SECTION_CAP_HATCH_SPACING_MM` | `5.0 mm` | World-space perpendicular stripe pitch (`coord = (vSectionUV.x + vSectionUV.y) * 0.70710678` at `45°` in the cut plane, locked to world mm during slider motion and Explode) |
| `SECTION_CAP_HATCH_DUTY` | `1 / 3` (`0.3333...`) | Anti-aliased via `fwidth(phase)` `smoothstep` in fragment shader |
| `ShaderMaterial` pipeline | `fog: false`, `lights: false`, `transparent: false`, `depthWrite: true`, `depthTest: true`, `side: THREE.DoubleSide`, `clippingPlanes: null` | Includes `#include <tonemapping_fragment>` and `#include <colorspace_fragment>` so cap colours pass through `ACESFilmicToneMapping` (`1.1`) and `SRGBColorSpace` output identically to scene materials |

---

## 5. Cap Source Inventory, Spring Hull Exception & Rebuild Cadence

### 5.1 Registered Cap Sources (`src/renderer/engineScene.ts`)

| Set | Sources Registered | Scene Tris (Stock) | `skipWhenGhosted` | `hullOnly` | Rebuild Cadence |
| --- | --- | ---: | :---: | :---: | --- |
| **Static** (`section_cap_static`) | `main_crank_shaft` (`1` mesh, `1,080` tris), `head` (`8` instances × `2` prims, `28,256` tris), `injector` (`8` instances × `2` prims, `7,392` tris), `exteriorShell` (`23` meshes = `12` global + `11` preserved, `37,100` tris), plus up to `4` attached external variant models (`turbo_large`, `intake_highflow`, `exhaust_4in`, `intercooler_upgraded`) | `73,828` *(stock)* | `true` on `23` exterior shell meshes; `false` on all others | `false` | Only when `staticCapsDirty === true`: `setSectionState`, `setExplodeFactor`, `syncExteriorShellState` (Exterior / X-Ray toggle), `syncVisualVariants`, or GLB load completion |
| **Dynamic — Sliced** (`section_cap_dynamic`) | `piston_std` + `piston_firing` (`8` × `3` prims, `38,656` tris; plus `pistons_lowcomp` std/firing batches when selected), `conrod` (`8` × `3` prims, `9,440` tris), `crankthrow` (`4` × `3` prims, `5,408` tris), `intake_valve` (`16`, `16,640` tris), `exhaust_valve` (`16`, `16,640` tris), `bridge` (`16`, `6,528` tris), `rocker_in_rh` / `rocker_ex_rh` / `rocker_in_lh` / `rocker_ex_lh` (`16`, `9,920` tris), `pushrod` (`16`, `13,440` tris), `lifter` (`16`, `6,912` tris) | `123,584` *(stock)* | `false` | `false` | Every rendered frame in `update()` while `sectionMode !== 'off'` (including while paused, §5.7) |
| **Dynamic — Spring Hulls** (`section_cap_dynamic`) | `intake_spring` (`16` instances) + `exhaust_spring` (`16` instances), each backed by a load-time `ConvexHull` (`326` hull tris/spring × `32` = `10,432` hull tris/frame replacing `110,848` fine helical wire tris) | `10,432` *(hull tris)* | `false` | **`true`** | Every rendered frame in `update()` while `sectionMode !== 'off'`, transformed by each spring's live `InstancedMesh` compression/lift matrix |

*(The studio ground disc `groundMesh` at `Z = -0.245 m` is excluded from `clippableMaterials` per M4 §4 and is therefore never registered as a cap source.)*

### 5.2 Solid-Section Convention (§2.2)
All internal and exterior GLB castings are authored as closed single-surface solids rather than thin-walled dual-surface castings. Extracting their exact cross-section therefore fills enclosed interior volumes (crankcase bay, oil-pan sump, piston under-crown) as solid hatched material, while keeping genuine exterior/two-wall openings (swept cylinder bore above a BDC piston, inter-part clearances, annular tube bores) open. Consequently, when `Exterior = On` and `X-Ray = Off` (`RF-16`), the exterior block/pan/valve-cover section legitimately occludes internal parts behind the cut plane; toggling **X-Ray On** (`skipWhenGhosted: true` suppresses shell caps) or **Exterior Off** (`RF-6`, `RF-14`, `RF-15`, `RF-17`) reveals the capped internal assemblies.

---

## 6. Failure Modes & Artifact Register (`A1`–`A7`, Spec §4.6)

| ID | Failure Mode (Spec §4.6) | Prevention & Expected Behaviour | As-Built Verification |
| --- | --- | --- | --- |
| **A1** | **Missing cap** on a visibly cut part (degenerate section / non-watertight source) | `ε = 1e-4 mm` half-open vertex snap; `1e-3 mm` integer weld grid; odd-degree-first walk + largest-dot T-junction turn heuristic; inline figure-8 sub-cycle peeling; open chains closed locally by a chord with `isSimplePolygon` validation; counters (`openChains`, `closedChains`, `droppedGroups`, `hullOnlySources`) exposed per rebuild on `EngineRenderStats` | **`0` missing caps** in all 5 named frames (`RF-6`, `RF-14`…`RF-17`); **`droppedGroups = 0`** across all benchmark states (`X = 402.5` stock/5-variant/X-Ray, `Y = -185`); `2` fastener open chains at `X = 402.5` cleanly closed (`openChains = 2`, `closedChains = 2`) |
| **A2** | **Overfill** — the cap extends beyond the true cross-section | Impossible for sliced sources by construction (exact triangle–plane intersection + 3-D connected-component partitioning + even-odd containment holes), **except** the two spec-sanctioned local cases: (i) local `ConvexHull` proxies on the 2 helical spring batches (`intake_spring`, `exhaust_spring`), and (ii) local single-chord closure of a non-watertight open chain | True cylinder bores, multi-wall duct bores (`sectionCaps.test.ts` Test 3 within `0.2%` of `π(r_o² - r_i²)`), and inter-part clearances stay open; `RF-16` V-valley has zero overfill and zero false holes |
| **A3** | **Z-fighting / depth-order artifact** — cap vs part or cap vs cap | All cap vertices lie on the exact mathematical cut plane (`clippingPlanes: null` on cap material while scene materials discard `distanceToPoint < 0`), sharing one unlit colour/hatch shader (`depthTest = true`, `depthWrite = true`) with `castShadow = false` and `receiveShadow = false` | Clean, crisp cut silhouettes and zero coplanar shimmer or shadow-acne stripes across all 5 reference frames and live slider sweeps |
| **A4** | **Firing highlight leak** — an orange cut face | Cap meshes use the shared unlit bronze `ShaderMaterial` rather than part PBR materials; orange firing emissive (`0xf97316` @ `0.85`) exists only on `pistonFiringMaterials` outer surfaces | Verified in `RF-6` and `RF-17` (`θ = 0°`, Cyl 1 firing): cut faces are pure hatched bronze while orange emissive stays strictly on un-cut outer piston surfaces |
| **A5** | **Hatch swimming / stretching** | Hatch stripe phase is driven by the world-space `sectionUV` attribute (`(u, v)` in mm on the section plane, `5.0 mm` perpendicular pitch at `45°`, `1/3` duty) rather than UVs or screen coordinates | Plane-locked uniform world spacing across parts of every scale; translates cleanly when the plane moves along its normal and never rotates, stretches, or zooms with camera orbit |
| **A6** | **CPU overrun** — rebuild cost above budget | World-axis AABB pre-filter (`boundsCrossPlane`), load-time `Int32Array`-hashed 3-D component cache (`prepareCapSource`), `326`-tri spring hull proxies, and pooled steady-state scratch buffers (`sectionCaps.ts`) keep rebuilds well inside §6.3 targets (`≤ 8 / 16 ms` static, `≤ 6.5 / 13 ms` dynamic) | Static `p95 = 2.8–5.1 ms` (`≤ 8 / 16 ms`); dynamic `p95 = 1.2–3.1 ms` (`4.4–5.0 ms` slicing spring row at `X = 380.5`, `≤ 6.5 / 13 ms`); **`0` dropped frames** across all `7,212` benchmark frames |
| **A7** | **Spring hull cap** — a plane through a spring shows a solid elliptical section rather than coils | Intentional per the §2.2 solid-section convention: each spring instance slices its cached `326`-triangle `ConvexHull` (strictly local to that spring's `~32 × 32 × 53 mm` envelope, never a global mesh hull) | Verified at `X = 380.5 mm` (`2,054` dynamic cap tris, solid local spring-envelope caps); none of the 5 acceptance frames (`X = 402.5`, `Y = -185`) cut a spring row (`RF-15` and `RF-17` show intact coils behind the plane) |
