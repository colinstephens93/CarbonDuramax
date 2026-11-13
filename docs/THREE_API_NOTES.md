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

- **glTF / GLB loader:** `import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';` (or `'three/examples/jsm/loaders/GLTFLoader.js'`)
- **HDR / RGBE environment loader:** `import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';` (in `0.187.0`, `RGBELoader` is a deprecated subclass alias of `HDRLoader` from `'three/addons/loaders/HDRLoader.js'` introduced in r180; both inherit `load` and `loadAsync` from `DataTextureLoader` with default `type = HalfFloatType` and `LinearSRGBColorSpace`)
- **Draco geometry decompression:** `import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';`
- **KTX2 texture loader:** `import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';`
- **Meshopt decoder:** `import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';`
- **Orbit camera controls:** `import { OrbitControls } from 'three/addons/controls/OrbitControls.js';`

## Milestone 1 Primitive Scene APIs (`0.187.0`)

- **`OrbitControls` & `camera.up` (Z-up project frame):** `new OrbitControls(object, domElement)` captures `object.up` at construction time (`this._quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0))`). Set `camera.up.set(0, 0, 1)` **before** instantiating `OrbitControls` so `+Z` is the vertical orbit axis. When `controls.enableDamping = true` (default `false`, `dampingFactor = 0.05`), `controls.update()` must be called every frame; `controls.dispose()` detaches DOM listeners.
- **`Object3D.lookAt` axis convention:** On `Camera` and `Light` instances, `lookAt(target)` points local `-Z` toward `target`; on `Mesh` / generic `Object3D` instances, `lookAt(target)` points **local `+Z`** toward `target` using `object.up`.
- **Primitive geometries & wireframes:**
  - `CylinderGeometry(radiusTop = 1, radiusBottom = 1, height = 1, radialSegments = 32, ...)` builds a cylinder centered at the origin along **local `+Y`** (`[-height/2, +height/2]`). `BufferGeometry.rotateX(rad)` / `rotateZ(rad)` transforms vertex attributes in place once at creation.
  - `EdgesGeometry(geometry = null, thresholdAngle = 1)` paired with `LineSegments(edges, new LineBasicMaterial(...))` renders hard-edge wireframes for static `BoxGeometry` enclosures.
- **Materials & lighting:** `HemisphereLight(skyColor, groundColor, intensity)` and `DirectionalLight(color, intensity)` illuminate `MeshStandardMaterial` meshes (`emissive` `Color` + `emissiveIntensity` `number` used for firing-window piston highlights).

## Milestone 2 Detailed GLB & Draft Studio Look APIs (`0.187.0`)

- **`GLTFLoader` & single Asset Contract frame conversion (`src/renderer/partLoader.ts`):**
  - `GLTFLoader.loadAsync(url)` resolves a `GLTF` object (`{ scene: THREE.Group, scenes, animations, cameras, asset, parser, userData }`) whose Metallic-Roughness PBR materials instantiate as `THREE.MeshStandardMaterial` (or `THREE.MeshPhysicalMaterial` when glTF PBR extensions are present).
  - Blender authors parts with `+Z` along the bore axis, `+X` along the crank axis, and `+Y` toward the valley (`W`), then exports with glTF Y-up ON (`R_x(-90°)`), placing the bore axis along glTF `+Y` and valley `W` along glTF `-Z`.
  - Wrapping a cloned node from `gltf.scene.getObjectByName(nodeName)` inside an inner conversion group with `rotation.x = +Math.PI / 2` (`R_x(+90°)`) and returning an outer `THREE.Group` restores part-local `(+X crank, +Y valley W, +Z bore)` exactly once (`R_x(+90°) · R_x(-90°) = I`). Scaling `outerGroup.scale.set(1, 1, factor)` scales strictly along part-local `+Z` before `outerGroup.quaternion` rotates into world space (`M = T · R · S`).
- **`RGBELoader` + `PMREMGenerator` studio IBL:**
  - `new THREE.PMREMGenerator(renderer)`: `pmremGenerator.compileEquirectangularShader()` precompiles the equirectangular-to-PMREM shader; `const rt = pmremGenerator.fromEquirectangular(hdrTexture)` returns a `WebGLCubeRenderTarget` (`rt.texture` assigned to `scene.environment`, while `scene.background = new THREE.Color(0x0b0b0d)` keeps the backdrop dark).
  - Because `PMREMGenerator.fromEquirectangular` builds a Y-up cubemap while the project frame is Z-up, `scene.environmentRotation.set(Math.PI / 2, 0, 0)` rotates the IBL lookup so the studio softbox zenith (`+Y`) illuminates from `+Z` (overhead); `scene.environmentIntensity` scales IBL contribution across all physical materials.
  - Dispose both the source `hdrTexture` and `pmremGenerator` immediately after `fromEquirectangular(hdrTexture)`; retain `rt` and call `rt.dispose()` on scene teardown.
- **Tone mapping, studio fog, & soft directional shadows:**
  - `renderer.toneMapping = THREE.ACESFilmicToneMapping` with `renderer.toneMappingExposure = 1.1`.
  - `renderer.shadowMap.enabled = true` and `renderer.shadowMap.type = THREE.PCFSoftShadowMap`.
  - `DirectionalLight.castShadow = true` uses an `OrthographicCamera` at `light.shadow.camera` (`left`, `right`, `top`, `bottom`, `near`, `far`), `light.shadow.mapSize.set(2048, 2048)`, `light.shadow.bias`, `light.shadow.normalBias`, and `light.shadow.radius` (blur radius supported by `PCFSoftShadowMap`). Add `light.target` to `scene` when setting a non-origin `light.target.position`; only meshes with `mesh.castShadow = true` render in the shadow pass (`groundMesh.receiveShadow = true` receives shadows).
  - `CircleGeometry(radius, segments)` (like `PlaneGeometry`) lies in local `XY` with `+Z` normal — directly horizontal in the project's Z-up frame without rotation; pairing a large dark ground disc with `scene.fog = new THREE.FogExp2(0x0b0b0d, density)` blends the distant floor edge seamlessly into `scene.background`.
  - **`WebGLRenderer.info.render` accounting:** With `renderer.info.autoReset = true` (default), `info.reset()` runs once at the start of `renderer.render(scene, camera)` **before** `shadowMap.render(...)`. Consequently, `renderer.info.render.calls` and `renderer.info.render.triangles` report the combined per-frame total across both the directional shadow-map pass (`castShadow = true` meshes) and the main camera pass.

## Milestone 3 Instancing, Geometry Merging, & Tier Switching APIs (`0.187.0`)

- **`THREE.InstancedMesh` batching & frustum culling:**
  - `new THREE.InstancedMesh(geometry, material, count)` renders `count` instances in a single draw call; update per-instance transforms with `instMesh.setMatrixAt(i, matrix)` followed by `instMesh.instanceMatrix.needsUpdate = true`.
  - By default, `InstancedMesh` tests camera frustum culling against `geometry.boundingSphere` at the `InstancedMesh` object's local origin unless `instMesh.computeBoundingSphere()` is recomputed across all instance matrices. Setting `instMesh.frustumCulled = false` prevents false-negative culling during close-up camera inspection (e.g., Cylinder 1 head close-ups).
  - Never pass negative-determinant reflection matrices into `setMatrixAt`, as reflected normals invert front/back face winding; for chiral bank-mirrored parts (LH rockers), mirror a separate `BufferGeometry` (`scale(-1, 1, 1)`) and flip each triangle index pair `(i1, i2)` once at load time so every `InstancedMesh` matrix has `det = +1`.
- **`BufferGeometryUtils` (`three/addons/utils/BufferGeometryUtils.js`):**
  - `mergeGeometries(geometries, useGroups = false)` merges an array of compatible `BufferGeometry` instances (matching vertex attribute sets and index presence) into a single `BufferGeometry`; dispose temporary per-node cloned geometries after merging.
  - `toCreasedNormals(geometry, creaseAngleRad)` splits vertices across hard edges exceeding `creaseAngleRad` and computes smooth normals within turned faces (used on `LatheGeometry` for the axisymmetric main crankshaft; `LatheGeometry` revolves around `+Y`, so `rotateZ(-Math.PI / 2)` maps `+Y` onto the `+X` crank axis with `det = +1`).
- **Shadow-map disposal on tier switch (`Full` → `Phone`):**
  - In `0.187.0`, `WebGLShadowMap` allocates both `light.shadow.map` (`WebGLRenderTarget`) and `light.shadow.map.depthTexture` (`DepthTexture`). When disabling `renderer.shadowMap.enabled` and `light.castShadow` for the `Phone` profile, dispose `light.shadow.map.depthTexture` (if non-null) as well as `light.shadow.map`, set `light.shadow.map = null`, and mark scene materials `needsUpdate = true` when switching tiers.
