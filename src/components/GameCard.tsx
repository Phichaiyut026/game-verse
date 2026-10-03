'use client';

import Link from 'next/link';
import { Eye, Heart } from 'lucide-react';
import { useQuickView } from './QuickView';
import type { Game } from '@/lib/types';
import { fmtDate } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { Art, Platforms, Price, ReviewSummary } from './GameVisuals';

function WishButton({ id }: { id: string }) {
  const store = useStore();
  const on = store.wishlist.includes(id);
  return (
    <button
      className={`wish ${on ? 'on' : ''}`}
      aria-label={on ? 'นำออกจากรายการที่อยากได้' : 'เพิ่มในรายการที่อยากได้'}
      onClick={e => { e.preventDefault(); e.stopPropagation(); store.toggleWish(id); }}
    >
      <Heart size={14} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}

/** แคปซูลเกมแบบ Steam: ภาพแนวนอน + ราคาด้านล่าง */
export function GameCard({ game, tall = false, note }: { game: Game; tall?: boolean; note?: string }) {
  const { owned } = useStore();
  const quickView = useQuickView();
  return (
    <Link href={`/game/${game.id}`} className={`capsule ${tall ? 'tall' : ''}`}>
      <Art game={game} iconSize={tall ? 72 : 48} media={tall ? 'portrait' : 'header'} />
      {owned.has(game.id) && <span className="owned-flag">อยู่ในคลัง</span>}
      <WishButton id={game.id} />
      <button
        className="qv-btn" aria-label={`ดูด่วน ${game.title}`}
        onClick={e => { e.preventDefault(); e.stopPropagation(); quickView(game.id); }}
      >
        <Eye size={14} /> ดูด่วน
      </button>
      {note && <span className="capsule-note">{note}</span>}
      <div className="capsule-foot">
        <span className="capsule-name">{game.title}</span>
        <Price game={game} size="sm" />
      </div>
    </Link>
  );
}

/** แถวผลการค้นหาแบบ Steam: ภาพย่อ, ชื่อ+แพลตฟอร์ม, วันวางจำหน่าย, รีวิว, ราคา */
export function GameRow({ game }: { game: Game }) {
  const { avgRating, owned } = useStore();
  const { avg, count } = avgRating(game.id);
  return (
    <Link href={`/game/${game.id}`} className="search-row">
      <Art game={game} iconSize={22} title={false} className="search-art" />
      <div className="search-name">
        <span className="title">{game.title}</span>
        <Platforms list={game.platforms} />
      </div>
      <span className="search-date">{fmtDate(game.release)}</span>
      <span className="search-review"><ReviewSummary avg={avg} count={count} showCount={false} /></span>
      <div className="search-price">
        {owned.has(game.id) ? <span className="owned-flag static">อยู่ในคลัง</span> : <Price game={game} size="sm" />}
      </div>
    </Link>
  );
}

export function SectionHead({ title, more }: { title: string; more?: string }) {
  return (
    <div className="shead">
      <h2>{title}</h2>
      {more && <Link href={more} className="btn ghost sm">ดูเพิ่มเติม</Link>}
    </div>
  );
}

export function GameSection({ title, more, games }: { title: string; more?: string; games: Game[] }) {
  if (!games.length) return null;
  return (
    <section className="section">
      <SectionHead title={title} more={more} />
      <div className="grid">{games.map(g => <GameCard key={g.id} game={g} />)}</div>
    </section>
  );
}
