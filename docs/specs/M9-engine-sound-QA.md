# M9 Engine Sound — Independent QA Report

**QA status: COMPLETE — passes 1 and 2, all blockers and should-fix findings addressed; package ready for Buckley's audit.** Two independent reviewers (separate contexts from the drafting agent) audited `docs/specs/M9-engine-sound.md` and `docs/research/M9-engine-sound-survey.md` on branch `plan/m9-engine-sound` @ `9aaf400`. Pass 1 raised **1 blocker / 13 should-fix items (S1–S13)** plus 8 nits; pass 2 raised **no blockers** and 13 overlapping/additional items. All blockers and should-fix dispositions are recorded below; the combined nits are recorded and either fixed or consciously accepted. The reviewers did not edit repo files, commit, or push.

- Date: 2026-11-14. Reviewers: two independent QA agents (D-030/D-037 pre-review step 4).
- Inputs: `docs/PLANNING.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`, `docs/specs/M5-performance.md`, `docs/specs/M8-part-variants.md`, `docs/M2-MEASUREMENTS.md` §5, `docs/M8-MEASUREMENTS.md` §4–5, and the shipped tree (`src/core/interfaces.ts`, `src/core/kinematics.ts`, `src/perf/**`, `src/ui/engineControls.ts`, `src/main.ts`, `index.html`, `package.json`).
- Independent recomputation: `npx vite-node` scripts in `%TEMP%\m9qa\` (outside the repo) against the real `src/perf` model; `esbuild 0.28.2` for the size measurement; Node 24.16.0 / Vite 7.3.8. No spec or repo file was modified by either reviewer except this report (written by the drafting agent from their reports).
- Limitations: neither reviewer could listen to the Web Audio graph or run a browser; the audible result and device behavior are verified by the deployed acceptance checks (§11 of the spec). The original pass-1 reviewer could not re-fetch two sources (Commercial Motor 80k–130k rpm, DTIC BPF PDF) because of HTTP/content-type limits; those claims remain cited from the search index and are marked as such in the survey.

## 1. Scope and method

1. Recomputed every number in spec §3.7 and §13 from the formulas and the real `computeDetails` output, independently of the drafting prototype: firing rate, throttle/idle/load/boost derivations, layer gains/frequencies, whistle/BPF arithmetic, the modified-build 2400-rpm point, the page-weight sums, and the update-cost claim.
2. Audited the spec against the shipped code by grep and file reads: `CrankState`, `computeDetails`/`DynoPointDetail`, `onState`, `onBuildChange`, `mountEngineUi`, the rAF loop, the benchmark harness, `index.html`, `package.json`, `main.ts` ordering, and the frozen-file claims.
3. Judged the design positions: no load channel, full-load-model × throttle, slow-motion silence, hidden-tab suspend, iOS AudioSession, 3rd-order vs literal BPF, page-weight guard, and test falsifiability.
4. Sampled the survey's decisive sources and checked the arithmetic; flagged the JASI 404, the HAL 3× attribution, and the 3.5 kHz attribution (pass 1).
5. Checked anti-drift/plan compliance: new Milestone 9 through §9 paperwork, D-040 vs D-010/D-033, the frozen list, and the code-free planning branch.

## 2. Findings and dispositions

### 2.1 Blocker (1)

| ID | Finding | Disposition |
| --- | --- | --- |
| B1 | §10 test 2 expected `idle01(900) = 0.8648141` within `1e-6`; the exact value is `0.864815657715066`, so the test as written fails. | **Fixed.** Test 2 now uses `0.864815658` within `1e-6`; the smoothstep itself is unchanged. |

### 2.2 Should-fix (13; all fixed unless stated)

| ID | Finding | Disposition |
| --- | --- | --- |
| S1 | Benchmark batch count was inconsistent (10,000 in §5.4 vs 100 in §7.2/D-040/§13.6) after an intermediate revision. | **Fixed.** All references are now the 100-call batch; §11.9 names `audioUpdate.usPerCall`. The 100-call batch is also safer for the AudioParam timeline than 10,000 (`~2,000` events, bounded). |
| S2 | §13.5 arithmetic mixed a 62.4 ms total with 0.072 µs/call; the ratio “700×” was stale. | **Fixed.** Re-measured the final prototype: three runs 54.4 / 54.0 / 51.6 ms, 0.0516–0.0544 µs/call; the spec quotes 54.0 ms / 0.054 µs and ~1,850× below the 100 µs budget. Pass-2's independent implementation measured 0.0546 µs/call, consistent. |
| S3 | Page-weight arithmetic mixed gzip bytes with an uncompressed startup payload; §11.3's 0.10 % bound conflicted with the minified cap (0.122 %). | **Fixed.** Acceptance is evaluated on the **gzip** delta (0.051 % at budget); the minified-cap 0.122 % is recorded as informational. §7.1, §11.3, §13.1 and §13.6 agree. |
| S4 | PLAN exit text attributed a page-weight budget to D-033, which the spec says has none. | **Fixed.** PLAN text now says “respects the §7.1 page-weight guard and the D-033 frame-cost budget”. |
| S5 | Frozen-audit command omitted `vite.config.ts`, `tsconfig.json`, `.github`, `docs/ASSET_CONTRACT.md`, `docs/THREE_API_NOTES.md`, `docs/REFERENCE_FRAMES.md`, and the M9 plan files. | **Fixed.** §11.1's diff list now includes them. |
| S6 | §4.5 stated as fact that iOS `audioSession.type='playback'` defeats the Ring/Silent switch; the W3C draft and MDN do not say that, and the survey's only mechanism source is a grade-D note. | **Fixed.** §4.5 now says “intended”, platform-defined/experimental, verified on a device in §11.8; the fallback and OS-mute caveat are explicit. |
| S7 | The 2 s white-noise loop had no seam treatment; QA flagged a possible periodic splice. | **Fixed.** §3.5 adds a 20 ms equal-power `loopSeamCrossfade` helper (`noiseSeamMs = 20`), and test 7 checks the helper's length/convexity. (White noise makes an audible click unlikely, but the seam treatment is cheap and removes the question.) |
| S8 | The 180 ms suspend timer was not cancelled by a fast off→on or Pause→Play, so the context could suspend while the UI said On. | **Fixed.** §4.2/§4.4 require cancellation of a pending suspend on any transition that makes the audible condition true; test 11 advances the fake timer and asserts running/audible. |
| S9 | The injected environment could not express `supported`, so the fake-context tests could not exercise the unsupported branch without mutating `globalThis.AudioContext`. | **Fixed.** `EngineAudioEnvironment` gains `isSupported()`; the controller derives the initial `supported` flag from it; test 9 covers the unsupported environment. |
| S10 | New lifecycle mechanisms (generation token, hide-during-start, pagehide, bfcache, audioSession interruption, dispose) had no tests. | **Fixed.** Test 11 now covers those cases plus the suspend-timer cancellation and `setLoadPoints` validation. |
| S11 | “No new dropped frames” was undefined and not in the benchmark JSON. | **Fixed.** `droppedFrames` is defined as `frame delta > 1.5 × the run's median delta`, printed in the JSON, and bounded at sound-off + 1 in §7.2/§11.9. |
| S12 | Research: the JASI link 404s (sole source for the 1.3–3.5 kHz turbo bands); the HAL 3× component is attributed to its experimental setup; the 3.5 kHz peak was attributed to Kanda & Mori, which does not state it. | **Fixed.** JASI row removed/retired and the band claim dropped; HAL's setup caveat added and the 3rd-order choice relabelled illustrative; 3.5 kHz removed; the 3.15 kHz abstract-page caveat retained. The spec's §3.6/§3.8 wording no longer calls 3× “published”. |
| S13 | The 27.93 psi / 5,362 Hz modified build was not pinned (“`turbo_large`, `tune_performance`, etc.”). | **Fixed.** §13.2 pins `stockBuild.selections` + `turbo:'turbo_large'` + `tune:'tune_performance'`, states the other ten slots stay stock, and §11.5 uses the same build; `turbo_large` alone does not change the 2400-rpm point (stock tune still requests 2.42 PR). |

### 2.3 Nits (recorded; fixed unless stated)

| ID | Finding | Disposition |
| --- | --- | --- |
| N1 | “±22 %” ignored the drift; total at 650 is ±32 %, at 900 ±28 %. | **Fixed** in §3.4. |
| N2 | The pulse wave is approximately unipolar; the “40 % floor” claim was wrong. | **Fixed** in §3.5: positive burst on a continuous bed, gain ~0.95×–1.6× base, never zero. |
| N3 | gzip numbers were tool/level-sensitive. | **Fixed** by naming gzip level 9 and the Vite report; baseline 199,299 B level 9, prototype 1,735 B level 9. |
| N4 | `.scratch/` is inside the worktree, not “outside the repo”. | **Fixed** by wording “outside version control”; the directory is deleted before the plan commit. |
| N5 | D-040 said “suspends immediately … when paused or in slow motion”, while §4.4 uses a 180 ms timer. | **Fixed**: hidden = immediate; paused/slow = 0.12 s fade + 180 ms timer. |
| N6 | Survey said “strong 0.5-order component”; the source says clearly present but smaller than 1.5-order. | **Fixed** in survey §2.2. |
| N7 | §3.8's “single source of truth” table omitted several constants. | **Fixed**: title is “Principal constants”, the §3 equations are declared the full source, and the load divisor, waveform duties/decays, lope/drift, AM depth and idle clatter term are now in the table. |
| N8 | `dispose()` is in the API but not wired in `main.ts`/UI. | **Accepted with test**: test 11 covers `dispose()` closing the context, zeroing stats and unsubscribing; the app has no normal teardown path, and `dispose` is for API completeness/tests. |
| N9 | `setLoadPoints` did not validate. | **Fixed**: §4.0 requires non-empty, ascending, finite validation; test 11 covers rejection. |
| N10 | The measurement doc promised 900/3200 benchmark parameters, but the harness runs at 900 only. | **Fixed**: benchmark values at 900; 2400/3200 values captured from the deployed UI. |
| N11 | `audio.update` could inflate the existing D-033 CPU metric if placed inside its timing block. | **Fixed**: §5.2 pins it outside the `cpuRenderSamplesMs` block and puts the batch before the window reset. |
| N12 | `Sound: unavailable` text and the `disposed` reason were not pinned. | **Fixed**: §4.6 notes the disposed state; §5.1 pins `Sound: unavailable`. |
| N13 | The survey's 3.5 kHz sentence and JASI row lingered after the S12 fix. | **Fixed**: 3.5 kHz sentence removed; JASI row retired. |

### 2.4 Pass-2 (second reviewer) overlap

The second reviewer independently confirmed the decisive numbers and reported no blockers. Its findings 1–13 map to B1/S2/S3/N3, the §2.1 visibility-row error (fixed: the row is now “New in M9”), the prototype-scope overstatement (fixed: “pure model + graph construction, lower bound”), the runtime-vs-type-only import boundary (fixed), the proxy-range wording (fixed), the note wording (fixed: “engine speed, throttle/load and boost”), the missing constants/full-load label (fixed), the `createSoundParameters` prototype mismatch (fixed: spec value 0 wins), the batch placement (fixed), the disposed/unavailable pinning (fixed), and the missing QA record/commit (this report + the commit). Its only remaining item was the not-yet-committed package, which this report and the branch commit close.

## 3. What was independently recomputed

All values below were recomputed from the real `src/perf` model and the spec formulas; the pass-1 and pass-2 tables agree.

| Quantity (stock) | 650 | 900 | 1600 | 2400 | 3200 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `firingHz` | 43.3333 | 60.0000 | 106.6667 | 160.0000 | 213.3333 |
| `throttle01` | 0 | 0.098039 | 0.372549 | 0.686275 | 1 |
| `idle01` | 1 | 0.864815658 | 0 | 0 | 0 |
| `load01` | 0.080000 | 0.143682 | 0.422745 | 0.677059 | 0.820000 |
| `boost01` | 0 | 0.026738 | 0.304813 | 0.686275 | 1 |
| `firingGain` / `firingLpfHz` | 0.168 / 306 | 0.174369 / 350.578 | 0.202275 / 545.922 | 0.227706 / 723.941 | 0.242 / 824 |
| `clatterGain` / `clatterHz` | 0.200800 / 1912 | 0.206543 / 2001.155 | 0.209914 / 2391.843 | 0.276035 / 2747.882 | 0.313200 / 2948 |
| `bodyGain` / `bodyLpfHz` | 0.048 / 356 | 0.054368 / 400.578 | 0.082275 / 595.922 | 0.107706 / 773.941 | 0.122 / 874 |
| `whistleHz` / `whistleGain` | 1000 / 0 | 1127.005 / 0.001083 | 2447.861 / 0.025611 | 4259.804 / 0.073558 | 5750 / 0.120000 |
| `bpfHz` / `bpfGain` | 3666.667 / 0 | 4132.353 / 0.000197 | 8975.490 / 0.007573 | 15619.281 / 0.025583 | 21083.333 / 0.045000 |
| `lopeHz` / `lopeDepth` ratio | 5.417 / 0.220000 | 7.500 / 0.190259 | 13.333 / 0 | 20.000 / 0 | 26.667 / 0 |

- Modified at 2400 (`stockBuild.selections` + `turbo_large` + `tune_performance`): `boostPsiGauge` 27.930000, `fuelMm3` 110.000000, `load01` 0.780000, `boost01` 0.918255, `whistleHz` 5361.709, `whistleGain` 0.107407, `bpfHz` 19659.601. Matches §13.2.
- Firing-wave coefficients: `a1 = 0.158801`, `a2 = 0.124837`, `a3 = 0.084963`, `a4 = 0.046077`, `a5 = 0.013764`, `a6 = −0.008595`, `a32 = −0.0006925`, `a64 = −0.00005134`; length 65, DC 0.
- Noise: 96,000 samples / 384,000 B at 48 kHz; deterministic; min ≈ −0.999988, max ≈ 0.999990.
- Graph: 21 nodes; 6 oscillators; noise source once.
- Page weight: 768,085 + 1,438 + 6,312,947 + 2,968,040 = **10,050,510 B**; +5,120 = **0.050943 %**; +12,288 = **0.122262 %**; 12,288/768,085 = 1.5998 %; 5,120/200,330 = 2.5558 %.
- Bundle: baseline 768,085 B minified; Vite gzip 200.33 kB; gzip level 9 199,299 B. Prototype 3,954 B minified / 1,735 B gzip level 9 (pure model + 21-node graph; `applyParams`/lifecycle not included — a lower bound).
- Update cost: 1,000,000 calls in 54.4 / 54.0 / 51.6 ms = 0.0516–0.0544 µs/call (Node 24.16.0); pass 2's independent implementation 54.6 ms / 0.0546 µs/call.

## 4. Residual risks / honest uncertainty

- **No listening test and no browser Web Audio run were part of QA.** The graph/lifecycle findings are code-reading and interface analysis. The audible character, the mix balance, autoplay, hidden-tab suspension, slow-motion silence, and the iOS silent-switch behavior are acceptance items 4–9 in the spec; they must be verified on the deployed build and a real iPhone.
- **iOS silent switch is platform-defined.** `audioSession.type='playback'` is an experimental API; the spec claims only intent and requires a device record. If the device still mutes with the switch on, the spec's documented fallback applies (and acceptance records it).
- **The audio mix gains are authored, not measured.** No LLY recording exists; the survey documents the published anchors and labels the gains/levels illustrative. The build may reveal a mix imbalance that the acceptance listening check catches; the spec's pinned gains are the starting point, and any deviation must be recorded.
- **Research sources:** the JASI 404 source was removed; the HAL 3× component is explicitly attributed to its experimental setup; the Kanda 3.15 kHz figure is from indexed full text, not the linked abstract; the Commercial Motor 80k–130k rpm and DTIC BPF pages could not be re-fetched by QA (index citations only). No load-bearing value depends on a single weak source: the firing formula is service literature, the 4-stroke order/0.5-order behavior is multi-source, and the BPF arithmetic is definitional.
- **Benchmark timing is environment-sensitive.** The 0.30 ms frame-p95 delta and the 100 µs batch bound are generous relative to the measured 0.054 µs computation, but a single run should be repeated if it lands near the bound; the spec records both sound-off and sound-on runs.
- **Page weight is a product guard, not a D-033 normative metric.** The guard is 0 new assets and ≤ 5,120 B gzip added (0.051 % of startup payload); the minified cap is informational at 0.122 %. A future milestone that adds audio samples/worklets would need a new decision.
- **The planning branch is docs-only.** The QA record, spec and survey are committed with the plan; the build branch is separate. `.scratch/` is deleted before the plan commit; no code is on `plan/m9-engine-sound`.

## 5. Final status

**All blockers and should-fix findings are closed in the current draft; the nits are recorded above; the package (spec + survey + this QA record) is ready for Buckley's audit.** The independent recomputation agrees with the spec's §3.7/§13 tables to their stated rounding, the page-weight and frame-cost arithmetic is consistent, the frozen-interface and code-free-planning claims hold, and the remaining uncertainty is the audible/device verification the build must perform.
