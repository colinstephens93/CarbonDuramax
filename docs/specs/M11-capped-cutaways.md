# Milestone 11 Spec — Capped-Solid Cutaways

Repo: `colinstephens93/CarbonDuramax` · Build branch: `m11-capped-cutaways` (create from `main` at `6dc2396`) · Planning branch: `plan/m11-capped-cutaways` · Planning package: this spec + [`docs/specs/M11-capped-cutaways-QA.md`](./M11-capped-cutaways-QA.md) (independent QA record) + [`docs/research/M11-capped-cutaways-survey.md`](../research/M11-capped-cutaways-survey.md) (shipped-sectioning survey, technique arithmetic and prototype evidence) + [`docs/research/M11-capping-techniques.md`](../research/M11-capping-techniques.md) (graded external facts) · Plan reference: **new milestone, not in PLAN.md v2.2** — Milestone 11 is added by this spec's paperwork deliverables (§11), per the anti-drift rule, and discharges the D-027 deferral and the M4 caption promise.

**What changes in one sentence:** when the Section view slices the engine, the app **computes the true cross-section of every clipped part at the plane on the CPU** and renders those polygons as a flat, hatched, single-colour cap mesh with real depth — so a cut piston, a cut cylinder head and the sectioned exterior shell read as solid material instead of hollow open shells, at the cost of **+2 draw calls, a few thousand cap triangles and a measured per-frame CPU rebuild** (no stencil buffer, no render target, no extra render pass, no shader depth trick).

**Coding is done by the user in Antigravity on branch `m11-capped-cutaways`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

---

## 1. What Milestone 11 is

Milestone 4 shipped the clipping cutaway and deliberately left it open-shelled: `docs/specs/M4-views.md:14` ("Capped solids remain deferred per the plan — cut faces show the open-shell look"), `:48` ("Capped solids are out of scope (plan-deferred): cut parts show hollow interiors — expected") and `:85` (the Views-panel line *"Cutaway shows open shells — capped solid sections come later."*). D-027 records capped-solid cutaway sections as a deferred candidate (`docs/DECISIONS.md:48`); the plan's post-M10 candidates line names it first (`docs/PLAN.md:74`). This milestone lands it.

1. **A technique decision with arithmetic and prototype evidence (§2.1, §4, §14):** stencil capping is rejected because its mandatory second and third geometry submissions breach the D-033 submitted-triangle budget on **both** tiers for the milestone's required proof subjects; the shader back-face fill is rejected because a planning prototype shows it is not a cap at all (it paints a flat wall over intact geometry, hiding the internals it is supposed to reveal, at ≈2.7–3.2 ms/frame over the open-shell sectioned frame); convex-hull proxies are rejected because they overfill 46.9 % of the true shell section at a measured reference plane; the adopted technique is **CPU cross-section extraction + triangulation rendered as real cap geometry** — exact, depth-correct, stencil-free, and small in draw calls and triangles.
2. **A full scope (§2.2):** every clippable part is capped. All parts are sliced from their real triangles except the 32 helical valve springs, which are capped through a closed convex-hull proxy (a solid elliptical section) because their wire geometry yields thin cut faces and they are 41 % of the internal triangles. No part is left uncapped; the only named deviation is the spring proxy, and it is documented with its local overfill.
3. **A deliberate appearance (§2.3):** a single section colour plus a 45° plane-locked hatch, baked into the cap triangles at generation time through a 2-D section-UV attribute; the cut face reads as *a diagrammatic cut plane*, not as any part's material. The spec fixes the colour, hatch scale/contrast, and what a capped face must communicate.
4. **An interaction contract (§5):** caps follow the live slider, the running engine, the exploded state, the selected variants and both quality tiers; X-Ray suppresses shell caps so the ghosted reveal survives; the exterior toggle adds/removes shell caps with the shell; the existing label rule is unchanged.
5. **A budget record with measured numbers (§6, §14):** +2 draw calls, a measured cap-triangle count, measured CPU rebuild times for the static and dynamic cap sets, and the standing `?benchmark=1` matrix re-run with Section off and on. No D-033 budget is raised; no stencil buffer is added; the single `renderer.render` call is preserved.
6. **Visual proof defined (§7):** RF-6 re-baselined plus four new frames — a cut piston (`RF-14`), a cut cylinder head (`RF-15`), the sectioned exterior shell (`RF-16`), and a longitudinal Side (Y) cut through the RH bank (`RF-17`) — each with a numbered checklist that fails on a visible hollow interior.
7. **The caption promise retired (§9):** the "capped solid sections come later" line is replaced by a verbatim line that describes the diagrammatic section face and what it is not; pinned by a source-text test.

**Non-goals for M11:**

- **No asset, geometry or catalog change.** The ten internal GLBs, the five variant GLBs, `public/Duramax_LLY_2005_66L_V8.glb`, `assets-src/**` and `catalog/**` are byte-identical. Caps are generated at runtime from the shipped geometry; nothing is baked into a model.
- **No stencil buffer, no render target, no extra render pass, no shader depth write.** The renderer keeps `antialias: true` and its default `stencil: false`; the frame still issues exactly **one** `renderer.render(scene, camera)`.
- **No new dependency.** Triangulation uses three's exported `ShapeUtils.triangulateShape` (which wraps the Earcut implementation already inside the pinned package); no npm package is added.
- **No frozen-interface change:** `src/core/**`, `src/perf/**` and `catalog/**` are untouched; the renderer's exported controller function shapes are unchanged except for additive, optional statistics fields used by the benchmark (§10).
- **No per-material cap colours, no cap shadows, no picking/raycasting against caps, no true wall thickness.** The cap is the cross-section of the part *as modelled* (a closed shell), so enclosed cavities are filled solid — this is the milestone's explicit convention and is stated in the caption (§2.3). Real wall-thickness sections would require wall geometry and are a future asset project, not this milestone.

---

## 2. The five explicit positions

### 2.1 Technique — CPU cross-section caps, and why not stencil, shader or hulls

**Decision: at every section state, extract the intersection of each clipped part with the plane (triangle-plane segments → welded closed loops → hole classification → Earcut triangulation), transform the loops into a flat cap mesh in world space at the plane, and render that mesh with an unlit hatched section material.** The cap is real geometry: it has true depth, occludes what is behind it, needs no stencil and no depth trick, and its triangle count is a few hundred to a few thousand.

The four families were compared on the numbers this codebase can actually meet (`docs/research/M11-capped-cutaways-survey.md` Part B; external facts graded in `docs/research/M11-capping-techniques.md`):

| Family | Extra draw calls | Extra submitted triangles | Covers piston + head + shell exactly? | Verdict |
| --- | ---: | ---: | :---: | --- |
| **Stencil-buffer capping** (two stencil draws per capped mesh + one cap quad) | 2N + 1 = **+119** for all 59 clippable meshes | 2 × 308,260 = **+616,520** | yes | **Rejected — both tiers fail the submitted-triangle cap** (desktop 1,196,004 > 700,000; phone 924,396 > 400,000). The smallest proof-covering subset still costs +208,024 → phone 515,900. Shell-only fits (phone 382,076) but leaves the cut piston and head hollow. It also requires a new `stencil: true` context (the shipped context reports `STENCIL_BITS = 0`) and multi-pass shadow scheduling. |
| **Shader back-face fill with `gl_FragDepth`** (re-shade visible interior back faces at the plane) | 0 | 0 | **no** | **Rejected on measured evidence.** A planning prototype (same GPU/asset build) confirmed +0 calls/+0 triangles but showed the fill is not a cap: it paints a flat hatched plate over intact geometry — 14.4 % of pixels changed at RF-6 and 42.3 % with the exterior on, with critical overfill in the other three states — hiding the crank, pistons and springs instead of capping them. Removing the depth write confines the fill but turns it into a back-face backdrop that still fills silhouettes, not material cross-sections (a duct cut becomes a solid disc). GPU cost measured **+2.7–3.2 ms/frame** at 1440×900. It also fills front-facing cavity walls inconsistently (longitudinal cuts show front faces); the prototype showed an opaque slab in the X-Ray state because suppression was not implemented there — suppression is required by this spec, but it does not fix the fill-not-a-cap failure. |
| **Convex-hull proxies** (cap each part's hull) | ~+3 | small | no | **Rejected on measured shape error:** at the reference plane X = 402.5 mm the hull cap covers **0.310 m²** against a true section of **0.211 m² — 46.9 % overfill** — because the block/pan/head concavities are bridged (the V-valley and the air around the banks become solid plates). Exactness matters more than the small triangle saving. |
| **CPU cross-section caps** (this spec) | **+2** (static + dynamic cap mesh) | measured, small (§6.2) | **yes, exact** | **Adopted.** Real geometry at the plane; exact for closed meshes; no stencil, no render target, no extra pass, no new dependency; the cost is CPU rebuild time, measured in the planning prototype and budgeted in §6.3. |

**Why the CPU route is affordable here.** The engine has 270,080 internal triangles and 37,100 shell triangles, but a section plane only needs the triangles that *cross* it, and a tight typed-array intersection loop costs ~0.01 µs/triangle on the reference laptop: a measured **0.95–1.02 ms per frame for a 100,224-triangle mixed timing set** and **0.35–0.37 ms per plane change for the 37,100-triangle shell slice**, with **1.41–1.68 ms per shell change for the partial optimised slice + weld + loop + triangulate pipeline** (planning prototypes; §14.3). Static parts are recomputed only when the plane, explode state, variant selection or exterior/x-ray state changes; moving parts are recomputed every frame. The result is exact geometry with a bounded, measurable CPU cost — no GPU-side trick and no budget breach.

**External validation of the pieces.** Clipping itself generates no cap (three.js `clipping_planes_fragment` discards only; `docs/THREE_API_NOTES.md:98-103`), triangle-plane contour extraction with Earcut is the standard polygon-triangulation path (three's own `ShapeUtils` wraps Earcut), and the shader alternative's failure mode is consistent with the published "back-facing fill" technique used by xeokit (`SectionPlane.capColor`), which is a *fill*, not a geometric cap (`docs/research/M11-capping-techniques.md` F32).

### 2.2 Scope — every clippable part; springs capped through their hull proxy

**Decision: the cap source set is every clippable mesh.** All but the 32 helical valve springs are sliced from their real triangles; the springs are capped from their **closed convex-hull proxy** instead of their helical wire surface.

Capped:

- **Static set** (rebuilt only when the plane/explode/variant/exterior state changes): the 23 merged exterior-shell meshes (all 12 material buckets and the `turbo_unit` / `turbo_downpipe` / `intake_tract` preserved subtrees), the 8 cylinder heads, the 8 fuel injectors, the turned main crankshaft, and the attached external variant models (they move only with Explode).
- **Dynamic set** (rebuilt every frame): the 8 pistons (standard + firing batches, and the low-compression piston variant when selected), the 8 connecting rods, the 4 shared crank throws, the 16 valve bridges, the 16 rockers (four batches), the 16 pushrods, the 16 lifters, the 32 valves, and the 32 valve springs.

**Why the springs are hull-capped, not sliced:** a plane through a helical spring yields a set of thin wire cross-sections, and the springs are **110,848 triangles = 41 % of all internal triangles** — the single largest per-frame slicing cost for the least readable cut face. Their convex hull is a closed cylinder-like proxy (**326 triangles per hull**, measured; 32 hulls = 10,432 hull triangles sliced per frame, still < 10 % of the spring surface); slicing it produces a solid elliptical section through the spring's footprint, which is exactly the "solid material at the plane" convention. The overfill is local to the spring's own envelope (it fills the gaps between coils), not the global hull overfill rejected in §2.1. Every other part uses exact mesh slicing; the 5 non-watertight shell partIds are handled by **local chord closure** of their open chains (§4.3), not by a hull fallback (the shell's cap sources are material-merged buckets, so a hull would overfill a whole bucket).

**Consequence accepted and stated:** capping the exterior shell fills its *modelled* solid cross-section (the block and pan are closed shells), so at a shell-crossing plane the shell cap legitimately hides the internals behind it — the solid-section convention. To see internals, the user turns the exterior off (the app's existing cutaway mode) or uses X-Ray, which suppresses shell caps (it also suppresses the shell's opacity, so the ghosted reveal is preserved). This is exactly what a solid section would do; it is stated in the caption and in the frame checklists.

### 2.3 Appearance — a single section colour with a 45° plane-locked hatch

**Decision: all caps use one section colour and one hatch treatment, regardless of part material.**

- **What it is:** a warm, desaturated **cut-bronze** base (linear RGB **`0.290, 0.170, 0.086`**) with darker hatch lines (linear RGB **`0.196, 0.112, 0.055`**) — the same hue at ≈68 % luminance. The cap is **unlit** (no PBR, no IBL, no shadows) but passes through the renderer's existing tone mapping and colour-space conversion so it sits in the studio image without looking emissive. Caps are **not fogged** (the dedicated cap shader omits the fog chunks): the cap is at the section plane inside the engine, where fog is negligible, and omitting it keeps the hatch crisp.
- **Hatch:** 45° to the world horizontal axis of the section plane, **line spacing 5.0 mm**, line duty ≈ **1/3** (1.67 mm line every 5 mm), **±12 %** luminance modulation with a softened edge (`smoothstep` over ≈0.1 mm, 0.02 of a period). The hatch is carried by a per-vertex `sectionUV` attribute (the 2-D plane coordinates in mm, computed when the cap is generated), so it is exactly plane-locked, does not swim when the camera orbits, and translates with the plane as the slider moves. It is constant across all parts, so the whole cut reads as one section plane.
- **One material, one program:** a small dedicated shader material (unlit, `depthWrite: true`, `depthTest: true`, `side: DoubleSide`) shared by the static and dynamic cap meshes. No texture, no new dependency.
- **Why not per-material colour:** the cap is the cross-section of the *part as modelled*, not a surface; a per-material palette would imply material fidelity the assets do not have and would fragment the cut plane visually. A single colour makes the plane legible and matches drafting convention (45° hatching, one section face).
- **What a capped face must communicate, in order:** (1) **the section plane's position and orientation** — flat, evenly hatched, crisp edge; (2) **solid material at that plane** — it occludes what is behind it, and no far interior wall, tube opening or cavity is visible; (3) **a diagrammatic cut, not a real surface** — a single non-material colour with drafting hatching, not a machined finish, not a measured LLY casting surface, not a part material; (4) **the engine is an assembly of many parts** — the single colour deliberately does not distinguish part identity; labels and the Build panel do that.
- **What it must not communicate:** that the interior is hollow (no dark cavity or visible inner wall), that the cut face is a real machined/measured surface, or that the firing-piston highlight has moved (the orange emissive remains on the *outer* surfaces of the firing piston; a cut firing piston's cut face is section-coloured — §5.6).

### 2.4 Interaction with the existing views and the live slider

**Decision: caps are a function of the plane and the current geometry, rebuilt at the cadence their motion requires.** Detail in §5; summary:

| View / state | Position |
| --- | --- |
| **Section slider (live)** | The static cap set is marked dirty on every `input` event and rebuilt **at most once per animation frame**; the dynamic set rebuilds every frame anyway. The cut face therefore tracks the slider within one frame, with no debounce and no geometry rebuild of the scene. |
| **Running engine** | Pistons, rods, throws, bridges, rockers, pushrods, lifters, valves and springs move every frame; their caps are rebuilt from the current instance matrices in `update()` before the single render (springs via their hull proxy). |
| **Explode** | Static sources (shell, heads, injectors, variants) move only when Explode changes → static caps rebuild then. Dynamic sources rebuild every frame. A part lifted clear of the plane stops producing cap triangles; a part lifted across it produces them where it crosses. |
| **X-Ray** | Ghosted exterior materials are skipped by the cap builder: a solid cap on a ghosted shell would occlude the internals X-Ray exists to reveal. Internal caps remain. |
| **Exterior toggle** | Shell caps appear/disappear with the shell (the builder skips invisible groups). No separate state. |
| **Labels** | No rule change: labels on the clipped side stay hidden; labels on the kept side stay visible even when a cap visually covers their anchor. Caps are render output, not a new label-occlusion system. |
| **Variants** | Variant models are cap sources; the low-compression piston batches are dynamic sources and cap identically. Selection changes mark the static set dirty. |
| **Quality tiers** | Identical caps on Full and Phone (same geometry, same material); only shadows/pixel ratio differ. The dynamic rebuild is measured on both tiers. |
| **Paused / hidden tab** | Caps persist while paused; a hidden tab renders no frames. On return, the next frame rebuilds from the current state. |
| **Defaults** | On the **stock build**, the section defaults (X 900 mm / Y 580 mm) clip nothing, so the cap builder produces **zero triangles** (all sources lie on the kept side) — no cap, no artifact, no special gate needed. With a variant that extends past a default (the intercooler core reaches Y 696 mm), the default Y 580 mm does cut that model and correctly produces its cap; the zero-output property is a stock-build property, not a global one. |

### 2.5 What happens to the caption line that promises the feature

Today the Views panel says, verbatim (`src/ui/engineControls.ts:924-926`):

> `Cutaway shows open shells — capped solid sections come later.`

**Decision: the promise is retired, not deleted.** The line is replaced by a sentence that describes what a capped face now is and what it is not — because the cap is the solid cross-section of the model, not a real machined surface. New verbatim line:

> `Section cut faces are filled as solid, hatched material — a diagrammatic section, not a machined or verified LLY surface.`

Reasons: (a) the old sentence is now false; (b) deleting the line would lose the explanation of the one non-physical surface in the scene; (c) the new sentence carries the same honesty the app applies to illustrative geometry (D-012) and the M10 caption, at the exact place the user enables the view; (d) it is pinned by a source-text test (§8, test 8) so it cannot drift. The M10 illustrative caption (`#m1-illustrative-caption`) is **unchanged**, and both subtitles move to `Milestone 11 — Capped-Solid Cutaways` (§9).

---

## 3. What the shipped app does today (measured, not assumed)

Source: `docs/research/M11-capped-cutaways-survey.md` Part A; captured in this planning session on the production bundle with the target GPU.

| Fact | Value | Where it comes from |
| --- | --- | --- |
| Clipping | Per-material local clipping, one world-space `THREE.Plane`; keeps `x <= pos` / `y <= pos`; `localClippingEnabled = true`; `clipShadows = true` | `src/renderer/engineScene.ts:381, 416-429, 1510-1524` |
| Renderer context | `new THREE.WebGLRenderer({ antialias: true })`; **no stencil**; actual `STENCIL_BITS = 0` | `src/renderer/engineScene.ts:377`; measured |
| Section ranges | X `−150…+900 mm`, default `+900`, step `0.5`; Y `−580…+580 mm`, default `+580`, step `0.5` | `src/renderer/viewLayout.ts:116-130`; duplicated in `src/ui/engineControls.ts:69-74` |
| Clipped set | 35 internal instanced batches + main shaft + 23 exterior merged meshes + 5 variant models; ground excluded | `src/renderer/engineScene.ts:471, 960, 1147, 1316, 1356, 1369`; `:450-465` |
| Draw calls / submitted triangles, Section **off** vs **on**, exterior on | **96 / 579,484** in both states | measured; matches `docs/M10-MEASUREMENTS.md:192-193` |
| Draw calls / submitted triangles, Section **off** vs **on**, exterior off | **73 / 542,384** in both states | measured |
| X-Ray + Section state (pre-existing) | **119 / 616,584** (all 23 exterior meshes are `DoubleSide` transparent → two passes) | measured in the M11 prototype |
| Scene triangles | **308,324** (exterior on) / **271,224** (exterior off) | `getRenderStats`; `docs/M10-MEASUREMENTS.md:191` |
| Assets | all materials `doubleSided: true`; a clipped opaque part shows its far interior wall | GLB parse |
| Existing tests touching this area | section-plane signed distances (`viewLayout.test.ts` test 4), label hide rules (test 6), reference-frame table (`referenceFrames.test.ts`), UI text (`uiText.test.ts`) | see §8 |

Two facts drive the whole design: **the section currently costs nothing** (0 calls, 0 triangles) and **the renderer has no stencil buffer**. The adopted technique adds a bounded +2 draws and a small triangle count, and a CPU cost that is measured rather than assumed.

---

## 4. The cap builder — technical contract

This section is the implementable core: the algorithm, the data flow, the material, and the failure modes.

### 4.1 Module and seams

A new module **`src/renderer/sectionCaps.ts`** (Three.js imports allowed; `src/renderer/**` is the only layer permitted to import three, `src/core/architecture.test.ts`) owns:

- `sliceMeshAtPlane(positions, plane, outSegments)` — the tight typed-array triangle-plane intersection;
- `weldAndTraceLoops(segments)` — quantised welding, adjacency, loop tracing (with the turn heuristic for T-junctions), returning `{ loops, openChains, ambiguousJunctions }`;
- `classifyLoops(loops)` — **containment-depth (even-odd) classification**, returning outer/hole groups and the immediate parent of each hole (no signed-area orientation; loop winding is arbitrary);
- `triangulateLoops(outer, holes)` — via `ShapeUtils.triangulateShape` (three's Earcut wrapper; its contour/hole inputs must be `THREE.Vector2[]`, because it calls `Vector2.equals` internally — a plain `{x,y}` object throws `points[l-1].equals is not a function`); no new dependency;
- `SECTION_CAP_COLOR_LINEAR`, `SECTION_CAP_HATCH_COLOR_LINEAR`, `SECTION_CAP_HATCH_SPACING_MM`, `SECTION_CAP_HATCH_DUTY`;
- `createCapMaterial()` — the unlit shader material with the hatch;
- `buildCapGeometry(sources, plane, target)` — the orchestrator: iterate cap sources, slice, trace, triangulate, append positions + `sectionUV` into a pre-allocated `Float32Array` pair, return counts; close open chains with a chord (§4.3), record `closedChains` / `droppedGroups`; for `hullOnly` spring sources, slice the source's cached `ConvexHull` (built once per source via `three/addons/math/ConvexHull.js`) and record `hullOnlySources`;
- cap statistics (`staticMs`, `dynamicMs`, `triangles`, `openChains`, `closedChains`, `droppedGroups`, `hullOnlySources`) exposed through the additive `EngineRenderStats` fields (§10).

`engineScene.ts` changes only at seams it owns: create the cap material + static/dynamic `BufferGeometry` + two `Mesh` objects (added to the scene, `castShadow = false`, `frustumCulled = false`), register cap sources when meshes are created/loaded, and rebuild static/dynamic caps in the existing `setSectionState` / `setExplodeFactor` / `syncExteriorShellState` / `syncVisualVariants` / `update` paths. `src/renderer/index.ts` exports the new module's public names needed by tests; the controller interface gains only additive statistics fields (§10).

### 4.2 Cap sources

Each source is `{ id, object3D, instanced: boolean, count: number, static: boolean, skipWhenGhosted: boolean, hullOnly: boolean, cachedHull?: THREE.ConvexHull }`. `hullOnly` is true only for the two spring batches (their cached hull is built once at load from the spring geometry); every other source is sliced from its triangles. The builder walks the source list; for instanced sources it iterates `count` instances and uses `getMatrixAt(i, matrix)`; for non-instanced it uses `matrixWorld`. It skips any source whose object (or an ancestor) is invisible, and skips `skipWhenGhosted` sources while their materials are ghosted.

| Class | Sources | Cadence |
| --- | --- | --- |
| Static | exterior shell merged meshes + preserved groups (23), 8 heads (1 batch × 2 primitives), 8 injectors (1 batch × 2 primitives), main shaft (1), attached external variants (up to 4 models) | rebuild on section plane change, explode change, variant selection change, exterior/x-ray toggle, asset load |
| Dynamic | pistons (2 batches × 3 primitives + variant batches), conrods (3 primitives × 8), crank throws (3 × 4), bridges (16), rockers (4 batches × 4), pushrods (16), lifters (16), valves (2 batches × 16) | rebuild every rendered frame |
| Spring hulls | 32 valve springs (2 batches × 16), `hullOnly` through their cached closed convex hulls (solid elliptical sections) rather than sliced | rebuild every rendered frame with the spring instance matrices |

The builder uses the **visible** clippable set, so an exterior-off frame caps only internals and a variant swap changes only the moved/replaced sources.

### 4.3 The slice algorithm (exact contract)

For each triangle (world mm) and the active plane (X or Y, position `p`):

1. Compute signed distances `d0,d1,d2 = coord − p`. If all three are on one side (|d| > ε, same sign) skip. ε = 1e-4 mm (0.1 µm); a triangle with all three |d| ≤ ε is coplanar — skip.
2. Treat |d| ≤ ε as exactly on the plane. Collect edge crossings for edges whose endpoint signs differ (an endpoint on the plane contributes its own point), dedupe coincident points, and require exactly two points; otherwise the triangle contributes no segment (degenerate).
3. Project the two points to the **plane's 2-D coordinates** `(u,v)` in mm (X plane → `(y,z)`; Y plane → `(x,z)`).
4. Append to a per-source segment list.

After slicing a source: **weld** endpoints by quantised key (0.001 mm), build vertex→segment adjacency, **trace loops** by walking unused segments; at a vertex with more than two incident segments (T-junction from a coplanar/degenerate input), continue with the segment whose direction has the largest dot product with the incoming direction. Loop winding is **arbitrary** (segments are undirected and the walk may start either way), so loops are **not** classified by signed area. Instead, classify by **containment depth (even-odd nesting)**: a loop contained in an odd number of other loops is a hole; a loop contained in an even number is an outer boundary. Each hole is assigned to its **immediate containing** loop (the smallest-area loop that contains it); each outer+holes group is triangulated with `ShapeUtils.triangulateShape` (holes are passed explicitly, so Earcut does not need a winding convention); a group whose triangulation fails is dropped and counted.

A chain that does not close within `segments + 2` steps is recorded as an **open chain**. Open chains occur on non-watertight geometry. A position-welded boundary-edge audit of the shipped shell (weld quantum 1e-5 m) finds **5 non-watertight partIds** — `ext_vc_fasteners_1` (336 boundary edges), `ext_vc_fasteners_2` (168), `ext_inj_return_line_2` (32), `ext_exh_manifold_lh_2` (32), `ext_exh_manifold_rh_2` (32); `ext_front_cover_1` is watertight (0 boundary edges at every tested quantum), and all ten internal part GLBs are watertight. An open chain is handled **locally, by closing it in the plane**: connect the chain's two endpoints with one straight chord segment and re-run the closure/triangulation on that loop, recording `closedChains`; if the resulting polygon is not simple or Earcut fails, the loop is **dropped and counted** (`droppedGroups`). **No convex hull is used for these sources**: the cap sources are the *material-merged* exterior meshes (`exteriorLoader.ts` merges by material signature), so a per-source hull would hull an entire multi-part bucket (the steel bucket alone is 10,048 triangles / 53 parts) and would reintroduce the 46.9 % overfill rejected in §2.1. The chord closure is local to the open part's boundary and is the only overfill this case admits.

**Coordinate mapping back to world:** X plane → `(p, u, v)`; Y plane → `(u, p, v)`. Triangle winding is whatever the contour orientation and Earcut produce; the material is `DoubleSide`, so the cap is visible from either side and no winding normalisation is required (this also avoids camera-dependent winding logic). `sectionUV = (u,v)` in mm is written per vertex for the hatch.

### 4.4 The cap material and the hatch

- A `ShaderMaterial` (or `RawShaderMaterial`) with `depthWrite: true`, `depthTest: true`, `side: THREE.DoubleSide`, `transparent: false`, `toneMapped` behaviour implemented by including three's `tonemapping_fragment` and `colorspace_fragment` chunks in the fragment shader (the cap must sit in the same ACES/linear-sRGB pipeline as the lit parts).
- Vertex: standard `projectionMatrix * modelViewMatrix * vec4(position,1)`; pass `vSectionUV = aSectionUV`.
- Fragment: the hatch is 45° in the `(u,v)` plane, with a perpendicular spacing of 5.0 mm, so the coordinate along the stripe normal is `d = (vSectionUV.x + vSectionUV.y) * 0.70710678`; the phase is `s = fract(d / 5.0)`; the line mask is a `smoothstep` around a 1/3 duty (line from phase 0 to 0.333, softened by ≈0.02 of a period); `colour = mix(base, hatchColour, mask)`; `gl_FragColor = vec4(colour, 1.0)` before the tone-mapping/colour-space chunks. The exact GLSL is the builder's, but the **measured** world spacing (5.0 mm perpendicular) and duty (1/3) are pinned by the frame checklist.
- No lighting, no normals, no textures, no fog uniform needed (fog is applied by the renderer's fog chunks only if included; the cap is at the plane inside the engine, so fog is negligible — the spec chooses **no fog** on caps for a crisp section, and records it).
- The static and dynamic cap meshes share the material and are `Mesh` objects with `castShadow = false`, `receiveShadow = false`, `frustumCulled = false` (their geometry is rebuilt in place; culling bounds would be stale). They are added to the scene once, with `renderOrder = 0` (opaque pass, default depth sorting).

### 4.5 Rebuild lifecycle

| Event | What happens |
| --- | --- |
| `createEngineScene` | create the material and two meshes with empty geometries; empty `sectionUV`/position buffers sized to a working maximum and grown if needed; no cap triangles until a section is active. |
| `setSectionState(mode, posMm)` | existing plane + material clipping update; mark static dirty; the dynamic set rebuilds in the next `update()`. |
| `setExplodeFactor` / variant selection / exterior / x-ray | mark static dirty. |
| `update(state)` | if a section is active: rebuild the dynamic cap set (its instance matrices were just updated by the kinematic pass), rebuild the static set **iff dirty**; set each mesh's `geometry.setDrawRange`/attribute needsUpdate and `visible`; then the existing single `renderer.render`. If the section is inactive or no cap triangles exist, both meshes are `visible = false` and no CPU work is done. |
| `dispose()` | dispose the two geometries and the material (added to the existing disposal sets). |

**Source culling before slicing:** each source caches a local bounding box (and, for instanced sources, the geometry's bounding sphere radius). Per instance, the plane is tested against the world-space bounds; a source/instance wholly on the kept side (or wholly clipped) is skipped **before** iterating its triangles. This is what makes the stock defaults (X 900 / Y 580, everything kept) cost O(sources) rather than O(triangles), and it is the mechanism by which the cap builder returns zero triangles there. It is also a correctness guard: a source wholly on the clipped side must not emit a cap.

**World-matrix freshness:** the builder must not rely on `matrixWorld` values that the renderer would update later in the same frame. Instanced sources are read through `getMatrixAt` (already current after the kinematic pass); non-instanced sources (shell, main shaft, variant groups) need `scene.updateMatrixWorld(true)` (or an equivalent targeted update of those groups) **before** the cap build, so an explode or variant change cannot cap with last frame's transforms. The whole-scene update is O(~200 objects) and is measured as part of the rebuild.

**Paused state:** the shipped UI loop calls `scene.update()` on every rAF tick even when paused (`src/ui/engineControls.ts:1306-1320`, `src/main.ts:97-99`), so the dynamic rebuild runs every rendered frame regardless of play state. That is the specified behaviour (the cap is rebuilt from unchanged matrices; cost is measured in the paused state too). It is **not** "only on state change"; §5.7 states the same rule.

No per-frame allocation in the steady state: the builder writes into pre-allocated arrays; temporary segment/loop buffers are reused. The static and dynamic geometry buffers are capped at a working maximum (e.g. 16k vertices each) and grown only if a measured state exceeds it.

### 4.6 Failure modes and the artifact register (must be recorded in `docs/M11-CUTAWAYS.md`)

| ID | Failure | Expected behaviour / acceptance |
| --- | --- | --- |
| A1 | **Missing cap** on a visibly cut part (degenerate section / non-watertight source) | A failure in any named frame. Open chains are closed by a chord and recorded; only a non-simple/failed triangulation may drop the loop, and it is counted. The build logs `openChains`, `closedChains`, `droppedGroups`, `hullOnlySources` per rebuild; nonzero `droppedGroups` must be explained by a named degenerate case, not ignored. |
| A2 | **Overfill** — the cap extends beyond the true cross-section | Impossible for sliced sources by construction (the cap is the exact intersection), **except** the two named cases: (i) the spring hull proxies, which fill between coils inside the spring envelope, and (ii) the chord closure of a non-watertight chain, which may close across a small gap. No other overfill is acceptable; a visible overfill outside those cases means a slicing/triangulation bug and must not occur in the named frames. |
| A3 | **Z-fighting / depth-order artifact** — cap vs part or cap vs cap | The cap is coplanar with nothing but itself (all caps share the plane and the same colour); a visible seam means a winding/depth bug. Must not occur. |
| A4 | **Firing highlight leak** — an orange cut face | The cap is unlit section colour; orange remains only on un-cut outer surfaces. |
| A5 | **Hatch swimming/stretching** | The hatch is carried by `sectionUV`; it is plane-locked and uniform in world scale. It may translate with the plane but must not rotate/zoom with the camera. |
| A6 | **CPU overrun** — rebuild cost above budget | Measured per rebuild and reported; a breach of §6.3 is a stop-and-report, not a silent frame-rate drop. |
| A7 | **Spring hull cap** — a plane through a spring shows a solid elliptical section rather than coils | Intended by the solid convention. The hull is local to the spring envelope; it must not be mistaken for the global hull route rejected in §2.1. No acceptance frame cuts a spring. |

---

## 5. Interaction contract (detail)

### 5.1 Live slider movement

The existing `input` event calls `onSectionChange` on every step (`src/ui/engineControls.ts:1221-1223`). `setSectionState` mutates the shared `THREE.Plane` in place and re-assigns the same array; it also marks the static cap set dirty. The next `update()` rebuilds the static set once, and the dynamic set every frame, so the cap tracks the slider within one frame. There is no debounce, no scene rebuild, and no per-frame `needsUpdate` on the scene materials. The spec requires the build to measure the static rebuild cost and record it; a slider drag may reduce the frame rate while the static set rebuilds (accepted and documented), but the cap must never lag more than one frame behind the plane.

### 5.2 Explode

The plane is world-fixed; geometry moves. Static sources (shell, heads, injectors, variants) move only when Explode changes → static caps rebuild then. Dynamic sources rebuild every frame from their live instance matrices. A part lifted clear of the plane produces no cap; a part lifted across it produces a cap at the new crossing. No proxy matrix can go stale because caps are regenerated from the same matrices the renderer uses.

### 5.3 X-Ray

`syncExteriorShellState()` ghosts the exterior materials (`transparent=true`, `opacity=0.22`, `depthWrite=false`) and restores them on off (`src/renderer/engineScene.ts:1076-1107`). The cap builder skips `skipWhenGhosted` sources while ghosted, so the shell neither paints a solid cap nor writes cap depth; internals keep their caps. Turning X-Ray off restores the shell caps with the material state. The M11 benchmark includes the x-ray state (119 calls / 616,584 submitted triangles pre-existing) so the new rows are complete.

### 5.4 Exterior toggle and variants

The shell group's visibility change is observed by the builder (invisible sources are skipped); shell caps vanish and return with it. Variant models are registered as cap sources when loaded/attached; selection changes mark the static set dirty. The low-compression piston batches are dynamic sources and cap identically.

### 5.5 Labels

The existing rule (`isLabelVisibleUnderViewRules`, `viewLayout.ts:405-434`) hides anchors on the clipped side; unchanged. Caps are opaque render output at the plane, so a kept-side label whose anchor sits behind a cap is still drawn over it (HTML overlay, z-index 10). This is deliberate: the label names a part that is still present behind the cut face; adding cap-occlusion raycasts is out of scope. The §7 frames have labels off so they cannot hide a cap failure.

### 5.6 Firing highlight

The firing piston's materials are cloned with an orange emissive (`engineScene.ts:943-961`). The cap is separate geometry with the section material, so the cut face is section-coloured by construction while the un-cut outer surfaces remain orange. No material mutation is involved.

### 5.7 Tiers, pause, hidden tab

Caps are tier-independent. The dynamic rebuild runs on **every rendered frame**, including while paused (the shipped loop still ticks; §4.5), because the builder does not maintain a "matrix dirty" flag per instance. The paused-state cost is therefore part of the measured dynamic rebuild. A hidden tab renders no frames; on return, the next frame rebuilds from the current state.

---

## 6. Budgets (D-033)

### 6.1 The constraint, stated plainly

`docs/M2-MEASUREMENTS.md:120-126` sets, per tier: scene asset triangles ≤ **360,000** desktop / **320,000** phone; submitted triangles ≤ **700,000** / **400,000**; draw calls ≤ **250** / **120**; texture+HDRI VRAM ≤ **64** / **32 MiB**; frame time ≤ **16.7 ms** / **33.3 ms** at 900 rpm. The measured baseline (`docs/M10-MEASUREMENTS.md:203-217`) leaves 51,676 desktop / 11,676 phone scene triangles, 120,516 / 92,124 submitted triangles and 154 / 62 draw calls of headroom.

### 6.2 The geometry arithmetic

| Normative metric | Budget (desktop / phone) | Baseline stock (measured) | Baseline 5-variant (M10) | M11 stock | M11 5-variant | Utilisation (stock / variant) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Scene asset triangles | 360,000 / 320,000 | 308,324 | 304,632 | **308,324** | **304,632** | 85.65 % / 96.35 % (stock), 84.62 % / 95.20 % (variant) |
| Submitted triangles / frame | 700,000 / 400,000 | 579,484 / 307,876 | 568,880 / 304,512 | **579,484 + capTris** | **568,880 + capTris** | ≤ 85.1 % / ≤ 81.0 % (stock), ≤ 83.6 % / ≤ 80.1 % (variant), `capTris` ≤ 16,000 |
| Draw calls / frame | 250 / 120 | 96 / 58 | 97 / 60 | **98 / 60** | **99 / 62** | 39.2 % / 50.0 % (stock), 39.6 % / 51.7 % (variant) |
| Texture + HDRI VRAM | 64 / 32 MiB | 20.75 / 4.75 | 20.75 / 4.75 | **20.75 / 4.75** | **20.75 / 4.75** | 32.42 % / 14.84 % |
| Frame time p95 @ 900 rpm | 16.7 / 33.3 ms | 16.8 / 16.8 ms | 16.8 / 16.8 ms | **measured, §6.3** | **measured, §6.3** | — |

The cap triangle count is dominated by the exterior shell's section (609 triangles at X = 402.5 mm in the planning prototype), the internal parts (a few hundred each) and the dynamic parts (a few hundred); the **16,000-triangle cap** is a conservative ceiling that keeps the submitted-triangle metric at ≤ **85.1 %** desktop / ≤ **81.0 %** phone in the stock build and ≤ 83.6 % / ≤ 80.1 % in the worst-case 5-variant build. The build measures the actual count and records it; exceeding 16,000 is a stop-and-report (it would mean the triangulation is producing garbage polygons).

### 6.3 The CPU cost — the only real new cost, and how it is measured

The technique trades GPU passes for CPU rebuilds. The build must measure and record:

1. **Static rebuild** (`performance.now()` around the static cap builder) on a plane change, explode change and variant change, at X = 402.5 and Y = −185: report median/p95 over ≥ 20 rebuilds. Planning target: **≤ 8 ms desktop / ≤ 16 ms phone** per rebuild (the planning prototype's naive shell pipeline was 10.15–10.22 ms; the tight slice alone is 0.35–0.37 ms, and the partial optimised pipeline 1.4–1.7 ms — the gap is loop welding + hole classification + Earcut + allocations, which the optimised implementation must close).
2. **Dynamic rebuild** per rendered frame with the engine running at 900 rpm, at X = 402.5 and Y = −185: report median/p95 over ≥ 300 frames. Planning target: **≤ 6.5 ms desktop / ≤ 13.0 ms phone** (the planning prototype's tight slice of the 123,584-triangle sliced set is ≈1.2 ms; the naive full-pipeline rate projects ≈5.6 ms/frame, and the 32 spring hulls add ≈10,432 hull triangles/frame ≈0.47 ms at the same rate, giving an hull-inclusive projection of ≈6.1 ms — the target is set just above it, and loop/triangulation must fit inside).
3. **`?benchmark=1` matrix** (production preview, 10 s, 900 rpm): desktop Full and phone 390×844, each **Section off** and **Section X @ 402.5 mm**, stock build and the worst-case 5-variant build, **plus the Section + X-Ray state** (the pre-existing 119-call double-pass state, where shell caps must be suppressed); report `p50/p95/min/max`, `droppedFrames`, `avgCpuRenderMs`/`p95`, and the full `renderInfo` including the new cap statistics. Acceptance: p95 within **+0.30 ms** of the M10 rows for the same tier/state and no dropped frames; any p95 above the D-033 frame budget is a failure.
4. **Slider-drag cost** (optional, recorded): the static rebuild cadence during a continuous drag; report the measured frame rate and rebuild count.

If any measured row breaches a budget, **stop and report**; do not raise D-033, do not silently drop the cap on the phone tier, and do not disable the feature by default.

---

## 7. Visual proof — reference frames

### 7.1 Frames (five definitions: one re-baselined, four new)

All captured at the standing `1440×900 → 1024×640` convention (`docs/REFERENCE_FRAMES.md:7-13`), stock build unless stated, production preview, `?rf=…`.

| Frame | Status | Crank angle | Camera position → target (m) | Exterior / views | What it is for |
| --- | --- | ---: | --- | --- | --- |
| **RF-6** | **Re-baselined** | 0° | `[1.0600, −0.5400, 0.4800] → [0.2900, −0.0200, 0.1400]` | Off; Section X @ 402.5 mm; X-Ray off; Labels off | The existing front-station cutaway, now capped: cut head, cut piston, cut valve train, cut crank throw at the same pose as the committed open-shell baseline. |
| **RF-14** | **New** | 180° | `[0.9000, −0.6200, 0.2500] → [0.4000, −0.1500, 0.0200]` | Off; Section X @ 402.5 mm | **Cut piston close-up:** the RH Cylinder 1 piston at BDC, its crown/ring belt/skirt cut flat and hatched; the crank throw and rod cross-sections below it. |
| **RF-15** | **New** | 470° | `[0.6600, −0.3800, 0.5600] → [0.4025, −0.2000, 0.2550]` (RF-2 pose) | Off; Section X @ 402.5 mm | **Cut cylinder head close-up:** the RH head casting section, the deck/port cross-section and the injector/bridge/rocker cuts in the same close-up that RF-2 uses for the uncovered head. |
| **RF-16** | **New** | 180° | `[1.3800, −1.1800, 0.7200] → [0.3000, −0.0200, 0.1700]` (RF-3/RF-11 pose) | **On**; Section X @ 402.5 mm | **Sectioned exterior shell:** valve covers, block skirt, oil pan, intake duct, charge pipe, front cover and turbo inlet cut flat, with the cut plane removing the front of the engine. The strongest "no more hollow tubes" frame. |
| **RF-17** | **New** | 0° | `[0.2300, 1.0500, 0.4500] → [0.2300, −0.1200, 0.1600]` | **Off**; Section **Y @ −185 mm** | **Longitudinal cut:** the plane through the RH bank piston/bore centres, viewed from the +Y (LH) side — the cut RH head, piston and intake-valve stem sections capped, with the LH bank and valley removed by the clipping. Proves the Side (Y) mode caps identically to Front–Back (X). The connecting rod is **not** cut at this plane (its world-Y range is `[−174.0, +27.7]` mm), so the frame does not claim a rod section. |

The Y = −185 mm plane is chosen for RF-17 deliberately: it runs along the RH bank at the deck/crown level, cutting the heads, pistons and intake-valve stems while staying **inboard** of the spring rows (spring centres at Y ≈ −202 / −235 mm), so the frame exercises the exact-slice path and does not depend on the spring hull proxies. With the exterior **off**, no shell cap sits between the camera and the internals, so the frame can show the capped cut faces (a shell-on Y section would be a solid wall by the §2.2 convention and could not show them). Camera poses are pinned; the build may adjust only if the named subject is cropped, and any adjustment must be recorded with the captured frame and re-checked against the checklist. The exact final poses and the 1024×640 captures are committed in `docs/reference-frames/` with SHA-256 values in `docs/M11-MEASUREMENTS.md`.

### 7.2 Checklist per frame (fails on any visible hollow interior)

**Shared (all five frames):**
1. **Solid cut faces:** every visible part that meets the section plane shows a flat, uniformly hatched section face at the plane — no far interior wall, no open tube/box interior, no dark cavity along the cut.
2. **Depth correctness:** nothing behind the plane draws in front of a cut face; the cap occludes the internals it should.
3. **One section colour:** all cut faces use the same base/hatch colour; no part material or firing orange appears *on* a cut face.
4. **Hatch quality:** 45° lines, uniform world spacing, no swimming/stretching/moiré, no hatch on non-cut surfaces.
5. **Crisp cut edge:** the boundary between the cap and the part's outer surface is a clean silhouette; no gap ring of background between them.
6. **No spurious fill:** no cap patch floats in air or appears where the plane does not cut material.

**Per-frame subjects:**
- **RF-6:** Cylinder 1 piston cut at TDC; both front heads cut; the injector/bridge/rocker cuts; crank throw/rod cuts; the existing open-shell interior-wall look is gone.
- **RF-14:** the RH Cylinder 1 piston's cut face reads as one solid section from crown to skirt; the ring belt and wrist-pin region are inside the section, not hollow; the rod and crank throw cuts are solid; the bore above the piston is not filled.
- **RF-15:** the head's cut face is a solid casting section; the injector, bridge and rocker cuts are solid; the springs are **not cut at this plane** (the two valve/spring rows sit at X ≈ 380.5 / 424.5 mm), so no spring hull proxy is visible; a plane that does cut a spring must show the solid elliptical proxy (§2.2), not hollow coils.
- **RF-16:** all exterior cuts (valve covers, block, pan, intake duct, charge pipe, front cover, turbo inlet) are solid; no hollow tube openings; the solid section legitimately hides internals behind it (the frame is about the shell).
- **RF-17:** the RH head, piston and intake-valve stem sections along Y = −185 mm are solid; the LH bank and valley are clipped away (not painted); no hollow cut; the spring rows are not cut at this plane, so no spring hull proxy is visible; the connecting rod is not cut at this plane and is not claimed.

### 7.3 The "unmistakable difference" test

For each frame, the committed open-shell baseline is available: `RF-6`'s current PNG is the before image; for RF-14…RF-17 the build also captures a **temporary open-shell comparison** by running the same state with the cap meshes hidden (a build-only switch, not shipped) and keeps both captures in `docs/M11-MEASUREMENTS.md` (the before image is not committed as a reference frame; it exists to make the review objective). The acceptance claim is not "different pixels" but shared checklist item 1: in the after image no interior wall is visible; in the before image it is. A frame where both look the same is a failure of the cap, not a pass.

---

## 8. Tests

The existing suite (89 tests at M10) must pass except the **two** test files whose literals change (`referenceFrames.test.ts` gains four frames, `uiText.test.ts` subtitle/note) and **one new test file** (`src/renderer/sectionCaps.test.ts`). Test-file accounting: **2 edited + 1 new = 3 files touched**. `viewLayout.test.ts` is **not** edited: the cap-builder default-state cases live in `sectionCaps.test.ts`, which imports the pure `SECTION_RANGES_MM` from `../renderer/viewLayout`. Every test can fail; each names the regression it catches.

**`src/renderer/sectionCaps.test.ts` (new; Node-only; imports Three.js math and `node:fs` to load the real GLBs, never creates a WebGL context):**

1. **Box section:** slice a 1 m centred cube at X = 0 and X = +0.3; assert exactly one loop and area = **1 m²** at both (the plane is interior, so the section is unchanged); at X = +0.6 (outside) assert zero loops. Assert every cap vertex is on the plane, `sectionUV` equals the projected `(y,z)`, and the triangulated area is the polygon area by the independent shoelace formula. **No winding/CCW assertion** — loop winding is arbitrary by design (§4.3). *Catches: a sign error that caps the wrong side, a projection that swaps axes, and an area/triangulation mismatch.*
2. **Cylinder / sphere sections:** slice a 32-segment cylinder **across** its axis (expected area πr²), **along** its axis (expected rectangle 2r × h), and a UV sphere at offset d (expected π(r²−d²)); all within 1 %. *Catches: missed crossings, and a wrong analytic case silently accepting any loop.*
3. **Hollow tube (annulus) + holes:** slice a tube (outer + inner walls) across its axis; assert two loops, the inner loop classified as a **hole by containment depth**, and the triangulated area = π(ro²−ri²) within 1 %. *Catches: hole handling that fills the bore — the exact defect the duct/pipe frames would show — and a signed-area classifier that depends on arbitrary winding.*
4. **Degenerate and open cases:** a plane exactly through a vertex/edge (no crash, no NaN, either no loop or a correct one); a coplanar face (skipped); a deliberately open box missing one face, sliced where the section is an open chain — assert the chain is **closed by one chord**, `closedChains === 1`, `droppedGroups === 0`, and the resulting loop has finite positive area; a deliberately self-intersecting open chain — assert it is **dropped and counted** (`droppedGroups === 1`) with no crash; two disjoint components (two loops). *Catches: division-by-zero, infinite loop tracing, silently dropping a non-watertight part, and a closure path that is asserted but never exercised.*
5. **Real-asset integration:** load `public/Duramax_LLY_2005_66L_V8.glb` and the ten internal part GLBs with `node:fs` (either the manual GLB JSON/binary-chunk parse used by `shellAssets.test.ts` or `GLTFLoader.parse` if it runs headlessly in the test environment — the builder pins whichever path the test uses), and assert: (a) the shell cap at X = 402.5 mm has a triangle count in the pinned range **400–1,200** (the planning prototype measured 609 for the shell at this plane; the build records its exact value and may re-pin the literal with the measured value, not widen the range), (b) every shell cap vertex lies within 1e-3 mm of the plane, (c) the **spring** sources are marked `hullOnly` (their cap comes from the cached hull, never a sliced spring surface), (d) the position-welded boundary-edge audit at 1e-5 m finds exactly the **5** partIds `ext_vc_fasteners_1`, `ext_vc_fasteners_2`, `ext_inj_return_line_2`, `ext_exh_manifold_lh_2`, `ext_exh_manifold_rh_2` (and **not** `ext_front_cover_1`), (e) slicing one piston in part-local space at a synthetic plane produces a closed loop with positive area (the full-assembly transforms are exercised by the build's runtime measurement, not by this unit test), (f) at the stock defaults (X = 900, Y = 580) the builder returns **zero** triangles, while the intercooler variant's bounds reach Y 696 mm and make Y = 580 return > 0 for that source. *Catches: a cap that is off-plane, a sliced spring, a non-watertight part silently disappearing, a piston section that is not closed, a default/variant plane-side error, and a mesh-loading path that cannot run in CI.*
6. **Build invariants (source-text test):** `renderer.render(` occurs exactly once in `engineScene.ts`; no `new THREE.WebGLRenderTarget(`, `stencil: true`, `renderer.clearStencil`, `renderer.setRenderTarget`, `scene.overrideMaterial` or `logarithmicDepthBuffer` appears in `src/renderer/**`; the cap material sets `depthWrite = true` and `depthTest = true`; the two cap meshes are `castShadow = false`. *Catches: a builder "improving" the feature into a stencil/multi-pass implementation, or a cap that fails to occlude.*

**`src/ui/referenceFrames.test.ts` (edited — expected id list):**

7. `REFERENCE_FRAME_DEFS` gains `RF-14`…`RF-17` in order after `RF-13`; each validates through the existing loop; each new frame's section mode/position is within `SECTION_RANGES_MM` (imported from the pure `../renderer/viewLayout`, not from `../renderer`), and each is a **cutting** position: for X, `positionMm < 617.8` (shell max X); for Y, `positionMm < 480.66` (stock shell max Y) or `< 696.00` for the intercooler frame, whichever applies. *Catches: a `?rf=` URL that silently falls back, a frame definition outside the slider ranges, and a non-cutting "section" frame.*

**`src/ui/uiText.test.ts` (edited — both literals):**

8. The subtitle appears verbatim as `Milestone 11 — Capped-Solid Cutaways` in `engineControls.ts` and `index.html`; the new cutaway note (§9) appears verbatim in `engineControls.ts`; the old string `Cutaway shows open shells — capped solid sections come later.` is absent **from `src/ui/engineControls.ts`** (the spec and prior docs legitimately quote it). *Catches: a shipped caption that still promises the feature or contradicts the cap.*

The headless tests cannot judge the look. The §7 frames are the visual gate; that split is the same one used since M2.

---

## 9. UI text

### 9.1 Cutaway note (verbatim, replaces the current string)

```
Section cut faces are filled as solid, hatched material — a diagrammatic section, not a machined or verified LLY surface.
```

The element stays `<p class="m4-cutaway-note">` in the Views group at the same position (`src/ui/engineControls.ts:923-928`); only the text changes. No new control, no new control state, no layout change.

### 9.2 Subtitles

- `index.html` subtitle → `Milestone 11 — Capped-Solid Cutaways`.
- `src/ui/engineControls.ts` runtime subtitle → `Milestone 11 — Capped-Solid Cutaways` (`:648-651`).

### 9.3 No other UI change

The controls, readouts, Build panel, Dyno, Sound control, captions (including the M10 illustrative caption) and labels are unchanged. The `?section` / `sectionPos` / `?rf` query surface is unchanged; `?rf=RF-6` keeps its meaning and gains the capped look, and `?rf=RF-14`…`?rf=RF-17` are new.

---

## 10. Build deliverables (docs and paperwork)

1. **`docs/M11-CUTAWAYS.md` (new):** the technique record — the adopted technique and the rejected alternatives with the §2.1 and prototype numbers; the slice/weld/loop/triangulate contract as built; the section colour/hatch constants as built; the static/dynamic source lists and the spring hull-proxy exception; the rebuild cadence; the artifact register (§4.6) as built; and the deferred alternatives (stencil/CSG/shader fill) with the exact budgets/evidence that rejected them.
2. **`docs/M11-MEASUREMENTS.md` (new):** the measured record — production bundle build; the static/dynamic rebuild timings (median/p95) for X = 402.5 and Y = −185, desktop and phone; the `?benchmark=1` matrix (desktop/phone × section off/on × stock/5-variant) with the D-033 verdict table and the new cap statistics; the cap triangle count and draw-call delta; the five frame captures with SHA-256 and checklist results; the open-shell before captures for the difference test; the frozen-file audit; the exact commands used.
3. **`docs/REFERENCE_FRAMES.md`:** re-baseline RF-6 (image + checklist item 2, which today describes the open-shell interior) and add RF-14…RF-17 definitions, images and checklists; update the intro count from thirteen to seventeen and the summary table.
4. **`docs/THREE_API_NOTES.md`:** add a **Milestone 11** section stating the pinned-API facts this feature depends on: local clipping generates no cap geometry (fragment discard only); `ShapeUtils.triangulateShape` is the Earcut wrapper exported by the pinned package; the cap material's tone-mapping/colour-space chunks; `DoubleSide` caps and depth; no stencil buffer by default; and the measured `STENCIL_BITS = 0`. Exact text in §11.5.
5. **`docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`:** exact text in §11.1–§11.3.
6. **`index.html`:** subtitle only. **No `src/renderer/exteriorLoader.ts`, `layout.ts`, `partLoader.ts`, `partVariants.ts`, `viewLayout.ts`'s ranges, catalog, config, core, perf or assets changes.**
7. Prior milestone docs and specs, all GLBs, `docs/PLANNING.md`, `docs/ORCHESTRATOR.md`, `docs/ASSET_CONTRACT.md`, `docs/M2`–`M10` docs stay **byte-identical**.

The renderer's exported interface gains only additive, optional statistics fields used by the benchmark and the measurements doc (`sectionCapStaticMs`, `sectionCapDynamicMs`, `sectionCapTriangles`, `sectionCapOpenChains`, `sectionCapClosedChains`, `sectionCapDroppedGroups`, `sectionCapHullOnlySources`).

---

## 11. Exact paperwork text

### 11.1 `docs/PLAN.md`

After the Milestone 10 block, add:

> 11. **Capped-solid cutaways**
>     - Turn the Section view's hollow open shells into capped solid sections by extracting each clipped part's true cross-section at the plane on the CPU and rendering it as a flat, hatched, single-colour cap mesh with real depth — no stencil buffer, no render target, no extra render pass, no shader depth trick (all rejected on measured budget/visual grounds).
>     - Exit: a cut piston, a cut cylinder head and the sectioned exterior shell read as solid material at RF-6 (re-baselined) and RF-14…RF-17; D-033 passes on both tiers with measured numbers including the per-frame cap-rebuild CPU cost; section-off reference frames are pixel-unchanged; the caption no longer promises the feature and states the section fill's diagrammatic scope.

Replace the post-milestone candidates line with:

> After 11: shareable builds, the LLY plastic upper intake manifold cover (the only lettered surface) as an optional cosmetic part, stock vehicle-side hardware models, the remaining internal-part visual variants (rods, injectors, CP3, camshaft, heads), real wall-thickness section geometry, and an analytic coil section for the valve springs (currently capped through a solid hull proxy) are candidates.

### 11.2 `docs/DECISIONS.md`

Add under a new `## 2026-11-14 — Milestone 11 spec` heading:

> - **D-043 Capped-solid cutaways (Milestone 11).** The Section view's cut faces are produced by **runtime cross-section extraction and triangulation**: for every clipped part (with the 32 helical valve springs capped through a closed convex-hull proxy rather than their wire surface, so no part is left uncapped), the CPU intersects the part's triangles with the plane, welds the segments into closed loops, classifies holes, triangulates with three's `ShapeUtils.triangulateShape`, and writes the result as a flat, hatched, single-colour cap mesh at the plane with real depth. Static sources (exterior shell, cylinder heads, injectors, main shaft, external variants) rebuild only when the plane/explode/variant/exterior/x-ray state changes; dynamic sources (pistons, rods, crank throws, bridges, rockers, pushrods, lifters, valves, and the spring hull proxies) rebuild every frame. **Appearance:** one unlit cut-bronze section colour (`0.290, 0.170, 0.086` linear) with a 45° plane-locked hatch (5.0 mm spacing) carried by a per-vertex section-UV attribute; the cap communicates the plane, solidity, and that the face is diagrammatic, not a part material or a verified surface. **Scope:** all clippable parts; the 32 springs use *local* convex-hull proxies, and the 5 non-watertight shell partIds are closed by a local chord in the plane — neither is the rejected global hull route; the cap is the solid cross-section of the model, so enclosed cavities are filled and a shell-crossing plane legitimately hides internals behind it (X-Ray or Exterior-off shows them). **Interactions:** live with the slider (static set rebuilt at most once per frame), correct under explode (dynamic set per frame), x-ray suppresses shell caps, exterior toggle and variants need no special code, label rules unchanged. **Budgets:** +2 draw calls, cap triangles capped at 16,000 and measured, CPU rebuild targets ≤ 8 ms desktop / ≤ 16 ms phone static and ≤ 6.5 ms / ≤ 13.0 ms dynamic (hull-inclusive projection ≈6.1 ms), measured by the build; the renderer stats type gains additive, optional cap fields (`sectionCap*`), which does not touch D-010; no D-033 budget is raised, no stencil buffer, no render target, no extra render pass, no new dependency. **Rejected:** stencil-buffer capping (+616,520 submitted triangles full-scene, +208,024 for the smallest proof-covering subset — both tiers breach the submitted-triangle cap; requires a stencil context), the shader back-face fill (prototype: +0 calls/+0 triangles but a flat wall over intact geometry — 4–42 % of pixels changed depending on threshold, an independent diff gave 4.23 % at RF-6 — at ≈2.7–3.2 ms GPU; not a cap), and convex-hull proxies (46.9 % overfill vs the true shell section at X = 402.5 mm). **Visual proof:** RF-6 re-baselined, RF-14 (cut piston), RF-15 (cut head), RF-16 (sectioned exterior shell), RF-17 (longitudinal Y = −185 cut), each with a numbered checklist that fails on any visible hollow interior. **UI:** the "capped solid sections come later" note is replaced by "Section cut faces are filled as solid, hatched material — a diagrammatic section, not a machined or verified LLY surface." and the subtitles become `Milestone 11 — Capped-Solid Cutaways`.

### 11.3 `docs/OPEN_ITEMS.md`

Add to **Watch items**:

> - [ ] **Spring hull caps are solid ellipses (diagrammatic)** — the 32 springs are capped through a closed convex hull, so a plane through a coil shows a solid section rather than wire cross-sections, consistent with the solid convention but not a real spring section. Revisit if a cheap analytic coil section or real spring wall geometry appears.
> - [ ] **Cap rebuild CPU on low-end phones** — the static rebuild is the heaviest single event (target ≤ 16 ms phone); M11 measures it on the reference machine. Revisit with a worker/incremental rebuild if real phones exceed the budget.
> - [ ] **True wall-thickness section caps** — M11 caps the modelled solid cross-section; real castings are thin-walled. A future asset project that gives the shell/heads wall thickness would allow material-band caps instead of solid fills; it would also change the D-033 asset budgets.

Add to **Deferred candidates**:

> - [ ] **Per-part or per-material section colours / section outlines** — M11 chooses one section colour so the cut plane reads as a diagrammatic convention; part identity stays with labels/build panels. Revisit only alongside a legibility study.

### 11.4 `docs/REFERENCE_FRAMES.md`

Add four frame definitions in the existing format (crank angle, camera, target, lens, quality, exterior, views, build, numbered "what to look for", image, caption), add the four rows to the summary table, re-baseline RF-6's image and checklist text (its item 2 currently documents the open-shell interior and the old UI note), update the intro sentence from thirteen to seventeen frames and the provenance line to include M11, and add a short "Section-fill checklist" section shared by RF-6/RF-14…RF-17 (the §7.2 list).

### 11.5 `docs/THREE_API_NOTES.md`

Append a `## Milestone 11 Section-Cap APIs (0.187.0)` section stating, with the pinned-package citation style used by the file:

- Local clipping is a fragment discard (`clipping_planes_fragment`: `if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;`) and generates no cap geometry; the cap must be built.
- `ShapeUtils.triangulateShape(contour, holes)` is exported by the pinned package and wraps its internal Earcut; it returns triangle index triplets into the flattened contour+holes array. **Both arguments must be `THREE.Vector2[]`/`THREE.Vector2[][]`** — the implementation calls `Vector2.equals` on the points, so plain `{x,y}` objects throw. No new dependency.
- `ConvexHull` is available from `three/addons/math/ConvexHull.js` (no new dependency); `setFromPoints(Vector3[])` builds a closed hull whose faces can be sliced. **It is used only for the two `hullOnly` spring batches**, never as a fallback for non-watertight sources: the shell's cap sources are material-merged buckets, so hulling one would overfill a whole bucket (the 46.9 % case rejected in §2.1). The spring hull is stored per instance and sliced with the spring's instance matrix.
- Cap geometry is a plain `BufferGeometry` with `position` + a custom `sectionUV` attribute, rendered by a `ShaderMaterial` that must include `tonemapping_fragment` and `colorspace_fragment` to sit in the app's ACES/linear-sRGB pipeline; `depthWrite`/`depthTest` stay `true`, `side` is `THREE.DoubleSide`.
- Caps are `Mesh` objects added to the scene; `frustumCulled = false` because their geometry is rebuilt in place; `castShadow = false`/`receiveShadow = false`.
- The renderer still has **no stencil buffer** (`stencil` defaults to `false`; measured `STENCIL_BITS = 0`) and no render target is used by this feature.
- The frame still issues exactly one `renderer.render(scene, camera)`.

---

## 12. Acceptance criteria (Buckley verifies from a fresh clone)

1. **Frozen audit:** `git diff main -- src/core src/perf catalog src/config src/audio src/assets .github vite.config.ts tsconfig.json package.json package-lock.json public/models public/hdri public/legacy assets-src src/renderer/exteriorLoader.ts src/renderer/layout.ts src/renderer/partLoader.ts src/renderer/partVariants.ts src/renderer/variantLoader.ts docs/M2-MEASUREMENTS.md docs/M3-MEASUREMENTS.md docs/M4-MEASUREMENTS.md docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M7-MEASUREMENTS.md docs/M8-VARIANTS.md docs/M8-MEASUREMENTS.md docs/M9-SOUND.md docs/M9-MEASUREMENTS.md docs/M10-EXTERIOR.md docs/M10-MEASUREMENTS.md docs/specs/M0-* … docs/specs/M10-* docs/research/L7-* docs/research/M8-* docs/research/M9-* docs/research/M10-* docs/PLANNING.md docs/ORCHESTRATOR.md docs/ASSET_CONTRACT.md` is empty. All 16 GLBs are byte-identical.
2. **Fresh-clone gates:** `npm ci`, `npm run typecheck`, `npm test`, `npm run build` pass on Node 24. No test file outside the three named in §8 (1 new + 2 edited) is edited.
3. **Single-render and no-stencil invariant:** `renderer.render(` appears exactly once in `engineScene.ts`; no stencil, render target or extra pass was added; `renderer.info.render.calls` is 98/60 (stock) or 99/62 (5-variant) at the section-active benchmark states (baseline + 2 cap meshes), and submitted triangles exceed the baseline by the measured cap triangle count (≤ 16,000).
4. **Budgets:** the `?benchmark=1` matrix (desktop 1440×900 Full, phone 390×844 Phone; Section off and X @ 402.5; stock and worst-case 5-variant; plus Section + X-Ray) reports the M10 geometry numbers plus the +2 calls / cap triangles, VRAM 20.75/4.75 MiB, p95 within +0.30 ms of the M10 rows, zero dropped frames; the static/dynamic rebuild timings are recorded against the §6.3 targets. Any breach is a stop-and-report.
5. **Visual proof:** RF-6 is re-baselined; RF-14…RF-17 exist at the pinned poses and every checklist item in §7.2 passes; each capped frame's open-shell before capture is recorded in `docs/M11-MEASUREMENTS.md` and the difference is unmistakable (no interior wall visible in the after image).
6. **Section-off invariance:** live re-renders of RF-1…RF-5 and RF-7…RF-13, pixel-compared in the 3D viewport region against the committed PNGs, show **0 differing pixels** (the HUD subtitle/note changes are masked; the frames' 3D content must be untouched, because the cap meshes are invisible with the section off).
7. **Caption/UI:** the §9.1 note and §9.2 subtitles are verbatim; the old promise is absent; the M10 illustrative caption is unchanged; no other UI text changes; zero console errors on a fresh load.
8. **Interaction checks:** with Section X @ 402.5 mm and Exterior on, toggling X-Ray suppresses shell caps and keeps internal caps (screenshot pair recorded); exploding to 100 % keeps caps on the parts that still cross the plane and removes them from parts lifted clear (screenshot pair); dragging the slider from 900 to 402.5 shows caps appear and track the plane within one frame (frame sequence recorded); section mode Y @ −185 produces the RF-17 look.
9. **Docs:** `docs/M11-CUTAWAYS.md` and `docs/M11-MEASUREMENTS.md` are complete per §10; the PLAN/DECISIONS/OPEN_ITEMS/REFERENCE_FRAMES/THREE_API_NOTES changes match §11 exactly; prior docs are byte-identical.
10. **Outside review (D-021)** recorded for the milestone-exit PR.

---

## 13. Frozen and changed files

**Frozen — no changes:** `src/core/**`, `src/perf/**`, `src/config/**`, `catalog/**`, `src/audio/**`, `src/assets/**`, `src/renderer/exteriorLoader.ts`, `src/renderer/layout.ts`, `src/renderer/partLoader.ts`, `src/renderer/partVariants.ts`, `src/renderer/variantLoader.ts`, `public/models/**` (all 15 GLBs), `public/Duramax_LLY_2005_66L_V8.glb`, `public/hdri/**`, `public/legacy/**`, `assets-src/**`, `package.json`/`package-lock.json`, `.github/**`, `vite.config.ts`, `tsconfig.json`, every doc M0–M10 listed in §12.1. **No new npm dependency.**

**Changed (expected):**

- `src/renderer/sectionCaps.ts` *(new)* — slicing, welding, loop tracing, hole classification, triangulation, cap material, constants, orchestrator.
- `src/renderer/sectionCaps.test.ts` *(new)* — tests 1–6.
- `src/renderer/engineScene.ts` — create the cap material/meshes, register sources, rebuild static/dynamic caps in the existing state paths, add the cap statistics fields.
- `src/renderer/index.ts` — export the new module's public names (tests only; no controller shape change beyond the additive stats fields).
- `src/ui/referenceFrames.ts` (four new definitions), `src/ui/referenceFrames.test.ts` (expected ids), `src/ui/uiText.test.ts` (subtitle + note literals). `src/renderer/viewLayout.test.ts` is **not** edited.
- `src/ui/engineControls.ts` (cutaway note + subtitle only), `index.html` (subtitle only).
- `docs/M11-CUTAWAYS.md`, `docs/M11-MEASUREMENTS.md` *(new)*; `docs/REFERENCE_FRAMES.md`, `docs/THREE_API_NOTES.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`; `docs/reference-frames/RF-6.png` (re-baselined), `RF-14.png`…`RF-17.png` *(new)*.

**If you believe any other file must change, stop and report it instead of changing it.**

---

## 14. Pre-build self-check (recorded)

Every number below was produced before this spec was finalised, from committed/measured values and the planning prototypes. Baseline: `main` @ `6dc2396`. The planning artefacts are not committed; the arithmetic and the measurements are re-runnable from the values quoted here.

### 14.1 Shipped baseline and D-033 headroom

```
desktop full, section off/on : 96 calls / 579,484 submitted tris (identical; measured)
desktop ext off, section on  : 73 calls / 542,384 submitted tris (measured)
phone full (M10)             : 58 calls / 307,876 submitted tris
x-ray + section (pre-existing): 119 calls / 616,584 submitted tris (measured)
scene tris                   : 308,324 (ext on) / 271,224 (ext off)
headroom                     : desktop +154 calls / +120,516 tris
                               phone   +62 calls / +92,124 tris
```

### 14.2 Rejected techniques (measured/computed)

```
stencil full scene : +119 calls ; +616,520 tris
                     desktop 215 / 1,196,004 (FAIL 700,000) ; phone 177 / 924,396 (FAIL 400,000)
stencil proof set  : +63 calls ; +208,024 tris
                     desktop 159 / 787,508 (FAIL) ; phone 121 / 515,900 (FAIL)
shader fill        : +0 calls / +0 tris ; GPU delta of the fill over the open-shell sectioned frame
                     +2.7–3.2 ms/frame (timer medians: before-on 5.83/7.53 → after-on 9.00/10.19 ms;
                     the sectioned frame itself is ≈+2.9 / +4.5 ms slower than section-off: 5.83−2.97, 7.53−3.04)
                     large viewport changes at RF-6 and with the exterior on (the prototype operator's
                     threshold gave 14.4 % / 42.3 %; an independent capture diff gave 4.23 % at RF-6
                     with a >20/255 threshold — the exact fraction is threshold-dependent, the
                     qualitative flat-wall result is not); flat hatched wall over intact geometry;
                     no cap read in any state; the no-depth variant still fills silhouettes.
hull proxy         : true shell section 0.211 m² ; hull 0.310 m² ; overfill 46.9 % at X = 402.5.
```

### 14.3 Adopted technique — measured planning prototypes

Two **partial** prototypes were built (not the final algorithm) to bound the cost; their numbers are quoted as ranges across re-runs, and neither implements the full turn heuristic + hole classification, so they are lower bounds:

```
sliced dynamic set (pistons, rods, throws, valves, bridges, rockers, pushrods, lifters):
  123,584 tris; tight slice only 1.2 ms/frame (linear from a 100,224-tri representative set)
spring hull set: 32 hulls x 326 tris = 10,432 hull tris/frame — sliced per frame, not "negligible"
static set (shell, heads, injectors, main shaft): 73,828 tris; slice only 0.7 ms/change
full naive pipeline on the shell (slice + weld + earcut + allocations): 10.15–10.22 ms/change
  1,300–1,356 segments (two probes, different epsilon) ; 62 loops ; 0 open chains ;
  100 ambiguous junctions resolved by the turn heuristic ; 609 cap triangles
partial optimised pipeline on the shell (typed arrays + numeric weld keys + Earcut):
  1.41–1.68 ms/change ; 31 filled loops + 5 open chains (no turn heuristic, no hole classification)
  ; 536 cap triangles
```

The two probes differ in epsilon and in whether they implement the turn heuristic/hole handling; they **bound** the cost rather than measuring the final algorithm. The optimised run's 5 open chains are exactly the failure mode the turn heuristic must eliminate — the naive run, which implements it, produces **0 open chains** at the same plane. The full-pipeline rate (1.4–1.7 ms / 37,100 tris ≈ 45 ns/tri) projects to **≈5.6 ms/frame** for the 123,584-triangle sliced set, which is why the dynamic budget is ≤ 6.5 ms desktop / ≤ 13.0 ms phone, not 3/6.

**The "100,224-tri representative set" is not the dynamic set**: it is a mixed 100k-triangle timing sample (it double-counts both rocker primitives and omits valves); it is used only for the per-triangle slice rate, and the dynamic-set projection above uses the correct 123,584 count.

**Cap geometry budget:** the shell contributes 609 triangles at X = 402.5; the internal static sources a few hundred; the dynamic sources a few thousand; spring hull sections a few hundred; the 16,000-triangle cap is conservative. Draw calls +2.

`ShapeUtils.triangulateShape` requires `THREE.Vector2` contour/hole arrays (it calls `Vector2.equals` internally), which is a build detail recorded in §11.5.

### 14.4 Cap source arithmetic

```
internal 270,080 tris = 8 pistons (38,656) + 8 conrods (9,440) + 4 throws (5,408) + 8 heads (28,256)
  + 8 injectors (7,392) + 32 valves (33,280) + 32 springs (110,848) + 16 bridges (6,528)
  + 16 rockers (9,920) + 16 pushrods (13,440) + 16 lifters (6,912)
spring hull set: 32 closed hulls x 326 tris = 10,432 hull triangles — capped, not sliced
sliced dynamic set = 270,080 - heads 28,256 - injectors 7,392 - springs 110,848 = 123,584
  (pistons 38,656 + rods 9,440 + throws 5,408 + valves 33,280 + bridges 6,528 + rockers 9,920
   + pushrods 13,440 + lifters 6,912 = 123,584)
static cap set  = shell 37,100 + heads 28,256 + injectors 7,392 + main shaft 1,080 = 73,828
```

The spring hulls add only their own few hundred cap triangles; the 16,000 ceiling covers them.

### 14.5 Number provenance

| Number | Value | Derivation / source |
| --- | ---: | --- |
| Internal instanced triangles | 270,080 | `docs/M3-MEASUREMENTS.md:31`; `getRenderStats().internalSceneTriangles` |
| Per-part triangles | piston 4,832 / rod 1,180 / throw 1,352 / head 3,532 / injector 924 / valve 1,040 / spring 3,464 / bridge 408 / rocker 620 / pushrod 840 / lifter 432 | GLB parse; M2/M3 tables |
| Main shaft / ground | 1,080 / 64 | `getRenderStats`; M4 §10 |
| Exterior shell | 37,100 / 23 meshes | `docs/M10-MEASUREMENTS.md:15-19` |
| Submitted totals | 579,484 / 542,384 | measured this session; matches `docs/M10-MEASUREMENTS.md:192` |
| D-033 budgets | 700,000 / 400,000 / 250 / 120 | `docs/M2-MEASUREMENTS.md:120-126` |
| True shell section area | 0.211–0.213 m² | scanline parity over ≈1,300–1,356 plane-crossing segments at X = 402.5 (ε-dependent) |
| Hull section area | 0.310 m² (+46.9 %) | `ConvexHull` per shell mesh, same plane |
| Non-watertight shell partIds | 5 | position-welded boundary-edge audit at four weld quanta |
| Spring convex hull | 326 tris/hull; 32 hulls = 10,432 tris/frame | `ConvexHull` on the two spring geometries |
| Shader-fill visual change | 4–42 % of viewport (threshold-dependent) | planning prototype, five states; independent diff 4.23 % at RF-6 with >20/255 |

### 14.6 Conflicts found while drafting (all resolved in the spec, none silently)

1. **"Capped sections" vs the submitted-triangle budget.** Stencil capping cannot cover the milestone's proof subjects on either tier; the shader fill is not a cap; the hull proxy overfills 46.9 %; resolved by adopting exact CPU cross-section caps with a measured CPU budget and a bounded triangle count, not by raising D-033.
2. **The models are closed single-surface shells, so a "solid" cap fills enclosed cavities.** This is stated as the convention (§2.2): a shell-crossing plane hides internals behind the solid section; X-Ray/Exterior-off shows them. This is the only honest reading of "solid material" without wall-thickness geometry.
3. **The 32 springs are capped through a convex-hull proxy, not sliced.** They are 41 % of the internal triangles and a plane through a coil yields thin wire sections; the 326-triangle hull gives a solid elliptical section at ~10,432 hull triangles/frame, consistent with the solid convention. Its local overfill (filling between coils) is documented, and the proof planes do not cut springs (X = 402.5 passes between the two valve rows at X ≈ 380.5/424.5; Y = −185 is inboard of the spring centres at ≈ −202/−235 mm).
4. **The default section positions cut nothing on the stock build.** The cap builder returns zero triangles at X = 900 / Y = 580 for the stock scene (all sources on the kept side); with the intercooler variant attached, Y = 580 legitimately cuts that model. Test 5(f) pins both the stock zero case and the variant non-zero case, so no special gate is needed and the variant behaviour is correct rather than suppressed.
5. **The naive contour pipeline is 10.22 ms/change on the shell**, not the 0.35 ms of the tight slice. The gap is loop welding/triangulation/allocation; the spec sets the optimisation target and the build measures it. A breach is a stop-and-report.
6. **The x-ray + section state has 119 calls / 616,584 submitted triangles** (pre-existing: all 23 exterior meshes are `DoubleSide` transparent → two passes). M11 includes that state in the benchmark rows so the new numbers are complete and the cap suppression is measured.
7. **The shader-fill prototype is recorded as rejected evidence**, including its +0/+0 metrics, so the survey and spec cannot be read as rejecting it for taste: it was measured, and it paints walls over intact geometry.
8. **Section fill vs the firing highlight.** The cap is separate geometry, so the orange emissive never appears on a cut face; the frames are chosen so this is not mistaken for a defect.
9. **Five shell partIds are not watertight** (position-welded boundary-edge audit at 1e-5 m: `ext_vc_fasteners_1` 336, `ext_vc_fasteners_2` 168, `ext_inj_return_line_2` 32, `ext_exh_manifold_lh_2` 32, `ext_exh_manifold_rh_2` 32; `ext_front_cover_1` is watertight). A pure loop tracer would drop their caps. Resolved by **local chord closure** of the open chain (§4.3) — not a hull fallback: the cap sources are material-merged buckets, so a per-source hull would hull a 10,048-triangle steel bucket and reintroduce the rejected 46.9 % overfill. The closure is pinned by test 5; a global hull cap stays rejected.

---

## 15. Handoff

Work on branch `m11-capped-cutaways` in the local clone, created from `main` at `6dc2396`. Implement in this order:

1. **`src/renderer/sectionCaps.ts`** — constants, tight slice, weld/loop trace (with open-chain/ambiguous counting), hole classification, `ShapeUtils.triangulateShape` wrapper, cap material (hatch + tone mapping/colour space), orchestrator with pre-allocated buffers. Keep the pure geometry functions independent of the scene so tests 1–5 can drive them.
2. **`engineScene.ts` seams** — create the material and two cap meshes; register static/dynamic sources at creation/load; mark static dirty in `setSectionState`/`setExplodeFactor`/`syncExteriorShellState`/`syncVisualVariants`; rebuild dynamic (and static if dirty) in `update()` before the single render; skip invisible and ghosted sources; dispose the cap geometry/material. Keep **one** `renderer.render` call and no new WebGL resources beyond the two buffer geometries.
3. **Tests** — `sectionCaps.test.ts` (1–6, including the default/variant plane-side case), the frame list in `referenceFrames.test.ts` (7), the text literals in `uiText.test.ts` (8). Run `npm run typecheck && npm test && npm run build`.
4. **Measure and optimise** — instrument the static/dynamic rebuild timings; hit the §6.3 targets or stop and report; record the cap triangle count.
5. **Frames** — add `RF-14`…`RF-17` to `src/ui/referenceFrames.ts`; capture at 1440×900 → 1024×640; re-capture RF-6; mask-compare the section-off frames; record everything in `docs/M11-MEASUREMENTS.md`, with the pre-fill comparisons.
6. **UI** — note (§9.1) and subtitles (§9.2).
7. **Docs** — `docs/M11-CUTAWAYS.md`, then the §11 paperwork, `docs/REFERENCE_FRAMES.md`, and the five images.

No new npm dependencies; no asset or catalog changes; no edits to frozen files. When done, push the branch and send a closing summary covering: files changed; test/typecheck/build results; the single-render and frozen-file audits; the static/dynamic rebuild timings; the `?benchmark=1` section-off/on rows for both tiers and both build states; the cap triangle count and draw-call delta; the five frame captures with SHA-256 and checklist results; the x-ray/explode/slider interaction captures; and anything that deviated from this spec. Buckley verifies from a fresh clone, opens the PR, and merges.
















