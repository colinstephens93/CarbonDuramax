# Asset Contract — Duramax LLY Engine Lab

Status: **Written in Milestone 0, proven in Milestone 2** · Governing plan: [`docs/PLAN.md`](./PLAN.md) v2.2 · Decision: [`docs/DECISIONS.md`](./DECISIONS.md) D-011

Every model and every dimension follows one written contract. Better data later should be a one-line config change, not a rework.

## Contract Rules

- **Frame:** The concept set's frame is the master. Origin is the crank axis at the rear block / adapter plane; `+X` toward the front accessory drive, `+Y` vehicle left (LH), `+Z` up.
- **Axis conversion (Z-up → Y-up):** glTF is Y-up. Conversion happens once, at export, using the Blender glTF exporter's Y-up option. A reference fixture (a known 3-axis marker) is checked by a test.
- **Units:** Meters in models and in the math core; the config may record source values in mm or inches, converted on load.
- **Pivots and code-driven motion:** Every moving part's origin sits exactly on its rotation or slide axis. Code moves parts; Blender animation is not used.
- **Naming:** `<system>_<part>_<instance>_<variant>`, e.g. `rot_piston_c3_stock`, with cylinder numbers per the RH `1-3-5-7` / LH `2-4-6-8` scheme.
- **Budgets:** Triangle, draw-call, and texture-memory limits per tier, set at Milestone 2 from measurements.
- **Compression:** meshopt or Draco for geometry, KTX2 for textures.
- **Provenance:** Each model file lists what reference it was built from and whether its shape is verified or illustrative.
