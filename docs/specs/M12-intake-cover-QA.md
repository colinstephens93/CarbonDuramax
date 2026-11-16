# M12 Intake Cover — Independent QA Record (D-037 step 4)

- **Reviewer:** independent QA agent, separate from the drafting context.
- **Branch:** `plan/m12-intake-cover` (base `e22d2b0`); the spec and survey were **not edited** in this run.
- **Reviewed:** [`docs/specs/M12-intake-cover.md`](./M12-intake-cover.md) (787 lines) and [`docs/research/M12-intake-cover-survey.md`](../research/M12-intake-cover-survey.md) (183 lines).
- **Method:** independent recomputation from the frozen shell GLB (`public/Duramax_LLY_2005_66L_V8.glb`), the ten internal GLBs, the five M8 variant GLBs, `assets-src/variant_dimensions.json`, the committed M10/M11 benchmark records, the spec's own formulas, source grep, and direct sampling of the survey's external sources. WebGL benchmark rows were **not re-executed** in this sandbox (no headless WebGL browser is available); they were checked against the committed M10/M11 records and the static scene arithmetic, and that limitation is stated wherever it applies.
- **Result:** **24 findings — 3 blockers, 12 should-fix, 9 nits.** The central D-033 arithmetic, the scene totals, the V2 clearance and all six named shell clearances reproduce exactly. The placement audit does **not** reproduce as written: it omits an under-cover shell group and states two clearances that are not the clearances the geometry actually has (QA-01, QA-05, QA-06).

## Revision disposition (2026-11-15, planning-agent step 5)

Revised in response to this review. **All 3 blockers, all 12 should-fixes and all 9 nits were addressed; 0 findings were rebutted.** The table's `Disposition` column records the section changed for each finding. The decisive numbers were recomputed from the shipped GLB and code: `electronics` **25.908 mm** at (249.485, 91.198, 344.092); `chargePipeCold` group max **369.078 mm** at (348.544, −140.375), outside the planform, with the under-footprint vertex **364.828 mm** (5.172 mm) and a 0.922 mm vertical gap; **no** shell vertex above Z 417.2 inside the planform; resonator max X **236.546** (8.454 mm rear gap); V1/V3/V4 actual bounds **47.12 / −113.80 / 472.68** → separations **197.88 / 358.80 / 352.68**. The D-033 arithmetic is unchanged and still reconciles: 310,124 stock + cover, 306,432 worst + cover, 317,368 cap-guard, 9,876 phone triangles headroom. Because three blockers were found, `docs/PLANNING.md` step 5 requires one more independent QA pass before Buckley's audit; that pass is not part of this revision run.

---

## 1. Findings

Severity is rated **blocker** (the spec should not be approved until revised and re-QA'd), **should-fix** (must be corrected in the revision), or **nit** (record/fix opportunistically). The `Disposition` column is deliberately left `OPEN` for the revision run to fill with `FIXED`, `DEFERRED`, or `REJECTED (reason)`.

| ID | Severity | Spec location | Finding (quoted claim / evidence) | Revision action | Disposition |
| --- | --- | --- | --- | --- | --- |
| **QA-01** | **blocker** | `M12-intake-cover.md:225`, `:706`, `:487` test 3, `:604` acceptance 4 | **The clearance table omits `electronics` and the "all other groups" floor is false.** The table says `All other shell groups \| ≥ 67.07 mm \| measured per group, §15.4`, and §15.4 says `all other groups : >= 67.07 mm (cp3Fuel)`. A raw shell parse finds **`electronics` min 25.908 mm at (249.48, 91.20, 344.09)** — inside the planform and 25.91 mm below the 370.0 mm underside. `cp3Fuel` is 67.070 mm; the omitted group is 41.16 mm below the claimed floor. The actual overall minimum is still `chargePipeCold` 5.172 mm. Test 3 asserts only the six named groups; acceptance 4 repeats only those six, so nothing would catch a future `electronics` regression. | Add an `electronics` row (≥ 25.9 mm), a test-3 assertion and an acceptance step; say whether the loom is treated as an obstacle; renumber/reword the "all other" line. | FIXED — §4.5 table (added `electronics` 25.908 mm), §9 test 3, §13 acceptance 4, §15.4; the false “all other ≥ 67.07” is replaced by `cp3Fuel` 67.070 and remaining groups ≥ 73.407 (`beltDrive`). |
| **QA-02** | **blocker** | `M12-intake-cover.md:286`, `:342`, `:58` | **X-Ray ghosting has a load-order race the spec does not close.** The spec extends `syncExteriorShellState`'s loop and says the cover materials get `transparent = true`, `opacity = 0.22`, `depthWrite = false` "on X-Ray". But the load path (`:272-284`) calls only `syncIntakeCoverState()`; it does **not** call `syncExteriorShellState()`. If the cover finishes loading after the user has already enabled X-Ray (or after a `?rf=`/benchmark state sets X-Ray), `exteriorMaterialsGhosted` is already `true`, the ghost loop is skipped, the cover stays opaque, and `isSourceGhosted()` returns false so its cap is **not** suppressed. Test 7 is a source-text test and cannot catch this. | Call `syncExteriorShellState()` after the cover load (with the cover in the ghost set), and/or make each material's ghost state a function of `xrayEnabled` rather than a one-shot boolean; add a load-order regression test or an explicit acceptance check ("toggle X-Ray before the cover asset finishes loading"). | FIXED — §5.1 (`createExteriorGhostRegistry`), §5.2 items 2/4 (register-then-sync; no one-shot boolean), §9 test 7 runtime load-order sequence plus source check for the unconditional `setGhosted`, §13 acceptance 8 pre-load X-Ray check. |
| **QA-03** | **blocker** | `M12-intake-cover.md:18`, `:158`, `:161-167`; survey `:55`, `:80` | **The planform orientation contradicts the survey's form evidence and the spec calls it form-matched.** Survey §3: "a wide rear section, a narrower front tongue/tab, rounded corners, and a large relief/notch on one front corner." Survey §4: "A wide rounded rear, tapering/relieved front, a large notch at one front corner." The spec's P1–P6 is **wide at the front** (`X = 400`, `Y −120…120`), **narrower at the rear** (`X = 245`, `Y −40…120`) and puts the relief at the **rear-right** (`P1–P2–P3`). §4.2 nevertheless says the planform is "sized to the measured M10 shell and the GM EPC/photo form." The relocation may be a defensible M10-shell clearance choice, but it is a material departure from the only form evidence and is **not** in §15.7. | Either re-orient the shield (wide rear / narrow front / front-corner notch) and re-run the clearances, or relabel the planform explicitly as a **clearance-driven placeholder, not form-matched**, and add the EPC/photo form conflict to §15.7 and `docs/M12-COVER.md`. | FIXED — §1 item 4, §4.2, §15.7 item 10, §11.1, §12.2 D-046, §12.3; planform relabelled **clearance-driven, not form-matched**, with the engineering reason; not re-oriented because that would put the cover into the intake-duct/V2 corridor the relief clears. |
| **QA-04** | should-fix | `M12-intake-cover.md:5`, `:20`, `:419`, `:692` | **The cover cost is called "measured" when only a cap exists.** The header says "a measured ≤ 1,800 triangles / +2 draw calls / 0 texture bytes cost"; §1 item 6 calls it "A measured budget record"; §7.3 correctly says "budget cap"; §15.3 correctly says "The cover cap is a cap, not a measured asset." The asset does not exist yet, so 1,800 is `1,200 body cap + 600 lettering cap`, and 1,740 is the cap-conservative total using the 1,200 body cap, not a measured body. | Change the header/§1 wording to "budgeted/capped"; keep 1,800 as the conservative arithmetic; add a build-recorded actual row. | FIXED — header and §1 item 6 now say budgeted/capped; §7.3 keeps 1,800 as the conservative arithmetic and adds the build-actual row. |
| **QA-05** | should-fix | `M12-intake-cover.md:121`, `:175`, `:710`, D-046 `:563` | **"Cold charge pipe top (364.83)" is not the pipe's top.** The spec's own §3 table says `chargePipeCold` bounds `Z 146.9…369.1`; the raw shell parse gives group max **Z = 369.078 at (348.544, −140.375)**, which is outside the planform (at `X = 348` the relief edge is `Y = −120`). The 5.172 mm figure is at a different vertex, **(342.338, −99.358, 364.828)**, which is under the footprint. The body underside is only **0.922 mm** above the group max, but 20.4 mm outboard; the rear-right relief is load-bearing. Calling 364.83 "the top" overstates the vertical margin. | Say "highest pipe vertex **under the footprint** = 364.83 (5.172 mm clearance); group max = 369.078 at (348.544, −140.375), outside the relief (0.922 mm vertical gap)". Add a test that the 369.078 vertex is outside the planform. | FIXED — §4.2 table, §4.5, §9 test 3 (group max outside planform), §15.4, §15.7, §15.8, D-046; under-footprint 364.828 (5.172 mm) / group max 369.078 at (348.544, −140.375), 0.922 mm gap. |
| **QA-06** | should-fix | `M12-intake-cover.md:176`, `:227` | **"4.0 mm below the nearest overhead shell vertex (421.15)" is false and contradicts §4.5.** The only shell vertex near Z = 421.15 is a `turbo` vertex at **(−141.79, −39.46, 421.152)**, far outside the planform (the cover's X range is 245…400). §4.5 correctly says the lowest shell vertex above the cover top over the footprint is **none**. There is no overhead shell vertex to be 4.0 mm below. | Delete the "nearest overhead" claim or state "no overhead shell vertex over the footprint; 421.15 belongs to the turbo group outside the planform". Keep the 4.0 mm only as a drawing margin, not a clearance. | FIXED — §4.2 body-top row and §15.4; the overhead-vertex claim is deleted (0 shell vertices above 417.2 inside the planform); 4.0 mm to 421.15 is a drawing margin only. |
| **QA-07** | should-fix | Survey `:99`, `:131`; spec `:33`, `:575`; prior M10 survey `:142` | **"Fastener torque NOT PUBLISHED / no LLY service procedure for the cover was located" contradicts the repo's own M10 survey.** `docs/research/M10-exterior-accuracy-survey.md:142` records a GM service snippet (grade A, ADOPTED): "Loosen the intake manifold cover clamp (1) at the resonator" — **6 N·m (53 lb·in)**. The M12 survey's blanket row and the spec's non-goal/OPEN_ITEMS wording repeat "torque … not published". The rear **bolt** torque may indeed be unpublished, but the **clamp** torque is a prior project record. | Narrow the claim to the rear bolt; record/adopt the 6 N·m clamp torque as a prior-research conflict; update the OPEN_ITEMS bullet. | FIXED — survey §3/§5/§7/§9 and spec §1/§12.3; rear-bolt torque remains unpublished, front clamp **6 N·m (53 lb·in)** adopted as a prior M10 grade-A record. |
| **QA-08** | should-fix | `M12-intake-cover.md:112` | **The `git grep` self-check is literally false.** The spec says "`git grep 21994000` finds only the legacy viewer (`public/legacy/index.html:188,225`), no current source or asset." The actual grep also finds `README.md:10`, `assets-src/PROVENANCE.md:69`, `docs/M10-EXTERIOR.md:159`, `docs/OPEN_ITEMS.md:20`, `docs/research/M10-exterior-accuracy-survey.md:314`, and the M12 package. "No current source or asset" is true; "finds only the legacy viewer" is not. | Correct the sentence to "no current source or asset; the string also appears in README/PROVENANCE/M10 docs". | FIXED — §3 grep sentence now lists the real occurrences and states “no current source or asset”. |
| **QA-09** | should-fix | `M12-intake-cover.md:361-365`, `:553` | **The V1/V3/V4 rows are labelled "measured clearance" but use envelope bounds, not measured variant geometry.** `turbo_large` 49.8 is the *shell* turbo group max; the variant max is **47.12** → 197.88, not 195.2. `exhaust_4in` −110 is the variant envelope max; the actual max is **−113.80** → 358.80, not 355. `intercooler_upgraded` 430 is the envelope min; the actual min is **472.68** → 352.68, not 310. The values are conservative, which is fine, but calling them measured clearances is not. The PLAN exit line `:553` repeats "measured clearance". | Label these rows "conservative envelope separation" and cite the actual variant bounds, or compute vertex-level clearances; reserve "measured" for the shell and V2. | FIXED — §1 item 5, §6.6 table, §12.1 PLAN, §12.2 D-046, §15.9; V1/V3/V4 labelled **conservative envelope separations** with actual bounds 47.12 / −113.80 / 472.68 and separations 197.88 / 358.80 / 352.68. |
| **QA-10** | should-fix | `M12-intake-cover.md:607` (acceptance 7) | **The pixel-invariance acceptance is not executable from a fresh clone as written.** It requires "live re-renders of RF-1…RF-17 … pixel-compared in the 3D viewport region against the committed PNGs, show 0 differing pixels", but the repo contains no capture/diff harness (`tools/` has only `generateDimensions.ts`), and the spec names no command. The build's `docs/M12-MEASUREMENTS.md` can record a locally invented script, but Buckley cannot execute the criterion from a clean checkout without it. | Name and commit the capture/diff tool and the exact command (including masking), or downgrade acceptance 7 to a manual visual check with recorded reviewer notes. | FIXED — §8.2, §13 acceptance 7, §16 step 7 downgraded to an executable **manual visual gate** with recorded reviewer notes; no pixel-diff harness is claimed. |
| **QA-11** | should-fix | `M12-intake-cover.md:336`, `:423`, acceptance `:605` | **The cover-cap budget has no test or acceptance step.** §6.3/§7.3 budget "Cover section cap triangles ≤ 300"; acceptance 5 only checks the total `≤ 16,000`. A 301–16,000-triangle cover cap would pass every stated gate. | Add an asset/test/acceptance row for the cover cap at X = 300 (`≤ 300`), alongside the existing 16,000 total check. | FIXED — §6.3, §7.3, §11.2, §13 acceptance 5; the cover section cap at X = 300 is recorded and ≤ 300 is enforced. |
| **QA-12** | should-fix | `M12-intake-cover.md:284`, `:405`, §7.3 | **The new GLB has no byte/page-weight budget, although it is loaded on every load even when off.** M9's owner-directed page-weight guard (baseline startup payload 10,050,510 B; added JS ≤ 12,288 B min / ≤ 5,120 B gzip) is not referenced. A new asset loaded unconditionally can regress startup weight without any spec check. | Add a file-size cap and a recorded actual byte count (and/or load the cover lazily on first enable); state the page-weight delta against the M9 baseline. | FIXED — §4.1 and §12.4 file-size cap, §7.3 (GLB ≤ 64 KiB + actual), §7.4 page-weight delta (+0.652 % at cap vs 10,050,510 B), §9 test 1, §11.2, §13 acceptance 3/5. |
| **QA-13** | should-fix | `M12-intake-cover.md:535`; `docs/REFERENCE_FRAMES.md:41-43` | **The shared section-fill checklist is not updated for RF-19.** `docs/REFERENCE_FRAMES.md` says it is "Shared by `RF-6` and `RF-14`…`RF-17`" and lists only those; RF-19 is section-active. Its item 1 says "no dark cavity along the cut", while the spec's RF-19 deliberately shows the **open underside cavity** as air. The spec's §11.3 says add definitions/images/checklists but does not mention editing the shared list or the open-cavity exception. | Add RF-19 to the shared checklist header/list and state the open-underside exception explicitly. | FIXED — §11.3, §12.6 exact REFERENCE_FRAMES text, §9 test 10; RF-19 is in the shared checklist and the open-underside exception is stated. |
| **QA-14** | should-fix | `M12-intake-cover.md:64`, `:195`, `:207`; survey `:79` | **The front clamp is a separate EPC item, but the spec merges it into the body without labelling the simplification.** EPC item 003 is `CLAMP, CHRG AIR CLR OTLT DUCT (PART OF 2)`; survey §4 says the front clamp is a separate included part and is not visible in the top photographs. The spec models a "front clamp/leg" merged into the body mesh as the same material and calls it "the GM EPC's included charge-air-duct clamp". That is a legitimate cosmetic simplification, not the EPC part. | Label the leg as a simplified integrated mount (not the separate clamp), or model the clamp separately; record the choice in `docs/M12-COVER.md`. | FIXED — §2.2, §4.3, §4.4, §8.1, §11.1, §12.2, §15.7 item 11; the leg is labelled a simplified integrated mount, not the EPC clamp. |
| **QA-15** | should-fix | `M12-intake-cover.md:520`, `:523`, `:98` | **The on-screen illustrative scope does not clearly cover the cover's dimensions/planform.** The note labels only the legend ("The moulded '6.6 TURBO DIESEL' legend is an illustrative reconstruction"). The spec claims the M10 caption's "exterior shell's individual casting proportions…" covers the cover, but the cover is a separate add-on, not the shell. D-012 requires illustrative geometry to be labelled on screen; the planform, 47.2 mm height and 2.5 mm wall are placeholders recorded only in docs. | Add a cover-scope clause to the note/caption ("planform, dimensions and wall are illustrative placeholders") or extend the M10 caption to include the add-on. | FIXED — §10.2 note now labels planform/dimensions/wall as illustrative placeholders; §9 test 9 and §13 acceptance 9 updated. |
| **QA-16** | nit | `M12-intake-cover.md:20`, `:419`, `:755` | **"Planned total 1,740" is not a planned total.** It is `1,200` (the body **cap**) + `540` (the lettering construction). The body is capped at 1,200, not planned at 1,200. | Call it "cap-conservative total 1,740" or "≤ 1,740". | FIXED — §7.3, §15.3, §15.8 use “cap-conservative total 1,740”. |
| **QA-17** | nit | `M12-intake-cover.md:116`, `:118` | **Two line references are off.** `engineScene.ts:377-381` is the end of `buildMainCrankShaftMesh` / start of `createEngineScene`; the renderer is at **395-399**. `M10-MEASUREMENTS.md:19` is the merged-draw-call row; the shell bounds are at **21**. | Correct the two citations. | FIXED — §3 citations now `engineScene.ts:395-399` and `M10-MEASUREMENTS.md:21`. |
| **QA-18** | nit | `M12-intake-cover.md:181-182`, `:209` | **The "measured" marker contacts are rounded placeholders.** Rear marker `(260.0, 0, 333.4)` vs the nearest Y-bridge vertex `(260.690, 0, 333.356)` = 0.6916 mm; clamp marker `(372.0, −95.4, 353.4)` vs the nearest cold-pipe vertex `(371.634, −95.400, 353.367)` = 0.3672 mm. Both are within the 0.5 mm test, but the spec calls them "measured" coordinates. | Say "rounded to 0.1 mm from the measured vertex; deviation ≤ 0.5 mm" and keep the exact vertex in the test. | FIXED — §4.2 marker rows, §4.4, §9 test 2; coordinates are rounded to 0.1 mm, with exact vertices and 0.6916 / 0.3672 mm deviations quoted. |
| **QA-19** | nit | `M12-intake-cover.md:167`, `:222`, `:367` | **Resonator rounding is presented as exact.** Max X is **236.546**, not 236.5; the rear-edge gap is **8.454 mm**, not 8.5. The 8.793 mm vertex clearance is a different vertex and is correct. | Mark 236.5/8.5 as rounded, or quote 236.546/8.454. | FIXED — §3, §4.2, §4.5, §6.6, §15.4, §15.8, D-046 use 236.546 / 8.454. |
| **QA-20** | nit | `M12-intake-cover.md:194`, `:334` | **"The under-cover cavity is classified as a hole" is technically imprecise.** For an open thin-wall U-section the cavity is outside the material band, not an enclosed hole in the section; the visual result (thin band, open cavity) is still correct. | Say "the cap is the material band; the open underside is not filled" rather than "classified as a hole". | FIXED — §4.3, §6.3, §8.1, §13 acceptance 8, §15.7 item 7 say the cap is the **material band**; the open underside is not filled. |
| **QA-21** | nit | `M12-intake-cover.md:289` | **`intakeCoverMaterials` has no stated type.** Is it a count, a list of material names, or a list of objects? The other stats are numeric/boolean. | Specify (e.g. `number` of materials) in §5.2 and the `EngineRenderStats` field. | FIXED — §5.2 item 7 specifies `intakeCoverMaterials: number` (the count of materials). |
| **QA-22** | nit | `M12-intake-cover.md:434` | **The p95 baseline is inconsistent with the M11 detail table.** Spec says current `16.8 / 16.8 ms`; M11 §3.2 reports phone stock p95 **17.0 ms** (M11 §3.3's verdict table rounds it to 16.8). The acceptance target "within +0.30 ms of the M11 rows" is therefore ambiguous for phone. | Pin the baseline rows explicitly (desktop 16.8, phone 17.0 from M11 §3.2) or state the rounding convention. | FIXED — §7.4 table, §7.6, §13 acceptance 5 pin desktop 16.8 (M11 §3.2) / phone 17.0 (M11 §3.3); M11 §3.4 rounds the phone value to 16.8, and the spec now names that convention. |
| **QA-23** | nit | `M12-intake-cover.md:540`; `assets-src/PROVENANCE.md:69` | **The existing PROVENANCE row is left stale.** It says "Plastic cosmetic cover (`21994000`) excluded by decision (D-041) so the Y-bridge remains visible." That is still true of the M10 shell, but the spec's §11.8 says "no existing row changes", so the row will read as a whole-app exclusion after M12. | Add a clause to the existing row ("excluded from the M10 shell; available as the separate M12 add-on") or make the new cover row explicit that D-041 still governs the shell. | FIXED — §11.8 and §14; the existing PROVENANCE row is amended to “excluded from the M10 shell by D-041; available as the separate M12 add-on”. |
| **QA-24** | nit | `M12-intake-cover.md:495` (test 11) | **One clause in test 11 cannot fail.** "the total connected body components are ≥ 1 and finite" is true for any non-empty mesh; it does not test that the body, boss and clamp are closed (the 0-boundary-edge audit does). | Drop the tautological clause or replace it with an expected component count / closedness assertion. | FIXED — §9 test 11 now asserts exactly 3 closed body components and 45 closed lettering components. |

---

## 2. Recomputation table — spec claim vs QA value

All values below were independently recomputed from the frozen assets/code where possible. "Benchmark" means the value is from the committed M10/M11 `?benchmark=1` records and the static scene arithmetic; the WebGL run itself was not re-executed in this sandbox. That limitation is explicit, not a claim of independent browser measurement.

| # | Spec claim (location) | QA recomputation | Method / evidence | Match? |
| --- | --- | --- | --- | --- |
| 1 | Current stock scene **308,324** (`:129`, `:408`, `:663`) | **308,324** | `270,080` internal + `1,080` main shaft + `64` ground + `37,100` shell. Parsed all 10 internal GLBs × instance counts: 4,832×8 + 1,180×8 + 1,352×4 + 3,532×8 + 4,504×16 + 4,504×16 + 1,272×16 + 1,240×8 + 408×16 + 924×8 = **270,080**; shell scene total = **37,100**. | ✅ |
| 2 | Current worst scene **304,632** (`:129`, `:409`, `:664`) | **304,632** | `308,324 − 6,912` (8 × (4,832−3,968)) `− 6,500` (3,400+800+2,300 hidden) `+ 9,720` (3,204+2,560+2,436+1,520 external variants) = **304,632**. Variant tri counts parsed from the five GLBs. | ✅ |
| 3 | Desktop calls **96** stock / **97** worst; submitted **579,484** / **568,880**; VRAM **20.75 MiB** (`:408-409`) | 96 / 97; 579,484 / 568,880; 20.75 | Matches `docs/M10-MEASUREMENTS.md:191-195` and `docs/M11-MEASUREMENTS.md:63-69`. Not re-executed (no headless WebGL). | ✅ (committed record) |
| 4 | Phone calls **58** / **60**; submitted **307,876** / **304,512**; VRAM **4.75 MiB** (`:410-411`) | 58 / 60; 307,876 / 304,512; 4.75 | Same committed records; phone tier has no shadow pass and 2 fewer textures. | ✅ (committed record) |
| 5 | Cover scene cap **1,800** = 1,200 body + 600 lettering (`:419`) | **1,800 cap**; lettering **540** (45 × 12); cap-conservative total **1,740** | Arithmetic; the asset is not built, so no measured body/lettering count exists. The spec's "planned 1,740" is 1,200 body **cap** + 540, not a planned body. | ⚠️ cap only (QA-04, QA-16) |
| 6 | Cover draw calls **+2**; texture bytes **0** (`:420-421`) | +2 design; 0 design | Two meshes/two materials; no textures/images/UVs. Not measurable until the GLB exists. | ⚠️ design only |
| 7 | Stock + cover **310,124** (`:430`, `:674`) | **310,124** | 308,324 + 1,800. | ✅ |
| 8 | Desktop headroom **49,876** (**13.85 %**); phone **9,876** (**3.09 %**) (`:430`, `:675-676`) | **49,876** / 13.85 %; **9,876** / 3.09 % | 360,000−310,124; 320,000−310,124; percentages 49,876/360,000 = 13.854 %, 9,876/320,000 = 3.086 %. | ✅ |
| 9 | Stock submitted **581,284** / **309,676** (`:431`, `:677-678`) | **581,284** / **309,676** | 579,484 + 1,800; 307,876 + 1,800. | ✅ |
| 10 | Stock calls **98** / **60** (`:432`, `:679`) | **98** / **60** | 96 + 2; 58 + 2. | ✅ |
| 11 | Worst + cover **306,432** (`:430`, `:681`) | **306,432** | 304,632 + 1,800. | ✅ |
| 12 | Worst desktop headroom **53,568** (**14.88 %**); phone **13,568** (**4.24 %**) (`:430`, `:682-683`) | **53,568** / 14.88 %; **13,568** / 4.24 % | 360,000−306,432; 320,000−306,432. | ✅ |
| 13 | Worst submitted **570,680** / **306,312** (`:431`, `:684-685`) | **570,680** / **306,312** | 568,880 + 1,800; 304,512 + 1,800. | ✅ |
| 14 | Worst calls **99** / **62** (`:432`, `:686`) | **99** / **62** | 97 + 2; 60 + 2. | ✅ |
| 15 | Utilisation **86.15 / 96.91**; **85.12 / 95.76** (`:430`) | **86.15 / 96.91**; **85.12 / 95.76** | 310,124/360,000; /320,000; 306,432/360,000; /320,000. | ✅ |
| 16 | Submitted utilisation **83.04 / 77.42**; **81.53 / 76.58** (`:431`) | **83.04 / 77.42**; **81.53 / 76.58** | 581,284/700,000; 309,676/400,000; 570,680/700,000; 306,312/400,000. | ✅ |
| 17 | Draw headroom **152 / 60**; **151 / 58**; utilisation **39.20 / 50.00**; **39.60 / 51.67** (`:432`) | **152 / 60**; **151 / 58**; **39.20 / 50.00**; **39.60 / 51.67** | 250−98; 120−60; 250−99; 120−62; 98/250; 60/120; 99/250; 62/120. | ✅ |
| 18 | VRAM headroom **43.25 / 27.25 MiB**; utilisation **32.42 / 14.84 %** (`:433`) | **43.25 / 27.25**; **32.42 / 14.84** | 64−20.75; 32−4.75; 20.75/64; 4.75/32. | ✅ |
| 19 | Cap-guard **317,368**; phone headroom **2,632**; desktop **42,632** (`:436`, `:492`) | **317,368**; **2,632**; **42,632** | 308,324−6,500+10,800+2,944+1,800; 320,000−317,368; 360,000−317,368. | ✅ |
| 20 | Section state upper bound **≤583,526 / ≤311,918** (`:440`) | **583,526 / 311,918** | 581,426+1,800+300; 309,818+1,800+300. Conservative: at X=402.5 the cover cap is 0, not 300. | ✅ (conservative) |
| 21 | `chargePipeCold` **5.172 mm** at (342.34, −99.36, 364.83) (`:219`, `:700`) | **5.172 mm** at (342.338, −99.358, 364.828) | Raw shell parse, body envelope Z 370.0–417.2; 370−364.828 = 5.172. | ✅ |
| 22 | `alternator` **8.084 mm** at (404.6, −124.51, 365.12) (`:220`, `:701`) | **8.084 mm** at (404.6, −124.509, 365.12) | Distance to the body volume: √(4.6²+4.509²+4.88²) ≈ 8.08 (spec 8.084). | ✅ |
| 23 | `acComp` **8.246 mm** at (376.0, 128.0, 368.0) (`:221`, `:702`) | **8.246 mm** at (376.0, 128.0, 368.0) | √(8²+2²) = 8.246. | ✅ |
| 24 | `resonator` **8.793 mm** at (236.21, 22.3, 387.11) (`:222`, `:703`) | **8.793 mm** at (236.21, 22.3, 387.11) | 245−236.21 = 8.79. | ✅ |
| 25 | `intakeBridge` **18.046 mm** at (319.26, 8.0, 351.95) (`:223`, `:704`) | **18.046 mm** at (319.256, 8.0, 351.954) | 370−351.954 = 18.046. | ✅ |
| 26 | `intake` **48.049 mm** at (302.42, −152.73, 447.67) (`:224`, `:705`) | **48.049 mm** at (302.42, −152.73, 447.67) | Nearest relief edge is P2–P3 at (320, −120): √((320−302.42)²+(152.73−120)²+(447.67−417.2)²) = 48.049. | ✅ |
| 27 | **All other shell groups ≥ 67.07 mm** (`:225`, `:706`) | **FALSE: `electronics` = 25.908 mm** at (249.48, 91.20, 344.09); next lowest `cp3Fuel` = 67.070 | Raw shell parse, all 22 groups. | ❌ (QA-01) |
| 28 | Shell vertices inside envelope **0** (`:226`, `:699`) | **0** | Raw shell parse, point-in-polygon + Z 370.0–417.2. | ✅ |
| 29 | Lowest shell vertex above cover top over footprint **none** (`:227`, `:707`) | **None** (no shell vertex with Z > 417.2 inside the planform) | Raw shell parse. | ✅ |
| 30 | Body envelope **18.0 mm** above Y-bridge top 352.0 (`:710`) | **18.046 mm** above 351.954 | 370−351.954. | ✅ (rounded) |
| 31 | **5.172 mm above cold pipe top (364.83)** (`:175`, `:710`, D-046 `:563`) | Under-footprint top **364.828** (5.172); group max **369.078** at (348.544, −140.375) **outside** the planform; 0.922 mm vertical gap to the group max | Raw shell parse. | ⚠️ true only for the under-footprint vertex; "top" is false (QA-05) |
| 32 | **4.0 mm below nearest overhead shell vertex (421.15)** (`:176`) | **No overhead shell vertex over the footprint**; the 421.152 vertex is `turbo` at (−141.79, −39.46), outside the planform | Raw shell parse. | ❌ (QA-06) |
| 33 | Rear edge **8.5 mm** forward of resonator max X 236.5 (`:167`, `:222`) | **8.454 mm** forward of max X **236.546**; listed 8.793 mm is a different vertex | 245−236.546; the 8.793 is the (236.21, 22.3, 387.11) vertex. | ⚠️ rounded (QA-19) |
| 34 | Rear marker **260.0** vs measured vertex (260.69, 0, 333.36), **0.69 mm** (`:181`, `:209`) | Nearest vertex **260.690, 0, 333.356**; distance **0.6916 mm** | Raw shell parse. | ✅ within 0.5; rounded label (QA-18) |
| 35 | Clamp marker **372.0, −95.4, 353.4** vs measured cold-pipe top `(372.0, −95.4, 353.37)` (`:182`, `:209`) | Nearest vertex **371.634, −95.400, 353.367**; distance **0.3672 mm** | Raw shell parse. | ⚠️ rounded "measured" (QA-18) |
| 36 | V2 centerline **64.567 mm**; surface **6.567 mm** at r=58; **13.767 mm** at r=50.8 (`:729-734`) | **64.5668**; **6.5668**; **13.7668** | 4,001-point sampling of each of the 8 polyline segments from the frozen P0…P8; min at segment 3, t=0.5145, (285.582, −154.665, 459.421). | ✅ |
| 37 | Lettering **45 prisms**, **540 triangles**, cap **600** (`:86-87`, `:719-721`) | **45; 540; 600** | 9+18+18 = 45; 45×12 = 540. Asset unbuilt. | ✅ arithmetic |
| 38 | Body height **47.2**; letter top **418.0**; rear tower **36.6**; clamp leg **16.6** (`:178-184`) | **47.2**; **418.0**; **36.6**; **16.6** | 417.2−370.0; 417.2+0.8; 370.0−333.4; 370.0−353.4. | ✅ |
| 39 | Envelope **X 245…400, Y −120…120, Z 333.4…418** (`:170`, `:758`) | Same by definition of P1–P6, boss bottom 333.4, letter top 418.0 | Planform + markers + lettering. | ✅ definitions |
| 40 | Bundle **821.12 kB / 219.67 kB gzip** (`:655`) | **821,124 B** raw; Vite reports **219.67 kB** gzip (`gzip -9` alone gives 217.51 kB; Vite's report is the cited convention) | `npm run build` at `e22d2b0`. | ✅ (Vite convention) |
| 41 | Test suite **95 tests at M11** (`:481`) | **95 / 95 passing, 20 files**; `npm run typecheck` passes | `npm test`, `npm run typecheck` on `e22d2b0`. | ✅ |
| 42 | `git grep 21994000` finds **only** the legacy viewer (`:112`) | Finds `README.md:10`, `assets-src/PROVENANCE.md:69`, `docs/M10-EXTERIOR.md:159`, `docs/OPEN_ITEMS.md:20`, `docs/research/M10-exterior-accuracy-survey.md:314`, plus the M12 package | `git grep -n 21994000`. | ❌ (QA-08) |
| 43 | V1/V3/V4 separations **195.2 / 355 / 310 mm** (`:361-364`) | Actual variant bounds: turbo max X 47.12 → **197.88**; exhaust max X −113.80 → **358.80**; intercooler min Y 472.68 → **352.68** | M8-MEASUREMENTS variant bounds. Spec values use the shell/envelope bounds (49.8 / −110 / 430). | ⚠️ conservative but mislabelled (QA-09) |
| 44 | p95 current **16.8 / 16.8 ms** (`:434`) | Desktop 16.8; phone **17.0** in M11 §3.2 (M11 §3.3 rounds to 16.8) | M11-MEASUREMENTS §3.2/§3.3. | ⚠️ ambiguous (QA-22) |

---

## 3. Code / interface audit (grep, not assumptions)

Checked against the shipped code at `e22d2b0`:

| Check | Result |
| --- | --- |
| `src/renderer/variantLoader.ts` returns `LoadedVariantScene` with `group/geometries/materials/triangles` and wraps once (`wrapInPartLocalFrame`, +90° X) | ✅ Spec's reuse claim is correct. The returned wrapper is named `variant_scene_group`; the asset's own root node can still be `intake_cover_lly`, but the spec/test wording "one root Group `intake_cover_lly`" should be read as the GLB root, not the runtime wrapper. |
| `prepareCapSource` accepts `object3D` Group, caches child meshes, `skipWhenGhosted` gate at `sectionCaps.ts:1906-1911` | ✅ Correct. |
| `EngineRenderStats` fields are additive; `EngineSceneController`/`EngineUiOptions`/`EngineUiHandle` can gain methods/fields without core changes | ✅ Correct. |
| `setSectionState` applies `clippingPlanes` to every `clippableMaterials` member; `registerClippableMaterial` also sets the active plane at load | ✅ Correct. |
| `syncExteriorShellState` early-returns when `!exteriorShell` and uses a one-shot `exteriorMaterialsGhosted` boolean | ⚠️ The early-run instruction in `:285` is correct; the load-order ghosting gap in QA-02 is not addressed. |
| `renderer.render(` occurs once in `src/renderer`; no `new THREE.WebGLRenderTarget(`, `stencil: true`, `setRenderTarget`, `overrideMaterial` | ✅ Test 7's source-text premises are true today. |
| `viewLayout.ts` has 23 anchors (15 part + 8 cylinder); `isLabelVisibleUnderViewRules` at `:405-434` | ✅ Correct. |
| `referenceFrames.ts` has exactly RF-1…RF-17; `ReferenceFrameDef.exterior` is required; `sectionMode`/`sectionPositionMm` optional | ✅ New optional `intakeCover` field is compatible. |
| `engineControls.ts` currently has a two-checkbox `.m4-toggles-row` (X-Ray, Labels) and `exteriorCheckbox.checked = false` | ✅ Adding a third checkbox is compatible; the spec's "third checkbox" wording is accurate. |
| `main.ts` benchmark gate at `:289-300` and `?rf` application at `:183-206` | ✅ The described seams exist; the cover flag must be added to both. |
| `docs/M10-MEASUREMENTS.md` shell bounds are at line **21**, not **19**; `engineScene.ts` renderer is at **395-399**, not **377-381** | ⚠️ Citation nits (QA-17). |
| `git grep 21994000` | ❌ Not "only the legacy viewer" (QA-08). |
| `README.md`/`assets-src/PROVENANCE.md`/`docs/M10-EXTERIOR.md` still describe the cover as excluded | ⚠️ Stale context (QA-23); the new docs should state that D-041 excludes it from the M10 shell but M12 ships a separate add-on. |
| `src/core/interfaces.ts`, `src/perf`, `catalog`, `src/renderer/variantLoader.ts`, `partVariants.ts`, `sectionCaps.ts`, `viewLayout.ts`, `exteriorLoader.ts` | ✅ The spec's frozen list is consistent with the code; the only new imports are into the new module/renderer/UI seams. |

**Interface-shape detail:** the spec's `INTAKE_COVER_MARKERS` "name/position/normal" records and test 2's "their normals are (0,0,1)" are not matched to a concrete encoding. Empty glTF nodes have no normal; the M8 tests only check translations (and marker emptiness), not normals. If the build encodes the normal as a node rotation, test 2 must read the rotation; if it relies on the default +Z, the test should say so. This is covered by QA-18 and the marker-encoding note as a minor gap.

---

## 4. Contradictions and paperwork audit

### 4.1 Internal contradictions

1. **`§3` vs `§4.2`/`§15.4` on the cold-pipe top:** §3 says `Z 146.9…369.1`; §4.2/§15.4/D-046 say `top (364.83)`. The group max is 369.078 (outside the planform; QA-05).
2. **`§4.2` vs `§4.5` on overhead shell:** §4.2 claims a 4.0 mm clearance to the "nearest overhead shell vertex (421.15)"; §4.5 says no shell vertices above 417.2 inside the planform (QA-06).
3. **`§4.5`/`§15.4` "all other groups ≥ 67.07"** is false (QA-01).
4. **Header/§1 "measured" vs §7.3/§15.3 "cap"** (QA-04).
5. **"Planned 1,740" vs "body ≤ 1,200"** (QA-16).
6. **§6.6 "measured clearance" vs §15.6 "planning computation"** for V2; the V1/V3/V4 rows are envelope separations (QA-09).
7. **§8.1/RF-19 open cavity vs the shared M11 checklist "no dark cavity along the cut"** (QA-13).

### 4.2 Spec vs survey

1. **Form orientation/notch:** survey wide rear / narrow front / front-corner notch; spec wide front / narrow rear / rear-right relief (QA-03).
2. **Front clamp:** survey says separate included part and not visible in the top photos; spec merges it as a body leg (QA-14).
3. **Torque:** survey says "NOT PUBLISHED"; the repo's M10 survey records a GM 6 N·m clamp torque (QA-07).
4. **Legend:** survey and spec agree (`6.6`/`TURBO`/`DIESEL`; no `DURAMAX`); the photos and EPC image support this. **No finding.**
5. **Fitment:** survey flags the 2004–2006 LLY EPC vs the 2005–2007 eBay LBZ title; spec follows the EPC and records the conflict. **No finding.**

### 4.3 Spec vs PLAN.md / DECISIONS.md / OPEN_ITEMS.md

- **D-046 numbering is correct.** `docs/DECISIONS.md` currently ends at D-045; the spec's D-046 is the next free number. The date heading `2026-11-15 — Milestone 12 spec` follows the existing date-block style.
- **The anti-drift paperwork is present and in the right place.** The spec drafts the PLAN block, DECISIONS entry, OPEN_ITEMS edits, ASSET_CONTRACT section and THREE_API_NOTES section as build deliverables; it does not edit those files on the planning branch. This matches PLANNING.md step 3 and the M10/M11 pattern.
- **PLAN block:** the new M12 block and the "After 12" replacement line are consistent with the current `docs/PLAN.md:77` (the cover is removed from candidates, the other candidates and D-045 remain). The exit line's "all five M8 visual variants remain compatible with measured clearance" overstates the V1/V3/V4 envelope checks (QA-09) and should say "measured shell/V2 + conservative V1/V3/V4 envelope separations".
- **OPEN_ITEMS:** removing the deferred cover item and adding five watch items is consistent; the torque bullet should distinguish the rear bolt from the clamp (QA-07), and the dims bullet should say the planform is a clearance-driven placeholder, not form-matched (QA-03).
- **DECISIONS D-046:** the budget/headroom arithmetic is correct; the "cold charge pipe top 364.83" phrase is wrong (QA-05); "all five M8 visual variants remain compatible" should mirror the variant-clearance wording (QA-09).
- **PROVENANCE:** the spec says "no existing row changes", but `assets-src/PROVENANCE.md:69` still says the cover is excluded by D-041; the new row should clarify the shell-vs-add-on distinction (QA-23).

**No numbering conflict or anti-drift breach was found.** The blockers are technical/honesty defects, not paperwork-order defects.

---

## 5. Test audit — failure caught, can it fail, and coverage gaps

The spec's 12 numbered tests are well chosen in outline; the gaps are in what they do **not** assert and in the absence of a runtime test for the ghosting seam.

| # | Test (spec §9) | Failure it catches | Can it fail? | QA note |
| --- | --- | --- | --- | --- |
| 1 | Asset contract | Missing/renamed asset, texture/decal, budget overrun, wrong material count, stray vertex | Yes | GLB parse; does not exercise the `loadVariantScene` wrapper name. |
| 2 | Markers and deck | Misplaced mount, float/sink into the Y-bridge, wrong lettering pad height | Yes | "Under a 15 mm pad" is undefined; the marker normals encoding is unspecified. |
| 3 | Shell clearance audit | Clipping the six named groups; a shell edit invalidating placement | Yes | **Does not test `electronics`; does not test "all other groups";** the spec's own table is false as written (QA-01). |
| 4 | V2 high-flow clearance | Cover/V2 route change causing interpenetration | Yes | Thresholds 6.0 / 13.0; computed from frozen control points; good. |
| 5 | Visibility/explode | Default-on, floating cover with Exterior off, explode drift/NaN | Yes | Good. |
| 6 | Lettering and wording | Fabricated `DURAMAX`, missing glyph/line, stroke drift, decal fallback | Yes | Requires the 45-component/540-triangle construction; good. |
| 7 | Cap source registration (source-text) | Cover visible but never capped, cap survives X-Ray, builder adds an extra pass | Yes (source text) | **Cannot catch the QA-02 load-order ghosting race.** Source-text tests can pass while the runtime path is wrong. |
| 8 | Budget guard (edit `partVariants.test.ts` test 9) | Cover cap increase breaching phone budget; budget test silently ignoring the asset | Yes | Formula reproduces 317,368. |
| 9 | UI text (edit `uiText.test.ts`) | Default-on checkbox, wrong/missing label, subtitle drift | Yes (source text) | `exteriorCheckbox.checked = false` is pre-existing; the test should assert the **new** checkbox's nearby literal, not just its presence somewhere. |
| 10 | Reference frames (edit `referenceFrames.test.ts`) | `?rf=` silently falling back, wrong section/explode, stock frame cover-on | Yes | Good; add RF-19 to the shared `REFERENCE_FRAMES.md` checklist (QA-13). |
| 11 | Watertight body | Open shell → chord-closed cap; non-manifold → dropped loops | Yes (boundary edges) | The "total connected body components are ≥ 1 and finite" clause is tautological and cannot fail (QA-24). |
| 12 | Frozen-asset identity | Builder edits the shell/variant to make the cover fit; catalog slot added | Yes | Hard-coded SHA-256; good. |

### 5.1 Tests that cannot fail

- **Test 11, component-count clause:** "the total connected body components are ≥ 1 and finite" is true for any non-empty mesh. The 0-boundary-edge check is the real test.
- **Test 7 and test 9 are source-text only.** They can fail on a missing literal, but they cannot prove the runtime behaviour. Test 7 in particular passes the exact scenario QA-02 describes.

### 5.2 Acceptance criteria Buckley could not execute from a fresh clone

- **Acceptance 7 (pixel invariance):** no committed capture/diff tool or command; the repo has only `tools/generateDimensions.ts`. The spec relies on the build's `docs/M12-MEASUREMENTS.md` to record a local script, but that is not a fresh-clone-executable criterion (QA-10).
- **Acceptance 5 (benchmark matrix):** executable only on the reference GPU/browser; the spec says this explicitly. That is acceptable if the environment is available, but the QA session could not re-run it (no headless WebGL browser here).
- **Acceptance 6/8 (visual/interaction):** manual; executable by a human with a browser, but not automated. The spec should say "manual visual gate" explicitly rather than implying a machine check.

### 5.3 Claims with no test and no acceptance step

- **Cover section cap ≤ 300 triangles** (QA-11).
- **`electronics` clearance / "all other groups"** (QA-01).
- **X-Ray ghosting load-order** (QA-02).
- **Asset byte/page-weight** (QA-12).
- **On-screen illustrative scope for the cover's planform/dimensions** (QA-15).
- **"All five M8 visual variants measured clearance"**: the V2 is computed; V1/V3/V4 are envelope separations (QA-09).
- **Clamp-as-integrated-leg simplification** (QA-14).
- **The `-0` / `0` exactness of the explode at e=0** is tested by test 5; fine.
- **The cover's two materials join `clippableMaterials`** is only source-text in test 7; the Section interaction is acceptance 8, manual. Acceptable but weak.

---

## 6. Research audit — sources sampled

The survey's load-bearing sources were sampled directly on 2026-11-15.

| Source | What was checked | Result |
| --- | --- | --- |
| [GM EPC group TC00-668](https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178) | `21994000 COVER, UPR INT MANIF (INCLS 3)`, `CK2, 3 (LLY)`, `2004-2006`, qty 01; item 001 bolt `11588339 M8X1.25X113.7`; item 003 `CLAMP, CHRG AIR CLR OTLT DUCT (PART OF 2)` | ✅ Page fetched; the survey's identity/fitment/retention claims are supported. The bolt listing is 2004-2007; the cover application is 2004-2006. |
| [GM EPC line drawing p013890.jpg](https://gmsklad.ru/gmcat/pics/cadillac/p013890.jpg) | Exists, 423×600, exploded cover over the intake/charge-air duct; raised diamond field and a stacked legend visible | ✅ Image fetched and inspected. The legend is small at this resolution; the used-parts photographs carry the wording evidence more clearly. The survey says "legible in both"; the drawing is at least consistent with a three-line legend. |
| [Diesel Specialty Parts listing](https://dieselspecialtyparts.com/2006-gmc-chevrolet-3500-lly-66-diesel-engine-oe-intake-resonator-cover-21994000) and image IDs 56802309–56802315 | Seven photographs exist; top/underside/three-quarter views; `6.6` / `TURBO` / `DIESEL`; matte black; raised diamond field; wide rounded rear; narrower/relieved front; a notch at one front corner; a rear/centre bolt tab; open underside | ✅ All seven images fetched. The legend and form claims are supported; the **form orientation contradicts the spec's planform** (QA-03). The front clamp is not visible in the top photos, as the survey says (QA-14). |
| [eBay listing title](https://www.ebay.com.au/itm/134869344856) | "05-07 DURAMAX … Part# 21994000 OEM LBZ" | ⚠️ The eBay page returned an empty/blocked body in this QA session; the title is taken from the survey's record. It is grade D and used only as a **conflict flag**, not a design fact; the spec follows the grade-A EPC. No finding. |
| `docs/research/M10-exterior-accuracy-survey.md:142` | GM service snippet: cover clamp at the resonator, **6 N·m (53 lb·in)**, grade A, ADOPTED | ✅ The prior project record is real; the M12 survey's "torque NOT PUBLISHED / no service procedure" is too broad (QA-07). |
| `public/legacy/index.html:225` | "Molded black grained ABS Helmholtz resonator … raised diamond-plate pads and embossed '6.6 TURBO DIESEL' badge" | ✅ Legacy-only, correctly recorded as grade D/not adopted. |
| `docs/M10-MEASUREMENTS.md:59` / `docs/M11-MEASUREMENTS.md` | Shell SHA-256, 37,100 tris, 22 groups, 92 partIds, preserved subtree counts | ✅ Parsed shell reproduces 37,100 tris, 22 groups, 36,233 vertices; the preserved counts 3,400/800/2,300 reproduce. |

**Honesty check:**

- **Placeholders:** dimensions, 2.5 mm wall, 47.2 mm body height, 0.8 mm relief, letter metrics, texture pitch, polymer and marker positions are all labelled placeholders or design choices. ✅
- **No invented measurements:** the 6.567 mm V2 result is a re-runnable computation from frozen control points; the six shell clearances are vertex-level computations from the frozen GLB. The only **invented** claims are the "measured" cover cost (QA-04), the "cold-pipe top 364.83" (QA-05) and the "nearest overhead 421.15" (QA-06), which are wording/provenance errors, not fabricated dimensions.
- **Single weak source carrying a design decision:** none of the load-bearing dimensions comes from a single weak source. The planform's **form** is the weak point: it is a visual read (grade A/D) and the spec's orientation is the opposite of the survey's description (QA-03). The fitment follows the grade-A EPC, not the grade-D eBay title; good. The clamp torque is a grade-A prior record that the survey dropped (QA-07); the spec must not say "not published" without qualification.

---

## 7. What reproduces (so the revision does not redo it)

- **Scene totals:** 308,324 stock / 304,632 worst, from the 10 internal GLBs + main shaft + ground + 37,100 shell and the exact variant deltas. ✅
- **D-033 arithmetic:** every stock/worst, desktop/phone headroom, utilisation, submitted-triangle, draw-call and VRAM row. ✅
- **Cap-guard:** 317,368 / 2,632 phone / 42,632 desktop. ✅
- **V2 clearance:** 64.567 centerline / 6.567 at r=58 / 13.767 at r=50.8. ✅
- **All six named shell clearances:** 5.172 / 8.084 / 8.246 / 8.793 / 18.046 / 48.049. ✅ (plus the omitted `electronics` 25.908; QA-01).
- **0 shell vertices inside the envelope** and **no shell vertex above 417.2 inside the planform**. ✅
- **95/95 tests, typecheck, build.** ✅
- **D-046 numbering and anti-drift placement.** ✅

---

## 8. Disposition summary for the revision run

**Counts:** 3 blockers, 12 should-fix, 9 nits (24 total).

**Must fix before approval (blockers):**

1. **QA-01** — add `electronics` (25.908 mm) to the clearance table, test 3 and acceptance 4; remove the false "all other ≥ 67.07".
2. **QA-02** — close the X-Ray load-order ghosting race; add a runtime/load-order check.
3. **QA-03** — re-orient/re-notch the planform to the survey form, **or** relabel it as a clearance-driven deviation and record the form conflict in §15.7 / `docs/M12-COVER.md`.

**Should-fix (revision):** QA-04 (measured vs capped cover cost), QA-05 (cold-pipe group max 369.078), QA-06 (no overhead vertex), QA-07 (6 N·m clamp torque), QA-08 (`git grep`), QA-09 (V1/V3/V4 envelope separations), QA-10 (pixel-diff tool), QA-11 (cover cap ≤ 300), QA-12 (asset byte/page-weight), QA-13 (REFERENCE_FRAMES shared checklist / RF-19 open cavity), QA-14 (clamp-as-leg simplification), QA-15 (on-screen illustrative scope).

**Nits:** QA-16…QA-24 (planned-vs-cap total, two line refs, rounded markers, resonator rounding, cavity wording, `intakeCoverMaterials` type, p95 baseline, stale PROVENANCE row, tautological component count).

**Re-QA rule:** per `docs/PLANNING.md` step 5, one more independent QA pass is required if any blocker existed. This review found three.

---

## Appendix A — Commands and evidence used

```bash
# Repo / branch state
git status
git branch --show-current            # plan/m12-intake-cover
git rev-parse main                    # e22d2b0

# Shipped-suite gates (all pass on e22d2b0)
npm run typecheck                     # tsc --noEmit, 0 errors
npm test -- --reporter=dot            # 20 files, 95/95 tests
npm run build                         # dist/assets/index-zHhTPqQm.js 821.12 kB / 219.67 kB gzip

# Scene arithmetic (parsed all 10 internal GLBs + shell + 5 variants)
#   internal instanced total = 270,080
#   main shaft 1,080; ground 64; shell 37,100
#   stock = 308,324; worst = 304,632
#   variant caps: 3,600 + 2,600 + 2,800 + 1,800 = 10,800; shipped 3,204+2,560+2,436+1,520 = 9,720
#   piston delta = 8 × (4,832 − 3,968) = 6,912

# Shell clearance audit (same transform as src/renderer/shellAssets.test.ts)
#   p_mm = (1000*g_x, -1000*g_z, 1000*g_y)
#   body envelope = P1..P6 polygon, Z 370.0..417.2
#   min per group: chargePipeCold 5.172; alternator 8.084; acComp 8.246;
#                  resonator 8.793; intakeBridge 18.046; intake 48.049;
#                  electronics 25.908; cp3Fuel 67.070
#   inside count 0; no shell vertex above 417.2 inside the planform
#   chargePipeCold group max Z 369.078 at (348.544, -140.375) -- outside the planform

# V2 clearance: 4,001 samples per polyline segment, P0..P8 from
# assets-src/variant_dimensions.json; min 64.5668 mm at segment 3, t=0.5145,
# (285.582, -154.665, 459.421); surface 6.5668 (r=58) / 13.7668 (r=50.8)

# Source grep
git grep -n "21994000"
git grep -n "renderer.render(" src/renderer
git grep -n "WebGLRenderTarget\|stencil: true\|setRenderTarget\|overrideMaterial" src/renderer

# External sources (sampled 2026-11-15)
#   GM EPC TC00-668: 21994000, CK2/3 (LLY), 2004-2006; item 003 clamp; item 001 11588339
#   GM EPC p013890.jpg: 423x600 line drawing; cover/legend consistent
#   Diesel Specialty Parts 56802309..56802315: seven photos; legend + form
#   eBay 134869344856: blocked/empty in this session; used only as the survey's
#     recorded grade-D fitment conflict, not as a design fact
```

**No spec or survey edits were made in this run.**
