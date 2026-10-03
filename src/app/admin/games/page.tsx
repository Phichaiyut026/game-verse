'use client';

import { GamesAdmin } from '@/components/admin/Panels';
import { PageHeader } from '@/components/admin/AdminUI';

export default function Page() {
  return (
    <>
      <PageHeader title="จัดการเกม" subtitle="เพิ่ม แก้ไข และลบเกมในร้าน" />
      <GamesAdmin />
    </>
  );
}
