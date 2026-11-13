// Milestone 2 hybrid 8-cylinder engine renderer + draft studio look (D-007, D-011, D-012, D-024).
// Cylinder 1 uses the Blender-built detailed GLB assembly; Cylinders 2-8 keep Milestone 1 primitives.
// Driven every frame strictly from unchanged Milestone 1 core outputs + config dimensions.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { detailConfig as defaultDetailConfig, type DetailConfig } from '../config/detailConfig';
import type { ValveConfig } from '../config/valveConfig';
import type { Bank, CrankState, CylinderId, EngineConfig } from '../core/interfaces';
import { bankBoreAxis, computeState, crankPinPositionM, phaseOffsetDeg } from '../core/kinematics';
import { createPartLoader, extractPartInstance, loadPartGltf } from './partLoader';

const PRIMITIVE_CYLINDERS: readonly CylinderId[] = [2, 3, 4, 5, 6, 7, 8];
const DETAILED_CYLINDER: CylinderId = 1;

const LOCAL_Y_AXIS = new THREE.Vector3(0, 1, 0);
const UNIT_X_AXIS = new THREE.Vector3(1, 0, 0);
const FIRING_EMISSIVE_COLOR = new THREE.Color(0xf97316);
const BLACK_COLOR = new THREE.Color(0x000000);
const FIRING_EMISSIVE_INTENSITY = 0.85;

interface PrimitiveCylinderVisuals {
  cylinder: CylinderId;
  bank: Bank;
  boreAxis: THREE.Vector3;
  piston: THREE.Mesh;
  rod: THREE.Mesh;
  crankWeb: THREE.Mesh;
  crankPinJournal: THREE.Mesh;
  intakeValve: THREE.Mesh;
  exhaustValve: THREE.Mesh;
  isHighlighted: boolean;
}

interface DetailedCylinder1Assembly {
  root: THREE.Group;
  piston: THREE.Group;
  pistonMaterials: THREE.MeshStandardMaterial[];
  isPistonHighlighted: boolean;
  conrod: THREE.Group;
  crankThrow: THREE.Group;
  head: THREE.Group;
  injector: THREE.Group;
  // Intake pair sits on the valley side (+W = +valveRowOffsetMm); exhaust pair sits on the outer side (-W).
  intakeValves: [THREE.Group, THREE.Group];
  intakeSprings: [THREE.Group, THREE.Group];
  exhaustValves: [THREE.Group, THREE.Group];
  exhaustSprings: [THREE.Group, THREE.Group];
  intakeBridge: THREE.Group;
  exhaustBridge: THREE.Group;
  intakeRocker: THREE.Group;
  exhaustRocker: THREE.Group;
  intakePushrod: THREE.Group;
  exhaustPushrod: THREE.Group;
  intakeLifter: THREE.Group;
  exhaustLifter: THREE.Group;
}

export interface EngineRenderStats {
  calls: number;
  triangles: number;
  lines: number;
  geometries: number;
  textures: number;
  detailedLoaded: boolean;
  hdriLoaded: boolean;
}

export interface EngineSceneController {
  update(state: CrankState): void;
  getRenderStats(): EngineRenderStats;
  getGpuRenderer(): string;
  dispose(): void;
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

function clonePistonMaterialsForHighlight(pistonRoot: THREE.Object3D): THREE.MeshStandardMaterial[] {
  const clonedMaterials: THREE.MeshStandardMaterial[] = [];
  const cloneMap = new Map<THREE.Material, THREE.Material>();

  pistonRoot.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const cloneSingle = (mat: THREE.Material): THREE.Material => {
      const existing = cloneMap.get(mat);
      if (existing) return existing;
      const copy = mat.clone();
      cloneMap.set(mat, copy);
      if (copy instanceof THREE.MeshStandardMaterial) {
        clonedMaterials.push(copy);
      }
      return copy;
    };

    if (Array.isArray(child.material)) {
      child.material = child.material.map(cloneSingle);
    } else if (child.material) {
      child.material = cloneSingle(child.material);
    }
  });

  return clonedMaterials;
}

export function createEngineScene(
  container: HTMLElement,
  config: EngineConfig,
  valveCfg: ValveConfig,
  detailCfg: DetailConfig = defaultDetailConfig,
): EngineSceneController {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // Draft studio look (D-024): solid dark studio backdrop; HDRI illuminates via scene.environment only.
  scene.background = new THREE.Color(0x0b0b0d);
  scene.fog = new THREE.FogExp2(0x0b0b0d, 0.11);
  // Rotate Y-up equirectangular studio HDRI by +90 deg about +X so studio ceiling softboxes sit at +Z (up).
  scene.environmentRotation.set(Math.PI / 2, 0, 0);
  scene.environmentIntensity = 0.8;

  // Project coordinate frame (D-011): origin on crank axis at rear block plane,
  // +X toward front accessory drive, +Y vehicle LH, +Z up.
  const borePitchM = valveCfg.borePitch.value / 1000;
  const boreM = config.boreMm.value / 1000;
  const crankThrowM = config.crankThrowMm.value / 1000;
  const rodLengthM = config.rodLengthMm.value / 1000;
  const deckGapM = valveCfg.deckGap.value / 1000;

  // Detailed Cylinder-1 config constants (meters)
  const pistonCompHeightM = detailCfg.pistonCompressionHeightMm.value / 1000;
  const valveInsetM = detailCfg.valveInsetMm.value / 1000;
  const valveHalfPairXM = 0.5 * (detailCfg.valvePairSpacingMm.value / 1000);
  const valveRowOffsetM = detailCfg.valveRowOffsetMm.value / 1000;
  const springSeatHeightM = detailCfg.springSeatHeightMm.value / 1000;
  const springInstalledLenM = detailCfg.springFreeLengthMm.value / 1000;
  const rockerShaftHeightM = detailCfg.rockerShaftHeightMm.value / 1000;
  const rockerCupXM = detailCfg.rockerTailXOffsetMm.value / 1000;
  const rockerCupWM = detailCfg.rockerTailValleyOffsetMm.value / 1000;
  const lifterValleyWM = detailCfg.pushrodValleyOffsetMm.value / 1000;
  const lifterRestBM = detailCfg.lifterTopBoreOffsetMm.value / 1000;
  const pushrodNominalLenM = detailCfg.pushrodLengthMm.value / 1000;

  const blockLengthXM = 4 * borePitchM;
  const centerXM = 0.5 * blockLengthXM;

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.02, 20);
  // Set +Z up BEFORE constructing OrbitControls so OrbitControls captures +Z as its vertical orbit axis.
  camera.up.set(0, 0, 1);
  camera.position.set(centerXM + 0.72, -0.68, 0.52);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.22;
  controls.maxDistance = 4.0;
  controls.target.set(centerXM + 0.04, -0.02, 0.13);
  controls.update();

  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];
  let envRenderTarget: THREE.WebGLCubeRenderTarget | null = null;
  let disposed = false;
  let hdriLoaded = false;

  // Draft studio lighting: HDRI environment + single directional key light casting soft shadow
  // onto a large dark ground plane below the engine (M1 hemisphere and fill lights removed).
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
  keyLight.position.set(centerXM + 0.55, -0.45, 1.35);
  keyLight.target.position.set(centerXM + 0.10, -0.10, 0.10);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.3;
  keyLight.shadow.camera.far = 2.6;
  keyLight.shadow.camera.left = -0.55;
  keyLight.shadow.camera.right = 0.55;
  keyLight.shadow.camera.top = 0.55;
  keyLight.shadow.camera.bottom = -0.55;
  keyLight.shadow.bias = -0.0003;
  keyLight.shadow.normalBias = 0.002;
  keyLight.shadow.radius = 3.5;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Large dark studio ground disc positioned below crank counterweight sweep (Z = -0.095 m)
  const groundGeo = new THREE.CircleGeometry(18, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0d0e12,
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.12,
  });
  geometriesToDispose.push(groundGeo);
  materialsToDispose.push(groundMat);

  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.set(centerXM, 0, -0.095);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

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

  // Primitive proportions derived strictly from config dimensions (unchanged from M1 for Cylinders 2-8).
  const boreRadiusM = 0.5 * boreM;
  const pistonRadiusM = boreRadiusM * 0.94;
  const pistonHeightM = boreM * 0.42;
  const rodRadiusM = boreM * 0.075;
  const valveRadiusM = boreRadiusM * 0.34;
  const valveThicknessM = boreM * 0.048;
  const valveLateralOffsetXM = boreRadiusM * 0.42;
  const webThicknessXM = borePitchM * 0.07;
  const webWidthM = boreM * 0.24;
  const webLengthM = crankThrowM * 1.45;
  const webAxialOffsetXM = borePitchM * 0.12;

  const tdcWristDistM = crankThrowM + rodLengthM;
  const bdcWristDistM = rodLengthM - crankThrowM;
  const headDeckDistM = tdcWristDistM + 0.5 * pistonHeightM + deckGapM;
  const closedValveCenterDistM = headDeckDistM + 0.5 * valveThicknessM;

  // Detailed Cylinder-1 deck & valvetrain reference planes along bore axis B (meters from crank axis)
  const detailedDeckBM = tdcWristDistM + pistonCompHeightM + deckGapM;
  const detailedSpringSeatBM = detailedDeckBM + springSeatHeightM;
  const detailedRockerShaftBM = detailedDeckBM + rockerShaftHeightM;

  // Static crank-axis reference line/journal from x = 0 (rear block plane) through front plane.
  const crankMainGeo = new THREE.CylinderGeometry(
    boreM * 0.09,
    boreM * 0.09,
    blockLengthXM,
    20,
  );
  crankMainGeo.rotateZ(Math.PI / 2);
  geometriesToDispose.push(crankMainGeo);

  const crankMainMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.65,
    roughness: 0.4,
  });
  materialsToDispose.push(crankMainMat);

  const crankMainMesh = new THREE.Mesh(crankMainGeo, crankMainMat);
  crankMainMesh.position.set(centerXM, 0, 0);
  scene.add(crankMainMesh);

  // Static M1 block/head wireframe & translucent enclosure per bank (unchanged per M2 spec).
  const bankMinAlongBoreM = bdcWristDistM - 0.5 * pistonHeightM - boreM * 0.08;
  const bankMaxAlongBoreM = headDeckDistM + boreM * 0.22;
  const bankSpanAlongBoreM = bankMaxAlongBoreM - bankMinAlongBoreM;
  const bankMidAlongBoreM = 0.5 * (bankMinAlongBoreM + bankMaxAlongBoreM);
  const bankWidthPerpM = boreM * 1.16;

  const bankBoxGeo = new THREE.BoxGeometry(blockLengthXM, bankSpanAlongBoreM, bankWidthPerpM);
  const bankEdgesGeo = new THREE.EdgesGeometry(bankBoxGeo);
  geometriesToDispose.push(bankBoxGeo, bankEdgesGeo);

  const bankShellMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.2,
    roughness: 0.7,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
  });
  const bankWireMat = new THREE.LineBasicMaterial({
    color: 0x475569,
    transparent: true,
    opacity: 0.65,
  });
  materialsToDispose.push(bankShellMat, bankWireMat);

  for (const bank of ['RH', 'LH'] as const) {
    const axisTuple = bankBoreAxis(bank);
    const axisVec = new THREE.Vector3(axisTuple[0], axisTuple[1], axisTuple[2]);
    const bankQuat = new THREE.Quaternion().setFromUnitVectors(LOCAL_Y_AXIS, axisVec);

    const bankPos = new THREE.Vector3(
      centerXM,
      bankMidAlongBoreM * axisTuple[1],
      bankMidAlongBoreM * axisTuple[2],
    );

    const shellMesh = new THREE.Mesh(bankBoxGeo, bankShellMat);
    shellMesh.position.copy(bankPos);
    shellMesh.quaternion.copy(bankQuat);
    scene.add(shellMesh);

    const wireSegments = new THREE.LineSegments(bankEdgesGeo, bankWireMat);
    wireSegments.position.copy(bankPos);
    wireSegments.quaternion.copy(bankQuat);
    scene.add(wireSegments);
  }

  // Shared M1 primitive moving-part geometries & materials for Cylinders 2-8 (Cylinder 1 excluded).
  const pistonGeo = new THREE.CylinderGeometry(pistonRadiusM, pistonRadiusM, pistonHeightM, 28);
  const rodGeo = new THREE.CylinderGeometry(rodRadiusM, rodRadiusM * 1.15, 1, 16);
  rodGeo.rotateX(Math.PI / 2);

  const crankWebGeo = new THREE.BoxGeometry(webWidthM, webThicknessXM, webLengthM);
  const crankPinJournalGeo = new THREE.CylinderGeometry(
    rodRadiusM * 1.15,
    rodRadiusM * 1.15,
    webAxialOffsetXM * 1.1,
    16,
  );
  crankPinJournalGeo.rotateZ(Math.PI / 2);

  const valveDiscGeo = new THREE.CylinderGeometry(valveRadiusM, valveRadiusM, valveThicknessM, 20);
  geometriesToDispose.push(pistonGeo, rodGeo, crankWebGeo, crankPinJournalGeo, valveDiscGeo);

  const pistonStandardMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.55,
    roughness: 0.35,
  });
  const pistonFiringMat = new THREE.MeshStandardMaterial({
    color: 0xfb923c,
    emissive: new THREE.Color(0xf97316),
    emissiveIntensity: 0.85,
    metalness: 0.35,
    roughness: 0.3,
  });
  const rodMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.7,
    roughness: 0.35,
  });
  const webMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.75,
    roughness: 0.4,
  });
  const intakeValveMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.45,
    roughness: 0.35,
  });
  const exhaustValveMat = new THREE.MeshStandardMaterial({
    color: 0xf87171,
    metalness: 0.45,
    roughness: 0.35,
  });

  materialsToDispose.push(
    pistonStandardMat,
    pistonFiringMat,
    rodMat,
    webMat,
    intakeValveMat,
    exhaustValveMat,
  );

  const primitiveVisuals: PrimitiveCylinderVisuals[] = PRIMITIVE_CYLINDERS.map((cylinder) => {
    const bank = config.bankAssignment[cylinder];
    const axisTuple = bankBoreAxis(bank);
    const boreAxis = new THREE.Vector3(axisTuple[0], axisTuple[1], axisTuple[2]);
    const boreQuat = new THREE.Quaternion().setFromUnitVectors(LOCAL_Y_AXIS, boreAxis);

    const piston = new THREE.Mesh(pistonGeo, pistonStandardMat);
    piston.quaternion.copy(boreQuat);
    scene.add(piston);

    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.up.set(1, 0, 0);
    scene.add(rod);

    const crankWeb = new THREE.Mesh(crankWebGeo, webMat);
    crankWeb.up.set(1, 0, 0);
    scene.add(crankWeb);

    const crankPinJournal = new THREE.Mesh(crankPinJournalGeo, rodMat);
    scene.add(crankPinJournal);

    const intakeValve = new THREE.Mesh(valveDiscGeo, intakeValveMat);
    intakeValve.quaternion.copy(boreQuat);
    scene.add(intakeValve);

    const exhaustValve = new THREE.Mesh(valveDiscGeo, exhaustValveMat);
    exhaustValve.quaternion.copy(boreQuat);
    scene.add(exhaustValve);

    return {
      cylinder,
      bank,
      boreAxis,
      piston,
      rod,
      crankWeb,
      crankPinJournal,
      intakeValve,
      exhaustValve,
      isHighlighted: false,
    };
  });

  // Cylinder 1 bank coordinate frame:
  // +X = crank axis (1, 0, 0)
  // +B = bankBoreAxis('RH') = (0, -sin45, cos45)
  // +W = +B x +X = (0, +cos45, +sin45) pointing toward the V-valley
  const cyl1Bank = config.bankAssignment[DETAILED_CYLINDER];
  const cyl1BoreTuple = bankBoreAxis(cyl1Bank);
  const cyl1AxisB = new THREE.Vector3(cyl1BoreTuple[0], cyl1BoreTuple[1], cyl1BoreTuple[2]);
  const cyl1AxisW = new THREE.Vector3().crossVectors(cyl1AxisB, UNIT_X_AXIS).normalize();
  const cyl1BankBasisMat = new THREE.Matrix4().makeBasis(UNIT_X_AXIS, cyl1AxisW, cyl1AxisB);
  const cyl1BankQuat = new THREE.Quaternion().setFromRotationMatrix(cyl1BankBasisMat);

  const setCyl1BankWorldPos = (
    out: THREE.Vector3,
    stationX: number,
    localX: number,
    localW: number,
    localB: number,
  ): THREE.Vector3 => {
    out.set(
      stationX + localX,
      localW * cyl1AxisW.y + localB * cyl1AxisB.y,
      localW * cyl1AxisW.z + localB * cyl1AxisB.z,
    );
    return out;
  };

  let cyl1Assembly: DetailedCylinder1Assembly | null = null;
  let lastState: CrankState = computeState(config, 0, 900, valveCfg);

  // Reusable scratch math objects to prevent per-frame heap allocations
  const crankPinVec = new THREE.Vector3();
  const wristPinVec = new THREE.Vector3();
  const webTargetVec = new THREE.Vector3();
  const aimX = new THREE.Vector3();
  const aimY = new THREE.Vector3();
  const aimZ = new THREE.Vector3();
  const aimMat = new THREE.Matrix4();
  const localRotQuat = new THREE.Quaternion();
  const lifterTopVec = new THREE.Vector3();
  const cupLiveVec = new THREE.Vector3();

  /**
   * Aims a part's local +Z from startPt toward endPt while keeping local +X
   * as close to project +X (crank axis) as the aim vector allows.
   */
  const applyAimConvention = (
    partGroup: THREE.Group,
    startPt: THREE.Vector3,
    endPt: THREE.Vector3,
  ): number => {
    aimZ.subVectors(endPt, startPt);
    const dist = aimZ.length();
    if (dist > 1e-9) {
      aimZ.multiplyScalar(1 / dist);
    } else {
      aimZ.copy(cyl1AxisB);
    }
    aimX.set(1, 0, 0).addScaledVector(aimZ, -aimZ.x).normalize();
    aimY.crossVectors(aimZ, aimX).normalize();
    aimMat.makeBasis(aimX, aimY, aimZ);
    partGroup.position.copy(startPt);
    partGroup.quaternion.setFromRotationMatrix(aimMat);
    return dist;
  };

  const applyDetailedCylinder1State = (
    asm: DetailedCylinder1Assembly,
    state: CrankState,
    normalizedTheta: number,
  ): void => {
    const [stationX, pinY, pinZ] = crankPinPositionM(
      config,
      valveCfg,
      DETAILED_CYLINDER,
      state.crankAngleDeg,
    );
    const pM = state.pistonPositionM[DETAILED_CYLINDER];
    const intakeLiftM = state.valveLiftM[DETAILED_CYLINDER].intake;
    const exhaustLiftM = state.valveLiftM[DETAILED_CYLINDER].exhaust;

    // 1. Wrist-pin and crank-pin live points
    const wristBM = tdcWristDistM - pM;
    setCyl1BankWorldPos(wristPinVec, stationX, 0, 0, wristBM);
    crankPinVec.set(stationX, pinY, pinZ);

    // 2. Piston: slides along bore axis without rotating; firing highlight in [0, 90)
    asm.piston.position.copy(wristPinVec);
    asm.piston.quaternion.copy(cyl1BankQuat);

    const localAngleDeg = normalizeAngle720(
      normalizedTheta - phaseOffsetDeg(config, DETAILED_CYLINDER),
    );
    const inFiringWindow = localAngleDeg >= 0 && localAngleDeg < 90;
    if (inFiringWindow !== asm.isPistonHighlighted) {
      for (const mat of asm.pistonMaterials) {
        mat.emissive.copy(inFiringWindow ? FIRING_EMISSIVE_COLOR : BLACK_COLOR);
        mat.emissiveIntensity = inFiringWindow ? FIRING_EMISSIVE_INTENSITY : 0;
      }
      asm.isPistonHighlighted = inFiringWindow;
    }

    // 3. Connecting rod: origin at crank-pin point, +Z aimed at wrist-pin point (no scaling)
    applyAimConvention(asm.conrod, crankPinVec, wristPinVec);

    // 4. Crank throw: origin at (stationX, 0, 0), rotated about +X so pin coincides with crankPinPositionM
    aimZ.set(0, pinY, pinZ);
    if (aimZ.lengthSq() > 1e-12) {
      aimZ.normalize();
    } else {
      aimZ.copy(cyl1AxisB);
    }
    aimX.set(1, 0, 0);
    aimY.crossVectors(aimZ, aimX).normalize();
    aimMat.makeBasis(aimX, aimY, aimZ);
    asm.crankThrow.position.set(stationX, 0, 0);
    asm.crankThrow.quaternion.setFromRotationMatrix(aimMat);

    // 5. Valves & helical springs (intake at W = +valveRowOffsetM, exhaust at W = -valveRowOffsetM)
    const xOffsets: [number, number] = [-valveHalfPairXM, valveHalfPairXM];
    const intakeSpringScaleZ = (springInstalledLenM - intakeLiftM) / springInstalledLenM;
    const exhaustSpringScaleZ = (springInstalledLenM - exhaustLiftM) / springInstalledLenM;

    for (let i = 0; i < 2; i += 1) {
      const xOff = xOffsets[i]!;

      const inValve = asm.intakeValves[i]!;
      setCyl1BankWorldPos(
        inValve.position,
        stationX,
        xOff,
        +valveRowOffsetM,
        detailedDeckBM + valveInsetM - intakeLiftM,
      );
      inValve.quaternion.copy(cyl1BankQuat);

      const inSpring = asm.intakeSprings[i]!;
      setCyl1BankWorldPos(inSpring.position, stationX, xOff, +valveRowOffsetM, detailedSpringSeatBM);
      inSpring.quaternion.copy(cyl1BankQuat);
      inSpring.scale.set(1, 1, intakeSpringScaleZ);

      const exValve = asm.exhaustValves[i]!;
      setCyl1BankWorldPos(
        exValve.position,
        stationX,
        xOff,
        -valveRowOffsetM,
        detailedDeckBM + valveInsetM - exhaustLiftM,
      );
      exValve.quaternion.copy(cyl1BankQuat);

      const exSpring = asm.exhaustSprings[i]!;
      setCyl1BankWorldPos(exSpring.position, stationX, xOff, -valveRowOffsetM, detailedSpringSeatBM);
      exSpring.quaternion.copy(cyl1BankQuat);
      exSpring.scale.set(1, 1, exhaustSpringScaleZ);
    }

    // 6. Valve bridges: translate along bore toward piston by lift
    setCyl1BankWorldPos(
      asm.intakeBridge.position,
      stationX,
      0,
      +valveRowOffsetM,
      detailedRockerShaftBM - intakeLiftM,
    );
    asm.intakeBridge.quaternion.copy(cyl1BankQuat);

    setCyl1BankWorldPos(
      asm.exhaustBridge.position,
      stationX,
      0,
      -valveRowOffsetM,
      detailedRockerShaftBM - exhaustLiftM,
    );
    asm.exhaustBridge.quaternion.copy(cyl1BankQuat);

    // 7. Rocker castings: exact asin(lift / valveRowOffset), opposite signs so each pad moves -B
    const thetaIntake = Math.asin(Math.min(1, Math.max(-1, intakeLiftM / valveRowOffsetM)));
    const thetaExhaust = Math.asin(Math.min(1, Math.max(-1, exhaustLiftM / valveRowOffsetM)));

    setCyl1BankWorldPos(asm.intakeRocker.position, stationX, 0, 0, detailedRockerShaftBM);
    localRotQuat.setFromAxisAngle(UNIT_X_AXIS, -thetaIntake);
    asm.intakeRocker.quaternion.multiplyQuaternions(cyl1BankQuat, localRotQuat);

    setCyl1BankWorldPos(asm.exhaustRocker.position, stationX, 0, 0, detailedRockerShaftBM);
    localRotQuat.setFromAxisAngle(UNIT_X_AXIS, +thetaExhaust);
    asm.exhaustRocker.quaternion.multiplyQuaternions(cyl1BankQuat, localRotQuat);

    // 8. Lifters & pushrods (intake cup at X +60, W -19; exhaust cup at X -60, W +19; both lifters at W +19)
    const intakeRiseM = rockerCupWM * Math.sin(thetaIntake);
    setCyl1BankWorldPos(
      lifterTopVec,
      stationX,
      +rockerCupXM,
      +lifterValleyWM,
      lifterRestBM + intakeRiseM,
    );
    asm.intakeLifter.position.copy(lifterTopVec);
    asm.intakeLifter.quaternion.copy(cyl1BankQuat);

    setCyl1BankWorldPos(
      cupLiveVec,
      stationX,
      +rockerCupXM,
      -rockerCupWM * Math.cos(thetaIntake),
      detailedRockerShaftBM + intakeRiseM,
    );
    const intakeLiveLenM = applyAimConvention(asm.intakePushrod, lifterTopVec, cupLiveVec);
    asm.intakePushrod.scale.set(1, 1, intakeLiveLenM / pushrodNominalLenM);

    const exhaustRiseM = rockerCupWM * Math.sin(thetaExhaust);
    setCyl1BankWorldPos(
      lifterTopVec,
      stationX,
      -rockerCupXM,
      +lifterValleyWM,
      lifterRestBM + exhaustRiseM,
    );
    asm.exhaustLifter.position.copy(lifterTopVec);
    asm.exhaustLifter.quaternion.copy(cyl1BankQuat);

    setCyl1BankWorldPos(
      cupLiveVec,
      stationX,
      -rockerCupXM,
      +rockerCupWM * Math.cos(thetaExhaust),
      detailedRockerShaftBM + exhaustRiseM,
    );
    const exhaustLiveLenM = applyAimConvention(asm.exhaustPushrod, lifterTopVec, cupLiveVec);
    asm.exhaustPushrod.scale.set(1, 1, exhaustLiveLenM / pushrodNominalLenM);
  };

  // Load all 10 Cylinder-1 part GLBs asynchronously
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
        root.name = 'cylinder1_detailed_assembly';

        const piston = extractPartInstance(pistonGltf, 'rot_piston_c1_stock');
        const pistonMaterials = clonePistonMaterialsForHighlight(piston);
        materialsToDispose.push(...pistonMaterials);

        const conrod = extractPartInstance(conrodGltf, 'rot_conrod_c1_stock');
        const crankThrow = extractPartInstance(crankThrowGltf, 'rot_crankthrow_c1_stock');
        const head = extractPartInstance(headGltf, 'sta_head_c1_stock');
        const injector = extractPartInstance(injectorGltf, 'fuel_injector_c1_stock');

        const intakeValves: [THREE.Group, THREE.Group] = [
          extractPartInstance(intakeValveGltf, 'val_valve_intake_stock'),
          extractPartInstance(intakeValveGltf, 'val_valve_intake_stock'),
        ];
        const intakeSprings: [THREE.Group, THREE.Group] = [
          extractPartInstance(intakeValveGltf, 'val_spring_intake_stock'),
          extractPartInstance(intakeValveGltf, 'val_spring_intake_stock'),
        ];
        const exhaustValves: [THREE.Group, THREE.Group] = [
          extractPartInstance(exhaustValveGltf, 'val_valve_exhaust_stock'),
          extractPartInstance(exhaustValveGltf, 'val_valve_exhaust_stock'),
        ];
        const exhaustSprings: [THREE.Group, THREE.Group] = [
          extractPartInstance(exhaustValveGltf, 'val_spring_exhaust_stock'),
          extractPartInstance(exhaustValveGltf, 'val_spring_exhaust_stock'),
        ];

        const intakeBridge = extractPartInstance(bridgeGltf, 'val_bridge_stock');
        const exhaustBridge = extractPartInstance(bridgeGltf, 'val_bridge_stock');

        const intakeRocker = extractPartInstance(rockerGltf, 'val_rocker_intake_stock');
        const exhaustRocker = extractPartInstance(rockerGltf, 'val_rocker_exhaust_stock');

        const intakePushrod = extractPartInstance(pushrodGltf, 'val_pushrod_stock');
        const exhaustPushrod = extractPartInstance(pushrodGltf, 'val_pushrod_stock');
        const intakeLifter = extractPartInstance(pushrodGltf, 'val_lifter_stock');
        const exhaustLifter = extractPartInstance(pushrodGltf, 'val_lifter_stock');

        // Position static Cylinder-1 parts (head & center injector) from config values only
        const [cyl1StationX] = crankPinPositionM(config, valveCfg, DETAILED_CYLINDER, 0);
        setCyl1BankWorldPos(head.position, cyl1StationX, 0, 0, detailedDeckBM);
        head.quaternion.copy(cyl1BankQuat);

        setCyl1BankWorldPos(injector.position, cyl1StationX, 0, 0, detailedDeckBM);
        injector.quaternion.copy(cyl1BankQuat);

        root.add(
          piston,
          conrod,
          crankThrow,
          head,
          injector,
          ...intakeValves,
          ...intakeSprings,
          ...exhaustValves,
          ...exhaustSprings,
          intakeBridge,
          exhaustBridge,
          intakeRocker,
          exhaustRocker,
          intakePushrod,
          exhaustPushrod,
          intakeLifter,
          exhaustLifter,
        );

        // Enable shadows ONLY on Cylinder 1's detailed assembly (per M2 spec) and track resources
        const seenGeos = new Set<THREE.BufferGeometry>();
        const seenMats = new Set<THREE.Material>(materialsToDispose);
        root.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj.geometry && !seenGeos.has(obj.geometry)) {
            seenGeos.add(obj.geometry);
            geometriesToDispose.push(obj.geometry);
          }
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            if (m && !seenMats.has(m)) {
              seenMats.add(m);
              materialsToDispose.push(m);
            }
          }
        });

        cyl1Assembly = {
          root,
          piston,
          pistonMaterials,
          isPistonHighlighted: false,
          conrod,
          crankThrow,
          head,
          injector,
          intakeValves,
          intakeSprings,
          exhaustValves,
          exhaustSprings,
          intakeBridge,
          exhaustBridge,
          intakeRocker,
          exhaustRocker,
          intakePushrod,
          exhaustPushrod,
          intakeLifter,
          exhaustLifter,
        };

        scene.add(root);
        applyDetailedCylinder1State(
          cyl1Assembly,
          lastState,
          normalizeAngle720(lastState.crankAngleDeg),
        );
      },
    )
    .catch((err) => {
      console.error('Failed to load Cylinder 1 detailed GLB assembly:', err);
    });

  const onResize = (): void => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  const update = (state: CrankState): void => {
    lastState = state;
    const normalizedTheta = normalizeAngle720(state.crankAngleDeg);

    // Update Cylinders 2-8 primitive shapes (unchanged M1 behavior)
    for (const item of primitiveVisuals) {
      const { cylinder, bank, boreAxis } = item;
      const [stationX, pinY, pinZ] = crankPinPositionM(
        config,
        valveCfg,
        cylinder,
        state.crankAngleDeg,
      );
      const pistonDispBelowTdcM = state.pistonPositionM[cylinder];
      const lifts = state.valveLiftM[cylinder];

      const wristAlongBoreM = tdcWristDistM - pistonDispBelowTdcM;
      wristPinVec.set(
        stationX,
        wristAlongBoreM * boreAxis.y,
        wristAlongBoreM * boreAxis.z,
      );
      crankPinVec.set(stationX, pinY, pinZ);

      item.piston.position.copy(wristPinVec);
      const localAngleDeg = normalizeAngle720(normalizedTheta - phaseOffsetDeg(config, cylinder));
      const inFiringWindow = localAngleDeg >= 0 && localAngleDeg < 90;
      if (inFiringWindow !== item.isHighlighted) {
        item.piston.material = inFiringWindow ? pistonFiringMat : pistonStandardMat;
        item.isHighlighted = inFiringWindow;
      }

      item.rod.position.lerpVectors(crankPinVec, wristPinVec, 0.5);
      item.rod.lookAt(wristPinVec);
      item.rod.scale.set(1, 1, crankPinVec.distanceTo(wristPinVec));

      const bankSign = bank === 'RH' ? -1 : 1;
      const webXM = stationX + bankSign * webAxialOffsetXM;
      item.crankWeb.position.set(webXM, pinY * 0.35, pinZ * 0.35);
      webTargetVec.set(webXM, pinY, pinZ);
      item.crankWeb.lookAt(webTargetVec);

      item.crankPinJournal.position.set(
        stationX + bankSign * 0.55 * webAxialOffsetXM,
        pinY,
        pinZ,
      );

      const intakeDistM = closedValveCenterDistM - lifts.intake;
      item.intakeValve.position.set(
        stationX - valveLateralOffsetXM,
        intakeDistM * boreAxis.y,
        intakeDistM * boreAxis.z,
      );

      const exhaustDistM = closedValveCenterDistM - lifts.exhaust;
      item.exhaustValve.position.set(
        stationX + valveLateralOffsetXM,
        exhaustDistM * boreAxis.y,
        exhaustDistM * boreAxis.z,
      );
    }

    // Update Detailed Cylinder 1 assembly
    if (cyl1Assembly) {
      applyDetailedCylinder1State(cyl1Assembly, state, normalizedTheta);
    }

    controls.update();
    renderer.render(scene, camera);
  };

  const getRenderStats = (): EngineRenderStats => ({
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    lines: renderer.info.render.lines,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    detailedLoaded: cyl1Assembly !== null,
    hdriLoaded,
  });

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
    for (const geo of geometriesToDispose) {
      geo.dispose();
    }
    for (const mat of materialsToDispose) {
      mat.dispose();
    }
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { update, getRenderStats, getGpuRenderer, dispose };
}
