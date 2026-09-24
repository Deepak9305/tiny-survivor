import * as THREE from 'three';
import { logicalToWorld } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

type Particle = {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  baseScale: number;
  spinSpeed: number;
  isStar?: boolean;
};

type RingEffect = {
  group: THREE.Group;
  outerMesh: THREE.Mesh;
  outerMat: THREE.MeshBasicMaterial;
  innerMesh: THREE.Mesh;
  innerMat: THREE.MeshBasicMaterial;
  life: number;
  maxLife: number;
  targetScale: number;
};

type GenericEffect = {
  group: THREE.Group;
  life: number;
  maxLife: number;
  kind: 'lightning' | 'beam' | 'slash' | 'streak';
};

export class CombatEffects3D {
  private readonly parent: THREE.Group;
  private readonly resources: SharedResources;
  private readonly reducedEffects: boolean;

  // Active effect collections
  private readonly activeParticles: Particle[] = [];
  private readonly activeRings: RingEffect[] = [];
  private readonly genericEffects: GenericEffect[] = [];

  // Reusable object pools (Zero garbage allocation during combat)
  private readonly particlePool: Particle[] = [];
  private readonly starParticlePool: Particle[] = [];
  private readonly ringPool: RingEffect[] = [];

  // Hard limits for mobile/desktop smoothness
  private readonly maxActiveParticles: number;
  private readonly maxActiveRings: number;

  constructor(parent: THREE.Group, resources: SharedResources, reducedEffects: boolean) {
    this.parent = parent;
    this.resources = resources;
    this.reducedEffects = reducedEffects;
    this.maxActiveParticles = reducedEffects ? 40 : 80;
    this.maxActiveRings = reducedEffects ? 14 : 26;
  }

  /**
   * Spawns a cartoon shockwave ring with zero garbage allocation (pooled).
   */
  ring(x: number, y: number, radius: number, color: number): void {
    if (this.activeRings.length >= this.maxActiveRings) return;

    let item = this.ringPool.pop();
    if (!item) {
      const group = new THREE.Group();
      const outerMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const outerMesh = new THREE.Mesh(this.resources.ring('pooled-ring-outer', 0.5, 0.7), outerMat);
      outerMesh.rotation.x = -Math.PI / 2;
      group.add(outerMesh);

      const innerMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false,
        color: 0xffffff,
      });
      const innerMesh = new THREE.Mesh(this.resources.ring('pooled-ring-inner', 0.3, 0.45), innerMat);
      innerMesh.rotation.x = -Math.PI / 2;
      group.add(innerMesh);

      this.parent.add(group);
      item = {
        group,
        outerMesh,
        outerMat,
        innerMesh,
        innerMat,
        life: 0,
        maxLife: 0.28,
        targetScale: 1,
      };
    }

    item.outerMat.color.setHex(color);
    item.outerMat.opacity = 0.88;
    item.innerMat.opacity = 0.95;

    const point = logicalToWorld(x, y);
    item.group.position.set(point.x, 0.06, point.z);
    item.group.scale.setScalar(0.2);
    item.group.visible = true;
    item.life = 0;
    item.maxLife = this.reducedEffects ? 0.18 : 0.28;
    item.targetScale = Math.max(0.6, radius * 1.6);

    this.activeRings.push(item);
  }

  /**
   * Spawns cartoon star bursts & comic sparks with zero allocation (pooled).
   */
  burst(x: number, y: number, color: number, critical = false): void {
    const point = logicalToWorld(x, y);
    const count = this.reducedEffects ? (critical ? 6 : 3) : (critical ? 12 : 7);

    for (let index = 0; index < count; index += 1) {
      if (this.activeParticles.length >= this.maxActiveParticles) break;

      const isStar = critical && (index % 3 === 0);
      const isCore = !isStar && (index % 2 === 0);
      const pColor = isStar ? 0xfacc15 : (isCore ? 0xffffff : color);

      const particle = isStar ? this.acquireStarParticle() : this.acquireNormalParticle();
      particle.material.color.setHex(pColor);
      particle.material.opacity = 0.96;

      const angle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = (critical ? 1.5 : 1.0) + Math.random() * (critical ? 1.8 : 0.9);
      const baseScale = isStar ? 0.22 : (critical ? 0.14 : 0.09) * (isCore ? 0.8 : 1.0);

      particle.mesh.position.set(
        point.x + (Math.random() - 0.5) * 0.15,
        0.45 + Math.random() * 0.4,
        point.z + (Math.random() - 0.5) * 0.15
      );
      particle.mesh.scale.setScalar(baseScale);
      particle.mesh.visible = true;

      particle.velocity.set(
        Math.cos(angle) * speed,
        (isStar ? 1.6 : 1.1) + Math.random() * 1.1,
        Math.sin(angle) * speed
      );
      particle.life = 0;
      particle.maxLife = this.reducedEffects ? 0.26 : (isStar ? 0.55 : 0.44);
      particle.baseScale = baseScale;
      particle.spinSpeed = (Math.random() - 0.5) * 16;
      particle.isStar = isStar;

      this.activeParticles.push(particle);
    }
  }

  dustPuff(x: number, y: number, count = 2): void {
    if (this.reducedEffects) return;
    const point = logicalToWorld(x, y);

    for (let index = 0; index < count; index += 1) {
      if (this.activeParticles.length >= this.maxActiveParticles) break;

      const particle = this.acquireNormalParticle();
      particle.material.color.setHex(0xa0aec0);
      particle.material.opacity = 0.4;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.25;
      const baseScale = 0.07 + Math.random() * 0.05;

      particle.mesh.position.set(
        point.x + (Math.random() - 0.5) * 0.2,
        0.05,
        point.z + (Math.random() - 0.5) * 0.2
      );
      particle.mesh.scale.setScalar(baseScale);
      particle.mesh.visible = true;

      particle.velocity.set(
        Math.cos(angle) * speed,
        0.3 + Math.random() * 0.25,
        Math.sin(angle) * speed
      );
      particle.life = 0;
      particle.maxLife = 0.24;
      particle.baseScale = baseScale;
      particle.spinSpeed = 4;
      particle.isStar = false;

      this.activeParticles.push(particle);
    }
  }

  projectileImpact(x: number, y: number, color: number): void {
    this.ring(x, y, 0.72, color);
    this.burst(x, y, color, false);
  }

  enemyDeath(x: number, y: number, color: number, elite = false): void {
    this.ring(x, y, elite ? 1.4 : 0.9, elite ? 0xffd155 : color);
    this.burst(x, y, elite ? 0xffe277 : color, elite);
    if (elite) {
      this.ring(x, y, 0.65, 0xffffff);
      // Extra goofy golden star burst for elites
      this.burst(x, y, 0xfacc15, true);
    }
  }

  collect(x: number, y: number, color = 0x75eaff): void {
    this.ring(x, y, 0.52, color);
    this.burst(x, y, color, false);
  }

  levelUp(x: number, y: number): void {
    this.ring(x, y, 2.2, 0x9cecff);
    this.ring(x, y, 1.4, 0xffffff);
    this.burst(x, y, 0x62e8ff, true);
    this.burst(x, y, 0xfacc15, true);
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
    this.burst(x, y, 0xfacc15, true);
  }

  explosion(x: number, y: number, radius = 1.2, color = 0xff6622): void {
    this.ring(x, y, radius * 1.5, color);
    this.ring(x, y, radius * 0.85, 0xfff4bb);
    this.burst(x, y, color, true);
    this.burst(x, y, 0xffdd44, false);
    this.burst(x, y, 0xffffff, false);
  }

  freezeRing(x: number, y: number, radius = 2.4): void {
    this.ring(x, y, radius * 1.25, 0x5ddcff);
    this.ring(x, y, radius * 0.7, 0xffffff);
    this.burst(x, y, 0x88e6ff, true);
    this.burst(x, y, 0xffffff, false);
  }

  healPulse(x: number, y: number): void {
    this.ring(x, y, 1.1, 0x22c55e);
    this.ring(x, y, 0.7, 0x86efac);
    this.burst(x, y, 0x4ade80, false);
  }

  lightning(fromX: number, fromY: number, toX: number, toY: number, color: number): void {
    const start = logicalToWorld(fromX, fromY);
    const end = logicalToWorld(toX, toY);
    const distance = start.distanceTo(end);
    const segments = Math.max(3, Math.min(6, Math.ceil(distance * 1.5)));
    const points: THREE.Vector3[] = [];

    for (let index = 0; index <= segments; index += 1) {
      const progress = index / segments;
      const jitter = index === 0 || index === segments ? 0 : 0.2;
      points.push(
        new THREE.Vector3(
          THREE.MathUtils.lerp(start.x, end.x, progress) + (Math.random() - 0.5) * jitter,
          0.78 + (Math.random() - 0.5) * 0.15,
          THREE.MathUtils.lerp(start.z, end.z, progress) + (Math.random() - 0.5) * jitter
        )
      );
    }

    const group = new THREE.Group();
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

      const outerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, segLen, 5), outerMat);
      outerMesh.position.copy(segMid);
      outerMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pB.clone().sub(pA).normalize());
      group.add(outerMesh);

      const coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, segLen, 5), coreMat);
      coreMesh.position.copy(segMid);
      coreMesh.quaternion.copy(outerMesh.quaternion);
      group.add(coreMesh);
    }

    this.parent.add(group);
    this.genericEffects.push({ group, life: 0, maxLife: this.reducedEffects ? 0.12 : 0.18, kind: 'lightning' });
    this.burst(toX, toY, color, false);
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

    const mid = start.clone().lerp(end, 0.5);
    group.position.set(mid.x, 0.72, mid.z);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());

    this.parent.add(group);
    this.genericEffects.push({ group, life: 0, maxLife: this.reducedEffects ? 0.14 : 0.22, kind: 'beam' });
    this.burst(fromX, fromY, color, false);
    this.burst(toX, toY, color, true);
  }

  heroMeleeStrike(
    heroId: string,
    originX: number,
    originY: number,
    dirX: number,
    dirY: number,
    reach: number,
    color = 0xffd166,
    empowered = false
  ): void {
    const start = logicalToWorld(originX, originY);
    const group = new THREE.Group();
    const slashAngle = Math.atan2(dirX, dirY);

    const arcMat = this.resources.basicMaterial(`slash-arc-${heroId}-${color}`, color, {
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const coreMat = this.resources.basicMaterial('slash-core-shared', 0xffffff, {
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const arcRadius = Math.max(0.65, reach * 0.026 * (empowered ? 1.22 : 1.0));

    if (heroId === 'gunslinger') {
      const blastGeom = this.resources.ring(`shotgun-blast-${reach}`, arcRadius * 0.45, arcRadius * 0.95);
      const blastMesh = addMesh(group, blastGeom, arcMat);
      blastMesh.rotation.x = -Math.PI / 2;
      blastMesh.rotation.z = -slashAngle;
      blastMesh.scale.set(0.7, 0.4, 0.7);

      const coreBlast = addMesh(group, this.resources.ring(`shotgun-core-${reach}`, arcRadius * 0.55, arcRadius * 0.85), coreMat);
      coreBlast.rotation.x = -Math.PI / 2;
      coreBlast.rotation.z = -slashAngle;
      coreBlast.scale.set(0.6, 0.35, 0.6);

      group.position.set(start.x + dirX * reach * 0.015, 0.65, start.z + dirY * reach * 0.015);
      this.parent.add(group);
      this.genericEffects.push({ group, life: 0, maxLife: 0.12, kind: 'slash' });
      this.burst(originX + dirX * reach * 0.4, originY + dirY * reach * 0.4, color, empowered);
    } else {
      const outerRing = addMesh(group, this.resources.ring(`slash-arc-${reach}`, arcRadius * 0.7, arcRadius * 1.2), arcMat);
      outerRing.rotation.x = -Math.PI / 2;
      outerRing.rotation.z = -slashAngle;
      outerRing.scale.set(1.3, 0.48, 1.3);

      const innerRing = addMesh(group, this.resources.ring(`slash-core-${reach}`, arcRadius * 0.85, arcRadius * 1.1), coreMat);
      innerRing.rotation.x = -Math.PI / 2;
      innerRing.rotation.z = -slashAngle;
      innerRing.scale.set(1.2, 0.42, 1.2);

      group.position.set(start.x + dirX * reach * 0.014, 0.65, start.z + dirY * reach * 0.014);
      this.parent.add(group);
      this.genericEffects.push({ group, life: 0, maxLife: 0.14, kind: 'slash' });
      this.burst(originX + dirX * reach * 0.75, originY + dirY * reach * 0.75, color, empowered);
    }
  }

  slashArc(originX: number, originY: number, dirX: number, dirY: number, reach: number, color = 0xffd166): void {
    this.heroMeleeStrike('warrior', originX, originY, dirX, dirY, reach, color, false);
  }

  dashStreak(x: number, y: number, dirX: number, dirY: number, color = 0x38bdf8): void {
    this.ring(x, y, 0.48, color);
    this.dustPuff(x, y, 3);
  }

  meteorBlast(x: number, y: number, radius = 70): void {
    this.ring(x, y, radius * 0.026, 0xef4444);
    this.ring(x, y, radius * 0.016, 0xfacc15);
    this.burst(x, y, 0xf97316, true);
    this.burst(x, y, 0xfef08a, true);
    this.explosion(x, y, radius * 0.024, 0xf97316);
  }

  update(delta: number): void {
    // 1. Update pooled shockwave rings
    for (let i = this.activeRings.length - 1; i >= 0; i--) {
      const r = this.activeRings[i];
      r.life += delta;
      const progress = Math.min(1, r.life / r.maxLife);

      // Cartoon springy expansion
      const easeOut = 1 - Math.pow(1 - progress, 2.5);
      const currentScale = 0.2 + easeOut * r.targetScale;
      r.group.scale.setScalar(currentScale);

      const fade = 1 - progress * progress;
      r.outerMat.opacity = 0.88 * fade;
      r.innerMat.opacity = 0.95 * fade;

      if (r.life >= r.maxLife) {
        r.group.visible = false;
        this.activeRings.splice(i, 1);
        this.ringPool.push(r);
      }
    }

    // 2. Update pooled particles (sparks & cartoon stars)
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life += delta;
      p.velocity.y -= delta * (p.isStar ? 4.2 : 3.0);
      p.velocity.multiplyScalar(Math.pow(0.88, delta * 30));
      p.mesh.position.addScaledVector(p.velocity, delta);

      p.mesh.rotation.x += delta * p.spinSpeed;
      p.mesh.rotation.z += delta * p.spinSpeed * 0.7;

      const progress = Math.min(1, p.life / p.maxLife);
      const shrinkEase = Math.pow(1 - progress, 1.6);
      p.mesh.scale.setScalar(Math.max(0.001, shrinkEase * p.baseScale));
      p.material.opacity = Math.max(0, 0.96 * (1 - progress * progress));

      if (p.life >= p.maxLife) {
        p.mesh.visible = false;
        this.activeParticles.splice(i, 1);
        if (p.isStar) {
          this.starParticlePool.push(p);
        } else {
          this.particlePool.push(p);
        }
      }
    }

    // 3. Update generic short-lived effects (lightning beams, slashes)
    for (let i = this.genericEffects.length - 1; i >= 0; i--) {
      const effect = this.genericEffects[i];
      effect.life += delta;
      const progress = Math.min(1, effect.life / effect.maxLife);

      if (effect.kind === 'slash') {
        const ease = 1 - Math.pow(1 - progress, 2);
        effect.group.scale.setScalar(1 + ease * 0.4);
      }

      if (effect.life >= effect.maxLife) {
        effect.group.removeFromParent();
        this.genericEffects.splice(i, 1);
      }
    }
  }

  clear(): void {
    for (const r of this.activeRings) {
      r.group.visible = false;
      this.ringPool.push(r);
    }
    this.activeRings.length = 0;

    for (const p of this.activeParticles) {
      p.mesh.visible = false;
      if (p.isStar) {
        this.starParticlePool.push(p);
      } else {
        this.particlePool.push(p);
      }
    }
    this.activeParticles.length = 0;

    for (const e of this.genericEffects) {
      e.group.removeFromParent();
    }
    this.genericEffects.length = 0;
  }

  // --- Internal Pool Acquire Helpers ---

  private acquireNormalParticle(): Particle {
    const existing = this.particlePool.pop();
    if (existing) return existing;

    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.resources.octa('pooled-particle-geom'), material);
    this.parent.add(mesh);
    return {
      mesh,
      material,
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 0.4,
      baseScale: 0.1,
      spinSpeed: 5,
      isStar: false,
    };
  }

  private acquireStarParticle(): Particle {
    const existing = this.starParticlePool.pop();
    if (existing) return existing;

    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      color: 0xfacc15,
    });
    // Chunky 4-pointed golden cartoon star (octahedron flattened)
    const mesh = new THREE.Mesh(this.resources.octa('pooled-star-geom'), material);
    mesh.scale.set(1.4, 0.4, 1.4);
    this.parent.add(mesh);
    return {
      mesh,
      material,
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 0.5,
      baseScale: 0.2,
      spinSpeed: 12,
      isStar: true,
    };
  }
}
