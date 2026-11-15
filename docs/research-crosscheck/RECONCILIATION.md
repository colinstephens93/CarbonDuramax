# LLY Verified-Data Cross-Check — Step 3 Reconciliation (Buckley)

Date: 2026-11-15. Sources reconciled: `REPORT.md` in this folder (independent
cross-check survey, Step 2 QA applied), the primary survey
`docs/research/L7-verified-data-survey.md` on main, and the values the sim
actually adopted in `assets-src/dimensions.json` on main.

## Bottom line

One **material disagreement** (item 4, cam/valve lift) that changes two adopted
sim numbers if accepted. Everything else either agrees outright or upgrades
provenance (several values the primary survey held at vendor grade are
GM-published in the cross-check's service-table source). The NOT PUBLISHED
verdicts agree across both surveys on every item.

## Item by item

1. **Connecting rod length — AGREE.** 163.0 mm in both. Provenance upgrade:
   the cross-check found it in the GM LLY service table itself ("Connecting Rod
   Length 163.0 mm"); the center-to-center basis is inferred (aftermarket
   6.418 in c2c rods corroborate). Sim value 163 correct, no change.
2. **Bore spacing — AGREE: NOT PUBLISHED** (both surveys). Sim borePitch 115
   stays illustrative.
3. **Deck height — AGREE: NOT PUBLISHED** (both surveys). The primary survey's
   labeled derivation (262.3 mm TDC stack) stands as a derivation only.
4. **Camshaft — DISAGREE, MATERIAL.**
   - Primary survey: lobe lift **0.281 ± 0.002 in, both lobes**, from GM service
     text mirrored at dieselmechanic.info ("lift for both intake and exhaust
     valve lobes should be 0.281 ± 0.002 in"); derived valve lift
     **9.7 mm intake / 12.1 mm exhaust** — the values now in dimensions.json.
   - Cross-check: GM production specifications table (2006 Silverado LLY
     service manual, scanned table via Operation CHARM): **intake lobe lift
     7.273 mm (0.2863 in), exhaust lobe lift 5.907 mm (0.2326 in)**; calculated
     valve lift **9.89 mm intake / 9.98 mm exhaust**.
   - Adjudication: the cross-check's source is the GM specifications table with
     per-lobe Production Values; the primary's figure comes from a service
     measurement-procedure context. The cross-check pair is also internally
     consistent with the asymmetric rocker ratios (1.36 / 1.69), yielding nearly
     equal valve lifts — the design logic the primary survey's equal-lobe
     reading breaks. **Recommendation: adopt the cross-check values**
     (intakeMaxLift 9.7 → 9.9, exhaustMaxLift 12.1 → 10.0), owner to approve.
   - Duration / LSA / timing events — AGREE: NOT PUBLISHED (both).
5. **Valve head diameters — AGREE.** 33.0 mm intake / 31.0 mm exhaust in both;
   provenance upgrade to the GM table. Sim values correct.
6. **Crank journals — AGREE.** Main 79.9 mm, rod journal 62.9 mm nominal in
   both; cross-check adds GM production ranges (79.905–79.925 /
   62.902–62.922 mm) and service limits. **Shared pin: provenance upgrade** —
   the cross-check found an explicit published statement (AERA bulletin: rods
   on "a common crankshaft journal") where the primary had only structural
   inference.
7. **Weight / dimensions — weight AGREE (835 lb).** Dimensions: methodology
   difference only. The primary's ≈30×30×32 in is a DieselHub "all gens"
   approximation; the cross-check, applying a strict LLY-only rule, classifies
   LLY dimensions as NOT PUBLISHED (the figure traces to LBZ data). Keep the
   numbers as approximate context for the shell check, labeled as such. No sim
   change.
8. **Pistons — AGREE.** Compression height 49.8 mm, wrist pin 34.5 mm in both.
   Provenance upgrade for the pin (GM production range 34.495–34.5 mm).
9. **Pushrods / rockers / lifters — rockers AGREE** (1.36 intake / 1.69
   exhaust), provenance upgrade to the GM table. **Pushrod: new minor
   conflict** — the primary's single source (Manton, 9.430 in) is now one of
   two supplier figures; Melling/US Seal publish 9.441 in. Unresolved,
   Δ0.28 mm, no sim action (the model's pushrodLengthMm 244 is a model-space
   geometry value, not the part length; flagged here so it is not later
   mistaken for a spec). **Lifter diameter — AGREE: NOT PUBLISHED** (both).
10. **Turbo — AGREE in full.** Garrett GT3788VA; compressor 62.8/88 mm,
    turbine 71.3/65.7 mm; both surveys report the same vane-height source
    disagreement (14.4 mm DuramaxTuner vs 15 mm DrivingLine) unresolved.
11. **Injectors — count AGREE (7 holes).** Hole size: the cross-check found
    candidate figures the primary did not (0.155 mm from a vendor listing for
    the correct Bosch nozzle DLLA158P1385; 0.15 mm from a forum post). Both
    are below this project's verified bar — recorded as a low-confidence
    candidate, **not** verified. No sim change.

## Recommended follow-up (owner decision)

If the item 4 adjudication is accepted, one Antigravity task closes the loop:
update `assets-src/dimensions.json` (intakeMaxLift 9.9, exhaustMaxLift 10.0),
correct survey §4 and the dimensions provenance notes, add a DECISIONS.md entry
per the anti-drift rule, and re-run the test/benchmark gates (valve lift feeds
the valvetrain animation). All other items need no build work — the
provenance upgrades can be folded into the same docs pass.
