'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, Library, Receipt } from 'lucide-react';
import { useStore } from '@/lib/store';
import { baht, fmtDate } from '@/lib/utils';
import { Guard } from '@/components/ui';
import { useToast } from '@/components/Toast';

function Profile() {
  const store = useStore();
  const toast = useToast();
  const user = store.user!;
  const [name, setName] = useState(user.name);
  const [oldP, setOldP] = useState('');
  const [newP, setNewP] = useState('');
  const paid = store.db.orders.filter(o => o.user === user.email && o.status === 'paid');
  const spent = paid.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <h1>บัญชีของฉัน</h1>
      <div className="stats">
        <div className="stat"><div className="muted small">เกมในคลัง</div><div className="v">{store.owned.size}</div></div>
        <div className="stat"><div className="muted small">คำสั่งซื้อ</div><div className="v">{paid.length}</div></div>
        <div className="stat"><div className="muted small">ยอดใช้จ่ายรวม</div><div className="v">{baht(spent)}</div></div>
        <div className="stat"><div className="muted small">สมาชิกตั้งแต่</div><div className="v" style={{ fontSize: 18 }}>{fmtDate(user.created)}</div></div>
      </div>
      <div className="row" style={{ marginBottom: 20 }}>
        <Link className="btn ghost" href="/library"><Library size={16} /> คลังเกม</Link>
        <Link className="btn ghost" href="/orders"><Receipt size={16} /> ประวัติการสั่งซื้อ</Link>
        <Link className="btn ghost" href="/wishlist"><Heart size={16} /> อยากได้</Link>
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <form
          className="panel"
          onSubmit={e => {
            e.preventDefault();
            if (!name.trim()) return toast('กรุณากรอกชื่อ', 'error');
            store.updateProfile(name.trim());
            toast('บันทึกแล้ว');
          }}
        >
          <h3>ข้อมูลส่วนตัว</h3>
          <div className="field"><label>อีเมล</label><input value={user.email} disabled /></div>
          <div className="field"><label htmlFor="pName">ชื่อที่แสดง</label><input id="pName" value={name} maxLength={30} onChange={e => setName(e.target.value)} /></div>
          <button className="btn">บันทึก</button>
        </form>
        <form
          className="panel"
          onSubmit={e => {
            e.preventDefault();
            if (newP.length < 6) return toast('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัว', 'error');
            const err = store.changePassword(oldP, newP);
            if (err) return toast(err, 'error');
            toast('เปลี่ยนรหัสผ่านสำเร็จ');
            setOldP(''); setNewP('');
          }}
        >
          <h3>เปลี่ยนรหัสผ่าน</h3>
          <div className="field"><label htmlFor="oldP">รหัสผ่านปัจจุบัน</label><input id="oldP" type="password" autoComplete="current-password" value={oldP} onChange={e => setOldP(e.target.value)} /></div>
          <div className="field"><label htmlFor="newP">รหัสผ่านใหม่</label><input id="newP" type="password" autoComplete="new-password" value={newP} onChange={e => setNewP(e.target.value)} /></div>
          <button className="btn">เปลี่ยนรหัสผ่าน</button>
        </form>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return <Guard><Profile /></Guard>;
}
