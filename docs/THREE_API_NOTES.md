# Three.js API Notes — Pinned Version `0.187.0`

Governing decisions: D-005 (Three.js version pinned + API-notes file), D-007 (only `src/renderer/` may import `three`).

All facts below are verified directly against the installed `three@0.187.0` and `@types/three@0.187.0` packages.

## Pinned Packages

- `three`: `0.187.0` (ES module entry `./build/three.module.js`)
- `@types/three`: `0.187.0`

## Import Boundary

- Only modules inside `src/renderer/` may import `three` or its addon subpaths (`three/addons/*` or `three/examples/jsm/*`).
- Enforced by `src/core/architecture.test.ts`.

## Color Management & `outputColorSpace`

- `ColorManagement.enabled` defaults to `true`, with `ColorManagement.workingColorSpace = LinearSRGBColorSpace` (`'srgb-linear'`).
- `WebGLRenderer.outputColorSpace` defaults to `SRGBColorSpace` (`'srgb'`).
- Legacy `WebGLRenderer.outputEncoding` and `sRGBEncoding` do not exist in `0.187.0`; always use `renderer.outputColorSpace = THREE.SRGBColorSpace` (or `THREE.LinearSRGBColorSpace`) and `texture.colorSpace = THREE.SRGBColorSpace` (color textures) / `THREE.NoColorSpace` (non-color data maps).

## `WebGLRenderer` Defaults (`0.187.0`)

- **WebGL 2 only:** Passing a WebGL 1 `WebGLRenderingContext` throws (`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`).
- **Constructor options (`WebGLRendererParameters`) defaults:**
  - `antialias`: `false`
  - `alpha`: `false`
  - `premultipliedAlpha`: `true`
  - `depth`: `true`
  - `stencil`: `false`
  - `preserveDrawingBuffer`: `false`
  - `powerPreference`: `'default'`
  - `failIfMajorPerformanceCaveat`: `false`
  - `reversedDepthBuffer`: `false`
  - `outputBufferType`: `UnsignedByteType`
- **Instance property defaults:**
  - `outputColorSpace`: `SRGBColorSpace`
  - `toneMapping`: `NoToneMapping` (supported constants include `NoToneMapping`, `LinearToneMapping`, `ReinhardToneMapping`, `CineonToneMapping`, `ACESFilmicToneMapping`, `AgXToneMapping`, `NeutralToneMapping`, `CustomToneMapping`)
  - `toneMappingExposure`: `1.0`
  - `localClippingEnabled`: `false` (`clippingPlanes`: `[]`)
  - `autoClear`, `autoClearColor`, `autoClearDepth`, `autoClearStencil`: `true`
  - `sortObjects`: `true`
  - `transmissionResolutionScale`: `1.0`
- Legacy `physicallyCorrectLights` / `useLegacyLights` properties do not exist on `WebGLRenderer` in `0.187.0`.

## Addon / Loader Import Paths

Both `three/package.json` and `@types/three/package.json` export `./addons/*` and `./examples/jsm/*` mapped to `./examples/jsm/*`:

- **glTF / GLB loader:** `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';` (or `'three/examples/jsm/loaders/GLTFLoader.js'`)
- **Draco geometry decompression:** `import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';`
- **KTX2 texture loader:** `import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';`
- **Meshopt decoder:** `import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';`
- **Orbit camera controls:** `import { OrbitControls } from 'three/addons/controls/OrbitControls.js';`
