# Asset Provenance — Milestone 2 (`public/models/` & `public/hdri/`)

Governing plan: [`docs/PLAN.md`](../docs/PLAN.md) v2.2 · Decisions: D-002, D-004, D-011, D-012, D-024, D-028 · Spec: [`docs/specs/M2-detailed-cylinder.md`](../docs/specs/M2-detailed-cylinder.md) (Revision 2)

Every model and environment lighting asset introduced in Milestone 2 is listed below with its build source, license, and verification status (`verified` vs. `illustrative`).

## Cylinder 1 Detailed Part GLBs (`public/models/`)

All 10 part GLBs are procedurally generated from [`assets-src/blender/build_cylinder1.py`](./blender/build_cylinder1.py) reading interface dimensions solely from [`assets-src/dimensions.json`](./dimensions.json) (bridged from `src/config/detailConfig.ts`, `src/config/engineConfig.ts`, and `src/config/valveConfig.ts`). License: repository source / original procedural work (no third-party mesh content).

| File | Contract Node(s) | Build Reference | Shape & Dimension Status |
| --- | --- | --- | --- |
| `public/models/rot_piston_c1_stock.glb` | `rot_piston_c1_stock` | Built from `assets-src/blender/build_cylinder1.py` + `assets-src/dimensions.json` (`boreMm`, `pistonSkirtClearanceMm`, `pistonCompressionHeightMm`, `wristPinDiameterMm`) | **Illustrative** shape (omega bowl, 3-ring pack, skirt, wrist pin); interface dimensions from placeholder/published config |
| `public/models/rot_conrod_c1_stock.glb` | `rot_conrod_c1_stock`, `rot_conrod_smallend_c1_stock` | Built from `assets-src/blender/build_cylinder1.py` + `assets-src/dimensions.json` (`rodLengthMm`, `pinJournalDiameterMm`, `wristPinDiameterMm`) | **Illustrative** shape (forged H-beam shank, split big-end cap with bolts, small-end bushing); interface dimensions from placeholder config |
| `public/models/rot_crankthrow_c1_stock.glb` | `rot_crankthrow_c1_stock`, `rot_crankpin_c1_stock` | Built from `assets-src/blender/build_cylinder1.py` + `assets-src/dimensions.json` (`crankThrowMm`, `pinJournalDiameterMm`, `crankWebThicknessMm`, `crankWebRadiusMm`) | **Illustrative** shape (two counterweighted crank webs + pin journal + main stubs); interface dimensions from placeholder config |
| `public/models/sta_head_c1_stock.glb` | `sta_head_c1_stock` | Built from `assets-src/blender/build_cylinder1.py` + `assets-src/dimensions.json` (`boreMm`, `borePitch`, `valvePairSpacingMm`, `valveRowOffsetMm`, `valveIntakeHeadMm`, `valveExhaustHeadMm`, `valveStemMm`, `valveInsetMm`, `springSeatHeightMm`, `springDiameterMm`, `rockerShaftHeightMm`, `rockerTailXOffsetMm`, `pushrodDiameterMm`, `injectorBodyMm`) | **Illustrative** architectural head section (deck block, 4 seat rings & valve guides, spring seats, injector bore, split rocker shaft & pedestals); interface dimensions from placeholder config |
| `public/models/val_valve_intake_stock.glb` | `val_valve_intake_stock`, `val_spring_intake_stock` | Built from `assets-src/blender/build_cylinder1.py` + `assets-src/dimensions.json` (`valveIntakeHeadMm`, `valveStemMm`, `valveStemLengthMm`, `valveInsetMm`, `springFreeLengthMm`, `springDiameterMm`) | **Illustrative** shape (intake poppet valve + helical coil spring with top retainer); interface dimensions from placeholder config |
| `public/models/val_valve_exhaust_stock.glb` | `val_valve_exhaust_stock`, `val_spring_exhaust_stock` | Built from `assets-src/blender/build_cylinder1.py` + `assets-src/dimensions.json` (`valveExhaustHeadMm`, `valveStemMm`, `valveStemLengthMm`, `valveInsetMm`, `springFreeLengthMm`, `springDiameterMm`) | **Illustrative** shape (exhaust poppet valve + helical coil spring with top retainer); interface dimensions from placeholder config |
| `public/models/val_pushrod_stock.glb` | `val_pushrod_stock`, `val_lifter_stock` | Built from `assets-src/blender/build_cylinder1.py` + `assets-src/dimensions.json` (`pushrodLengthMm`, `pushrodDiameterMm`) | **Illustrative** shape (ball-end tubular pushrod + roller cam follower lifter); interface dimensions from placeholder config |
| `public/models/val_rocker_stock.glb` | `val_rocker_intake_stock`, `val_rocker_exhaust_stock` | Built from `assets-src/blender/build_cylinder1.py` + `assets-src/dimensions.json` (`valveRowOffsetMm`, `rockerTailXOffsetMm`, `rockerTailValleyOffsetMm`, `injectorBodyMm`, `pushrodDiameterMm`) | **Illustrative** shape (two distinct forged rocker castings with shaft bosses, swept pad arms, pushrod cups, and lash adjusters); interface dimensions from placeholder config |
| `public/models/val_bridge_stock.glb` | `val_bridge_stock` | Built from `assets-src/blender/build_cylinder1.py` + `assets-src/dimensions.json` (`valvePairSpacingMm`, `bridgeThicknessMm`, `valveStemMm`) | **Illustrative** shape (cross-bar valve bridge with stem-tip guide skirts and >= 3 mm overlap top wear pad boss); interface dimensions from placeholder config |
| `public/models/fuel_injector_c1_stock.glb` | `fuel_injector_c1_stock` | Built from `assets-src/blender/build_cylinder1.py` + `assets-src/dimensions.json` (`injectorBodyMm`, `injectorLengthMm`) | **Illustrative** shape (common-rail steel injector body, nozzle tip, and dark polymer solenoid/connector top); interface dimensions from placeholder config |

## Non-Deployed Verification Fixture (`assets-src/fixture/`)

| File | Node(s) | Build Reference | Purpose |
| --- | --- | --- | --- |
| `assets-src/fixture/axis_fixture.glb` | `axis_fixture` | Built from `assets-src/blender/build_cylinder1.py` | **Verification fixture** (30 mm X, 60 mm Y, 90 mm Z boxes in Blender -> 30 mm X, 90 mm Y, 60 mm Z in glTF file space; checked by Test 6 in `src/assets/glbContract.test.ts`) |

## Studio Environment HDRI (`public/hdri/`)

| File | Asset Name | Source URL | License | Notes |
| --- | --- | --- | --- | --- |
| `public/hdri/studio_small_09_2k.hdr` | **Studio Small 09** (`studio_small_09`, 2k HDR) | https://polyhaven.com/a/studio_small_09 | **CC0 1.0 Universal (Public Domain)** | Indoor photography studio softbox HDRI by Sergej Majboroda (Poly Haven). Used via `RGBELoader` + `PMREMGenerator` for `scene.environment` PBR reflections/IBL only; `scene.background` remains solid `0x0b0b0d`. |
