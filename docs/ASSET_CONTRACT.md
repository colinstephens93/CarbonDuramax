# Asset Contract — Duramax LLY Engine Lab

Status: **Written in Milestone 0, proven in Milestone 2, extended in Milestone 8 (scene-placed class)** · Governing plan: [`docs/PLAN.md`](./PLAN.md) · Decisions: [`docs/DECISIONS.md`](./DECISIONS.md) D-011, D-038

Every model and every dimension follows one written contract. Better data later should be a one-line config change, not a rework.

## Contract Rules

- **Frame:** The concept set's frame is the master. Origin is the crank axis at the rear block / adapter plane; `+X` toward the front accessory drive, `+Y` vehicle left (LH), `+Z` up.
- **Axis conversion (Z-up → Y-up):** glTF is Y-up. Conversion happens once, at export, using the Blender glTF exporter's Y-up option. A reference fixture (a known 3-axis marker) is checked by a test.
- **Units:** Meters in models and in the math core; the config may record source values in mm or inches, converted on load.
- **Pivots and code-driven motion:** Every moving part's origin sits exactly on its rotation or slide axis. Code moves parts; Blender animation is not used.
- **Naming:** `<system>_<part>_<instance>_<variant>`, e.g. `rot_piston_c3_stock`, with cylinder numbers per the RH `1-3-5-7` / LH `2-4-6-8` scheme (see scene-placed root-object exception below).
- **Budgets:** Triangle, draw-call, and texture-memory limits per tier, set at Milestone 2 from measurements.
- **Compression:** meshopt or Draco for geometry, KTX2 for textures (deferred across M2–M8 because uncompressed payloads already sit comfortably inside every D-033 budget).
- **Provenance:** Each model file lists what reference it was built from and whether its shape is verified or illustrative.

## Asset Classes (D-011, D-038)

Milestone 8 extends the contract with a **scene-placed class** for externally mounted aftermarket hardware while keeping the **part-local class** (used by the 10 cylinder-1 stock GLBs and the low-compression piston variant `rot_piston_c1_lowcomp.glb`) completely unchanged:

| Rule | Part-local class (M2/M7, unchanged) | Scene-placed class (M8, D-038) |
| --- | --- | --- |
| **Used by** | The 10 cylinder-1 part GLBs + `rot_piston_c1_lowcomp.glb` | External visual variant GLBs (`turbo_unit_engine_large.glb`, `intake_tract_engine_highflow.glb`, `exhaust_system_engine_4inch.glb`, `intercooler_core_engine_upgraded.glb`) |
| **Authoring frame (Blender)** | `+X` crank axis, `+Y` bank-plane `W` (valley), `+Z` bore axis; object origin on the moving part's rotation/slide pivot | **Master project frame:** `+X` front/crank axis, `+Y` vehicle LH, `+Z` up; geometry authored directly at its final mounted project position (metres); **no pivot, no animation** |
| **Export & runtime wrapper** | glTF Y-up ON (`export_yup=True`); single `wrapInPartLocalFrame` (`+90° X`) restores part-local space | glTF Y-up ON (`export_yup=True`); the same single `+90° X` wrapper restores project space, attached at the scene root with identity mount transform (runtime applies only `explodeVectorMm × e`) |
| **Payload & compression** | Uncompressed GLB, untextured PBR (`MeshStandardMaterial`); meshopt/Draco/KTX2 remain deferred as at M2–M7 | Uncompressed GLB, **no textures and no images** (`MeshStandardMaterial`, `≤ 4` materials); **meshopt/Draco/KTX2 remain deferred as they were at M2–M7** |
| **Node naming** | `<system>_<part>_<instance>_<variant>` contract mesh nodes | **Scene-placed naming exception:** one contract root mesh node named after the model (`turbo_unit_engine_large`, `intake_tract_engine_highflow`, `exhaust_system_engine_4inch`, `intercooler_core_engine_upgraded`) rather than the `<system>_<part>_<instance>_<variant>` cylinder-instance convention |
| **Interface markers (`if_*`)** | Pivot at `(0, 0, 0)` is the datum | Named mesh-less empty nodes (`if_<name>`) authored at the model's exact connection/service points; asset tests convert glTF translations via `p_mm = (1000·g_x, -1000·g_z, 1000·g_y)` and assert agreement with documented datums in [`docs/M8-VARIANTS.md`](./M8-VARIANTS.md) within `±1.0 mm` |
| **Provenance** | Rows in [`assets-src/PROVENANCE.md`](../assets-src/PROVENANCE.md) | Rows in [`assets-src/PROVENANCE.md`](../assets-src/PROVENANCE.md) ("Milestone 8 variant models") + [`docs/M8-VARIANTS.md`](./M8-VARIANTS.md) |
