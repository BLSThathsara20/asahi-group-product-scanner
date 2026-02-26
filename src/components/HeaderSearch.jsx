import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { Modal } from './ui/Modal';
import { Card } from './ui/Card';
import { NavIcon } from './icons/NavIcons';
import { StatusBadge } from './ui/StatusBadge';

export function HeaderSearch({ open, onClose }) {
  const { items, loading } = useItems();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const filtered = items.filter(
    (item) =>
      !query.trim() ||
      item.name?.toLowerCase().includes(query.toLowerCase()) ||
      item.qr_id?.toLowerCase().includes(query.toLowerCase()) ||
      item.category?.toLowerCase().includes(query.toLowerCase()) ||
      item.store_location?.toLowerCase().includes(query.toLowerCase()) ||
      item.vehicle_model?.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  return (
    <Modal onBackdropClick={onClose}>
      <Card className="p-4 max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-slate-800">Search Spare Parts</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <NavIcon name="close" className="w-5 h-5" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, code, category..."
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 outline-none mb-4"
        />
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <p className="text-slate-500 text-sm py-8 text-center">Loading...</p>
          ) : query.trim() ? (
            filtered.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">No items found</p>
            ) : (
              <ul className="space-y-2">
                {filtered.slice(0, 50).map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/inventory/${item.id}`}
                      onClick={onClose}
                      className="block p-3 rounded-lg border border-slate-200 hover:border-asahi/50 hover:bg-asahi/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 truncate">{item.name}</p>
                          {item.category && (
                            <p className="text-xs text-slate-500 mt-0.5">{item.category}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-medium text-slate-600">
                            {item.quantity ?? 0} in stock
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                      {item.qr_id && (
                        <p className="text-xs text-slate-400 font-mono mt-1">{item.qr_id}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <p className="text-slate-500 text-sm py-8 text-center">Type to search spare parts</p>
          )}
        </div>
        {query.trim() && filtered.length > 0 && (
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}
      </Card>
    </Modal>
  );
}
