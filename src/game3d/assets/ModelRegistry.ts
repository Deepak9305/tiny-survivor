import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { BossId, EnemyKind, StageDefinition } from '../../types';
import { getStageAssetRequirements } from '../../data/assets';

/**
 * Local-only model boundary. Gameplay factories try production models first;
 * if unavailable, seamless procedural fallback is used.
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
  if (category === 'environment' && value && prop) return `/assets/models/environment/${value}/${prop}.glb`;
  return undefined;
}

export class ModelRegistry {
  private readonly loader = new GLTFLoader();
  private readonly cache = new Map<string, Promise<THREE.Group | null>>();
  private readonly loaded = new Map<string, THREE.Group>();
  private readonly warned = new Set<string>();

  /**
   * Asynchronously loads a model by ID. Caches both the promise and the resulting Group.
   */
  async loadOptional(id: ModelAssetId): Promise<THREE.Group | null> {
    if (this.loaded.has(id)) {
      return this.loaded.get(id)!;
    }
    const path = getModelPath(id);
    if (!path) return null;

    const cached = this.cache.get(id);
    if (cached) return cached;

    const request = new Promise<THREE.Group | null>((resolve) => {
      this.loader.load(
        path,
        (gltf) => {
          this.loaded.set(id, gltf.scene);
          resolve(gltf.scene);
        },
        undefined,
        () => {
          if (!this.warned.has(id)) {
            this.warned.add(id);
            // Single informative warning per asset, no console spam
            console.info(`[ModelRegistry] Asset not found at ${path}; using procedural fallback.`);
          }
          resolve(null);
        }
      );
    });

    this.cache.set(id, request);
    return request;
  }

  /**
   * Synchronously returns a previously loaded model, or null if not yet available.
   */
  getLoadedModel(id: ModelAssetId): THREE.Group | null {
    return this.loaded.get(id) ?? null;
  }

  /**
   * Clones a loaded model if available.
   */
  cloneLoadedModel(id: ModelAssetId): THREE.Group | null {
    const model = this.loaded.get(id);
    if (!model) return null;
    return cloneModel(model);
  }

  /**
   * Preloads all models required for a stage: hero, stage enemies, boss (if Stage 5),
   * and world environment props.
   */
  async preloadStage(
    stage: StageDefinition,
    heroId = 'shadow',
    onProgress?: (loadedCount: number, totalCount: number) => void
  ): Promise<{ loaded: number; total: number }> {
    const reqs = getStageAssetRequirements(stage, heroId);
    const assetIds: ModelAssetId[] = [
      `hero:${reqs.heroId}` as ModelAssetId,
      ...reqs.enemyKinds.map((k) => `enemy:${k}` as ModelAssetId),
    ];
    if (reqs.bossId) {
      assetIds.push(`boss:${reqs.bossId}` as ModelAssetId);
    }
    for (const prop of reqs.worldProps) {
      assetIds.push(`environment:${reqs.worldSlug}:${prop.id}` as ModelAssetId);
    }

    let loadedCount = 0;
    const totalCount = assetIds.length;

    await Promise.all(
      assetIds.map(async (id) => {
        try {
          const res = await this.loadOptional(id);
          if (res) loadedCount += 1;
        } catch {
          // Fallback safely
        }
        onProgress?.(loadedCount, totalCount);
      })
    );

    return { loaded: loadedCount, total: totalCount };
  }

  clear(): void {
    this.cache.clear();
    this.loaded.clear();
    this.warned.clear();
  }
}

export const modelRegistry = new ModelRegistry();

/**
 * Clones a Three.js hierarchy. Shares immutable materials and geometries by default
 * to minimize draw call overhead and shader re-compilations.
 */
export function cloneModel(model: THREE.Group, cloneMaterials = false): THREE.Group {
  const clone = model.clone(true);
  if (cloneMaterials) {
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        if (Array.isArray(node.material)) {
          node.material = node.material.map((mat) => mat.clone());
        } else if (node.material) {
          node.material = node.material.clone();
        }
      }
    });
  }
  return clone;
}
