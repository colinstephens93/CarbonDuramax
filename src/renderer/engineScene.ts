// Milestone 4 views layered on the Milestone 3 full 8-cylinder detailed engine renderer + studio look
// (D-007, D-011, D-012, D-024, D-033, D-034; docs/specs/M3-full-engine.md, docs/specs/M4-views.md).
// Implements explode while running (§3), per-material clipping cutaway with clipShadows (§4),
// exterior shell X-ray ghosting with snapshot restore (§5), and 3D-to-2D label anchor projection (§6).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { detailConfig as defaultDetailConfig, type DetailConfig } from '../config/detailConfig';
import type { ValveConfig } from '../config/valveConfig';
import type { CrankState, CylinderId, EngineConfig } from '../core/interfaces';
import { computeState, crankPinPositionM, phaseOffsetDeg } from '../core/kinematics';
import { loadRegisteredExteriorShell, type LoadedExteriorShell } from './exteriorLoader';
import { computeEngineLayout } from './layout';
import {
  createPartLoader,
  extractPartPrimitives,
  loadPartGltf,
  type ExtractedPartPrimitive,
} from './partLoader';
import {
  clampExplodeFactor,
  clampSectionPositionMm,
  computeHeadLiftMm,
  computeLifterLiftMm,
  computePartGroupExplodeOffsetMm,
  computeStationSpreadOffsetXMm,
  evaluateLabelAnchors,
  isLabelVisibleUnderViewRules,
  MAIN_SHAFT_FRONT_SNOUT_OFFSET_MM,
  MAIN_SHAFT_REAR_FLANGE_X_MM,
  SECTION_RANGES_MM,
  type ActiveSectionMode,
  type SectionMode,
} from './viewLayout';

export type QualityMode = 'auto' | 'full' | 'phone';
export type QualityTier = 'full' | 'phone';

const ALL_CYLINDERS: readonly CylinderId[] = [1, 2, 3, 4, 5, 6, 7, 8];
const AUTO_PHONE_BREAKPOINT_PX = 768;

const UNIT_X_AXIS = new THREE.Vector3(1, 0, 0);
const FIRING_EMISSIVE_COLOR = new THREE.Color(0xf97316);
const FIRING_EMISSIVE_INTENSITY = 0.85;
const XRAY_GHOST_OPACITY = 0.22;

// Estimated GPU memory of PMREM HalfFloat cubemap (~4.5 MiB) + internal BRDF LUTs (~0.25 MiB)
const STUDIO_PMREM_AND_LUT_BYTES = Math.round(4.75 * 1024 * 1024);
// 2048x2048 WebGL2 shadow depth/RGBA renderbuffer (~16.0 MiB when allocated on Full tier)
const SHADOW_MAP_2048_BYTES = 16 * 1024 * 1024;

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export interface SectionState {
  mode: SectionMode;
  positionMm: number;
}

export interface ProjectedLabelAnchor {
  id: string;
  text: string;
  xPx: number;
  yPx: number;
  visible: boolean;
}

export interface EngineRenderStats {
  calls: number;
  triangles: number;
  lines: number;
  geometries: number;
  textures: number;
  detailedLoaded: boolean;
  hdriLoaded: boolean;
  exteriorLoaded: boolean;
  exteriorVisible: boolean;
  xrayEnabled: boolean;
  explodeFactor: number;
  sectionMode: SectionMode;
  sectionPositionMm: number;
  exteriorMergedMeshes: number;
  exteriorSceneTriangles: number;
  internalSceneTriangles: number;
  mainShaftTriangles: number;
  groundTriangles: number;
  qualityMode: QualityMode;
  effectiveQualityTier: QualityTier;
  effectivePixelRatio: number;
  estimatedTextureVramMiB: number;
}

export interface EngineSceneController {
  update(state: CrankState): void;
  setExteriorVisible(visible: boolean): void;
  getExteriorVisible(): boolean;
  setXrayEnabled(enabled: boolean): void;
  getXrayEnabled(): boolean;
  setExplodeFactor(factor: number): void;
  getExplodeFactor(): number;
  setSectionState(mode: SectionMode, positionMm?: number): void;
  getSectionState(): SectionState;
  projectLabelAnchors(viewportWidthPx: number, viewportHeightPx: number): ProjectedLabelAnchor[];
  setQualityMode(mode: QualityMode): void;
  getQualityMode(): QualityMode;
  getEffectiveQualityTier(): QualityTier;
  setCameraPose(position: [number, number, number], target: [number, number, number]): void;
  getCameraPose(): CameraPose;
  getRenderStats(): EngineRenderStats;
  getGpuRenderer(): string;
  dispose(): void;
}

interface InstancedPartBatch {
  readonly meshes: THREE.InstancedMesh[];
  readonly count: number;
  readonly totalTriangles: number;
  setMatrixAt(instanceIndex: number, matrix: THREE.Matrix4): void;
  commit(): void;
}

interface DetailedV8Batches {
  root: THREE.Group;
  pistonStandard: InstancedPartBatch;
  pistonFiring: InstancedPartBatch;
  conrod: InstancedPartBatch;
  crankThrow: InstancedPartBatch;
  head: InstancedPartBatch;
  injector: InstancedPartBatch;
  intakeValve: InstancedPartBatch;
  intakeSpring: InstancedPartBatch;
  exhaustValve: InstancedPartBatch;
  exhaustSpring: InstancedPartBatch;
  bridge: InstancedPartBatch;
  rhIntakeRocker: InstancedPartBatch;
  rhExhaustRocker: InstancedPartBatch;
  lhIntakeRocker: InstancedPartBatch;
  lhExhaustRocker: InstancedPartBatch;
  pushrod: InstancedPartBatch;
  lifter: InstancedPartBatch;
  totalTriangles: number;
}

interface MaterialTransparencySnapshot {
  readonly transparent: boolean;
  readonly opacity: number;
  readonly depthWrite: boolean;
}

/**
 * Builds or updates the cutaway `THREE.Plane` in scene units (metres) from a slider position in mm (Spec §4):
 * - Front–Back ('x'): normal (-1, 0, 0), constant +positionMm / 1000 -> keeps half-space x <= positionMm / 1000
 * - Side ('y'):       normal (0, -1, 0), constant +positionMm / 1000 -> keeps half-space y <= positionMm / 1000
 * Three.js keeps fragments where n·p + constant >= 0.
 */
export function buildSectionPlane(
  mode: ActiveSectionMode,
  positionMm: number,
  target: THREE.Plane = new THREE.Plane(),
): THREE.Plane {
  const constantM = positionMm === 0 ? 0 : positionMm / 1000;
  if (mode === 'x') {
    target.normal.set(-1, 0, 0);
  } else {
    target.normal.set(0, -1, 0);
  }
  target.constant = constantM;
  return target;
}

function normalizeAngle720(deg: number): number {
  const remainder = deg % 720;
  if (remainder === 0) {
    return 0;
  }
  if (remainder < 0) {
    const shifted = remainder + 720;
    return shifted >= 720 ? 720 - Number.EPSILON * 720 : shifted;
  }
  return remainder;
}

function resolveEffectiveTier(mode: QualityMode, viewportWidthPx: number): QualityTier {
  if (mode === 'auto') {
    return viewportWidthPx < AUTO_PHONE_BREAKPOINT_PX ? 'phone' : 'full';
  }
  return mode;
}

function createInstancedBatch(
  name: string,
  primitives: readonly ExtractedPartPrimitive[],
  count: number,
  parent: THREE.Group,
  materialOverride?: (srcMat: THREE.MeshStandardMaterial) => THREE.MeshStandardMaterial,
): {
  batch: InstancedPartBatch;
  createdMaterials: THREE.Material[];
} {
  const meshes: THREE.InstancedMesh[] = [];
  const createdMaterials: THREE.Material[] = [];
  let perInstanceTris = 0;

  primitives.forEach((prim, primIdx) => {
    const mat = materialOverride ? materialOverride(prim.material) : prim.material;
    if (materialOverride) {
      createdMaterials.push(mat);
    }
    const instMesh = new THREE.InstancedMesh(prim.geometry, mat, count);
    instMesh.name = `${name}_prim_${primIdx}`;
    instMesh.castShadow = true;
    instMesh.receiveShadow = true;
    // Instances span the full 8-cylinder V8 envelope; disable local-origin sphere culling
    // so close-up camera inspections (e.g. RF-2 on Cylinder 1 head) never drop visible instances.
    instMesh.frustumCulled = false;
    parent.add(instMesh);
    meshes.push(instMesh);
    perInstanceTris += prim.triangles;
  });

  const batch: InstancedPartBatch = {
    meshes,
    count,
    totalTriangles: perInstanceTris * count,
    setMatrixAt(instanceIndex: number, matrix: THREE.Matrix4): void {
      for (let i = 0; i < meshes.length; i += 1) {
        meshes[i]!.setMatrixAt(instanceIndex, matrix);
      }
    },
    commit(): void {
      for (let i = 0; i < meshes.length; i += 1) {
        meshes[i]!.instanceMatrix.needsUpdate = true;
      }
    },
  };

  return { batch, createdMaterials };
}

/**
 * Builds the axisymmetric turned main crankshaft along the project X axis (M3 Spec §3):
 * main shaft radius = 32.4 mm (within 32 ± 2 mm, matching rot_crankthrow_c1_stock stub radius),
 * rear flywheel flange disc behind station 7&8, and front snout/damper pulley disc ahead of station 1&2.
 */
function buildMainCrankShaftMesh(
  blockLengthM: number,
  mainRadiusM: number,
): {
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
  triangles: number;
} {
  const r = mainRadiusM; // 0.0324 m (32.4 mm)
  const rearFlangeOuterR = 1.62 * r; // 52.5 mm (< 62 mm web radius)
  const rearSealR = 1.08 * r;
  const frontSnoutR = 0.78 * r;
  const frontPulleyOuterR = 1.76 * r; // 57.0 mm (< 62 mm web radius)
  const frontPulleyHubR = 1.15 * r;
  const rearFlangeXM = MAIN_SHAFT_REAR_FLANGE_X_MM / 1000; // -0.018 m
  const frontSnoutEndXM = blockLengthM + MAIN_SHAFT_FRONT_SNOUT_OFFSET_MM / 1000; // +0.478 m

  // Profile (radius >= 0, axial X coordinate in meters) from rear (-0.018 m) to front (+0.478 m)
  const profilePoints: THREE.Vector2[] = [
    // Rear flywheel mounting flange disc (-18 mm .. -6 mm)
    new THREE.Vector2(0, rearFlangeXM),
    new THREE.Vector2(rearFlangeOuterR, rearFlangeXM),
    new THREE.Vector2(rearFlangeOuterR, -0.008),
    new THREE.Vector2(rearSealR, -0.008),
    new THREE.Vector2(rearSealR, -0.001),
    // Continuous main-journal shaft tying all 4 shared-pin throws together (-1 mm .. +461 mm)
    new THREE.Vector2(r, -0.001),
    new THREE.Vector2(r, blockLengthM + 0.001),
    // Front timing snout & turned pulley/damper disc (+461 mm .. +478 mm, inside 480 mm reach)
    new THREE.Vector2(frontSnoutR, blockLengthM + 0.001),
    new THREE.Vector2(frontSnoutR, blockLengthM + 0.006),
    new THREE.Vector2(frontPulleyOuterR, blockLengthM + 0.006),
    new THREE.Vector2(frontPulleyOuterR, blockLengthM + 0.016),
    new THREE.Vector2(frontPulleyHubR, blockLengthM + 0.016),
    new THREE.Vector2(frontPulleyHubR, blockLengthM + 0.013),
    new THREE.Vector2(0.55 * r, blockLengthM + 0.013),
    new THREE.Vector2(0.55 * r, frontSnoutEndXM),
    new THREE.Vector2(0, frontSnoutEndXM),
  ];

  const rawLathe = new THREE.LatheGeometry(profilePoints, 36);
  // LatheGeometry revolves around +Y; -90 deg around +Z maps +Y -> +X (crank axis) with det = +1
  rawLathe.rotateZ(-Math.PI / 2);
  const creasedGeo = toCreasedNormals(rawLathe, THREE.MathUtils.degToRad(38));
  if (creasedGeo !== rawLathe) {
    rawLathe.dispose();
  }
  creasedGeo.computeBoundingBox();
  creasedGeo.computeBoundingSphere();

  const posAttr = creasedGeo.getAttribute('position');
  const idxAttr = creasedGeo.getIndex();
  const triangles = idxAttr ? idxAttr.count / 3 : posAttr ? posAttr.count / 3 : 0;

  if (triangles > 3000) {
    throw new Error(`Main crankshaft triangle count (${triangles}) exceeded Spec §3 limit of 3,000.`);
  }

  // Matches mat_crank_journal_steel in build_cylinder1.py: linear (0.58, 0.60, 0.64), metal 0.90, rough 0.30
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setRGB(0.58, 0.6, 0.64, THREE.SRGBColorSpace),
    metalness: 0.9,
    roughness: 0.3,
  });
  // Keep exact linear-sRGB albedo matching Blender's Principled BSDF input
  material.color.setRGB(0.58, 0.6, 0.64, THREE.LinearSRGBColorSpace);

  const mesh = new THREE.Mesh(creasedGeo, material);
  mesh.name = 'crank_main_shaft_turned';
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return { mesh, geometry: creasedGeo, material, triangles };
}

export function createEngineScene(
  container: HTMLElement,
  config: EngineConfig,
  valveCfg: ValveConfig,
  detailCfg: DetailConfig = defaultDetailConfig,
): EngineSceneController {
  const layout = computeEngineLayout(config, valveCfg, detailCfg);
  const blockLengthM = layout.blockLengthMm / 1000;
  const centerXM = layout.blockCenterXMm / 1000;

  let qualityMode: QualityMode = 'auto';
  let effectiveTier: QualityTier = resolveEffectiveTier(qualityMode, window.innerWidth);
  let effectivePixelRatio =
    effectiveTier === 'phone' ? 1 : Math.min(window.devicePixelRatio || 1, 2);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.localClippingEnabled = true; // M4 §4 per-material cutaway clipping
  renderer.shadowMap.enabled = effectiveTier === 'full';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(effectivePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // Confirmed studio look (D-024, D-034, Spec §7): solid dark backdrop + ground-edge fog + rotated studio IBL
  scene.background = new THREE.Color(0x0b0b0d);
  scene.fog = new THREE.FogExp2(0x0b0b0d, 0.11);
  scene.environmentRotation.set(Math.PI / 2, 0, 0);
  scene.environmentIntensity = 0.8;

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.02, 20);
  // Set +Z up BEFORE constructing OrbitControls so OrbitControls captures +Z as its vertical orbit axis.
  camera.up.set(0, 0, 1);
  camera.position.set(centerXM + 0.78, -0.78, 0.56);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.18;
  controls.maxDistance = 4.5;
  controls.target.set(centerXM + 0.02, -0.01, 0.12);
  controls.update();

  const geometriesToDispose = new Set<THREE.BufferGeometry>();
  const materialsToDispose = new Set<THREE.Material>();
  const texturesToDispose = new Set<THREE.Texture>();
  let envRenderTarget: THREE.WebGLCubeRenderTarget | null = null;
  let disposed = false;
  let hdriLoaded = false;

  // M4 §4 explicit clipped material set:
  // Includes (a) all internal batch materials + firing clones, (b) mainShaft.material, (c) exteriorShell.materials.
  // Explicitly EXCLUDES groundMat so the studio ground, HDRI background, and UI are never clipped.
  const clippableMaterials = new Set<THREE.Material>();
  const sectionPlane = buildSectionPlane('x', SECTION_RANGES_MM.x.defaultMm);
  let sectionMode: SectionMode = 'off';
  let sectionPositionMm: number = SECTION_RANGES_MM.x.defaultMm;
  let activeClippingPlanes: THREE.Plane[] | null = null;

  const registerClippableMaterial = (mat: THREE.Material): void => {
    mat.clipShadows = true;
    mat.clippingPlanes = activeClippingPlanes;
    clippableMaterials.add(mat);
  };

  // Directional key light casting soft studio floor shadow (active on Full tier, disabled on Phone tier)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
  keyLight.position.set(centerXM + 0.55, -0.45, 1.35);
  keyLight.target.position.set(centerXM + 0.05, -0.05, 0.08);
  keyLight.castShadow = effectiveTier === 'full';
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.3;
  // Covers both unexploded and e = 1 exploded engine + floor shadows without clipping
  keyLight.shadow.camera.far = 2.8;
  keyLight.shadow.camera.left = -0.65;
  keyLight.shadow.camera.right = 0.65;
  keyLight.shadow.camera.top = 0.65;
  keyLight.shadow.camera.bottom = -0.65;
  keyLight.shadow.bias = -0.0003;
  keyLight.shadow.normalBias = 0.002;
  keyLight.shadow.radius = 3.5;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Dark matte studio ground disc at Z = -0.245 m (explicitly excluded from clippableMaterials per M4 §4)
  const groundSegments = 64;
  const groundGeo = new THREE.CircleGeometry(18, groundSegments);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0d0e12,
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.12,
  });
  geometriesToDispose.add(groundGeo);
  materialsToDispose.add(groundMat);

  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.set(centerXM, 0, -0.245);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Axisymmetric turned main crankshaft (unrotated static mesh, does not spread on explode; clipped per M4 §4b)
  const mainShaft = buildMainCrankShaftMesh(blockLengthM, layout.mainShaftRadiusMm / 1000);
  geometriesToDispose.add(mainShaft.geometry);
  materialsToDispose.add(mainShaft.material);
  registerClippableMaterial(mainShaft.material);
  scene.add(mainShaft.mesh);

  // Load Poly Haven CC0 2k studio HDRI via RGBELoader + PMREMGenerator
  const baseUrl = import.meta.env.BASE_URL;
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const rgbeLoader = new RGBELoader();
  rgbeLoader.load(
    `${baseUrl}hdri/studio_small_09_2k.hdr`,
    (hdrTexture) => {
      if (disposed) {
        hdrTexture.dispose();
        pmremGenerator.dispose();
        return;
      }
      envRenderTarget = pmremGenerator.fromEquirectangular(hdrTexture);
      scene.environment = envRenderTarget.texture;
      hdrTexture.dispose();
      pmremGenerator.dispose();
      hdriLoaded = true;
    },
    undefined,
    (err) => {
      console.error('Failed to load studio HDRI environment:', err);
      pmremGenerator.dispose();
    },
  );

  // Precompute per-cylinder world basis vectors & quaternions from pure layout module
  const cylTransforms = ALL_CYLINDERS.map((cyl) => {
    const cl = layout.cylinders[cyl];
    const axisX = new THREE.Vector3(cl.meshBasisX[0], cl.meshBasisX[1], cl.meshBasisX[2]);
    const axisW = new THREE.Vector3(cl.valleyAxisW[0], cl.valleyAxisW[1], cl.valleyAxisW[2]);
    const axisB = new THREE.Vector3(cl.boreAxisB[0], cl.boreAxisB[1], cl.boreAxisB[2]);
    const basisMat = new THREE.Matrix4().makeBasis(axisX, axisW, axisB);
    const meshQuat = new THREE.Quaternion().setFromRotationMatrix(basisMat);
    return {
      cylinder: cyl,
      bank: cl.bank,
      stationIndex: cl.stationIndex,
      stationCenterXMm: cl.stationCenterXMm,
      stationCenterXM: cl.stationCenterXM,
      rodSeatXM: cl.rodSeatXM,
      axisW,
      axisB,
      meshQuat,
    };
  });

  // Valvetrain constants in meters from layout.valvetrainMm
  const vt = layout.valvetrainMm;
  const tdcWristBM = vt.tdcWristBMm / 1000;
  const deckBM = vt.deckBMm / 1000;
  const springSeatBM = vt.springSeatBMm / 1000;
  const rockerShaftBM = vt.rockerShaftBMm / 1000;
  const valveInsetM = vt.valveInsetMm / 1000;
  const valveHalfPairXM = vt.valveHalfPairXMm / 1000;
  const valveRowOffsetM = vt.valveRowOffsetMm / 1000;
  const springInstalledLenM = vt.springFreeLengthMm / 1000;
  const rockerCupXM = vt.rockerCupXOffsetMm / 1000;
  const rockerCupWM = vt.rockerCupValleyOffsetMm / 1000;
  const pushrodNominalLenM = vt.pushrodNominalLengthMm / 1000;
  const lifterRestBM = vt.intakeLifterTopMm.bMm / 1000;
  const intakeLifterXM = vt.intakeLifterTopMm.xMm / 1000;
  const intakeLifterWM = vt.intakeLifterTopMm.wMm / 1000;
  const exhaustLifterXM = vt.exhaustLifterTopMm.xMm / 1000;
  const exhaustLifterWM = vt.exhaustLifterTopMm.wMm / 1000;

  let v8Batches: DetailedV8Batches | null = null;
  let exteriorShell: LoadedExteriorShell | null = null;
  let exteriorVisible = false;
  let xrayEnabled = false;
  let explodeFactor = 0;
  let exteriorMaterialsGhosted = false;
  const exteriorMaterialSnapshots = new Map<THREE.Material, MaterialTransparencySnapshot>();
  let lastState: CrankState = computeState(config, 0, 900, valveCfg);

  // Reusable scratch math objects (zero per-frame heap allocations)
  const posVec = new THREE.Vector3();
  const pinSeatVec = new THREE.Vector3();
  const wristSeatVec = new THREE.Vector3();
  const lifterTopVec = new THREE.Vector3();
  const cupLiveVec = new THREE.Vector3();
  const scaleVec = new THREE.Vector3(1, 1, 1);
  const unitScaleVec = new THREE.Vector3(1, 1, 1);
  const aimX = new THREE.Vector3();
  const aimY = new THREE.Vector3();
  const aimZ = new THREE.Vector3();
  const aimMat = new THREE.Matrix4();
  const aimQuat = new THREE.Quaternion();
  const localRotQuat = new THREE.Quaternion();
  const tempQuat = new THREE.Quaternion();
  const instanceMat = new THREE.Matrix4();
  const projWorldVec = new THREE.Vector3();
  const projViewVec = new THREE.Vector3();
  const projNdcVec = new THREE.Vector3();
  const sharedPinYByStation = [0, 0, 0, 0];
  const sharedPinZByStation = [0, 0, 0, 0];
  const stationSpreadXMByStation = [0, 0, 0, 0];

  const setBankWorldPos = (
    out: THREE.Vector3,
    ct: (typeof cylTransforms)[number],
    localXM: number,
    localWM: number,
    localBM: number,
    spreadXM = 0,
  ): THREE.Vector3 => {
    out.set(
      ct.stationCenterXM + spreadXM + localXM,
      localWM * ct.axisW.y + localBM * ct.axisB.y,
      localWM * ct.axisW.z + localBM * ct.axisB.z,
    );
    return out;
  };

  const composeAimMatrix = (
    outMat: THREE.Matrix4,
    startPt: THREE.Vector3,
    endPt: THREE.Vector3,
    fallbackAxisB: THREE.Vector3,
    scaleZ = 1,
  ): number => {
    aimZ.subVectors(endPt, startPt);
    const dist = aimZ.length();
    if (dist > 1e-9) {
      aimZ.multiplyScalar(1 / dist);
    } else {
      aimZ.copy(fallbackAxisB);
    }
    aimX.set(1, 0, 0).addScaledVector(aimZ, -aimZ.x).normalize();
    aimY.crossVectors(aimZ, aimX).normalize();
    aimMat.makeBasis(aimX, aimY, aimZ);
    aimQuat.setFromRotationMatrix(aimMat);
    scaleVec.set(1, 1, scaleZ);
    outMat.compose(startPt, aimQuat, scaleVec);
    return dist;
  };

  // M4 §3: Re-applied whenever explodeFactor changes (at e = 0, offsets are strictly 0 -> exact M3 matrices)
  const applyHeadAndInjectorTransforms = (batches: DetailedV8Batches): void => {
    for (let cIdx = 0; cIdx < cylTransforms.length; cIdx += 1) {
      const ct = cylTransforms[cIdx]!;
      const headOffset = computePartGroupExplodeOffsetMm(
        'head',
        ct.stationCenterXMm,
        layout.blockCenterXMm,
        explodeFactor,
      );
      const injOffset = computePartGroupExplodeOffsetMm(
        'injector',
        ct.stationCenterXMm,
        layout.blockCenterXMm,
        explodeFactor,
      );

      setBankWorldPos(
        posVec,
        ct,
        0,
        0,
        deckBM + headOffset.dbMm / 1000,
        headOffset.dxMm / 1000,
      );
      instanceMat.compose(posVec, ct.meshQuat, unitScaleVec);
      batches.head.setMatrixAt(cIdx, instanceMat);

      setBankWorldPos(posVec, ct, 0, 0, deckBM + injOffset.dbMm / 1000, injOffset.dxMm / 1000);
      instanceMat.compose(posVec, ct.meshQuat, unitScaleVec);
      batches.injector.setMatrixAt(cIdx, instanceMat);
    }
    batches.head.commit();
    batches.injector.commit();
  };

  const applyV8KinematicState = (
    batches: DetailedV8Batches,
    state: CrankState,
    normalizedTheta: number,
  ): void => {
    const headLiftM = computeHeadLiftMm(explodeFactor) / 1000;
    const lifterLiftM = computeLifterLiftMm(explodeFactor) / 1000;

    // 1. Update the 4 shared-pin crank throws (core pin X + station spread offset per M4 §3)
    for (let sIdx = 0; sIdx < 4; sIdx += 1) {
      const station = layout.stations[sIdx]!;
      const spreadXM =
        computeStationSpreadOffsetXMm(station.centerXMm, layout.blockCenterXMm, explodeFactor) /
        1000;
      stationSpreadXMByStation[sIdx] = spreadXM;

      const [stationX, pinY, pinZ] = crankPinPositionM(
        config,
        valveCfg,
        station.rhCylinder,
        state.crankAngleDeg,
      );
      sharedPinYByStation[sIdx] = pinY;
      sharedPinZByStation[sIdx] = pinZ;

      aimZ.set(0, pinY, pinZ);
      if (aimZ.lengthSq() > 1e-12) {
        aimZ.normalize();
      } else {
        aimZ.set(0, -Math.SQRT1_2, Math.SQRT1_2);
      }
      aimX.set(1, 0, 0);
      aimY.crossVectors(aimZ, aimX).normalize();
      aimMat.makeBasis(aimX, aimY, aimZ);
      aimQuat.setFromRotationMatrix(aimMat);
      posVec.set(stationX + spreadXM, 0, 0);
      instanceMat.compose(posVec, aimQuat, unitScaleVec);
      batches.crankThrow.setMatrixAt(sIdx, instanceMat);
    }
    batches.crankThrow.commit();

    // Determine exact firing cylinder in [0, 90) so exactly 1 piston goes to pistonFiring and 7 to pistonStandard
    let firingCylinder: CylinderId = 1;
    for (let i = 0; i < ALL_CYLINDERS.length; i += 1) {
      const cyl = ALL_CYLINDERS[i]!;
      const localAngleDeg = normalizeAngle720(normalizedTheta - phaseOffsetDeg(config, cyl));
      if (localAngleDeg >= 0 && localAngleDeg < 90) {
        firingCylinder = cyl;
        break;
      }
    }

    let stdPistonIdx = 0;
    const explodedDeckBM = deckBM + headLiftM;
    const explodedSpringSeatBM = springSeatBM + headLiftM;
    const explodedRockerShaftBM = rockerShaftBM + headLiftM;
    const explodedLifterRestBM = lifterRestBM + lifterLiftM;

    // 2. Update all 8 cylinders' pistons, rods, valves, springs, bridges, rockers, lifters, and pushrods
    for (let cIdx = 0; cIdx < cylTransforms.length; cIdx += 1) {
      const ct = cylTransforms[cIdx]!;
      const cyl = ct.cylinder;
      const sIdx = ct.stationIndex;
      const spreadXM = stationSpreadXMByStation[sIdx]!;
      const pinY = sharedPinYByStation[sIdx]!;
      const pinZ = sharedPinZByStation[sIdx]!;

      const pM = state.pistonPositionM[cyl];
      const lifts = state.valveLiftM[cyl];
      const intakeLiftM = lifts.intake;
      const exhaustLiftM = lifts.exhaust;

      const wristBM = tdcWristBM - pM;

      // 2a. Piston (centered on bore plane at stationCenterXM + spreadXM, 0 bore lift)
      setBankWorldPos(posVec, ct, 0, 0, wristBM, spreadXM);
      instanceMat.compose(posVec, ct.meshQuat, unitScaleVec);
      if (cyl === firingCylinder) {
        batches.pistonFiring.setMatrixAt(0, instanceMat);
      } else {
        batches.pistonStandard.setMatrixAt(stdPistonIdx, instanceMat);
        stdPistonIdx += 1;
      }

      // 2b. Connecting rod on shared crankpin journal at rodSeatXM + spreadXM (exact rodLength preserved)
      const explodedRodSeatXM = ct.rodSeatXM + spreadXM;
      pinSeatVec.set(explodedRodSeatXM, pinY, pinZ);
      wristSeatVec.set(explodedRodSeatXM, wristBM * ct.axisB.y, wristBM * ct.axisB.z);
      composeAimMatrix(instanceMat, pinSeatVec, wristSeatVec, ct.axisB, 1);
      batches.conrod.setMatrixAt(cIdx, instanceMat);

      // 2c. Valves & helical springs (2 intake at +W, 2 exhaust at -W; B shifted by +headLiftM)
      const intakeSpringScaleZ = (springInstalledLenM - intakeLiftM) / springInstalledLenM;
      const exhaustSpringScaleZ = (springInstalledLenM - exhaustLiftM) / springInstalledLenM;

      for (let vPair = 0; vPair < 2; vPair += 1) {
        const xOffM = vPair === 0 ? -valveHalfPairXM : +valveHalfPairXM;
        const inst16 = cIdx * 2 + vPair;

        setBankWorldPos(
          posVec,
          ct,
          xOffM,
          +valveRowOffsetM,
          explodedDeckBM + valveInsetM - intakeLiftM,
          spreadXM,
        );
        instanceMat.compose(posVec, ct.meshQuat, unitScaleVec);
        batches.intakeValve.setMatrixAt(inst16, instanceMat);

        setBankWorldPos(posVec, ct, xOffM, +valveRowOffsetM, explodedSpringSeatBM, spreadXM);
        scaleVec.set(1, 1, intakeSpringScaleZ);
        instanceMat.compose(posVec, ct.meshQuat, scaleVec);
        batches.intakeSpring.setMatrixAt(inst16, instanceMat);

        setBankWorldPos(
          posVec,
          ct,
          xOffM,
          -valveRowOffsetM,
          explodedDeckBM + valveInsetM - exhaustLiftM,
          spreadXM,
        );
        instanceMat.compose(posVec, ct.meshQuat, unitScaleVec);
        batches.exhaustValve.setMatrixAt(inst16, instanceMat);

        setBankWorldPos(posVec, ct, xOffM, -valveRowOffsetM, explodedSpringSeatBM, spreadXM);
        scaleVec.set(1, 1, exhaustSpringScaleZ);
        instanceMat.compose(posVec, ct.meshQuat, scaleVec);
        batches.exhaustSpring.setMatrixAt(inst16, instanceMat);
      }

      // 2d. Valve bridges (intake at cIdx*2, exhaust at cIdx*2 + 1; B shifted by +headLiftM)
      setBankWorldPos(
        posVec,
        ct,
        0,
        +valveRowOffsetM,
        explodedRockerShaftBM - intakeLiftM,
        spreadXM,
      );
      instanceMat.compose(posVec, ct.meshQuat, unitScaleVec);
      batches.bridge.setMatrixAt(cIdx * 2, instanceMat);

      setBankWorldPos(
        posVec,
        ct,
        0,
        -valveRowOffsetM,
        explodedRockerShaftBM - exhaustLiftM,
        spreadXM,
      );
      instanceMat.compose(posVec, ct.meshQuat, unitScaleVec);
      batches.bridge.setMatrixAt(cIdx * 2 + 1, instanceMat);

      // 2e. Forged rocker castings (shaft origin takes +headLiftM so live cup positions follow)
      const thetaIntake = Math.asin(Math.min(1, Math.max(-1, intakeLiftM / valveRowOffsetM)));
      const thetaExhaust = Math.asin(Math.min(1, Math.max(-1, exhaustLiftM / valveRowOffsetM)));

      setBankWorldPos(posVec, ct, 0, 0, explodedRockerShaftBM, spreadXM);

      localRotQuat.setFromAxisAngle(UNIT_X_AXIS, -thetaIntake);
      tempQuat.multiplyQuaternions(ct.meshQuat, localRotQuat);
      instanceMat.compose(posVec, tempQuat, unitScaleVec);
      if (ct.bank === 'RH') {
        batches.rhIntakeRocker.setMatrixAt(sIdx, instanceMat);
      } else {
        batches.lhIntakeRocker.setMatrixAt(sIdx, instanceMat);
      }

      localRotQuat.setFromAxisAngle(UNIT_X_AXIS, +thetaExhaust);
      tempQuat.multiplyQuaternions(ct.meshQuat, localRotQuat);
      instanceMat.compose(posVec, tempQuat, unitScaleVec);
      if (ct.bank === 'RH') {
        batches.rhExhaustRocker.setMatrixAt(sIdx, instanceMat);
      } else {
        batches.lhExhaustRocker.setMatrixAt(sIdx, instanceMat);
      }

      // 2f. Lifters (+lifterLiftM) & leaning two-point pushrods (bottom +lifterLiftM -> cup +headLiftM)
      const intakeRiseM = rockerCupWM * Math.sin(thetaIntake);
      setBankWorldPos(
        lifterTopVec,
        ct,
        +intakeLifterXM,
        +intakeLifterWM,
        explodedLifterRestBM + intakeRiseM,
        spreadXM,
      );
      instanceMat.compose(lifterTopVec, ct.meshQuat, unitScaleVec);
      batches.lifter.setMatrixAt(cIdx * 2, instanceMat);

      setBankWorldPos(
        cupLiveVec,
        ct,
        +rockerCupXM,
        -rockerCupWM * Math.cos(thetaIntake),
        explodedRockerShaftBM + intakeRiseM,
        spreadXM,
      );
      const intakeLiveLenM = lifterTopVec.distanceTo(cupLiveVec);
      composeAimMatrix(
        instanceMat,
        lifterTopVec,
        cupLiveVec,
        ct.axisB,
        intakeLiveLenM / pushrodNominalLenM,
      );
      batches.pushrod.setMatrixAt(cIdx * 2, instanceMat);

      const exhaustRiseM = rockerCupWM * Math.sin(thetaExhaust);
      setBankWorldPos(
        lifterTopVec,
        ct,
        exhaustLifterXM,
        +exhaustLifterWM,
        explodedLifterRestBM + exhaustRiseM,
        spreadXM,
      );
      instanceMat.compose(lifterTopVec, ct.meshQuat, unitScaleVec);
      batches.lifter.setMatrixAt(cIdx * 2 + 1, instanceMat);

      setBankWorldPos(
        cupLiveVec,
        ct,
        -rockerCupXM,
        +rockerCupWM * Math.cos(thetaExhaust),
        explodedRockerShaftBM + exhaustRiseM,
        spreadXM,
      );
      const exhaustLiveLenM = lifterTopVec.distanceTo(cupLiveVec);
      composeAimMatrix(
        instanceMat,
        lifterTopVec,
        cupLiveVec,
        ct.axisB,
        exhaustLiveLenM / pushrodNominalLenM,
      );
      batches.pushrod.setMatrixAt(cIdx * 2 + 1, instanceMat);
    }

    batches.pistonStandard.commit();
    batches.pistonFiring.commit();
    batches.conrod.commit();
    batches.intakeValve.commit();
    batches.intakeSpring.commit();
    batches.exhaustValve.commit();
    batches.exhaustSpring.commit();
    batches.bridge.commit();
    batches.rhIntakeRocker.commit();
    batches.rhExhaustRocker.commit();
    batches.lhIntakeRocker.commit();
    batches.lhExhaustRocker.commit();
    batches.lifter.commit();
    batches.pushrod.commit();
  };

  // M4 §5: Synchronize exterior shell group visibility (exteriorChecked || xrayEnabled) and ghosting state
  const syncExteriorShellState = (): void => {
    if (!exteriorShell) return;

    exteriorShell.group.visible = exteriorVisible || xrayEnabled;

    if (xrayEnabled && !exteriorMaterialsGhosted) {
      for (const mat of exteriorShell.materials) {
        exteriorMaterialSnapshots.set(mat, {
          transparent: mat.transparent,
          opacity: mat.opacity,
          depthWrite: mat.depthWrite,
        });
        mat.transparent = true;
        mat.opacity = XRAY_GHOST_OPACITY;
        mat.depthWrite = false;
        mat.needsUpdate = true;
      }
      exteriorMaterialsGhosted = true;
    } else if (!xrayEnabled && exteriorMaterialsGhosted) {
      for (const mat of exteriorShell.materials) {
        const snap = exteriorMaterialSnapshots.get(mat);
        if (snap) {
          mat.transparent = snap.transparent;
          mat.opacity = snap.opacity;
          mat.depthWrite = snap.depthWrite;
          mat.needsUpdate = true;
        }
      }
      exteriorMaterialSnapshots.clear();
      exteriorMaterialsGhosted = false;
    }
  };

  // Load all 10 part GLBs and build batched V8 InstancedMeshes
  const partLoader = createPartLoader();
  const modelsBase = `${baseUrl}models/`;

  void Promise.all([
    loadPartGltf(partLoader, `${modelsBase}rot_piston_c1_stock.glb`),
    loadPartGltf(partLoader, `${modelsBase}rot_conrod_c1_stock.glb`),
    loadPartGltf(partLoader, `${modelsBase}rot_crankthrow_c1_stock.glb`),
    loadPartGltf(partLoader, `${modelsBase}sta_head_c1_stock.glb`),
    loadPartGltf(partLoader, `${modelsBase}val_valve_intake_stock.glb`),
    loadPartGltf(partLoader, `${modelsBase}val_valve_exhaust_stock.glb`),
    loadPartGltf(partLoader, `${modelsBase}val_pushrod_stock.glb`),
    loadPartGltf(partLoader, `${modelsBase}val_rocker_stock.glb`),
    loadPartGltf(partLoader, `${modelsBase}val_bridge_stock.glb`),
    loadPartGltf(partLoader, `${modelsBase}fuel_injector_c1_stock.glb`),
  ])
    .then(
      ([
        pistonGltf,
        conrodGltf,
        crankThrowGltf,
        headGltf,
        intakeValveGltf,
        exhaustValveGltf,
        pushrodGltf,
        rockerGltf,
        bridgeGltf,
        injectorGltf,
      ]) => {
        if (disposed) return;

        const root = new THREE.Group();
        root.name = 'v8_detailed_internals';

        const trackPrimitives = (prims: readonly ExtractedPartPrimitive[]): void => {
          for (const p of prims) {
            geometriesToDispose.add(p.geometry);
            materialsToDispose.add(p.material);
            registerClippableMaterial(p.material);
          }
        };

        const pistonPrims = extractPartPrimitives(pistonGltf, 'rot_piston_c1_stock');
        const conrodPrims = extractPartPrimitives(conrodGltf, 'rot_conrod_c1_stock');
        const crankThrowPrims = extractPartPrimitives(crankThrowGltf, 'rot_crankthrow_c1_stock');
        const headPrims = extractPartPrimitives(headGltf, 'sta_head_c1_stock');
        const injectorPrims = extractPartPrimitives(injectorGltf, 'fuel_injector_c1_stock');
        const intakeValvePrims = extractPartPrimitives(intakeValveGltf, 'val_valve_intake_stock');
        const intakeSpringPrims = extractPartPrimitives(intakeValveGltf, 'val_spring_intake_stock');
        const exhaustValvePrims = extractPartPrimitives(exhaustValveGltf, 'val_valve_exhaust_stock');
        const exhaustSpringPrims = extractPartPrimitives(
          exhaustValveGltf,
          'val_spring_exhaust_stock',
        );
        const bridgePrims = extractPartPrimitives(bridgeGltf, 'val_bridge_stock');
        const rhIntakeRockerPrims = extractPartPrimitives(rockerGltf, 'val_rocker_intake_stock');
        const rhExhaustRockerPrims = extractPartPrimitives(rockerGltf, 'val_rocker_exhaust_stock');
        const lhIntakeRockerPrims = extractPartPrimitives(rockerGltf, 'val_rocker_intake_stock', {
          mirrorLocalX: true,
        });
        const lhExhaustRockerPrims = extractPartPrimitives(rockerGltf, 'val_rocker_exhaust_stock', {
          mirrorLocalX: true,
        });
        const pushrodPrims = extractPartPrimitives(pushrodGltf, 'val_pushrod_stock');
        const lifterPrims = extractPartPrimitives(pushrodGltf, 'val_lifter_stock');

        trackPrimitives(pistonPrims);
        trackPrimitives(conrodPrims);
        trackPrimitives(crankThrowPrims);
        trackPrimitives(headPrims);
        trackPrimitives(injectorPrims);
        trackPrimitives(intakeValvePrims);
        trackPrimitives(intakeSpringPrims);
        trackPrimitives(exhaustValvePrims);
        trackPrimitives(exhaustSpringPrims);
        trackPrimitives(bridgePrims);
        trackPrimitives(rhIntakeRockerPrims);
        trackPrimitives(rhExhaustRockerPrims);
        trackPrimitives(lhIntakeRockerPrims);
        trackPrimitives(lhExhaustRockerPrims);
        trackPrimitives(pushrodPrims);
        trackPrimitives(lifterPrims);

        const pistonStandard = createInstancedBatch('piston_std', pistonPrims, 7, root).batch;
        const pistonFiringRes = createInstancedBatch(
          'piston_firing',
          pistonPrims,
          1,
          root,
          (srcMat) => {
            const copy = srcMat.clone();
            copy.emissive.copy(FIRING_EMISSIVE_COLOR);
            copy.emissiveIntensity = FIRING_EMISSIVE_INTENSITY;
            return copy;
          },
        );
        for (const m of pistonFiringRes.createdMaterials) {
          materialsToDispose.add(m);
          registerClippableMaterial(m);
        }
        const pistonFiring = pistonFiringRes.batch;

        const conrod = createInstancedBatch('conrod', conrodPrims, 8, root).batch;
        const crankThrow = createInstancedBatch('crankthrow', crankThrowPrims, 4, root).batch;
        const head = createInstancedBatch('head', headPrims, 8, root).batch;
        const injector = createInstancedBatch('injector', injectorPrims, 8, root).batch;
        const intakeValve = createInstancedBatch('intake_valve', intakeValvePrims, 16, root).batch;
        const intakeSpring = createInstancedBatch(
          'intake_spring',
          intakeSpringPrims,
          16,
          root,
        ).batch;
        const exhaustValve = createInstancedBatch(
          'exhaust_valve',
          exhaustValvePrims,
          16,
          root,
        ).batch;
        const exhaustSpring = createInstancedBatch(
          'exhaust_spring',
          exhaustSpringPrims,
          16,
          root,
        ).batch;
        const bridge = createInstancedBatch('bridge', bridgePrims, 16, root).batch;
        const rhIntakeRocker = createInstancedBatch(
          'rocker_in_rh',
          rhIntakeRockerPrims,
          4,
          root,
        ).batch;
        const rhExhaustRocker = createInstancedBatch(
          'rocker_ex_rh',
          rhExhaustRockerPrims,
          4,
          root,
        ).batch;
        const lhIntakeRocker = createInstancedBatch(
          'rocker_in_lh',
          lhIntakeRockerPrims,
          4,
          root,
        ).batch;
        const lhExhaustRocker = createInstancedBatch(
          'rocker_ex_lh',
          lhExhaustRockerPrims,
          4,
          root,
        ).batch;
        const pushrod = createInstancedBatch('pushrod', pushrodPrims, 16, root).batch;
        const lifter = createInstancedBatch('lifter', lifterPrims, 16, root).batch;

        const allBatches: InstancedPartBatch[] = [
          pistonStandard,
          pistonFiring,
          conrod,
          crankThrow,
          head,
          injector,
          intakeValve,
          intakeSpring,
          exhaustValve,
          exhaustSpring,
          bridge,
          rhIntakeRocker,
          rhExhaustRocker,
          lhIntakeRocker,
          lhExhaustRocker,
          pushrod,
          lifter,
        ];
        const totalTriangles = allBatches.reduce((sum, b) => sum + b.totalTriangles, 0);

        v8Batches = {
          root,
          pistonStandard,
          pistonFiring,
          conrod,
          crankThrow,
          head,
          injector,
          intakeValve,
          intakeSpring,
          exhaustValve,
          exhaustSpring,
          bridge,
          rhIntakeRocker,
          rhExhaustRocker,
          lhIntakeRocker,
          lhExhaustRocker,
          pushrod,
          lifter,
          totalTriangles,
        };

        scene.add(root);
        applyHeadAndInjectorTransforms(v8Batches);
        applyV8KinematicState(
          v8Batches,
          lastState,
          normalizeAngle720(lastState.crankAngleDeg),
        );
      },
    )
    .catch((err) => {
      console.error('Failed to load V8 detailed GLB assembly:', err);
    });

  // Load, deduplicate, merge, and register Duramax_LLY_2005_66L_V8.glb (M3 §5, M4 §§4–5)
  void loadRegisteredExteriorShell(
    partLoader,
    `${baseUrl}Duramax_LLY_2005_66L_V8.glb`,
    layout.exterior,
  )
    .then((loaded) => {
      if (disposed) {
        for (const g of loaded.geometries) g.dispose();
        for (const m of loaded.materials) m.dispose();
        for (const t of loaded.textures) t.dispose();
        return;
      }
      exteriorShell = loaded;
      for (const g of loaded.geometries) geometriesToDispose.add(g);
      for (const m of loaded.materials) {
        materialsToDispose.add(m);
        registerClippableMaterial(m);
      }
      for (const t of loaded.textures) texturesToDispose.add(t);
      syncExteriorShellState();
      scene.add(loaded.group);
    })
    .catch((err) => {
      console.error('Failed to load registered exterior GLB shell:', err);
    });

  const applyEffectiveQualityTier = (nextTier: QualityTier): void => {
    const tierChanged = nextTier !== effectiveTier;
    effectiveTier = nextTier;
    effectivePixelRatio =
      effectiveTier === 'phone' ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(effectivePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (effectiveTier === 'phone') {
      renderer.shadowMap.enabled = false;
      keyLight.castShadow = false;
      if (keyLight.shadow.map) {
        if (keyLight.shadow.map.depthTexture) {
          keyLight.shadow.map.depthTexture.dispose();
          keyLight.shadow.map.depthTexture = null;
        }
        keyLight.shadow.map.dispose();
        keyLight.shadow.map = null;
      }
    } else {
      renderer.shadowMap.enabled = true;
      keyLight.castShadow = true;
      renderer.shadowMap.needsUpdate = true;
    }

    if (tierChanged) {
      for (const mat of materialsToDispose) {
        mat.needsUpdate = true;
      }
    }
  };

  const onResize = (): void => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    const resolved = resolveEffectiveTier(qualityMode, window.innerWidth);
    applyEffectiveQualityTier(resolved);
  };
  window.addEventListener('resize', onResize);

  const setExteriorVisible = (visible: boolean): void => {
    exteriorVisible = visible;
    syncExteriorShellState();
  };

  const getExteriorVisible = (): boolean => exteriorVisible;

  const setXrayEnabled = (enabled: boolean): void => {
    xrayEnabled = enabled;
    syncExteriorShellState();
  };

  const getXrayEnabled = (): boolean => xrayEnabled;

  const setExplodeFactor = (factor: number): void => {
    const next = clampExplodeFactor(factor);
    if (next === explodeFactor) {
      return;
    }
    explodeFactor = next;
    if (v8Batches) {
      applyHeadAndInjectorTransforms(v8Batches);
      applyV8KinematicState(
        v8Batches,
        lastState,
        normalizeAngle720(lastState.crankAngleDeg),
      );
    }
  };

  const getExplodeFactor = (): number => explodeFactor;

  const setSectionState = (mode: SectionMode, positionMm?: number): void => {
    sectionMode = mode;
    if (mode === 'off') {
      activeClippingPlanes = null;
    } else {
      const targetPosMm =
        positionMm !== undefined ? positionMm : SECTION_RANGES_MM[mode].defaultMm;
      sectionPositionMm = clampSectionPositionMm(mode, targetPosMm);
      buildSectionPlane(mode, sectionPositionMm, sectionPlane);
      activeClippingPlanes = [sectionPlane];
    }
    for (const mat of clippableMaterials) {
      mat.clippingPlanes = activeClippingPlanes;
    }
  };

  const getSectionState = (): SectionState => ({
    mode: sectionMode,
    positionMm: sectionPositionMm,
  });

  const projectLabelAnchors = (
    viewportWidthPx: number,
    viewportHeightPx: number,
  ): ProjectedLabelAnchor[] => {
    camera.updateMatrixWorld();
    const evaluated = evaluateLabelAnchors(
      lastState,
      explodeFactor,
      config,
      valveCfg,
      detailCfg,
      layout,
    );

    return evaluated.map((anchor) => {
      const allowedByView = isLabelVisibleUnderViewRules(anchor.category, anchor.worldM, {
        exteriorVisible,
        xrayEnabled,
        sectionMode,
        sectionPositionMm,
      });

      projWorldVec.set(anchor.worldM[0], anchor.worldM[1], anchor.worldM[2]);

      // Direct signed-distance check against the live THREE.Plane when a section is active
      if (sectionMode !== 'off' && sectionPlane.distanceToPoint(projWorldVec) < 0) {
        return {
          id: anchor.id,
          text: anchor.text,
          xPx: 0,
          yPx: 0,
          visible: false,
        };
      }

      // Behind-camera check in view space (camera looks down -Z; points with z >= -near are behind/clipped)
      projViewVec.copy(projWorldVec).applyMatrix4(camera.matrixWorldInverse);
      if (projViewVec.z >= -camera.near) {
        return {
          id: anchor.id,
          text: anchor.text,
          xPx: 0,
          yPx: 0,
          visible: false,
        };
      }

      projNdcVec.copy(projWorldVec).project(camera);
      const xPx = (projNdcVec.x * 0.5 + 0.5) * viewportWidthPx;
      const yPx = (-projNdcVec.y * 0.5 + 0.5) * viewportHeightPx;

      const inClipDepth = projNdcVec.z >= -1 && projNdcVec.z <= 1;
      const inViewport =
        Number.isFinite(xPx) &&
        Number.isFinite(yPx) &&
        xPx >= 0 &&
        xPx <= viewportWidthPx &&
        yPx >= 0 &&
        yPx <= viewportHeightPx;

      return {
        id: anchor.id,
        text: anchor.text,
        xPx,
        yPx,
        visible: allowedByView && inClipDepth && inViewport,
      };
    });
  };

  const setQualityMode = (mode: QualityMode): void => {
    qualityMode = mode;
    applyEffectiveQualityTier(resolveEffectiveTier(qualityMode, window.innerWidth));
  };

  const getQualityMode = (): QualityMode => qualityMode;
  const getEffectiveQualityTier = (): QualityTier => effectiveTier;

  const setCameraPose = (
    position: [number, number, number],
    target: [number, number, number],
  ): void => {
    camera.position.set(position[0], position[1], position[2]);
    controls.target.set(target[0], target[1], target[2]);
    controls.update();
  };

  const getCameraPose = (): CameraPose => ({
    position: [camera.position.x, camera.position.y, camera.position.z],
    target: [controls.target.x, controls.target.y, controls.target.z],
  });

  const update = (state: CrankState): void => {
    lastState = state;
    const normalizedTheta = normalizeAngle720(state.crankAngleDeg);

    if (v8Batches) {
      applyV8KinematicState(v8Batches, state, normalizedTheta);
    }

    controls.update();
    renderer.render(scene, camera);
  };

  const getRenderStats = (): EngineRenderStats => {
    const extTextureBytes = exteriorShell ? exteriorShell.uniqueTextureBytes : 0;
    const shadowMapBytes =
      effectiveTier === 'full' && keyLight.shadow.map !== null ? SHADOW_MAP_2048_BYTES : 0;
    const pmremBytes = hdriLoaded ? STUDIO_PMREM_AND_LUT_BYTES : 0;
    const totalVramBytes = pmremBytes + shadowMapBytes + extTextureBytes;

    return {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      lines: renderer.info.render.lines,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      detailedLoaded: v8Batches !== null,
      hdriLoaded,
      exteriorLoaded: exteriorShell !== null,
      exteriorVisible,
      xrayEnabled,
      explodeFactor,
      sectionMode,
      sectionPositionMm,
      exteriorMergedMeshes: exteriorShell ? exteriorShell.mergedMeshCount : 0,
      exteriorSceneTriangles: exteriorShell ? exteriorShell.totalTriangles : 0,
      internalSceneTriangles: v8Batches ? v8Batches.totalTriangles : 0,
      mainShaftTriangles: mainShaft.triangles,
      groundTriangles: groundSegments,
      qualityMode,
      effectiveQualityTier: effectiveTier,
      effectivePixelRatio,
      estimatedTextureVramMiB: +(totalVramBytes / (1024 * 1024)).toFixed(2),
    };
  };

  const getGpuRenderer = (): string => {
    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const unmasked = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string | null;
      if (unmasked) return unmasked;
    }
    return String(gl.getParameter(gl.RENDERER) ?? 'Unknown WebGL2 Renderer');
  };

  const dispose = (): void => {
    disposed = true;
    window.removeEventListener('resize', onResize);
    controls.dispose();
    if (envRenderTarget) {
      envRenderTarget.dispose();
      envRenderTarget = null;
    }
    if (keyLight.shadow.map) {
      if (keyLight.shadow.map.depthTexture) {
        keyLight.shadow.map.depthTexture.dispose();
        keyLight.shadow.map.depthTexture = null;
      }
      keyLight.shadow.map.dispose();
      keyLight.shadow.map = null;
    }
    for (const geo of geometriesToDispose) {
      geo.dispose();
    }
    for (const mat of materialsToDispose) {
      mat.dispose();
    }
    for (const tex of texturesToDispose) {
      tex.dispose();
    }
    exteriorMaterialSnapshots.clear();
    clippableMaterials.clear();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return {
    update,
    setExteriorVisible,
    getExteriorVisible,
    setXrayEnabled,
    getXrayEnabled,
    setExplodeFactor,
    getExplodeFactor,
    setSectionState,
    getSectionState,
    projectLabelAnchors,
    setQualityMode,
    getQualityMode,
    getEffectiveQualityTier,
    setCameraPose,
    getCameraPose,
    getRenderStats,
    getGpuRenderer,
    dispose,
  };
}
