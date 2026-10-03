'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, ChevronRight, Gamepad2, Heart, Play, Star, ThumbsDown, ThumbsUp, Users, Globe, Trophy, Cloud } from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmtDate, NEWS_CATEGORY, sortNews } from '@/lib/utils';
import { Art, Platforms, Price, ReviewSummary, Stars } from '@/components/GameVisuals';
import { GameSection } from '@/components/GameCard';
import { EmptyState, Ready } from '@/components/ui';
import { useToast } from '@/components/Toast';
import type { Game, GameIcon as IconKey } from '@/lib/types';

const SHOT_ICONS: IconKey[] = ['gamepad', 'swords', 'rocket', 'layers'];

function ReviewForm({ game }: { game: Game }) {
  const store = useStore();
  const toast = useToast();
  const mine = store.db.reviews.find(r => r.gameId === game.id && r.email === store.user?.email);
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [text, setText] = useState(mine?.text ?? '');

  return (
    <div className="review-write">
      <h3>{mine ? 'แก้ไขรีวิวของคุณ' : `เขียนรีวิวสำหรับ ${game.title}`}</h3>
      <p className="small muted">บอกเล่าสิ่งที่คุณชอบหรือไม่ชอบเกี่ยวกับเกมนี้ และคุณจะแนะนำให้ผู้อื่นหรือไม่</p>
      <div className="star-input">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} type="button" className={s <= rating ? 'on' : ''} onClick={() => setRating(s)} aria-label={`${s} ดาว`}>
            <Star size={24} fill="currentColor" />
          </button>
        ))}
      </div>
      <textarea rows={4} value={text} onChange={e => setText(e.target.value)} placeholder="เล่าประสบการณ์ของคุณ..." />
      <div style={{ textAlign: 'right', marginTop: 10 }}>
        <button
          className="btn"
          onClick={() => {
            if (!rating) return toast('กรุณาให้คะแนนดาว', 'error');
            if (text.trim().length < 5) return toast('กรุณาเขียนรีวิวอย่างน้อย 5 ตัวอักษร', 'error');
            store.saveReview(game.id, rating, text.trim());
          }}
        >
          โพสต์รีวิว
        </button>
      </div>
    </div>
  );
}

function GameDetail({ id }: { id: string }) {
  const store = useStore();
  const router = useRouter();
  const g = store.gameById(id);
  const [shot, setShot] = useState(0);
  const { pushRecent } = store;

  useEffect(() => { if (g) pushRecent(g.id); }, [g, pushRecent]);
  useEffect(() => setShot(0), [id]);

  if (!g) return <EmptyState icon={Gamepad2} title="ไม่พบเกมนี้" action={<Link href="/store" className="btn">กลับไปที่ร้านค้า</Link>} />;

  const { user } = store;
  const owned = store.owned.has(g.id);
  const inCart = store.db.cart.includes(g.id);
  const wished = store.wishlist.includes(g.id);
  const rs = store.db.reviews.filter(r => r.gameId === g.id).sort((a, b) => b.date.localeCompare(a.date));
  const { avg, count } = store.avgRating(g.id);
  const recentRs = rs.slice(0, 5);
  const recentAvg = recentRs.length ? recentRs.reduce((s, r) => s + r.rating, 0) / recentRs.length : avg;
  const similar = store.db.games.filter(x => x.id !== g.id && x.genre === g.genre).slice(0, 4);
  const updates = sortNews(store.db.news.filter(n => n.published && n.gameId === g.id)).slice(0, 3);
  // เกมที่มีภาพหน้าจอจริงใช้ภาพนั้น ไม่งั้นใช้ภาพจำลองจากไอคอน
  const realShots = g.shots?.length ?? 0;
  const shots: IconKey[] = realShots ? Array.from({ length: Math.min(realShots, 6) }, () => g.icon) : [g.icon, ...SHOT_ICONS];
  const online = g.tags.some(t => /ออนไลน์|PvP|Co-op|เพื่อน/i.test(t));

  const claim = () => {
    if (!user) return router.push(`/login?next=/game/${g.id}`);
    store.claimFree(g.id);
  };

  return (
    <>
      <div className="app-head">
        <div className="crumbs">
          <Link href="/store">เกมทั้งหมด</Link><ChevronRight size={12} />
          <Link href={`/store?genre=${encodeURIComponent(g.genre)}`}>{g.genre}</Link><ChevronRight size={12} />
          <span>{g.title}</span>
        </div>
        <div className="app-title-row">
          <h1 className="app-title">{g.title}</h1>
          <button className={`btn ghost sm ${wished ? 'is-on' : ''}`} onClick={() => store.toggleWish(g.id)}>
            {wished ? <Check size={14} /> : <Heart size={14} />} {wished ? 'อยู่ในรายการที่อยากได้' : 'เพิ่มในรายการที่อยากได้'}
          </button>
        </div>
      </div>

      <div className="app-top">
        <div className="app-media">
          <Art game={g} icon={shots[shot]} iconSize={150} title={false} shot={shot} media={realShots ? 'shot' : 'header'} hd className="app-main-shot" />
          <div className="app-strip">
            {shots.map((ic, i) => (
              <button key={i} className={i === shot ? 'active' : ''} onClick={() => setShot(i)} aria-label={`ภาพที่ ${i + 1}`}>
                <Art game={g} icon={ic} iconSize={22} title={false} shot={i} media={realShots ? 'shot' : 'header'} />
              </button>
            ))}
          </div>
        </div>
        <div className="app-side">
          <Art game={g} iconSize={60} className="app-capsule" />
          <p className="app-desc">{g.desc}</p>
          <dl className="app-meta">
            <dt>รีวิวล่าสุด:</dt><dd><ReviewSummary avg={recentAvg} count={recentRs.length} /></dd>
            <dt>รีวิวทั้งหมด:</dt><dd><ReviewSummary avg={avg} count={count} /></dd>
            <dt>วันที่วางจำหน่าย:</dt><dd className="plain">{fmtDate(g.release)}</dd>
            <dt>ผู้พัฒนา:</dt><dd><Link href={`/store?q=${encodeURIComponent(g.developer)}`}>{g.developer}</Link></dd>
            <dt>ผู้จัดจำหน่าย:</dt><dd><Link href={`/store?q=${encodeURIComponent(g.publisher ?? g.developer)}`}>{g.publisher ?? g.developer}</Link></dd>
          </dl>
          <div className="app-tags-label small muted">ป้ายกำกับยอดนิยมสำหรับเกมนี้:</div>
          <div className="app-tags">
            {[g.genre, ...g.tags].map(t => <Link key={t} href={`/store?q=${encodeURIComponent(t)}`}>{t}</Link>)}
          </div>
        </div>
      </div>

      <div className="app-cols">
        <div className="app-left">
          {owned && (
            <div className="owned-banner">
              <div><b>{g.title}</b> อยู่ในคลังเกมของคุณแล้ว</div>
              <Link href="/library" className="btn good sm"><Play size={14} /> เล่นเลย</Link>
            </div>
          )}

          {!owned && (
            <div className="purchase">
              <h2>{g.price === 0 ? `เล่น ${g.title}` : `ซื้อ ${g.title}`}</h2>
              <Platforms list={g.platforms} />
              {g.discount > 0 && <p className="purchase-note">ลดราคาพิเศษ! ข้อเสนอนี้มีเวลาจำกัด</p>}
              <div className="purchase-action">
                <Price game={g} />
                {g.price === 0
                  ? <button className="btn good" onClick={claim}>เล่นเกม</button>
                  : inCart
                    ? <Link href="/cart" className="btn good">อยู่ในตะกร้า</Link>
                    : <button className="btn good" onClick={() => store.addToCart(g.id)}>เพิ่มลงในตะกร้า</button>}
              </div>
            </div>
          )}

          {updates.length > 0 && (
            <section className="app-section">
              <h2 className="app-h">อัปเดตและข่าวล่าสุด</h2>
              {updates.map(n => (
                <Link key={n.id} href={`/news/${n.id}`} className="update-row">
                  <span className={`news-cat ${n.category}`}>{NEWS_CATEGORY[n.category]}</span>
                  <span className="update-title">{n.title}</span>
                  <span className="muted small">{fmtDate(n.date)}</span>
                </Link>
              ))}
            </section>
          )}

          <section className="app-section">
            <h2 className="app-h">เกี่ยวกับเกมนี้</h2>
            <p>{g.desc}</p>
            <p className="muted">พัฒนาโดย {g.developer} รองรับ {g.platforms.join(', ')} ประเภท {g.genre} พร้อมฟีเจอร์ {g.tags.join(' และ ')}</p>
          </section>

          <section className="app-section">
            <h2 className="app-h">ความต้องการของระบบ</h2>
            <div className="sysreq">
              <div>
                <h4>ขั้นต่ำ:</h4>
                <ul>
                  <li><b>ระบบปฏิบัติการ:</b> Windows 10 64-bit</li>
                  <li><b>หน่วยประมวลผล:</b> Intel Core i5-6600 / AMD Ryzen 3 1200</li>
                  <li><b>หน่วยความจำ:</b> แรม 8 GB</li>
                  <li><b>กราฟิก:</b> NVIDIA GTX 970 / AMD RX 470</li>
                  <li><b>พื้นที่จัดเก็บ:</b> {30 + g.title.length * 3} GB</li>
                </ul>
              </div>
              <div>
                <h4>แนะนำ:</h4>
                <ul>
                  <li><b>ระบบปฏิบัติการ:</b> Windows 11 64-bit</li>
                  <li><b>หน่วยประมวลผล:</b> Intel Core i5-8400 / AMD Ryzen 5 2600</li>
                  <li><b>หน่วยความจำ:</b> แรม 16 GB</li>
                  <li><b>กราฟิก:</b> NVIDIA GTX 1660 / AMD RX 5500 XT</li>
                  <li><b>พื้นที่จัดเก็บ:</b> {30 + g.title.length * 3} GB (SSD)</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <aside className="app-right">
          <div className="side-block">
            <div className="feature"><Users size={16} /> ผู้เล่นคนเดียว</div>
            {online && <div className="feature"><Globe size={16} /> ผู้เล่นหลายคนออนไลน์</div>}
            <div className="feature"><Trophy size={16} /> ความสำเร็จในเกม</div>
            <div className="feature"><Cloud size={16} /> บันทึกบนคลาวด์</div>
          </div>
          <div className="side-block">
            <div className="side-title">ภาษา:</div>
            <table className="lang">
              <thead><tr><th /><th>อินเทอร์เฟซ</th><th>เสียง</th><th>คำบรรยาย</th></tr></thead>
              <tbody>
                <tr><td>ไทย</td><td><Check size={14} /></td><td /><td><Check size={14} /></td></tr>
                <tr><td>อังกฤษ</td><td><Check size={14} /></td><td><Check size={14} /></td><td><Check size={14} /></td></tr>
                <tr><td>ญี่ปุ่น</td><td><Check size={14} /></td><td><Check size={14} /></td><td><Check size={14} /></td></tr>
              </tbody>
            </table>
          </div>
          <div className="side-block">
            <dl className="app-meta">
              <dt>ประเภท:</dt><dd><Link href={`/store?genre=${encodeURIComponent(g.genre)}`}>{g.genre}</Link></dd>
              <dt>ผู้พัฒนา:</dt><dd className="plain">{g.developer}</dd>
              <dt>วางจำหน่าย:</dt><dd className="plain">{fmtDate(g.release)}</dd>
            </dl>
            <Link href="/news" className="btn ghost sm block">ดูข่าวสารทั้งหมด</Link>
          </div>
        </aside>
      </div>

      <GameSection title="เกมที่คล้ายกัน" more={`/store?genre=${encodeURIComponent(g.genre)}`} games={similar} />

      <section className="section">
        <h2 className="app-h">รีวิวจากผู้เล่นสำหรับ {g.title}</h2>
        <div className="review-overview">
          <div>
            <div className="small muted">รีวิวโดยรวม:</div>
            <ReviewSummary avg={avg} count={count} />
          </div>
          <div>
            <div className="small muted">คะแนนเฉลี่ย:</div>
            <span className="review-score">{avg.toFixed(1)}</span> <Stars value={avg} />
          </div>
        </div>
        {owned
          ? <ReviewForm key={g.id} game={g} />
          : <p className="muted small">{user ? 'ซื้อเกมนี้เพื่อเขียนรีวิว' : 'เข้าสู่ระบบและซื้อเกมนี้เพื่อเขียนรีวิว'}</p>}
        <div className="review-list">
          {rs.length ? rs.map((r, i) => {
            const up = r.rating >= 3;
            return (
              <div key={i} className="review-card">
                <div className="review-author">
                  <div className="avatar">{r.user.slice(0, 1).toUpperCase()}</div>
                  <b>{r.user}</b>
                </div>
                <div className="review-main">
                  <div className={`review-verdict ${up ? 'up' : 'down'}`}>
                    {up ? <ThumbsUp size={28} /> : <ThumbsDown size={28} />}
                    <div>
                      <div className="verdict-title">{up ? 'แนะนำ' : 'ไม่แนะนำ'}</div>
                      <Stars value={r.rating} size={12} />
                    </div>
                  </div>
                  <div className="small muted">โพสต์เมื่อ {fmtDate(r.date)}</div>
                  <p>{r.text}</p>
                </div>
              </div>
            );
          }) : <p className="muted">ยังไม่มีรีวิวสำหรับเกมนี้</p>}
        </div>
      </section>
    </>
  );
}

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  return <Ready><GameDetail id={id} /></Ready>;
}
