# Milestone 10 Spec — Exterior Accuracy

Repo: `colinstephens93/CarbonDuramax` · Build branch: `m10-exterior-accuracy` (create from `main` at `b58cf9c`) · Planning branch: `plan/m10-exterior-accuracy` · Planning package: this spec + [`docs/specs/M10-exterior-accuracy-QA.md`](./M10-exterior-accuracy-QA.md) (independent QA record) + [`docs/research/M10-exterior-accuracy-survey.md`](../research/M10-exterior-accuracy-survey.md) (graded source survey, with measured figures in [`docs/research/M10-exterior-accuracy-figures/`](../research/M10-exterior-accuracy-figures/)) · Plan reference: **new milestone, not in PLAN.md v2.2** — Milestone 10 is added by this spec's paperwork deliverables (§12), per the anti-drift rule.

**What changes in one sentence:** the frozen exterior shell `public/Duramax_LLY_2005_66L_V8.glb` is **rebuilt** as a project-frame-authored, untextured, budget-capped model of the real 2005 LLY's external hardware — keeping every Milestone 8 variant interface datum and the shell's group/split structure — so that with the Exterior toggle on, the engine reads as a Duramax LLY instead of a schematic.

**Coding is done by the user in Antigravity on branch `m10-exterior-accuracy`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

---

## 1. What Milestone 10 is

Milestones 0–9 built a running, viewable, buildable, audible engine. Its **exterior** has never been more than a placeholder: the GLB registered at Milestone 3 is the owner's concept-set shell, and the Milestone 6/8 review of it was "correct gross arrangement, no part fidelity". This milestone rebuilds that shell against the published record of what a 2005 LLY actually looks like with the hood up.

1. **A graded research record (§ survey):** thirteen external systems surveyed against GM parts catalogs, GM service literature, OE-maker documentation, publications and vendor fitment pages, with a grade and an honest verdict per item — including sixteen "not published" verdicts and a twelve-entry conflict register. **No image was pixel-verified**; every claim about *form* is description-based and labelled.
2. **A part-by-part gap analysis (§4):** the 22 external part families (plus the harness residual) classified **present / missing / wrong shape / wrong position** against the measured current shell, each with a remodel recommendation and a triangle budget.
3. **A rebuilt shell (§5):** authored directly in the project frame (scale-1/Y-up-basis registration), joined to the frozen internal engine at pinned datums, untextured, 37,100 triangles, ≤ 24 merged material buckets, with a named node-group and `extras.partId` vocabulary so presence, placement and budget are machine-checkable.
4. **Interface preservation, proved (§6):** all seven Milestone 8 `if_*` marker coordinates, their mating normals and the four mating radii are **preserved**, the `turbo` child-order split and whole-`intake`-group split are **preserved**, and every consequence of the two things that *must* change (identity registration, the harmonic-balancer label anchor) is traced to the file and the frame that has to be re-baselined.
5. **Budget compliance with measured margins (§7):** the shell grows 21% in triangles while the phone scene metric keeps 3.4% headroom and both tiers keep double-digit headroom on submitted triangles, draw calls and VRAM; swapping four textures for none **frees 6.50 MiB** of VRAM on both tiers.
6. **Visual proof defined (§8):** three new reference frames (`RF-11`…`RF-13`) plus four re-baselined exterior-on frames (`RF-3`, `RF-7`, `RF-8`, `RF-9`), each with a numbered feature checklist and an eight-item LLY discriminator list, so "looks like a real LLY" is a reviewable claim rather than an adjective.
7. **Explicit positions (§2):** depth of detail, EGR cooler, badging/lettering, reference frames, and the disclaimer banner are all decided in writing, with the reasons and what would change each decision.

**Non-goals for M10:**

- **No rescale to published external dimensions.** Neither published envelope (§ survey §16: 34×33×37 in from one forum, 30×30×32 in from one vendor) is adopted; the shell keeps its Milestone 3 containment anchor and the published-envelope mismatch stays an open item.
- **No change to the internal engine, its config, or its 10 GLBs.** No change to `src/core/**`, `src/perf/**`, `src/config/**`, `catalog/**`, `src/audio/**`.
- **No new visual part variants, no catalog changes, no schema changes.** The catalog stays 24 entries; the five M8 variant GLBs stay byte-identical.
- **No textures, no images, no new dependencies, no compression pipeline** (meshopt/Draco/KTX2 stay deferred as at M2–M9).
- **No plastic cosmetic covers.** The upper intake manifold cover (GM `21994000`) — the only lettered surface on the engine — is **excluded**, because it hides the Y-bridge this milestone is required to show. Consequence: no lettering is modelled (§2.3).
- **No new labels, no label-count change** (23 stay 23); no views/cutaway/explode behaviour change; no dyno, audio or catalog-UI change beyond the subtitle and the illustrative caption.
- **No vehicle-side hardware:** airbox, intercooler core, radiator/fan shroud, exhaust beyond the downpipe, transmission, underhood structure all stay unmodelled (existing OPEN_ITEMS watch item).

---

## 2. The four explicit positions (and the fifth the brief implied)

### 2.1 Depth of detail — two tiers, plus a named exclusion list

The shell is an *engine*, viewed in a studio at 1.0–2.0 m in the reference frames. Detail is allocated by **what changes the silhouette or the read at that distance**, not by what a service manual shows.

**Tier 1 — modelled in full form (silhouette-defining):** block skirt with pan rails and bellhousing flange; front cover; external head faces and exhaust-port stubs; upper + lower valve covers per bank with injector reliefs, PCV boss cluster and grommeted fasteners; eight injector bodies + connectors + return line + rear-left main-harness break; outboard exhaust manifolds with heat shields; two up-pipes; the GT3788VA turbo (two-flange turbine inlet, V-band outlet neck, compressor cover/bell/outlet spigot, VGT solenoid on the passenger side, vane-position sensor, oil feed/drain, two-piece heat shield); downpipe; hot-side charge pipe and cold-side charge pipe with bead rolls, boots and clamps; intake mouthpiece, soft duct and resonator; the two-piece Y-bridge with its seals, MAP sensor and cover clamp; EGR valve above EGR cooler with its pipes, hoses and adapter bracket; the front drive (damper, fan + clutch, alternator, vacuum pump, A/C + P/S bracket with both units, tensioner, idlers, one belt path); CP3 with FCA and lines; fuel filter head with vertical canister, WIF sensor, drain and primer; oil fill neck + cap; dipstick tube + yellow loop handle; one rear lifting bracket.

**Tier 2 — modelled as grouped simplifications (present, not individually faithful):** fastener heads (shared instanced primitives, correct *counts by family* and placement rows, not per-bolt fidelity); hose clamps (bands); the engine harness (one swept loom plus the main break, no individual branch runs); heat-shield embossing and casting ribs (implied by geometry breaks, not surface detail); the EGR module's internal passaging (not visible).

**Explicitly excluded** (named so nobody "adds them later" without a decision): the plastic upper intake manifold cover and all lettering; the glow-plug controller and its shield; PCV/EGR internal parts; dual-generator idler; medium-duty oil fill/filter arrangement; every vehicle-side part in the non-goals list; any wiring beyond the main loom.

**Measured consequence:** 22 part families, 37,100 budgeted triangles, capped by the phone tier (§5.2, §15.2). For scale: the current shell spends 31,396 triangles on 234 primitives of which two are 12-triangle boxes representing entire banks, five are identical 504-triangle pulleys and six are identical 624-triangle rib rings (§ survey §17.2).

### 2.2 EGR cooler — **model it**

**Decision: the EGR cooler is modelled**, as part of an `egrSystem` module: valve **above** cooler (GM's own gasket description, "BOTTOM EGR VALVE TO TOP EGR COOLER"), a long tube-shaped cooler, coolant hose/formed pipe to the front crossover, EGR pipe to the intake manifold's passenger side, adapter bracket.

Reasons: (a) the cooler is a **distinct external part** with its own GM part number and gasket set (`97303654 COOLER, EGR VLV`; grade A), not an internal passage; (b) EGR is the **defining LLY-versus-LB7 delta** — without it the model reads as a generic Duramax; (c) it is visible in the rear-left reference frame.

**Risk carried openly:** the cooler's *position* is the weakest load-bearing fact in the package. Three sources disagree (valley / lengthwise along the passenger valve cover / rear-of-engine passenger side under the turbo inlet ducting); the spec pins **rear valley, passenger side, valve above cooler, beneath the turbo inlet ducting**. Mitigation: the whole module is one named node group (`egrSystem`), so a later correction is a local re-position, not a rebuild. Recorded as an open item (§12.3).

### 2.3 Badging and lettering — **none**

**Decision: the shell ships with zero text geometry.** No extruded letters, no decals, no badge pad.

Reasons: (a) **no GM source shows lettering on any LLY casting** — the valve covers are documented as "plain" (grade C, negative finding); (b) the only lettered surface on the engine is the **plastic upper intake manifold cover** (`21994000`), and that cover is excluded because it hides the Y-bridge (§2.1); (c) a wordmark would have to be set in a fabricated font at a fabricated size — a made-up detail with no provenance, which is exactly what D-012 forbids; (d) the model is *untextured* (§5.5), so a decal is not available as a cheaper alternative.

Consequence for the app: the disclaimer caption may not claim badging is modelled, and it says so (§10). If a later milestone wants the closed-up engine-bay look, the cover + lettering is a deferred candidate with its part number already recorded (§12.3).

### 2.4 What visual reference frames will prove "looks like a real LLY"

Four mechanisms, in increasing strictness:

1. **Three new reference frames** (§8.1): `RF-11` front three-quarter stock exterior-on at the `RF-3` camera pose (valve covers, injector rows, front drive stack, oil fill, Y-bridge, both charge pipes, fan); `RF-12` rear-left elevated stock exterior-on at the `RF-9` pose (turbo, up-pipes, downpipe, EGR module, exhaust manifolds, lifting bracket, dipstick); `RF-13` top-down valley stock exterior-on at the `RF-4` pose (Y-bridge, resonator, mouthpiece, injector rows, fuel filter head on the RH cover, boosting-pipe drops). Each carries a **numbered feature checklist** ("what to look for") so a reviewer ticks features rather than judging a vibe.
2. **Four re-baselined frames** (`RF-3`, `RF-7`, `RF-8`, `RF-9`) re-captured and re-described against the new shell, so stock-vs-variant comparison stays honest.
3. **An eight-item LLY discriminator list** (§8.3) — injectors outside covers, EGR module present, GT3788VA in the rear valley with a two-flange inlet and a small passenger-side solenoid, outboard manifolds, two-piece Y-bridge, front oil filler, fuel filter on the RH cover, gear-driven water pump / belt-driven vacuum pump. Each item is *visible in a named frame*, so a reviewer can fail the milestone on a specific missing item.
4. **A machine-checkable structural audit** (§5.3, §9 test 1): every Tier-1 feature exists as a named node group and as a `extras.partId` on at least one mesh, within its triangle budget and inside its pinned bounding box; the seven M8 datums are within 1.0 mm of shell geometry. The *look* is judged by a human on the frames; the *presence and placement* are judged by the test.

### 2.5 What happens to the exterior disclaimer banner when the work lands

Today (`src/ui/engineControls.ts`, `#m1-illustrative-caption`) the caption ends:

> `… and the registered exterior shell remain illustrative placeholders, not verified LLY measurements.`

That clause becomes **wrong** in two ways once the shell is rebuilt: the shell is no longer "registered" (it is authored in the project frame), and calling the whole exterior "illustrative placeholders" understates a feature set that is now sourced to grade-A/B literature.

**Decision:** the caption keeps an honest "illustrative" claim but **narrows and re-scopes it**, and the new text is pinned by a test so it cannot drift:

- Old ending → `… and the exterior shell's individual casting proportions, fitting positions and surface detail remain illustrative, not verified LLY measurements.`
- The words "verified LLY measurements" stay (the app still promises no verified *measurements*, and M10 changes no internal dimension).
- The banner does **not** claim the exterior is "verified", and it does not drop the "illustrative" framing for the exterior: existence/position/architecture are sourced, **shape and size are not**.

The full new caption string, verbatim, is in §10.1. The change lands with the same PR as the rebuilt shell (the caption and the asset must never disagree), and `index.html`'s subtitle becomes `Milestone 10 — Exterior Accuracy`.

---

## 3. What the shipped app does today (measured, not assumed)

| Fact | Value | Where it comes from |
| --- | --- | --- |
| Shell asset | `public/Duramax_LLY_2005_66L_V8.glb`, 1,973,652 B, SHA-256 `42993c99…0896` | `docs/M8-MEASUREMENTS.md` §1 |
| Shell triangles | **31,396** across 283 mesh nodes over 234 unique meshes (one primitive each) | GLB parse (§ survey §17.1); pinned by `partVariants.test.ts` test 7 |
| Shell material slots → signatures | 99 → **22**; **4 textures** (1024², 512×256, 256², 256×128) = **6.500 MiB** GPU | GLB parse; `exteriorLoader.computeMaterialSignature` |
| Exterior draw calls | **33** merged meshes = 21 global material buckets + 12 preserved-subtree meshes | `docs/M8-MEASUREMENTS.md` §3; `106 − 73` |
| Registration | `p_proj = (0.2042, 0, 0.1118) m + 0.430·(z_f, x_f, y_f)`, `det = +1` | `src/renderer/layout.ts` §"Exterior GLB registration" |
| Registered bounds | X[−282.14, +892.75], Y[−573.40, +521.82], Z[−223.60, +583.88] mm | derived from the same constants; matches `docs/M3-MEASUREMENTS.md` §2.4 |
| Scene triangles (stock, exterior on) | **302,620** ( = 271,224 non-shell + 31,396 ) | `docs/M8-MEASUREMENTS.md` §4.2/§4.3 |
| Preserved split | `turbo` child **2** = downpipe (560), `turbo` child **3** = turbo unit (2,056), whole `intake` group = tract (5,740) | `src/renderer/partVariants.ts`; `partVariants.test.ts` test 7 |
| Top-level groups (12) | `acComp, alternator, beltDrive, blockPan, boostPipe, cp3Fuel, egrSystem, electronics, injectors, intake, resonator, turbo` | GLB parse |
| Exterior label anchors | turbocharger `[−60, 0, 435]`; harmonic-balancer `[760.6, 0, −43]`; oil-pan `[135.4, 0, −172]` | `src/renderer/viewLayout.ts` `EXTERIOR_SHELL_LABEL_ANCHORS_MM` |
| Global-merge bucket ceiling | **24** — `exteriorLoader.ts` throws above 24 | `src/renderer/exteriorLoader.ts` |
| Internal crank front geometry | `blockLengthMm = 4 × 115 = 460`; main shaft −18 … **+478**; **front pulley/damper disc X 466…476, outer r 57 mm**; snout end 478 | `src/renderer/layout.ts:206`; `src/renderer/viewLayout.ts:98–99,559`; `src/renderer/engineScene.ts:298–323` |

Two consequences follow immediately and are the reason the milestone is structured the way it is:

- **The shell is 21/33 of its own draw calls and 4 textures of the app's 8** — rebuilding it is also the cheapest way to improve the draw-call and VRAM budgets.
- **The front drive floats ~283 mm forward of the internal damper disc** (§4 part 15), which is why every exterior frame reads "too long" even though the internal model is right.

---

## 4. Part-by-part gap analysis (the core deliverable)

Every part family the brief names, plus the four the survey found were missing, classified against the measured current shell. **P** = present and roughly right; **M** = missing; **S** = wrong shape; **X** = wrong position. Budgets are the §5.2 allocations.

| # | Part family | Current shell (measured) | Status | Remodel recommendation |
| ---: | --- | --- | :---: | --- |
| 1 | **Block skirt, pan, mounts, bellhousing flange** (`blockPan`) | One 12-tri box per bank + a block box + a box pan; 2,744 tris total for the whole block/bank/pan mass | **S** | Author the block as a **cast V-block**: 45° bank faces with a deck land, a skirt with pan rails, a front face for the cover, a rear bellhousing flange, and an oil pan with a deep front sump and a drain boss. Sump bottom pinned at Z = −223.6 mm (floor clearance unchanged). **3,500** |
| 2 | **Front cover / timing cover** (new `frontCover`) | A single **12-triangle box at X 518.1…578.3, Y ±154.8, Z −64.5…219.3** sits where a cover would be — but at the old, ~283 mm-forward front-drive plane | **X + S** | A shallow cover plate on the block front face (X 460…472, annulus around the crank) with a water-pump boss (gear-driven — **no pulley**), a CP3 pad, a crank seal boss and a bolt ring. **1,100** |
| 3 | **External heads and exhaust port stubs** (new `heads`) | Absent (the bank box hides everything) | **M** | Head side walls below the covers with four exhaust-port stubs per bank, glow-plug bosses, and the deck land the manifolds bolt to. **1,600** |
| 4 | **Valve covers, upper + lower, per bank** (new `valveCovers`) | Two **12-triangle boxes**, one per bank (inside `blockPan`) | **S** | Four shells (upper + lower per bank): cambered top with two longitudinal ribs, **four injector reliefs per upper cover**, the full fastener set the survey counted (**24 + 8 + 24 = 56 bolt heads and 28 insulators**, in three lengths across the four covers), and a PCV/breather boss cluster on one cover. Top surface at `deck + rockerShaftHeight + springClearance` from config, not a literal. **3,400** |
| 5 | **Injector bodies, connectors, return line** (`injectors`) | 2,856 tris: two rails + 8 curved "lines" that swing **outboard of the banks** to Y ±349 (the block is ±281) | **X + S** | Eight **injector bodies standing proud** in the valley-side trough of each bank, aligned to the internal injector axis (X station, valley offset from `detailConfig`), each with a connector socket and a boot, plus the rubber return line clipped along the row and the **rear-left main-harness break**. No outboard rails. **2,000** |
| 6 | **Exhaust manifolds + heat shields** (new `exhaustManifolds`) | **Absent** — the current up-pipes start in mid-air at Y ±281 | **M** | One cast manifold per bank on the **outboard** face of the head, four runners, with a full-length shield and the up-pipe flange low on the block. **2,200** |
| 7 | **Up-pipes ×2** (`turbo` children 0, 1) | 2 × 384 tris, rising from Y ±281 to the turbo inlets | **P position / S shape** | Short **two-flange** pipes from the manifold flange up the back of the engine to the turbine inlets, three bolt ears per flange, driver-side heat shield, passenger-side firewall clearance flat. Keep the M8 inlet datums exactly. **1,100** |
| 8 | **Turbo unit** (`turbo` child 3 — preserved subtree) | 2,056 tris: two plain cylinders (784 + 896) + a Ø60×80 canister | **P position / S shape** | GT3788VA form: cast-iron turbine scroll with **two separate inlet flanges** and a V-band outlet neck; aluminium compressor cover with inlet bell and outlet spigot; centre housing with **oil feed banjo at top**, oil drain to the flywheel housing, coolant banjos; **small VGT solenoid inserted in the passenger side** of the bearing housing (not a canister), vane-position sensor; two-piece heat shield. **3,400** |
| 9 | **Downpipe** (`turbo` child 2 — preserved subtree) | 560 tris, a bent box behind the block | **S** | **Illustrative 88.9 mm** round stub at the V-band (the published diameter is a 3 in vs 3.5 in conflict — § survey §8), crushed to a flat oval through the mid-run, dropping behind the bellhousing with a support bracket to the RH manifold and its own shield. Keep `if_turbine_outlet`. **800** |
| 10 | **Charge pipes — hot (LH) + cold (RH)** (`boostPipe` + new `chargePipeCold`) | **One** pipe (1,400 tris) rendered as a flat blue ribbon on the LH side; **cold side absent** | **M + S + X** | Hot: **63.5 mm** bent tube from the compressor outlet, bead-rolled ends, silicone boot at each end, forward along the LH flank, ending at the M8 `if_hot_side_inlet` datum. Cold: the missing **63.5 mm passenger-side pipe** from a documented front service-point coupler up to the Y-bridge front, with a hose clamp (not a clip ring — 2005s have no clip). **2,200** |
| 11 | **Intake mouthpiece, duct, resonator** (`intake`) | 5,740 tris: 1,760-tri duct + **six identical 624-tri rib bands** + clamps; no mouthpiece; ends in mid-air at the RH airbox point | **P position / S shape** | Plastic **air horn** at the compressor inlet (bell + Marman clamp), soft **corrugated duct** with 3–4 corrugation groups (not six identical rings), the **resonator box above the inlet**, clamp bands; airbox end exactly at `if_airbox_mount`. Mouthpiece airbox-end diameter **88.9 mm** (single grade-D source → illustrative). **2,300** |
| 12 | **Resonator + intake-cover clamp** (`resonator`) | 3,500 tris: a 1,556-tri slab 400×370×130 mm floating above the valley with a side box | **S** | A smaller resonator body **over the turbo inlet**, its clamp to the intake bridge at the front, and a moulded texture break — not a slab covering the valley. **600** |
| 13 | **Y-bridge / intake manifold** (new `intakeBridge`) | **Absent** (nothing spans the valley) | **M** | Two-piece bridge: **centre duct plus crossover tube** over the valley, two **rectangular rubber seals** at the head joints, **MAP sensor + bracket** on top, 18 M8 bolt heads and 8 studs, the front clamp lug that ties to the resonator. **2,200** |
| 14 | **EGR system** (`egrSystem`) | 272 tris: two unrelated small box clusters | **M** | A module at the **rear of the valley, passenger side**: EGR **valve above cooler**, long tube-shaped cooler, coolant formed pipe + short hose to the front crossover, EGR pipe into the passenger-side intake port, adapter bracket, two pipe-gasket flanges. Largest single-source geometric risk. **1,800** |
| 15 | **Front accessory drive** (`beltDrive`, `alternator`, `acComp`) | 8,852 tris but: **five identical 504-tri pulleys**, a flat 368-tri belt ribbon, a flat 720-tri fan disc, a shroud plate; damper at X 722…765 and Z −43 (**~283 mm forward** of the internal damper disc at X 466…476, and 43 mm below the crank axis) | **S + X** | One belt path around **9 pulleys** (damper, fan, alternator, vacuum pump, A/C, P/S, tensioner, 2 idlers), a **fan + clutch** (blades, not a disc), alternator RH upper with the **vacuum pump below it**, A/C + P/S on the shared LH bracket, tensioner with a square drive. **No water-pump pulley.** Belt modelled as a 6-rib, 20 mm band that follows the real path. Pulley diameters are illustrative, anchored to the 198 mm damper OD and 76.3 mm idler; the damper sits on the crank axis at X 464…492. **3,300 + 1,400 + 600** |
| 16 | **CP3 pump, FCA, high-pressure lines** (`cp3Fuel`) | 944 tris: a canister far out at Y −425 (no defensible identity), a diagonal line, a small body | **X + S** | Bosch CP3 body **in the front valley**, bolted to front-cover studs (2 shared), **FCA** on the body with its connector, feed/return at the rear, two rails + cross-feed pipe. **1,400** |
| 17 | **Fuel filter head + canister** (new `fuelFilter`) | **Absent** | **M** | Head **on top of the right-hand valve cover** with hand primer, vent valve and two clamp-hose stubs; **vertical spin-on canister** below with WIF sensor and drain cock; bracket. **600** |
| 18 | **Oil fill neck + cap** (new `oilFill`) | **Absent** (a brown tube on the flank is not it) | **M** | Discrete bolt-on neck at the **front of the engine**, left of the fan-shroud centreline, with a cap. Not a valve-cover filler. **250** |
| 19 | **Dipstick** (new `dipstick`) | A brown tube of uncertain identity along the LH flank | **S + X** | Tube down the **right** side of the block with a bracket and an O-ring boss, ending in a **yellow loop** handle at the top rear. **250** |
| 20 | **Lifting bracket** (new `liftBracket`) | **Absent** | **M** | **One** rear bracket on the LH rear of the block (GM's install procedure uses a single bracket). Not two symmetric eyes. **300** |
| 21 | **Fasteners (shared)** | 12-triangle boxes and 24/48/72-tri cylinders scattered with no family logic | **S** | Shared instanced primitives for the fastener families the survey counted: **24 + 8 valve-cover bolts**, **28 insulators**, **18 M8 intake bolts + 8 studs**, **3 turbo bolts**, 3 per up-pipe flange, manifold bolts. Counted and placed by row, not individually modelled. **1,500** |
| 22 | **Badging / lettering** | **Absent** | **M (by decision)** | **Not modelled** (§2.3). Zero triangles. The only lettered surface on the engine is the excluded plastic intake cover. **0** |
| — | **Residual: `electronics`** | 1,704 tris of loom boxes + a red connector across the valley | **P / S** | Re-shaped as the engine harness: one swept loom along the valley edge, the injector branches to the eight connectors, the rear-left main break, the glow-plug loom stubs. **0 (inside part 5's budget)** |

**Summary of the gap (22 part families + the harness residual row):** **9 missing** (parts 2, 3, 6, 13, 14, 17, 18, 20, and 22 by decision), **8 present but wrong shape** (1, 4, 7, 8, 9, 11, 12, 21), **5 wrongly positioned** (5, 10, 15, 16, 19 — three of which also carry a shape fault), and **1 residual row** (the `electronics` harness, present but to be re-worked into the injector/loom budget). Nothing in the exterior is both present and right except its gross arrangement. The current shell's failure is not that it lacks triangles; it is that its triangles are spent on duplicated primitives and boxes instead of form.

---

## 5. The rebuilt shell

### 5.1 Authoring class — project-frame, degenerate registration (new asset class)

The shell moves from the **registered file-frame class** (M3) to a **project-frame class**, joining the M8 "scene-placed" precedent:

| Rule | M3–M9 (today) | M10 |
| --- | --- | --- |
| Authoring frame | Owner's file frame; registered at runtime by `T + s·R·p_file` | **Master project frame**: `+X` front / crank axis, `+Y` vehicle LH, `+Z` up, metres, authored at final positions |
| Runtime registration | `s = 0.430`, `R: (x,y,z)→(z,x,y)`, `T = (0.2042, 0, 0.1118)` m | **scale 1, translation 0, and the basis is the Y-up→Z-up conversion itself**: `basisColumnsProjectFromFile = [[1,0,0],[0,0,1],[0,−1,0]]`, i.e. `p_proj = (g_x, −g_z, g_y)` (see below) |
| Axis conversion | glTF Y-up export (`export_yup=True`) | **unchanged** (`export_yup=True`) — the Y-up→Z-up conversion now lives in the registration basis instead of a `+90° X` wrapper |
| Textures | 4 embedded (6.500 MiB) | **none** — untextured PBR, no images |
| Provenance | "owner concept set" | per-feature rows in `assets-src/PROVENANCE.md`, each `sourced` / `illustrative` |
| Budget ceiling | 31,396 (no cap) | **37,100**, fixed by the per-group table (§5.2) |

**The asset frame, spelled out (this is the part that cannot be hand-waved).** Blender authors in `+Z`-up; `export_yup=True` writes glTF `(g_x, g_y, g_z) = (X, Z, −Y)`. `exteriorLoader` applies *only* the registration basis, so the shell's `ExteriorRegistrationSpec` must reproduce the Y-up→Z-up conversion the M8 scene-placed class gets from `wrapInPartLocalFrame`:

```
basisColumnsProjectFromFile = [[1, 0, 0], [0, 0, 1], [0, −1, 0]]      // det = +1
p_proj = R · p_gltf = (g_x, −g_z, g_y)   with uniformScale = 1, translationM = [0, 0, 0]
```

An **identity** basis here would lay the engine on its side: it would leave the model in glTF Y-up space, 90° off the project frame. The words "identity registration" are used in this spec to mean *scale 1 and zero translation with the Y-up basis above*, never a literal identity matrix. (Option B — `export_yup=False` plus a literal identity basis — is rejected: it breaks the asset contract's "conversion happens once at export" rule.)

`src/renderer/exteriorLoader.ts` is **not modified** — it already applies whatever `ExteriorRegistrationSpec` it is given, and its 24-bucket ceiling and preserved-subtree mechanism both survive. Only the constants in `layout.ts` change (§14).

**Why the registration degenerates to a pure axis conversion instead of keeping the 0.430 similarity:** the 0.430 scale is a *containment hack* around the owner's file-frame concept set (`docs/M3-MEASUREMENTS.md` §2.3: "while overall outer bounding-box containment allows `s ≥ 0.246` … `s = 0.430` is the clean uniform scale at which the actual 3D valve-cover, front-cover, and oil-pan surfaces enclose all 8 cylinders"). A purpose-built shell does not need a fudge factor, and authoring in the project frame removes an entire class of registration error (the 204 mm front-drive float in §4 part 15 is exactly that class of error). The cost is one test rewrite (`layout.test.ts` test 7), traced in §6.6.

### 5.2 Part budget table (the normative cap)

| Node group | `extras.partId` vocabulary | Budget (tris) |
| --- | --- | ---: |
| `blockPan` | `ext_block`, `ext_pan`, `ext_drain_boss`, `ext_mount_lh`, `ext_mount_rh` | 3,500 |
| `frontCover` | `ext_front_cover`, `ext_wp_boss`, `ext_cp3_pad` | 1,100 |
| `heads` | `ext_head_rh`, `ext_head_lh`, `ext_exh_port_stub_*` | 1,600 |
| `valveCovers` | `ext_vc_upper_rh`, `ext_vc_upper_lh`, `ext_vc_lower_rh`, `ext_vc_lower_lh`, `ext_vc_pcv_boss`, `ext_vc_fasteners` | 3,400 |
| `injectors` | `ext_injector_1` … `ext_injector_8`, `ext_inj_connector_1` … `ext_inj_connector_8`, `ext_inj_return_line` | 2,100 |
| `exhaustManifolds` | `ext_exh_manifold_rh`, `ext_exh_manifold_lh`, `ext_exh_shield_rh`, `ext_exh_shield_lh` | 2,300 |
| `turbo` | child 0 `ext_uppipe_rh` (1,100), child 1 `ext_uppipe_lh`, child 2 *(preserved)* `turbo_downpipe` (800), child 3 *(preserved)* `turbo_unit` (3,400) | **5,300** |
| `boostPipe` | `ext_charge_hot` | 1,400 |
| `chargePipeCold` | `ext_charge_cold` | 800 |
| `intake` *(preserved whole group)* | `ext_intake_mouthpiece`, `ext_intake_duct`, `ext_intake_clamps` | 2,300 |
| `resonator` | `ext_resonator`, `ext_resonator_clamp` | 600 |
| `intakeBridge` | `ext_ybridge_duct`, `ext_ybridge_crossover`, `ext_ybridge_seals`, `ext_map_sensor`, `ext_ybridge_fasteners` | 2,300 |
| `egrSystem` | `ext_egr_valve`, `ext_egr_cooler`, `ext_egr_pipes`, `ext_egr_bracket` | 1,900 |
| `beltDrive` | `ext_damper`, `ext_fan_clutch`, `ext_fan`, `ext_tensioner`, `ext_idler_a`, `ext_idler_b`, `ext_belt` | 3,300 |
| `alternator` | `ext_alternator`, `ext_vacuum_pump` | 1,400 |
| `acComp` | `ext_ac_compressor`, `ext_ps_pump`, `ext_ac_bracket`, `ext_ac_hoses` | 600 |
| `cp3Fuel` | `ext_cp3`, `ext_fca`, `ext_hp_rails`, `ext_hp_lines` | 1,400 |
| `fuelFilter` | `ext_fuel_filter_head`, `ext_fuel_filter_canister` | 600 |
| `oilFill` | `ext_oil_fill_neck`, `ext_oil_cap` | 250 |
| `dipstick` | `ext_dipstick_tube`, `ext_dipstick_handle` | 250 |
| `liftBracket` | `ext_lift_bracket` | 300 |
| `electronics` | `ext_harness_loom`, `ext_harness_main_break`, `ext_glowplug_loom` | 400 |
| | **Total — the normative shell budget** | **37,100** |

Budget rules, stated so the test of §9 item 2 can be written unambiguously:

- **Fasteners live inside the group that carries them** (the `*_fasteners` ids above). There is no shared fastener pool; a fastener primitive may not be counted twice.
- **Every group has a budget**, including `electronics`; the `turbo` row is the sum of its four children.
- **Per-group budgets are ceilings, not targets.** A group may come in under; no group may exceed its row; the sum of the measured per-group values must be ≤ **37,100** (so the shell total is ≤ 37,100 by construction — there is no separate cap to reach for).
- **Redistribution is a spec revision, not a builder decision.** If a group genuinely cannot meet its row, the build stops and reports; it does not borrow from another row.

### 5.3 Structural contract (what the builder must produce)

1. **22 top-level group nodes** with the names in §5.2. The twelve M3 names (`blockPan, injectors, cp3Fuel, turbo, egrSystem, resonator, intake, boostPipe, alternator, acComp, beltDrive, electronics`) keep their names and meaning; the **ten new names are appended after them** (`frontCover, heads, valveCovers, exhaustManifolds, chargePipeCold, intakeBridge, fuelFilter, oilFill, dipstick, liftBracket`). Node order is not load-bearing — `exteriorLoader` resolves groups by name — so the append rule exists only to keep the diff readable and the twelve-name prefix stable.
2. **`turbo` direct children keep their index semantics**: child 0 = RH up-pipe, child 1 = LH up-pipe, **child 2 = downpipe**, **child 3 = turbo unit** — these are the M8 split indices and are frozen.
3. **`intake` is a whole-group preserved subtree** (its internal child structure is free).
4. **Every mesh leaf carries `extras.partId`** from the vocabulary in §5.2, with the instance suffixes spelled out (`_1`…`_8`, `_rh`/`_lh`, `_a`/`_b`, `_rh_1`…`_rh_4` for the exhaust-port stubs). **The repo's Blender export path does not write `extras` today** — `build_cylinder1.py`/`build_variants.py` set neither `export_extras` nor custom properties, and the current shell's `extras.partId` came from the owner's `THREE.GLTFExporter` export, not from a repo script. `build_shell.py` must therefore set **`export_extras=True`** and write `obj["partId"]` on every mesh object before export.
5. **Geometry attributes:** every primitive is `POSITION` + `NORMAL` only, indexed, triangulated, no UVs, no vertex colours, no morph targets, no skins, no animations. This keeps `computeMaterialSignature` bucket keys uniform so the merge yields exactly one mesh per material.
6. **Materials:** `MeshStandardMaterial` only, **no images/textures**, one metallic-roughness set per material, material names `mat_<family>`; the **global-merge** signature count must be **≤ 24** (the loader throws above 24) and the preserved subtrees must not exceed 13 merged meshes total (`turbo_unit` ≤ 6, `turbo_downpipe` ≤ 2, `intake` ≤ 5).
7. **Ground and clearance:** shell `Z_min ≥ −223.6 mm` (studio floor at −245.0 mm, so ≥ 21.4 mm clearance preserved) and `Z_max ≤ 583.9 mm`; `Y ∈ [−573.4, +521.8]`; `X_min ≥ −282.1 mm`; **`X_max ≤ 700 mm`** (front-drive correction, §5.4).
8. **No node transforms other than identity on groups** except where a child needs a local placement; the exporter path (`build_variants.py`'s `finalize_bmesh_object`) is the reference implementation.

### 5.4 The two positional corrections M10 must make

**(a) Front drive — ~283 mm rearward.** The internal model already contains the crank's front pulley/damper disc: **X 466…476 mm, outer radius 57 mm**, with the snout ending at **X 478 mm** (`blockLengthMm 460 + 18`; `src/renderer/engineScene.ts:298–323`). The shell's external damper is the *detailed version of that disc*, so it must be an **annulus around it** — same axis, larger radius, bore clear of the internal disc — with the belt running in the damper's own groove and the fan ahead of the belt. The shell must place the stack at:

| Element | X (mm) | Basis |
| --- | ---: | --- |
| Front cover plate (annulus, bore ≥ r 60) | 460 … 472 | block front plane 460 + cover depth (illustrative) |
| Damper ring (r 60 … 99, OD 198) | 464 … 492 | encloses the internal disc 466…476 with ≥ 3 mm radial clearance (illustrative width) |
| Belt plane (K06 band, 20 mm, in the damper groove) | 472 … 492 | derived from the damper's outer-ring plane |
| Fan clutch | 530 … 570 | illustrative standoff |
| Fan blade plane | 570 … 615 | illustrative standoff |

The damper **axis is the crank axis** (Y = 0, Z = 0); the 198 mm OD is a grade-C replacement-part figure (recorded, not a GM dimension). The current shell's damper is at X 722…765 and Z −43: **~283 mm forward and 43 mm low** (correction = `760.6 − 478 = 282.6 mm`). All five offsets above are illustrative (§12.3 open item) and are computed in §15.6 from the measured internal geometry, not from the old asset.

**(b) Injector row — inboard, not outboard.** The current rows swing to Y ±349 mm, 68 mm *outside* the block's widest face (±281.5). The rebuilt rows sit in the **valley-side trough of each bank**, on the internal injector axis (X = station centre, valley offset from `detailConfig`'s injector placement), with the return line clipped along each row and the main harness break at the rear of the **left** bank.

### 5.5 Materials

Untextured PBR, one material per surface family, no images. Target palette (≤ 24 global-merge signatures):

| Material | Base colour (linear) | metalness | roughness | Used by |
| --- | --- | --- | ---: | --- |
| `mat_cast_iron` | `0.155, 0.160, 0.170` | 0.55 | 0.72 | block, heads, manifold castings, turbine housing |
| `mat_cast_alu` | `0.470, 0.480, 0.500` | 0.82 | 0.46 | valve covers, front cover, compressor cover, Y-bridge, filter head, CP3 body |
| `mat_powder_black` | `0.055, 0.058, 0.064` | 0.30 | 0.62 | intake duct, mouthpiece, resonator, belt, fan blades, boots |
| `mat_steel` | `0.560, 0.575, 0.600` | 0.90 | 0.28 | pulleys, brackets, up-pipes, downpipe, shields, rails |
| `mat_stainless_polished` | `0.760, 0.775, 0.800` | 0.95 | 0.16 | charge pipes, clamps, fastener heads |
| `mat_silicone_black` | `0.035, 0.036, 0.040` | 0.05 | 0.80 | couplers, boots |
| `mat_paint_engine` | `0.130, 0.135, 0.150` | 0.40 | 0.55 | block paint, pan |
| `mat_plastic_ripple` | `0.085, 0.088, 0.095` | 0.08 | 0.66 | harness loom, connectors, sensor bodies |
| `mat_brass` | `0.520, 0.400, 0.190` | 0.85 | 0.34 | banjo fittings, coolant stubs |
| `mat_copper_heat` | `0.470, 0.270, 0.170` | 0.80 | 0.42 | heat-tinted shield accents |
| `mat_dipstick_yellow` | `0.700, 0.560, 0.060` | 0.20 | 0.45 | dipstick handle |
| `mat_oil_filter_blue` | `0.070, 0.130, 0.360` | 0.35 | 0.42 | spin-on oil filter (retained from the current shell's cue) |
| *(reserve, ≤ 12 more)* | — | — | — | gaskets, seal rubber, wire bundles, badges (unused — §2.3) |

Material **count is the binding ceiling**, not colour choice: at most **24 distinct signatures in the global merge**, including the preserved subtrees' own materials.

### 5.6 Build pipeline

1. **`assets-src/shell_dimensions.json` (new):** every dimension, offset and count the script needs — internal anchors read from `dimensions.json` (bore pitch 115, deck stack, lifter/rocker heights, injector body 24 × 120), the M8 datum coordinates (verbatim from `variant_dimensions.json`), the front-drive stack from §5.4, and the illustrative per-part envelopes. **No hard-coded dimension may appear in the Blender script** (M2 discipline); the script reads only this file.
2. **`assets-src/blender/build_shell.py` (new):** headless Blender 5.2.3 LTS, deterministic, no `bpy.ops` randomness, reusing `build_variants.py`'s helper patterns (`finalize_bmesh_object`, Y-up export, 38° crease, `extras.partId`). It writes `public/Duramax_LLY_2005_66L_V8.glb` and prints a **logged assertion block** (the M8 precedent): per-group triangle counts vs budget, total vs cap, material-signature count, datum nearest-vertex distances, bounding extremes, and the analytic clearance report.
3. **Containment assertion (in-script):** the shell's inner surfaces must be ≥ **8 mm** outside the analytic internal envelope derived from `dimensions.json` (banks, deck, rockers, springs, crank webs). Three documented exceptions, each with its own number: the **deck/head land** (**2 mm** — cover and head are clamped there), the **crank-snout zone** X ≤ 492 (**≥ 3 mm radial** to the internal pulley/damper disc at r 57, **≥ 2 mm axial**), and the **pan/floor** (**≥ 21.4 mm**, unchanged from M3). The runtime proof is the 8-angle visual containment sweep in §13 item 7.
4. **`build_variants.py` re-run — and a bounded edit to it.** As shipped, the script hard-codes the old shell registration (`SHELL_REGISTRATION_OFFSET_MM + 430·(z,x,y)`) and collects only the **twelve** `SHELL_GROUP_NAMES` as obstacles, so it cannot read an identity/Y-up shell and would miss all ten new groups. M10 therefore edits **only its shell-reading and obstacle-collection code**: the registration becomes the §5.1 Y-up mapping `(g_x, −g_z, g_y)` (scale 1, zero translation) and `SHELL_GROUP_NAMES` becomes the 22 group names. The geometry, datums, pinned dimensions and export path are untouched, and the five output GLBs must come out **byte-identical** (same SHA-256) because no input dimension and no datum changed — that byte-identity is the check that the edit stayed on the assertion side. A non-penetration failure is fixed **in the shell**, never by moving a datum.

---

## 6. Interface preservation and re-pin analysis (Milestone 8 datums and shell structure)

The brief requires that the Milestone 8 variant interface datums and the shell group structure be **preserved or explicitly re-pinned with the consequences traced**. This section takes each interface, states the disposition, and traces the consequence chain.

### 6.1 The seven `if_*` marker coordinates — **PRESERVED, exact**

| Marker | Project coordinate (mm) | Mating normal | Mating radius | Disposition |
| --- | --- | --- | ---: | --- |
| `if_turbine_inlet_rh` | `[−137.6, −84.1, 340.6]` | ≈24–27° off radial | 44 | **PRESERVED ±1.0 mm** |
| `if_turbine_inlet_lh` | `[−137.6, 46.4, 356.8]` | ≈24–27° off radial | 44 | **PRESERVED ±1.0 mm** |
| `if_turbine_outlet` | `[−146.2, −59.2, 373.3]` | `(−0.782, −0.247, −0.572)` | 52 | **PRESERVED ±1.0 mm** |
| `if_compressor_inlet` | `[13.2, 22.6, 453.6]` | `(0.7382, −0.6722, −0.0571)` | 48 | **PRESERVED ±1.0 mm** |
| `if_compressor_outlet` | `[36.5, 56.1, 419.2]` | `(0.973, 0.165, 0.180)` | 44 | **PRESERVED ±1.0 mm** |
| `if_airbox_mount` | `[587.4, −510.5, 371.9]` | `(0.8828, −0.4414, −0.1605)` | — (service point) | **PRESERVED ±1.0 mm, and upgraded to a real feature** (the tract's end face) |
| `if_hot_side_inlet` | `[374.6, 474.8, 146.6]` | `(0, +1, 0)` | — (service point) | **PRESERVED ±1.0 mm, and upgraded to a real feature** (the hot pipe's end flange) |

**Consequences traced:**

- The four frozen variant GLBs (`turbo_large`, `intake_highflow`, `exhaust_4in`, `intercooler_upgraded`) continue to mate **without modification**: their datums, normals and flange radii are unchanged, and the shell side now meets them exactly. **No variant GLB is rebuilt; all five SHA-256 values stay as recorded in `docs/M8-MEASUREMENTS.md` §1.**
- `src/assets/variantAssets.test.ts` (marker coordinates, datum deviations, envelope/non-penetration tables) is **unchanged**.
- The two former "service point" markers become real shell features. This is a **tightening**, not a re-pin: the M8 documents describe them as display datums because the old shell had no feature there (17.83 mm and 31.39 mm from the nearest vertex). After M10 they are 0 mm from a shell vertex; `docs/M8-VARIANTS.md` is **not edited** (frozen), and the change is recorded in `docs/M10-EXTERIOR.md`.

### 6.2 Mating normals and radii — **PRESERVED**

The five contact markers keep their normals within **±0.5°** and their flange/seal radii at the M8 class (`r = 44 / 44 / 52 / 48 / 44 mm` — five markers, three distinct values — ±1 mm). A rebuilt turbo with different flange radii would leave the M8 `turbo_large` cover visibly mismatched at the joint — this is the concrete reason the radii are pinned, not just the points.

### 6.3 Shell group structure and the preserved split — **PRESERVED**

| Item | Today | M10 | Consequence |
| --- | --- | --- | --- |
| 12 top-level group names | as §3 | **identical names, identical meaning, same relative order** | `exteriorLoader` lookups by name keep working |
| `turbo` child indices | 0 RH up-pipe, 1 LH up-pipe, **2 downpipe, 3 turbo unit** | **identical** | `EXTERIOR_PRESERVED_SUBTREES` unchanged |
| `intake` whole-group split | whole group | **identical** | unchanged |
| Preserved subtree triangles | 560 / 2,056 / 5,740 | **800 / 3,400 / 2,300** | `EXTERIOR_PRESERVED_TRIANGLES` re-pinned; `partVariants.test.ts` test 7 literal 31,396 → the measured total and per-subtree literals updated |
| `SHELL_PARTS_REPLACED_BY_SLOT` | turbo→turbo_unit, intake→intake_tract, exhaust→turbo_downpipe, intercooler→[] | **unchanged** | variant swap semantics unchanged |
| Global-merge mesh ceiling | 24 | **24** | new material palette capped; test asserts |
| 10 new top-level groups | — | **added** (names in §5.2) | merged into the global bucket by the existing loader; no code change |

**Documentation errata recorded, not edited** (both are in `docs/M8-VARIANTS.md` §5 and both are historical once M10 lands):

1. The doc lists `fan` among the twelve group names; the asset's twelfth name is **`beltDrive`** (the old shell never had a `fan` group). M10 keeps `beltDrive` and puts the fan inside it.
2. The doc pins the preserved-subtree triangle counts at **2,056 / 560 / 5,740** and says any future shell replacement will fail loudly. That is exactly what M10 makes happen, by design: the counts become **3,400 / 800 / 2,300**. The frozen doc keeps the old numbers as the M8 historical record; the live values are in `src/renderer/partVariants.ts` and `docs/M10-EXTERIOR.md`, and the drift is recorded in §12.3.

### 6.4 Exterior label anchors — **two preserved, one must move**

| Anchor | Today | M10 | Consequence |
| --- | --- | --- | --- |
| `turbocharger` | `[−60, 0, 435]` | **preserved** — the new turbo housing contains that point | none |
| `oil-pan` | `[135.4, 0, −172]` | **preserved** — the new pan contains that point | none |
| `harmonic-balancer` | `[760.6, 0, −43]` | **MOVED to the rebuilt damper/hub centre `[478, 0, 0]`** | `viewLayout.ts` constant change; RF-3 and RF-7's frame descriptions change ("harmonic-balancer pulley facing +X" stays true, its position moves ~269 mm rearward); the on-screen `Harmonic balancer` label moves with it — no label count or visibility-rule change |

This is the **only label-position change** in the milestone; the other 22 label anchors are untouched. A new test asserts each of the three exterior anchors lies inside its named part group's bounding box (§9 test 3).

### 6.5 The registration transform — **explicitly re-pinned to a degenerate (scale-1, Y-up-basis) transform**

| Item | Before | After | Consequence chain |
| --- | --- | --- | --- |
| `uniformScale` | `0.430` | `1.0` | `layout.ts` constants; `layout.test.ts` test 7 rewritten (det = +1, crank axis on X, span minima still met) **and extended** with explicit identity-scale/basis/translation assertions, because the current test 7 asserts none of them and would pass a silent rescale |
| `basisColumnsProjectFromFile` | `[[0,1,0],[0,0,1],[1,0,0]]` (file +Z → project +X) | `[[1,0,0],[0,0,1],[0,−1,0]]` (Y-up→Z-up; §5.1) | `layout.test.ts` test 7 rewritten, including explicit `uniformScale`, basis and `translationM` assertions |
| `translationM` | `(0.2042, 0, 0.1118)` | `(0, 0, 0)` | same |
| `fileCrankAxisXYM` / `fileCrankClusterZRangeM` / `fileSceneBoundsM` | owner-file values | `[0, 0]` / the crank-cluster range along the new file axis / the new model's own bounds | same |
| `projectBoundsMm` | X[−282.14, 892.75] … | recomputed: **X[−282.1, ≤700]**, Y[−573.4, 521.8], Z[−223.6, 583.9] | `layout.test.ts` span assertions (`≥627 / ≥607 / ≥375`, rear overhang `∈ [12, spanX−480]`, `max X ≥ 480`) still pass; the *values* change and are re-recorded in `docs/M10-MEASUREMENTS.md` |
| `exteriorLoader.ts` | — | **unchanged** | it applies whatever spec it is handed |

### 6.6 What does *not* need to change (the preservation dividend)

`src/renderer/exteriorLoader.ts`, `src/renderer/engineScene.ts`, `src/catalog/**`, `src/core/**`, `src/perf/**`, `src/config/**`, `src/ui/engineControls.ts`'s view logic, all five variant GLBs, `src/assets/variantAssets.test.ts`, `src/renderer/viewLayout.test.ts` (label *definitions*), and every doc M0–M9 except the ones the paperwork section names.

### 6.7 The re-pin alternative, and why it is rejected

The alternative was to **re-pin the datums** (place the new turbo wherever the real form wants it and rebuild the four external variant GLBs to the new numbers). Rejected because its consequences are strictly worse:

1. Four frozen assets rebuilt → four new SHA-256 values, new triangle counts, new envelope tables, a `docs/M8-MEASUREMENTS.md` successor, and a re-run of every M8 assertion with new expected values.
2. `variantAssets.test.ts` (29 KB of pinned datum/envelope/non-penetration literals) rewritten, i.e. the milestone's proof surface loses its independence.
3. `RF-8`/`RF-9` re-captured anyway (they are re-captured under either option).
4. A real risk that the rebuilt variants no longer fit the new shell's obstacles, requiring iterative Blender work on five files instead of one.

Preserving the datums costs one constraint on the turbo's shape (its five flanges must land where M8 says) and **buys** the entire variant interface for free. The constraint is compatible with the real engine: the survey's literature independently puts the turbo in the rear of the valley, with its compressor on the passenger side and its outlets where M8 already has them (§ survey §9).

---

## 7. Budgets (D-033)

### 7.1 The constraint, stated plainly

`docs/M2-MEASUREMENTS.md` §5 sets, per tier: scene asset triangles ≤ **360,000** desktop / **320,000** phone; submitted triangles ≤ 700,000 / 400,000; draw calls ≤ 250 / 120; texture+HDRI VRAM ≤ 64 / 32 MiB; frame time ≤ 16.7 ms / 33.3 ms at 900 rpm.

The **binding number for any exterior work is the phone scene-triangle budget**, because the frozen internal assembly already consumes **271,224** of the 320,000 (84.8 %). That leaves **48,776** triangles for the entire exterior shell — and the shipped shell already uses 31,396 of them. So:

> **The rebuilt shell is capped at 37,100 triangles — +18 % over the shipped shell — and that cap is set by the phone tier, not by the desktop tier or by any modelling preference.**

The spec takes that cap seriously in both directions: it does **not** propose raising D-033 (the brief's constraint is hard), and it does **not** pretend the growth is free — it shows the margins that remain (§7.2) and the conservative cap-guard that narrows to 3,532 triangles (§7.3).

### 7.2 Tier arithmetic at the 37,100 budget (computed, §15.2)

| Normative metric | Budget | Shipped (M8/M9) | M10 at 37,100 | Utilisation | Headroom |
| --- | ---: | ---: | ---: | ---: | ---: |
| **Desktop** scene triangles | 360,000 | 302,620 | **308,324** | 85.7 % | 51,676 (14.3 %) |
| **Phone** scene triangles | 320,000 | 302,620 | **308,324** | 96.4 % | **11,676 (3.65 %)** |
| Desktop submitted / frame | 700,000 | 573,780 | **579,484** | 82.8 % | 120,516 (17.2 %) |
| Phone submitted / frame | 400,000 | 302,272 | **308,324** | 77.1 % | 91,676 (22.9 %) |
| Desktop draw calls | 250 | 106 | **110** (max, unculled) | 44.0 % | 140 |
| Phone draw calls | 120 | 65 | **74** (max, unculled) | 61.7 % | 46 |
| Desktop VRAM | 64 MiB | 27.25 | **20.75** | 32.4 % | 43.25 |
| Phone VRAM | 32 MiB | 11.25 | **4.75** | 14.8 % | 27.25 |
| Desktop frame p95 @ 900 rpm | 16.7 ms | 16.8 ms | to be re-measured | — | — |
| Phone frame p95 @ 900 rpm | 33.3 ms | 16.8 ms | to be re-measured | — | — |

Draw-call arithmetic: the shell ships **≤ 24 global-merge buckets + ≤ 13 preserved-subtree meshes = ≤ 37** exterior draw calls, replacing today's 33. The loader's 24-bucket ceiling is unchanged. The preserved-subtree budget rises from 12 to 13 because **`turbo_downpipe` may need two material signatures** (stainless pipe + heat-tinted shield band) where the old downpipe used one; `turbo_unit` stays at ≤ 6 and `intake` at ≤ 5.

VRAM **falls** because the replacement shell is untextured: the four embedded textures (1024², 512×256, 256², 256×128 = **6.500 MiB**) disappear on both tiers.

### 7.3 The derived cap-guard

`partVariants.test.ts` test 9 guards the worst-case variant build from **caps**, not measured assets. Re-derived with the M10 constants (§15.3):

```
worst_case = (271,224 + 37,100) − 6,500 + 10,800 + 2,944 = 315,568  ≤ 320,000   (headroom 4,432)
```

That is a **7,560-triangle reduction of that guard's headroom** versus M8 (11,992 → 4,432), recorded here rather than buried: it is the price of an 18 % larger shell, and it is *conservative by construction* (it sums the M8 variant caps 3,600/2,600/2,800/1,800 = 10,800 and the piston cap 5,200 against *measured* external variant total 9,720 and measured piston 3,968). The measured-variant worst case is **305,532** (95.5 %, headroom 14,468). Both are reported; acceptance requires both ≤ 320,000.

### 7.4 Frame cost

The shell adds ~6,600 triangles and 4 draw calls over the shipped asset, removes 6.5 MiB of texture uploads, and adds no per-frame CPU work (static geometry, no animation, no new materials logic). The build must re-run the `?benchmark=1` matrix (desktop + phone, stock + worst-case variants) and record p95 in `docs/M10-MEASUREMENTS.md`; a p95 regression of more than **0.30 ms** against the M9 numbers is a failure, not a footnote.

---

## 8. Visual proof — reference frames

### 8.1 New frames (7 total new captures, 3 new definitions)

| Frame | Crank angle | Camera position → target (m) | Exterior / views | Build | What it is for |
| --- | ---: | --- | --- | --- | --- |
| **RF-11** *(new)* | 180° | `[1.3800, −1.1800, 0.7200] → [0.3000, −0.0200, 0.1700]` | On, `0 % / Off / Off / Off` | stock | Front three-quarter: **front drive stack**, **oil fill**, **fan + clutch**, **valve covers**, **injector rows**, **Y-bridge + MAP**, **both charge pipes**, alternator + vacuum pump, A/C + P/S |
| **RF-12** *(new)* | 0° | `[−0.6200, 1.2200, 0.8600] → [0.2800, 0.0200, 0.1600]` | On, `0 % / Off / Off / Off` | stock | Rear-left: **turbo** (two-flange inlet, V-band, solenoid, sensor, shields), **up-pipes**, **downpipe**, **EGR module**, **exhaust manifolds + shields**, **lifting bracket**, **dipstick** |
| **RF-13** *(new)* | 705° | `[0.2300, −0.0020, 1.1800] → [0.2300, 0.0000, 0.1400]` | On, `0 % / Off / Off / Off` | stock | Top-down valley: **Y-bridge**, **resonator**, **mouthpiece/duct**, **injector rows**, **fuel filter head on the RH cover**, **CP3 in the front valley**, harness row |
| **RF-3** *(re-baselined)* | 180° | unchanged | On | stock | Stock exterior hero frame — now the rebuilt shell |
| **RF-7** *(re-baselined)* | 180° | unchanged | On, X-Ray On | stock | Ghosted shell: the new casting/plumbing silhouette over the internals |
| **RF-8** *(re-baselined)* | 180° | unchanged | On | 4 external variants | Modified hardware in the new surroundings |
| **RF-9** *(re-baselined)* | 0° | unchanged | On | 4 external variants | Rear-left modified hardware in the new surroundings |

`RF-1`, `RF-2`, `RF-4`, `RF-5`, `RF-6`, `RF-10` are **exterior-off** frames and must render **byte-comparable** to their committed PNGs (the shell is invisible in them; any difference is a regression in the internal scene, which M10 does not touch). This is the milestone's strongest regression gate and it costs nothing to run.

### 8.2 Frame acceptance

Each new/re-baselined frame is captured at the standing `1440×900 → 1024×640` convention, committed, SHA-256 recorded in `docs/M10-MEASUREMENTS.md`, and reviewed against its numbered checklist. **A frame passes only if every checklist item is visible or explicitly listed as deferred with a reason.** The checklists are written in the frame definitions in `docs/REFERENCE_FRAMES.md` (§12.4).

### 8.3 The eight LLY discriminators (each must be visible in a named frame)

| # | Discriminator | Frame(s) | Fails the milestone if |
| ---: | --- | --- | --- |
| 1 | Eight injector bodies + connectors **proud of** the valve covers, in two rows of four | RF-11, RF-13 | injectors are hidden under covers, or modelled as external fuel rails |
| 2 | EGR module at the rear of the valley (valve above cooler) | RF-12 | absent, or placed on the wrong side/front |
| 3 | GT3788VA in the rear valley, **two separate inlet flanges**, V-band outlet, **small passenger-side solenoid**, no wastegate canister | RF-12 | a large external canister, or a single twin-scroll flange |
| 4 | **Outboard** exhaust manifolds with shields feeding up-pipes behind the heads | RF-12 | manifolds in the valley, or up-pipes starting in mid-air |
| 5 | Two-piece Y-bridge over the valley front with its seals and MAP sensor | RF-11, RF-13 | absent (as today) |
| 6 | Oil filler neck at the **front**, beside the fan shroud | RF-11 | a valve-cover filler |
| 7 | Fuel filter head **on the right valve cover** with a vertical canister below | RF-13 | absent, or frame-mounted |
| 8 | **No water-pump pulley** on the belt; **vacuum pump under the alternator** | RF-11 | a water-pump pulley, or a missing vacuum pump |

---

## 9. Tests

The existing suite (**81 tests** at M9) must pass except the **three** test files whose literals M10 re-pins and the **one** reference-frame table test that gains three frames (all four named below). **Two new test files** are added. Test-file accounting: 4 edited + 2 new = 6 files touched.

**`src/renderer/shellAssets.test.ts` (new; Node-only, parses the rebuilt GLB with `node:fs`, never imports Three.js):**

1. **Group contract:** the GLB has exactly the 22 top-level group names of §5.2; `turbo` has ≥ 4 direct children with child 2 and child 3 present; `intake` exists as a top-level group. *Catches: a builder silently dropping a system (the current shell would fail on nine counts), or renaming a group and breaking the M8 split lookup.*
2. **Feature vocabulary:** the test carries the §5.2 vocabulary as an **explicit list of literal ids** (wildcards expanded by hand in the test: `ext_injector_1` … `ext_injector_8`, `ext_inj_connector_1` … `_8`, `ext_exh_port_stub_rh_1` … `_rh_4` and `_lh_1` … `_lh_4`, `ext_idler_a`, `ext_idler_b`, etc.); every listed id appears on at least one mesh, every `extras.partId` in the GLB is in the list, and every id belongs to the expected top-level group. *Catches: a system reduced to one unlabelled blob, and a partId typo that would silently split a merge bucket.*
3. **Per-group and total triangle budgets:** for each of the 22 groups, the summed triangle count of its `extras.partId` descendants is ≤ its §5.2 row; the scene total ≤ **37,100**. The check sums by **group**, so a `turbo` row total covers its four children (1,100 + 800 + 3,400). *Catches: a part exploding past its allocation, and any attempt to hide an overrun inside another group.*
4. **Envelope and floor clearance:** shell bounds satisfy `Z_min ≥ −223.6`, `Z_max ≤ 583.9`, `Y ∈ [−573.4, 521.8]`, `X_min ≥ −282.1`, `X_max ≤ 700` (±1 mm). *Catches: the floor plane slicing the new pan, a charge pipe escaping the RF frustum, and the front drive drifting forward again.*
5. **Asset-class rules:** zero images, zero textures, zero UV attributes, zero skins/animations/morphs; every primitive indexed, triangulated and `POSITION`+`NORMAL` only; every material a metallic-roughness `MeshStandardMaterial`. **Material-signature count:** the test re-implements the §5 signature key of `exteriorLoader.computeMaterialSignature` for untextured materials (attribute set + indexed flag + colour + metalness + roughness + emissive + opacity/transparent + alphaTest + side + flatShading) over the meshes **outside** the three preserved subtrees and asserts **≤ 24**; it separately asserts the preserved-subtree merged-mesh count **≤ 13**. *Catches: the old textured asset sneaking back, and a palette that makes `exteriorLoader` throw at runtime.*
6. **Interface datums:** for each of the seven §6.1 markers, the nearest shell vertex is within **1.0 mm**. For the five contact markers the test selects the rim (vertices whose distance to the marker is ≤ 1.5 mm **and** whose projection onto the marker's mating normal differs from the marker by ≤ 1.0 mm) and asserts the rim's radial extent lies within **±1.0 mm** of the M8 mating radius. *Catches: a rebuild that quietly moves the turbo 5 mm and breaks four frozen variant assets visually.*

**`src/ui/uiText.test.ts` (new; Node-only source-text test in the style of `src/audio/audioAssets.test.ts` — there is no existing `engineControls.test.ts`):**

7. **Exact UI text:** reads `src/ui/engineControls.ts` and `index.html` as text and asserts the §10.1 caption string appears verbatim (whitespace-normalised) and that both subtitle assignments equal `Milestone 10 — Exterior Accuracy`. *Catches: the banner still claiming the exterior is a "registered shell of illustrative placeholders", and an asset/caption disagreement.*

**`src/renderer/partVariants.test.ts` (edited — literals re-pinned, structure unchanged):**

8. Test 7: `expect(countSceneTriangles(shellGltf)).toBe(31_396)` becomes `.toBe(<the build's measured total>)` (a literal integer ≤ 37,100) and the preserved-subtree literals `2,056/560/5,740` become `3,400/800/2,300`; the assertion *shape* (name → child index → subtree triangles) is unchanged. *Catches: the split contract drifting from the new asset.*
9. Test 9: `stockSceneTrianglesExtOn` literal `302_620 → 308_324` and the `hiddenShellTris` sum from the new constant. *Catches: a budget guard still computing against the old shell.*

**`src/renderer/layout.test.ts` (edited — test 7 only):**

10. Registration is the §5.1 Y-up basis: `det = +1`; `basisColumnsProjectFromFile` equals `[[1,0,0],[0,0,1],[0,−1,0]]`; `uniformScale === 1`; `translationM` equals `[0,0,0]`; the crank axis (`fileCrankAxisXYM`) maps onto project `(Y = 0, Z = 0)`; and the §5.3 span minima still hold. **The explicit scale/basis/translation assertions are new** — the current test 7 asserts none of them and would pass a silent rescale. *Catches: a registration that rescales or mirrors the shell (det = −1) and breaks containment.*

**`src/renderer/viewLayout.test.ts` (edited — one case):**

11. The three exterior label anchors each lie inside their named part group's bounding box **read from the GLB** (not from an authored JSON), and the `harmonic-balancer` anchor is within **1.0 mm** of the `ext_damper` mesh's bounding-box centre. *Catches: a label floating in space after the front-drive correction, and a builder satisfying its own authored constant.*

**`src/ui/referenceFrames.test.ts` (edited — expected id list):**

12. `Object.keys(REFERENCE_FRAME_DEFS)` gains `RF-11`, `RF-12`, `RF-13` in order after `RF-10`; each new frame is validated by the same state checks the existing loop applies, and the three new frames use stock builds with Exterior on. *Catches: a `?rf=RF-11` URL that silently falls back to the default view, and a frame definition whose build/state does not match `docs/REFERENCE_FRAMES.md`.*

The headless tests cannot judge shape. The *look* is judged on the §8 frames; that is the same split used for WebGL since M2.

## 10. UI text

### 10.1 Illustrative caption (verbatim, replaces the current string)

```
Illustrative geometry, part shapes & timing: Bore spacing, deck height and piston protrusion, valve timing events, duration, and lift profile shape, lifter gallery placement, detailed part shapes, aftermarket variant part shapes and their service positions, and the exterior shell's individual casting proportions, fitting positions and surface detail remain illustrative, not verified LLY measurements.
```

(The only change is the final clause: `and the registered exterior shell remain illustrative placeholders` → `and the exterior shell's individual casting proportions, fitting positions and surface detail remain illustrative`. The rest of the sentence, including `not verified LLY measurements`, is preserved.)

### 10.2 Subtitles

- `index.html` subtitle → `Milestone 10 — Exterior Accuracy`.
- `src/ui/engineControls.ts` runtime subtitle → `Milestone 10 — Exterior Accuracy`.

### 10.3 No other UI change

No new control, no new label, no label-count change, no panel layout change, no view-state change. The Exterior toggle keeps its default (off).

---

## 11. Build deliverables (docs and paperwork)

1. **`docs/M10-EXTERIOR.md` (new):** the exterior model record — the 22-part inventory with node groups, measured triangles vs budget, the material palette as built, the 7 datum deviations and mating radii, the front-drive stack as built, the containment report, the `fan`/`beltDrive` erratum, the excluded-items list (§2.1), and the provenance split per feature (`sourced` / `illustrative`) with survey citations.
2. **`docs/M10-MEASUREMENTS.md` (new):** measured asset record (bytes, SHA-256, triangles by group, material signatures, bounds), the `?benchmark=1` desktop/phone matrix for stock and worst-case variants with the D-033 verdict table, the RF captures with SHA-256 and checklist results, the containment sweep at 8 crank angles, the `build_variants.py` re-run log (variant SHAs unchanged), and the exact commands used.
3. **`docs/REFERENCE_FRAMES.md`:** add RF-11, RF-12, RF-13 (definitions + images + checklists), re-baseline RF-3/RF-7/RF-8/RF-9 (images + "what to look for"), and add the §8.3 discriminator table. Exact text pattern follows the existing frame definitions; the summary table gains three rows.
4. **`docs/ASSET_CONTRACT.md`:** add the **project-frame shell class** row set (§5.1) and the `extras.partId` feature-vocabulary rule; extend the provenance rule to the shell. (D-011 extension, recorded as D-042.)
5. **`assets-src/PROVENANCE.md`:** add the shell's per-feature provenance section with survey citations and the `illustrative` verdict for every unpublished dimension.
6. **`docs/PLAN.md`:** add Milestone 10, update the post-milestone candidates line. Exact text in §12.1.
7. **`docs/DECISIONS.md`:** add **D-041** (Milestone 10) and **D-042** (asset-contract extension). Exact text in §12.2.
8. **`docs/OPEN_ITEMS.md`:** add the M10 watch and deferred items. Exact text in §12.3.
9. **`index.html`:** subtitle only.

Prior milestone docs and specs, `docs/PLANNING.md`, `docs/ORCHESTRATOR.md`, `docs/THREE_API_NOTES.md`, `docs/M2`–`M9` docs, and the ten internal GLBs plus the five variant GLBs stay **byte-identical**.

---

## 12. Exact paperwork text

### 12.1 `docs/PLAN.md`

After the Milestone 9 block, add:

> 10. **Exterior accuracy**
>     - Rebuild the exterior shell as a project-frame-authored, untextured model of the real 2005 LLY's external hardware: valve covers with the injector rows and harness connectors, outboard exhaust manifolds and up-pipes, the GT3788VA in the rear valley, downpipe, both charge pipes, intake mouthpiece and duct, Y-bridge, EGR valve and cooler, the front accessory drive (with the correct crank-snout stack), CP3, fuel filter head, oil fill, dipstick and lifting bracket — inside a 38,000-triangle cap set by the phone tier.
>     - Exit: the rebuilt shell passes the feature, per-part budget and datum tests; every Milestone 8 `if_*` datum is preserved within 1.0 mm and the four external variants still mate without modification; D-033 passes on both tiers with measured numbers; RF-11…RF-13 exist and RF-3/RF-7/RF-8/RF-9 are re-baselined; the six exterior-off reference frames are unchanged; the disclaimer caption states the exterior's remaining illustrative scope.

Replace the post-milestone candidates line with:

> After 10: capped cutaway sections, shareable builds, the LLY plastic upper intake manifold cover (the only lettered surface) as an optional cosmetic part, stock vehicle-side hardware models, and the remaining internal-part visual variants (rods, injectors, CP3, camshaft, heads) are candidates.

### 12.2 `docs/DECISIONS.md`

Add under a new `## 2026-11-14 — Milestone 10 spec` heading:

> - **D-041 Exterior accuracy (Milestone 10).** The exterior shell is **rebuilt** as a project-frame-authored, untextured, budget-capped model of the LLY's external hardware, replacing the M3-registered concept-set GLB. Scope positions: (a) **depth of detail** is a two-tier rule — silhouette-defining castings, plumbing and fittings modelled in full form; fasteners, clamps, loom and casting texture as grouped simplifications; the plastic upper intake cover, glow-plug shield, internal passaging and all lettering excluded; (b) the **EGR cooler is modelled** (grade-A part `97303654`, distinct external casting, valve above cooler) at a pinned rear-valley passenger-side position that is the milestone's weakest load-bearing fact and is isolated in one node group; (c) **no badging or lettering** — no GM source shows lettering on an LLY casting, the only lettered surface is the excluded plastic intake cover, and a fabricated wordmark would break D-012; (d) **visual proof** is RF-11/RF-12/RF-13 plus re-baselined RF-3/RF-7/RF-8/RF-9, each with a numbered feature checklist, an eight-item LLY discriminator list, and a machine-checkable node/budget/datum audit; (e) the **disclaimer caption** keeps its "not verified LLY measurements" claim but re-scopes the exterior clause from "registered exterior shell … illustrative placeholders" to "the exterior shell's individual casting proportions, fitting positions and surface detail remain illustrative". **Interfaces:** all seven M8 `if_*` datums, their mating normals and the five mating radii are **preserved within 1.0 mm / 0.5° / 1 mm**, so the five variant GLBs stay byte-identical; the `turbo` child-order split (2 = downpipe, 3 = turbo unit) and the whole-`intake`-group split are preserved; the harmonic-balancer label anchor and the registration transform are the only re-pins, both traced in the spec (§6.4–§6.5). **Budgets:** shell **37,100 triangles**, fixed by a per-group table, against a phone scene-triangle headroom of 48,776 (the frozen internal assembly is 84.8 % of the 320,000 budget); desktop scene 85.65 %, phone scene 96.35 % (3.65 % headroom), submitted 82.78 %/77.08 %, draw calls ≤ 110/≤ 74, VRAM **falls** to 20.75/4.75 MiB because the replacement shell is untextured (4 textures / 6.50 MiB removed). No D-033 budget is raised. The published LLY external envelope remains **not adopted** (two conflicting approximations), so the shell keeps its containment anchor and corrects only its internal arrangement (front drive 282.6 mm rearward onto the internal damper disc at X 466…476).
> - **D-042 Project-frame shell asset class (D-011 extension).** The asset contract gains a third class for the exterior shell: authored in the master project frame at final positions with a **degenerate registration (scale 1, zero translation) whose basis is the glTF Y-up→Z-up conversion `[[1,0,0],[0,0,1],[0,−1,0]]`**, one numbered top-level group per system (the twelve M3 names preserved in order, plus ten appended), mesh leaves carrying `extras.partId` from a fixed feature vocabulary, `POSITION`+`NORMAL` indexed triangulated geometry only, untextured `MeshStandardMaterial` (≤ 24 global-merge signatures), and no pivot/animation. This supersedes the M3 registration class for this asset only; the part-local and scene-placed classes are unchanged, and `src/renderer/exteriorLoader.ts` is unchanged.

### 12.3 `docs/OPEN_ITEMS.md`

Add to **Watch items**:

> - [ ] **EGR module position (LLY)** — three sources disagree (valley / lengthwise along the passenger cover / rear-of-engine passenger side under the turbo inlet ducting); M10 pins the third and isolates the module in one node group. Revisit with a dimensioned or photographic reference for the LLY.
> - [ ] **Exterior shell scale vs published approximate dimensions** *(replacing the existing watch item, which cited only the ≈762 × 762 × 813 mm vendor figure)* — two published approximations exist and disagree by ~100 mm per axis and by what they include: 34 × 33 × 37 in (863.6 × 838.2 × 939.8 mm, forum, fan excluded / fuel filter and P/S included / turbo and pan included) and 30 × 30 × 32 in (762 × 762 × 812.8 mm, vendor, sibling LBZ). M10 does not rescale to either; it corrects only the front-drive stack onto the internal damper disc (X 466…476). Revisit only with a GM dimensioned drawing.
> - [ ] **Front-drive stack offsets** — the damper/belt/fan standoffs are illustrative offsets from the crank snout, not published. Revisit with a dimensioned front-cover/belt-layout drawing.
> - [ ] **Valve-cover, Y-bridge, mouthpiece, charge-pipe, turbo-housing, EGR-cooler, CP3, fuel-head, oil-fill and lifting-bracket dimensions** — none published; all illustrative in M10. Revisit per part as OEM drawings or measured parts appear.
> - [ ] **`docs/M8-VARIANTS.md` §5 erratum (`fan` vs `beltDrive`)** — the frozen doc lists a group name the asset never had. M10 records the erratum; correct it only if a future milestone reopens that doc.

Add to **Deferred candidates**:

> - [ ] **LLY plastic upper intake manifold cover (`21994000`) and its lettering** — the only lettered surface on the engine; excluded in M10 because it hides the Y-bridge. A closed-up engine-bay look would need it as an optional cosmetic part (with the unverified `6.6 turbo diesel` wording treated as illustrative).
> - [ ] **Dual-generator idler, medium-duty oil filler/filter arrangement, vehicle-side hardware (airbox, intercooler core, radiator/shroud, exhaust beyond the downpipe)** — out of scope for M10.

### 12.4 `docs/REFERENCE_FRAMES.md`

Add three frame definitions in the existing format (crank angle, camera, target, lens, quality, exterior, views, build, "what to look for" as the numbered checklist from §8.1/§8.3, image, caption), add the three rows to the summary table, re-baseline the four existing exterior-on frames' images and text, and add the §8.3 discriminator table as a new section.

---

## 13. Acceptance criteria (Buckley verifies from a fresh clone)

1. **Frozen audit:** `git diff main -- src/core src/perf src/config catalog src/audio src/assets .github vite.config.ts tsconfig.json package.json package-lock.json public/models public/hdri docs/M2-MEASUREMENTS.md docs/M3-MEASUREMENTS.md docs/M4-MEASUREMENTS.md docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M7-MEASUREMENTS.md docs/M8-VARIANTS.md docs/M8-MEASUREMENTS.md docs/M9-SOUND.md docs/M9-MEASUREMENTS.md docs/specs/M0-* docs/specs/M1-* docs/specs/M2-* docs/specs/M3-* docs/specs/M4-* docs/specs/M5-* docs/specs/M6-* docs/specs/M7-* docs/specs/M8-* docs/specs/M9-* docs/research/L7-* docs/research/M8-* docs/research/M9-* docs/PLANNING.md docs/ORCHESTRATOR.md docs/THREE_API_NOTES.md` is empty. `public/Duramax_LLY_2005_66L_V8.glb` **differs** (it is the deliverable) and its new SHA-256 is recorded. All five variant GLB SHA-256 values are **unchanged**.
2. **Fresh-clone gates:** `npm ci`, `npm run typecheck`, `npm test` (existing suite plus the new/edited tests of §9), `npm run build` pass on Node 24. No test file outside the six named in §9 (4 edited + 2 new) is edited.
3. **Asset tests:** §9 tests 1–5 pass with the logged measured numbers; the build's assertion block is pasted into `docs/M10-MEASUREMENTS.md`.
4. **Datums:** the seven markers are within 1.0 mm; the four external variant GLBs attach with no visible gap at RF-8/RF-9; `build_variants.py` re-run logs `0` non-excepted vertices inside every variant envelope and `min_v2v ≥ 2.00 mm` (D-039 collar rules unchanged).
5. **Budgets:** the `?benchmark=1` matrix on production preview at 1440×900 (Full) and 390×844 (Phone), stock and worst-case 5-variant, reports scene triangles **308,324** desktop/phone, submitted ≤ 579,484/308,324, draw calls ≤ 110/74, VRAM **20.75/4.75 MiB**, and frame p95 within 0.30 ms of the M9 rows. Any budget breach is a stop-and-report, not a budget raise.
6. **Visual proof:** RF-11/RF-12/RF-13 exist at the pinned poses and every checklist item is visible or explicitly deferred; RF-3/RF-7/RF-8/RF-9 are re-baselined and their new SHA-256 values recorded; **RF-1, RF-2, RF-4, RF-5, RF-6, RF-10 are byte-comparable to the committed PNGs** (exterior off — any change is an internal-scene regression).
7. **Containment:** with Exterior on, at θ = 0°, 90°, 180°, 270°, 360°, 470°, 540°, 705°, no internal part pierces the shell (no valve-cover, head, rocker, pushrod, spring, piston or crank geometry visible through the shell at any angle); the sweep is recorded with its 8 screenshots in `docs/M10-MEASUREMENTS.md`.
8. **UI:** the caption matches §10.1 verbatim; subtitles match §10.2; the Exterior toggle still defaults off; the 23 labels, views, explode, cutaway, x-ray, dyno and sound all behave as before; zero console errors on a fresh load.
9. **Docs:** `docs/M10-EXTERIOR.md` and `docs/M10-MEASUREMENTS.md` are complete per §11; PLAN/DECISIONS/OPEN_ITEMS/REFERENCE_FRAMES/ASSET_CONTRACT/PROVENANCE changes match §12 exactly; prior docs are byte-identical.
10. **Outside review (D-021)** recorded for the milestone-exit PR.

---

## 14. Frozen and changed files

**Frozen — no changes:** `src/core/**`, `src/perf/**`, `src/config/**`, `catalog/**`, `src/audio/**`, `src/assets/**` (including `variantAssets.test.ts`), `src/renderer/exteriorLoader.ts`, `src/renderer/engineScene.ts`, `src/renderer/layout.ts`'s internal-geometry half (station/bank/valvetrain computation — only the `ExteriorRegistrationSpec` block changes, listed under **Changed**), `src/renderer/partVariants.ts`'s interface shapes (only the two constant maps' values change, listed under **Changed**), `public/models/**` (all 15 GLBs), `public/hdri/**`, `public/legacy/**`, `package.json`/`package-lock.json`, `.github/**`, `vite.config.ts`, `tsconfig.json`, and every doc M0–M9 listed in §13 item 1. **No new npm dependency.**

**Changed (expected):**

- `public/Duramax_LLY_2005_66L_V8.glb` — replaced (the deliverable).
- `assets-src/blender/build_shell.py` *(new)*, `assets-src/shell_dimensions.json` *(new)*, `assets-src/PROVENANCE.md` (shell section).
- `src/renderer/layout.ts` (`ExteriorRegistrationSpec` constants only), `src/renderer/partVariants.ts` (`EXTERIOR_PRESERVED_TRIANGLES` values only), `src/renderer/viewLayout.ts` (`EXTERIOR_SHELL_LABEL_ANCHORS_MM['harmonic-balancer']` only).
- `src/renderer/layout.test.ts` (test 7), `src/renderer/partVariants.test.ts` (tests 7 and 9 literals), `src/renderer/viewLayout.test.ts` (exterior anchor case), `src/ui/uiText.test.ts` *(new)* — note `src/ui/engineControls.test.ts` **does not exist**, so the caption/subtitle assertion must be a source-text test in the style of `src/audio/audioAssets.test.ts` — `src/renderer/shellAssets.test.ts` *(new)*.
- `src/ui/engineControls.ts` (caption string + subtitle only), `index.html` (subtitle only).
- `src/ui/referenceFrames.ts` (three new `?rf=` definitions) and `src/ui/referenceFrames.test.ts` (expected id list).
- `assets-src/blender/build_variants.py` (**assertion-side only**: the shell registration becomes the §5.1 Y-up mapping, and `SHELL_GROUP_NAMES` becomes the 22 group names). Its five output GLBs must stay byte-identical.
- `docs/M10-EXTERIOR.md`, `docs/M10-MEASUREMENTS.md` *(new)*; `docs/REFERENCE_FRAMES.md`, `docs/ASSET_CONTRACT.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`; `docs/reference-frames/RF-3.png`, `RF-7.png`, `RF-8.png`, `RF-9.png`, `RF-11.png`, `RF-12.png`, `RF-13.png`.

**If you believe any other file must change, stop and report it instead of changing it.**

---

## 15. Pre-build self-check (recorded)

Every number below was computed before this spec was finalised, from committed/measured values. Baseline: `main` @ `b58cf9c`. Arithmetic script: planning-only (not committed), re-runnable from the values quoted here.

### 15.1 Baseline decomposition

| Quantity | Value | Derivation |
| --- | ---: | --- |
| Shell triangles today | **31,396** | `302,620 − 271,224` (M8 §4.2/§4.3) |
| Non-shell scene triangles | **271,224** | measured `visibleSceneTriangles`, exterior off |
| Shell merged meshes today | **33** | `106 − 73` desktop calls = 21 global buckets + 12 preserved meshes |
| Shell texture VRAM | **6.500 MiB** | GLB images: 1024² (5.333) + 512×256 (0.667) + 256² (0.333) + 256×128 (0.167) MiB |

### 15.2 Tier arithmetic (the numbers the build must reproduce)

At the per-part budget sum **37,100**:

| Metric | Budget | M10 at 37,100 | Utilisation | Headroom |
| --- | ---: | ---: | ---: | ---: |
| Desktop scene | 360,000 | 308,324 | 85.65 % | 51,676 (14.35 %) |
| Phone scene | 320,000 | 308,324 | 96.35 % | **11,676 (3.65 %)** |
| Desktop submitted | 700,000 | 579,484 | 82.78 % | 120,516 (17.22 %) |
| Phone submitted | 400,000 | 308,324 | 77.08 % | 91,676 (22.92 %) |

Desktop submitted = `573,780 − 31,396 + 37,100`; phone submitted = `302,272 − 31,048 + 37,100` (M8 measured a 31,048-triangle culled shell in the 390×844 frustum) = `271,224 + 37,100`.

### 15.3 Derived cap-guard (test 9 form)

```
preserved subtrees        = 3,400 + 800 + 2,300 = 6,500
external variant cap sum  = 3,600 + 2,600 + 2,800 + 1,800 = 10,800
piston swap cap delta     = (5,200 − 4,832) × 8 = 2,944
cap-guard worst case      = (271,224 + 37,100) − 6,500 + 10,800 + 2,944 = 315,568  ≤ 320,000  (headroom 4,432)
measured-variant worst    = (271,224 + 37,100) − 6,500 + 9,720 − 6,912 = 304,632        (headroom 15,368)
```

### 15.4 Draw calls and VRAM

```
shell meshes max = 24 global buckets + 13 preserved meshes = 37
desktop calls    = 73 (exterior-off) + 37 = 110   ≤ 250   (44.0 %, headroom 140)
phone   calls    = 37 (exterior-off) + 37 = 74    ≤ 120   (61.7 %, headroom 46)
desktop VRAM     = 27.25 − 6.50 = 20.75 MiB       ≤ 64    (headroom 43.25)
phone   VRAM     = 11.25 − 6.50 =  4.75 MiB       ≤ 32    (headroom 27.25)
```

### 15.5 Per-part budget sum

By group, in §5.2 order (the `turbo` row is its four children):

```
3,500 + 1,100 + 1,600 + 3,400 + 2,100 + 2,300 + (1,100 + 800 + 3,400) + 1,400 + 800
+ 2,300 + 600 + 2,300 + 1,900 + 3,300 + 1,400 + 600 + 1,400 + 600 + 250 + 250 + 300 + 400
= 37,100
```

Fasteners are inside the groups that carry them (no separate pool), so this sum is the compliant maximum and the asset test's total threshold at the same time.

### 15.6 Front-drive stack derivation

```
block front plane      = blockLengthMm                      = 460      (4 x borePitch 115)
main shaft             = -18 ... blockLengthMm + 18        = -18 ... 478
internal pulley/damper disc (engineScene.ts:298-323)
                       = X 466 ... 476, outer radius 57    centre 471 (not 506, not 492)
shell front cover plate = 460 ... 472                       (annulus, bore >= r 60)
shell damper ring      = 464 ... 492                        r 60 ... 99 (OD 198, grade C)
belt plane (K06)       = 472 ... 492                        in the damper groove, 20 mm band
fan clutch             = 530 ... 570
fan blades             = 570 ... 615                        -> X_max cap 700 mm
current shell damper   = 722.4 ... 764.5 (anchor 760.6, Z -43)
correction             = 760.6 - 478 = 282.6 mm rearward, and 43 mm up onto the crank axis
X-span bound           = -282.1 ... 700 = 982.1 mm (cap, not a prediction); the actual max is
                         set by whichever of the fan (<=615) or the intake tract (643.5 today) is larger
```

The distinction the audit needs: **282.6 mm** is the displacement of the *damper/label*, while the **X-span reduction** (1,174.9 → ≤ 982.1) is a separate number driven by the frontmost shell feature, so the two must not be quoted interchangeably.

### 15.7 Datum feasibility

All five turbo-cluster M8 markers fall inside the current turbo unit's bounding box `X[−149.3, 36.5] Y[−116.0, 135.4] Z[278.4, 510.2]` — verified in the self-check run. The rebuilt turbo must therefore occupy at least that box; its own budget (3,400) and the box are both consistent with the M8 measured V1 large-turbo precedent (3,204 triangles inside `X[−178, 47] Y[−126, 136] Z[263, 530]`). **The datum constraint is satisfiable without inflating the turbo's budget.**

### 15.8 Conflicts found while drafting (all resolved in the spec, none silently)

1. **The brief's "exterior shell may grow substantially" versus the phone scene-triangle budget.** The frozen internal assembly is 84.8 % of the 320,000 phone budget, leaving 48,776 triangles for the entire shell — so "substantially" has a hard arithmetic ceiling. Resolved by: a 37,100 budget (+18 % over shipped; 48,776 = +55 % is the arithmetic maximum), a per-part table that keeps 3.65 % phone headroom, an explicit statement that a bigger shell would need a D-033 amendment (**not** proposed), and a breakdown showing the *visual* growth is far larger than the triangle growth because the rebuild removes duplicated primitives (five identical pulleys, six identical rib rings, two 12-triangle bank boxes).
2. **M8 datums versus a "real" turbo shape.** The M8 flanges sit at asymmetric heights (RH 340.6, LH 356.8) and angles. The survey's literature describes exactly that asymmetry (the passenger-side up-pipe is shaped for firewall clearance). Resolved by preserving the datums — the constraint *agrees* with the real engine.
3. **The degenerate registration versus the M3 containment proof.** Dropping `s = 0.430` removes the mechanism that guaranteed containment. Resolved by an in-script analytic clearance assertion (≥ 8 mm, 2 mm at the deck land) plus the 8-angle runtime containment sweep, replacing a one-off measurement with a repeatable check.
4. **"Model the EGR cooler" versus a three-way position conflict.** Resolved by modelling it (existence is grade-A) and isolating it in one node group, with the conflict recorded as the milestone's weakest geometric fact.
5. **Badging** — the brief lists it; the evidence says the only lettered surface is a cover that must be excluded. Resolved as an explicit negative decision with the deferred-candidate path recorded.
6. **The M8 doc's `fan` group name** — the asset says `beltDrive`. Resolved as a recorded erratum (frozen docs are not edited), with M10 keeping `beltDrive`.
7. **Two textures of the current shell are 1024² and 512×256** — big enough that a "untextured is a saving" claim needed checking. Verified: 6.500 MiB exactly, removed wholesale.
8. **The current shell's `M8-MEASUREMENTS` phone submitted figure (302,272) is 348 triangles below the scene figure** because of frustum culling; the spec's phone submitted arithmetic uses the culled relationship (31,048 of 31,396), not the raw 31,396.
9. **`docs/M8-VARIANTS.md`'s preserved-subtree triangle literals** are asserted in two places in code (the constant map and the test literal) plus once in the frozen M8 doc. The two code sites must change together and are both named in §9/§14; the frozen doc keeps the M8 numbers as history (§6.3 erratum 2).
10. **The front-drive correction changes the `harmonic-balancer` label position**, which is an M4 label contract. Resolved by moving only that one anchor, pinning it with a test, and re-baselining the two frames whose descriptions mention it.

---

## 16. Handoff

Work on branch `m10-exterior-accuracy` in the local clone, created from `main` at `b58cf9c`. Implement in this order:

1. **`assets-src/shell_dimensions.json`** — every dimension/offset/count, sourced from `dimensions.json` anchors, the M8 `variant_dimensions.json` datum values, and the §5.4 front-drive stack, with a provenance comment per illustrative block.
2. **`assets-src/blender/build_shell.py`** — build in this order: block/pan/front cover → heads → valve covers → injectors → manifolds/up-pipes → turbo → downpipe → charge pipes → intake/resonator → Y-bridge → EGR → front drive → CP3/fuel filter → oil fill/dipstick/lifting bracket → harness/fasteners. Print the logged assertion block after every group, and fail the build on any budget, datum, envelope or material-cap breach.
3. **Publish the GLB** over `public/Duramax_LLY_2005_66L_V8.glb`; make the assertion-side edit to `build_variants.py` (§5.6 item 4) and re-run it; confirm the five output SHA-256 values are unchanged and paste the full log.
4. **Constants:** `layout.ts` registration → the §5.1 Y-up basis with `uniformScale = 1` and `translationM = [0,0,0]`; `partVariants.ts` preserved triangles → 3,400/800/2,300; `viewLayout.ts` balancer anchor → the damper hub centre.
5. **Tests:** add `shellAssets.test.ts` and `uiText.test.ts`; edit the four named files' literals/cases (`partVariants.test.ts`, `layout.test.ts`, `viewLayout.test.ts`, `referenceFrames.test.ts`) and add the three new frames to `src/ui/referenceFrames.ts`.
6. **UI:** caption (§10.1) and subtitle (§10.2).
7. **Docs:** `M10-EXTERIOR.md`, `M10-MEASUREMENTS.md`, then the §12 paperwork, the three new frames in `src/ui/referenceFrames.ts` and `docs/REFERENCE_FRAMES.md`, and the seven image captures.

No new npm dependencies; no Blender changes outside the new script; no edits to frozen files. When done, push the branch and send a closing summary covering: files changed; test/typecheck/build results; the logged assertion block (per-group triangles, material signatures, datum deviations, bounds, containment report); the `build_variants.py` re-run with the five unchanged SHA-256 values; the `?benchmark=1` desktop/phone rows for stock and worst-case variants; the seven frame captures with SHA-256 and checklist results; the containment sweep at 8 crank angles; and anything that deviated from this spec. Buckley verifies from a fresh clone, opens the PR, and merges.
