'use client';

import { OrdersAdmin } from '@/components/admin/Panels';
import { PageHeader } from '@/components/admin/AdminUI';

export default function Page() {
  return (
    <>
      <PageHeader title="คำสั่งซื้อ" subtitle="รายการสั่งซื้อทั้งหมดและการคืนเงิน" />
      <OrdersAdmin />
    </>
  );
}
