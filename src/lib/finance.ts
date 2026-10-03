import type { Game, Order, PayMethod, Payout } from './types';
import { uid } from './utils';

// ---------- อัตราที่ใช้คำนวณ (ปรับได้ที่นี่ที่เดียว) ----------
/** ภาษีมูลค่าเพิ่ม — ราคาขายรวม VAT แล้ว */
export const VAT_RATE = 0.07;
/** ค่าธรรมเนียม payment gateway ต่อรายการ */
export const GATEWAY_FEE: Record<PayMethod, number> = { card: 0.0365, promptpay: 0.0165, wallet: 0.025, free: 0 };
/** ส่วนแบ่งรายได้ที่ผู้พัฒนาได้รับ (คิดจากยอดหลังหัก VAT) */
export const DEV_SHARE = 0.7;

export type TxType = 'sale' | 'refund' | 'payout';

/** รายการเดินบัญชี 1 แถว — ค่าบวก = เงินเข้า, ค่าลบ = เงินออก */
export interface Transaction {
  id: string;
  date: string;
  type: TxType;
  ref: string;
  party: string;
  method: PayMethod | null;
  gross: number;
  vat: number;
  fee: number;
  devShare: number;
  /** กำไรสุทธิของร้าน = gross - vat - fee - devShare */
  net: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function splitSale(gross: number, method: PayMethod) {
  const vat = round2(gross * VAT_RATE / (1 + VAT_RATE));
  const fee = round2(gross * GATEWAY_FEE[method]);
  const devShare = round2((gross - vat) * DEV_SHARE);
  return { vat, fee, devShare, net: round2(gross - vat - fee - devShare) };
}

/**
 * สร้างสมุดบัญชีจากคำสั่งซื้อและการจ่ายเงินผู้พัฒนา
 * - ขาย: บันทึกรายรับ VAT ค่าธรรมเนียม และส่วนแบ่งผู้พัฒนา
 * - คืนเงิน: กลับรายการยอดขาย/VAT/ส่วนแบ่ง แต่ค่าธรรมเนียม gateway ไม่ได้คืน (ร้านรับภาระ)
 * - จ่ายผู้พัฒนา: เงินสดออก ไม่กระทบกำไร (เป็นการชำระหนี้ค้างจ่าย)
 */
export function buildLedger(orders: Order[], payouts: Payout[]): Transaction[] {
  const tx: Transaction[] = [];
  for (const o of orders) {
    if (o.total <= 0) continue;
    const s = splitSale(o.total, o.method);
    tx.push({ id: `${o.id}-S`, date: o.date, type: 'sale', ref: o.id, party: o.user, method: o.method, gross: o.total, ...s });
    if (o.status === 'refunded') {
      tx.push({
        id: `${o.id}-R`, date: o.refundedAt ?? o.date, type: 'refund', ref: o.id, party: o.user, method: o.method,
        gross: -o.total, vat: -s.vat, fee: 0, devShare: -s.devShare, net: round2(-o.total + s.vat + s.devShare)
      });
    }
  }
  for (const p of payouts) {
    tx.push({ id: p.id, date: p.date, type: 'payout', ref: p.note || 'จ่ายส่วนแบ่ง', party: p.developer, method: null, gross: 0, vat: 0, fee: 0, devShare: -p.amount, net: 0 });
  }
  return tx.sort((a, b) => b.date.localeCompare(a.date));
}

export interface FinanceSummary {
  gross: number; refunds: number; vat: number; fees: number; devShare: number; net: number;
  orders: number; refundCount: number; avgOrder: number;
}

export function summarize(tx: Transaction[]): FinanceSummary {
  const sales = tx.filter(t => t.type === 'sale');
  const refunds = tx.filter(t => t.type === 'refund');
  const sum = (list: Transaction[], k: 'gross' | 'vat' | 'fee' | 'devShare' | 'net') => round2(list.reduce((s, t) => s + t[k], 0));
  const money = tx.filter(t => t.type !== 'payout');
  return {
    gross: sum(sales, 'gross'),
    refunds: Math.abs(sum(refunds, 'gross')),
    vat: sum(money, 'vat'),
    fees: sum(money, 'fee'),
    devShare: sum(money, 'devShare'),
    net: sum(money, 'net'),
    orders: sales.length,
    refundCount: refunds.length,
    avgOrder: sales.length ? round2(sum(sales, 'gross') / sales.length) : 0
  };
}

/** ยอดขาย (ก่อนหักคืนเงิน) แยกรายวัน สำหรับกราฟ */
export function dailySeries(tx: Transaction[], days: number, now = new Date()) {
  const keys = Array.from({ length: days }, (_, i) => {
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (days - 1 - i));
    return localDay(d);
  });
  const map = new Map(keys.map(k => [k, { day: k, gross: 0, net: 0, orders: 0 }]));
  for (const t of tx) {
    const row = map.get(localDay(new Date(t.date)));
    if (!row || t.type === 'payout') continue;
    row.gross += t.gross; row.net += t.net;
    if (t.type === 'sale') row.orders++;
  }
  return [...map.values()].map(r => ({ ...r, gross: round2(r.gross), net: round2(r.net) }));
}

export const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** ส่วนแบ่งค้างจ่ายต่อผู้พัฒนา (คิดจากราคาของแต่ละเกมในคำสั่งซื้อ) */
export function developerBalances(orders: Order[], games: Game[], payouts: Payout[]) {
  const devOf = new Map(games.map(g => [g.id, g.developer]));
  const rows = new Map<string, { developer: string; earned: number; paid: number; units: number }>();
  const row = (dev: string) => {
    if (!rows.has(dev)) rows.set(dev, { developer: dev, earned: 0, paid: 0, units: 0 });
    return rows.get(dev)!;
  };
  for (const o of orders) {
    if (o.status !== 'paid' || o.total <= 0) continue;
    const itemsTotal = o.items.reduce((s, i) => s + i.price, 0) || 1;
    for (const it of o.items) {
      // แบ่งยอดหลังคูปองตามสัดส่วนราคาของแต่ละเกม
      const paidForItem = o.total * (it.price / itemsTotal);
      const r = row(devOf.get(it.id) ?? 'ไม่ทราบผู้พัฒนา');
      r.earned += (paidForItem / (1 + VAT_RATE)) * DEV_SHARE;
      r.units++;
    }
  }
  for (const p of payouts) row(p.developer).paid += p.amount;
  return [...rows.values()]
    .map(r => ({ ...r, earned: round2(r.earned), paid: round2(r.paid), outstanding: round2(r.earned - r.paid) }))
    .sort((a, b) => b.outstanding - a.outstanding);
}

export function newPayout(developer: string, amount: number, note: string): Payout {
  return { id: uid('PAY-').toUpperCase(), developer, amount: round2(amount), date: new Date().toISOString(), note };
}

export function toCsv(tx: Transaction[]): string {
  const head = ['วันที่', 'ประเภท', 'อ้างอิง', 'คู่ค้า', 'ช่องทาง', 'ยอดขาย', 'VAT', 'ค่าธรรมเนียม', 'ส่วนแบ่งผู้พัฒนา', 'กำไรสุทธิ'];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = tx.map(t => [t.date, t.type, t.ref, t.party, t.method ?? '', t.gross, t.vat, t.fee, t.devShare, t.net].map(esc).join(','));
  return '﻿' + [head.map(esc).join(','), ...lines].join('\n');
}
