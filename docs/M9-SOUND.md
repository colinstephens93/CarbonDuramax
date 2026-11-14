# Milestone 9 — Procedural Engine Sound Design & Provenance (`docs/M9-SOUND.md`)

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) (Milestone 9) · Decisions: D-010, D-013, D-033, **D-040** · Spec: [`docs/specs/M9-engine-sound.md`](./specs/M9-engine-sound.md) · Research survey: [`docs/research/M9-engine-sound-survey.md`](./research/M9-engine-sound-survey.md) · Measurements: [`docs/M9-MEASUREMENTS.md`](./M9-MEASUREMENTS.md)

---

## 1. Scope & Provenance Position

Milestone 9 adds procedural Web Audio diesel engine synthesis in [`src/audio/`](../src/audio/) with **zero audio files, zero sampled loops, zero runtime network fetches, zero AudioWorklet/ScriptProcessor scripts, and zero new npm dependencies**.

- **Read-only architecture contract:** `src/core/**` (frozen D-010 interfaces and kinematics), `src/perf/**` (fuel-first performance model), `catalog/**`, and `src/renderer/**` are untouched. `src/main.ts` is the sole runtime caller bridging `CrankState.rpm`, UI playback state, and `computeDetails(build, fullCatalog)` into `src/audio/`. `src/ui/engineControls.ts` imports `EnginePlaybackState` type-only.
- **Provenance position:** The engine sound is an **illustrative procedural synthesis**, not an acoustic recording or reproduction of a 2005 GM Duramax LLY and **not dB-calibrated**.
  - **Published physical anchors** (documented in [`docs/research/M9-engine-sound-survey.md`](./research/M9-engine-sound-survey.md)): four-stroke V8 firing rate (`4` power strokes/rev = `rpm / 15` Hz), `0.5`-order (`firingHz / 8`) idle cylinder-to-cylinder imbalance signature, `800–2500 Hz` structural / `~3.15 kHz` diesel combustion-knock band, Garrett GT3788VA `11`-blade compressor count, blade-pass frequency formula, and typical `80,000–130,000 rpm` turbocharger shaft-speed range.
  - **Illustrative authored choices:** combustion pulse harmonic roll-off, `8 mm³` idle fuel floor, `20,000–115,000 rpm` turbo shaft-speed proxy, using the `3rd`-order tone as the primary phone-audible whistle while low-passing the `11`-blade BPF at `10 kHz`, relative layer gains, and the fixed `0.42` master gain + output limiter.

---

## 2. 21-Node Web Audio Synthesis Graph (Spec §3.2)

All 21 nodes are constructed once when the user first enables sound (`setEnabled(true)`), started once at `ctx.currentTime`, and retained across mute/pause/visibility transitions. Zero nodes or buffers are allocated per animation frame.

```text
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

| # | Node | Web Audio Type & Initial Settings | Role |
| ---: | --- | --- | --- |
| 1 | `master` | `GainNode`, starts at `0`, target `0.42` when audible | Single mute/unmute and ramp surface (`0.25 s` on, `0.12 s` off) |
| 2 | `limiter` | `DynamicsCompressorNode` (`threshold -10 dB`, `knee 6`, `ratio 12`, `attack 0.003 s`, `release 0.20 s`) | Destination peak protection (no dB calibration claimed) |
| 3 | `firingOsc` | `OscillatorNode`, custom `PeriodicWave` (`firingWaveReal(64)`) | Four-stroke V8 firing-rate pulse train (`rpm / 15` Hz) |
| 4 | `firingLpf` | `BiquadFilterNode`, `lowpass`, `Q = 0.7` | Load-dependent firing warmth/body (`250–950 Hz`) |
| 5 | `firingGain` | `GainNode`, starts at `0` | Firing level; `gain` AudioParam modulated by `lopeDepth` + `driftDepth` |
| 6 | `noiseSrc` | `AudioBufferSourceNode`, mono `2.0 s` loop at `min(sampleRate, 48000)` Hz | Deterministic seeded white noise (`0x9E3779B9`) with `20 ms` seam crossfade |
| 7 | `clatterBp` | `BiquadFilterNode`, `bandpass`, `Q = 0.9` | Diesel combustion/injector clatter band (`1800–3200 Hz`) |
| 8 | `clatterGain` | `GainNode`, starts at `0` | Clatter base gain; `gain` AudioParam burst-modulated by `pulseDepth` |
| 9 | `bodyLpf` | `BiquadFilterNode`, `lowpass`, `Q = 0.5` | Low exhaust and block rumble (`300–1000 Hz`) |
| 10 | `bodyGain` | `GainNode`, starts at `0` | Rumble body level |
| 11 | `whistleOsc` | `OscillatorNode`, `sine` | Primary audible `3rd`-order turbocharger whistle (`1.0–5.75 kHz`) |
| 12 | `whistleGain` | `GainNode`, starts at `0` | Boost-driven whistle level |
| 13 | `bpfOsc` | `OscillatorNode`, `sine` | Literal `11`-blade compressor blade-pass tone (`3.67–21.08 kHz`) |
| 14 | `bpfLpf` | `BiquadFilterNode`, `lowpass`, `10,000 Hz`, `Q = 0.7` | Attenuates ultrasonic/top-octave BPF content |
| 15 | `bpfGain` | `GainNode`, starts at `0` | Secondary air/BPF level |
| 16 | `pulseOsc` | `OscillatorNode`, custom `PeriodicWave` (`pulseWaveReal(16)`) | Narrow firing-rate modulator for clatter bursts |
| 17 | `pulseDepth` | `GainNode`, starts at `0` → `clatterGain.gain` | Firing-rate clatter AM depth (`0.6 × clatterGain`) |
| 18 | `lopeOsc` | `OscillatorNode`, `sine` | Half-order (`0.5` engine order = `firingHz / 8`) idle lope LFO |
| 19 | `lopeDepth` | `GainNode`, starts at `0` → `firingGain.gain` | Half-order lope AM depth (`0.22 × idle01 × firingGain`) |
| 20 | `driftOsc` | `OscillatorNode`, `sine`, fixed `0.37 Hz` | Slow incommensurate idle drift LFO |
| 21 | `driftDepth` | `GainNode`, starts at `0` → `firingGain.gain` | Idle drift AM depth (`0.10 × idle01 × firingGain`) |

---

## 3. Synthesis Equations & Waveforms (Spec §§2.2, 3.3–3.6)

### 3.1 Normalized Driving Signals

Given live `rpm = CrankState.rpm` (fallback `650` if non-finite) and the current build's 25-point full-load `DynoPointDetail` curve (`1000–3400 rpm` step `100`):

```text
throttle01 = clamp((rpm − 650) / (3200 − 650), 0, 1)
t_idle     = clamp((rpm − 750) / (1400 − 750), 0, 1)
idle01     = 1 − t_idle² × (3 − 2 × t_idle)
detail     = linearInterpolate(points, clamp(rpm, 1000, 3400))
fuelMm3    = 8 + throttle01 × (max(detail.fuelMm3, 8) − 8)
load01     = clamp(fuelMm3 / 100, 0, 1)
boost01    = clamp((detail.boostPsiGauge / 20.874) × throttle01, 0, 1)
```

### 3.2 Layer Parameter Equations

```text
firingHz        = (rpm × 4) / 60 = rpm / 15
firingGain      = 0.16 + 0.10 × load01
firingLpfHz     = 250 + 700 × load01

clatterGain     = 0.10 + 0.26 × load01 + 0.08 × idle01
clatterHz       = 1800 + 1400 × load01
clatterQ        = 0.9
clatterAmDepth  = 0.6                          // GainNode value = 0.6 × clatterGain

bodyGain        = 0.04 + 0.10 × load01
bodyLpfHz       = 300 + 700 × load01

shaftRpm        = 20000 + 95000 × boost01
whistleHz       = (3 × shaftRpm) / 60
whistleGain     = boost01 <= 0 ? 0 : 0.12 × boost01^1.3

bpfHz           = (11 × shaftRpm) / 60
bpfGain         = boost01 <= 0 ? 0 : 0.045 × boost01^1.5

lopeHz          = firingHz / 8
lopeDepth       = 0.22 × idle01                // GainNode value = lopeDepth × firingGain
driftHz         = 0.37
driftDepth      = 0.10 × idle01                // GainNode value = driftDepth × firingGain

masterGain      = 0.42 (when audible; 0 otherwise)
```

All continuous node parameters update via `AudioParam.setTargetAtTime(target, ctx.currentTime, 0.06)` (`60 ms` time constant) so throttle sweeps and build changes glide smoothly without zipper clicks.

### 3.3 Custom Fourier Pulse Tables & Deterministic Noise Loop

- **Firing waveform (`firingWaveReal(64)`):** `64` cosine harmonics (`imag[n] = 0`, `real[0] = 0`, `disableNormalization: false`) for an `18 %`-duty pulse train with exponential high-harmonic roll-off:
  `real[n] = (sin(π × n × 0.18) / (π × n)) × exp(−n / 14)` (`a_1 = 0.1588`, `a_2 = 0.1248`, `a_4 = 0.0461`, `a_64 = −0.000051`; at `3200 rpm`, `64 × 213.33 Hz = 13.65 kHz < 22.05 kHz` Nyquist).
- **Clatter AM burst waveform (`pulseWaveReal(16)`):** `16` cosine harmonics with `duty = 0.06` and decay `10`:
  `real[n] = (sin(π × n × 0.06) / (π × n)) × exp(−n / 10)`.
- **Deterministic noise & loop-seam crossfade (`fillNoise`, `loopSeamCrossfade`):** `mulberry32` PRNG seeded with `0x9E3779B9` generates `round(rate × 2.0) + round(rate × 0.020)` samples (`rate = min(ctx.sampleRate, 48000)`). `loopSeamCrossfade` blends the trailing `20 ms` into the leading `20 ms` with a `sin²`/`cos²` weight clamped within `[min(head, tail), max(head, tail)]` and trims the tail, yielding a click-free `2.0 s` (`≤ 384,000 B`) loop with zero `Math.random()` calls.

---

## 4. Principal Constants Table (Spec §3.8)

Exported as frozen `ENGINE_SOUND_CONSTANTS` in [`src/audio/engineSound.ts`](../src/audio/engineSound.ts):

| Constant | Value | Status / Source |
| --- | ---: | --- |
| `uiMinRpm` / `uiMaxRpm` | `650` / `3200` | Shipped UI Throttle slider bounds (`src/ui/engineControls.ts`) |
| `powerStrokesPerRev` | `4` | Published four-stroke V8 firing rate (`firingOrder.length / 2`; survey §1) |
| `boostReferencePsi` | `20.874` | Derived from stock `boostReqPr = 2.42` and `14.7 psi/atm` (`src/perf/perfConfig.ts`) |
| `idleFuelFloorMm3` | `8` | **Illustrative** audio floor; steady-state WOT dyno model has no idle-fuel term |
| `loadDivisorMm3` | `100` | Audio load normalization reference (`100 mm³/stroke` stock peak torque fuel) |
| `shaftBaseRpm` / `shaftSpanRpm` | `20,000` / `95,000` | **Illustrative** `20k–115k rpm` proxy anchored to typical `80k–130k rpm` turbo operating range (survey §3.2) |
| `whistleOrder` | `3` | Reported lower-order lab turbo tone (survey §3.3); used illustratively as phone-audible whistle |
| `compressorBlades` | `11` | Published Garrett GT3788VA compressor blade count (survey §3.1) |
| `firingHarmonics` / `pulseHarmonics` | `64` / `16` | Audio-authoring choice; band-limited below `44.1 kHz` Nyquist across `650–3200 rpm` |
| `noiseSeconds` / `noiseSeed` | `2.0` / `0x9E3779B9` | Deterministic seeded noise buffer duration and seed |
| `noiseSeamMs` | `20` | Loop-boundary crossfade window (`20 ms`) |
| `noiseMaxSampleRate` | `48,000` | Caps mono float32 noise buffer at `384,000 B` (`0.366 MiB`) on `96 kHz` contexts |
| `firingDuty` / `firingDecay` | `0.18` / `14` | Firing pulse Fourier shape (§3.3) |
| `pulseDuty` / `pulseDecay` | `0.06` / `10` | Clatter burst AM Fourier shape (§3.5) |
| `lopeDivisor` / `lopeDepth` | `8` / `0.22` | `0.5`-order idle lope frequency divisor and peak fractional depth (§3.4) |
| `driftHz` / `driftDepth` | `0.37` / `0.10` | Slow quasi-periodic idle drift rate and fractional depth (§3.4) |
| `clatterAmDepth` / `idleClatterTerm` | `0.6` / `0.08` | Firing-burst AM fraction and idle clatter floor (§3.5) |
| `masterGain` | `0.42` | Fixed audible master gain ahead of `-10 dB` limiter |
| `bpfLowpassHz` | `10,000` | Low-pass cutoff keeping secondary `11`-blade BPF out of top octave |

---

## 5. Signal-Source Anti-Drift Contract (Spec §6)

| Audio Parameter | Formula | Driving Value Source | Provenance Type |
| --- | --- | --- | --- |
| `firingHz` | `rpm / 15` | `CrankState.rpm` | Published V8 four-stroke firing rate |
| `throttle01` | `clamp((rpm − 650) / 2550, 0, 1)` | `CrankState.rpm` / shipped Throttle slider | Shipped UI control range |
| `idle01` | `1 − smoothstep(750, 1400, rpm)` | `CrankState.rpm` | Audio-authoring choice |
| `load01` | `clamp((8 + throttle01 × (max(fuel, 8) − 8)) / 100, 0, 1)` | `computeDetails(build).fuelMm3` | M5 model output + illustrative idle floor |
| `boost01` | `clamp((boostPsi / 20.874) × throttle01, 0, 1)` | `computeDetails(build).boostPsiGauge` | M5 model output, demand-scaled by audio layer |
| `firingGain` / `firingLpfHz` | `0.16 + 0.10 × load`, `250 + 700 × load` | `load01` | Audio-authoring choice |
| `clatterGain` / `clatterHz` | `0.10 + 0.26 × load + 0.08 × idle`, `1800 + 1400 × load` | `load01`, `idle01` | Audio-authoring choice anchored to survey §2 |
| `bodyGain` / `bodyLpfHz` | `0.04 + 0.10 × load`, `300 + 700 × load` | `load01` | Audio-authoring choice |
| `whistleHz` / `whistleGain` | `3 × (20000 + 95000 × boost) / 60`, `0.12 × boost^1.3` | `boost01` | Illustrative proxy; `3rd`-order tone published, shaft map not |
| `bpfHz` / `bpfGain` | `11 × (20000 + 95000 × boost) / 60`, `0.045 × boost^1.5` | `boost01` | Published blade count; levels illustrative |
| `lopeHz` / `lopeDepth` | `firingHz / 8`, `0.22 × idle01` (GainNode = `lopeDepth × firingGain`) | `CrankState.rpm` | Published `0.5`-order signature; depth illustrative |
| `masterGain` | `0.42` when audible, `0` when silent | Lifecycle controller | Audio-authoring choice |

---

## 6. Idle-vs-Loaded Character & Build Sensitivity (Spec §§3.7, 13.2)

Stock-build parameter values across the shipped `650–3200 RPM` range (plus `turbo_large + tune_performance` at `2400 RPM`):

| Signal | `650 rpm` (Idle) | `900 rpm` (Default) | `1600 rpm` | `2400 rpm` (Stock) | `2400 rpm` (`turbo_large + tune_performance`) | `3200 rpm` (Max Slider) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `firingHz` (Hz) | `43.333` | `60.000` | `106.667` | `160.000` | `160.000` | `213.333` |
| `throttle01` | `0.000` | `0.098` | `0.373` | `0.686` | `0.686` | `1.000` |
| `idle01` | `1.000` | `0.865` | `0.000` | `0.000` | `0.000` | `0.000` |
| `load01` | `0.080` | `0.144` | `0.423` | `0.677` | `0.780` | `0.820` |
| `boost01` | `0.000` | `0.027` | `0.305` | `0.686` | `0.918` | `1.000` |
| `firingGain` | `0.168` | `0.174` | `0.202` | `0.228` | `0.238` | `0.242` |
| `firingLpfHz` (Hz) | `306` | `351` | `546` | `724` | `796` | `824` |
| `clatterGain` | `0.201` | `0.207` | `0.210` | `0.276` | `0.303` | `0.313` |
| `clatterHz` (Hz) | `1912` | `2001` | `2392` | `2748` | `2892` | `2948` |
| `bodyGain` | `0.048` | `0.054` | `0.082` | `0.108` | `0.118` | `0.122` |
| `bodyLpfHz` (Hz) | `356` | `401` | `596` | `774` | `846` | `874` |
| `whistleHz` (Hz) | `1000` | `1127` | `2448` | **`4260`** | **`5362`** (`5361.709`) | `5750` |
| `whistleGain` | `0.0000` | `0.0011` | `0.0256` | `0.0736` | `0.1074` | `0.1200` |
| `bpfHz` (Hz) | `3667` | `4132` | `8975` | `15619` | `19660` | `21083` |
| `bpfGain` | `0.0000` | `0.0002` | `0.0076` | `0.0256` | `0.0396` | `0.0450` |
| `lopeHz` (Hz) | `5.417` | `7.500` | `13.333` | `20.000` | `20.000` | `26.667` |
| `lopeDepth` (fraction) | `0.220` | `0.190` | `0.000` | `0.000` | `0.000` | `0.000` |

- **Why `turbo_large` alone at `2400 rpm` keeps `4260 Hz`:** With the stock ECM calibration (`tune_stock`), requested pressure ratio remains capped at `2.42 PR` (`20.874 psi`), so delivered boost at `2400 rpm` is unchanged until `tune_performance` (`2.90 PR` request → `27.93 psi`) is also selected.

---

## 7. Autoplay, Visibility, Playback & Mobile Lifecycle (Spec §4)

### 7.1 Lazy Gesture Creation & Race Safety
- `createEngineAudio()` touches no Web Audio constructor or DOM listener on page load (`contextState: 'uninitialized'`, `enabled: false`, `audible: false`, `nodeCount: 0`). Sound preference is never persisted across loads.
- Clicking `#m9-sound-btn` synchronously invokes `new AudioContext({ latencyHint: 'interactive' })`, builds the 21-node graph once, starts all sources, and calls `ctx.resume()` inside the user-gesture task.
- Concurrent `setEnabled(true)` calls share one in-flight promise; an internal generation token ensures that if `setEnabled(false)` or `dispose()` arrives before `resume()` resolves, the stale start immediately silences and suspends rather than ramping up.
- If `resume()` rejects or settles outside `'running'`, `setEnabled(true)` resolves (never rejects) with `enabled: false, reason: 'blocked'`, keeping the UI truthful (`Sound: Off` + polite retry note).

### 7.2 Mute, Pause, Slow Motion & Hidden Tab
- **Mute (`setEnabled(false)`), Pause (`playing === false`), and Slow Motion (`0.1×` / `0.01×`):** `master.gain` ramps to `0` over `0.12 s` and a cancellable `180 ms` timer suspends the `AudioContext` to release audio hardware. Re-enabling, pressing Play, or returning to `1×` inside the `180 ms` window cancels the timer and ramps smoothly back to `0.42`.
- **Hidden Tab & Pagehide (`visibilitychange` / `pagehide`):** Immediate `master.gain = 0` and immediate `ctx.suspend()` with zero fade — ensuring zero background audio and never exempting hidden tabs from browser background throttling. Returning to `visible` resumes automatically **only** if `enabled && playing && speedMultiplier === 1`. `update()` also retries `resume()` at most once per `1,000 ms` if an external bfcache restore leaves a visible audible context suspended without firing `visibilitychange`.

### 7.3 Mobile Touch Target & iOS Audio Session Caveat
- Under `@media (max-width: 640px), (pointer: coarse)`, `.m1-row` wraps (`flex-wrap: wrap; row-gap: 8px`) and `#m9-sound-btn` enforces `min-height: 44px; padding: 10px 14px` (measured `87.7 × 44.0 px` at `390×844`).
- When `'audioSession' in navigator`, enabling sound sets `navigator.audioSession.type = 'playback'` (restoring `'auto'` on disable/dispose) and listens for `interrupted` → `active` state transitions. Because `navigator.audioSession` is an experimental W3C/Safari API, **Ring/Silent switch behavior on iOS remains platform-defined**: where unsupported or ignored by the OS, Web Audio falls back to the ambient category and the hardware silent switch mutes speaker output even while the button reflects `Sound: On`.

### 7.4 Audible-State Truth Table & Reason Priority (Spec §4.6)

`audible = supported && !disposed && !blocked && enabled && contextState === 'running' && !hidden && playing && speedMultiplier === 1`

Reason precedence: `unsupported > disposed > blocked > off > hidden > paused > slow-motion > running`.

| `enabled` | `hidden` | `playing` | `speed` | `contextState` | `audible` | `reason` |
| :---: | :---: | :---: | :---: | :---: | :---: | --- |
| `false` | any | any | any | `uninitialized` / `suspended` | `false` | `off` |
| `true` | `true` | any | any | `suspended` (immediate on hide) | `false` | `hidden` |
| `true` | `false` | `false` | `1×` | `suspended` (after `180 ms`) | `false` | `paused` |
| `true` | `false` | `true` | `0.1×` / `0.01×` | `suspended` (after `180 ms`) | `false` | `slow-motion` |
| `true` | `false` | `true` | `1×` | `running` | `true` | `running` |
| `false` *(after failed resume)* | `false` | `true` | `1×` | `suspended` | `false` | `blocked` |
| `false` *(no Web Audio)* | any | any | any | `unsupported` | `false` | `unsupported` |

---

## 8. Deployed Listening & Verification Checklist (Spec §11)

1. **Autoplay silence on load:** Fresh page load shows `Sound: Off` (`aria-pressed="false"`), `contextState: 'uninitialized'`, and produces zero audio; `?rf=RF-1`…`RF-10` never auto-start audio.
2. **Idle lope (`650` / `900 rpm`):** Clicking `Sound: Off` -> `Sound: On` starts a `43.3–60.0 Hz` firing pulse with audible `5.4–7.5 Hz` half-order diesel lope, combustion clatter, and zero turbo whistle (`whistleGain = 0` at `650 rpm`, `0.0011` at `900 rpm`).
3. **Loaded sweep (`650 → 3200 rpm`):** Dragging Throttle smoothly brightens firing/clatter, fades out idle lope by `1400 rpm`, and brings in the `3rd`-order turbo whistle (`2.45 kHz` at `1600 rpm`, `4.26 kHz` at `2400 rpm`, `5.75 kHz` at `3200 rpm`) without clicks, steps, or dropouts.
4. **Build sensitivity (`2400 rpm`):** Selecting `turbo_large` + `tune_performance` raises `whistleHz` from `4,260 Hz` to `5,362 Hz` (`turbo_large` alone stays at `4,260 Hz` under the stock `2.42 PR` tune cap).
5. **Hidden tab / backgrounding:** Switching tabs, minimizing, or locking/backgrounding a phone stops audio immediately (`reason: 'hidden'`, `contextState: 'suspended'`); returning resumes only if `Sound: On`, playing, and `1×`.
6. **Pause & slow motion:** Pausing or choosing `0.1×` / `0.01×` silences smoothly and suspends after `180 ms` while keeping `Sound: On`; returning to Play + `1×` resumes.

---

## 9. Known Limitations (Explicit Disclosure)

1. **Illustrative synthesis, not an LLY recording:** All waveforms and noise bands are procedurally synthesized in Web Audio; no recorded Duramax LLY audio exists in the repository.
2. **No dB or loudness calibration:** Layer gains (`0.42` master + `-10 dB` compressor/limiter) are relative digital levels; no SPL or LUFS calibration is claimed.
3. **No per-cylinder voicing:** An even-fire 90° V8 produces four equal `90°` crank intervals per revolution; cylinder-to-cylinder variation is represented by the single `0.5`-order lope LFO + `0.37 Hz` drift rather than eight separate cylinder voices.
4. **Frequency-locked, not crank-phase-locked:** `firingOsc` tracks `CrankState.rpm` (`rpm / 15` Hz) without locking oscillator phase to `CrankState.crankAngleDeg` (at `900 rpm`, one firing interval is `16.67 ms` = one `60 FPS` frame). Pilot/main injector acoustic lead is not modeled separately from combustion clatter.
5. **No published LLY turbo shaft-speed map:** `shaftRpm = 20,000 + 95,000 × boost01` is an illustrative monotonic proxy rather than a Garrett GT3788VA compressor map lookup.
6. **3rd-order whistle vs literal 11-blade BPF:** Because the literal `11`-blade BPF (`14.7–23.8 kHz` at `80k–130k rpm`) lies above phone-speaker reproduction and near/above adult high-frequency hearing limits, the `3rd`-order shaft tone (`1.0–5.75 kHz`) serves as the primary audible whistle while the `11`-blade BPF is kept as a quiet `10 kHz` low-passed secondary air layer.
7. **iOS Ring/Silent switch caveat:** `navigator.audioSession.type = 'playback'` is experimental; on iOS versions/browsers where it is absent or does not override the hardware Ring/Silent switch, OS muting silences Web Audio output while the UI continues to show the user's `Sound: On` state.
8. **Slow motion is silent by design:** At `0.1×` and `0.01×`, scaling firing frequency would push `900 rpm` into infrasound (`6 Hz` / `0.6 Hz`) and misrepresent turbo pitch, so slow motion mutes cleanly.
9. **No volume slider or persisted preference:** Device/system media volume is the sole volume control in M9, and every load starts muted (`Sound: Off`).
