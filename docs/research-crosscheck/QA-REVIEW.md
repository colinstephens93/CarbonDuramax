# QA review — independent LLY survey (Step 2)

**Reviewer scope.** This review checks `docs/research-crosscheck/REPORT.md` against the Step 2 checklist in `ASSIGNMENT.md`: named sourcing, engine-variant labelling, inch/mm conversions, internal contradictions, precision versus source confidence, and estimates presented as published figures. It did not consult `docs/research/L7-verified-data-survey.md`, `src/data/*`, or any other project data file. External checks below were made only against pages cited by the report or against public pages needed to test the report's own labels.

**Legend.** **Blocker** = must be resolved before reconciliation; **should-fix** = material confidence/provenance correction; **nit** = small wording, citation, or rounding issue. **UNVERIFIED** means not established by the cited published source; it does not mean the value is wrong, and no replacement value has been invented.

**Bottom line.** Finding count: **0 blockers / 4 should-fix / 8 nits**. The GM-table values in items 1 (published length), 4a, 5, 6a, 6b, 8b, and 9b are supported by the scanned LLY table and recompute correctly. The material issues are confidence/provenance, not the core values: the turbo wheel dimensions are single-source precision rated “High,” the report calls a real 14.4 mm vs 15 mm vane-height disagreement “consistent,” and it treats a 2007 page labelled LLY but carrying the LBZ compression ratio as LLY corroboration.

---

## A. Findings

### Blockers

None.

### Should-fix

**SF-1 — Item 10 rates single-source wheel precision as “High.”**

> “**Confidence:** **High** for the model and wheel dimensions.” (`REPORT.md:231`)

The GT3788VA model is corroborated by several sources, but the precise compressor/turbine figures (62.8 / 88 / 71.3 / 65.7 / 14.4 mm) come from one precise source, the DuramaxTuner/Calibrated Power blog. The other cited sources give only rounded figures (Green Handle: 62 mm / 65 mm) or a conflicting one (DrivingLine: 15 mm vane height). That is not a “High” evidence base for tenths-of-a-millimetre wheel dimensions.

**Required fix:** keep **High** for the turbo model; downgrade the wheel dimensions to **Medium** until a second precise source is found. Do not delete the values — they are published — but label them single-source precision.

**SF-2 — Item 10 calls 14.4 mm and 15 mm “consistent” when they are a real disagreement.**

> “These are rounded/alternate published figures and are consistent with the more precise 62.8 mm / 65.7 mm / 14.4 mm values; both are reported here rather than treated as conflicts.” (`REPORT.md:233`)

62 mm vs 62.8 mm and 65 mm vs 65.7 mm are plausible rounding. 15 mm vs 14.4 mm is not: 14.4 rounds to 14, not 15, and the difference is 0.6 mm (about 4.2%). The report’s own note therefore contains an internal contradiction: it says the figures are “consistent” while reporting a value that is not a rounding of the other.

**Required fix:** describe the vane height as a **source disagreement**: 14.4 mm (DuramaxTuner) vs 15 mm (DrivingLine). Keep both values with their sources. Treat the production vane height as **UNVERIFIED**; do not pick one.

**SF-3 — The 2007 Savana “RPO LLY” page is not independent LLY evidence.**

> “The rod, crankshaft and piston-pin values are repeated in the 2007 GMC Savana RPO LLY ‘Engine Mechanical Specifications’ text page; that later page lists a different compression ratio, so it is used only for the dimensions it repeats.” (`REPORT.md:7`)

The 2007 Savana page does say “RPO LLY,” but it gives **16.8:1**, which is the compression ratio DMAX Store lists for the **LBZ**; the 2006 LLY table gives **17.5:1** ([2007 Savana page](https://charm.li/GMC/2007/Savana%203500%20V8-6.6L%20DSL%20Turbo%20VIN%202/Repair%20and%20Diagnosis/Engine%2C%20Cooling%20and%20Exhaust/Engine/Cylinder%20Block%20Assembly/Specifications/Engine%20Mechanical%20Specifications/); [DMAX Store LLY/LBZ specs](https://dmaxstore.com/pages/6-6l-duramax-diesel-engine-specs-lb7-lly-lbz-lmm-lml-l5p)). The report notices the different ratio but still calls the page an LLY repetition. Its engine identity is therefore unresolved.

**Required fix:** relabel the 2007 page as “a second GM page labelled LLY but carrying the LBZ 16.8:1 ratio; identity **UNVERIFIED**; used only as a duplicate of the 2006 LLY table, not as independent LLY corroboration.” The values in items 1, 6a, 6b, and 8b still stand on the 2006 LLY table; this correction changes the corroboration weight, not the values.

**SF-4 — Item 1’s “center-to-center” basis is inferred, not published.**

> “The GM table calls the dimension simply ‘Connecting Rod Length.’ The 163.0 mm value equals 6.4173 in, and the aftermarket 6.418 in rods are explicitly center-to-center, so the GM figure is treated as center-to-center.” (`REPORT.md:26`)

The scanned GM table publishes only “Connecting Rod Length 163.0 mm (6.42 in)”; it does not state center-to-center. The inference is reasonable and is corroborated by the aftermarket 6.418 in rods, but it is not a published LLY center-to-center statement. The report’s **High** confidence currently covers the inferred attribute as well as the published length.

**Required fix:** keep **163.0 mm (6.42 in)** as the published length; label “center-to-center” as **inferred** (or **UNVERIFIED as a GM statement**). Confidence: High for the published length, Medium for the center-to-center interpretation.

### Nits

**N-1 — “Dry” is not a defined accessory state.**

> “**Value:** **835 lb (379 kg)**, dry.” (`REPORT.md:141`)
>
> “‘Dry’ is not consistently defined across sources (whether turbo, exhaust manifolds, or flywheel are included).” (`REPORT.md:147`)

The 835 lb figure is published by LLY-specific sources (DMAX Store’s LLY section, Green Handle, Engine-build) and the 379 kg conversion is correct, but the report itself says “dry” is not consistently defined. Keeping “dry” in the headline while rating “High” for the “dry figure” overstates what is verified.

**Action:** keep **835 lb (379 kg)** as the published LLY engine weight; mark the dry/dressed accessory definition **UNVERIFIED**. “High” may apply to the published number, not to a defined dry weight.

**N-2 — Two GM inch equivalents are truncated by 0.0001 in.**

> “**Value:** **79.905–79.925 mm (3.1459–3.1466 in)** production range …” (`REPORT.md:111`)
>
> “**Value:** **62.902–62.922 mm (2.4764–2.4772 in)** production range …” (`REPORT.md:119`)

Recomputed: 79.925 mm ÷ 25.4 = 3.1466535 in → **3.1467** at four decimal places, not 3.1466; 62.902 mm ÷ 25.4 = 2.4764567 in → **2.4765**, not 2.4764. The scanned GM table itself prints 3.1466 and 2.4764, so the report is quoting GM’s truncated English column, not making an arithmetic slip. The metric values are unaffected.

**Action:** annotate that these are GM’s printed English equivalents, not exact conversions. Do not change the metric values. Every other conversion in the report recomputes correctly (see Appendix).

**N-3 — Unsourced asides in the NOT PUBLISHED rationale.**

> “Aftermarket ‘factory-appearing’ Duramax block discussion threads discuss that stock bore spacing is required, but do not publish the dimension.” (`REPORT.md:34`)
>
> “AERA head-gasket/piston-protrusion material gives protrusion and gasket thickness, not crank-centerline-to-deck height.” (`REPORT.md:46`)
>
> “Forum claims (for example, a hedged ‘176° at .050, 108 LSA’ post concerning an LBZ) were not treated as published LLY specifications.” (`REPORT.md:85`)
>
> “WCFab’s Duramax mock-up block is described as replicating the external dimensions of a 2001–2016 Duramax …” (`REPORT.md:153`)

Unlike the value sources, these supporting claims have no named publication or URL. They only explain why an item is NOT PUBLISHED, so they do not affect a value, but they are not independently checkable.

**Action:** add a citation for each, or drop the unsourced asides. The NOT PUBLISHED conclusions for items 2, 3, 4c, and 7b do not depend on them.

**N-4 — Item 9c’s lifter-clearance claim is not in the cited table.**

> “The GM 2006 LLY service table publishes lifter roller-to-body clearance and lifter inspection criteria, but not lifter body diameter.” (`REPORT.md:213`)

The cited general-spec table (image 320410072) shows “Valve Lifters/Push Rods—Push Rod Straightness” and does not list lifter roller-to-body clearance. The claim may come from another service-manual page, but no page is cited. The conclusion — LLY lifter body diameter **NOT PUBLISHED** — is unaffected.

**Action:** cite the page that actually contains lifter clearance, or soften to “no LLY lifter-body diameter was located in the sources checked.”

**N-5 — Cross-variant corroboration is disclosed but weighted as if independent.**

> “Independently corroborated by Edelbrock’s Duramax cylinder head listing, which gives intake 33 mm and exhaust 31 mm …” (`REPORT.md:99`)
>
> “The same lobe-lift values are repeated for the 2010 LMM table, but the LLY figure above is from the RPO LLY page.” (`REPORT.md:62`)

The Edelbrock head is an LB7 part (the report’s own note says so), and the 2010 LMM is a different variant. Both are legitimate context, but neither is independent **LLY** confirmation. The report does disclose the variant in each case, so no value is misrepresented; the wording “independently corroborated” and “repeated” gives them more weight than they carry.

**Action:** call these “cross-variant corroboration” or “context only,” not independent LLY evidence.

**N-6 — “Consistently published” overstates the 7-hole evidence.**

> “**Confidence:** **Medium** — the 7-hole count is consistently published; the hole size has a 0.005 mm disagreement …” (`REPORT.md:247`)

Only two sources are cited for the 7-hole count: an aftermarket nozzle supplier (ERIKC) and a forum post (McRat). Both say seven, but that is not “consistently published” across a body of sources.

**Action:** say “both cited sources report 7 holes.” Keep Medium confidence for the count and Low/UNVERIFIED for the production hole size.

**N-7 — Aftermarket values in items 8a and 9a are not LLY-specific.**

> “**Value:** **1.96 in (49.8 mm)** for the stock-replacement LB7/LLY piston …” (`REPORT.md:165`)
>
> “**Value (as published by aftermarket stock-replacement suppliers):**” (`REPORT.md:187`)

The compression-height value is from an aftermarket piston kit listed for **LB7/LLY** 2001–2005, not a GM-published LLY figure. The pushrod values are aftermarket parts listed for 2001–2016/2001–2017 Duramax, not LLY-specific. The report labels both contexts, but the headline “Value” can still be read as an LLY specification.

**Action:** add “aftermarket fitment, not LLY-specific/GM-published” to both headlines; keep the existing confidence caps (Medium for the 1.961 in variant and for pushrods) and do not present the 1.96 in headline as an LLY-specific GM figure.

**N-8 — A few explanatory phrases are speculative or over-precise.**

> “The 0.011 in difference may reflect measurement convention (overall length vs. effective length) or a supplier tolerance …” (`REPORT.md:195`)
>
> “It is included because both inputs are published LLY values and the arithmetic is exact; the result is labelled as calculated.” (`REPORT.md:79`)

The pushrod explanation is speculation, not sourced; reporting both values without averaging is the right call. In item 4b the multiplications are exact (7.273 × 1.36 = 9.89128; 5.907 × 1.69 = 9.98283), but the published results are rounded (9.891 / 9.983 mm; 0.3894 / 0.3930 in), so “arithmetic is exact” should refer to the inputs, not the displayed outputs.

**Action:** remove the unsourced pushrod speculation or label it as a hypothesis; say “calculated from published inputs and rounded” in item 4b.

---

## B. Corrected conclusions

These are the conclusions that survive the review. Values are not replaced; where the report’s evidence does not establish a point, it is marked **UNVERIFIED**. “NOT PUBLISHED” means no published value was located and none is substituted.

### 1. Connecting rod length (center-to-center)

**163.0 mm (6.42 in)** is published by the 2006 LLY “Engine General Specifications & Service Limits” table and also appears in the 2007 page (whose identity is unresolved; see SF-3). The 6.418 in aftermarket rods corroborate the dimension. The **center-to-center** attribute is **inferred**, not stated in the GM table; mark it **UNVERIFIED as a GM statement**. Confidence: High for the published length, Medium for the center-to-center interpretation.

### 2. Cylinder bore spacing

**NOT PUBLISHED.** No LLY-specific published figure was located in the cited tables or catalogues. No estimate or “known” figure is substituted. If a number is needed, it is **UNVERIFIED**.

### 3. Block deck height (crank centerline to deck)

**NOT PUBLISHED.** The GM table gives deck flatness, not deck height. A value calculated from stroke, rod length, compression height, and piston protrusion would be a derivation, not a published figure. **UNVERIFIED** if derived.

### 4. Stock camshaft

- **Lobe lift:** intake **7.273 mm (0.2863 in)**, exhaust **5.907 mm (0.2326 in)** — published in the 2006 LLY table. Verified.
- **Valve lift:** intake **9.891 mm (0.3894 in)**, exhaust **9.983 mm (0.3930 in)** — **calculated** from published lobe lift × published rocker ratio; not directly published. Arithmetic correct; keep the “calculated” label.
- **Duration, lobe separation, timing events:** **NOT PUBLISHED.** No stock LLY figures located. Aftermarket grind numbers are not substitutes.

### 5. Intake and exhaust valve head diameters

**Intake 33.0 mm (1.30 in); exhaust 31.0 mm (1.22 in)** — published in the 2006 LLY table. Verified. The Edelbrock 33/31 mm listing is an **LB7** aftermarket head advertised for 2001–2016; it is cross-variant corroboration, not independent LLY confirmation. The stock-replacement catalogues are consistent but are also aftermarket.

### 6. Crankshaft main and rod journals; shared rod journal

- **Main journal:** **79.905–79.925 mm (3.1459–3.1466 in as printed by GM; exact 3.1459–3.1467 in)**; service limit **79.89 mm (3.1453 in)**. Verified.
- **Rod journal:** **62.902–62.922 mm (2.4764–2.4772 in as printed by GM; exact 2.4765–2.4772 in)**; service limit **62.88 mm (2.4756 in)**. Verified.
- **Two rods per rod journal:** **Yes.** The AERA bulletin’s assembly warning and “matching sets of 8” support two rods on each common rod journal. This is an engine-architecture fact, not a variant-specific dimension.

### 7. Overall engine dimensions and dry weight

- **Dry weight:** **835 lb (379 kg)** is published by DMAX Store’s LLY section and Green Handle, with Engine-build giving the same figure as approximate. Conversion is correct. The **“dry” accessory definition is UNVERIFIED**; the number should be described as “published LLY engine weight (dry definition varies).”
- **Overall dimensions:** **NOT PUBLISHED for LLY.** The 30 × 30 × 32 in figure is **LBZ only** and must remain so labelled. No LLY dimension is inferred from it.

### 8. Piston compression height and wrist pin diameter

- **Compression height:** **1.96 in (49.8 mm)** from the UEM 7208D.5MM kit listed for **LB7/LLY 2001–2005**; **1.961 in** from the MAHLE 224-3451.010 listing for **LB7/LLY 2001–2005**. These are aftermarket stock-replacement figures, not GM-published LLY figures. Both values stand; the 0.001 in difference is rounding. Confidence: High for the aftermarket figure; not an LLY-specific GM-published value.
- **Wrist pin diameter:** **34.495–34.5 mm (1.3581–1.3583 in)**; service limit **34.45 mm (1.3563 in)** — published in the 2006 LLY table. Verified; UEM/MAHLE give 1.358 in / 34.50 mm as corroboration.

### 9. Pushrod length, rocker-arm ratios, lifter diameter

- **Pushrod length:** **9.441 in (239.8 mm)** (Melling MPR548) and **9.430 in (239.5 mm)** (Manton D-305-Dmax-16) — aftermarket, not LLY-specific; no GM-published LLY length located. Both values stand; do not average. Confidence: Medium.
- **Rocker-arm ratios:** intake **1.36:1**, exhaust **1.69:1** — published in the 2006 LLY table. Verified.
- **Lifter diameter:** **NOT PUBLISHED** for LLY. The 0.842 in Elgin figure is not confirmed for the 6.6 L Duramax and is not presented as LLY. **UNVERIFIED** for LLY.

### 10. Stock turbo and wheel sizes

- **Model:** **Garrett GT3788VA** (AVNT3788VA; stock-replacement 848212-5001S) — well corroborated. **High** confidence.
- **Compressor wheel:** 11 blades; inducer **62.8 mm**; exducer **88 mm** — single precise source (DuramaxTuner); **Medium** confidence, not High.
- **Turbine wheel:** 13 blades; inducer **71.3 mm**; exducer **65.7 mm** — single precise source; **Medium** confidence.
- **Vane height:** **14.4 mm** (DuramaxTuner) vs **15 mm** (DrivingLine) — a real disagreement, not rounding. The production value is **UNVERIFIED**. Report both; do not call them consistent.
- The GT3782VA caution is correct and should remain.

### 11. Stock injector nozzle hole count and hole size

- **Hole count:** **7** — both cited sources (ERIKC and the McRat forum post) report seven. Confidence: Medium; “consistently published” is too strong for two sources.
- **Hole size:** **0.155 mm** (ERIKC aftermarket nozzle listing) vs **0.15 mm** (McRat forum post). The 0.005 mm disagreement is real; no Bosch factory datasheet was located. The production size is **UNVERIFIED**. Report both; do not average.
- The LB7 7 × 0.16 mm and LBZ seven-hole notes are correctly labelled as other variants and should remain so.

### Summary of NOT PUBLISHED items (unchanged in substance)

1. Cylinder bore spacing — NOT PUBLISHED (UNVERIFIED if estimated).
2. Block deck height (crank centerline to deck) — NOT PUBLISHED.
3. Stock camshaft duration — NOT PUBLISHED.
4. Stock camshaft LSA — NOT PUBLISHED.
5. Stock camshaft timing events — NOT PUBLISHED.
6. Stock valve lift as a directly published figure — NOT PUBLISHED; the 9.891 / 9.983 mm values are calculated.
7. LLY overall engine dimensions — NOT PUBLISHED; the 30 × 30 × 32 in figure is LBZ.
8. LLY lifter body diameter — NOT PUBLISHED.
9. LLY-specific pushrod length — NOT PUBLISHED; only aftermarket generic-fitment values exist.
10. LLY-specific compression height — NOT PUBLISHED by GM; only aftermarket LB7/LLY piston data exist.

---

## C. Conversion audit

All inch/mm conversions in the report were recomputed at 25.4 mm/in. “OK” means the report’s rounded figure is consistent with the exact value at the precision shown.

| Report location | Report figure | Exact recomputation | Result |
|---|---|---|---|
| Item 1 | 163.0 mm = 6.42 in / 6.4173 in | 6.4173228 in | OK |
| Item 4a | 7.273 mm = 0.2863 in | 0.2863386 in | OK |
| Item 4a | 5.907 mm = 0.2326 in | 0.2325591 in | OK |
| Item 4b | 7.273 × 1.36 = 9.891 mm | 9.89128 mm | OK |
| Item 4b | 9.891 mm = 0.3894 in | 0.3894205 in | OK |
| Item 4b | 5.907 × 1.69 = 9.983 mm | 9.98283 mm | OK |
| Item 4b | 9.983 mm = 0.3930 in | 0.3930248 in | OK |
| Item 5 | 33.0 mm = 1.30 in / 1.2992 in | 1.2992126 in | OK |
| Item 5 | 31.0 mm = 1.22 in / 1.2205 in | 1.2204724 in | OK |
| Item 5 note | 1.300 in = 33.0 mm | 33.02 mm | OK at 1 d.p. |
| Item 6a | 79.905 mm = 3.1459 in | 3.1458661 in | OK |
| Item 6a | 79.925 mm = 3.1466 in | 3.1466535 in | **Truncated**; exact 3.1467 (GM prints 3.1466) |
| Item 6a | 79.89 mm = 3.1453 in | 3.1452756 in | OK |
| Item 6b | 62.902 mm = 2.4764 in | 2.4764567 in | **Truncated**; exact 2.4765 (GM prints 2.4764) |
| Item 6b | 62.922 mm = 2.4772 in | 2.4772441 in | OK |
| Item 6b | 62.88 mm = 2.4756 in | 2.4755906 in | OK |
| Item 7a | 835 lb = 379 kg | 378.7496 kg | OK |
| Item 8a | 1.96 in = 49.8 mm | 49.784 mm | OK |
| Item 8a | 1.961 in (implied 49.8 mm) | 49.8094 mm | OK |
| Item 8a | 0.001 in = 0.025 mm | 0.0254 mm | OK |
| Item 8b | 34.495 mm = 1.3581 in | 1.3580709 in | OK |
| Item 8b | 34.5 mm = 1.3583 in | 1.3582677 in | OK |
| Item 8b | 34.45 mm = 1.3563 in | 1.3562992 in | OK |
| Item 9a | 9.441 in = 239.8 mm | 239.8014 mm | OK |
| Item 9a | 9.430 in = 239.5 mm | 239.522 mm | OK |
| Item 9a | 0.011 in = 0.28 mm | 0.2794 mm | OK |
| Item 9c | 0.842 in (no mm given) | 21.3868 mm | n/a |
| Item 8a | 0.010 in (no mm given) | 0.254 mm | n/a |

The only conversion discrepancies are the two GM-printed inch values in item 6. They are 0.0001 in (0.0025 mm) from the exact conversion, are inherited from the scanned GM table, and do not affect the metric specifications. No material conversion error was found.

---

## D. What the research agent should change in REPORT.md

1. Item 10: keep **High** for the model, downgrade wheel dimensions to **Medium**; report vane height as **14.4 mm vs 15 mm, unresolved**, not “consistent.”
2. Header/item 6/8: relabel the 2007 Savana page as “labelled LLY but 16.8:1 (LBZ ratio); **UNVERIFIED** identity; duplicate only, not independent LLY corroboration.”
3. Item 1: mark **center-to-center** as inferred/UNVERIFIED as a GM statement.
4. Item 7a: keep 835 lb (379 kg), but mark the **dry/dressed definition UNVERIFIED**.
5. Item 6: annotate the two GM-printed inch values as truncated; do not change the metric values.
6. Items 2, 3, 4c, 7b, 9c: add citations for the unsourced supporting claims or remove them.
7. Items 8a and 9a: label the piston and pushrod values as **aftermarket, not LLY-specific/GM-published**.
8. Item 11: replace “7-hole count is consistently published” with “both cited sources report 7 holes”; keep the hole size **UNVERIFIED**.
9. Item 5: change “independently corroborated” for the Edelbrock LB7 head to “cross-variant aftermarket corroboration.”
