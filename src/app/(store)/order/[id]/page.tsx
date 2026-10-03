'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CircleCheck, Receipt } from 'lucide-react';
import { useStore } from '@/lib/store';
import { baht, fmtDateTime, METHOD_LABEL } from '@/lib/utils';
import { CopyButton, EmptyState, Guard } from '@/components/ui';

function OrderDone({ id }: { id: string }) {
  const { db, user, isAdmin } = useStore();
  const o = db.orders.find(x => x.id === id && (x.user === user?.email || isAdmin));
  if (!o) return <EmptyState icon={Receipt} title="ไม่พบคำสั่งซื้อนี้" action={<Link href="/orders" className="btn">ดูประวัติการสั่งซื้อ</Link>} />;

  return (
    <div className="panel" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
      <CircleCheck size={64} strokeWidth={1.5} className="success-icon" />
      <h1>{o.status === 'paid' ? 'ชำระเงินสำเร็จ' : 'คำสั่งซื้อนี้ถูกคืนเงินแล้ว'}</h1>
      <p className="muted">หมายเลขคำสั่งซื้อ <b>{o.id}</b> · {fmtDateTime(o.date)}</p>
      <div style={{ textAlign: 'left', margin: '20px 0' }}>
        {o.items.map(i => (
          <div key={i.id} className="cart-item">
            <div className="info"><b>{i.title}</b><div className="small muted">คีย์เกม</div></div>
            <span className="key">{i.key}</span>
            <CopyButton text={i.key} />
          </div>
        ))}
        <div className="sum-row total"><span>ชำระแล้ว ({METHOD_LABEL[o.method]})</span><span>{baht(o.total)}</span></div>
      </div>
      <div className="row">
        <Link href="/library" className="btn">ไปที่คลังเกม</Link>
        <Link href="/store" className="btn ghost">เลือกซื้อต่อ</Link>
      </div>
    </div>
  );
}

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  return <Guard><OrderDone id={id} /></Guard>;
}
