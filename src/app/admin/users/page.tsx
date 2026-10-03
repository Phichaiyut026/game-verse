'use client';

import { UsersAdmin } from '@/components/admin/Panels';
import { PageHeader } from '@/components/admin/AdminUI';

export default function Page() {
  return (
    <>
      <PageHeader title="ผู้ใช้" subtitle="บัญชีลูกค้าและสิทธิ์ผู้ดูแล" />
      <UsersAdmin />
    </>
  );
}
