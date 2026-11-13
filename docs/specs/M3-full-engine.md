# Milestone 3 Spec — The Full Engine: 8 Detailed Cylinders, Registered Exterior, Confirmed Studio Look

Repo: `colinstephens93/CarbonDuramax` · Branch: `m3-full-engine` (create from `main`, which includes Milestones 0–2 merged) · Plan reference: PLAN.md Milestone 3 ("Replicate to 8 cylinders; register the exterior GLB to the project frame; confirm the studio look"), exit criterion: "Full engine runs; no visible interference at any crank angle; both device tiers meet budget." Performance budgets are the normative tables set at Milestone 2 exit in `docs/M2-MEASUREMENTS.md` §5 (decision D-033). This spec was geometry- and arithmetic-self-checked before handoff (see §11); the checks are executable where the spec says so.

**Coding is done by the user in Antigravity on branch `m3-full-engine`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

Like Milestone 2, this spec fixes the **interfaces** (config additions, layout geometry, file paths, test contracts) and leaves implementation choices inside the renderer to the builder, except where a budget or an acceptance criterion depends on them.

## 1. What Milestone 3 is

Milestones 1–2 built one detailed cylinder (cylinder 1) among seven primitives. Milestone 3 makes the whole engine detailed and presentable:

1. **Replicate the cylinder-1 assembly to all 8 cylinders.** Every cylinder gets the full M2 assembly (piston, rod, valves, springs, bridges, rockers, pushrods, lifters, injector, head section), driven per cylinder by the unchanged math core. The M1 primitive cylinders, wireframe bank boxes, and floating valve discs are removed.
2. **A shared-pin crankshaft.** Paired cylinders (1&2, 3&4, 5&6, 7&8) share one crank throw per station — four throws, both rods side-by-side on one journal — plus a main shaft tying the throws together. This is exactly consistent with the frozen core (proof in §3).
3. **Replication-driven layout fixes.** Three M2 placements only worked for a lone cylinder and are corrected for all cylinders, including cylinder 1: the crank pin journal is lengthened to carry two rods (§3); the lifters move to new gallery positions so adjacent cylinders' pistons, lifters, and pushrods all clear each other (§4); and the head section's deck slab gains proper pushrod recess windows on both faces, because tiled M2 heads leave no gap for a neighbor's pushrods to pass (§4). The geometry was re-derived and checked numerically (§11).
4. **Register the exterior GLB.** The user's exterior model (`public/Duramax_LLY_2005_66L_V8.glb`, the same file the legacy viewer uses) is aligned to the project frame, scaled to contain the internals, merged for draw-call economy, and shown behind an **Exterior** toggle (default off — the internals are the product; Milestone 4 adds the views that look inside a shown shell).
5. **Confirm the studio look** (D-024: draft at M2, confirmed at M3) and record it as decision D-034 (§7).
6. **Two quality profiles** (Full / Phone) with an Auto default, so budget compliance is verified on both tiers per the plan's M3 exit criterion (§8).
7. **Reference frames** for visual comparison across milestones (closes the OPEN_ITEMS entry): `docs/REFERENCE_FRAMES.md` definitions plus captured PNGs (§9).

**Non-goals for M3:** no core changes (frozen, §2); no explode / cutaway / x-ray / labels (M4); no performance model or catalog (M5/M6); no engine block casting (the engine reads as exposed internals, as at M2; the registered exterior covers the closed look); no sound; no new part designs beyond the crank-throw revision in §3.

## 2. Frozen and amended files

**Frozen — no changes:** everything in `src/core/`; `src/config/engineConfig.ts`; `src/config/valveConfig.ts`; `public/legacy/**`; `public/Duramax_LLY_2005_66L_V8.glb` (byte-identical; it is registered by transform, never edited); the M2 part GLBs **except** `rot_crankthrow_c1_stock.glb` (revised per §3) and `sta_head_c1_stock.glb` (deck recess windows per §4) — both revised through the same build script and generator flow. `assets-src/dimensions.json` is regenerated only through the existing generator, reflecting the config amendments below.

**Amended — `src/config/detailConfig.ts` only, exactly these changes:**

| Change | Field | Value | Meaning |
| --- | --- | --- | --- |
| Add | `pinJournalLengthMm` | 58 | Crank pin journal length along X — carries both rods of a pair (§3) |
| Add | `rodSeatOffsetMm` | 14.2 | Each rod's plane offset from its station center along X (§3) |
| Add | `lifterIntakeXOffsetMm` | 56 | Intake lifter top offset from the bore plane along X (§4) |
| Add | `lifterExhaustXOffsetMm` | 35 | Exhaust lifter top offset magnitude along X (applied at −X) (§4) |
| Add | `lifterIntakeValleyOffsetMm` | 36 | Intake lifter top offset toward the valley (bank-local W) (§4) |
| Add | `lifterExhaustValleyOffsetMm` | 55 | Exhaust lifter top offset toward the valley (bank-local W) (§4) |

**Retained deliberately:** `pushrodValleyOffsetMm` (19) stays in the config. It is a live input to `build_cylinder1.py`'s head deck polygon (the scallop shaping) — removing it would break the mandated script re-run and change the head geometry. The M3 renderer no longer uses it for lifter placement (the §4 fields supersede that role); the build script's use is reshaped per §4's recess windows. No other config fields change, and no field is removed.

All values carry `confidence: 'placeholder'` and a source note like the existing fields ("M3 spec §3/§4 — derived from rod big-end width / cross-cylinder clearance geometry"). No other config fields change. `detailConfig` continues to be the single interface between TypeScript and Blender: all six new fields flow through `dimensions.json`; the build script derives the §4 recess windows from the lifter/cup fields (the pushrod lines' positions at the slab band) rather than hard-coding window constants, and derives the journal from `pinJournalLengthMm`.

## 3. The shared-pin crankshaft

**Layout fact (from M1/M2, unchanged):** stations (1,2), (3,4), (5,6), (7,8) sit at station centers X = 3.5, 2.5, 1.5, 0.5 × `borePitch` (115 mm) from the rear plane. Bore planes stay **at the station centers** — pistons, heads, and valvetrains are placed exactly as M2 placed cylinder 1's, replicated. Only the crank/rod interface changes.

**Why one throw per station is exact, not approximate.** The core gives each cylinder a phase φ from the firing order (1-2-7-8-4-5-6-3 at 90° intervals) and computes piston displacement by the slider-crank formula along that cylinder's own bore axis. For each station pair, φ_LH ≡ φ_RH + 90° (mod 360°) — verified for all four pairs in §11. Because the bank angle is also 90°, a single physical pin rotating with the RH cylinder's phase produces, along the LH bore axis, exactly the displacement the core computes for the LH cylinder (slider-crank displacement is 360°-periodic in its angle argument). So: **one throw per station, rotating with the pair's RH cylinder phase; each cylinder's rod aims from its seat on the shared pin to its wrist point, and the rod length comes out exactly `rodLength` for both rods with no scaling** (the YZ geometry is the core's; the X offsets below are equal at pin and wrist, contributing zero length change).

**Throw revision (the only GLB change in M3).** `build_cylinder1.py`'s crank throw is revised and re-run:

- Pin journal length along X becomes `pinJournalLengthMm` (58), replacing the single-rod journal. (Derivation: the rod big-end width measured from the committed rod GLB is 26.4 mm; seats at ±`rodSeatOffsetMm` = ±(26.4/2 + 1.0) = ±14.2 give a 2.0 mm gap between the two rods; journal half-length 29 leaves 29 − (14.2 + 13.2) = 1.6 mm margin at each end.)
- Webs move outboard of the journal ends; web thickness and radius unchanged (`crankWebThicknessMm` 18, `crankWebRadiusMm` 62). Web outer faces then sit at ±(29 + 18) = ±47 from the station center — inside the ±57.5 station slice ✓, and 21 mm clear of the neighboring station's web faces (115 − 2×47).
- The `rot_crankpin_c1_stock` node stays at the journal center; the M2 contract expectations for it (translation `(0, +crankThrowMm, 0)` in file space) are unchanged.
- All other part files regenerate byte-identical or not at all — re-running the script must not change the other eight GLBs' geometry (regeneration byte differences from exporter version are acceptable, as at M2, provided contract tests pass).

**Rod placement (renderer).** For cylinder *i* at a station: the rod's plane sits at X = stationX + seat, where seat = −`rodSeatOffsetMm` for the RH cylinder of the pair and +`rodSeatOffsetMm` for the LH cylinder. The pin point for aiming is (seatX, pinYZ) where pinYZ comes from the core's `crankPinPositionM` for that cylinder (its X component is replaced by seatX; its YZ is the shared pin's, identical for both pair members by the identity above). The wrist aim point is (seatX, wristYZ from the core's piston position along the bore axis). The piston mesh itself stays centered on the bore plane — the rod's small end meets the wrist pin 14.2 mm off the piston's center plane, well inside the pin bore (small-end width 23.5 mm, measured). Rod length is exactly `rodLength` under this placement (§11); the renderer must **not** scale rods.

**Main shaft (renderer-built primitive, no new GLB).** A shaft along the crank axis connecting the four throws: a cylinder (radius **32 ± 2 mm**, matching the throw GLB's existing journal segment radius ≈ 32.4 so the joints don't step) spanning from behind the rear station to ahead of the front station, plus a front snout/pulley disc and a rear flange disc as simple turned shapes. The shaft is axisymmetric about the crank axis, so it is added to the scene unrotated (its rotation is invisible); the four throws rotate about the crank axis, each with its pair's RH phase, positioned at its station center. Total added triangles must stay ≤ 3,000.

## 4. Valvetrain replication layout (supersedes M2 lifter placement for all cylinders)

Bank-local frame per cylinder, exactly as M2 §3: X along the crank (0 at the bore plane, + toward the front), W in the bank plane (+ toward the valley), B along the bore from the crank axis. Valve, bridge, and rocker geometry is **unchanged from M2 Revision 2** (pads at W ±23, cups at X ±60 with intake cup W −19 / exhaust cup W +19, shaft at W 0, B = deck + 110).

**What changes: the lifter points, the pushrod lines, and the head's deck recesses.** M2 placed each lifter at (X ±60, W +19, B 130) — directly below its cup. Replicated, that fails three separate ways (all verified numerically, §11): neighboring stations' lifters land 5 mm apart with 23.85 mm-diameter bodies; the pushrod lines pass within ~43 mm of the *neighboring* bore axis, inside its piston's sweep; and the lines cross the *neighboring* head's deck slab, which tiles contiguously with no gap. A fourth defect — the lifter body grazing its *own* piston's sweep by ~0.4 mm — exists even in M2's single cylinder and is fixed by the same move. M3 therefore places the lifters asymmetrically on the valley side (the "lifter point" is the lifter's **top** point = the pushrod's bottom endpoint, matching `lifterTopBoreOffsetMm` = 130 semantics; the lifter mesh's origin sits at that point, its body extending ~39.5 mm down-bore from it, as in the M2 file):

| Point | Intake | Exhaust |
| --- | --- | --- |
| Lifter top | (X **+56**, W **+36**, B **130**) | (X **−35**, W **+55**, B **130**) |
| Pushrod top (cup, unchanged) | (X +60, W −19, B 376.5) | (X −60, W +19, B 376.5) |

The pushrod remains the M2 two-point part (unit cylinder + sphere ends, placed bottom at the lifter top point, aimed at the cup, scaled to the exact distance); it now leans in both X and W. Checked clearances for this layout (full table in §11): pushrod radial distance to its **own** bore axis ≥ 58.5 in the piston's swept band and to the **neighboring** bore axis ≥ 57.1 (both need > 55.9 = piston radius 51.4 + tube radius 4.5); lifter axes sit 66.6 / 65.2 mm from their own bore axis, clearing their own piston's sweep by 3.2 / 1.8 mm of surface gap (axis distance must exceed piston radius + lifter radius = 63.35 — a check M2's placement also fails by 0.4 mm, invisibly, and this layout fixes); cross-cylinder pushrod minimum distance ≈ 29 mm (tubes Ø 9); nearest lifter-to-lifter ≈ 30.6 mm (bodies Ø 23.85); lifter surfaces stay ≥ 57 mm from the neighboring bore axis (inside its piston sweep would be < 51.4); lifter bodies stay ≥ ~85 mm from the crank axis, clear of the 62 mm crank webs radially (X overlap with a neighbor's webs is harmless at that radial distance).

**Head deck recess windows (head GLB revision).** The M2 head's deck slab (B 267.5–279.1, |W| ≤ 39.15, X ±57.5, with face scallops recessed only to |X| = 53.475 in narrow W bands) cannot pass the M3 pushrod lines once slabs tile: a 9 mm tube cannot thread the scallop pockets. The build script's deck polygon is therefore revised so that **both** ±X faces carry **both** recess windows: recess floor at |X| = **43.0**, with material absent for W ∈ **[−8, +11]** and W ∈ **[+26, +41]** (the second band breaks the slab's valley-side edge at |W| = 39.15 — intended, it reads as a gallery notch). At slab heights, the lines that actually enter a slab's X span are: the cylinder's own exhaust line (X ≈ −48.9..−50.1, W ≈ +34.9..33.2 — inside the [26, 41] window, tube included) and the rear neighbor's intake line crossing the −X face (X ≈ −56.7, W ≈ +4 — inside the [−8, +11] window). The own intake line passes just outside the +X face (X ≈ +58.2..58.4) and the front neighbor's exhaust passes at X ≈ +65.5 rel. this cylinder — both clear of the slab entirely. End-station heads simply have unused windows. The head's outer bounds (±57.5 X, ±39.15 W, deck-to-seat heights) do not change, so the M2 contract bounds still hold; the recess parameters must be asserted in the build script's log output (floor and bands ≥ the spec windows) since bounds tests cannot see interior recesses — Buckley additionally verifies them in the §11 sweep close views. Above the slab (B > 279.1) the lines run from |X| ≈ 49–58 up to their cups at |X| = 60, terminating inside the M2 head assembly's own envelope (spring towers/guides reach |X| ≤ ~37; the rocker shaft runs to |X| = 57.5 and its pedestals to 47.4 at W ±5.8 near B 372–381 — the cups the lines end at are part of that assembly, and tower clearance is ≥ 12 mm in X); against the neighbor's upper structure the lines stay ≥ 55 mm away in X rel. the neighbor, vs its towers at ≤ 37.

This section **supersedes** M2's lifter placement: cylinder 1 is re-rendered with the new lifter points too. Lifter and pushrod GLBs are placement-agnostic shapes and do not change; the head GLB changes only in its deck polygon recesses.

**Per-cylinder assembly transform.** Each cylinder's detailed assembly is built in the same bank-local frame M2 used for cylinder 1 and instanced/placed per cylinder: translated to its station center, oriented by the core's `bankBoreAxis` for its bank, and driven per frame from `computeState` exactly as M2 drove cylinder 1 (piston along bore, rod two-point aim, throw rotation — now the station's shared throw, valve/spring/bridge/rocker/pushrod kinematics from that cylinder's own lifts). The renderer structure from M2 (part loader, part-local frame wrapper, per-part update functions) generalizes; how the builder organizes eight assemblies (cloned groups, `InstancedMesh`, or a mix) is their choice **subject to the budgets in §8** — the M2 measurements project `InstancedMesh` batching at ≈28 draw calls for all internals, and any structure meeting the call budget is acceptable.

**Firing highlight** applies to the firing cylinder's piston as at M2 (orange emissive). With instancing, use the piston mesh's instance color; with cloned groups, the M2 cloned-material approach. Exactly one cylinder highlighted at any θ (core property, unchanged).

## 5. Exterior GLB registration

**File:** `public/Duramax_LLY_2005_66L_V8.glb` — loaded from its existing path (same file as the legacy viewer; do not copy or modify it).

**Registration method (measured, documented — not eyeballed).** The file has 234 meshes / primitives and **no node names or transforms** — there are no labeled pulley/flange nodes to find. Identify the crank axis geometrically: the model's long axis is file X (bounds 2.547 × 1.693 up × 2.467 wide, ≈29,660 triangles by direct parse — recount and record at M3); the axis endpoints are the centers of the extreme-X mesh clusters (front pulley cluster at max X, rear flange cluster at min X), and the axis line's (Y, Z) position is measured from those clusters (or, if no feature center is identifiable, taken as the bounds-center line and recorded as an assumption). Record in `docs/M3-MEASUREMENTS.md`: the file bounds, the axis endpoints and line position, the transform applied (rotation, translation, uniform scale), and the containment checks. The transform must satisfy:

- The model's crank axis lies **on** the project crank axis (the X axis line through the origin), front toward +X; model up maps to project +Z.
- **Uniform scale only** (non-uniform scaling is forbidden), driven by containment, not by a fixed length: the scaled shell's width must be ≥ the internals' width (≈**587 mm**: the rocker castings are the widest/tallest internals — a vertex at B = 392.9, W ±22.1 projects to **293.4 mm per side**) **+ 20 mm**, and its height ≥ the internals' height (≈**355 mm**: tops +293.4, webs −62) **+ 20 mm**. From the file bounds (width 2.467, height 1.693, axis 2.547) the width constraint binds: scale ≥ 607/2467 ≈ 0.246, giving an axis span **S ≥ 627 mm** and height ≈ 417 mm. Record the actual scale and span.
- **Placement:** the axis's rear end sits at X = −A, where the rear overhang A ∈ [12, S − 480] (nominal 20): internals reach X ≈ −9.9 behind the rear plane (rear station's rocker castings; lifters only to −2.4), and the model's rear portion is the adapter/flywheel housing, which legitimately sits behind the X = 0 block plane; the front of the shell then lands at S − A ≥ 480, covering the internals' front reach ≈ 470. In the cross-section, place the axis so containment margins are ≥ 10 mm on every side (height slack at S = 627 is ≈ 41 mm total; width ≈ 10 mm per side if the axis is laterally centered — verify from the measured axis line, do not assume).
- After placement, the shell must **contain** the internals: no internal part may cross the shell's surface at any crank angle in the §11 sweep with the exterior shown. If the measured file geometry makes these constraints unsatisfiable, **stop and report** — Buckley will adjust the anchor. Do not distort the model.

**Draw-call economy.** The file's 234 primitives carry 99 material slots but only **22 unique material definitions**. At load: deduplicate identical material definitions, then merge geometries per unique material (`BufferGeometryUtils.mergeGeometries` or equivalent) into **≤ 24 meshes**, preserving appearance. The merged exterior casts and receives **no** shadows. It is a single toggleable group.

**UI:** an **Exterior** checkbox in the controls panel, default **unchecked**. Toggling must not disturb the animation state. The illustrative caption (§7) is extended to cover the exterior.

## 6. What gets removed

The M1 primitive rendering for cylinders 2–8 (primitive pistons/rods, wireframe bank boxes, floating valve discs, primitive crank webs/main line — superseded by §3's shaft) is deleted. The M2 draft-studio lighting, ground, fog, and HDRI environment stay (§7). The `?benchmark=1` telemetry from M2 stays available.

## 7. Studio look confirmation and caption

Per D-024, the M2 draft look is **confirmed at M3** with the values as built at M2 — Poly Haven `studio_small_09` 2k HDRI, ACES tone mapping at exposure 1.1, background `0x0b0b0d`, `environmentIntensity` 0.8, `environmentRotation` (π/2, 0, 0), `FogExp2(0x0b0b0d, 0.11)`, ground disc roughness 0.95 / metalness 0, single shadow-casting key light — **unless** the full-engine view exposes a defect (e.g. rear cylinders unreadably dark, springs blowing out), in which case the builder makes the smallest fix and lists every changed value in `docs/M3-MEASUREMENTS.md`. Decision **D-034** (recorded with this spec): "Studio look confirmed at Milestone 3 with the as-built M2 values; any M3 adjustments are listed in docs/M3-MEASUREMENTS.md and become the confirmed values."

**Caption** (bottom-left, exact text): "Illustrative geometry, part shapes & timing: Detailed part shapes, valve timing/lift profiles, placeholder dimensions, shared-pin crank layout, lifter gallery placement, and the registered exterior shell are illustrative placeholders, not verified LLY measurements."

## 8. Quality profiles and budget compliance (normative)

Budgets (D-033, from `docs/M2-MEASUREMENTS.md` §5) — the M3 exit criterion requires **both tiers** to comply:

| Metric | Desktop (Full) | Phone |
| --- | --- | --- |
| Scene asset triangles | ≤ 360,000 | ≤ 320,000 |
| Submitted triangles / frame | ≤ 700,000 | ≤ 400,000 |
| Draw calls / frame (incl. shadow pass) | ≤ 250 | ≤ 120 |
| Texture + HDRI GPU memory | ≤ 64 MiB | ≤ 32 MiB |
| Frame time @ 900 RPM whole-engine | ≤ 16.7 ms (60 FPS) | ≤ 33.3 ms (≥ 30 FPS) |

**Profiles.** A **Quality** selector in the controls: `Auto` (default), `Full`, `Phone`. Auto selects Phone when the viewport width is < 768 px, else Full. The **Phone profile** differs from Full only in rendering cost knobs: shadow mapping **off** (the ground shadow is replaced by nothing — the ground disc and fog still ground the scene; a fake contact blob is allowed but not required), pixel ratio capped at 1. Geometry, parts, and animation are identical in both profiles — the phone tier is the same engine, rendered cheaper. (Projections: ≈305k scene triangles both tiers; ≈560–590k submitted on Full with the shadow pass, ≈305k on Phone without; instanced draw calls ≈110–160 Full / ≈75–95 Phone — all inside budget. The exterior, when toggled on, adds its merged ≤24 calls and ≈29.7k triangles in either profile; compliance is measured with the exterior **off** (the default) and reported both ways.)

**Compliance deliverable:** `docs/M3-MEASUREMENTS.md` (§10) records `renderer.info` and frame time for both profiles, exterior off and on, measured like M2's (10 s at 900 RPM, stated viewport and machine), with a compliance table against the budgets above. Any metric over budget is a failed acceptance criterion — report it in the closing summary rather than silently shipping.

## 9. Reference frames

Create `docs/REFERENCE_FRAMES.md` defining fixed comparison frames, and commit captures (PNG, from the preview at 1440×900, Full profile) under `docs/reference-frames/`:

- **RF-1** — θ = 0°, whole engine, default camera: overall read, firing highlight on cylinder 1.
- **RF-2** — θ = 470°, camera close on cylinder 1's head: intake lift, spring compression, rocker tilt at peak.
- **RF-3** — θ = 180°, whole engine, **exterior on**: registration/containment read.
- **RF-4** — θ = 705°, top-down whole engine: bank symmetry, lifter gallery rows, pushrod clearances.

Each definition states crank angle, camera position/target (the app's actual values), profile, exterior state, and what to look for. (This closes the OPEN_ITEMS "screenshot reference frames" entry; Buckley removes it when M3 merges.)

## 10. Deliverables

1. Renderer generalization per §§3–5, 8: eight detailed cylinders, shared-pin crank + shaft, exterior group + toggle, quality selector. M1 primitives removed (§6).
2. `src/config/detailConfig.ts` amendments per §2 (exactly the listed amendments); `assets-src/dimensions.json` regenerated by the existing generator.
3. Revised `rot_crankthrow_c1_stock.glb` (§3) and `sta_head_c1_stock.glb` (§4 deck recesses) from the updated `build_cylinder1.py`; the other eight GLBs' geometry unchanged.
4. `docs/M3-MEASUREMENTS.md`: per-part and total triangle counts for the ×8 engine; exterior registration record (§5); `renderer.info` + frame time for both profiles, exterior off/on (§8); budget compliance table; interference sweep report (§11 method); any studio-look changes (§7).
5. `docs/REFERENCE_FRAMES.md` + `docs/reference-frames/*.png` captures (§9).
6. Tests (§12) all passing; typecheck and production build passing.

## 11. Pre-build self-check (recorded; the spec's geometry claims, verified numerically)

Recomputed by script before handoff (this section exists so the builder can trust — and re-run — the numbers):

- **Shared-pin identity:** φ from firing order 1-2-7-8-4-5-6-3: φ = {1:0, 2:90, 7:180, 8:270, 4:360, 5:450, 6:540, 3:630}. Pairs (RH, LH) need φ_LH ≡ φ_RH + 90 (mod 360): (1,2): 90 ≡ 0+90 ✓; (3,4): φ₄ = 360 ≡ 0 and φ₃ + 90 = 720 ≡ 0 ✓; (5,6): 540 ≡ 450+90 ✓; (7,8): 270 ≡ 180+90 ✓. (Independently confirmed against `kinematics.ts`: `crankPinPositionM` returns the same YZ point for both members of a pair.) Rod length under §3 placement: pin and wrist share seatX; YZ distance is the core slider-crank distance = `rodLength` exactly → no rod scaling.
- **Journal fit:** rod big-end width measured from the committed rod GLB = 26.4 mm → seats ±14.2 (2.0 mm between the rods), journal 58 spans both big ends with 1.6 mm margin at each end; webs at ±(29..47) stay inside the ±57.5 slice; web-to-web across stations = 115 − 94 = 21 mm.
- **Lifter/pushrod clearances (§4 layout; piston swept band B ∈ [88.5, 264.5], piston radius 51.4, so a pushrod center must stay > 55.9 from any bore axis; lifter body Ø 23.85 and small-end width 23.46 measured from the GLBs):**
  - Own bore axis: intake line (56, 36, 130) → (60, −19, 376.5) minimum radial in band = **58.5** ✓; exhaust line (−35, 55, 130) → (−60, +19, 376.5) minimum = **60.1** ✓ (both > 55.9; the §12.2 test asserts the inequality from the config values).
  - Neighboring bore axis (115 mm away, same bank): intake minimum = **57.1** ✓; exhaust minimum = **75.2** ✓.
  - Lifters vs their **own** piston sweep: lifter axis distance from the bore axis = **66.6** (intake) / **65.2** (exhaust) vs the contact threshold 51.43 + 11.93 = 63.35 → surface gaps **+3.2 / +1.8 mm** ✓. (M2's lifter at (60, 19) gives 62.9 — a 0.4 mm graze against its own piston that was never visible at M2's single-cylinder scale; M3's layout eliminates it.)
  - Cross-cylinder pushrods (intake of station *k* vs exhaust of station *k+1*, and mirror): minimum center distance ≈ **29 mm** (tubes Ø 9) ✓. Lifter-to-lifter minimum = **30.6 mm** (intake of *k* vs exhaust of *k+1*) ✓.
  - Lifters vs neighboring piston sweep: center distance to the neighbor axis ≥ **69.1** → body surface ≥ 57.2 > 51.4 ✓. Lifters vs crank webs: lifter body points stay ≥ **85.5 mm** from the crank axis (intake side; exhaust 94.0) > web radius 62 ✓ — clearance is radial, not by X separation (a neighbor's webs do overlap the lifter's X span).
  - Deck slab crossings (slab B 267.5–279.1, |W| ≤ 39.15): own intake passes outside the +X face (X +58.2..58.4); own exhaust crosses its own slab at (X −48.9..−50.1, W +34.9..33.2); rear neighbor's intake crosses this slab's −X face at (X ≈ −56.7, W ≈ +4); front neighbor's exhaust passes at X ≈ +65.5 rel. this cylinder — the two crossings sit inside the §4 recess windows (floor |X| = 43.0; bands [−8, +11] and [+26, +41] on both faces, tube spans included) ✓. Above the slab, lines stay within the M2 assembly envelope (see §4) ✓.
- **Budget fit (from M2 measurements):** ×8 internals 275,360 + exterior ≈29,660 (direct parse; M2 doc said 31,396 by a different counting method — recount at M3) ≈ **305,000 scene triangles** ≤ 320,000 (phone) ✓. Submitted-triangle and draw-call compliance is measured at M3 per §8 (projections: Full ≈ 560–590k submitted with the shadow pass ≤ 700k; Phone ≈ 305k, no shadow pass, ≤ 400k; calls per the M2 doc's instancing projection).

**Interference sweep (builder, reported in M3-MEASUREMENTS.md):** with the preview running the production build, scrub θ from 0° to 705° in 15° steps (48 frames) at the whole-engine view, Full profile, exterior off, then repeat RF-3's angle set with exterior on. Report any visible part intersection, any pushrod/piston or lifter/rod contact, and any internal part crossing the exterior shell. Expected: none, per the table above; anything found is a spec-level finding — report it, do not patch around it silently.

## 12. Tests

Existing suites stay green, with these adjustments and additions:

1. **GLB contract tests (updated):** the six M2 tests still apply to the eight unmodified files. For the revised crank throw: node names and the crank-pin node translation expectation unchanged; add an assertion that the pin journal's length along file X is `pinJournalLengthMm` ± 2 mm (measure the pin node's mesh bounds). For the revised head: outer bounds unchanged (the M2 bounds assertions still apply); the §4 recess windows are verified by the build script's logged parameter assertion plus the §11 sweep close views, not by bounds tests. Triangle budgets unchanged (≤ 15k per file — the lengthened journal and deeper recesses change counts only slightly; ≤ 60k for the cylinder-1 assembly definition, which is unchanged in kind).
2. **New layout tests** (`src/renderer/layout.test.ts` or equivalent pure module — the layout constants the renderer uses for seats, lifter points, and station centers must live in a pure, testable function, not be scattered literals): assert station centers; rod seats (±`rodSeatOffsetMm` by bank); lifter points per §4; and the computed minima, all as inequalities computed from the config (expected values per §11): pushrod radial clearance in the band > 55.9 from the **own** bore axis **and from the neighboring bore axis**, both channels; lifter axis distance from the **own** bore axis > 63.35 (body surface clear of its own piston sweep), both channels; cross-cylinder pushrod minimum distance > 25; lifter-to-lifter spacing > 30; lifter center distance to the neighboring bore axis > 63.35 (body surface clear of the neighbor's piston sweep).
3. **Config/dimensions sync test** (existing) must pass with the amended field set (§2) — JSON keys remain exactly the TS field names.
4. **Full suite:** all tests passing (expected ≈ 24–26 total), `npm run typecheck` clean under strict TS, `npm run build` succeeds. The architecture test's rules are unchanged (no `three` imports outside the renderer; core stays pure).

## 13. Acceptance criteria (Buckley verifies from a fresh clone + deployed site)

1. **Frozen files untouched** (diff vs `main`): `src/core/`, `engineConfig.ts`, `valveConfig.ts`, legacy viewer, the exterior GLB, and the eight unmodified part GLBs (geometry; byte differences only where exporter regeneration explains them and contract tests pass). `detailConfig.ts` differs from `main` by exactly the §2 amendments.
2. Typecheck, full test suite, and build pass from a clean `npm ci`.
3. **Deployed site:** all eight cylinders detailed and moving; phasing spot-check θ = 0 / 90 / 180 → Cyl 1 (RH) / 2 (LH) / 7 (RH) with the orange highlight on the correct detailed piston; at θ ≈ 470 cylinder 1's intake springs visibly compress and its rockers tilt; shared throws visibly carry both rods of each pair; no M1 primitives remain.
4. **Interference:** the builder's §11 sweep report is in M3-MEASUREMENTS.md with no unresolved intersections; Buckley's deployed spot-check at the four reference-frame angles agrees.
5. **Exterior:** toggle shows/hides the shell; RF-3 capture shows it registered (crank axis on the project axis, front at +X, containing the internals); registration record in M3-MEASUREMENTS.md recomputes consistently (Buckley checks the transform arithmetic from the recorded file-space axis endpoints).
6. **Budgets:** M3-MEASUREMENTS.md's compliance table shows both profiles inside the §8 budgets (exterior off), with exterior-on figures reported.
7. **Studio look:** confirmed values as built (or every change listed per §7); caption reads exactly as §7.
8. **Reference frames:** `docs/REFERENCE_FRAMES.md` + four PNG captures committed and matching their definitions.

## 14. Handoff

Work on branch `m3-full-engine` in the local clone. When done, push the branch and send a closing summary covering: files changed, test/typecheck/build results, both profiles' `renderer.info` and frame time, the sweep outcome, the exterior registration numbers, and anything that deviated from this spec. Buckley verifies, opens the PR, and merges. Local environment notes: Node 24, Blender 5.2.3 (the build script is version-tolerant; keep it that way), three@0.187.0 API discipline per `docs/THREE_API_NOTES.md`.
