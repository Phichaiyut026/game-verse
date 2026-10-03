'use client';

import { MessagesAdmin } from '@/components/admin/Panels';
import { PageHeader } from '@/components/admin/AdminUI';

export default function Page() {
  return (
    <>
      <PageHeader title="ข้อความจากลูกค้า" subtitle="ข้อความที่ส่งเข้ามาจากหน้าติดต่อเรา" />
      <MessagesAdmin />
    </>
  );
}
