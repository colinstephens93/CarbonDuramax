// GLB part loader with the single Asset Contract coordinate-frame conversion (Milestone 2/3, D-011).
// Blender authors parts with +Z = bore axis and +X = crank axis, exported with glTF Y-up ON
// (so bore axis is +Y and valley W is -Z in glTF file space).
// Wrapping once with rotation.x = +Math.PI / 2 maps glTF (+X, +Y, -Z) back to part-local (+X, +Z, +Y),
// restoring part-local (+X crank, +Y valley W, +Z bore).

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

const GLTF_YUP_TO_PART_ZUP_RAD = Math.PI / 2;

export interface ExtractedPartPrimitive {
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.MeshStandardMaterial;
  readonly triangles: number;
}

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

function mirrorBufferGeometryAlongLocalXInPlace(geometry: THREE.BufferGeometry): void {
  const posAttr = geometry.getAttribute('position');
  if (posAttr instanceof THREE.BufferAttribute) {
    for (let i = 0; i < posAttr.count; i += 1) {
      posAttr.setX(i, -posAttr.getX(i));
    }
    posAttr.needsUpdate = true;
  }

  const normAttr = geometry.getAttribute('normal');
  if (normAttr instanceof THREE.BufferAttribute) {
    for (let i = 0; i < normAttr.count; i += 1) {
      normAttr.setX(i, -normAttr.getX(i));
    }
    normAttr.needsUpdate = true;
  }

  const tanAttr = geometry.getAttribute('tangent');
  if (tanAttr instanceof THREE.BufferAttribute) {
    for (let i = 0; i < tanAttr.count; i += 1) {
      tanAttr.setX(i, -tanAttr.getX(i));
      if (tanAttr.itemSize >= 4) {
        tanAttr.setW(i, -tanAttr.getW(i));
      }
    }
    tanAttr.needsUpdate = true;
  }

  // Reverse triangle winding so front-facing orientation stays CCW under proper (det = +1) transforms
  const index = geometry.getIndex();
  if (index) {
    const arr = index.array;
    for (let i = 0; i + 2 < arr.length; i += 3) {
      const tmp = arr[i + 1]!;
      (arr as Uint16Array | Uint32Array)[i + 1] = arr[i + 2]!;
      (arr as Uint16Array | Uint32Array)[i + 2] = tmp;
    }
    index.needsUpdate = true;
  } else if (posAttr instanceof THREE.BufferAttribute) {
    for (const attrName of Object.keys(geometry.attributes)) {
      const attr = geometry.getAttribute(attrName);
      if (!(attr instanceof THREE.BufferAttribute)) continue;
      const itemSize = attr.itemSize;
      const arr = attr.array as Float32Array;
      for (let tri = 0; tri + 2 < attr.count; tri += 3) {
        const bOffset = (tri + 1) * itemSize;
        const cOffset = (tri + 2) * itemSize;
        for (let k = 0; k < itemSize; k += 1) {
          const tmp = arr[bOffset + k]!;
          arr[bOffset + k] = arr[cOffset + k]!;
          arr[cOffset + k] = tmp;
        }
      }
      attr.needsUpdate = true;
    }
  }

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

function countBufferGeometryTriangles(geometry: THREE.BufferGeometry): number {
  const index = geometry.getIndex();
  if (index) {
    return index.count / 3;
  }
  const pos = geometry.getAttribute('position');
  return pos ? pos.count / 3 : 0;
}

/**
 * Extracts a contract node's mesh primitives baked once into the part-local coordinate frame
 * (+X crank, +Y valley W, +Z bore) for zero-overhead THREE.InstancedMesh batching across cylinders.
 * When mirrorLocalX is true (used for chiral LH-bank rockers), local X is reflected with winding
 * reversed so every InstancedMesh instance matrix remains strictly proper orthogonal (det = +1).
 */
export function extractPartPrimitives(
  gltf: GLTF,
  nodeName: string,
  options?: { mirrorLocalX?: boolean },
): ExtractedPartPrimitive[] {
  const sourceNode = gltf.scene.getObjectByName(nodeName);
  if (!sourceNode) {
    throw new Error(`Contract node "${nodeName}" not found in loaded GLTF scene.`);
  }

  const cloned = sourceNode.clone(true);
  cloned.position.set(0, 0, 0);
  cloned.quaternion.identity();
  cloned.scale.set(1, 1, 1);

  const partLocalGroup = wrapInPartLocalFrame(cloned);
  partLocalGroup.updateMatrixWorld(true);

  const primitives: ExtractedPartPrimitive[] = [];
  partLocalGroup.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const rawGeo = child.geometry as THREE.BufferGeometry;
    const geo = rawGeo.clone();
    geo.applyMatrix4(child.matrixWorld);
    if (options?.mirrorLocalX) {
      mirrorBufferGeometryAlongLocalXInPlace(geo);
    } else {
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
    }

    const mat = Array.isArray(child.material) ? child.material[0] : child.material;
    if (!(mat instanceof THREE.MeshStandardMaterial)) {
      throw new Error(`Expected MeshStandardMaterial on contract node "${nodeName}".`);
    }

    primitives.push({
      geometry: geo,
      material: mat,
      triangles: countBufferGeometryTriangles(geo),
    });
  });

  if (primitives.length === 0) {
    throw new Error(`No mesh primitives extracted from contract node "${nodeName}".`);
  }

  return primitives;
}
