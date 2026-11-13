# Source Assets & Headless Blender Build (`assets-src/`)

This directory holds the procedural Blender generation pipeline, dimensions bridge, axis-conversion test fixture, and asset provenance records for Milestone 2 (Cylinder 1 Detailed Assembly + Draft Studio Look).

## Blender Version Used

- **Blender:** `5.2.3 LTS` (`blender-v5.2-release`, commit `e13b728c6880`, Windows x86_64)

## Regeneration Workflow

Interface dimensions live exclusively in TypeScript configs (`src/config/detailConfig.ts`, `src/config/engineConfig.ts`, and `src/config/valveConfig.ts`) and are bridged into `assets-src/dimensions.json`. `assets-src/blender/build_cylinder1.py` reads **only** `assets-src/dimensions.json` for interface dimensions (zero hard-coded interface numbers).

### 1. Regenerate `assets-src/dimensions.json` from TypeScript configs

```bash
node tools/generateDimensions.ts
```

### 2. Regenerate all 10 part GLBs (`public/models/`) and the axis fixture (`assets-src/fixture/axis_fixture.glb`)

```bash
blender --background --python assets-src/blender/build_cylinder1.py -- --out public/models
```

On Windows PowerShell when `blender` is not on `PATH`:

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python assets-src/blender/build_cylinder1.py -- --out public/models
```

### 3. Verify against the GLB contract test suite

```bash
npm test
```

## Coordinate Frame & Compression Notes

- **Authoring frame in Blender:** `+Z` = bore axis (toward cylinder head), `+X` = crank axis (toward front accessory drive), `+Y` = bank-plane perpendicular `W` (`+` toward the V-valley for RH Cylinder 1), with each moving part's object origin at its exact rotation or slide pivot in meters.
- **glTF export:** Exported with Blender's glTF 2.0 Y-up option ON (`export_yup=True`), mapping authored `+Z` (bore) to glTF `+Y`. The Three.js part loader in `src/renderer/partLoader.ts` wraps each loaded scene/node once with `rotation.x = +Math.PI / 2` to restore part-local `(+X crank, +Y valley W, +Z bore)`.
- **Compression:** All GLBs in `public/models/` and the studio HDRI in `public/hdri/` are stored **uncompressed** at Milestone 2 per spec; `meshopt` / Draco and `KTX2` compression are deferred to Milestone 3 budget confirmation.
