import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const add = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const remove = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = {
    notifications,
    add,
    remove,
    success: (msg, duration) => add({ type: 'success', message: msg, duration }),
    error: (msg, duration) => add({ type: 'error', message: msg, duration }),
    info: (msg, duration) => add({ type: 'info', message: msg, duration }),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, remove } = useContext(NotificationContext);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-50 space-y-2 pointer-events-none">
      <div className="pointer-events-auto space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm animate-slide-up ${
              n.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : n.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <span className="text-lg">
              {n.type === 'success' ? '✓' : n.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <p className="flex-1 text-sm font-medium">{n.message}</p>
            <button
              onClick={() => remove(n.id)}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
