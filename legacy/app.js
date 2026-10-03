/* GameVerse — ร้านขายเกมแบบ Single Page App (เก็บข้อมูลใน localStorage) */

// ================= Storage =================
const DB = {
  get(key, fallback) {
    try { const v = localStorage.getItem('gs_' + key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('gs_' + key, JSON.stringify(value)); } catch { /* storage full / blocked */ }
  }
};

// แฮชรหัสผ่านแบบง่าย (cyrb53) — เพียงพอสำหรับเดโม ไม่ใช่ความปลอดภัยระดับโปรดักชัน
function hash(str, seed = 7) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function seed() {
  if (!DB.get('games')) DB.set('games', SEED_GAMES);
  if (!DB.get('coupons')) DB.set('coupons', SEED_COUPONS);
  if (!DB.get('reviews')) DB.set('reviews', SEED_REVIEWS);
  if (!DB.get('orders')) DB.set('orders', []);
  if (!DB.get('users')) {
    DB.set('users', SEED_USERS.map(u => ({
      email: u.email, name: u.name, role: u.role, pass: hash(u.password),
      wishlist: [], created: new Date().toISOString()
    })));
  }
}

// ================= Helpers =================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const app = $('#app');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const safeColor = c => /^#[0-9a-f]{3,8}$/i.test(c) ? c : '#444';
const baht = n => '฿' + Number(n).toLocaleString('th-TH');
const finalPrice = g => Math.round(g.price * (1 - (g.discount || 0) / 100));
const fmtDate = d => new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtDateTime = d => new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const gradient = g => `linear-gradient(135deg, ${safeColor(g.colors?.[0])}, ${safeColor(g.colors?.[1])})`;

const GENRE_ICONS = { 'แอ็กชัน': '💥', 'RPG': '🗡️', 'แข่งรถ': '🏁', 'จำลองสถานการณ์': '🏗️', 'วางแผน': '♟️', 'สยองขวัญ': '🩸', 'กีฬา': '🏆', 'แพลตฟอร์ม': '🍄', 'ผจญภัย': '🧭', 'ปาร์ตี้': '🎉', 'ปริศนา': '🧩', 'ยิง': '🎯' };
const PLATFORMS = ['PC', 'PS5', 'Xbox', 'Switch'];

function toast(msg, isErr = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = msg;
  $('#toasts').append(el);
  setTimeout(() => el.remove(), 3000);
}

function openModal(html) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-box">${html}</div>`;
  m.classList.remove('hidden');
  m.onclick = e => { if (e.target === m) closeModal(); };
}
function closeModal() { $('#modal').classList.add('hidden'); $('#modal').innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function confirmBox(msg, onYes) {
  openModal(`<h3>${esc(msg)}</h3><div class="row" style="margin-top:20px">
    <button class="btn ghost" id="cNo">ยกเลิก</button><button class="btn danger" id="cYes">ยืนยัน</button></div>`);
  $('#cNo').onclick = closeModal;
  $('#cYes').onclick = () => { closeModal(); onYes(); };
}

// ================= Data access =================
const games = () => DB.get('games', []);
const gameById = id => games().find(g => g.id === id);
const users = () => DB.get('users', []);
const orders = () => DB.get('orders', []);
const reviews = () => DB.get('reviews', []);
const coupons = () => DB.get('coupons', []);

function currentUser() {
  const email = DB.get('session', null);
  return email ? users().find(u => u.email === email) || null : null;
}
function saveUser(user) {
  DB.set('users', users().map(u => u.email === user.email ? user : u));
}
const isAdmin = () => currentUser()?.role === 'admin';

function ownedIds(email = currentUser()?.email) {
  if (!email) return new Set();
  const ids = new Set();
  orders().filter(o => o.user === email && o.status === 'paid').forEach(o => o.items.forEach(i => ids.add(i.id)));
  return ids;
}

// ---- cart ----
const cart = () => DB.get('cart', []);
function addToCart(id) {
  const g = gameById(id);
  if (!g) return;
  if (ownedIds().has(id)) return toast('คุณมีเกมนี้ในคลังแล้ว', true);
  const c = cart();
  if (c.includes(id)) return toast('เกมนี้อยู่ในตะกร้าแล้ว');
  c.push(id); DB.set('cart', c);
  toast(`เพิ่ม "${g.title}" ลงตะกร้าแล้ว`);
  renderNav();
}
function removeFromCart(id) { DB.set('cart', cart().filter(x => x !== id)); renderNav(); }

// ---- wishlist ----
function wishlist() {
  const u = currentUser();
  return u ? u.wishlist || [] : DB.get('guestWish', []);
}
function toggleWish(id) {
  const u = currentUser();
  let list = wishlist();
  const had = list.includes(id);
  list = had ? list.filter(x => x !== id) : [...list, id];
  if (u) { u.wishlist = list; saveUser(u); } else DB.set('guestWish', list);
  toast(had ? 'นำออกจากรายการที่อยากได้แล้ว' : 'เพิ่มในรายการที่อยากได้แล้ว ❤️');
  renderNav();
  return !had;
}

function pushRecent(id) {
  const r = DB.get('recent', []).filter(x => x !== id);
  r.unshift(id); DB.set('recent', r.slice(0, 6));
}

function genKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () => Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part()}-${part()}-${part()}`;
}

function avgRating(gameId) {
  const g = gameById(gameId);
  const rs = reviews().filter(r => r.gameId === gameId);
  if (!rs.length) return { avg: g?.rating || 0, count: 0 };
  return { avg: rs.reduce((s, r) => s + r.rating, 0) / rs.length, count: rs.length };
}

// ================= Components =================
function priceHtml(g) {
  if (g.price === 0) return `<div class="price"><span class="free">ฟรี</span></div>`;
  if (g.discount) return `<div class="price"><span class="now">${baht(finalPrice(g))}</span><span class="old">${baht(g.price)}</span></div>`;
  return `<div class="price"><span class="now">${baht(g.price)}</span></div>`;
}

function gameCard(g) {
  const wished = wishlist().includes(g.id);
  const owned = ownedIds().has(g.id);
  const { avg } = avgRating(g.id);
  return `<div class="card">
    <a href="#/game/${g.id}" class="cover" style="background:${gradient(g)}">
      <span>${esc(g.icon)}</span>
      ${g.discount ? `<span class="disc">-${g.discount}%</span>` : ''}
      <span class="title-on">${esc(g.title)}</span>
      <button class="wish ${wished ? 'on' : ''}" data-wish="${g.id}" aria-label="อยากได้">${wished ? '♥' : '♡'}</button>
    </a>
    <div class="card-body">
      <div class="card-meta"><span>${esc(g.genre)}</span><span class="stars">★ ${avg.toFixed(1)}</span></div>
      <div class="card-meta"><span>${g.platforms.map(esc).join(' · ')}</span></div>
      ${priceHtml(g)}
      ${owned ? `<a class="btn ghost sm" href="#/library">✔ อยู่ในคลังแล้ว</a>`
              : g.price === 0 ? `<button class="btn good sm" data-claim="${g.id}">รับฟรี</button>`
              : `<button class="btn sm" data-cart="${g.id}">🛒 ใส่ตะกร้า</button>`}
    </div>
  </div>`;
}

// event delegation สำหรับปุ่มในการ์ด
app.addEventListener('click', e => {
  const wish = e.target.closest('[data-wish]');
  if (wish) {
    e.preventDefault(); e.stopPropagation();
    const on = toggleWish(wish.dataset.wish);
    wish.classList.toggle('on', on); wish.textContent = on ? '♥' : '♡';
    if (route().path === 'wishlist') render();
    return;
  }
  const c = e.target.closest('[data-cart]');
  if (c) { addToCart(c.dataset.cart); return; }
  const claim = e.target.closest('[data-claim]');
  if (claim) claimFree(claim.dataset.claim);
});

function claimFree(id) {
  const u = currentUser();
  if (!u) { toast('กรุณาเข้าสู่ระบบก่อน', true); return go('login?next=' + encodeURIComponent('game/' + id)); }
  const g = gameById(id);
  const o = { id: uid('ORD-').toUpperCase(), user: u.email, date: new Date().toISOString(), status: 'paid',
    items: [{ id: g.id, title: g.title, price: 0, key: genKey() }], subtotal: 0, discount: 0, total: 0, method: 'free', coupon: null };
  DB.set('orders', [...orders(), o]);
  toast(`เพิ่ม "${g.title}" เข้าคลังเกมแล้ว 🎉`);
  render();
}

// ================= Router =================
function route() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [pathPart, query = ''] = raw.split('?');
  const parts = pathPart.split('/').filter(Boolean);
  return { path: parts[0] || '', arg: parts[1], params: new URLSearchParams(query) };
}
const go = path => { location.hash = '#/' + path; };

const routes = {
  '': renderHome, store: renderStore, game: renderGame, cart: renderCart, checkout: renderCheckout,
  order: renderOrderDone, login: renderLogin, register: renderRegister, library: renderLibrary,
  orders: renderOrders, wishlist: renderWishlist, profile: renderProfile, admin: renderAdmin, help: renderHelp
};
const needLogin = ['checkout', 'library', 'orders', 'profile', 'admin', 'order'];

function render() {
  const r = route();
  if (needLogin.includes(r.path) && !currentUser()) {
    toast('กรุณาเข้าสู่ระบบก่อน', true);
    return go('login?next=' + encodeURIComponent(location.hash.slice(2)));
  }
  if (r.path === 'admin' && !isAdmin()) { toast('สำหรับผู้ดูแลระบบเท่านั้น', true); return go(''); }
  clearInterval(window.__heroTimer);
  (routes[r.path] || renderNotFound)(r);
  renderNav();
  $('#nav').classList.remove('open');
  $('#searchInput').value = r.path === 'store' ? r.params.get('q') || '' : '';
}

function renderNav() {
  const u = currentUser();
  const p = route().path;
  const cartN = cart().length, wishN = wishlist().length;
  const link = (href, label, key, badge) =>
    `<a href="#/${href}" class="${p === key ? 'active' : ''}">${label}${badge ? `<span class="badge">${badge}</span>` : ''}</a>`;
  $('#nav').innerHTML = [
    link('store', 'ร้านค้า', 'store'),
    link('wishlist', '♡ อยากได้', 'wishlist', wishN),
    link('cart', '🛒 ตะกร้า', 'cart', cartN),
    u ? link('library', '📚 คลังเกม', 'library') : '',
    u && u.role === 'admin' ? link('admin', '⚙️ แอดมิน', 'admin') : '',
    u ? link('profile', '👤 ' + esc(u.name), 'profile') : link('login', 'เข้าสู่ระบบ', 'login'),
    u ? `<button class="link" id="logoutBtn">ออกจากระบบ</button>` : ''
  ].join('');
  $('#logoutBtn')?.addEventListener('click', () => {
    DB.set('session', null); toast('ออกจากระบบแล้ว'); go('');
  });
}

// ================= Pages =================
function renderHome() {
  const all = games();
  const featured = all.filter(g => g.featured);
  const sale = all.filter(g => g.discount > 0).sort((a, b) => b.discount - a.discount).slice(0, 4);
  const newest = [...all].sort((a, b) => b.release.localeCompare(a.release)).slice(0, 4);
  const top = [...all].sort((a, b) => avgRating(b.id).avg - avgRating(a.id).avg).slice(0, 4);
  const recent = DB.get('recent', []).map(gameById).filter(Boolean).slice(0, 4);
  const genres = [...new Set(all.map(g => g.genre))];

  app.innerHTML = `
    <section class="hero" id="hero">
      ${featured.map((g, i) => `
        <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background:${gradient(g)}">
          <div class="hero-art">${esc(g.icon)}</div>
          <div class="hero-content">
            <span class="pill">⭐ แนะนำ</span><span class="pill">${esc(g.genre)}</span>
            <h1>${esc(g.title)}</h1>
            <p>${esc(g.desc)}</p>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
              <a href="#/game/${g.id}" class="btn">ดูรายละเอียด</a>
              ${priceHtml(g)}
            </div>
          </div>
        </div>`).join('')}
      <div class="hero-dots">${featured.map((_, i) => `<button class="${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="สไลด์ ${i + 1}"></button>`).join('')}</div>
    </section>

    ${section('🔥 ลดราคาแรง', 'store?sale=1', sale)}
    <section class="section">
      <div class="section-head"><h2>🎯 หมวดหมู่เกม</h2></div>
      <div class="cats">${genres.map(gn => `<a class="cat" href="#/store?genre=${encodeURIComponent(gn)}"><span class="e">${GENRE_ICONS[gn] || '🎮'}</span>${esc(gn)}</a>`).join('')}</div>
    </section>
    ${section('🆕 มาใหม่', 'store?sort=new', newest)}
    ${section('🏆 คะแนนสูงสุด', 'store?sort=rating', top)}
    ${recent.length ? section('👀 ดูล่าสุด', null, recent) : ''}
  `;

  // hero carousel
  let idx = 0;
  const slides = $$('.hero-slide'), dots = $$('.hero-dots button');
  const show = i => { idx = i; slides.forEach((s, j) => s.classList.toggle('active', j === i)); dots.forEach((d, j) => d.classList.toggle('active', j === i)); };
  dots.forEach(d => d.onclick = () => show(+d.dataset.slide));
  if (slides.length > 1) window.__heroTimer = setInterval(() => show((idx + 1) % slides.length), 5000);
}

function section(title, more, list) {
  return `<section class="section">
    <div class="section-head"><h2>${title}</h2>${more ? `<a href="#/${more}">ดูทั้งหมด →</a>` : ''}</div>
    <div class="grid">${list.map(gameCard).join('')}</div>
  </section>`;
}

function renderStore(r) {
  const p = r.params;
  const q = (p.get('q') || '').trim().toLowerCase();
  const selGenres = p.getAll('genre');
  const selPlat = p.getAll('platform');
  const maxPrice = +p.get('max') || 0;
  const sale = p.get('sale') === '1', free = p.get('free') === '1';
  const sort = p.get('sort') || 'popular';
  const all = games();
  const genres = [...new Set(all.map(g => g.genre))];

  let list = all.filter(g =>
    (!q || [g.title, g.genre, g.developer, ...(g.tags || [])].join(' ').toLowerCase().includes(q)) &&
    (!selGenres.length || selGenres.includes(g.genre)) &&
    (!selPlat.length || g.platforms.some(x => selPlat.includes(x))) &&
    (!maxPrice || finalPrice(g) <= maxPrice) &&
    (!sale || g.discount > 0) && (!free || g.price === 0));

  const sorters = {
    popular: (a, b) => avgRating(b.id).count - avgRating(a.id).count || b.rating - a.rating,
    new: (a, b) => b.release.localeCompare(a.release),
    rating: (a, b) => avgRating(b.id).avg - avgRating(a.id).avg,
    priceAsc: (a, b) => finalPrice(a) - finalPrice(b),
    priceDesc: (a, b) => finalPrice(b) - finalPrice(a),
    discount: (a, b) => b.discount - a.discount,
    name: (a, b) => a.title.localeCompare(b.title)
  };
  list.sort(sorters[sort] || sorters.popular);

  const chk = (name, val, on) => `<label class="check"><input type="checkbox" data-f="${name}" value="${esc(val)}" ${on ? 'checked' : ''}> ${esc(val)}</label>`;

  app.innerHTML = `
    <div class="store">
      <aside class="filters" id="filters">
        <h4>ประเภทเกม</h4>${genres.map(gn => chk('genre', gn, selGenres.includes(gn))).join('')}
        <h4>แพลตฟอร์ม</h4>${PLATFORMS.map(pl => chk('platform', pl, selPlat.includes(pl))).join('')}
        <h4>ราคาไม่เกิน</h4>
        <select data-f="max">
          ${[0, 300, 500, 1000, 1500].map(v => `<option value="${v}" ${maxPrice === v ? 'selected' : ''}>${v ? baht(v) : 'ทุกราคา'}</option>`).join('')}
        </select>
        <h4>อื่น ๆ</h4>
        <label class="check"><input type="checkbox" data-f="sale" ${sale ? 'checked' : ''}> กำลังลดราคา</label>
        <label class="check"><input type="checkbox" data-f="free" ${free ? 'checked' : ''}> เกมฟรี</label>
        <button class="btn ghost sm block" style="margin-top:12px" id="clearF">ล้างตัวกรอง</button>
      </aside>
      <div>
        <div class="toolbar">
          <div>
            <h2 style="margin:0">${q ? `ผลการค้นหา "${esc(p.get('q'))}"` : 'เกมทั้งหมด'}</h2>
            <span class="muted small">พบ ${list.length} เกม</span>
          </div>
          <div class="row" style="flex:0 0 auto">
            <button class="btn ghost sm filter-toggle" id="fToggle">⚙ ตัวกรอง</button>
            <select id="sort">
              ${Object.entries({ popular: 'ยอดนิยม', new: 'มาใหม่', rating: 'คะแนนสูงสุด', priceAsc: 'ราคา: ต่ำ → สูง', priceDesc: 'ราคา: สูง → ต่ำ', discount: 'ส่วนลดมากสุด', name: 'ชื่อ A-Z' })
                .map(([k, v]) => `<option value="${k}" ${sort === k ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </div>
        </div>
        ${list.length ? `<div class="grid">${list.map(gameCard).join('')}</div>`
          : `<div class="empty"><div class="e">🔎</div><h3>ไม่พบเกมที่ตรงกับเงื่อนไข</h3><p class="muted">ลองเปลี่ยนคำค้นหรือตัวกรอง</p></div>`}
      </div>
    </div>`;

  const update = () => {
    const np = new URLSearchParams();
    if (q) np.set('q', p.get('q'));
    $$('[data-f="genre"]:checked').forEach(c => np.append('genre', c.value));
    $$('[data-f="platform"]:checked').forEach(c => np.append('platform', c.value));
    const mx = $('[data-f="max"]').value; if (+mx) np.set('max', mx);
    if ($('[data-f="sale"]').checked) np.set('sale', '1');
    if ($('[data-f="free"]').checked) np.set('free', '1');
    if ($('#sort').value !== 'popular') np.set('sort', $('#sort').value);
    go('store' + (np.toString() ? '?' + np : ''));
  };
  $$('[data-f]').forEach(el => el.onchange = update);
  $('#sort').onchange = update;
  $('#clearF').onclick = () => go('store');
  $('#fToggle').onclick = () => $('#filters').classList.toggle('open');
}

function renderGame(r) {
  const g = gameById(r.arg);
  if (!g) return renderNotFound();
  pushRecent(g.id);
  const u = currentUser();
  const owned = ownedIds().has(g.id);
  const inCart = cart().includes(g.id);
  const wished = wishlist().includes(g.id);
  const rs = reviews().filter(x => x.gameId === g.id).sort((a, b) => b.date.localeCompare(a.date));
  const { avg, count } = avgRating(g.id);
  const myReview = u && rs.find(x => x.email === u.email);
  const similar = games().filter(x => x.id !== g.id && x.genre === g.genre).slice(0, 4);
  const shotIcons = [g.icon, '🗺️', '⚔️', '🌄'];

  app.innerHTML = `
    <p class="muted small"><a href="#/store">ร้านค้า</a> › <a href="#/store?genre=${encodeURIComponent(g.genre)}">${esc(g.genre)}</a> › ${esc(g.title)}</p>
    <div class="detail">
      <div>
        <div class="cover" id="mainShot" style="background:${gradient(g)}">${esc(g.icon)}</div>
        <div class="shots">${shotIcons.map((ic, i) => `<div class="shot ${i === 0 ? 'active' : ''}" data-i="${esc(ic)}" style="background:${gradient(g)};filter:hue-rotate(${i * 25}deg)">${esc(ic)}</div>`).join('')}</div>

        <section class="section" style="margin-top:28px">
          <h2>เกี่ยวกับเกมนี้</h2>
          <p>${esc(g.desc)}</p>
          <div>${(g.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>
        </section>

        <section class="section">
          <h2>ความต้องการของระบบ (PC)</h2>
          <dl class="spec">
            <dt>ระบบปฏิบัติการ</dt><dd>Windows 10/11 64-bit</dd>
            <dt>ซีพียู</dt><dd>Intel Core i5-8400 / AMD Ryzen 5 2600</dd>
            <dt>แรม</dt><dd>16 GB</dd>
            <dt>การ์ดจอ</dt><dd>NVIDIA GTX 1660 / AMD RX 5500 XT</dd>
            <dt>พื้นที่ว่าง</dt><dd>${30 + (g.title.length * 3)} GB</dd>
          </dl>
        </section>

        <section class="section" id="reviews">
          <h2>รีวิวจากผู้เล่น</h2>
          <div class="panel" style="display:flex;gap:28px;flex-wrap:wrap;align-items:center">
            <div style="text-align:center">
              <div style="font-size:44px;font-weight:700">${avg.toFixed(1)}</div>
              <div class="stars">${stars(avg)}</div>
              <div class="muted small">${count} รีวิว</div>
            </div>
            <div class="rating-bars" style="flex:1;min-width:200px">
              ${[5, 4, 3, 2, 1].map(s => {
                const n = rs.filter(x => x.rating === s).length;
                return `<div class="bar">${s}★<div class="track"><div class="fill" style="width:${count ? n / count * 100 : 0}%"></div></div>${n}</div>`;
              }).join('')}
            </div>
          </div>
          ${owned ? `
            <div class="panel" style="margin-top:14px">
              <h3>${myReview ? 'แก้ไขรีวิวของคุณ' : 'เขียนรีวิว'}</h3>
              <div class="star-input" id="starInput">${[1, 2, 3, 4, 5].map(s => `<span data-s="${s}">★</span>`).join('')}</div>
              <textarea id="reviewText" rows="3" placeholder="เล่าประสบการณ์ของคุณ..." style="margin:10px 0">${esc(myReview?.text || '')}</textarea>
              <button class="btn" id="sendReview">ส่งรีวิว</button>
            </div>` : `<p class="muted small" style="margin-top:12px">${u ? 'ซื้อเกมนี้เพื่อเขียนรีวิว' : 'เข้าสู่ระบบและซื้อเกมนี้เพื่อเขียนรีวิว'}</p>`}
          <div style="margin-top:10px">
            ${rs.length ? rs.map(x => `
              <div class="review">
                <div class="review-head"><b>${esc(x.user)}</b><span class="muted small">${fmtDate(x.date)}</span></div>
                <div class="stars">${stars(x.rating)}</div>
                <p style="margin:6px 0 0">${esc(x.text)}</p>
              </div>`).join('') : '<p class="muted">ยังไม่มีรีวิว เป็นคนแรกที่รีวิวเกมนี้!</p>'}
          </div>
        </section>
      </div>

      <aside class="buybox">
        <h1 style="font-size:28px">${esc(g.title)}</h1>
        <div class="stars">${stars(avg)} <span class="muted small">(${avg.toFixed(1)} · ${count} รีวิว)</span></div>
        <div style="margin:16px 0">${g.discount ? `<span class="tag" style="background:var(--good)">ลด ${g.discount}%</span>` : ''}${priceHtml(g)}</div>
        <div style="display:flex;gap:10px">
          ${owned ? `<a href="#/library" class="btn good block">✔ อยู่ในคลังเกมแล้ว</a>`
            : g.price === 0 ? `<button class="btn good block" data-claim="${g.id}">รับเกมฟรี</button>`
            : inCart ? `<a href="#/cart" class="btn ghost block">ไปที่ตะกร้า →</a>`
            : `<button class="btn block" id="buyNow">ซื้อเลย</button>`}
          <button class="icon-btn ${wished ? 'on' : ''}" id="wishBtn" aria-label="อยากได้">${wished ? '♥' : '♡'}</button>
        </div>
        ${!owned && g.price > 0 && !inCart ? `<button class="btn ghost block" style="margin-top:10px" data-cart="${g.id}" id="addCartBtn">🛒 ใส่ตะกร้า</button>` : ''}
        <dl class="spec">
          <dt>ประเภท</dt><dd>${esc(g.genre)}</dd>
          <dt>แพลตฟอร์ม</dt><dd>${g.platforms.map(esc).join(', ')}</dd>
          <dt>ผู้พัฒนา</dt><dd>${esc(g.developer)}</dd>
          <dt>วางจำหน่าย</dt><dd>${fmtDate(g.release)}</dd>
        </dl>
        <p class="muted small">⚡ ได้รับคีย์เกมทันทีหลังชำระเงิน · 🔒 ชำระเงินปลอดภัย</p>
      </aside>
    </div>
    ${similar.length ? section('🎮 เกมที่คล้ายกัน', 'store?genre=' + encodeURIComponent(g.genre), similar) : ''}
  `;

  $$('.shot').forEach(s => s.onclick = () => {
    $$('.shot').forEach(x => x.classList.remove('active')); s.classList.add('active');
    $('#mainShot').textContent = s.dataset.i; $('#mainShot').style.filter = s.style.filter;
  });
  $('#wishBtn').onclick = e => { const on = toggleWish(g.id); e.target.classList.toggle('on', on); e.target.textContent = on ? '♥' : '♡'; };
  $('#buyNow')?.addEventListener('click', () => { addToCart(g.id); go('cart'); });
  $('#addCartBtn')?.addEventListener('click', () => setTimeout(render, 0));

  if (owned) {
    let rating = myReview?.rating || 0;
    const paint = () => $$('#starInput span').forEach(s => s.classList.toggle('on', +s.dataset.s <= rating));
    paint();
    $$('#starInput span').forEach(s => s.onclick = () => { rating = +s.dataset.s; paint(); });
    $('#sendReview').onclick = () => {
      const text = $('#reviewText').value.trim();
      if (!rating) return toast('กรุณาให้คะแนนดาว', true);
      if (text.length < 5) return toast('กรุณาเขียนรีวิวอย่างน้อย 5 ตัวอักษร', true);
      const list = reviews().filter(x => !(x.gameId === g.id && x.email === u.email));
      list.push({ gameId: g.id, email: u.email, user: u.name, rating, text, date: new Date().toISOString().slice(0, 10) });
      DB.set('reviews', list);
      toast('ขอบคุณสำหรับรีวิว!');
      render();
    };
  }
}

// ---- cart & checkout ----
function calcCart(code) {
  const items = cart().map(gameById).filter(Boolean);
  const subtotal = items.reduce((s, g) => s + finalPrice(g), 0);
  const saved = items.reduce((s, g) => s + (g.price - finalPrice(g)), 0);
  let discount = 0, coupon = null, couponErr = null;
  if (code) {
    coupon = coupons().find(c => c.code === code.toUpperCase() && c.active);
    if (!coupon) couponErr = 'โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ';
    else if (subtotal < coupon.minTotal) { couponErr = `ต้องมียอดขั้นต่ำ ${baht(coupon.minTotal)}`; coupon = null; }
    else discount = coupon.type === 'percent' ? Math.round(subtotal * coupon.value / 100) : Math.min(coupon.value, subtotal);
  }
  return { items, subtotal, saved, discount, coupon, couponErr, total: subtotal - discount };
}

function summaryHtml(c) {
  return `
    <div class="sum-row"><span>ราคาสินค้า (${c.items.length} เกม)</span><span>${baht(c.subtotal + c.saved)}</span></div>
    ${c.saved ? `<div class="sum-row" style="color:var(--good)"><span>ส่วนลดโปรโมชั่น</span><span>-${baht(c.saved)}</span></div>` : ''}
    ${c.discount ? `<div class="sum-row" style="color:var(--good)"><span>คูปอง ${esc(c.coupon.code)}</span><span>-${baht(c.discount)}</span></div>` : ''}
    <div class="sum-row total"><span>ยอดรวม</span><span>${baht(c.total)}</span></div>`;
}

function renderCart() {
  // ตัดเกมที่มีอยู่แล้วหรือถูกลบออกจากร้าน
  const owned = ownedIds();
  DB.set('cart', cart().filter(id => gameById(id) && !owned.has(id)));
  const code = DB.get('coupon', '');
  const c = calcCart(code);

  if (!c.items.length) {
    app.innerHTML = `<div class="empty"><div class="e">🛒</div><h2>ตะกร้าของคุณว่างเปล่า</h2><p class="muted">ไปเลือกเกมที่ชอบกันเถอะ</p><a href="#/store" class="btn">เลือกซื้อเกม</a></div>`;
    return;
  }
  app.innerHTML = `
    <h1>ตะกร้าสินค้า</h1>
    <div class="cart-layout">
      <div class="panel">
        ${c.items.map(g => `
          <div class="cart-item">
            <a href="#/game/${g.id}" class="thumb" style="background:${gradient(g)}">${esc(g.icon)}</a>
            <div class="info">
              <a href="#/game/${g.id}"><b>${esc(g.title)}</b></a>
              <div class="muted small">${esc(g.genre)} · ${g.platforms.map(esc).join(', ')}</div>
              <button class="btn ghost sm" style="margin-top:6px" data-move="${g.id}">♡ ย้ายไปรายการที่อยากได้</button>
            </div>
            <div style="text-align:right">${priceHtml(g)}<button class="btn ghost sm" style="margin-top:6px" data-remove="${g.id}">🗑 ลบ</button></div>
          </div>`).join('')}
      </div>
      <div class="panel">
        <h3>สรุปคำสั่งซื้อ</h3>
        <div class="field" style="display:flex;gap:8px;margin-top:12px">
          <input id="couponInput" placeholder="โค้ดส่วนลด" value="${esc(code)}">
          <button class="btn ghost" id="applyCoupon">ใช้</button>
        </div>
        ${c.couponErr ? `<p class="small" style="color:var(--bad);margin-top:-6px">${c.couponErr}</p>` : ''}
        <p class="muted small">ลองใช้: WELCOME10, SAVE100, GAMER20</p>
        ${summaryHtml(c)}
        <a href="#/checkout" class="btn block" style="margin-top:14px">ดำเนินการชำระเงิน</a>
        <a href="#/store" class="btn ghost block" style="margin-top:8px">เลือกซื้อต่อ</a>
      </div>
    </div>`;

  $$('[data-remove]').forEach(b => b.onclick = () => { removeFromCart(b.dataset.remove); toast('ลบออกจากตะกร้าแล้ว'); render(); });
  $$('[data-move]').forEach(b => b.onclick = () => {
    if (!wishlist().includes(b.dataset.move)) toggleWish(b.dataset.move);
    removeFromCart(b.dataset.move); render();
  });
  $('#applyCoupon').onclick = () => {
    const v = $('#couponInput').value.trim();
    DB.set('coupon', v);
    const res = calcCart(v);
    if (v && !res.couponErr) toast('ใช้โค้ดส่วนลดสำเร็จ!');
    render();
  };
}

function renderCheckout() {
  const c = calcCart(DB.get('coupon', ''));
  if (!c.items.length) return go('cart');
  const u = currentUser();
  // simple pseudo-random QR pattern for the PromptPay mock
  const qrCells = Array.from({ length: 441 }, (_, i) => {
    const x = i % 21, y = Math.floor(i / 21);
    const finder = (a, b) => x >= a && x < a + 7 && y >= b && y < b + 7 && (x === a || x === a + 6 || y === b || y === b + 6 || (x > a + 1 && x < a + 5 && y > b + 1 && y < b + 5));
    const inFinderZone = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
    const dark = finder(0, 0) || finder(14, 0) || finder(0, 14) || (!inFinderZone && (Math.sin(i * 12.9898 + c.total) * 43758.5453 % 1 + 1) % 1 > 0.5);
    return `<i class="${dark ? 'd' : ''}"></i>`;
  }).join('');

  app.innerHTML = `
    <h1>ชำระเงิน</h1>
    <div class="cart-layout">
      <form class="panel" id="payForm" novalidate>
        <h3>ข้อมูลผู้ซื้อ</h3>
        <div class="row">
          <div class="field"><label>ชื่อ</label><input value="${esc(u.name)}" disabled></div>
          <div class="field"><label>อีเมล (รับคีย์เกม)</label><input value="${esc(u.email)}" disabled></div>
        </div>
        <h3>วิธีชำระเงิน</h3>
        <div class="pay-methods">
          <label><input type="radio" name="method" value="card" checked>💳<br>บัตรเครดิต/เดบิต</label>
          <label><input type="radio" name="method" value="promptpay">📱<br>พร้อมเพย์</label>
          <label><input type="radio" name="method" value="wallet">👛<br>TrueMoney Wallet</label>
        </div>
        <div data-pm="card">
          <p class="muted small">โหมดเดโม: ใช้หมายเลขบัตรทดสอบ 4242 4242 4242 4242 ได้</p>
          <div class="field"><label>หมายเลขบัตร</label><input id="cardNo" inputmode="numeric" placeholder="4242 4242 4242 4242" maxlength="19"></div>
          <div class="row">
            <div class="field"><label>วันหมดอายุ</label><input id="cardExp" placeholder="MM/YY" maxlength="5"></div>
            <div class="field"><label>CVV</label><input id="cardCvv" inputmode="numeric" placeholder="123" maxlength="4"></div>
          </div>
          <div class="field"><label>ชื่อบนบัตร</label><input id="cardName" placeholder="SOMCHAI JAIDEE"></div>
        </div>
        <div data-pm="promptpay" class="hidden" style="text-align:center">
          <div class="qr">${qrCells}</div>
          <p>สแกน QR เพื่อชำระ <b>${baht(c.total)}</b></p>
          <p class="muted small">โหมดเดโม: กด "ยืนยันการชำระเงิน" เพื่อจำลองการโอนสำเร็จ</p>
        </div>
        <div data-pm="wallet" class="hidden">
          <div class="field"><label>เบอร์โทรศัพท์ที่ผูกกับ Wallet</label><input id="walletPhone" inputmode="numeric" placeholder="08xxxxxxxx" maxlength="10"></div>
        </div>
        <label class="check" style="margin-top:8px"><input type="checkbox" id="agree"> ฉันยอมรับเงื่อนไขการซื้อสินค้าดิจิทัล (ไม่สามารถคืนเงินหลังเปิดใช้คีย์)</label>
        <button class="btn block" style="margin-top:16px" id="payBtn">🔒 ยืนยันการชำระเงิน ${baht(c.total)}</button>
      </form>
      <div class="panel">
        <h3>รายการสินค้า</h3>
        ${c.items.map(g => `<div class="cart-item"><div class="thumb" style="background:${gradient(g)}">${esc(g.icon)}</div><div class="info"><b>${esc(g.title)}</b></div><span>${baht(finalPrice(g))}</span></div>`).join('')}
        ${summaryHtml(c)}
      </div>
    </div>`;

  const method = () => $('input[name="method"]:checked').value;
  $$('input[name="method"]').forEach(r => r.onchange = () => $$('[data-pm]').forEach(d => d.classList.toggle('hidden', d.dataset.pm !== method())));
  $('#cardNo').oninput = e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); };
  $('#cardExp').oninput = e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; };

  $('#payForm').onsubmit = e => {
    e.preventDefault();
    const m = method();
    if (m === 'card') {
      const no = $('#cardNo').value.replace(/\s/g, '');
      const [mm, yy] = $('#cardExp').value.split('/').map(Number);
      if (!/^\d{16}$/.test(no) || !luhn(no)) return toast('หมายเลขบัตรไม่ถูกต้อง', true);
      if (!mm || mm > 12 || !yy || new Date(2000 + yy, mm) < new Date()) return toast('วันหมดอายุไม่ถูกต้อง', true);
      if (!/^\d{3,4}$/.test($('#cardCvv').value)) return toast('CVV ไม่ถูกต้อง', true);
      if (!$('#cardName').value.trim()) return toast('กรุณากรอกชื่อบนบัตร', true);
    }
    if (m === 'wallet' && !/^0\d{9}$/.test($('#walletPhone').value)) return toast('เบอร์โทรศัพท์ไม่ถูกต้อง', true);
    if (!$('#agree').checked) return toast('กรุณายอมรับเงื่อนไขก่อนชำระเงิน', true);

    const btn = $('#payBtn');
    btn.disabled = true; btn.textContent = 'กำลังประมวลผล...';
    setTimeout(() => {
      const fresh = calcCart(DB.get('coupon', ''));
      const order = {
        id: 'ORD-' + Date.now().toString(36).toUpperCase(), user: u.email, date: new Date().toISOString(), status: 'paid',
        items: fresh.items.map(g => ({ id: g.id, title: g.title, price: finalPrice(g), key: genKey() })),
        subtotal: fresh.subtotal, discount: fresh.discount, total: fresh.total, method: m, coupon: fresh.coupon?.code || null
      };
      DB.set('orders', [...orders(), order]);
      DB.set('cart', []); DB.set('coupon', '');
      u.wishlist = (u.wishlist || []).filter(id => !order.items.some(i => i.id === id));
      saveUser(u);
      go('order/' + order.id);
    }, 1200);
  };
}

function luhn(num) {
  let sum = 0;
  [...num].reverse().forEach((d, i) => { let n = +d; if (i % 2) { n *= 2; if (n > 9) n -= 9; } sum += n; });
  return sum % 10 === 0;
}

const METHOD_LABEL = { card: '💳 บัตรเครดิต', promptpay: '📱 พร้อมเพย์', wallet: '👛 TrueMoney', free: '🎁 ฟรี' };

function renderOrderDone(r) {
  const o = orders().find(x => x.id === r.arg && (x.user === currentUser().email || isAdmin()));
  if (!o) return renderNotFound();
  app.innerHTML = `
    <div class="panel" style="max-width:640px;margin:0 auto;text-align:center">
      <div style="font-size:64px">🎉</div>
      <h1>ชำระเงินสำเร็จ!</h1>
      <p class="muted">หมายเลขคำสั่งซื้อ <b>${esc(o.id)}</b> · ${fmtDateTime(o.date)}</p>
      <div style="text-align:left;margin:20px 0">
        ${o.items.map(i => `<div class="cart-item"><div class="info"><b>${esc(i.title)}</b><div class="small muted">คีย์เกม</div></div><span class="key">${esc(i.key)}</span><button class="btn ghost sm" data-copy="${esc(i.key)}">คัดลอก</button></div>`).join('')}
        <div class="sum-row total"><span>ชำระแล้ว (${METHOD_LABEL[o.method] || ''})</span><span>${baht(o.total)}</span></div>
      </div>
      <div class="row"><a href="#/library" class="btn">ไปที่คลังเกม</a><a href="#/store" class="btn ghost">เลือกซื้อต่อ</a></div>
    </div>`;
  bindCopy();
}

function bindCopy() {
  $$('[data-copy]').forEach(b => b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast('คัดลอกคีย์แล้ว'); }
    catch { toast('คัดลอกไม่สำเร็จ', true); }
  });
}

// ---- auth ----
function renderLogin(r) {
  const next = r.params.get('next') || '';
  app.innerHTML = `
    <div class="auth panel">
      <h1>เข้าสู่ระบบ</h1>
      <form id="loginForm">
        <div class="field"><label>อีเมล</label><input type="email" id="email" required autocomplete="email"></div>
        <div class="field"><label>รหัสผ่าน</label><input type="password" id="pass" required autocomplete="current-password"></div>
        <button class="btn block">เข้าสู่ระบบ</button>
      </form>
      <p class="muted small" style="text-align:center;margin-top:16px">ยังไม่มีบัญชี? <a href="#/register${next ? '?next=' + encodeURIComponent(next) : ''}" style="color:var(--accent-2)">สมัครสมาชิก</a></p>
      <p class="muted small" style="text-align:center">บัญชีทดลองดูได้ในไฟล์ README.md</p>
    </div>`;
  $('#loginForm').onsubmit = e => {
    e.preventDefault();
    const email = $('#email').value.trim().toLowerCase();
    const u = users().find(x => x.email === email && x.pass === hash($('#pass').value));
    if (!u) return toast('อีเมลหรือรหัสผ่านไม่ถูกต้อง', true);
    loginAs(u, next);
  };
}

function loginAs(u, next) {
  DB.set('session', u.email);
  // รวม wishlist ของ guest เข้ากับบัญชี
  const guest = DB.get('guestWish', []);
  if (guest.length) { u.wishlist = [...new Set([...(u.wishlist || []), ...guest])]; saveUser(u); DB.set('guestWish', []); }
  toast(`ยินดีต้อนรับ ${u.name} 👋`);
  go(next || '');
}

function renderRegister(r) {
  const next = r.params.get('next') || '';
  app.innerHTML = `
    <div class="auth panel">
      <h1>สมัครสมาชิก</h1>
      <form id="regForm">
        <div class="field"><label>ชื่อที่แสดง</label><input id="name" required maxlength="30"></div>
        <div class="field"><label>อีเมล</label><input type="email" id="email" required autocomplete="email"></div>
        <div class="field"><label>รหัสผ่าน (อย่างน้อย 6 ตัว)</label><input type="password" id="pass" required minlength="6" autocomplete="new-password"></div>
        <div class="field"><label>ยืนยันรหัสผ่าน</label><input type="password" id="pass2" required autocomplete="new-password"></div>
        <button class="btn block">สมัครสมาชิก</button>
      </form>
      <p class="muted small" style="text-align:center;margin-top:16px">มีบัญชีแล้ว? <a href="#/login" style="color:var(--accent-2)">เข้าสู่ระบบ</a></p>
    </div>`;
  $('#regForm').onsubmit = e => {
    e.preventDefault();
    const name = $('#name').value.trim(), email = $('#email').value.trim().toLowerCase(), pass = $('#pass').value;
    if (!name) return toast('กรุณากรอกชื่อ', true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('รูปแบบอีเมลไม่ถูกต้อง', true);
    if (pass.length < 6) return toast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', true);
    if (pass !== $('#pass2').value) return toast('รหัสผ่านไม่ตรงกัน', true);
    if (users().some(u => u.email === email)) return toast('อีเมลนี้ถูกใช้แล้ว', true);
    const u = { email, name, role: 'user', pass: hash(pass), wishlist: [], created: new Date().toISOString() };
    DB.set('users', [...users(), u]);
    toast('สมัครสมาชิกสำเร็จ!');
    loginAs(u, next);
  };
}

// ---- account pages ----
function renderLibrary() {
  const u = currentUser();
  const items = [];
  orders().filter(o => o.user === u.email && o.status === 'paid')
    .forEach(o => o.items.forEach(i => items.push({ ...i, date: o.date, game: gameById(i.id) })));
  if (!items.length) {
    app.innerHTML = `<div class="empty"><div class="e">📚</div><h2>คลังเกมยังว่างอยู่</h2><p class="muted">เกมที่ซื้อแล้วจะแสดงที่นี่พร้อมคีย์</p><a href="#/store" class="btn">เลือกซื้อเกม</a></div>`;
    return;
  }
  app.innerHTML = `
    <h1>📚 คลังเกมของฉัน <span class="muted small">(${items.length} เกม)</span></h1>
    <div class="panel">
      ${items.map(i => `
        <div class="cart-item">
          <a href="#/game/${i.id}" class="thumb" style="background:${i.game ? gradient(i.game) : '#333'}">${esc(i.game?.icon || '🎮')}</a>
          <div class="info"><b>${esc(i.title)}</b><div class="muted small">ได้รับเมื่อ ${fmtDate(i.date)}</div></div>
          <span class="key">${esc(i.key)}</span>
          <button class="btn ghost sm" data-copy="${esc(i.key)}">คัดลอก</button>
          <button class="btn sm" data-play="${esc(i.title)}">▶ เล่น</button>
        </div>`).join('')}
    </div>`;
  bindCopy();
  $$('[data-play]').forEach(b => b.onclick = () => toast(`กำลังเปิด ${b.dataset.play}... (เดโม)`));
}

function renderOrders() {
  const u = currentUser();
  const list = orders().filter(o => o.user === u.email).sort((a, b) => b.date.localeCompare(a.date));
  if (!list.length) {
    app.innerHTML = `<div class="empty"><div class="e">🧾</div><h2>ยังไม่มีคำสั่งซื้อ</h2><a href="#/store" class="btn">เลือกซื้อเกม</a></div>`;
    return;
  }
  app.innerHTML = `
    <h1>🧾 ประวัติการสั่งซื้อ</h1>
    <div class="panel table-wrap"><table>
      <tr><th>เลขที่</th><th>วันที่</th><th>รายการ</th><th>วิธีชำระ</th><th>ยอดรวม</th><th>สถานะ</th><th></th></tr>
      ${list.map(o => `<tr>
        <td>${esc(o.id)}</td><td>${fmtDateTime(o.date)}</td>
        <td>${o.items.map(i => esc(i.title)).join(', ')}</td>
        <td>${METHOD_LABEL[o.method] || ''}</td><td>${baht(o.total)}</td>
        <td><span class="status ${o.status}">${o.status === 'paid' ? 'ชำระแล้ว' : 'คืนเงินแล้ว'}</span></td>
        <td><a class="btn ghost sm" href="#/order/${esc(o.id)}">ดู</a></td>
      </tr>`).join('')}
    </table></div>`;
}

function renderWishlist() {
  const list = wishlist().map(gameById).filter(Boolean);
  app.innerHTML = list.length
    ? `<h1>♡ รายการที่อยากได้ <span class="muted small">(${list.length})</span></h1>
       <div style="margin-bottom:16px"><button class="btn" id="addAll">🛒 ใส่ทั้งหมดลงตะกร้า</button></div>
       <div class="grid">${list.map(gameCard).join('')}</div>`
    : `<div class="empty"><div class="e">💔</div><h2>ยังไม่มีเกมในรายการที่อยากได้</h2><p class="muted">กด ♡ บนเกมที่สนใจเพื่อบันทึกไว้</p><a href="#/store" class="btn">เลือกดูเกม</a></div>`;
  $('#addAll')?.addEventListener('click', () => {
    const owned = ownedIds();
    const c = new Set(cart());
    list.filter(g => g.price > 0 && !owned.has(g.id)).forEach(g => c.add(g.id));
    DB.set('cart', [...c]); renderNav(); toast('เพิ่มลงตะกร้าแล้ว');
  });
}

function renderProfile() {
  const u = currentUser();
  const my = orders().filter(o => o.user === u.email && o.status === 'paid');
  const spent = my.reduce((s, o) => s + o.total, 0);
  app.innerHTML = `
    <h1>👤 บัญชีของฉัน</h1>
    <div class="stats">
      <div class="stat"><div class="muted small">เกมในคลัง</div><div class="v">${ownedIds().size}</div></div>
      <div class="stat"><div class="muted small">คำสั่งซื้อ</div><div class="v">${my.length}</div></div>
      <div class="stat"><div class="muted small">ยอดใช้จ่ายรวม</div><div class="v">${baht(spent)}</div></div>
      <div class="stat"><div class="muted small">สมาชิกตั้งแต่</div><div class="v" style="font-size:18px">${fmtDate(u.created)}</div></div>
    </div>
    <div class="row" style="margin-bottom:20px"><a class="btn ghost" href="#/library">📚 คลังเกม</a><a class="btn ghost" href="#/orders">🧾 ประวัติการสั่งซื้อ</a><a class="btn ghost" href="#/wishlist">♡ อยากได้</a></div>
    <div class="row" style="align-items:flex-start">
      <form class="panel" id="nameForm">
        <h3>ข้อมูลส่วนตัว</h3>
        <div class="field"><label>อีเมล</label><input value="${esc(u.email)}" disabled></div>
        <div class="field"><label>ชื่อที่แสดง</label><input id="pName" value="${esc(u.name)}" maxlength="30"></div>
        <button class="btn">บันทึก</button>
      </form>
      <form class="panel" id="passForm">
        <h3>เปลี่ยนรหัสผ่าน</h3>
        <div class="field"><label>รหัสผ่านปัจจุบัน</label><input type="password" id="oldP" autocomplete="current-password"></div>
        <div class="field"><label>รหัสผ่านใหม่</label><input type="password" id="newP" autocomplete="new-password"></div>
        <button class="btn">เปลี่ยนรหัสผ่าน</button>
      </form>
    </div>`;
  $('#nameForm').onsubmit = e => {
    e.preventDefault();
    const n = $('#pName').value.trim();
    if (!n) return toast('กรุณากรอกชื่อ', true);
    u.name = n; saveUser(u); toast('บันทึกแล้ว'); renderNav();
  };
  $('#passForm').onsubmit = e => {
    e.preventDefault();
    if (hash($('#oldP').value) !== u.pass) return toast('รหัสผ่านปัจจุบันไม่ถูกต้อง', true);
    if ($('#newP').value.length < 6) return toast('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัว', true);
    u.pass = hash($('#newP').value); saveUser(u); toast('เปลี่ยนรหัสผ่านสำเร็จ'); e.target.reset();
  };
}

function renderHelp() {
  const faqs = [
    ['ซื้อเกมแล้วจะได้รับคีย์อย่างไร?', 'หลังชำระเงินสำเร็จ คีย์จะแสดงทันทีในหน้ายืนยันคำสั่งซื้อและในเมนู "คลังเกม"'],
    ['รองรับการชำระเงินช่องทางไหนบ้าง?', 'บัตรเครดิต/เดบิต, พร้อมเพย์ และ TrueMoney Wallet'],
    ['ขอคืนเงินได้ไหม?', 'สามารถขอคืนเงินได้ภายใน 14 วันหากยังไม่ได้เปิดใช้คีย์ โดยติดต่อทีมงาน'],
    ['ใช้โค้ดส่วนลดอย่างไร?', 'กรอกโค้ดในหน้าตะกร้าสินค้าแล้วกด "ใช้" ระบบจะคำนวณส่วนลดให้อัตโนมัติ'],
    ['เกมที่ซื้อเล่นได้กี่เครื่อง?', 'ขึ้นอยู่กับเงื่อนไขของแต่ละแพลตฟอร์ม โดยทั่วไปผูกกับบัญชีของแพลตฟอร์มนั้น ๆ']
  ];
  app.innerHTML = `
    <h1>ศูนย์ช่วยเหลือ</h1>
    <div class="faq">${faqs.map(([q, a]) => `<details><summary>${q}</summary><p class="muted">${a}</p></details>`).join('')}</div>
    <form class="panel" id="contactForm" style="max-width:600px;margin-top:24px">
      <h3>ติดต่อเรา</h3>
      <div class="field"><label>หัวข้อ</label><input id="cSubj" required></div>
      <div class="field"><label>ข้อความ</label><textarea id="cMsg" rows="4" required></textarea></div>
      <button class="btn">ส่งข้อความ</button>
    </form>`;
  $('#contactForm').onsubmit = e => {
    e.preventDefault();
    const msgs = DB.get('messages', []);
    msgs.push({ subject: $('#cSubj').value, text: $('#cMsg').value, user: currentUser()?.email || 'guest', date: new Date().toISOString() });
    DB.set('messages', msgs);
    toast('ส่งข้อความแล้ว ทีมงานจะติดต่อกลับเร็ว ๆ นี้'); e.target.reset();
  };
}

function renderNotFound() {
  app.innerHTML = `<div class="empty"><div class="e">👾</div><h2>ไม่พบหน้าที่คุณต้องการ</h2><a href="#/" class="btn">กลับหน้าแรก</a></div>`;
}

// ================= Admin =================
function renderAdmin(r) {
  const tab = r.arg || 'dashboard';
  const tabs = { dashboard: '📊 ภาพรวม', games: '🎮 จัดการเกม', orders: '🧾 คำสั่งซื้อ', users: '👥 ผู้ใช้', coupons: '🏷️ คูปอง', messages: '✉️ ข้อความ' };
  app.innerHTML = `<h1>⚙️ ระบบหลังบ้าน</h1>
    <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="${k === tab ? 'active' : ''}" data-tab="${k}">${v}</button>`).join('')}</div>
    <div id="adminBody"></div>`;
  $$('[data-tab]').forEach(b => b.onclick = () => go('admin/' + b.dataset.tab));
  ({ dashboard: adminDashboard, games: adminGames, orders: adminOrders, users: adminUsers, coupons: adminCoupons, messages: adminMessages }[tab] || adminDashboard)($('#adminBody'));
}

function adminDashboard(el) {
  const paid = orders().filter(o => o.status === 'paid');
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10); });
  const perDay = days.map(d => paid.filter(o => o.date.slice(0, 10) === d).reduce((s, o) => s + o.total, 0));
  const maxDay = Math.max(...perDay, 1);
  const sold = {};
  paid.forEach(o => o.items.forEach(i => { sold[i.id] = sold[i.id] || { title: i.title, n: 0, rev: 0 }; sold[i.id].n++; sold[i.id].rev += i.price; }));
  const top = Object.values(sold).sort((a, b) => b.n - a.n).slice(0, 5);

  el.innerHTML = `
    <div class="stats">
      <div class="stat"><div class="muted small">รายได้รวม</div><div class="v">${baht(revenue)}</div></div>
      <div class="stat"><div class="muted small">คำสั่งซื้อ</div><div class="v">${paid.length}</div></div>
      <div class="stat"><div class="muted small">ผู้ใช้</div><div class="v">${users().length}</div></div>
      <div class="stat"><div class="muted small">เกมในร้าน</div><div class="v">${games().length}</div></div>
    </div>
    <div class="row" style="align-items:stretch">
      <div class="panel" style="flex:2">
        <h3>ยอดขาย 7 วันล่าสุด</h3>
        <div class="chart">${perDay.map((v, i) => `<div class="col" title="${baht(v)}"><span>${v ? baht(v) : ''}</span><div class="b" style="height:${v / maxDay * 100}%"></div><span>${new Date(days[i]).toLocaleDateString('th-TH', { weekday: 'short' })}</span></div>`).join('')}</div>
      </div>
      <div class="panel" style="flex:1">
        <h3>เกมขายดี</h3>
        ${top.length ? top.map((t, i) => `<div class="sum-row"><span>${i + 1}. ${esc(t.title)}</span><span class="muted">${t.n} ชิ้น</span></div>`).join('') : '<p class="muted">ยังไม่มียอดขาย</p>'}
      </div>
    </div>`;
}

function adminGames(el) {
  el.innerHTML = `
    <div class="toolbar"><input id="gFilter" placeholder="ค้นหาเกม..." style="max-width:300px"><button class="btn" id="addGame">+ เพิ่มเกมใหม่</button></div>
    <div class="panel table-wrap"><table id="gTable"></table></div>`;
  const draw = () => {
    const q = $('#gFilter').value.toLowerCase();
    $('#gTable').innerHTML = `<tr><th></th><th>ชื่อเกม</th><th>ประเภท</th><th>ราคา</th><th>ส่วนลด</th><th>ราคาขาย</th><th>แนะนำ</th><th></th></tr>` +
      games().filter(g => g.title.toLowerCase().includes(q)).map(g => `<tr>
        <td><div class="thumb" style="width:40px;height:40px;font-size:20px;background:${gradient(g)}">${esc(g.icon)}</div></td>
        <td><a href="#/game/${g.id}">${esc(g.title)}</a></td><td>${esc(g.genre)}</td>
        <td>${baht(g.price)}</td><td>${g.discount}%</td><td>${baht(finalPrice(g))}</td><td>${g.featured ? '⭐' : ''}</td>
        <td><button class="btn ghost sm" data-edit="${g.id}">แก้ไข</button> <button class="btn danger sm" data-del="${g.id}">ลบ</button></td>
      </tr>`).join('');
    $$('[data-edit]').forEach(b => b.onclick = () => gameForm(gameById(b.dataset.edit)));
    $$('[data-del]').forEach(b => b.onclick = () => confirmBox(`ลบเกม "${gameById(b.dataset.del).title}"?`, () => {
      DB.set('games', games().filter(g => g.id !== b.dataset.del)); toast('ลบเกมแล้ว'); draw();
    }));
  };
  $('#gFilter').oninput = draw;
  $('#addGame').onclick = () => gameForm(null);
  draw();

  function gameForm(g) {
    const v = g || { title: '', genre: 'แอ็กชัน', platforms: ['PC'], price: 0, discount: 0, developer: '', icon: '🎮', colors: ['#7c5cff', '#22d3ee'], desc: '', tags: [], featured: false, release: new Date().toISOString().slice(0, 10), rating: 4 };
    openModal(`
      <h2>${g ? 'แก้ไขเกม' : 'เพิ่มเกมใหม่'}</h2>
      <form id="gForm">
        <div class="field"><label>ชื่อเกม</label><input id="fTitle" value="${esc(v.title)}" required></div>
        <div class="row">
          <div class="field"><label>ประเภท</label><select id="fGenre">${Object.keys(GENRE_ICONS).map(x => `<option ${x === v.genre ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
          <div class="field"><label>ผู้พัฒนา</label><input id="fDev" value="${esc(v.developer)}"></div>
        </div>
        <div class="field"><label>แพลตฟอร์ม</label><div class="row">${PLATFORMS.map(p => `<label class="check"><input type="checkbox" name="fPlat" value="${p}" ${v.platforms.includes(p) ? 'checked' : ''}> ${p}</label>`).join('')}</div></div>
        <div class="row">
          <div class="field"><label>ราคา (บาท)</label><input type="number" id="fPrice" min="0" value="${v.price}"></div>
          <div class="field"><label>ส่วนลด (%)</label><input type="number" id="fDisc" min="0" max="90" value="${v.discount}"></div>
          <div class="field"><label>วันวางจำหน่าย</label><input type="date" id="fRel" value="${esc(v.release)}"></div>
        </div>
        <div class="row">
          <div class="field"><label>ไอคอน (อีโมจิ)</label><input id="fIcon" value="${esc(v.icon)}" maxlength="4"></div>
          <div class="field"><label>สีหลัก</label><input type="color" id="fC1" value="${safeColor(v.colors[0])}" style="height:44px"></div>
          <div class="field"><label>สีรอง</label><input type="color" id="fC2" value="${safeColor(v.colors[1])}" style="height:44px"></div>
        </div>
        <div class="field"><label>แท็ก (คั่นด้วย ,)</label><input id="fTags" value="${esc((v.tags || []).join(', '))}"></div>
        <div class="field"><label>คำอธิบาย</label><textarea id="fDesc" rows="3">${esc(v.desc)}</textarea></div>
        <label class="check"><input type="checkbox" id="fFeat" ${v.featured ? 'checked' : ''}> แสดงในแบนเนอร์หน้าแรก</label>
        <div class="row" style="margin-top:16px"><button type="button" class="btn ghost" id="fCancel">ยกเลิก</button><button class="btn">บันทึก</button></div>
      </form>`);
    $('#fCancel').onclick = closeModal;
    $('#gForm').onsubmit = e => {
      e.preventDefault();
      const plats = $$('input[name="fPlat"]:checked').map(x => x.value);
      if (!$('#fTitle').value.trim()) return toast('กรุณากรอกชื่อเกม', true);
      if (!plats.length) return toast('เลือกแพลตฟอร์มอย่างน้อย 1 รายการ', true);
      const data = {
        ...v, id: g?.id || uid('g'), title: $('#fTitle').value.trim(), genre: $('#fGenre').value, developer: $('#fDev').value.trim() || '-',
        platforms: plats, price: Math.max(0, +$('#fPrice').value || 0), discount: Math.min(90, Math.max(0, +$('#fDisc').value || 0)),
        release: $('#fRel').value || v.release, icon: $('#fIcon').value || '🎮', colors: [$('#fC1').value, $('#fC2').value],
        tags: $('#fTags').value.split(',').map(t => t.trim()).filter(Boolean), desc: $('#fDesc').value.trim(), featured: $('#fFeat').checked
      };
      DB.set('games', g ? games().map(x => x.id === g.id ? data : x) : [...games(), data]);
      closeModal(); toast(g ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มเกมใหม่แล้ว'); draw();
    };
  }
}

function adminOrders(el) {
  const list = orders().sort((a, b) => b.date.localeCompare(a.date));
  el.innerHTML = list.length ? `<div class="panel table-wrap"><table>
    <tr><th>เลขที่</th><th>ลูกค้า</th><th>วันที่</th><th>รายการ</th><th>คูปอง</th><th>ยอดรวม</th><th>สถานะ</th><th></th></tr>
    ${list.map(o => `<tr>
      <td><a href="#/order/${esc(o.id)}">${esc(o.id)}</a></td><td>${esc(o.user)}</td><td>${fmtDateTime(o.date)}</td>
      <td>${o.items.length} เกม</td><td>${esc(o.coupon || '-')}</td><td>${baht(o.total)}</td>
      <td><span class="status ${o.status}">${o.status === 'paid' ? 'ชำระแล้ว' : 'คืนเงินแล้ว'}</span></td>
      <td>${o.status === 'paid' ? `<button class="btn danger sm" data-refund="${esc(o.id)}">คืนเงิน</button>` : ''}</td>
    </tr>`).join('')}</table></div>` : '<div class="empty"><div class="e">🧾</div><p class="muted">ยังไม่มีคำสั่งซื้อ</p></div>';
  $$('[data-refund]').forEach(b => b.onclick = () => confirmBox(`คืนเงินคำสั่งซื้อ ${b.dataset.refund}? เกมจะถูกนำออกจากคลังของลูกค้า`, () => {
    DB.set('orders', orders().map(o => o.id === b.dataset.refund ? { ...o, status: 'refunded' } : o));
    toast('คืนเงินเรียบร้อย'); adminOrders(el);
  }));
}

function adminUsers(el) {
  const me = currentUser();
  el.innerHTML = `<div class="panel table-wrap"><table>
    <tr><th>ชื่อ</th><th>อีเมล</th><th>บทบาท</th><th>เกมในคลัง</th><th>สมัครเมื่อ</th><th></th></tr>
    ${users().map(u => `<tr>
      <td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role === 'admin' ? '🛡️ แอดมิน' : 'ผู้ใช้'}</td>
      <td>${ownedIds(u.email).size}</td><td>${fmtDate(u.created)}</td>
      <td>${u.email !== me.email ? `<button class="btn ghost sm" data-role="${esc(u.email)}">${u.role === 'admin' ? 'ลดเป็นผู้ใช้' : 'ตั้งเป็นแอดมิน'}</button>
        <button class="btn danger sm" data-deluser="${esc(u.email)}">ลบ</button>` : '<span class="muted small">(คุณ)</span>'}</td>
    </tr>`).join('')}</table></div>`;
  $$('[data-role]').forEach(b => b.onclick = () => {
    DB.set('users', users().map(u => u.email === b.dataset.role ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
    toast('เปลี่ยนบทบาทแล้ว'); adminUsers(el);
  });
  $$('[data-deluser]').forEach(b => b.onclick = () => confirmBox(`ลบผู้ใช้ ${b.dataset.deluser}?`, () => {
    DB.set('users', users().filter(u => u.email !== b.dataset.deluser)); toast('ลบผู้ใช้แล้ว'); adminUsers(el);
  }));
}

function adminCoupons(el) {
  el.innerHTML = `
    <form class="panel" id="cpForm" style="margin-bottom:16px">
      <h3>สร้างคูปองใหม่</h3>
      <div class="row">
        <div class="field"><label>โค้ด</label><input id="cpCode" required placeholder="SUMMER25" style="text-transform:uppercase"></div>
        <div class="field"><label>ประเภท</label><select id="cpType"><option value="percent">เปอร์เซ็นต์ (%)</option><option value="fixed">จำนวนเงิน (บาท)</option></select></div>
        <div class="field"><label>มูลค่า</label><input type="number" id="cpVal" min="1" required></div>
        <div class="field"><label>ยอดขั้นต่ำ</label><input type="number" id="cpMin" min="0" value="0"></div>
      </div>
      <button class="btn">สร้างคูปอง</button>
    </form>
    <div class="panel table-wrap"><table>
      <tr><th>โค้ด</th><th>ส่วนลด</th><th>ยอดขั้นต่ำ</th><th>ใช้ไปแล้ว</th><th>สถานะ</th><th></th></tr>
      ${coupons().map(c => `<tr>
        <td><span class="key">${esc(c.code)}</span></td>
        <td>${c.type === 'percent' ? c.value + '%' : baht(c.value)}</td><td>${baht(c.minTotal)}</td>
        <td>${orders().filter(o => o.coupon === c.code).length} ครั้ง</td>
        <td>${c.active ? '<span class="status paid">ใช้งาน</span>' : '<span class="status refunded">ปิด</span>'}</td>
        <td><button class="btn ghost sm" data-toggle="${esc(c.code)}">${c.active ? 'ปิด' : 'เปิด'}</button> <button class="btn danger sm" data-delcp="${esc(c.code)}">ลบ</button></td>
      </tr>`).join('')}
    </table></div>`;
  $('#cpForm').onsubmit = e => {
    e.preventDefault();
    const code = $('#cpCode').value.trim().toUpperCase().replace(/\s/g, '');
    const val = +$('#cpVal').value, type = $('#cpType').value;
    if (!code) return toast('กรุณากรอกโค้ด', true);
    if (coupons().some(c => c.code === code)) return toast('มีโค้ดนี้อยู่แล้ว', true);
    if (val <= 0 || (type === 'percent' && val > 100)) return toast('มูลค่าไม่ถูกต้อง', true);
    DB.set('coupons', [...coupons(), { code, type, value: val, minTotal: +$('#cpMin').value || 0, active: true }]);
    toast('สร้างคูปองแล้ว'); adminCoupons(el);
  };
  $$('[data-toggle]').forEach(b => b.onclick = () => { DB.set('coupons', coupons().map(c => c.code === b.dataset.toggle ? { ...c, active: !c.active } : c)); adminCoupons(el); });
  $$('[data-delcp]').forEach(b => b.onclick = () => confirmBox(`ลบคูปอง ${b.dataset.delcp}?`, () => { DB.set('coupons', coupons().filter(c => c.code !== b.dataset.delcp)); adminCoupons(el); }));
}

function adminMessages(el) {
  const list = DB.get('messages', []).slice().reverse();
  el.innerHTML = list.length ? list.map(m => `<div class="panel" style="margin-bottom:10px">
      <div class="review-head"><b>${esc(m.subject)}</b><span class="muted small">${esc(m.user)} · ${fmtDateTime(m.date)}</span></div>
      <p style="margin:8px 0 0">${esc(m.text)}</p></div>`).join('')
    : '<div class="empty"><div class="e">✉️</div><p class="muted">ยังไม่มีข้อความจากลูกค้า</p></div>';
}

// ================= Boot =================
seed();
$('#searchForm').onsubmit = e => {
  e.preventDefault();
  const q = $('#searchInput').value.trim();
  go('store' + (q ? '?q=' + encodeURIComponent(q) : ''));
};
$('#menuBtn').onclick = () => $('#nav').classList.toggle('open');
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
render();
