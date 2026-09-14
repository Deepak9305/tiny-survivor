import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { BossId, EnemyKind } from '../../types';

/**
 * Local-only model boundary. Gameplay factories remain the fallback until the
 * corresponding GLB is actually shipped in public/assets/models/.
 */
export type ModelAssetId =
  | `hero:${string}`
  | `enemy:${EnemyKind}`
  | `boss:${BossId}`
  | `environment:${'graveyard' | 'forest' | 'frozen' | 'castle'}:${string}`;

const MODEL_PATHS: Record<string, string> = {
  'hero:shadow': '/assets/models/heroes/shadow.glb',
  'enemy:skeleton': '/assets/models/enemies/skeleton.glb',
  'enemy:bat': '/assets/models/enemies/bat.glb',
  'enemy:slime': '/assets/models/enemies/slime.glb',
  'enemy:ghost': '/assets/models/enemies/ghost.glb',
  'enemy:archer': '/assets/models/enemies/archer.glb',
  'enemy:knight': '/assets/models/enemies/knight.glb',
  'enemy:demon': '/assets/models/enemies/demon.glb',
  'enemy:imp': '/assets/models/enemies/imp.glb',
  'boss:skeleton-king': '/assets/models/bosses/skeleton-king.glb',
  'boss:forest-witch': '/assets/models/bosses/forest-witch.glb',
  'boss:frost-golem': '/assets/models/bosses/frost-golem.glb',
  'boss:demon-lord': '/assets/models/bosses/demon-lord.glb',
};

export function getModelPath(id: ModelAssetId): string | undefined {
  if (MODEL_PATHS[id]) return MODEL_PATHS[id];
  const [category, value, prop] = id.split(':');
  if (category === 'hero' && value) return `/assets/models/heroes/${value}.glb`;
  if (category === 'enemy' && value) return `/assets/models/enemies/${value}.glb`;
  if (category === 'boss' && value) return `/assets/models/bosses/${value}.glb`;
  if (category === 'environment' && value && prop) return `/assets/models/environment/${value}/${prop}.glb`;
  return undefined;
}

export class ModelRegistry {
  private readonly loader = new GLTFLoader();
  private readonly cache = new Map<string, Promise<THREE.Group | null>>();

  loadOptional(id: ModelAssetId): Promise<THREE.Group | null> {
    const path = getModelPath(id);
    if (!path) return Promise.resolve(null);
    const cached = this.cache.get(id);
    if (cached) return cached;
    const request = new Promise<THREE.Group | null>((resolve) => {
      this.loader.load(path, (gltf) => resolve(gltf.scene), undefined, () => resolve(null));
    });
    this.cache.set(id, request);
    return request;
  }

  clear(): void { this.cache.clear(); }
}

export const modelRegistry = new ModelRegistry();

export function cloneModel(model: THREE.Group): THREE.Group {
  return model.clone(true);
}
