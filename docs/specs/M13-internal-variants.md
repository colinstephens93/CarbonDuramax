# Milestone 13 Spec — Internal-Part Visual Variants (Forged Rods + Catalog Closure)

Repo: `colinstephens93/CarbonDuramax` · Build branch: **`m13-internal-variants`** (create from `main` at `8394f1f`) · Planning branch: `plan/m13-internal-variants` · Planning package: this spec + [`docs/research/M13-internal-variants-survey.md`](../research/M13-internal-variants-survey.md); the independent D-037 QA record is produced by a separate agent after this draft · Plan reference: **new milestone, not in PLAN.md v2.2** — Milestone 13 is added by this spec's paperwork deliverables (§12.1), per the anti-drift rule, and discharges the post-M12 candidates line (`docs/PLAN.md:80`) and the OPEN_ITEMS internal-variant item (`docs/OPEN_ITEMS.md:18`).

**What changes in one sentence:** the app gains **one** part-local 3D visual — `rods_forged`, a stock-interface, heavier forged H-beam with thicker/wider flanges, a thicker web and stepped 12-point cap fasteners, labeled illustrative — while `injectors_plus30`, `cp3_stroker`, `cam_performance`, `heads_ported`, `tune_tow` and `tune_performance` are recorded **visual-less with reasons**, an explicit owner decision defers the cam/kinematics question, and the 24-entry catalog's visual dispositions are closed. **No other variant is invented.**

**Coding is done by the user in Antigravity on branch `m13-internal-variants`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

---

## 1. What Milestone 13 is

Milestones 0–12 shipped the engine, views, performance model, catalog, verified data, five external/piston visual variants, sound, the rebuilt exterior shell, capped cutaways and the optional intake cover. Five internal catalog entries still have `modelPath: null`: `rods_forged`, `injectors_plus30`, `cp3_stroker`, `cam_performance`, `heads_ported`. Four of them change performance numbers; `rods_forged` is a durability part whose `performanceParams` is empty. **D-038** recorded all five as out of scope at M8, each with a reason. M13 re-tests every D-038 reason against the **current shipped code and geometry** (M10's rebuilt shell, M11's cap sources, M12's scene-placed add-on) and then does one of two things per entry: adds a visible signature defensible from published data or clearly labeled illustrative, **or** records an explicit no-visual outcome with the reason. It does not invent geometry to make the list complete.

1. **One new internal visual: `rods_forged`.** The stock rod is a forged H-beam (1,180 tris × 8); the aftermarket part is published as a **thicker-flanged H-beam with ARP L19 fasteners**, not a material-only change. The variant is a part-local drop-in (`public/models/variants/rot_conrod_c1_forged.glb`) with the **stock interface dimensions preserved** (163.0 mm c2c, 62.9 mm journal, 34.5 mm pin, 27.676 mm big-end axial width) and **labeled-placeholder** flange/web magnitudes. It is visible in the existing exploded/cutaway/X-ray/exterior-off internal views; it changes no performance number. §2.1, §4.
2. **Four recorded no-visual outcomes, each re-tested rather than copied.** Injectors: +30% flow is nozzle-internal and the nozzle is not hole-modelled; the external body is a remanufactured stock body. CP3: the M10 shell now **does** contain swappable `cp3Fuel/ext_cp3` geometry (the M8 "no swappable model" premise is cured), but the stroker's external housing is identical and the stroke is internal. Cam: no camshaft geometry exists; a cam visual implies a valve-kinematics decision. Heads: port geometry is unpublished and unmodelled; the external casting is identical. §2.2–§2.5.
3. **An explicit owner decision on the cam/kinematics question.** **OD-1**: M13 adopts **Option A (defer the cam visual)**. A visual-only cam that rotates at half crank speed but does not drive the valves would be mechanically dishonest; wiring lobe lift into the valve kinematics requires published duration/timing (not available) and opens the frozen `src/core/kinematics.ts` / `valveConfig.ts`. The spec does not silently assume either. §2.4.
4. **Catalog closure.** The two tunes are software calibrations and stay visual-less; the stock-only fuel rail stays visual-less. After M13 the 24-entry catalog is **6 entries with a variant `modelPath`** (5 M8 + `rods_forged`) + **18 without** (12 stock + 6 modified no-visual). Every entry has a recorded disposition. §2.6–§2.7.
5. **A budget record with a cap, not a measured asset.** Rod cap **1,400** triangles per instance, full-engine delta `+1,760` at the cap (`+1,536` at the 1,372-tri prototype). Stock scene 308,324 → **311,884** with rods + M12 cover (cap); worst 304,632 → **308,192**; the derived cap guard is **319,128 / 320,000 phone (872 triangles, 0.2725 % headroom)**. Draw calls are unchanged by rods (same 3 primitives as stock); the cover's +2 is unchanged. §7.
6. **Proof frames that are visible by construction, not copied blindly.** RF-21 reuses the **committed RF-10 exploded internal pose** (whose image already shows the rods) with `rods_forged` selected; RF-22 reuses the **committed RF-6 cutaway pose** with the variant rods capped. No new pose is invented in a VM with no WebGL; the build gate verifies both. §8.
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

**Decision: add a part-local visual variant for `rods_forged`.** The stock rod is a forged H-beam; the aftermarket part is published as a **thicker-flanged H-beam with ARP L19 fasteners** ("Strength is added by thickening up the flanges of the H beam and a reduced depth of cut towards the center of the rod…", Callies Compstar Xtreme, grade C). That is a **qualitative visible shape family**, not a material-only change. The exact flange/web magnitudes are not published, so the variant keeps the stock interface dimensions and labels the magnitudes as placeholders.

Why this passes the honest-geometry rule and the three M8 tests:

| M8 test | Result |
| --- | --- |
| (a) A visible geometry change | **Pass, qualitative** — wider/thicker H-beam flanges, a thicker web, and stepped 12-point cap fasteners. The published aftermarket description supports the shape family; the magnitudes are illustrative. |
| (b) The part's swappable geometry already exists | **Pass** — the stock conrod GLB is instanced ×8 with a pivot at the big-end bore axis; a part-local variant uses the existing M8 piston swap path. |
| (c) A truthful illustrative shape can be derived | **Pass as labeled illustrative** — the stock interface (163.0 / 62.9 / 34.5 / 27.676 mm) is published/modeled; the flange/web magnitudes are placeholders, exactly as the M8 external variants are illustrative shapes anchored by published dimensions. |

What the variant **must not** do: present the flange/web values as a measured aftermarket rod; change the 163.0 mm centre-to-centre, 62.9 mm journal, 34.5 mm pin or 27.676 mm big-end axial width; adopt the published 28.4 mm stock-matching aftermarket big-end width (it would close the 0.724 mm inter-rod gap); or claim a specific brand.

### 2.2 `injectors_plus30` — **no-visual**

**Decision: record no-visual; no asset.** The +30 % change is `maxFuelMm3` 120 → 156, i.e. **nozzle flow**. The shipped internal injector is a revolved body with a smooth nozzle-tip cone and **no holes** (924 tris × 8); the shell's eight external injectors are generic bodies with connectors and a return line (2,100 tris). The LLY nozzle is a published **7-hole SAC** nozzle, but the **hole diameter is not published** (the 0.155 mm vendor candidate is low-confidence and was explicitly not adopted in the cross-check). A hole-size delta at ~0.155 mm is sub-pixel at the app's scale and would not be visible; a fabricated external body difference would imply a shape the data does not support; adding holes only to the variant would falsely imply the stock injector has none. The existing static `injector` cap source and the shell `injectors` group are unchanged.

### 2.3 `cp3_stroker` — **no-visual** (M8 premise cured, conclusion stands)

**Decision: record no-visual; no asset.** M8 said "no swappable pivot-placed model existed." That premise **is cured by M10**: the rebuilt shell contains `cp3Fuel/ext_cp3` (380 tris) and `ext_fca` (180 tris) as scene-placed geometry, and the shell loader can preserve `cp3Fuel` direct child index `0` without touching the shell GLB. A CP3 swap is therefore technically possible now. But the stroker's published difference is an **internal cam-ring stroke**; the external housing is a replacement pump with the stock mounting/LLY fuel-pressure-regulator arrangement, and **no source publishes an external housing difference**. A swap would show the same housing under a different label — a fabricated visible delta. The catalog's `flowBaseKgH` / `flowSlopeKgHPerRpm` change is a steady-state flow parameter, not an external shape. The shell's CP3 geometry remains in the global merged shell cap source; the M11 caps are unchanged.

### 2.4 `cam_performance` — **no-visual + Owner Decision OD-1**

**Decision: record no-visual in M13; defer the cam visual. This is the explicit owner decision, not a silent assumption.**

What is published: stock lobe lift **7.273 mm intake / 5.907 mm exhaust** and rocker ratios **1.36:1 / 1.69:1** (GM LLY service table, grade A; D-044), giving derived valve lift **9.891 / 9.983 mm** (stored 9.9 / 10.0 mm). What is **not** published: duration, LSA, IVO/IVC/EVO/EVC, or a performance-grind lobe profile. The catalog's `cam_performance` change is `veFactor 1.04`, a volumetric-efficiency multiplier — **not a lobe profile**. Aftermarket grinds (e.g. 0.450 in lift / 258–268° duration, grade C) are different cams; a 0.450 in lobe would give 15.54 mm intake / 19.32 mm exhaust valve lift and make the stock 1.797 / 2.979 mm piston-to-valve clearances **negative by 3.84 / 6.34 mm** without reliefs. It is not the catalog's change and cannot be modelled as a drop-in.

**Why a cam visual implies a kinematics decision.** A camshaft turns at half crank speed and is the mechanical source of valve lift. The current sim drives valve lift from a `sin²` timing curve with published max lifts; there is no cam geometry and no lobe-profile input. The owner must choose one of:

| Option | What it means | Assessment |
| --- | --- | --- |
| **A — Defer (recommended)** | No cam visual in M13; `cam_performance` stays visual-less; a future milestone may add cam geometry **and** wire lobe lift if the owner opens the kinematics. | **Recommended.** Honest, bounded, no frozen-core change. |
| **B — Visual-only cam** | New cam geometry rotates at half crank speed but does not drive the valves. | **Rejected.** Mechanically dishonest: the displayed lobes would not correspond to the displayed valve motion. |
| **C — Cam + kinematics** | New cam geometry **and** a change to `src/core/kinematics.ts` / `valveConfig.ts` to drive lift from the lobe profile. | **Future milestone, not M13.** Requires a published duration/timing profile (not available) and a formal interface/decision change. |

> **Owner Decision OD-1 (for owner approval):** M13 adopts **Option A** as the spec's decision. The camshaft remains visual-less; a future cam visual is conditional on a separate decision to wire lobe lift into the valve kinematics. If the owner selects B or C, this spec is withdrawn and revised **before** the build starts; the builder must not add a decorative cam under this spec.

The `camshaft` slot's stock entry and the `cam_performance` entry remain `modelPath: null`; no cap source is added.

### 2.5 `heads_ported` — **no-visual**

**Decision: record no-visual; no asset.** `heads_ported` changes `flowFactor` 1.0 → 1.08 (+8 % port flow). The shipped head section (3,532 tris × 8) models the deck, four seat rings/guides, spring seats, injector bore and split rocker shaft — **not ports**. The shell's `heads` group (1,600 tris) is an external slab with exhaust-port stubs and no internal passages. LLY port geometry is **not published** (L7 §10; the cross-check agrees), and a CNC-ported head listing describes the process without dimensions. Porting is internal by definition; the external casting is identical. A guessed port shape would be fabricated, and adding it only to the variant would falsely imply the stock head has no ports. The static `head` cap source and the shell `heads` group are unchanged.

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
| Stock rod interface | 163.0 mm c2c; 62.9 mm journal; 34.5 mm pin; **27.676 mm** big-end axial width; flange 6.288 mm; web 4.428 mm | measured GLB; `dimensions.json`; GM LLY table |
| Internal injector | 924 tris × 8; smooth nozzle-tip cone; **no holes**; 2 materials | measured GLB; `build_cylinder1.py:1342-1396` |
| Shell injectors | 8 bodies (140 each) + 8 connectors (90 each) + return line (260) = **2,100 tris** | measured shell GLB |
| CP3 / fuel | Shell `cp3Fuel` group **1,400 tris**: `ext_cp3` 380, `ext_fca` 180, `ext_hp_rails` 300, `ext_hp_lines` 540; scene-placed, no preserved subtree today | measured shell GLB; `exteriorLoader.ts` |
| Camshaft | **No geometry**; valvetrain starts at the lifters; `camshaft_stock`/`cam_performance` null | `build_cylinder1.py`; catalog |
| Head | `sta_head_c1_stock.glb`, **3,532 tris** × 8 = 28,256; static cap `head`; no ports | measured GLB; `engineScene.ts:1404` |
| Shell heads | `heads` group **1,600 tris**; external slab + exhaust-port stubs | measured shell GLB |
| Tunes | `tune_tow`/`tune_performance` `modelPath: null`, `performanceParams` only | catalog |
| Scene totals | **308,324** stock (exterior on) / **304,632** M8 worst (5 variants) | measured GLBs + code arithmetic; §15.2 |
| Draw calls / VRAM / p95 | 96 / 97 desktop, 58 / 60 phone; 20.75 / 4.75 MiB; 16.8 / 17.0 ms p95 | M12 measured record; cross-check only, build re-measures |
| Cap sources | Stock rod is dynamic `conrod` (instanced 8); head/injector static; shell static; M11 ceiling 16,000 | `engineScene.ts:1404-1421`; `sectionCaps.ts:22` |
| Reference frames | RF-1…RF-20; **RF-10** (exploded internal, shows rods) and **RF-6** (cutaway, shows internal rods) are committed | `src/ui/referenceFrames.ts`; `docs/reference-frames/RF-10.png`, `RF-6.png` |

The facts that drive the design: **the stock rod is a genuine H-beam but the aftermarket part is published as a thicker-flanged H-beam, so one honest illustrative visual is possible**; **the other four internal entries have no truthful visible surface in the shipped geometry**; and **the current phone headroom is small (15,368 triangles in the measured worst case with the cover off; 2,632 in the M12 derived cap guard, which includes the cover cap)**, so the rod cap must be tight (1,400) and the multiplication must be honest.

---

## 4. The rod asset — technical contract

### 4.1 File and asset class

| Item | Value | Provenance |
| --- | --- | --- |
| Asset path | `public/models/variants/rot_conrod_c1_forged.glb` | Design |
| Asset class | **Part-local internal variant** (same class as M8 `rot_piston_c1_lowcomp.glb`; no new class) | D-038 / M8 §3.1 |
| Authoring source | `assets-src/blender/build_rod_variant.py` + `assets-src/rod_variant_dimensions.json`; stock interface read from `assets-src/dimensions.json` | Design |
| Contract root | `rot_conrod_c1_forged` (mesh node) | Design |
| Contract child | `rot_conrod_smallend_c1_forged` at `(0, 0, 163.0) mm` | Design |
| Materials | `mat_conrod_forged_steel`, `mat_conrod_bolts`, `mat_conrod_bushing` (3; same PBR family as stock; no textures/UVs) | Design |
| Triangle cap | **1,400** per instance; full-engine delta `(1,400 − 1,180) × 8 = +1,760` | Budget, §7 |
| File-size cap | **48 KiB (49,152 B)** | Budget, §7.8; prototype 28,008 B |
| Format | Uncompressed glTF 2.0 binary, Y-up export, indexed triangles, `POSITION` + `NORMAL` only, no `if_*` markers | `docs/ASSET_CONTRACT.md` part-local class |
| Runtime wrapper | `extractAllPartPrimitives` + `wrapInPartLocalFrame` (existing M8 path) | `src/renderer/partLoader.ts` |
| Mount | Part-local pivot at the big-end bore axis; the existing `applyV8KinematicState` positions all eight instances | Existing code |
| Catalog change | `rods_forged.modelPath = "models/variants/rot_conrod_c1_forged.glb"`; `explodeVectorMm` stays `[0,0,0]` (internal parts use the M4 explode pipeline) | §5.7 |

### 4.2 Dimensions and provenance

| Parameter | Value | Unit | Provenance | Why this value |
| --- | ---: | --- | --- | --- |
| Rod length (c2c) | **163.0** | mm | **published** — GM LLY service table; D-035 | Stock interface; must not change |
| Big-end journal bore | **62.9** | mm | **published** — GM LLY table; D-035 | Stock interface; must not change |
| Wrist-pin bore | **34.5** | mm | **published** — GM LLY table; D-035 | Stock interface; must not change |
| Big-end axial width | **27.676** | mm | **stock model** (`0.44 × 62.9`); M7 register | Preserves the 0.724 mm inter-rod gap; 28.4 mm aftermarket width **not adopted** |
| Big-end outer radius | **42.143** | mm | **stock model** (`1.34 × 31.45`) | Stock interface; cap/ear envelope unchanged |
| Small-end outer radius | **23.805** | mm | **stock model** (`1.38 × 17.25`) | Stock interface; piston-pin clearance unchanged |
| Beam flange outer Y (big end) | **30.343** | mm | **labeled placeholder**; stock 26.129; published qualitative "thicker flanges" | Wider H-beam; +4.214 mm/side, inside the bore and the stock bolt-ear envelope |
| Beam flange outer Y (small end) | **18.568** | mm | **labeled placeholder**; stock 16.187 | Tapered beam; inside the piston skirt |
| Flange thickness | **8.177** | mm | **labeled placeholder**; stock 6.288; published qualitative "thickening up the flanges" | Thicker flange; +1.889 mm |
| Web half-width (X) | **5.258** | mm | **labeled placeholder**; stock 4.428; published "reduced depth of cut" | Thicker web; +0.830 mm |
| Cap fasteners | stepped **12-point** profile, outer envelope **±48.725 mm** (same as stock) | mm | **labeled placeholder**; published "ARP L19 fasteners" (grade C) | A visible fastener-family cue without widening the rod |
| Triangle count | **1,372** prototype; cap **1,400** | tris | measured prototype (Blender 4.0.2); build records 5.2.3 actual | §15.3 |
| File bytes | **28,008** prototype; cap **49,152** | B | measured prototype; build records actual | §15.3, §7.8 |

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
- `ROD_VARIANT_TRIANGLE_CAP = 1_400`, `ROD_VARIANT_STOCK_TRIANGLES = 1_180`, `ROD_VARIANT_INSTANCES = 8`, `ROD_VARIANT_SCENE_DELTA_CAP = (1_400 − 1_180) × 8 = 1_760`.
- `ROD_VARIANT_MAX_FILE_BYTES = 49_152`.
- `ROD_VARIANT_ROOT_NAME = 'rot_conrod_c1_forged'`, `ROD_VARIANT_SMALLEND_NAME = 'rot_conrod_smallend_c1_forged'`, `ROD_VARIANT_SMALLEND_Z_MM = 163.0`, `ROD_VARIANT_BIG_END_WIDTH_MM = 27.676`, `ROD_VARIANT_BEAM_FLANGE_Y_MM = 30.343`.
- `INTERNAL_VISUAL_SLOTS = ['pistons', 'rods'] as const`.
- `isInternalVisualSlot(slotId)`.
- `computeInternalVariantSceneDelta(selections)` — returns the **cap** delta for selected internal variants (pistons +2,944 at the M8 piston cap; rods +1,760 at the rod cap), used by the budget guard and the pure swap test.
- `computeRodVariantSceneDelta(trianglesPerInstance)` — returns `(trianglesPerInstance − 1,180) × 8`; the test uses `1,372` for the prototype and `1,400` for the cap.
- `INTERNAL_VISUAL_DISPOSITIONS` — the 24-entry machine-checkable register: `{ id, slotId, kind: 'variant-model' | 'stock' | 'no-visual', reason, evidence, ownerDecision? }`.
- `CAM_OWNER_DECISION = 'OD-1-A'` and `CAM_OWNER_DECISION_TEXT` (the exact OD-1 text).
- `ROD_VARIANT_ILLUSTRATIVE_NOTE` — the one-line docs/source note that the flange/web magnitudes are placeholders.

No Three.js import; `src/core/**`, `src/perf/**`, `src/config/**` and `catalog/**` are untouched by this module.

### 5.2 `src/renderer/partVariants.ts` — two additive edits

1. `VISUAL_VARIANT_SLOTS` becomes `[...EXTERNAL_VISUAL_SLOTS, 'pistons', 'rods']`.
2. `VARIANT_TRIANGLE_CAPS` gains `rods_forged: 1400`; the total variant cap becomes `10,800 + 5,200 + 1,400 = 17,400` (the M8 "all variant files ≤ 16,000" is superseded by the M13 record; the **scene** budget is unchanged).

`EXTERNAL_VISUAL_SLOTS`, `EXTERIOR_PRESERVED_SUBTREES`, `EXTERIOR_PRESERVED_TRIANGLES` and `SHELL_PARTS_REPLACED_BY_SLOT` are unchanged — `rods` is internal and replaces no shell subtree.

### 5.3 `src/renderer/engineScene.ts` — additive changes only

1. **State:** `loadedInternalPrimsById` (replacing the piston-only map), `rodBatch: InstancedPartBatch | null`, `stockConrodBatch: InstancedPartBatch | null`, `attachedRodVariantId: string | null`, `rodVariantActive` in the stats.
2. **Preload:** in the existing `configuredVariants` loop, treat `desc.slotId === 'pistons' || desc.slotId === 'rods'` as an internal part-local load: `loadPartGltf` + `extractAllPartPrimitives`, add geometries/materials to the existing disposal and clippable sets, store in `loadedInternalPrimsById`. Do **not** call `loadVariantScene`, do **not** add a static cap source, do **not** attach to the scene root. `variantsLoaded` still settles on success or failure; a failed rod load goes to `failedVariantIdSet`, leaves the stock rods in place, and does not hang the benchmark.
3. **Rod batch:** `buildRodBatch(prims)` creates one `InstancedPartBatch` with `createInstancedBatch('conrod_variant', prims, 8, v8Batches.root, undefined, false)`; register it for disposal; register a **dynamic** cap source:
   ```
   registerInstancedCapSource(dynamicCapSources, 'conrod_variant', rodBatch, false)
   ```
   with the same `instanced:true, count:8, static:false, skipWhenGhosted:false` shape as the stock `conrod` source.
4. **Swap:** in `syncVisualVariants`, after the external/shell pass and before the piston pass, resolve `selectedRodDesc` (`slotId === 'rods'`). If the active-and-loaded rod variant differs from `attachedRodVariantId`:
   - remove/hide the previous rod batch meshes (stock or variant) from `v8Batches.root`;
   - add/show the next batch meshes;
   - set `v8Batches.conrod = nextBatch`;
   - recompute the scene total from the **base** non-piston triangle sum (`baseNonPistonInternalTriangles − stockConrodBatch.totalTriangles + currentConrodBatch.totalTriangles + currentPistonSet.totalTriangles`), so toggling rods on/off never accumulates;
   - set `attachedRodVariantId`;
   - run **one** `applyV8KinematicState` after both the rod and piston swaps (not one per swap), so a paused scrub updates instantly.
   The stock `conrod` cap source stays registered; when its meshes are hidden/removed, `buildCapGeometry` skips it via `isObjectAndAncestorsVisible`; the variant source is skipped while hidden.
5. **Stats:** add `rodVariantActive: boolean`, `rodVariantTriangles: number` and `rodSceneTriangles: number` to `EngineRenderStats`; add `rodVariantActive` to `getVisualVariantState()`, and include `rods_forged` in `activeVariantIds`/`attachedVariantIds` when selected/attached. `visibleSceneTriangles` continues to use `v8Batches.totalTriangles`, which now reflects the rod delta; `variantSceneTriangles` adds the active rod batch's triangles for reporting. `pistonVariantActive` keeps its meaning.
6. **Dispose:** dispose the rod batch's `InstancedMesh` objects through the existing `instancedMeshesToDispose` set; the primitive geometries/materials are already in the disposal sets. No new render target/texture/geometry ownership.
7. **No new render pass:** `renderer.render(` remains exactly one call; no `WebGLRenderTarget`, no stencil, no `setRenderTarget`, no `overrideMaterial`, no new cap material.

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
  sectionPositionMm: 402.5,
  xray: false,
  labels: false,
  variants: ['rods_forged'],
},
```

The poses are exactly the committed **RF-10** and **RF-6** poses, not new camera positions; §8.2 states why that is the visibility-by-construction choice.

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

The rod variant uses the **existing M4 internal explode pipeline** (`computePartGroupExplodeOffsetMm('conrod', …)`), not the catalog `explodeVectorMm`; `rods_forged.explodeVectorMm` is `[0,0,0]`. At Explode 100 %, the rods separate with the rest of the internal assembly exactly as the stock rods do; the variant does not add a second explode vector or drift.

### 6.3 M11 section cutaways

- The rod variant is a **dynamic** cap source (`conrod_variant`, instanced 8, `static:false`, `skipWhenGhosted:false`), registered alongside the stock `conrod` source. The cap builder slices either batch; the hidden one is skipped by visibility.
- The variant geometry is watertight (0 boundary edges, 10 closed components), so the cap is a true solid cross-section, not a chord-closed shell.
- The M11 cap ceiling (`SECTION_CAP_MAX_TRIANGLES = 16,000`) is unchanged; the variant adds rod cap triangles only when the plane cuts a rod and the variant is selected. The build records the actual cap triangles at `X = 402.5` and `Y = −185`; a cap total above 16,000 is a stop-and-report.
- No new cap material, hatch, colour, stencil, render target or extra pass. The stock rod cap source and the other dynamic sources are unchanged.

### 6.4 X-Ray and exterior context

The rod variant is **internal**: it renders with Exterior off, with Exterior on and X-Ray on (the shell is ghosted), and in the exploded/cutaway views. It is not visible through an opaque exterior shell, exactly like the stock rods. It does not join the exterior ghost registry (it is not a shell material), does not hide any shell subtree, and does not interact with the M12 cover (which is exterior-only).

### 6.5 Labels

No new label anchor. The existing `Connecting rod`/`Piston`/internal labels and the 23-anchor rules are unchanged; the rod variant is the same part at the same anchors, so the labels track it automatically. The firing highlight remains on the pistons only; the rods use the stock forged-steel materials and are not emissive.

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
| Rod scene triangles (prototype) | **1,372 / instance**; full-engine **10,976** | measured prototype |
| Full-engine delta at cap | **+1,760** | `(1,400 − 1,180) × 8` |
| Full-engine delta at prototype | **+1,536** | `(1,372 − 1,180) × 8` |
| Rod GLB file size | **28,008 B** prototype; **≤ 49,152 B** cap | measured prototype; §7.8 |
| Rod draw calls | **0 net** | 3 primitives, same as the stock rod (2 rod + 1 small-end) |
| Rod texture/HDRI VRAM | **+0.00 MiB** | No textures/images/UVs |
| Rod submitted triangles / frame | **+1,760** main pass + **+1,760** desktop shadow pass (phone: +1,760) | castShadow = true, same as stock |
| Rod section-cap triangles | **measured at build; included in the 16,000 ceiling** | dynamic `conrod_variant` source |

### 7.4 Full-engine budget arithmetic (stock and worst case, both tiers)

Using the **cap** 1,400 for conservatism; the prototype actual (1,372) only increases the headroom.

| Metric | D-033 cap (desk / phone) | Stock measured | Stock + rods + cover (cap) | Headroom (desk / phone) | Utilisation (desk / phone) | Worst measured | Worst + rods + cover (cap) | Headroom (desk / phone) | Utilisation (desk / phone) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Scene asset triangles | 360,000 / 320,000 | 308,324 | **311,884** | **48,116 / 8,116** | **86.63 % / 97.46 %** | 304,632 | **308,192** | **51,808 / 11,808** | **85.61 % / 96.31 %** |
| Submitted triangles / frame | 700,000 / 400,000 | 579,484 / 307,876 | **584,804 / 311,436** | **115,196 / 88,564** | **83.54 % / 77.86 %** | 568,880 / 304,512 | **574,200 / 308,072** | **125,800 / 91,928** | **82.03 % / 77.02 %** |
| Draw calls / frame | 250 / 120 | 96 / 58 | **98 / 60** | **152 / 60** | **39.20 % / 50.00 %** | 97 / 60 | **99 / 62** | **151 / 58** | **39.60 % / 51.67 %** |
| Texture + HDRI VRAM | 64 / 32 MiB | 20.75 / 4.75 | **20.75 / 4.75** | **43.25 / 27.25 MiB** | **32.42 % / 14.84 %** | 20.75 / 4.75 | **20.75 / 4.75** | **43.25 / 27.25 MiB** | **32.42 % / 14.84 %** |
| Frame time p95 @ 900 rpm | 16.7 / 33.3 ms | 16.8 / 17.0 ms | **measured at build** | — | — | 16.8 / 17.0 ms | **measured at build** | — | — |

The `+ rods + cover` columns use the cap 1,400 (rods) and the M12 cover cap 1,800. The prototype actuals are **311,660** stock and **307,968** worst (scene), i.e. 224 triangles lower than the cap rows; the cap rows are the conservative numbers and are the ones the acceptance uses.

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

### 7.7 Section state

With Section on and `rods_forged` selected, the rod adds its **scene** triangles (1,400 cap) and its **dynamic cap** triangles (measured at build) on top of the M11 cap total. The M11 cap ceiling of 16,000 and its +2 cap draw calls are unchanged; the rod cap is part of the existing dynamic cap mesh, not a third cap mesh. The build records the `X = 402.5` and `Y = −185` cap counts and the static/dynamic CPU times; a cap total above 16,000 is a stop-and-report.

### 7.8 Page weight

The rod GLB is fetched at startup with the other variants (preloaded so selection is instant) and is hidden when stock rods are selected. At the prototype 28,008 B, the raw startup delta against the M9 baseline (`10,050,510 B`) is **+0.279 %**; at the 49,152 B cap it is **+0.489 %**. The build records the actual GLB bytes and the `vite build` JS min/gzip delta; a GLB above 48 KiB is a stop-and-report.

### 7.9 Frame time

The rod adds 1,400 triangles and no draw calls; the build must run the standard `?benchmark=1` 10 s matrix (stock/worst × desktop/phone × rods off/on, plus rods-on with Section X @ 402.5) and record p95. The acceptance target is **p95 within +0.30 ms of the M12 detail rows for the same tier/state (desktop 16.8 ms, phone 17.0 ms)** and **0 dropped frames**. A p95 above the D-033 cap is a stop-and-report.

---

## 8. Visual proof — reference frames

All captures at the standing `1440×900 → 1024×640` convention, production preview, `?rf=…`. The two new frames are added to `docs/REFERENCE_FRAMES.md`; RF-1…RF-20 are unchanged with the rod variant off.

| Frame | Status | Crank angle | Camera position → target (m) | Exterior / views | What it is for |
| --- | --- | ---: | --- | --- | --- |
| **RF-21** | **New** | 90° | `[1.2800, −1.0800, 0.7400] → [0.3100, −0.0500, 0.1800]` (RF-10 pose) | **Exterior off**; **Explode 100 %**; Section off; X-Ray off; Labels off; **`rods_forged`** | **Rod appearance:** the eight variant rods in the exploded internal assembly — the wider/thicker H-beam, the stepped 12-point cap fasteners, the stock big-end/ small-end interface, and no clipping of the pistons/crank/adjacent rods. |
| **RF-22** | **New** | 0° | `[1.0600, −0.5400, 0.4800] → [0.2900, −0.0200, 0.1400]` (RF-6 pose) | **Exterior off**; Explode 0; **Section X @ 402.5 mm**; X-Ray off; Labels off; **`rods_forged`** | **Rod section:** the variant rod's solid, hatched cross-section at the M11 cut plane, continuous with the existing cap convention; the section does not open a gap or a false cavity. |

### 8.1 Checklist per frame

**Shared (both):**
1. The variant is present on all eight rods; the stock rods are not also visible (no double geometry).
2. The H-beam is visibly wider/thicker than the stock rod; the cap fasteners read as a stepped 12-point head.
3. The rod keeps the stock big-end width and journal; the cap sits on the crankpin, and the small end sits on the piston pin.
4. No rod intersects the piston skirt, crank web, adjacent rod, block or oil pan.
5. The firing-highlight colour remains on the pistons only; the rods are not emissive.
6. The rod material reads as forged steel with a dark fastener and bronze bushing; no texture/decal.

**Per-frame:**
- **RF-21:** the exploded rods are separated with the rest of the internal assembly; the beam/flange difference is legible at this camera; the eight rods are all visible; the labels (off) do not obscure the part.
- **RF-22:** the cut face is a flat, hatched solid at X = 402.5 mm; there is no open chain, gap, or floating cap; the rod section is continuous with the M11 cap convention; the rest of the cut assembly is unchanged.

### 8.2 Why these poses are visible by construction (the M12 lesson, D-047)

M12's planning session had no WebGL and pinned poses copied from other frames; two failed at build time because the copied camera did not actually see the cut face. M13 applies the lesson:

- **RF-21 is not a new pose.** It is exactly the committed **RF-10** pose — the M8 exploded internal view whose committed image already shows the eight conrods (labeled `Connecting rod`) with Exterior off and Explode 100 %. The variant swaps the eight conrod meshes **in place**; the same camera sees the variant rods. Visibility is by construction, not by hope.
- **RF-22 is not a new pose.** It is exactly the committed **RF-6** pose — the M11 cutaway whose committed image already shows the internal rods and the solid cap convention at `X = 402.5 mm`. The variant rod is a dynamic cap source with the same slice path; the cut face is capped by construction.
- **No new camera position is invented in this VM.** The planning session has no WebGL (§15.1), so a novel close-up would be an unverified guess. The two committed internal frames are the honest choice.
- **Build gate G-FRAME-M13:** on the reference GPU, capture RF-21/RF-22 and verify every checklist item. If the rod variant is not legible, or the cap is missing, **stop and report** with a proposed pose; do not silently re-pin the frames. A pose deviation needs owner approval and is recorded in `docs/M13-MEASUREMENTS.md` / `DECISIONS.md` following the D-047 precedent.

### 8.3 Invariance

- With `rods_stock` selected, RF-1…RF-20 are re-captured and compared **visually** against the committed PNGs by the reviewer, with the subtitle masked; the 3D viewport content must be visually unchanged because the variant batch is hidden and the stock batch is untouched. This is a **manual visual gate** (no pixel-diff harness is committed); the reviewer records the comparison and any difference in `docs/M13-MEASUREMENTS.md`; any visible difference is a stop-and-report.
- With `rods_forged` selected, only RF-21/RF-22 are new; no existing frame is re-baselined.
- No frames are added for the four no-visual entries — a "frame" of an unchanged scene would prove nothing. Their disposition is documented and machine-checked in §9 test 10.

---

## 9. Tests

The existing suite (104 tests, 21 files at M12) must pass. Test-file accounting: **2 new files** (`src/renderer/rodVariant.test.ts`, `src/renderer/internalVariants.test.ts`) + **6 edited files** (`src/catalog/modified.test.ts`, `src/catalog/visualVariants.test.ts`, `src/renderer/partVariants.test.ts`, `src/renderer/intakeCover.test.ts`, `src/ui/referenceFrames.test.ts`, `src/ui/uiText.test.ts`). No other test file is edited; `src/assets/**` is frozen.

**`src/renderer/rodVariant.test.ts` (new; Node-only; `node:fs` GLB parse + pure module; no WebGL):**

1. **Asset contract.** `public/models/variants/rot_conrod_c1_forged.glb` exists; file size ≤ **49,152 B**; root `rot_conrod_c1_forged` with child `rot_conrod_smallend_c1_forged` at `(0, 0, 163.0) mm`; exactly **3** `MeshStandardMaterial`s; no images/textures/UVs/skins/morphs/animations and no `if_*` markers; indexed `POSITION` + `NORMAL` triangles; **≤ 1,400** tris; bounds X ±13.838, Y ±48.725, Z −42.143…186.805 mm (±0.10 mm); big-end axial width **27.676 ±0.05 mm**; beam flange outer Y **30.343 ±0.20 mm**; watertight (0 boundary edges at 1e-5 m) with **10** closed components. *Catches: a missing/renamed asset, a texture/decal smuggled in, a stray marker, a budget or file-size overrun, a wrong pivot or bounds, a rod that would close the inter-rod gap, and an open mesh that the M11 cap builder would chord-close into a fake solid.*
2. **Stock interface preservation.** The variant's 163.0 mm c2c, 62.9 mm journal, 34.5 mm pin and 27.676 mm big-end width agree with `assets-src/dimensions.json` and the stock `rot_conrod_c1_stock.glb` within **±0.05 mm**; the small-end child translation is 163.0 ±0.001 mm. *Catches: a builder changing the rod length/journal to make the shape fit, which would break the kinematics or the shared-pin layout.*
3. **Catalog closure (edit `src/catalog/modified.test.ts` and `src/catalog/visualVariants.test.ts`).** In `modified.test.ts`, add `rods_forged` to the expected visual map (`modelPath: 'models/variants/rot_conrod_c1_forged.glb'`, `explodeVectorMm: [0,0,0]`); the map has 6 visual entries and the other 6 modified entries stay null/zero. In `visualVariants.test.ts`, exactly **6** entries have a non-null `modelPath`; the expected set is the 5 M8 ids + `rods_forged`; `rods_forged.modelPath` is exactly `models/variants/rot_conrod_c1_forged.glb`; `rods_forged.explodeVectorMm` is `[0,0,0]`; the other **18** entries have `modelPath: null` and `[0,0,0]`; all 12 stock entries remain null. `visualVariantsForBuild(fullVisualBuild)` returns the 6 in slot order; the non-visual modified build (`injectors_plus30`, `cp3_stroker`, `tune_performance`, `cam_performance`, `heads_ported`) returns `[]`; `slotForVariantId('rods_forged') === 'rods'`. *Catches: a second visual entry sneaking in, a wrong path, a stock entry with a model, a rods entry missing, a non-visual entry silently gaining a model.*
4. **Visual slot lists and budget guard (edit `src/renderer/partVariants.test.ts`).** `VISUAL_VARIANT_SLOTS` is `[...EXTERNAL_VISUAL_SLOTS, 'pistons', 'rods']`; `VARIANT_TRIANGLE_CAPS.rods_forged === 1_400`; the external list and `SHELL_PARTS_REPLACED_BY_SLOT` are unchanged (no rods entry); the total variant cap is **17,400**; the derived worst-case scene is **319,128 ≤ 320,000** with phone headroom **872** and desktop **40,872**; draw calls are unchanged by rods (3 primitives, same as stock) and the cover's +2 gives **98/60 stock, 99/62 worst**. *Catches: a rod cap that breaches the phone budget, a missing slot list entry, a shell replacement mistakenly mapped to rods, a budget test that ignores the new variant.*
5. **Swap logic (pure module + source check).** `computeInternalVariantSceneDelta` returns 0 for stock, **+1,760** for `rods_forged` at the cap, 0 for `rods_stock`, and the combined piston+rods cap delta when both are selected; `computeRodVariantSceneDelta(1,372)` returns **+1,536** and `computeRodVariantSceneDelta(1,400)` returns **+1,760**; `isInternalVisualSlot('rods')` is true; `engineScene.ts` contains the `desc.slotId === 'pistons' || desc.slotId === 'rods'` branch, `attachedRodVariantId`, the `v8Batches.conrod` swap, and `registerInstancedCapSource(dynamicCapSources, 'conrod_variant'`. *Catches: a default-on rod, a wrong delta, a selection that silently keeps the stock rods, a missing cap source.*
6. **Cap compatibility.** The variant rod is registered as a **dynamic** cap source with `instanced:true`, `count:8`, `static:false`, `skipWhenGhosted:false`; the stock `conrod` source remains; `SECTION_CAP_MAX_TRIANGLES` is `16_000`; `renderer.render(` appears exactly once; no `new THREE.WebGLRenderTarget(`, `stencil: true`, `setRenderTarget`, or `overrideMaterial` is added; the cap material is unchanged. *Catches: a visible-but-uncapped rod, an extra pass, a cap that disappears in section, a new cap material.*
7. **Performance neutrality.** `computeCurve`/`computeDetails` for a build with `rods_forged` exactly equal the stock build's values; `checkCompatibility` returns `[]` for `rods_forged` alone and for `rods_forged + pistons_lowcomp + turbo_large`; `rods_forged.performanceParams` is `{}`; `provenance` is `"illustrative"`. *Catches: a performance parameter accidentally added, a compatibility rule, a variant that changes the dyno.*
8. **Reference frames (edit `src/ui/referenceFrames.test.ts`).** RF-21/RF-22 exist after RF-20; each validates through the existing loop; both have `variants: ['rods_forged']`, `exterior: false`, `xray: false`/undefined, `labels: false`/undefined, `intakeCover` undefined/false; RF-21 has `explodePercent: 100` and `sectionMode: 'off'`; RF-22 has `explodePercent: 0`, `sectionMode: 'x'`, `sectionPositionMm: 402.5`; RF-21's pose equals RF-10's and RF-22's pose equals RF-6's (the construction choice); RF-1…RF-20 are unchanged; `docs/REFERENCE_FRAMES.md` lists RF-21/RF-22. *Catches: a `?rf=` URL that silently falls back, a frame with the wrong section/explode state, a stock frame that accidentally turns the rod variant on, a new pose that does not show the rods.*
9. **UI text (edit `src/ui/uiText.test.ts`).** Subtitle `Milestone 13 — Internal Part Variants` appears in both `engineControls.ts` and `index.html`; the exact build note in §10.2 appears; the M12 `Intake cover` label/note, the M11 cutaway note and the M10 disclaimer caption are unchanged; no `rods` checkbox/default-on control is added; the `rods_stock` default is present. *Catches: a subtitle drift, a stale build note that says only the piston is internal, a default-on control, a lost M12/M11 caption.*
10. **No-visual dispositions (new `src/renderer/internalVariants.test.ts`).** `INTERNAL_VISUAL_DISPOSITIONS` contains every catalog id exactly once; exactly **6** are `variant-model` (5 M8 + `rods_forged`), **12** are `stock`, **6** are `no-visual` (`injectors_plus30`, `cp3_stroker`, `cam_performance`, `heads_ported`, `tune_tow`, `tune_performance`); every no-visual has a non-empty `reason` and `evidence`; the two tunes' reasons mention "software calibration"; `fuelRail_stock` is present as `stock`; `CAM_OWNER_DECISION === 'OD-1-A'` and the OD-1 text matches the docs. *Catches: an unclassified catalog entry, a no-visual entry that later gets a `modelPath` without updating the register, a missing cam owner decision, a tune treated as a visual candidate.*
11. **Frozen-asset identity.** SHA-256 of the ten stock GLBs, the five M8 variant GLBs, the M12 cover, the M10 shell, `catalog/stock.json`, `catalog/schema.json` and `src/core/interfaces.ts` match the pinned hashes (the M8/M12 records). The M12 `intakeCover.test.ts` test 12 currently pins `catalog/modified.json` to the pre-M13 blob; the build **re-pins that one literal** to the post-M13 blob whose only diff is the `rods_forged.modelPath` value, renames/clarifies the test description to record the sanctioned M13 catalog change, and leaves every other hash/assertion in that test unchanged. A separate assertion compares the new `catalog/modified.json` against the pre-M13 blob and confirms the only diff is the one `modelPath`. *Catches: a builder "fixing" the stock rod/shell, changing an M8 variant, or editing the frozen interface; and a catalog edit beyond the one sanctioned value.*
12. **Load-failure fallback.** Source/behavior check: a failed rod load adds the id to `failedVariantIdSet`, sets `variantsLoaded` (settled), leaves the stock conrod batch in place, and does not throw; the benchmark gate does not hang. *Catches: a missing asset that hides the stock rods or hangs the benchmark.*

The headless tests cannot judge the look. RF-21/RF-22 are the visual gate; that split is the same one used since M2.

---

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
2. **`docs/M13-MEASUREMENTS.md` (new):** the measured record — production bundle; the rod build log (triangles, bounds, materials, marker/pivot, watertightness, file size/page-weight delta); the current scene baseline; the `?benchmark=1` matrix (desktop/phone × stock/worst × rods off/on, plus rods-on Section X @ 402.5) with the D-033 verdict table and headroom; the **derived cap guard 319,128 / 872**; the rod section-cap triangles; the RF-21/RF-22 captures with SHA-256 and checklist results; the manual RF-1…RF-20 invariance comparison notes; the frozen-file audit; the exact commands.
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
>     - Add the forged connecting-rod visual variant (`rods_forged`) as a part-local drop-in for the eight instanced rods — a stock-interface heavier H-beam with thicker/wider flanges, a thicker web and stepped 12-point cap fasteners, labeled illustrative — and record the remaining internal entries (`injectors_plus30`, `cp3_stroker`, `cam_performance`, `heads_ported`) as visual-less with reasons, closing the 24-entry catalog's visual dispositions; confirm `tune_tow`/`tune_performance` are software calibrations with no geometry.
>     - Exit: selecting `rods_forged` swaps the eight instanced rods and restoring stock restores the shipped scene; the asset passes the contract and the 1,400-triangle cap; D-033 passes on both tiers with measured numbers; RF-21/RF-22 pass their checklists; the no-visual register and the cam owner decision (OD-1) are recorded; PLAN/DECISIONS/OPEN_ITEMS/ASSET_CONTRACT are updated in the same PR.

Replace the post-12 candidates line with:

> After 13: stock vehicle-side hardware models, real wall-thickness section geometry, an analytic coil section for the valve springs, a camshaft visual with valve-lift kinematics (owner decision deferred, D-048), and shareable builds (deprioritised by the owner, 2026-11-15 — D-045) are candidates.

### 12.2 `docs/DECISIONS.md`

Add under a new `## 2026-11-16 — Milestone 13 spec` heading:

> - **D-048 Internal-part visual variants (Milestone 13).** `rods_forged` becomes the sixth catalog entry with a 3D variant: a **part-local** `public/models/variants/rot_conrod_c1_forged.glb` drop-in for the eight instanced conrods, preserving the stock interface (163.0 mm c2c, 62.9 mm journal, 34.5 mm pin, **27.676 mm** big-end axial width) and adding an illustrative heavier H-beam (wider flanges 30.343 / 18.568 mm vs stock 26.129 / 16.187; flange thickness 8.177 vs 6.288 mm; web half-width 5.258 vs 4.428 mm) with stepped 12-point cap fasteners. The shape family is anchored by the published Callies Compstar Xtreme description (4340 forged H-beam, ARP L19 fasteners, "thicker flanges / reduced depth of cut", grade C); the flange/web **magnitudes are labeled placeholders**, not measured aftermarket dimensions. The published stock-matching 28.4 mm big-end width is **not adopted** (it would close the 0.724 mm inter-rod gap); the 2.480 in aftermarket journal and 1,182 g weight are recorded, not adopted. **No-visual outcomes, re-tested:** `injectors_plus30` (nozzle-internal flow; the 7-hole count is published but hole diameter is unverified and the external body is a remanufactured stock body), `cp3_stroker` (M10's `cp3Fuel/ext_cp3` now makes a swap technically possible — the M8 "no swappable model" premise is cured — but the stroker's external housing is identical and the stroke is internal), `heads_ported` (LLY port geometry unpublished and unmodelled; external casting identical), and `cam_performance` (no camshaft geometry; a visual implies wiring lobe lift into the valve kinematics). **Owner Decision OD-1:** the cam visual is **deferred** (Option A); a future cam visual requires a separate decision to open `src/core/kinematics.ts`/`valveConfig.ts` and a published duration/timing profile; a visual-only cam that does not drive the valves is rejected as mechanically dishonest. `tune_tow`/`tune_performance` are **software calibrations** with no geometry; `fuelRail_stock` is stock-only. The 24-entry catalog is **closed**: 6 entries carry a variant `modelPath` (5 M8 + `rods_forged`), 18 do not (12 stock + 6 modified no-visual). **Budgets:** rod cap **1,400** tris (prototype 1,372; full-engine delta +1,760 at the cap / +1,536 at the prototype); current scene 308,324 stock / 304,632 worst; stock + rods + M12 cover **311,884** (cap) / 311,660 (prototype), worst + rods + cover **308,192** (cap) / 307,968 (prototype); derived cap guard **319,128 / 320,000 phone (872 triangles, 0.2725 %)** and **319,128 / 360,000 desktop**; draw calls unchanged by rods (3 primitives, same as stock), cover +2; texture VRAM unchanged. **Frozen:** `src/core/interfaces.ts` (D-010), `src/perf/**`, `src/config/**`, `catalog/stock.json`, the catalog schema, the ten stock GLBs, the five M8 variant GLBs, the M10 shell and the M12 cover; the only catalog change is the one `rods_forged.modelPath` value in `catalog/modified.json`.

### 12.3 `docs/OPEN_ITEMS.md`

Remove the deferred-candidate item:

> `- [ ] **Internal-part visual variants not in M8** — rods (material-only), injectors/CP3 (flow-internal, no truthful visible change), camshaft (not modeled; timing unpublished), heads (porting unpublished/unmodeled). Deferred until a milestone adds the underlying geometry or published data.` (`docs/OPEN_ITEMS.md:18`)

Add to **Watch items**:

> - [ ] **`rods_forged` variant flange/web dimensions are illustrative placeholders** — no published aftermarket H-beam flange thickness or web depth; M13 adopts the stock interface (163.0 mm c2c, 62.9 mm journal, 34.5 mm pin, 27.676 mm big-end width) and the published qualitative Callies description ("thicker H-beam flanges / reduced depth of cut", ARP L19 fasteners), with the flange/web magnitudes labeled placeholders. Revisit with a dimensioned aftermarket rod drawing or a measured part.
> - [ ] **Camshaft visual with valve-lift kinematics** — M13 defers the cam visual (owner decision OD-1). A cam that rotates at half crank speed but does not drive the valves would be mechanically dishonest; wiring lobe lift into the valve kinematics requires a published duration/timing profile (not available) and opens `src/core/kinematics.ts`/`valveConfig.ts` in a future milestone. Revisit only with an owner decision and a sourced lobe profile.
> - [ ] **Injector nozzle visual** — +30 % flow is nozzle-internal; the 7-hole count is published but hole diameter is unverified (0.155 mm candidate, low confidence). Revisit with a verified nozzle drawing or flow-bench data.
> - [ ] **Heads port visual** — LLY port geometry is unpublished and unmodeled; the external casting is identical. Revisit with a dimensioned port drawing or a scanned head.
> - [ ] **CP3 stroker external visual** — the stroker's difference is internal cam-ring stroke; the external housing is identical. Revisit only if a stroker with a distinct external housing/FCA is documented.
> - [ ] **Rod variant inter-rod clearance** — the variant keeps the 27.676 mm big-end axial width and the stock 0.724 mm inter-rod gap; do not adopt the published 28.4 mm aftermarket big-end width without re-checking the shared-pin layout. Revisit if the pin/seat geometry changes.

### 12.4 `docs/ASSET_CONTRACT.md`

Append to the part-local / scene-placed class section:

> ### M13 part-local internal variant (D-048)
>
> `public/models/variants/rot_conrod_c1_forged.glb` is a second **part-local** drop-in (after M8 `rot_piston_c1_lowcomp.glb`): contract root `rot_conrod_c1_forged`, child `rot_conrod_smallend_c1_forged` at `(0, 0, 163.0) mm`, origin at the big-end bore axis, three untextured `MeshStandardMaterial`s, no `if_*` markers, indexed `POSITION` + `NORMAL` triangles only, **≤ 1,400 triangles**, **≤ 48 KiB**. It is loaded through the existing `extractAllPartPrimitives` path and swapped into the eight instanced conrod slots; it adds no asset class, no pivot and no animation.

### 12.5 `assets-src/PROVENANCE.md`

Add to the variant table:

> | `public/models/variants/rot_conrod_c1_forged.glb` | `rot_conrod_c1_forged`, child `rot_conrod_smallend_c1_forged` | `assets-src/blender/build_rod_variant.py` + `assets-src/rod_variant_dimensions.json`; stock interface from `assets-src/dimensions.json` | **Verified:** stock interface (163.0 mm c2c, 62.9 mm journal, 34.5 mm pin, 27.676 mm big-end axial width); published qualitative aftermarket H-beam / ARP L19 description (Callies Compstar Xtreme, grade C). **Illustrative:** flange thickness 8.177 mm, flange outer Y 30.343 / 18.568 mm, web half-width 5.258 mm, 12-point head geometry, PBR. **Not adopted:** 28.4 mm big-end width (would close the 0.724 mm inter-rod gap), 2.480 in journal, 1,182 g weight. | repository source / original procedural work |

### 12.6 `docs/REFERENCE_FRAMES.md`

Add the two rows to the summary table and the two frame sections. The shared checklist header becomes:

> ## Rod-Variant Checklist (RF-21, RF-22, Milestone 13 Spec §8.1)

with the six shared items and the two per-frame items from §8.1. The intro count changes from "twenty" to "twenty-two"; the provenance line adds "M13". RF-21/RF-22 are captured at `1440×900 → 1024×640` and stored as `docs/reference-frames/RF-21.png` / `RF-22.png`.

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
4. `?benchmark=1` matrix: desktop/phone × stock/worst × rods off/on, plus rods-on Section X @ 402.5; scene/submitted/calls/VRAM/p95/dropped frames; the D-033 verdict table.
5. Derived cap guard **319,128 / 872** and the measured guard.
6. Rod section-cap triangles and cap CPU times.
7. RF-21/RF-22 captures with SHA-256 and checklist results.
8. Manual RF-1…RF-20 invariance comparison notes.
9. Frozen-file/SHA audit.
10. Any build deviation (with owner approval, D-047 precedent).

---

## 13. Acceptance criteria (Buckley verifies from a fresh clone)

1. **Frozen audit:** `git diff main -- src/core src/perf src/config src/audio src/assets src/renderer/exteriorLoader.ts src/renderer/layout.ts src/renderer/partLoader.ts src/renderer/variantLoader.ts src/renderer/viewLayout.ts src/renderer/sectionCaps.ts src/renderer/intakeCover.ts src/main.ts catalog/stock.json catalog/schema.json src/catalog/index.ts public/Duramax_LLY_2005_66L_V8.glb public/models/rot_piston_c1_stock.glb public/models/rot_conrod_c1_stock.glb public/models/rot_crankthrow_c1_stock.glb public/models/sta_head_c1_stock.glb public/models/val_bridge_stock.glb public/models/val_pushrod_stock.glb public/models/val_rocker_stock.glb public/models/val_valve_exhaust_stock.glb public/models/val_valve_intake_stock.glb public/models/fuel_injector_c1_stock.glb public/models/intake_cover_lly.glb public/models/variants/turbo_unit_engine_large.glb public/models/variants/intake_tract_engine_highflow.glb public/models/variants/exhaust_system_engine_4inch.glb public/models/variants/intercooler_core_engine_upgraded.glb public/models/variants/rot_piston_c1_lowcomp.glb public/hdri public/legacy assets-src/blender/build_cylinder1.py assets-src/blender/build_variants.py assets-src/blender/build_shell.py assets-src/blender/build_intake_cover.py assets-src/dimensions.json assets-src/variant_dimensions.json assets-src/cover_dimensions.json assets-src/shell_dimensions.json docs/M2-MEASUREMENTS.md docs/M3-MEASUREMENTS.md docs/M4-MEASUREMENTS.md docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M7-MEASUREMENTS.md docs/M8-VARIANTS.md docs/M8-MEASUREMENTS.md docs/M9-SOUND.md docs/M9-MEASUREMENTS.md docs/M10-EXTERIOR.md docs/M10-MEASUREMENTS.md docs/M11-CUTAWAYS.md docs/M11-MEASUREMENTS.md docs/M12-COVER.md docs/M12-MEASUREMENTS.md docs/specs/M0-* … docs/specs/M12-* docs/research/L7-* docs/research/M8-* docs/research/M9-* docs/research/M10-* docs/research/M11-* docs/research/M12-* docs/PLANNING.md docs/ORCHESTRATOR.md` is empty. The five M8 variant GLBs, the M10 shell and the M12 cover are byte-identical.
2. **Fresh-clone gates:** `npm ci`, `npm run typecheck`, `npm test`, `npm run build` pass on Node 24. Exactly the eight test files named in §9 are touched (2 new + 6 edited); no other test file is edited; `package.json`/`package-lock.json` unchanged.
3. **Asset audit:** `public/models/variants/rot_conrod_c1_forged.glb` is ≤ **49,152 B**; root/child names correct; **3** materials; no textures/UVs/images/skins/morphs/animations; indexed `POSITION`+`NORMAL`; **≤ 1,400** tris; bounds/pivot/width/beam flange as §4.2; watertight (0 boundary edges at 1e-5 m) with 10 closed components.
4. **Catalog audit:** exactly **6** entries have a non-null `modelPath`; `rods_forged` is the new one with `explodeVectorMm [0,0,0]`; the other **18** are null; `catalog/stock.json` and `catalog/schema.json` byte-identical; `src/core/interfaces.ts` unchanged; all 24 dispositions match §2.7/§9 test 10.
5. **Budgets:** the `?benchmark=1` matrix (desktop 1440×900 Full, phone 390×844 Phone; stock and worst-case 5-variant; rods off and on; plus rods-on Section X @ 402.5) reports scene triangles **≤ 311,884 / ≤ 308,192** with rods+cover, calls **98/60** stock and **99/62** worst, VRAM **20.75/4.75 MiB**, submitted ≤ **584,804 / 311,436** and ≤ **574,200 / 308,072**, and p95 within +0.30 ms of the M12 detail rows (desktop 16.8 ms, phone 17.0 ms) with 0 dropped frames; the measured rod is ≤ 1,400 triangles, the GLB ≤ 48 KiB, the section cap total ≤ 16,000, and the derived cap guard is **319,128 / 320,000 phone (872 triangles)**. Any breach is a stop-and-report.
6. **Visual proof:** RF-21/RF-22 exist at the pinned poses and every checklist item in §8.1 passes; the rod variant is visibly heavier than stock; the RF-22 cut face is solid/hatched and continuous.
7. **Invariance (manual visual gate):** with `rods_stock`, live re-captures of RF-1…RF-20 are compared visually in the 3D viewport region against the committed PNGs (subtitle masked) by the reviewer, with the comparison and any difference recorded in `docs/M13-MEASUREMENTS.md`; the 3D content must be visually unchanged, and any visible difference is a stop-and-report. With `rods_forged`, no existing frame is re-baselined.
8. **Interaction checks:** `rods_forged` selects/deselects through the existing Build dropdown; `rods_forged + pistons_lowcomp + turbo_large` renders both internal variants; Section X @ 402.5 with rods selected shows a capped rod section; X-Ray/exterior-off shows the variant; the 23 labels are unchanged; the M12 cover toggle and RF-18…RF-20 are unchanged; the five M8 variants still render.
9. **Docs:** `docs/M13-INTERNAL-VARIANTS.md` and `docs/M13-MEASUREMENTS.md` are complete per §11/§12.7/§12.8; `docs/REFERENCE_FRAMES.md` includes RF-21/RF-22 and the checklist; `docs/ASSET_CONTRACT.md`, `assets-src/PROVENANCE.md`, `docs/PLAN.md`, `docs/DECISIONS.md` and `docs/OPEN_ITEMS.md` match §12 exactly; prior docs are byte-identical.
10. **Outside review (D-021)** recorded for the milestone-exit PR; **Owner Decision OD-1** recorded in the PR/spec.

---

## 14. Frozen and changed files

**Frozen — no changes:**

- `src/core/**` (including `interfaces.ts`, D-010), `src/perf/**`, `src/config/**`, `src/audio/**`, `src/assets/**`.
- `catalog/stock.json`, `catalog/schema.json`, `src/catalog/index.ts`.
- `src/main.ts`; `src/renderer/exteriorLoader.ts`, `layout.ts`, `partLoader.ts`, `variantLoader.ts`, `viewLayout.ts`, `sectionCaps.ts`, `intakeCover.ts`.
- `public/Duramax_LLY_2005_66L_V8.glb`; the ten stock internal part GLBs; the five `public/models/variants/*.glb`; `public/models/intake_cover_lly.glb`; `public/hdri/**`; `public/legacy/**`.
- `assets-src/blender/build_cylinder1.py`, `build_variants.py`, `build_shell.py`, `build_intake_cover.py`; `assets-src/dimensions.json`, `variant_dimensions.json`, `cover_dimensions.json`, `shell_dimensions.json`; all existing `assets-src` reference files.
- `package.json`, `package-lock.json`, `.github/**`, `vite.config.ts`, `tsconfig.json`.
- `docs/M2-MEASUREMENTS.md` … `docs/M12-MEASUREMENTS.md`, `docs/M5-MODEL.md`, `docs/M6-PARTS.md`, `docs/M7-DATA.md`, `docs/M8-VARIANTS.md`, `docs/M9-SOUND.md`, `docs/M10-EXTERIOR.md`, `docs/M11-CUTAWAYS.md`, `docs/M12-COVER.md`; `docs/specs/M0-*`…`docs/specs/M12-*`, `docs/research/L7-*`, `M8-*`, `M9-*`, `M10-*`, `M11-*`, `M12-*`, `docs/PLANNING.md`, `docs/ORCHESTRATOR.md`. (`docs/REFERENCE_FRAMES.md` and `docs/ASSET_CONTRACT.md` are changed deliverables, not frozen.)

**Changed / new (expected):**

- `catalog/modified.json` — only `rods_forged.modelPath`.
- `src/renderer/internalVariants.ts` *(new)* — constants, the 24-entry disposition register, OD-1, pure helpers.
- `src/renderer/engineScene.ts` — internal-part preload/swap, rod batch, dynamic cap source, stats, dispose.
- `src/renderer/partVariants.ts` — `VISUAL_VARIANT_SLOTS` + `VARIANT_TRIANGLE_CAPS`.
- `src/renderer/index.ts` — export the new module's public names.
- `src/renderer/rodVariant.test.ts` *(new)* — tests 1, 2, 5–7, 11–12.
- `src/renderer/internalVariants.test.ts` *(new)* — test 10 (and the pure part of test 5).
- `src/catalog/modified.test.ts` — add `rods_forged` to the expected visual map (test 3).
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

Every number below was produced before this spec was finalised, from the committed GLBs, the shipped code, and the named publications. The planning artifacts are not committed by the build; the arithmetic and measurements are re-runnable from the values quoted here.

### 15.1 Measurement environment

- Host: Linux x86_64 container, Node `v24.22.3`, Three.js `0.187.0`, Vite `7.3.8`, Blender **4.0.2** (the repo's asset scripts target 5.2.3 LTS; 5.2.3 is not installed here).
- Existing suite: **104 tests / 21 files passed**; `npm run typecheck` passed (this session). No new dependency was installed for the repo; the Blender prototype used a temporary `numpy` on `PYTHONPATH` only for the glTF exporter.
- **No WebGL / headless browser** in this VM: runtime draw calls, submitted triangles, VRAM, p95 and reference-frame captures were **not** re-measured. The M12 measured values are quoted only as a cross-check; the build re-measures them on the reference GPU.
- The rod prototype was built with Blender 4.0.2 because the repo target (5.2.3) is unavailable here. A stock conrod rebuilt with the same 4.0.2 script reproduced the committed **1,180 triangles** exactly (though its vertex dedup/file bytes differ), which validates the triangle-count comparison; the build must re-run the actual script in 5.2.3 and record the final count.

### 15.2 Current shipped scene — triangles re-derived, runtime figures from M12

The triangle rows below were re-derived this session from the committed GLBs and the renderer's instance counts. The `calls` / `submitted` / `VRAM` figures are the **M12 measured record**, quoted as a cross-check only; they were not re-measured here (no WebGL) and the build must re-measure them.

```
desktop full, exterior on, stock        : 96 calls / 579,484 submitted tris / 308,324 scene tris / 20.75 MiB
desktop full, exterior on, 5 variants   : 97 calls / 568,880 submitted tris / 304,632 scene tris / 20.75 MiB
phone, exterior on, stock               : 58 calls / 307,876 submitted tris / 308,324 scene tris / 4.75 MiB
phone, exterior on, 5 variants          : 60 calls / 304,512 submitted tris / 304,632 scene tris / 4.75 MiB
```

Code arithmetic re-derived this session: `4,832×8 + 1,180×8 + 1,352×4 + 3,532×8 + 924×8 + 1,040×16 + 3,464×16 + 1,040×16 + 3,464×16 + 408×16 + 620×4×4 + 840×16 + 432×16 = 270,080` internal; `+1,080` main shaft `+64` ground `+37,100` shell = **308,324**. Worst: `308,324 − 6,912` (piston swap) `− 6,500` (hidden shell subtrees) `+ 9,720` (external variants) = **304,632**.

### 15.3 Rod prototype — measured

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

The stock conrod rebuilt by the same script measured 1,180 tris / identical bounds, so the variant's **+192 tris/instance** is the fastener-profile change; the full-engine delta is `+1,536` at the prototype, `+1,760` at the cap.

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

Among the measured states, the **phone stock + rods + cover** is the tightest measured: **8,116 triangles (2.54 %) headroom**. The **derived cap guard** is tighter at **872 triangles (0.2725 %)** and remains a PASS. The rod cap is a cap, not a measured asset; the build records the actual (prototype 1,372, expected below 1,400).

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

1. **D-038's rods reason is partially overturned.** "Material-only change" is not supported by the published Callies description of a thicker-flanged H-beam with ARP L19 fasteners. The stock rod **is** an H-beam (confirmed from the GLB), so the variant is an illustrative **heavier H-beam**, not a different beam type. The magnitudes are labeled placeholders.
2. **D-038's CP3 reason is partially stale.** The M8 "no swappable pivot-placed model" is cured by M10's `cp3Fuel/ext_cp3`; a child split is technically possible. The conclusion (no honest visual) stands because the external housing is identical and the stroke is internal.
3. **`docs/M7-DATA.md` §3 says "rod I-beam" while `assets-src/PROVENANCE.md` and the build code say H-beam.** The GLB geometry is an H-beam; the M7 row is stale wording. The M13 docs record the correction without editing the frozen M7 doc.
4. **The published stock-matching aftermarket big-end width is 28.4 mm, but the stock model is 27.676 mm.** Adopting 28.4 mm would close the 0.724 mm inter-rod gap to 0.0 mm on the shared pin. Recorded, not adopted; the variant keeps 27.676 mm.
5. **D-044 publishes cam lobe lift but not duration/timing.** The M8 reason "lift profile unpublished" is now partially stale (lift is published; duration/timing are not). A cam visual still implies a kinematics decision, so OD-1 defers it.
6. **An aftermarket 0.450 in cam is not a drop-in.** It would make the stock piston-to-valve clearance negative by 3.84 mm intake / 6.34 mm exhaust. Recorded, not adopted; the catalog's `veFactor 1.04` is not a lobe profile.
7. **M12's proof-frame lesson.** No WebGL here, and copied poses failed at M12 build time. M13 uses the **committed internal RF-10/RF-6 poses** whose images already show the rods, and adds the **G-FRAME-M13** build gate instead of inventing a new close-up.
8. **The phone headroom is genuinely tight.** The derived cap guard is 319,128 / 320,000 (872 triangles, 0.2725 %). The spec does not hide this: it is the decisive budget number, and a rod asset above 1,400 tris is a stop-and-report.

### 15.8 Number provenance

| Number | Value | Derivation / source |
| --- | ---: | --- |
| Rod triangles | 1,372 prototype; cap 1,400 | Blender 4.0.2 prototype (1,084 + 288); stock 1,180 reproduced exactly |
| Rod scene delta | +1,536 prototype; +1,760 cap | `(1,372−1,180)×8`; `(1,400−1,180)×8` |
| Rod file bytes | 28,008 prototype; cap 49,152 | measured prototype; design cap |
| Rod bounds | X ±13.838, Y ±48.725, Z −42.143…186.805 | measured prototype; identical to stock |
| Big-end axial width | 27.676 mm | stock model `0.44 × 62.9`; M7 register |
| Beam flange Y | 30.343 / 18.568 mm | prototype; stock 26.129 / 16.187 |
| Flange thickness | 8.177 mm | prototype; stock 6.288 |
| Web half-width | 5.258 mm | prototype; stock 4.428 |
| Inter-rod gap | 0.724 mm | `2×14.2 − 27.676` |
| Bore clearance (outer / beam) | 2.775 / 21.157 mm | `51.5 − 48.725`; `51.5 − 30.343` |
| Piston clearance (beam) | 21.082 mm | `51.425 − 30.343` |
| Stock scene | 308,324 | measured GLB arithmetic; §15.2 |
| Worst scene | 304,632 | M8 arithmetic; re-derived |
| Stock + rods + cover | 311,884 cap / 311,660 proto | §15.4 |
| Worst + rods + cover | 308,192 cap / 307,968 proto | §15.4 |
| Derived cap guard | 319,128 / 320,000 phone | §15.4 |
| Phone headroom (guard) | 872 (0.2725 %) | `320,000 − 319,128` |
| Desktop headroom (guard) | 40,872 (11.35 %) | `360,000 − 319,128` |
| Submitted rows | 584,804 / 311,436 stock; 574,200 / 308,072 worst | §15.4 |
| Draw calls | 98/60 stock; 99/62 worst | M12 96/58, 97/60 + cover +2; rods 0 |
| VRAM | 20.75 / 4.75 MiB | M12 measured; no rod textures |
| Variant caps | 17,400 total | 10,800 external + 5,200 piston + 1,400 rod |
| Catalog closure | 6 / 18 of 24 | §15.6 |
| Page-weight delta | +0.279 % prototype; +0.489 % cap | vs M9 baseline 10,050,510 B |

---

## 16. Handoff

Work on branch `m13-internal-variants` in the local clone, created from `main` at `8394f1f`. Implement in this order:

1. **`src/renderer/internalVariants.ts`** — constants, the 24-entry disposition register, OD-1, pure helpers. Keep the rod constants and the rod model path in this one module so the asset test and the renderer cannot drift.
2. **`assets-src/rod_variant_dimensions.json` + `assets-src/blender/build_rod_variant.py`** — build the stock-interface H-beam with wider/thicker flanges, thicker web and stepped 12-point fasteners; export Y-up; assert the triangle cap (1,400), bounds, pivot, big-end width (27.676), beam flange Y (30.343), watertightness (0 boundary edges, 10 components) and material count in the build log. Produce `public/models/variants/rot_conrod_c1_forged.glb`.
3. **`catalog/modified.json`** — only `rods_forged.modelPath`; run the catalog/schema tests.
4. **`src/renderer/partVariants.ts`** — add `'rods'` to `VISUAL_VARIANT_SLOTS` and `rods_forged: 1400` to `VARIANT_TRIANGLE_CAPS`; leave the shell replacement map unchanged.
5. **`engineScene.ts` seams** — internal-part preload branch, rod batch, stock/variant swap, dynamic `conrod_variant` cap source, stats (`rodVariantActive`, `rodVariantTriangles`, `rodSceneTriangles`), dispose, failure fallback. Keep **one** `renderer.render` call and no new WebGL resources beyond the rod meshes.
6. **UI and frames** — subtitle, build note, RF-21/RF-22 (the exact RF-10/RF-6 poses), no new control.
7. **Tests** — `rodVariant.test.ts` (1, 2, 5–7, 11–12), `internalVariants.test.ts` (10 and the pure part of 5), the budget/frames/text edits (3, 4, 8, 9). Run `npm run typecheck && npm test && npm run build`.
8. **Measure and optimise** — build the asset; record actual triangles (cap 1,400), bytes (cap 48 KiB), bounds, pivot, watertightness/components; run the `?benchmark=1` matrix (stock/worst × desktop/phone × rods off/on, plus rods-on Section X @ 402.5); record p95/headroom, the rod section-cap triangles (≤ 16,000 total), the derived cap guard **319,128 / 872** and the page-weight delta. Hit the §7 targets or stop and report.
9. **Frames** — add RF-21/RF-22 to `src/ui/referenceFrames.ts`; capture at 1440×900 → 1024×640; verify the §8.1 checklist; re-capture RF-1…RF-20 with `rods_stock` and compare them visually (manual gate), recording the notes. If RF-21/RF-22 fail, stop and report with a proposed pose (G-FRAME-M13).
10. **Docs** — `docs/M13-INTERNAL-VARIANTS.md`, `docs/M13-MEASUREMENTS.md`, then the §11/§12 paperwork, `docs/REFERENCE_FRAMES.md`, `docs/ASSET_CONTRACT.md`, `assets-src/PROVENANCE.md`, and the two images.

No new npm dependencies; no catalog slot/interface/perf/core/shell/cover/existing-asset changes. When done, push the branch and send a closing summary covering: files changed; test/typecheck/build results; the rod asset audit (triangles, bytes, bounds, pivot, watertightness, materials); the catalog closure table; the `?benchmark=1` stock/worst × desktop/phone × rods-off/on rows with headroom and the derived guard 319,128 / 872; the rod-on Section X @ 402.5 cap count; the RF-21/RF-22 captures with SHA-256 and checklist results; the RF-1…RF-20 manual invariance notes; the OD-1 decision as recorded; and anything that deviated from this spec. Buckley verifies from a fresh clone, opens the PR, and merges.
