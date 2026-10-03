'use client';

import Link from 'next/link';
import { Fragment, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Newspaper, Pencil, Pin, Plus, Receipt, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Game, GameIcon as IconKey, NewsCategory, NewsPost, Platform } from '@/lib/types';
import { baht, finalPrice, fmtDate, fmtDateTime, GENRES, METHOD_LABEL, NEWS_CATEGORY, PLATFORMS, safeColor, sortNews, uid } from '@/lib/utils';
import { splitSale } from '@/lib/finance';
import { CategoryPill, NewsCard } from '@/components/NewsCard';
import { ICONS, Thumb } from '@/components/GameVisuals';
import { confirmAction, EmptyState, Modal } from '@/components/ui';
import { useToast } from '@/components/Toast';

// ---------------- Games ----------------
const emptyGame = (): Game => ({
  id: uid('g'), title: '', genre: GENRES[0], platforms: ['PC'], price: 0, discount: 0, rating: 4, developer: '',
  release: new Date().toISOString().slice(0, 10), colors: ['#7c5cff', '#22d3ee'], icon: 'gamepad', featured: false, tags: [], desc: ''
});

function GameForm({ initial, onClose }: { initial: Game; onClose: () => void }) {
  const store = useStore();
  const toast = useToast();
  const isNew = !store.gameById(initial.id);
  const [g, setG] = useState(initial);
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [shotUrls, setShotUrls] = useState((initial.shots ?? []).map(s => s.full).join('\n'));
  const set = <K extends keyof Game>(k: K, v: Game[K]) => setG(prev => ({ ...prev, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!g.title.trim()) return toast('กรุณากรอกชื่อเกม', 'error');
    if (!g.platforms.length) return toast('เลือกแพลตฟอร์มอย่างน้อย 1 รายการ', 'error');
    store.upsertGame({
      ...g, title: g.title.trim(), developer: g.developer.trim() || '-',
      price: Math.max(0, g.price || 0), discount: Math.min(90, Math.max(0, g.discount || 0)),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean), desc: g.desc.trim(),
      image: g.image?.trim() || undefined,
      shots: shotUrls.split('\n').map(u => u.trim()).filter(u => /^https?:\/\//.test(u)).map(u => ({ thumb: u, full: u }))
    });
    toast(isNew ? 'เพิ่มเกมใหม่แล้ว' : 'บันทึกการแก้ไขแล้ว');
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <h2>{isNew ? 'เพิ่มเกมใหม่' : 'แก้ไขเกม'}</h2>
      <div className="field"><label>ชื่อเกม</label><input value={g.title} onChange={e => set('title', e.target.value)} /></div>
      <div className="row">
        <div className="field"><label>ประเภท</label>
          <select value={g.genre} onChange={e => set('genre', e.target.value)}>{GENRES.map(x => <option key={x}>{x}</option>)}</select>
        </div>
        <div className="field"><label>ผู้พัฒนา</label><input value={g.developer} onChange={e => set('developer', e.target.value)} /></div>
      </div>
      <div className="field"><label>แพลตฟอร์ม</label>
        <div className="row">
          {PLATFORMS.map(p => (
            <label key={p} className="check">
              <input type="checkbox" checked={g.platforms.includes(p)}
                onChange={e => set('platforms', (e.target.checked ? [...g.platforms, p] : g.platforms.filter(x => x !== p)) as Platform[])} /> {p}
            </label>
          ))}
        </div>
      </div>
      <div className="row">
        <div className="field"><label>ราคา (บาท)</label><input type="number" min={0} value={g.price} onChange={e => set('price', +e.target.value)} /></div>
        <div className="field"><label>ส่วนลด (%)</label><input type="number" min={0} max={90} value={g.discount} onChange={e => set('discount', +e.target.value)} /></div>
        <div className="field"><label>วันวางจำหน่าย</label><input type="date" value={g.release} onChange={e => set('release', e.target.value)} /></div>
      </div>
      <div className="row">
        <div className="field"><label>ไอคอน</label>
          <select value={g.icon} onChange={e => set('icon', e.target.value as IconKey)}>{Object.keys(ICONS).map(k => <option key={k}>{k}</option>)}</select>
        </div>
        <div className="field"><label>สีหลัก</label><input type="color" style={{ height: 44 }} value={safeColor(g.colors[0])} onChange={e => set('colors', [e.target.value, g.colors[1]])} /></div>
        <div className="field"><label>สีรอง</label><input type="color" style={{ height: 44 }} value={safeColor(g.colors[1])} onChange={e => set('colors', [g.colors[0], e.target.value])} /></div>
        <div className="field" style={{ flex: '0 0 auto', minWidth: 0 }}><label>ตัวอย่าง</label><Thumb game={g} size={44} /></div>
      </div>
      <div className="field">
        <label>รูปปก (URL รูปแนวนอน เช่น 460x215)</label>
        <input value={g.image ?? ''} placeholder="https://..." onChange={e => set('image', e.target.value)} />
      </div>
      <div className="field">
        <label>ภาพหน้าจอ (URL บรรทัดละ 1 รูป)</label>
        <textarea rows={3} value={shotUrls} placeholder={'https://...\nhttps://...'} onChange={e => setShotUrls(e.target.value)} />
      </div>
      <div className="field"><label>แท็ก (คั่นด้วย ,)</label><input value={tags} onChange={e => setTags(e.target.value)} /></div>
      <div className="field"><label>คำอธิบาย</label><textarea rows={3} value={g.desc} onChange={e => set('desc', e.target.value)} /></div>
      <label className="check"><input type="checkbox" checked={g.featured} onChange={e => set('featured', e.target.checked)} /> แสดงในแบนเนอร์หน้าแรก</label>
      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="btn ghost" onClick={onClose}>ยกเลิก</button>
        <button className="btn">บันทึก</button>
      </div>
    </form>
  );
}

export function GamesAdmin() {
  const store = useStore();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Game | null>(null);
  const list = store.db.games.filter(g => g.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="toolbar">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาเกม..." style={{ maxWidth: 300 }} />
        <button className="btn" onClick={() => setEditing(emptyGame())}><Plus size={16} /> เพิ่มเกมใหม่</button>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead><tr><th /><th>ชื่อเกม</th><th>ประเภท</th><th>ราคา</th><th>ส่วนลด</th><th>ราคาขาย</th><th>แนะนำ</th><th /></tr></thead>
          <tbody>
            {list.map(g => (
              <tr key={g.id}>
                <td><Thumb game={g} size={40} /></td>
                <td><Link href={`/game/${g.id}`}>{g.title}</Link></td>
                <td>{g.genre}</td><td>{baht(g.price)}</td><td>{g.discount}%</td><td>{baht(finalPrice(g))}</td>
                <td>{g.featured ? 'ใช่' : '-'}</td>
                <td>
                  <button className="btn ghost sm" onClick={() => setEditing(g)}>แก้ไข</button>{' '}
                  <button className="btn danger sm" onClick={() => { if (confirmAction(`ลบเกม "${g.title}"?`)) { store.deleteGame(g.id); toast('ลบเกมแล้ว'); } }}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)}>
        {editing && <GameForm key={editing.id} initial={editing} onClose={() => setEditing(null)} />}
      </Modal>
    </>
  );
}

// ---------------- News ----------------
const emptyPost = (author: string): NewsPost => ({
  id: uid('n'), title: '', category: 'update', gameId: null, summary: '', body: '', author,
  date: new Date().toISOString(), pinned: false, published: false, views: 0
});

function NewsForm({ initial, onClose }: { initial: NewsPost; onClose: () => void }) {
  const store = useStore();
  const toast = useToast();
  const isNew = !store.db.news.some(n => n.id === initial.id);
  const [p, setP] = useState(initial);
  const set = <K extends keyof NewsPost>(k: K, v: NewsPost[K]) => setP(prev => ({ ...prev, [k]: v }));

  const save = (publish: boolean) => {
    if (!p.title.trim()) return toast('กรุณากรอกหัวข้อข่าว', 'error');
    if (!p.summary.trim()) return toast('กรุณากรอกสรุปสั้น ๆ', 'error');
    if (!p.body.trim()) return toast('กรุณากรอกเนื้อหาข่าว', 'error');
    // ข่าวที่เพิ่งเผยแพร่ครั้งแรกใช้เวลาปัจจุบันเป็นวันที่ลงข่าว
    const date = publish && !initial.published ? new Date().toISOString() : p.date;
    store.upsertNews({ ...p, title: p.title.trim(), summary: p.summary.trim(), body: p.body.trim(), published: publish, date });
    toast(publish ? 'เผยแพร่ข่าวแล้ว' : 'บันทึกฉบับร่างแล้ว');
    onClose();
  };

  return (
    <form onSubmit={e => { e.preventDefault(); save(true); }}>
      <h2>{isNew ? 'เขียนข่าวใหม่' : 'แก้ไขข่าว'}</h2>
      <div className="field"><label>หัวข้อ</label><input value={p.title} maxLength={120} onChange={e => set('title', e.target.value)} placeholder="เช่น แพตช์ 1.3 เพิ่มโหมดใหม่" /></div>
      <div className="row">
        <div className="field"><label>หมวดหมู่</label>
          <select value={p.category} onChange={e => set('category', e.target.value as NewsCategory)}>
            {(Object.keys(NEWS_CATEGORY) as NewsCategory[]).map(k => <option key={k} value={k}>{NEWS_CATEGORY[k]}</option>)}
          </select>
        </div>
        <div className="field"><label>เกมที่เกี่ยวข้อง</label>
          <select value={p.gameId ?? ''} onChange={e => set('gameId', e.target.value || null)}>
            <option value="">ไม่ระบุ (ข่าวทั่วไป)</option>
            {store.db.games.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label>สรุปสั้น ๆ (แสดงบนการ์ด)</label><input value={p.summary} maxLength={200} onChange={e => set('summary', e.target.value)} /></div>
      <div className="field">
        <label>เนื้อหา (เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่)</label>
        <textarea rows={8} value={p.body} onChange={e => set('body', e.target.value)} />
      </div>
      <label className="check"><input type="checkbox" checked={p.pinned} onChange={e => set('pinned', e.target.checked)} /> ปักหมุดไว้บนสุด</label>
      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="btn ghost" onClick={onClose}>ยกเลิก</button>
        <button type="button" className="btn ghost" onClick={() => save(false)}>บันทึกฉบับร่าง</button>
        <button className="btn">{p.published ? 'บันทึกและเผยแพร่' : 'เผยแพร่'}</button>
      </div>
    </form>
  );
}

export function NewsAdmin() {
  const store = useStore();
  const toast = useToast();
  const router = useRouter();
  const editId = useSearchParams().get('edit');
  const [editing, setEditing] = useState<NewsPost | null>(() => store.db.news.find(n => n.id === editId) ?? null);
  const [cat, setCat] = useState<NewsCategory | ''>('');
  const [status, setStatus] = useState<'' | 'published' | 'draft'>('');
  const all = store.db.news;
  const list = sortNews(all.filter(n =>
    (!cat || n.category === cat) &&
    (!status || (status === 'published') === n.published)));
  const totalViews = all.reduce((s, n) => s + n.views, 0);
  const latest = sortNews(all.filter(n => n.published)).slice(0, 3);

  const close = () => {
    setEditing(null);
    if (editId) router.replace('/admin/news');
  };

  return (
    <>
      <div className="stats">
        <div className="stat"><div className="muted small">ข่าวทั้งหมด</div><div className="v">{all.length}</div></div>
        <div className="stat"><div className="muted small">เผยแพร่แล้ว</div><div className="v">{all.filter(n => n.published).length}</div></div>
        <div className="stat"><div className="muted small">ฉบับร่าง</div><div className="v">{all.filter(n => !n.published).length}</div></div>
        <div className="stat"><div className="muted small">ยอดเข้าชมรวม</div><div className="v">{totalViews.toLocaleString('th-TH')}</div></div>
      </div>

      <div className="toolbar">
        <div className="row" style={{ flex: '1 1 auto' }}>
          <select value={cat} onChange={e => setCat(e.target.value as NewsCategory | '')} style={{ maxWidth: 200 }}>
            <option value="">ทุกหมวดหมู่</option>
            {(Object.keys(NEWS_CATEGORY) as NewsCategory[]).map(k => <option key={k} value={k}>{NEWS_CATEGORY[k]}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as '' | 'published' | 'draft')} style={{ maxWidth: 200 }}>
            <option value="">ทุกสถานะ</option><option value="published">เผยแพร่แล้ว</option><option value="draft">ฉบับร่าง</option>
          </select>
        </div>
        <button className="btn" onClick={() => setEditing(emptyPost(store.user?.name ?? 'ทีมงาน'))}><Plus size={16} /> เขียนข่าวใหม่</button>
      </div>

      {list.length ? (
        <div className="panel table-wrap">
          <table>
            <thead><tr><th>หัวข้อ</th><th>หมวดหมู่</th><th>เกม</th><th>วันที่</th><th>เข้าชม</th><th>สถานะ</th><th /></tr></thead>
            <tbody>
              {list.map(n => (
                <tr key={n.id}>
                  <td style={{ whiteSpace: 'normal', minWidth: 220 }}>
                    {n.pinned && <Pin size={14} className="pin-icon" />} <Link href={`/news/${n.id}`}>{n.title}</Link>
                  </td>
                  <td><CategoryPill category={n.category} /></td>
                  <td>{n.gameId ? store.gameById(n.gameId)?.title ?? '-' : '-'}</td>
                  <td>{fmtDate(n.date)}</td>
                  <td>{n.views.toLocaleString('th-TH')}</td>
                  <td>{n.published ? <span className="status paid">เผยแพร่</span> : <span className="status draft">ฉบับร่าง</span>}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn ghost sm" title={n.pinned ? 'เลิกปักหมุด' : 'ปักหมุด'} aria-label={n.pinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
                        onClick={() => { store.patchNews(n.id, { pinned: !n.pinned }); toast(n.pinned ? 'เลิกปักหมุดแล้ว' : 'ปักหมุดแล้ว'); }}>
                        <Pin size={14} fill={n.pinned ? 'currentColor' : 'none'} />
                      </button>
                      <button className="btn ghost sm" title={n.published ? 'ซ่อน' : 'เผยแพร่'} aria-label={n.published ? 'ซ่อน' : 'เผยแพร่'}
                        onClick={() => {
                          store.patchNews(n.id, n.published ? { published: false } : { published: true, date: new Date().toISOString() });
                          toast(n.published ? 'ซ่อนข่าวแล้ว' : 'เผยแพร่ข่าวแล้ว');
                        }}>
                        {n.published ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button className="btn ghost sm" aria-label="แก้ไข" onClick={() => setEditing(n)}><Pencil size={14} /></button>
                      <button className="btn danger sm" aria-label="ลบ"
                        onClick={() => { if (confirmAction(`ลบข่าว "${n.title}"?`)) { store.deleteNews(n.id); toast('ลบข่าวแล้ว'); } }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon={Newspaper} title="ไม่มีข่าวที่ตรงกับตัวกรอง" />}

      {latest.length > 0 && (
        <section className="section" style={{ marginTop: 24 }}>
          <h3>ตัวอย่างที่ลูกค้าเห็น (3 ข่าวล่าสุด)</h3>
          <div className="news-grid">{latest.map(n => <NewsCard key={n.id} post={n} />)}</div>
        </section>
      )}

      <Modal open={!!editing} onClose={close}>
        {editing && <NewsForm key={editing.id} initial={editing} onClose={close} />}
      </Modal>
    </>
  );
}

// ---------------- Orders ----------------
export function OrdersAdmin() {
  const store = useStore();
  const toast = useToast();
  const params = useSearchParams();
  const router = useRouter();
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const [status, setStatus] = useState<'' | 'paid' | 'refunded'>('');
  const [open, setOpen] = useState<string | null>(null);
  const list = [...store.db.orders]
    .filter(o => (!q || o.id.toLowerCase().includes(q) || o.user.toLowerCase().includes(q)) && (!status || o.status === status))
    .sort((a, b) => b.date.localeCompare(a.date));
  const nameOf = (email: string) => store.db.users.find(u => u.email === email)?.name ?? email;

  return (
    <>
      <div className="toolbar">
        <div className="row" style={{ flex: '1 1 auto' }}>
          <input
            defaultValue={params.get('q') ?? ''} key={q} placeholder="ค้นหาเลขคำสั่งซื้อหรืออีเมล" style={{ maxWidth: 320 }}
            onKeyDown={e => { if (e.key === 'Enter') router.replace(`/admin/orders?q=${encodeURIComponent((e.target as HTMLInputElement).value.trim())}`); }}
          />
          <select value={status} onChange={e => setStatus(e.target.value as '' | 'paid' | 'refunded')} style={{ maxWidth: 180 }}>
            <option value="">ทุกสถานะ</option><option value="paid">ชำระแล้ว</option><option value="refunded">คืนเงินแล้ว</option>
          </select>
        </div>
        {q && <button className="btn ghost sm" onClick={() => router.replace('/admin/orders')}>ล้างการค้นหา</button>}
      </div>
      {!list.length ? <EmptyState icon={Receipt} title={q ? `ไม่พบคำสั่งซื้อที่ตรงกับ "${q}"` : 'ยังไม่มีคำสั่งซื้อ'} /> : (
        <div className="panel table-wrap">
          <table>
            <thead><tr><th>เลขที่</th><th>ลูกค้า</th><th>วันที่</th><th>รายการ</th><th>ช่องทาง</th><th className="num">ยอดรวม</th><th>สถานะ</th><th /></tr></thead>
            <tbody>
              {list.map(o => {
                const f = splitSale(o.total, o.method);
                return (
                  <Fragment key={o.id}>
                    <tr className={open === o.id ? 'is-open' : ''}>
                      <td><button className="a-link-btn" onClick={() => setOpen(open === o.id ? null : o.id)}>{o.id}</button></td>
                      <td><div>{nameOf(o.user)}</div><small className="a-muted">{o.user}</small></td>
                      <td>{fmtDateTime(o.date)}</td>
                      <td>{o.items.length} เกม</td>
                      <td>{METHOD_LABEL[o.method]}</td>
                      <td className="num">{baht(o.total)}</td>
                      <td><span className={`status ${o.status}`}>{o.status === 'paid' ? 'ชำระแล้ว' : 'คืนเงินแล้ว'}</span></td>
                      <td>
                        {o.status === 'paid' && o.total > 0 && (
                          <button className="btn danger sm" onClick={() => {
                            if (confirmAction(`คืนเงินคำสั่งซื้อ ${o.id} จำนวน ${baht(o.total)}? เกมจะถูกนำออกจากคลังของลูกค้า`)) { store.refundOrder(o.id); toast('คืนเงินเรียบร้อย'); }
                          }}>คืนเงิน</button>
                        )}
                      </td>
                    </tr>
                    {open === o.id && (
                      <tr className="a-detail-row">
                        <td colSpan={8}>
                          <div className="a-order-detail">
                            <div>
                              <h4>รายการสินค้า</h4>
                              {o.items.map(i => <div key={i.key} className="sum-row"><span>{i.title} <span className="key">{i.key}</span></span><span>{baht(i.price)}</span></div>)}
                              {o.discount > 0 && <div className="sum-row"><span>คูปอง {o.coupon}</span><span>-{baht(o.discount)}</span></div>}
                            </div>
                            <div>
                              <h4>การแบ่งรายได้</h4>
                              <div className="sum-row"><span>ยอดชำระ (รวม VAT)</span><span>{baht(o.total)}</span></div>
                              <div className="sum-row"><span>VAT 7%</span><span>-{baht(f.vat)}</span></div>
                              <div className="sum-row"><span>ค่าธรรมเนียม {METHOD_LABEL[o.method]}</span><span>-{baht(f.fee)}</span></div>
                              <div className="sum-row"><span>ส่วนแบ่งผู้พัฒนา 70%</span><span>-{baht(f.devShare)}</span></div>
                              <div className="sum-row total"><span>กำไรสุทธิของร้าน</span><span>{baht(f.net)}</span></div>
                              {o.status === 'refunded' && <p className="a-muted small">คืนเงินเมื่อ {o.refundedAt ? fmtDateTime(o.refundedAt) : '-'} · ค่าธรรมเนียม gateway ไม่ได้รับคืน</p>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ---------------- Users ----------------
export function UsersAdmin() {
  const store = useStore();
  const toast = useToast();
  return (
    <div className="panel table-wrap">
      <table>
        <thead><tr><th>ชื่อ</th><th>อีเมล</th><th>บทบาท</th><th>เกมในคลัง</th><th>สมัครเมื่อ</th><th /></tr></thead>
        <tbody>
          {store.db.users.map(u => (
            <tr key={u.email}>
              <td>{u.name}</td><td>{u.email}</td><td>{u.role === 'admin' ? 'แอดมิน' : 'ผู้ใช้'}</td>
              <td>{store.ownedIds(u.email).size}</td><td>{fmtDate(u.created)}</td>
              <td>
                {u.email === store.user?.email ? <span className="muted small">(คุณ)</span> : (
                  <>
                    <button className="btn ghost sm" onClick={() => { store.toggleRole(u.email); toast('เปลี่ยนบทบาทแล้ว'); }}>
                      {u.role === 'admin' ? 'ลดเป็นผู้ใช้' : 'ตั้งเป็นแอดมิน'}
                    </button>{' '}
                    <button className="btn danger sm" onClick={() => { if (confirmAction(`ลบผู้ใช้ ${u.email}?`)) { store.deleteUser(u.email); toast('ลบผู้ใช้แล้ว'); } }}>ลบ</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- Coupons ----------------
export function CouponsAdmin() {
  const store = useStore();
  const toast = useToast();
  const [f, setF] = useState({ code: '', type: 'percent' as 'percent' | 'fixed', value: '', min: '0' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = f.code.trim().toUpperCase().replace(/\s/g, '');
    const value = Number(f.value);
    if (!code) return toast('กรุณากรอกโค้ด', 'error');
    if (store.db.coupons.some(c => c.code === code)) return toast('มีโค้ดนี้อยู่แล้ว', 'error');
    if (!(value > 0) || (f.type === 'percent' && value > 100)) return toast('มูลค่าไม่ถูกต้อง', 'error');
    store.addCoupon({ code, type: f.type, value, minTotal: Number(f.min) || 0, active: true });
    toast('สร้างคูปองแล้ว');
    setF({ code: '', type: 'percent', value: '', min: '0' });
  };

  return (
    <>
      <form className="panel" style={{ marginBottom: 16 }} onSubmit={submit}>
        <h3>สร้างคูปองใหม่</h3>
        <div className="row">
          <div className="field"><label>โค้ด</label><input value={f.code} placeholder="SUMMER25" style={{ textTransform: 'uppercase' }} onChange={e => setF({ ...f, code: e.target.value })} /></div>
          <div className="field"><label>ประเภท</label>
            <select value={f.type} onChange={e => setF({ ...f, type: e.target.value as 'percent' | 'fixed' })}>
              <option value="percent">เปอร์เซ็นต์ (%)</option><option value="fixed">จำนวนเงิน (บาท)</option>
            </select>
          </div>
          <div className="field"><label>มูลค่า</label><input type="number" min={1} value={f.value} onChange={e => setF({ ...f, value: e.target.value })} /></div>
          <div className="field"><label>ยอดขั้นต่ำ</label><input type="number" min={0} value={f.min} onChange={e => setF({ ...f, min: e.target.value })} /></div>
        </div>
        <button className="btn">สร้างคูปอง</button>
      </form>
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>โค้ด</th><th>ส่วนลด</th><th>ยอดขั้นต่ำ</th><th>ใช้ไปแล้ว</th><th>สถานะ</th><th /></tr></thead>
          <tbody>
            {store.db.coupons.map(c => (
              <tr key={c.code}>
                <td><span className="key">{c.code}</span></td>
                <td>{c.type === 'percent' ? `${c.value}%` : baht(c.value)}</td>
                <td>{baht(c.minTotal)}</td>
                <td>{store.db.orders.filter(o => o.coupon === c.code).length} ครั้ง</td>
                <td>{c.active ? <span className="status paid">ใช้งาน</span> : <span className="status refunded">ปิด</span>}</td>
                <td>
                  <button className="btn ghost sm" onClick={() => store.toggleCoupon(c.code)}>{c.active ? 'ปิด' : 'เปิด'}</button>{' '}
                  <button className="btn danger sm" onClick={() => { if (confirmAction(`ลบคูปอง ${c.code}?`)) store.deleteCoupon(c.code); }}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------------- Messages ----------------
export function MessagesAdmin() {
  const { db } = useStore();
  const list = [...db.messages].reverse();
  const subs = [...db.subscribers].reverse();
  return (
    <>
      {list.length ? list.map((m, i) => (
        <div key={i} className="panel a-message">
          <div className="review-head"><b>{m.subject}</b><span className="muted small">{m.user} · {fmtDateTime(m.date)}</span></div>
          <p style={{ margin: '8px 0 0' }}>{m.text}</p>
        </div>
      )) : <EmptyState icon={Mail} title="ยังไม่มีข้อความจากลูกค้า" />}

      <h2 className="a-sub-title">ผู้สมัครรับข่าวสาร ({subs.length})</h2>
      {subs.length ? (
        <div className="panel table-wrap">
          <table>
            <thead><tr><th>อีเมล</th><th>สมัครเมื่อ</th></tr></thead>
            <tbody>{subs.map(sub => <tr key={sub.email}><td>{sub.email}</td><td>{fmtDateTime(sub.date)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <p className="a-muted">ยังไม่มีผู้สมัครรับข่าวสารจากหน้าแรก</p>}
    </>
  );
}
