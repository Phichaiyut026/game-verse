import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { QuickViewProvider } from '@/components/QuickView';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuickViewProvider>
      <Header />
      <main className="container page">{children}</main>
      <Footer />
    </QuickViewProvider>
  );
}
