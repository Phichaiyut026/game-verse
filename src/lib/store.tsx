'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Coupon, Database, Game, NewsPost, Order, PayMethod, Payout, User } from './types';
import { createSeedDb, DATA_VERSION, LEGACY_GAME_IDS, LEGACY_NEWS_IDS, SEED_GAMES, SEED_NEWS, SEED_REVIEWS } from './seed';
import { finalPrice, genKey, hash, round2, uid } from './utils';
import { createDemoSales } from './demo';
import { useToast } from '@/components/Toast';

const STORAGE_KEY = 'gameverse_db_v1';

/**
 * ย้ายข้อมูลจากชุดข้อมูลเก่า (เกมสมมติ) มาเป็นแคตตาล็อกเกมจริง
 * เก็บของที่ผู้ใช้สร้างไว้: บัญชี คำสั่งซื้อ เกม/ข่าวที่แอดมินเพิ่ม รีวิวที่ผู้ใช้เขียน
 */
function migrate(d: Database): Database {
  if ((d.dataVersion ?? 1) >= DATA_VERSION) return d;
  const seedIds = new Set(SEED_GAMES.map(g => g.id));
  const custom = d.games.filter(g => !LEGACY_GAME_IDS.has(g.id) && !seedIds.has(g.id));
  const games = [...SEED_GAMES, ...custom];
  const ids = new Set(games.map(g => g.id));
  const keep = (list: string[]) => list.filter(id => ids.has(id));
  return {
    ...d,
    games,
    // รีวิว/ข่าวที่มีอยู่แล้วเก็บไว้ (รวมยอดวิวและการแก้ไข) แล้วเติมของตั้งต้นที่ยังไม่มี
    reviews: [
      ...d.reviews.filter(r => ids.has(r.gameId)),
      ...SEED_REVIEWS.filter(sr => !d.reviews.some(r => r.gameId === sr.gameId && r.user === sr.user && r.text === sr.text))
    ],
    news: [
      ...d.news.filter(n => !LEGACY_NEWS_IDS.has(n.id)).map(n => (n.gameId && !ids.has(n.gameId) ? { ...n, gameId: null } : n)),
      ...SEED_NEWS.filter(sn => !d.news.some(n => n.id === sn.id))
    ],
    cart: keep(d.cart), recent: keep(d.recent), guestWish: keep(d.guestWish), ignored: keep(d.ignored),
    users: d.users.map(u => ({ ...u, wishlist: keep(u.wishlist) })),
    dataVersion: DATA_VERSION
  };
}

export interface CartSummary {
  items: Game[];
  subtotal: number;
  saved: number;
  discount: number;
  coupon: Coupon | null;
  couponErr: string | null;
  total: number;
}

function useStoreValue() {
  const toast = useToast();
  const [db, setDb] = useState<Database>(createSeedDb);
  const [ready, setReady] = useState(false);
  const dbRef = useRef(db);

  // โหลดข้อมูลจาก localStorage หลัง mount (ป้องกัน hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const loaded = migrate({ ...createSeedDb(), dataVersion: 1, ...JSON.parse(raw) } as Database);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
        dbRef.current = loaded;
        setDb(loaded);
      }
    } catch { /* storage blocked — use seed */ }
    setReady(true);
  }, []);

  const commit = useCallback((fn: (d: Database) => Database) => {
    const next = fn(dbRef.current);
    dbRef.current = next;
    setDb(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const user = useMemo(() => (db.session ? db.users.find(u => u.email === db.session) ?? null : null), [db]);
  const isAdmin = user?.role === 'admin';

  const ownedIds = useCallback((email = user?.email) => {
    const ids = new Set<string>();
    if (!email) return ids;
    db.orders.filter(o => o.user === email && o.status === 'paid').forEach(o => o.items.forEach(i => ids.add(i.id)));
    return ids;
  }, [db.orders, user]);

  const owned = useMemo(() => ownedIds(), [ownedIds]);
  const wishlist = user ? user.wishlist : db.guestWish;
  const gameById = useCallback((id: string) => db.games.find(g => g.id === id), [db.games]);

  const avgRating = useCallback((gameId: string) => {
    const rs = db.reviews.filter(r => r.gameId === gameId);
    const g = db.games.find(x => x.id === gameId);
    const baseCount = g?.reviewCount ?? 0;
    const local = rs.reduce((s, r) => s + r.rating, 0);
    if (!rs.length) return { avg: g?.rating ?? 0, count: baseCount };
    // รวมคะแนนจาก Steam (ถ่วงตามจำนวนรีวิว) กับรีวิวที่เขียนในร้าน
    if (baseCount) return { avg: ((g!.rating * baseCount) + local) / (baseCount + rs.length), count: baseCount + rs.length };
    return { avg: local / rs.length, count: rs.length };
  }, [db.reviews, db.games]);

  const calcCart = useCallback((code = db.couponCode): CartSummary => {
    const items = db.cart.map(id => db.games.find(g => g.id === id)).filter((g): g is Game => !!g && !owned.has(g.id));
    const subtotal = round2(items.reduce((s, g) => s + finalPrice(g), 0));
    const saved = round2(items.reduce((s, g) => s + (g.price - finalPrice(g)), 0));
    let discount = 0, coupon: Coupon | null = null, couponErr: string | null = null;
    if (code) {
      coupon = db.coupons.find(c => c.code === code.toUpperCase() && c.active) ?? null;
      if (!coupon) couponErr = 'โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ';
      else if (subtotal < coupon.minTotal) { couponErr = `ต้องมียอดขั้นต่ำ ฿${coupon.minTotal.toLocaleString('th-TH')}`; coupon = null; }
      else discount = coupon.type === 'percent' ? Math.round(subtotal * coupon.value / 100) : Math.min(coupon.value, subtotal);
    }
    return { items, subtotal, saved, discount, coupon, couponErr, total: round2(subtotal - discount) };
  }, [db, owned]);

  // ---------- actions ----------
  const updateUser = (email: string, fn: (u: User) => User) =>
    commit(d => ({ ...d, users: d.users.map(u => (u.email === email ? fn(u) : u)) }));

  const actions = {
    login(email: string, password: string): User | null {
      const u = dbRef.current.users.find(x => x.email === email.trim().toLowerCase() && x.pass === hash(password));
      if (!u) return null;
      const guest = dbRef.current.guestWish;
      commit(d => ({
        ...d, session: u.email, guestWish: [],
        users: d.users.map(x => (x.email === u.email ? { ...x, wishlist: [...new Set([...x.wishlist, ...guest])] } : x))
      }));
      toast(`ยินดีต้อนรับ ${u.name}`);
      return u;
    },
    register(name: string, email: string, password: string): string | null {
      email = email.trim().toLowerCase();
      if (dbRef.current.users.some(u => u.email === email)) return 'อีเมลนี้ถูกใช้แล้ว';
      const u: User = { email, name: name.trim(), role: 'user', pass: hash(password), wishlist: [...dbRef.current.guestWish], created: new Date().toISOString() };
      commit(d => ({ ...d, users: [...d.users, u], session: email, guestWish: [] }));
      toast('สมัครสมาชิกสำเร็จ');
      return null;
    },
    logout() { commit(d => ({ ...d, session: null })); toast('ออกจากระบบแล้ว'); },
    updateProfile(name: string) { if (user) updateUser(user.email, u => ({ ...u, name })); },
    changePassword(oldPass: string, newPass: string): string | null {
      if (!user) return 'กรุณาเข้าสู่ระบบ';
      if (hash(oldPass) !== user.pass) return 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
      updateUser(user.email, u => ({ ...u, pass: hash(newPass) }));
      return null;
    },

    addToCart(id: string) {
      const g = gameById(id);
      if (!g) return;
      if (owned.has(id)) return toast('คุณมีเกมนี้ในคลังแล้ว', 'error');
      if (dbRef.current.cart.includes(id)) return toast('เกมนี้อยู่ในตะกร้าแล้ว');
      commit(d => ({ ...d, cart: [...d.cart, id] }));
      toast(`เพิ่ม "${g.title}" ลงตะกร้าแล้ว`);
    },
    addManyToCart(ids: string[]) {
      commit(d => ({ ...d, cart: [...new Set([...d.cart, ...ids.filter(id => !owned.has(id))])] }));
      toast('เพิ่มลงตะกร้าแล้ว');
    },
    removeFromCart(id: string) { commit(d => ({ ...d, cart: d.cart.filter(x => x !== id) })); },
    setCouponCode(code: string) { commit(d => ({ ...d, couponCode: code.trim().toUpperCase() })); },

    toggleWish(id: string): boolean {
      const had = wishlist.includes(id);
      const next = had ? wishlist.filter(x => x !== id) : [...wishlist, id];
      if (user) updateUser(user.email, u => ({ ...u, wishlist: next }));
      else commit(d => ({ ...d, guestWish: next }));
      toast(had ? 'นำออกจากรายการที่อยากได้แล้ว' : 'เพิ่มในรายการที่อยากได้แล้ว');
      return !had;
    },
    pushRecent(id: string) {
      if (dbRef.current.recent[0] === id) return;
      commit(d => ({ ...d, recent: [id, ...d.recent.filter(x => x !== id)].slice(0, 6) }));
    },

    placeOrder(method: PayMethod): Order | null {
      if (!user) return null;
      const c = calcCart();
      if (!c.items.length) return null;
      const order: Order = {
        id: 'ORD-' + Date.now().toString(36).toUpperCase(), user: user.email, date: new Date().toISOString(), status: 'paid',
        items: c.items.map(g => ({ id: g.id, title: g.title, price: finalPrice(g), key: genKey() })),
        subtotal: c.subtotal, discount: c.discount, total: c.total, method, coupon: c.coupon?.code ?? null
      };
      const boughtIds = new Set(order.items.map(i => i.id));
      commit(d => ({
        ...d, orders: [...d.orders, order], cart: [], couponCode: '',
        users: d.users.map(u => (u.email === user.email ? { ...u, wishlist: u.wishlist.filter(id => !boughtIds.has(id)) } : u))
      }));
      return order;
    },
    claimFree(id: string): boolean {
      const g = gameById(id);
      if (!user || !g) return false;
      const order: Order = {
        id: uid('ORD-').toUpperCase(), user: user.email, date: new Date().toISOString(), status: 'paid',
        items: [{ id: g.id, title: g.title, price: 0, key: genKey() }], subtotal: 0, discount: 0, total: 0, method: 'free', coupon: null
      };
      commit(d => ({ ...d, orders: [...d.orders, order] }));
      toast(`เพิ่ม "${g.title}" เข้าคลังเกมแล้ว`);
      return true;
    },
    saveReview(gameId: string, rating: number, text: string) {
      if (!user) return;
      commit(d => ({
        ...d,
        reviews: [...d.reviews.filter(r => !(r.gameId === gameId && r.email === user.email)),
          { gameId, email: user.email, user: user.name, rating, text, date: new Date().toISOString().slice(0, 10) }]
      }));
      toast('ขอบคุณสำหรับรีวิว');
    },
    sendMessage(subject: string, text: string) {
      commit(d => ({ ...d, messages: [...d.messages, { subject, text, user: user?.email ?? 'guest', date: new Date().toISOString() }] }));
    },

    // ---------- admin ----------
    upsertGame(game: Game) {
      commit(d => ({ ...d, games: d.games.some(g => g.id === game.id) ? d.games.map(g => (g.id === game.id ? game : g)) : [...d.games, game] }));
    },
    deleteGame(id: string) { commit(d => ({ ...d, games: d.games.filter(g => g.id !== id), cart: d.cart.filter(x => x !== id) })); },
    refundOrder(id: string) { commit(d => ({ ...d, orders: d.orders.map(o => (o.id === id ? { ...o, status: 'refunded', refundedAt: new Date().toISOString() } : o)) })); },
    toggleRole(email: string) { updateUser(email, u => ({ ...u, role: u.role === 'admin' ? 'user' : 'admin' })); },
    deleteUser(email: string) { commit(d => ({ ...d, users: d.users.filter(u => u.email !== email) })); },
    addCoupon(c: Coupon) { commit(d => ({ ...d, coupons: [...d.coupons, c] })); },
    toggleCoupon(code: string) { commit(d => ({ ...d, coupons: d.coupons.map(c => (c.code === code ? { ...c, active: !c.active } : c)) })); },
    deleteCoupon(code: string) { commit(d => ({ ...d, coupons: d.coupons.filter(c => c.code !== code) })); },
    upsertNews(post: NewsPost) {
      commit(d => ({ ...d, news: d.news.some(n => n.id === post.id) ? d.news.map(n => (n.id === post.id ? post : n)) : [...d.news, post] }));
    },
    patchNews(id: string, patch: Partial<NewsPost>) { commit(d => ({ ...d, news: d.news.map(n => (n.id === id ? { ...n, ...patch } : n)) })); },
    deleteNews(id: string) { commit(d => ({ ...d, news: d.news.filter(n => n.id !== id) })); },
    ignoreGame(id: string) { commit(d => ({ ...d, ignored: [...new Set([...d.ignored, id])] })); },
    clearIgnored() { commit(d => ({ ...d, ignored: [] })); toast('ล้างรายการเกมที่ไม่สนใจแล้ว'); },
    clearRecent() { commit(d => ({ ...d, recent: [] })); },
    subscribe(email: string): string | null {
      email = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'รูปแบบอีเมลไม่ถูกต้อง';
      if (dbRef.current.subscribers.some(s => s.email === email)) return 'อีเมลนี้สมัครรับข่าวสารไว้แล้ว';
      commit(d => ({ ...d, subscribers: [...d.subscribers, { email, date: new Date().toISOString() }] }));
      toast('สมัครรับข่าวสารเรียบร้อย');
      return null;
    },
    addPayout(p: Payout) { commit(d => ({ ...d, payouts: [...d.payouts, p] })); },
    markAdminSeen() { commit(d => ({ ...d, adminSeenAt: new Date().toISOString() })); },
    generateDemoSales() {
      commit(d => {
        const { users, orders } = createDemoSales(d.games);
        return { ...d, users: [...d.users.filter(u => !u.demo), ...users], orders: [...d.orders.filter(o => !o.demo), ...orders] };
      });
      toast('สร้างข้อมูลยอดขายตัวอย่างแล้ว');
    },
    clearDemoData() {
      commit(d => ({ ...d, users: d.users.filter(u => !u.demo), orders: d.orders.filter(o => !o.demo) }));
      toast('ลบข้อมูลตัวอย่างแล้ว');
    },
    viewNews(id: string) { commit(d => ({ ...d, news: d.news.map(n => (n.id === id ? { ...n, views: n.views + 1 } : n)) })); }
  };

  return { db, ready, user, isAdmin, owned, ownedIds, wishlist, gameById, avgRating, calcCart, ...actions };
}

type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
