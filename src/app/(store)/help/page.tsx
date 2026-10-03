'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useToast } from '@/components/Toast';

const FAQS = [
  ['ซื้อเกมแล้วจะได้รับคีย์อย่างไร?', 'หลังชำระเงินสำเร็จ คีย์จะแสดงทันทีในหน้ายืนยันคำสั่งซื้อและในเมนู "คลังเกม"'],
  ['รองรับการชำระเงินช่องทางไหนบ้าง?', 'บัตรเครดิต/เดบิต, พร้อมเพย์ และ TrueMoney Wallet'],
  ['ขอคืนเงินได้ไหม?', 'สามารถขอคืนเงินได้ภายใน 14 วันหากยังไม่ได้เปิดใช้คีย์ โดยติดต่อทีมงาน'],
  ['ใช้โค้ดส่วนลดอย่างไร?', 'กรอกโค้ดในหน้าตะกร้าสินค้าแล้วกด "ใช้" ระบบจะคำนวณส่วนลดให้อัตโนมัติ'],
  ['เกมที่ซื้อเล่นได้กี่เครื่อง?', 'ขึ้นอยู่กับเงื่อนไขของแต่ละแพลตฟอร์ม โดยทั่วไปผูกกับบัญชีของแพลตฟอร์มนั้น ๆ']
];

export default function HelpPage() {
  const store = useStore();
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');

  return (
    <>
      <h1>ศูนย์ช่วยเหลือ</h1>
      <div className="faq">
        {FAQS.map(([q, a]) => <details key={q}><summary>{q}</summary><p className="muted">{a}</p></details>)}
      </div>
      <form
        id="contact" className="panel" style={{ maxWidth: 600, marginTop: 24 }}
        onSubmit={e => {
          e.preventDefault();
          if (!subject.trim() || !text.trim()) return toast('กรุณากรอกหัวข้อและข้อความ', 'error');
          store.sendMessage(subject.trim(), text.trim());
          toast('ส่งข้อความแล้ว ทีมงานจะติดต่อกลับเร็ว ๆ นี้');
          setSubject(''); setText('');
        }}
      >
        <h3>ติดต่อเรา</h3>
        <div className="field"><label htmlFor="subj">หัวข้อ</label><input id="subj" value={subject} onChange={e => setSubject(e.target.value)} /></div>
        <div className="field"><label htmlFor="msg">ข้อความ</label><textarea id="msg" rows={4} value={text} onChange={e => setText(e.target.value)} /></div>
        <button className="btn">ส่งข้อความ</button>
      </form>
    </>
  );
}
