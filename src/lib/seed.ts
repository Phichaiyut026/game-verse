import type { Coupon, Database, Game, NewsPost, Review } from './types';
import { hash } from './utils';

import catalog from './steam-catalog.json';

/** เวอร์ชันชุดข้อมูลตั้งต้น — เพิ่มเลขเมื่อเปลี่ยนแคตตาล็อก เพื่อให้ระบบย้ายข้อมูลเก่าให้อัตโนมัติ */
export const DATA_VERSION = 3;

// รายการเกมจริงจาก Steam (สร้างด้วย `npm run fetch:steam`)
export const SEED_GAMES = catalog as Game[];

/** id ของเกมสมมติในชุดข้อมูลเวอร์ชัน 1 (ใช้ตอนย้ายข้อมูล) */
export const LEGACY_GAME_IDS = new Set(Array.from({ length: 16 }, (_, i) => `g${i + 1}`));
export const LEGACY_NEWS_IDS = new Set(['n1', 'n2', 'n3', 'n4']);

export const SEED_COUPONS: Coupon[] = [
  { code: 'WELCOME10', type: 'percent', value: 10, minTotal: 0, active: true },
  { code: 'SAVE100', type: 'fixed', value: 100, minTotal: 1000, active: true },
  { code: 'GAMER20', type: 'percent', value: 20, minTotal: 1500, active: true }
];

export const SEED_REVIEWS: Review[] = [
  { gameId: 's252490', user: 'ผู้ใช้ทดลอง', rating: 5, text: 'เล่นกับเพื่อนสนุกมาก สร้างฐานทั้งคืนไม่รู้เบื่อ', date: '2026-09-02' },
  { gameId: 's107410', user: 'Mint', rating: 5, text: 'สมจริงที่สุดในแนวทหาร ม็อดเยอะมาก', date: '2026-08-10' },
  { gameId: 's1938090', user: 'Beam', rating: 4, text: 'ยิงมันส์ แต่ไฟล์ใหญ่มาก เตรียมพื้นที่ไว้ด้วย', date: '2026-09-21' },
  { gameId: 's1086940', user: 'Ton', rating: 5, text: 'เนื้อเรื่องและตัวเลือกเยอะมาก เล่นซ้ำได้หลายรอบ', date: '2026-07-15' }
];

// ข่าวของร้าน (ไม่ใช่ข่าวอย่างเป็นทางการจากผู้พัฒนาเกม)
export const SEED_NEWS: NewsPost[] = [
  { id: 'n101', title: 'เทศกาลลดราคาฤดูใบไม้ร่วง — เกมดังลดสูงสุด 75%', category: 'promo', gameId: null, author: 'ทีมงาน GameVerse', date: '2026-10-01T08:00:00.000Z', pinned: true, published: true, views: 0,
    summary: 'Arma 3, Red Dead Redemption 2, Euro Truck Simulator 2 และอีกมากมายลดราคาแรงในร้านแล้ว',
    body: 'เทศกาลลดราคาประจำฤดูใบไม้ร่วงเริ่มแล้ว เกมดังหลายเกมลดราคาสูงสุด 75%\n\nใช้โค้ด GAMER20 รับส่วนลดเพิ่มอีก 20% เมื่อซื้อครบ 1,500 บาท\n\nราคาและส่วนลดอาจเปลี่ยนแปลงตามโปรโมชั่นของผู้จัดจำหน่าย' },
  { id: 'n102', title: 'Rust ลดราคา 50% สำหรับผู้เล่นสายเอาชีวิตรอด', category: 'promo', gameId: 's252490', author: 'ทีมงาน GameVerse', date: '2026-09-28T10:00:00.000Z', pinned: false, published: true, views: 0,
    summary: 'ชวนเพื่อนมาสร้างฐานในราคาครึ่งเดียว ช่วงเทศกาลลดราคาเท่านั้น',
    body: 'Rust ลดราคา 50% ในร้าน GameVerse ช่วงเทศกาลลดราคา\n\nซื้อแล้วได้รับคีย์ทันทีในคลังเกมของคุณ' },
  { id: 'n103', title: 'เพิ่มเกมแนวทหารสมจริง Arma Reforger และ Squad เข้าร้านแล้ว', category: 'news', gameId: 's1874880', author: 'ทีมงาน GameVerse', date: '2026-09-20T12:00:00.000Z', pinned: false, published: true, views: 0,
    summary: 'สำหรับแฟน Arma 3 ที่ชอบการเล่นเป็นทีมแบบสมจริง',
    body: 'เราเพิ่ม Arma Reforger และ Squad เข้ามาในหมวดจำลองสถานการณ์และยิงแล้ว\n\nดูรายละเอียดและความต้องการของระบบได้ที่หน้าเกม' },
  { id: 'n104', title: 'GameVerse รองรับการชำระเงินด้วย TrueMoney Wallet แล้ว', category: 'news', gameId: null, author: 'ทีมงาน GameVerse', date: '2026-09-10T09:00:00.000Z', pinned: false, published: true, views: 0,
    summary: 'เพิ่มช่องทางชำระเงินใหม่ สะดวกและรวดเร็วกว่าเดิม',
    body: 'ตอนนี้คุณสามารถชำระเงินด้วย TrueMoney Wallet ได้แล้ว เพียงกรอกเบอร์โทรศัพท์ที่ผูกกับ Wallet ในหน้าชำระเงิน' }
];

// บัญชีทดสอบสำหรับเดโม (ดูรายละเอียดใน README.md)
const SEED_USERS = [
  { email: 'admin@gamestore.test', name: 'ผู้ดูแลระบบ', password: 'admin123', role: 'admin' as const },
  { email: 'demo@gamestore.test', name: 'ผู้ใช้ทดลอง', password: 'demo123', role: 'user' as const }
];

export function createSeedDb(): Database {
  const now = new Date().toISOString();
  return {
    games: SEED_GAMES,
    users: SEED_USERS.map(u => ({ email: u.email, name: u.name, role: u.role, pass: hash(u.password), wishlist: [], created: now })),
    orders: [],
    reviews: SEED_REVIEWS,
    coupons: SEED_COUPONS,
    messages: [],
    news: SEED_NEWS,
    payouts: [],
    ignored: [],
    subscribers: [],
    dataVersion: DATA_VERSION,
    adminSeenAt: null,
    session: null,
    cart: [],
    couponCode: '',
    guestWish: [],
    recent: []
  };
}
