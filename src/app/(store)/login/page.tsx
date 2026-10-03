'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { safeNext } from '@/lib/utils';

function LoginForm() {
  const store = useStore();
  const toast = useToast();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  return (
    <div className="auth panel">
      <h1>เข้าสู่ระบบ</h1>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (!store.login(email, pass)) return toast('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
          router.push(next);
        }}
      >
        <div className="field"><label htmlFor="email">อีเมล</label><input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="pass">รหัสผ่าน</label><input id="pass" type="password" required autoComplete="current-password" value={pass} onChange={e => setPass(e.target.value)} /></div>
        <button className="btn block">เข้าสู่ระบบ</button>
      </form>
      <p className="muted small" style={{ textAlign: 'center', marginTop: 16 }}>
        ยังไม่มีบัญชี? <Link href={`/register?next=${encodeURIComponent(next)}`} style={{ color: 'var(--accent-2)' }}>สมัครสมาชิก</Link>
      </p>
      <p className="muted small" style={{ textAlign: 'center' }}>บัญชีทดลองดูได้ในไฟล์ README.md</p>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
