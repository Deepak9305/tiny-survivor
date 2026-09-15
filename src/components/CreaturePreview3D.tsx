import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ENEMY_BALANCE } from '../data/balance';
import { biomeThemeForWorld } from '../game3d/scene/BiomeTheme';
import { SharedResources, addMesh } from '../game3d/core/SharedResources';
import { createBossModel, createEnemyModel } from '../game3d/visuals/CharacterFactory';
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
    scene.fog = new THREE.Fog(theme.fog, 8, 19);
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 40);
    camera.position.set(0, 2.25, 7.4);
    camera.lookAt(0, 1.25, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.domElement.className = 'creature-preview-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    parent.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(theme.keyLight, theme.fillLight, 1.45));
    const keyLight = new THREE.DirectionalLight(theme.keyLight, 2.4);
    keyLight.position.set(-3.5, 7, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(theme.accent, 1.2, 8, 2);
    rimLight.position.set(3, 2.5, -2.5);
    scene.add(rimLight);
    const frontFill = new THREE.PointLight(0xffffff, 0.6, 6, 2);
    frontFill.position.set(0, 1.5, 3.5);
    scene.add(frontFill);

    const pedestal = addMesh(scene, resources.cylinder('preview-pedestal'), resources.standardMaterial('preview-pedestal', theme.groundDeep, { roughness: 0.82, metalness: 0.25 }));
    pedestal.scale.set(2.4, 0.16, 1.6);
    pedestal.position.y = 0.08;
    const pedestalRing = addMesh(scene, resources.ring('preview-pedestal-ring', 1.15, 1.28), resources.basicMaterial('preview-pedestal-ring', theme.accent, { transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
    pedestalRing.rotation.x = -Math.PI / 2;
    pedestalRing.position.y = 0.18;

    let model: THREE.Group;
    let aura: THREE.Mesh | undefined;
    let shadow: THREE.Mesh | undefined;
    if (bossId) {
      const visual = createBossModel(bossId, resources);
      model = visual.root;
      aura = visual.aura;
      shadow = visual.shadow;
    } else {
      model = createEnemyModel(kind ?? 'skeleton', ENEMY_BALANCE[kind ?? 'skeleton'].color, resources, worldId);
    }
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const height = Math.max(0.1, bounds.max.y - bounds.min.y);
    const targetHeight = bossId ? 2.8 : 1.9;
    model.scale.multiplyScalar(targetHeight / height);
    model.position.x -= center.x * model.scale.x;
    model.position.z -= center.z * model.scale.z;
    model.position.y += (0.25 - bounds.min.y) * model.scale.y;
    if (!discovered) applySilhouette(model);
    scene.add(model);
    if (aura) aura.visible = discovered;
    if (shadow) shadow.visible = discovered;

    let disposed = false;
    let frame = 0;
    let last = performance.now();
    let lastRender = last;
    const baseModelY = model.position.y;
    const resize = () => {
      const width = Math.max(1, parent.clientWidth || 240);
      const height = Math.max(1, parent.clientHeight || 220);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
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
      model.rotation.y += delta * 0.38;
      model.position.y = baseModelY + Math.sin(now * 0.0018) * (bossId ? 0.018 : 0.028);
      const parts = model.userData.parts as Record<string, THREE.Object3D | THREE.Object3D[]> | undefined;
      if (parts?.core instanceof THREE.Object3D) parts.core.rotation.y += delta * 2.1;
      if (parts?.wings instanceof Array) for (let index = 0; index < parts.wings.length; index += 1) parts.wings[index].rotation.z += Math.sin(now * 0.004 + index) * delta * 0.5;
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
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite)) return;
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) { material.map?.dispose(); material.dispose(); }
      });
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
