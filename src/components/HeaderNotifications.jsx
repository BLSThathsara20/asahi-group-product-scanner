import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLowStockNotifications } from '../hooks/useLowStockNotifications';
import { NavIcon } from './icons/NavIcons';

export function HeaderNotifications() {
  const { items, count, refresh } = useLowStockNotifications();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const openDropdown = useCallback(() => {
    setOpen(true);
    refresh();
  }, [refresh]);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 120);
  }, []);

  const hasNotifications = count > 0;

  return (
    <div className="relative">
      <button
        onClick={() => (open ? close() : openDropdown())}
        className={`relative p-2 rounded-full hover:bg-slate-100 text-slate-600 ${
          hasNotifications ? 'animate-vibrate' : ''
        }`}
        style={hasNotifications ? { transformOrigin: 'top center' } : undefined}
        aria-label={`Notifications${hasNotifications ? ` (${count})` : ''}`}
        title={hasNotifications ? `${count} low stock item(s)` : 'Notifications'}
      >
        <NavIcon name="bell" className="w-5 h-5" />
        {hasNotifications && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className={`fixed inset-0 z-40 transition-opacity duration-150 ${closing ? 'opacity-0' : 'opacity-100'}`}
            onClick={close}
            aria-hidden="true"
          />
          <div
            className={`fixed left-4 right-4 top-16 md:absolute md:left-auto md:right-0 md:top-full md:mt-1 w-auto md:w-80 max-h-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden ${
              closing ? 'animate-dropdown-out' : 'animate-dropdown-in'
            }`}
          >
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Low Stock</h3>
              <button onClick={close} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
                <NavIcon name="close" className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No low stock items
                </div>
              ) : (
                items.map((item) => (
                  <Link
                    key={item.id}
                    to={`/inventory/${item.id}`}
                    onClick={close}
                    className="block px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                  >
                    <p className="font-medium text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Qty: {item.quantity ?? 0}
                      {item.reminder_count != null && ` (alert at ≤${item.reminder_count})`}
                      {item.category && ` • ${item.category}`}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">Restock needed</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
