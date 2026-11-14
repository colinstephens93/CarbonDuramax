# M9 Engine-Sound Research Survey — Procedural audio for the LLY simulation

Purpose: establish what is **published, platform-defined, or honestly unavailable** before the
Milestone 9 spec commits to a synthesis model. The owner has no LLY recording and no physical
engine access (D-028), so nothing here is a measured LLY sound; this survey fixes the physical
anchors (firing rate, combustion band, turbo blade-pass arithmetic, browser autoplay rules) and
labels every value that is an audio-authoring choice rather than a measurement.

Researched 2026-11-14 from public sources. Values are quoted as published, with original units.
Calculations on published inputs are labelled DERIVED. No audio was recorded, measured, or
downloaded.

**Reliability grades used below**

- **A** — official platform/standards documentation (W3C, MDN, Chrome for Developers, WebKit) or a
  peer-reviewed/standard engineering reference.
- **B** — established engineering publication, government report, academic thesis/paper, or
  service-literature mirror.
- **C** — specialist vendor/tuner page publishing dimensions or measured core data.
- **D** — forum post or third-party implementation note (unverified unless corroborated).

**Verdicts:** PUBLISHED / PARTIALLY PUBLISHED / NOT PUBLICLY AVAILABLE / PLATFORM-DEFINED.

---

## 1. Firing frequency and order structure

### 1.1 Firing frequency of a four-stroke V8 — PUBLISHED

A four-stroke engine fires one cylinder per two crankshaft revolutions per cylinder. For an
8-cylinder engine that is **four power strokes per crankshaft revolution** (equivalently, half the
cylinder count per revolution). The service-literature statement is explicit:

> "The number of times an engine fires a cylinder with each crankshaft revolution is equal to
> one-half the number of cylinders. … An 8-cylinder engine fires 4 cylinders for each crankshaft
> revolution. … Multiply the engine rpm … by the number of cylinders fired with each crankshaft
> revolution. … Divide this number by 60 … to obtain the engine firing frequency."

— Operation CHARM, 2010 Ford Taurus service manual, "Calculating Engine Firing Frequency"
([source](https://charm.li/Ford/2010/Taurus%20AWD%20V6-3.5L%20Turbo/Repair%20and%20Diagnosis/Testing%20and%20Inspection/Symptom%20Related%20Diagnostic%20Procedures/Frequency%20Calculations/Calculating%20Engine%20Firing%20Frequency/)).

DERIVED for the LLY (8 cylinders, four-stroke, 90° firing intervals per
`src/config/engineConfig.ts` firing order 1-2-7-8-4-5-6-3):

```
f_fire(Hz) = rpm × 4 / 60 = rpm / 15
```

| rpm | Firing frequency (Hz) |
| ---: | ---: |
| 650 | 43.333 |
| 900 | 60.000 |
| 1000 | 66.667 |
| 1600 | 106.667 |
| 2400 | 160.000 |
| 3200 | 213.333 |

The **engine-cycle frequency** (one complete 720° four-stroke cycle) is `rpm / 120` Hz — exactly
one eighth of the firing frequency for a V8. This is the "half-order" region used by diesel
sound-quality work: a 4-stroke engine's order spectrum has components at 0.5-order spacing
(`0.5 × rpm/60`), and the firing frequency is the 4th order for a V8. The IRCAM diesel-sound work
states the cycle-rate fundamental directly ("The principal frequency f for an engine revolution
speed k of 3000 RPM is equal to 25 Hz" — 3000/120 —
[Frère, IRCAM](http://articles.ircam.fr/textes/Frere11a/index.pdf)), and a 2025 engine-sound
synthesis thesis treats four-stroke engine orders as spaced at 0.5
([Dörfler, SMC 2025](https://zenodo.org/records/17304643/files/Robin-Doerfler_SMC_2025_Master_Thesis.pdf?download=1)).

### 1.2 Firing order and bank pattern — PUBLISHED (repo data), not an acoustic spectrum

`engineConfig.firingOrder = [1, 2, 7, 8, 4, 5, 6, 3]` with banks RH/LH/RH/LH/LH/RH/LH/RH. Firing
intervals are even at 90° crank, so the **firing pulse train is even at four pulses per
revolution regardless of which cylinder fires**; the firing order changes the bank sequence
(R-L-R-L-L-R-L-R), not the pulse rate. No published LLY in-cabin or dyno-cell acoustic spectrum
was found, so the survey does not claim one.

**Verdict: PUBLISHED** for the firing-rate formula and ramp; **NOT PUBLICLY AVAILABLE** for an
LLY acoustic spectrum.

## 2. Diesel idle and combustion character

### 2.1 Where diesel noise lives — PARTIALLY PUBLISHED

- A US government diesel-noise review identifies three sources — combustion, mechanical, and
  structural response — and states that combustion noise is the predominant source in large
  (7–10 L) heavy-duty direct-injection engines, while light-duty engines have combustion and
  mechanical noise of similar magnitude. It places common structural resonances at
  **400–800 Hz**, bearing resonances near **1000 Hz**, crankcase/bearing-support modes at
  **2000–3000 Hz**, and sump/oil-pan modes near **1000–3000 Hz**
  ([OSTI diesel-engine noise review](https://www.osti.gov/servlets/purl/6769170/), grade B).
- A University of Cape Town diesel-noise thesis states that, with normal combustion, the highest
  noise levels correspond to structural natural frequencies "usually … between **800 and
  2500 Hz** for automotive engines", and that rapid pressure rise/knock raises harmonics in the
  **800–5000 Hz** range
  ([UCT thesis](https://open.uct.ac.za/server/api/core/bitstreams/bccc9254-1718-4466-84cf-8857b4328d60/content), grade B).
- A JSAE technical paper on diesel knock reports the dominant knock energy near the **3.15 kHz
  one-third-octave band**
  ([Kanda & Mori, Int. J. Automotive Engineering 7(2), 2016](https://www.jstage.jst.go.jp/article/jsaeijae/7/2/7_20164085/_article/-char/en), grade B; the 3.15 kHz
  figure is quoted from the paper's indexed full text — the linked abstract page does not state
  it).

### 2.2 Idle irregularity and half-order modulation — PARTIALLY PUBLISHED

Diesel idle irregularity is a **cycle-to-cycle and cylinder-to-cylinder** phenomenon, and its
acoustic signature appears as half-order modulation rather than a clean firing-order tone:

> "As a rule of thumb, the half engine order harmonics will be dominant in modulation frequencies.
> A well designed engine should only have modulations around its main firing order frequency.
> Different results indicate a combustion instability problem between cylinders and/or firing
> cycles."

— diesel-clatter modulation analysis
([core.ac.uk](https://core.ac.uk/download/62735721.pdf), grade B). A controlled-idle order study
similarly shows a **0.5-order** component when one cylinder receives no fuel, reported as clearly
present (not dominant — the 1.5-order peak is larger)
([IFAC "Periodicity of the idle speed of a diesel engine"](https://www.sciencedirect.com/science/article/pii/S147466701734065X), grade B; abstract/indexed text).

This is the physical justification for synthesizing idle "lope" as **half-order amplitude
modulation** (one cycle per two crank revolutions = `f_fire / 8`) plus a slower drift, rather than
as a per-cylinder engine simulation.

### 2.3 LLY idle speed — PARTIALLY PUBLISHED

Forum-reported stock LLY idle is roughly **700–800 rpm**
([Diesel Place thread](https://www.dieselplace.com/threads/lly-idle-setting.14945/?nested_view=1#post-339661), grade D); a GM service bulletin for a later
Duramax (LML) lists a 680 rpm base idle, which is **not** an LLY value and is not adopted here
([NHTSA PIP4912G](https://static.nhtsa.gov/odi/tsbs/2020/MC-10178350-9999.pdf), grade A for the
LML, inapplicable to the LLY). The app's slider floor (650 rpm) and default (900 rpm) are UI
choices, not claims about the stock LLY idle setting.

**Verdict: PARTIALLY PUBLISHED.** The 800–2500 Hz structural band and the ~3.15 kHz knock region
are sourced; the exact LLY spectrum and per-cylinder variation are **NOT PUBLICLY AVAILABLE**. The
spec's combustion band and modulation depths are audio-authoring choices anchored to these
ranges, and must be labelled illustrative.

## 3. Turbo whistle

### 3.1 Published turbo geometry — PARTIALLY PUBLISHED

The stock LLY turbo is the Garrett **GT3788VA**. The L7 survey records specialist-measured stock
dimensions: compressor wheel **62.8 mm inducer / 88 mm exducer, 11 blades**; turbine wheel
**71.3 mm inducer / 65.7 mm exducer, 13 blades** (L7 survey §11, grade C; corroborated by a
stock-replacement listing that specifies an **11-blade compressor wheel** and 13-blade turbine,
[southcentraldiesel](https://southcentraldiesel.com/products/garrett-04-5-10-gm-duramax-new-stock-gt3788va-turbocharger-848212-5001s), grade C). The 11-blade compressor count is the only
turbo geometry the audio model uses.

### 3.2 Blade-pass frequency — PUBLISHED formula, unpublished LLY shaft-speed map

Blade-pass frequency is shaft rotational frequency × number of blades. A US military turboshaft
noise text gives the worked form:

> "Calculate the shaft rotation frequency f_S from [shaft speed in rev/sec] and the blade-passage
> frequency f_B from f_B = f_S × number of blades in first compressor rotor stage."

— ([DTIC AD0893335](https://apps.dtic.mil/sti/tr/pdf/AD0893335.pdf), grade B). For the LLY's
11-blade compressor:

```
BPF(Hz) = 11 × shaft_rpm / 60
```

A 1983 Commercial Motor article gives the typical turbocharger operating range as **80,000 to
130,000 rpm** ([Commercial Motor archive](https://archive.commercialmotor.com/article/24th-september-1983/91/n-vehicle-n-yaxrnm-oaucoi-r-corig), grade C). A Duramax forum thread reports
~100,000 rpm fully spooled and ~120,000 rpm at ~20 psi ([Diesel Place](https://www.dieselplace.com/threads/turbo-speed.64629/#post-928034), grade D). No LLY-specific
shaft-speed vs boost map was found.

| Shaft speed (rpm) | 11-blade BPF (Hz) | 3rd-order tone (Hz) |
| ---: | ---: | ---: |
| 20,000 (audio proxy floor) | 3,667 | 1,000 |
| 80,000 (published range low) | 14,667 | 4,000 |
| 100,000 | 18,333 | 5,000 |
| 115,000 (audio proxy ceiling) | 21,083 | 5,750 |
| 130,000 (published range high) | 23,833 | 6,500 |

At a 44.1 kHz context the Nyquist limit is 22,050 Hz; the 80,000–130,000 rpm BPF range is
**14.7–23.8 kHz**, i.e. it spans the top of typical adult hearing and most of it is above what
phone loudspeakers reproduce usefully. The literal blade-pass tone therefore cannot be the
audible whistle on the target devices; a lower-order component is required.

### 3.3 Lower-order turbo tones — PARTIALLY PUBLISHED

Turbocharger compressor noise contains narrowband components at low integer multiples of shaft
frequency, not only the blade-pass tone. A turbocharger-compressor noise study reports a
narrow band "at a frequency about **3 times of rotor rev**", and separately shows components near
**2×** and **5×** rotor frequency under different operating conditions
([HAL 2019 compressor-noise study](https://hal.science/hal-02376818/document), grade B); the
study attributes the 3× narrow band to its **experimental setup**, so it is evidence that such
components exist, not a claim that the LLY produces a 3rd-order whistle in service.
A 3rd-order (3 × shaft frequency) tone is therefore a **plausible illustrative choice** for an
audible whistle (1.0–5.75 kHz across the audio proxy range), with the literal 11-blade BPF as a
low-level, low-passed secondary layer. The LLY's actual turbo acoustic spectrum and levels are
not published.

**Verdict: PARTIALLY PUBLISHED.** Blade count, BPF formula and typical shaft-speed range are
published; lower-order components are reported in lab studies; the LLY shaft-speed map, LLY
spectrum, and acoustic levels are **NOT PUBLICLY AVAILABLE**. The spec's 20,000–115,000 rpm proxy
and 3rd-order whistle are illustrative, not measured.

## 4. Web Audio autoplay, lifecycle, and mobile

### 4.1 Autoplay — PLATFORM-DEFINED, documented

Chrome's Web Audio autoplay policy (launched in Chrome 71) states that an `AudioContext` created
before a user gesture is created **suspended**, and must be resumed after a gesture; alternatively
create it only in the gesture handler. It recommends waiting for a click on a play/on-off control
([Chrome for Developers, "Autoplay policy in Chrome"](https://developer.chrome.com/blog/autoplay), grade A). `AudioContext.resume()` returns a promise that
resolves when the context resumes ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume), grade A). The same gesture requirement applies to
Safari/iOS media; WebKit's policy note defines a user gesture as the direct cause of the handler
(`click`, `touchend`, `keydown`, etc.)
([WebKit, "New video policies for iOS"](https://webkit.org/blog/6784/new-video-policies-for-ios/), grade A for the gesture principle; the page is
about `<video>`, not Web Audio).

**Consequence adopted:** the spec never constructs an `AudioContext` at page load; the Sound
control's click handler constructs and resumes it. Sound is off on every load, with no persisted
auto-start.

### 4.2 Hidden tabs and suspension — PLATFORM-DEFINED, documented

The Page Visibility API reports hidden/visible transitions; browsers stop `requestAnimationFrame`
in hidden tabs. MDN also notes that **tabs playing audio are treated as foreground and are not
throttled**, which is exactly why explicit suspension is needed for a non-essential sound layer
([MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), grade A). Chrome's official Web Audio sample suspends its
context when the tab is hidden and resumes it when the tab returns
([Chrome WebAudio suspend/resume sample](https://googlechrome.github.io/samples/webaudio-suspend-resume/index.html), grade A).

**Consequence adopted:** the spec suspends the context immediately on `document.hidden` (no
background playback, no audio-thread or tab-throttle exemption), and resumes only when the tab is
visible, sound is enabled, the engine is playing, and playback is 1×.

### 4.3 iOS silent switch and audio session — PLATFORM-DEFINED, partially experimental

The W3C Audio Session API (editor's draft; MDN marks it experimental/limited availability) exposes
`navigator.audioSession.type` with `playback`, `ambient`, `transient`, etc. `playback` is the
media-playback type; `ambient` is mixable interface audio
([W3C Audio Session](https://w3c.github.io/audio-session/), grade A editor's draft;
[MDN AudioSession](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession), grade A).
Third-party implementation notes state that WebKit routes `AudioContext` to the ambient category by
default, which the hardware Ring/Silent switch silences, and that setting the session type to
`playback` is the workaround
([Guidonica ADR-0027](https://github.com/Hand-Lock/guidonica/blob/main/docs/adr/0027-ios-silent-mode-dynamic-audio-session.md), grade D). This behaviour is platform-defined and
was **not tested by us on a physical iPhone** in this research.

**Consequence adopted:** the spec sets `navigator.audioSession.type = 'playback'` when the API is
present (explicit user action, continuous media intent), restores `'auto'` on disable/dispose, and
records a real-device acceptance step for the silent switch. Where the API is absent, the silent
switch may mute Web Audio; the UI still shows the user's on/off intent and the docs state the OS
caveat.

### 4.4 Audio thread and CPU

Web Audio renders the graph on the audio thread; the main-thread cost is parameter updates. The
spec's main-thread work is one small parameter computation per `requestAnimationFrame` plus
`AudioParam.setTargetAtTime` calls, so the D-033 frame budget is not threatened. This is a design
property, not an external fact; the spec records measured baseline and prototype numbers.

**Verdict: PLATFORM-DEFINED.** The browser rules are documented; the exact device behaviour
(silent switch, Bluetooth routing, interruption recovery) is platform-specific and must be
verified on hardware in acceptance.

## 5. What is not published (and therefore not claimed)

| Item | Status | Consequence for M9 |
| --- | --- | --- |
| LLY in-cabin / dyno acoustic recording or spectrum | NOT PUBLICLY AVAILABLE | Sound is an illustrative synthesis, not a reproduction; the UI says so |
| LLY turbo shaft-speed vs boost map | NOT PUBLICLY AVAILABLE | 20,000–115,000 rpm proxy, labelled illustrative |
| Per-cylinder LLY combustion variation / injector acoustic signature | NOT PUBLICLY AVAILABLE | Half-order amplitude modulation, not per-cylinder voices |
| LLY stock idle rpm (authoritative) | PARTIALLY PUBLISHED (forum 700–800; LML 680 inapplicable) | App range is a UI choice; no idle value is baked into the sound model |
| Phone-speaker frequency response and loudness | DEVICE-DEPENDENT / not measured | 3rd-order whistle chosen to stay in 1–5.75 kHz; BPF secondary layer low-passed |
| Numerical acoustic levels (dB) for any layer | NOT PUBLICLY AVAILABLE | No dB calibration is claimed; fixed master/limiter only |

## 6. Source register

| # | Source | Kind / grade | Used for | Accessed |
| ---: | --- | --- | --- | --- |
| 1 | [Operation CHARM — Calculating Engine Firing Frequency](https://charm.li/Ford/2010/Taurus%20AWD%20V6-3.5L%20Turbo/Repair%20and%20Diagnosis/Testing%20and%20Inspection/Symptom%20Related%20Diagnostic%20Procedures/Frequency%20Calculations/Calculating%20Engine%20Firing%20Frequency/) | Service manual mirror / B | 4 firings per rev; `rpm × 4 / 60` | 2026-11-14 |
| 2 | [Frère, IRCAM diesel sound-quality paper](http://articles.ircam.fr/textes/Frere11a/index.pdf) | Academic / B | 4-stroke cycle frequency 25 Hz at 3000 rpm; 0.5-order spacing | 2026-11-14 |
| 3 | [Dörfler, SMC 2025 engine-sound synthesis thesis](https://zenodo.org/records/17304643/files/Robin-Doerfler_SMC_2025_Master_Thesis.pdf?download=1) | Academic / B | Four-stroke orders spaced at 0.5 | 2026-11-14 |
| 4 | [OSTI diesel-engine noise review](https://www.osti.gov/servlets/purl/6769170/) | Government report / B | Combustion-noise dominance; 400–800 / 1000 / 2000–3000 Hz resonances | 2026-11-14 |
| 5 | [UCT diesel-noise thesis](https://open.uct.ac.za/server/api/core/bitstreams/bccc9254-1718-4466-84cf-8857b4328d60/content) | Academic thesis / B | 800–2500 Hz structural band; 800–5000 Hz knock harmonics | 2026-11-14 |
| 6 | [Kanda & Mori, JSAE 2016](https://www.jstage.jst.go.jp/article/jsaeijae/7/2/7_20164085/_article/-char/en) | Peer-reviewed / B | ~3.15 kHz knock band (indexed full text; not on the abstract page) | 2026-11-14 |
| 7 | [Diesel-clatter modulation analysis](https://core.ac.uk/download/62735721.pdf) | Academic / B | Half-order modulation = cylinder/firing instability | 2026-11-14 |
| 8 | [IFAC idle-speed periodicity](https://www.sciencedirect.com/science/article/pii/S147466701734065X) | Academic / B | 0.5-order component with one unfuelled cylinder | 2026-11-14 |
| 9 | [L7 verified-data survey, §11](https://github.com/colinstephens93/CarbonDuramax/blob/main/docs/research/L7-verified-data-survey.md) | Repo research / C | GT3788VA 11-blade compressor, 13-blade turbine | 2026-11-14 |
| 10 | [South Central Diesel GT3788VA listing](https://southcentraldiesel.com/products/garrett-04-5-10-gm-duramax-new-stock-gt3788va-turbocharger-848212-5001s) | Vendor / C | 11-blade compressor corroboration | 2026-11-14 |
| 11 | [DTIC AD0893335 turboshaft noise text](https://apps.dtic.mil/sti/tr/pdf/AD0893335.pdf) | Government training text / B | BPF = shaft rev/s × blade count | 2026-11-14 |
| 12 | [Commercial Motor, 24 Sep 1983](https://archive.commercialmotor.com/article/24th-september-1983/91/n-vehicle-n-yaxrnm-oaucoi-r-corig) | Trade publication / C | Turbo speeds 80,000–130,000 rpm | 2026-11-14 |
| 13 | [Diesel Place — turbo speed](https://www.dieselplace.com/threads/turbo-speed.64629/#post-928034) | Forum / D | ~100k rpm stock, ~120k at 20 psi (corroboration only) | 2026-11-14 |
| 14 | [Diesel Place — LLY idle setting](https://www.dieselplace.com/threads/lly-idle-setting.14945/?nested_view=1#post-339661) | Forum / D | 700–800 rpm reported idle (context only) | 2026-11-14 |
| 15 | [HAL 2019 turbocharger-compressor noise](https://hal.science/hal-02376818/document) | Academic / B | Narrowband tones at ~2×/3×/5× rotor frequency | 2026-11-14 |
| 16 | ~~JASI 2019 turbocharger structure-borne noise~~ | — | **Removed from the register: the cited URL returns 404; the 1.3–3.5 kHz band claim was not load-bearing and is not used.** | 2026-11-14 |
| 17 | [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay) | Platform docs / A | Suspended context before gesture; resume/create on click | 2026-11-14 |
| 18 | [MDN AudioContext.resume()](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume) | Platform docs / A | `resume()` promise semantics | 2026-11-14 |
| 19 | [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) | Platform docs / A | Hidden rAF stop; audio tabs exempt from throttling | 2026-11-14 |
| 20 | [Chrome WebAudio suspend/resume sample](https://googlechrome.github.io/samples/webaudio-suspend-resume/index.html) | Platform sample / A | Suspend on hidden, resume on visible | 2026-11-14 |
| 21 | [WebKit — New video policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/) | Platform docs / A | User-gesture definition (media, not Web Audio) | 2026-11-14 |
| 22 | [W3C Audio Session editor's draft](https://w3c.github.io/audio-session/) | Standards / A (draft) | `playback` / `ambient` session types | 2026-11-14 |
| 23 | [MDN AudioSession](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession) | Platform docs / A (experimental) | API shape, limited availability | 2026-11-14 |
| 24 | [Guidonica ADR-0027](https://github.com/Hand-Lock/guidonica/blob/main/docs/adr/0027-ios-silent-mode-dynamic-audio-session.md) | Third-party implementation note / D | WebKit ambient category vs silent switch (unverified) | 2026-11-14 |
| 25 | [NHTSA PIP4912G](https://static.nhtsa.gov/odi/tsbs/2020/MC-10178350-9999.pdf) | GM bulletin mirror / A | LML 680 rpm idle (inapplicable to LLY) | 2026-11-14 |

## 7. Decisions this survey supports

1. **Firing-rate layer:** V8 four-stroke, `f_fire = rpm / 15`, four pulses per revolution; the
   firing order does not change the rate.
2. **Idle lope:** half-order amplitude modulation (`f_fire / 8`) plus a slow drift, anchored to
   the published 0.5-order imbalance signature; no per-cylinder simulation is claimed.
3. **Combustion/injector clatter:** band around 1.8–3.0 kHz (between the 800–2500 Hz structural band
   and the ~3.15 kHz knock band), amplitude-modulated at the firing rate.
4. **Turbo whistle:** 11-blade compressor count published; a 3rd-order tone is a reported lab
   component used as an illustrative audible whistle; the literal 11-blade BPF as a low-level
   low-passed secondary layer; the 20k–115k rpm proxy is labelled illustrative; no whistle at idle.
5. **Autoplay/lifecycle:** lazy `AudioContext` creation only in the Sound click handler; default
   off; suspend on hidden; resume only under the audible-state conditions; iOS audio session
   `playback` as progressive enhancement with a real-device acceptance check.
6. **Honesty:** no dB calibration, no LLY recording, no claim that the synthesized sound is a
   measured LLY spectrum. The UI and `docs/M9-SOUND.md` say it is an illustrative synthesis.
