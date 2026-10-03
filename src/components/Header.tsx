'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ChevronDown, Gamepad2, Menu, Search, ShoppingCart, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { GENRES } from '@/lib/utils';

function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [q, setQ] = useState('');

  useEffect(() => { setQ(pathname === '/store' ? params.get('q') ?? '' : ''); }, [pathname, params]);

  return (
    <form
      className="snav-search"
      onSubmit={e => {
        e.preventDefault();
        router.push('/store' + (q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''));
      }}
    >
      <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาในร้านค้า" aria-label="ค้นหาเกม" />
      <button type="submit" aria-label="ค้นหา"><Search size={16} /></button>
    </form>
  );
}

export function Header() {
  const store = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, isAdmin, ready } = store;
  const cartN = ready ? store.calcCart('').items.length : 0;
  const wishN = ready ? store.wishlist.length : 0;

  useEffect(() => setOpen(false), [pathname]);

  const isStore = pathname === '/' || pathname.startsWith('/store') || pathname.startsWith('/game') || pathname.startsWith('/cart') || pathname.startsWith('/wishlist');
  const top = [
    { href: '/', label: 'ร้านค้า', active: isStore },
    { href: '/news', label: 'ข่าวสาร', active: pathname.startsWith('/news') },
    ...(ready && user ? [{ href: '/library', label: 'คลังเกม', active: pathname.startsWith('/library') }] : []),
    { href: '/help', label: 'ช่วยเหลือ', active: pathname.startsWith('/help') },
    ...(ready && isAdmin ? [{ href: '/admin', label: 'แอดมิน', active: pathname.startsWith('/admin') }] : [])
  ];

  return (
    <>
      <header className="gheader">
        <div className="container gheader-inner">
          <button className="menu-btn" onClick={() => setOpen(o => !o)} aria-label="เมนู">{open ? <X size={22} /> : <Menu size={22} />}</button>
          <Link href="/" className="logo"><Gamepad2 size={34} strokeWidth={1.5} /><span>GAMEVERSE</span></Link>
          <nav className={`gnav ${open ? 'open' : ''}`}>
            {top.map(l => <Link key={l.href} href={l.href} className={l.active ? 'active' : ''}>{l.label}</Link>)}
            {ready && user && <Link href="/orders" className="only-mobile">ประวัติการสั่งซื้อ</Link>}
            {ready && user && <Link href="/profile" className="only-mobile">บัญชีของฉัน</Link>}
          </nav>
          <div className="gaction">
            {ready && user ? (
              <>
                <Link href="/profile" className="gaction-user">{user.name}</Link>
                <span className="sep">|</span>
                <button className="link" onClick={() => { store.logout(); router.push('/'); }}>ออกจากระบบ</button>
              </>
            ) : (
              <Link href="/login">เข้าสู่ระบบ</Link>
            )}
          </div>
        </div>
      </header>

      <div className="container">
        <div className="snav">
          <div className="snav-links">
            <Link href="/" className={pathname === '/' ? 'active' : ''}>ร้านค้าของคุณ</Link>
            <Link href="/store?sort=new">มาใหม่และน่าสนใจ</Link>
            <div className="snav-drop">
              <button type="button">หมวดหมู่ <ChevronDown size={14} /></button>
              <div className="snav-menu">
                {GENRES.map(g => <Link key={g} href={`/store?genre=${encodeURIComponent(g)}`}>{g}</Link>)}
              </div>
            </div>
            <Link href="/store?sale=1">ลดราคา</Link>
            <Link href="/store?free=1">เล่นฟรี</Link>
            <Link href="/wishlist" className={pathname === '/wishlist' ? 'active' : ''}>อยากได้ {wishN > 0 && `(${wishN})`}</Link>
          </div>
          <Suspense fallback={<div className="snav-search" />}><SearchBox /></Suspense>
          {cartN > 0 && (
            <Link href="/cart" className="cart-pill"><ShoppingCart size={14} /> ตะกร้า ({cartN})</Link>
          )}
        </div>
      </div>
    </>
  );
}
