import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // มี package-lock.json ค้างอยู่ใน home directory — ระบุ root ให้ชัดเพื่อไม่ให้ Next.js ใช้ไฟล์นั้น
  turbopack: { root: __dirname }
};

export default nextConfig;
