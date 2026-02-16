import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { DesktopNav } from './DesktopNav';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <DesktopNav />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden overflow-y-auto pb-24 md:pb-6">
          <Outlet />
        </main>
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
