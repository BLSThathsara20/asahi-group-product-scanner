import { useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useScanModal } from '../../context/ScanModalContext';
import { NavIcon } from '../icons/NavIcons';

const mainNavItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/inventory', label: 'Spare Parts', icon: 'inventory' },
  { to: '/inventory/add', label: 'Add', icon: 'add' },
  { scan: true, label: 'Scan', icon: 'scan' },
];

const moreNavItems = [
  { to: '/reports', label: 'Reports', icon: 'reports' },
  { to: '/analytics', label: 'Analytics', icon: 'analytics' },
  { to: '/categories', label: 'Categories', icon: 'folder', adminOnly: true },
  { to: '/health', label: 'Health', icon: 'health' },
  { to: '/users', label: 'Users', icon: 'users', adminOnly: true },
];

export function BottomNav() {
  const [showMore, setShowMore] = useState(false);
  const [moreClosing, setMoreClosing] = useState(false);
  const { isAdmin } = useAuth();

  const closeMore = useCallback(() => {
    setMoreClosing(true);
    setTimeout(() => {
      setShowMore(false);
      setMoreClosing(false);
    }, 200);
  }, []);
  const { openScanModal } = useScanModal();

  const filteredMore = moreNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {mainNavItems.map((item) =>
            item.scan ? (
              <button
                key="scan"
                type="button"
                onClick={openScanModal}
                className="flex flex-col items-center justify-center flex-1 py-2 text-xs text-slate-500"
              >
                <NavIcon name={item.icon} className="w-6 h-6 mb-0.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to === '/inventory'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-2 text-xs transition-colors ${
                    isActive ? 'text-asahi' : 'text-slate-500'
                  }`
                }
              >
                <NavIcon name={item.icon} className="w-6 h-6 mb-0.5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          )}
          <button
            onClick={() => (showMore ? closeMore() : setShowMore(true))}
            className={`flex flex-col items-center justify-center flex-1 py-2 text-xs transition-colors ${
              showMore ? 'text-asahi' : 'text-slate-500'
            }`}
          >
            <NavIcon name="more" className="w-6 h-6 mb-0.5 shrink-0" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {showMore && (
        <>
          <div
            className={`md:hidden fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${moreClosing ? 'opacity-0' : 'opacity-100'}`}
            onClick={closeMore}
            aria-hidden="true"
          />
          <div
            className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl border-t border-slate-200 p-4 pb-20 safe-area-pb ${
              moreClosing ? 'animate-slide-down' : 'animate-slide-up'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">More</h3>
              <button onClick={closeMore} className="text-slate-400 hover:text-slate-600 p-1">
                <NavIcon name="close" className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredMore.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMore}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <NavIcon name={icon} className="w-6 h-6 shrink-0" />
                  <span className="font-medium text-slate-800">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
