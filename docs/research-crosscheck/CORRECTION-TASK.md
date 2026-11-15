# Correction Task — Cam Lobe Lift & Valve Lift (from the LLY Data Cross-Check)

Owner-approved 2026-11-15. Evidence: `docs/research-crosscheck/REPORT.md`
(item 4) and `docs/research-crosscheck/RECONCILIATION.md` on branch
`research/lly-data-crosscheck`. The GM production specifications table for the
LLY (2006 Silverado service manual) gives per-lobe production lobe lift —
intake **7.273 mm (0.2863 in)**, exhaust **5.907 mm (0.2326 in)** — superseding
the single 0.281 in figure the M7 survey took from a service
measurement-procedure mirror. With the GM-published rocker ratios
(1.36 intake / 1.69 exhaust), valve lift calculates to **9.891 mm intake /
9.983 mm exhaust**.

## Changes (branch `fix/valve-lift-crosscheck`, from latest main)

1. `assets-src/dimensions.json`: `intakeMaxLift` 9.7 → **9.9**;
   `exhaustMaxLift` 12.1 → **10.0**. (File keeps one-decimal values; the
   precise calculated figures 9.891 / 9.983 go in the docs below.)
2. Search the repo for any other place encoding the old figures — lobe lift
   0.281 in / 7.13 mm, or the 9.7 / 12.1 valve-lift pair (code constants,
   generated dimensions, UI text, tests, docs) — and update each consistently.
   List every location found in the closing summary, including locations you
   checked and cleared.
3. `docs/research/L7-verified-data-survey.md` §4: correct the lobe-lift entry
   to the GM production values (intake 7.273 mm / exhaust 5.907 mm, source:
   GM LLY specifications table via the cross-check), keep the 0.281 in figure
   only as a noted service-procedure value, update the derived valve lift to
   9.89 / 9.98 mm, and update the summary table row to match. Do not change
   §4's NOT PUBLICLY AVAILABLE verdicts for duration / LSA / timing.
4. `docs/DECISIONS.md`: add the next sequential decision entry recording this
   correction, its cross-check evidence, and owner approval dated 2026-11-15
   (anti-drift rule: the survey correction and the decision entry land in the
   same change).
5. Regenerate any generated dimensions output the build derives from
   `assets-src/dimensions.json`, following the repo's existing tooling.

## Gates

- Full test suite passes (was 95/95 at M11).
- Benchmarks stay inside the D-033 budgets (desktop and phone).
- Valvetrain geometry checks pass with the new lifts — note intake lift rises
  ~0.19 mm while exhaust lift falls ~2.1 mm; confirm piston-to-valve and
  rocker/valve motion clearances still hold and say so explicitly in the
  closing summary.

## Out of scope

No other dimension changes. The pushrod supplier conflict (9.430 vs 9.441 in)
and the injector hole-size candidate (0.155 mm) recorded in the reconciliation
are explicitly NOT adopted. Do not merge the research branch; Buckley handles
that at verification.

## Closing

Push the branch with a closing summary (locations changed, test count,
benchmark figures, clearance statement). Do not open a PR — Buckley verifies
from a fresh clone and opens it.
