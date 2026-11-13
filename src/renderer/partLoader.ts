// GLB part loader with the single Asset Contract coordinate-frame conversion (Milestone 2, D-011).
// Blender authors parts with +Z = bore axis and +X = crank axis, exported with glTF Y-up ON
// (so bore axis is +Y and valley W is -Z in glTF file space).
// Wrapping once with rotation.x = +Math.PI / 2 maps glTF (+X, +Y, -Z) back to part-local (+X, +Z, +Y),
// restoring part-local (+X crank, +Y valley W, +Z bore).

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

const GLTF_YUP_TO_PART_ZUP_RAD = Math.PI / 2;

export function createPartLoader(): GLTFLoader {
  return new GLTFLoader();
}

export function loadPartGltf(loader: GLTFLoader, url: string): Promise<GLTF> {
  return loader.loadAsync(url);
}

/**
 * Wraps a glTF Y-up object once so the returned outer Group operates in the part-local frame:
 * origin at part pivot, +X along crank axis, +Y along bank valley W, +Z along bore axis.
 */
export function wrapInPartLocalFrame(gltfObject: THREE.Object3D, wrapperName?: string): THREE.Group {
  const partLocalGroup = new THREE.Group();
  if (wrapperName) {
    partLocalGroup.name = wrapperName;
  }

  const frameConversionGroup = new THREE.Group();
  frameConversionGroup.name = 'gltf_yup_to_part_zup';
  frameConversionGroup.rotation.x = GLTF_YUP_TO_PART_ZUP_RAD;
  frameConversionGroup.add(gltfObject);

  partLocalGroup.add(frameConversionGroup);
  return partLocalGroup;
}

/**
 * Extracts a named contract node from a loaded GLTF, clones its hierarchy, enables shadow casting
 * for the detailed assembly, and wraps it once in the part-local coordinate frame.
 */
export function extractPartInstance(
  gltf: GLTF,
  nodeName: string,
  enableShadows = true,
): THREE.Group {
  const sourceNode = gltf.scene.getObjectByName(nodeName);
  if (!sourceNode) {
    throw new Error(`Contract node "${nodeName}" not found in loaded GLTF scene.`);
  }

  const cloned = sourceNode.clone(true);
  cloned.position.set(0, 0, 0);
  cloned.quaternion.identity();
  cloned.scale.set(1, 1, 1);

  cloned.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = enableShadows;
      child.receiveShadow = enableShadows;
    }
  });

  return wrapInPartLocalFrame(cloned, `${nodeName}_instance`);
}
