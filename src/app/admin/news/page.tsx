'use client';

import { NewsAdmin } from '@/components/admin/Panels';
import { PageHeader } from '@/components/admin/AdminUI';

export default function Page() {
  return (
    <>
      <PageHeader title="ข่าวสารและอัปเดต" subtitle="เขียนข่าว ประกาศแพตช์ กิจกรรม และโปรโมชั่น" />
      <NewsAdmin />
    </>
  );
}
