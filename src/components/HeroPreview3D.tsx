import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SharedResources, addMesh } from '../game3d/core/SharedResources';
import { createHeroVisual, createPetModel, createRelicAccent } from '../game3d/visuals/CharacterFactory';
import { biomeThemeForWorld } from '../game3d/scene/BiomeTheme';
import { addPreviewStage, disposePreviewScene, fitPreviewCamera } from '../game3d/visuals/PreviewStage';
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
    scene.fog = new THREE.Fog(theme.fog, 6, 16);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.3));
    renderer.domElement.className = 'hero-preview-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    parent.appendChild(renderer.domElement);

    const stageRig = addPreviewStage(scene, resources, theme, { radius: 1.95, worldId });

    // Hero Model — keep aura + contact shadow attached to the preview model.
    // Earlier previews only added the root, which made the same hero look flatter here than in gameplay.
    const heroVisual = createHeroVisual(heroId, resources);
    const hero = heroVisual.root;
    hero.scale.setScalar(1.4);
    hero.position.set(0, 0.18, 0);
    hero.add(heroVisual.aura, heroVisual.shadow);
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
      petMesh.position.set(-0.78, 0.28, 0.34);
      scene.add(petMesh);
    }

    // Ambient floating magic motes. Kept intentionally low-count for mobile previews.
    const moteCount = 10;
    const motes: { mesh: THREE.Mesh; baseAngle: number; speed: number; height: number; radius: number }[] = [];
    for (let i = 0; i < moteCount; i += 1) {
      const mote = addMesh(
        scene,
        resources.octa(`hero-preview-mote-${i}`),
        resources.basicMaterial(`hero-preview-mote-mat-${i}`, theme.accent, { transparent: true, opacity: 0.58 }),
      );
      const baseAngle = (i / moteCount) * Math.PI * 2;
      const radius = 0.9 + Math.random() * 0.55;
      const height = 0.35 + Math.random() * 1.25;
      mote.scale.setScalar(0.035 + Math.random() * 0.03);
      mote.position.set(Math.cos(baseAngle) * radius, height, Math.sin(baseAngle) * radius);
      motes.push({ mesh: mote, baseAngle, speed: 0.32 + Math.random() * 0.38, height, radius });
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
      fitPreviewCamera(camera, width, height, { targetY: 1.03, distance: 5.05, verticalBias: 0.58 });
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);
    resize();

    const render = (now: number) => {
      if (disposed) return;
      if (now - lastRender < 1000 / 30) {
        frame = requestAnimationFrame(render);
        return;
      }

      const delta = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      lastRender = now;
      const timeSec = now * 0.001;

      hero.position.y = 0.18 + Math.sin(timeSec * 3.0) * 0.018;
      hero.rotation.y = Math.sin(timeSec * 0.55) * 0.11;

      if (petMesh) {
        petMesh.position.y = 0.28 + Math.sin(timeSec * 3.6) * 0.035;
        petMesh.rotation.y = Math.sin(timeSec * 0.8) * 0.12;
      }

      if (parts?.crystal instanceof THREE.Object3D) parts.crystal.rotation.y += delta * 2.8;
      if (parts?.crystalHalo instanceof THREE.Object3D) parts.crystalHalo.rotation.z += delta * 2.1;
      if (parts?.scarfTail instanceof THREE.Object3D) {
        parts.scarfTail.rotation.x = -0.22 + Math.sin(timeSec * 4.0) * 0.12;
      }

      stageRig.runeRing.scale.setScalar(1 + Math.sin(timeSec * 2.35) * 0.035);
      stageRig.accentLight.intensity = 1.35 + Math.sin(timeSec * 1.7) * 0.12;
      stageRig.warmLight.intensity = 0.62 + Math.sin(timeSec * 1.2 + 1.5) * 0.06;

      for (const mote of motes) {
        mote.baseAngle += delta * mote.speed;
        mote.mesh.position.x = Math.cos(mote.baseAngle) * mote.radius;
        mote.mesh.position.z = Math.sin(mote.baseAngle) * mote.radius;
        mote.mesh.position.y = mote.height + Math.sin(timeSec * 2 + mote.baseAngle) * 0.1;
        mote.mesh.rotation.y += delta * 1.3;
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
      disposePreviewScene(scene);
      resources.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === parent) parent.removeChild(renderer.domElement);
    };
  }, [heroId, equippedPet, equippedRelic, worldId]);

  return <div className={`hero-preview-host ${className}`} ref={host} />;
}
