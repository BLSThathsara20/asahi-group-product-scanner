import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { NavIcon } from '../icons/NavIcons';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/inventory', label: 'Spare Parts', icon: 'inventory' },
  { to: '/inventory/add', label: 'Add Spare Part', icon: 'add' },
  { to: '/scan', label: 'Scan QR', icon: 'scan' },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <Logo className="h-8 w-full object-contain" fallbackText="AsahiGroup" />
        <p className="text-xs text-slate-500 mt-2">UK</p>
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
            <NavIcon name={icon} className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
