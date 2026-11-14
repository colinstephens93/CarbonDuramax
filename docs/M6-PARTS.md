# Milestone 6 Parts Catalog & Build Comparison Documentation

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) v2.2 (Milestone 6) · Decisions: D-007, D-008, D-010, D-012, D-013, D-015, D-016, D-032, D-033 · Spec: [`docs/specs/M6-parts-catalog.md`](./specs/M6-parts-catalog.md) · Model reference: [`docs/M5-MODEL.md`](./M5-MODEL.md) · Implementation: [`src/catalog/index.ts`](../src/catalog/index.ts), [`src/ui/dynoChart.ts`](../src/ui/dynoChart.ts), [`src/ui/engineControls.ts`](../src/ui/engineControls.ts) · Catalogs: [`catalog/stock.json`](../catalog/stock.json), [`catalog/modified.json`](../catalog/modified.json)

---

## 1. Overview & Architectural Separation

Milestone 6 adds the modified aftermarket-tier parts catalog (`catalog/modified.json`, 12 entries), implements the catalog and compatibility module (`src/catalog/index.ts`), and reworks the UI (`src/ui/`) with a 12-slot **Build** configurator and a two-build **Dyno** comparison view (stock vs. modified).

- **Generic tiers only:** Every modified part uses descriptive generic hardware/calibration tier names rather than commercial brand names. All 12 modified variants carry `provenance: "illustrative"`, `modelPath: null`, and `explodeVectorMm: [0, 0, 0]`.
- **Strict layer separation (D-007, D-010):**
  - `src/perf/` is completely untouched from Milestone 5. Its resolver (`resolveBuild(build, catalog)`) performs one job: mapping a 12-slot `Build` against a `PartVariant[]` array to typed numeric model parameters, throwing on missing/unresolvable keys.
  - `src/catalog/index.ts` merges `stock.json` (12 entries) and `modified.json` (12 entries) into `fullCatalog` (24 entries), provides `variantsForSlot(slotId)`, and owns `checkCompatibility(build, catalog?)` without importing `src/perf/` or Three.js.
  - Schema validation against `catalog/schema.json` stays test-side via Ajv (`src/catalog/catalog.test.ts` and `src/catalog/modified.test.ts`), keeping Ajv out of the browser bundle.

---

## 2. Modified Variant Dictionary & Per-Parameter Rationale (`catalog/modified.json`)

Every entry in `catalog/modified.json` carries **only** the JSON Schema fields (`id`, `slotId`, `name`, `provenance`, `modelPath`, `explodeVectorMm`, `performanceParams`, `compatibility`, `notes`) and **exactly** the `performanceParams` key set required by `src/perf/resolveBuild.ts` for its slot (zero missing keys, zero extra dead keys).

`fuelRail` receives no modified variant in Milestone 6: steady-state parameters for `fuelRail` are `{}` in the fuel-first model (rail volume and pressure droop are transient properties), so the slot offers only `fuelRail_stock`. The `tune` slot offers two modified calibrations (`tune_tow` and `tune_performance`), bringing the modified file to 12 entries across 11 slots and the merged catalog to 24 entries across all 12 D-032 slots.

### 2.1 Summary Table

| Entry ID | Slot | Display Name | `performanceParams` | `compatibility` |
|---|---|---|---|---|
| `turbo_large` | `turbo` | Large Variable-Geometry Turbo | `boostMaxPr: 3.05`, `spoolStartRpm: 800`, `spoolFullRpm: 2300`, `maxAirKgS: 0.56`, `compressorEff: 0.70` | `{}` |
| `injectors_plus30` | `injectors` | High-Flow Injectors (+30%) | `maxFuelMm3: 156` | `{"requires": ["cp3_stroker"]}` |
| `cp3_stroker` | `cp3` | Stroker CP3 High-Pressure Pump | `maxRailPsi: 23000`, `flowBaseKgH: 42`, `flowSlopeKgHPerRpm: 0.030` | `{}` |
| `tune_tow` | `tune` | Tow Tune | `boostReqPr: 2.60`, `afrMin: 18.5`, `egtLimitF: 1450`, `fuelReq1000…3400: [84, 102, 108, 105, 102, 98, 96, 88, 82]` | `{}` |
| `tune_performance` | `tune` | Performance Tune | `boostReqPr: 2.90`, `afrMin: 17.5`, `egtLimitF: 1450`, `fuelReq1000…3400: [92, 112, 118, 115, 110, 110, 112, 100, 92]` | `{}` |
| `intake_highflow` | `intake` | High-Flow Intake | `flowFactor: 1.06` | `{}` |
| `exhaust_4in` | `exhaust` | 4-Inch Exhaust System | `flowFactor: 1.05` | `{}` |
| `intercooler_upgraded` | `intercooler` | Upgraded Intercooler | `effectiveness: 0.85` | `{}` |
| `heads_ported` | `heads` | Ported Cylinder Heads | `flowFactor: 1.08` | `{}` |
| `cam_performance` | `camshaft` | Performance Camshaft | `veFactor: 1.04` | `{}` |
| `pistons_lowcomp` | `pistons` | Low-Compression Forged Pistons (16.5:1) | `compressionRatio: 16.5` | `{"requires": ["turbo_large"]}` |
| `rods_forged` | `rods` | Heavy-Duty Forged Connecting Rods | `{}` | `{}` |

### 2.2 Per-Parameter Engineering Rationale

1. **`turbo_large` (`turbo` — Large Variable-Geometry Turbo):**
   - `boostMaxPr: 3.05` (vs. stock `2.50`): Supports ~`30.1 psi` gauge boost ceiling so aggressive calibrations (`boostReqPr = 2.90`, ~`27.9 psi`) are no longer clipped at the stock GT3788VA's `22.0 psi` (`2.50 PR`) ceiling.
   - `spoolStartRpm: 800`, `spoolFullRpm: 2300` (vs. stock `700` / `1800`): Larger compressor and turbine wheels carry higher rotational inertia and require greater exhaust enthalpy to reach full boost. Delaying spool onset by `100 RPM` and full-boost attainment by `500 RPM` honestly captures the low-RPM boost/smoke trade-off (`PR 1.25` vs. stock `1.39` at `1000 RPM`).
   - `maxAirKgS: 0.56` (vs. stock `0.42`): Raises compressor choke capacity by `+33%` so high-boost, high-VE top-end airflow does not hit compressor choke.
   - `compressorEff: 0.70` (vs. stock `0.72`): Slightly lower single-point adiabatic efficiency reflecting a high-pressure-ratio aftermarket wheel operating across a wider map span, making intercooler effectiveness meaningful at high boost.

2. **`injectors_plus30` (`injectors` — High-Flow Injectors (+30%)):**
   - `maxFuelMm3: 156` (vs. stock `120`): Exactly `1.30 × 120 = 156 mm³/stroke/cylinder`, representing extrude-honed `+30%` nozzles that lift the injector pulse-width/flow ceiling well clear of street/strip fuel tables while requiring stroker CP3 supply support (§3).

3. **`cp3_stroker` (`cp3` — Stroker CP3 High-Pressure Pump):**
   - `maxRailPsi: 23000` (unchanged from stock `23000`): Kept at the published `23,000 psi` LLY common-rail ceiling because a stroker CP3 modifies pump cam-ring stroke to increase volumetric displacement per revolution — it raises sustainable **fuel mass flow** at `23,000 psi` rather than raising the LLY rail-pressure sensor/regulator ceiling.
   - `flowBaseKgH: 42`, `flowSlopeKgHPerRpm: 0.030` (vs. stock `30` and `0.022`): Increases pump delivery across the RPM band by ~`37–40%` (from `104.8 kg/h` / `153.8 mm³` to `144.0 kg/h` / `211.3 mm³` at `3400 RPM`), preventing high-RPM rail starvation with `+30%` injectors.

4. **`tune_tow` (`tune` — Tow Tune):**
   - `boostReqPr: 2.60` (~`23.5 psi` requested; clipped to `2.50 PR` / `22.0 psi` on stock turbo): Requests moderate extra boost for mid-range grade-pulling air margin.
   - `afrMin: 18.5` (vs. stock `19.0`, `tune_performance` `17.5`): Slightly richer than factory `19.0` for responsive low-end torque while staying noticeably cleaner and cooler than a `17.5` street/strip smoke floor during sustained towing.
   - `egtLimitF: 1450`: Retains the conservative `1450 °F` steady-state turbine-inlet thermal ceiling essential for continuous loaded operation.
   - `fuelReq1000…3400: [84, 102, 108, 105, 102, 98, 96, 88, 82]`: Modest `+6–8 mm³` lift across the mid-range (`108 mm³` at `1600 RPM`, `96 mm³` at `3000 RPM`) tailored to Allison converter/clutch comfort under tow loads.

5. **`tune_performance` (`tune` — Performance Tune):**
   - `boostReqPr: 2.90` (~`27.9 psi` gauge): Demands high manifold density that saturates the stock turbo (`2.50 PR`) and exercises `turbo_large` (`3.05 PR`).
   - `afrMin: 17.5`: Aggressive street/strip smoke-limit floor allowing heavier fueling during spool-up at the expense of visible haze and higher EGT before boost arrives.
   - `egtLimitF: 1450`: Preserves the `1450 °F` turbine-inlet hardware safety limit so insufficient airflow manifests honestly as `'egt'` defueling rather than unbounded temperatures.
   - `fuelReq1000…3400: [92, 112, 118, 115, 110, 110, 112, 100, 92]` (**Spec §11 pre-build adjustment record**): As initially drafted prior to M6 pre-build verification, the top-end knots (`2800 / 3000 / 3200 / 3400 RPM`) were `104 / 100 / 92 / 84`. At `100 mm³` at `3000 RPM`, both the tune-only build and the full airflow build were `tune`-request-limited at `344.5 hp` (`+11.1%`), hiding the real physical benefit of upgraded airflow hardware. Raising the four top-end knots once to **`110 / 112 / 100 / 92`** puts the stock-airflow build against its `1450 °F` EGT wall at `3000 RPM` (`108.0 mm³` delivered, `'egt'`-limited, `374.3 hp @ 3100 RPM`), whereas the full airflow build lifts the `3000 RPM` EGT cap to `129.8 mm³` and delivers the full `112.0 mm³` at `1207 °F` (`385.9 hp @ 3000 RPM`, `'tune'`-limited).

6. **Breathing & Thermal Hardware (`intake_highflow`, `exhaust_4in`, `intercooler_upgraded`, `heads_ported`, `cam_performance`):**
   - `intake_highflow` (`flowFactor: 1.06`): `+6%` compressor-inlet breathing multiplier; yields `0.00%` peak gain on the fuel-limited stock tune (only lifting `1000 RPM` smoke-limited torque by `+6.0%`).
   - `exhaust_4in` (`flowFactor: 1.05`): `+5%` reduced-backpressure breathing multiplier.
   - `intercooler_upgraded` (`effectiveness: 0.85` vs. stock `0.78`): Cuts post-compressor temperature rise $(1 - \varepsilon_{\text{IC}})$ from `22%` to `15%` of $(T_{\text{comp}} - T_{\text{amb}})$, increasing manifold charge density $\rho_{\text{man}}$, particularly with `turbo_large` at `2.90 PR` and `0.70` compressor efficiency.
   - `heads_ported` (`flowFactor: 1.08`): `+8%` CNC port-flow multiplier — the largest passive breathing gain among bolt-on/long-block air parts.
   - `cam_performance` (`veFactor: 1.04`): `+4%` volumetric-efficiency multiplier across the RPM grid. Together, the four flow/VE parts multiply trapped air by $1.06 \times 1.05 \times 1.08 \times 1.04 = 1.2501$ (`+25.0%`) before boost and intercooler density gains.

7. **Bottom-End Supporting Hardware (`pistons_lowcomp`, `rods_forged`):**
   - `pistons_lowcomp` (`compressionRatio: 16.5` vs. stock `17.5`): De-lipped forged bowls reduce peak cylinder pressure under high boost, but via $f(\text{CR}) = 1 - \text{CR}^{-0.35}$ they reduce brake thermal efficiency by $1 - f(16.5)/f(17.5) \approx 1.21\%$ at equal delivered fuel, and slightly slow low-RPM clean-burn torque recovery when paired with the slower-spooling large turbo.
   - `rods_forged` (`performanceParams: {}`): Heavy-duty forged chromoly connecting rods provide mechanical bending/buckling margin outside the steady-state thermodynamic model (`LimitKind` contains no mechanical stress cap); selecting them changes no computed curve number.

---

## 3. Compatibility Encoding & Rules (`src/catalog/index.ts`)

### 3.1 Vocabulary & Checker Contract

`PartVariant.compatibility` uses the frozen D-010 shape `Record<string, string[]>` without modifying `src/core/interfaces.ts` or `catalog/schema.json`:

- **Key `"requires"`:** Array of catalog **variant IDs**, each of which must be selected in its own slot in the same `Build`.
- **Forward compatibility:** `checkCompatibility(build, catalog = fullCatalog)` inspects only `compatibility.requires` and ignores unrecognized rule keys so future rule kinds (such as exclusions) require no breaking schema changes.
- **Pure, non-throwing reporting:** `checkCompatibility` never throws and never imports `src/perf/`. Missing/unknown catalog IDs or unsatisfied `requires` entries return deterministic human-readable messages:
  - Unsatisfied dependency: `"<entry id>" requires "<required id>": select "<required name>" in the <required slotId> slot.`
  - Unknown required ID: `"<entry id>" requires unknown catalog entry "<required id>".`
  - Unknown selected ID: `Unknown catalog entry "<id>" selected for slot "<slotId>".`
- **UI gating:** When `checkCompatibility` returns one or more violations, the UI lists them live under the Build dropdowns and replaces the Dyno chart/peaks/inspector with `"This build can't be run yet:"` without calling `computeCurve` or `computeDetails`.

### 3.2 Shipped Rules & Physical Reasoning

1. **Rule 1 — `pistons_lowcomp` requires `turbo_large`:**
   - Violation message: `"pistons_lowcomp" requires "turbo_large": select "Large Variable-Geometry Turbo" in the turbo slot.`
   - Reasoning: Dropping static compression from `17.5:1` to `16.5:1` exists solely to keep peak cylinder pressures safe under high boost (`> 2.50 PR`). Paired with the stock `2.50 PR` turbo, low-compression pistons provide zero airflow or cylinder-pressure benefit and purely penalize brake thermal efficiency by `~1.2%` across the entire rev range.

2. **Rule 2 — `injectors_plus30` requires `cp3_stroker`:**
   - Violation message: `"injectors_plus30" requires "cp3_stroker": select "Stroker CP3 High-Pressure Pump" in the cp3 slot.`
   - Reasoning: `injectors_plus30` raises per-stroke injector capability to **`156 mm³/stroke/cyl`**, which exceeds what the stock CP3 pump can sustain at rated top-end speed — `cp3_stock` (`30 + 0.022 × N kg/h`) falls to **`153.8 mm³/stroke/cyl` (`~154 mm³`) at `3400 RPM`**. Any calibration that actually utilized `+30%` injector capacity at high RPM would outrun the stock pump and collapse rail pressure unless paired with `cp3_stroker` (`211.3 mm³` capacity at `3400 RPM`).

---

## 4. Measured Expected-Effects Table

All rows below were measured directly through `computeCurve(build, fullCatalog)` and `computeDetails(build, fullCatalog)` against the shipped M5 model and `catalog/modified.json`.

- **Stock reference (`stockBuild`):** Peak torque **`608.2 lb-ft @ 1600 RPM`**, peak power **`310.1 hp @ 3000 RPM`**; binding limits: `smoke` at `1000–1100 RPM`, `tune` at `1200–3400 RPM`.
- **Full build definition (row iii):** `turbo_large`, `injectors_plus30`, `cp3_stroker`, `tune_performance`, `intake_highflow`, `exhaust_4in`, `intercooler_upgraded`, `heads_ported`, `cam_performance`; stock `pistons_stock`, `rods_stock`, `fuelRail_stock`.

| Scenario | Peak Torque (`lb-ft @ RPM`, Δ vs. Stock) | Peak Power (`hp @ RPM`, Δ vs. Stock) | `@ 1000 RPM` | `@ 1600 RPM` | `@ 3000 RPM` | Binding-Limit Progression (`1000–3400 RPM`) |
|---|---|---|---|---|---|---|
| **Stock reference** | `608.2 @ 1600` (`+0.0%`) | `310.1 @ 3000` (`+0.0%`) | `smoke`, `73.0 mm³`, `PR 1.39`, `431.6 lb-ft`, `1226 °F` | `tune`, `100.0 mm³`, `PR 2.16`, `608.2 lb-ft`, `1376 °F` | `tune`, `90.0 mm³`, `PR 2.42`, `542.9 lb-ft`, `1179 °F` | `smoke` @ `1000–1100`, `tune` @ `1200–3400` |
| **(i) Intake only** (`intake_highflow`, stock tune) | `608.2 @ 1600` (**`+0.0%`**) | `310.1 @ 3000` (**`+0.0%`**) | `smoke`, `77.3 mm³`, `PR 1.39`, `457.5 lb-ft`, `1269 °F` | `tune`, `100.0 mm³`, `PR 2.16`, `608.2 lb-ft`, `1326 °F` | `tune`, `90.0 mm³`, `PR 2.42`, `542.9 lb-ft`, `1140 °F` | `smoke` @ `1000`, `tune` @ `1100–3400` |
| **(ii) Performance Tune only** (`tune_performance`, stock hardware) | `673.7 @ 1800` (**`+10.8%`**) | `374.3 @ 3100` (**`+20.7%`**) | `turbo`, `80.3 mm³`, `PR 1.41`, `475.2 lb-ft`, `1368 °F` | `egt`, `105.5 mm³`, `PR 2.23`, `641.8 lb-ft`, `1450 °F` | `egt`, `108.0 mm³`, **`PR 2.50`**, `651.5 lb-ft`, `1450 °F` | `turbo` @ `1000`, `egt` @ `1100–3000`, `tune` @ `3100–3400` |
| **(iii) Full build** (9 power/air/fuel parts, stock pistons/rods/rail) | `711.6 @ 1700` (**`+17.0%`**) | `385.9 @ 3000` (**`+24.4%`**) | `egt`, `89.4 mm³`, `PR 1.25`, `528.9 lb-ft`, `1450 °F` | `egt`, `113.9 mm³`, `PR 2.01`, `692.8 lb-ft`, `1450 °F` | `tune`, **`112.0 mm³`**, `PR 2.90`, `675.6 lb-ft`, `1207 °F` | `egt` @ `1000–1700`, `tune` @ `1800–3400` |
| **(iv) Low-comp pistons + large turbo + Perf. Tune** | `677.7 @ 2100` (**`+11.4%`**) | `381.2 @ 3000` (**`+22.9%`**) | `smoke`, `72.2 mm³`, `PR 1.25`, `422.0 lb-ft`, `1280 °F` | `egt`, `100.8 mm³`, `PR 2.01`, `605.5 lb-ft`, `1450 °F` | `tune`, `112.0 mm³`, `PR 2.90`, `667.4 lb-ft`, `1399 °F` | `smoke` @ `1000–1200`, `egt` @ `1300–2100`, `tune` @ `2200–3400` |
| **(bonus) Tow Tune only** (`tune_tow`, stock hardware) | `651.8 @ 1700` (`+7.2%`) | `330.8 @ 3000` (`+6.7%`) | `turbo`, `76.0 mm³`, `PR 1.41`, `449.5 lb-ft`, `1276 °F` | `egt`, `105.5 mm³`, `PR 2.23`, `641.8 lb-ft`, `1450 °F` | `tune`, `96.0 mm³`, `PR 2.50`, `579.1 lb-ft`, `1250 °F` | `turbo` @ `1000–1200`, `egt` @ `1300–1600`, `tune` @ `1700–3400` |

### Key Physical Takeaways

- **Fuel-first exit criterion verified (`(i)`):** Installing `intake_highflow` on the stock ECM calibration moves peak torque and peak power by **`0.00%`** (`608.2 lb-ft` and `310.1 hp`), while cooling `3000 RPM` EGT by `39 °F` (`1179 → 1140 °F`) and raising `1000 RPM` smoke-limited torque by `+6.0%` (`431.6 → 457.5 lb-ft`).
- **Tune-only hardware bottleneck (`(ii)`):** `tune_performance` on stock hardware requests `2.90 PR`, saturating `turbo_stock` (`2.50 PR` = `22.0 psi`) and hitting the `1450 °F` EGT cap from `1100` to `3000 RPM` (`108.0 mm³` delivered vs. `112.0 mm³` requested at `3000 RPM`).
- **Airflow unlocks top-end fuel (`(iii)`):** Adding the full airflow and fuel-system package raises `3000 RPM` boost to `2.90 PR` (`27.9 psi`), cools `3000 RPM` EGT to `1207 °F`, and delivers the full `112.0 mm³` fuel request (`385.9 hp`, `+24.4%`).
- **Honest spool & compression trade-offs (`(iv)`):** Pairing `pistons_lowcomp` + `turbo_large` + `tune_performance` without passive breathing bolt-ons makes *less* torque at `1000 RPM` than stock (`422.0` vs. `431.6 lb-ft`) due to later VGT spool (`2300` vs. `1800 RPM`) plus the `-1.21%` compression efficiency factor (`667.4` vs. `675.6 lb-ft` at `3000 RPM` on identical `112.0 mm³` fuel).

---

## 5. Known Limitations

1. **No 3D visual part swapping:** Every entry in `stock.json` and `modified.json` carries `modelPath: null`, and `src/renderer/` is untouched in Milestone 6. Selecting modified parts updates the compatibility checker and steady-state dyno comparison curves/readouts only, not the 3D engine geometry.
2. **Flat `±8.0%` uncertainty band on modified builds:** Milestone 5's deferred per-variant uncertainty rule remains deferred in Milestone 6. Because `PartVariant.performanceParams` is a flat numeric map without per-parameter confidence weights, `uncertaintyPct` stays a constant `8.0%` for all builds rather than widening for aftermarket combinations. Both builds share one dynamic axis pair (`computeAxisMaxima`), sized so `powerMax` always contains the `× 1.08` upper edge of the power uncertainty band.
3. **`requires`-only compatibility vocabulary:** Milestone 6 defines only the `"requires"` dependency key in `compatibility`; mutual exclusions/conflicts are not yet needed or defined.
4. **Durability & rail-volume parts have zero steady-state curve delta:** `rods_forged` and `fuelRail_stock` carry `performanceParams: {}` because mechanical rod stress and transient rail pressure droop lie outside the steady-state thermodynamic limit taxonomy (`LimitKind`).
5. **Steady-state full-load crank estimates only:** Gains reflect sea-level steady-state full-load crank output, not transient street spool-up, transmission shift recovery, or chassis-dyno wheel horsepower, and Allison automatic transmission slip/torque-capacity limits are not modeled as power caps.
