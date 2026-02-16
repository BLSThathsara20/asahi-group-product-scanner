import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const mainNavItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/inventory/add', label: 'Add', icon: '➕' },
  { to: '/scan', label: 'Scan', icon: '📷' },
];

const moreNavItems = [
  { to: '/reports', label: 'Reports', icon: '📄' },
  { to: '/health', label: 'Health', icon: '❤️' },
  { to: '/users', label: 'Users', icon: '👥', adminOnly: true },
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
              <span className="text-xl mb-0.5">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center flex-1 py-2 text-xs transition-colors ${
              showMore ? 'text-asahi' : 'text-slate-500'
            }`}
          >
            <span className="text-xl mb-0.5">⊕</span>
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
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl border-t border-slate-200 p-4 pb-8 safe-area-pb animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">More</h3>
              <button onClick={() => setShowMore(false)} className="text-slate-400 hover:text-slate-600">
                ✕
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
                  <span className="text-2xl">{icon}</span>
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
