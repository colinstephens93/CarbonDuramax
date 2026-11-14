// Scene-placed external variant GLB loader (Milestone 8, D-038; docs/specs/M8-part-variants.md §4.2).
// Wraps the glTF Y-up scene once into the project coordinate frame (+X front, +Y right, +Z up)
// and configures meshes with castShadow = false, receiveShadow = false (matching the exterior shell).
// Returned groups are NOT attached to the scene until selected.

import * as THREE from 'three';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { wrapInPartLocalFrame } from './partLoader';

export interface LoadedVariantScene {
  readonly group: THREE.Group;
  readonly geometries: THREE.BufferGeometry[];
  readonly materials: THREE.MeshStandardMaterial[];
  readonly triangles: number;
}

function countMeshTriangles(geometry: THREE.BufferGeometry): number {
  const index = geometry.getIndex();
  if (index) {
    return index.count / 3;
  }
  const pos = geometry.getAttribute('position');
  return pos ? pos.count / 3 : 0;
}

export async function loadVariantScene(
  loader: GLTFLoader,
  url: string,
): Promise<LoadedVariantScene> {
  const gltf = await loader.loadAsync(url);
  const group = wrapInPartLocalFrame(gltf.scene, 'variant_scene_group');

  const geometrySet = new Set<THREE.BufferGeometry>();
  const materialSet = new Set<THREE.MeshStandardMaterial>();
  let triangles = 0;

  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = false;
    child.receiveShadow = false;

    const geo = child.geometry as THREE.BufferGeometry;
    geometrySet.add(geo);
    triangles += countMeshTriangles(geo);

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of mats) {
      if (!(mat instanceof THREE.MeshStandardMaterial)) {
        throw new Error(`Expected MeshStandardMaterial in variant GLB "${url}".`);
      }
      materialSet.add(mat);
    }
  });

  if (geometrySet.size === 0) {
    throw new Error(`No mesh primitives found in variant GLB "${url}".`);
  }

  return {
    group,
    geometries: [...geometrySet],
    materials: [...materialSet],
    triangles,
  };
}
