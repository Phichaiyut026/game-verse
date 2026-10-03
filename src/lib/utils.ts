import type { Game, NewsCategory, Platform, PayMethod } from './types';

export const PLATFORMS: Platform[] = ['PC', 'PS5', 'Xbox', 'Switch'];
export const GENRES = ['แอ็กชัน', 'ยิง', 'เอาชีวิตรอด', 'RPG', 'แข่งรถ', 'จำลองสถานการณ์', 'วางแผน', 'สยองขวัญ', 'กีฬา', 'แพลตฟอร์ม', 'ผจญภัย', 'ปาร์ตี้', 'ปริศนา'];

export const METHOD_LABEL: Record<PayMethod, string> = {
  card: 'บัตรเครดิต/เดบิต',
  promptpay: 'พร้อมเพย์',
  wallet: 'TrueMoney Wallet',
  free: 'รับฟรี'
};

// แฮชรหัสผ่านแบบง่าย (cyrb53) — ใช้ได้เฉพาะเดโม ระบบจริงต้องแฮชฝั่งเซิร์ฟเวอร์ด้วย bcrypt/argon2
export function hash(str: string, seed = 7): string {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/** แสดงราคาเงินบาท — มีสตางค์ก็แสดง 2 ตำแหน่ง (เช่น ฿399.50) */
export const baht = (n: number) => {
  const v = Math.round(Number(n) * 100) / 100;
  return '฿' + (Number.isInteger(v) ? v.toLocaleString('th-TH') : v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
};
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const finalPrice = (g: Pick<Game, 'price' | 'discount'>) => Math.round(g.price * (100 - (g.discount || 0))) / 100;
export const fmtDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
export const fmtDateTime = (d: string) => new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
export const safeColor = (c: string | undefined) => (c && /^#[0-9a-f]{3,8}$/i.test(c) ? c : '#444444');
export const gradient = (g: Pick<Game, 'colors'>) => `linear-gradient(135deg, ${safeColor(g.colors?.[0])}, ${safeColor(g.colors?.[1])})`;
export const uid = (prefix: string) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function genKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () => Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part()}-${part()}-${part()}`;
}

export function luhn(num: string): boolean {
  let sum = 0;
  [...num].reverse().forEach((d, i) => {
    let n = +d;
    if (i % 2) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  });
  return sum % 10 === 0;
}

// อนุญาตเฉพาะ path ภายในเว็บ ป้องกัน open redirect
export const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');

export const NEWS_CATEGORY: Record<NewsCategory, string> = {
  update: 'อัปเดตเกม',
  news: 'ข่าวสาร',
  event: 'กิจกรรม',
  promo: 'โปรโมชั่น'
};

/** เรียงข่าว: ปักหมุดก่อน แล้วตามวันที่ใหม่สุด */
export const sortNews = <T extends { pinned: boolean; date: string }>(list: T[]) =>
  [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date));

/** ป้ายสรุปรีวิวแบบ Steam — แปลงคะแนน 1–5 กลับเป็น % รีวิวเชิงบวก แล้วใช้เกณฑ์เดียวกับ Steam */
export function reviewSummary(avg: number, count: number): { label: string; tone: 'positive' | 'mixed' | 'negative' } {
  const pct = ((avg - 1) / 4) * 100;
  if (pct >= 95 && count >= 500) return { label: 'แง่บวกอย่างล้นหลาม', tone: 'positive' };
  if (pct >= 80) return { label: count >= 50 ? 'แง่บวกมาก' : 'แง่บวก', tone: 'positive' };
  if (pct >= 70) return { label: 'ค่อนข้างเป็นแง่บวก', tone: 'positive' };
  if (pct >= 40) return { label: 'คละกัน', tone: 'mixed' };
  if (pct >= 20) return { label: 'ค่อนข้างเป็นแง่ลบ', tone: 'negative' };
  return { label: 'แง่ลบ', tone: 'negative' };
}
