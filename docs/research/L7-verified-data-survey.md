# L7 Verified-Data Survey — 2004.5–2005 Duramax LLY (6.6L)

Purpose: find what **verified, published** data exists to replace illustrative placeholders in the
Engine Lab simulation. The owner has no physical access to an engine, so only published sources
count. Researched 2026-11-13 from public web sources. Nothing here was measured by us, and no
value was invented or interpolated: where a number is arithmetic on published inputs, it is
labeled DERIVED; where no credible publication exists, the verdict says so.

**Reliability grades used below**
- **A** — GM service literature / GM-published data (including faithful mirrors of GM service text)
- **B** — Established diesel publication or OE-parts manufacturer publishing OE specs (DieselHub,
  DrivingLine/Diesel Power, MAHLE, UEM)
- **C** — Specialist vendor spec page (Callies, Manley, BoostLine/Wiseco, Manton, DuramaxTuner/
  Calibrated Power) — vendors publishing dimensions their parts must match
- **D** — Forum post / marketplace listing (unverified unless corroborated)

**Verdicts:** VERIFIED-PUBLISHED / PARTIALLY PUBLISHED / NOT PUBLICLY AVAILABLE.

---

## 1. Connecting rod length and end widths

- **Center-to-center length: 6.417 in = 163.0 mm** (6.417 × 25.4 = 162.99 mm).
  - Manley Pro Series I-Beam, sold as "Length: Stock" for 2001–2016 Duramax: center-to-center
    **6.417 in**, big-end bore 2.6374 in. (dalessuperstore.com listing of Manley data) — grade C.
  - BoostLine (Wiseco) GM6418-358S stock-replacement rod: center-to-center **6.418 in**
    (163.02 mm). — grade C.
  - Callies Duramax crankshafts are listed "Rod Length (Cammed For): **6.418 in**". — grade C.
  - UEM (United Engine & Machine) DUALOY OE-replacement piston data for LB7/LLY lists the rod as
    **163.000 mm / 6.420 in** (nominal rounding). — grade B.
  - Four independent sources converge on 163.0 mm. **Our 163.0 mm placeholder is confirmed.**
  - **Verdict: VERIFIED-PUBLISHED.**
- **Big-end width:** BoostLine's stock-dimension rod lists big-end width **1.119 in (28.4 mm)** and
  big-end bore **2.637 in (67.0 mm)**; its pin-end bushing width is 1.537 in (39.0 mm) — these are
  aftermarket-part dimensions stated to match stock journals, not GM-published stock widths.
  No GM source for stock rod widths was found.
  - **Verdict: PARTIALLY PUBLISHED** (vendor, stock-matching).

## 2. Bore spacing / cylinder pitch

- No credible published value found. A 2008 DuramaxDiesels forum thread asking "what is the bore
  spacing?" received no documented answer in the results — the question itself is evidence of
  scarcity. One trade article (Gardner Business Media, L5P launch) says GM maintained "99 mm
  stroke and 103 mm bore spacing," but 103 mm is the bore *diameter*; a 103 mm pitch under a
  103 mm bore would leave zero cylinder wall, so that sentence is an editorial garble and is
  **not** usable as a spacing source.
- **Verdict: NOT PUBLICLY AVAILABLE.** Our 115 mm placeholder stays illustrative.

## 3. Deck height (crank centerline → block deck)

- No published absolute deck height for the LB7–LML block was found in GM material, diesel
  publications, or vendor data. (MotorTrend's Banks L5P teardown does publish that the L5P deck
  is **4.3 mm taller** than the LMM's — a delta, not an absolute, and not the LLY.)
- DERIVED stack from published parts (labeled inference, not a published spec): rod 163.0 mm +
  piston compression height 49.8 mm + half-stroke 49.5 mm = **262.3 mm (10.33 in)** from crank
  centerline to piston crown at TDC. True deck height = 262.3 mm + the piston's deck clearance/
  protrusion at TDC, which was not found published for the LLY.
- **Verdict: NOT PUBLICLY AVAILABLE** as a published number. The sim's deck plane
  (266.5 mm in bank-local coordinates) stays illustrative; the 262.3 mm stack is a defensible
  anchor if the geometry is ever re-based, but must be labeled derived, not verified.

## 4. Stock camshaft (LLY)

- **Lobe lift: 0.281 ± 0.002 in (7.13 ± 0.05 mm), intake and exhaust the same** — from GM service
  text for the LLY ("Measure lift. Lift for both intake and exhaust valve lobes should be
  0.281 ± 0.002 in"), mirrored at dieselmechanic.info's Duramax LLY camshaft service page.
  Same source: cam bearing journals 1–4 = 54.975–55.025 mm, journal 5 = 50.975–51.025 mm.
  — grade A (GM service literature via mirror).
- **Valve lift (DERIVED from published inputs):** lobe lift × rocker ratio (§9):
  intake 0.281 × 1.36 = **0.382 in (9.7 mm)**; exhaust 0.281 × 1.69 = **0.475 in (12.1 mm)**.
- **Duration, lobe separation, IVO/IVC/EVO/EVC for the LLY: not found in any credible source.**
  GM service literature publishes lobe lift and wear limits, not timing events. Numbers in
  circulation are for other variants and must not be imported: a forum-measured **LBZ** cam
  (210°/213° @ .050, 0.286 in lobe — grade D, and a different RPO), Callies/PPE/COMP grinds are
  aftermarket, and the L5P's measured lobes (0.389/0.393 in) are a different engine.
- **Verdict: PARTIALLY PUBLISHED** — lobe lift VERIFIED-PUBLISHED; timing events/duration/LSA
  NOT PUBLICLY AVAILABLE. Our placeholder valve-timing/lift profile stays illustrative except
  that max lift can now be anchored: ~9.7 mm intake / ~12.1 mm exhaust at the valve.

## 5. Valves and springs

- **Intake valve head diameter: 1.299 in (33.0 mm); exhaust: 1.220 in (31.0 mm).**
  - ZZ Diesel lists the OE valves by GM part number for 2001–2016 LB7/LLY/LBZ/LMM/LML:
    OE intake valve 1.299 in head diameter; OE exhaust valve 1.220 in. — grade B/C (OE parts data).
  - Edelbrock's stock-valvetrain-compatible Duramax head (LB7 application, same valve sizes
    carried across the pre-L5P family) lists intake 33 mm / exhaust 31 mm, stem 7.0 mm,
    spring OD 27 mm. — grade C. Corroborates.
  - Caution: one no-name marketplace head listing claims 1.338 in intake / 1.299 in exhaust —
    inconsistent with the OE-part-number data; treated as unreliable (grade D, rejected).
  - **Verdict: VERIFIED-PUBLISHED** (OE-parts grade, two corroborating sources).
- **Valve spring specs (seat/open pressure, free length) for the LLY: not found.** COMP's
  published Duramax beehive kit is explicitly for 2006–16 (LBZ/LMM/LML/L5P), not the LLY.
  - **Verdict: NOT PUBLICLY AVAILABLE.**

## 6. Crankshaft

- **Main journal diameter: 3.146 in (79.9 mm).** Callies Durastar/DuraMag cranks built to OEM
  dimensions: "Main Journal: 3.146 in", "OEM main and rod journal diameters". MotorTrend's L5P
  teardown independently notes the L5P main (3.1465 in measured) retains the same diameter as
  the preceding engines (3.1464 in). — grades C + B.
- **Rod (pin) journal diameter: 2.476–2.477 in (62.9 mm).** Callies: "Rod Pin Diameter: 2.477 in";
  BoostLine: journal 2.476 in; MotorTrend L5P teardown: rod journal "increased **from**
  2.4764 in (62.902 mm)" for the L5P — i.e., 2.4764 in is the pre-L5P (incl. LLY) size.
  Three independent sources agree. — grades C + B.
- **Crank throw: 49.5 mm** (DERIVED: half of the published 99.0 mm stroke — DieselHub, GM
  Authority, XDP all publish stroke 3.897 in / 99 mm; Callies lists stroke 3.898 in).
- **Shared-pin layout (two rods side-by-side on one pin):** no GM text stating it in so many
  words was found, but it is corroborated structurally by published dimensions: a single rod's
  big-end width is 1.119 in (28.4 mm, §1) while the stock-dimension rod journal is ~2.17–2.24 in
  wide (Callies: narrowed billet journals are 2.154–2.165 in, i.e., slightly *under* stock
  width) — one pin carries two rod big ends. The crank is a 5-main, 4-pin crossplane design,
  consistent with every aftermarket crank listing for the engine.
  - **Verdict: journal diameters and throw VERIFIED-PUBLISHED; shared-pin PARTIALLY PUBLISHED**
    (structurally certain from published dimensions; no explicit GM statement located).

## 7. External dimensions and weight

- **Length ≈ 30.0 in (762 mm), width ≈ 30.0 in (762 mm), height ≈ 32.0 in (813 mm)** — DieselHub's
  engine-dimensions table for "6.6 Duramax V-8 (all gens)", explicitly approximate, with stated
  measurement conventions (length = rear of block to front of accessory drive, fan excluded;
  height excludes oil-pan sump variation). — grade B.
- **Dry weight ≈ 835 lb (379 kg)** — DieselHub; corroborated by DMAX Store's per-generation spec
  tables (835 lb / 379 kg) and Xtreme Diesel's LLY buyer's guide ("Approx. 835 lbs (Dry)").
  Three sources agree. — grade B.
- **Verdict: PARTIALLY PUBLISHED** — weight is consistently published (approximate);
  dimensions are single-source and explicitly approximate. Good enough to sanity-check the
  registered exterior shell's bounding box, not to re-scale it authoritatively.

## 8. Pistons

- **Compression height: 1.961 in (49.8 mm).** MAHLE Original (the OE supplier) piston data for
  2001–2005 LB7/LLY (224-3451/224-3452): compression height 1.961 in. Repeated across multiple
  MAHLE OE listings; UEM's standard-height LB7/LLY set agrees (1.96 in / 49.8 mm). Beware
  catalog noise: several ".010 reduced compression height" variants list 1.95 in / 49.53 mm —
  that is the deliberately shortened version, not stock. — grade B.
- **Wrist pin diameter: 1.358 in (34.5 mm)**, floating, offset pin. MAHLE OE, UEM, Speed of Air,
  BoostLine all agree. — grade B.
- **Bowl volume: ≈ +38 cc** for the stock LB7/LLY piston per UEM's OE-replacement data
  ("Crown (cc) +38cc", contoured-head crown). Sign conventions differ by maker (MAHLE's
  performance piston lists −40.7 cc for a different, lower-CR forging — not the stock piston).
  A forum measurement put an LBZ bowl at ~40 cc (grade D; LBZ piston differs from LLY).
  - **Verdict: compression height and pin VERIFIED-PUBLISHED; bowl PARTIALLY PUBLISHED**
    (single OE-replacement source, ~38 cc).

## 9. Lifters, pushrods, rockers

- **Rocker arm ratios: intake 1.36:1, exhaust 1.69:1** — asymmetric, and a common source of
  error (do not assume 1.5:1).
  - Callies' factory-ratio Duramax cam list (2001–2016) tabulates valve lift "w/ 1.36 int" and
    "1.69 ex" rockers; the arithmetic checks against its own rows (e.g., 0.307 in lobe × 1.36 =
    0.418 in valve; 0.250 × 1.69 = 0.423). — grade C.
  - Forum consensus states the same pair (grade D, corroborating only).
  - Analogue check: MotorTrend/Diesel Power measured the **L5P** at 1.39 int / 1.69 ex — the
    exhaust ratio matches; the intake differs slightly on the newer engine, which is why the
    Callies pre-L5P figure (1.36) is the one to use for the LLY.
  - **Verdict: VERIFIED-PUBLISHED at vendor grade** (two independent lines of evidence;
    no GM-published ratio found).
- **Pushrod length: 9.430 in (239.5 mm) overall, 7/16 in diameter** — Manton (specialist pushrod
  maker) sells its Duramax pushrods as "stock length" at 9.430 in overall for 2001–2016.
  Single-source. — grade C. **Verdict: PARTIALLY PUBLISHED.**
- **Lifter diameter: not found** in any credible source. (The pre-L5P Duramax lifter is a large
  mechanical roller lifter — DieselHub — notably bigger than the LS-style lifter the L5P adopted,
  per MotorTrend — but no body diameter is published in the sources located.)
  - **Verdict: NOT PUBLICLY AVAILABLE.**

## 10. Head bolts, head dimensions, lifter gallery

- **Head bolts: six 14 mm head bolts per cylinder (shared between adjacent cylinders)** —
  DrivingLine's LLY "Hard Facts" and ProSource Diesel's LLY guide both state it. — grade B.
  **Verdict: VERIFIED-PUBLISHED** (factoid grade).
- **Head dimensions, head bolt spacing pattern coordinates, and lifter gallery placement:
  nothing published was found.** No GM dimensioned drawing of the head or block valley is in
  public sources located. (Edelbrock's 15.5 mm deck thickness describes *their* LB7 head,
  not the stock casting.)
  - **Verdict: NOT PUBLICLY AVAILABLE.** Our lifter gallery placement stays illustrative —
    this was expected and is confirmed.

## 11. Stock turbo — Garrett GT3788VA (LLY)

Specialist-measured stock dimensions (DuramaxTuner / Calibrated Power's stock-turbo spec table —
grade C, a tuner that measures cores; corroborated in part by DrivingLine and XDP — grade B):
- Compressor wheel: **62.8 mm inducer / 88 mm exducer, 11 blades** (XDP and DrivingLine say
  62.6–62 mm inducer — treat inducer as ≈62.6–62.8 mm).
- Turbine wheel: **71.3 mm inducer / 65.7 mm exducer, 13 blades**.
- Vane height: **14.4 mm** (DuramaxTuner) vs **15 mm** (DrivingLine/XDP, "tallest of any
  GT3788VA") — sources differ by 0.6 mm; report both.
- **A/R: not applicable / not published** — it is a variable-geometry turbine; no fixed A/R
  exists to publish. (The .90 A/R sometimes quoted belongs to the Ford 6.0L PowerStroke's
  different GT3788V application — do not import it.)
- **Verdict: PARTIALLY PUBLISHED** (credible specialist measurements with small inter-source
  variance; no Garrett/GM published datasheet located).

## 12. Injectors

- **Nozzle hole count: 7 holes (SAC type).** Diesel Components Inc's generation history notes
  the LBZ received a "*revised* seven-hole nozzle" and a larger, non-interchangeable body —
  i.e., the LLY nozzle it revised was also seven-hole; Dynomite Diesel's stock-pattern LLY
  replacement nozzles are likewise a 7-hole SAC design. LLY system facts that are published:
  Bosch solenoid injectors, externally mounted (outside the valve covers), 23,000 psi max rail
  pressure (DieselHub; Diesel Components Inc). — grades B/C.
- **Nozzle hole size: not credibly published** for the stock LLY injector in any source located.
- **Verdict: PARTIALLY PUBLISHED** (count and system data published; hole diameter
  NOT PUBLICLY AVAILABLE).

---

## Summary — what can honestly change provenance

| # | Item | Verdict | Sim action |
|---|---|---|---|
| 1 | Rod length 163.0 mm | **VERIFIED-PUBLISHED** | Upgrade placeholder → published (Manley/BoostLine/Callies/UEM). Rod end widths stay vendor-grade |
| 2 | Bore spacing | NOT PUBLICLY AVAILABLE | 115 mm pitch stays **illustrative** |
| 3 | Deck height | NOT PUBLICLY AVAILABLE | Stays **illustrative** (262.3 mm TDC stack is a labeled derivation only) |
| 4 | Cam lobe lift 0.281 in; valve lift ≈9.7/12.1 mm | PARTIALLY PUBLISHED | Lift can be anchored to published inputs; duration/timing/LSA stay **illustrative** |
| 5 | Valves 33.0 / 31.0 mm | **VERIFIED-PUBLISHED** | Upgrade. Spring specs stay illustrative |
| 6 | Main journal 79.9 mm; rod journal 62.9 mm; throw 49.5 mm; shared pin | VERIFIED (journals/throw) / PARTIAL (shared pin) | Upgrade journals; shared-pin layout already correct, keep provenance note |
| 7 | 30×30×32 in approx; 835 lb dry | PARTIALLY PUBLISHED | Use as published-approximate check on exterior shell |
| 8 | Piston CH 49.8 mm; pin 34.5 mm; bowl ≈38 cc | VERIFIED (CH, pin) / PARTIAL (bowl) | Upgrade CH and pin; bowl labeled vendor-published |
| 9 | Rockers 1.36 / 1.69; pushrod 239.5 mm; lifter Ø | VERIFIED vendor-grade (rockers) / PARTIAL (pushrod) / NOT AVAILABLE (lifter) | Upgrade ratios; pushrod vendor-grade; lifter stays illustrative |
| 10 | Six 14 mm head bolts/cylinder | VERIFIED (factoid) | Note published; head dims & lifter gallery stay **illustrative** |
| 11 | GT3788VA wheels ≈62.8/88, 71.3/65.7 mm | PARTIALLY PUBLISHED | Published-specialist grade; no A/R exists |
| 12 | Injector 7-hole SAC; hole size | PARTIALLY / NOT AVAILABLE | Count published; hole size stays illustrative |

**Bottom line:** the placeholders that can honestly move to "published" are the rod length
(confirming 163.0 mm exactly), crank journal diameters and throw, piston compression height and
wrist pin, valve diameters, rocker ratios, valve-lift anchors, and the head-bolt fact. Bore
spacing, absolute deck height, cam timing events, lifter diameter, and all lifter-gallery/head
internal geometry have **no** public source and must remain labeled illustrative — exactly the
items the on-screen disclaimer names.
