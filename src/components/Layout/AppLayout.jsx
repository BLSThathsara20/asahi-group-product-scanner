import { useRef, useState, useCallback, useEffect } from 'react';
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

  const handleScroll = useCallback((scrollY) => {
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

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => handleScroll(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  useEffect(() => {
    const onWindowScroll = () => {
      const scrollY = window.scrollY ?? document.documentElement.scrollTop;
      handleScroll(scrollY);
    };
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', onWindowScroll);
  }, [handleScroll]);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden md:min-h-screen md:h-auto md:overflow-visible">
      <DesktopNav />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden md:overflow-visible">
        <div
          className={`fixed left-0 right-0 top-0 z-30 md:relative md:translate-y-0 transition-transform duration-300 ease-out ${
            headerVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <Header />
        </div>
        <main
          ref={mainRef}
          className="flex-1 min-h-0 px-4 md:px-6 pt-16 md:pt-6 pb-24 md:pb-6 overflow-x-hidden overflow-y-auto overscroll-behavior-y-contain"
        >
          <Outlet />
          <Footer />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
