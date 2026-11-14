# Milestone 6 Spec — Parts Catalog and Build Comparison

Repo: `colinstephens93/CarbonDuramax` · Branch: `m6-parts-catalog` (create from `main`, which includes Milestones 0–5 merged) · Plan reference: PLAN.md milestone 6 ("Parts catalog and build comparison. Slot swapping, compatibility rules, stock vs. modified side by side."), exit criteria: "every catalog entry passes schema validation; an intake-only change with a stock tune shows near-zero gain." Interface shapes are the frozen D-010 contract in `src/core/interfaces.ts` (`PartVariant`, `Build`, `PartSlotId`) — this milestone implements against them, it does not change them. The performance model (M5) is not modified: M6 drives it through its existing seams (`computeCurve(build, catalog?)`, `computeDetails(build, catalog?)`, `resolveBuild(build, catalog?)`). Budgets (D-033) still apply; M6 adds no geometry.

**Coding is done by the user in Antigravity on branch `m6-parts-catalog`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

## 1. What Milestone 6 is

1. **The modified catalog:** a new file `catalog/modified.json` with 12 modified variants (§2) — one per D-032 slot except `fuelRail`, plus a second modified tune. Generic tier names only (plan decision: "Generic tiers, not brand names"). Every variant is `provenance: "illustrative"`, `modelPath: null`, `explodeVectorMm: [0,0,0]`.
2. **The catalog module:** `src/catalog/index.ts` (a placeholder since M0) is implemented (§3): it merges `stock.json` + `modified.json` into the full catalog, and owns **compatibility checking** — deliberately in the catalog layer, not in `src/perf`. The M5 resolver keeps doing exactly one job (build → parameters, hard error on unresolvable input); whether a combination of real parts is a coherent build is a catalog concern.
3. **Build comparison UI** (§4): a Build section with one dropdown per slot assembles a modified build; the Dyno section overlays stock (grey, dashed) and modified (solid) curves on one shared pair of axes, with a peaks table (stock vs. modified vs. delta) and an inspector that shows both builds at the selected RPM. While the selected combination violates a compatibility rule, the dyno shows the violations instead of curves.
4. **`docs/M6-PARTS.md`** (§7): the variant dictionary with per-parameter rationale, the compatibility rules and their reasoning, the measured expected-effects table, and known limitations.

**Non-goals for M6:** 3D visual part swapping (every variant's `modelPath` stays `null`; the renderer is frozen and untouched — selecting a variant changes numbers, not geometry); new performance-model physics (no new limits, no model changes at all); a per-variant uncertainty rule (the band stays the flat 8.0% of M5 §3.4 for every build — stated as a limitation in §7, not silently implied to be smarter than it is); manual-transmission builds; URL-shareable builds, sound (both deferred by the plan until after M6).

## 2. The modified catalog and the variant dictionary

### 2.1 Entry discipline

`catalog/modified.json` is an array of `PartVariant` entries under the same rules as `stock.json` (M5 §2): exactly the schema's fields — `id`, `slotId`, a display `name`, `provenance: "illustrative"`, `modelPath: null`, `explodeVectorMm: [0,0,0]`, `performanceParams`, `compatibility`, and `notes` — no extra keys (the schema is `additionalProperties: false`). Each variant carries **exactly the `performanceParams` keys the M5 resolver requires for its slot** (the resolver hard-errors on a missing key; extra keys would be dead data):

| Slot | Required keys (from `src/perf/resolveBuild.ts`) |
|---|---|
| turbo | `boostMaxPr`, `spoolStartRpm`, `spoolFullRpm`, `maxAirKgS`, `compressorEff` (and `spoolFullRpm > spoolStartRpm`) |
| tune | `boostReqPr`, `afrMin`, `egtLimitF`, `fuelReq1000…fuelReq3400` (the same flat nine keys as `tune_stock`) |
| injectors | `maxFuelMm3` |
| cp3 | `maxRailPsi`, `flowBaseKgH`, `flowSlopeKgHPerRpm` |
| intercooler | `effectiveness` |
| intake / exhaust / heads | `flowFactor` |
| camshaft | `veFactor` |
| pistons | `compressionRatio` |
| rods | — (none; `{}`) |

Entry order in the file: the order of the table in §2.2. Ids are unique across both files (24 distinct ids in the merged catalog).

### 2.2 The 12 variants

| Entry id | Slot | Display name | `performanceParams` |
|---|---|---|---|
| `turbo_large` | turbo | Large Variable-Geometry Turbo | `boostMaxPr` 3.05, `spoolStartRpm` 800, `spoolFullRpm` 2300, `maxAirKgS` 0.56, `compressorEff` 0.70 |
| `injectors_plus30` | injectors | High-Flow Injectors (+30%) | `maxFuelMm3` 156 |
| `cp3_stroker` | cp3 | Stroker CP3 High-Pressure Pump | `maxRailPsi` 23000, `flowBaseKgH` 42, `flowSlopeKgHPerRpm` 0.030 |
| `tune_tow` | tune | Tow Tune | `boostReqPr` 2.60, `afrMin` 18.5, `egtLimitF` 1450, fuelReq knots 84, 102, 108, 105, 102, 98, 96, 88, 82 |
| `tune_performance` | tune | Performance Tune | `boostReqPr` 2.90, `afrMin` 17.5, `egtLimitF` 1450, fuelReq knots 92, 112, 118, 115, 110, 110, **112, 100, 92** (top-end knots as adjusted in §11 — read it before writing this entry) |
| `intake_highflow` | intake | High-Flow Intake | `flowFactor` 1.06 |
| `exhaust_4in` | exhaust | 4-Inch Exhaust System | `flowFactor` 1.05 |
| `intercooler_upgraded` | intercooler | Upgraded Intercooler | `effectiveness` 0.85 |
| `heads_ported` | heads | Ported Cylinder Heads | `flowFactor` 1.08 |
| `cam_performance` | camshaft | Performance Camshaft | `veFactor` 1.04 |
| `pistons_lowcomp` | pistons | Low-Compression Forged Pistons (16.5:1) | `compressionRatio` 16.5; `compatibility: { "requires": ["turbo_large"] }` (§2.3) |
| `rods_forged` | rods | Heavy-Duty Forged Connecting Rods | `{}` (durability part — no modeled effect; the notes say so plainly) |

Fuel-request knots are listed in grid-knot order (1000, 1400, 1600, 2000, 2400, 2800, 3000, 3200, 3400) and are written into the entry as the flat keys `fuelReq1000` … `fuelReq3400`, exactly as `tune_stock` does.

**`fuelRail` gets no modified variant in M6** — it is the one slot with a single choice (the stock entry), in the UI as in the catalog. (Its steady-state parameters are `{}` in the model either way; a "high-flow rail" would be a fiction the model cannot price.)

Every variant's `notes` explains, in one or two sentences, what the part is and the effect to expect — including the honest negatives: `turbo_large` spools later (full boost at 2300 vs. 1800 RPM) and gives back low-RPM response; `pistons_lowcomp` costs efficiency at equal fuel (the model's compression factor makes 16.5:1 ≈ 1.2% less efficient than 17.5:1) and is a supporting mod for high boost, not a power part; `rods_forged` changes no number the steady-state model computes; `intake_highflow` does not move the peaks on a stock tune (§5, §11 scenario i).

### 2.3 Compatibility: the encoding and the rules

The frozen interface shapes the field as `compatibility: Record<string, string[]>` — an open map from a rule-kind key to a list of strings. **The shape can express requires-by-variant-id**; what it does not do is name the key vocabulary. M6 therefore defines the vocabulary in the catalog layer (this spec, §3, and `docs/M6-PARTS.md`), with no interface or schema change (the schema already types `compatibility` as an object of string arrays):

- **Key `"requires"`** — the value is a list of **variant ids** (e.g. `"turbo_large"`), each of which must be the current selection for its own slot in the same build.
- M6 defines no other key. A checker encountering any other key ignores it (forward-compatible with future rule kinds, e.g. exclusions — none are defined or implied in M6).

Two rules ship in the data:

1. **`pistons_lowcomp` requires `turbo_large`.** Low-compression pistons on the stock turbo only cost efficiency (§11 scenario iv shows the cost at 1000–1600 RPM even *with* the big turbo fitted); the catalog treats them as a supporting mod for a high-boost build and refuses the incoherent combination.
2. **`injectors_plus30` requires `cp3_stroker`.** The +30% injectors raise the per-stroke ceiling to 156 mm³, at/above what the stock CP3 sustains at high RPM — its steady-state flow cap falls to ≈154 mm³ at 3400 RPM (M5 §11 cap structure) — so any tune that actually used the injectors would starve the rail at the top end. The stroker pump is the supporting mod.

All other entries (stock and modified) carry `compatibility: {}` except `pistons_lowcomp` (`{"requires": ["turbo_large"]}`) and `injectors_plus30` (`{"requires": ["cp3_stroker"]}`).

## 3. The catalog module (`src/catalog/index.ts`)

Implemented with exactly this public surface (pure TypeScript, no three.js, no new dependencies):

```ts
import type { Build, PartSlotId, PartVariant } from '../core/interfaces';

export const fullCatalog: PartVariant[];              // stock.json entries (file order), then modified.json entries (file order); 24 entries
export function variantsForSlot(slotId: PartSlotId): PartVariant[];   // fullCatalog filtered by slot, catalog order (stock first)
export function checkCompatibility(build: Build, catalog?: readonly PartVariant[]): string[];
```

- `fullCatalog` is built by importing the two JSON files the same way `src/perf/stockBuild.ts` imports `stock.json`. It is data, not a copy: the entries are the JSON objects typed as `PartVariant[]`.
- **Schema validation is test-side**, following the existing pattern of `src/catalog/catalog.test.ts` (Ajv + `node:fs` in the test, §6) — the app bundle does not gain Ajv, and no runtime validation is added. The §6 tests validate each file and the merged 24-entry array against the unchanged `catalog/schema.json`.
- `checkCompatibility(build, catalog = fullCatalog)` returns human-readable violation strings; an empty array means the build is coherent. It reads **only** the `compatibility.requires` lists of the selected entries (data-driven: adding a rule means editing catalog data, never this function). For each selected entry, for each id in its `requires` list:
  - if no catalog entry has that id → violation: `"<entry id>" requires unknown catalog entry "<required id>".`
  - else if the build's selection for the required entry's slot is not that id → violation, exactly this template: `"<entry id>" requires "<required id>": select "<required name>" in the <required slotId> slot.` — e.g. `"pistons_lowcomp" requires "turbo_large": select "Large Variable-Geometry Turbo" in the turbo slot.` (The template deliberately names both ids and the required part's display name, so UI text and tests can rely on it.)
  - if a selection id itself is not in the catalog → violation: `Unknown catalog entry "<id>" selected for slot "<slotId>".` (Defensive: the UI cannot produce this, but the checker never throws on bad input — it reports.)
- `checkCompatibility` never throws and never imports `src/perf`. Resolving/running a build remains the resolver's job; the UI (§4) checks compatibility *before* computing curves and does not call the model for an incoherent build.

## 4. Build comparison UI (`src/ui`)

### 4.1 The Build section

A **Build** section in the control panel, directly above the Dyno section, present in both quality tiers (DOM only, like the Dyno):

- Twelve dropdowns, one per slot, in the D-032 order used by `ALL_PART_SLOTS` (`turbo, injectors, cp3, intake, exhaust, intercooler, tune, pistons, rods, camshaft, heads, fuelRail`), each labeled with its slot display name: Turbo, Injectors, CP3, Intake, Exhaust, Intercooler, Tune, Pistons, Rods, Camshaft, Heads, Fuel Rail.
- Each dropdown's options come from `variantsForSlot(slotId)` — option value = entry id, option text = entry `name`. The Fuel Rail dropdown has exactly one option (the stock entry), per §2.2.
- Every dropdown **defaults to the stock variant** of its slot, so the initial modified build *is* the stock build and the dyno opens in the M5 state (identical curves, zero deltas).
- On any change, the UI assembles `Build { buildId: "modified", name: "Modified build", selections }` from the twelve current values, runs `checkCompatibility` (§3), and either pushes the violations into the Dyno section (§4.5) or computes the modified curve + details via `computeCurve(build, fullCatalog)` / `computeDetails(build, fullCatalog)` and pushes them into the Dyno section (§4.2). The stock curve/details are computed once on load exactly as in M5 and never recomputed.
- Violations, when any exist, are also listed in the Build section under the dropdowns, live, as they change.

### 4.2 The Dyno section, reworked for two builds

`createDynoSection` keeps its M5 structure (SVG chart, peaks, inspector, footnote) and grows a two-build contract:

```ts
export interface DynoBuildData {
  readonly curve: PerformanceResult;
  readonly details: readonly DynoPointDetail[];
}
export interface DynoComparisonData {
  readonly stock: DynoBuildData;
  readonly modified: DynoBuildData;
  readonly ratings: StockRatings;
}
// DynoSectionHandle gains:
setModifiedBuild(data: DynoBuildData | null, violations: readonly string[]): void;
```

- **Wiring:** `createDynoSection`'s argument type changes from the current `DynoUiData` to `DynoComparisonData` above, and `main.ts` and `EngineUiOptions.dyno` are updated to pass `{ stock, modified, ratings }` accordingly (the initial `modified` is the stock-equivalent build from the default all-stock selections; later selection changes flow through `setModifiedBuild`). The SVG chart's `aria-label` is generated from the computed axis maxima, not hardcoded, so it stays correct when the axes extend.
- **Series:** four polylines on the M5 scales — stock torque and stock power in grey (`#94a3b8`) with `stroke-dasharray` (dashed), modified torque and modified power in the M5 series colors (`#38bdf8` / `#fb923c`), solid, drawn over the stock pair. The ±uncertainty band follows the **modified** build's power curve (at the default all-stock selection it coincides with the stock curve, as in M5). A legend row under the header names the two builds: a grey dashed sample labeled "Stock" and solid color samples labeled "Modified".
- **Shared axes — amendment to M5 §5.** M5 fixed the axes at 0–700 lb-ft / 0–350 hp "so M6's build comparisons stay honest." M6 keeps the honesty property (both builds always share **one** scale — never per-build scales) but amends the fixed *values*: they were sized for the stock build, and §11's full build (711.6 lb-ft / 385.9 hp) would clip. Rule: the maxima start at the M5 values and extend in clean steps until they cover both builds' peaks:
  - `torqueMax` = the smallest multiple of 100 that is ≥ max(700, the higher of the two builds' peak torque);
  - `powerMax` = the smallest multiple of 50 that is ≥ max(350, the higher of the two builds' peak power × 1.08) — the power axis must contain not just the curves but the ±8% uncertainty band drawn around the power curve (the band follows the modified build; covering the larger of the two builds' banded peaks covers both).
  The band is part of the chart's data, so the axis must contain it — a clipped band would misstate the uncertainty at exactly the peak.
  Implement this as an exported pure function `computeAxisMaxima(curves: readonly PerformanceResult[]): { torqueMax: number; powerMax: number }` in `dynoChart.ts` (unit-tested, §6). Consequences to expect: default/stock-like builds keep 700/350; the Performance-Tune-only build keeps torque at 700 and extends power to **450** (374.3 × 1.08 = 404.2 → 450); the full build extends to **800 / 450** (torque 711.6 → 800; 385.9 × 1.08 = 416.8 → 450). Gridlines and tick labels derive from the current maxima in five equal steps, as the M5 code already derives them from its constants. The rating markers stay, at the rated coordinates, on whatever scale is current.
- **Header line (exact text):** "Stock vs. modified build — Allison automatic ratings".
- **Footnote:** unchanged, the exact M5 text: "Modeled estimates from the fuel-first performance model — educational, not measured dyno data."
- The page subtitle becomes "Milestone 6 — Parts Catalog & Build Comparison" (same one-line pattern as M5 in `engineControls.ts`).
- The inspector slider selection (RPM) is preserved across modified-build changes.

### 4.3 Peaks table

The M5 peak readouts become a two-build comparison, one line per quantity, in this format:

```
Peak torque: Stock 608.2 lb-ft @ 1600 RPM · Modified 711.6 lb-ft @ 1700 RPM · Δ +103.4 lb-ft (+17.0%)
Peak power: Stock 310.1 hp @ 3000 RPM · Modified 385.9 hp @ 3000 RPM · Δ +75.8 hp (+24.4%)
```

(Absolute delta with sign and one decimal, then the percentage delta against stock in parentheses, reusing the M5 delta formatter's conventions; at the default selection both deltas read +0.0 / +0.0%.)

### 4.4 Inspector

The M5 inspector, extended at the selected RPM:

- **Modified build:** torque and power, each shown with its delta vs. stock at that RPM; the binding limit (kind + detail, M5 badge colors); and the full M5 detail set — fuel mm³, boost psi, AFR, EGT °F.
- **Stock build at the same RPM:** one summary line — torque, power, and binding limit (kind + detail), e.g. "Stock @ 3000 RPM: 542.9 lb-ft · 310.1 hp · tune — fuel request".
- `DynoSectionHandle.getSelectedDetail()` returns the **modified** build's detail when a valid modified build is displayed, otherwise the stock build's — `engineControls`' existing `getDynoSelectedPoint()` keeps its meaning ("the point the dyno is showing").

### 4.5 Violation state

While `checkCompatibility` returns a non-empty list for the current selections, the Dyno section replaces the chart, peaks table, and inspector with a message block: the heading "This build can't be run yet:" followed by the violation strings, one per line. Header and footnote remain. The model is not called for an incoherent build (its resolver would happily compute one — coherence is the catalog layer's call, §3). Clearing the last violation (selecting the required part) restores the curves immediately.

## 5. Expected behavior (the milestone exit, made checkable)

All numbers below were measured with the shipped M5 model against §2's exact parameters before this spec was written (§11 has the full record, including the one parameter adjustment). With the shipped `modified.json`:

- **Intake-only** (`intake_highflow`, everything else stock, stock tune): peak torque and peak power deltas vs. stock both within **±2%** — measured **0.00% / 0.00%** (peaks are fuel-request-limited; §11 records the one pointwise exception, +6.0% torque at 1000 RPM where extra air loosens the smoke cap). This is the plan's exit criterion, and the honest result.
- **Performance-Tune-only** (`tune_performance`, stock hardware): peak power **≥ +15%** vs. stock (measured **+20.7%**, 374.3 hp @ 3100); the stock turbo caps delivered boost — delivered PR at 3000 RPM is **2.50** (boost 22.0 psi) against a 2.90 request; the binding limit at 3000 RPM is **`egt`** (stock: `tune`), and at 1000 RPM **`turbo`**.
- **Full build** (`turbo_large` + `injectors_plus30` + `cp3_stroker` + `tune_performance` + `intake_highflow` + `exhaust_4in` + `intercooler_upgraded` + `heads_ported` + `cam_performance`; pistons, rods, fuel rail stock): peak power **≥ +15%** (measured **+24.4%**, 385.9 hp @ 3000) and peak torque **≥ +10%** (measured **+17.0%**, 711.6 lb-ft @ 1700); at 3000 RPM the limit is `tune` with the full 112 mm³ delivered and EGT ≈ 1207 °F — the airflow parts lift the EGT wall that caps the tune-only build at the same RPM (1450 °F, 108.0 mm³).
- **Compatibility:** the full build above plus `pistons_lowcomp` (with `turbo_large` selected) and `rods_forged` has **zero** violations; `pistons_lowcomp` with the stock turbo yields exactly the §2.3 rule-1 violation; `injectors_plus30` with the stock CP3 yields exactly the rule-2 violation; the stock build yields none.

## 6. Tests

Existing 43 tests stay green and **unmodified** (including the `toHaveLength(12)` stock assertion — `stock.json` is frozen in M6). New tests (≈10) in `src/catalog/` and, for the model-behavior assertions, driving `computeCurve`/`computeDetails` through the catalog seam:

1. **Schema:** `catalog/modified.json` validates against the unchanged `catalog/schema.json` (Ajv, same pattern as `catalog.test.ts`); the merged `fullCatalog` (24 entries) validates as one array; all 24 ids are unique.
2. **Coverage:** `fullCatalog` has 24 entries; every one of the 12 slots has its stock entry; `variantsForSlot` returns ≥ 2 entries for every slot except `fuelRail`, which returns exactly 1.
3. **Resolver seam (the strongest catalog check):** for **each** of the 12 modified variants, a build selecting it (stock elsewhere) passes `resolveBuild(build, fullCatalog)` without throwing — this proves every variant carries its slot's required `performanceParams` keys; and one build selecting a modified variant in every slot that has one (tune slot: `tune_performance`) also resolves. Additionally, each variant's `performanceParams` key set must **equal** its slot's stock entry's key set (sorted-array equality — no missing keys, no extra keys), making §2.1's "exactly the required keys" discipline enforceable rather than aspirational (the resolver alone would not catch an extra dead key).
4. **Intake-only near-zero:** peaks within ±2% of stock's, at the same RPMs (§5).
5. **Tune-only caps:** peak power ≥ +15% vs. stock; `computeDetails` at 3000 RPM shows `pressureRatio` = 2.50 ± 0.01 and `limit` = `egt`; at 1000 RPM `limit` = `turbo`.
6. **Full-build gains:** peak power ≥ +15% and peak torque ≥ +10% vs. stock; at 3000 RPM `limit` = `tune`, delivered fuel = 112 ± 0.5 mm³, EGT ≤ 1300 °F.
7. **Compatibility:** `pistons_lowcomp` + stock turbo → exactly 1 violation, **exactly equal** (full-string equality, not substring containment) to the §3 template instance `"pistons_lowcomp" requires "turbo_large": select "Large Variable-Geometry Turbo" in the turbo slot.`; `injectors_plus30` + stock CP3 → exactly 1 violation, containing `injectors_plus30` and `cp3_stroker`; full build (test 3's build + `pistons_lowcomp` + `rods_forged`) → `[]`; stock build → `[]`; a build with an unknown selection id → a violation naming the id (checker reports, never throws).
8. **Stock unchanged through the big catalog:** `computeCurve(stockBuild, fullCatalog)` deep-equals `computeCurve(stockBuild)` (M5 default catalog) — merging the modified file cannot perturb the stock result.
9. **Axis maxima (pure):** all three cases pinned — `computeAxisMaxima([stockCurve])` → `{ torqueMax: 700, powerMax: 350 }`; `computeAxisMaxima([stockCurve, tuneOnlyCurve])` → `{ torqueMax: 700, powerMax: 450 }` (the tune-only peak 374.3 under its ±8% band reaches 404.2, so the power axis must extend past 400 to contain the band); `computeAxisMaxima([stockCurve, fullBuildCurve])` → `{ torqueMax: 800, powerMax: 450 }`.
10. **Determinism:** two `computeCurve` calls on the full build with `fullCatalog` return deep-equal results.

## 7. `docs/M6-PARTS.md`

The parts document, containing: the §2.2 variant dictionary with **rationale per parameter** (why 3.05 PR and a 2300 RPM spool-full for the large turbo; why the stroker CP3 keeps `maxRailPsi` at the published 23,000 — it raises flow, not the LLY rail-pressure ceiling; why the tow tune's AFR floor is 18.5 vs. the performance tune's 17.5; the §11 adjustment record for `tune_performance`'s top-end knots); the compatibility encoding (`requires` key, §2.3) and both rules with their reasoning, including the CP3 flow-cap number behind rule 2; the measured expected-effects table (§11's scenarios, peaks/deltas/limits); and known limitations: **no 3D visual swapping** — `modelPath` is `null` for every variant and the renderer never learns about builds in M6; the compatibility vocabulary is `requires` only (no exclusions/conflicts yet); uncertainty stays a flat 8.0% for modified builds (M5 §3.4's deferred per-variant rule remains deferred — the band does not widen for modified builds, and the doc says so); rods and fuelRail variants change no modeled number; gains are steady-state full-load only.

## 8. Frozen files

**Frozen — no changes:** `src/core/**`, `src/config/**` (import read-only), `src/renderer/**`, `src/perf/model.ts`, `src/perf/perfConfig.ts`, `src/perf/resolveBuild.ts`, `src/perf/stockBuild.ts`, `catalog/stock.json`, `catalog/schema.json`, `assets-src/**`, `public/**`, all existing tests, and prior `docs/` (PLAN, DECISIONS, measurements, M5-MODEL). **Changed (expected):** `catalog/modified.json` (new), `src/catalog/index.ts` (implemented), new tests under `src/catalog/` (and model-behavior tests may live in `src/catalog/` or `src/perf/` as new files only), `src/ui/dynoChart.ts` (two-build rework per §4.2), `src/ui/engineControls.ts` (Build section, wiring, subtitle), `src/ui/index.ts` / `src/main.ts` (only as needed to wire the catalog data in), `index.html` (only if the subtitle pattern requires it), new `docs/M6-PARTS.md`. `src/perf/index.ts` may gain export additions only if the UI/tests genuinely need a symbol it doesn't already export — none is expected (the model API is already public). If you believe any other frozen file must change, stop and report it instead of changing it.

## 9. Acceptance criteria (Buckley verifies from a fresh clone + deployed site)

1. **Frozen files untouched** per §8's list; `modified.json` + merged catalog validate against the unchanged schema; the M0/M5 catalog tests pass unmodified.
2. Typecheck, full suite (43 + ~10 new), and build pass from a clean `npm ci`.
3. **Scenario table recomputed independently:** Buckley re-runs all six §11 rows against the *shipped* `catalog/modified.json` through the catalog seam in a fresh clone (a scratch vitest harness, deleted after) — the stock reference row, (i) intake-only, (ii) Performance-Tune-only, (iii) the full build, (iv) low-comp pistons + large turbo + Performance Tune, and the tow-tune-only row — and confirms the peaks, deltas, and 1000/1600/3000 limits match §11 within rounding — from the printed output, not the summary.
4. **Deployed comparison:** the app opens with the dyno in the M5 state (identical curves, zero deltas, 700/350 axes); selecting Performance Tune alone updates the peaks (374.3 hp class) and extends the power axis to 450; selecting the §5 full build extends the axes to 800/450 and shows 711.6 / 385.9-class peaks; selecting Low-Compression pistons *without* the large turbo replaces the curves with the rule-1 violation, and selecting the large turbo restores them; the header, footnote, subtitle, 3D engine, and all M2–M5 features are unaffected.
5. `docs/M6-PARTS.md` is complete per §7, with its effects table matching §11.

## 10. Handoff

Work on branch `m6-parts-catalog` in the local clone. When done, push the branch and send a closing summary covering: files changed, test/typecheck/build results, the four §5 scenarios as measured in your build (peaks and deltas), and anything that deviated from this spec. Buckley verifies, opens the PR, and merges. Local environment: Node 24; no Blender work in this milestone; no new npm dependencies.

## 11. Pre-build self-check (recorded)

Buckley ran §2's exact parameters through the shipped M5 model (scratch vitest harness in a verification clone, deleted after) before writing this spec. Stock reference: **608.2 lb-ft @ 1600, 310.1 hp @ 3000**; stock limits: smoke @ 1000, tune elsewhere.

| Scenario | Peak torque | Peak power | @1000 | @1600 | @3000 |
|---|---|---|---|---|---|
| (i) Intake only | 608.2 @ 1600 (**+0.0%**) | 310.1 @ 3000 (**+0.0%**) | smoke, 77.3 mm³, T 457.5 | tune, 100.0 mm³, T 608.2 | tune, 90.0 mm³, T 542.9 |
| (ii) Performance Tune only | 673.7 @ 1800 (**+10.8%**) | 374.3 @ 3100 (**+20.7%**) | turbo, 80.3 mm³, PR 1.41 | egt, 105.5 mm³, EGT 1450 °F | egt, 108.0 mm³, PR **2.50**, EGT 1450 °F |
| (iii) Full build | 711.6 @ 1700 (**+17.0%**) | 385.9 @ 3000 (**+24.4%**) | egt, 89.4 mm³, PR 1.25 | egt, 113.9 mm³, EGT 1450 °F | tune, 112.0 mm³, PR 2.90, EGT 1207 °F |
| (iv) Low-comp pistons + large turbo + Perf. Tune | 677.7 @ 2100 (**+11.4%**) | 381.2 @ 3000 (**+22.9%**) | smoke, 72.2 mm³, T 422.0 | egt, 100.8 mm³, T 605.5 | tune, 112.0 mm³, PR 2.90, T 667.4 |
| (bonus) Tow Tune only | 651.8 @ 1700 (+7.2%) | 330.8 @ 3000 (+6.7%) | turbo, 76.0 mm³ | egt, 105.5 mm³ | tune, 96.0 mm³, PR 2.50 |

Binding-limit rows: (i) smoke @ 1000, tune @ 1100–3400 (the extra air lifts the 1100 RPM smoke cap above the request — the stock curve is smoke-limited at 1100 too); (ii) turbo @ 1000, **egt @ 1100–3000**, tune @ 3100–3400; (iii) egt @ 1000–1700, tune @ 1800–3400; (iv) smoke @ 1000–1200, egt @ 1300–2100, tune @ 2200–3400.

- **The exit criterion is exact, not approximate:** the intake-only peaks move by 0.00% — the stock curve's peaks are fuel-request-limited, so airflow the tune never asks for buys nothing there. The single pointwise exception is 1000 RPM (+6.0% torque, 457.5 vs. 431.6), where the build *is* smoke-limited and the smoke cap is an air quantity. §5/§6 test the peaks (what "gain" means in the plan) and this note records the exception so nobody "fixes" it later.
- **One parameter adjustment was made, and it is part of this spec.** As first drafted, `tune_performance`'s top-end fuel knots were 104 / 100 / 92 / 84 (2800 / 3000 / 3200 / 3400). With them, the full build's peak power measured **344.5 hp (+11.1%) — identical to the tune-only build's**, because at 3000 RPM both builds were tune-request-limited at the same delivered 100 mm³ with the same compression ratio: airflow hardware cannot raise power at a point where the fuel request is the binding cap. The knots were raised once, to **110 / 112 / 100 / 92**, putting the *stock-airflow* path against its EGT ceiling at the top end (tune-only delivers 108.0 mm³ at 3000, EGT-capped) while the full build's airflow lifts its EGT cap to 129.8 mm³ and delivers the full 112. That is the physically honest differentiation — a tune alone runs into heat; the hardware build's advantage is precisely that it moves the heat wall — and it is why §2.2's table carries the raised knots. No other parameter was adjusted.
- **Compatibility shape check:** `PartVariant.compatibility` is `Record<string, string[]>` in the frozen interface and an object of string arrays in the schema — requires-by-variant-id fits it directly under the `"requires"` key (§2.3). No interface change, no schema change, and the perf resolver never reads the field.
- **Numbers worth trusting:** scenario (iv) at 1000 RPM makes *less* torque than stock (422.0 vs. 431.6) — late spool plus the compression penalty — and at 3000 it trails the full build by exactly the compression factor (667.4 vs. 675.6 lb-ft at identical 112 mm³ fuel). The model is behaving like the physics it encodes, which is what makes the comparison UI worth having.
