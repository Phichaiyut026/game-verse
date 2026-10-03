'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUp, BadgePercent, Check, ChevronRight, Clock, Compass, EyeOff, Gamepad2, Heart, KeyRound, Mail, MessageSquare,
  RotateCcw, ShoppingCart, Users
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Game } from '@/lib/types';
import { recommend } from '@/lib/recommend';
import { baht, finalPrice } from '@/lib/utils';
import { Art, Price, ReviewSummary } from './GameVisuals';
import { GameCard, SectionHead } from './GameCard';

/* ---------------- นาฬิกา / นับถอยหลัง ---------------- */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function splitTime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const pad = (n: number) => String(n).padStart(2, '0');

function Countdown({ to, compact = false }: { to: Date; compact?: boolean }) {
  const now = useNow();
  if (now === null) return <span className="countdown">--:--:--</span>;
  const t = splitTime(to.getTime() - now);
  if (compact) return <span className="countdown">{t.d > 0 && `${t.d} วัน `}{pad(t.h)}:{pad(t.m)}:{pad(t.s)}</span>;
  return (
    <div className="countdown-blocks" aria-label={`เหลือเวลา ${t.d} วัน ${t.h} ชั่วโมง ${t.m} นาที`}>
      {[[t.d, 'วัน'], [t.h, 'ชม.'], [t.m, 'นาที'], [t.s, 'วิ']].map(([v, l]) => (
        <div key={l}><b>{pad(v as number)}</b><span>{l}</span></div>
      ))}
    </div>
  );
}

/* ---------------- แบนเนอร์เทศกาลลดราคา ---------------- */
export function SaleBanner() {
  const { db } = useStore();
  const sale = db.games.filter(g => g.discount > 0).sort((a, b) => b.discount - a.discount);
  const [end, month] = useMemo(() => {
    const n = new Date();
    return [new Date(n.getFullYear(), n.getMonth() + 1, 0, 23, 59, 59), n.toLocaleDateString('th-TH', { month: 'long' })];
  }, []);
  if (!sale.length) return null;
  const top = sale.slice(0, 3);

  return (
    <section className="sale-banner">
      <div className="sale-banner-text">
        <span className="sale-kicker"><BadgePercent size={16} /> เทศกาลลดราคา</span>
        <h2>ลดราคาประจำเดือน{month}</h2>
        <p>เกม {sale.length} รายการลดราคาสูงสุด <b>{sale[0].discount}%</b> พร้อมคูปองส่วนลดเพิ่มเติม</p>
        <div className="sale-ends"><Clock size={14} /> สิ้นสุดใน</div>
        <Countdown to={end} />
        <Link href="/store?sale=1&sort=discount" className="btn good">ดูข้อเสนอทั้งหมด <ChevronRight size={16} /></Link>
      </div>
      <div className="sale-banner-games">
        {top.map((g, i) => (
          <Link key={g.id} href={`/game/${g.id}`} className={`sale-tile t${i}`}>
            <Art game={g} iconSize={i === 0 ? 70 : 44} media={i === 0 ? 'portrait' : 'header'} />
            <div className="sale-tile-price"><Price game={g} size="sm" /></div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- ข้อเสนอประจำวัน ---------------- */
export function DailyDeal() {
  const store = useStore();
  const now = useNow(60000);
  const candidates = store.db.games.filter(g => g.discount > 0).sort((a, b) => a.id.localeCompare(b.id));
  if (!candidates.length || now === null) return <div className="widget daily" />;
  const dayIndex = Math.floor((now - new Date(now).getTimezoneOffset() * 60000) / 86400000);
  const g = candidates[dayIndex % candidates.length];
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  const owned = store.owned.has(g.id);
  const inCart = store.db.cart.includes(g.id);
  const { avg, count } = store.avgRating(g.id);

  return (
    <div className="widget daily">
      <div className="widget-head">
        <h3>ข้อเสนอประจำวัน</h3>
        <span className="small muted with-icon"><Clock size={13} /> เหลือ <Countdown to={midnight} compact /></span>
      </div>
      <Link href={`/game/${g.id}`}><Art game={g} iconSize={64} /></Link>
      <div className="daily-body">
        <ReviewSummary avg={avg} count={count} />
        <p className="small muted">ประหยัด {baht(g.price - finalPrice(g))} เมื่อซื้อวันนี้</p>
        <div className="purchase-action inline">
          <Price game={g} />
          {owned ? <Link href="/library" className="btn good">อยู่ในคลัง</Link>
            : inCart ? <Link href="/cart" className="btn good">ไปที่ตะกร้า</Link>
            : <button className="btn good" onClick={() => store.addToCart(g.id)}><ShoppingCart size={14} /> ใส่ตะกร้า</button>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- คิวสำรวจ (Discovery Queue) ---------------- */
export function DiscoveryQueue() {
  const store = useStore();
  const { db, owned, wishlist, avgRating } = store;
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  // สร้างคิวครั้งเดียวต่อรอบ เพื่อไม่ให้ลำดับเปลี่ยนระหว่างกดอยากได้/ไม่สนใจ
  const queue = useMemo(() => {
    const recs = recommend({ games: db.games, owned, wishlist, recent: db.recent, ignored: db.ignored, avg: id => avgRating(id).avg });
    const pool = recs.filter(r => !wishlist.includes(r.game.id));
    const offset = pool.length ? (round * 5) % pool.length : 0;
    return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, 8);
  }, [round]);

  const done = index >= queue.length;
  const cur = queue[index];
  const next = () => setIndex(i => i + 1);

  return (
    <div className="widget queue">
      <div className="widget-head">
        <h3 className="with-icon"><Compass size={18} /> คิวสำรวจของคุณ</h3>
        {!done && <span className="small muted">{index + 1} / {queue.length}</span>}
      </div>
      {!queue.length || done ? (
        <div className="queue-done">
          <Check size={36} />
          <p>{queue.length ? 'คุณสำรวจคิวนี้ครบแล้ว' : 'ไม่มีเกมใหม่ให้สำรวจ'}</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={() => { setRound(r => r + 1); setIndex(0); }}><RotateCcw size={14} /> เริ่มคิวใหม่</button>
            {db.ignored.length > 0 && <button className="btn ghost" onClick={() => { store.clearIgnored(); setRound(r => r + 1); setIndex(0); }}>ล้างเกมที่ไม่สนใจ ({db.ignored.length})</button>}
          </div>
        </div>
      ) : (
        <>
          <div className="queue-progress"><i style={{ width: `${(index / queue.length) * 100}%` }} /></div>
          <Link href={`/game/${cur.game.id}`} className="queue-art"><Art game={cur.game} iconSize={64} /></Link>
          <div className="queue-body">
            <p className="queue-reason">{cur.reason}</p>
            <div className="queue-row">
              <ReviewSummary avg={avgRating(cur.game.id).avg} count={avgRating(cur.game.id).count} />
              <Price game={cur.game} size="sm" />
            </div>
            <div className="queue-actions">
              <button className="btn ghost sm" onClick={() => { if (!wishlist.includes(cur.game.id)) store.toggleWish(cur.game.id); next(); }}><Heart size={14} /> อยากได้</button>
              <button className="btn ghost sm" onClick={() => { store.ignoreGame(cur.game.id); next(); }}><EyeOff size={14} /> ไม่สนใจ</button>
              <button className="btn sm" onClick={next}>ถัดไป <ChevronRight size={14} /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- แนะนำสำหรับคุณ ---------------- */
export function ForYou() {
  const { db, owned, wishlist, avgRating, user } = useStore();
  const recs = recommend({ games: db.games, owned, wishlist, recent: db.recent, ignored: db.ignored, avg: id => avgRating(id).avg }).slice(0, 4);
  const personal = owned.size + wishlist.length + db.recent.length > 0;
  if (!recs.length) return null;
  return (
    <section className="section">
      <SectionHead title={personal ? `แนะนำสำหรับ${user ? user.name : 'คุณ'}` : 'แนะนำสำหรับคุณ'} />
      {!personal && <p className="small muted" style={{ marginTop: -6 }}>ดูเกม ซื้อเกม หรือเพิ่มในรายการที่อยากได้ แล้วเราจะแนะนำเกมที่ตรงใจคุณมากขึ้น</p>}
      <div className="grid">{recs.map(r => <GameCard key={r.game.id} game={r.game} note={r.reason} />)}</div>
    </section>
  );
}

/* ---------------- ดูล่าสุด ---------------- */
export function RecentlyViewed() {
  const store = useStore();
  const recent = store.db.recent.map(store.gameById).filter((g): g is Game => !!g).slice(0, 4);
  if (!recent.length) return null;
  return (
    <section className="section">
      <div className="shead">
        <h2>ดูล่าสุด</h2>
        <button className="btn ghost sm" onClick={store.clearRecent}>ล้างประวัติ</button>
      </div>
      <div className="grid">{recent.map(g => <GameCard key={g.id} game={g} />)}</div>
    </section>
  );
}

/* ---------------- เลือกตามงบประมาณ ---------------- */
export function PriceTiles() {
  const { db } = useStore();
  const tiles = [
    { label: 'เล่นฟรี', href: '/store?free=1', count: db.games.filter(g => g.price === 0).length },
    { label: 'ต่ำกว่า ฿300', href: '/store?max=300', count: db.games.filter(g => finalPrice(g) <= 300).length },
    { label: 'ต่ำกว่า ฿500', href: '/store?max=500', count: db.games.filter(g => finalPrice(g) <= 500).length },
    { label: 'ต่ำกว่า ฿1,000', href: '/store?max=1000', count: db.games.filter(g => finalPrice(g) <= 1000).length }
  ];
  return (
    <section className="section">
      <SectionHead title="เลือกตามงบประมาณ" />
      <div className="price-tiles">
        {tiles.map(t => (
          <Link key={t.href} href={t.href} className="price-tile">
            <b>{t.label}</b>
            <span>{t.count} เกม</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- ป้ายกำกับยอดนิยม ---------------- */
export function TagCloud() {
  const { db } = useStore();
  const counts = new Map<string, number>();
  db.games.forEach(g => [g.genre, ...g.tags].forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1)));
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24);
  const max = Math.max(...tags.map(t => t[1]), 1);
  return (
    <section className="section">
      <SectionHead title="ป้ายกำกับยอดนิยม" />
      <div className="tag-cloud">
        {tags.sort((a, b) => a[0].localeCompare(b[0], 'th')).map(([t, n]) => (
          <Link key={t} href={`/store?q=${encodeURIComponent(t)}`} className={`lvl${Math.ceil((n / max) * 3)}`}>
            {t} <small>{n}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- สถิติร้าน (จากข้อมูลจริงในระบบ) ---------------- */
export function StoreStats() {
  const { db } = useStore();
  const keys = db.orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.items.length, 0);
  const stats = [
    { icon: Gamepad2, value: db.games.length, label: 'เกมในร้าน' },
    { icon: Users, value: db.users.length, label: 'สมาชิก' },
    { icon: KeyRound, value: keys, label: 'คีย์เกมที่ส่งมอบแล้ว' },
    { icon: MessageSquare, value: db.reviews.length, label: 'รีวิวจากผู้เล่น' }
  ];
  return (
    <section className="store-stats">
      {stats.map(s => (
        <div key={s.label}>
          <s.icon size={22} strokeWidth={1.5} />
          <b>{s.value.toLocaleString('th-TH')}</b>
          <span>{s.label}</span>
        </div>
      ))}
    </section>
  );
}

/* ---------------- สมัครรับข่าวสาร ---------------- */
export function Newsletter() {
  const store = useStore();
  const [email, setEmail] = useState(store.user?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  return (
    <section className="newsletter">
      <div>
        <h3 className="with-icon"><Mail size={20} /> ไม่พลาดทุกดีลและเกมใหม่</h3>
        <p className="muted">รับแจ้งเตือนโปรโมชั่น เกมลดราคา และข่าวอัปเดตก่อนใครทางอีเมล</p>
      </div>
      {done ? <p className="newsletter-done"><Check size={16} /> สมัครเรียบร้อย ขอบคุณที่ติดตาม</p> : (
        <form onSubmit={e => { e.preventDefault(); const err = store.subscribe(email); setError(err); if (!err) setDone(true); }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="อีเมลของคุณ" aria-label="อีเมล" />
          <button className="btn">สมัครรับข่าวสาร</button>
          {error && <span className="newsletter-err">{error}</span>}
        </form>
      )}
    </section>
  );
}

/* ---------------- ปุ่มกลับขึ้นด้านบน ---------------- */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 800);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (!show) return null;
  return (
    <button className="back-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="กลับขึ้นด้านบน">
      <ArrowUp size={20} />
    </button>
  );
}
