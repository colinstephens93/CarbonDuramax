# Milestone 9 Spec — Engine Sound

Repo: `colinstephens93/CarbonDuramax` · Branch: `m9-engine-sound` (create from `main`, which includes Milestones 0–8 merged at `9aaf400`) · Planning package: this spec + `docs/specs/M9-engine-sound-QA.md` (independent QA record) + `docs/research/M9-engine-sound-survey.md` (sourced research survey) · Plan reference: **new milestone, not in PLAN.md v2.2** — Milestone 9 is added to the plan by this spec's paperwork deliverables (§9), per the anti-drift rule. The mechanism is a new `src/audio/` layer plus a Sound control; `src/core/interfaces.ts` and `src/perf/**` are **unchanged**. Sound reads the existing `CrankState` and the existing `computeDetails` output (D-010/D-013). Budgets (D-033) still apply; measured page-weight and frame-cost numbers are in §7 and §13.

**Coding is done by the user in Antigravity on branch `m9-engine-sound`, working in the local clone. Buckley verifies from a fresh clone, opens the PR, and merges. Do not open a PR yourself; push the branch with a closing summary.**

## 1. What Milestone 9 is

Milestones 0–8 built the running engine, the views, the performance model, the parts catalog, the verified data, and the visual variants. M5 and M8 both recorded **engine sound** as an explicit non-goal/deferred candidate. Milestone 9 adds it without adding a single audio byte of downloaded content:

1. **A procedural Web Audio engine (§3):** a 21-node graph synthesized entirely in the browser — a firing-frequency pulse train, a diesel idle lope, combustion/injector clatter, and a turbo whistle — with **zero sampled loops, zero audio files, zero new npm dependencies** and no changes to the 3D scene.
2. **Sound driven by the existing simulation (§2):** engine speed comes from `CrankState.rpm`; throttle/load is derived from the shipped `Throttle (RPM)` control; boost comes from the existing performance model's `computeDetails` result for the current build. The sound layer is read-only: it never writes to the simulation, the dyno, the catalog, or the renderer.
3. **Autoplay-safe, user-controlled sound (§4–§5):** no `AudioContext` exists until the user presses the new **Sound** control; the control is a clear mute/unmute toggle; the context suspends when the tab is hidden, when playback is paused, or when slow motion is selected; mobile is explicitly handled (touch-size control, iOS audio-session opt-in, no background audio).
4. **An explicit idle-vs-loaded character (§3.4, §3.7):** idle is dominated by low-order firing and half-order lope with no whistle; loaded running brightens the clatter, raises the firing body and adds the boost-tied whistle. The transition is continuous over the RPM range.
5. **Budgets proven with measured numbers (§7, §13):** the page payload grows only by the minified/gzipped audio code (no new assets), and the frame budget is protected by measuring the audio update separately in the existing `?benchmark=1` harness. The measured planning prototype is 3,954 B minified / 1,735 B gzip (level 9) for the pure model + 21-node graph construction — a **lower bound**; `applyParams` and lifecycle glue are not in it. The build's budget is ≤ 12,288 B minified / ≤ 5,120 B gzip added.

**Non-goals for M9:** no sampled or recorded audio, no audio files, no AudioWorklet, no `ScriptProcessorNode`, no new dependencies, no changes to `src/core/**` (frozen interface or kinematics), no changes to `src/perf/**` (model, config, resolver, stock build, tests), no new simulation state or load channel, no changes to the renderer, catalog, schema, part assets, reference frames, or prior docs/specs; no dyno sound, no sound driven by the dyno inspector RPM, no volume slider, no persisted sound preference, no background playback, no per-cylinder independently voiced cylinders, no dB calibration or claim that the sound is a measured LLY recording.

**Provenance position.** The engine sound is an **illustrative synthesis**, not a reproduction. Published anchors: the four-stroke V8 firing-rate formula (4 firings/rev), the 0.5-order idle-imbalance signature, the 800–2500 Hz structural / ~3.15 kHz knock region, the GT3788VA 11-blade compressor count, the blade-pass formula, and the typical 80,000–130,000 rpm turbo range. Values with no published LLY source — the exact combustion spectrum, the turbo shaft-speed map, per-cylinder variation, and the acoustic levels — are labelled **illustrative** here and in `docs/M9-SOUND.md`; no dB value is claimed. `docs/research/M9-engine-sound-survey.md` records every source and verdict.

## 2. Signal sources and the read-only contract

### 2.1 What already exists in the shipped app

| Source | Shipped shape | M9 use |
| --- | --- | --- |
| `CrankState` (`src/core/interfaces.ts`, frozen) | `{ crankAngleDeg, rpm, pistonPositionM, valveLiftM }`, computed every animation frame by `computeState()` — **shipped** | Reads **only** `rpm`. `crankAngleDeg` is not used for phase locking (see §3.3); the renderer's motion is untouched. |
| `Throttle (RPM)` slider (`src/ui/engineControls.ts`) | One range input, 650–3200 rpm, default 900, labelled "Throttle (RPM)" — **shipped** | Normalized to `throttle01` (§2.2). This is the app's only throttle-like user control; there is no separate pedal or load channel. |
| `computeDetails(build, catalog?)` (`src/perf/index.ts`, existing) | 25 `DynoPointDetail` objects at 1000–3400 rpm step 100, including `boostPsiGauge` and `fuelMm3` — **shipped function** | **New wiring in M9:** `main.ts` passes the current build's detail array to the audio controller at startup and on every build change. **No perf code changes.** |
| Play/Pause and slow-motion (`src/ui/engineControls.ts`) | `isPlaying` and a 1× / 0.1× / 0.01× multiplier — **shipped** | Passed to the audio controller as `EnginePlaybackState`; sound is audible only at 1× and while playing (§4.4). |
| Visibility | **New in M9** — the shipped app has no `visibilitychange`/`pagehide` handling | M9 adds the listeners; sound suspends immediately when hidden (§4.3). |

### 2.2 Derived audio signals (the explicit position on throttle/load/boost)

The app has **no independent load signal**: the only user control is engine speed, labelled "Throttle (RPM)". M9 therefore does not invent a hidden simulation state. It derives three audio signals, and this derivation is the spec's position:

```
rpm          = CrankState.rpm                                  // live, 650–3200
throttle01   = clamp((rpm − 650) / (3200 − 650), 0, 1)         // normalized slider travel
idle01       = 1 − smoothstep(750, 1400, rpm)                  // 1 below 750, 0 at/above 1400
detail       = interpolate(computeDetails(build), clamp(rpm, 1000, 3400))
fuelMm3      = 8 + throttle01 × (max(detail.fuelMm3, 8) − 8)    // idle floor + demand-scaled full-load fuel
load01       = clamp(fuelMm3 / 100, 0, 1)                      // audio load estimate
boost01      = clamp((detail.boostPsiGauge / 20.874) × throttle01, 0, 1)  // demand-scaled full-load boost
```

- `20.874 psi` is the stock model's full-load boost at and above 1800 rpm: `(2.42 − 1) × 14.7`. It is a fixed audio reference, not a new model constant; a modified build can exceed 1.0 before the clamp.
- The `8 mm³` idle fuel floor is an **illustrative audio value**. The performance model is steady-state **full-load** and does not model idle fuel; without a floor, the normalised load at 650–900 rpm would be zero and the idle would have no character.
- The model's full-load boost is scaled by `throttle01` to estimate part-throttle delivered boost. This is an audio interpretation of the existing model output, **not** a change to the model: the dyno, its curves and its binding limits are untouched, and the audio never feeds back into them.
- The detail array is a `readonly EngineLoadPoint[]` structurally (`{ rpm, boostPsiGauge, fuelMm3 }`); the audio module does not import `src/perf` at runtime. `main.ts` is the only place that calls `computeDetails` for audio.

### 2.3 What is deliberately not a source

- **The dyno inspector RPM** is not used; sound follows the live engine RPM only.
- **`crankAngleDeg` / `pistonPositionM`** are not used to phase-lock individual firing pulses. The firing rate is frequency-locked to `rpm`; no sample-accurate crank-angle phase alignment is claimed (§3.3). At 1× the worst-case visual/audio phase error is at most one firing interval — 23.1 ms at 650 rpm, 16.7 ms at 900 rpm — and slow motion is silent.
- **The renderer** is not touched. No sound-driven camera, light, label, or mesh change.
- **No `partVariants`/`modelPath`/visual state** is read; the sound follows the selected build's performance parameters only through the existing `computeDetails` output.

### 2.4 Build-change handling in `main.ts`

`main.ts` already computes `stockDynoDetails` and `initialModifiedDetails` on load. On every `onBuildChange(build)`:

1. Call `scene.setVisualVariantSelections(visualVariantsForBuild(build, fullCatalog))` exactly as today.
2. Call `audio.setLoadPoints(computeDetails(build, fullCatalog))` in a `try/catch`; on error, `console.error` and keep the previous points (the sound continues on the last valid curve). The duplicated `computeDetails` call (the UI also computes it for the dyno) is user-initiated, once per selection change, and is not on the animation path.
3. No other ordering change; `onBuildChange` still fires before the compatibility branch, so an incompatible selection's visual and audio state follow the dropdowns while the dyno shows its violation. The audio curve for an incompatible-but-resolvable build is computed by the model; compatibility is a catalog-level rule, not a model error.

## 3. Synthesis design

### 3.1 Approach decision

**Chosen: a small, fixed Web Audio node graph built and scheduled on the main thread, with all sound generated procedurally.** The graph is 21 permanent nodes; six oscillators and one looping noise buffer are started once; the main thread only updates `AudioParam`s once per animation frame. The firing pulse is a custom `PeriodicWave`; the noise is a generated seeded buffer; nothing is fetched or decoded.

Alternatives considered and rejected:

| Alternative | Why rejected |
| --- | --- |
| Sampled loops / recordings | Violates the owner's "strongly prefer zero-download procedural" direction, adds page weight and licensing/provenance problems, and repeats audibly over a 650–3200 rpm sweep. |
| `AudioWorklet` DSP | Would put the synthesis on the audio thread and allow sample-accurate per-firing scheduling, but adds a second built module and a separate load path; the chosen graph is only 21 nodes and does not need per-sample JavaScript. The extra build/load risk is not justified at this milestone. |
| `ScriptProcessorNode` | Deprecated, runs on the main thread, and is exactly the frame-cost risk D-033 guards against. |
| More oscillators / per-cylinder voices | At 3200 rpm there are 213 firings/s; eight independently voiced cylinders would multiply node count and scheduling cost for a character difference the brief does not require. Half-order modulation is the published imbalance signature and costs one LFO. |

### 3.2 The audio graph

```
audio path:
firingOsc(PW, 64 harmonics) → firingLpf(lowpass) → firingGain ─┐
noiseSrc(loop, 2 s) → clatterBp(bandpass) → clatterGain ───────┤
noiseSrc → bodyLpf(lowpass) → bodyGain ────────────────────────┤→ master → limiter → destination
whistleOsc(sine) → whistleGain ────────────────────────────────┤
bpfOsc(sine) → bpfLpf(lowpass 10 kHz) → bpfGain ───────────────┘

control paths (AudioParam modulation, not audio-bus connections):
pulseOsc(PW, 16 harmonics) → pulseDepth → clatterGain.gain
lopeOsc(sine) → lopeDepth → firingGain.gain
driftOsc(sine) → driftDepth → firingGain.gain
```

| # | Node | Type / settings | Purpose |
| ---: | --- | --- | --- |
| 1 | `master` | `GainNode`, starts at 0, target 0.42 | single mute/unmute and fade surface |
| 2 | `limiter` | `DynamicsCompressorNode`, threshold −10 dB, knee 6, ratio 12, attack 0.003 s, release 0.20 s | prevents clipping at the destination; no dB calibration is claimed |
| 3 | `firingOsc` | `OscillatorNode`, custom `PeriodicWave` from `firingWaveReal(64)` | firing-frequency pulse train |
| 4 | `firingLpf` | `BiquadFilterNode`, lowpass, Q 0.7 | firing body; cutoff from load |
| 5 | `firingGain` | `GainNode`, starts at 0 | firing level; modulated by the two lope LFOs |
| 6 | `noiseSrc` | `AudioBufferSourceNode`, mono, `min(sampleRate, 48000) × 2` samples, loop | seeded white noise for clatter and body |
| 7 | `clatterBp` | `BiquadFilterNode`, bandpass, Q 0.9 | combustion/injector clatter band |
| 8 | `clatterGain` | `GainNode`, starts at 0 | clatter level; amplitude-modulated by `pulseOsc` |
| 9 | `bodyLpf` | `BiquadFilterNode`, lowpass, Q 0.5 | low exhaust/block rumble |
| 10 | `bodyGain` | `GainNode`, starts at 0 | body level |
| 11 | `whistleOsc` | `OscillatorNode`, sine | 3rd-order turbo whistle (audible primary) |
| 12 | `whistleGain` | `GainNode`, starts at 0 | whistle level |
| 13 | `bpfOsc` | `OscillatorNode`, sine | literal 11-blade BPF (secondary layer) |
| 14 | `bpfLpf` | `BiquadFilterNode`, lowpass 10 kHz, Q 0.7 | keeps the BPF layer out of the top octave/ultrasonic region |
| 15 | `bpfGain` | `GainNode`, starts at 0 | BPF level |
| 16 | `pulseOsc` | `OscillatorNode`, custom `PeriodicWave` from `pulseWaveReal(16)` | narrow pulse train at firing rate for clatter bursts |
| 17 | `pulseDepth` | `GainNode`, starts at 0; output → `clatterGain.gain` | clatter AM depth |
| 18 | `lopeOsc` | `OscillatorNode`, sine | half-order idle lope |
| 19 | `lopeDepth` | `GainNode`, starts at 0; output → `firingGain.gain` | lope depth |
| 20 | `driftOsc` | `OscillatorNode`, sine | slow 0.37 Hz idle drift |
| 21 | `driftDepth` | `GainNode`, starts at 0; output → `firingGain.gain` | drift depth |

- All nodes are created **once** when the context is first enabled. No node is created in `update()`, on RPM change, on mute, or on visibility change. `getStats().nodeCount` is **21**.
- `noiseSrc` is a mono `AudioBufferSourceNode` looping a **2.0 s** buffer generated at `min(ctx.sampleRate, 48_000)` Hz, so its memory is capped at 384,000 B (96,000 float samples) even if a browser runs the context at 96 kHz. The buffer is seeded (see §3.5); it exists only while a context exists (after the first Sound-on click).
- Oscillators and the noise source are started once, at enable; mute/suspend is done with the master gain/context, never by stopping and recreating nodes.

### 3.3 Firing layer (the firing-frequency fundamental)

- **Frequency:** `firingHz = rpm × 4 / 60 = rpm / 15`. At 650 **43.333 Hz**, at 900 **60.000 Hz**, at 1600 **106.667 Hz**, at 3200 **213.333 Hz**. Four power strokes per revolution; the firing order does not change the rate (§2.1 of the survey).
- **Wave:** `firingOsc` uses a custom `PeriodicWave` built by `firingWaveReal(64)` with `disableNormalization: false` (the default). Real coefficients for harmonic `n = 1…64`:

  ```
  d = 0.18
  a_n = sin(π n d) / (π n) × exp(−n / 14)
  imag_n = 0
  ```

  This is a 18 %-duty combustion pulse train at the firing frequency, with 64 harmonics (at 3200 rpm the 64th harmonic is 13.65 kHz, below the 44.1 kHz Nyquist; `PeriodicWave` is band-limited by the browser). Measured coefficients: `a_1 = 0.1588`, `a_2 = 0.1248`, `a_3 = 0.0850`, `a_4 = 0.0461`, `a_5 = 0.0138`, `a_6 = −0.0086`, `a_32 = −0.00069`, `a_64 = −0.000051`.
- **Level and body:** `firingGain = 0.16 + 0.10 × load01`; `firingLpfHz = 250 + 700 × load01`. The firing layer is always present (idle included) and grows slightly with load; the low-pass opens from 306 Hz at idle to 824 Hz at full load, giving a duller thump at idle and a broader body under load.
- **Phase:** the oscillator starts at phase 0 when the context is created. Sound is **frequency-locked, not phase-locked** to the rendered crank angle. At 900 rpm the firing interval is 16.667 ms, equal to one 60 FPS frame; at 1× a phase offset is not perceptible against the crank animation, and slow motion is silent (§4.4). This is stated so the build does not attempt a crank-angle phase-lock that no test can verify.
- **No per-cylinder voicing:** a 90° V8 with even 90° firing intervals produces an even four-pulse train regardless of firing order. Cylinder-to-cylinder and bank-to-bank imbalance is represented by the half-order lope (§3.4), not by eight independently synthesized cylinders.

### 3.4 Diesel idle lope and the idle-vs-loaded transition

- **Idle weight:** `idle01 = 1 − smoothstep(750, 1400, rpm)`. At 650–750 rpm it is 1; at 900 rpm **0.865**; at 1000 **0.670**; at 1200 **0.226**; at 1400 and above **0**.
- **Half-order lope:** `lopeOsc` is a sine at `lopeHz = firingHz / 8` — one cycle per eight firings, i.e. one cycle per two crank revolutions, the 0.5 engine order. At 650 rpm this is **5.417 Hz**, at 900 **7.500 Hz**. Its depth is `lopeDepth = 0.22 × idle01` × the current `firingGain` (because the depth gain feeds `firingGain.gain`, whose base value is the firing gain). At 650 rpm the lope alone swings ±22 %; with the drift the total is ±32 %. At 900 the lope is ±19 % and with drift ±28 %.
- **Slow drift:** `driftOsc` is a sine at **0.37 Hz** with `driftDepth = 0.10 × idle01` × `firingGain`. The two incommensurate rates avoid a single obvious repetition; the result is a deterministic, quasi-periodic lope. No stochastic cycle-to-cycle variation is claimed.
- **Audible result:** at idle the firing body and clatter dominate, the firing level breathes at 5–7.5 Hz, and there is no whistle. As rpm rises through 900–1400 the lope and drift fade to zero, the low-pass opens, the clatter band rises, and the whistle fades in. The transition is continuous, not a mode switch; there is no discrete "idle mode" flag.

### 3.5 Combustion/injector clatter

- `noiseSrc` loops a **2.0 s** mono `AudioBuffer` generated at `min(ctx.sampleRate, 48_000)` Hz and filled by the seeded **mulberry32**-style PRNG below (seed `0x9E3779B9`). The buffer is deterministic, so two contexts produce identical noise and tests can reproduce it. No `Math.random()` and no downloaded noise.
- **Loop seam:** the buffer is generated with an extra 20 ms tail; `loopSeamCrossfade()` equal-power blends that tail into the first 20 ms and discards the tail, so the loop boundary is a continuous noise sequence rather than a hard splice. `noiseSeamMs = 20`; the pure helper is testable on its own (§10 test 7).

  ```
  s = (s + 0x6D2B79F5) >>> 0
  t = s
  t = imul(t ^ (t >>> 15), t | 1)
  t ^= t + imul(t ^ (t >>> 7), t | 61)
  sample = ((t ^ (t >>> 14)) >>> 0) / 4294967296 × 2 − 1
  ```

- **Clatter band:** `clatterBp` is a bandpass at `clatterHz = 1800 + 1400 × load01` Hz (Q 0.9) — 1912 Hz at idle, 2392 Hz at 1600 rpm, 2948 Hz at full load. This sits between the published 800–2500 Hz structural band and the ~3.15 kHz diesel-knock region (survey §2.1).
- **Burst modulation:** `pulseOsc` runs at the firing frequency with `pulseWaveReal(16)` (`d = 0.06`, `exp(−n/10)`). `pulseDepth = 0.6 × clatterGain` feeds `clatterGain.gain`, so the clatter level is amplitude-modulated once per firing event. The normalised pulse is approximately unipolar (its minimum is about −0.09 of its peak), so the modulation adds a positive burst on a continuous bed: the gain stays above ~0.95× its base and peaks at ~1.6×; it never gates the noise to zero.
- **Level:** `clatterGain = 0.10 + 0.26 × load01 + 0.08 × idle01`. At 650 rpm **0.201**, at 900 **0.207**, at 1600 **0.210**, at 3200 **0.313**. The 8 % idle term keeps the idle rattle present; the 26 % load term makes the loaded clatter dominant.
- **Injector lead is not modeled:** the burst is coincident with the firing pulse. The spec calls the layer "combustion/injector clatter" as a character, not a claim that injector-acoustic lead/lag is reproduced.

### 3.6 Turbo whistle

- **Shaft-speed proxy:** `shaftRpm = 20,000 + 95,000 × boost01`. It is **illustrative**; the survey found typical turbo speeds of 80,000–130,000 rpm but no LLY shaft-speed map (survey §3.2). At idle `boost01 = 0` → 20,000 rpm; at the stock full-load ceiling `boost01 = 1` → 115,000 rpm. The proxy is below the published 80,000–130,000 rpm range until `boost01 ≈ 0.63` (about 2,020 rpm in the stock build) and reaches 115,000 rpm at full boost; it is a demonstrative trajectory, not a measured map.
- **Primary whistle (audible):** `whistleOsc` is a sine at the **3rd order**, `whistleHz = 3 × shaftRpm / 60` → **1,000 Hz** at no boost, **2,448 Hz** at stock 1600 rpm, **4,260 Hz** at stock 2400 rpm, **5,750 Hz** at full boost. The 3rd-order component is reported in a lab turbo-noise study (survey §3.3; the study attributes the 3× band to its experimental setup), and using it as the engine's audible whistle is an **illustrative choice**, not an LLY measurement; the literal 11-blade BPF is 14.7–23.8 kHz at 80,000–130,000 rpm and is not reliably audible on phone speakers.
- **Level:** `whistleGain = 0.12 × boost01^1.3`. At 650–900 rpm it is ≤ 0.0011 (silent); at 1600 **0.026**; at 2400 **0.074**; at 3200 **0.120**.
- **Secondary BPF layer:** `bpfOsc` is a sine at the literal `bpfHz = 11 × shaftRpm / 60` — 3,667 Hz at no boost, 8,975 Hz at stock 1600, 21,083 Hz at full boost — through `bpfLpf` at 10 kHz, with `bpfGain = 0.045 × boost01^1.5`. It is a quiet air/whistle layer; the 10 kHz low-pass intentionally removes most of the top-end BPF content rather than pretending it is audible.
- **Build sensitivity:** because the boost comes from the current build's `computeDetails`, a build with the large turbo **and** the performance tune (which requests 2.90 PR; the large turbo alone still caps at the stock 2.42 request) changes the whistle at the same RPM. At 2400 rpm the stock whistle is **4,260 Hz**; `turbo_large + tune_performance` gives **5,362 Hz**. This is the milestone's "tracks the performance model's boost state" behavior, and it is tested (§10).
- **Smoothing:** all frequency and gain AudioParams use `setTargetAtTime(value, ctx.currentTime, 0.06)`; the whistle glides rather than steps when boost/RPM changes. Master gain uses 0.25 s on and 0.12 s off.

### 3.7 Level budget and idle-vs-loaded character

`masterGain` is fixed at **0.42** while audible and 0 while muted. All layers sum into `master`, then the limiter. No dB calibration is claimed.

Representative parameter values (stock build unless stated; from the §13 pre-build run):

| Signal | 650 rpm idle | 900 rpm default | 1600 rpm | 2400 rpm | 3200 rpm (max slider) |
| --- | ---: | ---: | ---: | ---: | ---: |
| `firingHz` (Hz) | 43.333 | 60.000 | 106.667 | 160.000 | 213.333 |
| `throttle01` | 0.000 | 0.098 | 0.373 | 0.686 | 1.000 |
| `idle01` | 1.000 | 0.865 | 0.000 | 0.000 | 0.000 |
| `load01` | 0.080 | 0.144 | 0.423 | 0.677 | 0.820 |
| `boost01` | 0.000 | 0.027 | 0.305 | 0.686 | 1.000 |
| `firingGain` | 0.168 | 0.174 | 0.202 | 0.228 | 0.242 |
| `firingLpfHz` | 306 | 351 | 546 | 724 | 824 |
| `clatterGain` | 0.201 | 0.207 | 0.210 | 0.276 | 0.313 |
| `clatterHz` | 1912 | 2001 | 2392 | 2748 | 2948 |
| `bodyGain` | 0.048 | 0.054 | 0.082 | 0.108 | 0.122 |
| `bodyLpfHz` | 356 | 401 | 596 | 774 | 874 |
| `whistleHz` | 1000 | 1127 | 2448 | 4260 | 5750 |
| `whistleGain` | 0.0000 | 0.0011 | 0.0256 | 0.0736 | 0.1200 |
| `bpfHz` | 3667 | 4132 | 8975 | 15619 | 21083 |
| `bpfGain` | 0.0000 | 0.0002 | 0.0076 | 0.0256 | 0.0450 |
| `lopeHz` | 5.417 | 7.500 | 13.333 | 20.000 | 26.667 |
| `lopeDepth` (× `firingGain`) | 0.220 | 0.190 | 0 | 0 | 0 |

The character is therefore:

- **Idle (650–900):** firing fundamental 43–60 Hz, strong half-order lope, no audible whistle, clatter present but not dominant. The default page opens at 900 rpm, so the first Sound-on click yields the idle lope.
- **Loaded (1600–3200):** firing rate and low-pass rise, clatter band and level rise, body grows, and the 3rd-order whistle fades in with boost, reaching 5.75 kHz at full load. At 2400 rpm the stock whistle is clearly present (4.26 kHz); the large-turbo build is higher still (5.36 kHz), which is the audible expression of the boost state.

The pure model's output shape is fixed:

```ts
export interface EngineSoundParameters {
  firingHz: number; firingGain: number; firingLpfHz: number;
  clatterGain: number; clatterHz: number; clatterQ: number; clatterAmDepth: number;
  bodyGain: number; bodyLpfHz: number;
  whistleHz: number; whistleGain: number;
  bpfHz: number; bpfGain: number;
  lopeHz: number; lopeDepth: number; driftHz: number; driftDepth: number;
  masterGain: number;
  boost01: number; load01: number; throttle01: number; idle01: number;
}
```

`computeSoundParameters(points, rpm, target)` writes into a caller-provided `EngineSoundParameters` and returns the same object (no per-frame allocation); `createSoundParameters()` returns the zero-initialised object with `masterGain: 0`. `getParameters()` before enable returns that zero-initialised object.

### 3.8 Principal constants (audited values)

`src/audio/engineSound.ts` exports one frozen constant object for the **principal** values below; the §3 equations are the full source for the waveform, LFO, and layer formulas, so the builder must not introduce magic numbers outside those equations. `createSoundParameters()` follows this spec (`masterGain: 0`), not the planning prototype (whose convenience constructor used 0.42).

| Constant | Value | Status / source |
| --- | ---: | --- |
| `uiMinRpm` / `uiMaxRpm` | 650 / 3200 | shipped UI slider bounds |
| `powerStrokesPerRev` | 4 | published V8 four-stroke firing rate (survey §1) |
| `boostReferencePsi` | 20.874 | derived from stock `boostReqPr 2.42` and 14.7 psi/atm (M5 config) |
| `idleFuelFloorMm3` | 8 | **illustrative** audio value; the model has no idle-fuel term |
| `shaftBaseRpm` / `shaftSpanRpm` | 20,000 / 95,000 | **illustrative** proxy between published 80k–130k operating range (survey §3.2) |
| `whistleOrder` | 3 | reported lab lower-order tone (survey §3.3); using it as the audible whistle is illustrative |
| `compressorBlades` | 11 | published GT3788VA compressor wheel (survey §3.1) |
| `firingHarmonics` / `pulseHarmonics` | 64 / 16 | audio-authoring choice; at 3200 rpm 64 × 213.33 = 13.65 kHz < Nyquist |
| `noiseSeconds` / `noiseSeed` | 2.0 / 0x9E3779B9 | audio-authoring choice; deterministic |
| `noiseSeamMs` | 20 | audio-authoring choice; loop-seam crossfade (§3.5) |
| `noiseMaxSampleRate` | 48,000 | audio-authoring choice; caps the noise buffer at 384,000 B on high-rate contexts |
| `loadDivisorMm3` / `idleFuelFloorMm3` | 100 / 8 | load normalisation / illustrative idle floor |
| `firingDuty` / `firingDecay` | 0.18 / 14 | firing pulse shape in §3.3 |
| `pulseDuty` / `pulseDecay` | 0.06 / 10 | clatter AM pulse shape in §3.5 |
| `lopeDivisor` / `lopeDepth` | 8 / 0.22 | half-order lope in §3.4 |
| `driftHz` / `driftDepth` | 0.37 / 0.10 | slow idle drift in §3.4 |
| `clatterAmDepth` / `idleClatterTerm` | 0.6 / 0.08 | clatter AM depth / idle clatter floor in §3.5 |
| `masterGain` | 0.42 | audio-authoring choice; limiter protects the output |
| `bpfLowpassHz` | 10,000 | audio-authoring choice; keeps the secondary BPF layer out of the top octave |

## 4. Lifecycle, autoplay, hidden tab, and mobile

### 4.0 Controller API (pinned)

`src/audio/engineSound.ts` exports the pure model and these structural types; `src/audio/engineAudio.ts` exports the controller and its environment seam. `src/ui/engineControls.ts` imports `EnginePlaybackState` **type-only** (no runtime UI → audio dependency).

```ts
export interface EngineLoadPoint { readonly rpm: number; readonly boostPsiGauge: number; readonly fuelMm3: number; }
export interface EnginePlaybackState { readonly playing: boolean; readonly speedMultiplier: number; }

export type EngineAudioReason =
  | 'off' | 'running' | 'hidden' | 'paused' | 'slow-motion' | 'blocked' | 'unsupported' | 'disposed';
export type EngineAudioContextState =
  | 'uninitialized' | 'starting' | 'running' | 'suspended' | 'closed' | 'unsupported';

export interface EngineAudioStatus {
  readonly supported: boolean;
  readonly enabled: boolean;          // user intent
  readonly audible: boolean;          // actually producing sound
  readonly contextState: EngineAudioContextState;
  readonly reason: EngineAudioReason;
}

export interface EngineAudioStats {
  readonly nodeCount: number;         // 21 after enable, 0 before
  readonly noiseBufferBytes: number;  // 0 before enable; min(sampleRate, 48000) × 2 × 4 after
}

export interface EngineAudioController {
  setEnabled(enabled: boolean): Promise<EngineAudioStatus>;
  setLoadPoints(points: readonly EngineLoadPoint[]): void; // sorted ascending, 25-point model grid
  update(state: CrankState, playback: EnginePlaybackState): void;
  getStatus(): EngineAudioStatus;
  getParameters(): Readonly<EngineSoundParameters>;
  getStats(): EngineAudioStats;
  dispose(): void;
}

// Test seam: the default implementation reads document/navigator/AudioContext; tests inject a fake.
export interface EngineAudioEnvironment {
  readonly isSupported: () => boolean;
  readonly createContext: () => AudioContext;
  readonly isHidden: () => boolean;
  readonly onVisibilityChange: (listener: () => void) => () => void;
  readonly onPageHide: (listener: () => void) => () => void;
  readonly setAudioSessionType: (type: 'auto' | 'playback') => void;
  readonly onAudioSessionStateChange?: (listener: (state: string) => void) => () => void;
  readonly schedule: (callback: () => void, delayMs: number) => number;
  readonly cancel: (handle: number) => void;
}

export function createEngineAudio(environment?: EngineAudioEnvironment): EngineAudioController;
```

`CrankState` is the frozen `src/core/interfaces.ts` type (type-only import). `EngineSoundParameters` is the pure model's output type (§3.7). The default environment must not **create** an `AudioContext` or attach `document`/`navigator` listeners before `setEnabled(true)` is called; `isSupported()` is a constructor feature-detect (`typeof AudioContext !== 'undefined'`) and is the single source of the initial `supported` flag, so tests can inject a fake environment that reports supported without a global `AudioContext`. `getParameters()` before enable returns the zero-initialised object; `getStats()` before enable returns `{ nodeCount: 0, noiseBufferBytes: 0 }`. `setLoadPoints(points)` validates cheaply at the boundary: non-empty, strictly ascending `rpm`, all values finite; an invalid array throws a descriptive error (it is a programming error, not user input). `main.ts` always passes the 25-point model grid, ascending. `setLoadPoints(points)` validates cheaply at the boundary: non-empty, strictly ascending `rpm`, all values finite; an invalid array throws a descriptive error (it is a programming error, not user input). `main.ts` always passes the 25-point model grid, ascending.

### 4.1 Autoplay: the context exists only after an explicit gesture

- `createEngineAudio()` constructs **no** `AudioContext` and touches no audio API at module load or at `main.ts` startup. The initial status is `contextState: 'uninitialized'`, `enabled: false`, `audible: false`.
- The **only** path that creates a context is `setEnabled(true)`, called synchronously from the Sound button's `click` handler. The handler calls `new AudioContext({ latencyHint: 'interactive' })`, builds the graph, starts the oscillators/noise source, and calls `resume()` in the same gesture task (no `await` before creation/resume). This satisfies Chrome's and Safari's gesture rules (survey §4.1).
- Concurrent `setEnabled` calls share one in-flight start promise; the UI also disables the button during a transition. A `setEnabled(false)` that arrives while a start is in flight bumps an internal generation token: when the stale start resolves, the controller suspends rather than ramping up, and returns the disabled status. This prevents a double-click or a fast on→off from leaving sound playing.
- If `ctx.state` is not `'running'` after `resume()` resolves, or `resume()` rejects, `setEnabled` returns `enabled: false`, `reason: 'blocked'`, and the UI note says the browser blocked audio. The context is retained for a retry; a subsequent Sound click retries. There is **no** fallback that starts audio on a non-Sound interaction. `setEnabled` never rejects: construction/resume errors are caught and returned as `blocked` (or `unsupported` if the constructor is missing), so `main.ts` can use `.then` without an unhandled-rejection path.
- No preference is persisted. Every page load starts muted, even for a returning user. `localStorage`/`sessionStorage` are not used.
- If `window.AudioContext` is missing, `supported: false`; the button reads `Sound: unavailable`, is disabled, and the rest of the app is unaffected.

### 4.2 Mute/unmute (the clear control)

- The Sound button's **off** state is `Sound: Off`, `aria-pressed="false"`; **on** is `Sound: On`, `aria-pressed="true"`. The visible text is the state; the button is a toggle, not a momentary "play" button.
- Enabling: context created/resumed, master ramps 0 → 0.42 over 0.25 s (no click/pop). Disabling: master ramps to 0 over 0.12 s, then the context is suspended after a 180 ms timer. Suspending the context is what releases the audio device; the graph is retained.
- **The 180 ms suspend timer is cancellable:** any transition that makes the audible condition true again (enable, Play, 1×, visible) cancels a pending suspend; the timer fires only if the condition is still false when it expires. This prevents the race where a quick off→on leaves the context suspended while the UI says `Sound: On`.
- Disabling also restores `navigator.audioSession.type = 'auto'` when the API exists (try/catch; absence is not an error).
- The graph never stops/restarts oscillators on mute; this avoids phase resets and node churn.

### 4.3 Hidden tab

- When `document.visibilityState` becomes `hidden` (tab switch, minimise, screen off), sound **suspends immediately** — no fade and no background playback. An immediate suspend is chosen over a fade because the output is not being heard at that moment, and a hidden tab must not keep the audio device or tab unthrottled (MDN notes tabs playing audio are exempt from background throttling; survey §4.2).
- On `visible`, the controller resumes **only if** the full audible condition holds (enabled, playing, 1× speed). It ramps master 0 → 0.42 over 0.25 s. If the engine is paused or slow motion is selected, the context stays suspended.
- The `update()` path also re-checks after a bfcache restore (`pageshow`): the first audible frame after a restore attempts `resume()` at most once per second, then ramps; this covers restores that do not emit `visibilitychange`.
- A hide that arrives while a start is in flight suspends the context as soon as the start resolves; a hide never leaves the master ramped up.
- `pagehide` also suspends. The context is not closed on hide; it is closed only on `dispose()`.
- If `resume()` on visible rejects (for example a browser that requires a new gesture), the controller sets `enabled: false`, `reason: 'blocked'`, shows `Sound: Off` and the retry note; it does not silently keep a suspended "on" state.

### 4.4 Pause and slow motion

- **Paused:** a stationary crank does not fire. `audible` is false, master ramps to 0 over 0.12 s, and the context suspends after 180 ms. On Play, it resumes and ramps; a Play inside the 180 ms window cancels the pending suspend. Enabling Sound while already paused creates/resumes the context but leaves the master at 0; no audio is heard until Play.
- **Slow motion (0.1× / 0.01×):** sound is **silent**. The audio model is authored for real-time firing rates; at 0.1× the firing fundamental would be 6 Hz at 900 rpm (infrasonic) and at 0.01× 0.6 Hz, and the turbo whistle would no longer correspond to the displayed running engine. The spec chooses silence over a misleading slowed-down or pitch-shifted version.
- **1×:** sound follows the live RPM exactly (including `speedMultiplier = 1`; the multiplier is not applied to the firing frequency).
- The sound note states "Plays at 1× speed; silent in slow motion, while paused, or hidden." No extra mode label is added to the button; the user sees the Play/Pause and speed controls next to it.

### 4.5 Mobile

- The same graph and the same control are used on the phone tier. Sound is **off** on load; the phone tier does not auto-start, and no audio work happens until the user taps Sound.
- The Sound button gets a **≥ 44 × 44 CSS px** touch target under `@media (max-width: 640px), (pointer: coarse)`; the top control row wraps (`flex-wrap: wrap; row-gap: 8px`) so the button is never squeezed off-screen. The panel keeps its existing scroll behaviour.
- On enable, if `'audioSession' in navigator`, try `navigator.audioSession.type = 'playback'` (W3C/MDN; experimental). `playback` is **intended** to keep an explicit media-playback action audible with the iOS Ring/Silent switch on, on browsers that implement the API; this behavior is platform-defined, experimental, and is verified on a real device in §11.8, not assumed here. `playback` may take audio focus and pause other media; that is accepted only after the user explicitly turns the engine sound on. On disable/dispose, restore `'auto'`. If the API is absent, throws, or the switch still mutes the output, the default Web Audio category applies and the OS silences the sound; `docs/M9-SOUND.md` records that caveat and the device result.
- If `navigator.audioSession` exists, listen to `statechange`: on `interrupted`, ramp/suspend; on `active` while the audible condition holds, resume/ramp. On browsers without it, rely on `AudioContext.statechange`; a suspended context is resumed only by the audible-state path or the next Sound click.
- No audio plays when the app is backgrounded (visibility/pagehide suspend). No media-session/now-playing metadata, no AirPlay/widget integration, no background audio.
- No volume slider in M9; the device's media volume is the only volume control. The fixed master and limiter are the level guarantee.

### 4.6 Audible-state truth table

`audible = supported && enabled && contextState === 'running' && !hidden && playing && speedMultiplier === 1`.

| enabled | hidden | playing | speed | context | audible | `reason` |
| :---: | :---: | :---: | :---: | :---: | :---: | --- |
| false | any | any | any | uninitialized/suspended | false | `off` |
| true | true | any | any | suspended (after hide) | false | `hidden` |
| true | false | false | 1× | suspended | false | `paused` |
| true | false | true | 0.1×/0.01× | suspended | false | `slow-motion` |
| true | false | true | 1× | running | true | `running` |
| true | false | true | 1× | suspended (resume failed) | false | `blocked` |
| false (unsupported) | any | any | any | unsupported | false | `unsupported` |

The `reason` is exposed by `getStatus()` for the UI note, acceptance checks, and the benchmark JSON. After `dispose()` the context is closed, `nodeCount` is 0, `audible` is false, and `reason` is `'disposed'`; this state is outside the run-time table because the app has no teardown path in normal use.

## 5. UI and wiring

### 5.1 Sound control in `src/ui/engineControls.ts`

- Add a `<button type="button" id="m9-sound-btn" class="m1-play-btn m9-sound-btn" aria-pressed="false" aria-label="Engine sound">Sound: Off</button>` to the existing top row, after the slow-motion group. It is a normal tab stop and responds to Space/Enter.
- Add a muted note element `<p id="m9-sound-note" class="m9-sound-note">` immediately after the top row. Default exact text:

  > `Synthesized live from engine speed, throttle/load and boost — illustrative, not an LLY recording. Plays at 1× speed; silent in slow motion, while paused, or hidden.`

  Blocked exact text:

  > `Sound could not start — check this browser's audio settings, then tap Sound again.`

  Unsupported exact text:

  > `This browser does not support Web Audio; the rest of the lab works without sound.`

  The note is `aria-live="polite"` so a blocked/unsupported change is announced; the default text is present on load.
- New `EngineUiOptions` field: `onSoundToggle?: (nextEnabled: boolean) => void`. New `EngineUiHandle` method:

  ```ts
  export type UiSoundState = 'off' | 'on' | 'blocked' | 'unsupported';
  setSoundState(state: UiSoundState): void;
  ```

  `UiSoundState` is exported from `src/ui/engineControls.ts`. `setSoundState` sets the button text, `aria-pressed`, disabled state (only `unsupported` disables), and the note text. The exact button texts are `Sound: Off`, `Sound: On`, and `Sound: unavailable` (the `blocked` state also shows `Sound: Off`, `aria-pressed="false"`, and the blocked note; clicking retries by calling `onSoundToggle(true)`).
- The click handler is optimistic only in that it calls `onSoundToggle(!currentEnabled)`; the visible state is owned by `setSoundState` from `main.ts` after `setEnabled` resolves. While a start is in flight, the button is disabled for that one transition (no double-start); it is re-enabled when the promise settles.
- CSS: `.m9-sound-btn { white-space: nowrap; }`, `.m9-sound-note { margin: -4px 0 10px; font-size: 10.5px; line-height: 1.35; color: #94a3b8; }`; under `@media (max-width: 640px), (pointer: coarse)`, `.m1-row { flex-wrap: wrap; row-gap: 8px; }` and `.m9-sound-btn { min-height: 44px; padding: 10px 14px; }`. Existing controls' styles are unchanged.
- `onState` gains a second argument: `onState: (state: CrankState, playback: EnginePlaybackState) => void`, where `EnginePlaybackState` is defined/exported by `src/audio/engineSound.ts` and imported type-only (§4.0). Existing single-argument callbacks remain type-compatible (a function with fewer parameters is assignable). The UI keeps **one** reusable `EnginePlaybackState` object, updates `playing`/`speedMultiplier` in place each tick, and passes it to `onState`; the audio controller reads it synchronously and must not retain or mutate it. No other UI behavior changes.

### 5.2 `src/main.ts` wiring

- **Ordering (pinned):** create the audio controller **before** `mountEngineUi`, immediately after the scene and the initial `computeDetails` calls. It creates no context at construction, so this is free, and it guarantees that the `onState` callback (including the synchronous `onState` calls made by `applyReferenceFrame` → `ui.setCrankAngleDeg`) and `onBuildChange` can reference `audio` without a temporal-dead-zone risk. Then:
  1. `const audio = createEngineAudio();`
  2. `audio.setLoadPoints(initialModifiedDetails);`
  3. `const ui = mountEngineUi(engineConfig, valveConfig, onState, { onBuildChange, onSoundToggle, ...existingOptions });` (the existing third positional `onState` argument gains the playback parameter; `onSoundToggle` is the new option).
  4. `uiRef = ui;` and the existing initial visual-state call.
  5. `ui.setSoundState(toUiSoundState(audio.getStatus()));`
  6. Existing `?rf=` / benchmark handling (the sound follows the final build; no sound reset is added).
- Define the UI mapping once:

  ```ts
  import type { EngineAudioStatus } from './audio';
  import type { UiSoundState } from './ui/engineControls';

  const toUiSoundState = (status: EngineAudioStatus): UiSoundState => {
    if (!status.supported) return 'unsupported';
    if (status.reason === 'blocked') return 'blocked';
    return status.enabled ? 'on' : 'off';
  };
  ```

- `onState` callback: after `scene.update(state)` and label refresh, call `audio.update(state, playback)`. Place the call **outside** the existing `cpuRenderSamplesMs` `t0/t1` block so the D-033 CPU-render metric is not inflated by audio. In `?benchmark=1&sound=1` mode only, run a **100-call batch** of `audio.update` with the last steady `CrankState`/playback once, **before** the harness resets `prevFrameMs` / starts the 10-second window, and report `audioUpdate: { iterations: 100, totalMs, usPerCall }`. Do not time it in normal mode and do not time it per frame: browser `performance.now()` is quantized (typically 100 µs), so a per-frame sample cannot resolve a sub-100 µs update; the batch average can. The 100-call batch writes ~2,000 parameter events at the same `ctx.currentTime` with the same target values; that is bounded and does not change the audible state.
- `onSoundToggle: (next) => { void audio.setEnabled(next).then((status) => ui.setSoundState(toUiSoundState(status))); }`.
- `onBuildChange`: existing scene call, then `try { audio.setLoadPoints(computeDetails(build, fullCatalog)); } catch (error) { console.error('Engine sound load-curve update failed:', error); }`.
- `toUiSoundState` is the small pure mapping above; it is defined once in `main.ts`.
- Expose for acceptance/debug (the repo already exposes `__engineScene`/`__engineUi` unconditionally): `window.__engineAudio = audio`. This is a debugging surface, not a feature.

### 5.3 Page text

- `index.html` subtitle becomes exactly `Milestone 9 — Engine Sound`.
- `src/ui/engineControls.ts`'s runtime subtitle assignment becomes exactly `'Milestone 9 — Engine Sound'`.
- The illustrative caption is unchanged; the sound note (§5.1) carries the sound-specific "illustrative, not an LLY recording" statement.

### 5.4 Benchmark instrumentation

The existing `?benchmark=1` harness gains `&sound=0|1`:

- `sound=0` or omitted: no context is created; `audio.update` is a no-op and is not timed (or timed at ~0); the JSON includes `sound: { supported, enabled, audible, contextState, reason, nodeCount: 0 }`.
- `sound=1`: after mount and before the warm-up, `await audio.setEnabled(true)` once. Because a normal browser blocks programmatic resume without a gesture, the acceptance run uses Chrome with `--autoplay-policy=no-user-gesture-required`; the printed `sound.contextState` must be `running` or the run is invalid for the audio budget. The harness prints `sound: { supported, enabled, audible, contextState, reason, nodeCount, firingHz, boost01, load01, whistleHz, whistleGain, masterGain }`, `audioUpdate: { iterations: 100, totalMs, usPerCall }`, and `droppedFrames` (frame deltas greater than 1.5 × the run's median delta). The batch runs only while `sound.contextState === 'running'` and `audible` is true; otherwise it is skipped and reported as `iterations: 0, totalMs: 0, usPerCall: 0` (and the run is not used for the budget).
- The wait condition for assets is unchanged (`detailedLoaded && hdriLoaded && exteriorLoaded && variantsLoaded`); the 60-frame warmup begins after that. Audio enabling happens before the warmup, so the measured window is steady-state.
- The existing benchmark fields and the `?rf=` handling are unchanged. No new audio is rendered in the benchmark; only the numbers are printed.

## 6. What the sound reads, in one table (the anti-drift contract)

| Audio parameter | Formula | Source of the driving value | Type |
| --- | --- | --- | --- |
| `firingHz` | `rpm / 15` | `CrankState.rpm` | published firing rate (survey §1) |
| `throttle01` | `clamp((rpm − 650)/2550, 0, 1)` | `CrankState.rpm` / the shipped Throttle slider range | shipped UI |
| `idle01` | `1 − smoothstep(750, 1400, rpm)` | `rpm` | audio-authoring choice |
| `load01` | `clamp((8 + throttle01 × (max(fuel,8) − 8))/100, 0, 1)` | `computeDetails(build).fuelMm3` at the live RPM | model output + illustrative idle floor |
| `boost01` | `clamp((boostPsi / 20.874) × throttle01, 0, 1)` | `computeDetails(build).boostPsiGauge` | model output, demand-scaled by the audio layer |
| `firingGain` / `firingLpfHz` | `0.16 + 0.10 × load`, `250 + 700 × load` | `load01` | audio-authoring choice |
| `clatterGain` / `clatterHz` | `0.10 + 0.26 × load + 0.08 × idle`, `1800 + 1400 × load` | `load01`, `idle01` | audio-authoring choice anchored to survey §2 |
| `bodyGain` / `bodyLpfHz` | `0.04 + 0.10 × load`, `300 + 700 × load` | `load01` | audio-authoring choice |
| `whistleHz` / `whistleGain` | `3 × (20000 + 95000 × boost)/60`, `0.12 × boost^1.3` | `boost01` | illustrative proxy; 3rd-order tone published, shaft map not |
| `bpfHz` / `bpfGain` | `11 × (20000 + 95000 × boost)/60`, `0.045 × boost^1.5` | `boost01` | published blade count; levels illustrative |
| `lopeHz` / `lopeDepth` | `firingHz/8`, `0.22 × idle01` (fraction; the `lopeDepth` GainNode value is fraction × `firingGain`) | `rpm` | published 0.5-order signature; depths illustrative |
| `masterGain` | `0.42` when audible, `0` when not | lifecycle | audio-authoring choice |

No other input is read. There is no new field in `CrankState`, `PerformanceResult`, `DynoPointDetail`, `Build`, or `PartVariant`; there is no new exported performance function; `src/perf/**` is not edited. The only new **runtime** import boundary is `main.ts → src/audio`; `src/ui/engineControls.ts` adds only a **type-only** `EnginePlaybackState` import from `src/audio/engineSound.ts` (erased at build, no runtime cycle).

## 7. Budgets (D-033): measured page weight and frame cost

D-033's normative metrics are geometry/GPU/frame-time budgets (triangles, submitted triangles, draw calls, texture+HDRI memory, frame time). M9 adds **no geometry, no draw calls, no textures, and no GPU work**, so those four metrics are unchanged by construction; the build still re-runs the benchmark to prove it. The owner additionally requires **no meaningful page-weight increase**; M9 defines that as the JS payload delta below.

### 7.1 Page weight (measured baseline, planning run 2026-11-14, `main` @ `9aaf400`)

| Item | Measured |
| --- | ---: |
| Production JS bundle (`dist/assets/index-wsgZcPM5.js`) | **768,085 B** (Vite gzip report **200.33 kB**) |
| `dist/index.html` | 1,438 B |
| HDRI (`public/hdri/studio_small_09_2k.hdr`) | 6,312,947 B |
| 16 model GLBs (10 stock part + 5 variant + exterior shell) | 2,968,040 B |
| **Startup payload (index + JS + HDRI + GLBs)** | **10,050,510 B** |
| New audio assets | **0 B** (by design) |

**Budget:** added production JS **≤ 12,288 B minified and ≤ 5,120 B gzip** versus the same-commit baseline, and **no new files under `public/`**. At the gzip budget that is +2.6 % of the gzipped JS and **+0.051 % of the uncompressed startup payload**; at the minified cap it is +1.6 % of the minified JS and +0.122 % of the startup payload, recorded for information. **Acceptance is evaluated on the gzip delta (≤ 0.10 % of the startup payload)**; the minified figure is informational. The build must record both measured deltas from its own `vite build` output in `docs/M9-MEASUREMENTS.md`; if it exceeds either budget, stop and report, do not raise the budget.

### 7.2 Frame cost

- The audio graph renders on the audio thread. The main-thread work is one `computeSoundParameters` call and ~20 `AudioParam.setTargetAtTime` calls per animation frame; the planning prototype's pure computation is **0.054 µs/call** (§13), and no nodes/arrays are created per frame.
- **Budget:** in the `?benchmark=1&sound=1` run, `audioUpdate.usPerCall ≤ 100` µs (0.10 ms) from the 100-call batch; the frame-time p95 must not exceed the sound-off run's p95 by more than **0.30 ms** on the same machine; and `droppedFrames` (`frame delta > 1.5 × the run's median frame delta`) must not exceed the sound-off run's count by more than **1**. If exceeded, stop and report.
- Node budget: exactly **21** permanent nodes; `getStats().nodeCount === 21` in the benchmark JSON; zero nodes created after enable. Noise-buffer memory ≤ 0.4 MiB (384,000 B at 48 kHz).
- The existing D-033 geometry/GPU metrics must remain at their M8 measured values for the same benchmark states (stock and worst-case variants); M9 does not touch the scene, so any change there is a regression, not an audio cost.

## 8. Docs and plan paperwork (build deliverables)

1. **`docs/M9-SOUND.md` (new):** the synthesis design in readable form — graph diagram, the §3 equations, the §3.8 constant table, the signal-source table (§6), the idle/loaded character table (§3.7), autoplay/lifecycle semantics (§4), mobile/iOS notes, the §11 deployed listening checks, and the known limitations: illustrative synthesis, no LLY recording, no dB calibration, no per-cylinder voicing, no phase lock, no published LLY shaft-speed map, the 3rd-order/BPF relationship, the silent-switch caveat, and the fact that slow motion is silent by design.
2. **`docs/M9-MEASUREMENTS.md` (new):** the measured baseline and post-build JS bundle sizes/gzip, the page-weight delta and budget verdict; the `?benchmark=1` desktop/phone matrices for sound off/on (avg/p50/p95 frame times, `audioUpdate.usPerCall`, node count, `sound.contextState`, benchmark parameters at 900 rpm — the harness's fixed RPM); the deployed-UI parameter captures at 2400 and 3200 rpm; the browser/device matrix (desktop Chrome, Edge, Firefox, Safari; iPhone Safari; Android Chrome) and the result of the silent-switch check; the §11 deployed listening checks; the D-033 geometry/GPU re-check; the exact commands used. M2–M8 format.
3. **`docs/PLAN.md`:** add Milestone 9 after Milestone 8 and replace the "After 8:" candidates line with "After 9:" — exact text in §9.
4. **`docs/DECISIONS.md`:** add **D-040 Engine sound (Milestone 9)** under a new dated heading — exact text in §9.
5. **`docs/OPEN_ITEMS.md`:** add the M9 watch/deferred items — exact text in §9.
6. **`index.html`:** subtitle only, exactly `Milestone 9 — Engine Sound`.
7. **No change to `docs/THREE_API_NOTES.md`** (no Three.js API use changes), **no change to `docs/ASSET_CONTRACT.md`** (no assets), **no change to `docs/REFERENCE_FRAMES.md`** (no new visual frames). Prior milestone docs/specs, `docs/PLANNING.md`, and `docs/ORCHESTRATOR.md` stay byte-identical.

## 9. Exact paperwork text (build deliverables)

### 9.1 `docs/PLAN.md`

After the Milestone 8 block, add:

> 9. **Engine sound**
>    - Procedural, zero-download Web Audio synthesis driven by the existing simulation: firing-frequency fundamental (four power strokes per revolution), diesel idle lope, combustion/injector clatter, and a turbo whistle tied to the performance model's boost state, with a user-gesture mute/unmute control and explicit hidden-tab/mobile behavior.
>    - Exit: sound starts only from the Sound control, tracks RPM/load/boost across 650–3200 RPM and stock/modified builds, is silent in hidden tabs, respects the §7.1 page-weight guard and the D-033 frame-cost budget with measured numbers, and leaves the frozen performance-model interfaces untouched.

Replace the post-milestone candidates line with:

> After 9: capped cutaway sections, shareable builds, stock vehicle-side hardware models, and the remaining internal-part visual variants (rods, injectors, CP3, camshaft, heads) are candidates.

### 9.2 `docs/DECISIONS.md`

Add under a new `## 2026-11-14 — Milestone 9 spec` heading:

> - **D-040 Engine sound (Milestone 9).** Engine sound is a **procedural Web Audio synthesis** in a new `src/audio/` layer — zero sampled loops, zero audio files, zero new npm dependencies, no AudioWorklet/ScriptProcessor. It reads only existing state: `CrankState.rpm` for firing rate, the shipped Throttle (RPM) control's normalized travel for throttle/load, and the existing `computeDetails` output for the current build's boost and fuel. `src/core/**` (the D-010 interface) and `src/perf/**` are **unchanged**; sound never feeds the simulation, dyno, renderer, or catalog. The synthesis is: a 64-harmonic firing pulse train at `rpm/15`; half-order idle lope (`firingHz/8`) plus a 0.37 Hz drift; band-passed seeded-noise combustion/injector clatter amplitude-modulated at the firing rate; and a 3rd-order turbo whistle from a 20,000–115,000 rpm shaft-speed proxy (the literal 11-blade BPF is a low-level low-passed secondary layer). **Autoplay/lifecycle:** no `AudioContext` exists until the user presses the Sound control; sound is off on every load; the control is an `aria-pressed` mute/unmute toggle; the context suspends **immediately** when the tab is hidden, and **after the 0.12 s fade + 180 ms timer** when paused or in slow motion; mobile gets a ≥44 px control and an iOS `audioSession.type = 'playback'` opt-in when available (silent-switch behavior is documented and verified on a device). **Budgets:** no new assets; added production JS ≤ 12,288 B minified / ≤ 5,120 B gzip (measured planning prototype 3,954 / 1,735 B at gzip level 9, pure model + graph construction as a lower bound); audio update ≤ 100 µs/call from the 100-call benchmark batch and frame p95 within 0.30 ms of the sound-off run; 21 permanent nodes. The sound is **illustrative**, not an LLY recording and not dB-calibrated.

### 9.3 `docs/OPEN_ITEMS.md`

Add to **Watch items**:

> - [ ] **LLY turbo shaft-speed vs boost map and measured turbo noise levels** — no published map or measured LLY spectrum was found (M9 survey §3); M9 uses an illustrative 20,000–115,000 rpm proxy and a 3rd-order whistle. Revisit if a sourced map or a licensed recording appears.
> - [ ] **iOS silent-switch behavior for Web Audio** — `navigator.audioSession.type = 'playback'` is an experimental API (W3C editor's draft/MDN); M9 records the real-device result and the fallback. Revisit if Safari changes the category behavior.
> - [ ] **Per-cylinder combustion variation / LLY acoustic reference** — M9 uses half-order modulation rather than per-cylinder voices; no per-cylinder LLY acoustic data exists. Revisit only with a sourced recording/licensed reference.

Add to **Deferred candidates**:

> - [ ] **User volume control / loudness calibration** — M9 ships a fixed master and limiter with no dB claim. A volume slider and a calibrated loudness target are deferred.

### 9.4 `index.html`

Only the subtitle changes: `Milestone 8 — 3D Part Variants` → `Milestone 9 — Engine Sound`. The runtime subtitle in `engineControls.ts` changes to the same text.

## 10. Tests

The existing suite (all M0–M8 tests) must pass unmodified. New tests (three files, ~13 cases); each names the regression it catches.

**`src/audio/engineSound.test.ts` (pure; no DOM, no Web Audio):**

1. **Firing rate:** `firingFrequencyHz(650/900/1600/3200)` equals `650/15`, `900/15`, `1600/15`, `3200/15` to 1e-9; `powerStrokesPerRev` equals `engineConfig.firingOrder.length / 2` (4). *Catches: wrong cylinder/four-stroke arithmetic (the whole sound would be off by an octave or a factor of two).*
2. **Signal derivation:** `throttle01(650/3200)` = 0/1; `idle01(650/750/900/1400/3200)` = 1/1/0.864815658/0/0 (within 1e-6); both monotone on 650–3200. *Catches: an off-by-one range or a smoothstep that never reaches the endpoints.*
3. **Exact parameter snapshot:** with a fixed synthetic load curve `[{ rpm: 1000, boostPsiGauge: 5.693, fuelMm3: 72.96 }, { rpm: 1600, boostPsiGauge: 17.079, fuelMm3: 100 }, { rpm: 2400, boostPsiGauge: 20.874, fuelMm3: 95 }, { rpm: 3200, boostPsiGauge: 20.874, fuelMm3: 82 }]`, literal expected values computed from §3 to 1e-6 (the §3.7 table is rounded to three decimals for reading) match for `firingGain`, `firingLpfHz`, `clatterGain`, `clatterHz`, `bodyGain`, `bodyLpfHz`, `whistleHz`, `whistleGain`, `bpfHz`, `bpfGain`, `lopeDepth`, `load01`, `boost01` at 650/900/1600/2400/3200. *Catches: a formula or constant drifting from this spec; the table is the audible contract.*
4. **Clamps and finiteness:** below 1000 rpm the detail is the 1000-rpm point; above 3400 it is the 3400-rpm point; every parameter is finite and inside its stated range for every integer rpm 650–3200 and for both a stock-like and a high-boost curve; the `whistleGain` at 650 is exactly 0. *Catches: NaN/undefined leaking into AudioParams, and a whistle at idle.*
5. **Build sensitivity:** at 2400 rpm a high-boost curve gives a higher `boost01` and `whistleHz` than the stock-like curve, and at 3200 both are at the 5,750 Hz ceiling; at 900 the whistle gain is < 0.002. *Catches: sound ignoring the selected build/boost state, or a whistle that is always on.*
6. **Waveform tables:** `firingWaveReal()` has length 65, `real[0] === 0`, all finite, `|a_1| > |a_2| > |a_4| > |a_8| > 0`, `a_64` is finite and small; `pulseWaveReal()` has length 17 and `real[0] === 0`. *Catches: a broken Fourier table (silence, DC offset, or an aliasing-rich wave).*
7. **Noise generation and loop seam:** `fillNoise` is deterministic for the same seed, differs for a different seed, every sample is in [−1, 1], and the length equals the requested length; no `Math.random()` is used. `loopSeamCrossfade(input, seamSamples)` returns length `input.length − seamSamples`, and each of its first `seamSamples` values lies between the corresponding head sample and tail sample (a convex blend); `noiseSeamMs` is 20. *Catches: a non-deterministic or out-of-range noise buffer, a hard loop splice, and a sampled loop sneaking in.*
8. **Audible state machine:** `isAudible` returns true only in the all-conditions-true case, false for each single false condition, and the `reason` priority is `unsupported > disposed > blocked > off > hidden > paused > slow-motion > running`. *Catches: audio playing in a hidden tab, while paused, or in slow motion; catches a UI that shows "on" while silent.*
9. **Unsupported environment:** with an injected `isSupported: () => false` environment, the initial status is `supported: false`, `contextState: 'unsupported'`, `audible: false`; `setEnabled(true)` does not create a context and returns the unsupported status. *Catches: the controller declaring support from a global constructor while the injected environment says otherwise, and a dead Sound button on browsers without Web Audio.*

**`src/audio/engineAudio.test.ts` (browser module with an injected fake environment/context; Node):**

10. **Graph construction:** `setEnabled(true)` creates exactly one context and **21** nodes, starts six oscillators and the noise source exactly once, master starts at 0, and `audioSession.type = 'playback'` is requested when the API exists; a second `setEnabled(true)` creates no second context. *Catches: duplicate contexts/graphs on double-click, a leaked or unstarted graph, and audio that never starts.*
11. **Lifecycle:** a fake visibility change to hidden calls `suspend()` and sets `audible: false`; visible + playing + 1× resumes; visible + paused or 0.1× does not resume; a hide that arrives while `setEnabled(true)` is still starting suspends once the start resolves; `pagehide` suspends; `setEnabled(false)` ramps and suspends; an off→on or Pause→Play inside the 180 ms window cancels the pending suspend (advance the fake timer, expect running/audible); an injected `audioSession` `interrupted` → `active` pair suspends/resumes; a rejected `resume()` yields `blocked` and `enabled: false` rather than a silent "on"; `setLoadPoints` throws on an empty, unsorted, or non-finite array; `dispose()` closes the context, leaves `nodeCount: 0`, and calls every environment unsubscribe. *Catches: background audio, autoplay bypasses, the silent-on failure mode, a stale suspend timer, bad load data, and an un-disposed listener/context.*
12. **No per-update churn:** 120 `update()` calls create no nodes or buffers, write the same reusable parameter object, and leave `getStats().nodeCount` at 21. *Catches: per-frame node allocation/GC and frame-cost regressions.*

**`src/audio/audioAssets.test.ts` (Node `fs`):**

13. **Zero-download guard:** no **non-test** file under `src/audio/**` (i.e. exclude `*.test.ts`) contains `fetch(`, `XMLHttpRequest`, `decodeAudioData`, `new Audio(`, `AudioWorklet`, `ScriptProcessor`, or an audio file extension (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`); no file under `public/**` has an audio extension; `package.json` `dependencies` is exactly `{ three }` and `devDependencies` is unchanged from the M8 set (no new package). *Catches: a sampled loop, an audio asset, or a dependency sneaking into a "procedural" milestone; excluding the test file prevents the guard from matching its own pattern literals.*

The headless tests cannot hear the graph; the audible result and the Web Audio device behavior are verified by the §11 deployed checks (item 5), the same split used for WebGL in M2–M8.

## 11. Acceptance criteria (Buckley verifies from a fresh clone + deployed site)

1. **Frozen audit:** `git diff main -- src/core src/perf src/config catalog src/renderer public package.json package-lock.json .github vite.config.ts tsconfig.json docs/M2-MEASUREMENTS.md docs/M3-MEASUREMENTS.md docs/M4-MEASUREMENTS.md docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M7-MEASUREMENTS.md docs/M8-VARIANTS.md docs/M8-MEASUREMENTS.md docs/specs/M0-* docs/specs/M1-* docs/specs/M2-* docs/specs/M3-* docs/specs/M4-* docs/specs/M5-* docs/specs/M6-* docs/specs/M7-* docs/specs/M8-* docs/specs/M9-engine-sound.md docs/specs/M9-engine-sound-QA.md docs/research/M9-engine-sound-survey.md docs/PLANNING.md docs/ORCHESTRATOR.md docs/ASSET_CONTRACT.md docs/THREE_API_NOTES.md docs/REFERENCE_FRAMES.md` is empty; `index.html` differs only in the subtitle. `src/audio/**` is new; `src/ui/engineControls.ts`, `src/main.ts`, `index.html`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md`, and the two new M9 docs are the only changed/added files outside `src/audio/**` and its tests.
2. **Fresh-clone gates:** `npm ci`, `npm run typecheck`, `npm test` (existing suite + new tests, no existing test edited), and `npm run build` all pass on Node 24.
3. **Page-weight measurement:** record the built `dist/assets/index-*.js` minified and gzip sizes and `dist/index.html`; the delta versus the same-commit baseline is ≤ 12,288 B minified / ≤ 5,120 B gzip, and no new file exists under `public/`. Record the exact numbers in `docs/M9-MEASUREMENTS.md`; acceptance uses the **gzip** delta and requires the startup payload delta ≤ 0.10 % (the minified-cap worst case is 0.122 % and is informational only).
4. **Autoplay check (normal browser policy, fresh profile):** on load, `window.__engineAudio.getStatus()` returns `contextState: 'uninitialized'`, `enabled: false`, `audible: false`; no sound is heard. Clicking **Sound: Off** starts the engine sound, the label becomes `Sound: On`, and `getStatus().contextState` is `'running'`. Clicking **Sound: On** mutes it, the label returns to `Sound: Off`, and the context is suspended after the 180 ms timer. No console errors. The `?rf=RF-1`…`RF-10` frames still render, and all ten are visually unchanged (M9 adds no visual frames); none auto-starts sound.
5. **Signal tracking (deployed, using `window.__engineAudio.getParameters()` and listening):** at 650/900 rpm the sound is an idle lope with no whistle (`whistleGain: 0` at 650; < 0.002 at 900); at 1600 the whistle is audible around 2.45 kHz; at 3200 it is clearly higher (5.75 kHz) and the firing/clatter are brighter. Sweeping the Throttle slider from 650 to 3200 is continuous — no steps, clicks, or dropouts. Selecting `turbo_large` **and** `tune_performance` (the §13.2 pinned build) and setting 2400 rpm raises the whistle from the stock 4,260 Hz to 5,362 Hz; selecting `turbo_large` alone does not (the stock tune still requests 2.42 PR). The dyno, curves, binding limits, 3D scene, views, variants, labels, and reference frames are unchanged.
6. **Hidden tab:** with sound On and playing at 1×, switch tabs or minimise: sound stops immediately (`getStatus().reason === 'hidden'`, context suspended); no background audio. Return: sound resumes automatically if still On, playing and 1×; if paused or in slow motion, it stays silent and does not resume. Repeat with a phone lock/background.
7. **Pause/slow motion:** Pause silences within ~150 ms; Play resumes. Selecting 0.1× or 0.01× silences; returning to 1× resumes. The button's label remains `Sound: On` throughout (the note explains 1× only).
8. **Mobile:** on an iPhone (iOS 16.4+ Safari) with the Ring/Silent switch off and on, tapping Sound starts the engine sound on the device speakers; the `audioSession.type = 'playback'` path is used when present. Backgrounding the app stops sound; returning resumes only under the §4.6 conditions. On Android Chrome, tapping starts/resumes correctly; the button is ≥ 44 × 44 px and reachable in the wrapped top row at 390 × 844. If the silent-switch-on case is not audible on the tested iOS version, record it in `docs/M9-MEASUREMENTS.md` and `docs/M9-SOUND.md` as a known platform limitation (the default Web Audio category is then in effect; the button still shows the user's on intent, the OS is muting the output); do not fake it and do not claim the silent switch is bypassed when it is not.
9. **Frame-cost benchmark (production preview, desktop Full 1440×900 and Phone 390×844, `?benchmark=1&sound=0` and `&sound=1`, Chrome with `--autoplay-policy=no-user-gesture-required` for the sound run):** the sound run prints `sound.contextState: 'running'`, `sound.nodeCount: 21`, `audioUpdate.usPerCall ≤ 100`; frame-time p95 is within 0.30 ms of the sound-off run; `droppedFrames` is not more than the sound-off run + 1. The existing D-033 geometry/GPU metrics are unchanged from M8 for stock and worst-case variant states. Record both runs in `docs/M9-MEASUREMENTS.md`.
10. **Docs:** `docs/M9-SOUND.md` and `docs/M9-MEASUREMENTS.md` are complete per §8; PLAN/DECISIONS/OPEN_ITEMS/index subtitle match §9 exactly; `docs/research/M9-engine-sound-survey.md` is on the branch; prior docs/specs are byte-identical.
11. **Outside review (D-021)** is recorded for the milestone-exit PR; the default run has no console errors and no D-033 regression.

## 12. Frozen and changed files

**Frozen — no changes:** `src/core/**` (including `interfaces.ts` and `kinematics.ts`), `src/perf/**` (model, config, resolver, stock build, tests), `src/config/**`, `catalog/**` (stock, modified, schema), `src/renderer/**`, `public/**` (no audio assets, no GLB/HDRI changes), `package.json`/`package-lock.json` (no new dependencies), `.github/**`, `vite.config.ts`, `tsconfig.json`, prior docs/specs (`docs/M2-MEASUREMENTS.md` … `docs/M8-MEASUREMENTS.md`, `docs/specs/M0-*` … `M8-*`), `docs/PLANNING.md`, `docs/ORCHESTRATOR.md`, `docs/ASSET_CONTRACT.md`, `docs/THREE_API_NOTES.md`, `docs/REFERENCE_FRAMES.md`, and all existing tests (no existing test is edited). The research file `docs/research/M9-engine-sound-survey.md` is a planning artifact, committed with the plan, not by the build; the build must not edit `docs/specs/M9-engine-sound.md`, `docs/specs/M9-engine-sound-QA.md`, or the survey.

**Changed (expected):**

- `src/audio/engineSound.ts` (new pure model), `src/audio/engineAudio.ts` (new Web Audio graph/lifecycle), `src/audio/index.ts` (new exports), and the new tests `src/audio/engineSound.test.ts`, `src/audio/engineAudio.test.ts`, `src/audio/audioAssets.test.ts`.
- `src/ui/engineControls.ts`: Sound button/note/CSS, `onSoundToggle`, `setSoundState`, the `onState` playback argument, subtitle.
- `src/main.ts`: audio controller creation, `setLoadPoints`, `onState` audio update, `onSoundToggle`, `onBuildChange` load-curve update, benchmark `sound` parameter/stats, `__engineAudio` debug surface.
- `index.html`: subtitle text only.
- `docs/M9-SOUND.md`, `docs/M9-MEASUREMENTS.md` (new build docs).
- `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/OPEN_ITEMS.md` per §9.

If you believe any other file must change, stop and report it instead of changing it.

## 13. Pre-build self-check (recorded)

Every number below was computed before this spec was finalised. The prototype is a planning artifact **outside version control** (`.scratch/`, deleted before commit); it is not a build deliverable. Commands used: `npx vite-node` against the real `src/perf` model for the load curves; `npx esbuild 0.28.2 --bundle --minify` for the size measurement; gzip sizes are **gzip level 9** (zlib 1.3.1) unless the Vite report is named; a 1,000,000-call loop for the update cost. Baseline: `main` @ `9aaf400`, `npm run build` Vite 7.3.8, Node 24.16.0.

### 13.1 Bundle-size measurement

| Measurement | Result |
| --- | ---: |
| Baseline production JS | 768,085 B minified (Vite gzip report 200.33 kB; gzip level-9 re-check 199,299 B) |
| Prototype pure model + 21-node graph construction, esbuild 0.28.2 minified (lower bound: `applyParams`/lifecycle glue not included) | **3,954 B** |
| Same prototype, gzip level 9 | **1,735 B** |
| Projected real module after adding lifecycle/visibility/UI error handling/benchmark glue (measured prototype + ~4–5 KB min / ~1.5–2 KB gzip allowance) | ~8–9 KB min / ~3.2–3.7 KB gzip |
| Budget | ≤ 12,288 B min / ≤ 5,120 B gzip |
| Budget headroom at the projection | ~3.3–4.3 KB min / ~1.4–1.9 KB gzip |

The projection is deliberately conservative; the build records the actual `vite build` delta. At the **gzip** budget the startup payload delta is 5,120 / 10,050,510 = **0.051 %**; at the **minified** cap it is 12,288 / 10,050,510 = **0.122 %**, recorded for information. Acceptance is evaluated on the gzip delta (≤ 0.10 %).

### 13.2 Load and parameter values (stock build, real `computeDetails`)

The following are from the real M5 model at `main` @ `9aaf400`, not invented. `detail` is clamped to 1000 rpm below 1000 and to 3400 above 3400.

| rpm | model `boostPsiGauge` | model `fuelMm3` | `throttle01` | `load01` | `boost01` | `firingHz` | `whistleHz` | `whistleGain` | `bpfHz` |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 650 | 5.693 (clamped) | 72.96 (clamped) | 0.000 | 0.080 | 0.000 | 43.333 | 1000 | 0.0000 | 3667 |
| 900 | 5.693 | 72.96 | 0.098 | 0.144 | 0.027 | 60.000 | 1127 | 0.0011 | 4132 |
| 1600 | 17.079 | 100.00 | 0.373 | 0.423 | 0.305 | 106.667 | 2448 | 0.0256 | 8975 |
| 2400 | 20.874 | 95.00 | 0.686 | 0.677 | 0.686 | 160.000 | 4260 | 0.0736 | 15619 |
| 3200 | 20.874 | 82.00 | 1.000 | 0.820 | 1.000 | 213.333 | 5750 | 0.1200 | 21083 |

Modified build at 2400 rpm — the pinned build is `stockBuild.selections` with exactly two overrides, `turbo: 'turbo_large'` and `tune: 'tune_performance'` (the full §6 modified build gives the same point): model `boostPsiGauge` **27.930000**, `fuelMm3` 110.000000, `load01` 0.780000, `boost01` 0.918255, `whistleHz` **5361.709**, `whistleGain` 0.107407, `bpfHz` **19659.601**. The other ten slots stay stock; `injectors_plus30`, `cp3_stroker`, `intake_highflow`, `exhaust_4in`, `intercooler_upgraded` and `pistons_lowcomp` do not change the 2400-rpm point (the limit is `tune`). This is the build-sensitivity check the spec tests at 2400 rpm.

### 13.3 Firing/turbo arithmetic

- `f_fire = rpm × 4 / 60`: 650 → 43.333 Hz; 900 → 60.000; 1600 → 106.667; 2400 → 160.000; 3200 → 213.333.
- `shaftRpm = 20,000 + 95,000 × boost01`: 0 boost → 20,000; stock 1600 (0.3048) → 48,957; stock 2400 (0.6863) → 85,196; full boost → 115,000.
- `BPF = 11 × shaftRpm / 60`: 3,667 / 8,975 / 15,619 / 21,083 Hz. At 44.1 kHz Nyquist 22,050 Hz, the top value is below Nyquist but above the useful phone-speaker band; the 10 kHz low-pass keeps the layer quiet.
- `3rd order = 3 × shaftRpm / 60`: 1,000 / 2,448 / 4,260 / 5,750 Hz — the audible whistle band.
- The published 80,000–130,000 rpm range gives BPF 14,667–23,833 Hz and 3rd order 4,000–6,500 Hz, consistent with the proxy's upper end and with the survey's conclusion that the literal BPF is not the phone-audible whistle.

### 13.4 Waveform and noise checks

- `firingWaveReal(64)`: length 65, DC 0; `a_1 = 0.1588`, `a_2 = 0.1248`, `a_3 = 0.0850`, `a_4 = 0.0461`, `a_5 = 0.0138`, `a_6 = −0.0086`, `a_32 = −0.00069`, `a_64 = −0.000051`. The 64th harmonic at 3200 rpm is 13.65 kHz, below Nyquist.
- `pulseWaveReal(16)`: length 17, DC 0, `d = 0.06`, `exp(−n/10)`.
- `fillNoise(48,000 samples, seed 0x9E3779B9)`: deterministic (two runs bit-identical), min ≈ −1.000, max ≈ 0.999, all finite; no `Math.random()`.

### 13.5 Update-cost check

`computeSoundParameters` over 1,000,000 calls (rpm cycling through the 650–3200 range with the real stock details): three runs of **54.4 / 54.0 / 51.6 ms**, i.e. **0.0516–0.0544 µs/call** (Node 24.16.0, the same machine as the M2–M8 measurements; the 54.0 ms / 0.054 µs run is quoted). One call per frame is ~0.000054 ms — roughly 1,850× below the 100 µs batch budget; the remaining main-thread cost is ~20 `AudioParam` writes. The audio rendering itself is on the audio thread. Browser `performance.now()` is quantized (typically 100 µs), which is why the benchmark uses a 100-call batch rather than per-frame timing: the batch average is precise even when a single frame's update is below the clock resolution.

### 13.6 Budget arithmetic

- **Page weight:** 0 new asset bytes; added JS ≤ 12,288 B min / ≤ 5,120 B gzip. Baseline startup payload 10,050,510 B → **+0.051 % at the gzip budget** (acceptance metric) and +0.122 % at the minified cap (informational). Baseline JS 768,085 B min → ≤ +1.6 %; gzip 200.33 kB → ≤ +2.6 %. Verdict: **no meaningful page-weight increase**.
- **Frame cost:** 21 permanent nodes; 0 nodes created per update; the 100-call batch budget is ≤ 100 µs/call against a 16.667 ms frame (0.6 % of a frame worst-case), with the measured Node computation at 0.054 µs/call and the browser batch to be recorded by the build. Verdict: **no meaningful frame-cost increase**; the build must confirm with the benchmark.
- **D-033 geometry/GPU:** zero new triangles, draw calls, textures, or GPU memory; the M8 numbers remain the reference and must be re-verified unchanged.

### 13.7 Contradictions found while drafting (all resolved in the spec, none silently)

1. **The app has no load channel.** The brief says "throttle/load", but the shipped UI has one `Throttle (RPM)` slider and `CrankState` carries only rpm. The spec defines `throttle01` from the slider and `load01` from the existing model's full-load fuel scaled by that throttle plus an illustrative 8 mm³ idle floor — and says so in §2.2/§6. It does **not** add a hidden simulation state or a new interface field.
2. **The performance model is full-load steady-state, not a live part-throttle model.** Using its boost directly at 900 rpm would give ~5.7 psi and an audible whistle at idle. The spec scales the model boost by `throttle01` (zero at the 650-rpm slider floor) and zeroes the whistle at idle; the model itself is untouched.
3. **Slow motion vs audio.** A 0.1× crank would imply a 6 Hz firing fundamental and a misleading slowed turbo; rather than pitch-shifting or playing false audio, the spec mutes slow motion and states "1× only" in the note.
4. **The literal 11-blade BPF is not the audible whistle on phones.** At 80,000–130,000 rpm it is 14.7–23.8 kHz. The spec uses the published 3rd-order tone as the audible whistle and keeps the literal BPF as a quiet, 10 kHz-low-passed secondary layer; the survey records the arithmetic.
5. **No published LLY shaft-speed map or acoustic spectrum.** The 20,000–115,000 rpm proxy and the 8 mm³ idle fuel floor are labelled illustrative in §3.8, the survey, and `docs/M9-SOUND.md`; no dB calibration is claimed.
6. **Hidden tabs playing audio are exempt from browser throttling.** Leaving the context running in a hidden tab would keep the tab foreground for throttling purposes and could play background audio. The spec suspends immediately on hide and resumes only under the §4.6 conditions.
7. **iOS silent switch is platform-defined.** The experimental `audioSession.type = 'playback'` is set when available, but the spec does not claim it works everywhere; acceptance tests it on a device and records the fallback, with the caveat in the docs.
8. **D-033 has no page-weight metric.** The spec adds a page-weight guard at the owner's direction (§7.1) and maps the frame-cost requirement onto the existing D-033 frame-time budget; it re-verifies the geometry/GPU metrics unchanged rather than inventing new ones.
9. **`onState` needs playback state.** The audio layer must know paused and slow-motion; the spec extends the UI's `onState` callback with a second structural argument. This is a UI callback, not the frozen `src/core/interfaces.ts` contract; existing single-argument callbacks remain type-compatible.

## 14. Handoff

Work on branch `m9-engine-sound` in the local clone, created from `main` at `9aaf400`. Implement in this order: (1) `src/audio/engineSound.ts` + its pure tests against the §3.7 table; (2) `src/audio/engineAudio.ts` + the fake-context lifecycle tests; (3) the UI Sound control and `main.ts` wiring; (4) the benchmark `sound=1` instrumentation; (5) `docs/M9-SOUND.md` and `docs/M9-MEASUREMENTS.md` with the actual measured bundle/frame numbers; (6) the §9 paperwork. No new npm dependencies; no Blender work; no new assets. When done, push the branch and send a closing summary covering: files changed; test/typecheck/build results; the actual JS min/gzip delta and startup-payload delta; the desktop/phone sound-off/on benchmark rows (frame percentiles, `audioUpdate` stats, node count, sound status); the browser/device matrix and the iOS silent-switch result; the exact parameter values at 900/2400/3200 rpm and the stock-vs-`turbo_large` whistle difference; and anything that deviated from this spec. Buckley verifies from a fresh clone, opens the PR, and merges.

