import type { Metadata } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import { ToastProvider } from '@/components/Toast';
import { StoreProvider } from '@/lib/store';
import './globals.css';

const thai = Noto_Sans_Thai({ subsets: ['thai', 'latin'], weight: ['300', '400', '500', '700'], variable: '--font-thai' });

export const metadata: Metadata = {
  title: { default: 'GameVerse — ร้านขายเกมออนไลน์', template: '%s | GameVerse' },
  description: 'ร้านเกมดิจิทัลที่รวมเกมดังทุกแพลตฟอร์ม ได้คีย์ทันทีหลังชำระเงิน'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={thai.variable} data-scroll-behavior="smooth">
      <body>
        <ToastProvider>
          <StoreProvider>
            {children}
          </StoreProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
