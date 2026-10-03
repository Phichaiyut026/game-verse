'use client';

import Link from 'next/link';
import { Library, Play } from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmtDate } from '@/lib/utils';
import { Thumb } from '@/components/GameVisuals';
import { CopyButton, EmptyState, Guard } from '@/components/ui';
import { useToast } from '@/components/Toast';

function MyLibrary() {
  const { db, user, gameById } = useStore();
  const toast = useToast();
  const items = db.orders
    .filter(o => o.user === user!.email && o.status === 'paid')
    .flatMap(o => o.items.map(i => ({ ...i, date: o.date, game: gameById(i.id) })));

  if (!items.length) {
    return <EmptyState icon={Library} title="คลังเกมยังว่างอยู่" text="เกมที่ซื้อแล้วจะแสดงที่นี่พร้อมคีย์" action={<Link href="/store" className="btn">เลือกซื้อเกม</Link>} />;
  }
  return (
    <>
      <h1>คลังเกมของฉัน <span className="muted small">({items.length} เกม)</span></h1>
      <div className="panel">
        {items.map(i => (
          <div key={i.key} className="cart-item">
            <Link href={`/game/${i.id}`}><Thumb game={i.game ?? { colors: ['#333333', '#111111'], icon: 'gamepad' }} /></Link>
            <div className="info"><b>{i.title}</b><div className="muted small">ได้รับเมื่อ {fmtDate(i.date)}</div></div>
            <span className="key">{i.key}</span>
            <CopyButton text={i.key} />
            <button className="btn sm" onClick={() => toast(`กำลังเปิด ${i.title}... (เดโม)`)}><Play size={14} /> เล่น</button>
          </div>
        ))}
      </div>
    </>
  );
}

export default function LibraryPage() {
  return <Guard><MyLibrary /></Guard>;
}
