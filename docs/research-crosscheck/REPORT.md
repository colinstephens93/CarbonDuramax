# LLY Verified-Data Cross-Check — Independent Survey (Step 1)

**QA applied (2026-11-15):** Applied the Step 2 QA review — confidence and provenance corrections, source-identity and UNVERIFIED labelling, GM-printed conversion annotations, and removal of unsourced asides; no published values were changed.

**Scope:** 2004.5–2005 GM 6.6 L Duramax, RPO **LLY** (including 2006 LLY where GM published the same LLY specifications).

**Method / independence note:** This survey was built only from external published sources located during this research. I did not read `docs/research/L7-verified-data-survey.md`, `src/data/dimensions.json`, or any other project data file for these values. Values are quoted first in the units used by the source; conversions follow in parentheses. Where a source is for a different RPO, it is explicitly labelled as such and is **not** presented as an LLY value.

**Key primary source:** 2006 Chevrolet Silverado 2500 service manual, “Engine General Specifications & Service Limits,” RPO **LLY**, as hosted by Operation CHARM. The page is a scanned GM table; the relevant images are linked below. The rod, crankshaft and piston-pin values also appear on the 2007 GMC Savana page labelled “RPO LLY” (“Engine Mechanical Specifications”), but that page carries the LBZ 16.8:1 compression ratio (the 2006 LLY table gives 17.5:1); its identity is **UNVERIFIED**, and it is used only as a duplicate of the 2006 LLY table, not as independent LLY corroboration.

- Manual page: [2006 Silverado 2500 LLY — Engine General Specifications & Service Limits](https://charm.li/Chevrolet/2006/Silverado%202500%202WD%20V8-6.6L%20DSL%20Turbo/Repair%20and%20Diagnosis/Engine%2C%20Cooling%20and%20Exhaust/Engine/Specifications/Mechanical%20Specifications/Engine%20General%20Specifications%20%26%20Service%20Limits/)
- Scanned table, general data and cam lobe lift: [image 320351269](https://charm.li/images/DM13Q313/gm60/320351269/)
- Scanned table, connecting rod and crankshaft: [image 320362526](https://charm.li/images/DM13Q313/gm60/320362526/)
- Scanned table, pistons and pins: [image 320392819](https://charm.li/images/DM13Q313/gm60/320392819/)
- Scanned table, valve system and rocker ratios: [image 320410072](https://charm.li/images/DM13Q313/gm60/320410072/)
- 2007 Savana page labelled RPO LLY (identity **UNVERIFIED**; duplicate only): [Engine Mechanical Specifications](https://charm.li/GMC/2007/Savana%203500%20V8-6.6L%20DSL%20Turbo%20VIN%202/Repair%20and%20Diagnosis/Engine%2C%20Cooling%20and%20Exhaust/Engine/Cylinder%20Block%20Assembly/Specifications/Engine%20Mechanical%20Specifications/)

---

## 1. Connecting rod length (center-to-center attribute inferred)

**Value:** **163.0 mm (6.42 in)** published length. The **center-to-center** basis is **inferred**, not stated by GM (see Notes).

**Source(s):** 2006 Chevrolet Silverado 2500 service manual, RPO LLY, “Engine General Specifications & Service Limits,” Connecting Rod — “Connecting Rod Length 163.0 mm (6.42 in)” ([scanned table](https://charm.li/images/DM13Q313/gm60/320362526/)); also printed on the 2007 page labelled RPO LLY (identity **UNVERIFIED**; duplicate only, not independent LLY corroboration) ([Engine Mechanical Specifications](https://charm.li/GMC/2007/Savana%203500%20V8-6.6L%20DSL%20Turbo%20VIN%202/Repair%20and%20Diagnosis/Engine%2C%20Cooling%20and%20Exhaust/Engine/Cylinder%20Block%20Assembly/Specifications/Engine%20Mechanical%20Specifications/)). Aftermarket replacement rods are sold as 6.418 in center-to-center, which is the same dimension rounded ([Boostline GM6418-358S](https://www.boostlineproducts.com/product/individual-connecting-rods/boostline/gm-6-6l-duramax-6-418-in-length-connecting-rod/)).

**Confidence:** **High** for the published length; **Medium** for the center-to-center interpretation.

**Notes:** The GM table calls the dimension simply “Connecting Rod Length,” not “center-to-center.” The 163.0 mm value equals 6.4173 in, and the aftermarket 6.418 in rods are explicitly center-to-center, so the GM figure is reasonably treated as center-to-center. That basis is **inferred** and is **UNVERIFIED as a GM statement**; the aftermarket rod figure is corroboration only, and the GM value is primary.

---

## 2. Cylinder bore spacing

**Value:** **NOT PUBLISHED.**

**Source(s):** No LLY-specific published bore-spacing figure was located. The GM 2006 LLY “Engine General Specifications & Service Limits” table gives cylinder bore, out-of-round and taper, but does not give bore spacing; the 2007 page labelled RPO LLY likewise does not give it (identity **UNVERIFIED**). Mahle Motorsport and UEM piston catalog data for the 6.6 L Duramax list bore, stroke, rod length, compression height and pin diameter, but not bore spacing.

**Confidence:** **N/A — NOT PUBLISHED.**

**Notes:** No estimate, interpolation, or “known” 4.5x-inch figure is substituted. A value measured from a block or inferred from bore diameter and wall thickness would not be a published specification.

---

## 3. Block deck height (crank centerline to deck)

**Value:** **NOT PUBLISHED.**

**Source(s):** No LLY-specific published deck-height figure was located. The GM 2006 LLY table includes “Surface Flatness — Block Deck” but no deck height. The 2007 page labelled RPO LLY also omits it (identity **UNVERIFIED**). Mahle Motorsport’s Duramax piston data gives compression height and notes piston protrusion above deck, but not the deck height itself.

**Confidence:** **N/A — NOT PUBLISHED.**

**Notes:** Deck height could be calculated from published stroke, rod length, compression height and piston protrusion, but that would be a derivation, not a published value. Per the assignment rules, it is left as NOT PUBLISHED.

---

## 4. Stock camshaft: lobe lift, valve lift, duration, lobe separation, timing events

### 4a. Lobe lift

**Value (as published):**
- **Intake lobe lift: 7.273 mm (0.2863 in).**
- **Exhaust lobe lift: 5.907 mm (0.2326 in).**

**Source(s):** 2006 Chevrolet Silverado 2500 service manual, RPO LLY, “Engine General Specifications & Service Limits,” Camshaft — “Camshaft Lobe Lift — Intake — Production Value 7.273 mm (0.2863 in)” and “Camshaft Lobe Lift — Exhaust — Production Value 5.907 mm (0.2326 in)” ([scanned table](https://charm.li/images/DM13Q313/gm60/320351269/)). The same lobe-lift values also appear in the 2010 LMM table (cross-variant context only, not independent LLY confirmation); the LLY figure above is from the RPO LLY page.

**Confidence:** **High.**

**Notes:** These are production lobe lifts at the camshaft, not valve lift. The intake and exhaust lobes are deliberately different because the rocker ratios differ (see item 9).

### 4b. Valve lift

**Value:** **NOT PUBLISHED directly.** Calculated from the published lobe lift and published rocker-arm ratio:

- **Intake valve lift: 9.891 mm (0.3894 in)** = 7.273 mm × 1.36.
- **Exhaust valve lift: 9.983 mm (0.3930 in)** = 5.907 mm × 1.69.

**Source(s):** Lobe lifts from the 2006 LLY table above; rocker ratios from the same table, “Rocker Arms — Valve Rocker Arm Ratio — Intake 1.36:1” and “— Exhaust 1.69:1” ([scanned table](https://charm.li/images/DM13Q313/gm60/320410072/)).

**Confidence:** **Medium** (arithmetic from two published LLY figures; GM does not publish the resulting valve lift directly).

**Notes:** This is a calculation, not a directly published valve-lift specification. It is included because both inputs are published LLY values; the result is calculated from those published inputs and rounded, and is labelled as calculated.

### 4c. Duration, lobe separation, timing events

**Value:** **NOT PUBLISHED** for duration, lobe separation angle (LSA), and timing events (intake/exhaust opening and closing).

**Source(s):** No LLY manufacturer or reputable publication with stock duration/LSA/timing events was located. The GM LLY service table publishes lobe lift, journal diameter, end play, runout and rocker ratios, but not duration, LSA or timing events. Aftermarket camshaft listings publish their own grind durations and LSA, not the stock LLY profile.

**Confidence:** **N/A — NOT PUBLISHED.**

**Notes:** Do not substitute aftermarket cam-card numbers (e.g., 192/200, 194/208, 209/216, 258/268) for the stock LLY profile. Those are different grinds.

---

## 5. Intake and exhaust valve head diameters

**Value (as published):**
- **Intake valve head diameter: 33.0 mm (1.30 in).**
- **Exhaust valve head diameter: 31.0 mm (1.22 in).**

**Source(s):** 2006 Chevrolet Silverado 2500 service manual, RPO LLY, “Engine General Specifications & Service Limits,” Valve System — “Valves–Valve Head Diameter — Intake 33.0 mm (1.30 in)” and “— Exhaust 31.0 mm (1.22 in)” ([scanned table](https://charm.li/images/DM13Q313/gm60/320410072/)). Cross-variant aftermarket corroboration comes from Edelbrock’s Duramax cylinder head listing, which gives intake 33 mm and exhaust 31 mm ([Edelbrock 79029 via CSP Racing](https://www.cspracing.com/products/edelbrock-79029-cylinder-head-01-04-chevy-lb7-duramax-diesel-v8-6-6l-single-complete)), and from stock-replacement valve catalogues: intake 1.299 in, exhaust 1.220 in ([Goodson/QualFast Black Lightning](https://goodson.com/collections/qualcast-products/products/gm-duramax6-6-hp-valves); [SBI 02175 intake](https://www.fullforcediesel.com/duramax-2001-2016-intake-valve-sbi-02175); [SBI 02176 exhaust](https://www.fullforcediesel.com/duramax-2001-2016-exhaust-valve-sbi-02176)).

**Confidence:** **High.**

**Notes:** GM’s 1.30 in/1.22 in are rounded; the exact conversions are 1.2992 in and 1.2205 in. A **Manley aftermarket exhaust valve** is listed at **1.300 in (33.0 mm)** head diameter ([Manley 11609](https://www.manleyperformance.com/product/valves/single-valves/man_11609-1/)); that is a performance valve, not the stock LLY exhaust valve, and is not presented as stock. The Edelbrock head is nominally an LB7 head but is advertised as compatible with all 2001–2016 Duramax valvetrain; its 33/31 mm sizes match the LLY table exactly, but this is cross-variant context only, not independent LLY confirmation.

---

## 6. Crankshaft main and rod journal diameters; two rods per rod journal?

### 6a. Main journal diameter

**Value:** **79.905–79.925 mm (3.1459–3.1466 in as printed by GM; exact conversion 3.1459–3.1467 in)** production range; service limit **79.89 mm (3.1453 in)**.

**Source(s):** 2006 Chevrolet Silverado 2500 service manual, RPO LLY, “Engine General Specifications & Service Limits,” Crankshaft — “Crankshaft Main Journal Diameter — Production Value 79.905–79.925 mm (3.1459–3.1466 in)” ([scanned table](https://charm.li/images/DM13Q313/gm60/320362526/)); also printed on the 2007 page labelled RPO LLY (identity **UNVERIFIED**; duplicate only, not independent LLY corroboration; see item 1). Callies lists the OEM main journal as 3.146 in ([Callies Compstar DuraStar Duramax crankshaft](https://www.callies.com/upcp_product/compstar-duramax/)).

**Confidence:** **High.**

### 6b. Rod journal diameter

**Value:** **62.902–62.922 mm (2.4764–2.4772 in as printed by GM; exact conversion 2.4765–2.4772 in)** production range; service limit **62.88 mm (2.4756 in)**.

**Source(s):** 2006 Chevrolet Silverado 2500 service manual, RPO LLY, “Engine General Specifications & Service Limits,” Crankshaft — “Connecting Rod Journal Diameter — Production Value 62.902–62.922 mm (2.4764–2.4772 in)” ([scanned table](https://charm.li/images/DM13Q313/gm60/320362526/)); also printed on the 2007 page labelled RPO LLY (identity **UNVERIFIED**; duplicate only, not independent LLY corroboration; see item 1). Callies lists the OEM pin journal as 2.477 in ([Callies Compstar DuraStar Duramax crankshaft](https://www.callies.com/upcp_product/compstar-duramax/)).

**Confidence:** **High.**

### 6c. Do two connecting rods share one rod journal?

**Value:** **Yes — two connecting rods share each crankshaft rod journal.**

**Source(s):** AERA Technical Committee bulletin, “Revised Connecting Rod Design on 2001-2017 GM 6.6L Duramax Diesel Engines,” states that the chamfered side of the connecting rod large journal ends “must face away from each other on a common crankshaft journal,” and that connecting rods are used “in matching sets of 8” ([AERA PDF](http://engineprofessional.com/TB/TB031417-2.pdf)).

**Confidence:** **High.**

**Notes:** The main journals are separate from the rod journals; the shared-journal answer applies to the rod journals. The AERA warning is an assembly caution about the two rods on a common journal, not a statement about the number of main bearings.

---

## 7. Overall engine dimensions and dry weight

### 7a. Dry weight

**Value:** **835 lb (379 kg)** published LLY engine weight; the dry/dressed accessory definition is **UNVERIFIED**.

**Source(s):** DMAX Store’s LLY specification table gives “Engine Weight 835 lbs (379 kg)” ([DMAX Store 6.6L Duramax specs](https://dmaxstore.com/pages/6-6l-duramax-diesel-engine-specs-lb7-lly-lbz-lmm-lml-l5p)); Green Handle Media’s LLY page gives “Overall Weight: 835 lbs (dry)” ([Green Handle Media, 2004.5–2006 LLY Duramax](https://greenhandlemedia.com/2023/04/2004-5-2006-lly-duramax/)); Engine-build.com’s LLY page gives “835 lb (approximate; published figures vary with what is attached)” ([Engine-build LLY](https://engine-build.com/engines/chevrolet/duramax/lly)).

**Confidence:** **High** for the published 835 lb figure; the dry/dressed definition is **UNVERIFIED**.

**Notes:** “Dry” is not consistently defined across sources (whether turbo, exhaust manifolds, or flywheel are included). The 835 lb figure is the commonly published LLY engine weight; its dry/dressed accessory definition is **UNVERIFIED**, and the exact dressed weight depends on accessories. No separate LLY published weight with a defined accessory list was located.

### 7b. Overall engine dimensions

**Value:** **NOT PUBLISHED for LLY.**

**Source(s):** No LLY-specific overall length/width/height publication was located. Mash Motors publishes **LBZ** dimensions as approximately **30 in long × 30 in wide × 32 in high** ([Mash Motors diesel conversion specifications](http://mashmotorsinc.com/specifications/)); that page is explicitly for the 2006–2007 **LBZ**, not the LLY, and is therefore not presented as an LLY value.

**Confidence:** **N/A — LLY dimensions NOT PUBLISHED** (LBZ reference data only).

**Notes:** The LBZ 30 × 30 × 32 in figure may be useful context for the project, but it must remain labelled LBZ. No LLY dimension is inferred from it.

---

## 8. Piston compression height and wrist pin diameter

### 8a. Piston compression height

**Value (aftermarket fitment, not LLY-specific/GM-published):** **1.96 in (49.8 mm)** for the stock-replacement LB7/LLY piston; the MAHLE stock-replacement piston is published as **1.961 in**.

**Source(s):** UEM Pistons Dualoy 7208D.5MM, listed for the 2001–2005 LB7/LLY, gives “Compression Height IN 1.96” and “Compression Height MM 49.8” ([UEM Dualoy 7208D.5MM](https://uempistons.com/product/7384/DUALOY-Piston-Kit-7208D.5MM)). MAHLE 224-3451.010, an OEM-replacement LB7/LLY piston, is listed with “Compression Height: 1.961 inches” ([THMotorsports MAHLE 224-3451.010](https://thmotorsports.com/9385862-mahle-224-3451010-engine-piston)). MAHLE Motorsport’s 2022 catalog gives 1.951 in for its performance piston and notes “CH reduced 0.010 in,” which is consistent with a 1.961 in stock height ([MAHLE Motorsport 2022 catalog, p. 32](https://www.wilminkengineparts.com/content_resources/wilmink-performance/Catalogus/Catalog-MAHLE-Motorsport-2022-Wilmink-Performance.pdf)).

**Confidence:** **High** for 1.96 in / 49.8 mm; **Medium** for the 1.961 in variant because it is a 0.001 in rounding difference between two aftermarket stock-replacement listings.

**Notes:** The GM LLY service table does not publish compression height. Both published aftermarket figures are for stock-replacement LB7/LLY pistons, so they are relevant; they differ by 0.001 in (0.025 mm), which is rounding. Do not use the 1.951 in Mahle performance-piston figure as stock — Mahle explicitly states that piston’s compression height is reduced 0.010 in.

### 8b. Wrist pin diameter

**Value:** **34.495–34.5 mm (1.3581–1.3583 in)** production range; service limit **34.45 mm (1.3563 in)**.

**Source(s):** 2006 Chevrolet Silverado 2500 service manual, RPO LLY, “Engine General Specifications & Service Limits,” Pistons and Pins — “Pin–Piston Pin Diameter — Production Value 34.495–34.5 mm (1.3581–1.3583 in)” ([scanned table](https://charm.li/images/DM13Q313/gm60/320392819/)); also printed on the 2007 page labelled RPO LLY (identity **UNVERIFIED**; duplicate only, not independent LLY corroboration; see item 1). UEM gives the pin diameter as 1.358 in (34.5 mm) ([UEM Dualoy 7208D.5MM](https://uempistons.com/product/7384/DUALOY-Piston-Kit-7208D.5MM)); MAHLE/THMotorsports gives 1.358 in and “Piston Pin Outside Diameter 34.50” ([THMotorsports MAHLE 224-3451.010](https://thmotorsports.com/9385862-mahle-224-3451010-engine-piston)).

**Confidence:** **High.**

---

## 9. Pushrod length, rocker-arm ratios (intake and exhaust), lifter diameter

### 9a. Pushrod length

**Value (aftermarket fitment, not LLY-specific/GM-published; as published by stock-replacement suppliers):**
- **9.441 in (239.8 mm)** — Melling MPR548, listed as the OE-spec replacement for 2001–2016 Duramax including LLY ([Melling MPR548 listing](https://swagperformanceparts.com/melling-mpr548-push-rod-set-of-16-direct-fit-for-2001-2016-gm-6-6l-duramax/)); the same 9.441 in length is listed by US Seal Parts ([US Seal Parts Duramax pushrod](https://ussealparts.com/lsprd66.html)).
- **9.430 in (239.5 mm)** — Manton D-305-Dmax-16, described as “Factory Length” for the 2001–2017 6.6 L Duramax, with “Length: 9.430" OAL” ([Manton D-305-Dmax-16](https://mantonpushrods.com/products/d-305-dmax-16)).

**Source(s):** As above. No GM-published pushrod length was located in the 2006 LLY service table or the 2007 page labelled RPO LLY (identity **UNVERIFIED**).

**Confidence:** **Medium** — two aftermarket suppliers disagree by 0.011 in (0.28 mm), and neither is a GM publication.

**Notes:** Both are “factory length” replacement parts. The 0.011 in difference is reported rather than averaged; its cause was not established by the cited sources. A GM service-manual dimension would be preferable if one can be found.

### 9b. Rocker-arm ratios

**Value (as published):**
- **Intake rocker-arm ratio: 1.36:1.**
- **Exhaust rocker-arm ratio: 1.69:1.**

**Source(s):** 2006 Chevrolet Silverado 2500 service manual, RPO LLY, “Engine General Specifications & Service Limits,” Rocker Arms — “Valve Rocker Arm Ratio — Intake 1.36:1” and “— Exhaust 1.69:1” ([scanned table](https://charm.li/images/DM13Q313/gm60/320410072/)).

**Confidence:** **High.**

**Notes:** The ratios are asymmetric. Combined with the different lobe lifts, they produce nearly equal intake and exhaust valve lift (about 9.89 mm and 9.98 mm respectively; see item 4b). This is a useful sanity check on the published numbers.

### 9c. Lifter diameter

**Value:** **NOT PUBLISHED** for the LLY.

**Source(s):** No LLY-specific published lifter-body diameter was located in the sources checked. Elgin’s catalog lists a GM hydraulic roller lifter (HL-7028) with a maximum outside diameter of 0.842 in, but its published application list did not confirm the 6.6 L Duramax diesel, so that figure is not presented as an LLY value ([Elgin HL-7028](https://catalog.elginind.com/engine/part/95e7a74c-33e8-41b6-8906-a1db3daed5bb/)).

**Confidence:** **N/A — NOT PUBLISHED.**

**Notes:** The commonly quoted 0.842 in GM roller-lifter body diameter is not accepted here without an LLY/Duramax-specific publication. No estimate or “same as LS” substitution is made.

---

## 10. Stock turbo model and published compressor/turbine wheel sizes

**Value (as published):**
- **Turbo model: Garrett GT3788VA** (Garrett model AVNT3788VA; Garrett stock-replacement part number 848212-5001S).
- **Compressor wheel:** 11 blades; **inducer 62.8 mm**; **exducer 88 mm**.
- **Turbine wheel:** 13 blades; **inducer 71.3 mm**; **exducer 65.7 mm**.
- **Stock vane height (exhaust volute gap):** 14.4 mm (DuramaxTuner) vs 15 mm (DrivingLine); production value **UNVERIFIED**.

**Source(s):** Calibrated Power / DuramaxTuner, “Stock Duramax Turbo Specs and Information,” 2004.5–2005 LLY section ([DuramaxTuner blog](https://blog.duramaxtuner.com/blog/stock-duramax-turbo-specs)); model confirmation from Turbomaster’s Garrett 848212-5001S page, which lists “Modelo de turbo AVNT3788VA” and application “GM” ([Turbomaster 848212-5001S](https://www.turbomaster.com/turbo/garrett/848212-5001s/)); Green Handle Media and DrivingLine both name the LLY turbo as the Garrett GT3788VA ([Green Handle Media](https://greenhandlemedia.com/2023/04/2004-5-2006-lly-duramax/); [DrivingLine LLY history](https://www.drivingline.com/articles/duramax-history-lesson-2-lly/)).

**Confidence:** **High** for the turbo model. **Medium** for the compressor/turbine wheel dimensions, which are single-source precision from DuramaxTuner/Calibrated Power.

**Notes:** Green Handle Media rounds the compressor inducer to “62mm” and the turbine exducer to “65mm”; DrivingLine describes a “62mm, 11-blade compressor wheel inducer” and a “15mm” vane height. The 62 mm vs 62.8 mm and 65 mm vs 65.7 mm differences are plausible rounding. The vane height is a **source disagreement**, not rounding: **14.4 mm** (DuramaxTuner) vs **15 mm** (DrivingLine); 14.4 mm does not round to 15 mm, and the production vane height is **UNVERIFIED**. Both values are reported and neither is selected. The **GT3782VA** is a different Garrett turbo used on the Ford 6.0 L Power Stroke and must not be substituted for the LLY’s GT3788VA.

---

## 11. Stock injector nozzle hole count and hole size

**Value (as published):**
- **Nozzle hole count: 7.**
- **Nozzle hole size: 0.15 mm** (one published source) **/ 0.155 mm** (another published source). Both are reported; they are not averaged.

**Source(s):**
- **7 holes, 0.155 mm:** ERIKC’s listing for nozzle **DLLA158P1385 / Bosch 0433171860**, used on injector **0445120027 / 0986435504**, states “Nozzle hole size: 0.155mm,” “Nozzle hole Angle: 158°,” “Nozzle hole Number: 7,” and lists application as 2004½–2005 Chevrolet Silverado/GMC Sierra 2500/2500HD/3500/4500 ([ERIKC DLLA158P1385](https://www.dieselinjectornozzle.com/sale-10943407-erikc-dlla158p1385-common-rail-injector-nozzle-dlla-158-p-1385-auto-parts-0-433-171-860-for-04451200.html)). Industrial Injection lists the same Bosch nozzle 0433171860 for the 2004.5–2005 LLY ([Industrial Injection LLY nozzle](https://my.iidiesel.com/Products/0433171860-R6)).
- **7 holes, 0.15 mm:** DuramaxDiesels.com forum post by “McRat” states “LB7/LLY/LBZ sticks have seven holes. The LB7 has larger holes. 0.16mm vs 0.15mm for the LLY” ([DuramaxDiesels “6-hole injectors on LMM’s??”](https://www.duramaxdiesels.com/forum/threads/6-hole-injectors-on-lmms.3855/)). This is a forum statement, not a manufacturer publication.

**Confidence:** **Medium** for the 7-hole count — both cited sources report 7 holes. **Low/UNVERIFIED** for the production hole size: the 0.005 mm disagreement is real, the 0.15 mm figure comes from a forum, and the 0.155 mm figure comes from an aftermarket nozzle supplier.

**Notes:** The LLY injector is a Bosch common-rail unit (Bosch 0445120027; reman 0986435504) using nozzle DLLA158P1385 / 0433171860. The **LB7** uses a different nozzle with 7 × 0.16 mm holes — that is an **LB7** value, not LLY. The **LBZ** also uses seven holes but with a revised spray orientation; that is an **LBZ** detail, not LLY. No Bosch factory datasheet giving the LLY production hole size was located; the two published aftermarket/enthusiast figures are reported as found.

---

## Summary of NOT PUBLISHED items

1. **Cylinder bore spacing** — no LLY-specific published value located (item 2).
2. **Block deck height (crank centerline to deck)** — no LLY-specific published value located (item 3).
3. **Stock camshaft duration** — no LLY published value located (item 4c).
4. **Stock camshaft lobe separation angle (LSA)** — no LLY published value located (item 4c).
5. **Stock camshaft timing events (intake/exhaust opening and closing)** — no LLY published value located (item 4c).
6. **Stock valve lift as a directly published figure** — GM publishes lobe lift and rocker ratios, not valve lift; the 9.891 mm / 9.983 mm values in item 4b are **calculated**, not directly published.
7. **LLY overall engine dimensions (length/width/height)** — no LLY-specific published dimensions located; the 30 × 30 × 32 in figure is **LBZ**, not LLY (item 7b). LLY dry weight is published (835 lb).
8. **LLY lifter body diameter** — no LLY-specific published value located (item 9c).
