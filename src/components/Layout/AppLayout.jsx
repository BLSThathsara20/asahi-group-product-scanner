import { useRef, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { DesktopNav } from './DesktopNav';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';

const SCROLL_THRESHOLD = 10;

export function AppLayout() {
  const mainRef = useRef(null);
  const lastScrollY = useRef(0);
  const [headerVisible, setHeaderVisible] = useState(true);

  const handleScroll = useCallback(() => {
    const el = mainRef.current;
    if (!el) return;
    const scrollY = el.scrollTop;
    if (scrollY <= 0) {
      setHeaderVisible(true);
      lastScrollY.current = scrollY;
      return;
    }
    const delta = scrollY - lastScrollY.current;
    if (Math.abs(delta) < SCROLL_THRESHOLD) return;
    setHeaderVisible(delta < 0);
    lastScrollY.current = scrollY;
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <DesktopNav />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div
          className={`fixed left-0 right-0 top-0 z-30 md:relative md:translate-y-0 transition-transform duration-300 ease-out ${
            headerVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <Header />
        </div>
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 p-4 md:p-6 overflow-x-hidden overflow-y-auto pb-24 md:pb-6 pt-14 md:pt-6"
        >
          <Outlet />
        </main>
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
