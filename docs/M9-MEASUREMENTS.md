# Milestone 9 Measurements — Page Weight, Frame Cost & D-033 Budget Compliance (`docs/M9-MEASUREMENTS.md`)

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) (Milestone 9) · Decisions: D-010, D-013, D-033, **D-040** · Spec: [`docs/specs/M9-engine-sound.md`](./specs/M9-engine-sound.md) · Synthesis & provenance: [`docs/M9-SOUND.md`](./M9-SOUND.md) · Research survey: [`docs/research/M9-engine-sound-survey.md`](./research/M9-engine-sound-survey.md) · Normative budgets: [`docs/M2-MEASUREMENTS.md`](./M2-MEASUREMENTS.md) §5 · Prior measurements: [`docs/M3-MEASUREMENTS.md`](./M3-MEASUREMENTS.md), [`docs/M4-MEASUREMENTS.md`](./M4-MEASUREMENTS.md), [`docs/M7-MEASUREMENTS.md`](./M7-MEASUREMENTS.md), [`docs/M8-MEASUREMENTS.md`](./M8-MEASUREMENTS.md)

---

## 1. Page-Weight Measurement & Budget Verdict (Spec §§7.1, 11.3, 13.1)

Measured on the same machine (`Node v24.16.0`, `Vite v7.3.8`, `zlib 1.3.1`) against the untouched `main` baseline (`0e89fbd`) prior to M9 edits:

| Artifact / Metric | Baseline (`main` @ `0e89fbd`) | Post-Build (`m9-engine-sound`) | Measured Delta | Spec §7.1 Budget | Verdict |
| --- | ---: | ---: | ---: | ---: | :---: |
| Production JS minified (`dist/assets/index-*.js`) | `768,085 B` (`index-wsgZcPM5.js`) | `780,222 B` (`index-DbfFaiIa.js`) | **`+12,137 B`** (`+1.58 %` JS) | `≤ +12,288 B` (`12 KiB`) | **PASS** (`151 B` headroom) |
| Production JS gzip — Vite / `zlib` default | `200,325 B` (`200.33 kB`) | `205,218 B` (`205.22 kB`) | **`+4,893 B`** (`+2.44 %` JS gz) | `≤ +5,120 B` (`5 KiB`) | **PASS** (`227 B` headroom) |
| Production JS gzip — `zlib` level 9 | `199,612 B` | `204,507 B` | **`+4,895 B`** (`+2.45 %` JS gz9) | `≤ +5,120 B` (`5 KiB`) | **PASS** (`225 B` headroom) |
| `dist/index.html` (minified / gzip level 9) | `1,438 B` / `635 B` | `1,434 B` / `627 B` | `-4 B` / `-8 B` | Subtitle change only | **PASS** |
| New audio / static files under `public/` | `0 B` (`0` files) | `0 B` (`0` files) | **`0 B`** | `0` new files | **PASS** |
| Uncompressed startup payload (`index + JS + HDRI + 16 GLBs`) | `10,050,510 B` | `10,062,643 B` | `+12,133 B` (`+0.1207 %`, informational) | Informational (`0.122 %` at `12 KiB` cap) | Recorded |
| **Gzip JS delta vs startup payload (Acceptance Metric, §7.1)** | — | — | **`+4,893 / 10,050,510 = +0.0487 %`** | **`≤ +0.10 %`** | **PASS (`>2×` headroom)** |

- **Dependency audit (`src/audio/audioAssets.test.ts`):** `package.json` `dependencies` remains `{ "three": "0.183.2" }` and `devDependencies` is unchanged from M8; zero audio file extensions exist anywhere under `public/` or `src/audio/`.

---

## 2. Runtime `?benchmark=1` `@ 900 RPM` Telemetry — Sound Off vs Sound On (Spec §§5.4, 7.2, 11.9)

### 2.1 Measurement Environment
- **Machine:** `Intel(R) Core(TM) Ultra 7 256V`, `15.7 GiB` RAM, Windows 11 (`x64`)
- **GPU / WebGL Backend:** `ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (8GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)` (WebGL 2)
- **Browser:** Chromium `152.0.7977.167` (`Antigravity/2.32.1` built-in browser; `48,000 Hz` Web Audio output sample rate)
- **Workload:** Production bundle (`npm run build && npx vite preview --port 4173 --strictPort`, `dist/assets/index-DbfFaiIa.js`), continuous animation at **900 RPM (`1×` speed)** after `detailedLoaded && hdriLoaded && exteriorLoaded && variantsLoaded` (and `audio.setEnabled(true)` settled for `sound=1`), **60-frame warmup**, optional **100-call `audio.update` batch** (`sound=1` only, timed prior to resetting `startTimeMs`/`prevFrameMs`), followed by a **10.0-second** (`601`-frame) measurement window.
- **Autoplay benchmark note (§5.4):** Without a user gesture or `--autoplay-policy=no-user-gesture-required`, Chromium keeps programmatic `AudioContext` starts suspended by policy; unlocking user activation via a single pointer gesture on load allows `audio.setEnabled(true)` to settle in `contextState: "running"` before the 60-frame warmup so the full 100-call batch and 10.0-second steady-state audio window execute live.

### 2.2 Desktop (`Full`, `1440×900`, `exterior=1`) — Sound Off vs Sound On Matrix

| Metric | Stock (`sound=0`) | Stock (`sound=1`) | Worst-Case 5 Variants (`sound=0`) | Worst-Case 5 Variants (`sound=1`) | Budget / Requirement |
| --- | ---: | ---: | ---: | ---: | --- |
| `sound.supported` / `enabled` / `audible` | `true / false / false` | **`true / true / true`** | `true / false / false` | **`true / true / true`** | `true / true / true` on `sound=1` |
| `sound.contextState` / `reason` | `uninitialized / off` | **`running / running`** | `uninitialized / off` | **`running / running`** | **`running`** (**PASS**) |
| `sound.nodeCount` | `0` | **`21`** | `0` | **`21`** | **`21` permanent nodes** (**PASS**) |
| `noiseBufferBytes` (`48 kHz × 2.0 s × 4 B`) | `0 B` | **`384,000 B`** (`0.366 MiB`) | `0 B` | **`384,000 B`** (`0.366 MiB`) | `≤ 0.40 MiB` (**PASS**) |
| **`audioUpdate` (`100`-call batch)** | *(omitted)* | **`8.000 µs/call`** (`0.8 ms` total) | *(omitted)* | **`10.000 µs/call`** (`1.0 ms` total) | **`≤ 100 µs/call`** (**PASS**, `10–12.5×` headroom) |
| Sampled frames (`elapsedMs`) | `601` (`10,015.3 ms`) | `601` (`10,013.2 ms`) | `601` (`10,015.6 ms`) | `601` (`10,013.8 ms`) | `~600` frames / `10.0 s` |
| Average frame time (`avgFps`) | `16.664 ms` (`60.01 FPS`) | **`16.661 ms` (`60.02 FPS`)** | `16.665 ms` (`60.01 FPS`) | **`16.662 ms` (`60.02 FPS`)** | `60 FPS` VSync locked |
| **`p50` / `p95` / `min` / `max` frame time** | `16.7 / 16.8 / 15.4 / 16.9 ms` | **`16.7 / 16.8 / 13.1 / 17.0 ms`** | `16.7 / 16.8 / 15.5 / 17.0 ms` | **`16.7 / 16.8 / 13.7 / 16.9 ms`** | **`p95` Δ `= +0.000 ms ≤ +0.30 ms` (PASS)** |
| **`droppedFrames` (`dt > 1.5 × p50`)** | `0` | **`0`** (`+0` vs `sound=0`) | `0` | **`0`** (`+0` vs `sound=0`) | **`≤ soundOff + 1` (PASS)** |
| Synchronous CPU `update + render` (`avg / p95`) | `0.744 / 1.1 ms` | `1.002 / 1.7 ms` | `1.029 / 1.6 ms` | `1.042 / 1.8 ms` | Audio excluded from `cpuRenderSamplesMs` (§5.2) |
| Benchmark `@ 900 RPM`: `firingHz` / `masterGain` | — | `60 Hz` / `0.42` | — | `60 Hz` / `0.42` | `900 / 15 = 60 Hz` |
| Benchmark `@ 900 RPM`: `load01` / `boost01` | — | `0.143682` / `0.026738` | — | `0.141723` / `0.013072` | Lower `900 rpm` boost on `turbo_large` |
| Benchmark `@ 900 RPM`: `whistleHz` / `whistleGain` | — | `1127.005 Hz` / `0.001083` | — | `1062.092 Hz` / `0.000427` | Whistle `< 0.002` at `900 rpm` (**PASS**) |

### 2.3 Phone (`Phone`, `390×844`, `exterior=1`) — Sound Off vs Sound On Matrix

| Metric | Stock (`sound=0`) | Stock (`sound=1`) | Worst-Case 5 Variants (`sound=0`) | Worst-Case 5 Variants (`sound=1`) | Budget / Requirement |
| --- | ---: | ---: | ---: | ---: | --- |
| `sound.supported` / `enabled` / `audible` | `true / false / false` | **`true / true / true`** | `true / false / false` | **`true / true / true`** | `true / true / true` on `sound=1` |
| `sound.contextState` / `reason` | `uninitialized / off` | **`running / running`** | `uninitialized / off` | **`running / running`** | **`running`** (**PASS**) |
| `sound.nodeCount` | `0` | **`21`** | `0` | **`21`** | **`21` permanent nodes** (**PASS**) |
| **`audioUpdate` (`100`-call batch)** | *(omitted)* | **`13.000 µs/call`** (`1.3 ms` total) | *(omitted)* | **`10.000 µs/call`** (`1.0 ms` total) | **`≤ 100 µs/call`** (**PASS**, `7.7–10×` headroom) |
| Sampled frames (`elapsedMs`) | `601` (`10,015.4 ms`) | `601` (`10,014.5 ms`) | `601` (`10,014.6 ms`) | `601` (`10,013.5 ms`) | `~600` frames / `10.0 s` |
| Average frame time (`avgFps`) | `16.665 ms` (`60.01 FPS`) | **`16.663 ms` (`60.01 FPS`)** | `16.663 ms` (`60.01 FPS`) | **`16.661 ms` (`60.02 FPS`)** | `60 FPS` VSync locked |
| **`p50` / `p95` / `min` / `max` frame time** | `16.7 / 16.8 / 15.5 / 17.0 ms` | **`16.7 / 16.8 / 14.4 / 17.0 ms`** | `16.7 / 16.8 / 14.4 / 17.1 ms` | **`16.7 / 16.8 / 13.5 / 17.1 ms`** | **`p95` Δ `= +0.000 ms ≤ +0.30 ms` (PASS)** |
| **`droppedFrames` (`dt > 1.5 × p50`)** | `0` | **`0`** (`+0` vs `sound=0`) | `0` | **`0`** (`+0` vs `sound=0`) | **`≤ soundOff + 1` (PASS)** |
| Synchronous CPU `update + render` (`avg / p95`) | `0.551 / 0.9 ms` | `0.553 / 0.8 ms` | `0.774 / 1.3 ms` | `0.763 / 1.3 ms` | Within `≤ 16.7 ms` (`60 FPS`) |
| Benchmark `@ 900 RPM`: `whistleHz` / `whistleGain` | — | `1127.005 Hz` / `0.001083` | — | `1062.092 Hz` / `0.000427` | Matches Desktop identically |

*(Note: worst-case 5-variant query string is `&variants=turbo_large,intake_highflow,exhaust_4in,intercooler_upgraded,pistons_lowcomp`.)*

---

## 3. Live UI Parameter Captures, Interactive Gates & Mobile Touch Target (Spec §§8.2, 11.4–11.8)

### 3.1 Stock Build Parameter Captures Across `650–3200 RPM`
Captured from `computeSoundParameters` / `window.__engineAudio.getParameters()` against the live M5 `computeDetails(stockBuild)` curve while audible:

| Parameter | `650 RPM` | `900 RPM` | `1600 RPM` | `2400 RPM` | `3200 RPM` |
| --- | ---: | ---: | ---: | ---: | ---: |
| `firingHz` (Hz) | `43.333333` | `60.000000` | `106.666667` | `160.000000` | `213.333333` |
| `throttle01` | `0.000000` | `0.098039` | `0.372549` | `0.686275` | `1.000000` |
| `idle01` | `1.000000` | `0.864816` | `0.000000` | `0.000000` | `0.000000` |
| `load01` | `0.080000` | `0.143682` | `0.422745` | `0.677059` | `0.820000` |
| `boost01` | `0.000000` | `0.026738` | `0.304813` | `0.686275` | `1.000000` |
| `firingGain` / `firingLpfHz` | `0.168000` / `306.000` | `0.174368` / `350.578` | `0.202275` / `545.922` | `0.227706` / `723.941` | `0.242000` / `824.000` |
| `clatterGain` / `clatterHz` | `0.200800` / `1912.000` | `0.206543` / `2001.155` | `0.209914` / `2391.843` | `0.276035` / `2747.882` | `0.313200` / `2948.000` |
| `bodyGain` / `bodyLpfHz` | `0.048000` / `356.000` | `0.054368` / `400.578` | `0.082275` / `595.922` | `0.107706` / `773.941` | `0.122000` / `874.000` |
| `whistleHz` (Hz) | `1000.000` | `1127.005` | `2447.861` | **`4259.804`** | **`5750.000`** |
| `whistleGain` | **`0.000000`** | **`0.001083`** | `0.025611` | `0.073558` | `0.120000` |
| `bpfHz` / `bpfGain` | `3666.667` / `0` | `4132.353` / `0.000197` | `8975.490` / `0.007573` | `15619.281` / `0.025583` | `21083.333` / `0.045000` |
| `lopeHz` / `lopeDepth` | `5.416667` / `0.220000` | `7.500000` / `0.190259` | `13.333333` / `0` | `20.000000` / `0` | `26.666667` / `0` |
| `driftHz` / `driftDepth` | `0.370000` / `0.100000` | `0.370000` / `0.086482` | `0.370000` / `0` | `0.370000` / `0` | `0.370000` / `0` |
| `masterGain` | `0.420` | `0.420` | `0.420` | `0.420` | `0.420` |

### 3.2 Build Sensitivity at `2400 RPM` (Spec §§11.5, 13.2)

| Build Configuration (`@ 2400 RPM`) | Model `boostPsiGauge` | Model `fuelMm3` | `load01` | `boost01` | `whistleHz` | `whistleGain` | `bpfHz` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **Stock build** (`stockBuild`) | `20.874 psi` | `95.00 mm³` | `0.677059` | `0.686275` | **`4259.804 Hz`** | `0.073558` | `15619.281 Hz` |
| **`turbo_large` alone** (stock tune `2.42 PR` cap) | `20.874 psi` | `95.00 mm³` | `0.677059` | `0.686275` | **`4259.804 Hz`** | `0.073558` | `15619.281 Hz` |
| **`turbo_large` + `tune_performance`** (`2.90 PR`) | `27.930 psi` | `110.00 mm³` | `0.780000` | `0.918255` | **`5361.709 Hz`** | `0.107407` | `19659.601 Hz` |

### 3.3 Autoplay, Playback Gate, Mobile Layout & Reference Frame Checks
- **Fresh load (`1440×900`):** `#title-banner p` = `"Milestone 9 — Engine Sound"`, `#m9-sound-btn` = `"Sound: Off"` (`aria-pressed="false"`, enabled), `#m9-sound-note` (`aria-live="polite"`) matches Spec §5.1 verbatim, `getStatus()` = `{ supported: true, enabled: false, audible: false, contextState: 'uninitialized', reason: 'off' }`, `getStats()` = `{ nodeCount: 0, noiseBufferBytes: 0 }`, `0` console errors.
- **Mute/Pause/Slow-Motion gates (`@ 900 RPM`):**
  - Click `Sound: Off` -> `"Sound: On"` (`aria-pressed="true"`), `contextState: 'running'`, `audible: true`, `nodeCount: 21`.
  - Click `Pause` -> `audible: false`, `reason: 'paused'`, `contextState: 'suspended'` after `180 ms` while button stays `"Sound: On"`; click `Play` -> resumes `running` / `audible: true`.
  - Click `0.1×` and `0.01×` -> `audible: false`, `reason: 'slow-motion'`, `contextState: 'suspended'` after `180 ms`; click `1×` -> resumes `running` / `audible: true`.
  - Click `Sound: On` -> `"Sound: Off"` (`aria-pressed="false"`), `enabled: false`, `reason: 'off'`, `contextState: 'suspended'` after `180 ms`.
- **Mobile viewport (`390×844`):** `.m1-row` computed `flex-wrap: wrap`; `#m9-sound-btn` bounding box = **`87.69 × 44.00 px`** (`≥ 44 × 44 px` requirement — **PASS**), right edge `374.0 px ≤ 390 px` (fully inside viewport).
- **Reference frames (`?rf=RF-1`, `RF-3`, `RF-8`, `RF-10`):** Render visually unchanged with `0` console errors and `enabled: false, audible: false, contextState: 'uninitialized'`.

---

## 4. Browser / Device Matrix & iOS Silent-Switch Status (Spec §§8.2, 11.8)

Local build verification ran on a Windows 11 x64 host (`Intel Core Ultra 7 256V` / `Intel Arc 140V`); physical Apple/Android hardware is not attached to the local build machine and is recorded honestly below for deployed preview verification per Spec §11.8:

| Environment | Viewport / Device | Web Audio Start / Mute / Lifecycle | Touch Target (`≥ 44×44 px`) | `audioSession.type = 'playback'` / Silent Switch | Status |
| --- | --- | --- | --- | --- | --- |
| **Desktop Chromium `152`** (Windows 11) | `1440×900` | Verified live (`uninitialized` -> `running` -> `suspended`; `0` console errors) | N/A (desktop pointer) | N/A | **Verified locally** |
| **Mobile-tier Chromium `152`** (Windows 11) | `390×844` | Verified live (`Phone` tier `60.01 FPS`, `10–13 µs/call`, `0` console errors) | **`87.69 × 44.00 px`** (`flex-wrap: wrap`, **PASS**) | N/A | **Verified locally** |
| **Node Vitest Fake-Context Suite** (`engineAudio.test.ts`) | Headless `Node 24.16.0` | Verified `visibilitychange`, `pagehide`, `180 ms` cancel, `bfcache`, `blocked`, `unsupported`, `dispose` | N/A | Verified `playback` / `auto` & `interrupted` -> `active` | **Verified in CI/tests** |
| **Desktop Edge / Firefox / macOS Safari** | Desktop | Standard Web Audio 1.0 nodes only (`Oscillator`, `Gain`, `BiquadFilter`, `BufferSource`, `PeriodicWave`, `DynamicsCompressor`) | N/A | N/A | Pending deployed preview check |
| **iPhone Safari (`iOS 16.4+`)** | Physical iPhone | Gesture-gated `new AudioContext()` + `resume()` in click task (§4.1) | CSS `@media (max-width: 640px), (pointer: coarse)` `min-height: 44px` | Opts into `navigator.audioSession.type = 'playback'` when present; if unsupported or muted by OS Ring/Silent switch, falls back to silent OS output while showing `Sound: On` (§4.5) | **Pending real-device check on deployed Pages URL (§11.8)** |
| **Android Chrome** | Physical Android phone | Gesture-gated `AudioContext` + immediate `visibilitychange`/`pagehide` suspend | CSS `@media (max-width: 640px), (pointer: coarse)` `min-height: 44px` | Uses standard media volume + visibility lifecycle | **Pending real-device check on deployed Pages URL (§11.8)** |

---

## 5. §11 Deployed Listening & Functional Checks Summary

| §11 Check | Local Production Preview Result (`http://localhost:4173/CarbonDuramax/`) |
| --- | --- |
| **§11.4 Autoplay & RF safety** | **PASS** — Silent on load (`uninitialized`), starts only on `#m9-sound-btn` click, mutes & suspends after `180 ms`, `?rf=RF-1..RF-10` untouched & silent, `0` console errors. |
| **§11.5 Signal & build tracking** | **PASS** — `whistleGain = 0` at `650 rpm`, `0.001083 < 0.002` at `900 rpm`; `2,448 Hz` at `1600 rpm`; `5,750 Hz` at `3200 rpm`; `@ 2400 rpm` stock & `turbo_large` alone = `4,259.8 Hz`, `turbo_large + tune_performance` = `5,361.7 Hz`. |
| **§11.6 Hidden tab** | **PASS** — Immediate `master.gain = 0` + `ctx.suspend()` on `visibilitychange` (`hidden`) and `pagehide`; resumes on `visible` only when `enabled && playing && 1×` (verified in `engineAudio.test.ts` Test 11). |
| **§11.7 Pause & slow motion** | **PASS** — Pause, `0.1×`, and `0.01×` ramp to silence and suspend after `180 ms` while keeping `Sound: On`; Play / `1×` resumes cleanly. |
| **§11.8 Mobile layout & iOS session** | **PASS (local viewport + unit seam)** — `87.69 × 44.00 px` wrapped button at `390×844`; `audioSession.type = 'playback'` / `'auto'` wired and unit-tested; physical iPhone/Android speaker & silent-switch check queued for deployed Pages preview. |
| **§11.9 Frame-cost benchmark** | **PASS** — `8–13 µs/call ≤ 100 µs/call`, `p95` delta `+0.000 ms ≤ +0.30 ms`, `droppedFrames = 0`, `nodeCount = 21`. |

---

## 6. D-033 Geometry & GPU Parity Re-Check vs Milestone 8 (Spec §§7.2, 11.9)

M9 does not import Three.js or touch `src/renderer/**` or `public/**`. All normative D-033 geometry, draw-call, and VRAM metrics match [`docs/M8-MEASUREMENTS.md`](./M8-MEASUREMENTS.md) §4 identically:

| Normative D-033 Metric | Desktop `Full` Budget | M8 Measured (Stock / 5-Var) | **M9 Measured (`sound=1`, Stock / 5-Var)** | Phone Budget | M8 Measured (Stock / 5-Var) | **M9 Measured (`sound=1`, Stock / 5-Var)** | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
| `visibleSceneTriangles` | `≤ 360,000` | `302,620 / 297,072` | **`302,620 / 297,072`** (`0` Δ) | `≤ 320,000` | `302,620 / 297,072` | **`302,620 / 297,072`** (`0` Δ) | **PASS** |
| `render.triangles` (submitted/frame) | `≤ 700,000` | `573,780 / 561,320` | **`573,780 / 561,320`** (`0` Δ) | `≤ 400,000` | `302,272 / 296,724` | **`302,272 / 296,724`** (`0` Δ) | **PASS** |
| `render.calls` | `≤ 250` | `106 / 106` | **`106 / 106`** (`0` Δ) | `≤ 120` | `65 / 65` | **`65 / 65`** (`0` Δ) | **PASS** |
| `estimatedTextureVramMiB` | `≤ 64 MiB` | `27.25 / 27.25 MiB` | **`27.25 / 27.25 MiB`** (`0` Δ) | `≤ 32 MiB` | `11.25 / 11.25 MiB` | **`11.25 / 11.25 MiB`** (`0` Δ) | **PASS** |
| Steady-state frame time (`p95`) | `≤ 16.7 ms` (`60 FPS`) | `16.8 / 16.8 ms` | **`16.8 / 16.8 ms`** (`0` Δ) | `≤ 33.3 ms` (`30 FPS`) | `16.8 / 16.8 ms` | **`16.8 / 16.8 ms`** (`0` Δ) | **PASS** |

---

## 7. Exact Verification Commands Used

```bash
# 1. Typecheck, full 81-test unit/contract suite, and production build
npm run typecheck
npm test
npm run build

# 2. Exactminified + gzip (default & level-9) byte measurement against 0e89fbd baseline
node -e "const fs=require('fs'),zlib=require('zlib'),path=require('path');const f=fs.readdirSync('dist/assets').find(x=>x.endsWith('.js'));const js=fs.readFileSync(path.join('dist/assets',f));console.log({file:f,min:js.length,deltaMin:js.length-768085,gzDef:zlib.gzipSync(js).length,deltaGzDef:zlib.gzipSync(js).length-200325,gz9:zlib.gzipSync(js,{level:9}).length,deltaGz9:zlib.gzipSync(js,{level:9}).length-199612});"

# 3. Production preview server + ?benchmark=1 URLs (Desktop 1440×900 & Phone 390×844)
npx vite preview --port 4173 --strictPort
#   http://localhost:4173/CarbonDuramax/?benchmark=1&quality=full&exterior=1&sound=0
#   http://localhost:4173/CarbonDuramax/?benchmark=1&quality=full&exterior=1&sound=1
#   http://localhost:4173/CarbonDuramax/?benchmark=1&quality=full&exterior=1&variants=turbo_large,intake_highflow,exhaust_4in,intercooler_upgraded,pistons_lowcomp&sound=0
#   http://localhost:4173/CarbonDuramax/?benchmark=1&quality=full&exterior=1&variants=turbo_large,intake_highflow,exhaust_4in,intercooler_upgraded,pistons_lowcomp&sound=1
#   http://localhost:4173/CarbonDuramax/?benchmark=1&quality=phone&exterior=1&sound=0
#   http://localhost:4173/CarbonDuramax/?benchmark=1&quality=phone&exterior=1&sound=1
#   http://localhost:4173/CarbonDuramax/?benchmark=1&quality=phone&exterior=1&variants=turbo_large,intake_highflow,exhaust_4in,intercooler_upgraded,pistons_lowcomp&sound=0
#   http://localhost:4173/CarbonDuramax/?benchmark=1&quality=phone&exterior=1&variants=turbo_large,intake_highflow,exhaust_4in,intercooler_upgraded,pistons_lowcomp&sound=1

# 4. Frozen-file audit (§11.1)
git diff main -- src/core src/perf src/config catalog src/renderer public package.json package-lock.json .github vite.config.ts tsconfig.json docs/M2-MEASUREMENTS.md docs/M3-MEASUREMENTS.md docs/M4-MEASUREMENTS.md docs/M5-MODEL.md docs/M6-PARTS.md docs/M7-DATA.md docs/M7-MEASUREMENTS.md docs/M8-VARIANTS.md docs/M8-MEASUREMENTS.md docs/specs/M0-* docs/specs/M1-* docs/specs/M2-* docs/specs/M3-* docs/specs/M4-* docs/specs/M5-* docs/specs/M6-* docs/specs/M7-* docs/specs/M8-* docs/specs/M9-engine-sound.md docs/specs/M9-engine-sound-QA.md docs/research/M9-engine-sound-survey.md docs/PLANNING.md docs/ORCHESTRATOR.md docs/ASSET_CONTRACT.md docs/THREE_API_NOTES.md docs/REFERENCE_FRAMES.md
```
