# Milestone 14 Spec — Stock Vehicle-Side Hardware (Airbox, Radiator/Shroud, Intercooler, Exhaust)

Repo: `colinstephens93/CarbonDuramax` · Build branch: **`m14-vehicle-hardware`** (create from `main` at `002b2c2`) · Planning branch: `plan/m14-vehicle-hardware` · Planning package: this spec + [`docs/research/M14-vehicle-hardware-survey.md`](../research/M14-vehicle-hardware-survey.md); the independent D-037 QA record is produced by a separate agent after this draft · Plan reference: **new milestone, not in PLAN.md v2.2** — Milestone 14 is added by this spec's paperwork deliverables (§12.1), per the anti-drift rule, and discharges the post-M13 candidates line (`docs/PLAN.md:83`) and the OPEN_ITEMS stock-vehicle-side-hardware item (`docs/OPEN_ITEMS.md:19`, `:31`).

**What changes in one sentence:** the app gains a **default-off `Vehicle` view** that shows the stock truck-side hardware around the engine — the RH front airbox and its outlet collar (the existing M10 intake duct is the routing), the radiator and fan shroud registered to the shipped fan, the stock intercooler core at its **photo-implied front-stack placeholder position**, and a representative 3.5-inch exhaust continuation from the measured downpipe exit — while the engine's detailed internal assembly is hidden, so the hardware can be full-fidelity without touching the 9,100-triangle phone headroom; the dual-generator idler and medium-duty oil filler/filter arrangement are recorded **OUT** with reasons, and **D-033 is not amended**.

**Coding is done by the user in Antigravity on branch `m14-vehicle-hardware`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

---

## 1. What Milestone 14 is

Milestones 0–13 shipped the engine, views, performance model, catalog, verified data, five external/piston visual variants plus the forged rods, sound, the rebuilt exterior shell, capped cutaways and the optional intake cover. The engine sits in a **studio void**: the M10 shell ends at the engine-mounted intake duct, the engine-mounted charge pipes and the turbo downpipe. There is no airbox, no radiator or fan shroud, no stock intercooler core, and no exhaust beyond the downpipe (survey §2.4). M14 adds those stock truck-side parts as **vehicle context**, not as a catalog variant.

1. **Five in-scope parts, one display state.** The **airbox** (body/lid/forward snorkel/outlet collar at the measured `if_airbox_mount`), the **radiator** (published replacement core envelope), the **fan shroud** (registered to the measured M10 fan), the **stock intercooler core** (published stock-size replacement proxy, front of the radiator stack), and the **exhaust continuation** (3.5 in from the measured downpipe exit, representative muffler/tailpipe). §2, §7.
2. **A `Vehicle` Views control, default off.** When on and Exterior or X-Ray is active, the scene enters the vehicle context: the detailed internal assembly and main shaft are **not rendered**, the exterior shell and the stock hardware are shown, and the M12 cover shows if enabled. **Exception:** the explicitly unsupported `intake_highflow` combination suspends the Vehicle context (OD-2). When off (or when Exterior/X-Ray is off, or the hardware fails to load), the existing engine view is restored exactly. §5.
3. **A state-aware budget accounting.** The engine state keeps its measured **310,900** / derived **319,128** guard; the vehicle state has its own conservative guard **81,164**; the global guard is `max(319,128, 81,164) = 319,128`, so the phone headroom remains **872 triangles**. The **31,400-triangle** hardware cap is **not** added to the engine guard because the two states are mutually exclusive; if they ever co-render, the combined cap would be **350,528 / 320,000** — the exact failure the state test catches. **No D-033 amendment.** §4, §7.
4. **One scene-placed stock asset, lazy-loaded.** `public/models/vehicle/vehicle_hardware_stock.glb`, one root, five part groups, four untextured `MeshStandardMaterial`s, four `if_vehicle_*` markers, **≤ 31,400 triangles**, **≤ 1,200 KiB**, **+8 draw calls**, 0 texture bytes. The hardware GLB is **not fetched at startup**; the stock startup payload changes only by the recorded JS-module delta (no new asset bytes). §7.
5. **A small refactoring, not a contortion.** A pure `src/renderer/sceneContext.ts` resolver owns the visibility matrix (`internalVisible`, `vehicleHardwareVisible`, shell, cover, ghosting, effective explode), and a thin, Three.js-free `applySceneVisibility()` applies it to the scene graph. The frozen M12 `syncExteriorShellState` body is preserved verbatim; `syncSceneContext()` is the one new application point. It is the R1 refactoring priced in §4.4 and is part of OD-1. §5.1.
6. **Two OUT items with reasons.** **Dual-generator idler:** no stock LLY 2500HD fitment or GM part/RPO drawing located; the owner's LLY photos show one alternator; aftermarket dual-alternator brackets are not stock and would open the frozen M10 belt layout. **Medium-duty oil filler/filter:** the C4500/C5500 medium-duty chassis, not the 2500HD pickup; the pickup's oil fill and fuel filter are already in the M10 shell. §2.6–§2.7.
7. **Stock scene unchanged.** With `Vehicle` off, the vehicle hardware group is never loaded or added; the internal assembly, main shaft, shell, M12 cover, M8 variants, section caps and labels behave exactly as at M13. The 3D viewport content of RF-1…RF-22 is unchanged. The full-page PNGs change only because a new Views control is added; the build re-captures them and a reviewer compares the 3D region **manually** with the changed control/title/subtitle masked (the M12 QA-10 precedent; no automated masked pixel-diff is claimed). §5.5, §8.4.

**Non-goals for M14:**

- **No new catalog slot or entry.** The 12-slot list (D-032) and the 24-entry catalog are unchanged; `catalog/stock.json`, `catalog/modified.json`, `catalog/schema.json` and `src/catalog/**` are frozen. `src/core/interfaces.ts` (D-010) is untouched.
- **No performance-model change.** `src/perf/**` is frozen; stock vehicle hardware changes no dyno number.
- **No M8 variant change.** The five M8 GLBs, their `modelPath`/`explodeVectorMm` values, their bounds and their service points are frozen. V4 is not moved to the stock-core position (OD-2).
- **No M10 shell rebuild.** The shell, its 22 groups, its 37,100-triangle cap, its seven `if_*` datums and its M10 proof frames are frozen. M14 is additive.
- **No real wall-thickness section geometry.** The hardware caps are the M11 solid/diagrammatic convention; the shroud is excluded from caps, with the reason in §6.2.
- **No new label anchor.** The 23 anchors and the label rules are frozen except for the `vehicleContext` suppression rule in §6.4.
- **No new render pass, stencil buffer, render target, shader trick or npm dependency.** The hardware uses the existing renderer and cap builder.
- **No vehicle body, frame, hood, grille, condenser, charge-pipe route, brake/fuse/battery hardware or exhaust hangers to the frame.** The hardware is a representative engine-bay context, not a complete truck.
- **No physical-access or measured-part claim.** Only the radiator core, intercooler core and exhaust diameter are published; everything else is a labeled placeholder.

---

## 2. Per-part scope and verdicts

The survey (§§4–10) carries the graded evidence. This section records the decision and the placement basis for each item. The owner's photographs are **PHOTO EVIDENCE for layout only**; no dimension is scaled from them (survey §3).

**Governing rule applied here:** realism/looks outrank dimensional fidelity. Where a published dimension would produce an implausible bay — the 1,158.2 mm radiator overall width against the stock airbox — the spec preserves the photo-plausible placement and records the published value as **not adopted**. Where no published dimension exists, the spec uses a **labeled placeholder** and does not hunt for a number that likely does not exist. Published values are design facts; everything else is labeled.

### 2.1 Airbox and intake routing — **IN**

**Decision: model the airbox body/lid/forward snorkel and a short outlet collar; do not duplicate the intake routing.** The M10 `intake` group already runs from the compressor mouthpiece to `if_airbox_mount` (587.4, −510.5, 371.9), with 0.0000 mm nearest-vertex contact at the cuff. M14 adds only the box, its collar and a body inlet boss. The stock filter is not modelled (inside an opaque box; dimensions not published).

**Placement basis:** body X 600–800, Y −820…−560, Z 240–520 mm; lid on top; snorkel forward to X 860; **70 mm collar** (outer envelope radius 44.45, bead rings modelled within it) from the measured marker along its normal (0.882820, −0.441410, −0.160513) to (649.197, −541.399, 360.664), seating in a **body inlet boss** at X 636.4–736.4, Y −560…−535, Z 303.9–403.9. The collar end is inside the boss, which is attached to the body's inboard face; the body face itself is at the 112.141 mm normal-ray entry, so the boss bridges the remaining 42.141 mm. This is a **photo-plausible labeled placeholder** (survey §4), not a GM-dimensioned airbox. The airbox group AABB including the collar and boss is **X 566.52–860, Y −820…−470.61, Z 240–520 mm**. The body is outboard of the radiator (60 mm Y gap) and the intercooler (40 mm Y gap); the smallest body/lid/snorkel shell clearance is **29.180 mm** to `ext_intake_duct` at the intended collar zone; excluding the 70 mm collar region it is **97.115 mm** (self-check §15.5). The collar's surface passes the radiator RH rear corner, which carries an **8 mm deep × 50 mm tall × 15 mm long relief** (X 650–665, Y −500…−492, Z 340–390) so the collar-to-radiator surface clearance is **5.35 mm**; without the relief the planned collar would graze the tank by 2.65 mm (self-check §15.5).

**Published:** the assembly identity (GM 25873812, listed for a 2004 3500 6.6L Duramax diesel) and filter fitment (ACDelco A3087C, 2001–2005 LB7/LLY), grade A/C. **Not published:** every dimension. **Not adopted:** any aftermarket 4 in duct diameter (the M10 duct is frozen).

### 2.2 Radiator — **IN**

**Decision: model a closed core/tank assembly using the published replacement core, at the measured front-stack position behind the fan.** The Mishimoto MMRAD-DMAX-01 is a 2001–2005 Duramax direct-fit replacement (grade C, not a GM drawing): core **865.1 × 498.1 × 55.9 mm**, 2 rows, inlet/outlet **48.0 mm**. The 1,158.2 mm overall width is **recorded but not adopted**: it is the replacement's bracket/tank envelope and would intersect the stock airbox location; the 865.1 mm core is adopted.

**Placement basis:** X 650–706 mm (rear face 32.2 mm ahead of the fan front 617.8), Y ±500 mm, Z −108…420 mm (core 498 mm tall centred on the fan axis at Z = 156; the top/bottom tanks bring the assembly to the published 528.3 mm overall height). Tanks, necks, cap, drain and brackets are **labeled placeholders in form**; the core envelope is published. The radiator front face is 6 mm behind the intercooler rear face. The shroud flange contacts the radiator rear face at X = 650 (intended). The RH rear tank corner carries the **8 mm deep × 50 mm tall × 15 mm long collar relief** defined in §2.1; it is a shallow external chamfer, not a through-hole, so the radiator remains a closed cap source. The relief does not change the radiator AABB (Y ±500).

### 2.3 Fan shroud — **IN**

**Decision: model a two-piece annular plastic shroud registered to the shipped M10 fan, not to an aftermarket diameter.** The measured fan is centre **(0.0, 156.0) mm**, outer radius **212.0 mm**, blades **X 570.0–617.8**; the M10 record gives 9 blades and hub radius 72.0; the clutch is X 472.0–570.0, radius 68.0 (bound 72.0). The shroud uses inner radius **222.0 mm** (10.0 mm radial clearance), outer radius **252.0 mm**, axial span **X 610–650 mm**, flange at X = 650. The rear lip overlaps the fan axial span by **7.8 mm**; the clutch clearance is **40.0 mm**.

**Published:** OER A56217 upper-shroud fitment for 2001–2005 diesel (grade C); Dorman 620-993 lower-shroud fitment (grade C). **Not published:** all dimensions. **Not adopted:** Dorman 620-992's 560.1 mm max-blade-diameter listing (survey §6.1 conflict); a 560 mm shroud around the shipped 424 mm fan would be visibly wrong. The shroud is **clipped without caps** in Section view (§6.2), because chord-closing its open ring would fill the fan aperture with a false disc.

### 2.4 Stock intercooler core — **IN**, with an explicit variant reconciliation

**Decision: model the stock core in its front-stack position, with inlet/outlet stubs only, and show it only when the `intercooler` slot is stock and the Vehicle context is active.** The CSF 6007 is a stock-size OE-replacement proxy (grade C, not a GM drawing): core **952.5 × 466.7 × 47.6 mm**, **76.2 mm (3 in)** inlet/outlet. The core is placed at **X 712–760, Y ±520, Z −100…410 mm**, in front of the radiator. **This front-stack position is PHOTO-IMPLIED and NOT PUBLISHED** — the core is hidden behind the grille/condenser in every cited owner photo, and X 712–760 / Y ±520 / Z −100…410 is a **labeled placeholder, not a GM mounting datum** (survey §7.1, §7.2, §12). Charge pipes are not fabricated: the M10 `boostPipe` still ends at `if_hot_side_inlet` (374.6, 474.8, 146.6), which is **337.4 mm** behind the stock core's rear face and **474.8 mm** outboard of its centre. This is a recorded limitation, not a silent gap.

**The M8 conflict.** V4 (`intercooler_upgraded`) is at X 80.55–682.00, Y 472.68–696.00, Z −20.00–338.00 mm, attached at the documented `if_hot_side_inlet` service point. The two envelopes do not intersect (minimum X separation **30.00 mm**), but they are two different intercoolers. Showing both would put two cores in one bay; moving V4 to the stock-core position would invalidate the M8 asset, its mating datum, its bounds and RF-8/RF-9. **OD-2** therefore makes the stock core yield to `intercooler_upgraded`; V4 stays frozen. If the owner wants a stock-position V4, that is a future M8 asset change and this spec is withdrawn and revised before the build.

**The V2 conflict.** The frozen `intake_highflow` tract (`public/models/variants/intake_tract_engine_highflow.glb`, 2,560 triangles) has **14 vertices inside the stock radiator envelope** and **6 vertices inside the stock intercooler envelope** after the project conversion (self-check §15.5). The stock airbox hides for V2 at M8, but the radiator and intercooler have no variant, so a `intake_highflow` + Vehicle state would render the frozen cone/tract through the stock front stack. M14 therefore makes that combination **explicitly unsupported** (OD-2): when V2 is active/loaded and Vehicle is on, the Vehicle context is suspended (internals visible, all five stock hardware parts withheld) and the UI note says so. This is the honest fix for a representative stock stack that is not shaped around V2; a future M8 asset change or a measured stock front stack can revisit it.

### 2.5 Exhaust beyond the downpipe — **IN**

**Decision: model a representative 3.5 in (88.9 mm) continuation from the measured downpipe exit.** The flange mates at **(−222.0, −162.0, −18.0) mm** over the measured **closed 14-vertex / 14-triangle flat cap** (0 boundary edges; 405 vertices, 800 triangles in the welded downpipe mesh), radius **44.45 mm**, measured plane normal **(−0.0059, 0.0892, 0.9960)** (≈ +Z, 5.1° off vertical; the flange is authored to the measured normal, not an idealized +Z). The run goes down and rearward: flange, a short bend, a **Ø220 × 340 mm** representative muffler, a tailpipe with an over-axle-style rise, a rolled/slash-cut tip, and two saddle-clamp hanger stubs. Its centreline is defined in §7.4 and §15.5; the full part AABB is **X −1,364.45…−161.97 mm, Y −345.0…−101.79 mm, Z −220.0…+84.45 mm** (the centreline tip is at X = −1,320; the AABB includes the 44.45 mm pipe radius).

**Published:** stock 3.5 in turbo-back diameter and system form (grade B/C). **Not published:** muffler, tailpipe, hanger and tip dimensions; all are labeled placeholders. The run is a representative section, not a chassis-verified cat-back. The smallest exhaust-to-floor clearance is **25.0 mm** at the muffler (muffler bottom Z = −220; M10 minimum 21.4 mm); the pipe centreline minimum is Z = −160 (surface bottom −204.45, floor clearance 40.55 mm). The smallest exhaust-to-shell surface clearance excluding the intended 100 mm exit collar is **58.051 mm** (self-check §15.5; the route is fully specified there). This is a planning computation; the build re-runs it.

### 2.6 Dual-generator idler — **OUT**

**Recorded reason:** no stock 2005 LLY 2500HD dual-generator idler, part number or GM RPO/upfitter drawing was located; the owner's LLY bay photos show **one alternator**; the M10 front drive is a single-alternator 9-pulley layout. The aftermarket Mechman dual-alternator bracket and the Ford 6.0L dual-alternator idler are **different systems, not stock**. Modelling the idler would require re-routing the frozen M10 belt and adding a second alternator the photos do not show. No geometry, no catalog entry, no toggle. Recorded in D-049 and OPEN_ITEMS.

### 2.7 Medium-duty oil filler/filter arrangement — **OUT**

**Recorded reason:** the C4500/C5500 Kodiak is a **medium-duty chassis/engine installation**, not the 2500HD pickup. The pickup's oil-fill neck/cap and fuel-filter head are already in the M10 shell (`oilFill`, `fuelFilter`). Modelling the medium-duty arrangement on a 2500HD would fabricate an installation. No geometry, no catalog entry, no toggle. Recorded in D-049 and OPEN_ITEMS.

### 2.8 Verdict table

The brief names six items; the radiator and shroud are one brief item split into two part rows so each placement basis is explicit (rows 2 and 3).

| # | Brief item | Part | Verdict | Placement basis | Reason / limitation |
| ---: | --- | --- | --- | --- | --- |
| 1 | Airbox + routing | Airbox body/lid/snorkel + collar | **IN** | Collar at `if_airbox_mount` (587.4, −510.5, 371.9), 70 mm to a body inlet boss; body X 600–800, Y −820…−560, Z 240–520; group AABB X 566.52–860, Y −820…−470.61, Z 240–520; M10 duct is the routing | Dimensions **NOT PUBLISHED** → placeholder; filter omitted; collar/boss intended mate |
| 2 | Radiator + shroud | Radiator | **IN** | X 650–706, Y ±500, Z −108…420; published 865.1 × 498.1 × 55.9 core; RH rear-corner 8 mm collar relief | GM dimensions **NOT PUBLISHED**; 1,158.2 overall width not adopted; mounts/hoses omitted |
| 3 | Radiator + shroud | Fan shroud | **IN** | Centre (0,156), inner 222, outer 252, X 610–650; 10 mm radial over the measured 212 fan | Dimensions **NOT PUBLISHED**; Dorman 560.1 mm listing not adopted; clipped without caps |
| 4 | Stock intercooler core | Stock intercooler core | **IN** | X 712–760, Y ±520, Z −100…410; CSF 6007 952.5 × 466.7 × 47.6, 76.2 stubs; **front-stack position photo-implied / labeled placeholder, not a GM datum** | GM dimensions **NOT PUBLISHED**; core hidden in photos; charge pipes omitted; stock-only (OD-2) |
| 5 | Exhaust beyond downpipe | Exhaust continuation | **IN** | Flange at (−222, −162, −18) over the closed 14-triangle cap; 88.9 pipe, Ø220 × 340 muffler; AABB X −1,364.45…−161.97, Y −345…−101.79, Z −220…+84.45 | Diameter published; muffler/hangers/tip **NOT PUBLISHED** → placeholders; route defined in §7.4/§15.5 |
| 6 | Dual-generator idler | Dual-generator idler | **OUT** | — | No stock fitment/geometry; one alternator in photos; aftermarket systems are not stock; would open the frozen belt layout |
| 7 | Medium-duty oil filler/filter | Medium-duty arrangement | **OUT** | — | C4500/C5500 chassis, not 2500HD; pickup oil fill/fuel filter already in the M10 shell |

---

## 3. What the shipped app does today (measured, not assumed)

Source: this planning session on `main` @ `002b2c2`; binary GLB parses of every committed asset; `src/renderer/engineScene.ts` instance counts and cap registrations; `npx vitest run src` (the planning workspace's `.tmp/` clone excluded). Runtime draw calls, VRAM and p95 were **not** re-measured (no WebGL in this VM); the M12/M13 measured values are quoted only as a cross-check.

| Fact | Value | Where it comes from |
| --- | --- | --- |
| Existing suite | **114 tests / 23 files**, passing; `npm run typecheck` passes | this session, `npx vitest run src` |
| Current scene, stock exterior on | **308,324** = 270,080 internal + 1,080 main shaft + 64 ground + 37,100 shell | measured GLBs + code arithmetic |
| Current fullest state | **310,900** = 308,324 + (1,372−1,180)×8 + 1,040 | M13 rod 1,372, M12 cover 1,040 |
| Phone headroom (measured) | **9,100** (320,000−310,900), 2.844 % | this session |
| Desktop headroom (measured) | **49,100** (360,000−310,900), 13.64 % | this session |
| M13 derived cap guard | **319,128 / 320,000 phone**, 872 triangles (0.2725 %); desktop 40,872 (11.35 %) | `src/renderer/partVariants.test.ts` test 9 |
| M10 shell bounds | X −272.52…617.80, Y −549.86…480.66, Z −223.50…556.00 | measured shell GLB, world transforms applied (raw accessor axes are not project axes) |
| Fan | centre (0,156), r 212.0, blades X 570.0–617.8 | measured `ext_fan`; 9 blades / hub r 72.0 from the M10 record |
| Fan clutch | X 472.0–570.0, r 68.0 (bound 72.0) | measured `ext_fan_clutch` |
| Airbox mount | (587.4, −510.5, 371.9), normal (0.882820, −0.441410, −0.160513), cuff r 44.45 | `if_airbox_mount`, M10 0.0000 mm contact |
| Downpipe exit | (−222.0, −162.0, −18.0), r 44.45, normal (−0.0059, 0.0892, 0.9960) | measured `02_turbo_downpipe` **closed 14-triangle cap** (405 vertices, 800 triangles, 0 boundary edges) |
| V2 high-flow vs stock stack | 14 vertices inside the radiator envelope; 6 inside the intercooler envelope | measured `intake_tract_engine_highflow.glb`; OD-2 makes the combination unsupported (§2.4, §6.7) |
| Internal visibility | always rendered (`v8Batches.root` + `mainShaft`); no state hides them before M14; M14 adds the Vehicle context that hides both | `engineScene.ts` |
| Exterior context | `exteriorVisible` OR `xrayEnabled`; external variants and shell follow it | `engineScene.ts` |
| M11 cap skip | `isObjectAndAncestorsVisible(obj)` at `sectionCaps.ts:1910` skips hidden sources; `skipWhenGhosted` at `:1911` skips ghosted sources | `sectionCaps.ts` |
| Ghost registry | load-order safe; `register()` applies ghosting if already active | `intakeCover.ts` |
| Labels | 23 anchors; internal labels hide under the opaque shell, reappear under X-Ray | `viewLayout.ts:397–430` |
| Cap ceiling | `SECTION_CAP_MAX_TRIANGLES = 16_000` | `sectionCaps.ts:22` |
| Draw calls / VRAM / p95 | 98/60 stock+cover; 20.75/4.75 MiB; 16.8/17.0 ms M11 detail rows | M11/M12/M13 records; cross-check only |

The facts that drive the design: **the engine state has 9,100 measured triangles of phone headroom but only 872 under the cap guard**; **any new always-on capped asset larger than 872 triangles fails the existing guard**; **no internal batch can be hidden today**; and **the hardware is large enough that a full-fidelity package cannot be an always-on addition**. These facts make the display-model choice the milestone's central problem (§4).

---

## 4. The display model — evaluation, pricing, and OD-1

### 4.1 The constraint, stated exactly

D-033's phone scene-asset cap is **320,000 triangles per rendered frame**. The current fullest state is **310,900 measured**, but the M12/M13 budget guard is **cap-additive** and is **319,128**. A new hardware package `H` that is always co-visible with the engine is added to that guard:

```
319,128 + H ≤ 320,000  ⇒  H ≤ 872 triangles.
```

The measured 9,100-triangle headroom is **not** available to a new capped asset, because the guard uses the 1,400 rod cap (not 1,372), the 1,800 cover cap (not 1,040), and every M8 variant cap. A **9,100-triangle** package therefore **fails** the guard: `319,128 + 9,100 = 328,228 > 320,000`. This is the decisive arithmetic of the milestone.

### 4.2 The hardware package being priced

One scene-placed stock asset with the per-part caps below. The caps are design budgets, not measured assets; the build records actuals.

| Part | Triangle cap | Draw calls | Published vs placeholder |
| --- | ---: | ---: | --- |
| Airbox (body, lid, snorkel, collar, clips/ribs) | **5,600** | 2 | Identity/fitment published; all dimensions placeholder |
| Radiator (core, tanks, necks, brackets, cap/drain) | **6,400** | 2 | Core 865.1 × 498.1 × 55.9 published (replacement); form placeholder |
| Fan shroud (ring, flange, ribs, bosses, seam) | **4,800** | 1 | Fitment published; all dimensions placeholder, fan registration measured |
| Intercooler (core, tanks, stubs, fin strips, brackets) | **6,200** | 1 | Core 952.5 × 466.7 × 47.6 published (stock-size proxy); mounts placeholder |
| Exhaust (flange, pipe, muffler, tailpipe/tip, hangers/clamps) | **8,400** | 2 | 88.9 mm diameter published; everything else placeholder |
| **Total** | **31,400** | **+8** | 4 untextured materials, 0 textures, ≤ 1,200 KiB |

### 4.3 Options evaluated

#### (a) Vehicle-context view state — internals not rendered while hardware is shown

| Item | Assessment |
| --- | --- |
| Hardware triangles at phone / desktop | **31,400 / 31,400** (same asset; no LOD) |
| Budget treatment | The hardware cap lives in a **separate rendered state**. Engine guard 319,128; vehicle guard **70,364 stock / 81,164 conservative**; global `max = 319,128`; phone headroom **872**; **no D-033 amendment**. |
| Implementation cost | **M** — new pure state resolver + hardware module + loader + engineScene sync + UI + stats + 4–5 frames + tests (≈3–5 build sessions). |
| Risk | **Medium** — the state matrix, ghosting load order, cap sources and label suppression must all be right; the budget only holds if mutual exclusion is tested. **Cost:** internals and hardware can never be inspected together; the Vehicle view is a separate context, which is the deliberate trade for full fidelity. |
| Effect on existing views/tests | Vehicle off: byte-identical 3D scene. Vehicle on: internals hidden; shell/hardware/cover shown; hardware fixed under Explode; Section caps hardware; X-Ray ghosts it; internal labels suppressed. Adds state/budget tests; stock frames unchanged. |
| **Verdict** | **Recommended**, with R1 (§4.4). It is the only option that shows full-fidelity hardware on **both** tiers without raising D-033, and it turns the 9,100-triangle problem into a 249k-triangle vehicle-state headroom. |

#### (b) Default-off toggle with its own budget row — a scoped D-033 amendment (the M12 cover pattern, generalized)

| Item | Assessment |
| --- | --- |
| Hardware triangles at phone / desktop | **31,400 / 31,400** |
| Budget treatment | Hardware is co-visible with internals. Engine + hardware measured **342,300**; cap guard **350,528**. The **minimum** phone scene cap that passes is **350,528** (**+30,528** over 320,000; 109.54 %), or an additional **30,528-triangle** row. **360,000 is the desktop cap**, not the minimum; setting the phone cap to 360,000 is a conservative policy choice and gives **9,472** cap headroom / **17,700** measured headroom. |
| Implementation cost | **S–M** — a checkbox + visibility + cap sources; no internals state, no R1 (≈2–3 build sessions). |
| Risk | **Medium** — the phone frame cost rises by 31,400 triangles and 8 calls exactly when the user asks for more; the budget amendment sets a precedent that D-033 can be raised by optional content. |
| Effect on existing views/tests | Hardware co-renders with internals in every view; Section caps add; Explode leaves hardware fixed while internals explode through it; X-Ray ghosts both; labels unchanged. The D-033 guard test must be amended; every frame with hardware on changes. |
| **Verdict** | **Rejected.** It buys a 31,400-triangle optional package by raising the phone budget at least **9.54 %** (30,528 triangles), or 12.5 % if set to the 360,000 desktop cap, against D-025/D-033's purpose. If the owner explicitly wants co-visible hardware, this is the honest option and the amendment must be in OD-1; the spec does not assume it. |

#### (c) Quality-tier geometry — reduced-fidelity hardware on the phone profile

| Item | Assessment |
| --- | --- |
| Hardware triangles at phone / desktop | **9,100 / 31,400** (two LODs) |
| Budget treatment | Still co-visible with internals. Measured phone **320,000 exactly** (0 headroom); cap guard **328,228**, which is **8,228 over** 320,000. It needs the same phone-cap increase as (b) (minimum **350,528**), or a phone LOD of **≤ 872 triangles** (absurd). |
| Implementation cost | **L** — two assets, LOD selection, two sets of placements/caps/tests (≈5–7 build sessions). |
| Risk | **High** — the phone LOD still consumes the entire measured headroom, the cap guard fails, and the phone view looks crude in exactly the state the owner wants to look real. |
| Effect on existing views/tests | Same as (b) plus tier-dependent frames and a second asset contract; phone and desktop screenshots diverge. |
| **Verdict** | **Rejected.** It pays for two assets and still needs an amendment; the "looks win" goal is violated on the phone. |

#### (d) Budget reallocation from elsewhere — the actual donors and what they lose

| Donor | Current triangles | What a 31,400-triangle saving costs |
| --- | ---: | --- |
| Valve springs (32 × 3,464) | **110,848** | A 28.3 % reduction (3,464 → 2,483 per spring) saves **31,392** — 8 short of the 31,400 cap. **2,482 per spring saves 31,424** and clears by 24. The springs are a signature internal detail and the M11 spring-cap hulls are built from them; the stock GLBs and RF-1…RF-22 change. |
| Pistons (8 × 4,832) | 38,656 | An 81 % reduction destroys the piston detail; the M8 low-comp piston variant and M13 rod clearance depend on it. |
| Valve faces (32 × 1,040) | 33,280 | A 94 % reduction leaves flat discs; the valvetrain is a core view. |
| Heads (8 × 3,532) | 28,256 | Cannot yield 31,400 without deleting a head. |
| Exterior shell | 37,100 | An 85 % reduction destroys the M10 shell, its 22 groups and its M10 proof frames. |
| Main shaft / ground / cover | 1,080 / 64 / 1,040 | Too small to matter. |

| Item | Assessment |
| --- | --- |
| Budget treatment | No D-033 amendment if **at least 31,400** is freed; 2,482/spring saves **31,424**, while 2,483/spring saves **31,392** and is 8 short. The **stock scene changes**, so RF-1…RF-22 are re-baselined and the M10/M11/M13 asset tests change. |
| Implementation cost | **L** — donor geometry rebuild, cap re-derivation, frame re-baseline, test rewrite (≈4–6 build sessions). |
| Risk | **High** — it degrades the engine internals the app exists to show, and it violates §1's "stock scene unchanged". |
| **Verdict** | **Rejected.** The only donor large enough is the valve-spring set, and spending it on truck-side context is a bad trade; the "donors" are not spare geometry, they are the product. |

#### (e) A minimal-fidelity package sized to the ~9,100-triangle headroom as-is

| Item | Assessment |
| --- | --- |
| Hardware triangles at phone / desktop | **9,100 / 9,100** (box airbox, slab radiator, ring shroud, slab intercooler, pipe/muffler) |
| Budget treatment | **Fails the derived guard**: `319,128 + 9,100 = 328,228 > 320,000`; the measured state is exactly 320,000 (0 headroom). To pass the guard the package must be **≤ 872 triangles**, which is not a believable airbox + radiator + shroud + intercooler + exhaust. |
| Implementation cost | **S** — simplest asset (≈1–2 build sessions). |
| Risk | **Low** technically, **certain** to fail the guard and the look test. |
| Effect on existing views/tests | Same as (b) at a smaller scale; still needs a guard change or a 872-triangle package. |
| **Verdict** | **Rejected on arithmetic and looks.** It cannot pass the existing guard even at the measured headroom, and a 9,100-triangle five-part bay is boxes, not a believable LLY bay. |

### 4.4 Refactoring option R1 — a scene-state resolver

The clean answer is not a single new boolean in `engineScene.ts`; it is a small, pure **scene-context resolver** that owns the visibility matrix and makes the budget states testable:

- **New `src/renderer/sceneContext.ts`:** `SceneContextInput` (exterior, xray, vehicle, hardware load state, `frontStackConflict`) → `SceneVisibility` (`exteriorContext`, `vehicleContextActive`, `shellVisible`, `internalVisible`, `vehicleHardwareVisible`, `intakeCoverVisible`, `ghostShell`, `ghostHardware`). Plus `resolveEffectiveExplodeFactor(explodeFactor, vehicleContextActive)`, `resolveLabelContext(vehicleContextActive)` and a thin, Three.js-free `applySceneVisibility(targets, visibility, intakeCoverEnabled)` that sets only `{visible}` flags on the actual scene graph handles.
- **EngineScene** uses the resolver in one `syncSceneContext()` and calls `applySceneVisibility()` with `v8Batches.root`, `mainShaft.mesh`, `vehicleHardware.group`, `exteriorShell.group` and `intakeCover.group`. Stats report the **actual** scene-graph `.visible` flags, not the resolver return values, so a renderer that leaves the internals visible is caught (§9 test 1b, acceptance 4).
- **M12 compatibility:** the exact `syncExteriorShellState` body pinned by `src/renderer/intakeCover.test.ts:922` is preserved **verbatim** (`staticCapsDirty = true; exteriorGhostRegistry.setGhosted(xrayEnabled); syncIntakeCoverState(); if (!exteriorShell) return;`). `syncSceneContext()` is the single new application point for vehicle/internal/hardware visibility; the legacy duplicate `exteriorVisible || xrayEnabled` expression in the shell line remains only because the frozen M12 test pins the sequence. `intakeCover.test.ts` is **not** edited.
- **Cost:** one ~180-line pure module, one central sync function, UI/main wiring, and a truth-table + scene-graph test. **≈1–2 build sessions** beyond option (a)'s UI/asset work; **risk low**.
- **Why it is worth it:** without R1, the new vehicle matrix would be spread across the setters and stats and the "hardware + internals must never co-render" invariant would be a comment. R1 makes the resolved flags pure and the renderer application observable. The pure resolver's mutual-exclusion invariant is true by construction; the **scene-graph test 1b** is the test that can fail when the renderer is wrong.

This is a **bounded refactor**, not a rewrite of the views. The existing `exteriorVisible`, `xrayEnabled` and `intakeCoverEnabled` fields remain; the resolver derives the effective visibility from them plus `vehicleEnabled`, the load state and `frontStackConflict`. The M4/M8/M12 view behavior is unchanged when `vehicleEnabled=false`.

### 4.5 Recommendation

**Adopt option (a) implemented with R1.** The vehicle view:
- shows the stock hardware at full fidelity on both tiers;
- hides the detailed internal assembly and main shaft while active;
- has its own conservative vehicle-state guard **81,164**, leaving **238,836** phone triangles;
- leaves the engine state and D-033 untouched (measured **310,900**, cap **319,128**, phone **872**);
- keeps the stock 3D scene unchanged when off;
- is default-off and lazy-loaded; the hardware GLB is not fetched at startup, so the stock startup payload changes only by the recorded JS-module delta (no new asset bytes).

### 4.6 Owner Decision OD-1 (for owner approval)

> **Owner Decision OD-1 (for owner approval):** M14 adopts **Option A with the R1 scene-state resolver**: a default-off **`Vehicle`** Views control that, when active with Exterior or X-Ray, hides the detailed internal assembly and main shaft and shows the stock vehicle hardware (except the explicitly unsupported `intake_highflow` combination, OD-2). **D-033 is not amended.** The engine state keeps its measured **310,900** / derived **319,128** guard (phone **872** headroom); the vehicle state is separately guarded at **70,364** (stock) / **81,164** (all external variant caps), well below 320,000. The hardware cap is **31,400 triangles**, **+8 draw calls**, **≤ 1,200 KiB**, no textures, lazy-loaded on first activation. Options B, C, D and E are rejected for the reasons in §4.3; the builder must not add a co-visible hardware state or raise D-033 under this spec.

> **Owner Decision OD-2 (for owner approval):** Stock vehicle hardware yields to a selected visual variant **except for the unsupported high-flow combination**: the stock intercooler core hides when `intercooler_upgraded` is active, and the stock exhaust continuation hides when `exhaust_4in` is active; the radiator and shroud have no variant and show in the supported Vehicle states. The **`intake_highflow` + Vehicle combination is explicitly unsupported** because the frozen V2 tract has 14 vertices inside the stock radiator envelope and 6 inside the stock intercooler envelope (self-check §15.5); when V2 is active/loaded, the Vehicle context is suspended (internals visible, all five stock hardware parts withheld) and the UI note says so, rather than rendering a through-stack intersection. This is **not** a catalog change: the 24 entries, the 12 slots, the `modelPath` values and the compatibility rules are unchanged. V4 stays at its frozen `if_hot_side_inlet` service point; the stock core's photo-implied front-stack position is not adopted for V4. If the owner prefers to move V4 into the stock-core position, that is a future M8 asset change and this spec is withdrawn and revised before the build.

### 4.7 What the rejected options would have cost, in one table

| Option | Hardware phone / desktop | Budget treatment | D-033 amendment | Build effort | Main risk | Verdict |
| --- | ---: | --- | --- | --- | --- | --- |
| (a) Vehicle context + R1 | 31,400 / 31,400 | Separate state; engine 319,128; vehicle 81,164; global 319,128 | **No** | M (3–5 sessions) | State matrix / load order | **Recommended** |
| (b) Default-off toggle, co-visible | 31,400 / 31,400 | Engine+hardware 350,528 cap; **minimum phone cap 350,528 (+30,528)**; 360,000 is the desktop cap/policy choice | **Yes** | S–M (2–3) | Phone frame cost; budget precedent | Rejected |
| (c) Quality-tier LOD | 9,100 / 31,400 | Still 328,228 cap; needs ≥350,528 phone cap or ≤872 phone LOD | **Yes** (or absurd LOD) | L (5–7) | Two assets; phone looks crude | Rejected |
| (d) Donors | 31,400 / 31,400 | Springs at 2,482/spring save **31,424** (2,483 saves **31,392**, 8 short); no cap raise | No | L (4–6 + re-baseline) | Destroys stock internals/frames | Rejected |
| (e) Minimal 9,100 | 9,100 / 9,100 | **Fails** the 319,128 guard (328,228) | Yes (or ≤872) | S (1–2) | Not believable; still fails | Rejected |

---

## 5. The Vehicle context — technical design

### 5.1 State model

`src/renderer/sceneContext.ts` (new, pure, Three.js-free):

```ts
export type VehicleHardwareLoadState = 'idle' | 'loading' | 'loaded' | 'failed';

export interface SceneContextInput {
  readonly exteriorVisible: boolean;
  readonly xrayEnabled: boolean;
  readonly vehicleEnabled: boolean;
  readonly hardwareLoadState: VehicleHardwareLoadState;
  /** V2 is active/loaded: the frozen high-flow tract conflicts with the stock front stack. */
  readonly frontStackConflict: boolean;
}

export interface SceneVisibility {
  readonly exteriorContext: boolean;
  readonly vehicleContextActive: boolean;
  readonly shellVisible: boolean;
  readonly internalVisible: boolean;
  readonly vehicleHardwareVisible: boolean;
  readonly intakeCoverVisible: boolean; // still gated by intakeCoverEnabled
  readonly ghostShell: boolean;
  readonly ghostHardware: boolean;
}

export interface SceneGraphVisibilityTargets {
  readonly internalRoot: { visible: boolean };
  readonly mainShaft: { visible: boolean };
  readonly vehicleHardwareGroup: { visible: boolean };
  readonly exteriorShellGroup: { visible: boolean } | null;
  readonly intakeCoverGroup: { visible: boolean } | null;
}

export function applySceneVisibility(
  targets: SceneGraphVisibilityTargets,
  visibility: SceneVisibility,
  intakeCoverEnabled: boolean,
): void;
```

Rules:

- `exteriorContext = exteriorVisible || xrayEnabled`.
- `vehicleContextActive = vehicleEnabled && exteriorContext && hardwareLoadState === 'loaded' && !frontStackConflict`.
- `internalVisible = !vehicleContextActive`.
- `vehicleHardwareVisible = vehicleContextActive`.
- `shellVisible = exteriorContext`.
- `intakeCoverVisible = exteriorContext && intakeCoverEnabled`.
- `ghostShell = xrayEnabled && shellVisible`.
- `ghostHardware = xrayEnabled && vehicleHardwareVisible`.
- `resolveEffectiveExplodeFactor(e, active) = active ? 0 : e`.
- `resolveLabelContext(active) = { vehicleContext: active }`.
- `applySceneVisibility()` sets `internalRoot.visible = internalVisible`, `mainShaft.visible = internalVisible`, `vehicleHardwareGroup.visible = vehicleHardwareVisible`, `exteriorShellGroup.visible = shellVisible` (when non-null), and `intakeCoverGroup.visible = intakeCoverVisible` (when non-null). `getRenderStats()` reports these **actual** `.visible` values in `sceneGraphVisibility`, not the resolver's return values, and **`visibleSceneTriangles` sums only objects whose actual `.visible` is true** (so hidden internal batches/main shaft are excluded and cannot be hidden behind a resolver-only flag).

The pure resolver invariant **`!(internalVisible && vehicleHardwareVisible)`** is true by construction for every input; it is **not** the test that the renderer applies it. §9 test 1 is the resolver truth table; **§9 test 1b applies `applySceneVisibility()` to a fake scene graph and asserts the `.visible` flags**, and acceptance 4 asserts the real `getRenderStats().sceneGraphVisibility` values.

### 5.2 UI control and state

Add a fourth checkbox to the existing Views toggles row, after `Intake cover`:

- label: **`Vehicle`**; id `m14-vehicle-checkbox`; default **unchecked**; not persisted.
- `EngineUiOptions.onVehicleChange?: (enabled: boolean) => void`.
- `EngineUiHandle.setVehicleChecked(checked: boolean): void`.
- On check, if neither Exterior nor X-Ray is on, set the existing Exterior checkbox to checked and call `onExteriorChange(true)` before `onVehicleChange(true)`. This is the only coupling: the Vehicle view needs an exterior context, and silently doing nothing would look broken. The user can uncheck Exterior afterwards; the Vehicle checkbox stays on but inactive, and the note says so.
- The control is **not** added to the Build panel and does not change the catalog.

The note (verbatim in §10.2) sits below the M12 cover note and above the M11 cutaway note.

### 5.3 Loading, failure and disposal

- `vehicleHardwareLoadState` starts `'idle'`. The asset is **not** fetched at startup.
- `setVehicleEnabled(true)` sets the flag; if the state is `'idle'`, it calls `loadVehicleHardware()`:
  - state `'loading'`; `loadVariantScene(partLoader, 'models/vehicle/vehicle_hardware_stock.glb')`; set every mesh `castShadow = true`, `receiveShadow = false`; find the five part groups by name (throw if any is missing); count per-part and total triangles; register materials with `exteriorGhostRegistry.register(...)`; register clippable materials; register cap sources for the four capped parts (not the shroud); **add the group to the scene once**; state `'loaded'`; `syncSceneContext()` sets `vehicleHardware.group.visible = vehicleContextActive`.
- On failure: state `'failed'`, `console.error`, `vehicleHardwareFailed = true`, `syncSceneContext()` keeps `internalVisible = true`; the app never hangs or shows an empty engine. The Vehicle checkbox may stay checked; the failure is reported in the render stats (`vehicleHardwareLoadState: 'failed'`) and in the build's acceptance case, not by a new UI banner.
- If the user unchecks Vehicle while loading, the load continues; on completion the group is added once and kept hidden (`vehicleContextActive=false`). If it fails, the failure state is recorded. **The group is never removed from the scene when hidden**: `applySceneVisibility()` sets `group.visible = false`, and the M11 cap builder then skips it (`isObjectAndAncestorsVisible`), so a hidden hardware group contributes 0 cap triangles and 0 rendered triangles.
- If V2 is active/loaded (`frontStackConflict=true`), `vehicleContextActive=false` and the group stays hidden even with Vehicle checked; deselecting V2 resumes the Vehicle context. This is the OD-2 unsupported combination, not a load failure.
- `dispose()` disposes the hardware geometries/materials and clears the group/part maps; no leaks.

### 5.4 Budget accounting for the recommended model

**D-033 caps (unchanged):**

| Metric | Desktop | Phone |
| --- | ---: | ---: |
| Scene asset triangles (single pass) | ≤ 360,000 | ≤ 320,000 |
| Submitted triangles / frame (incl. shadow) | ≤ 700,000 | ≤ 400,000 |
| Draw calls / frame | ≤ 250 | ≤ 120 |
| Texture + HDRI VRAM | ≤ 64 MiB | ≤ 32 MiB |
| Frame time p95 @ 900 rpm | ≤ 16.7 ms | ≤ 33.3 ms |

**Engine state (Vehicle off) — measured and capped:**

| State | Scene triangles | Phone headroom | Desktop headroom | Utilisation (phone / desktop) |
| --- | ---: | ---: | ---: | ---: |
| Stock measured | 308,324 | 11,676 | 51,676 | 96.35 % / 85.65 % |
| **Fullest measured (stock + rods + cover)** | **310,900** | **9,100** | **49,100** | **97.16 % / 86.36 %** |
| **Derived cap guard (M13, unchanged)** | **319,128** | **872** | **40,872** | **99.73 % / 88.65 %** |
| M8 worst-case measured (five variants) | 304,632 | 15,368 | 55,368 | 95.20 % / 84.62 % |

**Vehicle state (Vehicle on, stock hardware) — capped and measured:**

| State | Scene triangles | Phone headroom | Desktop headroom | Utilisation (phone / desktop) |
| --- | ---: | ---: | ---: | ---: |
| Stock hardware at cap, cover measured (1,040) | **69,604** | **250,396** | **290,396** | **21.75 % / 19.33 %** |
| Stock hardware at cap, cover cap (1,800) | **70,364** | **249,636** | **289,636** | **21.99 % / 19.55 %** |
| Conservative guard: + all external variant caps (10,800) | **81,164** | **238,836** | **278,836** | **25.36 % / 22.54 %** |

Arithmetic: `37,100 shell + 31,400 hardware + 1,040 cover + 64 ground = 69,604`; `37,100 + 31,400 + 1,800 + 64 = 70,364`; `70,364 + 10,800 = 81,164`. The vehicle state hides the 270,080 internal triangles, the 1,080-triangle main shaft and the internal variants; it does not include them. The cover's 1,040 measured / 1,800 cap is the M12 asset; the external variant caps are the M8 3,600 + 2,600 + 2,800 + 1,800. The 81,164 guard is conservative because it sums variant caps without subtracting the shell subtrees/stock parts they hide.

**Global state guard and the forbidden co-visible state:**

```
global guard = max(319,128, 81,164) = 319,128 / 320,000 phone
phone headroom = 320,000 − 319,128 = 872 (0.2725 %)
desktop headroom = 360,000 − 319,128 = 40,872 (11.35 %)

if hardware were co-visible with the engine state:
319,128 + 31,400 = 350,528 / 320,000 = 109.54 %  (30,528 triangles over)
```

The **350,528** row is the budget proof that the states must be mutually exclusive; §9 test 1b and acceptance 4 fail if the rendered scene has `v8Batches.root`/`mainShaft.mesh` visible alongside the hardware (the pure resolver's `!(internalVisible && vehicleHardwareVisible)` is true by construction and is not the renderer test). **No D-033 budget is raised; no amendment is drafted.**

**Submitted triangles, calls, VRAM:**

| State | Submitted triangles desktop / phone | Draw calls desktop / phone | VRAM desktop / phone |
| --- | ---: | ---: | ---: |
| Engine fullest measured (M13) | 583,596 / 310,452 | 98 / 60 | 20.75 / 4.75 MiB |
| Stock + rods + cover at cap (M13, section off) | 584,804 / 311,436 | 98 / 60 (section-on bound: 100 / 62) | 20.75 / 4.75 MiB |
| Vehicle at cap (hardware castShadow, cover measured) | **101,004 / 69,604** | **≤ 98 / ≤ 60** | **20.75 / 4.75 MiB** |
| Vehicle conservative bound | ≤ 112,564 / ≤ 81,164 | ≤ 98 / ≤ 60 | 20.75 / 4.75 MiB |

The vehicle submitted row is `37,100 shell (no shadow) + 2×31,400 hardware (desktop shadow) + 1,040 cover (no shadow) + 64 ground = 101,004`; phone has no shadow map, so `37,100 + 31,400 + 1,040 + 64 = 69,604`. **Draw-call derivation (the engine 98/60 baseline does not include external variants):** the engine state's 98/60 calls include 18 internal-batch/main-shaft calls. With Vehicle on, those 18 are hidden and the 8 hardware calls are added: nominal **88/50** for the stock vehicle state. `intercooler_upgraded` hides the 1-call stock intercooler and adds V4's 3 calls → **90/52**; `exhaust_4in` hides the 2-call stock exhaust and adds V3's 2 calls → **88/50**; both → **90/52**. The supported vehicle states therefore stay at or below the engine-state **98/60** bound, which the spec keeps as the conservative measured ceiling. The unsupported high-flow combination falls back to the engine view with V2 (4 calls) and, if the other external variants are also selected, V1+V3+V4 (8 more): a high-flow-only fallback is **102/64**, and the all-variant fallback is **110/72**. Both are within D-033's **250/120** call caps and recorded as their own rows. The build measures the actual. Hardware adds **0 texture bytes**; PMREM/shadow/VRAM are unchanged.

**Page weight:** the hardware GLB is **≤ 1,228,800 B (1,200 KiB)**, lazy-loaded on first Vehicle activation. **The hardware GLB is not fetched at startup; the stock startup payload changes only by the recorded JS-module delta (no new asset bytes).** The first-activation fetch is at most `1,228,800 / 10,050,510 = +12.23 %` raw against the M9 baseline, and the build records the actual. This is a recorded cost, not a D-033 cap.

**Frame time:** the engine-state p95 targets are unchanged (16.7/33.3 ms; the M11 detail rows 16.8/17.0 ms are the cross-check). The vehicle state has **fewer** triangles and calls than the engine state, so its p95 target is **≤ the engine-state p95 for the same tier** and **0 dropped frames**; the build runs `?benchmark=1` in both states.

### 5.5 Stock invariance

With `Vehicle` off (or Exterior/X-Ray off, or the hardware failed):
- `vehicleContextActive=false`, `internalVisible=true`, `vehicleHardwareVisible=false`;
- before the first activation the hardware group is neither fetched nor added; after a load it is kept in the scene but hidden when Vehicle is off;
- `effectiveExplodeFactor = explodeFactor`, so the M12 cover and M8 variants explode exactly as at M13;
- the shell, internal batches, main shaft, section caps and labels are unchanged;
- `getRenderStats().visibleSceneTriangles` equals the M13 value: **310,900** for stock + rods + cover, **308,324** for stock;
- the **3D viewport region** of RF-1…RF-22 is unchanged. The full-page PNG changes because the Views control is added; the build re-captures the frames and a reviewer compares the 3D region **manually** with the changed control panel/title/subtitle masked. M12/M13 did not use an automated masked pixel-diff: they kept the PNGs byte-identical because no UI control changed, and used a manual visual gate (M12 QA-10). M14 records the full-page UI delta and the manual 3D comparison; no automated masked-region tool is claimed. The stock **assets**, **catalog** and **interfaces** are byte-identical; before the first activation the scene graph is identical, and after a load the hidden hardware group does not change the rendered 3D.

This is the honest resolution of the brief's "byte-identical" requirement: a new Views control necessarily changes the full-page PNG; the 3D scene does not change. §15.7 records the conflict.

---

## 6. Interaction contract

### 6.1 Explode

- **The vehicle hardware never moves.** It has no explode vector and no call to `computeVariantExplodeOffsetMm`; the group's position stays `(0,0,0)` at every Explode value. It is chassis-fixed like the exterior shell (which also does not explode).
- **In Vehicle view the whole context is static:** `effectiveExplodeFactor = 0` for the shell, M8 external variants and M12 cover. The slider's stored value is preserved; `setExplodeFactor` still updates it. On exit, the stored factor is re-applied to the internals, variants and cover.
- **Why:** the hardware is a vehicle-context display, not an engine part. Letting the cover or an external variant float above it while the radiator/airbox stay put would be visually false; letting the internals explode through the radiator would be worse. The static rule is simpler and testable.
- The Explode slider remains enabled (no UI disabling), but it has no visible effect in Vehicle view; the Vehicle note says the view is a static bay and to switch back for internals/explode. §9 test 7 pins the zero offsets **and** source-checks that `syncVisualVariants` and `syncIntakeCoverState` consume `resolveEffectiveExplodeFactor`; acceptance 8 additionally sets Vehicle + Explode 100 in the rendered app and confirms the hardware, shell and cover are static. The five frames are all pinned at Explode 0, so their shared checklist item is a zero-state sanity check, not the proof of the rule.

### 6.2 Section — per-part cap source, clipped without caps, or excluded

M11 caps every **registered cap source** whose object/ancestors are visible, and skips `skipWhenGhosted` sources under X-Ray. The hardware is registered as follows:

| Part | Treatment | Reason (tied to M11) |
| --- | --- | --- |
| **Airbox** (`veh_airbox`) | **Static cap source**, `skipWhenGhosted: true` | Body/lid are closed; the snorkel and collar mouths are intended openings. M11 intersects the triangles and fills the cross-section as a solid, hatched, diagrammatic cap; an open chain at a mouth is chord-closed by M11's rule. |
| **Radiator** (`veh_radiator`) | **Static cap source**, `skipWhenGhosted: true` | Closed core/tank assembly; the cap is solid (the core's tubes/fins are not wall-modelled). Diagrammatic, not a radiator cross-section claim. |
| **Fan shroud** (`veh_fan_shroud`) | **Clipped without caps** — **not** a cap source; materials are clippable | It is an **open annular thin shell** around the fan aperture. M11's open-chain closing would chord the ring across the aperture and read as a solid disc blocking the fan — a false cap. Excluding it is the honest choice; the cut edge reads as thin plastic. |
| **Intercooler** (`veh_intercooler`) | **Static cap source**, `skipWhenGhosted: true` | Closed core/tank assembly; solid cap, diagrammatic. |
| **Exhaust** (`veh_exhaust`) | **Static cap source**, `skipWhenGhosted: true` | Closed tube/muffler; the cap is a filled disc (the pipe is modelled as a solid tube, not a wall-thickness shell), consistent with M11's solid convention. |
| Hanger stubs / clamps | Grouped with the exhaust; no separate source | Small grouped simplifications; they cap with the parent if cut. |
| `if_vehicle_*` markers | No geometry; excluded | Empty nodes, not meshes. |

- The hardware cap sources are added to `staticCapSources` (not `dynamicCapSources`); they rebuild only when the section plane/explode/variant/context/x-ray state changes.
- With Vehicle on, the internal cap sources are hidden (their ancestors `v8Batches.root` / the main-shaft mesh are invisible), so `buildCapGeometry` skips them (`sectionCaps.ts:1910`). There are **no internal caps** in a Vehicle section.
- The hardware cap triangles count toward the M11 **16,000** ceiling. **At X = 690 the capped sources are the radiator and the airbox**; the intercooler (X 712–760) is entirely clipped away, and the shroud (X 610–650) and exhaust (X ≤ −162) are not cut. The exhaust cap is measured at a plane that actually cuts it (for example X = −500), and the combined cap total is still ≤ 16,000. A hidden hardware group contributes **0** cap triangles because every source's ancestor group is invisible; re-activating Vehicle restores them.
- The M11 cap material, hatch and 5 mm spacing are unchanged.

### 6.3 X-Ray ghosting — including the M12 load-order behavior

- After the hardware loads, call `exteriorGhostRegistry.register(vehicleHardware.materials)` **immediately**, before/with the first `syncSceneContext()`. The registry applies the ghost state if X-Ray is already active, so a user who turns X-Ray on **before** the lazy load finishes never sees opaque hardware. This is the exact M12 load-order fix, reused.
- `setXrayEnabled` calls `exteriorGhostRegistry.setGhosted(xray)`; the hardware materials are in the same registry as the shell/cover and are restored from their authored snapshots on off.
- In Vehicle view: shell + hardware + cover are ghosted at **0.22** opacity, `transparent=true`, `depthWrite=false`; the internals are **not rendered**, so X-Ray in Vehicle view reveals the hardware/shell structure, not engine internals. This is documented in the note; switching to Engine view and X-Ray shows the internals as at M13.
- Hardware cap sources have `skipWhenGhosted: true`, so ghosted hardware does not produce caps.
- If the hardware fails to load, X-Ray behaves exactly as at M13 (internals + shell/cover ghosting); no hardware materials are registered.

### 6.4 Labels

- **No new label anchor.** The 23 anchors (15 part + 8 cylinder numbers) and their positions are unchanged. The hardware is identified by the UI note and the docs, not by floating labels.
- In Vehicle view, `isLabelVisibleUnderViewRules` gains an optional `vehicleContext` flag:
  - `internal-part` and `cylinder-number` labels return **false**, even when X-Ray would otherwise reveal them, because their geometry is not rendered;
  - `exterior-part` labels (turbocharger, harmonic balancer, oil pan) remain subject to the existing shell-visible and section-clip rules;
  - section clipping still hides any label on the clipped side.
- Without `vehicleContext`, the existing behavior is byte-identical (the flag is optional; all existing calls compile).
- **RF-23 is the opaque-shell label check, not the proof of the new rule:** Labels on, Vehicle on, Exterior on, X-Ray off. The existing `isLabelVisibleUnderViewRules` already hides internal labels under the opaque shell; RF-23 confirms that behavior and shows only the three exterior labels. The **new `vehicleContext` suppression is proved by RF-27** (Vehicle + X-Ray on + Labels on): internal-part and cylinder-number labels must be absent even though X-Ray would otherwise reveal them. Acceptance 7 checks both frames. §9 test 9.

### 6.5 M10 fan/clutch registration — the measured basis

| Item | Value (mm) | Source |
| --- | --- | --- |
| Fan centre (Y, Z) | **(0.0, 156.0)** | measured `ext_fan` |
| Fan outer radius | **212.0** | measured `ext_fan` |
| Fan blade axial span | **570.0–617.8** | measured `ext_fan` |
| Fan blade count | **9** | M10 record `fanBladeCount`; `ext_fan` geometry |
| Fan hub radius | **72.0** | M10 record `fanHubRadiusMm`; `ext_fan` bounds |
| Fan clutch span | **472.0–570.0** | measured `ext_fan_clutch` |
| Fan clutch radius | **68.0** (bound 72.0) | measured `ext_fan_clutch` |
| Shroud centre (Y, Z) | **(0.0, 156.0)** | design = fan centre |
| Shroud inner radius | **222.0** | design: 212 + 10 mm |
| Shroud outer radius | **252.0** | design |
| Shroud axial span | **610.0–650.0** | design |
| Shroud flange X | **650.0** | radiator rear face |
| Radial clearance | **10.0** | `222.0 − 212.0` |
| Axial overlap | **7.8** | `617.8 − 610.0` |
| Clutch clearance | **40.0** | `610.0 − 570.0` |

The shroud's inner lip is a clean ring at radius 222; the fan tips at X ≥ 610 measure a maximum radius of 210.0, so the radial clearance at the overlapping lip is **12.0 mm**, and the 10.0 mm figure is conservative against the absolute 212.0 radius. The asset test pins the centre, inner/outer radii and axial span; the build re-measures the fan from the shipped shell before accepting the asset. A shroud that contacts the fan, the clutch or the radiator (other than the intended flange contact at X = 650) is a stop-and-report.

### 6.6 M12 intake cover

- The cover keeps its own default-off toggle and its visibility rule (`enabled && exteriorContext`). In Vehicle view it shows if enabled, hiding the Y-bridge as at M12.
- In Vehicle view its explode offset is forced to 0 by the effective-explode rule; the +Z 260 mm explode is restored in Engine view.
- Its ghosting, cap source (`skipWhenGhosted: true`), 1,040 measured triangles and RF-18…RF-20 are unchanged.
- The cover does not collide with the airbox: the cover occupies X 245–400, Y −120…120; the airbox body/snorkel starts at X 600 and its collar/boss AABB reaches Y −470.61. The X separation is at least **200 mm**, and the Y ranges are disjoint, so no Z-vs-Y cross-check is needed or claimed. The cover also does not intersect the M10 intake duct.

### 6.7 M8 variants and OD-2

- V1 (`turbo_large`), V2 (`intake_highflow`), V3 (`exhaust_4in`) and V4 (`intercooler_upgraded`) keep their frozen models, bounds, explode vectors and service points.
- Stock hardware yields per OD-2:
  - `intake_highflow` active/loaded → **the combination is unsupported**: `frontStackConflict=true`, the Vehicle context is suspended, the internals stay visible, and **all five stock hardware parts are withheld** (the airbox would hide anyway, but the radiator/intercooler cannot yield because they have no variant). The recorded reason is 14 V2 vertices inside the radiator envelope and 6 inside the intercooler envelope. The UI note says Vehicle view is unavailable with the high-flow intake; deselecting V2 resumes it. This is the honest alternative to rendering a through-stack intersection. §9 test 6.
  - `intercooler_upgraded` active/loaded → stock intercooler core hidden; V4 shows at its LH outboard service point; no double core.
  - `exhaust_4in` active/loaded → stock exhaust continuation hidden; V3 shows its representative 4-inch system; the shell downpipe is hidden by the existing replacement rule.
  - `turbo_large` → no stock hardware part hides; the airbox/duct still mate at the preserved `if_compressor_inlet`.
- If a variant load fails, the existing fallback keeps the stock shell/parts; the stock hardware must **not** hide for a failed variant, and a failed V2 must **not** trigger `frontStackConflict`. The rule keys off the **attached/active** variant ids, not the selected ids. §9 test 6.
- No catalog change, no `modelPath` change, no `SHELL_PARTS_REPLACED_BY_SLOT` change. The only new rule is the stock-hardware visibility map.

### 6.8 Internal variants and build selections

- `pistons_lowcomp` and `rods_forged` remain selectable in the Build panel. In Vehicle view the internal assembly is hidden, so they have no visible effect; the Build note says they render in the engine view. Switching to Engine view shows them as at M13.
- The vehicle context does not change the performance model, the build, the dyno or the sound.
- The stock hardware is stock-only; it is not a catalog slot and has no compatibility rule. OD-2 covers the three external-slot interactions.

### 6.9 Quality tiers, pause, hidden tab

- The same 31,400-triangle hardware asset is used on both tiers; there is **no phone LOD** (option (c) rejected). Phone runs the vehicle state at ≤69,604 triangles, ≤60 calls, no shadow map; desktop at ≤101,004 submitted triangles with shadows.
- The existing `applyEffectiveQualityTier` behavior (phone: pixelRatio 1, shadows off) is unchanged. The hardware materials are PBR, untextured; no tier-specific material.
- Pause/slow-motion/hidden-tab behavior is unchanged: the hardware is static and the simulation/audio continue as at M13.

### 6.10 Defaults, persistence and reference frames

- `Vehicle` is off on every load; it is not persisted in localStorage. **`?vehicle=1`** is the explicit URL/benchmark selector: `main.ts` calls `ui.setVehicleChecked(true)` and the auto-Exterior rule applies. It is not a persisted state.
- `?rf=RF-23`…`?rf=RF-27` set `vehicle: true` and the frame's other state; all other frames set `vehicle: false`, so a previous Vehicle state cannot leak into a stock frame.
- `main.ts`'s `applyReferenceFrame` calls `ui.setVehicleChecked(def.vehicle ?? false)` before applying Exterior/X-Ray; the checkbox's auto-Exterior rule is idempotent with the frame's `exterior: true`.
- The `?benchmark=1` readiness gate waits for `detailedLoaded`, `hdriLoaded`, `exteriorLoaded`, `variantsLoaded`, `intakeCoverLoaded`, **`vehicleHardwareLoadState === 'loaded' || 'failed'`** (only when `?vehicle=1`) and audio. A failed vehicle load does not block the benchmark; it is recorded as `failed`. The exact matrix URLs are in acceptance 4.

---

## 7. The hardware asset — technical contract

### 7.1 File, class, groups and markers

| Item | Value | Provenance |
| --- | --- | --- |
| Asset path | `public/models/vehicle/vehicle_hardware_stock.glb` | Design |
| Asset class | **Scene-placed stock add-on** (D-038 class; project-frame, Y-up export, no pivot/animation, untextured PBR) | D-038 / D-042 precedent |
| Root | `vehicle_hardware_stock` | Design |
| Part groups | `veh_airbox`, `veh_radiator`, `veh_fan_shroud`, `veh_intercooler`, `veh_exhaust` | Design |
| Materials | `mat_veh_black_plastic`, `mat_veh_aluminium`, `mat_veh_aluminized_steel`, `mat_veh_rubber` (4) | Design |
| Triangle cap | **31,400** total; per-part 5,600 / 6,400 / 4,800 / 6,200 / 8,400 | §4.2 |
| File cap | **1,228,800 B (1,200 KiB)** | §5.4 |
| Draw calls | **+8** (airbox 2, radiator 2, shroud 1, intercooler 1, exhaust 2) | §4.2 |
| Textures/UVs | **0 textures, 0 UV sets, 0 images**; `POSITION` + `NORMAL` indexed triangles only | D-038 / M10 |
| Animation/skin/morph | none | D-038 |
| Shadow | `castShadow = true` on all hardware meshes; `receiveShadow = false` | §5.4 |

Markers (empty nodes, `if_vehicle_*`):

| Marker | Position (mm) | Normal | Meaning |
| --- | --- | --- | --- |
| `if_vehicle_airbox_mount` | **(587.4, −510.5, 371.9)** | **(0.882820, −0.441410, −0.160513)** | Mates to the M10 `if_airbox_mount`; cuff radius 44.45 |
| `if_vehicle_downpipe_flange` | **(−222.0, −162.0, −18.0)** | **(−0.0059, 0.0892, 0.9960)** | Mates to the measured downpipe **closed 14-triangle cap**; radius 44.45 |
| `if_vehicle_shroud_center` | **(630.0, 0.0, 156.0)** | **(1.0, 0.0, 0.0)** | Fan axis at shroud mid-depth; inner 222, outer 252 |
| `if_vehicle_radiator_rear` | **(650.0, 0.0, 156.0)** | **(−1.0, 0.0, 0.0)** | Radiator rear face / shroud flange plane |

Marker tolerance: position **±1.0 mm**, normal **±0.5°**, radii **±1.0 mm** (the M8/M10 convention). The airbox/downpipe markers are **intended mates** to the frozen shell; the shroud/radiator markers are **design datums** checked against the measured fan.

### 7.2 Per-part geometry and caps

| Part | Cap | Construction | Boundary/watertight expectation |
| --- | ---: | --- | --- |
| Airbox | 5,600 | Rounded body, lid with raised centre, forward snorkel with bell mouth, 70 mm outlet collar (outer envelope radius 44.45, bead rings within it) with a clamp band, **inlet boss on the body face**, 6 latch clips, 4 feet, 3 side ribs | Body/lid/boss closed; snorkel and collar mouths are intended openings (M11 chord-closes if cut); collar end seats in the boss; filter not modelled |
| Radiator | 6,400 | Core block with tube/fin face ribs, top/bottom tanks, upper/lower necks, side brackets, cap and drain; **8 mm × 50 mm × 15 mm RH rear-corner collar relief** | Closed; 0 boundary edges; the relief is a shallow external chamfer, not a through-hole |
| Shroud | 4,800 | Two-piece annular ring, inner lip, outer flange, 8 radial ribs, 8 bolt bosses, seam tabs | Open annular shell by design; **not** a cap source |
| Intercooler | 6,200 | Bar-and-plate core with vertical fin strips, cast end tanks, 76.2 mm stubs with recessed caps, 3 brackets | Closed; 0 boundary edges |
| Exhaust | 8,400 | Flange at the measured normal over the closed 14-triangle downpipe cap, 88.9 mm pipe with 3 bends on the §7.4 route, Ø220 × 340 muffler, tailpipe with over-axle-style rise and slash-cut tip, 2 saddle-clamp hanger stubs | Pipe/muffler closed; open tip is an intended opening (M11 chord-closes if cut) |

The build script asserts the per-part caps and the total; it records the boundary-edge counts rather than requiring every part watertight (the shroud and the intended openings are legitimately open). The radiator and intercooler are asserted closed.

### 7.3 Dimensions and provenance

| Parameter | Value | Unit | Provenance | Why |
| --- | ---: | --- | --- | --- |
| Radiator core | 865.1 × 498.1 × 55.9 | mm | **published** Mishimoto MMRAD-DMAX-01, grade C replacement | Only published dimensional anchor; adopted with caveat |
| Radiator overall width | 1,158.2 | mm | **published** same listing | **Not adopted** — bracket/tank envelope would intersect the airbox; recorded |
| Radiator inlet/outlet | 48.0 | mm | **published** same listing | Neck size |
| Intercooler core | 952.5 × 466.7 × 47.6 | mm | **published** CSF 6007 stock-size proxy, grade C | Stock-size replacement anchor |
| Intercooler inlet/outlet | 76.2 | mm | **published** same listing | 3 in stubs |
| Intercooler front-stack position | X 712–760, Y ±520, Z −100…410 | mm | **photo-implied labeled placeholder**; core hidden in the owner's photos, no GM datum | Representative front-stack position; not a measurement |
| Exhaust pipe diameter | 88.9 | mm | **published** stock 3.5 in turbo-back, grade B/C | Continuation diameter |
| Airbox body | X 600–800, Y −820…−560, Z 240–520 | mm | **labeled placeholder**; sized from `if_airbox_mount` + photos | Photo-plausible planform; not a GM drawing |
| Airbox collar + boss | 70 mm collar from the marker; boss X 636.4–736.4, Y −560…−535, Z 303.9–403.9 | mm | **measured** `if_airbox_mount` + design boss | Intended mate; group AABB extends to X 566.52, Y −470.61 |
| Fan centre / radius | (0, 156) / 212.0 | mm | **measured** `ext_fan` | Shroud registration |
| Shroud inner/outer | 222 / 252 | mm | **design**; 10 mm radial clearance | Measured fan + clearance |
| Shroud axial span | 610–650 | mm | **design**; 7.8 mm fan overlap | Measured fan + radiator rear face |
| Muffler | Ø220 × 340 | mm | **labeled placeholder** | No stock muffler dimension published |
| Exhaust route / AABB | centreline §7.4/§15.5; AABB X −1,364.45…−161.97, Y −345.0…−101.79, Z −220.0…+84.45 | mm | **labeled placeholder** | Representative route, not a chassis-verified cat-back |
| Tailpipe / tip / hangers | representative | mm | **labeled placeholder** | No stock route/dimensions published |
| Downpipe exit | (−222, −162, −18), r 44.45, closed 14-triangle cap, normal (−0.0059, 0.0892, 0.9960) | mm | **measured** shell welded mesh | Intended mate |

### 7.4 Placement table

| Part | Bounds (mm) | Anchor / rule |
| --- | --- | --- |
| Airbox **group** (body, lid, snorkel, collar, boss, clips/ribs) | **X 566.52–860, Y −820…−470.61, Z 240–520** | Collar at `if_vehicle_airbox_mount`; 70 mm collar end (649.197, −541.399, 360.664) inside the body inlet boss; body Y −820…−560, X 600–800, Z 240–520; snorkel to X 860 |
| Airbox **body/lid/snorkel** (excluding collar/boss) | X 600–860, Y −820…−560, Z 240–520 | Placeholder planform; 60 mm Y gap to radiator, 40 mm to intercooler |
| Airbox **collar/boss** | Collar X 566.52–670.08, Y −581.28…−470.61, Z 316.79…415.77; boss X 636.4–736.4, Y −560…−535, Z 303.9–403.9 | Intended mate; collar end inside boss |
| Radiator | X 650–706, Y ±500, Z −108…420 | Core 865.1 × 498.1; rear face 32.2 mm ahead of fan; shroud flange at 650; 8 mm RH rear-corner collar relief |
| Shroud | X 610–650, Y ±252, Z −96…408 | Centre (0,156); inner 222/outer 252 |
| Intercooler | X 712–760, Y ±520, Z −100…410 | 6 mm ahead of radiator; **photo-implied front-stack placeholder** |
| Exhaust **group** | **X −1,364.45…−161.97, Y −345.0…−101.79, Z −220.0…+84.45** | Flange at `if_vehicle_downpipe_flange`; route below |
| Exhaust flange | X −282.03…−161.97, Y −222.21…−101.79, Z −28.34…−7.66 | Ø120 × 10 mm plate on the measured normal; mates over the closed downpipe cap |
| Exhaust muffler | X −1,090…−750, Y −345…−125, Z −220…0 | Ø220 × 340, centred (X −920, Y −235, Z −110) |
| Exhaust tailpipe/tip | X −1,364.45…−1,045.55, Y −279.45…−190.55, Z −154.45…+84.45 | Route below; 44.45 mm radius included in the AABB |

**Exhaust centreline (mm), used by the bounds, the 58.051 mm shell clearance and the 25.0 mm floor clearance:**

```
P0 (−222, −162, −18)  [flange at the measured cap; normal (−0.0059, 0.0892, 0.9960)]
 → P1 (−300, −180, −80)
 → P2 (−480, −235, −160)
 → P3 (−750, −235, −160)  [muffler inlet]
muffler axis X −750…−1,090 at (Y −235, Z −110)
 → P4 (−1,090, −235, −110)  [muffler outlet]
 → P5 (−1,180, −235, −40)
 → P6 (−1,250, −235, +40)  [over-axle-style crest]
 → P7 (−1,320, −235, 0)   [tip centre; AABB includes the 44.45 mm pipe radius]
```

The pipe is 88.9 mm OD (r 44.45) on every segment; bend radii are modelling detail and do not move the AABB. The AABB is `min/max(endpoint ± r)` over the segments, unioned with the flange plate and the muffler.

### 7.5 Clearances (measured in the planning self-check; build re-runs)

| Pair | Clearance (mm) | Note |
| --- | ---: | --- |
| Airbox body/lid/snorkel ↔ shell `ext_intake_duct` | **29.180** | 0 shell vertices inside the body envelope; excluding the intended 70 mm collar region, 97.115 |
| Airbox collar ↔ radiator RH rear corner | **5.350** | Surface distance after the 8 mm × 50 mm × 15 mm relief; without the relief the collar would graze the tank by 2.65 |
| Airbox collar end ↔ body inlet boss | **intended contact** | Collar end (649.197, −541.399, 360.664) inside boss X 636.4–736.4, Y −560…−535, Z 303.9–403.9; body face at t = 112.141 along the normal |
| Radiator ↔ shell `ext_fan` | **32.200** | Fan front 617.8 to radiator rear 650 |
| Intercooler ↔ radiator | **6.000** | Intended stack gap |
| Airbox body ↔ radiator | **60.000** | Side-by-side body envelope only; the collar/boss clearance is the row above |
| Airbox body ↔ intercooler | **40.000** | Side-by-side; no overlap |
| Shroud inner ↔ fan | **10.000** radial | 222 − 212; fan-tip max 210 at the lip → 12.0 actual |
| Shroud rear ↔ fan front | **7.800** axial overlap | Intended; no contact |
| Shroud ↔ fan clutch | **40.000** | 610 − 570 |
| Exhaust ↔ shell (excl. 100 mm exit collar) | **58.051** | Surface distance, pipe r 44.45; nearest shell point (−230.0, −114.9, 72.7) to segment P0→P1 |
| Exhaust pipe ↔ floor | **40.550** | Pipe centre min Z −160; surface bottom −204.45; floor −245 |
| Muffler ↔ floor | **25.000** | Muffler bottom −220; above M10 21.4 minimum |
| Stock intercooler ↔ V4 | **30.000** X | Envelopes do not intersect; V4 frozen |
| V2 ↔ stock radiator / intercooler | **14 / 6 vertices inside** | Measured frozen V2; the `intake_highflow` + Vehicle combination is unsupported (OD-2), so these parts are withheld rather than rendered through |

**Interference flags:** no unintended hardware-to-shell contact at the planned envelopes. The only intended contacts are the airbox collar at the M10 `if_airbox_mount`/body boss, the exhaust flange at the downpipe cap, and the shroud flange at the radiator rear face (X = 650). The airbox collar's 5.35 mm radiator-corner clearance depends on the documented 8 mm relief; the build re-measures it. The 25.0 mm muffler-to-floor clearance is the smallest vertical number and passes the M10 21.4 mm minimum; it is recorded, not hidden. A build measurement below 21.4 mm, a shell vertex inside a hardware envelope other than the intended mates, a collar/radiator clearance below 2.0 mm, or any fan/clutch contact is a stop-and-report. The frozen V2 tract's 14/6 vertex overlap is the recorded reason for the unsupported combination, not a pass.

### 7.6 Section cap classification

See §6.2. Four capped parts (airbox, radiator, intercooler, exhaust) and one clipped-without-caps part (shroud). The markers and hanger/clamp primitives are not separate sources. The hardware caps count toward the M11 16,000 ceiling.

### 7.7 Materials

Four untextured `MeshStandardMaterial`s in the M10 family:

| Material | Colour (linear) | Metalness | Roughness | Used by |
| --- | --- | ---: | ---: | --- |
| `mat_veh_black_plastic` | 0.045, 0.048, 0.052 | 0.00 | 0.78 | airbox body/lid/snorkel, shroud, radiator tanks |
| `mat_veh_aluminium` | 0.62, 0.64, 0.66 | 0.85 | 0.38 | radiator core, intercooler core/tanks/stubs |
| `mat_veh_aluminized_steel` | 0.46, 0.47, 0.48 | 0.80 | 0.46 | exhaust pipe/muffler/tip/flange |
| `mat_veh_rubber` | 0.020, 0.021, 0.022 | 0.00 | 0.90 | airbox collar, clamps, hanger saddles |

No textures, decals, UVs, normal maps or lettering. The materials are illustrative PBR approximations, not a claim about the exact polymer/alloy finish.

### 7.8 File size and page weight

- Cap **1,228,800 B (1,200 KiB)**; the build records actual bytes.
- Lazy load: no fetch at startup; the first `Vehicle` activation fetches the GLB. At the cap, the first-activation raw delta is **+12.23 %** against the M9 baseline `10,050,510 B`; the build records the actual and the `vite build` JS delta (expected 0 new JS dependencies; the new modules add a small TS/JS delta).
- A GLB above 1,200 KiB is a stop-and-report; do not raise the cap or silently shrink the asset.

### 7.9 Build script and asset tests

- `assets-src/blender/build_vehicle_hardware.py` + `assets-src/vehicle_hardware_dimensions.json` (new). The script builds the five groups in the project frame, exports Y-up, asserts per-part caps/total, markers, bounds, material count, no textures/UVs, radiator/intercooler closed, shroud open, the airbox collar end inside the body inlet boss, the radiator RH rear-corner collar relief, the exhaust centreline/AABB, and writes the build log.
- `src/renderer/vehicleHardware.test.ts` (new) parses the GLB with `node:fs` and asserts the contract; it does not import Three.js.
- The build records the exact commands and the Blender version (5.2.3 target; the planning VM has no Blender).

---

## 8. Visual proof — reference frames

All captures at the standing `1440×900 → 1024×640` convention, production preview, `?rf=…`. Five new frames are added to `docs/REFERENCE_FRAMES.md`; RF-1…RF-22 are unchanged with Vehicle off.

| Frame | Status | Crank angle | Camera position → target (m) | Views / build | What it is for |
| --- | --- | ---: | --- | --- | --- |
| **RF-23** | **New** | 180° | `[1.4000, −1.9000, 1.0000] → [0.3500, −0.1500, 0.3000]` | **Vehicle on**, Exterior on, X-Ray off, **Labels on**, **Intake cover on**, Explode 0, Section off | **Vehicle front-right context:** airbox, intercooler/radiator front stack, engine shell, cover; opaque-shell label check (only exterior labels) |
| **RF-24** | **New** | 180° | `[0.4500, 1.2500, 0.7500] → [0.5800, 0.0000, 0.2200]` | Vehicle on, Exterior on, X-Ray off, Labels off, Intake cover off, Explode 0, Section off | **Fan/shroud side registration:** fan, clutch and shroud ring seen from outboard LH in profile; the circular opening is not claimed face-on |
| **RF-25** | **New** | 180° | `[0.3500, −1.3500, 0.7500] → [−0.8500, −0.2000, −0.1200]` | Vehicle on, Exterior on, X-Ray off, Labels off, Intake cover off, Explode 0, Section off | **Exhaust continuation:** flange, pipe, muffler, tailpipe/tip, hanger stubs |
| **RF-26** | **New** | 180° | `[1.6000, 0.7000, 0.9000] → [0.6000, 0.0000, 0.2500]` | Vehicle on, Exterior on, X-Ray off, Labels off, Intake cover off, Explode 0, **Section X @ 690.0 mm** | **Vehicle section:** radiator and airbox solid/hatched caps; intercooler clipped away; shroud behind the plane (not cut); no internal caps |
| **RF-27** | **New** | 180° | `[1.4000, −1.9000, 1.0000] → [0.3500, −0.1500, 0.3000]` (same as RF-23) | Vehicle on, Exterior on, **X-Ray on**, **Labels on**, Intake cover on, Explode 0, Section off | **X-Ray ghosting and Vehicle-label proof:** ghosted hardware/shell, no internals, no opaque hardware; only exterior labels |

### 8.1 Per-frame visibility reasoning (computed, not rendered in this VM)

The planning VM has **no WebGL**. The following are geometric projections from the pinned camera poses (42° vertical FOV, 1024×640, look-at), used as a visible-by-construction argument; the build's G-FRAME-M14 gate is the render check. Screen boxes are the projected AABB extents; they are not a pixel render.

- **RF-23:** camera X = 1.4 m is in front of the airbox (front 0.86 m) and the intercooler (front 0.76 m), so the airbox and intercooler are **foreground**, with the radiator top tank (Z 435 > intercooler top 410) visible above the intercooler and the engine shell behind. Projected extents: airbox ≈201×215 px, radiator ≈182×338 px, intercooler ≈180×333 px, engine ≈488×440 px, cover ≈94×59 px. The fan shroud is behind the stack and is **not** claimed in this frame; RF-24 owns it.
- **RF-24:** camera Y = +1.25 m is LH/outboard of the shell (max Y 0.48 m), looking across the fan axis **from outboard LH**, not from the engine side. The view direction is ~**84.5° off the +X fan axis**, so the shroud is a tall edge-on sliver (projected ≈73×406 px) and the opening is foreshortened; the frame is scoped to **side registration** — fan tips, shroud ring/inner lip and axial overlap in profile — not a face-on circular-opening proof. The fan (X 0.570–0.618) is in front of the shroud (X 0.610–0.650) from this side. The airbox is in the background.
- **RF-25:** camera X = 0.35 m, Y = −1.35 m (RH/outboard), looks rearward at the downpipe exit (−0.222 m) and the run to −1.32 m; the exhaust is foreground (projected ≈438×297 px), the engine is the background at the right. The flange, pipe, muffler and tailpipe are all in front of the camera's near plane and inside the frustum.
- **RF-26:** camera X = 1.6 m is on the **+X (clipped-away) side** of the X = 690 mm plane, so the +X cap faces are visible (the D-047/M12 lesson). The intercooler (X 712–760) is clipped away entirely; the radiator (650–706) and airbox (600–800) are cut at 690; the shroud (610–650) is behind the plane and is **not cut**. Projected extents: radiator ≈582×470 px, airbox ≈230×195 px, shroud ≈283×356 px, engine ≈713×508 px. The shroud no-cap rule is not visually exercised at this plane; §9 test 8 is its proof.
- **RF-27:** same pose as RF-23 with X-Ray on and **Labels on**; the hardware/shell/cover are ghosted at 0.22, the internals are hidden by the Vehicle context, the cap sources are skipped (`skipWhenGhosted`), and only the three exterior labels may appear. The frame must show no opaque hardware, no internals, and no internal/cylinder labels. The load-order case (X-Ray enabled before the lazy load finished) is covered by §9 test 7 and acceptance 6, not by this static frame.

### 8.2 Checklists

**Shared (RF-23…RF-27):**
1. The five stock parts are present and in their planned positions; no part floats detached from its intended mate (airbox collar at the duct/body boss, exhaust flange at the downpipe cap, shroud flange at the radiator rear face).
2. The detailed internal assembly is **not visible**; the engine reads as a complete assembled exterior.
3. No visible interference: fan tips clear the shroud ring; the airbox collar clears the radiator relief; the airbox does not cut the radiator/intercooler; the exhaust does not cut the shell or floor.
4. The materials read as black plastic / aluminium / aluminized steel / rubber; no texture/decal.
5. **Zero-state sanity:** all five frames are pinned at Explode 0, so the hardware/shell/cover are static. This item does not prove the effective-explode rule; acceptance 8 sets Vehicle + Explode 100 for that proof.

**Per-frame:**
- **RF-23:** the airbox is at the RH front corner with its lid/snorkel visible; the intercooler is the frontmost stack element with the radiator top tank above it; the engine/cover sit behind. **Labels:** only the three exterior labels may appear; no internal-part or cylinder-number labels (opaque-shell check).
- **RF-24:** the fan and clutch are visible at the shroud aperture; the shroud ring and inner lip are seen **in profile** with visible radial/axial registration; the opening is **not** claimed face-on. The camera is outboard LH, ~84.5° off the fan axis.
- **RF-25:** the 3.5 in flange mates to the downpipe cap; the pipe bends rearward, enters the muffler, and exits via the tailpipe/tip; the hanger stubs read as mounts; the run stays above the floor.
- **RF-26:** the radiator and airbox cut faces are solid/hatched, not hollow; the intercooler is absent (clipped away); the shroud is behind the plane and **is not cut**, so this frame does not exercise the shroud no-cap rule; §9 test 8 proves it. No internal caps are visible.
- **RF-27:** the shell/hardware/cover are ghosted consistently (no opaque hardware left behind); the internals are absent; **only the three exterior labels may appear; no internal-part or cylinder-number labels even under X-Ray**; the hardware ghosting restores correctly when X-Ray is turned off (manual check).

### 8.3 G-FRAME-M14 — the named build gate

**This VM has no WebGL; the planning frames are geometry projections, not renders.** The D-047 lesson is binding: M12 pinned poses without a render check and three failed at build time. Therefore:

- The build must capture RF-23…RF-27 at the pinned poses and verify every checklist item on the **actual render**. The `?rf` capture harness must wait until `vehicleHardwareLoadState === 'loaded'` (the frame definition is state, not a load barrier) before taking the screenshot; a timeout or a `failed` state is a frame-gate failure, not a blank capture.
- If a frame fails (occlusion, a part out of frame, a cap missing, a false disc, a ghosting failure), the build **stops and reports** a proposed pose/state change; it does **not** silently move the camera or change the section plane. An owner-approved deviation may be recorded in `docs/M14-MEASUREMENTS.md` following the D-047 precedent.
- The build also captures RF-1…RF-22 with Vehicle off and a reviewer compares the 3D viewport region **manually** against the committed PNGs with the changed control panel/title/subtitle masked; any 3D difference is a stop-and-report (the full-page UI delta from the new control is expected and recorded). No automated masked pixel-diff is claimed or required.

### 8.4 Invariance

- Vehicle off: the 3D viewport content of RF-1…RF-22 is unchanged; the stock assets, catalog and interfaces are byte-identical.
- Vehicle on: no existing frame is re-baselined; the five new frames are additive.
- The full-page PNGs of RF-1…RF-22 change only because the Views control is added; the build records the UI delta and a reviewer compares the 3D region manually with the changed UI masked (M12 QA-10 precedent; no automated masked pixel-diff).

---

## 9. Tests

The existing suite (114 tests, 23 files at M13) must pass. Test-file accounting: **2 new files** (`src/renderer/vehicleHardware.test.ts`, `src/renderer/sceneContext.test.ts`) + **3 edited files** (`src/renderer/viewLayout.test.ts`, `src/ui/referenceFrames.test.ts`, `src/ui/uiText.test.ts`). **`src/renderer/intakeCover.test.ts` is not edited**; its pinned `syncExteriorShellState` regex must pass unchanged. No other test file is edited; `src/assets/**`, `src/catalog/**` and the frozen asset tests are untouched.

**`src/renderer/sceneContext.test.ts` (new; Node-only pure module):**

1. **Resolver truth table (pure, by construction).** For all combinations of `exteriorVisible`, `xrayEnabled`, `vehicleEnabled`, `loadState` (`idle`/`loading`/`loaded`/`failed`) and `frontStackConflict`, assert:
   - `vehicleContextActive` is true only when `vehicleEnabled && (exteriorVisible || xrayEnabled) && loadState === 'loaded' && !frontStackConflict`;
   - `internalVisible === !vehicleContextActive`;
   - `vehicleHardwareVisible === vehicleContextActive`;
   - `shellVisible === (exteriorVisible || xrayEnabled)`;
   - `ghostShell === xrayEnabled && shellVisible`; `ghostHardware === xrayEnabled && vehicleHardwareVisible`;
   - **`!(internalVisible && vehicleHardwareVisible)` for every row**;
   - a vehicle request with Exterior/X-Ray off keeps the internals visible and hides the hardware (no empty scene);
   - a failed load keeps the internals visible;
   - `frontStackConflict` keeps the internals visible and hides the hardware even when Vehicle is on and loaded.
   *The mutual-exclusion line is true by definition here; this test catches resolver-table errors, not a renderer that ignores the table.*

1b. **Scene-graph application (the real mutual-exclusion test).** Build fake targets `{internalRoot:{visible:true}, mainShaft:{visible:true}, vehicleHardwareGroup:{visible:false}, exteriorShellGroup:{visible:false}, intakeCoverGroup:{visible:false}}`; call `applySceneVisibility(targets, visibility, intakeCoverEnabled)` for every truth-table row and assert the **actual `.visible` flags**:
   - Vehicle on/loaded (no conflict): `internalRoot.visible === false`, `mainShaft.visible === false`, `vehicleHardwareGroup.visible === true`;
   - Vehicle off, loading, failed, or `frontStackConflict`: `internalRoot.visible === true`, `mainShaft.visible === true`, `vehicleHardwareGroup.visible === false`;
   - shell/cover flags follow `shellVisible`/`intakeCoverVisible`.
   Source checks: `engineScene.ts` calls `applySceneVisibility` with `v8Batches.root`, `mainShaft.mesh` and `vehicleHardware.group`; `getRenderStats()` returns `sceneGraphVisibility` read from those objects' `.visible` fields (not from the resolver). *Catches: the renderer leaving `v8Batches.root` / `mainShaft.mesh` visible alongside the hardware, and stats that report the resolver instead of the rendered state.*

2. **Effective explode and labels.** `resolveEffectiveExplodeFactor(0.37, true) === 0`; `(0.37, false) === 0.37`; `(1, true) === 0`; `(0, false) === 0`; non-finite/NaN handling is the existing clamp behavior where relevant. `resolveLabelContext(true)` returns `{ vehicleContext: true }`; `false` returns `{ vehicleContext: false }`.
   *Catches: a floating cover/external variant in Vehicle view, a stored explode value lost on exit, and a label context that never reaches the label rule.*

**`src/renderer/vehicleHardware.test.ts` (new; Node-only; `node:fs` GLB parse + pure module; no WebGL):**

3. **Asset contract and bounds.** `public/models/vehicle/vehicle_hardware_stock.glb` exists; file size **≤ 1,228,800 B**; root `vehicle_hardware_stock` with child groups `veh_airbox`, `veh_radiator`, `veh_fan_shroud`, `veh_intercooler`, `veh_exhaust`; exactly **4** `MeshStandardMaterial`s; no images/textures/UVs/skins/morphs/animations; indexed `POSITION` + `NORMAL` triangles; per-part triangles ≤ 5,600 / 6,400 / 4,800 / 6,200 / 8,400 and total ≤ **31,400**; **per-part group bounds match §7.4 within ±0.10 mm**: airbox **X 566.52–860, Y −820…−470.61, Z 240–520**, radiator **X 650–706, Y ±500, Z −108…420**, shroud **X 610–650, Y ±252, Z −96…408**, intercooler **X 712–760, Y ±520, Z −100…410**, exhaust **X −1,364.45…−161.97, Y −345.0…−101.79, Z −220.0…+84.45**; the four markers match §7.1 within ±1.0 mm, ±0.5°, ±1.0 mm radius; **the 70 mm collar axis end (649.197, −541.399, 360.664) is inside the body inlet boss and the body face is at t = 112.141 mm along the marker normal**; **the radiator RH rear-corner relief is present (8 mm deep × 50 mm tall × 15 mm long)**; radiator and intercooler have 0 boundary edges at 1e-5 m; the shroud is open (boundary edges > 0) and is not a cap source. *Catches: a missing/renamed asset, a texture/decal smuggled in, a stray marker, a budget or file-size overrun, a wrong marker/bounds, an excluded collar, a collar that does not reach the body, and a shroud that would be chord-capped into a false disc.*

4. **Markers and fan registration.** `if_vehicle_airbox_mount` is within ±1.0 mm / ±0.5° of the measured `if_airbox_mount`; `if_vehicle_downpipe_flange` is within ±1.0 mm / ±0.5° of (−222, −162, −18) with the measured normal; `if_vehicle_shroud_center` is `(630, 0, 156)`, normal +X, inner **222.0 ± 1.0**, outer **252.0 ± 1.0**; `if_vehicle_radiator_rear` is `(650, 0, 156)`, normal −X. Pure helpers `shroudRadialClearanceMm()` = **10.0**, `shroudAxialOverlapMm()` = **7.8**, `shroudClutchClearanceMm()` = **40.0**. *Catches: a shroud that drifts off the fan/clutch, a marker mismatch with the frozen shell, and a shroud that would contact the fan.*

5. **Budget guard (pure, with cap-only and measured values distinguished).** Constants: engine fullest measured **310,900**; engine cap guard **319,128**; phone **320,000**; desktop **360,000**; hardware cap **31,400**; vehicle stock guard **70,364**; vehicle conservative guard **81,164**; global guard **319,128**; phone headroom **872**. Assert:
   - `310_900 + 0 === 310_900` (engine state unchanged);
   - `320_000 − 310_900 === 9_100`; `320_000 − 319_128 === 872`;
   - `37_100 + 31_400 + 1_040 + 64 === 69_604`; `37_100 + 31_400 + 1_800 + 64 === 70_364`; `70_364 + 10_800 === 81_164`;
   - `Math.max(319_128, 81_164) === 319_128`;
   - `319_128 + 31_400 === 350_528` and `350_528 > 320_000` (the forbidden co-visible state); `350_528 − 320_000 === 30_528` (the minimum phone-cap increase under option (b));
   - `32 × 3_464 === 110_848`; `32 × 2_483 === 79_456` and `110_848 − 79_456 === 31_392`; `32 × 2_482 === 79_424` and `110_848 − 79_424 === 31_424` (the option-(d) donor arithmetic);
   - the vehicle guard and the global guard are both ≤ the D-033 caps;
   - the hardware total cap is the sum of the five per-part caps;
   - **no D-033 amendment constant** appears in the module (no `320_000 +`, no `360_000` used as a phone cap).
   *Catches: a guard that adds hardware to the engine state, a spec that quietly raises the phone cap, a per-part cap that drifts from the total, and a "measured" row that is actually a cap.*

6. **Variant precedence (OD-2) and the V2 geometry audit.** `computeStockHardwareVisibility([])` shows all five parts; `['intake_highflow']` shows **none** (the unsupported combination withholds all five, not just the airbox); `['intercooler_upgraded']` hides the intercooler only; `['exhaust_4in']` hides the exhaust only; `['intercooler_upgraded','exhaust_4in']` hides both and leaves airbox/radiator/shroud; all three hide all five; unknown ids are ignored; a failed variant is not in the active set, so its stock part stays and a failed V2 does not set `frontStackConflict`. Geometry audit: parse `public/models/variants/intake_tract_engine_highflow.glb`; assert **14 vertices inside the §7.4 radiator envelope and 6 inside the intercooler envelope**; assert V1/V3/V4 have **0** vertices inside the stock radiator/intercooler envelopes. *Catches: a high-flow combination silently rendered through the stock stack, a double airbox/core/exhaust, a stock part hidden by a variant that failed to load, and a radiator/shroud that disappears without the unsupported-combination rule.*

7. **Ghost registry load order and explode neutrality.** Create four fake materials `{transparent:false, opacity:1, depthWrite:true}`; `setGhosted(true)` then `register(materials)` → all four become `transparent:true, opacity:0.22, depthWrite:false`; `setGhosted(false)` restores the exact snapshots; the reverse order also works. Source check: `engineScene.ts` calls `exteriorGhostRegistry.register(...)` for the hardware materials after the load and before the first `syncSceneContext()`. Explode: `computeVariantExplodeOffsetMm` is **not** called on the hardware group; its position stays `(0,0,0)`; `resolveEffectiveExplodeFactor(1, true) === 0`. **Source/behavior check:** `engineScene.ts` computes one `effectiveExplodeFactor = resolveEffectiveExplodeFactor(explodeFactor, vehicleContextActive)` and passes it to **both** `computeVariantExplodeOffsetMm` and `computeIntakeCoverExplodeOffsetMm`; no raw `explodeFactor` reaches those calls in Vehicle view. *Catches: the M12 load-order bug (opaque hardware under X-Ray when X-Ray was on before the load), a hardware group that floats with Explode, and a variant/cover that ignores the effective factor while the pure helper test still passes.*

8. **Section cap sources and the shroud exclusion.** `VEHICLE_HARDWARE_SECTION_CAP_PARTS` is `['airbox','radiator','intercooler','exhaust']`; `VEHICLE_HARDWARE_NO_CAP_PARTS` is `['fan_shroud']`; source check `engineScene.ts` registers `veh_airbox`, `veh_radiator`, `veh_intercooler`, `veh_exhaust` in `staticCapSources` with `skipWhenGhosted: true`, and does **not** register `veh_fan_shroud`; `SECTION_CAP_MAX_TRIANGLES === 16_000` unchanged; `renderer.render(` appears exactly once; no `new THREE.WebGLRenderTarget(`, `stencil: true`, `setRenderTarget`, or `overrideMaterial`. Node geometry check: build a closed radiator-box `CapSource` at X = 690 and assert > 0 cap triangles; assert the shroud group is in `VEHICLE_HARDWARE_NO_CAP_PARTS` and absent from `staticCapSources`; source-check that the hardware group is **added once** and `group.visible = vehicleContextActive`, so a hidden group's sources are skipped by `isObjectAndAncestorsVisible` (0 cap triangles) and re-activation restores them. The test does not cap the shroud; its absence is the contract. *Catches: a shroud chord-capped into a false disc, a missing radiator/intercooler cap, an extra pass, a new cap material, and a hidden hardware group that still contributes caps.*

9. **Labels.** `isLabelVisibleUnderViewRules('internal-part', p, { vehicleContext:true, exteriorVisible:true, xrayEnabled:true, sectionMode:'off', sectionPositionMm:900 }) === false`; same for `cylinder-number`; `exterior-part` is true when the shell is visible and false when it is not; with `vehicleContext` omitted, the pre-M14 behavior is unchanged (internal labels visible under X-Ray + opaque shell off). *Catches: internal labels floating in Vehicle view, and a label rule that changes the stock views.*

10. **Reference frames (edit `src/ui/referenceFrames.test.ts`).** The table has **27** entries; RF-23…RF-27 exist after RF-22; each validates through the existing loop; all five have `vehicle: true`, `exterior: true`, `xray` false except RF-27 true; RF-23 and RF-27 have `intakeCover: true`, RF-24/25/26 false; **RF-23 and RF-27 have `labels: true`**, the rest false; RF-26 has `sectionMode:'x'`, `sectionPositionMm: 690`; RF-27's camera position/target/theta equal RF-23's; RF-1…RF-22 are unchanged and have `vehicle` undefined/false; `docs/REFERENCE_FRAMES.md` contains `**RF-23**`…`**RF-27**`, the M14 checklist heading, **`?rf=RF-27` in the common convention line**, and a **`Vehicle` column** in the summary table. *Catches: a frame that does not enable Vehicle, a section plane that misses the radiator, a stock frame that leaks the Vehicle state, a camera pose that is not the pinned one, and a docs table that cannot identify the Vehicle state.*

11. **UI text (edit `src/ui/uiText.test.ts`).** Subtitle `Milestone 14 — Stock Vehicle Hardware` in both `engineControls.ts` and `index.html`; the exact `Vehicle` label and note in §10.2; `vehicleCheckbox.checked = false` default; the auto-Exterior rule source; no new Build control; no catalog change; the M12 cover label/note, M11 cutaway note and M10 caption are unchanged; the build note is the M14 text in §10.3. *Catches: a subtitle drift, a default-on Vehicle control, a stale build note, and a lost M12/M11 caption.*

12. **Stock invariance and load failure (pure/source; runtime stats live in acceptance).** With `vehicleEnabled=false`, `resolveSceneVisibility` returns `internalVisible:true`, `vehicleHardwareVisible:false`; the hardware loader is called only from `setVehicleEnabled(true)` (source check: no `loadVehicleHardware` at startup); `?vehicle=1` is read in `main.ts` and calls `ui.setVehicleChecked(true)`; the `?benchmark=1` readiness expression includes `vehicleHardwareLoadState === 'loaded' || 'failed'`; a failed load sets `vehicleHardwareLoadState='failed'`, keeps `internalVisible:true`, and does not throw/hang. **The runtime `visibleSceneTriangles` values (310,900 / 308,324 / 69,604 / 70,364) and `sceneGraphVisibility` are browser acceptance 4/8 and are recorded in `docs/M14-MEASUREMENTS.md`; they are not asserted in this Node-only file.** *Catches: a preloaded/visible hardware group at startup, a missing benchmark selector/readiness gate, and an empty scene/hang on load failure.* **Browser acceptance (acceptance 8):** rename the GLB in a scratch build, enable Vehicle, and confirm the engine view remains, the stats report `failed`, and the benchmark completes.

The headless tests cannot judge the look. RF-23…RF-27 are the visual gate; that split is the same one used since M2.

---

## 10. UI text

### 10.1 Subtitle

- `index.html` subtitle → `Milestone 14 — Stock Vehicle Hardware`.
- `src/ui/engineControls.ts` runtime subtitle (`bannerSubtitle.textContent`) → `Milestone 14 — Stock Vehicle Hardware`.

### 10.2 Vehicle control and note (verbatim)

- Checkbox label: **`Vehicle`**; id `m14-vehicle-checkbox`; default unchecked.
- Note text:

```
Stock vehicle hardware (airbox, radiator, fan shroud, intercooler, exhaust) shows with Exterior or X-Ray. Vehicle view hides the engine's internal assembly so the bay reads as a complete truck front end; uncheck Vehicle to return to the engine view for internals and Explode. Vehicle view is unavailable while the high-flow intake is selected because its frozen tract occupies the stock front-stack space. The radiator and intercooler core envelopes and the 3.5 in exhaust diameter are published; the airbox, shroud, mounts, front-stack intercooler position and exhaust cosmetics are illustrative placeholders, not measured LLY values.
```

The note sits below the M12 cover note and above the M11 cutaway note. The Vehicle checkbox auto-enables Exterior when it is checked with neither Exterior nor X-Ray on.

### 10.3 Build note (verbatim)

Replace the M13 build note with exactly:

```
3D variants: exterior parts render with the Exterior shell shown (Exterior or X-Ray); the low-compression piston and forged connecting rods render in the engine view's internal assembly (not in Vehicle view).
```

### 10.4 No other UI change

The controls, readouts, Build panel, Dyno, Sound, captions and the `?section`/`sectionPos`/`?rf` surface are otherwise unchanged. The M12 `Intake cover` checkbox/note, the M11 cutaway note and the M10 illustrative caption are unchanged. `?rf=RF-23`…`?rf=RF-27` are new; `?rf=RF-1`…`?rf=RF-22` keep their meaning and set `Vehicle` off.

---

## 11. Build deliverables (docs and paperwork)

1. **`docs/M14-VEHICLE-HARDWARE.md` (new):** the part record — the five IN and two OUT verdicts, the photo/web evidence and grades, the measured anchors/fan/downpipe, the Vehicle-context state model and OD-1/OD-2, the asset contract and per-part dimensions/provenance, placement/clearances, the section/explode/X-Ray/labels interactions, the budgets/caps, the frames/G-FRAME-M14, the illustrative-scope statement, and the recorded-not-adopted register. §12.7 gives the required section list.
2. **`docs/M14-MEASUREMENTS.md` (new):** the measured record — production bundle; the hardware build log (per-part triangles, total, bytes, materials, markers, boundary edges/components); the current scene baseline; the `?benchmark=1` matrix (desktop/phone × engine/vehicle × hardware off/on, with the exact acceptance-4 URLs) including the **actual** `sceneGraphVisibility` flags and `visibleSceneTriangles`, the D-033 verdict table and headroom; the **engine 310,900 / 319,128 / 872** and **vehicle 70,364 stock / 81,164 conservative** guards; the option-(b) minimum **350,528** and option-(d) **31,392 / 31,424** arithmetic; the section X = 690 cap triangles and CPU (radiator + airbox only) plus the separate exhaust-plane cap; the RF-23…RF-27 captures with SHA-256 and checklist results; the RF-1…RF-22 **manual** 3D-region comparison notes and the full-page UI delta; the frozen-file/SHA audit; the exact commands. §12.8.
3. **`docs/REFERENCE_FRAMES.md`:** add RF-23…RF-27 definitions, images and checklists; add the five rows and the **Vehicle column** to the summary table; update the intro count from twenty-two to twenty-seven, the provenance line to include M14, and the common convention line to `?rf=RF-1` through `?rf=RF-27`; add the M14 checklist section (§12.6).
4. **`docs/ASSET_CONTRACT.md`:** add the scene-placed stock-hardware class note and the four markers (§12.4); the class itself is the existing scene-placed class.
5. **`docs/THREE_API_NOTES.md`:** frozen — no new API (the existing `loadVariantScene` / `wrapInPartLocalFrame` / `prepareCapSource` / `createExteriorGhostRegistry` paths are reused; `castShadow` is set on the loaded meshes).
6. **`docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`:** exact text in §12.1–§12.3.
7. **`assets-src/PROVENANCE.md`:** add the hardware row (§12.5).
8. **`index.html`:** subtitle only.
9. **`docs/M8-VARIANTS.md`, `docs/M10-*`, `docs/M11-*`, `docs/M12-*`, `docs/M13-*`:** frozen; the M14 docs link back. The M8 V4 position is unchanged; OD-2 records the stock-core yield.
10. **`docs/reference-frames/RF-23.png` … `RF-27.png`:** new captures.

---

## 12. Exact paperwork text

### 12.1 `docs/PLAN.md`

After the Milestone 13 block, add:

> 14. **Stock vehicle-side hardware**
>     - Add the stock truck-side hardware around the engine in a default-off Vehicle view: the RH front airbox and its outlet collar (the existing M10 intake duct is the routing), the radiator and fan shroud registered to the shipped fan, the stock intercooler core at its photo-implied front-stack placeholder position, and a representative 3.5-inch exhaust continuation from the measured downpipe exit; record the dual-generator idler and the medium-duty oil filler/filter arrangement OUT with reasons.
>     - Exit: Vehicle view shows the hardware with the engine's detailed internal assembly hidden; Vehicle off leaves the stock 3D scene unchanged; the hardware passes the per-part caps (31,400 total), marker/clearance and section rules; D-033 passes on both tiers with measured numbers and **no amendment**; RF-23…RF-27 pass their checklists; PLAN/DECISIONS/OPEN_ITEMS/ASSET_CONTRACT are updated in the same PR.

Replace the post-13 candidates line with:

> After 14: real wall-thickness section geometry, an analytic coil section for the valve springs, a camshaft visual with valve-lift kinematics (owner decision deferred, D-048), and shareable builds (deprioritised by the owner, 2026-11-15 — D-045) are candidates.

### 12.2 `docs/DECISIONS.md`

Add under a new `## 2026-11-16 — Milestone 14 spec` heading:

> - **D-049 Stock vehicle-side hardware (Milestone 14).** The stock 2005 Silverado 2500HD (GMT800, LLY) truck-side hardware is added as a **default-off `Vehicle` Views context**, not a catalog variant: the **airbox** body/lid/snorkel at the measured `if_airbox_mount` (587.4, −510.5, 371.9), with a **70 mm outlet collar seating in a body inlet boss** (group AABB X 566.52–860, Y −820…−470.61, Z 240–520) and the existing M10 intake duct as the routing; the **radiator** using the published Mishimoto MMRAD-DMAX-01 replacement core (865.1 × 498.1 × 55.9 mm, grade C) at X 650–706, Y ±500, Z −108…420, with an 8 mm RH rear-corner collar relief; the **fan shroud** registered to the measured shipped fan (centre (0, 156), outer radius 212.0, blades X 570.0–617.8, 9 blades) at inner radius 222.0 (10.0 mm radial), outer 252.0, X 610–650, flange at the radiator rear face X 650; the **stock intercooler core** using the CSF 6007 stock-size proxy (952.5 × 466.7 × 47.6 mm, 76.2 mm stubs, grade C) at X 712–760, Y ±520, Z −100…410, where **the front-stack position is photo-implied and a labeled placeholder, not a GM mounting datum**; and a representative **88.9 mm (3.5 in) exhaust continuation** from the measured downpipe **closed 14-triangle exit cap** (−222.0, −162.0, −18.0), with a Ø220 × 340 mm muffler, a defined centreline and AABB X −1,364.45…−161.97, Y −345.0…−101.79, Z −220.0…+84.45, and tailpipe/tip/hanger placeholder detail. Only the radiator core, intercooler core and exhaust diameter are published; the airbox planform, shroud, radiator tanks/mounts, **intercooler position and mounts**, and exhaust cosmetics are **labeled placeholders** sized to the measured shell and photos. **Owner Decision OD-1:** adopt **Option A with the R1 scene-state resolver** — when `Vehicle` is on and Exterior/X-Ray is active, the detailed internal assembly and main shaft are **not rendered** and the hardware is shown; when off (or Exterior/X-Ray off, or the lazy load failed), the M13 engine view is restored exactly. **D-033 is not amended:** the engine state keeps its measured **310,900** / derived **319,128** guard (phone **872**, 0.2725 %); the vehicle state is separately guarded at **70,364** stock / **81,164** conservative (phone headroom 249,636 / 238,836); the global guard is `max(319,128, 81,164) = 319,128`. The hardware cap is **31,400 triangles** (5,600 airbox + 6,400 radiator + 4,800 shroud + 6,200 intercooler + 8,400 exhaust), **+8 draw calls**, **≤ 1,200 KiB**, 4 untextured materials, 0 textures, lazy-loaded on first activation; if hardware were co-visible with the engine state the combined cap would be **350,528 / 320,000**, the exact state the tests forbid. Options B (co-visible default-off toggle; the **minimum** phone cap is **350,528**, +30,528; 360,000 is the desktop cap and a conservative policy choice), C (phone LOD 9,100, still 328,228 cap; needs ≥350,528 or ≤872 LOD), D (springs: 2,483/spring saves **31,392** — 8 short of the cap; 2,482/spring saves **31,424** and clears, from the 110,848-triangle set/pistons/heads, destroying stock views) and E (9,100 minimal package, still 328,228 cap) are rejected. **Owner Decision OD-2:** the stock intercooler core hides for `intercooler_upgraded` and the exhaust continuation hides for `exhaust_4in`; radiator/shroud have no variant; **the `intake_highflow` + Vehicle combination is explicitly unsupported** because the frozen V2 tract has 14 vertices inside the stock radiator envelope and 6 inside the stock intercooler envelope, so V2 active/loaded suspends the Vehicle context (internals visible, all five stock parts withheld) and the UI note says so; V4 stays at its frozen `if_hot_side_inlet` service point and is not moved to the stock-core position. **OUT:** the **dual-generator idler** (no stock LLY 2500HD fitment/part/RPO drawing; one alternator in the owner's LLY photos; aftermarket dual-alternator brackets are not stock and would open the frozen M10 belt layout) and the **medium-duty oil filler/filter arrangement** (C4500/C5500 medium-duty chassis, not the 2500HD pickup; the pickup oil fill/fuel filter are already in the M10 shell). **Stock invariance:** before the first activation the hardware is not fetched or added; after a load it is kept hidden when Vehicle is off. The 3D viewport content of RF-1…RF-22 is unchanged, the stock assets/catalog/interfaces are byte-identical, and the full-page PNG change is limited to the new Views control; a reviewer masks the changed UI and compares the 3D region manually (M12 QA-10 precedent; no automated masked pixel-diff is claimed). **Frozen:** `src/core/interfaces.ts` (D-010), `src/perf/**`, `src/config/**`, `src/audio/**`, `src/assets/**`, `catalog/**`, `src/catalog/**`, the ten stock GLBs, the **six `public/models/variants/*.glb` (five M8 + the M13 forged rod)**, the M10 shell, the M12 cover, `src/renderer/sectionCaps.ts`, `src/renderer/intakeCover.ts`, `src/renderer/exteriorLoader.ts`, `src/renderer/layout.ts`, `src/renderer/partLoader.ts`, `src/renderer/variantLoader.ts`, `src/renderer/partVariants.ts`; the new/changed files are those in the M14 spec §14.

### 12.3 `docs/OPEN_ITEMS.md`

Remove the deferred-candidate item:

> `- [ ] **Dual-generator idler, medium-duty oil filler/filter arrangement, vehicle-side hardware (airbox, intercooler core, radiator/shroud, exhaust beyond the downpipe)** — out of scope for M10.` (`docs/OPEN_ITEMS.md:19`)

Replace the watch item:

> `- [ ] **Stock vehicle-side hardware** (intercooler core, airbox, exhaust beyond the turbo downpipe) is not modeled in the exterior shell; the M8 modified variants for those slots are shown at documented service points, so stock-vs-modified 3D comparison is modified-only there — revisit if the shell or a stock hardware model is added.` (`docs/OPEN_ITEMS.md:31`)

with:

> - [ ] **Stock vehicle-side hardware is modeled in the Vehicle view only** — M14 adds the airbox, radiator/shroud, stock intercooler core and exhaust continuation as a default-off Vehicle context; the modified M8 variants still show at their documented service points, the stock core yields to `intercooler_upgraded`, the exhaust yields to `exhaust_4in` (OD-2), and the **`intake_highflow` + Vehicle combination is unsupported** (V2's frozen tract overlaps the stock radiator/intercooler envelopes; the Vehicle context is suspended while V2 is active). The M10 charge pipes still terminate at `if_hot_side_inlet`, so the stock core's stubs are not connected; the stock core's front-stack position is not adopted for V4. Revisit if a full charge-pipe route, a stock-position V4 asset, or a V2-compatible front stack is planned.

Add to **Deferred candidates**:

> - [ ] **Dual-generator idler** — **OUT of M14**: no stock 2005 LLY 2500HD dual-generator idler, part number or GM RPO/upfitter drawing was located; the owner's LLY bay photos show one alternator; aftermarket dual-alternator brackets are not stock and would require re-routing the frozen M10 front drive. Revisit only with a GM upfitter/RPO drawing and an owner decision to open the belt layout.
> - [ ] **Medium-duty oil filler/filter arrangement** — **OUT of M14**: the C4500/C5500 medium-duty chassis uses a different engine installation; the 2500HD pickup's oil fill and fuel filter are already in the M10 shell. Modelling the medium-duty arrangement on a 2500HD would fabricate an installation. Revisit only for a separate medium-duty vehicle context.

Add to **Watch items**:

> - [ ] **Vehicle hardware dimensions are illustrative placeholders** — the radiator core and intercooler core use published replacement/proxy envelopes (Mishimoto MMRAD-DMAX-01, CSF 6007, grade C); the airbox planform, shroud, radiator tanks/brackets, exhaust muffler/hangers/tip, **the intercooler's front-stack position** and all mounting coordinates are labeled placeholders sized to the measured shell and photos. Revisit with GM dimensioned drawings or measured parts.
> - [ ] **Fan-shroud fitment/dimension conflict** — Dorman 620-992 is listed for a 2015 3500HD with a 560.1 mm max blade diameter in one catalog and for 2001–2005 in another; M14 does not adopt either dimension, designs to the shipped 424 mm fan, and cites OER A56217 for 2001–2005 upper-shroud fitment only. Revisit with a measured stock shroud.
> - [ ] **Vehicle full-page reference-frame invariance** — the new `Vehicle` Views control changes the full-page PNGs of RF-1…RF-22; M14 records the UI delta and a reviewer compares the 3D viewport region manually with the changed control panel/title/subtitle masked (M12 QA-10 precedent; no automated masked pixel-diff is claimed). Revisit if the UI layout is re-baselined.

### 12.4 `docs/ASSET_CONTRACT.md`

Append to the scene-placed class section:

> ### M14 stock vehicle hardware (scene-placed stock add-on, D-049)
>
> `public/models/vehicle/vehicle_hardware_stock.glb` is a **scene-placed stock add-on** (same class as the M8 external variants and M12 cover): project-frame authored at final positions, Y-up export, no pivot/animation, root `vehicle_hardware_stock`, child part groups `veh_airbox`, `veh_radiator`, `veh_fan_shroud`, `veh_intercooler`, `veh_exhaust`, four untextured `MeshStandardMaterial`s, indexed `POSITION` + `NORMAL` triangles only, **≤ 31,400 triangles**, **≤ 1,200 KiB**, 0 textures/UVs. Named empty markers: `if_vehicle_airbox_mount` (587.4, −510.5, 371.9; normal 0.882820, −0.441410, −0.160513; r 44.45), `if_vehicle_downpipe_flange` (−222.0, −162.0, −18.0; normal −0.0059, 0.0892, 0.9960; r 44.45), `if_vehicle_shroud_center` (630.0, 0.0, 156.0; normal +X; inner r 222.0, outer r 252.0), `if_vehicle_radiator_rear` (650.0, 0.0, 156.0; normal −X). The airbox is a body/lid/snorkel with a **70 mm collar seating in a body inlet boss**; the intercooler's X 712–760 / Y ±520 / Z −100…410 **front-stack position is a photo-implied labeled placeholder**; the exhaust follows the defined §7.4 centreline. The asset is lazy-loaded on first `Vehicle` activation; before that it is not present in the stock scene, and after a load it is **kept in the scene and hidden** while `Vehicle` is off. It is registered with the exterior ghost registry and the M11 static cap sources (except the shroud, which is clipped without caps).

### 12.5 `assets-src/PROVENANCE.md`

Add to the variant/asset table:

> | `public/models/vehicle/vehicle_hardware_stock.glb` | `vehicle_hardware_stock` + `veh_airbox`, `veh_radiator`, `veh_fan_shroud`, `veh_intercooler`, `veh_exhaust`; markers `if_vehicle_airbox_mount`, `if_vehicle_downpipe_flange`, `if_vehicle_shroud_center`, `if_vehicle_radiator_rear` | `assets-src/blender/build_vehicle_hardware.py` + `assets-src/vehicle_hardware_dimensions.json`; measured datums from `public/Duramax_LLY_2005_66L_V8.glb` / `assets-src/shell_dimensions.json` | **Published:** radiator core 865.1 × 498.1 × 55.9 mm (Mishimoto MMRAD-DMAX-01, grade C replacement); intercooler core 952.5 × 466.7 × 47.6 mm / 76.2 mm stubs (CSF 6007, grade C stock-size proxy); exhaust 88.9 mm (3.5 in) stock diameter. **Measured:** fan centre (0,156), r 212.0, blades 570.0–617.8; airbox mount 587.4, −510.5, 371.9; downpipe closed exit cap −222.0, −162.0, −18.0. **Illustrative:** airbox planform, 70 mm collar + body boss, shroud, radiator tanks/mounts, **intercooler front-stack position (photo-implied, not a GM datum)**, exhaust muffler/tailpipe/hangers and defined centreline, all PBR. |

### 12.6 `docs/REFERENCE_FRAMES.md`

Add the five rows to the summary table and the five frame sections. The shared checklist header becomes:

> ## Vehicle-Hardware Checklist (RF-23…RF-27, Milestone 14 Spec §8.2)

with the five shared items and the five per-frame items from §8.2. The intro count changes from "twenty-two" to "twenty-seven"; the provenance line adds "M14"; **the Common Capture Convention line changes from `?rf=RF-1` through `?rf=RF-22` to `?rf=RF-1` through `?rf=RF-27`**. The summary table gains a **`Vehicle` column after `Exterior`** (`Off` for RF-1…RF-22, `On` for RF-23…RF-27); the `View States (Explode / Section / X-Ray / Labels)` cell keeps its existing four states and the intake-cover note stays in that cell. RF-23…RF-27 are captured at `1440×900 → 1024×640` and stored as `docs/reference-frames/RF-23.png` … `RF-27.png`. RF-26's section row reads `X = 690.0 mm`, not any M11/M12 frame's plane. The checklist must not inherit RF-6/RF-19 section positions or RF-23's label state for the other frames; **RF-27 has Labels on** and is the Vehicle + X-Ray label proof.

### 12.7 `docs/M14-VEHICLE-HARDWARE.md` required content

1. Scope and the five IN / two OUT verdict table.
2. Photo evidence and the graded web sources.
3. Measured anchors, fan/clutch and downpipe exit.
4. The Vehicle-context state model and OD-1/OD-2.
5. Asset contract: groups, markers, materials, caps, file size.
6. Per-part dimensions and provenance (published vs placeholder).
7. Placement table and clearance audit (smallest numbers).
8. Section/explode/X-Ray/labels interactions.
9. Budgets and guards (the §5.4 numbers, measured vs cap).
10. Proof frames and G-FRAME-M14.
11. Recorded-not-adopted register.
12. Illustrative-scope statement and known limitations (no charge-pipe route, no body/frame, stock-only hardware).

### 12.8 `docs/M14-MEASUREMENTS.md` required content

1. Environment and exact commands.
2. Hardware build log: per-part triangles, total, bytes, materials, markers, boundary edges/components; collar end inside the body boss; radiator relief; exhaust centreline/AABB.
3. Current scene baseline and the vehicle-state totals.
4. `?benchmark=1` matrix: desktop/phone × engine/vehicle × hardware off/on (exact acceptance-4 URLs); scene/submitted/calls/VRAM/p95/dropped frames; the **actual** `sceneGraphVisibility` flags and `visibleSceneTriangles`; the D-033 verdict table, including the engine **310,900 / 319,128 / 872** and vehicle **70,364 / 81,164** guards; the high-flow fallback **110/72** calls.
5. Section X = 690 cap triangles and CPU times (radiator + airbox only); the separate exhaust-plane cap; the total ≤ 16,000.
6. RF-23…RF-27 captures with SHA-256 and checklist results.
7. RF-1…RF-22 **manual** 3D-region comparison notes (changed UI masked) and the full-page UI delta; no automated masked pixel-diff.
8. Frozen-file/SHA audit.
9. Any build deviation (with owner approval, D-047 precedent).

---

## 13. Acceptance criteria (Buckley verifies from a fresh clone)

1. **Frozen audit (executable).** Run:
   ```
   git diff --exit-code main -- \
     src/core src/perf src/config src/audio src/assets src/catalog \
     catalog/stock.json catalog/modified.json catalog/schema.json \
     src/renderer/exteriorLoader.ts src/renderer/layout.ts src/renderer/partLoader.ts \
     src/renderer/variantLoader.ts src/renderer/sectionCaps.ts src/renderer/intakeCover.ts \
     src/renderer/partVariants.ts src/catalog/index.ts \
     public/Duramax_LLY_2005_66L_V8.glb public/models/*_stock.glb \
     public/models/intake_cover_lly.glb public/models/variants/*.glb \
     public/hdri public/legacy \
     assets-src/blender/build_cylinder1.py assets-src/blender/build_variants.py \
     assets-src/blender/build_shell.py assets-src/blender/build_intake_cover.py \
     assets-src/dimensions.json assets-src/variant_dimensions.json \
     assets-src/cover_dimensions.json assets-src/shell_dimensions.json \
     docs/M{2,3,4,5,6,7,8,9}-MEASUREMENTS.md docs/M{10,11,12,13}-MEASUREMENTS.md \
     docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M8-VARIANTS.md \
     docs/M9-SOUND.md docs/M10-EXTERIOR.md docs/M11-CUTAWAYS.md \
     docs/M12-COVER.md docs/M13-INTERNAL-VARIANTS.md \
     docs/specs/M{0,1,2,3,4,5,6,7,8,9}-* docs/specs/M1{0,1,2,3}-* \
     docs/research/L7-* docs/research/M{8,9}-* docs/research/M1{0,1,2,3}-* \
     docs/PLANNING.md docs/ORCHESTRATOR.md docs/THREE_API_NOTES.md
   ```
   is empty. The 24-entry catalog, the schema, `src/core/interfaces.ts`, the ten stock GLBs, the **six `public/models/variants/*.glb` (five M8 + the M13 forged rod)**, the M10 shell and the M12 cover are byte-identical to `main`. `git diff --numstat main -- catalog` is empty. `src/renderer/intakeCover.test.ts` is **unchanged**, and its pinned `syncExteriorShellState` regex passes. The literal `…` is not part of any command.
2. **Fresh-clone gates:** `npm ci`, `npm run typecheck`, `npm test`, `npm run build` pass on Node 24. Exactly the five test files named in §9 are touched (2 new + 3 edited); no other test file is edited, including `src/renderer/intakeCover.test.ts`; `package.json`/`package-lock.json` unchanged; no new dependency.
3. **Asset audit:** `public/models/vehicle/vehicle_hardware_stock.glb` is ≤ **1,228,800 B**; root/groups/markers correct; **4** materials; no textures/UVs/images/skins/morphs/animations; indexed `POSITION`+`NORMAL`; per-part caps and total **≤ 31,400**; **bounds/markers as §7.1/§7.4** (airbox group X 566.52–860, Y −820…−470.61, Z 240–520; exhaust group X −1,364.45…−161.97, Y −345.0…−101.79, Z −220.0…+84.45); the **70 mm collar end is inside the body inlet boss**; the **radiator RH rear-corner relief is present**; radiator/intercooler closed; shroud open and not a cap source.
4. **Budget and rendered state:** the `?benchmark=1` matrix (desktop 1440×900 Full, phone 390×844 Phone; engine and vehicle; hardware off/on) uses these exact URLs:
   - Engine desktop `?benchmark=1&quality=full&exterior=1`; engine phone `?benchmark=1&quality=phone&exterior=1`.
   - Vehicle desktop `?benchmark=1&quality=full&exterior=1&vehicle=1`; vehicle phone `?benchmark=1&quality=phone&exterior=1&vehicle=1`.
   The matrix reports:
   - **Engine, hardware off:** scene **≤ 310,900** measured / **≤ 319,128** guard; calls **≤ 98/60**; submitted **≤ 583,596/310,452** measured, **≤ 584,804/311,436** for stock + rods + cover at cap (section-on bound **≤ 600,804/327,436**); VRAM **20.75/4.75 MiB**; phone headroom **872**.
   - **Vehicle, hardware on:** scene **≤ 69,604** (hardware at cap, cover measured) / **≤ 70,364** stock guard / **≤ 81,164** conservative; calls **≤ 98/60** for the supported vehicle states (nominal 88/50; V4/V3 combinations ≤90/52); submitted **≤ 101,004/69,604**; VRAM **20.75/4.75 MiB**; phone headroom **≥ 238,836**.
   - **Scene-graph assertion (rendered state, not resolver values):** with `?vehicle=1` loaded, `getRenderStats().sceneGraphVisibility` must report `{ internalRootVisible:false, mainShaftVisible:false, vehicleHardwareGroupVisible:true }` and `visibleSceneTriangles` **69,604** with the measured 1,040 cover (the **70,364** cover-cap figure is the budget guard, not a separate rendered state); with Vehicle off/loading/failed it must report the inverse (`true/true/false`) and the engine totals. A run that reports the resolver flags but leaves `v8Batches.root`/`mainShaft.mesh` visible fails this check. The stats are read from the actual `.visible` flags.
   - **No state exceeds 320,000/360,000; the global guard is 319,128; the hardware is never co-visible with the internals.** The unsupported `intake_highflow` fallback is the engine view with external variants (calls ≤110/72, still within D-033). Any breach is a stop-and-report.
   - p95 within the D-033 caps (16.7/33.3 ms), vehicle p95 ≤ the engine-state p95 for the same tier, 0 dropped frames.
5. **Section:** `?rf=RF-26` shows the radiator and airbox solid/hatched caps at X = 690, the intercooler clipped away, the shroud **behind the plane and not cut** (no false disc), and **no internal caps**; at X = 690 the capped sources are the radiator and airbox; a separate plane that cuts the exhaust (e.g. X = −500) records its cap; the combined cap total is ≤ **16,000** triangles; the shroud contributes **0** cap triangles. After a load, with Vehicle off, the hidden hardware group contributes **0** hardware cap triangles; turning Vehicle on restores them. No cap is generated for the shroud at any plane.
6. **X-Ray:** `?rf=RF-27` shows the shell/hardware/cover ghosted consistently and **no internals**; toggling X-Ray on **before** the lazy load completes still yields ghosted hardware (load-order check); toggling it off restores opacity/depth-write. RF-27 has Labels on and is the Vehicle + X-Ray label proof.
7. **Labels:** `?rf=RF-23` (opaque shell) and `?rf=RF-27` (X-Ray, Labels on) each show only the three exterior labels; no internal-part or cylinder-number labels; with Vehicle off, the M13 label behavior is unchanged.
8. **Interaction checks:** Vehicle on/off with Exterior/X-Ray combinations behaves per §5.1; checking Vehicle with Exterior/X-Ray off auto-enables Exterior; unchecking Exterior while Vehicle is on returns the engine view; `intercooler_upgraded`/`exhaust_4in` hide their stock part and restore it when deselected; **`intake_highflow` + Vehicle is the explicit unsupported combination — the Vehicle context is suspended (`frontStackConflict:true`, `vehicleContextActive:false`), internals remain visible, all five stock parts are withheld, and no V2/hardware intersection renders; deselecting V2 resumes the Vehicle view**; a **failed variant load does not hide its stock part** (and a failed V2 does not set `frontStackConflict`); a **failed hardware load** keeps the engine view and reports `failed`; **Vehicle + Explode 100** leaves the hardware, shell and cover static while the internals are hidden; `Vehicle` is off on every reload and `?vehicle=1` turns it on.
9. **Visual proof:** RF-23…RF-27 exist at the pinned poses and every checklist item in §8.2 passes on the actual render (G-FRAME-M14); RF-24 is the **side-registration** frame (outboard LH, ~84.5° off axis; the circular opening is not claimed face-on); no frame required a silent camera change; any approved deviation is recorded in `docs/M14-MEASUREMENTS.md`.
10. **Invariance (manual gate):** with Vehicle off, a reviewer compares the 3D viewport region of RF-1…RF-22 against the committed PNGs with the changed control panel/title/subtitle masked and records the result in `docs/M14-MEASUREMENTS.md`; the full-page UI delta from the new control is recorded. This is a manual visual gate (M12 QA-10 precedent); no automated masked pixel-diff is claimed. With Vehicle on, no existing frame is re-baselined.
11. **Docs:** `docs/M14-VEHICLE-HARDWARE.md` and `docs/M14-MEASUREMENTS.md` are complete per §11/§12.7/§12.8; `docs/REFERENCE_FRAMES.md` includes RF-23…RF-27 and the checklist; `docs/ASSET_CONTRACT.md`, `assets-src/PROVENANCE.md`, `docs/PLAN.md`, `docs/DECISIONS.md` and `docs/OPEN_ITEMS.md` match §12 exactly; prior docs are byte-identical.
12. **Outside review (D-021)** recorded for the milestone-exit PR; **Owner Decisions OD-1 and OD-2** recorded in the PR/spec.

---

## 14. Frozen and changed files

**Frozen — no changes:**

- `src/core/**` (including `interfaces.ts`, D-010), `src/perf/**`, `src/config/**`, `src/audio/**`, `src/assets/**`.
- `catalog/stock.json`, `catalog/modified.json`, `catalog/schema.json`, `src/catalog/**` (the 24 entries, 12 slots and all `modelPath`/compatibility values are unchanged).
- `src/renderer/exteriorLoader.ts`, `layout.ts`, `partLoader.ts`, `variantLoader.ts`, `sectionCaps.ts`, `intakeCover.ts`, `partVariants.ts`; `src/renderer/intakeCover.test.ts` (its pinned `syncExteriorShellState` regex must pass unchanged).
- `public/Duramax_LLY_2005_66L_V8.glb`; the ten stock internal part GLBs; the **six** `public/models/variants/*.glb` (five M8 + the M13 forged rod); `public/models/intake_cover_lly.glb`; `public/hdri/**`; `public/legacy/**`.
- `assets-src/blender/build_cylinder1.py`, `build_variants.py`, `build_shell.py`, `build_intake_cover.py`; `assets-src/dimensions.json`, `variant_dimensions.json`, `cover_dimensions.json`, `shell_dimensions.json`; all existing `assets-src` reference files.
- `package.json`, `package-lock.json`, `.github/**`, `vite.config.ts`, `tsconfig.json`.
- `docs/M2-MEASUREMENTS.md` … `docs/M13-MEASUREMENTS.md`, `docs/M5-MODEL.md`, `docs/M6-PARTS.md`, `docs/M7-DATA.md`, `docs/M8-VARIANTS.md`, `docs/M9-SOUND.md`, `docs/M10-EXTERIOR.md`, `docs/M11-CUTAWAYS.md`, `docs/M12-COVER.md`, `docs/M13-INTERNAL-VARIANTS.md`; `docs/specs/M0-*`…`docs/specs/M13-*`, `docs/research/L7-*`, `M8-*`, `M9-*`, `M10-*`, `M11-*`, `M12-*`, `M13-*`, `docs/PLANNING.md`, `docs/ORCHESTRATOR.md`, `docs/THREE_API_NOTES.md`. (`docs/REFERENCE_FRAMES.md` and `docs/ASSET_CONTRACT.md` are changed deliverables.)

**Changed / new (expected):**

- `src/renderer/sceneContext.ts` *(new)* — the pure visibility resolver, `applySceneVisibility()`, effective-explode/label helpers.
- `src/renderer/vehicleHardware.ts` *(new)* — constants, per-part caps, markers, fan/shroud registration values, OD-2 visibility helper, budget-guard constants.
- `src/renderer/vehicleHardwareLoader.ts` *(new)* — the lazy loader wrapper over `loadVariantScene`, per-part groups/triangles, `castShadow = true`, marker validation; adds the group once and keeps it in the scene when hidden.
- `src/renderer/engineScene.ts` — `setVehicleEnabled`/`getVehicleEnabled`, `syncSceneContext`, `applySceneVisibility`, lazy load/failure, part visibility, cap sources, ghost registration, stats (including `sceneGraphVisibility` and `vehicleHardwareLoadState`), label context, effective explode, dispose, skip internal kinematics when hidden.
- `src/renderer/index.ts` — export the new modules' public names.
- `src/renderer/viewLayout.ts` — optional `vehicleContext` label suppression; no other rule change.
- `src/ui/engineControls.ts` — subtitle, `Vehicle` checkbox/note, `onVehicleChange`, `setVehicleChecked`, auto-Exterior, build note.
- `src/ui/referenceFrames.ts` — `vehicle?: boolean` and RF-23…RF-27.
- `src/main.ts` — wire `onVehicleChange`, `setVehicleChecked`, `?vehicle=1`, `applyReferenceFrame`'s `vehicle` field, and the benchmark readiness gate's `vehicleHardwareLoadState`.
- `index.html` — subtitle only.
- `src/renderer/sceneContext.test.ts` *(new)* — tests 1, 1b and 2.
- `src/renderer/vehicleHardware.test.ts` *(new)* — tests 3–8, 12 (and the pure part of 5).
- `src/renderer/viewLayout.test.ts` — test 9.
- `src/ui/referenceFrames.test.ts` — test 10.
- `src/ui/uiText.test.ts` — test 11.
- `assets-src/vehicle_hardware_dimensions.json` *(new)*; `assets-src/blender/build_vehicle_hardware.py` *(new)*.
- `public/models/vehicle/vehicle_hardware_stock.glb` *(new)*.
- `docs/M14-VEHICLE-HARDWARE.md`, `docs/M14-MEASUREMENTS.md` *(new)*; `docs/REFERENCE_FRAMES.md`, `docs/ASSET_CONTRACT.md`, `assets-src/PROVENANCE.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`; `docs/reference-frames/RF-23.png`…`RF-27.png` *(new)*.
- `docs/research/M14-vehicle-hardware-survey.md` and `docs/specs/M14-vehicle-hardware.md` are the planning package already on `plan/m14-vehicle-hardware`; the build branch may carry them from the planning branch, but must not edit them.

**If you believe any other file must change, stop and report it instead of changing it.**

---

## 15. Pre-build self-check (recorded)

Every number below was produced before this spec was finalised, from the committed GLBs, the shipped code, and the named publications. The planning artifacts are not committed by the build. The arithmetic is re-runnable from the values quoted here.

### 15.1 Measurement environment

- Host: Linux x86_64 container, Node `v24.22.3`, Three.js `0.187.0`, Vite `7.3.8`; no Blender, no WebGL/headless browser.
- Existing suite: **114 tests / 23 files passed** with `npx vitest run src`; `npm run typecheck` passed this session. The planning workspace's `.tmp/sandboxforgamedev` clone was excluded from the count (a fresh clone has no `.tmp/`). Runtime draw calls, submitted triangles, VRAM, p95 and reference-frame captures were **not** re-measured; the M11/M12/M13 values are cross-checks only.
- GLB measurement: a Python `struct`/JSON parser applied the D-042 conversion `p_mm = (1000·g_x, −1000·g_z, 1000·g_y)` to world-space vertices after the node transforms, summed indexed triangles per node/part, welded the downpipe's two primitives by position, and extracted the **closed 14-vertex / 14-triangle exit cap** (405 unique vertices, 800 triangles, 0 boundary edges).

### 15.2 Current scene — re-derived

```
internal instanced = 4,832×8 (pistons) + 1,180×8 (conrods) + 1,352×4 (throws)
  + 3,532×8 (heads) + 924×8 (injectors) + 1,040×16 (intake valves)
  + 3,464×16 (intake springs) + 1,040×16 (exhaust valves)
  + 3,464×16 (exhaust springs) + 408×16 (bridges) + 620×4×4 (rockers)
  + 840×16 (pushrods) + 432×16 (lifters)
  = 270,080
+ 1,080 main shaft + 64 ground + 37,100 shell = 308,324
fullest measured = 308,324 + (1,372 − 1,180) × 8 + 1,040 = 310,900
phone headroom   = 320,000 − 310,900 = 9,100 (2.844 %)
desktop headroom = 360,000 − 310,900 = 49,100 (13.64 %)

M13 cap guard = 308,324 − 6,500 + 10,800 + (5,200 − 4,832)×8 + 1,800
                + (1,400 − 1,180)×8
              = 308,324 − 6,500 + 10,800 + 2,944 + 1,800 + 1,760
              = 319,128
phone headroom (guard)   = 320,000 − 319,128 = 872 (0.2725 %)
desktop headroom (guard) = 360,000 − 319,128 = 40,872 (11.35 %)
```

### 15.3 New hardware caps and state arithmetic

```
per-part caps = 5,600 + 6,400 + 4,800 + 6,200 + 8,400 = 31,400
engine measured (unchanged)                         = 310,900
engine cap guard (unchanged)                        = 319,128
vehicle stock cap-based (hardware at cap, cover 1,040)= 37,100 + 31,400 + 1,040 + 64 = 69,604
vehicle stock guard (cover cap 1,800)               = 37,100 + 31,400 + 1,800 + 64 = 70,364
vehicle conservative guard (+ external variant caps)= 70,364 + 10,800 = 81,164
global guard                                        = max(319,128, 81,164) = 319,128
phone headroom (global)                             = 320,000 − 319,128 = 872
desktop headroom (global)                           = 360,000 − 319,128 = 40,872
vehicle phone headroom (conservative)               = 320,000 − 81,164 = 238,836 (74.64 %)
vehicle desktop headroom (conservative)             = 360,000 − 81,164 = 278,836 (77.45 %)

forbidden co-visible cap = 319,128 + 31,400 = 350,528 / 320,000 = 109.54 %
  over by 30,528 triangles (9.54 % of the phone cap)
```

**Option (b) recomputation.** Engine + hardware measured = `310,900 + 31,400 = 342,300`; cap guard = `319,128 + 31,400 = 350,528`. The **minimum phone cap that passes is 350,528** (+30,528; 109.54 %). `360,000` is the desktop cap; using it for phone is a conservative policy choice and gives cap headroom `360,000 − 350,528 = 9,472` and measured headroom `360,000 − 342,300 = 17,700`. An additional row of 30,528 triangles is the minimum, not 40,000.

**Option (d) recomputation.** `32 × 3,464 = 110,848`. `3,464 → 2,483` per spring gives `32 × 2,483 = 79,456`, a saving of **31,392** — **8 short** of the 31,400 cap. `3,464 → 2,482` gives `32 × 2,482 = 79,424`, a saving of **31,424**, which clears the cap by 24. The 28.3 % reduction figure is `(3,464 − 2,483) / 3,464 = 28.32 %`.

The 9,100 measured headroom is **not** spendable on an always-on capped asset: `319,128 + 9,100 = 328,228 > 320,000`. This is why options B, C and E are rejected.

### 15.4 Anchors, fan/clutch and downpipe exit — measured

| Measurement | Value | Method |
| --- | --- | --- |
| Shell total triangles | 37,100 across 22 groups | GLB parse |
| Damper front face / radius | X 492.0 / 99.0 | `ext_damper` bounds |
| Fan centre (Y, Z) | (0.000, 156.000) | `ext_fan` bounds |
| Fan outer radius | 212.000 | `ext_fan` radial max |
| Fan axial span | X 570.000–617.800 | `ext_fan` bounds |
| Fan hub radius | 72.000 | M10 record `fanHubRadiusMm`; `ext_fan` bounds |
| Fan blade count | 9 | M10 record `fanBladeCount`; `ext_fan` geometry |
| Fan-tip max radius at X ≥ 610 | 210.0000077530442 | vertex radial max |
| Clutch X span / radius | 472.000–569.999993 / 72.000004 | `ext_fan_clutch` bounds |
| Airbox mount | (587.4, −510.5, 371.9); normal (0.882820, −0.441410, −0.160513) | `if_airbox_mount`; M10 0.0000 mm contact |
| Airbox collar / body boss | 70 mm collar end (649.197, −541.399, 360.664); boss X 636.4–736.4, Y −560…−535, Z 303.9–403.9 | marker normal + design boss; body face t = 112.141 mm |
| Downpipe exit cap | centre (−222.000, −162.000, −18.000), mean r 44.450, **14 vertices / 14 triangles, 0 boundary edges**, normal (−0.0059, 0.0892, 0.9960) | welded mesh parse (405 vertices, 800 triangles) |
| Shell bounds | X −272.52…617.80, Y −549.86…480.66, Z −223.50…556.00 | all shell groups, **world transforms applied** |

**Shell-bounds axis check (QA-13 rebuttal):** the raw GLB accessor bounds are X [−0.272516, 0.617800], Y [−0.223500, 0.556000], Z [−0.480664, 0.549860]. Applying `p_mm = (1000·g_x, −1000·g_z, 1000·g_y)` gives X −272.516…617.800, Y −549.860…480.664, Z −223.500…556.000 — exactly the spec values. The QA-13 reading swapped the raw Y and Z intervals; no correction is required. `src/renderer/shellAssets.test.ts` test 4 passes on the same conversion.

The fan/measurement arithmetic:
```
shroud radial clearance = 222.0 − 212.0 = 10.0
shroud axial overlap    = 617.8 − 610.0 = 7.8
clutch clearance        = 610.0 − 570.0 = 40.0
```

### 15.5 Placement clearances and interferences — measured

| Pair | Minimum distance (mm) | Method / note |
| --- | ---: | --- |
| Airbox body/lid/snorkel ↔ shell `ext_intake_duct` | **29.180** | 0 shell vertices inside the body envelope; nearest vertex (576.36, −542.89, 400.27); excluding the intended 70 mm collar: **97.115** |
| Airbox collar ↔ radiator RH rear corner | **5.350** | Surface distance after the 8 mm relief; without the relief the collar would graze at (650, −500, 363.6) by 2.65 |
| Airbox collar end ↔ body inlet boss | **intended contact** | End (649.197, −541.399, 360.664) inside boss X 636.4–736.4, Y −560…−535, Z 303.9–403.9; body face at t = 112.141 |
| Radiator ↔ shell `ext_fan` | **32.200** | 650.0 − 617.8 |
| Intercooler ↔ radiator | **6.000** | 712.0 − 706.0 |
| Airbox body ↔ radiator | **60.000** | Y −560 vs −500 (body envelope; collar row above) |
| Airbox body ↔ intercooler | **40.000** | Y −560 vs −520 |
| Shroud inner ↔ fan | **10.000** radial | 222.0 − 212.0; at the lip, 222.0 − 210.0 = 12.0 |
| Shroud rear ↔ fan front | **7.800** axial overlap | intended; no contact |
| Shroud ↔ fan clutch | **40.000** | 610.0 − 570.0 |
| Exhaust ↔ shell (excl. 100 mm exit collar) | **58.051** | pipe r 44.45; nearest shell point (−230.0, −114.9, 72.7) to segment P0→P1, excluding vertices within 100 mm of P0 |
| Exhaust pipe ↔ floor | **40.550** | min centre Z −160.0; surface −204.45; floor −245.0 |
| Muffler ↔ floor | **25.000** | muffler bottom −220.0; above 21.4 minimum |
| Stock intercooler ↔ V4 | **30.000** X | 712.0 − 682.0; envelopes do not intersect |
| V2 ↔ stock radiator / intercooler | **14 / 6 vertices inside** | frozen V2 parse; the OD-2 unsupported-combination reason |

**Exhaust route used for the bounds and clearances (mm):**
```
P0 (−222, −162, −18) → P1 (−300, −180, −80) → P2 (−480, −235, −160)
→ P3 (−750, −235, −160) [muffler inlet]
muffler X −750…−1,090 at (Y −235, Z −110)
→ P4 (−1,090, −235, −110) → P5 (−1,180, −235, −40)
→ P6 (−1,250, −235, +40) → P7 (−1,320, −235, 0)
```
The pipe is r 44.45 on every segment. Segment P0→P1 is 101.25 mm long; excluding shell vertices within 100 mm of P0 leaves the nearest point (−230.0, −114.9, 72.7), whose distance to the segment minus 44.45 is **58.051 mm**. The AABB union is X **−1,364.45…−161.97**, Y **−345.0…−101.79**, Z **−220.0…+84.45** (flange plate + segments + muffler). The muffler bottom is −220, so the floor row and the Z-min bound now agree.

**Interference result:** zero shell vertices inside the airbox body/radiator/intercooler envelopes; the exhaust's minimum surface distance is 58.051 mm, so no shell vertex lies inside it; intended contacts only at the airbox collar/boss, the exhaust flange, and the shroud/radiator flange (X = 650). The 25.0 mm muffler-to-floor clearance is the smallest vertical number and passes the M10 21.4 mm minimum; it is flagged as the tightest placement number, not designed around silently. The V2 14/6 overlap is not a pass: the `intake_highflow` + Vehicle combination is withheld (OD-2).

### 15.6 Frame visibility arithmetic

Projection at 42° vertical FOV, 1024×640, look-at; screen boxes are AABB extents, not pixel renders:

| Frame | Parts in frame and approximate screen box (px) | Note |
| --- | --- | --- |
| RF-23 | airbox ≈201×215; radiator ≈182×338; intercooler ≈180×333; engine ≈488×440; cover ≈94×59 | Airbox/intercooler foreground; radiator top tank above intercooler; shroud behind (not claimed) |
| RF-24 | shroud ≈73×406; airbox ≈129×135; engine ≈569×491 | Fan/clutch and shroud ring in profile; camera outboard LH, ~84.5° off the +X fan axis; **opening not claimed face-on** |
| RF-25 | exhaust ≈438×297; engine ≈411×542 | Exhaust foreground, looking rearward; flange/pipe/muffler/tip in frustum |
| RF-26 | radiator ≈582×470; airbox ≈230×195; shroud ≈283×356; engine ≈713×508 | Camera on +X side of X=690; intercooler clipped away; shroud behind the plane and **not cut** |
| RF-27 | same as RF-23 | X-Ray on, **Labels on**; hardware/shell/cover ghosted; internals hidden; only exterior labels |

The camera positions are outside the shell AABBs: RF-23/27 X 1.4 > 0.618; RF-24 Y 1.25 > 0.481; RF-25 Y −1.35 < −0.550; RF-26 X 1.6 > 0.618. The near plane is 0.02 m; no part centre is behind the camera. The build's G-FRAME-M14 is the actual render check.

### 15.7 Conflicts found while drafting (all resolved in the spec, none silently)

1. **Full-page RF byte-identity vs a new Views control.** A `Vehicle` checkbox necessarily changes the full-page PNGs. M14 records the full-page UI delta and a reviewer compares the **3D viewport region** manually with the changed control panel/title/subtitle masked (M12 QA-10 precedent). The stock assets/catalog/interfaces are byte-identical, and the rendered 3D is unchanged (the loaded hardware group is hidden when Vehicle is off). This is the honest reading of the brief's "byte-identical" requirement; no automated masked pixel-diff is claimed.
2. **Dorman 620-992 fitment/dimension conflict.** One catalog lists it for a 2015 3500HD with a 560.1 mm max blade diameter; another for 2001–2005. Neither dimension is adopted; the shroud is designed to the shipped 424 mm fan, with OER A56217 cited for 2001–2005 fitment only.
3. **Radiator overall width vs airbox.** The published 1,158.2 mm overall width would intersect the stock airbox location; the 865.1 mm core is adopted and the overall width is recorded-not-adopted.
4. **Stock intercooler vs V4.** Different installations; OD-2 makes the stock core yield to `intercooler_upgraded`; V4 is not moved. The charge-pipe route to the front stack is not fabricated.
5. **Airbox GM part identity vs LLY-specific dimensions.** 25873812 is listed for a 2004 3500 6.6L Duramax diesel, but no dimensioned drawing exists; the airbox is a labeled placeholder from the measured mount and photos.
6. **Dual-generator idler.** No stock fitment/geometry; the aftermarket kits are not stock; OUT.
7. **Medium-duty oil filler/filter.** Different chassis; OUT.
8. **Exhaust floor clearance.** The muffler bottom is 25.0 mm above the floor, above the M10 21.4 mm minimum but the tightest number; flagged.
9. **Downpipe exit normal.** The measured loop normal is 5.1° off +Z; the flange is authored to the measured normal, not an idealized +Z.
10. **Fan shroud diameter.** The shipped fan is 424 mm; the aftermarket 560.1 mm listing is not adopted, per the brief's "design to the shipped fan".
11. **M10 document vs the committed fan GLB.** `docs/M10-EXTERIOR.md` §5.1 says the fan `r_tip = 245 mm`, fan hub axis `(Y, Z) = (0, +178.0) mm` and clutch X 530.0–570.0; `assets-src/shell_dimensions.json` repeats `fanClutchXMinMm = 530.0` (while publishing `fanOuterRadiusMm = 212.0` and the `(0, 156)` fan pulley). The committed GLB measures fan centre **(0, 156)**, outer radius **212.0**, blades X **570.0–617.8** and clutch X **472.0–570.0**. The measured GLB/JSON values win; the M10 doc's 245/178/530 are stale illustrative values and are recorded here rather than silently resolved.
12. **V2 high-flow tract vs the stock front stack.** The frozen V2 tract has 14 vertices inside the stock radiator envelope and 6 inside the stock intercooler envelope. No stock part can yield because radiator/shroud have no variant; OD-2 therefore makes the `intake_highflow` + Vehicle combination explicitly unsupported (Vehicle suspended, all hardware withheld) rather than rendering an intersection.
13. **Airbox collar vs radiator RH rear corner.** Including the collar in the airbox bounds exposes a 2.65 mm graze at the radiator RH rear corner. The radiator carries an 8 mm × 50 mm × 15 mm relief, giving a 5.35 mm surface clearance; the radiator AABB and closed cap source are unchanged.

### 15.8 Frozen audit hashes (cross-check)

| File | SHA-256 |
| --- | --- |
| `public/Duramax_LLY_2005_66L_V8.glb` | `d51f88a0073fde617d1c6492618fcfabc672154288ac546e52fe2ed40b718554` |
| `public/models/intake_cover_lly.glb` | `a66a7a82ecbd19061d33058facf01f5ce75af88b25a253cfb8ec85384d64b7f0` |
| `public/models/variants/rot_conrod_c1_forged.glb` | `816e24357b1d191ed7dd3d4bbe327d5e8179cc6178ab701371c7a0b953c1053d` |
| `catalog/stock.json` | `5ee91f4b0c667c3d3c70c2a39eb9e8afebd614875a4809ea42a29bd75fe2a66d` |
| `catalog/modified.json` | `509c90c7c02af0081e1b3fe1737c47991bd03f9b6195e6118df594663059d802` |
| `catalog/schema.json` | `5682938d8302197167e086c80e156a0117911c89fe38991455db18ffd03d91e5` |
| `src/core/interfaces.ts` | `c896f0b4068a17f16f6b9ca95544d7536cd4db16c91ef489f570355af6533be4` |

The frozen audit is `git diff --exit-code main --` over the §13.1 path list; these hashes are a cross-check, not a replacement.

### 15.9 Number provenance

| Number | Value | Kind | Source |
| --- | ---: | --- | --- |
| Current stock scene | 308,324 | measured | GLB parse + code instance counts |
| Fullest current state | 310,900 | measured | 308,324 + rod delta + cover |
| M13 cap guard | 319,128 | capped | `partVariants.test.ts` formula |
| Hardware cap | 31,400 | capped | §4.2 per-part design caps |
| Vehicle stock guard | 70,364 | capped | shell + hardware cap + cover cap + ground |
| Vehicle conservative guard | 81,164 | capped | + external variant caps |
| Global guard | 319,128 | capped | max of states |
| Option (b) minimum phone cap | 350,528 | capped | `319,128 + 31,400`; +30,528 over 320,000 (9.54 %); 360,000 is the desktop cap/policy choice |
| Option (d) spring saving | 31,392 / 31,424 | measured/capped | 2,483/spring saves 31,392 (8 short); 2,482/spring saves 31,424 |
| Hardware file cap | 1,228,800 B | capped | design cap; build records actual |
| Airbox group AABB | X 566.52–860, Y −820…−470.61, Z 240–520 | design | body + snorkel + 70 mm collar + body boss |
| Exhaust group AABB | X −1,364.45…−161.97, Y −345.0…−101.79, Z −220.0…+84.45 | design | §7.4 centreline + 44.45 mm radius + flange + muffler |
| Radiator core | 865.1 × 498.1 × 55.9 | published | Mishimoto MMRAD-DMAX-01, grade C |
| Intercooler core | 952.5 × 466.7 × 47.6 | published | CSF 6007, grade C |
| Exhaust diameter | 88.9 | published | stock 3.5 in, grade B/C |
| Fan centre/radius | (0,156) / 212.0 | measured | `ext_fan` |
| Airbox body / shroud / muffler | §7.3 | placeholder | labeled, not measured |

---

## 16. Handoff

Work on branch `m14-vehicle-hardware` in the local clone, created from `main` at `002b2c2`. Implement in this order:

1. **`src/renderer/sceneContext.ts`** — the pure resolver, `applySceneVisibility()`, effective-explode helper and label context. Run the truth table (test 1) and the fake-scene-graph application (test 1b) before touching the renderer.
2. **`src/renderer/vehicleHardware.ts`** — constants, per-part caps, markers, fan/shroud values, OD-2 visibility helper, budget-guard constants. Keep the caps in one module so the asset test and the budget test cannot drift.
3. **`assets-src/vehicle_hardware_dimensions.json` + `assets-src/blender/build_vehicle_hardware.py`** — build the five groups, export Y-up, assert per-part caps/total/markers/bounds/materials/no textures, the collar/boss contact, the radiator relief and the exhaust route/AABB, record boundary edges; produce `public/models/vehicle/vehicle_hardware_stock.glb`.
4. **`src/renderer/vehicleHardwareLoader.ts`** — lazy loader over `loadVariantScene`, per-part groups/triangles, `castShadow = true`, marker validation; add the group once and keep it in the scene when hidden.
5. **`engineScene.ts` seams** — `setVehicleEnabled`, `syncSceneContext`, `applySceneVisibility`, lazy load/failure, part visibility (OD-2), cap sources (no shroud), ghost registration, stats (including `sceneGraphVisibility` and `vehicleHardwareLoadState`), label context, effective explode, skip internal kinematics when hidden, dispose. Preserve the M12 `syncExteriorShellState` body verbatim.
6. **UI and frames** — subtitle, `Vehicle` checkbox/note, `onVehicleChange`, `setVehicleChecked`, auto-Exterior, `?vehicle=1`, build note, RF-23…RF-27, `applyReferenceFrame`'s `vehicle` field, benchmark readiness.
7. **Tests** — `sceneContext.test.ts` (1, 1b, 2), `vehicleHardware.test.ts` (3–8, 12 and the pure part of 5), `viewLayout.test.ts` (9), `referenceFrames.test.ts` (10), `uiText.test.ts` (11). Run `npm run typecheck && npm test && npm run build`.
8. **Measure and optimise** — build the asset; record per-part triangles, total, bytes, markers, boundary edges; run the `?benchmark=1` matrix (engine/vehicle × desktop/phone × hardware off/on) with the acceptance-4 URLs; record p95, submitted/calls/VRAM, the actual `sceneGraphVisibility` flags, the engine **310,900 / 319,128 / 872** and vehicle **70,364 / 81,164** guards; the section X = 690 cap total (radiator + airbox; ≤ 16,000) and the separate exhaust-plane cap; the page-weight delta. Hit the §5.4 targets or stop and report.
9. **Frames** — add RF-23…RF-27; capture at 1440×900 → 1024×640; verify the §8.2 checklist, including the RF-24 side-registration scope, the section caps, the Vehicle + X-Ray labels and the X-Ray load-order case. If a frame fails, stop and report a proposed pose (G-FRAME-M14).
10. **Docs** — `docs/M14-VEHICLE-HARDWARE.md`, `docs/M14-MEASUREMENTS.md`, then the §11/§12 paperwork, `docs/REFERENCE_FRAMES.md`, `docs/ASSET_CONTRACT.md`, `assets-src/PROVENANCE.md`, and the five images.

No new npm dependencies; no catalog slot/interface/perf/core/shell/cover/existing-asset changes. When done, push the branch and send a closing summary covering: files changed; test/typecheck/build results; the hardware asset audit (per-part triangles, total, bytes, materials, markers, boundary edges, collar/boss contact, radiator relief, exhaust route/AABB); the `?benchmark=1` engine/vehicle × desktop/phone × hardware-off/on rows with headroom, the actual `sceneGraphVisibility` flags and the **319,128 / 872** engine guard and **70,364 / 81,164** vehicle guards; the section X = 690 cap count (radiator + airbox) and the separate exhaust-plane cap; the RF-23…RF-27 captures with SHA-256 and checklist results; the RF-1…RF-22 manual 3D-region comparison notes and full-page UI delta; the OD-1/OD-2 decisions as recorded, including the unsupported high-flow combination; the OUT items; and anything that deviated from this spec. Buckley verifies from a fresh clone, opens the PR, and merges.
