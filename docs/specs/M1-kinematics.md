# Spec — Milestone 1: Kinematic Core (Primitives)

Project: Duramax LLY Engine Lab · Governing plan: `docs/PLAN.md` v2.2 (Milestone 1) · Decisions: D-002–D-005, D-008–D-012, D-029, D-030, D-032
Task branch: **`m1-kinematics`** (from `main`) · Builder: owner in Antigravity, from this spec · Verifier/integrator: Buckley
Prerequisite: Milestone 0 merged (scaffold, frozen `src/core/interfaces.ts`, placeholder `src/config/engineConfig.ts`, CI gate).

## Goal

All eight cylinders animated as primitive shapes, driven by one pure crank-angle function in the math core, with the plan's executable tests proving the phasing: firing-order TDC sequence, cam at exactly half crank speed, 90° bank angle, piston-valve clearance never negative, and determinism over 10,000 revolutions. The placeholder cube scene is replaced by the primitive engine with the plan's Milestone 1 controls: throttle, slow-motion, and a crank-angle scrubber.

## Modeling definitions (normative — implement exactly this)

**Angles.** Global crank angle θ ∈ [0°, 720°), with θ = 0 defined as cylinder 1 at firing TDC. Each cylinder's local cycle angle is αᵢ = (θ − φᵢ) mod 720, where the phase offset φᵢ comes from the firing order (1-2-7-8-4-5-6-3) at even 90° intervals: cyl 1 → 0°, cyl 2 → 90°, cyl 7 → 180°, cyl 8 → 270°, cyl 4 → 360°, cyl 5 → 450°, cyl 6 → 540°, cyl 3 → 630°. Derive φᵢ from `engineConfig.firingOrder` in code (position in the order × 90°); do not hard-code a second copy of the order.

**Piston motion (slider-crank).** With crank throw r = crankThrowMm/1000 and rod length L = rodLengthMm/1000 (meters), wrist-pin distance from the crank axis along the bore axis is x(α) = r·cos α + √(L² − r²·sin² α). `CrankState.pistonPositionM` is displacement **below TDC**: p(α) = (r + L) − x(α), so p = 0 at TDC and p = stroke (0.099 m) at BDC.

**Valves (placeholder timing, D-011/D-012).** Cam angle γ = (θ/2) mod 360 — exactly half crank speed. Lift is a function of local cycle angle α, defined in a new placeholder config (Deliverable 2): intake lift is nonzero for α ∈ [350°, 590°], exhaust for α ∈ [110°, 350°], each following maxLift · sin²(π·(α − start)/(end − start)) inside its window and 0 outside; maxLift = 12 mm (config stores mm; the core converts to meters). At firing TDC (α = 0) both lifts are 0; at overlap TDC (α = 360°) intake lift is ≈ 0.20 mm and exhaust lift is 0 (its window has closed).

**Clearance.** Piston-to-valve clearance for a valve = p(α) + deckGap − lift, with deckGap = 2 mm (placeholder config, storing mm). The minimum over the cycle with these placeholder values is ≈ 1.74 mm at α ≈ 362.6° (intake side) — tight enough that plausible future timing changes can break it, which is the test's purpose.

**Injection events.** The plan's Milestone 1 includes injection events in the core's outputs. `CrankState` (frozen) has no injection field, so in this milestone the injection event is represented in the renderer: the firing highlight (Deliverable 3) marks the cylinder in its injection/firing window, derived from its local α. A dedicated injection state is deferred to the performance milestone and would arrive via a spec revision, not an interface change snuck into this one.

**Simplifications (stated, deliberate).** Crankpins are modeled as per-cylinder phase offsets from the firing order; shared-pin crossplane geometry is deferred to Milestone 2/3. Valves move along the bore axis (real LLY valves are near-vertical in the head). These are visualization/proof simplifications, recorded here so nobody mistakes them for sourced geometry.

**Purity.** `computeState` normalizes θ mod 720 on entry and is a pure function of (config, θ): no accumulated state, no wall-clock, no randomness. Time advancement (θ from RPM) lives in the UI layer only.

## Deliverables

1. **Math core** `src/core/kinematics.ts` — no `three` import (architecture test still applies). Exports:
   - `computeState(config: EngineConfig, crankAngleDeg: number, rpm: number): CrankState` — fills `pistonPositionM` and `valveLiftM` for all 8 cylinders per the definitions above; echoes crankAngleDeg (normalized) and rpm.
   - `phaseOffsetDeg(config, cylinder): number` — derived from firing order.
   - `camAngleDeg(crankAngleDeg): number`
   - `bankBoreAxis(bank: Bank): [number, number, number]` — the bank's bore-axis unit vector in the project frame: (0, −sin45°, cos45°) for RH, (0, +sin45°, cos45°) for LH (frame: +Y is vehicle LH, so the RH bank sits on the −Y side).
   - `crankPinPositionM(config, valveConfig, cylinder, crankAngleDeg): [number, number, number]` — 3D pin position in the project frame: crank axis along X with origin at the rear block plane (per the asset contract, the engine extends into +X); cylinder station x from Deliverable 3's layout; in the YZ plane the pin sits at crank center + r·(cos α · u_b + sin α · v_b), where u_b = `bankBoreAxis(bank)` and v_b is u_b rotated −90° about X. At α = 0 the pin is at top of its throw along the bore axis.
   - `pistonValveClearanceM(config, valveConfig, cylinder, crankAngleDeg): { intake: number; exhaust: number }`
2. **Valve placeholder config** `src/config/valveConfig.ts`: declares and exports `interface ValveConfig` (in this file — `interfaces.ts` stays frozen) and `export const valveConfig: ValveConfig`. Every field is a `ProvenancedValue` with confidence 'placeholder' and a source noting the plan's D-011/Rev C unknowns: maxLift (12, unit 'mm'), deckGap (2, unit 'mm'), borePitch (115, unit 'mm'), intakeOpenDeg (350, 'deg'), intakeCloseDeg (590, 'deg'), exhaustOpenDeg (110, 'deg'), exhaustCloseDeg (350, 'deg').
3. **Primitive renderer** `src/renderer/engineScene.ts` (replaces `smokeCube.ts` — delete that file and its references; update `docs/THREE_API_NOTES.md` if new three APIs are used):
   - Layout: crank axis along X, origin at the rear block plane, engine extending into +X. Cylinder stations: pairs (1,2), (3,4), (5,6), (7,8) at x = 3.5, 2.5, 1.5, 0.5 × borePitch respectively (pair (1,2) front-most). Banks tilted per `bankBoreAxis` (±45°, 90° between banks).
   - Per cylinder, all primitives positioned **every frame from core outputs only** (`computeState` + `crankPinPositionM`): block/head as one static box per bank (or a simple wireframe block — builder's choice, static), piston = short cylinder whose center sits at wrist-pin point minus p(α) along the bore axis from its TDC position, connecting rod = thin cylinder stretched between crank-pin point and wrist-pin point (position, lookAt, length scale), crank webs = thin boxes rotating with the pin, valves = two small discs at the head end of the bore axis, each offset **from the head toward the piston** by its lift.
   - Firing highlight (the injection-event representation): the cylinder whose local angle is within [0°, 90°) gets an emissive highlight material on its piston. Because the eight local angles are spaced exactly 90° apart, exactly one cylinder is in that window at any θ, and the highlight steps to the next cylinder every 90° of crank rotation.
   - Camera: perspective, positioned to see the whole V; OrbitControls allowed (three/addons) — renderer is the only `three` importer, unchanged rule.
4. **UI** `src/main.ts` + `src/ui/` (plain DOM, no framework) — the plan's Milestone 1 controls:
   - Play/pause button.
   - **Throttle:** RPM slider 650–3200 (default 900), labeled as throttle/RPM.
   - **Slow-motion:** speed selector 1× / 0.1× / 0.01× multiplying the angle advance.
   - **Crank-angle scrubber:** a 0–720° slider that sets θ directly (dragging it pauses advancement; the readout follows it). This is what makes Acceptance 3 executable.
   - Readouts: crank angle, RPM, effective speed, and currently firing cylinder (the one in the [0°, 90°) window).
   - **On-screen label:** a visible caption stating that valve timing/lift and placeholder dimensions are illustrative (the plan requires unknowns to be shown as illustrative in the app).
   - Animation loop advances θ by rpm · 6 · dt · speedMultiplier degrees (rpm rev/min × 360°/60 s) using requestAnimationFrame delta time, kept in the UI layer; each frame calls `computeState` once and updates the scene.
5. **Docs:** this spec is added to the repo by Buckley, not the builder. Builder updates `docs/THREE_API_NOTES.md` only if it uses three APIs not already noted.

## Tests — `src/core/kinematics.test.ts` (all must pass in CI, plus all M0 tests still green)

State comparisons in tests 3 and 5 use a field-by-field tolerance helper (1e-9), never exact deep equality on floats — angle normalization of large inputs makes bit-exact equality the wrong demand.

1. **Firing sequence:** for k = 0..7, at θ = k·90° exactly one cylinder has pistonPositionM ≈ 0 (within 1e-9) with both valve lifts exactly 0; collecting those cylinders in order yields [1, 2, 7, 8, 4, 5, 6, 3]. (Uniqueness relies on the overlap cylinder's intake lift being ≈ 0.20 mm ≠ 0 at its TDC — noted so a future timing change that zeroes it is caught as a test-design issue, not a mystery.)
2. **Piston extremes:** for each cylinder at its firing angle, p ≈ 0; at firing angle + 180°, p ≈ 0.099 (within 1e-9).
3. **Cam half speed:** `camAngleDeg(θ + 360)` = `camAngleDeg(θ) + 180` (mod 360) for sampled θ; valve lift of some cylinder differs between θ and θ + 360 (cycle is 720°, not 360°); `computeState(θ)` matches `computeState(θ + 720)` within tolerance.
4. **Clearance:** sweep θ from 0 to 720 in 0.25° steps; for every cylinder and both valves, clearance ≥ 0; also assert the sweep's minimum clearance is < 0.005 m (with the 2 mm deck gap the true minimum is ≈ 0.00174 m, so this proves the sweep actually reaches the tight overlap region rather than passing vacuously).
5. **Determinism / 10,000 revs:** `computeState(θ)` matches `computeState(θ + 3_600_000)` (10,000 × 360°) within 1e-9 on every field for sampled θ including 0, 123.456, 719.9; repeated calls return matching results.
6. **Pin geometry and bank angle:** at each cylinder's firing angle, `crankPinPositionM` lies at distance r from the crank axis (norm of YZ components = crankThrow in meters, within 1e-9) and its dot product with the bank's bore-axis unit vector is maximal among ±10° neighbors; and `bankBoreAxis('RH') · bankBoreAxis('LH')` = 0 within 1e-12 (the 90° bank angle), both axes unit length within 1e-12.

## Acceptance criteria (Buckley verifies)

1. CI green on the PR (typecheck, all tests including M0's, build); branch protection intact.
2. After merge, the deployed site at `/` shows the primitive engine: 8 cylinders in two banks at 90°, pistons/rods/crank moving together, throttle, slow-motion, and scrubber working, firing highlight stepping through cylinders in firing order, placeholder/illustrative caption visible.
3. Phasing spot-check using the scrubber: setting θ = 0, 90, 180 highlights cylinders 1, 2, 7 respectively (readout agrees).
4. No changes to `src/core/interfaces.ts`, `src/config/engineConfig.ts` values, the legacy viewer, or the GLB. (New files and the renderer/UI changes above only.)

## Out of scope (do not build)

Real part geometry or GLB parts, the detailed single cylinder (M2), exterior GLB registration (M3), explode/cutaway/labels (M4), performance/dyno and dedicated injection state (M5), sound, load simulation, shared-pin crank geometry.

## Antigravity task prompt (owner pastes this)

> You are building Milestone 1 (Kinematic Core, primitives) of the Duramax LLY Engine Lab in this repo clone. First read `docs/PLAN.md`, `docs/DECISIONS.md`, and the full spec at `docs/specs/M1-kinematics.md` — the spec's Modeling definitions are normative: implement the formulas and numbers exactly as written; where the spec is silent, ask rather than invent. Work on branch `m1-kinematics` (create it from `main`). Deliver exactly: `src/core/kinematics.ts` (pure, no three import) with the spec's exports including `bankBoreAxis`, `src/config/valveConfig.ts` declaring `ValveConfig` and exporting `valveConfig` with the spec's placeholder provenanced values (lengths stored in mm, core converts), `src/renderer/engineScene.ts` replacing `smokeCube.ts` (delete it) with the primitive engine driven only by core outputs, the UI in `src/main.ts`/`src/ui/` with play/pause, throttle (RPM) slider, slow-motion selector, crank-angle scrubber, readouts, and the on-screen illustrative caption, and `src/core/kinematics.test.ts` implementing the spec's six tests with tolerance-based state comparisons. Do not modify `src/core/interfaces.ts`, the values in `src/config/engineConfig.ts`, the legacy viewer, or the GLB. All M0 tests must keep passing; typecheck, full test suite, and build must pass locally. Do not build anything in the Out of scope list. When finished, commit with clear messages and push the branch; do not merge it and do not open the pull request — say what you built, what you verified locally, and anything you were unsure about.
