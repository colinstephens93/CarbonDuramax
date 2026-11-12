# Duramax LLY Engine Lab — Project Plan v2.2

Status: **APPROVED — this document governs the project.** Any change to this plan must be recorded in `docs/DECISIONS.md` and applied to this file in the same pull request. If work ever conflicts with this plan, the plan wins until it is formally revised.

v2.2 = Claude's Plan v2 (Nov 12, 2026) as reviewed and amended by Buckley, plus the owner-approved workflow amendment (DECISIONS.md D-029–D-031): coding by the owner in Antigravity, and Buckley's deliverables pre-reviewed by a separate agent. It supersedes all earlier plan versions and chat discussions.

## Summary

A web-based interactive engine lab for the 2005 GM Duramax LLY 6.6L V8 diesel: a running engine with mechanically correct motion, variable throttle, exploded/cutaway/x-ray views, swappable parts, and a dyno that computes horsepower/torque for any build and compares stock vs. modified. It is **not** a driving game.

- Platform: TypeScript + Three.js (pinned version) + Vite, hosted on GitHub Pages. Babylon.js, Godot, Unity, and Unreal were evaluated and set aside.
- Builder: coding is done by the owner in Antigravity, working from Buckley's written specs; the specific Gemini model inside Antigravity is chosen per task. Buckley coordinates, verifies, and integrates into this repo. Claude, Grok, and Gemini, when acting as external reviewers/advisors, are used for reviews and bounded advice only.
- All tools and services are free.

## Decisions locked

| Area | Decision | Note |
| --- | --- | --- |
| Platform | TypeScript + Three.js + Vite, GitHub Pages hosting | Three.js version pinned; an API-notes file accompanies every spec |
| Architecture | 5 layers: math core (crank-angle driven), parts catalog, performance model, renderer, UI | Only the renderer imports Three.js; core and performance model run headless in tests |
| Part swapping | Slots: every variant of a part shares one mount | Each catalog entry carries its model, parameters, explode vector, and compatibility rules |
| Parts naming | Generic tiers (e.g. "Stage 1 injector"), not brand names | |
| Devices | Desktop/laptop full quality; phones viewing + simple controls | Performance budget set per tier |
| Dyno purpose | Educational, credible estimates; not engineering-predictive | Uncertainty bands on every curve |
| Stock rating | Keyed by transmission; default Allison automatic: 310 hp @ 3000 rpm, 605 lb-ft @ 1600 rpm (manual: 300 hp / 520 lb-ft) | Source: GM Media release 2005-08-01 via The Diesel Page; see DECISIONS.md |
| Exterior model | The owner's own GLB; no license barrier | Must be re-registered to the project coordinate frame (Milestone 3) |
| Geometry data | No physical access to an engine. Unknowns stay labeled placeholders from published material | Each value carries a source and a confidence label |
| Visual target | Premium studio look: dark environment, HDRI lighting, physically based materials | Draft look at Milestone 2, confirmed at Milestone 3 |
| Cutaway | Clipping planes and x-ray first; capped sections later | |
| Existing viewer | The current single-file `index.html` viewer and README predate this plan and are **legacy** | Their routes/files must be preserved during migration (see Milestone 0); this plan supersedes their feature claims |
| Deferred | URL-shareable builds, engine sound | Later options, after Milestone 6 |

## Milestones

Each milestone ends only when its exit criteria pass in CI or are signed off by the owner at preview.

0. **Foundations (no new visuals)**
   - Repo set up with Three.js pinned, Vite, a test runner, and GitHub Actions running tests and the build on every pull request, then deploying to Pages.
   - Migration safety: the existing GLB path stays stable and the legacy viewer stays reachable (e.g. under a `/legacy/` route) so the current live site never breaks.
   - Written: asset contract, placeholder-geometry config, frozen interface (types) file, catalog schema, repo docs (this plan, decision log, open-items list).
   - Exit: an empty app deploys from CI, and a deliberately failing test blocks the merge.
1. **Kinematic core, 8 cylinders as primitive shapes**
   - The math core drives the crank, 8 pistons and rods, the cam at half crank speed, valve lift (generic, labeled illustrative on screen) and injection events, from crank angle and RPM.
   - Controls: throttle, slow-motion, crank-angle scrubber.
   - Exit tests: TDC order 1-2-7-8-4-5-6-3; 90° bank angle; cam turns once per two crank revolutions; piston-to-valve clearance never negative across 720°; deterministic output for identical input.
2. **One detailed cylinder**
   - Locks the asset contract in practice, the valvetrain detail (pushrod, rocker, bridge, 4 valves, injector), and the draft studio look. All parts are built to the placeholder config values, never to hard-coded numbers in Blender.
   - Exit: detailed parts run on the Milestone 1 math with no code changes; frame time measured and extrapolated to 8 cylinders against the budget.
3. **8 detailed cylinders plus the exterior**
   - Replicates the cylinder (instancing where possible), registers the exterior GLB to the project frame, confirms the studio look under full lighting.
   - Exit: no visible interference at any crank angle; both device tiers meet budget.
4. **Views**
   - Exploded view while running, clipping-plane cutaway, x-ray, part labels.
   - Exit: explode, cutaway, and labels work at any crank angle and throttle.
5. **Performance model and dyno**
   - Fuel-first model, stock calibration, binding-limit display, uncertainty bands.
   - Exit: stock build reproduces the pinned rating within a stated tolerance; the dyno names the binding limit at each RPM.
6. **Parts catalog and build comparison**
   - Slot swapping, compatibility rules, stock vs. modified side by side.
   - Exit: every catalog entry passes schema validation; an intake-only change with a stock tune shows near-zero gain.

After 6: capped cutaway sections, shareable builds, and engine sound are candidates.

## Asset contract and placeholder geometry

Every model and every dimension follows one written contract. Better data later should be a one-line config change, not a rework.

**Asset contract (written in Milestone 0, proven in Milestone 2)**

- **Frame:** the concept set's frame is the master. Origin is the crank axis at the rear block / adapter plane; +X toward the front accessory drive, +Y vehicle left (LH), +Z up.
- **Axis conversion:** glTF is Y-up. Conversion happens once, at export, using the Blender glTF exporter's Y-up option. A reference fixture (a known 3-axis marker) is checked by a test.
- **Units:** meters in models and in the math core; the config may record source values in mm or inches, converted on load.
- **Pivots:** every moving part's origin sits exactly on its rotation or slide axis. Code moves parts; Blender animation is not used.
- **Naming:** `<system>_<part>_<instance>_<variant>`, e.g. `rot_piston_c3_stock`, with cylinder numbers per the RH 1-3-5-7 / LH 2-4-6-8 scheme.
- **Budgets:** triangle, draw-call, and texture-memory limits per tier, set at Milestone 2 from measurements.
- **Compression:** meshopt or Draco for geometry, KTX2 for textures.
- **Provenance:** each model file lists what reference it was built from and whether its shape is verified or illustrative.

**Placeholder-geometry config**

One file holds every dimension. Each entry has a value, a status, a confidence level, and a source. Unknowns get a value chosen from published material, never left blank, and are shown as illustrative in the app.

| Parameter | Value | Status | Source |
| --- | --- | --- | --- |
| Bore | 103.00 mm | Nominal | Concept set D01 (S1) |
| Stroke | 99.00 mm | Nominal | Concept set D01 (S1) |
| Crank throw radius | 49.50 mm | Derived | Stroke / 2 |
| Bank angle | 90° | Nominal | Concept set D01 |
| Firing order | 1-2-7-8-4-5-6-3 | Nominal | S1 |
| Compression ratio | 17.5:1 | Published, medium confidence | Published LLY references (2004–2005) |
| Rod length | Unknown | Placeholder — to source | Published material |
| Bore pitch / bank stagger | Unknown | Placeholder | Concept set D05 |
| Deck height, cam center | Unknown | Placeholder | Concept set D10 |
| Valve sizes, lift profiles, valve timing | Unknown | Placeholder, illustrative | Concept set D10 |
| Crank-pin phasing | To derive | Derived from firing order and bank angle | Math core test |

## Performance model

Torque comes from fuel burned per cycle; air, heat, and hardware set the limits. The dyno shows, at each RPM, which limit is binding.

**Structure**

1. **Fuel delivered per cycle:** set by the tune, then capped by injector flow, rail pressure, injection duration, and CP3 pump capacity.
2. **Torque:** fuel energy x efficiency, minus friction and pumping losses.
3. **Limits checked every RPM step:** smoke (air/fuel ratio), exhaust gas temperature (EGT) ceiling, turbo map (variable-geometry vane position — an input from the tune, not a fixed curve — boost, shaft speed), and tune caps. The lowest one wins and is named on the chart.
4. **Output:** crank horsepower and torque with an uncertainty band. Wheel horsepower only with an explicit, labeled drivetrain-loss setting.

**Calibration data needed**

- Stock rating, pinned by transmission (above)
- A full stock torque curve, not just the peak points
- Stock boost and rail pressure vs. RPM
- Compression ratio (17.5:1, above) and stock injector flow

Each input carries a source and a confidence level. Low-confidence inputs widen the band.

**What would make the numbers misleading**

- Extrapolating far past stock without widening the band
- Mixing crank and wheel horsepower
- Gains from airflow parts with a stock tune (should be near zero)
- Hiding which limit is binding

## Verification and workflow

The loop is spec → build → verify → preview → ship, with every change arriving as a pull request that CI must pass.

1. **Spec:** Buckley writes a spec into the repo, with acceptance tests stated up front and the pinned Three.js API notes attached. Buckley's specs and other substantive deliverables are reviewed by a separate agent, and Buckley fixes the issues it flags before the owner sees them (D-030). This pre-review happens before, and is separate from, the outside-model review in step 3 where that also applies.
2. **Build:** the spec names a task branch. The owner runs Antigravity in a local clone of this repo on that branch and pushes the branch when the implementation is ready (a normal git push, not file copying). Buckley reviews the branch, verifies it (CI, tests, checks), and opens or updates the pull request.
3. **Verify:** all applicable checks required.
   - CI on every pull request: unit tests (kinematics, performance model), catalog schema validation, type check, build.
   - Screenshot comparison against approved reference frames at fixed crank angles — advisory (report-only) until proven stable, then a merge gate.
   - Outside-model review (Claude, Grok, or Gemini, read-only against the spec) is **mandatory at each milestone exit and at any spec or interface change**; routine in-milestone PRs are CI-gated.
4. **Preview:** the owner checks the deployed preview for what looks wrong.
5. **Ship:** merge to main; CI deploys to Pages.

**Rules**

- The interface (types) file is frozen. It changes only through a spec revision, never inside a feature change.
- Only Antigravity writes code, and only from a written spec, on a task branch that Buckley verifies and integrates. When acting as external reviewers/advisors, Claude, Grok, and Gemini never write files to the repo — this restriction does not apply to the Gemini model selected inside Antigravity for a coding task. Reviewer output is comments or advice that Buckley turns into specs. Buckley's own substantive deliverables are reviewed by a separate agent, and Buckley fixes the issues it flags, before the owner sees them (D-030).
- Repo docs (`docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`) are the project's memory. Any new Buckley session starts by reading them.
- Every number in the app traces to the config or the catalog, which trace to a source.

## Risk register

The largest risk is unknown internal geometry. It is managed by labeling, not solved.

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Internal dimensions unknown (rod length, pitch, deck height, valvetrain) | Rework whenever better data appears | Placeholder config; parts modeled to config values; illustrative labels in the app |
| Coding, verification, and authorship concentrated in too few hands | Shared wrong assumptions pass review | Roles separated: Antigravity codes from spec, Buckley verifies, a separate agent pre-reviews Buckley's deliverables, CI tests are the main gate, plus mandatory outside review at milestone exits and interface changes |
| Modeling labor for internals and part variants | Schedule stalls in Blender | Milestone 2 sets the detail level; generic tiers keep variant count low |
| Exterior GLB not registered to the frame | Internals clip through the block | Registration step and an interference check in Milestone 3 |
| Browser performance (studio look plus explode, cutaway, x-ray) | Slow on laptops, unusable on phones | Budgets per tier from Milestone 2 measurements; instancing; reduced phone tier |
| Three.js API drift across AI output | Broken or mixed-version code | Version pin, API-notes file, CI type check |
| Performance model credibility | Misleading build comparisons | Binding-limit display, bands, transmission-keyed calibration |
| Agent context loss between sessions | Repeated or contradictory work | Repo docs as memory; specs in the repo |

## Sources

- GM Media release 2005-08-01, via The Diesel Page: LLY ratings by transmission (2006 Duramax 6600 news release page; The Diesel Page 2005 model-year page: 310 hp / 605 lb-ft with the Allison automatic)
- 2005 Duramax LLY Corrected Concept Set, Revision C: frame, nominal dimensions, evidence register D01–D12
- Published LLY references: compression ratio 17.5:1 (2004–2005)
