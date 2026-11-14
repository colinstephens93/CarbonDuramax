# Milestone 5 Model Documentation — Fuel-First Steady-State Performance Model & Stock Calibration

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) v2.2 (Milestone 5) · Decisions: D-007, D-008, D-010, D-012, D-013, D-014, D-015, D-016, D-017, D-032 · Spec: [`docs/specs/M5-performance.md`](./specs/M5-performance.md) · Implementation: [`src/perf/`](../src/perf/) · Catalog: [`catalog/stock.json`](../catalog/stock.json)

---

## 1. Overview & Architecture

Milestone 5 implements a pure TypeScript, steady-state, full-load **fuel-first diesel performance model** (`src/perf/`) for the 2004.5–2005 GM 6.6L Duramax LLY V8 paired with the Allison 1000 automatic transmission.

- **Headless & deterministic (D-007):** `src/perf/` imports zero Three.js or DOM APIs. Given a `Build` (`src/core/interfaces.ts`), `resolveBuild(build, catalog)` validates all 12 D-032 part slots and extracts required `performanceParams`, failing loudly if any selection is missing, slot-mismatched, or missing a required parameter key.
- **Single shared evaluator:** `computeCurve(build, catalog?)` (returning the frozen D-010 `PerformanceResult`) and `computeDetails(build, catalog?)` (returning `DynoPointDetail[]` for the UI inspector) execute one shared per-point computation over the 25-point grid `N = 1000, 1100, …, 3400 RPM`, guaranteeing exact parity between plotted curves and inspector telemetry.
- **Crank output only (D-015):** All torque and horsepower values represent steady-state flywheel (crank) output on a standard sea-level day, not chassis-dyno wheel figures.

---

## 2. Governing Equations (§3)

At each engine speed $N \in \{1000, 1100, \dots, 3400\}\text{ RPM}$, the model evaluates steps 1–6 in strict sequence. All knot curves (`fuelReq`, $\text{VE}(N)$, $\eta(N)$) use piecewise-linear interpolation between the 9 RPM knots `[1000, 1400, 1600, 2000, 2400, 2800, 3000, 3200, 3400]` with clamped endpoints.

### 2.1 Boost & VGT Spool

$$s(N) = \operatorname{clamp}\!\left(\frac{N - N_{\text{spool,start}}}{N_{\text{spool,full}} - N_{\text{spool,start}}},\; 0,\; 1\right)$$

$$\text{PR}(N) = 1 + \bigl(\min(\text{PR}_{\text{req}},\, \text{PR}_{\max}) - 1\bigr)\cdot \max(s(N),\, 0.12)$$

- The `0.12` spool-factor floor is a guard for sub-1000 RPM grids; across `1000–3400 RPM` on the stock turbo ($s(1000) = 300 / 1100 \approx 0.2727$), it never activates.
- Gauge boost reported in the inspector is $\text{Boost}_{\text{psi}} = (\text{PR} - 1) \times 14.7\text{ psi}$.
- `turboSaturated = (boostReqPr > boostMaxPr)` is recorded for binding-limit attribution (§2.7).

### 2.2 Intake Manifold State

$$P_{\text{man}} = \text{PR} \times P_{\text{amb}} \quad (\text{kPa}), \qquad P_{\text{amb}} = 101.3\text{ kPa}$$

$$T_{\text{comp}} = T_{\text{amb}} \cdot \text{PR}^{\,\frac{0.4}{1.4 \,\cdot\, \eta_{\text{comp}}}} \quad (\text{K}), \qquad T_{\text{amb}} = 298\text{ K}$$

$$T_{\text{man}} = T_{\text{amb}} + (T_{\text{comp}} - T_{\text{amb}})\cdot (1 - \varepsilon_{\text{IC}}) \quad (\text{K})$$

$$\rho_{\text{man}} = \frac{P_{\text{man}}}{0.287 \cdot T_{\text{man}}} \quad (\text{kg/m}^3)$$

### 2.3 Trapped Airflow & Compressor Choke

Swept displacement $V_d$ is derived directly from `engineConfig` (`boreMm = 103 mm`, `strokeMm = 99 mm` across 8 cylinders):

$$V_d = 8 \cdot \frac{\pi}{4} B^2 S = 0.00659917\text{ m}^3 \approx 6.599\text{ L}$$

Undisturbed trapped air mass per 4-stroke engine cycle (2 crank revolutions):

$$m_{\text{air}} = \rho_{\text{man}} \cdot V_d \cdot \text{VE}(N) \cdot f_{\text{intake}} \cdot f_{\text{heads}} \cdot f_{\text{cam,VE}} \cdot f_{\text{exhaust}} \quad (\text{kg/cycle})$$

Applying the turbocharger compressor mass-flow ceiling $\dot{m}_{\text{air,max}}$ ($\text{kg/s}$) at $N / 120$ cycles/s:

$$m_{\text{air,del}} = \min\!\left(m_{\text{air}},\; \frac{\dot{m}_{\text{air,max}}}{N / 120}\right) \quad (\text{kg/cycle})$$

- `airCapped = (mairDel < mair)` is recorded for binding-limit attribution (§2.7).

### 2.4 Fuel Request & Injector Flow Ceiling

$$Q_{\text{req}}(N) = \operatorname{interp}(N,\, \text{fuelReq knots}), \qquad Q_{\text{req,eff}}(N) = \min\!\bigl(Q_{\text{req}}(N),\, Q_{\text{inj,max}}\bigr) \quad (\text{mm}^3/\text{stroke/cyl})$$

### 2.5 Four Steady-State Fuel Caps ($\text{mm}^3/\text{stroke/cylinder}$)

With liquid fuel density $\rho_f = 835\text{ kg/m}^3$ ($m_{\text{mm}^3} = 8.35 \times 10^{-7}\text{ kg/mm}^3$):

1. **Tune / request cap (`tune`):**
   $$Q_{\text{tune}} = Q_{\text{req,eff}}(N)$$
2. **CP3 high-pressure pump flow cap (`cp3`):**
   $$\dot{m}_{\text{cp3}} = \dot{m}_{\text{base}} + k_{\text{cp3}} \cdot N \quad (\text{kg/h}), \qquad Q_{\text{cp3}} = \frac{\dot{m}_{\text{cp3}}}{240 \cdot N \cdot \rho_f} \times 10^9$$
   *(An 8-cylinder 4-stroke engine executes $8 \times 30 \cdot N = 240 N$ injections per hour. Steady-state reasoning: so long as pump mass-flow capacity exceeds total fuel mass demand, rail pressure holds its commanded target; therefore pump volumetric/mass flow — rather than the published `maxRailPsi = 23,000 psi` ceiling — is the binding steady-state constraint. `maxRailPsi` is validated and carried in the catalog as a published LLY specification datum.)*
3. **Clean-burn AFR / smoke cap (`smoke`):**
   $$Q_{\text{smoke}} = \frac{(m_{\text{air,del}} / 8)}{\text{AFR}_{\min} \cdot \rho_f} \times 10^9$$
4. **Turbine-inlet EGT cap (`egt`):**
   $$\text{AFR}(Q) = \frac{m_{\text{air,del}}}{8 \cdot Q \cdot 8.35 \times 10^{-7}}, \qquad \text{EGT}(Q) = 500 + 1050 \cdot \left(\frac{Q}{100}\right) \cdot \left(\frac{18}{\text{AFR}(Q)}\right) \;\; (^\circ\text{F})$$
   Because $\text{AFR}(Q) \propto 1/Q$, $\text{EGT}(Q)$ is strictly increasing ($\propto Q^2$) for $Q > 0$. $Q_{\text{egt}}$ is the unique root solving $\text{EGT}(Q_{\text{egt}}) = \text{EGT}_{\text{limit}}$, found by bisection to $\pm 0.01\text{ mm}^3$ (strictly within the spec's $\pm 0.1\text{ mm}^3$ tolerance).

Delivered fuel per cylinder stroke is the minimum across all four caps:

$$Q = \min(Q_{\text{tune}},\, Q_{\text{cp3}},\, Q_{\text{smoke}},\, Q_{\text{egt}})$$

### 2.6 Brake Work, Torque & Power

Total fuel mass per 8-cylinder cycle is $m_f = 8 \cdot Q \cdot 8.35 \times 10^{-7}\text{ kg}$. Brake thermal efficiency scales with piston compression ratio $\text{CR}$ relative to the stock `17.5:1` baseline:

$$f(\text{CR}) = 1 - \text{CR}^{-0.35}, \qquad \eta(N, \text{CR}) = \eta_{\text{base}}(N) \cdot \frac{f(\text{CR})}{f(17.5)}$$

With fuel lower heating value $\text{LHV} = 42.5 \times 10^6\text{ J/kg}$:

$$W_{\text{cycle}} = \eta \cdot m_f \cdot \text{LHV} \quad (\text{J}), \qquad T_{\text{Nm}} = \frac{W_{\text{cycle}}}{4\pi} \quad (\text{N}\cdot\text{m})$$

$$T_{\text{lb-ft}} = T_{\text{Nm}} \times 0.737562, \qquad P_{\text{hp}} = \frac{T_{\text{lb-ft}} \cdot N}{5252.113}$$

### 2.7 Binding-Limit Attribution & Tie-Breaking (§3.3)

The active cap setting $Q$ maps to the frozen D-010 `LimitKind` (`'smoke' | 'egt' | 'turbo' | 'cp3' | 'tune'`):

- **Tie priority:** If two or more caps lie within `0.01 mm³` of $Q$, physical constraints outrank calibration demand in strict order: **`smoke`/`turbo` $\to$ `egt` $\to$ `cp3` $\to$ `tune`**.
- **Air-shortage attribution (`smoke` vs `turbo`):** When $Q_{\text{smoke}}$ binds, the reported limit is `'smoke'` unless the turbocharger itself is capping air delivery (`turboSaturated` from $\text{PR}_{\text{req}} > \text{PR}_{\max}$ or `airCapped` from compressor mass-flow choke $m_{\text{air,del}} < m_{\text{air}}$), in which case it is attributed to `'turbo'`.
- **Injector flow ceiling (`tune`):** Because the frozen D-010 `LimitKind` taxonomy intentionally contains no separate `'injectors'` enum member and request-side pulse/nozzle sizing is part of the fueling calibration envelope, when `injectors.maxFuelMm3` trims `Qreq` (`QreqEff < Qreq`) and `QreqEff` binds, `limit` remains `'tune'` while `DynoPointDetail.limitDetail` explicitly reports `"injector flow ceiling"` (versus `"fuel request"` when untrimmed).

### 2.8 Uncertainty Band (§3.4)

`uncertaintyPct` is a flat **8.0%** at every RPM grid point (`perfConfig.uncertaintyPct.value = 8.0`), representing a **5% base model band + 3% placeholder-input allowance** because steady-state component maps (VGT spool, VE, $\eta$, EGT correlation, CP3 flow slope) are illustrative placeholders rather than instrumented engine-dyno maps. Because `PartVariant.performanceParams` is a flat numeric dictionary without per-parameter confidence metadata, M5 applies this uniform 8.0% band rather than a synthetic per-part rule.

---

## 3. Full Parameter & Constant Reference (§2 & §3.1)

### 3.1 Engine & Physical Constants (`src/perf/perfConfig.ts` & `src/config/engineConfig.ts`)

| Constant | Value | Unit | Confidence | Source |
|---|---:|---|---|---|
| Bore (`engineConfig.boreMm`) | `103` | `mm` | `published` | Rev C concept set (D01 / S1); GM 6.6L Duramax LLY spec |
| Stroke (`engineConfig.strokeMm`) | `99` | `mm` | `published` | Rev C concept set (D01 / S1); GM 6.6L Duramax LLY spec |
| Swept displacement ($V_d$) | `6.599` (`0.00659917`) | `L` (`m³`) | `published` | Derived directly from `boreMm` $\times$ `strokeMm` $\times$ 8 cylinders |
| Rated peak torque (`stockRatings`) | `605 @ 1600` | `lb-ft @ RPM` | `published` | GM Media release 2005-08-01 via The Diesel Page (Allison automatic, D-016) |
| Rated peak power (`stockRatings`) | `310 @ 3000` | `hp @ RPM` | `published` | GM Media release 2005-08-01 via The Diesel Page (Allison automatic, D-016) |
| Diesel lower heating value (`fuelLhvMjKg`) | `42.5` | `MJ/kg` | `published` | Standard No. 2 diesel lower heating value reference |
| Diesel liquid density (`fuelDensityKgM3`) | `835` | `kg/m³` | `placeholder` | Nominal diesel density (`8.35e-7 kg/mm³`) |
| Stoichiometric AFR (`stoichAfr`) | `14.5` | `ratio` | `published` | Standard diesel stoichiometric air-fuel mass ratio |
| Ambient pressure (`ambientPressureKpa`) | `101.3` | `kPa` | `published` | Standard-day sea-level atmospheric pressure |
| Ambient temperature (`ambientTempK`) | `298` | `K` | `published` | Standard-day intake ambient temperature (25 °C / 77 °F) |
| RPM knot vector (`MODEL_RPM_KNOTS`) | `[1000, 1400, 1600, 2000, 2400, 2800, 3000, 3200, 3400]` | `RPM` | `placeholder` | Milestone 5 piecewise-linear calibration grid |
| Brake thermal efficiency knots ($\eta_{\text{base}}$) | `[0.355, 0.364, 0.365, 0.364, 0.363, 0.362, 0.362, 0.356, 0.350]` | `ratio` | `placeholder` | Milestone 5 calibration constants (implies BSFC $\approx 0.385\text{ lb/(hp}\cdot\text{h)}$ at peaks) |
| Volumetric efficiency knots ($\text{VE}$) | `[0.88, 0.91, 0.92, 0.915, 0.90, 0.885, 0.87, 0.86, 0.85]` | `ratio` | `placeholder` | Milestone 5 32-valve diesel breathing calibration curve |
| Uncertainty band (`uncertaintyPct`) | `8.0` | `%` | `placeholder` | Milestone 5 flat band: 5% base + 3% placeholder-dominated input margin |

### 3.2 Stock Catalog Parameters (`catalog/stock.json`, 12 D-032 Slots)

| Slot (`entry id`) | Parameter Key | Stock Value | Unit | Confidence | Source |
|---|---|---:|---|---|---|
| `turbo` (`turbo_stock`) | `boostMaxPr` | `2.50` | `ratio` | `placeholder` | Garrett GT3788VA stock VGT pressure-ratio capability estimate |
| `turbo` (`turbo_stock`) | `spoolStartRpm` | `700` | `RPM` | `placeholder` | VGT vane-closed spool onset calibration constant |
| `turbo` (`turbo_stock`) | `spoolFullRpm` | `1800` | `RPM` | `placeholder` | Full target boost attainment RPM constant |
| `turbo` (`turbo_stock`) | `maxAirKgS` | `0.42` | `kg/s` | `placeholder` | Stock GT3788VA compressor choke mass-flow ceiling estimate |
| `turbo` (`turbo_stock`) | `compressorEff` | `0.72` | `ratio` | `placeholder` | Representative single-point adiabatic compressor efficiency |
| `tune` (`tune_stock`) | `boostReqPr` | `2.42` | `ratio` | `placeholder` | Stock full-load boost target ($\approx 20.9\text{ psi}$ gauge at full spool) |
| `tune` (`tune_stock`) | `afrMin` | `19` | `ratio` | `placeholder` | Factory clean-burn smoke-limiting minimum air-fuel ratio |
| `tune` (`tune_stock`) | `egtLimitF` | `1450` | `°F` | `placeholder` | Conservative turbine-inlet steady-state EGT ceiling |
| `tune` (`tune_stock`) | `fuelReq1000` … `fuelReq3400` | `[78, 95, 100, 98, 95, 92, 90, 82, 76]` | `mm³/stroke/cyl` | `placeholder` | Stock Allison-automatic full-load ECM torque-shaping fuel table |
| `injectors` (`injectors_stock`) | `maxFuelMm3` | `120` | `mm³/stroke/cyl` | `placeholder` | Stock Bosch solenoid injector flow ceiling per cylinder stroke |
| `cp3` (`cp3_stock`) | `maxRailPsi` | `23000` | `psi` | `published` | DieselHub 2004.5–2005 Duramax LLY spec table (`23,000 psi` max rail pressure; carried as datum) |
| `cp3` (`cp3_stock`) | `flowBaseKgH` | `30` | `kg/h` | `placeholder` | Stock Bosch CP3 steady-state pump flow intercept |
| `cp3` (`cp3_stock`) | `flowSlopeKgHPerRpm` | `0.022` | `kg/(h·RPM)` | `placeholder` | Stock Bosch CP3 cam-driven delivery slope vs engine RPM |
| `intercooler` (`intercooler_stock`) | `effectiveness` | `0.78` | `ratio` | `placeholder` | Stock air-to-air charge-air cooler heat-transfer effectiveness |
| `intake` (`intake_stock`) | `flowFactor` | `1.0` | `multiplier` | `placeholder` | Normalized stock intake tract breathing baseline |
| `exhaust` (`exhaust_stock`) | `flowFactor` | `1.0` | `multiplier` | `placeholder` | Normalized stock exhaust backpressure breathing baseline |
| `heads` (`heads_stock`) | `flowFactor` | `1.0` | `multiplier` | `placeholder` | Normalized stock 32-valve aluminum head port baseline |
| `camshaft` (`camshaft_stock`) | `veFactor` | `1.0` | `multiplier` | `placeholder` | Normalized stock camshaft volumetric-efficiency baseline |
| `pistons` (`pistons_stock`) | `compressionRatio` | `17.5` | `ratio` | `published` | Published 2004–2005 Duramax LLY static compression ratio (D-017 / DieselHub) |
| `rods` (`rods_stock`) | *(none)* | `{}` | — | `placeholder` | No steady-state effect; mechanical durability is outside frozen `LimitKind` |
| `fuelRail` (`fuelRail_stock`) | *(none)* | `{}` | — | `placeholder` | No steady-state effect; rail volume/droop are transient properties |

---

## 4. Calibration Record (§4 & §11)

**Constant adjustments from Spec §§2–3.1 starting values:** **None (`0` adjustments).** The exact equations and starting constants from `docs/specs/M5-performance.md` §§2–3.1 reproduced the published Allison-automatic peaks on the first run with ample margin inside every §4 target:

| Calibration Check (§4) | Target / Window | Achieved Value (`stockBuild`) | Error / Margin | Status |
|---|---|---|---|:-:|
| **Peak torque** | `605 lb-ft ± 3%` (`586.85–623.15 lb-ft`) | **`608.20 lb-ft`** | **`+0.53%`** (`+3.20 lb-ft`) | **PASS** |
| **Peak torque RPM** | `[1450, 1750] RPM` (rated `1600 RPM`) | **`1600 RPM`** | `0 RPM` offset | **PASS** |
| **Peak power** | `310 hp ± 3%` (`300.70–319.30 hp`) | **`310.09 hp`** | **`+0.03%`** (`+0.09 hp`) | **PASS** |
| **Peak power RPM** | `[2850, 3150] RPM` (rated `3000 RPM`) | **`3000 RPM`** | `0 RPM` offset | **PASS** |
| **Low-end spool floor (`1000 RPM`)** | `≥ 380 lb-ft` | **`431.56 lb-ft`** | `+51.56 lb-ft` margin | **PASS** |
| **Binding limit @ `1000 RPM`** | `'smoke'` or `'turbo'` | **`'smoke'`** (`72.96 mm³` vs `78.00 mm³` req) | Exact match | **PASS** |
| **Binding limit @ `1600 RPM` & `3000 RPM`** | `'tune'` at both peaks | **`'tune'`** at `1600` & **`'tune'`** at `3000` | Exact match | **PASS** |

### Selected Points Across the 25-Point Stock Curve

| RPM | Torque (`lb-ft`) | Power (`hp`) | Binding Limit | Delivered Fuel (`mm³`) | Tune Cap (`mm³`) | Smoke Cap (`mm³`) | EGT Cap (`mm³`) | CP3 Cap (`mm³`) | Boost (`psi`) | AFR | EGT (`°F`) |
|---:|---:|---:|:---|---:|---:|---:|---:|---:|---:|---:|---:|
| `1000` | `431.6` | `82.2` | `smoke` | `73.0` | `78.0` | `73.0` | `83.5` | `259.5` | `5.7` | `19.0` | `1226` |
| `1100` | `474.6` | `99.4` | `smoke` | `79.7` | `82.3` | `79.7` | `87.3` | `245.9` | `7.6` | `19.0` | `1293` |
| `1200` | `518.2` | `118.4` | `tune` | `86.5` | `86.5` | `86.5` | `90.9` | `234.5` | `9.5` | `19.0` | `1360` |
| `1400` | `576.2` | `153.6` | `tune` | `95.0` | `95.0` | `100.3` | `97.9` | `216.7` | `13.3` | `20.1` | `1395` |
| `1600` | **`608.2`** | `185.3` | `tune` | `100.0` | `100.0` | `113.5` | `104.1` | `203.3` | `17.1` | `21.6` | `1376` |
| `1800` | `601.3` | `206.1` | `tune` | `99.0` | `99.0` | `125.2` | `109.3` | `193.0` | `20.9` | `24.0` | `1279` |
| `2000` | `594.4` | `226.4` | `tune` | `98.0` | `98.0` | `124.8` | `109.2` | `184.6` | `20.9` | `24.2` | `1265` |
| `2400` | `574.6` | `262.6` | `tune` | `95.0` | `95.0` | `122.8` | `108.3` | `172.2` | `20.9` | `24.6` | `1231` |
| `3000` | `542.9` | **`310.1`** | `tune` | `90.0` | `90.0` | `118.7` | `106.5` | `159.7` | `20.9` | `25.1` | `1179` |
| `3400` | `443.2` | `286.9` | `tune` | `76.0` | `76.0` | `116.0` | `105.2` | `153.8` | `20.9` | `29.0` | `995` |

At both rated peaks (`1600 RPM` and `3000 RPM`), implied brake specific fuel consumption is $\text{BSFC} \approx 0.385\text{ lb/(hp}\cdot\text{h)}$, matching textbook direct-injection common-rail turbodiesel efficiency.

---

## 5. Stock Binding-Limit Narrative

The stock curve's binding-limit progression reflects how an OEM common-rail VGT diesel calibration actually operates:

1. **`1000–1100 RPM` — `smoke` (`AFR 19.0 at delivered boost`):** Below full VGT spool (`5.7–7.6 psi` gauge boost), trapped cylinder air mass cannot yet burn the full `78–82.3 mm³` driver-demand fuel table cleanly at `AFR ≥ 19.0`. The ECM's smoke/maf table trims fuel to `73.0 mm³` at `1000 RPM` (`431.6 lb-ft`) and `79.7 mm³` at `1100 RPM`. Because the stock turbocharger is neither boost-ceiling saturated ($\text{PR}_{\text{req}} = 2.42 \le \text{PR}_{\max} = 2.50$) nor compressor-choked ($m_{\text{air,del}} = m_{\text{air}}$), the model attributes this low-RPM air limit honestly to `'smoke'` rather than hardware turbo saturation.
2. **`1200–3400 RPM` — `tune` (`fuel request`):** By `1200 RPM` (`9.5 psi` boost), VGT boost builds enough air density for `Qsmoke` (`86.53 mm³`) to clear the `86.50 mm³` fuel request. From `1200 RPM` through `3400 RPM`, the factory ECM fuel table shapes the flat Allison-safe torque plateau (`608.2 lb-ft @ 1600 RPM`), holds peak power (`310.1 hp @ 3000 RPM`), and defuels above `3000 RPM` (`76 mm³ @ 3400 RPM`) for drivetrain and governor protection.
3. **Physical headroom on stock hardware:**
   - **EGT headroom:** Modeled EGT peaks at `1395 °F` at `1400 RPM` (just before full VGT spool catches up with rising torque fuel), retaining a `~55 °F` safety margin below the `1450 °F` ceiling. Raising fuel demand (e.g., an aftermarket tune without supporting airflow) immediately pushes $Q_{\text{tune}}$ past $Q_{\text{egt}}$ and flips the binding limit to `'egt'`.
   - **Injector & CP3 headroom:** Stock `120 mm³` injectors and the stock CP3 pump (`153.8–259.5 mm³` equivalent capacity, ~`96 kg/h` available vs ~`54 kg/h` demanded at `3000 RPM`) sit comfortably above the `100 mm³` stock peak request, reserving `'cp3'` and injector-ceiling trimming for modified high-fuel builds in Milestone 6.

---

## 6. Known Limitations

1. **Steady-state full-load only:** Transient turbocharger rotor inertia, VGT vane actuator lag, manifold filling dynamics, transmission shift events, and fuel-rail pressure droop are not modeled. `fuelRail_stock` therefore carries `{}` in steady state.
2. **CP3 modeled via mass flow, rail pressure carried as datum:** Steady-state pump adequacy is evaluated by mass-flow balance (`flowBaseKgH + flowSlopeKgHPerRpm × N`). Published maximum rail pressure (`maxRailPsi = 23,000 psi`) is validated and stored in `catalog/stock.json` as an LLY reference specification, without a separate injection-duration / rail-pressure combustion sub-model.
3. **Single-zone empirical EGT correlation:** $\text{EGT}(Q)$ is a monotonic algebraic correlation anchored to fuel quantity and trapped AFR, not a crank-angle-resolved multi-zone cylinder/manifold heat-transfer simulation; it does not explicitly model injection timing advance or EGR dilution.
4. **Calibration knots rather than measured maps:** $\text{VE}(N)$, $\eta_{\text{base}}(N)$, stock fuel-request knots, and single-scalar compressor efficiency (`0.72`) are calibrated placeholder curves chosen to reproduce published GM SAE net ratings with physically realistic airflows and BSFC, not digitized OEM ECM or Garrett compressor maps.
5. **Bottom-end durability outside `LimitKind`:** Connecting-rod bending, piston crown thermal fatigue, and head-gasket clamping limits are outside the frozen D-010 `LimitKind` taxonomy (`rods_stock` carries `{}`).
6. **Uniform placeholder uncertainty band:** `uncertaintyPct` is a constant `±8.0%` across all RPMs and builds in Milestone 5; variant-specific uncertainty conditioning is deferred to Milestone 6.
