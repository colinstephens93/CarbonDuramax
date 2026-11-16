# Milestone 12 Spec — Optional LLY Plastic Upper Intake Manifold Cover (GM 21994000)

Repo: `colinstephens93/CarbonDuramax` · Build branch: `m12-intake-cover` (create from `main` at `e22d2b0`) · Planning branch: `plan/m12-intake-cover` · Planning package: this spec + [`docs/research/M12-intake-cover-survey.md`](../research/M12-intake-cover-survey.md); the independent D-037 QA record (`docs/specs/M12-intake-cover-QA.md`) is produced by a separate agent after this draft · Plan reference: **new milestone, not in PLAN.md v2.2** — Milestone 12 is added by this spec's paperwork deliverables (§12), per the anti-drift rule, and discharges the M10 deferred-candidate line (`docs/PLAN.md:77`) and the OPEN_ITEMS cover item (`docs/OPEN_ITEMS.md:20`).

**What changes in one sentence:** the app gains GM `21994000` — the LLY's plastic upper intake manifold cover, the only lettered surface on the real engine — as an **optional, default-off cosmetic part** with its own `Intake cover` toggle over the existing Y-bridge, a project-frame scene-placed asset with the evidenced `6.6 TURBO DIESEL` legend as raised geometry, an explode lift, a section-cap source, X-Ray ghosting, and a budgeted **≤ 1,800 triangles / +2 draw calls / 0 texture bytes** cap against D-033 (the asset is not built yet; actuals are recorded at build).

**Coding is done by the user in Antigravity on branch `m12-intake-cover`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

---

## 1. What Milestone 12 is

Milestone 10 rebuilt the exterior shell as a project-frame, untextured, budget-capped model of the LLY's external hardware, but deliberately **excluded** the plastic upper intake manifold cover because it hides the Y-bridge M10 was required to show (`docs/specs/M10-exterior-accuracy.md:29,45`; D-041 at `docs/DECISIONS.md:86`). M10 also recorded that the only lettered surface on the engine is that cover, and that no other LLY casting carries a wordmark (`docs/specs/M10-exterior-accuracy.md:57-63`). The plan's post-M11 candidates line names the cover as the first cosmetic addition (`docs/PLAN.md:77`), and OPEN_ITEMS records the exact deferred item, including the unverified `6.6 turbo diesel` wording (`docs/OPEN_ITEMS.md:20`). This milestone lands it.

1. **An optional cosmetic part, not a default fixture.** The cover is added **off by default** with its own `Intake cover` checkbox in the Views group, independent of the existing `Exterior` checkbox. The stock scene, all 17 existing reference frames, and M10's Y-bridge proof are unchanged unless the user turns the cover on. §2.1 states the decision and the reasons.
2. **A new scene-placed cosmetic asset.** A project-frame GLB (`public/models/intake_cover_lly.glb`) authored in the master frame, loaded through the existing `loadVariantScene` wrapper, with two material-separated meshes (body + lettering), two `if_*` mounting markers, no pivot/animation, no textures and no new dependency. §2.2, §4.
3. **The cover's real lettering, not a fabricated wordmark.** The published evidence for `21994000` shows **`6.6` / `TURBO` / `DIESEL`** in three lines — the GM EPC line drawing and multiple used-parts photographs. The brief's "DURAMAX lettering" is **not** supported for this part number; `DURAMAX` appears in auction titles as the engine-family name. The spec models the evidenced legend as raised rectilinear stroke geometry, and records the conflict rather than silently fabricating a badge (§2.3, §15.7).
4. **A placement that clears the real M10 shell.** The planform is a labeled, **clearance-driven placeholder** sized to the measured shell — **not form-matched** to the GM EPC/photo form (the survey's form evidence is wide-rear/narrow-front with a front-corner notch; this planform is wide-front/narrow-rear with a rear-right relief, the deviation recorded in §15.7). It sits over the Y-bridge, is relieved at the rear-right for the intake plumbing and clears the resonator at its rear edge, and is checked against every shell group and the M8 `intake_highflow` tube. Measured minimum vertex clearance is **5.172 mm** (highest cold-charge-pipe vertex under the footprint); the V2 tube surface clears by **6.567 mm** using the conservative 58 mm coupler radius. §4.2, §15.4.
5. **A full interaction contract.** Explode (+Z 260 mm), M11 section caps (static `skipWhenGhosted` source), X-Ray (0.22 opacity ghost, caps suppressed), labels (no new anchor; 23 unchanged), and all five M8 visual variants (no compatibility rule needed: V2 is a computed surface clearance, V1/V3/V4 are conservative envelope separations). §6.
6. **A budget record with a cap, not a measured asset.** Using the conservative 1,800-triangle cover cap, stock scene 308,324 triangles → **310,124**; worst-case 304,632 → **306,432**; draw calls 96/58 → **98/60** stock and 97/60 → **99/62** worst; texture VRAM unchanged at 20.75/4.75 MiB. The build records the actual (cap-conservative total 1,740). All inside D-033 with the headroom printed in §7. §15.2–§15.3.
7. **Proof frames.** RF-18 (cover on, front three-quarter), RF-19 (cover section at X = 300 mm), RF-20 (cover exploded +Z 260 mm), each with a numbered checklist; RF-1…RF-17 stay visually unchanged with the cover off (manual comparison gate, §8.2). §8.

**Non-goals for M12:**

- **No catalog slot, no catalog entry, no new part variant.** The cover is cosmetic, not a performance part; the 12-slot list (D-032) and the 24-entry catalog are unchanged. `src/core/interfaces.ts` (D-010) is untouched.
- **No change to the M10 exterior shell or any existing GLB.** `public/Duramax_LLY_2005_66L_V8.glb`, the ten internal part GLBs and the five variant GLBs are byte-identical. The cover is a separate add-on asset.
- **No default-scene change.** The cover is off on every load; RF-1…RF-17, the M10 Y-bridge proof, the 23 label anchors and the stock build remain exactly as shipped.
- **No texture, decal, normal map or UV unwrap.** The repo's exterior/variant assets are untextured PBR; the cover follows that. The real cover's raised diamond field is **not modelled** because its pitch/depth are not published — a labeled omission, not a guessed texture.
- **No fabricated `DURAMAX` wordmark.** The evidence says `6.6 TURBO DIESEL`; see §2.3 and §15.7.
- **No new capping technique.** The cover is another static cap source in the existing M11 builder; no stencil, render target, extra pass, new shader or per-material cap colour.
- **No new label system.** No 24th anchor and no raycast/occlusion changes; the existing 23 anchors and label rules are frozen.
- **No M8 variant change.** None of the five variant GLBs, their `modelPath`/`explodeVectorMm` values, or their compatibility rules change.
- **No physical-access claim.** Dimensions, wall thickness, letter metrics, texture pitch, polymer family and the rear-bolt torque are not published; they are labeled placeholders and illustrative PBR choices, not measured LLY values. The front clamp torque is a prior-project GM service record (6 N·m, §12.3) and is not used to size anything.

---

## 2. The five explicit positions

### 2.1 Toggle — own control, default **off**

**Decision: the cover gets its own `Intake cover` checkbox in the Views group. It is unchecked on every load. It is visible only when the checkbox is checked and the exterior context is shown (`Exterior` checked or `X-Ray` checked). It does not ride the `Exterior` toggle.**

Reasons, from the code and the part:

1. **The part is optional by definition.** `Exterior` is the shell-visibility control (`src/ui/engineControls.ts:780-816`; `src/renderer/engineScene.ts:1620-1626`). If the cover rode `Exterior`, checking `Exterior` would always add it — a default fixture. The brief is explicit that M12 adds it "as a cosmetic option, not a default fixture."
2. **It hides the Y-bridge.** M10 excluded it for exactly that reason (`docs/specs/M10-exterior-accuracy.md:29`), and M10's RF-11/RF-13 and the 8-angle containment sweep prove the Y-bridge is visible. A separate toggle lets a user see the M10 shell with the bridge exposed (cover off) or the closed-up engine-bay look (cover on) without reloading or changing the shell.
3. **All 17 existing reference frames stay visually unchanged (manual comparison; the cover defaults off).** The cover defaults off, so `?rf=RF-1`…`?rf=RF-17` and the stock preview do not acquire a new surface. Riding `Exterior` and defaulting the cover off would create an inconsistent state (Exterior on but cover off) and would still need a second control; one control is simpler.
4. **The code already separates shell context from add-on visibility.** External variants are visible only when `exteriorVisible || xrayEnabled` (`src/renderer/engineScene.ts:1119-1129`), and `syncExteriorShellState` owns shell visibility/ghosting (`:1185-1217`). A cover add-on follows the same rule with one extra boolean; no new render mode is needed.
5. **The M8 Build panel's pattern is not a fit.** The cover is not a performance selection and has no stock/modified variants; putting it in the catalog would add a fake slot and a fake performance row. A Views checkbox is the honest UI.

**State machine:**

| `Intake cover` | `Exterior` | `X-Ray` | Cover visible? | Other effect |
| :---: | :---: | :---: | :---: | --- |
| off | either | either | **no** | Stock scene; cover is loaded but `group.visible = false` |
| on | off | off | **no** | Checkbox stays checked; the cover is hidden with the shell (no floating cover); a UI note says it shows with Exterior or X-Ray |
| on | on | off | **yes, opaque** | Cover renders over the Y-bridge; section clipping/caps apply |
| on | either | on | **yes, ghosted** | Cover materials `transparent = true`, `opacity = 0.22`, `depthWrite = false`; its section cap is suppressed |

The checkbox is not persisted to `localStorage` and resets off on load, matching every other view toggle. Toggling it while `Exterior` is off does not force `Exterior` on; the user sees the note and can check `Exterior`.

### 2.2 Geometry — a scene-placed add-on authored in the project frame

**Decision: the cover is a new scene-placed GLB, `public/models/intake_cover_lly.glb`, authored in the master project frame (+X front, +Y vehicle LH, +Z up) at its final mounted position, exported Y-up, loaded through the existing `loadVariantScene` wrapper (`src/renderer/variantLoader.ts:26-65`), and attached at the scene root with no pivot. It is a closed thin-walled shell: outer and inner surfaces joined by a 2.5 mm bottom rim, with a closed rear mounting boss and a simplified integrated front mount — representing, but not modelling, the EPC's separate charge-air-duct clamp — merged into the body mesh.**

Why this class and not a shell subtree:

- The M10 shell is a fused, project-frame authored asset with 22 top-level groups and 92 `extras.partId` leaves (`docs/M10-EXTERIOR.md:33-54`; `src/renderer/shellAssets.test.ts:343-366,513-547`). Adding a cover as a 23rd group would change the shell GLB, its 37,100-triangle contract and every M10 asset test. M12 must not touch it.
- The cover is a bolt-on cosmetic add-on, exactly the "scene-placed" class M8 already uses for external variants (D-038; `docs/ASSET_CONTRACT.md`): project-frame at final position, no pivot/animation, Y-up export, one `wrapInPartLocalFrame` restoration, untextured PBR, `castShadow = false` / `receiveShadow = false`.
- The existing loader already returns a `Group` with materials and triangle count, and the M11 cap builder accepts a `Group` via `prepareCapSource` child-mesh traversal (`src/renderer/sectionCaps.ts:1635-1707`). No new loader or wrapper is needed.
- It is **not** a catalog variant: `loadVariantScene` is used as a generic scene-placed loader, and the cover's path/constant lives in a new pure module, not in `catalog/*.json`.

### 2.3 Lettering — the evidenced `6.6 TURBO DIESEL`, as raised geometry

**Decision: model the legend as three lines of raised rectilinear stroke geometry — `6.6`, `TURBO`, `DIESEL` — in the same black plastic family as the cover, 0.8 mm proud of a flat lettering pad. Do not model a `DURAMAX` wordmark, and do not use a texture or decal.**

Evidence and the conflict:

- The GM EPC exploded-view line drawing shows the cover with `6.6` / `TURBO` / `DIESEL` on three stacked lines (`https://gmsklad.ru/gmcat/pics/cadillac/p013890.jpg`; survey §3).
- Seven used-parts photographs of `21994000` show the same three-line legend, moulded into the black plastic (`https://dieselspecialtyparts.com/2006-gmc-chevrolet-3500-lly-66-diesel-engine-oe-intake-resonator-cover-21994000`; survey §4).
- The milestone brief's "DURAMAX lettering" is **not** supported for `21994000` in any source located. `DURAMAX` appears in auction titles as the engine-family name ("05-07 DURAMAX … Part# 21994000"), not as a description of the cover's legend. The legacy viewer also says "embossed '6.6 TURBO DIESEL' badge" (`public/legacy/index.html:225`).
- Under D-012, a fabricated wordmark is exactly the failure mode M10 avoided (`docs/specs/M10-exterior-accuracy.md:61`). M12 therefore models the evidenced legend. The conflict is recorded in the survey, this spec, and the build docs; if the owner wants a `DURAMAX` wordmark, that is a separate decision and a different asset.

Construction and cost:

- A **rectilinear monoline stroke font** (not a match to the real moulded typeface, which is not published): each glyph is built from rectangular stroke prisms 0.8 mm high, with a 4.0 mm stroke width and a 22 mm cap height, stacked on a 30 mm line pitch.
- The planned stroke count is **45 prisms** across 14 glyphs (`6` ×2, `.` ×1, `T` `U` `R` `B` `O`, `D` `I` `E` `S` `E` `L`): `6.6` = 9, `TURBO` = 18, `DIESEL` = 18. At **12 triangles per closed stroke prism**, the lettering cost is **540 triangles**. The spec caps it at **600**; the asset test pins **exactly 540** triangles and **45** connected stroke components. The 45 prisms stay separate closed components in the merged mesh (not welded across strokes), so the count is testable; the build must not dissolve the strokes into one manifold glyph.
- The letters are merged into **one** `ext_intake_cover_lettering` mesh with **one** material. The body is a second mesh/material. Total **2 draw calls** for the cover; no per-glyph meshes.
- The letters receive a slightly lower roughness than the body so the raised forms catch the key light (the photos show the same black plastic, not a contrasting badge). This is a rendering choice, not evidence of a different material; it is recorded as such.

### 2.4 Materials and finish — matte black plastic, no texture

| Material | Linear RGB | Metalness | Roughness | Side | Maps | Used by |
| --- | --- | ---: | ---: | --- | --- | --- |
| `mat_cover_plastic` | `0.028, 0.029, 0.032` | `0.00` | `0.62` | `DoubleSide` | none | Cover body, boss, front mount/leg |
| `mat_cover_letter` | `0.032, 0.033, 0.036` | `0.00` | `0.38` | `DoubleSide` | none | Lettering mesh |

The real part is a **matte/satin black moulding** with a raised diamond field and moulded letters (survey §4). The PBR values are an illustrative approximation, not a GM colour-code match. The diamond field is omitted: its pitch, rib width and depth are not published, and a guessed texture would be a fabricated surface (D-012). The omission is recorded in `docs/M12-COVER.md` and the M12 measurements, and the smooth black cover is the labeled placeholder.

No clearcoat, no normal map, no image, no UV attribute, no texture bytes. `castShadow = false` and `receiveShadow = false`, matching the M10 shell and the M8 variants; on the Phone tier there is no shadow map anyway.

### 2.5 What the cover must communicate, and what it must not

**Must communicate, in order:** (1) a removable cosmetic lid over the intake valley, distinct from the castings; (2) the LLY's only lettered surface, with the evidenced three-line legend; (3) an optional accessory — when it is off, the Y-bridge is fully visible; (4) a part that belongs to the external context, not the internal assembly.

**Must not communicate:** that a `DURAMAX` wordmark is verified on this part (it is not); that the diamond field or the exact font is modelled (they are not); that the cover's proportions are measured LLY dimensions (they are placeholders); that the cover is a default stock fixture (it is off by default); or that it is part of the fused M10 shell (it is a separate add-on).

---

## 3. What the shipped app does today (measured, not assumed)

Source: this planning session on the production bundle at `e22d2b0`, plus the committed M11/M10 measurements. The current app has **no cover** — `git grep 21994000` finds no current source or asset; the string appears only in `README.md:10`, `assets-src/PROVENANCE.md:69`, `docs/M10-EXTERIOR.md:159`, `docs/OPEN_ITEMS.md:20`, `docs/research/M10-exterior-accuracy-survey.md:314`, the legacy viewer (`public/legacy/index.html:188,225`) and this M12 planning package.

| Fact | Value | Where it comes from |
| --- | --- | --- |
| Renderer / clipping | `new THREE.WebGLRenderer({ antialias: true })`; `localClippingEnabled = true`; no stencil; one `renderer.render(scene, camera)` | `src/renderer/engineScene.ts:395-399,1853` |
| Exterior shell | 22 top-level groups, 92 `extras.partId` leaves, 37,100 triangles, 23 merged meshes, 0 textures | `docs/M10-MEASUREMENTS.md:15-19,42-63`; `src/renderer/shellAssets.test.ts:343-366` |
| Shell bounds | X `−272.52…617.80`, Y `−549.86…480.66`, Z `−223.50…556.00` mm | `docs/M10-MEASUREMENTS.md:21` |
| Y-bridge bounds | X `214.0…346.4`, Y `−144.8…144.8`, Z `234.3…352.0` mm | `docs/M10-MEASUREMENTS.md:43`; measured again in §15.4 |
| Resonator bounds | X `92.0…236.546`, Y `6.6…112.0`, Z `324.0…556.0` mm | `docs/M10-MEASUREMENTS.md:42` (table rounds max X to 236.5); measured again in §15.4 |
| Cold charge pipe bounds | X `298.1…513.5`, Y `−453.5…10.3`, Z `146.9…369.078` mm | `docs/M10-MEASUREMENTS.md` group stream (table rounds max Z to 369.1); measured again in §15.4 |
| Exterior visibility | `exteriorShell.group.visible = exteriorVisible` OR `xrayEnabled`; shell default off | `src/renderer/engineScene.ts:1185-1190`; `src/renderer/exteriorLoader.ts:208-210` |
| X-Ray ghost | Shell materials `transparent = true`, `opacity = 0.22`, `depthWrite = false`, snapshot/restore | `src/renderer/engineScene.ts:1191-1216` |
| Cap sources | Shell meshes registered as static `skipWhenGhosted` sources; heads/injectors/main shaft/variants static; dynamic set per frame | `src/renderer/engineScene.ts:1493-1508`; `src/renderer/sectionCaps.ts:1635-1707,1906-1911` |
| External variants | Five catalog entries; loaded via `loadVariantScene`; visible only in exterior context; explode by catalog vectors | `src/renderer/engineScene.ts:1519-1577`; `src/renderer/partVariants.ts:27-45` |
| Labels | 23 anchors (15 part + 8 cylinder); exterior labels hide when the shell is off; any anchor on the clipped side hides | `src/renderer/viewLayout.ts:154-177,397-434` |
| UI | `Exterior` + `Quality` row; Views group Explode/Section/X-Ray/Labels/cutaway note | `src/ui/engineControls.ts:780-929` |
| Reference frames | RF-1…RF-17; no cover flag | `src/ui/referenceFrames.ts:19-176` |
| Current scene, stock / worst | **308,324 / 304,632** scene triangles; **96/97** calls full, **58/60** phone; **579,484/568,880** desktop submitted, **307,876/304,512** phone; **20.75/4.75** MiB | measured this session, §15.2; matches `docs/M11-MEASUREMENTS.md:59-116` and `docs/M10-MEASUREMENTS.md:192-217` |

The two facts that drive the whole design: **the Y-bridge is exposed today and must stay exposed by default**, and **the cover is not in any current asset, catalog entry or code path**.

---

## 4. The cover asset — technical contract

### 4.1 File and asset class

| Item | Value | Provenance |
| --- | --- | --- |
| Asset path | `public/models/intake_cover_lly.glb` | Design |
| Asset class | Scene-placed cosmetic add-on (D-038 extension) | Design |
| Authoring source | `assets-src/blender/build_intake_cover.py` + `assets-src/cover_dimensions.json` | Design |
| Root node | `intake_cover_lly` | Design |
| Mesh leaves | `ext_intake_cover_body`, `ext_intake_cover_lettering` | Design |
| Markers | `if_intake_cover_rear_bolt`, `if_intake_cover_duct_clamp` (empty nodes, no mesh) | Design |
| Materials | `mat_cover_plastic`, `mat_cover_letter` (2, no textures/images/UVs) | Design |
| Triangle caps | Body **≤ 1,200**; lettering **≤ 600**; total **≤ 1,800** | Budget, §7 |
| File size | **≤ 64 KiB (65,536 B)** | Budget, §7.3; page-weight check §7.4 |
| File format | Uncompressed glTF 2.0 binary, Y-up export, indexed triangles, `POSITION` + `NORMAL` only | `docs/ASSET_CONTRACT.md` scene-placed class |
| Shadow | `castShadow = false`, `receiveShadow = false` | Matches shell/variants |
| Runtime wrapper | `loadVariantScene` (`src/renderer/variantLoader.ts:26-65`) — one `wrapInPartLocalFrame` (+90° X) | Existing code |
| Mount transform | Identity at Explode 0; `+Z 260 mm × e` at Explode > 0 | Design, §6.2 |

The root is a **Group**, not a single mesh — the one deliberate extension of the M8 "single root mesh node" rule — because the body and lettering need two material-separated meshes. The root name still follows the model (`intake_cover_lly`), and the two leaves carry the contract names. `loadVariantScene` handles a root Group without change.

### 4.2 Planform, height and placement (all values labeled placeholders unless noted)

The planform is a six-vertex shield in project XY. It is a **clearance-driven placeholder sized to the measured M10 shell, not form-matched** to the GM EPC/photo form, and **not** to published LLY dimensions (none exist). The survey's form evidence is a wide rear / narrower front / front-corner notch; this planform is wide at the front and relieved at the rear-right because that is what clears the stock intake duct, the V2 tube and the cold charge pipe. The deviation is recorded in §15.7 and `docs/M12-COVER.md`.

```
P1 (245.0, −40.0)   P2 (320.0, −40.0)   P3 (320.0, −120.0)
P4 (400.0, −120.0)  P5 (400.0, 120.0)   P6 (245.0, 120.0)
```

- **Rear edge** X = 245.0 mm (toward the flywheel); **front edge** X = 400.0 mm (toward the accessory drive); **width** Y = −120.0…+120.0 mm.
- The **rear-right relief** (P1–P2–P3) clears the stock intake duct and the V2 high-flow tube; the alternator and P/S pump sit just outside the side edges, and the cold charge pipe is cleared vertically by the 370.0 mm underside (5.172 mm at the highest pipe vertex under the footprint; the pipe's group max is 369.078 mm at (348.544, −140.375), outside the relief, with a 0.922 mm vertical gap).
- The **rear edge** X = 245.0 mm is **8.454 mm forward of** the measured resonator max X = 236.546 mm; the resonator is behind the cover, so no separate notch is needed.
- **Body bottom rim** Z = 370.0 mm; **body top** Z = 417.2 mm; **wall thickness** 2.5 mm; **body height** 47.2 mm.
- **Lettering pad** flat at Z = 417.2 mm; **letter top** Z = 418.0 mm (0.8 mm relief).
- **Asset envelope** (including mount features): X `245.0…400.0`, Y `−120.0…120.0`, Z `333.4…418.0` mm.

| Parameter | Value | Unit | Provenance | Why this value |
| --- | ---: | --- | --- | --- |
| Planform vertices | P1–P6 above | mm | **labeled placeholder**, clearance-driven (not form-matched) | Sized to the Y-bridge (X 214–346.4, Y ±144.8) with a rear-right relief and an 8.454 mm gap forward of the resonator (max X 236.546); the orientation deviates from the survey's form evidence (§15.7) |
| Body bottom rim | 370.0 | mm | **labeled placeholder**, measured-from-code | 5.172 mm above the highest cold-charge-pipe vertex under the footprint (364.828); the pipe's group max is 369.078 outside the relief (0.922 mm vertical gap); 18.046 mm above the highest Y-bridge top (351.954); the rear mount's local top is 333.4 |
| Body top | 417.2 | mm | **labeled placeholder**, measured-from-code | **No overhead shell vertex over the footprint** (0 shell vertices above Z 417.2 inside the planform). The nearest Z ≈ 421.15 vertices are outside the planform (turbo at (−141.79, −39.46); an intake-duct vertex at (222.04, −98.49)), so the 4.0 mm to 421.15 is a drawing margin only, not a clearance. The injector rows are outboard (injector group bounds Y ±290.7 vs cover ±120), so their 367.3 mm top is not limiting |
| Wall thickness | 2.5 | mm | **labeled placeholder** | Thin moulded-plastic wall; no published value |
| Body height | 47.2 | mm | **derived** (417.2 − 370.0) | — |
| Letter relief | 0.8 | mm | **labeled placeholder** | Reads at the app's viewing distances; no published value |
| Letter top | 418.0 | mm | **derived** (417.2 + 0.8) | — |
| Rear bolt marker | `(260.0, 0.0, 333.4)` | mm | **labeled placeholder**, 0.6916 mm from the measured contact vertex `(260.690, 0.0, 333.356)` | On the measured Y-bridge top 15.0 mm ahead of the cover's rear edge; GM EPC shows a rear bracket bolt; the asset test asserts ≤ 0.5 mm marker deviation and the 15 mm pad |
| Duct clamp marker | `(372.0, −95.4, 353.4)` | mm | **labeled placeholder**, 0.3672 mm from the measured contact vertex `(371.634, −95.400, 353.367)` | On the measured cold charge pipe top (353.367); GM EPC shows a front charge-air-duct clamp |
| Rear tower length | 36.6 | mm | **derived** (370.0 − 333.4) | — |
| Front mount leg length | 16.6 | mm | **derived** (370.0 − 353.4) | — |
| Explode vector | `(0, 0, 260)` | mm | **design decision** | Same +Z lift as `turbo_large`; reveals the Y-bridge; no collision with any exploded part |
| Body triangle cap | 1,200 | tris | **design budget** | Simple closed shell + boss + front mount/leg; measured at build |
| Lettering cap | 600 | tris | **design budget** | 45 stroke prisms × 12 = 540 planned; cap 600 |
| Total cap | 1,800 | tris | **derived** (1,200 + 600) | Used in all budget arithmetic |

**Why the planform is not a rectangle.** The measured shell leaves no room for a full rectangle: the cold charge pipe (`ext_charge_cold`) reaches Z 364.828 at its highest vertex under the footprint (group max 369.078 outside the rear-right relief) and forces the 370.0 mm underside; the alternator reaches Y −124.51 at X 404.6; the P/S pump reaches Y 128 at X 376; the stock intake duct reaches (302.42, −152.73, 447.67); and the resonator reaches X 236.546. A full 245–400 × ±120 rectangle would put its rear-right corner into the intake-duct/V2 region and its front-right corner only 8.08 mm from the alternator. The rear-right relief moves the cover edge away from the intake duct and V2 tube, while the rear edge stops 8.454 mm forward of the resonator. The measured clearances in §15.4 are the proof.

### 4.3 Body construction

- **Closed thin-walled shell:** outer top/side surfaces, inner top/side surfaces offset 2.5 mm inward/down, a 2.5 mm bottom rim joining them, and a flat lettering pad on the top. The underside cavity remains open (the rim is a ring, not a bottom plate), matching the real cover's open underside; the surface is watertight (0 boundary edges at a 1e-5 m weld quantum) so the M11 cap builder produces a true thin-wall cross-section: the cap is the material band, and the open underside is outside the material and is not filled.
- **Mounting solids:** a rear boss/tower from the body underside (370.0) to the rear bolt marker (333.4), and a simplified integrated front mount/leg to the duct marker (353.4). The leg represents, but does not model, the EPC's separate charge-air-duct clamp (item 003); it is a cosmetic simplification recorded in `docs/M12-COVER.md`. The solids are closed and merged into the body mesh (same material); they may overlap the body but are individually closed, so the body mesh has exactly three closed connected components (shell, rear boss, front mount).
- **No pivot, no animation, no skinning, no morph targets.** The runtime moves the whole `Group` only by the explode translation.
- **No textures/UVs.** `POSITION` + `NORMAL` indexed triangles only, like the M10 shell and M8 variants.
- **Lettering mesh:** a separate merged mesh of 45 closed stroke prisms on the flat pad; one material; no per-glyph nodes.

### 4.4 Mounting and placement audit

The cover is held at two labeled points (matching the GM EPC's one bolt + one clamp):

| Marker | Contact | Contact Z | Cover-side feature |
| --- | --- | ---: | --- |
| `if_intake_cover_rear_bolt` | Y-bridge top | 333.4 | Rear boss; the GM EPC's M8×1.25×113.7 bolt (`11588339`) passes through it |
| `if_intake_cover_duct_clamp` | Cold charge pipe top | 353.4 | Simplified integrated front mount/leg; represents, but does not model, the EPC's separate charge-air-duct clamp (item 003) |

The markers are empty nodes at **placeholder** project coordinates, 0.6916 mm and 0.3672 mm from the measured contact vertices under the 15 mm pad; the asset test converts the glTF translations with `p_mm = (1000·g_x, −1000·g_z, 1000·g_y)` and asserts the GLB markers are within **≤ 0.5 mm** of these spec values. The rear contact is grounded on the nearest measured Y-bridge top vertex, `(260.690, 0.0, 333.356)`, 0.6916 mm from the marker under a 15 mm pad; the clamp contact is grounded on the nearest measured cold-pipe vertex `(371.634, −95.400, 353.367)`, 0.3672 mm from the marker. They are **placeholder positions**, not published GM coordinates; the GM EPC only shows the arrangement.

The cover does **not** touch the resonator, alternator, P/S pump, intake duct, injectors or electronics loom. It sits on a rear tower over the Y-bridge; its integrated front mount sits at the cold charge pipe (the EPC clamp is represented, not modelled). The front edge overhangs the Y-bridge. The rear boss is 15.0 mm ahead of the cover's rear edge and 46.0 mm ahead of the Y-bridge rear edge; the integrated front mount is 28.0 mm behind the cover's front edge.

### 4.5 Clearance / placement audit (measured against the shipped shell)

Method: parse `public/Duramax_LLY_2005_66L_V8.glb` with the same node/world-matrix transform used by `src/renderer/shellAssets.test.ts`; test every shell vertex against the body envelope (planform extruded Z 370.0–417.2) and compute the shortest distance to the body volume. The body envelope starts at Z 370.0, above the two mount contacts (333.4/353.4), so no contact exemption is needed and the inside count is naturally 0; the marker vertices themselves are below the envelope.

| Obstacle group | Min vertex clearance | Where | Verdict |
| --- | ---: | --- | :---: |
| `chargePipeCold` (`ext_charge_cold`) | **5.172 mm** | (342.338, −99.358, 364.828) — highest pipe vertex under the footprint, below the body underside; the group max 369.078 at (348.544, −140.375) is outside the rear-right relief | **PASS** |
| `alternator` (`ext_alternator`) | **8.084 mm** | (404.6, −124.51, 365.12) — outside the cover's front-right corner | **PASS** |
| `acComp` (`ext_ps_pump`) | **8.246 mm** | (376.0, 128.0, 368.0) — outside the Y edge | **PASS** |
| `resonator` (`ext_resonator_clamp`) | **8.793 mm** | (236.207, 22.301, 387.112) — behind the cover's rear edge (max X 236.546; 8.454 mm gap) | **PASS** |
| `intakeBridge` (`ext_map_sensor`) | **18.046 mm** | (319.256, 8.000, 351.954) — below the body; the rear mount pad contacts the local Y-bridge top at 333.4 | **PASS** |
| `electronics` (`ext_glowplug_loom` / `ext_harness_loom` / `ext_harness_main_break`) | **25.908 mm** | (249.485, 91.198, 344.092) — inside the planform, below the underside; the loom is treated as an obstacle and no mount feature reaches it | **PASS** |
| `intake` (`ext_intake_duct`) | **48.049 mm** | (302.417, −152.731, 447.666) — outside the rear-right relief | **PASS** |
| `cp3Fuel` (`ext_cp3` / `ext_fca` / `ext_hp_lines` / `ext_hp_rails`) | **67.070 mm** | (291.579, 165.219, 320.467) — next-lowest remaining group | **PASS** |
| All remaining shell groups | ≥ 73.407 mm | `beltDrive` is the next-lowest after `cp3Fuel`; measured per group, §15.4 | **PASS** |
| Shell vertices inside the body envelope | **0** | all groups, Z 370.0–417.2 | **PASS** |
| Lowest shell vertex above the cover top over the footprint | **none** | no shell vertices above Z 417.2 inside the planform | **PASS** |

The clearances are vertex-level against the cover envelope. The cover's actual outer surface lies inside that envelope, so the true surface clearance is equal or larger; a triangle-level check is the stronger method if the shell is ever replaced (the same residual-risk note M8/M10 used). The build's asset test re-runs this audit and fails on any negative/inside result.

### 4.6 Lettering construction (cost and provenance)

| Attribute | Value | Provenance |
| --- | --- | --- |
| Legend | `6.6` / `TURBO` / `DIESEL` (three lines) | **VERIFIED-VISUAL** — GM EPC line drawing + used-parts photos; survey §6 |
| Construction | 45 closed rectangular stroke prisms, 0.8 mm high, 4.0 mm stroke, 22 mm cap height, 30 mm line pitch | **labeled placeholder**; no published font metrics |
| Stroke count by line | `6.6` 9; `TURBO` 18; `DIESEL` 18; total **45** | **computed** |
| Triangles | 45 × 12 = **540**; cap **600** | **computed** |
| Material | `mat_cover_letter`, same black family, roughness 0.38 | **design choice**, not a material claim |
| Mesh count / draw calls | 1 mesh, 1 material, **+1 draw call** (the body is the other) | **design** |
| Texture/decal | none | **decision** (repo practice) |
| `DURAMAX` wordmark | **not modelled** | **CONFLICT**; evidence says `6.6 TURBO DIESEL` |
| Diamond field | **not modelled** | **NOT PUBLISHED**; labeled omission |

The letters are raised, not recessed, because the photographs show the legend standing proud of the smooth pad. The exact real font is unknown; the rectilinear stroke construction is an explicit placeholder, not a claim to match the moulding.

---

## 5. Integration — renderer, UI, state

### 5.1 New pure module: `src/renderer/intakeCover.ts`

A Three.js-free module (importable by Node tests) owns:

- `INTAKE_COVER_MODEL_PATH = 'models/intake_cover_lly.glb'`.
- `INTAKE_COVER_BODY_TRIANGLE_CAP = 1_200`, `INTAKE_COVER_LETTERING_TRIANGLE_CAP = 600`, `INTAKE_COVER_TRIANGLE_CAP = 1_800`.
- `INTAKE_COVER_EXPLODE_VECTOR_MM = [0, 0, 260]`.
- `INTAKE_COVER_PLANFORM_MM` (P1–P6), `INTAKE_COVER_BODY_Z_MIN_MM = 370.0`, `INTAKE_COVER_BODY_Z_MAX_MM = 417.2`, `INTAKE_COVER_LETTER_Z_MAX_MM = 418.0`, `INTAKE_COVER_WALL_MM = 2.5`.
- `INTAKE_COVER_MARKERS` (two name/position records; the marker normal is the node's local `+Z`, with identity rotation and no normal attribute).
- `INTAKE_COVER_LEGEND = ['6.6', 'TURBO', 'DIESEL'] as const`.
- `computeIntakeCoverVisible(enabled, exteriorVisible, xrayEnabled)` → `enabled && (exteriorVisible || xrayEnabled)`.
- `computeIntakeCoverExplodeOffsetMm(explodeFactor)` → `computeVariantExplodeOffsetMm(INTAKE_COVER_EXPLODE_VECTOR_MM, explodeFactor)`.
- `isPointInsideIntakeCoverPlanformMm(xMm, yMm)` for tests and the clearance audit.
- `createExteriorGhostRegistry(opacity = 0.22)` — a Three.js-free, load-order-safe material ghost registry. `register(materials)` stores each material's original `transparent`/`opacity`/`depthWrite` and immediately applies the current ghost state (so a material registered after X-Ray is on is ghosted at once); `setGhosted(ghosted)` applies or restores the exact snapshot; `isGhosted()` and `size` expose the state. The renderer uses one registry for the shell and cover materials, and test 7 exercises the load-order sequence directly.

No Three.js import; `src/core/**`, `src/perf/**` and `catalog/**` untouched.

### 5.2 `src/renderer/engineScene.ts` — state, load, sync, caps, ghost, stats

Additive changes only:

1. **State:** `let intakeCover: LoadedVariantScene | null = null; let intakeCoverEnabled = false; let intakeCoverLoaded = false; let intakeCoverLoadFailed = false;`.
2. **Load:** after the existing variant preload (or in parallel with it), call `loadVariantScene(partLoader, `${baseUrl}${INTAKE_COVER_MODEL_PATH}`)`. On success: add geometries/materials/textures (none) to the existing disposal sets, register each material with `registerClippableMaterial`, set `intakeCoverLoaded = true`, add the group to the scene, set `group.visible = false`, and push a static cap source:
   ```
   prepareCapSource({
     id: 'intake_cover',
     object3D: intakeCover.group,
     instanced: false,
     count: 1,
     static: true,
     skipWhenGhosted: true,
     hullOnly: false,
   })
   ```
   Then `exteriorGhostRegistry.register(intakeCover.materials)`, `syncExteriorShellState()` (which applies the current X-Ray state to the newly loaded materials), `syncIntakeCoverState()` and `staticCapsDirty = true`. On failure: log, set `intakeCoverLoadFailed = true` and `intakeCoverLoaded = true` (so the benchmark does not hang), and leave the scene unchanged; the app must not crash. A missing asset is a build failure caught by §9 test 1, not a normal user state, so no extra failure UI is added.
3. **Visibility/sync:** a new `syncIntakeCoverState()` sets `intakeCover.group.visible = computeIntakeCoverVisible(intakeCoverEnabled, exteriorVisible, xrayEnabled)`, applies the explode offset (`computeIntakeCoverExplodeOffsetMm(explodeFactor)` / 1000 to `position`), and marks `staticCapsDirty = true` when visibility/position changes. It is called from `syncExteriorShellState`, `setExteriorVisible`, `setXrayEnabled`, `setExplodeFactor`, and after load; `setIntakeCoverEnabled` calls `syncExteriorShellState()` (to apply/restore ghosting for the new state) and then `syncIntakeCoverState()`. **It must run before the `if (!exteriorShell) return;` guard** in `syncExteriorShellState` (`:1187`), otherwise a cover that finishes loading before the shell would never get its visibility/explode state.
4. **Ghosting (load-order-safe):** replace the one-shot `exteriorMaterialsGhosted` boolean with a single `createExteriorGhostRegistry(XRAY_GHOST_OPACITY)` instance. Register `exteriorShell.materials` at shell load and `intakeCover.materials` at cover load; `syncExteriorShellState` calls `registry.setGhosted(xrayEnabled)` **unconditionally** (no `xrayEnabled && !alreadyGhosted` branch), and guards only the shell-group `visible` assignment. The registry snapshots a material the first time it is ghosted, applies `transparent = true`, `opacity = 0.22`, `depthWrite = false`, and restores the exact snapshot when X-Ray is off. A material registered while the registry is ghosted is ghosted immediately — so a cover that finishes loading after X-Ray is on cannot stay opaque, even if `syncExteriorShellState` already ran. The cover's cap is suppressed by `skipWhenGhosted: true`.
5. **Explode:** `setExplodeFactor` already calls `syncVisualVariants` and marks static caps dirty (`:1636-1652`); add `syncIntakeCoverState()`. At `e = 1`, the cover moves +260 mm; at `e = 0`, back to identity.
6. **Section:** `setSectionState` already sets `mat.clippingPlanes` on every `clippableMaterials` member and marks static caps dirty (`:1703-1718`); no cover-specific code beyond registration. The cover's static cap is rebuilt on plane/explode/toggle/x-ray changes through the existing `staticCapsDirty` path.
7. **Stats:** add `intakeCoverLoaded: boolean`, `intakeCoverFailed: boolean`, `intakeCoverEnabled: boolean`, `intakeCoverVisible: boolean`, `intakeCoverTriangles: number`, `intakeCoverSceneTriangles: number`, `intakeCoverMaterials: number` (the count of cover materials) to `EngineRenderStats`. `visibleSceneTriangles` adds `intakeCoverSceneTriangles` only when the cover group is visible; `intakeCoverSceneTriangles = intakeCover ? intakeCover.triangles : 0`. `renderer.info.render.calls/triangles` pick up the two meshes automatically.
8. **Dispose:** remove the group, dispose the cover geometries/materials through the existing sets; clear the cap source list entry. No new render target/texture.

The controller gains `setIntakeCoverEnabled(enabled: boolean)`, `getIntakeCoverEnabled(): boolean` and the additive stats fields. The existing `renderer.render` remains exactly once; no new pass.

### 5.3 UI — `src/ui/engineControls.ts`

- Add `onIntakeCoverChange?: (enabled: boolean) => void` to `EngineUiOptions`.
- Add `setIntakeCoverChecked(checked: boolean): void` to `EngineUiHandle`.
- Add a third checkbox to the existing `.m4-toggles-row` (or a new `.m4-view-item` immediately after the row):
  - `id="m12-intake-cover-checkbox"`, `type="checkbox"`, `checked = false`, label `Intake cover`.
  - Change handler calls `options?.onIntakeCoverChange?.(checkbox.checked)`.
- Add `<p class="m12-cover-note">` immediately after the toggles row, before the cutaway note, with the exact text in §10.2.
- `setIntakeCoverChecked` sets the checkbox and calls the callback; used by reference frames and the benchmark URL.
- No other control/layout change; the row uses the existing flex gap, and the note uses the existing 10.5 px secondary style.

### 5.4 `src/main.ts`, reference frames and URL surface

- `mountEngineUi` options gain `onIntakeCoverChange: (enabled) => { scene.setIntakeCoverEnabled(enabled); refreshLabelsIfEnabled(); }`.
- `ReferenceFrameDef` gains `intakeCover?: boolean`; `applyReferenceFrame` calls `ui.setIntakeCoverChecked(def.intakeCover ?? false)`.
- `?benchmark=1` gains `cover=0|1`, applied with `ui.setIntakeCoverChecked`.
- `?rf=RF-18`/`RF-19`/`RF-20` are new; `?rf=RF-1`…`RF-17` keep their meaning and default the cover off.
- The benchmark load gate (`src/main.ts:289-300`) adds `!stats.intakeCoverLoaded` so a cover-on measurement cannot report before the asset is ready.
- No change to `viewLayout.ts`, label anchors, `catalog/**` or `src/core/**`.

### 5.5 Why no new loader or catalog entry

`loadVariantScene` already does exactly what the cover needs: `GLTFLoader`, `wrapInPartLocalFrame`, `MeshStandardMaterial` validation, triangle counting, `castShadow/receiveShadow = false` (`src/renderer/variantLoader.ts:26-65`). Reusing it keeps the asset contract and the test surface small. The cover is not a performance selection, so it does not belong in `catalog/*.json`; a catalog entry would need a fake slot and a fake dyno row, violating D-008/D-032 and the "no invented numbers" rule.

---

## 6. Interaction contract

### 6.1 Toggle, Exterior and X-Ray

The state machine is §2.1. The cover is loaded on every load (so toggling is instant) but `visible = false` until enabled. It is visible only in exterior context: `Exterior` checked or `X-Ray` checked. If `Exterior` is off and the cover checkbox is on, the cover is hidden (no floating lid) and the note tells the user it shows with `Exterior` or `X-Ray`. X-Ray ghosts the cover with the shell; it does not hide it.

### 6.2 Explode

`explodeFactor e ∈ [0,1]`; the cover translates **+Z 260·e mm** and does not rotate. At `e = 1` its top is 678.0 mm, clear of the shell (max Z 556.0) and of the exploded `turbo_large` (X −272.5…50, no overlap). The move is a rigid group transform; the mount features move with it; no part is left behind. `e = 0` is exact identity (no drift). The static cap set is marked dirty on every explode change (existing M11 path), so a sectioned exploded cover caps at its new position.

### 6.3 M11 section cutaways

- The cover's two materials join `clippableMaterials`; the existing `setSectionState` assigns the shared plane to them, so the cover is clipped like any exterior part.
- The cover group is a **static cap source** with `skipWhenGhosted: true`. `prepareCapSource` accepts the `Group` and caches its child meshes (`src/renderer/sectionCaps.ts:1635-1707`); `buildCapGeometry` skips it when invisible or ghosted (`:1906-1911`).
- The body is a **closed thin-walled shell**, so the cap is the true wall cross-section (thin bands), not a chord-closed solid. The cap is the **material band**; the open underside is outside the material and remains air — the real cover is open underneath — so RF-19 must show a solid wall band and the open cavity, not a filled slab. The mount boss/front-mount solids cap as small closed sections.
- At `X = 300 mm` the plane cuts the cover and the Y-bridge: the cover cap is the section colour/hatch, and the Y-bridge cap below it is unchanged M11 behaviour. At `X = 402.5 mm` the plane is beyond the cover's max X = 400.0, so the cover contributes **zero** cap triangles (the source's bounds cull it).
- The cover cap is budgeted at **≤ 300 triangles**; the M11 cap ceiling (`SECTION_CAP_MAX_TRIANGLES = 16,000`) is unchanged. Acceptance 5 records the actual cover cap triangles at X = 300 and Y = 0, and fails the milestone if the cover cap exceeds 300; a breach of 16,000 total is a stop-and-report, not a reason to drop the cover cap.
- At the default section positions (X 900 / Y 580) the cover is wholly on the kept side, so it adds zero cap triangles — the stock default remains cap-free.
- No stencil, render target, extra pass, new shader or per-material cap colour.

### 6.4 X-Ray

X-Ray ghosts the cover with the shell (`transparent = true`, `opacity = 0.22`, `depthWrite = false`) and suppresses its cap (`skipWhenGhosted`). The cover's lettering is ghosted with the body, so the internals remain visible through both. Turning X-Ray off restores the exact material snapshot and the cap source. The cover checkbox stays on across X-Ray toggles.

### 6.5 Labels

**No new label anchor.** The 23 anchors in `viewLayout.ts:154-177` and the `isLabelVisibleUnderViewRules` logic (`:397-434`) are unchanged:

- Exterior labels (`Turbocharger`, `Harmonic balancer`, `Oil pan`) are already hidden when the shell is off; they remain visible when the exterior context is on, regardless of the cover. The cover does not add an exterior label.
- Internal labels are already hidden while the opaque exterior shell is shown; they remain hidden with the cover on (the cover does not change that rule) and visible with the shell off.
- Any label whose anchor is on the clipped side of a section plane hides as today.
- HTML labels draw over the cover (z-index overlay); there is no cap/label occlusion system, and M12 does not add one. The cover is named by the `Intake cover` control, not by a floating label.

This is deliberate: a 24th anchor would change the label count and every label test for a cosmetic part whose name is already visible in the panel, and labels on a cover that can be toggled off would need a new visibility rule.

### 6.6 M8 intake visual variants

The cover is compatible with all five M8 visual variants. V2 is a computed surface clearance from the frozen control points; V1/V3/V4 are **conservative envelope separations** from the actual variant bounds, not vertex-level measured clearances:

| Variant | Interaction | Clearance basis / rule | Verdict |
| --- | --- | --- | :---: |
| `turbo_large` | Rear valley; cover is front/mid valley | Cover X min 245.0 vs variant max X **47.12** → **197.88 mm** conservative envelope separation (the shell turbo max 49.8 would give 195.2); no overlap | **Fits** |
| `intake_highflow` (V2) | 4-inch tube from compressor inlet to airbox; passes above/outside the rear-right relief | Minimum tube-surface clearance **6.567 mm** using the conservative Ø116 mm coupler radius (`r = 58`), 4,001-point centreline sampling; with the Ø101.6 mm tube radius the clearance is **13.767 mm** | **Fits, no rule** |
| `exhaust_4in` (V3) | Rear/downpipe; cover is front valley | Cover X min 245.0 vs variant max X **−113.80** → **358.80 mm** conservative envelope separation (the shell envelope −110 would give 355); no overlap | **Fits** |
| `intercooler_upgraded` (V4) | LH outboard; cover max Y 120 | Cover max Y 120 vs variant min Y **472.68** → **352.68 mm** conservative envelope separation (the envelope min 430 would give 310); no overlap | **Fits** |
| `pistons_lowcomp` (V5) | Internal piston batches; no exterior geometry | No exterior interaction | **Fits** |
| Stock `intake` tract | Turbo-inlet tract outboard/front | Minimum vertex clearance **48.049 mm** | **Fits** |
| `resonator` | Front-left; cover edge X 245.0 vs resonator max X 236.546 | **8.454 mm** X gap; **8.793 mm** vertex clearance | **Fits** |

**No catalog compatibility rule is added.** The cover is not a catalog part, and the measured V2 clearance is positive. The test in §9 pins the V2 and shell clearances so a future cover/V2/shell edit fails loudly instead of silently clipping. The cover hides most of the Y-bridge top and a short segment of the cold charge pipe; the rear-right relief leaves the intake-plumbing corridor exposed. It does not hide the turbo-inlet tract, the V2 filter, or the resonator.

### 6.7 Quality tiers, pause, hidden tab

- **Full and Phone:** identical cover geometry and materials; only the existing shadow-map/pixel-ratio tier differences apply. The cover casts no shadow on either tier.
- **Paused:** the cover persists; a sectioned paused frame keeps its cap (static set rebuilt only when state changes).
- **Hidden tab:** no frames are rendered; on return the cover's visibility/position are unchanged, and a sectioned frame rebuilds its static cap on the next dirty update.
- **Load failure:** the cover logs an error and does not break the app; the checkbox remains but the scene has no cover. The benchmark load gate treats a failed load as settled (no hang).

### 6.8 Defaults and persistence

- Default off; no `localStorage`; resets off on reload, like `Exterior`, `X-Ray` and `Labels`.
- Reference frames set the cover explicitly; frames without the field default it off.
- The benchmark `cover=0|1` parameter is explicit; omitted means off.

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

No D-033 budget is raised for M12.

### 7.2 Current shipped scene — measured this session

Production bundle at `e22d2b0`, served with `npx vite preview --port 4173 --strictPort`; loaded with `?benchmark=1&exterior=1&quality=full|phone` and the five-variant query; the geometry counters were read from `window.__engineScene.getRenderStats()` (the same fields the `?benchmark=1` readout prints). Full-tier geometry was read at a 640×480 headless viewport because the planning machine's software WebGL cannot render 1440×900 at a practical rate; the triangle/draw-call counters are resolution-independent. Phone was read at 390×844. The build must re-measure on the reference GPU at the standard viewports and record p95 (§13).

| State | Scene tris | Calls | Submitted tris | VRAM |
| --- | ---: | ---: | ---: | ---: |
| Desktop stock, exterior on | **308,324** | **96** | **579,484** | **20.75 MiB** |
| Desktop worst-case 5 variants | **304,632** | **97** | **568,880** | **20.75 MiB** |
| Phone stock, exterior on | **308,324** | **58** | **307,876** | **4.75 MiB** |
| Phone worst-case 5 variants | **304,632** | **60** | **304,512** | **4.75 MiB** |

These match `docs/M11-MEASUREMENTS.md:59-116` and `docs/M10-MEASUREMENTS.md:192-217`. The arithmetic from the code is: `270,080` internal + `1,080` main shaft + `64` ground + `37,100` shell = `308,324`; the worst case swaps 8 pistons from 4,832 to 3,968 tris each (`−6,912`) and hides/replaces the three preserved shell subtrees (`−6,500`) while adding `9,720` external variant triangles: `308,324 − 6,912 − 6,500 + 9,720 = 304,632`.

### 7.3 The cover's cost

| Cost | Value | Source |
| --- | ---: | --- |
| Cover scene triangles (budget cap) | **1,800** | 1,200 body cap + 600 lettering cap; the lettering construction is exactly 540, so the cap-conservative total is 1,740. Every budget row below uses the conservative 1,800 cap. |
| Cover scene triangles (build actual) | **recorded at build; ≤ 1,800** | Measured body + lettering; recorded in `docs/M12-MEASUREMENTS.md`; a breach is a stop-and-report |
| Cover GLB file size | **≤ 64 KiB (65,536 B)**; actual recorded | One static asset, no textures; page-weight check §7.4 |
| Cover draw calls | **+2** | Body mesh + lettering mesh; both opaque `MeshStandardMaterial`; castShadow=false |
| Cover texture/HDRI VRAM | **+0.00 MiB** | No textures/images/UVs |
| Cover submitted triangles / frame | **+1,800** | Main pass only; no shadow pass (castShadow=false) |
| Cover section cap triangles | **≤ 300** | Static source, only when the plane cuts it; M11 ceiling unchanged |
| Cover CPU load | **one `loadVariantScene` load** | No per-frame CPU beyond two object transforms; no new cap cost when section is off |

### 7.4 The budget arithmetic (stock and worst case, both tiers)

| Metric | D-033 cap (desk / phone) | Stock measured | Stock + cover (cap) | Headroom (desk / phone) | Utilisation (desk / phone) | Worst measured | Worst + cover (cap) | Headroom (desk / phone) | Utilisation (desk / phone) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Scene asset triangles | 360,000 / 320,000 | 308,324 | **310,124** | **49,876 / 9,876** | **86.15 % / 96.91 %** | 304,632 | **306,432** | **53,568 / 13,568** | **85.12 % / 95.76 %** |
| Submitted triangles / frame | 700,000 / 400,000 | 579,484 / 307,876 | **581,284 / 309,676** | **118,716 / 90,324** | **83.04 % / 77.42 %** | 568,880 / 304,512 | **570,680 / 306,312** | **129,320 / 93,688** | **81.53 % / 76.58 %** |
| Draw calls / frame | 250 / 120 | 96 / 58 | **98 / 60** | **152 / 60** | **39.20 % / 50.00 %** | 97 / 60 | **99 / 62** | **151 / 58** | **39.60 % / 51.67 %** |
| Texture + HDRI VRAM | 64 / 32 MiB | 20.75 / 4.75 | **20.75 / 4.75** | **43.25 / 27.25 MiB** | **32.42 % / 14.84 %** | 20.75 / 4.75 | **20.75 / 4.75** | **43.25 / 27.25 MiB** | **32.42 % / 14.84 %** |
| Frame time p95 @ 900 rpm | 16.7 / 33.3 ms | 16.8 / 17.0 ms | **measured at build** | — | — | 16.8 / 17.0 ms | **measured at build** | — | — |

The p95 baselines are pinned to the M11 detail tables: desktop **16.8 ms** (M11 §3.2, `docs/M11-MEASUREMENTS.md:71`) and phone **17.0 ms** (M11 §3.3, `:88`). M11 §3.4 reports the phone range 16.8–17.0 ms; the §3.3 detail row's 17.0 ms is the pinned baseline.

The `+ cover` columns use the conservative 1,800 cap; the build's cap-conservative cover total is 1,740, which only increases the headroom. Among the budget rows, the tightest number is the **Phone stock scene + cover: 310,124 / 320,000 = 96.91 %, 9,876 triangles (3.09 %)**. The worst-case variant scene is lighter because the replaced shell subtrees are larger than the variant additions, so the stock-on state is the correct worst case for the phone triangle cap. The **derived cap-guard** in test 8 is tighter still (317,368 / 320,000, 2,632 triangles) because it uses every variant's triangle cap; it remains a PASS. The cover cap is 1,800; if the build measures less (the body is a simple shell), the headroom only grows. A measured cover above 1,800 is a stop-and-report: do not raise D-033 and do not silently shrink the asset in the spec. **Page weight:** the cover adds one static GLB fetched at startup (it is loaded on every load so toggling is instant) and no new asset file beyond that GLB. The GLB is capped at **64 KiB (65,536 B)**; at that cap the raw startup-payload delta against the M9 baseline (`10,050,510 B`) is `65,536 / 10,050,510 = +0.652 %`. The build records the actual GLB bytes and the `vite build` JS min/gzip delta in `docs/M12-MEASUREMENTS.md`; the M9 0.10 % gzip-JS acceptance was scoped to M9's JS-only change; M12 records the new asset bytes separately and does not apply M9's JS delta to the GLB. A GLB above 64 KiB is a stop-and-report.

### 7.5 Section state

With Section on and the cover on, the cover adds 1,800 scene triangles and **≤ 300 cap triangles** on top of the M11 cap total. The M11 stock `X @ 402.5` submitted rows are `581,426` desktop / `309,818` phone; as a conservative upper bound, adding the cover scene + cap budget gives `≤ 583,526` / `≤ 311,918`, still far inside 700,000/400,000. The exact cover-on `X = 300` row is measured and recorded in `docs/M12-MEASUREMENTS.md`; the M11 cap ceiling of 16,000 and its `+2` cap draw calls are unchanged, and the cover's cap is part of the existing static cap mesh, not a third cap mesh.

### 7.6 Frame time

The cover adds two opaque draw calls and 1,800 triangles, no shadow pass and no texture. The build must run the standard `?benchmark=1` 10 s matrix (stock/worst × desktop/phone × cover off/on, plus cover-on with Section X @ 300) and record p95; the acceptance target is **p95 within +0.30 ms of the M11 detail rows for the same tier/state (desktop 16.8 ms per §3.2, phone 17.0 ms per §3.3)** and **0 dropped frames**. A p95 above the D-033 cap is a stop-and-report.

---

## 8. Visual proof — reference frames

All captures at the standing `1440×900 → 1024×640` convention, stock build unless stated, production preview, `?rf=…`. The three new frames are added to `docs/REFERENCE_FRAMES.md`; RF-1…RF-17 are unchanged with the cover off.

| Frame | Status | Crank angle | Camera position → target (m) | Exterior / views | What it is for |
| --- | --- | ---: | --- | --- | --- |
| **RF-18** | **New** | 180° | `[1.3800, −1.1800, 0.7200] → [0.3000, −0.0200, 0.1700]` (RF-11 pose) | On; Explode 0; Section off; X-Ray off; Labels off; **cover on** | **Cover appearance:** the black shield over the valley, the three-line `6.6 TURBO DIESEL` legend, the integrated front mount and rear tower, and the Y-bridge's main top hidden under it (the rear-right relief exposes the plumbing corridor). |
| **RF-19** | **New** | 705° | `[0.2300, −0.0020, 1.1800] → [0.2300, 0.0000, 0.1400]` (RF-13 pose) | On; Explode 0; **Section X @ 300.0 mm**; X-Ray off; Labels off; **cover on** | **Cover section cap:** the cover cut at X = 300 mm shows a solid thin wall band at the plane, with the open underside cavity left as air (the cap is the material band, not a filled slab); the Y-bridge section below it is the M11 cap. |
| **RF-20** | **New** | 90° | `[1.2800, −1.0800, 0.7400] → [0.3100, −0.0500, 0.1800]` (RF-5 pose) | On; **Explode 100 %**; Section off; X-Ray off; Labels off; **cover on** | **Cover exploded:** the cover lifted +Z 260 mm, the Y-bridge fully visible beneath it, the mounting features travelling with it, and the lettering still readable. |

### 8.1 Checklist per frame

**Shared (all three):**
1. The cover is present and reads as a separate black plastic shield, not as part of the cast Y-bridge or valve covers.
2. The `6.6` / `TURBO` / `DIESEL` legend is legible in three lines; no `DURAMAX` wordmark appears.
3. No diamond-field texture is present (the omission is deliberate and documented).
4. No cover vertex clips the resonator, alternator, P/S pump, cold charge pipe, intake duct, injectors or electronics loom.
5. The cover is outside the shell's world and does not z-fight with the Y-bridge, the shell or the labels.
6. The cover's material reads as matte black plastic; the letters catch a highlight but do not look like a separate metal badge.

**Per-frame:**
- **RF-18:** the Y-bridge's main top is hidden under the cover (only the rear-right plumbing corridor is exposed); the integrated front mount is at the cold charge pipe (the EPC clamp is represented, not modelled); the rear tower is over the Y-bridge; the cover's rear-right relief is visible.
- **RF-19:** the cover's cut face is a flat, hatched **thin wall band** at X = 300 mm; the under-cover cavity is open air (the cap is the material band; the open underside is outside the material), not a filled slab and not an uncapped wall; the Y-bridge section below is solid and unchanged; no floating cap or gap.
- **RF-20:** the cover is lifted exactly +Z 260 mm (compare the rear tower to the Y-bridge); the Y-bridge is fully visible; the cover has not rotated or drifted; the lettering remains readable.

### 8.2 Section-off invariance

With the cover off, RF-1…RF-17 are re-captured and compared **visually** against the committed PNGs by the reviewer, with the subtitle masked; the 3D viewport content must be visually unchanged because the cover group is `visible = false`. This is a **manual visual gate** (no pixel-diff harness is committed); the reviewer records the comparison and any difference in `docs/M12-MEASUREMENTS.md`, and any visible difference is a stop-and-report. With the cover on, only RF-18…RF-20 are new; no existing frame is re-baselined.

---

## 9. Tests

The existing suite (95 tests at M11) must pass. Test-file accounting: **1 new file** (`src/renderer/intakeCover.test.ts`) + **3 edited files** (`src/renderer/partVariants.test.ts`, `src/ui/referenceFrames.test.ts`, `src/ui/uiText.test.ts`). No other test file is edited.

**`src/renderer/intakeCover.test.ts` (new; Node-only; `node:fs` GLB parsing + pure module; no WebGL):**

1. **Asset contract.** `public/models/intake_cover_lly.glb` exists; file size ≤ **64 KiB (65,536 B)**; one root Group `intake_cover_lly`; exactly two mesh leaves `ext_intake_cover_body` / `ext_intake_cover_lettering`; two `MeshStandardMaterial`s, no images/textures/UVs/skins/morphs/animations; body ≤ 1,200 tris, lettering ≤ 600, total ≤ 1,800; `POSITION` + `NORMAL` indexed triangles; bounds inside X 245…400, Y −120…120, Z 333.4…418. *Catches: a missing/renamed asset, a texture/decal smuggled in, a budget or file-size overrun, a wrong material count, or a stray vertex outside the envelope.*
2. **Markers and deck.** The two `if_*` empty markers are at `(260.0, 0.0, 333.4)` and `(372.0, −95.4, 353.4)` within 0.5 mm (the spec values are placeholder markers, 0.6916 / 0.3672 mm from the measured contact vertices under the 15 mm pad); their local `+Z` normals are `(0,0,1)` (empty nodes have no normal attribute; identity rotation means the default `+Z`); body bottom rim 370.0 ± 0.1; body top 417.2 ± 0.1; letter top 418.0 ± 0.1; rear tower bottom 333.4 ± 0.1 and **0.6916 mm** from the nearest Y-bridge top vertex `(260.690, 0.0, 333.356)` under a 15 mm pad; front mount bottom 353.4 ± 0.1 and **0.3672 mm** from the nearest cold-pipe vertex `(371.634, −95.400, 353.367)`. *Catches: a misplaced mount, a cover that floats or sinks into the Y-bridge, and a lettering pad at the wrong height.*
3. **Shell clearance audit.** Parse the frozen shell; transform as `shellAssets.test.ts`; assert **0** shell vertices inside the body envelope (Z 370.0–417.2, planform) and the per-group minima: `chargePipeCold` ≥ 5.0 mm (measured 5.172 at (342.338, −99.358, 364.828)), `alternator` ≥ 8.0 (8.084), `acComp` ≥ 8.0 (8.246), `resonator` ≥ 8.5 (8.793), `intakeBridge` ≥ 18.0 (18.046), `electronics` ≥ 25.9 (25.908), `intake` ≥ 48.0 (48.049), `cp3Fuel` ≥ 67.0 (67.070); then compute the minimum clearance across **all remaining shell groups** (the 14 groups not named individually, 22 in total) and assert that minimum is ≥ 73.4 mm with `beltDrive` as the expected argmin (73.407). Also assert the `chargePipeCold` group max-Z vertex `(348.544, −140.375, 369.078)` is **outside** the planform, so the rear-right relief (not the body underside) carries that vertex, and record its 0.922 mm vertical gap. *Catches: a cover that clips the cold pipe/alternator/P/S/resonator/electronics, a shell edit that invalidates the placement, and a relief change that puts the pipe's group max under the cover.*
4. **V2 high-flow clearance.** From the frozen V2 control points and the two radii, assert the minimum tube-surface clearance is ≥ 6.0 mm with `r = 58` (measured 6.567) and ≥ 13.0 mm with `r = 50.8` (measured 13.767). *Catches: a cover or V2 route change that would make the `intake_highflow` selection visibly interpenetrate.*
5. **Visibility/explode rules.** `computeIntakeCoverVisible` is true only for `enabled && (exterior || xray)`, false for all other combinations; the default constant is false; `computeIntakeCoverExplodeOffsetMm(0) = [0,0,0]`, `(0.5) = [0,0,130]`, `(1) = [0,0,260]`; clamped/non-finite inputs do not produce NaN. *Catches: a default-on regression, a floating cover when Exterior is off, and an explode drift/NaN.*
6. **Lettering and wording.** `INTAKE_COVER_LEGEND` is exactly `['6.6','TURBO','DIESEL']`; the GLB lettering mesh has **45** connected stroke components and **exactly 540** triangles (cap 600); no mesh/material/node name contains `DURAMAX`; the lettering mesh has no texture map. *Catches: a fabricated wordmark, a missing glyph/line, a stroke construction that drifted from the pinned 45-prism plan, and a decal fallback.*
7. **Cap source registration and X-Ray load-order (runtime + source).** **Runtime part:** exercise the exported `createExteriorGhostRegistry` from `intakeCover.ts` in the load order the engine uses — `setGhosted(true)` before the cover materials are registered, then `register(coverMaterials)` — and assert the newly registered materials are immediately `transparent = true`, `opacity = 0.22`, `depthWrite = false`; then `setGhosted(false)` restores the exact original snapshot; registering while unghosted leaves the materials unchanged; and a repeated `setGhosted(true)` does not overwrite the original snapshot. **Source part:** `engineScene.ts` contains `prepareCapSource` with `id: 'intake_cover'` and `skipWhenGhosted: true` for the cover group; the cover is loaded via `loadVariantScene` with `INTAKE_COVER_MODEL_PATH`; the load path calls `syncExteriorShellState()` after registering the cover materials; the one-shot `exteriorMaterialsGhosted` boolean is gone and `syncExteriorShellState` calls `exteriorGhostRegistry.setGhosted(xrayEnabled)` unconditionally; `renderer.render(` appears exactly once; no `new THREE.WebGLRenderTarget(`, `stencil: true`, `setRenderTarget`, or `overrideMaterial` is added. *Catches: a cover that is visible but never capped, a cap that survives X-Ray, an extra pass, or a load-order regression that leaves a late-loading cover opaque under X-Ray.*
8. **Budget guard (edit `src/renderer/partVariants.test.ts` test 9).** Add `INTAKE_COVER_TRIANGLE_CAP` to the derived worst-case scene triangles: `308,324 − 6,500 + 10,800 + 2,944 + 1,800 = 317,368 ≤ 320,000`; assert phone headroom **2,632** and desktop headroom **42,632**; assert cover draw calls +2 stay under 120/250. *Catches: a cover cap increase that breaches the phone scene budget, or a budget test that silently ignores the new asset.*
9. **UI text (edit `src/ui/uiText.test.ts`).** Subtitle `Milestone 12 — Intake Manifold Cover` appears in `engineControls.ts` and `index.html`; the `Intake cover` label and the §10.2 note appear verbatim; `exteriorCheckbox.checked = false` and the new cover checkbox `checked = false` are present in source; the old M11 subtitle is absent. *Catches: a default-on checkbox, a wrong/missing label, and a subtitle drift.*
10. **Reference frames (edit `src/ui/referenceFrames.test.ts`).** RF-18…RF-20 exist after RF-17; each validates through the existing loop; each has `intakeCover: true`; RF-18/20 have `sectionMode` off/undefined, RF-19 has `sectionMode: 'x'` and `sectionPositionMm: 300`; RF-1…RF-17 have `intakeCover` undefined/false; the section positions are inside `SECTION_RANGES_MM`; `docs/REFERENCE_FRAMES.md` lists RF-19 in the shared Section-Fill Checklist and states the open-underside exception. *Catches: a `?rf=` URL that silently falls back, a frame with the wrong section/explode state, a stock frame that accidentally turns the cover on, and a missing RF-19 checklist entry.*
11. **Watertight body.** Position-welded boundary-edge audit of the cover body at 1e-5 m finds **0** boundary edges; the body mesh has **exactly 3** closed connected components (thin-wall shell, rear boss, integrated front mount); the lettering mesh has **exactly 45** closed prism components. *Catches: an open shell that the M11 cap builder would chord-close into a fake solid, a non-manifold mesh that would drop cap loops, and a missing/extra body component.*
12. **Frozen-asset identity.** The cover test also hashes the five M8 variant GLBs and `public/Duramax_LLY_2005_66L_V8.glb` and asserts their SHA-256 values are unchanged from `docs/M8-MEASUREMENTS.md`/`docs/M10-MEASUREMENTS.md`; `catalog/modified.json` and `catalog/stock.json` are byte-identical. *Catches: a builder "fixing" the shell or a variant to make the cover fit, or adding a catalog slot.*

The headless tests cannot judge the look. RF-18…RF-20 are the visual gate; that split is the same one used since M2.

---

## 10. UI text

### 10.1 Subtitle

- `index.html` subtitle → `Milestone 12 — Intake Manifold Cover`.
- `src/ui/engineControls.ts` runtime subtitle (`:648-651`) → `Milestone 12 — Intake Manifold Cover`.

### 10.2 Cover control and note (verbatim)

Checkbox label:

```
Intake cover
```

Note immediately below the toggles row:

```
Optional cosmetic cover (GM 21994000) — shows with Exterior or X-Ray and hides the Y-bridge. The moulded "6.6 TURBO DIESEL" legend is an illustrative reconstruction; the planform, dimensions and wall thickness are illustrative placeholders, not measured LLY values.
```

The note uses the existing secondary-note style (`font-size: 10.5px; line-height: 1.35; color: #94a3b8;`) and does not replace the M11 cutaway note. The M10 illustrative caption is unchanged; the cover carries its own on-screen illustrative scope in the note (the M10 caption covers the shell, not a separate add-on).

### 10.3 No other UI change

The controls, readouts, Build panel, Dyno, Sound, captions, labels and the `?section`/`sectionPos`/`?rf` surface are otherwise unchanged. `?rf=RF-18`…`?rf=RF-20` are new; `?rf=RF-1`…`?rf=RF-17` keep their meaning and default the cover off.

---

## 11. Build deliverables (docs and paperwork)

1. **`docs/M12-COVER.md` (new):** the part record — GM `21994000`, LLY application, EPC retention (M8×1.25×113.7 bolt + charge-air-duct clamp), the `6.6 TURBO DIESEL` vs `DURAMAX` evidence conflict, the planform/height/wall table with provenance, **the planform orientation deviation from the survey's wide-rear/narrow-front/front-corner-notch form (clearance-driven, not form-matched)**, **the integrated front mount simplification (a body leg representing, but not modelling, the separate EPC clamp)**, the two markers, the lettering construction and cost, the materials/finish, the labeled omissions (diamond field, exact font, polymer), the M8 variant compatibility table, and the illustrative-scope statement.
2. **`docs/M12-MEASUREMENTS.md` (new):** the measured record — production bundle; the cover build log (triangles, bounds, materials, marker deviations, boundary-edge audit, **file size and page-weight delta**); the shell/V2 clearance audit (including `electronics`); the `?benchmark=1` matrix (desktop/phone × stock/worst × cover off/on, plus cover-on Section X @ 300) with the D-033 verdict table and headroom; **the cover section-cap triangle count at X = 300 (≤ 300)**; the three frame captures with SHA-256 and checklist results; **the manual RF-1…RF-17 invariance comparison notes**; the frozen-file audit; the exact commands used.
3. **`docs/REFERENCE_FRAMES.md`:** add RF-18…RF-20 definitions, images and checklists; add the three rows to the summary table; update the intro count from seventeen to twenty and the provenance line to include M12; **add RF-19 to the shared Section-Fill Checklist header/list and state the open-underside exception (exact text §12.6)**.
4. **`docs/ASSET_CONTRACT.md`:** add the M12 scene-placed cosmetic add-on sub-class (exact text §12.4).
5. **`docs/THREE_API_NOTES.md`:** add the M12 section (exact text §12.5).
6. **`docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`:** exact text in §12.1–§12.3.
7. **`docs/M10-EXTERIOR.md`, `docs/M10-MEASUREMENTS.md`, `docs/M11-*`:** frozen; do not edit. The M12 docs link back to them.
8. **`assets-src/PROVENANCE.md`:** add the cover row (model path, EPC/photo references, `illustrative` shape/dimensions/lettering, `verified` part number/retention features); amend the existing `intakeBridge` row's parenthetical so it reads `excluded from the M10 shell by D-041; available as the separate M12 add-on` (the M10 shell is still cover-free). No other existing row changes.
9. **`index.html`:** subtitle only. **No `src/renderer/exteriorLoader.ts`, `layout.ts`, `partLoader.ts`, `partVariants.ts`, `variantLoader.ts`, `viewLayout.ts`, `sectionCaps.ts`, catalog, config, core, perf or existing asset changes.**

---

## 12. Exact paperwork text

### 12.1 `docs/PLAN.md`

After the Milestone 11 block, add:

> 12. **Plastic upper intake manifold cover (optional cosmetic)**
>     - Add the LLY plastic upper intake manifold cover (GM `21994000`) as an optional, default-off cosmetic part: a project-frame scene-placed cover over the Y-bridge with the moulded `6.6 TURBO DIESEL` legend as raised geometry, its own Views toggle independent of Exterior, a front charge-air-duct clamp and a rear bracket bolt, and a +Z explode.
>     - Exit: the cover toggle defaults off and RF-1…RF-17 are visually unchanged (manual comparison); RF-18 (cover on), RF-19 (cover section) and RF-20 (cover exploded) pass their checklists; D-033 passes on both tiers with measured numbers (cover ≤ 1,800 triangles, +2 draw calls, 0 texture bytes); all five M8 visual variants remain compatible (V2 computed surface clearance; V1/V3/V4 conservative envelope separations); PLAN/DECISIONS/OPEN_ITEMS/ASSET_CONTRACT are updated in the same PR.

Replace the post-milestone candidates line with:

> After 12: stock vehicle-side hardware models, the remaining internal-part visual variants (rods, injectors, CP3, camshaft, heads), real wall-thickness section geometry, an analytic coil section for the valve springs (currently capped through a solid hull proxy), and shareable builds (deprioritised by the owner, 2026-11-15 — D-045) are candidates.

### 12.2 `docs/DECISIONS.md`

Add under a new `## 2026-11-15 — Milestone 12 spec` heading:

> - **D-046 Optional LLY intake manifold cover (Milestone 12).** GM `21994000` is added as an **optional, default-off cosmetic cover** over the existing Y-bridge, with its own **`Intake cover`** Views toggle independent of Exterior; it is visible only when its toggle is on and the exterior context is shown, it hides the Y-bridge (the reason M10 excluded it, D-041), and it is off on every load so RF-1…RF-17 and the M10 Y-bridge proof are unchanged. The asset is a new **scene-placed cosmetic add-on** (D-038 extension): project-frame, Y-up export, no pivot/animation, `if_*` markers, untextured, two `MeshStandardMaterial`s, and a **≤ 1,800-triangle** cap (≤ 1,200 body + ≤ 600 lettering; letters are raised rectilinear stroke geometry, not a texture/decal). Dimensions, wall thickness, letter metrics, texture pitch and polymer are **not published**; the planform, 2.5 mm wall, 47.2 mm body height and marker positions are clearance-driven placeholders sized to the measured M10 shell, not form-matched to the EPC/photo form (Y-bridge max top 351.954 mm; rear mount contact 333.4 mm; resonator max X 236.546; highest cold-charge-pipe vertex under the footprint 364.828, group max 369.078 outside the relief). Measured clearance: 5.172 mm to the cold charge pipe, 8.084 mm to the alternator, 8.246 mm to the P/S pump, 8.793 mm to the resonator, 18.046 mm to the Y-bridge MAP sensor, 25.908 mm to the electronics loom, 67.070 mm to cp3Fuel; 0 shell vertices inside the body envelope; V2 high-flow intake tube surface clearance 6.567 mm (conservative r = 58 mm). **Lettering wording:** the evidence (GM EPC line drawing + used-parts photographs) says `6.6 TURBO DIESEL`; no source shows a `DURAMAX` wordmark on 21994000, so the model does not fabricate one and the brief's `DURAMAX` wording is recorded as a research conflict. **Interactions:** explodes +Z 260 mm; is a static `skipWhenGhosted` section-cap source; X-Ray ghosts it at 0.22 opacity; labels are unchanged (no 24th anchor); all five M8 visual variants remain compatible (V2 computed surface clearance; V1/V3/V4 conservative envelope separations). The front mount is a simplified integrated representation of the separate EPC clamp, recorded in docs/M12-COVER.md; the planform is a clearance-driven placeholder, not form-matched to the survey form. **Budgets:** 1,800 triangles and +2 draw calls, no texture bytes, cover GLB ≤ 64 KiB; stock scene 308,324 → 310,124 (desktop 86.15 %, phone 96.91 %), worst case 304,632 → 306,432 (85.12 % / 95.76 %); calls 96/58 → 98/60 stock and 97/60 → 99/62 worst; D-033 is not raised.

### 12.3 `docs/OPEN_ITEMS.md`

Remove the deferred-candidate item:

> `- [ ] **LLY plastic upper intake manifold cover (`21994000`) and its lettering** …` (`docs/OPEN_ITEMS.md:20`)

Add to **Watch items**:

> - [ ] **LLY intake cover (`21994000`) dimensions, wall thickness, letter metrics and diamond-field pitch** — no GM dimensioned drawing or measured sample exists; M12 pins labeled placeholders (planform, 2.5 mm wall, 47.2 mm body height, 22 mm letter cap height) sized to the measured M10 shell. The planform is a **clearance-driven placeholder, not form-matched** to the EPC/photo form (wide rear / narrower front / front-corner notch); the orientation deviation is recorded in the M12 spec §15.7 and `docs/M12-COVER.md`. Revisit with a dimensioned drawing or a measured part.
> - [ ] **Intake cover legend wording** — GM EPC and used-parts photos show `6.6 TURBO DIESEL`; no source shows a `DURAMAX` wordmark on 21994000. M12 models the evidenced legend as illustrative geometry and does not fabricate the brand wordmark. Revisit with a GM text/print source.
> - [ ] **Intake cover material/finish and fastener torque** — "moulded black plastic" is supported by the photos/EPC; the polymer family, colour code, diamond-field pitch/depth and the **rear cover-bolt torque** are not published. A GM service record in the M10 survey gives the **front clamp 6 N·m (53 lb·in)**, adopted as a prior-project record; M12 uses a matte-black PBR approximation, models the M8×1.25×113.7 bolt without a torque claim, and displays no torque.
> - [ ] **Intake-cover fitment years** — GM EPC TC00-668 lists 2004–2006 CK2/3 (LLY); an eBay title also claims 2005–2007 LBZ. M12 follows the LLY EPC and does not claim LBZ coverage.
> - [ ] **V2 high-flow intake / cover clearance is a planning computation** — 6.567 mm minimum surface clearance (r = 58 mm coupler, 4,001-point centreline sampling); the build's asset test re-runs it. Revisit if the V2 route or cover planform changes.

### 12.4 `docs/ASSET_CONTRACT.md`

Append to the asset-class section:

> ### M12 scene-placed cosmetic add-on (D-038 extension)
>
> The LLY intake cover (`public/models/intake_cover_lly.glb`) uses the scene-placed class with these additions: one contract **root Group** `intake_cover_lly` (a deliberate extension of the M8 single-root-mesh rule, needed for two material-separated meshes); two mesh leaves `ext_intake_cover_body` / `ext_intake_cover_lettering`; `if_intake_cover_rear_bolt` / `if_intake_cover_duct_clamp` empty markers; no pivot/animation; project-frame authoring at final positions; untextured `MeshStandardMaterial` (≤ 2 materials, no images/textures/UVs); total triangle cap 1,800 (body ≤ 1,200, lettering ≤ 600); file-size cap 64 KiB (65,536 B). It is loaded through `loadVariantScene` and registered as a static section-cap source; it is not a catalog variant and does not add a slot.

### 12.5 `docs/THREE_API_NOTES.md`

Append:

> ## Milestone 12 Scene-Placed Add-On APIs (0.187.0)
>
> - `loadVariantScene` wraps a Y-up project-frame GLB once with `wrapInPartLocalFrame` (+90° X) and returns a `Group`; the intake cover uses the same path, with no new loader or dependency.
> - `prepareCapSource` accepts a `Group`: it caches child-mesh entries and world matrices, so a scene-placed add-on can be a static cap source; `skipWhenGhosted: true` suppresses its caps while its materials are ghosted.
> - The cover's materials join the existing M4 `clippableMaterials` set and the M4 `clipShadows`/X-Ray snapshot path; no new render pass, stencil buffer, render target or shader is introduced.

### 12.6 `docs/REFERENCE_FRAMES.md`

Change the shared checklist header to:

> ## Section-Fill Checklist (Shared by `RF-6`, `RF-14`…`RF-17`, and `RF-19`, Milestone 11 Spec §7.2, extended M12)

and the intro sentence to list `RF-19` among the section-active frames. Add to item 1:

> The M12 cover's open thin-walled underside is a material band at the cut: the cover cap must show the wall band and leave the open cavity as air, not a filled slab. The "no dark cavity along the cut" rule applies to the cut wall material, not to the intentionally open underside.

---

## 13. Acceptance criteria (Buckley verifies from a fresh clone)

1. **Frozen audit:** `git diff main -- src/core src/perf catalog src/config src/audio src/assets .github vite.config.ts tsconfig.json package.json package-lock.json public/models/rot_piston_c1_stock.glb public/models/rot_conrod_c1_stock.glb public/models/rot_crankthrow_c1_stock.glb public/models/sta_head_c1_stock.glb public/models/val_bridge_stock.glb public/models/val_pushrod_stock.glb public/models/val_rocker_stock.glb public/models/val_valve_exhaust_stock.glb public/models/val_valve_intake_stock.glb public/models/fuel_injector_c1_stock.glb public/models/variants public/Duramax_LLY_2005_66L_V8.glb public/hdri public/legacy assets-src/blender/build_shell.py assets-src/blender/build_variants.py assets-src/dimensions.json assets-src/variant_dimensions.json src/renderer/exteriorLoader.ts src/renderer/layout.ts src/renderer/partLoader.ts src/renderer/partVariants.ts src/renderer/variantLoader.ts src/renderer/viewLayout.ts src/renderer/sectionCaps.ts docs/M2-MEASUREMENTS.md docs/M3-MEASUREMENTS.md docs/M4-MEASUREMENTS.md docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M7-MEASUREMENTS.md docs/M8-VARIANTS.md docs/M8-MEASUREMENTS.md docs/M9-SOUND.md docs/M9-MEASUREMENTS.md docs/M10-EXTERIOR.md docs/M10-MEASUREMENTS.md docs/M11-CUTAWAYS.md docs/M11-MEASUREMENTS.md docs/specs/M0-* … docs/specs/M11-* docs/research/L7-* docs/research/M8-* docs/research/M9-* docs/research/M10-* docs/research/M11-* docs/PLANNING.md docs/ORCHESTRATOR.md` is empty. The five M8 variant GLBs and the M10 shell are byte-identical.
2. **Fresh-clone gates:** `npm ci`, `npm run typecheck`, `npm test`, `npm run build` pass on Node 24. Exactly the four test files named in §9 are touched (1 new + 3 edited); no other test file is edited.
3. **Asset audit:** `public/models/intake_cover_lly.glb` is ≤ **64 KiB (65,536 B)**; has the two leaf meshes, two materials, no textures/UVs/skins/morphs/animations, body ≤ 1,200 tris, lettering **exactly 540** tris (cap 600), total ≤ 1,800; bounds inside X 245…400, Y −120…120, Z 333.4…418; markers within 0.5 mm; body watertight (0 boundary edges at 1e-5 m) with **exactly 3** closed body components and **45** closed lettering components; no `DURAMAX` string appears.
4. **Clearance audit:** the §4.5 table reproduces (0 shell vertices inside the body envelope; `chargePipeCold` ≥ 5.0, `alternator` ≥ 8.0, `acComp` ≥ 8.0, `resonator` ≥ 8.5, `intakeBridge` ≥ 18.0, `electronics` ≥ 25.9, `intake` ≥ 48.0, `cp3Fuel` ≥ 67.0; all remaining groups ≥ 73.4, minimum `beltDrive` 73.407; the `chargePipeCold` group max-Z vertex (348.544, −140.375, 369.078) is outside the planform; V2 ≥ 6.0 mm at r = 58); the `docs/M12-MEASUREMENTS.md` records the exact values.
5. **Budgets:** the `?benchmark=1` matrix (desktop 1440×900 Full, phone 390×844 Phone; stock and worst-case 5-variant; cover off and on; plus cover-on Section X @ 300) reports scene triangles **≤ 310,124 / ≤ 306,432** with cover on, calls **98/60** stock and **99/62** worst, VRAM **20.75/4.75 MiB**, and p95 within +0.30 ms of the M11 detail rows (desktop 16.8 ms per §3.2, phone 17.0 ms per §3.3) with 0 dropped frames; the measured cover is ≤ 1,800 triangles, the cover GLB is ≤ 64 KiB with its actual bytes and page-weight delta recorded, the cover section cap at X = 300 is ≤ 300 triangles, and the section cap total is ≤ 16,000. Any breach is a stop-and-report.
6. **Visual proof:** RF-18, RF-19 and RF-20 exist at the pinned poses and every checklist item in §8.1 passes; the cover's section face in RF-19 is solid/hatched; the exploded offset in RF-20 is exactly +260 mm.
7. **Invariance (manual visual gate):** with the cover off, live re-captures of RF-1…RF-17 are compared visually in the 3D viewport region against the committed PNGs (subtitle masked) by the reviewer, with the comparison and any difference recorded in `docs/M12-MEASUREMENTS.md`; the 3D content must be visually unchanged, and any visible difference is a stop-and-report. No pixel-diff harness is claimed or required. With the cover on, no existing frame is re-baselined.
8. **Interaction checks:** the `Intake cover` checkbox is unchecked on a fresh load; checking it with Exterior off shows no cover (and the note); checking it with Exterior on shows the cover; X-Ray ghosts the cover and suppresses its cap; **toggling X-Ray on before the cover asset finishes loading still leaves the cover ghosted and its cap suppressed (the load-order regression check)**; Section X @ 300 with the cover on shows the thin wall band and the open underside cavity (not a filled slab); Explode 100 lifts the cover +260 mm; the five M8 variants all render with the cover on without visible clipping; the 23 labels are unchanged.
9. **Docs:** `docs/M12-COVER.md` and `docs/M12-MEASUREMENTS.md` are complete per §11 (including the planform deviation and the integrated front mount simplification); `docs/REFERENCE_FRAMES.md` includes RF-19 in the shared Section-Fill Checklist with the open-underside exception; `docs/ASSET_CONTRACT.md`, `docs/THREE_API_NOTES.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md` match §11/§12 exactly; prior docs are byte-identical.
10. **Outside review (D-021)** recorded for the milestone-exit PR.

---

## 14. Frozen and changed files

**Frozen — no changes:**

- `src/core/**` (including `interfaces.ts`, D-010), `src/perf/**`, `src/config/**`, `src/audio/**`, `src/assets/**`.
- `catalog/stock.json`, `catalog/modified.json`, the catalog schema and `src/catalog/**`.
- `src/renderer/exteriorLoader.ts`, `layout.ts`, `partLoader.ts`, `partVariants.ts`, `variantLoader.ts`, `viewLayout.ts`, `sectionCaps.ts`.
- `public/Duramax_LLY_2005_66L_V8.glb`; the ten internal part GLBs; the five `public/models/variants/*.glb`; `public/hdri/**`; `public/legacy/**`.
- `assets-src/blender/build_shell.py`, `assets-src/blender/build_variants.py`, `assets-src/dimensions.json`, `assets-src/variant_dimensions.json`; all existing `assets-src` reference files.
- `package.json`, `package-lock.json`, `.github/**`, `vite.config.ts`, `tsconfig.json`.
- `docs/M2`–`docs/M11` docs, `docs/specs/M0-*`…`docs/specs/M11-*`, `docs/research/L7-*`, `M8-*`, `M9-*`, `M10-*`, `M11-*`, `docs/PLANNING.md`, `docs/ORCHESTRATOR.md`.

**Changed / new (expected):**

- `src/renderer/intakeCover.ts` *(new)* — constants, planform/markers, visibility/explode helpers, and the load-order-safe `createExteriorGhostRegistry` used by the renderer and the runtime test.
- `src/renderer/intakeCover.test.ts` *(new)* — tests 1–7, 11–12.
- `src/renderer/engineScene.ts` — cover load/state/sync/ghost/cap/stats/dispose; additive controller fields.
- `src/renderer/index.ts` — export the new module's public names (tests only).
- `src/renderer/partVariants.test.ts` — extend the budget guard (test 8).
- `src/ui/engineControls.ts` — cover checkbox + note + subtitle + `setIntakeCoverChecked` + option.
- `src/main.ts` — callback, `applyReferenceFrame` cover flag, `cover=0|1` benchmark param, load gate.
- `src/ui/referenceFrames.ts` — `intakeCover` field + RF-18…RF-20.
- `src/ui/referenceFrames.test.ts` — expected frames/flags (test 10).
- `src/ui/uiText.test.ts` — subtitle/label/note literals (test 9).
- `index.html` — subtitle only.
- `assets-src/cover_dimensions.json` *(new)*; `assets-src/blender/build_intake_cover.py` *(new)*.
- `public/models/intake_cover_lly.glb` *(new)*.
- `docs/M12-COVER.md`, `docs/M12-MEASUREMENTS.md` *(new)*; `docs/REFERENCE_FRAMES.md`, `docs/ASSET_CONTRACT.md`, `docs/THREE_API_NOTES.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`, `assets-src/PROVENANCE.md`; `docs/reference-frames/RF-18.png`…`RF-20.png` *(new)*.
- `docs/research/M12-intake-cover-survey.md` and `docs/specs/M12-intake-cover.md` are the planning package already on `plan/m12-intake-cover`; the build branch may carry them from the planning branch, but must not edit them.

**If you believe any other file must change, stop and report it instead of changing it.**

---

## 15. Pre-build self-check (recorded)

Every number below was produced before this spec was finalised, from committed/measured values, the frozen shell asset, the frozen M8 control points, and the GM EPC/photos. The planning artifacts are not committed by the build; the arithmetic and the measurements are re-runnable from the values quoted here.

### 15.1 Measurement environment

- Host: Linux x86_64 container, Node `v24.22.3`, Three.js `0.187.0`, Vite `7.3.8`.
- Production bundle: `npm run build` at `e22d2b0` → `dist/assets/index-zHhTPqQm.js` (821.12 kB / 219.67 kB gzip).
- Server: `npx vite preview --port 4173 --strictPort`.
- Browser: Chrome for Testing `157.0.8103.78` headless (SwiftShader), CDP `Runtime.evaluate` reading `window.__engineScene.getRenderStats()`.
- Full-tier geometry read at 640×480 (software WebGL could not practically render 1440×900); phone at 390×844. The triangle/draw-call counters are viewport-independent; the build must re-measure p95 on the reference GPU at 1440×900 / 390×844.

### 15.2 Current shipped scene — measured (cover off)

```
desktop full, exterior on, stock        : 96 calls / 579,484 submitted tris / 308,324 scene tris / 20.75 MiB
desktop full, exterior on, 5 variants   : 97 calls / 568,880 submitted tris / 304,632 scene tris / 20.75 MiB
phone, exterior on, stock               : 58 calls / 307,876 submitted tris / 308,324 scene tris / 4.75 MiB
phone, exterior on, 5 variants          : 60 calls / 304,512 submitted tris / 304,632 scene tris / 4.75 MiB
```

Code arithmetic: `270,080` internal + `1,080` main shaft + `64` ground + `37,100` shell = `308,324`. Worst case: `270,080 − 6,912` (piston swap) + `1,080 + 64 + (37,100 − 6,500)` (hidden preserved subtrees) + `9,720` external variants = `304,632`.

### 15.3 Budget arithmetic with the cover (cap 1,800)

```
stock scene + cover        = 308,324 + 1,800 = 310,124
desktop headroom           = 360,000 − 310,124 = 49,876 (13.85 %)
phone headroom             = 320,000 − 310,124 = 9,876 (3.09 %)
stock submitted + cover    = 579,484 + 1,800 = 581,284 (desktop)
                             307,876 + 1,800 = 309,676 (phone)
stock calls + cover        = 96 + 2 = 98 (desktop) ; 58 + 2 = 60 (phone)

worst scene + cover        = 304,632 + 1,800 = 306,432
desktop headroom           = 360,000 − 306,432 = 53,568 (14.88 %)
phone headroom             = 320,000 − 306,432 = 13,568 (4.24 %)
worst submitted + cover    = 568,880 + 1,800 = 570,680 (desktop)
                             304,512 + 1,800 = 306,312 (phone)
worst calls + cover        = 97 + 2 = 99 (desktop) ; 60 + 2 = 62 (phone)

VRAM                       = 20.75 / 4.75 MiB (no cover textures)
section state + cover      = +1,800 scene tris + ≤300 cap tris; cap ceiling 16,000 unchanged
```

Among measured states, the phone stock scene is the tightest: **9,876 triangles (3.09 %) headroom**. The derived cap-guard in test 8 is tighter at **2,632 triangles (0.82 %)** and remains a PASS. The cover cap is a cap, not a measured asset; the build records the actual (the body is a simple shell, so the actual is expected below 1,800). Page weight: cover GLB cap `65,536 B` = `+0.652 %` of the M9 baseline `10,050,510 B` raw; actual bytes recorded. Cover section cap at X = 300: actual recorded, must be `≤ 300` triangles.

### 15.4 Cover placement and clearance — measured against the shipped shell

Method: raw GLB parse (same `p_mm = (1000·g_x, −1000·g_z, 1000·g_y)` transform as `shellAssets.test.ts`), every vertex of the 22 shell groups, point-in-polygon against P1–P6, body envelope Z 370.0–417.2. Results:

```
shell vertices inside body envelope           : 0
chargePipeCold min clearance                  : 5.172 mm at (342.338, −99.358, 364.828) [highest under footprint]
chargePipeCold group max Z                    : 369.078 mm at (348.544, −140.375) [outside planform; 0.922 mm vertical gap]
alternator min clearance                      : 8.084 mm at (404.600, −124.509, 365.116)
acComp (P/S pump) min clearance               : 8.246 mm at (376.000, 128.000, 368.000)
resonator min clearance                       : 8.793 mm at (236.207, 22.301, 387.112) [rear edge 245.0; max X 236.546; gap 8.454]
intakeBridge min clearance                    : 18.046 mm at (319.256, 8.000, 351.954)
electronics (loom) min clearance              : 25.908 mm at (249.485, 91.198, 344.092) [inside planform; obstacle]
intake duct min clearance                     : 48.049 mm at (302.417, −152.731, 447.666)
cp3Fuel min clearance                         : 67.070 mm at (291.579, 165.219, 320.467)
beltDrive (next-lowest remaining)             : 73.407 mm at (472.000, 134.305, 414.156)
lowest shell vertex above cover top           : none inside the planform
```

The body envelope starts at Z 370.0: 18.046 mm above the highest Y-bridge top (351.954), 5.172 mm above the highest cold-pipe vertex under the footprint (364.828), and 36.6 mm above the rear mount's local top (333.4). The charge-pipe group max (369.078) is outside the planform at the rear-right relief, with only a 0.922 mm vertical gap, so that relief is load-bearing; the test pins the vertex as outside. The rear-right relief also removes the corner nearest the stock intake duct and V2 tube; the alternator (8.084 mm) and P/S pump (8.246 mm) sit just outside the side edges. The electronics loom is the lowest group not among the original six named, at 25.908 mm, and is treated as an obstacle. The rear edge is 8.454 mm forward of the resonator max X (236.546). The rear tower contact at 333.4 and the front mount at 353.4 are the only intended contacts; they are below the body envelope, so they do not enter the inside count.

### 15.5 Lettering cost

```
glyph plan:
  6.6     : 4 + 1 + 4 = 9 stroke prisms
  TURBO   : T2 + U3 + R4 + B5 + O4 = 18
  DIESEL  : D4 + I1 + E4 + S3 + E4 + L2 = 18
  total   : 45 stroke prisms
triangles : 45 × 12 = 540
cap       : 600
mesh      : 1 merged lettering mesh, 1 material, +1 draw call
```

The 12-triangle count is a closed rectangular prism (6 quads). The build must keep the 45 prisms as separate closed components and must not merge coplanar faces across strokes; the asset test pins exactly 540 triangles and 45 components (cap 600).

### 15.6 V2 high-flow intake clearance

From the frozen V2 control points (`docs/M8-VARIANTS.md` §3.2: P0…P8) and the conservative Ø116 mm coupler radius (r = 58), sampled at 4,001 points per segment against the cover envelope (planform + Z 370.0–417.2):

```
minimum centreline-to-cover distance : 64.567 mm
surface clearance at r = 58           : 6.567 mm
surface clearance at r = 50.8         : 13.767 mm
```

This is a planning computation, not a triangle-level intersection. It is positive, so **no compatibility rule is added**; the asset test in §9 test 4 pins it so a future edit fails loudly.

### 15.7 Conflicts found while drafting (all resolved in the spec, none silently)

1. **The brief says `DURAMAX` lettering; the evidence says `6.6 TURBO DIESEL`.** The GM EPC line drawing and seven used-parts photographs show `6.6` / `TURBO` / `DIESEL`; no source shows a `DURAMAX` wordmark on `21994000`. Resolved by modelling the evidenced legend and recording the conflict; a fabricated wordmark would violate D-012. This is the milestone's one direct brief-vs-evidence conflict.
2. **The brief calls it the "intake manifold cover"; the legacy viewer calls it a resonator; GM calls it `COVER, UPR INT MANIF`.** Resolved by using GM's name and part number; the cover sits over the Y-bridge/intake valley and is the same object the M10 survey recorded.
3. **No published cover dimensions.** Resolved with labeled placeholders sized to the measured shell; the spec never presents them as LLY measurements.
4. **M10 excluded the cover because it hides the Y-bridge.** Resolved by making it optional and default-off, so M10's proof and all 17 existing frames survive; the cover is only visible when the user asks for it.
5. **The cover could clip the cold charge pipe/alternator/P/S pump/resonator/electronics.** Resolved by the clearance-driven planform, the measured-from-code underside/height, and the rear-right relief; the clearance audit records 5.172 mm minimum at the highest under-footprint pipe vertex, 25.908 mm to the electronics loom, and 0 vertices inside; the pipe's 369.078 mm group max sits outside the relief (0.922 mm vertical gap).
6. **The cover could clash with the M8 `intake_highflow` tube.** Resolved by computing the V2 surface clearance (6.567 mm at r = 58) and adding the asset test; no catalog rule is needed.
7. **The cover's thin open underside could cap as a chord-closed solid or a missing face.** Resolved by authoring a watertight thin-walled shell with a 2.5 mm bottom rim (a ring, not a plate) and closed boss/front-mount solids, so the M11 cap is the material band and the open underside is not filled; test 11 pins watertightness/component counts and RF-19 shows the open cavity.
8. **The legacy viewer says ABS; no GM material callout exists.** Resolved by using a matte-black PBR approximation and recording ABS as legacy-only/not adopted.
9. **Fitment years conflict (LLY 2004–2006 vs eBay 2005–2007 LBZ).** Resolved by following the GM EPC's LLY application and not claiming LBZ coverage; recorded in OPEN_ITEMS.
10. **The survey's form evidence is a wide rear / narrower front / front-corner notch; this planform is wide front / narrow rear with a rear-right relief.** Not silently reconciled: re-orienting to the form would put the cover into the stock intake-duct/V2 corridor that the rear-right relief exists to clear. The planform is therefore labelled a **clearance-driven placeholder, not form-matched**, and the deviation is recorded here and in `docs/M12-COVER.md`.
11. **The EPC's front clamp is a separate item (003); the model uses a simplified integrated front mount.** Recorded as a cosmetic simplification in `docs/M12-COVER.md`; the spec does not claim the leg is the EPC clamp.

### 15.8 Number provenance

| Number | Value | Derivation / source |
| --- | ---: | --- |
| Cover triangles | 1,800 budget cap (1,200 body cap + 600 lettering cap; cap-conservative total 1,740) | Design budget; lettering 45×12=540 computed |
| Cover draw calls | +2 | Two meshes/materials |
| Cover texture bytes | 0 | No textures/images/UVs |
| Cover envelope | X 245…400, Y −120…120, Z 333.4…418 | Planform + markers + letter top |
| Body height | 47.2 mm | 417.2 − 370.0 |
| Wall | 2.5 mm | Labeled placeholder |
| Letter relief | 0.8 mm | Labeled placeholder |
| Marker positions | (260,0,333.4), (372,−95.4,353.4) | Labeled placeholders derived from measured shell |
| Shell Y-bridge | X 214…346.4, Y ±144.8, Z 234.3…352.0 | `docs/M10-MEASUREMENTS.md:43`; re-measured |
| Shell resonator | X 92…236.546, Y 6.6…112, Z 324…556 | `docs/M10-MEASUREMENTS.md:42` (rounded to 236.5); re-measured |
| Cold pipe, highest under footprint / group max | 364.828 mm / 369.078 mm (outside relief; 0.922 mm vertical gap) | measured shell vertices |
| Clearances | 5.172 / 8.084 / 8.246 / 8.793 / 18.046 / 25.908 / 48.049 / 67.070 mm; next lowest 73.407 | measured shell vertices vs body envelope |
| V2 clearance | 6.567 mm (r=58) / 13.767 mm (r=50.8) | frozen V2 control points + radii; 4,001-point sampling |
| Current scene | 308,324 / 304,632 | measured this session; code arithmetic |
| D-033 caps | 360,000/320,000; 700,000/400,000; 250/120; 64/32 MiB | `docs/M2-MEASUREMENTS.md:120-126` |
| Headroom | 49,876 / 9,876 stock; 53,568 / 13,568 worst | computed §15.3 |
| Cover GLB size | ≤ 64 KiB (65,536 B); actual recorded | design cap + build record; page-weight delta +0.652 % at cap vs 10,050,510 B |
| V1/V3/V4 envelope separations | 197.88 / 358.80 / 352.68 mm | actual variant bounds (M8 measurements), not vertex-level clearances |

### 15.9 M8 variant envelope separations (V1/V3/V4)

Conservative separations from the actual variant bounds in `docs/M8-MEASUREMENTS.md:13-16`:

```
turbo_large max X 47.12            : 245.0 - 47.12 = 197.88 mm
exhaust_4in max X -113.80          : 245.0 - (-113.80) = 358.80 mm
intercooler_upgraded min Y 472.68  : 472.68 - 120.0 = 352.68 mm
```

These are envelope separations, not vertex-level clearances; V2 is the computed surface clearance in §15.6. The values are conservative (the shell/envelope bounds used in the earlier draft gave 195.2 / 355 / 310 mm) and are labelled as such in §6.6.

---

## 16. Handoff

Work on branch `m12-intake-cover` in the local clone, created from `main` at `e22d2b0`. Implement in this order:

1. **`src/renderer/intakeCover.ts`** — constants, planform/markers, visibility/explode helpers, no Three.js import. Keep the geometry constants in this one module so the asset test and the renderer cannot drift.
2. **`assets-src/cover_dimensions.json` + `assets-src/blender/build_intake_cover.py`** — build the closed thin-walled body, rear boss and simplified front mount, and the 45-stroke lettering; export Y-up; assert the triangle caps, bounds, marker positions, watertightness and material count in the build log. Produce `public/models/intake_cover_lly.glb`.
3. **`engineScene.ts` seams** — load via `loadVariantScene`; state/visibility/explode sync; join `clippableMaterials`; register the static `skipWhenGhosted` cap source; register the cover materials with the load-order-safe `createExteriorGhostRegistry` and call `syncExteriorShellState()` after the cover load so a cover loading after X-Ray is ghosted immediately; add the stats fields; dispose; add the controller setters. Keep **one** `renderer.render` call and no new WebGL resources beyond the two cover meshes.
4. **UI and main** — the `Intake cover` checkbox + note, subtitle, callback, `setIntakeCoverChecked`, `?rf` cover flag, `cover=0|1` benchmark param, load gate.
5. **Tests** — `intakeCover.test.ts` (1–7, 11–12), the budget-guard edit (8), the frame list (10), the text literals (9). Run `npm run typecheck && npm test && npm run build`.
6. **Measure and optimise** — build the asset; record actual body/lettering triangles (cap 1,800), GLB bytes, bounds, marker deviations, watertightness/component counts; re-run the shell/V2 clearance audit including `electronics`; run the `?benchmark=1` matrix (stock/worst × desktop/phone × cover off/on, plus cover-on Section X @ 300); record p95/headroom, the cover section-cap triangles (≤ 300) and the page-weight delta. Hit the §7 targets or stop and report.
7. **Frames** — add RF-18…RF-20 to `src/ui/referenceFrames.ts`; capture at 1440×900 → 1024×640; re-capture RF-1…RF-17 with the cover off and compare them visually (manual gate), recording the notes; record everything in `docs/M12-MEASUREMENTS.md`.
8. **Docs** — `docs/M12-COVER.md`, then the §11/§12 paperwork, `docs/REFERENCE_FRAMES.md`, `docs/ASSET_CONTRACT.md`, `docs/THREE_API_NOTES.md`, and the three images.

No new npm dependencies; no catalog, config, core, perf, shell or existing asset changes. When done, push the branch and send a closing summary covering: files changed; test/typecheck/build results; the cover asset audit (triangles, bounds, markers, watertightness, materials); the shell/V2 clearance table; the `?benchmark=1` stock/worst × desktop/phone × cover-off/on rows with headroom; the cover-on Section X @ 300 cap count; the three frame captures with SHA-256 and checklist results; the RF-1…RF-17 manual invariance comparison notes; and anything that deviated from this spec. Buckley verifies from a fresh clone, opens the PR, and merges.
