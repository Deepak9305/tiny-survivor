import * as THREE from 'three';
import { logicalToWorld } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

type Particle = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  baseScale: number;
};

type Effect = {
  group: THREE.Group;
  life: number;
  maxLife: number;
  kind: 'ring' | 'burst' | 'lightning' | 'deathCorpse';
};

export class CombatEffects3D {
  private readonly effects: Effect[] = [];
  private readonly particles: Particle[] = [];
  private readonly resources: SharedResources;
  private readonly parent: THREE.Group;
  private readonly reducedEffects: boolean;

  constructor(parent: THREE.Group, resources: SharedResources, reducedEffects: boolean) {
    this.parent = parent;
    this.resources = resources;
    this.reducedEffects = reducedEffects;
  }

  ring(x: number, y: number, radius: number, color: number): void {
    const group = new THREE.Group();
    // Outer colored shockwave ring
    const ringMaterial = this.resources.basicMaterial(`effect-ring-${color}`, color, {
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    }).clone();
    ringMaterial.opacity = 0.85;
    const ring = addMesh(group, this.resources.ring(`effect-ring-${radius}`, Math.max(0.12, radius * 0.72), Math.max(0.16, radius * 0.82)), ringMaterial);
    ring.userData.baseOpacity = 0.85;
    ring.rotation.x = -Math.PI / 2;

    // Inner bright white-hot shockwave pulse
    const innerMaterial = this.resources.basicMaterial(`effect-ring-inner-${color}`, 0xffffff, {
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    }).clone();
    innerMaterial.opacity = 0.95;
    const innerRing = addMesh(group, this.resources.ring(`effect-ring-in-${radius}`, Math.max(0.08, radius * 0.45), Math.max(0.11, radius * 0.55)), innerMaterial);
    innerRing.userData.baseOpacity = 0.95;
    innerRing.rotation.x = -Math.PI / 2;

    group.position.copy(logicalToWorld(x, y));
    group.position.y = 0.05;
    group.scale.setScalar(0.42);
    this.parent.add(group);
    this.effects.push({ group, life: 0, maxLife: this.reducedEffects ? 0.18 : 0.32, kind: 'ring' });
  }

  burst(x: number, y: number, color: number, critical = false): void {
    const point = logicalToWorld(x, y);
    const count = this.reducedEffects ? (critical ? 7 : 4) : (critical ? 16 : 9);
    for (let index = 0; index < count; index += 1) {
      const isCore = index % 3 === 0;
      const pColor = isCore ? 0xffffff : color;
      const particleMaterial = this.resources.basicMaterial(`effect-p-${pColor}`, pColor, {
        transparent: true,
        opacity: 0.95,
      }).clone();
      particleMaterial.opacity = 0.95;
      const mesh = addMesh(this.parent, this.resources.octa('effect-particle'), particleMaterial);
      const angle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = (critical ? 1.4 : 0.9) + Math.random() * (critical ? 1.6 : 0.95);
      const baseScale = (critical ? 0.16 : 0.1) * (isCore ? 0.75 : 1.0);
      mesh.position.set(point.x, 0.45 + Math.random() * 0.5, point.z);
      mesh.scale.setScalar(baseScale);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, 0.9 + Math.random() * 1.1, Math.sin(angle) * speed),
        life: 0,
        maxLife: this.reducedEffects ? 0.3 : 0.52,
        baseScale,
      });
    }
  }

  dustPuff(x: number, y: number, count = 3): void {
    if (this.reducedEffects) return;
    const point = logicalToWorld(x, y);
    for (let index = 0; index < count; index += 1) {
      const particleMaterial = this.resources.basicMaterial('dust-puff-mat', 0xa0aec0, {
        transparent: true,
        opacity: 0.35,
      }).clone();
      particleMaterial.opacity = 0.35;
      const mesh = addMesh(this.parent, this.resources.sphere('dust-particle-geom'), particleMaterial);
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.18 + Math.random() * 0.28;
      const baseScale = 0.06 + Math.random() * 0.05;
      mesh.position.set(point.x + (Math.random() - 0.5) * 0.25, 0.04, point.z + (Math.random() - 0.5) * 0.25);
      mesh.scale.setScalar(baseScale);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, 0.22 + Math.random() * 0.25, Math.sin(angle) * speed),
        life: 0,
        maxLife: 0.28,
        baseScale,
      });
    }
  }

  projectileImpact(x: number, y: number, color: number): void {
    this.ring(x, y, 0.72, color);
    this.burst(x, y, color, false);
  }

  enemyDeath(x: number, y: number, color: number, elite = false): void {
    this.ring(x, y, elite ? 1.35 : 0.88, elite ? 0xffd155 : color);
    this.burst(x, y, elite ? 0xffe277 : color, elite);
    if (elite) {
      this.ring(x, y, 0.65, 0xffffff);
    }
  }

  collect(x: number, y: number, color = 0x75eaff): void {
    this.ring(x, y, 0.55, color);
    this.burst(x, y, color, false);
  }

  levelUp(x: number, y: number): void {
    this.ring(x, y, 2.2, 0x9cecff);
    this.ring(x, y, 1.4, 0xffffff);
    this.burst(x, y, 0x62e8ff, true);
    this.burst(x, y, 0xffffff, true);
  }

  bossArrival(x: number, y: number): void {
    this.ring(x, y, 2.8, 0xff4855);
    this.ring(x, y, 1.6, 0xffc244);
    this.burst(x, y, 0xff7055, true);
    this.burst(x, y, 0xffd37c, true);
  }

  bossDeath(x: number, y: number): void {
    this.ring(x, y, 3.6, 0xffc04f);
    this.ring(x, y, 2.2, 0xff4e5e);
    this.burst(x, y, 0xffd37c, true);
    this.burst(x, y, 0xff5b66, true);
    this.burst(x, y, 0xffffff, true);
  }

  explosion(x: number, y: number, radius = 1.2, color = 0xff6622): void {
    // Ground flash ring (dual concentric)
    this.ring(x, y, radius * 1.5, color);
    this.ring(x, y, radius * 0.85, 0xfff4bb);
    // Fiery spark burst
    this.burst(x, y, color, true);
    this.burst(x, y, 0xffdd44, false);
    this.burst(x, y, 0xffffff, false);
  }

  /**
   * High-visibility Chain Lightning Beam (Camera-facing ribbon segments with dual glow & core)
   * Does NOT rely on browser LineBasicMaterial linewidth bug.
   */
  lightning(fromX: number, fromY: number, toX: number, toY: number, color: number): void {
    const start = logicalToWorld(fromX, fromY);
    const end = logicalToWorld(toX, toY);
    const distance = start.distanceTo(end);
    const segments = Math.max(4, Math.min(8, Math.ceil(distance * 1.8)));
    const points: THREE.Vector3[] = [];

    for (let index = 0; index <= segments; index += 1) {
      const progress = index / segments;
      const jitter = index === 0 || index === segments ? 0 : 0.22;
      points.push(
        new THREE.Vector3(
          THREE.MathUtils.lerp(start.x, end.x, progress) + (Math.random() - 0.5) * jitter,
          0.78 + (Math.random() - 0.5) * 0.15,
          THREE.MathUtils.lerp(start.z, end.z, progress) + (Math.random() - 0.5) * jitter
        )
      );
    }

    const group = new THREE.Group();

    // Build connected cylindrical / quad segments for thick visible lightning arc
    const outerMat = this.resources.basicMaterial(`beam-outer-${color}`, color, {
      transparent: true,
      opacity: 0.85,
    });
    const coreMat = this.resources.basicMaterial('beam-core-white', 0xffffff, {
      transparent: true,
      opacity: 0.95,
    });

    for (let i = 0; i < points.length - 1; i++) {
      const pA = points[i];
      const pB = points[i + 1];
      const segLen = pA.distanceTo(pB);
      const segMid = pA.clone().lerp(pB, 0.5);

      // Outer glow beam segment
      const outerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, segLen, 6), outerMat);
      outerMesh.position.copy(segMid);
      outerMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pB.clone().sub(pA).normalize());
      group.add(outerMesh);

      // Inner white-hot core segment
      const coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, segLen, 6), coreMat);
      coreMesh.position.copy(segMid);
      coreMesh.quaternion.copy(outerMesh.quaternion);
      group.add(coreMesh);
    }

    this.parent.add(group);
    this.effects.push({ group, life: 0, maxLife: this.reducedEffects ? 0.14 : 0.2, kind: 'lightning' });

    // Impact spark at target
    this.burst(toX, toY, color, false);
  }

  freezeRing(x: number, y: number, radius = 2.4): void {
    this.ring(x, y, radius * 1.25, 0x5ddcff);
    this.ring(x, y, radius * 0.7, 0xffffff);
    this.burst(x, y, 0x88e6ff, true);
    this.burst(x, y, 0xffffff, false);
  }

  arcaneBeamEffect(fromX: number, fromY: number, toX: number, toY: number, color = 0xa87aff): void {
    const start = logicalToWorld(fromX, fromY);
    const end = logicalToWorld(toX, toY);
    const distance = start.distanceTo(end);
    const group = new THREE.Group();

    const beamGeom = this.resources.cylinder('arcane-beam-geom');
    const outerMat = this.resources.basicMaterial(`beam-outer-${color}`, color, {
      transparent: true,
      opacity: 0.88,
    });
    const coreMat = this.resources.basicMaterial('beam-core-white', 0xffffff, {
      transparent: true,
      opacity: 0.95,
    });

    const outerMesh = addMesh(group, beamGeom, outerMat);
    outerMesh.scale.set(0.48, distance, 0.48);
    const coreMesh = addMesh(group, beamGeom, coreMat);
    coreMesh.scale.set(0.18, distance, 0.18);

    outerMesh.userData.baseOpacity = 0.88;
    coreMesh.userData.baseOpacity = 0.95;

    const mid = start.clone().lerp(end, 0.5);
    group.position.set(mid.x, 0.72, mid.z);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());

    this.parent.add(group);
    this.effects.push({ group, life: 0, maxLife: this.reducedEffects ? 0.16 : 0.24, kind: 'lightning' });

    // Origin spark + target impact spark
    this.burst(fromX, fromY, color, false);
    this.burst(toX, toY, color, true);
  }

  healPulse(x: number, y: number): void {
    this.ring(x, y, 1.1, 0x22c55e);
    this.ring(x, y, 0.7, 0x86efac);
    const point = logicalToWorld(x, y);
    const count = this.reducedEffects ? 5 : 10;
    for (let i = 0; i < count; i++) {
      const pColor = i % 2 === 0 ? 0x4ade80 : 0xdcfce7;
      const mat = this.resources.basicMaterial(`heal-mote-${pColor}`, pColor, {
        transparent: true,
        opacity: 0.9,
      }).clone();
      const mesh = addMesh(this.parent, this.resources.sphere('heal-mote-geom'), mat);
      mesh.scale.setScalar(0.08);
      const angle = (i / count) * Math.PI * 2;
      const rad = 0.2 + Math.random() * 0.4;
      mesh.position.set(point.x + Math.cos(angle) * rad, 0.3 + Math.random() * 0.3, point.z + Math.sin(angle) * rad);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.3, 1.4 + Math.random() * 0.6, (Math.random() - 0.5) * 0.3),
        life: 0,
        maxLife: this.reducedEffects ? 0.35 : 0.55,
        baseScale: 0.08,
      });
    }
  }

  update(delta: number): void {
    // Update active effects (rings, lightning beams, death corpses)
    for (let index = this.effects.length - 1; index >= 0; index -= 1) {
      const effect = this.effects[index];
      effect.life += delta;
      const progress = Math.min(1, effect.life / effect.maxLife);

      if (effect.kind === 'ring') {
        effect.group.scale.setScalar(0.38 + progress * 1.05);
      } else if (effect.kind === 'lightning') {
        effect.group.scale.setScalar(1 + (Math.random() - 0.5) * 0.08);
      }

      effect.group.traverse((child) => {
        if ((child instanceof THREE.Mesh || child instanceof THREE.Line) && child.material instanceof THREE.Material) {
          child.material.opacity = (child.userData.baseOpacity as number | undefined ?? 0.95) * (1 - progress);
        }
      });

      if (effect.life >= effect.maxLife) {
        disposeTransientMaterials(effect.group);
        effect.group.removeFromParent();
        this.effects.splice(index, 1);
      }
    }

    // Update active particles (sparks, bursts)
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.life += delta;
      particle.velocity.y -= delta * 2.4;
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      particle.mesh.rotation.x += delta * 8;
      particle.mesh.rotation.z += delta * 5;
      const progress = particle.life / particle.maxLife;

      // Preserves original baseScale so critical hits stay visibly larger!
      particle.mesh.scale.setScalar(Math.max(0.001, (1 - progress) * particle.baseScale));

      const material = particle.mesh.material;
      if (material instanceof THREE.Material) {
        material.opacity = Math.max(0, 0.95 * (1 - progress));
      }

      if (particle.life >= particle.maxLife) {
        disposeMeshMaterials(particle.mesh);
        particle.mesh.removeFromParent();
        this.particles.splice(index, 1);
      }
    }
  }

  clear(): void {
    for (const effect of this.effects) {
      disposeTransientMaterials(effect.group);
      effect.group.removeFromParent();
    }
    for (const particle of this.particles) {
      disposeMeshMaterials(particle.mesh);
      particle.mesh.removeFromParent();
    }
    this.effects.length = 0;
    this.particles.length = 0;
  }
}

function disposeTransientMaterials(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) disposeObjectMaterials(child);
  });
}

function disposeMeshMaterials(mesh: THREE.Mesh): void {
  disposeObjectMaterials(mesh);
}

function disposeObjectMaterials(object: THREE.Mesh | THREE.Line): void {
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  for (const material of materials) material.dispose();
}
