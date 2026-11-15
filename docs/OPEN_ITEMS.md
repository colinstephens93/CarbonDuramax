# Open Items — Duramax LLY Engine Lab

Unresolved questions and data still to source. An item leaves this list only when its answer is recorded in `docs/DECISIONS.md` (and in the config/catalog, where it is a value).

## Data to source (published material, with confidence labels)

- [ ] **Full stock torque curve** for the LLY (Allison automatic configuration) — peak points alone cannot calibrate the performance model. Needed by Milestone 5; earlier is better.
- [ ] **Stock boost and rail pressure vs. RPM** — needed for performance-model calibration (Milestone 5).
- [ ] **Stock injector flow rate** — needed for the fuel-delivered cap (Milestone 5).
- [ ] **Bore pitch / bank stagger and deck height** — surveyed 2026-11-13 (L7 survey): no published source exists; remain illustrative placeholders. Cam timing events/duration/LSA — same survey: not published; lobe lift is published and adopted at M7 (D-035), timing remains placeholder.

## Decisions still to make

- [ ] **Outside reviewer of record** for milestone-exit reviews (Claude, Grok, or Gemini; may rotate — record the choice per milestone in the PR).

## Deferred candidates

- [ ] **Internal-part visual variants not in M8** — rods (material-only), injectors/CP3 (flow-internal, no truthful visible change), camshaft (not modeled; timing unpublished), heads (porting unpublished/unmodeled). Deferred until a milestone adds the underlying geometry or published data.
- [ ] **User volume control / loudness calibration** — M9 ships a fixed master and limiter with no dB claim. A volume slider and a calibrated loudness target are deferred.
- [ ] **LLY plastic upper intake manifold cover (`21994000`) and its lettering** — the only lettered surface on the engine; excluded in M10 because it hides the Y-bridge. A closed-up engine-bay look would need it as an optional cosmetic part (with the unverified `6.6 turbo diesel` wording treated as illustrative).
- [ ] **Dual-generator idler, medium-duty oil filler/filter arrangement, vehicle-side hardware (airbox, intercooler core, radiator/shroud, exhaust beyond the downpipe)** — out of scope for M10.

## Watch items

- [ ] **Legacy viewer preservation** — verify at Milestone 0 that the current live site (GLB + legacy viewer route) still works after the CI/Pages migration.
- [ ] **Stock-curve sanity** — when the torque curve is sourced, re-check the transmission-keyed rating in DECISIONS.md D-016 against it.
- [ ] **Exterior shell scale vs published approximate dimensions** *(replacing the existing watch item, which cited only the ≈762 × 762 × 813 mm vendor figure)* — two published approximations exist and disagree by ~100 mm per axis and by what they include: 34 × 33 × 37 in (863.6 × 838.2 × 939.8 mm, forum, fan excluded / fuel filter and P/S included / turbo and pan included) and 30 × 30 × 32 in (762 × 762 × 812.8 mm, vendor, sibling LBZ). M10 does not rescale to either; it corrects only the front-drive stack onto the internal damper disc (X 466…476). Revisit only with a GM dimensioned drawing.
- [ ] **EGR module position (LLY)** — three sources disagree (valley / lengthwise along the passenger cover / rear-of-engine passenger side under the turbo inlet ducting); M10 pins the third and isolates the module in one node group. Revisit with a dimensioned or photographic reference for the LLY.
- [ ] **Front-drive stack offsets** — the damper/belt/fan standoffs are illustrative offsets from the crank snout, not published. Revisit with a dimensioned front-cover/belt-layout drawing.
- [ ] **Valve-cover, Y-bridge, mouthpiece, charge-pipe, turbo-housing, EGR-cooler, CP3, fuel-head, oil-fill and lifting-bracket dimensions** — none published; all illustrative in M10. Revisit per part as OEM drawings or measured parts appear.
- [ ] **`docs/M8-VARIANTS.md` §5 erratum (`fan` vs `beltDrive`)** — the frozen doc lists a group name the asset never had. M10 records the erratum; correct it only if a future milestone reopens that doc.
- [ ] **Stock vehicle-side hardware** (intercooler core, airbox, exhaust beyond the turbo downpipe) is not modeled in the exterior shell; the M8 modified variants for those slots are shown at documented service points, so stock-vs-modified 3D comparison is modified-only there — revisit if the shell or a stock hardware model is added.
- [ ] **LLY turbo shaft-speed vs boost map and measured turbo noise levels** — no published map or measured LLY spectrum was found (M9 survey §3); M9 uses an illustrative 20,000–115,000 rpm proxy and a 3rd-order whistle. Revisit if a sourced map or a licensed recording appears.
- [ ] **iOS silent-switch behavior for Web Audio** — `navigator.audioSession.type = 'playback'` is an experimental API (W3C editor's draft/MDN); M9 records the real-device result and the fallback. Revisit if Safari changes the category behavior.
- [ ] **Per-cylinder combustion variation / LLY acoustic reference** — M9 uses half-order modulation rather than per-cylinder voices; no per-cylinder LLY acoustic data exists. Revisit only with a sourced recording/licensed reference.
