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

## Milestone 4 Local Clipping, X-Ray Transparency, & Camera Projection APIs (`0.187.0`)

- **Per-material local clipping (`renderer.localClippingEnabled` & `THREE.Plane`):**
  - Set `renderer.localClippingEnabled = true` once at renderer creation; leave `renderer.clippingPlanes = []` empty and assign `material.clippingPlanes = [plane]` (or `null` when off) only on the target material set so studio ground (`groundMat`) and background remain unclipped.
  - **Signed-distance convention:** `THREE.Plane(normal, constant)` evaluates `plane.distanceToPoint(p) = normal.dot(p) + constant` in scene world units (metres). In `clipping_planes_fragment`, Three.js computes `vClipPosition = -mvPosition.xyz` and discards fragments where `dot(vClipPosition, plane.xyz) > plane.w`, which keeps world points satisfying `normal.dot(p) + constant >= 0` and clips points where `distanceToPoint(p) < 0`.
  - **Shader program & uniform updates:** `WebGLRenderer` checks `materialProperties.numClippingPlanes !== clipping.numPlanes` per draw and automatically rebinds/recompiles material shader variants when `material.clippingPlanes` transitions between `null` (`0` planes) and `[sectionPlane]` (`1` plane). Mutating `sectionPlane.normal` and `sectionPlane.constant` in place updates only the view-space `clippingPlanes` `Float32Array` uniform without recompiling shaders.
  - **Clipped shadows on `InstancedMesh` (`material.clipShadows = true`):** When `renderer.localClippingEnabled && material.clipShadows && material.clippingPlanes?.length > 0`, `WebGLShadowMap.getDepthMaterial` automatically clones and caches a per-material `MeshDepthMaterial` variant (compatible with `InstancedMesh` `instanceMatrix` vertex transforms) carrying the material's `clippingPlanes`, and registers a `dispose` listener on the source material to clean up the cached depth variant.
  - **Open-shell backface visibility:** Internal part GLBs exported from Blender carry `doubleSided: true` (`material.side === THREE.DoubleSide`), so local clipping naturally reveals hollow interior walls without mutating `material.side`.
- **X-Ray ghosted materials & `DoubleSide` transparent pass accounting:**
  - Setting `material.transparent = true`, `material.opacity = 0.22`, and `material.depthWrite = false` renders ghosted exterior meshes in `WebGLRenderer`'s transparent render list after all opaque internals, allowing interior parts and emissive firing highlights to show through cleanly; snapshot `{ transparent, opacity, depthWrite }` per material before ghosting so turning X-Ray off restores each material's exact authored state (and set `material.needsUpdate = true` if `transparent` toggled).
  - In `0.187.0`, transparent materials with `material.side === THREE.DoubleSide` and default `material.forceSinglePass === false` render in two passes (back faces then front faces), adding `+1` draw call per `DoubleSide` transparent mesh in `renderer.info.render.calls`.
- **World-to-viewport label projection (`Vector3.project(camera)`):**
  - Call `camera.updateMatrixWorld()` before projecting anchors if camera pose or controls changed during the frame.
  - `projViewVec.copy(worldPt).applyMatrix4(camera.matrixWorldInverse)` tests whether a point lies strictly in front of the camera (`projViewVec.z < -camera.near`, since `PerspectiveCamera` looks down local `-Z`).
  - `projNdcVec.copy(worldPt).project(camera)` maps world coordinates into normalized device coordinates `[-1, +1]`, converting to CSS viewport pixels via `xPx = (ndc.x * 0.5 + 0.5) * viewportWidthPx` and `yPx = (-ndc.y * 0.5 + 0.5) * viewportHeightPx`.

## Milestone 8 Scene-Placed Variant GLBs & Preserved Exterior Subtree APIs (`0.187.0`)

- **Scene-placed GLB authoring frame & single `+90° X` wrapper (`src/renderer/variantLoader.ts`):**
  - External variant models (`turbo_unit_engine_large`, `intake_tract_engine_highflow`, `exhaust_system_engine_4inch`, `intercooler_core_engine_upgraded`) are authored directly in the master project frame (`+X` front/crank axis, `+Y` vehicle LH, `+Z` up, units in metres) at their final mounted positions and exported with Blender's glTF 2.0 Y-up option ON (`export_yup=True`, applying `R_x(-90°)`).
  - Wrapping `gltf.scene` once inside an inner conversion `THREE.Group` with `rotation.x = +Math.PI / 2` (`wrapInPartLocalFrame`) restores project space (`R_x(+90°) · R_x(-90°) = I`). Attaching the outer `THREE.Group` directly at the scene root requires no mount transform; runtime Explode offsets translate `outerGroup.position` in project metres (`explodeVectorMm × e / 1000`).
- **Empty-node interface markers (`if_*`):**
  - Blender `bpy.ops.object.empty_add(type='PLAIN_AXES', location=...)` exports to glTF 2.0 as a named node carrying only `translation` (no `mesh` property). In `0.187.0`, `GLTFLoader` instantiates mesh-less glTF nodes as plain `THREE.Object3D` instances that contribute zero draw calls, zero geometries, and zero materials at runtime, while remaining inspectable in raw GLB JSON (`p_mm = (1000·g_x, -1000·g_z, 1000·g_y)`) for asset-contract tests.
- **Per-group visibility on preserved exterior subtrees (`src/renderer/exteriorLoader.ts`):**
  - Splitting the registered exterior shell at load time into one global merged `THREE.Group` (`21` material-deduplicated meshes) plus three child `THREE.Group`s (`partGroups`: `turbo_unit` `6` meshes, `turbo_downpipe` `1` mesh, `intake_tract` `5` meshes; `33` meshes / `31,396` triangles total) allows toggling stock subtree visibility via `group.visible = boolean` in `O(1)` per selection change with zero runtime geometry re-merging or buffer reallocation.
- **Shared canonical materials & single-disposal discipline (`src/renderer/exteriorLoader.ts`, `src/renderer/engineScene.ts`):**
  - Both the global exterior merge and the preserved `partGroups` reference the exact same deduplicated `THREE.MeshStandardMaterial` instances (`22` materials and `4` textures across the entire shell). Registering materials and textures in `Set`-backed disposal collections (`materialsToDispose`, `geometriesToDispose`) guarantees each shared `Material`, `Texture`, and `BufferGeometry` is disposed exactly once on `dispose()`, while clip-plane and X-Ray material mutations apply uniformly across global and preserved shell groups.
  - Similarly, pre-building stock and low-compression `PistonBatchSet`s (`InstancedMesh` pairs for `7` standard + `1` firing cylinder) lets `engineScene` swap piston geometry by detaching/attaching the pre-allocated `InstancedMesh` roots (`root.remove(...)` / `root.add(...)`) without recreating GPU vertex/index/instance buffers per selection change, disposing both sets' `InstancedMesh` instances once at scene teardown.

## Milestone 11 Section-Cap APIs (0.187.0)

- **Local clipping generates no cap geometry (`src/renderers/shaders/ShaderChunk/clipping_planes_fragment.glsl.js`):**
  - Local clipping is strictly a fragment discard (`if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;`) and emits no cross-section cap geometry; solid section caps must be constructed explicitly (`src/renderer/sectionCaps.ts`).
- **`ShapeUtils.triangulateShape(contour, holes)` (`THREE.ShapeUtils`, `src/extras/ShapeUtils.js`):**
  - Exported directly by `three@0.187.0` as the wrapper over Three's internal `Earcut.triangulate` (`src/extras/Earcut.js`); returns `number[][]` index triplets into the flattened `[...contour, ...holes[0], ...]` vertex sequence with zero additional npm dependencies.
  - **Both `contour` and every entry of `holes` must be `THREE.Vector2[]` (`THREE.Vector2[][]` for `holes`):** `removeDupEndPts(points)` inside `ShapeUtils.triangulateShape` invokes `points[l - 1].equals(points[0])`, so passing plain `{ x, y }` objects throws `TypeError: points[(l - 1)].equals is not a function`.
- **`ConvexHull` (`three/addons/math/ConvexHull.js`):**
  - Available directly from the pinned `three` package (`import { ConvexHull } from 'three/addons/math/ConvexHull.js'`, no new dependency); `new ConvexHull().setFromPoints(points)` builds a closed 3-D convex polyhedron (`hull.faces`) whose triangular faces can be extracted into a flat `Float32Array` and sliced per instance.
  - **Used exclusively for the two `hullOnly` valve-spring batches** (`intake_spring`, `exhaust_spring`: `326` triangles/hull, `32 × 326 = 10,432` hull triangles/frame sliced via each spring's live `InstancedMesh` matrix), **never** as a fallback for non-watertight sources: exterior shell cap sources are material-merged buckets (`exteriorLoader.ts`), so hulling a bucket would overfill across multiple parts (`+46.9 %` shell area overfill at `X = 402.5 mm`).
- **Cap `BufferGeometry` & custom `ShaderMaterial` in ACES / linear-sRGB (`src/renderer/sectionCaps.ts`):**
  - Pre-allocated `BufferGeometry` carrying `position` (`itemSize = 3`, world metres) and custom `sectionUV` (`itemSize = 2`, plane-projected millimetres) `BufferAttribute`s marked `THREE.DynamicDrawUsage`, updated in place with `attribute.needsUpdate = true` and `geometry.setDrawRange(0, triangleCount * 3)`.
  - Rendered by one shared unlit `THREE.ShaderMaterial` (`fog: false`, `lights: false`, `transparent: false`, `depthTest: true`, `depthWrite: true`, `side: THREE.DoubleSide`, `clippingPlanes: null`) whose fragment shader outputs linear `gl_FragColor` and appends `#include <tonemapping_fragment>` followed by `#include <colorspace_fragment>` so the cut-bronze fill (`[0.290, 0.170, 0.086]`) and 45° plane-locked hatch (`[0.196, 0.112, 0.055]`, `5.0 mm` spacing, `1/3` duty) pass through the renderer's `ACESFilmicToneMapping` (`exposure = 1.1`) and `SRGBColorSpace` output conversion identically to scene materials without scene fog or directional/IBL shading.
- **Cap `THREE.Mesh` flags (`src/renderer/engineScene.ts`):**
  - Two `THREE.Mesh` objects (`section_cap_static`, `section_cap_dynamic`) added to `scene` with `frustumCulled = false` (because their `BufferGeometry` vertices are rewritten in place across planes and frames without recomputing `boundingSphere`), `castShadow = false`, and `receiveShadow = false` (so caps add `+2` main-pass draw calls when non-empty and `+0` shadow-pass calls).
- **No stencil buffer, no render target, single `renderer.render(scene, camera)`:**
  - `WebGLRenderer` continues to run with default `stencil: false` (measured `gl.getParameter(gl.STENCIL_BITS) === 0`), allocates zero `WebGLRenderTarget` instances for section capping, and issues exactly one `renderer.render(scene, camera)` call per frame.

## Milestone 12 Scene-Placed Add-On APIs (0.187.0)

- `loadVariantScene` wraps a Y-up project-frame GLB once with `wrapInPartLocalFrame` (+90° X) and returns a `Group`; the intake cover uses the same path, with no new loader or dependency.
- `prepareCapSource` accepts a `Group`: it caches child-mesh entries and world matrices, so a scene-placed add-on can be a static cap source; `skipWhenGhosted: true` suppresses its caps while its materials are ghosted.
- The cover's materials join the existing M4 `clippableMaterials` set and the M4 `clipShadows`/X-Ray snapshot path; no new render pass, stencil buffer, render target or shader is introduced.


