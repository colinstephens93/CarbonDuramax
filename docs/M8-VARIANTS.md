# Milestone 8 — 3D Visual Part Variants (`docs/M8-VARIANTS.md`)

Project: Duramax LLY Engine Lab · Governing plan: [`docs/PLAN.md`](./PLAN.md) (Milestone 8) · Decisions: D-008, D-009, D-010, D-011, D-012, D-028, D-033, D-035, **D-038**, **D-039** · Spec: [`docs/specs/M8-part-variants.md`](./specs/M8-part-variants.md) · Measurements: [`docs/M8-MEASUREMENTS.md`](./M8-MEASUREMENTS.md) · Published survey: [`docs/research/M8-variant-references.md`](./research/M8-variant-references.md) · Prior catalog record: [`docs/M6-PARTS.md`](./M6-PARTS.md)

Milestone 8 activates `PartVariant.modelPath` and `PartVariant.explodeVectorMm` (`src/core/interfaces.ts`, frozen D-010 contract) for the five modified catalog entries whose upgrade has an honest 3D geometry signature — **superseding Milestone 6's historical non-goal** (*"every variant's `modelPath` stays `null`; selecting a variant changes numbers, not geometry"* in [`docs/M6-PARTS.md`](./M6-PARTS.md)). Stock selections keep `modelPath: null` and `explodeVectorMm: [0, 0, 0]`, rendering the exact shipped scene; restoring every slot to stock restores the Milestone 7 scene without geometry, lighting, or performance-model drift.

---

## 1. Variant Dictionary (Spec §§2, 3.2)

Exactly five entries in [`catalog/modified.json`](../catalog/modified.json) carry non-null `modelPath` values (`public/<modelPath>`). The other 19 entries in the 24-entry merged catalog (12 stock + 7 modified) retain `modelPath: null` and `explodeVectorMm: [0, 0, 0]`. Every entry's `provenance` remains `"illustrative"`, and all performance parameters, compatibility rules, and generic tier names from Milestone 6 are unchanged.

| Catalog Entry `id` | Slot (`slotId`) | Display Name | `modelPath` (`public/<modelPath>`) | `explodeVectorMm` (`e = 1.0`) | Asset Class | Replaces / Attaches To | Shipped Tris / Cap | Materials (`≤ 4`) |
| --- | --- | --- | --- | --- | --- | --- | ---: | ---: |
| `turbo_large` | `turbo` | Large Variable-Geometry Turbo Upgrade | `models/variants/turbo_unit_engine_large.glb` | `[0, 0, 260]` | Scene-placed | Replaces exterior shell `turbo` child index `3` (`turbo_unit`, `2,056` tris); mates to stock RH/LH up-pipes, downpipe (or `exhaust_4in`), intake (or `intake_highflow`), and `boostPipe` | `3,204 / 3,600` | `3` (cast iron, steel, aluminum) |
| `intake_highflow` | `intake` | High-Flow Cold-Air Intake | `models/variants/intake_tract_engine_highflow.glb` | `[0, -260, 150]` | Scene-placed | Replaces whole exterior shell `intake` group (`intake_tract`, `5,740` tris) from compressor inlet to the documented airbox service point (`resonator` stays) | `2,560 / 2,600` | `4` (polished aluminum, black silicone, dark filter media, steel) |
| `exhaust_4in` | `exhaust` | 4-Inch Turbo-Back Exhaust System | `models/variants/exhaust_system_engine_4inch.glb` | `[-320, 0, 0]` | Scene-placed | Replaces exterior shell `turbo` child index `2` (`turbo_downpipe`, `560` tris) at the shared turbine-outlet flange | `2,436 / 2,800` | `2` (stainless steel, heat-tinted stainless) |
| `intercooler_upgraded` | `intercooler` | Upgraded Bar-and-Plate Intercooler | `models/variants/intercooler_core_engine_upgraded.glb` | `[0, 260, 0]` | Scene-placed | Attaches at the documented `boostPipe` termination service point on the LH side (`[374.6, 474.8, 146.6] mm`; shipped shell has no stock intercooler core) | `1,520 / 1,800` | `3` (brushed aluminum, dark powder-coated aluminum, black silicone) |
| `pistons_lowcomp` | `pistons` | Low-Compression Forged Pistons (16.5:1) | `models/variants/rot_piston_c1_lowcomp.glb` | `[0, 0, 0]` *(uses M4 internal explode)* | Part-local | Swaps per-cylinder instanced piston batches (`×8` cylinders: `7` standard + `1` firing) in the internal V8 assembly (`4,832 → 3,968` tris/cyl) | `3,968 / 5,200` | `3` (forged crown/skirt aluminum, dark ring pack, steel wrist pin) |

---

## 2. Interface Datum Register (Spec §§3.2, 12.1)

Every scene-placed model (V1–V4) embeds named empty nodes (`if_<name>`, no mesh) at its connection or service datums. Asset tests (`src/assets/variantAssets.test.ts`) convert glTF file translations to project millimetres via `p_mm = (1000·g_x, -1000·g_z, 1000·g_y)` and assert agreement within `±1.0 mm` (shipped build script achieves `0.0000 mm` datum deviation and `0.000 mm` nearest mesh-vertex contact across all 9 marker instances).

| Marker Node Name | Used By Model(s) | Project Coordinates `[X, Y, Z]` (mm) | Mating Face Normal (Unit Vector) | Datum Status | Shell Source & Pre-Build Distance Verification (Spec §12.1) |
| --- | --- | --- | --- | --- | --- |
| `if_turbine_inlet_rh` | V1 (`turbo_unit_engine_large`) | `[-137.6, -84.1, 340.6]` | Angled `≈24–27°` off radial (`r = 44 mm` flange) | **Stock contact vertex** | Registered shell `turbo` child `0` (RH-bank up-pipe top flange); `0.028–0.052 mm` to nearest shell contact vertex (`2.50 mm` stock flange gap) |
| `if_turbine_inlet_lh` | V1 (`turbo_unit_engine_large`) | `[-137.6, 46.4, 356.8]` | Angled `≈24–27°` off radial (`r = 44 mm` flange) | **Stock contact vertex** | Registered shell `turbo` child `1` (LH-bank up-pipe top flange, `55.7 mm` from V1 rotor axis); `0.028–0.052 mm` to nearest shell contact vertex (`3.17 mm` stock flange gap) |
| `if_turbine_outlet` | V1 (`turbo_unit_engine_large`), V3 (`exhaust_system_engine_4inch`) | `[-146.2, -59.2, 373.3]` | `(-0.782, -0.247, -0.572)` *(shared between V1 & V3 `r = 52 mm` flanges)* | **Stock contact vertex** | Registered shell `turbo` child `3` turbine outlet / child `2` downpipe mouth; `0.028–0.052 mm` to nearest shell contact vertex (`16.20 mm` stock downpipe gap) |
| `if_compressor_inlet` | V1 (`turbo_unit_engine_large`), V2 (`intake_tract_engine_highflow`) | `[13.2, 22.6, 453.6]` | `(0.7382, -0.6722, -0.0571)` *(normalized first tangent of V2 path)* | **Stock contact vertex** | Registered shell `turbo` child `3` compressor bell / `intake` tract turbo-inlet mouth; `0.028–0.052 mm` to nearest shell contact vertex (`1.84 mm` stock inlet gap) |
| `if_compressor_outlet` | V1 (`turbo_unit_engine_large`) | `[36.5, 56.1, 419.2]` | `(0.973, 0.165, 0.180)` *(kept mostly `+X` inside `X ≤ +50 mm` envelope)* | **Stock contact vertex** | Registered shell `turbo` child `3` compressor discharge elbow / `boostPipe` inlet; `0.028–0.052 mm` to nearest shell contact vertex |
| `if_airbox_mount` | V2 (`intake_tract_engine_highflow`) | `[587.4, -510.5, 371.9]` | `(0.8828, -0.4414, -0.1605)` *(filter cone axis pointing outboard)* | **Documented service point** *(not a mechanical contact)* | Display datum at the outboard airbox end of the stock `intake` tract (`17.83 mm` from nearest shell vertex; stock vehicle airbox is unmodeled; fixed at prototype stage, not cluster-derived) |
| `if_hot_side_inlet` | V4 (`intercooler_core_engine_upgraded`) | `[374.6, 474.8, 146.6]` | `(0, +1, 0)` *(into `+Y` then `-X` hot-side adapter)* | **Documented service point** *(not a mechanical contact)* | Display datum at the far termination flange of the stock `boostPipe` group (`31.39 mm` from nearest `boostPipe` vertex; stock vehicle intercooler is unmodeled; fixed at prototype stage, not cluster-derived) |

*(V5 `rot_piston_c1_lowcomp.glb` is part-local and carries no `if_*` empty nodes; its datum is the wrist-pin pivot at `(0, 0, 0)`, verified within `1e-6 m`.)*

---

## 3. Pinned `assets-src/variant_dimensions.json` Key Table (197 Keys)

[`assets-src/blender/build_variants.py`](../assets-src/blender/build_variants.py) reads **zero hard-coded interface or pinned dimensions** — every coordinate, normal, radius, path control point, envelope limit, and piston crown coordinate below is read from [`assets-src/variant_dimensions.json`](../assets-src/variant_dimensions.json) and pinned as an exact literal map in `src/assets/variantAssets.test.ts` (Test 6).

### 3.1 Interface Datums, Mating Normals & Global Floor Margins (35 keys)

| Key | Value | Key | Value | Key | Value |
| --- | ---: | --- | ---: | --- | ---: |
| `ifTurbineInletRhXMm` | `-137.6` | `ifTurboCompressorInletYMm` | `22.6` | `compressorInletNormalX` | `0.7382` |
| `ifTurbineInletRhYMm` | `-84.1` | `ifTurboCompressorInletZMm` | `453.6` | `compressorInletNormalY` | `-0.6722` |
| `ifTurbineInletRhZMm` | `340.6` | `ifTurboCompressorOutletXMm` | `36.5` | `compressorInletNormalZ` | `-0.0571` |
| `ifTurbineInletLhXMm` | `-137.6` | `ifTurboCompressorOutletYMm` | `56.1` | `compressorOutletNormalX` | `0.973` |
| `ifTurbineInletLhYMm` | `46.4` | `ifTurboCompressorOutletZMm` | `419.2` | `compressorOutletNormalY` | `0.165` |
| `ifTurbineInletLhZMm` | `356.8` | `ifIntakeAirboxMountXMm` | `587.4` | `compressorOutletNormalZ` | `0.18` |
| `ifTurbineOutletXMm` | `-146.2` | `ifIntakeAirboxMountYMm` | `-510.5` | `intakeFilterAxisX` | `0.8828` |
| `ifTurbineOutletYMm` | `-59.2` | `ifIntakeAirboxMountZMm` | `371.9` | `intakeFilterAxisY` | `-0.4414` |
| `ifTurbineOutletZMm` | `373.3` | `ifIntercoolerHotSideInletXMm` | `374.6` | `intakeFilterAxisZ` | `-0.1605` |
| `ifTurboCompressorInletXMm` | `13.2` | `ifIntercoolerHotSideInletYMm` | `474.8` | `studioFloorZMm` | `-245` |
| `turbineOutletNormalX` | `-0.782` | `ifIntercoolerHotSideInletZMm` | `146.6` | `externalMinZLimitMm` | `-225` |
| `turbineOutletNormalY` | `-0.247` | `turbineOutletNormalZ` | `-0.572` | | |

### 3.2 V1 — Large VGT Turbo Dimensions & Envelope (36 keys)

| Key | Value (mm) | Key | Value (mm) | Key | Value (mm) |
| --- | ---: | --- | ---: | --- | ---: |
| `turboRotorAxisYMm` | `5` | `turboChraInnerRadiusMm` | `42` | `turboActuatorDiameterMm` | `60` |
| `turboRotorAxisZMm` | `394` | `turboChraOuterRadiusMm` | `46` | `turboActuatorLengthMm` | `80` |
| `turboTurbineHousingXMinMm` | `-152` | `turboOilFeedDiameterMm` | `12` | `turboActuatorCenterXMm` | `-120` |
| `turboTurbineHousingXMaxMm` | `-88` | `turboOilDrainDiameterMm` | `24` | `turboActuatorCenterYMm` | `50` |
| `turboTurbineHousingOuterRadiusMm` | `117` | `turboCompressorHousingXMinMm` | `-60` | `turboActuatorCenterZMm` | `500` |
| `turboTurbineHousingRearNeckRadiusMm` | `54` | `turboCompressorHousingXMaxMm` | `16` | `turboActuatorRodDiameterMm` | `8` |
| `turboUpPipeNozzleRadiusMm` | `40` | `turboCompressorHousingOuterRadiusMm` | `131` | `turboEnvXMinMm` | `-180` |
| `turboUpPipeFlangeRadiusMm` | `44` | `turboCompressorInletBellRadiusMm` | `44` | `turboEnvXMaxMm` | `50` |
| `turboFlangeThicknessMm` | `12` | `turboCompressorInletFlangeRadiusMm` | `48` | `turboEnvYMinMm` | `-135` |
| `turboChraXMinMm` | `-92` | `turboCompressorOutletElbowRadiusMm` | `38` | `turboEnvYMaxMm` | `150` |
| `turboChraXMaxMm` | `-58` | `turboCompressorOutletFlangeRadiusMm` | `44` | `turboEnvZMinMm` | `260` |
| `turboTurbineOutletNeckRadiusMm` | `45` | `turboTurbineOutletFlangeRadiusMm` | `52` | `turboEnvZMaxMm` | `540` |

### 3.3 V2 — High-Flow Intake Dimensions, 9-Point Centreline & Envelope (43 keys)

| Key | Value (mm) | Key | Value (mm) | Key | Value (mm) |
| --- | ---: | --- | ---: | --- | ---: |
| `intakeTubeOuterDiameterMm` | `101.6` | `intakePathP1XMm` | `46.42` | `intakePathP5ZMm` | `482.4` |
| `intakeTubeOuterRadiusMm` | `50.8` | `intakePathP1YMm` | `-7.65` | `intakePathP6XMm` | `539.1` |
| `intakeTubeStartOffsetMm` | `6` | `intakePathP1ZMm` | `451.03` | `intakePathP6YMm` | `-450.7` |
| `intakeCouplerOuterDiameterMm` | `116` | `intakePathP2XMm` | `84.11` | `intakePathP6ZMm` | `396.5` |
| `intakeCouplerLengthMm` | `60` | `intakePathP2YMm` | `-14.51` | `intakePathP7XMm` | `547.67` |
| `intakeClampOuterDiameterMm` | `120` | `intakePathP2ZMm` | `427.95` | `intakePathP7YMm` | `-490.64` |
| `intakeClampWidthMm` | `12` | `intakePathP3XMm` | `136.84` | `intakePathP7ZMm` | `379.12` |
| `intakeFilterBaseDiameterMm` | `160` | `intakePathP3YMm` | `-48.58` | `intakePathP8XMm` | `587.4` |
| `intakeFilterTipDiameterMm` | `100` | `intakePathP3ZMm` | `425.14` | `intakePathP8YMm` | `-510.5` |
| `intakeFilterLengthMm` | `190` | `intakePathP4XMm` | `425.94` | `intakePathP8ZMm` | `371.9` |
| `intakePathP0XMm` | `13.2` | `intakePathP4YMm` | `-254.77` | `intakeEnvXMinMm` | `-20` |
| `intakePathP0YMm` | `22.6` | `intakePathP4ZMm` | `491.77` | `intakeEnvXMaxMm` | `800` |
| `intakePathP0ZMm` | `453.6` | `intakePathP5XMm` | `531.1` | `intakeEnvYMinMm` | `-650` |
| | | `intakePathP5YMm` | `-358.5` | `intakeEnvYMaxMm` | `100` |
| | | `intakeEnvZMinMm` | `280` | `intakeEnvZMaxMm` | `560` |

### 3.4 V3 — 4-Inch Exhaust Dimensions, 9-Point Path & Envelope (46 keys)

| Key | Value (mm) | Key | Value (mm) | Key | Value (mm) |
| --- | ---: | --- | ---: | --- | ---: |
| `exhaustInletFlangeRadiusMm` | `52` | `exhaustPathP0ZMm` | `373.3` | `exhaustPathP5ZMm` | `55` |
| `exhaustStubOuterRadiusMm` | `38.1` | `exhaustPathP1XMm` | `-193.1` | `exhaustPathP6XMm` | `-500` |
| `exhaustPipeOuterDiameterMm` | `101.6` | `exhaustPathP1YMm` | `-74` | `exhaustPathP6YMm` | `-108` |
| `exhaustPipeOuterRadiusMm` | `50.8` | `exhaustPathP1ZMm` | `339` | `exhaustPathP6ZMm` | `30` |
| `exhaustMufflerOuterDiameterMm` | `220` | `exhaustPathP2XMm` | `-250` | `exhaustPathP7XMm` | `-560` |
| `exhaustMufflerLengthMm` | `380` | `exhaustPathP2YMm` | `-88` | `exhaustPathP7YMm` | `-108` |
| `exhaustMufflerXStartMm` | `-570` | `exhaustPathP2ZMm` | `270` | `exhaustPathP7ZMm` | `25` |
| `exhaustMufflerXEndMm` | `-950` | `exhaustPathP3XMm` | `-310` | `exhaustPathP8XMm` | `-575` |
| `exhaustMufflerAxisYMm` | `-108` | `exhaustPathP3YMm` | `-98` | `exhaustPathP8YMm` | `-108` |
| `exhaustMufflerAxisZMm` | `25` | `exhaustPathP3ZMm` | `190` | `exhaustPathP8ZMm` | `25` |
| `exhaustTailEndXMm` | `-1035` | `exhaustPathP4XMm` | `-370` | `exhaustEnvXMinMm` | `-1100` |
| `exhaustTailEndZMm` | `-25` | `exhaustPathP4YMm` | `-105` | `exhaustEnvXMaxMm` | `-110` |
| `exhaustTipFlareOuterRadiusMm` | `56` | `exhaustPathP4ZMm` | `110` | `exhaustEnvYMinMm` | `-300` |
| `exhaustPathP0XMm` | `-146.2` | `exhaustPathP5XMm` | `-430` | `exhaustEnvYMaxMm` | `60` |
| `exhaustPathP0YMm` | `-59.2` | `exhaustPathP5YMm` | `-108` | `exhaustEnvZMinMm` | `-160` |
| | | | | `exhaustEnvZMaxMm` | `470` |

### 3.5 V4 — Upgraded Intercooler Dimensions & Envelope (24 keys)

| Key | Value (mm) | Key | Value (mm) | Key | Value (mm) |
| --- | ---: | --- | ---: | --- | ---: |
| `intercoolerPipeOuterDiameterMm` | `76.2` | `intercoolerTankYMinMm` | `545` | `intercoolerCoreZMinMm` | `-10` |
| `intercoolerPipeOuterRadiusMm` | `38.1` | `intercoolerTankYMaxMm` | `655` | `intercoolerCoreZMaxMm` | `310` |
| `intercoolerCouplerOuterDiameterMm` | `84` | `intercoolerTankZMinMm` | `-20` | `intercoolerEnvXMinMm` | `60` |
| `intercoolerCouplerOuterRadiusMm` | `42` | `intercoolerTankZMaxMm` | `320` | `intercoolerEnvXMaxMm` | `700` |
| `intercoolerNearTankXMinMm` | `90` | `intercoolerCoreXMinMm` | `150` | `intercoolerEnvYMinMm` | `430` |
| `intercoolerNearTankXMaxMm` | `150` | `intercoolerCoreXMaxMm` | `610` | `intercoolerEnvYMaxMm` | `720` |
| `intercoolerFarTankXMinMm` | `610` | `intercoolerCoreYMinMm` | `555` | `intercoolerEnvZMinMm` | `-60` |
| `intercoolerFarTankXMaxMm` | `670` | `intercoolerCoreYMaxMm` | `645` | `intercoolerEnvZMaxMm` | `360` |

### 3.6 V5 — Low-Compression Piston Crown Profile & Dish Volumes (13 keys)

| Key | Value | Unit | Meaning |
| --- | ---: | --- | --- |
| `pistonDishDepthMm` | `16.2957` | `mm` | Dish floor depth `d` below the `+49.80 mm` crown plane (`+2.850 mm` vs stock `13.446 mm`) |
| `pistonDishFlatFloorRadiusMm` | `16.456` | `mm` | `0.32 × r_out` flat dish floor radius |
| `pistonDishFlatFloorZMm` | `33.5043` | `mm` | Dish floor height `49.8000 − 16.2957` |
| `pistonDishShoulderRadiusMm` | `23.1413` | `mm` | `0.45 × r_out` dish bowl shoulder radius |
| `pistonDishShoulderZMm` | `36.4375` | `mm` | Shoulder height `49.8000 − 0.82·d` |
| `pistonDishLipRadiusMm` | `28.798` | `mm` | `0.56 × r_out` bowl lip radius |
| `pistonDishLipZMm` | `48.4963` | `mm` | Lip height `49.8000 − 0.08·d` |
| `pistonDishMouthRadiusMm` | `29.8265` | `mm` | Crown land start `lip + 0.02·r_out` at `z = 49.8000 mm` |
| `pistonCrownOuterRadiusMm` | `51.425` | `mm` | Bore-fit outer radius `0.5 × (103.00 − 0.15)` (`OD 102.85 mm`) |
| `pistonCrownHeightMm` | `49.8` | `mm` | Stock MAHLE OE compression height above wrist-pin pivot (D-035) |
| `pistonStockDishVolumeMm3` | `29586.5` | `mm³` | Revolved volume of stock omega bowl (`29.5865 cm³`) |
| `pistonVariantDishVolumeMm3` | `32816.5` | `mm³` | Revolved volume of open flat-floor dish (`32.8165 cm³`; `Δ = +3.2300 cm³`) |
| `pistonCrImpliedDeltaVolumeMm3` | `3225.4` | `mm³` | Swept-volume arithmetic `Vd/15.5 − Vd/16.5` (`3.2254 cm³`; `|Δ − target| ≤ 50 mm³`) |

---

## 4. Authoring Rules (Spec §3.1, D-011 / D-038)

| Rule | Part-Local Class (`rot_piston_c1_lowcomp.glb` + 10 stock GLBs) | Scene-Placed Class (`turbo_unit_engine_large.glb`, `intake_tract_engine_highflow.glb`, `exhaust_system_engine_4inch.glb`, `intercooler_core_engine_upgraded.glb`) |
| --- | --- | --- |
| **Blender coordinate frame** | `+X` crank axis, `+Y` bank-plane `W` (valley), `+Z` bore axis; object origin at moving part's rotation/slide pivot (`(0,0,0)` wrist pin) | **Master project frame:** `+X` front/crank axis, `+Y` vehicle LH, `+Z` up; geometry authored in metres at its final mounted position; **no pivot, no animation** |
| **glTF 2.0 Y-up export & wrapper** | `export_yup=True` (`R_x(-90°)`); `wrapInPartLocalFrame` (`rotation.x = +Math.PI / 2`) restores part-local space once | `export_yup=True` (`R_x(-90°)`); `wrapInPartLocalFrame` (`rotation.x = +Math.PI / 2`) restores project space once; attached at scene root with identity rotation/scale and `explodeVectorMm × e / 1000` translation |
| **Contract root node & markers** | `<system>_<part>_<instance>_<variant>` (`rot_piston_c1_lowcomp`); no `if_*` empties | Single contract mesh node named after the file (`<stem>`) + required `if_*` empty nodes (`PLAIN_AXES` empties carrying exact glTF `translation`, zero meshes) |
| **Materials, textures & compression** | Untextured PBR (`MeshStandardMaterial`, `≤ 4` materials), **no images, no textures**, uncompressed GLB (Draco/meshopt/KTX2 deferred) | Untextured PBR (`MeshStandardMaterial`, `≤ 4` materials), **no images, no textures**, uncompressed GLB (zero texture VRAM delta; `castShadow = false`, `receiveShadow = false`) |
| **Normals & smoothing** | Shade smooth with `38°` edge-crease split (`finalize_bmesh_object`) | Shade smooth with `38°` edge-crease split (`finalize_bmesh_object`); V5 uses `48` circumferential segments (mesh-resolution choice vs stock `56`, no valve-relief pockets) |

---

## 5. Exterior Shell Split Record (Spec §§3.4, 6.2, 12.1)

The registered exterior shell (`public/Duramax_LLY_2005_66L_V8.glb`, **frozen byte-identical**) contains twelve named top-level group nodes (`acComp`, `alternator`, `blockPan`, `boostPipe`, `cp3Fuel`, `egrSystem`, `electronics`, `fan`, `injectors`, `intake`, `resonator`, `turbo`), while **every child node below those twelve top-level groups is unnamed** in the GLB. Consequently, [`src/renderer/partVariants.ts`](../src/renderer/partVariants.ts) (`EXTERIOR_PRESERVED_SUBTREES`) and [`src/renderer/exteriorLoader.ts`](../src/renderer/exteriorLoader.ts) address sub-parts of `turbo` by **file-order direct-child index**, pinned by `src/renderer/partVariants.test.ts` against the parsed shell GLB so any future shell replacement fails loudly:

| Bucket / Preserved Subtree `id` | Shell Group & Child Selection | Raw Triangles | Post-Dedupe Merged Meshes | Hidden When Slot Variant Active |
| --- | --- | ---: | ---: | --- |
| `turbo_unit` | `turbo` direct child **index `3`** (stock GT3788VA turbocharger unit; children `0` & `1` are RH/LH up-pipes at `384` tris each and stay in the global merge) | `2,056` | `6` | `turbo` → `turbo_large` |
| `turbo_downpipe` | `turbo` direct child **index `2`** (stock crushed-oval turbo downpipe) | `560` | `1` | `exhaust` → `exhaust_4in` |
| `intake_tract` | Whole top-level `intake` group (`14` primitives; `resonator` top-level group is separate and stays in global merge) | `5,740` | `5` | `intake` → `intake_highflow` |
| *(Global exterior merge)* | Remaining 10 top-level groups + `turbo` children `0` & `1` | `23,040` | `21` | Never hidden individually (follows `Exterior` / `X-Ray` toggle) |
| **Total Registered Shell** | **Unchanged geometry (`33,187` verts)** | **`31,396`** | **`33`** *(was `22`; `+11` main-pass calls)* | All `3` preserved groups visible when all external slots are stock |

All `33` exterior meshes share the exact same `22` deduplicated `THREE.MeshStandardMaterial` instances and `4` textures as Milestone 3–7 (`0 MiB` VRAM delta, `castShadow = false`, `receiveShadow = false`, registered once in the clippable, X-Ray, and disposal sets).

---

## 6. Explicit Internal-Parts Position (Spec §3.5, D-038)

**Decision rule.** An internal catalog part gets a 3D visual variant in Milestone 8 only if:
1. **(a)** its catalog change corresponds to a **visible geometry change**,
2. **(b)** the shipped scene already contains the part's swappable geometry (pivot-placed model + mount), and
3. **(c)** a truthful illustrative shape can be derived from the catalog parameter or published data.

Failing **(a)** or **(c)** would fabricate a visible difference; failing **(b)** would add brand-new engine geometry rather than a variant swap.

| Slot / entry | Catalog change | In shipped 3D scene? | Visible in exploded/cutaway? | M8 position | Reason |
| --- | --- | --- | --- | --- | --- |
| pistons / `pistons_lowcomp` | `compressionRatio` 17.5 → 16.5 | yes — stock piston GLB, instanced ×8 | yes | **IN** | The CR change is a clearance-volume change (ΔVc = 3.23 cm³, §3.2 V5); a dished/forged crown is the visible consequence and is derivable from the catalog parameter. It is the one internal part whose visual signature is honest. |
| rods / `rods_forged` | `performanceParams: {}` | yes — stock conrod GLB, instanced ×8 | yes | **OUT** | The shipped illustrative rod is already a forged H-beam (`assets-src/PROVENANCE.md`); the upgrade's difference is material/strength, which the catalog explicitly models as *no numeric change*. A visual variant would invent a shape difference the data does not support. |
| injectors / `injectors_plus30` | `maxFuelMm3` 120 → 156 | yes — cylinder-1 injector GLB, instanced ×8 (and a separate `injectors` group in the shell) | yes | **OUT** | +30% flow is nozzle work; the shipped injector's nozzle is not hole-modeled (M7 §2.4 records this) and the injector body is generic. A truthful external difference does not exist in the modeled geometry; adding one would fabricate. |
| cp3 / `cp3_stroker` | `flowBaseKgH`/`flowSlope` up, `maxRailPsi` unchanged | only as part of the shell's merged `cp3Fuel` group — **no pivot-placed model** | only through the shell/x-ray | **OUT** | The stroker's difference is internal cam-ring stroke; the external housing is identical. There is also nothing swappable in the renderer for this slot. |
| camshaft / `cam_performance` | `veFactor` 1.04 | **no camshaft geometry exists** (valvetrain starts at the lifters) | would be, if modeled | **OUT** | Not a variant: it would be new geometry. The visual signature (lobe lift/duration) is also unpublished (L7 §4: timing/duration/LSA not published); modeling a performance lobe profile would encode blocked data. Deferred candidate (OPEN_ITEMS). |
| heads / `heads_ported` | `flowFactor` 1.08 | yes — stock head section GLB, instanced ×8 | yes | **OUT** | Porting changes internal port geometry; the shipped head section models deck, seats, guides, spring seats, injector bore, and rocker shaft, but **not ports**, and LLY port shapes are unpublished (L7 §10). A "ported" visual would be fabricated. Deferred candidate (OPEN_ITEMS). |

- **`tune` & `fuelRail`:** `tune` (`tune_street`, `tune_race`) is an ECM software calibration and `fuelRail` is a stock-only slot whose transient rail dynamics lie outside the steady-state model; neither has a 3D visual variant (unchanged from Milestone 6).
- **Deferred candidates:** The five excluded internal slots (`rods`, `injectors`, `cp3`, `camshaft`, `heads`) are recorded in [`docs/OPEN_ITEMS.md`](./OPEN_ITEMS.md) ("Deferred candidates") and [`docs/DECISIONS.md`](./DECISIONS.md) (**D-038**). If a future milestone adds underlying port/camshaft geometry or published data, `engineScene`'s pre-built `PistonBatchSet` swap path provides the instanced-swap template.

---

## 7. Provenance & Recorded-But-Not-Adopted Register (Spec §3.6)

Published anchors come from [`docs/research/M8-variant-references.md`](./research/M8-variant-references.md) (researched 2026-11-14; reliability grades `A` GM literature, `B` established diesel publication / OE maker, `C` specialist vendor fitment spec / CARB EO, `D` forum / marketing claim) plus [`docs/research/L7-verified-data-survey.md`](./research/L7-verified-data-survey.md) for stock LLY baselines.

### 7.1 Per-Model Provenance Split

| Model | Published Anchors Adopted (Grade & Survey Citation) | Illustrative / Not Publicly Available |
| --- | --- | --- |
| **V1** `turbo_unit_engine_large.glb` | Drop-in stock-footprint VGT form with canister VGT actuator; upgrade-class leading wheel diameters **61 / 63 / 65 / 68 mm** compressor and **66–66.5 mm** turbine (Calibrated Power Stealth STR/Mach 1, Fleece VNT Cheetah, BD Screamer, Industrial Injection XR/XR2, JZ 68 mm — [wcfab.com](https://www.wcfab.com/i-31645784-2004-5-2010-lly-lbz-lmm-duramaxstealth-str-61-67-drop-in-vvt-turbo.html), [wcfab.com Cheetah](https://www.wcfab.com/i-31644655-2004-5-2010-lly-lbz-lmm-duramax-fleece-63mm-drop-in-vvt-cheetah-turbo.html), [lethalperformance.com](https://www.lethalperformance.com/products/bd-diesel-bd-duramax-screamer-turbo-chevy-2004-5-2010-lly-lbz-lmm-1045840-custom), **grade C**, survey §1); stock Garrett GT3788VA `62.8/88 mm` comp & `71.3/65.7 mm` turb baseline (L7 §11, **grade B/C**) | All housing/CHRA/elbow/flange/actuator dimensions (`r = 117 mm` turbine, `r = 131 mm` compressor cover); full aftermarket wheel inducer/exducer pairs, cover OD, and vane-ring dimensions are **NOT PUBLICLY AVAILABLE**; stock `14.4–15 mm` vs aftermarket `"11 mm"` vane-height claims are unreconciled and unmodeled |
| **V2** `intake_tract_engine_highflow.glb` | **Ø101.6 mm (`4.00 in`)** turbo-inlet diameter all the way to the compressor flange (PPE Zilla LLY `115010070` — [jegs.com](https://www.jegs.com/i/ppe-power-795-115010070-115010070-turbo-inlet-2004-5-2005-gm-6-6l-duramax-lly-zilla-carbon-fiber-forged), **grade C**, survey §3); replacement media filter context (S&B KF-1035 / 75-5080, Banks 42135, aFe 75-80612 CARB EO `D-550-4` — [dmaxstore.com](https://dmaxstore.com/products/s-b-replacement-filter-2001-2010-lb7-lly-lbz-lmm), [sbfilters.com](https://sbfilters.com/products/2006-2007-duramax-lly-lbz-6-6-intake-75-5080), **grade C**) | 9-point centreline path (derived from stock shell `intake` corridor), coupler/clamp sizing (`Ø116 / Ø120 mm`), round conical open-element filter (`Ø160 → Ø100 × 190 mm`, `16` pleats), and `if_airbox_mount` service point; intermediate kit tube lengths/bends are **NOT PUBLICLY AVAILABLE** |
| **V3** `exhaust_system_engine_4inch.glb` | **4 in = 101.6 mm** definitional tubing OD; real LLY kit layout using a **3-inch (`76.2 mm`) round downpipe stub** transitioning into **4-inch (`101.6 mm`)** tubing with a straight-through center-in/out muffler and rolled stainless tip (MBRP `S6000AL`, Diamond Eye `K4120A` + `321056` 3" TDP, Flo-Pro `FPR 820` — [mbrp.com](https://www.mbrp.com/products/s6000al), [lmperformance.com](https://www.lmperformance.com/1293637/k4120a-diamond-eye-kit-4in-cbsgl-w-tdp-al-04-05-chevy-gmc-66l-duramax-2500-3500.html), [xtremediesel.com](https://www.xtremediesel.com/mbrp-universal-4-quiet-tone-muffler), **grade C**, survey §2) | 9-point bend coordinates, representative section truncation (`X = -1,092.6 mm`), compact display muffler length (`Ø220 × 380 mm` vs `24"/30"` vehicle mufflers), tip flare (`r = 56 mm`), and wall thickness |
| **V4** `intercooler_core_engine_upgraded.glb` | All-aluminum **bar-and-plate core**, welded **cast-aluminum end tanks**, and **Ø76.2 mm (`3.00 in`)** inlet/outlet necks (Mishimoto `MMINT-DMAX-01`, PPE `115040100` CARB EO `D-701-26`, CSF `6007/6024` — [xtremediesel.com](https://www.xtremediesel.com/mishimoto-mmint-dmax-01-intercooler), [ppepower.com](https://ppepower.com/products/high-flow-performance-studded-intercooler-gm), [ww2.arb.ca.gov EO D-701-26](https://ww2.arb.ca.gov/sites/default/files/aftermarket/devices/eo/d-701-26.pdf), **grade C**, survey §4) | Compact display core/tank envelope (`460 × 80 × 320 mm` core), `18` fin strips, `3` brackets, `+Y` then `-X` hot-side adapter packaging, and `if_hot_side_inlet` service point |
| **V5** `rot_piston_c1_lowcomp.glb` | Catalog `16.5:1` CR; published 16.5-class LLY piston existence (**Mahle `930029875`** `16.5 CR`, `-41.8 cc`, `1.358 in` pin — [fidanza.com](https://fidanza.com/mahle-ms-piston-set-duramax-4-075in-bore-3-898in-stk-6-417in-rod-1-358-pin-41-8cc-16-5-cr-set-of-8/); **Mahle `930036055`** `16.6/16.7 CR`, `4.055 in` bore, `1.951 in` CH, M142/Grafal — [lmperformance.com](https://www.lmperformance.com/1258318/930036055-mahle-ms-piston-set-duramax-4055in-bore-3898in-stk-6417in-rod-1358-pin-407cc-167-cr-set-of-8.html); Diamond `2618` forged — [diamondracing.net](https://www.diamondracing.net/diesel-pistons/), **grade C**, survey §5); stock `103 mm` bore, `99 mm` stroke, `49.8 mm` CH, `34.5 mm` pin (D-035); derived `ΔVc = +3.2254 cm³` (`17.5 → 16.5`) | Open flat-floor dish profile (`d = 16.2957 mm`, `r = 16.456 / 23.1413 / 28.798 / 29.8265 mm`), ring-groove geometry, weight, and `48`-segment mesh resolution; exact OE/aftermarket bowl profile drawings are **NOT PUBLICLY AVAILABLE** |

### 7.2 Recorded-But-Not-Adopted Register (Spec §3.6, Verbatim Discipline)

- **True-scale intercooler envelope** — Mishimoto `MMINT-DMAX-01` core `971.7 × 479.0 × 52.1 mm`, overall `1,158 × 594 × 208 mm` (survey §4). A true-scale core at the charge-pipe service point would dominate the engine display (and place the part far outside the engine's service envelope); the model is a compact representative core with the published construction and `3"` connections. Recorded so nobody "fixes" the size later.
- **Aftermarket piston compression height `1.951 in` (`49.55 mm`)** — published for the **`930036055`** `16.6/16.7`-class piston (the `16.5`-class `930029875` listing's CH is not published). Not adopted: the variant keeps the stock compression height (`49.80 mm`) and stock CR-independent crown stack because the sim's kinematics is config-driven (D-035 stack) and this is a visual drop-in; adopting a different CH would move the crown and require a config/kinematics revision, not a visual variant.
- **Aftermarket turbo wheel pairs** — only single leading diameters are published (`61 / 63 / 65 / 68 mm` compressor; `66–66.5 mm` turbine); the survey explicitly marks inducer/exducer pairs and cover dimensions `NOT PUBLICLY AVAILABLE`, so the model does not pretend to a specific wheel pair. The housing is illustrative.
- **Aftermarket piston valve-relief pockets (published depth `0.075 in` = `1.9 mm`)** — recorded, not adopted: the shipped stock piston model has **no** valve reliefs, so adding them to only the variant would show a stock-vs-modified difference the catalog does not claim (both real piston types have reliefs, and counting four `1.9 mm` pockets on top of the dish would shift CR to `≈16.24` instead of `16.5`). The variant's visible difference is strictly the CR-implied crown volume (`ΔVc = +3.2301 cm³` vs `3.2254 cm³`).
- **Exhaust muffler published size (`24"/30"` overall, `4"` center/center) and wall thickness (`"16-gauge"` ≈ `1.52 mm` single-reseller claim)** — recorded, not adopted: the `380 mm` canister is a shorter display representative inside the engine envelope and wall thickness is not modeled.
- **Intake filter absolute oval dimensions (S&B `KF-1035` `9.85" × 8.25"` base, `8.75" × 8"` top, `6.6"` height, `5.00"` flange)** — recorded, not adopted: the filter is a round conical display element (`Ø160 → Ø100 × 190 mm`); the published `4-inch` (`101.6 mm`) turbo-inlet diameter *is* adopted on V2's swept tube.

---

## 8. Known Limitations

1. **Unmodeled stock vehicle-side hardware:** The frozen exterior shell (`public/Duramax_LLY_2005_66L_V8.glb`) ends at the engine-mounted charge pipe, intake duct, and turbo downpipe — it contains **no stock intercooler core, no stock vehicle airbox, and no stock cat-back exhaust**. Modified parts for those slots appear at documented engine-side service points rather than truck-chassis installation coordinates, and stock-vs-modified 3D visual comparison on the intercooler slot is modified-only (`OPEN_ITEMS.md` watch item).
2. **Intercooler service position & free cold-side outlet:** `intercooler_core_engine_upgraded.glb` mounts at the LH `boostPipe` termination datum (`[374.6, 474.8, 146.6] mm`) rather than ahead of a truck radiator stack, and its cold-side `+Y` outlet ends in an unconnected silicone coupler because the shipped shell has no cold-side intake-bridge plumbing on that side.
3. **Open-element intake display vs. boxed LLY kits:** `intake_tract_engine_highflow.glb` renders an open-element conical filter (matching Milestone 6's catalog note *"open-element airbox"*), whereas published 2004.5–2005 LLY cold-air kits (S&B `75-5080`, Banks `42135`, aFe `75-80612`) use enclosed cold-air boxes with lids.
4. **Vertex-level non-penetration check residual risk & `90.0 mm` per-marker connection collar (`D-039`):** `build_variants.py` asserts zero non-excepted shell vertices inside each external variant's analytic solid envelope plus `≥ 2.0 mm` vertex-to-vertex clearance (`20.41–154.23 mm` across non-connected obstacle groups; `2.95–58.09 mm` across connected groups outside the mating collars). Per owner-approved deviation **D-039** ([`docs/DECISIONS.md`](./DECISIONS.md)), connected shell groups (`turbo`, `intake`, `boostPipe`) are exempted within **`90.0 mm` of each mated `if_*` marker** rather than Spec §3.3's nominal `30.0 mm` radius (`62 / 90 / 16 / 53` mouth-collar vertices fall at `30.40–88.96 mm` because `if_hot_side_inlet` sits `31.394 mm` from the nearest `boostPipe` rim vertex, the five turbo contact datums are single rim vertices on `60–90 mm` mouths, and §3.2's pinned flange/tube/coupler radii `38.1–131 mm` exceed `30 mm`). In addition, because the check tests shell **vertices** against analytic envelopes rather than full triangle-to-triangle mesh distance, a true triangle face spanning sparse shell vertices could pass closer than the vertex metric reports. For the shipped frozen shell, the `17.52 mm` minimum shell-vertex-to-envelope-surface gap on V2 (`19.92 / 71.64 / 90.66 mm` on V1/V3/V4) and visual inspection of `RF-8` and `RF-9` cover this risk; if the exterior shell GLB is ever replaced, a full triangle-level clearance sweep is the stronger method to run.
5. **Illustrative shapes throughout:** All five variant meshes are procedural `illustrative` representations (no OEM or aftermarket CAD drawings exist), surfaced explicitly in the updated on-screen disclaimer banner (*"aftermarket variant part shapes and their service positions"*).
6. **No new 3D labels or anchor shifts:** All 23 Milestone 4 HTML callout labels and visibility rules remain untouched; the exterior `Turbocharger` label continues to track the registered V-valley turbo mount for both stock and `turbo_large`.
7. **Representative 4-inch exhaust section:** `exhaust_system_engine_4inch.glb` models a `980 mm` representative downpipe + muffler + downturn tail section (`X` down to `-1,092.6 mm`) with no chassis hangers or frame brackets behind the turbine-outlet flange.
8. **External vs. internal visibility context:** External variants (`turbo_large`, `intake_highflow`, `exhaust_4in`, `intercooler_upgraded`) render only when the exterior context is shown (`Exterior` checked or `X-Ray` checked, remaining opaque when `X-Ray` ghosts the stock shell), whereas `pistons_lowcomp` renders directly inside the internal V8 assembly (visible with `Exterior` off, in exploded view `RF-10`, or in section cutaway). The Build panel's `.m8-build-note` states this rule directly beneath the slot dropdowns.
