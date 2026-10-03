'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Newspaper } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { NewsCategory } from '@/lib/types';
import { NEWS_CATEGORY, sortNews } from '@/lib/utils';
import { NewsCard } from '@/components/NewsCard';
import { EmptyState, Ready } from '@/components/ui';

function NewsList() {
  const { db } = useStore();
  const router = useRouter();
  const raw = useSearchParams().get('cat');
  const cat = raw && raw in NEWS_CATEGORY ? (raw as NewsCategory) : null;
  const list = sortNews(db.news.filter(n => n.published && (!cat || n.category === cat)));

  return (
    <>
      <h1 className="with-icon"><Newspaper size={28} />ข่าวสารและอัปเดต</h1>
      <p className="muted">ติดตามแพตช์ใหม่ กิจกรรม และโปรโมชั่นล่าสุดจาก GameVerse</p>
      <div className="tabs">
        <button className={!cat ? 'active' : ''} onClick={() => router.replace('/news')}>ทั้งหมด</button>
        {(Object.keys(NEWS_CATEGORY) as NewsCategory[]).map(k => (
          <button key={k} className={cat === k ? 'active' : ''} onClick={() => router.replace(`/news?cat=${k}`)}>{NEWS_CATEGORY[k]}</button>
        ))}
      </div>
      {list.length
        ? <div className="news-grid">{list.map(n => <NewsCard key={n.id} post={n} />)}</div>
        : <EmptyState icon={Newspaper} title="ยังไม่มีข่าวในหมวดนี้" />}
    </>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="loading">กำลังโหลด...</div>}>
      <Ready><NewsList /></Ready>
    </Suspense>
  );
}
