export type Platform = 'PC' | 'PS5' | 'Xbox' | 'Switch';

export type GameIcon =
  | 'car' | 'swords' | 'wheat' | 'glasses' | 'rocket' | 'ghost' | 'medal' | 'shield'
  | 'bot' | 'fish' | 'chef' | 'sword' | 'building' | 'puzzle' | 'crosshair' | 'layers' | 'gamepad';

export interface Game {
  id: string;
  title: string;
  genre: string;
  platforms: Platform[];
  price: number;
  discount: number;
  rating: number;
  release: string;
  developer: string;
  colors: [string, string];
  icon: GameIcon;
  featured: boolean;
  tags: string[];
  desc: string;
  /** Steam app id (ถ้าเป็นเกมที่ดึงจาก Steam) */
  appid?: number;
  publisher?: string;
  /** จำนวนรีวิวจาก Steam — rating คือค่าเฉลี่ยที่แปลงจาก % รีวิวเชิงบวก */
  reviewCount?: number;
  /** รูปปกแนวนอน 460x215 */
  image?: string;
  /** ปกแนวตั้ง 600x900 */
  portrait?: string;
  /** ภาพหน้าจอ: thumb ~600px, full 1920px */
  shots?: { thumb: string; full: string }[];
}

export interface User {
  email: string;
  name: string;
  role: 'admin' | 'user';
  pass: string;
  wishlist: string[];
  created: string;
  demo?: boolean;
}

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  key: string;
}

export type PayMethod = 'card' | 'promptpay' | 'wallet' | 'free';

export interface Order {
  id: string;
  user: string;
  date: string;
  status: 'paid' | 'refunded';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  method: PayMethod;
  coupon: string | null;
  refundedAt?: string;
  /** คำสั่งซื้อที่สร้างจากปุ่ม "สร้างข้อมูลตัวอย่าง" ในหลังบ้าน */
  demo?: boolean;
}

export interface Review {
  gameId: string;
  email?: string;
  user: string;
  rating: number;
  text: string;
  date: string;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minTotal: number;
  active: boolean;
}

export interface Message {
  subject: string;
  text: string;
  user: string;
  date: string;
}

export type NewsCategory = 'update' | 'news' | 'event' | 'promo';

export interface NewsPost {
  id: string;
  title: string;
  category: NewsCategory;
  gameId: string | null;
  summary: string;
  body: string;
  author: string;
  date: string;
  pinned: boolean;
  published: boolean;
  views: number;
}

/** การโอนเงินส่วนแบ่งรายได้ให้ผู้พัฒนาเกม */
export interface Payout {
  id: string;
  developer: string;
  amount: number;
  date: string;
  note: string;
}

export interface Subscriber {
  email: string;
  date: string;
}

export interface Database {
  games: Game[];
  users: User[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  messages: Message[];
  news: NewsPost[];
  payouts: Payout[];
  /** เกมที่ผู้ใช้กด "ไม่สนใจ" ในคิวสำรวจ (เก็บต่ออุปกรณ์) */
  ignored: string[];
  /** เวอร์ชันชุดข้อมูลตั้งต้น ใช้ย้ายข้อมูลเมื่อเปลี่ยนแคตตาล็อก */
  dataVersion?: number;
  subscribers: Subscriber[];
  /** เวลาที่แอดมินเปิดดูการแจ้งเตือนล่าสุด */
  adminSeenAt: string | null;
  session: string | null;
  cart: string[];
  couponCode: string;
  guestWish: string[];
  recent: string[];
}
