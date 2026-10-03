import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-rule" />
        <div className="footer-top">
          <div className="logo footer-logo"><Gamepad2 size={28} strokeWidth={1.5} /><span>GAMEVERSE</span></div>
          <p className="small">
            © 2026 GameVerse สงวนลิขสิทธิ์ เครื่องหมายการค้าทั้งหมดเป็นทรัพย์สินของเจ้าของในสหรัฐอเมริกาและประเทศอื่น ๆ
            <br />ราคาทั้งหมดรวมภาษีมูลค่าเพิ่มแล้ว (หากมี) · เว็บไซต์เดโม ไม่มีการชำระเงินจริง
          </p>
        </div>
        <div className="footer-rule" />
        <div className="footer-links">
          <Link href="/help">เกี่ยวกับ GameVerse</Link><span>|</span>
          <Link href="/news">ข่าวสาร</Link><span>|</span>
          <Link href="/store?sale=1">โปรโมชั่น</Link><span>|</span>
          <Link href="/store?free=1">เกมฟรี</Link><span>|</span>
          <Link href="/orders">ประวัติการสั่งซื้อ</Link><span>|</span>
          <Link href="/help">ช่วยเหลือ</Link><span>|</span>
          <Link href="/help#contact">ติดต่อเรา</Link>
        </div>
      </div>
    </footer>
  );
}
