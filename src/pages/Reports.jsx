import { useState } from 'react';
import { useItems } from '../hooks/useItems';
import { exportInventoryPDF, exportInventoryCSV } from '../services/reportService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNotification } from '../context/NotificationContext';

export function Reports() {
  const { items, loading } = useItems();
  const { success, error } = useNotification();
  const [exporting, setExporting] = useState(null);

  const handlePDF = async () => {
    setExporting('pdf');
    try {
      await exportInventoryPDF(items);
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
      exportInventoryCSV(items);
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
      <h2 className="text-2xl font-bold text-slate-800">Inventory Reports</h2>

      <Card className="p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Export</h3>
        <p className="text-slate-500 text-sm mb-6">
          Download your inventory as PDF or CSV. {items.length} items in inventory.
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
