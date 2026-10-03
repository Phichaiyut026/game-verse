'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Game } from '@/lib/types';
import { fmtDate, sortNews } from '@/lib/utils';
import { Art, GENRE_ICONS, Platforms, Price, ReviewSummary } from '@/components/GameVisuals';
import { GameCard, SectionHead } from '@/components/GameCard';
import { NewsCard } from '@/components/NewsCard';
import {
  BackToTop, DailyDeal, DiscoveryQueue, ForYou, Newsletter, PriceTiles, RecentlyViewed, SaleBanner, StoreStats, TagCloud
} from '@/components/HomeWidgets';
import { Ready } from '@/components/ui';

/* ---------- แนะนำและน่าสนใจ (carousel ใหญ่) ---------- */
function Featured({ games }: { games: Game[] }) {
  const { avgRating, owned } = useStore();
  const [idx, setIdx] = useState(0);
  const [hoverShot, setHoverShot] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (games.length < 2 || paused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % games.length), 6000);
    return () => clearInterval(t);
  }, [games.length, paused]);
  useEffect(() => setHoverShot(0), [idx]);

  if (!games.length) return null;
  const g = games[idx % games.length];
  const { avg, count } = avgRating(g.id);
  const go = (d: number) => setIdx(i => (i + d + games.length) % games.length);

  return (
    <section className="section" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <SectionHead title="แนะนำและน่าสนใจ" />
      <div className="carousel">
        <button className="carousel-arrow left" onClick={() => go(-1)} aria-label="ก่อนหน้า"><ChevronLeft size={36} /></button>
        <Link href={`/game/${g.id}`} className="featured">
          <Art game={g} iconSize={150} title={false} media="shot" shot={hoverShot} hd className="featured-art" />
          <div className="featured-info">
            <h3>{g.title}</h3>
            <div className="featured-shots">
              {[1, 2, 3, 4].map(s => (
                <div key={s} onMouseEnter={() => setHoverShot(s)} onMouseLeave={() => setHoverShot(0)}>
                  <Art game={g} iconSize={26} title={false} media="shot" shot={s} />
                </div>
              ))}
            </div>
            <div className="featured-status">{owned.has(g.id) ? 'อยู่ในคลังของคุณแล้ว' : 'วางจำหน่ายแล้ว'}</div>
            <div className="featured-tags">{[g.genre, ...g.tags].slice(0, 4).map(t => <span key={t}>{t}</span>)}</div>
            <div className="featured-review"><ReviewSummary avg={avg} count={count} /></div>
            <div className="featured-bottom">
              <Platforms list={g.platforms} />
              <Price game={g} />
            </div>
          </div>
        </Link>
        <button className="carousel-arrow right" onClick={() => go(1)} aria-label="ถัดไป"><ChevronRight size={36} /></button>
      </div>
      <div className="dots">
        {games.map((x, i) => <button key={x.id} className={i === idx % games.length ? 'active' : ''} onClick={() => setIdx(i)} aria-label={`สไลด์ ${i + 1}`} />)}
      </div>
    </section>
  );
}

/* ---------- แท็บรายการ + พรีวิวด้านขวา ---------- */
function TabbedLists({ tabs }: { tabs: { key: string; label: string; games: Game[]; more: string }[] }) {
  const { avgRating } = useStore();
  const [tab, setTab] = useState(tabs[0].key);
  const current = tabs.find(t => t.key === tab) ?? tabs[0];
  const [hover, setHover] = useState<string | null>(null);
  const preview = current.games.find(g => g.id === hover) ?? current.games[0];

  return (
    <section className="section">
      <div className="home-tabs">
        {tabs.map(t => (
          <button key={t.key} className={t.key === current.key ? 'active' : ''} onClick={() => { setTab(t.key); setHover(null); }}>{t.label}</button>
        ))}
      </div>
      <div className="tab-body">
        <div className="tab-list">
          {current.games.map(g => (
            <Link
              key={g.id} href={`/game/${g.id}`} className={`tab-row ${preview?.id === g.id ? 'focus' : ''}`}
              onMouseEnter={() => setHover(g.id)}
            >
              <Art game={g} iconSize={24} title={false} className="tab-art" />
              <div className="tab-info">
                <span className="title">{g.title}</span>
                <Platforms list={g.platforms} />
                <span className="tab-tags">{[g.genre, ...g.tags].join(', ')}</span>
              </div>
              <Price game={g} size="sm" />
            </Link>
          ))}
          <div className="tab-more">
            ดูเพิ่มเติม: <Link href={current.more}>{current.label}</Link>
          </div>
        </div>
        {preview && (
          <aside className="tab-preview">
            <h3>{preview.title}</h3>
            <div className="tab-preview-review">
              <span>รีวิวโดยรวม:</span>
              <ReviewSummary avg={avgRating(preview.id).avg} count={avgRating(preview.id).count} />
            </div>
            <div className="tab-preview-tags">{[preview.genre, ...preview.tags].map(t => <span key={t}>{t}</span>)}</div>
            {[0, 1, 2, 3].map(s => <Art key={s} game={preview} iconSize={40} title={false} media="shot" shot={s} className="tab-preview-shot" />)}
          </aside>
        )}
      </div>
    </section>
  );
}

function Home() {
  const { db, avgRating } = useStore();
  const all = db.games;

  const lists = useMemo(() => {
    const sold: Record<string, number> = {};
    db.orders.filter(o => o.status === 'paid').forEach(o => o.items.forEach(i => { sold[i.id] = (sold[i.id] ?? 0) + 1; }));
    const popularity = (g: Game) => (sold[g.id] ?? 0) * 10 + avgRating(g.id).count + g.rating;
    return {
      featured: all.filter(g => g.featured),
      specials: all.filter(g => g.discount > 0).sort((a, b) => b.discount - a.discount),
      newest: [...all].sort((a, b) => b.release.localeCompare(a.release)),
      top: [...all].sort((a, b) => popularity(b) - popularity(a)),
      free: all.filter(g => g.price === 0)
    };
  }, [all, db.orders, avgRating]);

  const genres = [...new Set(all.map(g => g.genre))];
  const news = sortNews(db.news.filter(n => n.published)).slice(0, 3);
  const latest = lists.newest[0];

  return (
    <>
      <SaleBanner />
      <Featured games={lists.featured} />

      {lists.specials.length > 0 && (
        <section className="section">
          <SectionHead title="ข้อเสนอพิเศษ" more="/store?sale=1&sort=discount" />
          <div className="specials-grid">
            {lists.specials.slice(0, 2).map(g => <GameCard key={g.id} game={g} tall />)}
            <div className="specials-stack">
              {lists.specials.slice(2, 4).map(g => <GameCard key={g.id} game={g} />)}
            </div>
          </div>
        </section>
      )}

      <section className="section home-duo">
        <DailyDeal />
        <DiscoveryQueue />
      </section>

      <ForYou />
      <RecentlyViewed />

      <TabbedLists
        tabs={[
          { key: 'new', label: 'มาใหม่และกำลังมาแรง', games: lists.newest.slice(0, 8), more: '/store?sort=new' },
          { key: 'top', label: 'ขายดี', games: lists.top.slice(0, 8), more: '/store' },
          { key: 'sale', label: 'ลดราคา', games: lists.specials.slice(0, 8), more: '/store?sale=1' },
          ...(lists.free.length ? [{ key: 'free', label: 'เล่นฟรี', games: lists.free.slice(0, 8), more: '/store?free=1' }] : [])
        ]}
      />

      <PriceTiles />

      <section className="section">
        <SectionHead title="เรียกดูตามหมวดหมู่" />
        <div className="cats">
          {genres.map(gn => {
            const Icon = GENRE_ICONS[gn];
            const sample = all.find(g => g.genre === gn);
            return (
              <Link key={gn} className="cat" href={`/store?genre=${encodeURIComponent(gn)}`}
                style={{ background: `linear-gradient(160deg, ${sample?.colors[0] ?? '#2a475e'}, #0e141b 90%)` }}>
                {Icon && <Icon size={34} strokeWidth={1.25} />}
                <span>{gn}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <TagCloud />

      {news.length > 0 && (
        <section className="section">
          <SectionHead title="ข่าวสารและอัปเดตล่าสุด" more="/news" />
          <div className="news-grid">{news.map(n => <NewsCard key={n.id} post={n} />)}</div>
        </section>
      )}

      {latest && (
        <section className="section">
          <SectionHead title="เพิ่งวางจำหน่าย" more="/store?sort=new" />
          <Link href={`/game/${latest.id}`} className="spotlight">
            <Art game={latest} iconSize={90} title={false} media="shot" hd />
            <div className="spotlight-body">
              <h3>{latest.title}</h3>
              <p>{latest.desc}</p>
              <p className="small muted">วางจำหน่าย {fmtDate(latest.release)} · {latest.developer}</p>
              <Price game={latest} />
            </div>
          </Link>
        </section>
      )}

      <StoreStats />
      <Newsletter />
      <BackToTop />
    </>
  );
}

export default function HomePage() {
  return <Ready><Home /></Ready>;
}
