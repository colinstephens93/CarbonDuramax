# M11 Capping Techniques — Sourced Survey of Solid Cut Faces in Three.js

Purpose: establish what is **published, specified, or honestly unavailable** about rendering capped (solid)
cut faces when clipping a mesh with a plane, so the Milestone 11 spec can choose a technique against the
D-033 budgets instead of guessing. Nothing here is a measurement made for this survey; every number is
either quoted from a source or labelled DERIVED from a cited input.

Researched 2026-11-14 from public sources (all URLs accessed **2026-11-14**). Pinned library:
`three@0.187.0`, WebGL2-only, verified in `node_modules/three/package.json`.

**Scope.** WebGL2 / Three.js r187 only. Excluded: WebGPU examples (`webgpu_clipping_stencil` exists but is
out of scope), post-processing DOF/stencil tricks, and any technique needing a native engine.

**Reliability grades.** A = primary/official spec, registry, or source code. B = official docs/tutorial by
the maintainers of the thing described. C = reputable third-party technical writing or tooling measurement.
D = forum/issue/opinion. **Code facts in this repo are cited `file:line`, verified by `grep`/`read` at this
checkout, and are not graded** (they are the ground truth the external grades are checked against).

## 0. Local code facts (verified, not graded)

| # | Fact | Citation |
|---|---|---|
| L1 | Renderer is built with `antialias: true` only — **no `stencil`**, so `stencil` stays `false` | `src/renderer/engineScene.ts:377` |
| L2 | `localClippingEnabled = true`; one world-space `sectionPlane`, one active plane | `src/renderer/engineScene.ts:381`, `:420`, `:1519` |
| L3 | Per-material clipping: `mat.clippingPlanes = activeClippingPlanes`, `mat.clipShadows = true` | `src/renderer/engineScene.ts:426-427`, `:1521-1523` |
| L4 | Clipped set = instanced internal batches + `mainShaft` + exterior shell + variants (6 registration sites; instanced batches built at `:247`) | `src/renderer/engineScene.ts:471`, `:960`, `:1147`, `:1316`, `:1356`, `:1369` |
| L4b | Asset materials declare glTF `doubleSided: true` (**12/12** shell, 2/2 injector, 3/3 conrod, 2/2 crank throw) ⇒ `THREE.DoubleSide` | GLB JSON scan, 2026-11-14; mapping at `node_modules/three/examples/jsm/loaders/GLTFLoader.js:3745`; asserted at `src/renderer/shellAssets.test.ts:301` |
| L5 | Only `src/renderer/**` imports `three` (no matches outside it) | grep, 2026-11-14 |
| L6 | Internal instanced geometry **270,080** tris; main crankshaft **1,080**; exterior shell **37,100** | `docs/M3-MEASUREMENTS.md:31`, `docs/M4-MEASUREMENTS.md:10`, `docs/M10-EXTERIOR.md:5` |
| L7 | Baseline: desktop **96 calls / 579,484** submitted tris; phone **58 / 307,876** | `docs/M10-MEASUREMENTS.md:192-193` |
| L8 | D-033 budgets: desktop **250 calls / 700,000** tris; phone **120 / 400,000** | `docs/M10-MEASUREMENTS.md:205-213` |
| L9 | Clipping is a **fragment discard**, so no cap can be produced by it | `node_modules/three/src/renderers/shaders/ShaderChunk/clipping_planes_fragment.glsl.js` — `if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;` |
| L10 | `stencil` never reaches anything but context creation / render-target allocation — three.js does **not** auto-enable a stencil buffer because a material sets `stencilWrite` | `node_modules/three/src/renderers/WebGLRenderer.js:390-399`, `:2034` |

# Part A — Technique catalogue

## A1. Stencil-buffer capping (the three.js `webgl_clipping_stencil` approach)

**How it works.** For each capped object and each plane, a helper group of **two** invisible meshes is
rendered: back faces `IncrementWrap` the stencil, front faces `DecrementWrap` it, with
`depthTest = false`, `depthWrite = false`, `colorWrite = false`, `stencilFunc = AlwaysStencilFunc`, and
**the same clipping plane applied**. The net count at a pixel is nonzero exactly where the cut plane lies
inside the solid. A full-size quad lying on the plane then draws with `stencilFunc = NotEqualStencilFunc,
stencilRef = 0` and `ReplaceStencilOp` on all three outcomes, and `onAfterRender` calls
`renderer.clearStencil()`. The stencil group renders at `renderOrder = i + 1`, the cap quad at `i + 1.1`,
the shaded object at `6`, so the cap fills first and the object's nearer front faces draw over it.

Key lines (r187 `examples/webgl_clipping_stencil.html`, [raw](https://raw.githubusercontent.com/mrdoob/three.js/r187/examples/webgl_clipping_stencil.html)):
`baseMat.depthTest = false; baseMat.colorWrite = false; baseMat.stencilWrite = true;`
`mat0.side = THREE.BackSide; … stencilZPass = THREE.IncrementWrapStencilOp;`
`mat1.side = THREE.FrontSide; … stencilZPass = THREE.DecrementWrapStencilOp;`
`stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.ReplaceStencilOp,` …
`po.onAfterRender = function ( renderer ) { renderer.clearStencil(); };`
`renderer = new THREE.WebGLRenderer( { antialias: true, stencil: true } );`

**Cost per frame.** Passes: **+2 geometry passes per capped mesh per plane, +1 cap quad per plane** (not per
object). Draw calls: `2N + P`. Triangles submitted: `2 ×` the triangle count of every capped mesh.
Both stencil passes run with **`depthTest = false`, so all of that geometry is fully rasterised with no
occlusion culling** — the submitted-triangle number understates the GPU cost.
DERIVED at CarbonDuramax scale (all clipped meshes capped, one plane):
`2 × (270,080 + 37,100 + 1,080) = 616,520` extra triangles (`614,360` excluding the crank);
with `N ≈ 57–59` clippable main-pass meshes (`96 − 36` shadow `−` ground), `+2N + 1 ≈ +115 … +119` draw calls.
Desktop: 96 → **≈211–215 calls** (≤250, passes with 35–39 to spare), 579,484 → **1,196,004 tris** (171 % of
700,000). Phone: 58 → **≈173–177 calls** (>120, fails), 307,876 → **924,396 tris** (231 % of 400,000).
Arithmetic agrees with the companion survey (`docs/research/M11-capped-cutaways-survey.md`), which uses
`N = 59` and the crank-inclusive triangle total.

**Needs.** `stencil: true` at context creation — a **constructor change at `engineScene.ts:377`**, which
re-creates the GL context (the attribute cannot be added later); the target machine currently reports
`STENCIL_BITS = 0`. One extra quad + two helper meshes per capped object; `clearStencil()` after each cap.
Helper meshes must be `castShadow = false` or they join the shadow pass.

**Robustness/quality.** Exact, per-pixel correct caps for **closed manifold** geometry, and unlike the shader
trick it produces real depth so intersections with other geometry are correct. Weak on open/non-manifold
shells (counting is meaningless) — every shipped GLB material declares `doubleSided: true` (L4b), which makes
the front/back classification of a single-sided shell ambiguous. `renderOrder` juggling is the documented fragility
([three.js forum](https://discourse.threejs.org/t/capping-clipped-planes-using-stencil-on-a-buffergeometry/18407/34), grade D).

**Verdict vs D-033.** **Incompatible on triangles on both tiers** (desktop 170 %, phone 231 % of budget) and
on phone draw calls (≈145 %); desktop draw calls pass narrowly.

## A2. Pre-baked cap meshes (geometry authored offline)

**How it works.** Author, per part, a cap surface that exactly matches the plane/part intersection, kept in
the part's local frame, hidden until the section is active. Cost is one extra draw per capped batch and only
the cap's own triangles.

**Cost.** Cheapest of the geometry family: `+1` draw call and `+capTris` per batch (instancing makes it
`+1` per batch, not per instance).

**Why it does not apply here.** The cut is fixed in world space; the internals **rotate and reciprocate every
frame**, so for 270,080 of the 307,876 phone triangles the intersection contour changes continuously and no
pre-baked cap can be correct. It is only valid for parts static in the plane's frame — the 37,100-tri exterior
shell and non-moving castings. (DERIVED from the animation model; no external source needed.)

**Verdict.** Compatible with D-033 **only** for the static exterior, i.e. it does not solve the stated problem.

## A3. Runtime CSG

**How it works.** Evaluate `mesh ∩ halfSpace` (or `mesh − box`) per frame with a CSG library.
`three-bvh-csg@0.0.18` (MIT, published 2026-02-17, min **66,739 B / 19,342 B gzip** + peer
`three-mesh-bvh@0.9.7` at **25,980 B gzip** ⇒ ≈45 kB gzip added) is what the **official three.js example uses**
(`examples/webgl_geometry_csg.html`, pinned to `three-bvh-csg@0.0.18` on jsDelivr); `three-csg-ts@3.2.0`
(MIT, 2024-05-28, **2,604 B gzip**) is the much smaller, much less maintained option.

**Cost per frame.** Rebuilding a BVH and re-triangulating the cut for 270k+ animated triangles every frame,
then re-uploading geometry. **No published benchmark exists for this scale**; the official example only
CSGs two small primitives and its per-frame `evaluator.evaluate()` is a demo of interactivity, not of a
270k-triangle budget. Against a 16.7 ms desktop / 33.3 ms phone frame this is not credible.

**Verdict.** **No evidence it can meet D-033**, and the frame-time budget is the binding constraint, not
calls/triangles (the *output* geometry would be cheaper than 2× input).

## A4. CPU contour extraction (+ cap triangulation)

**How it works.** Walk triangles, collect plane crossings into polylines, triangulate the loops, upload the
cap VBO each frame.

**Cost.** `O(n)` JS work over 270k triangles per frame plus a per-frame buffer upload; draw calls +1 per cap.
**No published implementation or benchmark for a scene of this size was found** — this is an engineering
estimate, not a sourced fact, and must be prototyped before it is claimed.

**Verdict.** Unproven against D-033; the per-frame CPU and upload cost is the risk, and it is the only
technique here that adds main-thread work to a frame that is vsync-locked.

## A5. Shader back-face section fill (`gl_FragDepth`) — the "pseudo-cap"

**How it works.** In the clipped material, `!gl_FrontFacing` fragments that survived clipping are interior
back faces seen through the cut. Re-project them onto the section plane: intersect the camera ray through the
fragment with the plane, convert that point to NDC depth, write it to `gl_FragDepth`, and output the flat
section colour (or a hatch derived from the plane-space XY). The interior wall is thereby re-shaded as if it
were a solid face at the plane. This is not a novel invention: **xeokit ships exactly this** as
`SectionPlane.capColor` — "the shader keeps back-facing fragments in the clipped region and colours them with
this value — producing a flat 'fill' on the cut surface that reads as a cross-section cap", and "the
material's hatch pattern (if any) still applies on top of the cap colour"
([xeokit SDK docs](https://xeokit.github.io/sdk/docs/api/classes/viewing.viewer.SectionPlane.html), grade B).

**Cost per frame.** **+0 draw calls, +0 submitted triangles** — the only family that adds nothing to either
D-033 geometry axis. Cost is fragment-side: a few ALU ops, one uniform, an extra world-position varying, and —
the real price — **loss of early-Z for every fragment of the patched material**, including front faces,
because *any* assignment to `gl_FragDepth` makes depth testing happen after the shader (see Part B F15–F18).

**Needs.** No stencil buffer, no new dependency, no asset change. `onBeforeCompile` (or a `ShaderMaterial`)
plus a `worldPosition` varying; `logarithmicDepthBuffer` must stay off (it also writes `gl_FragDepth` —
`ShaderChunk/logdepthbuf_fragment.glsl.js:6` — and the repo does not enable it).

**Robustness/quality.** Correct-looking solid cuts on closed *and* open meshes, and it degrades gracefully
where stencil counting fails. Known failure modes: (a) **overfill** — a back face visible through a genuine
opening (not the cut) is also painted as a cap, at a plane depth that may not exist along that ray; (b) it
produces **no geometry**, so it cannot cast shadows, receive correct specular from the cut normal, or be
picked; (c) per-part fills do not merge, so interpenetrating parts show independent caps; (d) if the written
depth is greater than the interpolated depth the result is *undefined* unless clamped (F18).

**Verdict.** **The only family that is trivially inside both D-033 geometry budgets** (+0/+0); its cost is
frame-time (early-Z) and visual fidelity, neither of which D-033 measures directly.

## A6. Depth-peeling / dual-depth capping

**As published.** Depth peeling renders the scene repeatedly, one depth layer per pass, for order-independent
transparency and for seeing through occluding volumes.
**As a capping technique: not found.** No spec, vendor doc, or credible technical write-up describing
depth-peeling or dual-depth as a *cap-generation* method was located on 2026-11-14; everything retrieved while
searching concerned transparency and volume rendering, not section caps.
**Verdict.** Not a candidate. Cost would be ≥2 full-scene passes, which alone exceeds the stencil family.

## A7. Screen-space capping

**What exists.** A section-cap UI with "screen-space hatches" is implemented in an open-source IFC viewer
([ifc-lite commit](https://github.com/LTplus-AG/ifc-lite/commit/57e0ca6aaaa1219b3b7cd67d7c982c31a75088c4), grade D),
and xeokit applies material hatch patterns on the cap colour (grade B, above). **No published performance
figures** for either. **Cost.** +1 full-screen pass and a depth/normal source (a prepass, or the depth buffer,
which WebGL2 cannot sample while it is attached). **No authoritative cost model found.**
**Verdict.** Unquantified against D-033; it does not remove the need for a stencil/depth mask, so it composes
with A1 or A5 rather than replacing them.

# Part B — Fact table

Rows citing `node_modules/three/…` are the pinned r187 sources (`https://github.com/mrdoob/three.js/blob/r187/<same path>`
resolves each one); rows citing `docs/…` are this repo.

| # | Fact | Value | Source (accessed 2026-11-14) | Kind | Grade | Verdict / notes |
|---|---|---|---|---|---|---|
| F1 | `WebGLRenderer` `stencil` default | `stencil = false` | `node_modules/three/src/renderers/WebGLRenderer.js:77` | source code | A | Repo never overrides it (L1) |
| F2 | What `stencil` means | "Whether the drawing buffer has a stencil buffer of at least 8 bits or not." | `WebGLRenderer.js:3726` (JSDoc; the r187 tag's `docs/` is the generated docs site — `pages/`, `search.json`, `scripts/`, not per-class HTML) | source code | A | ≥8 bits, not "maybe" |
| F3 | Example renderer setup | `new THREE.WebGLRenderer( { antialias: true, stencil: true } )` | [r187 example](https://raw.githubusercontent.com/mrdoob/three.js/r187/examples/webgl_clipping_stencil.html) | official example | A | Stencil + MSAA together, shipped by three.js |
| F4 | Stencil write ops | back `IncrementWrapStencilOp`, front `DecrementWrapStencilOp`, on fail/zfail/zpass; `stencilFunc = AlwaysStencilFunc` | same | official example | A | Classic front/back counting |
| F5 | Stencil pass raster state | `depthWrite = false; depthTest = false; colorWrite = false` | same | official example | A | ⇒ no occlusion culling; full rasterisation |
| F6 | Stencil passes apply the clip plane? | **Yes** — `mat0.clippingPlanes = [ plane ]; mat1.clippingPlanes = [ plane ];` | same | official example | A | The counted surface is the clipped surface |
| F7 | Cap plane material | `MeshStandardMaterial` + `stencilWrite: true, stencilRef: 0, stencilFunc: NotEqualStencilFunc`, all three ops `ReplaceStencilOp`, `clippingPlanes` = *other* planes, `renderOrder = i + 1.1` | same | official example | A | Cap is a plain quad, lit normally |
| F8 | Stencil reset | `po.onAfterRender = function ( renderer ) { renderer.clearStencil(); };` | same | official example | A | One clear per cap per frame |
| F9 | Passes/draws per capped object | 2 mesh draws per object per plane + 1 quad per plane; +3 draws for 1 object/1 plane vs 1 today | same (DERIVED) | official example | A | `2N + P` |
| F10 | Is the example instanced/batched? | **No** — a single `THREE.Mesh( geometry, material )` on `TorusKnotGeometry( 0.4, 0.15, 220, 60 )` | same | official example | A | No instancing guidance anywhere in it (see F31) |
| F11 | `Material` stencil API defaults | `stencilWrite=false`, `stencilFunc=AlwaysStencilFunc`, `stencilRef=0`, `stencilFuncMask=0xff`, `stencilWriteMask=0xff`, `stencilFail/ZFail/ZPass=KeepStencilOp` | `Material.js:239-299` | source code | A | All seven exist and are per-material |
| F12 | `clippingPlanes` / `clipShadows` semantics | "Points in space whose signed distance to the plane is negative are clipped (not rendered). This requires `localClippingEnabled` to be `true`." / `clipShadows=false` default | `Material.js:301-329` | source code | A | Doc never mentions a cap ⇒ no cap is promised |
| F13 | Local clipping generates no cap geometry | clipping compiles to `if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;` | `ShaderChunk/clipping_planes_fragment.glsl.js` (L9) | source code | A | Discard only; nothing is generated |
| F14 | Cross-library confirmation | "clipping planes clip rendered geometry but don't generate any cap" | [Cesium forum](https://community.cesium.com/t/how-to-create-a-solid-cap-hatch-pattern-or-extract-intersection-points-for-cesium-clipping-planes/46393) | forum | D | Same behaviour in a sibling engine |
| F15 | Writing `gl_FragDepth` kills early-Z | "this setting uses `gl_FragDepth` if available which **disables the Early Fragment Test optimization** and can cause a decrease in performance" | `WebGLRenderer.js:3732` (`logarithmicDepthBuffer` JSDoc) | official docs | A | three.js's own words, in the pinned version |
| F16 | `depth_any` is the default and forces late depth test | "When the layout qualifier for gl_FragDepth is <depth_any>, the shader compiler will note any assignment to gl_FragDepth modifying it in an unknown way, and **depth testing will always be performed after the shader has executed**." | [EXT_conservative_depth (GLES)](https://registry.khronos.org/OpenGL/extensions/EXT/EXT_conservative_depth.txt) | extension spec | A | A *conditional* write still counts as an assignment |
| F17 | `depth_less` / `depth_greater` promise | "depth_greater … final value of gl_FragDepth is greater than or equal to the fragment's interpolated depth"; "depth_less … any modification of gl_FragDepth will only decrease its value"; implementations "may perform optimizations assuming that the depth test fails (or passes) … if **all** values … consistent with the layout qualifier would fail (or pass)" | same | extension spec | A | This is the early-Z-preserving caveat |
| F18 | Cost of lying to the qualifier | "If the final value of gl_FragDepth is inconsistent with its layout qualifier, the result of the depth test … is **undefined**." | same | extension spec | A | Our fill is `depth_less`; must clamp |
| F19 | WebGL flavour of the extension | `EXT_conservative_depth`, WebGL extension **#54**, rev 2, Community Approved 2024-01-11; **`depth_unchanged` is not supported**; implementations may clamp inconsistent values to `gl_FragCoord.z` | [WebGL registry](https://registry.khronos.org/webgl/extensions/EXT_conservative_depth/) | registry spec | A | `depth_less`/`depth_greater` only |
| F20 | Extension support in the wild | 81.17 % overall; **Android 10.29 %**, Linux 52.04 %, Windows 92.05 %, iOS 98.57 %; **Firefox 1.42 %**, Chrome 85.16 %, Safari 98.18 % | [Web3D Survey](https://web3dsurvey.com/webgl2/extensions/EXT_conservative_depth) | third-party telemetry | C | Present on the target GPU, **not portable** |
| F21 | WebGL2 accepts GLSL ES 3.00 | "In addition to supporting The OpenGL ES Shading Language, Version 1.00, the WebGL 2.0 API also accepts shaders written in The OpenGL ES Shading Language [3.00]" | [WebGL 2.0 spec](https://registry.khronos.org/webgl/specs/latest/2.0/) | spec | A | — |
| F22 | How three.js built-ins reach GLSL ES 3.00 | `versionString = '#version 300 es\n';` then `layout(location = 0) out highp vec4 pc_fragColor;` / `#define gl_FragColor pc_fragColor` | `node_modules/three/src/renderers/webgl/WebGLProgram.js:763-790` | source code | A | Any built-in material is already GLSL3 ⇒ `gl_FragDepth` is in scope; no `#extension` needed for the core built-in |
| F23 | Is a stencil attachment guaranteed with `antialias: true`? | "Different from WebGL 1.0, the **depth, stencil, and antialias attributes in WebGL 2.0 must be obeyed** by the WebGL implementation." | [WebGL 2.0 spec](https://registry.khronos.org/webgl/specs/latest/2.0/) | spec | A | By spec, `stencil: true` ⇒ a stencil buffer, MSAA or not |
| F24 | Stencil memory cost / format coupling | "adding a stencil buffer may increase memory usage on some platforms, such as Apple GPUs … Only request a stencil buffer … if you use it." | [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) | official docs (Mozilla) | B | D-033 has no VRAM metric for this; ask before spending it |
| F25 | ANGLE/D3D11 stencil+MSAA caveat | **Not found** | — | — | — | No authoritative ANGLE/D3D11-specific caveat located; F23 is the only guarantee available |
| F26 | three-bvh-csg identity | `0.0.18`, **MIT**, published **2026-02-17**; peers `three>=0.179.0`, `three-mesh-bvh>=0.9.7` | [npm registry](https://registry.npmjs.org/three-bvh-csg/latest) | registry | A | Actively maintained |
| F27 | three-bvh-csg size | **19,342 B gzip** (66,739 B min) **+** `three-mesh-bvh@0.9.7` **25,980 B gzip** ⇒ ≈45 kB gzip | [bundlephobia](https://bundlephobia.com/package/three-bvh-csg@0.0.18) | tooling measurement | C | Two new runtime deps |
| F28 | Is CSG "three.js-blessed"? | Yes, one official example: `examples/webgl_geometry_csg.html`, importing `three-bvh-csg@0.0.18` from jsDelivr; it is the **only** CSG entry in the r187 example manifest | [example](https://raw.githubusercontent.com/mrdoob/three.js/r187/examples/webgl_geometry_csg.html), [files.json](https://raw.githubusercontent.com/mrdoob/three.js/r187/examples/files.json) | official example | A | No CSG in three.js core |
| F29 | three-csg-ts | `3.2.0`, MIT, published 2024-05-28, **2,604 B gzip** | [npm registry](https://registry.npmjs.org/three-csg-ts/latest) | registry / tooling | A/C | Small, ~2.5 yrs stale |
| F30 | Published CSG cost at 270k animated triangles | **Not published** | — | — | — | The official example CSGs two small brushes per frame; no budget-scale number exists |
| F31 | InstancedMesh + stencil capping | The example has **no** instancing path; three.js docs/source add no `InstancedMesh`-specific stencil support (`stencilWrite` is per-material only) | F10, F11 | official example / source | A | Each extra pass is a whole-batch draw, not per instance — but `2 × instanceCount × tris` |
| F32 | Back-face fill in a shipping viewer | xeokit `SectionPlane.capColor`: keeps back-facing fragments, flat cap colour, material hatch applies on top | [xeokit docs](https://xeokit.github.io/sdk/docs/api/classes/viewing.viewer.SectionPlane.html) | official docs | B | Prior art for A5, including hatching |
| F33 | Back-face fill failure modes in the literature | **Not found** as a named, analysed failure mode | — | — | — | No paper/blog enumerates overfill; the overfill/non-convex argument is analytic, not sourced |
| F34 | Screen-space capping prior art | "3D section cap with stencil + screen-space hatches" (IFC viewer) | [ifc-lite commit](https://github.com/LTplus-AG/ifc-lite/commit/57e0ca6aaaa1219b3b7cd67d7c982c31a75088c4) | repo commit | D | Existence proof only; no numbers |
| F35 | Depth-peeling as capping | **Not found** | — | — | — | Published depth peeling is OIT/volume work, not capping |
| F36 | Section hatching convention | Metal cross-sections hatch at **45° to the principal axis** (`ANSI31`/`ISO02W100`); adjacent mating parts alternate **45°/135°/30°/60°**; hatch lines are thin (0.30 mm) vs 0.60 mm outlines | [GstarCAD Academy, ISO 128 / ASME Y14.2](https://gstarcademy.com/kb/guides/iso-128-and-asme-y14-2-lineweights-linetypes-and-hatch-standards) | third-party technical | C | ISO 128-50 and ASME Y14.3 themselves are paywalled and were **not** read |
| F37 | "Cap portions of a clipped model" community answer | Recommends generating geometry/surface over the cut; "It won't be as fast as using gpu clipping planes but it will give you back actual geometry" | [Stack Overflow](https://stackoverflow.com/questions/55513916/is-there-a-way-to-cap-portions-of-a-model-clipped-using-three-js) | forum | D | No numbers |

# Part C — Decision-relevant conclusions

## C1. Stencil capping (A1) — blocked by the triangle budget, not by correctness

- Triangles: `2 × (270,080 + 37,100 + 1,080) = 616,520` extra ⇒ desktop **1,196,004** vs 700,000 (fails by
  496,004, 171 %); phone **924,396** vs 400,000 (fails by 524,396, 231 %).
- Draw calls: `2N + 1` with `N ≈ 57–59` ⇒ desktop **≈211–215** vs 250 (passes, 14–16 % headroom); phone
  **≈173–177** vs 120 (fails by ≈45 %).
- The triangle number is optimistic: `depthTest = false` (F5) means every one of those 616,520 triangles is
  fully rasterised, so frame time will degrade more than the metric implies.
- Any variant that caps **only visible/cut parts** scales the same 2× multiplier; there is no version of this
  technique that is not ≈2× the clipped geometry. **The spec must cite F3–F9, F23, L6–L8.**

## C2. Geometry/CSG (A2–A4) — right cost shape, wrong frame

- Pre-baked caps (A2) are *cheap enough* (`+1` draw, `+capTris`) but **only valid for geometry static in the
  plane's frame**: that is the 37,100-tri shell, not the 270,080 tri of animated internals. It cannot be the
  whole answer.
- Runtime CSG (A3) and CPU contours (A4) pay **per frame** for a contour that changes every frame; CSG adds
  ≈45 kB gzip and two deps (F26–F29) and has **no published budget-scale benchmark** (F30). Against a
  vsync-locked 16.7 / 33.3 ms frame, unproven is the fair verdict.
- **The spec must cite F26–F30 and L6–L8**, and must not claim a CSG cost figure that no source supports.

## C3. Shader back-face fill (A5) — the only family that is free on both D-033 axes

- `+0` draw calls, `+0` triangles (Part A5): it cannot breach L8. The cost moves to fragments and to
  **early-Z** (F15/F16), which D-033 does not measure — so D-033 compliance is necessary but **not
  sufficient** evidence for this option; a frame-time probe is required.
- Portability: `EXT_conservative_depth` is on the target GPU but only **10.29 % on Android / 1.42 % on
  Firefox** (F20); the fallback (plain `gl_FragDepth`, late depth test) must be the *default*, with the
  extension as an optimisation.
- Correctness: must clamp the written depth to `gl_FragCoord.z` under `depth_less` (F17–F19) and must accept
  overfill where a back face is visible through a non-cut opening (F33 — analytic, **unsourced**).
- Precedent exists in a shipping viewer, including hatched caps (F32), so this is not an invention.
- **The spec must cite F15–F20, F32, F33 and F36.**

## C4. What is honestly unresolved

1. No source gives a **measured** frame-time cost for any of these techniques at 270k+ triangles (F30, F35).
2. No source enumerates the back-face-fill overfill failure modes (F33); that argument is analytic.
3. No ANGLE/D3D11-specific stencil+MSAA caveat was found (F25); F23 is the only guarantee.
4. `EXT_conservative_depth` on the *target* GPU is a local observation, not a publishable fact; the only
   published support data is F20.
