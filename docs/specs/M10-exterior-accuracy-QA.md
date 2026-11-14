# Milestone 10 Planning QA Record — Exterior Accuracy

Repo: `colinstephens93/CarbonDuramax` · Planning branch: `plan/m10-exterior-accuracy` · Spec under review: [`docs/specs/M10-exterior-accuracy.md`](./M10-exterior-accuracy.md) · Survey under review: [`docs/research/M10-exterior-accuracy-survey.md`](../research/M10-exterior-accuracy-survey.md) · Reviewer: an **independent agent session** (not the drafting context), per [`docs/PLANNING.md`](../PLANNING.md) step 4 and **D-037**.

This record is the QA provenance Buckley's audit starts from: the findings as raised, what changed because of them, and the one finding that was **rejected with a reason**. The reviewer wrote no files and did not see the drafting conversation; its findings were applied by the planning agent, and every disposition below was re-verified against the revised documents and the code.

---

## 1. Scope and method

| Item | Detail |
| --- | --- |
| Reviewer | Separate agent, fresh context, given only the repo path and the task ("try to break these documents") |
| Documents supplied | the spec and the survey (3rd artefact, this record, deliberately absent) |
| Snapshot reviewed | spec SHA-256 `5c9973c1a1be77c1d70ce9fdyae9a93f46c8547a1aea8706a561742aef16b0a9a` (81,638 B), survey `5249b9f353ff13b2e79677c9a1f23bd4674bb49dca251f1c6fbdfd674cbaf955` (82,419 B) — i.e. the **pre-revision** drafts |
| Method | (1) independent recomputation of every number in the spec's §15; (2) code audit by grep/parse, not assumption; (3) contradiction and untestable-claim hunt; (4) plan/decision compliance; (5) feasibility sanity where provable |
| Tools used by the reviewer | GLB binary parsing, `src/**` reads, `docs/M0–M9` reads, arithmetic |
| Findings raised | **30** — 11 blocker, 13 should-fix, 5 nit, 1 process |
| Disposition after revision | **29 fixed**, **1 partially rejected** (F-09 sub-item), 0 outstanding blockers |

---

## 2. Verdict and what it changed

The reviewer's verdict on the draft was *"not safe to hand to the product owner yet"*: the arithmetic was largely clean (the 31,396 / 33 / 6.500 MiB / tier-table / cap-guard / VRAM / caption / test-count numbers all reproduced), but three load-bearing claims were false or unbuildable:

1. **The front-drive correction was derived from a "snout disc" that does not exist.** The real internal geometry is a front pulley/damper disc at `X 466…476`, outer radius **57 mm**, with the snout ending at `X 478` (`src/renderer/engineScene.ts:298–323`); the draft had invented `X 478…506, centre 492, radius 32.4` from a stale RF-5 note. Everything downstream (the stack table, the label anchor, the correction distance, the acceptance numbers) inherited the error.
2. **"Identity registration + `export_yup=True`" is a 90° misorientation.** `exteriorLoader` applies only the registration basis, so a literal identity basis would leave the model in glTF Y-up space. The draft could not be built as written.
3. **The `build_variants.py` re-run proof was invalid.** The script hard-codes the old `0.430` shell registration and collects only the twelve old group names as obstacles, so it cannot read a project-frame shell and would ignore all ten new groups.

Two more false claims about shipped code were corrected (the repo's Blender export path does **not** write `extras.partId`; `src/ui/engineControls.test.ts` does **not** exist), a wrong arithmetic result was fixed (the cap-guard headroom reduction is **7,560**, not 1,932), and the gap-analysis summary was recounted so it agrees with its own table.

The revised package is **safe to hand to the product owner**: every blocker is closed, the numbers in §15 now reproduce from the code and asset, and the three claims that could not survive a build have been replaced with mechanisms that can (a measured internal geometry, a working Y-up basis, an assertion-side script edit whose byte-identical outputs prove it stayed on the assertion side).

---

## 3. Findings and dispositions

Severity: **B** blocker, **S** should-fix, **N** nit, **P** process.

| ID | Sev. | Finding (as raised) | Disposition |
| --- | :---: | --- | --- |
| **F-01** | B | Front-drive correction derived from a non-existent internal "snout disc" (`478…506`, centre 492, r 32.4). Actual: disc `X 466…476`, centre 471, **outer r 57**, shaft end 478 (`engineScene.ts:298–323`). §4 parts 2 and 15 still said `524…544` / `544…569`. | **FIXED.** §5.4(a), §6.4, §15.6 and the §4 rows re-derived from the measured geometry: cover plate 460…472, **damper ring 464…492** (encloses the disc with ≥ 3 mm radial clearance), belt 472…492, fan clutch 530…570, fan 570…615, `X_max ≤ 700`; label anchor `[478, 0, 0]`; correction **282.6 mm**. The build must assert the radial clearance. |
| **F-02** | B | "Identity registration" with `export_yup=True` lays the engine on its side; the M8 class uses a `+90° X` conversion, and the shell path has no wrapper. | **FIXED.** The registration is now a *degenerate similarity* with the **Y-up basis `[[1,0,0],[0,0,1],[0,−1,0]]`** (`p_proj = (g_x, −g_z, g_y)`, det = +1), scale 1, translation 0, with an explicit paragraph in §5.1 explaining why a literal identity basis is wrong; D-042, §6.5, §9 test 10 and the handoff updated. Option B (`export_yup=False` + true identity) is documented and rejected against the asset contract's "conversion once at export" rule. |
| **F-03** | B | `build_variants.py` "executed unchanged" cannot work: hard-coded `0.430` shell registration and only the 12 old obstacle groups. | **FIXED.** §5.6 item 4 now specifies a **bounded, assertion-side edit** (Y-up shell read + 22 `SHELL_GROUP_NAMES`), requires the five output GLBs to stay **byte-identical** as the proof the edit stayed on the assertion side, and adds `build_variants.py` to the changed-files list and the handoff. |
| **F-04** | B | "The export path already writes `extras.partId`" is false — no `export_extras`/custom properties in `build_cylinder1.py`/`build_variants.py`; the current shell's `extras` came from the owner's `THREE.GLTFExporter`. | **FIXED.** §5.3 item 4 now states the fact and requires `build_shell.py` to set **`export_extras=True`** and write `obj["partId"]` per mesh; §9 test 2 reads and validates `extras.partId`. |
| **F-05** | B | RF-11…13 require `src/ui/referenceFrames.ts` **and** `src/ui/referenceFrames.test.ts` (which pins the RF-1…RF-10 key list); neither was in the changed list and the frozen rule forbade the test edit. | **FIXED.** Both files added to §14 **Changed**, §9 gains test 12 (expected id list + per-frame validation), §13.2/§13.6 reconciled, §12.4 updated, handoff step 7 updated. |
| **F-06** | B | "The twelve names keep their relative order; ten new names appended" contradicts the asset's root order. | **FIXED.** §5.3 item 1 now states the twelve keep their **names and meaning**, the ten new names are appended after them, and **node order is not load-bearing** (`exteriorLoader` resolves by name) — so the append rule exists only for diff readability. |
| **F-07** | B | Cap-guard headroom reduction is `11,992 − 3,532 = 8,460`, not **1,932**. | **FIXED.** §7.3 now says **7,560** (recomputed after the budget moved to 37,100: `11,992 − 4,432`). |
| **F-08** | B | §4 "Summary of the gap" counts sum to 23 and match neither the table nor its own parenthetical. | **FIXED.** Recounted from the table: **9 missing, 8 wrong shape, 5 wrongly positioned (3 of them also shape faults), 1 residual row** = 22 families + residual; "nothing is both present and right except gross arrangement". |
| **F-09** | B | Unsourced numbers presented as survey-derived: "18 M8 intake bolts + 8 studs"; "oil fill left of the fan-shroud centreline"; downpipe 88.9 mm not labelled illustrative; a "published relationship" for the front-drive stack that is a generic assumption; valve-cover bolt counts understated. | **PARTLY FIXED, ONE SUB-ITEM REJECTED.** Fixed: the **downpipe** is now labelled *illustrative* in §4 part 9; the valve-cover set is corrected to **24 + 8 + 24 = 56 bolt heads + 28 insulators** (survey §4); "published relationship" is gone from §5.4 (the stack is now derived from measured internal geometry); the survey's §14 gained the **fan-shroud centreline** layout bullet that the claim rests on. **Rejected:** "18 M8 intake bolts + 8 studs is nowhere in the survey" — the survey §7 table carries exactly `94010881 BOLT … qty 18`, `94013084 STUD … qty 4`, `94340628 STUD … qty 4`; the reviewer missed the row. |
| **F-10** | B | Test-7 replacement literal `"37,700 ± cap"` is not a literal; §13.5's 309,224 is unreachable under a per-group rule maxing at 37,700; `layout.test.ts` test 7 passes unchanged and asserts no scale/basis/translation, so it cannot catch a rescale. | **FIXED.** The package now has **one** normative shell number, **37,100** (per-group tables sum to it exactly, no separate cap). §9 test 8 says the literal is *the build's measured total* (≤ 37,100); §13.5 quotes 308,324; §9 test 10 **adds explicit `uniformScale`/basis/`translationM` assertions**. |
| **F-11** | B | Per-group budget contract untestable: `electronics` had no budget, `turbo` no row total, `ext_fasteners` a shared pool outside the sum, `ext_vc_fasteners` also in `valveCovers` (double counting). | **FIXED.** §5.2 rewritten: every group (including `electronics` at 400) has a row; `turbo` has a **5,300** row total (1,100 + 800 + 3,400); **fasteners live inside the group that carries them** (no shared pool); redistribution is a spec revision, not a builder choice. Sum = **37,100**. |
| **F-12** | S | Datum tolerance stated as ±0.5 mm in §6.1 but 1.0 mm in §9/§13/D-041; "four mating radii" where there are five markers / three distinct values. | **FIXED.** **1.0 mm** everywhere (normals ±0.5°); five markers, five radii, **three distinct values (44 / 52 / 48)**. |
| **F-13** | S | Front-drive clearance rule (≥ 4 mm radial) contradicts the containment rule (≥ 8 mm, 2 mm at the deck land). | **FIXED.** §5.6 item 3 now names **three documented exceptions** with their own numbers: deck/head land **2 mm**, crank-snout zone **≥ 3 mm radial / ≥ 2 mm axial**, pan/floor **≥ 21.4 mm**. |
| **F-14** | S | "Front cover absent" is wrong: `blockPan` has a 12-triangle box at `X 518.1…578.3`, a cover-like placeholder at the old plane. | **FIXED.** §4 part 2 reclassified **X + S** with its measured bbox; the summary recount accounts for it. |
| **F-15** | S | The harmonic-balancer test compared the anchor to a value the builder itself writes (`shell_dimensions.json`) — a wrong anchor plus a matching JSON would pass. | **FIXED.** §9 test 11 compares the anchor to the **GLB's `ext_damper` bbox centre** (≤ 1.0 mm) and to the part group's bbox, never to the authored JSON. |
| **F-16** | S | New tests under-specified: no enumerable feature-id table, wildcards a test cannot expand, the material-signature test needs an algorithm and the preserved-mesh check, and the rim-vertex definition was missing. | **FIXED.** §9 tests 2, 5 and 6 now specify: the vocabulary is carried as **literal ids with wildcards expanded by hand**; the signature key is re-implemented over non-preserved meshes and asserted **≤ 24** with preserved meshes **≤ 13**; the rim is defined as vertices within 1.5 mm of the marker with ≤ 1.0 mm normal-direction spread, radial extent within **±1.0 mm** of the M8 radius. |
| **F-17** | S | "7 pulleys" followed by nine items. | **FIXED.** "**9 pulleys** (damper + five driven pulleys + tensioner + 2 idlers)" in §4 part 15, consistent with the RF-11 checklist. |
| **F-18** | S | Survey internally inconsistent after the earlier fix: 204 mm, 173 mm, disc `478…506`, and "the 7 datums lie inside the current solid" (false for the two service points at 17.83 mm / 31.39 mm). | **FIXED.** Survey §17.2 now quotes the measured disc (`466…476`, r 57); §17.4 states **five** contact datums inside the solid and gives the two service-point distances; §17.6 and §16 no longer quote a single conflated distance — the **282.6 mm displacement** of the damper/label and the **≤ 982 mm X-span bound** are separated. |
| **F-19** | S | Test-file accounting wrong (4 edited + 2 new), and the handoff's "edit the five named files" omitted adding `uiText.test.ts`. | **FIXED.** §9 preamble: "**4 edited + 2 new = 6 files touched**"; §13.2 and §16 item 5 aligned. |
| **F-20** | S | The 38,000 cap was unreachable under a per-group rule summing 37,700; the "contingency 300" was unallocated; the 12→13 preserved-mesh explanation blamed `turbo_unit` instead of `turbo_downpipe`. | **FIXED.** Single normative **37,100** (no contingency, no unreachable cap); §7.2 explains the 12→13 rise as **`turbo_downpipe` 1 → ≤ 2** (stainless pipe + heat-tinted shield band), `turbo_unit` staying ≤ 6 and `intake` ≤ 5. |
| **F-21** | S | "Overall X span = 982.1" is a cap-based bound, not the asset's span; the text conflated the 268.6 mm displacement with the span reduction. | **FIXED.** §15.6 now labels 982.1 as a **bound**, separates the **282.6 mm displacement** from the span, and says the actual max is set by the fan (≤ 615) or the intake tract (643.5 today); the survey says the same. |
| **F-22** | S | Frozen audit listed `src/config` twice and omitted `src/ui/referenceFrames*.ts` and `build_variants.py`; the "five files" rule conflicted with the required reference-frame test edit. | **FIXED.** Duplicate removed; `referenceFrames.ts`, `referenceFrames.test.ts` and `build_variants.py` added; the test rule now reads "no test file outside the six named in §9". |
| **F-23** | S | The new OPEN_ITEMS "LLY external envelope" item duplicates the existing watch item with different numbers. | **FIXED.** §12.3 now **replaces** the existing item, recording both published envelopes (34×33×37 in forum; 30×30×32 in vendor/LBZ) and the M10 position. |
| **F-24** | S | `docs/M8-VARIANTS.md` also pins the preserved triangles (2,056 / 560 / 5,740) and says a shell replacement "fails loudly" — a second staleness the spec did not record. | **FIXED.** §6.3 now records **two errata** (the `fan`/`beltDrive` name and the preserved-triangle counts), keeps the frozen doc as the M8 historical record, and points at the live constants and `docs/M10-EXTERIOR.md`. |
| **F-25** | N | "283 primitives / 234 meshes" reverses the terms: 234 meshes (one primitive each) instanced over 283 mesh nodes. | **FIXED** in §3. |
| **F-26** | N | A stale "204 mm" reference survived in §5.1. | **FIXED** (now ~283 mm, and §15.6 carries the arithmetic). |
| **F-27** | N | The erratum pointer said "§16", which does not mention it. | **FIXED** (points at §6.3/§11.1/§12.3). |
| **F-28** | N | The §2.5 "old → new" bullet dropped the `not verified LLY measurements` tail the real §10.1 string keeps. | **FIXED** — the bullet now shows the exact new ending. |
| **F-29** | N | "Fourteen not-published verdicts" and "the four the survey found were missing" were not reproducible. | **FIXED** — "**sixteen** not-published verdicts"; "the missing systems the survey found". |
| **F-30** | P | The package was uncommitted and the QA record absent. | **FIXED** — this record and the spec/survey/figures are committed together on `plan/m10-exterior-accuracy`. |

---

## 4. Independent recomputation (reviewer's values vs the revised spec)

| Quantity | Reviewed draft | Reviewer's independent value | Revised spec | Status |
| --- | --- | --- | --- | --- |
| Shell triangles | 31,396 | `302,620 − 271,224`; parsed GLB total | 31,396 | ✅ |
| Exterior draw calls | 33 = 21 + 12 | `106 − 73`; M8 split 6+1+5 | 33 | ✅ |
| Shell texture VRAM | 6.500 MiB | images 1024², 512×256, 256², 256×128 → 6.500002 MiB | 6.500 MiB | ✅ |
| Material slots → signatures | 99 → 22 | 99 materials, 22 distinct dicts | 99 → 22 | ✅ |
| Per-part sum | 37,700 | 37,700 (as then written) | **37,100** (rewritten table) | ✅ after fix |
| Tier arithmetic | 308,924 / 309,224 etc. | reproduced exactly | **308,324 / 579,484 / 11,676 / 91,676** | ✅ after fix |
| Phone submitted baseline | `302,272 − 31,048 + N` | `271,224 + N` | same method | ✅ |
| Cap-guard | 316,468 (headroom 3,532) | reproduced | **315,568 (headroom 4,432)** | ✅ after fix |
| Measured-variant worst | 305,532 (95.5 %) | reproduced | **304,632 (95.20 %)** | ✅ after fix |
| Headroom reduction vs M8 | 1,932 | **8,460** | **7,560** (`11,992 − 4,432`) | ✅ after fix |
| Draw calls / VRAM | 37; 110; 74; 20.75 / 4.75 | reproduced | same | ✅ |
| Phone scene headroom | 10,776 | `320,000 − 309,224` | **11,676 (3.65 %)** | ✅ after fix |
| Block plane / shaft end | 460 / 478 | `blockLengthMm = 4 × 115`; `+18` | 460 / 478 | ✅ |
| Internal damper disc | 478…506, centre 492, r 32.4 | **466…476, centre 471, r 57** | 466…476, r 57 | ✅ after fix |
| Front-drive correction | 268.6 mm | arithmetic right, reference point wrong | **282.6 mm** | ✅ after fix |
| §4 summary | 3 / 7 / 4 / 9 | sums to 23 | 9 / 8 / 5 / 1 | ✅ after fix |
| Datum nearest vertices | 5 contact ≈ 0; 2 service 17.83 / 31.39 | 0.028–0.052 mm; **17.828 / 31.394 mm** | same | ✅ |
| Shell asset | 1,973,652 B, SHA `42993c99…0896` | exact | same | ✅ |
| Group inventory (12 groups, per-group triangles) | as tabled | every value reproduced | same | ✅ |
| Preserved split | 2,056 / 560 / 5,740 | reproduced (turbo children 384/384/560/2,056) | 3,400 / 800 / 2,300 | ✅ |
| Existing test count | 81 | 81 `it(` across 17 files | 81 | ✅ |
| Labels | 23, 22 untouched | 15 + 8 = 23 | same | ✅ |
| Caption | §10.1 string | old string matches; new = one clause replaced (prefix 266 chars, suffix 32) | same | ✅ |
| M8 `fan`/`beltDrive` erratum | real | `M8-VARIANTS.md:167` lists `fan`; GLB has `beltDrive` | recorded | ✅ |
| 24-bucket ceiling | loader throws above 24 | `if (globalMergedCount > 24) throw` | unchanged | ✅ |
| `extras.partId` export path | "already writes it" | **no** `export_extras`/`partId` in either build script | corrected + required | ✅ after fix |

---

## 5. What this QA pass could not check

- **Shape.** No renderer or browser was used; the reviewers' judgements about *form* rest on the same description-only sources the survey cites. The frames defined in §8 are the human check, and they do not exist until the build.
- **The build itself.** The containment assertion, the 8-angle sweep, the reference-frame captures and the `?benchmark=1` rows are build-time evidence; the planning package specifies them and the acceptance criteria require them, but cannot produce them.
- **The EGR module's position.** The reviewer could not adjudicate the three-way source conflict (§ survey §19 item 1); the spec pins a position and isolates it, and it stays an open item.
- **The 18 % triangle growth in practice.** The per-group budgets are allocations, not measurements; whether a shaped valve cover fits in 3,400 triangles is the builder's problem to solve inside the budget (with a stop-and-report rule if it cannot).

---

## 6. Residual risks Buckley's audit should probe

1. **The front-drive numbers are now derived, but the offsets are illustrative.** The anchor (internal disc 466…476, r 57) is measured; the cover/belt/fan standoffs are not published. Check that §5.4 is read as "anchored, not verified".
2. **The phone scene-triangle margin is 3.65 %.** That is the arithmetic price of any larger shell (the frozen internal assembly is 84.8 % of the 320,000 budget). The spec states it and refuses to raise D-033; if the owner wants more exterior detail later, that is a decision, not a spec edit.
3. **The EGR module is one node group for a reason.** If the position is wrong, the repair is a re-position of `egrSystem`, not a rebuild — verify that the group really is self-contained in the asset test.
4. **The `build_variants.py` edit is the one place the milestone touches an M8 proof.** Byte-identical variant outputs are the guard; if any SHA changes, stop.
5. **Two documentation errata stay in a frozen doc.** They are recorded, not edited; an auditor should confirm the live values in `partVariants.ts` are the M10 ones and the M8 doc is untouched.
