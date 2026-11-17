# Open Items — Duramax LLY Engine Lab

Unresolved questions and data still to source. An item leaves this list only when its answer is recorded in `docs/DECISIONS.md` (and in the config/catalog, where it is a value).

## Data to source (published material, with confidence labels)

- [ ] **Full stock torque curve** for the LLY (Allison automatic configuration) — peak points alone cannot calibrate the performance model. Needed by Milestone 5; earlier is better.
- [ ] **Stock boost and rail pressure vs. RPM** — needed for performance-model calibration (Milestone 5).
- [ ] **Stock injector flow rate** — needed for the fuel-delivered cap (Milestone 5).
- [ ] **Bore pitch / bank stagger and deck height** — surveyed 2026-11-13 (L7 survey): no published source exists; remain illustrative placeholders. Cam timing events/duration/LSA — same survey: not published; lobe lift is published and adopted at M7 (D-035), corrected by D-044, timing remains placeholder.

## Decisions still to make

- [ ] **Outside reviewer of record** for milestone-exit reviews (Claude, Grok, or Gemini; may rotate — record the choice per milestone in the PR).

## Deferred candidates

- [ ] **User volume control / loudness calibration** — M9 ships a fixed master and limiter with no dB claim. A volume slider and a calibrated loudness target are deferred.
- [ ] **Dual-generator idler, medium-duty oil filler/filter arrangement, vehicle-side hardware (airbox, intercooler core, radiator/shroud, exhaust beyond the downpipe)** — out of scope for M10.
- [ ] **Per-part or per-material section colours / section outlines** — M11 chooses one section colour so the cut plane reads as a diagrammatic convention; part identity stays with labels/build panels. Revisit only alongside a legibility study.

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
- [ ] **Spring hull caps are solid ellipses (diagrammatic)** — the 32 springs are capped through a closed convex hull, so a plane through a coil shows a solid section rather than wire cross-sections, consistent with the solid convention but not a real spring section. Revisit if a cheap analytic coil section or real spring wall geometry appears.
- [ ] **Cap rebuild CPU on low-end phones** — the static rebuild is the heaviest single event (target ≤ 16 ms phone); M11 measures it on the reference machine. Revisit with a worker/incremental rebuild if real phones exceed the budget.
- [ ] **True wall-thickness section caps** — M11 caps the modelled solid cross-section; real castings are thin-walled. A future asset project that gives the shell/heads wall thickness would allow material-band caps instead of solid fills; it would also change the D-033 asset budgets.
- [ ] **LLY intake cover (`21994000`) dimensions, wall thickness, letter metrics and diamond-field pitch** — no GM dimensioned drawing or measured sample exists; M12 pins labeled placeholders (planform, 2.5 mm wall, 47.2 mm body height, 22 mm letter cap height) sized to the measured M10 shell. The planform is a **clearance-driven placeholder, not form-matched** to the EPC/photo form (wide rear / narrower front / front-corner notch); the orientation deviation is recorded in the M12 spec §15.7 and `docs/M12-COVER.md`. Revisit with a dimensioned drawing or a measured part.
- [ ] **Intake cover legend wording** — GM EPC and used-parts photos show `6.6 TURBO DIESEL`; no source shows a `DURAMAX` wordmark on 21994000. M12 models the evidenced legend as illustrative geometry and does not fabricate the brand wordmark. Revisit with a GM text/print source.
- [ ] **Intake cover material/finish and fastener torque** — "moulded black plastic" is supported by the photos/EPC; the polymer family, colour code, diamond-field pitch/depth and the **rear cover-bolt torque** are not published. A GM service record in the M10 survey gives the **front clamp 6 N·m (53 lb·in)**, adopted as a prior-project record; M12 uses a matte-black PBR approximation, models the M8×1.25×113.7 bolt without a torque claim, and displays no torque.
- [ ] **Intake-cover fitment years** — GM EPC TC00-668 lists 2004–2006 CK2/3 (LLY); an eBay title also claims 2005–2007 LBZ. M12 follows the LLY EPC and does not claim LBZ coverage.
- [ ] **V2 high-flow intake / cover clearance is a planning computation** — 6.567 mm minimum surface clearance (r = 58 mm coupler, 4,001-point centreline sampling); the build's asset test re-runs it. Revisit if the V2 route or cover planform changes.
- [ ] **`rods_forged` variant flange/web dimensions are illustrative placeholders** — no published aftermarket H-beam flange thickness or web depth; M13 adopts the stock interface (163.0 mm c2c, 62.9 mm journal, 34.5 mm pin, 27.676 mm big-end width) and one grade-C vendor's qualitative Callies description ("thicker H-beam flanges / reduced depth of cut", ARP L19 fasteners), with the flange/web magnitudes and the 12-point fastener labeled placeholders. This is a **single weak source**; the catalog entry is generic. Revisit with a dimensioned aftermarket rod drawing or a measured part.
- [ ] **Camshaft visual with valve-lift kinematics** — M13 defers the cam visual (owner decision OD-1). A cam that rotates at half crank speed but does not drive the valves would be mechanically dishonest; wiring lobe lift into the valve kinematics requires a published duration/timing profile (not available) and opens `src/core/kinematics.ts`/`valveConfig.ts` in a future milestone. Revisit only with an owner decision and a sourced lobe profile.
- [ ] **Injector nozzle visual** — +30 % flow is nozzle-internal; the 7-hole count is published but hole diameter is unverified (0.155 mm candidate, low confidence). Revisit with a verified nozzle drawing or flow-bench data.
- [ ] **Heads port visual** — LLY port geometry is unpublished and unmodeled; no source publishes an external-casting difference (the external identity is inferred from the casting listing, not measured). Revisit with a dimensioned port drawing or a scanned head.
- [ ] **CP3 stroker external visual** — the stroker's difference is internal cam-ring stroke; no source publishes an external housing difference (the external identity is inferred from the replacement listing, not measured). Revisit only if a stroker with a distinct external housing/FCA is documented.
- [ ] **Rod variant inter-rod clearance** — the variant keeps the 27.676 mm big-end axial width and the stock 0.724 mm inter-rod gap; do not adopt the published 28.4 mm aftermarket big-end width without re-checking the shared-pin layout. Revisit if the pin/seat geometry changes.
- [ ] **`docs/M7-DATA.md` §3 "rod I-beam" erratum** — the shipped GLB and `build_cylinder1.py` are H-beam; the frozen M7 register row is stale wording, not a different asset. M13 records the erratum in D-048 and `docs/M13-INTERNAL-VARIANTS.md`; correct the row only if a future milestone reopens `M7-DATA.md`.
