# M14 Research Survey — Stock Vehicle-Side Hardware (2005 Silverado 2500HD, GMT800, LLY)

Project: Duramax LLY Engine Lab · Planning package: this survey + [`docs/specs/M14-vehicle-hardware.md`](../specs/M14-vehicle-hardware.md) · Governing plan: [`docs/PLAN.md`](../PLAN.md) (post-M13 candidates line) · Decisions re-tested: **D-033** (budgets), **D-038** (scene-placed external variants), **D-041** (exterior shell), **D-042** (project-frame shell class), **D-046** (M12 default-off cover), **D-048** (M13 rods/catalog closure).

Researched 2026-11-16 on branch `plan/m14-vehicle-hardware` from `main` @ `002b2c2` (M0–M13 complete); **revised 2026-11-17 after independent QA, with the owner's `sandboxforgamedev` reference photos actually inspected in this run**. **Access mode:** repository binary-GLB measurement, the owner's reference photographs, and a light graded web survey. No physical 2005 Silverado, no GM dimensioned drawing, and no measured sample were available. Every dimension below is either (a) measured from the shipped shell / committed GLB, (b) quoted from a named publication, or (c) explicitly marked **NOT PUBLISHED** and proposed as a labeled placeholder. **No dimension was scaled from a photograph.**

**Reliability grades** follow the L7 / M10 / M12 / M13 precedent:

| Grade | Meaning |
| --- | --- |
| **A** | GM service/workshop literature, GM owner literature, or an official GM parts catalog |
| **B** | Established diesel publication, OE component-maker documentation, or a published engineering bulletin |
| **C** | Specialist vendor fitment/technical page, or a specialist parts catalog publishing dimensions its parts must match |
| **D** | Forum post, marketing page, auction/photo listing — corroboration or colour only |
| **N/A** | Searched and absent — no credible publication located |

**Verdicts:** **VERIFIED-PUBLISHED** (usable as a design fact or value); **VERIFIED-VISUAL** (the feature is legible in published photographs/illustrations but has no dimensional specification); **PARTIALLY PUBLISHED** (published but incomplete); **RECORDED-NOT-ADOPTED** (true but not precise enough to pin geometry); **NOT PUBLISHED** (searched and absent — the spec must use a labeled placeholder); **CONFLICT** (sources disagree; both shown).

---

## 1. What this survey had to answer

The M14 brief asks for the stock truck-side hardware around the LLY in a 2005 Silverado 2500HD (GMT800): the airbox and its intake routing, the radiator and fan shroud, the stock intercooler core in its vehicle position, and the exhaust beyond the downpipe. It also asks for two smaller OPEN_ITEMS entries — the dual-generator idler and the medium-duty oil filler/filter arrangement — to be scoped IN or explicitly OUT with a recorded reason.

For each in-scope item the survey had to establish:

1. **Part identity and fitment** — what GM calls it, what it bolts to, and whether it is the LLY 2500HD pickup part or a different chassis.
2. **Published dimensions** — core sizes, diameters, pipe sizes, fan/shroud dimensions. If absent, say so and let the spec use a labeled placeholder.
3. **Vehicle position** — where it sits relative to the engine, the radiator stack, and the frame, from GM parts/service illustrations where available and the owner's photographs for layout.
4. **Connection datum** — the measured shell point it must mate to (airbox mount, fan axis, downpipe exit), so the asset can be authored in the project frame rather than placed by eye.
5. **Interaction with the existing M8/M10/M12/M13 scene** — whether the stock part and the existing modified variant can be co-visible, and if not, what the display rule must be.

A sixth question is repo-side and is answered in the spec's measured self-check, not here: the current phone headroom, the hardware cap, and the shroud's clearance to the shipped M10 fan. This survey establishes what the external record and the owner's photographs do and do not say; the spec does the arithmetic.

**Bottom line in advance:** all five in-scope items can be modelled honestly at low-detail stock-representation level, with **published replacement/proxy dimensions for the radiator and intercooler** and **labeled placeholders for the airbox, shroud and exhaust cosmetics**. The stock intercooler core's vehicle position (front of the radiator stack) is **not** the M8 upgraded intercooler's documented service point (LH outboard charge-pipe termination); the two cannot be co-visible without two cores or a new M8 asset, which drives an explicit owner decision in the spec. The **dual-generator idler** and the **medium-duty oil filler/filter arrangement** are both **OUT**: the first has no stock LLY 2500HD fitment or published geometry, and the second belongs to the C4500/C5500 medium-duty chassis, not the 2500HD pickup.

---

## 2. What ships today (measured this session)

### 2.1 Method

- Binary GLB parse of `public/Duramax_LLY_2005_66L_V8.glb` (JSON + BIN chunks, node world matrices, accessor counts, position bounds), applying the D-042 project-frame conversion `p_mm = (1000·g_x, −1000·g_z, 1000·g_y)` used by `src/renderer/shellAssets.test.ts`.
- Binary GLB parse of the ten stock part GLBs, the **six** `public/models/variants/*.glb` (five M8 variants + the M13 forged rod), the M12 cover and the M13 forged rod for triangle counts.
- The renderer's instance counts and stats arithmetic read from `src/renderer/engineScene.ts`; the current scene totals re-derived from the committed GLBs, not copied from prose.
- Runtime draw calls, VRAM and p95 were **not** re-measured (no WebGL in this VM). The M12/M13 measured values are quoted only as a cross-check; the build re-measures them on the reference GPU.

### 2.2 Project-frame anchors measured from the shipped scene

The project frame is `+X` toward the front accessory drive, `+Y` vehicle left (LH), `+Z` up, origin at the crank axis at the rear block/adapter plane. The following anchors are measured from the committed M10 shell and are the placement basis for every M14 part:

| Anchor | Project-frame value (mm) | How measured | Use |
| --- | --- | --- | --- |
| **Front of engine / damper face** | **X = 492.0** (damper front face); damper spans X 464.0–492.0, radius 99.0 | `ext_damper` vertex bounds in `public/Duramax_LLY_2005_66L_V8.glb` | Engine-side datum for the fan-clutch and radiator stack |
| **Fan plane / centre** | Blades **X 570.0–617.8**, centre **(Y, Z) = (0.0, 156.0)**, outer radius **212.0**; hub radius 72.0 and 9 blades per the M10 record | `ext_fan` vertex bounds; M10 `frontDrive` record for hub/blade count. **Conflict:** `docs/M10-EXTERIOR.md` §5.1 says `r_tip = 245`, axis `(0, +178)`, clutch X 530–570; the committed GLB measures 212/156/472–570. The measured GLB wins; the M10 doc values are stale illustrative values (§6.1). | Shroud registration |
| **Fan clutch** | X 472.0–570.0, centre (0.0, 156.0), outer radius 68.0 (bounding radius 72.0) | `ext_fan_clutch` vertex bounds; the M10 doc's 530–570 is superseded by the GLB | Shroud must not contact it |
| **Turbo compressor inlet** | **(13.2, 22.6, 453.6)**, normal (0.738184, −0.672185, −0.057099), mating radius 48.0 | `if_compressor_inlet` in `assets-src/shell_dimensions.json`; preserved by M10 | Intake routing origin |
| **Airbox mount / intake-duct outboard end** | **(587.4, −510.5, 371.9)**, normal (0.882820, −0.441410, −0.160513), cuff radius 44.45 | `if_airbox_mount`; the M10 `intake` group ends here (`ext_intake_duct` + clamps) | Airbox outlet collar |
| **Downpipe exit** | **(−222.0, −162.0, −18.0)**, **closed 14-vertex / 14-triangle flat cap**, radius **44.45**, plane normal **(−0.0059, 0.0892, 0.996) ≈ +Z** | welded `02_turbo_downpipe` mesh: 405 unique vertices, 800 triangles, **0 boundary edges**; the exit is a 14-triangle fan to the centre (−222, −162, −18) | Exhaust continuation flange |
| **Shell overall bounds** | X −272.52…617.80, Y −549.86…480.66, Z −223.50…556.00 | all shell groups | Front-end hardware must sit outside this envelope except at intended mates |

The fan measurement is the load-bearing one for the shroud: **centre (0.0, 156.0) mm, outer radius 212.0 mm, axial span 570.0–617.8 mm**. The shell's own fan is 424 mm in diameter; the M10 record does not publish a GM fan diameter, so the shroud is designed to the **shipped** fan, as the brief requires. The fan-tip samples at X ≥ 610 measure a maximum radius of 210.0 mm; the absolute 212.0 mm occurs slightly behind the shroud's rear lip, so the 10 mm radial clearance is conservative.

The shell bounds row is computed after applying the GLB node transforms; the raw accessor Y/Z axes are not the project Y/Z, so a raw-bounds reading that swaps them is wrong. `src/renderer/shellAssets.test.ts` test 4 uses the same conversion and passes.

### 2.3 Current scene and headroom (measured)

| State | Scene triangles | Draw calls | Submitted triangles | VRAM |
| --- | ---: | ---: | ---: | ---: |
| Stock, exterior on | **308,324** | 96 desktop / 58 phone | 579,484 / 307,876 | 20.75 / 4.75 MiB |
| Five M8 variants, exterior on | **304,632** | 97 / 60 | 568,880 / 304,512 | 20.75 / 4.75 MiB |
| **Fullest current state: stock + M13 forged rods + M12 cover** | **310,900** | **98 / 60** | **583,596 / 310,452** | 20.75 / 4.75 MiB |

Arithmetic for the fullest state: `308,324 + (1,372 − 1,180) × 8 + 1,040 = 310,900`. The committed M13 rod is **1,372** triangles (not the 1,400 cap), and the committed M12 cover is **1,040** triangles (not the 1,800 cap). **Phone headroom is 9,100 triangles (2.844 %); desktop headroom is 49,100 (13.64 %).**

The M13 derived cap guard is **319,128 / 320,000 phone (872 triangles, 0.2725 %)**. It is a different, conservative number built from the 1,400 rod cap, the 1,800 cover cap and the M8 variant caps; it is **not** the current measured state and cannot be added to a new asset without double-counting caps. The spec distinguishes the measured guard from the cap guard.

### 2.4 What the shell does **not** contain

The M10 shell ends at the engine-mounted intake duct, the engine-mounted charge pipes, and the turbo downpipe. It contains:

- **no stock airbox** — only the `if_airbox_mount` end of the intake duct;
- **no radiator, fan shroud, or front-end stack** — only the engine-mounted fan and fan clutch;
- **no stock intercooler core** — only the hot-side `boostPipe` ending at `if_hot_side_inlet` (374.6, 474.8, 146.6), which M8 uses as the upgraded-intercooler service point;
- **no exhaust beyond the downpipe** — the downpipe ends at the measured (−222.0, −162.0, −18.0) loop.

This is why M14 is additive stock hardware, not a rebuild of the M10 shell.

### 2.5 The state model and budget facts that constrain the design

- `src/renderer/engineScene.ts` owns three independent view booleans: `exteriorVisible`, `xrayEnabled`, and `intakeCoverEnabled`; the exterior shell and M8 external variants show when `exteriorVisible || xrayEnabled`.
- The detailed internal assembly (`v8Batches.root` plus the procedural `mainShaft`) is **always** rendered; there is no state that hides it.
- D-033's scene-asset cap is per rendered frame, but the M8/M12/M13 budget guard is **cap-additive** across every asset that can be co-visible. The current guard is 319,128 triangles.
- The M11 cap builder skips any source whose object or ancestor is invisible (`sectionCaps.ts:1911`); a hidden internal assembly therefore contributes no caps. The shroud/hardware would need the same discipline.
- The M12 ghost registry is load-order safe: registering a material while ghosting is active applies the ghost immediately. M14's hardware must register after load for the same reason.
- The 23 label anchors are fixed; internal labels hide while the opaque shell is shown, but reappear under X-Ray. A Vehicle view that hides internals must suppress them explicitly.

---

## 3. Photo evidence — owner's reference photographs

**Source:** the owner's `sandboxforgamedev` repository, `reference/` folder, now cloned at `~/projects/sandboxforgamedev`. **This revision run (2026-11-17) actually opened every cited image** with the image viewer; the earlier draft and the independent QA could not, because the clone was absent from their workspaces. The reference images are not committed to CarbonDuramax. The folder's `INDEX.md` identifies the LLY engine-bay set (`IMG_2874`–`IMG_2877`) as four stock-LLY bays, trusted over the earlier LB7 photos for engine-bay layout. The driver-side photo `02-engine-bay-driver-side.jpg` is a 2005 2500HD LLY bay.

**Photos actually viewed in this run:** `02-engine-bay-driver-side.jpg`, `IMG_2874.jpeg`, `IMG_2875.jpeg`, `IMG_2876.jpeg`, `IMG_2877.jpeg`, `03-underside-rear.jpg`, and `manuals/lly-engine-compartment-diagram.png` (2005 Duramax diesel supplement p. 5-14). `reference/INDEX.md` and `reference/duramax-2005-photo-notes.md` were also read for provenance.

**Use rule:** these photographs are **PHOTO EVIDENCE for layout and routing only**. They are not measured, have no scale, and no dimension is scaled from them. They are cited here and in the spec as “PHOTO EVIDENCE” and never as a measurement.

| Photo | What it establishes (layout only) | What it does **not** establish |
| --- | --- | --- |
| `02-engine-bay-driver-side.jpg` | Driver-side bay layout: brake reservoir and hydroboost at the driver-side firewall, underhood fuse block and driver battery at the front-left, “6.6 TURBO DIESEL” cover over the valley, coolant surge tank visible at the front-left. **The second battery is on the opposite side and is not visible in this frame.** | Any dimension; the airbox is on the opposite (RH/passenger) side, so this photo does not show its planform; the second battery is not shown. |
| `IMG_2874.jpeg` | LLY bay from the front-left/centre: the black airbox with lid and forward-facing snorkel at the **RH/passenger-side front corner**, the corrugated intake tube crossing to the turbo inlet, the fan/clutch area behind the accessories, the radiator/condenser stack at the left edge, and the charge-air pipe along the LH side. | Airbox or radiator dimensions; the intercooler core is hidden behind the grille/condenser in this view; the shroud opening is not directly visible. |
| `IMG_2875.jpeg` | Front-left close view: the airbox outlet and corrugated tube route, the fan/clutch and belt plane, a black top tank/upper hose consistent with the radiator, and the driver-side battery/fuse block. | Core thickness, fan diameter or shroud opening; no scale. |
| `IMG_2876.jpeg` | Front-of-bay view: the airbox on the RH side, the intake tube crossing the engine, the top of the fan/clutch area, and the coolant tank on the LH side. **The radiator/fan-shroud opening is below the frame of this view and is NOT directly visible.** | Shroud diameter/opening, radiator core size, intercooler position; the earlier “fan and shroud opening behind the radiator” wording is downgraded. |
| `IMG_2877.jpeg` | Front-left three-quarter: the airbox lid/snorkel, the corrugated intake hose, the fan/clutch and accessory drive. **The radiator core/front-end stack is not directly visible** in this framing. | Any dimension; the earlier “front-end stack” wording is downgraded to the visible airbox/hose/fan/accessory layout. |
| `03-underside-rear.jpg` | Underside behind the rear axle: AAM axle/diff, spare tire, exhaust curving over the axle, frame rails. A **2001 GMT800, lifted** — layout only. | Any LLY dimension, stock suspension, or exact exhaust routing; not used for dimensions. |
| `reference/manuals/lly-engine-compartment-diagram.png` (2005 Duramax diesel supplement, p. 5-14) | GM engine-compartment overview: air cleaner at one front corner (image left / truck RH), coolant surge tank at the other (image right / truck LH), fan/radiator at the front centre, engine valley cover in the middle. | A dimensioned drawing; it is a labelled line illustration, no scale or callouts; it does not show the intercooler core. |

**Photo-citation reconciliation (this run):**

| Citation / claim as drafted | What the inspected image actually shows | Disposition |
| --- | --- | --- |
| `02-engine-bay-driver-side.jpg`: driver-side layout, coolant surge tank and **second battery** across the bay | Brake reservoir/hydroboost, fuse block, driver battery, engine cover and coolant surge tank are visible; the second battery is not in this frame. | **Corrected** (second-battery claim removed) |
| `IMG_2874.jpeg`: airbox RH, corrugated intake tube, fan/clutch, radiator/condenser stack, LH charge pipe | Airbox/lid/snorkel and intake tube are clear; fan/clutch is behind the accessories; the front stack is at the left edge and mostly obscured; the silver LH charge pipe is visible. | **Confirmed** (layout only) |
| `IMG_2875.jpeg`: airbox outlet/tube, fan/clutch/belt, radiator top tank/hose, battery/fuse block | Airbox outlet and corrugated tube, fan/clutch/belt, a black top tank/upper hose consistent with the radiator, and the battery/fuse block are visible. | **Confirmed** (layout only) |
| `IMG_2876.jpeg`: airbox RH, intake tube, **fan and shroud opening behind the radiator**, coolant tank LH | Airbox, intake tube, top of the fan/clutch area and coolant tank are visible; the shroud opening/front stack is below the frame and not directly visible. | **Downgraded** (shroud-opening claim removed) |
| `IMG_2877.jpeg`: airbox lid/snorkel, intake hose, fan/clutch, **front-end stack** | Airbox/lid/snorkel, corrugated hose, fan/clutch and accessory drive are visible; the radiator core/front stack is not directly visible. | **Downgraded** (front-stack claim removed) |
| `03-underside-rear.jpg`: over-axle exhaust route, 2001 GMT800, layout only | Rear axle/diff, spare tire, exhaust over the axle and frame rails; lifted 2001 truck, not an LLY. | **Confirmed** (layout only; no dimensions) |
| `manuals/lly-engine-compartment-diagram.png`: labelled layout, no scale | Air cleaner at one front corner, coolant surge tank at the other, fan/radiator front centre, valley cover middle; no intercooler callout or scale. | **Confirmed** (layout only) |
| Intercooler front-stack position | The core is hidden behind the grille/condenser in every cited photo; no photo shows the core or its mounting datum. | **Confirmed as PHOTO-IMPLIED placeholder**, not a measurement |

**Layout conclusions supported by the photos + GM illustration:**

1. The airbox is at the **RH (passenger-side) front corner**, outboard of the radiator, with a forward-facing snorkel and an outlet that feeds the corrugated intake tube to the turbo compressor inlet. This matches the shell's `if_airbox_mount` at **Y = −510.5 mm** (RH).
2. The radiator stack is **ahead of the fan**, with the fan shroud surrounding the engine-driven fan; the shroud opening itself is **not directly visible** in the cited photos (the front views look over the stack and the side views are edge-on). The intercooler core is in the same front stack but is **not directly visible** because the condenser/grille covers it. Its front-stack position is **PHOTO-IMPLIED**, not photo-measured, and the spec labels it a placeholder.
3. The exhaust leaves the turbo downpipe at the rear/bottom of the engine and runs rearward along the frame; the underside photo `03-underside-rear.jpg` (a 2001 GMT800, lifted — layout only) shows the over-axle exhaust route, but it is not an LLY and is not used for dimensions. The LLY photos do not show the exhaust beyond the downpipe at all.
4. The LLY pickup has **one alternator** in the photos; no second alternator, dual-generator idler, or medium-duty oil filter/filler is visible in any LLY bay photo.

**What the photos do not support:** any airbox, shroud, radiator-tank, intercooler or exhaust dimension; the shroud's circular opening from a front view; the intercooler's exact position relative to the condenser; or any claim that the stock 2500HD had a dual-generator option.

---
## 4. Airbox and intake routing — **IN**

### 4.1 Published evidence

| Attribute | Value as published / visible | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| Air-cleaner assembly identity | GM air cleaner assembly **25873812**, listed for a 2004 Silverado 3500 6.6L Duramax V8 diesel, and in the 1999–2009 Silverado family | [Tubman GM Parts Depot 25873812](https://www.tubmangmpartsdepot.ca/p/Chevrolet_2004_Silverado-3500-Base-Crew-Cab-Pickup-Fleetside-66L-Duramax-V8-DIESEL-MT-4WD/Air-Cleaner-Housing-Front/48203372/25873812.html); [GMPartsDirect 25873812](https://www.gmpartsdirect.com/oem-parts/gm-air-cleaner-25873812) (Cloudflare-blocked on fetch; title and URL recorded) | A/D | **PARTIALLY PUBLISHED** — identity/fitment family, not an LLY-specific dimensioned drawing |
| Air filter identity | ACDelco **A3087C**, listed for 2001–2005 LB7/LLY | [dmaxstore ACDelco 2001–2005 LB7/LLY](https://dmaxstore.com/products/acdelco-air-filter-2001-2005-lb7-lly-duramax) | C | **VERIFIED-PUBLISHED** (fitment); filter dimensions **NOT PUBLISHED** in the fetched pages |
| Airbox form | Enclosed black plastic box with a lid, a forward-facing snorkel/duct, and a large round/oval filter element; outlet feeds the corrugated intake tube | [PHOTO EVIDENCE](#3-photo-evidence--owners-reference-photographs) `IMG_2874`–`IMG_2877`; GM supplement diagram | D/A | **VERIFIED-VISUAL** (layout/form only) |
| Airbox dimensions (L × W × H) | **NOT PUBLISHED** | Searched GM EPC/dealer pages, filter listings, aftermarket kit pages; none gives the stock box dimensions | N/A | **NOT PUBLISHED** — labeled placeholder |
| Intake-duct diameter | Not published for the stock corrugated hose; the aftermarket high-flow kits use 4 in (101.6 mm) tubing | [DuramaxTuner LLY 4 in cold-air kit](https://duramaxtuner.com/i-1838-2004-5-2005-lly-duramax-cold-air-intake-kit-with-air-box.html) (grade C) | C | **RECORDED-NOT-ADOPTED** — stock duct diameter remains unpublished; M10 already models the duct at its illustrative size |
| Airbox mount datum in the project | **(587.4, −510.5, 371.9) mm**, the end of the M10 `intake` group | measured shell `if_airbox_mount`; M10 §6.1 records 0.0000 mm nearest-vertex contact | repo | **VERIFIED-PUBLISHED (repo measurement)** |

### 4.2 Verdict and placement basis

**IN.** Model the airbox body/lid/snorkel and a **70 mm outlet collar** that mates to the existing `if_airbox_mount` through a **body inlet boss**. The **intake routing to the turbo already exists** in the M10 shell (`intake` group: mouthpiece, corrugated duct, clamps, ending at `if_airbox_mount`); M14 must not duplicate it. The airbox body is a **labeled-placeholder planform** sized from the measured mount and the photo layout: outboard of the radiator on the RH side, with its outlet at the measured marker. The stock filter element is not modelled (hidden inside an opaque box; its dimensions are not published). The airbox is not a GM dimensioned shape and must not be presented as one.

**Placement used by the spec:** body X 600–800, Y −820…−560, Z 240–520 mm; lid on top; snorkel forward to X 860; 70 mm collar from `(587.4, −510.5, 371.9)` along the marker normal to (649.197, −541.399, 360.664), seating in a body inlet boss X 636.4–736.4, Y −560…−535, Z 303.9–403.9 (the body face is at t = 112.141 mm along the normal). The airbox group AABB including the collar and boss is **X 566.52–860, Y −820…−470.61, Z 240–520 mm**. The body sits 60 mm outboard of the radiator and 40 mm outboard of the intercooler; the collar passes the radiator RH rear corner, which carries an **8 mm deep × 50 mm tall × 15 mm long relief** giving a **5.35 mm** collar-to-radiator surface clearance. This is a **photo-plausible placeholder**, not a measured airbox.

---

## 5. Radiator — **IN**

### 5.1 Published evidence

| Attribute | Value as published | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| Radiator fitment | Direct fit for 2001–2005 6.6L Duramax (LB7/LLY), Mishimoto **MMRAD-DMAX-01** | [Mishimoto EU MMRAD-DMAX-01](https://www.mishimoto.eu/fits/chevrolet/silverado-2500-hd/p/MMRAD-DMAX-01/chevy-gmc-6-6l-duramax-aluminium-radiator-01-05.html) | C | **VERIFIED-PUBLISHED** (fitment) |
| Radiator core | **34.06 in × 19.61 in (865.1 × 498.1 mm)**, **2.2 in (55.9 mm)** thick, 2 rows | same Mishimoto tech-spec table | C | **PARTIALLY PUBLISHED** — aftermarket direct-fit replacement, not a GM stock dimension; adopted as the design envelope with that caveat |
| Radiator overall | **45.6 × 20.8 × 5.4 in (1,158.2 × 528.3 × 137.2 mm)**; inlet/outlet 1.89 in (48.0 mm) | same Mishimoto tech-spec table | C | **RECORDED-NOT-ADOPTED** — the 1,158 mm overall width includes the replacement's bracket/tank envelope and would intersect the stock airbox location; the 865 mm core is adopted |
| Stock radiator dimension | **NOT PUBLISHED** as a GM dimensioned drawing | searched GM service/EPC and dealer pages | N/A | **NOT PUBLISHED** — the replacement envelope is the only published dimensional anchor |
| Photo layout | Radiator/condenser stack ahead of the fan; shroud surrounds the fan; upper hose and top tank visible | [PHOTO EVIDENCE](#3-photo-evidence--owners-reference-photographs) `IMG_2874`–`IMG_2877` | D | **VERIFIED-VISUAL** (layout only) |

### 5.2 Verdict and placement basis

**IN.** Model the radiator as a closed thin-walled core/tank assembly using the **published replacement core** (865.1 × 498.1 × 55.9 mm) and the **measured fan** for the stack position. The spec places the core/tanks at **X 650–706 mm** (rear face 32.2 mm ahead of the fan front face 617.8 mm), **Y ±500 mm** (core 865 mm wide; the 1,158 mm overall width is not adopted), **Z −108…420 mm** (core 498 mm tall, centred on the fan axis at Z = 156). The top/bottom tanks, necks and brackets are **labeled placeholders in form** (no GM drawing), but the core envelope is published. The radiator's front face is 6 mm behind the intercooler's rear face. The RH rear tank corner carries an **8 mm deep × 50 mm tall × 15 mm long collar relief** (a shallow external chamfer, not a through-hole), giving the airbox collar **5.35 mm** surface clearance; the radiator AABB is unchanged.

---

## 6. Fan shroud — **IN**

### 6.1 Published evidence

| Attribute | Value as published / visible | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| Upper-shroud fitment | OER **A56217**, “2001–2005 Silverado, Sierra; Upper Fan Shroud; with Diesel Engines” | [Classic Industries A56217](https://www.classicindustries.com/product/A56217.html) | C | **VERIFIED-PUBLISHED** (fitment); dimensions **NOT PUBLISHED** |
| Lower-shroud fitment | Dorman **620-993** listed as a lower shroud for the same family | [PartCatalog Dorman 620-993](https://www.partcatalog.com/products/dorman-620-993-engine-cooling-fan-shroud-lower) | C | **PARTIALLY PUBLISHED** (fitment); dimensions **NOT PUBLISHED** |
| Dorman **620-992** conflict | One catalog lists 620-992 as an **upper** shroud for a **2015 GMC Sierra 3500HD**, “560.1 mm max blade diameter”; another lists it for the 2001–2005 family | [CarParts Dorman 620-992 listing](https://www.carparts.com/details/GMC/Sierra_3500_HD/Dorman/Fan_Shroud/2015/RB620992.html); [Partshawk 620-992](https://partshawk.com/dorman-products-620-992-engine-cooling-fan-shroud.html) | C/D | **CONFLICT** — the 560.1 mm figure cannot be the shipped 424 mm fan; **not adopted**. The spec uses OER A56217 for fitment only and designs to the measured fan |
| Fan shroud diameter / opening | **NOT PUBLISHED** | no vendor dimension table located | N/A | **NOT PUBLISHED** — use the measured shipped fan |
| Shipped fan (design fact) | centre **(0.0, 156.0) mm**, outer radius **212.0 mm**, blades X 570.0–617.8; 9 blades per the M10 record; clutch X 472.0–570.0, radius 68.0 (bound 72.0) | measured from `public/Duramax_LLY_2005_66L_V8.glb`; M10 `frontDrive` record for blade count | repo | **VERIFIED-PUBLISHED (repo measurement)** |
| M10 record conflict | `docs/M10-EXTERIOR.md` §5.1 says fan `r_tip = 245 mm`, hub axis `(0, +178.0)`, clutch X 530.0–570.0; `assets-src/shell_dimensions.json` repeats `fanClutchXMinMm: 530.0` (but publishes `fanOuterRadiusMm: 212.0` and the `(0, 156)` fan pulley). The committed GLB measures centre (0,156), r 212.0, blades 570.0–617.8, clutch 472.0–570.0. | `docs/M10-EXTERIOR.md` §5.1 vs binary GLB parse | repo (conflict) | **CONFLICT — the measured GLB/JSON wins; the M10 doc's 245/178/530 are stale illustrative values** |
| Photo layout | Radiator/condenser stack ahead of the fan; the radiator top tank/upper hose is visible in the close views. **The shroud's broad flat top and circular opening are not directly visible in the cited photos**; the front views look over the stack and the side views are edge-on. | [PHOTO EVIDENCE](#3-photo-evidence--owners-reference-photographs) `IMG_2874`–`IMG_2877` | D | **VERIFIED-VISUAL (layout only; shroud-opening claim downgraded)** |

### 6.2 Verdict and placement basis

**IN.** Model the shroud as a two-piece annular plastic shroud registered to the **measured shipped fan**: centre **(0.0, 156.0) mm**, inner radius **222 mm** (10 mm radial clearance over the 212 mm fan), outer radius **252 mm**, axial span **X 610–650 mm**, mounting flange at the radiator rear face **X = 650 mm**. The shroud's rear lip overlaps the fan's axial span by **7.8 mm** (fan front 617.8 − shroud rear 610), so the **10 mm radial clearance is the load-bearing clearance**; the asset test pins it. The shroud is 40 mm clear of the fan clutch (shroud rear 610 − clutch front 570). The outer diameter and wall are **labeled placeholders**; the registration is measured.

The **Dorman 620-992 / 560.1 mm** listing is recorded as a **fitment conflict and not adopted**. Designing a 560 mm shroud around the shipped 424 mm fan would produce a visibly wrong, over-large shroud; the brief explicitly requires registration against the shipped fan.

---

## 7. Stock intercooler core — **IN** (with an explicit variant reconciliation)

### 7.1 Published evidence

| Attribute | Value as published | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| Stock-size intercooler proxy | **CSF 6007** tube-and-fin aluminum, **core 37.5 × 18.375 × 1.875 in (952.5 × 466.7 × 47.6 mm)**, **3 in (76.2 mm)** inlet/outlet, fits 2001–2005 LB7/LLY | [Full Force Diesel CSF 6007](https://www.fullforcediesel.com/csf-lb7-oe-intercooler-6007); recorded in [`docs/research/M8-variant-references.md`](./M8-variant-references.md) §4 | C | **PARTIALLY PUBLISHED** — OE-replacement maker's stock-size proxy, not a GM dimension; adopted with that caveat |
| LLY intercooler location | Front of the radiator stack, behind the grille/condenser; charge pipes route from the turbo to the core and back to the intake bridge | [PHOTO EVIDENCE](#3-photo-evidence--owners-reference-photographs) (front stack only; core itself hidden); M8 survey §4 | D/A | **VERIFIED-VISUAL** (layout); **no GM mounting coordinates; the core is not directly visible in the owner's photos, so its X 712–760 / Y ±520 / Z −100…410 position is a PHOTO-IMPLIED labeled placeholder, not a measurement** |
| M8 `intercooler_upgraded` position | Bounds **X 80.55–682.00, Y 472.68–696.00, Z −20.00–338.00 mm**, attached at the documented `boostPipe` termination `if_hot_side_inlet = (374.6, 474.8, 146.6)` | [`docs/M8-VARIANTS.md`](../M8-VARIANTS.md) §3, [`docs/M8-MEASUREMENTS.md`](../M8-MEASUREMENTS.md) §1 | repo | **VERIFIED-PUBLISHED (repo)** |
| Stock intercooler dimensions | **NOT PUBLISHED** by GM | searched GM EPC/service and dealer pages | N/A | **NOT PUBLISHED** — the CSF stock-size proxy is the only dimensional anchor |

### 7.2 The conflict the stock core exposes

The stock core's vehicle position is the **front radiator stack, centre of the truck** (X ≈ 712–760 mm, Y centred, Z −100…410 mm in this project frame). **This front-stack position is photo-implied and a labeled placeholder, not a GM mounting datum**: the core is hidden behind the grille/condenser in every cited owner photo. The M8 upgraded intercooler is **not** there: it is a compact representative core at the **LH outboard charge-pipe service point** (X 80.55–682.00, Y 472.68–696.00), 30 mm behind the stock core's rear face and **474.8 mm** outboard of centre. The two envelopes **do not intersect** (minimum X separation 30 mm at Y ≈ 472–520 where they overlap in Y), but they are visibly two different intercoolers.

Adding the stock core to the scene therefore creates three possible policies:

| Policy | Result | Assessment |
| --- | --- | --- |
| **A — stock core only when the intercooler slot is stock** | Hardware is shown in its stock-external context; selecting `intercooler_upgraded` hides the stock core and shows V4 at its frozen service point | **Recommended.** No double core; M8 asset, bounds and RF-8/RF-9 unchanged |
| B — show both | Two intercooler cores in one bay, 30 mm apart in X and overlapping in Y | **Rejected** — visually false and confusing |
| C — move V4 into the stock core position | One core, but the M8 asset, its `if_hot_side_inlet` mating, its published compact envelope and RF-8/RF-9 are all invalidated | **Rejected** — a new M8 asset, not an M14 change |

**M14 adopts A** through the stock-hardware eligibility rule and records it as **Owner Decision OD-2** in the spec. The stock core is modelled at its vehicle position with **inlet/outlet stubs only**: the M10 shell's charge pipe ends at the display service point and does **not** reach the front stack, so M14 does not fabricate a charge-pipe route. This is a recorded limitation, not a silent gap.

**The V2 conflict (found by QA, verified in this revision).** The frozen `intake_highflow` tract (`intake_tract_engine_highflow.glb`, 2,560 triangles, project bounds X −17.98…778.54, Y −639.09…56.13, Z 289.14…547.79) has **14 vertices inside the stock radiator envelope** (X 650–706, Y ±500, Z −108…420) and **6 inside the stock intercooler envelope** (X 712–760, Y ±520, Z −100…410). The airbox hides for V2, but radiator/intercooler have no variant, so a `intake_highflow` + Vehicle state would show the frozen tract through the stock front stack. M14 therefore makes that combination **explicitly unsupported**: V2 active/loaded suspends the Vehicle context (internals visible, all five stock parts withheld) and the UI note says so. This is not a physical claim about a real truck; it is the honest treatment of a representative stock stack that is not shaped around the frozen V2 asset.

---

## 8. Exhaust beyond the downpipe — **IN**

### 8.1 Published evidence

| Attribute | Value as published | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| Stock LLY exhaust | **3.5 in (88.9 mm) turbo-back aluminized exhaust with a catalytic converter and muffler** | DieselPowerProducts 2004.5–05 LLY exhaust guide and BD Power fitment notes, recorded in [`docs/research/M8-variant-references.md`](./M8-variant-references.md) §2 | B/C | **VERIFIED-PUBLISHED** — diameter and system form |
| Stock downpipe | 3.5 in, crushed-oval section for clearance | PPE/Flo-Pro/forum descriptions recorded in the M8 survey §2 | C/D | **PARTIALLY PUBLISHED** — form, not a dimensioned route |
| Stock muffler dimensions | **NOT PUBLISHED**; aftermarket 4 in mufflers are 24 in body / 30 in overall | M8 survey §2 (Diamond Eye/MBRP universal mufflers) | C | **RECORDED-NOT-ADOPTED** — the stock muffler size is unknown; use a labeled placeholder |
| Downpipe exit in the project | **(−222.0, −162.0, −18.0) mm**, **closed 14-vertex / 14-triangle flat cap**, radius **44.45 mm** (≈ 3.5 in), plane normal ≈ **+Z** | welded `02_turbo_downpipe` mesh (405 vertices, 800 triangles, 0 boundary edges) | repo | **VERIFIED-PUBLISHED (repo measurement)** |
| Underside route | Exhaust runs rearward along the frame, over the rear axle, with a single side exit; the reference underside photo is a lifted 2001 GMT800 (layout only) | [PHOTO EVIDENCE](#3-photo-evidence--owners-reference-photographs) `03-underside-rear.jpg`; `INDEX.md` warns it is not stock suspension | D | **VERIFIED-VISUAL** (route only) |

### 8.2 Verdict and placement basis

**IN.** Model a **3.5 in (88.9 mm)** exhaust continuation from the measured downpipe-exit cap: a flange at the exit, a short down-and-rearward bend, a representative **Ø220 × 340 mm** muffler, a tailpipe with an over-axle-style rise and a rolled/slash-cut tip, plus two simple saddle-clamp hanger stubs. The **pipe diameter is published**; the muffler size, hanger positions, tailpipe length and tip flare are **labeled placeholders**. The route is a representative section (centreline tip X = −1,320 mm), not a chassis-verified cat-back: no frame hangers, axle clearance, or tailpipe cutout are claimed. This is the same honest scope M8 used for its 4-inch representative exhaust.

**Defined centreline (mm):** P0 (−222, −162, −18) → P1 (−300, −180, −80) → P2 (−480, −235, −160) → P3 (−750, −235, −160) [muffler inlet]; muffler X −750…−1,090 at (Y −235, Z −110); P4 (−1,090, −235, −110) → P5 (−1,180, −235, −40) → P6 (−1,250, −235, +40) → P7 (−1,320, −235, 0). Pipe r 44.45 throughout. The full part AABB is **X −1,364.45…−161.97, Y −345.0…−101.79, Z −220.0…+84.45** (flange + segments + muffler). The flange plate is Ø120 × 10 mm on the measured normal.

**Ground clearance:** the run is held at Z ≥ −160 mm centreline (pipe bottom −204.45 mm), and the muffler at Z −110 centreline (bottom −220 mm). The studio floor is Z = −245 mm; the smallest exhaust-to-floor clearance is **25.0 mm** at the muffler, above the M10 floor-clearance minimum of 21.4 mm; the pipe floor clearance is **40.55 mm**. The exhaust-to-shell minimum excluding the intended 100 mm exit collar is **58.051 mm** at the segment P0→P1 (nearest shell point (−230.0, −114.9, 72.7)). This is a **planning computation**, re-checked at build.

---

## 9. Dual-generator idler — **OUT**

| Question | Finding | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| Is a dual-generator idler a stock LLY 2500HD part? | **No stock LLY 2500HD dual-generator idler was located.** The owner's 2005 LLY pickup engine-bay photos show one alternator; the M10 front-drive model is a single-alternator 9-pulley layout. A Diesel Place thread titled “No Option for Dual Alternators” corroborates that dual alternators were not a stock pickup option. | [PHOTO EVIDENCE](#3-photo-evidence--owners-reference-photographs); [Diesel Place “No Option for Dual Alternators”](https://www.dieselplace.com/threads/no-option-for-dual-alternators.7429/) (forum, grade D); `docs/M10-EXTERIOR.md` front-drive record | D/A | **NOT PUBLISHED** for the pickup |
| Is there a GM part/RPO drawing? | No GM RPO/part drawing or factory dual-generator idler geometry was located. | searched GM EPC/service/upfitter material | N/A | **NOT PUBLISHED** |
| What exists in the aftermarket? | A **dual-alternator bracket kit** (Mechman) and a Ford 6.0L “dual alternator” idler pulley; neither is a stock LLY 2500HD part. | [Mechman dual-alternator bracket instructions](https://www.mechman.com/content/instructional-pdfs/INSTR-DDB.pdf); [Dayco dual-alt idler for Ford 6.0L](https://dieselpowerproducts.com/products/p-dayco-belt-idlertensioner-pulley-dual-alternators-05-07-ford-60l-11-19-ford-67l-powerstroke) | C/D | **RECORDED-NOT-ADOPTED** — different system, not stock |

**Verdict: OUT.** A factory dual-generator idler is not evidenced for the target 2005 2500HD LLY, and no published geometry exists. Adding an aftermarket dual-alternator bracket would be a modified accessory-drive variant, not stock vehicle-side hardware; it would also require re-routing the M10 belt (frozen) and adding a second alternator that the photos do not show. The item is recorded with this reason in `docs/DECISIONS.md` D-049 and `docs/OPEN_ITEMS.md`; it is not modelled, and no catalog/toggle is added.

---

## 10. Medium-duty oil filler/filter arrangement — **OUT**

| Question | Finding | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| What is the medium-duty arrangement? | The Chevrolet **Kodiak C4500/C5500** (medium-duty) service procedure covers engine oil and oil-filter replacement on the C-series; it is a different chassis/engine-installation package from the 2500HD pickup. | [Chevrolet Kodiak C-Series 2005 engine oil and oil filter replacement](https://gm.saturn.team/Chevrolet/Kodiak_C_Series__Crew__C4_C5/2005/50/99/4130/121579) | A (service procedure) | **VERIFIED-PUBLISHED** (different chassis) |
| Is it the target vehicle? | **No.** The target is a 2005 Silverado 2500HD pickup; the M10 shell already models the pickup oil-fill neck/cap and the pickup fuel-filter head. | [`docs/PLAN.md`](../PLAN.md) target; `docs/M10-EXTERIOR.md` oilFill/fuelFilter groups | A/repo | **OUT of target scope** |
| Published medium-duty filler/filter dimensions | Not needed for M14; no LLY pickup geometry is defined by the C-series arrangement. | — | — | **NOT ADOPTED** |

**Verdict: OUT.** The medium-duty oil filler/filter arrangement belongs to the C4500/C5500 chassis, not the 2005 2500HD pickup. Modelling it on a 2500HD would be a fabricated installation. The pickup's oil fill and fuel filter are already in the M10 shell; M14 does not add a medium-duty variant. Recorded in D-049 and OPEN_ITEMS.

---

## 11. Per-part verdict table

The brief names four in-scope groups (airbox/routing, radiator + fan shroud, intercooler core, exhaust) plus two smaller OPEN_ITEMS entries. The table splits the radiator and shroud so each placement basis is explicit; the “brief item” column maps back to the six requested items.

| # | Brief item | Part | Verdict | Placement basis | Recorded reason / limitation |
| ---: | --- | --- | --- | --- | --- |
| 1 | Airbox + intake routing | **Airbox body/lid/snorkel + outlet collar** | **IN** | 70 mm outlet collar at measured `if_airbox_mount` (587.4, −510.5, 371.9) into a body inlet boss; body outboard on RH front, X 600–800, Y −820…−560, Z 240–520; group AABB X 566.52–860, Y −820…−470.61, Z 240–520; existing M10 intake duct is the routing to the turbo | Planform/dimensions **NOT PUBLISHED** → labeled placeholder; filter not modelled; collar/boss intended mate |
| 2 | Radiator + fan shroud | **Radiator** | **IN** | Core/tank envelope X 650–706, Y ±500, Z −108…420, from the published Mishimoto direct-fit replacement core (865.1 × 498.1 × 55.9 mm); RH rear-corner 8 mm collar relief | GM stock core dimensions **NOT PUBLISHED**; replacement envelope adopted with caveat; overall 1,158 mm width **not adopted**; mounts/hoses not modelled |
| 3 | Radiator + fan shroud | **Fan shroud** | **IN** | Centre (0, 156), inner radius 222, outer 252, X 610–650; 10 mm radial clearance over the measured 212 mm fan; flange at radiator rear X 650 | Shroud dimensions **NOT PUBLISHED**; designed to the shipped M10 fan; Dorman 620-992 560.1 mm listing **not adopted**; no fan contact |
| 4 | Stock intercooler core | **Stock intercooler core** | **IN** | Core envelope X 712–760, Y ±520, Z −100…410 in the **photo-implied front-stack placeholder position**, front of radiator; core 952.5 × 466.7 × 47.6 mm from the CSF 6007 stock-size proxy, 3 in inlet/outlet | GM dimensions **NOT PUBLISHED**; core hidden in photos; position not a GM datum; charge pipes not modelled; V4 remains at its service point; stock-only eligibility (OD-2) |
| 5 | Exhaust beyond downpipe | **Exhaust continuation** | **IN** | Flange over the measured closed downpipe cap (−222, −162, −18), 3.5 in pipe, representative Ø220 × 340 mm muffler; AABB X −1,364.45…−161.97, Y −345.0…−101.79, Z −220.0…+84.45 | Diameter published; muffler/hanger/tip dimensions **NOT PUBLISHED** → placeholders; route defined; representative section, not a chassis-verified cat-back |
| 6 | Dual-generator idler | **Dual-generator idler** | **OUT** | — | No stock LLY 2500HD fitment/part/RPO drawing located; aftermarket dual-alternator systems are not stock; would open the frozen front-drive/belt layout. Recorded in D-049/OPEN_ITEMS. |
| 7 | Medium-duty oil filler/filter | **Medium-duty oil filler/filter arrangement** | **OUT** | — | C4500/C5500 medium-duty chassis, not the 2500HD pickup; pickup oil fill/fuel filter already in the M10 shell; modelling it on the 2500HD would be fabricated. Recorded in D-049/OPEN_ITEMS. |

---

## 12. What cannot honestly carry a design value

| Item | Status | M14 treatment |
| --- | --- | --- |
| Airbox planform, lid, snorkel, filter | **NOT PUBLISHED** | Labeled placeholder sized from the measured mount + photo layout; filter omitted (inside an opaque box); 70 mm collar + body boss are the measured mate/design bridge |
| Airbox/intake-duct stock diameter | **NOT PUBLISHED** | Existing M10 duct is frozen and used as-is; M14 adds only the airbox outlet collar |
| Radiator core/stock dimensions | **NOT PUBLISHED** by GM | Mishimoto direct-fit replacement core adopted, grade C, explicitly “replacement, not GM stock”; overall width not adopted |
| Radiator mounts, hoses, fan stator | **NOT PUBLISHED** | Not modelled; the hardware is a representative front-stack assembly, not a verified installation |
| Fan shroud dimensions | **NOT PUBLISHED** | Designed to the measured shipped fan (centre/radius); outer diameter and wall are placeholders |
| Stock intercooler dimensions | **NOT PUBLISHED** by GM | CSF 6007 stock-size proxy, grade C; inlet/outlet stubs only; charge pipes not modelled |
| Stock intercooler mounting coordinates and front-stack position | **NOT PUBLISHED** | Front-stack position derived from layout, not a GM datum; **photo-implied labeled placeholder**; the core is hidden in the owner's photos |
| Exhaust muffler/tailpipe/hangers | **NOT PUBLISHED** | Representative dimensions on a defined centreline; not a chassis-verified cat-back |
| Dual-generator idler | **NOT PUBLISHED / no stock fitment** | OUT; no geometry |
| Medium-duty oil filler/filter | Different chassis | OUT; no geometry |
| Photo-derived dimensions | Not measurable | Never used as a measurement; layout only |

---

## 13. Summary — what can honestly carry a design value

| # | Item | Verdict | M14 action |
| ---: | --- | --- | --- |
| 1 | Airbox + intake routing | **IN** | Model airbox at the measured `if_airbox_mount`; reuse frozen M10 intake duct; placeholders for the box |
| 2 | Radiator | **IN** | Model at X 650–706 using the published replacement core; placeholders for tanks/mounts/hoses |
| 3 | Fan shroud | **IN** | Register to measured fan (0, 156, r 212); inner 222, outer 252; 10 mm radial clearance |
| 4 | Stock intercooler core | **IN** | Model at the **photo-implied front-stack placeholder** X 712–760; stock-size proxy; stock-only (OD-2); no double core with V4; the `intake_highflow` + Vehicle combination is unsupported |
| 5 | Exhaust beyond downpipe | **IN** | Model from measured downpipe exit (−222, −162, −18); 3.5 in pipe; representative muffler/tailpipe |
| 6 | Dual-generator idler | **OUT** | No stock fitment/geometry; recorded reason |
| 7 | Medium-duty oil filler/filter | **OUT** | Different chassis; recorded reason |

**Bottom line:** the stock front-end hardware can be modelled as a **single low-detail scene-placed assembly** anchored to measured shell datums, with the radiator/intercooler using published replacement/proxy dimensions and the airbox/shroud/exhaust cosmetics labeled placeholders. The stock intercooler's **photo-implied** front-stack position and the M8 upgraded intercooler's outboard service point are **different installations**; M14 resolves this by making the hardware a stock-only Vehicle context, recorded as an owner decision. The frozen V2 high-flow tract overlaps that stock front stack (14 radiator / 6 intercooler vertices), so the `intake_highflow` + Vehicle combination is explicitly unsupported rather than rendered as an intersection. The dual-generator idler and medium-duty oil filler/filter are explicitly **OUT** with reasons, not silently omitted.

---

## Sources

- Owner reference photographs: `colinstephens93/sandboxforgamedev`, `reference/` — <https://github.com/colinstephens93/sandboxforgamedev>; cloned at `~/projects/sandboxforgamedev`; **viewed in the 2026-11-17 revision run**: `IMG_2874.jpeg`–`IMG_2877.jpeg`, `02-engine-bay-driver-side.jpg`, `03-underside-rear.jpg`, `manuals/lly-engine-compartment-diagram.png`; `reference/INDEX.md`, `reference/duramax-2005-photo-notes.md`. **PHOTO EVIDENCE for layout/routing only, never measurements.**
- Shipped assets and code: `public/Duramax_LLY_2005_66L_V8.glb`; `assets-src/shell_dimensions.json`; `src/renderer/engineScene.ts`; `src/renderer/viewLayout.ts`; `src/renderer/sectionCaps.ts`; `src/ui/referenceFrames.ts`; `docs/M10-MEASUREMENTS.md`; `docs/M11-MEASUREMENTS.md`; `docs/M12-MEASUREMENTS.md`; `docs/M13-MEASUREMENTS.md`.
- Radiator: Mishimoto `MMRAD-DMAX-01` direct-fit listing, tech specs overall 45.6 × 20.8 × 5.4 in, core 34.06 × 19.61 × 2.2 in, 2 rows, inlet/outlet 1.89 in: <https://www.mishimoto.eu/fits/chevrolet/silverado-2500-hd/p/MMRAD-DMAX-01/chevy-gmc-6-6l-duramax-aluminium-radiator-01-05.html> (grade C).
- Fan shroud: OER `A56217` upper-shroud fitment for 2001–2005 diesel: <https://www.classicindustries.com/product/A56217.html> (grade C; no dimensions). Dorman `620-993` lower-shroud listing: <https://www.partcatalog.com/products/dorman-620-993-engine-cooling-fan-shroud-lower> (grade C; no dimensions). Dorman `620-992` 2015 3500HD / 560.1 mm conflict: <https://www.carparts.com/details/GMC/Sierra_3500_HD/Dorman/Fan_Shroud/2015/RB620992.html> (grade C/D; **not adopted**).
- Air cleaner/filter: Tubman GM Parts Depot `25873812` for a 2004 Silverado 3500 6.6L Duramax diesel: <https://www.tubmangmpartsdepot.ca/p/Chevrolet_2004_Silverado-3500-Base-Crew-Cab-Pickup-Fleetside-66L-Duramax-V8-DIESEL-MT-4WD/Air-Cleaner-Housing-Front/48203372/25873812.html>; GMPartsDirect `25873812` <https://www.gmpartsdirect.com/oem-parts/gm-air-cleaner-25873812> (Cloudflare-blocked on fetch; listing title recorded); ACDelco `A3087C` 2001–2005 LB7/LLY filter <https://dmaxstore.com/products/acdelco-air-filter-2001-2005-lb7-lly-duramax> (grade C).
- Intercooler stock-size proxy: CSF `6007` listing, core 37.5 × 18.375 × 1.875 in, 3 in inlet/outlet: <https://www.fullforcediesel.com/csf-lb7-oe-intercooler-6007>; recorded in [`docs/research/M8-variant-references.md`](./M8-variant-references.md) §4 (grade C).
- M8 upgraded intercooler position/bounds: [`docs/M8-VARIANTS.md`](../M8-VARIANTS.md) §3, [`docs/M8-MEASUREMENTS.md`](../M8-MEASUREMENTS.md) §1.
- Exhaust: 3.5 in stock turbo-back and muffler sources recorded in [`docs/research/M8-variant-references.md`](./M8-variant-references.md) §2 — DieselPowerProducts LLY exhaust guide <https://dieselpowerproducts.com/collections/c-286-20045-05-66l-lly-gm-duramax-exhaust-kits>, BD Power exhaust-brake fitment <https://www.xtremediesel.com/bd-power-duramax-exhaust-brake>, Diamond Eye/MBRP muffler listings (grade B/C; stock muffler dimensions not published).
- Dual-generator: Diesel Place “No Option for Dual Alternators” <https://www.dieselplace.com/threads/no-option-for-dual-alternators.7429/> (forum, grade D); Mechman dual-alternator bracket instructions <https://www.mechman.com/content/instructional-pdfs/INSTR-DDB.pdf> (aftermarket, grade C); Dayco dual-alternator idler for Ford 6.0L <https://dieselpowerproducts.com/products/p-dayco-belt-idlertensioner-pulley-dual-alternators-05-07-ford-60l-11-19-ford-67l-powerstroke> (different engine, grade D). No GM LLY pickup dual-generator part/RPO drawing located.
- Medium-duty: Chevrolet Kodiak C-Series 2005 engine oil and oil filter replacement <https://gm.saturn.team/Chevrolet/Kodiak_C_Series__Crew__C4_C5/2005/50/99/4130/121579> (GM service procedure, grade A).
- Prior project records: [`docs/PLAN.md`](../PLAN.md); [`docs/DECISIONS.md`](../DECISIONS.md) D-033/D-038/D-041/D-042/D-046/D-048; [`docs/OPEN_ITEMS.md`](../OPEN_ITEMS.md); [`docs/ASSET_CONTRACT.md`](../ASSET_CONTRACT.md); [`docs/research/M8-variant-references.md`](./M8-variant-references.md); [`docs/research/M10-exterior-accuracy-survey.md`](./M10-exterior-accuracy-survey.md).
