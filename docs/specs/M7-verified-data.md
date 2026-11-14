# Milestone 7 Spec — Verified LLY Data

Repo: `colinstephens93/CarbonDuramax` · Branch: `m7-verified-data` (create from `main`, which includes Milestones 0–6 merged) · Plan reference: **new milestone, not in PLAN.md v2.2** — Milestone 7 is added to the plan by this spec's paperwork deliverables (§7), per the anti-drift rule (a plan change needs a decision-log entry + plan revision in the same PR). Source of truth for every value below: `docs/research/L7-verified-data-survey.md` (the "survey") — its grades and verdicts govern what may be claimed as published. Interface shapes are the frozen D-010 contract in `src/core/interfaces.ts` — this milestone does **not** revise them (see §4.1 for why the one core change needs no interface change). Budgets (D-033) still apply and are re-verified after geometry regeneration (§5.4).

**Coding is done by the user in Antigravity on branch `m7-verified-data`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

## 1. What Milestone 7 is

Milestones 0–6 were built on honestly labeled illustrative placeholders (D-011/D-012). The survey went looking for published 2004.5–2005 LLY data to replace them and found more than expected — and confirmed that some placeholders have **no** public source and must stay illustrative. M7 upgrades exactly what the survey supports, nothing more:

1. **Config data upgrades (§2):** rod length confirmed at 163.0 mm (provenance placeholder → published); piston compression height 49.8 mm and wrist pin 34.5 mm (MAHLE Original, the OE supplier); crank rod-pin journal 62.9 mm and **main journal 79.9 mm** (new field — today the main radius is a factor of the pin, see §11); valve head diameters 33.0 / 31.0 mm; valve stem 7.0 mm (provenance only); pushrod diameter 11.1 mm (single vendor source).
2. **Per-valve valve lift (§2.2, §4.1):** the single illustrative `maxLift` 12 mm is replaced by published-anchored per-valve lifts — intake ≈ 9.7 mm, exhaust ≈ 12.1 mm — derived from GM's published lobe lift (0.281 in) × the published rocker ratios (1.36 intake / 1.69 exhaust). This is the one place M7 touches `src/core` (§4.1, justified and minimal).
3. **The dimension stack re-based (§3):** the published compression height moves the deck plane from B = 266.5 to **B = 264.3 mm**; every deck-derived layout point shifts by −2.2 mm; piston-to-valve clearance is recomputed for both lifts (intake minimum **1.802 mm**, §3).
4. **Geometry regeneration (§5):** 8 of the 10 cylinder-1 GLBs regenerate from the upgraded `dimensions.json`; the bridge and injector GLBs must come out **byte-identical**. The renderer's main crankshaft radius follows the published main journal (§4.3). Rocker cup offsets become per-channel so the rocker geometry itself encodes the published ratios (§2.3).
5. **Honesty paperwork (§7):** `docs/M7-DATA.md` (the verified data table + derivations + the still-illustrative register), `docs/M7-MEASUREMENTS.md` (regeneration record + budgets), and the anti-drift paperwork: PLAN.md milestone 7, DECISIONS.md **D-035**, OPEN_ITEMS.md closures/annotations.
6. **The disclaimer banner shrinks (§4.4):** it now lists only what remains illustrative — bore spacing, deck height/protrusion, valve timing events/duration/profile, lifter gallery placement, detailed part shapes, the registered exterior shell.

**Non-goals for M7:** no performance-model change (`src/perf` is frozen — journal diameters and valve lift do not enter the fuel-first model; its M5 calibration and M6 catalog stand untouched); no catalog change; no rescaling of the exterior shell (§2.4 — the published dimensions are approximate and single-source, and the shell's scale is an M3 containment guarantee, not a measurement); no new valve-timing events (duration/LSA/timing are **not published** — the placeholder timing windows stay, only the lift magnitudes change); no lifter, spring, head-internal, or gallery geometry changes (no public source exists).

**Provenance vocabulary note.** `ProvenancedValue.confidence` is the frozen union `'verified' | 'published' | 'placeholder'` (D-010; `interfaces.ts` is not revised). Values that are arithmetic on published inputs (derived valve lift, cup offsets, crank throw) therefore carry confidence `'published'` with the word **"derived:"** at the start of their `source` string, naming both inputs — the derivation is in the label, per D-012's "no dimension is ever silently invented."

## 2. The data upgrades

### 2.1 `src/config/engineConfig.ts`

| Field | Old | New | Provenance | Survey basis |
|---|---|---|---|---|
| `rodLengthMm` | 163.0, `placeholder` | **163.0 (value unchanged)**, `published` | placeholder → published | §1: Manley 6.417 in, BoostLine 6.418 in, Callies 6.418 in, UEM 163.000 mm — four independent sources converge |
| `crankThrowMm` | 49.5, `placeholder`, "derived: stroke / 2" | **49.5 (unchanged)**, `published` | placeholder → published | §6: half of the published 99.0 mm stroke (DieselHub / GM Authority / XDP). Source string becomes "derived: half of published 99.0 mm stroke (DieselHub; GM Authority; XDP)" |

All other `engineConfig` fields are untouched (bore, stroke, compression ratio, V-angle, firing order, bank assignment, and `stockRatings`).

### 2.2 `src/config/valveConfig.ts` — per-valve lift

The single field `maxLift` (12 mm, placeholder) is **removed** and replaced by five fields. The timing windows (`intakeOpenDeg` 350, `intakeCloseDeg` 590, `exhaustOpenDeg` 110, `exhaustCloseDeg` 350) and `deckGap` / `borePitch` keep their values and `placeholder` confidence — only their `source` strings are updated to cite the survey (timing events/duration: survey §4, not published; deck: §3; bore spacing: §2, not publicly available).

| Field | Value | Unit | Confidence | Source (as written in config) |
|---|---|---|---|---|
| `lobeLift` (new) | 7.14 | mm | `published` | "GM service literature for the LLY: cam lobe lift 0.281 ± 0.002 in, intake and exhaust lobes equal (via dieselmechanic.info mirror); 0.281 in × 25.4 = 7.1374 mm" |
| `rockerRatioIntake` (new) | 1.36 | ratio | `published` | "Callies factory-ratio Duramax cam table (2001–2016): 1.36:1 intake rocker ratio; vendor-published, corroborated by forum consensus (L7 survey §9)" |
| `rockerRatioExhaust` (new) | 1.69 | ratio | `published` | "Callies factory-ratio Duramax cam table (2001–2016): 1.69:1 exhaust rocker ratio; vendor-published (L7 survey §9)" |
| `intakeMaxLift` (new) | 9.7 | mm | `published` | "derived: GM lobe lift 7.14 mm × published intake rocker ratio 1.36 = 9.71 mm (L7 survey §4)" |
| `exhaustMaxLift` (new) | 12.1 | mm | `published` | "derived: GM lobe lift 7.14 mm × published exhaust rocker ratio 1.69 = 12.07 mm (L7 survey §4)" |

`ValveConfig` (the interface declared in `valveConfig.ts`) is updated to match: `maxLift` out, the five fields in. `deckGap` source becomes: "D-011/D-012 illustrative placeholder — piston protrusion/deck clearance at TDC is not published for the LLY (L7 survey §3); crown-at-TDC stack 262.3 mm is derived from published parts (rod 163.0 + CH 49.8 + throw 49.5)". `borePitch` source becomes: "D-011/D-012 illustrative placeholder — bore spacing is not publicly available for the LLY (L7 survey §2, surveyed 2026-11-13)".

### 2.3 `src/config/detailConfig.ts`

| Field | Old | New | Provenance | Basis |
|---|---|---|---|---|
| `pistonCompressionHeightMm` | 52 | **49.8** | placeholder → `published` | MAHLE Original (OE supplier) 1.961 in for LB7/LLY; UEM agrees (survey §8) |
| `wristPinDiameterMm` | 33 | **34.5** | placeholder → `published` | MAHLE / UEM / BoostLine: 1.358 in (survey §8) |
| `pinJournalDiameterMm` | 60 | **62.9** | placeholder → `published` | Callies 2.477 in; BoostLine 2.476 in; MotorTrend: pre-L5P rod journal 2.4764 in (survey §6) |
| `mainJournalDiameterMm` (**new field**) | — (was a 1.08× pin factor in the Blender script and in `layout.ts`) | **79.9** | `published` | Callies: main journal 3.146 in at OEM dimensions; MotorTrend L5P teardown corroborates 3.146 in carried over (survey §6) |
| `valveIntakeHeadMm` | 38 | **33.0** | placeholder → `published` | ZZ Diesel OE part-number data: 1.299 in; Edelbrock: 33 mm (survey §5) |
| `valveExhaustHeadMm` | 35 | **31.0** | placeholder → `published` | ZZ Diesel OE: 1.220 in; Edelbrock: 31 mm (survey §5) |
| `valveStemMm` | 7 | **7 (unchanged)** | placeholder → `published` | Edelbrock stock-compatible head data: stem 7.0 mm (survey §5) |
| `pushrodDiameterMm` | 9 | **11.1** | placeholder → `published` | Manton: stock Duramax pushrod 7/16 in diameter (single vendor source; survey §9). Clearance re-check in §11 |
| `lifterBodyDiameterMm` (**new field**) | — (was derived: lifter radius = 2.65 × pushrod radius, in both `layout.ts` and the build script) | **23.85** | stays `placeholder` | Lifter diameter is **not published** (survey §9). The value makes the previously modeled lifter body radius explicit — 2 × (2.65 × 4.5) = 23.85, i.e. radius 11.925, exactly today's geometry — and **decouples** it from the pushrod: without this, adopting pushrod Ø 11.1 would silently inflate the modeled lifter radius to 2.65 × 5.55 = 14.7075 and break the piston–lifter clearance (§4.3, §11). Source string: "D-011/D-012 illustrative placeholder — lifter body diameter not published for the LLY (L7 survey §9); value is the M2/M3 modeled radius (2.65 × 4.5 mm pushrod radius) made explicit at M7 (D-035), geometry unchanged" |
| `pushrodLengthMm` | 246 | **244** | stays `placeholder` | Recomputed modeled nominal (§3: shaft B 374.3 − lifter top B 130 = 244.3, recorded as 244 per the M2 nominal convention). **The published 239.5 mm is deliberately NOT adopted** — see §2.4 |
| `rockerTailValleyOffsetMm` | 19 | **removed** | — | Replaced by the two per-channel fields below |
| `rockerCupIntakeValleyOffsetMm` (**new**) | — | **16.9** | `published` (derived) | "derived: valveRowOffset 23 mm ÷ published intake rocker ratio 1.36 = 16.91 mm — the cup arm that makes the modeled rocker ratio 1.36 (23/16.9 = 1.361)" |
| `rockerCupExhaustValleyOffsetMm` (**new**) | — | **13.6** | `published` (derived) | "derived: valveRowOffset 23 mm ÷ published exhaust rocker ratio 1.69 = 13.61 mm (23/13.6 = 1.691)" |

The cup offsets matter because of how the renderer drives the valvetrain (M2 derivation, unchanged in M7): rocker angle θr = asin(lift / valveRowOffsetMm), and pushrod rise = cupOffset × sin θr = lift × cupOffset / 23. The modeled rocker ratio (valve lift ÷ lifter rise) is therefore exactly 23 / cupOffset per channel — with the new offsets the *geometry* now embodies 1.36 / 1.69 instead of the old symmetric 23/19 ≈ 1.21 for both. Cup signs are unchanged (intake cup at W = −offset, exhaust at W = +offset — opposite its pad, as a rigid lever requires), and cup X offsets (`rockerTailXOffsetMm` 60) are unchanged.

All other `detailConfig` fields keep value, confidence, and source, except `pinJournalLengthMm` (58) and `rodSeatOffsetMm` (14.2), whose **source strings** gain a sentence: "Retained at M7: with pin journal 62.9 the modeled rod big-end width becomes 27.7 mm (build script's 0.22 × journal factor); inter-rod gap 0.72 mm and pin-end margin 0.96 mm, both positive (M7 spec §11)."

### 2.4 Recorded but NOT adopted (goes in `docs/M7-DATA.md`, §7)

- **Pushrod overall length 239.5 mm** (Manton, single source, survey §9): an *overall* length of a physical part. The sim's pushrod is constructed between two contact points whose positions come from the lifter gallery and rocker layout — both unpublished — so forcing 239.5 into the config would falsify the model's internal geometry to match a differently-defined measure. Recorded; not adopted.
- **Rod big-end width 28.4 mm** (BoostLine, vendor, survey §1): the build script derives modeled width from the pin journal (0.22 factor → 27.7 mm at 62.9). Recorded with the 0.7 mm delta; the factor is not changed.
- **Piston bowl ≈ 38 cc** (UEM, single OE-replacement source, survey §8): the modeled bowl is a shallow visual dish with no volume contract; recorded, not adopted as a dimension.
- **Turbo GT3788VA wheel sizes** (compressor ≈62.8/88 mm, turbine 71.3/65.7 mm; specialist-measured, survey §11) and **injector 7-hole SAC** (survey §12): recorded at published-specialist grade. They have no consumer in the sim (the perf model's turbo parameters are calibration placeholders under M5's own provenance, and `src/perf` is frozen; the injector GLB's nozzle is not hole-modeled).
- **Engine dry weight 835 lb** (three sources, survey §7): recorded; the sim has no weight consumer.
- **Exterior dimensions ≈ 762 × 762 × 813 mm** (DieselHub, approximate, stated conventions, survey §7): compared against the registered shell in §5.4/§11 — height agrees (≈807.5 vs ≈813 mm); the shell's X/Y spans (1,174.9 / 1,095.2 mm per `docs/M3-MEASUREMENTS.md`) far exceed the published figures because the M3 registration scale is containment-driven and the owner's GLB is not proportioned like the published measurement conventions (fan excluded, sump variation excluded). **Not rescaled at M7**; recorded as an OPEN_ITEMS watch item (§7).
- **Six 14 mm head bolts per cylinder** (survey §10): published factoid; the head GLB does not model head bolts and M7 adds none. Recorded.

## 3. The dimension stack, recomputed end-to-end

All B coordinates are bank-local (M2 frame: B along the bore axis from the crank axis). Arithmetic shown; this is the stack the regenerated geometry must reproduce.

**Crank axis → crown at TDC.** Slider-crank top position = crank throw + rod length + piston compression height:
- throw + rod = 49.5 + 163.0 = **212.5** (unchanged — rod confirmed, throw confirmed)
- crown at TDC = 212.5 + **49.8** = **262.3 mm** (was 212.5 + 52 = 264.5; **Δ −2.2**). This matches the survey §3 derived stack (262.3 mm) exactly — the sim's crown now sits on the published-parts stack.

**Deck plane.** deck B = crown at TDC + deckGap. `deckGap` stays **2.0 mm, placeholder**: it stands in for the piston's deck clearance/protrusion at TDC, which the survey found **not published** for the LLY (§3). The model's crown therefore sits 2.0 mm *below* the deck plane at TDC — an explicit, labeled assumption, not a measurement.
- deck B = 262.3 + 2.0 = **264.3 mm** (was 266.5; **Δ −2.2**)

**Deck-derived layout points** (offsets from the deck plane are unchanged config values; every point shifts by exactly −2.2):

| Point | Derivation | Was (mm) | Now (mm) |
|---|---|---|---|
| Deck plane | crown + deckGap | 266.5 | **264.3** |
| Spring seats | deck + `springSeatHeightMm` 45 | 311.5 | **309.3** |
| Retainer undersides | seats + `springFreeLengthMm` 48 | 359.5 | **357.3** |
| Bridge undersides | stem tips − 5 (bridge socket depth, M2 layout) = deck + 100 | 366.5 | **364.3** |
| Bridge tops / rocker pads / rocker shaft axis | deck + `rockerShaftHeightMm` 110 | 376.5 | **374.3** |
| Valve stem tips | deck + `valveStemLengthMm` 105 | 371.5 | **369.3** |
| Lifter tops | `lifterTopBoreOffsetMm` (from crank axis, not deck) | 130 | **130 (unchanged)** |
| Pushrod vertical span ΔB | shaft − lifter top | 246.5 | **244.3** |

**Piston-to-valve clearance** (M1 model, unchanged: clearance(α) = p(α) + deckGap − lift(α), p = slider-crank displacement below TDC with r = 49.5, L = 163.0; intake window 350°–590°, exhaust window 110°–350°, sin² profile; swept 0°–720° inclusive at 0.01° steps — method and old-config control run in §11):
- **Intake (lift 9.7): minimum 1.802 mm at α ≈ 362.0°** (overlap TDC region, as before; was 1.743 mm at 362.6° with the 12 mm placeholder lift — the lower published lift buys back a little clearance even though it peaks later in the window's rise).
- **Exhaust (lift 12.1): minimum while the valve is open 2.979 mm at α = 350.0°** (window close); over the whole cycle the exhaust clearance bottoms at exactly **2.000 mm** at the closed-valve TDCs (α = 0°/360°/720°), which is just `deckGap` with the valve shut — not a contact margin.
- **Cycle minimum overall: 1.802 mm (intake) — positive at every angle, endpoints included. The stack closes with no adjustment.** No number in §2 was tuned to make this pass; the deckGap assumption is the same 2.0 mm carried since M1.

## 4. Code changes by layer

### 4.1 Core — `src/core/kinematics.ts` (the one core change, justified)

Per-valve lift cannot be expressed by the current core: `computeState` and `pistonValveClearanceM` both read a single `valves.maxLift` and apply it to both windows (see `maxLiftM` in each function). Asymmetric published lifts (9.7 ≠ 12.1) therefore require this minimal change:

- In `computeState`: replace the single `maxLiftM` with `intakeMaxLiftM = valves.intakeMaxLift.value / 1000` and `exhaustMaxLiftM = valves.exhaustMaxLift.value / 1000`, passed to the intake and exhaust `valveWindowLiftM` calls respectively.
- In `pistonValveClearanceM`: same split for its two lift computations.
- **Nothing else in the core changes.** Exported function signatures are unchanged; `CrankState` is unchanged; `src/core/interfaces.ts` is **not** modified (the `ValveConfig` interface lives in `src/config/valveConfig.ts`, not in the frozen contract). The architecture test (three.js only in `src/renderer`) is unaffected.
- `src/core/kinematics.test.ts` is expected to pass **unmodified** — its assertions are config-relative (it reads lifts/clearances through the core, and its clearance test asserts ≥ 0 and minimum < 0.005 m, both still true at 1.802 mm). If the build finds any assertion in it that hardcodes the old 12 mm behavior, **stop and report** rather than editing it silently (§10).

### 4.2 Config — `src/config/valveConfig.ts`, `detailConfig.ts`, `engineConfig.ts`

Exactly the field/value/provenance changes tabulated in §2. `src/config/index.ts` re-exports are updated only if it names the changed fields. `assets-src/dimensions.json` is regenerated to match (§5.1) — the glbContract dimensions-sync test (§6) is the enforcement.

### 4.3 Renderer — `src/renderer/layout.ts` and `engineScene.ts` (geometry registration only)

Three changes, all forced by §2's data (nothing else in the renderer changes):

1. **Main shaft radius.** `layout.ts` currently derives `mainShaftRadiusMm = 0.5 × pinJournalDiameterMm × MAIN_JOURNAL_TO_PIN_RADIUS` (1.08 → 32.4 mm). Replace with `0.5 × detailConfig.mainJournalDiameterMm.value` = **39.95 mm** and remove the `MAIN_JOURNAL_TO_PIN_RADIUS` constant. In `engineScene.ts`'s `buildMainCrankShaftMesh`, the profile's two outer disc radii were chosen at M3 as absolute values under the old radius (rear flange 52.5 mm, front pulley 57.0 mm, both < the 62 mm web radius): preserve those **absolute** radii (52.5 / 57.0 mm) instead of their old factors (1.62 / 1.76 × r, which would now give 64.7 / 70.3 mm and exceed the web radius). The remaining turned steps (rear seal 1.08, snout 0.78, hub 1.15, inner step 0.55) stay proportional to r. Update the function's doc comment (radius is now the published main journal radius, 39.95 mm; the crankthrow stub radius matches by construction, §5.2). This keeps shaft and stubs one continuous surface, as at M3.
2. **Per-channel rocker cups.** `layout.ts`'s single `rockerCupValleyOffsetMm` (from `rockerTailValleyOffsetMm`) becomes two values from the new detail fields: intake cup rest W = **−16.9**, exhaust cup rest W = **+13.6** (`intakeCupRestMm` / `exhaustCupRestMm` updated accordingly). Everything downstream (pushrod endpoints, view layout) already consumes the per-channel rest points and flows through unchanged.

3. **Lifter body radius decoupled from the pushrod radius.** `layout.ts` currently derives `lifterBodyRadiusMm = LIFTER_RADIUS_TO_PUSHROD_RADIUS (2.65) × pushrodRadiusMm`. Under §2.3's published pushrod Ø 11.1 (radius 5.55) that derivation would raise the modeled lifter radius to **14.7075 mm** and `pistonLifterThresholdMm` to **66.1325 mm** — above the own-bore exhaust lifter axis distance (65.192 mm): a clearance failure created purely by the coupling, for a dimension (lifter diameter) that is itself unpublished (survey §9). Replace the derivation with `0.5 × detailCfg.lifterBodyDiameterMm.value` = **11.925 mm** — today's modeled radius, unchanged — and remove the `LIFTER_RADIUS_TO_PUSHROD_RADIUS` constant. `pistonLifterThresholdMm` therefore stays 51.425 + 11.925 = **63.35 mm**, and `layout.test.ts` test 5 passes unmodified (§4.5). The build script carries the same coupling and is decoupled the same way (§5.2).

`src/renderer/viewLayout.ts` itself does not change. The M4 explode/cutaway/x-ray/label behavior is untouched.

### 4.4 UI — `src/ui/engineControls.ts`

- Page subtitle becomes **"Milestone 7 — Verified LLY Data"** (same one-line pattern as M5/M6).
- The disclaimer banner is replaced with exactly this text:

> Illustrative geometry, part shapes & timing: Bore spacing, deck height and piston protrusion, valve timing events, duration, and lift profile shape, lifter gallery placement, detailed part shapes, and the registered exterior shell remain illustrative placeholders, not verified LLY measurements.

Nothing else on screen changes. (The banner is the app's only on-screen provenance display; per-value provenance lives in the configs and `docs/M7-DATA.md`.)

### 4.5 Existing tests that change (named, with reasons — all other existing tests are unmodified)

1. **`src/assets/glbContract.test.ts`, test 2 (dimensions sync):** its hand-listed valveConfig keys (`borePitch`, `maxLift`, `deckGap`) become (`borePitch`, `intakeMaxLift`, `exhaustMaxLift`, `deckGap`). Reason: the test enumerates `valveConfig`'s geometry fields by name; §2.2 renames one into two. (Its `detailConfig` coverage is automatic — it iterates the config object, so the added/removed detail fields flow through, and the key-set equality it asserts is what forces `dimensions.json` to the §5.1 delta.) Bounds assertions in test 3+ read config values dynamically and need no edits.
2. **`src/renderer/layout.test.ts`, test 3 (cup rest points):** expected cup rest W values −19 / +19 become **−16.9 / +13.6**, and the B coordinates 376.5 become **374.3** (deck shift, §3). Reason: the test pins the layout points M7 deliberately changes.
3. **`src/renderer/layout.test.ts`, test 7 (exterior registration; contains the shaft-radius assertion at lines ~184–185):** "main shaft radius 32 ± 2 mm per Spec §3" becomes the published journal: expect `mainShaftRadiusMm` = 39.95 ± 0.5, citing `mainJournalDiameterMm`. Reason: the M3 placeholder-derived band is replaced by the published value.
4. **`src/renderer/viewLayout.test.ts` (lift envelope, ~line 164):** the single `valveConfig.maxLift.value` envelope becomes per-channel: the valvetrain sweep is exercised at each channel's own maximum (`intakeMaxLift` for intake parts, `exhaustMaxLift` for exhaust parts); if the test's structure makes a single bound simpler, the bound is `exhaustMaxLift` (12.1, the larger) applied to both — conservative and still ≤ the old 12 mm envelope's intent. Reason: the field it referenced no longer exists.

5. **`src/renderer/layout.test.ts`, test 4 (pushrod radial clearances):** two pins update to the recomputed M7 values — `pistonSweptBandBMm[1]` 264.5 → **262.3** (= `tdcWristBMm` 212.5 + `pistonCompressionHeightMm` 49.8, per `sweptHiBMm = tdcWristBMm + pistonCompressionHeightMm`; §3) and `pistonPushrodThresholdMm` 55.925 → **56.975** (= piston radius 51.425 + new pushrod radius 5.55). Reason: both pins are arithmetic on §2's changed values. The test's 55.9 mm floor literals stay and stay true (the tightest M7 distance is the neighbor-intake 57.307 mm, §11); the strict `> pistonPushrodThresholdMm` assertions are the binding ones.
6. **`src/renderer/layout.test.ts`, test 5 (lifter axis distances):** **unmodified — and load-bearing.** With the §4.3 decoupling, `pistonLifterThresholdMm` stays **63.35** and all four axis distances keep their current values (own intake 66.573, own exhaust 65.192, neighbor intake 69.116, neighbor exhaust 97.082; margins in §11), so every assertion passes as written. This test is what catches a build that forgets the decoupling: leaving the 2.65× derivation in place yields a threshold of 66.1325 > 65.192 and fails here first.

`layout.test.ts` test 6's distances are precomputed under the full M7 geometry in §11 (cross-cylinder pushrod 26.018 > 25; nearest lifter spacing 30.610 > 30) and it is expected to pass unmodified. If any *other* existing test fails because of §2's values, do not edit it to pass — report the computed values in the closing summary; Buckley adjudicates (§9.3).

## 5. Geometry regeneration

### 5.1 `assets-src/dimensions.json` delta (39 keys → 43 keys)

Regenerated from the configs per the M2 discipline (JSON keys are exactly the TypeScript field names; the committed JSON is the artifact). Changes against the M6-era file:

| Key | Old | New |
|---|---|---|
| `pistonCompressionHeightMm` | 52 | **49.8** |
| `wristPinDiameterMm` | 33 | **34.5** |
| `pinJournalDiameterMm` | 60 | **62.9** |
| `mainJournalDiameterMm` | — | **79.9 (added)** |
| `valveIntakeHeadMm` | 38 | **33.0** |
| `valveExhaustHeadMm` | 35 | **31.0** |
| `pushrodDiameterMm` | 9 | **11.1** |
| `pushrodLengthMm` | 246 | **244** |
| `maxLift` | 12 | **removed** |
| `intakeMaxLift` | — | **9.7 (added)** |
| `exhaustMaxLift` | — | **12.1 (added)** |
| `rockerTailValleyOffsetMm` | 19 | **removed** |
| `rockerCupIntakeValleyOffsetMm` | — | **16.9 (added)** |
| `rockerCupExhaustValleyOffsetMm` | — | **13.6 (added)** |
| `lifterBodyDiameterMm` | — | **23.85 (added)** |

Count check: 39 + 6 added (`mainJournalDiameterMm`, `intakeMaxLift`, `exhaustMaxLift`, `rockerCupIntakeValleyOffsetMm`, `rockerCupExhaustValleyOffsetMm`, `lifterBodyDiameterMm`) − 2 removed (`maxLift`, `rockerTailValleyOffsetMm`) = **43 keys**. (The lifter key is required, not optional: the JSON keys are exactly the config field names, and the decoupled lifter value lives in `detailConfig` per §2.3/§4.3.)

All other keys carry their current values (including `borePitch` 115, `deckGap` 2, `rodLengthMm` 163, `pinJournalLengthMm` 58, `rodSeatOffsetMm` 14.2, `rockerTailXOffsetMm` 60, `pushrodValleyOffsetMm` 19, and the lifter gallery offsets).

### 5.2 `assets-src/blender/build_cylinder1.py` changes (inputs and four wirings)

The script stays the single generator (run with the project's Blender, as at M2/M3). Changes:

1. **`build_crankthrow`:** `main_r` is currently `1.08 * pin_r`. Change to `0.5 * d["mainJournalDiameterMm"]` (= 39.95 mm, matching the renderer shaft, §4.3). Pin radius, web, and stub-length logic are otherwise untouched (stub length still clamps to the station slice; with the journal inputs changed the stub is 10.5 mm long as before).
2. **`build_head` and the axis fixture:** the head recess-window computation currently uses one `cup_w_mm` (= `rockerTailValleyOffsetMm`) and one `d["maxLift"]` for both channels. Make both per-channel: intake line uses cup W **−16.9** and lift envelope `intakeMaxLift` 9.7; exhaust line uses cup W **+13.6** and `exhaustMaxLift` 12.1. The deck slab and all deck-derived heights already derive from the config stack (`deck_b_mm`), so the −2.2 mm shift flows from `pistonCompressionHeightMm` alone — verify the logged deck B is **264.3**. The script's logged recess-window assertion (floor and bands, M3 §4 discipline) must still pass with pr radius 5.55 mm (pushrod Ø 11.1); §11's hand-check puts the crossings at W ≈ +5.8 (neighbor intake, window [−8, +11]) and W ≈ +31.4 (own exhaust, window [+26, +41]) — inside the existing windows, so the windows themselves are expected to be unchanged.
3. **`build_rockers`:** `build_single_rocker_casting` is already parameterized by `cup_y`; pass **−16.9** for the intake casting and **+13.6** for the exhaust casting (today both use `rockerTailValleyOffsetMm`). Pad contacts stay at W ±23 (`valveRowOffsetMm`).

4. **`build_pushrod_and_lifter`:** the lifter profile carries the same pushrod coupling as `layout.ts` — `lifter_r = 2.65 * pr_r` and `lifter_h = 7.8 * pr_r`. Decouple identically (§4.3): `lifter_r = 0.5 * d["lifterBodyDiameterMm"]` (= 11.925 mm) and `lifter_h = 7.8 * (lifter_r / 2.65)` (= 35.1 mm), so the lifter node keeps exactly today's proportions while the pushrod tube, ball, and neck scale with the new Ø 11.1. The profile points that reference `pr_r` / `ball_r` are the pushrod-seat features (the seat mates the pushrod ball) and stay coupled to the pushrod by design.

No other script logic changes: piston (CH, pin), conrod (pin journal, wrist pin — note its big-end width factor 0.22 now yields 27.7 mm, §2.4), and valves (head diameters) pick up their new dimensions purely from `dimensions.json`.

### 5.3 Per-GLB disposition (10 cylinder-1 files, `public/models/`)

| GLB | Disposition | Why |
|---|---|---|
| `rot_piston_c1_stock.glb` | **Regenerates** | CH 52 → 49.8; wrist pin Ø 33 → 34.5 |
| `rot_conrod_c1_stock.glb` | **Regenerates** | Pin journal Ø 60 → 62.9 (big-end bore/width); wrist pin Ø → 34.5 (small end) |
| `rot_crankthrow_c1_stock.glb` | **Regenerates** | Pin Ø → 62.9; main stub Ø → 79.9 |
| `sta_head_c1_stock.glb` | **Regenerates** | Deck plane −2.2 (all deck-derived heights); recess windows recomputed per-channel (§5.2.2) |
| `val_valve_intake_stock.glb` | **Regenerates** | Intake head Ø 38 → 33.0 (spring node in the same file is geometrically unchanged) |
| `val_valve_exhaust_stock.glb` | **Regenerates** | Exhaust head Ø 35 → 31.0 (spring likewise) |
| `val_pushrod_stock.glb` | **Regenerates** | Pushrod Ø 9 → 11.1, nominal length 246 → 244 (the lifter node in the same file is geometrically unchanged — its radius and height are decoupled from the pushrod radius per §5.2 item 4, holding 11.925 mm / 35.1 mm) |
| `val_rocker_stock.glb` | **Regenerates** | Per-channel cup W −19/+19 → −16.9/+13.6 |
| `val_bridge_stock.glb` | **Byte-identical required** | No input it consumes changes (pair spacing, row offset, bridge thickness, stem geometry all unchanged) |
| `fuel_injector_c1_stock.glb` | **Byte-identical required** | No input it consumes changes |

Byte-identity is checked by hash against `main` at verification (§9) and recorded in `docs/M7-MEASUREMENTS.md`. If regeneration changes either file's bytes (e.g. exporter nondeterminism), stop and report — do not hand-tune.

### 5.4 Budgets and exterior check

- Re-measure per-file and assembly triangle counts after regeneration (caps from M2: ≤ 15,000 per file, ≤ 60,000 assembly) and the D-033 scene budgets on both tiers (desktop ≤ 360k scene tris / ≤ 250 draw calls / ≤ 64 MiB / 60 FPS; phone ≤ 320k / ≤ 120 / ≤ 32 MiB / ≥ 30 FPS). Journal/valve changes move counts only slightly; the main shaft is a fixed-segment lathe (36 segments) so its triangle count is unchanged by the radius. Record everything in `docs/M7-MEASUREMENTS.md` in the M2–M4 format.
- **Exterior shell:** untouched (no re-registration, no rescale). `docs/M7-DATA.md` records the §2.4 comparison (registered spans vs DieselHub's approximate published dimensions) as a documented observation.

## 6. Tests

Existing suite: all tests pass with only the five named changes of §4.5 (which also name layout test 5 as deliberately unmodified). New tests:

1. **`src/config/verifiedData.test.ts` (new file)** — pins the M7 upgrades so they cannot silently regress:
   - `engineConfig.rodLengthMm` = 163.0 with confidence `published`; `crankThrowMm` = 49.5, `published`.
   - `detailConfig`: `pistonCompressionHeightMm` 49.8, `wristPinDiameterMm` 34.5, `pinJournalDiameterMm` 62.9, `mainJournalDiameterMm` 79.9, `valveIntakeHeadMm` 33.0, `valveExhaustHeadMm` 31.0 — each with confidence `published`; `pushrodDiameterMm` 11.1 `published`; `pushrodLengthMm` 244 `placeholder`; `lifterBodyDiameterMm` 23.85 `placeholder` (the decoupled lifter value, §2.3 — pinned so the decoupling cannot silently revert to the 2.65× derivation).
   - **Derivation identities:** `intakeMaxLift` ≈ `lobeLift × rockerRatioIntake` within 0.05 mm; `exhaustMaxLift` ≈ `lobeLift × rockerRatioExhaust` within 0.05 mm; `rockerCupIntakeValleyOffsetMm` ≈ `valveRowOffsetMm / rockerRatioIntake` within 0.1 mm; same for exhaust. (These pin the *relationships*, so a future editor cannot change one side of a derivation without the other.)
   - **Stack identity:** `crankThrowMm + rodLengthMm + pistonCompressionHeightMm` = **262.3** ± 0.01 (crown at TDC), and + `deckGap` = **264.3** ± 0.01 (deck plane).
   - `valveConfig.maxLift` no longer exists on the config object, and `rockerTailValleyOffsetMm` no longer exists on `detailConfig` (guards against half-finished renames).
2. **Clearance, per valve (extends the M1 test's role):** add to the new test file (driving `pistonValveClearanceM` from the core, cylinder 1, 0.25° steps over 0–720°): intake minimum within **1.80 ± 0.05 mm**; exhaust minimum **≥ 1.99 mm** over the cycle and its minimum over the open window (110°–350°) within **2.98 ± 0.05 mm**; both ≥ 0 everywhere. (The existing M1 clearance test in `kinematics.test.ts` stays as-is and must also pass.)
3. **Regeneration honesty:** the glbContract dimensions-sync test (§4.5.1) already forces `dimensions.json` (43 keys) to equal the configs exactly; the glbContract bounds tests re-run against the regenerated GLBs (piston height ≤ CH + 25 with the new CH; crankthrow pin length still `pinJournalLengthMm` ± 2). No new GLB test code is needed beyond §4.5.1 — but the closing summary must report each regenerated file's triangle count and the two byte-identity hashes (§5.3).

## 7. Documentation and plan paperwork (build deliverables)

1. **`docs/M7-DATA.md` (new):** (a) the verified data table — every §2 value with its survey source and grade (A/B/C) and the survey section reference; (b) derivation records — valve lift (lobe × ratios), cup offsets (row offset ÷ ratios), the §3 deck stack, the §2.4 not-adopted register with reasons; (c) the still-illustrative register: bore spacing, deck height/protrusion, cam duration/LSA/timing events, valve springs, lifter diameter, lifter gallery placement, head internal geometry, modeled crank pin length and rod seat offsets, detailed part shapes, exterior shell scale — each with the survey's verdict; (d) the exterior-dimensions comparison of §2.4; (e) a note recording why "shared-pin crank layout" leaves the §4.4 banner: the survey upgraded the layout itself to structurally certain from published widths — one rod big end is 28.4 mm wide on a ~55–57 mm pin, which admits only the two-rods-per-pin reading (survey §6) — while the modeled pin length (58 mm) and rod seat offsets (±14.2 mm) remain M3-derived values, not published ones, and stay in the register (c) as such.
2. **`docs/M7-MEASUREMENTS.md` (new):** regeneration record — per-file triangle counts before/after, the two byte-identity hashes, the script's logged deck B (264.3) and recess-window assertion output, and the D-033 budget table for both tiers (M2–M4 format).
3. **`docs/PLAN.md`:** add milestone 7 after milestone 6, in the plan's format:
   > 7. **Verified LLY data**
   >    - Replace illustrative placeholder dimensions with published values where credible sources exist (L7 data survey), upgrading provenance labels; per-valve lift from published lobe lift and rocker ratios; geometry regenerated from the upgraded config; disclaimer banner reduced to what remains illustrative.
   >    - Exit: upgraded values pinned by config tests with sources in `docs/M7-DATA.md`; piston-to-valve clearance recomputed, non-negative across 720° for both valves; budgets still pass.
   and amend the "After 6:" line to "After 7:".
4. **`docs/DECISIONS.md`:** add, under a new dated heading for the M7 spec:
   > - **D-035 Verified-data upgrades (Milestone 7).** The L7 survey (2026-11-13) confirmed or supplied published values adopted at M7: rod length 163.0 mm (confirmed, four sources), piston compression height 49.8 mm and wrist pin 34.5 mm (MAHLE OE), crank journals 62.9 mm (pin) / 79.9 mm (main), valve diameters 33.0/31.0 mm, GM lobe lift 0.281 in with rocker ratios 1.36/1.69 giving derived valve lifts 9.7/12.1 mm. Per-valve lift required a minimal `src/core/kinematics.ts` change (per-valve max-lift reads; no signature or interface change — `interfaces.ts` untouched). The deck plane re-bases to the published-parts crown stack 262.3 mm + the retained 2.0 mm deckGap assumption (protrusion unpublished). Manton's published pushrod overall length (239.5 mm) is **not** adopted: it is an overall measure whose endpoints the sim places from unpublished gallery geometry. The exterior shell is **not** rescaled to DieselHub's approximate published dimensions: its scale is the M3 containment registration, and the published figures are approximate/single-source (recorded as an OPEN_ITEMS watch item). Bore spacing, deck height, cam timing, lifter dimensions, and gallery placement have no public source and remain labeled placeholders.
5. **`docs/OPEN_ITEMS.md`:** (a) **close** the "Rod length" item (answer recorded in D-035 and config, per the file's own rule); (b) **amend** the "Bore pitch / bank stagger, deck height, cam center" item to: "Bore pitch / bank stagger and deck height — surveyed 2026-11-13 (L7 survey): no published source exists; remain illustrative placeholders. Cam timing events/duration/LSA — same survey: not published; lobe lift is published and adopted at M7 (D-035), timing remains placeholder."; (c) **add** a watch item: "Exterior shell scale vs published approximate dimensions (≈762 × 762 × 813 mm, DieselHub) — registered shell spans 1,174.9 × 1,095.2 × ≈807.5 mm; height agrees, X/Y exceed because registration is containment-driven (M3) and the published conventions exclude the fan and sump variation. Not rescaled at M7 (D-035); revisit only with a dimensioned source." The torque-curve, boost/rail, and injector-flow items are **not** M7's scope and stay as they are.

## 8. Frozen files

**Frozen — no changes:** `src/perf/**` (model, config, resolver, tests — the M5 calibration and M6 behavior are untouched), `catalog/**`, `src/core/interfaces.ts`, `src/core/index.ts`, `assets-src/fixture/**`, `assets-src/PROVENANCE.md`, `public/models/fuel_injector_c1_stock.glb` and `public/models/val_bridge_stock.glb` (byte-identical outputs, §5.3), the exterior GLB and `public/legacy/**`, prior milestone docs (`docs/M2-MEASUREMENTS.md` … `docs/M6-PARTS.md`, `docs/specs/**`), and all existing tests **except** the five named in §4.5. **Changed (expected):** `src/config/engineConfig.ts`, `src/config/valveConfig.ts`, `src/config/detailConfig.ts`, `src/config/index.ts` (only if it names changed fields), `src/core/kinematics.ts` (§4.1 only), `src/renderer/layout.ts` and `src/renderer/engineScene.ts` (§4.3 only), `src/ui/engineControls.ts` (subtitle + banner only), `assets-src/dimensions.json`, `assets-src/blender/build_cylinder1.py` (§5.2 only), the 8 regenerated GLBs, new `src/config/verifiedData.test.ts`, the 5 named test changes, and the §7 docs (new `docs/M7-DATA.md`, `docs/M7-MEASUREMENTS.md`; edits to `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`). If you believe any other file must change, stop and report it instead of changing it.

## 9. Acceptance criteria (Buckley verifies from a fresh clone + deployed site)

1. **Frozen audit:** diff against `main` touches only §8's changed list; `interfaces.ts` and `src/perf/**` byte-identical; bridge and injector GLB hashes identical to `main`.
2. **Fresh-clone gates:** `npm ci`, typecheck, full test suite (existing + new, with only the §4.5 test changes), and production build all pass.
3. **Independent stack and clearance recomputation:** Buckley re-runs §3 from the *shipped configs* (not the summary): crown 262.3, deck 264.3; a 0.01°-step sweep of `pistonValveClearanceM` (or an equivalent harness) reproduces intake min ≈ 1.80 mm @ ~362° and exhaust open-window min ≈ 2.98 mm @ 350°, nothing negative. The build script's log shows deck B = 264.3 and the recess-window assertion passing.
4. **Data spot-check:** every §2 value in the shipped configs matches `docs/M7-DATA.md` and its survey section (rod, CH, pin, both journals, both valve diameters, lifts, ratios, cup offsets).
5. **Budgets:** `docs/M7-MEASUREMENTS.md` shows per-file/assembly counts within M2 caps and both D-033 tiers passing; Buckley spot-checks the deployed build's stats readout against it.
6. **Deployed check:** subtitle reads "Milestone 7 — Verified LLY Data"; the banner matches §4.4 **verbatim**; the engine runs with visibly asymmetric valve motion (exhaust lift > intake lift at their peaks); explode/cutaway/x-ray/labels, the dyno and build comparison, and the M5 footnote are unaffected; no console errors.

## 10. Handoff

Work on branch `m7-verified-data` in the local clone. Regenerate GLBs with the project's Blender by running the updated `assets-src/blender/build_cylinder1.py` (it reads `assets-src/dimensions.json` — regenerate the JSON from the updated configs first, per the M2 discipline). When done, push the branch and send a closing summary covering: files changed, test/typecheck/build results, per-file triangle counts and the two byte-identity hashes, the script's logged deck B and recess-window output, the §3 clearance minima as measured by the shipped tests, and anything that deviated from this spec. Buckley verifies, opens the PR, and merges. Local environment: Node 24; no new npm dependencies.

## 11. Pre-build self-check (recorded)

Buckley recomputed every number in this spec from the survey and the shipped code before writing it (Python sweep replicating `pistonValveClearanceM`/`valveWindowLiftM` exactly, 0.01° steps, endpoints included):

- **Control run (old config, lift 12/12):** intake min **1.743 mm @ α = 362.59°** — reproduces the M1 spec's recorded ≈1.74 @ ≈362.6°, validating the sweep harness against a known answer before trusting it on the new values.
- **New config:** intake min **1.802 mm @ 362.00°**; exhaust min over the open window **2.979 mm @ 350.00°**, cycle min exactly 2.000 (closed valve, = deckGap). Overall minimum **+1.802 mm** — the stack closes; no §2 value was adjusted to make it close, and `deckGap` is the same 2.0 carried since M1.
- **Stack:** 49.5 + 163.0 = 212.5; + 49.8 = **262.3** (matches the survey's independent derived stack to the tenth); + 2.0 = **264.3**; Δ vs 266.5 = **−2.2** everywhere deck-derived. Shaft B 374.3; pushrod ΔB 244.3; true pushrod rest lengths from the shipped layout points: intake (56, 36, 130)→(60, −16.9, 374.3) = **250.0 mm**; exhaust (−35, 55, 130)→(−60, +13.6, 374.3) = **249.0 mm** (the config's 244 is the M2 nominal-ΔB convention, not either true length — recorded so nobody mistakes it for an error).
- **Derivations:** lobe 0.281 in × 25.4 = 7.1374 → config 7.14; × 1.36 = 9.71 → 9.7; × 1.69 = 12.07 → 12.1. Cups: 23 / 1.36 = 16.91 → 16.9 (modeled ratio 23/16.9 = 1.361); 23 / 1.69 = 13.61 → 13.6 (23/13.6 = 1.691). Rounding error ≤ 0.1% on both ratios.
- **Rod/journal clearances:** big-end half width = 0.22 × 62.9 = 13.84 → inter-rod gap = 2 × (14.2 − 13.84) = **0.72 mm > 0** ✓; pin-end margin = 29 − (14.2 + 13.84) = **0.96 mm > 0** ✓ (pin length 58 and seat offset 14.2 retained). Big-end outer radius = 1.34 × 31.45 = 42.1 → closest approach to the crank axis 49.5 − 42.1 = 7.4 mm (was 9.3) — unchanged in kind from the M3 continuous-shaft design. **Radial clearance checks** (replicated from `computeLayoutClearancesMm` on the full M7 geometry — per-channel cups −16.9/+13.6 at B 374.3, swept band [88.5, 262.3]; the replication first reproduced the current config's known-passing values): piston radius = 0.5 × (103 − 0.15) = **51.425**. Pushrod threshold = 51.425 + 5.55 = **56.975** — own intake 58.629 (**+1.654**), own exhaust 58.459 (**+1.484**), neighbor intake **57.307 (+0.332 — the thin margin of the milestone; positive, and pinned by layout test 4's threshold assertions, §4.5)**, neighbor exhaust 74.017 (+17.042). Lifter threshold, with the §4.3 decoupling holding the lifter body radius at 11.925: 51.425 + 11.925 = **63.35** (unchanged from M3) — own intake 66.573 (+3.223), own exhaust 65.192 (+1.842), neighbor intake 69.116 (+5.766), neighbor exhaust 97.082 (+33.732). Coupled instead, the lifter threshold would be 51.425 + 14.7075 = 66.1325 > 65.192 — the failure the decoupling exists to prevent. Layout test 6's distances under M7: cross-cylinder pushrod **26.018 > 25** ✓; nearest lifter spacing **30.610 > 30** ✓.
- **Head recess windows (hand-check of §5.2.2):** with per-channel cups and ΔB = 244.3, at slab heights (B ≈ 265–277) the neighbor-intake line crosses at W ≈ +5.8 (window [−8, +11] ✓) and the own-exhaust line at W ≈ +31.4 (window [+26, +41] ✓) — windows expected unchanged; the build script's logged assertion is the enforcement.
- **Contradictions found while drafting (all resolved in the spec, none silently):** (1) there is **no** `mainJournalDiameterMm` anywhere in the shipped code — the main radius is a 1.08× pin factor in *both* the Blender script and `layout.ts`, so adopting 79.9 needs the new config field plus both rewirings (§2.3, §4.3, §5.2) and the `layout.test.ts` test-7 change; (2) the published pushrod length (239.5) is an overall measure and is **not** adopted (§2.4) — adopting it would have required moving the unpublished lifter gallery; (3) `ProvenancedValue.confidence` has no `'derived'` member and `interfaces.ts` is frozen, so derived values are labeled `published` with "derived:" source strings (§1); (4) the survey's ≈807.5 mm shell height agrees with DieselHub's ≈813, but X/Y do not — recorded as a watch item, not a rescale (§2.4, §7).
