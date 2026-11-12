# Open Items — Duramax LLY Engine Lab

Unresolved questions and data still to source. An item leaves this list only when its answer is recorded in `docs/DECISIONS.md` (and in the config/catalog, where it is a value).

## Data to source (published material, with confidence labels)

- [ ] **Full stock torque curve** for the LLY (Allison automatic configuration) — peak points alone cannot calibrate the performance model. Needed by Milestone 5; earlier is better.
- [ ] **Rod length** — published value + source + confidence. Needed by Milestone 1 (placeholder until then).
- [ ] **Stock boost and rail pressure vs. RPM** — needed for performance-model calibration (Milestone 5).
- [ ] **Stock injector flow rate** — needed for the fuel-delivered cap (Milestone 5).
- [ ] **Bore pitch / bank stagger, deck height, cam center** (concept set D05/D10) — placeholders until a published source is found.

## Decisions still to make

- [ ] **Outside reviewer of record** for milestone-exit reviews (Claude, Grok, or Gemini; may rotate — record the choice per milestone in the PR).
- [ ] **Per-tier performance budgets** (triangles, draw calls, texture memory, frame-time targets) — set at Milestone 2 from the detailed cylinder's measurements.
- [ ] **Screenshot reference frames** — choose the fixed crank angles and camera views for visual comparison once Milestone 3 renders the full engine.

## Watch items

- [ ] **Legacy viewer preservation** — verify at Milestone 0 that the current live site (GLB + legacy viewer route) still works after the CI/Pages migration.
- [ ] **Stock-curve sanity** — when the torque curve is sourced, re-check the transmission-keyed rating in DECISIONS.md D-016 against it.
