import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a painted skull face texture with detailed eye sockets, nasal cavity,
 * cracked bone sutures, teeth, and glowing runic soul accents.
 */
export function getSkeletonSkullTexture(): THREE.CanvasTexture {
  const key = 'skeleton-skull-skin';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base weathered bone gradient
    const bg = ctx.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, '#dbe6f0');
    bg.addColorStop(0.45, '#c5d5e2');
    bg.addColorStop(0.75, '#a4b7c8');
    bg.addColorStop(1, '#8598aa');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // Weathered bone noise and mottling
    for (let i = 0; i < 600; i += 1) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 1 + Math.random() * 3;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(70, 85, 105, 0.08)' : 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cranial suture cracks
    ctx.strokeStyle = 'rgba(60, 75, 95, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(130, 40);
    ctx.lineTo(125, 75);
    ctx.lineTo(132, 105);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(50, 45);
    ctx.lineTo(95, 55);
    ctx.lineTo(128, 52);
    ctx.lineTo(170, 56);
    ctx.lineTo(210, 48);
    ctx.stroke();

    // Dark sunken eye sockets
    const drawSocket = (cx: number, cy: number) => {
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 34);
      grad.addColorStop(0, '#040910');
      grad.addColorStop(0.65, '#0b1622');
      grad.addColorStop(0.9, '#26374a');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 32, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing inner soul fire
      const soulGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, 16);
      soulGrad.addColorStop(0, 'rgba(120, 240, 255, 0.95)');
      soulGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.7)');
      soulGrad.addColorStop(1, 'rgba(14, 116, 144, 0)');
      ctx.fillStyle = soulGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();
    };

    drawSocket(82, 112);
    drawSocket(174, 112);

    // Nasal cavity (inverted heart/triangle)
    ctx.fillStyle = '#060d16';
    ctx.beginPath();
    ctx.moveTo(128, 142);
    ctx.lineTo(120, 168);
    ctx.lineTo(128, 164);
    ctx.lineTo(136, 168);
    ctx.closePath();
    ctx.fill();

    // Upper and lower teeth row
    ctx.fillStyle = '#f0f5fa';
    ctx.strokeStyle = '#223242';
    ctx.lineWidth = 1.8;
    const toothCount = 7;
    const startX = 74;
    const toothW = 15;
    for (let t = 0; t < toothCount; t += 1) {
      const tx = startX + t * 16;
      // Upper tooth
      ctx.beginPath();
      ctx.rect(tx, 186, toothW, 18);
      ctx.fill();
      ctx.stroke();
      // Lower tooth
      ctx.beginPath();
      ctx.rect(tx + 2, 206, toothW - 4, 16);
      ctx.fill();
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}
/**
 * Creates a painted zombie flesh texture with rotting necrotic green/olive tones,
 * gruesome bruised spots, exposed wounds, and stitched scars.
 */
export function getZombieSkinTexture(): THREE.CanvasTexture {
  const key = 'zombie-skin-tex';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base sickly decaying green gradient
    const bg = ctx.createLinearGradient(0, 0, 256, 256);
    bg.addColorStop(0, '#627c52');
    bg.addColorStop(0.5, '#4f6842');
    bg.addColorStop(0.85, '#3a4e32');
    bg.addColorStop(1, '#2c3c26');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // Putrid purple/brown bruise splotches
    for (let b = 0; b < 12; b += 1) {
      const bx = Math.random() * 256;
      const by = Math.random() * 256;
      const br = 18 + Math.random() * 32;
      const bruise = ctx.createRadialGradient(bx, by, 4, bx, by, br);
      bruise.addColorStop(0, 'rgba(88, 38, 72, 0.45)');
      bruise.addColorStop(0.6, 'rgba(56, 24, 48, 0.25)');
      bruise.addColorStop(1, 'transparent');
      ctx.fillStyle = bruise;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gruesome open wound with coagulated blood
    const woundGrad = ctx.createLinearGradient(40, 140, 160, 210);
    woundGrad.addColorStop(0, '#58111a');
    woundGrad.addColorStop(0.4, '#881824');
    woundGrad.addColorStop(0.8, '#3d080e');
    ctx.fillStyle = woundGrad;
    ctx.beginPath();
    ctx.ellipse(110, 175, 48, 22, -0.28, 0, Math.PI * 2);
    ctx.fill();

    // Exposed rib bone fragments in wound
    ctx.fillStyle = '#e2ecf2';
    ctx.fillRect(85, 170, 8, 18);
    ctx.fillRect(104, 166, 9, 21);
    ctx.fillRect(124, 172, 8, 17);

    // Heavy stitched suture line
    ctx.strokeStyle = '#182416';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(35, 60);
    ctx.quadraticCurveTo(110, 95, 205, 55);
    ctx.stroke();

    // Cross-stitches
    ctx.strokeStyle = '#d4c4a8';
    ctx.lineWidth = 2.2;
    for (let s = 45; s < 195; s += 20) {
      const sy = 60 + Math.sin(s * 0.03) * 16;
      ctx.beginPath();
      ctx.moveTo(s - 5, sy - 8);
      ctx.lineTo(s + 5, sy + 8);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates a zombie head/face texture with asymmetrical dead eyes and a stitched snarling mouth.
 */
export function getZombieFaceTexture(): THREE.CanvasTexture {
  const key = 'zombie-face-tex';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, '#5a7548');
    bg.addColorStop(0.6, '#486238');
    bg.addColorStop(1, '#344926');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // Dark sunken eye hollows
    ctx.fillStyle = '#172214';
    ctx.beginPath();
    ctx.ellipse(82, 108, 30, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(174, 108, 32, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left eye: Glowing sickly yellow cataract pupil
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(82, 108, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(82, 108, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(85, 105, 3, 0, Math.PI * 2);
    ctx.fill();

    // Right eye: Dark hollow rotted socket with dripping blood
    ctx.fillStyle = '#060a05';
    ctx.beginPath();
    ctx.arc(174, 108, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b121c';
    ctx.beginPath();
    ctx.ellipse(174, 128, 7, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snarling stitched mouth with exposed rotting yellow teeth
    ctx.fillStyle = '#121c10';
    ctx.beginPath();
    ctx.ellipse(128, 192, 58, 20, 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Teeth
    ctx.fillStyle = '#fde68a';
    for (let t = 84; t < 174; t += 15) {
      ctx.fillRect(t, 184, 10, 14);
      ctx.fillRect(t + 3, 198, 8, 12);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates a weathered heraldic round shield texture with wooden planks,
 * iron concentric band, and gold studs.
 */
export function getShieldTexture(): THREE.CanvasTexture {
  const key = 'shield-skin-tex';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Wood background with concentric grain
    const bg = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    bg.addColorStop(0, '#5a3d28');
    bg.addColorStop(0.7, '#3c2718');
    bg.addColorStop(1, '#24160d');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(128, 128, 124, 0, Math.PI * 2);
    ctx.fill();

    // Vertical plank grooves
    ctx.strokeStyle = '#180e07';
    ctx.lineWidth = 4;
    for (const px of [68, 108, 148, 188]) {
      ctx.beginPath();
      ctx.moveTo(px, 10);
      ctx.lineTo(px, 246);
      ctx.stroke();
    }

    // Outer iron reinforcing ring
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(128, 128, 115, 0, Math.PI * 2);
    ctx.stroke();

    // Inner iron border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 128, 104, 0, Math.PI * 2);
    ctx.stroke();

    // Metal rivet studs
    ctx.fillStyle = '#cbd5e1';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const rx = 128 + Math.cos(a) * 115;
      const ry = 128 + Math.sin(a) * 115;
      ctx.beginPath();
      ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center iron boss
    const boss = ctx.createRadialGradient(124, 124, 4, 128, 128, 42);
    boss.addColorStop(0, '#94a3b8');
    boss.addColorStop(0.65, '#475569');
    boss.addColorStop(1, '#1e293b');
    ctx.fillStyle = boss;
    ctx.beginPath();
    ctx.arc(128, 128, 38, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates a torn cloth / tattered ragged fabric texture for robes and loincloths.
 */
export function getTornClothTexture(baseHex: string, accentHex: string): THREE.CanvasTexture {
  const key = `torn-cloth-${baseHex}-${accentHex}`;
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 128, 128);

    // Cross-weave grain
    ctx.fillStyle = accentHex;
    for (let y = 0; y < 128; y += 4) {
      for (let x = 0; x < 128; x += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Frayed stains and grime
    for (let i = 0; i < 6; i += 1) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.arc(Math.random() * 128, Math.random() * 128, 8 + Math.random() * 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates an obsidian rock texture with glowing volcanic magma veins for demons.
 */
export function getDemonLavaTexture(): THREE.CanvasTexture {
  const key = 'demon-lava-tex';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Dark charred volcanic rock
    ctx.fillStyle = '#180708';
    ctx.fillRect(0, 0, 256, 256);

    // Glowing magma fissures
    const fissures = [
      [[30, 20], [80, 70], [140, 110], [210, 190], [240, 250]],
      [[220, 10], [170, 80], [130, 130], [90, 200], [40, 240]],
      [[70, 140], [120, 160], [180, 150]],
    ];

    for (const line of fissures) {
      // Outer heat glow
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(line[0][0], line[0][1]);
      for (let i = 1; i < line.length; i += 1) ctx.lineTo(line[i][0], line[i][1]);
      ctx.stroke();

      // Bright magma core
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(line[0][0], line[0][1]);
      for (let i = 1; i < line.length; i += 1) ctx.lineTo(line[i][0], line[i][1]);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates polished steel plate armor texture with heraldic insignia for knights.
 */
export function getKnightShieldTexture(): THREE.CanvasTexture {
  const key = 'knight-shield-tex';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Polished dark blue steel shield background
    const bg = ctx.createLinearGradient(0, 0, 256, 256);
    bg.addColorStop(0, '#3b5575');
    bg.addColorStop(0.5, '#20344d');
    bg.addColorStop(1, '#111d2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // Ornate gold border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 16;
    ctx.strokeRect(10, 10, 236, 236);

    // Bold golden heraldic cross
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(108, 20, 40, 216);
    ctx.fillRect(30, 92, 196, 40);

    // Golden boss diamond in center
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(128, 82);
    ctx.lineTo(158, 112);
    ctx.lineTo(128, 142);
    ctx.lineTo(98, 112);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates ornate fluted steel plate armor texture with engraved gold filigree.
 */
export function getGothicArmorTexture(): THREE.CanvasTexture {
  const key = 'gothic-armor-tex';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Dark burnished steel background
    const bg = ctx.createLinearGradient(0, 0, 256, 256);
    bg.addColorStop(0, '#2e3b4e');
    bg.addColorStop(0.5, '#1b2432');
    bg.addColorStop(1, '#0f1722');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // Fluted vertical armor ridges
    for (let x = 32; x < 256; x += 32) {
      const fluting = ctx.createLinearGradient(x - 12, 0, x + 12, 0);
      fluting.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      fluting.addColorStop(0.5, 'rgba(255, 255, 255, 0.28)');
      fluting.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = fluting;
      ctx.fillRect(x - 10, 0, 20, 256);
    }

    // Gold filigree edge borders
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 240, 240);

    // Gold rivets
    ctx.fillStyle = '#fbbf24';
    for (let y = 24; y < 256; y += 48) {
      ctx.beginPath();
      ctx.arc(16, y, 4, 0, Math.PI * 2);
      ctx.arc(240, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates dark necromancer velvet robe texture with glowing occult runes.
 */
export function getNecroRobeTexture(): THREE.CanvasTexture {
  const key = 'necro-robe-tex';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Deep midnight purple velvet
    const bg = ctx.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, '#260f38');
    bg.addColorStop(0.6, '#180724');
    bg.addColorStop(1, '#0d0214');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // Glowing arcane rune border
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 4;

    // Runic zig-zag along border
    ctx.beginPath();
    for (let y = 16; y < 240; y += 24) {
      ctx.lineTo(24, y);
      ctx.lineTo(36, y + 12);
      ctx.lineTo(24, y + 24);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let y = 16; y < 240; y += 24) {
      ctx.lineTo(232, y);
      ctx.lineTo(220, y + 12);
      ctx.lineTo(232, y + 24);
    }
    ctx.stroke();

    // Occult eye seal in center
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.ellipse(128, 128, 38, 22, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#f3e8ff';
    ctx.beginPath();
    ctx.arc(128, 128, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates coarse bristling wolf pelt texture with feral dark fur, highlights, and runic battle scars.
 */
export function getCursedWolfTexture(): THREE.CanvasTexture {
  const key = 'cursed-wolf-fur-tex';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, '#2d1810');
    bg.addColorStop(0.5, '#1e110c');
    bg.addColorStop(1, '#120805');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // Coarse directional fur strokes
    for (let i = 0; i < 900; i += 1) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const len = 8 + Math.random() * 16;
      const angle = 0.8 + (Math.random() - 0.5) * 0.4;
      ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(75, 45, 30, 0.45)' : 'rgba(160, 100, 60, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    // Glowing ember curse scars
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(70, 60);
    ctx.lineTo(110, 110);
    ctx.lineTo(95, 160);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(150, 80);
    ctx.lineTo(180, 130);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates ancient weathered oak bark texture with deep fissures and mossy lichen.
 */
export function getTreantBarkTexture(): THREE.CanvasTexture {
  const key = 'treant-bark-tex';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, '#3a2718');
    bg.addColorStop(0.5, '#2c1e13');
    bg.addColorStop(1, '#1c130c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // Deep vertical bark fissures
    for (let x = 12; x < 250; x += 18 + Math.random() * 12) {
      ctx.strokeStyle = 'rgba(15, 10, 6, 0.85)';
      ctx.lineWidth = 3 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      let curX = x;
      for (let y = 20; y <= 256; y += 30) {
        curX += (Math.random() - 0.5) * 14;
        ctx.lineTo(curX, y);
      }
      ctx.stroke();
    }

    // Moss and lichen patches
    for (let i = 0; i < 18; i += 1) {
      const cx = Math.random() * 256;
      const cy = Math.random() * 256;
      const r = 12 + Math.random() * 18;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      grad.addColorStop(0, 'rgba(101, 163, 13, 0.65)');
      grad.addColorStop(0.7, 'rgba(63, 98, 18, 0.35)');
      grad.addColorStop(1, 'rgba(30, 50, 10, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates glacial permafrost texture with sharp cyan fissure lines and frozen refraction facets.
 */
export function getIceRimeTexture(): THREE.CanvasTexture {
  const key = 'ice-rime-tex';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 256, 256);
    bg.addColorStop(0, '#e0f2fe');
    bg.addColorStop(0.35, '#7dd3fc');
    bg.addColorStop(0.75, '#38bdf8');
    bg.addColorStop(1, '#0284c7');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // Sharp crystalline ice fractures
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = '#bae6fd';
    ctx.shadowBlur = 4;
    for (let i = 0; i < 12; i += 1) {
      let x = Math.random() * 256;
      let y = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let step = 0; step < 4; step += 1) {
        x += (Math.random() - 0.5) * 60;
        y += (Math.random() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Deep abyssal fissure glow
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.9)';
    ctx.shadowColor = '#0369a1';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(30, 128);
    ctx.lineTo(100, 160);
    ctx.lineTo(170, 110);
    ctx.lineTo(230, 140);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates bramble cloth texture woven with dark twisted vines and poisonous flora.
 */
export function getBrambleClothTexture(): THREE.CanvasTexture {
  const key = 'bramble-cloth-tex';
  const existing = textureCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, '#1c2816');
    bg.addColorStop(0.5, '#121c0e');
    bg.addColorStop(1, '#0a1008');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // Intertwined thorny vine pattern
    ctx.strokeStyle = 'rgba(77, 124, 15, 0.75)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.bezierCurveTo(90, 80, 40, 160, 110, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(230, 0);
    ctx.bezierCurveTo(160, 90, 210, 170, 140, 256);
    ctx.stroke();

    // Sharp thorn spikes
    ctx.fillStyle = '#65a30d';
    for (let y = 30; y < 240; y += 35) {
      ctx.beginPath();
      ctx.arc(60 + (Math.sin(y) * 20), y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Poison bloom accents
    ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 6;
    for (let i = 0; i < 8; i += 1) {
      const bx = 40 + Math.random() * 176;
      const by = 30 + Math.random() * 196;
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}
