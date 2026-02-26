import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useScanModal } from '../../context/ScanModalContext';
import { Logo } from './Logo';
import { NavIcon } from '../icons/NavIcons';

const mainNavItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/inventory', label: 'Spare Parts', icon: 'inventory' },
  { to: '/inventory/add', label: 'Add Spare Part', icon: 'add' },
  { scan: true, label: 'Scan QR', icon: 'scan' },
];

const moreNavItems = [
  { to: '/reports', label: 'Reports', icon: 'reports' },
  { to: '/analytics', label: 'Analytics', icon: 'analytics' },
  { to: '/categories', label: 'Categories', icon: 'folder', adminOnly: true },
  { to: '/health', label: 'Health', icon: 'health' },
  { to: '/users', label: 'Users', icon: 'users', adminOnly: true },
];

export function DesktopNav() {
  const [showMore, setShowMore] = useState(false);
  const { isAdmin } = useAuth();
  const { openScanModal } = useScanModal();

  const filteredMore = moreNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <Logo className="h-10 w-full object-contain" fallbackText="AsahiGroup" />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {mainNavItems.map((item) =>
          item.scan ? (
            <button
              key="scan"
              type="button"
              onClick={openScanModal}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 w-full text-left"
            >
              <NavIcon name={item.icon} className="w-5 h-5 shrink-0" />
              {item.label}
            </button>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/' || item.to === '/inventory'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-asahi/10 text-asahi' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <NavIcon name={item.icon} className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          )
        )}
        <div className="relative">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 w-full"
          >
            <NavIcon name="more" className="w-5 h-5 shrink-0" />
            More
          </button>
          {showMore && (
            <div className="absolute left-0 right-0 top-full mt-1 py-2 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
              {filteredMore.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <NavIcon name={icon} className="w-4 h-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
