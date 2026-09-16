import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ENEMY_BALANCE } from '../data/balance';
import { biomeThemeForWorld } from '../game3d/scene/BiomeTheme';
import { SharedResources } from '../game3d/core/SharedResources';
import { createBossModel, createEnemyModel } from '../game3d/visuals/CharacterFactory';
import { addPreviewStage, disposePreviewScene, fitPreviewCamera } from '../game3d/visuals/PreviewStage';
import type { BossId, EnemyKind } from '../types';

interface CreaturePreview3DProps {
  kind?: EnemyKind;
  bossId?: BossId;
  worldId: number;
  discovered: boolean;
  className?: string;
}

export function CreaturePreview3D({ kind, bossId, worldId, discovered, className = '' }: CreaturePreview3DProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = host.current;
    if (!parent || (!kind && !bossId)) return undefined;

    const theme = biomeThemeForWorld(worldId);
    const resources = new SharedResources();
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(theme.fog, 7, 18);

    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 40);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.3));
    renderer.domElement.className = 'creature-preview-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    parent.appendChild(renderer.domElement);

    const stageRig = addPreviewStage(scene, resources, theme, { radius: bossId ? 2.35 : 2.05, worldId });

    let model: THREE.Group;
    let aura: THREE.Mesh | undefined;
    let bossShadow: THREE.Mesh | undefined;
    if (bossId) {
      const visual = createBossModel(bossId, resources);
      model = visual.root;
      aura = visual.aura;
      bossShadow = visual.shadow;
    } else {
      model = createEnemyModel(kind ?? 'skeleton', ENEMY_BALANCE[kind ?? 'skeleton'].color, resources, worldId);
    }

    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const height = Math.max(0.1, bounds.max.y - bounds.min.y);
    const targetHeight = bossId ? 2.9 : 2.0;
    const scale = targetHeight / height;
    model.scale.multiplyScalar(scale);
    model.position.x -= center.x * scale;
    model.position.z -= center.z * scale;
    model.position.y += (0.24 - bounds.min.y) * scale;

    if (!discovered) applySilhouette(model);
    scene.add(model);

    // Boss factories already provide these effects; normal enemies now get the same grounding language.
    let enemyShadow: THREE.Mesh | undefined;
    if (bossId) {
      if (aura) {
        aura.visible = discovered;
        aura.position.y = 0.18;
        scene.add(aura);
      }
      if (bossShadow) {
        bossShadow.visible = discovered;
        bossShadow.position.y = 0.18;
        scene.add(bossShadow);
      }
    } else if (discovered) {
      enemyShadow = resources.createContactShadow(`codex-${kind ?? 'enemy'}-shadow`, 1, 1, 0.5);
      enemyShadow.scale.set(1.0, 0.62, 1);
      enemyShadow.position.y = 0.18;
      scene.add(enemyShadow);
    }

    let disposed = false;
    let frame = 0;
    let last = performance.now();
    let lastRender = last;
    const baseModelY = model.position.y;

    const resize = () => {
      const width = Math.max(1, parent.clientWidth || 240);
      const heightPx = Math.max(1, parent.clientHeight || 220);
      renderer.setSize(width, heightPx, false);
      fitPreviewCamera(camera, width, heightPx, {
        targetY: bossId ? 1.38 : 1.05,
        distance: bossId ? 6.35 : 5.45,
        verticalBias: bossId ? 0.72 : 0.6,
      });
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
      const time = now * 0.001;

      model.rotation.y += delta * (bossId ? 0.26 : 0.34);
      model.position.y = baseModelY + Math.sin(time * 1.8) * (bossId ? 0.016 : 0.024);

      const parts = model.userData.parts as Record<string, THREE.Object3D | THREE.Object3D[]> | undefined;
      if (parts?.core instanceof THREE.Object3D) parts.core.rotation.y += delta * 2.1;
      if (parts?.wings instanceof Array) {
        for (let index = 0; index < parts.wings.length; index += 1) {
          parts.wings[index].rotation.z += Math.sin(now * 0.004 + index) * delta * 0.5;
        }
      }

      stageRig.runeRing.scale.setScalar(1 + Math.sin(time * 2.1) * 0.025);
      stageRig.accentLight.intensity = 1.32 + Math.sin(time * 1.55) * 0.1;
      stageRig.warmLight.intensity = 0.58 + Math.sin(time * 1.1 + 1.1) * 0.05;

      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };

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
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', handleVisibility);
      resizeObserver.disconnect();
      disposePreviewScene(scene);
      resources.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [bossId, discovered, kind, worldId]);

  return <div ref={host} className={`creature-preview-3d ${className}`} />;
}

function applySilhouette(root: THREE.Group): void {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.color.set(0x02060c);
        material.emissive.set(0x010207);
        material.emissiveIntensity = 0;
        material.opacity = 0.92;
      } else if (material instanceof THREE.MeshBasicMaterial) {
        material.color.set(0x02060c);
        material.opacity = 0.92;
      }
    }
  });
}
