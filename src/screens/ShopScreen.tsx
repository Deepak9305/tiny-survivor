import { Check, Coins, Gem, Gift, Palette, Shield, Sparkles } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import type { SaveData } from '../types';

interface ShopScreenProps { save: SaveData; onBack: () => void; onFreeChest: () => void }

export function ShopScreen({ save, onBack, onFreeChest }: ShopScreenProps) {
  return <main className="meta-screen"><ScreenHeader title="SHOP" onBack={onBack} right={<span className="header-currency"><Gem size={14} /> {save.gems}</span>} />
    <section className="offer-card"><div className="offer-card__glow" /><span className="eyebrow">SPECIAL OFFER</span><h1>Starter Pack</h1><p>1,200 gems · Exclusive hero trail · 3 rare chests</p><PrimaryButton variant="gold" onClick={() => undefined}><span>$2.99</span> GET PACK</PrimaryButton><small>One-time purchase · No pressure</small></section>
    <div className="shop-tabs"><button className="is-active">COSMETICS</button><button>GEMS</button><button>CHESTS</button></div>
    <section className="shop-grid"><div className="shop-item shop-item--free"><span className="shop-item__art"><Gift size={26} /></span><strong>Free Chest</strong><small>Watch a reward ad</small><button onClick={onFreeChest}><Gift size={13} /> OPEN</button></div><div className="shop-item"><span className="shop-item__art shop-item__art--blue"><Palette size={26} /></span><strong>Arcane Trail</strong><small>Bright blue sparks</small><button disabled><Gem size={13} /> 180</button></div><div className="shop-item"><span className="shop-item__art shop-item__art--gold"><Sparkles size={26} /></span><strong>Royal Frame</strong><small>Stage clear style</small><button disabled><Gem size={13} /> 320</button></div><div className="shop-item"><span className="shop-item__art shop-item__art--red"><Shield size={26} /></span><strong>Bone Guard</strong><small>Hero cosmetic</small><button disabled><Coins size={13} /> 900</button></div></section>
    <div className="shop-note"><Check size={15} /> Cosmetics are optional. The full game is playable without purchases.</div>
  </main>;
}
