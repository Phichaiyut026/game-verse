import type { Game } from './types';

export interface Recommendation {
  game: Game;
  score: number;
  reason: string;
}

/**
 * แนะนำเกมจากความสนใจของผู้ใช้
 * น้ำหนัก: เกมที่มีแล้ว 3, อยู่ในรายการที่อยากได้ 2, เพิ่งดู 1
 * ให้คะแนนจากประเภทที่ตรงกัน (x2) + แท็กที่ตรงกัน + เรตติ้ง + ส่วนลดเล็กน้อย
 */
export function recommend(opts: {
  games: Game[]; owned: Set<string>; wishlist: string[]; recent: string[]; ignored: string[];
  avg: (id: string) => number; exclude?: Set<string>;
}): Recommendation[] {
  const { games, owned, wishlist, recent, ignored, avg, exclude } = opts;
  const byId = new Map(games.map(g => [g.id, g]));
  const genreW = new Map<string, number>();
  const tagW = new Map<string, number>();
  const sources: { game: Game; w: number }[] = [];
  const add = (id: string, w: number) => {
    const g = byId.get(id);
    if (!g) return;
    sources.push({ game: g, w });
    genreW.set(g.genre, (genreW.get(g.genre) ?? 0) + w);
    g.tags.forEach(t => tagW.set(t, (tagW.get(t) ?? 0) + w));
  };
  owned.forEach(id => add(id, 3));
  wishlist.forEach(id => add(id, 2));
  recent.forEach(id => add(id, 1));
  const hasSignal = sources.length > 0;
  const skip = new Set([...owned, ...ignored, ...(exclude ?? [])]);

  return games
    .filter(g => !skip.has(g.id))
    .map(g => {
      const genreScore = (genreW.get(g.genre) ?? 0) * 2;
      const tagScore = g.tags.reduce((s, t) => s + (tagW.get(t) ?? 0), 0);
      const score = genreScore + tagScore + avg(g.id) * 0.8 + g.discount / 50;
      let reason = 'ได้รับคะแนนรีวิวสูงจากผู้เล่น';
      if (hasSignal && (genreScore || tagScore)) {
        const similar = sources
          .filter(s => s.game.id !== g.id && (s.game.genre === g.genre || s.game.tags.some(t => g.tags.includes(t))))
          .sort((a, b) => b.w - a.w)[0];
        reason = similar
          ? `${similar.w === 3 ? 'เพราะคุณมี' : similar.w === 2 ? 'เพราะคุณอยากได้' : 'เพราะคุณเพิ่งดู'} ${similar.game.title}`
          : `เพราะคุณสนใจเกม${g.genre}`;
      } else if (g.discount >= 30) {
        reason = `กำลังลดราคา ${g.discount}%`;
      }
      return { game: g, score, reason };
    })
    .sort((a, b) => b.score - a.score);
}
