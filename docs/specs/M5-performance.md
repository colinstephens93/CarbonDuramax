# Milestone 5 Spec — Performance Model and Dyno

Repo: `colinstephens93/CarbonDuramax` · Branch: `m5-performance` (create from `main`, which includes Milestones 0–4 merged) · Plan reference: PLAN.md milestone 5 ("Fuel-first model, stock calibration, binding-limit display, uncertainty bands"), exit criterion: "stock build reproduces the pinned rating within a stated tolerance; the dyno names the binding limit at each RPM." Interface shapes are the frozen D-010 contract in `src/core/interfaces.ts` (`PerformanceResult`, `LimitKind`, `Build`, `PartVariant`) — this milestone implements against them, it does not change them. Budgets (D-033) still apply; M5 adds no geometry.

**Coding is done by the user in Antigravity on branch `m5-performance`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

## 1. What Milestone 5 is

1. **The fuel-first performance model** in `src/perf/` (currently a placeholder module): given a `Build` (frozen interface), it computes the steady-state full-load curve — torque, power, the binding limit at each RPM, and an uncertainty band — by the equations in §3, using part parameters resolved from the catalog (§2) and engine constants (§3.1).
2. **The stock build, fully specified:** `catalog/stock.json` grows from its single placeholder entry to the 12 stock entries (one per D-032 slot), each carrying the `performanceParams` the model reads (§2's dictionary), so the model runs end-to-end on real catalog data. The stock build is the Allison-automatic calibration: targets are the `stockRatings` already in `src/config/engineConfig.ts` (310 hp @ 3000, 605 lb-ft @ 1600, published).
3. **Calibration** (§4): the model's calibration constants are tuned so the stock curve reproduces the published peaks within the stated tolerances. Buckley's prototype of these exact equations (§11) lands at 608 lb-ft @ 1600 and 310.1 hp @ 3000, so the targets are achievable with margin.
4. **The dyno UI** (§5): a Dyno section in the control panel — an SVG curve chart with the uncertainty band and the published-rating markers, peak readouts against the ratings, and a per-RPM inspector that names the binding limit and shows the point's working numbers (fuel, boost, AFR, EGT).
5. **`docs/M5-MODEL.md`** (§7): the model's equations, every parameter with value/unit/confidence/source, the calibration record, and the known limitations.

**Non-goals for M5:** part swapping and modified variants (Milestone 6 — M5 ships the stock build only, but the model must accept any `Build` whose selections resolve, because M6 and the §6 synthetic tests drive it with non-stock parameter sets); a transmission selector (the manual-transmission ratings are not in config; Allison only); wheel horsepower (crank only, per the plan); transient behavior (spool lag over time, shift events); engine sound; any change to the 3D scene.

## 2. The stock catalog and the parameter dictionary

`catalog/stock.json` keeps its existing `turbo_stock` entry — same id, slotId, name, and notes (an M0 test asserts its presence) — **with its `performanceParams` populated** from the table below (it ships as `{}` today, which the resolver's hard-error rule would reject), and gains the other 11 stock entries. Every entry carries exactly the schema's fields (the schema is `additionalProperties: false`): `id`, `slotId`, a display `name`, `provenance: "illustrative"`, `modelPath: null`, `explodeVectorMm: [0,0,0]`, `performanceParams`, `compatibility: {}`, and optional `notes` — no extra keys. The file passes the existing schema validation unchanged. The stock build is defined in `src/perf/` as a `Build` with `buildId: "stock"`, name "Stock (Allison automatic)", and selections naming these 12 entry ids.

The model resolves a build by looking up each selection in the catalog data and reading **only** these `performanceParams` keys (all numbers; a missing key on a slot the model needs is a hard error — fail loudly, do not silently default):

| Slot (entry id) | Keys | Stock values |
|---|---|---|
| turbo (`turbo_stock`) | `boostMaxPr` (pressure-ratio capability), `spoolStartRpm`, `spoolFullRpm`, `maxAirKgS`, `compressorEff` | 2.50, 700, 1800, 0.42, 0.72 |
| tune (`tune_stock`) | `boostReqPr`, `afrMin`, `egtLimitF`, and the fuel-request knots `fuelReq1000, fuelReq1400, fuelReq1600, fuelReq2000, fuelReq2400, fuelReq2800, fuelReq3000, fuelReq3200, fuelReq3400` (mm³/stroke/cylinder) | 2.42, 19, 1450, and 78, 95, 100, 98, 95, 92, 90, 82, 76 |
| injectors (`injectors_stock`) | `maxFuelMm3` (per stroke per cylinder) | 120 |
| cp3 (`cp3_stock`) | `maxRailPsi`, `flowBaseKgH`, `flowSlopeKgHPerRpm` | 23000 (published — DieselHub LLY spec table: 23,000 psi max for 2004–2005), 30, 0.022 |
| intercooler (`intercooler_stock`) | `effectiveness` | 0.78 |
| intake (`intake_stock`) | `flowFactor` | 1.0 |
| exhaust (`exhaust_stock`) | `flowFactor` | 1.0 |
| heads (`heads_stock`) | `flowFactor` | 1.0 |
| camshaft (`camshaft_stock`) | `veFactor` | 1.0 |
| pistons (`pistons_stock`) | `compressionRatio` | 17.5 (published) |
| rods (`rods_stock`) | — (none) | `{}` — no steady-state effect; durability is outside the frozen limit taxonomy (notes say so) |
| fuelRail (`fuelRail_stock`) | — (none) | `{}` — rail volume is a transient property, not steady-state (notes say so) |

The resolver lives in `src/perf/` (e.g. `resolveBuild.ts`): M6 owns the general catalog module (`src/catalog/index.ts` stays a placeholder in M5, per its own header); the perf resolver reads `catalog/stock.json` through the same file the M0 schema test validates. Its signature is `resolveBuild(build: Build, catalog: PartVariant[] = stockCatalog): ResolvedParams` — the default catalog is the shipped `stock.json`, and tests inject modified catalog arrays through the second parameter (that is the seam the §6 synthetic tests use; they never edit the shipped file). `computeCurve(build, catalog?)` threads the same optional catalog through. An unresolvable selection id, a slot mismatch, or a missing required key throws a descriptive error. (`maxRailPsi` is a required key of the cp3 entry as catalog data, but the model does not read it — §3.2.5.)

## 3. The model

`src/perf/` exports `computeCurve(build: Build, catalog?: PartVariant[]): PerformanceResult` (the frozen shape) plus the details API for the dyno inspector (§5), with this exact shape:

```ts
export interface DynoPointDetail {
  rpm: number;
  fuelMm3: number;            // delivered fuel per stroke per cylinder (the binding Q)
  pressureRatio: number;      // delivered PR
  boostPsiGauge: number;      // (PR - 1) x 14.7
  afr: number;                // delivered-air AFR at the delivered fuel
  egtF: number;               // modeled EGT at the delivered fuel
  capsMm3: { tune: number; cp3: number; smoke: number; egt: number };
  limit: LimitKind;           // same attribution as the frozen result
  limitDetail: string;        // e.g. "fuel request", "injector flow ceiling", "AFR 19.0 at delivered boost"
}
export function computeDetails(build: Build, catalog?: PartVariant[]): DynoPointDetail[];
```

`computeDetails` runs the same computation as `computeCurve` (one shared implementation — the two must never disagree on torque/limit at a point). Pure TypeScript, no three.js, deterministic (same build → identical result).

**Grid:** RPM 1000…3400 in 100 RPM steps (25 points). Torque is the primary output; power is derived exactly: `powerHp = torqueLbFt × rpm / 5252.113`.

### 3.1 Engine constants (`src/perf/perfConfig.ts`, each a `ProvenancedValue`-style record)

- Displacement from `engineConfig` (bore/stroke — import, do not duplicate): 6.599 L.
- Fuel: lower heating value 42.5 MJ/kg (published), density 835 kg/m³ (placeholder), stoichiometric AFR 14.5 (published).
- Ambient: 101.3 kPa, 298 K (standard-day constants).
- Thermal-efficiency knots η(N) at RPM knots [1000, 1400, 1600, 2000, 2400, 2800, 3000, 3200, 3400]: [0.355, 0.364, 0.365, 0.364, 0.363, 0.362, 0.362, 0.356, 0.350] (placeholder — calibration constants; implied BSFC ≈ 0.385 lb/hp·h at the peaks, a textbook Duramax figure).
- Volumetric-efficiency knots VE(N) at the same knots: [0.88, 0.91, 0.92, 0.915, 0.90, 0.885, 0.87, 0.86, 0.85] (placeholder).
- Uncertainty: 8.0% at every point for the stock build (rule in §3.4).

All curve interpolations are linear between knots, clamped at the ends.

### 3.2 Per-point computation (in this order)

Given RPM `N` and the resolved parameters:

1. **Boost.** Spool factor `s = clamp((N − spoolStartRpm) / (spoolFullRpm − spoolStartRpm), 0, 1)`. Delivered pressure ratio `PR = 1 + (min(boostReqPr, boostMaxPr) − 1) × max(s, 0.12)` — the 0.12 floor is a deliberate guard for future grids below 1000 RPM; it never binds on this milestone's grid (s(1000) = 0.273) and does not affect any §11 number. Record `turboSaturated = boostReqPr > boostMaxPr` (used in §3.3 attribution).
2. **Manifold state.** `Pman = PR × 101.3 kPa`. Compressor outlet `Tcomp = 298 × PR^(0.4 / (1.4 × compressorEff))` K. Manifold temperature `Tman = 298 + (Tcomp − 298) × (1 − intercoolerEffectiveness)`. Density `ρ = Pman / (0.287 × Tman)` kg/m³.
3. **Air.** Undisturbed trapped air per engine cycle `mair = ρ × Vd × VE(N) × intake.flowFactor × heads.flowFactor × camshaft.veFactor × exhaust.flowFactor` (kg). Turbo flow cap: delivered air `mairDel = min(mair, maxAirKgS / (N/120))` kg/cycle; record `airCapped = mairDel < mair`.
4. **Fuel request.** `Qreq = interp(N, fuelReq knots)`, then the injector ceiling: `QreqEff = min(Qreq, injectors.maxFuelMm3)` (the ECM cannot command more than the injector flows; see §3.3 note).
5. **Fuel caps** (all in mm³/stroke/cylinder):
   - **tune:** `QreqEff`.
   - **cp3:** pump flow capacity `flowKgH = flowBaseKgH + flowSlopeKgHPerRpm × N`; injections per hour `= 240 × N`; `Qcp3 = (flowKgH / (240 N)) / 835 × 1e9`. (Steady-state reasoning: if the pump's flow suffices, rail pressure is maintained at command — flow, not the 23,000 psi ceiling, is the binding steady-state constraint. `maxRailPsi` is carried as a published datum and used in M5 only in the model doc; the doc states this assumption.)
   - **smoke:** `Qsmoke = (mairDel / 8) / afrMin / 835 × 1e9` (air per cylinder ÷ minimum AFR).
   - **egt:** the EGT model `EGT(Q) = 500 + 1050 × (Q/100) × (18 / AFR(Q))` °F, where `AFR(Q) = mairDel / (8 × Q × 8.35e-7)` (Q in mm³; 8.35e-7 kg per mm³). EGT is strictly increasing in Q; `Qegt` is the Q at which EGT = `egtLimitF`, found by bisection to ±0.1 mm³.
   - `Q = min(all four caps)`.
6. **Torque.** Fuel mass per cycle `mf = 8 × Q × 8.35e-7` kg. Efficiency `η = η(N) × f(CR) / f(17.5)` with `f(CR) = 1 − CR^(−0.35)` and CR from the pistons entry. Work per cycle `W = η × mf × 42.5e6` J. Torque `T = W / (4π)` N·m → × 0.737562 → lb-ft. Power from the identity above.

### 3.3 Binding-limit attribution

The binding limit is the cap that set `Q`, mapped to the frozen `LimitKind`:

- tune cap → `tune`. (If the injector ceiling trimmed the request — `QreqEff < Qreq` — the kind is still `tune`, and the point detail names the injector ceiling as the reason; the frozen taxonomy has no injector kind, and the request-side ceiling is a fueling-calibration property. The model doc states this explicitly.)
- cp3 cap → `cp3`; egt cap → `egt`.
- smoke cap → `smoke`, **unless** the turbo is the reason air is short — `turboSaturated` (§3.2.1) or `airCapped` (§3.2.3) — in which case → `turbo`.
- Ties (two caps equal within 0.01 mm³): the earlier in this order wins: smoke/turbo, egt, cp3, tune (physical limits outrank the request).

### 3.4 Uncertainty

`uncertaintyPct` = **8.0 at every point, for every build** — a named constant in `perfConfig.ts`, documented in M5-MODEL.md as base 5% + 3% because the model's inputs are placeholder-dominated. (The catalog carries no per-parameter confidence to condition on — `performanceParams` is a flat number record — so M5 does not pretend to evaluate a rule. Any per-variant uncertainty rule is M6's to define.)

## 4. Calibration targets (the milestone exit, made checkable)

With the stock build, `computeCurve` must produce:

- **Peak torque within ±3% of 605 lb-ft** (587–623), occurring at an RPM in **[1450, 1750]**.
- **Peak power within ±3% of 310 hp** (301–319), occurring at an RPM in **[2850, 3150]**.
- Torque at 1000 RPM ≥ 380 lb-ft (curve-shape floor — the spool region must not collapse).
- Binding limits on the stock curve: at 1000 RPM the limit is `smoke` or `turbo`; at 1600 and 3000 RPM it is `tune` (the factory fuel table defines the stock curve — the honest result for a stock calibration).

The §3 constants and the §2 stock parameters are the starting calibration (Buckley's prototype of these equations hit 608.2 @ 1600 and 310.1 @ 3000 — §11). The builder may adjust only the η/VE knot constants and the fuel-request knots, by small amounts, if their implementation of the same equations lands outside tolerance; any adjustment is recorded in `docs/M5-MODEL.md` with the achieved peaks.

## 5. Dyno UI

A **Dyno** section added to the control panel (below Views), present in both quality tiers (it is DOM/SVG only):

- **Chart:** inline SVG, panel width × ~190 px, drawn by UI code (no new dependencies). X axis: RPM 1000–3400. Two series on **fixed axis ranges** (fixed so M6's build comparisons stay honest): torque 0–700 lb-ft (left axis), power 0–350 hp (right axis), each with axis labels and light gridlines. The **uncertainty band** is a shaded region of ±`uncertaintyPct` around the power curve. **Rating markers:** a diamond at the rated coordinates in each series' own scale — (1600 RPM, 605 lb-ft) on the torque scale and (3000 RPM, 310 hp) on the power scale — labeled "rated 605" / "rated 310".
- **Peak readouts:** "Peak torque: X lb-ft @ N RPM (rated 605 @ 1600, Δ ±p%)" and the same for power.
- **Inspector:** a slider over the 25 grid points (or clicking the chart — builder's choice, slider is the floor) showing for the selected point: RPM, torque, power, **binding limit** (kind + component detail, e.g. "tune — fuel request" / "smoke — AFR 19.0 at delivered boost"), fuel mm³, boost (psi gauge, from PR: `(PR − 1) × 14.7`), AFR, EGT °F.
- **Header line:** "Stock build — Allison automatic ratings". **Footnote (exact text):** "Modeled estimates from the fuel-first performance model — educational, not measured dyno data."
- The dyno computes once on load (the stock build is fixed at M5); it does not interact with the animation, throttle, or view state. The page subtitle updates to "Milestone 5 — Performance Model & Dyno" following the established pattern.

## 6. Tests

Existing 31 tests stay green. **One sanctioned exception:** `src/catalog/catalog.test.ts` asserts `expect(stock).toHaveLength(1)` (line 26) — expanding `stock.json` to 12 entries (§2) breaks that literal assertion. That single assertion is amended to `toHaveLength(12)` as a deliberate, named part of this milestone (the schema-validation and turbo-entry assertions in the same test stay untouched); every other existing test is unmodified. New tests in `src/perf/` (≈10):

1. **Calibration:** stock peaks within §4's tolerances and RPM windows.
2. **Identity:** `powerHp[i] = torqueLbFt[i] × rpm[i] / 5252.113` to 1e-6 at every point; grid is exactly 1000…3400 step 100 (25 points); all torque/power values finite and positive.
3. **Limits:** every point's limit ∈ the frozen `LimitKind` set; stock limit at 1000 ∈ {smoke, turbo}; at 1600 and 3000 = tune.
4. **Shape:** torque at 3400 < torque at 1600; power at 3400 < power at 3000; torque at 1000 ≥ 380.
5. **Caps bind synthetically** (variants constructed in the test by passing a modified catalog array through the §2 resolver seam): (a) fuel request ×1.6 at all knots → at least one point binds `cp3` or `egt`; (b) `egtLimitF` = 900 → at least one point binds `egt`; (c) `boostMaxPr` = 1.3 with `boostReqPr` stock → at least one point at ≥ 2000 RPM binds `turbo`; (d) `flowBaseKgH` = 5 **and** `flowSlopeKgHPerRpm` = 0 → at least one point binds `cp3`. (Both cp3 keys must be overridden: with the stock slope left in place, Qcp3 stays at 117–135 mm³ and never binds — verified in pre-review.)
6. **Uncertainty:** every point = 8.0 (±0.01) on the stock build.
7. **Resolver:** the stock build resolves all 12 slots; an unknown selection id throws; a slot-mismatched entry throws.
8. **Determinism:** two calls on the stock build return deep-equal results.

## 7. `docs/M5-MODEL.md`

The model document, containing: the §3 equations in readable form; the full parameter table (every §2 value and §3.1 constant with unit, confidence, and source — published items citing DieselHub/GM Media as applicable, the rest marked placeholder); the calibration record (achieved peaks vs §4 targets, any constant adjustments from the spec's starting values); the stock curve's binding-limit narrative (which limit binds where, and why that's the honest picture); and known limitations (steady-state only; CP3 modeled as flow, rail pressure carried as datum; single-zone EGT correlation, not a thermal simulation; VE/η are calibration knots, not measured maps; uncertainty is a flat placeholder band).

## 8. Frozen files

**Frozen — no changes:** `src/core/**` (interfaces and kinematics), `src/config/**` (import `stockRatings`/engine config read-only), `src/renderer/**`, `src/catalog/index.ts`, `catalog/schema.json`, `assets-src/**`, `public/**`, `index.html` except the subtitle, `docs/` prior measurements/model docs (M2/M3/M4), and all existing tests **except the single sanctioned assertion amendment in `src/catalog/catalog.test.ts`** (§6: catalog length 1 → 12). **Changed (expected):** `src/perf/**` (new: model, resolver, config, stock build, tests), `catalog/stock.json` (expanded to 12 entries), `src/catalog/catalog.test.ts` (the one assertion), `src/ui/engineControls.ts` + a new `src/ui/dynoChart.ts` (or equivalent), `src/main.ts` (dyno wiring), `index.html` (subtitle), new `docs/M5-MODEL.md`.

## 9. Acceptance criteria (Buckley verifies from a fresh clone + deployed site)

1. **Frozen files untouched** per §8's list; `stock.json` validates against the unchanged schema; the M0 catalog test passes with exactly the one sanctioned assertion amendment (§6) and no other change.
2. Typecheck, full suite (31 + ~10 new), and build pass from a clean `npm ci`.
3. **Calibration recomputed independently:** Buckley re-runs the §6 calibration test under vitest in the fresh clone (the vite bundle is a browser artifact, not an importable module — the test output is the evidence) and confirms §4's four targets from the printed curve, not the summary.
4. **Deployed dyno:** the chart renders both curves with the band and both rating markers; peaks read within tolerance of 605/310; the inspector at 1600 names `tune`, at 1000 names smoke/turbo, and its fuel/boost/AFR/EGT values are consistent with the chart point; the footnote text is exact; the 3D engine and all M2–M4 features are unaffected.
5. `docs/M5-MODEL.md` is complete per §7, with the calibration record matching the shipped constants.

## 10. Handoff

Work on branch `m5-performance` in the local clone. When done, push the branch and send a closing summary covering: files changed, test/typecheck/build results, the achieved calibration peaks (torque/power values and RPMs), any calibration-constant adjustments from the spec's starting values, and anything that deviated from this spec. Buckley verifies, opens the PR, and merges. Local environment: Node 24; no Blender work in this milestone; no new npm dependencies.

## 11. Pre-build self-check (recorded)

Buckley prototyped §3's exact equations in Python with §2/§3.1's starting constants before writing this spec:

| RPM | Torque (lb-ft) | Power (hp) | Limit | Fuel (mm³) | EGT (°F) |
|---:|---:|---:|:--|---:|---:|
| 1000 | 431.6 | 82.2 | smoke | 73.0 | 1226 |
| 1600 | **608.2** | 185.3 | tune | 100.0 | 1376 |
| 2000 | 594.4 | 226.3 | tune | 98.0 | 1265 |
| 2400 | 574.6 | 262.6 | tune | 95.0 | 1231 |
| 3000 | 542.9 | **310.1** | tune | 90.0 | 1179 |
| 3400 | 443.2 | 286.9 | tune | 76.0 | 995 |

- Peaks: **608.2 @ 1600 (+0.5% vs 605)** and **310.1 @ 3000 (+0.03% vs 310)** — both well inside §4's ±3%, with the peaks at exactly the rated RPMs. Implied BSFC at the peaks ≈ 0.385 lb/hp·h, a textbook LLY figure — the calibration is physically coherent, not curve-fit nonsense.
- The smoke cap at 1000 RPM (73.0 mm³ delivered vs 78 requested) is the spool region behaving as a real LLY does; by 1200 RPM the tune is binding again.
- EGT peaks ≈ 1395 °F (at 1400 RPM) against the stock `egtLimitF` of 1450 — a ~55 °F margin, so the stock curve is not knife-edge on the EGT cap; the cap binds in over-fueled builds (the §6.5 tests exercise it).
- CP3 flow at the stock curve's hungriest point (3000 RPM, 90 mm³): demand ≈ 54 kg/h vs capacity ≈ 96 kg/h — comfortably non-binding stock, binding when a test build multiplies the fuel request (§6.5a/d verified in the prototype's cap structure).
- Unit discipline: §3.2's formulas were checked dimensionally (kg/cycle, mm³ via 835 kg/m³ = 8.35e-7 kg/mm³, injections/hour = 240N for an 8-cylinder 4-stroke).
