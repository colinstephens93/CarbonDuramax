// Registered exterior GLB loader, material deduplicator, and geometry merger (Spec §5).
// Loads public/Duramax_LLY_2005_66L_V8.glb unmodified, deduplicates its 99 material slots to the
// 22 unique material definitions, merges scene geometries per unique material into <= 24 meshes
// (castShadow = false, receiveShadow = false), and registers it onto the project crank axis.

import * as THREE from 'three';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ExteriorRegistrationSpec } from './layout';

export interface LoadedExteriorShell {
  readonly group: THREE.Group;
  readonly mergedMeshCount: number;
  readonly totalTriangles: number;
  readonly uniqueTextureBytes: number;
  readonly geometries: THREE.BufferGeometry[];
  readonly materials: THREE.Material[];
  readonly textures: THREE.Texture[];
}

function formatTextureKey(tex: THREE.Texture | null | undefined): string {
  if (!tex) return 'none';
  const srcId = tex.source?.uuid ?? tex.uuid;
  return [
    srcId,
    tex.offset.x.toFixed(6),
    tex.offset.y.toFixed(6),
    tex.repeat.x.toFixed(6),
    tex.repeat.y.toFixed(6),
    tex.rotation.toFixed(6),
    tex.center.x.toFixed(6),
    tex.center.y.toFixed(6),
    tex.wrapS,
    tex.wrapT,
    tex.colorSpace,
  ].join(':');
}

function computeMaterialSignature(mat: THREE.Material, geo: THREE.BufferGeometry): string {
  const attrSig = Object.keys(geo.attributes).sort().join(',');
  const indexedSig = geo.getIndex() !== null ? 'idx1' : 'idx0';

  if (mat instanceof THREE.MeshStandardMaterial) {
    return [
      mat.type,
      attrSig,
      indexedSig,
      mat.color.getHexString(),
      mat.metalness.toFixed(5),
      mat.roughness.toFixed(5),
      mat.emissive.getHexString(),
      mat.emissiveIntensity.toFixed(5),
      mat.opacity.toFixed(5),
      mat.transparent ? 'T' : 'O',
      mat.alphaTest.toFixed(5),
      mat.side,
      mat.flatShading ? 'F' : 'S',
      mat.vertexColors ? 'VC1' : 'VC0',
      formatTextureKey(mat.map),
      formatTextureKey(mat.normalMap),
      formatTextureKey(mat.roughnessMap),
      formatTextureKey(mat.metalnessMap),
      formatTextureKey(mat.aoMap),
      formatTextureKey(mat.emissiveMap),
    ].join('|');
  }

  return `${mat.type}|${attrSig}|${indexedSig}|${mat.uuid}`;
}

function collectMaterialTextures(mat: THREE.Material, out: Set<THREE.Texture>): void {
  if (!(mat instanceof THREE.MeshStandardMaterial)) return;
  const slots = [
    mat.map,
    mat.normalMap,
    mat.roughnessMap,
    mat.metalnessMap,
    mat.aoMap,
    mat.emissiveMap,
    mat.alphaMap,
  ];
  for (const tex of slots) {
    if (tex) out.add(tex);
  }
}

function estimateTextureGpuBytes(textures: Iterable<THREE.Texture>): number {
  const seenSources = new Set<string>();
  let totalBytes = 0;

  for (const tex of textures) {
    const srcKey = tex.source?.uuid ?? tex.uuid;
    if (seenSources.has(srcKey)) continue;
    seenSources.add(srcKey);

    const img = tex.image as { width?: number; height?: number } | undefined;
    const w = img?.width ?? 0;
    const h = img?.height ?? 0;
    if (w > 0 && h > 0) {
      // Uncompressed RGBA8 + 1.333x mipmap chain in WebGL2
      const mipFactor = tex.generateMipmaps ? 4 / 3 : 1;
      totalBytes += Math.ceil(w * h * 4 * mipFactor);
    }
  }
  return totalBytes;
}

export async function loadRegisteredExteriorShell(
  loader: GLTFLoader,
  url: string,
  registration: ExteriorRegistrationSpec,
): Promise<LoadedExteriorShell> {
  const gltf = await loader.loadAsync(url);
  gltf.scene.updateMatrixWorld(true);

  interface MaterialBucket {
    material: THREE.Material;
    geometries: THREE.BufferGeometry[];
  }

  const buckets = new Map<string, MaterialBucket>();
  const duplicateMaterialsToDispose = new Set<THREE.Material>();
  const sourceGeometriesToDispose = new Set<THREE.BufferGeometry>();
  const allEncounteredTextures = new Set<THREE.Texture>();

  gltf.scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const srcGeo = obj.geometry as THREE.BufferGeometry;
    sourceGeometriesToDispose.add(srcGeo);

    const mat = Array.isArray(obj.material) ? obj.material[0]! : obj.material;
    collectMaterialTextures(mat, allEncounteredTextures);

    const sig = computeMaterialSignature(mat, srcGeo);
    let bucket = buckets.get(sig);
    if (!bucket) {
      bucket = { material: mat, geometries: [] };
      buckets.set(sig, bucket);
    } else if (bucket.material !== mat) {
      duplicateMaterialsToDispose.add(mat);
    }

    const transformedGeo = srcGeo.clone();
    transformedGeo.applyMatrix4(obj.matrixWorld);
    bucket.geometries.push(transformedGeo);
  });

  // Build registered container: p_proj = T + s * R * p_file
  const outerGroup = new THREE.Group();
  outerGroup.name = 'duramax_exterior_shell_group';
  outerGroup.visible = false; // Default unchecked per Spec §5

  const transformGroup = new THREE.Group();
  transformGroup.name = 'exterior_registration_transform';
  const [c0, c1, c2] = registration.basisColumnsProjectFromFile;
  const rotMat = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(c0[0], c0[1], c0[2]),
    new THREE.Vector3(c1[0], c1[1], c1[2]),
    new THREE.Vector3(c2[0], c2[1], c2[2]),
  );
  transformGroup.position.set(
    registration.translationM[0],
    registration.translationM[1],
    registration.translationM[2],
  );
  transformGroup.quaternion.setFromRotationMatrix(rotMat);
  transformGroup.scale.setScalar(registration.uniformScale);
  outerGroup.add(transformGroup);

  const mergedGeometries: THREE.BufferGeometry[] = [];
  const retainedMaterials: THREE.Material[] = [];
  const retainedTextures = new Set<THREE.Texture>();
  let totalTriangles = 0;

  let index = 0;
  for (const [, bucket] of buckets) {
    const mergedGeo =
      bucket.geometries.length === 1
        ? bucket.geometries[0]!
        : mergeGeometries(bucket.geometries, false);

    if (!mergedGeo) {
      throw new Error('Failed to merge exterior GLB geometries for material bucket.');
    }

    if (bucket.geometries.length > 1) {
      for (const tempGeo of bucket.geometries) {
        tempGeo.dispose();
      }
    }

    mergedGeo.computeBoundingBox();
    mergedGeo.computeBoundingSphere();

    const idxAttr = mergedGeo.getIndex();
    const posAttr = mergedGeo.getAttribute('position');
    const tris = idxAttr ? idxAttr.count / 3 : posAttr ? posAttr.count / 3 : 0;
    totalTriangles += tris;

    const mesh = new THREE.Mesh(mergedGeo, bucket.material);
    mesh.name = `exterior_merged_mat_${index}`;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    transformGroup.add(mesh);

    mergedGeometries.push(mergedGeo);
    retainedMaterials.push(bucket.material);
    collectMaterialTextures(bucket.material, retainedTextures);
    index += 1;
  }

  if (mergedGeometries.length > 24) {
    throw new Error(
      `Merged exterior mesh count (${mergedGeometries.length}) exceeded Spec §5 limit of 24.`,
    );
  }

  // Clean up unmerged source BufferGeometries and deduplicated Material clones
  for (const srcGeo of sourceGeometriesToDispose) {
    srcGeo.dispose();
  }
  for (const dupMat of duplicateMaterialsToDispose) {
    if (!retainedMaterials.includes(dupMat)) {
      dupMat.dispose();
    }
  }
  for (const tex of allEncounteredTextures) {
    if (!retainedTextures.has(tex)) {
      tex.dispose();
    }
  }

  return {
    group: outerGroup,
    mergedMeshCount: mergedGeometries.length,
    totalTriangles,
    uniqueTextureBytes: estimateTextureGpuBytes(retainedTextures),
    geometries: mergedGeometries,
    materials: retainedMaterials,
    textures: [...retainedTextures],
  };
}
