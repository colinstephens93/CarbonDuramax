# Milestone 7 Verified LLY Data, Derivations & Provenance Register

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) (Milestone 7) · Decisions: D-010, D-011, D-012, D-028, D-035 · Spec: [`docs/specs/M7-verified-data.md`](./specs/M7-verified-data.md) · Source survey: [`docs/research/L7-verified-data-survey.md`](./research/L7-verified-data-survey.md)

**Provenance & grading conventions:**
- **Survey reliability grades** (from [`docs/research/L7-verified-data-survey.md`](./research/L7-verified-data-survey.md)): **A** = GM service literature / faithful mirror of GM service text; **B** = established diesel publication or OE-parts manufacturer publishing OE specs (DieselHub, MotorTrend/DrivingLine, MAHLE Original, UEM, ZZ Diesel); **C** = specialist vendor spec page publishing dimensions its parts must match (Callies, Manley, BoostLine/Wiseco, Manton, Edelbrock, DuramaxTuner/Calibrated Power, Dynomite Diesel).
- **Config `confidence` vocabulary** (D-010; [`src/core/interfaces.ts`](../src/core/interfaces.ts) frozen): `'verified' | 'published' | 'placeholder'`. Values computed by exact arithmetic on published inputs carry `confidence: 'published'` with `"derived:"` at the start of `source` naming both inputs (D-012).

---

## 1. Verified & Derived Data Adopted at Milestone 7 (Spec §2)

### 1.1 Upgraded & Added `published` Dimensions

| Config File & Field | Old Value & Confidence | M7 Value | Unit | M7 `confidence` | Survey Source(s) | Grade | Survey § |
| --- | --- | ---: | --- | --- | --- | :---: | :---: |
| `engineConfig.rodLengthMm` | `163.0` (`placeholder`) | **163.0** | `mm` | `published` | Manley `6.417 in` (`162.99 mm`), BoostLine `6.418 in` (`163.02 mm`), Callies `6.418 in`, UEM `163.000 mm` — four independent sources converge | **B + C** | §1 |
| `engineConfig.crankThrowMm` | `49.5` (`placeholder`) | **49.5** | `mm` | `published` *(derived)* | Half of published `99.0 mm` (`3.897 in`) stroke (DieselHub; GM Authority; XDP; Callies `3.898 in`) | **B + C** | §6 |
| `valveConfig.lobeLift` *(new)* | — *(replaced `maxLift: 12`)* | **7.14** | `mm` | `published` | GM LLY service literature (via `dieselmechanic.info` mirror): intake & exhaust cam lobe lift `0.281 ± 0.002 in` (`0.281 × 25.4 = 7.1374 mm`) | **A** | §4 |
| `valveConfig.rockerRatioIntake` *(new)* | — | **1.36** | `ratio` | `published` | Callies factory-ratio Duramax cam table (`2001–2016`): `1.36:1` intake rocker ratio, corroborated by forum consensus | **C** | §9 |
| `valveConfig.rockerRatioExhaust` *(new)* | — | **1.69** | `ratio` | `published` | Callies factory-ratio Duramax cam table (`2001–2016`): `1.69:1` exhaust rocker ratio (matches MotorTrend L5P exhaust check) | **C** | §9 |
| `valveConfig.intakeMaxLift` *(new)* | `12` (`maxLift`, `placeholder`) | **9.7** | `mm` | `published` *(derived)* | `lobeLift (7.14 mm) × rockerRatioIntake (1.36) = 9.71 mm` (`0.281 in × 1.36 = 0.382 in = 9.707 mm`) | **A × C** | §4, §9 |
| `valveConfig.exhaustMaxLift` *(new)* | `12` (`maxLift`, `placeholder`) | **12.1** | `mm` | `published` *(derived)* | `lobeLift (7.14 mm) × rockerRatioExhaust (1.69) = 12.07 mm` (`0.281 in × 1.69 = 0.475 in = 12.062 mm`) | **A × C** | §4, §9 |
| `detailConfig.pistonCompressionHeightMm` | `52` (`placeholder`) | **49.8** | `mm` | `published` | MAHLE Original (OE supplier, `224-3451` / `224-3452`) LB7/LLY compression height `1.961 in` (`49.81 mm`); UEM `1.96 in / 49.8 mm` agrees | **B** | §8 |
| `detailConfig.wristPinDiameterMm` | `33` (`placeholder`) | **34.5** | `mm` | `published` | MAHLE OE, UEM, Speed of Air, BoostLine: floating offset wrist pin `1.358 in` (`34.49 mm`) | **B + C** | §8 |
| `detailConfig.pinJournalDiameterMm` | `60` (`placeholder`) | **62.9** | `mm` | `published` | Callies `2.477 in`, BoostLine `2.476 in`, MotorTrend L5P teardown noting pre-L5P rod journal `2.4764 in` (`62.901 mm`) | **B + C** | §6 |
| `detailConfig.mainJournalDiameterMm` *(new)* | — *(was `1.08 × pin` = `64.8`)* | **79.9** | `mm` | `published` | Callies OEM-dimension cranks `3.146 in` (`79.91 mm`); MotorTrend L5P teardown corroborates `3.1464 in` carried over from prior Duramax gens | **B + C** | §6 |
| `detailConfig.valveIntakeHeadMm` | `38` (`placeholder`) | **33.0** | `mm` | `published` | ZZ Diesel OE GM part-number data `1.299 in` (`32.99 mm`); Edelbrock stock-valvetrain Duramax head `33 mm` | **B/C + C** | §5 |
| `detailConfig.valveExhaustHeadMm` | `35` (`placeholder`) | **31.0** | `mm` | `published` | ZZ Diesel OE GM part-number data `1.220 in` (`30.99 mm`); Edelbrock stock-valvetrain Duramax head `31 mm` | **B/C + C** | §5 |
| `detailConfig.valveStemMm` | `7` (`placeholder`) | **7** | `mm` | `published` | Edelbrock stock-valvetrain-compatible Duramax head spec: `7.0 mm` valve stem | **C** | §5 |
| `detailConfig.pushrodDiameterMm` | `9` (`placeholder`) | **11.1** | `mm` | `published` | Manton stock-replacement Duramax pushrod: `7/16 in` (`11.11 mm`) diameter (single specialist vendor source) | **C** | §9 |
| `detailConfig.rockerCupIntakeValleyOffsetMm` *(new)* | `19` (`rockerTailValleyOffsetMm`) | **16.9** | `mm` | `published` *(derived)* | `valveRowOffsetMm (23 mm) ÷ rockerRatioIntake (1.36) = 16.91 mm` (cup at `W = -16.9 mm`; modeled lever ratio `23 / 16.9 = 1.361`) | **C** *(on M2 arm)* | §9 |
| `detailConfig.rockerCupExhaustValleyOffsetMm` *(new)* | `19` (`rockerTailValleyOffsetMm`) | **13.6** | `mm` | `published` *(derived)* | `valveRowOffsetMm (23 mm) ÷ rockerRatioExhaust (1.69) = 13.61 mm` (cup at `W = +13.6 mm`; modeled lever ratio `23 / 13.6 = 1.691`) | **C** *(on M2 arm)* | §9 |

*(Pre-existing `published` fields in [`src/config/engineConfig.ts`](../src/config/engineConfig.ts) — `boreMm = 103.0`, `strokeMm = 99.0`, `compressionRatio = 17.5`, `vAngleDeg = 90`, `firingOrder = 1-2-7-8-4-5-6-3`, and `stockRatings` — remain unchanged.)*

---

## 2. Derivations, Dimension Stack & Not-Adopted Register (Spec §§2.2–2.4, §3)

### 2.1 Per-Valve Lift Derivation (`valveConfig.ts`)
- Published GM LLY lobe lift is symmetric across intake and exhaust lobes: `0.281 ± 0.002 in` (`7.1374 mm`, stored as `lobeLift = 7.14 mm`, Survey §4, Grade A).
- Published pre-L5P Duramax rocker ratios are asymmetric: `1.36:1` intake and `1.69:1` exhaust (Callies `2001–2016` factory-ratio cam table, Survey §9, Grade C).
- Resulting peak valve lifts:
  $$\text{intakeMaxLift} = 7.14 \times 1.36 = 9.7104\text{ mm} \rightarrow \mathbf{9.7\text{ mm}}, \qquad \text{exhaustMaxLift} = 7.14 \times 1.69 = 12.0666\text{ mm} \rightarrow \mathbf{12.1\text{ mm}}$$
- [`src/core/kinematics.ts`](../src/core/kinematics.ts) reads `valves.intakeMaxLift` and `valves.exhaustMaxLift` separately in `computeState` and `pistonValveClearanceM` without altering any exported function signature or [`src/core/interfaces.ts`](../src/core/interfaces.ts).

### 2.2 Per-Channel Rocker Cup Offsets (`detailConfig.ts`, `layout.ts`)
- Under the M2 rigid-rocker kinematic geometry (`θ_r = asin(lift / valveRowOffsetMm)`, `pushrodRise = cupOffset × sin θ_r = lift × cupOffset / 23`), the modeled mechanical ratio `valveLift / pushrodRise` equals `valveRowOffsetMm / cupOffset` (`23 / cupOffset`).
- Dividing `valveRowOffsetMm = 23 mm` by the published ratios embeds `1.36` and `1.69` directly into the 3D rocker castings and pushrod kinematics (replacing the M2 symmetric `23 / 19 ≈ 1.21`):
  $$\text{cup}_{\text{in}} = \frac{23}{1.36} = 16.912\text{ mm} \rightarrow \mathbf{16.9\text{ mm}}\;\left(\frac{23}{16.9}=1.3609\right), \qquad \text{cup}_{\text{ex}} = \frac{23}{1.69} = 13.609\text{ mm} \rightarrow \mathbf{13.6\text{ mm}}\;\left(\frac{23}{13.6}=1.6912\right)$$
- Intake cup sits at `W = -16.9 mm` (pad at `W = +23 mm`) and exhaust cup sits at `W = +13.6 mm` (pad at `W = -23 mm`), with rounding error `< 0.1%` on both ratios.

### 2.3 Recomputed Bank-Local Dimension Stack & Piston-to-Valve Clearance (Spec §3)
- **TDC wrist-pin center:** `crankThrowMm (49.5) + rodLengthMm (163.0) = 212.5 mm` (unchanged; both inputs now `published`).
- **TDC piston crown:** `212.5 + pistonCompressionHeightMm (49.8) = 262.3 mm` (`Δ -2.2 mm` from M1–M6's `264.5 mm`), reproducing Survey §3's derived published-parts crown stack (`262.3 mm / 10.33 in`) exactly.
- **Deck plane (`deckB`):** `262.3 + deckGap (2.0, placeholder) = 264.3 mm` (`Δ -2.2 mm` from `266.5 mm`). All deck-derived valvetrain heights shift by `-2.2 mm`:
  - Spring seats: `264.3 + 45 = 309.3 mm` (was `311.5 mm`)
  - Retainer undersides (closed): `309.3 + 48 = 357.3 mm` (was `359.5 mm`)
  - Valve stem tips (closed): `264.3 + 105 = 369.3 mm` (was `371.5 mm`)
  - Bridge undersides (closed): `264.3 + 100 = 364.3 mm` (was `366.5 mm`)
  - Bridge tops / rocker pads / rocker shaft axis: `264.3 + 110 = 374.3 mm` (was `376.5 mm`)
  - Lifter pushrod-seat tops: `130.0 mm` from crank axis (unchanged) → nominal vertical span `ΔB = 374.3 - 130.0 = 244.3 mm` (`pushrodLengthMm = 244 mm`, `placeholder`; true 3D rest lengths from M3 gallery seats are `250.0 mm` intake and `249.0 mm` exhaust).
- **Piston-to-valve clearance (`pistonValveClearanceM`, `0°–720°`):**
  - **Intake (`9.7 mm` peak lift, `350°–590°`):** minimum **`1.802 mm` at `α = 362.00°`** (up from `1.743 mm` under the `12 mm` placeholder lift).
  - **Exhaust (`12.1 mm` peak lift, `110°–350°`):** open-window minimum **`2.979 mm` at `α = 350.00°`**; full-cycle minimum **`2.000 mm`** at closed-valve TDCs (`0° / 360° / 720°`, equal to `deckGap`).
  - Both channels remain strictly positive across all `720°` without tuning any §2 input or altering `deckGap = 2.0 mm`.

### 2.4 Published / Partially Published Data Recorded, **Not** Adopted (Spec §2.4)

| Item | Survey Value & Source | Grade & § | Why Not Adopted in Sim Config / Geometry |
| --- | --- | :---: | --- |
| **Pushrod overall length** | `9.430 in` (`239.5 mm`) overall — Manton stock-length Duramax pushrod (single source) | **C** (§9) | Physical *overall* part length. The sim constructs pushrods between two 3D contact seats whose positions depend on unpublished lifter-gallery and rocker-pedestal coordinates (`true rest lengths = 250.0 / 249.0 mm`, nominal `ΔB = 244 mm`). Adopting `239.5 mm` would either misstate a nominal `ΔB` field or force arbitrary relocation of unpublished gallery points (D-035). |
| **Rod big-end width** | `1.119 in` (`28.4 mm`) — BoostLine `GM6418-358S` stock-matching aftermarket rod (`39.0 mm` pin-end width) | **C** (§1) | Vendor aftermarket part width stated to fit stock journals, not a GM-published stock rod spec. [`build_cylinder1.py`](../assets-src/blender/build_cylinder1.py) derives big-end width as `0.44 × pin_r = 0.22 × 62.9 = 27.7 mm` (`0.7 mm` narrower than `28.4 mm`), preserving positive inter-rod gap (`0.72 mm`) and pin-end margin (`0.96 mm`) on the `58 mm` modeled crankpin. |
| **Piston crown bowl volume** | `≈ +38 cc` — UEM OE-replacement LB7/LLY contoured-crown piston data | **B** (§8) | Single OE-replacement catalog figure; the procedural piston GLB models an illustrative combustion bowl contour with no volumetric contract, and compression ratio `17.5:1` is already pinned directly in `engineConfig.ts`. |
| **Stock Garrett GT3788VA wheel & vane sizes** | Compressor `≈62.6–62.8 mm` inducer / `88 mm` exducer (11 blades); turbine `71.3 mm` inducer / `65.7 mm` exducer (13 blades); vane height `14.4 mm` (DuramaxTuner) vs `15 mm` (DrivingLine/XDP); no fixed A/R (VGT) | **B + C** (§11) | No consumer in M7: the exterior turbo is part of the static owner GLB, and [`src/perf/`](../src/perf/) uses calibrated normalized flow/efficiency parameters that are frozen at M7 (§8). |
| **Injector nozzle hole count & rail rating** | `7-hole SAC` nozzle, external Bosch solenoid body, `23,000 psi` max rail pressure (Diesel Components Inc; Dynomite Diesel; DieselHub) | **B + C** (§12) | Nozzle hole diameter is not publicly available, [`fuel_injector_c1_stock.glb`](../public/models/fuel_injector_c1_stock.glb) does not model microscopic spray holes (byte-identical at M7), and `src/perf/` is frozen. |
| **Engine dry weight** | `≈ 835 lb` (`379 kg`) — DieselHub, DMAX Store, Xtreme Diesel | **B** (§7) | No mass or inertia consumer exists in the kinematic or fuel-first steady-state dyno models. |
| **Published approximate exterior dimensions** | `≈ 30.0 × 30.0 × 32.0 in` (`≈ 762 × 762 × 813 mm`) — DieselHub (single source, approximate) | **B** (§7) | Explicitly approximate single-source table with different measurement conventions than the owner GLB; compared in §4 below and tracked in [`docs/OPEN_ITEMS.md`](./OPEN_ITEMS.md) rather than rescaling (D-035). |
| **Head bolt count & thread diameter** | Six `14 mm` head bolts per cylinder (shared between adjacent bores) — DrivingLine, ProSource Diesel | **B** (§10) | Factoid without bolt-pattern coordinates; `sta_head_c1_stock.glb` does not model fasteners. |

---

## 3. Still-Illustrative (`placeholder`) Register (Spec §7.1(c))

Every geometric parameter below remains `confidence: 'placeholder'` (or an unmodeled shape convention) because the L7 survey confirmed no credible public GM/OE specification exists:

| Subsystem / Parameter | Shipped Field(s) & Modeled Value(s) | L7 Survey Verdict & Section | Notes |
| --- | --- | --- | --- |
| **Bore spacing / cylinder pitch** | `valveConfig.borePitch = 115 mm` (bank stagger `0 mm` in bank-local station slices, paired throws) | **NOT PUBLICLY AVAILABLE** (§2) | Trade-press mention of `"103 mm bore spacing"` is an editorial garble of the `103 mm` bore diameter. |
| **Block deck height & TDC piston protrusion** | `valveConfig.deckGap = 2.0 mm` → modeled deck plane `B = 264.3 mm` above crank axis | **NOT PUBLICLY AVAILABLE** (§3) | Crown-at-TDC stack (`262.3 mm`) is derived from published parts, but LLY block deck height and piston protrusion/clearance at TDC are unpublished. |
| **Cam duration, LSA & valve timing events** | `intakeOpenDeg = 350°`, `intakeCloseDeg = 590°`, `exhaustOpenDeg = 110°`, `exhaustCloseDeg = 350°`, `sin²` lift profile | **PARTIALLY PUBLISHED** overall; timing/duration/LSA **NOT PUBLICLY AVAILABLE** (§4) | GM service text gives lobe lift (`0.281 in`, adopted) and bearing journals, not IVO/IVC/EVO/EVC, duration, or lobe profile shape. |
| **Valve springs** | `springFreeLengthMm = 48 mm`, `springDiameterMm = 28 mm`, `springSeatHeightMm = 45 mm` | **NOT PUBLICLY AVAILABLE** (§5) | Published aftermarket beehive specs (`2006–2016`) do not cover the `2004.5–2005` LLY. *(Edelbrock's `27 mm` OD applies to its LB7 head kit.)* |
| **Roller lifter body diameter** | `detailConfig.lifterBodyDiameterMm = 23.85 mm` (`lifter_r = 11.925 mm`, `lifter_h = 35.1 mm`) | **NOT PUBLICLY AVAILABLE** (§9) | Decoupled from `pushrodDiameterMm` at M7 so `Ø 11.1 mm` pushrods do not inflate lifter diameter into piston-skirt sweep (`pistonLifterThresholdMm = 63.35 mm` preserved). |
| **Lifter gallery placement** | `lifterIntakeXOffsetMm = 56 mm`, `lifterIntakeValleyOffsetMm = 36 mm`, `lifterExhaustXOffsetMm = 35 mm`, `lifterExhaustValleyOffsetMm = 55 mm`, `lifterTopBoreOffsetMm = 130 mm` | **NOT PUBLICLY AVAILABLE** (§10) | No dimensioned block-valley drawing is public; M3 coordinates are retained to clear piston sweep, neighbor bores, and crank webs. |
| **Head internal & valvetrain envelope coordinates** | `valvePairSpacingMm = 40`, `valveRowOffsetMm = 23`, `valveInsetMm = 1`, `valveStemLengthMm = 105`, `bridgeThicknessMm = 8`, `rockerShaftHeightMm = 110`, `rockerTailXOffsetMm = 60`, `pushrodValleyOffsetMm = 19`, `pushrodLengthMm = 244`, `injectorBodyMm = 21`, `injectorLengthMm = 175` (`mm`) | **NOT PUBLICLY AVAILABLE** (§9, §10, §12) | Architectural M2/M3 head-slice coordinates; head deck recess windows (`|X| ≤ 43.0 mm`, `W ∈ [-8, +11]` and `[+26, +41] mm`) are procedural cutouts around the modeled pushrod trajectories. |
| **Modeled crankpin axial length & rod seat offsets** | `pinJournalLengthMm = 58 mm`, `rodSeatOffsetMm = 14.2 mm` (`±14.2 mm` RH/LH rod planes) | Shared-pin layout **PARTIALLY PUBLISHED** (§6); exact GM pin width/seat coordinates **NOT PUBLICLY AVAILABLE** (§1, §6) | Callies narrowed billet journals (`2.154–2.165 in` = `54.7–55.0 mm`) imply stock pin width `~55–57 mm`, close to `58 mm`; retained M3 values yield `+0.72 mm` inter-rod gap and `+0.96 mm` end margin with `27.7 mm` modeled big ends. |
| **Detailed procedural part shapes** | `pistonSkirtClearanceMm = 0.15`, `crankWebThicknessMm = 18`, `crankWebRadiusMm = 62`, plus procedural crown, rod I-beam, counterweight, head slab, rocker, bridge, and injector silhouettes | **NOT PUBLICLY AVAILABLE** (D-011) | Illustrative procedural geometry built in [`assets-src/blender/build_cylinder1.py`](../assets-src/blender/build_cylinder1.py), not CAD scans of GM castings/forgings. |
| **Registered exterior shell scale** | [`public/Duramax_LLY_2005_66L_V8.glb`](../public/Duramax_LLY_2005_66L_V8.glb) registered at uniform `s = 0.430` | **PARTIALLY PUBLISHED** (§7) | Containment-registered owner mesh (M3 §5); see §4 comparison below. |

---

## 4. Registered Exterior Shell vs. Published Approximate Dimensions (Spec §§2.4, 5.4, 7.1(d))

Comparison between the Milestone 3 registered exterior shell bounding box ([`docs/M3-MEASUREMENTS.md`](./M3-MEASUREMENTS.md) §2.4, uniform scale `s = 0.430`) and DieselHub's published approximate Duramax 6.6L external dimensions (Survey §7, Grade B):

| Axis / Span | Registered Exterior Shell (`s = 0.430`, M3) | DieselHub Published Approximate (Survey §7) | Delta (Registered − Published) | Explanation |
| --- | ---: | ---: | ---: | --- |
| **Length (`X`, rear–front)** | **`1,174.89 mm`** (`X ∈ [-282.14, +892.75] mm`) | **`≈ 762 mm`** (`≈ 30.0 in`, fan excluded) | `+412.9 mm` (`+54%`) | DieselHub measures rear block face to front of accessory drive *excluding cooling fan/shroud extensions*; the owner GLB includes front accessory/pulley/intake plumbing overhang and is uniformly scaled to contain the `4 × 115 mm` internal station envelope with M3 margins. |
| **Width (`Y`, LH–RH)** | **`1,095.22 mm`** (`Y ∈ [-573.40, +521.82] mm`) | **`≈ 762 mm`** (`≈ 30.0 in`) | `+333.2 mm` (`+44%`) | Containment-driven uniform scale `s = 0.430` around the `±293.4 mm` internal V8 envelope plus outward-protruding manifolds/accessories on the owner mesh. |
| **Height (`Z`, sump–top)** | **`807.48 mm`** (`Z ∈ [-223.60, +583.88] mm`) | **`≈ 813 mm`** (`≈ 32.0 in`, sump variation noted) | **`-5.5 mm` (`-0.7%`)** | **Agrees closely:** vertical span from lower oil-pan sump to upper turbo/intake plumbing matches the `≈ 32 in` published envelope within `< 1%`. |

Per **D-035**, the exterior shell is **not rescaled** at Milestone 7: DieselHub's `30 × 30 × 32 in` figures are single-source and explicitly approximate, while `s = 0.430` satisfies M3's strict coaxial crank-axis alignment and 3D internal-part containment contract. This comparison is recorded as a watch item in [`docs/OPEN_ITEMS.md`](./OPEN_ITEMS.md) to revisit only if a dimensioned GM drawing is located.

---

## 5. Why "Shared-Pin Crank Layout" Left the On-Screen Disclaimer Banner (Spec §7.1(e))

In Milestones 3–6, the bottom-left disclaimer caption listed `"shared-pin crank layout"` among illustrative placeholders because no explicit GM sentence stating `"two connecting rods share each crankpin"` had been cited when M3 derived the 4-throw layout from the `90°` V-angle and `1-2-7-8-4-5-6-3` firing order.

At Milestone 7, the L7 survey (§1 and §6) established from published dimensions that the **shared-pin layout itself is structurally certain**:
1. Stock-matching Duramax connecting rods have a single big-end width of **`1.119 in` (`28.4 mm`)** (BoostLine `GM6418-358S`, Survey §1).
2. OEM-compatible Duramax crankshafts are 5-main, 4-pin crossplane cranks whose *narrowed* billet rod journals measure **`2.154–2.165 in` (`54.7–55.0 mm`)** (Callies, Survey §6), placing stock pin width at **`~2.17–2.24 in` (`~55–57 mm`)** — wide enough for, and only explainable by, **two side-by-side `28.4 mm` rod big ends per pin**.

Accordingly:
- `"shared-pin crank layout"` (along with generic `"placeholder dimensions"` and `"valve lift"` magnitude) is **removed** from the on-screen disclaimer banner in [`src/ui/engineControls.ts`](../src/ui/engineControls.ts) (§4.4), which now names only what genuinely remains illustrative (`bore spacing, deck height and piston protrusion, valve timing events, duration, and lift profile shape, lifter gallery placement, detailed part shapes, and the registered exterior shell`).
- Meanwhile, the *specific numerical axial dimensions* used to render that shared pin — `pinJournalLengthMm = 58 mm` and `rodSeatOffsetMm = ±14.2 mm` — remain M3-derived placeholder numbers rather than GM-published specifications, so both keep `confidence: 'placeholder'` in [`src/config/detailConfig.ts`](../src/config/detailConfig.ts) and remain documented in §3's still-illustrative register above.
