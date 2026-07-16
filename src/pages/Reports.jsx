import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { useAuth } from '../context/AuthContext';
import { exportInventoryPDF, exportInventoryCSV, exportDailyReportPDF } from '../services/reportService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNotification } from '../context/NotificationContext';
import { LOW_STOCK_THRESHOLD } from '../lib/stockAlerts';
import { getModelOrderAlerts } from '../lib/stockTree';
import { StockTreeView } from '../components/Stock/StockTreeView';
import {
  PageContainer,
  PageHeader,
  PageSkeleton,
  filterSelectClass,
} from '../components/ui/PageLayout';

export function Reports() {
  const { items, loading } = useItems();
  const { profile, user } = useAuth();
  const { success, error } = useNotification();
  const [exporting, setExporting] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  const exportedBy = profile?.full_name?.trim() || user?.email || 'Unknown user';

  const categoriesWithCount = useMemo(() => {
    const counts = {};
    (items || []).forEach((i) => {
      const c = i.category?.trim();
      if (c) counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!categoryFilter.trim()) return items || [];
    return (items || []).filter((i) => (i.category || '').trim() === categoryFilter);
  }, [items, categoryFilter]);

  const handlePDF = async () => {
    setExporting('pdf');
    try {
      await exportInventoryPDF(filteredItems, categoryFilter || null, exportedBy);
      success('PDF downloaded');
    } catch (err) {
      error(err.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleCSV = async () => {
    setExporting('csv');
    try {
      exportInventoryCSV(filteredItems, categoryFilter || null);
      success('CSV downloaded');
    } catch (err) {
      error(err.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleDailyPDF = async () => {
    setExporting('daily');
    try {
      await exportDailyReportPDF(items || [], exportedBy);
      success('Daily report downloaded');
    } catch (err) {
      error(err.message || 'Daily report export failed');
    } finally {
      setExporting(null);
    }
  };

  const orderAlertCount = useMemo(
    () => getModelOrderAlerts(items || []).length,
    [items]
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        subtitle="Export spare parts inventory and daily stock summaries"
      />

      <Card className="p-5 sm:p-6 mb-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Daily report</h2>
            <p className="text-sm text-slate-500 mt-1">
              PDF with today&apos;s check-ins and check-outs, models to order (below {LOW_STOCK_THRESHOLD} total per model),
              current stock, and stock-by-vehicle tree.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            <strong className="text-slate-700">{orderAlertCount}</strong> model
            {orderAlertCount === 1 ? '' : 's'} need ordering right now.
          </p>
          <Button onClick={handleDailyPDF} disabled={exporting || (items || []).length === 0}>
            {exporting === 'daily' ? 'Generating…' : 'Download daily report PDF'}
          </Button>
          <p className="text-xs text-slate-500">
            Daily PDF includes the vehicle stock tree at the bottom.
          </p>
        </div>
      </Card>

      <Card className="p-5 sm:p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Stock by vehicle</h2>
            <p className="text-sm text-slate-500 mt-1">
              Tree view: make → model totals, parts, and low-stock items.
            </p>
          </div>
          <Link
            to="/stock-tree"
            className="text-sm font-medium text-asahi hover:underline shrink-0"
          >
            Open full page →
          </Link>
        </div>
        <StockTreeView items={items} compact />
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Full inventory export</h2>
            <p className="text-sm text-slate-500 mt-1">Download the full spare parts list as PDF or CSV.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`${filterSelectClass} w-full max-w-xs`}
            >
              <option value="">All categories</option>
              {categoriesWithCount.map(({ name, count }) => (
                <option key={name} value={name}>{name} ({count})</option>
              ))}
            </select>
          </div>

          <p className="text-sm text-slate-500">
            {categoryFilter ? (
              <>Exporting <strong className="text-slate-700">{filteredItems.length}</strong> items in {categoryFilter}.</>
            ) : (
              <><strong className="text-slate-700">{items.length}</strong> items total.</>
            )}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button onClick={handlePDF} disabled={exporting || filteredItems.length === 0}>
              {exporting === 'pdf' ? 'Generating…' : 'Download PDF'}
            </Button>
            <Button variant="outline" onClick={handleCSV} disabled={exporting || filteredItems.length === 0}>
              {exporting === 'csv' ? 'Exporting…' : 'Download CSV'}
            </Button>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
