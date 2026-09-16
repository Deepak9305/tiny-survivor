import * as THREE from 'three';
import type { ProjectileSpec } from '../../game/systems/WeaponSystem';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

let projectileSequence = 0;

function darken(color: number, amount = 0.55): number {
  return new THREE.Color(color).multiplyScalar(amount).getHex();
}

function brighten(color: number, amount = 0.38): number {
  return new THREE.Color(color).lerp(new THREE.Color(0xffffff), amount).getHex();
}

export class Projectile3D {
  readonly id = `projectile-${projectileSequence += 1}`;
  readonly group: THREE.Group;
  readonly spec: ProjectileSpec;
  x: number;
  y: number;
  private readonly velocity = new THREE.Vector2();
  private readonly rotors: THREE.Object3D[] = [];
  private readonly pulsing: THREE.Object3D[] = [];
  private remainingPierce: number;
  private age = 0;
  active = true;

  constructor(parent: THREE.Object3D, x: number, y: number, spec: ProjectileSpec, resources: SharedResources) {
    this.group = new THREE.Group();
    this.group.name = this.id;
    this.x = x;
    this.y = y;
    this.spec = spec;
    this.remainingPierce = spec.pierce;

    const hasDir = spec.direction && (spec.direction.x !== 0 || spec.direction.y !== 0);
    const baseAngle = hasDir
      ? Math.atan2(spec.direction!.y, spec.direction!.x)
      : (spec.target ? Math.atan2(spec.target.y - y, spec.target.x - x) : 0);
    const targetAngle = baseAngle + (spec.angle ?? 0);
    this.velocity.set(Math.cos(targetAngle), Math.sin(targetAngle)).multiplyScalar(spec.speed);

    const isFire = spec.weaponId === 'fire-orb';
    const isChain = spec.weaponId === 'chain-lightning';
    const empowered = Boolean(spec.empowered);

    this.headingAngle = Math.atan2(this.velocity.x, this.velocity.y);
    this.group.rotation.y = this.headingAngle;

    if (isFire) {
      this.buildFireball(resources);
    } else if (isChain) {
      this.buildLightningNode(resources);
    } else {
      this.buildArcaneBolt(resources, empowered);
    }

    parent.add(this.group);
    this.syncPosition();
  }

  private readonly headingAngle: number;

  private buildFireball(resources: SharedResources): void {
    const core = addMesh(
      this.group,
      resources.ico('fire-proj-core-premium'),
      resources.standardMaterial('fire-core-premium-mat', 0xffffff, {
        emissive: 0xffe5a0,
        emissiveIntensity: 3.6,
        roughness: 0.06,
      })
    );
    core.scale.setScalar(0.30);
    core.position.y = 0.70;
    this.rotors.push(core);

    const shell = addMesh(
      this.group,
      resources.octa('fire-proj-shell-premium'),
      resources.standardMaterial('fire-shell-premium-mat', 0xff6826, {
        emissive: 0xff3b0d,
        emissiveIntensity: 3.0,
        roughness: 0.16,
        transparent: true,
        opacity: 0.92,
      })
    );
    shell.scale.setScalar(0.55);
    shell.position.y = 0.70;
    this.rotors.push(shell);
    this.pulsing.push(shell);

    const halo = addMesh(
      this.group,
      resources.torus('fire-proj-halo-premium'),
      resources.basicMaterial('fire-proj-halo-premium-mat', 0xffa340, {
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
      })
    );
    halo.scale.setScalar(0.58);
    halo.position.y = 0.70;
    halo.rotation.x = Math.PI / 2;
    this.rotors.push(halo);

    const flameTail = addMesh(
      this.group,
      resources.cone('fire-proj-tail-premium'),
      resources.basicMaterial('fire-tail-premium-mat', 0xff310f, {
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      })
    );
    flameTail.scale.set(0.31, 1.25, 0.31);
    flameTail.position.set(0, 0.70, -0.66);
    flameTail.rotation.x = -Math.PI / 2;

    const hotTail = addMesh(
      this.group,
      resources.cone('fire-proj-hot-tail'),
      resources.basicMaterial('fire-hot-tail-mat', 0xffd46a, {
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      })
    );
    hotTail.scale.set(0.14, 0.86, 0.14);
    hotTail.position.set(0, 0.70, -0.52);
    hotTail.rotation.x = -Math.PI / 2;
  }

  private buildLightningNode(resources: SharedResources): void {
    const core = addMesh(
      this.group,
      resources.octa('lightning-node-premium'),
      resources.standardMaterial('lightning-node-premium-mat', 0xffffff, {
        emissive: 0x8eefff,
        emissiveIntensity: 3.5,
        roughness: 0.05,
      })
    );
    core.scale.setScalar(0.25);
    core.position.y = 0.72;
    this.rotors.push(core);

    for (let index = 0; index < 2; index += 1) {
      const aura = addMesh(
        this.group,
        resources.torus(`lightning-aura-premium-${index}`),
        resources.basicMaterial(`lightning-aura-premium-mat-${index}`, index === 0 ? 0x4de1ff : 0xb78cff, {
          transparent: true,
          opacity: index === 0 ? 0.8 : 0.56,
          depthWrite: false,
        })
      );
      aura.scale.setScalar(index === 0 ? 0.34 : 0.46);
      aura.position.y = 0.72;
      aura.rotation.x = index === 0 ? Math.PI / 2 : Math.PI / 3;
      this.rotors.push(aura);
      this.pulsing.push(aura);
    }
  }

  private buildArcaneBolt(resources: SharedResources, empowered: boolean): void {
    const shellColor = empowered ? 0xffd166 : this.spec.color;
    const hotColor = brighten(shellColor, empowered ? 0.62 : 0.42);
    const trailColor = empowered ? 0xff9f43 : darken(shellColor, 0.72);

    const core = addMesh(
      this.group,
      resources.ico(empowered ? 'magic-core-empowered-premium' : 'magic-core-premium'),
      resources.standardMaterial(empowered ? 'magic-core-empowered-premium-mat' : 'magic-core-premium-mat', 0xffffff, {
        emissive: hotColor,
        emissiveIntensity: empowered ? 4.0 : 3.2,
        roughness: 0.05,
      })
    );
    core.scale.setScalar(empowered ? 0.36 : 0.245);
    core.position.y = 0.72;
    this.rotors.push(core);

    const shell = addMesh(
      this.group,
      resources.octa(empowered ? 'magic-shell-empowered-premium' : 'magic-shell-premium'),
      resources.standardMaterial(`magic-shell-premium-mat-${shellColor}-${empowered ? 'emp' : 'normal'}`, shellColor, {
        emissive: shellColor,
        emissiveIntensity: empowered ? 3.5 : 2.75,
        roughness: 0.09,
        transparent: true,
        opacity: 0.94,
      })
    );
    shell.scale.setScalar(empowered ? 0.58 : 0.41);
    shell.position.y = 0.72;
    shell.rotation.z = Math.PI / 4;
    this.rotors.push(shell);
    this.pulsing.push(shell);

    // Two nested tracer ribbons produce a much cleaner high-speed silhouette than
    // one chunky cone while remaining only two cheap shared-geometry meshes.
    const trail = addMesh(
      this.group,
      resources.cone(empowered ? 'magic-trail-empowered-premium' : 'magic-trail-premium'),
      resources.basicMaterial(`magic-trail-premium-mat-${trailColor}-${empowered ? 'emp' : 'normal'}`, trailColor, {
        transparent: true,
        opacity: empowered ? 0.88 : 0.68,
        depthWrite: false,
      })
    );
    trail.scale.set(empowered ? 0.29 : 0.19, empowered ? 1.55 : 1.14, empowered ? 0.29 : 0.19);
    trail.position.set(0, 0.72, empowered ? -0.76 : -0.56);
    trail.rotation.x = -Math.PI / 2;

    const innerTrail = addMesh(
      this.group,
      resources.cone(empowered ? 'magic-inner-trail-empowered' : 'magic-inner-trail'),
      resources.basicMaterial(`magic-inner-trail-mat-${hotColor}-${empowered ? 'emp' : 'normal'}`, hotColor, {
        transparent: true,
        opacity: empowered ? 0.62 : 0.42,
        depthWrite: false,
      })
    );
    innerTrail.scale.set(empowered ? 0.11 : 0.08, empowered ? 1.10 : 0.78, empowered ? 0.11 : 0.08);
    innerTrail.position.set(0, 0.72, empowered ? -0.55 : -0.42);
    innerTrail.rotation.x = -Math.PI / 2;

    const glowRing = addMesh(
      this.group,
      resources.torus(empowered ? 'magic-ring-empowered-premium' : 'magic-ring-premium'),
      resources.basicMaterial(`magic-ring-premium-mat-${shellColor}-${empowered ? 'emp' : 'normal'}`, shellColor, {
        transparent: true,
        opacity: empowered ? 0.9 : 0.68,
        depthWrite: false,
      })
    );
    glowRing.scale.setScalar(empowered ? 0.48 : 0.31);
    glowRing.position.y = 0.72;
    this.rotors.push(glowRing);
    this.pulsing.push(glowRing);

    const crossRing = addMesh(
      this.group,
      resources.torus(empowered ? 'magic-cross-ring-empowered' : 'magic-cross-ring'),
      resources.basicMaterial(`magic-cross-ring-mat-${hotColor}-${empowered ? 'emp' : 'normal'}`, hotColor, {
        transparent: true,
        opacity: empowered ? 0.62 : 0.34,
        depthWrite: false,
      })
    );
    crossRing.scale.setScalar(empowered ? 0.62 : 0.39);
    crossRing.position.y = 0.72;
    crossRing.rotation.x = Math.PI / 2;
    this.rotors.push(crossRing);

    if (empowered) {
      const crown = addMesh(
        this.group,
        resources.ring('magic-empowered-crown', 0.34, 0.48),
        resources.basicMaterial('magic-empowered-crown-mat', 0xffffff, {
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      crown.position.y = 0.72;
      crown.rotation.x = -Math.PI / 2;
      crown.scale.setScalar(1.18);
      this.rotors.push(crown);
      this.pulsing.push(crown);
    }
  }

  update(delta: number): void {
    this.age += delta;
    this.x += this.velocity.x * delta;
    this.y += this.velocity.y * delta;
    this.syncPosition();

    const spin = this.spec.empowered ? 18 : 12;
    for (let index = 0; index < this.rotors.length; index += 1) {
      const rotor = this.rotors[index];
      rotor.rotation.y += delta * spin * (index % 2 === 0 ? 1 : -0.72);
      rotor.rotation.z += delta * spin * 0.28 * (index % 3 === 0 ? 1 : -1);
    }

    const pulse = 1 + Math.sin(this.age * (this.spec.empowered ? 22 : 15)) * (this.spec.empowered ? 0.08 : 0.045);
    for (const item of this.pulsing) {
      const base = item.userData.premiumBaseScale as number | undefined;
      if (base === undefined) {
        item.userData.premiumBaseScale = item.scale.x;
      } else {
        item.scale.setScalar(base * pulse);
      }
    }

    if (this.spec.explosive ? this.age > 1.8 : this.age > 3.2) this.active = false;
  }

  canPierce(): boolean {
    if (this.remainingPierce <= 0) {
      this.active = false;
      return false;
    }
    this.remainingPierce -= 1;
    return true;
  }

  destroy(): void {
    this.active = false;
    this.group.removeFromParent();
  }

  private syncPosition(): void {
    setLogicalPosition(this.group, this.x, this.y);
  }
}
