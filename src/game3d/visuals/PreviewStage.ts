import * as THREE from 'three';
import type { BiomeTheme } from '../scene/BiomeTheme';
import { SharedResources, addMesh } from '../core/SharedResources';

export interface PreviewStageRig {
  runeRing: THREE.Mesh;
  accentLight: THREE.PointLight;
  warmLight: THREE.PointLight;
  decor: THREE.Group;
}

export function addPreviewLighting(scene: THREE.Scene, theme: BiomeTheme, intensity = 1): PreviewStageRig {
  scene.add(new THREE.HemisphereLight(theme.keyLight, theme.fillLight, 1.28 * intensity));

  const key = new THREE.DirectionalLight(theme.keyLight, 2.0 * intensity);
  key.position.set(-3.6, 6.5, 4.5);
  scene.add(key);

  const accentLight = new THREE.PointLight(theme.accent, 1.45 * intensity, 9, 2);
  accentLight.position.set(2.6, 2.4, 2.2);
  scene.add(accentLight);

  const warmLight = new THREE.PointLight(theme.warm, 0.65 * intensity, 7, 2);
  warmLight.position.set(-2.2, 1.35, 1.4);
  scene.add(warmLight);

  const decor = new THREE.Group();
  decor.name = 'preview-stage-decor';
  scene.add(decor);

  // Returned below after the actual rune ring is built by addPreviewStage().
  const placeholder = new THREE.Mesh();
  placeholder.visible = false;
  return { runeRing: placeholder, accentLight, warmLight, decor };
}

export function addPreviewStage(
  scene: THREE.Scene,
  resources: SharedResources,
  theme: BiomeTheme,
  options: { radius?: number; worldId?: number } = {},
): PreviewStageRig {
  const radius = options.radius ?? 1.95;
  const worldId = options.worldId ?? 1;
  const lights = addPreviewLighting(scene, theme);

  const floor = addMesh(
    scene,
    resources.cylinder(`preview-floor-${worldId}`),
    resources.standardMaterial(`preview-floor-mat-${worldId}`, theme.groundDeep, {
      roughness: 0.86,
      metalness: worldId === 4 ? 0.28 : 0.12,
    }),
  );
  floor.scale.set(radius, 0.14, radius * 0.82);
  floor.position.y = 0.07;

  const innerFloor = addMesh(
    scene,
    resources.cylinder(`preview-floor-inner-${worldId}`),
    resources.standardMaterial(`preview-floor-inner-mat-${worldId}`, theme.ground, {
      roughness: 0.78,
      metalness: worldId === 3 ? 0.18 : 0.08,
      emissive: theme.groundDetail,
      emissiveIntensity: 0.08,
    }),
  );
  innerFloor.scale.set(radius * 0.88, 0.15, radius * 0.72);
  innerFloor.position.y = 0.12;

  const runeRing = addMesh(
    scene,
    resources.ring(`preview-rune-ring-${worldId}`, radius * 0.47, radius * 0.53),
    resources.basicMaterial(`preview-rune-ring-mat-${worldId}`, theme.accent, {
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  runeRing.rotation.x = -Math.PI / 2;
  runeRing.position.y = 0.17;

  // Cheap world-themed silhouettes make preview screens feel like part of the game,
  // while staying far below gameplay draw-call density.
  const decorMat = resources.standardMaterial(`preview-decor-${worldId}`, theme.prop, {
    roughness: 0.92,
    metalness: worldId === 4 ? 0.18 : 0.04,
  });
  const accentMat = resources.standardMaterial(`preview-decor-accent-${worldId}`, theme.propAlt, {
    roughness: 0.78,
    emissive: theme.accent,
    emissiveIntensity: worldId === 3 || worldId === 4 ? 0.12 : 0.04,
  });

  const addPillar = (x: number, z: number, scale: number, accent = false) => {
    const pillar = addMesh(lights.decor, resources.cylinder(`preview-pillar-${worldId}`), accent ? accentMat : decorMat);
    pillar.scale.set(0.18 * scale, 0.72 * scale, 0.18 * scale);
    pillar.position.set(x, 0.62 * scale, z);
    pillar.rotation.z = x < 0 ? 0.07 : -0.07;
  };

  if (worldId === 2) {
    addPillar(-1.55, -0.35, 1.15);
    addPillar(1.5, -0.6, 0.95, true);
    const root = addMesh(lights.decor, resources.torus('preview-forest-root'), decorMat);
    root.scale.set(0.9, 0.42, 0.2);
    root.position.set(0, 0.18, -0.95);
    root.rotation.x = Math.PI / 2.15;
  } else if (worldId === 3) {
    addPillar(-1.45, -0.55, 1.0, true);
    addPillar(1.4, -0.4, 1.2, true);
    const crystal = addMesh(lights.decor, resources.octa('preview-ice-crystal'), accentMat);
    crystal.scale.set(0.28, 0.72, 0.28);
    crystal.position.set(1.65, 0.48, 0.55);
  } else if (worldId === 4) {
    addPillar(-1.55, -0.35, 1.25, true);
    addPillar(1.5, -0.35, 1.25, true);
    const brazierL = addMesh(lights.decor, resources.sphere('preview-brazier-l'), resources.basicMaterial('preview-brazier-flame', theme.warm, { transparent: true, opacity: 0.8 }));
    brazierL.scale.setScalar(0.12);
    brazierL.position.set(-1.55, 1.15, -0.32);
    const brazierR = brazierL.clone();
    brazierR.position.x = 1.5;
    lights.decor.add(brazierR);
  } else {
    addPillar(-1.5, -0.45, 0.9);
    addPillar(1.45, -0.5, 0.82);
    const grave = addMesh(lights.decor, resources.box('preview-grave-marker'), decorMat);
    grave.scale.set(0.18, 0.42, 0.08);
    grave.position.set(1.55, 0.42, 0.5);
    grave.rotation.z = -0.08;
  }

  return { ...lights, runeRing };
}

export function fitPreviewCamera(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  options: { targetY: number; distance: number; verticalBias?: number },
): void {
  const aspect = Math.max(0.5, width / Math.max(1, height));
  const compactBoost = aspect > 1.8 ? 0.92 : aspect < 1.05 ? 1.08 : 1;
  camera.aspect = aspect;
  camera.position.set(0, options.targetY + (options.verticalBias ?? 0.55), options.distance * compactBoost);
  camera.lookAt(0, options.targetY, 0);
  camera.updateProjectionMatrix();
}

export function disposePreviewScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite)) return;
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      material.map?.dispose();
      material.dispose();
    }
  });
}
