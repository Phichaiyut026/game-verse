import type { Game, Order, PayMethod, User } from './types';
import { finalPrice, genKey, hash } from './utils';

const DEMO_NAMES = ['Ploy', 'Arm', 'Ice', 'Bank', 'Mild', 'Nont', 'Fern', 'Golf'];
const METHODS: PayMethod[] = ['card', 'card', 'card', 'promptpay', 'promptpay', 'wallet'];

/** สุ่มแบบกำหนด seed ได้ เพื่อให้ข้อมูลตัวอย่างคงที่ทุกครั้งที่กดสร้าง */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** สร้างลูกค้าและคำสั่งซื้อย้อนหลัง 30 วัน สำหรับทดลองระบบการเงิน */
export function createDemoSales(games: Game[]): { users: User[]; orders: Order[] } {
  const rand = rng(20261003);
  const paidGames = games.filter(g => g.price > 0);
  const now = Date.now();
  const users: User[] = DEMO_NAMES.map((name, i) => ({
    email: `${name.toLowerCase()}@demo.gamestore.test`, name, role: 'user', pass: hash(`demo-${i}-${now}`),
    wishlist: [], created: new Date(now - (40 - i) * 86400000).toISOString(), demo: true
  }));
  const orders: Order[] = [];
  for (let day = 29; day >= 0; day--) {
    const count = Math.floor(rand() * 3) + (day < 7 ? 1 : 0);
    for (let n = 0; n < count; n++) {
      const user = users[Math.floor(rand() * users.length)];
      const itemCount = rand() < 0.25 ? 2 : 1;
      const picks = [...new Set(Array.from({ length: itemCount }, () => paidGames[Math.floor(rand() * paidGames.length)]))];
      const items = picks.map(g => ({ id: g.id, title: g.title, price: finalPrice(g), key: genKey() }));
      const subtotal = Math.round(items.reduce((s, i) => s + i.price, 0) * 100) / 100;
      const coupon = rand() < 0.2 ? 'WELCOME10' : null;
      const discount = coupon ? Math.round(subtotal * 0.1) : 0;
      const date = new Date(now - day * 86400000 - Math.floor(rand() * 10) * 3600000);
      const refunded = rand() < 0.06;
      orders.push({
        id: `ORD-DEMO${String(orders.length + 1).padStart(3, '0')}`, user: user.email, date: date.toISOString(),
        status: refunded ? 'refunded' : 'paid', refundedAt: refunded ? new Date(date.getTime() + 86400000).toISOString() : undefined,
        items, subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100, method: METHODS[Math.floor(rand() * METHODS.length)], coupon, demo: true
      });
    }
  }
  return { users, orders };
}
