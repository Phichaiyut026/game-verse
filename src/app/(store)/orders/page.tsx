'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { useStore } from '@/lib/store';
import { baht, fmtDateTime, METHOD_LABEL } from '@/lib/utils';
import { EmptyState, Guard } from '@/components/ui';

function MyOrders() {
  const { db, user } = useStore();
  const list = db.orders.filter(o => o.user === user!.email).sort((a, b) => b.date.localeCompare(a.date));

  if (!list.length) {
    return <EmptyState icon={Receipt} title="ยังไม่มีคำสั่งซื้อ" action={<Link href="/store" className="btn">เลือกซื้อเกม</Link>} />;
  }
  return (
    <>
      <h1>ประวัติการสั่งซื้อ</h1>
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>เลขที่</th><th>วันที่</th><th>รายการ</th><th>วิธีชำระ</th><th>ยอดรวม</th><th>สถานะ</th><th /></tr></thead>
          <tbody>
            {list.map(o => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{fmtDateTime(o.date)}</td>
                <td>{o.items.map(i => i.title).join(', ')}</td>
                <td>{METHOD_LABEL[o.method]}</td>
                <td>{baht(o.total)}</td>
                <td><span className={`status ${o.status}`}>{o.status === 'paid' ? 'ชำระแล้ว' : 'คืนเงินแล้ว'}</span></td>
                <td><Link className="btn ghost sm" href={`/order/${o.id}`}>ดู</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function OrdersPage() {
  return <Guard><MyOrders /></Guard>;
}
