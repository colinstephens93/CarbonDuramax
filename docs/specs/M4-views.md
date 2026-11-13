# Milestone 4 Spec — Views: Explode While Running, Clipping Cutaway, X-Ray, Labels

Repo: `colinstephens93/CarbonDuramax` · Branch: `m4-views` (create from `main`, which includes Milestones 0–3 merged) · Plan reference: PLAN.md product scope ("Exploded view while running, clipping-plane cutaway, x-ray, part labels"), exit criterion: "explode, cutaway, and labels work at any crank angle and throttle." Budgets remain the normative tables in `docs/M2-MEASUREMENTS.md` §5 (D-033); M3 verified the full engine complies with wide margins, and this milestone adds no geometry.

**Coding is done by the user in Antigravity on branch `m4-views`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

Milestone 4 is **pure renderer/UI work**: no new or modified models, no config changes, no core changes. Everything below is view state layered on top of the M3 scene.

## 1. What Milestone 4 is

Four view features, all operating on the running engine at any crank angle and throttle:

1. **Explode while running** (§3): an Explode slider (0–100%) that spreads the four crank stations apart along the crank axis and lifts each cylinder's head assembly and lifter/pushrod group along its bore axis — while the engine keeps running, with every connection that was exact at M3 kept exact (the single, bounded exception: pushrods elongate ≤ ~22%, §3).
2. **Clipping cutaway** (§4): a section plane (front-to-back along X, or side along Y) with a position slider, implemented with three.js clipping planes on the engine materials. Capped solids remain deferred per the plan — cut faces show the open-shell look, which is expected and documented in the UI caption area (§7).
3. **X-ray** (§5): the registered exterior shell rendered as a translucent ghost so the internals show through it.
4. **Labels** (§6): HTML overlay labels that track major parts in 3D as the engine runs and explodes, plus cylinder numbers 1–8.

Plus: reference frames RF-5…RF-7 (§9), a short measurements addendum (§8), and tests (§10). The page subtitle updates to "Milestone 4 — Views: Explode, Cutaway, X-Ray, Labels" following the M2/M3 pattern.

**Non-goals for M4:** no capped cutaway solids (deferred by the plan); no new parts or variants (M6); no performance model (M5); no sound; no camera-animation/preset-view system beyond the §9 reference-frame poses the app already supports; no persistence of view state across page loads.

## 2. Frozen files

**Frozen — no changes:** everything in `src/core/`; all of `src/config/` (including `detailConfig.ts` — M4 needs no part dimensions); `assets-src/**` (including `dimensions.json` and the Blender script — no GLB is regenerated); every file in `public/` (all part GLBs, the exterior GLB, the HDRI, the legacy viewer); `docs/M2-MEASUREMENTS.md` and `docs/M3-MEASUREMENTS.md`. View parameters live in the renderer (§3), never in the part config — that separation is deliberate and is what lets the M6 catalog later carry per-variant explode vectors against this mechanism (PLAN.md product table: each catalog entry carries its own explode vector).

**Changed (expected):** `src/renderer/engineScene.ts` (explode application, clipping material set, x-ray state, label anchor projection, §9 state surface), a new pure module `src/renderer/viewLayout.ts` (+ tests), `src/renderer/index.ts`, `src/ui/engineControls.ts`, `src/main.ts`, `index.html` (subtitle/labels layer), `docs/REFERENCE_FRAMES.md` + new captures, new `docs/M4-MEASUREMENTS.md`, `docs/THREE_API_NOTES.md` (only for genuinely new API facts). `partLoader.ts` and `exteriorLoader.ts` are unchanged — materials and the shell group are owned by `engineScene.ts`, which is where all M4 renderer behavior lives.

## 3. Explode while running

**Control:** an **Explode** slider, 0–100%, in a new **Views** group in the control panel (§7). The slider value is the explode factor `e = value / 100`. Changing it must not disturb animation state (crank angle, RPM, playing, quality, exterior, section, labels).

**Model.** Explode offsets are pure functions of `e`, defined in `src/renderer/viewLayout.ts`, keyed by part group so the mechanism is reusable (and unit-testable without three.js). Three components, all applied on top of the exact M3 placement, in the spaces stated:

1. **Station spread (along project X).** Each station's entire assembly — both cylinders' parts, the shared throw, pistons, rods, heads, lifters, pushrods — translates in X by `spreadX(station) = (stationCenterX − engineCenterX) × 0.8e`, with `engineCenterX = 230 mm` (the station midpoint from the M3 layout). Station centers therefore move from {57.5, 172.5, 287.5, 402.5} to {−80.5, 126.5, 333.5, 540.5} at `e = 1` (spacing 115 → 207 mm). The turned main shaft, front snout/pulley, and rear flange do **not** spread — the throws slide along the shaft axis, as a built-up crankshaft disassembles. Rods stay exact: a cylinder's pin seat and wrist aim point share its station's spread offset, so rod length is unchanged (the renderer already overrides the core's X with seat X; it now uses seat X + spread offset).
2. **Head lift (along each cylinder's bore axis).** The head group — head section, valves, springs, bridges, rockers, injector — translates along the bore axis by `headLift = 110e mm`. Valve/spring/rocker kinematics are internal to the group and are preserved exactly (lift is relative to the head).
3. **Lifter-group lift (along the bore axis).** Lifters and the pushrods' bottom endpoints translate along the bore axis by `lifterLift = 55e mm`. The pushrod tops remain anchored to the actual rocker cup positions (which ride the head lift and the rocker rotation). Pushrods are placed by the existing two-point rule, so they elongate: at `e = 1` the intake pushrod goes 252.6 → 306.5 mm (+21.3%) and the exhaust 250.4 → 304.7 mm (+21.7%) — the only non-rigid explode motion, bounded by the §10 test at ≤ 25%. (Pushrods are plain tubes; this is the standard explode compromise and reads cleanly.)

**Pistons, rods, throws, shaft:** no offset beyond the station spread. Pistons therefore separate from their (lifted) heads by the full 110e along the bore — the bores open up, which is the point of the view. At high `e` the two end stations' throws slide completely off the ends of the turned shaft (at `e = 1` the end throws span X [−127.5, −33.5] and [493.5, 587.5] against the shaft's −18…478 — fully clear with ~15 mm gaps): an intended explode separation, like a crankshaft fully disassembled, and listed as such in §12.

**Application points (there is no head "group" object — everything is global InstancedMesh batches).** The builder applies the offsets per batch, as follows: *station spread* — added to the X of every per-station placement (for most parts via the layout station/rod-seat X; for the throws via the core pin position's X — both X sources take the same per-station offset); *head lift* — added to the B (bore-axis) input of the head, injector, valve, spring, bridge, and rocker placements, and to the rocker-shaft origin from which the live cup positions derive, so pushrod tops keep following the cups exactly; *lifter lift* — added to the B input of the lifter placements and of the pushrod bottom endpoints. The head and injector batches are static in M3 (set once at load); they must be re-applied whenever `e` changes. Head-group rigidity holds because every head-side batch receives the identical B offset — §11 records this in place of any group-object argument.

**Exterior:** the shell does not explode. Explode + Exterior together simply show the internals leaving the shell — allowed, no interlock; the M3 containment statement applies at `e = 0` and the spec does not claim containment for `e > 0`.

**Invariants:** at `e = 0` every offset is exactly zero and the scene is bit-for-bit the M3 scene (same matrices). Explode offsets are independent of crank angle and RPM — the engine runs identically at any `e`.

## 4. Clipping cutaway

**Mechanism:** `renderer.localClippingEnabled = true`. Clipping planes are assigned **per material** to an explicit material set, assembled in `engineScene.ts`: (a) every unique material used by the internal part batches, including the firing-highlight batch's cloned materials; (b) the main-shaft material (created in `engineScene.ts`, not by a loader); (c) every unique exterior material. The studio **ground material is explicitly excluded** — the ground, the HDRI background, and the UI are never clipped. Set `clipShadows = true` on the clipped materials so shadows follow the section. Capped solids are out of scope (plan-deferred): cut parts show hollow interiors — expected.

**Units:** sliders are in millimetres (the layout/viewLayout space); `THREE.Plane` constants are in scene units (metres). The conversion happens in `engineScene.ts` where the plane is built: `constant = ±posMm / 1000` per the mappings below. (§10 pins the metre values.)

**Controls (Views group):** a **Section** selector — `Off` / `Front–Back (X)` / `Side (Y)` — and a **Section position** slider (disabled when Off; selecting a mode resets the slider to that mode's default):

- **Front–Back (X):** plane normal `(−1, 0, 0)`, constant `+posMm/1000`, keeping the half-space `x ≤ pos`. Slider range **−150…+900 mm**, default **900** (nothing clipped — the registered shell spans X −282…+893, the internals −18…478, the fully spread internals −140…598). Sweeping down slices the engine station by station from the front.
- **Side (Y):** plane normal `(0, −1, 0)`, constant `+posMm/1000`, keeping `y ≤ pos`. (The LH bank sits at +Y, the RH bank at −Y.) Slider range **−580…+580 mm**, default **+580** (nothing clipped — shell spans Y −573…+522, internals |Y| ≲ 305). Sweeping down removes the LH bank progressively, opening the valley and the crank.

three.js keeps the side where the signed distance `n·p + constant ≥ 0`; both mappings are written against that rule, and §10 pins the resulting **behavior** (which sample points are kept vs clipped), not merely the parameterization — a sign flip in implementation fails the test.

**Composition:** the section applies to whatever is visible (internals and/or the exterior shell, including in x-ray mode). It does not affect explode, labels' anchor math, or animation state. Reference frame RF-6 (§9) exercises the X mode.

## 5. X-ray

**Control:** an **X-Ray** checkbox in the Views group, implemented renderer-side: the scene controller gains `setXrayEnabled(enabled: boolean)`, and the shell's visibility rule lives in `engineScene.ts` as `group.visible = exteriorChecked || xrayEnabled` (the controller tracks both inputs; `main.ts` wires the two checkboxes to it). Semantics:

- **On:** the exterior group becomes visible (regardless of the Exterior checkbox) with its materials ghosted: `transparent = true`, `opacity = 0.22`, `depthWrite = false`. Internals render normally and show through the shell. The firing highlight and all motion continue.
- **Off:** each exterior material restores from a **snapshot** taken when ghosting was applied (its own prior `transparent` / `opacity` / `depthWrite` values — not hard-coded constants), and group visibility returns to the Exterior checkbox's state.
- Toggling X-Ray changes nothing else (animation, explode, section, quality all untouched). If the Exterior checkbox changes while X-Ray is on, the checkbox state is remembered and takes effect when X-Ray turns off; while X-Ray is on, the shell stays ghost-visible.

## 6. Labels

**Control:** a **Labels** checkbox in the Views group. When on, an HTML overlay layer shows the labels. The layer is a `position: fixed; inset: 0; overflow: hidden; pointer-events: none` container with `z-index: 10` (canvas below, control panel at 20 above it); the UI owns the divs inside it.

- **Part labels** (15), each anchored to a live 3D point computed per frame from the actual part placements (including motion and explode offsets — labels track their parts). Anchor table (cylinder 1 = RH front station):
  - **Piston** — cyl 1 piston, crown center. **Connecting rod** — cyl 1 rod, midpoint of the wrist–pin axis. **Cylinder head** — cyl 1 head section, top-face center. **Intake valves** — cyl 1 intake bridge center. **Exhaust valves** — cyl 1 exhaust bridge center. **Valve springs** — cyl 1 intake spring pair, top midpoint. **Rocker arms** — cyl 1 intake rocker, at the shaft point. **Pushrods** — cyl 1 intake pushrod, mid-span. **Lifters** — cyl 1 intake lifter, top point. **Fuel injector** — cyl 1 injector, top.
  - **Crankshaft** — front snout end, on the axis. **Flywheel flange** — rear flange face center.
  - Exterior (only while the shell is visible, i.e. Exterior on or X-Ray on): **Turbocharger**, **Harmonic balancer**, **Oil pan** — fixed project-space points on the registered shell, chosen by the builder from the M3 registration and recorded in `docs/M4-MEASUREMENTS.md`.
- **Cylinder numbers** (8): small chips "1"…"8" anchored above each cylinder's head, following spread/lift. Total DOM nodes ≤ 23 (15 + 8).

**Projection mechanism:** the UI layer never imports three.js and the scene controller exposes no camera object, so projection happens renderer-side: `EngineSceneController` gains `projectLabelAnchors(viewportWidthPx, viewportHeightPx)`, returning `{ id, text, xPx, yPx, visible }[]` computed from the scene's own camera after the frame's state update; `main.ts` calls it each frame while labels are on and hands the result to the UI handle, which positions the divs. A label is **hidden** when: its anchor is behind the camera; its projected position falls outside the viewport; its part is on the clipped side of the active section plane (evaluate the plane's signed distance at the anchor — cheap and exact); or it is an internals label while the opaque shell is shown (Exterior on and X-Ray off). No other occlusion culling (a label may overlay parts in front of its anchor — documented limitation). Chips use the existing panel's visual language (dark translucent background, ~11px text, thin border); number chips are smaller. Label work per frame is trivial (≤ 23 projections) and must not measurably change frame time (§8 re-verifies).

## 7. Views panel and caption

The control panel gains a **Views** group containing, in order: Explode slider (0–100%), Section selector + Section position slider, X-Ray checkbox, Labels checkbox. All view controls follow the M3 rules: no view change ever resets or pauses the animation, the throttle, the scrubber, or another view's state. Defaults on load: explode 0, section Off, x-ray off, labels off, exterior off (unchanged), quality Auto (unchanged).

The existing illustrative caption is unchanged. Add one line to the panel's Views group (small print, exact text): "Cutaway shows open shells — capped solid sections come later." No other text changes.

## 8. Budget re-verification

M4 adds no geometry and no draw calls (labels are DOM). Re-measure with the `?benchmark=1` harness (same method as M2/M3: 10 s at 900 RPM, stated machine/viewports) and record in `docs/M4-MEASUREMENTS.md`:

- `Full` and `Phone`, exterior off, at (a) all views at defaults and (b) the heaviest view state: explode 100%, labels on, section active mid-range, exterior+x-ray on for the Full run.
- Compliance statement against the D-033 budgets (expected: essentially the M3 numbers; draw calls unchanged within ±5).
- **Shadow check at `e = 1`:** the M3 key-light shadow camera (±0.65 m) was sized for the unexploded engine; explode grows the X span by 276 mm and lifts the heads 110 mm. Confirm visually (RF-5 serves as the evidence) that end-station and lifted-head shadows are not clipped; if they are, widen the frustum, record it as a D-034 studio adjustment in `docs/M4-MEASUREMENTS.md`.

**State-setting surface (required for §8(b) and §9 to be reproducible):** view state must be settable without manual clicking, following the M3 patterns — (i) the `EngineUiHandle` gains setters mirroring the controls (`setExplodePercent`, `setSectionMode`, `setSectionPositionMm`, `setXrayChecked`, `setLabelsChecked`); (ii) the benchmark harness accepts `explode`, `section`, `sectionPos`, `xray`, `labels` URL params alongside the existing `quality`/`exterior`; (iii) reference-frame definitions (§9) gain optional view-state fields applied through the same setters.

## 9. Reference frames (additions)

Extend `docs/REFERENCE_FRAMES.md` with three frames, captured with the same pipeline and size discipline established at M3 (the builder's 1024×640 webview captures — that size is now the standing convention for all frames; RF-1…RF-4 are not re-shot). Their definitions use the §8 state-setting surface (view-state fields alongside theta/camera/exterior):

- **RF-5** — θ = 90°, explode 100%, labels on, exterior off, whole engine: station spread + head lift read, labels tracking.
- **RF-6** — θ = 0°, explode 0, Section Front–Back (X) at position 402.5 mm (cylinder 1's station plane), exterior off: cross-sections of the front station visible, pistons/rods cut at the plane.
- **RF-7** — θ = 180°, exterior on + X-Ray on, explode 0: ghosted shell with internals visible through it, firing cylinder 7 inside.

Each definition states angle, view states, camera, and what to look for, in the RF-1…RF-4 format.

## 10. Tests

Existing 25 tests stay green, unmodified. New tests for the pure view layer (`src/renderer/viewLayout.test.ts` or equivalent), all computed from the layout/config values, not hard-coded results:

1. **Explode zero:** at `e = 0`, station spread, head lift, and lifter lift are all exactly 0 for every station/cylinder.
2. **Explode full:** at `e = 1`, station centers are {−80.5, 126.5, 333.5, 540.5} mm (±0.01), head lift = 110, lifter lift = 55.
3. **Pushrod stretch bound:** at `e = 1`, both channels' pushrod length growth (computed from the M3 lifter points, cup points, and the §3 lifts) is > 0% and ≤ 25%.
4. **Section behavior:** the slider→plane mapping is pinned by behavior in scene units — for Front–Back at position `p` mm, the resulting plane (in metres) keeps a sample point at `x = (p−1)/1000` and clips one at `x = (p+1)/1000`; for Side at `p`, it keeps `y = (p−1)/1000` and clips `y = (p+1)/1000`. Assert via the plane's signed distance at both range ends and the defaults (X default keeps the shell's +893 mm front; Y default keeps −573 mm).
5. **Label anchors:** every label id in the §6 list has exactly one anchor definition; cylinder numbers 1–8 all present.

Expected total ≈ 30–32 tests. Typecheck clean under strict TS; production build succeeds; the architecture rules are unchanged.

## 11. Pre-build self-check (recorded)

- **Pushrod stretch** (the only non-rigid explode motion): intake endpoints (56, 36, 130) → (60, −19, 376.5), length 252.6; differential lift along the bore axis (110 − 55 = 55) extends it to 306.5 = **+21.3%**. Exhaust: 250.4 → 304.7 = **+21.7%**. Both ≤ 25% with margin; the §10 test recomputes this from the actual layout values.
- **Spread geometry vs section ranges:** centers 230 ± {172.5, 57.5} × 1.8 → {−80.5, 126.5, 333.5, 540.5}; spread internals span X ≈ −140.5 (rear rocker cups) … +598 (front head slice). The §4 ranges were sized against the registered shell and the spread engine together: X −150…+900 covers both ends of the spread internals and defaults to unclipped for the shell (max 893); Y −580…+580 covers the shell (−573…+522) and defaults unclipped. (At the X slider's minimum, −150, a sliver of the shell's rear overhang (X < −150) necessarily remains — the slider's purpose is sweeping the engine, not erasing the shell to zero.)
- **Rod exactness under spread:** pin seat X and wrist aim X both take the station's spread offset → their difference is unchanged → rod length exact at all `e` ✓ (same argument as M3's seat placement).
- **Head-side rigidity (per-batch):** there is no head group object in the M3 renderer — rigidity is achieved by construction: every head-side batch (head, injector, valves, springs, bridges, rockers) and the rocker-shaft origin feeding the cup positions receive the identical B offset per §3's application-point list, so every internal relationship, including the cup geometry the pushrod tops anchor to, is preserved exactly ✓.
- **Clipping with instancing and shadows:** three r187 supports clipping planes on InstancedMesh materials and `clipShadows`; per-material assignment avoids clipping the ground/background ✓ (builder confirms against `docs/THREE_API_NOTES.md` discipline and notes any surprise there).

## 12. Acceptance criteria (Buckley verifies from a fresh clone + deployed site)

1. **Frozen files untouched** (diff vs `main`): §2's frozen list, byte- or geometry-identical.
2. Typecheck, full test suite (≈30–32 tests), and build pass from a clean `npm ci`; at `e = 0` with views at defaults the deployed scene is the M3 scene (phasing spot-check θ = 0/90/180 → Cyl 1/2/7 as before).
3. **Explode:** with the engine running at 900 RPM, dragging Explode 0 → 100% spreads the stations and lifts the heads smoothly; firing highlight and readouts keep working; the only separations are the intended ones (heads off pistons, lifters lifted, pushrods elongating within the §3 bound, end throws sliding off the shaft ends at high `e`) — rod and pushrod endpoints stay connected throughout; returning to 0 restores the exact M3 arrangement.
4. **Cutaway:** Section Front–Back swept from 900 down visibly slices the engine station by station; Section Side swept from +580 down removes the LH bank and opens the valley; in both modes the defaults clip nothing (shell included), and ground and background are never clipped; RF-6's frame reproduces from its definition.
5. **X-ray:** toggling X-Ray ghosts the shell and shows the running internals through it (firing highlight visible through the shell); toggling off restores the opaque shell state per the Exterior checkbox.
6. **Labels:** with Labels on, all part labels and cylinder numbers track their parts while playing and while exploding (spot-check cylinder 1's piston label through a stroke at 0.1×); exterior labels appear only with the shell visible; internals labels hide while the opaque shell is shown and when their anchor is on the clipped side of an active section.
7. **Budgets:** `docs/M4-MEASUREMENTS.md` shows both profiles within the D-033 budgets at defaults and in the heaviest view state.
8. **Reference frames:** RF-5…RF-7 definitions + captures committed and matching.

## 13. Handoff

Work on branch `m4-views` in the local clone. When done, push the branch and send a closing summary covering: files changed, test/typecheck/build results, the budget re-measurement table, any sign flip or surprise in the clipping behavior, and anything that deviated from this spec. Buckley verifies, opens the PR, and merges. Local environment notes: Node 24, three@0.187.0 API discipline per `docs/THREE_API_NOTES.md`; no Blender work in this milestone.
