import type { CartSummary as Summary } from '@/lib/store';
import { baht } from '@/lib/utils';

export function CartSummary({ c }: { c: Summary }) {
  return (
    <>
      <div className="sum-row"><span>ราคาสินค้า ({c.items.length} เกม)</span><span>{baht(c.subtotal + c.saved)}</span></div>
      {c.saved > 0 && <div className="sum-row" style={{ color: 'var(--good)' }}><span>ส่วนลดโปรโมชั่น</span><span>-{baht(c.saved)}</span></div>}
      {c.discount > 0 && c.coupon && <div className="sum-row" style={{ color: 'var(--good)' }}><span>คูปอง {c.coupon.code}</span><span>-{baht(c.discount)}</span></div>}
      <div className="sum-row total"><span>ยอดรวม</span><span>{baht(c.total)}</span></div>
    </>
  );
}
