import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLowStockNotifications } from '../hooks/useLowStockNotifications';
import { NavIcon } from './icons/NavIcons';
import { LOW_STOCK_THRESHOLD } from '../lib/stockAlerts';

export function HeaderNotifications() {
  const { groups, count, refresh } = useLowStockNotifications();
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
        title={hasNotifications ? `${count} model(s) need ordering` : 'Notifications'}
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
            className={`fixed left-4 right-4 top-16 md:absolute md:left-auto md:right-0 md:top-full md:mt-1 w-auto md:w-96 max-h-96 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden ${
              closing ? 'animate-dropdown-out' : 'animate-dropdown-in'
            }`}
          >
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Order alerts</h3>
              <button onClick={close} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
                <NavIcon name="close" className="w-4 h-4" />
              </button>
            </div>
            <p className="px-4 py-2 text-xs text-slate-500 border-b border-slate-50">
              Alerts when a make+model has less than {LOW_STOCK_THRESHOLD} units total across all compatible parts.
            </p>
            <div className="max-h-72 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  All models have enough stock
                </div>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.make}
                    className="px-4 py-3 border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      <NavIcon name="car" className="w-4 h-4 text-asahi shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800">{group.make}</p>
                        {group.models.length > 0 ? (
                          <>
                            <p className="text-sm text-red-700 mt-1 font-medium">
                              Order models:{' '}
                              {group.models
                                .map((row) => `${row.model} (${row.totalQuantity})`)
                                .join(', ')}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Checked across {group.parts.length} part
                              {group.parts.length === 1 ? '' : 's'} — no other stock covers these models.
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-red-700 mt-1 font-medium">
                            Low stock parts with no vehicle assigned
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {group.parts.map((part) => (
                            <Link
                              key={part.id}
                              to={`/inventory/${part.id}`}
                              onClick={close}
                              className="text-xs px-2 py-1 rounded-full bg-slate-100 text-asahi hover:bg-asahi/10"
                            >
                              {part.name} ×{part.quantity}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {groups.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <Link
                  to="/stock-tree"
                  onClick={close}
                  className="text-sm font-medium text-asahi hover:underline"
                >
                  View stock tree →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
