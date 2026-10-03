'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { ArrowLeft, Eye, Newspaper, Pencil } from 'lucide-react';
import { useStore } from '@/lib/store';
import { fmtDateTime, sortNews } from '@/lib/utils';
import { GameCard } from '@/components/GameCard';
import { CategoryPill, NewsCard } from '@/components/NewsCard';
import { EmptyState, Ready } from '@/components/ui';

function NewsDetail({ id }: { id: string }) {
  const store = useStore();
  const post = store.db.news.find(n => n.id === id);
  // แอดมินดูฉบับร่างได้ ผู้ใช้ทั่วไปเห็นเฉพาะข่าวที่เผยแพร่แล้ว
  const visible = post && (post.published || store.isAdmin);
  const { viewNews } = store;
  const counted = useRef<string | null>(null);

  // นับยอดเข้าชมครั้งเดียวต่อการเปิดหน้า (กัน effect ซ้ำใน Strict Mode)
  useEffect(() => {
    if (!post?.published || counted.current === id) return;
    counted.current = id;
    viewNews(id);
  }, [id, post?.published, viewNews]);

  if (!visible) return <EmptyState icon={Newspaper} title="ไม่พบข่าวนี้" action={<Link href="/news" className="btn">ดูข่าวทั้งหมด</Link>} />;

  const game = post.gameId ? store.gameById(post.gameId) : undefined;
  const more = sortNews(store.db.news.filter(n => n.published && n.id !== post.id)).slice(0, 3);

  return (
    <>
      <Link href="/news" className="muted small with-icon" style={{ marginBottom: 16 }}><ArrowLeft size={16} /> กลับไปหน้าข่าวสาร</Link>
      <div className="news-detail">
        <article className="panel">
          {!post.published && <p className="status refunded" style={{ display: 'inline-block' }}>ฉบับร่าง — ยังไม่เผยแพร่</p>}
          <div className="news-meta"><CategoryPill category={post.category} /></div>
          <h1 style={{ marginTop: 10 }}>{post.title}</h1>
          <p className="muted small with-icon">
            {post.author} · {fmtDateTime(post.date)} · <Eye size={14} /> {post.views.toLocaleString('th-TH')} ครั้ง
          </p>
          <p className="news-summary">{post.summary}</p>
          <div className="news-content">
            {post.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
          </div>
          {store.isAdmin && (
            <Link href={`/admin/news?edit=${post.id}`} className="btn ghost sm" style={{ marginTop: 16 }}><Pencil size={14} /> แก้ไขข่าวนี้</Link>
          )}
        </article>
        {game && (
          <aside>
            <h3>เกมที่เกี่ยวข้อง</h3>
            <GameCard game={game} />
          </aside>
        )}
      </div>
      {more.length > 0 && (
        <section className="section" style={{ marginTop: 32 }}>
          <h2>ข่าวอื่น ๆ</h2>
          <div className="news-grid">{more.map(n => <NewsCard key={n.id} post={n} />)}</div>
        </section>
      )}
    </>
  );
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <Ready><NewsDetail id={id} /></Ready>;
}
