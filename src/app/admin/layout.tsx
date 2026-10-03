import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Guard } from '@/components/ui';
import { AdminShell } from '@/components/admin/AdminShell';
import './admin.css';

export const metadata: Metadata = { title: 'ระบบหลังบ้าน' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Guard admin>
      <AdminShell>
        <Suspense fallback={<div className="loading">กำลังโหลด...</div>}>{children}</Suspense>
      </AdminShell>
    </Guard>
  );
}
