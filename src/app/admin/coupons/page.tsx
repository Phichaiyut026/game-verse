'use client';

import { CouponsAdmin } from '@/components/admin/Panels';
import { PageHeader } from '@/components/admin/AdminUI';

export default function Page() {
  return (
    <>
      <PageHeader title="คูปองส่วนลด" subtitle="สร้างและจัดการโค้ดส่วนลด" />
      <CouponsAdmin />
    </>
  );
}
