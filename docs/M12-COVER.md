# Milestone 12 Part Record — Optional LLY Plastic Upper Intake Manifold Cover (GM 21994000)

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) (Milestone 12) · Decisions: D-011, D-012, D-033, D-038, D-041, D-043, **D-046**, **D-047** · Spec: [`docs/specs/M12-intake-cover.md`](./specs/M12-intake-cover.md) · Research survey: [`docs/research/M12-intake-cover-survey.md`](./research/M12-intake-cover-survey.md) · Measurements: [`docs/M12-MEASUREMENTS.md`](./M12-MEASUREMENTS.md) · Asset contract: [`docs/ASSET_CONTRACT.md`](./ASSET_CONTRACT.md) · Provenance: [`assets-src/PROVENANCE.md`](../assets-src/PROVENANCE.md)

---

## 1. Part Identity, Application & Retention (Survey §§2–3, §7)

| Attribute | Value | Grade / Verdict | Source |
| --- | --- | --- | --- |
| GM part number | **`21994000`** | Grade A · **VERIFIED-PUBLISHED** | GM EPC group `TC00-668`, item `002`; GMPartsGiant dealer catalog |
| GM catalog description | **`COVER, UPR INT MANIF (INCLS 3)`** (*Cover Assembly, Upper Intake Manifold*) | Grade A · **VERIFIED-PUBLISHED** | GM EPC `TC00-668` |
| Application | **`CK2, 3 (LLY)`**, model years **2004–2006**, qty `01` | Grade A · **VERIFIED-PUBLISHED** | GM EPC `TC00-668` *(an eBay auction title also claims 2005–2007 LBZ, grade D — recorded in `docs/OPEN_ITEMS.md`, not adopted)* |
| Rear retention | **`11588339`** — `BOLT, TORX HD, SHLDR W/FL WA, M8X1.25X113.7, 15 THD, 9.8, 6174M (UPR INT MANIF CVR BRKT)` | Grade A · **VERIFIED-PUBLISHED** (feature & size); rear-bolt torque **NOT PUBLISHED** | GM EPC `TC00-668`, item `001` |
| Front retention | **`CLAMP, CHRG AIR CLR OTLT DUCT (PART OF 2)`** — included front duct clamp wrapping the charge-air-cooler outlet duct; **6 N·m (53 lb·in)** clamp torque | Grade A · **VERIFIED-PUBLISHED** (feature); **ADOPTED** prior M10 service record for clamp torque | GM EPC `TC00-668`, item `003`; GM SI Intake Manifold Cover Replacement (`docs/research/M10-exterior-accuracy-survey.md:142`); no torque displayed in UI |
| Role in the app | **Optional, default-off cosmetic add-on** (`public/models/intake_cover_lly.glb`) with its own `Intake cover` Views toggle | Design (**D-046**) | Preserves M10's exposed Y-bridge proof (**D-041**) and all 17 existing reference frames by default |

---

## 2. Evidence Conflict: `6.6 TURBO DIESEL` vs. `DURAMAX` Wordmark (Spec §§2.3, 15.7)

- **Brief vs. published evidence:** The original candidate brief referred to *"DURAMAX lettering"*, whereas **every published visual source for GM `21994000`** — the GM EPC exploded-view line drawing (`p013890.jpg`, grade A) and seven multi-angle used-parts photographs (`dieselspecialtyparts.com` image IDs `56802309`–`56802315`, grade D; corroborated by the pre-plan legacy note in `public/legacy/index.html:225`) — shows **`6.6` / `TURBO` / `DIESEL`** stacked on three lines in a smooth central pad.
- **Why `DURAMAX` appears in listings:** Secondary marketplace titles use `"DURAMAX"` as the engine-family keyword (`"05-07 DURAMAX … Part# 21994000"`), not as a transcription of the moulded legend.
- **D-012 resolution:** Fabricating an unverified `DURAMAX` wordmark on `21994000` would violate D-012. Milestone 12 models the evidenced three-line **`6.6` / `TURBO` / `DIESEL`** legend (`INTAKE_COVER_LEGEND = ['6.6', 'TURBO', 'DIESEL']`) and enforces the absence of any `DURAMAX` node, mesh, or material identifier in `src/renderer/intakeCover.test.ts` (Test 6).

---

## 3. Planform, Dimensions, Wall Thickness & Provenance (Spec §4.2)

No GM dimensioned drawing, service specification, or measured physical sample of `21994000` is published (Survey §5). Every coordinate and dimension in [`assets-src/cover_dimensions.json`](../assets-src/cover_dimensions.json) and [`src/renderer/intakeCover.ts`](../src/renderer/intakeCover.ts) is therefore a **labeled placeholder** or **design choice** sized against the measured Milestone 10 exterior shell:

```text
P1 (245.0, -40.0)   P2 (320.0, -40.0)   P3 (320.0, -120.0)
P4 (400.0, -120.0)  P5 (400.0, 120.0)   P6 (245.0,  120.0)
```

| Parameter | Value | Unit | Provenance | Basis |
| --- | ---: | --- | --- | --- |
| Planform vertices `P1`–`P6` | above | mm | **labeled placeholder** (clearance-driven, not form-matched) | Spans `X = 245.0…400.0`, `Y = -120.0…120.0` over `intakeBridge` (`X = 214.0…346.4`, `Y = ±144.8`), stopping `8.454 mm` ahead of `resonator` (`X_max = 236.546`) with a rear-right relief (`P1–P2–P3`) |
| Convex corner fillet radius | `14.0` | mm | **labeled placeholder** | `4` arc segments per convex corner (`P1, P3, P4, P5, P6`), strictly inside the `P1`–`P6` envelope |
| Body bottom rim `Z` | `370.0` | mm | **labeled placeholder**, measured-from-code | `5.172 mm` above highest under-footprint `chargePipeCold` vertex (`364.828`); `chargePipeCold` group max (`369.078` at `(348.544, -140.375)`) lies outside the rear-right relief (`0.922 mm` vertical gap); `18.046 mm` above `intakeBridge` top (`351.954`) |
| Body top pad `Z` | `417.2` | mm | **labeled placeholder**, measured-from-code | `0` shell vertices above `Z = 417.2` inside the planform (`421.15` turbo/duct vertices lie outside the planform) |
| Wall thickness | `2.5` | mm | **labeled placeholder** | Watertight thin-walled shell (`0` boundary edges at `1e-5 m`); inner ceiling at `Z = 414.7 mm`; `2.5 mm` bottom rim ring at `Z = 370.0 mm` |
| Body height | `47.2` | mm | **derived** (`417.2 - 370.0`) | — |
| Letter relief / top `Z` | `0.8` / `418.0` | mm | **labeled placeholder** / **derived** | `0.8 mm` proud of the flat `Z = 417.2 mm` top pad |
| Rear bolt marker `if_intake_cover_rear_bolt` | `[260.0, 0.0, 333.4]` | mm | **labeled placeholder** | `15.0 mm` ahead of `X = 245.0` rear edge; `0.6916 mm` from nearest measured `intakeBridge` top vertex `(260.690, 0.0, 333.356)` under a `Ø15.0 mm` (`r = 7.5 mm`) pad |
| Duct clamp marker `if_intake_cover_duct_clamp` | `[372.0, -95.4, 353.4]` | mm | **labeled placeholder** | `28.0 mm` behind `X = 400.0` front edge; `0.3672 mm` from nearest measured `chargePipeCold` vertex `(371.634, -95.400, 353.367)` |
| Rear tower / front leg exposed lengths | `36.6` / `16.6` | mm | **derived** | `370.0 - 333.4 = 36.6 mm`; `370.0 - 353.4 = 16.6 mm` (closed solids extend into the roof wall to `Z = 415.6 mm` so no gap appears inside the open underside cavity) |
| Explode vector | `[0, 0, 260]` | mm | **design decision** | Rigid `+Z 260 mm` lift (`Z_max = 678.0 mm` at `e = 1`), clearing the shell (`Z_max = 556.0 mm`) and exposing the Y-bridge |
| Triangle counts / caps | `500 / 1,200` body · `540 / 600` lettering · `1,040 / 1,800` total | tris | **measured build** vs. **design cap** | `308` thin-wall shell + `96` rear boss + `96` front mount = `500` body tris; `45 × 12 = 540` lettering tris |
| GLB payload | `46,080` (`45.00 KiB`) / `65,536` (`64 KiB`) cap | B | **measured build** vs. **design cap** | Uncompressed glTF 2.0 binary, `POSITION` + `NORMAL` indexed triangles only |

---

## 4. Recorded Simplifications & Form Deviation (Spec §§4.2–4.4, 11.1, 15.7)

1. **Planform orientation deviation (clearance-driven placeholder, not form-matched):**
   - In the GM EPC illustration (`p013890.jpg`) and the used-parts photographs, the physical `21994000` moulding is **wide at the rear**, tapers to a **narrower front tongue**, and carries a **large notch at one front corner** (Survey §§3–4).
   - On the shipped Milestone 10 exterior shell, re-orienting the cover to wide-rear / narrow-front would drive the rear-right corner directly into the stock `ext_intake_duct` (`48.049 mm` clearance only *with* the rear-right relief) and the M8 `intake_highflow` (V2) 4-inch tube/coupler (`6.567 mm` surface clearance across `P1–P2–P3`), while placing the `chargePipeCold` group max (`Z = 369.078 mm` at `(348.544, -140.375)`) `0.922 mm` beneath the rim without horizontal relief.
   - `P1`–`P6` is therefore intentionally **wide at the front (`X = 320…400, Y = ±120`) and relieved at the rear-right (`X = 245…320, Y = -40…+120`)**, explicitly labelled a **clearance-driven placeholder, not form-matched**.
2. **Simplified integrated front mount (representing, not modelling, the EPC clamp):**
   - In GM EPC `TC00-668`, item `003` (`CLAMP, CHRG AIR CLR OTLT DUCT`) is a separate included band/strap clamp wrapping the charge-air-cooler outlet duct beneath the cover's front underside.
   - Rather than adding a separate metallic clamp mesh/material or claiming unverified clamp strap dimensions, `ext_intake_cover_body` includes a **closed simplified front mounting leg** (`96` triangles, `r = 5.0…7.5 mm`, `Z = 353.4…415.6 mm` above `if_intake_cover_duct_clamp`) merged as the third closed component of the body mesh in `mat_cover_plastic`. It represents the front attachment point cosmetically and is not presented as the EPC clamp itself.
3. **Watertight thin-wall construction (`3` closed body components):**
   - `ext_intake_cover_body` comprises **exactly `3` closed manifold components** (`0` boundary edges and `0` non-manifold edges when position-welded at `1e-5 m`): the `2.5 mm` thin-walled shell (`308` tris, open cavity underneath), the closed rear bolt boss (`96` tris), and the closed simplified front mount leg (`96` tris). Because the shell rim is a closed `2.5 mm` ring rather than a bottom plate, M11's runtime section capper (`src/renderer/sectionCaps.ts`) slices the true `2.5 mm` wall band (`+28` cap triangles at `X = 300 mm`) and leaves the open underside cavity as air (`RF-19`).

---

## 5. Lettering Construction & Cost (Spec §§2.3, 4.6, 15.5)

- **Legend:** `'6.6'` (line 1, rear `-X`), `'TURBO'` (line 2, middle), `'DIESEL'` (line 3, front `+X`), centred on `(X = 345.0, Y = 0.0) mm` so the legend reads upright left-to-right (`-Y → +Y`) when viewing the engine bay from the front (`RF-18`, `RF-20`).
- **Stroke geometry:** Monoline rectilinear stroke font (`4.0 mm` stroke width, `22.0 mm` cap height, `30.0 mm` line pitch, `4.5 mm` inter-glyph gap, `0.8 mm` proud relief from `Z = 417.2 mm` to `418.0 mm`). Not a match to the unpublished GM moulded typeface.
- **Exact prism & triangle budget:**
  - `6.6`: `4 + 1 + 4 = 9` closed rectangular prisms (`108` tris)
  - `TURBO`: `T(2) + U(3) + R(4) + B(5) + O(4) = 18` closed rectangular prisms (`216` tris)
  - `DIESEL`: `D(4) + I(1) + E(4) + S(3) + E(4) + L(2) = 18` closed rectangular prisms (`216` tris)
  - **Total:** **`45` separate closed stroke prism components × `12` triangles = `540` triangles** (cap `600`), merged into one mesh (`ext_intake_cover_lettering`, `+1` draw call) with `≥ 0.20 mm` corner separation between strokes so `1e-5 m` position welding preserves all `45` components.

---

## 6. Materials, Finish & Labeled Omissions (Spec §§2.4, 4.6)

| Material | Linear RGB | Metalness | Roughness | Side | Maps / UVs | Assigned Mesh |
| --- | --- | ---: | ---: | --- | --- | --- |
| `mat_cover_plastic` | `0.028, 0.029, 0.032` | `0.00` | `0.62` | `DoubleSide` | none (`0` B) | `ext_intake_cover_body` (shell, rear boss, front mount/leg) |
| `mat_cover_letter` | `0.032, 0.033, 0.036` | `0.00` | `0.38` | `DoubleSide` | none (`0` B) | `ext_intake_cover_lettering` (`45` stroke prisms) |

**Labeled omissions (deliberate, per D-012):**
1. **Raised diamond/cross-hatch surface field:** Visible in the GM EPC drawing and used-parts photographs across the non-pad top surface, but its pitch, rib width, and relief depth are unpublished; omitted rather than guessed via procedural bumps or normal maps.
2. **Exact moulded sans-serif typeface & variable line sizing:** Photographs show a rounded moulded sans-serif with a larger `6.6` above smaller `TURBO` / `DIESEL`; replaced by the uniform `22 mm` rectilinear stroke placeholder because font metrics are unpublished.
3. **Polymer family & GM colour code:** Unpublished in GM sources (the legacy viewer's `"ABS"` label is grade D and not adopted); represented by the untextured matte/satin black PBR pair above, with slightly lower roughness (`0.38` vs. `0.62`) on `mat_cover_letter` as a studio-lighting legibility choice rather than a separate-material claim.

---

## 7. M8 Visual Variant & Exterior Hardware Compatibility (Spec §6.6, §15.6, §15.9)

No catalog compatibility rule is added (`catalog/stock.json` and `catalog/modified.json` are untouched):

| Variant / Shell System | Spatial Relationship | Clearance / Separation Basis | Value | Verdict |
| --- | --- | --- | ---: | :---: |
| `turbo_large` (V1) | Rear V-valley (`X_max = 47.12 mm`) vs. cover rear (`X_min = 245.0 mm`) | Conservative envelope separation (`245.0 - 47.12`) | **`197.88 mm`** | **Fits** |
| `intake_highflow` (V2) | 4-in (`Ø101.6 mm`) tube + `Ø116 mm` couplers passing outboard/above `P1–P2–P3` relief | Computed surface clearance across frozen `P0`–`P8` polyline (`4,001` samples/segment; `64.567 mm` centreline distance) | **`6.567 mm`** (`r = 58` coupler) / **`13.767 mm`** (`r = 50.8` tube) | **Fits, no rule** |
| `exhaust_4in` (V3) | Rear turbine outlet / downpipe (`X_max = -113.80 mm`) | Conservative envelope separation (`245.0 - (-113.80)`) | **`358.80 mm`** | **Fits** |
| `intercooler_upgraded` (V4) | LH outboard service point (`Y_min = 472.68 mm`) vs. cover LH edge (`Y_max = 120.0 mm`) | Conservative envelope separation (`472.68 - 120.0`) | **`352.68 mm`** | **Fits** |
| `pistons_lowcomp` (V5) | Internal instanced piston crown geometry | No exterior geometry | — | **Fits** |
| Stock `intake` group | Corrugated RH turbo-inlet duct & mouthpiece | Measured vertex clearance to body envelope | **`48.049 mm`** | **Fits** |
| Shell `resonator` | Rear-left Helmholtz box (`X_max = 236.546 mm`) | Axial gap (`245.0 - 236.546`) / 3D vertex clearance | **`8.454 mm`** X gap / **`8.793 mm`** vertex | **Fits** |

---

## 8. On-Screen Illustrative Scope Statement (Spec §10.2)

Displayed immediately beneath the `Intake cover` toggle in the Views panel (`src/ui/engineControls.ts`):

> Optional cosmetic cover (GM 21994000) — shows with Exterior or X-Ray and hides the Y-bridge. The moulded "6.6 TURBO DIESEL" legend is an illustrative reconstruction; the planform, dimensions and wall thickness are illustrative placeholders, not measured LLY values.
