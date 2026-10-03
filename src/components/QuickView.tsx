'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useState } from 'react';
import { Check, Heart, ShoppingCart, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmtDate } from '@/lib/utils';
import { Art, Platforms, Price, ReviewSummary } from './GameVisuals';
import { Modal } from './ui';

const QuickViewContext = createContext<(id: string) => void>(() => {});
export const useQuickView = () => useContext(QuickViewContext);

/** หน้าต่าง "ดูด่วน" — ดูข้อมูลเกม เพิ่มลงตะกร้า/รายการที่อยากได้ โดยไม่ต้องออกจากหน้า */
export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const open = useCallback((gameId: string) => setId(gameId), []);
  return (
    <QuickViewContext.Provider value={open}>
      {children}
      <Modal open={!!id} onClose={() => setId(null)}>
        {id && <QuickViewBody id={id} onClose={() => setId(null)} />}
      </Modal>
    </QuickViewContext.Provider>
  );
}

function QuickViewBody({ id, onClose }: { id: string; onClose: () => void }) {
  const store = useStore();
  const router = useRouter();
  const g = store.gameById(id);
  if (!g) return null;
  const { avg, count } = store.avgRating(g.id);
  const owned = store.owned.has(g.id);
  const inCart = store.db.cart.includes(g.id);
  const wished = store.wishlist.includes(g.id);

  return (
    <div className="qv">
      <button className="qv-close" onClick={onClose} aria-label="ปิด"><X size={18} /></button>
      <Art game={g} iconSize={90} />
      <div className="qv-body">
        <div className="qv-meta">
          <span>{g.genre}</span><span>·</span><span>{g.developer}</span><span>·</span><span>{fmtDate(g.release)}</span>
        </div>
        <p>{g.desc}</p>
        <div className="qv-row"><span className="muted small">รีวิวทั้งหมด:</span> <ReviewSummary avg={avg} count={count} /></div>
        <div className="qv-tags">{[g.genre, ...g.tags].map(t => <span key={t}>{t}</span>)}</div>
        <Platforms list={g.platforms} />
        <div className="qv-actions">
          <button className={`btn ghost sm ${wished ? 'is-on' : ''}`} onClick={() => store.toggleWish(g.id)}>
            {wished ? <Check size={14} /> : <Heart size={14} />} {wished ? 'อยู่ในรายการที่อยากได้' : 'อยากได้'}
          </button>
          <Link href={`/game/${g.id}`} className="btn ghost sm" onClick={onClose}>ดูหน้าเกม</Link>
          <div className="purchase-action inline">
            <Price game={g} />
            {owned ? <Link href="/library" className="btn good" onClick={onClose}>อยู่ในคลัง</Link>
              : g.price === 0 ? <button className="btn good" onClick={() => { if (!store.user) { onClose(); router.push(`/login?next=/game/${g.id}`); } else store.claimFree(g.id); }}>รับฟรี</button>
              : inCart ? <Link href="/cart" className="btn good" onClick={onClose}>ไปที่ตะกร้า</Link>
              : <button className="btn good" onClick={() => store.addToCart(g.id)}><ShoppingCart size={14} /> เพิ่มลงในตะกร้า</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
