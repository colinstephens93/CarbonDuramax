# M8 Part Variants — Independent QA Report

**QA status: COMPLETE — passes 1–3 plus final dispositions (§8). Package ready for Buckley's audit.** Independent QA against `docs/specs/M8-part-variants.md`, reviewer a separate context from the drafting agent. Pass 1 (HEAD `2787f92`) raised 4 blockers / 13 should-fix / 9 nits, all dispositioned in §3; the spec was revised at `5176a05` and pass 2 (§6) re-checked it, raising 5 should-fix / 8 nits. Those were fixed at HEAD `2ff8ce2`; pass 3 (§7) verified the fixes and the cross-revision regression scan, raising 2 should-fix (Q1/Q2) with no blockers; Q1/Q2 were then fixed in the spec and their dispositions recorded in §8. The pass-1 §4 appendix is historical (pre-rebake V5 figures), superseded by §6's rev-3 artifacts; §7 is the pass-3 state and §8 the final state of the package.

- Date: 2026-11-14. Reviewer: independent QA agent (D-030/D-037 pre-review step 4).
- Inputs: spec §1–§12, `docs/PLANNING.md`, `docs/research/M8-variant-references.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`, M6/M7 specs, M2/M3/M7 measurements, `docs/ASSET_CONTRACT.md`, `docs/THREE_API_NOTES.md`, `docs/REFERENCE_FRAMES.md`, and the shipped tree (`src/**`, `catalog/**`, `public/**`, `assets-src/**`).
- External artifacts (read-only): `C:\Users\colin\Documents\DeepSeek\m8-prototype\` — `PROTOTYPE-REPORT.md`, `out/results.json`, `out/extra_checks.json`, `out/blender_verify.json`, `glb\*.glb`, `scripts\*.py`.
- Scratch QA code (outside the repo): `C:\Users\colin\Documents\DeepSeek\m8-QA-scratch\` (GLB parser, shell/datum/merge/budget scripts, prototype GLB reader).
- No spec or repo file was modified except this report. No commit/branch/checkout performed.

## 1. Scope and method

**Commands run and their output**

1. `git status --short` (clean), `git log --oneline -5`, `git branch --show-current` → `plan/m8-part-variants`, HEAD `2787f92` (spec + research only on top of M7 `672ec3a`).
2. `npm ci` → 65 packages installed; `npm test` → **58 tests / 10 files pass** (baseline inventory; matches M0–M7 tree); `npm run typecheck` → exit 0. Tests were run before any new test existed, confirming the "existing suite" baseline is green and M7 main is the shipped code.
3. Independent dependency-free GLB parser (`m8-QA-scratch/glb.js`); parsed `public/Duramax_LLY_2005_66L_V8.glb` (`shell_dump.js`, `merge2.js`, `datums.js`, `stock_gaps.js`) and the five prototype GLBs (`proto_dump.js`, `proto_interface.js`).
4. `grep` over the shipped tree for `modelPath`/`explodeVectorMm` (perf/renderer reads), `createEngineScene`, `EngineRenderStats`, `REFERENCE_FRAME_DEFS`, `setBuildSelection`, `evaluateAndPushModifiedBuild`, `banner`, `benchmark`, and `src/core/architecture.test.ts`.
5. Python 3 (`numpy` 2.4.6) run of the prototype's own kept scripts to reproduce the intake centreline length (`mesh_lib.catmull_rom`/`polyline_arclength`), the briefed-route interference counts (`check_intake_interference.py`), and the stock piston bowl volume from the frozen `build_cylinder1.py` crown profile.
6. Recomputation of every §6/§12 budget sum, the draw-call arithmetic, the CR/clearance arithmetic, and prototype-vs-final artifact diffs (appendix §4).

**Limitations.** No WebGL render and no Blender authoring run were possible/needed for QA: headless visibility claims are judged from code + reference-frame/acceptance design, and GLB facts are re-derived from the binary files themselves. The prototype folder is outside the repo and is evidence only, not a build deliverable.

## 2. Findings

### Blockers (4)

**F1 — blocker — §12.2 V5 row and “No valve reliefs” claims contradict the prototype it reports (§3.2 V5 line 132, §3.6 line 212, §12.2 lines 477–481, §12.5 item 3 line 499).**
Evidence: the prototype piston *does* model 4 valve-relief pockets, 1.9 mm deep, r 13 mm at (±22, ±23) mm — `m8-prototype/scripts/models.py` lines 525–542 (`crown_z` subtracts the pockets; `valve_relief_extra_volume(...)` estimate **0.912 cm³**); `out/results.json` piston `meta.valve_relief_extra_volume_cc = 0.912447955`; `PROTOTYPE-REPORT.md` §3 and risk #8 (“the spec must state whether relief volume is included… if included CR ≈16.24”). The spec §12.2 says “No valve reliefs (decision §3.6)” and quotes the 4,224-triangle / 2,214-vertex prototype row as prototype-confirmed while §3.2/§3.6 forbid reliefs in the shipped model. Consequence: the measured V5 row, the 13,422 total, and the measured worst case 298,598 in §12.4 describe a piston the spec does not ship; the prototype’s actual crown is not the CR-16.5 model (relief volume makes it ≈16.24).
Fix: state plainly that the prototype included reliefs; remove them from the design/asset contract; re-derive the V5 triangle/vertex numbers for the shipped no-relief crown (cap 5,200 gives room) and label the §12 total/measured worst case as superseded pending build measurement, or re-measure before quoting.

**F2 — blocker — §3.2 V5 CR arithmetic is wrong and the crown profile is not reproducible from the spec (§3.2 V5 line 134, §3.3 line 142, §9.5, §12.2 line 481).**
Evidence: `Vd = (π/4)·103²·99 = 824,896.6 mm³`, not the spec’s **824,868 mm³**; `ΔVc = Vd/15.5 − Vd/16.5 = 3,225.4 mm³ = 3.2254 cm³`, not “3.230 cm³ exactly”. The prototype target is `stock_vol + 3.23` (`models.py` line 470) and its measured Δ is exactly 3.230 cm³ (`results.json`), i.e. **+0.0046 cm³ (+0.14 %) above the CR-implied 3.2254**; that gives CR 16.4987, not 16.5. Separately, the prototype's exact crown profile is not recoverable from §3.2: the pinned depth 16.30/lip 28.80 plus the ±0.30 cm³ assertion can only be met by the prototype's extra profile control points — the flat-floor radius `0.32·r_out` and the shoulder point `(0.45·r_out, comp − 0.82·depth)` (`models.py` lines 476–483) — which appear nowhere in the spec or the `variant_dimensions.json` pin list. A builder must invent the missing control points (and tune them to the volume), so “prototype-confirmed” cannot be audited and a different “open flat-floor” shape at the pinned depth/lip will not hit the assertion without tuning.
Fix: correct Vd to 824,896.6 mm³ and ΔVc to 3,225.4 mm³ (3.2254 cm³); replace “exactly the CR-implied” with the measured 3.230 cm³ vs CR-implied 3.2254 (+0.14 %, CR 16.4987) or tighten the design; pin the crown profile control points in §3.2/§3.3 and `variant_dimensions.json` so the builder can hit the ±0.30 assertion at the pinned depth/lip.

**F3 — blocker — §12.4 draw-call headroom arithmetic is wrong (§12.4 line 493; §6.3 line 375).**
Evidence: “draw-call headroom is 51 desktop / 51 phone”. Desktop worst-case calls = 36 shadow + 69 main = **105**; desktop budget 250 → headroom **145**, not 51. Phone headroom is 120 − 69 = 51 (correct). Also the same paragraph’s “+10 net over the M7 stock state (main pass)” gives **65** phone calls from M7’s 55, not 69; 69 assumes the 59 max-unculled baseline. §6.3’s table itself is arithmetically correct (69 main, 105 incl. shadow).
Fix: “draw-call headroom is 145 desktop / 51 phone”; state the phone worst case as the conservative 69 (59 max-unculled + 10 net) rather than deriving it from 55.

**F4 — blocker — §12.1 claims all seven interface datums were re-found at 0.03–0.05 mm; only five are stock contact vertices (§12.1 line 464, §3.2 lines 81/96/111/127, §7.1 line 389).**
Evidence (independent scan of the frozen shell, mm): the five turbo datums are 0.0378 / 0.0517 / 0.0513 / 0.0284 / 0.0372 from nearest shell vertices (0.028–0.052 mm, consistent). But `if_airbox_mount` (587.4, −510.5, 371.9) is **17.828 mm** from the nearest shell vertex (stock intake end, per `results.json` `shell_nearest_vertex_mm = 17.828098921969357` and the prototype report), and `if_hot_side_inlet` (374.6, 474.8, 146.6) is **31.394 mm** from the nearest `boostPipe` vertex (`results.json` = 31.394476824680616; prototype report calls it “centroid vs. vertex: expected”). The spec gives no derivation for these two datums anywhere; §7.1’s required “measured source and shell feature” register would have to invent one.
Fix: correct §12.1 to “the five turbo contact datums are exact stock vertices at 0.03–0.05 mm; the airbox and intercooler-flange datums are documented free service points (17.83 mm / 31.39 mm from the nearest shell vertex, derived from the stock intake-end centroid and the charge-pipe end respectively)”, and add that derivation to §3.2/§7.1.

### Should-fix (13)

**S1 — should-fix — §6.3/§10.5 budget and re-measurement record is internally inconsistent (§6.3 line 377–379, §10.5 line 439).** Two errors: (a) the frame-time row says the worst case adds “+≤11k main-pass tris, **0 shadow tris**”, but the piston swap is internal and `castShadow = true` (`engineScene.ts:215`), so the shadow pass gains 8 × (5,200 − 4,832) = **+2,944** triangles — the same table’s submitted row already doubles the piston Δ for the shadow pass; (b) “the default state must re-measure at **M7’s numbers** … (`scene 302,620 / calls 106 desktop ext-on / 66 phone ext-on`)” — M7 measured 95/55 calls; 106/66 are the expected *post-split* numbers. Also two stats necessarily change at stock and are not recorded: `memory.geometries` 56 → **67** (34 + 33 exterior geometries) and `exteriorMergedMeshes` 22 → **33**, so “reproduces the M7 numbers” is not testable as written.
Fix: say “+≤11k main-pass tris and +2,944 shadow-pass tris”; label 106/66 as the expected post-split stock state; add the expected `memory.geometries` 67 / `exteriorMergedMeshes` 33 to §6.3/§10.5.

**S2 — should-fix — Piston asset test tolerances are too loose and contradict the design (§3.2 V5 line 132, §9.5 line 422).** §9.5 pins “outer diameter 102.85 ±1.0 mm”, which admits 103.85 mm — larger than the 103 mm bore — so it cannot catch the regression it names (“geometrically incompatible with the bore”); §3.2 allows “≤ 102.85 + 0.5 mm”, also above the 103 − 0.15 mm stock envelope. Crown tolerance is +0.1 in §3.2 but −0.1/+0.2 in §9.5, and “pivot node” is unspecified (root translation 0 does not catch an X/Z offset of the baked geometry). The test also checks extents, which a pure translation does not change.
Fix: pin OD exactly to 102.85 (−0.00/+0.10, i.e. never above stock), crown 49.80 (−0.10/+0.10), assert symmetric glTF X/Z bounds (±51.425 ±0.25) and the contract-root translation; align §3.2 and §9.5.

**S3 — should-fix — Three new tests cannot catch their claimed regressions (§9.6 line 423, §9.9 line 426, §9.12 line 429).** (a) §9.12 tests `slotForVariantId` against literal ids in the test; it never reads `REFERENCE_FRAME_DEFS` in `src/main.ts`, so a mistyped id in a frame is not caught. (b) §9.6 says the JSON test catches “the Blender script drifting from the spec’s dimension table”, but the expected literal object is authored by the same builder; no test compares shipped GLB geometry to the JSON, and §9.4 only checks envelopes/markers. (c) §9.9 is a literal arithmetic assertion (`302_620 − 8_356 + 10_800 + 2_944 ≤ …`); a changed §6.1 cap or preserved subtree does not fail it unless someone hand-edits the literals.
Fix: export `REFERENCE_FRAME_DEFS` from a pure module and test the real frame entries; enumerate the `variant_dimensions.json` key set/values in the spec (or a committed fixture) and add script-level assertions that GLB features equal the JSON (bowl depth/lip, tube OD, marker positions, overall bounds); derive the budget-guard terms from shared cap constants and the shell parse (or recompute them in the test).

**S4 — should-fix — §4.1 says “exactly one public function” but the code block exports two functions plus a type (line 222 vs 232–241).** `visualVariantsForBuild` and `slotForVariantId` are both new public functions (and `VisualVariantSelection` a new type); §4.4/§9 rely on both.
Fix: “gains two public functions and one type”.

**S5 — should-fix — The `docs/REFERENCE_FRAMES.md` edit list is incomplete and its format is under-specified (§7.3 line 391).** The document’s intro says “These seven fixed reference frames … (?rf=RF-1 through RF-7)” and its common capture convention/summary table has no `variants` state; §7.3 only says “add RF-8…RF-10 to the summary table and the per-frame sections in the existing format”. A build following §7 literally leaves stale “seven/RF-1…RF-7” text and no place to record each frame’s build selection.
Fix: explicitly require the intro/convention text to become ten frames and `?rf=RF-1` through `RF-10`, and add a `Variants` (build selection) column or per-frame “Build selection” line to the summary table/format.

**S6 — should-fix — `docs/ASSET_CONTRACT.md` update is inconsistent with the class it adds, and D-038 does not record the contract change (§7.11 line 405, §7.5 line 399).** The contract currently requires “meshopt or Draco for geometry, KTX2 for textures” and names contract nodes `<system>_<part>_<instance>_<variant>`; the new scene-placed class is uncompressed and its root objects (`turbo_unit_engine_large`, etc.) do not carry an `<instance>` segment. §7.11 says “No other contract rule changes”, so the edited contract would contradict its own new class. D-038 records the catalog/renderer change but not the asset-contract extension (project-frame authoring, marker convention, no textures, root naming), which the anti-drift rule (D-011) expects in the same PR.
Fix: in the `ASSET_CONTRACT.md` edit, record the uncompressed/no-texture class (and that meshopt/KTX2 remains deferred as at M2–M7) and the scene-placed root-object naming exception; add one sentence to D-038 recording the contract extension.

**S7 — should-fix — §8’s frozen list omits `docs/M7-MEASUREMENTS.md` (line 410).** The “prior milestone docs (`docs/M2-MEASUREMENTS.md` … `docs/M7-DATA.md`)” range stops at M7-DATA; `docs/M7-MEASUREMENTS.md` is a prior milestone doc that must not be edited by the M8 build. (Also consider naming `docs/research/**`; `docs/README.md` is stale-plan text but out of scope.)
Fix: add `docs/M7-MEASUREMENTS.md` to the frozen list (and optionally the research files).

**S8 — should-fix — Piston-batch swap semantics are under-specified (§4.3 lines 298, 313).** The spec says “the pre-built low-compression piston batch set is attached and the stock set detached”, but a piston set in the shipped code is two batches over 3 primitives each (7-instance `pistonStandard` + 1-instance `pistonFiring`, including cloned firing materials — `engineScene.ts:985–1002`). It does not say whether the swap replaces `DetailedV8Batches.pistonStandard/pistonFiring` references so `applyV8KinematicState` routes instances correctly, whether the firing-material clones of both sets are tracked/disposed, or whether the inactive set is removed from the root or only `visible = false` (the latter would leave the firing/standard highlight stale).
Fix: define a `PistonBatchSet { standard, firing, firingMaterials[] }`, the exact swap (mutate the two `DetailedV8Batches` references, add/remove from the root or set visibility, one immediate `applyV8KinematicState`), and disposal of both sets’ clone materials.

**S9 — should-fix — Failed-variant-load semantics are undefined and can hang the benchmark or hide stock parts (§4.3 lines 281, 297; §5.2 line 339).** “`variantsLoaded` becomes true only when every descriptor has loaded successfully” + benchmark waits on `variantsLoaded` means one failed variant GLB makes `?benchmark=1` wait forever, contradicting “the stock scene … must still work”. Likewise the shell-hiding rule says `visible = !someActiveExternalVariantWhoseSlotReplaces(it)`; if “active” means selected (even when the replacement failed to load), the stock shell part is hidden with nothing shown.
Fix: define `variantsLoaded = all variant loads settled (success or failure)`, define “active” as selected **and** loaded for both attachment and shell hiding, and record failed variants in a new/reused stat so the benchmark and acceptance can see them.

**S10 — should-fix — “Physical non-interference” overstates a vertex-based check, and the V3/V4 envelopes / exceptions are undefined (§3.3 line 146, §10.3 line 437).** The build assertion is “shell **vertices** inside the model’s **solid envelopes**” plus vertex-to-vertex ≥ 2.0 mm, yet the spec labels it “physical non-interference” and the acceptance says it must pass. The prototype report itself (risk #2) says the acceptance “use[s] the shell's vertices; between sparse vertices a real surface could still be closer” and that “A triangle-level clearance check is recommended before sign-off (not done here)”. No analytic “solid envelope” is defined for V3/V4 (only V1 housings and V2 tube), and “the shared connection zones excepted” is undefined.
Fix: call the check “vertex-level non-penetration against analytic envelopes”, record the residual vertex-sparsity risk in §12/`docs/M8-VARIANTS.md` (or add a triangle-level check to the build script), and define each model’s envelope primitive and the excepted connection zones.

**S11 — should-fix — §3.6 V5 conflates two Mahle part numbers (§3.6 line 206, recorded-not-adopted line 210; survey §5).** The survey’s 16.5:1 part 930029875 is a **4.075 in overbore** listing with crown −41.8 cc and pin 1.358 in, but **no published CH**; the CH 1.951 in value belongs to 930036055 (16.6/16.7, stock 4.055 in bore). The spec presents “Mahle 930029875 crown −41.8 cc, CH 1.951 in and pin 1.358 in” as one 16.5-class data set and the not-adopted CH item as “16.5/16.6-class”.
Fix: attribute each value to its part number: 16.5 (930029875): −41.8 cc, pin 1.358 in, CH not published; 16.6/16.7 (930036055): CH 1.951 in; and don’t claim the 16.5-class publishes CH.

**S12 — should-fix — Asset-test contract is under-specified: root object names and exact marker sets are not enumerated (§3.3 line 149, §9.4 line 421, §3.2).** §9.4 requires each external GLB to “contain its contract root object name” and “exactly the expected `if_*` marker set”, but the spec only names the V5 root (`rot_piston_c1_lowcomp`, line 136); V1–V4 root names must be inferred from filenames, and the per-file marker sets exist only implicitly in §3.2 prose (9 marker instances / 7 unique names).
Fix: add a small table: file → contract root object name → expected marker list (V1 five, V2 two, V3 one, V4 one, V5 none), and state the test compares node names against that table.

**S13 — should-fix — Initial visual state vs `?rf`/benchmark ordering is unspecified (§5.2 lines 334, 335, 339).** `main.ts` currently applies `?rf` after mount (line 196) and the benchmark block after that; §5.2 says the initial all-stock visual state is “applied once after mount”. If the builder applies that initial state after the RF/benchmark wiring, it will overwrite RF-8…RF-10 / `variants=…` selections with stock before the first frame.
Fix: pin the order — descriptors passed to `createEngineScene`, initial `setVisualVariantSelections([])` immediately after mount and **before** the `?rf` and `?benchmark` blocks, so RF/benchmark selections are last-writer-wins.

### Nits (9)

**N1 — nit — §12.2 says “Prototype GLBs: 261,296 bytes total” (line 480); sum of `results.json` `glb_checks[].bytes` = 62,120 + 46,888 + 43,652 + 28,092 + 80,548 = 261,300.** Report also says 261,300. Fix the digit.

**N2 — nit — §3.2 V1 “outer radius 131 mm (stock ≈125)” (line 73).** The cited surveys contain no stock cover radius; I measure the shell’s stock turbo unit as ≈125.7 mm half-span about its own bbox centre but 132.1 mm maximum radial about the variant’s rotor axis (Y = 5, Z = 394) — the variant’s 131 mm cover is not cleanly “larger” by this measure. Cite the measurement or drop the parenthetical.

**N3 — nit — Mating-axis rounding (§3.2 lines 74/82, line 93).** The stated compressor-inlet normal (0.737, −0.671, −0.057) is not the actual first Catmull-Rom tangent of the pinned V2 path (0.7382, −0.6722, −0.0571), and the filter axis (0.88, −0.44, −0.16) normalizes to (0.8828, −0.4414, −0.1605). State these as ≈ or pin the unit vectors exactly.

**N4 — nit — “hash-pinned” shell (§3.4 line 162).** No shell SHA-256 is recorded in M3/M7 measurements (bytes + `git diff empty` only); call it “byte-identical/frozen”, not hash-pinned, or record the hash in `docs/M8-MEASUREMENTS.md`.

**N5 — nit — “Authored exactly like the stock piston … the difference is the crown, and only the crown” (§3.2 V5 line 132) vs “48 circumferential segments (the stock uses 56)” (line 132).** The body/ring tessellation differs from stock too. Reword “same construction and dimensions; crown shape and tessellation differ”.

**N6 — nit — §1 “the only internal catalog parameter — compression ratio — whose change is geometrically visible” (line 11)** is overstated as a general statement (injector nozzle area, cam lobe profile and port shape are inherently geometric; they are only unmodeled). Reword “the only internal parameter whose change is visible in the shipped scene’s modeled geometry”.

**N7 — nit — §12.3’s “The same route at the original 90 mm OD already had 105 vertices inside” (line 485)** is not in `PROTOTYPE-REPORT.md`/`results.json` (the named measurement record); I reproduced it from the kept `scripts/check_intake_interference.py` (21 + 39 + 45 = 105). Name that script as the record.

**N8 — nit — §9 preamble “New tests (≈12, three new files)” (line 416) is loose.** Items 1–9 + 12 are 10 new tests; item 10 is a changed existing test; item 11 an existing re-run; item 12’s file is not named (put it in `visualVariants.test.ts` or `partVariants.test.ts`).

**N9 — nit — The M6 non-goal quotation (spec line 9) is a compressed, unmarked quote.** The M6 spec text is “every variant's `modelPath` stays `null`; the renderer is frozen and untouched — selecting a variant changes numbers, not geometry”; the M8 spec quotes it as “every variant's `modelPath` stays `null`; selecting a variant changes numbers, not geometry.” Substance is accurate, but the middle clause is dropped without an ellipsis. Quote verbatim or mark the elision.

## 3. Dispositions

**QA complete** (independent pass, findings verified against code/artifacts). Drafting agent to fill `Disposition` — typically `accepted` / `accepted-with-edit` / `rejected (reason)` — during the revisal; blockers must be closed before owner/Buckley audit.

| ID | Severity | Disposition |
| --- | --- | --- |
| F1 | blocker | **accepted-with-edit** — shipped design is no-relief; prototype V5 rebaked (3,744 tris / 1,926 verts, Δ +3.2300 cm³); spec §3.2 V5/§3.6/§12.2 now state this and the with-relief measurement is explicitly superseded. |
| F2 | blocker | **accepted-with-edit** — `Vd` corrected to 824,896.6 mm³, CR-implied Δ to 3.2254 cm³; assertion is now `|Δ − 3.2254| ≤ 0.05` with the +0.14 %/CR-16.4987 fact stated; the full crown profile (floor/shoulder/lip/mouth/rim with z values) is pinned in §3.2 V5 and in `variant_dimensions.json`. |
| F3 | blocker | **accepted** — §12.4 now says 145 desktop / 51 phone draw-call headroom and states the 69 phone worst case as the 59-max-unculled baseline (65 measured). |
| F4 | blocker | **accepted** — §12.1 now separates the five stock contact vertices (0.028–0.052 mm) from the two documented service points (airbox 17.83 mm, charge-pipe flange 31.39 mm) and gives their centroid derivations; §3.2 V2/V4 record the derivations. |
| S1 | should-fix | **accepted** — §6.3 frame-time row now says +2,944 shadow-pass tris; stock post-split expectations (calls 106/66 vs M7 95/55, `memory.geometries` 67, `exteriorMergedMeshes` 33) added to §6.3/§10.6. |
| S2 | should-fix | **accepted** — §3.2 V5 and §9.5 now pin OD 102.85 (−0.00/+0.10), crown 49.80 ±0.10, symmetric X/Z half-extents 51.425 ±0.25, pivot translation, and the skirt-bottom check. |
| S3 | should-fix | **accepted-with-edit** — `REFERENCE_FRAME_DEFS` moved to a pure `src/ui/referenceFrames.ts` read by the real test; §9.6 now requires spec-literal expected values plus a build-script GLB read-back; §9.9 derives the budget guard from `VARIANT_TRIANGLE_CAPS` / `EXTERIOR_PRESERVED_TRIANGLES`. |
| S4 | should-fix | **accepted** — §4.1 now says two public functions and one exported type. |
| S5 | should-fix | **accepted** — §7.3 expanded: intro becomes ten frames / `?rf=RF-1`…`RF-10`, summary table gains a `Variants` column, per-frame "Build selection" lines. |
| S6 | should-fix | **accepted** — §7.11 and D-038 now record the scene-placed class's uncompressed/no-texture form and root-naming exception; D-038 records the D-011 contract extension. |
| S7 | should-fix | **accepted** — `docs/M7-MEASUREMENTS.md` added to the §8 frozen list; `docs/research/**` noted as not edited by the build. |
| S8 | should-fix | **accepted** — §4.3 defines the `PistonBatchSet { standard, firing, firingMaterials }` and pins the swap (mutate `DetailedV8Batches` references, detach/add meshes, one immediate kinematic apply, dispose both sets' clones once). |
| S9 | should-fix | **accepted** — §4.3 load semantics: `variantsLoaded` = all loads **settled**, `failedVariantIds` stat, "active" = selected **and** loaded for both attachment and shell hiding, so failures cannot hang the benchmark or hide stock parts. |
| S10 | should-fix | **accepted-with-edit** — renamed "vertex-level non-penetration against analytic envelopes"; §3.3 defines each model's envelope primitive and the 30 mm excepted connection zones, and records the vertex-sparsity residual risk (with the V2 ≥17.7 mm surface gap and the triangle-level recommendation). |
| S11 | should-fix | **accepted** — §3.6 attributes −41.8 cc / pin 1.358 in to 930029875 (16.5-class, CH not published) and CH 1.951 in to 930036055 (16.6/16.7-class); the not-adopted CH bullet says the same. |
| S12 | should-fix | **accepted** — new §3.2 "Contract root objects and marker sets" table enumerates file → root object → required marker list (V1 five, V2 two, V3 one, V4 one, V5 none) and §9.4 compares against it. |
| S13 | should-fix | **accepted** — §5.2 pins the order: descriptors → mount → initial all-stock visual state → `?rf` → `?benchmark`, so RF/benchmark selections are last-writer-wins. |
| N1 | nit | **accepted** — prototype total now 251,508 bytes (12,942 tris) after the V5 rebake. |
| N2 | nit | **accepted** — §3.2 V1 no longer claims the cover is "larger"; it states the measured ≈126–132 mm stock envelope and the stock-footprint drop-in form. |
| N3 | nit | **accepted** — mating normals pinned as unit vectors (compressor inlet 0.7382/−0.6722/−0.0571; filter axis 0.8828/−0.4414/−0.1605). |
| N4 | nit | **accepted** — "hash-pinned" replaced with byte-identical/`git diff` empty plus a new M8-MEASUREMENTS SHA-256 record. |
| N5 | nit | **accepted** — V5 wording now says the same stock construction and dimensions with crown shape and tessellation differing. |
| N6 | nit | **accepted** — §1 now says "the only internal catalog parameter whose change is visible in the shipped scene's modeled geometry". |
| N7 | nit | **accepted** — §12.3 names the prototype's `scripts/check_intake_interference.py` (21+39+45=105) as the record. |
| N8 | nit | **accepted** — §9 preamble now says 10 new tests in four new files (referenceFrames test added), plus the one changed existing test and the existing re-runs. |
| N9 | nit | **accepted** — the M6 non-goal is now quoted in full including the elided middle clause. |

## 4. Independent recomputation appendix

**A. Shell GLB (frozen `public/Duramax_LLY_2005_66L_V8.glb`, 1,967,296 bytes).** Parsed GLB header/JSON/BIN accessors and node TRS/matrices; registered with `p_mm = (204.2, 0, 111.8) + 430·R·p_file`, `R:(x,y,z)→(z,x,y)`.
| Quantity | Independent result | Spec | Verdict |
|---|---|---|---|
| Scene triangles / accessor vertices | 31,396 / 33,187 | 31,396 / 33,187 | match |
| Registered bounds (mm) | X [−282.14, 892.75], Y [−573.40, 521.82], Z [−223.60, 583.88] | same | match |
| Top-level node names | 12 groups (blockPan…electronics) + root; all 329 deeper nodes unnamed | “twelve top-level groups only” | match |
| `turbo` direct children tris | 384 (RH up-pipe), 384 (LH up-pipe), 560 (downpipe), 2,056 (turbo unit); 18 mesh nodes in unit | 384/384/560/2,056; 18 | match |
| `intake` group | 5,740 tris, 14 mesh primitives (12 direct children) | 5,740 | match |
| Material-signature merge | 22 buckets before split | 22 | match |
| Split buckets | turbo_unit 2,056 tris/6 buckets; turbo_downpipe 560/1; intake_tract 5,740/5; remaining 250 prims → 21 buckets/23,040 tris; total 33 (+11) | 6/1/5, 21/23,040, 33/+11 | match |

**B. Interface datums (nearest shell vertex, mm).** F1–F4 evidence: (13.2, 22.6, 453.6)→0.0284; (36.5, 56.1, 419.2)→0.0372; (−146.2, −59.2, 373.3)→0.0513; (−137.6, −84.1, 340.6)→0.0378; (−137.6, 46.4, 356.8)→0.0517. Stock turbo unit ↔ RH/LH up-pipes: 2.503/3.172 mm. Stock turbo unit ↔ downpipe: 16.198 mm (so the “stock downpipe connects” gap is stock behaviour). Stock intake ↔ acComp: 1.409 mm (matches `extra_checks.json`). Airbox (587.4, −510.5, 371.9)→17.828 mm (intake); hot side (374.6, 474.8, 146.6)→31.394 mm (boostPipe) — **spec §12.1’s 0.03–0.05 mm claim does not hold for these two** (F4).

**C. Prototype GLBs (parsed independently; all glTF 2.0, images 0, textures 0).**
| File | Tris | Mats | Bounds mm | Spec | Verdict |
|---|---:|---:|---|---|---|
| turbo_unit_engine_large | 3,166 | 3 | X −178.35…47.10, Y −126…136, Z 263…530 | same | match |
| intake_tract_engine_highflow | 2,400 | 3 | X −18.91…782.34, Y −641.77…54.45, Z 289.09…547.82 | same | match |
| exhaust_system_engine_4inch | 2,272 | 2 | X −1,092.64…−113.81, Y −218…2, Z −85…415.96 | same | match |
| intercooler_core_engine_upgraded | 1,360 | 3 | X 90…682, Y 471.88…695, Z −40…320 | same | match |
| rot_piston_c1_lowcomp | 4,224 | 3 | X/Z ±51.42, Y −22.94…49.80 | same | match (but see F1) |
| Total | 13,422 | — | — | 13,422 / 16,000 cap | match; **bytes 261,300 not 261,296** (N1) |
Marker node translations in the GLBs equal the §3.2 datum values exactly (turbo 5, intake 2, exhaust 1, intercooler 1; piston 0); model-vertex-to-datum distances ≈0.000 mm. Intake centreline length: dense Catmull-Rom arc length (877 samples, 1 mm) = **887.7995 mm** (32-sample chord = 886.498) — matches 887.8.

**D. Stock piston + CR arithmetic.** `rot_piston_c1_stock.glb`: 4,832 tris, 3 materials, glTF bounds X/Z ±51.425, Y −0.02294…0.04980 (OD 102.85, crown 49.80, skirt −22.9425) — matches §3.2. Stock bowl volume recomputed from the frozen `build_cylinder1.py` crown profile (conical-frusta / solid-of-revolution): **29.5864965 cm³**, exactly the prototype’s 29.586; variant bowl = 32.8164965, Δ = **3.230000 cm³** (matches prototype). But `Vd = π/4·103²·99 = 824,896.6 mm³` and the CR-implied ΔVc = **3,225.4 mm³ = 3.2254 cm³** (CR with the prototype’s 3.230 target = 16.4987) — spec’s 824,868 and “exactly the CR-implied” do not reproduce (F2). Prototype relief volume (0.912447955 cm³) is real and excluded from the dish volume (F1).

**E. Budget arithmetic (all sums re-derived).** `302,620 − 8,356 + 10,800 + 2,944 = 308,008` ✓ phone/desktop scene; headroom 11,992 (3.7475 % → “3.7 %”) / 51,992 ✓. `2×274,104 + 33,840 + 64 = 582,112` ✓; headroom 117,888 ✓; phone submitted 308,008, headroom 91,992 ✓. Draw calls main worst `59 + 11 − 12 + 11 = 69`; +36 shadow = 105 ✓; headroom **145 desktop** (spec says 51 — F3), phone 120 − 69 = 51 ✓. Measured-prototype worst `302,620 − 8,356 + 9,198 + (4,224−4,832)×8 = 298,598` ✓; 4,022 below stock ✓; external measured total 9,198 ✓; measured phone headroom 21,402 ✓. Texture/HDRI memory 27.25 / 11.25 MiB unchanged ✓. Piston Δ doubled by shadow pass: 2,944 (spec’s §6.3 row) — the frame-time “0 shadow tris” is wrong (S1).

**F. Code reality checks (all present unless noted).** `PartVariant.modelPath`/`explodeVectorMm` (`src/core/interfaces.ts:51–52`); `createEngineScene(container, config, valveCfg, detailCfg)` (`engineScene.ts:325`); `EngineRenderStats` (`:72`); `applyV8KinematicState` (`:611`); `loadRegisteredExteriorShell(loader,url,registration)` (`exteriorLoader.ts:108`); `extractPartPrimitives`/`wrapInPartLocalFrame` (`partLoader.ts:150,30`); `EngineUiOptions` (`engineControls.ts:588`), `setBuildSelection` (`:1289`), `evaluateAndPushModifiedBuild` (`:974`); `REFERENCE_FRAME_DEFS` (`main.ts:127`); benchmark wait `detailedLoaded && hdriLoaded && exteriorLoaded` (`main.ts:256`); `import.meta.env.BASE_URL` (`engineScene.ts:437`); 23 label anchors (`viewLayout.ts:153–177`); architecture test only constrains three imports (`architecture.test.ts:24–49`); `modelPath`/`explodeVectorMm` are asserted only in `src/catalog/modified.test.ts:87–88` and are not read by `src/perf/**` or `src/renderer/**` today; M6 compatibility rule is `pistons_lowcomp → turbo_large` (`catalog/modified.json:172–174`).

## 5. Verdict

**Blocker count: 4. Should-fix count: 13. Nit count: 9.**

The package is **not ready for the owner/Buckley audit** but **is ready for revision**: the design direction, the shell-split accounting, the budget arithmetic (apart from F3/S1), the prototype triangle/bounds/clearance evidence, and almost all shipped-code assumptions check out independently. The V5 piston section (F1/F2) must be re-derived and defused first — it currently quotes a prototype that contains forbidden features and two numbers that do not reproduce. F3 and F4 are direct corrections to §12. The should-fixes are mostly precision/test-strength/document-completeness issues and one contract/decision-record gap; the nits can be recorded without blocking.

## 6. Second-pass QA (post-revision)

**Scope and method.** Re-read the revised spec in full at HEAD `5176a05` (534 lines), the filled dispositions in §3, and the updated prototype evidence: `m8-prototype/PROTOTYPE-REPORT.md` rev. 3, `out/results.json`, `out/blender_verify.json`, rebaked `glb/rot_piston_c1_lowcomp.glb`. Re-ran the touched independent checks in the pass-1 scratch harness (`m8-QA-scratch/glb.js`, shell/datum/merge scripts, Python solid-of-revolution recomputation, budget arithmetic, stale-number greps); inspected the revision diff (`git diff 2787f92 5176a05`). The repo tree is clean at `5176a05`; no build code exists yet, so the pass-1 baseline (58/58 tests, typecheck green) is unchanged. Limitation unchanged: no WebGL/Blender run; visual claims remain checked by code + acceptance design.
**Historical note.** §4C/§4D above quote the pass-1 *with-relief* V5 measurements (4,224 tris / 2,214 verts / 13,422 total / 261,300 bytes). They are pass-1 evidence and are **superseded** by the rev-3 artifacts now recorded in the spec: V5 **3,744 tris / 1,926 verts**, total **12,942 / 251,508 bytes**.

### 6.1 Closure table

| Item | Status | Evidence (revised spec `5176a05`, updated artifacts) |
|---|---|---|
| F1 | **Closed** | Prototype rebaked no-relief: `results.json` V5 tris 3,744 / verts 1,926 / mats 3, `meta.valve_reliefs_modelled = 0`, profile p0–p5, byte sum 251,508; report rev. 3 §2.5. Spec §3.2 V5, §3.6, §12.2 and §12.5 item 3 state the no-relief design and mark the 4,224-tri with-relief measurement superseded; grep finds no stale 13,422 / 261,296 / 298,598 anywhere in the spec. |
| F2 | **Closed** | §3.2 V5 line 139: Vd 824,896.6, ΔVc 3.2254 cm³, assertion `|Δ − 3.2254| ≤ 0.05`; pinned profile p0–p5 (line 135) with derived z values (floor 33.5043, lip 48.4963, shoulder 36.4375) all self-consistent; independent recompute from the pinned 4-dp profile = **32.81660 cm³ / Δ 3.23012** (unrounded profile 32.8164965 / 3.2300000 — 0.0001 pin rounding, immaterial); CR 16.4987 and band 16.4855–16.5146 = 16.50 ± 0.015 confirmed. |
| F3 | **Closed** | §12.4 line 523: 145 desktop / 51 phone; 69 phone from the 59 max-unculled baseline (65 from 55). Recomputed: 250−105 = 145; 120−69 = 51; 59+10 = 69; 55+10 = 65. |
| F4 | **Closed on substance; new derivation claim P2** | §12.1 separates five stock contact vertices (0.0284 / 0.0372 / 0.0378 / 0.0513 / 0.0517 mm re-parsed) from two service points (airbox 17.828 mm, charge-pipe flange 31.394 mm); §3.2 V2/V4 state service-point status. The newly claimed centroid derivations do not reproduce (P2). |
| S1 | **Closed (residual P7)** | §6.3 frame-time row now +2,944 shadow-pass tris; stock post-split expectations (calls 106/66, geometries 67, meshes 33) in §6.3/§10.6; all budget sums unchanged (308,008 / 582,112 / 294,758). §10.5 still says “M7 numbers” (P7). |
| S2 | **Partially closed (P1)** | OD −0.00/+0.10, crown ±0.10, X/Z half-extents, pivot, skirt-bottom checks added to §3.2 V5/§9.5; but half-extents ±0.25 permit OD 103.35 > the 103 mm bore, contradicting the OD cap (P1). |
| S3 | **Closed (residual P11)** | `src/ui/referenceFrames.ts` + `src/ui/referenceFrames.test.ts` added to §5.2/§8/§9.12; §9.6 requires spec-literal expected values + build-script GLB read-back (§3.3); §9.9 derives from `VARIANT_TRIANGLE_CAPS`/`EXTERIOR_PRESERVED_TRIANGLES`; test 12 imports the real module. Key-set enumeration residual (P11). |
| S4 | **Closed** | §4.1 “two public functions and one exported type”. |
| S5 | **Closed** | §7.3: intro to ten frames / `?rf=RF-1`…`RF-10`, `Variants` summary column, per-frame “Build selection”. |
| S6 | **Closed** | §7.11 + D-038 now record the D-011 scene-placed class extension (uncompressed/no-texture deferral, root-naming exception, `if_*` markers) consistently. |
| S7 | **Closed** | §8 adds `docs/M7-MEASUREMENTS.md` to the frozen list and notes `docs/research/**` is not edited. |
| S8 | **Closed** | §4.3 defines `PistonBatchSet { standard, firing, firingMaterials }`, mutates `DetailedV8Batches` refs, detach/add meshes (not `visible=false`), one immediate kinematic pass, clone tracking and dispose-once. |
| S9 | **Closed** | §4.3: `variantsLoaded` = all loads settled, `failedVariantIds` stat, “active” = selected **and** loaded for attachment and shell hiding; benchmark cannot hang on a failed asset. |
| S10 | **Closed (residuals P9/P12)** | Renamed “vertex-level non-penetration against analytic envelopes”; §3.3 defines V1–V4 envelopes and 30 mm excepted connection zones and records the vertex-sparsity residual risk in §12.5/its M8-VARIANTS claim. §7.1 does not require that paragraph (P9); envelopes omit some model parts (P12). |
| S11 | **Closed** | §3.6 V5 attributes −41.8 cc / pin 1.358 in / CH-not-published to 930029875 and CH 1.951 in to 930036055; not-adopted CH bullet matches. |
| S12 | **Closed** | New §3.2 contract-root/marker table (file → root object → markers; 9 marker entries, 7 unique names) and §9.4 compares against that table; consistent with §3.2 prose. |
| S13 | **Closed** | §5.2 pins the order descriptors → scene → mount → initial all-stock state → `?rf` → `?benchmark` (last-writer-wins); consistent with `main.ts`'s current mount-before-`?rf` structure. |

**Nit closure:** N1 closed (251,508/12,942); N2 closed (§3.2 V1 stock-envelope ≈126–132 wording); N3 **partially closed** — see P5; N4 closed (byte-identical + shell SHA-256 to be recorded in M8-MEASUREMENTS); N5 closed (construction/dimensions vs crown shape/tessellation wording); N6 closed (§1 reworded); N7 closed (§12.3 names `check_intake_interference.py`, 21+39+45 = 105); N8 closed (10 new tests / four new files, §9.12 file named); N9 closed (M6 quote now full).

### 6.2 New findings from the revision

**P1 — should-fix — Piston asset-test tolerances contradict each other and the bore-fit claim (§3.2 V5 line 141, §9.5 line 452).** “glTF X/Z half-extents 51.425 ± 0.25 mm” permits a half-extent of 51.675 → OD 103.35 mm, larger than the 103 mm bore, while the same sentence pins OD −0.00/+0.10 mm (max 102.95) and says “never above the bore-fit stock envelope” (stock OD 102.85; the design line also says “must not exceed the stock part’s” yet allows +0.10). The test therefore cannot enforce the regression it names.
Fix: pin half-extents to 51.425 (−0.25/+0.05, i.e. max 51.475 = OD 102.95) and state the OD/bore clearance rationale, or tighten to stock OD max 102.85; align both clauses.

**P2 — should-fix — The two newly claimed “centroid” derivations for the service datums are not reproducible from the shell/prototype record (§3.2 V2 line 95, §3.2 V4 line 126, §12.1 line 494).** The prototype hardcodes both points (`m8-prototype/scripts/shell.py:146` and `models.py:28`) and no script derives them; the report calls them “documented interface markers”. My independent cluster checks: for the airbox datum (587.4, −510.5, 371.9), sphere-cluster centroids for R = 22–80 mm, annulus 17–35 mm, and nearest-N 6–48 vertices all land 9.6–15.6 mm from the datum (no cluster reproduces it); for the hot-side datum, only a loose 69-vertex R = 40 mm sphere gives a centroid within 0.67 mm, and no cluster radius/definition is pinned. The distance values themselves (17.83 / 31.39) are correct.
Fix: either present both as documented legacy service points (stock-intake end / charge-pipe end) without a centroid claim, or pin the exact cluster definition/algorithm and reproduce the datum from it.

**P3 — should-fix — `pistonDishRimRadiusMm` is mislabelled in `variant_dimensions.json` and conflicts with the pinned profile (§3.3 line 159 vs §3.2 V5 lines 135/137, §3.3 read-back line 165).** §3.2 labels 29.8265 the “mouth/land start” and 51.425 the “rim”; §3.3 pins key `pistonDishRimRadiusMm` = 29.8265, and the export read-back says “dish lip/rim radii”. A builder/test following the key name would compare the mouth radius against the mesh’s rim (51.425) and fail or mis-pin.
Fix: rename the key to `pistonDishMouthRadiusMm` (or `pistonDishCrownLandStartRadiusMm`), keep the outer rim as `pistonCrownOuterRadiusMm` 51.425, and make the §3.3 read-back name both explicitly.

**P4 — should-fix — §4.2 claims `EXTERIOR_PRESERVED_TRIANGLES` is “verified against the parsed shell in test §9.7”, but §9.7’s text asserts literal counts only (§4.2 line 270, §9.7 line 454, §9.9 line 456).** If a constant were wrong (e.g. 2,560 instead of 2,056), §9.7’s literals would pass, and §9.9’s budget guard would use the wrong hides; the claim and the guard are not tied together. (The caps side has the same mapping gap: `VARIANT_TRIANGLE_CAPS` is keyed by variant id, §6.1 by file.)
Fix: §9.7 must assert `EXTERIOR_PRESERVED_TRIANGLES[id] === parsedCount` (keeping the literals), and §9.4/§9.9 should state the file→variant-id mapping used for the caps.

**P5 — should-fix — §3.2 V2 still pins the stale compressor-inlet normal (§3.2 line 94 vs lines 73/81).** Line 94 says “first tangent fixed to the turbo-bell mating normal (0.737, −0.671, −0.057)”; §3.2 V1 pins the normalized unit vector `(0.7382, −0.6722, −0.0571)`, which is also the actual normalized first tangent of the pinned 9-point path (`0.5·(p1 − p0)` = (0.7382, −0.6722, −0.0571)). N3 is therefore only partially closed.
Fix: change line 94 to `(0.7382, −0.6722, −0.0571)` (or state it as ≈).

**P6 — nit — §12.1’s stock-gap evidence does not fully reproduce (line 494).** “1.80 mm (compressor inlet)” — independent shell recomputation gives turbo-unit ↔ intake minimum **1.839 mm** (nearest intake vertex to the datum 1.834 mm), and no artifact/script records 1.80. The contact list “0.028 / 0.037 / 0.037 / 0.051 / 0.052” under-rounds the RH up-pipe: measured 0.0372 / 0.0378 / 0.0513 / 0.0517 → 0.037 / 0.038 / 0.051 / 0.052. Fix: cite/update 1.84 and correct the rounding or quote 4 dp.

**P7 — nit — §10.5 still says “the stock state reproduces the M7 numbers within tolerance” (line 469)** while §6.3/§10.6 now document the split’s expected deltas (calls 106/66, geometries 67, meshes 33 vs M7 95/55, 56, 22). Reword as “reproduces the post-split expectations of §6.3/§10.6 (M7 values plus the documented deltas)”.

**P8 — nit — §1 numbered-item formatting (line 13):** the item-4 text is appended to item 3 (`…`docs/OPEN_ITEMS.md`.4. **Measured budget record…`) so item 3 swallows item 4. Insert a line break between items 3 and 4.

**P9 — nit — §3.3 says the vertex-level residual risk is “recorded in §12.5 and docs/M8-VARIANTS.md” (line 163), but §7.1’s M8-VARIANTS content list (line 419) does not require that paragraph.** Add the residual-risk/vertex-sparsity limitation to §7.1 so the build doc must carry it.

**P10 — nit — §9.12 says “every frame entry has valid camera/target/quality/section states” (line 459), but the moved entry type has no `quality` field** (the current `ReferenceFrameDef` has θ/pose/exterior/explode/section/xray/labels; `applyReferenceFrame` hardcodes quality `full`). Either add `quality` to the type or drop it from the test description; also state that `src/ui/referenceFrames.ts` must use type-only imports (e.g. `UiSectionMode`) to stay DOM-three-free.

**P11 — nit — §3.3 still says “the exact key set is recorded in the asset test” (line 159)**, i.e. the spec does not enumerate the `variant_dimensions.json` key set/values. The §9.6 expected-literal test remains a builder transcription, and the new export read-back covers only markers, bounds, V2 tube OD and the V5 crown profile. Consider listing the key set in §3.3 (or a committed fixture) or extending the read-back to the remaining per-model pinned dimensions.

**P12 — nit — §3.3’s analytic envelopes do not cover the whole models (line 163).** V3’s tail pipe X −950…≈−1,035 is outside the “swept tube + canister” envelope; V4’s Ø76.2 hot-side adapter (≈230 mm run), cold-side outlet, couplers, fins and brackets are outside the “tanks + core” boxes. The zero-non-excepted-vertices check is therefore partial; state its coverage explicitly or extend the envelope definitions (the 30 mm marker zones remain excepted).

**P13 — nit — §9.5 says “48 circumferential segments implied by the triangle budget” (line 452);** a triangle cap cannot verify a circumferential segment count. Add a geometry assertion (e.g. 48 vertices around the crown ring) or drop the clause.

### 6.3 Independent recomputation note (pass 2)

- **Shell (unchanged, re-parsed):** 31,396 tris / 33,187 accessor verts; registered bounds X [−282.14, 892.75], Y [−573.40, 521.82], Z [−223.60, 583.88]; `turbo` children 384 / 384 / 560 / 2,056; `intake` 5,740 tris / 14 primitives; material-signature merge 22 → split 33 (+11; 6/1/5 preserved, 21/23,040 remaining) — all match §6.2/§12.1.
- **Datums:** five contact nearest-vertex distances 0.0284 / 0.0372 / 0.0378 / 0.0513 / 0.0517 mm (matches §12.1 to 2 dp except the RH-up-pipe rounding, P6); airbox 17.828 mm, hot side 31.394 mm (matches); stock turbo-unit↔intake 1.839 mm (P6), ↔RH/LH up-pipes 2.503 / 3.172 mm, ↔downpipe 16.198 mm; stock intake↔acComp 1.409 mm.
- **V5 piston (rev-3):** parsed GLB 70,756 bytes, 3,744 tris, 3 materials, 0 images, 0 markers, part-local bounds ±51.425 / −22.9425…49.8 mm. Pinned-profile solid-of-revolution recompute: variant 32.81660 cm³, stock 29.58648 cm³, Δ 3.23012 (unrounded 32.8164965 / 29.5864965 / 3.2300000); ΔVc 3.2254 cm³; CR 16.4987; ±0.05 band → CR 16.4855–16.5146. z floor 33.5043, lip z 48.496344, shoulder z 36.437526, floor r 16.456, shoulder r 23.14125, lip r 28.798, mouth r 29.8265 — all self-consistent with the pinned table.
- **Prototype artifacts (updated):** `results.json` tris 3,166 / 2,400 / 2,272 / 1,360 / 3,744, total **12,942**, GLB bytes sum **251,508**, V5 `meta` carries the p0–p5 profile and `valve_reliefs_modelled = 0`; `blender_verify.json` round-trip V5 3,744 tris / 71,456 bytes / 0 markers, others unchanged, `all_roundtrips_ok: true`; report rev. 3 §2.5 matches the spec's pinned profile.
- **Budget:** all sums unchanged and re-verified: 308,008 (cap); 582,112; 298,598 → replaced by 294,758 measured (7,862 below stock; 25,242 phone headroom); 145/51 call headroom; 3.7475 % phone scene headroom; 67 geometries / 33 exterior meshes stock; 81 worst-case geometries. `memory.geometries` and `exteriorMergedMeshes` deltas are now recorded (§6.3/§10.6).
- **Stale-number scan:** no `13,422` / `261,296` / `298,598` / `2,214` in the revised spec; `4,224` appears only in the two explicitly-superseded contexts (§12.2, §12.5 item 3). The pass-1 QA appendix §4C/§4D is historical (see historical note above).
- **Not reproduced:** the §12.1 “1.80 mm” stock gap (recomputed 1.839 mm) and the 3-dp rounding of the RH up-pipe (0.037 vs 0.0378). Every other revised §12/§6 number reproduced.

### 6.4 Verdict

**PASS 2: 0 blockers / 5 should-fix / 8 nits — revision still required (should-fix only; no blockers).** All four pass-1 blockers are closed: the V5 piston is now the no-relief design with a rebaked prototype, corrected CR arithmetic, a pinned/auditable crown profile and consistent totals (12,942 / 251,508); F3’s headroom and F4’s contact-vs-service-point distinction are correct. The remaining items are one tolerance contradiction (P1), one unverified provenance story (P2), two contract/test precision issues (P3/P4), one stale pinned vector (P5), and eight wording/completeness nits — all one-file edits with no design impact. Once §6.2 P1–P5 are closed and the nits recorded, the package is ready for Buckley’s audit.

### 6.5 Pass-2 dispositions (drafting agent)

All five pass-2 should-fixes were accepted and fixed, and all eight pass-2 nits were accepted/recorded (fixed where wording-only). The fixes are in the revised spec (committed after this pass-1+2 record); a focused pass-3 verification is appended as §7.

| ID | Severity | Disposition |
| --- | --- | --- |
| P1 | should-fix | **accepted (fixed)** — §3.2 V5 and §9.5 now pin glTF X/Z half-extents 51.425 (−0.25/+0.05) (max OD 102.95, never above the 103 mm bore), consistent with the OD −0.00/+0.10 clause; the "never above the stock envelope" wording is corrected to state the allowed 0.10 mm over the stock part with the bore rationale. |
| P2 | should-fix | **accepted (fixed)** — the two datums are now presented as **documented service points** (stock intake airbox end; stock charge-pipe far end) with their nearest-shell-vertex distances (17.83 / 31.39 mm); the unreproducible "centroid of vertex cluster" derivation claims are removed from §3.2 V2/V4, §12.1, and the §7.1 register requirement still records their status. |
| P3 | should-fix | **accepted (fixed)** — the JSON key is renamed `pistonDishMouthRadiusMm`; the crown outer rim keeps `pistonCrownOuterRadiusMm` 51.425; the §3.3 export read-back names the flat-floor/shoulder/lip/mouth radii and the crown outer rim explicitly. |
| P4 | should-fix | **accepted (fixed)** — §9.7 now asserts `EXTERIOR_PRESERVED_TRIANGLES[id] === parsedCount` in addition to the literals; §9.4/§9.9 state that caps are keyed by variant id and resolved through the catalog's `modelPath` mapping. |
| P5 | should-fix | **accepted (fixed)** — §3.2 V2's first tangent is now the normalized unit vector (0.7382, −0.6722, −0.0571), matching V1's compressor-inlet normal and the pinned path. |
| P6 | nit | **accepted (fixed)** — §12.1 now cites the independent re-measure 1.84 mm for the stock compressor-inlet gap and quotes the contact distances at 0.028 / 0.037 / 0.038 / 0.051 / 0.052 mm. |
| P7 | nit | **accepted (fixed)** — §10.5 now requires reproducing the post-split expectations of §6.3/§10.6 (M7 values plus documented deltas). |
| P8 | nit | **accepted (fixed)** — §1 items 3 and 4 are on separate lines. |
| P9 | nit | **accepted (fixed)** — §7.1 now requires the vertex-level residual-risk paragraph in `docs/M8-VARIANTS.md`. |
| P10 | nit | **accepted (fixed)** — §9.12's frame-state list drops the non-existent `quality` field and states the module is DOM/three-free with type-only imports. |
| P11 | nit | **accepted (fixed)** — §3.3/§7.1 now require the full `variant_dimensions.json` key table (every pinned value) in `docs/M8-VARIANTS.md`, pinned as literals by the asset test. |
| P12 | nit | **accepted (fixed)** — the analytic envelopes are now defined as the **union of each model's own analytic primitives** (V3 includes the tail tube; V4 includes the adapter, couplers and outlet neck), so the non-penetration check covers the whole model by construction. |
| P13 | nit | **accepted (fixed)** — the "48 circumferential segments implied by the triangle budget" clause is removed from §9.5; the segment count remains a recorded authoring choice in §3.2/M8-VARIANTS. |

**Status after pass-2 fixes:** no blockers remain; the five should-fixes and all nits are addressed in the spec revision. The focused pass-3 verification (§7) is the final check on these edits before the package is handed to Buckley.

## 7. Pass-3 verification (focused)

**Scope and method.** Reviewed the pass-3 revision `5176a05 → 2ff8ce2`: 9 hunks / +17 −16 lines in `docs/specs/M8-part-variants.md` (plus the §6.5 dispositions appended to this report). Re-read every changed section and §6.5; grepped for the removed claims/keys/stale numbers; re-ran the arithmetic, the V5 profile volume recomputation and the pass-2 shell/GLB checks (prototype artifacts and the shell are unchanged since rev. 3); checked the changed/frozen lists, test inventory, D-038/§7.11 and the §3.2 marker table. Repo tree clean at `2ff8ce2`; no code changed, so the pass-1/2 gates stand.

### 7.1 Per-item closure (pass-2 findings)

| Item | Status | Evidence (HEAD `2ff8ce2`) |
|---|---|---|
| P1 | **Partially closed — Q1** | Upper side now consistent: max half-extent 51.475 → OD 102.95 = the OD cap. The lower half-extent tolerance still contradicts the OD minimum (Q1). |
| P2 | **Closed** | `centroid` remains only in the legitimate “cross-section-centroid march” route derivation; §3.2 V2/V4 and §12.1 present both datums as documented service points (17.83 / 31.39 mm) fixed at prototype stage, explicitly “no cluster-derivation claimed”; §7.1 records their status alongside the five contact vertices. |
| P3 | **Closed** | No `pistonDishRimRadiusMm` remains; `pistonDishMouthRadiusMm` 29.8265 and `pistonCrownOuterRadiusMm` 51.425 in §3.3/§7.1; §3.3 read-back names the mouth radius and the crown outer rim explicitly. |
| P4 | **Closed** | §9.7 now asserts `EXTERIOR_PRESERVED_TRIANGLES[id]` equals each parsed subtree count in addition to 2,056 / 560 / 5,740; §4.2’s “verified against the parsed shell in test §9.7” is now true; §9.4/§9.9 state the file → variant-id resolution via the catalog’s `modelPath` mapping. |
| P5 | **Closed** | No `0.737` remains; V2’s first tangent is (0.7382, −0.6722, −0.0571), identical to V1’s compressor-inlet normal and to the normalized first tangent of the pinned path. |
| P6 | **Closed** | §12.1 now cites the independent re-measure 1.84 mm (old 1.80 mm scan explicitly superseded) and quotes 0.028 / 0.037 / 0.038 / 0.051 / 0.052 mm — all reproduced from the shell. |
| P7 | **Closed** | §10.5 now requires the post-split expectations of §6.3/§10.6 (M7 values plus documented deltas). |
| P8 | **Closed** | §1 items 3 and 4 are separate list items. |
| P9 | **Closed** | §7.1 requires the vertex-level residual-risk paragraph in `docs/M8-VARIANTS.md` (with the full key table). |
| P10 | **Closed** | §9.12 drops the non-existent `quality` state and notes the frame module is DOM/three-free with type-only imports. |
| P11 | **Closed** | §3.3 now delegates the key-set table to `docs/M8-VARIANTS.md` (“every pinned value”) with a literal asset-test pin; §7.1 requires the table. |
| P12 | **Partially closed — Q2** | V3 tail and V4 adapter/couplers/outlet added, but the new universal claim “covers the whole model by construction” is false for several primitives (Q2). |
| P13 | **Closed** | “48 circumferential segments implied by the triangle budget” removed from §9.5; the segment count remains a recorded authoring choice in §3.2/M8-VARIANTS. |

### 7.2 New findings (pass 3)

**Q1 — should-fix — lower `glTF X/Z half-extent` tolerance contradicts the OD minimum and the “must not exceed” lead-in (§3.2 V5 line 142, §9.5 line 453).** Half-extents **51.425 (−0.25/+0.05)** permit 51.175 → **OD 102.35 mm**, while the same clause pins **OD 102.85 (−0.00/+0.10)** (min 102.85) and says “never above the 103 mm bore”; only the upper bound is consistent (51.475 → OD 102.95). The sentence “Outer envelope must not exceed the stock part’s” is also immediately contradicted by the allowed +0.10 mm over the stock 102.85 (the parenthetical explains the intent, but the requirement text still conflicts).
Fix: use half-extents 51.425 **(−0.00/+0.05)**, or state that the test pins only the *maximum* half-extent and widen/remove the OD minimum explicitly; reword the lead-in to “must stay within the bore-fit envelope (OD ≤ 102.95)”. (The §6.5 P1 disposition’s “consistent with the OD −0.00/+0.10 clause” is true only for the upper bound.)

**Q2 — should-fix — the envelopes are not “the whole model by construction” (§3.3 line 164).** The declared analytic envelopes omit primitives the builder must create from §3.2: **V1** — the compressor inlet bell/flange (r48 disc reaches X ≈ 45.6, outside the compressor-housing envelope X ≤ +16), the compressor outlet elbow/flange (model X max 47.1; housing stops at +16), up-pipe flange discs r44 around contacts at radial 55.7/103.9 mm (up to ≈148 mm, outside the turbine shell r117), and the actuator bracket/rod/fasteners; **V2** — Ø116/r58 couplers, Ø120/r60 clamps and the Ø160 filter cone (only the r50.8 tube is enveloped); **V3** — the r52 inlet flange and flared r56 tip exceed the r50.8 tube envelope; **V4** — the 18 raised fins on the −Y core face (outside the core box Y 555–645) and the 3 mounting brackets above the tank tops (outside Z ≤ 320). The zero-non-excepted-vertices assertion therefore under-covers the model while the text claims full coverage; the residual-risk note covers vertex sparsity, not omitted primitives.
Fix: extend the analytic envelope list to every primitive named in §3.2, or soften to “the model’s principal solids; the remaining detail primitives are covered by the §3.2 bounds, the export read-back and the RF renders”. (The §6.5 P12 disposition repeats the overclaim; it should not be read as verified coverage.)

### 7.3 Regression scan

All pass-2 numbers still reproduce: cap-based scene 308,008; submitted 582,112; measured 294,758; V5 total 12,942 tris / 251,508 bytes; draw-call headroom 145/51 (calls 106/66 stock); phone scene headroom 3.7475 %; V5 pinned-profile volumes 32.8165 / 3.2300 cm³, Vd 824,896.6 mm³, ΔVc 3.2254 cm³, CR 16.4987 unchanged. No stale `13,422` / `261,296` / `298,598` / `2,214`; `4,224` appears only in the two explicitly superseded contexts. Changed/frozen lists, the 10-new-tests / four-new-files count, D-038 vs §7.11, the §3.2 contract-root/marker table (9 marker entries / 7 unique names) and the reference-frame/UI wiring are unchanged and internally consistent. Removed-claim greps (`0.737`, `pistonDishRimRadiusMm`, datum `centroid` claims, §9.12 `quality`, “48 segments implied by the triangle budget”) all return clean; §1 numbering, §10.5 wording, §12.1 contact values and the §7.1 key-table/residual-risk requirements are as intended.

### 7.4 Verdict

**PASS 3: 0 blockers / 2 should-fix / 0 nits — revision still required (two one-line wording/tolerance fixes; no blockers).** All four pass-1 blockers are closed; all pass-2 should-fix are closed except the residual lower-tolerance part of P1 and the over-broad envelope claim of P12, now tracked as Q1/Q2. The design, budgets, assets, tests and documents are sound. Close Q1 (align the half-extent/OD lower tolerances and reword the “must not exceed stock” lead-in) and Q2 (extend the analytic envelopes or de-scope the “whole model by construction” claim) in the spec, then the package is ready for Buckley’s audit; no further QA pass is needed beyond confirming those two edits.

## 8. Q1/Q2 dispositions (drafting agent, final)

Both pass-3 should-fixes are accepted and fixed in the spec; per §7.4's own instruction ("no further QA pass is needed beyond confirming those two edits"), the drafting agent's confirmation of the exact edits is recorded here. The QA record is complete: **passes 1–3 + this disposition = the package is ready for Buckley's audit.**

| ID | Severity | Disposition |
| --- | --- | --- |
| Q1 | should-fix | **accepted (fixed)** — §3.2 V5 is re-titled "Envelope contract (bore-fit)": OD **102.85 (−0.00/+0.10)** (never below stock OD; at most 0.10 above it, still 0.05 mm under the 103 mm bore) and glTF X/Z half-extents **51.425 (−0.00/+0.05)** (OD 102.85…102.95), so both bounds and the lead-in now agree; §9.5 pins the same half-extent tolerance. The contradictory "must not exceed the stock part's" lead-in is gone. |
| Q2 | should-fix | **accepted (fixed)** — §3.3's envelope definition now lists **every analytic solid named in §3.2** (V1 housings, CHRA, inlet bell/flange, outlet elbow/flange, turbine-outlet neck/flange, up-pipe nozzles + r44 flange discs, actuator canister/bracket/rod; V2 tube, couplers, clamps, filter cone + end cap; V3 tube, inlet flange, canister, tail tube + flared tip; V4 tanks, core, adapter + couplers, outlet neck + coupler, fins, brackets). The over-broad "whole model by construction" sentence is replaced by the explicit primitive list, so the check's coverage claim is now exact rather than implied. |

**Final package status (drafting agent):** spec revision committed on `plan/m8-part-variants`; all 4 pass-1 blockers, all 18 should-fixes (pass 1: 13; pass 2: 5) and all 9 nits are closed; the only changes since pass 3 touched those two clauses (verified by grep: no "51.425 (−0.25", no "whole model by construction"). QA record complete.

