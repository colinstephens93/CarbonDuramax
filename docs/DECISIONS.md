# Decision Log — Duramax LLY Engine Lab

Every settled decision lives here, newest last. To change the plan: add an entry here explaining the change and revise `docs/PLAN.md` in the **same pull request**. A decision is not changed until both are done.

## 2026-11-12 — Project definition

- **D-001 Project:** Build an interactive 2005 Duramax LLY engine lab — running engine, variable throttle, exploded/cutaway/x-ray views, swappable parts, dyno with stock-vs-modified comparison. Explicitly **not** a driving game.
- **D-002 Cost constraint:** Free tools and services only. No paid software, assets, or hosting.

## 2026-11-12 — Platform and stack

- **D-003 Platform:** Web app (runs from a link, any device), hosted on GitHub Pages. Desktop wrapper (e.g. Tauri) is a later option using the same assets.
- **D-004 Stack:** Blender (modeling) → glTF/GLB (asset format) → TypeScript + Three.js (app) + Vite (tooling), Git/GitHub (storage + CI), Poly Haven / ambientCG (free CC0 lighting/materials).
- **D-005 Three.js version is pinned.** An API-notes file accompanies every coding spec so AI-written code targets one API version.
- **D-006 Alternatives set aside:** Babylon.js (credible, but no advantage worth switching), Godot (game engine; heavy web export), Unity (heavyweight, license history), Unreal (poor web support), Python as app runtime (kept for Blender scripts and math prototypes only).

## 2026-11-12 — Architecture

- **D-007 Layered architecture:** (1) math/simulation core driven by crank angle, (2) parts catalog data, (3) performance model, (4) Three.js renderer, (5) web UI. Only the renderer imports Three.js; the core and performance model must run headless in tests.
- **D-008 Parts as slots + variants:** every swappable part is a slot with shared mounting datums; each variant carries a visual model **and** performance parameters **and** compatibility rules in one catalog entry.
- **D-009 Generic part tiers,** not brand names (brand performance data is mostly marketing claims).
- **D-010 Frozen interface contract:** the shared types/interface file changes only through a spec revision, never inside a feature change.
- **D-011 Asset contract:** concept-set coordinate frame is master (origin = crank axis at rear adapter plane, +X front, +Y LH, +Z up); Z-up→Y-up conversion once at glTF export; meters everywhere; every moving part's origin on its rotation/slide axis; naming `<system>_<part>_<instance>_<variant>`; motion driven by code, never Blender animation.

## 2026-11-12 — Simulation and performance model

- **D-012 Unknown dimensions are labeled placeholders** in a single config file, each with value, status, confidence, and source. The app labels illustrative geometry on screen (including generic valve timing/lift). No dimension is ever silently invented.
- **D-013 Performance model is fuel-first with limits:** fuel delivered sets torque; smoke (AFR), EGT, turbo map, CP3 capacity, and tune caps limit it. The dyno displays **which limit is binding** at each RPM and shows an **uncertainty band**, not a single line.
- **D-014 Variable-geometry turbo modeled explicitly,** with vane position as an input from the tune.
- **D-015 Dyno is educational with credible estimates,** not engineering-predictive. Output is crank (flywheel) power by default; wheel power only via an explicit labeled drivetrain-loss setting.
- **D-016 Stock rating keyed by transmission,** default **Allison automatic: 310 hp @ 3000 rpm, 605 lb-ft @ 1600 rpm** (manual: 300 hp / 520 lb-ft). Source: GM Media release 2005-08-01 via The Diesel Page (secondary host, medium-high confidence). Published figures of 520/590/605 lb-ft conflict because they describe different configurations/years.
- **D-017 Compression ratio 17.5:1** adopted from published LLY references (2004–2005), medium confidence.

## 2026-11-12 — Workflow and verification

- **D-018 Loop:** spec → build → verify → preview → ship, in small milestones. Every change is a pull request gated by CI.
- **D-019 Repo integration (builder wording superseded by D-029):** Buckley is the sole integrator of this repo. Code is authored in Antigravity under D-029; Buckley verifies and integrates it. When acting as reviewers/advisors, Claude/Grok/Gemini do not write code; their output enters as specs or review comments via Buckley. The owner is never the courier for files.
- **D-020 Verification is executable:** automated tests (TDC/firing sequence, cam at half crank speed, piston-valve clearance, stock-calibration tolerance, determinism) + catalog schema validation + type check + build, run in CI (GitHub Actions, free for public repos). Screenshot comparison is advisory until proven stable.
- **D-021 Outside review cadence:** mandatory outside-model review at **each milestone exit** and at **any spec or interface change**; routine in-milestone PRs are CI-gated. (Claude's stricter every-PR review was considered; it routes every diff through the owner as courier, recreating the integration-bus problem. This is the recorded compromise.)
- **D-022 Repo docs are the project's memory.** Any new Buckley session starts by reading `docs/PLAN.md`, this log, and `docs/OPEN_ITEMS.md`.

## 2026-11-12 — Scope, devices, existing artifacts

- **D-023 Milestone sequence:** M0 Foundations → M1 kinematic core (8 primitive cylinders + tests) → M2 one detailed cylinder → M3 full engine + exterior → M4 views → M5 performance model/dyno → M6 parts catalog/comparison. The original "detailed single cylinder first" milestone was replaced after Claude's independent review: phasing across 8 cylinders is the real risk, so it is tested first with primitives.
- **D-024 Visual target:** premium studio look (dark environment, HDRI, PBR materials). Draft at M2, **confirmed at M3** (not locked at M2).
- **D-025 Devices:** desktop/laptop = full quality tier; phone = viewing + simple controls tier. Per-tier performance budgets are set at M2 from measurements.
- **D-026 Existing artifacts:** the GLB is the owner's own creation — no license barrier. The single-file `index.html` viewer and README (added Nov 11, 2026) predate this plan and are **legacy**: preserved during migration (GLB path stable, legacy viewer reachable), superseded as the product by this plan.
- **D-027 Deferred:** URL-shareable builds, engine sound, capped-solid cutaway sections — candidates after M6.
- **D-028 Data availability:** the owner has no physical access to an LLY or truck; all geometry/performance data comes from published sources with confidence labels. No visual-quality reference example is available; the studio target in D-024 stands.

## 2026-11-12 — Workflow amendment (plan v2.2), owner-approved

- **D-029 Coding in Antigravity.** Actual code is written by the owner using **Antigravity** as the coding environment; the specific Gemini model inside Antigravity is chosen per task. Google AI Studio is not a standing option (adopting it would require a new decision). Buckley writes the specs and task prompts, verifies the output (tests, CI, file and math checks), and integrates it into the repo. This supersedes the builder wording of D-019: Buckley is coordinator/verifier/integrator, not the default coder. **Handoff mechanism:** the spec names a task branch; the owner runs Antigravity in a local clone of this repo on that branch and pushes the branch; Buckley reviews it, verifies it, and opens or updates the pull request.
- **D-030 Pre-review of Buckley's work.** Any substantive deliverable Buckley produces for the owner's review — specs, plan documents, amendments, verification reports — is first reviewed by a separate agent, and Buckley fixes what it flags before the owner sees it. This requirement applies to Buckley's substantive deliverables; Antigravity-authored code remains subject to Buckley verification and the D-020/D-021 gates. **Sequence:** D-030 pre-review happens before the owner sees Buckley's deliverable; D-021 outside-model review is an additional gate at milestone exits and spec/interface changes, unless the decision log for that change explicitly records one independent review as satisfying both.
- **D-031** This amendment was approved by the owner on Nov 12, 2026, and is recorded together with the matching `PLAN.md` revision, per the anti-drift rule.
