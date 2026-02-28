import { useState, useMemo } from 'react';
import { useItems } from '../hooks/useItems';
import { exportInventoryPDF, exportInventoryCSV } from '../services/reportService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNotification } from '../context/NotificationContext';

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Spare Parts Reports</h2>

      <Card className="p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Export</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Filter by category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
          >
            <option value="">All categories</option>
            {categoriesWithCount.map(({ name, count }) => (
              <option key={name} value={name}>{count} {name}</option>
            ))}
          </select>
        </div>
        <p className="text-slate-500 text-sm mb-6">
          Download spare parts as PDF or CSV.
          {categoryFilter ? (
            <> Showing {filteredItems.length} items in <strong>{categoryFilter}</strong>.</>
          ) : (
            <> {items.length} items total.</>
          )}
        </p>
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={handlePDF}
            disabled={exporting}
          >
            {exporting === 'pdf' ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCSV}
            disabled={exporting}
          >
            {exporting === 'csv' ? 'Exporting...' : 'Download CSV'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
