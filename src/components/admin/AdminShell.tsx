'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Bell, ChevronRight, Gamepad2, LayoutDashboard, LogOut, Mail, Menu, Newspaper, Receipt, Search, Store, Tag,
  Users, Wallet, X, type LucideIcon
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { baht, fmtDateTime } from '@/lib/utils';

interface NavItem { href: string; label: string; icon: LucideIcon; badge?: number }

export function AdminShell({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [sideOpen, setSideOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [q, setQ] = useState('');
  const bellRef = useRef<HTMLDivElement>(null);
  const { db, user } = store;

  const seen = db.adminSeenAt ?? '';
  const newOrders = db.orders.filter(o => o.date > seen && o.total > 0).sort((a, b) => b.date.localeCompare(a.date));
  const newMessages = db.messages.filter(m => m.date > seen);
  const unread = newOrders.length + newMessages.length;

  const groups: { title: string; items: NavItem[] }[] = [
    { title: 'ภาพรวม', items: [
      { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
      { href: '/admin/finance', label: 'การเงิน', icon: Wallet }
    ] },
    { title: 'ร้านค้า', items: [
      { href: '/admin/games', label: 'จัดการเกม', icon: Gamepad2 },
      { href: '/admin/news', label: 'ข่าวสาร/อัปเดต', icon: Newspaper },
      { href: '/admin/coupons', label: 'คูปองส่วนลด', icon: Tag }
    ] },
    { title: 'ลูกค้า', items: [
      { href: '/admin/orders', label: 'คำสั่งซื้อ', icon: Receipt, badge: newOrders.length },
      { href: '/admin/users', label: 'ผู้ใช้', icon: Users },
      { href: '/admin/messages', label: 'ข้อความ', icon: Mail, badge: newMessages.length }
    ] }
  ];
  const all = groups.flatMap(g => g.items);
  const current = [...all].sort((a, b) => b.href.length - a.href.length).find(i => pathname === i.href || pathname.startsWith(i.href + '/')) ?? all[0];

  useEffect(() => setSideOpen(false), [pathname]);
  useEffect(() => {
    if (!bellOpen) return;
    const close = (e: MouseEvent) => { if (!bellRef.current?.contains(e.target as Node)) setBellOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [bellOpen]);

  const toggleBell = () => {
    // เปิดดูแล้วถือว่าอ่านแล้ว แต่ยังแสดงรายการเดิมจนกว่าจะปิด
    if (!bellOpen && unread) setTimeout(() => store.markAdminSeen(), 1500);
    setBellOpen(o => !o);
  };

  return (
    <div className="admin">
      <aside className={`a-side ${sideOpen ? 'open' : ''}`}>
        <div className="a-brand">
          <span className="a-brand-mark"><Gamepad2 size={20} /></span>
          <div>
            <b>GameVerse</b>
            <span>Admin Console</span>
          </div>
          <button className="a-side-close" onClick={() => setSideOpen(false)} aria-label="ปิดเมนู"><X size={18} /></button>
        </div>
        <nav className="a-nav">
          {groups.map(g => (
            <div key={g.title} className="a-nav-group">
              <div className="a-nav-title">{g.title}</div>
              {g.items.map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={item.href === current.href ? 'active' : ''}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge ? <em>{item.badge}</em> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="a-side-foot">
          <Link href="/"><Store size={18} /> <span>กลับไปหน้าร้านค้า</span></Link>
          <button onClick={() => { store.logout(); router.push('/'); }}><LogOut size={18} /> <span>ออกจากระบบ</span></button>
        </div>
      </aside>
      {sideOpen && <div className="a-scrim" onClick={() => setSideOpen(false)} />}

      <div className="a-main">
        <header className="a-top">
          <button className="a-icon-btn a-menu" onClick={() => setSideOpen(true)} aria-label="เปิดเมนู"><Menu size={20} /></button>
          <div className="a-crumb">
            <span>Admin</span><ChevronRight size={14} /><b>{current.label}</b>
          </div>
          <form
            className="a-search"
            onSubmit={e => { e.preventDefault(); if (q.trim()) router.push(`/admin/orders?q=${encodeURIComponent(q.trim())}`); }}
          >
            <Search size={16} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาเลขคำสั่งซื้อ / อีเมลลูกค้า" aria-label="ค้นหาคำสั่งซื้อ" />
          </form>
          <div className="a-top-right">
            <div className="a-bell" ref={bellRef}>
              <button className="a-icon-btn" onClick={toggleBell} aria-label={`การแจ้งเตือน ${unread} รายการ`}>
                <Bell size={19} />
                {unread > 0 && <span className="a-dot">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {bellOpen && (
                <div className="a-pop">
                  <div className="a-pop-head">การแจ้งเตือน</div>
                  {!newOrders.length && !newMessages.length && <p className="a-pop-empty">ไม่มีการแจ้งเตือนใหม่</p>}
                  {newOrders.slice(0, 6).map(o => (
                    <Link key={o.id} href={`/admin/orders?q=${o.id}`} className="a-pop-item" onClick={() => setBellOpen(false)}>
                      <span className="a-pop-icon sale"><Receipt size={14} /></span>
                      <span><b>คำสั่งซื้อใหม่ {baht(o.total)}</b><small>{o.user} · {fmtDateTime(o.date)}</small></span>
                    </Link>
                  ))}
                  {newMessages.slice(0, 4).map((m, i) => (
                    <Link key={i} href="/admin/messages" className="a-pop-item" onClick={() => setBellOpen(false)}>
                      <span className="a-pop-icon msg"><Mail size={14} /></span>
                      <span><b>{m.subject}</b><small>{m.user} · {fmtDateTime(m.date)}</small></span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="a-user">
              <span className="a-avatar">{user?.name.slice(0, 1)}</span>
              <span className="a-user-text"><b>{user?.name}</b><small>ผู้ดูแลระบบ</small></span>
            </div>
          </div>
        </header>
        <main className="a-content">{children}</main>
      </div>
    </div>
  );
}
