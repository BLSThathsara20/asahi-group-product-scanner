import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildStockTree } from '../../lib/stockTree';
import { LOW_STOCK_THRESHOLD } from '../../lib/stockAlerts';
import { NavIcon } from '../icons/NavIcons';
import { Card } from '../ui/Card';

function LowStockBadge({ count }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
      <NavIcon name="warning" className="w-3 h-3" />
      {count} low
    </span>
  );
}

function PartRow({ part }) {
  return (
    <Link
      to={`/inventory/${part.id}`}
      className={`block rounded-lg border px-3 py-2.5 transition-colors ${
        part.lowStock
          ? 'bg-red-50 border-red-100 hover:bg-red-100/70'
          : 'bg-white border-slate-100 hover:bg-slate-50'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`font-medium ${part.lowStock ? 'text-red-900' : 'text-slate-800'}`}>
          {part.name}
        </span>
        <span className={`tabular-nums text-sm font-semibold ${part.lowStock ? 'text-red-700' : 'text-slate-700'}`}>
          ×{part.quantity}
        </span>
      </div>
      {part.compatibleModels.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {part.compatibleModels.map((model) => (
            <span
              key={model}
              className="inline-block px-2 py-0.5 rounded-full bg-asahi/10 text-asahi text-xs font-medium"
            >
              {model}
            </span>
          ))}
        </div>
      )}
      {part.category && (
        <p className="mt-1 text-xs text-slate-400">{part.category}</p>
      )}
    </Link>
  );
}

function MakeSection({ make, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left"
      >
        <NavIcon
          name={open ? 'chevronDown' : 'chevronRight'}
          className="w-4 h-4 text-slate-500 shrink-0"
        />
        <NavIcon name="car" className="w-4 h-4 text-asahi shrink-0" />
        <span className="font-semibold text-slate-900">{make.make}</span>
        <span className="text-sm text-slate-500">
          {make.partCount} part{make.partCount === 1 ? '' : 's'} · {make.totalQuantity} units
        </span>
        <span className="text-xs text-slate-400">
          ({make.modelCount} model{make.modelCount === 1 ? '' : 's'})
        </span>
        <LowStockBadge count={make.lowStockCount} />
      </button>

      {open && (
        <div className="px-4 py-3 space-y-2 border-t border-slate-100">
          {make.parts.map((part) => (
            <PartRow key={part.id} part={part} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StockTreeView({ items, compact = false, className = '' }) {
  const tree = useMemo(() => buildStockTree(items), [items]);

  if (!items?.length) {
    return (
      <Card className={`p-6 text-center text-slate-500 text-sm ${className}`}>
        No spare parts to show in the stock tree.
      </Card>
    );
  }

  return (
    <div className={className}>
      {!compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Makes</p>
            <p className="text-2xl font-semibold text-slate-800">{tree.summary.makeCount}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Models</p>
            <p className="text-2xl font-semibold text-slate-800">{tree.summary.modelCount}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Parts</p>
            <p className="text-2xl font-semibold text-slate-800">{tree.summary.partCount}</p>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-100 p-3">
            <p className="text-xs text-red-600 uppercase tracking-wide">Low stock</p>
            <p className="text-2xl font-semibold text-red-700">{tree.summary.lowStockCount}</p>
            <p className="text-xs text-red-500 mt-0.5">below {LOW_STOCK_THRESHOLD} units</p>
          </div>
        </div>
      )}

      <p className="text-sm text-slate-500 mb-3">
        Each part is listed once. Compatible models (e.g. A1, A4, Q5) share the same physical stock.
      </p>

      <div className="space-y-3">
        {tree.makes.map((make) => (
          <MakeSection key={make.make} make={make} defaultOpen={make.isLowStock} />
        ))}

        {tree.unassigned.partCount > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <p className="font-semibold text-slate-800">Unassigned vehicle</p>
            <p className="text-sm text-slate-600 mt-1">
              {tree.unassigned.partCount} part{tree.unassigned.partCount === 1 ? '' : 's'} ·{' '}
              {tree.unassigned.totalQuantity} units
              {tree.unassigned.lowStockCount > 0 && (
                <span className="text-red-600"> · {tree.unassigned.lowStockCount} low stock</span>
              )}
            </p>
            <div className="mt-2 space-y-2">
              {tree.unassigned.items.map((part) => (
                <PartRow key={part.id} part={part} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
