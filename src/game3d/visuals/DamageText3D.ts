import * as THREE from 'three';
import { logicalToWorld } from '../core/coordinates';

type DamageLabel = { sprite: THREE.Sprite; canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; texture: THREE.CanvasTexture; life: number; maxLife: number; baseY: number };

export class DamageText3D {
  private readonly parent: THREE.Group;
  private readonly labels: DamageLabel[] = [];
  private readonly pool: DamageLabel[] = [];
  private readonly maxLabels: number;

  constructor(parent: THREE.Group, lowPerformanceMode: boolean) {
    this.parent = parent;
    this.maxLabels = lowPerformanceMode ? 24 : 48;
  }

  show(x: number, y: number, value: number, critical: boolean, color: number): void {
    const label = this.pool.pop() ?? this.createLabel();
    if (!label) return;
    const text = critical ? `${Math.round(value)}!` : `${Math.round(value)}`;
    label.context.clearRect(0, 0, label.canvas.width, label.canvas.height);
    label.context.font = `${critical ? '800 42px' : '800 32px'} Arial, sans-serif`;
    label.context.textAlign = 'center';
    label.context.textBaseline = 'middle';
    label.context.lineWidth = 8;
    label.context.strokeStyle = 'rgba(4, 12, 24, .95)';
    label.context.strokeText(text, 64, 34);
    label.context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    label.context.fillText(text, 64, 34);
    label.texture.needsUpdate = true;
    const point = logicalToWorld(x + (Math.random() * 8 - 4), y);
    label.sprite.position.set(point.x, 1.35, point.z);
    label.sprite.scale.set(critical ? 1.25 : 0.96, critical ? 0.62 : 0.48, 1);
    label.sprite.visible = true;
    label.life = 0;
    label.maxLife = critical ? 0.68 : 0.52;
    label.baseY = 1.35;
    this.labels.push(label);
  }

  update(delta: number): void {
    for (let index = this.labels.length - 1; index >= 0; index -= 1) {
      const label = this.labels[index];
      label.life += delta;
      const progress = label.life / label.maxLife;
      label.sprite.position.y = label.baseY + progress * 0.72;
      label.sprite.material.opacity = Math.max(0, 1 - progress);
      if (label.life >= label.maxLife) {
        label.sprite.visible = false;
        this.labels.splice(index, 1);
        this.pool.push(label);
      }
    }
  }

  clear(): void {
    for (const label of this.labels) label.sprite.visible = false;
    this.pool.push(...this.labels.splice(0));
  }

  dispose(): void {
    this.clear();
    for (const label of this.pool) {
      label.texture.dispose();
      label.sprite.material.dispose();
      label.sprite.removeFromParent();
    }
    this.pool.length = 0;
  }

  private createLabel(): DamageLabel | undefined {
    if (this.labels.length + this.pool.length >= this.maxLabels) return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 68;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: true });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 25;
    this.parent.add(sprite);
    return { sprite, canvas, context, texture, life: 0, maxLife: 0.5, baseY: 1.35 };
  }
}
