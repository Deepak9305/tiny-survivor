import * as THREE from 'three';
import { logicalToWorld } from '../core/coordinates';

type DamageLabel = {
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  life: number;
  maxLife: number;
  baseX: number;
  baseY: number;
  driftX: number;
  baseScaleX: number;
  baseScaleY: number;
  tiltAngle: number;
};

const COMIC_CRIT_WORDS = ['BONK!', 'YEET!', 'OOF!', 'BAM!', 'POW!', 'SPLAT!', 'SMACK!', 'BOOM!', 'YIKES!', 'HONK!', 'WOBBLE!', 'ZOOM!', 'KABOOM!', 'DERP!', 'K.O.!'];
const COMIC_NORMAL_WORDS = ['', '', 'BOP!', '', 'BONK!', '', 'OUCH!', '', 'POP!', ''];

export class DamageText3D {
  private readonly parent: THREE.Group;
  private readonly labels: DamageLabel[] = [];
  private readonly pool: DamageLabel[] = [];
  private readonly maxLabels: number;
  private critWordIndex = 0;
  private normalWordIndex = 0;

  constructor(parent: THREE.Group, lowPerformanceMode: boolean) {
    this.parent = parent;
    this.maxLabels = lowPerformanceMode ? 20 : 36;
  }

  show(x: number, y: number, value: number, critical: boolean, color: number): void {
    const label = this.pool.pop() ?? this.createLabel();
    if (!label) return;

    const roundedVal = Math.round(value);
    let text: string;
    if (critical) {
      const word = COMIC_CRIT_WORDS[this.critWordIndex % COMIC_CRIT_WORDS.length];
      this.critWordIndex += 1;
      text = `${word} ${roundedVal}`;
    } else {
      const miniWord = COMIC_NORMAL_WORDS[this.normalWordIndex % COMIC_NORMAL_WORDS.length];
      this.normalWordIndex += 1;
      text = miniWord ? `${miniWord} ${roundedVal}` : `${roundedVal}`;
    }

    const ctx = label.context;
    const w = label.canvas.width;
    const h = label.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;

    // Goofy Brawl Stars Comic Font
    ctx.font = `${critical ? '900 32px' : '800 26px'} "Lilita One", "Fredoka", "Arial Black", cursive, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Bold 3D Drop Shadow Outline
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = critical ? 9 : 6;
    ctx.strokeStyle = '#090d16';
    ctx.strokeText(text, centerX, centerY + 2);

    // Dark Contour Stroke
    ctx.lineWidth = critical ? 7 : 5;
    ctx.strokeStyle = '#020617';
    ctx.strokeText(text, centerX, centerY);

    // Comic Color Fill
    if (critical) {
      // Golden yellow fill with bright highlight
      ctx.fillStyle = '#facc15';
      ctx.fillText(text, centerX, centerY);
      // Subtle top highlight sheen
      ctx.fillStyle = '#fef08a';
      ctx.fillText(text, centerX, centerY - 1);
    } else {
      const hexColor = `#${color.toString(16).padStart(6, '0')}`;
      ctx.fillStyle = hexColor;
      ctx.fillText(text, centerX, centerY);
    }

    label.texture.needsUpdate = true;

    const point = logicalToWorld(x + (Math.random() * 6 - 3), y);
    label.baseX = point.x;
    label.baseY = 1.35;
    label.driftX = (Math.random() - 0.5) * 0.55;
    label.tiltAngle = (Math.random() - 0.5) * (critical ? 0.40 : 0.22);
    label.baseScaleX = critical ? 1.75 : 1.20;
    label.baseScaleY = critical ? 0.88 : 0.60;

    label.sprite.position.set(point.x, label.baseY, point.z);
    label.sprite.scale.set(label.baseScaleX * 1.35, label.baseScaleY * 1.35, 1);
    label.sprite.material.rotation = label.tiltAngle;
    label.sprite.material.opacity = 1.0;
    label.sprite.visible = true;
    label.life = 0;
    label.maxLife = critical ? 0.68 : 0.48;
    this.labels.push(label);
  }

  update(delta: number): void {
    for (let index = this.labels.length - 1; index >= 0; index -= 1) {
      const label = this.labels[index];
      label.life += delta;
      const progress = label.life / label.maxLife;

      // Goofy Brawl Stars squash & stretch bouncy pop
      const pop = progress < 0.20
        ? 1.0 + (1.0 - progress / 0.20) * 0.65
        : 1.0 - (progress - 0.20) * 0.15;

      label.sprite.scale.set(label.baseScaleX * pop, label.baseScaleY * pop, 1);
      label.sprite.position.x = label.baseX + label.driftX * Math.sin(progress * Math.PI);
      label.sprite.position.y = label.baseY + Math.sin(progress * Math.PI * 0.75) * 0.95;

      // Fade out smoothly at the tail end
      label.sprite.material.opacity = Math.max(0, 1 - Math.pow(progress, 1.8));

      if (label.life >= label.maxLife) {
        label.sprite.visible = false;
        this.labels.splice(index, 1);
        this.pool.push(label);
      }
    }
  }

  clear(): void {
    for (const label of this.labels) {
      label.sprite.visible = false;
    }
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
    canvas.width = 160;
    canvas.height = 76;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 25;
    this.parent.add(sprite);
    return {
      sprite,
      canvas,
      context,
      texture,
      life: 0,
      maxLife: 0.5,
      baseX: 0,
      baseY: 1.35,
      driftX: 0,
      baseScaleX: 1.5,
      baseScaleY: 0.8,
      tiltAngle: 0,
    };
  }
}
