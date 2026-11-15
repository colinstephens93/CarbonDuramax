# M11 Capped-Solid Cutaways — Sectioning Survey and Capping-Technique Trade-offs

Purpose: establish, before any Milestone 11 spec is written, (A) exactly how the shipped Section view works — the clipping implementation, the meshes/materials it clips, how the plane and slider are wired, and what the cut currently looks like — and (B) what it would cost this codebase to make cut faces read as solid material, comparing stencil-buffer capping, geometry/CSG approaches, and shader techniques against the frozen interfaces and the D-033 budgets.

Researched 2026-11-14 on branch `plan/m11-capped-cutaways` from `main` @ `6dc2396`. **Nothing in Part A is inferred from memory**: every code claim is cited by file and line in this repo; every measured number was produced in this planning session (headless Chrome on the target machine's Intel Arc GPU) or is cited from the milestone measurements docs. Part B's external facts are graded in the companion file [`M11-capping-techniques.md`](./M11-capping-techniques.md) (sources with URLs); this file states the engineering arithmetic against this repo.

**Reliability grades for external facts (Part B):** **A** = three.js source / maintainer documentation / WebGL spec or extension registry; **B** = upstream docs or maintainer example; **C** = reputable third-party technical write-up; **D** = forum/opinion. Every external value is quoted as published with its source in the companion survey.

---

## Part A — Sectioning as shipped

### A.1 The data path (one plane, per-material clipping)

The Section view is a **per-material local-clipping plane**. There is no section geometry, no stencil buffer, no render target and no extra render pass anywhere in the path.

| Step | What happens | Where |
| --- | --- | --- |
| Control | `<select id="m4-section-select">` (Off / Front–Back (X) / Side (Y)) + `<input id="m4-section-pos-slider">` (range slider, disabled while Off; the inline label shows the position in mm, or `Off`) | `src/ui/engineControls.ts:852-893`, `:1113-1145`, `:1217-1223` |
| Callback | `onSectionChange(mode, positionMm)` fires on mode change and on **every** slider `input` event (live while dragging) | `src/ui/engineControls.ts:614`, `:1129`, `:1144` |
| Wiring | `main.ts` forwards it to `scene.setSectionState(mode, positionMm)` and refreshes labels | `src/main.ts:131-134` |
| Plane | A single reusable `THREE.Plane`: `x` → normal `(-1,0,0)`, constant `posMm/1000` (keeps `x <= pos`); `y` → normal `(0,-1,0)`, constant `posMm/1000` (keeps `y <= pos`) | `src/renderer/engineScene.ts:187-206`; pure twin at `src/renderer/viewLayout.ts:361-394` |
| State | `setSectionState` clamps the position, rebuilds the plane **in place**, then assigns `material.clippingPlanes = [sectionPlane]` (or `null` when Off) to every material in the clippable set | `src/renderer/engineScene.ts:1510-1524` |
| Renderer | `renderer.localClippingEnabled = true`; the renderer is constructed **without** a stencil buffer | `src/renderer/engineScene.ts:377-381` |
| Shader churn | Off ↔ On changes the clipping-plane **count** (0→1), so three.js compiles a second program variant once; dragging the slider only mutates the plane in place and updates the plane uniform (no recompile per frame) | `docs/THREE_API_NOTES.md:98-106` |
| Labels | Any label anchor on the clipped side (`signedDistance < 0`) is hidden; no other label rule | `src/renderer/viewLayout.ts:405-434`; `src/renderer/engineScene.ts:1546-1564` |

Ranges and defaults (identical values duplicated in the UI layer, `src/ui/engineControls.ts:69-74`, and the renderer layer, `src/renderer/viewLayout.ts:116-130`):

| Mode | min | max | default | step | Meaning of the default |
| --- | ---: | ---: | ---: | ---: | --- |
| Front–Back (X) | −150 mm | +900 mm | **+900 mm** | 0.5 mm | Keeps the whole engine; **selecting Section cuts nothing until the slider moves** |
| Side (Y) | −580 mm | +580 mm | **+580 mm** | 0.5 mm | Keeps the whole engine; same behaviour |

### A.2 What is clipped — and what is not

`clippableMaterials` is an explicit `Set<THREE.Material>`; `registerClippableMaterial` sets `clipShadows = true` and the current plane array on each member (`src/renderer/engineScene.ts:416-429`). Members registered today:

1. Every unique internal part material from the ten GLBs, including the firing-highlight clone materials (`:1143-1149`, `:958-961`).
2. The turned main crankshaft material (`:471`; geometry built in `engineScene.ts`).
3. Every unique exterior-shell material (`:1314-1317`).
4. Every external variant model material, and the low-compression piston variant materials (`:1356`, `:1369`).
5. **Excluded by design:** the studio ground material (`:450-465`), so the ground disc, HDRI background and UI never clip.

The clipping applies to **instanced** internals and to merged exterior meshes alike. All internal and exterior materials are authored `doubleSided: true` (verified by parsing the GLBs: 12/12 exterior materials, 3/3 piston materials, 2/2 head materials, 3/3 valve materials), so a clipped opaque part currently shows its far interior wall instead of disappearing.

View-state interactions that already exist and constrain any capping design:

- **Explode** moves geometry along station/bore vectors every frame; the plane stays fixed in world space (`src/renderer/engineScene.ts:1444-1459`, `:649-904`).
- **X-Ray** ghosts the exterior shell (`transparent = true`, `opacity = 0.22`, `depthWrite = false`, snapshot/restore per material) so internals show through (`:1076-1107`).
- **Exterior toggle** only changes the shell group's visibility (`:1076-1079`); materials stay registered.
- **Shadows:** clipped materials use `clipShadows = true`; the Phone tier disables the shadow map entirely (`:382`, `:1396-1411`).
- **Section + explode + x-ray + labels can be combined** — the M4 measurements benchmarked exactly that state (`docs/M4-MEASUREMENTS.md:28-40`).

### A.3 Measured baseline (this planning session)

Captured with the production bundle served on the target machine, headless Chrome with the real GPU (`ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (8GB) …, D3D11)`), 1440×900, DPR 1, stock build, after asset load. `renderer.info` totals include the shadow pass on Full.

| State | Calls | Submitted triangles | `visibleSceneTriangles` |
| --- | ---: | ---: | ---: |
| Full, exterior **on**, Section **off** (RF-3 pose) | 96 | 579,484 | 308,324 |
| Full, exterior **on**, Section **X @ 402.5 mm** | **96** | **579,484** | 308,324 |
| Full, exterior **off**, Section **off** (RF-2 pose) | 73 | 542,384 | 271,224 |
| Full, exterior **off**, Section **X @ 402.5 mm** (RF-6 state) | **73** | **542,384** | 271,224 |
| Phone baseline (M10 measurement, exterior on, 390×844) | 58 | 307,876 | 308,324 |

So the shipped cutaway costs **0 draw calls and 0 submitted triangles**. That is the number any capping technique has to fit inside: the D-033 headroom at the measured baseline is **+154 calls / +120,516 submitted triangles on Desktop** and **+62 calls / +92,124 submitted triangles on Phone** (`docs/M2-MEASUREMENTS.md:120-126`; current values `docs/M10-MEASUREMENTS.md:203-217`).

### A.4 What the cut currently looks like (and why)

At RF-6 (Section X @ 402.5 mm, exterior off, θ = 0°) the front paired station is bisected. The committed frame's own checklist documents the visual: *"`DoubleSide` internal PBR materials reveal clean open-shell interior geometry at the cut plane"* (`docs/REFERENCE_FRAMES.md:142`). In the captured frame the effects are explicit:

- The cylinder-head slices are hollow castings: you see the inside of the far wall, with valve stems, springs and injector bodies cut open as tubes.
- The Cylinder 1 piston is cut in half and its inner wall/wrist-pin cavity is visible instead of a solid crown/skirt section.
- With Exterior **on** at the same plane (captured in this session), the valve covers, intake duct, block skirt, oil pan, charge pipes and turbo inlet read as open-ended shells: large hollow tubes and boxes with visible far interior walls.
- The cut edge of every part is a thin, unmarked rim; there is no face at the plane, so the eye reads "sliced hollow model", not "sectioned solid engine".

This is the behaviour M4 specified and deferred: `docs/specs/M4-views.md:14` ("Capped solids remain deferred per the plan — cut faces show the open-shell look"), `:48` (clipping mechanism; "Capped solids are out of scope (plan-deferred): cut parts show hollow interiors — expected"), and `:85` (the caption line M11 replaces). The plan records the deferral in D-027 (`docs/DECISIONS.md:48`) and the promise in the Views panel at `src/ui/engineControls.ts:924-926`.

### A.5 Why clipping alone can never produce a cap

Three.js local clipping is a per-fragment discard (`clipping_planes_fragment`: discard where `distanceToPoint(p) < 0`; `docs/THREE_API_NOTES.md:98-103`). It removes the near half of a part and leaves the remaining half's *existing* surfaces. A cap is a **new surface at the plane** that does not exist in any asset. Every candidate technique below therefore synthesises that surface — as geometry, as a stencil-defined plane fill, or as a re-shaded existing fragment.

Assets are frozen for M11 (no geometry or asset-contract changes), so "model the caps into the parts" is out of scope by construction, and the section position is continuous (0.5 mm steps over 1,050 mm on X, 1,160 mm on Y), so pre-baked cap meshes at fixed positions cannot cover the slider.

---

## Part B — Candidate capping techniques against this codebase

The comparison uses four hard numbers: **draw calls**, **submitted triangles** (`renderer.info.render.triangles`, the D-033 metric that counts every submitted index, including passes whose fragments are later culled), **extra passes/state**, and **what must change** (renderer construction, interfaces, assets, dependencies). Frame-time risk is discussed per technique and measured for the adopted one in the spec's self-check.

Mesh inventory used in the arithmetic (measured/structure-derived): internal detailed assembly **35 instanced draw calls / 270,080 triangles** (`docs/M3-MEASUREMENTS.md:31`); main shaft **1 call / 1,080 triangles**; exterior shell **23 merged meshes / 37,100 triangles** (`docs/M10-MEASUREMENTS.md:19, 194`); scene totals `271,224` (exterior off) / `308,324` (exterior on); per-unit head **3,532 triangles** (M3 re-measured, `docs/M3-MEASUREMENTS.md:24`; M2's 3,516 was the pre-recess value); piston **4,832 triangles / 8 instances**.

### B.1 Stencil-buffer capping (the three.js `webgl_clipping_stencil` method)

**How it works.** For each capped object, render its geometry twice into the stencil buffer with a trivial material (`colorWrite = false`): back faces increment, front faces decrement, with the section clipping plane applied; then draw a plane quad at the section plane with `stencilFunc = NotEqual, ref = 0` and the cap colour. The stencil parity marks exactly the pixels where the plane lies inside the solid. It needs a **stencil buffer**, which this renderer does not have: `new THREE.WebGLRenderer({ antialias: true })` (`src/renderer/engineScene.ts:377`) leaves `stencil` at its `false` default (`docs/THREE_API_NOTES.md:31`), and the running app's WebGL2 context reports **`STENCIL_BITS = 0`** (measured this session on the target GPU). It also needs two extra scene renders per frame, so `renderer.shadowMap.autoUpdate` must be turned off and driven once per frame, otherwise every extra pass re-renders the shadow map.

**Cost arithmetic (each capped mesh contributes 2 draw calls; each cap colour contributes 1 quad):**

| Scope | Extra draw calls | Extra submitted triangles | Phone total (calls / tris) | Desktop total | Fits D-033? |
| --- | ---: | ---: | --- | --- | --- |
| Whole scene (35 + 1 + 23 = 59 meshes) | 2×59 + 1 = **119** | 2 × 308,260 = **616,520** | 177 / **924,396** | 215 / **1,196,004** | **No — both triangle budgets fail** |
| Exterior shell only (23 meshes) | 2×23 + 1 = **47** | 2 × 37,100 = **74,200** | **105 / 382,076** | 143 / 653,684 | **Yes** (phone tris 95.5 %, calls 87.5 %) |
| Exterior + cylinder heads (25 meshes) | 51 | 2 × 65,356 = **130,712** | 109 / **438,588** | 147 / 710,196 | **No — phone +38,588 over** |
| The three proof subjects (exterior + heads + pistons; 31 meshes) | 63 | 2 × 104,012 = **208,024** | 121 / **515,900** | 159 / 787,508 | **No — phone +115,900; desktop +87,508** |
| Pistons + heads only (8 meshes) | 17 | 2 × 66,912 = **133,824** | 75 / **441,700** | 113 / 713,308 | **No — phone +41,700; desktop +13,308** |

**Verdict: rejected as the milestone technique.** It is exact and well understood, but the submitted-triangle budget — not the draw-call budget — makes the milestone's required proof subjects impossible: the *smallest* set that covers a cut piston, a cut cylinder head **and** the sectioned exterior shell costs +208,024 submitted triangles, taking Phone to 515,900 against a 400,000 cap. Only a shell-only cap fits, and that leaves the piston and head hollow — the exact failure the milestone exists to remove. It would also add a stencil attachment, two per-frame passes and a shadow-map scheduling change to a renderer that today renders the section for free.

### B.2 Geometry / CSG approaches

| Variant | Why it fails here |
| --- | --- |
| **Pre-baked cap meshes at fixed positions** | The slider is continuous (0.5 mm step; 2,101 X positions + 2,321 Y positions) and moving parts change their intersection every frame. A cap mesh is valid for one plane position and one pose. Unbounded asset growth, and it changes part geometry — forbidden. |
| **Runtime CSG** (e.g. `three-bvh-csg`) | Boolean subtraction of the plane half-space from every clipped mesh, per frame, on ~270 k moving instanced triangles across 8 cylinders, plus triangulation of the result; new npm dependency and page weight; frame cost orders of magnitude above the budget; and the instanced batches would have to be de-instanced to cut them, changing the draw-call structure. Rejected before measurement. |
| **CPU contour extraction** (plane-triangle intersection per frame, loop assembly, triangulation, upload) | Geometrically exact in principle, but requires robust handling of open/non-manifold meshes (the assets are closed shells, but caps of hollow parts still need a policy), per-frame O(triangles) work (~270 k + 37 k triangle tests), allocation churn and GPU uploads; a 37 k-triangle exterior shell alone is ~37 k tests/frame on the JS main thread competing with the animation loop. High implementation risk for the frame budget; rejected as the milestone path and recorded as a deferred alternative. |
| **Analytic caps for revolved parts only** | Exact and cheap for pistons/valves/springs/crank (lathe profiles), but the head castings and the exterior shell are not revolved, so it cannot cover the proof subjects; a hybrid of analytic + shader has two code paths and two appearance models for one feature. Rejected. |

### B.3 Shader technique — back-face section fill with depth relocation

**How it works.** Every clippable material already renders its interior back faces (all assets are `doubleSided`). Inject a fragment-shader block into the *same* lit material, guarded by `#if NUM_CLIPPING_PLANES > 0` (three.js defines the macro when the material has clipping planes): when the surviving fragment is back-facing (`!gl_FrontFacing`), intersect the view ray with the section plane, write `gl_FragDepth` at the plane intersection, and output the section colour/hatch instead of the material colour. The visible back face is exactly the "inside" of the cut on a closed solid, so re-shading it at the plane produces the cut face. There is **no extra geometry, pass, draw call, triangle, texture or dependency**; the fragment is already being rasterised, so the D-033 draw-call and submitted-triangle metrics are unchanged by construction.

**What it needs.** Shader-chunk injection via `onBeforeCompile` + `customProgramCacheKey` on the already-registered clippable materials; a small shared uniform block (view-space plane normal/constant, section colour, hatch basis) updated per camera/section change; a **per-material on/off** for ghosted x-ray materials (a transparent shell must not paint an opaque cap); a **global gate** so the fill is inactive when the plane lies outside the assembled engine's bounds (the default section positions 900 mm / 580 mm cut nothing, and at those positions the fill must be off — otherwise visible back faces through the intake/exhaust openings would be painted). The shader variant exists only while the section is on, because the clipping-plane count already forces a program change at the same moment; section-off frames compile the block out and are byte-identical to today.

**Costs and risks (the honest list).**

- Writing `gl_FragDepth` disables early-Z for that material's fragments while the section is active, so the whole scene's overdraw is shaded instead of depth-rejected. This is the one real frame-time cost; it must be measured in the build and is measured in the planning prototype (spec §15). There are no extra submissions to hide it in the triangle metric.
- The fill is a **back-face inference, not a geometric cap**: it paints visible interior surfaces, so for non-convex/open parts (helical springs between coils, an open intake mouth or exhaust outlet) a fill can appear where the plane crosses air inside the part. The milestone's convention is "each part is solid at the plane", which makes most of these read as intended, but the artifact list must be recorded and the reference frames must show none in the named views.
- The visible back face is the far interior wall; on a closed convex solid viewed from the clipped side its screen region is the cut cross-section's projection, but on a thin-walled or non-convex part the fill follows the interior silhouette rather than a true section polygon. A **single section colour plus hatch** is what makes this read as one deliberate cut plane rather than as mis-shaded material.
- The cap must occlude geometry behind the plane; that is why the depth relocation is required, not optional. Without it, parts behind the plane show through the "solid" face and the hollow reading returns.

**Verdict: rejected on measured evidence.** A planning prototype implemented this rule in the shipped scene (scratch worktree, same GPU and assets) and confirmed the geometry metrics are free (+0 calls, +0 triangles, section-off shader compiles out and is pixel-identical). But the result is **not a cap**: the fill paints a flat hatched plate over intact geometry and hides the crank, pistons and springs rather than capping their cut faces. The viewport-change fraction is threshold-dependent: the prototype operator's threshold gave 14.4 % at RF-6 and 42.3 % with the exterior on; an independent capture diff at RF-6 with a >20/255 threshold gave 4.23 %; the qualitative result (a wall over intact geometry, no readable cut face) is the same at every threshold. The reason is structural: `gl_FrontFacing` does not identify "the interior surface seen through the cut". For closed shells cut *longitudinally* (the X plane is parallel to the piston axis) the visible interior wall is **front-facing**, so it is not filled at all; and every *back* face behind the plane is filled at the plane even when the plane does not pass through material there (a duct cross-section becomes a solid disc, a pan interior becomes a sheet). Removing the `gl_FragDepth` write confines the fill to genuinely hollow pixels but turns it into a back-face backdrop that still fills silhouettes, not material cross-sections (the orange firing-piston interior is painted; the duct remains a disc). The GPU-timer medians are section-off **2.97/3.04 ms**, open-shell sectioned **5.83/7.53 ms**, filled sectioned **9.00/10.19 ms** — i.e. the fill costs **≈2.7–3.2 ms/frame** over the open-shell section, and the sectioned frame itself is ≈3 ms slower than section-off. There was no measurable first-activation compile delta (median 273 ms vs 279 ms baseline). The prototype also showed an opaque slab through the ghosted X-Ray state; the real implementation would suppress the fill on ghosted materials (the spec requires it), so that particular interaction is fixable and is *not* the reason for rejection — the fill-not-a-cap result is. *The technique remains useful as prior art (xeokit ships the same fill), but it does not meet "read as solid material" for this asset set.*

### B.4 Other techniques considered

- **Convex-hull proxies with stencil or generated polygons** (cap each part's convex hull): cheap in triangles (hulls are ~50–200 tris/part) and exact for convex parts, but the hull of a concave casting bridges its concavities. Measured on the real shell at X = 402.5 mm: the true section area is **0.211 m²**, the hull section **0.310 m² — 46.9 % overfill** (the V-valley and the air around the banks become solid plates). Rejected on shape error.
- **Depth-peel / dual-depth capping** (render front-face and back-face depth, fill the plane where it lies between them, per-pixel colour from an ID buffer): needs one or two extra full-scene passes and offscreen depth targets, changing the render pipeline and tone-mapping path. Same submitted-triangle problem as stencil. Rejected.
- **MRT screen-space capping** (write `gl_FrontFacing` + plane depth to a second color attachment in the main pass, composite a fullscreen quad): no extra geometry passes, but requires rendering to an offscreen target with multiple attachments and rewriting the composite/transparent/x-ray path, which would perturb every existing frame. Higher risk than the adopted route for no visual gain. Rejected.
- **Interior-only material treatment** (darken/desaturate the double-sided interior walls, no depth change): zero cost and easy, but it leaves a cavity, not a face — it cannot satisfy "cut faces read as solid material". Rejected as a milestone path.

### B.5 Adopted: CPU cross-section extraction and triangulation

**How it works.** For each part that crosses the active plane, intersect its triangles with the plane in world space (instanced parts use their live instance matrices), project the crossing segments into the plane's 2-D coordinates, weld endpoints by a quantised key, trace closed loops, classify nested loops as holes, and triangulate with three's `ShapeUtils.triangulateShape`. The triangles are written into a pre-allocated cap mesh at the plane with a per-vertex section-UV for the hatch, and rendered by one unlit cap material with real depth.

**Measured planning-stage cost (reference laptop, Node 24, mm coordinates, typed arrays):**

```
sliced dynamic set (pistons, rods, throws, valves, bridges, rockers, pushrods, lifters): 123,584 tris
  tight slice only: 0.95–1.02 ms/frame for a 100,224-triangle mixed timing sample -> ~1.2 ms/frame
spring hull set: 32 hulls x 326 tris = 10,432 hull tris/frame (sliced per frame)
static set (shell, heads, injectors, main shaft): 73,828 tris
  tight slice only: 0.35–0.37 ms/change for the 37,100-triangle shell -> ~0.7 ms/change
full naive shell pipeline (slice + weld + Earcut + allocations): 10.15–10.22 ms/change
  1,300–1,356 segments (two probes, different epsilon), 62 closed loops, 0 open chains,
  100 ambiguous junctions, 609 cap triangles
partial optimised shell pipeline (typed arrays + numeric weld keys + Earcut):
  1.41–1.68 ms/change, 536 cap triangles, 31 filled loops + 5 open chains (no turn heuristic, no
  hole classification — a lower bound for a different, incomplete algorithm)
```

The partial optimised run is a **lower bound**, not the final algorithm: it omits the turn heuristic and hole classification, and it reports 5 open chains that the heuristic must eliminate (the naive run, which implements it, has 0). The full-pipeline rate (≈45 ns/tri) projects ≈5.6 ms/frame for the 123,584-triangle sliced set, which is why the dynamic budget is **≤ 6.5 ms desktop / ≤ 13.0 ms phone**, not 3/6 (the 10,432 spring-hull triangles add ≈0.47 ms to the 5.6 ms projection, giving ≈6.1 ms). The 100,224-triangle sample is a mixed timing set (it double-counts both rocker primitives and omits valves); the 123,584 projection uses the correct count. `ShapeUtils.triangulateShape` requires `THREE.Vector2` arrays (it calls `Vector2.equals`), which the implementation must respect.

**Budget shape:** +2 draw calls (static + dynamic cap meshes), cap triangles a few thousand (hard ceiling 16,000), no textures, no extra passes, no stencil buffer, no new dependency. The cost that moves is CPU, and it is measured.

**Correctness limits, stated:** the cap is the exact cross-section of the **modelled closed shell**, so enclosed cavities are filled solid — the milestone's "solid material" convention — and a shell-crossing plane legitimately hides internals behind the solid section (X-Ray or Exterior-off reveals them). A position-welded boundary-edge audit of the shipped shell (weld quantum 1e-5 m) finds **5 non-watertight partIds** — `ext_vc_fasteners_1` (336 boundary edges), `ext_vc_fasteners_2` (168), `ext_inj_return_line_2` (32), `ext_exh_manifold_lh_2` (32), `ext_exh_manifold_rh_2` (32); `ext_front_cover_1` is watertight, and all ten internal GLBs are watertight. A plane through one of the five produces an open chain, so the implementation **closes the chain with one chord in the plane** (local to the open part's boundary) and records `closedChains`; a non-simple closure is dropped and counted. **No hull fallback**: the shell's cap sources are material-merged buckets (e.g. the steel bucket is 10,048 tris / 53 parts), so hulling a source would reintroduce the 46.9 % overfill. The 32 helical valve springs are **hull-capped, not sliced** (41 % of internal triangles; thin wire sections): their 326-triangle cached hulls give a solid elliptical section, local to the spring envelope, at the cost of ~10,432 hull triangles/frame.

### B.6 Decision matrix

| Criterion | Stencil (full) | Stencil (exterior only) | Convex-hull proxies | Shader back-face fill | **CPU cross-section caps (adopted)** |
| --- | --- | --- | --- | --- | --- |
| Covers a cut piston + cut head + sectioned shell exactly | yes | **no** | no (46.9 % overfill) | **no** (not a cap) | **yes** |
| Extra draw calls (baseline 96 / 58) | +119 | +47 | ~+3 | 0 | **+2** |
| Extra submitted triangles (headroom 120,516 / 92,124) | +616,520 | +74,200 | ~+10,000 | 0 | **cap tris ≤ 16,000** |
| Extra render passes | 3 | 3 | 3 or 0 | 0 | **0** |
| Renderer/context change | `stencil: true` (currently 0 bits) | same | `stencil: true` | none | **none** |
| New dependency / asset change | none / none | none / none | none / none | none / none | **none / none** |
| Robustness / correctness | exact, proven | exact, partial scope | exact for convex, overfills concavities | approximate; measured walls over intact geometry | **exact for sliced sources; open chains chord-closed** |
| Main risk | budget (hard fail) | budget OK, scope fails | shape error (measured 46.9 %) | visual failure (measured) + +2.7–3.2 ms GPU | **CPU rebuild time (measured, budgeted)** |
| Frozen-interface impact | none | none | none | none | **none** |

**Decision carried into the spec:** stencil, hull and shader routes are rejected on measured/computed evidence; **CPU cross-section caps are adopted** because they are the only technique that produces a true, depth-correct cut face within both D-033 geometry metrics, with a CPU cost that is measured and budgeted rather than assumed. The spec still must take positions on appearance, scope (all parts capped; springs via hull proxies; the solid-section convention), the static/dynamic rebuild cadence, the interactions, and the reference frames.

---

## Part C — Sources and evidence trail

- **External technique facts and grades** (three.js stencil example and docs, `gl_FragDepth`/early-Z, `EXT_conservative_depth`, stencil/MSAA, CSG libraries, section-drawing conventions): [`M11-capping-techniques.md`](./M11-capping-techniques.md), researched 2026-11-14.
- **Repo facts:** every file:line above was read on branch `plan/m11-capped-cutaways` at `main` @ `6dc2396`; GLB material/topology facts come from parsing the binary GLB JSON chunks with a Node script (12/12 exterior materials `doubleSided: true`; 92 meshes / 180 primitives / 37,100 triangles / 36,233 vertices).
- **Measured rendering numbers:** production bundle (`npm run build`), `npx vite preview`, headless Chrome `--headless=new --enable-gpu --use-angle=d3d11`, real GPU as reported by `WEBGL_debug_renderer_info`; `renderer.info` read from `window.__engineScene.getRenderStats()`; captures 1440×900 via CDP `Page.captureScreenshot`.
- **Shader-fill prototype:** scratch worktree from the same commit, the exact shader injection recorded in the QA evidence; before/after render stats (96/579,484 exterior-on; 73/542,384 exterior-off; 119/616,584 x-ray + section), GPU timer medians, five state captures and the no-depth variant. The prototype is not committed; its numbers are quoted in the spec §14.2 and §14.6, and the viewport-change fractions are threshold-dependent (the prototype operator's threshold gave 14.4 % at RF-6; an independent capture diff with a >20/255 threshold gave 4.23 %).
- **Section-map measurements:** CPU triangle-plane slicing of the real shell at X = 402.5 mm (≈1,300–1,356 crossing triangles depending on epsilon, 62 loops, true area 0.211 m²), convex-hull comparison (0.310 m², +46.9 %), and the tight typed-array slice benchmarks (0.95–1.02 ms/100k mixed dynamic tris; 0.35–0.37 ms/shell change; 10.15–10.22 ms naive full shell pipeline; 1.41–1.68 ms partial optimised pipeline) — scripts in the planning scratch area, not committed.
- **Baseline reference frame:** `docs/reference-frames/RF-6.png` and its definition/checklist (`docs/REFERENCE_FRAMES.md:131-145`).





