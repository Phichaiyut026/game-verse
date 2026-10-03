'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Price, Thumb } from '@/components/GameVisuals';
import { CartSummary } from '@/components/CartSummary';
import { EmptyState, Ready } from '@/components/ui';
import { useToast } from '@/components/Toast';

function Cart() {
  const store = useStore();
  const toast = useToast();
  const c = store.calcCart();
  const [code, setCode] = useState(store.db.couponCode);

  if (!c.items.length) {
    return <EmptyState icon={ShoppingCart} title="ตะกร้าของคุณว่างเปล่า" text="ไปเลือกเกมที่ชอบกันเถอะ" action={<Link href="/store" className="btn">เลือกซื้อเกม</Link>} />;
  }

  const applyCoupon = () => {
    store.setCouponCode(code);
    if (code.trim() && !store.calcCart(code.trim()).couponErr) toast('ใช้โค้ดส่วนลดสำเร็จ');
  };

  return (
    <>
      <h1 className="page-title">ตะกร้าสินค้าของคุณ</h1>
      <div className="cart-layout">
        <div className="panel">
          {c.items.map(g => (
            <div key={g.id} className="cart-item">
              <Link href={`/game/${g.id}`}><Thumb game={g} /></Link>
              <div className="info">
                <Link href={`/game/${g.id}`}><b>{g.title}</b></Link>
                <div className="muted small">{g.genre} · {g.platforms.join(', ')}</div>
                <button
                  className="btn ghost sm" style={{ marginTop: 6 }}
                  onClick={() => { if (!store.wishlist.includes(g.id)) store.toggleWish(g.id); store.removeFromCart(g.id); }}
                >
                  <Heart size={14} /> ย้ายไปรายการที่อยากได้
                </button>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Price game={g} />
                <button className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => { store.removeFromCart(g.id); toast('ลบออกจากตะกร้าแล้ว'); }}>
                  <Trash2 size={14} /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>ยอดรวมโดยประมาณ</h3>
          <form className="field" style={{ display: 'flex', gap: 8, marginTop: 12 }} onSubmit={e => { e.preventDefault(); applyCoupon(); }}>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="โค้ดส่วนลด" aria-label="โค้ดส่วนลด" />
            <button className="btn ghost">ใช้</button>
          </form>
          {c.couponErr && <p className="small" style={{ color: 'var(--bad)', marginTop: -6 }}>{c.couponErr}</p>}
          <p className="muted small">ลองใช้: WELCOME10, SAVE100, GAMER20</p>
          <CartSummary c={c} />
          <Link href="/checkout" className="btn good block" style={{ marginTop: 14 }}>ดำเนินการต่อเพื่อชำระเงิน</Link>
          <Link href="/store" className="btn ghost block" style={{ marginTop: 8 }}>เลือกซื้อต่อ</Link>
        </div>
      </div>
    </>
  );
}

export default function CartPage() {
  return <Ready><Cart /></Ready>;
}
