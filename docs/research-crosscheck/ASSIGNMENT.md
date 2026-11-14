# LLY Verified-Data Cross-Check — Assignment

Purpose: an INDEPENDENT second survey of published 2004.5–2005 Duramax LLY specifications, to be reconciled against Buckley's survey (`docs/research/L7-verified-data-survey.md` on main — do NOT read it before writing your report; independence is the point).

## Model and token economy

Run both steps on a standard/mid-tier model — this is search-and-check work and does not need a top-tier model on high effort. Escalate only if a value's sources genuinely conflict and adjudicating them needs deeper reasoning. Keep the sweep scoped to the 11 items; do not re-research beyond them.

## Step 1 — Research agent: write REPORT.md in this folder

Rules:
- LLY only (RPO LLY, 2004.5–2005). If a value is for LB7/LBZ/LMM/L5P, label it as such — never present it as LLY.
- Every value needs a named source (publication, manufacturer, or website) and the value as published, in original units, before conversion.
- If two sources disagree, report both values with both sources.
- If no published value exists, write "NOT PUBLISHED". Do not estimate, interpolate, or borrow from similar engines.

Items: (1) connecting rod length center-to-center; (2) cylinder bore spacing; (3) block deck height (crank centerline to deck); (4) stock camshaft lobe lift, valve lift, duration, lobe separation, timing events; (5) intake/exhaust valve head diameters; (6) crankshaft main and rod journal diameters, and whether two rods share one rod journal; (7) overall engine dimensions and dry weight; (8) piston compression height and wrist pin diameter; (9) pushrod length, rocker arm ratios (intake and exhaust separately), lifter diameter; (10) stock turbo model and published compressor/turbine wheel sizes; (11) stock injector nozzle hole count and hole size.

Format per item: Value / Source(s) / Confidence (high/medium/low) / Notes. End with a summary list of every NOT PUBLISHED item.

## Step 2 — QA agent: review REPORT.md, write QA-REVIEW.md in this folder

Check: (1) every value has a named source — flag vague sourcing; (2) values from a different engine variant presented as LLY; (3) recompute every inch-mm conversion; (4) internal contradictions; (5) suspicious precision vs source confidence; (6) estimates dressed as published figures.
Return in QA-REVIEW.md: (a) findings list rated blocker / should-fix / nit, quoting the line; (b) the corrected conclusions. Do not invent replacement values — mark UNVERIFIED instead. The research agent then applies the QA fixes to REPORT.md (note in the file that QA was applied).

## Step 3 — Buckley

Buckley reads REPORT.md + QA-REVIEW.md from this branch, reconciles against the primary survey item by item, and folds material differences into the Milestone 7 spec before approval.
