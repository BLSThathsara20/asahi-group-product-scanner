import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NavIcon } from '../icons/NavIcons';

const mainNavItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/inventory', label: 'Spare Parts', icon: 'inventory' },
  { to: '/inventory/add', label: 'Add', icon: 'add' },
  { to: '/scan', label: 'Scan', icon: 'scan' },
];

const moreNavItems = [
  { to: '/reports', label: 'Reports', icon: 'reports' },
  { to: '/health', label: 'Health', icon: 'health' },
  { to: '/users', label: 'Users', icon: 'users', adminOnly: true },
];

export function BottomNav() {
  const [showMore, setShowMore] = useState(false);
  const { isAdmin } = useAuth();

  const filteredMore = moreNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {mainNavItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/' || to === '/inventory'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-2 text-xs transition-colors ${
                  isActive ? 'text-asahi' : 'text-slate-500'
                }`
              }
            >
              <NavIcon name={icon} className="w-6 h-6 mb-0.5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setShowMore(!showMore)}
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
            className="md:hidden fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowMore(false)}
          />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl border-t border-slate-200 p-4 pb-20 safe-area-pb animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">More</h3>
              <button onClick={() => setShowMore(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <NavIcon name="close" className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredMore.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setShowMore(false)}
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
