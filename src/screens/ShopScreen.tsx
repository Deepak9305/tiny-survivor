import { Check, Coins, Gem, Gift, Info, Play } from 'lucide-react';
import { useState } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import type { SaveData } from '../types';

interface ShopScreenProps { save: SaveData; onBack: () => void; onFreeChest: () => Promise<boolean> }

export function ShopScreen({ save, onBack, onFreeChest }: ShopScreenProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const claimed = save.freeChestClaimedDate === localDate();
  const claimChest = async () => {
    if (loading || claimed) return;
    setLoading(true);
    setMessage(undefined);
    const earned = await onFreeChest();
    setMessage(earned ? 'Reward claimed: +120 coins.' : 'Rewarded ad unavailable. Try again later.');
    setLoading(false);
  };
  return <main className="meta-screen shop-screen">
    <ScreenHeader title="SHOP" onBack={onBack} right={<span className="header-currency"><Coins size={14} /> {save.coins.toLocaleString()} <Gem size={14} /> {save.gems}</span>} />
    <section className="shop-honest-hero"><div className="shop-honest-hero__icon"><Gift size={28} /></div><div><span className="eyebrow">DAILY REWARD</span><h1>Earn a free chest.</h1><p>Watch one optional rewarded ad each day for 120 coins.</p></div></section>
    <section className="free-chest-card"><div className="free-chest-card__art"><Gift size={42} /></div><div className="free-chest-card__copy"><span className="eyebrow">FREE CHEST</span><h2>Daily coin cache</h2><p><Coins size={15} /> +120 coins</p></div><PrimaryButton variant="gold" onClick={claimChest} disabled={claimed || loading}><Play size={15} fill="currentColor" /> {claimed ? 'CLAIMED' : loading ? 'LOADING…' : 'WATCH AD'}</PrimaryButton></section>
    {message && <p className="shop-message" role="status">{message}</p>}
    <section className="shop-availability"><div className="shop-availability__icon"><Info size={18} /></div><div><strong>Honest catalog</strong><p>Paid packs and unearned cosmetics are disabled until real purchase and ownership flows are connected.</p></div></section>
    <section className="shop-owned"><span className="eyebrow">OWNED COSMETICS</span><div><span className="shop-owned__badge"><Check size={14} /></span><strong>Classic</strong><small>Equipped hero style</small></div></section>
  </main>;
}

function localDate(): string { const date = new Date(); return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; }
