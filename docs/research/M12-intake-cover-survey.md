# M12 Research Survey — LLY Plastic Upper Intake Manifold Cover (GM 21994000)

Project: Duramax LLY Engine Lab · Planning package: this survey + [`docs/specs/M12-intake-cover.md`](../specs/M12-intake-cover.md) · Governing plan: [`docs/PLAN.md`](../PLAN.md) (post-M11 candidates line) · Prior surveys used as the format standard: [`L7-verified-data-survey.md`](./L7-verified-data-survey.md), [`M10-exterior-accuracy-survey.md`](./M10-exterior-accuracy-survey.md) · Prior milestone decision: **D-041** excluded this cover from M10 because it hides the Y-bridge.

Researched 2026-11-15 on branch `plan/m12-intake-cover` from `main` @ `e22d2b0`. **Access mode: HTML/text plus image inspection.** The GM EPC line drawing and seven used-parts photographs were downloaded and inspected; no physical part, no GM dimensioned drawing, and no measured sample were available. Every dimension below is therefore either quoted from a named publication or explicitly marked **NOT PUBLISHED**. No dimension was scaled from a photograph, and no shipping-carton size was adopted as a part dimension.

**Reliability grades** follow the M10 precedent:

| Grade | Meaning |
| --- | --- |
| **A** | GM service/workshop literature, GM owner literature, or an official GM parts catalog (EPC group listing) |
| **B** | Established diesel publication, OE component maker documentation, or OE-maker training material |
| **C** | Specialist vendor fitment spec, vendor technical page, or specialist parts catalog |
| **D** | Forum post, marketing page, auction/photo listing — corroboration or colour only |

**Verdicts:** **VERIFIED-PUBLISHED** (usable as a design fact or value), **VERIFIED-VISUAL** (the feature is legible in a GM illustration and/or multiple photographs but has no dimensional or text specification), **PARTIALLY PUBLISHED** (the fact is published but incomplete or visual-only), **RECORDED-NOT-ADOPTED** (true but not precise enough to pin geometry), **NOT PUBLISHED** (searched and absent — the spec must use a labeled placeholder), **CONFLICT** (sources disagree; both shown).

---

## 1. What this survey had to answer

The M12 brief asks for the LLY plastic upper intake manifold cover — GM part **21994000** — as an optional cosmetic part, and states that it is the only lettered surface on the real engine. Before a spec could be written, this survey had to establish:

1. **Part identity and fitment** — is 21994000 the LLY cover, what does GM call it, and which model years does it serve?
2. **Published appearance** — shape, colour, finish, texture, lettering wording, and the visible mounting features (bolt, clamp, tabs).
3. **Published dimensions** — overall length/width/height, wall thickness, letter height, font, texture pitch, mass. If absent, say so and let the spec use labeled placeholders.
4. **How it attaches** — the GM EPC exploded view shows the fastener and clamp; is any of that dimensioned or torque-specified?
5. **Whether the brief's "DURAMAX lettering" is what the part actually says** — a direct research question, because the answer changes the asset.

A sixth question is repo-side and is answered in the spec's measured self-check, not here: how much room the M10 shell leaves above the Y-bridge, resonator, cold charge pipe, alternator and P/S pump. This survey only establishes what the external sources do and do not say.

---

## 2. Part identity, name and fitment

| Attribute | Value as published | Source | Kind | Grade | Verdict |
| --- | --- | --- | --- | --- | --- |
| GM part number | **21994000** | [GM EPC group TC00-668, item 002](https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178); [GMPartsGiant part page](https://www.gmpartsgiant.com/parts/gm-cover-21994000.html) | official parts catalog (GM EPC mirror / dealer catalog) | A | **VERIFIED-PUBLISHED** |
| GM description | **`COVER, UPR INT MANIF (INCLS 3)`** — "Cover Assembly, Upper Intake Manifold" | [GM EPC TC00-668](https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178); [GMPartsGiant](https://www.gmpartsgiant.com/parts/gm-cover-21994000.html) | official parts catalog | A | **VERIFIED-PUBLISHED** |
| Application in the EPC | **`CK2, 3 (LLY)`**, model years **2004–2006**, quantity **01** | [GM EPC TC00-668](https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178) | official parts catalog | A | **VERIFIED-PUBLISHED** |
| Independent fitment claim | "05-07 DURAMAX Chevy Silverado/GMC Intake Manifold Cover Part# 21994000 OEM LBZ" | [eBay listing title, item 134869344856](https://www.ebay.com.au/itm/134869344856) | auction listing | D | **PARTIALLY PUBLISHED / CONFLICT** — the title extends fitment to 2005–2007 LBZ; the GM EPC application is the 2004–2006 LLY. The spec follows the LLY EPC. |
| Used-parts description | "2006 GMC CHEVROLET 3500 LLY 6.6 DIESEL ENGINE OE INTAKE RESONATOR COVER 21994000" | [Diesel Specialty Parts listing](https://dieselspecialtyparts.com/2006-gmc-chevrolet-3500-lly-66-diesel-engine-oe-intake-resonator-cover-21994000) | used-parts listing | D | **PARTIALLY PUBLISHED** — corroborates the part number and the LLY application; "intake resonator cover" is a seller description, not GM's name. |
| Prior project finding | `21994000 COVER, UPR INT MANIF (INCLS 22, 23)` with a clamp and grommet; "retained by a clamp at the front plus a bracket bolt, lifting off front-first" | [M10 survey §12](./M10-exterior-accuracy-survey.md) citing the same GM EPC group | prior project research / GM EPC | A (for the EPC claim) | **ADOPTED** — the M10 survey already identified the part; M12 adds the appearance and placement work. |

**Identity conclusion:** 21994000 is the LLY upper intake manifold cosmetic cover, a single-piece plastic shield retained by a front clamp and a rear bracket bolt. The EPC's "INCLS 3" refers to the included clamp (item 003 in the fetched group revision; the M10 survey saw a different group revision with more included items). The part is the same object; the included-hardware revision differs by catalog printing.

---

## 3. GM EPC exploded view — published appearance and attachment

The GM EPC group carries a line drawing (`p013890.jpg`) showing the cover in an exploded view above the intake manifold/charge-air duct. It was inspected directly. It is a **GM parts illustration**, not a dimensioned drawing.

| Attribute | Value as published / visible | Source | Kind | Grade | Verdict |
| --- | --- | --- | --- | --- | --- |
| Cover form | A broad, roughly shield-shaped cover with a wide rear section, a narrower front tongue/tab, rounded corners, and a large relief/notch on one front corner | [GM EPC line drawing p013890.jpg](https://gmsklad.ru/gmcat/pics/cadillac/p013890.jpg) | GM parts illustration | A (illustration) | **PARTIALLY PUBLISHED** — shape is visible, no scale |
| Mounting, rear | A long vertical bolt shown entering the cover from above at the rear; EPC item 001 is the bolt | [GM EPC TC00-668](https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178) | official parts catalog | A | **VERIFIED-PUBLISHED** (feature); position not dimensioned |
| Mounting, front | Item 003, **`CLAMP, CHRG AIR CLR OTLT DUCT (PART OF 2)`**, shown at the front underside of the cover; the cover assembly includes it | [GM EPC TC00-668](https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178) | official parts catalog | A | **VERIFIED-PUBLISHED** (feature); clamp diameter not published |
| Rear fastener | **11588339**, `BOLT, TORX HD, SHLDR W/FL WA, M8X1.25X113.7, 15 THD, 9.8, 6174M (UPR INT MANIF CVR BRKT)`, qty 01, 2004–2007 | [GM EPC TC00-668](https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178) | official parts catalog | A | **VERIFIED-PUBLISHED** (size and thread); rear-bolt torque **NOT PUBLISHED**; the front clamp torque is a prior M10 record (6 N·m) |
| Cover-to-manifold interface | The drawing shows the cover sitting over the intake manifold casting, with the front clamp wrapping the charge-air-cooler outlet duct; no gasket is itemised for the cover itself | [GM EPC line drawing](https://gmsklad.ru/gmcat/pics/cadillac/p013890.jpg), [GM EPC group](https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178) | GM parts illustration / catalog | A | **PARTIALLY PUBLISHED** — arrangement visible; no dimensions |
| Overall dimensions on the drawing | **None.** No scale bar, no callouts, no datum coordinates | [GM EPC line drawing](https://gmsklad.ru/gmcat/pics/cadillac/p013890.jpg) | GM parts illustration | A | **NOT PUBLISHED** |

**What the drawing establishes:** the cover is a removable shield over the intake manifold, retained at the rear by a single long M8 bolt and at the front by a clamp around the charge-air-cooler outlet duct. It lifts off front-first. This is enough to design a plausible two-point mount; it is not enough to dimension the cover.

---

## 4. Used-parts photographs — published appearance

Seven photographs on the Diesel Specialty Parts listing (image IDs 56802309–56802315) were downloaded and inspected. They show the same part from top, underside, side and three-quarter views. The listing is a used-parts sale, so the photographs are evidence of appearance, not of a factory-fresh finish or a verified colour code.

| Attribute | Value as published / visible | Source | Kind | Grade | Verdict |
| --- | --- | --- | --- | --- | --- |
| Colour | **Black**, uniform across the visible outer and inner surfaces | [Diesel Specialty Parts photo 56802309](https://files1.kyozou.com/Picture.aspx?width=600&height=600&id=56802309) and 56802310–15 | used-parts photographs | D | **PARTIALLY PUBLISHED** (visual) |
| Material | **Moulded plastic** — the part is a thin-walled, ribbed moulding with a visible open underside and integrally moulded bosses; no metal insert is visible except the bolt hole | same photographs; GM EPC calls it a "cover" with a plastic-type clamp/grommet in the M10 survey's revision | used-parts photographs / GM EPC | D / A | **PARTIALLY PUBLISHED** — "plastic" is supported by the EPC and the photographs; the polymer family is **NOT PUBLISHED** |
| Project-legacy material note | "Molded black grained **ABS** Helmholtz resonator … raised diamond-plate pads and embossed '6.6 TURBO DIESEL' badge" | [`public/legacy/index.html:225`](../../public/legacy/index.html) | pre-plan legacy viewer data (not a published GM source) | D | **RECORDED-NOT-ADOPTED** — corroborates the wording and suggests ABS, but the legacy viewer is not an OEM source and its "resonator" naming differs from GM's "cover" |
| Surface finish | **Matte to satin black**, with a moulded diamond/cross-hatch field over most of the top surface; the field is raised, not printed | same photographs | used-parts photographs | D | **PARTIALLY PUBLISHED** (visual) |
| Texture geometry | A repeating raised diamond/cross-hatch pattern; the pattern pitch, rib width and depth are **not published** and cannot be scaled without a known reference | same photographs | used-parts photographs | D | **NOT PUBLISHED** |
| Lettering | **`6.6` on one line, `TURBO` below it, `DIESEL` below that**, moulded into the top surface in the same black plastic, centred in a smooth pad that interrupts the diamond field | same photographs; also legible in the [GM EPC line drawing](https://gmsklad.ru/gmcat/pics/cadillac/p013890.jpg) | used-parts photographs / GM illustration | D / A | **PARTIALLY PUBLISHED** (visual wording); font, cap height, stroke width and depth **NOT PUBLISHED** |
| Lettering method | Moulded-in relief, same colour as the cover; no separate badge, decal, paint or insert is visible | same photographs | used-parts photographs | D | **PARTIALLY PUBLISHED** (visual) |
| Underside | Open shallow cavity with a perimeter rim, local ribs/bosses and the rear bolt boss; the front clamp is a separate included part and is **not** visible in the top photographs | [Diesel Specialty Parts photo 56802311](https://files1.kyozou.com/Picture.aspx?width=600&height=600&id=56802311) and 56802313 | used-parts photographs | D | **PARTIALLY PUBLISHED** (visual) |
| Part outline | A wide rounded rear, tapering/relieved front, a large notch at one front corner, and a small round tab with a bolt hole at the rear/centre | same photographs | used-parts photographs | D | **PARTIALLY PUBLISHED** (visual) |
| Mass / weight | **Not published**; the listing gives no weight | [Diesel Specialty Parts listing](https://dieselspecialtyparts.com/2006-gmc-chevrolet-3500-lly-66-diesel-engine-oe-intake-resonator-cover-21994000) | used-parts listing | D | **NOT PUBLISHED** |

**Photo interpretation limits.** The photographs are taken on a workshop floor with no scale. Perspective, lens and the unknown part orientation make any pixel-to-millimetre scale a guess; this survey does not use one. The diamond field and the notch are recorded as *form* evidence only.

---

## 5. Dimensions — the honest answers

No dimensioned GM drawing, no GM service dimension, and no measured sample were found. The searches included the part number alone and with "dimensions", "size", "length", "width", "height", "weight", "material" and the GM EPC group name; dealer parts pages returned fitment and price, not dimensions.

| Dimension | Value as published | Source / search | Verdict |
| --- | --- | --- | --- |
| Overall length (front–back, project X) | **Not published** | GM EPC group has no callouts; dealer pages have no dimensions; no listing measured the part | **NOT PUBLISHED** |
| Overall width (across the engine, project Y) | **Not published** | same | **NOT PUBLISHED** |
| Overall height (above the Y-bridge, project Z) | **Not published** | same | **NOT PUBLISHED** |
| Wall thickness | **Not published** | no section drawing or measured sample | **NOT PUBLISHED** |
| Letter cap height / stroke width / relief depth | **Not published** | no GM text spec; photographs have no scale | **NOT PUBLISHED** |
| Diamond-field pitch / rib width / depth | **Not published** | no GM text spec; photographs have no scale | **NOT PUBLISHED** |
| Rear bolt torque | **Not published** | the EPC gives the bolt size/class but no torque; no LLY service procedure for the rear bracket bolt was located | **NOT PUBLISHED** |
| Front clamp torque | **6 N·m (53 lb·in)** | GM SI Intake Manifold Cover Replacement, recorded grade A/ADOPTED in the prior M10 survey (`docs/research/M10-exterior-accuracy-survey.md:142`) | **ADOPTED (prior project record)** — narrows the blanket "fastener torque not published" claim to the rear bolt |
| Mass | **Not published** | no listing weight | **NOT PUBLISHED** |
| Shipping carton dimensions | Occasionally available on dealer/marketplace pages | not a part dimension; **not adopted** | **RECORDED-NOT-ADOPTED** |

**Consequence for M12:** every cover dimension must be a **labeled placeholder** derived from the measured M10 shell and the GM EPC/photo *form* (except the planform orientation, which is a clearance-driven placeholder, not form-matched; §15.7), not presented as a published LLY measurement. The spec's parameter table marks each value `published` / `measured-from-code` / `labeled placeholder`, and the on-screen and docs provenance keeps the cover's proportions illustrative.

---

## 6. Lettering wording — a direct conflict with the milestone brief

The milestone brief calls this "the only lettered surface on the real engine ('DURAMAX' lettering)". The published evidence for 21994000 says something different.

| Attribute | Value as published / visible | Source | Kind | Grade | Verdict |
| --- | --- | --- | --- | --- | --- |
| Wording on 21994000 | **`6.6` / `TURBO` / `DIESEL`** in three stacked lines | [GM EPC line drawing](https://gmsklad.ru/gmcat/pics/cadillac/p013890.jpg); [Diesel Specialty Parts photos 56802309–15](https://dieselspecialtyparts.com/2006-gmc-chevrolet-3500-lly-66-diesel-engine-oe-intake-resonator-cover-21994000) | GM illustration + used-parts photographs | A / D | **VERIFIED-VISUAL** — the legend is legible in both a GM illustration and multiple photographs |
| "DURAMAX" as the cover legend | **No source located shows a DURAMAX wordmark on 21994000.** The word "DURAMAX" appears in auction titles as the engine-family name ("05-07 DURAMAX … Part# 21994000"), not as a description of the cover's lettering | [eBay listing title](https://www.ebay.com.au/itm/134869344856); [GM EPC drawing](https://gmsklad.ru/gmcat/pics/cadillac/p013890.jpg); [Diesel Specialty Parts photos](https://dieselspecialtyparts.com/2006-gmc-chevrolet-3500-lly-66-diesel-engine-oe-intake-resonator-cover-21994000) | auction title / GM illustration / photographs | D / A / D | **CONFLICT** — the brief's "DURAMAX lettering" is not supported for this part; the evidenced legend is `6.6 TURBO DIESEL` |
| Prior project note | "the unverified `6.6 turbo diesel` wording treated as illustrative" | [M10 spec §12.3 / OPEN_ITEMS](../OPEN_ITEMS.md); [M10 survey §12](./M10-exterior-accuracy-survey.md) | prior project record | A / D | **ADOPTED** — M10 already recorded the wording as `6.6 turbo diesel` and illustrative |
| Font / typography | Not published; the photographs show a rounded, moulded sans-serif with a large `6.6` and smaller `TURBO` / `DIESEL` | [Diesel Specialty Parts photos](https://dieselspecialtyparts.com/2006-gmc-chevrolet-3500-lly-66-diesel-engine-oe-intake-resonator-cover-21994000) | used-parts photographs | D | **NOT PUBLISHED** — no font, cap height or spacing data |

**Resolution recorded in the spec:** M12 models the **evidenced `6.6 TURBO DIESEL` legend**, not a fabricated `DURAMAX` wordmark. A `DURAMAX` wordmark would contradict the only published evidence for this part number and would be a made-up detail under D-012. If the owner wants the engine-family wordmark on the cover, that is a separate decision and a different asset, not a silent substitution. The `DURAMAX` wording in the brief is therefore recorded here as **CONFLICT**, not adopted.

---

## 7. Attachment, material and finish — what can and cannot be modelled

| Attribute | Value as published / visible | Source | Grade | Verdict |
| --- | --- | --- | --- | --- |
| Retention | One long M8×1.25×113.7 shoulder bolt at the rear bracket + one front clamp around the charge-air-cooler outlet duct | [GM EPC TC00-668](https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178) | A | **VERIFIED-PUBLISHED** (feature); coordinates **NOT PUBLISHED** |
| Removal direction | Lifts off front-first after the rear bolt and front clamp are released | [M10 survey §12](./M10-exterior-accuracy-survey.md) | A (EPC-derived) | **ADOPTED** (direction), no dimension |
| Cover material | Moulded black plastic; polymer family not stated by GM | photographs + M10 survey | D / A | **PARTIALLY PUBLISHED** — "plastic" supported; exact polymer **NOT PUBLISHED** |
| Surface finish | Matte/satin black with a raised diamond field and moulded lettering | photographs | D | **PARTIALLY PUBLISHED** (visual) |
| Colour code | No GM colour code located | searched GM EPC / dealer pages | — | **NOT PUBLISHED** |
| Fastener class | Bolt `9.8` (property class as printed in the EPC), M8×1.25, 15 threads, 113.7 mm | [GM EPC](https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178) | A | **VERIFIED-PUBLISHED** |
| Clamp type | `CHRG AIR CLR OTLT DUCT` clamp, included with the cover | [GM EPC](https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178) | A | **VERIFIED-PUBLISHED** (feature); diameter **NOT PUBLISHED** |
| Clamp torque | **6 N·m (53 lb·in)** | prior M10 survey (`docs/research/M10-exterior-accuracy-survey.md:142`), GM SI | A | **ADOPTED (prior project record)**; the rear bolt torque remains **NOT PUBLISHED** |

**Modelling consequence:** model the cover as a thin-walled black plastic shield with two attachment features (rear bolt boss, front duct clamp), the evidenced three-line legend as raised geometry, and a smooth top pad where the legend sits. The diamond field is **not** modelled: its pitch and depth are not published, and a guessed texture would be a fabricated surface. It is recorded as a labeled omission in the spec and the docs, not silently smoothed away.

---

## 8. M8 intake-variant compatibility — what the sources say and what the repo must measure

No external source discusses fitting the cosmetic cover with an aftermarket high-flow intake. The M8 models are project-authored, so their clearance must be recomputed from the repo's own control points, not researched.

| Question | External answer | Repo-side answer needed |
| --- | --- | --- |
| Does the cover fit over the stock intake tract? | The EPC drawing shows the cover over the manifold and clamped to the charge-air duct; the stock tract is a separate part. | Measure the stock shell's lowest/highest vertices over the cover footprint. The spec's self-check does this. |
| Does it fit with `intake_highflow` (V2)? | **NOT PUBLISHED** | Compute the V2 tube surface (Ø101.6 mm, couplers Ø116 mm) against the cover envelope. The spec's self-check does this; the computed result is a pass with a positive gap. |
| Does it hide the intake tract? | The cover is a top shield over the intake manifold; the turbo-inlet tract is outboard/front. | The cover hides the Y-bridge and part of the cold charge pipe, not the turbo-inlet tract or the V2 filter. The spec states this. |
| Does it hide the resonator? | The EPC/photo show a relief/notch at one corner; the M10 survey records the resonator clamped at the intake manifold cover. | The cover's rear edge is 8.454 mm forward of the measured resonator envelope (max X 236.546); the spec's self-check records the gap. |
| Any catalog compatibility rule? | None published. | If the computed V2 gap were negative, a rule would be needed. The self-check computes a positive gap, so no rule is added; the test pins it so a future V2 or cover edit fails loudly. |

**This is the one place where the research cannot carry the decision.** The spec does not import a web claim about intake-cover fitment; it computes the clearance from the frozen M8 control points and the measured shell, and the build must reproduce the same result.

---

## 9. Summary — what can honestly carry a design value

| # | Item | Verdict | M12 action |
| --- | --- | --- | --- |
| 1 | GM 21994000 = LLY upper intake manifold cover, 2004–2006 CK2/3 (LLY) | **VERIFIED-PUBLISHED** | Use the part number and name; no catalog slot change |
| 2 | Rear M8×1.25×113.7 bolt + front charge-air-duct clamp | **VERIFIED-PUBLISHED** (features) | Model both as labeled placeholder positions |
| 3 | Cover is black moulded plastic with a raised diamond field | **PARTIALLY PUBLISHED** (visual) | Model matte black plastic; omit the diamond field as labeled |
| 4 | Legend = `6.6` / `TURBO` / `DIESEL`, moulded in the same black plastic | **VERIFIED-VISUAL** | Model as raised geometry, three lines, same-material family |
| 5 | Brief's "DURAMAX lettering" | **CONFLICT** | Do **not** fabricate; record the conflict; model the evidenced legend |
| 6 | Overall length/width/height | **NOT PUBLISHED** | Labeled placeholder sized to the measured M10 shell |
| 7 | Wall thickness | **NOT PUBLISHED** | Labeled placeholder 2.5 mm |
| 8 | Letter cap height / stroke / depth | **NOT PUBLISHED** | Labeled placeholder; rectilinear stroke construction |
| 9 | Diamond-field pitch/depth | **NOT PUBLISHED** | Omit the field; record the omission |
| 10 | Rear-bolt torque / front-clamp torque | Rear bolt **NOT PUBLISHED**; front clamp **6 N·m (53 lb·in)** per the prior M10 survey | Do not display a torque; model the fastener only; record the clamp value as a prior project record |
| 11 | Polymer family / colour code | **NOT PUBLISHED** (legacy viewer says ABS, grade D) | Use a matte-black PBR approximation; record it |
| 12 | V2 high-flow intake fitment | **NOT PUBLISHED externally** | Compute from repo control points; spec self-check computes a positive gap |

**Bottom line:** the part's identity, retention features, visible form and legend wording are published well enough to model a recognizable, honest cover. Its dimensions, wall thickness, letter metrics, texture pitch, polymer and rear-bolt torque are not published and must be labeled placeholders; the front clamp torque is a prior M10 GM service record (6 N·m), adopted for the record and not used to size geometry. The brief's `DURAMAX` wording is the one direct factual conflict: the evidence says `6.6 TURBO DIESEL`, and the spec follows the evidence.

---

## Sources

- GM EPC group TC00-668, `2004-2006 CK2,3 INTAKE MANIFOLD SHIELD/COVERS (LLY/6.6-2)`, item 002 `21994000 COVER, UPR INT MANIF (INCLS 3)`, item 001 `11588339` bolt, item 003 charge-air-duct clamp: <https://www.gmsklad.ru/catalog/cadillac/ESCALADE-ESV-(2WD)-2005/18178>
- GM EPC line drawing `p013890.jpg` (cover exploded above the intake manifold/charge-air duct): <https://gmsklad.ru/gmcat/pics/cadillac/p013890.jpg>
- GMPartsGiant part page, "21994000 - Genuine GM Cover Assembly, Upper Intake Manifold": <https://www.gmpartsgiant.com/parts/gm-cover-21994000.html>
- Diesel Specialty Parts (Birch Island Diesel) used-parts listing with seven photographs, "2006 GMC CHEVROLET 3500 LLY 6.6 DIESEL ENGINE OE INTAKE RESONATOR COVER 21994000": <https://dieselspecialtyparts.com/2006-gmc-chevrolet-3500-lly-66-diesel-engine-oe-intake-resonator-cover-21994000>
- eBay listing title, "05-07 DURAMAX Chevy Silverado/GMC Intake Manifold Cover Part# 21994000 OEM LBZ": <https://www.ebay.com.au/itm/134869344856>
- Prior project research: [`docs/research/M10-exterior-accuracy-survey.md`](./M10-exterior-accuracy-survey.md) §12 (cover P/N, `6.6 turbo diesel` wording, clamp + bolt retention) and §6 (GM SI clamp torque **6 N·m / 53 lb·in**, grade A, ADOPTED); [`docs/OPEN_ITEMS.md`](../OPEN_ITEMS.md) (M10 deferral); [`docs/specs/M10-exterior-accuracy.md`](../specs/M10-exterior-accuracy.md) §2.1/§2.3 (why the cover was excluded).
- Project legacy (recorded, not adopted as published): [`public/legacy/index.html:225`](../../public/legacy/index.html) — "Molded black grained ABS Helmholtz resonator … raised diamond-plate pads and embossed '6.6 TURBO DIESEL' badge".
