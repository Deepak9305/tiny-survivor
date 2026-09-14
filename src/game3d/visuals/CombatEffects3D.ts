import * as THREE from 'three';
import { logicalToWorld } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

type Particle = { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; maxLife: number };
type Effect = { group: THREE.Group; life: number; maxLife: number; kind: 'ring' | 'burst' | 'lightning' };

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
    const ringMaterial = this.resources.basicMaterial(`effect-ring-${color}`, color, { transparent: true, opacity: 0.62, side: THREE.DoubleSide }).clone();
    ringMaterial.opacity = 0.62;
    const ring = addMesh(group, this.resources.ring(`effect-ring-${radius}`, Math.max(0.1, radius * 0.68), Math.max(0.12, radius * 0.73)), ringMaterial);
    ring.userData.baseOpacity = 0.62;
    ring.rotation.x = -Math.PI / 2;
    group.position.copy(logicalToWorld(x, y));
    group.position.y = 0.045;
    group.scale.setScalar(0.38);
    this.parent.add(group);
    this.effects.push({ group, life: 0, maxLife: this.reducedEffects ? 0.16 : 0.28, kind: 'ring' });
  }

  burst(x: number, y: number, color: number, critical = false): void {
    const point = logicalToWorld(x, y);
    const count = this.reducedEffects ? (critical ? 5 : 3) : (critical ? 10 : 6);
    for (let index = 0; index < count; index += 1) {
      const particleMaterial = this.resources.basicMaterial(`effect-particle-${color}`, color, { transparent: true, opacity: 0.9 }).clone();
      particleMaterial.opacity = 0.9;
      const mesh = addMesh(this.parent, this.resources.octa('effect-particle'), particleMaterial);
      const angle = index / count * Math.PI * 2 + Math.random() * 0.4;
      const speed = 0.7 + Math.random() * (critical ? 1.2 : 0.72);
      mesh.position.set(point.x, 0.45 + Math.random() * 0.45, point.z);
      mesh.scale.setScalar(critical ? 0.12 : 0.08);
      this.particles.push({ mesh, velocity: new THREE.Vector3(Math.cos(angle) * speed, 0.7 + Math.random() * 0.8, Math.sin(angle) * speed), life: 0, maxLife: this.reducedEffects ? 0.28 : 0.46 });
    }
  }

  projectileImpact(x: number, y: number, color: number): void {
    this.ring(x, y, 0.55, color);
    this.burst(x, y, color);
  }

  enemyDeath(x: number, y: number, color: number, elite = false): void {
    this.ring(x, y, elite ? 1.05 : 0.7, elite ? 0xffc04f : color);
    this.burst(x, y, elite ? 0xffd37c : color, elite);
  }

  collect(x: number, y: number, color = 0x75eaff): void {
    this.ring(x, y, 0.42, color);
    this.burst(x, y, color);
  }

  levelUp(x: number, y: number): void {
    this.ring(x, y, 1.65, 0x9cecff);
    this.burst(x, y, 0xd8f7ff, true);
  }

  bossArrival(x: number, y: number): void {
    this.ring(x, y, 2.25, 0xff5b66);
    this.burst(x, y, 0xff8a62, true);
    this.ring(x, y, 1.25, 0xffd37c);
  }

  bossDeath(x: number, y: number): void {
    this.ring(x, y, 3.1, 0xffc04f);
    this.burst(x, y, 0xffd37c, true);
    this.burst(x, y, 0xff5b66, true);
  }

  lightning(fromX: number, fromY: number, toX: number, toY: number, color: number): void {
    const start = logicalToWorld(fromX, fromY);
    const end = logicalToWorld(toX, toY);
    const distance = start.distanceTo(end);
    const segments = Math.max(3, Math.min(7, Math.ceil(distance * 1.5)));
    const points: THREE.Vector3[] = [];
    for (let index = 0; index <= segments; index += 1) {
      const progress = index / segments;
      const jitter = index === 0 || index === segments ? 0 : 0.13;
      points.push(new THREE.Vector3(
        THREE.MathUtils.lerp(start.x, end.x, progress) + (Math.random() - 0.5) * jitter,
        0.78 + (Math.random() - 0.5) * 0.08,
        THREE.MathUtils.lerp(start.z, end.z, progress) + (Math.random() - 0.5) * jitter,
      ));
    }
    const group = new THREE.Group();
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false });
    group.add(new THREE.Line(geometry, material));
    this.parent.add(group);
    this.effects.push({ group, life: 0, maxLife: this.reducedEffects ? 0.1 : 0.15, kind: 'lightning' });
  }

  update(delta: number): void {
    for (let index = this.effects.length - 1; index >= 0; index -= 1) {
      const effect = this.effects[index];
      effect.life += delta;
      const progress = Math.min(1, effect.life / effect.maxLife);
      effect.group.scale.setScalar(effect.kind === 'ring' ? 0.38 + progress * 1.05 : 1);
      effect.group.traverse((child) => {
        if ((child instanceof THREE.Mesh || child instanceof THREE.Line) && child.material instanceof THREE.Material) child.material.opacity = (child.userData.baseOpacity as number | undefined ?? 0.95) * (1 - progress);
      });
      if (effect.life >= effect.maxLife) {
        disposeTransientMaterials(effect.group);
        effect.group.removeFromParent();
        this.effects.splice(index, 1);
      }
    }
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.life += delta;
      particle.velocity.y -= delta * 2.4;
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      particle.mesh.rotation.x += delta * 8;
      particle.mesh.rotation.z += delta * 5;
      const progress = particle.life / particle.maxLife;
      particle.mesh.scale.setScalar(Math.max(0.001, (1 - progress) * 0.08));
      const material = particle.mesh.material;
      if (material instanceof THREE.Material) material.opacity = Math.max(0, 0.9 * (1 - progress));
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
