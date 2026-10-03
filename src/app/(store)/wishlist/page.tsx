'use client';

import Link from 'next/link';
import { HeartOff } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Game } from '@/lib/types';
import { fmtDate } from '@/lib/utils';
import { Art, Platforms, Price, ReviewSummary } from '@/components/GameVisuals';
import { EmptyState, Ready } from '@/components/ui';

function Wishlist() {
  const store = useStore();
  const list = store.wishlist.map(store.gameById).filter((g): g is Game => !!g);
  const name = store.user?.name ?? 'คุณ';

  if (!list.length) {
    return <EmptyState icon={HeartOff} title="ยังไม่มีเกมในรายการที่อยากได้" text="กดปุ่ม &quot;เพิ่มในรายการที่อยากได้&quot; ในหน้าเกมเพื่อบันทึกไว้" action={<Link href="/store" className="btn">เลือกดูเกม</Link>} />;
  }
  return (
    <>
      <div className="page-title-row">
        <h1 className="page-title">รายการที่อยากได้ของ{name} <span className="muted">({list.length})</span></h1>
        <button className="btn ghost sm" onClick={() => store.addManyToCart(list.filter(g => g.price > 0).map(g => g.id))}>เพิ่มทั้งหมดลงในตะกร้า</button>
      </div>
      <div className="wish-list">
        {list.map((g, i) => {
          const { avg, count } = store.avgRating(g.id);
          const owned = store.owned.has(g.id);
          const inCart = store.db.cart.includes(g.id);
          return (
            <div key={g.id} className="wish-row">
              <span className="wish-rank">{i + 1}</span>
              <Link href={`/game/${g.id}`}><Art game={g} iconSize={36} title={false} className="wish-art" /></Link>
              <div className="wish-info">
                <Link href={`/game/${g.id}`} className="title">{g.title}</Link>
                <dl className="app-meta compact">
                  <dt>รีวิวโดยรวม:</dt><dd><ReviewSummary avg={avg} count={count} /></dd>
                  <dt>วางจำหน่าย:</dt><dd className="plain">{fmtDate(g.release)}</dd>
                </dl>
                <div className="wish-tags">{[g.genre, ...g.tags].map(t => <span key={t}>{t}</span>)}</div>
              </div>
              <div className="wish-actions">
                <Platforms list={g.platforms} />
                <div className="purchase-action inline">
                  <Price game={g} />
                  {owned ? <Link href="/library" className="btn ghost sm">อยู่ในคลัง</Link>
                    : g.price === 0 ? <Link href={`/game/${g.id}`} className="btn good sm">เล่นเกม</Link>
                    : inCart ? <Link href="/cart" className="btn good sm">อยู่ในตะกร้า</Link>
                    : <button className="btn good sm" onClick={() => store.addToCart(g.id)}>เพิ่มลงในตะกร้า</button>}
                </div>
                <button className="link small" onClick={() => store.toggleWish(g.id)}>นำออก</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function WishlistPage() {
  return <Ready><Wishlist /></Ready>;
}
