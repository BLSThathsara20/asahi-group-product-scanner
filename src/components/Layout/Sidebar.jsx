import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/inventory/add', label: 'Add Item', icon: '➕' },
  { to: '/scan', label: 'Scan QR', icon: '📷' },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-asahi">AsahiGroup</h2>
        <p className="text-xs text-slate-500 mt-0.5">UK</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/' || to === '/inventory'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-asahi/10 text-asahi'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
