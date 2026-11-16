# M13 Research Survey — Internal-Part Visual Variants

Project: Duramax LLY Engine Lab · Planning package: this survey + [`docs/specs/M13-internal-variants.md`](../specs/M13-internal-variants.md) · Governing plan: [`docs/PLAN.md`](../PLAN.md) (post-M12 candidates line) · Prior decisions re-tested: **D-038** (M8 internal-parts position), **D-044** (cam lobe lift), **D-046** (M12 scene-placed cosmetic add-on), **D-047** (M12 build deviation / proof-frame lesson).

Researched 2026-11-16 on branch `plan/m13-internal-variants` from `main` @ `8394f1f` (M0–M12 complete). **Access mode: repository code + binary GLB inspection + HTML/text web sources.** No physical LLY, no measured aftermarket part, and no GM dimensioned drawing were available. Every dimension below is either (a) read from the shipped GLB/config, (b) quoted from a named publication, or (c) explicitly marked **NOT PUBLISHED** and proposed as a labeled placeholder.

**Reliability grades** follow the L7 / M10 / M12 precedent:

| Grade | Meaning |
| --- | --- |
| **A** | GM service/workshop literature, GM owner literature, or an official GM parts catalog |
| **B** | Established diesel publication, OE component maker documentation, or a published engineering bulletin |
| **C** | Specialist vendor fitment/technical page, or specialist parts catalog publishing dimensions its parts must match |
| **D** | Forum post, marketing page, auction/photo listing — corroboration or colour only |
| **N/A** | Searched and absent — no credible publication located |

**Verdicts:** **VERIFIED-PUBLISHED** (usable as a design fact or value); **VERIFIED-VISUAL** (the feature is legible in published photographs/illustrations but has no dimensional specification); **PARTIALLY PUBLISHED** (published but incomplete); **RECORDED-NOT-ADOPTED** (true but not precise enough to pin geometry); **NOT PUBLISHED** (searched and absent — the spec must use a labeled placeholder); **CONFLICT** (sources disagree; both shown).

---

## 1. What this survey had to answer

The M13 brief names five catalog entries with `modelPath: null` and no 3D visual: `rods_forged`, `injectors_plus30`, `cp3_stroker`, `cam_performance`, `heads_ported`. Four change performance numbers; `rods_forged` is a durability part with an empty `performanceParams` set. M8 recorded all five as out of scope under **D-038**, each with a reason. This survey treats every D-038 reason as a **hypothesis to re-test against the current shipped code and geometry**, not as a settled answer, and asks five questions per entry:

1. **What geometry actually ships today?** File, contract node(s), triangle count, material count, bounds, instance count, scene placement, and cap-source status. This is measured from the committed GLBs and the renderer code, not from the M8 prose.
2. **What does the catalog actually change?** The exact `performanceParams` delta and the entry's notes — because a visual variant must represent the catalog's change, not a different upgrade.
3. **What does the published record actually say?** A visible shape/feature delta, a dimensional anchor, or nothing. Each source is graded.
4. **Does the current scene make a truthful swap possible?** M8's rule had three tests: (a) a visible geometry change, (b) the part's swappable geometry already exists (pivot-placed model + mount), (c) a truthful illustrative shape can be derived. M13 re-tests all three against the M10/M11/M12 scene.
5. **If the answer is no, what is the recorded no-visual reason — and is it still the same reason M8 gave?** A no-visual outcome is a first-class result, not a failure to plan.

A sixth question is repo-side and is answered in the spec's measured self-check: what the five entries would cost at full-engine scene level if they were visual, and what the current D-033 headroom actually is. This survey establishes what the external sources and the shipped geometry do and do not say; the spec does the multiplication.

**Bottom line in advance:** one of the five D-038 reasons is **partially overturned** (rods — **one grade-C vendor** describes a *thicker-flanged* H-beam with different fasteners, not a material-only change; the 12-point fastener is an illustrative placeholder, not published), one has a **cured premise but the same conclusion** (CP3 — the M10 shell now contains swappable CP3 geometry, but no source publishes an external housing difference; the identity is inferred, not measured), and three stand as recorded (injectors, cam, heads), with the cam requiring an explicit owner decision about valve kinematics. The two tunes and the stock-only fuel rail are confirmed visual-less. The 24-entry catalog is closed by this disposition, not by inventing geometry for the four no-visual entries.

---

## 2. Shipped geometry inventory (measured this session)

### 2.1 Method

- Binary GLB parse of every committed asset (JSON chunk + BIN chunk, node world matrices, accessor counts, position bounds), the same read-back style as `src/assets/variantAssets.test.ts` / `src/renderer/shellAssets.test.ts`.
- Renderer instance counts and cap-source registration read from `src/renderer/engineScene.ts` (lines cited where load-bearing).
- Scene totals recomputed from the GLB triangle counts and the code's instance multipliers, then cross-checked against the M11/M12 measured baselines. Runtime draw calls, VRAM and frame time were **not** re-measured (no WebGL in this VM; §11).

### 2.2 Internal parts

| Part / slot | Committed GLB / node(s) | Primitives | Tris per instance | Instances in scene | Scene tris | Cap source today |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Piston / `pistons` | `rot_piston_c1_stock.glb` → `rot_piston_c1_stock` | 3 | 4,832 | 7 standard + 1 firing | 38,656 | dynamic `piston_std` / `piston_firing`; M8 variant sets pre-built |
| Rod / `rods` | `rot_conrod_c1_stock.glb` → `rot_conrod_c1_stock` + child `rot_conrod_smallend_c1_stock` | 2 + 1 | **1,180** (892 + 288) | **8** | **9,440** | dynamic `conrod` (instanced, 8) |
| Crank throw / — | `rot_crankthrow_c1_stock.glb` → `rot_crankthrow_c1_stock` + `rot_crankpin_c1_stock` | 1 + 1 | 1,352 | 4 (shared pins) | 5,408 | dynamic `crankthrow` |
| Head / `heads` | `sta_head_c1_stock.glb` → `sta_head_c1_stock` | 2 | **3,532** | **8** | **28,256** | static `head` (instanced, 8) |
| Injector / `injectors` | `fuel_injector_c1_stock.glb` → `fuel_injector_c1_stock` | 2 | **924** | **8** | **7,392** | static `injector` (instanced, 8) |
| Intake valve + spring / — | `val_valve_intake_stock.glb` → `val_valve_intake_stock`, `val_spring_intake_stock` | 1 + 1 | 1,040 + 3,464 | 16 + 16 | 72,064 | dynamic valve; spring hull-only |
| Exhaust valve + spring / — | `val_valve_exhaust_stock.glb` → `val_valve_exhaust_stock`, `val_spring_exhaust_stock` | 1 + 1 | 1,040 + 3,464 | 16 + 16 | 72,064 | dynamic valve; spring hull-only |
| Bridge / — | `val_bridge_stock.glb` → `val_bridge_stock` | 1 | 408 | 16 | 6,528 | dynamic `bridge` |
| Rockers / — | `val_rocker_stock.glb` → `val_rocker_intake_stock`, `val_rocker_exhaust_stock` | 1 + 1 | 620 each | 4 × 4 (RH/LH chiral) | 9,920 | dynamic 4 batches |
| Pushrod + lifter / — | `val_pushrod_stock.glb` → `val_pushrod_stock`, `val_lifter_stock` | 1 + 1 | 840 + 432 | 16 + 16 | 20,352 | dynamic |
| **Internal total** | | | | | **270,080** | 26 instanced meshes + main shaft (1,080) + ground (64) |

The internal total reproduces the shipped `270,080` exactly: `4,832×8 + 1,180×8 + 1,352×4 + 3,532×8 + 924×8 + 1,040×16 + 3,464×16 + 1,040×16 + 3,464×16 + 408×16 + 620×4×4 + 840×16 + 432×16 = 270,080`. With the main shaft (`1,080`), ground (`64`) and the M10 exterior shell (`37,100`), the stock scene is **308,324** triangles. The M8 worst case (five visual variants, exterior on) is **304,632** by the documented arithmetic `308,324 − 6,912 − 6,500 + 9,720`; both were re-derived from the committed GLBs this session and match the M11/M12 recorded values.

### 2.3 The five target entries today

| Entry | Slot | `modelPath` | Catalog delta vs stock | Shipped geometry actually present |
| --- | --- | --- | --- | --- |
| `rods_forged` | `rods` | **null** | `performanceParams: {}` — no steady-state number changes | Stock conrod GLB only (1,180 tris × 8, H-beam, 3 materials) |
| `injectors_plus30` | `injectors` | **null** | `maxFuelMm3` 120 → 156 (+30%) | Internal injector GLB (924 tris × 8) + shell `injectors` group (2,100 tris: 8 bodies, 8 connectors, return line) |
| `cp3_stroker` | `cp3` | **null** | `flowBaseKgH` 30 → 42, `flowSlopeKgHPerRpm` 0.022 → 0.030, `maxRailPsi` 23,000 unchanged | Shell `cp3Fuel` group only (1,400 tris: `ext_cp3` 380, `ext_fca` 180, `ext_hp_rails` 300, `ext_hp_lines` 540); no pivot-placed model |
| `cam_performance` | `camshaft` | **null** | `veFactor` 1.0 → 1.04 | **No camshaft geometry at all** — the modelled valvetrain starts at the lifters; `camshaft_stock` is also null |
| `heads_ported` | `heads` | **null** | `flowFactor` 1.0 → 1.08 | Stock head-section GLB (3,532 tris × 8) + shell `heads` group (1,600 tris); no ports modelled |

### 2.4 The stock rod geometry, inspected (source and GLB)

This is the M13 entry whose D-038 reason depends most on what the shipped rod actually is, so it was inspected twice: in `assets-src/blender/build_cylinder1.py` (`build_conrod`, lines 455–582) and in the committed GLB.

- **Construction:** a big-end housing/cap around the crankpin (`r = 31.45 mm` bore, `42.14 mm` outer), a small-end eye (`r = 17.25 mm` bore, `23.81 mm` outer), and a **tapered H-beam shank** — a central web (`web_half_x = 0.32 × axial_half_w = 4.428 mm`) plus two tapered flanges (`flange_thick_y = 0.20 × big_r = 6.288 mm`, outer `y_big_flange = 0.62 × big_outer_r = 26.129 mm`), with big-end bolt ears and two cap bolts. The code calls it an H-beam; the GLB cross-section is consistent with an H (two flanges + central web).
- **Triangle count:** 1,180 per rod (892 rod + 288 small-end bushing), 3 mesh primitives, 3 `MeshStandardMaterial`s (`mat_conrod_forged_steel`, `mat_conrod_bolts`, `mat_conrod_bushing`).
- **Bounds (project frame, mm):** X `−13.838…+13.838` (big-end axial width **27.676 mm**), Y `−48.725…+48.725` (the bolt ears dominate; the beam flange reaches only `±26.129`), Z `−42.143…+186.805` (big-end cap below the origin, small-end eye top at `163.0 + 23.805`).
- **Pivot:** big-end bore axis at `(0, 0, 0)`; the small-end child sits at `(0, 0, 163.0)` — the published 163.0 mm centre-to-centre rod length (D-035, GM LLY service table).
- **Documentation inconsistency found:** `docs/M7-DATA.md` §3 calls the procedural rod an "I-beam" in one register row, while `assets-src/PROVENANCE.md` and the build code call it a **forged H-beam**. The geometry confirms the H-beam; the M7 phrase is stale wording, not a different asset. Recorded here so the M13 spec does not inherit the ambiguity.

**D-038's rod premise re-test:** "material-only change, stock rod already modeled as a forged H-beam." The second half is **confirmed** (the GLB is an H-beam). The first half is **not fully supported**: **one grade-C vendor** (Callies Compstar Xtreme) explicitly describes a shape change — *"Strength is added by thickening up the flanges of the H beam and a reduced depth of cut towards the center of the rod. Then non-essential weight is taken out of the beam…"* (§3). This is a **single weak source**, and the catalog entry is generic. The **magnitudes** of that change are not published, so any variant must keep the stock interface dimensions and label the flange/web magnitudes and the 12-point fastener as placeholders.

### 2.5 The injector geometry, inspected

- **Internal injector GLB:** 924 tris, 2 primitives, 2 materials (steel body + dark polymer solenoid top). A revolved stepped body from `z = −2.16 mm` (nozzle tip below the deck) to `z = +120 mm`; the tip is a smooth `0.26–0.30 × inj_r` cone. **No nozzle holes are modelled.** The external body is a generic stepped common-rail injector; there is no feature that corresponds to +30% flow.
- **Shell injectors:** 8 × `ext_injector_*` (140 tris each) + 8 × `ext_inj_connector_*` (90 each) + `ext_inj_return_line` (260) = **2,100 tris**. These are the visible injectors proud of the valve covers; they are generic bodies with connectors and a return line. The shell is fused by material, and the `injectors` group is not split into preserved subtrees today (no `EXTERIOR_PRESERVED_SUBTREES` entry).
- **Published flow evidence:** the LLY nozzle is a **7-hole SAC** nozzle (L7 §12, grade B/C); hole diameter is **not published** (a 0.155 mm vendor candidate and a 0.15 mm forum figure were found in the cross-check, both below the project's verified bar and explicitly not adopted — `docs/research-crosscheck/RECONCILIATION.md` item 11). A +30% flow change is nozzle work; the external injector body is a remanufactured stock Bosch body in the aftermarket examples inspected (Exergy "Reman … 45% Over" page: *"The nozzles are enlarged using abrasive flow honing technology… installed back onto the injector… remanufactured by Bosch"*, grade C; §4).
- **Visibility consequence:** a nozzle-hole change at ~0.155 mm is far below the app's rendered feature scale and is not visible in the external body. The internal injector's tip is inside the head; even a cutaway would show the solid revolved body, not a hole pattern. There is no honest external or internal visual signature in the shipped geometry.

### 2.6 The CP3 / fuel-system geometry, inspected

- **Shipped placement:** `cp3Fuel` is a top-level shell group (`1,400` tris) with four leaves: `ext_cp3` (380 tris; bounds X 350…452, Y −68.7…52.7, Z 162…268 mm), `ext_fca` (180 tris; the fuel-control actuator), `ext_hp_rails` (300 tris; two valley rails), `ext_hp_lines` (540 tris; eight formed lines). It is **scene-placed project-frame geometry at its final mounted position**, loaded with the M10 shell, not a pivot-placed catalog model. The shell loader can preserve a whole top-level group or a direct child by index (`ExteriorPreservedSubtreeSpec`), so a `cp3Fuel` child split is technically possible — unlike M8.
- **M8 premise re-test:** D-038 said "at M8 no swappable pivot-placed model existed." That is **true at M8 but false now**: the M10 shell added `ext_cp3` and `ext_fca`, and the loader can isolate `ext_cp3` by child index `0` without touching the shell GLB. The premise is **cured**. The **conclusion still stands** for a different reason: the stroker's published difference is an internal cam-ring stroke, and no source publishes an external housing difference — the external identity is **inferred from the replacement listing, not measured**. A swap would show the same housing with a different name — a fabricated visual delta.
- **Published stroker evidence:** the LLY 10 mm stroker CP3 is sold as an **LBZ-based replacement pump with an LLY fuel-pressure regulator**, listing the stock Bosch/GM part numbers it replaces (Exergy E04 10206, grade C; §5). No source publishes an external housing dimension or a visible external difference between the stock LLY CP3 and the stroker; the published difference is flow/cam-ring stroke. The catalog's `flowBaseKgH` / `flowSlopeKgHPerRpm` change is a steady-state flow parameter, not an external shape.

### 2.7 The camshaft, inspected

- **No camshaft geometry exists.** `build_cylinder1.py` builds the piston, rod, crank throw, head section, valves/springs, pushrod + lifter, rockers, bridge, injector and the axis fixture; there is no cam builder. The valvetrain model starts at the lifters (`val_lifter_stock`), and `camshaft_stock` / `cam_performance` both have `modelPath: null`.
- **Published stock data (D-044):** GM LLY production lobe lift **7.273 mm intake / 5.907 mm exhaust**; rocker ratios **1.36:1 / 1.69:1**; derived valve lift **9.891 mm / 9.983 mm** (stored 9.9 / 10.0 mm). Duration, LSA and IVO/IVC/EVO/EVC remain **NOT PUBLISHED** (L7 §4, cross-check §4c).
- **Performance-cam data:** aftermarket grinds publish their own duration/lift (e.g. a Stage 2 listing at **0.450 in lift (lobe vs valve unstated), 258/268 duration**, grade C; §6), but those are different grinds, not the stock LLY profile and not the catalog's generic `veFactor 1.04`. The listing says only `Lift: .450 Intake / .450 Exhaust`, `Duration: .258 Intake / .268 Exhaust`, and recommends `.080` piston valve relief; it does **not** say whether `.450` is lobe or valve lift. If it is **lobe** lift (the worst-case assumption), `11.43 × 1.36 = 15.54 mm` intake and `11.43 × 1.69 = 19.32 mm` exhaust valve lift follow. Applying the full max-lift increase at the stock minimum-clearance angle gives a **bounding estimate** of **−3.84 mm / −6.34 mm** against the stock **1.797 / 2.979 mm** minima; it is **not a computed kinematic clearance** (the stock minimum is not at max lift), and if `.450` is valve lift the rocker ratios do not apply. The vendor's `.080` relief recommendation still supports "not a drop-in; needs relief".
- **The kinematics question:** a camshaft rotates at half crank speed and is the mechanical source of valve lift. A visual cam that rotates but does not drive the existing `sin²` valve-lift curve would be mechanically dishonest; a cam that does drive it requires opening the frozen `src/core/kinematics.ts` / `valveConfig.ts` and a published duration/timing profile that does not exist. This is the explicit owner decision drafted in the spec (OD-1); M13 does **not** silently add a decorative cam.

### 2.8 The head geometry, inspected

- **Head GLB:** `sta_head_c1_stock.glb`, 3,532 tris, 2 primitives/materials. It models an architectural head section: deck block, four seat rings and valve guides, spring seats, a central injector bore, and a split rocker shaft/pedestals. It does **not** model intake or exhaust ports, port runners, or port bowls. The shell `heads` group (1,600 tris) is an external slab with exhaust-port stubs; it also has no internal port passages.
- **Published port data:** the L7 survey §10 found **no LLY head dimensioned drawing, port shape, port volume or flow bench data**; the cross-check agrees. A PPE CNC-ported head listing describes the process but publishes no port dimensions (grade C; §7). Porting is internal by definition; no source publishes an external-casting difference, and the external identity is **inferred from the casting listing, not measured**.
- **Visibility consequence:** there is no external or internal port surface in the shipped geometry to make "ported" visible. Adding a guessed port shape only to the variant would also imply the stock head has no ports — a false stock-vs-modified difference. No honest visual.

### 2.9 Tunes and fuel rail

- `tune_tow` and `tune_performance` are **ECM software calibrations**: `performanceParams` are fuel-request/boost/AFR/EGT tables; `modelPath: null`; no geometry exists or is implied. They stay visual-less.
- `fuelRail_stock` is a **stock-only** slot (`fuelRail` has no modified entry); rail volume and pressure droop are transient properties outside the steady-state model. It is visual-less and is not a variant candidate.
- The `tune` slot's two modified entries are the only remaining modified entries besides the five internal ones; confirming them closes the modified catalog.

---

## 3. `rods_forged` — evidence and the proposed visual

### 3.1 Published evidence

| Attribute | Value as published | Source | Kind | Grade | Verdict |
| --- | --- | --- | --- | --- | --- |
| Stock rod length | **163.0 mm (6.42 in)**, centre-to-centre basis inferred | GM 2006 Silverado 2500 LLY service manual, "Engine General Specifications & Service Limits", Connecting Rod ([scanned table](https://charm.li/images/DM13Q313/gm60/320362526/)) | GM service literature | A | **VERIFIED-PUBLISHED** (length); centre-to-centre basis **PARTIALLY PUBLISHED** (aftermarket 6.418 in c2c corroborates) |
| Stock rod journal | **62.902–62.922 mm** production range | same GM table | GM service literature | A | **VERIFIED-PUBLISHED** |
| Stock wrist pin | **34.495–34.5 mm** production range | GM LLY table, Pistons and Pins ([scanned table](https://charm.li/images/DM13Q313/gm60/320392819/)) | GM service literature | A | **VERIFIED-PUBLISHED** |
| Two rods per journal | Yes — rods are used "in matching sets of 8" and the chamfered large-end faces must face away from each other on a common journal | AERA Technical Committee bulletin, "Revised Connecting Rod Design on 2001-2017 GM 6.6L Duramax Diesel Engines" ([PDF](http://engineprofessional.com/TB/TB031417-2.pdf)) | engineering bulletin | B | **VERIFIED-PUBLISHED** |
| Aftermarket rod construction | **4340 forged H-beam**, **ARP L19 fasteners**, 6.418 in centre-to-centre, 2.480 in rod journal, 34.5 mm pin, typical weight **1,182 g** | [Callies Compstar Xtreme listing](https://ddsrubicon.com/i-30559441-callies-compstar-xtreme-connecting-rods-rated-for-1000hp-set-of-8-2001-2016-gm-6-6l-lb7-lly-lbz-lmm-lml.html) | specialist vendor | C | **VERIFIED-PUBLISHED** (vendor data) |
| Aftermarket shape delta | *"Strength is added by thickening up the flanges of the H beam and a reduced depth of cut towards the center of the rod. Then non-essential weight is taken out of the beam…"* | same Callies listing | specialist vendor | C | **PARTIALLY PUBLISHED** — qualitative shape change; no dimensions |
| Stock-matching aftermarket big-end width | **1.119 in (28.4 mm)** big-end width; 2.476 in journal | BoostLine `GM6418-358S` stock-replacement rod, as recorded in [L7 §1](./L7-verified-data-survey.md) | specialist vendor | C | **PARTIALLY PUBLISHED** (vendor stock-matching, not GM) |
| Manley alternative | 6.417 in centre-to-centre, **I-beam** | Manley Pro Series listing as recorded in [L7 §1](./L7-verified-data-survey.md) | specialist vendor | C | **RECORDED-NOT-ADOPTED** — the shipped rod is an H-beam; the catalog does not specify beam type, and mixing beam types would be a different visual claim |

### 3.2 What the evidence supports

The evidence supports a **qualitative** shape family: a heavier H-beam with **thicker/wider flanges** and a **thicker central web** ("reduced depth of cut"), plus ARP L19 fasteners. It does **not** support exact flange thickness, flange outer width, web thickness, a 12-point bolt-head geometry, or a specific aftermarket part's silhouette; the 12-point profile is an **illustrative placeholder**. The stock interface dimensions are published or model-derived and must be preserved:

- centre-to-centre **163.0 mm**;
- big-end bore **62.9 mm** (the model uses `pinJournalDiameterMm`);
- wrist pin **34.5 mm**;
- **27.676 mm** big-end axial width — the stock model's `0.44 × 62.9 mm` value (stock model/code-derived, not a published GM width); it preserves the **0.724 mm inter-rod gap** on the shared pin (`2 × 14.2 − 27.676`). The published stock-matching 28.4 mm aftermarket width is **not adopted** because it would close that gap to 0.0 mm.

### 3.3 Proposed visual (for the spec)

A part-local `rot_conrod_c1_forged.glb`, dropped into the eight instanced conrod slots, with:

- the stock 163.0 / 62.9 / 34.5 mm interface and the stock **27.676 mm** big-end axial width;
- an H-beam shank with **wider flanges** (`y_big_flange` 26.129 → 30.343 mm, +4.214 mm per side at the big end; `y_small_flange` 16.187 → 18.568 mm at the small end), **thicker flanges** (6.288 → 8.177 mm), and a **thicker web** (`web_half_x` 4.428 → 5.258 mm);
- a stepped **12-point** cap-fastener profile within the stock bolt-ear envelope (outer Y `±48.725` unchanged) — **illustrative placeholder, not published**;
- the same three-material family (forged steel, dark fasteners, bronze small-end bushing), no textures.

The exact flange/web magnitudes are **labeled placeholders**, not published aftermarket dimensions. The variant is a **clearly labeled illustrative** representation of the **one grade-C vendor's qualitative shape family** (a single weak source; the catalog entry is generic), in the same sense as the M8 external variants (which are illustrative shapes anchored by published dimensions).

**Triangle cap:** **1,400** per rod. An **uncommitted** Blender 4.0.2 planning prototype of this construction measured **1,372 tris** (1,084 rod + 288 small-end), bounds identical to the stock rod, 0 boundary edges, 10 closed components. It is **provisional and not reproducible from this branch**; the build must re-run the script in Blender 5.2.3 and record the actual count/bytes (QA-14). The full-engine delta at the 1,400 cap is `(1,400 − 1,180) × 8 = +1,760` triangles; at the prototype it is `+1,536`.

---

## 4. `injectors_plus30` — evidence and no-visual verdict

| Attribute | Value as published | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| Catalog change | `maxFuelMm3` 120 → 156 (+30%) | `catalog/modified.json`; `docs/M6-PARTS.md` | project record | **ADOPTED** |
| Nozzle type | **7-hole SAC** nozzle, Bosch solenoid body, 23,000 psi max rail | [L7 §12](./L7-verified-data-survey.md), citing Diesel Components Inc / Dynomite Diesel / DieselHub | B/C | **PARTIALLY PUBLISHED** |
| Nozzle hole diameter | **NOT PUBLISHED**; 0.155 mm vendor candidate and 0.15 mm forum figure recorded as low-confidence, **not adopted** | [cross-check §11](../research-crosscheck/RECONCILIATION.md) | C/D | **NOT PUBLISHED** |
| High-flow injector construction | Remanufactured stock Bosch injectors; **nozzles enlarged by abrasive-flow honing**; "installed back onto the injector" | [Exergy 45% Over reman injector listing](https://www.exergyperformance.com/i-30497756-2004-5-2005-lly-duramax-reman-exergy-fuel-injectors-45-over-set-of-8-e01-10206.html) | C | **VERIFIED-PUBLISHED** (vendor) |
| Shipped injector body | Generic stepped common-rail body; smooth nozzle-tip cone; **no holes modelled** | measured `fuel_injector_c1_stock.glb`; [M7 §2.4](../M7-DATA.md) | project measurement | **VERIFIED-PUBLISHED** (repo) |
| Shipped shell injectors | 8 bodies + 8 connectors + return line, generic external silhouettes | measured shell GLB; `docs/M10-EXTERIOR.md` | project measurement | **VERIFIED-PUBLISHED** (repo) |

**Verdict: NO-VISUAL.** The +30% change is nozzle-internal. The nozzle is not hole-modelled; the published 7-hole count does not give a hole diameter, and a hole-size delta at ~0.155 mm is sub-pixel at the app's scale. The external injector body is a remanufactured stock body in the verified aftermarket examples. Adding a visible "high-flow" body difference would invent a shape the data does not support; adding holes only to the variant would falsely imply the stock injector has none. The existing static `injector` cap source and the shell's `injectors` group are unchanged.

---

## 5. `cp3_stroker` — evidence and no-visual verdict

| Attribute | Value as published | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| Catalog change | `flowBaseKgH` 30 → 42, `flowSlopeKgHPerRpm` 0.022 → 0.030, `maxRailPsi` 23,000 unchanged | `catalog/modified.json`; `docs/M6-PARTS.md` | project record | **ADOPTED** |
| Pump construction | Bosch CP3 radial-piston high-pressure pump; the stroker changes the internal cam-ring stroke | [BD Diesel "CP3 Pump 101"](https://us.bddiesel.com/blogs/r-d-blog/cp3-pump-101-reliability-upgrades-tuning-tips-for-cummins-duramax); [Exergy 10 mm stroker listing](https://www.exergyperformance.com/i-30497579-2004-5-2005-lly-duramax-exergy-10mm-stroker-cp3-pump-lbz-based-e04-10206.html) | B/C | **PARTIALLY PUBLISHED** |
| LLY fitment | 10 mm stroker is an **LBZ-based pump with an LLY fuel-pressure regulator**, listed as a replacement for Bosch `0 445 020 030` / `0 986 437 308` and GM `97303762` | Exergy E04 10206 listing | C | **VERIFIED-PUBLISHED** (vendor) |
| External housing difference | **No source publishes one.** The replacement retains the stock mounting/FPR arrangement; the published difference is flow/cam-ring stroke | same listings; searched for housing dimensions/drawings | C/N/A | **NOT PUBLISHED** — external identity is **INFERRED** from the replacement-part listing, not a measured comparison |
| Shipped CP3 geometry | `cp3Fuel/ext_cp3` 380 tris, `ext_fca` 180, rails 300, lines 540; scene-placed at X 350…452, Y −68.7…52.7, Z 162…268 mm | measured shell GLB; `docs/M10-EXTERIOR.md` | project measurement | **VERIFIED-PUBLISHED** (repo) |
| Swappability | The M10 shell loader can preserve `cp3Fuel` child index `0` (`ext_cp3`) without touching the shell GLB | `src/renderer/exteriorLoader.ts` `ExteriorPreservedSubtreeSpec` | code | **VERIFIED** (repo) |

**Verdict: NO-VISUAL.** M8's premise — "no swappable pivot-placed model existed" — is **cured by M10**: the CP3 is now scene-placed geometry and a child split is technically possible. But the stroker's difference remains internal cam-ring stroke, and no source publishes an external housing difference. A swap would show the same housing with a different label; that is a fabricated visible delta. The shell's `cp3Fuel` cap source and the M11 caps are unchanged.

---

## 6. `cam_performance` — evidence and the owner decision

| Attribute | Value as published | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| Catalog change | `veFactor` 1.0 → 1.04 (volumetric-efficiency multiplier) | `catalog/modified.json`; `docs/M6-PARTS.md` | project record | **ADOPTED** |
| Stock lobe lift | **7.273 mm intake / 5.907 mm exhaust** | GM 2006 Silverado 2500 LLY service manual, Camshaft ([scanned table](https://charm.li/images/DM13Q313/gm60/320351269/)); D-044 | A | **VERIFIED-PUBLISHED** |
| Stock rocker ratios | **1.36:1 intake / 1.69:1 exhaust** | same GM table, Valve System ([scanned table](https://charm.li/images/DM13Q313/gm60/320410072/)); D-044 | A | **VERIFIED-PUBLISHED** |
| Derived valve lift | **9.891 mm intake / 9.983 mm exhaust** (stored 9.9 / 10.0 mm) | arithmetic on the two published inputs; D-044 | A×A | **VERIFIED-PUBLISHED** (derived) |
| Duration / LSA / timing events | **NOT PUBLISHED** | [L7 §4](./L7-verified-data-survey.md); [cross-check §4c](../research-crosscheck/REPORT.md) | N/A | **NOT PUBLISHED** |
| Performance-grind example | Stage 2 race cam: **0.450 in lift, 258/268 duration** | [Dirty Diesel Customs listing](https://www.dirtydieselcustom.ca/products/2001-2016-duramax-industrial-injection-stage-2-race-performance-camshaft-pdm-dmxhp); [Colt Cams C-1014-S](https://www.fullforcediesel.com/colt-cams-street-strip-camshaft-duramax-c-1014-s) | C | **RECORDED-NOT-ADOPTED** — a different grind, not the stock LLY profile and not the catalog's generic +4% VE |
| Shipped cam geometry | **None** — the valvetrain starts at the lifters | `build_cylinder1.py`; measured part list | project measurement | **VERIFIED-PUBLISHED** (repo) |

**Clearance bound if a 0.450 in cam were adopted:** the listing says only `Lift: .450 Intake / .450 Exhaust` and recommends `.080` piston valve relief; **the lobe-vs-valve basis is unstated**. If `.450` is **lobe** lift, `0.450 in = 11.43 mm` lobe; intake valve lift `11.43 × 1.36 = 15.54 mm` (vs stock 9.9 mm, **+5.64 mm**); exhaust `11.43 × 1.69 = 19.32 mm` (vs stock 10.0 mm, **+9.32 mm**). Applying the full max-lift increase at the stock minimum-clearance angle gives a **bounding estimate** of **−3.84 mm / −6.34 mm** against the stock **1.797 mm** intake / **2.979 mm** exhaust minima (M7 §2.3 / D-044); it is not a computed piston-to-valve clearance, and if `.450` is **valve** lift the rocker ratios do not apply. The vendor relief recommendation still supports "not a drop-in"; it cannot be represented as the catalog's `veFactor 1.04` change.

**Why a cam visual implies kinematics.** A camshaft is the mechanical source of valve lift and turns at half crank speed. The current sim drives valve lift from a `sin²` timing curve with published max lifts; there is no cam geometry and no lobe-profile input. A visual cam can be:

- **(A) deferred** — no cam visual in M13; the catalog entry is recorded visual-less; a future milestone may add cam geometry *and* wire lobe lift if the owner opens the kinematics;
- **(B) visual-only** — a cam that rotates at half crank speed but does not drive the valves; mechanically dishonest, because the displayed lobes would not correspond to the displayed valve motion;
- **(C) cam + kinematics** — new geometry plus a change to `src/core/kinematics.ts` / `valveConfig.ts`, requiring a published duration/timing profile (not available) and a formal interface/decision change.

**M13 recommendation: (A) defer.** This is drafted as **Owner Decision OD-1** in the spec; the spec does not silently assume a decorative cam. The catalog's `veFactor 1.04` is a performance multiplier, not a lobe profile; modelling a performance lobe from it would encode invented data (D-012).

---

## 7. `heads_ported` — evidence and no-visual verdict

| Attribute | Value as published | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| Catalog change | `flowFactor` 1.0 → 1.08 (+8% port flow) | `catalog/modified.json`; `docs/M6-PARTS.md` | project record | **ADOPTED** |
| Shipped head section | 3,532 tris: deck block, 4 seat rings/guides, spring seats, injector bore, split rocker shaft; **no ports** | measured `sta_head_c1_stock.glb`; `docs/M2`/`M7` | project measurement | **VERIFIED-PUBLISHED** (repo) |
| Shipped external head | Shell `heads` group 1,600 tris: external slab + exhaust-port stubs; no internal passages | measured shell GLB; `docs/M10-EXTERIOR.md` | project measurement | **VERIFIED-PUBLISHED** (repo) |
| LLY port geometry | **NOT PUBLISHED** — no dimensioned head drawing, port shape, port volume or flow bench | [L7 §10](./L7-verified-data-survey.md); cross-check §10 | N/A | **NOT PUBLISHED** |
| CNC-ported head product | Describes CNC porting; publishes no port dimensions or cross-section | [PPE CNC-ported head listing](https://lincolndieselspecialties.com/i-23856409-ppe-performance-duramax-cnc-ported-cast-iron-cylinder-head-one-head-2004-5-2010.html) | C | **PARTIALLY PUBLISHED** (process only) |

**Verdict: NO-VISUAL.** Porting changes internal port geometry that is neither published nor modelled. The head section has no port surfaces; no source publishes an external-casting difference, and the external identity is inferred from the casting listing, not measured. A "ported" visual would be fabricated, and adding a guessed port shape only to the variant would falsely imply the stock head has no ports. The static `head` cap source and the shell `heads` group are unchanged.

---

## 8. Tunes and fuel rail — explicit confirmation

| Entry | Slot | `modelPath` | What it changes | Visual verdict |
| --- | --- | --- | --- | --- |
| `tune_tow` | `tune` | null | ECM fuel-request / boost / AFR / EGT table | **NO-VISUAL — software calibration** |
| `tune_performance` | `tune` | null | ECM fuel-request / boost / AFR / EGT table | **NO-VISUAL — software calibration** |
| `fuelRail_stock` | `fuelRail` | null | Stock-only rail; transient droop outside the steady-state model | **NO-VISUAL — stock-only, no modified entry** |

These are not "missing" visuals; they are **software/stock-only entries for which a 3D variant has no meaning**. Confirming them closes the modified catalog: 12 modified entries = 6 with a variant `modelPath` after M13 (5 M8 + `rods_forged`) + 6 recorded no-visual (`injectors_plus30`, `cp3_stroker`, `cam_performance`, `heads_ported`, `tune_tow`, `tune_performance`). The 12 stock entries are the shipped baseline and remain `modelPath: null`.

---

## 9. Per-variant verdict table

| Entry | Slot | Shipped geometry found (measured) | D-038 reason re-test | Verdict | What M13 does |
| --- | --- | --- | --- | --- | --- |
| `rods_forged` | `rods` | 1,180-tri H-beam × 8; stock 163.0 / 62.9 / 34.5 mm; 27.676 mm big-end width; flange 6.288 mm; web 4.428 mm | "Material-only" is **partially overturned**: one grade-C vendor describes a thicker-flanged H-beam / reduced depth of cut / ARP L19 fasteners; magnitudes and the 12-point profile unpublished | **VISUAL (illustrative)** | Part-local `rot_conrod_c1_forged.glb`, 1,400-tri cap, stock interface, labeled placeholder flange/web values |
| `injectors_plus30` | `injectors` | Internal 924-tri body, smooth tip, no holes; shell 2,100-tri generic bodies | "Nozzle flow, nozzle not modelled" **confirmed**: 7-hole count published, hole diameter unverified; reman stock external body | **NO-VISUAL** | Record the reason; no asset; static injector cap unchanged |
| `cp3_stroker` | `cp3` | Shell `cp3Fuel` 1,400 tris; `ext_cp3` 380 tris; scene-placed, child split now possible | "No swappable model" **premise cured by M10**; no source publishes an external housing difference (identity inferred, not measured); stroke internal | **NO-VISUAL** | Record the premise change and the remaining reason; no asset |
| `cam_performance` | `camshaft` | **No camshaft geometry**; valvetrain starts at lifters | "No geometry; timing unpublished" **confirmed**; D-044 publishes lobe lift but not duration/timing; a cam visual implies kinematics | **NO-VISUAL (owner decision OD-1)** | Defer; draft the kinematics owner decision; no asset |
| `heads_ported` | `heads` | 3,532-tri head section, no ports; shell heads 1,600 tris, no passages | "Ports unpublished/unmodelled" **confirmed** | **NO-VISUAL** | Record the reason; no asset; static head cap unchanged |
| `tune_tow` | `tune` | No geometry | Software calibration | **NO-VISUAL** | Confirm; no asset |
| `tune_performance` | `tune` | No geometry | Software calibration | **NO-VISUAL** | Confirm; no asset |
| `fuelRail_stock` | `fuelRail` | No modified entry | Stock-only | **NO-VISUAL** | Confirm; no asset |

**Catalog closure count:** 24 entries = **6 with a variant `modelPath`** (`turbo_large`, `intake_highflow`, `exhaust_4in`, `intercooler_upgraded`, `pistons_lowcomp`, `rods_forged`) + **18 without** (12 stock + 6 modified no-visual). Every entry has a recorded disposition after M13.

---

## 10. Recorded-but-not-adopted register

| Item | Published value / claim | Why not adopted |
| --- | --- | --- |
| Callies 28.4 mm big-end width | BoostLine stock-matching rod 1.119 in (28.4 mm) big-end width | The stock model's 27.676 mm width leaves a **0.724 mm** inter-rod gap on the shared pin; 28.4 mm would close it to 0.0 mm. The variant keeps 27.676 mm and records the aftermarket width as a reference. |
| Callies 2.480 in rod journal | Aftermarket rod journal 2.480 in | The stock model uses the published GM 62.9 mm (2.476 in) journal; a 2.480 in variant bore would not match the stock crankpin. The variant keeps 62.9 mm. |
| Callies 1,182 g weight | Typical aftermarket rod weight | No mass/inertia consumer in the sim; the model has no mass property. Recorded, not modelled. |
| Manley I-beam | 6.417 in c2c I-beam | The shipped rod is an H-beam; the catalog does not specify beam type. Switching to an I-beam would be a different visual claim; the H-beam Callies description is the closer family. |
| 0.450 in / 258–268° performance cam | Aftermarket Stage 2 grind; listing says `Lift: .450`, lobe vs valve unspecified | A different grind, not the stock LLY profile and not the catalog's `veFactor 1.04`; if `.450` is lobe lift, the full-max-lift-delta bound is −3.84 / −6.34 mm (bounding estimate, not a kinematic clearance). The vendor recommends `.080` relief. |
| 0.155 mm injector nozzle hole | Low-confidence vendor candidate | Below the project's verified bar; cross-check §11 explicitly says not adopted. A visual hole delta at this scale is sub-pixel and unverified. |
| 10 mm CP3 stroke | Stroker internal dimension | The catalog already expresses the change as flow parameters; no source publishes an external housing difference (identity inferred, not measured). No visual dimension needed. |
| LLY port dimensions | None published | No source; a guessed port would be fabricated. |
| Stock rod "I-beam" wording in `docs/M7-DATA.md` | One register row says "rod I-beam" | The build code and GLB are H-beam; the M7 row is stale wording, not a different asset. Recorded for the M13 docs, not treated as a second geometry. |

---

## 11. What this survey could not verify

1. **No WebGL / headless browser in this planning VM.** Runtime draw calls, submitted triangles, VRAM, p95 frame time and reference-frame captures were **not** re-measured. The triangle baselines were re-derived from the committed GLBs and the renderer's instance counts; the M11/M12 measured call/VRAM/p95 values are quoted only as a cross-check, and the build must re-measure them on the reference GPU.
2. **No Blender 5.2.3 LTS.** The repository's asset scripts target Blender 5.2.3; this VM has 4.0.2. A stock conrod rebuilt in 4.0.2 reproduced the committed **1,180 triangles** exactly, and the M13 prototype measured **1,372**, but **the prototype GLB/script are not committed**, so the figure is provisional and cannot be checked from a fresh clone. The build must re-run the actual script in 5.2.3 and record the final count. The 4.0.2 export differs in vertex dedup/file bytes (24,548 B vs the committed 39,908 B), so **file size is not a 4.0.2 result and the 28,008 B prototype is not a page-weight measurement**; the spec labels it provisional and caps the asset at 48 KiB.
3. **No published aftermarket rod flange/web dimensions.** The qualitative Callies description is the only shape evidence; the M13 flange/web values are labeled placeholders.
4. **No published LLY injector nozzle hole diameter.** The 0.155 mm candidate is low-confidence and not adopted.
5. **No published CP3 external housing comparison.** The "external housing identical" statement is an inference from replacement-part listings, not a measured comparison; it is labeled as such in the spec.
6. **No published LLY cam duration, LSA, timing events or performance-grind lobe profile.** Only stock lobe lift and rocker ratios are published (D-044).
7. **No published LLY port geometry or flow bench.** The head-section GLB has no ports.
8. **No physical LLY, no measured aftermarket parts, no GM dimensioned drawings.** Every non-repo dimension is a publication or a labeled placeholder.

---

## 12. Sources

- **GM service literature (grade A):** 2006 Chevrolet Silverado 2500, RPO LLY, "Engine General Specifications & Service Limits", via Operation CHARM: <https://charm.li/Chevrolet/2006/Silverado%202500%202WD%20V8-6.6L%20DSL%20Turbo/Repair%20and%20Diagnosis/Engine%2C%20Cooling%20and%20Exhaust/Engine/Specifications/Mechanical%20Specifications/Engine%20General%20Specifications%20%26%20Service%20Limits/>; scanned tables: connecting rod/crankshaft <https://charm.li/images/DM13Q313/gm60/320362526/>, camshaft <https://charm.li/images/DM13Q313/gm60/320351269/>, valve system/rocker ratios <https://charm.li/images/DM13Q313/gm60/320410072/>, pistons/pins <https://charm.li/images/DM13Q313/gm60/320392819/>.
- **Engineering bulletin (grade B):** AERA Technical Committee, "Revised Connecting Rod Design on 2001-2017 GM 6.6L Duramax Diesel Engines": <http://engineprofessional.com/TB/TB031417-2.pdf>.
- **Specialist vendor — rods (grade C):** Callies Compstar Xtreme 6.418 Duramax H-beam rod set, listing with 4340 forged H-beam, ARP L19, 6.418 in c2c, 2.480 in journal, 34.5 mm pin, 1,182 g and the "thicker flanges / reduced depth of cut" description: <https://ddsrubicon.com/i-30559441-callies-compstar-xtreme-connecting-rods-rated-for-1000hp-set-of-8-2001-2016-gm-6-6l-lb7-lly-lbz-lmm-lml.html>.
- **Specialist vendor — stock-matching rod (grade C):** BoostLine `GM6418-358S`, as recorded in [L7 §1](./L7-verified-data-survey.md) (6.418 in c2c, 1.119 in big-end width, 2.476 in journal): <https://puredieselpower.com/chevy-gm-products/lly-04.5-06-trucks/2001-2005-gm-6.6l-lly-duramax-parts/01-16-gm-duramax-boostline-forged-4340-chromoly-connecting-rods-gm6418-358>.
- **Specialist vendor — injectors (grade C):** Exergy 45% Over reman LLY injectors, "nozzles are enlarged using abrasive flow honing… installed back onto the injector… remanufactured by Bosch": <https://www.exergyperformance.com/i-30497756-2004-5-2005-lly-duramax-reman-exergy-fuel-injectors-45-over-set-of-8-e01-10206.html>.
- **Specialist vendor — CP3 (grade C):** Exergy 10 mm stroker CP3 (LBZ-based, LLY FPR, replacement for Bosch/GM part numbers): <https://www.exergyperformance.com/i-30497579-2004-5-2005-lly-duramax-exergy-10mm-stroker-cp3-pump-lbz-based-e04-10206.html>; BD Diesel, "CP3 Pump 101": <https://us.bddiesel.com/blogs/r-d-blog/cp3-pump-101-reliability-upgrades-tuning-tips-for-cummins-duramax>.
- **Specialist vendor — heads (grade C):** PPE CNC-ported Duramax head listing (process description, no port dimensions): <https://lincolndieselspecialties.com/i-23856409-ppe-performance-duramax-cnc-ported-cast-iron-cylinder-head-one-head-2004-5-2010.html>.
- **Specialist vendor — cam (grade C):** Dirty Diesel Customs Stage 2 race cam, 0.450 in lift / 258–268 duration: <https://www.dirtydieselcustom.ca/products/2001-2016-duramax-industrial-injection-stage-2-race-performance-camshaft-pdm-dmxhp>; Colt Cams C-1014-S street/strip billet cam: <https://www.fullforcediesel.com/colt-cams-street-strip-camshaft-duramax-c-1014-s>.
- **Project research (graded within):** [`L7-verified-data-survey.md`](./L7-verified-data-survey.md) §1 (rod length/width), §4 (cam lobe lift; duration/timing not published), §10 (head/port geometry not published), §12 (injector 7-hole/rail pressure); [`docs/research-crosscheck/REPORT.md`](../research-crosscheck/REPORT.md) and [`RECONCILIATION.md`](../research-crosscheck/RECONCILIATION.md) item 11 (injector hole diameter not adopted).
- **Project decisions:** D-038 (`docs/DECISIONS.md:77`) — M8 internal-parts position being re-tested; D-044 (`:95`) — cam lobe lift/valve lift correction; D-046 (`:103`) — M12 scene-placed cosmetic add-on; D-047 (`:104`) — M12 proof-frame lesson.
- **Repo measurements:** committed GLBs under `public/models/` and `public/Duramax_LLY_2005_66L_V8.glb`; `src/renderer/engineScene.ts` instance counts and cap registrations; `assets-src/blender/build_cylinder1.py` `build_conrod`; `assets-src/dimensions.json`.

---

## 13. Summary — what can honestly carry the M13 design

| # | Item | Verdict | M13 action |
| --- | --- | --- | --- |
| 1 | Stock rod is a forged H-beam, 1,180 tris × 8, 163.0 / 62.9 / 34.5 mm interface | **VERIFIED-PUBLISHED** (repo + GM) | Preserve the interface; part-local swap is possible |
| 2 | One grade-C vendor describes a thicker-flanged H-beam with ARP L19 fasteners; the catalog entry is generic | **PARTIALLY PUBLISHED** (qualitative, grade C, single weak source) | Add an illustrative heavier H-beam; label flange/web and 12-point magnitudes placeholders |
| 3 | 28.4 mm aftermarket big-end width | **PARTIALLY PUBLISHED** | **Not adopted** — would close the 0.724 mm inter-rod gap |
| 4 | +30% injector flow is nozzle work; nozzle not hole-modelled; stock external body | **VERIFIED-PUBLISHED** (repo + vendor) | **No-visual**; record the reason |
| 5 | CP3 stroker is internal cam-ring stroke; no source publishes an external housing difference (identity inferred, not measured); M10 shell now has `ext_cp3` | **PARTIALLY PUBLISHED** / **VERIFIED** (repo) | **No-visual**; record the cured premise and the remaining reason |
| 6 | Cam has no geometry; stock lobe lift published, duration/timing not; a visual implies kinematics | **VERIFIED-PUBLISHED** / **NOT PUBLISHED** | **No-visual + Owner Decision OD-1** (defer, recommend A) |
| 7 | Head ports are unpublished and unmodelled; no source publishes an external-casting difference (identity inferred, not measured) | **NOT PUBLISHED** / **VERIFIED** (repo) | **No-visual**; record the reason |
| 8 | Tunes are software calibrations; fuel rail is stock-only | **VERIFIED-PUBLISHED** (repo) | Confirm visual-less; close the 24-entry catalog |

**Bottom line:** M13 can honestly add **one** internal visual — the forged connecting-rod variant — as an illustrative heavier H-beam anchored by the stock interface dimensions and a published qualitative aftermarket description. The other four internal entries are recorded no-visual with reasons that were re-tested against the current scene: injectors and heads because the changed surface is unpublished/unmodelled, CP3 because no source publishes an external housing difference (identity inferred, not measured) even though the M10 shell has now made a swap technically possible, and cam because there is no geometry and a visual would force a valve-kinematics decision the owner has not made. The two tunes and the stock-only fuel rail are confirmed visual-less, so the 24-entry catalog is closed rather than left with an ambiguous "remaining candidates" line.
