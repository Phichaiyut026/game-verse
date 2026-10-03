// ดึงข้อมูลเกมจริง (ชื่อ ราคาเงินบาท ส่วนลด ผู้พัฒนา วันวางจำหน่าย คำอธิบาย รูปปก ภาพหน้าจอ) จาก Steam Store API
// แล้วบันทึกเป็น src/lib/steam-catalog.json — รันใหม่เมื่อต้องการอัปเดตราคา/ส่วนลด:
//   npm run fetch:steam
import { writeFile } from 'node:fs/promises';

// รายการเกม: appid + ข้อมูลที่ร้านกำหนดเอง (ประเภท แท็ก แพลตฟอร์ม สี ไอคอนสำรอง)
const CATALOG = [
  { appid: 1938090, genre: 'ยิง', tags: ['ออนไลน์', 'สงคราม', 'แคมเปญ'], platforms: ['PC', 'PS5', 'Xbox'], colors: ['#4a4f2a', '#0d0f0a'], icon: 'crosshair', featured: true, fallbackPrice: 2299 },
  { appid: 252490, genre: 'เอาชีวิตรอด', tags: ['ผู้เล่นหลายคน', 'โอเพ่นเวิลด์', 'สร้างฐาน', 'PvP'], platforms: ['PC'], colors: ['#ce412b', '#1a0f0c'], icon: 'shield', featured: true },
  { appid: 107410, genre: 'จำลองสถานการณ์', tags: ['ทหาร', 'สมจริง', 'โอเพ่นเวิลด์', 'ผู้เล่นหลายคน'], platforms: ['PC'], colors: ['#5a6b3a', '#141810'], icon: 'crosshair', featured: true },
  { appid: 1874880, genre: 'จำลองสถานการณ์', tags: ['ทหาร', 'สมจริง', 'ผู้เล่นหลายคน'], platforms: ['PC', 'Xbox', 'PS5'], colors: ['#6b5a3a', '#151210'], icon: 'crosshair' },
  { appid: 221100, genre: 'เอาชีวิตรอด', tags: ['ซอมบี้', 'โอเพ่นเวิลด์', 'ผู้เล่นหลายคน'], platforms: ['PC', 'PS5', 'Xbox'], colors: ['#3a4a3a', '#0b0f0b'], icon: 'ghost' },
  { appid: 730, genre: 'ยิง', tags: ['ฟรีทูเพลย์', 'อีสปอร์ต', 'PvP', 'แข่งขัน'], platforms: ['PC'], colors: ['#d9a441', '#1b1b1b'], icon: 'crosshair', featured: true },
  { appid: 578080, genre: 'ยิง', tags: ['ฟรีทูเพลย์', 'แบทเทิลรอยัล', 'ผู้เล่นหลายคน'], platforms: ['PC', 'PS5', 'Xbox'], colors: ['#e2a33b', '#1a140a'], icon: 'crosshair' },
  { appid: 1172470, genre: 'ยิง', tags: ['ฟรีทูเพลย์', 'แบทเทิลรอยัล', 'ฮีโร่ชูตเตอร์'], platforms: ['PC', 'PS5', 'Xbox', 'Switch'], colors: ['#c8392f', '#1a0d0c'], icon: 'crosshair' },
  { appid: 570, genre: 'วางแผน', tags: ['ฟรีทูเพลย์', 'MOBA', 'อีสปอร์ต'], platforms: ['PC'], colors: ['#a3271c', '#120808'], icon: 'swords' },
  { appid: 3240220, genre: 'แอ็กชัน', tags: ['โอเพ่นเวิลด์', 'อาชญากรรม', 'ผู้เล่นหลายคน'], platforms: ['PC', 'PS5', 'Xbox'], colors: ['#3d8f4a', '#0c160e'], icon: 'car', featured: true },
  { appid: 1174180, genre: 'แอ็กชัน', tags: ['โอเพ่นเวิลด์', 'คาวบอย', 'เนื้อเรื่องเข้มข้น'], platforms: ['PC', 'PS5', 'Xbox'], colors: ['#a3271c', '#1a0c08'], icon: 'shield' },
  { appid: 1245620, genre: 'RPG', tags: ['โซลส์ไลก์', 'โอเพ่นเวิลด์', 'แฟนตาซี'], platforms: ['PC', 'PS5', 'Xbox'], colors: ['#b39352', '#15120b'], icon: 'swords', featured: true },
  { appid: 1091500, genre: 'RPG', tags: ['ไซเบอร์พังก์', 'โอเพ่นเวิลด์', 'เนื้อเรื่องเข้มข้น'], platforms: ['PC', 'PS5', 'Xbox'], colors: ['#f2e600', '#1a0f1f'], icon: 'glasses' },
  { appid: 1086940, genre: 'RPG', tags: ['เทิร์นเบส', 'แฟนตาซี', 'Co-op'], platforms: ['PC', 'PS5', 'Xbox'], colors: ['#8a5a2b', '#120c08'], icon: 'swords' },
  { appid: 292030, genre: 'RPG', tags: ['โอเพ่นเวิลด์', 'แฟนตาซี', 'เนื้อเรื่องเข้มข้น'], platforms: ['PC', 'PS5', 'Xbox', 'Switch'], colors: ['#9b2c2c', '#120a0a'], icon: 'sword' },
  { appid: 2358720, genre: 'แอ็กชัน', tags: ['โซลส์ไลก์', 'ตำนานจีน', 'ต่อสู้'], platforms: ['PC', 'PS5'], colors: ['#c79a4a', '#140f08'], icon: 'sword' },
  { appid: 553850, genre: 'ยิง', tags: ['Co-op', 'ไซไฟ', 'ผู้เล่นหลายคน'], platforms: ['PC', 'PS5', 'Xbox'], colors: ['#e3c23b', '#14120a'], icon: 'crosshair' },
  { appid: 1623730, genre: 'เอาชีวิตรอด', tags: ['สร้างฐาน', 'Co-op', 'เลี้ยงมอนสเตอร์'], platforms: ['PC', 'Xbox', 'PS5'], colors: ['#3fa3d9', '#0b1620'], icon: 'gamepad' },
  { appid: 1326470, genre: 'เอาชีวิตรอด', tags: ['สยองขวัญ', 'Co-op', 'สร้างฐาน'], platforms: ['PC'], colors: ['#3a5a3a', '#0a100a'], icon: 'ghost' },
  { appid: 413150, genre: 'จำลองสถานการณ์', tags: ['ทำฟาร์ม', 'ผ่อนคลาย', 'Co-op', 'พิกเซลอาร์ต'], platforms: ['PC', 'PS5', 'Xbox', 'Switch'], colors: ['#7cc36b', '#22577a'], icon: 'wheat' },
  { appid: 105600, genre: 'ผจญภัย', tags: ['แซนด์บ็อกซ์', 'Co-op', 'พิกเซลอาร์ต'], platforms: ['PC', 'PS5', 'Xbox', 'Switch'], colors: ['#4aa3df', '#0e2a3d'], icon: 'gamepad' },
  { appid: 1551360, genre: 'แข่งรถ', tags: ['โอเพ่นเวิลด์', 'ผู้เล่นหลายคน', 'สมจริง'], platforms: ['PC', 'Xbox', 'PS5'], colors: ['#e86a92', '#1a0d14'], icon: 'car' },
  { appid: 227300, genre: 'จำลองสถานการณ์', tags: ['ขับรถบรรทุก', 'ผ่อนคลาย', 'สมจริง'], platforms: ['PC'], colors: ['#2f6db3', '#0b1626'], icon: 'car' },
  { appid: 367520, genre: 'แพลตฟอร์ม', tags: ['เมทรอยด์เวเนีย', 'อินดี้', 'ยาก'], platforms: ['PC', 'PS5', 'Xbox', 'Switch'], colors: ['#5d7a9c', '#0a0e14'], icon: 'shield' },
  { appid: 393380, genre: 'ยิง', tags: ['ทหาร', 'สมจริง', 'ทีมเวิร์ก'], platforms: ['PC'], colors: ['#6b6b4a', '#121210'], icon: 'crosshair' },
  { appid: 1144200, genre: 'ยิง', tags: ['ตำรวจ', 'วางแผน', 'Co-op'], platforms: ['PC', 'PS5', 'Xbox'], colors: ['#2a3a5a', '#0a0d14'], icon: 'crosshair' }
];

const MONTHS = { 'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12 };
function parseDate(text) {
  const m = /(\d{1,2})\s+(\S+)\s+(\d{4})/.exec(text ?? '');
  if (m && MONTHS[m[2]]) {
    let y = +m[3];
    if (y > 2400) y -= 543; // ปี พ.ศ.
    return `${y}-${String(MONTHS[m[2]]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  const d = new Date(text);
  return isNaN(d) ? '2020-01-01' : d.toISOString().slice(0, 10);
}
const stripHtml = s => (s ?? '').replace(/<[^>]*>/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const noQuery = url => (url ?? '').split('?')[0];
const sleep = ms => new Promise(r => setTimeout(r, ms));

const out = [];
for (const item of CATALOG) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${item.appid}&cc=th&l=thai`;
  let data = null;
  for (let attempt = 0; attempt < 3 && !data; attempt++) {
    try {
      const res = await fetch(url);
      const json = await res.json();
      data = json?.[item.appid]?.success ? json[item.appid].data : null;
    } catch { /* retry */ }
    if (!data) await sleep(1500);
  }
  if (!data) { console.warn(`ข้าม ${item.appid}: ดึงข้อมูลไม่สำเร็จ`); continue; }

  const po = data.price_overview;
  const price = data.is_free ? 0 : po ? Math.round(po.initial / 100) : item.fallbackPrice ?? null;
  // เกมที่ขายเป็นแพ็กเกจจะไม่มี price_overview — ถ้าไม่ได้กำหนดราคาสำรองไว้ อย่าแสดงเป็น "ฟรี"
  if (price === null) { console.warn(`ข้าม ${data.name}: ไม่มีราคาใน API (ใส่ fallbackPrice ใน CATALOG)`); continue; }
  const discount = po?.discount_percent ?? 0;
  // คะแนนรีวิวจริงจาก Steam: แปลง % รีวิวเชิงบวกเป็นคะแนน 1–5
  let rating = 4, reviewCount = 0;
  try {
    const r = await (await fetch(`https://store.steampowered.com/appreviews/${item.appid}?json=1&language=all&purchase_type=all&num_per_page=0`)).json();
    const q = r?.query_summary;
    if (q?.total_reviews) {
      reviewCount = q.total_reviews;
      rating = Math.round((1 + 4 * (q.total_positive / q.total_reviews)) * 100) / 100;
    }
  } catch { /* ใช้ค่าเริ่มต้น */ }
  // ปกแนวตั้ง 600x900 (บางเกมไม่มี — ตรวจก่อนใช้)
  const portraitUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.appid}/library_600x900.jpg`;
  let portrait;
  try { if ((await fetch(portraitUrl, { method: 'HEAD' })).ok) portrait = portraitUrl; } catch { /* ไม่มีปกแนวตั้ง */ }
  const shots = (data.screenshots ?? []).slice(0, 6).map(s => ({ thumb: noQuery(s.path_thumbnail), full: noQuery(s.path_full) }));

  out.push({
    id: `s${item.appid}`,
    appid: item.appid,
    title: data.name.replace(/®|™/g, '').trim(),
    genre: item.genre,
    platforms: item.platforms,
    price,
    discount,
    rating,
    reviewCount,
    release: parseDate(data.release_date?.date),
    developer: (data.developers ?? ['-'])[0],
    publisher: (data.publishers ?? ['-'])[0],
    colors: item.colors,
    icon: item.icon,
    featured: !!item.featured,
    tags: item.tags,
    desc: stripHtml(data.short_description),
    image: noQuery(data.header_image),
    portrait,
    shots
  });
  console.log(`✓ ${data.name} — ${price ? `฿${price}` : 'ฟรี'}${discount ? ` (-${discount}%)` : ''}, ภาพหน้าจอ ${shots.length}, รีวิว ${reviewCount.toLocaleString()} (${rating})`);
  await sleep(400); // เว้นจังหวะเพื่อไม่ยิง API ถี่เกินไป
}

await writeFile(new URL('../src/lib/steam-catalog.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`\nบันทึก ${out.length} เกมลง src/lib/steam-catalog.json แล้ว`);
