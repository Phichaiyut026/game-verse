'use client';

import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Banknote, Download, HandCoins, Landmark, Percent, Receipt, Undo2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { baht, fmtDateTime, METHOD_LABEL } from '@/lib/utils';
import {
  buildLedger, dailySeries, DEV_SHARE, developerBalances, GATEWAY_FEE, newPayout, summarize, toCsv, VAT_RATE,
  type Transaction, type TxType
} from '@/lib/finance';
import { BarChart, Card, Delta, Kpi, PageHeader, ShareBar } from '@/components/admin/AdminUI';
import { Modal } from '@/components/ui';
import { useToast } from '@/components/Toast';

const PERIODS = { 7: '7 วัน', 30: '30 วัน', 90: '90 วัน', 0: 'ทั้งหมด' } as const;
type Period = keyof typeof PERIODS;
const TX_LABEL: Record<TxType, string> = { sale: 'ขาย', refund: 'คืนเงิน', payout: 'จ่ายผู้พัฒนา' };
const shortDay = (key: string) => new Date(key + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
const money = (n: number) => (n < 0 ? '-' : '') + baht(Math.abs(Math.round(n * 100) / 100));

function PayoutForm({ developer, outstanding, onClose }: { developer: string; outstanding: number; onClose: () => void }) {
  const store = useStore();
  const toast = useToast();
  const [amount, setAmount] = useState(String(Math.max(0, Math.floor(outstanding))));
  const [note, setNote] = useState(`ส่วนแบ่งรายได้ ${new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`);
  return (
    <form onSubmit={e => {
      e.preventDefault();
      const n = Number(amount);
      if (!(n > 0)) return toast('จำนวนเงินไม่ถูกต้อง', 'error');
      if (n > outstanding + 0.01) return toast(`จ่ายได้ไม่เกินยอดค้างจ่าย ${baht(outstanding)}`, 'error');
      store.addPayout(newPayout(developer, n, note.trim()));
      toast(`บันทึกการจ่ายเงินให้ ${developer} แล้ว`);
      onClose();
    }}>
      <h2>บันทึกการจ่ายเงินให้ผู้พัฒนา</h2>
      <p className="a-muted">{developer} · ยอดค้างจ่าย <b>{baht(outstanding)}</b></p>
      <div className="field"><label>จำนวนเงิน (บาท)</label><input type="number" min={1} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></div>
      <div className="field"><label>หมายเหตุ / เลขอ้างอิงการโอน</label><input value={note} onChange={e => setNote(e.target.value)} /></div>
      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="btn ghost" onClick={onClose}>ยกเลิก</button>
        <button className="btn">บันทึกการจ่ายเงิน</button>
      </div>
    </form>
  );
}

export default function FinancePage() {
  const { db } = useStore();
  const [period, setPeriod] = useState<Period>(30);
  const [txType, setTxType] = useState<TxType | ''>('');
  const [limit, setLimit] = useState(15);
  const [paying, setPaying] = useState<{ developer: string; outstanding: number } | null>(null);

  const ledger = useMemo(() => buildLedger(db.orders, db.payouts), [db.orders, db.payouts]);
  const ageDays = (t: Transaction) => (Date.now() - new Date(t.date).getTime()) / 86400000;
  const current = period ? ledger.filter(t => ageDays(t) < period) : ledger;
  const previous = period ? ledger.filter(t => ageDays(t) >= period && ageDays(t) < period * 2) : [];
  const s = summarize(current);
  const p = summarize(previous);

  const chartDays = period || Math.min(90, Math.max(14, Math.ceil(Math.max(0, ...ledger.map(ageDays))) + 1));
  const series = dailySeries(ledger, chartDays);
  const byMethod = (['card', 'promptpay', 'wallet'] as const).map(m => ({
    key: m, label: METHOD_LABEL[m], value: current.filter(t => t.method === m).reduce((sum, t) => sum + t.gross, 0)
  }));
  const byGame = useMemo(() => {
    const ids = new Set(current.filter(t => t.type === 'sale').map(t => t.ref));
    const rows: Record<string, { title: string; units: number; revenue: number }> = {};
    db.orders.filter(o => ids.has(o.id) && o.status === 'paid').forEach(o => o.items.forEach(i => {
      rows[i.id] ??= { title: i.title, units: 0, revenue: 0 };
      rows[i.id].units++; rows[i.id].revenue += i.price;
    }));
    return Object.values(rows).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [current, db.orders]);
  const devs = developerBalances(db.orders, db.games, db.payouts);
  const outstanding = devs.reduce((sum, d) => sum + Math.max(0, d.outstanding), 0);
  const rows = current.filter(t => !txType || t.type === txType);

  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gameverse-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader
        title="การเงิน"
        subtitle="รายรับ ค่าธรรมเนียม ภาษี และส่วนแบ่งรายได้จากทุกการซื้อขาย"
        actions={
          <div className="a-seg" role="group" aria-label="ช่วงเวลา">
            {(Object.keys(PERIODS) as unknown as Period[]).map(k => (
              <button key={k} className={Number(k) === period ? 'active' : ''} onClick={() => { setPeriod(Number(k) as Period); setLimit(15); }}>{PERIODS[k]}</button>
            ))}
          </div>
        }
      />

      <div className="a-kpis six">
        <Kpi label="ยอดขายรวม" value={baht(s.gross)} icon={Banknote} hint={period ? <Delta now={s.gross} prev={p.gross} /> : `${s.orders} คำสั่งซื้อ`} />
        <Kpi label="กำไรสุทธิของร้าน" value={money(s.net)} icon={Landmark} tone={s.net < 0 ? 'bad' : 'good'} hint={period ? <Delta now={s.net} prev={p.net} /> : 'หลังหักทุกรายการ'} />
        <Kpi label="ส่วนแบ่งผู้พัฒนา" value={money(s.devShare)} icon={HandCoins} hint={`${Math.round(DEV_SHARE * 100)}% ของยอดหลัง VAT`} />
        <Kpi label="ค่าธรรมเนียมชำระเงิน" value={money(s.fees)} icon={Percent} tone="warn" hint="หักโดยผู้ให้บริการชำระเงิน" />
        <Kpi label="VAT ที่ต้องนำส่ง" value={money(s.vat)} icon={Receipt} hint={`${Math.round(VAT_RATE * 100)}% รวมอยู่ในราคาขาย`} />
        <Kpi label="คืนเงิน" value={baht(s.refunds)} icon={Undo2} tone={s.refunds ? 'bad' : 'default'} hint={`${s.refundCount} รายการ`} />
      </div>

      <div className="a-grid-2">
        <Card title={`ยอดขายรายวัน (${PERIODS[period]})`}>
          <BarChart
            title="ยอดขายรายวัน"
            data={series.map(d => ({ key: d.day, label: shortDay(d.day), value: Math.max(0, d.gross), tip: `ยอดขาย ${money(d.gross)} · กำไร ${money(d.net)} · ${d.orders} คำสั่งซื้อ` }))}
            format={n => baht(Math.round(n))}
            labelEvery={Math.ceil(series.length / 7)}
          />
        </Card>
        <Card title="สรุปงบกำไรขาดทุน">
          <div className="a-pl">
            <div className="sum-row"><span>ยอดขาย (รวม VAT)</span><span>{baht(s.gross)}</span></div>
            <div className="sum-row neg"><span>หัก คืนเงินลูกค้า</span><span>-{baht(s.refunds)}</span></div>
            <div className="sum-row neg"><span>หัก VAT {Math.round(VAT_RATE * 100)}%</span><span>-{baht(s.vat)}</span></div>
            <div className="sum-row neg"><span>หัก ส่วนแบ่งผู้พัฒนา</span><span>-{baht(s.devShare)}</span></div>
            <div className="sum-row neg"><span>หัก ค่าธรรมเนียมชำระเงิน</span><span>-{baht(s.fees)}</span></div>
            <div className="sum-row total"><span>กำไรสุทธิ</span><span>{money(s.net)}</span></div>
            <p className="a-muted small">อัตรากำไรสุทธิ {s.gross ? ((s.net / s.gross) * 100).toFixed(1) : '0.0'}% · มูลค่าเฉลี่ยต่อคำสั่งซื้อ {baht(s.avgOrder)}</p>
          </div>
        </Card>
      </div>

      <div className="a-grid-2">
        <Card title="ยอดขายตามช่องทางชำระเงิน">
          <ShareBar items={byMethod} format={n => baht(Math.round(n))} />
          <p className="a-muted small" style={{ marginTop: 12 }}>
            ค่าธรรมเนียม: บัตร {(GATEWAY_FEE.card * 100).toFixed(2)}% · พร้อมเพย์ {(GATEWAY_FEE.promptpay * 100).toFixed(2)}% · TrueMoney {(GATEWAY_FEE.wallet * 100).toFixed(2)}%
          </p>
        </Card>
        <Card title="รายได้ตามเกม">
          {byGame.length ? (
            <table>
              <thead><tr><th>เกม</th><th className="num">ขายได้</th><th className="num">รายได้</th></tr></thead>
              <tbody>{byGame.map(g => <tr key={g.title}><td>{g.title}</td><td className="num">{g.units}</td><td className="num">{baht(g.revenue)}</td></tr>)}</tbody>
            </table>
          ) : <p className="a-muted">ยังไม่มียอดขายในช่วงนี้</p>}
        </Card>
      </div>

      <Card title="ส่วนแบ่งรายได้ผู้พัฒนา" actions={<span className="a-pill warn">ค้างจ่ายรวม {baht(outstanding)}</span>}>
        {devs.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ผู้พัฒนา</th><th className="num">ขายได้ (ชิ้น)</th><th className="num">ส่วนแบ่งสะสม</th><th className="num">จ่ายแล้ว</th><th className="num">ค้างจ่าย</th><th /></tr></thead>
              <tbody>
                {devs.map(d => (
                  <tr key={d.developer}>
                    <td>{d.developer}</td>
                    <td className="num">{d.units}</td>
                    <td className="num">{baht(d.earned)}</td>
                    <td className="num">{baht(d.paid)}</td>
                    <td className="num"><b>{money(d.outstanding)}</b></td>
                    <td>{d.outstanding >= 1 && <button className="btn sm" onClick={() => setPaying(d)}>จ่ายเงิน</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="a-muted">ยังไม่มีส่วนแบ่งรายได้</p>}
      </Card>

      <Card
        title="สมุดบัญชีรายการเดินบัญชี"
        actions={
          <div className="row" style={{ flex: '0 0 auto', gap: 8 }}>
            <select value={txType} onChange={e => setTxType(e.target.value as TxType | '')} style={{ width: 'auto' }}>
              <option value="">ทุกประเภท</option>
              {(Object.keys(TX_LABEL) as TxType[]).map(k => <option key={k} value={k}>{TX_LABEL[k]}</option>)}
            </select>
            <button className="btn ghost sm" onClick={exportCsv} disabled={!rows.length}><Download size={14} /> ส่งออก CSV</button>
          </div>
        }
      >
        {rows.length ? (
          <>
            <div className="table-wrap">
              <table className="a-ledger">
                <thead>
                  <tr><th>วันที่</th><th>ประเภท</th><th>อ้างอิง</th><th>ลูกค้า/ผู้รับ</th><th className="num">ยอดเงิน</th><th className="num">VAT</th><th className="num">ค่าธรรมเนียม</th><th className="num">ผู้พัฒนา</th><th className="num">กำไรสุทธิ</th></tr>
                </thead>
                <tbody>
                  {rows.slice(0, limit).map(t => (
                    <tr key={t.id}>
                      <td>{fmtDateTime(t.date)}</td>
                      <td>
                        <span className={`a-tx ${t.type}`}>
                          {t.type === 'sale' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />} {TX_LABEL[t.type]}
                        </span>
                      </td>
                      <td>{t.ref}</td>
                      <td>{t.party}{t.method && <small className="a-muted"> · {METHOD_LABEL[t.method]}</small>}</td>
                      <td className="num">{t.type === 'payout' ? money(t.devShare) : money(t.gross)}</td>
                      <td className="num">{t.vat ? money(t.vat) : '-'}</td>
                      <td className="num">{t.fee ? money(t.fee) : '-'}</td>
                      <td className="num">{t.type === 'payout' ? 'จ่ายแล้ว' : money(t.devShare)}</td>
                      <td className={`num ${t.net < 0 ? 'neg' : ''}`}>{t.type === 'payout' ? '-' : money(t.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > limit && (
              <button className="btn ghost sm" style={{ marginTop: 12 }} onClick={() => setLimit(l => l + 25)}>
                แสดงเพิ่ม ({rows.length - limit} รายการ)
              </button>
            )}
          </>
        ) : <p className="a-muted">ไม่มีรายการในช่วงเวลานี้</p>}
      </Card>

      <Modal open={!!paying} onClose={() => setPaying(null)}>
        {paying && <PayoutForm developer={paying.developer} outstanding={paying.outstanding} onClose={() => setPaying(null)} />}
      </Modal>
    </>
  );
}
