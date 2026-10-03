'use client';

import Link from 'next/link';
import { BadgePercent, CalendarDays, Megaphone, Newspaper, Pin, Wrench, type LucideIcon } from 'lucide-react';
import type { NewsCategory, NewsPost } from '@/lib/types';
import { fmtDate, gradient, NEWS_CATEGORY } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { Art } from './GameVisuals';

export const NEWS_ICONS: Record<NewsCategory, LucideIcon> = {
  update: Wrench, news: Newspaper, event: CalendarDays, promo: BadgePercent
};

export function CategoryPill({ category }: { category: NewsCategory }) {
  const Icon = NEWS_ICONS[category] ?? Megaphone;
  return <span className={`news-cat ${category}`}><Icon size={12} /> {NEWS_CATEGORY[category]}</span>;
}

export function NewsCard({ post }: { post: NewsPost }) {
  const { gameById } = useStore();
  const game = post.gameId ? gameById(post.gameId) : undefined;
  const Icon = NEWS_ICONS[post.category] ?? Megaphone;

  return (
    <Link href={`/news/${post.id}`} className="news-card">
      <div className={`news-cover ${game ? '' : `cat-${post.category}`}`} style={game ? { background: gradient(game) } : undefined}>
        {game ? <Art game={game} iconSize={48} title={false} /> : <Icon size={48} strokeWidth={1.25} />}
        {post.pinned && <span className="news-pin"><Pin size={12} /> ปักหมุด</span>}
      </div>
      <div className="news-body">
        <div className="news-meta">
          <CategoryPill category={post.category} />
          <span className="muted small">{fmtDate(post.date)}</span>
        </div>
        <h3>{post.title}</h3>
        <p className="muted">{post.summary}</p>
        {game && <span className="small news-game">{game.title}</span>}
      </div>
    </Link>
  );
}
