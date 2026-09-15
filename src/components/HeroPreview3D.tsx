import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SharedResources, addMesh } from '../game3d/core/SharedResources';
import { createHeroVisual, createPetModel, createRelicAccent } from '../game3d/visuals/CharacterFactory';
import { biomeThemeForWorld } from '../game3d/scene/BiomeTheme';
import type { EquipmentId, HeroId } from '../types';

interface HeroPreview3DProps {
  heroId?: HeroId | string;
  equippedPet?: EquipmentId | string;
  equippedRelic?: EquipmentId | string;
  worldId?: number;
  className?: string;
}

export function HeroPreview3D({
  heroId = 'shadow',
  equippedPet,
  equippedRelic,
  worldId = 1,
  className = '',
}: HeroPreview3DProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = host.current;
    if (!parent) return undefined;

    const theme = biomeThemeForWorld(worldId);
    const resources = new SharedResources();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.background);
    scene.fog = new THREE.Fog(theme.fog, 6, 16);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
    camera.position.set(0, 1.6, 5.2);
    camera.lookAt(0, 0.95, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.domElement.className = 'hero-preview-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    parent.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.HemisphereLight(theme.keyLight, theme.fillLight, 1.4));
    const mainLight = new THREE.DirectionalLight(theme.keyLight, 1.9);
    mainLight.position.set(-3, 6, 4);
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0x5de7ff, 1.2, 8, 2);
    rimLight.position.set(2, 2.2, 2);
    scene.add(rimLight);

    // Stone Pedestal
    const pedestal = addMesh(scene, resources.cylinder('hero-preview-pedestal'), resources.standardMaterial('hero-preview-pedestal', 0x222a38, { roughness: 0.85, metalness: 0.15 }));
    pedestal.scale.set(1.9, 0.16, 1.9);
    pedestal.position.y = 0.08;

    // Glowing cyan rune ring
    const runeRing = addMesh(scene, resources.ring('hero-rune-ring', 0.82, 0.94), resources.basicMaterial('hero-rune-ring-mat', 0x4dd8ff, { transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
    runeRing.rotation.x = -Math.PI / 2;
    runeRing.position.y = 0.17;

    // Ambient floating magic motes
    const moteCount = 14;
    const motes: { mesh: THREE.Mesh; baseAngle: number; speed: number; height: number; radius: number }[] = [];
    for (let i = 0; i < moteCount; i++) {
      const mote = addMesh(scene, resources.octa(`mote-${i}`), resources.basicMaterial(`mote-mat-${i}`, 0x6ee7ff, { transparent: true, opacity: 0.65 }));
      const baseAngle = (i / moteCount) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 0.7;
      const height = 0.3 + Math.random() * 1.4;
      mote.scale.setScalar(0.045 + Math.random() * 0.035);
      mote.position.set(Math.cos(baseAngle) * radius, height, Math.sin(baseAngle) * radius);
      motes.push({ mesh: mote, baseAngle, speed: 0.4 + Math.random() * 0.5, height, radius });
    }

    // Hero Model
    const heroVisual = createHeroVisual(heroId, resources);
    const hero = heroVisual.root;
    hero.scale.setScalar(1.35);
    hero.position.set(0, 0.18, 0);
    scene.add(hero);

    // Optional Equipped Relic accent
    if (equippedRelic) {
      const relicMesh = createRelicAccent(equippedRelic, resources);
      relicMesh.scale.setScalar(0.85);
      hero.add(relicMesh);
    }

    // Optional Equipped Pet
    let petMesh: THREE.Group | undefined;
    if (equippedPet) {
      petMesh = createPetModel(equippedPet, resources);
      petMesh.position.set(-0.75, 0.28, 0.35);
      scene.add(petMesh);
    }

    const parts = hero.userData.parts as Record<string, THREE.Object3D | THREE.Object3D[]> | undefined;

    let disposed = false;
    let frame = 0;
    let last = performance.now();
    let lastRender = last;

    const resize = () => {
      const width = Math.max(1, parent.clientWidth || 300);
      const height = Math.max(1, parent.clientHeight || 280);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);
    resize();

    const render = (now: number) => {
      if (disposed) return;
      // Cap around ~30fps for high mobile efficiency
      if (now - lastRender < 1000 / 30) {
        frame = requestAnimationFrame(render);
        return;
      }
      const delta = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      lastRender = now;

      const timeSec = now * 0.001;

      // Gentle breathing idle
      hero.position.y = 0.18 + Math.sin(timeSec * 3.2) * 0.022;

      // Pet idle float/bob
      if (petMesh) {
        petMesh.position.y = 0.28 + Math.sin(timeSec * 3.8) * 0.035;
      }

      // Staff crystal and halo rotation
      if (parts?.crystal instanceof THREE.Object3D) {
        parts.crystal.rotation.y += delta * 2.8;
      }
      if (parts?.crystalHalo instanceof THREE.Object3D) {
        parts.crystalHalo.rotation.z += delta * 2.1;
      }
      if (parts?.scarfTail instanceof THREE.Object3D) {
        parts.scarfTail.rotation.x = -0.22 + Math.sin(timeSec * 4.0) * 0.12;
      }

      // Pedestal rune ring pulse
      runeRing.scale.setScalar(1 + Math.sin(timeSec * 2.5) * 0.04);

      // Orbit ambient motes
      for (const mote of motes) {
        mote.baseAngle += delta * mote.speed;
        mote.mesh.position.x = Math.cos(mote.baseAngle) * mote.radius;
        mote.mesh.position.z = Math.sin(mote.baseAngle) * mote.radius;
        mote.mesh.position.y = mote.height + Math.sin(timeSec * 2 + mote.baseAngle) * 0.12;
        mote.mesh.rotation.y += delta * 1.5;
      }

      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        return;
      }
      last = performance.now();
      lastRender = last;
      frame = requestAnimationFrame(render);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', handleVisibility);
      resizeObserver.disconnect();
      renderer.dispose();
      resources.dispose();
      if (renderer.domElement.parentElement === parent) {
        parent.removeChild(renderer.domElement);
      }
    };
  }, [worldId]);

  return <div className={`hero-preview-host ${className}`} ref={host} />;
}
