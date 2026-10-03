'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Banknote, Database, Gamepad2, Receipt, ShoppingBag, Trash2, UserPlus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { baht, fmtDateTime, METHOD_LABEL } from '@/lib/utils';
import { buildLedger, dailySeries, localDay, summarize } from '@/lib/finance';
import { BarChart, Card, Delta, Kpi, PageHeader } from '@/components/admin/AdminUI';
import { Thumb } from '@/components/GameVisuals';
import { confirmAction } from '@/components/ui';

const LEGACY_TABS = ['games', 'news', 'orders', 'users', 'coupons', 'messages'];
const shortDay = (key: string) => new Date(key + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

export default function DashboardPage() {
  const store = useStore();
  const router = useRouter();
  const tab = useSearchParams().get('tab');
  const { db } = store;

  // ลิงก์แบบเก่า /admin?tab=xxx → /admin/xxx
  useEffect(() => { if (tab && LEGACY_TABS.includes(tab)) router.replace(`/admin/${tab}`); }, [tab, router]);

  const data = useMemo(() => {
    const ledger = buildLedger(db.orders, db.payouts);
    const now = new Date();
    const inRange = (from: number, to: number) => ledger.filter(t => {
      const age = (now.getTime() - new Date(t.date).getTime()) / 86400000;
      return age >= from && age < to;
    });
    const today = localDay(now);
    const yesterday = localDay(new Date(now.getTime() - 86400000));
    const daySum = (key: string) => summarize(ledger.filter(t => localDay(new Date(t.date)) === key));
    const last30 = summarize(inRange(0, 30));
    const prev30 = summarize(inRange(30, 60));
    const newUsers = (from: number, to: number) => db.users.filter(u => {
      const age = (now.getTime() - new Date(u.created).getTime()) / 86400000;
      return age >= from && age < to && u.role === 'user';
    }).length;

    const sold: Record<string, { id: string; title: string; units: number; revenue: number }> = {};
    db.orders.filter(o => o.status === 'paid').forEach(o => o.items.forEach(i => {
      sold[i.id] ??= { id: i.id, title: i.title, units: 0, revenue: 0 };
      sold[i.id].units++; sold[i.id].revenue += i.price;
    }));

    return {
      today: daySum(today), yesterday: daySum(yesterday), last30, prev30,
      newUsers: newUsers(0, 30), prevUsers: newUsers(30, 60),
      series: dailySeries(ledger, 14),
      top: Object.values(sold).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      recent: [...db.orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
    };
  }, [db.orders, db.payouts, db.users]);

  const hasDemo = db.orders.some(o => o.demo);
  const nameOf = (email: string) => db.users.find(u => u.email === email)?.name ?? email;

  return (
    <>
      <PageHeader
        title={`สวัสดี ${store.user?.name ?? ''}`}
        subtitle={new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={
          <>
            {hasDemo
              ? <button className="btn ghost sm" onClick={() => { if (confirmAction('ลบคำสั่งซื้อและลูกค้าตัวอย่างทั้งหมด?')) store.clearDemoData(); }}><Trash2 size={14} /> ลบข้อมูลตัวอย่าง</button>
              : <button className="btn ghost sm" onClick={() => store.generateDemoSales()}><Database size={14} /> สร้างยอดขายตัวอย่าง</button>}
            <Link href="/admin/finance" className="btn sm"><Banknote size={14} /> ดูรายงานการเงิน</Link>
          </>
        }
      />

      <div className="a-kpis">
        <Kpi label="ยอดขายวันนี้" value={baht(data.today.gross)} icon={Banknote} hint={<Delta now={data.today.gross} prev={data.yesterday.gross} />} />
        <Kpi label="คำสั่งซื้อ 30 วัน" value={data.last30.orders.toLocaleString('th-TH')} icon={ShoppingBag} hint={<Delta now={data.last30.orders} prev={data.prev30.orders} />} />
        <Kpi label="กำไรสุทธิ 30 วัน" value={baht(data.last30.net)} icon={Receipt} tone={data.last30.net < 0 ? 'bad' : 'good'} hint={<Delta now={data.last30.net} prev={data.prev30.net} />} />
        <Kpi label="ลูกค้าใหม่ 30 วัน" value={data.newUsers.toLocaleString('th-TH')} icon={UserPlus} hint={<Delta now={data.newUsers} prev={data.prevUsers} />} />
      </div>

      <div className="a-grid-2">
        <Card title="ยอดขาย 14 วันล่าสุด" actions={<Link href="/admin/finance" className="a-link-btn">รายงานเต็ม</Link>}>
          <BarChart
            title="ยอดขายรายวัน 14 วัน"
            data={data.series.map(d => ({ key: d.day, label: shortDay(d.day), value: Math.max(0, d.gross), tip: `${baht(d.gross)} · ${d.orders} คำสั่งซื้อ` }))}
            format={n => baht(Math.round(n))}
            labelEvery={2}
          />
        </Card>
        <Card title="เกมขายดี" actions={<Link href="/admin/games" className="a-link-btn">ทั้งหมด</Link>}>
          {data.top.length ? (
            <ol className="a-rank">
              {data.top.map((t, i) => {
                const g = store.gameById(t.id);
                return (
                  <li key={t.id}>
                    <span className="a-rank-n">{i + 1}</span>
                    {g ? <Thumb game={g} size={30} /> : <Gamepad2 size={20} />}
                    <span className="a-rank-name">{t.title}<small>{t.units} ชิ้น</small></span>
                    <b>{baht(t.revenue)}</b>
                  </li>
                );
              })}
            </ol>
          ) : <p className="a-muted">ยังไม่มียอดขาย — ลองกด &quot;สร้างยอดขายตัวอย่าง&quot; ด้านบน</p>}
        </Card>
      </div>

      <Card title="คำสั่งซื้อล่าสุด" actions={<Link href="/admin/orders" className="a-link-btn">ดูทั้งหมด</Link>}>
        {data.recent.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>เลขที่</th><th>ลูกค้า</th><th>เวลา</th><th>ช่องทาง</th><th className="num">ยอดรวม</th><th>สถานะ</th></tr></thead>
              <tbody>
                {data.recent.map(o => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/orders?q=${o.id}`} className="a-link-btn">{o.id}</Link></td>
                    <td>{nameOf(o.user)}</td>
                    <td>{fmtDateTime(o.date)}</td>
                    <td>{METHOD_LABEL[o.method]}</td>
                    <td className="num">{baht(o.total)}</td>
                    <td><span className={`status ${o.status}`}>{o.status === 'paid' ? 'ชำระแล้ว' : 'คืนเงินแล้ว'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="a-muted">ยังไม่มีคำสั่งซื้อ</p>}
      </Card>
    </>
  );
}
