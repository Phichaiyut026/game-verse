'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Copy, type LucideIcon } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useToast } from './Toast';

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <Icon size={56} strokeWidth={1.25} className="empty-icon" />
      <h2>{title}</h2>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" role="dialog" aria-modal="true">{children}</div>
    </div>
  );
}

export function confirmAction(message: string): boolean {
  return typeof window !== 'undefined' && window.confirm(message);
}

export function CopyButton({ text }: { text: string }) {
  const toast = useToast();
  return (
    <button
      className="btn ghost sm"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); toast('คัดลอกคีย์แล้ว'); }
        catch { toast('คัดลอกไม่สำเร็จ', 'error'); }
      }}
    >
      <Copy size={14} /> คัดลอก
    </button>
  );
}

/** ครอบหน้าที่ต้องเข้าสู่ระบบ (และถ้า admin=true ต้องเป็นแอดมิน) */
export function Guard({ admin = false, children }: { admin?: boolean; children: React.ReactNode }) {
  const { ready, user, isAdmin } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const allowed = !!user && (!admin || isAdmin);
  const hadUser = useRef(false);
  if (user) hadUser.current = true;

  useEffect(() => {
    if (!ready || allowed) return;
    if (!user && hadUser.current) {
      // เพิ่งออกจากระบบจากหน้านี้ — กลับหน้าแรกเงียบ ๆ ไม่ต้องแจ้งเตือน
      router.replace('/');
    } else if (!user) {
      toast('กรุณาเข้าสู่ระบบก่อน', 'error');
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else {
      toast('สำหรับผู้ดูแลระบบเท่านั้น', 'error');
      router.replace('/');
    }
  }, [ready, allowed, user, router, pathname, toast]);

  if (!ready || !allowed) return <div className="loading">กำลังโหลด...</div>;
  return <>{children}</>;
}

/** รอให้โหลดข้อมูลจาก localStorage เสร็จก่อนแสดงผล */
export function Ready({ children }: { children: React.ReactNode }) {
  const { ready } = useStore();
  return ready ? <>{children}</> : <div className="loading">กำลังโหลด...</div>;
}
