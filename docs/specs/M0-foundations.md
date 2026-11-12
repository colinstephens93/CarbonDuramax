# Spec — Milestone 0: Foundations

Project: Duramax LLY Engine Lab · Governing plan: `docs/PLAN.md` v2.2 · Decisions: D-002, D-005, D-007–D-012, D-016, D-017, D-019, D-020, D-026, D-029, D-030
Task branch: **`m0-foundations`** (from `main`) · Builder: owner in Antigravity, from this spec · Verifier/integrator: Buckley

## Goal

Stand up the project's permanent scaffolding — Vite + TypeScript + pinned Three.js, a test runner, CI that builds/tests/deploys, the asset contract, the placeholder-parameter config, the frozen interface file, and the catalog schema — with the legacy viewer and the engine GLB untouched at their current public URLs. No engine behavior is built in this milestone.

## Pinned versions (install exactly; commit `package-lock.json`)

- `three` **0.187.0**, `@types/three` **0.187.0**
- `vite` **7.3.8**
- `vitest` **3.2.7**
- `typescript` **5.9.3**, `tsconfig` with `"strict": true`
- `ajv` **8.20.0** (devDependency; used only by the catalog schema test)
- Node **24** (create `.nvmrc` containing `24`; CI uses it)

## Deliverables

1. **App scaffold** (repo root): `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.nvmrc`, `.gitignore` (`node_modules`, `dist`), `package-lock.json`, `src/main.ts`. The app at `/` shows a minimal page titled "Duramax LLY Engine Lab" with a Three.js canvas rendering one rotating placeholder cube. The cube is the agreed renderer smoke proof only — it is not an engine visual, and "empty app" in the plan's M0 exit means no engine content, which this satisfies.
   - `vite.config.ts`: `base: '/CarbonDuramax/'`.
   - Folder layout (empty modules with a one-line header comment each, no logic yet): `src/core/`, `src/config/`, `src/catalog/`, `src/perf/`, `src/renderer/`, `src/ui/`. Only `src/renderer/` may import `three` (D-009); this is enforced by the architecture test in the Tests section (a vitest file scan — no ESLint in this milestone).
   - Catalog **data** lives at repo-root `catalog/` (Deliverable 4); `src/catalog/` is the future code module. Tests that read repo-root files resolve paths from the repository root (`process.cwd()` under vitest).
2. **Frozen interface file** `src/core/interfaces.ts`: type definitions only (no logic), header comment stating it is frozen except via spec revision. Contents:
   - `ProvenancedValue` (value: number, unit: string, confidence: 'verified' | 'published' | 'placeholder', source: string)
   - `CylinderId` (1–8), `Bank` ('RH' | 'LH')
   - `EngineConfig` — every scalar is a `ProvenancedValue` (D-012): boreMm, strokeMm, crankThrowMm, rodLengthMm, compressionRatio (unit 'ratio'), vAngleDeg; plus firingOrder: number[] and bankAssignment: Record<CylinderId, Bank>
   - `CrankState` (crankAngleDeg, rpm, pistonPositionM: Record<CylinderId, number>, valveLiftM: Record<CylinderId, { intake: number; exhaust: number }>) — core state is in **meters** per the plan's units rule; millimetres appear only in config values, whose units say so
   - `PartSlotId` — string union: turbo, injectors, cp3, intake, exhaust, intercooler, tune, pistons, rods, camshaft, heads, fuelRail. **Note:** no slot enumeration exists in the plan; this list is a new decision introduced by this spec and is recorded as **D-032** in `docs/DECISIONS.md` in the same commit that adds this spec to the repo.
   - `PartVariant` (id, slotId, name, provenance: 'verified' | 'illustrative', modelPath: string | null, explodeVectorMm: [number, number, number], performanceParams: Record<string, number>, compatibility: Record<string, string[]>, notes?) — model reference, explode vector, and compatibility rules are required by D-008 even though M0 leaves them empty/null
   - `Build` (buildId, name, selections: Record<PartSlotId, string>)
   - `LimitKind` ('smoke' | 'egt' | 'turbo' | 'cp3' | 'tune')
   - `PerformanceResult` (rpmPoints: number[], torqueLbFt: number[], powerHp: number[], bindingLimitPerPoint: LimitKind[], uncertaintyPct: number[] — all arrays aligned by index; the uncertainty band varies per point per D-013)
3. **Placeholder config** `src/config/engineConfig.ts`: an `EngineConfig` plus the stock ratings as `ProvenancedValue`s, values exactly as in the plan / `docs/OPEN_ITEMS.md`:
   - bore 103 mm ('published', Rev C concept set), stroke 99 mm ('published', Rev C concept set), crank throw 49.5 mm ('placeholder', derived: stroke / 2), V-angle 90° ('published', Rev C concept set)
   - rod length 163.0 mm ('placeholder', published Duramax rod-length listings ≈ 6.42 in — a D-012 placeholder chosen from published material, never 0 or blank; to be verified during M1 sourcing)
   - compression ratio 17.5 ('published', published 2004–2005 LLY references)
   - bank assignment RH 1-3-5-7 / LH 2-4-6-8; firing order 1-2-7-8-4-5-6-3
   - stock ratings: 310 hp @ 3000 rpm and 605 lb-ft @ 1600 rpm (Allison automatic, 'published', GM Media release 2005-08-01 via The Diesel Page)
4. **Catalog schema** `catalog/schema.json` (JSON Schema for a `PartVariant` array) + `catalog/stock.json` containing exactly one entry: the stock turbo as an illustrative placeholder variant (performanceParams `{}`, modelPath null, explodeVectorMm [0,0,0], compatibility {}, provenance 'illustrative').
5. **Asset contract** `docs/ASSET_CONTRACT.md`: transcribe the plan's Asset Contract section in full — frame, units, Z-up→Y-up conversion, pivots **and code-driven motion (no Blender animation)**, naming, compression, **budgets**, provenance — into a standalone document; do not invent additions.
6. **Three.js API notes** `docs/THREE_API_NOTES.md`: state the pinned version (0.187.0) and the API facts the code relies on (e.g., `outputColorSpace`, WebGLRenderer defaults in this version, GLTFLoader path). Keep to facts verifiable from the installed package's types/docs; if a note cannot be verified, omit it.
7. **CI** `.github/workflows/ci.yml`:
   - Workflow-level `permissions: { contents: read, pages: write, id-token: write }` and a `concurrency` group for Pages so deploys never overlap.
   - Checks job — on pull requests and pushes to `main`: checkout → setup Node 24 (from `.nvmrc`) with npm cache → `npm ci` → `npm run typecheck` → `npm test` → `npm run build`.
   - Deploy job — pushes to `main` only, after checks pass: `actions/upload-pages-artifact` with `dist/` → `actions/deploy-pages`, with `environment: github-pages`.
8. **Legacy preservation (hard requirement).** Inspected facts about the current `index.html` (45,855 bytes): all libraries load from CDNs (cdnjs three r128, jsdelivr three@0.128 examples, model-viewer) — those URLs are absolute and must not be touched. The GLB is referenced by the **bare relative path** `Duramax_LLY_2005_66L_V8.glb` in `src`/`href` attributes and JS strings.
   - Move `index.html` → `public/legacy/index.html` and the GLB → `public/Duramax_LLY_2005_66L_V8.glb` (Vite copies `public/` verbatim into `dist/`, so the legacy viewer stays at **`/legacy/`** and the GLB at **`/Duramax_LLY_2005_66L_V8.glb`**).
   - Rewrite **only** the GLB's relative references: `Duramax_LLY_2005_66L_V8.glb` → `../Duramax_LLY_2005_66L_V8.glb`. Do not edit the viewer's features, content, or CDN references.
   - The current root `README.md` stays in the repo (it may gain one line pointing to `docs/PLAN.md` as the governing plan — that line only).

## Owner steps (repo settings — Buckley cannot do these; sequenced)

1. **Branch protection:** Settings → Branches → add rule for `main` requiring the CI checks job to pass before merging. (This is what makes a failing test *block a merge*, per the plan's M0 exit — red CI alone does not.) Do this any time before the M0 PR is reviewed.
2. **Pages source:** Settings → Pages → Build and deployment source = **GitHub Actions**. Do this **immediately before the M0 PR is merged** — flipping it stops the branch-served site until the first Actions deploy completes, and the merge triggers that deploy.

## Tests (exact paths; all must pass in CI)

- `src/config/config.test.ts`: displacement computed from bore/stroke × 8 is within 0.02 L of 6.6 L; firing order is a permutation of 1–8; bank assignment matches RH 1-3-5-7 / LH 2-4-6-8; rodLengthMm.value > crankThrowMm.value (guards the slider-crank geometry M1 depends on).
- `src/catalog/catalog.test.ts`: `catalog/stock.json` validates against `catalog/schema.json` (using `ajv`); the single entry's slotId is 'turbo'.
- `src/core/architecture.test.ts`: no file under `src/` outside `src/renderer/` imports `three` (scan file contents).
- Type check (`tsc --noEmit`) clean under `strict`.

## Acceptance criteria (Buckley verifies)

1. CI green on the PR: typecheck, all tests, build.
2. After merge (with Owner step 2 done immediately before), the deployed site serves: the new placeholder app at `/`, the legacy viewer working at `/legacy/` (engine model loads and renders), and HTTP 200 for `/Duramax_LLY_2005_66L_V8.glb`.
3. **Failure-gate proof:** on a throwaway branch, Buckley adds a deliberately failing test and opens its PR; CI goes red **and the merge is actually blocked** by branch protection. The throwaway PR is then closed unmerged. (Buckley's step during verification, not the builder's.)
4. `package-lock.json` committed; `three` resolves to exactly 0.187.0, with the other pins as listed.
5. No file outside the deliverables list is modified, except the one-line README pointer and the D-032 entry in `docs/DECISIONS.md`.

## Out of scope (do not build)

Any engine kinematics or math beyond the displacement test, any real part geometry, the GLB inside the new app, dyno/performance code, UI beyond the placeholder page, sound.

## Antigravity task prompt (owner pastes this)

> You are building Milestone 0 (Foundations) of the Duramax LLY Engine Lab in this repo clone. First read `docs/PLAN.md`, `docs/DECISIONS.md`, and the full spec at `docs/specs/M0-foundations.md` — the spec governs; where it is silent, ask rather than invent. Work on branch `m0-foundations` (create it from `main` if it doesn't exist). Implement exactly the spec's deliverables, using its exact pinned versions (three 0.187.0, vite 7.3.8, vitest 3.2.7, typescript 5.9.3, ajv 8.20.0, Node 24): the Vite + TypeScript (strict) scaffold, the frozen `src/core/interfaces.ts` exactly as typed in the spec, the placeholder config with the spec's exact values, the catalog schema + one stock entry, `docs/ASSET_CONTRACT.md`, `docs/THREE_API_NOTES.md`, and the GitHub Actions workflow including the permissions block from the spec. Preserve the legacy viewer exactly as the spec's Legacy preservation section describes (move to `public/legacy/`, GLB to `public/`, rewrite only the GLB's relative references to `../Duramax_LLY_2005_66L_V8.glb`, never touch CDN URLs or viewer features). Write the three tests at the spec's exact paths and make typecheck, tests, and build pass locally. The spec's two Owner steps (branch protection, Pages source) are repo settings — not yours; skip them. Do not build anything in the Out of scope list. When finished, commit with clear messages and push the branch; do not merge it and do not open the pull request — say what you built, what you verified locally, and anything you were unsure about.
