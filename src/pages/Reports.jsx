import { useState, useMemo } from 'react';
import { useItems } from '../hooks/useItems';
import { exportInventoryPDF, exportInventoryCSV } from '../services/reportService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNotification } from '../context/NotificationContext';
import {
  PageContainer,
  PageHeader,
  PageSkeleton,
  filterSelectClass,
} from '../components/ui/PageLayout';

export function Reports() {
  const { items, loading } = useItems();
  const { success, error } = useNotification();
  const [exporting, setExporting] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

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
      await exportInventoryPDF(filteredItems, categoryFilter || null);
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

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        subtitle="Export spare parts inventory as PDF or CSV"
      />

      <Card className="p-5 sm:p-6">
        <div className="space-y-5">
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
