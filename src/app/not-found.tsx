import Link from 'next/link';
import { Ghost } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <>
    <Header />
    <main className="container page">
    <div className="empty">
      <Ghost size={56} strokeWidth={1.25} className="empty-icon" />
      <h2>ไม่พบหน้าที่คุณต้องการ</h2>
      <Link href="/" className="btn">กลับหน้าแรก</Link>
    </div>
    </main>
    <Footer />
    </>
  );
}
