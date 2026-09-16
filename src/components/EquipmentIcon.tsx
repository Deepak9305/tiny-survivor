import type { CSSProperties } from 'react';
import {
  Coins,
  Flame,
  Gem,
  Heart,
  Magnet,
  PawPrint,
  Shield,
  Snowflake,
  Sparkles,
  Swords,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { getEquipmentDefinition } from '../data/equipment';
import type { EquipmentId, EquipmentSlot } from '../types';

const ITEM_ICONS: Partial<Record<EquipmentId, LucideIcon>> = {
  'bone-guard': Shield,
  'hunter-coat': Swords,
  'frost-plate': Snowflake,
  'arcane-crystal': Gem,
  'berserker-fang': Swords,
  'frost-rune': Snowflake,
  'demon-seal': Flame,
  'lucky-coin': Coins,
  'magnet-charm': Magnet,
  'healing-totem': Heart,
  'bat-familiar': Zap,
  'spirit-fox': Sparkles,
  'tiny-golem': Shield,
  fairy: Sparkles,
};

const SLOT_ICONS: Record<EquipmentSlot, LucideIcon> = {
  armor: Shield,
  relic: Gem,
  pet: PawPrint,
  charm: Sparkles,
};

interface EquipmentIconProps {
  id?: EquipmentId | string;
  slot?: EquipmentSlot;
  size?: number;
  className?: string;
}

export function EquipmentIcon({ id, slot, size = 24, className = '' }: EquipmentIconProps) {
  const def = getEquipmentDefinition(id);
  const resolvedSlot = def?.slot ?? slot ?? 'relic';
  const Icon = (def?.id && ITEM_ICONS[def.id]) || SLOT_ICONS[resolvedSlot];
  const accent = def?.accentColor ?? 0x7dd3fc;
  const accentHex = `#${accent.toString(16).padStart(6, '0')}`;

  return (
    <span
      className={`equipment-icon equipment-icon--${resolvedSlot} ${className}`.trim()}
      style={{ '--equipment-accent': accentHex } as CSSProperties}
      aria-hidden="true"
    >
      <span className="equipment-icon__halo" />
      <Icon size={size} strokeWidth={1.8} className="equipment-icon__glyph" />
      <span className="equipment-icon__spark" />
    </span>
  );
}
