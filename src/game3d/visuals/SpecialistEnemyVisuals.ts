import * as THREE from 'three';
import type { EnemyKind } from '../../types';
import { SharedResources } from '../core/SharedResources';
import {
  buildStylizedBoneMage,
  buildStylizedDemon,
  buildStylizedForestGuardian,
  buildStylizedForestMage,
  buildStylizedIceMage,
  buildStylizedZombie,
} from './StylizedMonsters';

const SPECIALISTS = new Set<EnemyKind>([
  'zombie',
  'bone-mage',
  'forest-mage',
  'forest-guardian',
  'ice-mage',
  'demon-warrior',
]);

export function isSpecialistEnemy(kind: EnemyKind): boolean {
  return SPECIALISTS.has(kind);
}

export function createSpecialistEnemyModel(kind: EnemyKind, resources: SharedResources): THREE.Group {
  if (kind === 'zombie') return buildStylizedZombie(resources);
  if (kind === 'bone-mage') return buildStylizedBoneMage(resources);
  if (kind === 'demon-warrior') return buildStylizedDemon(resources, true);
  if (kind === 'forest-mage') return buildStylizedForestMage(resources);
  if (kind === 'forest-guardian') return buildStylizedForestGuardian(resources);
  if (kind === 'ice-mage') return buildStylizedIceMage(resources);
  return buildStylizedZombie(resources);
}
