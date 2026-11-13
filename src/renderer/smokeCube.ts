// Milestone 0 renderer smoke proof: renders one rotating placeholder cube (no engine visuals).

import * as THREE from 'three';

export function mountSmokeCube(container: HTMLElement): void {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0e14);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(2.2, 1.8, 2.8);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(3, 5, 4);
  scene.add(keyLight);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    metalness: 0.35,
    roughness: 0.45,
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  const onResize = (): void => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  let prevTime = performance.now();
  const animate = (now: number): void => {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - prevTime) / 1000);
    prevTime = now;
    cube.rotation.x += dt * 0.6;
    cube.rotation.y += dt * 0.9;
    renderer.render(scene, camera);
  };
  requestAnimationFrame(animate);
}
