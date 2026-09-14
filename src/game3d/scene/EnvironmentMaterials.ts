import * as THREE from 'three';
import type { BiomeTheme } from './BiomeTheme';

export class EnvironmentMaterials {
  private static instance: EnvironmentMaterials;
  private readonly cache = new Map<string, THREE.Material>();

  static getInstance(): EnvironmentMaterials {
    if (!EnvironmentMaterials.instance) {
      EnvironmentMaterials.instance = new EnvironmentMaterials();
    }
    return EnvironmentMaterials.instance;
  }

  getStone(theme: BiomeTheme, alt = false): THREE.MeshStandardMaterial {
    const key = `stone-${alt ? 'alt' : 'main'}-${theme.prop}-${theme.propAlt}`;
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshStandardMaterial;

    const mat = new THREE.MeshStandardMaterial({
      color: alt ? theme.propAlt : theme.prop,
      roughness: 0.84,
      metalness: 0.08,
    });
    this.cache.set(key, mat);
    return mat;
  }

  getWetStone(theme: BiomeTheme): THREE.MeshStandardMaterial {
    const key = `wet-stone-${theme.prop}`;
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshStandardMaterial;

    const color = new THREE.Color(theme.prop).multiplyScalar(0.72);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.38,
      metalness: 0.22,
    });
    this.cache.set(key, mat);
    return mat;
  }

  getIron(): THREE.MeshStandardMaterial {
    const key = 'iron-standard';
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshStandardMaterial;

    const mat = new THREE.MeshStandardMaterial({
      color: 0x16202c,
      roughness: 0.52,
      metalness: 0.68,
    });
    this.cache.set(key, mat);
    return mat;
  }

  getWood(dark = false): THREE.MeshStandardMaterial {
    const key = `wood-${dark ? 'dark' : 'regular'}`;
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshStandardMaterial;

    const mat = new THREE.MeshStandardMaterial({
      color: dark ? 0x18120e : 0x2e2016,
      roughness: 0.92,
      metalness: 0.02,
    });
    this.cache.set(key, mat);
    return mat;
  }

  getWarmEmissive(theme: BiomeTheme, intensity = 3.2): THREE.MeshStandardMaterial {
    const key = `warm-emissive-${theme.warm}-${intensity}`;
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshStandardMaterial;

    const mat = new THREE.MeshStandardMaterial({
      color: theme.warm,
      emissive: theme.warm,
      emissiveIntensity: intensity,
      roughness: 0.25,
    });
    this.cache.set(key, mat);
    return mat;
  }

  getAccentEmissive(theme: BiomeTheme, intensity = 2.4): THREE.MeshStandardMaterial {
    const key = `accent-emissive-${theme.accent}-${intensity}`;
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshStandardMaterial;

    const mat = new THREE.MeshStandardMaterial({
      color: theme.accent,
      emissive: theme.accent,
      emissiveIntensity: intensity,
      roughness: 0.25,
    });
    this.cache.set(key, mat);
    return mat;
  }

  getIce(): THREE.MeshStandardMaterial {
    const key = 'ice-standard';
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshStandardMaterial;

    const mat = new THREE.MeshStandardMaterial({
      color: 0x76cbe8,
      roughness: 0.22,
      metalness: 0.28,
      emissive: 0x10344a,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.88,
    });
    this.cache.set(key, mat);
    return mat;
  }

  getObsidian(): THREE.MeshStandardMaterial {
    const key = 'obsidian-standard';
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshStandardMaterial;

    const mat = new THREE.MeshStandardMaterial({
      color: 0x120e14,
      roughness: 0.32,
      metalness: 0.45,
    });
    this.cache.set(key, mat);
    return mat;
  }

  getMagma(): THREE.MeshStandardMaterial {
    const key = 'magma-standard';
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshStandardMaterial;

    const mat = new THREE.MeshStandardMaterial({
      color: 0xff3b14,
      emissive: 0xff4800,
      emissiveIntensity: 2.8,
      roughness: 0.4,
    });
    this.cache.set(key, mat);
    return mat;
  }

  get stone(): THREE.MeshStandardMaterial { return this.getStone({ prop: 0x3d4a58, propAlt: 0x2c3742 } as BiomeTheme); }
  get wetStone(): THREE.MeshStandardMaterial { return this.getWetStone({ prop: 0x223040 } as BiomeTheme); }
  get iron(): THREE.MeshStandardMaterial { return this.getIron(); }
  get wood(): THREE.MeshStandardMaterial { return this.getWood(); }
  get warmLight(): THREE.MeshStandardMaterial { return this.getWarmEmissive({ warm: 0xffa533 } as BiomeTheme); }
  get cyanCrystal(): THREE.MeshStandardMaterial { return this.getAccentEmissive({ accent: 0x38bdf8 } as BiomeTheme); }
  get ice(): THREE.MeshStandardMaterial { return this.getIce(); }
  get obsidian(): THREE.MeshStandardMaterial { return this.getObsidian(); }
  get magma(): THREE.MeshStandardMaterial { return this.getMagma(); }

  clear(): void {
    for (const mat of this.cache.values()) {
      mat.dispose();
    }
    this.cache.clear();
  }
}

export const envMaterials = EnvironmentMaterials.getInstance();
