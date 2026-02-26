import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { getTransactionsWithItems } from '../services/analyticsService';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function formatDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export function Analytics() {
  const { items } = useItems();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all | out | in
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(20);
  const [dayPage, setDayPage] = useState(1);
  const [dayPageSize, setDayPageSize] = useState(10);

  useEffect(() => {
    getTransactionsWithItems()
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    (items || []).forEach((i) => {
      const c = i.category?.trim();
      if (c) set.add(c);
    });
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = transactions;
    if (dateFrom) {
      list = list.filter((t) => new Date(t.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      list = list.filter((t) => new Date(t.created_at) <= end);
    }
    if (typeFilter === 'out') list = list.filter((t) => t.type === 'out');
    if (typeFilter === 'in') list = list.filter((t) => t.type === 'in');
    if (categoryFilter) {
      list = list.filter((t) => t.item?.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.item?.name?.toLowerCase().includes(q) ||
          t.item?.qr_id?.toLowerCase().includes(q) ||
          t.purpose?.toLowerCase().includes(q) ||
          t.recipient_name?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, dateFrom, dateTo, typeFilter, categoryFilter, search]);

  const checkoutByDay = useMemo(() => {
    const byDay = {};
    filtered
      .filter((t) => t.type === 'out')
      .forEach((t) => {
        const d = new Date(t.created_at).toDateString();
        if (!byDay[d]) byDay[d] = [];
        byDay[d].push(t);
      });
    return Object.entries(byDay)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([date, txs]) => ({ date, transactions: txs }));
  }, [filtered]);

  const paginatedTx = useMemo(() => {
    const start = (txPage - 1) * txPageSize;
    return filtered.slice(start, start + txPageSize);
  }, [filtered, txPage, txPageSize]);

  const paginatedDays = useMemo(() => {
    const start = (dayPage - 1) * dayPageSize;
    return checkoutByDay.slice(start, start + dayPageSize);
  }, [checkoutByDay, dayPage, dayPageSize]);

  useEffect(() => {
    setTxPage(1);
    setDayPage(1);
  }, [dateFrom, dateTo, typeFilter, categoryFilter, search]);

  const stats = useMemo(() => {
    const outs = filtered.filter((t) => t.type === 'out');
    const ins = filtered.filter((t) => t.type === 'in');
    const totalOutQty = outs.reduce((s, t) => s + (t.quantity ?? 1), 0);
    const totalInQty = ins.reduce((s, t) => s + (t.quantity ?? 1), 0);
    return {
      checkouts: outs.length,
      checkins: ins.length,
      totalOutQty,
      totalInQty,
    };
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
      <p className="text-sm text-slate-500">
        View checkouts, check-ins, and filter by date, product, or category.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Checkouts</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.checkouts}</p>
          <p className="text-xs text-slate-400 mt-0.5">{stats.totalOutQty} items</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Check-ins</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.checkins}</p>
          <p className="text-xs text-slate-400 mt-0.5">{stats.totalInQty} items</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Total transactions</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{filtered.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Items in stock</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{items?.length ?? 0}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <h3 className="font-semibold text-slate-800 mb-4">Filters</h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">From date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">To date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="all">All</option>
              <option value="out">Checkout only</option>
              <option value="in">Check-in only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm min-w-[140px]"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-slate-500 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product, purpose, recipient..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Checkouts by day */}
      {checkoutByDay.length > 0 && (
        <Card className="p-4 overflow-hidden">
          <h3 className="font-semibold text-slate-800 mb-4">Checkouts by day ({checkoutByDay.length} days)</h3>
          <div className="space-y-4">
            {paginatedDays.map(({ date, transactions: txs }) => (
              <div key={date} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                <p className="font-medium text-slate-700 mb-2">{formatDate(date)}</p>
                <div className="space-y-2 pl-2">
                  {txs.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center gap-2 text-sm text-slate-600"
                    >
                      <span className="font-medium text-slate-800">
                        {t.item?.name || 'Unknown item'}
                      </span>
                      {(t.quantity ?? 1) > 1 && (
                        <span className="text-slate-500">×{t.quantity}</span>
                      )}
                      {t.purpose && (
                        <span className="text-slate-500">— {t.purpose}</span>
                      )}
                      {t.recipient_name && (
                        <span className="text-slate-400">→ {t.recipient_name}</span>
                      )}
                      {t.item?.id && (
                        <Link
                          to={`/inventory/${t.item.id}`}
                          className="text-asahi hover:underline text-xs"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={dayPage}
            totalItems={checkoutByDay.length}
            pageSize={dayPageSize}
            onPageChange={setDayPage}
            onPageSizeChange={(s) => { setDayPageSize(s); setDayPage(1); }}
          />
        </Card>
      )}

      {/* Transaction list */}
      <Card className="p-4 overflow-hidden">
        <h3 className="font-semibold text-slate-800 mb-4">
          All transactions ({filtered.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Date</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Type</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Product</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Qty</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Purpose</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Recipient</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTx.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-600">{formatDateTime(t.created_at)}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        t.type === 'out'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {t.type === 'out' ? 'Checkout' : 'Check-in'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {t.item?.id ? (
                      <Link
                        to={`/inventory/${t.item.id}`}
                        className="text-asahi hover:underline font-medium"
                      >
                        {t.item?.name || '—'}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3">{t.quantity ?? 1}</td>
                  <td className="py-2 px-3 text-slate-600 max-w-[180px] truncate" title={t.purpose}>
                    {t.purpose || '—'}
                  </td>
                  <td className="py-2 px-3 text-slate-600">{t.recipient_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={txPage}
          totalItems={filtered.length}
          pageSize={txPageSize}
          onPageChange={setTxPage}
          onPageSizeChange={(s) => { setTxPageSize(s); setTxPage(1); }}
        />
      </Card>
    </div>
  );
}
