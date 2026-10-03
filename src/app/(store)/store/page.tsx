'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchX, SlidersHorizontal } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Game } from '@/lib/types';
import { baht, finalPrice, PLATFORMS } from '@/lib/utils';
import { GameRow } from '@/components/GameCard';
import { EmptyState, Ready } from '@/components/ui';

const SORTS = {
  popular: 'ความเกี่ยวข้อง', new: 'วันวางจำหน่าย', rating: 'รีวิวผู้ใช้', priceAsc: 'ราคาต่ำสุด',
  priceDesc: 'ราคาสูงสุด', discount: 'ส่วนลดมากสุด', name: 'ชื่อ'
} as const;
type SortKey = keyof typeof SORTS;

function Store() {
  const { db, avgRating } = useStore();
  const router = useRouter();
  const p = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const q = (p.get('q') ?? '').trim();
  const selGenres = p.getAll('genre');
  const selPlat = p.getAll('platform');
  const maxPrice = Number(p.get('max')) || 0;
  const sale = p.get('sale') === '1';
  const free = p.get('free') === '1';
  const sort = (p.get('sort') ?? 'popular') as SortKey;
  const genres = [...new Set(db.games.map(g => g.genre))];

  const sorters: Record<SortKey, (a: Game, b: Game) => number> = {
    popular: (a, b) => avgRating(b.id).count - avgRating(a.id).count || b.rating - a.rating,
    new: (a, b) => b.release.localeCompare(a.release),
    rating: (a, b) => avgRating(b.id).avg - avgRating(a.id).avg,
    priceAsc: (a, b) => finalPrice(a) - finalPrice(b),
    priceDesc: (a, b) => finalPrice(b) - finalPrice(a),
    discount: (a, b) => b.discount - a.discount,
    name: (a, b) => a.title.localeCompare(b.title)
  };

  const ql = q.toLowerCase();
  const list = db.games
    .filter(g =>
      (!ql || [g.title, g.genre, g.developer, ...g.tags].join(' ').toLowerCase().includes(ql)) &&
      (!selGenres.length || selGenres.includes(g.genre)) &&
      (!selPlat.length || g.platforms.some(x => selPlat.includes(x))) &&
      (!maxPrice || finalPrice(g) <= maxPrice) &&
      (!sale || g.discount > 0) && (!free || g.price === 0))
    .sort(sorters[sort] ?? sorters.popular);

  // อัปเดต URL เมื่อเปลี่ยนตัวกรอง เพื่อให้แชร์ลิงก์/กดย้อนกลับได้
  const update = (mutate: (np: URLSearchParams) => void) => {
    const np = new URLSearchParams(p.toString());
    mutate(np);
    router.replace('/store' + (np.toString() ? `?${np}` : ''), { scroll: false });
  };
  const toggleMulti = (key: string, value: string) => update(np => {
    const vals = np.getAll(key);
    np.delete(key);
    (vals.includes(value) ? vals.filter(v => v !== value) : [...vals, value]).forEach(v => np.append(key, v));
  });
  const toggleFlag = (key: string) => update(np => (np.get(key) ? np.delete(key) : np.set(key, '1')));

  const [term, setTerm] = useState(q);
  useEffect(() => setTerm(q), [q]);

  return (
    <div className="search-page">
      <div className="search-main">
        <form
          className="search-top"
          onSubmit={e => { e.preventDefault(); update(np => (term.trim() ? np.set('q', term.trim()) : np.delete('q'))); }}
        >
          <input value={term} onChange={e => setTerm(e.target.value)} placeholder="ใส่คำค้นหาหรือแท็ก" aria-label="คำค้นหา" />
          <button className="btn">ค้นหา</button>
          <label className="search-sort">
            <span>เรียงตาม</span>
            <select value={sort} onChange={e => update(np => (e.target.value === 'popular' ? np.delete('sort') : np.set('sort', e.target.value)))}>
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </form>
        <div className="search-count">
          <span>{list.length} ผลลัพธ์ที่ตรงกับคำค้นหาของคุณ{q && <> สำหรับ &quot;{q}&quot;</>}</span>
          <button className="btn ghost sm filter-toggle" onClick={() => setShowFilters(s => !s)}><SlidersHorizontal size={14} /> ตัวกรอง</button>
        </div>
        {list.length
          ? <div className="search-results">{list.map(g => <GameRow key={g.id} game={g} />)}</div>
          : <EmptyState icon={SearchX} title="ไม่พบเกมที่ตรงกับเงื่อนไข" text="ลองเปลี่ยนคำค้นหรือตัวกรอง" />}
      </div>

      <aside className={`search-side ${showFilters ? 'open' : ''}`}>
        <div className="filter-block">
          <div className="filter-head">กรองตามราคา</div>
          <div className="filter-body">
            <select value={maxPrice} onChange={e => update(np => (+e.target.value ? np.set('max', e.target.value) : np.delete('max')))}>
              {[0, 300, 500, 1000, 1500].map(v => <option key={v} value={v}>{v ? `ไม่เกิน ${baht(v)}` : 'ทุกราคา'}</option>)}
            </select>
            <label className="check"><input type="checkbox" checked={sale} onChange={() => toggleFlag('sale')} /> แสดงเฉพาะข้อเสนอพิเศษ</label>
            <label className="check"><input type="checkbox" checked={free} onChange={() => toggleFlag('free')} /> แสดงเฉพาะเกมเล่นฟรี</label>
          </div>
        </div>
        <div className="filter-block">
          <div className="filter-head">กรองตามประเภท</div>
          <div className="filter-body">
            {genres.map(gn => (
              <label key={gn} className="check"><input type="checkbox" checked={selGenres.includes(gn)} onChange={() => toggleMulti('genre', gn)} /> {gn}</label>
            ))}
          </div>
        </div>
        <div className="filter-block">
          <div className="filter-head">กรองตามแพลตฟอร์ม</div>
          <div className="filter-body">
            {PLATFORMS.map(pl => (
              <label key={pl} className="check"><input type="checkbox" checked={selPlat.includes(pl)} onChange={() => toggleMulti('platform', pl)} /> {pl}</label>
            ))}
          </div>
        </div>
        <button className="btn ghost sm block" onClick={() => { setTerm(''); router.replace('/store'); }}>ล้างตัวกรองทั้งหมด</button>
      </aside>
    </div>
  );
}

export default function StorePage() {
  return (
    <Suspense fallback={<div className="loading">กำลังโหลด...</div>}>
      <Ready><Store /></Ready>
    </Suspense>
  );
}
