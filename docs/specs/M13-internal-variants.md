# Milestone 13 Spec — Internal-Part Visual Variants (Forged Rods + Catalog Closure)

Repo: `colinstephens93/CarbonDuramax` · Build branch: **`m13-internal-variants`** (create from `main` at `8394f1f`) · Planning branch: `plan/m13-internal-variants` · Planning package: this spec + [`docs/research/M13-internal-variants-survey.md`](../research/M13-internal-variants-survey.md); the independent D-037 QA record is produced by a separate agent after this draft · Plan reference: **new milestone, not in PLAN.md v2.2** — Milestone 13 is added by this spec's paperwork deliverables (§12.1), per the anti-drift rule, and discharges the post-M12 candidates line (`docs/PLAN.md:80`) and the OPEN_ITEMS internal-variant item (`docs/OPEN_ITEMS.md:18`).

**What changes in one sentence:** the app gains **one** part-local 3D visual — `rods_forged`, a stock-interface, heavier forged H-beam with thicker/wider flanges and a thicker web, labeled illustrative, with stepped 12-point cap fasteners that are an illustrative placeholder — while `injectors_plus30`, `cp3_stroker`, `cam_performance`, `heads_ported`, `tune_tow` and `tune_performance` are recorded **visual-less with reasons**, an explicit owner decision defers the cam/kinematics question, and the 24-entry catalog's visual dispositions are closed. **No other variant is invented.**

**Coding is done by the user in Antigravity on branch `m13-internal-variants`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

---

## 1. What Milestone 13 is

Milestones 0–12 shipped the engine, views, performance model, catalog, verified data, five external/piston visual variants, sound, the rebuilt exterior shell, capped cutaways and the optional intake cover. Five internal catalog entries still have `modelPath: null`: `rods_forged`, `injectors_plus30`, `cp3_stroker`, `cam_performance`, `heads_ported`. Four of them change performance numbers; `rods_forged` is a durability part whose `performanceParams` is empty. **D-038** recorded all five as out of scope at M8, each with a reason. M13 re-tests every D-038 reason against the **current shipped code and geometry** (M10's rebuilt shell, M11's cap sources, M12's scene-placed add-on) and then does one of two things per entry: adds a visible signature defensible from published data or clearly labeled illustrative, **or** records an explicit no-visual outcome with the reason. It does not invent geometry to make the list complete.

1. **One new internal visual: `rods_forged`.** The stock rod is a forged H-beam (1,180 tris × 8); **one grade-C vendor** (Callies Compstar Xtreme) describes a **thicker-flanged H-beam with ARP L19 fasteners**, not a material-only change. The catalog entry itself is generic ("Heavy-Duty Forged Connecting Rods"), so the variant is not presented as that vendor's part. It is a part-local drop-in (`public/models/variants/rot_conrod_c1_forged.glb`) with the **stock interface dimensions preserved** (163.0 mm c2c, 62.9 mm journal, 34.5 mm pin, 27.676 mm big-end axial width) and **labeled-placeholder** flange/web magnitudes. The stepped 12-point fastener is an **illustrative placeholder, not published**. It is visible in the existing exploded/cutaway/X-ray/exterior-off internal views; it changes no performance number. §2.1, §4.
2. **Four recorded no-visual outcomes, each re-tested rather than copied.** Injectors: +30% flow is nozzle-internal and the nozzle is not hole-modelled; the external body is a remanufactured stock body. CP3: the M10 shell now **does** contain swappable `cp3Fuel/ext_cp3` geometry (the M8 "no swappable model" premise is cured), but no source publishes an external housing difference — the identity is inferred from the replacement-part listing, not measured — and the stroke is internal. Cam: no camshaft geometry exists; a cam visual implies a valve-kinematics decision. Heads: port geometry is unpublished and unmodelled; no source publishes an external-casting difference — the identity is inferred from the casting listing, not measured. §2.2–§2.5.
3. **An explicit owner decision on the cam/kinematics question.** **OD-1**: M13 adopts **Option A (defer the cam visual)**. A visual-only cam that rotates at half crank speed but does not drive the valves would be mechanically dishonest; wiring lobe lift into the valve kinematics requires published duration/timing (not available) and opens the frozen `src/core/kinematics.ts` / `valveConfig.ts`. The spec does not silently assume either. §2.4.
4. **Catalog closure.** The two tunes are software calibrations and stay visual-less; the stock-only fuel rail stays visual-less. After M13 the 24-entry catalog is **6 entries with a variant `modelPath`** (5 M8 + `rods_forged`) + **18 without** (12 stock + 6 modified no-visual). Every entry has a recorded disposition. §2.6–§2.7.
5. **A budget record with a cap, not a measured asset.** Rod cap **1,400** triangles per instance, full-engine delta `+1,760` at the cap (`+1,536` at the provisional 1,372-tri prototype). Stock scene 308,324 → **311,884** with rods + M12 cover (cap); worst 304,632 → **308,192**; the derived cap guard is **319,128 / 320,000 phone (872 triangles, 0.2725 % headroom)**. Draw calls are unchanged by rods (same 3 primitives as stock); the cover's +2 is unchanged. §7.
6. **Proof frames that reuse committed camera poses, not copied section claims.** RF-21 reuses the **committed RF-10 exploded internal camera pose** (whose image shows the rod region) with `rods_forged` selected; RF-22 reuses the **committed RF-6 cutaway camera pose** with `rods_forged` selected and moves the section plane to **X = 388.3 mm**, which cuts the station-0 RH variant rod (span arithmetic in §8.2/§15.9) rather than RF-6's `X = 402.5 mm` inter-rod gap. No new camera pose is invented in a VM with no WebGL; the build gate verifies both. §8.
7. **Stock scene unchanged.** `rods_stock` remains `modelPath: null`; the variant is preloaded but hidden, and the rendered stock scene is untouched. The five M8 variants, the M10 shell, the M12 cover, the ten stock GLBs and the catalog schema are byte-identical. §5, §6, §14.

**Non-goals for M13:**

- **No new catalog slot or entry.** The 12-slot list (D-032) and the 24-entry catalog are unchanged apart from one `rods_forged.modelPath` value. `src/core/interfaces.ts` (D-010) is untouched.
- **No performance-model change.** `src/perf/**` is frozen; the rod variant changes no number, and `computeCurve`/`computeDetails` for `rods_forged` must exactly equal stock (§9 test 7).
- **No injector, CP3, camshaft or head geometry.** Those four stay visual-less with recorded reasons; adding guessed geometry would violate the honest-geometry rule.
- **No cam/kinematics change.** OD-1 defers it; `src/core/kinematics.ts` and `src/config/valveConfig.ts` are frozen.
- **No change to the M8 external variants, M10 shell, M11 cap builder or M12 cover.** Their GLBs, `modelPath`/`explodeVectorMm` values, compatibility rules, cap sources and reference frames are unchanged.
- **No new texture, decal, UV, render pass, stencil, render target or npm dependency.** The rod variant is untextured PBR like the stock parts.
- **No new label anchor.** The 23 existing anchors and label rules are frozen.
- **No physical-access or measured-part claim.** The flange/web magnitudes are labeled placeholders; the part is illustrative, not a scan of a specific aftermarket rod.

---

## 2. The explicit positions

### 2.1 `rods_forged` — **visual** (illustrative heavier H-beam)

**Decision: add a part-local visual variant for `rods_forged`.** The stock rod is a forged H-beam. **One grade-C vendor** (Callies Compstar Xtreme) describes a thicker-flanged H-beam with ARP L19 fasteners ("Strength is added by thickening up the flanges of the H beam and a reduced depth of cut towards the center of the rod…", Callies Compstar Xtreme, grade C). That is a **qualitative visible shape family**, not a material-only change, but it is a **single weak source** and the catalog entry is generic ("Heavy-Duty Forged Connecting Rods"), not that vendor's part. The exact flange/web magnitudes are not published, so the variant keeps the stock interface dimensions and labels the magnitudes as placeholders. The stepped **12-point** fastener profile is an **illustrative placeholder, not published**: the vendor page supports ARP L19 fasteners but says nothing about a 12-point head, washer flange or stepped profile.

Why this passes the honest-geometry rule and the three M8 tests:

| M8 test | Result |
| --- | --- |
| (a) A visible geometry change | **Pass, qualitative** — wider/thicker H-beam flanges and a thicker web, supported by the vendor's "thickening up the flanges / reduced depth of cut". The 12-point fastener is an illustrative placeholder, not a published claim. The magnitudes are illustrative. |
| (b) The part's swappable geometry already exists | **Pass** — the stock conrod GLB is instanced ×8 with a pivot at the big-end bore axis; a part-local variant uses the existing M8 piston swap path. |
| (c) A truthful illustrative shape can be derived | **Pass as labeled illustrative** — the stock interface (163.0 / 62.9 / 34.5 / 27.676 mm) is published/modeled; the flange/web/fastener magnitudes are placeholders, exactly as the M8 external variants are illustrative shapes anchored by published dimensions. |

What the variant **must not** do: present the flange/web values as a measured aftermarket rod; change the 163.0 mm centre-to-centre, 62.9 mm journal, 34.5 mm pin or 27.676 mm big-end axial width; adopt the published 28.4 mm stock-matching aftermarket big-end width (it would close the 0.724 mm inter-rod gap); or claim a specific brand.

### 2.2 `injectors_plus30` — **no-visual**

**Decision: record no-visual; no asset.** The +30 % change is `maxFuelMm3` 120 → 156, i.e. **nozzle flow**. The shipped internal injector is a revolved body with a smooth nozzle-tip cone and **no holes** (924 tris × 8); the shell's eight external injectors are generic bodies with connectors and a return line (2,100 tris). The LLY nozzle is a published **7-hole SAC** nozzle, but the **hole diameter is not published** (the 0.155 mm vendor candidate is low-confidence and was explicitly not adopted in the cross-check). A hole-size delta at ~0.155 mm is sub-pixel at the app's scale and would not be visible; a fabricated external body difference would imply a shape the data does not support; adding holes only to the variant would falsely imply the stock injector has none. The existing static `injector` cap source and the shell `injectors` group are unchanged.

### 2.3 `cp3_stroker` — **no-visual** (M8 premise cured, conclusion stands)

**Decision: record no-visual; no asset.** M8 said "no swappable pivot-placed model existed." That premise **is cured by M10**: the rebuilt shell contains `cp3Fuel/ext_cp3` (380 tris) and `ext_fca` (180 tris) as scene-placed geometry, and the shell loader can preserve `cp3Fuel` direct child index `0` without touching the shell GLB. A CP3 swap is therefore technically possible now. But the stroker's published difference is an **internal cam-ring stroke**; the replacement pump is listed as retaining the stock mounting/LLY fuel-pressure-regulator arrangement, and **no source publishes an external housing difference** — the external identity is **inferred from the replacement-part listing, not measured**. A swap would show the same housing under a different label — a fabricated visible delta. The catalog's `flowBaseKgH` / `flowSlopeKgHPerRpm` change is a steady-state flow parameter, not an external shape. The shell's CP3 geometry remains in the global merged shell cap source; the M11 caps are unchanged.

### 2.4 `cam_performance` — **no-visual + Owner Decision OD-1**

**Decision: record no-visual in M13; defer the cam visual. This is the explicit owner decision, not a silent assumption.**

What is published: stock lobe lift **7.273 mm intake / 5.907 mm exhaust** and rocker ratios **1.36:1 / 1.69:1** (GM LLY service table, grade A; D-044), giving derived valve lift **9.891 / 9.983 mm** (stored 9.9 / 10.0 mm). What is **not** published: duration, LSA, IVO/IVC/EVO/EVC, or a performance-grind lobe profile. The catalog's `cam_performance` change is `veFactor 1.04`, a volumetric-efficiency multiplier — **not a lobe profile**. Aftermarket grinds are different cams. The Industrial Injection / Dirty Diesel Stage 2 listing says **`Lift: .450 Intake / .450 Exhaust`**, **`Duration: .258 Intake / .268 Exhaust`**, and recommends **`.080` piston valve relief**; it does **not** say whether `.450` is lobe or valve lift. If `.450` is **lobe** lift (the worst-case assumption), `11.43 mm × 1.36 = 15.54 mm` intake and `11.43 mm × 1.69 = 19.32 mm` exhaust valve lift follow. Applying the full max-lift increase at the stock minimum-clearance angle gives a **bounding estimate** of **−3.84 / −6.34 mm** against the stock **1.797 / 2.979 mm** clearances; that is not a computed piston-to-valve clearance, and if `.450` is **valve** lift the rocker ratios do not apply. Scaling the current `sin²` timing windows to 11.43 mm lobe does not reproduce that bound because the stock minimum-clearance angle is not at max lift, so no kinematic clearance number is claimed here. The vendor's `.080` relief recommendation still supports "not a drop-in; needs relief"; it is not the catalog's change and cannot be modelled as a drop-in.

**Why a cam visual implies a kinematics decision.** A camshaft turns at half crank speed and is the mechanical source of valve lift. The current sim drives valve lift from a `sin²` timing curve with published max lifts; there is no cam geometry and no lobe-profile input. The owner must choose one of:

| Option | What it means | Assessment |
| --- | --- | --- |
| **A — Defer (recommended)** | No cam visual in M13; `cam_performance` stays visual-less; a future milestone may add cam geometry **and** wire lobe lift if the owner opens the kinematics. | **Recommended.** Honest, bounded, no frozen-core change. |
| **B — Visual-only cam** | New cam geometry rotates at half crank speed but does not drive the valves. | **Rejected.** Mechanically dishonest: the displayed lobes would not correspond to the displayed valve motion. |
| **C — Cam + kinematics** | New cam geometry **and** a change to `src/core/kinematics.ts` / `valveConfig.ts` to drive lift from the lobe profile. | **Future milestone, not M13.** Requires a published duration/timing profile (not available) and a formal interface/decision change. |

> **Owner Decision OD-1 (for owner approval):** M13 adopts **Option A** as the spec's decision. The camshaft remains visual-less; a future cam visual is conditional on a separate decision to wire lobe lift into the valve kinematics. If the owner selects B or C, this spec is withdrawn and revised **before** the build starts; the builder must not add a decorative cam under this spec.

The `camshaft` slot's stock entry and the `cam_performance` entry remain `modelPath: null`; no cap source is added.

### 2.5 `heads_ported` — **no-visual**

**Decision: record no-visual; no asset.** `heads_ported` changes `flowFactor` 1.0 → 1.08 (+8 % port flow). The shipped head section (3,532 tris × 8) models the deck, four seat rings/guides, spring seats, injector bore and split rocker shaft — **not ports**. The shell's `heads` group (1,600 tris) is an external slab with exhaust-port stubs and no internal passages. LLY port geometry is **not published** (L7 §10; the cross-check agrees), and a CNC-ported head listing describes the process without dimensions. Porting is internal by definition; **no source publishes an external-casting difference**, and the external identity is **inferred from the casting listing, not measured**. A guessed port shape would be fabricated, and adding it only to the variant would falsely imply the stock head has no ports. The static `head` cap source and the shell `heads` group are unchanged.

### 2.6 Tunes and fuel rail — **visual-less by definition**

**Decision: confirm `tune_tow` and `tune_performance` stay visual-less; confirm `fuelRail_stock` stays visual-less.** The two tunes are ECM software calibrations (`performanceParams` only); no geometry exists or is implied. `fuelRail_stock` is a stock-only slot with no modified entry; rail volume and pressure droop are transient properties outside the steady-state model. These are not "missing" visuals; a 3D variant has no meaning for them.

### 2.7 Catalog closure

| Group | Count | Entries |
| --- | ---: | --- |
| Entries with a variant `modelPath` after M13 | **6** | `turbo_large`, `intake_highflow`, `exhaust_4in`, `intercooler_upgraded`, `pistons_lowcomp` (M8) + `rods_forged` (M13) |
| Stock entries (shipped baseline, `modelPath: null`) | **12** | all `*_stock` entries, including `fuelRail_stock` and `tune_stock` |
| Modified entries with a recorded no-visual outcome | **6** | `injectors_plus30`, `cp3_stroker`, `cam_performance`, `heads_ported`, `tune_tow`, `tune_performance` |
| **Total** | **24** | every entry has a recorded disposition |

The spec's `docs/M13-INTERNAL-VARIANTS.md` carries the full per-entry table; `src/renderer/internalVariants.ts` carries the machine-checkable disposition register (§5.1, §9 test 10).

### 2.8 What the rod variant must communicate — and must not

**Must communicate, in order:** (1) a heavier-duty connecting rod than stock, with a visibly beefier H-beam and different cap fasteners; (2) a part that remains a drop-in on the stock crankpin and piston pin — same length, same journals, same big-end width; (3) an internal part, visible in the exploded/cutaway/X-ray/exterior-off views, not an exterior bolt-on.

**Must not communicate:** that the flange/web values are measured aftermarket dimensions (they are not); that a specific brand or part number is modelled (it is not); that the rod changes horsepower, torque or durability numbers in the sim (it does not); that the stock rod is an I-beam (it is an H-beam); or that the variant widens the big end beyond the stock 0.724 mm inter-rod gap (it does not).

---

## 3. What the shipped app does today (measured, not assumed)

Source: this planning session on `main` @ `8394f1f`; binary GLB parses of every committed asset; `src/renderer/engineScene.ts` instance counts and cap registrations. The existing suite is **104 tests, 21 files**, passing; `npm run typecheck` passes (this session). Runtime draw calls, VRAM and p95 were **not** re-measured (no WebGL in this VM; §15.1, §15.7).

| Fact | Value | Where it comes from |
| --- | --- | --- |
| Catalog | 24 entries (12 stock + 12 modified); **5** with a variant `modelPath`, **19** null | `catalog/stock.json`, `catalog/modified.json`; §15.6 |
| `rods_forged` today | `modelPath: null`, `explodeVectorMm: [0,0,0]`, `performanceParams: {}` | `catalog/modified.json` |
| Stock rod | `rot_conrod_c1_stock.glb`, **1,180 tris** (892 rod + 288 small-end), 3 materials, H-beam, instanced **×8** = 9,440 scene tris | measured GLB; `build_cylinder1.py:455-582` |
| Stock rod interface | 163.0 mm c2c (published length; c2c basis inferred/corroborated); 62.9 mm journal; 34.5 mm pin; **27.676 mm** big-end axial width (stock model, `2 × 0.22 × 62.9`); flange 6.288 mm and web 4.428 mm (code-derived, `0.20 × big_r` / `0.32 × axial_half_w`) | measured GLB; `assets-src/dimensions.json` inputs; GM LLY table; `build_cylinder1.py` |
| Internal injector | 924 tris × 8; smooth nozzle-tip cone; **no holes**; 2 materials | measured GLB; `build_cylinder1.py:1342-1396` |
| Shell injectors | 8 bodies (140 each) + 8 connectors (90 each) + return line (260) = **2,100 tris** | measured shell GLB |
| CP3 / fuel | Shell `cp3Fuel` group **1,400 tris**: `ext_cp3` 380, `ext_fca` 180, `ext_hp_rails` 300, `ext_hp_lines` 540; scene-placed, no preserved subtree today | measured shell GLB; `exteriorLoader.ts` |
| Camshaft | **No geometry**; valvetrain starts at the lifters; `camshaft_stock`/`cam_performance` null | `build_cylinder1.py`; catalog |
| Head | `sta_head_c1_stock.glb`, **3,532 tris** × 8 = 28,256; static cap `head`; no ports | measured GLB; `engineScene.ts:1404` |
| Shell heads | `heads` group **1,600 tris**; external slab + exhaust-port stubs | measured shell GLB |
| Tunes | `tune_tow`/`tune_performance` `modelPath: null`, `performanceParams` only | catalog |
| Scene totals | **308,324** stock (exterior on) / **304,632** M8 worst (5 variants) | measured GLBs + code arithmetic; §15.2 |
| Draw calls / VRAM / p95 | 96 / 97 desktop, 58 / 60 phone; 20.75 / 4.75 MiB; 16.8 / 17.0 ms p95 (M11 detail rows; M12 measured stock is 17.0 / 17.0 ms) | M12 measured record; cross-check only, build re-measures |
| Cap sources | Stock rod is dynamic `conrod` (instanced 8); head/injector static; shell static; M11 ceiling 16,000 | `engineScene.ts:1404-1421`; `sectionCaps.ts:22` |
| Reference frames | RF-1…RF-20; **RF-10** (exploded internal, shows rods) and **RF-6** (cutaway, shows internal rods) are committed | `src/ui/referenceFrames.ts`; `docs/reference-frames/RF-10.png`, `RF-6.png` |

The facts that drive the design: **the stock rod is a genuine H-beam and one grade-C vendor describes a thicker-flanged H-beam, so one honest illustrative visual is possible**; **the other four internal entries have no truthful visible surface in the shipped geometry**; and **the current phone headroom is small — stock leaves 11,676 triangles, stock + the actual cover leaves 10,636, and the M12 derived cap guard leaves 2,632 (0.82 %)**. The 15,368 figure is the M8 five-variant worst-case build (304,632 triangles), which is lighter than stock because the external variants replace more shell geometry than they add; it is not the tightest phone state. The rod cap must therefore be tight (1,400) and the multiplication honest.

---

## 4. The rod asset — technical contract

### 4.1 File and asset class

| Item | Value | Provenance |
| --- | --- | --- |
| Asset path | `public/models/variants/rot_conrod_c1_forged.glb` | Design |
| Asset class | **Part-local internal variant** (same class as M8 `rot_piston_c1_lowcomp.glb`; no new class) | D-038 / M8 §3.1 |
| Authoring source | `assets-src/blender/build_rod_variant.py` + `assets-src/rod_variant_dimensions.json`; journal/pin/seat inputs from `assets-src/dimensions.json`, big-end width/flange/web from the stock GLB/code | Design |
| Contract root | `rot_conrod_c1_forged` (mesh node) | Design |
| Contract child | `rot_conrod_smallend_c1_forged` at `(0, 0, 163.0) mm` | Design |
| Materials | `mat_conrod_forged_steel`, `mat_conrod_bolts`, `mat_conrod_bushing` (3; same PBR family as stock; no textures/UVs) | Design |
| Triangle cap | **1,400** per instance; full-engine delta `(1,400 − 1,180) × 8 = +1,760` | Budget, §7 |
| File-size cap | **48 KiB (49,152 B)** | Budget, §7.8; provisional prototype 28,008 B (uncommitted 4.0.2) |
| Format | Uncompressed glTF 2.0 binary, Y-up export, indexed triangles, `POSITION` + `NORMAL` only, no `if_*` markers | `docs/ASSET_CONTRACT.md` part-local class |
| Runtime wrapper | `extractAllPartPrimitives` + `wrapInPartLocalFrame` (existing M8 path) | `src/renderer/partLoader.ts` |
| Mount | Part-local pivot at the big-end bore axis; the existing `applyV8KinematicState` positions all eight instances | Existing code |
| Catalog change | `rods_forged.modelPath = "models/variants/rot_conrod_c1_forged.glb"`; `explodeVectorMm` stays `[0,0,0]` (internal parts use the M4 explode pipeline) | §5.7 |

### 4.2 Dimensions and provenance

| Parameter | Value | Unit | Provenance | Why this value |
| --- | ---: | --- | --- | --- |
| Rod length (c2c) | **163.0** | mm | **published length; c2c basis inferred/corroborated** — GM LLY service table; D-035; survey §3.1 | Stock interface; must not change |
| Big-end journal bore | **62.9** | mm | **published** — GM LLY table; D-035 | Stock interface; must not change |
| Wrist-pin bore | **34.5** | mm | **published** — GM LLY table; D-035 | Stock interface; must not change |
| Big-end axial width | **27.676** | mm | **stock model / code-derived** (`2 × 0.22 × 62.9`); M7 register | Preserves the 0.724 mm inter-rod gap; 28.4 mm aftermarket width **not adopted** |
| Big-end outer radius | **42.143** | mm | **stock model** (`1.34 × 31.45`) | Stock interface; cap/ear envelope unchanged |
| Small-end outer radius | **23.805** | mm | **stock model** (`1.38 × 17.25`) | Stock interface; piston-pin clearance unchanged |
| Beam flange outer Y (big end) | **30.343** | mm | **labeled placeholder**; stock 26.129; one grade-C vendor's qualitative "thicker flanges" | Wider H-beam; +4.214 mm/side, inside the bore and the stock bolt-ear envelope |
| Beam flange outer Y (small end) | **18.568** | mm | **labeled placeholder**; stock 16.187 | Tapered beam; inside the piston skirt |
| Flange thickness | **8.177** | mm | **labeled placeholder**; stock 6.288; one grade-C vendor's qualitative "thickening up the flanges" | Thicker flange; +1.889 mm |
| Web half-width (X) | **5.258** | mm | **labeled placeholder**; stock 4.428; one grade-C vendor's "reduced depth of cut" | Thicker web; +0.830 mm |
| Cap fasteners | stepped **12-point** profile, outer envelope **±48.725 mm** (same as stock) | mm | **labeled placeholder**; vendor-listed "ARP L19 fasteners" (grade C), not a 12-point claim | A visible fastener-family cue without widening the rod |
| Triangle count | **1,372 provisional** (uncommitted Blender 4.0.2 planning prototype); cap **1,400** | tris | provisional planning measurement, not reproducible from this branch; build records 5.2.3 actual | §15.3 |
| File bytes | **28,008 provisional** (uncommitted Blender 4.0.2 prototype; not a 5.2.3 file-size result); cap **49,152** | B | provisional planning measurement; build records actual | §15.3, §7.8 |

The flange/web/fastener rows marked **labeled placeholder** are illustrative placeholders, not measured aftermarket dimensions. The spec does not present them as a specific brand's part.

### 4.3 Construction

- **Stock-interface H-beam:** the big-end housing/cap, small-end eye, journal bores and axial width are the stock model's; the variant changes only the shank cross-section and the cap-fastener profile.
- **Beefier shank:** wider flange outer Y (30.343 / 18.568 mm vs 26.129 / 16.187), thicker flanges (8.177 vs 6.288 mm), and a thicker central web (5.258 vs 4.428 mm). The wider flange is **inward** of the stock bolt-ear envelope, so the variant's overall bounds are identical to stock.
- **12-point cap fasteners:** a stepped 12-sided head with a washer flange inside the stock outer envelope; the stock bolt ears and big-end width are preserved.
- **Watertight:** 0 boundary edges at a 1e-5 m position weld; **10 closed connected components** (big end, small end, web, two flanges, two ears, two bolts, small-end bushing) — the same component count as the stock rod, so the M11 cap builder can slice it.
- **No new pivot, no animation/skinning/morph targets; no textures/UVs; no `if_*` markers.** The origin is the stock big-end bore pivot; `extractAllPartPrimitives` bakes the node transforms into the part-local frame once, and the runtime moves the whole batch by the existing kinematics.
- **Materials:** three untextured `MeshStandardMaterial`s in the stock family (`0.30,0.32,0.36` metal 0.85 rough 0.42 steel; `0.09,0.10,0.12` metal 0.85 rough 0.35 fasteners; `0.56,0.38,0.16` metal 0.88 rough 0.32 bushing). The variant does **not** claim a different alloy/colour; the visible signature is geometry, not material.

### 4.4 Datum and placement

| Datum | Variant value | Stock value | Tolerance |
| --- | --- | --- | --- |
| Big-end bore axis | `(0, 0, 0)` | `(0, 0, 0)` | 1e-6 m |
| Small-end centre | `(0, 0, 163.0)` mm | `(0, 0, 163.0)` mm | ±0.05 mm |
| Big-end axial width | 27.676 mm | 27.676 mm | ±0.05 mm |
| Overall bounds | X ±13.838, Y ±48.725, Z −42.143…186.805 mm | identical | ±0.10 mm |
| Beam flange outer Y | 30.343 mm (big) / 18.568 (small) | 26.129 / 16.187 | ±0.20 mm |

The variant is positioned by the **existing** `applyV8KinematicState` (the same matrices as the stock conrod batch). There is no new mount, no scene-placed transform, no catalog `explodeVectorMm`; the M4 internal explode pipeline moves it with the rest of the assembly.

### 4.5 Clearance / placement audit (computed, to be re-run at build)

| Check | Arithmetic | Result | Verdict |
| --- | --- | ---: | :---: |
| Inter-rod axial gap on the shared pin | `2 × 14.2 − 27.676` | **0.724 mm** | **PASS** (unchanged; 28.4 mm width would give 0.0) |
| Rod outer envelope to bore wall | `103/2 − 48.725` | **2.775 mm** | **PASS** (unchanged; bolt ears dominate) |
| New beam flange to bore wall | `103/2 − 30.343` | **21.157 mm** | **PASS** |
| New beam flange to piston outer radius (conservative) | `51.425 − 30.343` | **21.082 mm** | **PASS** (the skirt inner surface is further away) |
| Crank web / cap-ear spacing | big-end width and ear X unchanged | **stock** | **PASS** |
| Shell containment (M3/M10 sweep) | variant outer envelope identical to stock; new material inward | **unchanged** | **PASS** |
| Small-end eye / piston-pin bore | stock geometry preserved | **stock** | **PASS** |

The variant's **outer bounding envelope is identical to the stock rod**; every changed surface (wider flange, thicker web, stepped head) lies inside the stock envelope or inside the stock bolt-ear Y envelope. That is the strongest clearance argument: the M3/M10 shell containment and the shared-pin/inter-rod layout are unchanged. The new **beam** surface is at least **21.157 mm** from the bore wall and **21.082 mm** from the piston outer radius; the new **fastener** profile stays inside the stock bolt-ear envelope (2.775 mm to the bore wall, unchanged from the stock ears).

### 4.6 Recorded but not adopted

| Item | Value / claim | Why not adopted |
| --- | --- | --- |
| BoostLine stock-matching big-end width | **28.4 mm** (1.119 in) | The stock 27.676 mm width leaves a **0.724 mm** inter-rod gap; 28.4 mm would close it to 0.0 mm on the shared pin. Recorded, not adopted. |
| Callies aftermarket rod journal | **2.480 in** | The stock model uses the published GM **62.9 mm** (2.476 in) journal; the variant must fit the stock crankpin. Recorded, not adopted. |
| Callies typical weight | **1,182 g** | No mass/inertia consumer in the sim; the model has no mass property. Recorded, not modelled. |
| Manley I-beam | 6.417 in c2c, I-beam | The shipped rod is an H-beam; the catalog does not specify beam type. Switching beam type would be a different visual claim. Recorded, not adopted. |
| Specific aftermarket flange/web dimensions | **NOT PUBLISHED** | The M13 values are labeled placeholders; the published evidence is qualitative. |
| Stock rod "I-beam" wording in `docs/M7-DATA.md` §3 | one stale register row | The build code and GLB are H-beam; the M7 row is stale wording, not a different asset. Corrected in the M13 docs, not by editing M7. |

---

## 5. Integration — renderer, UI, state

### 5.1 New pure module: `src/renderer/internalVariants.ts`

A Three.js-free module (importable by Node tests) owns:

- `ROD_VARIANT_MODEL_PATH = 'models/variants/rot_conrod_c1_forged.glb'`.
- `ROD_VARIANT_TRIANGLE_CAP = 1_400` (**the single source of truth**: `partVariants.ts` imports this constant; it is not repeated as a literal), `ROD_VARIANT_STOCK_TRIANGLES = 1_180`, `ROD_VARIANT_INSTANCES = 8`, `ROD_VARIANT_SCENE_DELTA_CAP = (1_400 − 1_180) × 8 = 1_760`.
- `ROD_VARIANT_MAX_FILE_BYTES = 49_152`.
- `ROD_VARIANT_ROOT_NAME = 'rot_conrod_c1_forged'`, `ROD_VARIANT_SMALLEND_NAME = 'rot_conrod_smallend_c1_forged'`, `ROD_VARIANT_SMALLEND_Z_MM = 163.0`, `ROD_VARIANT_BIG_END_WIDTH_MM = 27.676`, `ROD_VARIANT_BEAM_FLANGE_Y_MM = 30.343`.
- `INTERNAL_VISUAL_SLOTS = ['pistons', 'rods'] as const`.
- `isInternalVisualSlot(slotId)`.
- `computeInternalVariantSceneDelta(selections)` — returns the **cap** delta for selected internal variants (pistons +2,944 at the M8 piston cap; rods +1,760 at the rod cap; both +4,704), used by the budget guard and the pure swap test.
- `computeRodVariantSceneDelta(trianglesPerInstance)` — returns `(trianglesPerInstance − 1,180) × 8`; the test uses `1,372` for the prototype and `1,400` for the cap.
- `computeCombinedInternalSceneTriangles(baseNonPistonTriangles, currentRodTriangles, currentPistonTriangles)` — one shared formula: `baseNonPistonTriangles + currentRodTriangles + currentPistonTriangles`, where `baseNonPistonTriangles` **excludes** the stock conrod. With `base = 221,984`, rod cap `11,200` and low-comp piston `41,600` it returns **274,784**; with the stock rod `9,440` it returns **273,024** (the value that would silently drop the rod delta). The renderer calls this same formula from both the rod and piston swaps.
- `resolveVariantLoadFailure(configuredVariantIds, failedVariantIds)` — pure settle helper returning the failed-id list and `variantsLoaded = true` once every configured load has settled; test 12 exercises it, and the browser failure case in acceptance 8 exercises the real path.
- `INTERNAL_VISUAL_DISPOSITIONS` — the 24-entry machine-checkable register: `{ id, slotId, kind: 'variant-model' | 'stock' | 'no-visual', reason, evidence, ownerDecision? }`.
- `CAM_OWNER_DECISION = 'OD-1-A'` and `CAM_OWNER_DECISION_TEXT` (the exact OD-1 text).
- `ROD_VARIANT_ILLUSTRATIVE_NOTE` — the one-line docs/source note that the flange/web/12-point magnitudes are placeholders.

No Three.js import; `src/core/**`, `src/perf/**`, `src/config/**` and `catalog/**` are untouched by this module.

### 5.2 `src/renderer/partVariants.ts` — two additive edits

1. `VISUAL_VARIANT_SLOTS` becomes `[...EXTERNAL_VISUAL_SLOTS, 'pistons', 'rods']`.
2. `VARIANT_TRIANGLE_CAPS` gains `rods_forged: ROD_VARIANT_TRIANGLE_CAP`, **imported from `./internalVariants`** (not a second `1400` literal); the total variant cap becomes `10,800 + 5,200 + 1,400 = 17,400` (the M8 "all variant files ≤ 16,000" is superseded by the M13 record; the **scene** budget is unchanged).

`EXTERNAL_VISUAL_SLOTS`, `EXTERIOR_PRESERVED_SUBTREES`, `EXTERIOR_PRESERVED_TRIANGLES` and `SHELL_PARTS_REPLACED_BY_SLOT` are unchanged — `rods` is internal and replaces no shell subtree.

### 5.3 `src/renderer/engineScene.ts` — additive changes only

1. **State:** `loadedInternalPrimsById` (replacing the piston-only map), `stockConrodBatch: InstancedPartBatch | null`, `rodBatch: InstancedPartBatch | null`, `currentRodBatch: InstancedPartBatch | null`, `currentPistonSet: PistonBatchSet | null`, `baseNonPistonInternalTriangles = 0`, `attachedRodVariantId: string | null`, and the rod stats. `stockConrodBatch` is the existing stock `conrod` batch; `currentRodBatch` is whichever rod batch is attached; `currentPistonSet` is whichever piston set is attached.
2. **Preload:** in the existing `configuredVariants` loop, treat `desc.slotId === 'pistons' || desc.slotId === 'rods'` as an internal part-local load: `loadPartGltf` + `extractAllPartPrimitives`, add geometries/materials to the existing disposal and clippable sets, store in `loadedInternalPrimsById`. Do **not** call `loadVariantScene`, do **not** add a static cap source, do **not** attach to the scene root. `variantsLoaded` still settles on success or failure; a failed rod load goes to `failedVariantIdSet`, leaves the stock rods in place, and does not hang the benchmark.
3. **Batch lifecycle:** `ensureVariantRodBatchBuilt()` mirrors `ensureVariantPistonBatchSetsBuilt()`: it returns immediately unless `v8Batches !== null` and the `rods_forged` prims are present, builds the variant batch **once**, and registers a **dynamic** cap source in the same call:
   ```
   const rodRes = createInstancedBatch('conrod_variant', rodPrims, 8, v8Batches.root, undefined, false);
   rodBatch = registerInstancedBatchForDispose(rodRes.batch);
   registerInstancedCapSource(dynamicCapSources, 'conrod_variant', rodBatch, false);
   ```
   Call it at the top of `syncVisualVariants`, **after** `ensureVariantPistonBatchSetsBuilt()`. A preload branch must not dereference `v8Batches.root`; the lazy call is the lifecycle fix.
4. **One shared total (the QA-02 fix).** Define exactly one accumulator and use it in **both** swap branches:
   ```
   const recomputeCombinedInternalTriangles = (): void => {
     if (!v8Batches || !stockConrodBatch || !stockPistonBatchSet) return;
     v8Batches.totalTriangles = computeCombinedInternalSceneTriangles(
       baseNonPistonInternalTriangles,
       (currentRodBatch ?? stockConrodBatch).totalTriangles,
       (currentPistonSet ?? stockPistonBatchSet).totalTriangles,
     );
   };
   ```
   At the `v8Batches` construction site (replacing the current `totalTriangles = nonPistonInternalTriangles + stockPistonBatchSet.totalTriangles`):
   ```
   nonPistonInternalTriangles = nonPistonBatches.reduce((sum, b) => sum + b.totalTriangles, 0);
   stockConrodBatch = conrod;
   currentRodBatch = conrod;
   currentPistonSet = stockPistonBatchSet;
   baseNonPistonInternalTriangles = nonPistonInternalTriangles - conrod.totalTriangles;
   const totalTriangles = computeCombinedInternalSceneTriangles(
     baseNonPistonInternalTriangles,
     currentRodBatch.totalTriangles,
     currentPistonSet.totalTriangles,
   );
   ```
   `baseNonPistonInternalTriangles` **excludes the stock conrod** (221,984 at the shipped counts) and is the only base term. The old piston assignment `v8Batches.totalTriangles = nonPistonInternalTriangles + nextSet.totalTriangles;` is **deleted**; the piston branch ends by setting `currentPistonSet = nextSet` and calling `recomputeCombinedInternalTriangles()`. The rod branch ends by setting `currentRodBatch = next` and calling the same function. Order is therefore no longer load-bearing: external/shell pass → **rod pass** → **piston pass**, and the last branch to run recomputes the same three-term sum.
5. **Swap:** in `syncVisualVariants`, resolve `selectedRodDesc` (`slotId === 'rods'`) and `desiredRodId` (the id only if its prims are loaded). If `desiredRodId !== attachedRodVariantId`:
   - for every mesh of the previous batch (`currentRodBatch ?? stockConrodBatch`), set **`m.visible = false`** and call `v8Batches.root.remove(m)`. Removal alone is not enough: `buildCapGeometry` skips a source only through `isObjectAndAncestorsVisible`, which walks the `visible` flags (`src/renderer/sectionCaps.ts:1358-1366`). Set the flag on every removed mesh, copying the existing piston swap (`engineScene.ts:1170-1181`);
   - for every mesh of the next batch (`rodBatch` when selected, else `stockConrodBatch`), set `m.visible = true` and add it to `v8Batches.root`;
   - set `v8Batches.conrod = nextBatch`; set `currentRodBatch = nextBatch`; set `attachedRodVariantId = desiredRodId`;
   - call `recomputeCombinedInternalTriangles()`.
   The stock `conrod` cap source stays registered; because its meshes are now **hidden and removed**, it contributes 0 cap triangles, while the variant source contributes when visible. Run **one** `applyV8KinematicState` after both the rod and piston passes (not one per swap), so a paused scrub updates instantly.
6. **Stats:** add `rodVariantActive: boolean`, `rodVariantTriangles: number` (per-instance GLB triangles) and `rodSceneTriangles: number` (batch total, `× 8`) to `EngineRenderStats`; add `rodVariantActive` to `getVisualVariantState()`, and include `rods_forged` in `activeVariantIds`/`attachedVariantIds` when selected/attached. `visibleSceneTriangles` continues to use `v8Batches.totalTriangles`, which now reflects the shared three-term total; `variantSceneTriangles` adds the active rod batch's triangles for reporting. `pistonVariantActive` keeps its meaning.
7. **Dispose:** dispose the rod batch's `InstancedMesh` objects through the existing `instancedMeshesToDispose` set; the primitive geometries/materials are already in the disposal sets. No new render target/texture/geometry ownership.
8. **No new render pass:** `renderer.render(` remains exactly one call; no `WebGLRenderTarget`, no stencil, no `setRenderTarget`, no `overrideMaterial`, no new cap material.

### 5.4 `src/ui/engineControls.ts` — text only

- Runtime subtitle → `Milestone 13 — Internal Part Variants`.
- Build note (`m8-build-note`) → `3D variants: exterior parts render with the Exterior shell shown (Exterior or X-Ray); the low-compression piston and forged connecting rods render in the internal assembly.`
- No new checkbox, no new control, no change to the Build dropdowns/compatibility/Dyno/Sound/Views. The M12 `Intake cover` checkbox and note are unchanged.

### 5.5 `src/ui/referenceFrames.ts` — two new frames

Add after RF-20:

```ts
'RF-21': {
  thetaDeg: 90,
  position: [1.28, -1.08, 0.74],
  target: [0.31, -0.05, 0.18],
  exterior: false,
  explodePercent: 100,
  sectionMode: 'off',
  xray: false,
  labels: false,
  variants: ['rods_forged'],
},
'RF-22': {
  thetaDeg: 0,
  position: [1.06, -0.54, 0.48],
  target: [0.29, -0.02, 0.14],
  exterior: false,
  explodePercent: 0,
  sectionMode: 'x',
  sectionPositionMm: 388.3,
  xray: false,
  labels: false,
  variants: ['rods_forged'],
},
```

The camera poses are exactly the committed **RF-10** and **RF-6** camera positions/targets/θ/explode/exterior states, not new camera positions. RF-22 is intentionally **not** RF-6's section state: RF-6 cuts at `X = 402.5 mm`, which is the centre of the 0.724 mm inter-rod gap, so it cuts no rod. RF-22 moves the plane to `X = 388.3 mm`, the seat of the station-0 RH rod, which the span arithmetic in §8.2/§15.9 proves is inside the rod. §8.2 states why the committed camera poses are the honest choice.

### 5.6 `src/main.ts` — frozen

No change. `visualVariants` is built from every catalog entry with `modelPath !== null`, so `rods_forged` is picked up automatically; `visualVariantsForBuild` resolves it; the `?rf=` and `?benchmark=1&variants=rods_forged` paths use the existing `slotForVariantId` / `setBuildSelection` machinery. The benchmark load gate already waits for `variantsLoaded` (all variant loads settled).

### 5.7 `catalog/modified.json` — one value

Change only `rods_forged.modelPath` from `null` to `"models/variants/rot_conrod_c1_forged.glb"`. `explodeVectorMm` stays `[0,0,0]`, `performanceParams` stays `{}`, `compatibility` stays `{}`, `provenance` stays `"illustrative"`, `notes` unchanged. No other catalog value changes; `catalog/stock.json` and `catalog/schema.json` are byte-identical.

### 5.8 Failure behavior

If the rod GLB is missing or fails to parse, the renderer logs `Failed to load visual variant "rods_forged"`, adds it to `failedVariantIds`, leaves the **stock** rods visible, and sets `variantsLoaded` (the load settled) so the benchmark does not hang. The Build panel still shows the selection; the scene shows stock rods. This is the same fallback as the M8 external variants and is a build failure caught by §9 test 1/12, not a normal user state.

### 5.9 Why no new loader, catalog slot or asset class

`extractAllPartPrimitives` + the existing `InstancedMesh` batch/swap path already do exactly what a part-local internal variant needs (M8 piston precedent). The rod is not a new slot or a new asset class; adding a loader or a catalog entry would expand the test surface and violate D-032/D-038. The only new production module is the pure disposition/constant module `internalVariants.ts`.

---

## 6. Interaction contract

### 6.1 Build selection and stock restore

- `rods` dropdown: `rods_stock` (default) → stock conrod batch; `rods_forged` → variant batch. The selection is `visualVariantsForBuild`-driven and fires on every Build change, including while the dyno shows a compatibility violation (there is no rods compatibility rule).
- Restoring `rods_stock` removes the variant batch and restores the stock batch exactly; the rendered stock scene is the M12 scene.
- Selecting `rods_forged` with any other build (including `pistons_lowcomp` + `turbo_large`) works; both internal swaps are independent.

### 6.2 Explode

The rod variant uses the **existing M4 internal explode pipeline** — the conrod path uses `computeStationSpreadOffsetXMm(station.centerXMm, layout.blockCenterXMm, explodeFactor)` to offset its pin seat, which is the M4 station-spread rule (`engineScene.ts:766-767`, `:818`); it does not use the catalog `explodeVectorMm`. `rods_forged.explodeVectorMm` is `[0,0,0]`. At Explode 100 %, the rods separate with the rest of the internal assembly exactly as the stock rods do; the variant does not add a second explode vector or drift.

### 6.3 M11 section cutaways

- The rod variant is a **dynamic** cap source (`conrod_variant`, instanced 8, `static:false`, `skipWhenGhosted:false`), registered alongside the stock `conrod` source. The cap builder slices either batch. The stock source is skipped only when **every removed mesh has `visible = false`**; the swap in §5.3.5 makes that mandatory, so a removed-but-visible stock batch cannot double-cap.
- The variant geometry is watertight (0 boundary edges, 10 closed components), so the cap is a true solid cross-section, not a chord-closed shell.
- The M11 cap ceiling (`SECTION_CAP_MAX_TRIANGLES = 16,000`) is unchanged; the variant adds rod cap triangles only when the plane cuts a rod and the variant is selected. **RF-22 and the cap measurement use `X = 388.3 mm`, not `X = 402.5 mm`**: the station-0 RH rod spans `374.462–402.138 mm` on X, so 388.3 mm cuts it and 402.5 mm misses it (the plane is in the 0.724 mm gap). The build records the actual cap triangles at `X = 388.3` (and `Y = −185` for the existing side cut); a cap total above 16,000 is a stop-and-report.
- No new cap material, hatch, colour, stencil, render target or extra pass. The stock rod cap source and the other dynamic sources are unchanged.

### 6.4 X-Ray and exterior context

The rod variant is **internal**: it renders with Exterior off, with Exterior on and X-Ray on (the shell is ghosted), and in the exploded/cutaway views. It is not visible through an opaque exterior shell, exactly like the stock rods. It does not join the exterior ghost registry (it is not a shell material), does not hide any shell subtree, and does not interact with the M12 cover (which is exterior-only).

### 6.5 Labels

No new label anchor. The existing `Connecting rod`/`Piston`/internal labels and the 23-anchor rules are unchanged; the rod variant is the same part at the same anchors, so the labels track it automatically. The firing highlight remains on the pistons only; the rods use the **stock forged-steel material family/values** (the variant has its own three materials — `mat_conrod_forged_steel`, `mat_conrod_bolts`, `mat_conrod_bushing` — with the same PBR family/values as stock) and are not emissive.

### 6.6 M8 variants and M12 cover

- The five M8 variants (turbo, intake, exhaust, intercooler, pistons) are unchanged in GLB, `modelPath`, `explodeVectorMm`, compatibility and cap source. `pistons_lowcomp` + `rods_forged` can be selected together; the two internal swaps are independent and the firing-highlight piston batch is unaffected.
- The M12 cover (`intake_cover_lly.glb`, `Intake cover` toggle, RF-18…RF-20) is unchanged. It is exterior context only; with Exterior off the cover is hidden and the rods variant is visible.
- No catalog compatibility rule is added: `rods_forged.compatibility` stays `{}`; the M6 rules for `pistons_lowcomp` (`requires turbo_large`) and `injectors_plus30` (`requires cp3_stroker`) are unchanged.

### 6.7 Quality tiers, pause, hidden tab

- **Full and Phone:** identical rod geometry and materials; the existing shadow-map/pixel-ratio tier differences apply. The rod batch casts/receives shadows on Full (as the stock rod does); Phone has no shadow map.
- **Paused:** the selected rod batch persists; a sectioned paused frame keeps its cap (dynamic source rebuilds per frame).
- **Hidden tab:** no frames are rendered; on return the selection, explode and cap state are unchanged.

### 6.8 Defaults and persistence

- Default `rods_stock`; no `localStorage`; resets on reload, like every Build selection.
- Reference frames set the variant explicitly; frames without `variants` default to stock.
- The benchmark `variants=rods_forged` parameter is explicit; omitted means stock.

---

## 7. Budgets (D-033)

### 7.1 The constraint

`docs/M2-MEASUREMENTS.md:120-126` sets the normative per-tier budgets:

| Metric | Desktop (Full) | Phone |
| --- | ---: | ---: |
| Scene asset triangles (single pass) | ≤ 360,000 | ≤ 320,000 |
| Submitted triangles / frame (incl. shadow pass) | ≤ 700,000 | ≤ 400,000 |
| Draw calls / frame (incl. shadow pass) | ≤ 250 | ≤ 120 |
| Texture + HDRI VRAM | ≤ 64 MiB | ≤ 32 MiB |
| Frame time p95 @ 900 rpm | ≤ 16.7 ms | ≤ 33.3 ms |

No D-033 budget is raised for M13.

### 7.2 Current shipped scene — measured this session

Exact GLB parse + code instance counts (the same triangle definition the M2–M12 tables use). Runtime calls/VRAM/p95 are the M12 measured values, quoted as a cross-check only; the build re-measures them on the reference GPU (§15.1).

| State | Scene tris | Calls | Submitted tris | VRAM |
| --- | ---: | ---: | ---: | ---: |
| Desktop stock, exterior on | **308,324** | **96** | **579,484** | **20.75 MiB** |
| Desktop worst-case 5 variants | **304,632** | **97** | **568,880** | **20.75 MiB** |
| Phone stock, exterior on | **308,324** | **58** | **307,876** | **4.75 MiB** |
| Phone worst-case 5 variants | **304,632** | **60** | **304,512** | **4.75 MiB** |

Arithmetic: `270,080` internal + `1,080` main shaft + `64` ground + `37,100` shell = `308,324`. Worst: `308,324 − 6,912` (piston swap) `− 6,500` (hidden preserved shell subtrees) `+ 9,720` (external variants) = `304,632`. These match the M11/M12 records and were re-derived from the committed GLBs this session.

### 7.3 The rod variant's cost

| Cost | Value | Source |
| --- | ---: | --- |
| Rod scene triangles (cap) | **1,400 / instance**; full-engine **11,200** | 1,400 × 8 |
| Rod scene triangles (provisional prototype) | **1,372 / instance**; full-engine **10,976** | uncommitted 4.0.2 planning prototype; build re-derives |
| Full-engine delta at cap | **+1,760** | `(1,400 − 1,180) × 8` |
| Full-engine delta at provisional prototype | **+1,536** | `(1,372 − 1,180) × 8` |
| Rod GLB file size | **28,008 B provisional** (uncommitted 4.0.2 prototype, not a 5.2.3 result); **≤ 49,152 B** cap | build records actual; §7.8 |
| Rod draw calls | **0 net** | 3 primitives, same as the stock rod (2 rod + 1 small-end) |
| Rod texture/HDRI VRAM | **+0.00 MiB** | No textures/images/UVs |
| Rod submitted triangles / frame | **+1,760** main pass + **+1,760** desktop shadow pass (phone: +1,760) | castShadow = true, same as stock |
| Rod section-cap triangles | **measured at build; included in the 16,000 ceiling** | dynamic `conrod_variant` source |

### 7.4 Full-engine budget arithmetic (stock and worst case, both tiers)

Using the **cap** 1,400 for conservatism; the provisional prototype (1,372) is lower and does not change the cap rows.

| Metric | D-033 cap (desk / phone) | Stock measured | Stock + rods + cover (cap) | Headroom (desk / phone) | Utilisation (desk / phone) | Worst measured | Worst + rods + cover (cap) | Headroom (desk / phone) | Utilisation (desk / phone) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Scene asset triangles | 360,000 / 320,000 | 308,324 | **311,884** | **48,116 / 8,116** | **86.63 % / 97.46 %** | 304,632 | **308,192** | **51,808 / 11,808** | **85.61 % / 96.31 %** |
| Submitted triangles / frame | 700,000 / 400,000 | 579,484 / 307,876 | **584,804 / 311,436** | **115,196 / 88,564** | **83.54 % / 77.86 %** | 568,880 / 304,512 | **574,200 / 308,072** | **125,800 / 91,928** | **82.03 % / 77.02 %** |
| Draw calls / frame | 250 / 120 | 96 / 58 | **98 / 60** | **152 / 60** | **39.20 % / 50.00 %** | 97 / 60 | **99 / 62** | **151 / 58** | **39.60 % / 51.67 %** |
| Texture + HDRI VRAM | 64 / 32 MiB | 20.75 / 4.75 | **20.75 / 4.75** | **43.25 / 27.25 MiB** | **32.42 % / 14.84 %** | 20.75 / 4.75 | **20.75 / 4.75** | **43.25 / 27.25 MiB** | **32.42 % / 14.84 %** |
| Frame time p95 @ 900 rpm | 16.7 / 33.3 ms | 16.8 / 17.0 ms (M11 detail rows; M12 measured 17.0 / 17.0) | **measured at build** | — | — | same baseline | **measured at build** | — | — |

The `+ rods + cover` columns use the cap 1,400 (rods) and the M12 cover cap 1,800. The provisional prototype rows are **311,660** stock and **307,968** worst (scene), i.e. 224 triangles lower than the cap rows; the cap rows are the conservative numbers and are the ones the acceptance uses.

### 7.5 The derived cap guard (the tightest number)

The M12 budget guard used every variant's **cap**, not the measured asset, which is tighter than the measured worst case. M13 adds the rod cap:

```
308,324 − 6,500 + 10,800 + (5,200 − 4,832) × 8 + 1,800 + (1,400 − 1,180) × 8
= 308,324 − 6,500 + 10,800 + 2,944 + 1,800 + 1,760
= 319,128
```

| Guard | Value | Phone headroom | Desktop headroom |
| --- | ---: | ---: | ---: |
| Derived cap guard | **319,128 / 320,000** | **872 triangles (0.2725 %)** | **40,872 triangles (11.35 %)** |
| M12 guard (before rods) | 317,368 / 320,000 | 2,632 (0.82 %) | 42,632 (11.84 %) |

**This is the tightest number in the milestone.** It is a **PASS**, but the phone headroom is only 872 triangles. The build must:
- measure the actual rod triangles and fail if they exceed **1,400**;
- re-run the full benchmark matrix and record the actual scene/submitted/call/VRAM numbers;
- stop and report if any measured state exceeds the guard or a D-033 cap — **do not raise D-033 and do not silently shrink the asset in the spec**.

### 7.6 Submitted triangles and the shadow pass

The rod batch has `castShadow = true` (like the stock rod), so on **Desktop Full** the delta is counted twice per frame (main + shadow): `+1,760 × 2 = +3,520` at the cap, `+1,536 × 2 = +3,072` at the prototype. Phone has no shadow map: `+1,760` / `+1,536`. The M12 cover has `castShadow = false`, so its +1,800 is main-pass only. The submitted rows in §7.4 use the cap and the correct doubling.

### 7.7 Section state — section-on bound

With Section on and `rods_forged` selected, the rod adds its **scene** triangles (1,400 cap) and its **dynamic cap** triangles (measured at build) on top of the M11 cap total. The M11 cap ceiling is **16,000 combined static + dynamic cap triangles** and the cap meshes add **+2 draw calls**; the rod cap is part of the existing dynamic cap mesh, not a third cap mesh.

The section-on row is **not** bounded by the section-off submitted/call rows. Apply the cap ceiling explicitly:

| Section-on state (rods + cover, cap) | Scene tris | Calls | Submitted tris | Tier caps: scene / submitted / calls |
| --- | ---: | ---: | ---: | --- |
| Desktop stock | 311,884 | 98 + 2 = **100** | 584,804 + 16,000 = **600,804** | 360,000 / 700,000 / 250 |
| Desktop worst | 308,192 | 99 + 2 = **101** | 574,200 + 16,000 = **590,200** | 360,000 / 700,000 / 250 |
| Phone stock | 311,884 | 60 + 2 = **62** | 311,436 + 16,000 = **327,436** | 320,000 / 400,000 / 120 |
| Phone worst | 308,192 | 62 + 2 = **64** | 308,072 + 16,000 = **324,072** | 320,000 / 400,000 / 120 |

The +16,000 is the conservative M11 ceiling for the two cap meshes (both rendered, cap triangles are main-pass only because the cap meshes have `castShadow = false`); the actual count at `X = 388.3` is recorded at build. Scene triangles are unchanged by capping. Acceptance 5 uses the section-off rows for the off cases and these bounds for the rods-on Section X @ 388.3 case. A measured cap total above 16,000, or a section-on submitted/call total above these bounds, is a stop-and-report.

### 7.8 Page weight

The rod GLB is fetched at startup with the other variants (preloaded so selection is instant) and is hidden when stock rods are selected. The **cap** is 49,152 B, a raw startup delta of `49,152 / 10,050,510 = +0.489 %` against the M9 baseline. The uncommitted 4.0.2 prototype is 28,008 B, which would be `+0.279 %`, but that byte count is **not a 5.2.3 result and is not used as a measured page-weight claim**; the build records the actual GLB bytes and the `vite build` JS min/gzip delta. A GLB above 48 KiB is a stop-and-report.

### 7.9 Frame time

The rod adds 1,400 triangles and no draw calls; the build must run the standard `?benchmark=1` 10 s matrix (stock/worst × desktop/phone × rods off/on, plus rods-on with Section X @ 388.3) and record p95. The acceptance target is **p95 within +0.30 ms of the M11 detail rows for the same tier/state (desktop 16.8 ms, phone 17.0 ms; the M12 §7.9 precedent; M12's measured stock row is 17.0 / 17.0 ms)** and **0 dropped frames**. A p95 above the D-033 cap is a stop-and-report.

---

## 8. Visual proof — reference frames

All captures at the standing `1440×900 → 1024×640` convention, production preview, `?rf=…`. The two new frames are added to `docs/REFERENCE_FRAMES.md`; RF-1…RF-20 are unchanged with the rod variant off.

| Frame | Status | Crank angle | Camera position → target (m) | Exterior / views | What it is for |
| --- | --- | ---: | --- | --- | --- |
| **RF-21** | **New** | 90° | `[1.2800, −1.0800, 0.7400] → [0.3100, −0.0500, 0.1800]` (RF-10 camera pose) | **Exterior off**; **Explode 100 %**; Section off; X-Ray off; Labels off; **`rods_forged`** | **Rod appearance:** the variant rods in the exploded internal assembly — the wider/thicker H-beam, the stepped 12-point cap fasteners (illustrative), the stock big-end/small-end interface, and no clipping of the pistons/crank/adjacent rods. |
| **RF-22** | **New** | 0° | `[1.0600, −0.5400, 0.4800] → [0.2900, −0.0200, 0.1400]` (RF-6 camera pose) | **Exterior off**; Explode 0; **Section X @ 388.3 mm**; X-Ray off; Labels off; **`rods_forged`** | **Rod section:** the station-0 RH variant rod's solid, hatched longitudinal cross-section at the M11 cut plane, continuous with the existing cap convention; the section does not open a gap or a false cavity. |

RF-21/RF-22 reuse the committed RF-10/RF-6 camera positions/targets/θ/explode/exterior states. RF-22 changes the section plane from RF-6's `402.5 mm` to `388.3 mm`; that is the one deliberate deviation, and §8.2/§15.9 prove it cuts the rod.

### 8.1 Checklist per frame

**Shared (both):**
1. The variant is present on all eight rods; the stock rods are not also visible (no double geometry).
2. The H-beam is visibly wider/thicker than the stock rod; the cap fasteners read as a stepped 12-point head (an illustrative placeholder, not a published feature).
3. The rod keeps the stock big-end width and journal; the cap sits on the crankpin, and the small end sits on the piston pin.
4. No rod intersects the piston skirt, crank web, adjacent rod, block or oil pan.
5. The firing-highlight colour remains on the pistons only; the rods are not emissive.
6. The rod material reads as forged steel with a dark fastener and bronze bushing; no texture/decal.

**Per-frame:**
- **RF-21:** the exploded rods are separated with the rest of the internal assembly; the beam/flange difference is legible at this camera; **the pose is the committed RF-10 camera pose, but RF-10's variant set was `turbo_large + pistons_lowcomp`, so all-eight visibility and legibility are verified at G-FRAME-M13, not claimed from RF-10's image**; the labels (off) do not obscure the part.
- **RF-22:** the cut face is a flat, hatched solid at **X = 388.3 mm, through the station-0 RH rod**; there is no open chain, gap, or floating cap; the rod section is continuous with the M11 cap convention; the other parts cut by the plane follow the same convention and do not obscure the rod face.

### 8.2 Why these poses are the honest choice (the M12 lesson, D-047)

M12's planning session had no WebGL and pinned poses copied from other frames; two failed at build time because the copied camera did not actually see the cut face. M13 applies the lesson:

- **RF-21 is not a new camera pose.** It is exactly the committed **RF-10** camera position/target/θ/explode/exterior state — the M8 exploded internal view whose committed image shows the rod region (a `Connecting rod` label and rod-shaped parts). RF-10's committed variant set was `turbo_large + pistons_lowcomp`; RF-21 selects only `rods_forged`, so the **all-eight count and legibility are G-FRAME-M13 checklist checks, not a claim derived from RF-10's PNG**.
- **RF-22 is a committed camera pose with a corrected section state, not RF-6's section state.** RF-6's `X = 402.5 mm` is the station-0 centre, which is the centre of the `2 × 14.2 − 27.676 = 0.724 mm` inter-rod gap: it cuts no rod. The station-0 RH rod seat is `402.5 − 14.2 = 388.3 mm`; its big-end X interval is `388.3 ± 13.838 = 374.462–402.138 mm`, so **388.3 mm is 13.838 mm inside each rod face** and outside every other rod's interval (§15.9). The section plane keeps `X ≤ 388.3 mm` (`buildSectionPlane`: normal `(−1,0,0)`), the camera is at `X = 1.06 m > 0.3883 m`, so the camera is on the removed side looking at the **+X cut face**. A projection through the RF-6 camera at 1024×640 puts the rod cut-face extremes inside the frame (NDC x `−0.143…0.131`, y `−0.466…−0.064`; §15.9). The cut face is therefore rod geometry capped by construction, not a hope deferred to the build gate.
- **No new camera position is invented in this VM.** The planning session has no WebGL (§15.1), so a novel close-up would be an unverified guess. The two committed internal camera poses are the honest choice; RF-22's section position is the one deliberate, arithmetic-driven change.
- **Build gate G-FRAME-M13:** on the reference GPU, capture RF-21/RF-22 and verify every checklist item. If the rod variant is not legible, or the cap is missing, **stop and report** with a proposed pose; do not silently re-pin the frames. A pose deviation needs owner approval and is recorded in `docs/M13-MEASUREMENTS.md` / `DECISIONS.md` following the D-047 precedent.

### 8.3 Invariance

- With `rods_stock` selected, RF-1…RF-20 are re-captured and compared **visually** against the committed PNGs by the reviewer, with the subtitle masked; the 3D viewport content must be visually unchanged because the variant batch is hidden and the stock batch is untouched. This is a **manual visual gate** (no pixel-diff harness is committed); the reviewer records the comparison and any difference in `docs/M13-MEASUREMENTS.md`; any visible difference is a stop-and-report.
- With `rods_forged` selected, only RF-21/RF-22 are new; no existing frame is re-baselined.
- No frames are added for the four no-visual entries — a "frame" of an unchanged scene would prove nothing. Their disposition is documented and machine-checked in §9 test 10.

---

## 9. Tests

The existing suite (104 tests, 21 files at M12) must pass. Test-file accounting: **2 new files** (`src/renderer/rodVariant.test.ts`, `src/renderer/internalVariants.test.ts`) + **6 edited files** (`src/catalog/modified.test.ts`, `src/catalog/visualVariants.test.ts`, `src/renderer/partVariants.test.ts`, `src/renderer/intakeCover.test.ts`, `src/ui/referenceFrames.test.ts`, `src/ui/uiText.test.ts`). The pre-M13 catalog fixture `src/catalog/__fixtures__/modified.pre-m13.json` is test data, not a test file. No other test file is edited; `src/assets/**` is frozen.

**`src/renderer/rodVariant.test.ts` (new; Node-only; `node:fs` GLB parse + pure module; no WebGL):**

1. **Asset contract.** `public/models/variants/rot_conrod_c1_forged.glb` exists; file size ≤ **49,152 B**; root `rot_conrod_c1_forged` with child `rot_conrod_smallend_c1_forged` at `(0, 0, 163.0) mm`; exactly **3** `MeshStandardMaterial`s; no images/textures/UVs/skins/morphs/animations and no `if_*` markers; indexed `POSITION` + `NORMAL` triangles; **≤ 1,400** tris; bounds X ±13.838, Y ±48.725, Z −42.143…186.805 mm (±0.10 mm); big-end axial width **27.676 ±0.05 mm**. Assert the visible-signature geometry, not just the big-end flange: **beam flange outer Y 30.343 ±0.20 mm (big end)**, **18.568 ±0.20 mm (small end)**, **flange thickness 8.177 ±0.20 mm**, **web half-width 5.258 ±0.20 mm**. These four values are measured by the same vertex extraction the build log records (isolate the flange/web vertices by Y/Z band and take the extrema); if a value is not independently extractable from the GLB, the test fails rather than passing on the build script's own declaration. The **1,372-triangle prototype is provisional and is not asserted here**; the cap and the required signature dimensions are. Watertight (0 boundary edges at 1e-5 m) with **10** closed components. *Catches: a missing/renamed asset, a texture/decal smuggled in, a stray marker, a budget or file-size overrun, a wrong pivot or bounds, a rod that would close the inter-rod gap, a beam that silently drifts thinner, and an open mesh that the M11 cap builder would chord-close into a fake solid.*
2. **Stock interface preservation.** The variant's 163.0 mm c2c, 62.9 mm journal, 34.5 mm pin and 27.676 mm big-end width agree with the stock `rot_conrod_c1_stock.glb` and the code-derived values (`2 × 0.22 × 62.9` for the width; `build_cylinder1.py` for the flange/web) within **±0.05 mm**; the small-end child translation is 163.0 ±0.001 mm. `assets-src/dimensions.json` supplies the journal/pin/seat inputs, but it has **no width/flange/web keys** and is not cited as their source. The 163.0 mm c2c is a **published length whose c2c basis is inferred/corroborated** (survey §3.1). *Catches: a builder changing the rod length/journal to make the shape fit, which would break the kinematics or the shared-pin layout.*
3. **Catalog closure (edit `src/catalog/modified.test.ts` and `src/catalog/visualVariants.test.ts`).** In `modified.test.ts`, add `rods_forged` to the expected visual map (`modelPath: 'models/variants/rot_conrod_c1_forged.glb'`, `explodeVectorMm: [0,0,0]`); the map has 6 visual entries and the other 6 modified entries stay null/zero. In `visualVariants.test.ts`, exactly **6** entries have a non-null `modelPath`; the expected set is the 5 M8 ids + `rods_forged`; `rods_forged.modelPath` is exactly `models/variants/rot_conrod_c1_forged.glb`; `rods_forged.explodeVectorMm` is `[0,0,0]`; the other **18** entries have `modelPath: null` and `[0,0,0]`; all 12 stock entries remain null. `visualVariantsForBuild(fullVisualBuild)` returns the 6 in slot order; the non-visual modified build (`injectors_plus30`, `cp3_stroker`, `tune_performance`, `cam_performance`, `heads_ported`) returns `[]`; `slotForVariantId('rods_forged') === 'rods'`. *Catches: a second visual entry sneaking in, a wrong path, a stock entry with a model, a rods entry missing, a non-visual entry silently gaining a model.*
4. **Visual slot lists and budget guard (edit `src/renderer/partVariants.test.ts`).** `VISUAL_VARIANT_SLOTS` is `[...EXTERNAL_VISUAL_SLOTS, 'pistons', 'rods']`; `VARIANT_TRIANGLE_CAPS.rods_forged === ROD_VARIANT_TRIANGLE_CAP` and `=== 1_400`; a source check asserts `partVariants.ts` contains **no second `1400` literal** and imports the constant from `./internalVariants`; the external list and `SHELL_PARTS_REPLACED_BY_SLOT` are unchanged (no rods entry); the total variant cap is **17,400**; the derived worst-case scene is **319,128 ≤ 320,000** with phone headroom **872** and desktop **40,872**; draw calls are unchanged by rods (3 primitives, same as stock) and the cover's +2 gives **98/60 stock, 99/62 worst**. *Catches: a rod cap that breaches the phone budget, a missing slot list entry, a shell replacement mistakenly mapped to rods, a cap literal that can drift from the asset test, a budget test that ignores the new variant.*
5. **Swap logic and combined accounting (pure module + source check).** `computeInternalVariantSceneDelta` returns 0 for stock, **+1,760** for `rods_forged` at the cap, **+2,944** for `pistons_lowcomp` at the M8 cap, and **+4,704** when both are selected; `computeRodVariantSceneDelta(1,372)` returns **+1,536** and `computeRodVariantSceneDelta(1,400)` returns **+1,760**; `isInternalVisualSlot('rods')` is true. **The combined test that fails if the rod delta is dropped:** `computeCombinedInternalSceneTriangles(221_984, 11_200, 41_600) === 274_784` (stock internal 270,080 + piston 2,944 + rod 1,760), and the stock-rod control `computeCombinedInternalSceneTriangles(221_984, 9_440, 41_600) === 273_024`; assert `274_784 !== 273_024` so a piston-only total cannot pass. `engineScene.ts` contains `computeCombinedInternalSceneTriangles`, one `recomputeCombinedInternalTriangles` called from **both** the rod and piston branches, the `desc.slotId === 'pistons' || desc.slotId === 'rods'` preload branch, `ensureVariantRodBatchBuilt`, `attachedRodVariantId`, the `v8Batches.conrod` swap, and `registerInstancedCapSource(dynamicCapSources, 'conrod_variant'`; it contains **no** `nonPistonInternalTriangles + nextSet.totalTriangles` assignment. *Catches: a default-on rod, a wrong delta, a selection that silently keeps the stock rods, a missing cap source, and the QA-02 order-dependent overwrite that would lose **+1,760** (or **+1,536** at the provisional prototype).*
6. **Cap compatibility and the rod-cutting plane.** The variant rod is registered as a **dynamic** cap source with `instanced:true`, `count:8`, `static:false`, `skipWhenGhosted:false`; the stock `conrod` source remains; `SECTION_CAP_MAX_TRIANGLES` is `16_000`; `renderer.render(` appears exactly once; no `new THREE.WebGLRenderTarget(`, `stencil: true`, `setRenderTarget`, or `overrideMaterial` is added; the cap material is unchanged. **Node behavior check:** load the variant GLB through `extractPartPrimitives`/`wrapInPartLocalFrame`, place one instance at the station-0 RH rod seat (`X = 388.3 mm`), build a `CapSource`, and call `buildCapGeometry` at `X = 388.3`: it must return **> 0** cap triangles; the same source at `X = 402.5` must return **0** rod triangles (the plane is in the gap); a stock source whose meshes are removed **and** `visible = false` must return **0**; the combined cap total must be **≤ 16,000**. *Catches: a visible-but-uncapped rod, an extra pass, a cap that disappears in section, a new cap material, a removed-but-still-capped stock rod, and a section plane that does not intersect the rod.*
7. **Performance neutrality.** `computeCurve`/`computeDetails` for a build with `rods_forged` exactly equal the stock build's values; `checkCompatibility` returns `[]` for `rods_forged` alone and for `rods_forged + pistons_lowcomp + turbo_large`; `rods_forged.performanceParams` is `{}`; `provenance` is `"illustrative"`. *Catches: a performance parameter accidentally added, a compatibility rule, a variant that changes the dyno.*
8. **Reference frames (edit `src/ui/referenceFrames.test.ts`).** RF-21/RF-22 exist after RF-20; each validates through the existing loop; both have `variants: ['rods_forged']`, `exterior: false`, `xray: false`/undefined, `labels: false`/undefined, `intakeCover` undefined/false; RF-21 has `explodePercent: 100` and `sectionMode: 'off'`; RF-22 has `explodePercent: 0`, `sectionMode: 'x'`, `sectionPositionMm: 388.3`; RF-21's camera position/target/θ equals RF-10's, and RF-22's camera position/target/θ/explode/exterior/sectionMode equals RF-6's **but its `sectionPositionMm` is 388.3, deliberately not RF-6's 402.5**; RF-1…RF-20 are unchanged; `docs/REFERENCE_FRAMES.md` lists RF-21/RF-22. **Pure intersection check:** compute the eight rod X intervals from `computeEngineLayout`/`computeRodSeatOffsetMm` and the stock big-end width (`rodSeatXMm ± 13.838`) and assert `388.3` is strictly inside the station-0 RH interval and `402.5` is inside **none**. *Catches: a `?rf=` URL that silently falls back, a frame with the wrong section/explode state, a stock frame that accidentally turns the rod variant on, and a section position that misses the rod. It does **not** judge occlusion or legibility; acceptance 6/G-FRAME-M13 does that.*
9. **UI text (edit `src/ui/uiText.test.ts`).** Subtitle `Milestone 13 — Internal Part Variants` appears in both `engineControls.ts` and `index.html`; the exact build note in §10.2 appears; the M12 `Intake cover` label/note, the M11 cutaway note and the M10 disclaimer caption are unchanged; no `rods` checkbox/default-on control is added; the `rods_stock` default is present. *Catches: a subtitle drift, a stale build note that says only the piston is internal, a default-on control, a lost M12/M11 caption.*
10. **No-visual dispositions (new `src/renderer/internalVariants.test.ts`).** `INTERNAL_VISUAL_DISPOSITIONS` contains every catalog id exactly once; exactly **6** are `variant-model` (5 M8 + `rods_forged`), **12** are `stock`, **6** are `no-visual` (`injectors_plus30`, `cp3_stroker`, `cam_performance`, `heads_ported`, `tune_tow`, `tune_performance`); every no-visual has a non-empty `reason` and `evidence`; the two tunes' reasons mention "software calibration"; `fuelRail_stock` is present as `stock`; `CAM_OWNER_DECISION === 'OD-1-A'` and the OD-1 text matches the docs. *Catches: an unclassified catalog entry, a no-visual entry that later gets a `modelPath` without updating the register, a missing cam owner decision, a tune treated as a visual candidate.*
11. **Frozen-asset identity against an independent baseline.** Pin the exact **`main` SHA-256** values recorded in **§15.9** for the ten stock GLBs, the five M8 variant GLBs, the M12 cover, the M10 shell, `catalog/stock.json`, `catalog/schema.json` and `src/core/interfaces.ts` — these are the hashes computed from `main @ 8394f1f`, not literals from the build tree. The M12 `intakeCover.test.ts` test 12 currently pins `catalog/modified.json` to the pre-M13 blob; the build **re-pins that one literal** to the post-M13 blob (SHA recorded at build) whose only diff is the `rods_forged.modelPath` value, renames/clarifies the test description to record the sanctioned M13 catalog change, and leaves every other hash/assertion in that test unchanged. **Only-one-catalog-diff:** commit `src/catalog/__fixtures__/modified.pre-m13.json` as a byte copy of `main:catalog/modified.json` (SHA-256 `af6f0ce3bccc039943267ccbd7ad58a8f7817bb7410019dc30751656c443897c`, 7,122 B) and assert the parsed pre/post objects differ **only** at `rods_forged.modelPath` — `notes`, `compatibility`, `performanceParams` and every other entry must be byte-equal. Acceptance 1 also runs `git diff main -- catalog/modified.json` and asserts exactly one changed line. *Catches: a builder "fixing" the stock rod/shell, changing an M8 variant, editing the frozen interface, or changing any catalog field other than the one sanctioned `modelPath`.*
12. **Load-failure fallback.** Pure helper: `resolveVariantLoadFailure(['rods_forged'], ['rods_forged'])` returns the failed id and `variantsLoaded: true`; with a configured-but-not-failed id it still settles; it does not throw. Source check (labelled as such): a failed rod load adds the id to `failedVariantIdSet`, sets `variantsLoaded` (settled), leaves the stock conrod batch in place, and does not throw. **Browser acceptance case (acceptance 8):** in a scratch build with the rod GLB renamed, `?benchmark=1&variants=rods_forged` completes, reports the failed variant, leaves the stock rods visible, and does not hang. *Catches: a missing asset that hides the stock rods or hangs the benchmark; the source grep alone is explicitly not the proof.*

The headless tests cannot judge the look. RF-21/RF-22 are the visual gate; that split is the same one used since M2.

## 10. UI text

### 10.1 Subtitle

- `index.html` subtitle → `Milestone 13 — Internal Part Variants`.
- `src/ui/engineControls.ts` runtime subtitle (`bannerSubtitle.textContent`) → `Milestone 13 — Internal Part Variants`.

### 10.2 Build note (verbatim)

Replace the M8 build note text with exactly:

```
3D variants: exterior parts render with the Exterior shell shown (Exterior or X-Ray); the low-compression piston and forged connecting rods render in the internal assembly.
```

The note keeps the existing `.m8-build-note` style; no new control, checkbox or note is added. The `rods_forged` selection is made in the existing Build dropdown.

### 10.3 No other UI change

The controls, readouts, Build panel, Dyno, Sound, captions and the `?section`/`sectionPos`/`?rf` surface are otherwise unchanged. The M12 `Intake cover` checkbox/note, the M11 cutaway note and the M10 illustrative caption are unchanged. `?rf=RF-21`/`?rf=RF-22` are new; `?rf=RF-1`…`?rf=RF-20` keep their meaning and default the rod variant off.

---

## 11. Build deliverables (docs and paperwork)

1. **`docs/M13-INTERNAL-VARIANTS.md` (new):** the part record — the catalog-closure table (24 entries, 6 visual / 18 no-model), the stock rod inventory, the rod variant dimensions with provenance, the no-visual register with the re-tested D-038 reasons, the cam OD-1 decision, the M8/M11/M12 compatibility tables, the illustrative-scope statement, and the recorded-but-not-adopted register. §12.7 gives the required section list.
2. **`docs/M13-MEASUREMENTS.md` (new):** the measured record — production bundle; the rod build log (triangles, bounds, materials, marker/pivot, watertightness, file size/page-weight delta); the current scene baseline; the `?benchmark=1` matrix (desktop/phone × stock/worst × rods off/on, plus rods-on Section X @ 388.3) with the D-033 verdict table and headroom; the **derived cap guard 319,128 / 872**; the rod section-cap triangles at X = 388.3 and the section-on submitted/call rows; the RF-21/RF-22 captures with SHA-256 and checklist results; the manual RF-1…RF-20 invariance comparison notes; the frozen-file audit; the exact commands.
3. **`docs/REFERENCE_FRAMES.md`:** add RF-21/RF-22 definitions, images and checklists; add the two rows to the summary table; update the intro count from twenty to twenty-two and the provenance line to include M13; add the RF-21/RF-22 checklist section (§12.6).
4. **`docs/ASSET_CONTRACT.md`:** add the M13 part-local internal-variant note (§12.4); the class itself is unchanged.
5. **`docs/THREE_API_NOTES.md`:** frozen — no new API (the existing `InstancedMesh` / `extractAllPartPrimitives` / `prepareCapSource` paths are reused).
6. **`docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`:** exact text in §12.1–§12.3.
7. **`assets-src/PROVENANCE.md`:** add the rod variant row (§12.5).
8. **`index.html`:** subtitle only.
9. **`docs/M8-VARIANTS.md`, `docs/M10-*`, `docs/M11-*`, `docs/M12-*`:** frozen; the M13 docs link back to them. The M8 §6 internal-parts table is **historical**; M13 records the re-test in its own doc rather than editing the M8 record.
10. **`docs/reference-frames/RF-21.png`, `RF-22.png`:** new captures.

---

## 12. Exact paperwork text

### 12.1 `docs/PLAN.md`

After the Milestone 12 block, add:

> 13. **Internal-part visual variants**
>     - Add the forged connecting-rod visual variant (`rods_forged`) as a part-local drop-in for the eight instanced rods — a stock-interface heavier H-beam with thicker/wider flanges, a thicker web and illustrative stepped 12-point cap fasteners, labeled illustrative — and record the remaining internal entries (`injectors_plus30`, `cp3_stroker`, `cam_performance`, `heads_ported`) as visual-less with reasons, closing the 24-entry catalog's visual dispositions; confirm `tune_tow`/`tune_performance` are software calibrations with no geometry.
>     - Exit: selecting `rods_forged` swaps the eight instanced rods and restoring stock restores the shipped scene; the asset passes the contract and the 1,400-triangle cap; D-033 passes on both tiers with measured numbers; RF-21/RF-22 pass their checklists; the no-visual register and the cam owner decision (OD-1) are recorded; PLAN/DECISIONS/OPEN_ITEMS/ASSET_CONTRACT are updated in the same PR.

Replace the post-12 candidates line with:

> After 13: stock vehicle-side hardware models, real wall-thickness section geometry, an analytic coil section for the valve springs, a camshaft visual with valve-lift kinematics (owner decision deferred, D-048), and shareable builds (deprioritised by the owner, 2026-11-15 — D-045) are candidates.

### 12.2 `docs/DECISIONS.md`

Add under a new `## 2026-11-16 — Milestone 13 spec` heading:

> - **D-048 Internal-part visual variants (Milestone 13).** `rods_forged` becomes the sixth catalog entry with a 3D variant: a **part-local** `public/models/variants/rot_conrod_c1_forged.glb` drop-in for the eight instanced conrods, preserving the stock interface (163.0 mm c2c, 62.9 mm journal, 34.5 mm pin, **27.676 mm** big-end axial width) and adding an illustrative heavier H-beam (wider flanges 30.343 / 18.568 mm vs stock 26.129 / 16.187; flange thickness 8.177 vs 6.288 mm; web half-width 5.258 vs 4.428 mm) with stepped 12-point cap fasteners (the 12-point profile is an illustrative placeholder, not published). One grade-C vendor (Callies Compstar Xtreme) describes a 4340 forged H-beam with ARP L19 fasteners and "thicker flanges / reduced depth of cut"; the catalog entry itself is generic, and this is a **single weak source**. The flange/web **magnitudes are labeled placeholders**, not measured aftermarket dimensions. The published stock-matching 28.4 mm big-end width is **not adopted** (it would close the 0.724 mm inter-rod gap); the 2.480 in aftermarket journal and 1,182 g weight are recorded, not adopted. **No-visual outcomes, re-tested:** `injectors_plus30` (nozzle-internal flow; the 7-hole count is published but hole diameter is unverified and the external body is a remanufactured stock body), `cp3_stroker` (M10's `cp3Fuel/ext_cp3` now makes a swap technically possible — the M8 "no swappable model" premise is cured — but no source publishes an external housing difference (the identity is inferred from the replacement listing, not measured), and the stroke is internal), `heads_ported` (LLY port geometry unpublished and unmodelled; no source publishes an external-casting difference (the external identity is inferred from the casting listing, not measured)), and `cam_performance` (no camshaft geometry; a visual implies wiring lobe lift into the valve kinematics). **Owner Decision OD-1:** the cam visual is **deferred** (Option A); a future cam visual requires a separate decision to open `src/core/kinematics.ts`/`valveConfig.ts` and a published duration/timing profile; a visual-only cam that does not drive the valves is rejected as mechanically dishonest. `tune_tow`/`tune_performance` are **software calibrations** with no geometry; `fuelRail_stock` is stock-only. **This decision amends D-038's rods reason** ("material-only change") and treats `docs/M8-VARIANTS.md` §6's rods OUT row as historical; the `docs/M7-DATA.md` §3 "I-beam" wording is a stale register row (the GLB and build code are H-beam), recorded here and in the OPEN_ITEMS erratum item rather than editing the frozen M7 doc. The 24-entry catalog is **closed**: 6 entries carry a variant `modelPath` (5 M8 + `rods_forged`), 18 do not (12 stock + 6 modified no-visual). **Budgets:** rod cap **1,400** tris (provisional uncommitted 4.0.2 prototype 1,372; full-engine delta +1,760 at the cap / +1,536 at the prototype); current scene 308,324 stock / 304,632 worst; stock + rods + M12 cover **311,884** (cap) / 311,660 (provisional prototype), worst + rods + cover **308,192** (cap) / 307,968 (provisional prototype); derived cap guard **319,128 / 320,000 phone (872 triangles, 0.2725 %)** and **319,128 / 360,000 desktop**; draw calls unchanged by rods (3 primitives, same as stock), cover +2; texture VRAM unchanged. **Frozen:** `src/core/interfaces.ts` (D-010), `src/perf/**`, `src/config/**`, `catalog/stock.json`, the catalog schema, the ten stock GLBs, the five M8 variant GLBs, the M10 shell and the M12 cover; the only catalog change is the one `rods_forged.modelPath` value in `catalog/modified.json`.

### 12.3 `docs/OPEN_ITEMS.md`

Remove the deferred-candidate item:

> `- [ ] **Internal-part visual variants not in M8** — rods (material-only), injectors/CP3 (flow-internal, no truthful visible change), camshaft (not modeled; timing unpublished), heads (porting unpublished/unmodeled). Deferred until a milestone adds the underlying geometry or published data.` (`docs/OPEN_ITEMS.md:18`)

Replace the stale D-035 line in the data-to-source section (currently `docs/OPEN_ITEMS.md:10`) so it reads:

> `- [ ] **Bore pitch / bank stagger and deck height** — surveyed 2026-11-13 (L7 survey): no published source exists; remain illustrative placeholders. Cam timing events/duration/LSA — same survey: not published; lobe lift is published and adopted at M7 (D-035), corrected by D-044, timing remains placeholder.`

Add to **Watch items**:

> - [ ] **`rods_forged` variant flange/web dimensions are illustrative placeholders** — no published aftermarket H-beam flange thickness or web depth; M13 adopts the stock interface (163.0 mm c2c, 62.9 mm journal, 34.5 mm pin, 27.676 mm big-end width) and one grade-C vendor's qualitative Callies description ("thicker H-beam flanges / reduced depth of cut", ARP L19 fasteners), with the flange/web magnitudes and the 12-point fastener labeled placeholders. This is a **single weak source**; the catalog entry is generic. Revisit with a dimensioned aftermarket rod drawing or a measured part.
> - [ ] **Camshaft visual with valve-lift kinematics** — M13 defers the cam visual (owner decision OD-1). A cam that rotates at half crank speed but does not drive the valves would be mechanically dishonest; wiring lobe lift into the valve kinematics requires a published duration/timing profile (not available) and opens `src/core/kinematics.ts`/`valveConfig.ts` in a future milestone. Revisit only with an owner decision and a sourced lobe profile.
> - [ ] **Injector nozzle visual** — +30 % flow is nozzle-internal; the 7-hole count is published but hole diameter is unverified (0.155 mm candidate, low confidence). Revisit with a verified nozzle drawing or flow-bench data.
> - [ ] **Heads port visual** — LLY port geometry is unpublished and unmodeled; no source publishes an external-casting difference (the external identity is inferred from the casting listing, not measured). Revisit with a dimensioned port drawing or a scanned head.
> - [ ] **CP3 stroker external visual** — the stroker's difference is internal cam-ring stroke; no source publishes an external housing difference (the external identity is inferred from the replacement listing, not measured). Revisit only if a stroker with a distinct external housing/FCA is documented.
> - [ ] **Rod variant inter-rod clearance** — the variant keeps the 27.676 mm big-end axial width and the stock 0.724 mm inter-rod gap; do not adopt the published 28.4 mm aftermarket big-end width without re-checking the shared-pin layout. Revisit if the pin/seat geometry changes.
> - [ ] **`docs/M7-DATA.md` §3 "rod I-beam" erratum** — the shipped GLB and `build_cylinder1.py` are H-beam; the frozen M7 register row is stale wording, not a different asset. M13 records the erratum in D-048 and `docs/M13-INTERNAL-VARIANTS.md`; correct the row only if a future milestone reopens `M7-DATA.md`.

### 12.4 `docs/ASSET_CONTRACT.md`

Append to the part-local / scene-placed class section:

> ### M13 part-local internal variant (D-048)
>
> `public/models/variants/rot_conrod_c1_forged.glb` is a second **part-local** drop-in (after M8 `rot_piston_c1_lowcomp.glb`): contract root `rot_conrod_c1_forged`, child `rot_conrod_smallend_c1_forged` at `(0, 0, 163.0) mm`, origin at the big-end bore axis, three untextured `MeshStandardMaterial`s, no `if_*` markers, indexed `POSITION` + `NORMAL` triangles only, **≤ 1,400 triangles**, **≤ 48 KiB**. It is loaded through the existing `extractAllPartPrimitives` path and swapped into the eight instanced conrod slots; it adds no asset class, no pivot and no animation.

### 12.5 `assets-src/PROVENANCE.md`

Add to the variant table:

> | `public/models/variants/rot_conrod_c1_forged.glb` | `rot_conrod_c1_forged`, child `rot_conrod_smallend_c1_forged` | `assets-src/blender/build_rod_variant.py` + `assets-src/rod_variant_dimensions.json`; stock interface from the stock `rot_conrod_c1_stock.glb` and `assets-src/dimensions.json` inputs | **Verified:** stock interface (163.0 mm c2c published length, c2c basis inferred/corroborated; 62.9 mm journal; 34.5 mm pin; 27.676 mm big-end axial width — stock model, `2 × 0.22 × 62.9`); one grade-C vendor's qualitative aftermarket H-beam / ARP L19 description (Callies Compstar Xtreme; **single weak source**), and the catalog entry is generic. **Illustrative:** flange thickness 8.177 mm, flange outer Y 30.343 / 18.568 mm, web half-width 5.258 mm, 12-point head geometry, PBR. **Not adopted:** 28.4 mm big-end width (would close the 0.724 mm inter-rod gap), 2.480 in journal, 1,182 g weight. | repository source / original procedural work |

### 12.6 `docs/REFERENCE_FRAMES.md`

Add the two rows to the summary table and the two frame sections. The shared checklist header becomes:

> ## Rod-Variant Checklist (RF-21, RF-22, Milestone 13 Spec §8.1)

with the six shared items and the two per-frame items from §8.1. The intro count changes from "twenty" to "twenty-two"; the provenance line adds "M13". RF-21/RF-22 are captured at `1440×900 → 1024×640` and stored as `docs/reference-frames/RF-21.png` / `RF-22.png`. RF-22's section row reads `X = 388.3 mm` (station-0 RH rod), not RF-6's `X = 402.5 mm`; the checklist must not inherit RF-6's section position.

### 12.7 `docs/M13-INTERNAL-VARIANTS.md` required content

1. Scope and catalog closure (24 entries, 6 visual / 18 no-model).
2. Shipped geometry inventory (the measured table from the survey §2).
3. The rod variant: asset contract, dimension/provenance table, construction, datum, clearances, triangle/file caps.
4. The no-visual register: injectors, CP3, cam, heads, tunes, fuel rail, each with the re-tested D-038 reason and the evidence.
5. Owner Decision OD-1 (the three options and the adopted A).
6. Interaction contract: explode, M11 caps, X-Ray, labels, M8 variants, M12 cover.
7. Budgets and caps (the §7 numbers).
8. Proof frames and the G-FRAME-M13 gate.
9. Recorded-but-not-adopted register.
10. Known limitations / illustrative-scope statement.
11. References to the survey and the source grades.

### 12.8 `docs/M13-MEASUREMENTS.md` required content

1. Environment and exact commands.
2. Build log: rod triangles, bounds, materials, pivot, watertightness, components, file bytes.
3. Current scene baseline and the rod delta.
4. `?benchmark=1` matrix: desktop/phone × stock/worst × rods off/on, plus rods-on Section X @ 388.3; scene/submitted/calls/VRAM/p95/dropped frames; the D-033 verdict table, including the section-on bound from §7.7.
5. Derived cap guard **319,128 / 872** and the measured guard.
6. Rod section-cap triangles at X = 388.3 and cap CPU times.
7. RF-21/RF-22 captures with SHA-256 and checklist results.
8. Manual RF-1…RF-20 invariance comparison notes.
9. Frozen-file/SHA audit.
10. Any build deviation (with owner approval, D-047 precedent).

---

## 13. Acceptance criteria (Buckley verifies from a fresh clone)

1. **Frozen audit (executable).** Run:
   ```
   git diff --exit-code main -- \
     src/core src/perf src/config src/audio src/assets \
     src/renderer/exteriorLoader.ts src/renderer/layout.ts src/renderer/partLoader.ts \
     src/renderer/variantLoader.ts src/renderer/viewLayout.ts src/renderer/sectionCaps.ts \
     src/renderer/intakeCover.ts src/main.ts src/catalog/index.ts \
     catalog/stock.json catalog/schema.json \
     public/Duramax_LLY_2005_66L_V8.glb public/models/*_stock.glb \
     public/models/variants/turbo_unit_engine_large.glb \
     public/models/variants/intake_tract_engine_highflow.glb \
     public/models/variants/exhaust_system_engine_4inch.glb \
     public/models/variants/intercooler_core_engine_upgraded.glb \
     public/models/variants/rot_piston_c1_lowcomp.glb \
     public/hdri public/legacy \
     assets-src/blender/build_cylinder1.py assets-src/blender/build_variants.py \
     assets-src/blender/build_shell.py assets-src/blender/build_intake_cover.py \
     assets-src/dimensions.json assets-src/variant_dimensions.json \
     assets-src/cover_dimensions.json assets-src/shell_dimensions.json \
     docs/M{2,3,4,5,6,7,8,9}-MEASUREMENTS.md docs/M{10,11,12}-MEASUREMENTS.md \
     docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M8-VARIANTS.md \
     docs/M9-SOUND.md docs/M10-EXTERIOR.md docs/M11-CUTAWAYS.md docs/M12-COVER.md \
     docs/specs/M{0,1,2,3,4,5,6,7,8,9}-* docs/specs/M1{0,1,2}-* \
     docs/research/L7-* docs/research/M{8,9}-* docs/research/M1{0,1,2}-* \
     docs/PLANNING.md docs/ORCHESTRATOR.md docs/THREE_API_NOTES.md
   ```
   is empty. The five M8 variant GLBs, the M10 shell, the M12 cover, the ten stock GLBs, the catalog schema and `src/core/interfaces.ts` are byte-identical to `main`. Then check the one sanctioned catalog change:
   ```
   test "$(git diff --numstat main -- catalog/modified.json | awk '{print $1" "$2}')" = "1 1"
   git diff --unified=0 main -- catalog/modified.json | grep -q '^+.*"modelPath": "models/variants/rot_conrod_c1_forged.glb"'
   ```
   and the pre-M13 fixture test in §9 test 11 confirms the only JSON-object difference is that one value. The literal `…` is not part of any command.
2. **Fresh-clone gates:** `npm ci`, `npm run typecheck`, `npm test`, `npm run build` pass on Node 24. Exactly the eight test files named in §9 are touched (2 new + 6 edited); no other test file is edited; the new fixture `src/catalog/__fixtures__/modified.pre-m13.json` is test data; `package.json`/`package-lock.json` unchanged.
3. **Asset audit:** `public/models/variants/rot_conrod_c1_forged.glb` is ≤ **49,152 B**; root/child names correct; **3** materials; no textures/UVs/images/skins/morphs/animations; indexed `POSITION`+`NORMAL`; **≤ 1,400** tris; bounds/pivot/width as §4.2; **beam flange outer Y 30.343 (big) / 18.568 (small), flange thickness 8.177, web half-width 5.258 mm** within ±0.20 mm; watertight (0 boundary edges at 1e-5 m) with 10 closed components. The 1,372-triangle prototype is provisional and is not an acceptance requirement.
4. **Catalog audit:** exactly **6** entries have a non-null `modelPath`; `rods_forged` is the new one with `explodeVectorMm [0,0,0]`; the other **18** are null; `catalog/stock.json` and `catalog/schema.json` byte-identical; `src/core/interfaces.ts` unchanged; the only `catalog/modified.json` object difference from the pre-M13 fixture is `rods_forged.modelPath`; all 24 dispositions match §2.7/§9 test 10.
5. **Budgets:** the `?benchmark=1` matrix (desktop 1440×900 Full, phone 390×844 Phone; stock and worst-case 5-variant; rods off and on; plus rods-on Section X @ 388.3) reports:
   - **Section off:** scene triangles **≤ 311,884 / ≤ 308,192** with rods+cover; calls **98/60** stock and **99/62** worst; VRAM **20.75/4.75 MiB**; submitted **≤ 584,804 / 311,436** and **≤ 574,200 / 308,072**.
   - **Section on at X = 388.3:** scene unchanged; calls **≤ 100/101** desktop and **≤ 62/64** phone; submitted **≤ 600,804 / 590,200** desktop and **≤ 327,436 / 324,072** phone (the §7.7 section-off + 16,000 cap bound); cap total **≤ 16,000**.
   - p95 within **+0.30 ms of the M11 detail rows** (desktop 16.8 ms, phone 17.0 ms; M12 §7.9 precedent) with **0 dropped frames**; the measured rod is ≤ **1,400** triangles, the GLB ≤ **48 KiB**, and the derived cap guard is **319,128 / 320,000 phone (872 triangles)**. Any breach is a stop-and-report.
6. **Visual proof:** RF-21/RF-22 exist at the pinned camera poses and every checklist item in §8.1 passes; RF-21 verifies all-eight visibility/legibility (not claimed from RF-10's different variant set); RF-22's cut plane is **X = 388.3 mm**, the cut face is the station-0 RH rod's solid/hatched section, and it is continuous with the M11 cap convention.
7. **Invariance (manual visual gate):** with `rods_stock`, live re-captures of RF-1…RF-20 are compared visually in the 3D viewport region against the committed PNGs (subtitle masked) by the reviewer, with the comparison and any difference recorded in `docs/M13-MEASUREMENTS.md`; the 3D content must be visually unchanged, and any visible difference is a stop-and-report. With `rods_forged`, no existing frame is re-baselined.
8. **Interaction checks:** `rods_forged` selects/deselects through the existing Build dropdown; `rods_forged + pistons_lowcomp + turbo_large` renders both internal variants and the internal scene total is **274,784** (stock internal 270,080 + piston 2,944 + rod 1,760; **not** 273,024 — the QA-02 failure), with the turbo external delta included on top in `visibleSceneTriangles`; Section X @ **388.3** with rods selected shows a capped rod section; X-Ray/exterior-off shows the variant; the 23 labels are unchanged; the M12 cover toggle and RF-18…RF-20 are unchanged; the five M8 variants still render. **Failure case:** in a scratch build with the rod GLB renamed, `?benchmark=1&variants=rods_forged` completes, reports the failed variant, leaves stock rods visible, and does not hang.
9. **Docs:** `docs/M13-INTERNAL-VARIANTS.md` and `docs/M13-MEASUREMENTS.md` are complete per §11/§12.7/§12.8; `docs/REFERENCE_FRAMES.md` includes RF-21/RF-22 and the checklist with RF-22 at X = 388.3; `docs/ASSET_CONTRACT.md`, `assets-src/PROVENANCE.md`, `docs/PLAN.md`, `docs/DECISIONS.md` and `docs/OPEN_ITEMS.md` match §12 exactly; prior docs are byte-identical.
10. **Outside review (D-021)** recorded for the milestone-exit PR; **Owner Decision OD-1** recorded in the PR/spec.

## 14. Frozen and changed files

**Frozen — no changes:**

- `src/core/**` (including `interfaces.ts`, D-010), `src/perf/**`, `src/config/**`, `src/audio/**`, `src/assets/**`.
- `catalog/stock.json`, `catalog/schema.json`, `src/catalog/index.ts`.
- `src/main.ts`; `src/renderer/exteriorLoader.ts`, `layout.ts`, `partLoader.ts`, `variantLoader.ts`, `viewLayout.ts`, `sectionCaps.ts`, `intakeCover.ts`.
- `public/Duramax_LLY_2005_66L_V8.glb`; the ten stock internal part GLBs; the five `public/models/variants/*.glb`; `public/models/intake_cover_lly.glb`; `public/hdri/**`; `public/legacy/**`.
- `assets-src/blender/build_cylinder1.py`, `build_variants.py`, `build_shell.py`, `build_intake_cover.py`; `assets-src/dimensions.json`, `variant_dimensions.json`, `cover_dimensions.json`, `shell_dimensions.json`; all existing `assets-src` reference files.
- `package.json`, `package-lock.json`, `.github/**`, `vite.config.ts`, `tsconfig.json`.
- `docs/M2-MEASUREMENTS.md` … `docs/M12-MEASUREMENTS.md`, `docs/M5-MODEL.md`, `docs/M6-PARTS.md`, `docs/M7-DATA.md`, `docs/M8-VARIANTS.md`, `docs/M9-SOUND.md`, `docs/M10-EXTERIOR.md`, `docs/M11-CUTAWAYS.md`, `docs/M12-COVER.md`; `docs/specs/M0-*`…`docs/specs/M12-*`, `docs/research/L7-*`, `M8-*`, `M9-*`, `M10-*`, `M11-*`, `M12-*`, `docs/PLANNING.md`, `docs/ORCHESTRATOR.md`, `docs/THREE_API_NOTES.md`. (`docs/REFERENCE_FRAMES.md` and `docs/ASSET_CONTRACT.md` are changed deliverables, not frozen.)

**Changed / new (expected):**

- `catalog/modified.json` — only `rods_forged.modelPath`.
- `src/renderer/internalVariants.ts` *(new)* — constants, the 24-entry disposition register, OD-1, pure helpers.
- `src/renderer/engineScene.ts` — internal-part preload/swap, rod batch, dynamic cap source, stats, dispose.
- `src/renderer/partVariants.ts` — `VISUAL_VARIANT_SLOTS` + `VARIANT_TRIANGLE_CAPS` using the imported `ROD_VARIANT_TRIANGLE_CAP`.
- `src/renderer/index.ts` — export the new module's public names.
- `src/renderer/rodVariant.test.ts` *(new)* — tests 1, 2, 5–7, 11–12.
- `src/renderer/internalVariants.test.ts` *(new)* — test 10 (and the pure part of test 5).
- `src/catalog/modified.test.ts` — add `rods_forged` to the expected visual map (test 3) and the pre-M13 fixture only-one-diff assertion (test 11).
- `src/catalog/__fixtures__/modified.pre-m13.json` *(new test data)* — byte copy of `main:catalog/modified.json` (SHA-256 `af6f0ce3…`, 7,122 B) for the only-one-diff test. The build may commit it as-is; it is not a runtime asset.
- `src/catalog/visualVariants.test.ts` — test 3.
- `src/renderer/intakeCover.test.ts` — re-pin only the `catalog/modified.json` LF SHA-256 literal to the M13 blob (test 12); the shell/variant/stock hashes are unchanged.
- `src/renderer/partVariants.test.ts` — test 4.
- `src/ui/referenceFrames.test.ts` — test 8.
- `src/ui/uiText.test.ts` — test 9.
- `src/ui/engineControls.ts` — subtitle + build note.
- `src/ui/referenceFrames.ts` — RF-21/RF-22.
- `index.html` — subtitle only.
- `assets-src/rod_variant_dimensions.json` *(new)*; `assets-src/blender/build_rod_variant.py` *(new)*.
- `public/models/variants/rot_conrod_c1_forged.glb` *(new)*.
- `docs/M13-INTERNAL-VARIANTS.md`, `docs/M13-MEASUREMENTS.md` *(new)*; `docs/REFERENCE_FRAMES.md`, `docs/ASSET_CONTRACT.md`, `assets-src/PROVENANCE.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`; `docs/reference-frames/RF-21.png`, `RF-22.png` *(new)*.
- `docs/research/M13-internal-variants-survey.md` and `docs/specs/M13-internal-variants.md` are the planning package already on `plan/m13-internal-variants`; the build branch may carry them from the planning branch, but must not edit them.

**If you believe any other file must change, stop and report it instead of changing it.**

---

## 15. Pre-build self-check (recorded)

Every number below was produced before this spec was finalised, from the committed GLBs, the shipped code, and the named publications. The planning artifacts are not committed by the build. The **arithmetic** is re-runnable from the values quoted here; the **1,372-triangle / 28,008-byte rod prototype is an uncommitted Blender 4.0.2 planning measurement, not reproducible from this branch**, and is treated as provisional throughout.

### 15.1 Measurement environment

- Host: Linux x86_64 container, Node `v24.22.3`, Three.js `0.187.0`, Vite `7.3.8`, Blender **4.0.2** (the repo's asset scripts target 5.2.3 LTS; 5.2.3 is not installed here).
- Existing suite: **104 tests / 21 files passed**; `npm run typecheck` passed (this session). No new dependency was installed for the repo; the Blender prototype used a temporary `numpy` on `PYTHONPATH` only for the glTF exporter.
- **No WebGL / headless browser** in this VM: runtime draw calls, submitted triangles, VRAM, p95 and reference-frame captures were **not** re-measured. The M12 measured values are quoted only as a cross-check; the build re-measures them on the reference GPU.
- The rod prototype was built with Blender 4.0.2 because the repo target (5.2.3) is unavailable here. A stock conrod rebuilt with the same 4.0.2 script reproduced the committed **1,180 triangles** exactly (though its vertex dedup/file bytes differ), which validates the triangle-count comparison. **No `build_rod_variant.py` or `rot_conrod_c1_forged.glb` is committed**, so the 1,372 / 28,008 B figures are provisional and cannot be checked from a fresh clone. The build must re-run the actual script in 5.2.3, record the final count/bytes, and is gated on re-deriving the numbers (not on trusting the provisional values).

### 15.2 Current shipped scene — triangles re-derived, runtime figures from M12

The triangle rows below were re-derived this session from the committed GLBs and the renderer's instance counts. The `calls` / `submitted` / `VRAM` figures are the **M12 measured record**, quoted as a cross-check only; they were not re-measured here (no WebGL) and the build must re-measure them.

```
desktop full, exterior on, stock        : 96 calls / 579,484 submitted tris / 308,324 scene tris / 20.75 MiB
desktop full, exterior on, 5 variants   : 97 calls / 568,880 submitted tris / 304,632 scene tris / 20.75 MiB
phone, exterior on, stock               : 58 calls / 307,876 submitted tris / 308,324 scene tris / 4.75 MiB
phone, exterior on, 5 variants          : 60 calls / 304,512 submitted tris / 304,632 scene tris / 4.75 MiB
```

Code arithmetic re-derived this session: `4,832×8 + 1,180×8 + 1,352×4 + 3,532×8 + 924×8 + 1,040×16 + 3,464×16 + 1,040×16 + 3,464×16 + 408×16 + 620×4×4 + 840×16 + 432×16 = 270,080` internal; `+1,080` main shaft `+64` ground `+37,100` shell = **308,324**. Worst: `308,324 − 6,912` (piston swap) `− 6,500` (hidden shell subtrees) `+ 9,720` (external variants) = **304,632**.

### 15.3 Rod prototype — uncommitted planning measurement (provisional)

```
construction                  : stock-interface H-beam + wider/thicker flanges + thicker web + stepped 12-point fasteners
triangles                     : 1,372 (1,084 rod + 288 small-end); cap 1,400
primitives / materials        : 3 / 3 (steel, fasteners, bushing); no textures/UVs
bounds (project, mm)          : X -13.838..+13.838 ; Y -48.725..+48.725 ; Z -42.143..+186.805
big-end axial width           : 27.676 mm (stock, preserved)
beam flange outer Y           : 30.343 mm big-end / 18.568 mm small-end (stock 26.129 / 16.187)
flange thickness              : 8.177 mm (stock 6.288)
web half-width (X)            : 5.258 mm (stock 4.428)
watertight                    : 0 boundary edges at 1e-5 m; 10 closed components
file bytes                    : 28,008 B (cap 49,152 B)
```

The stock conrod rebuilt by the same script measured 1,180 tris / identical bounds, so the variant's **+192 tris/instance** is the fastener-profile change; the full-engine delta is `+1,536` at the provisional prototype, `+1,760` at the cap. **This prototype is not committed and cannot be reproduced from the branch** (QA-14); the build-gate requirement is to re-run `build_rod_variant.py` in Blender 5.2.3 and record the actual count/bytes before any acceptance row uses them. The cap guard and all budget rows use the cap (1,400), not the prototype, so they are unaffected.

### 15.4 Budget arithmetic with the rod variant

```
rod cap delta              = (1,400 - 1,180) * 8 = 1,760
rod prototype delta        = (1,372 - 1,180) * 8 = 1,536
stock + rods + cover cap   = 308,324 + 1,760 + 1,800 = 311,884
worst + rods + cover cap   = 304,632 + 1,760 + 1,800 = 308,192
stock + rods + cover proto = 308,324 + 1,536 + 1,800 = 311,660
worst + rods + cover proto = 304,632 + 1,536 + 1,800 = 307,968

derived cap guard          = 308,324 - 6,500 + 10,800 + 2,944 + 1,800 + 1,760
                           = 319,128
phone headroom             = 320,000 - 319,128 = 872 (0.2725 %)
desktop headroom           = 360,000 - 319,128 = 40,872 (11.35 %)

submitted stock desktop    = 579,484 + 2*1,760 + 1,800 = 584,804
submitted stock phone      = 307,876 + 1,760 + 1,800 = 311,436
submitted worst desktop    = 568,880 + 2*1,760 + 1,800 = 574,200
submitted worst phone      = 304,512 + 1,760 + 1,800 = 308,072

calls                      = 96 + 2 = 98 (desktop stock) ; 58 + 2 = 60 (phone stock)
                             97 + 2 = 99 (desktop worst) ; 60 + 2 = 62 (phone worst)
VRAM                       = 20.75 / 4.75 MiB (no rod textures)
section state              = +1,400 scene tris + rod cap tris; cap ceiling 16,000 unchanged
```

The **phone stock + rods + cover** row at **8,116 triangles (2.54 %) headroom** is **cap-conservative**, not measured: it uses the 1,800-triangle cover cap and the 1,400-triangle rod cap. The separately composed phone rows are:

| Phone state | Scene tris | Headroom |
| --- | ---: | ---: |
| Stock | 308,324 | **11,676** |
| Stock + committed cover (1,040) | 309,364 | **10,636** |
| Stock + rod cap (1,400) + committed cover (1,040) | 311,124 | **8,876** |
| Stock + provisional prototype rod (1,372) + committed cover (1,040) | 310,900 | **9,100** |
| Stock + rod cap + cover cap (the §7.4 row) | 311,884 | **8,116** |

The **derived cap guard** is tighter at **872 triangles (0.2725 %)** and remains a PASS. The rod cap is a cap, not a measured asset; the build records the actual (provisional prototype 1,372, expected below 1,400). The **15,368** figure used elsewhere in the plan is the M8 five-variant worst-case build (`320,000 − 304,632`), not the tightest phone state.

Section-on submitted/call bound (from §7.7): desktop stock **600,804 / 100 calls**, desktop worst **590,200 / 101**, phone stock **327,436 / 62**, phone worst **324,072 / 64**, all within the D-033 caps.

### 15.5 Clearances

```
inter-rod gap              = 2*14.2 - 27.676 = 0.724 mm (unchanged)
bore radius                = 103/2 = 51.5 mm
outer envelope (bolt ears) = 48.725 mm -> 2.775 mm clearance (unchanged)
beam flange (big end)      = 30.343 mm -> 21.157 mm to bore wall
piston outer radius        = 51.425 mm -> 21.082 mm conservative clearance
shell containment          = unchanged (outer envelope identical to stock)
crank web / cap ears       = unchanged (big-end width and ear X preserved)
```

The variant's **outer bounds are identical to the stock rod**; every changed surface is inward of the stock bolt-ear Y envelope. The new beam flange is 21.157 mm from the bore wall and 21.082 mm from the piston outer radius (the skirt inner surface is further away). The shared-pin gap is unchanged at 0.724 mm.

### 15.6 Catalog closure counts

```
24 entries = 6 variant-model + 18 no-model
6 variant-model = turbo_large, intake_highflow, exhaust_4in, intercooler_upgraded, pistons_lowcomp (M8)
                + rods_forged (M13)
18 no-model    = 12 stock + 6 modified no-visual
6 modified no-visual = injectors_plus30, cp3_stroker, cam_performance, heads_ported,
                       tune_tow, tune_performance
```

### 15.7 Conflicts found while drafting (all resolved in the spec, none silently)

1. **D-038's rods reason is partially overturned.** "Material-only change" is not supported by **one grade-C vendor's** description (Callies Compstar Xtreme) of a thicker-flanged H-beam with ARP L19 fasteners; this is a single weak source and the catalog entry is generic. The stock rod **is** an H-beam (confirmed from the GLB), so the variant is an illustrative **heavier H-beam**, not a different beam type. The flange/web magnitudes and the 12-point fastener are labeled placeholders.
2. **D-038's CP3 reason is partially stale.** The M8 "no swappable pivot-placed model" is cured by M10's `cp3Fuel/ext_cp3`; a child split is technically possible. The conclusion (no honest visual) stands because no source publishes an external housing difference (identity inferred from the replacement listing, not measured) and the stroke is internal.
3. **`docs/M7-DATA.md` §3 says "rod I-beam" while `assets-src/PROVENANCE.md` and the build code say H-beam.** The GLB geometry is an H-beam; the M7 row is stale wording. D-048 and the OPEN_ITEMS erratum item record the correction without editing the frozen M7 doc.
4. **The published stock-matching aftermarket big-end width is 28.4 mm, but the stock model is 27.676 mm.** Adopting 28.4 mm would close the 0.724 mm inter-rod gap to 0.0 mm on the shared pin. Recorded, not adopted; the variant keeps 27.676 mm.
5. **D-044 publishes cam lobe lift but not duration/timing.** The M8 reason "lift profile unpublished" is now partially stale (lift is published; duration/timing are not). A cam visual still implies a kinematics decision, so OD-1 defers it.
6. **An aftermarket 0.450 in cam is not a drop-in.** The listing says only `Lift: .450` (lobe vs valve unspecified) and recommends `.080` relief. If `.450` is lobe lift, the worst-case full-max-lift delta gives a **bounding estimate** of −3.84 mm intake / −6.34 mm exhaust against the stock minima; it is not a computed piston-to-valve clearance. Recorded, not adopted; the catalog's `veFactor 1.04` is not a lobe profile.
7. **M12's proof-frame lesson.** No WebGL here, and copied poses failed at M12 build time. M13 reuses the **committed RF-10/RF-6 camera poses** but corrects RF-22's section plane from RF-6's 402.5 mm (the inter-rod gap) to 388.3 mm (the station-0 RH rod centre); the G-FRAME-M13 build gate verifies appearance, not the already-proved intersection.
8. **The phone headroom is genuinely tight.** The derived cap guard is 319,128 / 320,000 (872 triangles, 0.2725 %). The spec does not hide this: it is the decisive budget number, and a rod asset above 1,400 tris is a stop-and-report.
9. **The RF-22 plane was geometrically impossible.** RF-6's 402.5 mm is the centre of the 0.724 mm inter-rod gap; the plane cut no rod. M13 moves it to 388.3 mm, proves the span arithmetic and the camera-side cut face in §15.9, and makes the section-cap test/measurement use that plane.
10. **The combined piston+rod total was order-dependent.** The shipped piston branch overwrote the total with a stock-rod-based sum. M13 replaces both branches with one `recomputeCombinedInternalTriangles()` over `baseNonPistonInternalTriangles` + current rod + current piston, and test 5 pins the combined total 274,784 (not 273,024).

### 15.8 Number provenance

| Number | Value | Derivation / source |
| --- | ---: | --- |
| Rod triangles | 1,372 **provisional/uncommitted**; cap 1,400 | uncommitted Blender 4.0.2 planning prototype (1,084 + 288); stock 1,180 reproduced exactly; build re-derives in 5.2.3 |
| Rod scene delta | +1,536 provisional prototype; +1,760 cap | `(1,372−1,180)×8`; `(1,400−1,180)×8` |
| Rod file bytes | 28,008 **provisional/uncommitted**; cap 49,152 | uncommitted 4.0.2 prototype, not a 5.2.3 result; design cap |
| Rod bounds | X ±13.838, Y ±48.725, Z −42.143…186.805 | provisional prototype / stock-interface design; build re-derives |
| Big-end axial width | 27.676 mm | stock model `2 × 0.22 × 62.9`; M7 register |
| Beam flange Y | 30.343 / 18.568 mm | provisional prototype; stock 26.129 / 16.187 |
| Flange thickness | 8.177 mm | provisional prototype; stock 6.288 |
| Web half-width | 5.258 mm | provisional prototype; stock 4.428 |
| Inter-rod gap | 0.724 mm | `2×14.2 − 27.676` |
| Bore clearance (outer / beam) | 2.775 / 21.157 mm | `51.5 − 48.725`; `51.5 − 30.343` |
| Piston clearance (beam) | 21.082 mm | `51.425 − 30.343` |
| Stock scene | 308,324 | measured GLB arithmetic; §15.2 |
| Worst scene | 304,632 | M8 arithmetic; re-derived |
| Stock + rods + cover | 311,884 cap / 311,660 provisional proto | §15.4 |
| Worst + rods + cover | 308,192 cap / 307,968 provisional proto | §15.4 |
| Combined internal total (rods cap + low-comp pistons) | **274,784** | `221,984 + 11,200 + 41,600 = 270,080 + 2,944 + 1,760`; §9 test 5; the dropped-rod control is 273,024 |
| Derived cap guard | 319,128 / 320,000 phone | §15.4 |
| Phone headroom (guard) | 872 (0.2725 %) | `320,000 − 319,128` |
| Desktop headroom (guard) | 40,872 (11.35 %) | `360,000 − 319,128` |
| Submitted rows (section off) | 584,804 / 311,436 stock; 574,200 / 308,072 worst | §15.4 |
| Section-on submitted bound | 600,804 / 590,200 desktop; 327,436 / 324,072 phone | §7.7: section-off + 16,000 cap ceiling |
| Draw calls | 98/60 stock; 99/62 worst; 100/101 and 62/64 section-on | M12 96/58, 97/60 + cover +2; rods 0; caps +2 |
| VRAM | 20.75 / 4.75 MiB | M12 measured; no rod textures |
| Variant caps | 17,400 total | 10,800 external + 5,200 piston + 1,400 rod |
| Catalog closure | 6 / 18 of 24 | §15.6 |
| RF-22 plane | **388.3 mm** | station-0 centre 402.5 − 14.2; rod interval 374.462–402.138; §15.9 |
| Page-weight delta | +0.489 % cap; +0.279 % **provisional 4.0.2 prototype only** | vs M9 baseline 10,050,510 B; prototype bytes are not a 5.2.3 measurement |

### 15.9 RF-22 plane proof and frozen-file SHA-256

**Rod X intervals at the 402.5 mm station (station index 0).** `borePitch = 115 mm`, so `computeStationCenterXMm(0) = (3.5 − 0) × 115 = 402.5 mm`; `rodSeatOffsetMm = 14.2` and `computeRodSeatOffsetMm` gives RH `−14.2`, LH `+14.2`; the big-end half-width is `0.22 × 62.9 = 13.838 mm`. Every rod's X interval is `seat ± 13.838`:

| Station | Bank | Rod seat X (mm) | Rod X interval (mm) | Contains 388.3? | Contains 402.5? |
| ---: | --- | ---: | --- | :---: | :---: |
| 0 (402.5) | RH | **388.3** | **374.462–402.138** | **yes** | no |
| 0 (402.5) | LH | 416.7 | 402.862–430.538 | no | no |
| 1 (287.5) | RH | 273.3 | 259.462–287.138 | no | no |
| 1 (287.5) | LH | 301.7 | 287.862–315.538 | no | no |
| 2 (172.5) | RH | 158.3 | 144.462–172.138 | no | no |
| 2 (172.5) | LH | 186.7 | 172.862–200.538 | no | no |
| 3 (57.5) | RH | 43.3 | 29.462–57.138 | no | no |
| 3 (57.5) | LH | 71.7 | 57.862–85.538 | no | no |

`388.3` is **13.838 mm inside each face** of the station-0 RH rod and outside every other rod interval, so the plane cuts exactly one rod. `402.5` is inside **no** interval: the gap is `2 × 14.2 − 27.676 = 0.724 mm` wide, from `402.138` to `402.862`, and `402.5` is `0.362 mm` from each face. This is the QA-01 proof.

**Camera side.** `buildSectionPlane('x', 388.3)` sets normal `(−1, 0, 0)` and constant `+0.3883`, so Three.js keeps the half-space `X ≤ 388.3 mm`. RF-22's camera is at `X = 1.06 m`, on the removed side, looking toward the retained half; the cut face is the **+X face** and faces the camera. Nothing between the camera and the plane survives clipping, so the paired LH rod at `416.7 mm` cannot occlude the cut.

**Projection check.** With the RF-6 camera construction (`PerspectiveCamera(42°, 1024/640)`, up `+Z`, position `[1.06, −0.54, 0.48]`, target `[0.29, −0.02, 0.14]`), the station-0 RH rod's cut-face extremes at crank angle 0 project to NDC x `−0.143…0.131`, y `−0.466…−0.064`, depth z `0.954…0.961` — inside the `[−1, 1]` frame and in front of the far plane. The rod's modelled cut face is therefore in frame and on the camera side of the plane; the G-FRAME-M13 gate verifies legibility, not whether a rod is cut.

**Frozen-file SHA-256, `main @ 8394f1f`** (test 11 pins these exact values; `git show main:<path> | sha256sum`):

| File | SHA-256 |
| --- | --- |
| `public/models/rot_piston_c1_stock.glb` | `7565393c9c333fce82b96cd266cfbc8e3b7fd522e99d6c164b42a8a2f988d0dc` |
| `public/models/rot_conrod_c1_stock.glb` | `52a05cb32358de270896d648981d98a3868f2a585f77d110e418d0337f0e7644` |
| `public/models/rot_crankthrow_c1_stock.glb` | `946d36bf5ef11b1bcafde24f98bacdf9995720e796aeee412e78f9cf7a72d540` |
| `public/models/sta_head_c1_stock.glb` | `0a7175c8e32b8f7195e8efbc93cf505f24815b81b7200e0e02cc3c1fb9e8be3b` |
| `public/models/val_bridge_stock.glb` | `5728b24f328a00f16538cd1c5638140b5447f3b5f28fbeca7ccbf8601d40aae2` |
| `public/models/val_pushrod_stock.glb` | `142eda882b56bd2db591edefc4a65b0981871024426c75360453a1168106446f` |
| `public/models/val_rocker_stock.glb` | `214df0a23bd78434dcc8cfd7413fc637ded441adec69fc8d68214051b063367c` |
| `public/models/val_valve_exhaust_stock.glb` | `44a8bfd96804cab431a4935b43c5b37a34c0c026e8badd2cb572680ef909d5c0` |
| `public/models/val_valve_intake_stock.glb` | `61ca1bba6ef65c20f7063f364e46624d2f6c08228b9279239b82d356beb24839` |
| `public/models/fuel_injector_c1_stock.glb` | `64b9bab8b3a60d39348e8e8e447250bc64caaf31c1735e24821092f2e5d42397` |
| `public/models/intake_cover_lly.glb` | `a66a7a82ecbd19061d33058facf01f5ce75af88b25a253cfb8ec85384d64b7f0` |
| `public/Duramax_LLY_2005_66L_V8.glb` | `d51f88a0073fde617d1c6492618fcfabc672154288ac546e52fe2ed40b718554` |
| `public/models/variants/turbo_unit_engine_large.glb` | `6e038dd2540f8732906068fa13cdfaaafe255b53336283118f36ab9aca1c82ed` |
| `public/models/variants/intake_tract_engine_highflow.glb` | `fc28f77b7816a38ad6cb1a53351960b9cf3baf54e089b59de39223c1ba2f7e58` |
| `public/models/variants/exhaust_system_engine_4inch.glb` | `a463172aeae64688383400d56b5c2d70dbf3e62992da1b3013892b456c53fa32` |
| `public/models/variants/intercooler_core_engine_upgraded.glb` | `1f112556e1af253e761413f4e176689904e9c1b043e95ad5814bb984aeb9b183` |
| `public/models/variants/rot_piston_c1_lowcomp.glb` | `41d1315d1fcc18d85fea7b498c28a1567e0bcfb5262e99e940b8f4bc1e35fb93` |
| `catalog/stock.json` | `5ee91f4b0c667c3d3c70c2a39eb9e8afebd614875a4809ea42a29bd75fe2a66d` |
| `catalog/schema.json` | `5682938d8302197167e086c80e156a0117911c89fe38991455db18ffd03d91e5` |
| `src/core/interfaces.ts` | `c896f0b4068a17f16f6b9ca95544d7536cd4db16c91ef489f570355af6533be4` |
| `catalog/modified.json` (pre-M13 fixture) | `af6f0ce3bccc039943267ccbd7ad58a8f7817bb7410019dc30751656c443897c` |

The `catalog/modified.json` post-M13 hash is recorded at build after the one `modelPath` change; its pre-M13 fixture hash is above.

---

## 16. Handoff

Work on branch `m13-internal-variants` in the local clone, created from `main` at `8394f1f`. Implement in this order:

1. **`src/renderer/internalVariants.ts`** — constants, the 24-entry disposition register, OD-1, and the pure helpers (`computeCombinedInternalSceneTriangles`, `resolveVariantLoadFailure`, the rod deltas). Keep `ROD_VARIANT_TRIANGLE_CAP` and the rod model path in this one module; `partVariants.ts` imports the cap so the asset test and the budget guard cannot drift.
2. **`assets-src/rod_variant_dimensions.json` + `assets-src/blender/build_rod_variant.py`** — build the stock-interface H-beam with wider/thicker flanges, thicker web and stepped 12-point fasteners; export Y-up; assert the triangle cap (1,400), bounds, pivot, big-end width (27.676), beam flange Y (30.343 big / 18.568 small), flange thickness (8.177), web half-width (5.258), watertightness (0 boundary edges, 10 components) and material count in the build log. Re-run the provisional 4.0.2 prototype in 5.2.3 and record the actual triangles/bytes before using them; do not copy the provisional 1,372 / 28,008 B into the measured record. Produce `public/models/variants/rot_conrod_c1_forged.glb`.
3. **`catalog/modified.json`** — only `rods_forged.modelPath`; run the catalog/schema tests.
4. **`src/renderer/partVariants.ts`** — add `'rods'` to `VISUAL_VARIANT_SLOTS` and `rods_forged: ROD_VARIANT_TRIANGLE_CAP` (imported, not a literal) to `VARIANT_TRIANGLE_CAPS`; leave the shell replacement map unchanged.
5. **`engineScene.ts` seams** — internal-part preload branch, lazy `ensureVariantRodBatchBuilt`, rod batch, stock/variant swap with `visible = false` on every removed mesh, dynamic `conrod_variant` cap source, the shared `recomputeCombinedInternalTriangles()` used by **both** the rod and piston branches (delete the old piston-only total), stats (`rodVariantActive`, `rodVariantTriangles`, `rodSceneTriangles`), dispose, failure fallback. Keep **one** `renderer.render` call and no new WebGL resources beyond the rod meshes.
6. **UI and frames** — subtitle, build note, RF-21/RF-22 (the exact RF-10/RF-6 **camera** poses; RF-22 section X = 388.3, not RF-6's 402.5), no new control.
7. **Tests** — `rodVariant.test.ts` (1, 2, 5–7, 11–12), `internalVariants.test.ts` (10 and the pure part of 5), the budget/frames/text edits (3, 4, 8, 9), and the pre-M13 `catalog/modified.json` fixture for the only-one-diff assertion. Run `npm run typecheck && npm test && npm run build`.
8. **Measure and optimise** — build the asset; record actual triangles (cap 1,400), bytes (cap 48 KiB), bounds, pivot, watertightness/components; run the `?benchmark=1` matrix (stock/worst × desktop/phone × rods off/on, plus rods-on Section X @ 388.3); record p95/headroom, the section-on submitted/call rows from §7.7, the rod section-cap triangles at 388.3 (≤ 16,000 total), the combined internal total 274,784 for rods + low-comp pistons, the derived cap guard **319,128 / 872**, and the page-weight delta. Hit the §7 targets or stop and report.
9. **Frames** — add RF-21/RF-22 to `src/ui/referenceFrames.ts` with RF-22 at section X = 388.3; capture at 1440×900 → 1024×640; verify the §8.1 checklist, including that RF-22 actually cuts the station-0 RH rod; re-capture RF-1…RF-20 with `rods_stock` and compare them visually (manual gate), recording the notes. If RF-21/RF-22 fail, stop and report with a proposed pose (G-FRAME-M13).
10. **Docs** — `docs/M13-INTERNAL-VARIANTS.md`, `docs/M13-MEASUREMENTS.md`, then the §11/§12 paperwork, `docs/REFERENCE_FRAMES.md`, `docs/ASSET_CONTRACT.md`, `assets-src/PROVENANCE.md`, and the two images.

No new npm dependencies; no catalog slot/interface/perf/core/shell/cover/existing-asset changes. When done, push the branch and send a closing summary covering: files changed; test/typecheck/build results; the rod asset audit (triangles, bytes, bounds, pivot, watertightness, materials); the catalog closure table; the `?benchmark=1` stock/worst × desktop/phone × rods-off/on rows with headroom and the derived guard 319,128 / 872; the rod-on Section X @ 388.3 cap count and the section-on submitted/call rows; the RF-21/RF-22 captures with SHA-256 and checklist results; the RF-1…RF-20 manual invariance notes; the OD-1 decision as recorded; and anything that deviated from this spec. Buckley verifies from a fresh clone, opens the PR, and merges.
