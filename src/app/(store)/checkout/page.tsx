'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Lock, Smartphone, Wallet } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { PayMethod } from '@/lib/types';
import { baht, finalPrice, luhn } from '@/lib/utils';
import { Thumb } from '@/components/GameVisuals';
import { CartSummary } from '@/components/CartSummary';
import { Guard } from '@/components/ui';
import { useToast } from '@/components/Toast';

// รูปแบบ QR จำลองสำหรับพร้อมเพย์ (ไม่ใช่ QR จริง)
function MockQr({ seed }: { seed: number }) {
  const cells = useMemo(() => Array.from({ length: 441 }, (_, i) => {
    const x = i % 21, y = Math.floor(i / 21);
    const finder = (a: number, b: number) => x >= a && x < a + 7 && y >= b && y < b + 7 &&
      (x === a || x === a + 6 || y === b || y === b + 6 || (x > a + 1 && x < a + 5 && y > b + 1 && y < b + 5));
    const inFinderZone = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
    return finder(0, 0) || finder(14, 0) || finder(0, 14) || (!inFinderZone && ((Math.sin(i * 12.9898 + seed) * 43758.5453) % 1 + 1) % 1 > 0.5);
  }), [seed]);
  return <div className="qr">{cells.map((d, i) => <i key={i} className={d ? 'd' : ''} />)}</div>;
}

const METHODS: { id: Exclude<PayMethod, 'free'>; label: string; icon: React.ReactNode }[] = [
  { id: 'card', label: 'บัตรเครดิต/เดบิต', icon: <CreditCard size={24} /> },
  { id: 'promptpay', label: 'พร้อมเพย์', icon: <Smartphone size={24} /> },
  { id: 'wallet', label: 'TrueMoney Wallet', icon: <Wallet size={24} /> }
];

function Checkout() {
  const store = useStore();
  const toast = useToast();
  const router = useRouter();
  const c = store.calcCart();
  const user = store.user!;
  const [method, setMethod] = useState<Exclude<PayMethod, 'free'>>('card');
  const [card, setCard] = useState({ no: '', exp: '', cvv: '', name: '' });
  const [phone, setPhone] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!c.items.length && !busy) router.replace('/cart'); }, [c.items.length, busy, router]);
  if (!c.items.length) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'card') {
      const no = card.no.replace(/\s/g, '');
      const [mm, yy] = card.exp.split('/').map(Number);
      if (!/^\d{16}$/.test(no) || !luhn(no)) return toast('หมายเลขบัตรไม่ถูกต้อง', 'error');
      if (!mm || mm > 12 || !yy || new Date(2000 + yy, mm) < new Date()) return toast('วันหมดอายุไม่ถูกต้อง', 'error');
      if (!/^\d{3,4}$/.test(card.cvv)) return toast('CVV ไม่ถูกต้อง', 'error');
      if (!card.name.trim()) return toast('กรุณากรอกชื่อบนบัตร', 'error');
    }
    if (method === 'wallet' && !/^0\d{9}$/.test(phone)) return toast('เบอร์โทรศัพท์ไม่ถูกต้อง', 'error');
    if (!agree) return toast('กรุณายอมรับเงื่อนไขก่อนชำระเงิน', 'error');

    setBusy(true);
    setTimeout(() => {
      const order = store.placeOrder(method);
      if (order) router.push(`/order/${order.id}`);
      else { setBusy(false); toast('ชำระเงินไม่สำเร็จ', 'error'); }
    }, 1200);
  };

  return (
    <>
      <h1 className="page-title">ชำระเงิน</h1>
      <div className="cart-layout">
        <form className="panel" onSubmit={submit} noValidate>
          <h3>ข้อมูลผู้ซื้อ</h3>
          <div className="row">
            <div className="field"><label>ชื่อ</label><input value={user.name} disabled /></div>
            <div className="field"><label>อีเมล (รับคีย์เกม)</label><input value={user.email} disabled /></div>
          </div>
          <h3>วิธีชำระเงิน</h3>
          <div className="pay-methods">
            {METHODS.map(m => (
              <label key={m.id}>
                <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} />
                {m.icon}{m.label}
              </label>
            ))}
          </div>

          {method === 'card' && (
            <div>
              <p className="muted small">โหมดเดโม: ใช้หมายเลขบัตรทดสอบ 4242 4242 4242 4242 ได้</p>
              <div className="field">
                <label>หมายเลขบัตร</label>
                <input inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.no}
                  onChange={e => setCard({ ...card, no: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() })} />
              </div>
              <div className="row">
                <div className="field">
                  <label>วันหมดอายุ</label>
                  <input placeholder="MM/YY" value={card.exp}
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setCard({ ...card, exp: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v }); }} />
                </div>
                <div className="field">
                  <label>CVV</label>
                  <input inputMode="numeric" placeholder="123" maxLength={4} value={card.cvv} onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} />
                </div>
              </div>
              <div className="field"><label>ชื่อบนบัตร</label><input placeholder="SOMCHAI JAIDEE" value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} /></div>
            </div>
          )}
          {method === 'promptpay' && (
            <div style={{ textAlign: 'center' }}>
              <MockQr seed={c.total} />
              <p>สแกน QR เพื่อชำระ <b>{baht(c.total)}</b></p>
              <p className="muted small">โหมดเดโม: กด &quot;ยืนยันการชำระเงิน&quot; เพื่อจำลองการโอนสำเร็จ</p>
            </div>
          )}
          {method === 'wallet' && (
            <div className="field">
              <label>เบอร์โทรศัพท์ที่ผูกกับ Wallet</label>
              <input inputMode="numeric" placeholder="08xxxxxxxx" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
            </div>
          )}

          <label className="check" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
            ฉันยอมรับเงื่อนไขการซื้อสินค้าดิจิทัล (ไม่สามารถคืนเงินหลังเปิดใช้คีย์)
          </label>
          <button className="btn good block" style={{ marginTop: 16 }} disabled={busy}>
            <Lock size={16} /> {busy ? 'กำลังประมวลผล...' : `ยืนยันการชำระเงิน ${baht(c.total)}`}
          </button>
        </form>

        <div className="panel">
          <h3>รายการสินค้า</h3>
          {c.items.map(g => (
            <div key={g.id} className="cart-item">
              <Thumb game={g} size={48} />
              <div className="info"><b>{g.title}</b></div>
              <span>{baht(finalPrice(g))}</span>
            </div>
          ))}
          <CartSummary c={c} />
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return <Guard><Checkout /></Guard>;
}
