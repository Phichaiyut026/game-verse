'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { safeNext } from '@/lib/utils';

function RegisterForm() {
  const store = useStore();
  const toast = useToast();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [f, setF] = useState({ name: '', email: '', pass: '', pass2: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('กรุณากรอกชื่อ', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return toast('รูปแบบอีเมลไม่ถูกต้อง', 'error');
    if (f.pass.length < 6) return toast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
    if (f.pass !== f.pass2) return toast('รหัสผ่านไม่ตรงกัน', 'error');
    const err = store.register(f.name, f.email, f.pass);
    if (err) return toast(err, 'error');
    router.push(next);
  };

  return (
    <div className="auth panel">
      <h1>สมัครสมาชิก</h1>
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="name">ชื่อที่แสดง</label><input id="name" required maxLength={30} value={f.name} onChange={set('name')} /></div>
        <div className="field"><label htmlFor="email">อีเมล</label><input id="email" type="email" required autoComplete="email" value={f.email} onChange={set('email')} /></div>
        <div className="field"><label htmlFor="pass">รหัสผ่าน (อย่างน้อย 6 ตัว)</label><input id="pass" type="password" required minLength={6} autoComplete="new-password" value={f.pass} onChange={set('pass')} /></div>
        <div className="field"><label htmlFor="pass2">ยืนยันรหัสผ่าน</label><input id="pass2" type="password" required autoComplete="new-password" value={f.pass2} onChange={set('pass2')} /></div>
        <button className="btn block">สมัครสมาชิก</button>
      </form>
      <p className="muted small" style={{ textAlign: 'center', marginTop: 16 }}>
        มีบัญชีแล้ว? <Link href="/login" style={{ color: 'var(--accent-2)' }}>เข้าสู่ระบบ</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
