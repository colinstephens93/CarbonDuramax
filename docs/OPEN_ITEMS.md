# Open Items — Duramax LLY Engine Lab

Unresolved questions and data still to source. An item leaves this list only when its answer is recorded in `docs/DECISIONS.md` (and in the config/catalog, where it is a value).

## Data to source (published material, with confidence labels)

- [ ] **Full stock torque curve** for the LLY (Allison automatic configuration) — peak points alone cannot calibrate the performance model. Needed by Milestone 5; earlier is better.
- [ ] **Stock boost and rail pressure vs. RPM** — needed for performance-model calibration (Milestone 5).
- [ ] **Stock injector flow rate** — needed for the fuel-delivered cap (Milestone 5).
- [ ] **Bore pitch / bank stagger and deck height** — surveyed 2026-11-13 (L7 survey): no published source exists; remain illustrative placeholders. Cam timing events/duration/LSA — same survey: not published; lobe lift is published and adopted at M7 (D-035), timing remains placeholder.

## Decisions still to make

- [ ] **Outside reviewer of record** for milestone-exit reviews (Claude, Grok, or Gemini; may rotate — record the choice per milestone in the PR).

## Watch items

- [ ] **Legacy viewer preservation** — verify at Milestone 0 that the current live site (GLB + legacy viewer route) still works after the CI/Pages migration.
- [ ] **Stock-curve sanity** — when the torque curve is sourced, re-check the transmission-keyed rating in DECISIONS.md D-016 against it.
- [ ] **Exterior shell scale vs published approximate dimensions (≈762 × 762 × 813 mm, DieselHub)** — registered shell spans 1,174.9 × 1,095.2 × ≈807.5 mm; height agrees, X/Y exceed because registration is containment-driven (M3) and the published conventions exclude the fan and sump variation. Not rescaled at M7 (D-035); revisit only with a dimensioned source.
