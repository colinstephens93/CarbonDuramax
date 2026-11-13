// Milestone 1 primitive 8-cylinder engine renderer (D-007, D-011, D-012).
// Positioned every frame strictly from pure math-core outputs (computeState + crankPinPositionM).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ValveConfig } from '../config/valveConfig';
import type { Bank, CrankState, CylinderId, EngineConfig } from '../core/interfaces';
import { bankBoreAxis, crankPinPositionM, phaseOffsetDeg } from '../core/kinematics';

const CYLINDERS: readonly CylinderId[] = [1, 2, 3, 4, 5, 6, 7, 8];
const LOCAL_Y_AXIS = new THREE.Vector3(0, 1, 0);

interface CylinderVisuals {
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

export interface EngineSceneController {
  update(state: CrankState): void;
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

export function createEngineScene(
  container: HTMLElement,
  config: EngineConfig,
  valveCfg: ValveConfig,
): EngineSceneController {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0e14);

  // Project coordinate frame (D-011): origin on crank axis at rear block plane,
  // +X toward front accessory drive, +Y vehicle LH, +Z up.
  const borePitchM = valveCfg.borePitch.value / 1000;
  const boreM = config.boreMm.value / 1000;
  const crankThrowM = config.crankThrowMm.value / 1000;
  const rodLengthM = config.rodLengthMm.value / 1000;
  const deckGapM = valveCfg.deckGap.value / 1000;

  const blockLengthXM = 4 * borePitchM;
  const centerXM = 0.5 * blockLengthXM;

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.02, 20);
  // Set +Z up BEFORE constructing OrbitControls so OrbitControls captures +Z as its vertical orbit axis.
  camera.up.set(0, 0, 1);
  camera.position.set(centerXM + 0.72, -0.66, 0.48);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.25;
  controls.maxDistance = 4.0;
  controls.target.set(centerXM, 0, 0.11);
  controls.update();

  // Studio-style multi-point lighting for clear depth cues on dark background.
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.9);
  hemiLight.position.set(0, 0, 2);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(1.4, -1.1, 1.6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.0);
  fillLight.position.set(-0.9, 1.3, 0.9);
  scene.add(fillLight);

  // Primitive proportions derived strictly from config dimensions.
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

  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];

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

  // Static block/head wireframe enclosure per bank, tilted by bankBoreAxis ('RH' and 'LH').
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

  // Shared moving-part geometries & materials.
  const pistonGeo = new THREE.CylinderGeometry(pistonRadiusM, pistonRadiusM, pistonHeightM, 28);
  // Pre-rotate unit-length rod cylinder so its length axis is local +Z for lookAt + scale.z.
  const rodGeo = new THREE.CylinderGeometry(rodRadiusM, rodRadiusM * 1.15, 1, 16);
  rodGeo.rotateX(Math.PI / 2);

  // With mesh.up = (1, 0, 0) and lookAt target in the YZ plane:
  // local Z = radial throw direction, local Y = world +X (axial thickness), local X = transverse YZ width.
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

  const cylinderVisuals: CylinderVisuals[] = CYLINDERS.map((cylinder) => {
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

  // Reusable scratch vectors to avoid per-frame heap allocations.
  const crankPinVec = new THREE.Vector3();
  const wristPinVec = new THREE.Vector3();
  const webTargetVec = new THREE.Vector3();

  const onResize = (): void => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  const update = (state: CrankState): void => {
    const normalizedTheta = normalizeAngle720(state.crankAngleDeg);

    for (const item of cylinderVisuals) {
      const { cylinder, bank, boreAxis } = item;
      const [stationX, pinY, pinZ] = crankPinPositionM(
        config,
        valveCfg,
        cylinder,
        state.crankAngleDeg,
      );
      const pistonDispBelowTdcM = state.pistonPositionM[cylinder];
      const lifts = state.valveLiftM[cylinder];

      // Wrist-pin point = TDC wrist-pin position minus p(alpha) along the bank bore axis.
      const wristAlongBoreM = tdcWristDistM - pistonDispBelowTdcM;
      wristPinVec.set(
        stationX,
        wristAlongBoreM * boreAxis.y,
        wristAlongBoreM * boreAxis.z,
      );
      crankPinVec.set(stationX, pinY, pinZ);

      // Piston centered at wrist-pin point, highlighted if local cycle angle is within [0, 90).
      item.piston.position.copy(wristPinVec);
      const localAngleDeg = normalizeAngle720(normalizedTheta - phaseOffsetDeg(config, cylinder));
      const inFiringWindow = localAngleDeg >= 0 && localAngleDeg < 90;
      if (inFiringWindow !== item.isHighlighted) {
        item.piston.material = inFiringWindow ? pistonFiringMat : pistonStandardMat;
        item.isHighlighted = inFiringWindow;
      }

      // Connecting rod stretched between crank-pin point and wrist-pin point.
      item.rod.position.lerpVectors(crankPinVec, wristPinVec, 0.5);
      item.rod.lookAt(wristPinVec);
      item.rod.scale.set(1, 1, crankPinVec.distanceTo(wristPinVec));

      // Crank web rotating with the pin (RH/LH cheeks flank stationX to avoid coplanar Z-fighting).
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

      // Intake and exhaust valve discs at head end of bore axis, offset toward piston by lift.
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

    controls.update();
    renderer.render(scene, camera);
  };

  const dispose = (): void => {
    window.removeEventListener('resize', onResize);
    controls.dispose();
    for (const geo of geometriesToDispose) {
      geo.dispose();
    }
    for (const mat of materialsToDispose) {
      mat.dispose();
    }
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { update, dispose };
}
