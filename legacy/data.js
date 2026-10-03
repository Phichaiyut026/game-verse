// ข้อมูลเริ่มต้นของร้าน (seed) — ถูกคัดลอกลง localStorage ในการเปิดครั้งแรก
const SEED_GAMES = [
  { id: 'g1', title: 'Neon Drift 2077', genre: 'แข่งรถ', platforms: ['PC', 'PS5'], price: 1290, discount: 30, rating: 4.6, release: '2026-08-12', developer: 'Pulse Studio', colors: ['#ff2e93', '#3a0ca3'], icon: '🏎️', featured: true, stock: 999, tags: ['ออนไลน์', 'โอเพ่นเวิลด์'], desc: 'ซิ่งไปบนถนนไซเบอร์พังก์ยามค่ำคืน ปรับแต่งรถได้กว่า 500 ชิ้นส่วน แข่งออนไลน์ได้สูงสุด 16 คน' },
  { id: 'g2', title: 'Kingdom of Ashes', genre: 'RPG', platforms: ['PC', 'PS5', 'Xbox'], price: 1890, discount: 0, rating: 4.8, release: '2026-05-20', developer: 'Ember Forge', colors: ['#f77f00', '#370617'], icon: '🐉', featured: true, stock: 999, tags: ['แฟนตาซี', 'เนื้อเรื่องเข้มข้น'], desc: 'ออกผจญภัยในอาณาจักรที่ถูกเผาด้วยไฟมังกร สร้างตัวละคร เลือกเส้นทาง และกำหนดชะตากรรมของโลก' },
  { id: 'g3', title: 'Pixel Farm Story', genre: 'จำลองสถานการณ์', platforms: ['PC', 'Switch'], price: 390, discount: 20, rating: 4.7, release: '2025-11-02', developer: 'Cozy Bits', colors: ['#80ed99', '#22577a'], icon: '🌾', featured: false, stock: 999, tags: ['ผ่อนคลาย', 'เล่นกับเพื่อน'], desc: 'ปลูกผัก เลี้ยงสัตว์ และสร้างฟาร์มในฝัน พร้อมโหมดเล่นร่วมกับเพื่อน 4 คน' },
  { id: 'g4', title: 'Shadow Protocol', genre: 'แอ็กชัน', platforms: ['PC', 'PS5', 'Xbox'], price: 1590, discount: 50, rating: 4.4, release: '2025-09-15', developer: 'Silent Unit', colors: ['#4361ee', '#0b090a'], icon: '🕶️', featured: true, stock: 999, tags: ['ลอบเร้น', 'สายลับ'], desc: 'เกมสายลับลอบเร้นที่ทุกภารกิจเล่นได้หลายวิธี แทรกซึม เจาะระบบ หรือบุกตรงก็ได้' },
  { id: 'g5', title: 'Galaxy Tactics', genre: 'วางแผน', platforms: ['PC'], price: 790, discount: 0, rating: 4.5, release: '2026-02-10', developer: 'Orbit Minds', colors: ['#7209b7', '#03045e'], icon: '🚀', featured: false, stock: 999, tags: ['อวกาศ', 'เทิร์นเบส'], desc: 'บัญชาการกองยานอวกาศในสงครามข้ามกาแล็กซี วางแผนแบบเทิร์นเบสที่ลึกและท้าทาย' },
  { id: 'g6', title: 'Haunted Hollow', genre: 'สยองขวัญ', platforms: ['PC', 'PS5'], price: 990, discount: 25, rating: 4.3, release: '2025-10-31', developer: 'Night Lantern', colors: ['#2b2d42', '#8d0801'], icon: '👻', featured: false, stock: 999, tags: ['เอาชีวิตรอด', 'ไขปริศนา'], desc: 'ติดอยู่ในหมู่บ้านร้างที่มีความลับซ่อนอยู่ ไขปริศนาและเอาชีวิตรอดจนรุ่งเช้า' },
  { id: 'g7', title: 'Football Legends 26', genre: 'กีฬา', platforms: ['PC', 'PS5', 'Xbox', 'Switch'], price: 1690, discount: 10, rating: 4.1, release: '2025-09-26', developer: 'Goal Line', colors: ['#06d6a0', '#073b4c'], icon: '⚽', featured: false, stock: 999, tags: ['ออนไลน์', 'ลิขสิทธิ์ทีม'], desc: 'ฟุตบอลสมจริงพร้อมทีมจากทั่วโลก โหมดอาชีพ ผู้จัดการทีม และแข่งออนไลน์จัดอันดับ' },
  { id: 'g8', title: 'Tiny Knights', genre: 'แพลตฟอร์ม', platforms: ['PC', 'Switch'], price: 290, discount: 0, rating: 4.9, release: '2026-01-18', developer: 'Little Giant', colors: ['#ffd166', '#ef476f'], icon: '🛡️', featured: false, stock: 999, tags: ['อินดี้', 'พิกเซลอาร์ต'], desc: 'อัศวินตัวจิ๋วกับการผจญภัยแบบแพลตฟอร์ม 2D ที่ทั้งน่ารักและยากสุดหิน' },
  { id: 'g9', title: 'Mecha Arena', genre: 'แอ็กชัน', platforms: ['PC', 'PS5', 'Xbox'], price: 0, discount: 0, rating: 4.0, release: '2026-06-01', developer: 'Iron Core', colors: ['#adb5bd', '#212529'], icon: '🤖', featured: false, stock: 999, tags: ['ฟรีทูเพลย์', 'PvP'], desc: 'เกมยิงหุ่นยนต์ 5v5 เล่นฟรี! ประกอบหุ่นตามสไตล์ของคุณแล้วลงสนามได้เลย' },
  { id: 'g10', title: 'Ocean Odyssey', genre: 'ผจญภัย', platforms: ['PC', 'PS5', 'Switch'], price: 890, discount: 15, rating: 4.6, release: '2026-03-22', developer: 'Blue Current', colors: ['#00b4d8', '#023e8a'], icon: '🐋', featured: true, stock: 999, tags: ['สำรวจ', 'โอเพ่นเวิลด์'], desc: 'ดำดิ่งสู่มหาสมุทรลึก สำรวจซากเมืองโบราณใต้ทะเลและสัตว์ทะเลนับร้อยสายพันธุ์' },
  { id: 'g11', title: 'Chef Rush', genre: 'ปาร์ตี้', platforms: ['PC', 'Switch', 'PS5'], price: 490, discount: 40, rating: 4.5, release: '2025-07-07', developer: 'Spicy Pan', colors: ['#fb8500', '#ffb703'], icon: '🍳', featured: false, stock: 999, tags: ['เล่นกับเพื่อน', 'ตลก'], desc: 'ทำอาหารให้ทันออเดอร์ในครัวสุดวุ่นวาย สนุกที่สุดเมื่อเล่นกับเพื่อน 4 คน' },
  { id: 'g12', title: 'Samurai Ronin', genre: 'แอ็กชัน', platforms: ['PS5', 'PC'], price: 1990, discount: 0, rating: 4.9, release: '2026-09-09', developer: 'Katana Works', colors: ['#d00000', '#1b1b1e'], icon: '⚔️', featured: true, stock: 999, tags: ['ญี่ปุ่น', 'ต่อสู้'], desc: 'ซามูไรไร้นายในญี่ปุ่นยุคเอโดะ ระบบดาบที่แม่นยำ ทุกการปะทะคือความเป็นความตาย' },
  { id: 'g13', title: 'City Architect', genre: 'จำลองสถานการณ์', platforms: ['PC'], price: 690, discount: 0, rating: 4.2, release: '2025-12-12', developer: 'Grid Labs', colors: ['#90e0ef', '#0077b6'], icon: '🏙️', featured: false, stock: 999, tags: ['สร้างเมือง', 'วางแผน'], desc: 'ออกแบบมหานครของคุณเอง ตั้งแต่ถนน ระบบขนส่ง ไปจนถึงเศรษฐกิจของเมือง' },
  { id: 'g14', title: 'Puzzle Garden', genre: 'ปริศนา', platforms: ['PC', 'Switch'], price: 190, discount: 0, rating: 4.4, release: '2026-04-04', developer: 'Petal Games', colors: ['#ffafcc', '#a2d2ff'], icon: '🌸', featured: false, stock: 999, tags: ['ผ่อนคลาย', 'อินดี้'], desc: 'ปริศนาจัดสวนกว่า 200 ด่าน ฝึกสมองแบบชิล ๆ พร้อมดนตรีบรรเลงเพราะ ๆ' },
  { id: 'g15', title: 'Wasteland Rebels', genre: 'ยิง', platforms: ['PC', 'PS5', 'Xbox'], price: 1490, discount: 35, rating: 4.3, release: '2025-08-19', developer: 'Dust Crew', colors: ['#bc6c25', '#283618'], icon: '🔫', featured: false, stock: 999, tags: ['หลังวันสิ้นโลก', 'Co-op'], desc: 'เกมยิงมุมมองบุคคลที่หนึ่งในโลกหลังหายนะ ร่วมมือกับเพื่อนสร้างฐานและต่อสู้กับแก๊งโจร' },
  { id: 'g16', title: 'Dragon Card Duel', genre: 'วางแผน', platforms: ['PC', 'Switch'], price: 350, discount: 0, rating: 4.1, release: '2026-07-15', developer: 'Deck Masters', colors: ['#9d4edd', '#240046'], icon: '🃏', featured: false, stock: 999, tags: ['การ์ด', 'ออนไลน์'], desc: 'จัดเด็คการ์ดมังกรกว่า 400 ใบ ดวลกับผู้เล่นทั่วโลกในโหมดจัดอันดับ' }
];

const SEED_COUPONS = [
  { code: 'WELCOME10', type: 'percent', value: 10, minTotal: 0, active: true },
  { code: 'SAVE100', type: 'fixed', value: 100, minTotal: 1000, active: true },
  { code: 'GAMER20', type: 'percent', value: 20, minTotal: 1500, active: true }
];

// บัญชีทดสอบสำหรับเดโม (ระบบนี้เป็นเดโมฝั่งเบราว์เซอร์เท่านั้น)
const SEED_USERS = [
  { email: 'admin@gamestore.test', name: 'ผู้ดูแลระบบ', password: 'admin123', role: 'admin' },
  { email: 'demo@gamestore.test', name: 'ผู้ใช้ทดลอง', password: 'demo123', role: 'user' }
];

const SEED_REVIEWS = [
  { gameId: 'g2', user: 'ผู้ใช้ทดลอง', rating: 5, text: 'เนื้อเรื่องดีมาก เล่นไป 80 ชั่วโมงยังไม่เบื่อ', date: '2026-06-02' },
  { gameId: 'g2', user: 'Mint', rating: 4, text: 'กราฟิกสวย แต่บางด่านยากไปหน่อย', date: '2026-06-10' },
  { gameId: 'g8', user: 'Beam', rating: 5, text: 'เกมอินดี้ที่ดีที่สุดของปี!', date: '2026-02-01' },
  { gameId: 'g12', user: 'Ton', rating: 5, text: 'ระบบต่อสู้มันส์สุด ๆ', date: '2026-09-15' },
  { gameId: 'g1', user: 'Fah', rating: 4, text: 'แต่งรถสนุกมาก โหมดออนไลน์ลื่น', date: '2026-08-20' }
];
