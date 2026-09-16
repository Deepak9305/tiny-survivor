import * as THREE from 'three';

type SurfaceKind = 'cloth' | 'metal' | 'leather' | 'skin' | 'bone' | 'wood' | 'organic';

type SurfaceProfile =
  | 'hero-shadow'
  | 'hero-warrior'
  | 'hero-monk'
  | 'hero-gunslinger'
  | 'enemy'
  | 'boss';

export interface CharacterSurfaceSpec {
  texture: THREE.CanvasTexture;
  roughness: number;
  metalness: number;
  envMapIntensity: number;
}

const textureCache = new Map<SurfaceKind, THREE.CanvasTexture>();

function hashNoise(x: number, y: number, seed: number): number {
  const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

function buildSurfaceTexture(kind: SurfaceKind): THREE.CanvasTexture {
  const existing = textureCache.get(kind);
  if (existing) return existing;

  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  if (context) {
    const image = context.createImageData(size, size);
    const seed = ['cloth', 'metal', 'leather', 'skin', 'bone', 'wood', 'organic'].indexOf(kind) + 1;

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const noise = hashNoise(x, y, seed);
        let value = 244;

        if (kind === 'cloth') {
          const weave = (x % 4 === 0 ? -8 : 0) + (y % 4 === 0 ? -7 : 0);
          value = 244 + weave + Math.round((noise - 0.5) * 7);
        } else if (kind === 'metal') {
          const brushed = Math.sin(y * 0.72) * 5 + Math.sin(x * 0.18) * 2;
          const scratch = (x + y * 3) % 29 === 0 ? -24 : 0;
          value = 246 + Math.round(brushed) + scratch + Math.round((noise - 0.5) * 5);
        } else if (kind === 'leather') {
          value = 239 + Math.round((noise - 0.5) * 18) + ((x * 7 + y * 11) % 31 === 0 ? -10 : 0);
        } else if (kind === 'skin') {
          value = 248 + Math.round((noise - 0.5) * 5) - Math.round(Math.sin((x + y) * 0.3) * 1.5);
        } else if (kind === 'bone') {
          const pores = (x * 5 + y * 13) % 37 === 0 ? -14 : 0;
          value = 246 + pores + Math.round((noise - 0.5) * 7);
        } else if (kind === 'wood') {
          const grain = Math.sin(x * 0.52 + Math.sin(y * 0.22) * 1.8) * 8;
          value = 240 + Math.round(grain) + Math.round((noise - 0.5) * 5);
        } else {
          const blotch = Math.sin(x * 0.33) * 4 + Math.cos(y * 0.37) * 4;
          value = 242 + Math.round(blotch) + Math.round((noise - 0.5) * 9);
        }

        value = Math.max(205, Math.min(255, value));
        const index = (y * size + x) * 4;
        image.data[index] = value;
        image.data[index + 1] = value;
        image.data[index + 2] = value;
        image.data[index + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = `character-surface-${kind}`;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === 'metal' ? 2.6 : 2.0, kind === 'metal' ? 3.2 : 2.0);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.userData.sharedCharacterSurface = true;
  texture.needsUpdate = true;
  textureCache.set(kind, texture);
  return texture;
}

function classifySurface(name: string, profile: SurfaceProfile): SurfaceKind {
  const value = name.toLowerCase();

  if (/steel|gold|blade|sword|helmet|armor|armour|chest|greave|pauldron|pistol|shield|sabat|visor|buckle|bracer|metal/.test(value)) {
    return 'metal';
  }
  if (/bone|skeleton|skull|jaw/.test(value)) return 'bone';
  if (/leather|boot|belt|holster|glove|sandal/.test(value)) return 'leather';
  if (/staff|bow|wood|treant|root|branch/.test(value)) return 'wood';
  if (/robe|cloth|tabard|scarf|pant|coat|wrap|sash|hood|cape|plume|vest/.test(value)) return 'cloth';
  if (/skin|flesh/.test(value)) return 'skin';

  if (profile.startsWith('hero-') && profile !== 'hero-shadow' && /head|face/.test(value)) return 'skin';
  return 'organic';
}

function specFor(surface: SurfaceKind): Omit<CharacterSurfaceSpec, 'texture'> {
  if (surface === 'metal') return { roughness: 0.43, metalness: 0.62, envMapIntensity: 1.08 };
  if (surface === 'cloth') return { roughness: 0.8, metalness: 0.03, envMapIntensity: 0.46 };
  if (surface === 'leather') return { roughness: 0.69, metalness: 0.02, envMapIntensity: 0.55 };
  if (surface === 'skin') return { roughness: 0.72, metalness: 0, envMapIntensity: 0.4 };
  if (surface === 'bone') return { roughness: 0.66, metalness: 0, envMapIntensity: 0.5 };
  if (surface === 'wood') return { roughness: 0.82, metalness: 0, envMapIntensity: 0.38 };
  return { roughness: 0.64, metalness: 0.04, envMapIntensity: 0.58 };
}

export function getCharacterSurfaceSpec(materialKey: string): CharacterSurfaceSpec | undefined {
  if (!/^(hero|warrior|monk|gun|enemy|boss|skeleton|forest|frost|demon)/i.test(materialKey)) return undefined;
  const profile: SurfaceProfile = materialKey.startsWith('warrior')
    ? 'hero-warrior'
    : materialKey.startsWith('monk')
      ? 'hero-monk'
      : materialKey.startsWith('gun')
        ? 'hero-gunslinger'
        : materialKey.startsWith('hero')
          ? 'hero-shadow'
          : materialKey.startsWith('boss') || materialKey.includes('king') || materialKey.includes('golem')
            ? 'boss'
            : 'enemy';
  const surface = classifySurface(materialKey, profile);
  return { texture: buildSurfaceTexture(surface), ...specFor(surface) };
}

function tuneMaterial(material: THREE.MeshStandardMaterial, surface: SurfaceKind): void {
  const spec = specFor(surface);
  if (!material.map && !material.transparent) material.map = buildSurfaceTexture(surface);
  material.roughness = surface === 'metal' ? Math.min(material.roughness, spec.roughness) : Math.max(material.roughness, spec.roughness);
  material.metalness = surface === 'metal' ? Math.max(material.metalness, spec.metalness) : Math.min(material.metalness, spec.metalness);
  material.envMapIntensity = spec.envMapIntensity;
  material.userData.premiumCharacterSurface = surface;
  material.needsUpdate = true;
}

/**
 * Applies the same surface treatment to imported or one-off meshes that did not
 * originate from SharedResources.standardMaterial().
 */
export function applyPremiumCharacterSkin(root: THREE.Object3D, profile: SurfaceProfile): void {
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      if (material.userData.premiumCharacterSurface) continue;
      const descriptor = `${node.name} ${node.geometry?.name ?? ''} ${material.name}`;
      tuneMaterial(material, classifySurface(descriptor, profile));
    }
  });
}

export function heroSurfaceProfile(heroId: string): SurfaceProfile {
  if (heroId === 'warrior') return 'hero-warrior';
  if (heroId === 'monk') return 'hero-monk';
  if (heroId === 'gunslinger') return 'hero-gunslinger';
  return 'hero-shadow';
}
