import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';

const mainNavItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/inventory/add', label: 'Add Item', icon: '➕' },
  { to: '/scan', label: 'Scan QR', icon: '📷' },
];

const moreNavItems = [
  { to: '/reports', label: 'Reports', icon: '📄' },
  { to: '/health', label: 'Health', icon: '❤️' },
  { to: '/users', label: 'Users', icon: '👥', adminOnly: true },
];

export function DesktopNav() {
  const [showMore, setShowMore] = useState(false);
  const { isAdmin } = useAuth();

  const filteredMore = moreNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <Logo className="h-10 w-full object-contain" fallbackText="AsahiGroup" />
        <p className="text-xs text-slate-500 mt-2">Inventory Management</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {mainNavItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-asahi/10 text-asahi' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            {label}
          </NavLink>
        ))}
        <div className="relative">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 w-full"
          >
            <span className="text-lg">⊕</span>
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
                  <span>{icon}</span>
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
